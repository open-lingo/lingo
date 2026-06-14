/**
 * KO M4 curriculum — things & possession module.
 *
 * Headline guard: every M4 pathway node declared in the course mock
 * (`ko-m4-1` … `ko-m4-8`) must resolve to real lesson content. Before this
 * module was authored those nodes didn't exist; if a future edit declares
 * them in the pathway without content (or vice versa) this test fails loud.
 */
import { describe, it, expect } from "vitest";
import { KO_M4_LESSONS } from "./m4";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

describe("KO M4 curriculum", () => {
  it("ships 8 lessons, all tagged ko / m4", () => {
    expect(KO_M4_LESSONS.length).toBe(8);
    expect(KO_M4_LESSONS.every((l) => l.moduleId === "m4")).toBe(true);
    expect(KO_M4_LESSONS.every((l) => l.languageId === "ko")).toBe(true);
  });

  it("lesson ids are unique", () => {
    const ids = new Set(KO_M4_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(KO_M4_LESSONS.length);
  });

  it("every M4 pathway node resolves to lesson content", () => {
    const course = getMockCourse("ko");
    const m4 = course.modules.find((m) => m.id === "m4");
    expect(m4).toBeDefined();
    expect(m4?.lessons.length ?? 0).toBe(8);
    for (const lesson of m4!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M4 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of KO_M4_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });
});
