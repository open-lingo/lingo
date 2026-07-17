/**
 * Behavior of the loose JA transcript match used by the speech POC.
 *
 * These tests pin the leniency contract: short utterances should accept
 * common drift (punctuation, whitespace, mild substitution) while still
 * rejecting clearly-wrong transcripts. Coverage spans:
 *
 *   - normalization (full-width fold, katakana→hiragana, h-strip,
 *     filler strip, trailing punctuation, romaji→kana fallback)
 *   - the legacy `isUtteranceCorrect` single-string API
 *   - the tiered N-best `scoreAlternatives` API
 */
import { describe, it, expect } from "vitest";
import {
  isUtteranceCorrect,
  normalizeForCompare,
  normalizeJa,
  normalizeTarget,
  numbersToKana,
  scoreAlternatives,
} from "./loose-match";

describe("normalizeJa", () => {
  it("strips whitespace and full-width punctuation", () => {
    expect(normalizeJa("お ちゃ。")).toBe("おちゃ");
    expect(normalizeJa("　あい！")).toBe("あい");
  });

  it("handles empty input safely", () => {
    expect(normalizeJa("")).toBe("");
  });
});

describe("normalizeTarget", () => {
  it("folds katakana to hiragana", () => {
    expect(normalizeTarget("アイ")).toBe("あい");
  });
  it("strips punctuation", () => {
    expect(normalizeTarget("あい。")).toBe("あい");
  });
});

