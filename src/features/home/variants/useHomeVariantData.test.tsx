/**
 * HOMEREFRESH — the Continue button / "N lessons done" card must update IN
 * PLACE when local progress changes, without a remount.
 *
 * Spencer, 2026-09-18: "build 33's bulk-complete moved [my] server count
 * 139 → 525 in seconds, but the Home page's Continue button kept its
 * pre-sync target until a navigation." The ACTUAL fix for that report is in
 * `useProgressReconcile.ts` (the local→server PUSH path never invalidated
 * `["progress","me"]` at all — see `useProgressReconcile.test.tsx`'s
 * "emits reconcile_push" cases) and `PlacementTestPage.tsx` (same missing
 * invalidation on the placement write path).
 *
 * This file is regression coverage one layer down: it drives the REAL
 * reactive chain the Continue target already depends on (real
 * `useCompletedLessonIds`, real `mockProgress` store, real `getMockCourse`)
 * end to end, proving `nextLesson` / `completedLessonsCount` / `isResume`
 * recompute correctly off `completedIds` changes with no remount — and pins
 * `inProgressLessonId`'s dependency array (HOMEREFRESH hardening in
 * `useHomeVariantData.ts`) so a future `getMockCourse` memoization can't
 * quietly reintroduce a stale-memo version of this bug. Only the hooks
 * unrelated to progress (auth/language plumbing, stats, quests, flashcards,
 * the idle-prefetch warm hook) are mocked.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { renderHook, act } from "@testing-library/react";
import {
  markLessonCompleted,
  mergeServerLessonRollups,
  clearMockProgress,
} from "@/shared/domain/mockProgress";
import { saveLessonInProgress, clearLessonInProgress } from "@/features/lesson/data/lessonProgress";
import { LAST_USER_KEY } from "@/features/settings/storage";
import { getMockCourse } from "@/shared/domain/mockCourse";

const USER = "auth0|homerefresh-test";

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { sub: USER },
  }),
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: { id: "ja" },
    languages: [],
    isLoading: false,
    setLanguage: () => {},
  }),
}));

// The real hook fires a network-shaped fetch; not what this test is about.
vi.mock("@/shared/hooks/useProgressMe", () => ({
  useProgressMe: () => ({
    summary: null,
    isProgressReady: true,
    isLoading: false,
    isError: false,
    refetch: () => {},
  }),
}));

vi.mock("@/shared/hooks/useUserStats", () => ({
  useUserStats: () => ({
    stats: { streak: 1, bestStreak: 1, lastActiveDate: null, xp: 0, level: 1, lingots: 0 },
    isReady: true,
    isLoading: false,
    isError: false,
    refetch: () => {},
  }),
}));

vi.mock("@/features/flashcards/useFlashcardDueSummary", () => ({
  useFlashcardDueSummary: () => ({
    dueQueue: [],
    dueCount: 0,
    newToday: 0,
    backlogCount: 0,
    newCardsAllowed: 0,
    totalCount: 0,
    learningCount: 0,
    masteredCount: 0,
    weekReviews: [0, 0, 0, 0, 0, 0, 0],
    deckRetentions: [],
    deck: null,
    courseDecks: [],
    communityPacksWithDecks: [],
    isLoading: false,
  }),
}));

vi.mock("@/features/quests/useQuests", () => ({
  useQuests: () => ({ quests: [] }),
}));

vi.mock("@/features/home/useNextLessonWarm", () => ({
  useNextLessonWarm: () => {},
}));

import { useHomeVariantData } from "./useHomeVariantData";

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={["/ja/home"]}>{children}</MemoryRouter>;
}

describe("useHomeVariantData — Continue target refreshes without a remount", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LAST_USER_KEY, USER);
    clearMockProgress();
  });

  it("moves the Continue target to the next lesson when a pull merges new completions, no remount", () => {
    const course = getMockCourse("ja");
    const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    expect(allLessonIds.length).toBeGreaterThan(10);

    const { result, rerender } = renderHook(() => useHomeVariantData(), { wrapper });

    const before = result.current.nextLesson?.lesson.id ?? null;
    const beforeCount = result.current.completedLessonsCount;

    // Simulate a server pull landing 300+ new completions — exactly what
    // `useProgressMe`'s queryFn does via `mergeServerLessonRollups` after a
    // `progress/me` refetch. No route change, no remount: same renderHook
    // instance.
    const toComplete = allLessonIds.slice(0, 300);
    act(() => {
      mergeServerLessonRollups(
        toComplete.map((lessonId) => ({
          lessonId,
          bestScore: 1,
          firstPassedAt: "2026-09-18T00:00:00.000Z",
          latestAttemptAt: "2026-09-18T00:00:00.000Z",
          attemptCount: 1,
        })),
      );
    });
    rerender();

    expect(result.current.completedLessonsCount).toBe(beforeCount + 300);
    expect(result.current.completedLessonsCount).not.toBe(beforeCount);
    // The Continue target must have moved past the newly-completed block —
    // it can no longer point at any lesson in `toComplete`, and (since 300
    // lessons is more than this course's alphabet+m1 kickoff) must differ
    // from the pre-pull target.
    const after = result.current.nextLesson?.lesson.id ?? null;
    expect(after).not.toBe(before);
    expect(toComplete).not.toContain(after);
  });

  it("clears a stale in-progress resume target once that lesson is completed, no remount", () => {
    const course = getMockCourse("ja");
    const firstLesson = course.modules[0]?.lessons[0];
    const secondLesson = course.modules.flatMap((m) => m.lessons)[1];
    if (!firstLesson || !secondLesson) throw new Error("fixture course needs 2+ lessons");

    // A genuinely in-progress lesson (mid-lesson, saved locally) — this is
    // the `findInProgressLessonId` namespace, separate from `completedIds`.
    saveLessonInProgress(firstLesson.id, {
      stepIdx: 1,
      results: { "step-0": true },
      startedAt: new Date().toISOString(),
    });

    const { result, rerender } = renderHook(() => useHomeVariantData(), { wrapper });
    expect(result.current.isResume).toBe(true);
    expect(result.current.nextLesson?.lesson.id).toBe(firstLesson.id);

    // The lesson finishes (locally) — completion + resume-record clearing is
    // the app's real completion path (`markLessonCompleted` callers also
    // clear the in-progress record; that clearing is a separate concern from
    // this test, which only needs `completedIds` to change). THE BUG: with
    // `inProgressLessonId` memoized on `[allowedLessonIds]` only, this
    // component would keep reporting `isResume: true` pointed at the now
    // -completed lesson forever, because nothing in that dependency array
    // ever changes here.
    act(() => {
      markLessonCompleted(firstLesson.id, { accuracy: 1, xpEarned: 10, isReview: false });
      clearLessonInProgress(firstLesson.id);
    });
    rerender();

    expect(result.current.completedLessonsCount).toBe(1);
    expect(result.current.isResume).toBe(false);
    expect(result.current.nextLesson?.lesson.id).toBe(secondLesson.id);
  });
});
