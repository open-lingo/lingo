> **Status: ARCHIVED — SUPERSEDED by anki-import-spec-2026-07-07.md.** Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Task: Anki deck import (.apkg)

**Status:** Not started  
**Architecture:** [dataformats/flashcards/anki-import.md](../dataformats/flashcards/anki-import.md)

## Context

Landing and i18n already advertise Anki import. Today, deck upload accepts **Open Lingo JSON** only (`CreateTab` → `parseDeckJson` → `decksApi.createDeck`). Users with `.apkg` files need a server-side path for reliability and large decks.

## Goals

- [ ] Import `.apkg` into a **community deck** (phase 1)
- [ ] Optional **SRS state** when export includes scheduling (phase 2)
- [ ] Clear UX: file size, progress/async job, warnings (unsupported note types)
- [ ] (Later) Export deck → `.apkg` for Anki mobile review

## Out of scope (initial)

- Full `.colpkg` collection replace (desktop Anki semantics)
- Public hosted “Anki → JSON” API (see architecture doc; consider open package first)
- Perfect FSRS parity with Anki after import

## Suggested implementation order

1. **Backend:** `POST /api/.../import/anki` (multipart or presigned upload) → unzip → SQLite → `AnkiPackageJsonV1` → map → `createDeck` + media to S3
2. **Frontend:** Import flow on Contribute / Deck manager; job polling for large files
3. **SRS:** Map `cards` + `col.crt` → `SRSCardState`; document FSRS caveat
4. **Tests:** Fixture `.apkg` with/without scheduling; snapshot Stage A JSON

## Acceptance criteria (phase 1)

- User can upload a Basic-style `.apkg` and get a subscribed/owned deck with cards and images/audio URLs working
- Import fails gracefully with readable errors for corrupt/unsupported packages
- Decks above size limit are rejected or queued with message (no silent browser OOM)

## Files (expected touch)

- `lingo-core/` — import service, routes, media upload
- `lingo/src/features/community/contribute/` or flashcards — upload UI
- `lingo/docs/dataformats/flashcards/anki-import.md` — update when schema is finalized
