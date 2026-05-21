import {
  fsrs,
  createEmptyCard,
  Rating,
  State,
  type Card as FsrsCard,
  type FSRS,
  type Grade,
} from "ts-fsrs";
import type { SRSCardState, SRSPhase, SRSRating } from "../data/types";

/**
 * FSRS-6 scheduler — wraps ts-fsrs (FSRS-6.0 algorithm, v5.4.0 package).
 *
 * The 4 rating buttons (Again/Hard/Good/Easy) are unchanged from the
 * prior SM-2 implementation. **Hard is a success**, not a failure: it
 * lets stability grow more slowly than Good rather than resetting the
 * card's progress. This is a behavior change from the SM-2 era.
 *
 * Target retention: 0.95 (95%). Tighter than the FSRS default of 0.9.
 * The justification is that Lingo exposes vocab through two surfaces
 * (lessons + flashcards) so per-card review pressure is higher.
 *
 * No legacy SM-2 fields are written. Cards loaded from localStorage in
 * the old shape are rejected at the storage boundary; see srsStorage.
 */

const TARGET_RETENTION = 0.95;

const SCHEDULER: FSRS = fsrs({
  enable_fuzz: false,
  request_retention: TARGET_RETENTION,
});

const RATING_MAP: Record<SRSRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

const STATE_TO_PHASE: Record<number, SRSPhase> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

const PHASE_TO_STATE: Record<SRSPhase, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};

/**
 * Mastery threshold (days). A card whose `interval` is at or above this
 * is considered mature and no longer in the active learning pool. 21
 * days matches the Anki / SM-2 convention and is a reasonable cutoff
 * under FSRS-6 with `request_retention = 0.95`.
 */
export const MASTERED_INTERVAL_DAYS = 21;

/** Card has been seen but interval is still below mastery threshold. */
export function isLearning(state: SRSCardState | undefined): boolean {
  if (!state) return false;
  if (state.reps === 0) return false;
  return state.interval < MASTERED_INTERVAL_DAYS;
}

/** Card has reached mature/mastered interval. */
export function isMastered(state: SRSCardState | undefined): boolean {
  if (!state) return false;
  return state.interval >= MASTERED_INTERVAL_DAYS;
}

export function isNew(state: SRSCardState | undefined): boolean {
  return state === undefined || state.reps === 0;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getToday(): string {
  return todayStr();
}

/** Build an empty FSRS-6 state for a card that's never been reviewed. */
export function createInitialState(_initialEase?: number): SRSCardState {
  // `_initialEase` is the legacy SM-2 deck setting; FSRS-6 has no ease
  // analogue. Accepted for API compatibility and ignored.
  const today = todayStr();
  return {
    stability: 0,
    difficulty: 0,
    state: "new",
    interval: 0,
    dueDate: today,
    lastReviewDate: today,
    reps: 0,
    lapses: 0,
  };
}

function toFsrsCard(state: SRSCardState, now: Date): FsrsCard {
  // ts-fsrs computes `elapsed_days` from `last_review` to `now`. We pass
  // the date at midday so timezone drift doesn't push the elapsed count
  // forward/backward by one in edge cases.
  const lastReview = new Date(state.lastReviewDate + "T12:00:00Z");
  const due = new Date(state.dueDate + "T12:00:00Z");
  const empty = createEmptyCard(now);
  return {
    ...empty,
    due,
    stability: state.stability,
    difficulty: state.difficulty,
    state: PHASE_TO_STATE[state.state],
    reps: state.reps,
    lapses: state.lapses,
    learning_steps: state.learningSteps ?? 0,
    last_review: lastReview,
  };
}

function fromFsrsCard(card: FsrsCard, now: Date): SRSCardState {
  const today = now.toISOString().slice(0, 10);
  const dueDate = card.due.toISOString().slice(0, 10);
  const interval = Math.max(
    0,
    Math.round((card.due.getTime() - now.getTime()) / 86_400_000),
  );
  const phase = STATE_TO_PHASE[card.state] ?? "review";
  const next: SRSCardState = {
    stability: card.stability,
    difficulty: card.difficulty,
    state: phase,
    interval,
    dueDate,
    lastReviewDate: today,
    reps: card.reps,
    lapses: card.lapses,
  };
  if (phase === "learning" || phase === "relearning") {
    next.learningSteps = card.learning_steps ?? 0;
  }
  return next;
}

/**
 * Apply a rating to a card and return the next FSRS-6 state.
 * Pure function; does not touch storage.
 *
 * `at` defaults to "now"; tests can pass a fixed clock.
 */
export function reviewCard(
  state: SRSCardState,
  rating: SRSRating,
  at: Date = new Date(),
): SRSCardState {
  const card = toFsrsCard(state, at);
  const result = SCHEDULER.next(card, at, RATING_MAP[rating]);
  const next = fromFsrsCard(result.card, at);
  // Preserve buriedUntil if set; reviewing doesn't unbury.
  if (state.buriedUntil) next.buriedUntil = state.buriedUntil;
  return next;
}

/**
 * 3-of-4 mapping for grading from a lesson step's binary outcome.
 *
 * - `correct === false`                           → Again
 * - `correct === true` and `retried === true`     → Hard
 * - `correct === true` and `retried === false`    → Good
 *
 * Easy is reserved for explicit reviewer-page grading where the user
 * tells us the card was trivial. Lesson steps can't infer that signal.
 */
export function gradeFromLesson(
  state: SRSCardState,
  outcome: { correct: boolean; retried?: boolean },
  at: Date = new Date(),
): SRSCardState {
  const rating: SRSRating = !outcome.correct
    ? "again"
    : outcome.retried
      ? "hard"
      : "good";
  return reviewCard(state, rating, at);
}

/**
 * After grading, should the card be re-shown later in the same session?
 * Under FSRS-6 we treat Again and Hard as "needs reinforcement now,"
 * matching the prior SM-2 contract (`quality < 4`).
 */
export function shouldRepeatInSession(rating: SRSRating): boolean {
  return rating === "again" || rating === "hard";
}

export function isDue(state: SRSCardState): boolean {
  if (state.buriedUntil && state.buriedUntil > todayStr()) return false;
  return state.dueDate <= todayStr();
}

export function isBuried(state: SRSCardState | undefined): boolean {
  if (!state?.buriedUntil) return false;
  return state.buriedUntil > todayStr();
}

export function buryCard(state: SRSCardState): SRSCardState {
  return { ...state, buriedUntil: addDays(todayStr(), 1) };
}

export function unburyCard(state: SRSCardState): SRSCardState {
  const { buriedUntil: _omit, ...rest } = state;
  return rest;
}

/**
 * Numeric quality (0-5) — retained for back-compat with consumers that
 * still expect it (e.g. UI tooltips). Mirrors the SM-2 mapping; FSRS
 * itself doesn't use this scale.
 */
const RATING_QUALITY: Record<SRSRating, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

export function getQuality(rating: SRSRating): number {
  return RATING_QUALITY[rating];
}

/** Exported for transparency / settings UI; not currently surfaced. */
export function getTargetRetention(): number {
  return TARGET_RETENTION;
}
