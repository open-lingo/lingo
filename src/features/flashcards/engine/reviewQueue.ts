import type { Flashcard, SRSCardState } from "../data/types";
import { isDue, createInitialState } from "./srs";
import { getSRSStore } from "./srsStorage";

const DEFAULT_NEW_CARDS_PER_DAY = 5;

export type ReviewQueue = {
  /** Due review cards (sorted by ease for mix) */
  review: Flashcard[];
  /** New cards introduced this session */
  newCards: Flashcard[];
  /** Combined queue: reviews first, then new cards */
  queue: Flashcard[];
  dueCount: number;
  newCount: number;
  totalCount: number;
  /** Map cardId -> deck defaultEase for new cards */
  cardIdToDefaultEase?: Record<string, number>;
};

export type DeckSubscription = {
  contentId: string;
  newCardsPerDay: number;
  newCardOrder: "ordered" | "shuffled";
};

export type DeckWithCards = {
  id: string;
  cards: Flashcard[];
  defaultEase?: number;
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

  // Sort by ease for a good mix (harder and easier cards distributed)
  review.sort((a, b) => a.state.easeFactor - b.state.easeFactor);

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
 * Build a review queue from subscription-based decks.
 * - Due cards: sorted by ease for mix (default, non-changeable).
 * - New cards: per-deck limits, subscription order, ordered or shuffled per sub.
 */
export function buildQueueFromSubscriptions(
  subscriptions: DeckSubscription[],
  decks: DeckWithCards[],
  srsStore: Record<string, SRSCardState> = getSRSStore(),
): ReviewQueue {
  const decksById = new Map(decks.map((d) => [d.id, d]));
  const cardIdToDefaultEase: Record<string, number> = {};

  const due: Array<{ card: Flashcard; state: SRSCardState }> = [];
  const unseenByDeck = new Map<string, Flashcard[]>();

  for (const sub of subscriptions) {
    const deck = decksById.get(sub.contentId);
    if (!deck?.cards?.length) continue;

    const defaultEase = deck.defaultEase ?? 2.5;
    for (const card of deck.cards) {
      cardIdToDefaultEase[card.id] = defaultEase;
      const state = srsStore[card.id];
      if (!state) {
        const list = unseenByDeck.get(sub.contentId) ?? [];
        list.push(card);
        unseenByDeck.set(sub.contentId, list);
      } else if (isDue(state)) {
        due.push({ card, state });
      }
    }
  }

  // Sort due by ease for mix
  due.sort((a, b) => a.state.easeFactor - b.state.easeFactor);
  const reviewCards = due.map((r) => r.card);

  // New cards: per deck in subscription order, apply ordered/shuffled
  const newCards: Flashcard[] = [];
  for (const sub of subscriptions) {
    const unseen = unseenByDeck.get(sub.contentId) ?? [];
    if (unseen.length === 0) continue;
    let taken = unseen;
    if (sub.newCardOrder === "shuffled") {
      taken = [...unseen].sort(() => Math.random() - 0.5);
    }
    const slice = taken.slice(0, sub.newCardsPerDay);
    newCards.push(...slice);
  }

  const queue = [...reviewCards, ...newCards];

  return {
    review: reviewCards,
    newCards,
    queue,
    dueCount: reviewCards.length,
    newCount: newCards.length,
    totalCount: queue.length,
    cardIdToDefaultEase,
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
 * Pass defaultEase (e.g. deck.defaultEase) so new cards use the deck's initial ease.
 */
export function getEffectiveState(cardId: string, defaultEase?: number): SRSCardState {
  const store = getSRSStore();
  return store[cardId] ?? createInitialState(defaultEase);
}
