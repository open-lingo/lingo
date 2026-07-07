import { describe, it, expect } from "vitest";
import { writtenSegments } from "./writtenForms";
import {
  VERB_ENTRIES,
  ADJ_ENTRIES,
  type ConjugationForm,
  type AdjForm,
} from "./conjugationTables";

const HAN = /^\p{Script=Han}+$/u;
const KANA = /^[\p{Script=Hiragana}ー]+$/u;

describe("writtenSegments", () => {
  it("splits a leading-kanji word into [kanji+ruby, kana tail]", () => {
    expect(writtenSegments("たべる", "食べる", "たべなかった")).toEqual([
      { text: "食", ruby: "た" },
      { text: "べなかった" },
    ]);
  });

  it("handles multi-kana readings (高い → たかくない)", () => {
    expect(writtenSegments("たかい", "高い", "たかくない")).toEqual([
      { text: "高", ruby: "たか" },
      { text: "くない" },
    ]);
  });

  it("survives 来る's per-form reading changes (length-preserving prefix)", () => {
    expect(writtenSegments("くる", "来る", "こない")).toEqual([
      { text: "来", ruby: "こ" },
      { text: "ない" },
    ]);
    expect(writtenSegments("くる", "来る", "きました")).toEqual([
      { text: "来", ruby: "き" },
      { text: "ました" },
    ]);
  });

  it("no kanji form → single plain segment", () => {
    expect(writtenSegments("する", undefined, "しない")).toEqual([{ text: "しない" }]);
  });
});

describe("kanji fields — structural contract across all table entries", () => {
  const all = [
    ...VERB_ENTRIES.map((e) => ({ ...e, forms: e.forms as Record<string, string> })),
    ...ADJ_ENTRIES.map((e) => ({ ...e, forms: e.forms as Record<string, string> })),
  ];

  for (const entry of all.filter((e) => e.kanji)) {
    it(`${entry.id}: ${entry.kanji} matches the prefix-substitution contract`, () => {
      const kanji = entry.kanji!;
      // Longest common suffix = okurigana tail; what remains must be a pure
      // kanji block replacing a nonempty kana prefix.
      let suffix = 0;
      while (
        suffix < entry.dictionary.length &&
        suffix < kanji.length &&
        entry.dictionary[entry.dictionary.length - 1 - suffix] ===
          kanji[kanji.length - 1 - suffix]
      ) {
        suffix++;
      }
      const kanaPrefix = entry.dictionary.slice(0, entry.dictionary.length - suffix);
      const kanjiPrefix = kanji.slice(0, kanji.length - suffix);
      expect(kanaPrefix.length, "replaces a nonempty kana prefix").toBeGreaterThan(0);
      expect(kanjiPrefix, "leading block is pure kanji").toMatch(HAN);
      expect(kanaPrefix, "replaced prefix is pure kana").toMatch(KANA);
      if (suffix > 0) {
        expect(kanji.slice(kanji.length - suffix), "tail is pure kana").toMatch(KANA);
      }

      // Every conjugated form in the tables must derive cleanly: a kanji
      // segment with a nonempty reading + a nonempty kana remainder.
      for (const [form, value] of Object.entries(entry.forms) as Array<
        [ConjugationForm | AdjForm, string]
      >) {
        const segs = writtenSegments(entry.dictionary, kanji, value);
        expect(segs.length, `${form} derives a ruby split`).toBe(2);
        expect(segs[0].text).toBe(kanjiPrefix);
        expect(segs[0].ruby!.length).toBe(kanaPrefix.length);
        expect(segs[1].text.length).toBeGreaterThan(0);
      }
    });
  }
});
