/**
 * A failed /progress/me must not read as "you have 0 lingots".
 *
 * `useUserStats().isReady` comes from `useProgressMe`, where it is
 * `query.isFetched` — true once the query SETTLES, including on error. That
 * meaning is load-bearing for the lesson-hydrate consumers
 * (`useCompletedLessonIds` re-reads local progress once the fetch settles, and
 * must still do so offline), so it is deliberately NOT redefined. Instead the
 * places that turn it into a BALANCE have to account for the error, because
 * the error fallback is `DEFAULT_STATS` with `lingots: 0`.
 *
 * Before this, a cold load with the API down showed a confident "0" in the
 * header, disabled every Buy button, and answered a tap with "Not enough
 * lingots." to a user who might have had hundreds.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUserStats = vi.fn();
vi.mock("@/shared/hooks/useUserStats", () => ({
  useUserStats: () => mockUserStats(),
}));
vi.mock("@/shared/hooks/useUserSettings", () => ({
  useUserSettings: () => ({ data: undefined, isLoading: false, refetch: vi.fn() }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

import { useShopState } from "./useShopState";

const STATS = { lingots: 800, streak: 3, bestStreak: 5, level: 4, xp: 100 };

describe("useShopState — balance vs. error", () => {
  beforeEach(() => mockUserStats.mockReset());

  it("reports null (unknown), not 0, when the balance failed to load", () => {
    mockUserStats.mockReturnValue({
      // The error fallback: settled, but the numbers are defaults.
      stats: { ...STATS, lingots: 0 },
      isReady: true,
      isError: true,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useShopState());

    expect(result.current.lingots).toBeNull();
    expect(result.current.statsError).toBe(true);
  });

  it("reports the real balance on success", () => {
    mockUserStats.mockReturnValue({
      stats: STATS,
      isReady: true,
      isError: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useShopState());

    expect(result.current.lingots).toBe(800);
    expect(result.current.statsError).toBe(false);
  });

  it("reports null while still loading", () => {
    mockUserStats.mockReturnValue({
      stats: STATS,
      isReady: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useShopState());

    expect(result.current.lingots).toBeNull();
  });

  it("a genuine zero balance is still reported as 0, not swallowed as unknown", () => {
    // The fix must not make "broke" indistinguishable from "unknown" — a real
    // 0 has to keep rendering as 0 so the shop's affordability logic works.
    mockUserStats.mockReturnValue({
      stats: { ...STATS, lingots: 0 },
      isReady: true,
      isError: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useShopState());

    expect(result.current.lingots).toBe(0);
  });
});