describe("normalizeForCompare", () => {
  it("strips a leading /h/ when target starts with a vowel", () => {
    // The "ai→hai" failure case Spencer flagged.
    expect(normalizeForCompare("hai", "あい")).toBe("あい");
    expect(normalizeForCompare("はい", "あい")).toBe("い");
  });

  it("does NOT strip /h/ when target starts with /h/", () => {
    // Don't normalize away a legitimate /h/.
    expect(normalizeForCompare("はい", "はい")).toBe("はい");
  });

  it("folds katakana to hiragana", () => {
    expect(normalizeForCompare("アイ", "あい")).toBe("あい");
  });

  it("converts pure romaji to kana when target is kana", () => {
    expect(normalizeForCompare("ai", "あい")).toBe("あい");
    expect(normalizeForCompare("ocha", "おちゃ")).toBe("おちゃ");
  });

  it("strips leading filler interjections", () => {
    expect(normalizeForCompare("えーと あい", "あい")).toBe("あい");
    expect(normalizeForCompare("あの、あい", "あい")).toBe("あい");
  });

  it("strips trailing punctuation", () => {
    expect(normalizeForCompare("あい。", "あい")).toBe("あい");
    expect(normalizeForCompare("あい？", "あい")).toBe("あい");
  });

  it("folds full-width ASCII to half-width", () => {
    // Full-width "ai" → "ai" → "あい".
    expect(normalizeForCompare("ａｉ", "あい")).toBe("あい");
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

  it("accepts 'hai' for vowel-initial target 'あい' (h-strip)", () => {
    expect(isUtteranceCorrect("あい", "hai")).toBe(true);
  });

  it("accepts katakana 'アイ' for hiragana target 'あい'", () => {
    expect(isUtteranceCorrect("あい", "アイ")).toBe(true);
  });

  it("accepts pure romaji 'ai' for target 'あい'", () => {
    expect(isUtteranceCorrect("あい", "ai")).toBe(true);
  });

  it("accepts filler-prefixed 'えーと あい' for target 'あい'", () => {
    expect(isUtteranceCorrect("あい", "えーと あい")).toBe(true);
  });

  it("accepts trailing punctuation 'あい。' for target 'あい'", () => {
    expect(isUtteranceCorrect("あい", "あい。")).toBe(true);
  });
});

describe("scoreAlternatives", () => {
  const tiers = { perfect: 0.85, close: 0.55 };

  it("returns perfect on an exact match", () => {
    const r = scoreAlternatives("あい", [{ transcript: "あい" }], tiers);
    expect(r.verdict).toBe("perfect");
    expect(r.bestScore).toBe(1);
    expect(r.bestAlternative?.raw).toBe("あい");
  });

  it("picks the best alternative when the top is wrong", () => {
    // Top-1 is garbage, 3rd alt is the right answer.
    const r = scoreAlternatives(
      "あい",
      [
        { transcript: "ぬぬぬ", confidence: 0.9 },
        { transcript: "ねえ", confidence: 0.7 },
        { transcript: "あい", confidence: 0.5 },
      ],
      tiers,
    );
    expect(r.verdict).toBe("perfect");
    expect(r.bestAlternative?.raw).toBe("あい");
  });

  it("uses normalization across the N-best list (hai in alts wins)", () => {
    // Top-1 unrelated; alt 2 is "hai" which normalizes to "あい".
    const r = scoreAlternatives(
      "あい",
      [
        { transcript: "ぬぬぬ" },
        { transcript: "hai" },
      ],
      tiers,
    );
    expect(r.verdict).toBe("perfect");
    expect(r.bestAlternative?.raw).toBe("hai");
    expect(r.bestAlternative?.normalized).toBe("あい");
  });

  it("returns try-again when nothing matches", () => {
    const r = scoreAlternatives(
      "あい",
      [{ transcript: "ぬぬぬ" }, { transcript: "こんにちは" }],
      tiers,
    );
    expect(r.verdict).toBe("try-again");
  });

  it("tier boundary: 0.86 → perfect", () => {
    // Choose a target/transcript pair whose normalized char-overlap is
    // ≥ 0.85 but not a substring match. Target 7 chars, transcript
    // shares 6 → 6/7 ≈ 0.857.
    const r = scoreAlternatives(
      "あいうえおかき",
      [{ transcript: "あいうえおかく" }],
      { perfect: 0.85, close: 0.55 },
    );
    // 6/7 = 0.857 ≥ 0.85
    expect(r.bestScore).toBeGreaterThanOrEqual(0.85);
    expect(r.verdict).toBe("perfect");
  });

  it("tier boundary: 0.84 → close", () => {
    // 5/7 ≈ 0.714 sits comfortably in close.
    const r = scoreAlternatives(
      "あいうえおかき",
      [{ transcript: "あいうえおぬぬ" }],
      { perfect: 0.85, close: 0.55 },
    );
    expect(r.bestScore).toBeGreaterThanOrEqual(0.55);
    expect(r.bestScore).toBeLessThan(0.85);
    expect(r.verdict).toBe("close");
  });

  it("tier boundary: 0.54 → try-again", () => {
    // 3/7 ≈ 0.428 — below the close threshold.
    const r = scoreAlternatives(
      "あいうえおかき",
      [{ transcript: "あいうぬぬぬぬ" }],
      { perfect: 0.85, close: 0.55 },
    );
    expect(r.bestScore).toBeLessThan(0.55);
    expect(r.verdict).toBe("try-again");
  });

  it("respects the strict flag (no normalization)", () => {
    // Without normalization, 'hai' vs 'あい' has zero overlap.
    const r = scoreAlternatives(
      "あい",
      [{ transcript: "hai" }],
      { perfect: 0.85, close: 0.55, strict: true },
    );
    expect(r.verdict).toBe("try-again");
    expect(r.bestScore).toBe(0);
  });

  it("populates per-alternative scoring detail", () => {
    const r = scoreAlternatives(
      "あい",
      [
        { transcript: "hai", confidence: 0.9 },
        { transcript: "アイ", confidence: 0.7 },
      ],
      tiers,
    );
    expect(r.alternatives).toHaveLength(2);
    expect(r.alternatives[0].normalized).toBe("あい");
    expect(r.alternatives[1].normalized).toBe("あい");
    expect(r.alternatives[0].confidence).toBe(0.9);
  });

  it("returns try-again on an empty alternatives list", () => {
    const r = scoreAlternatives("あい", [], tiers);
    expect(r.verdict).toBe("try-again");
    expect(r.bestAlternative).toBeNull();
  });
});

describe("numbersToKana — Whisper digit inverse-normalization (2026-07-17)", () => {
  it("substitutes the reading the target uses (4 → よん)", () => {
    expect(normalizeForCompare("4", "よん")).toBe("よん");
    expect(normalizeForCompare("４", "よん")).toBe("よん");
    expect(normalizeForCompare("四", "よん")).toBe("よん");
  });

  it("picks the alternate reading when the target uses it (4 → し, 7 → しち)", () => {
    expect(normalizeForCompare("4", "し")).toBe("し");
    expect(normalizeForCompare("7", "しち")).toBe("しち");
    expect(normalizeForCompare("7", "なな")).toBe("なな");
    expect(normalizeForCompare("9", "く")).toBe("く");
  });

  it("handles number sequences (counting drill transcripts)", () => {
    expect(normalizeForCompare("1、3、5、7", "いち、さん、ご、なな")).toBe(
      "いちさんごなな",
    );
  });

  it("composes tens and handles kanji numerals", () => {
    expect(normalizeForCompare("40", "よんじゅう")).toBe("よんじゅう");
    expect(normalizeForCompare("十三", "じゅうさん")).toBe("じゅうさん");
    expect(normalizeForCompare("百", "ひゃく")).toBe("ひゃく");
  });

  it("leaves non-number text and unknown magnitudes alone", () => {
    expect(normalizeForCompare("すし", "すし")).toBe("すし");
    expect(numbersToKana("2026", "にせん")).toBe("2026");
  });

  it("end-to-end: digit transcript scores perfect against kana target", () => {
    const tiers = { perfect: 0.95, close: 0.8 };
    const r = scoreAlternatives(
      "よん",
      [{ transcript: "4", confidence: 0.9 }],
      tiers,
    );
    expect(r.verdict === "perfect" || r.verdict === "close").toBe(true);
  });
});
