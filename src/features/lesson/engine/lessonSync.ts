import type {
  BatchAttempt,
  BatchAttemptResponse,
  BatchAttemptSubmission,
  GradedStepResult,
} from "@/shared/api/progress";
import { readLessonStartedAt } from "@/features/lesson/data/lessonProgress";
import {
  appendPendingAttempt,
  appendStepEvent,
  clearStepEventsForLesson,
  getPendingAttempts,
  getStepEvents,
  removePendingAttempts,
  setLastLessonSyncAt,
  setPendingAttempts,
  type PendingAttempt,
} from "./lessonStorage";
import {
  markStreakCheckedToday,
  shouldCheckStreakOnNextSync,
} from "./sessionStreak";

/** Subscribers fire whenever the buffer changes — used by status hooks to
 *  refresh dirty counts without polling. */
const listeners = new Set<() => void>();

export function subscribeLessonBuffer(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* keep going */
    }
  });
}

/** Generate a UUID without depending on browser crypto availability fallbacks. */
function newAttemptId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback (older browsers / non-secure contexts) — non-cryptographic.
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Stable id for in-flight lesson batches (updated after each graded step). */
export const DRAFT_ATTEMPT_PREFIX = "draft:";

export function isDraftAttemptId(clientAttemptId: string): boolean {
  return clientAttemptId.startsWith(DRAFT_ATTEMPT_PREFIX);
}

function draftAttemptId(lessonId: string): string {
  return `${DRAFT_ATTEMPT_PREFIX}${lessonId}`;
}

function removeDraftAttemptsForLesson(lessonId: string): void {
  const list = getPendingAttempts().filter(
    (a) => !(a.lessonId === lessonId && isDraftAttemptId(a.clientAttemptId)),
  );
  setPendingAttempts(list);
}

/** Drafts stay in the buffer after a successful mid-lesson sync; only re-dirty when updated. */
export function isPendingAttemptDirty(attempt: PendingAttempt): boolean {
  if (!isDraftAttemptId(attempt.clientAttemptId)) return true;
  if (!attempt.syncedAt) return true;
  return attempt.bufferedAt > attempt.syncedAt;
}

/** Items waiting to upload: completed attempts + in-progress lesson drafts. */
export function getLessonDirtyCount(): number {
  const pending = getPendingAttempts();
  // Any pending row (including a synced draft) covers local step events for that
  // lesson — otherwise mid-lesson sync looks dirty while still in the lesson.
  const lessonsWithPending = new Set(pending.map((p) => p.lessonId));
  let count = 0;
  for (const p of pending) {
    if (isPendingAttemptDirty(p)) count++;
  }
  const orphanLessons = new Set(
    getStepEvents()
      .filter((e) => !lessonsWithPending.has(e.lessonId))
      .map((e) => e.lessonId),
  );
  return count + orphanLessons.size;
}

function markDraftAttemptsSynced(clientAttemptIds: string[], syncedAt: string): void {
  const idSet = new Set(clientAttemptIds);
  const list = getPendingAttempts().map((a) =>
    idSet.has(a.clientAttemptId) && isDraftAttemptId(a.clientAttemptId)
      ? { ...a, syncedAt }
      : a,
  );
  setPendingAttempts(list);
}

/**
 * Upsert a draft batch attempt from buffered step events so SyncManager
 * shows dirty state and periodic sync can POST mid-lesson progress.
 */
function upsertInProgressAttempt(lessonId: string): void {
  const events = getStepEvents().filter((e) => e.lessonId === lessonId);
  if (events.length === 0) return;

  const stepResults: GradedStepResult[] = events.map((e) => ({
    stepIdx: e.stepIdx,
    conceptIds: e.conceptIds,
    correct: e.correct,
  }));
  const correctCount = events.filter((e) => e.correct).length;
  const score =
    stepResults.length > 0 ? correctCount / stepResults.length : 0;
  const startedAt =
    readLessonStartedAt(lessonId) ??
    events[0]?.recordedAt ??
    new Date().toISOString();
  // Cap at 1h — matches the backend sanity cap. Abandoned tabs / browser
  // sleeps produce wildly inflated durations (days, weeks) that previously
  // 422'd the whole batch sync. Server still clamps as defense-in-depth.
  const MAX_DURATION_SEC = 3600;
  const durationSec = Math.min(
    MAX_DURATION_SEC,
    Math.max(
      minDurationSecForAttempt(stepResults),
      Math.floor((Date.now() - Date.parse(startedAt)) / 1000),
    ),
  );

  const attempt: PendingAttempt = {
    clientAttemptId: draftAttemptId(lessonId),
    lessonId,
    attemptedAt: startedAt,
    bufferedAt: new Date().toISOString(),
    durationSec,
    passed: false,
    score: Math.max(0, Math.min(1, score)),
    stepResults,
  };
  appendPendingAttempt(attempt);
}

