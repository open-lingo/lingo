import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FundingMeter } from "@/shared/components/FundingMeter";
import { SRSPendingSync } from "@/features/flashcards/SRSPendingSync";
import { SyncManagerTrigger } from "@/features/sync/SyncManagerTrigger";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { LanguageSelector } from "@/shared/components/LanguageSelector";
import { AuthMenu } from "@/shared/components/AuthMenu";
import { ModalRoot } from "@/shared/components/ModalRoot";
import { ToastContainer } from "@/shared/components/ToastContainer";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import {
  getPracticeItemsForLanguage,
  type PracticeNavItem,
} from "@/features/practice/practiceNavItems";

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

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
            ? "text-gray-900 dark:text-white"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        }`}
      >
        {t("nav.practice")}
        <Chevron className={`h-4 w-4 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="absolute left-0 top-full z-20 mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
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
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        onClick={onClose}
      >
        {char && (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 text-sm dark:border-gray-600"
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
      <span className="block px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t("nav.practice")}
      </span>
      {items.map((item) => (
        <Link
          key={item.to + (item.label ?? "")}
          to={item.to}
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-4 py-3 pl-8 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {item.sampleCharacter && (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 text-sm dark:border-gray-600"
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

function Chevron({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}



export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const pathname = location.pathname;
  const langPath = useLangPath();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const learnActive = /^\/[^/]+\/learn/.test(pathname);
  const practiceActive = /^\/[^/]+\/practice/.test(pathname);
  const adminActive = pathname.startsWith("/admin");

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-100 pb-14 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <SRSPendingSync />
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto flex h-12 min-h-12 max-w-7xl items-center justify-between gap-2 px-3 sm:h-14 sm:px-4 sm:gap-4 lg:px-8">
          <Link
            to="/"
            className="shrink-0 text-base font-semibold text-gray-900 dark:text-white sm:text-lg"
          >
            {t("nav.siteName")}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex md:gap-3">
            <Link
              to="/"
              className="rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {t("nav.home")}
            </Link>
            <Link
              to={langPath("learn")}
              className={`rounded-md px-2 py-1.5 text-sm ${
                learnActive
                  ? "font-medium text-gray-900 dark:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              }`}
            >
              {t("nav.learn")}
            </Link>
            <PracticeNavDropdown isActive={practiceActive} />
            <Link
              to={langPath("community")}
              className="rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              {t("nav.community")}
            </Link>
            <Link
              to="/admin/users"
              className={`rounded-md px-2 py-1.5 text-sm ${
                adminActive
                  ? "font-medium text-gray-900 dark:text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              }`}
            >
              {t("nav.admin")}
            </Link>
          </nav>

          {/* Right side: utilities + mobile menu button */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <SyncManagerTrigger />
            <LanguageSelector />
            <ThemeToggle />
            <AuthMenu />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMobileMenuOpen((o) => !o);
              }}
              className="relative z-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:hidden [touch-action:manipulation]"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <CloseIcon className="h-6 w-6" />
              ) : (
                <HamburgerIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:hidden">
            <nav className="flex flex-col gap-0.5 px-3 py-3" aria-label="Mobile navigation">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {t("nav.home")}
              </Link>
              <Link
                to={langPath("learn")}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-base ${
                  learnActive
                    ? "font-semibold text-gray-900 dark:text-white"
                    : "font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {t("nav.learn")}
              </Link>
              <MobilePracticeLinks onClose={() => setMobileMenuOpen(false)} />
              <Link
                to={langPath("community")}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {t("nav.community")}
              </Link>
              <Link
                to="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-base ${
                  adminActive
                    ? "font-semibold text-gray-900 dark:text-white"
                    : "font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {t("nav.admin")}
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
      <ToastContainer />
    </div>
  );
}
