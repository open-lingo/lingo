import { describe, it, expect } from "vitest";
import {
  ALL_STEP_TYPES,
  UNUSED_STEP_TYPES,
  buildStepTypeCoverage,
} from "./qaCatalog";
import { getMockLessonContent } from "../data/mockLessons";

describe("qaCatalog", () => {
  const coverage = buildStepTypeCoverage("ja");

  it("covers every step type with a playable lesson, except the pinned unused set", () => {
    const missing = coverage
      .filter((c) => c.picks.length === 0)
      .map((c) => c.type);
    expect(missing.sort()).toEqual([...UNUSED_STEP_TYPES].sort());
    expect(coverage.map((c) => c.type)).toEqual(ALL_STEP_TYPES);
  });

  it("picks are loadable lessons whose step counts are accurate", () => {
    for (const c of coverage) {
      for (const pick of c.picks) {
        const content = getMockLessonContent(pick.lessonId);
        expect(content, `${pick.lessonId} should load`).toBeTruthy();
        const actual = content!.steps.filter((s) => s.type === c.type).length;
        expect(actual, `${pick.lessonId} count of ${c.type}`).toBe(pick.count);
        expect(pick.count).toBeGreaterThan(0);
      }
    }
  });

  it("agreement_cloze is pinned for ja but covered by the es course", () => {
    const es = buildStepTypeCoverage("es");
    const ac = es.find((c) => c.type === "agreement_cloze");
    expect(ac?.picks.length ?? 0).toBeGreaterThan(0);
  });

  it("info is pinned for ja (removed 2026-07-16) but still covered by the es course", () => {
    // ja purged all info steps; es/ko still ship them, so the es QA page
    // exercises the info renderer. Same precedent as agreement_cloze.
    const es = buildStepTypeCoverage("es");
    const info = es.find((c) => c.type === "info");
    expect(info?.picks.length ?? 0).toBeGreaterThan(0);
  });

  it("offers two distinct lessons whenever more than one lesson uses the type", () => {
    for (const c of coverage) {
      if (c.totalLessons > 1) {
        expect(c.picks.length, `${c.type} should have 2 picks`).toBe(2);
        expect(c.picks[0].lessonId).not.toBe(c.picks[1].lessonId);
      }
    }
  });
});
