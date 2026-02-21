import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";

export function ContributePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const pathname = location.pathname;
  const langPath = useLangPath();

  const isCreatePath = pathname.includes("/contribute/create");
  const isAdminPath = pathname.includes("/contribute/admin");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t("community.studioTitle")}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("community.studioDesc")}
        </p>
      </div>

      <nav
          className="flex gap-1 border-b border-gray-200 dark:border-gray-700"
          aria-label={t("community.studioTabsLabel")}
        >
          <Link
            to={langPath("community/contribute")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              !isCreatePath && !isAdminPath
                ? "border-green-600 text-green-600 dark:border-green-500 dark:text-green-400"
                : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-600 dark:hover:text-white"
            }`}
          >
            {t("community.studioMyContent")}
          </Link>
          <Link
            to={langPath("community/contribute/create")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              isCreatePath && !isAdminPath
                ? "border-green-600 text-green-600 dark:border-green-500 dark:text-green-400"
                : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-600 dark:hover:text-white"
            }`}
          >
            {t("community.studioCreateNew")}
          </Link>
          <Link
            to={langPath("community/contribute/admin")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              isAdminPath
                ? "border-green-600 text-green-600 dark:border-green-500 dark:text-green-400"
                : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-600 dark:hover:text-white"
            }`}
          >
            {t("community.studioAdmin")}
          </Link>
        </nav>

      <Outlet />
    </div>
  );
}
