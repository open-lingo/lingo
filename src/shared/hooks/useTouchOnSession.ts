import { useEffect, useRef } from "react";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";

/**
 * Fire POST /progress/me/touch exactly once per browser session after auth.
 *
 * Backend ticks the daily streak and surfaces stale concepts. Errors are
 * swallowed (ProgressApi.touch returns null for 404/501 — pre-wire).
 */
export function useTouchOnSession(): void {
  const { isAuthenticated } = useAuth();
  const { progress } = useApi();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || firedRef.current) return;
    firedRef.current = true;
    progress.touch().catch(() => {
      /* server returns null for 501 / pre-wire; safe to ignore */
    });
  }, [isAuthenticated, progress]);
}
