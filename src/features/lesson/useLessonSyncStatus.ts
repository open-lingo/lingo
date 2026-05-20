import { useEffect, useState, useCallback } from "react";
import {
  getLastLessonSyncAt,
  getNextLessonSyncAt,
  getPendingAttempts,
  getStepEvents,
  subscribeLessonBuffer,
} from "./engine";

const POLL_MS = 2000;

/** Returns lesson sync status: dirty count + last/next sync timestamps.
 *
 *  Reactive to buffer changes (via subscribeLessonBuffer), plus polled
 *  and re-checked on window focus to catch cross-tab changes. */
export function useLessonSyncStatus() {
  // dirtyCount = lesson attempts buffered + per-step events accrued since
  // the last attempt landed. Step events aren't synced on their own (they
  // collapse into the attempt on lesson end), but counting them lets the
  // SyncManager badge tick per step instead of only on lesson completion.
  const [status, setStatus] = useState(() => ({
    dirtyCount: getPendingAttempts().length + getStepEvents().length,
    lastSyncAt: getLastLessonSyncAt(),
    nextSyncAt: getNextLessonSyncAt(),
  }));

  const refresh = useCallback(() => {
    setStatus({
      dirtyCount: getPendingAttempts().length + getStepEvents().length,
      lastSyncAt: getLastLessonSyncAt(),
      nextSyncAt: getNextLessonSyncAt(),
    });
  }, []);

  useEffect(() => {
    const unsub = subscribeLessonBuffer(refresh);
    const id = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      unsub();
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return status;
}
