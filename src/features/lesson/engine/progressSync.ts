import type {
  BatchAttemptResponse,
  BatchAttemptSubmission,
  ProgressSummary,
} from "@/shared/api/progress";
import {
  hasLessonProgressReset,
  mergeServerLessonRollups,
} from "@/shared/domain/mockProgress";
import { drainBulkQueue, type BulkCompleteFn } from "@/shared/domain/testOutSyncQueue";
import { performLessonSync } from "./lessonSync";

export interface LessonSyncOutcome {
  pushed: number;
  hydrated: number;
  testOutPushed: number;
  /** True when the debounce window swallowed this call (no network at all). */
  skipped?: boolean;
}

type BatchFn = (payload: BatchAttemptSubmission) => Promise<BatchAttemptResponse>;

/** Pull lesson rollups from GET /progress/me into the local completion cache. */
export async function hydrateLessonProgressFromServer(
  getMe: () => Promise<ProgressSummary | null>,
): Promise<number> {
  if (hasLessonProgressReset()) return 0;
  const summary = await getMe();
  if (!summary?.lessons?.length) return 0;
  return mergeServerLessonRollups(summary.lessons);
}

/**
 * Minimum gap between two PUSH-only flushes (b19). The 30s tick, a lesson
 * unmount and the app going to the background can all land within the same
 * second; the server is idempotent on `clientAttemptId` but each duplicate
 * still costs a Lambda invoke.
 */
export const FLUSH_MIN_INTERVAL_MS = 3000;

let inFlight: Promise<LessonSyncOutcome> | null = null;
let lastRunEndedAt = 0;

/** Test seam — this module's coalescing state is per test file. */
export function resetLessonSyncCoalescerForTests(): void {
  inFlight = null;
  lastRunEndedAt = 0;
}

function track(run: Promise<LessonSyncOutcome>): Promise<LessonSyncOutcome> {
  inFlight = run;
  return run.finally(() => {
    lastRunEndedAt = Date.now();
    if (inFlight === run) inFlight = null;
  });
}

/** Push buffered attempts, then pull rollups from the server.
 *
 *  The bulk-complete queue drains here too (b18 #144, redesigned 2026-09-18
 *  from N per-lesson rows to one op per event): this is the one choke point
 *  every sync trigger already goes through — boot hydrate, the 30s periodic
 *  tick, and the SyncManager's manual "Sync now" — so a test-out/placement/
 *  reconcile op that lost its network the first time retries without a new
 *  trigger of its own. `drainBulkQueue` also folds in any legacy per-row
 *  entries still sitting in the OLD queue (any build through ~32) into one
 *  op before draining. Never throws; a failure leaves the op queued.
 *
 *  Concurrent callers share one run (b19): boot, tick, lesson unmount and
 *  the background flush overlap constantly, and each overlap used to be a
 *  full push + GET /progress/me of its own. */
export async function syncLessonProgressWithServer(options: {
  batch: BatchFn;
  bulkComplete: BulkCompleteFn;
  getMe: () => Promise<ProgressSummary | null>;
}): Promise<LessonSyncOutcome> {
  if (inFlight) return inFlight;
  return track(
    (async () => {
      const pushed = await performLessonSync(options.batch);
      const testOutPushed = await drainQuietly(options.bulkComplete);
      const hydrated = await hydrateLessonProgressFromServer(options.getMe);
      return { pushed, hydrated, testOutPushed };
    })(),
  );
}

async function drainQuietly(bulkComplete: BulkCompleteFn): Promise<number> {
  try {
    const outcome = await drainBulkQueue(bulkComplete);
    return outcome.accepted + outcome.alreadyComplete;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[test-out] bulk queue drain failed, op stays queued", err);
    return 0;
  }
}

/**
 * PUSH-only flush for the app going away (background, tab hide, close).
 *
 * b19, from the founder: "I close the app on my phone and nothing pushes."
 * Correct — the 30s tick only runs while the app is foregrounded, and
 * `useLessonSyncSession` only warns on beforeunload. A backgrounded iOS
 * webview gets frozen mid-timer, so the last lesson of a session could sit
 * on the device until the next launch.
 *
 * No `/progress/me` pull: a process about to be frozen has no use for the
 * answer, and the GET would just compete with the POST for the keepalive
 * budget. Debounced against the periodic tick so a hide right after a sync
 * doesn't re-POST the same rows.
 */
export async function flushLessonProgressToServer(options: {
  batch: BatchFn;
  bulkComplete: BulkCompleteFn;
  minIntervalMs?: number;
  now?: number;
}): Promise<LessonSyncOutcome> {
  if (inFlight) return inFlight;
  const now = options.now ?? Date.now();
  const gap = options.minIntervalMs ?? FLUSH_MIN_INTERVAL_MS;
  if (lastRunEndedAt > 0 && now - lastRunEndedAt < gap) {
    return { pushed: 0, hydrated: 0, testOutPushed: 0, skipped: true };
  }
  return track(
    (async () => {
      let pushed = 0;
      try {
        pushed = await performLessonSync(options.batch);
      } catch {
        /* rows stay buffered for the next launch */
      }
      const testOutPushed = await drainQuietly(options.bulkComplete);
      return { pushed, hydrated: 0, testOutPushed };
    })(),
  );
}
