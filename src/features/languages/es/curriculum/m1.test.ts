/**
 * ES M1 curriculum guard.
 *
 * Headline guard: every M1 pathway node declared in the course mock
 * (`es-m1-1` … `es-m1-8`) must resolve to real lesson content. If a future
 * edit declares them in the pathway without content (or vice versa) this
 * test fails loud. Also enforces the spine's global-style ratchets on the
 * authored steps (passive-card follow-up spacing, no `explanation` on
 * passive steps, answer-leak lint, full atom-surface coverage).
 */
// Side-effect: register the full es curriculum in canonical order first — m16's
// capstone match grid resolves cross-module surfaces at import time and throws
// when this file is the vitest entry with those modules mid-import-cycle.
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M1_ATOMS, ES_M1_LESSONS } from "./m1";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  checkPassiveCardFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

describe("ES M1 curriculum", () => {
  it("ships 8 lessons, all tagged es / m1 / mock-1", () => {
    expect(ES_M1_LESSONS.length).toBe(8);
    expect(ES_M1_LESSONS.every((l) => l.moduleId === "m1")).toBe(true);
    expect(ES_M1_LESSONS.every((l) => l.languageId === "es")).toBe(true);
    expect(ES_M1_LESSONS.every((l) => l.courseId === "mock-1")).toBe(true);
    expect(ES_M1_LESSONS.map((l) => l.id)).toEqual([
      "es-m1-1",
      "es-m1-2",
      "es-m1-3",
      "es-m1-4",
      "es-m1-5",
      "es-m1-6",
      "es-m1-7",
      "es-m1-8",
    ]);
    expect(ES_M1_LESSONS[7].title).toBe("M1 Mastery Test");
  });

  it("lesson ids are unique", () => {
    const ids = new Set(ES_M1_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(ES_M1_LESSONS.length);
  });

  it("every M1 pathway node resolves to lesson content", () => {
    const course = getMockCourse("es");
    const m1 = course.modules.find((m) => m.id === "m1");
    expect(m1).toBeDefined();
    expect(m1?.lessons.length ?? 0).toBe(8);
    for (const lesson of m1!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M1 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of ES_M1_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });

  it("passes the passive-card follow-up lint (i+2/i+3 spacing)", () => {
    for (const lesson of ES_M1_LESSONS) {
      const { failures } = checkPassiveCardFollowup(lesson.steps);
      expect(
        failures,
        `${lesson.id}: ${failures.map((f) => `${f.stepId} (${f.reason})`).join("; ")}`,
      ).toEqual([]);
    }
  });

  it("has no explanation on passive steps and no answer leaks", () => {
    for (const lesson of ES_M1_LESSONS) {
      expect(() => assertNoExplanationOnPassive(lesson.steps)).not.toThrow();
      expect(() => assertExplanationDoesntLeakAnswer(lesson.steps)).not.toThrow();
    }
  });

  it("the mastery test contains graded steps only", () => {
    const mastery = ES_M1_LESSONS[7];
    expect(mastery.steps.every((s) => isGradedStep(s))).toBe(true);
  });

  it("every M1 atom surface literally appears in M1 steps", () => {
    const corpus = ES_M1_LESSONS.map((l) => JSON.stringify(l.steps)).join("\n");
    for (const atom of ES_M1_ATOMS) {
      expect(
        corpus.includes(atom.surface),
        `atom surface '${atom.surface}' never appears in M1 steps`,
      ).toBe(true);
    }
  });
});
