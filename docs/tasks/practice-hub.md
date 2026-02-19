# Task: Practice Hub Page

**File:** `src/features/practice/PracticePage.tsx`
**Route:** `/practice`
**Current state:** Stub — "coming soon"

## Goal

Build a practice hub that shows all available practice types for the user's current language, with cards linking to each sub-practice.

## Requirements

- Read `practiceOptions` from `languageConfig.ts` for the current language
- Show a card per practice type (particles, kanji, alphabet, general, components, **videos**)
- Each card: icon/emoji, title, description, sample character, link to the sub-route
- Cards that aren't yet implemented show a "coming soon" badge but are still visible
- Responsive grid (2-3 cols on desktop, 1 on mobile)

## Data

- No new data files; use `getLanguageConfig(languageId).practiceOptions`
- Use `getPracticeRoute()` from `practiceTypeRoutes.ts` for links

## Videos as a learning method

**Practice type:** Add `videos` as a practice type. The Videos hub lists available video content (K-drama, J-drama, music video clips, etc.) for the learning language.

**Unlock by course:**
- Videos are **unlockable based on course progress**. A video may require completion of a specific lesson or module (e.g. "Greetings" module) before it becomes available.
- Each video references an `unlockCondition` (e.g. `{ type: "lesson", lessonId: "m1-l1" }` or `{ type: "module", moduleId: "m1" }`).
- Locked videos appear greyed out with a lock icon and show the unlock requirement ("Complete Greetings to unlock").

**Custom / community content:**
- Videos are also supported as **community addons**. Creators can submit video packs (e.g. "K-Drama Greetings Compilation", "J-Pop Lyrics Practice") that appear alongside course-linked videos.
- Community video addons use the same addon schema (kind: `video` or `video-pack`) and may have their own unlock rules or be freely accessible.

**Integration in learning steps:**
- Videos are **included as lesson steps** via a new `video` step type. Within a lesson, a step can embed a short clip (K-drama scene, J-drama dialogue, music video segment) with optional captions, vocabulary highlights, and comprehension questions.
- See `dataformats/lessons/README.md` for the `video` step type definition.

## UI reference

- Card grid like the home page quick-link cards
- Each card: rounded-xl, border, hover shadow, icon on left, title + desc on right

## i18n

- Add `practice.hub.*` keys: title, subtitle, comingSoon badge text
- Practice type labels can come from `practiceOptions[].label` for now
- Add `practice.videos.*` for the Videos hub (title, unlockHint, lockedBadge, etc.)

## Acceptance criteria

- [ ] Practice hub shows cards for all practice types of current language
- [ ] Korean shows: General, Particles, Hangul, Videos
- [ ] Japanese shows: General, Particles, Kanji, Hiragana, Katakana, Components, Videos
- [ ] Cards link to correct sub-routes
- [ ] All strings use `t()` where appropriate
- [ ] `npm run build` passes
