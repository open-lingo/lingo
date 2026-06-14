/**
 * KO M6 curriculum — things & possession module.
 *
 * Headline guard: every M6 pathway node declared in the course mock
 * (`ko-m6-1` … `ko-m6-8`) must resolve to real lesson content. Before this
 * module was authored those nodes didn't exist; if a future edit declares
 * them in the pathway without content (or vice versa) this test fails loud.
 */
import { describe, it, expect } from "vitest";
import { KO_M6_LESSONS } from "./m6";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

describe("KO M6 curriculum", () => {
  it("ships 8 lessons, all tagged ko / m6", () => {
    expect(KO_M6_LESSONS.length).toBe(8);
    expect(KO_M6_LESSONS.every((l) => l.moduleId === "m6")).toBe(true);
    expect(KO_M6_LESSONS.every((l) => l.languageId === "ko")).toBe(true);
  });

  it("lesson ids are unique", () => {
    const ids = new Set(KO_M6_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(KO_M6_LESSONS.length);
  });

  it("every M6 pathway node resolves to lesson content", () => {
    const course = getMockCourse("ko");
    const m6 = course.modules.find((m) => m.id === "m6");
    expect(m6).toBeDefined();
    expect(m6?.lessons.length ?? 0).toBe(8);
    for (const lesson of m6!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M6 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of KO_M6_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });
});
