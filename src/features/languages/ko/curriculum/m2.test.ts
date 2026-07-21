import { describe, it, expect } from "vitest";
import { buildAllKoreanM2Lessons, KO_M2_ROWS } from "./m2";
import { validateRowVocab } from "./m1-rows";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

describe("KO M2 curriculum", () => {
  it("every row's anchor words decompose into known blocks", () => {
    for (const row of KO_M2_ROWS) {
      expect(() => validateRowVocab(row)).not.toThrow();
    }
  });

  it("builds 9 rows × 3 sub-lessons + y-vowel + review + 받침 = 30 lessons", () => {
    const lessons = buildAllKoreanM2Lessons();
    expect(lessons.length).toBe(30);
    expect(lessons.every((l) => l.moduleId === "m2")).toBe(true);
    expect(lessons.every((l) => l.languageId === "ko")).toBe(true);
  });

  it("lesson ids are unique", () => {
    const lessons = buildAllKoreanM2Lessons();
    const ids = new Set(lessons.map((l) => l.id));
    expect(ids.size).toBe(lessons.length);
  });

  it("ships the closing 받침 [t]-group lesson", () => {
    const lessons = buildAllKoreanM2Lessons();
    const batchim = lessons.find((l) => l.id === "ko-m2-batchim-1");
    expect(batchim, "ko-m2-batchim-1 must exist").toBeDefined();
    expect(batchim!.steps.length).toBeGreaterThan(0);
    // The neutralization drill choices must be present (옫 = [t] realization).
    const codaMcq = batchim!.steps.find((s) => s.id === "ko-m2-batchim-mcq-ot");
    expect(codaMcq, "coda-sound MCQ present").toBeDefined();
    expect(codaMcq!.type).toBe("multiple_choice");
  });

  it("every M2 pathway node resolves to lesson content", () => {
    const course = getMockCourse("ko");
    const m2 = course.modules.find((m) => m.id === "m2");
    expect(m2).toBeDefined();
    expect(m2!.lessons.length).toBeGreaterThan(0);
    for (const lesson of m2!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M2 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });
});
