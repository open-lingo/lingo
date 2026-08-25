/**
 * m37-neo module guards — spine unit n4-08, "Conditionals II: ば + なら".
 * Module shape per invariant 25: 12 lessons = 8 teaching + 3 review + 1
 * challenge, reviews at 4/8/11, challenge LAST. Like m30-m36 it splices
 * NOTHING in at module level, so the compiled lessons ARE the shipped
 * lessons and the guards run over the whole module.
 *
 * m37 teaches ば and なら five modules after たら (m32) — deliberately
 * non-adjacent, because the four conditionals are mutually confusable the
 * way は/が were, and the course already ruled on that class: PAIRWISE on
 * introduction, N-way only on review (RUN-PLAN standing decision 5). Here
 * that means ば vs たら, then なら vs たら — NEVER ば vs なら, and never a
 * 3- or 4-way (m37.ir.yaml's own header; that beat belongs to the m51
 * capstone alone). Five bespoke ratchets, on top of the standard shape +
 * bar-guard scaffolding every neo module gets:
 *
 *   a. **PAIRWISE RATCHET (the module's law).** No compiled step's
 *      option-set or tile-bank spans 3+ distinct conditional hinge classes
 *      (ば-forms: れば/ければ endings; たら-forms: ったら/だったら endings;
 *      なら: なら-ending tiles), AND no single step's options contain both a
 *      ば-form and なら (the never-ば-vs-なら rule) — verified against the
 *      real compiled tile/option content before writing this assertion.
 *   b. **RESTRICTION RATCHET.** ば's mechanical wall (L3, m37.ir.yaml's own
 *      grammar point `ba-restriction`): an ACTION-VERB ば-clause cannot
 *      govern a request/command/invitation main clause. Checked
 *      pragmatically — the three canonical wrong shapes never occur, plus a
 *      general scan for a non-state ければ or a bare れば followed later in
 *      the same surface by ください/ましょう — and kept un-vacuous by
 *      asserting the L5 sim's stated exemption (state-ば + invitation,
 *      てんきが よければ、いこう) is actually shipped.
 *   c. **SIM RATCHET.** Exactly 2 `dialogue_sim` steps: L5's weekend-weather
 *      scene with Mika lives the state-ば exemption on turn 1
 *      (てんきが よければ、いこう。); L10's travel-advice scene with Tom
 *      answers turn 1 with なら as the natural advice conditional
 *      (いくなら、ホテルを よやくした ほうが いい。), with いったら sitting in
 *      the tile bank as the timeline-direction distractor.
 *   d. **UNFREEZE RATCHET.** The module's highest-value five minutes
 *      (m37.ir.yaml's own header): いかなければ ならない has been produced
 *      since m28 as a memorised block, and L1's second rule card reveals
 *      なければ was ない bent into its own ば-form all along — the third
 *      "X was secretly Y" reveal after ました-was-た (m11) and
 *      ましょう-was-volitional (m34). Checked two ways: the reveal's own
 *      rule prose actually states the m28 frame (いかなければ ならない) it is
 *      unfreezing, and L1/L2's compiled JA surfaces carry なければ
 *      FREE-STANDING — never followed by ならない — proving the unfreeze
 *      shipped as production, not just as prose. A third check keeps the
 *      module from re-teaching なければならない as if it were new: no
 *      `grammar_rule` step's `grammarPointId` names the obligation
 *      construction itself (m37 only ever names `ba-form`, the conditional
 *      underneath it).
 *   e. **ば〜ほど RECOGNITION-WEIGHT RATCHET.** L9's `ba-hodo` grammar point
 *      is a recognition rider, not a production point (m37.ir.yaml's own
 *      header: "One shape to recognise, not yet to build") — checked by
 *      capping ja-m37-neo-9's `build_sentence` steps that actually use ほど
 *      at 1, so the doubled-verb shape never becomes the lesson's main
 *      production load.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import m36Ir from "../ir/m36.ir.json";
import m37Ir from "../ir/m37.ir.json";
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

registerJaModuleContentLints("m37");

registerModuleBarGuards({
  moduleLabel: "m37-neo",
  lessons: M37_NEO_LESSONS,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12",
    "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22",
    "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32",
    "m33", "m34", "m35", "m36",
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
  ],
  // Same reason every IR-compiled module since m27 has needed this: m37's own
  // ば-form/adj-form/たら-form/なら-form ledger (いけば, たべれば, よければ,
  // なければ, いくなら, かったら, だったら, …) is deliberately NOT registered
  // as `courseAtoms` rows — a derived form is never eligible for its own atom
  // row (`irAtomRegistration.test.ts`'s `DERIVED_KINDS` rule) — so without
  // this the bar guards' tokenizer cannot see them at all. なら and ほど ARE
  // now registered lemma atoms (courseAtoms.ts, this landing), but the ledger
  // forms built off them are not, hence still need declaring here. m36's own
  // newAtoms are included alongside for the same reason m36's own test
  // carried m35's forward: m37's reviews reuse m36-adjacent phrasing.
  extraVocab: [
    ...(m37Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m37Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m36Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m36Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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
  // Same class as m34-neo-2's みよう/でよう precedent (see this option's own
  // doc): み+れば and する+れば are `ba-form/ru-irregular`'s transform-ramp
  // material (m37-neo-2 `introduces:` names 5 ru/irregular forms; the rule
  // card's hand-written examples cover only 3 of them — たべれば,
  // れんしゅうすれば, くれば — leaving みれば/すれば to debut on the ramp
  // itself). かえば is the same underlying class from a different path: it
  // is `ba-form/shape-u`'s 4th ramp candidate (`introduces:` names 4 u-forms,
  // ramp material caps at 3 per lesson — moduleCompiler.ts's `slice(0, 3)` —
  // so かえば never gets its own ramp card at all) and its actual FIRST
  // compiled surface turns out to be an auto-generated review-pool filler
  // MCQ's distractor option (multiple_choice, L3) — a path with even less
  // authorial control than the ramp, and the same "derived form, no
  // courseAtoms row, exists only for the tokenizer" rationale applies.
  // Verified exhaustive by a temporary probe of this exact check
  // (2026-08-25): no other m37 word debuts outside an intro-capable step.
  debutExempt: ["みれば", "すれば", "かえば"],
});

type CompiledStep = Record<string, unknown> & { type?: string; id?: string };

/**
 * RAW compiled steps — `M37_NEO_LESSONS` directly, deliberately NOT routed
 * through `getMockLessonContent` (the reactive-hint enrichment; see
 * m35-neo.test.ts's header for the full discovery). m37 has no katakana
 * splicing, so `M37_NEO_LESSONS` already IS what ships.
 */
