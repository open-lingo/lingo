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

describe("lessonSync — server batch cap (b18 #144)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("splits a >100-attempt buffer into POSTs the server will accept", async () => {
    // A long offline stretch can buffer more attempts than
    // `schemas.py:100` allows. FastAPI rejects an oversized body in FULL,
    // so an unchunked flush would 422 forever and the buffer would never
    // drain (backoff caps at 10 min, but the payload can never be legal).
    setPendingAttempts(
      Array.from({ length: 237 }, (_, i) =>
        makeAttempt({ clientAttemptId: `a-${i}`, lessonId: `lesson-${i}` }),
      ),
    );

    const sizes: number[] = [];
    const streakFlags: boolean[] = [];
    const syncFn = async (
      payload: BatchAttemptSubmission,
    ): Promise<BatchAttemptResponse> => {
      sizes.push(payload.attempts.length);
      streakFlags.push(Boolean(payload.checkStreak));
      return {
        results: payload.attempts.map((a) => ({
          clientAttemptId: a.clientAttemptId,
          attemptId: `srv-${a.clientAttemptId}`,
          accepted: true,
          xpEarned: 0,
          streakAfter: 0,
          lingotsEarned: 0,
          dailyTotalLessons: 0,
        })),
      };
    };

    const cleared = await performLessonSync(syncFn);

    expect(sizes).toEqual([100, 100, 37]);
    for (const n of sizes) expect(n).toBeLessThanOrEqual(100);
    // checkStreak is a once-per-batch flag; only the first chunk may carry it.
    expect(streakFlags.slice(1).every((f) => f === false)).toBe(true);
    expect(cleared).toBe(237);
    expect(getPendingAttempts()).toHaveLength(0);
  });

  it("banks the chunks that landed before rethrowing a mid-flush failure", async () => {
    setPendingAttempts(
      Array.from({ length: 150 }, (_, i) =>
        makeAttempt({ clientAttemptId: `b-${i}`, lessonId: `lesson-${i}` }),
      ),
    );

    let calls = 0;
    const syncFn = async (
      payload: BatchAttemptSubmission,
    ): Promise<BatchAttemptResponse> => {
      calls += 1;
      if (calls > 1) throw new Error("network dropped");
      return {
        results: payload.attempts.map((a) => ({
          clientAttemptId: a.clientAttemptId,
          attemptId: `srv-${a.clientAttemptId}`,
          accepted: true,
          xpEarned: 0,
          streakAfter: 0,
          lingotsEarned: 0,
          dailyTotalLessons: 0,
        })),
      };
    };

    await expect(performLessonSync(syncFn)).rejects.toThrow("network dropped");
    // The 100 the server took are gone from the buffer; the rest wait.
    expect(getPendingAttempts()).toHaveLength(50);
  });
});
