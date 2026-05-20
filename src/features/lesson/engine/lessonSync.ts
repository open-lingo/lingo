import type {
  BatchAttempt,
  BatchAttemptResponse,
  BatchAttemptSubmission,
  GradedStepResult,
} from "@/shared/api/progress";
import {
  appendPendingAttempt,
  appendStepEvent,
  clearStepEventsForLesson,
  getPendingAttempts,
  removePendingAttempts,
  setLastLessonSyncAt,
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

export interface RecordAttemptInput {
  lessonId: string;
  durationSec: number;
  passed: boolean;
  score: number;
  stepResults: GradedStepResult[];
}

/** Buffer a per-step event. Fires as each step is graded inside a lesson.
 *
 *  These events are client-side telemetry that powers the SyncManager's
 *  dirty-count signal — the user sees activity tick up as they answer
 *  individual questions, not only on lesson end.
 *
 *  When the lesson finishes, `recordAttempt` is called and `clearStepEventsForLesson`
 *  drops the events for that lesson (they're now embedded in the immutable
 *  PendingAttempt's stepResults). Step events are not synced to the server
 *  on their own — the aggregated attempt is the source of truth. */
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
  notify();
}

/** Buffer a completed lesson attempt locally. The SyncManager flushes the
 *  buffer to the server in batch — there is no per-completion API call.
 *
 *  Idempotent: if the same `clientAttemptId` is recorded twice (e.g. user
 *  double-taps Continue) only the latest payload is kept.
 *
 *  Side effect: clears the step-event buffer for this lesson — the events
 *  are now subsumed into the immutable attempt's stepResults. */
export function recordAttempt(input: RecordAttemptInput): PendingAttempt {
  const attempt: PendingAttempt = {
    clientAttemptId: newAttemptId(),
    lessonId: input.lessonId,
    attemptedAt: new Date().toISOString(),
    bufferedAt: new Date().toISOString(),
    durationSec: Math.max(1, Math.floor(input.durationSec)),
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
  const pending = getPendingAttempts();
  // Strip the local-only `bufferedAt` before sending — server doesn't need it.
  const attempts: BatchAttempt[] = pending.map((p) => {
    const { bufferedAt: _bufferedAt, ...rest } = p;
    return rest;
  });
  const checkStreak = shouldCheckStreakOnNextSync();
  return {
    payload: { attempts, checkStreak },
    ids: pending.map((p) => p.clientAttemptId),
  };
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
  if (ids.length === 0) return 0;

  const response = await syncFn(payload);
  const accepted = response.results.filter((r) => r.accepted);
  const acceptedIds = accepted.map((r) => r.clientAttemptId);

  if (acceptedIds.length > 0) {
    removePendingAttempts(acceptedIds);
    setLastLessonSyncAt(new Date().toISOString());
    // Server processed (or no-op'd) the streak update on this sync — mark it
    // done so the next batch this same local day skips the streak path on the
    // server side. If the user crosses local midnight, `shouldCheckStreakOnNextSync`
    // will flip back to true and the next sync re-asks.
    if (payload.checkStreak) {
      markStreakCheckedToday();
    }
  }

  notify();
  return acceptedIds.length;
}
