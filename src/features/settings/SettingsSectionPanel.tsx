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
import { Switch } from "@/shared/components/ui/Switch";
import { Select } from "@/shared/components/ui/Select";
import { Slider } from "@/shared/components/ui/Slider";
import { AccountPrivacySection } from "./AccountPrivacySection";
import { ChoiceChip } from "@/shared/components/ui/formStyles";
import {
  SectionHeader,
  SettingsGroup,
  SettingRow,
} from "./SettingsPrimitives";
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

/** Consistent outer wrapper so every panel shares the same header→body rhythm. */
function Panel({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
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

  const uiLocaleValue =
    supportedLngs.find((lng) => settings.learning.uiLocale.startsWith(lng)) ??
    supportedLngs[0];

  return (
    <Panel>
      <SectionHeader
        title={t("settings.nav.general")}
        description={t("settings.generalHelp")}
      />

      <SettingsGroup>
        <SettingRow
          htmlFor="settings-ui-locale"
          label={t("settings.uiLocale")}
          help={t("settings.uiLocaleHelp")}
          stacked
          control={
            <Select
              id="settings-ui-locale"
              value={uiLocaleValue}
              onChange={(e) =>
                updateSetting("learning.uiLocale", e.target.value)
              }
            >
              {supportedLngs.map((lng) => (
                <option key={lng} value={lng}>
                  {UI_LOCALE_LABELS[lng] ?? lng}
                </option>
              ))}
            </Select>
          }
        />
        {isAuthenticated && profileUsername ? (
          <SettingRow
            label={t("profile.editProfile")}
            help={t(
              "settings.editProfileHelp",
              "Update your display name, bio, and avatar.",
            )}
            control={
              <Link
                to={`/u/${encodeURIComponent(profileUsername)}`}
                onClick={closeAll}
                className="inline-flex items-center gap-1 text-sm font-medium text-accent transition hover:text-accent-hover"
              >
                {t("settings.open", "Open")}
                <Icon name="arrowBigRight" size={14} aria-hidden />
              </Link>
            }
          />
        ) : null}
      </SettingsGroup>
    </Panel>
  );
}

function AppearancePanel() {
  const { t } = useTranslation();
  const { activeThemeId, setTheme, openThemeEditor } = useTheme();
  const { settings, updateSetting } = useSettings();
  const { close } = useModal();
  const navLayout = settings.appearance.navLayout ?? "topbar";
  const cornerStyle = settings.appearance.cornerStyle ?? "default";
  const isCustom = activeThemeId.startsWith("custom-");

  const cornerStylePresets: {
    id: "sharp" | "default" | "rounded" | "pill";
    labelKey: string;
    fallback: string;
  }[] = [
    { id: "sharp", labelKey: "settings.cornerStyleSharp", fallback: "Sharp" },
    { id: "default", labelKey: "settings.cornerStyleDefault", fallback: "Default" },
    { id: "rounded", labelKey: "settings.cornerStyleRounded", fallback: "Rounded" },
    { id: "pill", labelKey: "settings.cornerStylePill", fallback: "Pill" },
  ];

  const themePresets = [
    { id: "auto", labelKey: "settings.themeAuto" },
    { id: "light", labelKey: "settings.themeLight" },
    { id: "dark", labelKey: "settings.themeDark" },
    { id: "sepia", labelKey: "settings.themeSepia" },
    { id: "amoled", labelKey: "settings.themeAmoled" },
  ];

  return (
    <Panel>
      <SectionHeader
        title={t("settings.nav.appearance")}
        description={t("settings.appearanceHelp")}
      />

      <SettingsGroup>
        <SettingRow
          label={t("settings.theme")}
          help={t(
            "settings.themeHelp",
            "Pick a preset or build your own color scheme.",
          )}
          stacked
          control={
            <div className="space-y-3">
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
                {isCustom ? (
                  <span className="rounded-lg border border-accent bg-accent-muted px-3 py-1.5 text-sm font-medium text-accent">
                    {t("settings.themeCustom", "Custom")}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  close();
                  openThemeEditor();
                }}
                className="inline-flex items-center gap-1 text-sm font-medium text-accent transition hover:text-accent-hover"
              >
                {t("settings.customizeTheme", "Customize theme")}
                <Icon name="arrowBigRight" size={14} aria-hidden />
              </button>
            </div>
          }
        />

        <SettingRow
          label={t("settings.navLayout", "Navigation layout")}
          help={t(
            "settings.navLayoutHint",
            "Sidebar shows on larger screens; mobile always uses the top bar.",
          )}
          stacked
          control={
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
          }
        />

        <SettingRow
          label={t("settings.cornerStyle", "Corner style")}
          help={t(
            "settings.cornerStyleHint",
            "How rounded cards and dialogs look across the app.",
          )}
          stacked
          control={
            <div className="flex flex-wrap gap-2">
              {cornerStylePresets.map((p) => (
                <ChoiceChip
                  key={p.id}
                  selected={cornerStyle === p.id}
                  onClick={() => updateSetting("appearance.cornerStyle", p.id)}
                >
                  {t(p.labelKey, p.fallback)}
                </ChoiceChip>
              ))}
            </div>
          }
        />
      </SettingsGroup>
    </Panel>
  );
}

function AudioPanel() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const silentMode = settings.audio.silentMode;
  const volume = settings.audio.volume ?? 1;

  return (
    <Panel>
      <SectionHeader
        title={t("settings.nav.audio")}
        description={t("settings.audioHelp")}
      />

      <SettingsGroup>
        <SettingRow
          htmlFor="settings-audio-volume"
          label={t("settings.audioVolume", "App volume")}
          help={t(
            "settings.audioVolumeHelp",
            "Adjust Lingo's audio without touching your device volume.",
          )}
          stacked
          control={
            <Slider
              id="settings-audio-volume"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) =>
                updateSetting("audio.volume", Number(e.target.value))
              }
              showValue
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
          }
        />
        <SettingRow
          asLabel
          label={t("settings.silentModeLabel", "Silent mode")}
          help={t(
            "settings.silentModeHelp",
            "Never auto-play audio. You can still tap audio buttons to hear sounds.",
          )}
          control={
            <Switch
              checked={silentMode}
              onCheckedChange={(next) =>
                updateSetting("audio.silentMode", next)
              }
              ariaLabel={t("settings.silentModeLabel", "Silent mode")}
            />
          }
        />
        <SettingRow
          asLabel
          label={t("settings.soundEffects", "Sound effects")}
          help={t(
            "settings.soundEffectsHelp",
            "Soft chimes for answers, matches, and lesson completion. Speech audio is unaffected.",
          )}
          control={
            <Switch
              checked={settings.audio.soundEnabled ?? true}
              onCheckedChange={(next) =>
                updateSetting("audio.soundEnabled", next)
              }
              ariaLabel={t("settings.soundEffects", "Sound effects")}
            />
          }
        />
      </SettingsGroup>
    </Panel>
  );
}

