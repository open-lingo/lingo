import { describe, it, expect } from "vitest";
import { isPassiveStep, isGradedStep } from "./_stepPredicates";
import type { LessonStep } from "../types";

describe("isPassiveStep", () => {
  it("returns true for phrase_card / info / grammar_rule", () => {
    expect(isPassiveStep({ id: "x", type: "phrase_card" } as LessonStep)).toBe(true);
    expect(isPassiveStep({ id: "x", type: "info" } as LessonStep)).toBe(true);
    expect(isPassiveStep({ id: "x", type: "grammar_rule" } as LessonStep)).toBe(true);
  });
  it("returns false for dialogue_listen (has embedded comprehension MCQs)", () => {
    expect(isPassiveStep({ id: "x", type: "dialogue_listen" } as LessonStep)).toBe(false);
  });
  it("returns false for graded step types", () => {
    expect(isPassiveStep({ id: "x", type: "multiple_choice" } as LessonStep)).toBe(false);
    expect(isPassiveStep({ id: "x", type: "translate" } as LessonStep)).toBe(false);
    expect(isPassiveStep({ id: "x", type: "speaking" } as LessonStep)).toBe(false);
  });
});

describe("isGradedStep", () => {
  it("is the inverse of isPassiveStep", () => {
    expect(isGradedStep({ id: "x", type: "phrase_card" } as LessonStep)).toBe(false);
    expect(isGradedStep({ id: "x", type: "translate" } as LessonStep)).toBe(true);
  });
});
