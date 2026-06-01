import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { useProgressMe } from "@/shared/hooks/useProgressMe";
import { ensureUserConsistency } from "@/features/settings/storage";
import {
  gcOldStepEvents,
  getLessonDirtyCount,
  syncLessonProgressWithServer,
} from "./engine";
import { LESSON_SYNC_INTERVAL_MS } from "./useLessonSyncSession";
import { setNextLessonSyncAt } from "./engine/lessonStorage";

/**
 * Lesson rollups hydrate via useProgressMe (react-query, retries).
 * This component only flushes buffered attempts after auth is ready.
 */
export function LessonProgressHydrate() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { progress } = useApi();
  const queryClient = useQueryClient();
  const { isProgressReady, refetch } = useProgressMe();

  useEffect(() => {
    const userId = user?.sub;
    if (authLoading || !isAuthenticated || !userId) return;
    ensureUserConsistency(userId, { authLoading: false });
  }, [authLoading, isAuthenticated, user?.sub]);

  // Fix H9 — one-shot GC of orphaned step events at app boot. Step events
  // older than 30 days were never going to make it to the server (a draft
  // for that lesson, if any, will already have synced or been collected),
  // so drop them so they don't accumulate into the quota over months of use.
  useEffect(() => {
    try {
      gcOldStepEvents();
    } catch {
      /* ignore */
    }
  }, []);

  // After /progress/me has loaded, push any buffered attempts then refresh summary.
  useEffect(() => {
    if (!isProgressReady || !isAuthenticated) return;

    void (async () => {
      try {
        await syncLessonProgressWithServer({
          batch: (payload) => progress.batchAttempts(payload),
          getMe: () => progress.getMe(),
        });
        void queryClient.invalidateQueries({ queryKey: ["progress", "me"] });
        void queryClient.invalidateQueries({ queryKey: ["core", "quests", "list"] });
        void refetch();
      } catch {
        /* buffer stays dirty for next interval */
      }
    })();
  }, [isProgressReady, isAuthenticated, progress, queryClient, refetch]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const runIfDirty = () => {
      if (getLessonDirtyCount() === 0) return;
      void syncLessonProgressWithServer({
        batch: (payload) => progress.batchAttempts(payload),
        getMe: () => progress.getMe(),
      })
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: ["progress", "me"] });
          void refetch();
        })
        .catch(() => {});
      setNextLessonSyncAt(
        new Date(Date.now() + LESSON_SYNC_INTERVAL_MS).toISOString(),
      );
    };

    runIfDirty();
    const interval = setInterval(runIfDirty, LESSON_SYNC_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      setNextLessonSyncAt(null);
    };
  }, [authLoading, isAuthenticated, progress, queryClient, refetch]);

  return null;
}
