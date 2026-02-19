import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function LearnLayout() {
  const { t } = useTranslation();

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

      <Outlet />
    </div>
  );
}
