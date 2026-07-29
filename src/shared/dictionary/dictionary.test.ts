import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetDictionaryForTests,
  foldText,
  getDictionaryEntries,
  lookupWord,
  searchDictionary,
  type DictionaryEntry,
} from "./index";
import { getAllLanguageIds } from "@/shared/language/registry";
import { getFrequencyAtoms } from "@/features/languages/frequencyResolver";

beforeEach(() => {
  __resetDictionaryForTests();
});

/** Re-derive the ranking tier the service uses, for data-independent assertions. */
function tierOf(query: string, e: DictionaryEntry): number {
  const q = foldText(query);
  let best = 3;
  for (const field of [e.surface, e.reading, e.meaningEn].map(foldText)) {
    if (field === q) return 0;
    if (field.startsWith(q)) best = Math.min(best, 1);
    else if (field.includes(q)) best = Math.min(best, 2);
  }
  return best;
}

const effRank = (e: DictionaryEntry) =>
  e.frequencyRank ?? Number.POSITIVE_INFINITY;

describe("index build", () => {
  it("builds for every registered language without throwing", () => {
    for (const lang of getAllLanguageIds()) {
      expect(() => getDictionaryEntries(lang)).not.toThrow();
    }
  });

  it("yields entries for the shipped languages", () => {
    expect(getDictionaryEntries("ja").length).toBeGreaterThan(0);
    expect(getDictionaryEntries("ko").length).toBeGreaterThan(0);
    expect(getDictionaryEntries("es").length).toBeGreaterThan(0);
  });

  it("a language with no frequency atoms still yields course entries", () => {
    // ES ships zero frequency atoms today.
    expect(getFrequencyAtoms("es").length).toBe(0);
    const es = getDictionaryEntries("es");
    expect(es.length).toBeGreaterThan(0);
    expect(es.every((e) => e.source === "course")).toBe(true);
  });

  it("an unregistered language reads as empty (never throws or falls back)", () => {
    expect(getDictionaryEntries("fr")).toEqual([]);
    expect(lookupWord("fr", "bonjour")).toBeNull();
    expect(searchDictionary("fr", "bonjour")).toEqual([]);
  });

  it("every entry carries the required shape", () => {
    for (const e of getDictionaryEntries("ja").slice(0, 50)) {
      expect(e.id).toMatch(/^ja:/);
      expect(e.languageId).toBe("ja");
      expect(typeof e.surface).toBe("string");
      expect(typeof e.reading).toBe("string");
      expect(typeof e.meaningEn).toBe("string");
      expect(["course", "frequency", "both"]).toContain(e.source);
    }
  });
});

describe("lookupWord", () => {
  it("exact surface hit", () => {
    const e = lookupWord("ja", "あい");
    expect(e?.id).toBe("ja:ai");
    expect(e?.meaningEn).toBe("love");
  });

  it("normalized hit — JA romaji resolves to the kana word", () => {
    const e = lookupWord("ja", "ai");
    expect(e?.id).toBe("ja:ai");
  });

  it("normalized hit — KO Revised-Romanization resolves to the Hangul word", () => {
    const byHangul = lookupWord("ko", "하다");
    const byRr = lookupWord("ko", "hada");
    expect(byHangul?.id).toBe("ko:하다");
    expect(byRr?.id).toBe("ko:하다");
  });

  it("normalized hit — ES accent + case fold", () => {
    const canonical = lookupWord("es", "adiós");
    expect(canonical?.meaningEn).toBe("goodbye");
    expect(lookupWord("es", "adios")?.id).toBe(canonical?.id);
    expect(lookupWord("es", "ADIÓS")?.id).toBe(canonical?.id);
    expect(lookupWord("es", "Adios")?.id).toBe(canonical?.id);
  });

  it("unknown word → null; empty query → null", () => {
    expect(lookupWord("ja", "zzzznotaword")).toBeNull();
    expect(lookupWord("ja", "")).toBeNull();
  });
});

