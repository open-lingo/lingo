import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const TABS = [
  { path: "/learn", key: "nav.learnCourseMap" },
  { path: "/learn/courses", key: "nav.learnCourses" },
] as const;

export function LearnLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("nav.learn")}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("learn.intro")}
        </p>
      </div>

      <nav
        className="flex gap-1 border-b border-gray-200 dark:border-gray-700"
        aria-label={t("learn.tabsLabel")}
      >
        {TABS.map(({ path, key }) => {
          const isActive =
            pathname === path || (path === "/learn" && pathname === "/learn");
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
