import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { ensureUserConsistency } from "@/features/settings/storage";
import { refreshLessonProgressFromStorage } from "@/shared/domain/mockProgress";
import {
  getPendingAttempts,
  hydrateLessonProgressFromServer,
  syncLessonProgressWithServer,
} from "./engine";
import { LESSON_SYNC_INTERVAL_MS } from "./useLessonSyncSession";
import { setNextLessonSyncAt } from "./engine/lessonStorage";

/**
 * After auth is ready: hydrate lesson completions from GET /progress/me, flush
 * buffered attempts, and keep pulling while signed in.
 */
export function LessonProgressHydrate() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { progress } = useApi();
  const queryClient = useQueryClient();
  const hydratedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.sub;
    if (authLoading || !isAuthenticated || !userId) {
      if (!authLoading && !isAuthenticated) {
        hydratedForUserRef.current = null;
      }
      return;
    }

    ensureUserConsistency(userId, { authLoading: false });
    refreshLessonProgressFromStorage();

    if (hydratedForUserRef.current === userId) return;
    hydratedForUserRef.current = userId;

    (async () => {
      try {
        await hydrateLessonProgressFromServer(() => progress.getMe());
        refreshLessonProgressFromStorage();
      } catch {
        /* local cache may still be usable */
      }
      try {
        await syncLessonProgressWithServer({
          batch: (payload) => progress.batchAttempts(payload),
          getMe: () => progress.getMe(),
        });
        refreshLessonProgressFromStorage();
        void queryClient.invalidateQueries({ queryKey: ["progress", "me"] });
      } catch {
        hydratedForUserRef.current = null;
      }
    })();
  }, [authLoading, isAuthenticated, user?.sub, progress, queryClient]);

  // Background flush anywhere in the app when attempts are buffered.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const runIfDirty = () => {
      if (getPendingAttempts().length === 0) return;
      void syncLessonProgressWithServer({
        batch: (payload) => progress.batchAttempts(payload),
        getMe: () => progress.getMe(),
      })
        .then(() => {
          refreshLessonProgressFromStorage();
          void queryClient.invalidateQueries({ queryKey: ["progress", "me"] });
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
  }, [authLoading, isAuthenticated, progress, queryClient]);

  return null;
}
