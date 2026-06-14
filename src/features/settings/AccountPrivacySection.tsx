import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api/provider";
import { useToast } from "@/shared/contexts/ToastContext";
import { Icon } from "@/shared/components/Icon";
import { Switch } from "@/shared/components/ui/Switch";
import { clearAllLocalAppData } from "@/features/settings/storage";
import {
  getCookieConsent,
  saveCookieConsent,
  clearCookieConsent,
} from "@/shared/legal/cookieConsent";
import { privacyContactHref, privacyContactLabel } from "@/features/legal/legalConfig";
import { useUnblockUser } from "@/features/social/hooks/useSocialMutations";
import { SOCIAL_QUERY_KEYS } from "@/features/social/hooks/useSocial";
import { SettingsGroup, SettingRow } from "./SettingsPrimitives";

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
  const [adsAllowed, setAdsAllowed] = useState(
    () => getCookieConsent()?.advertising ?? false,
  );

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

  const setAds = (next: boolean) => {
    setAdsAllowed(next);
    saveCookieConsent(next);
  };

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

  const blocks = blocksQuery.data ?? [];

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-text-primary">
            {t("legal.settings.privacyTitle", "Privacy & data")}
          </h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            {t(
              "legal.settings.privacyBlurb",
              "We store your learning progress and profile to run the app. We do not sell your personal information.",
            )}
          </p>
        </div>
      ) : null}

      <SettingsGroup label={t("legal.cookies.cookiesGroup", "Cookies")}>
        <SettingRow
          asLabel
          label={t("legal.cookies.settingsTitle", "Advertising cookies")}
          help={t(
            "legal.cookies.settingsHelp",
            "Allow cookies that personalize the ads you see.",
          )}
          control={
            <Switch
              checked={adsAllowed}
              onCheckedChange={setAds}
              ariaLabel={t("legal.cookies.settingsTitle", "Advertising cookies")}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup label={t("legal.settings.blockedTitle", "Blocked users")}>
        {blocksQuery.isLoading ? (
          <p className="px-4 py-3.5 text-sm text-text-muted">
            {t("common.loading", "Loading…")}
          </p>
        ) : blocks.length === 0 ? (
          <p className="px-4 py-3.5 text-sm text-text-muted">
            {t(
              "legal.settings.blockedEmpty",
              "You haven't blocked anyone. Block someone from their profile to silence them everywhere.",
            )}
          </p>
        ) : (
          blocks.map((b) => (
            <div
              key={b.user_id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {b.display_name || b.username}
                </p>
                <p className="truncate text-xs text-text-muted">@{b.username}</p>
              </div>
              <button
                type="button"
                disabled={unblock.isPending}
                onClick={() => unblock.mutate(b.user_id)}
                className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
              >
                {unblock.isPending && unblock.variables === b.user_id
                  ? "…"
                  : t("legal.settings.unblock", "Unblock")}
              </button>
            </div>
          ))
        )}
      </SettingsGroup>

      <section className="space-y-3 rounded-xl border border-error/40 bg-error/5 p-4">
        <div className="space-y-1">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-error">
            <Icon name="alertTriangle" size={14} aria-hidden />
            {t("legal.settings.deleteTitle", "Delete account")}
          </h4>
          <p className="max-w-md text-sm text-text-muted">
            {t(
              "legal.settings.deleteWarning",
              "Removes your profile and settings from our servers and clears local progress on this device. This cannot be undone. Your Auth0 login may still exist until you remove it there.",
            )}
          </p>
        </div>
        <label className="block space-y-1 text-sm text-text-secondary">
          <span>{t("legal.settings.deleteConfirmLabel", "Type DELETE to confirm")}</span>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:border-error focus:outline-none focus:ring-1 focus:ring-error"
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          disabled={!canDelete || deleting}
          onClick={handleDeleteAccount}
          className="rounded-lg bg-error px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-error/90 disabled:opacity-50"
        >
          {deleting
            ? t("common.loading", "Loading…")
            : t("legal.settings.deleteButton", "Delete my account")}
        </button>
      </section>

      <p className="text-sm text-text-muted">
        {t("legal.contactLabel", "Contact")}:{" "}
        <a href={privacyContactHref()} className="text-accent hover:underline">
          {privacyContactLabel()}
        </a>
      </p>
    </div>
  );
}
