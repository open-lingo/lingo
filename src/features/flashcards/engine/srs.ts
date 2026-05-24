import {
  fsrs,
  createEmptyCard,
  Rating,
  State,
  type Card as FsrsCard,
  type FSRS,
  type Grade,
} from "ts-fsrs";
import type {
  SRSCardState,
  SRSModality,
  SRSModalityState,
  SRSPhase,
  SRSRating,
} from "../data/types";

/**
 * FSRS-6 scheduler — wraps ts-fsrs (FSRS-6.0 algorithm, v5.4.0 package).
 *
 * Each card carries TWO FSRS sub-states (`recognition` and `production`)
 * so direction-specific mastery advances independently. The wrapper
 * functions all take a `modality` argument identifying which sub-state to
 * update; rollup helpers (`isDue`, `isMastered`, etc.) consider both.
 *
 * The 4 rating buttons (Again/Hard/Good/Easy) are unchanged from the
 * prior SM-2 implementation. **Hard is a success**, not a failure: it
 * lets stability grow more slowly than Good rather than resetting the
 * card's progress. This is a behavior change from the SM-2 era.
 *
 * Target retention: 0.95 (95%). Tighter than the FSRS default of 0.9.
 * Justification: Lingo exposes vocab through two surfaces (lessons +
 * flashcards) so per-card review pressure is higher.
 *
 * No legacy SM-2 fields are written. Cards loaded from localStorage in
 * the pre-modality flat FSRS-6 shape are upgraded on read; pre-FSRS-6
 * SM-2 entries are dropped at the storage boundary.
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
 * Mastery threshold (days). A sub-state whose `interval` is at or above
 * this is considered mature. 21 days matches the Anki / SM-2 convention
 * and is a reasonable cutoff under FSRS-6 with `request_retention = 0.95`.
 */
export const MASTERED_INTERVAL_DAYS = 21;

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

/** Build a fresh modality sub-state for a card that's never been reviewed. */
function createInitialSubState(): SRSModalityState {
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

/** Build an empty FSRS-6 card state with both modalities zeroed. */
export function createInitialState(_initialEase?: number): SRSCardState {
  // `_initialEase` is the legacy SM-2 deck setting; FSRS-6 has no ease
  // analogue. Accepted for API compatibility and ignored.
  return {
    recognition: createInitialSubState(),
    production: createInitialSubState(),
  };
}

function toFsrsCard(sub: SRSModalityState, now: Date): FsrsCard {
  const lastReview = new Date(sub.lastReviewDate + "T12:00:00Z");
  const due = new Date(sub.dueDate + "T12:00:00Z");
  const empty = createEmptyCard(now);
  return {
    ...empty,
    due,
    stability: sub.stability,
    difficulty: sub.difficulty,
    state: PHASE_TO_STATE[sub.state],
    reps: sub.reps,
    lapses: sub.lapses,
    learning_steps: sub.learningSteps ?? 0,
    last_review: lastReview,
  };
}

function fromFsrsCard(card: FsrsCard, now: Date): SRSModalityState {
  const today = now.toISOString().slice(0, 10);
  const dueDate = card.due.toISOString().slice(0, 10);
  const interval = Math.max(
    0,
    Math.round((card.due.getTime() - now.getTime()) / 86_400_000),
  );
  const phase = STATE_TO_PHASE[card.state] ?? "review";
  const next: SRSModalityState = {
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

function reviewSubState(
  sub: SRSModalityState,
  rating: SRSRating,
  at: Date,
): SRSModalityState {
  const card = toFsrsCard(sub, at);
  const result = SCHEDULER.next(card, at, RATING_MAP[rating]);
  return fromFsrsCard(result.card, at);
}

/**
 * Apply a rating to ONE modality's sub-state and return the merged whole-card
 * state. Pure function; does not touch storage.
 *
 * `at` defaults to "now"; tests can pass a fixed clock.
 */
export function reviewCard(
  state: SRSCardState,
  modality: SRSModality,
  rating: SRSRating,
  at: Date = new Date(),
): SRSCardState {
  const next = reviewSubState(state[modality], rating, at);
  return { ...state, [modality]: next };
}

/**
 * 3-of-4 mapping for grading from a lesson step's binary outcome on a
 * specific modality.
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
  modality: SRSModality,
  outcome: { correct: boolean; retried?: boolean },
  at: Date = new Date(),
): SRSCardState {
  const rating: SRSRating = !outcome.correct
    ? "again"
    : outcome.retried
      ? "hard"
      : "good";
  return reviewCard(state, modality, rating, at);
}

/**
 * After grading, should the card be re-shown later in the same session?
 * Under FSRS-6 we treat Again and Hard as "needs reinforcement now,"
 * matching the prior SM-2 contract (`quality < 4`).
 */
export function shouldRepeatInSession(rating: SRSRating): boolean {
  return rating === "again" || rating === "hard";
}

function isSubStateDue(sub: SRSModalityState): boolean {
  return sub.dueDate <= todayStr();
}

/** True if either modality is due today and the card isn't buried. */
export function isDue(state: SRSCardState): boolean {
  if (state.buriedUntil && state.buriedUntil > todayStr()) return false;
  return isSubStateDue(state.recognition) || isSubStateDue(state.production);
}

/** Which modalities are due now (excluding buried). */
export function getDueModalities(state: SRSCardState): SRSModality[] {
  if (state.buriedUntil && state.buriedUntil > todayStr()) return [];
  const out: SRSModality[] = [];
  if (isSubStateDue(state.recognition)) out.push("recognition");
  if (isSubStateDue(state.production)) out.push("production");
  return out;
}

export function isBuried(state: SRSCardState | undefined): boolean {
  if (!state?.buriedUntil) return false;
  return state.buriedUntil > todayStr();
}

/** True when both modalities have zero reps (never graded). */
export function isNew(state: SRSCardState | undefined): boolean {
  if (!state) return true;
  return state.recognition.reps === 0 && state.production.reps === 0;
}

/** True when any modality has been graded but isn't yet mature. */
export function isLearning(state: SRSCardState | undefined): boolean {
  if (!state) return false;
  const anyGraded =
    state.recognition.reps > 0 || state.production.reps > 0;
  if (!anyGraded) return false;
  return (
    state.recognition.interval < MASTERED_INTERVAL_DAYS ||
    state.production.interval < MASTERED_INTERVAL_DAYS
  );
}

/** True when BOTH modalities have reached the mastery interval threshold. */
export function isMastered(state: SRSCardState | undefined): boolean {
  if (!state) return false;
  return (
    state.recognition.interval >= MASTERED_INTERVAL_DAYS &&
    state.production.interval >= MASTERED_INTERVAL_DAYS
  );
}

/**
 * Card-shared field — applies to both modalities. Sets buriedUntil
 * one day out so the card is hidden through tomorrow.
 */
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

/**
 * Rollup helper for sort/display surfaces that want a single difficulty
 * number per card. Returns the harder of the two modalities so cards
 * surface for review while at least one direction is still struggling.
 */
export function cardMaxDifficulty(state: SRSCardState): number {
  return Math.max(state.recognition.difficulty, state.production.difficulty);
}

/** Earliest due date across modalities (for sort/display). */
export function cardEarliestDueDate(state: SRSCardState): string {
  return state.recognition.dueDate <= state.production.dueDate
    ? state.recognition.dueDate
    : state.production.dueDate;
}

/** Most recent review across modalities (for sort/display). */
export function cardLastReviewDate(state: SRSCardState): string {
  return state.recognition.lastReviewDate >= state.production.lastReviewDate
    ? state.recognition.lastReviewDate
    : state.production.lastReviewDate;
}
