import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api";
import { useToast } from "@/shared/contexts/ToastContext";
import { getDirtyCards, performSync } from "./engine";

const SYNC_INTERVAL_MS = 30_000;

/**
 * Hook to run background SRS sync during a flashcard session.
 * - Periodically syncs dirty cards every SYNC_INTERVAL_MS
 * - Shows a toast on successful sync
 * - Warns on beforeunload if there are unsynced changes
 *
 * Call when FlashcardTester mounts; cleanup happens on unmount.
 */
export function useSRSyncSession() {
  const { t } = useTranslation();
  const { srs } = useApi();
  const showToast = useToast().showToast;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

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
    };

    intervalRef.current = setInterval(syncAndNotify, SYNC_INTERVAL_MS);
    syncAndNotify();

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const dirty = getDirtyCards();
      if (Object.keys(dirty).length > 0) {
        e.preventDefault();
        e.returnValue = t("flashcards.syncUnsavedWarning", {
          defaultValue: "You have unsaved review progress. Leave anyway?",
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [srs, showToast, t]);
}
