/**
 * m34-neo module guards — spine unit n4-05, "Volitional: よう/おう + とおもう,
 * ことにする". Module shape per invariant 25: 12 lessons = 8 teaching + 3
 * review + 1 challenge, reviews at 4/8/11, challenge LAST. Like m28-m33 it
 * splices NOTHING in at module level, so the compiled lessons ARE the
 * shipped lessons and the guards run over the whole module.
 *
 * Five describe blocks carry this module's OWN pedagogy, on top of the
 * standard shape + bar-guard scaffolding every neo module gets:
 *
 *   1. **THESIS: ましょう IS THE VOLITIONAL, DRESSED UP.** L1 is where the
 *      module states its whole claim — that のみましょう was always のもう
 *      wearing the polite layer. A beat that never puts a plain volitional
 *      and its ましょう counterpart in the same lesson would leave the
 *      thesis a sentence in a rule card instead of something the learner
 *      actually sees twice.
 *   2. **TWO dialogue_sim STEPS, REGISTER-PAIRED.** This is the JA course's
 *      first module with the new `kind: sim` beat, and it is spent on
 *      exactly the grammar point that needs a conversation: an invitation
 *      only exists as a turn in one. L3 (Ken, casual) and L10 (Tanaka,
 *      polite) run the SAME suggestion machine in two registers, and the
 *      polite one must never let がんばろう or しよう — the bare plain
 *      volitional — stand in as the correct reply to a teacher.
 *   3. **THE FIVE WRONG-FORMATION SURFACES ARE DISTRACTOR-ONLY.** たべろう /
 *      のみよう / のむう / くろう / すろう exist in this module so the
 *      learner can reject them — in a cloze's options, in a transform's
 *      distractors. None may ever be the thing the module tells the learner
 *      is correct: a `targetSentence`, a cloze's `correctParticle`, a sim's
 *      accepted reply, a `speaking` target, or a `translate` accepted
 *      answer.
 *   4. **L9 STAYS RECOGNITION-WEIGHTED FOR ようとする.** The spine's own
 *      framing: 〜(よ)うとする is taught as recognition, contrasted against
 *      m30's てみる, not drilled as production. A production (build_sentence)
 *      count over 2 for `you-to-suru` in L9 would mean the lesson quietly
 *      became a production drill for a point the IR declares recognition.
 *   5. **BLOCK C RE-CEMENTED, THE STRONGER CLAIM.** m33's own test already
 *      pins that the *source YAML text* contains all six glance verbs
 *      (はじまる/はじめる/でる/だす/おちる/おとす) — a string-in-file check.
 *      This file does not repeat that; it asserts the stronger thing: all
 *      six actually reach a COMPILED, presented Japanese surface somewhere
 *      in the shipped module (`jaSurfaces`), not merely the source text.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import m33Ir from "../ir/m33.ir.json";
import m34Ir from "../ir/m34.ir.json";
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

registerJaModuleContentLints("m34");

registerModuleBarGuards({
  moduleLabel: "m34-neo",
  lessons: M34_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32", "m33"],
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
  ],
  // Same reason m28-m33 needed this: this module's own volitional surfaces
  // (のもう, たべよう, …) and m33's te-forms/pair verbs exist in neither
  // `courseAtoms` nor the conjugation engine's real-form lexicon, so without
  // them the bar guards' tokenizer cannot see the module's headline
  // vocabulary at all. Declaring them makes them TOKENS, which is what
  // subjects them to the debut check — the opposite of a loosening.
  extraVocab: [
    ...(m34Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m34Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m33Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    // そろそろ ("about time to…") rides the `ru-irregular` grammar point's own
    // example ("そろそろ しよう。") but was never declared in m34's `newAtoms` —
    // an IR gap this test surfaced, not a lesson-beat vocabulary debut. Not a
    // courseAtoms row: it names no formal teaching site (no lesson
    // `introduces:` it), so registering a row would claim a debut that
    // doesn't exist. Declaring it here only makes it a TOKEN the bar guards'
    // tokenizer can see, same as the IR-atom spreads above.
    "そろそろ",
  ],
  // L2's ru-irregular ramp drills all six of `introduces:` (たべよう, みよう,
  // でよう, はじめよう, しよう, こよう), but the rule card's own hand-written
  // examples[] names only four — みよう/でよう never appear before the ramp,
  // which is pinned ahead of every interleaved sentence (moduleCompiler.ts's
  // SEQUENCE comment). See registerModuleBarGuards' `debutExempt` doc.
  // やめよう (L6, `introduces:`): its only occurrence in the lesson is the
  // `mode: listening` beat "おさけを やめようとおもう。" — a listening_build
  // step, correctly excluded from INTRO_TYPES for the same teach-first
  // reason as dialogue_listen (pure audio can't be a NEW word's first
  // exposure). A genuine IR content gap (no build/rule beat uses it), not a
  // taxonomy omission; flagged for Spencer alongside the antiPattern gaps.
  debutExempt: ["みよう", "でよう", "やめよう"],
  canon: COURSE_CANON,
  minLessons: 12,
  maxLessons: 12,
  requireChallengeLast: true,
  requireReviewCount: 3,
  requireChallengeStep: true,
  requireTeachFirst: true,
  requireImageFirst: true,
});

type CompiledStep = Record<string, unknown> & { type?: string; id?: string };

function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M34_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m34-neo test: lesson ${lessonId} missing`);
  const content = getMockLessonContent(lesson.id) ?? lesson;
  return content.steps as CompiledStep[];
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; text: string }[] {
  const out: { lessonId: string; text: string }[] = [];
  for (const lesson of M34_NEO_LESSONS) {
    const content = getMockLessonContent(lesson.id) ?? lesson;
    for (const step of content.steps) {
      for (const s of jaSurfaces(step)) out.push({ lessonId: lesson.id, text: s });
    }
  }
  return out;
}

type SimReply =
  | { mode: "build"; answer: string; alsoAccepted?: string[] }
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
  for (const lesson of M34_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      if (step.type === "dialogue_sim") out.push({ lessonId: lesson.id, step: step as SimStep });
    }
  }
  return out;
}

/** The correct reply text(s) for one sim turn — the reply(s) the module tells
 *  the learner ARE right, resolving `choice` mode's option ids to text. */
