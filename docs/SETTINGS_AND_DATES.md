# Settings and Date/Locale Conventions

## Settings Model

User preferences are defined in `lingo/src/shared/settings/types.ts` with versioning support:

- **Version:** `SETTINGS_VERSION` (currently 1) for future migrations
- **Shape:** Nested structure: `appearance`, `accessibility`, `audio`, `notifications`, `learning`, `display`

### Storage Flow

1. **Local first:** Settings load from `localStorage` immediately (keyed by user id or `"anonymous"`).
2. **Backend sync:** When authenticated, the app fetches settings from `GET /me/settings` and merges with local.
3. **On update:** `updateSetting(path, value)` writes to state, `localStorage`, and `PATCH /me/settings` when authenticated.

### Appearance

- **themeId:** Built-in (`light`, `dark`, `sepia`, `amoled`) or custom id
- **darkMode:** `"auto" | "light" | "dark"`
  - `auto`: Uses `prefers-color-scheme` to pick light vs dark
  - `light` / `dark`: Override system preference

### Accessibility

- **reducedMotion:** Defaults to `prefers-reduced-motion: reduce`; user can override in settings
- When enabled, `data-reduced-motion="true"` is set on `<html>`; animations and transitions are shortened

### Notifications

- **reminderEnabled:** Toggle for daily practice reminder
- **dailyReminderTime:** Stored as UTC `"HH:mm"` (e.g. `"14:00"` = 2 PM UTC)
  - UI shows time in user’s local timezone
  - User picks local time; client converts to UTC before saving

### Learning

- **learningLanguageId:** Language being learned (e.g. `"ko"`, `"ja"`)
- **uiLocale:** UI locale for i18n (e.g. `"en"`, `"ko"`)

### Display (optional)

- **dateLocale:** Override for date formatting
- **timezoneOverride:** IANA timezone (e.g. `"America/New_York"`) for power users who want fixed timezone display

---

## Date Convention

### Server

- **Always return dates as ISO 8601 strings (UTC).** Document in API contracts.

### Client

- Treat all server date strings as UTC.
- Convert to local time for display using device locale (or `settings.display.dateLocale` / `timezoneOverride` if set).
- Use `formatDate()` and `formatDateOnly()` from `@/shared/utils/formatDate`.
- Use `useDateFormat()` when locale/timezone from settings should be applied.

---

## Dark Mode: Auto

When `darkMode === "auto"`, the app listens to `window.matchMedia("(prefers-color-scheme: dark)")` and derives the effective theme. A light theme (e.g. sepia) is swapped to dark (e.g. dark/amoled) when the system prefers dark, and vice versa.

---

## Reduced Motion

- Default: read `window.matchMedia("(prefers-reduced-motion: reduce)").matches` on init.
- User can override in Settings > Accessibility.
- Global CSS shortens `animation-duration` and `transition-duration` when `data-reduced-motion="true"` is set on the document root.
