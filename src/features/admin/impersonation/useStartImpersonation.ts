import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
import { useToast } from "@/shared/contexts/ToastContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { setImpersonation } from "@/shared/auth/impersonation";

/**
 * Start "act as user" impersonation for a target user id.
 *
 * Extracted from AdminUserDetailPage so any admin-gated surface (the public
 * profile dropdown, contributors, etc.) can trigger the same audited flow:
 *   1. POST /admin/impersonate/start
 *   2. persist sessionStorage state (so ApiClient attaches the header)
 *   3. invalidate every query (re-paints as the impersonated identity)
 *   4. bounce to /learn — the impersonated user's natural landing
 *
 * The caller owns the confirmation gate (e.g. ImpersonateConfirmModal); this
 * hook only performs the start once confirmed.
 */
export function useStartImpersonation() {
  const { admin } = useApi();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const langPath = useLangPath();
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);

  const start = useCallback(
    async (userId: string) => {
      setPending(true);
      try {
        const res = await admin.impersonateStart(userId);
        // Persist BEFORE invalidating so the next refetch carries the header.
        setImpersonation({
          targetUserId: res.target_user_id,
          targetUsername: res.target_username,
          targetDisplayName: res.target_display_name,
          adminUserId: "",
        });
        qc.invalidateQueries();
        showToast(
          t("admin.impersonate.started", "Now acting as @{{name}}", {
            name: res.target_username,
          }),
          "success",
        );
        navigate(langPath("learn"));
        return true;
      } catch {
        showToast(
          t("admin.impersonate.error", "Failed to start impersonation"),
          "error",
        );
        return false;
      } finally {
        setPending(false);
      }
    },
    [admin, qc, showToast, t, navigate, langPath],
  );

  return { start, pending };
}