function correctReplyTexts(turn: SimTurn): string[] {
  const r = turn.reply;
  if (r.mode === "build") return [r.answer, ...(r.alsoAccepted ?? [])];
  const ids = [r.correctOptionId, ...(r.alsoCorrectOptionIds ?? [])];
  return ids
    .map((id) => r.options.find((o) => o.id === id)?.text)
    .filter((t): t is string => Boolean(t));
}

/** Every surface the module tells the learner IS the answer — never a
 *  distractor, an options entry, or prose. Scoped field-by-field so a
 *  distractor array (cloze `options`, transform `distractors`, a sim's
 *  rejected tiles/options) can never leak in here. */
function answerSurfaces(): { lessonId: string; text: string }[] {
  const out: { lessonId: string; text: string }[] = [];
  const push = (lessonId: string, text: unknown) => {
    if (typeof text === "string" && text) out.push({ lessonId, text });
  };
  for (const lesson of M34_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      switch (step.type) {
        case "build_sentence":
        case "listening_build":
          push(lesson.id, step.targetSentence);
          break;
        case "speaking":
          push(lesson.id, step.targetPhrase);
          break;
        case "particle_cloze":
          push(lesson.id, step.correctParticle);
          break;
        case "translate":
          for (const a of (step.acceptedAnswers as string[] | undefined) ?? [])
            push(lesson.id, a);
          break;
        case "dialogue_sim":
          for (const turn of (step as SimStep).turns)
            for (const t of correctReplyTexts(turn)) push(lesson.id, t);
          break;
        default:
          break;
      }
    }
  }
  return out;
}

