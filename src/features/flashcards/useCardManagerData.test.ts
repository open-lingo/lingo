/**
 * useCardManagerData — course-deck injection (Workstream B, 2026-07-16).
 * Card Manager was subscription-only, so the cards a learner actually
 * studies (the client-generated course deck) were invisible. Assert the
 * unlocked course cards are injected as a pseudo-deck, flagged
 * `isCourseCard`, and that `settings.flashcards.hideCourseDeck` gates
 * them off — matching the review-queue scope (`useSubscriptionQueue`).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockSettings: { flashcards?: { hideCourseDeck?: boolean } } = {};
let mockAuthenticated = true;

vi.mock("@/shared/api", () => ({
  useApi: () => ({ srs: { sync: vi.fn() } }),
}));

vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: mockSettings }),
}));

vi.mock("./useDeckSubscriptions", () => ({
  useDeckSubscriptions: () => ({
    deckResponses: [
      {
        id: "deck-a",
        name: "Deck A",
        languageId: "ko",
        cards: [{ id: "a1", front: "a", back: "1" }],
      },
      {
        id: "deck-b",
        name: "Deck B",
        languageId: "ja",
        cards: [{ id: "b1", front: "b", back: "1" }],
      },
    ],
    isLoading: false,
    isAuthenticated: mockAuthenticated,
  }),
}));

vi.mock("./data/courseDeck", () => ({
  buildEnrichedCourseDeck: (languageId: string) =>
    languageId === "ko"
      ? {
          id: "ko-course",
          languageId: "ko",
          name: "Korean — full course",
          courseId: "mock-ko",
          cards: [
            { id: "ko:hana", front: "하나", back: "one", unlocked: true },
            { id: "ko:dul", front: "둘", back: "two", unlocked: true },
            { id: "ko:set", front: "셋", back: "three", unlocked: false },
          ],
        }
      : null,
}));

import { useCardManagerData } from "./useCardManagerData";

describe("useCardManagerData — course deck injection", () => {
  beforeEach(() => {
    delete mockSettings.flashcards;
    mockAuthenticated = true;
    localStorage.clear();
  });

  it("injects unlocked course cards as a pseudo-deck alongside backend decks", () => {
    const { result } = renderHook(() => useCardManagerData("ko"));
    const courseCards = result.current.cards.filter((c) => c.isCourseCard);
    // Only the 2 unlocked cards — ko:set stays out.
    expect(courseCards.map((c) => c.card.id)).toEqual(["ko:hana", "ko:dul"]);
    expect(courseCards.every((c) => c.deckId === "ko-course")).toBe(true);
    // Backend deck cards still present, unflagged.
    const backend = result.current.cards.filter((c) => !c.isCourseCard);
    expect(backend.map((c) => c.card.id)).toEqual(["a1"]);
    // Course deck appears in the deck facet list.
    expect(result.current.decks.map((d) => d.id)).toEqual([
      "ko-course",
      "deck-a",
    ]);
    // Never-reviewed course cards read as "new".
    expect(courseCards.every((c) => c.status === "new")).toBe(true);
  });

  it("omits course cards when the user hid the course deck", () => {
    mockSettings.flashcards = { hideCourseDeck: true };
    const { result } = renderHook(() => useCardManagerData("ko"));
    expect(result.current.cards.some((c) => c.isCourseCard)).toBe(false);
    expect(result.current.decks.map((d) => d.id)).toEqual(["deck-a"]);
  });

  it("still surfaces course cards when unauthenticated (no backend decks)", () => {
    mockAuthenticated = false;
    const { result } = renderHook(() => useCardManagerData("ko"));
    expect(result.current.cards).toHaveLength(2);
    expect(result.current.cards.every((c) => c.isCourseCard)).toBe(true);
  });

  it("handles languages without a course-atom catalog", () => {
    const { result } = renderHook(() => useCardManagerData("ja"));
    expect(result.current.cards.some((c) => c.isCourseCard)).toBe(false);
    expect(result.current.cards.map((c) => c.card.id)).toEqual(["b1"]);
  });
});
