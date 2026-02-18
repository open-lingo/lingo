# Todos and what's left

By area. Skip obvious / already-done work.

## Backend and data

- [ ] User API: GET/PATCH `/api/users/me/settings` keyed by Auth0 `sub`. Replace `settings/storage.ts` impl. See `src/settings/README.md`.
- [ ] Preferred language from backend: replace `api/mock.ts` `fetchUserPreferredLanguage()` with real API; keep cache-first in `resolvePreferredLanguage`.
- [ ] Course content API: replace `mockCourse.ts` with API; keep or adapt `course.ts` types.
- [ ] Progress API: replace `mockProgress.ts` (summary, completed lessons) with backend.
- [ ] Leaderboard API: replace mock data in LeaderboardPage with real rankings/XP.
- [ ] Funding meter: plug real ad-funded % into FundingMeter; remove mock constant.

## Flashcards and SRS

- [ ] Real decks: replace `mockCards.ts` with deck/card API or local format.
- [ ] SRS/Anki logic: scheduling, due dates, intervals; hook into "cards due today" and review flow.

## Content and courses

- [ ] Real course structure: modules/lessons from API or CMS; intro from languageConfig or API.
- [ ] Stories: replace stub with real content and flow.
- [ ] Vocab: replace stub with real lists/API.
- [ ] Grammar: grammar heatmap data and UX (stub exists).
- [ ] Course i18n: custom translations for course content (separate from main-site i18n).

## Community and social

- [ ] Discussions / Discord when community grows (see `community.linkDiscord` in locales).
- [ ] Contribution flow: clear path from Community to submit course / suggest content (GitHub, forms, or backend).

## Frontend polish

- [ ] More UI locales: add e.g. es (and `src/locales/es.json`); add to i18n and Settings.
- [ ] Sync / offline: IStorage/ISync (or similar) for progress and settings if planned; depends on backend.

## Docs and config

- [ ] .env from .env.example (Auth0 vars) for local dev.
- [ ] Amplify env: VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID for prod.
