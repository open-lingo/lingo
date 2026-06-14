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
import type { DeckResponse } from "@/shared/api/decks";
import type { DeckStudyPreset } from "./deckScope";
import { deckMatchesPreset } from "./deckScope";

export type SubscriptionQueueFilter =
  | { kind: "all" }
  | { kind: "preset"; preset: Exclude<DeckStudyPreset, "all"> }
  | { kind: "deckIds"; deckIds: ReadonlySet<string> };

/** Load subscription-based queue for practice. Uses batch deck fetch. */
export function useSubscriptionQueue(
  languageId: string,
  queueVersion: number,
  filter: SubscriptionQueueFilter = { kind: "all" },
  options: { free?: boolean } = {},
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
    let responses: DeckResponse[] = deckResponses.filter((d) => d.languageId === languageId);
    if (filter.kind === "preset") {
      responses = responses.filter((d) => deckMatchesPreset(d, filter.preset));
    } else if (filter.kind === "deckIds") {
      responses = responses.filter((d) => filter.deckIds.has(d.id));
    }
    return responses.map((d) => ({
      id: d.id,
      cards: d.cards ?? [],
      defaultEase: d.defaultEase,
    }));
  }, [deckResponses, languageId, filter]);

  const activeSubs = useMemo(() => {
    const deckIdSet = new Set(decks.map((d) => d.id));
    return subscriptions.filter((s) => deckIdSet.has(s.contentId));
  }, [subscriptions, decks]);

  const free = options.free ?? false;
  const srsRevision = useSRSStoreRevision();
  const queue = useMemo((): ReviewQueue | null => {
    if (activeSubs.length === 0 || decks.length === 0) return null;
    const srsStore = getSRSStore();
    return buildQueueFromSubscriptions(activeSubs, decks, srsStore, { free });
  }, [activeSubs, decks, queueVersion, srsRevision, free]);

  return {
    queue,
    decks,
    isLoading,
    error: null,
  };
}
