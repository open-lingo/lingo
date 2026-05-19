import { useState, useEffect } from "react";
import { CookieConsent } from "@/shared/components/CookieConsent";
import { SiteFooter } from "@/shared/components/SiteFooter";
import { CollapsibleAdBanner } from "@/features/ads/CollapsibleAdBanner";
import { loadAdSenseScript } from "@/features/ads/adsense";
import { useAdsEnabled } from "@/features/ads/useAdsEnabled";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FundingMeter } from "@/shared/components/FundingMeter";
import { SRSPendingSync } from "@/features/flashcards/SRSPendingSync";
import { SyncManagerTrigger } from "@/features/sync/SyncManagerTrigger";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { ThemeEditorPanel } from "@/shared/components/ThemeEditorPanel";
import { LanguageSelector } from "@/shared/components/LanguageSelector";
import { AuthMenu } from "@/shared/components/AuthMenu";
import { ModalRoot } from "@/shared/components/ModalRoot";
import { ToastContainer } from "@/shared/components/ToastContainer";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useAuth } from "@/shared/auth/useAuth";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isLeaderboardEnabled } from "@/shared/config/featureFlags";
import { Icon } from "@/shared/components/Icon";

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isThemeEditorOpen } = useTheme();
  const { isAuthenticated } = useAuth();
  const flags = useFeatureFlags();
  const leaderboardOn = isLeaderboardEnabled(flags);
  const pathname = location.pathname;
  const langPath = useLangPath();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const homeActive = pathname === "/home";
  const learnActive = /^\/[^/]+\/learn/.test(pathname);
  const practiceActive = /^\/[^/]+\/practice/.test(pathname);
  const communityActive = /\/community/.test(pathname);
  const socialActive = /^\/[^/]+\/social/.test(pathname);
  const leaderboardActive =
    leaderboardOn && /\/leaderboard/.test(pathname);

  const isMarketingRoute =
    pathname === "/landing" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/about" ||
    pathname === "/login";
  const showAppAds = useAdsEnabled(false) && isAuthenticated && !isMarketingRoute;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    loadAdSenseScript();
    const onConsent = () => loadAdSenseScript();
    window.addEventListener("open-lingo-cookie-consent", onConsent);
    return () => window.removeEventListener("open-lingo-cookie-consent", onConsent);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      <SRSPendingSync />
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex h-12 min-h-12 max-w-7xl items-center justify-between gap-2 px-3 sm:h-14 sm:px-4 sm:gap-4 lg:px-8">
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="inline-block h-6 w-6 shrink-0 bg-current sm:h-7 sm:w-7"
              style={{
                maskImage: "url('/icon.ico')",
                WebkitMaskImage: "url('/icon.ico')",
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
              }}
              aria-hidden
            />
            <span className="text-text-muted" aria-hidden>|</span>
            <Link
              to={isAuthenticated ? "/home" : "/landing"}
              className="text-base font-semibold text-text-primary sm:text-lg"
            >
              {t("nav.siteName")}
            </Link>
          </div>

          {/* Desktop nav — signed-in only */}
          {isAuthenticated ? (
            <nav className="hidden items-center gap-1 md:flex md:gap-3">
              <Link
                to="/home"
                className={`rounded-md px-2 py-1.5 text-sm ${
                  homeActive
                    ? "font-medium text-text-primary"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                }`}
              >
                {t("nav.home")}
              </Link>
              <Link
                to={langPath("learn")}
                className={`rounded-md px-2 py-1.5 text-sm ${
                  learnActive
                    ? "font-medium text-text-primary"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                }`}
              >
                {t("nav.learn")}
              </Link>
              <Link
                to={langPath("practice")}
                className={`rounded-md px-2 py-1.5 text-sm ${
                  practiceActive
                    ? "font-medium text-text-primary"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                }`}
              >
                {t("nav.practice")}
              </Link>
              <Link
                to={langPath("social")}
                className={`rounded-md px-2 py-1.5 text-sm ${
                  socialActive
                    ? "font-medium text-text-primary"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                }`}
              >
                {t("nav.social", "Social")}
              </Link>
              <Link
                to={langPath("community")}
                className={`rounded-md px-2 py-1.5 text-sm ${
                  communityActive
                    ? "font-medium text-text-primary"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                }`}
              >
                {t("nav.community")}
              </Link>
              {leaderboardOn ? (
                <Link
                  to={langPath("community/leaderboard")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm ${
                    leaderboardActive
                      ? "font-medium text-text-primary"
                      : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                  }`}
                >
                  {t("nav.leaderboard")}
                  <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                    {t("nav.leaderboardSoonBadge", "Soon")}
                  </span>
                </Link>
              ) : null}
            </nav>
          ) : null}

          {/* Right side: utilities + mobile menu button */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {isAuthenticated && <SyncManagerTrigger />}
            {isAuthenticated && <LanguageSelector />}
            {!isMarketingRoute && <ThemeToggle />}
            {isAuthenticated ? (
              <AuthMenu />
            ) : (
              <Link
                to="/login"
                className="rounded-md px-2.5 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary sm:px-3"
              >
                {t("nav.guestLogin", "Log in")}
              </Link>
            )}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMobileMenuOpen((o) => !o);
                }}
                className="relative z-50 flex h-10 w-10 shrink-0 items-center justify-center text-text-secondary hover:text-text-primary md:hidden [touch-action:manipulation]"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <Icon name="close" size={24} />
                ) : (
                  <Icon name="menu" size={24} />
                )}
              </button>
            ) : null}
          </div>
        </div>

        {/* Mobile nav — signed-in only */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="border-t border-border bg-surface md:hidden">
            <nav className="flex flex-col gap-0.5 px-3 py-3" aria-label="Mobile navigation">
              <Link
                to="/home"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-base ${
                  homeActive
                    ? "font-semibold text-text-primary"
                    : "font-medium text-text-primary hover:bg-surface-muted"
                }`}
              >
                {t("nav.home")}
              </Link>
              <Link
                to={langPath("learn")}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-base ${
                  learnActive
                    ? "font-semibold text-text-primary"
                    : "font-medium text-text-primary hover:bg-surface-muted"
                }`}
              >
                {t("nav.learn")}
              </Link>
              <Link
                to={langPath("practice")}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-base ${
                  practiceActive
                    ? "font-semibold text-text-primary"
                    : "font-medium text-text-primary hover:bg-surface-muted"
                }`}
              >
                {t("nav.practice")}
              </Link>
              <Link
                to={langPath("social")}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-base ${
                  socialActive
                    ? "font-semibold text-text-primary"
                    : "font-medium text-text-primary hover:bg-surface-muted"
                }`}
              >
                {t("nav.social", "Social")}
              </Link>
              <Link
                to={langPath("community")}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-base ${
                  communityActive
                    ? "font-semibold text-text-primary"
                    : "font-medium text-text-primary hover:bg-surface-muted"
                }`}
              >
                {t("nav.community")}
              </Link>
              {leaderboardOn ? (
                <Link
                  to={langPath("community/leaderboard")}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between gap-2 rounded-lg px-4 py-3 text-base ${
                    leaderboardActive
                      ? "font-semibold text-text-primary"
                      : "font-medium text-text-primary hover:bg-surface-muted"
                  }`}
                >
                  <span>{t("nav.leaderboard")}</span>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                    {t("nav.leaderboardSoonBadge", "Soon")}
                  </span>
                </Link>
              ) : null}
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <SiteFooter />
      {showAppAds ? <CollapsibleAdBanner /> : null}
      <CookieConsent />
      <FundingMeter />
      <ModalRoot />
      {isThemeEditorOpen && <ThemeEditorPanel />}
      <ToastContainer />
    </div>
  );
}
