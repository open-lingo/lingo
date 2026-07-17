/**
 * JA M14 curriculum guard — Gate 2 of docs/retrospective-2026-07-17.md §4
 * (per-module content tests, ES/KO convention — JA previously had zero).
 *
 * The shared lints (pathway integrity, unique ids, passive-card spacing,
 * explanation lints, Gate 5 distractors, Gate 6 antiPattern minimal pairs,
 * Gate 7 complexity ratchet) come from `../__tests__/moduleContentLints.ts`;
 * this file adds M14-specific spot assertions.
 */
import { describe, it, expect } from "vitest";
import {
  getJaModuleLessons,
  moduleGrammarPointIds,
  registerJaModuleContentLints,
} from "../__tests__/moduleContentLints";

registerJaModuleContentLints("m14");

describe("JA M14 module-specific content", () => {
  it("teaches its headline grammar points via grammar_rule cards", () => {
    const gps = moduleGrammarPointIds("m14");
    expect(gps).toContain("te-form");
    expect(gps).toContain("te-kudasai");
  });

  it("ships its full lesson set including the story lesson", () => {
    const ids = getJaModuleLessons("m14").map((l) => l.id);
    expect(ids.length).toBeGreaterThanOrEqual(15);
    expect(ids).toContain("ja-m14-story");
  });

  it("ships a spread of て-form conversion pickers (the module's core drill)", () => {
    // Derivation pickers ("Convert のむ to て-form") are m14's signature step.
    // They quote the source verb in the prompt, so Gate 5's real-form rule
    // deliberately exempts them (wrong derivations ARE the distractors);
    // this pin just keeps the drill format from silently vanishing.
    let pickers = 0;
    for (const lesson of getJaModuleLessons("m14")) {
      for (const step of lesson.steps) {
        if (step.type !== "build_sentence") continue;
        if (step.correctOrder.length === 1 && /て-form|た-form/.test(step.prompt)) pickers++;
      }
    }
    expect(pickers).toBeGreaterThanOrEqual(8);
  });
});
