# External-Knowledge Import (Anki → Lingo) — Spec v1

**Date:** 2026-07-07 · **Driver:** Spencer's migration off Duolingo+Anki (see `docs/research/duolingo-deep-survey-2026-07-07.md` §3 Phase 0 and `docs/research/spencer-migration-audit-2026-07-07.md` — both local-only (`docs/research/` is gitignored)).
**Goal:** language-agnostic foundation for importing evidence of prior study into Lingo — v1 source: Anki. Two halves: an **offline extractor** (Anki collection → normalized JSON) and an **in-app importer** (JSON → atom matches → FSRS seeding + optional atom unlocks + report).

## Design principles
- **Evidence, not authority.** Imports never clobber real Lingo progress: a card with existing `reps > 0` in either modality is skipped. Imports never mark lessons complete and never move course position — placement/test-out stays the only course-position mechanism.
- **Language-agnostic core.** The JSON schema and matcher/seeder core carry zero JA specifics. Per-language match-key expansion comes from the language module (registry), same pattern as annotate/TTS.
- **Recognition ≠ production.** Anki evidence is (overwhelmingly) recognition-style. Seed recognition richly; production enters as seeded-new (metered by the normal new-intake cap).

## Normalized schema — `known-items export v1`
```jsonc
{
  "version": 1,
  "language": "ja",            // lingo language id
  "source": "anki",            // extractor id
  "exportedAt": "2026-07-07T18:00:00Z",
  "items": [{
    "expression": "見る",      // surface form as studied (required, non-empty)
    "reading": "みる",         // phonetic form (optional)
    "meaning": "see, look at", // gloss (optional)
    "evidence": {
      "class": "active",       // "active" | "suspended-reviewed"
      "intervalDays": 120,     // current SRS interval, 0 if unknown
      "reps": 8,               // lifetime reviews across the note's cards
      "lapses": 1,
      "lastReviewAt": "2026-04-18",        // ISO date (optional)
      "source": "Core 2000::Step 01"       // provenance (deck path etc.)
    }
  }]
}
```
Dedup key inside one export: `(expression, reading)` — extractor keeps the strongest evidence (active beats suspended-reviewed; then max intervalDays).

## Half 1 — extractor CLI: `scripts/anki-export-known.py`
Python 3 stdlib only (sqlite3, zipfile, json, re, html). Input: `collection.anki2` path OR `.colpkg`/`.apkg` (zip containing `collection.anki2` / `collection.anki21`). Output: known-items JSON (stdout or `-o`), summary line to stderr.

- **Known** = note with ≥1 card in review queue (`queue=2`) → class `active`; else ≥1 suspended card (`queue=-1`) with ≥1 revlog entry → class `suspended-reviewed`; else excluded.
- Evidence: `intervalDays` = max `ivl` over qualifying cards; `reps` = sum of `reps`; `lapses` = max; `lastReviewAt` = max revlog id across the note's cards.
- **Notetype adapters** (matched by notetype-name pattern, ordered; first hit wins), each yields `(expression, reading, meaning)`:
  1. `iKnow! Vocabulary*` and `Japanese Vocab Dynamic`: fields Expression / Meaning / Reading directly (strip HTML).
  2. `iKnow! Sentences*`: expression + reading = the `<b>…</b>` bolded segment of fields 0 / 2; meaning = field 1 up to first `<br`.
  3. `Youtube Video Vocab w/ Image` (fields Word/Meaning/Image): expression = Word with `[furigana]` brackets stripped, spaces removed; reading = bracket contents joined with bare kana (風[ふう] 物[ぶつ] 詩[し] → ふうぶつし).
  4. `Migaku Japanese`: Target Word field `表現[よみ;tags]` → expression before `[`, reading = bracket content before `;`; meaning = Definitions (truncate 80 chars).
  5. Fallback (any other notetype): field 0 = expression, field 2 = reading if it looks kana-ish else "", field 1 = meaning. Log adapter-fallback count to stderr.
- HTML cleaning: strip tags, unescape entities, drop `[sound:…]`, trim `。.!?！？` and whitespace. Skip items whose cleaned expression is empty or > 40 chars (sentence blobs).
- `--language ja` (default ja), `--min-interval N` (default 0). Header docstring documents the schema as the interface contract.

## Half 2 — in-app importer: `src/features/flashcards/import/`
### `types.ts` + `parse.ts`
`KnownItemsExport` / `KnownItem` types mirroring the schema. `parseKnownItemsExport(input: unknown): KnownItemsExport` — structural validation (no new deps; hand-rolled guards in the style of `srsStorage.isModalFsrsState`), throws `ImportParseError` with a human message on shape violations; tolerates unknown extra fields; enforces version === 1.

