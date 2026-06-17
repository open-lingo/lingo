/**
 * Pure transforms for the Journey → Practice tab (flashcard / SRS deep stats).
 *
 * Real data: card-state counts derived from the stored FSRS-6 SRS states
 * (`getSRSStore`) measured against the full course deck total. Everything that
 * the engine doesn't retain (rating history, true retention %) is MOCKED here,
 * in ONE place, clearly marked, and shaped so a real source can drop in without
 * touching the UI. See `PracticeStatsPanel.tsx` for the wiring.
 */
import type { SRSCardState } from "@/features/flashcards/data/types";
import { isNew, isLearning, isMastered } from "@/features/flashcards/engine";

/** A card's coarse learning state for the Practice tab breakdown. */
export type CardStateBucket = "new" | "learning" | "review" | "yetToLearn";

export type CardStateCounts = {
  /** Seen at least once, both modalities still un-graded (state === new). */
  new: number;
  /** Graded but not yet mature in at least one modality. */
  learning: number;
  /** Both modalities mature (mastered/maturing). */
  review: number;
  /** In the deck but no SRS state yet — never surfaced to the learner. */
  yetToLearn: number;
  /** Total cards in the course deck. */
  total: number;
  /** Cards with any stored SRS state (new + learning + review). */
  seen: number;
};

/**
 * Bucket the full course deck against stored SRS state. REAL: the deck total
 * comes from the curriculum deck; the per-card state comes from the FSRS-6
 * store. A deck card with no entry in `store` is "yet to learn".
 *
 * `cardIds` are the canonical deck card ids (`ja:biiru`). `store` is keyed the
 * same way (see `srsStorage.canonicalize`).
 */
export function countCardStates(
  cardIds: readonly string[],
  store: Readonly<Record<string, SRSCardState>>,
): CardStateCounts {
  let nNew = 0;
  let nLearning = 0;
  let nReview = 0;
  let nYetToLearn = 0;
  for (const id of cardIds) {
    const state = store[id];
    if (!state) {
      nYetToLearn++;
      continue;
    }
    if (isMastered(state)) nReview++;
    else if (isLearning(state)) nLearning++;
    else if (isNew(state)) nNew++;
    // Defensive: a state that's somehow none of the above (shouldn't happen)
    // is counted as learning so it never silently vanishes from the total.
    else nLearning++;
  }
  const total = cardIds.length;
  return {
    new: nNew,
    learning: nLearning,
    review: nReview,
    yetToLearn: nYetToLearn,
    total,
    seen: nNew + nLearning + nReview,
  };
}

/** Rating distribution over a review window (counts per FSRS rating). */
export type RatingDistribution = {
  again: number;
  hard: number;
  good: number;
  easy: number;
};

/**
 * MOCK — the FSRS engine stores current card state but does NOT retain a log
 * of individual rating events, so a real rating histogram isn't derivable yet.
 * This returns a plausible, slightly-good-skewed distribution scaled by how
 * many reviews the learner has done (`reviewVolume`). Swap for a real
 * rating-history endpoint / event aggregate when one lands.
 *
 * Centralized here so the UI imports a single named mock; the `isMock` flag is
 * surfaced in the panel so it's obvious in the product.
 */
export function mockRatingDistribution(reviewVolume: number): RatingDistribution {
  const v = Math.max(0, reviewVolume);
  // Healthy-learner shape: most reviews land Good, a solid Easy tail, modest
  // Hard, small Again. Ratios sum to 1.
  return {
    again: Math.round(v * 0.08),
    hard: Math.round(v * 0.17),
    good: Math.round(v * 0.5),
    easy: Math.round(v * 0.25),
  };
}

/**
 * MOCK — true retention (recall accuracy on due reviews) isn't tracked by the
 * client engine. Return a believable ~90% (FSRS target retention is 0.95, real
 * recall typically sits a touch below). Structured as a function so a real
 * value can drop in unchanged.
 */
export function mockRetentionPercent(): number {
  return 90;
}

/** True when the value above came from a mock (for "estimated" UI labels). */
export const RETENTION_IS_MOCK = true;
export const RATING_DISTRIBUTION_IS_MOCK = true;
