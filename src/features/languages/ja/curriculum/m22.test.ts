/**
 * JA M22 curriculum guard — Gate 2 of docs/retrospective-2026-07-17.md §4
 * (per-module content tests, ES/KO convention — JA previously had zero).
 *
 * The shared lints (pathway integrity, unique ids, passive-card spacing,
 * explanation lints, Gate 5 distractors, Gate 6 antiPattern minimal pairs,
 * Gate 7 complexity ratchet) come from `../__tests__/moduleContentLints.ts`;
 * this file adds M22-specific spot assertions.
 */
import { describe, it, expect } from "vitest";
import {
  getJaModuleLessons,
  moduleGrammarPointIds,
  registerJaModuleContentLints,
} from "../__tests__/moduleContentLints";

registerJaModuleContentLints("m22");

describe("JA M22 module-specific content", () => {
  it("teaches its headline grammar points via grammar_rule cards", () => {
    const gps = moduleGrammarPointIds("m22");
    expect(gps).toContain("yori-comparison");
    expect(gps).toContain("ichiban-superlative");
  });

  it("ships its full lesson set including the story lesson", () => {
    const ids = getJaModuleLessons("m22").map((l) => l.id);
    expect(ids.length).toBeGreaterThanOrEqual(15);
    expect(ids).toContain("ja-m22-story");
  });
});
