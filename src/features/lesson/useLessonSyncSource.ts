import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import type { SyncSource } from "@/shared/components/sync/types";

/** Returns lesson sync source config for SyncManager. Visible when authenticated. */
export function useLessonSyncSource(): SyncSource {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { progress } = useApi();
  const queryClient = useQueryClient();

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
    void queryClient.invalidateQueries({ queryKey: ["progress", "me"] });
  }, [progress, userId, summary, refreshReconcileLine, queryClient]);

  const onSyncNow = useCallback(async () => {
    if (!progress) return;
    await syncLessonProgressWithServer({
      batch: (payload) => progress.batchAttempts(payload),
      bulkComplete: (payload) => progress.bulkComplete(payload),
      getMe: () => progress.getMe(),
    });
    void queryClient.invalidateQueries({ queryKey: ["progress", "me"] });
    // Lesson completions advance quests via the async pipeline. Refetch
    // the quest list so the UI reflects the new server-side progress.
    void queryClient.invalidateQueries({ queryKey: ["core", "quests", "list"] });
  }, [progress, queryClient]);

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
