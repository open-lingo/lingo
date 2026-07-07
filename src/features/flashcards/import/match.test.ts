import { describe, it, expect } from "vitest";
import { matchKnownItems } from "./match";
import type { KnownItem } from "./types";

function item(partial: Partial<KnownItem> & Pick<KnownItem, "expression">): KnownItem {
  return {
    expression: partial.expression,
    reading: partial.reading,
    meaning: partial.meaning,
    evidence: partial.evidence ?? { class: "active", intervalDays: 30, reps: 3, lapses: 0 },
  };
}

describe("matchKnownItems", () => {
  it("matches on reading == kana", () => {
    const { matches, unmatched } = matchKnownItems([item({ expression: "水", reading: "みず" })]);
    expect(unmatched).toHaveLength(0);
    expect(matches.map((m) => m.cardId)).toContain("ja:ja-m3-3-v-mizu");
  });

  it("matches on expression == kanji", () => {
    const { matches } = matchKnownItems([item({ expression: "花" })]);
    expect(matches.map((m) => m.cardId)).toContain("ja:hana");
    expect(matches).toHaveLength(1);
  });

  it("matches a conjugated expression to its dictionary atom (食べました → たべる)", () => {
    const { matches } = matchKnownItems([
      item({ expression: "食べました", reading: "たべました" }),
    ]);
    expect(matches.map((m) => m.cardId)).toContain("ja:ja-m7-1-v-taberu");
  });

  it("credits ALL atoms on ambiguity and reports the multi-match", () => {
    // 花 (flower) and 鼻 (nose) share the kana はな.
    const { matches, multiMatches } = matchKnownItems([
      item({ expression: "はな", reading: "はな" }),
    ]);
    const ids = matches.map((m) => m.cardId);
    expect(ids).toContain("ja:hana");
    expect(ids).toContain("ja:hana-nose");
    expect(multiMatches).toBe(1);
  });

  it("collects items that match no atom as unmatched", () => {
    const nonsense = item({ expression: "ぜったいにないことば" });
    const { matches, unmatched } = matchKnownItems([nonsense]);
    expect(matches).toHaveLength(0);
    expect(unmatched).toEqual([nonsense]);
  });

  it("returns everything unmatched for an unregistered language", () => {
    const items = [item({ expression: "水", reading: "みず" })];
    const { matches, unmatched } = matchKnownItems(items, "xx");
    expect(matches).toHaveLength(0);
    expect(unmatched).toEqual(items);
  });
});
