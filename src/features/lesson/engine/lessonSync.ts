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
  const durationSec = Math.max(
    minDurationSecForAttempt(stepResults),
    Math.floor((Date.now() - Date.parse(startedAt)) / 1000),
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
  const durationSec = Math.max(
    minDurationSecForAttempt(input.stepResults),
    Math.floor(input.durationSec),
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
  const pending = getPendingAttempts().filter(isPendingAttemptDirty);
  // One completion effect can buffer twice (settings toast, etc.) — keep the
  // latest attempt per lesson so sync doesn't leave a stale duplicate dirty.
  const latestByLesson = new Map<string, PendingAttempt>();
  for (const p of pending) {
    const prev = latestByLesson.get(p.lessonId);
    if (!prev || p.bufferedAt >= prev.bufferedAt) {
      latestByLesson.set(p.lessonId, p);
    }
  }
  const deduped = Array.from(latestByLesson.values());

  // Strip the local-only `bufferedAt` before sending — server doesn't need it.
  const attempts: BatchAttempt[] = deduped.map((p) => {
    const { bufferedAt: _bufferedAt, ...rest } = p;
    return rest;
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
      const staleDupes = getPendingAttempts()
        .filter((p) => clearedLessonIds.has(p.lessonId))
        .map((p) => p.clientAttemptId);
      if (staleDupes.length > 0) {
        removePendingAttempts(staleDupes);
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
