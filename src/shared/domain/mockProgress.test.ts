/**
 * Curriculum-restructure v3 migration test.
 *
 * Verifies that a user with a legacy yōon completion id stored in
 * localStorage gets the new consolidated row id credited on load.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  getLessonCompletion,
  isLessonCompleted,
  clearMockProgress,
} from "./mockProgress";

const PROGRESS_KEY = "lingo_progress_v1";
const MIGRATION_FLAG_V1 = "lingo_progress_migration_v1";
const MIGRATION_FLAG_V3 = "lingo_progress_migration_v3";
const MIGRATION_FLAG_V4 = "lingo_progress_migration_v4";

function seedLegacy(completed: Record<string, unknown>): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ completed }));
  // Pretend v1 streamline already ran; we want to exercise v3 in isolation.
  localStorage.setItem(MIGRATION_FLAG_V1, "1");
  localStorage.removeItem(MIGRATION_FLAG_V3);
  localStorage.removeItem(MIGRATION_FLAG_V4);
}

describe("v3 yōon migration", () => {
  beforeEach(() => {
    clearMockProgress();
    localStorage.removeItem(MIGRATION_FLAG_V1);
    localStorage.removeItem(MIGRATION_FLAG_V3);
    localStorage.removeItem(MIGRATION_FLAG_V4);
  });

  it("rewrites ja-m1-yo-k-1 → ja-m1-yoon-intro-1 on first load", () => {
    seedLegacy({
      "ja-m1-yo-k-1": {
        lessonId: "ja-m1-yo-k-1",
        firstCompletedAt: "2026-05-01T00:00:00.000Z",
        lastCompletedAt: "2026-05-01T00:00:00.000Z",
        bestAccuracy: 0.92,
        lastXp: 12,
        reviewCount: 0,
      },
    });
    // First read triggers loadStore() → migration.
    expect(isLessonCompleted("ja-m1-yoon-intro-1")).toBe(true);
    const credited = getLessonCompletion("ja-m1-yoon-intro-1");
    expect(credited).not.toBeNull();
    expect(credited!.firstCompletedAt).toBe("2026-05-01T00:00:00.000Z");
    expect(credited!.bestAccuracy).toBe(0.92);
  });

  it("folds yo-b-p → yoon-voiced", () => {
    seedLegacy({
      "ja-m1-yo-b-p-1": {
        lessonId: "ja-m1-yo-b-p-1",
        firstCompletedAt: "2026-05-01T00:00:00.000Z",
        lastCompletedAt: "2026-05-01T00:00:00.000Z",
        bestAccuracy: 0.8,
        lastXp: 12,
        reviewCount: 0,
      },
    });
    expect(isLessonCompleted("ja-m1-yoon-voiced-1")).toBe(true);
  });

  it("is idempotent across reloads", () => {
    seedLegacy({
      "ja-m1-yo-sh-ch-2": {
        lessonId: "ja-m1-yo-sh-ch-2",
        firstCompletedAt: "2026-05-01T00:00:00.000Z",
        lastCompletedAt: "2026-05-01T00:00:00.000Z",
        bestAccuracy: 0.9,
        lastXp: 12,
        reviewCount: 0,
      },
    });
    // First read migrates.
    isLessonCompleted("ja-m1-yoon-sh-ch-1");
    // Second read no-ops; the credited entry still exists.
    expect(isLessonCompleted("ja-m1-yoon-sh-ch-1")).toBe(true);
  });

  it("doesn't touch unrelated keys", () => {
    seedLegacy({
      "ja-m1-ka-1": {
        lessonId: "ja-m1-ka-1",
        firstCompletedAt: "2026-05-01T00:00:00.000Z",
        lastCompletedAt: "2026-05-01T00:00:00.000Z",
        bestAccuracy: 1.0,
        lastXp: 12,
        reviewCount: 0,
      },
    });
    isLessonCompleted("anything"); // trigger load
    expect(isLessonCompleted("ja-m1-ka-1")).toBe(true);
    expect(isLessonCompleted("ja-m1-yoon-intro-1")).toBe(false);
  });
});

describe("v4 dakuten-split migration", () => {
  beforeEach(() => {
    clearMockProgress();
    localStorage.removeItem(MIGRATION_FLAG_V1);
    localStorage.removeItem(MIGRATION_FLAG_V3);
    localStorage.removeItem(MIGRATION_FLAG_V4);
  });

  it("rewrites ja-m1-ga-1 → ja-m1-g-1", () => {
    seedLegacy({
      "ja-m1-ga-1": {
        lessonId: "ja-m1-ga-1",
        firstCompletedAt: "2026-05-01T00:00:00.000Z",
        lastCompletedAt: "2026-05-01T00:00:00.000Z",
        bestAccuracy: 0.9,
        lastXp: 10,
        reviewCount: 0,
      },
    });
    expect(isLessonCompleted("ja-m1-g-1")).toBe(true);
  });

  it("splits ja-m1-da-ba-1 → credits BOTH ja-m1-d-1 AND ja-m1-b-1", () => {
    seedLegacy({
      "ja-m1-da-ba-1": {
        lessonId: "ja-m1-da-ba-1",
        firstCompletedAt: "2026-05-01T00:00:00.000Z",
        lastCompletedAt: "2026-05-01T00:00:00.000Z",
        bestAccuracy: 0.85,
        lastXp: 10,
        reviewCount: 0,
      },
    });
    expect(isLessonCompleted("ja-m1-d-1")).toBe(true);
    expect(isLessonCompleted("ja-m1-b-1")).toBe(true);
  });

  it("preserves -test suffix when migrating", () => {
    seedLegacy({
      "ja-m1-za-test": {
        lessonId: "ja-m1-za-test",
        firstCompletedAt: "2026-05-01T00:00:00.000Z",
        lastCompletedAt: "2026-05-01T00:00:00.000Z",
        bestAccuracy: 1.0,
        lastXp: 10,
        reviewCount: 0,
      },
    });
    expect(isLessonCompleted("ja-m1-z-test")).toBe(true);
  });

  it("preserves wasSkipped flag", () => {
    seedLegacy({
      "ja-m1-pa-test": {
        lessonId: "ja-m1-pa-test",
        firstCompletedAt: "2026-05-01T00:00:00.000Z",
        lastCompletedAt: "2026-05-01T00:00:00.000Z",
        bestAccuracy: 0,
        lastXp: 0,
        reviewCount: 0,
        wasSkipped: true,
      },
    });
    const credited = getLessonCompletion("ja-m1-p-test");
    expect(credited).not.toBeNull();
    expect(credited!.wasSkipped).toBe(true);
  });
});
