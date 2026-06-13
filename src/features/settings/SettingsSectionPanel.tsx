import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/shared/components/Icon";
import { useApi } from "@/shared/api/provider";
import { useAuth } from "@/shared/auth/useAuth";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useToast } from "@/shared/contexts/ToastContext";
import { useModal } from "@/shared/contexts/ModalContext";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { ApiError } from "@/shared/api/client";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { supportedLngs } from "@/shared/i18n/i18n";
import { utcToLocalHHmm, localToUtcHHmm } from "@/shared/utils/reminderTime";
import { resetLearnProgress } from "@/features/learn/resetLearnProgress";
import { tryGetLanguageModule } from "@/shared/language/registry";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { AccountPrivacySection } from "./AccountPrivacySection";
import { ChoiceChip, inputClassName } from "@/shared/components/ui/formStyles";
import {
  isLanguageSectionId,
  languageIdFromSection,
  type SettingsSectionId,
} from "./settingsSections";

const UI_LOCALE_LABELS: Record<string, string> = {
  en: "English",
  ko: "한국어",
  es: "Español",
};

type SettingsSectionPanelProps = {
  section: SettingsSectionId;
};

export function SettingsSectionPanel({ section }: SettingsSectionPanelProps) {
  if (isLanguageSectionId(section)) {
    return <LanguageSettingsPanel languageId={languageIdFromSection(section)} />;
  }

  switch (section) {
    case "general":
      return <GeneralPanel />;
    case "appearance":
      return <AppearancePanel />;
    case "audio":
      return <AudioPanel />;
    case "accessibility":
      return <AccessibilityPanel />;
    case "notifications":
      return <NotificationsPanel />;
    case "privacy":
      return <PrivacyPanel />;
    default:
      return <GeneralPanel />;
  }
}

function SectionIntro({
  title,
  help,
}: {
  title: string;
  help?: string;
}) {
  return (
    <header className="mb-4 space-y-1">
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {help ? <p className="text-sm text-text-muted">{help}</p> : null}
    </header>
  );
}

