import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import type { Subscription } from "@/shared/api/users";

export type ManagedDeck = {
  id: string;
  name: string;
  languageId: string;
  cardCount: number;
  subscription: Subscription | null;
};

export function useDeckManagerData(languageId: string) {
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

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const decks = useMemo((): ManagedDeck[] => {
    const byLang = deckResponses.filter((d) => d.languageId === languageId);
    const subByContent = new Map(
      subscriptions.map((s) => [s.contentId, s])
    );
    return byLang.map((d) => ({
      id: d.id,
      name: d.name,
      languageId: d.languageId,
      cardCount: (d.cards ?? []).length,
      subscription: subByContent.get(d.id) ?? null,
    }));
  }, [deckResponses, languageId, subscriptions, refreshTrigger]);

  const refresh = () => {
    setRefreshTrigger((c) => c + 1);
    queryClient.invalidateQueries({ queryKey: ["users", "subscriptions", "deck"] });
  };

  const updateSubscription = async (
    deckId: string,
    patch: { newCardsPerDay?: number; newCardOrder?: "ordered" | "shuffled"; enabled?: boolean }
  ) => {
    await users.updateSubscription("deck", deckId, patch);
    refresh();
  };

  return {
    decks,
    isLoading: subsLoading || decksLoading,
    refresh,
    updateSubscription,
    isAuthenticated: !!isAuthenticated,
  };
}
