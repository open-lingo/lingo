import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { syncLessonProgressWithServer } from "./engine";
import { useLessonSyncStatus } from "./useLessonSyncStatus";
import type { SyncSource } from "@/shared/components/sync/types";

/** Returns lesson sync source config for SyncManager. Visible when authenticated. */
export function useLessonSyncSource(): SyncSource {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { progress } = useApi();
  const queryClient = useQueryClient();

  const { dirtyCount, lastSyncAt, nextSyncAt } = useLessonSyncStatus();

  const onSyncNow = useCallback(async () => {
    if (!progress) return;
    await syncLessonProgressWithServer({
      batch: (payload) => progress.batchAttempts(payload),
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
  };
}
