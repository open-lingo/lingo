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
      {/* Slim single bar on mobile so it never buries the hero CTA; expands
          to the full card (title + detail) only at sm+. */}
      <div
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-desc"
        className="pointer-events-auto mx-auto flex max-w-2xl items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-popover sm:items-start sm:justify-between sm:gap-6 sm:rounded-card sm:p-6"
      >
        <div className="min-w-0 flex-1">
          <p
            id="cookie-consent-title"
            className="hidden text-sm font-semibold text-text-primary sm:block"
          >
            {t("legal.cookies.bannerTitle", "Cookies on Open Lingo")}
          </p>
          <p
            id="cookie-consent-desc"
            className="text-xs leading-relaxed text-text-secondary sm:mt-1"
          >
            <span className="sm:hidden">
              {t(
                "legal.cookies.bannerBodyShort",
                "We use cookies to run the app and fund the free tier.",
              )}{" "}
            </span>
            <span className="hidden sm:inline">
              {t(
                "legal.cookies.bannerBody",
                "We use essential storage for sign-in and your learning progress. With your permission, we also allow advertising cookies (e.g. Google AdSense) to help fund the free tier. We do not sell your personal information.",
              )}{" "}
            </span>
            <Link to="/privacy" className="font-medium text-accent hover:underline">
              {t("legal.privacyLink", "Privacy Policy")}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={essentialOnly}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary transition hover:bg-surface-muted sm:px-4 sm:py-2"
          >
            {t("legal.cookies.essentialOnly", "Essential only")}
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent transition hover:bg-accent-hover sm:px-4 sm:py-2"
          >
            {t("legal.cookies.acceptAll", "Accept all")}
          </button>
        </div>
      </div>
    </div>
  );
}
