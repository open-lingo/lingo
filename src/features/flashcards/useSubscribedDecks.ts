import { useMemo } from "react";
import type { DeckResponse } from "@/shared/api/decks";
import type { CommunityAddon } from "@/features/community/types";
import { useDeckSubscriptions } from "./useDeckSubscriptions";

function deckResponseToAddon(d: DeckResponse): CommunityAddon {
  return {
    id: d.id,
    kind: "flashcard-pack",
    languageId: d.languageId,
    name: d.name,
    description: d.description ?? "",
    maintainerIds: [],
    upvoteCount: 0,
    updatedAt: d.updatedAt ?? d.createdAt ?? "",
    itemCount: d.cardCount,
    deckId: d.id,
    image: d.image,
  };
}

/** Cached subscribed decks (deck + addon pairs). Shares cache with useDeckSubscriptions. */
export function useSubscribedDecks() {
  const { deckResponses, isLoading, invalidate } = useDeckSubscriptions();

  const subscribedDecks = useMemo(
    (): { deck: DeckResponse; addon: CommunityAddon }[] =>
      deckResponses.map((deck) => ({ deck, addon: deckResponseToAddon(deck) })),
    [deckResponses]
  );

  return {
    subscribedDecks,
    isLoading,
    invalidate,
  };
}
