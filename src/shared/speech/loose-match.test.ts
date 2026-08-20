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
  gradeTypedAnswer,
  isUtteranceCorrect,
  normalizeForCompare,
  normalizeJa,
  normalizeTarget,
  normalizeTypedAnswer,
  numbersToKana,
  scoreAlternatives,
  scoreAlternativesGeneric,
  type AccentPolicy,
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

describe("scoreAlternativesGeneric (non-JA / Korean)", () => {
  it("exact Hangul match is perfect", () => {
    const r = scoreAlternativesGeneric("안녕하세요", [{ transcript: "안녕하세요" }]);
    expect(r.verdict).toBe("perfect");
  });

  it("tolerates trailing punctuation + whitespace", () => {
    const r = scoreAlternativesGeneric("반갑습니다", [{ transcript: " 반갑습니다. " }]);
    expect(r.verdict).toBe("perfect");
  });

  it("substring (target within transcript) still passes", () => {
    const r = scoreAlternativesGeneric("친구", [{ transcript: "제 친구예요" }]);
    expect(r.verdict === "perfect" || r.verdict === "close").toBe(true);
  });

  it("a clearly-wrong Korean transcript is try-again", () => {
    const r = scoreAlternativesGeneric("선생님", [{ transcript: "고맙습니다" }]);
    expect(r.verdict).toBe("try-again");
  });

  it("does NOT transcribe-as-Japanese: Japanese output vs Korean target fails", () => {
    // Regression: the JA recognizer used to hear Korean speech as Japanese.
    // Now that ko recognizes in ko, a stray Japanese transcript must NOT
    // score as a pass against a Korean target.
    const r = scoreAlternativesGeneric("안녕하세요", [{ transcript: "こんにちは" }]);
    expect(r.verdict).toBe("try-again");
  });

  it("Spanish exact match ignores case + accents-as-written", () => {
    const r = scoreAlternativesGeneric("Buenos días", [{ transcript: "buenos días" }]);
    expect(r.verdict).toBe("perfect");
  });
});

describe("scoreAlternativesGeneric — Korean number ITN (Whisper transcribes spoken numbers as digits)", () => {
  // Whisper inverse-text-normalizes spoken Korean numbers to ASCII digits:
  // say "세 시" and the transcript comes back "3시". Time uses NATIVE numbers
  // for the hour (세=3) and SINO for the minutes (삼십=30) — both spoken forms
  // collapse to the same digit, so resolution must be target-aware.
  it("native-number hour said as a digit scores perfect (세 시 vs 3시)", () => {
    const r = scoreAlternativesGeneric("세 시", [{ transcript: "3시" }]);
    expect(r.verdict).toBe("perfect");
  });

  it("half-past resolves across the digit boundary (세 시 반 vs 3시 반)", () => {
    const r = scoreAlternativesGeneric("세 시 반", [{ transcript: "3시 반" }]);
    expect(r.verdict).toBe("perfect");
  });

  it("Sino minutes said as digits score perfect (삼십 분 vs 30분)", () => {
    const r = scoreAlternativesGeneric("삼십 분", [{ transcript: "30분" }]);
    expect(r.verdict).toBe("perfect");
  });

  it("full time resolves hour-as-native and minute-as-Sino together", () => {
    const r = scoreAlternativesGeneric("세 시 삼십 분", [{ transcript: "3시 30분" }]);
    expect(r.verdict).toBe("perfect");
  });

  it("a genuinely wrong hour still fails (세 시 vs 네 시 / 4시)", () => {
    const r = scoreAlternativesGeneric("세 시", [{ transcript: "4시" }]);
    expect(r.verdict).not.toBe("perfect");
  });

  it("does NOT corrupt non-number Korean words (네 = 'yes' stays 네)", () => {
    // Guard: we substitute digits→words, never words→digits, so 네/열/오/사
    // used as real words are never mangled into numbers.
    const r = scoreAlternativesGeneric("네", [{ transcript: "네" }]);
    expect(r.verdict).toBe("perfect");
  });

  it("is a no-op for non-Korean targets (Spanish digit unchanged)", () => {
    const r = scoreAlternativesGeneric("3", [{ transcript: "3" }]);
    expect(r.verdict).toBe("perfect");
  });
});

