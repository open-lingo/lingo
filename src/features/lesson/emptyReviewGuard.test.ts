import { describe, expect, it } from "vitest";
import { isEmptyReviewLesson } from "./LessonPage";
import { getMockLessonContent } from "./data/mockLessons";
import type { LessonContent, LessonStep } from "./types";

/**
 * Regression guard for the empty-SRS-review no-op (Spencer 2026-06-13 audit).
 *
 * A review node opened before any vocabulary is due renders the single
 * "Nothing to review yet" placeholder. Completing it must NOT award XP or
 * mark the node complete — `isEmptyReviewLesson` is the predicate the
 * completion path + finished-render redirect both gate on. If this flips,
 * the bug (full lesson XP for zero retrieval; node hidden before it's
 * actually reviewed) comes back.
 */

const info = (id: string): LessonStep =>
  ({ id, type: "info", title: "t", body: "b" }) as unknown as LessonStep;
const mcq = (id: string): LessonStep =>
  ({
    id,
    type: "multiple_choice",
    prompt: "p",
    options: [{ id: "a", text: "a" }],
    correctOptionId: "a",
  }) as unknown as LessonStep;

const lesson = (id: string, steps: LessonStep[]): LessonContent =>
  ({ id, moduleId: "m3", courseId: "c", languageId: "ja", title: "t", steps }) as
    unknown as LessonContent;

describe("isEmptyReviewLesson", () => {
  it("is true for a review-id lesson with only teach/info steps", () => {
    expect(isEmptyReviewLesson(lesson("ja-m3-review-1", [info("x")]))).toBe(true);
    expect(isEmptyReviewLesson(lesson("ja-m12-review-2", [info("x")]))).toBe(true);
  });

  it("is false once the review has any graded step", () => {
    expect(
      isEmptyReviewLesson(lesson("ja-m3-review-1", [info("x"), mcq("y")])),
    ).toBe(false);
  });

  it("is false for a non-review all-info lesson (intro lessons still earn XP)", () => {
    expect(isEmptyReviewLesson(lesson("ja-m1-l1-1", [info("x")]))).toBe(false);
    expect(isEmptyReviewLesson(lesson("ko-m1-intro", [info("x")]))).toBe(false);
  });

  it("matches the empty review the builder actually produces with no unlocks", () => {
    // No atoms unlocked in a fresh test env → builder returns the placeholder.
    const built = getMockLessonContent("ja-m3-review-1");
    expect(built).not.toBeNull();
    if (built) expect(isEmptyReviewLesson(built)).toBe(true);
  });
});
