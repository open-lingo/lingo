/**
 * Two-device sync proof, runnable locally with NO AWS (Spencer's ask,
 * 2026-09-18). Spins up a real lingo-core on SQLite (`DB_BACKEND=sqlite`,
 * a fresh temp DB) and drives the REAL client sync modules — ProgressApi,
 * progressReconcile, progressSync — against it, simulating two devices on
 * the same account by snapshotting/restoring localStorage between phases
 * (this process only has one `localStorage`; two real devices would each
 * have their own, but the thing under test is the SERVER round-trip, not
 * localStorage persistence).
 *
 * Identity: lingo-core's DEBUG-mode dev auth resolves the user from the
 * `X-Dev-User` header OR the `DEV_USER` env var
 * (lingo-core/app/auth/dependencies.py `_dev_user_from_request`) — no JWT
 * needed. This test sets `DEV_USER` on the spawned server process, so every
 * request from either "device" (no header sent) resolves to the SAME
 * account with zero client-side changes — no new dev-auth seam was added to
 * the app to make this test possible.
 *
 * SKIPPED BY DEFAULT — this spawns a real Python process and takes several
 * seconds, which would slow every `npm run test` / preflight run for no
 * reason once this is in main. Run explicitly:
 *
 *   RUN_SYNC_PROOF=1 npx vitest run src/shared/domain/syncTwoDevices.local.test.ts
 *
 * Requires `lingo-core/.venv` to exist (`cd ../lingo-core && make install`).
 * Override the lingo-core path with LINGO_CORE_DIR, the port with
 * SYNC_PROOF_PORT (default 8971) if either default doesn't fit the machine.
 *
 * MUST fail on the pre-fix code (progress.ts without the batch-queue
 * serialization from this lane's commit a47eb706) with a real, uncaught
 * `AbortError` — see the lane report for both a passing and a failing run's
 * output, plus the debug trace that pinned this down. Restore the pre-fix
 * file to check for yourself:
 *   git show HEAD~1:src/shared/api/progress.ts > /tmp/p.ts && cp /tmp/p.ts src/shared/api/progress.ts
 *   RUN_SYNC_PROOF=1 npx vitest run src/shared/domain/syncTwoDevices.local.test.ts
 *   git checkout -- src/shared/api/progress.ts
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// happy-dom's `fetch` polyfill enforces Same-Origin/CORS against a fake page
// origin, which blocks a plain cross-origin call to the local lingo-core
// server we spawn below. Swap in undici's real fetch for JUST this suite
// (restored in afterAll) — this is a test-environment workaround, not an app
// behavior change.
import { fetch as undiciFetch } from "undici";

import { ProgressApi } from "@/shared/api/progress";
import { LAST_USER_KEY } from "@/features/settings/storage";
import { markLessonCompleted, getMockCompletedLessonIds, getLessonCompletion } from "@/shared/domain/mockProgress";
import {
  reconcileLocalProgressToServer,
  resetReconcileMemoryForTests,
} from "@/shared/domain/progressReconcile";
import {
  syncLessonProgressWithServer,
  hydrateLessonProgressFromServer,
  resetLessonSyncCoalescerForTests,
} from "@/features/lesson/engine/progressSync";
import {
  enqueueBulkOp,
  getQueuedBulkOps,
  resetBulkQueueForTests,
} from "@/shared/domain/testOutSyncQueue";
import { appendPendingAttempt } from "@/features/lesson/engine/lessonStorage";
import { getLessonDirtyCount } from "@/features/lesson/engine/lessonSync";
import { SrsApi } from "@/shared/api/srs";
import {
  setCardState,
  getSRSStore,
  clearSRSStore,
} from "@/features/flashcards/engine/srsStorage";
import {
  buildFullSyncPayload,
  mergeServerState,
  markSynced,
} from "@/features/flashcards/engine/srsSync";
import { isDue } from "@/features/flashcards/engine/srs";
import type { SRSCardState } from "@/features/flashcards/data/types";

const RUN = process.env.RUN_SYNC_PROOF === "1";
const CORE_DIR = process.env.LINGO_CORE_DIR ?? "/Users/lichfield/Documents/projects/lingle/lingo-core";
const PORT = Number(process.env.SYNC_PROOF_PORT ?? 8971);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const USER_SUB = "sync-proof|two-device";
const SETTINGS_KEY = "open-lingo-settings";

async function waitForHealth(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`lingo-core never answered ${url}: ${String(lastErr)}`);
}

function snapshotStorage(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) out[k] = localStorage.getItem(k) ?? "";
  }
  return out;
}

function restoreStorage(snap: Record<string, string>): void {
  localStorage.clear();
  for (const [k, v] of Object.entries(snap)) localStorage.setItem(k, v);
}

function resetLocalDevice(): void {
  localStorage.clear();
  localStorage.setItem(LAST_USER_KEY, USER_SUB);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ learning: { learningLanguageId: "ja" } }));
  resetBulkQueueForTests();
  resetReconcileMemoryForTests();
  resetLessonSyncCoalescerForTests();
}

function freshApi(): ProgressApi {
  return new ProgressApi({
    baseUrl: BASE_URL,
    getAccessToken: () => Promise.resolve("unused-in-DEBUG-dev-auth"),
    maxRetries: 0,
  });
}

function freshSrsApi(): SrsApi {
  return new SrsApi({
    baseUrl: BASE_URL,
    getAccessToken: () => Promise.resolve("unused-in-DEBUG-dev-auth"),
    maxRetries: 0,
  });
}

/** A fully-formed SRS card with a due date far in the past — old enough
 *  that `isDue`'s date check alone would call it due; `known` (or not) is
 *  the only thing that can still suppress it. */
