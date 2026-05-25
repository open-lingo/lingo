import { describe, it, expect, beforeEach } from "vitest";
import {
  appendStepEvent,
  gcOldStepEvents,
  getStepEvents,
  setStepEvents,
} from "./lessonStorage";

describe("lessonStorage — gcOldStepEvents (Fix H9)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("drops step events older than 30 days", () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    setStepEvents([
      {
        lessonId: "fresh",
        stepId: "s1",
        stepIdx: 0,
        correct: true,
        conceptIds: [],
        recordedAt: new Date(now - 1 * day).toISOString(),
      },
      {
        lessonId: "stale",
        stepId: "s2",
        stepIdx: 0,
        correct: false,
        conceptIds: [],
        recordedAt: new Date(now - 45 * day).toISOString(),
      },
    ]);

    const removed = gcOldStepEvents();
    expect(removed).toBe(1);

    const remaining = getStepEvents();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].lessonId).toBe("fresh");
  });

  it("respects a custom maxAgeDays cutoff", () => {
    const now = Date.now();
    appendStepEvent({
      lessonId: "two-day-old",
      stepId: "s1",
      stepIdx: 0,
      correct: true,
      conceptIds: [],
      recordedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const removed = gcOldStepEvents(1);
    expect(removed).toBe(1);
    expect(getStepEvents()).toHaveLength(0);
  });

  it("treats invalid timestamps as stale and removes them", () => {
    setStepEvents([
      {
        lessonId: "broken",
        stepId: "s1",
        stepIdx: 0,
        correct: true,
        conceptIds: [],
        recordedAt: "not-a-date",
      },
    ]);
    const removed = gcOldStepEvents();
    expect(removed).toBe(1);
    expect(getStepEvents()).toHaveLength(0);
  });
});
