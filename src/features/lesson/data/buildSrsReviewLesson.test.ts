import { describe, expect, it, beforeEach } from "vitest";
import { buildSrsReviewLesson } from "./buildSrsReviewLesson";
import { getAtomsUpToModule } from "./lessonAtomIndex";
import { unlockAtomIds } from "./unlockLessonAtoms";
import { clearSRSStore } from "@/features/flashcards/engine";

/**
 * ES review lessons assemble once the lesson atom index is generalized
 * (2026-07-15): `getAtomsUpToModule("m3", "es")` feeds real unlocked atoms
 * into the same builder the JA course uses.
 */
describe("buildSrsReviewLesson (es)", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSRSStore();
  });

  it("assembles a review lesson from unlocked ES atoms up to m3", () => {
    const atoms = getAtomsUpToModule("m3", "es");
    expect(atoms.length).toBeGreaterThan(3);
    unlockAtomIds(atoms.map((a) => a.id));

    const lesson = buildSrsReviewLesson({
      moduleId: "m3",
      position: 1,
      courseId: "mock-1",
      languageId: "es",
    });

    expect(lesson.id).toBe("es-m3-review-1");
    expect(lesson.languageId).toBe("es");
    // Real review steps, not the "Nothing to review yet" placeholder.
    const reviewSteps = lesson.steps.filter((s) => s.type !== "info");
    expect(reviewSteps.length).toBeGreaterThan(0);
  });

  it("falls back to the empty-state info step when nothing is unlocked", () => {
    const lesson = buildSrsReviewLesson({
      moduleId: "m3",
      position: 2,
      courseId: "mock-1",
      languageId: "es",
    });
    expect(lesson.steps).toHaveLength(1);
    expect(lesson.steps[0].type).toBe("info");
  });
});
