import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { useApi } from "@/shared/api/provider";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useToast } from "@/shared/contexts/ToastContext";
import { useModal } from "@/shared/contexts/ModalContext";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { useMe } from "@/shared/hooks/useMe";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { supportedLngs } from "@/shared/i18n/i18n";
import { utcToLocalHHmm, localToUtcHHmm } from "@/shared/utils/reminderTime";
import { todayLocalDate } from "@/shared/settings/romajiAutoFlip";
import { resetLearnProgress } from "@/features/learn/resetLearnProgress";
import { tryGetLanguageModule } from "@/shared/language/registry";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { Switch } from "@/shared/components/ui/Switch";
import { Select } from "@/shared/components/ui/Select";
import { Slider } from "@/shared/components/ui/Slider";
import { AccountPrivacySection } from "./AccountPrivacySection";
import { ImportStudyHistorySection } from "./ImportStudyHistorySection";
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
    case "accessibility":
      return <AccessibilityPanel />;
    case "notifications":
      return <NotificationsPanel />;
    case "privacy":
      return <PrivacyPanel />;
    case "more-info":
      return <MoreInfoPanel />;
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
  const { settings, updateSetting } = useSettings();
  const { closeAll } = useModal();
  const { me } = useMe();
  // Sound controls live here since the Audio section merged into General
  // (2026-07-15). The edit-profile row was removed the same day — the profile
  // page owns inline editing, so the concurrent branch's social-flag gate on
  // that row is subsumed by its removal.
  const silentMode = settings.audio.silentMode;
  const volume = settings.audio.volume ?? 1;

  const uiLocaleValue =
    supportedLngs.find((lng) => settings.learning.uiLocale.startsWith(lng)) ??
    supportedLngs[0];

  return (
    <Panel>
      <SectionHeader
        title={t("settings.nav.general")}
        description={t("settings.generalHelp")}
      />

      {me?.username ? (
        <SettingsGroup label={t("settings.profileGroup", "Profile")}>
          <SettingRow
            label={t("settings.profileRowLabel", "Your public profile")}
            help={t(
              "settings.profileRowHelp",
              "View or edit your display name, bio, and picture.",
            )}
            control={
              <Link
                to={`/u/${encodeURIComponent(me.username)}`}
                onClick={closeAll}
                className="inline-flex items-center gap-1 text-sm font-medium text-accent transition hover:text-accent-hover"
              >
                {t("settings.open", "Open")}
                <Icon name="arrowBigRight" size={14} aria-hidden />
              </Link>
            }
          />
        </SettingsGroup>
      ) : null}

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
      </SettingsGroup>

      <SettingsGroup label={t("settings.soundGroup", "Sound")}>
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
              onCheckedChange={(next) => updateSetting("audio.silentMode", next)}
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

function AppearancePanel() {
  const { t } = useTranslation();
  const { activeThemeId, setTheme, openThemeEditor, customThemes } = useTheme();
  const { settings, updateSetting } = useSettings();
  const { close } = useModal();
  const navLayout = settings.appearance.navLayout ?? "topbar";

  const themeOptions = [
    { id: "auto", labelKey: "settings.themeAuto" },
    { id: "light", labelKey: "settings.themeLight" },
    { id: "dark", labelKey: "settings.themeDark" },
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
              <Select
                id="settings-theme"
                aria-label={t("settings.theme")}
                value={activeThemeId}
                onChange={(e) => setTheme(e.target.value)}
              >
                {themeOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {t(o.labelKey)}
                  </option>
                ))}
                {customThemes.length > 0 ? (
                  <optgroup label={t("settings.yourThemes", "Your themes")}>
                    {customThemes.map((th) => (
                      <option key={th.id} value={th.id}>
                        {th.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </Select>
              <button
                type="button"
                onClick={() => {
                  close();
                  openThemeEditor();
                }}
                className="inline-flex items-center gap-1 text-sm font-medium text-accent transition hover:text-accent-hover"
              >
                {t("settings.customizeTheme", "Open theme editor")}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    id: "topbar",
                    icon: "panelTop",
                    label: t("settings.navLayoutTopbar", "Top bar"),
                    desc: t(
                      "settings.navLayoutTopbarDesc",
                      "A bar across the top of every page.",
                    ),
                  },
                  {
                    id: "sidebar",
                    icon: "panelLeft",
                    label: t("settings.navLayoutSidebar", "Sidebar"),
                    desc: t(
                      "settings.navLayoutSidebarDesc",
                      "A rail beside the page on larger screens.",
                    ),
                  },
                ] as const
              ).map((o) => {
                const selected = navLayout === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => updateSetting("appearance.navLayout", o.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-card border p-4 text-center transition",
                      selected
                        ? "border-accent bg-accent-muted text-accent ring-1 ring-accent"
                        : "border-border bg-surface text-text-secondary hover:border-text-muted hover:bg-surface-muted",
                    )}
                  >
                    <Icon name={o.icon} size={30} aria-hidden />
                    <span className="text-sm font-semibold text-text-primary">
                      {o.label}
                    </span>
                    <span className="text-xs leading-snug text-text-muted">
                      {o.desc}
                    </span>
                  </button>
                );
              })}
            </div>
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

/**
 * "More info" — the navigable links + open-source attributions that used to
 * live in the site footer. The footer now only renders on the public landing
 * page, so this section is where the rest of the app surfaces them.
 */
function MoreInfoPanel() {
  const { t } = useTranslation();
  const { closeAll } = useModal();
  const year = new Date().getFullYear();

  const internalLinks: { to: string; label: string }[] = [
    { to: "/about", label: t("landing.footerAbout", "About") },
    { to: "/privacy", label: t("landing.footerPrivacy", "Privacy") },
    { to: "/terms", label: t("landing.footerTerms", "Terms") },
  ];

  return (
    <Panel>
      <SectionHeader
        title={t("settings.moreInfo.title", "More info")}
        description={t(
          "settings.moreInfo.blurb",
          "Free, open-source language learning. MIT-licensed — no paywalls.",
        )}
      />

      <SettingsGroup label={t("settings.moreInfo.linksLabel", "Links")}>
        {internalLinks.map((l) => (
          <SettingRow
            key={l.to}
            label={l.label}
            control={
              <Link
                to={l.to}
                onClick={closeAll}
                className="inline-flex items-center gap-1 text-sm font-medium text-accent transition hover:text-accent-hover"
              >
                {t("settings.open", "Open")}
                <Icon name="arrowBigRight" size={14} aria-hidden />
              </Link>
            }
          />
        ))}
        <SettingRow
          label={t("landing.footerOpenSource", "Open source")}
          help={t(
            "settings.moreInfo.openSourceHelp",
            "Browse the code on GitHub.",
          )}
          control={
            <a
              href="https://github.com/open-lingo/lingo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent transition hover:text-accent-hover"
            >
              GitHub
              <Icon name="github" size={14} aria-hidden />
            </a>
          }
        />
      </SettingsGroup>

      <SettingsGroup
        label={t("settings.moreInfo.attributionsLabel", "Attributions")}
      >
        <div className="space-y-2 px-4 py-3.5 text-sm leading-relaxed text-text-muted">
          <p>
            {t("landing.footerCopyright", "© {{year}} Open Lingo · MIT License", {
              year,
            })}
          </p>
          <p>
            {t("landing.footerStrokeOrder", "Stroke order: ")}
            <a
              href="http://kanjivg.tagaini.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary"
            >
              KanjiVG
            </a>{" "}
            ·{" "}
            <a
              href="https://creativecommons.org/licenses/by-sa/3.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary"
            >
              CC BY-SA 3.0
            </a>{" "}
            · {t("landing.footerStrokeOrderHangul", "Hangul stroke data © Open Lingo")}
          </p>
        </div>
      </SettingsGroup>
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
              "Shows romaji above kana across the app. It steps back on its own as you learn each script — hiragana around Module 7, katakana around Module 17. Turn it fully on or off here any time.",
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
            label={t("settings.romajiForToday", "Show romaji for today")}
            help={t(
              "settings.romajiForTodayHelp",
              "A temporary peek: bring romaji back for the rest of today — even for scripts you've moved past — then it resets tomorrow so you keep reading on your own.",
            )}
            control={
              <Switch
                checked={settings.learning.romajiOnForDay === todayLocalDate()}
                onCheckedChange={(next) =>
                  updateSetting(
                    "learning.romajiOnForDay",
                    next ? todayLocalDate() : null,
                  )
                }
                ariaLabel={t("settings.romajiForToday", "Show romaji for today")}
              />
            }
          />
          <SettingRow
            asLabel
            label={t("settings.hideBuildTileRomaji", "Hide romaji on spelling tiles")}
            help={t(
              "settings.hideBuildTileRomajiHelp",
              "On word-building exercises, hides romaji on the kana tiles — tap a tile to hear its sound and reveal it, or hover to peek. Turns on automatically at Module 5 once you can read kana. Independent of the reading aid above.",
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

        {/* Dev-gated for v1 — same gate style as DevPanel visibility. */}
        {import.meta.env.DEV ? <ImportStudyHistorySection /> : null}

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
      <SettingsGroup label={t("settings.alphabetDisplay", "Alphabet display")}>
        <SettingRow
          asLabel
          label={t("settings.showRomanization", "Show romanization")}
          help={t(
            "settings.showRomanizationHelp",
            "Show Revised Romanization above Hangul as a reading aid.",
          )}
          control={
            <Switch
              checked={settings.learning.showRomanization ?? true}
              onCheckedChange={(next) =>
                updateSetting("learning.showRomanization", next)
              }
              ariaLabel={t("settings.showRomanization", "Show romanization")}
            />
          }
        />
      </SettingsGroup>
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
