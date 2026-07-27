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

function findM1(): CourseModule {
  const course = getMockCourse("ja");
  const mod = course.modules.find((m) => m.lessons.length > 0);
  if (!mod) throw new Error("No module in JA course");
  return mod;
}

describe("moduleMastery", () => {
  beforeEach(() => {
    localStorage.clear();
    clearMockProgress();
  });

  describe("getRowTestLessonIds", () => {
    it("returns the module's mastery-gate lessons (kana → the recap)", () => {
      const m1 = findM1();
      const ids = getRowTestLessonIds(m1);
      // Per-row row-tests were retired 2026-07-20 — M1's only mastery
      // gate is now the module recap.
      expect(ids).toEqual(["ja-m1-recap"]);
      for (const id of ids) {
        expect(id).toMatch(/(-test|-recap)$/);
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

    it("returns mastered=true when all lessons complete AND the gate passed un-skipped", () => {
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

    it("partial mastery — the recap skipped reduces passed count", () => {
      const m1 = findM1();
      const allIds = new Set(m1.lessons.map((l) => l.id));
      const testIds = getRowTestLessonIds(m1);
      // Complete everything, but the recap gate is completed via skip.
      const gate = testIds[0];
      for (const lesson of m1.lessons) {
        markLessonCompleted(lesson.id, {
          accuracy: 1,
          xpEarned: 10,
          isReview: false,
          wasSkipped: lesson.id === gate,
        });
      }
      const result = getModuleMastery(m1, allIds);
      expect(result.passed).toBe(result.total - 1);
      expect(result.mastered).toBe(false);
    });

    it("skipped mastery gate = passed count zero, not mastered", () => {
      const m1 = findM1();
      const allIds = new Set(m1.lessons.map((l) => l.id));
      const gates = new Set(getRowTestLessonIds(m1));
      for (const lesson of m1.lessons) {
        markLessonCompleted(lesson.id, {
          accuracy: 1,
          xpEarned: 10,
          isReview: false,
          wasSkipped: gates.has(lesson.id),
        });
      }
      const result = getModuleMastery(m1, allIds);
      expect(result.passed).toBe(0);
      expect(result.mastered).toBe(false);
    });

    it("auto-mastered when module has no mastery gate (total=0) and all sub-lessons done", () => {
      // Synthetic module with one non-gate lesson (no registered content).
      const mod: CourseModule = {
        id: "synthetic",
        title: "No gates",
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
      localStorage.setItem(
        "open-lingo-lesson-progress:anonymous",
        JSON.stringify({ completed }),
      );
      const result = getModuleMastery(m1, allIds);
      expect(result.mastered).toBe(true);
      expect(result.passed).toBe(result.total);
    });
  });

  describe("isRowTestPassed", () => {
    it("returns false when no record exists", () => {
      expect(isRowTestPassed("ja-m1-recap")).toBe(false);
    });

    it("returns true when record exists with wasSkipped=false", () => {
      markLessonCompleted("ja-m1-recap", {
        accuracy: 1,
        xpEarned: 10,
        isReview: false,
        wasSkipped: false,
      });
      expect(isRowTestPassed("ja-m1-recap")).toBe(true);
    });

    it("returns false when record exists with wasSkipped=true", () => {
      markLessonCompleted("ja-m1-recap", {
        accuracy: 0,
        xpEarned: 0,
        isReview: false,
        wasSkipped: true,
      });
      expect(isRowTestPassed("ja-m1-recap")).toBe(false);
    });

    it("a successful pass after a skip clears the skipped flag", () => {
      markLessonCompleted("ja-m1-recap", {
        accuracy: 0,
        xpEarned: 0,
        isReview: false,
        wasSkipped: true,
      });
      expect(isRowTestPassed("ja-m1-recap")).toBe(false);
      markLessonCompleted("ja-m1-recap", {
        accuracy: 1,
        xpEarned: 10,
        isReview: false,
        wasSkipped: false,
      });
      expect(isRowTestPassed("ja-m1-recap")).toBe(true);
    });

    it("a later skip after a successful pass does NOT regress to skipped", () => {
      markLessonCompleted("ja-m1-recap", {
        accuracy: 1,
        xpEarned: 10,
        isReview: false,
        wasSkipped: false,
      });
      markLessonCompleted("ja-m1-recap", {
        accuracy: 0,
        xpEarned: 1,
        isReview: true,
        wasSkipped: true,
      });
      expect(isRowTestPassed("ja-m1-recap")).toBe(true);
    });
  });

  describe("getMissingMasteryTests", () => {
    it("returns every mastery gate when nothing's done", () => {
      const m1 = findM1();
      const missing = getMissingMasteryTests(m1, new Set());
      expect(missing.length).toBeGreaterThan(0);
      expect(missing.every((l) => /(-test|-recap)$/.test(l.id))).toBe(true);
    });

    it("excludes a passed mastery gate", () => {
      const m1 = findM1();
      const gate = getRowTestLessonIds(m1)[0];
      markLessonCompleted(gate, {
        accuracy: 1,
        xpEarned: 10,
        isReview: false,
        wasSkipped: false,
      });
      const missing = getMissingMasteryTests(m1, new Set([gate]));
      expect(missing.map((l) => l.id)).not.toContain(gate);
    });

    it("includes a skipped mastery gate", () => {
      const m1 = findM1();
      const gate = getRowTestLessonIds(m1)[0];
      markLessonCompleted(gate, {
        accuracy: 0,
        xpEarned: 0,
        isReview: false,
        wasSkipped: true,
      });
      const missing = getMissingMasteryTests(m1, new Set([gate]));
      expect(missing.map((l) => l.id)).toContain(gate);
    });
  });
});
