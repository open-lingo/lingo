import { describe, it, expect } from "vitest";
import { lookupWordSenses, getDictionaryEntries } from "./index";
import { getTaughtLexiconSeeds, taughtLexiconSurfaces } from "./taughtLexicon";

const LANGS = ["ko", "ja"];

/**
 * `TAUGHT_LEXICON` is the list of surfaces the course teaches whole but never
 * atomizes. The gate accepts them, so authored content uses them freely — which
 * means every one of them is text a learner is expected to READ. If the
 * dictionary cannot answer for one, `TappableText` shreds it into its pieces
 * and answers with the wrong words instead (the `나요` → 나 + 요 bug).
 */
describe("taught lexicon → dictionary", () => {
  it("glosses every surface the gate teaches", () => {
    for (const lang of LANGS) {
      const glossed = new Set(getTaughtLexiconSeeds(lang).map((s) => s.surface));
      const missing = taughtLexiconSurfaces(lang).filter((s) => !glossed.has(s));
      expect({ lang, missing }).toEqual({ lang, missing: [] });
    }
  });

  it("makes every taught surface lookupable", () => {
    for (const lang of LANGS) {
      const unresolved = taughtLexiconSurfaces(lang).filter(
        (s) => lookupWordSenses(lang, s).length === 0,
      );
      expect({ lang, unresolved }).toEqual({ lang, unresolved: [] });
    }
  });

  // The reported bug: `열이 나요` is "has a fever". 나요 was not in the
  // dictionary, so it was read as 나 ("I") + 요 — two confidently wrong answers
  // for one word the course teaches at m20.
  it("resolves 나요 to 나다, not to 나", () => {
    const [best] = lookupWordSenses("ko", "나요");
    expect(best).toBeDefined();
    expect(best.meaningEn).toContain("나다");
    expect(best.unlockModule).toBe("m20");
    expect(best.reading).toBe("nayo");
  });

  it.each([
    ["싶어요", "want"],
    ["알겠어요", "알다"],
    ["괜찮을", "괜찮다"],
    ["드릴까요", "드리다"],
    ["막혔거든요", "막히다"],
    ["조심하세요", "조심하다"],
    ["요리할까요", "요리하다"],
    ["이게", "이것"],
  ])("resolves the taught surface %s", (surface, expected) => {
    const [best] = lookupWordSenses("ko", surface);
    expect(best).toBeDefined();
    expect(best.meaningEn).toContain(expected);
  });

  // An inflection has to name its dictionary form, or the learner meets 나요 in
  // a story and 나다 in a vocab list with nothing connecting them.
  it("names the dictionary form on an inflected surface", () => {
    const [best] = lookupWordSenses("ko", "늦었어요");
    expect(best.meaningEn).toBe("was late (from 늦다)");
  });

  // Nothing is restated: the course's own atom for a surface stays the answer,
  // and the lexicon does not add a second row saying the same thing.
  it("defers to the curriculum's atom rather than duplicating it", () => {
    const senses = lookupWordSenses("ko", "좋아해요");
    expect(senses).toHaveLength(1);
    expect(senses[0].id).toBe("ko:좋아해요");
    expect(getDictionaryEntries("ko").filter((e) => e.surface === "여기")).not.toContainEqual(
      expect.objectContaining({ id: "ko:lex-여기" }),
    );
  });

  // 보고 is "report" in the frequency list and the 보다 + 고 form in the course.
  // Both are real, so this rides the multi-sense path rather than replacing an
  // entry — same shape as the 열 fix.
  it("adds a taught sense alongside an existing unrelated one", () => {
    const senses = lookupWordSenses("ko", "보고");
    expect(senses.map((s) => s.meaningEn)).toEqual([
      "seeing, watching (from 보다)",
      "report",
    ]);
  });

  // Regression guard for 67b937d9 — the homograph fix must survive the new
  // source. 열 is "ten" (열 시에) and "fever" (열이 나요).
  it("keeps both senses of 열", () => {
    const meanings = lookupWordSenses("ko", "열").map((s) => s.meaningEn);
    expect(meanings).toContain("ten (10, native)");
    expect(meanings).toContain("fever / heat");
  });

  it("namespaces its ids so they can never shadow an atom id", () => {
    for (const lang of LANGS) {
      for (const seed of getTaughtLexiconSeeds(lang)) {
        expect(seed.id).toBe(`${lang}:lex-${seed.surface}`);
      }
    }
  });
});
