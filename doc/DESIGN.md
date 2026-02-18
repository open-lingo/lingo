# Design ideas & architecture

Short notes for human reading and minimal context.

---

## Architecture (current)

- **Single app** — Vite + React; no monorepo.
- **Auth** — Auth0 only; one auth module (`auth/`).
- **DI** — Only for storage/sync (IStorage/ISync) when added; rest is direct imports.
- **State** — React state + contexts (Theme, Language, Auth); TanStack Query for server state when API exists.
- **Styling** — Tailwind; component-based UI.

---

## Design ideas

- **Language config as single source of truth** — `languageConfig.ts` drives practice types, alphabets, intro lesson title, etc. Can later load from `languages.json` or API.
- **Settings persistence** — Local first (localStorage); User API later. Same shape in `settings/types.ts` so backend is a drop-in replacement in `settings/storage.ts`.
- **Shareable URLs** — Path/query params for leaderboard period, community tab, alphabet practice. Keep using `usePathParams` and same param names.
- **Funding meter** — “X% ad-funded” transparency; lower % = more sustainable. Design for real metrics when backend exists.
- **Practice routes** — Config-driven; one route per type + alphabet id in path/query. Keeps URLs shareable and predictable.
- **Course progress** — Module/lesson model with checkpoints; mock completed set. Backend will own source of truth; frontend shows and updates via API.

---

## Tech choices (reference)

- **Auth0** — SPA; token for API calls when needed. Env-based config for domain/clientId.
- **i18n** — react-i18next; main-site strings in `locales/en.json`; course content i18n later/custom.
- **No form library** — Plain forms for now; add (e.g. React Hook Form) if forms grow.
