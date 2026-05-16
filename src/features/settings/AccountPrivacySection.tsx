import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

export function AccountPrivacySection() {
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuth();
  const { users } = useApi();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const consent = getCookieConsent();

  if (!isAuthenticated) {
    return (
      <section className="space-y-2 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("legal.settings.privacyTitle", "Privacy")}
        </h3>
        <p className="text-xs text-text-muted">
          <Link to="/privacy" className="text-accent hover:underline">
            {t("legal.privacyLink", "Privacy Policy")}
          </Link>
        </p>
      </section>
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
    <section className="space-y-4 border-t border-border pt-6">
      <h3 className="text-sm font-semibold text-text-primary">
        {t("legal.settings.privacyTitle", "Privacy & data")}
      </h3>
      <p className="text-xs text-text-secondary">
        {t(
          "legal.settings.privacyBlurb",
          "We store your learning progress and profile to run the app. We do not sell your personal information."
        )}{" "}
        <Link to="/privacy" className="text-accent hover:underline">
          {t("legal.privacyLink", "Privacy Policy")}
        </Link>
      </p>

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

      <div className="space-y-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
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
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
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
