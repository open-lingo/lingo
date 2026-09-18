/**
 * One-shot LOCAL→SERVER catch-up for completions the server never received.
 *
 * Build 19 fixed the test-out WRITE path (chunk to 100, clear the duration
 * floor, persist to a durable queue). It did nothing for the completions
 * already stranded: the founder's phone holds months of `mockProgress` rows
 * — m1–m32 credited by a test-out the server refused in full — while his
 * iPad, same account, reads 18 of 660 because 18 is all the server ever
 * stored. Build 19's queue only ever holds rows a NEW test-out produces, so
 * his progress could only travel by re-running the test-out by hand.
 *
 * This module closes that on its own, on the next launch of the next build:
 *
 *   localOnly = local completions − server rollups − already-queued rows
 *
 * and, when that set is non-empty, enqueues it into the SAME durable
 * test-out queue (so it inherits the chunking, the duration floor, the
 * retry-until-confirmed drain and the SyncManager dirty badge) and drains it
 * at once rather than waiting on the 30s tick.
 *
 * Direction is one-way by construction: it only ever POSTs, never deletes a
 * local completion the server lacks, and never removes a server completion
 * locally — the server→local direction stays with `mergeServerLessonRollups`
 * in the /progress/me hydrate.
 *
 * Guards, in order (every one of them leaves the marker alone so a later
 * hydrate retries):
 *   - server sync disabled (`VITE_DEV_AUTH_BYPASS` build) → never runs
 *   - no authenticated user → never runs
 *   - a pending Start-over reset → never runs; resurrecting deleted
 *     progress is the one way this could destroy data
 *   - learning language unresolved → never runs. The Phase-2 settings merge
 *     races the /progress/me query (see the comment in
 *     `features/learn/hooks/useCompletedLessonIds.ts`), and a course-blind
 *     pass over a half-hydrated device is not a risk worth taking for a
 *     write path.
 *
 * Idempotency is belt-and-braces:
 *   - `clientAttemptId` is deterministic per (user, lesson), and the server
 *     dedupes on exactly that pair — `lingo-core/app/progress/router.py:320`
 *     answers a repeat with `accepted: true`, `xpEarned: 0` and the original
 *     attemptId, so a re-post is free and the row still clears the queue.
 *   - rows go up with `isTestOut: true`, which gates XP and lingots to zero
 *     server-side (`router.py:396-404`) — no currency farming.
 *   - a per-user marker records a hash of the ids posted, so an unchanged
 *     set is not re-posted; a grown set, or a marker older than 30 days, is.
 */

import {
  SERVER_DURATION_FLOOR_SEC,
  type BatchAttempt,
  type LessonRollup,
} from "@/shared/api/progress";
import { SERVER_SYNC_ENABLED } from "@/shared/auth/bypass";
import {
  getLessonCompletion,
  getMockCompletedLessonIds,
  hasLessonProgressReset,
} from "./mockProgress";
import {
  drainTestOutSyncQueue,
  enqueueTestOutAttempts,
  getQueuedTestOutAttempts,
  postAttemptChunks,
  type BatchFn,
} from "./testOutSyncQueue";
import { getPendingAttempts } from "@/features/lesson/engine/lessonStorage";
import { getStoredSettings } from "@/features/settings/storage";
import { logSessionEvent } from "@/shared/telemetry/sessionLog";

/**
 * DEV-ONLY reconcile-decision hook (lane A11, 2026-09-17 —
 * `docs/device-dev-debug-2026-09-17.md`). `src/shared/dev/remoteConsole.ts`
 * is the only caller of `setReconcileObserver`, and only when armed — see
 * the matching doc comment on `setApiRequestObserver` in
 * `shared/api/client.ts`. Fires once per `runReconcile` outcome (below) and
 * once per `pullFromServerIgnoringReset` call (`features/sync/
 * pullFromServerIgnoringReset.ts`) — counts and status strings only, never
 * a lesson id list or a user id.
 */
export type ReconcileObserverEvent =
  | { source: "reconcile"; status: string; reason?: string; queued: number; posted: number }
  | { source: "pull-ignoring-reset"; localCount: number; serverCount: number | null };
