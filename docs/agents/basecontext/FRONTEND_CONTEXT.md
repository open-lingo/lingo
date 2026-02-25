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

1. **Built-in presets**: Light, Dark, Sepia, AMOLED
2. **Your themes**: Local custom themes (add, edit, delete) in `localStorage`
3. **Community themes**: Mock list for now; install adds to Your themes, star stored locally

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
- **Button** (`src/shared/components/ui/Button.tsx`) – Variants: primary, secondary, ghost, outline, danger
- **cn()** (`src/shared/components/ui/cn.ts`) – Class-name merge helper

### Migrated Areas

Layout, Home, Community (ContentBrowser), ProgressSummary, FlashcardsCard, PracticeCard, ModuleCard, ThemeToggle, LanguageSelector, AuthMenu, SyncManager, FundingMeter.

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
