/**
 * useDeckManagerData — course pseudo-deck row (Workstream B, 2026-07-16).
 * The Deck Manager listed only backend decks; the client-generated course
 * deck (what most learners actually review) was invisible. Assert it's
 * listed read-only (`isCourseDeck`, no subscription), respects
 * `hideCourseDeck`, and that subscription writes never hit the API for it.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockSettings: { flashcards?: { hideCourseDeck?: boolean } } = {};
const mockUpdateSubscription = vi.fn();

vi.mock("@/shared/api", () => ({
  useApi: () => ({ users: { updateSubscription: mockUpdateSubscription } }),
}));

vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: mockSettings }),
}));

vi.mock("./useDeckSubscriptions", () => ({
  useDeckSubscriptions: () => ({
    subscriptions: [{ contentId: "deck-a", enabled: true, newCardsPerDay: 5 }],
    deckResponses: [
      {
        id: "deck-a",
        name: "Deck A",
        languageId: "ko",
        cards: [{ id: "a1" }, { id: "a2" }],
      },
    ],
    isLoading: false,
    isAuthenticated: true,
    invalidate: vi.fn(),
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
            { id: "ko:hana", unlocked: true },
            { id: "ko:dul", unlocked: true },
            { id: "ko:set", unlocked: false },
          ],
        }
      : null,
}));

import { useDeckManagerData } from "./useDeckManagerData";

describe("useDeckManagerData — course pseudo-deck", () => {
  beforeEach(() => {
    delete mockSettings.flashcards;
    mockUpdateSubscription.mockReset();
  });

  it("lists the course deck first, read-only, counting unlocked cards only", () => {
    const { result } = renderHook(() => useDeckManagerData("ko"));
    expect(result.current.decks.map((d) => d.id)).toEqual([
      "ko-course",
      "deck-a",
    ]);
    const course = result.current.decks[0];
    expect(course.isCourseDeck).toBe(true);
    expect(course.cardCount).toBe(2); // ko:set locked
    expect(course.subscription).toBeNull();
    // courseId set → deckScope groups it under "Lesson decks".
    expect(course.courseId).toBe("mock-ko");
  });

  it("omits the course deck when the user hid it", () => {
    mockSettings.flashcards = { hideCourseDeck: true };
    const { result } = renderHook(() => useDeckManagerData("ko"));
    expect(result.current.decks.map((d) => d.id)).toEqual(["deck-a"]);
  });

  it("never writes a subscription patch for the course pseudo-deck", async () => {
    const { result } = renderHook(() => useDeckManagerData("ko"));
    await act(async () => {
      await result.current.updateSubscription("ko-course", { enabled: false });
    });
    expect(mockUpdateSubscription).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.updateSubscription("deck-a", { newCardsPerDay: 9 });
    });
    expect(mockUpdateSubscription).toHaveBeenCalledWith("deck", "deck-a", {
      newCardsPerDay: 9,
    });
  });
});
