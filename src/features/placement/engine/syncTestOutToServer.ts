/**
 * Synthesise BatchAttempt rows for every lesson in the modules a user
 * tested out of, and POST them to /api/core/v1/progress/lessons/batch.
 *
 * Why: ``applyPlacementResult`` already marks the lessons complete in
 * local mockProgress (localStorage). That's good enough for "the
 * current device shows the right state", but it doesn't survive a
 * device switch or fresh login. Mirroring the same completions through
 * the existing progress-batch endpoint keeps the server row in sync so
 * the user's progress travels with them.
 *
 * ── TestFlight b18 #144 / #145 (2026-09-15) ─────────────────────────────
 * It did not travel. The founder tested out to m32 on his phone; his iPad
 * showed "YOU ARE HERE" at M1 and 1% complete while XP, gems and streak
 * matched exactly. Two server constraints, both violated here, threw away
 * every completion:
 *
 *   1. `lingo-core/app/progress/schemas.py:100` caps `attempts` at 100 per
 *      POST. A JA m32 test-out synthesises **490** rows (m1 alone has 31
 *      lessons), and FastAPI validates the body before the handler runs —
 *      so the entire batch came back 422 with nothing persisted.
 *   2. `lingo-core/app/progress/router.py:363` rejects any row with
 *      `durationSec < max(5, len(stepResults))`. These rows carry no step
 *      results and used to send `durationSec: 1`, so even a legal-sized
 *      batch had every row rejected with `reason: "duration_below_floor"`
 *      before `update_lesson_rollup` ran. (The old `1` came from reading
 *      the schema's `ge=1` and missing the handler's floor.)
 *
 * The sync is therefore now: build → persist to a durable queue → drain in
 * ≤100-row chunks → keep whatever the server did not confirm. It is still
 * non-blocking for the UI (the local apply already painted), but a failure
 * is now recoverable instead of a `console.warn` and a shrug: the queue is
 * re-drained by every lesson-sync tick and shows up in the SyncManager's
 * dirty count.
 */

import {
  SERVER_DURATION_FLOOR_SEC,
  type BatchAttempt,
  type ProgressApi,
} from "@/shared/api/progress";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  drainTestOutSyncQueue,
  enqueueTestOutAttempts,
  getTestOutQueueCount,
  getTestOutQueueDiagnostics,
  postAttemptChunks,
} from "@/shared/domain/testOutSyncQueue";
import { logSessionEvent } from "@/shared/telemetry/sessionLog";

export function buildTestOutAttempts(
  passedModules: string[],
  languageId: string = "ja",
): BatchAttempt[] {
  if (passedModules.length === 0) return [];
  const course = getMockCourse(languageId);
  const passedSet = new Set(passedModules);
  const now = new Date().toISOString();
  const stamp = Date.now();
  const attempts: BatchAttempt[] = [];
  let idx = 0;
  for (const mod of course.modules) {
    if (!passedSet.has(mod.id)) continue;
    for (const lesson of mod.lessons) {
      attempts.push({
        clientAttemptId: `testout-${mod.id}-${lesson.id}-${stamp}-${idx++}`,
        lessonId: lesson.id,
        attemptedAt: now,
        // The server's floor is max(5, stepResults.length) and these rows
        // carry no step results — anything below 5 is rejected per-row
        // (`duration_below_floor`) and never becomes a completion. 5 is the
        // smallest honest value that the server will actually store.
        durationSec: SERVER_DURATION_FLOOR_SEC,
        passed: true,
        score: 1.0,
        stepResults: [],
        // Server-side flag: gates XP + lingots even though passed=true.
        // Without it the user would farm currency on every test-out.
        isTestOut: true,
      });
    }
  }
  return attempts;
}

/**
 * 2026-09-18 — a test-out that runs and never reaches the server left NO
 * trace before this: `console.warn` inside the queue is invisible on a real
 * device, and nothing logged that a push was even attempted. Every call now
 * leaves exactly one `sync_event`, including the "zero rows synthesized"
 * early return below — which is the EXACT branch that returns before
 * `batchAttempts` is ever called, and the one Spencer's iPad evidence
 * (2026-09-18: 12 `GET /progress/me`, zero `POST .../batch`, local
 * completedCount unchanged) is most consistent with: a `passedModules`/
 * `assumedModules` set that didn't synthesize any attempts at all.
 */
function logPush(
  languageId: string,
  attemptCount: number,
  outcome: "no-attempts" | "ok" | "partial" | "err",
  result: { submitted: number; pending: number },
): void {
  const lastError = outcome === "err" || outcome === "partial" ? getTestOutQueueDiagnostics().lastError : null;
  logSessionEvent("sync_event", {
    source: "test_out_push",
    languageId,
    attemptCount,
    submitted: result.submitted,
    pending: result.pending,
    outcome,
    errorName: lastError?.name,
  });
}

export async function syncTestOutToServer(
  progress: ProgressApi,
  passedModules: string[],
  languageId: string = "ja",
  assumedModules: string[] = [],
): Promise<{ submitted: number; pending: number }> {
  // Assumed = modules auto-completed because they sit BEFORE the tested one
  // (test-out of N ⇒ credit m(<N), no XP). They must sync too, or a device
  // switch loses those completions. All go up as isTestOut:true, so the
  // server gates XP/lingots for every one.
  const modules = [...new Set([...passedModules, ...assumedModules])];
  const attempts = buildTestOutAttempts(modules, languageId);
  if (attempts.length === 0) {
    const result = { submitted: 0, pending: 0 };
    logPush(languageId, 0, "no-attempts", result);
    return result;
  }

  const batch = (payload: Parameters<ProgressApi["batchAttempts"]>[0]) =>
    progress.batchAttempts(payload);

  // Persist BEFORE the network: the founder's case was a sync that never
  // landed and left no trace to retry from. If storage refuses the rows
  // (quota) fall back to the old direct POST — chunked, so it can at least
  // succeed — rather than dropping the sync entirely.
  if (!enqueueTestOutAttempts(attempts)) {
    const { acceptedIds } = await postAttemptChunks(batch, attempts);
    const result = {
      submitted: acceptedIds.length,
      pending: attempts.length - acceptedIds.length,
    };
    logPush(languageId, attempts.length, outcomeOf(attempts.length, result.submitted), result);
    return result;
  }

  const submitted = await drainTestOutSyncQueue(batch);
  const result = { submitted, pending: getTestOutQueueCount() };
  logPush(languageId, attempts.length, outcomeOf(attempts.length, submitted), result);
  return result;
}

function outcomeOf(attemptCount: number, submitted: number): "ok" | "partial" | "err" {
  if (submitted >= attemptCount) return "ok";
  if (submitted > 0) return "partial";
  return "err";
}
