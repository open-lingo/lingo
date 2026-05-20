import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { performLessonSync } from "./engine";
import { useLessonSyncStatus } from "./useLessonSyncStatus";
import type { SyncSource } from "@/shared/components/sync/types";

/** Returns lesson sync source config for SyncManager. Visible when authenticated. */
export function useLessonSyncSource(): SyncSource {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { progress } = useApi();

  const { dirtyCount, lastSyncAt, nextSyncAt } = useLessonSyncStatus();

  const onSyncNow = useCallback(async () => {
    if (!progress) return;
    await performLessonSync((payload) => progress.batchAttempts(payload));
  }, [progress]);

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
