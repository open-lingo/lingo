# Anki import & interoperability

**Status:** Planning (not implemented). Research and architecture decisions from 2026-05-25.

Related: [flashcards README](./README.md), [SRS storage](../srs/README.md), [deck manifest](./deck-manifest.md). Existing upload path: Community → Contribute → **Upload deck** (Open Lingo JSON only).

---

## Goals

1. **Import** community and personal decks from Anki `.apkg` (and optionally full `.colpkg` backups).
2. **Optional migration:** preserve scheduling when the user exports with scheduling included.
3. **Longer term:** optional **export** to `.apkg` so learners can review on Anki mobile until Open Lingo has a native mobile app (interoperability, not “giving up” on review).
4. **Optional public contract:** stable intermediate JSON (`AnkiPackageJsonV1`) for third-party tools — defer hosted public API until there is demand; an open-source package may suffice earlier.

---

## Anki file formats

| Format | Extension | Contents |
|--------|-----------|----------|
| Deck package | `.apkg` | One deck (+ child decks): notes, cards, models, media |
| Collection package | `.colpkg` | Entire collection; in Anki desktop import **replaces** the whole collection |

An `.apkg` / `.colpkg` is a **ZIP** archive:

- SQLite DB: `collection.anki21` or `collection.anki21b` (legacy: `collection.anki2`)
- `media` — JSON map from numeric filenames (`0`, `1`, …) to real paths
- Media blobs referenced by that map

