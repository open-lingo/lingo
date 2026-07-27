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
 * Target retention: 0.90 — the FSRS workload-optimal default (see the
 * TARGET_RETENTION note below; 2026-07-19 research). Vocab is also reviewed in
 * lessons, so per-card pressure is already high; an aggressive 0.95 target on
 * top of that just doubled review load for a few points of retention.
 *
 * No legacy SM-2 fields are written. Cards loaded from localStorage in
 * the pre-modality flat FSRS-6 shape are upgraded on read; pre-FSRS-6
 * SM-2 entries are dropped at the storage boundary.
 */

// FSRS frames desired retention as a workload↔knowledge knob: ~0.90 is
// workload-optimal for most learners, and pushing to 0.95 roughly DOUBLES
// long-run review load for a few points of retention. These atoms are also
// reviewed inside lessons (two surfaces), so per-card pressure is already
// high — 0.90 is the right default. (srs-memory-retention-research-2026-07-19.)
export const TARGET_RETENTION = 0.9;

const SCHEDULER: FSRS = fsrs({
  // Fuzz spreads due dates ±a few % so same-day siblings don't clump forever.
  enable_fuzz: true,
  request_retention: TARGET_RETENTION,
});

/**
 * Receptive-before-productive: production's first due date is staggered this
 * many days behind recognition's, so a freshly-seeded atom is drilled
 * recognition-first and production is *promoted* a few days later rather than
 * competing same-day (where recognition always won). Research: teach receptive
 * first, then promote to productive.
 */
export const PRODUCTION_STAGGER_DAYS = 3;

/**
 * A card that has lapsed (been forgotten) this many times on either modality is
 * a "leech" — usually too complex, missing context, or violating one-fact-per-
 * card. Anki's healthy range is 6–8; we tag at 8. It's a signal to REFORMULATE
 * the card (surfaced in Card Manager), and we auto-bury it briefly so it stops
 * burning daily review time.
 */
export const LEECH_LAPSE_THRESHOLD = 8;
const LEECH_BURY_DAYS = 4;

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
 * and is a reasonable cutoff under FSRS-6 with `request_retention = 0.90`.
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
  const recognition = createInitialSubState();
  const production = createInitialSubState();
  // Receptive-before-productive: hold production back a few days so recognition
  // is drilled first (see PRODUCTION_STAGGER_DAYS).
  production.dueDate = addDays(recognition.dueDate, PRODUCTION_STAGGER_DAYS);
  return { recognition, production };
}

/**
 * State for an atom scheduled by unlock (D4, scheduling-model-2026-06-15).
 * Never-reviewed (reps 0 → still `isNew`, so in-course review lessons pick it
 * up the same session) but with an explicit first-due date so it does NOT
 * surface same-day in the standalone reviewer. `createInitialState` defaults
 * dueDate to today; unlock-seeding passes next-day (or later).
 */
export function createSeededState(dueDate: string): SRSCardState {
  const recognition = createInitialSubState();
  const production = createInitialSubState();
  recognition.dueDate = dueDate;
  // Receptive-before-productive: production is promoted a few days after
  // recognition rather than surfacing same-day (see PRODUCTION_STAGGER_DAYS).
  production.dueDate = addDays(dueDate, PRODUCTION_STAGGER_DAYS);
  return { recognition, production };
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
  const prev = state[modality];
  const next = reviewSubState(prev, rating, at);
  const result: SRSCardState = {
    ...state,
    [modality]: next,
    // Why: backend LWW key — must be an ISO timestamp, set on every review.
    lastReviewedAt: at.toISOString(),
  };
  // Leech guard: the moment this modality's lapses cross the threshold, bury
  // the card for a few days so a chronically-failing card stops eating review
  // time. `isLeech` keeps flagging it for reformulation in Card Manager.
  if (next.lapses >= LEECH_LAPSE_THRESHOLD && prev.lapses < LEECH_LAPSE_THRESHOLD) {
    result.buriedUntil = addDays(at.toISOString().slice(0, 10), LEECH_BURY_DAYS);
  }
  return result;
}

/** A card that has lapsed ≥ threshold times on either modality — a chronic
 *  failure the learner should reformulate. */
export function isLeech(state: SRSCardState | undefined): boolean {
  if (!state) return false;
  return (
    state.recognition.lapses >= LEECH_LAPSE_THRESHOLD ||
    state.production.lapses >= LEECH_LAPSE_THRESHOLD
  );
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
 * FSRS default-initial difficulty (D0) under this engine's config — the
 * difficulty the scheduler assigns after a first "Good" review of an empty
 * card. DERIVED from the scheduler (not a hardcoded constant) so it tracks
 * `request_retention` / weight changes automatically, per the ts-fsrs init
 * for a first Good grade.
 *
 * Used by the external-study importer to stamp review-state seeded cards with
 * a realistic difficulty instead of the `0` that `createInitialSubState`
 * leaves on genuinely-new cards (those get their real D0 on first review).
 */
export function defaultInitialDifficulty(): number {
  const now = new Date();
  const { card } = SCHEDULER.next(createEmptyCard(now), now, Rating.Good);
  return card.difficulty;
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

/** Most recent review across modalities (for sort/display, YYYY-MM-DD). */
export function cardLastReviewDate(state: SRSCardState): string {
  return state.recognition.lastReviewDate >= state.production.lastReviewDate
    ? state.recognition.lastReviewDate
    : state.production.lastReviewDate;
}

/**
 * ISO timestamp of the most recent review across modalities. Prefers the
 * top-level ``lastReviewedAt`` (set by ``reviewCard``), falling back to the
 * later of the per-modality YYYY-MM-DD ``lastReviewDate`` strings expanded
 * to UTC midday so older states still produce a sortable ISO string for
 * the backend LWW merge.
 */
export function cardLastReviewedAt(state: SRSCardState): string {
  if (state.lastReviewedAt) return state.lastReviewedAt;
  const day = cardLastReviewDate(state);
  return `${day}T12:00:00.000Z`;
}
