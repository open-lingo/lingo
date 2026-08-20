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

  it("real ja course has an n4 tier (m30 = n4-01, authored 2026-08-14)", () => {
    // The tier was held open by a lesson-less comingSoon station between the
    // 2026-08-09 retirement of the m30 pilot (spec A1) and the authoring of
    // m30 = n4-01 (spec A3). It is now a real module.
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

  it("real ja n4 line is m30 + m31 + m32 + m33, all authored and available", () => {
    // The July m30 pilot was retired 2026-08-09 (spec A1); m30 = n4-01
    // 「て + helper I」 was authored 2026-08-14 (spec A3), m31 = n4-02
    // 「Give & receive I」 on 2026-08-15, m32 = n4-03 「Conditionals I:
    // たら (と as the contrast)」 on 2026-08-18, and m33 = n4-04
    // 「Transitivity I: 自動詞/他動詞 — が vs を」 on 2026-08-19. All four are
    // REAL stations: no comingSoon flag, every lesson available. m33 runs 14
    // lessons rather than 13 — nine transitivity pairs need a fourth teaching
    // block — which inv 25 allows (hard floor 12, hard ceiling 15). The rest
    // of the tier (m34-m51) is unauthored and not on the map yet. Tiles may
    // also carry a story row, which is not a lesson — hence the kind filter.
    const LESSON_COUNT: Record<string, number> = { m30: 13, m31: 13, m32: 13, m33: 14 };
    const ja = getMockCourse("ja");
    const n4 = modulesForTier(ja, "n4");
    expect(n4.map((m) => m.id)).toEqual(["m30", "m31", "m32", "m33"]);
    for (const m of n4) {
      const lessons = m.lessons.filter((l) => l.kind !== "story");
      expect(m.comingSoon, `${m.id} is flagged comingSoon`).toBeUndefined();
      expect(lessons, `${m.id} lesson count`).toHaveLength(LESSON_COUNT[m.id]);
      expect(m.lessons.every((l) => l.status === "available"), `${m.id}`).toBe(true);
    }
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

  it("real ja course: fresh learner defaults n5; finishing all of n5 now defaults n4", () => {
    // CHANGED 2026-07-27 with m29. The old assertion — "finishing everything
    // authored still defaults n5" — was correct while m4-m29 were comingSoon
    // placeholders: a comingSoon module is a real content frontier INSIDE N5
    // and must not bounce the learner onto N4. m29 (the N5 capstone) was the
    // last one, so the N5 map now has zero comingSoon modules and a learner
    // who has cleared it has finished JLPT N5. `deriveDefaultTier` is
    // unchanged — the comingSoon branch above still guards the frontier case,
    // and the synthetic test above still covers it. Reality moved; the
    // expectation follows reality rather than the other way round.
    const ja = getMockCourse("ja");
    expect(deriveDefaultTier(ja, new Set())).toBe("n5");
    expect(
      ja.modules.filter((m) => (m.tier ?? "n5") === "n5" && m.comingSoon),
      "N5 still has a comingSoon frontier — this test's premise moved",
    ).toEqual([]);
    const allN5LessonIds = ja.modules
      .filter((m) => (m.tier ?? "n5") === "n5")
      .flatMap((m) => m.lessons.map((l) => l.id));
    expect(deriveDefaultTier(ja, new Set(allN5LessonIds))).toBe("n4");
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
