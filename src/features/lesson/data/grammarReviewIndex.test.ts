import { describe, it, expect, beforeEach } from "vitest";
import {
  getGrammarReviewIndex,
  getUncoveredGrammarPoints,
  __resetGrammarReviewIndex,
} from "./grammarReviewIndex";
import type { LessonStep } from "../types";

/**
 * Track B 3b sourcing. Two families of review steps land in the index:
 *   - LITERAL-token points (は/が/を/の/です…) reuse authored particle clozes,
 *     mapped by a cloze's `correctParticle` → the point.
 *   - TRANSFORMATION points (verb conjugation じしょけい↔ます, the 人 counter)
 *     have no literal to cloze, so they regenerate the curriculum's own
 *     known-correct transformation as a `sentenceMcq` (dict↔ます, ひとり/ふたり/
 *     …にん). Points that are neither literal nor mechanically transformable
 *     (adjective forms, demonstratives) stay uncovered — never a guessed form.
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

  it("leaves non-transformable descriptive points uncovered (no fabrication)", () => {
    const uncovered = new Set(getUncoveredGrammarPoints());
    // i-adjective present (いーけいようし（です）) is neither a literal token nor a
    // mechanical verb/counter transform — stays out of the index.
    expect(uncovered.has("i-adj-present")).toBe(true);
    // The transformation points, by contrast, are now covered.
    expect(uncovered.has("dictionary-form")).toBe(false);
    expect(uncovered.has("masu-present")).toBe(false);
    expect(uncovered.has("counter-nin")).toBe(false);
  });

  it("every indexed step is well-formed for its type (real sentence + answer)", () => {
    const idx = getGrammarReviewIndex();
    for (const steps of idx.values()) {
      for (const s of steps) {
        if (s.type === "particle_cloze") {
          expect(s.correctParticle.length).toBeGreaterThan(0);
        } else if (s.type === "multiple_choice") {
          // synthesized transformation steps: 4 options, exactly one correct,
          // and the correct option carries a non-empty answer.
          expect(s.options.length).toBe(4);
          const correct = s.options.find((o) => o.id === s.correctOptionId);
          expect(correct).toBeDefined();
          expect((correct?.text ?? "").length).toBeGreaterThan(0);
        } else {
          throw new Error(`unexpected indexed step type: ${s.type}`);
        }
      }
    }
  });

  /** Pull the correct option text out of a synthesized transformation MCQ. */
  function correctText(step: LessonStep): string {
    if (step.type !== "multiple_choice") throw new Error("not an MCQ step");
    return step.options.find((o) => o.id === step.correctOptionId)?.text ?? "";
  }

  it("M7 verb conjugation (masu-present) drills the real dict→ます transform", () => {
    const idx = getGrammarReviewIndex();
    const steps = idx.get("masu-present") ?? [];
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.type === "multiple_choice")).toBe(true);
    // At least one step asks for のむ and the correct answer is のみます, with
    // the plain form present as a distractor (so it's a genuine transform test).
    const nomu = steps.find(
      (s) => s.type === "multiple_choice" && s.prompt.includes("のむ"),
    );
    expect(nomu).toBeDefined();
    expect(correctText(nomu!)).toBe("のみます");
    if (nomu?.type === "multiple_choice") {
      const texts = nomu.options.map((o) => o.text);
      expect(texts).toContain("のむ"); // unconjugated distractor
    }
    // Every masu step credits its ます-form atom where it resolves (D4).
    const masuCredited = steps.find(
      (s) => (s.exercisedAtoms?.length ?? 0) > 0,
    );
    expect(masuCredited).toBeDefined();
  });

  it("M7 verb conjugation (dictionary-form) drills the ます→dict transform", () => {
    const idx = getGrammarReviewIndex();
    const steps = idx.get("dictionary-form") ?? [];
    expect(steps.length).toBeGreaterThan(0);
    const tabemasu = steps.find(
      (s) => s.type === "multiple_choice" && s.prompt.includes("たべます"),
    );
    expect(tabemasu).toBeDefined();
    expect(correctText(tabemasu!)).toBe("たべる");
    // Dict forms are course atoms — the step credits them for vocab SRS too.
    expect(tabemasu?.exercisedAtoms?.length ?? 0).toBeGreaterThan(0);
  });

  it("M5 人-counter (counter-nin) drills ひとり/ふたり/…にん readings", () => {
    const idx = getGrammarReviewIndex();
    const steps = idx.get("counter-nin") ?? [];
    expect(steps.length).toBeGreaterThan(0);
    const futari = steps.find(
      (s) => s.type === "multiple_choice" && s.prompt.includes("2 people"),
    );
    expect(futari).toBeDefined();
    expect(correctText(futari!)).toBe("ふたり");
    if (futari?.type === "multiple_choice") {
      const texts = futari.options.map((o) => o.text);
      // The two authored confusions: bare number に, generic counter ふたつ.
      expect(texts).toContain("に");
      expect(texts).toContain("ふたつ");
    }
    expect(futari?.exercisedAtoms?.length ?? 0).toBeGreaterThan(0);
  });
});
