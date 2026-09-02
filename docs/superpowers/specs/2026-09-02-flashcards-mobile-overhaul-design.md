# Flashcards mobile overhaul, touch interaction, JA furigana, emoji re-fit — design

**Date:** 2026-09-02 · **Status:** approved by Spencer in chat (five decisions below) · **Owner:** Spencer

## Why

Spencer's report, verbatim in spirit: on the phone the flashcard reviewer forces
a scroll to see everything; mobile apps put secondary information in sheets and
sub-pages, not below the fold. Separately, long-press and drag on the phone
selects every word on screen. And two content problems: JA cards print
`漢字 (かな)` as text when the app already has a ruby renderer, and a set of
vocab emoji are indirect or missing (池 "pond" ships as 🦆 with the note
"duck implies pond").

## Decisions (Spencer, 2026-09-02)

1. **Grade buttons: two is the default for everyone.** Four stays opt-in via the
   existing setting. The silent flip from two to four after the first review
   session is removed.
2. **Focused chrome for the review session, mobile only.** Below `md`, the
   session hides the app header, breadcrumbs, and bottom tab bar like a
   lesson does. Desktop keeps its chrome unchanged.
3. **Text selection off on touch only.** Desktop users keep normal selection.
4. **Custom art style: flat sticker**, matching the Noto emoji look, not the
   painterly cast-portrait style.
5. **Emoji: replace every genuine mismatch** (indirect "implies" picks and
   rubric scores ≤3) and fill gaps; a pile of 20–30 uncertain items goes to
   Spencer for a call.

## Current state (verified 2026-09-02)

- `src/index.css:54-69` sets `overscroll-behavior: none`, tap-highlight
  transparent, and `touch-action: manipulation` on buttons. Nothing sets
  `user-select` or `-webkit-touch-callout`. The iOS wrapper is a stock
  WKWebView with no native override. 1,066 `hover:` utilities are ungated;
  `tailwind.config.js` has no `future.hoverOnlyWhenSupported`.
- `src/routes/Layout.tsx:76-79` `focusedFlow` regex covers lessons, test-out,
  placement, grammar review. `/practice/flashcards/review` is not in it, so the
  reviewer stacks: sticky header (44px) → breadcrumbs → its own toolbar row →
  progress bar → modality chip → card (`min-h-[360px]`) → grade row
  (`h-24 sm:h-16`) → stacked detail panel → stats strip → undo link → fixed
  tab bar (56px + safe area). `FlashcardTester.tsx` is 959 lines with no
  render test.
- `src/features/flashcards/engine/gradingLayout.ts:22-28` resolves the layout:
  explicit pref wins, else `simple` until `hasAnyReviewedCard()`, then `full`.
- `src/features/languages/ja/courseAtoms.ts:1760` builds
  `` `${atom.kanji} (${atom.kana})` `` into `Flashcard.front`, rendered by
  `PlainText` in `CardPreview.tsx:99`, `FlashcardTester.tsx:117,320`,
  `CardManagerPage.tsx:400,680`, `FlashcardsPage.tsx:93`. `VocabCardSheet.tsx:48`
  does the same with full-width parens; `VocabPage.tsx:253` shows kanji only.
  `src/shared/readingAnnotation/KanjiRuby.tsx` takes whole-word
  `surface + reading` and aligns okurigana itself. `kanjiFuriganaSrsVisible`
  (`AnnotatedText.tsx:65`) gates furigana on SRS mastery and is used only in
  lesson steps.
- The lesson shell (`src/features/lesson/components/LessonShell.tsx`) is the
  one fitted, no-scroll stage: fixed height, one inner `overflow-y-auto`
  scroller with `container-type: size`, full safe-area padding, verified by
  `tests/mobile/stage-fit.mobile.spec.ts`, which fires only on routes carrying
  `[data-lesson-stage]`.
- Overlay primitives: `ui/Modal.tsx` auto-becomes a bottom sheet on mobile
  with focus trap and scroll lock; `ui/Sheet.tsx` supports `side="bottom"` but
  every drill-in caller hardcodes `side="right"`.
