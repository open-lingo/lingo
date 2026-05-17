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

  it("returns null for languages without a preview", () => {
    expect(getPreviewLesson("ko")).toBeNull();
    expect(getPreviewLesson("zh")).toBeNull();
    expect(getPreviewLesson("xx")).toBeNull();
  });

  it("hasPreviewLesson mirrors registry presence", () => {
    expect(hasPreviewLesson("ja")).toBe(true);
    expect(hasPreviewLesson("ko")).toBe(false);
    expect(hasPreviewLesson("nope")).toBe(false);
  });

  it("every Japanese step has a unique id", () => {
    const lesson = getPreviewLesson("ja");
    const ids = lesson!.steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("MCQ-style preview steps point at a real correctOptionId", () => {
    const lesson = getPreviewLesson("ja");
    for (const step of lesson!.steps) {
      if (
        step.type === "multiple_choice" ||
        step.type === "word_image_mcq"
      ) {
        const ids = step.options.map((o) => o.id);
        expect(ids).toContain(step.correctOptionId);
      }
    }
  });
});