describe("searchDictionary", () => {
  it("empty / whitespace query → []", () => {
    expect(searchDictionary("ja", "")).toEqual([]);
    expect(searchDictionary("ja", "   ")).toEqual([]);
  });

  it("finds by English meaning", () => {
    const results = searchDictionary("ja", "love");
    expect(results.some((e) => e.id === "ja:ai")).toBe(true);
  });

  it("ranks exact > prefix > substring, then by frequency", () => {
    const results = searchDictionary("ja", "ai");
    expect(results.length).toBeGreaterThan(1);

    // Exact reading match ("ai" === あい's reading) ranks first.
    expect(results[0].id).toBe("ja:ai");

    // Tiers are non-decreasing across the ranked list.
    const tiers = results.map((e) => tierOf("ai", e));
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i]).toBeGreaterThanOrEqual(tiers[i - 1]);
    }

    // Frequency tiebreak: within a tier, lower rank first.
    for (let i = 1; i < results.length; i++) {
      if (tiers[i] === tiers[i - 1]) {
        expect(effRank(results[i])).toBeGreaterThanOrEqual(
          effRank(results[i - 1]),
        );
      }
    }
  });

  it("caps results via opts.limit", () => {
    const capped = searchDictionary("ko", "a", { limit: 5 });
    expect(capped.length).toBeLessThanOrEqual(5);
  });
});

describe("dedup + source", () => {
  it("a surface in both course + frequency yields ONE 'both' entry keeping the course definition + gaining the rank", () => {
    // ko:하다 is an authored course atom AND frequency rank 2.
    const all = getDictionaryEntries("ko");
    const matches = all.filter((e) => e.id === "ko:하다");
    expect(matches).toHaveLength(1);

    const hada = matches[0];
    expect(hada.source).toBe("both");
    // Course definition wins (frequency's plain gloss is "to do").
    expect(hada.meaningEn).toBe("to do (dictionary form)");
    // ...but it gains the frequency rank.
    expect(hada.frequencyRank).toBe(2);
  });

  it("course-only and frequency-only entries carry the right source", () => {
    // ES has only course atoms.
    expect(getDictionaryEntries("es").every((e) => e.source === "course")).toBe(
      true,
    );
    // A KO frequency-only word (있다 is rank 1, not an authored course atom).
    const itda = lookupWord("ko", "있다");
    expect(itda?.source).toBe("frequency");
    expect(itda?.frequencyRank).toBe(1);
  });
});

describe("conjugation + audio", () => {
  it("attaches the resolved conjugation paradigm for conjugable entries", () => {
    const hada = lookupWord("ko", "하다");
    expect(hada?.conjugation).toBeDefined();
    expect(hada?.conjugation?.lemmaAtomId).toBe("ko:하다");
    expect(hada?.conjugation?.forms.dictionary).toBe("하다");
  });

  it("non-conjugable entries omit conjugation", () => {
    expect(lookupWord("ja", "あい")?.conjugation).toBeUndefined();
  });

  it("hasAudio reflects recorded clips (JA vocab ships clips)", () => {
    expect(lookupWord("ja", "あい")?.hasAudio).toBe(true);
  });
});

describe("getDictionaryEntries filters + sort", () => {
  it("default sort is by frequency (most frequent first)", () => {
    const entries = getDictionaryEntries("ko");
    expect(entries[0].frequencyRank).toBe(1);
    let prev = -1;
    for (const e of entries) {
      const r = effRank(e);
      expect(r).toBeGreaterThanOrEqual(prev);
      prev = r;
    }
  });

  it("filters by pos", () => {
    const verbs = getDictionaryEntries("ko", { pos: "verb" });
    expect(verbs.length).toBeGreaterThan(0);
    expect(verbs.every((e) => e.pos === "verb")).toBe(true);
  });

  it("filters by source", () => {
    const both = getDictionaryEntries("ko", { source: "both" });
    expect(both.length).toBeGreaterThan(0);
    expect(both.every((e) => e.source === "both")).toBe(true);
  });

  it("filters by maxUnlockModule", () => {
    const early = getDictionaryEntries("ko", { maxUnlockModule: 3 });
    expect(early.length).toBeGreaterThan(0);
    for (const e of early) {
      const n = Number(/^m(\d+)$/.exec(e.unlockModule ?? "")?.[1] ?? Infinity);
      expect(n).toBeLessThanOrEqual(3);
    }
  });

  it("sorts alphabetically by surface when asked", () => {
    const sorted = getDictionaryEntries("es", { sort: "surface", limit: 20 });
    const surfaces = sorted.map((e) => e.surface);
    const copy = [...surfaces].sort((a, b) => a.localeCompare(b));
    expect(surfaces).toEqual(copy);
  });
});
