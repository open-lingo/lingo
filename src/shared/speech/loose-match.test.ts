/**
 * Behavior of the loose JA transcript match used by the speech POC.
 *
 * These tests pin the leniency contract: short utterances should accept
 * common drift (punctuation, whitespace, mild substitution) while still
 * rejecting clearly-wrong transcripts.
 */
import { describe, it, expect } from "vitest";
import { isUtteranceCorrect, normalizeJa } from "./loose-match";

describe("normalizeJa", () => {
  it("strips whitespace and full-width punctuation", () => {
    expect(normalizeJa("お ちゃ。")).toBe("おちゃ");
    expect(normalizeJa("　あい！")).toBe("あい");
  });

  it("handles empty input safely", () => {
    expect(normalizeJa("")).toBe("");
  });
});

describe("isUtteranceCorrect", () => {
  it("accepts an exact transcript", () => {
    expect(isUtteranceCorrect("おちゃ", "おちゃ")).toBe(true);
  });

  it("accepts a transcript with trailing punctuation", () => {
    expect(isUtteranceCorrect("おちゃ", "おちゃ。")).toBe(true);
  });

  it("accepts a transcript with inserted whitespace", () => {
    expect(isUtteranceCorrect("あおい", "あ お い")).toBe(true);
  });

  it("accepts when transcript contains target as substring", () => {
    expect(isUtteranceCorrect("あい", "はい あい です")).toBe(true);
  });

  it("rejects a clearly-wrong transcript", () => {
    expect(isUtteranceCorrect("おちゃ", "こんにちは")).toBe(false);
  });

  it("rejects empty transcript", () => {
    expect(isUtteranceCorrect("あい", "")).toBe(false);
  });

  it("accepts a strict prefix of the target via substring path", () => {
    // "あお" is a prefix of "あおい" — the loose-match contract says
    // accept. Better to let a missing trailing kana through than to nag
    // the learner.
    expect(isUtteranceCorrect("あおい", "あお")).toBe(true);
  });

  it("rejects a wildly-different transcript even under a lenient threshold", () => {
    expect(isUtteranceCorrect("あおい", "ぬぬぬぬ", 0.4)).toBe(false);
  });
});
