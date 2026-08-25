/**
 * m35-neo module guards — spine unit n4-06, "Give & receive II:
 * 〜てあげる/てくれる/てもらう + asking favors". Module shape per invariant 25:
 * 12 lessons = 8 teaching + 3 review + 1 challenge, reviews at 4/8/11,
 * challenge LAST. Like m30-m34 it splices NOTHING in at module level, so the
 * compiled lessons ARE the shipped lessons and the guards run over the whole
 * module.
 *
 * The spine's own headline: m30's て+helper slot × m31's transfer verbs — NO
 * new grammar rule, one composition drilled until it is reflex. Five describe
 * blocks carry this module's OWN pedagogy, on top of the standard shape +
 * bar-guard scaffolding every neo module gets:
 *
 *   1. **LADDER-PAIRWISE RATCHET.** L5/L6 introduce the six favor-request
 *      rungs (て / てくれる？ / てくれない？ / てください / てくれませんか /
 *      てもらえますか) PAIRWISE — casual, then polite — per the module's own
 *      RUN-PLAN standing decision; only review-3 assembles them N-way for the
 *      first time. Enforced on `particle_cloze` and `build_sentence` /
 *      `listening_build` / `listening_comprehension` / `dialogue_listen`
 *      surfaces (where the compiler puts one step's worth of REQUEST
 *      surfaces up for a single discrimination): outside review-3, no step
 *      offers 3+ distinct rungs at once. `grammar_rule` and `dialogue_sim`
 *      steps are deliberately excluded from the per-step count — a rule
 *      card's `examples[]` legitimately shows several rungs side by side to
 *      TEACH the contrast (L6's polite-ladder card names くれませんか,
 *      もらえますか AND ください together on purpose, the same way m34's
 *      thesis card pins two examples), and a `dialogue_sim` step bundles
 *      MULTIPLE INDEPENDENT TURNS' tile banks under one step id (L5's sim
 *      turn 1 tiles offer てくれない/てください for one exchange, turn 2's
 *      tiles offer てくれる for an unrelated one) — neither is "assembling
 *      the ladder," and counting them would flag content that was never the
 *      N-way-in-review-3 claim to begin with. Measured against the shipped
 *      module: `ja-m35-neo-review-3-cloze-7` and `-cloze-8` are the two
 *      genuine N-way sites; nothing else qualifies.
 *   2. **しか RATCHET.** Every presented surface containing しか (excluding
 *      the bare particle-only cloze fragments しか/がしか/をしか themselves,
 *      which are single-token option text, not sentences) also carries a
 *      negative marker (ない/ません/なかった) — しか is meaningless without
 *      one, the grammar point's own claim. And がしか/をしか never appear as
 *      an ANSWER surface (a build target, a cloze's resolved
 *      `correctParticle`, a sim's accepted reply) anywhere in the module —
 *      they exist only as the L7/review-2/review-3 clozes' REJECTED options,
 *      the exact "しか REPLACES が/を outright" trap the rule card names.
 *   3. **SIM RATCHET.** Exactly 2 `dialogue_sim` steps, the tier's richest
 *      material in this module (a favor only exists as a turn): L5's Ken
 *      scene (moving day) has a build-mode reply containing はこんでくれない
 *      — the casual ask; L10's Tanaka scene (offering help, the right way)
 *      accepts てつだいましょうか as the correct reply while its tile bank
 *      includes the L2 trap surface てつだってあげる for the learner to
 *      reject.
 *   4. **DIRECTION RATCHET.** てあげる never appears aimed at せんせい
 *      outside the two sites that exist to teach the trap: L2's own
 *      grammar_rule antiPattern (せんせいを てつだってあげます, scrubbed from
 *      `jaSurfaces` course-wide but not from a raw step grep) and the
 *      review-1 listening-comprehension step that re-tests recognition of
 *      the same trap sentence (せんせいを てつだってあげる。, "is this OK to
 *      say to your teacher?" — answer: no). Grepped over RAW compiled step
 *      JSON (not `jaSurfaces`, which would hide the antiPattern site
 *      entirely) for せんせいを...てつだってあげ / せんせいに...てあげ.
 *   5. **つれる DEFERRAL.** The spine cut つれる from this module's vocab
 *      (its natural frame つれていく/つれてくる would front-run m38's
 *      ていく/てくる) — a ratchet that bites if a future edit adds it here
 *      by mistake instead of in m38.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import m34Ir from "../ir/m34.ir.json";
import m35Ir from "../ir/m35.ir.json";
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

registerJaModuleContentLints("m35");

registerModuleBarGuards({
  moduleLabel: "m35-neo",
  lessons: M35_NEO_LESSONS,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12",
    "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22",
    "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32",
    "m33", "m34",
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
  ],
  // Same reason every IR-compiled module since m27 has needed this: m35's own
  // derived verb-form surfaces (てつだって, はこんで, なおして, こまって,
  // くれない, くれた, くれません, もらった, もらえます, あげた,
  // てつだいましょう, たすかった) are deliberately NOT registered as
  // `courseAtoms` rows (a derived form is never eligible for its own atom row
  // — `irAtomRegistration.test.ts`'s `DERIVED_KINDS` rule), so without this
  // the bar guards' tokenizer cannot see them at all and every lesson using
  // them would read as "untracked vocabulary." m34's own newAtoms/priorAtoms
  // are included alongside for the same reason the m34 test carried m33's
  // forward: m35's reviews and sim turns reuse m34-adjacent phrasing, and
  // declaring the surfaces makes them TOKENS — the opposite of a loosening.
  extraVocab: [
    ...(m35Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m35Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m34Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m34Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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
 * RAW compiled steps — `M35_NEO_LESSONS` directly, deliberately NOT routed
 * through `getMockLessonContent`. That getter layers a runtime "reactive
 * hint" enrichment onto steps tied to a `grammarPointId` (`reactiveGrammarTip`
 * / `ruleHint`, a wrong-answer affordance) that EMBEDS the grammar point's own
 * `examples`/`antiPattern` text — including sentence AND tile-pool
 * additions — onto every step the hint applies to. Discovered empirically
 * while building the ratchets below: every step in L2 (te-ageru) carried the
 * lesson's own antiPattern text via `ruleHint.wrongJa`, and every step in L7
 * carried shika-nai's antiPattern the same way, which made per-step surface
 * counting meaningless (every step "contained" the whole rule card). m35 has
 * no katakana splicing (m35-neo.ts's own header: "the compiled order IS the
 * shipped order"), so `M35_NEO_LESSONS` already IS what ships — the reactive
 * hint is a display-time affordance, not authored content, and none of this
 * module's bespoke ratchets are about that layer.
 */