export type ReconcileObserver = (event: ReconcileObserverEvent) => void;
let reconcileObserver: ReconcileObserver | null = null;
export function setReconcileObserver(fn: ReconcileObserver | null): void {
  reconcileObserver = fn;
}
/**
 * Every reconcile-shaped call site (the internal `record()` below,
 * `pullFromServerIgnoringReset.ts`'s #176a manual "Pull from server")
 * reports through this — never straight into the module-private
 * `reconcileObserver`. Two effects, both unconditional (2026-09-18, SYNC2
 * lane — `docs/handoff-2026-09-18-resume.md` §6 flagged that a prior device
 * diagnostics capture carried page/lesson/tile events but NOTHING from the
 * sync subsystem, so a stuck queue looked identical to a healthy one from
 * the outside):
 *   1. the dev-only `reconcileObserver`, when armed (unchanged behaviour);
 *   2. `sessionLog.ts`, ALWAYS — so a plain "Send diagnostics" or an
 *      automatic error report on a real build (no dev arm) still carries
 *      the last reconcile outcomes as breadcrumbs. Counts and status
 *      strings only, same privacy bar as the observer event itself.
 */
export function reportReconcileEvent(event: ReconcileObserverEvent): void {
  reconcileObserver?.(event);
  logSessionEvent("sync_event", { ...event });
}

export const RECONCILE_MARKER_PREFIX = "lingo_progress_reconciled_v1_";

/** Last outcome, per user — read by the SyncManager panel so a silent skip
 *  is never invisible again (b20: the phone skipped ~30 times in 15 minutes
 *  and the only way to find out was the server access log). */
export const RECONCILE_STATUS_PREFIX = "lingo_progress_reconcile_status_v1_";

/** Re-run even on an unchanged set after this long — a month is long enough
 *  that "the server lost it" beats "we already tried". */
export const RECONCILE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const ATTEMPT_ID_PREFIX = "reconcile-v1-";

export interface ReconcileMarker {
  /** ISO timestamp of the last reconciliation that actually posted. */
  at: string;
  /** Hash of the id set posted — a grown set re-runs, an identical one doesn't. */
  hash: string;
  count: number;
}

export type ReconcileSkipReason =
  | "sync-disabled"
  | "no-user"
  | "reset-pending"
  | "language-unresolved"
  | "nothing-local-only"
  | "already-reconciled";

export interface ReconcileStatus {
  status: "queued" | "skipped";
  reason?: ReconcileSkipReason;
  queued: number;
  confirmed: number;
  at: string;
}

export interface ReconcileOutcome {
  status: "queued" | "skipped";
  reason?: ReconcileSkipReason;
  /** Rows this pass synthesised and persisted. */
  queued: number;
  /** Rows the server confirmed during the immediate drain. */
  posted: number;
}

/** Stable per (user, lesson) — the pair the server dedupes on. Identical on
 *  every device of the same account, so two devices reconciling the same
 *  lesson produce one attempt row, not two. */
export function reconcileAttemptId(userId: string, lessonId: string): string {
  return `${ATTEMPT_ID_PREFIX}${userId}-${lessonId}`;
}

/** FNV-1a over the sorted ids. Not cryptographic — this only has to notice
 *  that the set changed, in a few bytes of localStorage. */
export function hashLessonIds(ids: string[]): string {
  let h = 0x811c9dc5;
  for (const id of [...ids].sort()) {
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= 0x0a;
    h = Math.imul(h, 0x01000193);
  }
  return `${(h >>> 0).toString(16)}-${ids.length}`;
}

/** Lesson ids the server considers COMPLETE.
 *
 *  Not every rollup is one: a mid-lesson draft sync writes a rollup with
 *  `firstPassedAt: null`, and `mockProgress.rollupToCompletion` refuses
 *  those as completions for exactly that reason. b20 shipped with the diff
 *  subtracting every rollup id, which made a lesson the learner had merely
 *  OPENED look like the server already had it — permanently unreconcilable.
 */