describe("m34-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M34_NEO_LESSONS).toHaveLength(12);
    expect(M34_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M34_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M34_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M34_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("thesis: ましょう is the volitional, dressed up", () => {
  // L1 introduces のもう/いこう/かおう/けそう (the plain forms) and its own
  // grammar point (`mashou-is-polite`) exists to reveal のみましょう was
  // always one of these wearing the ます layer. If a plain volitional and a
  // ましょう surface never land in the same lesson, that reveal is a
  // sentence in a rule card the learner is told, not something they see
  // proven twice against the same word.
  const PLAIN_VOLITIONAL = /(のもう|いこう|かおう|けそう|だそう)/;

  it("L1 presents both a plain volitional and a ましょう surface", () => {
    const surfaces = presentedSurfaces().filter((s) => s.lessonId === "ja-m34-neo-1");
    expect(surfaces.length).toBeGreaterThan(0);
    expect(surfaces.some((s) => PLAIN_VOLITIONAL.test(s.text))).toBe(true);
    expect(surfaces.some((s) => s.text.includes("ましょう"))).toBe(true);
  });
});

describe("two dialogue_sim steps, register-paired", () => {
  const sims = allSimSteps();

  it("ships exactly 2 sims in the whole module", () => {
    expect(sims).toHaveLength(2);
  });

  it("the Ken sim (L3) has a build-mode reply", () => {
    const ken = sims.find(({ lessonId }) => lessonId === "ja-m34-neo-3");
    expect(ken).toBeDefined();
    const hasKenBuild = ken!.step.turns.some(
      (t) => t.npc.speaker === "Ken" && t.reply.mode === "build",
    );
    expect(hasKenBuild).toBe(true);
  });

  it("the Tanaka sim (L10) accepts がんばります", () => {
    const tanaka = sims.find(({ lessonId }) => lessonId === "ja-m34-neo-10");
    expect(tanaka).toBeDefined();
    const hasTanakaSpeaker = tanaka!.step.turns.some((t) => t.npc.speaker === "Tanaka");
    expect(hasTanakaSpeaker).toBe(true);
    const allCorrect = tanaka!.step.turns.flatMap(correctReplyTexts);
    expect(allCorrect.some((t) => t.includes("がんばります"))).toBe(true);
  });

  it("the Tanaka sim never accepts a bare plain volitional as the correct reply", () => {
    const BARE_VOLITIONAL = new Set([
      "のもう", "いこう", "かおう", "けそう", "だそう", "あるこう", "はたらこう",
      "がんばろう", "さがそう", "たべよう", "みよう", "でよう", "はじめよう",
      "やめよう", "しよう", "こよう", "あそぼう",
    ]);
    const tanaka = sims.find(({ lessonId }) => lessonId === "ja-m34-neo-10")!;
    const offenders: string[] = [];
    for (const turn of tanaka.step.turns) {
      for (const t of correctReplyTexts(turn)) {
        const stripped = t.replace(/[。、？！\s]/g, "");
        if (BARE_VOLITIONAL.has(stripped)) offenders.push(t);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("the five wrong-formation surfaces are distractor-only", () => {
  const WRONG_FORMATION = ["たべろう", "のみよう", "のむう", "くろう", "すろう"];

  it("declares all five, so the list cannot silently shrink", () => {
    expect(WRONG_FORMATION).toHaveLength(5);
  });

  it("none appears as a correctOrder/answer surface anywhere in the module", () => {
    const offenders: string[] = [];
    for (const { lessonId, text } of answerSurfaces()) {
      for (const w of WRONG_FORMATION) {
        if (text.includes(w)) offenders.push(`${lessonId}: ${text} (${w})`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("L9 stays recognition-weighted for ようとする", () => {
  it("ja-m34-neo-9 has at most 2 build_sentence steps exercising you-to-suru", () => {
    const steps = stepsOf("ja-m34-neo-9");
    const hits = steps.filter(
      (s) =>
        s.type === "build_sentence" &&
        ((s.exercisedGrammar as string[] | undefined) ?? []).includes("you-to-suru"),
    );
    expect(hits.length).toBeLessThanOrEqual(2);
  });
});

describe("block C re-cemented, the stronger claim", () => {
  // m33-neo.test.ts pins the SOURCE TEXT obligation (m34.ir.yaml must
  // contain all six strings) — vacuous until m34 exists, binding now that it
  // does. This block does not repeat that string-in-file check; it asserts
  // the module actually SHIPS every glance verb on a compiled, presented
  // Japanese surface — the thing a learner would actually see.
  const GLANCE = ["はじまる", "はじめる", "でる", "だす", "おちる", "おとす"];

  it("names six glance verbs, one per block-C half", () => {
    expect(GLANCE).toHaveLength(6);
  });

  it("every glance verb reaches a compiled, presented m34 surface", () => {
    // Re-cementing a verb does not require its bare dictionary form — m34's
    // own thesis is that the volitional/past conjugation IS the word in use
    // (だそう, おちた, おとした never contain "だす"/"おちる"/"おとす" as
    // substrings). A verb's family is its bare form plus every m34 newAtom
    // `derivedFrom` it: exactly the set the IR itself declares as that verb's
    // registered surfaces (see the newAtoms block, ir/m34.ir.yaml).
    const newAtoms = (m34Ir as unknown as { newAtoms: { kana: string; derivedFrom?: string }[] })
      .newAtoms;
    const familyOf = (v: string): string[] => [
      v,
      ...newAtoms.filter((a) => a.derivedFrom === v).map((a) => a.kana),
    ];
    const surfaces = presentedSurfaces();
    const missing = GLANCE.filter(
      (v) => !familyOf(v).some((form) => surfaces.some((s) => s.text.includes(form))),
    );
    expect(
      missing,
      `m34 must re-cement m33's glance block on a compiled surface (Spencer 2026-08-19). Missing: ${missing.join(", ")}`,
    ).toEqual([]);
  });
});
