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
import { ES_M4_ATOMS, ES_M4_LESSONS, ES_M4_PLACEMENT } from "./m4";
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

// ── ES authoring bar (Track B, 2026-08-19) ─────────────────────────────────
// m4 was IR re-authored 2026-08-20 (ir/m4.ir.yaml) with zero pinned debt —
// the full bar applies with no ratchet. Never add a `debt:` entry here; fix
// the content instead.
registerEsModuleBarGuards({
  moduleLabel: "m4",
  lessons: ES_M4_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m4")),
});

describe("ES M4 bespoke guards", () => {
  it("the placement bank carries the m4 facts (1 screener + 4 byModule)", () => {
    expect(ES_M4_PLACEMENT.screener.length).toBe(1);
    expect(ES_M4_PLACEMENT.byModule.length).toBe(4);
    for (const item of [...ES_M4_PLACEMENT.screener, ...ES_M4_PLACEMENT.byModule]) {
      const step = item.build();
      if (step.type !== "multiple_choice") {
        throw new Error(`${item.id}: expected a multiple_choice placement step`);
      }
      expect(step.options.length, `${item.id} should offer 4 options`).toBe(4);
    }
  });

  it("every emoji atom debuts on exactly one word_image_mcq (inv 30)", () => {
    // The bar's imageMcqReuse gate forbids a SECOND image MCQ but not a
    // missing FIRST one — dropping mcq-negro would silently demote negro's
    // debut to a build step. Pin the full inv 30 shape instead.
    const emojiSurfaces = new Set(
      ES_M4_ATOMS.filter((a) => a.emoji).map((a) => a.surface),
    );
    const imageTargets: string[] = [];
    for (const lesson of ES_M4_LESSONS) {
      for (const step of lesson.steps as never as Array<Record<string, unknown>>) {
        if (step.type !== "word_image_mcq") continue;
        const options = step.options as Array<{ id: string; word: string }>;
        imageTargets.push(options.find((o) => o.id === "correct")?.word ?? "");
      }
    }
    expect(new Set(imageTargets).size, "no image MCQ may repeat a target").toBe(
      imageTargets.length,
    );
    expect(new Set(imageTargets)).toEqual(emojiSurfaces);
  });

  it("the -o→-a rule card precedes the module's first feminine token (agreement is taught, not smuggled)", () => {
    // Feminine forms are canon-derived, so the provenance gate can't see
    // WHERE the rule lands — only that tokens resolve. Walk the module in
    // pathway order and require the L2 rule card before any regular
    // feminine of an m4 -o adjective shows up in learner-visible Spanish.
    const feminines = new Set(
      ES_M4_ATOMS.filter(
        (a) => a.partOfSpeech === "adjective" && a.surface.endsWith("o"),
      ).flatMap((a) => {
        const fem = `${a.surface.slice(0, -1)}a`;
        return [fem, `${fem}s`];
      }),
    );
    let ruleSeen = false;
    for (const lesson of ES_M4_LESSONS) {
      for (const step of lesson.steps as never as Array<Record<string, unknown>>) {
        if (step.id === "es-m4-2-info-agreement") ruleSeen = true;
        const spanish = [
          step.targetSentence,
          step.audioText,
          step.targetPhrase,
          ...(Array.isArray(step.tiles) ? step.tiles : []),
          ...(Array.isArray(step.acceptedAnswers) ? step.acceptedAnswers : []),
        ]
          .filter((v): v is string => typeof v === "string")
          .join(" ")
          .toLowerCase();
        for (const fem of feminines) {
          if (new RegExp(`\\b${fem}\\b`, "u").test(spanish)) {
            expect(
              ruleSeen,
              `${lesson.id}/${step.id} uses "${fem}" before the agreement rule card`,
            ).toBe(true);
          }
        }
      }
    }
    expect(ruleSeen, "the agreement rule card must exist").toBe(true);
  });

  it("the mastery test drills agreement with gender-variant options (≥2 items)", () => {
    const mastery = ES_M4_LESSONS[7];
    let agreementItems = 0;
    for (const step of mastery.steps as never as Array<Record<string, unknown>>) {
      const options = Array.isArray(step.options)
        ? (step.options as unknown[]).map(String)
        : [];
      const stems = new Set(options.map((o) => o.replace(/(as|os|a|o)$/u, "")));
      if (options.length >= 3 && stems.size === 1) agreementItems += 1;
    }
    expect(agreementItems).toBeGreaterThanOrEqual(2);
  });

  it("no build/listening tile carries punctuation (a 'bonita,' tile is unreadable)", () => {
    for (const lesson of ES_M4_LESSONS) {
      for (const step of lesson.steps as never as Array<Record<string, unknown>>) {
        if (!Array.isArray(step.tiles)) continue;
        for (const tile of step.tiles as unknown[]) {
          expect(
            /^[a-záéíóúñü]+$/iu.test(String(tile)),
            `${lesson.id}/${step.id}: tile "${String(tile)}" is not a bare word`,
          ).toBe(true);
        }
      }
    }
  });
});
