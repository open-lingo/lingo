/**
 * m45-neo module guards — spine unit n4-16, "Causative させる: make/let
 * someone do". Same module shape as m30-m44 (invariant 25): 8 teaching +
 * 3 review + 1 challenge, reviews spread across thirds, challenge LAST.
 * Like m30-m44 it splices NOTHING in at module level, so the compiled
 * lessons ARE the shipped lessons and the guards run over the whole
 * module.
 *
 * Bespoke ratchets, on top of the standard shape + bar-guard scaffolding
 * every neo module gets:
 *
 *   a. **causative-form TWO-VARIANT RATCHET.** the shared grammarPointId
 *      carries exactly two cards (`godan`, `ichidan-irregular`) — the m44
 *      youda-direct-evidence precedent, generalized to formation classes.
 *   b. **causative-make-vs-let TWO-VARIANT RATCHET.** same shape again,
 *      (`intransitive`, `transitive`) — particle-driven vs adverb/context-
 *      driven MAKE-vs-LET.
 *   c. **NO CAUSATIVE-PASSIVE ANYWHERE RATCHET.** させられる (and any other
 *      causative+passive stack) never appears as a presented Japanese
 *      surface anywhere in this module — that shape is m50/n4-21's alone.
 *   d. **させて いただく RECOGNITION-ONLY RATCHET.** it may appear in
 *      listening-comp/dialogue surfaces but never as a graded production
 *      target (build/translate/particle-cloze).
 *   e. **MAKE-vs-LET NEVER VIA PARTICLE-CLOZE RATCHET.** no particle-cloze
 *      beat in the compiled IR is tagged with the causative-make-vs-let
 *      grammarPointId — that contrast is taught only via sentence/build
 *      MCQ and the dialogue_sim, never a bare-particle fill-in.
 *
 *   Plus: exactly 1 dialogue_sim step (L4's MAKE-vs-LET build-tile scene).
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS } from "../../courseAtoms";
import m44Ir from "../ir/m44.ir.json";
import m45Ir from "../ir/m45.ir.json";
import { M45_NEO_LESSONS } from "../m45-neo";
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

registerJaModuleContentLints("m45");

registerModuleBarGuards({
  moduleLabel: "m45-neo",
  lessons: M45_NEO_LESSONS,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12",
    "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22",
    "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32",
    "m33", "m34", "m35", "m36", "m37", "m38", "m39", "m40", "m41", "m42",
    "m43", "m44",
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
    ...M44_NEO_LESSONS,
  ],
  // Same reason every IR-compiled module since m27 has needed this: this
  // module's own derived-form ledger (よませる／たべさせる／させる／こさせる／
  // あるかせた／そだてさせる／ゆるさない／させて／かえらせて／はやく／こまった)
  // is deliberately NOT registered as a separate courseAtoms row beyond the
  // verb-form/adj-form kind — a derived form is never eligible for its own
  // atom row (irAtomRegistration.test.ts's DERIVED_KINDS rule) — so without
  // this the bar guards' tokenizer cannot see it at all. m44's own newAtoms
  // ride along the same way m44's own test carried m43 forward: this
  // module's L5 backward-spiral lesson reuses m40-adjacent passive phrasing.
  extraVocab: [
    ...(m45Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m45Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m44Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m44Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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
  debutExempt: [
    // Derived verb/adj-form atoms (IR-local, never courseAtoms rows —
    // DERIVED_KINDS exemption). よませる/たべさせる/させる/こさせる are the
    // four canonical causative-ruleset bases (よむ/たべる/する/くる) drilled
    // by L1's godan-only and L3's ichidan+irregular conjugation_transform
    // ramps — pinned directly after each lesson's rule card (moduleCompiler.ts
    // SEQUENCE), so the ramp is unavoidably each form's first exposure and
    // conjugation_transform is deliberately excluded from INTRO_TYPES (inv 37).
    // The remaining seven (あるかせた/そだてさせる/ゆるさない/させて/かえらせて/
    // はやく/こまった) are not ruleset-ramped but are exempted for the same
    // reason as m40's own blanket list: a derived form was never eligible for
    // a courseAtoms row (irAtomRegistration.test.ts's DERIVED_KINDS rule), so
    // it exists only for the tokenizer to see it — requiring it to ALSO clear
    // a debut-type bar is a check this class of token was never meant to
    // satisfy (mirrors m40-neo.test.ts's precedent for its own passive forms).
    "よませる", "たべさせる", "させる", "こさせる",
    "あるかせた", "そだてさせる", "ゆるさない", "させて", "かえらせて", "はやく",
    "こまった",
  ],
});

type CompiledStep = Record<string, unknown> & { type?: string; id?: string };

/**
 * RAW compiled steps — `M45_NEO_LESSONS` directly, deliberately NOT routed
 * through `getMockLessonContent` (the reactive-hint enrichment). m45 has no
 * katakana splicing, so `M45_NEO_LESSONS` already IS what ships.
 */
