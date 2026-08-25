/**
 * m36-neo module guards — spine unit n4-07, "Looks like: 〜そう(appearance),
 * 〜がる, 〜やすい/にくい, 〜ながら". Module shape per invariant 25: 12 lessons
 * = 8 teaching + 3 review + 1 challenge, reviews at 4/8/11, challenge LAST.
 * Like m30-m35 it splices NOTHING in at module level, so the compiled
 * lessons ARE the shipped lessons and the guards run over the whole module.
 *
 * m36 is an ATTACHMENT-SITE module (m36-neo.ts's own header): every beat
 * hangs a 〜そう/〜がる/〜やすい・にくい/〜ながら surface off a stem the
 * learner already owns, so none of it tokenizes as its own lemma — the whole
 * ledger is IR-only `adj-form`/`verb-form` atoms with `derivedFrom` (the
 * m33-prep tokenizer law m34/m35 also carry forward). Five bespoke ratchets,
 * on top of the standard shape + bar-guard scaffolding every neo module gets:
 *
 *   a. **HEARSAY-ABSENT RATCHET.** そう here is ALWAYS the appearance form
 *      (attaches to a STEM: おいしそう, ふりそう), never hearsay そうだ
 *      (attaches to a DICTIONARY FORM: ふるそうだ, "I hear it's going to
 *      rain") — n4-13, six modules out, and the separation is deliberate
 *      (m36-neo.ts's own header). Appearance そう legitimately RIDES stems
 *      that happen to end in the same kana a dictionary form would
 *      (ふりそうだね is stem ふり + そう + だ + ね, not hearsay), so the check
 *      is scoped to a DICTIONARY-FORM ending directly before そうだ — the one
 *      shape appearance そう can never produce, because appearance そう always
 *      eats the ending first.
 *   b. **THIRD-PERSON がる RATCHET.** がる/たがる's whole point is that
 *      Japanese won't let you claim to read someone else's mind — おとうとは
 *      いきたがっている is legal, わたしは いきたがっている is not (first
 *      person owns たい directly, no がる needed). Checked at the simplest
 *      robust grain: わたし never co-occurs with たがって in one compiled
 *      surface.
 *   c. **SIM RATCHET.** Exactly 2 `dialogue_sim` steps, both built around the
 *      looks-vs-knowledge gap that is this module's whole thesis: L3's dinner
 *      at Mika's has the learner react to food before tasting it, and its
 *      turn-2 answer is the plain adjective やわらかいよ。 — said AFTER the
 *      bite, the moment そう has to drop away (the antiPattern the sou-
 *      appearance grammar card itself names). L10's sky-reading scene has the
 *      learner read ふりそうだね off the clouds, then pivot the plan on m34's
 *      volitional — turn-2's answer is うちで えいがを みよう。, a deliberate
 *      m34 spiral (m36-neo.ts's own header).
 *   d. **ATTACHMENT-LEDGER RATCHET.** Every IR newAtom of kind
 *      `adj-form`/`verb-form` (the derivedFrom ledger — おいしそう, ふりそう,
 *      いきたがっている, つかいやすい, ききながら, たべすぎた, …) must appear
 *      in at least one compiled surface — a ledger entry with no shipped use
 *      would be dead content invisible to every other guard, since these
 *      atoms are deliberately NOT in `courseAtoms` (item 1's own rule) and so
 *      carry no other coverage check.
 *   e. **だけど RATCHET.** The m35 だけ tokenizer landmine (m35-neo.ts's own
 *      header): だけ greedily intercepts unspaced だけど (だ+けど) in the
 *      compile tokenizer, so post-m35 IR must never write it. m36 is the
 *      first module downstream of that landmine to land a registration pass,
 *      so the ratchet starts here.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import m35Ir from "../ir/m35.ir.json";
import m36Ir from "../ir/m36.ir.json";
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

registerJaModuleContentLints("m36");

registerModuleBarGuards({
  moduleLabel: "m36-neo",
  lessons: M36_NEO_LESSONS,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12",
    "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22",
    "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32",
    "m33", "m34", "m35",
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
  ],
  // Same reason every IR-compiled module since m27 has needed this: m36's own
  // derived そう/がる/やすい・にくい/ながら surfaces (おいしそう, ふりそう,
  // いきたがっている, つかいやすい, ききながら, たべすぎた, …) are
  // deliberately NOT registered as `courseAtoms` rows (a derived form is
  // never eligible for its own atom row — `irAtomRegistration.test.ts`'s
  // `DERIVED_KINDS` rule), so without this the bar guards' tokenizer cannot
  // see them at all and every lesson using them would read as "untracked
  // vocabulary." m35's own newAtoms/priorAtoms are included alongside for the
  // same reason m35's own test carried m34's forward: m36's reviews and sim
  // turns reuse m35-adjacent phrasing (favors, register), and declaring the
  // surfaces makes them TOKENS — the opposite of a loosening.
  extraVocab: [
    ...(m36Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m36Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m35Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m35Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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
});

type CompiledStep = Record<string, unknown> & { type?: string; id?: string };

/**
 * RAW compiled steps — `M36_NEO_LESSONS` directly, deliberately NOT routed
 * through `getMockLessonContent` (the reactive-hint enrichment that would
 * embed a grammar point's own examples/antiPattern text onto every step it
 * applies to — see m35-neo.test.ts's header for the full discovery). m36 has
 * no katakana splicing, so `M36_NEO_LESSONS` already IS what ships.
 */
