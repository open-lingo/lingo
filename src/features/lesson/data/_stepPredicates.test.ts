import { describe, it, expect } from "vitest";
import { isPassiveStep, isGradedStep, stepHasSentenceContent } from "./_stepPredicates";
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

describe("stepHasSentenceContent", () => {
  it("returns true for whitelisted sentence-level step kinds", () => {
    const kinds = [
      "translate",
      "build_sentence",
      "listening_build",
      "listening_comprehension",
      "particle_cloze",
      "dialogue_listen",
      "speaking",
    ] as const;
    for (const type of kinds) {
      expect(stepHasSentenceContent({ id: "x", type } as LessonStep)).toBe(true);
    }
  });
  it("returns true for sentence-prompt multiple_choice (>=2 atom tokens)", () => {
    const step = {
      id: "x",
      type: "multiple_choice",
      prompt: "わたしは がくせいです",
      promptAnnotation: [
        { surface: "わたし", reading: "わたし" },
        { surface: "は", reading: "は", role: "particle" },
        { surface: " がくせい", reading: "がくせい" },
        { surface: "です", reading: "です" },
      ],
    } as LessonStep;
    expect(stepHasSentenceContent(step)).toBe(true);
  });
  it("returns false for single-vocab multiple_choice (1 atom)", () => {
    const step = {
      id: "x",
      type: "multiple_choice",
      prompt: "みず",
      promptAnnotation: [{ surface: "みず", reading: "みず" }],
    } as LessonStep;
    expect(stepHasSentenceContent(step)).toBe(false);
  });
  it("returns false for trace / image MCQ / symbol drills", () => {
    expect(stepHasSentenceContent({ id: "x", type: "symbol_trace" } as LessonStep)).toBe(false);
    expect(stepHasSentenceContent({ id: "x", type: "word_image_mcq" } as LessonStep)).toBe(false);
    expect(stepHasSentenceContent({ id: "x", type: "match_pairs" } as LessonStep)).toBe(false);
  });
});
