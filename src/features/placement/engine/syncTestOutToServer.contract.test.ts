/**
 * Server-contract regression tests for the test-out → server sync
 * (TestFlight b18 #144/#145: "I have progress up to module 31 but it marks
 * these incomplete", "is it not sending the progress externally?").
 *
 * Both assertions below mirror a HARD constraint in lingo-core that the
 * synthesised test-out batch violated, so every completion was thrown away
 * server-side while the user row (XP / gems / streak) synced normally:
 *
 *   1. `app/progress/schemas.py:100`
 *        attempts: list[BatchAttempt] = Field(min_length=1, max_length=100)
 *      FastAPI validates the body BEFORE the handler runs, so one oversized
 *      POST is rejected in full (422) — not partially. A JA m32 test-out
 *      synthesises 490 attempts.
 *
 *   2. `app/progress/router.py:363-377`
 *        min_duration = max(5, len(item.stepResults))
 *        if item.durationSec < min_duration: -> accepted=False,
 *                                               reason="duration_below_floor"
 *      Test-out rows carry zero step results, so the floor is 5s. The old
 *      `durationSec: 1` was rejected per-row and never reached
 *      `update_lesson_rollup`, so even a small batch persisted nothing.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAX_ATTEMPTS_PER_BATCH,
  SERVER_DURATION_FLOOR_SEC,
  type BatchAttempt,
  type ProgressApi,
} from "@/shared/api/progress";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  clearTestOutSyncQueue,
  getQueuedTestOutAttempts,
} from "@/shared/domain/testOutSyncQueue";
import { buildTestOutAttempts, syncTestOutToServer } from "./syncTestOutToServer";

/** Spencer's case: tested out of m32 ⇒ m1–m31 credited as assumed. */
function jaModulesThrough(lastModuleId: string): {
  passed: string[];
  assumed: string[];
} {
  const ids = getMockCourse("ja").modules.map((m) => m.id);
  const cut = ids.indexOf(lastModuleId);
  return { passed: [lastModuleId], assumed: ids.slice(0, cut) };
}

function acceptAll(attempts: BatchAttempt[]) {
  return {
    results: attempts.map((a) => ({
      clientAttemptId: a.clientAttemptId,
      attemptId: `srv-${a.clientAttemptId}`,
      accepted: true,
      xpEarned: 0,
      streakAfter: 0,
      lingotsEarned: 0,
      dailyTotalLessons: 0,
    })),
  };
}

describe("test-out sync respects the lingo-core batch contract", () => {
  beforeEach(() => {
    localStorage.clear();
    clearTestOutSyncQueue();
  });

  it("splits a full-course test-out into POSTs of at most 100 attempts", async () => {
    const { passed, assumed } = jaModulesThrough("m32");
    const seen: number[] = [];
    const batchAttempts = vi.fn(
      async (payload: { attempts: BatchAttempt[] }) => {
        seen.push(payload.attempts.length);
        return acceptAll(payload.attempts);
      },
    );
    const progress = { batchAttempts } as unknown as ProgressApi;

    const total = buildTestOutAttempts([...passed, ...assumed], "ja").length;
    // Guard the premise: this really is a multi-chunk payload, so the test
    // can't pass vacuously if the JA course ever shrinks.
    expect(total).toBeGreaterThan(MAX_ATTEMPTS_PER_BATCH);

    const res = await syncTestOutToServer(progress, passed, "ja", assumed);

    expect(seen.length).toBeGreaterThan(1);
    for (const n of seen) expect(n).toBeLessThanOrEqual(MAX_ATTEMPTS_PER_BATCH);
    // Nothing dropped on the way into the chunker.
    expect(seen.reduce((a, b) => a + b, 0)).toBe(total);
    expect(res.submitted).toBe(total);
    expect(res.pending).toBe(0);
    expect(getQueuedTestOutAttempts()).toHaveLength(0);
  });

  it("clears the server duration floor (max(5, steps)) on every row", () => {
    const attempts = buildTestOutAttempts(["m3"], "ja");
    expect(attempts.length).toBeGreaterThan(0);
    for (const a of attempts) {
      const floor = Math.max(SERVER_DURATION_FLOOR_SEC, a.stepResults.length);
      expect(a.durationSec).toBeGreaterThanOrEqual(floor);
    }
  });

  it("keeps un-POSTed attempts in a persisted queue when a chunk fails", async () => {
    const { passed, assumed } = jaModulesThrough("m32");
    const batchAttempts = vi.fn(
      async (payload: { attempts: BatchAttempt[] }) => {
        if (batchAttempts.mock.calls.length > 1) {
          throw new Error("network down");
        }
        return acceptAll(payload.attempts);
      },
    );
    const progress = { batchAttempts } as unknown as ProgressApi;

    const total = buildTestOutAttempts([...passed, ...assumed], "ja").length;
    const res = await syncTestOutToServer(progress, passed, "ja", assumed);

    // First chunk landed; the rest survives the failure for a later retry
    // instead of being console.warn'd into the void.
    expect(res.submitted).toBe(MAX_ATTEMPTS_PER_BATCH);
    expect(res.pending).toBe(total - MAX_ATTEMPTS_PER_BATCH);
    expect(getQueuedTestOutAttempts()).toHaveLength(
      total - MAX_ATTEMPTS_PER_BATCH,
    );
  });

  it("survives an app kill: the queue outlives the failed sync and drains later", async () => {
    const { passed, assumed } = jaModulesThrough("m5");
    const failing = {
      batchAttempts: vi.fn(async () => {
        throw new Error("offline");
      }),
    } as unknown as ProgressApi;

    const first = await syncTestOutToServer(failing, passed, "ja", assumed);
    expect(first.submitted).toBe(0);
    expect(first.pending).toBeGreaterThan(0);

    // Simulate a relaunch: nothing in memory, only localStorage.
    const queued = getQueuedTestOutAttempts();
    expect(queued.length).toBe(first.pending);
    for (const a of queued) expect(a.isTestOut).toBe(true);

    const { drainTestOutSyncQueue } = await import(
      "@/shared/domain/testOutSyncQueue"
    );
    const good = vi.fn(async (payload: { attempts: BatchAttempt[] }) =>
      acceptAll(payload.attempts),
    );
    const drained = await drainTestOutSyncQueue(good);
    expect(drained).toBe(queued.length);
    expect(getQueuedTestOutAttempts()).toHaveLength(0);
  });

  it("re-queues rows the server explicitly rejected", async () => {
    const batchAttempts = vi.fn(
      async (payload: { attempts: BatchAttempt[] }) => ({
        results: payload.attempts.map((a, i) => ({
          clientAttemptId: a.clientAttemptId,
          accepted: i > 0,
          attemptId: i > 0 ? `srv-${i}` : undefined,
          reason: i > 0 ? undefined : "duration_below_floor",
          xpEarned: 0,
          streakAfter: 0,
          lingotsEarned: 0,
          dailyTotalLessons: 0,
        })),
      }),
    );
    const progress = { batchAttempts } as unknown as ProgressApi;

    const res = await syncTestOutToServer(progress, ["m3"], "ja", []);
    expect(res.pending).toBe(1);
    expect(getQueuedTestOutAttempts()).toHaveLength(1);
  });
});
