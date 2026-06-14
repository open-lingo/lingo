# Deck Preview Modal — Overhaul

Branch: `feat/deck-preview-modal`

Rebuilt `DeckPreviewModal` from a generic card-list dialog into an
author-forward, stats-rich, browse-only preview with one prominent subscribe
action. The modal now uses the shared `<Modal>` primitive and is decomposed
into focused subcomponents.

## Screenshots (after)

`docs/screenshots/`:
- `deckmodal-new-desktop.png` — not subscribed, desktop
- `deckmodal-subscribed-desktop.png` — subscribed, desktop (accented upvote pill + "Subscribed" button)
- `deckmodal-new-mobile.png` — not subscribed, mobile bottom-sheet
- `deckmodal-subscribed-mobile.png` — subscribed, mobile bottom-sheet

> Note: in headless-Chromium captures the single-kanji card face (犬) renders as
> a font-fallback glyph because the screenshot box has no CJK font installed.
> The DOM contains the real text — verified via `page.evaluate`. On a normal
> machine the card shows the kanji correctly.

### Before (what it was)

The old modal (`ModalBackdrop`-based, hand-rolled): a cover image, a flat
searchable **list** of every card as `front`/`back` rows in over-rounded
`rounded-lg` tiles, a thin right sidebar with creator/lang/cards/upvotes as
plain label-value text, a "Comments coming soon" block, its **own** close
button (duplicating any modal chrome), and a footer with Subscribe (outline) +
Close + a **"Start review"** link that navigated into review from the preview.
No real card viewer, no author avatar, no vote control, no difficulty/complexity
stats, no satisfying subscribe state.

## The 8 issues — how each was addressed

1. **Card preview "so rounded and weird"** — removed the bespoke card-row list
   entirely. The preview is now the real `CardPreview` SRS viewer (its canonical
   `rounded-xl border-2` card face), wrapped in the new `CardCarousel`. No more
   over-rounded blob list.

2. **No real SRS card viewer** — `CardCarousel` mounts the actual `CardPreview`
   component (same one used in review), so cards look exactly as in review:
   tap-to-flip front/back, particle/root highlighting, info panel. Prev/next
   page controls + an "n of N" counter let you page through every card. The
   viewer remounts per index (keyed on `card.id`) so flip resets between cards.

3. **No author / pfp** — new `DeckPreviewHeader` shows the author avatar (shared
   `ui/Avatar`, initials/icon fallback) + display name + "Maintainer" label.
   Author metadata is threaded from the marketplace item's resolved `creator`
   (`CommunityHomePage` → `openDeckPreview(..., { author })`). Falls back to the
   addon's `maintainerName`, then to "Community" when nothing is known.

4. **No upvotes** — `DeckPreviewHeader` renders a live upvote control wired to
   `useDeckVote` (optimistic toggle, guest→login). Voted state is accent-tinted.
   With no `deckId` it degrades to a static count from the caller-supplied
   `upvoteCount` / `addon.upvoteCount`.

5. **Cooler subscribe button** — new `SubscribeButton` with two clear states:
   not-subscribed = solid accent CTA with a bookmark icon (hover lift +
   active press); subscribed = calm success-tinted confirmation with a check
   that reveals "Unsubscribe" on hover. Full-width, sticky to the modal bottom,
   with a one-line hint underneath.

6. **No review from preview** — removed the `reviewHref` / "Start review" link
   and `useLangPath` import. Preview is browse-only; the subscribe hint points
   the user to review from flashcards practice after subscribing.

7. **Redundant close button** — dropped the hand-rolled absolute close button
   (and `ModalBackdrop`). The modal now uses the shared `<Modal>` primitive,
   which provides its own close button, focus trap, escape/backdrop close, body
   scroll-lock, and the mobile bottom-sheet treatment.

8. **Missing context + stats** — new `DeckStatsPanel` (fed by `computeDeckStats`)
   surfaces: card count, an overall difficulty chip (Easy/Medium/Hard), the
   simple-vs-complex split bar, and a per-band difficulty distribution. The
   masthead carries author, votes, language (flag chip), updated date, and the
   full description. The modal is now genuinely informative.

## Complexity / difficulty heuristic

Community decks carry **no per-user FSRS state at preview time** (you haven't
subscribed yet), so a real FSRS difficulty (D) value isn't available. The
heuristic is therefore **content-derived** (and labelled as such in the UI).
`src/features/flashcards/deckStats.ts`:

Each card accrues "complexity signals":
- it is a full **sentence** (more to parse than a single word) → +1
- either face is **long** (≥ 40 chars) → +1
- it ships **supporting context**: note / reasoning / definition / context → +1
- it ships **worked examples** → +1

Derived classifications:
- **complex** when signals ≥ 2 (else simple)
- **difficulty band**: 0 signals → easy, 1–2 → medium, ≥ 3 → hard
- **overall deck band**: weighted average of card bands (easy=0, medium=1,
  hard=2); ≥ 1.34 → hard, ≥ 0.5 → medium, else easy

`computeDeckStats` returns counts that always sum to the total and is
divide-by-zero safe on an empty deck.

## New / changed files

New subcomponents (all < 200 LOC):
- `src/features/flashcards/components/DeckPreviewHeader.tsx` — cover, author + avatar, language chip, live upvote control
- `src/features/flashcards/components/CardCarousel.tsx` — real `CardPreview` viewer + paging
- `src/features/flashcards/components/DeckStatsPanel.tsx` — complexity + difficulty distribution
- `src/features/flashcards/components/SubscribeButton.tsx` — two-state primary action
- `src/features/flashcards/deckStats.ts` — stats heuristic

Tests:
- `src/features/flashcards/deckStats.test.ts` (15 cases — signals, classification, aggregation, edge cases)
- `src/features/flashcards/components/SubscribeButton.test.tsx` (3 cases — both states + loading)

Changed:
- `src/features/flashcards/DeckPreviewModal.tsx` — rewritten to compose the above on `<Modal>`; new optional `author` + `upvoteCount` props
- `src/features/community/CommunityContentContext.tsx` — thread `author` + `upvoteCount` through `DeckPreviewOptions`
- `src/features/community/CommunityHomePage.tsx` — pass resolved `creator` + `upvoteCount` into the preview
- `src/shared/components/ui/Modal.tsx` — added optional `ariaLabelledBy` so a body-hosted title can name the dialog
- `src/shared/i18n/locales/{en,ko,es}.json` — 17 new `flashcards.*` keys (all three locales)

## Backend data gaps (degraded gracefully, not faked)

- **Author for some call sites**: only the marketplace (`CommunityHomePage`)
  has a resolved `creator` (name + avatar) via the discover-backed directory.
  Other preview entry points (`ContentBrowserPage`, `FlashcardsPage`,
  `MyDecksPage`) pass `null` — the modal falls back to `addon.maintainerName`
  then "Community". A real `POST /users/batch` (resolve ids → public summaries)
  would let every entry point show the avatar; the modal API is already ready
  for it.
- **Difficulty is content-derived, not FSRS**: there is no deck-level aggregate
  difficulty from the backend and no per-user FSRS state before subscribing.
  The panel is explicitly a browse-time content estimate, not the scheduler's D.

## Verification

- `npx tsc --noEmit` — clean
- `npm run build` — clean
- `npm run test:run` — 161 files / 1233 tests pass
- Screenshots captured for subscribed + not-subscribed × desktop + mobile
