/**
 * m39-neo module guards — spine unit n4-10, "Concession & reasons: 〜のに vs
 * 〜ので, 〜ても/〜でも, 〜し". Same module shape as m30-m38 (invariant 25):
 * 8 teaching + 3 review + 1 challenge, reviews spread across thirds, challenge
 * LAST. Like m30-m38 it splices NOTHING in at module level, so the compiled
 * lessons ARE the shipped lessons and the guards run over the whole module.
 *
 * m39's whole job is a minimal-pair discrimination against m16's ので: same
 * joint (plain form, な before noun/な-adj, never だ), opposite register — ので
 * states a reason as flat fact, のに demands the second half CLASH with the
 * first. Five bespoke ratchets, on top of the standard shape + bar-guard
 * scaffolding every neo module gets:
 *
 *   a. **のに EMOTIONAL-COLOUR RATCHET.** m39-neo.ts's own header claim: every
 *      production prompt for のに carries an explicit contradiction/concession
 *      cue ("yet" / "even though") in its en-gloss — a register-neutral gloss
 *      would mean のに has drifted into ので's job. Checked: every
 *      build_sentence step whose targetSentence contains のに has a prompt
 *      containing "yet" or "even though" (case-insensitive).
 *   b. **でも／も CLOSED-SET RATCHET.** L6's own header claim (問疑詞+でも／も,
 *      five fixed phrases memorized as units, never derived, never extended):
 *      checked over every PRESENTED surface — the only 疑問詞+でも／も
 *      combinations that ever appear are なんでも/だれでも/どこでも/だれも/なにも;
 *      no novel combination (いつでも, なにでも, どこも unmodified, etc.) ships
 *      anywhere in the module.
 *   c. **SIM RATCHET.** Exactly 2 `dialogue_sim` steps: L3's weekend-plans
 *      scene (Ken and Tom, rain forecast) answers turn 1 with
 *      あめが ふっても いく。 and turn 2 with いそがしくても いく。; L10's
 *      errand-that-won't-wait scene answers turn 1 with つかれても いく。 and
 *      turn 2 with やすいし、べんりだし、いく。 — the same ても/し pairing,
 *      drilled from two anchors.
 *   d. **し-LISTING BOUNDARY-COLLISION RATCHET.** The greedy longest-match
 *      tokenizer has no backtracking: a し-listing clause immediately
 *      followed by a word starting with お/か/た/て/ぬ/る/ろ can collide with
 *      a real 2-kana courseAtoms word beginning し (しお salt, しか only, した
 *      under, して the te-form of する, しぬ die, しる know, しろ white/do-imp).
 *      Discovered live in this module (し+おいしい collided with しお, し+かう/
 *      かいたい collided with しか) and fixed by REPHRASING the content, never
 *      the compiler (m39.ir.yaml's own notes block). Checked: none of the
 *      three original collision-prone strings (やすいし、おいしいし、かいたい;
 *      うるさくても、いくし、かう; やすいし、べんりだし、かう) ship anywhere,
 *      and every presented し-listing surface tokenizes into real words only
 *      (no untracked 1-char residue immediately after a し-listing boundary).
 *   e. **わからなかった AVOIDANCE RATCHET.** m16.ir.yaml's own notes record
 *      わからなかった as a deliberately-dropped unbuildable surface (わかる's
 *      registry gloss "to be understood" shares no content word with "didn't
 *      understand"; the gloss-mismatch diagnostic is right to reject it). This
 *      module reintroduces the same content point at present tense instead
 *      (だれでも わかるのに、ケンは わからない。) — checked: わからなかった never
 *      appears anywhere in m39.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import m38Ir from "../ir/m38.ir.json";
import m39Ir from "../ir/m39.ir.json";
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

registerJaModuleContentLints("m39");

registerModuleBarGuards({
  moduleLabel: "m39-neo",
  lessons: M39_NEO_LESSONS,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12",
    "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22",
    "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32",
    "m33", "m34", "m35", "m36", "m37", "m38",
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
  ],
  // Same reason every IR-compiled module since m27 has needed this: m39's own
  // te-form and past-tense conjugation ledger (たかくて, いそがしくて, ふって,
  // つかれて, うるさくて, がんばった, やった, おもった, できた, つかれた) is
  // deliberately NOT registered as `courseAtoms` rows — a derived form is
  // never eligible for its own atom row (`irAtomRegistration.test.ts`'s
  // `DERIVED_KINDS` rule) — so without this the bar guards' tokenizer cannot
  // see them at all. m38's own newAtoms ride along for the same reason m38's
  // own test carried m37's forward: m39's reviews reuse m38-adjacent phrasing
  // (the shared N4 review-pool nouns, e.g. しごと).
  extraVocab: [
    ...(m39Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m39Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m38Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m38Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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
 * RAW compiled steps — `M39_NEO_LESSONS` directly, deliberately NOT routed
 * through `getMockLessonContent` (the reactive-hint enrichment; see
 * m35-neo.test.ts's header for the full discovery). m39 has no katakana
 * splicing, so `M39_NEO_LESSONS` already IS what ships.
 */
