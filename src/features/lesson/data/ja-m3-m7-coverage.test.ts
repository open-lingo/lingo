/**
 * Coverage audit for the M3-M7 grammar-spine (restructure 2026-05-16).
 *
 * Asserts that:
 *   - every authored module lesson resolves via getMockLessonContent
 *   - every module has at least one grammar_rule + one dialogue + one row_test
 *   - every review module has the expected 4 lessons (3 review + 1 test)
 *
 * Without this test the curriculum can silently regress when modules are
 * re-edited.
 */
import { describe, it, expect } from "vitest";
import { getMockLessonContent } from "./mockLessons";

const MODULE_LESSON_IDS: Record<string, string[]> = {
  m3: ["ja-m3-1", "ja-m3-2", "ja-m3-3", "ja-m3-4", "ja-m3-5", "ja-m3-6", "ja-m3-7", "ja-m3-8"],
  m4: ["ja-m4-1", "ja-m4-2", "ja-m4-3", "ja-m4-4", "ja-m4-5", "ja-m4-6", "ja-m4-7", "ja-m4-8"],
  m5: ["ja-m5-1", "ja-m5-2", "ja-m5-3", "ja-m5-4", "ja-m5-5", "ja-m5-6", "ja-m5-7", "ja-m5-8"],
  m6: ["ja-m6-1", "ja-m6-2", "ja-m6-3", "ja-m6-4", "ja-m6-5", "ja-m6-6", "ja-m6-7", "ja-m6-8", "ja-m6-9"],
  m7: ["ja-m7-1", "ja-m7-2", "ja-m7-3", "ja-m7-4", "ja-m7-5", "ja-m7-6", "ja-m7-7", "ja-m7-8", "ja-m7-9"],
};

const REVIEW_MODULE_IDS = ["m3-review", "m4-review", "m5-review", "m6-review"];

describe("M3-M7 lesson registration", () => {
  for (const [moduleId, lessonIds] of Object.entries(MODULE_LESSON_IDS)) {
    describe(`module ${moduleId}`, () => {
      for (const id of lessonIds) {
        it(`${id} resolves to a LessonContent`, () => {
          const lesson = getMockLessonContent(id);
          expect(lesson, `${id} missing`).not.toBeNull();
          expect(lesson!.moduleId).toBe(moduleId);
          expect(lesson!.steps.length).toBeGreaterThan(0);
        });
      }

      it("contains at least one grammar_rule step across the module", () => {
        // M5 is exempt — numbers + counters are taught via phrase_card
        // (vocab-style), not grammar_rule. Every other module introduces
        // one or two new grammar concepts via Grammar Rule Cards.
        if (moduleId === "m5") return;
        const grammarRules = lessonIds.flatMap((id) => {
          const lesson = getMockLessonContent(id);
          return lesson?.steps.filter((s) => s.type === "grammar_rule") ?? [];
        });
        expect(grammarRules.length).toBeGreaterThan(0);
      });

      it("contains at least one dialogue (phrase_card with speaker prefix)", () => {
        const dialogueLines = lessonIds.flatMap((id) => {
          const lesson = getMockLessonContent(id);
          return (
            lesson?.steps.filter(
              (s) => s.type === "phrase_card" && s.meaningEn.includes(":"),
            ) ?? []
          );
        });
        expect(dialogueLines.length).toBeGreaterThan(0);
      });

      it("contains exactly one row_test step (the mastery test)", () => {
        const tests = lessonIds.flatMap((id) => {
          const lesson = getMockLessonContent(id);
          return lesson?.steps.filter((s) => s.type === "row_test") ?? [];
        });
        expect(tests.length).toBe(1);
      });

      it("contains at least one speaking step (in the dialogue lesson)", () => {
        // Per Spencer's spec: one representative speaking target per dialogue
        // lesson, via the dialogueLesson factory.
        const speaking = lessonIds.flatMap((id) => {
          const lesson = getMockLessonContent(id);
          return lesson?.steps.filter((s) => s.type === "speaking") ?? [];
        });
        expect(speaking.length).toBeGreaterThan(0);
      });
    });
  }
});

describe("review module registration", () => {
  for (const moduleId of REVIEW_MODULE_IDS) {
    describe(`review module ${moduleId}`, () => {
      const expectedIds = [
        `ja-${moduleId}-1`,
        `ja-${moduleId}-2`,
        `ja-${moduleId}-3`,
        `ja-${moduleId}-test`,
      ];
      for (const id of expectedIds) {
        it(`${id} resolves and is kind=module_review`, () => {
          const lesson = getMockLessonContent(id);
          expect(lesson, `${id} missing`).not.toBeNull();
          expect(lesson!.kind).toBe("module_review");
          expect(lesson!.moduleId).toBe(moduleId);
        });
      }

      it("test lesson has a row_test step", () => {
        const test = getMockLessonContent(`ja-${moduleId}-test`)!;
        const rowTest = test.steps.find((s) => s.type === "row_test");
        expect(rowTest).toBeDefined();
      });
    });
  }
});
