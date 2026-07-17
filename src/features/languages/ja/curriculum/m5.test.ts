/**
 * JA M5 curriculum guard — Gate 2 of docs/retrospective-2026-07-17.md §4
 * (per-module content tests, ES/KO convention — JA previously had zero).
 *
 * The shared lints (pathway integrity, unique ids, passive-card spacing,
 * explanation lints, Gate 5 distractors, Gate 6 antiPattern minimal pairs,
 * Gate 7 complexity ratchet) come from `../__tests__/moduleContentLints.ts`;
 * this file adds M5-specific spot assertions.
 */
import { describe, it, expect } from "vitest";
import {
  getJaModuleLessons,
  moduleGrammarPointIds,
  registerJaModuleContentLints,
} from "../__tests__/moduleContentLints";

registerJaModuleContentLints("m5");

describe("JA M5 module-specific content", () => {
  it("teaches its headline grammar points via grammar_rule cards", () => {
    const gps = moduleGrammarPointIds("m5");
    expect(gps).toContain("kudasai");
  });

  it("ships its full lesson set including the story lesson", () => {
    const ids = getJaModuleLessons("m5").map((l) => l.id);
    expect(ids.length).toBeGreaterThanOrEqual(16);
    expect(ids).toContain("ja-m5-story");
  });
});
