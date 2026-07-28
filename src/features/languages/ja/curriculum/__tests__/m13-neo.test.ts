/**
 * m13-neo module guards. Same 2026-07-26 module shape as m12 (invariant 25):
 * 9 teaching + 3 review + 1 challenge, reviews spread across thirds,
 * challenge lesson LAST.
 *
 * Like m12 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
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

registerJaModuleContentLints("m13");

registerModuleBarGuards({
  moduleLabel: "m13-neo",
  lessons: M13_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12"],
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

describe("m13-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M13_NEO_LESSONS).toHaveLength(13);
    const reviews = M13_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M13_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M13_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M13_NEO_LESSONS[M13_NEO_LESSONS.length - 1].id).toBe("ja-m13-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M13_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M13_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

describe("m13-neo owes the spine's wanting grammar points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m13. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced. */
  const OWED = ["v-tai", "ga-hoshii", "suki-kirai-no", "no-ga-suki"];

  const taughtPoints = new Set(
    M13_NEO_LESSONS.flatMap((l) => l.steps)
      .filter((s) => s.type === "grammar_rule")
      .map((s) => (s as { grammarPointId?: string }).grammarPointId)
      .filter(Boolean) as string[],
  );

  it("teaches every owed grammar point on a rule card", () => {
    expect([...OWED].filter((p) => !taughtPoints.has(p))).toEqual([]);
  });

  it("re-teaches m12's い-adjective cells with たい as the base (the module's whole argument)", () => {
    // たい needs NO new conjugation machinery — it IS an い-adjective. The
    // three derived cells therefore reuse m12's registry ids rather than
    // inventing たい-specific ones (inv 42).
    for (const p of ["i-adj-negative", "i-adj-past", "i-adj-past-negative"]) {
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
    }
  });

  it("drills the たい paradigm on the conjugation_transform ramp", () => {
    const ramp = M13_NEO_LESSONS.flatMap((l) => l.steps).filter(
      (s) => s.type === "conjugation_transform",
    ) as unknown as { form: string; verbClass: string; base: string; answer: string }[];

    // TWO ENGINES, AND THE SPLIT IS THE POINT (revised 2026-07-28).
    //
    // This used to assert that EVERY ramp card was an い-adjective card, on
    // the grounds that "たい needs no new conjugation machinery — it IS an
    // い-adjective". That rationale is about the registry ids (inv 42: the
    // three cells reuse m12's `i-adj-*` rather than inventing たい-specific
    // ones) and it still holds. But it had hardened into a claim about the
    // ramp, and what it was really describing was an ABSENCE: only the three
    // derived cells had a `conjugation:` block, so the card that MAKES たい —
    // the module's headline rule — drilled nothing. Same gap m7 had with ます.
    //
    // MAKING たい is a verb operation (find the ます-stem, which is class
    // -dependent); BENDING it is an adjective operation. So the ramp must
    // show both, and each half must stay on its own engine.
    const making = ramp.filter((s) => s.form === "tai");
    const bending = ramp.filter((s) => s.form !== "tai");

    // Formation: dictionary verb in, たい out, on a VERB class.
    expect(making.length).toBeGreaterThanOrEqual(3);
    expect(making.every((s) => s.verbClass !== "i-adj")).toBe(true);
    expect(making.every((s) => !s.base.endsWith("たい"))).toBe(true);
    expect(making.every((s) => s.answer.endsWith("たい"))).toBe(true);

    // Cells: たい in, bent たい out, on the i-adj engine — never a bare verb
    // conjugated as an adjective, which is the bug this half guards.
    expect(bending.every((s) => s.verbClass === "i-adj")).toBe(true);
    expect(bending.every((s) => s.base.endsWith("たい"))).toBe(true);

    // The whole four-cell table: たい, たくない, たかった, たくなかった.
    expect(new Set(ramp.map((s) => s.form))).toEqual(
      new Set(["tai", "negative", "past", "past-negative"]),
    );
    expect(ramp.length).toBeGreaterThanOrEqual(12);
  });

  it("no ramp card can emit a form its rule card did not spell out (inv 37)", () => {
    // conjugation_transform is NOT intro-capable and the ramp is PINNED
    // ahead of the interleaved middle, so an answer the rule card omits is a
    // word the learner meets first on a drill. m11 and m12 both learned this.
    for (const lesson of M13_NEO_LESSONS) {
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

  it("never produces a THIRD-PERSON たい assertion (〜たがる is N4/m36)", () => {
    // Spine n05's binding authoring constraint: たい drills are first-person
    // statements + second-person questions only. A flat 「Xは …たい。」 about a
    // named third party needs たがっている and is out of scope. Questions
    // (…？) do not assert, and the v-tai card's antiPattern is the error
    // shown as WRONG, so both are exempt.
    const NAMES = ["トム", "ミカ", "ケン", "たなか"];
    const offenders: string[] = [];
    for (const lesson of M13_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        const surfaces: string[] = [];
        for (const key of ["targetSentence", "target", "audioText", "targetPhrase"]) {
          const v = step[key];
          if (typeof v === "string") surfaces.push(v);
        }
        if (step.type === "dialogue_listen")
          for (const l of (step.lines as { kana?: string }[] | undefined) ?? [])
            if (l.kana) surfaces.push(l.kana);
        for (const s of surfaces) {
          for (const sentence of s.split(/[。？！]/)) {
            if (!/た[いくか]/.test(sentence)) continue;
            if (!/(たい|たくない|たかった|たくなかった)\s*$/.test(sentence.trim())) continue;
            for (const n of NAMES) {
              if (new RegExp(`${n}(は|も)`).test(sentence))
                offenders.push(`${lesson.id}/${String(step.id)}: ${sentence.trim()}`);
            }
          }
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M13_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});
