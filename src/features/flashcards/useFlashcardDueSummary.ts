import { useMemo } from "react";
import { buildReviewQueue } from "./engine";
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
      deck: firstDeck ? deckResponseToFlashcardDeck(firstDeck) : null,
      courseDecks,
      communityPacksWithDecks: packs,
      isLoading,
    };
  }, [subscribedDecks, langId, srsRevision, isLoading]);
}
