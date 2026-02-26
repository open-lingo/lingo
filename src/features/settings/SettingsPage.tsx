import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import type { Language } from "@/shared/domain/languages";
import { AVAILABLE_LEARNING_LANGUAGES } from "@/shared/domain/languageConfig";
import i18n, { supportedLngs } from "@/shared/i18n/i18n";

const UI_LOCALE_LABELS: Record<string, string> = {
  en: "English",
  ko: "한국어",
};

export function SettingsPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { language, setLanguage, isLoading: langLoading } = useLanguage();
  const { activeThemeId, setTheme, openThemeEditor } = useTheme();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("settings.title")}
        </h1>
        <Link
          to="/"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          {t("common.backToHome")}
        </Link>
      </div>

      {isAuthenticated && (
        <section className="rounded-lg border border-border bg-surface p-5">
          <Link
            to="/settings/profile"
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            {t("profile.editProfile")} <Icon name="arrowBigRight" size={14} className="inline" />
          </Link>
        </section>
      )}

      {/* Learning language */}
      <section className="space-y-3 rounded-lg border border-border bg-surface p-5">
        <h2 className="font-semibold text-text-primary">
          {t("settings.learningLanguage")}
        </h2>
        <p className="text-sm text-text-secondary">
          {t("settings.learningLanguageHelp")}
        </p>
        {langLoading ? (
          <p className="text-sm text-text-muted">{t("common.loading")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {AVAILABLE_LEARNING_LANGUAGES.map((lang: Language) => (
              <li key={lang.id}>
                <button
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    language?.id === lang.id
                      ? "border-accent bg-accent text-white"
                      : "border-border bg-surface text-text-primary hover:bg-surface-muted"
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
      <section className="space-y-3 rounded-lg border border-border bg-surface p-5">
        <h2 className="font-semibold text-text-primary">
          {t("settings.theme")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {["light", "dark", "sepia", "amoled"].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                activeThemeId === id
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-text-primary hover:bg-surface-muted"
              }`}
            >
              {t(`settings.theme${id.charAt(0).toUpperCase() + id.slice(1)}` as const)}
            </button>
          ))}
          {activeThemeId.startsWith("custom-") && (
            <span className="rounded-lg border border-accent bg-accent-muted px-4 py-2 text-sm font-medium text-accent">
              {t("settings.themeCustom")}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={openThemeEditor}
          className="mt-2 text-sm font-medium text-accent hover:text-accent-hover"
        >
          {t("settings.customizeTheme")} <Icon name="arrowBigRight" size={14} className="inline" />
        </button>
      </section>

      {/* UI language (i18n) */}
      <section className="space-y-3 rounded-lg border border-border bg-surface p-5">
        <h2 className="font-semibold text-text-primary">
          {t("settings.uiLocale")}
        </h2>
        <p className="text-sm text-text-secondary">
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
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-text-primary hover:bg-surface-muted"
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
