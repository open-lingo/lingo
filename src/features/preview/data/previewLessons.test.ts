import { describe, it, expect } from "vitest";
import { getPreviewLesson, hasPreviewLesson } from "./previewLessons";

describe("preview lessons registry", () => {
  it("returns the Japanese preview", () => {
    const lesson = getPreviewLesson("ja");
    expect(lesson).not.toBeNull();
    expect(lesson?.languageId).toBe("ja");
    expect(lesson?.steps.length).toBe(8);
  });

  it("returns the Korean preview", () => {
    const lesson = getPreviewLesson("ko");
    expect(lesson).not.toBeNull();
    expect(lesson?.languageId).toBe("ko");
    expect(lesson?.steps.length).toBe(8);
  });

  // Design rule (Spencer, 2026-06-30): no two adjacent steps share a type —
  // the taste should never feel like the same drill twice in a row.
  it("never repeats a step type back-to-back", () => {
    for (const langId of ["ja", "ko"]) {
      const steps = getPreviewLesson(langId)!.steps;
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `${langId} preview: ${steps[i - 1].id} → ${steps[i].id} repeat type "${steps[i].type}"`,
        ).not.toBe(steps[i - 1].type);
      }
    }
  });

  // Design rule: teach before you test. Anything a graded step asks the learner
  // to recall must already have been INTRODUCED with its meaning — by a
  // phrase_card, the CORRECT option of an earlier picture-MCQ, or a speaking step.
  // A match step is a TEST, not an introduction: pairing みず↔water only works
  // if みず's meaning was shown first (the old preview sprang みず/おちゃ that had
  // only flashed as distractor pictures, and こんにちは / 감사합니다 cold).
  it("introduces every quizzed answer before it is tested", () => {
    const introByGreeting: Record<string, string> = {
      ja: "こんにちは",
      ko: "안녕하세요",
    };
    for (const langId of ["ja", "ko"]) {
      const steps = getPreviewLesson(langId)!.steps;
      const introduced = new Set<string>();
      for (const step of steps) {
        // --- Checks run BEFORE recording this step's own introductions ---
        // The greeting finale is recall on a phrase taught up front.
        if (step.type === "multiple_choice" && step.promptAudioText) {
          expect(
            introduced.has(step.promptAudioText),
            `${langId} preview: ${step.id} quizzes "${step.promptAudioText}" before it is taught`,
          ).toBe(true);
        }
        // Match is a test: every source word must already be introduced.
        if (step.type === "match_pairs") {
          for (const p of step.pairs) {
            expect(
              introduced.has(p.source),
              `${langId} preview: ${step.id} matches "${p.source}" before it is introduced with meaning`,
            ).toBe(true);
          }
        }
        // --- Record what this step INTRODUCES (card / correct picture / say) ---
        if (step.type === "phrase_card") {
          introduced.add(step.kana);
        }
        if (step.type === "word_image_mcq") {
          const correct = step.options.find((o) => o.id === step.correctOptionId);
          if (correct) introduced.add(correct.word);
        }
        if (step.type === "speaking") introduced.add(step.targetPhrase);
      }
      // Sanity: the greeting really was taught somewhere in the lesson.
      expect(introduced.has(introByGreeting[langId])).toBe(true);
    }
  });

  it("returns null for languages without a preview", () => {
    expect(getPreviewLesson("zh")).toBeNull();
    expect(getPreviewLesson("xx")).toBeNull();
  });

  it("hasPreviewLesson mirrors registry presence", () => {
    expect(hasPreviewLesson("ja")).toBe(true);
    expect(hasPreviewLesson("ko")).toBe(true);
    expect(hasPreviewLesson("nope")).toBe(false);
  });

  it("every step has a unique id within its preview", () => {
    for (const langId of ["ja", "ko"]) {
      const lesson = getPreviewLesson(langId);
      const ids = lesson!.steps.map((s) => s.id);
      expect(new Set(ids).size, `dup step id in ${langId} preview`).toBe(ids.length);
    }
  });

  it("MCQ-style preview steps point at a real correctOptionId", () => {
    for (const langId of ["ja", "ko"]) {
      const lesson = getPreviewLesson(langId);
      for (const step of lesson!.steps) {
        if (
          step.type === "multiple_choice" ||
          step.type === "word_image_mcq"
        ) {
          const ids = step.options.map((o) => o.id);
          expect(ids).toContain(step.correctOptionId);
        }
      }
    }
  });
});
