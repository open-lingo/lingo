import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useAuth } from "@/shared/auth/useAuth";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useModal } from "@/shared/contexts/ModalContext";
import { useSettings } from "@/shared/contexts/SettingsContext";
import type { Language } from "@/shared/domain/languages";
import { AVAILABLE_LEARNING_LANGUAGES } from "@/shared/domain/languageConfig";
import { supportedLngs } from "@/shared/i18n/i18n";
import { utcToLocalHHmm, localToUtcHHmm } from "@/shared/utils/reminderTime";
import { AccountPrivacySection } from "./AccountPrivacySection";

const UI_LOCALE_LABELS: Record<string, string> = {
  en: "English",
  ko: "한국어",
};

export function SettingsContent() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { settings, updateSetting } = useSettings();
  const { language, setLanguage, isLoading: langLoading } = useLanguage();
  const { activeThemeId, setTheme, openThemeEditor } = useTheme();
  const { openProfile, close } = useModal();

  const selectedCls = "border-accent bg-accent text-white";
  const unselectedCls = "border-border bg-surface text-text-primary hover:bg-surface-muted";

  const themePresets = [
    { id: "auto", labelKey: "settings.themeAuto" },
    { id: "light", labelKey: "settings.themeLight" },
    { id: "dark", labelKey: "settings.themeDark" },
    { id: "sepia", labelKey: "settings.themeSepia" },
    { id: "amoled", labelKey: "settings.themeAmoled" },
  ];

  return (
    <div className="space-y-6 px-6 py-5">
      {isAuthenticated && (
        <section>
          <button
            type="button"
            onClick={openProfile}
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            {t("profile.editProfile")} <Icon name="arrowBigRight" size={14} className="inline" />
          </button>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("settings.learningLanguage")}
        </h3>
        <p className="text-xs text-text-muted">
          {t("settings.learningLanguageHelp")}
        </p>
        {langLoading ? (
          <p className="text-sm text-text-muted">{t("common.loading")}</p>
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
        <h3 className="text-sm font-semibold text-text-primary">
          {t("settings.theme")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {themePresets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setTheme(p.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                  activeThemeId === p.id ? selectedCls : unselectedCls
                }`}
              >
                {t(p.labelKey)}
              </button>
            ))}
          {activeThemeId.startsWith("custom-") && (
            <span className="rounded-lg border border-accent bg-accent-muted px-3 py-1.5 text-sm font-medium text-accent">
              {t("settings.themeCustom", "Custom")}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            close();
            openThemeEditor();
          }}
          className="mt-2 text-sm font-medium text-accent hover:text-accent-hover"
        >
          {t("settings.customizeTheme", "Customize theme")} <Icon name="arrowBigRight" size={14} className="inline" />
        </button>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("settings.notifications")}
        </h3>
        <p className="text-xs text-text-muted">
          {t("settings.notificationsHelp")}
        </p>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={settings.notifications.reminderEnabled}
            onChange={(e) =>
              updateSetting("notifications.reminderEnabled", e.target.checked)
            }
            className="rounded border-gray-300 text-accent focus:ring-accent"
          />
          <span className="text-sm text-text-primary">
            {t("settings.dailyReminder")}
          </span>
        </label>
        {settings.notifications.reminderEnabled && (
          <div className="flex items-center gap-2">
            <label htmlFor="reminder-time" className="text-sm text-text-primary">
              {t("settings.reminderTime")}
            </label>
            <input
              id="reminder-time"
              type="time"
              value={
                settings.notifications.dailyReminderTime
                  ? utcToLocalHHmm(settings.notifications.dailyReminderTime)
                  : "09:00"
              }
              onChange={(e) => {
                const local = e.target.value;
                updateSetting(
                  "notifications.dailyReminderTime",
                  localToUtcHHmm(local)
                );
              }}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("settings.accessibility")}
        </h3>
        <p className="text-xs text-text-muted">
          {t("settings.accessibilityHelp")}
        </p>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={settings.accessibility.reducedMotion}
            onChange={(e) =>
              updateSetting("accessibility.reducedMotion", e.target.checked)
            }
            className="rounded border-gray-300 text-accent focus:ring-accent"
          />
          <span className="text-sm text-text-primary">
            {t("settings.reducedMotion")}
          </span>
        </label>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("settings.alphabetDisplay", "Alphabet display")}
        </h3>
        <p className="text-xs text-text-muted">
          {t(
            "settings.alphabetDisplayHelp",
            "Control how romanization and reading aids are shown for alphabets.",
          )}
        </p>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={settings.learning.showAlphabetRomanization ?? true}
            onChange={(e) =>
              updateSetting(
                "learning.showAlphabetRomanization",
                e.target.checked,
              )
            }
            className="rounded border-gray-300 text-accent focus:ring-accent"
          />
          <span className="text-sm text-text-primary">
            {t(
              "settings.showAlphabetRomanization",
              "Show romanization under alphabet characters",
            )}
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={settings.learning.showAlphabetFurigana ?? true}
            onChange={(e) =>
              updateSetting("learning.showAlphabetFurigana", e.target.checked)
            }
            className="rounded border-gray-300 text-accent focus:ring-accent"
          />
          <span className="text-sm text-text-primary">
            {t(
              "settings.showAlphabetFurigana",
              "Show furigana above Japanese text (where available)",
            )}
          </span>
        </label>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">
          {t("settings.uiLocale")}
        </h3>
        <p className="text-xs text-text-muted">
          {t("settings.uiLocaleHelp")}
        </p>
        <div className="flex flex-wrap gap-2">
          {supportedLngs.map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => updateSetting("learning.uiLocale", lng)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                settings.learning.uiLocale.startsWith(lng) ? selectedCls : unselectedCls
              }`}
            >
              {UI_LOCALE_LABELS[lng] ?? lng}
            </button>
          ))}
        </div>
      </section>

      <AccountPrivacySection />
    </div>
  );
}
