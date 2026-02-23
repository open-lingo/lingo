import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import type { Subscription } from "@/shared/api/users";

/** Cached deck subscriptions. Shares cache with useSubscribedDecks, useDeckManagerData, etc. */
export function useSubscriptions() {
  const { isAuthenticated } = useAuth();
  const { users } = useApi();
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["users", "subscriptions", "deck"],
    queryFn: () => users.getSubscriptions({ contentType: "deck" }),
    enabled: isAuthenticated,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["users", "subscriptions", "deck"] });
    queryClient.invalidateQueries({ queryKey: ["decks", "batch"] });
  };

  return {
    subscriptions: subscriptions as Subscription[],
    isLoading,
    invalidate,
  };
}
