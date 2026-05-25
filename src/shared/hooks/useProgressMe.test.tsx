/**
 * Tests for useProgressMe — Fix H10 reset-flag release.
 *
 * Uses vi.mock for useAuth + useApi to keep the test light. A real
 * QueryClientProvider wraps the hook so the actual TanStack Query flow
 * exercises the queryFn we changed.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type * as React from "react";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  clearLessonProgressReset,
  hasLessonProgressReset,
  markLessonProgressReset,
} from "@/shared/domain/mockProgress";
import type { ProgressSummary } from "@/shared/api/progress";

const mockGetMe = vi.fn();

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { sub: "user-1" },
    error: undefined,
    login: () => {},
    signup: () => {},
    logout: () => {},
  }),
}));

vi.mock("@/shared/api", () => ({
  useApi: () => ({
    progress: { getMe: mockGetMe },
  }),
}));

// Imports use the mocks above.
import { useProgressMe } from "./useProgressMe";

function wrapper(): (props: { children: ReactNode }) => React.JSX.Element {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useProgressMe — Fix H10", () => {
  beforeEach(() => {
    localStorage.clear();
    clearLessonProgressReset();
    mockGetMe.mockReset();
  });

  it("clears the reset flag once the server confirms the empty post-reset state", async () => {
    markLessonProgressReset();
    expect(hasLessonProgressReset()).toBe(true);

    const empty: ProgressSummary = {
      stats: {
        streak: 0,
        bestStreak: 0,
        lastActiveDate: null,
        xp: 0,
        level: 1,
        lingots: 0,
      },
      lessons: [],
    } as unknown as ProgressSummary;
    mockGetMe.mockResolvedValue(empty);

    const { result } = renderHook(() => useProgressMe(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isProgressReady).toBe(true));

    expect(mockGetMe).toHaveBeenCalled();
    expect(hasLessonProgressReset()).toBe(false);
  });

  it("keeps the reset flag set if server still returns stale lessons (clock-skew / replication lag)", async () => {
    markLessonProgressReset();
    const stale: ProgressSummary = {
      stats: {
        streak: 0,
        bestStreak: 0,
        lastActiveDate: null,
        xp: 0,
        level: 1,
        lingots: 0,
      },
      lessons: [
        {
          lessonId: "ja-m1-l1",
          firstCompletedAt: "2026-05-20T00:00:00Z",
          lastCompletedAt: "2026-05-20T00:00:00Z",
          bestAccuracy: 0.9,
          lastXp: 10,
          reviewCount: 1,
        },
      ],
    } as unknown as ProgressSummary;
    mockGetMe.mockResolvedValue(stale);

    const { result } = renderHook(() => useProgressMe(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isProgressReady).toBe(true));

    // Flag still set: server returned data, so reset isn't confirmed yet.
    expect(hasLessonProgressReset()).toBe(true);
  });

  it("merges server lessons into local cache when no reset is pending", async () => {
    expect(hasLessonProgressReset()).toBe(false);
    const summary: ProgressSummary = {
      stats: {
        streak: 0,
        bestStreak: 0,
        lastActiveDate: null,
        xp: 0,
        level: 1,
        lingots: 0,
      },
      lessons: [
        {
          lessonId: "ja-m1-l1",
          firstCompletedAt: "2026-05-20T00:00:00Z",
          lastCompletedAt: "2026-05-20T00:00:00Z",
          bestAccuracy: 0.9,
          lastXp: 10,
          reviewCount: 1,
        },
      ],
    } as unknown as ProgressSummary;
    mockGetMe.mockResolvedValue(summary);

    const { result } = renderHook(() => useProgressMe(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.summary).toEqual(summary));
    expect(hasLessonProgressReset()).toBe(false);
  });
});
