import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const TABS = [
  { path: "/community/content", key: "community.contentBrowser" },
  { path: "/community/forum", key: "community.forum" },
  { path: "/community/leaderboard", key: "community.leaderboard" },
] as const;

export function CommunityLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("community.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("community.intro")}
        </p>
      </div>

      <nav
        className="flex gap-1 border-b border-gray-200 dark:border-gray-700"
        aria-label={t("community.tabsLabel")}
      >
        {TABS.map(({ path, key }) => {
          const isActive =
            pathname === path ||
            (path === "/community/content" && pathname === "/community") ||
            (path === "/community/forum" &&
              pathname.startsWith("/community/forum"));
          return (
            <Link
              key={path}
              to={path}
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
