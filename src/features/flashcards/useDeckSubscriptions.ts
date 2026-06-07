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
  const { isAuthenticated, user } = useAuth();
  const { users, decks: decksApi } = useApi();
  const queryClient = useQueryClient();
  // Fix M8 — user-scoped key. Without `userId` in the cache key, signing
  // out user A and signing in B briefly surfaces A's deck list as B's
  // before refetch completes.
  const userId = user?.sub ?? "anon";

  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ["users", userId, "subscriptions", "deck"],
    queryFn: () => users.getSubscriptions({ contentType: "deck" }),
    enabled: isAuthenticated,
    // Subscriptions only change on user-triggered subscribe/unsubscribe,
    // which already invalidates this key via invalidate() / community
    // subscribe hooks. 5 min cache instead of 1 min — no perceived
    // staleness because the mutation path is the only source of change.
    staleTime: 5 * 60_000,
  });

  const deckIds = useMemo(
    () => subscriptions.map((s) => s.contentId),
    [subscriptions]
  );

  const { data: deckResponses = [], isLoading: decksLoading } = useQuery({
    queryKey: ["decks", "batch", deckIds],
    queryFn: () => decksApi.getDecksBatch(deckIds),
    enabled: isAuthenticated && deckIds.length > 0,
    // Slow: deck content + metadata change rarely (publish flow) but the
    // user's subscribed list can churn; 5 minutes is the sweet spot between
    // catching real updates and saving the FE from refetching on every nav.
    staleTime: 5 * 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["users", userId, "subscriptions", "deck"] });
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
