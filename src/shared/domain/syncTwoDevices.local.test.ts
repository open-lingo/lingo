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
import { markLessonCompleted, getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import {
  reconcileLocalProgressToServer,
  resetReconcileMemoryForTests,
} from "@/shared/domain/progressReconcile";
import {
  syncLessonProgressWithServer,
  hydrateLessonProgressFromServer,
  resetLessonSyncCoalescerForTests,
} from "@/features/lesson/engine/progressSync";
import { clearTestOutSyncQueue } from "@/shared/domain/testOutSyncQueue";
import { appendPendingAttempt } from "@/features/lesson/engine/lessonStorage";
import { getLessonDirtyCount } from "@/features/lesson/engine/lessonSync";

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
  clearTestOutSyncQueue();
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
          getMe: () => apiA.getMe(undefined, { force: true }),
        }),
        reconcileLocalProgressToServer({
          userId: USER_SUB,
          serverLessons: [],
          batch: (p) => apiA.batchAttempts(p),
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
        batch: (p) => apiB.batchAttempts(p),
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
      expect(pulledOnResume).toBe(1); // only B's new lesson was missing locally
      expect(getMockCompletedLessonIds()).toHaveLength(N + 1);
      expect(getMockCompletedLessonIds()).toContain("ja-m2-l1");
    },
    60_000,
  );
});
