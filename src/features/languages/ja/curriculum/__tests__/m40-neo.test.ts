/**
 * m40-neo module guards — spine unit n4-11, "Passive I: direct passive
 * られる". Same module shape as m30-m39 (invariant 25): 8 teaching + 3
 * review + 1 challenge, reviews spread across thirds, challenge LAST. Like
 * m30-m39 it splices NOTHING in at module level, so the compiled lessons
 * ARE the shipped lessons and the guards run over the whole module.
 *
 * Four bespoke ratchets, on top of the standard shape + bar-guard
 * scaffolding every neo module gets:
 *
 *   a. **COLLISION-STRING RATCHET.** たべられる／みられる／こられる are
 *      byte-identical to m24's already-live POTENTIAL-form atoms (m24
 *      teaches them as "can eat"/"can see"/"can come", not as passive).
 *      m40-neo.ts's own header claim: this module never drills any of the
 *      three as a graded answer. こられる appears exactly once, inside the
 *      ichidan-irregular passive-form grammar point's `examples` (a rule
 *      card's non-graded teach-copy legend, the same status as
 *      TRANSFORM_RULESETS.passive's own reference row) — checked: none of
 *      the three ever appears as the TARGET of a build_sentence,
 *      listening_build, or translate step, as the `answer` of a
 *      particle_cloze step, or inside a challenge step's target.
 *   b. **SUFFERING-PASSIVE RECOGNITION-ONLY RATCHET.** L6's own header
 *      claim (迷惑の受身, ships via rule prose + listening_comprehension +
 *      dialogue ONLY, never a graded production surface): checked — ふられた
 *      and はいられた never appear as the target of a build_sentence,
 *      listening_build, translate, or particle_cloze step, nor inside any
 *      challenge step, anywhere in the module.
 *   c. **AGENT-MARKING RATCHET.** Every graded production step tagged with
 *      passive-rareru, possessed-object-passive, or niyotte-creation-passive
 *      (via `exercisedGrammar`) carries an explicit に (the agent marker,
 *      including によって's own に) somewhere in its target sentence — a
 *      passive sentence with no named agent still has to be MARKING one, or
 *      it isn't drilling what it claims to drill.
 *   d. **しかる EXCEPTION-CLASS RATCHET.** しかる ends in -る but conjugates
 *      as godan (a-stem しから, same exception class as かえる/はいる/きる) —
 *      checked directly against `courseAtoms.ts`: registered with
 *      `conjugation.class === "godan"`, not "ichidan".
 *
 *   Plus: exactly 2 dialogue_sim steps (L2's ほめられた／しかられた scene,
 *   L9's investigation scene), matching the brief's "2 dialogue_sims" line.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS } from "../../courseAtoms";
import m39Ir from "../ir/m39.ir.json";
import m40Ir from "../ir/m40.ir.json";
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

registerJaModuleContentLints("m40");

registerModuleBarGuards({
  moduleLabel: "m40-neo",
  lessons: M40_NEO_LESSONS,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12",
    "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22",
    "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32",
    "m33", "m34", "m35", "m36", "m37", "m38", "m39",
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
  ],
  // Same reason every IR-compiled module since m27 has needed this: m40's own
  // passive-form ledger (ぬすまれる, ほめられる, される, しかられる, こたえた,
  // たのまれる, よばれる, さそわれる, たてられる, はつめいされた,
  // けんきゅうされた, ふられた, はいられた, そうさされた) is deliberately NOT
  // registered as `courseAtoms` rows — a derived form is never eligible for
  // its own atom row (`irAtomRegistration.test.ts`'s `DERIVED_KINDS` rule) —
  // so without this the bar guards' tokenizer cannot see them at all. m39's
  // own newAtoms ride along for the same reason m39's own test carried m38's
  // forward: m40's reviews reuse m39-adjacent phrasing where applicable.
  extraVocab: [
    ...(m40Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m40Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m39Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m39Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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
  // m40's whole passive-form derived ledger — every `kind: verb-form` newAtom
  // in m40.ir.yaml. Two distinct non-authorial paths pin these ahead of an
  // intro-capable step: (1) a lesson's transform ramp (moduleCompiler.ts's
  // SEQUENCE) precedes its own rule card's hand-written `examples[]`, same
  // class as m34's みよう/でよう; (2) the module-wide filler MCQ's `-fill-N`
  // distractor draw pulls from every atom this module declares (`declaredPool`
  // in moduleCompiler.ts, fed by `ir.newAtoms` with no kind filter), same
  // class as m38's なくす/こわす/… list — a path with no authorial control.
  // A derived verb-form was never eligible for a `courseAtoms` row
  // (irAtomRegistration.test.ts's DERIVED_KINDS rule) either way, so it was
  // never meant to clear the debut-type bar.
  debutExempt: [
    "ぬすまれる", "ほめられる", "される", "しかられる", "こたえた",
    "ぬすまれた", "ほめられた", "された", "しかられた",
    "たのまれる", "よばれる", "さそわれる",
    "たのまれた", "よばれた", "さそわれた",
    "たてられる", "たてられた",
    "はつめいされた", "けんきゅうされた",
    "ふられた", "はいられた",
    "そうさされた",
    // はつめい／けんきゅう／そうさ are suru-noun bases (courseAtoms rows,
    // NOT derived) whose only compiled surface in m40 is glued directly onto
    // される/された (はつめいされた／けんきゅうされた／そうさされた, each
    // its OWN registered atom — the whole point of L5/L7 is the creation/
    // investigation passive, so every sentence beat uses the compound, never
    // the bare noun). The compound wins tokenizer longest-match at every
    // authored occurrence, so the bare noun's only STANDALONE token in the
    // whole module is the kanji_reading beat's `kana` field — a step type
    // with no INTRO_TYPES path, same "no authorial control" rationale as the
    // filler-MCQ class above, just via compounding instead of drafting.
    "はつめい", "けんきゅう", "そうさ",
  ],
});

type CompiledStep = Record<string, unknown> & { type?: string; id?: string };

/**
 * RAW compiled steps — `M40_NEO_LESSONS` directly, deliberately NOT routed
 * through `getMockLessonContent` (the reactive-hint enrichment). m40 has no
 * katakana splicing, so `M40_NEO_LESSONS` already IS what ships.
 */
