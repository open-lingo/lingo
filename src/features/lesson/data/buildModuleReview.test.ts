import { describe, it, expect } from "vitest";
import { buildModuleReviewLessons } from "./buildModuleReview";
import { POOL_M3, POOL_M4 } from "./jaReviewPools";

describe("buildModuleReviewLessons", () => {
  it("emits 3 review lessons + 1 mastery test per cycle", () => {
    const lessons = buildModuleReviewLessons({
      reviewModuleId: "m3-review",
      reviewTitle: "Review · M3",
      pools: [POOL_M3],
      courseId: "mock-1",
      languageId: "ja",
    });
    expect(lessons.length).toBe(4);
    expect(lessons[0].id).toBe("ja-m3-review-1");
    expect(lessons[1].id).toBe("ja-m3-review-2");
    expect(lessons[2].id).toBe("ja-m3-review-3");
    expect(lessons[3].id).toBe("ja-m3-review-test");
    for (const l of lessons) {
      expect(l.kind).toBe("module_review");
      expect(l.moduleId).toBe("m3-review");
    }
  });

  it("each content lesson contains cloze + build + dialogue steps", () => {
    const lessons = buildModuleReviewLessons({
      reviewModuleId: "m3-review",
      reviewTitle: "Review · M3",
      pools: [POOL_M3],
      courseId: "mock-1",
      languageId: "ja",
    });
    for (let i = 0; i < 3; i++) {
      const types = new Set(lessons[i].steps.map((s) => s.type));
      expect(types.has("particle_cloze")).toBe(true);
      expect(types.has("build_sentence")).toBe(true);
      expect(types.has("phrase_card")).toBe(true);
      expect(types.has("info")).toBe(true);
    }
  });

  it("test lesson contains a row_test step", () => {
    const lessons = buildModuleReviewLessons({
      reviewModuleId: "m3-review",
      reviewTitle: "Review · M3",
      pools: [POOL_M3],
      courseId: "mock-1",
      languageId: "ja",
    });
    const test = lessons.find((l) => l.id.endsWith("-test"))!;
    const rowTest = test.steps.find((s) => s.type === "row_test");
    expect(rowTest).toBeDefined();
    if (rowTest?.type !== "row_test") return;
    expect(rowTest.items.length).toBeGreaterThan(3);
  });

  it("multi-module cycle interleaves across pools", () => {
    const lessons = buildModuleReviewLessons({
      reviewModuleId: "m4-review",
      reviewTitle: "Review · M3+M4",
      pools: [POOL_M3, POOL_M4],
      courseId: "mock-1",
      languageId: "ja",
    });
    // Each cloze item carries an audioText drawn from POOL_M3 or POOL_M4.
    const allM3Texts = new Set(POOL_M3.clozes.map((c) => c.audioText));
    const allM4Texts = new Set(POOL_M4.clozes.map((c) => c.audioText));
    let sawM3 = false;
    let sawM4 = false;
    for (const lesson of lessons.slice(0, 3)) {
      for (const step of lesson.steps) {
        if (step.type !== "particle_cloze") continue;
        if (step.audioText && allM3Texts.has(step.audioText)) sawM3 = true;
        if (step.audioText && allM4Texts.has(step.audioText)) sawM4 = true;
      }
    }
    expect(sawM3).toBe(true);
    expect(sawM4).toBe(true);
  });
});
