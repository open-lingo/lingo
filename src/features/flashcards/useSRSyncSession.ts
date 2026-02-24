import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api";
import { useToast } from "@/shared/contexts/ToastContext";
import { getDirtyCards, performSync, setNextSrsSyncAt } from "./engine";

export const SYNC_INTERVAL_MS = 30_000;
const DIRTY_POLL_MS = 2_000;

/**
 * Hook to run background SRS sync during a flashcard session.
 * - Periodically syncs dirty cards every SYNC_INTERVAL_MS
 * - Syncs on unmount when leaving the reviewer (fire-and-forget)
 * - Shows a toast on successful sync
 * - Warns on beforeunload if there are unsynced changes
 *
 * Returns dirtyCount for showing an unsaved indicator.
 */
export function useSRSyncSession(): { dirtyCount: number } {
  const { t } = useTranslation();
  const { srs } = useApi();
  const showToast = useToast().showToast;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const [dirtyCount, setDirtyCount] = useState(0);

  const runSync = async (): Promise<number> => {
    try {
      return await performSync((payload) => srs.sync(payload));
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const syncAndNotify = async () => {
      const count = await runSync();
      if (isMountedRef.current && count > 0) {
        showToast(
          t("flashcards.syncSynced", { count, defaultValue: "Synced {{count}} cards" }),
          "success",
        );
      }
      if (isMountedRef.current) {
        setDirtyCount(Object.keys(getDirtyCards()).length);
        setNextSrsSyncAt(new Date(Date.now() + SYNC_INTERVAL_MS).toISOString());
      }
    };

    const pollDirty = () => {
      if (isMountedRef.current) {
        setDirtyCount(Object.keys(getDirtyCards()).length);
      }
    };

    intervalRef.current = setInterval(syncAndNotify, SYNC_INTERVAL_MS);
    syncAndNotify();
    pollDirty();
    const dirtyInterval = setInterval(pollDirty, DIRTY_POLL_MS);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const dirty = getDirtyCards();
      if (Object.keys(dirty).length > 0) {
        e.preventDefault();
        e.returnValue = t("flashcards.syncUnsavedWarning", {
          defaultValue:
            "You have unsaved review progress. Please wait for sync to complete, or your progress will be synced when you return. Leave anyway?",
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      isMountedRef.current = false;
      setNextSrsSyncAt(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearInterval(dirtyInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Fire-and-forget sync on unmount – catches navigate-away before next interval
      const dirty = getDirtyCards();
      if (Object.keys(dirty).length > 0) {
        performSync((p) => srs.sync(p)).catch(() => {});
      }
    };
  }, [srs, showToast, t]);

  return { dirtyCount };
}
