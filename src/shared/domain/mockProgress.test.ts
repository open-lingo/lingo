import { describe, it, expect, beforeEach } from "vitest";
import type { LessonRollup } from "@/shared/api/progress";
import { getActiveUserStorageId } from "@/features/settings/storage";
import {
  clearMockProgress,
  getMockCompletedLessonIds,
  getLessonCompletion,
  isLessonCompleted,
  markLessonCompleted,
  mergeServerLessonRollups,
} from "./mockProgress";

const STORAGE_PREFIX = "open-lingo-lesson-progress:";

function progressKey(): string {
  return `${STORAGE_PREFIX}${getActiveUserStorageId()}`;
}

describe("lesson progress store", () => {
  beforeEach(() => {
    localStorage.clear();
    clearMockProgress();
  });

  it("records and reads a completion", () => {
    markLessonCompleted("ko-m1-intro", {
      accuracy: 1,
      xpEarned: 8,
      isReview: false,
    });
    expect(isLessonCompleted("ko-m1-intro")).toBe(true);
    expect(getMockCompletedLessonIds()).toContain("ko-m1-intro");
  });

  it("scopes progress to the active user id", () => {
    localStorage.setItem("open-lingo-last-user-id", "user-a");
    markLessonCompleted("ko-m1-v-1", {
      accuracy: 0.9,
      xpEarned: 10,
      isReview: false,
    });
    expect(localStorage.getItem(`${STORAGE_PREFIX}user-a`)).toBeTruthy();

    localStorage.setItem("open-lingo-last-user-id", "user-b");
    expect(isLessonCompleted("ko-m1-v-1")).toBe(false);

    localStorage.setItem("open-lingo-last-user-id", "user-a");
    expect(isLessonCompleted("ko-m1-v-1")).toBe(true);
  });
});

describe("mergeServerLessonRollups", () => {
  beforeEach(() => {
    localStorage.clear();
    clearMockProgress();
  });

  it("hydrates lessons missing locally", () => {
    const rollups: LessonRollup[] = [
      {
        lessonId: "ko-m1-intro",
        bestScore: 1,
        firstPassedAt: "2026-05-01T12:00:00.000Z",
        latestAttemptAt: "2026-05-01T12:00:00.000Z",
        attemptCount: 1,
      },
    ];
    expect(mergeServerLessonRollups(rollups)).toBe(1);
    expect(isLessonCompleted("ko-m1-intro")).toBe(true);
    const c = getLessonCompletion("ko-m1-intro");
    expect(c?.bestAccuracy).toBe(1);
    expect(c?.reviewCount).toBe(0);
  });

  it("keeps newer local completion when offline ahead of server", () => {
    markLessonCompleted("ko-m1-v-1", {
      accuracy: 0.95,
      xpEarned: 12,
      isReview: false,
    });
    const local = getLessonCompletion("ko-m1-v-1")!;

    mergeServerLessonRollups([
      {
        lessonId: "ko-m1-v-1",
        bestScore: 0.8,
        firstPassedAt: "2026-05-01T10:00:00.000Z",
        latestAttemptAt: "2026-05-01T10:00:00.000Z",
        attemptCount: 1,
      },
    ]);

    const after = getLessonCompletion("ko-m1-v-1")!;
    expect(after.lastCompletedAt).toBe(local.lastCompletedAt);
    expect(after.lastXp).toBe(12);
    expect(after.bestAccuracy).toBe(0.95);
  });

  it("applies newer server rollup over stale local cache", () => {
    localStorage.setItem(
      progressKey(),
      JSON.stringify({
        completed: {
          "ko-m1-v-2": {
            lessonId: "ko-m1-v-2",
            firstCompletedAt: "2026-05-01T10:00:00.000Z",
            lastCompletedAt: "2026-05-01T10:00:00.000Z",
            bestAccuracy: 0.7,
            lastXp: 8,
            reviewCount: 0,
          },
        },
      }),
    );

    mergeServerLessonRollups([
      {
        lessonId: "ko-m1-v-2",
        bestScore: 0.95,
        firstPassedAt: "2026-05-02T10:00:00.000Z",
        latestAttemptAt: "2026-05-02T10:00:00.000Z",
        attemptCount: 2,
      },
    ]);

    const after = getLessonCompletion("ko-m1-v-2")!;
    expect(after.lastCompletedAt).toBe("2026-05-02T10:00:00.000Z");
    expect(after.bestAccuracy).toBe(0.95);
    expect(after.reviewCount).toBe(1);
  });
});
