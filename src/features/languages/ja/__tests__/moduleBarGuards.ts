/**
 * Reusable per-module authoring-bar guards (2026-07-20).
 *
 * Everything the m3-neo pilot walk turned into pinned invariants, as ONE
 * registration call so every new module gets the full bar automatically
 * instead of relying on the next authoring agent to copy test files:
 *
 *  - density band + ≥12 lessons per module (invariant 15/25)
 *  - no two adjacent same-type steps; max 2 selection-taps in a row;
 *    ≥5 distinct types; close on a match grid (guide density bar)
 *  - no primary sentence surface used >3x per lesson (invariant 24)
 *  - production-framed prompts are never sentence MCQs (invariant 24)
 *  - vocab provenance: every non-prior word debuts on an intro-capable
 *    step, and no untracked multi-kana words exist (invariant 24)
 *  - persona canon: named characters never flip facts (invariant 21)
 *
 * Call from the module's test file:
 *   registerModuleBarGuards({ moduleLabel: "m4-neo", lessons: M4_NEO_LESSONS,
 *     priorModules: ["m1","m2","m3"], canon: COURSE_CANON, minLessons: 12 });
 */
import { describe, it, expect } from "vitest";
import type { LessonContent } from "@/features/lesson/types";
import { JA_COURSE_ATOMS } from "../courseAtoms";
import { M3_M7_REVIEW_POOL } from "../grammarHelpers";

const SELECTION = new Set([
  "listening_comprehension",
  "word_image_mcq",
  "sentence_mcq",
  "particle_cloze",
  "self_explanation_mcq",
  "multiple_choice",
]);
const INTRO_TYPES = new Set([
  "listening_comprehension",
  "dialogue_listen",
  "grammar_rule",
  "build_sentence",
  "word_image_mcq",
  "particle_cloze",
]);

/** Course-wide persona canon — extend when a character gains a fact. */
export const COURSE_CANON: Record<string, Set<string>> = {
  トム: new Set(["がくせい", "アメリカじん", "ともだち"]),
  ミカ: new Set(["がくせい", "にほんじん", "ともだち"]),
  たなか: new Set(["せんせい"]),
  ケン: new Set(["がくせい", "にほんじん", "ともだち"]),
};

const STRUCTURAL = new Set([
  "だ", "です", "は", "も", "の", "トム", "ミカ", "ケン", "たなか",
  "、", "。", "？", "！",
]);

function jaStrings(step: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown, key: string) => {
    if (typeof v === "string") {
      if (
        /^[\p{Script=Hiragana}\p{Script=Katakana}ー、。？！　 ]+$/u.test(v) &&
        key !== "id"
      )
        out.push(v);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object")
      Object.entries(v).forEach(([k, x]) => walk(x, k));
  };
  walk(step, "");
  return out;
}