function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M35_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m35-neo test: lesson ${lessonId} missing`);
  return lesson.steps as CompiledStep[];
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  for (const lesson of M35_NEO_LESSONS) {
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
  for (const lesson of M35_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      if (step.type === "dialogue_sim") out.push({ lessonId: lesson.id, step: step as SimStep });
    }
  }
  return out;
}

/** The correct reply text(s) for one sim turn — resolves `choice` mode's
 *  option ids to text, same projection m34-neo.test.ts uses. */
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
 *  rejected tiles/options) can never leak in here — the same projection
 *  m34-neo.test.ts's WRONG_FORMATION check uses. */
function answerSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  const push = (lessonId: string, stepId: string, text: unknown) => {
    if (typeof text === "string" && text) out.push({ lessonId, stepId, text });
  };
  for (const lesson of M35_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      switch (step.type) {
        case "build_sentence":
        case "listening_build":
          push(lesson.id, step.id!, step.targetSentence);
          break;
        case "speaking":
          push(lesson.id, step.id!, step.targetPhrase);
          break;
        case "particle_cloze":
          push(lesson.id, step.id!, step.correctParticle);
          break;
        case "translate":
          for (const a of (step.acceptedAnswers as string[] | undefined) ?? [])
            push(lesson.id, step.id!, a);
          break;
        case "dialogue_sim":
          for (const turn of (step as SimStep).turns)
            for (const t of correctReplyTexts(turn)) push(lesson.id, step.id!, t);
          break;
        default:
          break;
      }
    }
  }
  return out;
}

describe("m35-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M35_NEO_LESSONS).toHaveLength(12);
    expect(M35_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M35_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M35_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M35_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("ladder-pairwise ratchet: casual/polite pairwise, N-way only in review-3", () => {
  // Bare-helper identifiers, WITHOUT a leading て — the compiler's cloze
  // beats attach て to the STEM (「なおして」) and leave the option itself as
  // the bare helper (「くれない」/「ください」/…), so a pattern that demands
  // the て prefix literally would miss every cloze `options` entry and only
  // ever see the ANSWER's fully-concatenated `audioText`. Matching the bare
  // helper catches both the assembled sentence forms (which contain it as a
  // substring) and the cloze option fragments (which ARE it).
  const RUNGS = ["くれる", "くれない", "ください", "くれませんか", "もらえますか"];
  // grammar_rule (a rule card's `examples[]` legitimately shows several rungs
  // side by side to TEACH the contrast — L6's card is exactly this) and
  // dialogue_sim (bundles MULTIPLE INDEPENDENT TURNS' tile banks under one
  // step id) are excluded — see the file header for the measured
  // justification.
  const SCOPED_OUT = new Set(["grammar_rule", "dialogue_sim"]);

  function rungCounts(): { lessonId: string; stepId: string; rungs: Set<string> }[] {
    const out: { lessonId: string; stepId: string; rungs: Set<string> }[] = [];
    for (const lesson of M35_NEO_LESSONS) {
      for (const step of stepsOf(lesson.id)) {
        if (SCOPED_OUT.has(step.type ?? "")) continue;
        const rungs = new Set<string>();
        for (const s of jaSurfaces(step)) for (const r of RUNGS) if (s.includes(r)) rungs.add(r);
        out.push({ lessonId: lesson.id, stepId: step.id!, rungs });
      }
    }
    return out;
  }

  it("outside review-3, no single step offers 3+ distinct request rungs", () => {
    const offenders = rungCounts().filter(
      (r) => r.lessonId !== "ja-m35-neo-review-3" && r.rungs.size >= 3,
    );
    expect(
      offenders.map((o) => `${o.lessonId}/${o.stepId}: [${[...o.rungs].join(", ")}]`),
    ).toEqual([]);
  });

  it("review-3 assembles the ladder N-way at least once", () => {
    const hits = rungCounts().filter(
      (r) => r.lessonId === "ja-m35-neo-review-3" && r.rungs.size >= 3,
    );
    expect(hits.length).toBeGreaterThan(0);
  });
});

describe("しか ratchet: negative-required, never replaces が/を as a taught surface", () => {
  const BARE_FRAGMENTS = new Set(["しか", "がしか", "をしか"]);
  const NEGATIVE = /(ない|ません|なかった)/;

  it("every presented surface containing しか (beyond the bare particle fragments) carries a negative", () => {
    const offenders = presentedSurfaces().filter(
      (s) => s.text.includes("しか") && !BARE_FRAGMENTS.has(s.text) && !NEGATIVE.test(s.text),
    );
    expect(
      offenders.map((o) => `${o.lessonId}/${o.stepId}: "${o.text}"`),
    ).toEqual([]);
  });

  it("がしか / をしか never appear as an answer surface — distractor-only, the しか-replaces-が/を trap", () => {
    const offenders = answerSurfaces().filter(
      (s) => s.text.includes("がしか") || s.text.includes("をしか"),
    );
    expect(
      offenders.map((o) => `${o.lessonId}/${o.stepId}: "${o.text}"`),
    ).toEqual([]);
  });
});

describe("sim ratchet: exactly 2 dialogue_sim steps, Ken casual + Tanaka polite-offer", () => {
  const sims = allSimSteps();

  it("ships exactly 2 sims in the whole module", () => {
    expect(sims).toHaveLength(2);
  });

  it("the Ken sim (L5, moving day) has a build reply containing はこんでくれない", () => {
    const ken = sims.find(({ lessonId }) => lessonId === "ja-m35-neo-5");
    expect(ken).toBeDefined();
    const hasIt = ken!.step.turns.some(
      (t) =>
        t.npc.speaker === "Ken" &&
        t.reply.mode === "build" &&
        t.reply.answer.includes("はこんでくれない"),
    );
    expect(hasIt).toBe(true);
  });

  it("the Tanaka sim (L10) accepts てつだいましょうか and offers the てつだってあげる trap as a tile", () => {
    const tanaka = sims.find(({ lessonId }) => lessonId === "ja-m35-neo-10");
    expect(tanaka).toBeDefined();
    const offerTurn = tanaka!.step.turns.find(
      (t) => t.npc.speaker === "Tanaka" && t.reply.mode === "build",
    );
    expect(offerTurn).toBeDefined();
    const reply = offerTurn!.reply as { mode: "build"; answer: string; tiles?: string[] };
    expect(reply.answer.includes("てつだいましょうか")).toBe(true);
    expect(reply.tiles ?? []).toContain("てつだってあげる");
  });
});

describe("direction ratchet: てあげる aimed at せんせい only in the trap-teaching sites", () => {
  // Grepped over RAW compiled step JSON, not `jaSurfaces` — `jaSurfaces`
  // deliberately scrubs `grammar_rule.antiPattern` (every module's antiPattern
  // is scrubbed course-wide, GATE 6's own projection), which would hide L2's
  // own antiPattern site entirely and defeat the point of this ratchet.
  const NARROW = /せんせいを\s*てつだってあげ|せんせいに[^」]*てあげ/;

  it("only the L2 antiPattern and its recognition re-test in review-1 aim てあげる at せんせい", () => {
    const hits: string[] = [];
    for (const lesson of M35_NEO_LESSONS) {
      for (const step of stepsOf(lesson.id)) {
        if (NARROW.test(JSON.stringify(step))) hits.push(step.id!);
      }
    }
    expect(new Set(hits)).toEqual(
      new Set(["ja-m35-neo-2-rule-te-ageru", "ja-m35-neo-review-1-lc-5"]),
    );
  });
});

describe("つれる deferral: cut from the spine's prefer list, deferred to m38", () => {
  it("no compiled m35 surface contains つれる", () => {
    const offenders = presentedSurfaces().filter((s) => s.text.includes("つれる"));
    expect(offenders.map((o) => `${o.lessonId}/${o.stepId}`)).toEqual([]);
  });
});
