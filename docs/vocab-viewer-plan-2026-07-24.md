# Vocab Viewer + Dictionary Lookup Service — plan

**Branch:** `vocab-viewer` (off `freq-vocab`) · **Date:** 2026-07-24 · **Status:** BUILDING (full autonomy; merge after ~2h once the other session settles)

## Goal
A **language-agnostic**, dictionary-style **vocab viewer** — search/browse every word we have (authored course vocab + the frequency vocab) with its **frequency, definition, reading, POS**, and (for conjugables) its **paradigm** — plus a reusable **definition-lookup service** the rest of the site can call for on-the-fly definitions (e.g. tapping a word in a future story).

Distinct from the existing `features/vocab/VocabPage` (which is study-progress-oriented over *course* atoms). This viewer is reference-oriented, includes the not-yet-learned frequency vocab, and is keyed on frequency + definition.

## Architecture

### 1. Dictionary lookup service (the reusable "endpoints") — `src/shared/dictionary/`
Language-agnostic, built entirely off the registry — zero per-language code:
- Sources per language via `getAllLanguageIds()` → for each: `getCourseAtoms(id)` / `getLanguageModule(id).courseAtoms` (authored vocab) **unioned** with `getFrequencyAtoms(id)` (frequency vocab), deduped by canonical id/surface (course entry wins on conflict; frequency adds rank).
- `DictionaryEntry`: `{ id, languageId, surface, reading, meaningEn, pos, frequencyRank?, unlockModule?, source: "course"|"frequency"|"both", conjugation?, hasAudio }`.
- API (the "endpoints"):
  - `lookupWord(languageId, surface): DictionaryEntry | null` — exact/normalized surface lookup (the on-the-fly path for stories).
  - `searchDictionary(languageId, query, opts?): DictionaryEntry[]` — by surface / reading / meaning, ranked (exact > prefix > substring, then by frequency).
  - `getDictionaryEntries(languageId, opts?): DictionaryEntry[]` — full list for the viewer (filter/sort).
- Per-language normalization from the module: reading/romanizer (`module.romanizer`), search-fold (KO Hangul + RR, JA kana↔romaji, ES accent-fold) — obtained via the module, not hardcoded. Built once + memoized (indexes are static data).

### 2. Vocab viewer UI — `src/features/dictionary/`
- Route (lazy in `App.tsx`), e.g. `/dictionary` (language-scoped via the existing lang path), reachable from the practice/learn nav.
- Search box (search across surface / reading / meaning); results ranked.
- Browse list sorted by frequency, with filters (POS, source course/frequency, level/unlockModule) — reuse `FacetSidebar` + the `VISIBLE_CAP` windowing pattern from VocabPage.
- Entry detail (reuse/extend `VocabCardSheet` where sensible): surface, reading, meaning, POS, frequency rank, unlock module, **audio** (`getTtsUrl`), and for conjugable entries the **paradigm** rendered via the language module's conjugation engine (`getLanguageModule(id).conjugation`).
- Language-agnostic: works for the active language; if trivial, a language switch within the viewer.

## Testing
- Service: index builds for every registered language; `lookupWord` exact + normalized hits; `searchDictionary` ranking (exact>prefix>substring, freq tiebreak); course/frequency dedup + `source` correctness; unknown word → null; a language with no frequency atoms still yields course entries.
- Viewer: render smoke (search narrows; detail shows definition + reading + freq; conjugable shows a paradigm), language-agnostic (renders for ja/ko/es).

## Scope boundaries
**In:** the language-agnostic service + viewer over course+frequency vocab, search, detail with audio + conjugation paradigm.
**Deferred:** a backend HTTP endpoint (data is client-side static; the service API is shaped so an HTTP `DictionaryApi` can back it later); actual story integration (the service is ready for it); example sentences beyond what atoms carry; per-word art beyond existing `VocabArt`.

## Merge
Hold merge ~2h until the other session's `main` work settles; then rebase onto latest `main` (which will include `freq-vocab` this branch carries) and merge.