/** Step events without a matching pending draft — materialize before POST. */
function materializeOrphanDrafts(): void {
  const coveredLessons = new Set(getPendingAttempts().map((p) => p.lessonId));
  for (const event of getStepEvents()) {
    if (coveredLessons.has(event.lessonId)) continue;
    upsertInProgressAttempt(event.lessonId);
    coveredLessons.add(event.lessonId);
  }
}

export interface RecordAttemptInput {
  lessonId: string;
  durationSec: number;
  passed: boolean;
  score: number;
  stepResults: GradedStepResult[];
}

/** Buffer a graded step and refresh the in-progress draft attempt for sync. */
export function recordStepEvent(input: {
  lessonId: string;
  stepId: string;
  stepIdx: number;
  correct: boolean;
  conceptIds?: string[];
}): void {
  appendStepEvent({
    lessonId: input.lessonId,
    stepId: input.stepId,
    stepIdx: input.stepIdx,
    correct: input.correct,
    conceptIds: input.conceptIds ?? [],
    recordedAt: new Date().toISOString(),
  });
  upsertInProgressAttempt(input.lessonId);
  notify();
}

/** Server rejects attempts below max(5, gradedStepCount) seconds — match that here. */
export function minDurationSecForAttempt(stepResults: GradedStepResult[]): number {
  return Math.max(5, stepResults.length);
}

/** Buffer a completed lesson attempt locally. Replaces any in-progress draft. */
export function recordAttempt(input: RecordAttemptInput): PendingAttempt {
  removeDraftAttemptsForLesson(input.lessonId);
  // Same 1h clamp as the draft path above. Abandoned tabs / browser
  // sleeps were producing 95k-second durations that 422'd the batch.
  const durationSec = Math.min(
    3600,
    Math.max(
      minDurationSecForAttempt(input.stepResults),
      Math.floor(input.durationSec),
    ),
  );
  const attempt: PendingAttempt = {
    clientAttemptId: newAttemptId(),
    lessonId: input.lessonId,
    attemptedAt: new Date().toISOString(),
    bufferedAt: new Date().toISOString(),
    durationSec,
    passed: input.passed,
    score: Math.max(0, Math.min(1, input.score)),
    stepResults: input.stepResults,
  };
  appendPendingAttempt(attempt);
  clearStepEventsForLesson(input.lessonId);
  notify();
  return attempt;
}

/** Build the batch payload from the current buffer. */
export function buildBatchPayload(): {
  payload: BatchAttemptSubmission;
  ids: string[];
} {
  materializeOrphanDrafts();
  // Drafts are sent to the server but flagged so it persists the step
  // results without firing lesson_completed / xp_awarded / leaderboard
  // events — those only fire on real lesson completion (see
  // lingo-core ``progress/router.py`` for the gate).
  const pending = getPendingAttempts().filter(isPendingAttemptDirty);
  // Fix M10 — dedupe on clientAttemptId only. A previous version keyed by
  // lessonId, which silently discarded legitimate repeat attempts when a
  // user re-did a lesson within a sync window. clientAttemptId already
  // dedupes the "settings toast double-buffered" case at the storage
  // layer (appendPendingAttempt), so this is the correct unique key.
  const latestById = new Map<string, PendingAttempt>();
  for (const p of pending) {
    const prev = latestById.get(p.clientAttemptId);
    if (!prev || p.bufferedAt >= prev.bufferedAt) {
      latestById.set(p.clientAttemptId, p);
    }
  }
  const deduped = Array.from(latestById.values());

  // Strip the local-only `bufferedAt` before sending — server doesn't need it.
  // Re-clamp `durationSec` at send-time even if recordAttempt already clamped:
  // stale buffer entries from before the clamp landed still carry tens-of-
  // thousands-of-seconds values, and the server rejects those with 422,
  // which leaves them in the buffer forever and the periodic sync hammers
  // the server every 30s. Clamping here drains the bad rows out.
  // Flag draft attempts with isDraft so the server persists them but skips
  // event emission (quest progress, leaderboard, xp_awarded) until the
  // user actually finishes the lesson.
  const MAX_DURATION_SEC = 3600;
  const attempts: BatchAttempt[] = deduped.map((p) => {
    const { bufferedAt: _bufferedAt, ...rest } = p;
    const clamped = {
      ...rest,
      durationSec: Math.min(MAX_DURATION_SEC, Math.max(1, rest.durationSec)),
    };
    const isDraft = p.clientAttemptId.startsWith(DRAFT_ATTEMPT_PREFIX);
    return isDraft ? { ...clamped, isDraft: true } : clamped;
  });
  const checkStreak = shouldCheckStreakOnNextSync();
  return {
    payload: { attempts, checkStreak },
    ids: deduped.map((p) => p.clientAttemptId),
  };
}

