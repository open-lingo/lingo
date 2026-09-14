import { describe, it, expect } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getSkillTiers, getAllTestableModules } from "./tiers";

// Regression guard for TestFlight #80 QA (2026-09-14, defect 2): the JA
// tier table topped out at m28/m29 while the course itself ran to m46, so
// banded placement could never credit the whole N4 line even though
// per-module test-out already reached it. This asserts the tier table can
// never silently go stale again for a language that registers tiers: every
// real course module (minus the script modules, which are auto-completed
// rather than placement-tested — see LANGUAGE_PLACEMENT_CONFIG in
// applyPlacement.ts) must appear in some tier.
const SCRIPT_MODULES_BY_LANGUAGE: Record<string, readonly string[]> = {
  ja: ["m1", "m2"],
  ko: ["m1", "m2"],
};

describe("skill tiers cover the full registered course (no stale tail)", () => {
  for (const languageId of ["ja", "ko"] as const) {
    it(`every ${languageId} course module (minus script modules) appears in some tier`, () => {
      const course = getMockCourse(languageId);
      const scriptModules = new Set(SCRIPT_MODULES_BY_LANGUAGE[languageId] ?? []);
      const courseModuleIds = course.modules
        .map((m) => m.id)
        .filter((id) => /^m\d+$/.test(id) && !scriptModules.has(id));

      const testable = new Set(getAllTestableModules(languageId));
      const missing = courseModuleIds.filter((id) => !testable.has(id));
      expect(
        missing,
        `${languageId} modules missing from the tier table: ${missing.join(", ")}`,
      ).toEqual([]);
    });
  }

  it("JA tiers extend through m46 (the N4 line) — TestFlight #80 QA", () => {
    const jaModules = getAllTestableModules("ja");
    expect(jaModules).toContain("m30");
    expect(jaModules).toContain("m46");
    expect(jaModules).not.toContain("m47"); // m47 is WIP, not yet on the course map
  });

  it("every tier's screeningModuleId is one of its own modules", () => {
    for (const languageId of ["ja", "ko"] as const) {
      for (const tier of getSkillTiers(languageId)) {
        expect(
          tier.modules,
          `${languageId} tier ${tier.tier}'s screeningModuleId must be one of its own modules`,
        ).toContain(tier.screeningModuleId);
      }
    }
  });
});
