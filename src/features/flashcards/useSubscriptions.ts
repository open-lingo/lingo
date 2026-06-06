import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import type { Subscription } from "@/shared/api/users";

/** Cached deck subscriptions. Shares cache with useSubscribedDecks, useDeckManagerData, etc. */
export function useSubscriptions() {
  const { isAuthenticated, user } = useAuth();
  const { users } = useApi();
  const queryClient = useQueryClient();
  // Fix M8 — user-scoped cache key; see useDeckSubscriptions for context.
  const userId = user?.sub ?? "anon";

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["users", userId, "subscriptions", "deck"],
    queryFn: () => users.getSubscriptions({ contentType: "deck" }),
    enabled: isAuthenticated,
    // Live: same cadence as useDeckSubscriptions — subscriptions change on
    // every toggle so a tight window keeps the UI in sync without churn.
    staleTime: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["users", userId, "subscriptions", "deck"] });
    queryClient.invalidateQueries({ queryKey: ["decks", "batch"] });
  };

  return {
    subscriptions: subscriptions as Subscription[],
    isLoading,
    invalidate,
  };
}
