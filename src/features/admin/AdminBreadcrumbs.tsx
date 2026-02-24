import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function AdminBreadcrumbs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const isUsers = pathname.includes("/admin/users");
  const isContent = pathname.includes("/admin/content");
  const isContentDecks = pathname.includes("/admin/content/decks");
  const isContentStories = pathname.includes("/admin/content/stories");

  return (
    <nav
      className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4 dark:border-gray-700"
      aria-label="Admin sections"
    >
      <Link
        to="/admin/users"
        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
          isUsers
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        }`}
      >
        {t("admin.users")}
      </Link>
      <Link
        to="/admin/content/decks"
        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
          isContent
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        }`}
      >
        {t("admin.content")}
      </Link>
      {isContent && (
        <>
          <span className="text-gray-400 dark:text-gray-500">/</span>
          <Link
            to="/admin/content/decks"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              isContentDecks
                ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {t("admin.decks")}
          </Link>
          <Link
            to="/admin/content/stories"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              isContentStories
                ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {t("admin.stories")}
          </Link>
        </>
      )}
    </nav>
  );
}
