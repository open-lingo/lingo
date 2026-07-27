/**
 * m12-neo module guards. Same 2026-07-26 module shape as m10/m11
 * (invariant 25), one notch smaller: 9 teaching + 3 review + 1 challenge,
 * reviews spread across thirds, challenge lesson LAST.
 *
 * Unlike m7-m11 this module splices NOTHING in at module level — the
 * katakana programme ended at m11 — so the compiled lessons ARE the shipped
 * lessons and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { M12_NEO_LESSONS } from "./m12-neo";
import { M11_NEO_LESSONS } from "./m11-neo";
import { M10_NEO_LESSONS } from "./m10-neo";
import { M9_NEO_LESSONS } from "./m9-neo";
import { M8_NEO_LESSONS } from "./m8-neo";
import { M7_NEO_LESSONS } from "./m7-neo";
import { M3_NEO_LESSONS } from "./m3-neo";
import { M4_NEO_LESSONS } from "./m4-neo";
import { M5_NEO_LESSONS } from "./m5-neo";
import { M6_NEO_LESSONS } from "./m6-neo";

registerJaModuleContentLints("m12");

registerModuleBarGuards({
  moduleLabel: "m12-neo",
  lessons: M12_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11"],
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

describe("m12-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M12_NEO_LESSONS).toHaveLength(13);
    const reviews = M12_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M12_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M12_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M12_NEO_LESSONS[M12_NEO_LESSONS.length - 1].id).toBe("ja-m12-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M12_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M12_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

describe("m12-neo owes the spine's adjective grammar points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m12. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced. */
  const OWED = [
    "i-adj-present",
    "i-adj-negative",
    "na-adj-present",
    "na-adj-negative",
    "i-adj-past",
    "i-adj-past-negative",
    "na-adj-past",
  ];

  it("teaches every owed grammar point on a rule card", () => {
    const taught = new Set(
      M12_NEO_LESSONS.flatMap((l) => l.steps)
        .filter((s) => s.type === "grammar_rule")
        .map((s) => (s as { grammarPointId?: string }).grammarPointId)
        .filter(Boolean) as string[],
    );
    expect([...OWED].filter((p) => !taught.has(p))).toEqual([]);
  });

  it("drills the い-adjective paradigm on the conjugation_transform ramp", () => {
    const ramp = M12_NEO_LESSONS.flatMap((l) => l.steps).filter(
      (s) => s.type === "conjugation_transform",
    ) as unknown as { form: string; verbClass: string; answer: string }[];
    // Every ramp card is an ADJECTIVE card — no verb cells leak in.
    expect(ramp.every((s) => s.verbClass === "i-adj")).toBe(true);
    // All three derived cells get drilled (present is the dictionary form).
    expect(new Set(ramp.map((s) => s.form))).toEqual(
      new Set(["negative", "past", "past-negative"]),
    );
    expect(ramp.length).toBeGreaterThanOrEqual(9);
  });

  it("no ramp card can emit a form its rule card did not spell out (inv 37)", () => {
    // conjugation_transform is NOT intro-capable and the ramp is PINNED
    // ahead of the interleaved middle, so an answer the rule card omits is a
    // word the learner meets first on a drill. m11 learned this the hard way.
    for (const lesson of M12_NEO_LESSONS) {
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

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M12_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});
