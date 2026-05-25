# Settings and Date/Locale Conventions

## Settings UI

Learner-facing settings live in a **modal** (`SettingsContent`), not a dedicated route page.

- **Open:** Auth menu, Learn page, or deep links `/settings` / `/settings/profile` (routes open the modal then replace-navigate to `/home` so lessons stay mounted underneath).
- **Layout:** Sidebar nav (`SettingsNav`) + panel (`SettingsSectionPanel`), modal width `max-w-4xl`.
- **Study language:** Changed only via header **`LanguageSelector`** → `learning.learningLanguageId`. Not duplicated in settings.
- **Interface language:** **General** → dropdown → `learning.uiLocale` (synced to i18next in `SettingsContext`).
- **Audio:** **Settings → Audio** (`silentMode`, `volume`). Not in the theme editor.
- **Privacy:** Cookie controls and account deletion only; full policy is `/privacy` (no redundant policy link in the modal).

Per-language sidebar (**Languages → 日本語 / 한국어**): Japanese reading-aid toggles; Korean placeholder. Values still live under `learning.*` globally until per-language storage is added.

Implementation details: `src/features/settings/README.md`.

---

## Settings Model

User preferences are defined in `lingo/src/shared/settings/types.ts`:

- **Version:** `SETTINGS_VERSION` (currently 1)
- **Shape:** `appearance`, `accessibility`, `audio`, `notifications`, `learning`, `display`, `flashcards`

### Storage flow

1. **Local first:** `localStorage` (`open-lingo-settings`, keyed by user id or `"anonymous"`).
2. **Backend sync:** When authenticated, fetch `GET /me/settings` and merge.
3. **On update:** `updateSetting(path, value)` → state, localStorage, `PATCH /me/settings` when authenticated (subset of fields today — see README).

### Appearance

- **`appearance.themeId`:** `auto` | `light` | `dark` | `sepia` | `amoled` | `custom-*`
- **`auto`:** `ThemeContext` maps to light/dark preset from `prefers-color-scheme`.
- **Built-in light/dark swap:** If the active id is a built-in preset and system/UI mode disagrees (e.g. sepia while system wants dark), resolver may fall back to `light` or `dark`.
- **Custom / installed community themes:** Always keep their own tokens; never swapped to plain dark/light (fixed 2026-05).

Theme customization UI: `ThemeEditorPanel` (presets, your themes, community list with **Preview** / **Add**, color editor).

### Accessibility

- **`reducedMotion`:** User override; also sets `data-reduced-motion` on `<html>`.
- **`dyslexiaFont`:** Prepends Atkinson Hyperlegible in `ThemeContext` when applying tokens.
- **`fontSize`:** Scale factor 0.85–1.4 on document root.

### Audio

- **`volume`:** 0–1, applied via `src/shared/audio/volume.ts` (TTS + local audio).
- **`silentMode`:** Disables auto-play hooks; user-initiated playback still works.
- **`soundEnabled`:** In types; not exposed in UI yet.

### Notifications

- **`reminderEnabled`**, **`dailyReminderTime`** (UTC `HH:mm`; UI uses local time).

### Learning

- **`learningLanguageId`:** Active course language (`ko`, `ja`, …). Set via **`LanguageSelector`**, not settings modal.
- **`uiLocale`:** Menus/buttons (i18n). Settings → General dropdown.
- **`showAlphabetRomanization`**, **`showAlphabetFurigana`**, **`showRomaji`**, **`romajiAutoFlipped`:** Japanese reading aids; auto-off rules in `romajiAutoFlip.ts` / `LessonPage`.

### Display (optional, not in modal yet)

- **`dateLocale`**, **`timezoneOverride`:** For `formatDate` / `useDateFormat`.

### Flashcards

- **`flashcards.studyOptions`:** Edited on Flashcards page (`StudyOptionsEditor`), not in settings modal.

---

## Date Convention

### Server

- Return dates as **ISO 8601 UTC** strings.

### Client

- Parse as UTC; display in local time (or `settings.display.dateLocale` / `timezoneOverride` when set).
- Helpers: `formatDate`, `formatDateOnly`, `useDateFormat` (`@/shared/utils/formatDate`).

---

## Theme: community preview

In `ThemeEditorPanel`, each mock community theme has **Preview** (temporary app-wide apply via `ThemeContext.setPreviewTokens`) and **Stop** / close editor to restore saved theme. Mock data: `src/shared/theme/community-mock.ts` (e.g. **Forest Study** uses a dark green palette, not sepia).

---

## Reduced motion

- Default can follow `prefers-reduced-motion`.
- Override: **Settings → Accessibility**.