function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M39_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m39-neo test: lesson ${lessonId} missing`);
  return lesson.steps as CompiledStep[];
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  for (const lesson of M39_NEO_LESSONS) {
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
  for (const lesson of M39_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      if (step.type === "dialogue_sim") out.push({ lessonId: lesson.id, step: step as SimStep });
    }
  }
  return out;
}

describe("m39-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M39_NEO_LESSONS).toHaveLength(12);
    expect(M39_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M39_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M39_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M39_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("のに emotional-colour ratchet: every production prompt carries a contradiction cue", () => {
  it("every build_sentence step whose target contains のに has 'yet' or 'even though' in its prompt", () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const lesson of M39_NEO_LESSONS) {
      for (const step of stepsOf(lesson.id)) {
        if (step.type !== "build_sentence") continue;
        const rec = step as CompiledStep & { targetSentence?: string; prompt?: unknown };
        if (!rec.targetSentence?.includes("のに")) continue;
        scanned++;
        const prompt = String(rec.prompt ?? "");
        if (!/\byet\b/i.test(prompt) && !/even though/i.test(prompt) && !/despite/i.test(prompt))
          offenders.push(`${lesson.id}/${rec.id}: "${rec.targetSentence}" prompt="${prompt}"`);
      }
    }
    expect(scanned, "no のに build_sentence steps scanned").toBeGreaterThan(5);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("でも／も closed-set ratchet: only the five taught 疑問詞+でも／も combinations ever appear", () => {
  const CLOSED_SET = ["なんでも", "だれでも", "どこでも", "だれも", "なにも"];
  // Any でも/も directly preceded by a 疑問詞 stem (なん/だれ/どこ/なに) — this
  // regex finds every occurrence of the PATTERN, then we check it's always
  // one of the five closed-set members, never a novel extension (いつでも,
  // どこでも いい fine, but どこも without a following negative, etc.).
  const QWORD_MO_PATTERN = /(なん|だれ|どこ|なに|いつ)(でも|も)/g;

  it("every 疑問詞+でも／も occurrence across the module is one of the closed-set five", () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const { lessonId, stepId, text } of presentedSurfaces()) {
      const matches = text.matchAll(QWORD_MO_PATTERN);
      for (const m of matches) {
        scanned++;
        if (!CLOSED_SET.includes(m[0]))
          offenders.push(`${lessonId}/${stepId}: "${m[0]}" in "${text}"`);
      }
    }
    expect(scanned, "no 疑問詞+でも／も occurrences scanned").toBeGreaterThan(5);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("stays non-vacuous: at least 3 of the 5 closed-set phrases actually ship", () => {
    const texts = presentedSurfaces().map((s) => s.text);
    const shipped = CLOSED_SET.filter((p) => texts.some((t) => t.includes(p)));
    expect(shipped.length).toBeGreaterThanOrEqual(3);
  });
});

describe("sim ratchet: exactly 2 dialogue_sim steps, Ken/Tom's weekend rain plan + the errand that won't wait", () => {
  const sims = allSimSteps();

  it("ships exactly 2 sims in the whole module", () => {
    expect(sims).toHaveLength(2);
  });

  it("the weekend-plans sim (L3) answers turn 1 with あめが ふっても いく。 and turn 2 with いそがしくても いく。", () => {
    const l3 = sims.find(({ lessonId }) => lessonId === "ja-m39-neo-3");
    expect(l3).toBeDefined();
    const [turn1, turn2] = l3!.step.turns;
    expect(turn1).toBeDefined();
    expect(turn1.reply.mode).toBe("build");
    expect((turn1.reply as { answer: string }).answer).toBe("あめが ふっても いく。");
    expect((turn1.reply as { tiles?: string[] }).tiles).toContain("ふったら");
    expect(turn2).toBeDefined();
    expect(turn2.reply.mode).toBe("build");
    expect((turn2.reply as { answer: string }).answer).toBe("いそがしくても いく。");
  });

  it("the errand-that-won't-wait sim (L10) answers turn 1 with つかれても いく。 and turn 2 with やすいし、べんりだし、いく。", () => {
    const l10 = sims.find(({ lessonId }) => lessonId === "ja-m39-neo-10");
    expect(l10).toBeDefined();
    const [turn1, turn2] = l10!.step.turns;
    expect(turn1).toBeDefined();
    expect(turn1.reply.mode).toBe("build");
    expect((turn1.reply as { answer: string }).answer).toBe("つかれても いく。");
    expect((turn1.reply as { tiles?: string[] }).tiles).toContain("つかれたから");
    expect(turn2).toBeDefined();
    expect(turn2.reply.mode).toBe("build");
    expect((turn2.reply as { answer: string }).answer).toBe("やすいし、べんりだし、いく。");
  });
});

describe("し-listing boundary-collision ratchet: the greedy tokenizer's し+しお/しか traps stay avoided", () => {
  const RETIRED_COLLISIONS = [
    "やすいし、おいしいし、かいたい",
    "うるさくても、いくし、かう",
    "やすいし、べんりだし、かう",
  ];

  it("none of the three original collision-prone strings ship anywhere in the module", () => {
    const texts = presentedSurfaces().map((s) => s.text);
    for (const bad of RETIRED_COLLISIONS) {
      expect(texts.some((t) => t.includes(bad)), `found retired collision string: "${bad}"`).toBe(
        false,
      );
    }
  });

  it("every presented し-listing surface has no untracked 1-char residue immediately after a し boundary", () => {
    // A regression of this bug class looks like a bare kana fragment sitting
    // where a real word should be — e.g. "し、お" never legitimately occurs
    // (おいしい's お would be swallowed whole by the real word, not stranded).
    const offenders: string[] = [];
    for (const { lessonId, stepId, text } of presentedSurfaces()) {
      if (!text.includes("し、")) continue;
      // Known-safe: し directly followed by 、 is the listing particle itself
      // ending a clause — nothing to check there. Flag only a lone kana
      // immediately after "し、" that is itself followed by another 、 or 。
      // within 1-2 chars (the shape a fractured tile takes).
      const idx = text.indexOf("し、");
      const after = text.slice(idx + 2);
      if (/^[ぁ-んー]、/.test(after)) offenders.push(`${lessonId}/${stepId}: "${text}"`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("わからなかった avoidance ratchet: m16's documented dead end stays avoided", () => {
  it("わからなかった never appears anywhere in the module", () => {
    const texts = presentedSurfaces().map((s) => s.text);
    expect(texts.some((t) => t.includes("わからなかった"))).toBe(false);
  });

  it("だれでも わかるのに ケンは わからない ships instead", () => {
    const texts = presentedSurfaces().map((s) => s.text);
    expect(texts.some((t) => t.includes("だれでも") && t.includes("わからない"))).toBe(true);
  });
});
