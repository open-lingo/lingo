import { useMemo } from "react";
import { countCardsDue } from "./engine";
import { useSRSStoreRevision } from "./SRSStoreRevisionContext";
import { useDeckSubscriptions } from "./useDeckSubscriptions";

export type CardsDueResult = { count: number; isLoading: boolean };

/** Returns the number of cards due for review and loading state. Only counts from enabled subscribed decks. */
export function useCardsDueCount(languageId: string): CardsDueResult {
  useSRSStoreRevision(); // Re-compute count when SRS store updates (e.g. after sync)
  const { subscriptions, deckResponses, isLoading } = useDeckSubscriptions();

  const enabledDeckIds = useMemo(
    () =>
      new Set(
        subscriptions.filter((s) => s.enabled !== false).map((s) => s.contentId)
      ),
    [subscriptions]
  );

  const cards = useMemo(
    () =>
      deckResponses
        .filter((d) => d.languageId === languageId && enabledDeckIds.has(d.id))
        .flatMap((d) => d.cards ?? []),
    [deckResponses, languageId, enabledDeckIds]
  );

  const count = countCardsDue(cards);

  return { count, isLoading };
}
