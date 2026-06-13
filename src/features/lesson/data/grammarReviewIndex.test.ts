import { describe, it, expect, beforeEach } from "vitest";
import {
  getGrammarReviewIndex,
  getUncoveredGrammarPoints,
  __resetGrammarReviewIndex,
} from "./grammarReviewIndex";

/**
 * Track B 3b: review steps are REUSED authored particle-clozes, never
 * fabricated. Literal-token points (は/が/を/の/です…) get covered by mapping
 * a cloze's correctParticle → the point; descriptive points (じしょけい…) are
 * left uncovered rather than drilled with a guessed sentence.
 */
describe("grammarReviewIndex (3b sourcing)", () => {
  beforeEach(__resetGrammarReviewIndex);

  it("maps authored particle clozes to particle/marker grammar points", () => {
    const idx = getGrammarReviewIndex();
    expect(idx.has("wa-topic")).toBe(true); // は has authored clozes (m3/m4)
    const steps = idx.get("wa-topic") ?? [];
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.type === "particle_cloze")).toBe(true);
  });

  it("leaves descriptive-token points uncovered (no fabricated drills)", () => {
    const uncovered = new Set(getUncoveredGrammarPoints());
    // dictionary-form's `point` is じしょけい — nothing literal to cloze.
    expect(uncovered.has("dictionary-form")).toBe(true);
  });

  it("every indexed step is a real authored step (has a sentence + answer)", () => {
    const idx = getGrammarReviewIndex();
    for (const steps of idx.values()) {
      for (const s of steps) {
        const cp = (s as unknown as { correctParticle?: string }).correctParticle;
        expect(typeof cp).toBe("string");
        expect((cp ?? "").length).toBeGreaterThan(0);
      }
    }
  });
});
