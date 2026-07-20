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
import { getRealFormLexicon } from "./moduleContentLints";

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
  /** Invariant 30 (Spencer 2026-07-20): imageable module-new atoms debut
   *  on word_image_mcq; teaching lessons don't open on dialogue_listen.
   *  Gated so already-shipped modules retrofit on their own schedule. */
  requireImageFirst?: boolean;
  /** Invariant 26 (m5+): every teaching lesson carries ONE integration
   *  step (id suffix -capstone; build/translate/listening_build) placed
   *  before the review tail, combining the new concept with ≥2 earlier-
   *  module concepts. Review lessons are exempt. */
  requireCapstone?: boolean;
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
  // Conjugation-aware: without every te/ta/nai/masu form, the tokenizer
  // reads たべない as an "untracked word" the first time a negatives
  // module (m6) runs — a false positive an agent would "fix" by loosening
  // the teach-before-use check (methodology audit 2026-07-20, Gap 1).
  // getRealFormLexicon (moduleContentLints) already enumerates them.
  const VOCAB = new Set([
    ...PRIOR,
    ...JA_COURSE_ATOMS.map((a) => a.kana),
    ...getRealFormLexicon(),
  ]);
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

      if (opts.requireCapstone && !lesson.id.endsWith("-review")) {
        it(`${lesson.id}: has ONE -capstone integration step before the review tail (invariant 26)`, () => {
          const idx = lesson.steps.findIndex((s) => s.id.endsWith("-capstone"));
          expect(idx, `${lesson.id}: no -capstone step`).toBeGreaterThan(-1);
          const step = lesson.steps[idx] as any;
          expect(
            ["build_sentence", "translate", "listening_build"],
            `${lesson.id}: capstone must be a generation step`,
          ).toContain(step.type);
          // Near the end, but before the closing grid — the stretch beat
          // precedes the recognition-easy tail.
          expect(idx).toBeGreaterThanOrEqual(lesson.steps.length - 8);
          expect(idx).toBeLessThan(lesson.steps.length - 2);
          expect(
            lesson.steps.filter((s) => s.id.endsWith("-capstone")).length,
          ).toBe(1);
        });
      }

      it(`${lesson.id}: no derived spot-the-mistake step (invariant 32 — retired)`, () => {
        for (const st of lesson.steps as any[]) {
          expect(
            st.id?.endsWith("-spot"),
            `${lesson.id}/${st.id}: spot-the-mistake step is retired (invariant 32)`,
          ).not.toBe(true);
          expect(
            /one of these is wrong/i.test(st.prompt ?? ""),
            `${lesson.id}/${st.id}: "one of these is wrong" prompt is retired (invariant 32)`,
          ).toBe(false);
        }
      });

      it(`${lesson.id}: no full-sentence recognition MCQs (invariant 28 — test-outs only)`, () => {
        // sentenceMcq compiles to a multiple_choice step; the offender is
        // one whose CORRECT option is a multi-word Japanese sentence
        // (picking a built sentence). Single-chunk MCQs (register/act-out)
        // and vocab/English-option MCQs are fine.
        for (const st of lesson.steps as any[]) {
          if (st.type !== "multiple_choice") continue;
          const correct = (st.options ?? []).find(
            (o: any) => o.id === st.correctOptionId,
          );
          const text: string = correct?.text ?? "";
          const isJa =
            /[぀-ヿ]/.test(text) && !/[a-zA-Z]/.test(text);
          const bare = text.replace(/[。？！]/g, "");
          if (isJa && /[ 　]/.test(bare)) {
            throw new Error(
              `${lesson.id}/${st.id}: full-sentence recognition MCQ ("${text}") — pick-the-built-sentence is test-out only; use build/translate/speaking`,
            );
          }
        }
      });

      if (opts.requireImageFirst && !lesson.id.endsWith("-review")) {
        it(`${lesson.id}: does not open on a dialogue (invariant 30)`, () => {
          expect(
            lesson.steps[0]?.type,
            `${lesson.id}: teaching lessons establish words before dialogue`,
          ).not.toBe("dialogue_listen");
        });
      }

      it(`${lesson.id}: production prompts are plain, no theatrics (invariant 29)`, () => {
        for (const st of lesson.steps as any[]) {
          const isProd = st.type === "build_sentence" || st.type === "translate";
          const isLc = st.type === "listening_comprehension";
          if (!isProd && !isLc) continue;
          const prompt: string = st.prompt ?? st.promptEn ?? st.question ?? "";
          // A theatrical scenario has an internal sentence period ("… up.
          // Tell Tom: …"); plain and register-cued prompts never do.
          if (/[.!?]\s+\S/.test(prompt.trim().replace(/[.!?]+$/, ""))) {
            throw new Error(
              `${lesson.id}/${st.id} (${st.type}): theatrical prompt ("${prompt}") — plain only ("Build: <English>" / "What does this mean?"); no scenario, no internal sentence period (inv 29)`,
            );
          }
        }
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

    if (opts.requireImageFirst) {
      it("imageable module-new atoms debut on word_image_mcq (invariant 30)", () => {
        const thisModule = `m${moduleLabel.match(/m(\d+)/)?.[1]}`;
        const imageable = JA_COURSE_ATOMS.filter(
          (a) =>
            a.fromModule === thisModule &&
            a.kind === "vocab" &&
            a.emoji &&
            !(a as any).blocked,
        );
        const firstType = new Map<string, string>();
        for (const lesson of lessons) {
          for (const step of lesson.steps as any[]) {
            const blob = JSON.stringify(step);
            for (const atom of imageable) {
              if (firstType.has(atom.kana)) continue;
              if (blob.includes(atom.kana)) firstType.set(atom.kana, step.type);
            }
          }
        }
        for (const atom of imageable) {
          const t = firstType.get(atom.kana);
          if (!t) continue; // atom exists but unused in this module — other gate
          expect(
            t,
            `${atom.kana} (${atom.emoji}) debuts on ${t}, not word_image_mcq`,
          ).toBe("word_image_mcq");
        }
      });
    }

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
