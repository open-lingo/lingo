/**
 * Build 20 — the /progress/me hydrate is where reconciliation hooks in.
 *
 * It has to run AFTER `mergeServerLessonRollups` (so "local-only" means
 * local-only, not "hasn't merged yet") and it has to have the server's own
 * rollup list to diff against, which is exactly what the query function
 * holds. These tests pin that wiring end to end: a founder-shaped device
 * (hundreds of local completions, 18 on the server) posts the difference on
 * the first hydrate and nothing on the second.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type * as React from "react";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { markLessonCompleted, getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { LAST_USER_KEY } from "@/features/settings/storage";
import { resetReconcileMemoryForTests, RECONCILE_MARKER_PREFIX } from "@/shared/domain/progressReconcile";
import type { BatchAttempt, BatchAttemptSubmission, LessonRollup, ProgressSummary } from "@/shared/api/progress";

const USER = "auth0|founder";
const mockGetMe = vi.fn();
const mockBatch = vi.fn();

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { sub: USER },
    error: undefined,
    login: () => {},
    signup: () => {},
    logout: () => {},
  }),
}));

vi.mock("@/shared/api", () => ({
  useApi: () => ({ progress: { getMe: mockGetMe, batchAttempts: mockBatch } }),
}));

import { useProgressMe } from "./useProgressMe";

function wrapper(): (props: { children: ReactNode }) => React.JSX.Element {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function rollups(ids: string[]): LessonRollup[] {
  const at = "2026-09-15T12:00:00.000Z";
  return ids.map((lessonId) => ({
    lessonId,
    bestScore: 1,
    firstPassedAt: at,
    latestAttemptAt: at,
    attemptCount: 1,
  }));
}

function summary(ids: string[]): ProgressSummary {
  return {
    user: { streak: 2, bestStreak: 2, lastActiveDate: "2026-09-15", xp: 385, level: 1, lingots: 58 },
    lessons: rollups(ids),
    concepts: [],
    last30days: [],
  };
}

function postedAttempts(): BatchAttempt[] {
  return mockBatch.mock.calls.flatMap(
    (c) => (c[0] as BatchAttemptSubmission).attempts,
  );
}

describe("useProgressMe — build 20 local→server reconciliation", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LAST_USER_KEY, USER);
    localStorage.setItem(
      "open-lingo-settings",
      JSON.stringify({ learning: { learningLanguageId: "ja" } }),
    );
    mockGetMe.mockReset();
    mockBatch.mockReset();
    mockBatch.mockImplementation((payload: BatchAttemptSubmission) =>
      Promise.resolve({
        results: payload.attempts.map((a) => ({
          clientAttemptId: a.clientAttemptId,
          attemptId: `srv-${a.clientAttemptId}`,
          accepted: true,
          xpEarned: 0,
          streakAfter: 0,
          lingotsEarned: 0,
          dailyTotalLessons: 0,
        })),
      }),
    );
    resetReconcileMemoryForTests();
  });

  it("posts the months of local-only completions the server never got", async () => {
    const local = Array.from({ length: 500 }, (_, i) => `ja-m1-l${i + 1}`);
    for (const id of local) {
      markLessonCompleted(id, { accuracy: 1, xpEarned: 0, isReview: false });
    }
    mockGetMe.mockResolvedValue(summary(local.slice(0, 18)));

    const { result } = renderHook(() => useProgressMe(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isProgressReady).toBe(true));
    await waitFor(() => expect(mockBatch).toHaveBeenCalledTimes(5));

    const posted = postedAttempts();
    expect(posted).toHaveLength(482);
    expect(posted.every((a) => a.isTestOut === true)).toBe(true);
    expect(localStorage.getItem(`${RECONCILE_MARKER_PREFIX}${USER}`)).toBeTruthy();
    // LOCAL→SERVER only: nothing was removed locally.
    expect(getMockCompletedLessonIds()).toHaveLength(500);
  });

  it("posts nothing when the server already has everything local has", async () => {
    const local = Array.from({ length: 40 }, (_, i) => `ja-m1-l${i + 1}`);
    for (const id of local) {
      markLessonCompleted(id, { accuracy: 1, xpEarned: 0, isReview: false });
    }
    mockGetMe.mockResolvedValue(summary([...local, "ja-m2-l1"]));

    const { result } = renderHook(() => useProgressMe(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isProgressReady).toBe(true));
    // The server's extra id lands locally — the merge direction still works.
    await waitFor(() => expect(getMockCompletedLessonIds()).toContain("ja-m2-l1"));
    expect(mockBatch).not.toHaveBeenCalled();
  });
});
