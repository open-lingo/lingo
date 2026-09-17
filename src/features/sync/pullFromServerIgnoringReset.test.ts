/**
 * Tests for the Sync panel's "Pull from server (ignore local reset)" action
 * (bug #176a).
 *
 * Two layers:
 *  - a unit layer against a stubbed QueryClient (flag cleared, refetch
 *    called with the right key, counts read from the stub's response), and
 *  - an integration layer against a REAL QueryClient running the exact
 *    `useProgressMe` queryFn, proving the override actually unblocks the
 *    merge `hasLessonProgressReset()` normally suppresses — the thing
 *    #176a's root-cause hypothesis says is stuck.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  clearLessonProgressReset,
  hasLessonProgressReset,
  markLessonProgressReset,
  mergeServerLessonRollups,
} from "@/shared/domain/mockProgress";
import type { ProgressSummary } from "@/shared/api/progress";
import { pullFromServerIgnoringReset } from "./pullFromServerIgnoringReset";

const QUERY_KEY = ["progress", "me", "user-1"];

function summaryWith(lessonIds: string[]): ProgressSummary {
  return {
    user: { streak: 0, bestStreak: 0, lastActiveDate: null, xp: 0, level: 1, lingots: 0 },
    lessons: lessonIds.map((lessonId) => ({
      lessonId,
      bestScore: 1,
      firstPassedAt: "2026-09-01T00:00:00Z",
      latestAttemptAt: "2026-09-01T00:00:00Z",
      attemptCount: 1,
    })),
    concepts: [],
    last30days: [],
  } as unknown as ProgressSummary;
}

describe("pullFromServerIgnoringReset — unit (stubbed QueryClient)", () => {
  beforeEach(() => {
    localStorage.clear();
    clearLessonProgressReset();
  });

  it("clears the reset flag before refetching", async () => {
    markLessonProgressReset();
    expect(hasLessonProgressReset()).toBe(true);

    const refetchQueries = vi.fn(async () => {
      // Assert the flag is ALREADY clear by the time the refetch fires —
      // that's the entire point of the fix (useProgressMe's queryFn checks
      // it mid-flight).
      expect(hasLessonProgressReset()).toBe(false);
    });
    const getQueryData = vi.fn(() => summaryWith(["ja-m5-l1"]));

    await pullFromServerIgnoringReset({ refetchQueries, getQueryData } as never, QUERY_KEY);

    expect(hasLessonProgressReset()).toBe(false);
  });

  it("refetches the exact query key passed in", async () => {
    const refetchQueries = vi.fn(async () => {});
    const getQueryData = vi.fn(() => null);

    await pullFromServerIgnoringReset({ refetchQueries, getQueryData } as never, QUERY_KEY);

    expect(refetchQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEY, exact: true });
  });

  it("reports local and server completed counts from the post-refetch cache", async () => {
    localStorage.setItem(
      "open-lingo-lesson-progress:anonymous",
      JSON.stringify({
        completed: {
          "ja-m5-l1": { lessonId: "ja-m5-l1", firstCompletedAt: "x", lastCompletedAt: "x", bestAccuracy: 1, lastXp: 10, reviewCount: 1 },
          "ja-m5-l2": { lessonId: "ja-m5-l2", firstCompletedAt: "x", lastCompletedAt: "x", bestAccuracy: 1, lastXp: 10, reviewCount: 1 },
        },
      }),
    );
    const refetchQueries = vi.fn(async () => {});
    const getQueryData = vi.fn(() => summaryWith(["ja-m5-l1", "ja-m5-l2", "ja-m5-l3"]));

    const result = await pullFromServerIgnoringReset(
      { refetchQueries, getQueryData } as never,
      QUERY_KEY,
    );

    expect(result.localCount).toBe(2);
    expect(result.serverCount).toBe(3);
  });

  it("reports server count null when nothing is in the cache yet", async () => {
    const refetchQueries = vi.fn(async () => {});
    const getQueryData = vi.fn(() => undefined);

    const result = await pullFromServerIgnoringReset(
      { refetchQueries, getQueryData } as never,
      QUERY_KEY,
    );

    expect(result.serverCount).toBeNull();
  });

  it("counts only PASSED lessons on the server side (firstPassedAt set)", async () => {
    const refetchQueries = vi.fn(async () => {});
    const summary = summaryWith(["ja-m5-l1"]);
    summary.lessons.push({
      lessonId: "ja-m5-l2",
      bestScore: 0,
      firstPassedAt: null,
      latestAttemptAt: "2026-09-01T00:00:00Z",
      attemptCount: 1,
    });
    const getQueryData = vi.fn(() => summary);

    const result = await pullFromServerIgnoringReset(
      { refetchQueries, getQueryData } as never,
      QUERY_KEY,
    );

    expect(result.serverCount).toBe(1);
  });
});

describe("pullFromServerIgnoringReset — integration (real QueryClient + useProgressMe's queryFn)", () => {
  beforeEach(() => {
    localStorage.clear();
    clearLessonProgressReset();
  });

  it("unblocks the server→local merge a stuck reset flag was suppressing", async () => {
    // Mirrors useProgressMe.ts's queryFn exactly (the merge under test).
    const mockGetMe = vi.fn(async (): Promise<ProgressSummary> => summaryWith(["ja-m5-l1", "ja-m5-l2"]));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
    });
    const key = ["progress", "me", "user-1"];
    queryClient.setQueryDefaults(key, {
      queryFn: async () => {
        const summary = await mockGetMe();
        if (!hasLessonProgressReset()) {
          mergeServerLessonRollups(summary.lessons);
        }
        return summary;
      },
    });

    // Simulate the stuck state: local completions the server has confirmed
    // (in the sense that hasServerLessons is true) but the flag is still
    // set, exactly like #176a's leading hypothesis.
    markLessonProgressReset();
    await queryClient.fetchQuery({ queryKey: key });
    expect(hasLessonProgressReset()).toBe(true);
    // The merge was suppressed — local cache still has nothing.
    expect(localStorage.getItem("open-lingo-lesson-progress:anonymous")).toBeNull();

    const result = await pullFromServerIgnoringReset(queryClient, key);

    expect(hasLessonProgressReset()).toBe(false);
    expect(result.localCount).toBe(2);
    expect(result.serverCount).toBe(2);
  });
});
