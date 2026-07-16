import { useMemo, useState } from "react";
import { useApi } from "@/shared/api";
import type { Subscription } from "@/shared/api/users";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { useSRSStoreRevision } from "./SRSStoreRevisionContext";
import { useDeckSubscriptions } from "./useDeckSubscriptions";
import { buildEnrichedCourseDeck } from "./data/courseDeck";

export type ManagedDeck = {
  id: string;
  name: string;
  languageId: string;
  /** Official course-linked deck when set (lesson path SRS). */
  courseId?: string;
  cardCount: number;
  subscription: Subscription | null;
  /**
   * Client-generated course deck (curriculum atoms unlocked by lessons).
   * Not a backend deck: it has no subscription to edit and can't be
   * unsubscribed — render its subscription controls read-only.
   */
  isCourseDeck?: boolean;
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
  const { settings } = useSettings();
  const hideCourseDeck = settings.flashcards?.hideCourseDeck ?? false;
  const srsRevision = useSRSStoreRevision();

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const decks = useMemo((): ManagedDeck[] => {
    const byLang = deckResponses.filter((d) => d.languageId === languageId);
    const subByContent = new Map(subscriptions.map((s) => [s.contentId, s]));
    const rows: ManagedDeck[] = byLang.map((d) => ({
      id: d.id,
      name: d.name,
      languageId: d.languageId,
      courseId: d.courseId,
      cardCount: (d.cards ?? []).length,
      subscription: subByContent.get(d.id) ?? null,
    }));

    // Auto-subscribed course deck (unlocked cards only) — same injection as
    // the review queue (`useSubscriptionQueue`), gated by the same setting.
    // It carries a courseId so deckScope groups it under "Lesson decks".
    if (!hideCourseDeck) {
      const courseDeck = buildEnrichedCourseDeck(languageId);
      const unlockedCount = (courseDeck?.cards ?? []).filter(
        (c) => c.unlocked,
      ).length;
      if (courseDeck && unlockedCount > 0) {
        rows.unshift({
          id: courseDeck.id,
          name: courseDeck.name,
          languageId,
          courseId: courseDeck.courseId,
          cardCount: unlockedCount,
          subscription: null,
          isCourseDeck: true,
        });
      }
    }
    return rows;
    // srsRevision: newly-unlocked words re-derive the course deck count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deckResponses,
    languageId,
    subscriptions,
    hideCourseDeck,
    refreshTrigger,
    srsRevision,
  ]);

  const refresh = () => {
    setRefreshTrigger((c) => c + 1);
    invalidate();
  };

  const updateSubscription = async (
    deckId: string,
    patch: { newCardsPerDay?: number; newCardOrder?: "ordered" | "shuffled"; enabled?: boolean }
  ) => {
    // The course pseudo-deck has no backend subscription to patch.
    if (decks.some((d) => d.id === deckId && d.isCourseDeck)) return;
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
