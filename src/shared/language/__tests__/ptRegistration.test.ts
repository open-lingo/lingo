/**
 * PT registration pin (docs/pt-course-design-2026-09-18.md §5, infra
 * scaffolding lane). `moduleConformance.test.ts` already gates every
 * `describe.each(getAllLanguageIds())` contract check generically — this
 * file pins the two PT-specific claims that test doesn't make: PT is
 * registered (so `moduleConformance` actually covers it, not vacuously),
 * and PT stays OUT of the learner-facing language switch, matching the
 * "registered but not selectable" precedent FR set before its audio gate
 * passed.
 */
import { describe, it, expect } from "vitest";
import {
  getAllLanguageIds,
  getLanguageModule,
  isLanguageRegistered,
} from "@/shared/language/registry";
import { AVAILABLE_LEARNING_LANGUAGE_IDS, getLanguageConfig } from "@/shared/domain/languageConfig";

describe("pt registration — registered but not selectable", () => {
  it("is registered", () => {
    expect(isLanguageRegistered("pt")).toBe(true);
    expect(getAllLanguageIds()).toContain("pt");
  });

  it("resolves a module with zero lesson content", () => {
    const m = getLanguageModule("pt");
    expect(m.id).toBe("pt");
    expect(m.curriculum).toEqual([]);
    expect(m.courseAtoms).toEqual([]);
    expect(m.placementBank).toEqual({ screener: [], byModule: {} });
  });

  it("has a display config (Switch-language would render it correctly IF ever shown)", () => {
    const cfg = getLanguageConfig("pt");
    expect(cfg?.name).toBe("Portuguese");
    expect(cfg?.flag).toBe("🇧🇷");
  });

  it("does NOT appear in the learner-facing language switch by default", () => {
    expect(AVAILABLE_LEARNING_LANGUAGE_IDS as readonly string[]).not.toContain("pt");
  });
});
