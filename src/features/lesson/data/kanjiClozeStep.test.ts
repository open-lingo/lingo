import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/languages/ja/secondScript/kanjiDistractorPool", () => ({
  buildKanjiDistractors: () => ["一", "三", "五"],
}));

import { buildKanjiClozeStep, findClozeSpan } from "./kanjiClozeStep";

const ni = { atomId: "ja-num-2", kana: "に", kanji: "二", gloss: "two" };

describe("findClozeSpan — the blank must cover a WORD, not a substring", () => {
  it("rejects a kana run inside another word (に inside なに — TestFlight #11)", () => {
    expect(findClozeSpan("なにを やる？", "に")).toBe(-1);
  });
  it("accepts the word at a segment start with a particle glued on", () => {
    expect(findClozeSpan("きっぷを かっておいた", "きっぷ")).toBe(0);
    expect(findClozeSpan("せんしゅう きっぷを かった", "きっぷ")).toBe(6);
  });
  it("accepts a bare segment and a sentence-final word", () => {
    expect(findClozeSpan("りんごを に かった", "に")).toBe(5);
    expect(findClozeSpan("これは ほん", "ほん")).toBe(4);
  });
  it("rejects a word buried mid-segment (ほん inside にほんご)", () => {
    expect(findClozeSpan("にほんごを はなす", "ほん")).toBe(-1);
  });
  it("skips a bad first hit and takes a later clean one", () => {
    expect(findClozeSpan("なにを に する", "に")).toBe(4);
  });
});

describe("buildKanjiClozeStep", () => {
  it("returns null instead of blanking the wrong kana", () => {
    expect(
      buildKanjiClozeStep("s1", ni, { text: "なにを やる？", translation: "What will you do?" }),
    ).toBeNull();
  });
  it("blanks the whole-word hit", () => {
    const step = buildKanjiClozeStep("s1", ni, { text: "りんごを に かった", translation: "I bought two apples" });
    expect(step && (step as { sentence: string }).sentence).toBe("りんごを {{blank}} かった");
  });
});
