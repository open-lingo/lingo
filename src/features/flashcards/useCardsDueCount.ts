import { useMemo } from "react";
import { countCardsDue } from "./engine";
import { useSRSStoreRevision } from "./SRSStoreRevisionContext";
import { useDeckSubscriptions } from "./useDeckSubscriptions";
import { buildEnrichedCourseDeck } from "./data/courseDeck";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { useCourseLevel } from "@/features/practice/useCourseLevel";

export type CardsDueResult = { count: number; isLoading: boolean };

/**
 * Cards due for review: enabled subscribed decks PLUS the auto-subscribed
 * course deck (unlocked cards only, unless the user hid it). Mirrors the
 * hub/queue scope (`useSubscriptionQueue` / `useFlashcardDueSummary`) so the
 * entry-point badges (Home tile, Learn sidebar, Progress) match what a
 * review session actually contains.
 */
export function useCardsDueCount(languageId: string): CardsDueResult {
  // Re-compute when the SRS store updates (reviews, sync, new unlocks).
  const srsRevision = useSRSStoreRevision();
  const { subscriptions, deckResponses, isLoading } = useDeckSubscriptions();
  const { settings } = useSettings();
  // Opt-in frequency ("optional") vocab flows through the same unlocked-course
  // path, gated by the learner's reached module. Off (default) → no-op.
  const freqEnabled = settings.flashcards?.frequencyVocab ?? false;
  const reachedModule = useCourseLevel();

  const enabledDeckIds = useMemo(
    () =>
      new Set(
        subscriptions.filter((s) => s.enabled !== false).map((s) => s.contentId)
      ),
    [subscriptions]
  );

  const subscribedCards = useMemo(
    () =>
      deckResponses
        .filter((d) => d.languageId === languageId && enabledDeckIds.has(d.id))
        .flatMap((d) => d.cards ?? []),
    [deckResponses, languageId, enabledDeckIds]
  );

  const courseCards = useMemo(() => {
    if (settings.flashcards?.hideCourseDeck) return [];
    const courseDeck = buildEnrichedCourseDeck(languageId, undefined, {
      enabled: freqEnabled,
      reachedModule,
    });
    return (courseDeck?.cards ?? []).filter((c) => c.unlocked);
    // srsRevision: newly-unlocked words re-derive the course deck.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    languageId,
    settings.flashcards?.hideCourseDeck,
    freqEnabled,
    reachedModule,
    srsRevision,
  ]);

  const count = countCardsDue([...subscribedCards, ...courseCards]);

  return { count, isLoading };
}
