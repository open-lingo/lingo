import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import {
  buildQueueFromSubscriptions,
  getSRSStore,
  type DeckSubscription,
  type DeckWithCards,
  type ReviewQueue,
} from "./engine";

/** Load subscription-based queue for practice. Uses batch deck fetch. */
export function useSubscriptionQueue(
  languageId: string,
  queueVersion: number
): {
  queue: ReviewQueue | null;
  decks: DeckWithCards[];
  isLoading: boolean;
  error: Error | null;
} {
  const { isAuthenticated } = useAuth();
  const { users, decks: decksApi } = useApi();

  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ["users", "subscriptions", "deck"],
    queryFn: () => users.getSubscriptions({ contentType: "deck" }),
    enabled: isAuthenticated,
    select: (list) =>
      list
        .filter((s) => s.enabled !== false)
        .map(
          (s): DeckSubscription => ({
            contentId: s.contentId,
            newCardsPerDay: s.newCardsPerDay ?? 5,
            newCardOrder: (s.newCardOrder as "ordered" | "shuffled") ?? "ordered",
          })
        ),
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

  const decks = useMemo((): DeckWithCards[] => {
    return deckResponses
      .filter((d) => d.languageId === languageId)
      .map((d) => ({
        id: d.id,
        cards: d.cards ?? [],
        defaultEase: d.defaultEase,
      }));
  }, [deckResponses, languageId]);

  const activeSubs = useMemo(() => {
    const deckIdSet = new Set(decks.map((d) => d.id));
    return subscriptions.filter((s) => deckIdSet.has(s.contentId));
  }, [subscriptions, decks]);

  const queue = useMemo((): ReviewQueue | null => {
    if (activeSubs.length === 0 || decks.length === 0) return null;
    const srsStore = getSRSStore();
    return buildQueueFromSubscriptions(activeSubs, decks, srsStore);
  }, [activeSubs, decks, queueVersion]);

  return {
    queue,
    decks,
    isLoading: subsLoading || decksLoading,
    error: null,
  };
}