export function serverCompletedLessonIds(
  rollups: readonly Pick<LessonRollup, "lessonId" | "firstPassedAt">[],
): string[] {
  return rollups.filter((r) => Boolean(r.firstPassedAt)).map((r) => r.lessonId);
}

/**
 * Completions this device has that the server does not — minus anything
 * already waiting to go up, so nothing is double-posted.
 */
export function localOnlyLessonIds(
  serverLessons: readonly Pick<LessonRollup, "lessonId" | "firstPassedAt">[],
): string[] {
  const covered = new Set<string>(serverCompletedLessonIds(serverLessons));
  for (const a of getQueuedTestOutAttempts()) covered.add(a.lessonId);
  for (const p of getPendingAttempts()) covered.add(p.lessonId);
  return getMockCompletedLessonIds().filter((id) => !covered.has(id));
}

function statusKey(userId: string): string {
  return `${RECONCILE_STATUS_PREFIX}${userId}`;
}

export function readReconcileStatus(userId: string): ReconcileStatus | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(statusKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReconcileStatus;
    return typeof parsed?.at === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function writeReconcileStatus(userId: string, status: ReconcileStatus): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(statusKey(userId), JSON.stringify(status));
  } catch {
    /* quota — diagnostics are the first thing that may be dropped */
  }
}

/** One line for the SyncManager panel. Terse on purpose — it shares a 210px
 *  popover with the per-source rows. */
export function formatReconcileStatusLine(
  status: ReconcileStatus | null,
): string {
  if (!status) return "reconcile: not run yet";
  if (status.status === "skipped") {
    return `reconcile: skipped (${status.reason ?? "unknown"})`;
  }
  return `reconcile: queued ${status.queued} · confirmed ${status.confirmed}/${status.queued}`;
}

function markerKey(userId: string): string {
  return `${RECONCILE_MARKER_PREFIX}${userId}`;
}

export function readReconcileMarker(userId: string): ReconcileMarker | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(markerKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReconcileMarker;
    return typeof parsed?.hash === "string" && typeof parsed?.at === "string"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function writeReconcileMarker(userId: string, marker: ReconcileMarker): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(markerKey(userId), JSON.stringify(marker));
  } catch {
    /* quota — the set difference is recomputed every hydrate anyway */
  }
}

/** Resolved learning language, or null while the settings merge is still in
 *  flight. Read from storage rather than LanguageContext so this stays
 *  callable from the /progress/me query function. */
