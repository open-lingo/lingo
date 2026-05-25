import { useEffect, useState, useCallback } from "react";
import {
  getLastLessonSyncAt,
  getLessonDirtyCount,
  getNextLessonSyncAt,
  subscribeLessonBuffer,
} from "./engine";

const POLL_MS = 2000;

/** Returns lesson sync status: dirty count + last/next sync timestamps.
 *
 *  Reactive to buffer changes (via subscribeLessonBuffer), plus polled
 *  and re-checked on window focus to catch cross-tab changes. */
export function useLessonSyncStatus() {
  const [status, setStatus] = useState(() => ({
    dirtyCount: getLessonDirtyCount(),
    lastSyncAt: getLastLessonSyncAt(),
    nextSyncAt: getNextLessonSyncAt(),
  }));

  const refresh = useCallback(() => {
    setStatus({
      dirtyCount: getLessonDirtyCount(),
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
