import { describe, it, expect, beforeEach } from "vitest";
import {
  GRADUATED_STAGE,
  clearAllReviewSchedules,
  getAllReviewSchedules,
  getDueReviews,
  getNextDueMs,
  getReviewSchedule,
  isReviewGraduated,
  markReviewCompleted,
  reviewModuleIdFor,
  scheduleFirstReview,
  sourceModuleIdOf,
} from "./moduleReviewSchedule";
import type { Course } from "@/shared/domain/course";

const DAY = 24 * 60 * 60 * 1000;

function fakeCourse(moduleIds: string[]): Course {
  return {
    id: "mock-1",
    title: "test",
    languageId: "ja",
    modules: moduleIds.map((id) => ({ id, title: id, lessons: [] })),
  };
}

describe("moduleReviewSchedule", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts empty", () => {
    expect(getReviewSchedule("m3")).toBeNull();
    expect(getAllReviewSchedules().size).toBe(0);
  });

  it("scheduleFirstReview seeds stage 0 with the given timestamp", () => {
    const t = new Date("2026-05-01T00:00:00Z").toISOString();
    scheduleFirstReview("m3", t);
    const s = getReviewSchedule("m3");
    expect(s).not.toBeNull();
    expect(s!.stage).toBe(0);
    expect(s!.lastCompletedAt).toBe(t);
  });

  it("scheduleFirstReview is idempotent (does not reset existing stage)", () => {
    const t1 = new Date("2026-05-01T00:00:00Z").toISOString();
    scheduleFirstReview("m3", t1);
    markReviewCompleted("m3", t1);
    expect(getReviewSchedule("m3")!.stage).toBe(1);
    // Calling scheduleFirstReview again must not reset to 0.
    scheduleFirstReview("m3", new Date().toISOString());
    expect(getReviewSchedule("m3")!.stage).toBe(1);
  });

  it("markReviewCompleted advances stage by 1 each call, capped at GRADUATED_STAGE", () => {
    scheduleFirstReview("m3", new Date().toISOString());
    for (let i = 1; i <= GRADUATED_STAGE; i++) {
      markReviewCompleted("m3");
      expect(getReviewSchedule("m3")!.stage).toBe(i);
    }
    // Already at GRADUATED_STAGE — must not exceed.
    markReviewCompleted("m3");
    expect(getReviewSchedule("m3")!.stage).toBe(GRADUATED_STAGE);
    expect(isReviewGraduated("m3")).toBe(true);
  });

  it("getNextDueMs returns last + interval at each stage and null at graduation", () => {
    const base = Date.parse("2026-05-01T00:00:00Z");
    const t = new Date(base).toISOString();
    scheduleFirstReview("m3", t);
    expect(getNextDueMs(getReviewSchedule("m3")!)).toBe(base + 1 * DAY);
    markReviewCompleted("m3", new Date(base).toISOString());
    expect(getNextDueMs(getReviewSchedule("m3")!)).toBe(base + 3 * DAY);
    markReviewCompleted("m3", new Date(base).toISOString());
    expect(getNextDueMs(getReviewSchedule("m3")!)).toBe(base + 7 * DAY);
    markReviewCompleted("m3", new Date(base).toISOString());
    expect(getNextDueMs(getReviewSchedule("m3")!)).toBe(base + 14 * DAY);
    markReviewCompleted("m3", new Date(base).toISOString());
    expect(getNextDueMs(getReviewSchedule("m3")!)).toBe(base + 30 * DAY);
    markReviewCompleted("m3", new Date(base).toISOString());
    // Now at stage 5 = graduated.
    expect(getNextDueMs(getReviewSchedule("m3")!)).toBeNull();
  });

  it("getDueReviews surfaces only modules whose due time has passed", () => {
    const base = Date.parse("2026-05-01T00:00:00Z");
    scheduleFirstReview("m3", new Date(base).toISOString());
    scheduleFirstReview("m4", new Date(base + 2 * DAY).toISOString());
    const course = fakeCourse(["m3", "m4", "m5"]);
    // 1.5 days after base: m3 due (since stage-0 = +1d), m4 not yet.
    const now = base + 1.5 * DAY;
    const due = getDueReviews(course, now);
    expect(due.map((d) => d.moduleId)).toEqual(["m3"]);
  });

  it("getDueReviews sorts by oldest-due first", () => {
    const base = Date.parse("2026-05-01T00:00:00Z");
    scheduleFirstReview("m3", new Date(base).toISOString());
    scheduleFirstReview("m4", new Date(base - 5 * DAY).toISOString());
    const course = fakeCourse(["m3", "m4"]);
    const due = getDueReviews(course, base + 2 * DAY);
    // m4 went due 4 days before m3 (m4 completed 5d ago, +1d = 4d in the past).
    expect(due[0].moduleId).toBe("m4");
    expect(due[1].moduleId).toBe("m3");
  });

  it("getDueReviews skips graduated reviews", () => {
    const base = Date.parse("2026-05-01T00:00:00Z");
    scheduleFirstReview("m3", new Date(base).toISOString());
    for (let i = 0; i < GRADUATED_STAGE; i++) markReviewCompleted("m3");
    const course = fakeCourse(["m3"]);
    expect(getDueReviews(course, base + 1000 * DAY)).toEqual([]);
  });

  it("getDueReviews ignores schedules for modules not in the course", () => {
    scheduleFirstReview("m99", new Date(0).toISOString());
    const course = fakeCourse(["m3"]);
    expect(getDueReviews(course)).toEqual([]);
  });

  it("review-module-id helpers round-trip", () => {
    expect(reviewModuleIdFor("m3")).toBe("m3-review");
    expect(sourceModuleIdOf("m3-review")).toBe("m3");
    expect(sourceModuleIdOf("m3")).toBeNull();
  });

  it("clearAllReviewSchedules wipes storage", () => {
    scheduleFirstReview("m3");
    expect(getReviewSchedule("m3")).not.toBeNull();
    clearAllReviewSchedules();
    expect(getReviewSchedule("m3")).toBeNull();
  });
});
