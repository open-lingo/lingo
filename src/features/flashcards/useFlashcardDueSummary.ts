import { useMemo } from "react";
import {
  buildReviewQueue,
  getSRSStore,
  isLearning,
  isMastered,
  addDays,
  getToday,
} from "./engine";
import type { SRSStore } from "./engine";
import { canonicalizeCardId } from "./engine/srsStorage";
import type { SRSCardState } from "./data/types";
import { useSRSStoreRevision } from "./SRSStoreRevisionContext";
import { useSubscribedDecks } from "./useSubscribedDecks";
import type { Flashcard, FlashcardDeck } from "@/features/flashcards/data/types";
import type { DeckResponse } from "@/shared/api/decks";
import { buildEnrichedCourseDeck } from "./data/courseDeck";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { useCourseLevel } from "@/features/practice/useCourseLevel";

function deckResponseToFlashcardDeck(d: DeckResponse): FlashcardDeck {
  return {
    id: d.id,
    languageId: d.languageId,
    name: d.name,
    cards: d.cards ?? [],
    image: d.image,
    locale: d.locale,
  };
}

/**
 * Count reviews per day for the last 7 days from the SRS store.
 * Checks both recognition and production `lastReviewDate` on each card.
 * Returns an array of 7 numbers [6 days ago, 5 days ago, ..., today].
 */
function computeWeekReviews(
  srsStore: SRSStore,
  cardIds: Set<string>,
): number[] {
  const today = getToday();
  // Build lookup: day string -> index (0 = 6 days ago, 6 = today)
  const dayToIndex = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const day = addDays(today, i - 6);
    dayToIndex.set(day, i);
  }

  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const [id, state] of Object.entries(srsStore)) {
    if (!cardIds.has(id)) continue;
    // Count each modality independently — a card reviewed in both
    // directions on the same day counts as 2 reviews.
    for (const modality of ["recognition", "production"] as const) {
      const sub = state[modality];
      if (sub.reps === 0) continue; // never reviewed
      const idx = dayToIndex.get(sub.lastReviewDate);
      if (idx !== undefined) counts[idx]++;
    }
  }
  return counts;
}

/**
 * Compute retention percentage for a set of card IDs.
 * Retention = total reps / (total reps + total lapses) across all
 * modalities with reps > 0. Returns 0 when no cards have been reviewed.
 */
function computeDeckRetention(
  srsStore: SRSStore,
  cardIds: string[],
): number {
  let totalReps = 0;
  let totalLapses = 0;
  for (const id of cardIds) {
    const state: SRSCardState | undefined = srsStore[canonicalizeCardId(id)];
    if (!state) continue;
    for (const modality of ["recognition", "production"] as const) {
      const sub = state[modality];
      if (sub.reps > 0) {
        totalReps += sub.reps;
        totalLapses += sub.lapses;
      }
    }
  }
  if (totalReps === 0) return 0;
  return Math.round((totalReps / (totalReps + totalLapses)) * 100);
}

export function useFlashcardDueSummary(langId: string) {
  const { subscribedDecks, isLoading } = useSubscribedDecks();
  const srsRevision = useSRSStoreRevision();
  const { settings } = useSettings();
  // Opt-in frequency ("optional") vocab: module-gated words beyond the lessons.
  // Off (default) → the course deck is unchanged, so the backlog is unaffected.
  const freqEnabled = settings.flashcards?.frequencyVocab ?? false;
  const reachedModule = useCourseLevel();

  return useMemo(() => {
    const byLang = subscribedDecks.filter(
      ({ addon }) => addon.languageId === langId,
    );
    const allCards: Flashcard[] = [];
    for (const { deck: d } of byLang) {
      allCards.push(...(d.cards ?? []));
    }

    // Client-generated course deck (from curriculum atoms), unlocked per
    // the lesson-progress store. This is what makes flashcards actually
    // populate — the old course-deck wiring was a 5-card stub keyed off a
    // stale lesson→card map. Only unlocked cards enter the queue. Null for
    // languages without an atom catalog.
    const courseDeck = buildEnrichedCourseDeck(langId, undefined, {
      enabled: freqEnabled,
      reachedModule,
    });
    const courseUnlocked = (courseDeck?.cards ?? []).filter(
      (c) => c.unlocked,
    );
    allCards.push(...courseUnlocked);

    const {
      queue: dueQueue,
      totalCount: dueCount,
      newCount: newToday,
      unseenTotal,
      newCardsAllowed,
    } = buildReviewQueue(allCards);
    // Backlog = unlocked-but-unstudied cards waiting behind today's new-card
    // allotment. Shown to the learner so the intake throttle is visible.
    const backlogCount = Math.max(0, unseenTotal - newToday);

    // Derive card-state bucket counts from the live SRS store. The
    // store is the source of truth for per-card FSRS-6 progress; we
    // cross reference each scoped card against it so totals reflect the
    // exact decks contributing to the user's review queue.
    const srsStore = getSRSStore();
    const totalCount = allCards.length;
    let learningCount = 0;
    let masteredCount = 0;
    for (const card of allCards) {
      const state = srsStore[canonicalizeCardId(card.id)];
      if (isMastered(state)) masteredCount++;
      else if (isLearning(state)) learningCount++;
    }

    // Real review-volume sparkline: per-day counts for the last 7 days
    const allCardIds = new Set(allCards.map((c) => c.id));
    const weekReviews = computeWeekReviews(srsStore, allCardIds);

    // Per-deck retention: reps / (reps + lapses) for reviewed cards
    const deckRetentions: number[] = byLang.map(({ deck: d }) => {
      const ids = (d.cards ?? []).map((c) => c.id);
      return computeDeckRetention(srsStore, ids);
    });

    const firstDeck = byLang[0]?.deck;
    const packs = byLang.map(({ addon, deck: d }) => ({
      addon,
      deck: deckResponseToFlashcardDeck(d),
    }));
    const courseDecks = byLang.map(({ deck: d }) => ({
      id: d.id,
      name: d.name,
      cardCount: (d.cards ?? []).length,
      deck: deckResponseToFlashcardDeck(d),
    }));
    if (courseDeck && courseUnlocked.length > 0) {
      courseDecks.unshift({
        id: courseDeck.id,
        name: courseDeck.name,
        cardCount: courseUnlocked.length,
        deck: { ...courseDeck, cards: courseUnlocked },
      });
    }
    return {
      dueQueue,
      dueCount,
      newToday,
      backlogCount,
      newCardsAllowed,
      totalCount,
      learningCount,
      masteredCount,
      weekReviews,
      deckRetentions,
      deck: firstDeck ? deckResponseToFlashcardDeck(firstDeck) : null,
      courseDecks,
      communityPacksWithDecks: packs,
      isLoading,
    };
  }, [subscribedDecks, langId, srsRevision, isLoading, freqEnabled, reachedModule]);
}
