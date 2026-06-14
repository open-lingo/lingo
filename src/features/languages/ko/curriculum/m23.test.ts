/**
 * KO M23 curriculum guard.
 *
 * Headline guard: every M23 pathway node declared in the course mock
 * (`ko-m23-1` … `ko-m23-8`) must resolve to real lesson content. If a future
 * edit declares them in the pathway without content (or vice versa) this
 * test fails loud.
 */
import { describe, it, expect } from "vitest";
import { KO_M23_LESSONS } from "./m23";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

describe("KO M23 curriculum", () => {
  it("ships 8 lessons, all tagged ko / m23", () => {
    expect(KO_M23_LESSONS.length).toBe(8);
    expect(KO_M23_LESSONS.every((l) => l.moduleId === "m23")).toBe(true);
    expect(KO_M23_LESSONS.every((l) => l.languageId === "ko")).toBe(true);
  });

  it("lesson ids are unique", () => {
    const ids = new Set(KO_M23_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(KO_M23_LESSONS.length);
  });

  it("every M23 pathway node resolves to lesson content", () => {
    const course = getMockCourse("ko");
    const m23 = course.modules.find((m) => m.id === "m23");
    expect(m23).toBeDefined();
    expect(m23?.lessons.length ?? 0).toBe(8);
    for (const lesson of m23!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M23 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of KO_M23_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });
});
