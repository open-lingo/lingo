/**
 * m38-neo module guards — spine unit n4-09, "て + helper II: 〜てしまう/ちゃう +
 * 〜ていく/〜てくる". Same 2026-07-26 module shape as m30-m37 (invariant 25):
 * 8 teaching + 3 review + 1 challenge, reviews spread across thirds, challenge
 * LAST. Like m30-m37 it splices NOTHING in at module level, so the compiled
 * lessons ARE the shipped lessons and the guards run over the whole module.
 *
 * m38 is the SECOND helper beat, eight modules after m30's てみる/ておく — the
 * same slot, new residents (てしまう/ちゃう, ていく/てくる). Six bespoke
 * ratchets, on top of the standard shape + bar-guard scaffolding every neo
 * module gets:
 *
 *   a. **SAME-VERB CONTRAST RATCHET.** てしまう's own headline claim (L2,
 *      m38.ir.yaml's own header): the IDENTICAL surface たべてしまった reads
 *      proud over your own dinner and sorry over somebody else's cake — the
 *      tell is the content, never the form. Checked concretely: L2 ships ≥2
 *      steps whose compiled surfaces contain たべてしまった with differing
 *      en-gloss sentiment, and the module contains both named surfaces
 *      (ぜんぶ たべてしまった, ともだちの ケーキを たべてしまった) verbatim.
 *   b. **CONTRACTION-PRODUCTION RATCHET.** ちゃう/じゃう is drilled as
 *      PRODUCTION, not shown as trivia (L3, m38.ir.yaml's own header) — the
 *      third contraction the course has drilled this way (なきゃ m28, とく
 *      m30). Checked: ≥2 of L3's build_sentence steps' correct surfaces
 *      contain ちゃった/じゃった.
 *   c. **SIM RATCHET.** Exactly 2 `dialogue_sim` steps: L3's confession scene
 *      (Mika's umbrella) answers turn 1 with ごめんなさい、こわしちゃった。,
 *      with こわれちゃった sitting in the tile bank as the transitivity-dodge
 *      distractor (m33's doctrine meeting the wince); L10's party-errand
 *      scene (Ken) answers turn 1 with のみものを もっていく。, with もってくる
 *      in the tile bank as the viewpoint-flip distractor — the same journey,
 *      graded from two anchors.
 *   d. **TRAJECTORY-DIRECTION RATCHET.** てくる runs UP TO the present and
 *      cannot reach into a future-marked frame — the rule card's own
 *      antiPattern class (L7, m38.ir.yaml). Checked over every PRESENTED
 *      surface (never a wrong-answer example): これから and あした never
 *      co-occur with てきた in one surface.
 *   e. **HELPER-KANA RATCHET.** m30's "a helper is always ATTACHED" style,
 *      reimplemented for m38's own helper set (m30-neo.test.ts's own comment
 *      names this as the thing to redo here): every てしまう/てしまった/
 *      でしまった/ちゃう/ちゃった/じゃう/じゃった/ていく/ていった/てくる/てきた
 *      surface that appears in a build/listening-build correct surface ships
 *      GLUED — never split across a space in `targetSentence`, and always a
 *      single whole tile in `correctOrder`/`tiles` (never assembled from a
 *      separated stem + helper pair the way m30's てみる/ておく tiles are).
 *   f. **M30-SPIRAL RATCHET.** Review-3's stated job (m38.ir.yaml: "m30's
 *      schema, both waves: みる・おく・しまう・ちゃう・いく・くる") — checked:
 *      review-3's compiled surfaces include ≥1 てみ- or ておく-family surface.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import m37Ir from "../ir/m37.ir.json";
import m38Ir from "../ir/m38.ir.json";
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

registerJaModuleContentLints("m38");

registerModuleBarGuards({
  moduleLabel: "m38-neo",
  lessons: M38_NEO_LESSONS,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12",
    "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22",
    "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32",
    "m33", "m34", "m35", "m36", "m37",
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
  ],
  // Same reason every IR-compiled module since m27 has needed this: m38's own
  // helper/contraction ledger (なくしてしまった, たべちゃった, もっていく,
  // なれてきた, …) is deliberately NOT registered as `courseAtoms` rows — a
  // derived form is never eligible for its own atom row (`irAtomRegistration
  // .test.ts`'s `DERIVED_KINDS` rule) — so without this the bar guards'
  // tokenizer cannot see them at all. m37's own newAtoms are included
  // alongside for the same reason m37's own test carried m36's forward: m38's
  // reviews reuse m37-adjacent phrasing (the shared N4 review-pool nouns).
  extraVocab: [
    ...(m38Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m38Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m37Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m37Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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
  // Same class as m37's みれば/すれば/かえば precedent (see that option's own
  // doc): all eleven of these are lemma/derived-form bare surfaces that the
  // module's authored content NEVER shows standalone — every authored
  // sentence, rule-card example and dialogue line uses the CONJUGATED shape
  // instead (なくしてしまった, こわした, こわれちゃった, ふえてきた, へっていく,
  // かわっていく, なれてきた, まちがえちゃった, もどってくる, つれていく/くる),
  // which the course-wide longest-match tokenizer resolves whole — the bare
  // lemma substring is never separately matched inside it. The one place each
  // bare form's literal text DOES appear is the auto-generated review-pool
  // filler MCQ (`translationMcq`'s `-fill-N` distractor draw, which pulls
  // from all vocabulary already tagged to this module once compileModule
  // registers it) — a path with no authorial control, same rationale as
  // m37's. なくして (the IR-local て-form ledger atom) rides along for an
  // identical reason: `particle_cloze.options` is locally scrubbed from this
  // exact check (moduleBarGuards.ts's own particle_cloze carve-out) so its
  // only non-scrubbed occurrence is likewise an auto-generated fill
  // distractor (ja-m38-neo-9-fill-3). Verified exhaustive by iterating this
  // exact check against the compiled module (2026-08-25): these eleven are
  // the complete offender set; no other m38 word debuts outside an
  // intro-capable step.
  debutExempt: [
    "なくす", "こわす", "こわれる", "ふえる", "へる", "かわる", "なれる",
    "まちがえる", "もどる", "つれる", "なくして",
  ],
});

type CompiledStep = Record<string, unknown> & { type?: string; id?: string };

/**
 * RAW compiled steps — `M38_NEO_LESSONS` directly, deliberately NOT routed
 * through `getMockLessonContent` (the reactive-hint enrichment; see
 * m35-neo.test.ts's header for the full discovery). m38 has no katakana
 * splicing, so `M38_NEO_LESSONS` already IS what ships.
 */
