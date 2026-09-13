import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { useProgressMe } from "@/shared/hooks/useProgressMe";
import { ensureUserConsistency } from "@/features/settings/storage";
import { LESSON_SYNC_INTERVAL_MS } from "./useLessonSyncSession";
import { setNextLessonSyncAt } from "./engine/lessonStorage";

// `./engine`'s barrel re-exports the grammar-SRS module, which statically
// pulls the full JA course-atom table — none of it is needed for the
// mount-time housekeeping below (all inside effects), so load on demand.
const lessonEngine = () => import("./engine");

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
    void lessonEngine().then(({ gcOldStepEvents }) => {
      try {
        gcOldStepEvents();
      } catch {
        /* ignore */
      }
    });
  }, []);

  // After /progress/me has loaded, push any buffered attempts then refresh summary.
  useEffect(() => {
    if (!isProgressReady || !isAuthenticated) return;

    void (async () => {
      try {
        const { syncLessonProgressWithServer } = await lessonEngine();
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

    // Exponential backoff on failure. Without it the buffer hammers the
    // server every 30s forever if the user has a poison-pill attempt
    // (durationSec from an abandoned-tab buffer, etc.). Cap at 10 minutes.
    let backoffMs = LESSON_SYNC_INTERVAL_MS;
    const MAX_BACKOFF_MS = 10 * 60 * 1000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    void lessonEngine().then(({ getLessonDirtyCount, syncLessonProgressWithServer }) => {
      if (cancelled) return;

      const scheduleNext = (delay: number) => {
        setNextLessonSyncAt(new Date(Date.now() + delay).toISOString());
        timeoutId = setTimeout(runIfDirty, delay);
      };

      const runIfDirty = () => {
        if (getLessonDirtyCount() === 0) {
          // Nothing to do — reset backoff and sleep at the base interval.
          backoffMs = LESSON_SYNC_INTERVAL_MS;
          scheduleNext(LESSON_SYNC_INTERVAL_MS);
          return;
        }
        void syncLessonProgressWithServer({
          batch: (payload) => progress.batchAttempts(payload),
          getMe: () => progress.getMe(),
        })
          .then(() => {
            backoffMs = LESSON_SYNC_INTERVAL_MS;
            void queryClient.invalidateQueries({ queryKey: ["progress", "me"] });
            void refetch();
          })
          .catch(() => {
            backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
          })
          .finally(() => {
            scheduleNext(backoffMs);
          });
      };

      runIfDirty();
    });

    return () => {
      cancelled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
      setNextLessonSyncAt(null);
    };
  }, [authLoading, isAuthenticated, progress, queryClient, refetch]);

  return null;
}