function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M37_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m37-neo test: lesson ${lessonId} missing`);
  return lesson.steps as CompiledStep[];
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  for (const lesson of M37_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      for (const s of jaSurfaces(step)) out.push({ lessonId: lesson.id, stepId: step.id!, text: s });
    }
  }
  return out;
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
  for (const lesson of M37_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      if (step.type === "dialogue_sim") out.push({ lessonId: lesson.id, step: step as SimStep });
    }
  }
  return out;
}

describe("m37-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M37_NEO_LESSONS).toHaveLength(12);
    expect(M37_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M37_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M37_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M37_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("pairwise ratchet: no step mixes 3+ conditional hinges, and ば never meets なら", () => {
  // Classify a bank/option TILE by which conditional hinge it ends in. Not
  // every tile carries one (plain dictionary forms, particles, nouns) — those
  // return null and don't count toward any class.
  const BA_HINGE = /(れば|ければ)$/;
  const TARA_HINGE = /(ったら|だったら)$/;
  const NARA_HINGE = /なら$/;

  function hingeClass(tile: string): "ba" | "tara" | "nara" | null {
    if (BA_HINGE.test(tile)) return "ba";
    if (TARA_HINGE.test(tile)) return "tara";
    if (NARA_HINGE.test(tile)) return "nara";
    return null;
  }

  function optionSetsOf(): { lessonId: string; stepId: string; items: string[] }[] {
    const out: { lessonId: string; stepId: string; items: string[] }[] = [];
    for (const lesson of M37_NEO_LESSONS) {
      for (const step of stepsOf(lesson.id)) {
        const tiles = Array.isArray((step as { tiles?: unknown }).tiles)
          ? ((step as { tiles: string[] }).tiles as string[])
          : [];
        const options = Array.isArray((step as { options?: unknown }).options)
          ? ((step as { options: string[] }).options as string[])
          : [];
        const items = [...tiles, ...options];
        if (items.length) out.push({ lessonId: lesson.id, stepId: step.id!, items });
      }
    }
    return out;
  }

  const sets = optionSetsOf();

  it("finds option-sets/tile-banks to check at all", () => {
    expect(sets.length).toBeGreaterThan(20);
  });

  it("no step's option-set/tile-bank spans 3+ distinct conditional hinge classes", () => {
    const offenders = sets
      .map(({ lessonId, stepId, items }) => ({
        lessonId,
        stepId,
        classes: new Set(items.map(hingeClass).filter((c): c is "ba" | "tara" | "nara" => c !== null)),
      }))
      .filter((o) => o.classes.size >= 3);
    expect(
      offenders.map((o) => `${o.lessonId}/${o.stepId}: {${[...o.classes].join(",")}}`),
    ).toEqual([]);
  });

  it("no step's option-set/tile-bank contains both a ば-form and なら", () => {
    const offenders = sets.filter(({ items }) => {
      const classes = new Set(items.map(hingeClass));
      return classes.has("ba") && classes.has("nara");
    });
    expect(offenders.map((o) => `${o.lessonId}/${o.stepId}`)).toEqual([]);
  });
});

describe("restriction ratchet: action-ば never governs a request/command/invitation", () => {
  const surfaces = presentedSurfaces();
  const texts = surfaces.map((s) => s.text);

  it("never produces the three canonical wrong shapes", () => {
    const bad = ["たべれば、かって", "いけば、きて", "のめば、ください"];
    const offenders = bad.filter((shape) => texts.some((t) => t.includes(shape)));
    expect(offenders).toEqual([]);
  });

  it("no non-state ければ is followed by ください in the same surface", () => {
    const re = /[^よあな]ければ、.*ください/;
    const offenders = surfaces.filter((s) => re.test(s.text));
    expect(offenders.map((o) => `${o.lessonId}/${o.stepId}: "${o.text}"`)).toEqual([]);
  });

  it("no ば-clause is followed by ましょう in the same surface", () => {
    const re = /れば、.*ましょう/;
    const offenders = surfaces.filter((s) => re.test(s.text));
    expect(offenders.map((o) => `${o.lessonId}/${o.stepId}: "${o.text}"`)).toEqual([]);
  });

  it("keeps the exemption alive: state-ば + invitation (よければ、いこう) actually ships", () => {
    expect(texts.some((t) => t.includes("よければ、いこう"))).toBe(true);
  });
});

describe("sim ratchet: exactly 2 dialogue_sim steps, Mika weather + Tom travel advice", () => {
  const sims = allSimSteps();

  it("ships exactly 2 sims in the whole module", () => {
    expect(sims).toHaveLength(2);
  });

  it("the Mika weather sim (L5) accepts てんきが よければ、いこう。 on turn 1", () => {
    const mika = sims.find(({ lessonId }) => lessonId === "ja-m37-neo-5");
    expect(mika).toBeDefined();
    const turn1 = mika!.step.turns[0];
    expect(turn1).toBeDefined();
    expect(turn1.reply.mode).toBe("build");
    expect((turn1.reply as { mode: "build"; answer: string }).answer).toBe(
      "てんきが よければ、いこう。",
    );
  });

  it("the Tom travel-advice sim (L10) accepts いくなら、ホテルを よやくした ほうが いい。 on turn 1, with いったら as a distractor tile", () => {
    const tom = sims.find(({ lessonId }) => lessonId === "ja-m37-neo-10");
    expect(tom).toBeDefined();
    const turn1 = tom!.step.turns[0];
    expect(turn1).toBeDefined();
    expect(turn1.reply.mode).toBe("build");
    const reply = turn1.reply as { mode: "build"; answer: string; tiles?: string[] };
    expect(reply.answer).toBe("いくなら、ホテルを よやくした ほうが いい。");
    expect(reply.tiles).toContain("いったら");
  });
});

describe("unfreeze ratchet: なければ ships free-standing, and なければならない is never re-taught as new", () => {
  it("L1's unfreeze rule card actually states the m28 frame it is unfreezing", () => {
    const unfreeze = stepsOf("ja-m37-neo-1").find(
      (s) => s.type === "grammar_rule" && s.id === "ja-m37-neo-1-rule-ba-form-unfreeze",
    ) as (CompiledStep & { rule?: string }) | undefined;
    expect(unfreeze).toBeDefined();
    expect(unfreeze!.rule).toMatch(/なければ\s*ならない/);
  });

  it("some L1/L2 compiled JA surface carries なければ free-standing (never followed by ならない)", () => {
    const l1l2Surfaces = [...stepsOf("ja-m37-neo-1"), ...stepsOf("ja-m37-neo-2")].flatMap((s) =>
      jaSurfaces(s),
    );
    const freeStanding = l1l2Surfaces.filter(
      (t) => t.includes("なければ") && !/なければ\s*ならない/.test(t),
    );
    expect(freeStanding.length).toBeGreaterThan(0);
  });

  it("no compiled JA surface anywhere in the module re-binds なければ to ならない", () => {
    // The unfreeze's whole point is that なければ never needs ならない again —
    // this is the module-wide converse of the L1/L2 free-standing check.
    const offenders = presentedSurfaces().filter((s) => /なければ\s*ならない/.test(s.text));
    expect(offenders.map((o) => `${o.lessonId}/${o.stepId}: "${o.text}"`)).toEqual([]);
  });

  it("no grammar_rule step's grammarPointId names the obligation construction as if newly taught", () => {
    const offenders: string[] = [];
    for (const lesson of M37_NEO_LESSONS) {
      for (const step of stepsOf(lesson.id)) {
        if (step.type !== "grammar_rule") continue;
        const gpId = String((step as { grammarPointId?: unknown }).grammarPointId ?? "");
        if (/nakereba|naranai/i.test(gpId)) offenders.push(`${lesson.id}/${step.id}: ${gpId}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("ば〜ほど recognition-weight ratchet: L9 caps ほど production at 1 build_sentence step", () => {
  it("ja-m37-neo-9 has at most 1 build_sentence step whose surfaces contain ほど", () => {
    const withHodo = stepsOf("ja-m37-neo-9").filter(
      (s) => s.type === "build_sentence" && jaSurfaces(s).some((t) => t.includes("ほど")),
    );
    expect(withHodo.length).toBeLessThanOrEqual(1);
  });
});