function AccessibilityPanel() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const fontSize = settings.accessibility.fontSize ?? 1;

  return (
    <Panel>
      <SectionHeader
        title={t("settings.accessibility")}
        description={t("settings.accessibilityHelp")}
      />

      <SettingsGroup>
        <SettingRow
          asLabel
          label={t("settings.reducedMotion")}
          help={t(
            "settings.reducedMotionHelp",
            "Minimize animations and transitions across the app.",
          )}
          control={
            <Switch
              checked={settings.accessibility.reducedMotion}
              onCheckedChange={(next) =>
                updateSetting("accessibility.reducedMotion", next)
              }
              ariaLabel={t("settings.reducedMotion")}
            />
          }
        />
        <SettingRow
          asLabel
          label={t("settings.dyslexiaFontLabel", "Dyslexia-friendly font")}
          help={t(
            "settings.dyslexiaFontHelp",
            "Switches the app typeface to Atkinson Hyperlegible.",
          )}
          control={
            <Switch
              checked={settings.accessibility.dyslexiaFont ?? false}
              onCheckedChange={(next) =>
                updateSetting("accessibility.dyslexiaFont", next)
              }
              ariaLabel={t("settings.dyslexiaFontLabel", "Dyslexia-friendly font")}
            />
          }
        />
        <SettingRow
          label={t("settings.fontSize", "Font size")}
          help={t(
            "settings.fontSizeHelp",
            "Scale text size across the whole app.",
          )}
          stacked
          control={
            <div className="space-y-1">
              <Slider
                min={0.85}
                max={1.4}
                step={0.05}
                value={fontSize}
                onChange={(e) =>
                  updateSetting(
                    "accessibility.fontSize",
                    parseFloat(e.target.value),
                  )
                }
                showValue
                formatValue={(v) => `${Math.round(v * 100)}%`}
              />
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>85%</span>
                <span>100%</span>
                <span>140%</span>
              </div>
            </div>
          }
        />
      </SettingsGroup>
    </Panel>
  );
}

