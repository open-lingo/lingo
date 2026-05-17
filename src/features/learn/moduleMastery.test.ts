import { describe, it, expect, beforeEach } from "vitest";
import type { CourseModule } from "@/shared/domain/course";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { clearMockProgress, markLessonCompleted } from "@/shared/domain/mockProgress";
import {
  getRowTestLessonIds,
  getModuleMastery,
  getMissingMasteryTests,
  isRowTestPassed,
} from "./moduleMastery";

const PROGRESS_KEY = "lingo_progress_v1";
const MIGRATION_FLAG_V1 = "lingo_progress_migration_v1";
const MIGRATION_FLAG_V3 = "lingo_progress_migration_v3";
const MIGRATION_FLAG_V4 = "lingo_progress_migration_v4";

function freshLocalStorage(): void {
  localStorage.removeItem(PROGRESS_KEY);
  // Pretend migrations already ran so they don't churn the store under us.
  localStorage.setItem(MIGRATION_FLAG_V1, "1");
  localStorage.setItem(MIGRATION_FLAG_V3, "1");
  localStorage.setItem(MIGRATION_FLAG_V4, "1");
}

function findM1(): CourseModule {
  const course = getMockCourse("ja");
  // Pick the first module that has at least one row-test sub-lesson —
  // the JA M1 module has them.
  const mod = course.modules.find((m) => m.lessons.length > 0);
  if (!mod) throw new Error("No module in JA course");
  return mod;
}

