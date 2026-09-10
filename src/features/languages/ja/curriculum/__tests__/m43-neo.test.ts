/**
 * m43-neo module guards — spine unit n4-14, "Certainty ladder: 〜かもしれない
 * / 〜はず / でしょう-deepen". Same module shape as m30-m42 (invariant 25):
 * 8 teaching + 3 review + 1 challenge, reviews spread across thirds,
 * challenge LAST. Like m30-m42 it splices NOTHING in at module level, so
 * the compiled lessons ARE the shipped lessons and the guards run over the
 * whole module.
 *
 * Bespoke ratchets, on top of the standard shape + bar-guard scaffolding
 * every neo module gets:
 *
 *   a. **NO STANDALONE かも RATCHET.** かもしれない is registered with kana
 *      "かもしれない" (a fully fused 6-kana atom) — never a standalone
 *      kana:"かも" newAtom, and no presented surface in the module is the
 *      bare string かも. か + も stay the pre-existing free particles they
 *      always were.
 *   b. **だろう NEVER GRADED RATCHET.** だろう only ever appears inside
 *      NPC/Tanaka-voiced dialogue lines (recognition), never as a graded
 *      production target (build/cloze/challenge answer).
 *   c. **にちがいない NEVER GRADED RATCHET.** にちがいない is registered
 *      (recognition-only vocab) but is never its own grammarPointId and
 *      never appears as a graded production target anywhere in the module
 *      — only inside dialogue/listening-comp lines.
 *   d. **ぜったい CASH-IN RATCHET.** courseAtoms's ぜったい stub flips to a
 *      live m43 teaching debut — checked directly: `fromModule === "m43"`.
 *
 *   Plus: exactly 1 dialogue_sim step (L7's mixed-certainty integration
 *   scene).
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS } from "../../courseAtoms";
import m42Ir from "../ir/m42.ir.json";
import m43Ir from "../ir/m43.ir.json";
import { M43_NEO_LESSONS } from "../m43-neo";
import { M42_NEO_LESSONS } from "../m42-neo";
import { M41_NEO_LESSONS } from "../m41-neo";
import { M40_NEO_LESSONS } from "../m40-neo";
import { M39_NEO_LESSONS } from "../m39-neo";
import { M38_NEO_LESSONS } from "../m38-neo";
import { M37_NEO_LESSONS } from "../m37-neo";
import { M36_NEO_LESSONS } from "../m36-neo";
import { M35_NEO_LESSONS } from "../m35-neo";
import { M34_NEO_LESSONS } from "../m34-neo";
import { M33_NEO_LESSONS } from "../m33-neo";
import { M32_NEO_LESSONS } from "../m32-neo";
import { M31_NEO_LESSONS } from "../m31-neo";
import { M30_NEO_LESSONS } from "../m30-neo";
import { M29_NEO_LESSONS } from "../m29-neo";
import { M28_NEO_LESSONS } from "../m28-neo";
import { M27_NEO_LESSONS } from "../m27-neo";
import { M26_NEO_LESSONS } from "../m26-neo";
import { M25_NEO_LESSONS } from "../m25-neo";
import { M24_NEO_LESSONS } from "../m24-neo";
import { M23_NEO_LESSONS } from "../m23-neo";
import { M22_NEO_LESSONS } from "../m22-neo";
import { M21_NEO_LESSONS } from "../m21-neo";
import { M20_NEO_LESSONS } from "../m20-neo";
import { M19_NEO_LESSONS } from "../m19-neo";
import { M18_NEO_LESSONS } from "../m18-neo";
import { M17_NEO_LESSONS } from "../m17-neo";
import { M16_NEO_LESSONS } from "../m16-neo";
import { M15_NEO_LESSONS } from "../m15-neo";
import { M14_NEO_LESSONS } from "../m14-neo";
import { M13_NEO_LESSONS } from "../m13-neo";
import { M12_NEO_LESSONS } from "../m12-neo";
import { M11_NEO_LESSONS } from "../m11-neo";
import { M10_NEO_LESSONS } from "../m10-neo";
import { M9_NEO_LESSONS } from "../m9-neo";
import { M8_NEO_LESSONS } from "../m8-neo";
import { M7_NEO_LESSONS } from "../m7-neo";
import { M3_NEO_LESSONS } from "../m3-neo";
import { M4_NEO_LESSONS } from "../m4-neo";
import { M5_NEO_LESSONS } from "../m5-neo";
import { M6_NEO_LESSONS } from "../m6-neo";

registerJaModuleContentLints("m43");

registerModuleBarGuards({
  moduleLabel: "m43-neo",
  lessons: M43_NEO_LESSONS,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12",
    "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22",
    "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32",
    "m33", "m34", "m35", "m36", "m37", "m38", "m39", "m40", "m41", "m42",
  ],
  priorLessons: [
    ...M3_NEO_LESSONS,
    ...M4_NEO_LESSONS,
    ...M5_NEO_LESSONS,
    ...M6_NEO_LESSONS,
    ...M7_NEO_LESSONS,
    ...M8_NEO_LESSONS,
    ...M9_NEO_LESSONS,
    ...M10_NEO_LESSONS,
    ...M11_NEO_LESSONS,
    ...M12_NEO_LESSONS,
    ...M13_NEO_LESSONS,
    ...M14_NEO_LESSONS,
    ...M15_NEO_LESSONS,
    ...M16_NEO_LESSONS,
    ...M17_NEO_LESSONS,
    ...M18_NEO_LESSONS,
    ...M19_NEO_LESSONS,
    ...M20_NEO_LESSONS,
    ...M21_NEO_LESSONS,
    ...M22_NEO_LESSONS,
    ...M23_NEO_LESSONS,
    ...M24_NEO_LESSONS,
    ...M25_NEO_LESSONS,
    ...M26_NEO_LESSONS,
    ...M27_NEO_LESSONS,
    ...M28_NEO_LESSONS,
    ...M29_NEO_LESSONS,
    ...M30_NEO_LESSONS,
    ...M31_NEO_LESSONS,
    ...M32_NEO_LESSONS,
    ...M33_NEO_LESSONS,
    ...M34_NEO_LESSONS,
    ...M35_NEO_LESSONS,
    ...M36_NEO_LESSONS,
    ...M37_NEO_LESSONS,
    ...M38_NEO_LESSONS,
    ...M39_NEO_LESSONS,
    ...M40_NEO_LESSONS,
    ...M41_NEO_LESSONS,
    ...M42_NEO_LESSONS,
  ],
  // Same reason every IR-compiled module since m27 has needed this: m43's
  // own derived-form ledger (かもしれません) is deliberately NOT registered
  // as a separate courseAtoms row beyond the verb-form kind — a derived
  // form is never eligible for its own atom row (irAtomRegistration.test.ts's
  // DERIVED_KINDS rule) — so without this the bar guards' tokenizer cannot
  // see it at all. m42's own newAtoms ride along for the same reason m42's
  // own test carried m41 forward: m43's reviews reuse m42-adjacent phrasing
  // where applicable.
  extraVocab: [
    ...(m43Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m43Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m42Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m42Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
  ],
  canon: COURSE_CANON,
  minLessons: 12,
  maxLessons: 12,
  requireChallengeLast: true,
  requireReviewCount: 3,
  requireChallengeStep: true,
  requireTeachFirst: true,
  requireImageFirst: true,
  debutExempt: [],
});

type CompiledStep = Record<string, unknown> & { type?: string; id?: string };

/**
 * RAW compiled steps — `M43_NEO_LESSONS` directly, deliberately NOT routed
 * through `getMockLessonContent` (the reactive-hint enrichment). m43 has no
 * katakana splicing, so `M43_NEO_LESSONS` already IS what ships.
 */
