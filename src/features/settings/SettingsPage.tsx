import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { Language } from "@/core/languages";
import { LANGUAGES } from "@/core/languages";
import i18n, { supportedLngs } from "@/i18n";

const UI_LOCALE_LABELS: Record<string, string> = {
  en: "English",
  ko: "한국어",
};

export function SettingsPage() {
  const { t } = useTranslation();
  const { language, setLanguage, isLoading: langLoading } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("settings.title")}
        </h1>
        <Link
          to="/"
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {t("common.backToHome")}
        </Link>
      </div>

      {/* Learning language */}
      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {t("settings.learningLanguage")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("settings.learningLanguageHelp")}
        </p>
        {langLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang: Language) => (
              <li key={lang.id}>
                <button
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    language?.id === lang.id
                      ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Theme */}
      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {t("settings.theme")}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              theme === "light"
                ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {t("settings.themeLight")}
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              theme === "dark"
                ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {t("settings.themeDark")}
          </button>
        </div>
      </section>

      {/* UI language (i18n) */}
      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {t("settings.uiLocale")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("settings.uiLocaleHelp")}
        </p>
        <div className="flex flex-wrap gap-2">
          {supportedLngs.map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => i18n.changeLanguage(lng)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                i18n.language?.startsWith(lng)
                  ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {UI_LOCALE_LABELS[lng] ?? lng}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