function GeneralPanel() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const { settings, updateSetting } = useSettings();
  const { users } = useApi();
  const { closeAll } = useModal();

  // Resolve the viewer's username so the profile link can deep-link to
  // ``/u/<username>``. Falls back to Auth0 claims when the backend record
  // hasn't been created yet.
  const { data: me } = useQuery({
    queryKey: ["users", user?.sub ?? "anon", "me"],
    queryFn: () => users.getMe(),
    enabled: isAuthenticated,
    retry: (_, err) => !(err instanceof ApiError && err.status === 404),
    // Shared key with HomePage / AuthMenu — 5 min so opening Settings doesn't
    // round-trip /users/me when the cache already has fresh data.
    staleTime: 5 * 60_000,
  });
  const profileUsername =
    me?.username?.trim() ||
    user?.nickname?.trim() ||
    user?.email?.split("@")[0]?.trim() ||
    "";

  const uiLocaleValue = supportedLngs.find((lng) =>
    settings.learning.uiLocale.startsWith(lng),
  ) ?? supportedLngs[0];

  return (
    <div>
      {isAuthenticated && profileUsername && (
        <div className="mb-5">
          <Link
            to={`/u/${encodeURIComponent(profileUsername)}`}
            onClick={closeAll}
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            {t("profile.editProfile")}{" "}
            <Icon name="arrowBigRight" size={14} className="inline" />
          </Link>
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="settings-ui-locale"
          className="text-sm font-semibold text-text-primary"
        >
          {t("settings.uiLocale")}
        </label>
        <p className="text-xs text-text-muted">{t("settings.uiLocaleHelp")}</p>
        <select
          id="settings-ui-locale"
          value={uiLocaleValue}
          onChange={(e) => updateSetting("learning.uiLocale", e.target.value)}
          className={inputClassName}
        >
          {supportedLngs.map((lng) => (
            <option key={lng} value={lng}>
              {UI_LOCALE_LABELS[lng] ?? lng}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function AppearancePanel() {
  const { t } = useTranslation();
  const { activeThemeId, setTheme, openThemeEditor } = useTheme();
  const { settings, updateSetting } = useSettings();
  const { close } = useModal();
  const navLayout = settings.appearance.navLayout ?? "topbar";

  const themePresets = [
    { id: "auto", labelKey: "settings.themeAuto" },
    { id: "light", labelKey: "settings.themeLight" },
    { id: "dark", labelKey: "settings.themeDark" },
    { id: "sepia", labelKey: "settings.themeSepia" },
    { id: "amoled", labelKey: "settings.themeAmoled" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {themePresets.map((p) => (
          <ChoiceChip
            key={p.id}
            selected={activeThemeId === p.id}
            onClick={() => setTheme(p.id)}
          >
            {t(p.labelKey)}
          </ChoiceChip>
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
        className="mt-3 text-sm font-medium text-accent hover:text-accent-hover"
      >
        {t("settings.customizeTheme", "Customize theme")}{" "}
        <Icon name="arrowBigRight" size={14} className="inline" />
      </button>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-text-primary">
          {t("settings.navLayout", "Navigation layout")}
        </p>
        <div className="flex flex-wrap gap-2">
          <ChoiceChip
            selected={navLayout === "topbar"}
            onClick={() => updateSetting("appearance.navLayout", "topbar")}
          >
            {t("settings.navLayoutTopbar", "Top bar")}
          </ChoiceChip>
          <ChoiceChip
            selected={navLayout === "sidebar"}
            onClick={() => updateSetting("appearance.navLayout", "sidebar")}
          >
            {t("settings.navLayoutSidebar", "Sidebar")}
          </ChoiceChip>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {t(
            "settings.navLayoutHint",
            "Sidebar shows on larger screens; mobile always uses the top bar.",
          )}
        </p>
      </div>
    </div>
  );
}

function AudioPanel() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const silentMode = settings.audio.silentMode;
  const volume = settings.audio.volume ?? 1;

  return (
    <div>
      <div className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor="settings-audio-volume"
              className="text-sm font-medium text-text-primary"
            >
              {t("settings.audioVolume", "App volume")}
            </label>
            <span className="text-xs tabular-nums text-text-muted">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <input
            id="settings-audio-volume"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) =>
              updateSetting("audio.volume", Number(e.target.value))
            }
            className="w-full accent-accent"
          />
          <p className="mt-1 text-xs text-text-muted">
            {t(
              "settings.audioVolumeHelp",
              "Adjust Lingo's audio without touching your device volume.",
            )}
          </p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3">
          <input
            type="checkbox"
            checked={silentMode}
            onChange={(e) =>
              updateSetting("audio.silentMode", e.target.checked)
            }
            className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium text-text-primary">
              {t(
                "settings.silentMode",
                "Silent mode — never auto-play audio",
              )}
            </span>
            <span className="text-xs text-text-muted">
              {t(
                "settings.silentModeHelp",
                "You can still tap audio buttons to hear sounds.",
              )}
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

function AccessibilityPanel() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();

  return (
    <div>
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={settings.accessibility.reducedMotion}
            onChange={(e) =>
              updateSetting("accessibility.reducedMotion", e.target.checked)
            }
            className="rounded border-border text-accent focus:ring-accent"
          />
          <span className="text-sm text-text-primary">
            {t("settings.reducedMotion")}
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={settings.accessibility.dyslexiaFont ?? false}
            onChange={(e) =>
              updateSetting("accessibility.dyslexiaFont", e.target.checked)
            }
            className="rounded border-border text-accent focus:ring-accent"
          />
          <span className="text-sm text-text-primary">
            {t(
              "settings.dyslexiaFont",
              "Dyslexia-friendly font (Atkinson Hyperlegible)",
            )}
          </span>
        </label>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-primary">
              {t("settings.fontSize", "Font size")}
            </span>
            <span className="text-xs font-medium text-text-muted">
              {Math.round((settings.accessibility.fontSize ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.85}
            max={1.4}
            step={0.05}
            value={settings.accessibility.fontSize ?? 1}
            onChange={(e) =>
              updateSetting("accessibility.fontSize", parseFloat(e.target.value))
            }
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>85%</span>
            <span>100%</span>
            <span>140%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();

  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={settings.notifications.reminderEnabled}
          onChange={(e) =>
            updateSetting("notifications.reminderEnabled", e.target.checked)
          }
          className="rounded border-border text-accent focus:ring-accent"
        />
        <span className="text-sm text-text-primary">
          {t("settings.dailyReminder")}
        </span>
      </label>
      {settings.notifications.reminderEnabled && (
        <div className="mt-3 flex items-center gap-2">
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
                localToUtcHHmm(local),
              );
            }}
            className={inputClassName}
          />
        </div>
      )}
    </div>
  );
}

function PrivacyPanel() {
  return (
    <div>
      {/* AccountPrivacySection owns its own heading + blurb. The
          settings modal's left nav already labels the section, so we
          drop the duplicate SectionIntro wrapper. */}
      <AccountPrivacySection />
    </div>
  );
}

function LanguageSettingsPanel({ languageId }: { languageId: string }) {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const lang = getLanguageConfig(languageId);

  if (!lang) {
    return (
      <p className="text-sm text-text-muted">
        {t("settings.languageNotFound", "Language not available.")}
      </p>
    );
  }

  if (languageId === "ja") {
    return (
      <div>
        <SectionIntro
          title={`${lang.flag} ${lang.name}`}
          help={t(
            "settings.languageJaHelp",
            "Reading aids and alphabet practice options for Japanese.",
          )}
        />

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text-primary">
            {t("settings.alphabetDisplay", "Alphabet display")}
          </h4>
          <p className="text-xs text-text-muted">
            {t("settings.alphabetDisplayHelp")}
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
              className="rounded border-border text-accent focus:ring-accent"
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
              className="rounded border-border text-accent focus:ring-accent"
            />
            <span className="text-sm text-text-primary">
              {t(
                "settings.showAlphabetFurigana",
                "Show furigana above Japanese text (where available)",
              )}
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={settings.learning.showRomaji ?? true}
              onChange={(e) =>
                updateSetting("learning.showRomaji", e.target.checked)
              }
              className="mt-0.5 rounded border-border text-accent focus:ring-accent"
            />
            <span>
              <span className="block text-sm text-text-primary">
                {t("settings.showRomaji", "Show romaji as a reading aid")}
              </span>
              <span className="block text-xs text-text-muted">
                {t(
                  "settings.showRomajiHelp",
                  "Shows romaji above kana across the app. Turns off automatically once you pass the alphabet test or reach Module 15 — turn it back on any time.",
                )}
              </span>
            </span>
          </label>
        </div>
        <LanguageDangerZone languageId={languageId} />
      </div>
    );
  }

  return (
    <div>
      <SectionIntro
        title={`${lang.flag} ${lang.name}`}
        help={t(
          "settings.languageKoHelp",
          "Course and practice options for Korean.",
        )}
      />
      <p className="text-sm text-text-muted">
        {t(
          "settings.languageKoEmpty",
          "No language-specific display options for Korean yet.",
        )}
      </p>
      <LanguageDangerZone languageId={languageId} />
    </div>
  );
}

function LanguageDangerZone({ languageId }: { languageId: string }) {
  const { t } = useTranslation();
  const { progress, srs } = useApi();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const onConfirm = async () => {
    setPending(true);
    try {
      // Phase 2 (2026-06-01) — courseId now comes from the language
      // module. Pre-Phase-2 this site passed `languageId` as the
      // course id; the per-language vocab-graduation storage was
      // keyed by that string so it has to keep being writable. The
      // registry-backed value is `module.courseId` (today: "mock-1").
      const courseId = tryGetLanguageModule(languageId)?.courseId ?? languageId;
      await resetLearnProgress(languageId, courseId, { progress, srs });
      showToast(
        t("settings.languageResetDone", {
          defaultValue:
            "Progress reset across your account — you're back at the start.",
        }),
        "success",
      );
    } catch (_err) {
      showToast(
        t("settings.languageResetError", {
          defaultValue: "Couldn't fully reset on the server. Try again.",
        }),
        "error",
      );
    } finally {
      setPending(false);
      setConfirmOpen(false);
    }
  };

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h4 className="text-sm font-semibold text-text-primary">
        {t("settings.languageDangerZone", { defaultValue: "Reset progress" })}
      </h4>
      <p className="mt-1 text-xs text-text-muted max-w-md">
        {t("settings.languageResetHint", {
          defaultValue:
            "Wipes lessons, SRS, and rollups for this language across your whole account. Other languages are not affected.",
        })}
      </p>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={pending}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-error/40 px-3 py-1.5 text-xs font-semibold text-error transition hover:bg-error/10 disabled:opacity-50"
      >
        <Icon name="trash" size={12} aria-hidden />
        {pending
          ? t("settings.languageResetWorking", { defaultValue: "Resetting…" })
          : t("settings.languageResetCta", {
              defaultValue: "Reset this language",
            })}
      </button>
      {confirmOpen ? (
        <ConfirmModal
          title={t("settings.languageResetTitle", {
            defaultValue: "Reset progress for this language?",
          })}
          message={t("settings.languageResetConfirm", {
            defaultValue:
              "This wipes lessons, SRS, and rollups for this language across your account. It cannot be undone.",
          })}
          cancelLabel={t("forum.cancel", { defaultValue: "Cancel" })}
          confirmLabel={t("settings.languageResetCta", {
            defaultValue: "Reset this language",
          })}
          danger
          onConfirm={onConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}
    </section>
  );
}
