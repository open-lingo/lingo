/**
 * ES course-wide QUALITY guardrails — the §13-doctrine contract.
 *
 * Rewritten 2026-08-21 when the July m1–m19 wave was archived and the
 * hand-authored §13 course (m1/m2, learner-sim-hardened, walked by Spencer)
 * became the real curriculum. The July contract lived on an 8-lesson module
 * shape (TOPIC=L1–7 / MASTERY=L8) and on step types the doctrine has since
 * ruled out (typed `translate` — guide §13.9 law 10; `self_explanation_mcq`
 * — replaced by collapsed win-explanations, the no-hollow-cards rule).
 *
 * Contract (derived from each module's own exports, never restated):
 *   - shape:       checkpoint sits at ES_Mn_CHECKPOINT_INDEX and is
 *                  zero-new (every step graded); the LAST lesson is mastery
 *                  and ENDS on a dialogue_sim (§13.9 law 7).
 *   - density:     teaching lessons 10–25 steps; checkpoint 12–22.
 *   - variety:     no two adjacent same-type steps; no 4+ consecutive
 *                  "selection" (tap-one-of-N) steps. (The July bar was 3+;
 *                  §13's debut rhythm — image-MCQ · audio-retrieval ·
 *                  image-MCQ — is a deliberate 3-run, so the marathon line
 *                  moves to 4.)
 *   - production:  every teaching lesson has ≥2 generation steps
 *                  (build/speaking — typed translate is BANNED at this
 *                  tier), ≥1 of them spoken.
 *   - compounding: every module after m1 references a PRIOR-module item in
 *                  most of its lessons (review-tail law, §13.9 law 1).
 */
import "./index";

import { describe, it, expect } from "vitest";
import type { LessonStep, MatchPairsStep } from "@/features/lesson/types";
import { ES_ALL_LESSONS } from "./index";
import { ES_M1_CHECKPOINT_INDEX } from "./m1";
import { ES_M2_CHECKPOINT_INDEX } from "./m2";
import { ES_M3_CHECKPOINT_INDEX } from "./m3";
import { ES_M4_CHECKPOINT_INDEX } from "./m4";
import { ES_M5_CHECKPOINT_INDEX } from "./m5";
import { ES_M6_CHECKPOINT_INDEX } from "./m6";
import { ES_M7_CHECKPOINT_INDEX } from "./m7";
import { ES_M8_CHECKPOINT_INDEX } from "./m8";
import { ES_M9_CHECKPOINT_INDEX } from "./m9";
import { ES_M10_CHECKPOINT_INDEX } from "./m10";
import { getEsCourseAtoms } from "../courseAtoms";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

const MODULE_ORDER: readonly string[] = ES_MODULE_ORDER;

/** 1-based checkpoint position per module — from the module's own export. */
const CHECKPOINT_INDEX: Record<string, number> = {
  m1: ES_M1_CHECKPOINT_INDEX,
  m2: ES_M2_CHECKPOINT_INDEX,
  m3: ES_M3_CHECKPOINT_INDEX,
  m4: ES_M4_CHECKPOINT_INDEX,
  m5: ES_M5_CHECKPOINT_INDEX,
  m6: ES_M6_CHECKPOINT_INDEX,
  m7: ES_M7_CHECKPOINT_INDEX,
  m8: ES_M8_CHECKPOINT_INDEX,
  m9: ES_M9_CHECKPOINT_INDEX,
  m10: ES_M10_CHECKPOINT_INDEX,
};

const SELECTION_TYPES = new Set<LessonStep["type"]>([
  "multiple_choice",
  "word_image_mcq",
  "particle_cloze",
  "agreement_cloze",
  "listening_comprehension",
  "self_explanation_mcq",
]);

const GENERATION_TYPES = new Set<LessonStep["type"]>(["build_sentence", "speaking"]);

function moduleOf(lessonId: string): string {
  const m = /^es-(m\d+)-/.exec(lessonId);
  return m ? m[1] : "";
}
function lessonNum(lessonId: string): number {
  const m = /^es-m\d+-(\d+)$/.exec(lessonId);
  return m ? Number(m[1]) : 0;
}
function moduleIndex(m: string): number {
  const i = MODULE_ORDER.indexOf(m);
  if (i === -1) {
    throw new Error(`es-quality moduleIndex: "${m}" is not in ES_MODULE_ORDER`);
  }
  return i;
}
function lessonCountOf(mod: string): number {
  return ES_ALL_LESSONS.filter((l) => moduleOf(l.id) === mod).length;
}
function isCheckpoint(l: { id: string }): boolean {
  return lessonNum(l.id) === CHECKPOINT_INDEX[moduleOf(l.id)];
}
function isMastery(l: { id: string }): boolean {
  return lessonNum(l.id) === lessonCountOf(moduleOf(l.id));
}

const TEACHING = ES_ALL_LESSONS.filter((l) => !isCheckpoint(l) && !isMastery(l));
const CHECKPOINTS = ES_ALL_LESSONS.filter(isCheckpoint);
const MASTERY = ES_ALL_LESSONS.filter(isMastery);

// surface / atom-id → introducing module, for the compounding-review check.
const atomModuleById = new Map<string, string>();
const atomModuleBySurface = new Map<string, string>();
for (const a of getEsCourseAtoms()) {
  if (!a.fromModule) continue;
  atomModuleById.set(a.id, a.fromModule);
  atomModuleBySurface.set(a.surface, a.fromModule);
}

