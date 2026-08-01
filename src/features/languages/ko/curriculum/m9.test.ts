/**
 * KO M9 curriculum guard.
 *
 * Headline guard: every M9 pathway node declared in the course mock
 * (`ko-m9-1` … `ko-m9-8`) must resolve to real lesson content. If a future
 * edit declares them in the pathway without content (or vice versa) this
 * test fails loud.
 */
import { describe, it, expect } from "vitest";
import { KO_M9_LESSONS } from "./m9";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

describe("KO M9 curriculum", () => {
  it("ships 8 lessons, all tagged ko / m9", () => {
    expect(KO_M9_LESSONS.length).toBe(8);
    expect(KO_M9_LESSONS.every((l) => l.moduleId === "m9")).toBe(true);
    expect(KO_M9_LESSONS.every((l) => l.languageId === "ko")).toBe(true);
  });

  it("lesson ids are unique", () => {
    const ids = new Set(KO_M9_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(KO_M9_LESSONS.length);
  });

  it("every M9 pathway node resolves to lesson content", () => {
    const course = getMockCourse("ko");
    const m9 = course.modules.find((m) => m.id === "m9");
    expect(m9).toBeDefined();
    // The story capstone routes OUT of the lesson player (the reader owns
    // it), so it is exempt from the has-content check — but it still has to
    // be here, which `mockCourse.test.ts` asserts.
    const taught = m9!.lessons.filter((l) => l.kind !== "story");
    expect(m9!.lessons.some((l) => l.kind === "story")).toBe(true);
    expect(taught.length).toBe(8);
    for (const lesson of taught) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M9 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of KO_M9_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });
});
