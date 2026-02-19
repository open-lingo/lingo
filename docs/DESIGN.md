# Design ideas & architecture

Short notes for human reading and minimal context.

---

## Architecture (current)

- **Single app** — Vite + React; no monorepo.
- **Two-layer src/ structure:**
  - `shared/` — cross-cutting infrastructure (domain types, API client, auth, components, contexts, hooks, i18n, storage)
  - `features/` — UI domains, each self-contained with own `components/`, `data/`, pages
  - `routes/` — app-level layout wrappers (Layout, LangLayout, RedirectToLang)
- **Auth** — Auth0 only; config and hooks in `shared/auth/`.
- **DI** — Only for storage/sync (IStorage/ISync) when added; rest is direct imports.
- **State** — React state + contexts in `shared/contexts/` (Theme, Language, Modal); TanStack Query for server state when API exists.
- **Styling** — Tailwind; component-based UI.
- **Modals** — Stack-based ModalContext with ModalBase and ModalRoot in `shared/components/`.

### Folder structure

```
src/
  shared/
    domain/         — Language, Course, LanguageConfig types
    api/            — API client, provider, mock
    auth/           — Auth0 config, useAuth hook
    components/     — ModalBase, ModalRoot, ThemeToggle, FundingMeter, LanguageSelector, AuthMenu
      icons/        — LockIcon, ChevronIcon
      progress/     — ProgressBar, ProgressBarWithCheckpoints, StatusNodeStrip, LessonStatusCircle
    contexts/       — ThemeContext, LanguageContext, ModalContext
    hooks/          — useLangPath, usePathParams
    i18n/           — i18n config + locales/
    storage/        — Storage abstraction
  features/
    auth/           — LoginPage, LogoutPage
    home/           — HomePage, LanguagePickerModal
    learn/          — LearnPage, components/ (MainCourseCard, CommunityModuleCard)
    course/         — CourseMapPage, components/ (ModuleCard)
    practice/       — Practice pages, components/characters/, data/ (particles)
    flashcards/     — Flashcard pages, data/ (decks, SRS types, lesson-card map)
    community/      — Community pages, forum/, components/ (Tag, Avatar, Badge)
    settings/       — Settings pages, profile storage, types
    progress/       — ProgressSummary
    stories/        — Stories pages
    vocab/          — VocabPage
    grammar/        — GrammarPage
    leaderboard/    — LeaderboardPage
  routes/           — Layout, LangLayout, RedirectToLang
  App.tsx, main.tsx, index.css
```

### Import rules

- `features/` imports from `shared/` freely.
- `features/` should minimize cross-feature imports (use `shared/` for truly shared domain types).
- `shared/` never imports from `features/` (except ModalRoot which renders feature settings panels).
- Feature-specific data (JSON, mock files) lives inside its feature under `data/`.

---

## Design ideas

- **Language config as single source of truth** — `shared/domain/languageConfig.ts` drives practice types, alphabets, intro lesson title, etc. Can later load from `languages.json` or API.
- **Settings persistence** — Local first (localStorage); User API later. Same shape in `features/settings/types.ts` so backend is a drop-in replacement in `features/settings/storage.ts`.
- **Shareable URLs** — Path/query params for leaderboard period, community tab, alphabet practice. Keep using `usePathParams` and same param names.
- **Funding meter** — "X% ad-funded" transparency; lower % = more sustainable. Design for real metrics when backend exists.
- **Practice routes** — Config-driven; one route per type + alphabet id in path/query. Keeps URLs shareable and predictable.
- **Course progress** — Module/lesson model with checkpoints; mock completed set. Backend will own source of truth; frontend shows and updates via API.
- **Content localization** — Core courses are language-agnostic with instruction-language variants. Community content is language-specific with no cutover. Practice content is localized via locale keys or per-locale data. See LOCALIZATION.md and CONTENT-DESIGN.md.

---

## Tech choices (reference)

- **Auth0** — SPA; token for API calls when needed. Env-based config for domain/clientId.
- **i18n** — react-i18next; UI strings in `shared/i18n/locales/*.json`; practice content localized via inline translations or per-locale data files; course content i18n via manifest system.
- **No form library** — Plain forms for now; add (e.g. React Hook Form) if forms grow.
