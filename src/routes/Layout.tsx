import { useState, useRef, useEffect } from "react";
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
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useAuth } from "@/shared/auth/useAuth";
import { useTheme } from "@/shared/contexts/ThemeContext";
import {
  getPracticeItemsForLanguage,
  type PracticeNavItem,
} from "@/features/practice/practiceNavItems";
import { Icon } from "@/shared/components/Icon";

function PracticeNavDropdown({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const items = getPracticeItemsForLanguage(language?.id);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-0.5 text-sm ${
          isActive
            ? "font-medium text-text-primary"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        {t("nav.practice")}
        <Icon name="chevronDown" size={16} className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <ul className="absolute left-0 top-full z-20 mt-1 min-w-[200px] rounded-lg border border-border bg-surface py-1 shadow-popover">
          {items.map((item) => (
            <PracticeNavLink key={item.to + (item.label ?? "")} item={item} onClose={() => setOpen(false)} t={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PracticeNavLink({
  item,
  onClose,
  t,
}: {
  item: PracticeNavItem;
  onClose: () => void;
  t: (k: string) => string;
}) {
  const label = item.labelKey ? t(item.labelKey) : (item.label ?? "");
  const char = item.sampleCharacter;

  return (
    <li>
      <Link
        to={item.to}
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-muted"
        onClick={onClose}
      >
        {char && (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center text-sm"
            aria-hidden
          >
            {char}
          </span>
        )}
        <span>{label}</span>
      </Link>
    </li>
  );
}

function MobilePracticeLinks({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const items = getPracticeItemsForLanguage(language?.id);

  return (
    <div className="space-y-0.5">
      <span className="block px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {t("nav.practice")}
      </span>
      {items.map((item) => (
        <Link
          key={item.to + (item.label ?? "")}
          to={item.to}
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-4 py-3 pl-8 text-base font-medium text-text-primary hover:bg-surface-muted"
        >
          {item.sampleCharacter && (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center text-sm"
              aria-hidden
            >
              {item.sampleCharacter}
            </span>
          )}
          <span>{item.labelKey ? t(item.labelKey) : (item.label ?? "")}</span>
        </Link>
      ))}
    </div>
  );
}



export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isThemeEditorOpen } = useTheme();
  const { isAuthenticated } = useAuth();
  const pathname = location.pathname;
  const langPath = useLangPath();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const homeActive = pathname === "/home";
  const learnActive = /^\/[^/]+\/learn/.test(pathname);
  const practiceActive = /^\/[^/]+\/practice/.test(pathname);
  const communityActive = /\/community/.test(pathname);
  const adminActive = pathname.startsWith("/admin");
  const docsActive = pathname === "/docs" || pathname.startsWith("/docs/");

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background pb-14 text-text-primary">
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
              to={isAuthenticated ? "/home" : "/"}
              className="text-base font-semibold text-text-primary sm:text-lg"
            >
              {t("nav.siteName")}
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex md:gap-3">
            {isAuthenticated ? (
              <>
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
                <PracticeNavDropdown isActive={practiceActive} />
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
                <Link
                  to="/admin/users"
                  className={`rounded-md px-2 py-1.5 text-sm ${
                    adminActive
                      ? "font-medium text-text-primary"
                      : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                  }`}
                >
                  {t("nav.admin")}
                </Link>
              </>
            ) : (
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
            )}
            <Link
              to="/docs"
              className={`rounded-md px-2 py-1.5 text-sm ${
                docsActive
                  ? "font-medium text-text-primary"
                  : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              }`}
            >
              {t("nav.docs")}
            </Link>
          </nav>

          {/* Right side: utilities + mobile menu button */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {isAuthenticated && <SyncManagerTrigger />}
            {isAuthenticated && <LanguageSelector />}
            <ThemeToggle />
            <AuthMenu />
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
          </div>
        </div>

        {/* Mobile nav panel */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-surface md:hidden">
            <nav className="flex flex-col gap-0.5 px-3 py-3" aria-label="Mobile navigation">
              {isAuthenticated ? (
                <>
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
                  <MobilePracticeLinks onClose={() => setMobileMenuOpen(false)} />
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
                  <Link
                    to="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-lg px-4 py-3 text-base ${
                      adminActive
                        ? "font-semibold text-text-primary"
                        : "font-medium text-text-primary hover:bg-surface-muted"
                    }`}
                  >
                    {t("nav.admin")}
                  </Link>
                </>
              ) : (
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
              )}
              <Link
                to="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-base ${
                  docsActive
                    ? "font-semibold text-text-primary"
                    : "font-medium text-text-primary hover:bg-surface-muted"
                }`}
              >
                {t("nav.docs")}
              </Link>
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <FundingMeter />
      <ModalRoot />
      {isThemeEditorOpen && <ThemeEditorPanel />}
      <ToastContainer />
    </div>
  );
}
