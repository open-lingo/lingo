# Settings modal redesign — `ui/settings-redesign`

## Problem

The Settings modal read as "thrown together": section titles, setting labels,
helper text, and controls all rendered at roughly the same visual weight, so
nothing guided the eye. Each panel also styled its controls differently —
the Audio panel wrapped a checkbox in a bordered card, Accessibility used bare
native checkboxes, the Japanese panel used unstyled blue checkboxes, selects
and sliders had ad-hoc markup, and most panels had **no section header or
description at all** (only the JA panel did). Spacing rhythm varied per panel
(`space-y-2` / `-3` / `-4`).

## Hierarchy applied

A single, repeating structure across every panel, from heaviest to lightest:

| Level | Element | Style |
| --- | --- | --- |
| 1 | Section title | `text-base font-semibold text-text-primary` |
| 2 | Section description (one line) | `text-sm text-text-secondary` |
| 3 | Group sub-label (optional) | `text-xs font-semibold uppercase tracking-wide text-text-muted` |
| 4 | Setting label | `text-sm font-medium text-text-primary` |
| 5 | Setting helper text | `text-sm text-text-muted` |

Settings are grouped into bordered cards with hairline dividers between rows.
Every panel now opens with a `SectionHeader` (title + description). Toggles are
right-aligned `Switch`es; selects/sliders are the shared primitives; danger
zones (language reset, delete account) are a consistent `border-error/40
bg-error/5` block with an `alertTriangle` icon.

## New primitives

`src/features/settings/SettingsPrimitives.tsx` (domain-locked — settings only):

- **`SectionHeader`** — title + optional one-line description. Anchors the top
  of every panel.
- **`SettingsGroup`** — a bordered card with an optional uppercase sub-label and
  `divide-y` rows, giving every panel the same rhythm.
- **`SettingRow`** — one setting: label + helper text on the left, control on
  the right. `stacked` variant drops wide controls (selects, sliders, chip
  pickers) below the label; `asLabel` makes the whole row a `<label>` so the
  click target includes the helper text.

All built from existing theme tokens + shared `ui/` primitives (`Switch`,
`Select`, `Slider`, `ChoiceChip`). No hardcoded colors, no MUI, no emoji,
lucide via `Icon`.

## Files changed

- `src/features/settings/SettingsPrimitives.tsx` — **new** layout primitives.
- `src/features/settings/SettingsPrimitives.test.tsx` — **new** unit tests (6).
- `src/features/settings/SettingsSectionPanel.tsx` — rewrote every panel
  (General, Appearance, Audio, Accessibility, Notifications, Privacy, Japanese,
  Korean, language danger zone) onto the new primitives. Raw checkboxes →
  `Switch`; native select → `Select`; range inputs → `Slider`. No behavior or
  setting removed; the Appearance "Navigation layout" control is preserved.
- `src/features/settings/AccountPrivacySection.tsx` — restyled to match
  (cookie consent → `Switch`, blocked-users + delete-account as grouped rows /
  danger block).
- `src/shared/i18n/locales/en.json`, `ko.json` — added helper-text + label keys
  (`themeHelp`, `silentModeLabel`, `reducedMotionHelp`, `dyslexiaFontLabel`,
  `dyslexiaFontHelp`, `fontSizeHelp`, `dailyReminderHelp`, `reminderTimeHelp`,
  `editProfileHelp`, `open`, `legal.cookies.settingsHelp`/`cookiesGroup`).

## Verification

- `npx tsc --noEmit` — clean
- `npm run build` — succeeds
- `npm run test:run` — 1019 passed (112 files); new primitives test 6/6.

## Screenshots

Before → after for each panel under `.worktree-shots/`:

| Panel | Before | After |
| --- | --- | --- |
| Appearance | `before-appearance.png` | `after-appearance.png` |
| Accessibility | `before-accessibility.png` | `after-accessibility.png` |
| Audio | `before-audio.png` | `after-audio.png` |
| Notifications | `before-notifications.png` | `after-notifications.png` |
| Japanese | `before-ja.png` | `after-ja.png` |
| General | `before-general.png` | `after-general.png` |

Mobile (420px): `after-accessibility-mobile.png` — nav stacks above the panel,
rows wrap with helper text intact.

> Note: the General "Edit profile" row and the Privacy panel render their
> authed content only when the screenshot Playwright context is fully
> authenticated; the before/after shots were taken with the dev context where
> those gate to a sign-in hint. The code path is unchanged in that respect.
