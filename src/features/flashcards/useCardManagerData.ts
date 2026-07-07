import { useMemo, useState } from "react";
import { useApi } from "@/shared/api";
import {
  getSRSStore,
  getCardState,
  isDue,
  isBuried,
  setCardState,
  buryCard,
  unburyCard,
  getToday,
  addDays,
  createInitialState,
  performSync,
  performGrammarSync,
} from "./engine";
import { canonicalizeCardId } from "./engine/srsStorage";
import { useSRSStoreRevision } from "./SRSStoreRevisionContext";
import { notifySRSStoreChanged } from "./SRSStoreRevisionContext";
import { useDeckSubscriptions } from "./useDeckSubscriptions";
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
  const { srs } = useApi();
  const { deckResponses, isLoading, isAuthenticated } = useDeckSubscriptions();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const srsRevision = useSRSStoreRevision();

  const { cards, decks } = useMemo(() => {
    const srsStore = getSRSStore();
    const result: ManagedCard[] = [];
    const deckList: { id: string; name: string }[] = [];

    if (isAuthenticated && deckResponses.length > 0) {
      const byLang = deckResponses.filter((d) => d.languageId === languageId);
      for (const deck of byLang) {
        deckList.push({ id: deck.id, name: deck.name });
        for (const card of deck.cards ?? []) {
          // canonicalize: deck `card.id` is bare, store keys are `ja:<bare>`.
          const state = srsStore[canonicalizeCardId(card.id)];
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
    srsRevision,
  ]);

  const refresh = () => setRefreshTrigger((c) => c + 1);

  const updateDueDate = (cardId: string, newDueDate: string) => {
    // Convenience setter that writes the same date to both sub-states.
    // Per-modality editing is exposed via updateModalityDates below.
    const base = getCardState(cardId) ?? createInitialState();
    const next = {
      ...base,
      recognition: { ...base.recognition, dueDate: newDueDate },
      production: { ...base.production, dueDate: newDueDate },
      lastSyncedAt: undefined,
    };
    setCardState(cardId, next);
    notifySRSStoreChanged();
    refresh();
  };

  const updateModalityDates = (
    cardId: string,
    dates: Partial<{
      recognitionDue: string;
      recognitionLastReview: string;
      productionDue: string;
      productionLastReview: string;
    }>,
  ) => {
    const base = getCardState(cardId) ?? createInitialState();
    const next = {
      ...base,
      recognition: {
        ...base.recognition,
        ...(dates.recognitionDue ? { dueDate: dates.recognitionDue } : {}),
        ...(dates.recognitionLastReview
          ? { lastReviewDate: dates.recognitionLastReview }
          : {}),
      },
      production: {
        ...base.production,
        ...(dates.productionDue ? { dueDate: dates.productionDue } : {}),
        ...(dates.productionLastReview
          ? { lastReviewDate: dates.productionLastReview }
          : {}),
      },
      lastSyncedAt: undefined,
    };
    setCardState(cardId, next);
    notifySRSStoreChanged();
    refresh();
  };

  const handleBury = (cardId: string) => {
    const state = getCardState(cardId);
    if (state) {
      setCardState(cardId, { ...buryCard(state), lastSyncedAt: undefined });
      notifySRSStoreChanged();
      refresh();
    } else {
      const tomorrow = addDays(getToday(), 1);
      setCardState(cardId, {
        ...createInitialState(),
        buriedUntil: tomorrow,
      });
      notifySRSStoreChanged();
      refresh();
    }
  };

  const handleUnbury = (cardId: string) => {
    const state = getCardState(cardId);
    if (state && state.buriedUntil) {
      setCardState(cardId, { ...unburyCard(state), lastSyncedAt: undefined });
      notifySRSStoreChanged();
      refresh();
    }
  };

  const handleReset = (cardId: string) => {
    setCardState(cardId, {
      ...createInitialState(),
      lastSyncedAt: undefined,
      // Why: marks this as a DELIBERATE reset so srsSync's reset-preservation
      // rule can tell it apart from a merely-never-reviewed seeded card.
      manualResetAt: new Date().toISOString(),
    });
    notifySRSStoreChanged();
    refresh();
  };

  const syncNow = async () => {
    if (isAuthenticated) {
      // Same cadence for both tracks — grammar rides the same endpoint
      // (see grammarSync.ts).
      await performSync((p) => srs.sync(p));
      await performGrammarSync((p) => srs.sync(p));
      refresh();
    }
  };

  return {
    cards,
    decks,
    isLoading,
    refresh,
    updateDueDate,
    updateModalityDates,
    handleBury,
    handleUnbury,
    handleReset,
    syncNow,
    isAuthenticated,
  };
}