### `match.ts`
```ts
type ImportMatch = { item: KnownItem; cardId: string; atom: CourseAtom };
matchKnownItems(items: KnownItem[]): { matches: ImportMatch[]; unmatched: KnownItem[] }
```
- Index atoms by match keys. Base keys per atom: `kana`, `kanji` (when present). **JA expansion:** conjugated/inflected surface forms for verb/adjective atoms so 食べました/会いましょう/住んでいる match their dictionary-form atoms. Implementation preference order: (1) reuse the conjugation trainer's form generators if they can enumerate forms for arbitrary atoms; (2) otherwise a self-contained suffix-rule expander in `jaSurfaceForms.ts` generating forms FROM atom kana/kanji (ます/ました/ません/ませんでした/て/た/ない/たい/ましょう + い-adj stems: 〜くない/〜かった; する-nouns: +する/します/しました). Keys generated from atoms (bounded), never parsed from input.
- Match precedence: reading==kana > expression==kanji > expression==kana > expanded-form hits. An item matching multiple atoms credits ALL matched atoms (それ→ambiguity is rare; report multi-matches in the result for transparency).
- Language-agnostic seam: `match.ts` consumes `getImportMatchKeys(atom)` exported from the JA language module (`src/features/languages/ja/…`); core never imports JA files directly (mirror how other per-language capabilities register).

### `seed.ts`
```ts
evidenceToSeedState(item: KnownItem, today: string): SRSCardState
applyImport(matches: ImportMatch[], opts: { unlockAtoms: boolean }): ImportReport
```
- Recognition sub-state: `state:"review"`, `stability = clamp(intervalDays, 1, 365)`, `interval = intervalDays`, `difficulty` = FSRS default-initial (whatever `createEmptyCard`/config uses — do not invent a constant), `reps`/`lapses` carried, `lastReviewDate = lastReviewAt ?? today`, `dueDate = max(today, lastReviewAt + intervalDays)` — long-overdue cards become due today, metered by the existing review queue, NOT rescheduled into the future.
- Production sub-state: NEW (zeroed) with `dueDate = recognition.dueDate` — enters production track through the normal new-intake cap.
- `suspended-reviewed` class: halve intervalDays before mapping (weaker evidence).
- **No-clobber:** skip any cardId whose existing store state has `reps > 0` on either modality; count as `skippedExisting`.
- Writes go through the standard per-card store setter (the same path lesson reviews use) so Track A backend sync + quota-safe writes apply. `opts.unlockAtoms` → `unlockAtomIds(matchedCardIds)` (the REAL path with server push — this is a genuine account change, unlike dev simulation).
- `ImportReport`: `{ matchedItems, seededCards, skippedExisting, unlockedAtoms, unmatched: KnownItem[], multiMatches }`.
- Document in code: unlocking matched atoms advances grammar-deck reached-modules (intended for migrators — grammar intake stays capped/day + backlog transparency from grammar-deck v1.1/v1.2).

### UI — Settings "Import study history" card (`src/features/settings/…` following the existing settings-section pattern)
Dev-gated for v1 (same gate style as DevPanel visibility). Flow: file input (.json) → `parseKnownItemsExport` → preview (N items · X match atoms · Y already tracked · Z beyond course) + "Unlock matched words" toggle (default ON) → APPLY → report screen (counts + downloadable unmatched JSON via blob link). Errors surface the `ImportParseError` message. i18n `t()` keys with defaults for all copy.

### Tests (vitest, colocated)
parse (valid/invalid/version), matcher (kana/kanji/conjugated forms incl. 食べました→たべる, ambiguity multi-credit, unmatched), seeding math (overdue→today, clamp, suspended-halving, production-new), no-clobber, unlock called with exactly matched ids (mock), UI smoke (preview counts render).

## Relationship to prior planning
- `docs/flashcards-anki-scoping-2026-06-13.md` scoped Anki import as **deck-content** import (.apkg → community/custom decks; blocked on media hosting, Trevor coordination) and explicitly deferred "scheduling-state import — Anki revlog → FSRS memory states". **This spec ships that deferred piece** on the course deck, where no media is needed. The two are complementary halves of one migration story: knowledge-evidence import (this spec, course atoms) now; deck-content import (that doc, custom decks + media) later. The `unmatched` ledger in the ImportReport is the planned hand-off between them — the 652-item class of "knows it, we can't hold it yet" becomes custom-deck seeds when plan B lands.
- The vocab browser (`/{lang}/vocab`, `src/features/vocab/`) already joins course atoms with mastery tiers from server concept rollups — an import + sync makes a migrator's real knowledge visible there immediately. It is the natural "see what you brought with you" surface for the post-import moment (no work needed in v1 beyond sync flowing).

## Non-goals v1
Duolingo data import (no export exists — placement covers it); in-browser .apkg parsing (CLI first; schema is the seam); importing non-atom vocabulary as reviewable cards (unmatched list is preserved in the report for a future custom-deck/content-authoring pass); symbol-mastery/kana seeding (cheap follow-up once shape validated); non-JA key expanders.
