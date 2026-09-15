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

import { SERVER_DURATION_FLOOR_SEC, type BatchAttempt } from "@/shared/api/progress";
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
  type BatchFn,
} from "./testOutSyncQueue";
import { getPendingAttempts } from "@/features/lesson/engine/lessonStorage";
import { getStoredSettings } from "@/features/settings/storage";

export const RECONCILE_MARKER_PREFIX = "lingo_progress_reconciled_v1_";

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

/**
 * Completions this device has that the server does not — minus anything
 * already waiting to go up, so nothing is double-posted.
 */
export function localOnlyLessonIds(serverLessonIds: Iterable<string>): string[] {
  const covered = new Set<string>(serverLessonIds);
  for (const a of getQueuedTestOutAttempts()) covered.add(a.lessonId);
  for (const p of getPendingAttempts()) covered.add(p.lessonId);
  return getMockCompletedLessonIds().filter((id) => !covered.has(id));
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

export async function reconcileLocalProgressToServer(opts: {
  userId: string | null | undefined;
  serverLessonIds: Iterable<string>;
  batch: BatchFn;
  now?: number;
}): Promise<ReconcileOutcome> {
  if (inFlight) return inFlight;
  const run = runReconcile(opts).finally(() => {
    inFlight = null;
  });
  inFlight = run;
  return run;
}

async function runReconcile(opts: {
  userId: string | null | undefined;
  serverLessonIds: Iterable<string>;
  batch: BatchFn;
  now?: number;
}): Promise<ReconcileOutcome> {
  const skip = (reason: ReconcileSkipReason): ReconcileOutcome => ({
    status: "skipped",
    reason,
    queued: 0,
    posted: 0,
  });

  if (!SERVER_SYNC_ENABLED) return skip("sync-disabled");
  const userId = opts.userId;
  if (!userId) return skip("no-user");
  if (hasLessonProgressReset()) return skip("reset-pending");
  if (!resolvedLanguageId()) return skip("language-unresolved");

  const localOnly = localOnlyLessonIds(opts.serverLessonIds);
  if (localOnly.length === 0) return skip("nothing-local-only");

  const now = opts.now ?? Date.now();
  const hash = hashLessonIds(localOnly);
  const marker = readReconcileMarker(userId);
  if (
    marker &&
    marker.hash === hash &&
    now - Date.parse(marker.at) < RECONCILE_MAX_AGE_MS
  ) {
    return skip("already-reconciled");
  }

  const attempts = buildReconcileAttempts(userId, localOnly);
  // Persist BEFORE the network (the b18 lesson): a drain that never lands
  // leaves rows queued, visible in the dirty badge, retried by every later
  // sync tick — instead of a console.warn and a shrug.
  enqueueTestOutAttempts(attempts);
  writeReconcileMarker(userId, {
    at: new Date(now).toISOString(),
    hash,
    count: attempts.length,
  });

  let posted = 0;
  try {
    posted = await drainTestOutSyncQueue(opts.batch);
  } catch {
    /* rows stay queued; the 30s tick and the next hydrate retry */
  }
  return { status: "queued", queued: attempts.length, posted };
}
