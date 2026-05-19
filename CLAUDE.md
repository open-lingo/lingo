# CLAUDE.md — `lingo` (Open Lingo web app)

Vite + React 19 + TypeScript + Tailwind language-learning SPA. Talks to `lingo-core` (FastAPI) over HTTPS with Auth0 RS256 JWT.

## Critical orientation

- **Source of truth for project state:** `docs/PROJECT_STATE.md`. Read this first when starting a feature — the rest of `docs/` is a mix of current planning, stale task specs, and design docs.
- **Architecture audit + conformance gaps:** `docs/ARCHITECTURE_REVIEW.md` — read before any structural change.
- **Backend repo:** `../lingo-core/` — same monorepo-style layout, separate git.

## Stack

- React 19, React Router v7, TS 5.6 (strict), Vite 6, Tailwind 3 (themes via `class` strategy)
- TanStack Query 5 for server state (`staleTime: 1m`, `gcTime: 5m` global defaults — set explicit per-domain)
- Auth0 (`@auth0/auth0-react`) — token injected by `ApiProvider` once, attached to every request
- i18next (en, ko; ja stub)
- Vitest (unit, happy-dom) + Playwright (e2e w/ auth state persistence)
- Path alias: `@/ → src/`

No ESLint, no Prettier configured (gap — see ARCHITECTURE_REVIEW.md).

## Source layout

```
src/
├── main.tsx                # provider bootstrap
├── App.tsx                 # createBrowserRouter + lazy routes
├── routes/                 # root shell + auth wrappers + language context
├── features/<domain>/      # vertical slices — keep components local until 2nd domain consumes
│   └── lesson/LessonPage.tsx   # ⚠️  GOD FILE (~23KB, 8 step renderers) — split before lesson-flow changes
└── shared/                 # cross-feature infrastructure
    ├── api/                # ApiClient base + UsersApi, SrsApi, DecksApi, etc. — singletons
    ├── auth/               # Auth0 config, useAuth hook
    ├── components/         # DataTable, FilterBar, RouteErrorBoundary, icons
    ├── contexts/           # Settings, Theme, Language, Modal, Toast, FeatureFlags
    ├── i18n/               # i18next config + locale files
    ├── theme/              # ThemePresets (Light/Dark/Sepia/AMOLED) + tokens
    └── ...                 # devlog, telemetry, audio, speech, japanese, storage, utils
```

## Conventions

- **API calls:** extend `ApiClient` in `shared/api/*.ts`. Singleton per domain. Never instantiate per-component.
- **Server state:** TanStack Query only. **Set explicit `staleTime`** on every `useQuery` — don't rely on the 1m default.
- **Mutations:** prefer dedicated hooks (`useCreateDeck`, `useDeleteCard`) that wrap `useMutation` + `invalidateQueries`. Don't inline `new API()` + manual loading state.
- **Icons:** import from `lucide-react`. Curated set in `src/shared/glyphs/iconRegistry.ts`.
- **i18n:** all UI strings via `t("namespace.key")`. Locales: `src/shared/i18n/{en,ko}.json`.
- **Routes:** lazy-loaded in `App.tsx`. Use `lazyRetry` from `shared/utils/` to recover from chunk-load failures.
- **Themes:** Tailwind `class` strategy + token system in `shared/theme/`. CSS variables for runtime-switchable values.

## Component placement

- `shared/components/*` — composed widgets used across 2+ features
- `features/<domain>/components/*` — domain-locked (don't promote until a 2nd domain consumes)
- Files growing past ~400 LOC are a smell — extract subcomponents under `features/<domain>/`

## Missing shared primitives (build before features multiply variants)

These exist in the dashboard reference org but **not here yet**:
- `<Modal>` (header + close + dividers + backdrop control)
- `<CenteredLoader>` (full-area Spinner, size/py props)
- `<EmptyState>` (title + description + optional action)

When you need any of these, build the shared primitive first.

## SRS engine

`features/flashcards/engine/` — SM-2 with Again/Hard/Good/Easy. Local-first (localStorage) with manual or end-of-session sync to `lingo-core` via `SrsApi`. Dirty-card detection + delta merge — don't bypass.

## Vocab card art (read before authoring new vocab)

Every authored vocab word has an image (Noto Emoji Apache-2.0 + a small MIT-licensed custom-SVG top-up). The system has three doc surfaces:

- **[docs/emoji-art-process-2026-05-18.md](./docs/emoji-art-process-2026-05-18.md)** — the 11-step methodology (resolver audit → style baseline → 4-persona Opus audit → custom-SVG fill → block-list → curriculum integration → reference compile). Re-run whenever a new language ships or a new module adds ≥10 vocab words.
- **[docs/emoji-blocked-words-2026-05-18.md](./docs/emoji-blocked-words-2026-05-18.md)** — rubric + end-to-end authoring workflow. Read this when adding a single new vocab word.
- **[docs/n5-vocab-emoji-reference-2026-05-18.md](./docs/n5-vocab-emoji-reference-2026-05-18.md)** — pre-assigned emoji for all 662 JLPT N5 words. Pull canonical emoji from this table; don't re-decide per-lesson.

Runtime: `notoEmojiUrl(emoji)` + `lingoArtUrl(kana)` in `src/shared/assets/notoEmoji.ts`. Block-list: `WORD_IMAGE_MCQ_BLOCKLIST` + `withoutMcqBlocked()` in `src/features/lesson/data/_jaGrammarHelpers.ts` — throws at import if a blocked kana hits visual MCQ.

## Testing

```bash
npm run test           # vitest watch
npm run test:run       # vitest CI
npm run test:e2e       # playwright
npm run test:e2e:auth  # auth state setup (headed)
```

Coverage is thin (28 files). Add a happy-path test for any new feature.

## Dev loop

```bash
npm run dev            # vite, strict port 5173
```

API base URL via `VITE_API_BASE_URL` (default `http://localhost:8000` matching `lingo-core` local dev).

## Visual debugging (Claude needs eyes)

When iterating on layout/styling, Claude can drive Playwright to screenshot any route and read the PNG inline — no manual screenshot pasting needed.

```bash
node scripts/shot.mjs <path> [width] [height] [--full] [--lang=<id>] [--no-lang]
# → writes /tmp/shot.png
```

See `.claude/skills/screenshot/SKILL.md` for full options and gotchas. The `screenshot` skill triggers on "look at", "see", "view", "screenshot" requests.

**One-time auth setup** (needed for any route behind `RequireAuth`):

```bash
npm run test:e2e:auth      # headed browser pops up via WSLg — log in once
                           # writes .auth/user.json (gitignored)
```

The shot script auto-loads that state and auto-injects a `learningLanguageId` into localStorage so the first-time language-picker modal doesn't block authed routes. Pass `--no-lang` if you want to see the picker.

**Known footgun**: the auth.setup test must navigate to `/login` (not `/`) — going to `/` matches `waitForURL` immediately and short-circuits the wait, writing an empty `user.json` in ~2s. If `wc -c .auth/user.json` is <1KB, auth never happened.

## Don't

- **Don't add MUI.** Tailwind-first. If you need a primitive, build it under `shared/components/ui/`.
- **Don't import from `@mui/*`** — not installed.
- **Don't add legacy redirects or backwards-compat shims** when moving routes/files.
- **Don't add AI attribution to commits.**
- **Don't trust `docs/tasks/*.md` as current state** — many predate the codebase. `PROJECT_STATE.md` wins.
