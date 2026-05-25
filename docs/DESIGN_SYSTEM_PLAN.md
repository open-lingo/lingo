# Design System Plan: Reusable Containers & Theme Tokens

Plan for centralizing colors, backgrounds, shadows, and borders into reusable components and design tokens so we can control themes in one place.

---

## Current State

### Repeating patterns (grep across ~80+ files)

| Pattern | Example | Occurrences |
|---------|---------|-------------|
| **Card / surface** | `rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800` | 40+ |
| **Muted card** | `rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50` | 10+ |
| **Popover/dropdown** | `rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800` | 5+ |
| **Input** | `rounded border border-gray-300 ... dark:border-gray-600 dark:bg-gray-700 dark:text-white` | 20+ |
| **Primary button** | `rounded-lg bg-emerald-600 ... dark:bg-emerald-500` | 15+ |
| **Secondary button** | `rounded-lg border border-gray-300 ... dark:border-gray-600 dark:text-gray-300` | 15+ |
| **Accent/outline button** | `rounded-lg border border-emerald-600 ... dark:border-emerald-500 dark:text-emerald-400` | 5+ |
| **Status bars** (warning/info) | `border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30` | 5+ |
| **Section divider** | `border-b border-gray-200 dark:border-gray-700` | 20+ |

### Existing shared components

- `Badge` (community) – already uses variant-based tokens
- `FilterBar` – inline styles
- `DataTable` – inline styles
- `ModalBase` – hardcoded classes
- `PlainText`, `MarkdownRenderer` – typography only

---

## Proposed Structure

```
src/shared/
├── components/
│   ├── ui/                    # NEW: design-system primitives
│   │   ├── index.ts
│   │   ├── Box.tsx            # base container with tokens
│   │   ├── Card.tsx           # surface (default, muted, elevated)
│   │   ├── Button.tsx         # primary, secondary, ghost, danger
│   │   ├── Input.tsx          # text input with consistent styling
│   │   ├── Select.tsx         # select/dropdown
│   │   └── Alert.tsx          # info, warning, success, error
│   └── (existing: data, progress, sync, etc.)
└── styles/
    └── tokens.css             # optional: CSS variables for theme
```

---

## 1. Design Tokens (Tailwind theme extension)

Extend `tailwind.config.js` so tokens live in one place. Example:

```js
theme: {
  extend: {
    colors: {
      surface: {
        DEFAULT: "var(--color-surface)",
        muted: "var(--color-surface-muted)",
        elevated: "var(--color-surface-elevated)",
      },
      border: {
        DEFAULT: "var(--color-border)",
        muted: "var(--color-border-muted)",
      },
    },
    boxShadow: {
      card: "var(--shadow-card)",
      popover: "var(--shadow-popover)",
    },
  },
},
```

Define the variables in `index.css`:

```css
@layer base {
  :root {
    --color-surface: theme('colors.white');
    --color-surface-muted: theme('colors.gray.50');
    --color-surface-elevated: theme('colors.white');
    --color-border: theme('colors.gray.200');
    --color-border-muted: theme('colors.gray.100');
    --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    --shadow-popover: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  }
  .dark {
    --color-surface: theme('colors.gray.800');
    --color-surface-muted: theme('colors.gray.800');
    --color-surface-elevated: theme('colors.gray.700');
    --color-border: theme('colors.gray.700');
    --color-border-muted: theme('colors.gray.600');
    --shadow-card: ...;
    --shadow-popover: ...;
  }
}
```

Then classes like `bg-surface`, `border-border`, `shadow-card` are theme-aware by default.

---

## 2. Components to Add

### Box

Low-level container. Pass `as` for semantic element.

```tsx
<Box as="section" variant="card" padding="lg">
  ...
</Box>
```

Variants: `card` | `muted` | `elevated` | `none`

### Card

Surface for content. Replaces the long `rounded-xl border border-gray-200 bg-white...` pattern.

```tsx
<Card>...</Card>
<Card variant="muted">...</Card>
<Card variant="elevated" padding="none">...</Card>
```

### Button

Variants: `primary` | `secondary` | `ghost` | `danger` | `outline`

```tsx
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="outline" accent>Try a lesson</Button>
```

### Input

Text input with shared border, background, focus ring.

```tsx
<Input value={...} onChange={...} placeholder="..." />
```

### Select

Dropdown with same styling as Input.

### Alert

Status message: info, warning, success, error.

```tsx
<Alert variant="warning">Unsaved changes</Alert>
<Alert variant="info">Synced 5 cards</Alert>
```

---

## 3. Migration Order

