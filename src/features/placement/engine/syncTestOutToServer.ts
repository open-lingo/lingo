/**
 * Mirror a test-out/placement pass to the server as ONE bulk-complete op.
 *
 * Why: ``applyPlacementResult`` already marks the lessons complete in
 * local mockProgress (localStorage). That's good enough for "the
 * current device shows the right state", but it doesn't survive a
 * device switch or fresh login. Mirroring the same completions through
 * the server keeps the server row in sync so the user's progress
 * travels with them.
 *
 * ── TestFlight b18 #144 / #145 (2026-09-15) ─────────────────────────────
 * A module test-out first shipped as N `BatchAttempt` rows — one per
 * lesson — POSTed to `/lessons/batch`. The founder tested out to m32 on his
 * phone; his iPad showed "YOU ARE HERE" at M1 and 1% complete while XP,
 * gems and streak matched exactly. Two server constraints, both violated,
 * threw away every completion (100-row cap, per-row duration floor); build
 * 19 fixed both by chunking + flooring + a durable retry queue.
 *
 * ── 2026-09-18 — the N-rows shape itself was the deeper bug ─────────────
 * A queued 491-row test-out from that same era sat stuck on the founder's
 * phone for WEEKS: 491 individually-failable writes for one event, and once
 * one attempt's confirmation was lost the whole batch stayed queued with no
 * path back (see `docs` / the SYNC2 lane report for the root-cause chain).
 * A seeded completion never needed per-lesson attempt shape (no duration,
 * no step results, no score) — it's just "these ids are now complete." The
 * server's `POST /progress/lessons/bulk-complete` takes exactly that: one
 * request, ids only, capped at 1000, idempotent on `clientOpId`. This
 * module now builds ONE `BulkOp` instead of N `BatchAttempt` rows.
 * `lessons/batch` is unchanged and still the only path for REAL attempts.
 */

import type { ProgressApi } from "@/shared/api/progress";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  drainBulkQueue,
  enqueueBulkOp,
  getTestOutQueueCount,
  getTestOutQueueDiagnostics,
  type BulkOp,
} from "@/shared/domain/testOutSyncQueue";
import { logSessionEvent } from "@/shared/telemetry/sessionLog";

/** Every lesson id in the passed (+ auto-completed script, + assumed)
 *  modules, for one language. No attempt shape — bulk-complete takes ids
 *  only. */
export function buildTestOutLessonIds(
  passedModules: string[],
  languageId: string = "ja",
): string[] {
  if (passedModules.length === 0) return [];
  const course = getMockCourse(languageId);
  const passedSet = new Set(passedModules);
  const ids: string[] = [];
  for (const mod of course.modules) {
    if (!passedSet.has(mod.id)) continue;
    for (const lesson of mod.lessons) ids.push(lesson.id);
  }
  return ids;
}

/**
 * 2026-09-18 — a test-out that runs and never reaches the server left NO
 * trace before this: `console.warn` inside the queue is invisible on a real
 * device, and nothing logged that a push was even attempted. Every call now
 * leaves exactly one `sync_event`, including the "zero ids synthesized"
 * early return below — which is the EXACT branch that returns before the
 * network is ever touched, and the one Spencer's iPad evidence
 * (2026-09-18: 12 `GET /progress/me`, zero `POST .../batch`, local
 * completedCount unchanged) is most consistent with: a `passedModules`/
 * `assumedModules` set that didn't synthesize any ids at all.
 */
function logPush(
  languageId: string,
  idCount: number,
  outcome: "no-attempts" | "ok" | "partial" | "err",
  result: { submitted: number; pending: number },
): void {
  const lastError = outcome === "err" || outcome === "partial" ? getTestOutQueueDiagnostics().lastError : null;
  logSessionEvent("sync_event", {
    source: "test_out_push",
    languageId,
    attemptCount: idCount,
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
  // switch loses those completions. Bulk-complete gates XP/lingots for the
  // whole op server-side (never touches the user row at all).
  const modules = [...new Set([...passedModules, ...assumedModules])];
  const lessonIds = buildTestOutLessonIds(modules, languageId);
  if (lessonIds.length === 0) {
    const result = { submitted: 0, pending: 0 };
    logPush(languageId, 0, "no-attempts", result);
    return result;
  }

  const op: BulkOp = {
    clientOpId: `testout-${languageId}-${Date.now()}`,
    lang: languageId,
    source: "test_out",
    lessonIds,
    completedAt: new Date().toISOString(),
  };

  // Persist BEFORE the network: the founder's case was a sync that never
  // landed and left no trace to retry from.
  enqueueBulkOp(op);
  const outcome = await drainBulkQueue((payload) => progress.bulkComplete(payload));
  const submitted = outcome.accepted + outcome.alreadyComplete;
  const result = { submitted, pending: getTestOutQueueCount() };
  logPush(languageId, lessonIds.length, outcomeOf(lessonIds.length, submitted), result);
  return result;
}

function outcomeOf(idCount: number, submitted: number): "ok" | "partial" | "err" {
  if (submitted >= idCount) return "ok";
  if (submitted > 0) return "partial";
  return "err";
}
