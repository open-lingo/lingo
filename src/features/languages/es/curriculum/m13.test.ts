/**
 * ES M13 curriculum guard.
 *
 * Headline guard: every M13 pathway node declared in the course mock
 * (`es-m13-1` … `es-m13-8`) must resolve to real lesson content. If a future
 * edit declares them in the pathway without content (or vice versa) this
 * test fails loud. Also enforces the spine's global-style ratchets on the
 * authored steps (passive-card follow-up spacing, no `explanation` on
 * passive steps, answer-leak lint, full atom-surface coverage).
 */
import { describe, it, expect } from "vitest";
// Side-effect import FIRST: evaluates m1…m16 in clean course order. With
// "./m13" as the entry, m13 would sit suspended mid-import-cycle while
// later modules (whose match grids reference m13 surfaces) evaluate —
// and matchPairs throws on unregistered surfaces.
import "./index";
import { ES_M13_ATOMS, ES_M13_LESSONS } from "./m13";
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

describe("ES M13 curriculum", () => {
  it("ships 8 lessons, all tagged es / m13 / mock-1", () => {
    expect(ES_M13_LESSONS.length).toBe(8);
    expect(ES_M13_LESSONS.every((l) => l.moduleId === "m13")).toBe(true);
    expect(ES_M13_LESSONS.every((l) => l.languageId === "es")).toBe(true);
    expect(ES_M13_LESSONS.every((l) => l.courseId === "mock-1")).toBe(true);
    expect(ES_M13_LESSONS.map((l) => l.id)).toEqual([
      "es-m13-1",
      "es-m13-2",
      "es-m13-3",
      "es-m13-4",
      "es-m13-5",
      "es-m13-6",
      "es-m13-7",
      "es-m13-8",
    ]);
    expect(ES_M13_LESSONS[7].title).toBe("M13 Mastery Test");
  });

  it("lesson ids are unique", () => {
    const ids = new Set(ES_M13_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(ES_M13_LESSONS.length);
  });

  it("every M13 pathway node resolves to lesson content", () => {
    const course = getMockCourse("es");
    const m13 = course.modules.find((m) => m.id === "m13");
    expect(m13).toBeDefined();
    expect(m13?.lessons.length ?? 0).toBe(8);
    for (const lesson of m13!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M13 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of ES_M13_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });

  it("passes the passive-card follow-up lint (i+2/i+3 spacing)", () => {
    for (const lesson of ES_M13_LESSONS) {
      const { failures } = checkPassiveCardFollowup(lesson.steps);
      expect(
        failures,
        `${lesson.id}: ${failures.map((f) => `${f.stepId} (${f.reason})`).join("; ")}`,
      ).toEqual([]);
    }
  });

  it("has no explanation on passive steps and no answer leaks", () => {
    for (const lesson of ES_M13_LESSONS) {
      expect(() => assertNoExplanationOnPassive(lesson.steps)).not.toThrow();
      expect(() => assertExplanationDoesntLeakAnswer(lesson.steps)).not.toThrow();
    }
  });

  it("the mastery test contains graded steps only", () => {
    const mastery = ES_M13_LESSONS[7];
    expect(mastery.steps.every((s) => isGradedStep(s))).toBe(true);
  });

  it("every M13 atom surface literally appears in M13 steps", () => {
    const corpus = ES_M13_LESSONS.map((l) => JSON.stringify(l.steps)).join("\n");
    for (const atom of ES_M13_ATOMS) {
      expect(
        corpus.includes(atom.surface),
        `atom surface '${atom.surface}' never appears in M13 steps`,
      ).toBe(true);
    }
  });
});

// ── ES authoring bar (Track B, 2026-08-19) ─────────────────────────────────
// m13 predates the bar (hand-authored July wave); measured debt is pinned
// below, SHRINK-ONLY — never raise a number to admit new content. The IR
// re-author retires it (docs/handoff-course-reauthoring-2026-08-19.md §3).
registerEsModuleBarGuards({
  moduleLabel: "m13",
  lessons: ES_M13_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m13")),
  debt: { unknownTokens: 141, nonIntroDebuts: 9, fullSentenceMcqs: 19, imageMcqReuse: 1, translateShare: 0.174 },
});
