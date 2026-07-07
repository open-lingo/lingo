import type { Flashcard, SRSCardState, SRSModality, SRSRating } from "../data/types";

/**
 * One-step UNDO for the flashcard reviewer.
 *
 * Pure helpers so the reversal logic (SRS state restore, session-stat
 * rollback, in-session requeue reversal) is unit-testable without mounting
 * the component. The component (`FlashcardTester`) captures a
 * {@link GradeSnapshot} on every grade and hands it back to these helpers
 * when the user undoes.
 *
 * Depth is exactly ONE: only the most recent grade can be reverted.
 */

export interface SessionStats {
  reviewed: number;
  correct: number;
}

export interface GradeSnapshot {
  /** Canonical (or raw — the setter canonicalizes) card id that was graded. */
  cardId: string;
  /**
   * Deep copy of the card's whole-card SRS state BEFORE the grade was
   * applied. Restored verbatim (never recomputed via FSRS) on undo.
   */
  prevState: SRSCardState;
  /** allCards index the graded card occupied — where it returns on undo. */
  index: number;
  /** The modality that was graded (restored so the same side is re-tested). */
  modality: SRSModality;
  /** The rating the user gave (drives stat rollback). */
  rating: SRSRating;
  /**
   * True when this grade appended the card to the in-session repeat queue
   * (`shouldRepeatInSession`). Undo must pop that re-insertion.
   */
  requeued: boolean;
}

/**
 * Roll session counters back by exactly one graded card — the inverse of the
 * forward update in `handleRate` (reviewed +1; correct +1 unless "again").
 * Clamped at 0 defensively so a stray double-undo can't go negative.
 */
export function rollbackStats(stats: SessionStats, rating: SRSRating): SessionStats {
  return {
    reviewed: Math.max(0, stats.reviewed - 1),
    correct: rating !== "again" ? Math.max(0, stats.correct - 1) : stats.correct,
  };
}

/**
 * Reverse the in-session requeue: the forward path appends the graded card to
 * the END of `repeatCards` when the rating was Again/Hard, so undo drops the
 * last element — and only when this grade actually added one. Mirrors the
 * forward `[...prev, card]` exactly in reverse.
 */
export function rollbackRepeatQueue(
  repeatCards: Flashcard[],
  requeued: boolean,
): Flashcard[] {
  if (!requeued) return repeatCards;
  return repeatCards.slice(0, -1);
}

/**
 * Build the card state to write back on undo.
 *
 * The FSRS scheduling fields (both modality sub-states, interval, dueDate,
 * reps, …) are restored VERBATIM from the pre-grade snapshot — never
 * recomputed. But the write must still win last-write-wins sync against the
 * (possibly already-synced) graded state, so it is stamped as the newest
 * local change: `lastReviewedAt` is bumped to `at` and `lastSyncedAt` is
 * dropped, which together mark the card dirty (`computeDirtyCards`) and make
 * it beat the graded server copy on the next merge (`mergeStates` LWW).
 */
export function restoreStateForUndo(
  prevState: SRSCardState,
  at: Date = new Date(),
): SRSCardState {
  const clone: SRSCardState = structuredClone(prevState);
  delete clone.lastSyncedAt;
  clone.lastReviewedAt = at.toISOString();
  return clone;
}