function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M43_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m43-neo test: lesson ${lessonId} missing`);
  return lesson.steps as CompiledStep[];
}

function allSteps(): { lessonId: string; step: CompiledStep }[] {
  const out: { lessonId: string; step: CompiledStep }[] = [];
  for (const lesson of M43_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) out.push({ lessonId: lesson.id, step });
  }
  return out;
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  for (const lesson of M43_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      for (const s of jaSurfaces(step)) out.push({ lessonId: lesson.id, stepId: step.id!, text: s });
    }
  }
  return out;
}

/** The GRADED production/target text of a step — the thing the learner
 *  must actually produce or match, not a rule-card legend or a wrong
 *  option. Returns [] for step types with no graded production surface. */
function gradedTargets(step: CompiledStep): string[] {
  const type = step.type;
  if (type === "build_sentence" || type === "listening_build") {
    const t = (step.targetSentence as string | undefined) ?? "";
    return t ? [t] : [];
  }
  if (type === "translate") {
    return (step.acceptedAnswers as string[] | undefined) ?? [];
  }
  if (type === "particle_cloze") {
    // particle_cloze has no single `answer` field — its full-sentence
    // context reconstructs as before + correctParticle + after
    // (grammarHelpers.ts's `particleCloze`, ~line 424).
    const prompt = step.prompt as { before?: string; after?: string } | undefined;
    const particle = step.correctParticle as string | undefined;
    const full = `${prompt?.before ?? ""}${particle ?? ""}${prompt?.after ?? ""}`;
    return full ? [full] : [];
  }
  return [];
}

type SimReply =
  | { mode: "build"; answer: string; alsoAccepted?: string[]; tiles?: string[] }
  | {
      mode: "choice";
      options: { id: string; text: string }[];
      correctOptionId: string;
      alsoCorrectOptionIds?: string[];
    };
type SimTurn = { npc: { speaker: string }; reply: SimReply };
type SimStep = CompiledStep & { type: "dialogue_sim"; turns: SimTurn[] };

function allSimSteps(): { lessonId: string; step: SimStep }[] {
  const out: { lessonId: string; step: SimStep }[] = [];
  for (const lesson of M43_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      if (step.type === "dialogue_sim") out.push({ lessonId: lesson.id, step: step as SimStep });
    }
  }
  return out;
}

describe("m43-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M43_NEO_LESSONS).toHaveLength(12);
    expect(M43_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M43_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M43_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M43_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("no standalone かも ratchet: かもしれない never collapses to a bare か+も atom", () => {
  it("no presented surface in the module is the bare string かも", () => {
    const offenders = presentedSurfaces().filter(({ text }) => text === "かも");
    expect(offenders, JSON.stringify(offenders)).toEqual([]);
  });

  it("m43's own newAtoms never register kana かも (only the fused かもしれない/かもしれません)", () => {
    const kanas = (m43Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana);
    expect(kanas).not.toContain("かも");
    expect(kanas).toContain("かもしれない");
    expect(kanas).toContain("かもしれません");
  });

  it("courseAtoms registers かもしれない as its own fused atom", () => {
    const kamo = JA_COURSE_ATOMS.find((a) => a.kana === "かもしれない");
    expect(kamo).toBeDefined();
    expect(kamo?.fromModule).toBe("m43");
  });
});

describe("だろう never graded ratchet: だろう stays recognition-only throughout", () => {
  it("だろう never appears in a graded production target", () => {
    const offenders: string[] = [];
    for (const { lessonId, step } of allSteps()) {
      for (const target of gradedTargets(step)) {
        if (target.includes("だろう")) offenders.push(`${lessonId}/${step.id}: "${target}"`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("だろう does appear somewhere in the module (recognition dialogue/listening), so the ratchet is non-vacuous", () => {
    const hits = presentedSurfaces().filter(({ text }) => text.includes("だろう"));
    expect(hits.length).toBeGreaterThan(0);
  });
});

describe("にちがいない never graded ratchet: recognition-only, never its own grammarPointId", () => {
  it("にちがいない never appears in a graded production target", () => {
    const offenders: string[] = [];
    for (const { lessonId, step } of allSteps()) {
      for (const target of gradedTargets(step)) {
        if (target.includes("にちがいない")) offenders.push(`${lessonId}/${step.id}: "${target}"`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("にちがいない is not declared as a grammarPointId in this module's IR", () => {
    const ids = (m43Ir as unknown as { grammarPoints: { id: string }[] }).grammarPoints.map(
      (g) => g.id,
    );
    expect(ids).not.toContain("にちがいない");
    expect(ids).not.toContain("nichigainai");
  });

  it("にちがいない does appear somewhere in the module (recognition dialogue/listening), so the ratchet is non-vacuous", () => {
    const hits = presentedSurfaces().filter(({ text }) => text.includes("にちがいない"));
    expect(hits.length).toBeGreaterThan(0);
  });
});

describe("ぜったい cash-in ratchet: the stub flips to a live m43 teaching debut", () => {
  it("courseAtoms registers ぜったい with fromModule === \"m43\" and an introducedByLessonId", () => {
    const zettai = JA_COURSE_ATOMS.find((a) => a.kana === "ぜったい");
    expect(zettai).toBeDefined();
    expect(zettai?.fromModule).toBe("m43");
    expect(zettai?.introducedByLessonId).toBe("ja-m43-neo-2");
  });
});

describe("register discipline ratchet (inv 7, dict-form-first): graded production targets never use the polite かもしれません form", () => {
  it("every graded production target never contains かもしれません — that is a Tanaka-voiced recognition-only dialogue line", () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const { lessonId, step } of allSteps()) {
      for (const target of gradedTargets(step)) {
        scanned++;
        if (target.includes("かもしれません")) {
          offenders.push(`${lessonId}/${step.id}: "${target}"`);
        }
      }
    }
    expect(scanned, "no graded targets scanned").toBeGreaterThan(5);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("sim ratchet: exactly 1 dialogue_sim step", () => {
  const sims = allSimSteps();

  it("ships exactly 1 sim in the whole module", () => {
    expect(sims).toHaveLength(1);
  });

  it("L7's sim lives at ja-m43-neo-7", () => {
    expect(sims[0]?.lessonId).toBe("ja-m43-neo-7");
  });
});
