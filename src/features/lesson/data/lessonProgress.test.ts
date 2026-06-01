import { describe, it, expect, beforeEach } from "vitest";
import {
  clearLessonInProgress,
  findInProgressLessonId,
  loadLessonInProgress,
  saveLessonInProgress,
} from "./lessonProgress";

const LESSON_ID = "ja-m1-test-lesson";
const STEP_IDS = new Set(["step-1", "step-2", "step-3"]);

function key() {
  return `lingo_lesson_inprogress_v1_${LESSON_ID}`;
}

describe("lessonProgress persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a saved record", () => {
    saveLessonInProgress(LESSON_ID, {
      stepIdx: 2,
      results: { "step-1": true, "step-2": false },
      startedAt: new Date().toISOString(),
    });
    const loaded = loadLessonInProgress(LESSON_ID, STEP_IDS, 3);
    expect(loaded).not.toBeNull();
    expect(loaded!.stepIdx).toBe(2);
    expect(loaded!.results).toEqual({ "step-1": true, "step-2": false });
  });

  it("returns null when nothing is stored", () => {
    expect(loadLessonInProgress(LESSON_ID, STEP_IDS, 3)).toBeNull();
  });

  it("drops a record older than 14 days (stale guard)", () => {
    const stale = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    saveLessonInProgress(LESSON_ID, {
      stepIdx: 1,
      results: { "step-1": true },
      startedAt: stale,
    });
    expect(loadLessonInProgress(LESSON_ID, STEP_IDS, 3)).toBeNull();
    expect(localStorage.getItem(key())).toBeNull();
  });

  it("discards on curriculum drift (results reference unknown step id)", () => {
    saveLessonInProgress(LESSON_ID, {
      stepIdx: 1,
      results: { "step-1": true, "phantom-step": true },
      startedAt: new Date().toISOString(),
    });
    expect(loadLessonInProgress(LESSON_ID, STEP_IDS, 3)).toBeNull();
    expect(localStorage.getItem(key())).toBeNull();
  });

  it("discards when stepIdx is out of range for current lesson length", () => {
    saveLessonInProgress(LESSON_ID, {
      stepIdx: 99,
      results: {},
      startedAt: new Date().toISOString(),
    });
    expect(loadLessonInProgress(LESSON_ID, STEP_IDS, 3)).toBeNull();
  });

  it("discards malformed JSON", () => {
    localStorage.setItem(key(), "{not-json");
    expect(loadLessonInProgress(LESSON_ID, STEP_IDS, 3)).toBeNull();
    expect(localStorage.getItem(key())).toBeNull();
  });

  it("clear removes the record", () => {
    saveLessonInProgress(LESSON_ID, {
      stepIdx: 0,
      results: {},
      startedAt: new Date().toISOString(),
    });
    clearLessonInProgress(LESSON_ID);
    expect(localStorage.getItem(key())).toBeNull();
  });
});

describe("findInProgressLessonId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(findInProgressLessonId(new Set(["ja-m1-a"]))).toBeNull();
  });

  it("returns the most-recently-started lesson within the allow-list", () => {
    const older = new Date(Date.now() - 60_000).toISOString();
    const newer = new Date(Date.now() - 1_000).toISOString();
    saveLessonInProgress("ja-m1-a", { stepIdx: 1, results: {}, startedAt: older });
    saveLessonInProgress("ja-m1-b", { stepIdx: 0, results: {}, startedAt: newer });
    const allow = new Set(["ja-m1-a", "ja-m1-b"]);
    expect(findInProgressLessonId(allow)).toBe("ja-m1-b");
  });

  it("ignores lessons not in the allow-list (other course)", () => {
    saveLessonInProgress("ko-m1-a", {
      stepIdx: 1,
      results: {},
      startedAt: new Date().toISOString(),
    });
    expect(findInProgressLessonId(new Set(["ja-m1-a"]))).toBeNull();
  });

  it("skips stale records (> 14d)", () => {
    const stale = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    saveLessonInProgress("ja-m1-a", { stepIdx: 1, results: {}, startedAt: stale });
    expect(findInProgressLessonId(new Set(["ja-m1-a"]))).toBeNull();
  });

  it("skips malformed records without throwing", () => {
    localStorage.setItem(`lingo_lesson_inprogress_v1_ja-m1-a`, "{nope");
    saveLessonInProgress("ja-m1-b", {
      stepIdx: 0,
      results: {},
      startedAt: new Date().toISOString(),
    });
    expect(findInProgressLessonId(new Set(["ja-m1-a", "ja-m1-b"]))).toBe(
      "ja-m1-b",
    );
  });
});
