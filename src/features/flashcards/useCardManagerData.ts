import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import {
  getSRSStore,
  isDue,
  isBuried,
  setCardState,
  buryCard,
  unburyCard,
  getToday,
  addDays,
  createInitialState,
  performSync,
} from "./engine";
import { setSRSStore } from "./engine/srsStorage";
import type { Flashcard, SRSCardState } from "./data/types";

export type ManagedCard = {
  card: Flashcard;
  deckId: string;
  deckName: string;
  state: SRSCardState | undefined;
  status: "new" | "due" | "learning" | "buried";
};

/** Load all cards for Card Manager (subscribed decks + mock fallback), with SRS state. */
export function useCardManagerData(languageId: string) {
  const { isAuthenticated } = useAuth();
  const { users, decks: decksApi, srs } = useApi();

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

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { cards, decks } = useMemo(() => {
    const srsStore = getSRSStore();
    const result: ManagedCard[] = [];
    const deckList: { id: string; name: string }[] = [];

    if (isAuthenticated && deckResponses.length > 0) {
      const byLang = deckResponses.filter((d) => d.languageId === languageId);
      for (const deck of byLang) {
        deckList.push({ id: deck.id, name: deck.name });
        for (const card of deck.cards ?? []) {
          const state = srsStore[card.id];
          let status: ManagedCard["status"] = "new";
          if (state) {
            if (isBuried(state)) status = "buried";
            else if (isDue(state)) status = "due";
            else status = "learning";
          }
          result.push({
            card,
            deckId: deck.id,
            deckName: deck.name,
            state,
            status,
          });
        }
      }
    }

    return { cards: result, decks: deckList };
  }, [
    isAuthenticated,
    deckResponses,
    languageId,
    refreshTrigger,
  ]);

  const refresh = () => setRefreshTrigger((c) => c + 1);

  const updateDueDate = (cardId: string, newDueDate: string) => {
    const store = getSRSStore();
    const state = store[cardId];
    const next = state
      ? { ...state, dueDate: newDueDate, lastSyncedAt: undefined }
      : { ...createInitialState(), dueDate: newDueDate, lastSyncedAt: undefined };
    setCardState(cardId, next);
    refresh();
  };

  const handleBury = (cardId: string) => {
    const store = getSRSStore();
    const state = store[cardId];
    if (state) {
      setCardState(cardId, { ...buryCard(state), lastSyncedAt: undefined });
      refresh();
    } else {
      const tomorrow = addDays(getToday(), 1);
      setCardState(cardId, {
        easeFactor: 2.5,
        interval: 0,
        dueDate: getToday(),
        repetitions: 0,
        lastReviewDate: getToday(),
        buriedUntil: tomorrow,
      });
      refresh();
    }
  };

  const handleUnbury = (cardId: string) => {
    const store = getSRSStore();
    const state = store[cardId];
    if (state && state.buriedUntil) {
      setCardState(cardId, { ...unburyCard(state), lastSyncedAt: undefined });
      refresh();
    }
  };

  const handleReset = (cardId: string) => {
    const store = getSRSStore();
    delete store[cardId];
    setSRSStore(store);
    refresh();
  };

  const syncNow = async () => {
    if (isAuthenticated) {
      await performSync((p) => srs.sync(p));
      refresh();
    }
  };

  return {
    cards,
    decks,
    isLoading: subsLoading || decksLoading,
    refresh,
    updateDueDate,
    handleBury,
    handleUnbury,
    handleReset,
    syncNow,
    isAuthenticated,
  };
}
