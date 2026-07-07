import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api";
import { useToast } from "@/shared/contexts/ToastContext";
import {
  getDirtyCards,
  performSync,
  mergeServerState,
  getDirtyGrammarCards,
  performGrammarSync,
  mergeGrammarStore,
  partitionSyncStore,
} from "./engine";
import { notifySRSStoreChanged } from "./SRSStoreRevisionContext";

/**
 * On load when authenticated: hydrates local SRS store from the server (so Card Manager
 * and due counts show correct state after refresh), then syncs any dirty local cards.
 *
 * Fetches `/srs/state` ONCE and partitions it into vocab (Track A) and
 * grammar (Track B, `grammar:`-namespaced) slices before merging — the two
 * tracks share this one endpoint (see `grammarSync.ts` doc), and merging
 * the raw response through Track A's `mergeServerState` unpartitioned would
 * ingest `grammar:*` keys as bogus vocab cards.
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
        const fullState = await srs.getState();
        const { vocab, grammar } = partitionSyncStore(fullState ?? {});
        if (Object.keys(vocab).length > 0) mergeServerState(vocab);
        mergeGrammarStore(grammar);
        notifySRSStoreChanged();
      } catch {
        // Non-fatal: local state may still be usable
      }
      try {
        let count = 0;
        if (Object.keys(getDirtyCards()).length > 0) {
          count += await performSync((p) => srs.sync(p));
        }
        if (Object.keys(getDirtyGrammarCards()).length > 0) {
          count += await performGrammarSync((p) => srs.sync(p));
        }
        if (count > 0) {
          showToast(
            t("flashcards.syncRestored", {
              count,
              defaultValue: "Synced {{count}} cards from previous session",
            }),
            "success",
          );
        }
      } catch {
        ranRef.current = false;
      }
    })();
  }, [isAuthenticated, srs, showToast, t]);

  return null;
}
