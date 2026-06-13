import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const dueSummary = vi.fn();
const userStats = vi.fn();

vi.mock("@/features/flashcards/useFlashcardDueSummary", () => ({
  useFlashcardDueSummary: () => dueSummary(),
}));
vi.mock("@/shared/hooks/useUserStats", () => ({
  useUserStats: () => userStats(),
}));

import { usePracticeStats } from "./usePracticeStats";

const baseSummary = {
  dueCount: 0,
  totalCount: 0,
  learningCount: 0,
  masteredCount: 0,
  weekReviews: [0, 0, 0, 0, 0, 0, 0],
  deckRetentions: [] as number[],
  isLoading: false,
};

const baseUser = {
  stats: { streak: 0, bestStreak: 0, level: 1, xp: 0, lingots: 0, lastActiveDate: null },
};

describe("usePracticeStats", () => {
  beforeEach(() => {
    dueSummary.mockReturnValue({ ...baseSummary });
    userStats.mockReturnValue({ ...baseUser });
  });

  it("averages retention across decks that have reviews, ignoring zero-rep decks", () => {
    dueSummary.mockReturnValue({ ...baseSummary, deckRetentions: [90, 0, 80] });
    const { result } = renderHook(() => usePracticeStats("ja"));
    // (90 + 80) / 2 = 85; the 0 (no reps yet) is excluded.
    expect(result.current.retention).toBe(85);
    expect(result.current.hasRetention).toBe(true);
  });

  it("reports no retention when no deck has reviews", () => {
    dueSummary.mockReturnValue({ ...baseSummary, deckRetentions: [0, 0] });
    const { result } = renderHook(() => usePracticeStats("ja"));
    expect(result.current.retention).toBe(0);
    expect(result.current.hasRetention).toBe(false);
  });

  it("derives weekly review totals and active-day count", () => {
    dueSummary.mockReturnValue({
      ...baseSummary,
      weekReviews: [2, 0, 5, 0, 3, 0, 1],
    });
    const { result } = renderHook(() => usePracticeStats("ja"));
    expect(result.current.weekTotalReviews).toBe(11);
    expect(result.current.daysActiveThisWeek).toBe(4);
  });

  it("falls back to a 7-slot week when source data is malformed", () => {
    dueSummary.mockReturnValue({ ...baseSummary, weekReviews: [1, 2] });
    const { result } = renderHook(() => usePracticeStats("ja"));
    expect(result.current.weekReviews).toHaveLength(7);
    expect(result.current.weekTotalReviews).toBe(0);
  });

  it("passes through due/bucket counts and user streak", () => {
    dueSummary.mockReturnValue({
      ...baseSummary,
      dueCount: 7,
      learningCount: 12,
      masteredCount: 30,
      totalCount: 50,
    });
    userStats.mockReturnValue({
      stats: { ...baseUser.stats, streak: 4, bestStreak: 9, level: 3 },
    });
    const { result } = renderHook(() => usePracticeStats("ja"));
    expect(result.current.dueCount).toBe(7);
    expect(result.current.learning).toBe(12);
    expect(result.current.mastered).toBe(30);
    expect(result.current.total).toBe(50);
    expect(result.current.streak).toBe(4);
    expect(result.current.bestStreak).toBe(9);
    expect(result.current.level).toBe(3);
  });
});
