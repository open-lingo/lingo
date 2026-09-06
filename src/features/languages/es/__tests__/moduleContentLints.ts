/**
 * Reusable per-module ES structural lints — the boilerplate every
 * `curriculum/mN.test.ts` used to hand-copy (id shape, pathway resolution,
 * uniqueness, passive-card spacing, explanation hygiene, mastery shape, atom
 * presence), registered from one call so a new module cannot forget one of
 * them. The ES sibling of ja's `registerJaModuleContentLints`; the pedagogy
 * bar (provenance, MCQ discipline, gloss lints) lives in
 * `moduleBarGuards.ts` — this file is the STRUCTURE half.
 *
 * Call from the module's test file:
 *   registerEsModuleContentLints({
 *     moduleId: "m4",
 *     lessons: ES_M4_LESSONS,
 *     atoms: ES_M4_ATOMS,
 *   });
 *
 * Bespoke module-specific guards (m17 preterite spine, m18 strong-preterite
 * accent rules, …) stay in the module's own test file — this registers only
 * what is true of EVERY module.
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
import type { EsAtom } from "../courseAtoms";
import { lintAlsoAccepted } from "@/features/lesson/components/steps/buildAcceptance";

export function registerEsModuleContentLints(opts: {
  moduleId: string;
  lessons: LessonContent[];
  atoms: readonly EsAtom[];
  /** Explicit lesson count — pinned so a silently dropped lesson fails here.
   *  (Was a hardcoded 8 in the July wave; §13 modules run 9–10.) */
  expectedLessonCount: number;
}): void {
  const { moduleId, lessons, atoms, expectedLessonCount } = opts;

  describe(`ES ${moduleId} structure`, () => {
    it(`ships ${expectedLessonCount} lessons (es-${moduleId}-1..${expectedLessonCount}), all tagged es / ${moduleId} / mock-1`, () => {
      expect(lessons.map((l) => l.id)).toEqual(
        Array.from({ length: expectedLessonCount }, (_, i) => `es-${moduleId}-${i + 1}`),
      );
      expect(lessons.every((l) => l.moduleId === moduleId)).toBe(true);
      expect(lessons.every((l) => l.languageId === "es")).toBe(true);
      expect(lessons.every((l) => l.courseId === "mock-1")).toBe(true);
    });

    it("every pathway node resolves to non-empty lesson content", () => {
      const course = getMockCourse("es");
      const mod = course.modules.find((m) => m.id === moduleId);
      expect(mod, `${moduleId} missing from the es course map`).toBeDefined();
      expect(mod?.lessons.length ?? 0).toBe(expectedLessonCount);
      for (const lesson of mod!.lessons) {
        const content = getMockLessonContent(lesson.id);
        expect(content, `pathway node '${lesson.id}' has no content`).not.toBeNull();
        expect(content?.steps.length ?? 0).toBeGreaterThan(0);
      }
    });

    it("every build alsoAccepted alternate is ≤3, distinct, and buildable from its bank", () => {
      const problems: string[] = [];
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "build_sentence" || !s.alsoAccepted) continue;
          problems.push(...lintAlsoAccepted(s));
        }
      }
      expect(problems).toEqual([]);
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

    it("the mastery test (final lesson) contains graded steps only", () => {
      const mastery = lessons[lessons.length - 1];
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
  });
}
