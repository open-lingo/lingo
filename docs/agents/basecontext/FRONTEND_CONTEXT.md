# Frontend Context

Context for frontend architecture, theme system, and UI patterns. Use this when working on UI, styling, or cross-platform consistency.

---

## Theme Strategy

### Overview

Open Lingo uses a **token-based theme system** that applies to web today and is designed for React Native (mobile) later. Themes are pure JSON data; the platform adapter renders them differently (CSS vars on web, inline styles on mobile).

### Architecture

```
Theme JSON (presets / custom / community)
        ↓
ThemeContext (normalize, apply, persist)
        ↓
Platform adapter
        ↓
Web: applyThemeToDOM() → CSS variables on :root
RN: useTheme().activeTokens → vars() or inline styles
```

### Key Paths

| Layer | Path |
|-------|------|
| Types | `src/shared/theme/types.ts` |
| Presets | `src/shared/theme/presets.ts` |
| Web adapter | `src/shared/theme/web-adapter.ts` |
| Storage | `src/shared/theme/storage.ts` |
| Community mock | `src/shared/theme/community-mock.ts` |
| Context | `src/shared/contexts/ThemeContext.tsx` |
| Editor | `src/shared/components/ThemeEditorPanel.tsx` |
| Tokens CSS | `src/shared/styles/tokens.css` |

### Theme Flow

1. **Built-in presets**: Light, Dark, Sepia, AMOLED (+ `auto` follows system)
2. **Your themes**: Local custom themes (add, edit, delete) in `localStorage`
3. **Community themes**: Mock list in `community-mock.ts`; **Preview** (temporary app-wide via `previewTokens`), **Add** (install as custom id), star stored locally
4. **Custom / installed themes**: `resolveEffectiveTheme` always applies their tokens — no fallback to plain `light`/`dark` when system mode disagrees (built-in presets still swap)

### Settings modal (learner prefs)

| Path | Role |
|------|------|
| `features/settings/SettingsContent.tsx` | Wide modal body |
| `features/settings/SettingsNav.tsx` | Sidebar: General, Appearance, Audio, …, expandable Languages |
| `shared/components/ModalRoot.tsx` | `max-w-4xl` when `id === "settings"` |
| `shared/components/LanguageSelector.tsx` | **Study language** (not in settings) |

- **Audio** (`volume`, `silentMode`): Settings → Audio only — removed from `ThemeEditorPanel`.
- **UI locale**: Settings → General `<select>` → `learning.uiLocale`.
- **Japanese display toggles**: Settings → Languages → 日本語.

### Design Tokens

Token classes in Tailwind (via `tailwind.config.js`):

- **Surfaces**: `bg-background`, `bg-surface`, `bg-surface-muted`, `bg-surface-elevated`
- **Borders**: `border-border`, `border-border-muted`
- **Text**: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- **Accent**: `bg-accent`, `text-accent`, `bg-accent-muted`, `bg-accent-hover`
- **Semantic**: `text-error`, `text-success`, `text-warning`
- **Shadows**: `shadow-card`, `shadow-popover`
- **Radius**: `rounded-sm`, `rounded-md`, `rounded-lg` (from `--radius-*`)

### Usage Rules

1. **Never hardcode colors** – Use token classes (`text-text-primary`, not `text-gray-900`)
2. **No `dark:` variants** – Tokens change per theme; use `ThemeContext`'s `themeMode` for components that need a binary light/dark flag (e.g. MD editor)
3. **Theme applies at runtime** – `applyThemeToDOM()` sets CSS vars on `document.documentElement`

### Shared UI Components

- **Card** (`src/shared/components/ui/Card.tsx`) – Variants: default, muted, elevated
- **Button** (`src/shared/components/ui/Button.tsx`) – Variants: primary, secondary, ghost, outline, danger, **primary-3d** (hero CTA); sizes: md, sm, icon, **hero** (landing row alignment)
- **cn()** (`src/shared/components/ui/cn.ts`) – Class-name merge helper

### Migrated Areas

Layout, Home (`RestructuredHome` for signed-in users), Community (ContentBrowser), ProgressSummary, FlashcardsCard, PracticeCard, ModuleCard, ThemeToggle, LanguageSelector, AuthMenu, **SyncManager** (cloud / cloudSync / cloudAlert), FundingMeter.

### Home & progress hooks (2026-05-24)

| Hook | Path | Notes |
|------|------|--------|
| `useProgressMe` | `src/shared/hooks/useProgressMe.ts` | Hydrates lesson cache from `GET /progress/me` |
| `useUserStats` | `src/shared/hooks/useUserStats.ts` | Streak, XP, level, lingots |
| `useLocalProgressSummary` | `src/shared/hooks/useLocalProgressSummary.ts` | Daily goal + week sparkline from completions |
| `useSocial` | `src/features/social/hooks/useSocial.ts` | Friends, quests, activity — mock today |

Handoff: `docs/archive/handoff-2026-05-24-home-sync-ux.md`

### Future

- Community themes: backend API + CloudFront caching, schema validation (see `community-themes` task)
- React Native: reuse `ThemeTokens`, use NativeWind `vars()`

---

## Layout

- Single `Layout` with header, main, FundingMeter, ModalRoot
- Header: sticky, `bg-surface`, `border-border`
- Main: `max-w-7xl`, `bg-background`

---

## API & Data

- `ApiProvider` wraps app; `useApi()` exposes clients (users, decks, stories, srs, admin)
- Auth0 provides `getAccessTokenSilently`; API client injects Bearer token
- See `AUTH_STRATEGY.md` for token refresh and session plans
