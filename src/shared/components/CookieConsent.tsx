import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { hasCookieConsentDecision, saveCookieConsent } from "@/shared/legal/cookieConsent";

/**
 * GDPR-style banner for optional advertising cookies (AdSense).
 * Essential cookies/local storage for auth and learning are always used.
 */
export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasCookieConsentDecision());
    const onChange = () => setVisible(!hasCookieConsentDecision());
    window.addEventListener("open-lingo-cookie-consent", onChange);
    return () => window.removeEventListener("open-lingo-cookie-consent", onChange);
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    saveCookieConsent(true);
    setVisible(false);
  };

  const essentialOnly = () => {
    saveCookieConsent(false);
    setVisible(false);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[var(--funding-meter-height,4.5rem)] z-50 px-3 sm:px-6">
      <div
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-desc"
        className="pointer-events-auto mx-auto flex max-w-2xl flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-popover sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-6"
      >
        <div className="min-w-0 flex-1">
          <p id="cookie-consent-title" className="text-sm font-semibold text-text-primary">
            {t("legal.cookies.bannerTitle", "Cookies on Open Lingo")}
          </p>
          <p id="cookie-consent-desc" className="mt-1 text-xs leading-relaxed text-text-secondary">
            {t(
              "legal.cookies.bannerBody",
              "We use essential storage for sign-in and your learning progress. With your permission, we also allow advertising cookies (e.g. Google AdSense) to help fund the free tier. We do not sell your personal information."
            )}{" "}
            <Link to="/privacy" className="font-medium text-accent hover:underline">
              {t("legal.privacyLink", "Privacy Policy")}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={essentialOnly}
            className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-text-primary transition hover:bg-surface-muted"
          >
            {t("legal.cookies.essentialOnly", "Essential only")}
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover"
          >
            {t("legal.cookies.acceptAll", "Accept all")}
          </button>
        </div>
      </div>
    </div>
  );
}
