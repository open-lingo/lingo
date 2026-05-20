import { useMemo } from "react";
import {
  buildReviewQueue,
  getSRSStore,
  isLearning,
  isMastered,
} from "./engine";
import { useSRSStoreRevision } from "./SRSStoreRevisionContext";
import { useSubscribedDecks } from "./useSubscribedDecks";
import type { Flashcard, FlashcardDeck } from "@/features/flashcards/data/types";
import type { DeckResponse } from "@/shared/api/decks";

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

export function useFlashcardDueSummary(langId: string) {
  const { subscribedDecks, isLoading } = useSubscribedDecks();
  const srsRevision = useSRSStoreRevision();

  return useMemo(() => {
    const byLang = subscribedDecks.filter(
      ({ addon }) => addon.languageId === langId,
    );
    const allCards: Flashcard[] = [];
    for (const { deck: d } of byLang) {
      allCards.push(...(d.cards ?? []));
    }
    const { queue: dueQueue, totalCount: dueCount } = buildReviewQueue(allCards);

    // Derive card-state bucket counts from the live SRS store. The
    // store is the source of truth for per-card SM-2 progress; we cross
    // reference each scoped card against it so totals reflect the
    // exact decks contributing to the user's review queue.
    const srsStore = getSRSStore();
    const totalCount = allCards.length;
    let learningCount = 0;
    let masteredCount = 0;
    for (const card of allCards) {
      const state = srsStore[card.id];
      if (isMastered(state)) masteredCount++;
      else if (isLearning(state)) learningCount++;
    }

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
    return {
      dueQueue,
      dueCount,
      totalCount,
      learningCount,
      masteredCount,
      deck: firstDeck ? deckResponseToFlashcardDeck(firstDeck) : null,
      courseDecks,
      communityPacksWithDecks: packs,
      isLoading,
    };
  }, [subscribedDecks, langId, srsRevision, isLoading]);
}
