# Handoff — Settings modal & theme editor (2026-05)

Summary of the settings UI pass (modal restructure, theme fixes). Canonical detail: `src/features/settings/README.md`, `docs/SETTINGS_AND_DATES.md`.

## Shipped

### Settings modal

- Wide modal (`max-w-4xl`) with sidebar nav: General, Appearance, Audio, Accessibility, Notifications, Languages (expandable), Privacy.
- Deep links: `/settings`, `/settings/profile` → open modal, navigate to `/home` underneath (mid-lesson safe).
- **Removed from settings:** study language picker, duplicate “set active language” on language panels, Privacy Policy link/divider in privacy panel (use `/privacy`).
- **General:** interface language `<select>`; profile link when authenticated.
- **Audio:** volume + silent mode moved out of theme editor into Settings → Audio.

### Theme editor

- Community themes: **Preview** / **Stop** (`ThemeContext.previewTokens` temporary apply).
- **Forest Study** mock theme: dark green palette (was sepia + green accent).
- **Custom/installed themes:** no longer replaced by plain `light`/`dark` when auto/system mode disagrees (`resolveEffectiveTheme` early return for custom ids).

### Files (main)

| Area | Files |
|------|--------|
| Settings UI | `SettingsContent.tsx`, `SettingsNav.tsx`, `SettingsSectionPanel.tsx`, `SettingsOpenRoute.tsx`, `AccountPrivacySection.tsx` |
| Modal | `ModalRoot.tsx` |
| Themes | `ThemeContext.tsx`, `ThemeEditorPanel.tsx`, `community-mock.ts` |
| Routes | `App.tsx` (`/settings`, `/settings/profile`) |

## Not done / follow-ups

- Per-language settings storage (`learning.byLanguage`) — UI is per-lang, data still global `learning.*`.
- `display.dateLocale` / `timezoneOverride` not in modal.
- `flashcards.studyOptions` still on Flashcards page only.
- `soundEnabled` in types, no UI.
- Backend PATCH still partial (accessibility, audio, romaji flags local-first).
- `reminderEnabled` not wired to push/email delivery.

## Docs updated

- `src/features/settings/README.md`
- `docs/SETTINGS_AND_DATES.md`
- `docs/agents/basecontext/FRONTEND_CONTEXT.md`
- `docs/tasks/community-themes.md`
- `docs/user/getting-started.md` (dev mirror)
- `README.md` (i18n section)
- `docs/handoff-2026-05-23.md` (audio task #5 marked done)
