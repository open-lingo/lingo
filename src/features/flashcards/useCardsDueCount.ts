import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import { countCardsDue } from "./engine";

/** Returns the number of cards due for review. Only counts from subscribed decks. Returns 0 when not authenticated or no subscriptions. */
export function useCardsDueCount(languageId: string): number {
  const { isAuthenticated } = useAuth();
  const { users, decks: decksApi } = useApi();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["users", "subscriptions", "deck"],
    queryFn: () => users.getSubscriptions({ contentType: "deck" }),
    enabled: isAuthenticated,
  });

  const deckIds = subscriptions
    .filter((s) => s.enabled !== false)
    .map((s) => s.contentId);

  const { data: deckResponses = [] } = useQuery({
    queryKey: ["decks", "batch", deckIds],
    queryFn: () => decksApi.getDecksBatch(deckIds),
    enabled: isAuthenticated && deckIds.length > 0,
  });

  const cards = deckResponses
    .filter((d) => d.languageId === languageId)
    .flatMap((d) => d.cards ?? []);

  return countCardsDue(cards);
}
