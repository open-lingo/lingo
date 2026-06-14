import { describe, it, expect } from "vitest";
import { getPreviewLesson, hasPreviewLesson } from "./previewLessons";

describe("preview lessons registry", () => {
  it("returns the Japanese preview", () => {
    const lesson = getPreviewLesson("ja");
    expect(lesson).not.toBeNull();
    expect(lesson?.languageId).toBe("ja");
    expect(lesson?.steps.length).toBeGreaterThanOrEqual(3);
    expect(lesson?.steps.length).toBeLessThanOrEqual(5);
  });

  it("returns the Korean preview", () => {
    const lesson = getPreviewLesson("ko");
    expect(lesson).not.toBeNull();
    expect(lesson?.languageId).toBe("ko");
    expect(lesson?.steps.length).toBeGreaterThanOrEqual(3);
    expect(lesson?.steps.length).toBeLessThanOrEqual(5);
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
