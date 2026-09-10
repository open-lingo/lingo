/**
 * m44-neo module guards — spine unit n4-15, "Evidential-family
 * reassembly: ようだ / みたい / のように・のような". Same module shape as
 * m30-m43 (invariant 25): 8 teaching + 3 review + 1 challenge, reviews
 * spread across thirds, challenge LAST. Like m30-m43 it splices NOTHING
 * in at module level, so the compiled lessons ARE the shipped lessons and
 * the guards run over the whole module.
 *
 * Bespoke ratchets, on top of the standard shape + bar-guard scaffolding
 * every neo module gets:
 *
 *   a. **みたい HOMOGRAPH-OVERRIDE RATCHET.** m13 already registers a
 *      completely different みたい (the たい-form of みる, "want to
 *      watch") as an IR-only tai-form atom with zero courseAtoms.ts
 *      presence. This module registers its OWN みたい (comparative
 *      "seems like") as a `kind: vocab` newAtom with a courseAtoms.ts row
 *      `fromModule: "m44"` — checked directly, plus confirming m13's own
 *      entry is untouched (never edited) and still says "want to watch".
 *   b. **ようだ CONNECTOR-DISCIPLINE RATCHET.** ようだ never stacks
 *      directly onto だ (だようだ is never a graded production target) —
 *      noun/な-adjective hosts must go through の/な.
 *   c. **みたい BARE-NOUN RATCHET.** みたい's own noun rule drops の
 *      entirely — のみたい (ようだ's own connector, wrongly reused) is
 *      never a graded production target anywhere in the module.
 *   d. **SIMILE-の RATCHET.** every occurrence of the simile marker よう
 *      in a graded production target is part of のように/のような — i.e.
 *      always immediately preceded by の, never attached bare to a verb
 *      or adjective the way ように-purpose (forward-flagged n4-19, never
 *      taught here) would be.
 *   e. **youda-direct-evidence TWO-VARIANT RATCHET.** the shared
 *      grammarPointId carries exactly two `variant` cards (`plain`,
 *      `noun-na`) — the m43 hazu intro/spends precedent, generalized a
 *      second time.
 *
 *   Plus: exactly 1 dialogue_sim step (L7's resemblance-domain
 *   integration scene).
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS } from "../../courseAtoms";
import m13Ir from "../ir/m13.ir.json";
import m43Ir from "../ir/m43.ir.json";
import m44Ir from "../ir/m44.ir.json";
import { M44_NEO_LESSONS } from "../m44-neo";
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

registerJaModuleContentLints("m44");

registerModuleBarGuards({
  moduleLabel: "m44-neo",
  lessons: M44_NEO_LESSONS,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12",
    "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22",
    "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32",
    "m33", "m34", "m35", "m36", "m37", "m38", "m39", "m40", "m41", "m42",
    "m43",
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
    ...M43_NEO_LESSONS,
  ],
  // Same reason every IR-compiled module since m27 has needed this: m44's
  // own derived-form ledger (にている) is deliberately NOT registered as a
  // separate courseAtoms row beyond the verb-form kind — a derived form is
  // never eligible for its own atom row (irAtomRegistration.test.ts's
  // DERIVED_KINDS rule) — so without this the bar guards' tokenizer cannot
  // see it at all. m43's own newAtoms ride along for the same reason m43's
  // own test carried m42 forward: m44's reviews reuse m43-adjacent phrasing
  // where applicable (e.g. the challenge's はず/きっと cross-reference).
  extraVocab: [
    ...(m44Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m44Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m43Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m43Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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
 * RAW compiled steps — `M44_NEO_LESSONS` directly, deliberately NOT routed
 * through `getMockLessonContent` (the reactive-hint enrichment). m44 has no
 * katakana splicing, so `M44_NEO_LESSONS` already IS what ships.
 */
