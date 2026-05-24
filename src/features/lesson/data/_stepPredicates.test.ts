import { describe, it, expect } from "vitest";
import {
  isPassiveStep,
  isGradedStep,
  shouldWriteSrs,
  stepHasSentenceContent,
  getStepAtomIds,
  computeGradedProgress,
} from "./_stepPredicates";
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

describe("getStepAtomIds", () => {
  it("reads atomId from phrase_card", () => {
    const step = {
      id: "x",
      type: "phrase_card",
      kana: "コーヒー",
      romaji: "koohii",
      meaningEn: "coffee",
      atomId: "ja-koohii",
    } as LessonStep;
    expect(getStepAtomIds(step)).toEqual(["ja-koohii"]);
  });
  it("reads exercisedAtomIds from info / grammar_rule", () => {
    const info = {
      id: "x",
      type: "info",
      body: "...",
      exercisedAtomIds: ["ja-wa", "ja-desu"],
    } as LessonStep;
    expect(getStepAtomIds(info)).toEqual(["ja-wa", "ja-desu"]);
  });
  it("returns [] for steps without atom tagging", () => {
    expect(
      getStepAtomIds({
        id: "x",
        type: "phrase_card",
        kana: "x",
        romaji: "x",
        meaningEn: "x",
      } as LessonStep),
    ).toEqual([]);
  });
});

describe("computeGradedProgress", () => {
  const steps = [
    { id: "p1", type: "phrase_card" },
    { id: "g1", type: "translate" },
    { id: "p2", type: "info" },
    { id: "g2", type: "multiple_choice" },
    { id: "g3", type: "particle_cloze" },
  ] as LessonStep[];

  it("excludes passive steps from total", () => {
    expect(computeGradedProgress(steps, 0, {}).total).toBe(3);
  });
  it("does not advance current on tapping a passive card", () => {
    // currentStepIdx=1 → we've passed the phrase_card; no graded result yet.
    expect(computeGradedProgress(steps, 1, {}).current).toBe(0);
  });
  it("advances current only when a graded step has a result", () => {
    expect(computeGradedProgress(steps, 2, { g1: true }).current).toBe(1);
  });
  it("ignores results on passive steps", () => {
    expect(
      computeGradedProgress(steps, 3, { p1: true, p2: true, g1: true }).current,
    ).toBe(1);
  });
  it("returns total=0 for an all-passive lesson (degenerate)", () => {
    const passive = [
      { id: "p1", type: "phrase_card" },
      { id: "p2", type: "info" },
    ] as LessonStep[];
    expect(computeGradedProgress(passive, 0, {}).total).toBe(0);
  });
});

describe("shouldWriteSrs", () => {
  it("returns false for info even when carrying exercisedAtoms", () => {
    expect(shouldWriteSrs({ type: "info", exercisedAtoms: ["v-neko"] })).toBe(false);
  });
  it("returns false for phrase_card", () => {
    expect(shouldWriteSrs({ type: "phrase_card", exercisedAtoms: ["v-neko"] })).toBe(false);
  });
  it("returns false for grammar_rule", () => {
    expect(shouldWriteSrs({ type: "grammar_rule", exercisedAtoms: ["g-desu"] })).toBe(false);
  });
  it("returns false for symbol_intro (writing-system teach)", () => {
    expect(shouldWriteSrs({ type: "symbol_intro", exercisedAtoms: ["k-a"] })).toBe(false);
  });
  it("returns false for teach", () => {
    expect(shouldWriteSrs({ type: "teach", exercisedAtoms: ["v-cat"] })).toBe(false);
  });
  it("returns false for graded step missing exercisedAtoms", () => {
    expect(shouldWriteSrs({ type: "multiple_choice" })).toBe(false);
    expect(shouldWriteSrs({ type: "build_sentence", exercisedAtoms: [] })).toBe(false);
  });
  it("returns true for graded step with exercisedAtoms", () => {
    expect(shouldWriteSrs({ type: "multiple_choice", exercisedAtoms: ["v-neko"] })).toBe(true);
    expect(shouldWriteSrs({ type: "build_sentence", exercisedAtoms: ["v-park"] })).toBe(true);
    expect(shouldWriteSrs({ type: "word_image_mcq", exercisedAtoms: ["v-cat"] })).toBe(true);
  });
  it("returns true for dialogue_listen with atoms (hybrid, graded MCQs inside)", () => {
    expect(
      shouldWriteSrs({ type: "dialogue_listen", exercisedAtoms: ["v-coffee", "p-wo"] }),
    ).toBe(true);
  });
});