function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M40_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m40-neo test: lesson ${lessonId} missing`);
  return lesson.steps as CompiledStep[];
}

function allSteps(): { lessonId: string; step: CompiledStep }[] {
  const out: { lessonId: string; step: CompiledStep }[] = [];
  for (const lesson of M40_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) out.push({ lessonId: lesson.id, step });
  }
  return out;
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  for (const lesson of M40_NEO_LESSONS) {
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
  for (const lesson of M40_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      if (step.type === "dialogue_sim") out.push({ lessonId: lesson.id, step: step as SimStep });
    }
  }
  return out;
}

describe("m40-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M40_NEO_LESSONS).toHaveLength(12);
    expect(M40_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M40_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M40_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M40_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("collision-string ratchet: たべられる／みられる／こられる never ship as a graded answer", () => {
  const COLLISION_STRINGS = ["たべられる", "みられる", "こられる"];

  it("none of the three collision strings appear as a graded production target anywhere in the module", () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const { lessonId, step } of allSteps()) {
      for (const target of gradedTargets(step)) {
        scanned++;
        for (const bad of COLLISION_STRINGS) {
          if (target.includes(bad)) offenders.push(`${lessonId}/${step.id}: "${target}" contains "${bad}"`);
        }
      }
    }
    expect(scanned, "no graded production targets scanned").toBeGreaterThan(10);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("none of the three collision strings appear anywhere in the module, not even as a rule-card example — the mention lives only in free rule prose (invisible to jaSurfaces)", () => {
    const texts = presentedSurfaces().map((s) => s.text);
    expect(texts.some((t) => t.includes("たべられる"))).toBe(false);
    expect(texts.some((t) => t.includes("みられる"))).toBe(false);
    expect(texts.some((t) => t.includes("こられる"))).toBe(false);
  });
});

describe("suffering-passive recognition-only ratchet: ふられた／はいられた never graded", () => {
  it("neither surface appears as a graded production target anywhere in the module", () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const { lessonId, step } of allSteps()) {
      for (const target of gradedTargets(step)) {
        scanned++;
        if (target.includes("ふられた")) offenders.push(`${lessonId}/${step.id}: "${target}" (ふられた)`);
        if (target.includes("はいられた")) offenders.push(`${lessonId}/${step.id}: "${target}" (はいられた)`);
      }
    }
    expect(scanned, "no graded production targets scanned").toBeGreaterThan(10);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("both surfaces do ship, but only via listening_comprehension or dialogue", () => {
    const carriers = new Set<string>();
    for (const { step } of allSteps()) {
      for (const s of jaSurfaces(step)) {
        if (s.includes("ふられた") || s.includes("はいられた")) carriers.add(step.type ?? "?");
      }
    }
    expect(carriers.size, [...carriers].join(",")).toBeGreaterThan(0);
    for (const t of carriers) {
      expect(["listening_comprehension", "dialogue", "dialogue_listen", "dialogue_sim", "grammar_rule", "multiple_choice"]).toContain(t);
    }
  });
});

describe("agent-marking ratchet: every graded passive-rareru/possessed-object-passive sentence names its agent", () => {
  // niyotte-creation-passive is deliberately EXCLUDED: its own grammarPoint
  // definition documents agentless-される as a legitimate variant ("agentless
  // is common too, when the maker doesn't matter: この きかいは
  // けんきゅうされた") — requiring に on every tagged step would be wrong,
  // not a ratchet.
  const TAGGED_POINTS = ["passive-rareru", "possessed-object-passive"];

  it("every step tagged with one of the three grammar points carries に somewhere in its target text", () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const { lessonId, step } of allSteps()) {
      const points = (step.exercisedGrammar as string[] | undefined) ?? [];
      if (!points.some((p) => TAGGED_POINTS.includes(p))) continue;
      const targets = gradedTargets(step);
      if (!targets.length) continue;
      for (const target of targets) {
        scanned++;
        if (!target.includes("に")) offenders.push(`${lessonId}/${step.id}: "${target}" has no に`);
      }
    }
    expect(scanned, "no tagged graded targets scanned").toBeGreaterThan(10);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("しかる exception-class ratchet: registered godan, not ichidan, despite the -る ending", () => {
  it("courseAtoms registers しかる with conjugation.class === \"godan\"", () => {
    const atom = JA_COURSE_ATOMS.find((a) => a.kana === "しかる");
    expect(atom).toBeDefined();
    expect(atom?.conjugation?.class).toBe("godan");
  });
});

describe("sim ratchet: exactly 2 dialogue_sim steps", () => {
  const sims = allSimSteps();

  it("ships exactly 2 sims in the whole module", () => {
    expect(sims).toHaveLength(2);
  });

  it("L2's sim answers turn 1 with せんせいに ほめられた。 and turn 2 with せんせいに しかられた。", () => {
    const l2 = sims.find(({ lessonId }) => lessonId === "ja-m40-neo-2");
    expect(l2).toBeDefined();
    const [turn1, turn2] = l2!.step.turns;
    expect(turn1).toBeDefined();
    expect(turn1.reply.mode).toBe("build");
    expect((turn1.reply as { answer: string }).answer).toBe("せんせいに ほめられた。");
    expect(turn2).toBeDefined();
    expect(turn2.reply.mode).toBe("build");
    expect((turn2.reply as { answer: string }).answer).toBe("せんせいに しかられた。");
  });

  it("L9's investigation sim answers turn 1 with どろぼうに さいふを ぬすまれた。 and turn 2 with けいさつに そうさされた。", () => {
    const l9 = sims.find(({ lessonId }) => lessonId === "ja-m40-neo-9");
    expect(l9).toBeDefined();
    const [turn1, turn2] = l9!.step.turns;
    expect(turn1).toBeDefined();
    expect(turn1.reply.mode).toBe("build");
    expect((turn1.reply as { answer: string }).answer).toBe("どろぼうに さいふを ぬすまれた。");
    expect(turn2).toBeDefined();
    expect(turn2.reply.mode).toBe("build");
    expect((turn2.reply as { answer: string }).answer).toBe("けいさつに そうさされた。");
  });
});
