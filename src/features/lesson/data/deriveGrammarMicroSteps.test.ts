import { describe, expect, it } from "vitest";
import { getAvailableMockLessonIds, getMockLessonContent } from "./mockLessons";
import { deriveGrammarMicroSteps } from "./deriveGrammarMicroSteps";
import type {
  GrammarRuleStep,
  LessonContent,
  MultipleChoiceStep,
} from "../types";

/**
 * Workshop A (2026-07-12): grammar micro-teaching derivation.
 *  - drills after a rule card carry the reactive ✗/✓ tip payload;
 *  - a spot-the-mistake MCQ is injected at the end of the drill span;
 *  - injection never pushes a lesson past the density hard cap (25).
 */
describe("deriveGrammarMicroSteps", () => {
  it("m7-neo-1: tags drills and injects the spot-the-mistake step", () => {
    const lesson = getMockLessonContent("ja-m7-neo-1")!;
    const ruleIdx = lesson.steps.findIndex((s) => s.type === "grammar_rule");
    const rule = lesson.steps[ruleIdx] as GrammarRuleStep;
    expect(rule.antiPattern).toBeTruthy();

    const tagged = lesson.steps.filter((s) => s.reactiveGrammarTip);
    expect(tagged.length).toBeGreaterThanOrEqual(3);
    const tip = tagged[0].reactiveGrammarTip!;
    expect(tip.wrongJa).toBe(rule.antiPattern!.ja);
    expect(tip.rightJa).toBe(rule.examples[0].ja);
    expect(tip.ruleLine).toBe(rule.rule);
    expect(tip.why).toBe(rule.antiPattern!.why);

    // Invariant 32 (2026-07-20): the derived spot-the-mistake step is
    // RETIRED. antiPattern now feeds ONLY the reactive tip (asserted
    // above); no `-spot` MCQ is injected anymore.
    const spot = lesson.steps.find((s) => s.id === `${rule.id}-spot`);
    expect(spot, "spot step must NOT be injected (invariant 32)").toBeUndefined();
  });

  it("every ja lesson with an anti-patterned rule card gets tagging, and none exceeds the density cap", () => {
    let lessonsWithRule = 0;
    let lessonsTagged = 0;
    const overCap: string[] = [];
    for (const id of getAvailableMockLessonIds()) {
      if (!id.startsWith("ja")) continue;
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      const hasAntiRule = lesson.steps.some(
        (s) => s.type === "grammar_rule" && (s as GrammarRuleStep).antiPattern,
      );
      if (!hasAntiRule) continue;
      lessonsWithRule++;
      if (lesson.steps.some((s) => s.reactiveGrammarTip)) lessonsTagged++;
      // At most one derived spot per rule card, ids unique. (The density
      // hard cap is measured on AUTHORED steps by sub-lesson-density.test —
      // the injection budget is applied pre-tails in the post-pass.)
      const spotIds = lesson.steps
        .filter((s) => s.id.endsWith("-spot"))
        .map((s) => s.id);
      if (new Set(spotIds).size !== spotIds.length) {
        overCap.push(`${id}: duplicate spot ids`);
      }
      const ruleCount = lesson.steps.filter(
        (s) => s.type === "grammar_rule",
      ).length;
      if (spotIds.length > ruleCount) {
        overCap.push(`${id}: more spots than rule cards`);
      }
    }
    expect(lessonsWithRule).toBeGreaterThan(25) // ARCHIVE 2026-07-26: was 50 across the old course; the neo course is m3-m7 so far; // ~93 anti-patterns exist
    expect(lessonsTagged).toBe(lessonsWithRule);
    expect(overCap, overCap.join("\n")).toEqual([]);
  });

  it("the wrong form is never voiced: spot steps carry no audio fields", () => {
    for (const id of getAvailableMockLessonIds()) {
      if (!id.startsWith("ja")) continue;
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      for (const s of lesson.steps) {
        if (!s.id.endsWith("-spot")) continue;
        const mcq = s as MultipleChoiceStep;
        expect(mcq.promptAudioText).toBeUndefined();
        expect(mcq.promptAudioKey).toBeUndefined();
      }
    }
  });

  it("never tags a speaking step (skip is a pronunciation outcome, not a grammar miss)", () => {
    // Regression: a speaking step inside a drill span used to get the reactive
    // tip; skipping it ("no pass") fired the controller-level Quick Fix modal,
    // which then floated over the NEXT step as a bogus "wrong answer".
    const rule: GrammarRuleStep = {
      id: "t-rule",
      type: "grammar_rule",
      rule: "dictionary form ends in -u",
      examples: [{ ja: "のむ", en: "to drink" }],
      antiPattern: { ja: "のみる", why: "wrong stem" },
    } as GrammarRuleStep;
    const lesson: LessonContent = {
      id: "t-lesson",
      moduleId: "m29",
      languageId: "ja",
      title: "t",
      steps: [
        rule,
        { id: "t-speak", type: "speaking", targetText: "のむ", promptEn: "Say: drink" },
        { id: "t-mcq", type: "multiple_choice", prompt: "?", options: [], correctOptionId: "a" },
      ],
    } as unknown as LessonContent;

    const out = deriveGrammarMicroSteps(lesson);
    const speak = out.steps.find((s) => s.id === "t-speak")!;
    const mcq = out.steps.find((s) => s.id === "t-mcq")!;
    expect(speak.reactiveGrammarTip, "speaking must not carry a tip").toBeUndefined();
    expect(mcq.reactiveGrammarTip, "the graded MCQ still gets tagged").toBeTruthy();
  });
});