- Emoji: `CourseAtom.emoji?: string` per course. JA 1020 atoms / 579 with
  emoji / 119 real gaps (non-blocked vocab or phrase). KO 391 / 169. ES 176 / 81.
  FR 135 / 62. Rubric: `docs/emoji-blocked-words-2026-05-18.md` (four-persona
  1–5 score; ≤3 → blocklist). ES has a course-wide "one emoji, one word" gate
  (`es-course-integrity.test.ts:54-81`); JA has ad-hoc per-module versions;
  KO and FR have none. 426 Noto SVGs are vendored under `src/pub/noto-emoji/svg/`
  and any new emoji must be vendored by hand. `LINGO_CUSTOM_ART` in
  `src/shared/assets/notoEmoji.ts` is a JA-only override map keyed by kana
  with 9 entries. Local image gen is `mflux-generate-z-image-turbo`
  (~25 s/image, offline), recipe in `src/pub/lingo-art/cast/README.md`.

## Design

### A. Touch interaction (Wave A)

Global CSS in `src/index.css`, scoped to touch:

```css
@media (pointer: coarse) {
  html, body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  input, textarea, [contenteditable="true"], .select-text {
    -webkit-user-select: text; user-select: text; -webkit-touch-callout: default;
  }
}
```

`touch-action: manipulation` widens from buttons to `html` (kills double-tap
zoom delay app-wide; pinch still works). `tailwind.config.js` gains
`future: { hoverOnlyWhenSupported: true }` so every `hover:` utility compiles
under `@media (hover: hover)`. The invite-link `<code>` gets `select-text`.
Drawing canvas and sortable list are out of scope (already touch-handled or
separate bugs). No native WKWebView change.

Sibling parity: web PWA inherits; iOS Capacitor build inherits (same bundle);
desktop unaffected by construction.

### B. JA furigana on cards (Wave A)

