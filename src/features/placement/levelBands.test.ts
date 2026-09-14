import { describe, it, expect } from "vitest";
import { getLevelBands, getLevelBand } from "./levelBands";
import { getAllTestableModules } from "./tiers";

// TestFlight #80 QA (2026-09-14), defect 2: extending JA_SKILL_TIERS alone
// is not enough — the placement flow's actual credit ceiling is the LAST
// entry of the top-most level band (see the ⚠️ doctrine comment in
// levelBands.ts, established 2026-08-14/B103). This guards the whole
// chain: the top band's last module must be the highest testable module,
// or a learner who proves the whole course still places short.
describe("level bands credit cap tracks the tier table (no re-run of B103)", () => {
  for (const languageId of ["ja", "ko"] as const) {
    it(`${languageId}: the top band's last module is the highest testable module`, () => {
      const bands = getLevelBands(languageId);
      const nonEmptyBands = bands.filter((b) => b.bandModules.length > 0);
      const topBand = nonEmptyBands[nonEmptyBands.length - 1];
      const topBandCeiling = topBand.bandModules[topBand.bandModules.length - 1];

      const testable = getAllTestableModules(languageId);
      const highestTestable = testable[testable.length - 1];

      expect(topBandCeiling).toBe(highestTestable);
    });
  }

  it("ja: the n4 band exists and its ceiling is m46", () => {
    const band = getLevelBand("ja", "n4");
    expect(band).toBeDefined();
    expect(band?.bandModules[band.bandModules.length - 1]).toBe("m46");
    expect(band?.bandModules).toContain("m30");
  });

  it("ja: the n5 band still caps at m29 (n4 is the new top band, not a merge)", () => {
    const band = getLevelBand("ja", "n5");
    expect(band?.bandModules[band.bandModules.length - 1]).toBe("m29");
  });
});