export function registerModuleBarGuards(opts: {
  moduleLabel: string;
  lessons: LessonContent[];
  /** Modules whose atoms count as already-known (e.g. ["m1","m2","m3"]). */
  priorModules: string[];
  canon?: Record<string, Set<string>>;
  /** Minimum lesson count (Spencer 2026-07-20: 12 from m4 on; m3's 7 is
   *  grandfathered — it taught only three things). */
  minLessons?: number;
}): void {
  const { moduleLabel, lessons, priorModules, canon = COURSE_CANON } = opts;
  const priorSet = new Set(priorModules);
  const PRIOR = new Set([
    ...JA_COURSE_ATOMS.filter((a) => priorSet.has(a.fromModule as string)).map(
      (a) => a.kana,
    ),
    ...M3_M7_REVIEW_POOL.filter((a) => priorSet.has(a.fromModule)).map(
      (a) => a.kana,
    ),
  ]);
  const VOCAB = new Set([...PRIOR, ...JA_COURSE_ATOMS.map((a) => a.kana)]);
  const ALL = [...new Set([...VOCAB, ...STRUCTURAL])].sort(
    (a, b) => b.length - a.length,
  );
  function tokenize(str0: string): { tokens: string[]; unknown: string[] } {
    const tokens: string[] = [];
    const unknown: string[] = [];
    const str = str0.replace(/[　 ]/g, "");
    let i = 0;
    while (i < str.length) {
      const hit = ALL.find((t) => str.startsWith(t, i));
      if (hit) {
        tokens.push(hit);
        i += hit.length;
      } else {
        let j = i + 1;
        while (j < str.length && !ALL.some((t) => str.startsWith(t, j))) j++;
        unknown.push(str.slice(i, j));
        i = j;
      }
    }
    return { tokens, unknown };
  }

  describe(`${moduleLabel} authoring bar`, () => {
    if (opts.minLessons) {
      it(`ships at least ${opts.minLessons} lessons`, () => {
        expect(lessons.length).toBeGreaterThanOrEqual(opts.minLessons!);
      });
    }

    for (const lesson of lessons) {
      it(`${lesson.id}: density + variety bar`, () => {
        const types = lesson.steps.map((s) => s.type);
        for (let i = 1; i < types.length; i++)
          expect(
            types[i],
            `${lesson.id} adjacent ${types[i]} @${i}`,
          ).not.toBe(types[i - 1]);
        let run = 0;
        for (const t of types) {
          run = SELECTION.has(t) ? run + 1 : 0;
          expect(run, `${lesson.id} selection run`).toBeLessThanOrEqual(2);
        }
        expect(types.length, `${lesson.id} steps`).toBeGreaterThanOrEqual(18);
        expect(types.length, `${lesson.id} steps`).toBeLessThanOrEqual(24);
        expect(types[types.length - 1]).toBe("match_pairs");
        expect(new Set(types).size).toBeGreaterThanOrEqual(5);
      });

      it(`${lesson.id}: no primary sentence surface repeats more than 3x`, () => {
        const counts = new Map<string, number>();
        for (const s of lesson.steps as any[]) {
          const surf =
            s.audioText ?? s.target ?? s.targetSentence ?? s.correctKana ??
            s.targetPhrase ?? s.acceptedAnswers?.[0];
          if (typeof surf !== "string") continue;
          const norm = surf.replace(/[。\s　]/g, "");
          counts.set(norm, (counts.get(norm) ?? 0) + 1);
        }
        for (const [sentence, n] of counts)
          expect(n, `${lesson.id}: "${sentence}" used ${n}x`).toBeLessThanOrEqual(3);
      });

      it(`${lesson.id}: production-framed prompts are generation steps, not MCQs`, () => {
        for (const s of lesson.steps as any[]) {
          if (s.type !== "sentence_mcq" && s.type !== "multiple_choice") continue;
          const prompt = `${s.prompt ?? ""} ${s.question ?? ""}`;
          const correct =
            s.correctKana ??
            s.options?.find((o: any) => o.id === s.correctOptionId)?.text ??
            "";
          if (/\breply\b|\bsay:/i.test(prompt) && /[ 　]/.test(correct)) {
            throw new Error(
              `${lesson.id}/${s.id}: production-framed prompt with a full-sentence answer must be a build/translate/speaking step`,
            );
          }
        }
      });
    }

    it("vocab provenance: no untracked words; new words debut on intro-capable steps", () => {
      const firstSeen = new Map<string, string>();
      for (const lesson of lessons) {
        for (const step of lesson.steps as any[]) {
          for (const s of jaStrings(step)) {
            const { tokens, unknown } = tokenize(s);
            for (const u of unknown)
              expect(
                u.length,
                `untracked word "${u}" in ${step.id} "${s}"`,
              ).toBeLessThanOrEqual(1);
            for (const t of tokens) {
              if (PRIOR.has(t) || STRUCTURAL.has(t) || t.length === 1) continue;
              if (!firstSeen.has(t)) firstSeen.set(t, step.type);
            }
          }
        }
      }
      for (const [word, type] of firstSeen)
        expect(
          INTRO_TYPES.has(type),
          `"${word}" debuts on non-intro step type ${type}`,
        ).toBe(true);
    });

    it("persona canon is consistent module-wide", () => {
      const names = Object.keys(canon).join("|");
      const preds = [...new Set(Object.values(canon).flatMap((s) => [...s]))].join("|");
      const re = new RegExp(`(${names})(?:は|も) (${preds})だ`, "g");
      for (const lesson of lessons) {
        const blob = JSON.stringify(lesson.steps);
        for (const m of blob.matchAll(re))
          expect(
            canon[m[1]].has(m[2]),
            `${lesson.id}: "${m[0]}" contradicts persona canon`,
          ).toBe(true);
      }
    });
  });
}
