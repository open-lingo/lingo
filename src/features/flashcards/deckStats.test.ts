import { describe, it, expect } from "vitest";
import {
  cardComplexitySignals,
  cardComplexity,
  cardDifficulty,
  computeDeckStats,
} from "./deckStats";
import type { Flashcard } from "./data/types";

function word(partial: Partial<Flashcard> = {}): Flashcard {
  return {
    id: partial.id ?? "c1",
    type: "word",
    front: "犬",
    back: "dog",
    ...partial,
  } as Flashcard;
}

describe("cardComplexitySignals", () => {
  it("a bare short word card has no signals", () => {
    expect(cardComplexitySignals(word())).toBe(0);
  });

  it("counts a supporting note as a signal", () => {
    expect(cardComplexitySignals(word({ note: "a domesticated canine" }))).toBe(1);
  });

  it("counts a long face as a signal", () => {
    expect(
      cardComplexitySignals(word({ back: "x".repeat(50) })),
    ).toBe(1);
  });

  it("counts the sentence type as a signal", () => {
    expect(cardComplexitySignals(word({ type: "sentence" }))).toBe(1);
  });

  it("counts worked examples as a signal", () => {
    expect(
      cardComplexitySignals(word({ examples: [{ text: "犬がいる" }] })),
    ).toBe(1);
  });

  it("stacks multiple signals", () => {
    expect(
      cardComplexitySignals(
        word({ type: "sentence", note: "n", reasoning: "r", back: "y".repeat(60) }),
      ),
    ).toBe(3);
  });
});

describe("cardComplexity", () => {
  it("simple when < 2 signals", () => {
    expect(cardComplexity(word({ note: "n" }))).toBe("simple");
  });
  it("complex when >= 2 signals", () => {
    expect(cardComplexity(word({ note: "n", type: "sentence" }))).toBe("complex");
  });
});

describe("cardDifficulty", () => {
  it("easy with no signals", () => {
    expect(cardDifficulty(word())).toBe("easy");
  });
  it("medium with one or two signals", () => {
    expect(cardDifficulty(word({ note: "n" }))).toBe("medium");
    expect(cardDifficulty(word({ note: "n", type: "sentence" }))).toBe("medium");
  });
  it("hard with three or more signals", () => {
    expect(
      cardDifficulty(word({ note: "n", type: "sentence", back: "z".repeat(60) })),
    ).toBe("hard");
  });
});

describe("computeDeckStats", () => {
  it("handles an empty deck without dividing by zero", () => {
    const stats = computeDeckStats([]);
    expect(stats.total).toBe(0);
    expect(stats.overall).toBe("easy");
    expect(stats.difficulty).toEqual({ easy: 0, medium: 0, hard: 0 });
  });

  it("tallies complexity, difficulty bands and types; sums match total", () => {
    const cards: Flashcard[] = [
      word({ id: "a" }), // easy / simple
      word({ id: "b", note: "n" }), // medium / simple (1 signal)
      word({ id: "c", type: "sentence", note: "n" }), // medium / complex (2 signals)
      word({
        id: "d",
        type: "sentence",
        note: "n",
        reasoning: "r",
        back: "q".repeat(60),
      }), // hard / complex
    ];
    const stats = computeDeckStats(cards);
    expect(stats.total).toBe(4);
    expect(stats.simple + stats.complex).toBe(4);
    expect(stats.complex).toBe(2);
    expect(
      stats.difficulty.easy + stats.difficulty.medium + stats.difficulty.hard,
    ).toBe(4);
    expect(stats.difficulty.easy).toBe(1);
    expect(stats.difficulty.hard).toBe(1);
    expect(stats.types.word).toBe(2);
    expect(stats.types.sentence).toBe(2);
  });

  it("classifies an all-easy deck as overall easy", () => {
    const stats = computeDeckStats([word({ id: "a" }), word({ id: "b" })]);
    expect(stats.overall).toBe("easy");
  });

  it("classifies an all-hard deck as overall hard", () => {
    const hard = word({
      type: "sentence",
      note: "n",
      reasoning: "r",
      back: "q".repeat(60),
    });
    const stats = computeDeckStats([
      { ...hard, id: "a" },
      { ...hard, id: "b" },
    ]);
    expect(stats.overall).toBe("hard");
  });
});