References: [Anki Manual — Exporting](https://docs.ankiweb.net/exporting.html), [AnkiDroid — Database Structure](https://github.com/ankidroid/Anki-Android/wiki/Database-Structure).

---

## Anki content model (why import is not “one row = one card”)

- **Note** — raw fields in `notes.flds` (fields separated by ASCII `0x1F`).
- **Model / note type** — in `col.models` JSON: field defs, card templates (`qfmt` / `afmt`), Cloze type.
- **Card** — `cards` row per generated card (`nid` + `ord` for template or cloze index).

One note can produce **multiple** cards. Importer should use stable keys: **`notes.guid` + `cards.ord`** (plus original Anki ids in metadata for debugging).

**Phased template support:**

1. **v1:** Basic-style models — first two fields as front/back, or explicit field mapping config.
2. **v2:** Cloze, richer HTML → Markdown/plain text, template evaluation or server-side strip.

---

## Scheduling & migration

Scheduling is **only present** if the user exported with **“Include scheduling information”** (deck `.apkg`). Shared community decks are often exported **without** scheduling (intentionally clean).

When scheduling is included, live state is in SQLite **`cards`** (`ivl`, `factor`, `due`, `queue`, `type`, `reps`, `lapses`, …). **`revlog`** is per-review history (optional for resume; useful for stats).

### Mapping Anki → Open Lingo `SRSCardState`

See [srs/README.md](../srs/README.md) and `src/features/flashcards/data/types.ts`. **Our engine is FSRS-6** (stability + difficulty, per-card, with a recognition/production modality split) — there is **no** `easeFactor`/`repetitions` field to map into. Anki's SM-2 `factor`/`ivl` do **not** convert losslessly to FSRS stability/difficulty, so scheduling import is best-effort.

Two viable strategies (pick per product call — this is unresolved):

1. **Import as new (simplest, recommended default):** drop Anki scheduling entirely; every imported card starts as a `new` FSRS card. Loses the user's prior progress but is correct and trivial.
2. **Approximate initial FSRS state:** seed each modality from the Anki interval — set `state`/`interval`/`dueDate` from `ivl` + `due` + collection `crt` (Anki `due` for review cards is **days since collection creation**, convert via `crt` + user timezone), and let FSRS re-fit `stability`/`difficulty` on the first real review. Document that **future intervals will differ**. Anki `factor` (SM-2 ease) has no FSRS equivalent and is discarded.

| Anki (`cards`) | Open Lingo (FSRS-6) | Notes |
|----------------|---------------------|--------|
| `ivl` (days) | `interval` + seeds `dueDate` | Only used in strategy 2; learning/relearning cards are more nuanced |
| `due` + `col.crt` | `dueDate` | Anki review `due` is days-since-collection-creation, not a calendar date — convert via `crt` + timezone |
| `reps` / `lapses` | `reps` / `lapses` | Carry over as counters only; they don't drive FSRS scheduling |
| `factor` (SM-2 ease) | — | No FSRS equivalent; discard |

**FSRS-native Anki users:** many Anki collections already run FSRS, but the exported `cards` columns still only expose SM-2-shaped fields, so the caveats above apply either way.

---

## Recommended pipeline (two stages)

Do **not** map SQLite rows directly to API payloads in one step.

```
.apkg (upload)
    → Stage A: AnkiPackageJsonV1 (normalized intermediate)
    → Stage B: Open Lingo Flashcard[] + optional SRSCardState[]
    → decks API / SRS sync
```

### Stage A — `AnkiPackageJsonV1` (internal or future public schema)

Purpose: isolate Anki quirks (schema versions, Cloze, HTML, media) from product rules.

Suggested fields (illustrative — version when implemented):

- `version`: `"1"`
- `source`: deck name, Anki deck ids, export had scheduling boolean
- `notes[]`: `guid`, fields (raw + resolved text), tags, model id
- `cards[]`: stable key (`guid` + `ord`), front/back (resolved), media refs
- `scheduling?`: per-card interval, ease permille, due (absolute or raw + `collectionCreatedAt`)
- `media[]`: `{ id, filename, contentType }` → stored as URLs after upload, not giant base64 in JSON
- `warnings[]`: unsupported models, stripped Cloze, broken templates

### Stage B — Open Lingo

Map to [deck format](./README.md): `Flashcard` types (`word` / `sentence` / `other`), `languageId`, community vs course deck. SRS rows keyed by **stable imported card id** (derived from Anki guid + ord).

---

## Client-side vs server-side import

| Approach | Verdict |
|----------|---------|
| **Server (default)** | Required for production and large decks: native SQLite, streaming ZIP, S3 media, size limits, async jobs |
| **Client (optional later)** | OK for **preview** (card count, models, size) or **capped** small imports (&lt; ~25 MB, low thousands of cards) using unzip + sql.js in a **Web Worker** |
| **Client-only for all decks** | **Not recommended** — memory (ZIP + DB + media often 2–3× file size), mobile Safari tab limits, lost work on tab close |

**Comfort zone for pure client-side parsing:** roughly &lt; 20–50 MB `.apkg`, &lt; ~5–10k cards, with workers — above that, server processing.

**Big-deck UX (either path):**

- Show file size before upload; cap or queue (e.g. 100 MB)
- Async job: upload → `jobId` → poll progress → result + warnings
- Stream media to object storage; references in JSON only

Current app already uploads **Open Lingo JSON** client-side (`CreateTab` → `parseDeckJson` → `createDeck`). `.apkg` is a different workload.

---

## Export to Anki (phase 2)

**User value:** Study on AnkiMobile/AnkiDroid while Open Lingo owns content/courses/community.

**Cost:** Harder than import — must emit valid `.apkg` (SQLite schema, `col` JSON for `models`/`decks`/`dconf`, note/card rows, media map, optional scheduler fields).

**Product framing:** Interoperability (“export for mobile review”), not abandoning SRS in-app.

---

## Public API vs open package

- **Defer** a hosted “Anki → JSON” public API until external demand; versioning and abuse handling are non-trivial.
- **Design Stage A JSON** so it can ship as **open-source npm/CLI** or **documented schema** without redesign.
- When exposing HTTP: OpenAPI, `AnkiPackageJsonV1`, API keys, explicit deprecation policy.

---

## Anki ecosystem (scope)

Primary targets: **Anki desktop**, **AnkiMobile**, **AnkiDroid** — same `.apkg` / collection SQLite story. No separate “Ki” app format identified in research.

---

## Implementation phases (suggested)

| Phase | Deliverable |
|-------|-------------|
| **1** | Server upload `.apkg` → parse → community deck (no scheduling); Basic models; media to storage |
| **2** | Scheduling import when export includes it → `SRSCardState` via SRS sync API |
| **3** | Cloze / HTML / more note types; richer warnings |
| **4** | Export Open Lingo deck → `.apkg` |
| **5** | Optional public `AnkiPackageJsonV1` spec + package |

---

## Testing

Keep sample fixtures (not necessarily in repo):

- Small `.apkg` **without** scheduling (typical shared deck)
- Small `.apkg` **with** scheduling (migration case)
- Optional: Cloze + media-heavy deck for edge cases

Snapshot **Stage A** JSON for unit tests on Stage B mapping.

---

## References

- [Anki Manual — Exporting](https://docs.ankiweb.net/exporting.html)
- [Anki Developer Docs](https://dev-docs.ankiweb.net/)
- [AnkiDroid — Database Structure](https://github.com/ankidroid/Anki-Android/wiki/Database-Structure)
- Community: [anki-scheduling-importer](https://github.com/abdnh/anki-scheduling-importer) (scheduling restore patterns)
