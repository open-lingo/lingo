import { describe, expect, it } from "vitest";
import { courseDeckIdFor, courseDeckPassesFilter } from "./useSubscriptionQueue";
import {
  buildEnrichedCourseDeck,
  buildEnrichedJaCourseDeck,
} from "./data/courseDeck";
import {
  buildQueueFromSubscriptions,
  type DeckSubscription,
  type SRSStore,
} from "./engine";
import { adaptiveNewCardsPerDay } from "./engine/reviewQueue";
import {
  JA_COURSE_ATOMS,
  canonicalAtomId,
  isSrsEligibleAtom,
} from "@/features/languages/ja/courseAtoms";

/**
 * Phase 1 of the SRS unification: the client-generated course deck is
 * "subscribed by default" and injected into the reviewer queue. These guard
 * that (a) it participates in the right review scopes, and (b) a learner's
 * unlocked words actually become playable cards — the whole point, since
 * the reviewer previously only played backend subscription decks.
 */
describe("course deck scope filter", () => {
  const jaCourse = courseDeckIdFor("ja");

  it("derives the course deck id from the language", () => {
    expect(courseDeckIdFor("ja")).toBe("ja-course");
    expect(courseDeckIdFor("es")).toBe("es-course");
  });

  it("appears in 'all' and 'lessons' scopes, not 'vocab'", () => {
    expect(courseDeckPassesFilter({ kind: "all" }, jaCourse)).toBe(true);
    expect(
      courseDeckPassesFilter({ kind: "preset", preset: "lessons" }, jaCourse),
    ).toBe(true);
    expect(
      courseDeckPassesFilter({ kind: "preset", preset: "vocab" }, jaCourse),
    ).toBe(false);
  });

  it("appears under a deckIds scope only when its own deck is selected", () => {
    expect(
      courseDeckPassesFilter(
        { kind: "deckIds", deckIds: new Set(["ja-course"]) },
        jaCourse,
      ),
    ).toBe(true);
    expect(
      courseDeckPassesFilter(
        { kind: "deckIds", deckIds: new Set(["vocab-1"]) },
        jaCourse,
      ),
    ).toBe(false);
    // Per-language: an es learner's deckIds scope keys on es-course.
    expect(
      courseDeckPassesFilter(
        { kind: "deckIds", deckIds: new Set(["es-course"]) },
        courseDeckIdFor("es"),
      ),
    ).toBe(true);
  });
});

describe("course deck → reviewer queue composition", () => {
  it("turns a learner's unlocked words into playable new cards", () => {
    // Replicates exactly what useSubscriptionQueue does for the course deck.
    const eligible = JA_COURSE_ATOMS.filter(isSrsEligibleAtom);
    const sample = eligible.slice(0, 5).map(canonicalAtomId);
    const unlocked = new Set(sample);

    const courseDeck = buildEnrichedJaCourseDeck(unlocked);
    const unlockedCards = courseDeck.cards.filter((c) => c.unlocked);
    expect(unlockedCards.length).toBe(5);

    const emptyStore: SRSStore = {};
    const unseen = unlockedCards.length; // empty store → every card is unseen
    const sub: DeckSubscription = {
      contentId: courseDeck.id,
      newCardsPerDay: adaptiveNewCardsPerDay(unseen),
      newCardOrder: "ordered",
    };

    const queue = buildQueueFromSubscriptions(
      [sub],
      [{ id: courseDeck.id, cards: unlockedCards }],
      emptyStore,
      {},
    );

    // Previously this queue would be empty (no subscriptions). Now the
    // unlocked words surface as new cards, capped by the adaptive intake.
    expect(queue.newCount).toBe(5);
    expect(queue.dueCount).toBe(0);
    expect(queue.totalCount).toBe(5);
    for (const card of queue.queue) {
      expect(unlocked.has(card.id)).toBe(true);
    }
  });

  it("respects the adaptive new-card cap when many words are unlocked", () => {
    const eligible = JA_COURSE_ATOMS.filter(isSrsEligibleAtom);
    // Unlock more than the adaptive ceiling so the throttle is exercised.
    const sample = eligible.slice(0, 60).map(canonicalAtomId);
    const unlocked = new Set(sample);

    const courseDeck = buildEnrichedJaCourseDeck(unlocked);
    const unlockedCards = courseDeck.cards.filter((c) => c.unlocked);

    const emptyStore: SRSStore = {};
    const cap = adaptiveNewCardsPerDay(unlockedCards.length);
    const sub: DeckSubscription = {
      contentId: courseDeck.id,
      newCardsPerDay: cap,
      newCardOrder: "ordered",
    };

    const queue = buildQueueFromSubscriptions(
      [sub],
      [{ id: courseDeck.id, cards: unlockedCards }],
      emptyStore,
      {},
    );

    // Throttled: never floods the learner with the whole backlog at once.
    expect(queue.newCount).toBe(cap);
    expect(queue.newCount).toBeLessThan(unlockedCards.length);
  });

  it("turns unlocked ES words into playable new cards (generic course deck)", () => {
    // Same composition as the JA case, through the language-generic builder.
    const catalog = buildEnrichedCourseDeck("es", new Set())!;
    expect(catalog).not.toBeNull();
    const unlocked = new Set(catalog.cards.slice(0, 5).map((c) => c.id));

    const courseDeck = buildEnrichedCourseDeck("es", unlocked)!;
    const unlockedCards = courseDeck.cards.filter((c) => c.unlocked);
    expect(unlockedCards.length).toBe(5);

    const emptyStore: SRSStore = {};
    const sub: DeckSubscription = {
      contentId: courseDeck.id,
      newCardsPerDay: adaptiveNewCardsPerDay(unlockedCards.length),
      newCardOrder: "ordered",
    };

    const queue = buildQueueFromSubscriptions(
      [sub],
      [{ id: courseDeck.id, cards: unlockedCards }],
      emptyStore,
      {},
    );

    expect(queue.newCount).toBe(5);
    for (const card of queue.queue) {
      expect(unlocked.has(card.id)).toBe(true);
      expect(card.id.startsWith("es:")).toBe(true);
    }
  });
});
