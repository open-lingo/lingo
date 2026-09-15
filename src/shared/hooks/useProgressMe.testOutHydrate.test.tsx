/**
 * TestFlight b18 #144 — RULING-OUT test for the client hydrate path.
 *
 * Symptom: the iPad showed "YOU ARE HERE" at M1 / 1% complete while the
 * phone had m1–m32 done. Two candidate explanations: (a) the server never
 * stored the test-out completions, or (b) it stored them and this hydrate
 * path dropped them (firstPassedAt/bestScore gate, snapshot cache, language
 * not resolved yet).
 *
 * This test feeds a realistic `/progress/me` payload — exactly the rollup
 * shape `update_lesson_rollup` writes for an accepted `isTestOut` attempt
 * (`bestScore: 1`, `firstPassedAt` set because `passed` is true,
 * `attemptCount: 1`) — into the real hook on an EMPTY localStorage, and
 * asserts the course map lands on m33. It passes, so (b) is ruled out:
 * the hydrate path is correct and the rows simply were never there.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type * as React from "react";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  getCurrentModuleIndex,
  getModuleStatus,
} from "@/features/learn/moduleProgress";
import type { LessonRollup, ProgressSummary } from "@/shared/api/progress";

const mockGetMe = vi.fn();

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { sub: "ipad-user" },
    error: undefined,
    login: () => {},
    signup: () => {},
    logout: () => {},
  }),
}));

vi.mock("@/shared/api", () => ({
  useApi: () => ({ progress: { getMe: mockGetMe } }),
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

/** Rollups as lingo-core stores them for an accepted isTestOut attempt. */
function testOutRollups(throughModuleId: string): LessonRollup[] {
  const course = getMockCourse("ja");
  const cut = course.modules.findIndex((m) => m.id === throughModuleId);
  const at = "2026-09-15T12:00:00.000Z";
  return course.modules.slice(0, cut + 1).flatMap((m) =>
    m.lessons.map((l) => ({
      lessonId: l.id,
      bestScore: 1,
      firstPassedAt: at,
      latestAttemptAt: at,
      attemptCount: 1,
    })),
  );
}

describe("useProgressMe — test-out rollups hydrate onto a fresh device", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetMe.mockReset();
  });

  it("marks m1–m32 complete and puts the learner at m33", async () => {
    const lessons = testOutRollups("m32");
    expect(lessons.length).toBeGreaterThan(400);

    mockGetMe.mockResolvedValue({
      user: {
        streak: 2,
        bestStreak: 2,
        lastActiveDate: "2026-09-15",
        xp: 385,
        level: 1,
        lingots: 58,
      },
      lessons,
      concepts: [],
      last30days: [],
    } satisfies ProgressSummary);

    const { result } = renderHook(() => useProgressMe(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isProgressReady).toBe(true));
    await waitFor(() =>
      expect(getMockCompletedLessonIds().length).toBe(lessons.length),
    );

    const course = getMockCourse("ja");
    const ids = new Set(getMockCompletedLessonIds());
    const m31 = course.modules.findIndex((m) => m.id === "m31");
    const m33 = course.modules.findIndex((m) => m.id === "m33");

    expect(getModuleStatus(m31, ids, course.modules)).toBe("completed");
    expect(getCurrentModuleIndex(course, ids)).toBe(m33);
  });

  it("adds ids without clobbering a device's own local completions", async () => {
    const course = getMockCourse("ja");
    const localOnly = course.modules[35].lessons[0].id;
    const { markLessonCompleted } = await import("@/shared/domain/mockProgress");
    markLessonCompleted(localOnly, { accuracy: 0.9, xpEarned: 10, isReview: false });

    mockGetMe.mockResolvedValue({
      user: {
        streak: 2,
        bestStreak: 2,
        lastActiveDate: "2026-09-15",
        xp: 385,
        level: 1,
        lingots: 58,
      },
      lessons: testOutRollups("m3"),
      concepts: [],
      last30days: [],
    } satisfies ProgressSummary);

    const { result } = renderHook(() => useProgressMe(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isProgressReady).toBe(true));
    await waitFor(() =>
      expect(getMockCompletedLessonIds()).toContain(
        course.modules[0].lessons[0].id,
      ),
    );

    expect(getMockCompletedLessonIds()).toContain(localOnly);
  });
});
