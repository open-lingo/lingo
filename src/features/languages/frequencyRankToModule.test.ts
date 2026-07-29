import { describe, it, expect } from "vitest";
import {
  frequencyRankToModule,
  FREQ_FIRST_MODULE,
  FREQ_LAST_MODULE_DEFAULT,
} from "./frequencyTypes";

describe("frequencyRankToModule", () => {
  it("rank 1 (most frequent) unlocks at the first frequency module", () => {
    expect(frequencyRankToModule(1)).toBe(FREQ_FIRST_MODULE);
  });

  it("is monotonic non-decreasing across the whole rank range", () => {
    let prev = -Infinity;
    for (let rank = 1; rank <= 5000; rank++) {
      const m = frequencyRankToModule(rank);
      expect(m).toBeGreaterThanOrEqual(prev);
      prev = m;
    }
  });

  it("stays within [firstModule, lastModule] for any input", () => {
    for (const rank of [1, 8, 9, 100, 1000, 100000, 0, -5, 1.7]) {
      const m = frequencyRankToModule(rank);
      expect(m).toBeGreaterThanOrEqual(FREQ_FIRST_MODULE);
      expect(m).toBeLessThanOrEqual(FREQ_LAST_MODULE_DEFAULT);
    }
  });

  it("clamps huge ranks to the last module (never unlocks past content)", () => {
    expect(frequencyRankToModule(10_000_000)).toBe(FREQ_LAST_MODULE_DEFAULT);
    expect(frequencyRankToModule(10_000_000, { lastModule: 30 })).toBe(30);
  });

  it("buckets by wordsPerModule: the Nth bucket boundary advances the module", () => {
    // Default 8 words/module, first module 3.
    expect(frequencyRankToModule(8)).toBe(3); // last of bucket 0
    expect(frequencyRankToModule(9)).toBe(4); // first of bucket 1
    expect(frequencyRankToModule(16)).toBe(4);
    expect(frequencyRankToModule(17)).toBe(5);
  });

  it("respects override tuning", () => {
    expect(
      frequencyRankToModule(1, { firstModule: 5, wordsPerModule: 2 }),
    ).toBe(5);
    expect(
      frequencyRankToModule(3, { firstModule: 5, wordsPerModule: 2 }),
    ).toBe(6);
  });
});
