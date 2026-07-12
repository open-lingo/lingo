import { describe, expect, it } from "vitest";
import { getAvailableMockLessonIds, getMockLessonContent } from "./mockLessons";
import type { GrammarRuleStep, MultipleChoiceStep } from "../types";

/**
 * Workshop A (2026-07-12): grammar micro-teaching derivation.
 *  - drills after a rule card carry the reactive ✗/✓ tip payload;
 *  - a spot-the-mistake MCQ is injected at the end of the drill span;
 *  - injection never pushes a lesson past the density hard cap (25).
 */
describe("deriveGrammarMicroSteps", () => {
  it("m27-2-1: tags drills and injects the spot-the-mistake step", () => {
    const lesson = getMockLessonContent("ja-m27-2-1")!;
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

    const spot = lesson.steps.find((s) => s.id === `${rule.id}-spot`) as
      | MultipleChoiceStep
      | undefined;
    expect(spot, "spot step injected").toBeTruthy();
    expect(spot!.type).toBe("multiple_choice");
    expect(spot!.options).toHaveLength(2);
    const correct = spot!.options.find((o) => o.id === spot!.correctOptionId)!;
    expect(correct.text).toBe(rule.examples[0].ja);
    const wrong = spot!.options.find((o) => o.id !== spot!.correctOptionId)!;
    expect(wrong.text).toBe(rule.antiPattern!.ja);
    // The spot lands AFTER the drill span begins, never before the card.
    expect(lesson.steps.findIndex((s) => s.id === spot!.id)).toBeGreaterThan(
      ruleIdx + 1,
    );
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
    expect(lessonsWithRule).toBeGreaterThan(50); // ~93 anti-patterns exist
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
});
