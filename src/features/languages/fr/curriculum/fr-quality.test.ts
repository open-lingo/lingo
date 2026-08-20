/**
 * FR course-wide QUALITY guardrails — the FR port of `es-quality.test.ts`
 * (which is itself the ES port of the JA-parity contract; pin F13 adopts
 * the ES module standard for French).
 *
 * Contract (topic lessons L1–L7 unless noted):
 *   - density:        14–25 steps (aim 18–22); mastery L8: 8–16, graded-only.
 *   - variety:        no two adjacent steps of the same `type`;
 *                     no 3+ consecutive "selection" (tap-one-of-N) steps.
 *   - production:     ≥2 generation steps (build/translate/speaking), ≥1 of
 *                     which is typed or spoken (translate/speaking).
 *   - metacognition:  each module after m1 has ≥2 self_explanation_mcq steps
 *                     (the IR compiler enforces ≥2 for EVERY module,
 *                     including m1 — this is the render-side backstop).
 *   - compounding:    each module after m1 has ≥6 of its L2–L8 lessons
 *                     reference a PRIOR-module atom. m1 exempt (nothing
 *                     earlier exists).
 */
import "./index";

import { describe, it, expect } from "vitest";
import type { LessonStep, MatchPairsStep } from "@/features/lesson/types";
import { FR_ALL_LESSONS } from "./index";
import { getFrCourseAtoms } from "../courseAtoms";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

// DERIVED from the lesson list, which derives from the module glob — FR has
// no hand-maintained module order anywhere (the ES es-quality header records
// what a hand copy of this list cost).
const MODULE_ORDER: readonly string[] = [
  ...new Set(FR_ALL_LESSONS.map((l) => moduleOf(l.id))),
];

// "Selection" = the same tap-one-of-N interaction under the hood; a run of
// 3+ reads as one long MCQ drill even when the `type` strings differ.
// FR additions: silent_letter and liaison_listen are quick tap drills and
// join the set; gender_sort is a composite multi-item interaction and stays
// out, like dialogue_listen.
const SELECTION_TYPES = new Set<LessonStep["type"]>([
  "multiple_choice",
  "word_image_mcq",
  "particle_cloze",
  "agreement_cloze",
  "listening_comprehension",
  "self_explanation_mcq",
  "silent_letter",
  "liaison_listen",
]);

const GENERATION_TYPES = new Set<LessonStep["type"]>([
  "build_sentence",
  "translate",
  "speaking",
]);
const TYPED_OR_SPOKEN = new Set<LessonStep["type"]>(["translate", "speaking"]);

function moduleOf(lessonId: string): string {
  const m = /^fr-(m\d+)-/.exec(lessonId);
  return m ? m[1] : "";
}
function lessonNum(lessonId: string): number {
  const m = /^fr-m\d+-(\d+)$/.exec(lessonId);
  return m ? Number(m[1]) : 0;
}
function moduleIndex(m: string): number {
  const i = MODULE_ORDER.indexOf(m);
  if (i === -1) {
    throw new Error(`fr-quality moduleIndex: "${m}" is not in the derived module order`);
  }
  return i;
}

// surface / atom-id → introducing module, for the compounding-review check.
const atomModuleById = new Map<string, string>();
const atomModuleBySurface = new Map<string, string>();
for (const a of getFrCourseAtoms()) {
  if (!a.fromModule) continue;
  atomModuleById.set(a.id, a.fromModule);
  atomModuleBySurface.set(a.surface, a.fromModule);
}

