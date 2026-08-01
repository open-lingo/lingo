import { describe, it, expect } from "vitest";
import { LEVEL_BANDS, levelBand, levelCeiling } from "./levels";

describe("level bands", () => {
  it("covers levels 1-5 with ascending, non-overlapping sentence ranges", () => {
    expect(LEVEL_BANDS.map((b) => b.level)).toEqual([1, 2, 3, 4, 5]);
    for (let i = 1; i < LEVEL_BANDS.length; i++) {
      expect(LEVEL_BANDS[i].minSentences).toBeGreaterThan(LEVEL_BANDS[i - 1].maxSentences);
      expect(LEVEL_BANDS[i].maxGlosses).toBeGreaterThanOrEqual(LEVEL_BANDS[i - 1].maxGlosses);
    }
  });

  it("levelBand returns the band for a level", () => {
    expect(levelBand(1).minSentences).toBe(4);
    expect(levelBand(1).maxSentences).toBe(6);
    expect(levelBand(5).minSentences).toBe(25);
    expect(levelBand(5).maxSentences).toBe(35);
    expect(levelBand(3).maxGlosses).toBe(4);
  });

  it("levelCeiling grows with module and never exceeds 5", () => {
    expect(levelCeiling(3)).toBe(2);
    expect(levelCeiling(6)).toBe(2);
    expect(levelCeiling(7)).toBe(3);
    expect(levelCeiling(12)).toBe(3);
    expect(levelCeiling(13)).toBe(4);
    expect(levelCeiling(20)).toBe(4);
    expect(levelCeiling(21)).toBe(5);
    expect(levelCeiling(99)).toBe(5);
  });

  it("levelCeiling is monotonic", () => {
    for (let m = 1; m < 40; m++) {
      expect(levelCeiling(m + 1)).toBeGreaterThanOrEqual(levelCeiling(m));
    }
  });
});
