import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { performSync } from "./engine";
import { useSRSSyncStatus } from "./useSRSSyncStatus";
import type { SyncSource } from "@/shared/components/sync/types";

/** Returns SRS sync source config for SyncManager. Visible when authenticated. */
export function useSRSSyncSource(): SyncSource {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { srs } = useApi();

  const { dirtyCount, lastSyncAt, nextSyncAt } = useSRSSyncStatus();

  const onSyncNow = useCallback(async () => {
    if (!srs) return;
    await performSync((payload) => srs.sync(payload));
  }, [srs]);

  return {
    id: "srs",
    label: t("syncManager.srsLabel", { defaultValue: "Flashcards" }),
    lastSyncAt,
    nextSyncAt,
    dirtyCount,
    onSyncNow,
    visible: isAuthenticated,
  };
}