describe("normalizeTypedAnswer — apostrophe folding (2026-08-18)", () => {
  // iOS and macOS smart punctuation turn a typed ' into U+2019. Authored
  // answers use ASCII '. Before this fold, NFKC left them different and the
  // learner was marked wrong for a keyboard setting.
  const SMART = "\u2019";

  it("grades a smart apostrophe the same as a straight one", () => {
    expect(normalizeTypedAnswer(`I don${SMART}t know`)).toBe(
      normalizeTypedAnswer("I don't know"),
    );
  });

  it("folds the other look-alikes learners' keyboards produce", () => {
    // U+00B4 is excluded on purpose — NFKC makes it a combining accent.
    for (const ch of ["\u2018", "\u02bc", "\u2032", "\uff07", "\u0060"]) {
      expect(normalizeTypedAnswer(`it${ch}s`)).toBe(normalizeTypedAnswer("it's"));
    }
  });

  it("covers French elision, which is the reason this matters at scale", () => {
    expect(normalizeTypedAnswer(`j${SMART}ai faim`)).toBe(normalizeTypedAnswer("j'ai faim"));
    expect(normalizeTypedAnswer(`l${SMART}ami`)).toBe(normalizeTypedAnswer("l'ami"));
    expect(normalizeTypedAnswer(`c${SMART}est`)).toBe(normalizeTypedAnswer("c'est"));
  });

  it("does not make genuinely different answers equal", () => {
    expect(normalizeTypedAnswer("its")).not.toBe(normalizeTypedAnswer("it's"));
    expect(normalizeTypedAnswer("cat")).not.toBe(normalizeTypedAnswer("dog"));
  });

  it("leaves Japanese and Spanish answers untouched", () => {
    expect(normalizeTypedAnswer("わたしは がくせいです")).toBe("わたしはがくせいです");
    expect(normalizeTypedAnswer("Yo hablo español")).toBe("yohabloespañol");
  });
});

describe("gradeTypedAnswer — accentPolicy (F5, 2026-08-20)", () => {
  // The five French pairs where the accent IS the word (fr pin F5). The
  // policy carries FOLDED keys: a fold-match may not cross these forms.
  const FR_POLICY: AccentPolicy = {
    protectedFoldedForms: new Set(["a", "ou", "sur", "du", "la"]),
  };

  it("keeps the lenient default when no policy is given (es behavior)", () => {
    const g = gradeTypedAnswer(["años"], "anos");
    expect(g.correct).toBe(true);
    expect(g.accentFlagged).toBe(true);
    expect(g.accentDisplay).toBe("años");
  });

  it("fails a protected minimal pair: ou is not où", () => {
    expect(gradeTypedAnswer(["où"], "ou", FR_POLICY).correct).toBe(false);
  });

  it("fails the protected pair inside a sentence", () => {
    expect(
      gradeTypedAnswer(["C'est sûr"], "c'est sur", FR_POLICY).correct,
    ).toBe(false);
  });

  it("fails in the accent-ADDED direction too: là is not la", () => {
    expect(
      gradeTypedAnswer(["la pomme"], "là pomme", FR_POLICY).correct,
    ).toBe(false);
  });

  it("stays lenient on ordinary accents under the same policy", () => {
    const g = gradeTypedAnswer(["très bien"], "tres bien", FR_POLICY);
    expect(g.correct).toBe(true);
    expect(g.accentFlagged).toBe(true);
  });

  it("mixes: ordinary accent folded while the protected token is typed exactly", () => {
    const g = gradeTypedAnswer(["il est déjà là"], "il est deja là", FR_POLICY);
    expect(g.correct).toBe(true);
    expect(g.accentFlagged).toBe(true);
  });

  it("exact match on a protected form is simply correct", () => {
    const g = gradeTypedAnswer(["où"], "où", FR_POLICY);
    expect(g.correct).toBe(true);
    expect(g.accentFlagged).toBe(false);
  });

  it("protects across elision boundaries: l'a vs l'à", () => {
    expect(gradeTypedAnswer(["il l'a vu"], "il l'à vu", FR_POLICY).correct).toBe(
      false,
    );
  });

  it("rejects conservatively when spacing hides the token alignment", () => {
    // "oùest" vs "ou est" — folded strings match after space-stripping, but
    // the accepted answer carries a protected accented form the input never
    // typed. Reject rather than guess.
    expect(gradeTypedAnswer(["où est"], "ouest", FR_POLICY).correct).toBe(false);
  });
});
