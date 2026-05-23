import { describe, it, expect } from "vitest";
import {
  assertPassiveCardsHaveFollowup,
  assertNoExplanationOnPassive,
  assertExplanationDoesntLeakAnswer,
  checkPassiveCardFollowup,
} from "./_stepAssertions";
import type { LessonStep } from "../types";

const phraseCard = (atomId?: string): LessonStep =>
  ({
    id: `p-${Math.random()}`,
    type: "phrase_card",
    kana: "x",
    romaji: "x",
    meaningEn: "x",
    ...(atomId ? { atomId } : {}),
  }) as LessonStep;

const graded = (id: string, atoms: string[] = []): LessonStep =>
  ({
    id,
    type: "translate",
    ...(atoms.length ? { exercisedAtoms: atoms } : {}),
  }) as unknown as LessonStep;

describe("assertPassiveCardsHaveFollowup", () => {
  it("throws when an atom-tagged passive card has no same-atom follow-up", () => {
    const steps = [
      phraseCard("ja-koohii"),
      graded("g1", ["ja-other"]),
      graded("g2", ["ja-other2"]),
    ];
    expect(() => assertPassiveCardsHaveFollowup(steps)).toThrow(/ja-koohii/);
  });
  it("throws when the same-atom follow-up is at i+1 (adjacent — massed practice)", () => {
    const steps = [phraseCard("ja-koohii"), graded("g1", ["ja-koohii"])];
    expect(() => assertPassiveCardsHaveFollowup(steps)).toThrow(/adjacent/);
  });
  it("passes when the same-atom follow-up is at i+2", () => {
    const steps = [
      phraseCard("ja-koohii"),
      graded("g1", ["ja-other"]),
      graded("g2", ["ja-koohii"]),
    ];
    expect(() => assertPassiveCardsHaveFollowup(steps)).not.toThrow();
  });
  it("passes when the same-atom follow-up is at i+3", () => {
    const steps = [
      phraseCard("ja-koohii"),
      graded("g1", ["x"]),
      graded("g2", ["y"]),
      graded("g3", ["ja-koohii"]),
    ];
    expect(() => assertPassiveCardsHaveFollowup(steps)).not.toThrow();
  });
  it("falls back to weaker check (any graded follow-up within window) for untagged passive cards", () => {
    const steps = [
      phraseCard(/* no atomId */),
      graded("g1"),
      graded("g2"),
      graded("g3"),
    ];
    expect(() => assertPassiveCardsHaveFollowup(steps)).not.toThrow();
  });
  it("throws when an untagged passive card has zero graded follow-ups at all", () => {
    const steps = [phraseCard()];
    expect(() => assertPassiveCardsHaveFollowup(steps)).toThrow(
      /no graded follow-up/,
    );
  });
});

describe("assertNoExplanationOnPassive", () => {
  it("throws when a phrase_card has an explanation field set", () => {
    const steps = [
      { ...phraseCard("ja-x"), explanation: "why" } as LessonStep,
    ];
    expect(() => assertNoExplanationOnPassive(steps)).toThrow(/passive/);
  });
  it("passes for cultureNote on phrase_card", () => {
    const steps = [
      { ...phraseCard("ja-x"), cultureNote: "fine" } as LessonStep,
    ];
    expect(() => assertNoExplanationOnPassive(steps)).not.toThrow();
  });
});

describe("assertExplanationDoesntLeakAnswer", () => {
  it("throws when build_sentence explanation contains the answer kana", () => {
    const step = {
      id: "x",
      type: "build_sentence",
      prompt: "I am a student",
      targetSentence: "わたしは がくせいです",
      tiles: [],
      correctOrder: [],
      granularity: "word",
      explanation: "Use わたしは to mark topic",
    } as unknown as LessonStep;
    expect(() => assertExplanationDoesntLeakAnswer([step])).toThrow(
      /leaks answer/,
    );
  });
  it("passes when explanation explains WHY without leaking the answer", () => {
    const step = {
      id: "x",
      type: "build_sentence",
      prompt: "I am a student",
      targetSentence: "わたしは がくせいです",
      tiles: [],
      correctOrder: [],
      granularity: "word",
      explanation: "Use the topic-marker particle after the subject",
    } as unknown as LessonStep;
    expect(() => assertExplanationDoesntLeakAnswer([step])).not.toThrow();
  });
});

describe("checkPassiveCardFollowup (non-throwing variant)", () => {
  it("returns the list of offending step IDs", () => {
    const steps = [phraseCard("ja-koohii"), graded("g1", ["ja-koohii"])]; // adjacent
    expect(checkPassiveCardFollowup(steps).failures).toHaveLength(1);
  });
});
