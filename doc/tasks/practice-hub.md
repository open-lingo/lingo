# Task: Practice Hub Page

**File:** `src/features/practice/PracticePage.tsx`
**Route:** `/practice`
**Current state:** Stub — "coming soon"

## Goal

Build a practice hub that shows all available practice types for the user's current language, with cards linking to each sub-practice.

## Requirements

- Read `practiceOptions` from `languageConfig.ts` for the current language
- Show a card per practice type (particles, kanji, alphabet, general, components)
- Each card: icon/emoji, title, description, sample character, link to the sub-route
- Cards that aren't yet implemented show a "coming soon" badge but are still visible
- Responsive grid (2-3 cols on desktop, 1 on mobile)

## Data

- No new data files; use `getLanguageConfig(languageId).practiceOptions`
- Use `getPracticeRoute()` from `practiceTypeRoutes.ts` for links

## UI reference

- Card grid like the home page quick-link cards
- Each card: rounded-xl, border, hover shadow, icon on left, title + desc on right

## i18n

- Add `practice.hub.*` keys: title, subtitle, comingSoon badge text
- Practice type labels can come from `practiceOptions[].label` for now

## Acceptance criteria

- [ ] Practice hub shows cards for all practice types of current language
- [ ] Korean shows: General, Particles, Hangul
- [ ] Japanese shows: General, Particles, Kanji, Hiragana, Katakana, Components
- [ ] Cards link to correct sub-routes
- [ ] All strings use `t()` where appropriate
- [ ] `npm run build` passes
