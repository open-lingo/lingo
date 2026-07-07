# SRS backend storage design

Storage schema for SRS (spaced repetition) card state. Per-card rows enable efficient "cards due" queries without scanning. Designed for affordability on DynamoDB.

The engine is **FSRS-6** (via `ts-fsrs` on the client), with a **recognition / production modality split** — each card carries *two* independent FSRS states. **Hard is a success** rating (not a failure); target retention is 0.95. See [flashcards/](../flashcards/) for the client-side format and deck integration, and `lingo/CLAUDE.md` → "SRS engine (invariants)" for the authoritative model. Backend Pydantic schema: `lingo-core/app/srs/schemas.py`.

**Anki migration (planned):** importing `.apkg` scheduling is non-trivial because Anki cards use SM-2 (`ease` permille, `ivl`, `due`) while our store is FSRS-6 (stability/difficulty). There is no lossless SM-2→FSRS map; the realistic options are (a) import cards as **new** (drop scheduling) or (b) approximate an initial FSRS state from the Anki interval. Details: [flashcards/anki-import.md](../flashcards/anki-import.md).

---

## Data model

**SRSCardState** (per card, per user) — nested, one FSRS state per modality:

| Field           | Type              | Description                                              |
|-----------------|-------------------|----------------------------------------------------------|
| recognition     | SRSModalityState  | FSRS state for shown-stimulus → identify-meaning         |
| production      | SRSModalityState  | FSRS state for cued-meaning → produce-target-form        |
| lastSyncedAt    | string?           | ISO timestamp of last backend sync                       |
| buriedUntil     | string?           | `YYYY-MM-DD`; if set and > today, card excluded from queue |
| lastReviewedAt  | string?           | Top-level ISO timestamp of the most-recent review across modalities — used for last-write-wins merge (date-only `lastReviewDate` couldn't disambiguate two same-day reviews) |

**SRSModalityState** (FSRS-6 state for one direction):

| Field           | Type   | Description                                              |
|-----------------|--------|----------------------------------------------------------|
| stability       | number | FSRS stability (S): predicted retention interval, days   |
| difficulty      | number | FSRS difficulty (D), in [1, 10]                          |
| state           | string | `new` \| `learning` \| `review` \| `relearning`          |
| interval        | number | Scheduled days until next review (derived from S + target retention) |
| dueDate         | string | `YYYY-MM-DD` when this modality is next due               |
| lastReviewDate  | string | `YYYY-MM-DD` of last review of this modality              |
| reps            | number | Total reviews of this modality                           |
| lapses          | number | Total Again ratings across the card's lifetime           |
| learningSteps   | number?| Position within the learning/relearning step ladder      |

**SRSStore** (client) = `Record<cardId, SRSCardState>`. Card ids are atom-derived and `<lang>:`-prefixed (e.g. `ja:ai`). A card is **due** when *either* modality's `dueDate <= today`.

> ⚠️ There is **no** `easeFactor` / `repetitions` / SM-2 interval. Pre-FSRS-6 (SM-2) entries are intentionally *dropped* on read, not migrated (they lack `stability`).

---

## Access patterns

1. **Full sync load** — all SRS state for a user (session start, hydrate from server)
2. **Cards due** — cards where `due_date <= today` (build review queue, counts)
3. **Update cards** — upsert one or more card states (on sync, after rating)
4. **Get single card** — fetch state for a specific card by id

---

## SQLite schema (dev)

The full FSRS-6 state is stored as **JSON** (`state_json`); a denormalized `due_date` column holds `min(recognition.dueDate, production.dueDate)` for the due-date index. One row per (user, card). (See `lingo-core/app/db/sqlite/srs.py`.)

```sql
CREATE TABLE IF NOT EXISTS srs_cards_v2 (
    user_id    TEXT NOT NULL,
    card_id    TEXT NOT NULL,
    due_date   TEXT NOT NULL,   -- min(recognition.dueDate, production.dueDate)
    state_json TEXT NOT NULL,   -- full SRSCardState (both modalities) as JSON
    PRIMARY KEY (user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_srs_v2_due ON srs_cards_v2 (user_id, due_date);
```

**Due cards query** (uses `idx_srs_v2_due`, no full scan):

```sql
SELECT card_id, state_json FROM srs_cards_v2
WHERE user_id = ? AND due_date <= ?
ORDER BY due_date;
```

---

## DynamoDB schema (prod)

Store the full state blob per item; index on the min-due date for the due query.

| PK                | SK          | dueDate (min) | state (JSON: recognition + production + meta) |
|-------------------|-------------|---------------|-----------------------------------------------|
| `USER#auth0\|xxx` | `SRS#ja:ai` | 2026-02-19    | `{ "recognition": {…}, "production": {…}, … }` |

- **PK** = `USER#auth0|xxx` (partition by user)
- **SK** = `SRS#<cardId>` (sort by card)
- **GSI (cards due):** `GSI1PK = USER#auth0|xxx`, `GSI1SK = DUE#<min-dueDate>#<cardId>`

**Full sync load:** `Query PK = USER#xxx, SK begins_with "SRS#"`
**Cards due:** `Query GSI1 where GSI1PK = USER#xxx AND GSI1SK <= "DUE#<today>#~"`
**Update:** `PutItem` / `BatchWriteItem` (dirty cards only)

Avoid `PK = userId:cardId` (each card its own partition) — that breaks "get all for user".

---

## Sync / merge

Delta sync pushes only dirty cards. The server merge is **last-write-wins by `lastReviewedAt`** (max across the two states) — comparing date-only `lastReviewDate` made same-day re-reviews look equal and silently rejected the client's newer state. Don't bypass the client's dirty-card detection.

---

## API contract

- `GET /api/core/v1/srs/state` — full SRS map for current user
- `GET /api/core/v1/srs/due?onOrBefore=YYYY-MM-DD` — cards due on or before date
- `POST /api/core/v1/srs/sync` — push dirty cards, receive merged state
- `DELETE /api/core/v1/srs/cards` — remove state for specific cards
- `DELETE /api/core/v1/srs/all` — wipe all SRS state for user
