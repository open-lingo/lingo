/**
 * JA M9 curriculum guard — Gate 2 of docs/retrospective-2026-07-17.md §4
 * (per-module content tests, ES/KO convention — JA previously had zero).
 *
 * The shared lints (pathway integrity, unique ids, passive-card spacing,
 * explanation lints, Gate 5 distractors, Gate 6 antiPattern minimal pairs,
 * Gate 7 complexity ratchet) come from `../__tests__/moduleContentLints.ts`;
 * this file adds M9-specific spot assertions.
 */
import { describe, it, expect } from "vitest";
import {
  getJaModuleLessons,
  moduleGrammarPointIds,
  registerJaModuleContentLints,
} from "../__tests__/moduleContentLints";

registerJaModuleContentLints("m9");

describe("JA M9 module-specific content", () => {
  it("teaches its headline grammar points via grammar_rule cards", () => {
    const gps = moduleGrammarPointIds("m9");
    expect(gps).toContain("na-adj-present");
    expect(gps).toContain("na-adj-negative");
  });

  it("ships its full lesson set including the story lesson", () => {
    const ids = getJaModuleLessons("m9").map((l) => l.id);
    expect(ids.length).toBeGreaterThanOrEqual(16);
    expect(ids).toContain("ja-m9-story");
  });
});
