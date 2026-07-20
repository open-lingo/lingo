import { describe, it, expect, beforeEach } from "vitest";
import {
  annotateJapaneseText,
  isPastKanaPhase,
  __resetRomajiLexiconCachesForTest,
} from "./romajiLexicon";
import { jaModule } from "./module";

const UNLOCKED_KEY = "lingo:unlocked-atoms";

beforeEach(() => {
  localStorage.clear();
  __resetRomajiLexiconCachesForTest();
});

describe("annotateJapaneseText — word grouping", () => {
  it("groups がくせい into one word fragment with authored romaji", () => {
    expect(annotateJapaneseText("がくせい", true)).toEqual([
      {
        text: "がくせい",
        reading: "gakusei",
        symbols: ["が", "く", "せ", "い"],
      },
    ]);
  });

  it("sokuon words come from the authored lexicon, never glyph-joining (がっこう → gakkou)", () => {
    expect(annotateJapaneseText("がっこう", true)).toEqual([
      {
        text: "がっこう",
        reading: "gakkou",
        symbols: ["が", "っ", "こ", "う"],
      },
    ]);
  });

  it("keeps yōon digraphs merged inside the symbols list (きょう)", () => {
    expect(annotateJapaneseText("きょう", true)).toEqual([
      { text: "きょう", reading: "kyou", symbols: ["きょ", "う"] },
    ]);
  });

  it("segments around particles — the ねこ|はい|ぬ trap parses as ねこ|は|いぬ|です", () => {
    // はい ("yes") IS a lexicon word; naive greedy matching would steal the
    // particle は plus the い of いぬ. The DP must prefer the segmentation
    // whose lone kana is a real particle.
    const frags = annotateJapaneseText("ねこはいぬです。", true);
    expect(frags.map((f) => f.text)).toEqual(["ねこ", "は", "いぬ", "です", "。"]);
    expect(frags[0]).toMatchObject({ reading: "neko", symbols: ["ね", "こ"] });
    // Particle は stays a per-kana fragment (no symbols field).
    expect(frags[1].symbols).toBeUndefined();
    expect(frags[2]).toMatchObject({ reading: "inu" });
    expect(frags[3]).toMatchObject({ reading: "desu" });
    // Punctuation renders plain — no reading at all.
    expect(frags[4]).toEqual({ text: "。" });
  });

  it("groups katakana words incl. the ー long mark (アパート → apaato)", () => {
    expect(annotateJapaneseText("アパート", true)).toEqual([
      {
        text: "アパート",
        reading: "apaato",
        symbols: ["ア", "パ", "ー", "ト"],
      },
    ]);
  });

  it("unmatched conjugated forms fall back per-kana while known endings still group (のみました)", () => {
    // のみます is itself an atom (polite forms are curriculum vocab) and
    // groups whole — but its past tense のみました is NOT authored anywhere,
    // so the stem stays per-kana and only the ました helper groups.
    const frags = annotateJapaneseText("のみました", true);
    expect(frags.map((f) => f.text)).toEqual(["の", "み", "ました"]);
    expect(frags[0].symbols).toBeUndefined();
    expect(frags[1].symbols).toBeUndefined();
    expect(frags[2]).toMatchObject({
      reading: "mashita",
      symbols: ["ま", "し", "た"],
    });
  });

  it("groups a whole authored polite verb form when the atom exists (のみます)", () => {
    expect(annotateJapaneseText("のみます", true)).toEqual([
      {
        text: "のみます",
        reading: "nomimasu",
        symbols: ["の", "み", "ま", "す"],
      },
    ]);
  });

  it("groupWords=false reproduces the historical per-kana emission exactly", () => {
    expect(annotateJapaneseText("がくせい", false)).toEqual([
      { text: "が", reading: "ga", symbolId: "ja:が" },
      { text: "く", reading: "ku", symbolId: "ja:く" },
      { text: "せ", reading: "se", symbolId: "ja:せ" },
      { text: "い", reading: "i", symbolId: "ja:い" },
    ]);
  });
});

describe("isPastKanaPhase — unlocked-atom gate", () => {
  it("is false with no unlocked-atom store", () => {
    expect(isPastKanaPhase()).toBe(false);
  });

  it("is false while only M1/M2 atoms are unlocked", () => {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(["ja:inu", "ja:kyou"]));
    expect(isPastKanaPhase()).toBe(false);
  });

  it("is true once any M3+ atom is unlocked (bare or prefixed ids)", () => {
    localStorage.setItem(
      UNLOCKED_KEY,
      JSON.stringify(["ja:inu", "ja-m3-2-v-gakusei"]),
    );
    expect(isPastKanaPhase()).toBe(true);
  });

  it("is false (fail-safe) on malformed store content", () => {
    localStorage.setItem(UNLOCKED_KEY, "{not json[");
    expect(isPastKanaPhase()).toBe(false);
  });
});

describe("jaModule.readingAnnotation integration", () => {
  it("stays per-kana during the kana phase, groups once past it", () => {
    // Kana phase: nothing unlocked.
    expect(jaModule.readingAnnotation!.annotate("がくせい")).toHaveLength(4);

    // Past kana phase: an M3 atom is unlocked.
    __resetRomajiLexiconCachesForTest();
    localStorage.setItem(
      UNLOCKED_KEY,
      JSON.stringify(["ja:ja-m3-2-v-gakusei"]),
    );
    const grouped = jaModule.readingAnnotation!.annotate("がくせい");
    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({ reading: "gakusei" });
  });
});

describe("Gate 10 m4 regressions (2026-07-20)", () => {
  it("くるまだ segments as kuruma + da, never kuru + mada", () => {
    const frags = annotateJapaneseText("くるまだ", true);
    expect(frags.map((f) => f.text)).toEqual(["くるま", "だ"]);
  });
  it("にほんの くるまだ keeps the word boundary through の", () => {
    const frags = annotateJapaneseText("にほんの くるまだ", true).filter((f) => f.reading);
    expect(frags.map((f) => f.text)).toEqual(["にほん", "の", "くるま", "だ"]);
  });
  it("は stays kana-faithful 'ha' in BOTH modes (Spencer ruling 2026-07-20)", () => {
    for (const grouped of [true, false]) {
      const frags = annotateJapaneseText("これは ほんだ", grouped);
      const ha = frags.find((f) => f.text === "は");
      expect(ha?.reading, `grouped=${grouped}`).toBe("ha");
    }
  });
});