describe("moduleMastery", () => {
  beforeEach(() => {
    clearMockProgress();
    freshLocalStorage();
  });

  describe("getRowTestLessonIds", () => {
    it("returns ids of every row-test lesson in module order", () => {
      const m1 = findM1();
      const ids = getRowTestLessonIds(m1);
      // JA M1 has row tests like ja-m1-ka-test, ja-m1-sa-test, etc.
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect(id).toMatch(/-test$/);
      }
    });
  });

  describe("getModuleMastery", () => {
    it("returns mastered=false when sub-lessons incomplete", () => {
      const m1 = findM1();
      const result = getModuleMastery(m1, new Set());
      expect(result.mastered).toBe(false);
      expect(result.passed).toBe(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it("returns mastered=true when all lessons complete AND all tests passed un-skipped", () => {
      const m1 = findM1();
      const allIds = new Set(m1.lessons.map((l) => l.id));
      for (const id of m1.lessons) {
        markLessonCompleted(id.id, {
          accuracy: 1,
          xpEarned: 10,
          isReview: false,
          wasSkipped: false,
        });
      }
      const result = getModuleMastery(m1, allIds);
      expect(result.mastered).toBe(true);
      expect(result.passed).toBe(result.total);
    });

    it("partial mastery — one row-test skipped reduces passed count", () => {
      const m1 = findM1();
      const allIds = new Set(m1.lessons.map((l) => l.id));
      const testIds = getRowTestLessonIds(m1);
      // Complete everything except the first test is completed via skip.
      const firstTest = testIds[0];
      for (const lesson of m1.lessons) {
        markLessonCompleted(lesson.id, {
          accuracy: 1,
          xpEarned: 10,
          isReview: false,
          wasSkipped: lesson.id === firstTest,
        });
      }
      const result = getModuleMastery(m1, allIds);
      expect(result.passed).toBe(result.total - 1);
      expect(result.mastered).toBe(false);
    });

    it("all-skipped tests = passed count zero, not mastered", () => {
      const m1 = findM1();
      const allIds = new Set(m1.lessons.map((l) => l.id));
      for (const lesson of m1.lessons) {
        const isTest = lesson.id.endsWith("-test");
        markLessonCompleted(lesson.id, {
          accuracy: 1,
          xpEarned: 10,
          isReview: false,
          wasSkipped: isTest,
        });
      }
      const result = getModuleMastery(m1, allIds);
      expect(result.passed).toBe(0);
      expect(result.mastered).toBe(false);
    });

    it("auto-mastered when module has no row-tests (total=0) and all sub-lessons done", () => {
      // Synthetic module with one non-test lesson.
      const mod: CourseModule = {
        id: "synthetic",
        title: "No tests",
        lessons: [{ id: "no-such-lesson", title: "L1" }],
      };
      const completed = new Set(["no-such-lesson"]);
      const result = getModuleMastery(mod, completed, () => false);
      expect(result.total).toBe(0);
      expect(result.passed).toBe(0);
      expect(result.mastered).toBe(true);
    });

    it("backward-compat: legacy completion record (no wasSkipped) counts as passed", () => {
      const m1 = findM1();
      const allIds = new Set(m1.lessons.map((l) => l.id));
      // Seed legacy store directly — no `wasSkipped` field on any record.
      const completed: Record<string, unknown> = {};
      for (const lesson of m1.lessons) {
        completed[lesson.id] = {
          lessonId: lesson.id,
          firstCompletedAt: "2026-05-01T00:00:00.000Z",
          lastCompletedAt: "2026-05-01T00:00:00.000Z",
          bestAccuracy: 0.95,
          lastXp: 10,
          reviewCount: 0,
          // wasSkipped intentionally omitted
        };
      }
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ completed }));
      const result = getModuleMastery(m1, allIds);
      expect(result.mastered).toBe(true);
      expect(result.passed).toBe(result.total);
    });
  });

  describe("isRowTestPassed", () => {
    it("returns false when no record exists", () => {
      expect(isRowTestPassed("ja-m1-ka-test")).toBe(false);
    });

    it("returns true when record exists with wasSkipped=false", () => {
      markLessonCompleted("ja-m1-ka-test", {
        accuracy: 1,
        xpEarned: 10,
        isReview: false,
        wasSkipped: false,
      });
      expect(isRowTestPassed("ja-m1-ka-test")).toBe(true);
    });

    it("returns false when record exists with wasSkipped=true", () => {
      markLessonCompleted("ja-m1-ka-test", {
        accuracy: 0,
        xpEarned: 0,
        isReview: false,
        wasSkipped: true,
      });
      expect(isRowTestPassed("ja-m1-ka-test")).toBe(false);
    });

    it("a successful pass after a skip clears the skipped flag", () => {
      markLessonCompleted("ja-m1-ka-test", {
        accuracy: 0,
        xpEarned: 0,
        isReview: false,
        wasSkipped: true,
      });
      expect(isRowTestPassed("ja-m1-ka-test")).toBe(false);
      markLessonCompleted("ja-m1-ka-test", {
        accuracy: 1,
        xpEarned: 10,
        isReview: false,
        wasSkipped: false,
      });
      expect(isRowTestPassed("ja-m1-ka-test")).toBe(true);
    });

    it("a later skip after a successful pass does NOT regress to skipped", () => {
      markLessonCompleted("ja-m1-ka-test", {
        accuracy: 1,
        xpEarned: 10,
        isReview: false,
        wasSkipped: false,
      });
      markLessonCompleted("ja-m1-ka-test", {
        accuracy: 0,
        xpEarned: 1,
        isReview: true,
        wasSkipped: true,
      });
      expect(isRowTestPassed("ja-m1-ka-test")).toBe(true);
    });
  });

  describe("getMissingMasteryTests", () => {
    it("returns every row-test lesson when nothing's done", () => {
      const m1 = findM1();
      const missing = getMissingMasteryTests(m1, new Set());
      expect(missing.length).toBeGreaterThan(0);
      expect(missing.every((l) => l.id.endsWith("-test"))).toBe(true);
    });

    it("excludes passed row-tests, includes skipped ones", () => {
      const m1 = findM1();
      const testIds = getRowTestLessonIds(m1);
      const firstTest = testIds[0];
      const secondTest = testIds[1];
      markLessonCompleted(firstTest, {
        accuracy: 1,
        xpEarned: 10,
        isReview: false,
        wasSkipped: false,
      });
      markLessonCompleted(secondTest, {
        accuracy: 0,
        xpEarned: 0,
        isReview: false,
        wasSkipped: true,
      });
      const completed = new Set([firstTest, secondTest]);
      const missing = getMissingMasteryTests(m1, completed);
      const missingIds = missing.map((l) => l.id);
      expect(missingIds).not.toContain(firstTest);
      expect(missingIds).toContain(secondTest);
    });
  });
});
