/**
 * Coverage audit for the M3-M7 grammar-spine (rebuild 2026-05-18).
 *
 * Asserts that:
 *   - every authored module lesson resolves via getMockLessonContent
 *   - every module has at least one grammar_rule + one dialogue + one row_test
 *
 * The standalone inter-module Review pseudo-modules were retired
 * 2026-05-18 (compounding review now baked into every sub-lesson tail
 * per docs/m3-m7-rebuild-spec-2026-05-18.md §3); the corresponding
 * registration assertions were removed.
 *
 * Without this test the curriculum can silently regress when modules are
 * re-edited.
 */
import { describe, it, expect } from "vitest";
import { getMockLessonContent } from "./mockLessons";

const MODULE_LESSON_IDS: Record<string, string[]> = {
  m3: ["ja-m3-1-1", "ja-m3-1-2", "ja-m3-2-1", "ja-m3-2-2", "ja-m3-3-1", "ja-m3-3-2", "ja-m3-4-1", "ja-m3-4-2", "ja-m3-5-1", "ja-m3-5-2", "ja-m3-6-1", "ja-m3-6-2", "ja-m3-7-1", "ja-m3-7-2"],
  m4: ["ja-m4-1-1", "ja-m4-1-2", "ja-m4-2-1", "ja-m4-2-2", "ja-m4-3-1", "ja-m4-3-2", "ja-m4-4-1", "ja-m4-4-2", "ja-m4-5-1", "ja-m4-5-2", "ja-m4-6-1", "ja-m4-6-2", "ja-m4-7-1", "ja-m4-7-2"],
  m5: ["ja-m5-1-1", "ja-m5-1-2", "ja-m5-2-1", "ja-m5-2-2", "ja-m5-3-1", "ja-m5-3-2", "ja-m5-4-1", "ja-m5-4-2", "ja-m5-5-1", "ja-m5-5-2", "ja-m5-6-1", "ja-m5-6-2", "ja-m5-7-1", "ja-m5-7-2"],
  m6: ["ja-m6-1-1", "ja-m6-1-2", "ja-m6-2-1", "ja-m6-2-2", "ja-m6-3-1", "ja-m6-3-2", "ja-m6-4-1", "ja-m6-4-2", "ja-m6-5-1", "ja-m6-5-2", "ja-m6-6-1", "ja-m6-6-2", "ja-m6-7-1", "ja-m6-7-2", "ja-m6-8-1", "ja-m6-8-2"],
  m7: ["ja-m7-1-1", "ja-m7-1-2", "ja-m7-2-1", "ja-m7-2-2", "ja-m7-3-1", "ja-m7-3-2", "ja-m7-4-1", "ja-m7-4-2", "ja-m7-5-1", "ja-m7-5-2", "ja-m7-6-1", "ja-m7-6-2", "ja-m7-7-1", "ja-m7-7-2", "ja-m7-8-1", "ja-m7-8-2"],
};

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

      it("contains at least one dialogue (phrase_card with speaker prefix OR dialogue_listen step)", () => {
        // Wave 4B migrated dialogue closers from the dialogueLesson factory
        // (which emitted speaker-prefixed phrase_cards) to the new
        // dialogueListen step type. Accept either shape.
        const dialogueLines = lessonIds.flatMap((id) => {
          const lesson = getMockLessonContent(id);
          return (
            lesson?.steps.filter(
              (s) =>
                (s.type === "phrase_card" && s.meaningEn.includes(":")) ||
                s.type === "dialogue_listen",
            ) ?? []
          );
        });
        expect(dialogueLines.length).toBeGreaterThan(0);
      });

      // Mastery tests were removed from all modules during the sub-lesson
      // split (2026-05-24). M3_8 still exists as an export but is no longer
      // registered in the LESSONS map via getMockLessonContent.

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

describe("SRS review lessons (2026-05-24)", () => {
  for (const id of ["m3-review", "m4-review", "m5-review", "m6-review", "m7-review"]) {
    it(`ja-${id}-1 resolves to a dynamic review lesson`, () => {
      const lesson = getMockLessonContent(`ja-${id}-1`);
      expect(lesson).not.toBeNull();
      expect(lesson!.steps.length).toBeGreaterThan(0);
    });
    it(`ja-${id}-2 resolves to a dynamic review lesson`, () => {
      const lesson = getMockLessonContent(`ja-${id}-2`);
      expect(lesson).not.toBeNull();
    });
  }
});