function pastCard(known: boolean): SRSCardState {
  const sub = {
    stability: 120,
    difficulty: 5,
    state: "review" as const,
    interval: 120,
    dueDate: "2020-01-01",
    lastReviewDate: "2020-01-01",
    reps: 1,
    lapses: 0,
  };
  return {
    recognition: { ...sub },
    production: { ...sub },
    known,
    lastReviewedAt: "2020-01-01T00:00:00.000Z",
  };
}

function dueCount(): number {
  return Object.values(getSRSStore()).filter((c) => isDue(c)).length;
}

async function serverCompletedLessonCount(api: ProgressApi): Promise<number> {
  const summary = await api.getMe(undefined, { force: true });
  return (summary?.lessons ?? []).filter((l) => Boolean(l.firstPassedAt)).length;
}

describe.skipIf(!RUN)("two-device sync proof — local lingo-core, no AWS", () => {
  let server: ChildProcessWithoutNullStreams;
  let dbDir: string;
  let serverLog = "";
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    globalThis.fetch = undiciFetch as unknown as typeof fetch;
    dbDir = mkdtempSync(join(tmpdir(), "sync-proof-"));
    const dbPath = join(dbDir, "proof.db");

    server = spawn(
      join(CORE_DIR, ".venv/bin/uvicorn"),
      ["app.main:app", "--port", String(PORT)],
      {
        cwd: CORE_DIR,
        env: {
          ...process.env,
          DB_BACKEND: "sqlite",
          SQLITE_PATH: dbPath,
          DEBUG: "true",
          DEV_USER: USER_SUB,
          AWS_ACCESS_KEY_ID: "",
          AWS_SECRET_ACCESS_KEY: "",
          AWS_SESSION_TOKEN: "",
          AWS_PROFILE: "",
        },
      },
    );
    server.stdout.on("data", (d) => { serverLog += String(d); });
    server.stderr.on("data", (d) => { serverLog += String(d); });

    await waitForHealth(`${BASE_URL}/health`, 20_000);

    const reg = await fetch(`${BASE_URL}/api/core/v1/users/me`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "sync_proof_user", display_name: "Sync Proof" }),
    });
    if (!reg.ok && reg.status !== 409) {
      throw new Error(`user registration failed: ${reg.status} ${await reg.text()}`);
    }
  }, 30_000);

  afterAll(() => {
    globalThis.fetch = originalFetch;
    server?.kill();
    try {
      rmSync(dbDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
    if (process.env.SYNC_PROOF_VERBOSE === "1") {
      // eslint-disable-next-line no-console
      console.log("[lingo-core log]\n" + serverLog);
    }
  });

  it(
    "device A's test-out seed reaches the server under real boot-time concurrency; " +
      "device B (fresh, same account) pulls it; a new lesson on B reaches A on resume",
    async () => {
      const N_TESTOUT = 150; // > MAX_ATTEMPTS_PER_BATCH (100) — exercises chunking too
      const N = N_TESTOUT + 1; // + one REAL lesson attempt, pushed via the other caller
      const apiA = freshApi();

      // ── Device A ────────────────────────────────────────────────────────
      resetLocalDevice();
      const testOutIds = Array.from({ length: N_TESTOUT }, (_, i) => `ja-m1-l${i + 1}`);
      for (const id of testOutIds) {
        markLessonCompleted(id, { accuracy: 1, xpEarned: 0, isReview: false });
      }
      // Captured for the `firstCompletedAt` preservation check at resume —
      // the bulk op's single `completedAt` refreshes `lastCompletedAt` on
      // merge (see the comment there) but must NOT overwrite this.
      const originalFirstCompletedAt = getLessonCompletion(testOutIds[0])?.firstCompletedAt;
      expect(originalFirstCompletedAt).toBeTruthy();
      // A REAL lesson, finished normally at the same moment — buffered through
      // the ordinary pending-attempt path (`performLessonSync`'s source),
      // deliberately DISJOINT from the test-out queue's rows. This is the
      // non-self-healing shape of the bug: the test-out queue drain and a
      // real lesson push both read/build DIFFERENT payloads, so if the tag
      // race kills one caller's request entirely, there is no third path
      // that independently re-discovers and resends ITS rows the way two
      // drains of the SAME queue would.
      markLessonCompleted("ja-genki-l1", { accuracy: 1, xpEarned: 10, isReview: false });
      appendPendingAttempt({
        clientAttemptId: "real-lesson-genki-l1",
        lessonId: "ja-genki-l1",
        attemptedAt: new Date().toISOString(),
        durationSec: 90,
        passed: true,
        score: 1,
        stepResults: [],
        bufferedAt: new Date().toISOString(),
      });
      expect(getMockCompletedLessonIds()).toHaveLength(N);

      // Fire the two real, uncoordinated boot-time callers CONCURRENTLY —
      // exactly what LessonProgressHydrate does (its own push effect AND
      // useProgressReconcile's effect both gate on isProgressReady and fire
      // together). Both share ProgressApi's "progress:batch" tag.
      //
      // Warm the connection first (a throwaway GET) so the race isn't won or
      // lost by whichever side happens to pay the one-time TCP-connect cost —
      // that made the very first request of the run an outlier in early
      // iterations of this test and masked the effect behind a cold-start
      // artifact.
      await apiA.getMe(undefined, { force: true });

      // PRE-FIX this reliably throws: `performLessonSync`'s single-row POST
      // (for the real lesson above) gets aborted by `reconcileLocalProgress
      // ToServer`'s own POST starting a moment later on the same tag — a
      // genuine `AbortError` out of `ApiClient._request`
      // (`this._inflight.get(tag)?.abort()`), propagated up through
      // Promise.all uncaught. Verified 5/5 runs failing pre-fix, 5/5 passing
      // post-fix (report has both runs' output). POST-FIX, ProgressApi.
      // batchAttempts serializes through its own chain, so the two calls
      // queue instead of racing and this resolves cleanly every time.
      const [lessonSyncOutcome, reconcileOutcome] = await Promise.all([
        syncLessonProgressWithServer({
          batch: (p) => apiA.batchAttempts(p),
          bulkComplete: (p) => apiA.bulkComplete(p),
          getMe: () => apiA.getMe(undefined, { force: true }),
        }),
        reconcileLocalProgressToServer({
          userId: USER_SUB,
          serverLessons: [],
          batch: (p) => apiA.bulkComplete(p),
        }),
      ]);
      expect(reconcileOutcome.status).toBe("queued");
      void lessonSyncOutcome;

      // Second guard, in case a future change makes the abort non-throwing
      // (e.g. caught and swallowed somewhere upstream): the pass must still
      // have delivered everything in ONE shot — nothing left dirty for
      // LessonProgressHydrate's next tick to pick up.
      expect(getLessonDirtyCount()).toBe(0);

      const serverCountAfterA = await serverCompletedLessonCount(apiA);
      expect(serverCountAfterA).toBe(N);

      const deviceASnapshot = snapshotStorage();

      // ── Device B: fresh local state, same account ─────────────────────
      resetLocalDevice();
      const apiB = freshApi();
      const pulled = await hydrateLessonProgressFromServer(() =>
        apiB.getMe(undefined, { force: true }),
      );
      expect(pulled).toBe(N);
      expect(getMockCompletedLessonIds()).toHaveLength(N);

      // One more lesson, done on B.
      markLessonCompleted("ja-m2-l1", { accuracy: 1, xpEarned: 10, isReview: false });
      const bSummary = await apiB.getMe(undefined, { force: true });
      const bReconcile = await reconcileLocalProgressToServer({
        userId: USER_SUB,
        serverLessons: bSummary?.lessons ?? [],
        batch: (p) => apiB.bulkComplete(p),
      });
      expect(bReconcile.posted).toBeGreaterThan(0);

      const serverCountAfterB = await serverCompletedLessonCount(apiB);
      expect(serverCountAfterB).toBe(N + 1);

      // ── Device A resumes: its OWN local cache restored, then a pull ───
      restoreStorage(deviceASnapshot);
      expect(getMockCompletedLessonIds()).toHaveLength(N); // A's own view, untouched
      const apiAResume = freshApi();
      const pulledOnResume = await hydrateLessonProgressFromServer(() =>
        apiAResume.getMe(undefined, { force: true }),
      );
      // 2026-09-18 (bulk-complete redesign): `pulledOnResume` is
      // `mergeServerLessonRollups`'s "changed" counter, which fires on ANY
      // field delta, not just "was previously absent" — and the bulk op
      // stamps ONE `completedAt` for the whole 150-lesson batch (the schema
      // is ids-only, no per-lesson timestamp), so A's first pull after its
      // own bulk-reconcile re-touches `lastCompletedAt` for those 150 rows
      // too, not just B's genuinely new one. This is not data loss —
      // `mergeCompletion` explicitly preserves `local.firstCompletedAt`
      // through that refresh (checked below via the exact final set, which
      // is the assertion that actually matters) — but it means this
      // counter is no longer a precise "count of true novelties" the way
      // it was when reconcile echoed each lesson's own real timestamp back
      // per-row. See `progressReconcile.test.ts` for that trade-off's own
      // regression coverage.
      expect(pulledOnResume).toBeGreaterThan(0);
      expect(getMockCompletedLessonIds()).toHaveLength(N + 1);
      expect(getMockCompletedLessonIds()).toContain("ja-m2-l1");
      // Not data loss: the original local completion moment survives the
      // bulk-reconcile round trip even though `lastCompletedAt` refreshed.
      expect(getLessonCompletion(testOutIds[0])?.firstCompletedAt).toBe(originalFirstCompletedAt);
    },
    60_000,
  );

  // ── 2026-09-18 field failure (Spencer's phone, build 32) ──
  // "Lessons 491 pending" / "Couldn't upload — tap the cloud to retry" for
  // days, across dozens of app opens. The server access log for that window
  // shows NO large batch and NO 4xx/5xx at all — the request was never even
  // attempted. This reproduces the exact stuck state directly (a queue
  // that's already durably persisted from an earlier session/build that
  // never got a confirmed POST through) and proves the fix drains it
  // against a REAL server, not a mock.
  it(
    "a queue already stuck from an earlier session (persisted, never confirmed) " +
      "still reaches the server on the next boot's reconcile pass",
    async () => {
      const N = 491;
      resetLocalDevice();
      const api = freshApi();
      // Distinct prefix from the earlier test's ids — this test shares the
      // one spawned server/account across the whole describe block, and the
      // assertion below is on an absolute server count.
      const ids = Array.from({ length: N }, (_, i) => `ja-stuck-l${i + 1}`);
      for (const id of ids) {
        markLessonCompleted(id, { accuracy: 1, xpEarned: 0, isReview: false });
      }
      // Simulate the stuck state: every local-only lesson already sits in a
      // queued bulk op from an earlier pass that persisted-but-never-
      // confirmed (a killed app, a dropped connection mid-drain, an older
      // build). `localOnlyLessonIds` treats a queued lesson as "covered",
      // so this is exactly the state that made every later reconcile
      // compute an empty diff and skip silently — no request, no error,
      // nothing queued anew.
      enqueueBulkOp({
        clientOpId: `stuck-${USER_SUB}-${Date.now()}`,
        lang: "ja",
        source: "test_out",
        lessonIds: ids,
        completedAt: new Date().toISOString(),
      });
      expect(getQueuedBulkOps()[0].lessonIds).toHaveLength(N);
      const serverCountBefore = await serverCompletedLessonCount(api);

      const outcome = await reconcileLocalProgressToServer({
        userId: USER_SUB,
        serverLessons: [],
        batch: (p) => api.bulkComplete(p),
      });

      expect(outcome.posted).toBe(N);
      expect(getQueuedBulkOps()).toHaveLength(0);
      const serverCountAfter = await serverCompletedLessonCount(api);
      expect(serverCountAfter - serverCountBefore).toBe(N);
      const summary = await api.getMe(undefined, { force: true });
      const serverIds = new Set(
        (summary?.lessons ?? []).filter((l) => Boolean(l.firstPassedAt)).map((l) => l.lessonId),
      );
      expect(ids.every((id) => serverIds.has(id))).toBe(true);
    },
    30_000,
  );

  // Lane SRSGAPS GAP A (2026-09-18): `known` had no field on the server's
  // SRSCardState schema, so it was accepted-and-silently-dropped on every
  // push. A fresh device's pull always came back with `known` missing —
  // NOT suppressed — reproducing the phone-vs-second-device due-count
  // mismatch on record (handoff-2026-09-18-resume.md §6). This proves the
  // fix against the REAL spawned lingo-core (requires LINGO_CORE_DIR to
  // point at a checkout carrying the server-side fix — see the lane
  // report), not a mock: device A seeds a known card + a plain due card,
  // full-pushes, device B (fresh) pulls, and both devices must agree on
  // the due count.
  it(
    "device B's due count equals device A's after a test-out seed + full push + pull (GAP A)",
    async () => {
      resetLocalDevice();
      clearSRSStore();
      const apiA = freshSrsApi();

      // A card a test-out seed marked known (dueDate is decades past —
      // only `known` suppresses it) + a plain due card (control: proves
      // this test isn't vacuously "everything's 0").
      setCardState("ja:gap-known-1", pastCard(true));
      setCardState("ja:gap-plain-due-1", pastCard(false));

      const payload = buildFullSyncPayload();
      expect(Object.keys(payload.cards)).toHaveLength(2);
      const serverState = await apiA.sync(payload);
      expect(Object.keys(serverState)).toHaveLength(2);
      markSynced(Object.keys(serverState));

      const aDue = dueCount();
      expect(aDue).toBe(1); // only the plain card — known is suppressed locally

      // ── Device B: fresh local state, same account, never had these cards ──
      resetLocalDevice();
      clearSRSStore();
      const apiB = freshSrsApi();
      const pulled = await apiB.getState();
      expect(Object.keys(pulled)).toHaveLength(2);
      mergeServerState(pulled);

      const bDue = dueCount();
      // THE regression: pre-fix, `pulled["ja:gap-known-1"].known` is
      // `undefined` (the server dropped it), so B's `isDue` falls through
      // to the (decades-past) date check and counts it — bDue would be 2,
      // not 1, even though device A never showed it as due.
      expect(bDue).toBe(aDue);
      expect(getSRSStore()["ja:gap-known-1"]?.known).toBe(true);
    },
    30_000,
  );
});
