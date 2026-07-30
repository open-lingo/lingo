/**
 * m14-neo module guards. Same 2026-07-26 module shape as m12/m13
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12/m13 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
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

registerJaModuleContentLints("m14");

registerModuleBarGuards({
  moduleLabel: "m14-neo",
  lessons: M14_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13"],
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
  ],
  canon: COURSE_CANON,
  minLessons: 12,
  maxLessons: 15,
  requireChallengeLast: true,
  requireReviewCount: 3,
  requireChallengeStep: true,
  requireTeachFirst: true,
  requireImageFirst: true,
});

describe("m14-neo module shape (invariant 25)", () => {
  // 14 = the inv-25 shape plus the 2026-07-29 vocab-pack insertion
  // (B065/B067, Spencer-approved wave plan): ja-m14-neo-10 (doors and lights).
  it("ships 14 lessons: 10 teaching + 3 review + 1 challenge", () => {
    expect(M14_NEO_LESSONS).toHaveLength(14);
    const reviews = M14_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M14_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M14_NEO_LESSONS.length - reviews.length - challenge.length).toBe(10);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M14_NEO_LESSONS[M14_NEO_LESSONS.length - 1].id).toBe("ja-m14-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M14_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M14_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

describe("m14-neo owes the spine's て-family grammar points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m14. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced.
   *  `mada-mou` moved onto this row from m22 (spine n06b names もう/まだ as
   *  the canonical ている spend; the ledger was edited, not ignored). */
  const OWED = [
    "te-iru",
    "te-mo-ii",
    "te-wa-ikemasen",
    "naide-kudasai",
    "kudasai",
    "mada-mou",
  ];

  const taughtPoints = new Set(
    M14_NEO_LESSONS.flatMap((l) => l.steps)
      .filter((s) => s.type === "grammar_rule")
      .map((s) => (s as { grammarPointId?: string }).grammarPointId)
      .filter(Boolean) as string[],
  );

  it("teaches every owed grammar point on a rule card", () => {
    expect([...OWED].filter((p) => !taughtPoints.has(p))).toEqual([]);
  });

  it("re-teaches m8's て-form (the ⟳ deepen beat of n02)", () => {
    // The module IS the deepen half of the て tile: the table is rehashed in
    // L1's ください card and on L2's transform ramp, then spent on clause
    // linking in L9 — which carries a SECOND `te-form` card. The ledger row
    // stays m8's (inv 42 forbids inventing an m14-local id for it).
    expect(taughtPoints.has("te-form"), "te-form card missing").toBe(true);
    // てください is PRIOR (m8) and is spent here without its own card: one
    // rule card per lesson is a hard layout constraint — two pinned
    // grammar_rule steps are adjacent same-type steps and fail the bar.
    expect(taughtPoints.has("te-kudasai")).toBe(false);
  });

  it("drills the て table on the conjugation_transform ramp (u-verbs only)", () => {
    const ramp = M14_NEO_LESSONS.flatMap((l) => l.steps).filter(
      (s) => s.type === "conjugation_transform",
    ) as unknown as { form: string; verbClass: string; base: string; answer: string }[];
    expect(ramp.length).toBeGreaterThanOrEqual(3);
    // ONE ramp, on the て-form itself — ている is て + いる, not a new cell,
    // so the drill is the sound-change table, not a new paradigm.
    expect(new Set(ramp.map((s) => s.form))).toEqual(new Set(["te"]));
    expect(ramp.every((s) => s.verbClass === "godan")).toBe(true);
    // Three DIFFERENT rows of that table (る→って, く→いて, む→んで) —
    // the spine's "same form, harder spends".
    // のむ, not すむ: a ramp card prints its BASE as a given, and すむ is taught
    // in no module, so it arrived as a word the learner had never met — and a
    // given is invisible to every debut guard. すんでいる is still taught in L3,
    // as the whole lexical item it is.
    expect(new Set(ramp.map((s) => s.base))).toEqual(
      new Set(["しる", "はたらく", "のむ"]),
    );
  });

  it("no ramp card can emit a form its rule card did not spell out (inv 37)", () => {
    // conjugation_transform is NOT intro-capable and the ramp is PINNED
    // ahead of the interleaved middle, so an answer the rule card omits is a
    // word the learner meets first on a drill. m11, m12 and m13 all learned
    // this the hard way.
    for (const lesson of M14_NEO_LESSONS) {
      const ruleExamples = lesson.steps
        .filter((s) => s.type === "grammar_rule")
        .flatMap((s) => (s as { examples?: { ja: string }[] }).examples ?? [])
        .map((e) => e.ja)
        .join(" ");
      for (const step of lesson.steps) {
        if (step.type !== "conjugation_transform") continue;
        const answer = (step as unknown as { answer: string }).answer;
        expect(
          ruleExamples.includes(answer),
          `${lesson.id}/${step.id}: ramp emits ${answer}, absent from the rule card examples`,
        ).toBe(true);
      }
    }
  });

  it("no ramp card prints a verb whose picture debut has not happened (inv 30/37)", () => {
    // A transform card prints its BASE, the ramp is pinned first, and
    // requireImageFirst reads the raw step JSON — so an imageable new verb
    // can never be its own lesson's ramp material. The three picture debuts
    // are deliberately absent from every rule card, antiPattern and ramp.
    const DEBUTS = ["まつ", "みせる", "およぐ"];
    for (const lesson of M14_NEO_LESSONS) {
      for (const step of lesson.steps) {
        if (step.type !== "grammar_rule" && step.type !== "conjugation_transform") continue;
        const blob = JSON.stringify(step);
        for (const kana of DEBUTS)
          expect(
            blob.includes(kana),
            `${lesson.id}/${step.id} names ${kana}, which must debut on its word_image_mcq`,
          ).toBe(false);
      }
    }
  });

  it("ている is built from て + いる, never shipped as one opaque tile", () => {
    // The module's whole thesis is the composition. If ている were an atom the
    // build tiles would hide it, so every ている build must offer the two
    // pieces separately.
    const offenders: string[] = [];
    for (const lesson of M14_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        const tiles = step.tiles as string[] | undefined;
        if (!Array.isArray(tiles)) continue;
        for (const t of tiles)
          if (/て(いる|いない)$/.test(t) && t.length > 3) offenders.push(`${lesson.id}/${String(step.id)}: ${t}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M14_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });

  it("the permission family is introduced PAIRWISE, never three at once", () => {
    // Pinned sequencing rule: てもいい (L6) then てはいけません (L7), and only
    // then ないでください (L8). A teaching lesson that introduces two of the
    // three cards at once would be the N-way dump the rule forbids; N-way
    // belongs to the reviews and the challenge lesson.
    const FAMILY = new Set(["te-mo-ii", "te-wa-ikemasen", "naide-kudasai"]);
    for (const lesson of M14_NEO_LESSONS) {
      const cards = lesson.steps
        .filter((s) => s.type === "grammar_rule")
        .map((s) => (s as { grammarPointId?: string }).grammarPointId)
        .filter((p): p is string => Boolean(p) && FAMILY.has(p!));
      expect(cards.length, `${lesson.id} teaches ${cards.join(" + ")}`).toBeLessThanOrEqual(1);
    }
  });
});
