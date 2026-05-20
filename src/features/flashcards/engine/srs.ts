import type { SRSCardState, SRSRating } from "../data/types";

/**
 * SM-2 algorithm (SuperMemo 2.0) — faithful implementation.
 * Reference: https://super-memory.com/english/ol/sm2.htm
 *
 * Quality scale (0-5):
 *   again = 0  (complete blackout)
 *   hard  = 2  (incorrect; correct one seemed easy to recall)
 *   good  = 4  (correct after hesitation)
 *   easy  = 5  (perfect response)
 *
 * Intervals:
 *   I(1) = 1 day
 *   I(2) = 6 days
 *   I(n) = I(n-1) * EF   for n > 2
 *
 * EF update (only when quality >= 3):
 *   EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
 *   EF' = max(1.3, EF')
 *
 * On failure (quality < 3):
 *   Reset repetitions to 0, keep EF unchanged.
 */

const RATING_QUALITY: Record<SRSRating, number> = {
  again: 0,
  hard: 2,
  good: 4,
  easy: 5,
};

export const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

/**
 * Interval (in days) at which a card is considered "mastered" / mature.
 * Cards with interval >= this value have been retained across a meaningful
 * gap and are no longer in the active learning pool. This is the same
 * threshold Anki uses for "mature" cards in its scheduler — SM-2 itself
 * does not define a label, but 21 days is the de-facto convention.
 */
export const MASTERED_INTERVAL_DAYS = 21;

/** Card has been seen but interval is still below mastery threshold. */
export function isLearning(state: SRSCardState | undefined): boolean {
  if (!state) return false;
  if (state.repetitions === 0) return false;
  return state.interval < MASTERED_INTERVAL_DAYS;
}

/** Card has reached mature/mastered interval. */
export function isMastered(state: SRSCardState | undefined): boolean {
  if (!state) return false;
  return state.interval >= MASTERED_INTERVAL_DAYS;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Initial state for a new card. Use deck.defaultEase when available (SM-2 initial ease). */
export function createInitialState(initialEase?: number): SRSCardState {
  const ease = initialEase != null
    ? Math.max(MIN_EASE, Math.min(3, initialEase))
    : DEFAULT_EASE;
  return {
    easeFactor: ease,
    interval: 0,
    dueDate: todayStr(),
    repetitions: 0,
    lastReviewDate: todayStr(),
  };
}

export function reviewCard(state: SRSCardState, rating: SRSRating): SRSCardState {
  const quality = RATING_QUALITY[rating];
  const today = todayStr();

  let { easeFactor, interval, repetitions } = state;

  if (quality < 3) {
    // SM-2 step 6: start repetitions from beginning WITHOUT changing EF
    repetitions = 0;
    interval = 0;
  } else {
    // SM-2 step 5: update EF only on successful recall (quality >= 3)
    const newEase = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(MIN_EASE, newEase);

    // SM-2 step 3: calculate interval
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.ceil(interval * easeFactor);
    }
  }

  const dueDate = interval === 0 ? today : addDays(today, interval);

  return {
    easeFactor,
    interval,
    dueDate,
    repetitions,
    lastReviewDate: today,
  };
}

/**
 * SM-2 step 7: did the card score below 4? If so it should be
 * re-shown at the end of the current session before finishing.
 */
export function shouldRepeatInSession(rating: SRSRating): boolean {
  return RATING_QUALITY[rating] < 4;
}

export function isDue(state: SRSCardState): boolean {
  if (state.buriedUntil && state.buriedUntil > todayStr()) return false;
  return state.dueDate <= todayStr();
}

/** Card is buried (excluded from queue until buriedUntil date). */
export function isBuried(state: SRSCardState | undefined): boolean {
  if (!state?.buriedUntil) return false;
  return state.buriedUntil > todayStr();
}

/** Bury card until end of tomorrow. */
export function buryCard(state: SRSCardState): SRSCardState {
  const tomorrow = addDays(todayStr(), 1);
  return { ...state, buriedUntil: tomorrow };
}

/** Unbury: clear buriedUntil. */
export function unburyCard(state: SRSCardState): SRSCardState {
  const { buriedUntil: _, ...rest } = state;
  return { ...rest, buriedUntil: undefined };
}

export function isNew(state: SRSCardState | undefined): boolean {
  return state === undefined || state.repetitions === 0;
}

export function getToday(): string {
  return todayStr();
}

export function getQuality(rating: SRSRating): number {
  return RATING_QUALITY[rating];
}
