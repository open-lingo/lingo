import { describe, it, expect } from "vitest";
import {
  getFluencyLevels,
  levelForContentNumber,
  groupModulesByLevel,
} from "./courseLevels";

describe("courseLevels", () => {
  it("returns an authored ladder for known languages", () => {
    const ja = getFluencyLevels("ja");
    expect(ja.length).toBeGreaterThan(1);
    // First level covers the writing-system modules (1-2).
    expect(ja[0].fromContentNumber).toBe(1);
    expect(ja[0].toContentNumber).toBe(2);
    // Last level is open-ended so extra modules stay grouped.
    expect(ja[ja.length - 1].toContentNumber).toBe(Infinity);
  });

  it("falls back to a generic ladder for unknown languages", () => {
    const gen = getFluencyLevels("zz");
    expect(gen.length).toBe(3);
    expect(gen[gen.length - 1].toContentNumber).toBe(Infinity);
  });

  it("resolves a content-module number to its level", () => {
    // JA: m1/m2 = foundations, m3 = first sentences, m22+ = toward N5.
    expect(levelForContentNumber("ja", 1)?.cefr).toBe("Pre-A1");
    expect(levelForContentNumber("ja", 3)?.id).toBe("ja-a1-1");
    expect(levelForContentNumber("ja", 8)?.id).toBe("ja-a1-2");
    expect(levelForContentNumber("ja", 22)?.id).toBe("ja-a2-2");
    // A far module still resolves into the open-ended final level.
    expect(levelForContentNumber("ja", 99)?.id).toBe("ja-a2-2");
  });

  it("every level has a non-empty outcome for the informative header", () => {
    for (const level of getFluencyLevels("ja")) {
      expect(level.outcome.length).toBeGreaterThan(10);
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  describe("groupModulesByLevel", () => {
    type M = { id: string; contentNumber: number | null };
    const num = (m: M) => m.contentNumber;

    it("groups contiguous content modules into level sections in order", () => {
      const items: M[] = [
        { id: "m1", contentNumber: 1 },
        { id: "m2", contentNumber: 2 },
        { id: "m3", contentNumber: 3 },
        { id: "m8", contentNumber: 8 },
      ];
      const groups = groupModulesByLevel("ja", items, num);
      // Pre-A1 (1-2), A1 (3-7), A1+ (8-13).
      expect(groups.map((g) => g.level.cefr)).toEqual(["Pre-A1", "A1", "A1+"]);
      expect(groups[0].items.map((i) => i.id)).toEqual(["m1", "m2"]);
      expect(groups[1].items.map((i) => i.id)).toEqual(["m3"]);
      expect(groups[2].items.map((i) => i.id)).toEqual(["m8"]);
    });

    it("review modules (null contentNumber) inherit the preceding level", () => {
      const items: M[] = [
        { id: "m3", contentNumber: 3 },
        { id: "m3-review", contentNumber: null },
        { id: "m4", contentNumber: 4 },
      ];
      const groups = groupModulesByLevel("ja", items, num);
      // All three fall inside the A1 block (3-7), one contiguous group.
      expect(groups).toHaveLength(1);
      expect(groups[0].level.cefr).toBe("A1");
      expect(groups[0].items.map((i) => i.id)).toEqual([
        "m3",
        "m3-review",
        "m4",
      ]);
    });

    it("preserves total item count across all groups", () => {
      const items: M[] = Array.from({ length: 10 }, (_, i) => ({
        id: `m${i + 1}`,
        contentNumber: i + 1,
      }));
      const groups = groupModulesByLevel("ja", items, num);
      const flat = groups.flatMap((g) => g.items);
      expect(flat).toHaveLength(items.length);
    });
  });
});
