/**
 * KO M25 curriculum guard.
 *
 * Headline guard: every M25 pathway node declared in the course mock
 * (`ko-m25-1` … `ko-m25-8`) must resolve to real lesson content. If a future
 * edit declares them in the pathway without content (or vice versa) this
 * test fails loud.
 */
import { describe, it, expect } from "vitest";
import { KO_M25_LESSONS } from "./m25";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

describe("KO M25 curriculum", () => {
  it("ships 8 lessons, all tagged ko / m25", () => {
    expect(KO_M25_LESSONS.length).toBe(8);
    expect(KO_M25_LESSONS.every((l) => l.moduleId === "m25")).toBe(true);
    expect(KO_M25_LESSONS.every((l) => l.languageId === "ko")).toBe(true);
  });

  it("lesson ids are unique", () => {
    const ids = new Set(KO_M25_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(KO_M25_LESSONS.length);
  });

  it("every M25 pathway node resolves to lesson content", () => {
    const course = getMockCourse("ko");
    const m25 = course.modules.find((m) => m.id === "m25");
    expect(m25).toBeDefined();
    // The story capstone routes OUT of the lesson player (the reader owns
    // it), so it is exempt from the has-content check — but it still has to
    // be here, which `mockCourse.test.ts` asserts.
    const taught = m25!.lessons.filter((l) => l.kind !== "story");
    expect(m25!.lessons.some((l) => l.kind === "story")).toBe(true);
    expect(taught.length).toBe(8);
    for (const lesson of taught) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M25 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of KO_M25_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });
});
