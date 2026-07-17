import { describe, it, expect } from "vitest";
import { alignFurigana } from "./okurigana";

describe("alignFurigana — okurigana-aligned ruby splitting", () => {
  it("strips the okurigana tail: 飲む/のむ → 飲(の)む", () => {
    expect(alignFurigana("飲む", "のむ")).toEqual({
      prefix: "",
      body: "飲",
      rt: "の",
      suffix: "む",
    });
  });

  it("handles inflected tails: 飲まない/のまない → 飲(の)まない", () => {
    expect(alignFurigana("飲まない", "のまない")).toEqual({
      prefix: "",
      body: "飲",
      rt: "の",
      suffix: "まない",
    });
  });

  it("食べる/たべる → 食(た)べる", () => {
    expect(alignFurigana("食べる", "たべる")).toEqual({
      prefix: "",
      body: "食",
      rt: "た",
      suffix: "べる",
    });
  });

  it("multi-kana reading over one kanji: 大きい/おおきい → 大(おお)きい", () => {
    expect(alignFurigana("大きい", "おおきい")).toEqual({
      prefix: "",
      body: "大",
      rt: "おお",
      suffix: "きい",
    });
  });

  it("reading changes under inflection are fine — the actual reading is passed: 来ない/こない → 来(こ)ない", () => {
    expect(alignFurigana("来ない", "こない")).toEqual({
      prefix: "",
      body: "来",
      rt: "こ",
      suffix: "ない",
    });
    expect(alignFurigana("来る", "くる")).toEqual({
      prefix: "",
      body: "来",
      rt: "く",
      suffix: "る",
    });
  });

  it("pure-kanji words keep whole-word ruby: 学校/がっこう unchanged", () => {
    expect(alignFurigana("学校", "がっこう")).toEqual({
      prefix: "",
      body: "学校",
      rt: "がっこう",
      suffix: "",
    });
  });

  it("strips a shared kana prefix: お土産/おみやげ → お + 土産(みやげ)", () => {
    expect(alignFurigana("お土産", "おみやげ")).toEqual({
      prefix: "お",
      body: "土産",
      rt: "みやげ",
      suffix: "",
    });
  });

  it("kanji-kana-kanji middles fall back to one ruby over the remaining run", () => {
    expect(alignFurigana("持って行く", "もっていく")).toEqual({
      prefix: "",
      body: "持って行",
      rt: "もってい",
      suffix: "く",
    });
  });

  it("degenerate inputs fall back to whole-word shape", () => {
    // Identical strings (the kanji_reading suppression shape).
    expect(alignFurigana("学校", "学校")).toEqual({
      prefix: "",
      body: "学校",
      rt: "学校",
      suffix: "",
    });
    // No kanji anywhere — caller misuse; degrade to whole, never throw.
    expect(alignFurigana("すし", "sushi")).toEqual({
      prefix: "",
      body: "すし",
      rt: "sushi",
      suffix: "",
    });
  });
});
