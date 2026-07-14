/**
 * ES M7 curriculum guard.
 *
 * Headline guard: every M7 pathway node declared in the course mock
 * (`es-m7-1` … `es-m7-8`) must resolve to real lesson content. If a future
 * edit declares them in the pathway without content (or vice versa) this
 * test fails loud. Also enforces the spine's global-style ratchets on the
 * authored steps (passive-card follow-up spacing, no `explanation` on
 * passive steps, answer-leak lint, full atom-surface coverage).
 */
import { describe, it, expect } from "vitest";
import { ES_M7_ATOMS, ES_M7_LESSONS } from "./m7";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  checkPassiveCardFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

describe("ES M7 curriculum", () => {
  it("ships 8 lessons, all tagged es / m7 / mock-1", () => {
    expect(ES_M7_LESSONS.length).toBe(8);
    expect(ES_M7_LESSONS.every((l) => l.moduleId === "m7")).toBe(true);
    expect(ES_M7_LESSONS.every((l) => l.languageId === "es")).toBe(true);
    expect(ES_M7_LESSONS.every((l) => l.courseId === "mock-1")).toBe(true);
    expect(ES_M7_LESSONS.map((l) => l.id)).toEqual([
      "es-m7-1",
      "es-m7-2",
      "es-m7-3",
      "es-m7-4",
      "es-m7-5",
      "es-m7-6",
      "es-m7-7",
      "es-m7-8",
    ]);
    expect(ES_M7_LESSONS[7].title).toBe("M7 Mastery Test");
  });

  it("registers exactly the spine's 28-atom allocation", () => {
    expect(ES_M7_ATOMS.length).toBe(28);
    expect(ES_M7_ATOMS.every((a) => a.fromModule === "m7")).toBe(true);
    const surfaces = new Set(ES_M7_ATOMS.map((a) => a.surface));
    expect(surfaces.size).toBe(ES_M7_ATOMS.length);
  });

  it("lesson ids are unique", () => {
    const ids = new Set(ES_M7_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(ES_M7_LESSONS.length);
  });

  it("every M7 pathway node resolves to lesson content", () => {
    const course = getMockCourse("es");
    const m7 = course.modules.find((m) => m.id === "m7");
    expect(m7).toBeDefined();
    expect(m7?.lessons.length ?? 0).toBe(8);
    for (const lesson of m7!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M7 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of ES_M7_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });

  it("passes the passive-card follow-up lint (i+2/i+3 spacing)", () => {
    for (const lesson of ES_M7_LESSONS) {
      const { failures } = checkPassiveCardFollowup(lesson.steps);
      expect(
        failures,
        `${lesson.id}: ${failures.map((f) => `${f.stepId} (${f.reason})`).join("; ")}`,
      ).toEqual([]);
    }
  });

  it("has no explanation on passive steps and no answer leaks", () => {
    for (const lesson of ES_M7_LESSONS) {
      expect(() => assertNoExplanationOnPassive(lesson.steps)).not.toThrow();
      expect(() => assertExplanationDoesntLeakAnswer(lesson.steps)).not.toThrow();
    }
  });

  it("the mastery test contains graded steps only", () => {
    const mastery = ES_M7_LESSONS[7];
    expect(mastery.steps.every((s) => isGradedStep(s))).toBe(true);
  });

  it("every M7 atom surface literally appears in M7 steps", () => {
    const corpus = ES_M7_LESSONS.map((l) => JSON.stringify(l.steps)).join("\n");
    for (const atom of ES_M7_ATOMS) {
      expect(
        corpus.includes(atom.surface),
        `atom surface '${atom.surface}' never appears in M7 steps`,
      ).toBe(true);
    }
  });
});
