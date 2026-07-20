import { describe, expect, it, beforeEach } from "vitest";
import type { Course, CourseModule } from "@/shared/domain/course";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  courseHasTier,
  deriveDefaultTier,
  modulesForTier,
  parseTierParam,
  readStoredTier,
  writeStoredTier,
} from "./learnTier";

function mkModule(overrides: Partial<CourseModule>): CourseModule {
  return {
    id: "m1",
    title: "Module",
    lessons: [{ id: "l1", title: "Lesson" }],
    ...overrides,
  };
}

function mkCourse(modules: CourseModule[]): Course {
  return { id: "test-course", title: "Test", languageId: "ja", modules };
}

describe("courseHasTier", () => {
  it("is false for a course with no n4 modules (es/ko today)", () => {
    const course = mkCourse([mkModule({ id: "m1" }), mkModule({ id: "m2" })]);
    expect(courseHasTier(course, "n4")).toBe(false);
    expect(courseHasTier(course, "n5")).toBe(true);
  });

  it("is true once any module is tagged n4", () => {
    const course = mkCourse([
      mkModule({ id: "m1" }),
      mkModule({ id: "m29", tier: "n4" }),
    ]);
    expect(courseHasTier(course, "n4")).toBe(true);
  });

  it("real ja course has n4 content (m30)", () => {
    const ja = getMockCourse("ja");
    expect(courseHasTier(ja, "n4")).toBe(true);
  });

  it("real es/ko courses have no n4 content", () => {
    expect(courseHasTier(getMockCourse("es"), "n4")).toBe(false);
    expect(courseHasTier(getMockCourse("ko"), "n4")).toBe(false);
  });
});

describe("modulesForTier", () => {
  it("splits modules by tier, treating untagged as n5", () => {
    const course = mkCourse([
      mkModule({ id: "m1" }),
      mkModule({ id: "m2", tier: "n5" }),
      mkModule({ id: "m29", tier: "n4" }),
      mkModule({ id: "m30", tier: "n4" }),
    ]);
    expect(modulesForTier(course, "n5").map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(modulesForTier(course, "n4").map((m) => m.id)).toEqual(["m29", "m30"]);
  });

  it("draws comingSoon modules (locked spine stations) but not bare lesson-less stubs", () => {
    // 2026-07-19 rewrite spine: comingSoon placeholders must be VISIBLE on
    // the map (locked stations), so only lesson-less modules without the
    // flag (unshipped-language stubs) are filtered.
    const course = mkCourse([
      mkModule({ id: "m1" }),
      mkModule({ id: "m2", comingSoon: true, lessons: [] }),
      mkModule({ id: "m3", lessons: [] }),
      mkModule({ id: "m29", tier: "n4", comingSoon: true, lessons: [] }),
    ]);
    expect(modulesForTier(course, "n5").map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(modulesForTier(course, "n4").map((m) => m.id)).toEqual(["m29"]);
  });

  it("real ja n4 line is m30 only (old m29 pilot renumbered away by the spine)", () => {
    const ja = getMockCourse("ja");
    const n4 = modulesForTier(ja, "n4");
    expect(n4.map((m) => m.id)).toEqual(["m30"]);
  });
});

describe("deriveDefaultTier", () => {
  it("stays n5 when the course has no n4 tier at all", () => {
    const course = mkCourse([mkModule({ id: "m1" })]);
    expect(deriveDefaultTier(course, new Set())).toBe("n5");
  });

  it("defaults n5 when the active module is still in the n5 tier", () => {
    const course = mkCourse([
      mkModule({ id: "m1", lessons: [{ id: "l1", title: "L1" }] }),
      mkModule({ id: "m29", tier: "n4", lessons: [{ id: "l29", title: "L29" }] }),
    ]);
    // Nothing completed → current module is m1 (n5).
    expect(deriveDefaultTier(course, new Set())).toBe("n5");
  });

  it("defaults n4 when the active (furthest-in-progress) module is n4", () => {
    const course = mkCourse([
      mkModule({ id: "m1", lessons: [{ id: "l1", title: "L1" }] }),
      mkModule({ id: "m29", tier: "n4", lessons: [{ id: "l29", title: "L29" }] }),
    ]);
    // m1 fully complete → current module index moves to m29 (n4).
    expect(deriveDefaultTier(course, new Set(["l1"]))).toBe("n4");
  });

  it("real ja course: fresh learner defaults n5; finishing everything authored still defaults n5 (spine frontier)", () => {
    // 2026-07-19 rewrite spine: m4-m29 are comingSoon placeholders. A
    // learner who completed every AUTHORED n5 lesson is standing at the m4
    // frontier waiting for content — the comingSoon module counts as the
    // active position, so they must NOT be bounced onto the N4 line.
    const ja = getMockCourse("ja");
    expect(deriveDefaultTier(ja, new Set())).toBe("n5");
    const allN5LessonIds = ja.modules
      .filter((m) => (m.tier ?? "n5") === "n5")
      .flatMap((m) => m.lessons.map((l) => l.id));
    expect(deriveDefaultTier(ja, new Set(allN5LessonIds))).toBe("n5");
  });
});

describe("parseTierParam", () => {
  it("accepts n5/n4 and rejects anything else", () => {
    expect(parseTierParam("n4")).toBe("n4");
    expect(parseTierParam("n5")).toBe("n5");
    expect(parseTierParam(null)).toBeNull();
    expect(parseTierParam("bogus")).toBeNull();
    expect(parseTierParam("")).toBeNull();
  });
});

describe("readStoredTier / writeStoredTier", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips per course id", () => {
    writeStoredTier("ja-course", "n4");
    expect(readStoredTier("ja-course")).toBe("n4");
    expect(readStoredTier("other-course")).toBeNull();
  });

  it("ignores garbage stored values", () => {
    localStorage.setItem("lingo:learn-tier:ja-course", "bogus");
    expect(readStoredTier("ja-course")).toBeNull();
  });

  it("returns null when nothing stored", () => {
    expect(readStoredTier("never-set")).toBeNull();
  });
});
