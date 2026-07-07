# Flashcards UI pass + Anki import — scoping for decision (2026-06-13)

Analysis only; nothing changed. Two candidate workstreams sized for a
go/no-go call with Spencer.

## A. Flashcard system: full UI audit + comprehensive pass

**Surface:** ~7,100 lines / ~35 files in `src/features/flashcards/`, but
only 4 routed screens — hub (`FlashcardsPage`), review (`FlashcardTester`,
593 ln), card manager (`CardManagerPage`, 713 ln — biggest page in the
feature), deck manager (407 ln) — plus modals/sidebars (deck preview,
detail sidebar, study options, onboarding gate).

**Engine is NOT the target.** FSRS-6 engine + migrations are well-tested
(`engine/srs.test.ts` + 3 migration suites). This is a UI/UX pass.

**Why debt is expected:** every standard developed in the 2026-06-12/13
lesson wave was applied to lesson surfaces only. Flashcards predates all
of it, so expect:

- dvh / fixed-px-chrome layout debt (the match-grid postmortem class of bug)
- no layout-stability discipline on rate buttons (0px-movement rule)
- zero juice — no sfx, no celebration on clearing the review queue
- none of the frontend-design treatment quests/shop received

**Cost estimate** (calibrated against completed work):

| Scope | Comparable | Size |
|---|---|---|
| Audit only (screenshots + ui-design-skill analysis, no changes) | quests/shop audit | focused hour, cheap–moderate |
| Audit + comprehensive fix wave | layout-stability + grid-growth passes combined | full session |

Logistics: routes sit behind RequireAuth → main-loop Playwright with
Spencer's headed auth state; subagents skip Playwright (standing rule).

## B. Anki porting (.apkg import)

Direction = **import** (existing product copy on DeckCreatePage already
promises ".apkg coming later").

**Already in place:** delimited text import (`parseDelimitedCards.ts`),
community deck create/share flow end-to-end, card schema has slots for
everything Anki carries (image, per-example `audioUrl`, notes, segments),
FSRS-6 is Anki's own modern scheduler.

**MVP (text fields only, no media, fresh scheduling): ~1–2 sessions.**
.apkg = zip(SQLite + numbered media files). Parse server-side in
lingo-core — Python stdlib `zipfile` + `sqlite3`, zero new deps (vs a
~1MB sql.js WASM blob client-side). One upload endpoint + a field-mapping
step in deck create ("which Anki field is front/back?") + HTML stripping.

**Gaps, in order of pain:**

1. **Media hosting — THE blocker for a good port.** lingo-core has no
   file storage at all (Lambda deploy, no S3 pipeline). Text-only import
   dodges it, but "import my Anki deck" without its audio will feel
   broken to real Anki users. Architectural decision; coordinate with
   Trevor before building toward it.
2. **Scheduling-state import** — Anki revlog → FSRS memory states so old
   decks don't reset to day one. Approximate science; fine to defer. V1:
   import cards fresh.
3. **RFC 4180 CSV parser** — flagged in `parseDelimitedCards.ts` itself
   as a prerequisite for the apkg path. Small cleanup.

> **2026-07-07 update:** the deferred "scheduling-state import" piece (gap 2
> below) is now spec'd and built as knowledge-evidence import onto the
> **course deck** (no media needed) — see `docs/anki-import-spec-2026-07-07.md`.
> Workstream B below (deck-content .apkg import w/ media) remains open and
> complementary; the import report's `unmatched` ledger feeds it.

## Open decisions

- [ ] Run flashcard audit-only first, or commit to the full audit+fix wave?
- [ ] Anki MVP now (text-only) vs wait for a media-storage decision?
- [ ] Media storage: S3 bucket + upload path in lingo-core (Trevor coordination) — prerequisite for media-complete Anki import.
- [ ] Sequencing: flashcard UI pass before Anki import makes sense (imports land on a polished surface).
