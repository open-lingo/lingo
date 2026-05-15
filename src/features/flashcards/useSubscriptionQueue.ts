import { useMemo } from "react";
import {
  buildQueueFromSubscriptions,
  getSRSStore,
  type DeckSubscription,
  type DeckWithCards,
  type ReviewQueue,
} from "./engine";
import { useSRSStoreRevision } from "./SRSStoreRevisionContext";
import { useDeckSubscriptions } from "./useDeckSubscriptions";

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
  const {
    subscriptions: rawSubs,
    deckResponses,
    isLoading,
  } = useDeckSubscriptions();

  const subscriptions = useMemo((): DeckSubscription[] => {
    return rawSubs
      .filter((s) => s.enabled !== false)
      .map(
        (s): DeckSubscription => ({
          contentId: s.contentId,
          newCardsPerDay: s.newCardsPerDay ?? 5,
          newCardOrder: (s.newCardOrder as "ordered" | "shuffled") ?? "ordered",
        })
      );
  }, [rawSubs]);

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

  const srsRevision = useSRSStoreRevision();
  const queue = useMemo((): ReviewQueue | null => {
    if (activeSubs.length === 0 || decks.length === 0) return null;
    const srsStore = getSRSStore();
    return buildQueueFromSubscriptions(activeSubs, decks, srsStore);
  }, [activeSubs, decks, queueVersion, srsRevision]);

  return {
    queue,
    decks,
    isLoading,
    error: null,
  };
}
