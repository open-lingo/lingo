/**
 * Guide density-bar guard (2026-07-20, module-3 reauthor pass): no two
 * adjacent same-type steps, max 2 selection-taps in a row, 18-24 steps,
 * >=5 distinct types, every lesson closes on a match grid.
 */
import { describe, it, expect } from "vitest";
import { M3_NEO_LESSONS } from "@/features/languages/ja/curriculum/m3-neo";
const SELECTION = new Set(["listening_comp","word_image_mcq","sentence_mcq","particle_cloze","self_explanation_mcq"]);
describe("m3-neo variety bar", () => {
  for (const lesson of M3_NEO_LESSONS) {
    it(`${lesson.id}: no adjacent same-type, max 2 selection taps in a row, 18-24 steps, ends match_pairs`, () => {
      const types = lesson.steps.map((s: any) => s.type);
      for (let i = 1; i < types.length; i++)
        expect(types[i], `${lesson.id} adjacent ${types[i]} @${i}`).not.toBe(types[i-1]);
      let run = 0;
      for (const t of types) {
        run = SELECTION.has(t) ? run + 1 : 0;
        expect(run, `${lesson.id} selection run`).toBeLessThanOrEqual(2);
      }
      expect(types.length).toBeGreaterThanOrEqual(18);
      expect(types.length).toBeLessThanOrEqual(24);
      expect(types[types.length-1]).toBe("match_pairs");
      expect(new Set(types).size).toBeGreaterThanOrEqual(5);
    });
  }
});
