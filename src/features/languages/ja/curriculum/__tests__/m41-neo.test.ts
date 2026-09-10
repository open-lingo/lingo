/**
 * m41-neo module guards — spine unit n4-12, "Transitivity II: 〜てある +
 * the pair families". Same module shape as m30-m40 (invariant 25): 8
 * teaching + 3 review + 1 challenge, reviews spread across thirds,
 * challenge LAST. Like m30-m40 it splices NOTHING in at module level, so
 * the compiled lessons ARE the shipped lessons and the guards run over the
 * whole module.
 *
 * Three bespoke ratchets, on top of the standard shape + bar-guard
 * scaffolding every neo module gets:
 *
 *   a. **てある が-MARKING RATCHET.** Every graded production target tagged
 *      with te-aru, te-aru-vs-te-iru, or te-oku-vs-te-aru whose text
 *      contains てある must mark its object with が, never を — the whole
 *      point of the construction is the を→が promotion when a transitive
 *      verb's て-form takes ある.
 *   b. **かざる EXCEPTION-CLASS RATCHET.** かざる (飾る) ends in -る but
 *      conjugates as godan (a-stem かざら, same exception class as しかる/
 *      かえる/はいる/きる) — checked directly against `courseAtoms.ts`:
 *      registered with `conjugation.class === "godan"`, not "ichidan".
 *   c. **つく／つける NEVER SHIPS RATCHET.** The brief's carried-forward
 *      flag — resolved this module by cutting the pair entirely (see
 *      `ir/m41.ir.yaml`'s header notes and `m41-neo.ts`'s own header for
 *      the full collision writeup). Checked directly: no surface anywhere
 *      in the module tokenizes as bare つける (this module's own
 *      newAtoms never register it), and the pre-existing courseAtoms
 *      `tsuku` (着く, m23) row is untouched.
 *
 *   Plus: exactly 2 dialogue_sim steps (L2's てある core-construction
 *   scene, L9's production-capstone scene), matching the brief's
 *   "2 dialogue_sims" line.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS } from "../../courseAtoms";
import m40Ir from "../ir/m40.ir.json";
import m41Ir from "../ir/m41.ir.json";
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

registerJaModuleContentLints("m41");

registerModuleBarGuards({
  moduleLabel: "m41-neo",
  lessons: M41_NEO_LESSONS,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12",
    "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22",
    "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32",
    "m33", "m34", "m35", "m36", "m37", "m38", "m39", "m40",
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
  ],
  // Same reason every IR-compiled module since m27 has needed this: m41's
  // own て-form ledger (はって, かざって, ならべて, ならんで) is deliberately
  // NOT registered as separate courseAtoms rows beyond the verb-form kind —
  // a derived form is never eligible for its own atom row
  // (irAtomRegistration.test.ts's DERIVED_KINDS rule) — so without this the
  // bar guards' tokenizer cannot see them at all. m40's own newAtoms ride
  // along for the same reason m40's own test carried m39 forward: m41's
  // reviews reuse m40-adjacent phrasing where applicable.
  extraVocab: [
    ...(m41Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m41Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m40Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m40Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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
 * RAW compiled steps — `M41_NEO_LESSONS` directly, deliberately NOT routed
 * through `getMockLessonContent` (the reactive-hint enrichment). m41 has no
 * katakana splicing, so `M41_NEO_LESSONS` already IS what ships.
 */
