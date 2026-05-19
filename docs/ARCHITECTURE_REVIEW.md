# Architecture Review — Frontend (`lingo`)

_Reviewed: 2026-05-18, against CET Dashboard org architecture standards (see `gitlab-profile` reference doc set)._

This is a conformance audit, not a redesign. Standards were ported from an MUI/FastAPI org doc — exact component names (`BaseModal`, `CenteredLoader`) don't exist here and don't need to. The *principles* (shared wrappers, no inline patterns, module-level singletons, DRY, explicit cache behavior) are what to apply.

## Snapshot

- React 19 + Vite 6 + TS 5.6 (strict) + Tailwind 3 + TanStack Query 5 + Auth0 + i18next
- ~50k LOC, 29 feature folders under `src/features/`, shared infrastructure in `src/shared/`
- Backed by `lingo-core` over HTTPS w/ Auth0 RS256 JWT, base URL via `VITE_API_BASE_URL`
- 28 test files (Vitest + Playwright)

Architecture is solid — vertical feature slices, typed `ApiClient` base with retries/cancellation, faithful SM-2 SRS engine, clean shared/ boundary.

## Conformance scorecard

| Standard | Status | Notes |
|---|---|---|
| Module-level singletons (API clients) | ✅ | `ApiClient` pattern, single instance per domain |
| Shared API abstraction | ✅ | `src/shared/api/` with typed clients |
| Centralized error handling | ✅ | `ApiError` w/ `.code` and `.expiresAt` |
| Linting configured | ❌ | No `.eslintrc`, no `.prettierrc` |
| No god files | ❌ | `src/features/lesson/LessonPage.tsx` (~23KB, 8 step renderers inline) |
| Shared UI primitives (modal/loader/empty) | ⚠️ | Partial — no canonical `BaseModal`/`CenteredLoader`/`EmptyState` |
| Explicit `staleTime` on queries | ⚠️ | Global 1m default; per-domain audit needed |
| Constants centralized | ✅ | Mostly — per-domain `constants.ts` |
| No dead/stub code in prod path | ⚠️ | `VocabPage`, `GrammarPage`, `StoryDetailPage` are stubs that are routed |
| Test coverage | ⚠️ | 28 files, thin — flashcard engine has 1 test, no integration tests beyond auth |

## High-priority gaps

### 1. No linting or formatting
No ESLint, no Prettier. Style will drift the moment a second contributor lands. Wire both before more feature work.

### 2. `LessonPage.tsx` is a god component
~23KB single file holding all 8 step renderers and lesson state (finished, currentStepIdx, results). Any lesson-flow change fights you. Extract step renderers into a typed component map keyed by step type.

### 3. No canonical shared UI primitives
Dashboard standard: every modal goes through `BaseModal`, every loader through `CenteredLoader`, every empty through `EmptyState`. Lingo has none of these. Before features multiply inline variants, build:
- `<Modal>` (header + close + dividers + backdrop dismiss control)
- `<CenteredLoader>` (full-area Spinner with size/py props)
- `<EmptyState>` (title + description + optional action)

### 4. `useQuery`/`useMutation` `staleTime` discipline
Global default is `staleTime: 1m, gcTime: 5m`. Per-domain audit: dashboard pattern sets explicit values (5m for normal reads, 10m for metrics, 3m for audit, 15s for live workers). Right now lingo relies on the global default everywhere.

## Medium-priority

- **Docs landscape is messy.** ~25 markdown files under `docs/`, many task specs predate the codebase. `PROJECT_STATE.md` is source-of-truth; everything else needs an `archived/` move or a date stamp.
- **Stub pages routed in nav.** `VocabPage`, `GrammarPage`, `StoryDetailPage` show "coming soon" but live in the router. Either flag-gate them out of nav or finish them.
- **Japanese locale (`ja.json`) missing.** README lists Japanese as primary but UI locale is en/ko only.
- **Mutations: standardize on `useCreateX`/`useDeleteX` hooks** rather than inline `new API()` + manual loading state.

## When adding features

Before merging a feature that touches lessons, the lesson page must be split first — otherwise every PR rebases against a moving 23KB file. Before merging a feature with new UI surfaces, build the three shared primitives above so they aren't reinvented per feature.

## Things to NOT cargo-cult from dashboard

- MUI-specific guidance (`Dialog` → `BaseModal` etc.). Lingo is Tailwind-first; build Tailwind-native primitives.
- `~/components/ui/Tooltip` + `flex-shrink` caveat. Doesn't apply here.
- Service-base-URL preset toggle (Dashboard has a dev/stage/prod presets UI). Overkill for now.

## Reference

Source standards: `~/repositories/projects/dashboard/gitlab-profile/` — see `docs/claude/agents/{cleanup,code-optimizer,perf-optimizer}/` for the agent-enforced patterns.