function referencesPriorModule(steps: readonly LessonStep[], currentModule: string): boolean {
  const cur = moduleIndex(currentModule);
  for (const step of steps) {
    const exercised = (step as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
    for (const id of exercised) {
      const fm = atomModuleById.get(id);
      if (fm && moduleIndex(fm) < cur) return true;
    }
    if (step.type === "match_pairs") {
      for (const p of (step as MatchPairsStep).pairs) {
        const fm = atomModuleBySurface.get(p.source);
        if (fm && moduleIndex(fm) < cur) return true;
      }
    }
  }
  return false;
}

const TOPIC = FR_ALL_LESSONS.filter((l) => lessonNum(l.id) >= 1 && lessonNum(l.id) <= 7);
const MASTERY = FR_ALL_LESSONS.filter((l) => lessonNum(l.id) === 8);

describe("FR quality — density & variety", () => {
  it("topic lessons (L1–L7) are 14–25 steps", () => {
    const bad = TOPIC.filter((l) => l.steps.length < 14 || l.steps.length > 25).map(
      (l) => `${l.id}=${l.steps.length}`,
    );
    expect(bad, `out-of-band: ${bad.join(", ")}`).toEqual([]);
  });

  it("mastery tests (L8) are 8–16 graded-only steps", () => {
    const bad = MASTERY.filter(
      (l) => l.steps.length < 8 || l.steps.length > 16 || !l.steps.every(isGradedStep),
    ).map((l) => l.id);
    expect(bad, `bad mastery: ${bad.join(", ")}`).toEqual([]);
  });

  it("no two adjacent steps share a type", () => {
    const bad: string[] = [];
    for (const l of FR_ALL_LESSONS) {
      for (let i = 1; i < l.steps.length; i++) {
        if (l.steps[i].type === l.steps[i - 1].type) {
          bad.push(`${l.id} @${i} (${l.steps[i].type})`);
        }
      }
    }
    expect(bad, `adjacent same-type: ${bad.join("; ")}`).toEqual([]);
  });

  it("no 3+ consecutive selection (tap-one-of-N) steps", () => {
    const bad: string[] = [];
    for (const l of FR_ALL_LESSONS) {
      let run = 0;
      for (let i = 0; i < l.steps.length; i++) {
        run = SELECTION_TYPES.has(l.steps[i].type) ? run + 1 : 0;
        if (run >= 3) {
          bad.push(`${l.id} @${i}`);
          run = 0;
        }
      }
    }
    expect(bad, `MCQ marathons: ${bad.join("; ")}`).toEqual([]);
  });
});

describe("FR quality — production", () => {
  it("each topic lesson has ≥2 generation steps, ≥1 typed/spoken", () => {
    const bad: string[] = [];
    for (const l of TOPIC) {
      const gen = l.steps.filter((s) => GENERATION_TYPES.has(s.type)).length;
      const typedSpoken = l.steps.filter((s) => TYPED_OR_SPOKEN.has(s.type)).length;
      if (gen < 2 || typedSpoken < 1) bad.push(`${l.id} (gen=${gen}, typed/spoken=${typedSpoken})`);
    }
    expect(bad, `under-produced: ${bad.join("; ")}`).toEqual([]);
  });
});

describe("FR quality — metacognition & compounding review", () => {
  it("each module after m1 has ≥2 self_explanation_mcq steps", () => {
    const bad: string[] = [];
    for (const mod of MODULE_ORDER.slice(1)) {
      const count = FR_ALL_LESSONS.filter((l) => moduleOf(l.id) === mod).reduce(
        (n, l) => n + l.steps.filter((s) => s.type === "self_explanation_mcq").length,
        0,
      );
      if (count < 2) bad.push(`${mod}=${count}`);
    }
    expect(bad, `too few selfExplain: ${bad.join(", ")}`).toEqual([]);
  });

  it("each module after m1 compounds prior modules in ≥6 of its L2–L8 lessons", () => {
    const bad: string[] = [];
    for (const mod of MODULE_ORDER.slice(1)) {
      const later = FR_ALL_LESSONS.filter(
        (l) => moduleOf(l.id) === mod && lessonNum(l.id) >= 2,
      );
      const withReview = later.filter((l) => referencesPriorModule(l.steps, mod)).length;
      if (withReview < 6) bad.push(`${mod}=${withReview}/7`);
    }
    expect(bad, `weak review tails: ${bad.join(", ")}`).toEqual([]);
  });
});
