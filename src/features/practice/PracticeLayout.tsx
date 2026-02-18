import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getPracticeItemsForLanguage,
  type PracticeNavItem,
} from "./practiceNavItems";

function PracticeTab({ item, isActive, t }: { item: PracticeNavItem; isActive: boolean; t: (k: string) => string }) {
  const label = item.labelKey ? t(item.labelKey) : (item.label ?? "");
  const char = item.sampleCharacter;

  return (
    <Link
      to={item.to}
      className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition ${
        isActive
          ? "border-green-600 text-green-600 dark:border-green-500 dark:text-green-400"
          : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white"
      }`}
    >
      {char && (
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-current/30 text-xs"
          aria-hidden
        >
          {char}
        </span>
      )}
      {label}
    </Link>
  );
}

export function PracticeLayout() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const location = useLocation();
  const pathname = location.pathname;

  const items = getPracticeItemsForLanguage(language?.id);

  function isActive(item: PracticeNavItem): boolean {
    if (pathname === item.to) return true;
    if (item.to === "/practice/stories" && pathname.startsWith("/practice/stories")) return true;
    if (item.to.startsWith("/practice/alphabet/") && pathname === item.to) return true;
    if (item.to === "/practice/alphabet" && pathname.startsWith("/practice/alphabet")) return true;
    return false;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("nav.practice")}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("practice.intro")}
        </p>
      </div>

      <nav
        className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700"
        aria-label={t("practice.tabsLabel")}
      >
        {items.map((item) => (
          <PracticeTab
            key={item.to + (item.label ?? "")}
            item={item}
            isActive={isActive(item)}
            t={t}
          />
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