function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M44_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m44-neo test: lesson ${lessonId} missing`);
  return lesson.steps as CompiledStep[];
}

function allSteps(): { lessonId: string; step: CompiledStep }[] {
  const out: { lessonId: string; step: CompiledStep }[] = [];
  for (const lesson of M44_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) out.push({ lessonId: lesson.id, step });
  }
  return out;
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  for (const lesson of M44_NEO_LESSONS) {
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
  for (const lesson of M44_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      if (step.type === "dialogue_sim") out.push({ lessonId: lesson.id, step: step as SimStep });
    }
  }
  return out;
}

describe("m44-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M44_NEO_LESSONS).toHaveLength(12);
    expect(M44_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M44_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M44_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M44_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("みたい homograph-override ratchet: this module's comparative みたい is its own atom, not m13's tai-form", () => {
  it("m44's own newAtoms register みたい as kind vocab with a comparative gloss", () => {
    const atoms = (m44Ir as unknown as { newAtoms: { kana: string; kind: string; gloss: string }[] }).newAtoms;
    const mitai = atoms.find((a) => a.kana === "みたい");
    expect(mitai).toBeDefined();
    expect(mitai?.kind).toBe("vocab");
    expect(mitai?.gloss.toLowerCase()).toContain("seems");
  });

  it("courseAtoms registers みたい with fromModule === \"m44\"", () => {
    const mitai = JA_COURSE_ATOMS.find((a) => a.kana === "みたい" && a.fromModule === "m44");
    expect(mitai).toBeDefined();
  });

  it("m13's own みたい (たい-form of みる, 'want to watch') is untouched — the two never merge", () => {
    const atoms = (m13Ir as unknown as { newAtoms: { kana: string; kind: string; gloss: string; derivedFrom?: string }[] }).newAtoms;
    const mitai = atoms.find((a) => a.kana === "みたい");
    expect(mitai).toBeDefined();
    expect(mitai?.kind).toBe("tai-form");
    expect(mitai?.derivedFrom).toBe("みる");
    expect(mitai?.gloss.toLowerCase()).toContain("watch");
  });
});

describe("ようだ connector-discipline ratchet: だ never stacks directly onto ようだ", () => {
  it("no graded production target contains だようだ", () => {
    const offenders: string[] = [];
    for (const { lessonId, step } of allSteps()) {
      for (const target of gradedTargets(step)) {
        if (target.includes("だようだ")) offenders.push(`${lessonId}/${step.id}: "${target}"`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("みたい bare-noun ratchet: の never stacks onto みたい (that connector belongs to ようだ, not its casual twin)", () => {
  it("no graded production target contains のみたい", () => {
    const offenders: string[] = [];
    for (const { lessonId, step } of allSteps()) {
      for (const target of gradedTargets(step)) {
        if (target.includes("のみたい")) offenders.push(`${lessonId}/${step.id}: "${target}"`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("simile-の ratchet: every よう used as a simile in a graded target is part of のように/のような, never bare (guards against forward-referencing ように-purpose)", () => {
  it("every occurrence of ように in a graded production target is immediately preceded by の", () => {
    const offenders: string[] = [];
    for (const { lessonId, step } of allSteps()) {
      for (const target of gradedTargets(step)) {
        let idx = target.indexOf("ように");
        while (idx !== -1) {
          if (idx === 0 || target[idx - 1] !== "の") {
            offenders.push(`${lessonId}/${step.id}: "${target}" (bare ように at ${idx})`);
          }
          idx = target.indexOf("ように", idx + 1);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every occurrence of ような in a graded production target is immediately preceded by の", () => {
    const offenders: string[] = [];
    for (const { lessonId, step } of allSteps()) {
      for (const target of gradedTargets(step)) {
        let idx = target.indexOf("ような");
        while (idx !== -1) {
          if (idx === 0 || target[idx - 1] !== "の") {
            offenders.push(`${lessonId}/${step.id}: "${target}" (bare ような at ${idx})`);
          }
          idx = target.indexOf("ような", idx + 1);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("のように does appear somewhere as a graded target, so the ratchet is non-vacuous", () => {
    const hits: string[] = [];
    for (const { step } of allSteps()) {
      for (const target of gradedTargets(step)) {
        if (target.includes("のように")) hits.push(target);
      }
    }
    expect(hits.length).toBeGreaterThan(0);
  });
});

describe("youda-direct-evidence two-variant ratchet: the shared grammarPointId carries exactly two cards", () => {
  it("m44's own grammarPoints declare youda-direct-evidence with variants plain and noun-na", () => {
    const points = (m44Ir as unknown as { grammarPoints: { id: string; variant?: string }[] }).grammarPoints;
    const youda = points.filter((g) => g.id === "youda-direct-evidence");
    expect(youda).toHaveLength(2);
    expect(youda.map((g) => g.variant).sort()).toEqual(["noun-na", "plain"]);
  });
});

describe("register discipline ratchet: no rung is ever glossed as hearsay or purpose", () => {
  it("no rule prose in this module's grammarPoints mentions hearsay or 'in order to'", () => {
    const points = (m44Ir as unknown as { grammarPoints: { id: string; rule: string }[] }).grammarPoints;
    for (const g of points) {
      expect(g.rule.toLowerCase()).not.toContain("hearsay");
      expect(g.rule.toLowerCase()).not.toContain("in order to");
    }
  });

  // m42 owns hearsay そうだ (plain-stem + そうだ, "I hear that..."). m44's
  // whole evidential family (ようだ/みたい/のように・のような) is DIRECT-EVIDENCE
  // and simile — presenting そうだ anywhere in m44's own surfaces would blur
  // the two families the module's own header exists to keep apart.
  it("never presents m42's hearsay そうだ as a Japanese surface", () => {
    const hits = presentedSurfaces().filter(({ text }) => text.includes("そうだ"));
    expect(hits).toEqual([]);
  });
});

describe("sim ratchet: exactly 1 dialogue_sim step", () => {
  const sims = allSimSteps();

  it("ships exactly 1 sim in the whole module", () => {
    expect(sims).toHaveLength(1);
  });

  it("L7's sim lives at ja-m44-neo-7", () => {
    expect(sims[0]?.lessonId).toBe("ja-m44-neo-7");
  });
});

describe("evidential-family ratchet: the review-object card is framed as a source-of-evidence family, not a strength ladder", () => {
  it("m44's own evidential-family rule prose never says 'ladder'", () => {
    const points = (m44Ir as unknown as { grammarPoints: { id: string; rule: string }[] }).grammarPoints;
    const family = points.find((g) => g.id === "evidential-family");
    expect(family).toBeDefined();
    expect(family?.rule.toLowerCase()).not.toContain("ladder");
  });
});
