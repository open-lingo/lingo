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

  it("builds 9 rows × 3 sub-lessons + 3 compound-vowel + 4 받침 + y-vowel + review + 받침 wrap = 37 lessons", () => {
    const lessons = buildAllKoreanM2Lessons();
    expect(lessons.length).toBe(37);
    expect(lessons.every((l) => l.moduleId === "m2")).toBe(true);
    expect(lessons.every((l) => l.languageId === "ko")).toBe(true);
  });

  it("interleaves the compound-vowel lessons into the march (not one block)", () => {
    const ids = buildAllKoreanM2Lessons().map((l) => l.id);
    // cv-1 breaks aspirated → tense; cv-2 breaks the tense march after ㅃ;
    // cv-3 follows the y-vowel lesson it builds on (ㅖ = ㅔ + y-glide).
    expect(ids.indexOf("ko-m2-cv-1")).toBe(ids.indexOf("ko-m2-ch-3") + 1);
    expect(ids.indexOf("ko-m2-cv-2")).toBe(ids.indexOf("ko-m2-pp-3") + 1);
    expect(ids.indexOf("ko-m2-cv-3")).toBe(ids.indexOf("ko-m2-yv-1") + 1);
    // And they precede the module review that claims the full vowel set.
    expect(ids.indexOf("ko-m2-cv-3")).toBeLessThan(ids.indexOf("ko-m2-review"));
  });

  it("interleaves the 받침 arc — spread through the march, teach lessons never adjacent", () => {
    const ids = buildAllKoreanM2Lessons().map((l) => l.id);
    // bt-1 breaks the tense march after ㄲ; bt-2 after ㅆ; bt-3 follows
    // cv-3 (책/학생 need ㅐ); the [t]-group collapse comes after the module
    // review, once the six letter-true groups are known; the wrap closes.
    expect(ids.indexOf("ko-m2-bt-1")).toBe(ids.indexOf("ko-m2-kk-3") + 1);
    expect(ids.indexOf("ko-m2-bt-2")).toBe(ids.indexOf("ko-m2-ss-3") + 1);
    expect(ids.indexOf("ko-m2-bt-3")).toBe(ids.indexOf("ko-m2-cv-3") + 1);
    expect(ids.indexOf("ko-m2-batchim-1")).toBe(ids.indexOf("ko-m2-review") + 1);
    expect(ids[ids.length - 1]).toBe("ko-m2-bt-review");
    // No two batchim TEACH lessons back-to-back (bt-review is the family's
    // "review after" and may follow batchim-1 directly).
    const teach = ["ko-m2-bt-1", "ko-m2-bt-2", "ko-m2-bt-3", "ko-m2-batchim-1"];
    for (const a of teach) {
      for (const b of teach) {
        if (a === b) continue;
        expect(Math.abs(ids.indexOf(a) - ids.indexOf(b))).toBeGreaterThan(1);
      }
    }
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
