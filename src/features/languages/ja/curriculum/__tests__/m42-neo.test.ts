/**
 * m42-neo module guards — spine unit n4-13, "Hearsay: 〜そうだ, 〜って,
 * 〜らしい". Same module shape as m30-m41 (invariant 25): 8 teaching + 3
 * review + 1 challenge, reviews spread across thirds, challenge LAST. Like
 * m30-m41 it splices NOTHING in at module level, so the compiled lessons
 * ARE the shipped lessons and the guards run over the whole module.
 *
 * Bespoke ratchets, on top of the standard shape + bar-guard scaffolding
 * every neo module gets:
 *
 *   a. **NO BARE そう RATCHET.** そうだ/そうです is registered with kana
 *      "そうだ"/"そうです" (3/4 morae) — never a standalone kana:"そう" atom
 *      or presented surface (m3's bare そう, agreement interjection, is a
 *      distinct live atom; the two must never be conflated).
 *   b. **NO BARE いって／いった FOR 言う RATCHET.** いっていた/いっていました
 *      is registered as one fused carrier atom — never decomposed into a
 *      standalone いって/いった surface that would collide with m8's/m11's
 *      live 行く atoms (the m18 いった homograph ruling). Scoped to exclude
 *      legitimate 行く forms already live in the course (e.g. きのう いった,
 *      "went yesterday") by checking this module's own newAtoms only.
 *   c. **って FROM-MODULE CASH-IN RATCHET.** courseAtoms's `p-tte` stub has
 *      carried `fromModule: "m18"` (never live content) since m18; this
 *      module cashes it in — checked directly: `fromModule === "m42"`.
 *
 *   Plus: exactly 1 dialogue_sim step (L7's mixed-sources integration scene).
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS } from "../../courseAtoms";
import m41Ir from "../ir/m41.ir.json";
import m42Ir from "../ir/m42.ir.json";
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

registerJaModuleContentLints("m42");

registerModuleBarGuards({
  moduleLabel: "m42-neo",
  lessons: M42_NEO_LESSONS,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12",
    "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22",
    "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32",
    "m33", "m34", "m35", "m36", "m37", "m38", "m39", "m40", "m41",
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
  ],
  // Same reason every IR-compiled module since m27 has needed this: m42's
  // own derived-form ledger (そうです, いっていました) is deliberately NOT
  // registered as separate courseAtoms rows beyond the verb-form kind — a
  // derived form is never eligible for its own atom row
  // (irAtomRegistration.test.ts's DERIVED_KINDS rule) — so without this the
  // bar guards' tokenizer cannot see them at all. m41's own newAtoms ride
  // along for the same reason m41's own test carried m40 forward: m42's
  // reviews reuse m41-adjacent phrasing where applicable.
  extraVocab: [
    ...(m42Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m42Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m41Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m41Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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
 * RAW compiled steps — `M42_NEO_LESSONS` directly, deliberately NOT routed
 * through `getMockLessonContent` (the reactive-hint enrichment). m42 has no
 * katakana splicing, so `M42_NEO_LESSONS` already IS what ships.
 */
function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M42_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m42-neo test: lesson ${lessonId} missing`);
  return lesson.steps as CompiledStep[];
}

function allSteps(): { lessonId: string; step: CompiledStep }[] {
  const out: { lessonId: string; step: CompiledStep }[] = [];
  for (const lesson of M42_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) out.push({ lessonId: lesson.id, step });
  }
  return out;
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  for (const lesson of M42_NEO_LESSONS) {
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
  for (const lesson of M42_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      if (step.type === "dialogue_sim") out.push({ lessonId: lesson.id, step: step as SimStep });
    }
  }
  return out;
}

describe("m42-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M42_NEO_LESSONS).toHaveLength(12);
    expect(M42_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M42_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M42_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M42_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("no bare そう ratchet: そうだ/そうです never collapses to the bare interjection そう", () => {
  it("no presented surface in the module is the bare string そう", () => {
    const offenders = presentedSurfaces().filter(({ text }) => text === "そう");
    expect(offenders, JSON.stringify(offenders)).toEqual([]);
  });

  it("m42's own newAtoms never register kana そう (only そうだ/そうです)", () => {
    const kanas = (m42Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana);
    expect(kanas).not.toContain("そう");
    expect(kanas).toContain("そうだ");
    expect(kanas).toContain("そうです");
  });

  it("courseAtoms registers そうだ as its own atom, distinct from m3's bare そう", () => {
    const souda = JA_COURSE_ATOMS.find((a) => a.kana === "そうだ");
    expect(souda).toBeDefined();
    expect(souda?.fromModule).toBe("m42");
    const sou = JA_COURSE_ATOMS.find((a) => a.kana === "そう" && a.id === "sou");
    expect(sou).toBeDefined();
    expect(sou?.fromModule).not.toBe("m42");
  });
});

describe("no bare いって／いった for 言う ratchet: いっていた is a fused carrier, not a decomposed 言う form", () => {
  it("m42's own newAtoms never register kana いって or いった (only the fused いっていた/いっていました)", () => {
    const kanas = (m42Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana);
    expect(kanas).not.toContain("いって");
    expect(kanas).not.toContain("いった");
    expect(kanas).toContain("いっていた");
    expect(kanas).toContain("いっていました");
  });

  it("courseAtoms's live m8 いって (行く) and m11 いった (行く) rows are untouched", () => {
    const itte = JA_COURSE_ATOMS.find((a) => a.id === "itte");
    expect(itte).toBeDefined();
    expect(itte?.fromModule).toBe("m8");
    const itta = JA_COURSE_ATOMS.find((a) => a.id === "itta-iku");
    expect(itta).toBeDefined();
    expect(itta?.fromModule).toBe("m11");
  });
});

describe("って cash-in ratchet: the p-tte stub flips to a live m42 teaching debut", () => {
  it("courseAtoms registers って with fromModule === \"m42\" and an introducedByLessonId", () => {
    const tte = JA_COURSE_ATOMS.find((a) => a.id === "p-tte");
    expect(tte).toBeDefined();
    expect(tte?.fromModule).toBe("m42");
    expect(tte?.introducedByLessonId).toBe("ja-m42-neo-3");
  });
});

describe("register discipline ratchet (inv 7, dict-form-first): graded production targets never use the polite そうです/いっていました forms", () => {
  it("every graded production target never contains そうです or いっていました — those are Tanaka-voiced recognition-only dialogue lines", () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const { lessonId, step } of allSteps()) {
      for (const target of gradedTargets(step)) {
        scanned++;
        if (target.includes("そうです") || target.includes("いっていました")) {
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

  it("L7's sim lives at ja-m42-neo-7", () => {
    expect(sims[0]?.lessonId).toBe("ja-m42-neo-7");
  });
});
