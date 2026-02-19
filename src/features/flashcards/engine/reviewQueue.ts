import type { Flashcard, SRSCardState } from "../data/types";
import { isDue, createInitialState } from "./srs";
import { getSRSStore } from "./srsStorage";

const DEFAULT_NEW_CARDS_PER_DAY = 5;

export type ReviewQueue = {
  /** Due review cards (oldest due first) */
  review: Flashcard[];
  /** New cards introduced this session */
  newCards: Flashcard[];
  /** Combined queue: reviews first, then new cards */
  queue: Flashcard[];
  dueCount: number;
  newCount: number;
  totalCount: number;
};

/**
 * Build a review queue from a set of unlocked cards.
 *
 * 1. Cards with existing SRS state that are due today or earlier → review pile.
 * 2. Cards with no SRS state (never reviewed) → new card pile, capped per day.
 * 3. Merge: reviews first (sorted oldest-due-first), then new cards.
 */
export function buildReviewQueue(
  cards: Flashcard[],
  newCardsPerDay: number = DEFAULT_NEW_CARDS_PER_DAY,
): ReviewQueue {
  const store = getSRSStore();

  const review: Array<{ card: Flashcard; state: SRSCardState }> = [];
  const unseenCards: Flashcard[] = [];

  for (const card of cards) {
    const state = store[card.id];
    if (!state) {
      unseenCards.push(card);
    } else if (isDue(state)) {
      review.push({ card, state });
    }
  }

  review.sort((a, b) => {
    const dateCmp = a.state.dueDate.localeCompare(b.state.dueDate);
    if (dateCmp !== 0) return dateCmp;
    return a.state.easeFactor - b.state.easeFactor;
  });

  const reviewCards = review.map((r) => r.card);
  const newCards = unseenCards.slice(0, newCardsPerDay);
  const queue = [...reviewCards, ...newCards];

  return {
    review: reviewCards,
    newCards,
    queue,
    dueCount: reviewCards.length,
    newCount: newCards.length,
    totalCount: queue.length,
  };
}

/**
 * Count cards due today (for dashboard/progress display).
 * Includes both due reviews and new cards up to the daily cap.
 */
export function countCardsDue(
  cards: Flashcard[],
  newCardsPerDay: number = DEFAULT_NEW_CARDS_PER_DAY,
): number {
  const store = getSRSStore();
  let dueReviews = 0;
  let unseen = 0;

  for (const card of cards) {
    const state = store[card.id];
    if (!state) {
      unseen++;
    } else if (isDue(state)) {
      dueReviews++;
    }
  }

  return dueReviews + Math.min(unseen, newCardsPerDay);
}

/**
 * Get SRS state for a card, with a fallback initial state for new cards.
 */
export function getEffectiveState(cardId: string): SRSCardState {
  const store = getSRSStore();
  return store[cardId] ?? createInitialState();
}