function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M38_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m38-neo test: lesson ${lessonId} missing`);
  return lesson.steps as CompiledStep[];
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  for (const lesson of M38_NEO_LESSONS) {
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
  for (const lesson of M38_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      if (step.type === "dialogue_sim") out.push({ lessonId: lesson.id, step: step as SimStep });
    }
  }
  return out;
}

describe("m38-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M38_NEO_LESSONS).toHaveLength(12);
    expect(M38_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M38_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M38_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M38_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("same-verb contrast ratchet: たべてしまった reads proud at L2's own dinner, sorry over the cake", () => {
  function surfacesWithGloss(lessonId: string, substr: string) {
    return stepsOf(lessonId)
      .map((s) => ({ step: s, surfaces: jaSurfaces(s) }))
      .filter(({ surfaces }) => surfaces.some((t) => t.includes(substr)))
      .map(({ step }) => ({ id: step.id, prompt: String((step as { prompt?: unknown }).prompt ?? "") }));
  }

  it("L2 ships at least 2 steps whose compiled surfaces contain たべてしまった", () => {
    const hits = surfacesWithGloss("ja-m38-neo-2", "たべてしまった");
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });

  it("L2's two たべてしまった steps carry differing sentiment in their en-gloss", () => {
    const hits = surfacesWithGloss("ja-m38-neo-2", "たべてしまった");
    const prompts = hits.map((h) => h.prompt);
    expect(new Set(prompts).size).toBeGreaterThanOrEqual(2);
    expect(prompts.some((p) => /proud/i.test(p))).toBe(true);
    expect(prompts.some((p) => /regret/i.test(p))).toBe(true);
  });

  it("both named surfaces ship verbatim: ぜんぶ たべてしまった and ともだちの ケーキを たべてしまった", () => {
    const texts = presentedSurfaces().map((s) => s.text);
    expect(texts).toContain("ぜんぶ たべてしまった");
    expect(texts).toContain("ともだちの ケーキを たべてしまった");
  });
});

describe("contraction-production ratchet: ちゃった/じゃった drilled as production in L3", () => {
  it("at least 2 of L3's build_sentence steps' correct surfaces contain ちゃった/じゃった", () => {
    const hits = stepsOf("ja-m38-neo-3").filter(
      (s) =>
        s.type === "build_sentence" &&
        jaSurfaces(s).some((t) => t.includes("ちゃった") || t.includes("じゃった")),
    );
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });
});

describe("sim ratchet: exactly 2 dialogue_sim steps, Mika's confession + Ken's party errand", () => {
  const sims = allSimSteps();

  it("ships exactly 2 sims in the whole module", () => {
    expect(sims).toHaveLength(2);
  });

  it("the Mika confession sim (L3) accepts ごめんなさい、こわしちゃった。 on turn 1, with こわれちゃった as a distractor tile", () => {
    const mika = sims.find(({ lessonId }) => lessonId === "ja-m38-neo-3");
    expect(mika).toBeDefined();
    const turn1 = mika!.step.turns[0];
    expect(turn1).toBeDefined();
    expect(turn1.reply.mode).toBe("build");
    const reply = turn1.reply as { mode: "build"; answer: string; tiles?: string[] };
    expect(reply.answer).toBe("ごめんなさい、こわしちゃった。");
    expect(reply.tiles).toContain("こわれちゃった");
  });

  it("the Ken party-errand sim (L10) accepts のみものを もっていく。 on turn 1, with もってくる as a distractor tile", () => {
    const ken = sims.find(({ lessonId }) => lessonId === "ja-m38-neo-10");
    expect(ken).toBeDefined();
    const turn1 = ken!.step.turns[0];
    expect(turn1).toBeDefined();
    expect(turn1.reply.mode).toBe("build");
    const reply = turn1.reply as { mode: "build"; answer: string; tiles?: string[] };
    expect(reply.answer).toBe("のみものを もっていく。");
    expect(reply.tiles).toContain("もってくる");
  });
});

describe("trajectory-direction ratchet: てくる never reaches into a future-marked frame", () => {
  it("no PRESENTED surface has これから or あした co-occurring with てきた (the rule card's own antiPattern class)", () => {
    const offenders = presentedSurfaces().filter(
      (s) => s.text.includes("てきた") && (s.text.includes("これから") || s.text.includes("あした")),
    );
    expect(offenders.map((o) => `${o.lessonId}/${o.stepId}: "${o.text}"`)).toEqual([]);
  });

  it("stays non-vacuous: てきた and あした each ship somewhere in the module (just never together)", () => {
    const texts = presentedSurfaces().map((s) => s.text);
    expect(texts.some((t) => t.includes("てきた"))).toBe(true);
    expect(texts.some((t) => t.includes("あした"))).toBe(true);
  });
});

describe("helper-kana ratchet: every てしまう/ちゃう/ていく/てくる surface ships glued (m30's attached-helper check, reimplemented for m38)", () => {
  // m38's helpers never appear as a separate whitespace-delimited chunk the
  // way m30's みる/おく do — the whole conjugated verb+helper is ledgered and
  // tiled as ONE surface (たべてしまった, not たべて／しまった). So the m30
  // check ("no space directly before a helper CHUNK") is reimplemented here
  // as its m38-shaped equivalent: no helper TAIL is ever preceded by
  // whitespace inside a presented sentence, and every build/listening_build
  // step whose targetSentence carries a helper tail carries that tail INSIDE
  // a single correctOrder/tiles element — never split across two.
  const HELPER_TAILS = [
    "てしまう", "てしまった",
    "でしまう", "でしまった",
    "ちゃう", "ちゃった",
    "じゃう", "じゃった",
    "ていく", "ていった",
    "てくる", "てきた",
  ];

  it("no helper tail is preceded by whitespace in any presented surface", () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const { lessonId, stepId, text } of presentedSurfaces()) {
      for (const tail of HELPER_TAILS) {
        let idx = text.indexOf(tail);
        while (idx !== -1) {
          scanned++;
          const before = text[idx - 1];
          if (before === " " || before === "　")
            offenders.push(`${lessonId}/${stepId}: "…${before}${tail}…" — ${text}`);
          idx = text.indexOf(tail, idx + 1);
        }
      }
    }
    expect(scanned, "no helper-tail occurrences scanned").toBeGreaterThan(30);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every helper tail in a build/listening_build targetSentence ships as ONE glued tile, never split", () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const lesson of M38_NEO_LESSONS) {
      for (const step of stepsOf(lesson.id)) {
        if (step.type !== "build_sentence" && step.type !== "listening_build") continue;
        const rec = step as CompiledStep & { targetSentence?: string; correctOrder?: string[] };
        if (!rec.targetSentence || !Array.isArray(rec.correctOrder)) continue;
        for (const tail of HELPER_TAILS) {
          if (!rec.targetSentence.includes(tail)) continue;
          scanned++;
          const glued = rec.correctOrder.some((t) => t.includes(tail));
          if (!glued)
            offenders.push(
              `${lesson.id}/${rec.id}: "${tail}" in "${rec.targetSentence}" not glued in [${rec.correctOrder.join("·")}]`,
            );
        }
      }
    }
    expect(scanned, "no helper-tail occurrences scanned in build/listening_build").toBeGreaterThan(20);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("m30-spiral ratchet: review-3 reaches back for the てみ-/ておく-family", () => {
  it("ja-m38-neo-review-3's compiled surfaces include at least one てみ- or ておく-family surface", () => {
    const texts = presentedSurfaces()
      .filter((s) => s.lessonId === "ja-m38-neo-review-3")
      .map((s) => s.text);
    const hasSpiral = texts.some((t) => /て(み[るたてない]|お[くいた])/.test(t));
    expect(hasSpiral, texts.join("\n")).toBe(true);
  });
});
