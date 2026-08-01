/**
 * KO M5 curriculum — things & possession module.
 *
 * Headline guard: every M5 pathway node declared in the course mock
 * (`ko-m5-1` … `ko-m5-8`) must resolve to real lesson content. Before this
 * module was authored those nodes didn't exist; if a future edit declares
 * them in the pathway without content (or vice versa) this test fails loud.
 */
import { describe, it, expect } from "vitest";
import { KO_M5_LESSONS } from "./m5";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

describe("KO M5 curriculum", () => {
  it("ships 8 lessons, all tagged ko / m5", () => {
    expect(KO_M5_LESSONS.length).toBe(8);
    expect(KO_M5_LESSONS.every((l) => l.moduleId === "m5")).toBe(true);
    expect(KO_M5_LESSONS.every((l) => l.languageId === "ko")).toBe(true);
  });

  it("lesson ids are unique", () => {
    const ids = new Set(KO_M5_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(KO_M5_LESSONS.length);
  });

  it("every M5 pathway node resolves to lesson content", () => {
    const course = getMockCourse("ko");
    const m5 = course.modules.find((m) => m.id === "m5");
    expect(m5).toBeDefined();
    // The story capstone routes OUT of the lesson player (the reader owns
    // it), so it is exempt from the has-content check — but it still has to
    // be here, which `mockCourse.test.ts` asserts.
    const taught = m5!.lessons.filter((l) => l.kind !== "story");
    expect(m5!.lessons.some((l) => l.kind === "story")).toBe(true);
    expect(taught.length).toBe(8);
    for (const lesson of taught) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M5 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of KO_M5_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });
});