function NotificationsPanel() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const reminderEnabled = settings.notifications.reminderEnabled;

  return (
    <Panel>
      <SectionHeader
        title={t("settings.notifications")}
        description={t("settings.notificationsHelp")}
      />

      <SettingsGroup>
        <SettingRow
          asLabel
          label={t("settings.dailyReminder")}
          help={t(
            "settings.dailyReminderHelp",
            "A nudge to keep your streak going.",
          )}
          control={
            <Switch
              checked={reminderEnabled}
              onCheckedChange={(next) =>
                updateSetting("notifications.reminderEnabled", next)
              }
              ariaLabel={t("settings.dailyReminder")}
            />
          }
        />
        {reminderEnabled ? (
          <SettingRow
            htmlFor="reminder-time"
            label={t("settings.reminderTime")}
            help={t(
              "settings.reminderTimeHelp",
              "When to send your daily reminder.",
            )}
            control={
              <input
                id="reminder-time"
                type="time"
                value={
                  settings.notifications.dailyReminderTime
                    ? utcToLocalHHmm(settings.notifications.dailyReminderTime)
                    : "09:00"
                }
                onChange={(e) =>
                  updateSetting(
                    "notifications.dailyReminderTime",
                    localToUtcHHmm(e.target.value),
                  )
                }
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            }
          />
        ) : null}
      </SettingsGroup>
    </Panel>
  );
}

function PrivacyPanel() {
  const { t } = useTranslation();
  return (
    <Panel>
      <SectionHeader
        title={t("legal.settings.privacyTitle", "Privacy & data")}
        description={t(
          "legal.settings.privacyBlurb",
          "We store your learning progress and profile to run the app. We do not sell your personal information.",
        )}
      />
      <AccountPrivacySection embedded />
    </Panel>
  );
}

function LanguageSettingsPanel({ languageId }: { languageId: string }) {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const lang = getLanguageConfig(languageId);

  if (!lang) {
    return (
      <Panel>
        <p className="text-sm text-text-muted">
          {t("settings.languageNotFound", "Language not available.")}
        </p>
      </Panel>
    );
  }

  if (languageId === "ja") {
    return (
      <Panel>
        <SectionHeader
          title={
            <span className="inline-flex items-center gap-2">
              <span aria-hidden>{lang.flag}</span>
              {lang.name}
            </span>
          }
          description={t(
            "settings.languageJaHelp",
            "Reading aids and alphabet practice options for Japanese.",
          )}
        />

        <SettingsGroup label={t("settings.alphabetDisplay", "Alphabet display")}>
          <SettingRow
            asLabel
            label={t(
              "settings.showAlphabetRomanization",
              "Show romanization under alphabet characters",
            )}
            control={
              <Switch
                checked={settings.learning.showAlphabetRomanization ?? true}
                onCheckedChange={(next) =>
                  updateSetting("learning.showAlphabetRomanization", next)
                }
                ariaLabel={t(
                  "settings.showAlphabetRomanization",
                  "Show romanization under alphabet characters",
                )}
              />
            }
          />
          <SettingRow
            asLabel
            label={t("settings.showRomaji", "Show romaji as a reading aid")}
            help={t(
              "settings.showRomajiHelp",
              "Shows romaji above kana across the app. Turns off automatically once you pass the alphabet test or reach Module 15 — turn it back on any time.",
            )}
            control={
              <Switch
                checked={settings.learning.showRomaji ?? true}
                onCheckedChange={(next) =>
                  updateSetting("learning.showRomaji", next)
                }
                ariaLabel={t("settings.showRomaji", "Show romaji as a reading aid")}
              />
            }
          />
          <SettingRow
            asLabel
            label={t("settings.hideBuildTileRomaji", "Hide romaji on spelling tiles")}
            help={t(
              "settings.hideBuildTileRomajiHelp",
              "On word-building exercises, hides romaji on the kana tiles — tap a tile to hear its sound and reveal it, or hover to peek. Turns on automatically at Module 10 once you can read kana. Independent of the reading aid above.",
            )}
            control={
              <Switch
                checked={settings.learning.hideBuildTileRomaji ?? false}
                onCheckedChange={(next) =>
                  updateSetting("learning.hideBuildTileRomaji", next)
                }
                ariaLabel={t("settings.hideBuildTileRomaji", "Hide romaji on spelling tiles")}
              />
            }
          />
        </SettingsGroup>


        <LanguageDangerZone languageId={languageId} />
      </Panel>
    );
  }

  return (
    <Panel>
      <SectionHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span aria-hidden>{lang.flag}</span>
            {lang.name}
          </span>
        }
        description={t(
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
    </Panel>
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
    <section className="space-y-3 rounded-card border border-error/40 bg-error/5 p-4">
      <div className="space-y-1">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-error">
          <Icon name="alertTriangle" size={14} aria-hidden />
          {t("settings.languageDangerZone", { defaultValue: "Reset progress" })}
        </h4>
        <p className="max-w-md text-sm text-text-muted">
          {t("settings.languageResetHint", {
            defaultValue:
              "Wipes lessons, SRS, and rollups for this language across your whole account. Other languages are not affected.",
          })}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-error/40 bg-surface px-3 py-1.5 text-sm font-semibold text-error transition hover:bg-error/10 disabled:opacity-50"
      >
        <Icon name="trash" size={14} aria-hidden />
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
