/**
 * JA M25 curriculum guard — Gate 2 of docs/retrospective-2026-07-17.md §4
 * (per-module content tests, ES/KO convention — JA previously had zero).
 *
 * The shared lints (pathway integrity, unique ids, passive-card spacing,
 * explanation lints, Gate 5 distractors, Gate 6 antiPattern minimal pairs,
 * Gate 7 complexity ratchet) come from `../__tests__/moduleContentLints.ts`;
 * this file adds M25-specific spot assertions.
 */
import { describe, it, expect } from "vitest";
import {
  getJaModuleLessons,
  moduleGrammarPointIds,
  registerJaModuleContentLints,
} from "../__tests__/moduleContentLints";

registerJaModuleContentLints("m25");

describe("JA M25 module-specific content", () => {
  it("teaches its headline grammar points via grammar_rule cards", () => {
    const gps = moduleGrammarPointIds("m25");
    expect(gps).toContain("tsumori-desu");
    expect(gps).toContain("toki");
  });

  it("ships its full lesson set including the story lesson", () => {
    const ids = getJaModuleLessons("m25").map((l) => l.id);
    expect(ids.length).toBeGreaterThanOrEqual(15);
    expect(ids).toContain("ja-m25-story");
  });
});
