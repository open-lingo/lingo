import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FundingMeter } from "@/shared/components/FundingMeter";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { LanguageSelector } from "@/shared/components/LanguageSelector";
import { AuthMenu } from "@/shared/components/AuthMenu";
import { ModalRoot } from "@/shared/components/ModalRoot";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import {
  getPracticeItemsForLanguage,
  type PracticeNavItem,
} from "@/features/practice/practiceNavItems";

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

  const learnActive = /^\/[^/]+\/learn/.test(pathname);
  const practiceActive = /^\/[^/]+\/practice/.test(pathname);

  return (
    <div className="min-h-screen bg-gray-100 pb-14 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {t("nav.siteName")}
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {t("nav.home")}
            </Link>
            <Link
              to={langPath("learn")}
              className={`text-sm ${
                learnActive
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {t("nav.learn")}
            </Link>
            <PracticeNavDropdown isActive={practiceActive} />
            <Link
              to={langPath("community")}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {t("nav.community")}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <AuthMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <FundingMeter />
      <ModalRoot />
    </div>
  );
}
