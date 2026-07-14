/**
 * ES M15 curriculum guard.
 *
 * Headline guard: every M15 pathway node declared in the course mock
 * (`es-m15-1` … `es-m15-8`) must resolve to real lesson content. If a future
 * edit declares them in the pathway without content (or vice versa) this
 * test fails loud. Also enforces the spine's global-style ratchets on the
 * authored steps (passive-card follow-up spacing, no `explanation` on
 * passive steps, answer-leak lint, full atom-surface coverage).
 */
import { describe, it, expect } from "vitest";
import { ES_M15_ATOMS, ES_M15_LESSONS } from "./m15";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  checkPassiveCardFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

describe("ES M15 curriculum", () => {
  it("ships 8 lessons, all tagged es / m15 / mock-1", () => {
    expect(ES_M15_LESSONS.length).toBe(8);
    expect(ES_M15_LESSONS.every((l) => l.moduleId === "m15")).toBe(true);
    expect(ES_M15_LESSONS.every((l) => l.languageId === "es")).toBe(true);
    expect(ES_M15_LESSONS.every((l) => l.courseId === "mock-1")).toBe(true);
    expect(ES_M15_LESSONS.map((l) => l.id)).toEqual([
      "es-m15-1",
      "es-m15-2",
      "es-m15-3",
      "es-m15-4",
      "es-m15-5",
      "es-m15-6",
      "es-m15-7",
      "es-m15-8",
    ]);
    expect(ES_M15_LESSONS[7].title).toBe("M15 Mastery Test");
  });

  it("lesson ids are unique", () => {
    const ids = new Set(ES_M15_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(ES_M15_LESSONS.length);
  });

  it("every M15 pathway node resolves to lesson content", () => {
    const course = getMockCourse("es");
    const m15 = course.modules.find((m) => m.id === "m15");
    expect(m15).toBeDefined();
    expect(m15?.lessons.length ?? 0).toBe(8);
    for (const lesson of m15!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M15 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of ES_M15_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });

  it("passes the passive-card follow-up lint (i+2/i+3 spacing)", () => {
    for (const lesson of ES_M15_LESSONS) {
      const { failures } = checkPassiveCardFollowup(lesson.steps);
      expect(
        failures,
        `${lesson.id}: ${failures.map((f) => `${f.stepId} (${f.reason})`).join("; ")}`,
      ).toEqual([]);
    }
  });

  it("has no explanation on passive steps and no answer leaks", () => {
    for (const lesson of ES_M15_LESSONS) {
      expect(() => assertNoExplanationOnPassive(lesson.steps)).not.toThrow();
      expect(() => assertExplanationDoesntLeakAnswer(lesson.steps)).not.toThrow();
    }
  });

  it("the mastery test contains graded steps only", () => {
    const mastery = ES_M15_LESSONS[7];
    expect(mastery.steps.every((s) => isGradedStep(s))).toBe(true);
  });

  it("every M15 atom surface literally appears in M15 steps", () => {
    const corpus = ES_M15_LESSONS.map((l) => JSON.stringify(l.steps)).join("\n");
    for (const atom of ES_M15_ATOMS) {
      expect(
        corpus.includes(atom.surface),
        `atom surface '${atom.surface}' never appears in M15 steps`,
      ).toBe(true);
    }
  });
});
