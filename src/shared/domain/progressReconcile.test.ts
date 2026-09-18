/**
 * TestFlight b18 #144 follow-up — build 20 LOCAL→SERVER reconciliation.
 *
 * Build 19 fixed the WRITE path (chunking + duration floor + durable queue),
 * but it only ever holds rows a NEW test-out produces. The founder's phone
 * carries months of completions that a REFUSED test-out wrote to local
 * `mockProgress` and nothing else: his iPad reads 18/660 because the server
 * only ever stored the 18 he actually played. These tests pin the one-shot
 * catch-up that closes that gap without a manual re-run.
 *
 * 2026-09-18 (SYNC2 lane) — rewritten for the bulk-complete queue. The
 * synthesised local-only diff now goes up as ONE `BulkOp` (ids only), not
 * one `BatchAttempt` per lesson — see `docs`/the SYNC2 lane report for why
 * the per-row shape was itself part of the bug that stranded 491 rows on a
 * phone for weeks.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  RECONCILE_MARKER_PREFIX,
  RECONCILE_MAX_AGE_MS,
  hashLessonIds,
  localOnlyLessonIds,
  readReconcileStatus,
  reconcileLocalProgressToServer,
  resetReconcileMemoryForTests,
} from "./progressReconcile";
import {
  enqueueBulkOp,
  getQueuedBulkOps,
  resetBulkQueueForTests,
  type BulkOp,
} from "./testOutSyncQueue";
import { markLessonCompleted, markLessonProgressReset } from "./mockProgress";
import { setPendingAttempts } from "@/features/lesson/engine/lessonStorage";
import { LAST_USER_KEY } from "@/features/settings/storage";
import type { BulkCompleteResponse, BulkCompleteSubmission, LessonRollup } from "@/shared/api/progress";

const USER = "auth0|founder";

/** Server answers every id accepted (the whole-op idempotency cache path
 *  answers the same shape — `lingo-core`'s `submit_bulk_complete`). */
function acceptAll(payload: BulkCompleteSubmission): Promise<BulkCompleteResponse> {
  return Promise.resolve({
    accepted: payload.lessonIds.length,
    alreadyComplete: 0,
    total: payload.lessonIds.length,
  });
}

function seedLocal(ids: string[]): void {
  for (const id of ids) {
    markLessonCompleted(id, { accuracy: 1, xpEarned: 0, isReview: false });
  }
}

/** Rollups as the server returns them for genuinely completed lessons. */
function rollupsFor(ids: string[]): LessonRollup[] {
  const at = "2026-09-15T12:00:00.000Z";
  return ids.map((lessonId) => ({
    lessonId,
    bestScore: 1,
    firstPassedAt: at,
    latestAttemptAt: at,
    attemptCount: 1,
  }));
}

