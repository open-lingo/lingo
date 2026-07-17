import { describe, it, expect } from "vitest";
import { KANA_ROMAJI, containsKanji, tokenizeJapanese } from "./kanaTable";

/** hiragana yōon → its katakana counterpart, computed by codepoint shift
 *  (ぁ U+3041 … ゖ U+3096 map to ァ U+30A1 … ヶ U+30F6 at +0x60). */
function toKatakana(hira: string): string {
  return Array.from(hira)
    .map((ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
    .join("");
}

describe("KANA_ROMAJI syllabary parity", () => {
  it("every hiragana yōon digraph has a katakana counterpart with the same reading", () => {
    // Regression: the katakana map shipped with only リャ/リュ/リョ, so
    // ジュース rendered "ji ー su" — every loanword yōon was wrong.
    const yoonKeys = Object.keys(KANA_ROMAJI).filter(
      (k) => Array.from(k).length === 2 && /^[぀-ゟ]+$/.test(k),
    );
    expect(yoonKeys.length).toBeGreaterThanOrEqual(33); // 11 rows × 3
    for (const hira of yoonKeys) {
      const kata = toKatakana(hira);
      expect(KANA_ROMAJI[kata], `missing katakana counterpart for ${hira} (${kata})`).toBe(
        KANA_ROMAJI[hira],
      );
    }
  });
});

describe("containsKanji", () => {
  it("is true for a pure-kanji surface", () => {
    expect(containsKanji("日本語")).toBe(true);
  });

  it("is true when kanji is mixed with kana (typical word shape)", () => {
    expect(containsKanji("食べる")).toBe(true);
    expect(containsKanji("学生")).toBe(true);
  });

  it("is false for pure hiragana or pure katakana", () => {
    expect(containsKanji("にほんご")).toBe(false);
    expect(containsKanji("ジュース")).toBe(false);
    expect(containsKanji("アメリカじん")).toBe(false);
  });

  it("counts 々 (the kanji iteration mark) as kanji even alone", () => {
    // 々 (U+3005) is not itself a CJK Unified Ideograph but reads as
    // kanji for every purpose here (e.g. 時々, 人々).
    expect(containsKanji("々")).toBe(true);
    expect(containsKanji("時々")).toBe(true);
  });

  it("is false for latin text, digits, punctuation, and the empty string", () => {
    expect(containsKanji("hello")).toBe(false);
    expect(containsKanji("123")).toBe(false);
    expect(containsKanji("!?。、")).toBe(false);
    expect(containsKanji("")).toBe(false);
  });
});

describe("tokenizeJapanese digraph merging", () => {
  it("merges standard katakana yōon (ジュース → ju)", () => {
    const tokens = tokenizeJapanese("ジュース");
    expect(tokens.map((t) => t.text)).toEqual(["ジュ", "ー", "ス"]);
    expect(tokens[0].romaji).toBe("ju");
  });

  it("merges extended loanword digraphs used by the curriculum (ティ/フォ/フェ)", () => {
    expect(tokenizeJapanese("パーティー").map((t) => t.text)).toEqual([
      "パ", "ー", "ティ", "ー",
    ]);
    expect(tokenizeJapanese("フォーク")[0]).toMatchObject({ text: "フォ", romaji: "fo" });
    expect(tokenizeJapanese("カフェ").map((t) => t.text)).toEqual(["カ", "フェ"]);
  });

  it("never merges a small kana whose combo is unmapped", () => {
    // ンィ is not a digraph — stays two tokens rather than an unmapped merge.
    const tokens = tokenizeJapanese("ンィ");
    expect(tokens.map((t) => t.text)).toEqual(["ン", "ィ"]);
  });

  it("keeps hiragana yōon behavior unchanged", () => {
    const tokens = tokenizeJapanese("がっこうじゃない");
    expect(tokens.map((t) => t.text)).toEqual(["が", "っ", "こ", "う", "じゃ", "な", "い"]);
    expect(tokens[4].romaji).toBe("ja");
  });
});
