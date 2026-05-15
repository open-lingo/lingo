import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { useToast } from "@/shared/contexts/ToastContext";
import { getDirtyCards, performSync, hydrateFromServer } from "./engine";

/**
 * On load when authenticated: hydrates local SRS store from the server (so Card Manager
 * and due counts show correct state after refresh), then syncs any dirty local cards.
 */
export function SRSPendingSync() {
  const { isAuthenticated } = useAuth();
  const { srs } = useApi();
  const showToast = useToast().showToast;
  const { t } = useTranslation();
  const ranRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || ranRef.current) return;

    ranRef.current = true;

    (async () => {
      try {
        await hydrateFromServer(() => srs.getState());
      } catch {
        // Non-fatal: local state may still be usable
      }
      try {
        const dirty = getDirtyCards();
        if (Object.keys(dirty).length > 0) {
          const count = await performSync((p) => srs.sync(p));
          if (count > 0) {
            showToast(
              t("flashcards.syncRestored", {
                count,
                defaultValue: "Synced {{count}} cards from previous session",
              }),
              "success",
            );
          }
        }
      } catch {
        ranRef.current = false;
      }
    })();
  }, [isAuthenticated, srs, showToast, t]);

  return null;
}
