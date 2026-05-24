import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { ensureUserConsistency } from "@/features/settings/storage";
import {
  getPendingAttempts,
  hydrateLessonProgressFromServer,
  syncLessonProgressWithServer,
} from "./engine";
import { LESSON_SYNC_INTERVAL_MS } from "./useLessonSyncSession";
import { setNextLessonSyncAt } from "./engine/lessonStorage";

/**
 * On sign-in: hydrate lesson completions from GET /progress/me, then flush
 * any buffered attempts. While signed in, periodically POST pending attempts
 * (mirrors SRSPendingSync — lesson sync is not limited to the lesson page).
 */
export function LessonProgressHydrate() {
  const { isAuthenticated, user } = useAuth();
  const { progress } = useApi();
  const queryClient = useQueryClient();
  const ranForUserRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.sub;
    if (!isAuthenticated || !userId) {
      ranForUserRef.current = null;
      return;
    }
    if (ranForUserRef.current === userId) return;
    ranForUserRef.current = userId;
    ensureUserConsistency(userId);

    const sync = () =>
      syncLessonProgressWithServer({
        batch: (payload) => progress.batchAttempts(payload),
        getMe: () => progress.getMe(),
      }).then(() => {
        void queryClient.invalidateQueries({ queryKey: ["progress", "me"] });
      });

    (async () => {
      try {
        await hydrateLessonProgressFromServer(() => progress.getMe());
      } catch {
        /* local cache may still be usable */
      }
      try {
        await sync();
      } catch {
        ranForUserRef.current = null;
      }
    })();
  }, [isAuthenticated, user?.sub, progress, queryClient]);

  // Background flush anywhere in the app when attempts are buffered.
  useEffect(() => {
    if (!isAuthenticated) return;

    const runIfDirty = () => {
      if (getPendingAttempts().length === 0) return;
      void syncLessonProgressWithServer({
        batch: (payload) => progress.batchAttempts(payload),
        getMe: () => progress.getMe(),
      })
        .then(() => {
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
  }, [isAuthenticated, progress, queryClient]);

  return null;
}