/** Every string a step surfaces to the learner in the target language. */
function stepSpanishStrings(step: LessonStep): string[] {
  const s = step as Record<string, unknown>;
  const out: string[] = [];
  for (const k of ["audioText", "audioKey", "targetPhrase", "targetSentence"]) {
    if (typeof s[k] === "string") out.push(s[k] as string);
  }
  if (Array.isArray(s.tokens)) out.push(...(s.tokens as string[]));
  return out;
}

/** True when the lesson references any atom introduced by an EARLIER module —
 *  via exercisedAtoms, match_pairs sources, or a taught surface appearing
 *  token-for-token inside the step's Spanish text. */
function referencesPriorModule(steps: readonly LessonStep[], currentModule: string): boolean {
  const cur = moduleIndex(currentModule);
  const prior = (fm: string | undefined) => Boolean(fm && moduleIndex(fm) < cur);
  for (const step of steps) {
    const exercised = (step as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
    if (exercised.some((id) => prior(atomModuleById.get(id)))) return true;
    if (step.type === "match_pairs") {
      for (const p of (step as MatchPairsStep).pairs) {
        if (prior(atomModuleBySurface.get(p.source))) return true;
      }
    }
    for (const text of stepSpanishStrings(step)) {
      const tokens = text.toLowerCase().split(/[^\p{L}\p{N}¿¡?!']+/u).filter(Boolean);
      for (const [surface, fm] of atomModuleBySurface) {
        if (!prior(fm)) continue;
        const sTokens = surface.toLowerCase().split(/\s+/);
        if (sTokens.every((t) => tokens.includes(t))) return true;
      }
    }
  }
  return false;
}

describe("ES quality — module shape (§13.9)", () => {
  it("every module has a checkpoint at its declared index and it is zero-new (all graded)", () => {
    expect(CHECKPOINTS.length).toBe(MODULE_ORDER.length);
    const bad = CHECKPOINTS.filter((l) => !l.steps.every(isGradedStep)).map((l) => l.id);
    expect(bad, `ungraded steps in checkpoint: ${bad.join(", ")}`).toEqual([]);
  });

  it("every module ENDS on a dialogue_sim (the module ends on a conversation, not a grid)", () => {
    const bad = MASTERY.filter(
      (l) => l.steps[l.steps.length - 1].type !== "dialogue_sim",
    ).map((l) => l.id);
    expect(bad, `mastery not ending on a sim: ${bad.join(", ")}`).toEqual([]);
  });
});

describe("ES quality — density & variety", () => {
  it("teaching lessons are 10–25 steps", () => {
    const bad = TEACHING.filter((l) => l.steps.length < 10 || l.steps.length > 25).map(
      (l) => `${l.id}=${l.steps.length}`,
    );
    expect(bad, `out-of-band: ${bad.join(", ")}`).toEqual([]);
  });

  it("checkpoints are 12–22 steps", () => {
    const bad = CHECKPOINTS.filter((l) => l.steps.length < 12 || l.steps.length > 22).map(
      (l) => `${l.id}=${l.steps.length}`,
    );
    expect(bad, `out-of-band: ${bad.join(", ")}`).toEqual([]);
  });

  it("no two adjacent steps share a type", () => {
    const bad: string[] = [];
    for (const l of ES_ALL_LESSONS) {
      for (let i = 1; i < l.steps.length; i++) {
        if (l.steps[i].type === l.steps[i - 1].type) {
          bad.push(`${l.id} @${i} (${l.steps[i].type})`);
        }
      }
    }
    expect(bad, `adjacent same-type: ${bad.join("; ")}`).toEqual([]);
  });

  it("no 4+ consecutive selection (tap-one-of-N) steps", () => {
    const bad: string[] = [];
    for (const l of ES_ALL_LESSONS) {
      let run = 0;
      for (let i = 0; i < l.steps.length; i++) {
        run = SELECTION_TYPES.has(l.steps[i].type) ? run + 1 : 0;
        if (run >= 4) {
          bad.push(`${l.id} @${i}`);
          run = 0;
        }
      }
    }
    expect(bad, `MCQ marathons: ${bad.join("; ")}`).toEqual([]);
  });
});

describe("ES quality — production", () => {
  it("each teaching lesson has ≥2 generation steps, ≥1 spoken; zero typed translate anywhere", () => {
    const bad: string[] = [];
    for (const l of TEACHING) {
      const gen = l.steps.filter((s) => GENERATION_TYPES.has(s.type)).length;
      const spoken = l.steps.filter((s) => s.type === "speaking").length;
      if (gen < 2 || spoken < 1) bad.push(`${l.id} (gen=${gen}, spoken=${spoken})`);
    }
    expect(bad, `under-produced: ${bad.join("; ")}`).toEqual([]);
    const translate = ES_ALL_LESSONS.flatMap((l) =>
      l.steps.filter((s) => s.type === "translate").map(() => l.id),
    );
    expect(translate, "typed translate is banned at beginner tier (§13.9 law 10)").toEqual([]);
  });
});

describe("ES quality — compounding review", () => {
  it("each module after m1 references a prior-module item in ≥60% of its lessons", () => {
    const bad: string[] = [];
    for (const mod of MODULE_ORDER.slice(1)) {
      const lessons = ES_ALL_LESSONS.filter((l) => moduleOf(l.id) === mod);
      const withReview = lessons.filter((l) => referencesPriorModule(l.steps, mod)).length;
      const floor = Math.ceil(lessons.length * 0.6);
      if (withReview < floor) bad.push(`${mod}=${withReview}/${lessons.length} (floor ${floor})`);
    }
    expect(bad, `weak cross-module review: ${bad.join(", ")}`).toEqual([]);
  });
});