function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M41_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m41-neo test: lesson ${lessonId} missing`);
  return lesson.steps as CompiledStep[];
}

function allSteps(): { lessonId: string; step: CompiledStep }[] {
  const out: { lessonId: string; step: CompiledStep }[] = [];
  for (const lesson of M41_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) out.push({ lessonId: lesson.id, step });
  }
  return out;
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  for (const lesson of M41_NEO_LESSONS) {
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
  for (const lesson of M41_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      if (step.type === "dialogue_sim") out.push({ lessonId: lesson.id, step: step as SimStep });
    }
  }
  return out;
}

describe("m41-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M41_NEO_LESSONS).toHaveLength(12);
    expect(M41_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M41_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M41_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M41_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("てある が-marking ratchet: every graded てある production target uses が, never を, for its object", () => {
  const TAGGED_POINTS = ["te-aru", "te-aru-vs-te-iru", "te-oku-vs-te-aru"];

  it("every graded target containing てある marks its object with が (or a legitimate topic/contrast variant は・も) and never uses を immediately before the てある clause", () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const { lessonId, step } of allSteps()) {
      const points = (step.exercisedGrammar as string[] | undefined) ?? [];
      if (!points.some((p) => TAGGED_POINTS.includes(p))) continue;
      for (const target of gradedTargets(step)) {
        if (!target.includes("てある")) continue;
        scanned++;
        if (!/[がはも]/.test(target)) {
          offenders.push(`${lessonId}/${step.id}: "${target}" has no が/は/も`);
        }
        // を directly preceding a clause that ends in てある (same clause,
        // no clause boundary punctuation/conjunction between them) would be
        // the exact anti-pattern てある teaches against.
        if (/を[^。、はがも]*てある/.test(target)) {
          offenders.push(`${lessonId}/${step.id}: "${target}" marks the てある object with を`);
        }
      }
    }
    expect(scanned, "no てある graded targets scanned").toBeGreaterThan(5);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("かざる exception-class ratchet: registered godan, not ichidan, despite the -る ending", () => {
  it("courseAtoms registers かざる with conjugation.class === \"godan\"", () => {
    const atom = JA_COURSE_ATOMS.find((a) => a.kana === "かざる");
    expect(atom).toBeDefined();
    expect(atom?.conjugation?.class).toBe("godan");
  });
});

describe("つく／つける collision ratchet: the cut pair never ships, the live m23 atom is untouched", () => {
  it("no surface in the module is the bare string つける", () => {
    const offenders = presentedSurfaces().filter(({ text }) => text === "つける");
    expect(offenders, JSON.stringify(offenders)).toEqual([]);
  });

  it("m41's own newAtoms never register kana つく or つける", () => {
    const kanas = (m41Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana);
    expect(kanas).not.toContain("つく");
    expect(kanas).not.toContain("つける");
  });

  it("courseAtoms's live m23 着く (tsuku) row is untouched: still fromModule m23, unblocked, meaning \"to arrive at\"", () => {
    const atom = JA_COURSE_ATOMS.find((a) => a.id === "tsuku");
    expect(atom).toBeDefined();
    expect(atom?.fromModule).toBe("m23");
    expect((atom as unknown as { blocked?: boolean })?.blocked).not.toBe(true);
    expect(atom?.meaningEn).toBe("to arrive at");
  });
});

describe("sim ratchet: exactly 2 dialogue_sim steps", () => {
  const sims = allSimSteps();

  it("ships exactly 2 sims in the whole module", () => {
    expect(sims).toHaveLength(2);
  });

  it("L2's sim answers turn 1 with まどが あけてある。 and turn 2 with ほんが たなに ならべてある。", () => {
    const l2 = sims.find(({ lessonId }) => lessonId === "ja-m41-neo-2");
    expect(l2).toBeDefined();
    const [turn1, turn2] = l2!.step.turns;
    expect(turn1).toBeDefined();
    expect(turn1.reply.mode).toBe("build");
    expect((turn1.reply as { answer: string }).answer).toBe("まどが あけてある。");
    expect(turn2).toBeDefined();
    expect(turn2.reply.mode).toBe("build");
    expect((turn2.reply as { answer: string }).answer).toBe("ほんが たなに ならべてある。");
  });

  it("L9's sim answers turn 1 with まどが あけてあるし、へやも かざってある。 and turn 2 with ほんが たなに ならべてあるのに、あにが こわした。", () => {
    const l9 = sims.find(({ lessonId }) => lessonId === "ja-m41-neo-9");
    expect(l9).toBeDefined();
    const [turn1, turn2] = l9!.step.turns;
    expect(turn1).toBeDefined();
    expect(turn1.reply.mode).toBe("build");
    expect((turn1.reply as { answer: string }).answer).toBe("まどが あけてあるし、へやも かざってある。");
    expect(turn2).toBeDefined();
    expect(turn2.reply.mode).toBe("build");
    expect((turn2.reply as { answer: string }).answer).toBe(
      "ほんが たなに ならべてあるのに、あにが こわした。",
    );
  });
});