`Flashcard` gains an optional `reading?: { surface: string; kana: string }`.
`courseAtomToFlashcard` sets `front = atom.kanji ?? atom.kana` and, when kanji
exists, `reading = { surface: kanji, kana }`. A new `CardFront` helper in
`src/features/flashcards/components/` renders `KanjiRuby` when `reading` is
present, else `PlainText`; all five plain-text call sites use it. Furigana
visibility follows the same SRS gate lessons use (`kanjiFuriganaSrsVisible`
on the card's recognition state) so mastered kanji drop their reading. The
vocab sheet and vocab grid route through the same helper. Production-modality
cards (meaning → word) show the ruby on the answer face only.

Sibling parity: KO, ES, FR have no `reading`, inherit the plain path
unchanged. Frequency-deck cards have no kanji split, unchanged.

### C. Review session shell (Wave B)

- `FlashcardTester` becomes a fitted stage below `md`: a `ReviewShell` built on
  the `LessonShell` mechanics (fixed `100dvh` minus cookie-consent var, safe-area
  padding, one inner scroller with `container-type: size`, `data-lesson-stage`
  so the existing stage-fit gate covers it). Desktop keeps the current layout.
- `focusedFlow` in `Layout.tsx` becomes viewport-aware for this one route:
  header and tab bar hide for `/practice/flashcards/review` only under `md`.
  The `useViewport` hook already exists.
- Screen contents on mobile, top to bottom: slim row (back, progress bar,
  details/settings icons, undo chip when available) · modality chip · card ·
  grade row. Nothing else in flow.
- Detail panel (segments, note, definition, context, examples) moves into a
  bottom `Sheet` opened by a "Details" affordance on the revealed face. `Sheet` gains an `auto` side that resolves to
  `bottom` below `md` and `right` above, and gets `pb-safe`.
- Stats strip and the settings popover move into one bottom sheet.
- Grade buttons: `resolveGradingLayout` drops the `hasAnyReviewedCard` branch;
  default is `simple`. Full mode on phones renders 2×2 with a 48px min height
  in px, not rem.
- The 360px card floor is kept as a mobile `min-h` in container units so the
  grade row never jumps.
- Session-done screen stays inline but fits the stage.
- Tests: first `FlashcardTester.test.tsx` (renders, reveals, grades, undo,
  details sheet opens); `gradingLayout.test.ts` updated for the new default;
  `tests/mobile/routes.mjs` review route now carries the stage-fit check.
- `FlashcardTester.tsx` is split: `ReviewShell`, `ReviewToolbar`,
  `ReviewCard`, `GradeRow`, `ReviewDetailsSheet`, `SessionSummary`.

### D. Emoji re-fit pipeline (Wave C, local-first)

`scripts/emoji-refit/`, on the `scripts/draft/runner.mjs` shape (explicit
`num_ctx`, `think: false`, JSON-schema `format`, per-item resumable output):

1. `inventory.mjs` — dump every atom from JA/KO/ES/FR registries to
   `artifacts/emoji-refit/inventory.json` with `{course, id, surface,
   meaningEn, pos, kind, emoji, note, blocked}`.
2. `score.mjs` — `qwen3.5:122b-a10b-q4_K_M`, batches of 8, categories and
   rubric in prose (not enum-only), emits per atom `{fit: 1–5, reason,
   indirect: boolean, candidates: string[≤3]}`. Gaps get candidates only.
3. `check.mjs` — deterministic: candidate SVG exists in the Noto repo list
   (fetched once), no collision with any other emoji in the same course,
   FE0F stripped, and not a digit or keycap (the learner-sim "digit crutch"
   finding).
4. Frontier audit (this session) over the flagged set only: `fit ≤ 3`,
   `indirect`, and gaps. Output `decisions.json` with `keep | replace | art |
   unsure`. `unsure` is capped at ~30 and goes to Spencer.
5. `art.mjs` — for `art` decisions, `mflux-generate-z-image-turbo` with one
   pinned seed and a flat-sticker style clause, 512², then the cast
   post-process (flood-fill alpha, crop, 64-colour quantize), written to
   `src/pub/lingo-art/vocab/<course>/<id>.png`. `LINGO_CUSTOM_ART` is
   generalized to `{course}:{id}` keys, and `lingoArtUrl` takes a course.
6. `apply.mjs` — emits search/replace pairs per file; `qwen3-coder-next`
   applies them (never a whole-file rewrite). New emoji SVGs vendored via
   `vendor-noto.mjs` from the Noto repo.
7. Gates: extend the ES "one emoji, one word" test to a shared
   `courseEmojiIntegrity` helper run for all four courses; the JA per-module
   shared-glyph tests keep passing; image-MCQ generation runs green.

Blast radius: emoji strings only; no step content, no atom ids, no SRS keys.
Estimated compute: ~240 scoring calls (~40 min), ~100 art images (~45 min),
zero paid tokens except the frontier audit (~300–400 items).

### E. No-scroll doctrine for other surfaces (Wave D, separate spec)

Home, practice hub, library, profile, shop, and the lesson summary are
body-scroll pages under `Layout`'s `min-h-screen` shell. Converting them is
the "fixed shell, planned not built" item from `docs/mobile-research-2026-07-20.md`
and gets its own spec after Wave B proves the pattern on the reviewer.

## Out of scope

Native WKWebView changes; the alpha-tint Tailwind bug; module-card art;
`lingo-data` mirror re-export (downstream, regenerated from the app).

## Verification

- `npm run preflight` green.
- `npx playwright test --project=mobile --grep "flashcards"` green including
  stage-fit on the review route at `iphone-se` and `iphone-14-promax`.
- `getBoundingClientRect` at 375×667: window `scrollHeight - innerHeight ≤ 2`.
- Manual on the Trap Phone: long-press on a card selects nothing; the invite
  link still selects; a kanji card shows ruby; details sheet opens and closes.
- Emoji: every replaced entry has a vendored SVG (asserted by test);
  integrity test green for all four courses; Spencer walks the unsure pile.
