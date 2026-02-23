import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { useToast } from "@/shared/contexts/ToastContext";
import { getDirtyCards, performSync } from "./engine";

/**
 * Syncs any dirty SRS cards when the user returns to the app (e.g. after closing
 * the tab without waiting for sync). Runs once per mount when authenticated.
 */
export function SRSPendingSync() {
  const { isAuthenticated } = useAuth();
  const { srs } = useApi();
  const showToast = useToast().showToast;
  const { t } = useTranslation();
  const ranRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || ranRef.current) return;

    const dirty = getDirtyCards();
    if (Object.keys(dirty).length === 0) return;

    ranRef.current = true;
    performSync((p) => srs.sync(p))
      .then((count) => {
        if (count > 0) {
          showToast(
            t("flashcards.syncRestored", {
              count,
              defaultValue: "Synced {{count}} cards from previous session",
            }),
            "success",
          );
        }
      })
      .catch(() => {
        ranRef.current = false;
      });
  }, [isAuthenticated, srs, showToast, t]);

  return null;
}
