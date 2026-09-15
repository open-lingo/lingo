export {
  DRAFT_ATTEMPT_PREFIX,
  getLessonDirtyCount,
  isDraftAttemptId,
  isPendingAttemptDirty,
  performLessonSync,
  recordAttempt,
  recordStepEvent,
  subscribeLessonBuffer,
  type RecordAttemptInput,
} from "./lessonSync";
export {
  gcOldStepEvents,
  getPendingAttempts,
  getStepEvents,
  getLastLessonSyncAt,
  getNextLessonSyncAt,
  type PendingAttempt,
  type StepEvent,
} from "./lessonStorage";
export {
  clearStreakCheckMarker,
  markStreakCheckedToday,
  shouldCheckStreakOnNextSync,
} from "./sessionStreak";
export {
  FLUSH_MIN_INTERVAL_MS,
  flushLessonProgressToServer,
  hydrateLessonProgressFromServer,
  resetLessonSyncCoalescerForTests,
  syncLessonProgressWithServer,
  type LessonSyncOutcome,
} from "./progressSync";
