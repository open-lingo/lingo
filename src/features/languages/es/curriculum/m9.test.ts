/**
 * ES M9 curriculum guard.
 *
 * Headline guard: every M9 pathway node declared in the course mock
 * (`es-m9-1` … `es-m9-8`) must resolve to real lesson content. If a future
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
import { ES_M9_ATOMS, ES_M9_LESSONS } from "./m9";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  checkPassiveCardFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { ES_MODULE_ORDER } from "../grammarHelpers";

describe("ES M9 curriculum", () => {
  it("ships 8 lessons, all tagged es / m9 / mock-1", () => {
    expect(ES_M9_LESSONS.length).toBe(8);
    expect(ES_M9_LESSONS.every((l) => l.moduleId === "m9")).toBe(true);
    expect(ES_M9_LESSONS.every((l) => l.languageId === "es")).toBe(true);
    expect(ES_M9_LESSONS.every((l) => l.courseId === "mock-1")).toBe(true);
    expect(ES_M9_LESSONS.map((l) => l.id)).toEqual([
      "es-m9-1",
      "es-m9-2",
      "es-m9-3",
      "es-m9-4",
      "es-m9-5",
      "es-m9-6",
      "es-m9-7",
      "es-m9-8",
    ]);
    expect(ES_M9_LESSONS[7].title).toBe("M9 Mastery Test");
  });

  it("lesson ids are unique", () => {
    const ids = new Set(ES_M9_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(ES_M9_LESSONS.length);
  });

  it("every M9 pathway node resolves to lesson content", () => {
    const course = getMockCourse("es");
    const m9 = course.modules.find((m) => m.id === "m9");
    expect(m9).toBeDefined();
    expect(m9?.lessons.length ?? 0).toBe(8);
    for (const lesson of m9!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M9 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of ES_M9_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });

  it("passes the passive-card follow-up lint (i+2/i+3 spacing)", () => {
    for (const lesson of ES_M9_LESSONS) {
      const { failures } = checkPassiveCardFollowup(lesson.steps);
      expect(
        failures,
        `${lesson.id}: ${failures.map((f) => `${f.stepId} (${f.reason})`).join("; ")}`,
      ).toEqual([]);
    }
  });

  it("has no explanation on passive steps and no answer leaks", () => {
    for (const lesson of ES_M9_LESSONS) {
      expect(() => assertNoExplanationOnPassive(lesson.steps)).not.toThrow();
      expect(() => assertExplanationDoesntLeakAnswer(lesson.steps)).not.toThrow();
    }
  });

  it("the mastery test contains graded steps only", () => {
    const mastery = ES_M9_LESSONS[7];
    expect(mastery.steps.every((s) => isGradedStep(s))).toBe(true);
  });

  it("every M9 atom surface literally appears in M9 steps", () => {
    const corpus = ES_M9_LESSONS.map((l) => JSON.stringify(l.steps)).join("\n");
    for (const atom of ES_M9_ATOMS) {
      expect(
        corpus.includes(atom.surface),
        `atom surface '${atom.surface}' never appears in M9 steps`,
      ).toBe(true);
    }
  });

  it("does not re-register the reused question words dónde (m7) / quién (m5)", () => {
    expect(ES_M9_ATOMS.some((a) => a.surface === "dónde")).toBe(false);
    expect(ES_M9_ATOMS.some((a) => a.surface === "quién")).toBe(false);
  });
});

// ── ES authoring bar (Track B, 2026-08-19) ─────────────────────────────────
// m9 predates the bar (hand-authored July wave); measured debt is pinned
// below, SHRINK-ONLY — never raise a number to admit new content. The IR
// re-author retires it (docs/handoff-course-reauthoring-2026-08-19.md §3).
registerEsModuleBarGuards({
  moduleLabel: "m9",
  lessons: ES_M9_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m9")),
  debt: { unknownTokens: 101, nonIntroDebuts: 8, fullSentenceMcqs: 5, productionFramedMcqs: 1, particleClozeOutOfModule: 1, translateShare: 0.154 },
});
