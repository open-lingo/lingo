/**
 * Partial-lesson progress persistence.
 *
 * Saves the in-flight state of a lesson (current step index, per-step
 * correctness results, when the run started) to localStorage so the user
 * can navigate away mid-lesson and pick up where they left off.
 *
 * Completion is tracked separately by `mockProgress.markLessonCompleted`;
 * once a lesson finishes the in-progress record is cleared. Stale records
 * older than {@link STALE_AFTER_MS} are dropped silently — coming back to
 * a half-finished lesson after two weeks is closer to starting over than
 * resuming.
 *
 * Versioned key (`_v1`) so future shape changes can chain a migration.
 *
 * Mirrors the try/catch + window-guard pattern of
 * `src/shared/domain/mockProgress.ts`.
 */

const KEY_PREFIX = "lingo_lesson_inprogress_v1_";

/** 14 days. Beyond this, a saved run is presumed abandoned. */
const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

export type LessonInProgress = {
  stepIdx: number;
  results: Record<string, boolean>;
  /** ISO 8601 timestamp of when the run was first persisted. */
  startedAt: string;
};

function storageKey(lessonId: string): string {
  return `${KEY_PREFIX}${lessonId}`;
}

/**
 * Read the saved in-progress record for this lesson, validating against the
 * current set of step ids. Returns `null` if:
 *   - storage is unavailable / record missing / parse failure
 *   - the record is older than {@link STALE_AFTER_MS}
 *   - any saved `results` key references a step id no longer in the lesson
 *     (curriculum drift since the run started)
 *   - the saved `stepIdx` is out of range for the current lesson
 *
 * When the record is invalid for any of these reasons it is also removed
 * from storage so subsequent reads are cheap.
 */
export function loadLessonInProgress(
  lessonId: string,
  validStepIds: ReadonlySet<string>,
  totalSteps: number,
): LessonInProgress | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(storageKey(lessonId));
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: LessonInProgress | null = null;
  try {
    parsed = JSON.parse(raw) as LessonInProgress;
  } catch {
    clearLessonInProgress(lessonId);
    return null;
  }
  if (
    !parsed ||
    typeof parsed.stepIdx !== "number" ||
    typeof parsed.startedAt !== "string" ||
    !parsed.results ||
    typeof parsed.results !== "object"
  ) {
    clearLessonInProgress(lessonId);
    return null;
  }

  const startedAtMs = Date.parse(parsed.startedAt);
  if (
    !Number.isFinite(startedAtMs) ||
    Date.now() - startedAtMs > STALE_AFTER_MS
  ) {
    clearLessonInProgress(lessonId);
    return null;
  }

  if (parsed.stepIdx < 0 || parsed.stepIdx >= totalSteps) {
    clearLessonInProgress(lessonId);
    return null;
  }

  for (const stepId of Object.keys(parsed.results)) {
    if (!validStepIds.has(stepId)) {
      clearLessonInProgress(lessonId);
      return null;
    }
  }

  return parsed;
}

export function saveLessonInProgress(
  lessonId: string,
  record: LessonInProgress,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(lessonId), JSON.stringify(record));
  } catch {
    // ignore quota errors
  }
}

export function clearLessonInProgress(lessonId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(lessonId));
  } catch {
    // ignore
  }
}

/** Drop every saved mid-lesson resume snapshot on this device. */
export function clearAllLessonInProgress(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(KEY_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
