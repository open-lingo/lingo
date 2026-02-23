import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import type { DeckResponse } from "@/shared/api/decks";
import type { CommunityAddon } from "@/features/community/types";

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

/** Cached subscribed decks (deck + addon pairs). Shares cache with useSubscriptionQueue, useDeckManagerData. */
export function useSubscribedDecks() {
  const { isAuthenticated } = useAuth();
  const { users, decks: decksApi } = useApi();
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ["users", "subscriptions", "deck"],
    queryFn: () => users.getSubscriptions({ contentType: "deck" }),
    enabled: isAuthenticated,
  });

  const deckIds = useMemo(
    () => subscriptions.map((s) => s.contentId),
    [subscriptions]
  );

  const { data: deckResponses = [], isLoading: decksLoading } = useQuery({
    queryKey: ["decks", "batch", deckIds],
    queryFn: () => decksApi.getDecksBatch(deckIds),
    enabled: isAuthenticated && deckIds.length > 0,
  });

  const subscribedDecks = useMemo(
    (): { deck: DeckResponse; addon: CommunityAddon }[] =>
      deckResponses.map((deck) => ({ deck, addon: deckResponseToAddon(deck) })),
    [deckResponses]
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["users", "subscriptions", "deck"] });
    queryClient.invalidateQueries({ queryKey: ["decks", "batch"] });
  };

  return {
    subscribedDecks,
    isLoading: subsLoading || decksLoading,
    invalidate,
  };
}
