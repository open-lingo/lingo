# User settings and profile metadata

## Current behavior

- **Learning language** and **theme** are persisted in localStorage (separate keys). The Settings page lets users change them; they apply immediately and persist per browser.
- **UI locale** (i18n) is persisted by i18next in `localStorage` under `i18nextLng`.

The `settings/storage` module uses a single key (`open-lingo-settings`). When the logged-in user changes, user-specific localStorage keys (SRS, alphabet progress, profile cache, etc.) are cleared.

## Storing settings per user (cross-device)

To persist preferences per user and sync across devices, you need a backend. Two common options:

### 1. Your own User API (recommended)

Add an API that stores a JSON blob keyed by Auth0 user id (`sub`):

- **GET** `/api/users/me/settings` — returns `UserSettings` (or 404 → use defaults).
- **PATCH** `/api/users/me/settings` — body: `Partial<UserSettings>`; backend merges and saves.

Backend authenticates the request with the Auth0 JWT, reads `sub` from the token, and reads/writes to your DB. No Auth0 Management API needed.

Then in the app:

- Replace `getStoredSettings` / `setStoredSettings` in `settings/storage.ts` with API calls.
- On login (or app load when authenticated), fetch settings and apply to LanguageContext, ThemeContext, and i18n.
- When the user changes something on the Settings page, call PATCH and update local state.

### 2. Auth0 `user_metadata`

Auth0 can store custom data in the user profile (`user_metadata`). To update it from your app you need a **backend** that:

- Accepts the user’s JWT and the new metadata.
- Calls the [Auth0 Management API](https://auth0.com/docs/api/management/v2/users/patch) `PATCH /api/v2/users/{id}` with the metadata.

The SPA cannot safely call the Management API (it requires a token with `update:users`). So you’d add a small BFF or API route that does the PATCH and optionally returns the updated user.

Summary: **for app preferences (language, theme, etc.), a small User API keyed by `sub` is usually simpler than Auth0 user_metadata.**
