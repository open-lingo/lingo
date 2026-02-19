import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useApi } from "@/shared/api/provider";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useModal } from "@/shared/contexts/ModalContext";
import type { Language } from "@/shared/domain/languages";
import { AVAILABLE_LEARNING_LANGUAGES } from "@/shared/domain/languageConfig";
import i18n, { supportedLngs } from "@/shared/i18n/i18n";

const UI_LOCALE_LABELS: Record<string, string> = {
  en: "English",
  ko: "한국어",
};

export function SettingsContent() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { users } = useApi();
  const { language, setLanguage, isLoading: langLoading } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { openProfile } = useModal();

  const selectedCls =
    "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900";
  const unselectedCls =
    "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700";

  return (
    <div className="space-y-6 px-6 py-5">
      {isAuthenticated && (
        <section>
          <button
            type="button"
            onClick={openProfile}
            className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            {t("profile.editProfile")} →
          </button>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("settings.learningLanguage")}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("settings.learningLanguageHelp")}
        </p>
        {langLoading ? (
          <p className="text-sm text-gray-500">{t("common.loading")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_LEARNING_LANGUAGES.map((lang: Language) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  language?.id === lang.id ? selectedCls : unselectedCls
                }`}
              >
                <span className="mr-1.5">{lang.flag}</span>
                {lang.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("settings.theme")}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              theme === "light" ? selectedCls : unselectedCls
            }`}
          >
            {t("settings.themeLight")}
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              theme === "dark" ? selectedCls : unselectedCls
            }`}
          >
            {t("settings.themeDark")}
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("settings.uiLocale")}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("settings.uiLocaleHelp")}
        </p>
        <div className="flex flex-wrap gap-2">
          {supportedLngs.map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => {
                i18n.changeLanguage(lng);
                users.updateSettings({ uiLocale: lng }).catch(() => {});
              }}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                i18n.language?.startsWith(lng) ? selectedCls : unselectedCls
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
