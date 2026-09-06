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
import { lintAlsoAccepted } from "@/features/lesson/components/steps/buildAcceptance";

export function registerFrModuleContentLints(opts: {
  moduleId: string;
  lessons: LessonContent[];
  atoms: readonly FrAtom[];
  /** Explicit lesson count — pinned so a silently dropped lesson fails here.
   *  (Was a hardcoded 8 in the IR wave; §13 modules run 9–10.) */
  expectedLessonCount: number;
  /** Atoms registered ONLY so a gate can track them (a transfer foil, a
   *  never-conjugated infinitive). Each needs a reason at the call site. */
  neverProduced?: string[];
}): void {
  const { moduleId, lessons, atoms, expectedLessonCount } = opts;

  describe(`FR ${moduleId} structure`, () => {
    it(`ships ${expectedLessonCount} lessons (fr-${moduleId}-1..${expectedLessonCount}), all tagged fr / ${moduleId} / mock-1`, () => {
      expect(lessons.map((l) => l.id)).toEqual(
        Array.from({ length: expectedLessonCount }, (_, i) => `fr-${moduleId}-${i + 1}`),
      );
      expect(lessons.every((l) => l.moduleId === moduleId)).toBe(true);
      expect(lessons.every((l) => l.languageId === "fr")).toBe(true);
      expect(lessons.every((l) => l.courseId === "mock-1")).toBe(true);
    });

    it("every pathway node resolves to non-empty lesson content", () => {
      const course = getMockCourse("fr");
      const mod = course.modules.find((m) => m.id === moduleId);
      expect(mod, `${moduleId} missing from the fr course map`).toBeDefined();
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

    it("every declared atom earns an ANSWER position, not just a distractor slot", () => {
      // Ported from ES (doctrinePins.ts, 2026-09-06): a usage count treats a
      // distractor as an appearance, so a word can be shown a dozen times
      // and never once be the thing the learner commits to. Answer positions:
      // build/listen-build targets, speaking phrases, cloze and agreement
      // blanks, dialogue_sim replies.
      const answers: string[] = [];
      for (const l of lessons) {
        for (const s of l.steps) {
          const rec = s as unknown as Record<string, unknown>;
          if (s.type === "build_sentence" || s.type === "listening_build") {
            answers.push(String(rec.targetSentence ?? ""));
          } else if (s.type === "speaking") {
            answers.push(String(rec.targetPhrase ?? ""));
          } else if (s.type === "particle_cloze") {
            answers.push(String(rec.correctParticle ?? ""));
          } else if (s.type === "agreement_cloze") {
            for (const seg of s.segments) if ("blank" in seg) answers.push(seg.blank.correctAnswer);
          } else if (s.type === "dialogue_sim") {
            for (const t of s.turns) {
              const r = t.reply;
              if (r.mode === "build") answers.push(r.answer);
              else answers.push(r.options.find((o) => o.id === r.correctOptionId)?.text ?? "");
            }
          }
        }
      }
      expect(answers.length, "no answer positions found — the pin would be vacuous").toBeGreaterThan(0);
      const norm = (x: string) => x.toLowerCase().replace(/[?!.,;:]/g, "").replace(/’/g, "'").trim();
      const phrases = answers.map(norm);
      // Elision: «l'école» produces «école», so split on the apostrophe too.
      const words = new Set(phrases.flatMap((p) => p.split(/[\s']+/)));
      const exempt = new Set((opts.neverProduced ?? []).map(norm));
      const missing = atoms
        .map((a) => norm(a.surface))
        .filter((surf) => !exempt.has(surf))
        .filter((surf) =>
          surf.includes(" ") || surf.includes("'")
            ? !phrases.some((p) => p.includes(surf))
            : !words.has(surf),
        );
      expect(missing, `offered but never produced (no answer position): ${missing.join(", ")}`).toEqual([]);
      const stale = [...exempt].filter((e) => !atoms.some((a) => norm(a.surface) === e));
      expect(stale, "neverProduced names a surface that is not an atom here").toEqual([]);
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

    it(`every ${moduleId} noun atom carries a gender (F6 — article from first exposure)`, () => {
      for (const atom of atoms) {
        if (atom.partOfSpeech === "noun") {
          expect(atom.gender, `noun atom '${atom.surface}' missing gender`).toBeDefined();
        }
      }
    });
  });
}
