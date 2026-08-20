/**
 * ES M3 curriculum guard.
 *
 * Headline guard: every M3 pathway node declared in the course mock
 * (`es-m3-1` … `es-m3-8`) must resolve to real lesson content. If a future
 * edit declares them in the pathway without content (or vice versa) this
 * test fails loud. Also enforces the spine's global-style ratchets on the
 * authored steps (passive-card follow-up spacing, no `explanation` on
 * passive steps, answer-leak lint, full atom-surface coverage) plus the
 * M3-specific invariant that every noun atom carries a gender.
 */
import { describe, it, expect } from "vitest";
// Evaluate the full atom registry before ./m3: with ./m3 as the module-graph
// entry point it sits mid-cycle (unregistered) while courseAtoms pulls in the
// later modules, and any later-module factory that resolves an m3 surface
// (e.g. m16's capstone match grid) would throw before this suite runs.
import "../courseAtoms";
import { ES_M3_ATOMS, ES_M3_LESSONS } from "./m3";
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

describe("ES M3 curriculum", () => {
  it("ships 8 lessons, all tagged es / m3 / mock-1", () => {
    expect(ES_M3_LESSONS.length).toBe(8);
    expect(ES_M3_LESSONS.every((l) => l.moduleId === "m3")).toBe(true);
    expect(ES_M3_LESSONS.every((l) => l.languageId === "es")).toBe(true);
    expect(ES_M3_LESSONS.every((l) => l.courseId === "mock-1")).toBe(true);
    expect(ES_M3_LESSONS.map((l) => l.id)).toEqual([
      "es-m3-1",
      "es-m3-2",
      "es-m3-3",
      "es-m3-4",
      "es-m3-5",
      "es-m3-6",
      "es-m3-7",
      "es-m3-8",
    ]);
    expect(ES_M3_LESSONS[7].title).toBe("M3 Mastery Test");
  });

  it("lesson ids are unique", () => {
    const ids = new Set(ES_M3_LESSONS.map((l) => l.id));
    expect(ids.size).toBe(ES_M3_LESSONS.length);
  });

  it("every M3 pathway node resolves to lesson content", () => {
    const course = getMockCourse("es");
    const m3 = course.modules.find((m) => m.id === "m3");
    expect(m3).toBeDefined();
    expect(m3?.lessons.length ?? 0).toBe(8);
    for (const lesson of m3!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M3 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("every step id within a lesson is unique", () => {
    for (const lesson of ES_M3_LESSONS) {
      const ids = lesson.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
    }
  });

  it("passes the passive-card follow-up lint (i+2/i+3 spacing)", () => {
    for (const lesson of ES_M3_LESSONS) {
      const { failures } = checkPassiveCardFollowup(lesson.steps);
      expect(
        failures,
        `${lesson.id}: ${failures.map((f) => `${f.stepId} (${f.reason})`).join("; ")}`,
      ).toEqual([]);
    }
  });

  it("has no explanation on passive steps and no answer leaks", () => {
    for (const lesson of ES_M3_LESSONS) {
      expect(() => assertNoExplanationOnPassive(lesson.steps)).not.toThrow();
      expect(() => assertExplanationDoesntLeakAnswer(lesson.steps)).not.toThrow();
    }
  });

  it("the mastery test contains graded steps only", () => {
    const mastery = ES_M3_LESSONS[7];
    expect(mastery.steps.every((s) => isGradedStep(s))).toBe(true);
  });

  it("every M3 atom surface literally appears in M3 steps", () => {
    const corpus = ES_M3_LESSONS.map((l) => JSON.stringify(l.steps)).join("\n");
    for (const atom of ES_M3_ATOMS) {
      expect(
        corpus.includes(atom.surface),
        `atom surface '${atom.surface}' never appears in M3 steps`,
      ).toBe(true);
    }
  });

  it("every M3 noun atom carries a gender (agreement-engine contract)", () => {
    for (const atom of ES_M3_ATOMS) {
      if (atom.partOfSpeech === "noun") {
        expect(atom.gender, `noun atom '${atom.surface}' missing gender`).toBeDefined();
      }
    }
  });
});

// ── ES authoring bar (Track B, 2026-08-19) ─────────────────────────────────
// m3's July-wave debt was retired surgically on 2026-08-19 (translate→build
// conversions, image-MCQ retirements, pluma/papel intro debuts, plus the
// plural-aware provenance lexicon), so it registers with ZERO pinned debt.
// Never add a `debt` entry here to admit new content; fix the content.
registerEsModuleBarGuards({
  moduleLabel: "m3",
  lessons: ES_M3_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m3")),
});
