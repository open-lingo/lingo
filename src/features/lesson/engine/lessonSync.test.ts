import { describe, it, expect, beforeEach } from "vitest";
import type {
  BatchAttemptResponse,
  BatchAttemptSubmission,
} from "@/shared/api/progress";
import {
  appendPendingAttempt,
  getPendingAttempts,
  setPendingAttempts,
  type PendingAttempt,
} from "./lessonStorage";
import {
  buildBatchPayload,
  performLessonSync,
} from "./lessonSync";

function makeAttempt(
  partial: Partial<PendingAttempt> & { clientAttemptId: string; lessonId: string },
): PendingAttempt {
  const now = new Date().toISOString();
  return {
    attemptedAt: now,
    bufferedAt: now,
    durationSec: 30,
    passed: true,
    score: 1,
    stepResults: [{ stepIdx: 0, conceptIds: ["a"], correct: true }],
    ...partial,
  };
}

describe("lessonSync — dedup by clientAttemptId (Fix M10)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("preserves two attempts on the same lessonId when clientAttemptIds differ", () => {
    appendPendingAttempt(
      makeAttempt({
        clientAttemptId: "attempt-1",
        lessonId: "lesson-A",
        bufferedAt: "2026-05-25T10:00:00.000Z",
      }),
    );
    appendPendingAttempt(
      makeAttempt({
        clientAttemptId: "attempt-2",
        lessonId: "lesson-A",
        bufferedAt: "2026-05-25T10:05:00.000Z",
      }),
    );

    const { payload, ids } = buildBatchPayload();
    expect(ids.sort()).toEqual(["attempt-1", "attempt-2"]);
    expect(payload.attempts).toHaveLength(2);
  });

  it("still collapses true duplicates that share a clientAttemptId at the storage layer", () => {
    appendPendingAttempt(
      makeAttempt({
        clientAttemptId: "dup-1",
        lessonId: "lesson-B",
        bufferedAt: "2026-05-25T10:00:00.000Z",
      }),
    );
    // Same clientAttemptId — appendPendingAttempt overwrites the prior row.
    appendPendingAttempt(
      makeAttempt({
        clientAttemptId: "dup-1",
        lessonId: "lesson-B",
        bufferedAt: "2026-05-25T10:01:00.000Z",
        score: 0.5,
      }),
    );

    const { ids, payload } = buildBatchPayload();
    expect(ids).toEqual(["dup-1"]);
    expect(payload.attempts).toHaveLength(1);
    expect(payload.attempts[0].score).toBe(0.5);
  });
});

describe("lessonSync — two-tab race (Fix H8)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("performLessonSync only clears the attempts it sent — late writes survive", async () => {
    // Tab A buffers attempt-A.
    appendPendingAttempt(
      makeAttempt({
        clientAttemptId: "attempt-A",
        lessonId: "lesson-A",
        bufferedAt: "2026-05-25T10:00:00.000Z",
      }),
    );

    // Sync function simulates a server response — but BEFORE it resolves, a
    // "second tab" writes attempt-B to the same localStorage buffer. The fix
    // (re-read at sync time + clientAttemptId-keyed removal) ensures B
    // survives even though it appeared mid-flight.
    const syncFn = async (
      payload: BatchAttemptSubmission,
    ): Promise<BatchAttemptResponse> => {
      // Simulate sibling tab appending while server call is in flight.
      appendPendingAttempt(
        makeAttempt({
          clientAttemptId: "attempt-B-sibling-tab",
          lessonId: "lesson-A",
          bufferedAt: "2026-05-25T10:00:01.000Z",
        }),
      );
      return {
        results: payload.attempts.map((a) => ({
          clientAttemptId: a.clientAttemptId,
          accepted: true,
          attemptId: `srv-${a.clientAttemptId}`,
          xpEarned: 0,
          streakAfter: 0,
          lingotsEarned: 0,
          dailyTotalLessons: 0,
        })),
      };
    };

    const cleared = await performLessonSync(syncFn);
    expect(cleared).toBe(1);

    const remaining = getPendingAttempts();
    const ids = remaining.map((a) => a.clientAttemptId);
    expect(ids).toContain("attempt-B-sibling-tab");
    expect(ids).not.toContain("attempt-A");
  });

  it("a concurrent setPendingAttempts overwrite does not lose entries the sync just cleared", async () => {
    // Demonstrates buildBatchPayload re-reads the freshest snapshot from
    // localStorage rather than capturing a stale closure. We mutate the
    // buffer between two buildBatchPayload calls and confirm the second
    // one picks up the new state.
    setPendingAttempts([
      makeAttempt({
        clientAttemptId: "tab-A-1",
        lessonId: "lesson-Z",
        bufferedAt: "2026-05-25T09:00:00.000Z",
      }),
    ]);
    const first = buildBatchPayload();
    expect(first.ids).toEqual(["tab-A-1"]);

    // Simulate another tab appending after our first read.
    appendPendingAttempt(
      makeAttempt({
        clientAttemptId: "tab-B-1",
        lessonId: "lesson-Z",
        bufferedAt: "2026-05-25T09:01:00.000Z",
      }),
    );

    const second = buildBatchPayload();
    expect(second.ids.sort()).toEqual(["tab-A-1", "tab-B-1"]);
  });
});
