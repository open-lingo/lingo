import { describe, expect, it, beforeEach } from "vitest";
import {
  clearSessionLog,
  logReviewGridServed,
  summarizeReviewGridEvents,
} from "./sessionLog";

describe("review_grid_served telemetry (A8, docs/learning-loop-2026-09-17.md)", () => {
  beforeEach(() => {
    clearSessionLog();
  });

  it("starts empty", () => {
    const s = summarizeReviewGridEvents();
    expect(s).toEqual({
      stepsServed: 0,
      lessonsSeen: 0,
      totalAtomSlotsServed: 0,
      totalOverlap: 0,
      totalNotDueServed: 0,
      latestDueAtomCount: 0,
      overlapRate: 0,
    });
  });

  it("aggregates across multiple logged rows", () => {
    logReviewGridServed({
      lessonId: "ja-m9-neo-3",
      stepIndex: 2,
      servedAtomIds: 2,
      dueAtomIds: 5,
      overlap: 1,
      notDueServed: 1,
      dueNotServed: 4,
    });
    logReviewGridServed({
      lessonId: "ja-m9-neo-3",
      stepIndex: 4,
      servedAtomIds: 3,
      dueAtomIds: 5,
      overlap: 2,
      notDueServed: 1,
      dueNotServed: 3,
    });
    logReviewGridServed({
      lessonId: "ja-m10-neo-1",
      stepIndex: 0,
      servedAtomIds: 1,
      dueAtomIds: 6,
      overlap: 0,
      notDueServed: 1,
      dueNotServed: 6,
    });

    const s = summarizeReviewGridEvents();
    expect(s.stepsServed).toBe(3);
    expect(s.lessonsSeen).toBe(2);
    expect(s.totalAtomSlotsServed).toBe(6); // 2 + 3 + 1
    expect(s.totalOverlap).toBe(3); // 1 + 2 + 0
    expect(s.totalNotDueServed).toBe(3); // 1 + 1 + 1
    expect(s.latestDueAtomCount).toBe(6); // snapshot from the LAST logged row
    expect(s.overlapRate).toBeCloseTo(0.5, 5); // 3/6
  });

  it("returns a STABLE reference between calls when nothing new was logged (useSyncExternalStore contract)", () => {
    logReviewGridServed({
      lessonId: "ja-m9-neo-3",
      stepIndex: 0,
      servedAtomIds: 1,
      dueAtomIds: 1,
      overlap: 1,
      notDueServed: 0,
      dueNotServed: 0,
    });
    const a = summarizeReviewGridEvents();
    const b = summarizeReviewGridEvents();
    expect(a).toBe(b); // same object reference, not just deep-equal
  });

  it("invalidates the cached reference when a new event is logged", () => {
    const before = summarizeReviewGridEvents();
    logReviewGridServed({
      lessonId: "ja-m9-neo-3",
      stepIndex: 0,
      servedAtomIds: 1,
      dueAtomIds: 1,
      overlap: 0,
      notDueServed: 1,
      dueNotServed: 1,
    });
    const after = summarizeReviewGridEvents();
    expect(after).not.toBe(before);
    expect(after.stepsServed).toBe(1);
  });

  it("clearSessionLog resets the summary", () => {
    logReviewGridServed({
      lessonId: "ja-m9-neo-3",
      stepIndex: 0,
      servedAtomIds: 1,
      dueAtomIds: 1,
      overlap: 1,
      notDueServed: 0,
      dueNotServed: 0,
    });
    expect(summarizeReviewGridEvents().stepsServed).toBe(1);
    clearSessionLog();
    expect(summarizeReviewGridEvents().stepsServed).toBe(0);
  });
});
