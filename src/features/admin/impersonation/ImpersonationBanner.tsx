import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useImpersonation } from "./ImpersonationContext";
import { clearImpersonation } from "@/shared/auth/impersonation";
import { useApi } from "@/shared/api/provider";

/**
 * Sticky top banner shown WHENEVER the admin is impersonating a user.
 *
 * Hard rules from spec:
 *   - Cannot be dismissed. The ONLY exit is the Stop button.
 *   - Stop calls the BE stop endpoint (for audit trail), clears the
 *     sessionStorage state, invalidates every cached query (so /users/me
 *     and the like refetch as the admin again), and bounces the admin
 *     back to the user-detail page they started from.
 *
 * Yellow/warning tone is deliberate — the admin is acting on someone
 * else's account; the banner must always be visually loud.
 */
export function ImpersonationBanner() {
  const state = useImpersonation();
  const { admin } = useApi();
  const qc = useQueryClient();
  const navigate = useNavigate();

  if (state === null) return null;

  const displayName = state.targetDisplayName || state.targetUsername;

  const handleStop = async () => {
    try {
      // Fire the audit-log BE call first so even if the navigate
      // refresh is slow the trail records the stop. Failure here is
      // logged BE-side but must not block the FE Stop action — the
      // admin gets out of impersonation regardless.
      await admin.impersonateStop();
    } catch {
      // intentional: stop must succeed FE-side even if BE call fails.
    }
    clearImpersonation();
    // Force every cached query to refetch so /users/me etc. re-resolve
    // as the admin. Without this, banner clears but the page still
    // shows the target's data until the next natural staleTime tick.
    qc.invalidateQueries();
    // Bounce back to the admin user-detail page where the admin
    // originally started, if known.
    if (state.targetUserId) {
      navigate(`/admin/users/${encodeURIComponent(state.targetUserId)}`);
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="impersonation-banner"
      className="sticky top-0 z-[60] w-full border-b-2 border-amber-600 bg-amber-400 px-4 py-2 text-sm text-amber-950 shadow"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold">
            Acting as @{state.targetUsername}
          </span>
          {displayName !== state.targetUsername && (
            <span className="text-amber-900/80">({displayName})</span>
          )}
          <span className="text-xs text-amber-900/70">
            All actions are audit-logged with your admin id.
          </span>
        </div>
        <button
          type="button"
          onClick={handleStop}
          data-testid="impersonation-stop"
          className="rounded-md border border-amber-900 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-950 hover:bg-amber-50"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
