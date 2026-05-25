# User settings and profile metadata

## Settings UI (modal)

Settings are a **wide modal** (`max-w-4xl`), not a standalone page. Learners can open it mid-lesson without losing place.

| Entry point | Behavior |
|-------------|----------|
| Auth menu → Settings | `openSettings()` via `ModalContext` |
| Learn page settings control | Same |
| `/settings` | `SettingsOpenRoute` opens modal, then `Navigate` to `/home` (keeps underlying route) |
| `/settings/profile` | Opens settings + profile stack, then `/home` |

**Layout:** `SettingsContent` = left `SettingsNav` + scrollable `SettingsSectionPanel`.

| Nav section | Content |
|-------------|---------|
| **General** | Edit profile link (auth), **interface language** (`<select>` → `learning.uiLocale`) |
| **Appearance** | Theme presets, link to theme editor |
| **Audio** | App volume, silent mode (auto-play off; tap-to-play still works) |
| **Accessibility** | Reduced motion, dyslexia font, font size slider |
| **Notifications** | Daily reminder + local time → UTC storage |
| **Languages** (expandable) | Per-language display options (see below) |
| **Privacy & data** | Cookie prefs, delete account (no inline Privacy Policy link — use `/privacy`) |

**Not in settings (by design):**

- **Study language** — Header `LanguageSelector` only (`LanguageContext` / `learning.learningLanguageId`). Do not duplicate in General or language panels.

### Language sidebar panels

- **Japanese (`lang-ja`):** `showAlphabetRomanization`, `showAlphabetFurigana`, `showRomaji` (stored under global `learning.*` today; UI is per-language).
- **Korean (`lang-ko`):** Placeholder until KO-specific options exist.

### Related modals

- **Profile** — `ProfileEditPanel` stacked on settings; back returns to settings.
- **Theme editor** — Separate panel (`ThemeEditorPanel`); colors/presets/custom + community themes. Audio controls live in **Settings → Audio**, not here.

### Key files

```
features/settings/
  SettingsContent.tsx       # Modal body + nav state
  SettingsNav.tsx           # Sidebar sections + expandable Languages
  SettingsSectionPanel.tsx  # Panel content per section
  settingsSections.ts       # Section id types
  SettingsOpenRoute.tsx     # Deep link /settings
  SettingsProfileOpenRoute.tsx
  AccountPrivacySection.tsx
  storage.ts                # localStorage key open-lingo-settings
shared/components/ModalRoot.tsx  # max-w-4xl for settings id
```

## Data model

Defined in `src/shared/settings/types.ts` (`SETTINGS_VERSION` = 1). Applied via `SettingsContext` (`updateSetting`, `updateFlashcards`).

| Namespace | Fields | In modal? | Backend PATCH (today) |
|-----------|--------|-----------|------------------------|
| `appearance` | `themeId` | Appearance | Yes (`theme`, `appearance`) |
| `accessibility` | `reducedMotion`, `dyslexiaFont`, `fontSize` | Accessibility | Local-first |
| `audio` | `soundEnabled`, `silentMode`, `volume` | Audio | Local-first |
| `notifications` | `reminderEnabled`, `dailyReminderTime` (UTC) | Notifications | Yes |
| `learning` | `learningLanguageId`, `uiLocale`, alphabet/romaji flags, `onboardingCompleted` | Partial | Partial (`learningLanguage`, `uiLocale`, nested `learning`) |
| `display` | `dateLocale`, `timezoneOverride` | Not yet | — |
| `flashcards` | `studyOptions[]` | Flashcards page editor | Yes |

See `lingo/docs/SETTINGS_AND_DATES.md` for date/locale and theme interaction notes.

## Persistence

- **Local first:** `getStoredSettings` / `setStoredSettings` in `settings/storage.ts` (key `open-lingo-settings`, per Auth0 `sub` or `"anonymous"`).
- **Backend:** When authenticated, `GET/PATCH …/me/settings` merges with local (`SettingsContext`).
- On user switch, user-specific local keys (SRS, alphabet progress, profile cache, etc.) are cleared via `ensureUserConsistency`.

## Storing settings per user (cross-device)

### 1. Your own User API (recommended)

- **GET** `/api/users/me/settings` — returns `UserSettings` (or 404 → defaults).
- **PATCH** `/api/users/me/settings` — `Partial<UserSettings>`; merge server-side.

Extend PATCH to include `accessibility`, `audio`, and full `learning` (romaji, etc.) when product needs cross-device parity.

### 2. Auth0 `user_metadata`

Requires a backend calling Management API; usually worse fit than a User API blob. See historical note in repo docs.
