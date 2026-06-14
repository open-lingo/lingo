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
import { useSettings } from "@/shared/contexts/SettingsContext";
import { buildEnrichedJaCourseDeck } from "./data/courseDeck";
import type { DeckResponse } from "@/shared/api/decks";
import type { DeckStudyPreset } from "./deckScope";
import { deckMatchesPreset } from "./deckScope";

export type SubscriptionQueueFilter =
  | { kind: "all" }
  | { kind: "preset"; preset: Exclude<DeckStudyPreset, "all"> }
  | { kind: "deckIds"; deckIds: ReadonlySet<string> };

/**
 * The client-generated course deck (curriculum atoms, unlocked per lesson
 * progress) is "subscribed by default": it isn't a backend deck, so it never
 * arrives through `useDeckSubscriptions`. We inject it into the reviewer
 * queue here so a learner can review the words their lessons unlock without
 * subscribing to anything. Super-users can hide it
 * (`settings.flashcards.hideCourseDeck`) and bring their own decks. The
 * course deck carries a `courseId`, so `deckScope` treats it as a *lesson*
 * deck — it participates in the "all" and "lessons" scopes, not "vocab".
 */
const JA_COURSE_DECK_ID = "ja-course";

/** Whether the auto course deck should appear under the active review scope. */
export function courseDeckPassesFilter(filter: SubscriptionQueueFilter): boolean {
  if (filter.kind === "all") return true;
  if (filter.kind === "preset") return filter.preset === "lessons";
  return filter.deckIds.has(JA_COURSE_DECK_ID);
}

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
  const { settings } = useSettings();
  const srsRevision = useSRSStoreRevision();

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

  const backendDecks = useMemo((): DeckWithCards[] => {
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

  // Inject the auto-subscribed course deck (unlocked cards only) unless the
  // user has hidden it. It uses the adaptive new-card cap (backlog-draining)
  // rather than a fixed per-deck count, matching the hub's intake throttle.
  // `srsRevision` is a dependency so newly-unlocked words and freshly-reviewed
  // cards re-flow into the queue.
  const courseInjection = useMemo((): {
    deck: DeckWithCards;
    sub: DeckSubscription;
  } | null => {
    if (languageId !== "ja") return null;
    if (settings.flashcards?.hideCourseDeck) return null;
    if (!courseDeckPassesFilter(filter)) return null;
    const courseDeck = buildEnrichedJaCourseDeck();
    const unlocked = (courseDeck.cards ?? []).filter((c) => c.unlocked);
    if (unlocked.length === 0) return null;
    return {
      deck: {
        id: courseDeck.id,
        cards: unlocked,
        defaultEase: courseDeck.defaultEase,
      },
      sub: {
        contentId: courseDeck.id,
        // D5 (srs-scheduling-model-2026-06-15): default to NO intake cap —
        // every unlocked word is reviewable; lesson pace is the throttle.
        // Optional user cap via settings.flashcards.maxNewCardsPerDay.
        newCardsPerDay:
          settings.flashcards?.maxNewCardsPerDay ?? unlocked.length,
        newCardOrder: "ordered",
      },
    };
  }, [languageId, settings.flashcards?.hideCourseDeck, filter, srsRevision]);

  const decks = useMemo(
    (): DeckWithCards[] =>
      courseInjection ? [...backendDecks, courseInjection.deck] : backendDecks,
    [backendDecks, courseInjection]
  );

  const allSubs = useMemo(
    (): DeckSubscription[] =>
      courseInjection ? [...subscriptions, courseInjection.sub] : subscriptions,
    [subscriptions, courseInjection]
  );

  const activeSubs = useMemo(() => {
    const deckIdSet = new Set(decks.map((d) => d.id));
    return allSubs.filter((s) => deckIdSet.has(s.contentId));
  }, [allSubs, decks]);

  const free = options.free ?? false;
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
