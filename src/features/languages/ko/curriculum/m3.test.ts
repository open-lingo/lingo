/**
 * KO M3 curriculum — first-phrases module.
 *
 * The headline guard: every M3 pathway node declared in the course mock
 * (`ko-m3-1` … `ko-m3-8`) must resolve to real lesson content. Before this
 * module was authored those nodes resolved to null and clicking them in the
 * Learn pathway dead-ended — this test fails loudly if that regresses.
 */
import { describe, it, expect } from "vitest";
import { KO_M3_LESSONS } from "./m3";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

describe("KO M3 curriculum", () => {
  it("ships 9 lessons, all tagged ko / m3", () => {
    expect(KO_M3_LESSONS.length).toBe(9);
    expect(KO_M3_LESSONS.every((l) => l.moduleId === "m3")).toBe(true);
    expect(KO_M3_LESSONS.every((l) => l.languageId === "ko")).toBe(true);
  });

  it("lesson ids are unique", () => {
    const ids = new Set(KO_M3_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(KO_M3_LESSONS.length);
  });

  it("every M3 pathway node resolves to lesson content", () => {
    const course = getMockCourse("ko");
    const m3 = course.modules.find((m) => m.id === "m3");
    expect(m3).toBeDefined();
    // The story capstone routes OUT of the lesson player (the reader owns
    // it), so it is exempt from the has-content check — but it still has to
    // be here, which `mockCourse.test.ts` asserts.
    const taught = m3!.lessons.filter((l) => l.kind !== "story");
    expect(m3!.lessons.some((l) => l.kind === "story")).toBe(true);
    expect(taught.length).toBeGreaterThan(0);
    for (const lesson of taught) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M3 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of KO_M3_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });
});