| Phase | Scope | Effort |
|-------|--------|--------|
| **1** | Add `tokens.css` + Tailwind theme extend; no component changes | Low |
| **2** | Add `Card`, `Box`; migrate 5–10 high-traffic pages (Home, Learn, Progress, Layout) | Medium |
| **3** | Add `Button`; migrate primary/secondary buttons | Medium |
| **4** | Add `Input`, `Select`; migrate forms (Settings, Profile, FilterBar, etc.) | Medium |
| **5** | Add `Alert`; migrate status bars and toasts | Low |
| **6** | Migrate remaining feature modules (admin, community, flashcards, stories) | Ongoing |

---

## 4. High-Impact Files to Migrate First

1. **Layout.tsx** – header, nav dropdowns
2. **HomePage.tsx** – hero card, CTA buttons
3. **ProgressSummary.tsx** – section card, stat tiles
4. **LearnPage.tsx** – sections, links
5. **FilterBar.tsx** – inputs, selects
6. **ModalBase.tsx** – modal panel
7. **DataTable.tsx** – table container, checkboxes
8. **SyncManager.tsx** – cloud trigger + compact popover (see handoff-2026-05-24-home-sync-ux.md)
9. **Button.tsx** – `primary-3d` + `hero` size for landing CTA row alignment (2026-05-24)
9. **FlashcardTester.tsx** – card surface, rating buttons, counts widget
10. **CardManagerPage.tsx** – batch bar, table
11. **DeckEditor.tsx** – settings bar, card list
12. **ContentBrowserPage.tsx** – filters, cards
13. **Settings modal** (`SettingsContent.tsx`, `SettingsSectionPanel.tsx`) – form inputs; `/settings` opens modal. Legacy `SettingsPage` re-exports `SettingsOpenRoute`.

---

## 5. Implementation Notes

- Keep `className` overridable on all components so we can tweak layout (e.g. `flex`, `grid`, `gap`) without forking the component.
- Use `cva` (class-variance-authority) or a simple `clsx`/`cn` helper for variants if we want type-safe variant props.
- Prefer composition: `<Card><CardHeader>...</CardHeader><CardBody>...</CardBody></Card>` for complex layouts, but start with a single `<Card>` that accepts `children` and optional slots.
- Ensure all new components support `forwardRef` if they wrap interactive elements (buttons, inputs) for tooling and accessibility.

---

## 6. Token Naming (Reference)

| Token | Light | Dark |
|-------|-------|------|
| `surface` | white | gray-800 |
| `surface-muted` | gray-50 | gray-800/50 |
| `surface-elevated` | white + shadow | gray-700 |
| `border` | gray-200 | gray-700 |
| `border-muted` | gray-100 | gray-600 |
| `text-primary` | gray-900 | white |
| `text-secondary` | gray-600 | gray-400 |
| `text-muted` | gray-500 | gray-500 |
| `accent` | emerald-600 | emerald-500 |
| `accent-hover` | emerald-700 | emerald-400 |

---

## 7. Theme System (Implemented)

### Structure

```
src/shared/
├── theme/
│   ├── types.ts       # ThemeTokens, ThemeDefinition (platform-agnostic)
│   ├── presets.ts     # light, dark, sepia, amoled
│   ├── web-adapter.ts # applyThemeToDOM()
│   └── index.ts
├── styles/
│   └── tokens.css     # Default CSS variable fallbacks
└── contexts/
    └── ThemeContext.tsx  # activeThemeId, setTheme, openThemeEditor, etc.
```

### Features

- **Presets**: Light, Dark, Sepia, AMOLED
- **Custom themes**: Users edit colors in the theme editor and save as custom
- **Theme editor panel**: Slides in from the right; accessible via palette icon in header or "Customize theme" in Settings
- **Storage**: `localStorage` for theme ID and custom theme JSON; synced to backend via `users.updateSettings({ theme })`
- **Cross-platform ready**: `ThemeTokens` is plain data; web uses CSS vars; React Native will use `useTheme().activeTokens`

### Usage

- **Apply preset**: `setTheme("dark")` or `setTheme("sepia")`
- **Save custom**: `setCustomTheme(tokens)` from theme editor
- **Open editor**: `openThemeEditor()` from Settings → Appearance (or theme flow). Audio prefs are in Settings → Audio, not the editor.
- **Community themes**: Preview (temporary) + Add in `ThemeEditorPanel`; mock data in `community-mock.ts`

### Tailwind Integration

Token classes: `bg-surface`, `text-text-primary`, `border-border`, `bg-accent`, etc. See `tailwind.config.js` theme.extend.

---

## Next Steps

1. Add `Card` and migrate ProgressSummary + HomePage hero to use token classes.
2. Add `Button` and migrate a few CTAs.
3. Iterate: add Input, Select, Alert; migrate remaining high-traffic UI.
4. Community themes: manifest + CDN distribution (Phase 2).
