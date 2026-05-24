import { useEffect, useRef } from "react";
import { useApi } from "@/shared/api";
import {
  getPendingAttempts,
  getStepEvents,
  syncLessonProgressWithServer,
} from "./engine";
import { setNextLessonSyncAt } from "./engine/lessonStorage";

export const LESSON_SYNC_INTERVAL_MS = 30_000;

/**
 * Background sync + force-flush-on-exit for the lesson player. Mirrors
 * `useSRSyncSession` (the flashcard equivalent) — same beforeunload
 * guard, same fire-and-forget unmount sync, same interval cadence.
 *
 * Mount this once at the top of LessonPage / AlphabetLessonPage. It will:
 *  - Periodically POST pending attempts every 30s
 *  - Sync on unmount (navigate-away mid-lesson catches abandoned step events)
 *  - Warn on tab-close if there are unsynced attempts
 *
 * Note: orphan step events (mid-lesson) do not block tab-close — those are
 * local telemetry and get cleared by `performLessonSync` on the next call.
 * Only pending completed attempts surface the beforeunload warning.
 */
export function useLessonSyncSession(): void {
  const { progress } = useApi();
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!progress) return;
    isMountedRef.current = true;

    const runSync = () =>
      syncLessonProgressWithServer({
        batch: (p) => progress.batchAttempts(p),
        getMe: () => progress.getMe(),
      })
        .then(({ pushed }) => pushed)
        .catch(() => 0);

    const interval = setInterval(() => {
      void runSync();
      setNextLessonSyncAt(
        new Date(Date.now() + LESSON_SYNC_INTERVAL_MS).toISOString(),
      );
    }, LESSON_SYNC_INTERVAL_MS);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (getPendingAttempts().length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Fire-and-forget on unmount — catches navigate-away. We flush even
      // when only step events remain (no completed attempts) so the dirty
      // count visible in the SyncManager clears between lessons.
      if (getPendingAttempts().length > 0 || getStepEvents().length > 0) {
        runSync();
      }
    };
  }, [progress]);
}
