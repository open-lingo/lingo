/**
 * KO M18 curriculum guard.
 *
 * Headline guard: every M18 pathway node declared in the course mock
 * (`ko-m18-1` … `ko-m18-8`) must resolve to real lesson content. If a future
 * edit declares them in the pathway without content (or vice versa) this
 * test fails loud.
 */
import { describe, it, expect } from "vitest";
import { KO_M18_LESSONS } from "./m18";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

describe("KO M18 curriculum", () => {
  it("ships 8 lessons, all tagged ko / m18", () => {
    expect(KO_M18_LESSONS.length).toBe(8);
    expect(KO_M18_LESSONS.every((l) => l.moduleId === "m18")).toBe(true);
    expect(KO_M18_LESSONS.every((l) => l.languageId === "ko")).toBe(true);
  });

  it("lesson ids are unique", () => {
    const ids = new Set(KO_M18_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(KO_M18_LESSONS.length);
  });

  it("every M18 pathway node resolves to lesson content", () => {
    const course = getMockCourse("ko");
    const m18 = course.modules.find((m) => m.id === "m18");
    expect(m18).toBeDefined();
    expect(m18?.lessons.length ?? 0).toBe(8);
    for (const lesson of m18!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M18 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of KO_M18_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });
});
