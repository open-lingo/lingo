import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import { countCardsDue } from "./engine";

export type CardsDueResult = { count: number; isLoading: boolean };

/** Returns the number of cards due for review and loading state. Only counts from subscribed decks. */
export function useCardsDueCount(languageId: string): CardsDueResult {
  const { isAuthenticated } = useAuth();
  const { users, decks: decksApi } = useApi();

  const {
    data: subscriptions = [],
    isLoading: subsLoading,
  } = useQuery({
    queryKey: ["users", "subscriptions", "deck"],
    queryFn: () => users.getSubscriptions({ contentType: "deck" }),
    enabled: isAuthenticated,
  });

  const deckIds = subscriptions
    .filter((s) => s.enabled !== false)
    .map((s) => s.contentId);

  const {
    data: deckResponses = [],
    isLoading: decksLoading,
  } = useQuery({
    queryKey: ["decks", "batch", deckIds],
    queryFn: () => decksApi.getDecksBatch(deckIds),
    enabled: isAuthenticated && deckIds.length > 0,
  });

  const cards = deckResponses
    .filter((d) => d.languageId === languageId)
    .flatMap((d) => d.cards ?? []);

  const isLoading = subsLoading || (deckIds.length > 0 && decksLoading);
  const count = countCardsDue(cards);

  return { count, isLoading };
}
