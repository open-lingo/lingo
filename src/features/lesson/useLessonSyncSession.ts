import { useEffect, useRef } from "react";
import { useApi } from "@/shared/api";
import {
  getLessonDirtyCount,
  syncLessonProgressWithServer,
} from "./engine";

export const LESSON_SYNC_INTERVAL_MS = 30_000;

/**
 * Force-flush-on-exit for the lesson player.
 *
 * Fix 13 — the periodic interval used to live here AND in
 * ``LessonProgressHydrate``. Mounting both on a lesson page doubled
 * ``/progress/me`` refetches and Lambda invocations. ``LessonProgressHydrate``
 * (mounted globally) owns the periodic flush; this hook now only handles:
 *  - beforeunload guard so a mid-lesson tab-close warns the user
 *  - fire-and-forget flush on unmount so navigate-away catches abandoned
 *    step events
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

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (getLessonDirtyCount() > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Fire-and-forget on unmount — catches navigate-away. We flush even
      // when only step events remain (no completed attempts) so the dirty
      // count visible in the SyncManager clears between lessons.
      if (getLessonDirtyCount() > 0) {
        runSync();
      }
    };
  }, [progress]);
}
