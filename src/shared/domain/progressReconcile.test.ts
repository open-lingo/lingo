/**
 * TestFlight b18 #144 follow-up — build 20 LOCAL→SERVER reconciliation.
 *
 * Build 19 fixed the WRITE path (chunking + duration floor + durable queue),
 * but it only ever holds rows a NEW test-out produces. The founder's phone
 * carries months of completions that a REFUSED test-out wrote to local
 * `mockProgress` and nothing else: his iPad reads 18/660 because the server
 * only ever stored the 18 he actually played. These tests pin the one-shot
 * catch-up that closes that gap without a manual re-run.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  RECONCILE_MARKER_PREFIX,
  RECONCILE_MAX_AGE_MS,
  hashLessonIds,
  localOnlyLessonIds,
  readReconcileStatus,
  reconcileAttemptId,
  reconcileLocalProgressToServer,
  resetReconcileMemoryForTests,
} from "./progressReconcile";
import {
  clearTestOutSyncQueue,
  enqueueTestOutAttempts,
  getQueuedTestOutAttempts,
} from "./testOutSyncQueue";
import { markLessonCompleted, markLessonProgressReset } from "./mockProgress";
import { setPendingAttempts } from "@/features/lesson/engine/lessonStorage";
import { LAST_USER_KEY } from "@/features/settings/storage";
import type { BatchAttempt, BatchAttemptSubmission, LessonRollup } from "@/shared/api/progress";

const USER = "auth0|founder";

/** Server answers every row accepted (the `attempt_exists` idempotent path
 *  answers the same shape — `lingo-core/app/progress/router.py:320`). */
function acceptAll(payload: BatchAttemptSubmission) {
  return Promise.resolve({
    results: payload.attempts.map((a) => ({
      clientAttemptId: a.clientAttemptId,
      attemptId: `srv-${a.clientAttemptId}`,
      accepted: true,
      xpEarned: 0,
      streakAfter: 0,
      lingotsEarned: 0,
      dailyTotalLessons: 0,
    })),
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

describe("progressReconcile — local completions the server never got", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LAST_USER_KEY, USER);
    setLanguage("ja");
    clearTestOutSyncQueue();
    resetReconcileMemoryForTests();
  });

  it("(a) queues every local-only id, posts it in ≤100-row chunks, writes the marker", async () => {
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
    // 482 rows / 100 per POST (`schemas.py:100`) = 5 chunks.
    expect(batch).toHaveBeenCalledTimes(5);
    for (const call of batch.mock.calls) {
      expect(call[0].attempts.length).toBeLessThanOrEqual(100);
      for (const a of call[0].attempts as BatchAttempt[]) {
        // Currency gate: the server zeroes XP + lingots for isTestOut rows.
        expect(a.isTestOut).toBe(true);
        expect(a.passed).toBe(true);
        expect(a.durationSec).toBeGreaterThanOrEqual(5);
      }
    }
    // Deterministic per user+lesson so a repeat is idempotent server-side.
    const posted = batch.mock.calls.flatMap((c) => c[0].attempts as BatchAttempt[]);
    expect(posted.find((a) => a.lessonId === "ja-m1-l19")?.clientAttemptId).toBe(
      reconcileAttemptId(USER, "ja-m1-l19"),
    );
    // Drained immediately — nothing left waiting for the 30s tick.
    expect(getQueuedTestOutAttempts()).toHaveLength(0);

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

  it("(d) excludes ids already in the test-out queue or the lesson pending buffer", async () => {
    seedLocal(["ja-m1-l1", "ja-m1-l2", "ja-m1-l3", "ja-m1-l4"]);
    enqueueTestOutAttempts([
      {
        clientAttemptId: "testout-x",
        lessonId: "ja-m1-l2",
        attemptedAt: new Date().toISOString(),
        durationSec: 5,
        passed: true,
        score: 1,
        stepResults: [],
        isTestOut: true,
      },
    ]);
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
    const posted = batch.mock.calls.flatMap((c) => c[0].attempts as BatchAttempt[]);
    // The pre-existing test-out row rides along in the same drain, but the
    // reconciliation itself must not synthesise a second row for that lesson.
    const reconciled = posted.filter((a) => a.clientAttemptId.startsWith("reconcile-"));
    expect(reconciled.map((a) => a.lessonId).sort()).toEqual(["ja-m1-l1", "ja-m1-l4"]);
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
      // Server refuses everything — local must be untouched.
      batch: vi.fn(async () => ({ results: [] })),
    });
    expect(getMockCompletedLessonIds().sort()).toEqual([...local].sort());
    // Rejected rows stay queued for the next drain.
    expect(getQueuedTestOutAttempts()).toHaveLength(30);
  });

  // ── b20 field failure (2026-09-15, founder's phone, commit 2f56da91) ──
  // b20 shipped, the phone made 33 GET /progress/me and six tick-sized batch
  // POSTs, and not one 100-row chunk. Since a queued row would have shown in
  // the dirty count AND been drained by the next 30s tick, nothing ever
  // reached the queue. Three ways that happens, all of them defects here.

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
    const posted = batch.mock.calls.flatMap((c) => c[0].attempts as BatchAttempt[]);
    expect(posted.map((a) => a.lessonId)).toEqual(["ja-m1-l1"]);
  });

  it("REGRESSION: a refused localStorage write must NOT leave a marker behind", async () => {
    // 482 synthesised rows is ~90 KB. If the quota refuses them the queue
    // stays empty, the drain finds nothing — and the old code had already
    // written the marker, so every later launch skipped as
    // 'already-reconciled' and the rows were stranded forever.
    seedLocal(lessonIds(30));
    const setItem = localStorage.setItem.bind(localStorage);
    const spy = vi.spyOn(window.localStorage, "setItem").mockImplementation((k: string, v: string) => {
      if (k.startsWith("open-lingo-testout-sync-queue")) throw new Error("QuotaExceededError");
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
      if (k.startsWith("open-lingo-testout-sync-queue")) throw new Error("QuotaExceededError");
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

  it("carries the local first-completion timestamp so server history stays honest", async () => {
    markLessonCompleted("ja-m1-l1", { accuracy: 0.8, xpEarned: 10, isReview: false });
    const batch = vi.fn(acceptAll);
    await reconcileLocalProgressToServer({ userId: USER, serverLessons: [], batch });
    const row = (batch.mock.calls[0][0].attempts as BatchAttempt[])[0];
    const local = JSON.parse(localStorage.getItem(`open-lingo-lesson-progress:${USER}`)!) as {
      completed: Record<string, { firstCompletedAt: string }>;
    };
    expect(row.attemptedAt).toBe(local.completed["ja-m1-l1"].firstCompletedAt);
    expect(row.score).toBeCloseTo(0.8);
  });
});
