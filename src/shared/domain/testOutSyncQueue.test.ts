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
  getTestOutQueueDiagnostics,
  postAttemptChunks,
  resetTestOutQueueDiagnosticsForTests,
  toServerLegalAttempt,
} from "./testOutSyncQueue";
import { clearSessionLog, getSessionLog } from "@/shared/telemetry/sessionLog";
import { __resetErrorReporterForTests, __getPendingQueueForTests } from "@/shared/telemetry/errorReporter";

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
    clearSessionLog();
    __resetErrorReporterForTests();
    resetTestOutQueueDiagnosticsForTests();
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

  // ── 2026-09-18 instrumentation (SYNC2 lane) — the queue's only trace of a
  // failed drain used to be a `console.warn` nobody on a real device can
  // see (that IS why Spencer's server access log showed nothing for the
  // 491-row push: the client never surfaced the failure anywhere a human
  // could read it back). Now every drain attempt is visible: a diagnostics
  // getter for the Sync panel, and the failure reaches errorReporter with
  // breadcrumbs so an automatic report — or "Send diagnostics" — carries it.
  describe("diagnostics", () => {
    it("starts empty", () => {
      expect(getTestOutQueueDiagnostics()).toEqual({
        pendingCount: 0,
        lastChunkSize: null,
        lastAttemptAt: null,
        lastSuccessAt: null,
        lastError: null,
      });
    });

    it("records chunk size + timestamps on a successful drain, and pending count reflects the queue", async () => {
      enqueueTestOutAttempts([row("s1"), row("s2")]);
      const batch = vi.fn(async (payload: { attempts: BatchAttempt[] }) => ({
        results: payload.attempts.map((a) => ({
          clientAttemptId: a.clientAttemptId,
          accepted: true,
          attemptId: `srv-${a.clientAttemptId}`,
          xpEarned: 0,
          streakAfter: 0,
          lingotsEarned: 0,
          dailyTotalLessons: 0,
        })),
      }));

      await drainTestOutSyncQueue(batch);
      const diag = getTestOutQueueDiagnostics();
      expect(diag.pendingCount).toBe(0);
      expect(diag.lastChunkSize).toBe(2);
      expect(diag.lastError).toBeNull();
      expect(Date.parse(diag.lastAttemptAt!)).toBeGreaterThan(0);
      expect(Date.parse(diag.lastSuccessAt!)).toBeGreaterThan(0);
    });

    it("records the failed chunk's error shape and leaves the queue's pending count intact", async () => {
      enqueueTestOutAttempts([row("f1"), row("f2")]);
      const batch = vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      });

      const result = await postAttemptChunks(batch, [row("f1"), row("f2")]);
      expect(result.failed).toBe(true);

      const diag = getTestOutQueueDiagnostics();
      expect(diag.lastChunkSize).toBe(2);
      expect(diag.lastError).toMatchObject({
        name: "TypeError",
        message: "Failed to fetch",
      });
      expect(Date.parse(diag.lastError!.at)).toBeGreaterThan(0);
    });

    it("reports a chunk failure through errorReporter with a matching breadcrumb, not just a console.warn", async () => {
      enqueueTestOutAttempts([row("e1")]);
      const batch = vi.fn(async () => {
        throw new Error("network down");
      });

      await drainTestOutSyncQueue(batch);

      // A breadcrumb-carrying report actually reached the reporter's queue.
      const pending = __getPendingQueueForTests();
      expect(pending.length).toBeGreaterThan(0);
      const report = pending.find((r) => r.message.includes("network down"));
      expect(report).toBeTruthy();
      expect(report!.source).toBe("test-out-sync-queue");
      expect(report!.breadcrumbs?.some((b) => b.type === "sync_event")).toBe(true);

      // And the same event is in the plain session log, so "Send
      // diagnostics" carries it even without an error being reported at all.
      const events = getSessionLog();
      expect(events.some((e) => e.type === "sync_event" && e.payload.source === "test-out-queue-drain")).toBe(
        true,
      );
    });
  });
});
