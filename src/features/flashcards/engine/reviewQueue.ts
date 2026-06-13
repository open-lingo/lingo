import type { Flashcard, SRSCardState } from "../data/types";
import { isDue, createInitialState, cardMaxDifficulty } from "./srs";
import { getSRSStore, canonicalize } from "./srsStorage";

const DEFAULT_NEW_CARDS_PER_DAY = 5;

/** Adaptive new-card intake (retention Phase 2, Spencer D7). Lessons unlock
 *  ~4-8 atoms/day; a fixed 5/day intake lets the backlog grow unbounded. So
 *  scale intake to drain the backlog over ~3 weeks, floored at the base and
 *  capped so we never flood the learner (CLT — don't dump 200 new cards).
 *  Backlog-based (not timestamped unlock-rate): a growing backlog *is* the
 *  signal that unlock outran intake, so this self-corrects. */
const ADAPTIVE_DRAIN_DAYS = 21;
const ADAPTIVE_MAX_NEW_CARDS = 15;

export function adaptiveNewCardsPerDay(
  backlog: number,
  base: number = DEFAULT_NEW_CARDS_PER_DAY,
  max: number = ADAPTIVE_MAX_NEW_CARDS,
): number {
  if (backlog <= 0) return base;
  return Math.min(max, Math.max(base, Math.ceil(backlog / ADAPTIVE_DRAIN_DAYS)));
}

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
  /** All unlocked-but-never-studied cards (pre-cap). `unseenTotal - newCount`
   *  is the throttled backlog waiting behind today's new-card allotment —
   *  surfaced to the learner so the intake throttle is visible, not silent. */
  unseenTotal: number;
  /** The effective new-card cap applied (adaptive unless explicitly passed) —
   *  so the UI can show the real "N/day" instead of a hardcoded number. */
  newCardsAllowed: number;
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
  newCardsPerDay?: number,
): ReviewQueue {
  const store = getSRSStore();

  const review: Array<{ card: Flashcard; state: SRSCardState }> = [];
  const unseenCards: Flashcard[] = [];

  for (const card of cards) {
    const state = store[canonicalize(card.id)];
    if (!state) {
      unseenCards.push(card);
    } else if (isDue(state)) {
      review.push({ card, state });
    }
  }

  // Adaptive intake when no explicit cap is passed (course-deck path);
  // explicit caps (subscription decks) are respected as-is.
  const cap = newCardsPerDay ?? adaptiveNewCardsPerDay(unseenCards.length);

  // Sort by FSRS difficulty descending (harder cards first while user is
  // fresh; easier cards trail). Matches the prior SM-2 "ease ascending"
  // intent — under FSRS, higher difficulty = harder card. With the
  // modality split we use the max of the two directions so a card
  // surfaces as long as either direction is hard.
  review.sort((a, b) => cardMaxDifficulty(b.state) - cardMaxDifficulty(a.state));

  const reviewCards = review.map((r) => r.card);
  const newCards = unseenCards.slice(0, cap);
  const queue = [...reviewCards, ...newCards];

  return {
    review: reviewCards,
    newCards,
    queue,
    dueCount: reviewCards.length,
    newCount: newCards.length,
    totalCount: queue.length,
    unseenTotal: unseenCards.length,
    newCardsAllowed: cap,
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
      const state = srsStore[canonicalize(card.id)];
      if (!state) {
        const list = unseenByDeck.get(sub.contentId) ?? [];
        list.push(card);
        unseenByDeck.set(sub.contentId, list);
      } else if (isDue(state)) {
        due.push({ card, state });
      }
    }
  }

  // Sort due by FSRS difficulty descending (harder cards first; see
  // identical comment in buildReviewQueue).
  due.sort((a, b) => cardMaxDifficulty(b.state) - cardMaxDifficulty(a.state));
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

  let unseenTotal = 0;
  for (const list of unseenByDeck.values()) unseenTotal += list.length;

  return {
    review: reviewCards,
    newCards,
    queue,
    dueCount: reviewCards.length,
    newCount: newCards.length,
    totalCount: queue.length,
    unseenTotal,
    // Subscriptions use per-deck caps; report how many were actually admitted.
    newCardsAllowed: newCards.length,
    cardIdToDefaultEase,
  };
}

/**
 * Count cards due today (for dashboard/progress display).
 * Includes both due reviews and new cards up to the daily cap.
 */
export function countCardsDue(
  cards: Flashcard[],
  newCardsPerDay?: number,
): number {
  const store = getSRSStore();
  let dueReviews = 0;
  let unseen = 0;

  for (const card of cards) {
    const state = store[canonicalize(card.id)];
    if (!state) {
      unseen++;
    } else if (isDue(state)) {
      dueReviews++;
    }
  }

  const cap = newCardsPerDay ?? adaptiveNewCardsPerDay(unseen);
  return dueReviews + Math.min(unseen, cap);
}

/**
 * Get SRS state for a card, with a fallback initial state for new cards.
 * Pass defaultEase (e.g. deck.defaultEase) so new cards use the deck's initial ease.
 */
export function getEffectiveState(cardId: string, defaultEase?: number): SRSCardState {
  const store = getSRSStore();
  return store[canonicalize(cardId)] ?? createInitialState(defaultEase);
}
