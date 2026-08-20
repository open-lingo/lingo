/**
 * F5 (fr pin): accents that change the word are not "accepted-but-flagged".
 * The FR module ships an AccentPolicy naming the minimal pairs whose
 * diacritic IS the word; gradeTypedAnswer refuses to accent-fold across
 * them while staying lenient on ordinary accents. Until this capability
 * existed, F5 forbade authoring typed steps on these pairs — this suite is
 * what lifts that ban.
 */
import { describe, it, expect } from "vitest";
import { frModule } from "../module";
import { gradeTypedAnswer } from "@/shared/speech/loose-match";

describe("frModule.accentPolicy (F5)", () => {
  it("declares the five F5 minimal pairs by folded key", () => {
    const p = frModule.accentPolicy;
    expect(p).toBeDefined();
    for (const key of ["a", "ou", "sur", "du", "la"]) {
      expect(p!.protectedFoldedForms.has(key)).toBe(true);
    }
  });

  it("grades ou as WRONG for où under the module policy", () => {
    expect(
      gradeTypedAnswer(["où"], "ou", frModule.accentPolicy).correct,
    ).toBe(false);
  });

  it("still folds ordinary accents leniently under the module policy", () => {
    const g = gradeTypedAnswer(["très bien"], "tres bien", frModule.accentPolicy);
    expect(g.correct).toBe(true);
    expect(g.accentFlagged).toBe(true);
  });
});
