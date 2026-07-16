/**
 * useCardsDueCount — plumbing test. The 2026-07 bug: this hook fed every
 * entry-point badge (Home tile, Learn sidebar, Progress) but only counted
 * subscribed backend decks, never the injected course deck — so badges said
 * "0 due" while the hub queued hundreds. Assert the course deck is included,
 * locked cards are excluded, and the hideCourseDeck setting gates it off.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const mockSettings: { flashcards?: { hideCourseDeck?: boolean } } = {};

vi.mock("./engine", () => ({
  // Count = number of cards passed; lets assertions target scope, not FSRS.
  countCardsDue: (cards: unknown[]) => cards.length,
}));

vi.mock("./SRSStoreRevisionContext", () => ({
  useSRSStoreRevision: () => 0,
}));

vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: mockSettings }),
}));

vi.mock("./useDeckSubscriptions", () => ({
  useDeckSubscriptions: () => ({
    subscriptions: [
      { contentId: "deck-a", enabled: true },
      { contentId: "deck-b", enabled: false },
      { contentId: "deck-c", enabled: true },
    ],
    deckResponses: [
      { id: "deck-a", languageId: "ko", cards: [{ id: "a1" }, { id: "a2" }] },
      { id: "deck-b", languageId: "ko", cards: [{ id: "b1" }] },
      { id: "deck-c", languageId: "ja", cards: [{ id: "c1" }] },
    ],
    isLoading: false,
  }),
}));

vi.mock("./data/courseDeck", () => ({
  buildEnrichedCourseDeck: (languageId: string) =>
    languageId === "ko"
      ? {
          id: "course-ko",
          cards: [
            { id: "k1", unlocked: true },
            { id: "k2", unlocked: true },
            { id: "k3", unlocked: false },
          ],
        }
      : null,
}));

import { useCardsDueCount } from "./useCardsDueCount";

describe("useCardsDueCount", () => {
  beforeEach(() => {
    delete mockSettings.flashcards;
  });

  it("counts enabled subscribed decks PLUS unlocked course cards", () => {
    const { result } = renderHook(() => useCardsDueCount("ko"));
    // deck-a (2) + course unlocked (2); deck-b disabled, deck-c wrong lang,
    // k3 locked — all excluded.
    expect(result.current.count).toBe(4);
    expect(result.current.isLoading).toBe(false);
  });

  it("omits the course deck when the user hid it", () => {
    mockSettings.flashcards = { hideCourseDeck: true };
    const { result } = renderHook(() => useCardsDueCount("ko"));
    expect(result.current.count).toBe(2);
  });

  it("handles languages without a course-atom catalog", () => {
    const { result } = renderHook(() => useCardsDueCount("ja"));
    // Only deck-c (1 card); buildEnrichedCourseDeck returns null for ja here.
    expect(result.current.count).toBe(1);
  });
});
