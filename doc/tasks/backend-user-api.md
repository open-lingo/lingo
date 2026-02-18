# Task: Backend — User Settings API

**Area:** `src/api/`, `src/settings/`
**Current state:** localStorage mock in `settings/storage.ts`

## Goal

Replace localStorage settings with a real User API so settings persist across devices.

## Requirements

- `GET /api/users/me/settings` — returns `UserSettings` (learning language, theme, UI locale)
- `PATCH /api/users/me/settings` — partial update
- Keyed by Auth0 `sub` (from JWT)
- Keep cache-first in `resolvePreferredLanguage` — read localStorage, fall back to API
- `settings/storage.ts` swap: replace `loadSettings()` / `saveSettings()` implementations
- See `src/settings/README.md` for the existing abstraction notes

## Backend stack

- Decide: serverless (Lambda / Amplify Functions) or standalone (Express / Fastify)
- DB: DynamoDB (single-table, partition key = Auth0 sub) or Postgres
- Auth: validate Auth0 JWT in middleware

## Files to touch

- `src/settings/storage.ts` — swap impl from localStorage to fetch
- `src/api/mock.ts` — remove `fetchUserPreferredLanguage` mock
- New: backend service (separate repo or `server/` folder)

## Acceptance criteria

- [ ] `GET /api/users/me/settings` returns saved settings for authenticated user
- [ ] `PATCH /api/users/me/settings` persists partial updates
- [ ] Frontend reads from API on load, caches in localStorage
- [ ] Falls back to localStorage if API unavailable
- [ ] Auth0 JWT validated on every request
