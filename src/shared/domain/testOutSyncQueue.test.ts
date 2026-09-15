import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAX_ATTEMPTS_PER_BATCH,
  SERVER_DURATION_CEILING_SEC,
  SERVER_DURATION_FLOOR_SEC,
  type BatchAttempt,
} from "@/shared/api/progress";
import {
  chunkAttempts,
  clearTestOutSyncQueue,
  drainTestOutSyncQueue,
  enqueueTestOutAttempts,
  getQueuedTestOutAttempts,
  getTestOutQueueCount,
  toServerLegalAttempt,
} from "./testOutSyncQueue";

function row(id: string, over: Partial<BatchAttempt> = {}): BatchAttempt {
  return {
    clientAttemptId: id,
    lessonId: `lesson-${id}`,
    attemptedAt: "2026-09-15T12:00:00.000Z",
    durationSec: SERVER_DURATION_FLOOR_SEC,
    passed: true,
    score: 1,
    stepResults: [],
    isTestOut: true,
    ...over,
  };
}

describe("testOutSyncQueue", () => {
  beforeEach(() => {
    localStorage.clear();
    clearTestOutSyncQueue();
  });

  it("raises a row under the server duration floor instead of letting it be rejected", () => {
    // `router.py:363` → min_duration = max(5, len(stepResults)).
    expect(toServerLegalAttempt(row("a", { durationSec: 1 })).durationSec).toBe(
      SERVER_DURATION_FLOOR_SEC,
    );
    const withSteps = row("b", {
      durationSec: 2,
      stepResults: Array.from({ length: 9 }, (_, i) => ({
        stepIdx: i,
        conceptIds: [],
        correct: true,
      })),
    });
    expect(toServerLegalAttempt(withSteps).durationSec).toBe(9);
    // And still clamps the abandoned-tab ceiling.
    expect(
      toServerLegalAttempt(row("c", { durationSec: 99_999 })).durationSec,
    ).toBe(SERVER_DURATION_CEILING_SEC);
  });

  it("chunks to the server's cap", () => {
    const rows = Array.from({ length: 205 }, (_, i) => row(`r-${i}`));
    expect(chunkAttempts(rows).map((c) => c.length)).toEqual([100, 100, 5]);
    expect(MAX_ATTEMPTS_PER_BATCH).toBe(100);
  });

  it("round-trips through localStorage and de-dupes by clientAttemptId", () => {
    enqueueTestOutAttempts([row("x"), row("y")]);
    enqueueTestOutAttempts([row("y"), row("z")]);
    expect(getTestOutQueueCount()).toBe(3);
    expect(getQueuedTestOutAttempts().map((a) => a.clientAttemptId)).toEqual([
      "x",
      "y",
      "z",
    ]);
  });

  it("keeps rows the server did not confirm and drops the ones it did", async () => {
    enqueueTestOutAttempts([row("k1"), row("k2"), row("k3")]);
    const batch = vi.fn(async (payload: { attempts: BatchAttempt[] }) => ({
      results: payload.attempts.map((a) => ({
        clientAttemptId: a.clientAttemptId,
        accepted: a.clientAttemptId !== "k2",
        attemptId: a.clientAttemptId !== "k2" ? `srv-${a.clientAttemptId}` : undefined,
        xpEarned: 0,
        streakAfter: 0,
        lingotsEarned: 0,
        dailyTotalLessons: 0,
      })),
    }));

    expect(await drainTestOutSyncQueue(batch)).toBe(2);
    expect(getQueuedTestOutAttempts().map((a) => a.clientAttemptId)).toEqual([
      "k2",
    ]);
  });

  it("treats an empty results array as 'not stored' and keeps everything", async () => {
    // `ProgressApi.batchAttempts` returns `{results: []}` on 404/501.
    enqueueTestOutAttempts([row("n1"), row("n2")]);
    const batch = vi.fn(async () => ({ results: [] }));
    expect(await drainTestOutSyncQueue(batch)).toBe(0);
    expect(getTestOutQueueCount()).toBe(2);
  });

  it("is a no-op when empty (no POST on every sync tick)", async () => {
    const batch = vi.fn(async () => ({ results: [] }));
    expect(await drainTestOutSyncQueue(batch)).toBe(0);
    expect(batch).not.toHaveBeenCalled();
  });
});
