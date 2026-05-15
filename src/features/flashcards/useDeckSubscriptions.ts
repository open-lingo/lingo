import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import type { Subscription } from "@/shared/api/users";
import type { DeckResponse } from "@/shared/api/decks";

/**
 * Shared hook for deck subscriptions + batch deck fetch.
 * Same query keys as before so cache is shared with any hook that used this pattern.
 * Use this when you need subscriptions and deck list for a language or for SRS.
 */
export function useDeckSubscriptions(): {
  subscriptions: Subscription[];
  deckIds: string[];
  deckResponses: DeckResponse[];
  isLoading: boolean;
  isAuthenticated: boolean;
  invalidate: () => void;
} {
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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["users", "subscriptions", "deck"] });
    queryClient.invalidateQueries({ queryKey: ["decks", "batch"] });
  };

  return {
    subscriptions,
    deckIds,
    deckResponses,
    isLoading: subsLoading || decksLoading,
    isAuthenticated: !!isAuthenticated,
    invalidate,
  };
}
