import { describe, expect, it } from "vitest";
import { getModuleStatus, getCurrentModuleIndex, isReviewLessonId } from "./moduleProgress";
import type { Course, CourseModule } from "@/shared/domain/course";

const mod = (id: string, lessonIds: string[]): CourseModule =>
  ({
    id,
    title: id,
    lessons: lessonIds.map((lid) => ({ id: lid, title: lid })),
  }) as CourseModule;

describe("review lessons don't gate module unlock", () => {
  it("ja review lessons are excluded (existing behavior)", () => {
    const modules = [mod("m3", ["ja-m3-1", "ja-m3-review-1"]), mod("m4", ["ja-m4-1"])];
    expect(getModuleStatus(1, new Set(["ja-m3-1"]), modules)).toBe("current");
  });

  it("ko review lessons are excluded (new)", () => {
    const modules = [mod("m2", ["ko-m2-ka-1", "ko-m2-review"]), mod("m3", ["ko-m3-1"])];
    expect(getModuleStatus(1, new Set(["ko-m2-ka-1"]), modules)).toBe("current");
  });

  it("ko mastery tests still gate", () => {
    const modules = [mod("m3", ["ko-m3-1", "ko-m3-8"]), mod("m4", ["ko-m4-1"])];
    expect(getModuleStatus(1, new Set(["ko-m3-1"]), modules)).toBe("locked");
  });

  it("isReviewLessonId matches the rewrite-spine `-neo-review` shape (m3-m6: no numeric suffix; m7+: -1/-2/-3)", () => {
    expect(isReviewLessonId("ja-m3-neo-review")).toBe(true);
    expect(isReviewLessonId("ja-m10-neo-review-1")).toBe(true);
    expect(isReviewLessonId("ja-m10-neo-review-3")).toBe(true);
    // old-course shape still matches too
    expect(isReviewLessonId("ja-m3-review-1")).toBe(true);
    // a content lesson that merely contains "review" in its slug must not match
    expect(isReviewLessonId("ko-m2-bt-review")).toBe(false);
    expect(isReviewLessonId("ja-m3-neo-1")).toBe(false);
  });

  it("getCurrentModuleIndex agrees with getModuleStatus on review lessons (2026-09-16 regression guard)", () => {
    // Before the fix, getModuleStatus's isContentLesson filter excluded
    // review lessons from the "is this module done" check, but
    // getCurrentModuleIndex required EVERY lesson (review included) to be
    // complete — so a module whose only remaining lesson was its SRS
    // review lesson read "completed" on the map (getModuleStatus) while
    // still being reported as the "current"/resume module
    // (getCurrentModuleIndex), which drives the course-map "you are here"
    // marker, the Resume FAB target, and the practice-tier gate.
    const modules = [mod("m3", ["ja-m3-1", "ja-m3-neo-review"]), mod("m4", ["ja-m4-1"])];
    const course = { id: "ja", title: "ja", languageId: "ja", modules } as Course;
    const completed = new Set(["ja-m3-1"]); // content lesson done, review lesson NOT done
    expect(getModuleStatus(0, completed, modules)).toBe("completed");
    expect(getCurrentModuleIndex(course, completed)).toBe(1);
  });
});
