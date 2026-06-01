import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api/provider";
import { useToast } from "@/shared/contexts/ToastContext";
import { clearAllLocalAppData } from "@/features/settings/storage";
import {
  getCookieConsent,
  saveCookieConsent,
  clearCookieConsent,
} from "@/shared/legal/cookieConsent";
import { privacyContactHref, privacyContactLabel } from "@/features/legal/legalConfig";
import { useUnblockUser } from "@/features/social/hooks/useSocialMutations";
import { SOCIAL_QUERY_KEYS } from "@/features/social/hooks/useSocial";

type AccountPrivacySectionProps = {
  /** When true, omit the section heading (parent panel already has a title). */
  embedded?: boolean;
};

export function AccountPrivacySection({ embedded = false }: AccountPrivacySectionProps) {
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuth();
  const { users, social } = useApi();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const consent = getCookieConsent();

  // Blocked users — only loaded when authed. The unblock mutation invalidates
  // this query on success so the row disappears immediately.
  const blocksQuery = useQuery({
    queryKey: SOCIAL_QUERY_KEYS.blocks,
    queryFn: ({ signal }) => social.listBlocks(signal),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const unblock = useUnblockUser();

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-text-muted">
        {t(
          "legal.settings.signInForPrivacy",
          "Sign in to manage cookies and your account data.",
        )}
      </p>
    );
  }

  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  const handleDeleteAccount = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    try {
      await users.deleteMe();
      clearAllLocalAppData(user?.sub ?? null);
      clearCookieConsent();
      showToast(t("legal.settings.deleteSuccess", "Account deleted"), "success");
      await logout();
      navigate("/landing", { replace: true });
    } catch {
      showToast(
        t("legal.settings.deleteFailed", "Could not delete account. Try again or contact us."),
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="space-y-4">
      {!embedded && (
        <>
          <h3 className="text-sm font-semibold text-text-primary">
            {t("legal.settings.privacyTitle", "Privacy & data")}
          </h3>
          <p className="text-xs text-text-secondary">
            {t(
              "legal.settings.privacyBlurb",
              "We store your learning progress and profile to run the app. We do not sell your personal information.",
            )}
          </p>
        </>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-primary">
          {t("legal.cookies.settingsTitle", "Advertising cookies")}
        </p>
        <p className="text-xs text-text-muted">
          {consent?.advertising
            ? t("legal.cookies.statusAdsOn", "Advertising cookies: allowed")
            : t("legal.cookies.statusAdsOff", "Advertising cookies: off")}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => saveCookieConsent(true)}
            className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-surface-muted"
          >
            {t("legal.cookies.allowAds", "Allow ads cookies")}
          </button>
          <button
            type="button"
            onClick={() => saveCookieConsent(false)}
            className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-surface-muted"
          >
            {t("legal.cookies.rejectAds", "Turn off ads cookies")}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-primary">
          {t("legal.settings.blockedTitle", "Blocked users")}
        </p>
        {blocksQuery.isLoading ? (
          <p className="text-xs text-text-muted">
            {t("common.loading", "Loading…")}
          </p>
        ) : (blocksQuery.data?.length ?? 0) === 0 ? (
          <p className="text-xs text-text-muted">
            {t(
              "legal.settings.blockedEmpty",
              "You haven't blocked anyone. Block someone from their profile to silence them everywhere.",
            )}
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {(blocksQuery.data ?? []).map((b) => (
              <li
                key={b.user_id}
                className="flex items-center gap-2 px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-text-primary">
                    {b.display_name || b.username}
                  </p>
                  <p className="truncate text-[10px] text-text-muted">
                    @{b.username}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={unblock.isPending}
                  onClick={() => unblock.mutate(b.user_id)}
                  className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
                >
                  {unblock.isPending && unblock.variables === b.user_id
                    ? "…"
                    : t("legal.settings.unblock", "Unblock")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-error/40 bg-error/5 p-3">
        <p className="text-xs font-medium text-text-primary">
          {t("legal.settings.deleteTitle", "Delete account")}
        </p>
        <p className="text-xs text-text-muted">
          {t(
            "legal.settings.deleteWarning",
            "Removes your profile and settings from our servers and clears local progress on this device. This cannot be undone. Your Auth0 login may still exist until you remove it there."
          )}
        </p>
        <label className="block text-xs text-text-secondary">
          {t("legal.settings.deleteConfirmLabel", 'Type DELETE to confirm')}
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="mt-1 w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          disabled={!canDelete || deleting}
          onClick={handleDeleteAccount}
          className="rounded-lg bg-error px-3 py-1.5 text-xs font-semibold text-white hover:bg-error/90 disabled:opacity-50"
        >
          {deleting
            ? t("common.loading", "Loading…")
            : t("legal.settings.deleteButton", "Delete my account")}
        </button>
      </div>

      <p className="text-xs text-text-muted">
        {t("legal.contactLabel", "Contact")}:{" "}
        <a href={privacyContactHref()} className="text-accent hover:underline">
          {privacyContactLabel()}
        </a>
      </p>
    </section>
  );
}
