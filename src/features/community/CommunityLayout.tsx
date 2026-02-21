import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";

const TAB_KEYS = [
  { path: "community/explore", key: "community.explore" },
  { path: "community/discuss", key: "community.discuss" },
  { path: "community/contribute", key: "community.contribute" },
  { path: "community/leaderboard", key: "community.leaderboard" },
] as const;

export function CommunityLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const pathname = location.pathname;
  const langPath = useLangPath();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("community.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("community.learnTogether")}
        </p>
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50/80 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
          {t("community.banner")}
        </div>
      </div>

      <nav
        className="flex gap-1 border-b border-gray-200 dark:border-gray-700"
        aria-label={t("community.tabsLabel")}
      >
        {TAB_KEYS.map(({ path, key }) => {
          const to = langPath(path);
          const isActive = pathname === to ||
            (path === "community/explore" && (pathname.endsWith("/community") || pathname.includes("/community/explore"))) ||
            (path === "community/discuss" && (pathname.includes("/community/discuss") || pathname.includes("/community/forum"))) ||
            (path === "community/contribute" && pathname.includes("/community/contribute"));
          return (
            <Link
              key={path}
              to={to}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-green-600 text-green-600 dark:border-green-500 dark:text-green-400"
                  : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white"
              }`}
            >
              {t(key)}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
