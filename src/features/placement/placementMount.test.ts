import { describe, it, expect } from "vitest";
import { createBandedState, selectNextItem } from "./engine/adaptiveEngine";
import { getItemsForModule } from "./questionBank";
import { getLevelBands } from "./levelBands";

// Regression: a banded placement run must serve its first sampled question on
// mount, not finalize instantly. The bug this guards against surfaced when the
// resolved course had no items for the sampled module (e.g. the page read the
// settings language while the URL said another course, selecting against an
// empty bank). This locks the invariant at the data layer: every non-beginner
// band for a language that ships a bank has items for its sampled modules, so
// `selectNextItem` is non-null on mount.
describe("placement mount — banded run serves a first item", () => {
  for (const langId of ["ja", "ko"] as const) {
    it(`serves a sampled item on mount for each non-beginner ${langId} band`, () => {
      const lookup = (mod: string) => getItemsForModule(mod, langId);
      for (const band of getLevelBands(langId)) {
        if (band.bandModules.length === 0) continue; // complete-beginner
        const state = createBandedState(band, langId);
        expect(state.stage).toBe("sampling");
        const first = selectNextItem(state, lookup);
        expect(first).not.toBeNull();
      }
    });

    it(`every sampled module has items in ${langId}`, () => {
      for (const band of getLevelBands(langId)) {
        if (band.bandModules.length === 0) continue;
        const state = createBandedState(band, langId);
        for (const mod of state.sampleModules) {
          expect(getItemsForModule(mod, langId).length).toBeGreaterThan(0);
        }
      }
    });

    it(`complete-beginner band finalizes with nothing credited in ${langId}`, () => {
      const beginner = getLevelBands(langId).find(
        (b) => b.bandModules.length === 0,
      );
      expect(beginner).toBeDefined();
      const state = createBandedState(beginner!, langId);
      expect(state.stage).toBe("done");
      expect(state.passedModules).toEqual([]);
      expect(state.assumedModules).toEqual([]);
    });
  }
});
