import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FundingMeter } from "@/components/FundingMeter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AuthMenu } from "@/components/AuthMenu";

export function Layout() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <FundingMeter />
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
              to="/leaderboard"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {t("nav.leaderboard")}
            </Link>
            <Link
              to="/community"
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
    </div>
  );
}
