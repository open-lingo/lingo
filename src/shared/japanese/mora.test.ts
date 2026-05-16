import { describe, it, expect } from "vitest";
import { countMora } from "./mora";

describe("countMora", () => {
  it("returns 0 for empty / non-kana inputs", () => {
    expect(countMora("")).toBe(0);
    expect(countMora("hello")).toBe(0);
    expect(countMora("愛")).toBe(0); // kanji only, no kana
  });

  it("counts simple hiragana 1:1", () => {
    expect(countMora("あ")).toBe(1);
    expect(countMora("あい")).toBe(2);
    expect(countMora("くち")).toBe(2);
    expect(countMora("ありがとう")).toBe(5);
    expect(countMora("おねがいします")).toBe(7);
  });

  it("collapses yōon (parent + small ゃ/ゅ/ょ) into one mora", () => {
    expect(countMora("きょ")).toBe(1);
    expect(countMora("きょう")).toBe(2);
    expect(countMora("しゅみ")).toBe(2);
    expect(countMora("りゅう")).toBe(2);
    expect(countMora("ぎゅうにゅう")).toBe(4);
    expect(countMora("しゃしん")).toBe(3);
  });

  it("counts sokuon (small っ) as its own mora", () => {
    expect(countMora("がっこう")).toBe(4);
    expect(countMora("きって")).toBe(3);
    expect(countMora("いっぱい")).toBe(4);
  });

  it("counts long vowels (う / い / ー) as their own mora", () => {
    expect(countMora("おかあさん")).toBe(5);
    expect(countMora("せんせい")).toBe(4);
    expect(countMora("とけい")).toBe(3);
  });

  it("handles katakana the same way", () => {
    expect(countMora("アイ")).toBe(2);
    expect(countMora("ガッコウ")).toBe(4);
    expect(countMora("キョウ")).toBe(2);
  });
});
