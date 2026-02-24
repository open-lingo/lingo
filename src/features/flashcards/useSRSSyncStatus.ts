import { useState, useEffect, useCallback } from "react";
import { getDirtyCards, getLastSrsSyncAt, getNextSrsSyncAt } from "./engine";

const POLL_MS = 2000;

/** Returns SRS sync status: dirty count, last sync timestamp, and next sync timestamp. Updates on poll + focus. */
export function useSRSSyncStatus() {
  const [status, setStatus] = useState(() => ({
    dirtyCount: Object.keys(getDirtyCards()).length,
    lastSyncAt: getLastSrsSyncAt(),
    nextSyncAt: getNextSrsSyncAt(),
  }));

  const refresh = useCallback(() => {
    setStatus({
      dirtyCount: Object.keys(getDirtyCards()).length,
      lastSyncAt: getLastSrsSyncAt(),
      nextSyncAt: getNextSrsSyncAt(),
    });
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return status;
}