function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M45_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m45-neo test: lesson ${lessonId} missing`);
  return lesson.steps as CompiledStep[];
}

function allSteps(): { lessonId: string; step: CompiledStep }[] {
  const out: { lessonId: string; step: CompiledStep }[] = [];
  for (const lesson of M45_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) out.push({ lessonId: lesson.id, step });
  }
  return out;
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  for (const lesson of M45_NEO_LESSONS) {
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
  for (const lesson of M45_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      if (step.type === "dialogue_sim") out.push({ lessonId: lesson.id, step: step as SimStep });
    }
  }
  return out;
}

describe("m45-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M45_NEO_LESSONS).toHaveLength(12);
    expect(M45_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M45_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M45_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M45_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("causative-form two-variant ratchet: the shared grammarPointId carries exactly two cards", () => {
  it("m45's own grammarPoints declare causative-form with variants godan and ichidan-irregular", () => {
    const points = (m45Ir as unknown as { grammarPoints: { id: string; variant?: string }[] }).grammarPoints;
    const form = points.filter((g) => g.id === "causative-form");
    expect(form).toHaveLength(2);
    expect(form.map((g) => g.variant).sort()).toEqual(["godan", "ichidan-irregular"]);
  });
});

describe("causative-make-vs-let two-variant ratchet: the shared grammarPointId carries exactly two cards", () => {
  it("m45's own grammarPoints declare causative-make-vs-let with variants intransitive and transitive", () => {
    const points = (m45Ir as unknown as { grammarPoints: { id: string; variant?: string }[] }).grammarPoints;
    const makeVsLet = points.filter((g) => g.id === "causative-make-vs-let");
    expect(makeVsLet).toHaveLength(2);
    expect(makeVsLet.map((g) => g.variant).sort()).toEqual(["intransitive", "transitive"]);
  });
});

describe("no causative-passive anywhere ratchet: させられる is m50/n4-21's alone", () => {
  it("no presented Japanese surface anywhere in this module contains させられ", () => {
    const offenders = presentedSurfaces().filter(({ text }) => text.includes("させられ"));
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });

  it("no presented Japanese surface anywhere in this module contains any other causative+passive stack (verb-stem + せられ／させられ)", () => {
    const offenders = presentedSurfaces().filter(({ text }) => /[せさ]せられ/.test(text));
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });
});

describe("させて いただく recognition-only ratchet", () => {
  it("させて いただく never appears as a graded production target", () => {
    const offenders: string[] = [];
    for (const { lessonId, step } of allSteps()) {
      for (const target of gradedTargets(step)) {
        if (target.includes("させて いただ")) offenders.push(`${lessonId}/${step.id}: "${target}"`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("させて いただく does appear somewhere as a presented (comprehension) surface, so the ratchet is non-vacuous", () => {
    const hits = presentedSurfaces().filter(({ text }) => text.includes("させて いただ"));
    expect(hits.length).toBeGreaterThan(0);
  });

  it("the causative-politeness-recognition grammarPoint's own antiPattern warns specifically against confusing it with causative-passive", () => {
    const points = (m45Ir as unknown as { grammarPoints: { id: string; antiPattern?: { ja: string; why: string } }[] }).grammarPoints;
    const rec = points.find((g) => g.id === "causative-politeness-recognition");
    expect(rec).toBeDefined();
    expect(rec?.antiPattern?.ja).toContain("させられる");
  });
});

describe("MAKE-vs-LET never taught via bare particle-cloze ratchet", () => {
  it("no particle-cloze beat in the compiled IR is tagged with causative-make-vs-let", () => {
    const lessons = (m45Ir as unknown as {
      lessons: { beats: { kind: string; exercises?: string[] }[] }[];
    }).lessons;
    const offenders: string[] = [];
    for (const lesson of lessons) {
      for (const beat of lesson.beats) {
        if (beat.kind === "particle-cloze" && beat.exercises?.includes("causative-make-vs-let")) {
          offenders.push(JSON.stringify(beat));
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("sim ratchet: exactly 1 dialogue_sim step", () => {
  const sims = allSimSteps();

  it("ships exactly 1 sim in the whole module", () => {
    expect(sims).toHaveLength(1);
  });

  it("L4's sim lives at ja-m45-neo-4", () => {
    expect(sims[0]?.lessonId).toBe("ja-m45-neo-4");
  });
});

describe("そうじする cash-in ratchet: the m45 cash-in never grows its own causative form", () => {
  it("no presented Japanese surface anywhere in this module contains そうじさせる", () => {
    const offenders = presentedSurfaces().filter(({ text }) => text.includes("そうじさせる"));
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });

  it("courseAtoms registers そうじする with fromModule === \"m45\"", () => {
    const soujisuru = JA_COURSE_ATOMS.find((a) => a.kana === "そうじする" && a.fromModule === "m45");
    expect(soujisuru).toBeDefined();
  });
});

describe("まかせる dictionary-form-only ratchet: まかせる never appears causative-inflected or te-chained", () => {
  it("no presented Japanese surface contains まかせさせ or まかせて", () => {
    const offenders = presentedSurfaces().filter(
      ({ text }) => text.includes("まかせさせ") || text.includes("まかせて"),
    );
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });
});
