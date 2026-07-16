/**
 * ES M4 curriculum guard.
 *
 * Headline guard: every M4 pathway node declared in the course mock
 * (`es-m4-1` … `es-m4-8`) must resolve to real lesson content. If a future
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
import { ES_M4_ATOMS, ES_M4_LESSONS } from "./m4";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  checkPassiveCardFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

describe("ES M4 curriculum", () => {
  it("ships 8 lessons, all tagged es / m4 / mock-1", () => {
    expect(ES_M4_LESSONS.length).toBe(8);
    expect(ES_M4_LESSONS.every((l) => l.moduleId === "m4")).toBe(true);
    expect(ES_M4_LESSONS.every((l) => l.languageId === "es")).toBe(true);
    expect(ES_M4_LESSONS.every((l) => l.courseId === "mock-1")).toBe(true);
    expect(ES_M4_LESSONS.map((l) => l.id)).toEqual([
      "es-m4-1",
      "es-m4-2",
      "es-m4-3",
      "es-m4-4",
      "es-m4-5",
      "es-m4-6",
      "es-m4-7",
      "es-m4-8",
    ]);
    expect(ES_M4_LESSONS[7].title).toBe("M4 Mastery Test");
  });

  it("lesson ids are unique", () => {
    const ids = new Set(ES_M4_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(ES_M4_LESSONS.length);
  });

  it("every M4 pathway node resolves to lesson content", () => {
    const course = getMockCourse("es");
    const m4 = course.modules.find((m) => m.id === "m4");
    expect(m4).toBeDefined();
    expect(m4?.lessons.length ?? 0).toBe(8);
    for (const lesson of m4!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M4 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of ES_M4_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });

  it("passes the passive-card follow-up lint (i+2/i+3 spacing)", () => {
    for (const lesson of ES_M4_LESSONS) {
      const { failures } = checkPassiveCardFollowup(lesson.steps);
      expect(
        failures,
        `${lesson.id}: ${failures.map((f) => `${f.stepId} (${f.reason})`).join("; ")}`,
      ).toEqual([]);
    }
  });

  it("has no explanation on passive steps and no answer leaks", () => {
    for (const lesson of ES_M4_LESSONS) {
      expect(() => assertNoExplanationOnPassive(lesson.steps)).not.toThrow();
      expect(() => assertExplanationDoesntLeakAnswer(lesson.steps)).not.toThrow();
    }
  });

  it("the mastery test contains graded steps only", () => {
    const mastery = ES_M4_LESSONS[7];
    expect(mastery.steps.every((s) => isGradedStep(s))).toBe(true);
  });

  it("every M4 atom surface literally appears in M4 steps", () => {
    const corpus = ES_M4_LESSONS.map((l) => JSON.stringify(l.steps)).join("\n");
    for (const atom of ES_M4_ATOMS) {
      expect(
        corpus.includes(atom.surface),
        `atom surface '${atom.surface}' never appears in M4 steps`,
      ).toBe(true);
    }
  });
});