function clientIdsToClearFromBatchResponse(
  pendingIds: string[],
  results: BatchAttemptResponse["results"],
): string[] {
  const pendingSet = new Set(pendingIds);
  const toRemove = new Set<string>();

  for (const r of results) {
    if (!pendingSet.has(r.clientAttemptId)) continue;
    if (r.accepted || r.attemptId) {
      toRemove.add(r.clientAttemptId);
    }
  }

  return [...toRemove];
}

/** Perform a full sync cycle. Pass a function that POSTs the batch payload
 *  and returns the server's per-attempt results.
 *
 *  Returns the number of attempts that the server accepted. Items the
 *  server rejected (e.g. prerequisite-missing) stay in the buffer so the
 *  user can see them in a future "rejected attempts" view (TODO). For now
 *  we leave them and the user can manually clear if needed. */
export async function performLessonSync(
  syncFn: (payload: BatchAttemptSubmission) => Promise<BatchAttemptResponse>,
): Promise<number> {
  // Fix H8 — two-tab race. `appendPendingAttempt` in storage is
  // read-modify-write, so two tabs writing the buffer in the same tick can
  // each see the other's stale snapshot and clobber each other's appends.
  //
  // The buffer only flows one direction (FE → server), and the only failure
  // mode that matters is "we missed an attempt that a sibling tab just
  // appended". Re-reading the buffer right before we build the payload
  // collapses the race window to roughly zero: by the time we POST, we
  // have the freshest localStorage snapshot the OS will hand us.
  //
  // We accept a vanishingly small remaining window (sibling tab writes
  // between buildBatchPayload returning and our removePendingAttempts call).
  // Those rows survive because removePendingAttempts re-reads the buffer
  // and only filters by clientAttemptId — concurrent appends with new ids
  // are preserved. A full BroadcastChannel lock is over-engineered for the
  // power-user-two-tabs MVP risk profile.
  const { payload, ids } = buildBatchPayload();
  if (ids.length === 0) {
    return 0;
  }

  const pendingBefore = getPendingAttempts();
  const response = await syncFn(payload);
  const results = response?.results ?? [];
  const clearedIds = clientIdsToClearFromBatchResponse(ids, results);

  if (clearedIds.length > 0) {
    const syncedAt = new Date().toISOString();
    const draftCleared = clearedIds.filter(isDraftAttemptId);
    const finalCleared = clearedIds.filter((id) => !isDraftAttemptId(id));

    if (draftCleared.length > 0) {
      markDraftAttemptsSynced(draftCleared, syncedAt);
    }

    if (finalCleared.length > 0) {
      const clearedLessonIds = new Set(
        pendingBefore
          .filter((p) => finalCleared.includes(p.clientAttemptId))
          .map((p) => p.lessonId),
      );
      removePendingAttempts(finalCleared);
      // Fix M10 — after dedup-by-clientAttemptId, the *only* leftover
      // attempts for a cleared lesson that we should reap are stale drafts
      // (the in-progress upsert that this final attempt supersedes).
      // Final attempts for the same lessonId with different clientAttemptIds
      // are legitimate repeat plays and must NOT be cleared as "dupes".
      const staleDrafts = getPendingAttempts()
        .filter(
          (p) =>
            clearedLessonIds.has(p.lessonId) &&
            isDraftAttemptId(p.clientAttemptId),
        )
        .map((p) => p.clientAttemptId);
      if (staleDrafts.length > 0) {
        removePendingAttempts(staleDrafts);
      }
      for (const lessonId of clearedLessonIds) {
        clearStepEventsForLesson(lessonId);
      }
    }

    setLastLessonSyncAt(syncedAt);
    if (payload.checkStreak) {
      markStreakCheckedToday();
    }
  }

  notify();
  return clearedIds.length;
}
