import { describe, it, expect } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  isReviewLessonId,
  getModuleLessonCounts,
  getModuleVocab,
  getMilestoneForModule,
  COURSE_MILESTONES,
} from "./courseMapData";

describe("courseMapData", () => {
  it("flags review lessons by id suffix", () => {
    expect(isReviewLessonId("ja-m3-review-1")).toBe(true);
    expect(isReviewLessonId("ja-m3-review-2")).toBe(true);
    expect(isReviewLessonId("ja-m3-2-1")).toBe(false);
    expect(isReviewLessonId("ja-m1-l1-1")).toBe(false);
  });

  it("splits content vs review lessons per module", () => {
    const course = getMockCourse("ja");
    const m3 = course.modules.find((m) => m.id === "m3")!;
    const counts = getModuleLessonCounts(m3);
    expect(counts.total).toBe(m3.lessons.length);
    expect(counts.content + counts.review).toBe(counts.total);
    // M3 has two review lessons authored at the tail.
    expect(counts.review).toBe(2);
    expect(counts.content).toBeGreaterThan(0);
  });

  it("derives JA vocab from the course-atom catalog with resolvable samples", () => {
    const course = getMockCourse("ja");
    const m1 = course.modules.find((m) => m.id === "m1")!;
    const vocab = getModuleVocab(m1, "ja");
    expect(vocab.count).toBeGreaterThan(0);
    expect(vocab.samples.length).toBeGreaterThan(0);
    expect(vocab.samples.length).toBeLessThanOrEqual(vocab.count);
    // Samples carry a surface form + an english meaning.
    for (const s of vocab.samples) {
      expect(s.surface.length).toBeGreaterThan(0);
      expect(s.meaning.length).toBeGreaterThan(0);
    }
  });

  it("derives KO and ES vocab via the normalized atom view with resolvable samples", () => {
    for (const lang of ["ko", "es"] as const) {
      const course = getMockCourse(lang);
      // KO m1/m2 are alphabet modules (jamo aren't vocab) — find a module
      // that actually attributes vocabulary.
      const withVocab = course.modules.find(
        (m) => getModuleVocab(m, lang).count > 0,
      );
      expect(withVocab, `${lang}: no module resolved any vocab`).toBeDefined();
      const vocab = getModuleVocab(withVocab!, lang);
      expect(vocab.samples.length).toBeGreaterThan(0);
      expect(vocab.samples.length).toBeLessThanOrEqual(vocab.count);
      for (const s of vocab.samples) {
        expect(s.id.startsWith(`${lang}:`)).toBe(true);
        expect(s.surface.length).toBeGreaterThan(0);
        expect(s.meaning.length).toBeGreaterThan(0);
      }
    }
  });

  it("exposes authored milestones keyed by module index", () => {
    expect(getMilestoneForModule("ko", 1)).toBe("Read all of Hangul");
    expect(getMilestoneForModule("ja", 1)).toBe("Read all of Hiragana");
    expect(getMilestoneForModule("es", 15)).toBe("Hold a basic conversation");
    // Unanchored index returns null.
    expect(getMilestoneForModule("ko", 0)).toBeNull();
    // Unknown language has no milestones.
    expect(getMilestoneForModule("xx", 1)).toBeNull();
    expect(Object.keys(COURSE_MILESTONES)).toContain("ko");
    expect(Object.keys(COURSE_MILESTONES)).toContain("es");
  });
});
