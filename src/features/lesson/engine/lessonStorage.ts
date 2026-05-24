import type { BatchAttempt } from "@/shared/api/progress";
import { getActiveUserStorageId } from "@/features/settings/storage";

const BUFFER_PREFIX = "open-lingo-lesson-attempts:v1:";
const STEP_EVENTS_PREFIX = "open-lingo-lesson-step-events:v1:";
const LAST_SYNC_PREFIX = "open-lingo-lesson-last-sync:";
const NEXT_SYNC_PREFIX = "open-lingo-lesson-next-sync:";

/** Legacy keys (pre per-user scoping) — cleared on read when migrating. */
const LEGACY_BUFFER_KEY = "open-lingo-lesson-attempts:v1";
const LEGACY_STEP_EVENTS_KEY = "open-lingo-lesson-step-events:v1";
const LEGACY_LAST_SYNC_KEY = "open-lingo-lesson-last-sync";
const LEGACY_NEXT_SYNC_KEY = "open-lingo-lesson-next-sync";

function bufferKey(): string {
  return `${BUFFER_PREFIX}${getActiveUserStorageId()}`;
}

function stepEventsKey(): string {
  return `${STEP_EVENTS_PREFIX}${getActiveUserStorageId()}`;
}

function lastSyncKey(): string {
  return `${LAST_SYNC_PREFIX}${getActiveUserStorageId()}`;
}

function nextSyncKey(): string {
  return `${NEXT_SYNC_PREFIX}${getActiveUserStorageId()}`;
}

function migrateLegacyLessonKeys(): void {
  if (typeof window === "undefined") return;
  try {
    const legacyBuffer = localStorage.getItem(LEGACY_BUFFER_KEY);
    if (legacyBuffer && !localStorage.getItem(bufferKey())) {
      localStorage.setItem(bufferKey(), legacyBuffer);
    }
    localStorage.removeItem(LEGACY_BUFFER_KEY);

    const legacySteps = localStorage.getItem(LEGACY_STEP_EVENTS_KEY);
    if (legacySteps && !localStorage.getItem(stepEventsKey())) {
      localStorage.setItem(stepEventsKey(), legacySteps);
    }
    localStorage.removeItem(LEGACY_STEP_EVENTS_KEY);

    const legacyLast = localStorage.getItem(LEGACY_LAST_SYNC_KEY);
    if (legacyLast && !localStorage.getItem(lastSyncKey())) {
      localStorage.setItem(lastSyncKey(), legacyLast);
    }
    localStorage.removeItem(LEGACY_LAST_SYNC_KEY);

    const legacyNext = localStorage.getItem(LEGACY_NEXT_SYNC_KEY);
    if (legacyNext && !localStorage.getItem(nextSyncKey())) {
      localStorage.setItem(nextSyncKey(), legacyNext);
    }
    localStorage.removeItem(LEGACY_NEXT_SYNC_KEY);
  } catch {
    /* ignore */
  }
}

/** A per-step event captured as the user completes individual lesson steps.
 *
 *  Step events are client-side telemetry for the dirty-count signal — they
 *  let the SyncManager show in-progress lesson activity rather than only
 *  ticking up on full-lesson completion. When the lesson finishes, the
 *  events for that lesson are subsumed into the immutable PendingAttempt
 *  and dropped from this buffer. */
export type StepEvent = {
  lessonId: string;
  stepId: string;
  stepIdx: number;
  correct: boolean;
  conceptIds: string[];
  recordedAt: string;
};

export function getStepEvents(): StepEvent[] {
  if (typeof window === "undefined") return [];
  migrateLegacyLessonKeys();
  try {
    const raw = localStorage.getItem(stepEventsKey());
    if (!raw) return [];
    const arr = JSON.parse(raw) as StepEvent[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function setStepEvents(events: StepEvent[]): void {
  if (typeof window === "undefined") return;
  migrateLegacyLessonKeys();
  try {
    localStorage.setItem(stepEventsKey(), JSON.stringify(events));
  } catch {
    /* ignore quota */
  }
}

export function appendStepEvent(event: StepEvent): void {
  const list = getStepEvents();
  // Dedupe on (lessonId, stepId) — a retry on the same step overwrites the
  // prior outcome. Matches the "last write wins" semantics of `results`.
  const idx = list.findIndex(
    (e) => e.lessonId === event.lessonId && e.stepId === event.stepId,
  );
  if (idx >= 0) {
    list[idx] = event;
  } else {
    list.push(event);
  }
  setStepEvents(list);
}

export function clearStepEventsForLesson(lessonId: string): void {
  const next = getStepEvents().filter((e) => e.lessonId !== lessonId);
  setStepEvents(next);
}

export function clearAllStepEvents(): void {
  setStepEvents([]);
}

/** A pending lesson attempt in the local buffer.
 *
 * Mirrors `BatchAttempt` from the API client. Stored verbatim so the buffer
 * can be POSTed as-is when the SyncManager flushes.
 */
export type PendingAttempt = BatchAttempt & {
  /** Local-only field — set when this attempt was added to the buffer. */
  bufferedAt: string;
};

export function getPendingAttempts(): PendingAttempt[] {
  if (typeof window === "undefined") return [];
  migrateLegacyLessonKeys();
  try {
    const raw = localStorage.getItem(bufferKey());
    if (!raw) return [];
    const arr = JSON.parse(raw) as PendingAttempt[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function setPendingAttempts(attempts: PendingAttempt[]): void {
  if (typeof window === "undefined") return;
  migrateLegacyLessonKeys();
  try {
    localStorage.setItem(bufferKey(), JSON.stringify(attempts));
  } catch {
    // ignore quota errors
  }
}

export function appendPendingAttempt(attempt: PendingAttempt): void {
  const list = getPendingAttempts();
  // Dedupe on clientAttemptId — if the same attempt is recorded twice
  // (e.g. user double-tapped Continue), keep the most recent payload.
  const idx = list.findIndex(
    (a) => a.clientAttemptId === attempt.clientAttemptId,
  );
  if (idx >= 0) {
    list[idx] = attempt;
  } else {
    list.push(attempt);
  }
  setPendingAttempts(list);
}

export function removePendingAttempts(ids: string[]): void {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const list = getPendingAttempts().filter(
    (a) => !idSet.has(a.clientAttemptId),
  );
  setPendingAttempts(list);
}

export function clearPendingAttempts(): void {
  if (typeof window === "undefined") return;
  migrateLegacyLessonKeys();
  localStorage.removeItem(bufferKey());
}

/** ISO timestamp of last successful lesson sync to backend. */
export function getLastLessonSyncAt(): string | null {
  if (typeof window === "undefined") return null;
  migrateLegacyLessonKeys();
  return localStorage.getItem(lastSyncKey());
}

export function setLastLessonSyncAt(iso: string): void {
  if (typeof window === "undefined") return;
  migrateLegacyLessonKeys();
  localStorage.setItem(lastSyncKey(), iso);
}

/** ISO timestamp when next auto-sync will run. */
export function getNextLessonSyncAt(): string | null {
  if (typeof window === "undefined") return null;
  migrateLegacyLessonKeys();
  return localStorage.getItem(nextSyncKey());
}

export function setNextLessonSyncAt(iso: string | null): void {
  if (typeof window === "undefined") return;
  migrateLegacyLessonKeys();
  if (iso == null) {
    localStorage.removeItem(nextSyncKey());
  } else {
    localStorage.setItem(nextSyncKey(), iso);
  }
}
