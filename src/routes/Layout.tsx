import { useState, useEffect } from "react";
import { CookieConsent } from "@/shared/components/CookieConsent";
import { DevPanel } from "@/shared/components/DevPanel";
import { SiteFooter } from "@/shared/components/SiteFooter";
import { CollapsibleAdBanner } from "@/features/ads/CollapsibleAdBanner";
import { DailyWelcomeAd } from "@/features/ads/DailyWelcomeAd";
import { loadAdSenseScript } from "@/features/ads/adsense";
import { useAdsEnabled } from "@/features/ads/useAdsEnabled";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FundingMeter } from "@/shared/components/FundingMeter";
import { SRSPendingSync } from "@/features/flashcards/SRSPendingSync";
import { LessonProgressHydrate } from "@/features/lesson/LessonProgressHydrate";
import { SyncManagerTrigger } from "@/features/sync/SyncManagerTrigger";
import { ThemeEditorPanel } from "@/shared/components/ThemeEditorPanel";
import { FloatingLanguagePill } from "@/shared/components/FloatingLanguagePill";
import { AuthMenu } from "@/shared/components/AuthMenu";
import { ModalRoot } from "@/shared/components/ModalRoot";
import { CommandPalette } from "@/shared/components/CommandPalette/CommandPalette";
import { ToastContainer } from "@/shared/components/ToastContainer";
import { StorageQuotaWatcher } from "@/shared/components/StorageQuotaWatcher";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useTouchOnSession } from "@/shared/hooks/useTouchOnSession";
import { useUnlockMapSync } from "@/shared/hooks/useUnlockMapSync";
import { ImpersonationBanner } from "@/features/admin/impersonation/ImpersonationBanner";
import { LingotBalance } from "@/shared/components/LingotBalance";
import { AdFreePill } from "@/features/adFree";
import { useAuth } from "@/shared/auth/useAuth";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { SidebarNav } from "@/routes/SidebarNav";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import {
  isCommunityEnabled,
  isLeaderboardEnabled,
  isSocialEnabled,
} from "@/shared/config/featureFlags";
import { Icon } from "@/shared/components/Icon";
import {
  makePrefetchHandlers,
  prefetchCommunity,
  prefetchLearn,
  prefetchPractice,
  prefetchSocial,
} from "@/shared/utils/routePrefetch";

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isThemeEditorOpen } = useTheme();
  const { settings } = useSettings();
  const { isAuthenticated } = useAuth();
  // Sidebar layout only applies to authed users on ≥lg; mobile + signed-out
  // always use the top bar.
  const sidebarMode = isAuthenticated && settings.appearance.navLayout === "sidebar";
  // Fires POST /progress/me/touch once per session after auth.
  useTouchOnSession();
  // Reconciles the atom unlock ladder with the server (union both ways) and
  // pushes new unlocks as they happen, so progression survives a storage
  // clear / device switch.
  useUnlockMapSync();
  const flags = useFeatureFlags();
  const leaderboardOn = isLeaderboardEnabled(flags);
  const socialOn = isSocialEnabled(flags);
  const communityOn = isCommunityEnabled(flags);
  const pathname = location.pathname;
  const langPath = useLangPath();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const homeActive = pathname === "/home";
  const learnActive = /^\/[^/]+\/learn/.test(pathname);
  // Focused flows (inside a lesson / test) drop the marketing footer and
  // tighten main padding — on short laptop viewports (MacBook 14" ≈ 840px
  // usable) the footer alone pushed every lesson step below the fold.
  const focusedFlow =
    /\/lessons\/|\/test-out\/|\/placement-test|\/practice\/grammar\/review/.test(
      pathname,
    );
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
  // The onboarding language pickers are single-decision screens — keep the
  // floating "% ad-funded" funding pill off them so it doesn't compete with
  // the one choice we want the visitor making.
  const isOnboardingPicker = pathname === "/get-started" || pathname === "/try";

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile menu is open so users don't
  // scroll the page behind the open panel. Restores prior overflow on
  // unmount / close. Survives orientation change because we only listen
  // to `mobileMenuOpen` state, not viewport size.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    loadAdSenseScript();
    const onConsent = () => loadAdSenseScript();
    window.addEventListener("open-lingo-cookie-consent", onConsent);
    return () => window.removeEventListener("open-lingo-cookie-consent", onConsent);
  }, []);

  return (
    <div
      className={`flex min-h-screen flex-col bg-background text-text-primary ${
        sidebarMode ? "lg:pl-60" : ""
      }`}
    >
      {sidebarMode ? <SidebarNav /> : null}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-surface-elevated focus:text-text-primary focus:rounded focus:ring-2"
      >
        {t("nav.skipToContent", "Skip to content")}
      </a>
      <SRSPendingSync />
      <LessonProgressHydrate />
      <ImpersonationBanner />
      {/* Focused flows (lesson/test/review sessions) drop the global chrome
          entirely — the session header (X + progress bar) is the only chrome,
          so the learner's attention and the vertical budget both go to the
          exercise (Duolingo-anatomy: no app nav inside a lesson). */}
      <header
        className={`sticky top-0 z-40 border-b border-border bg-surface ${
          sidebarMode ? "lg:hidden" : ""
        } ${focusedFlow ? "hidden" : ""}`}
      >
        <div className="mx-auto flex h-11 min-h-11 max-w-7xl items-center justify-between gap-2 px-3 sm:h-12 sm:px-4 sm:gap-4 lg:px-8">
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
                {...makePrefetchHandlers(prefetchLearn)}
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
                {...makePrefetchHandlers(prefetchPractice)}
                className={`rounded-md px-2 py-1.5 text-sm ${
                  practiceActive
                    ? "font-medium text-text-primary"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                }`}
              >
                {t("nav.practice")}
              </Link>
              {socialOn ? (
                <Link
                  to={langPath("social")}
                  {...makePrefetchHandlers(prefetchSocial)}
                  className={`rounded-md px-2 py-1.5 text-sm ${
                    socialActive
                      ? "font-medium text-text-primary"
                      : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                  }`}
                >
                  {t("nav.social", "Social")}
                </Link>
              ) : null}
              {communityOn ? (
                <Link
                  to={langPath("community")}
                  {...makePrefetchHandlers(prefetchCommunity)}
                  className={`rounded-md px-2 py-1.5 text-sm ${
                    communityActive
                      ? "font-medium text-text-primary"
                      : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                  }`}
                >
                  {t("nav.community")}
                </Link>
              ) : null}
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

          {/* Right side: utilities + mobile menu button.
              On <sm (≤640px) we hide SyncManagerTrigger + AdFreePill to keep
              the header on one line at 375px. Sync status surfaces inside the
              mobile menu instead; AdFreePill auto-hides when not active.
              LingotBalance + LanguageSelector stay visible because they're
              the highest-signal status chips. */}
          <div className="flex min-w-0 shrink items-center justify-end gap-1 sm:gap-2">
            {isAuthenticated && (
              <span className="hidden sm:inline-flex">
                <SyncManagerTrigger />
              </span>
            )}
            {isAuthenticated && (
              <span className="hidden sm:inline-flex">
                <AdFreePill />
              </span>
            )}
            {isAuthenticated && <LingotBalance />}
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
                className="relative z-50 -mr-1 flex h-11 w-11 shrink-0 items-center justify-center text-text-secondary hover:text-text-primary md:hidden [touch-action:manipulation]"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav"
                aria-label={mobileMenuOpen ? t("nav.closeMenu", "Close menu") : t("nav.openMenu", "Open menu")}
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

        {/* Mobile nav — signed-in only.
            Slides down from the header. Backdrop catches taps outside.
            Rows are min-h-[44px] tap targets. Sync trigger and ad-free
            pill are surfaced here since they're hidden in the compact
            header at narrow widths. */}
        {isAuthenticated && mobileMenuOpen && (
          <>
            {/* Backdrop — clicking it closes the menu without firing a route nav. */}
            <button
              type="button"
              aria-label={t("nav.closeMenu", "Close menu")}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-x-0 bottom-0 top-11 z-30 bg-overlay/40 md:hidden"
            />
            <div
              id="mobile-nav"
              className="relative z-40 origin-top border-t border-border bg-surface shadow-popover animate-fade-up motion-reduce:animate-none md:hidden"
            >
              <nav
                className="flex flex-col gap-0.5 px-3 py-3"
                aria-label={t("nav.mobileLabel", "Mobile navigation")}
              >
                <MobileNavLink
                  to="/home"
                  active={homeActive}
                  onClick={() => setMobileMenuOpen(false)}
                  label={t("nav.home")}
                />
                <MobileNavLink
                  to={langPath("learn")}
                  active={learnActive}
                  onClick={() => setMobileMenuOpen(false)}
                  onPrefetch={prefetchLearn}
                  label={t("nav.learn")}
                />
                <MobileNavLink
                  to={langPath("practice")}
                  active={practiceActive}
                  onClick={() => setMobileMenuOpen(false)}
                  onPrefetch={prefetchPractice}
                  label={t("nav.practice")}
                />
                {socialOn ? (
                  <MobileNavLink
                    to={langPath("social")}
                    active={socialActive}
                    onClick={() => setMobileMenuOpen(false)}
                    onPrefetch={prefetchSocial}
                    label={t("nav.social", "Social")}
                  />
                ) : null}
                {communityOn ? (
                  <MobileNavLink
                    to={langPath("community")}
                    active={communityActive}
                    onClick={() => setMobileMenuOpen(false)}
                    onPrefetch={prefetchCommunity}
                    label={t("nav.community")}
                  />
                ) : null}
                {leaderboardOn ? (
                  <Link
                    to={langPath("community/leaderboard")}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex min-h-[44px] items-center justify-between gap-2 rounded-lg px-4 py-3 text-base ${
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
              {/* Utility row — sync + ad-free surfaced for mobile since they're
                  hidden in the compact header. AdFreePill self-hides when no
                  ad-free window is active. */}
              <div className="flex items-center gap-3 border-t border-border px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t("syncManager.titleShort", "Sync")}
                </span>
                <SyncManagerTrigger />
                <span className="ml-auto">
                  <AdFreePill />
                </span>
              </div>
            </div>
          </>
        )}
      </header>
      {showAppAds ? <DailyWelcomeAd /> : null}
      {/* Mounted between header and main so on <sm it renders in-flow below
          the header (it used to float over page H1s on mobile); ≥sm it's the
          fixed top-right panel as before. */}
      {!isOnboardingPicker && !focusedFlow && <FundingMeter />}
      {/* Non-focused pages: content fills the viewport below the header so the
          footer sits just past the fold (present but out of the way). Focused
          flows (lessons/tests) drop the footer + tighten padding so steps
          aren't pushed below the fold. */}
      <main
        id="main-content"
        className={`mx-auto w-full max-w-screen-2xl flex-1 px-4 sm:px-6 lg:px-8 ${
          focusedFlow
            ? "py-3"
            : `py-8 min-h-[calc(100svh_-_2.75rem)] sm:min-h-[calc(100svh_-_3rem)] ${
                sidebarMode ? "lg:min-h-[100svh]" : ""
              }`
        }`}
      >
        <Outlet />
      </main>
      {/* Full-screen platform feel: the marketing footer lives only on the
          public landing page. Everywhere else its links + open-source
          attributions are reachable from Settings → More info. */}
      {pathname === "/landing" && <SiteFooter />}
      {showAppAds ? <CollapsibleAdBanner /> : null}
      {isAuthenticated && !focusedFlow && (
        <FloatingLanguagePill className={sidebarMode ? "lg:hidden" : ""} />
      )}
      {/* Sidebar layout has no top bar on desktop, so the utility controls
          (cloud/sync, lingots, profile) float top-right where their menus
          have room to open downward. Mobile sidebar mode still uses the top bar. */}
      {sidebarMode && (
        <div className="fixed right-3 top-3 z-40 hidden items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-1 shadow-popover lg:flex">
          <SyncManagerTrigger />
          <LingotBalance />
          <AuthMenu />
        </div>
      )}
      <CookieConsent />
      {/* Dev builds only — ?dev=1 in prod is inert (bundle never includes an
          active panel thanks to the env guard + tree-shaking of the branch). */}
      {import.meta.env.DEV && <DevPanel />}
      <ModalRoot />
      {isAuthenticated && <CommandPalette />}
      {isThemeEditorOpen && <ThemeEditorPanel />}
      <ToastContainer
        bottomOffsetClass={focusedFlow ? "bottom-52" : undefined}
      />
      <StorageQuotaWatcher />
    </div>
  );
}

/** Mobile nav row: ≥44px tap target, big text, semantic active state. */
function MobileNavLink({
  to,
  active,
  onClick,
  onPrefetch,
  label,
}: {
  to: string;
  active: boolean;
  onClick: () => void;
  onPrefetch?: () => void;
  label: string;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      {...(onPrefetch ? makePrefetchHandlers(onPrefetch) : {})}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-[44px] items-center rounded-lg px-4 py-3 text-base ${
        active
          ? "font-semibold text-text-primary"
          : "font-medium text-text-primary hover:bg-surface-muted"
      }`}
    >
      {label}
    </Link>
  );
}
