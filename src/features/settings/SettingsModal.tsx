import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/auth/useAuth";
import { useApi } from "@/api/provider";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettingsModal } from "@/contexts/SettingsModalContext";
import type { Language } from "@/core/languages";
import { AVAILABLE_LEARNING_LANGUAGES } from "@/core/languageConfig";
import i18n, { supportedLngs } from "@/i18n";
import { ProfileEditPanel } from "./ProfileEditPanel";

const UI_LOCALE_LABELS: Record<string, string> = {
  en: "English",
  ko: "한국어",
};

export function SettingsModal() {
  const { t } = useTranslation();
  const { view, isOpen, close, openProfile, openSettings } = useSettingsModal();
  const { isAuthenticated } = useAuth();
  const { users } = useApi();
  const { language, setLanguage, isLoading: langLoading } = useLanguage();
  const { theme, setTheme } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const selectedCls =
    "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900";
  const unselectedCls =
    "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700";

  const title = view === "profile" ? t("profile.editTitle") : t("settings.title");

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16 backdrop-blur-sm sm:items-center sm:pt-0"
      onClick={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
      }}
    >
      <div
        ref={panelRef}
        className="relative mx-4 w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        style={{ maxHeight: "85vh" }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {view === "profile" && (
              <button
                type="button"
                onClick={openSettings}
                className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label={t("common.back")}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {view === "profile" ? (
          <ProfileEditPanel />
        ) : (
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
        )}
      </div>
    </div>
  );
}
