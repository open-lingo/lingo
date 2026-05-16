import { useMemo, useState } from "react";
import { useApi } from "@/shared/api";
import type { Subscription } from "@/shared/api/users";
import { useDeckSubscriptions } from "./useDeckSubscriptions";

export type ManagedDeck = {
  id: string;
  name: string;
  languageId: string;
  /** Official course-linked deck when set (lesson path SRS). */
  courseId?: string;
  cardCount: number;
  subscription: Subscription | null;
};

export function useDeckManagerData(languageId: string) {
  const { users } = useApi();
  const {
    subscriptions,
    deckResponses,
    isLoading,
    isAuthenticated,
    invalidate,
  } = useDeckSubscriptions();

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const decks = useMemo((): ManagedDeck[] => {
    const byLang = deckResponses.filter((d) => d.languageId === languageId);
    const subByContent = new Map(subscriptions.map((s) => [s.contentId, s]));
    return byLang.map((d) => ({
      id: d.id,
      name: d.name,
      languageId: d.languageId,
      courseId: d.courseId,
      cardCount: (d.cards ?? []).length,
      subscription: subByContent.get(d.id) ?? null,
    }));
  }, [deckResponses, languageId, subscriptions, refreshTrigger]);

  const refresh = () => {
    setRefreshTrigger((c) => c + 1);
    invalidate();
  };

  const updateSubscription = async (
    deckId: string,
    patch: { newCardsPerDay?: number; newCardOrder?: "ordered" | "shuffled"; enabled?: boolean }
  ) => {
    await users.updateSubscription("deck", deckId, patch);
    refresh();
  };

  return {
    decks,
    isLoading,
    refresh,
    updateSubscription,
    isAuthenticated: !!isAuthenticated,
  };
}