function resolvedLanguageId(): string | null {
  const stored = getStoredSettings();
  const id = stored?.learning?.learningLanguageId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function buildReconcileAttempts(userId: string, lessonIds: string[]): BatchAttempt[] {
  return lessonIds.map((lessonId) => {
    const local = getLessonCompletion(lessonId);
    return {
      clientAttemptId: reconcileAttemptId(userId, lessonId),
      lessonId,
      // The real local completion time, so `firstPassedAt` on the server
      // (`if_not_exists(firstPassedAt, attemptedAt)` —
      // `app/db/dynamo/progress.py:392`) records when it actually happened.
      attemptedAt: local?.firstCompletedAt ?? new Date().toISOString(),
      // Server floor is max(5, stepResults.length); these carry no steps.
      durationSec: SERVER_DURATION_FLOOR_SEC,
      passed: true,
      score: Math.max(0, Math.min(1, local?.bestAccuracy ?? 1)),
      stepResults: [],
      // Gates XP + lingots to zero server-side.
      isTestOut: true,
    };
  });
}

/** Collapses the concurrent hydrates a boot fires into one pass. */
let inFlight: Promise<ReconcileOutcome> | null = null;

/** Test seam — module-level coalescing state is per-file in vitest. */
export function resetReconcileMemoryForTests(): void {
  inFlight = null;
}

export interface ReconcileRequest {
  userId: string | null | undefined;
  /** The server's lesson rollups, straight off `/progress/me`. */
  serverLessons: readonly Pick<LessonRollup, "lessonId" | "firstPassedAt">[];
  batch: BatchFn;
  /** Ignore the marker — the SyncManager's "Reconcile now". */
  force?: boolean;
  now?: number;
}

export async function reconcileLocalProgressToServer(
  opts: ReconcileRequest,
): Promise<ReconcileOutcome> {
  if (inFlight) return inFlight;
  const run = runReconcile(opts).finally(() => {
    inFlight = null;
  });
  inFlight = run;
  return run;
}

async function runReconcile(opts: ReconcileRequest): Promise<ReconcileOutcome> {
  const userId = opts.userId;
  const now = opts.now ?? Date.now();
  const record = (outcome: ReconcileOutcome): ReconcileOutcome => {
    if (userId) {
      writeReconcileStatus(userId, {
        status: outcome.status,
        reason: outcome.reason,
        queued: outcome.queued,
        confirmed: outcome.posted,
        at: new Date(now).toISOString(),
      });
    }
    reportReconcileEvent({
      source: "reconcile",
      status: outcome.status,
      reason: outcome.reason,
      queued: outcome.queued,
      posted: outcome.posted,
    });
    return outcome;
  };
  const skip = (reason: ReconcileSkipReason): ReconcileOutcome =>
    record({ status: "skipped", reason, queued: 0, posted: 0 });

  if (!SERVER_SYNC_ENABLED) return skip("sync-disabled");
  if (!userId) return { status: "skipped", reason: "no-user", queued: 0, posted: 0 };
  if (hasLessonProgressReset()) return skip("reset-pending");
  if (!resolvedLanguageId()) return skip("language-unresolved");

  const localOnly = localOnlyLessonIds(opts.serverLessons);
  if (localOnly.length === 0) {
    // Nothing NEW is local-only, but `localOnlyLessonIds` treats a lesson
    // already sitting in `testOutSyncQueue` as "covered" — so a queue that
    // was persisted by an earlier pass (this build or an older one) and
    // never got a confirmed POST through would otherwise be invisible to
    // every later reconcile call, forever. Nothing else in the app drains
    // that queue (the periodic tick and "Sync now" only drain the unrelated
    // lesson-attempt buffer). 2026-09-18: 491 rows sat queued through dozens
    // of app opens for exactly this reason — the server never even saw a
    // request for them. So: always try to flush whatever is already queued,
    // independent of the local/server diff and independent of the marker.
    const stuck = getQueuedTestOutAttempts();
    if (stuck.length === 0) return skip("nothing-local-only");
    let stuckPosted = 0;
    try {
      stuckPosted = await drainTestOutSyncQueue(opts.batch);
    } catch {
      /* stays queued; retried on the next pass */
    }
    return stuckPosted > 0
      ? record({ status: "queued", queued: 0, posted: stuckPosted })
      : skip("nothing-local-only");
  }

  const hash = hashLessonIds(localOnly);
  const marker = readReconcileMarker(userId);
  if (
    !opts.force &&
    marker &&
    marker.hash === hash &&
    now - Date.parse(marker.at) < RECONCILE_MAX_AGE_MS
  ) {
    return skip("already-reconciled");
  }

  const attempts = buildReconcileAttempts(userId, localOnly);

  // Persist BEFORE the network (the b18 lesson): a drain that never lands
  // leaves rows queued, visible in the dirty badge, retried by every later
  // sync tick. ~480 synthesised rows is ~90 KB, though, and a refusal used
  // to be swallowed — the queue stayed empty, the drain found nothing, and
  // the marker (written unconditionally) made every later launch skip as
  // 'already-reconciled'. That is one of the three ways b20 could post
  // nothing and say nothing. So: honour the return value, fall back to a
  // direct chunked POST exactly like `syncTestOutToServer` does, and write
  // the marker only once something actually landed somewhere.
  const persisted = enqueueTestOutAttempts(attempts);

  let posted = 0;
  try {
    posted = persisted
      ? await drainTestOutSyncQueue(opts.batch)
      : (await postAttemptChunks(opts.batch, attempts)).acceptedIds.length;
  } catch {
    /* queued rows retry on the next tick; unqueued ones on the next hydrate */
  }

  if (persisted || posted > 0) {
    writeReconcileMarker(userId, {
      at: new Date(now).toISOString(),
      hash,
      count: attempts.length,
    });
  }
  return record({ status: "queued", queued: attempts.length, posted });
}
