/**
 * Reusable per-module FR structural lints — the STRUCTURE half of the FR
 * authoring bar, sibling of `es/__tests__/moduleContentLints.ts` (the ES
 * port notes apply unchanged). The pedagogy half (provenance, MCQ
 * discipline, production discipline) lives in `moduleBarGuards.ts`.
 *
 * FR registers modules here from DAY ONE — there is no pre-gate French
 * content, so unlike ES/JA these lints never carried debt and never will.
 *
 * Call from the module's test file:
 *   registerFrModuleContentLints({
 *     moduleId: "m1",
 *     lessons: FR_M1_MODULE.lessons,
 *     atoms: FR_M1_ATOMS,
 *   });
 *
 * Bespoke module-specific guards (m1's zero-translate pin, the m2 liaison
 * junction rules, …) stay in the module's own test file — this registers
 * only what is true of EVERY module.
 */
import { describe, it, expect } from "vitest";
import type { LessonContent } from "@/features/lesson/types";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  checkPassiveCardFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import type { FrAtom } from "../courseAtoms";

export function registerFrModuleContentLints(opts: {
  moduleId: string;
  lessons: LessonContent[];
  atoms: readonly FrAtom[];
}): void {
  const { moduleId, lessons, atoms } = opts;

  describe(`FR ${moduleId} structure`, () => {
    it(`ships 8 lessons (fr-${moduleId}-1..8), all tagged fr / ${moduleId} / mock-1`, () => {
      expect(lessons.map((l) => l.id)).toEqual(
        Array.from({ length: 8 }, (_, i) => `fr-${moduleId}-${i + 1}`),
      );
      expect(lessons.every((l) => l.moduleId === moduleId)).toBe(true);
      expect(lessons.every((l) => l.languageId === "fr")).toBe(true);
      expect(lessons.every((l) => l.courseId === "mock-1")).toBe(true);
    });

    it("every pathway node resolves to non-empty lesson content", () => {
      const course = getMockCourse("fr");
      const mod = course.modules.find((m) => m.id === moduleId);
      expect(mod, `${moduleId} missing from the fr course map`).toBeDefined();
      expect(mod?.lessons.length ?? 0).toBe(8);
      for (const lesson of mod!.lessons) {
        const content = getMockLessonContent(lesson.id);
        expect(content, `pathway node '${lesson.id}' has no content`).not.toBeNull();
        expect(content?.steps.length ?? 0).toBeGreaterThan(0);
      }
    });

    it("every step id within a lesson is unique", () => {
      for (const lesson of lessons) {
        const ids = lesson.steps.map((s) => s.id);
        expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
      }
    });

    it("passes the passive-card follow-up lint (i+2/i+3 spacing)", () => {
      for (const lesson of lessons) {
        const { failures } = checkPassiveCardFollowup(lesson.steps);
        expect(
          failures,
          `${lesson.id}: ${failures.map((f) => `${f.stepId} (${f.reason})`).join("; ")}`,
        ).toEqual([]);
      }
    });

    it("has no explanation on passive steps and no answer leaks", () => {
      for (const lesson of lessons) {
        expect(() => assertNoExplanationOnPassive(lesson.steps)).not.toThrow();
        expect(() => assertExplanationDoesntLeakAnswer(lesson.steps)).not.toThrow();
      }
    });

    it("the mastery test (L8) contains graded steps only", () => {
      const mastery = lessons[7];
      expect(
        mastery.steps.filter((s) => !isGradedStep(s)).map((s) => `${s.id} (${s.type})`),
        `${mastery.id} carries ungraded steps`,
      ).toEqual([]);
    });

    it(`every ${moduleId} atom surface literally appears in its steps`, () => {
      const corpus = lessons.map((l) => JSON.stringify(l.steps)).join("\n");
      for (const atom of atoms) {
        expect(
          corpus.includes(atom.surface),
          `atom surface '${atom.surface}' never appears in ${moduleId} steps`,
        ).toBe(true);
      }
    });

    it(`every ${moduleId} noun atom carries a gender (F6 — article from first exposure)`, () => {
      for (const atom of atoms) {
        if (atom.partOfSpeech === "noun") {
          expect(atom.gender, `noun atom '${atom.surface}' missing gender`).toBeDefined();
        }
      }
    });
  });
}
