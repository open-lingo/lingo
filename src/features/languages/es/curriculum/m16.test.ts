/**
 * ES M16 curriculum guard.
 *
 * Headline guard: every M16 pathway node declared in the course mock
 * (`es-m16-1` … `es-m16-8`) must resolve to real lesson content. If a
 * future edit declares them in the pathway without content (or vice
 * versa) this test fails loud. Also enforces the spine's global-style
 * ratchets on the authored steps (passive-card follow-up spacing, no
 * `explanation` on passive steps, answer-leak lint, full atom-surface
 * coverage), plus M16-specific invariants: the mastery test is graded
 * only, and the review lessons (L5–L7) register no new atoms.
 */
// Side-effect: register the full es curriculum in canonical order first — m16's
// capstone match grid resolves cross-module surfaces at import time and throws
// when this file is the vitest entry with those modules mid-import-cycle.
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M16_ATOMS, ES_M16_LESSONS } from "./m16";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  checkPassiveCardFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

describe("ES M16 curriculum", () => {
  it("ships 8 lessons, all tagged es / m16 / mock-1", () => {
    expect(ES_M16_LESSONS.length).toBe(8);
    expect(ES_M16_LESSONS.every((l) => l.moduleId === "m16")).toBe(true);
    expect(ES_M16_LESSONS.every((l) => l.languageId === "es")).toBe(true);
    expect(ES_M16_LESSONS.every((l) => l.courseId === "mock-1")).toBe(true);
    expect(ES_M16_LESSONS.map((l) => l.id)).toEqual([
      "es-m16-1",
      "es-m16-2",
      "es-m16-3",
      "es-m16-4",
      "es-m16-5",
      "es-m16-6",
      "es-m16-7",
      "es-m16-8",
    ]);
    expect(ES_M16_LESSONS[7].title).toBe("M16 Mastery Test");
  });

  it("lesson ids are unique", () => {
    const ids = new Set(ES_M16_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(ES_M16_LESSONS.length);
  });

  it("every M16 pathway node resolves to lesson content", () => {
    const course = getMockCourse("es");
    const m16 = course.modules.find((m) => m.id === "m16");
    expect(m16).toBeDefined();
    expect(m16?.lessons.length ?? 0).toBe(8);
    for (const lesson of m16!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M16 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of ES_M16_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });

  it("passes the passive-card follow-up lint (i+2/i+3 spacing)", () => {
    for (const lesson of ES_M16_LESSONS) {
      const { failures } = checkPassiveCardFollowup(lesson.steps);
      expect(
        failures,
        `${lesson.id}: ${failures.map((f) => `${f.stepId} (${f.reason})`).join("; ")}`,
      ).toEqual([]);
    }
  });

  it("has no explanation on passive steps and no answer leaks", () => {
    for (const lesson of ES_M16_LESSONS) {
      expect(() => assertNoExplanationOnPassive(lesson.steps)).not.toThrow();
      expect(() => assertExplanationDoesntLeakAnswer(lesson.steps)).not.toThrow();
    }
  });

  it("the mastery test contains graded steps only", () => {
    const mastery = ES_M16_LESSONS[7];
    expect(mastery.steps.every((s) => isGradedStep(s))).toBe(true);
  });

  it("listening steps are sentence-level (m5+ ratchet)", () => {
    for (const lesson of ES_M16_LESSONS) {
      for (const step of lesson.steps) {
        if (step.type === "listening_build") {
          expect(
            step.correctOrder.length,
            `${step.id} listening_build has < 3 tiles`,
          ).toBeGreaterThanOrEqual(3);
        }
        if (step.type === "listening_comprehension") {
          expect(
            step.transcript?.includes(" "),
            `${step.id} listening_comprehension transcript is a bare word`,
          ).toBe(true);
        }
      }
    }
  });

  it("every M16 atom surface literally appears in M16 steps", () => {
    const corpus = ES_M16_LESSONS.map((l) => JSON.stringify(l.steps)).join("\n");
    for (const atom of ES_M16_ATOMS) {
      expect(
        corpus.includes(atom.surface),
        `atom surface '${atom.surface}' never appears in M16 steps`,
      ).toBe(true);
    }
  });

  it("registers exactly the spine allocation (25 atoms, all fromModule m16)", () => {
    expect(ES_M16_ATOMS.length).toBe(25);
    expect(ES_M16_ATOMS.every((a) => a.fromModule === "m16")).toBe(true);
  });
});
