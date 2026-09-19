import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { syncLessonProgressWithServer } from "./engine";
import { useLessonSyncStatus } from "./useLessonSyncStatus";
import { useProgressMe } from "@/shared/hooks/useProgressMe";
import {
  formatReconcileStatusLine,
  readReconcileStatus,
  reconcileLocalProgressToServer,
} from "@/shared/domain/progressReconcile";
import { emitProgressChanged } from "@/shared/domain/progressEvents";
import type { SyncSource } from "@/shared/components/sync/types";

/** Returns lesson sync source config for SyncManager. Visible when authenticated. */
export function useLessonSyncSource(): SyncSource {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { progress } = useApi();

  const { dirtyCount, lastSyncAt, nextSyncAt } = useLessonSyncStatus();
  const { summary } = useProgressMe();
  const userId = user?.sub;

  // Reconcile diagnostic (b20). The status is written on EVERY pass,
  // including a skip, so "it did nothing" always names a reason instead of
  // needing a CloudWatch query.
  const [reconcileLine, setReconcileLine] = useState(() =>
    formatReconcileStatusLine(userId ? readReconcileStatus(userId) : null),
  );
  const refreshReconcileLine = useCallback(() => {
    setReconcileLine(
      formatReconcileStatusLine(userId ? readReconcileStatus(userId) : null),
    );
  }, [userId]);
  useEffect(refreshReconcileLine, [refreshReconcileLine, dirtyCount, summary]);

  const reconcileNow = useCallback(async () => {
    if (!progress || !userId) return;
    await reconcileLocalProgressToServer({
      userId,
      serverLessons: summary?.lessons ?? [],
      batch: (payload) => progress.bulkComplete(payload),
      // The whole point of the button: ignore the marker.
      force: true,
    });
    refreshReconcileLine();
    emitProgressChanged("reconcile_push");
  }, [progress, userId, summary, refreshReconcileLine]);

  const onSyncNow = useCallback(async () => {
    if (!progress) return;
    await syncLessonProgressWithServer({
      batch: (payload) => progress.batchAttempts(payload),
      bulkComplete: (payload) => progress.bulkComplete(payload),
      getMe: () => progress.getMe(),
    });
    // Lesson completions advance quests via the async pipeline — the
    // subscriber (useProgressChangeInvalidation) invalidates both
    // progress/me and the quest list for this reason.
    emitProgressChanged("lesson_end");
  }, [progress]);

  return {
    id: "lessons",
    label: t("syncManager.lessonsLabel", { defaultValue: "Lessons" }),
    lastSyncAt,
    nextSyncAt,
    dirtyCount,
    onSyncNow,
    visible: isAuthenticated,
    diagnostic: {
      line: reconcileLine,
      actionLabel: t("syncManager.reconcileNow", { defaultValue: "Reconcile now" }),
      onAction: reconcileNow,
    },
  };
}