function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M36_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m36-neo test: lesson ${lessonId} missing`);
  return lesson.steps as CompiledStep[];
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  for (const lesson of M36_NEO_LESSONS) {
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
  for (const lesson of M36_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      if (step.type === "dialogue_sim") out.push({ lessonId: lesson.id, step: step as SimStep });
    }
  }
  return out;
}

describe("m36-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M36_NEO_LESSONS).toHaveLength(12);
    expect(M36_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M36_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M36_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M36_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("hearsay-absent ratchet: appearance そう never reads as hearsay そうだ", () => {
  // Hearsay そうだ (n4-13) attaches to a DICTIONARY FORM — ふるそうだ, "I hear
  // it's going to rain". Appearance そう (this module) attaches to a STEM and
  // eats the ending first — ふりそう never becomes ふる+そうだ, so a
  // dictionary-form ending directly before そうだ is the one shape appearance
  // そう can never legitimately produce. ふりそうだね is stem ふり + そう + だ
  // + ね, NOT a dictionary-form hit, and must not trip this.
  const DICTIONARY_SOUDA = /(る|う|く|ぐ|す|つ|ぬ|ぶ|む)そうだ/;

  it("no compiled m36 surface contains a dictionary-form + そうだ sequence", () => {
    const offenders = presentedSurfaces().filter((s) => DICTIONARY_SOUDA.test(s.text));
    expect(
      offenders.map((o) => `${o.lessonId}/${o.stepId}: "${o.text}"`),
    ).toEqual([]);
  });
});

describe("third-person がる ratchet: never claims to read わたし's own mind", () => {
  it("no compiled m36 surface co-occurs わたし with たがって", () => {
    const offenders = presentedSurfaces().filter(
      (s) => s.text.includes("わたし") && s.text.includes("たがって"),
    );
    expect(
      offenders.map((o) => `${o.lessonId}/${o.stepId}: "${o.text}"`),
    ).toEqual([]);
  });
});

describe("sim ratchet: exactly 2 dialogue_sim steps, Mika dinner + Ken sky", () => {
  const sims = allSimSteps();

  it("ships exactly 2 sims in the whole module", () => {
    expect(sims).toHaveLength(2);
  });

  it("the Mika dinner sim (L3) accepts やわらかいよ。 on turn 2 — the plain adjective after tasting", () => {
    const mika = sims.find(({ lessonId }) => lessonId === "ja-m36-neo-3");
    expect(mika).toBeDefined();
    const turn2 = mika!.step.turns[1];
    expect(turn2).toBeDefined();
    expect(turn2.reply.mode).toBe("build");
    expect((turn2.reply as { mode: "build"; answer: string }).answer).toBe("やわらかいよ。");
  });

  it("the Ken sky sim (L10) accepts うちで えいがを みよう。 on turn 2 — the plan pivots on the read", () => {
    const ken = sims.find(({ lessonId }) => lessonId === "ja-m36-neo-10");
    expect(ken).toBeDefined();
    const turn2 = ken!.step.turns[1];
    expect(turn2).toBeDefined();
    expect(turn2.reply.mode).toBe("build");
    expect((turn2.reply as { mode: "build"; answer: string }).answer).toBe("うちで えいがを みよう。");
  });
});

describe("attachment-ledger ratchet: every derived そう/やすい/にくい/ながら/がる atom is used", () => {
  const LEDGER = (m36Ir as unknown as { newAtoms: { kana: string; kind: string }[] }).newAtoms
    .filter((a) => a.kind === "adj-form" || a.kind === "verb-form")
    .map((a) => a.kana);

  it("finds a non-trivial ledger to check at all", () => {
    // Instrument guard — if the IR ever renames `newAtoms` or its `kind`
    // values, this would otherwise report a clean course while checking
    // nothing.
    expect(LEDGER.length).toBeGreaterThan(20);
  });

  it("every IR attachment-form newAtom appears in at least one compiled surface", () => {
    const surfaces = presentedSurfaces().map((s) => s.text);
    const dead = LEDGER.filter((kana) => !surfaces.some((s) => s.includes(kana)));
    expect(dead, "dead ledger entries — declared in the IR but never shipped").toEqual([]);
  });
});

describe("だけど deferral: the m35 だけ tokenizer landmine never recurs", () => {
  it("no compiled m36 surface contains だけど", () => {
    const offenders = presentedSurfaces().filter((s) => s.text.includes("だけど"));
    expect(offenders.map((o) => `${o.lessonId}/${o.stepId}`)).toEqual([]);
  });
});