function lessonIds(n: number, prefix = "ja-m1-l"): string[] {
  return Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`);
}

function setLanguage(id: string | null): void {
  if (id === null) {
    localStorage.removeItem("open-lingo-settings");
    return;
  }
  localStorage.setItem(
    "open-lingo-settings",
    JSON.stringify({ learning: { learningLanguageId: id } }),
  );
}

/** A pre-existing queued op, as if enqueued by an earlier pass that
 *  persisted-but-never-confirmed. */
function stuckOp(over: Partial<BulkOp> = {}): BulkOp {
  return {
    clientOpId: "stuck-op",
    lang: "ja",
    source: "test_out",
    lessonIds: [],
    completedAt: "2026-09-15T00:00:00.000Z",
    ...over,
  };
}

describe("progressReconcile — local completions the server never got", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LAST_USER_KEY, USER);
    setLanguage("ja");
    resetBulkQueueForTests();
    resetReconcileMemoryForTests();
  });

  it("(a) queues every local-only id in ONE bulk op and writes the marker", async () => {
    const local = lessonIds(500);
    seedLocal(local);
    const server = local.slice(0, 18);

    const batch = vi.fn(acceptAll);
    const outcome = await reconcileLocalProgressToServer({
      userId: USER,
      serverLessons: rollupsFor(server),
      batch,
    });

    expect(outcome.status).toBe("queued");
    expect(outcome.queued).toBe(482);
    expect(outcome.posted).toBe(482);
    // ONE bulk-complete request, not 5 chunked batch POSTs — the whole
    // point of this lane.
    expect(batch).toHaveBeenCalledTimes(1);
    const sent = batch.mock.calls[0][0] as BulkCompleteSubmission;
    expect(sent.lessonIds).toHaveLength(482);
    expect(sent.source).toBe("test_out");
    expect(sent.lang).toBe("ja");

    // Drained immediately — nothing left waiting for the 30s tick.
    expect(getQueuedBulkOps()).toHaveLength(0);

    const marker = localStorage.getItem(`${RECONCILE_MARKER_PREFIX}${USER}`);
    expect(marker).toBeTruthy();
    const parsed = JSON.parse(marker!) as { at: string; hash: string; count: number };
    expect(parsed.count).toBe(482);
    expect(parsed.hash).toBe(hashLessonIds(local.slice(18)));
    expect(Date.parse(parsed.at)).toBeGreaterThan(0);
  });

  it("(b) a second hydrate with the same sets posts nothing", async () => {
    const local = lessonIds(500);
    seedLocal(local);
    const server = local.slice(0, 18);

    await reconcileLocalProgressToServer({ userId: USER, serverLessons: rollupsFor(server), batch: vi.fn(acceptAll) });

    const batch = vi.fn(acceptAll);
    const second = await reconcileLocalProgressToServer({ userId: USER, serverLessons: rollupsFor(server), batch });
    expect(second.status).toBe("skipped");
    expect(second.reason).toBe("already-reconciled");
    expect(batch).not.toHaveBeenCalled();
  });

  it("(b2) re-runs when the local set grew past what the marker covered", async () => {
    const local = lessonIds(20);
    seedLocal(local);
    await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch: vi.fn(acceptAll) });

    seedLocal(["ja-m2-l1"]);
    const batch = vi.fn(acceptAll);
    const again = await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch });
    expect(again.status).toBe("queued");
    expect(batch).toHaveBeenCalledTimes(1);
  });

  it("(b3) re-runs when the marker is older than 30 days", async () => {
    seedLocal(lessonIds(5));
    await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch: vi.fn(acceptAll) });

    const key = `${RECONCILE_MARKER_PREFIX}${USER}`;
    const marker = JSON.parse(localStorage.getItem(key)!) as { at: string; hash: string; count: number };
    marker.at = new Date(Date.now() - RECONCILE_MAX_AGE_MS - 1000).toISOString();
    localStorage.setItem(key, JSON.stringify(marker));
    resetReconcileMemoryForTests();

    const batch = vi.fn(acceptAll);
    const again = await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch });
    expect(again.status).toBe("queued");
    expect(batch).toHaveBeenCalledTimes(1);
  });

  it("(c) local ⊂ server posts nothing", async () => {
    const server = lessonIds(40);
    seedLocal(server.slice(0, 10));

    const batch = vi.fn(acceptAll);
    const outcome = await reconcileLocalProgressToServer({ userId: USER, serverLessons: rollupsFor(server), batch });
    expect(outcome.status).toBe("skipped");
    expect(outcome.reason).toBe("nothing-local-only");
    expect(batch).not.toHaveBeenCalled();
    expect(localStorage.getItem(`${RECONCILE_MARKER_PREFIX}${USER}`)).toBeNull();
  });

  it("(d) excludes ids already in a queued bulk op or the lesson pending buffer", async () => {
    seedLocal(["ja-m1-l1", "ja-m1-l2", "ja-m1-l3", "ja-m1-l4"]);
    enqueueBulkOp(stuckOp({ clientOpId: "testout-x", lessonIds: ["ja-m1-l2"] }));
    setPendingAttempts([
      {
        clientAttemptId: "pending-x",
        lessonId: "ja-m1-l3",
        attemptedAt: new Date().toISOString(),
        bufferedAt: new Date().toISOString(),
        durationSec: 30,
        passed: true,
        score: 1,
        stepResults: [],
      },
    ]);

    expect(localOnlyLessonIds([])).toEqual(["ja-m1-l1", "ja-m1-l4"]);

    const batch = vi.fn(acceptAll);
    const outcome = await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch });
    expect(outcome.queued).toBe(2);
    // The pre-existing queued op rides along in the same drain (both ops
    // get drained together), but reconciliation itself must not synthesise
    // a duplicate op for ja-m1-l2.
    const sentOps = batch.mock.calls.map((c) => c[0] as BulkCompleteSubmission);
    const reconciledOp = sentOps.find((op) => op.lessonIds.includes("ja-m1-l1"));
    expect(reconciledOp?.lessonIds.sort()).toEqual(["ja-m1-l1", "ja-m1-l4"]);
  });

  // ── 2026-09-18 field failure (Spencer's phone, build 32) ──
  // Sync panel showed "Lessons 491 pending" / "Couldn't upload — tap the
  // cloud to retry" across dozens of app opens; the server access log for
  // that window shows NO large batch and NO 4xx/5xx for that user at all —
  // the POST was never even attempted. Root cause: a prior pass (an older
  // build, or a reconcile that persisted-but-didn't-confirm) already wrote
  // every local-only lesson into the queue. `localOnlyLessonIds` treats a
  // queued lesson as "already covered" so `localOnly` computes to an empty
  // set on every later call — and nothing else in the app independently
  // retries against THIS diff. The queue was durable, but nothing durable
  // ever revisited it.
  it("(f) REGRESSION: drains an op already stuck in the queue even when nothing NEW is local-only", async () => {
    const local = lessonIds(491);
    seedLocal(local);
    // Simulate the stuck state directly: every local-only lesson already
    // sits in a queued (but never confirmed) op from an earlier pass.
    enqueueBulkOp(stuckOp({ clientOpId: "stuck-491", lessonIds: local }));
    expect(getQueuedBulkOps()[0].lessonIds).toHaveLength(491);

    const batch = vi.fn(acceptAll);
    const outcome = await reconcileLocalProgressToServer({
      userId: USER,
      serverLessons: [],
      batch,
    });

    // Must actually attempt the POST — not silently skip. And it's ONE
    // request for all 491, not 491 individual ones.
    expect(batch).toHaveBeenCalledTimes(1);
    expect(outcome.posted).toBe(491);
    expect(getQueuedBulkOps()).toHaveLength(0);
  });

  it("(g) a stuck op that still fails to post stays queued and does not report success", async () => {
    const local = lessonIds(5);
    seedLocal(local);
    enqueueBulkOp(stuckOp({ clientOpId: "stuck-5", lessonIds: local }));

    const batch = vi.fn(() => Promise.reject(new Error("offline")));
    const outcome = await reconcileLocalProgressToServer({
      userId: USER,
      serverLessons: [],
      batch,
    });

    expect(batch).toHaveBeenCalled();
    expect(outcome.posted).toBe(0);
    expect(getQueuedBulkOps()).toHaveLength(1);
    expect(getQueuedBulkOps()[0].lessonIds).toHaveLength(5);
  });

  it("(e) no-ops without an authenticated user", async () => {
    seedLocal(lessonIds(5));
    const batch = vi.fn(acceptAll);
    const outcome = await reconcileLocalProgressToServer({ userId: undefined, serverLessons: [], batch });
    expect(outcome.status).toBe("skipped");
    expect(outcome.reason).toBe("no-user");
    expect(batch).not.toHaveBeenCalled();
  });

  it("(e2) no-ops while the learning language is unresolved, and leaves no marker", async () => {
    seedLocal(lessonIds(5));
    setLanguage(null);
    const batch = vi.fn(acceptAll);
    const outcome = await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch });
    expect(outcome.reason).toBe("language-unresolved");
    expect(batch).not.toHaveBeenCalled();
    // No marker — the next hydrate (after the settings merge) must retry.
    expect(localStorage.getItem(`${RECONCILE_MARKER_PREFIX}${USER}`)).toBeNull();
  });

  it("(e3) no-ops while a Start-over reset is pending, so it can't resurrect deleted progress", async () => {
    seedLocal(lessonIds(5));
    markLessonProgressReset();
    const batch = vi.fn(acceptAll);
    const outcome = await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch });
    expect(outcome.reason).toBe("reset-pending");
    expect(batch).not.toHaveBeenCalled();
  });

  it("never deletes local completions the server lacks", async () => {
    const local = lessonIds(30);
    seedLocal(local);
    const { getMockCompletedLessonIds } = await import("./mockProgress");
    await reconcileLocalProgressToServer({
      userId: USER,
      serverLessons: [],
      // Server refuses everything (0 accepted, 0 alreadyComplete) — local
      // must be untouched.
      batch: vi.fn(async (payload: BulkCompleteSubmission) => ({
        accepted: 0,
        alreadyComplete: 0,
        total: payload.lessonIds.length,
      })),
    });
    expect(getMockCompletedLessonIds().sort()).toEqual([...local].sort());
    // A fully-refused op stays queued whole for the next drain.
    expect(getQueuedBulkOps()).toHaveLength(1);
    expect(getQueuedBulkOps()[0].lessonIds).toHaveLength(30);
  });

  it("REGRESSION: a server rollup with firstPassedAt null is NOT 'the server has it'", async () => {
    // Draft/mid-lesson syncs create rollups with `firstPassedAt: null`
    // (`mockProgress.rollupToCompletion` refuses them as completions for
    // exactly this reason). Subtracting them from the local set made every
    // lesson the user had ever OPENED invisible to reconciliation.
    seedLocal(["ja-m1-l1", "ja-m1-l2"]);
    const at = "2026-09-15T12:00:00.000Z";
    const serverLessons: LessonRollup[] = [
      { lessonId: "ja-m1-l1", firstPassedAt: null, latestAttemptAt: at, bestScore: 0.3, attemptCount: 1 },
      { lessonId: "ja-m1-l2", firstPassedAt: at, latestAttemptAt: at, bestScore: 1, attemptCount: 1 },
    ];
    const batch = vi.fn(acceptAll);
    const outcome = await reconcileLocalProgressToServer({ userId: USER, serverLessons, batch });
    expect(outcome.queued).toBe(1);
    const sent = batch.mock.calls[0][0] as BulkCompleteSubmission;
    expect(sent.lessonIds).toEqual(["ja-m1-l1"]);
  });

  it("REGRESSION: a refused localStorage write must NOT leave a marker behind", async () => {
    // If the quota refuses the durable write, the fallback POSTs directly
    // rather than dropping the sync — and the old code had already written
    // the marker unconditionally, so every later launch skipped as
    // 'already-reconciled' and the rows were stranded forever.
    seedLocal(lessonIds(30));
    const setItem = localStorage.setItem.bind(localStorage);
    const spy = vi.spyOn(window.localStorage, "setItem").mockImplementation((k: string, v: string) => {
      if (k.startsWith("open-lingo-testout-bulk-queue")) throw new Error("QuotaExceededError");
      setItem(k, v);
    });
    try {
      const batch = vi.fn(acceptAll);
      const outcome = await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch });
      // Falls back to POSTing directly rather than dropping the sync.
      expect(batch).toHaveBeenCalled();
      expect(outcome.posted).toBe(30);
    } finally {
      spy.mockRestore();
    }
  });

  it("REGRESSION: nothing persisted and nothing posted leaves no marker", async () => {
    seedLocal(lessonIds(30));
    const setItem = localStorage.setItem.bind(localStorage);
    const spy = vi.spyOn(window.localStorage, "setItem").mockImplementation((k: string, v: string) => {
      if (k.startsWith("open-lingo-testout-bulk-queue")) throw new Error("QuotaExceededError");
      setItem(k, v);
    });
    try {
      await reconcileLocalProgressToServer({
        userId: USER,
        serverLessons: [],
        batch: vi.fn(() => Promise.reject(new Error("offline"))),
      });
    } finally {
      spy.mockRestore();
    }
    // Nothing landed anywhere — the next launch MUST try again.
    expect(localStorage.getItem(`${RECONCILE_MARKER_PREFIX}${USER}`)).toBeNull();
  });

  it("records a readable status for the SyncManager, including the skip reason", async () => {
    seedLocal(lessonIds(3));
    setLanguage(null);
    await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch: vi.fn(acceptAll) });
    expect(readReconcileStatus(USER)?.reason).toBe("language-unresolved");

    setLanguage("ja");
    resetReconcileMemoryForTests();
    await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch: vi.fn(acceptAll) });
    const status = readReconcileStatus(USER);
    expect(status?.status).toBe("queued");
    expect(status?.queued).toBe(3);
    expect(status?.confirmed).toBe(3);
    expect(Date.parse(status!.at)).toBeGreaterThan(0);
  });

  it("force:true reconciles again despite a matching marker", async () => {
    seedLocal(lessonIds(4));
    await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch: vi.fn(acceptAll) });
    resetReconcileMemoryForTests();

    const batch = vi.fn(acceptAll);
    const forced = await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch, force: true });
    expect(forced.status).toBe("queued");
    expect(batch).toHaveBeenCalledTimes(1);
  });

  it("carries the resolved learning language onto the bulk op", async () => {
    markLessonCompleted("ja-m1-l1", { accuracy: 0.8, xpEarned: 10, isReview: false });
    const batch = vi.fn(acceptAll);
    await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch });
    const sent = batch.mock.calls[0][0] as BulkCompleteSubmission;
    expect(sent.lang).toBe("ja");
    expect(sent.lessonIds).toEqual(["ja-m1-l1"]);
    expect(sent.source).toBe("test_out");
  });
});
