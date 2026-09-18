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
  drainBulkQueue,
  drainTestOutSyncQueue,
  enqueueBulkOp,
  enqueueTestOutAttempts,
  getQueuedBulkOps,
  getQueuedTestOutAttempts,
  getTestOutQueueCount,
  getTestOutQueueDiagnostics,
  migrateLegacyQueueToBulk,
  postAttemptChunks,
  resetBulkQueueForTests,
  resetTestOutQueueDiagnosticsForTests,
  toServerLegalAttempt,
  type BulkOp,
} from "./testOutSyncQueue";
import type { BulkCompleteResponse } from "@/shared/api/progress";
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
    resetBulkQueueForTests();
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

  // ── Bulk-complete queue (2026-09-18) ──────────────────────────────────
  // The 491-row phone scenario is now ONE op, not 491 rows — these pin the
  // op-shaped queue, legacy-row migration/collapse, and the drain contract.
  describe("bulk-complete queue", () => {
    function bulkOp(over: Partial<BulkOp> = {}): BulkOp {
      return {
        clientOpId: "op-1",
        lang: "ja",
        source: "test_out",
        lessonIds: ["ja-m1-l1", "ja-m1-l2"],
        completedAt: "2026-09-18T00:00:00.000Z",
        ...over,
      };
    }

    function acceptAllBulk(op: { lessonIds: string[] }): Promise<BulkCompleteResponse> {
      return Promise.resolve({ accepted: op.lessonIds.length, alreadyComplete: 0, total: op.lessonIds.length });
    }

    it("enqueues, drains, and clears a fully-accepted op", async () => {
      enqueueBulkOp(bulkOp());
      expect(getQueuedBulkOps()).toHaveLength(1);

      const outcome = await drainBulkQueue(acceptAllBulk);
      expect(outcome).toEqual({ accepted: 2, alreadyComplete: 0 });
      expect(getQueuedBulkOps()).toHaveLength(0);
      expect(getTestOutQueueCount()).toBe(0);
    });

    it("de-dupes a re-enqueue of the same clientOpId instead of stacking", () => {
      enqueueBulkOp(bulkOp());
      enqueueBulkOp(bulkOp({ lessonIds: ["ja-m1-l1", "ja-m1-l2", "ja-m1-l3"] }));
      expect(getQueuedBulkOps()).toHaveLength(1);
      expect(getQueuedBulkOps()[0].lessonIds).toHaveLength(3);
    });

    it("a partially-accepted op stays queued whole, not removed", async () => {
      enqueueBulkOp(bulkOp({ lessonIds: ["ja-m1-l1", "ja-m1-l2", "ja-m1-l3"] }));
      const partial = vi.fn(async (op: { lessonIds: string[] }) => ({
        accepted: 2,
        alreadyComplete: 0,
        total: op.lessonIds.length,
      }));
      const outcome = await drainBulkQueue(partial);
      expect(outcome).toEqual({ accepted: 0, alreadyComplete: 0 });
      expect(getQueuedBulkOps()).toHaveLength(1);
      expect(getTestOutQueueCount()).toBe(3);
    });

    it("a transport failure leaves the op queued and reports through errorReporter", async () => {
      enqueueBulkOp(bulkOp());
      const failing = vi.fn(async () => {
        throw new Error("network down");
      });
      const outcome = await drainBulkQueue(failing);
      expect(outcome).toEqual({ accepted: 0, alreadyComplete: 0 });
      expect(getQueuedBulkOps()).toHaveLength(1);
      const pending = __getPendingQueueForTests();
      expect(pending.some((r) => r.message.includes("network down") && r.source === "test-out-bulk-queue")).toBe(
        true,
      );
    });

    it("is a no-op with no queued ops (no call at all)", async () => {
      const batch = vi.fn(acceptAllBulk);
      const outcome = await drainBulkQueue(batch);
      expect(outcome).toEqual({ accepted: 0, alreadyComplete: 0 });
      expect(batch).not.toHaveBeenCalled();
    });

    it("migrateLegacyQueueToBulk collapses old per-row entries into one op per language", () => {
      enqueueTestOutAttempts([row("a"), row("b"), row("c")]); // row() uses lesson-<id> — no lang prefix
      const result = migrateLegacyQueueToBulk();
      expect(result).toEqual({ migratedOps: 1, rowCount: 3 });
      expect(getQueuedTestOutAttempts()).toHaveLength(0); // legacy queue cleared
      const ops = getQueuedBulkOps();
      expect(ops).toHaveLength(1);
      expect(ops[0].lessonIds.sort()).toEqual(["lesson-a", "lesson-b", "lesson-c"].sort());
      const events = getSessionLog().filter((e) => e.payload.source === "legacy-queue-migrated");
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({ rowsRepaired: 3, lessonCount: 3 });
    });

    it("migrateLegacyQueueToBulk groups by the lesson id's language prefix", () => {
      enqueueTestOutAttempts([
        row("a", { lessonId: "ja-m1-l1" }),
        row("b", { lessonId: "ja-m1-l2" }),
        row("c", { lessonId: "ko-m1-l1" }),
      ]);
      const result = migrateLegacyQueueToBulk();
      expect(result.migratedOps).toBe(2);
      const ops = getQueuedBulkOps();
      const langs = ops.map((o) => o.lang).sort();
      expect(langs).toEqual(["ja", "ko"]);
      expect(ops.find((o) => o.lang === "ja")?.lessonIds.sort()).toEqual(["ja-m1-l1", "ja-m1-l2"]);
      expect(ops.find((o) => o.lang === "ko")?.lessonIds).toEqual(["ko-m1-l1"]);
    });

    it("migrateLegacyQueueToBulk is a no-op on an empty legacy queue", () => {
      expect(migrateLegacyQueueToBulk()).toEqual({ migratedOps: 0, rowCount: 0 });
      expect(getQueuedBulkOps()).toHaveLength(0);
    });

    // The exact bug this whole lane exists to fix: 491 old per-row entries,
    // stuck, now drain as ONE request.
    it("drainBulkQueue migrates 491 legacy rows and drains them as ONE bulk op", async () => {
      enqueueTestOutAttempts(
        Array.from({ length: 491 }, (_, i) => row(`legacy-${i}`, { lessonId: `ja-m1-l${i}` })),
      );
      expect(getTestOutQueueCount()).toBe(491);

      const batch = vi.fn(acceptAllBulk);
      const outcome = await drainBulkQueue(batch);

      expect(batch).toHaveBeenCalledTimes(1); // ONE request, not 491 and not 5 chunks
      expect(outcome).toEqual({ accepted: 491, alreadyComplete: 0 });
      expect(getTestOutQueueCount()).toBe(0);
    });
  });
});
