# SRS backend storage design

Storage schema for SRS (spaced repetition) card state. Per-card rows enable efficient "cards due" queries without scanning. Designed for affordability on DynamoDB.

See [flashcards/](../flashcards/) for the client-side SRS state format and deck integration.

---

## Data model

**SRSCardState** (per card, per user):

| Field           | Type   | Description                              |
|-----------------|--------|------------------------------------------|
| easeFactor      | number | SM-2 ease factor (e.g. 2.5)              |
| interval        | number | Days until next review                   |
| dueDate         | string | YYYY-MM-DD when card is next due         |
| repetitions     | number | Number of successful reviews             |
| lastReviewDate  | string | YYYY-MM-DD of last review                |
| lastSyncedAt    | string | ISO timestamp of last backend sync (optional) |

**SRSStore** = `Record<cardId, SRSCardState>` — one state object per card per user.

---

## Access patterns

1. **Full sync load** — "All SRS state for this user" (session start, hydrate from server)
2. **Cards due** — "Cards where dueDate <= today" (build review queue, counts)
3. **Update cards** — Upsert one or more card states (on sync, after rating)
4. **Get single card** — Fetch state for a specific card by ID

---

## SQLite schema

One row per (user, card). Index on `(auth0_id, due_date)` for efficient due-date queries.

```sql
CREATE TABLE srs_cards (
    auth0_id        TEXT    NOT NULL,
    card_id         TEXT    NOT NULL,
    ease_factor     REAL    NOT NULL DEFAULT 2.5,
    interval_days   INTEGER NOT NULL DEFAULT 0,
    due_date        TEXT    NOT NULL,
    repetitions     INTEGER NOT NULL DEFAULT 0,
    last_review     TEXT    NOT NULL,
    extra           TEXT    NOT NULL DEFAULT '{}',
    PRIMARY KEY (auth0_id, card_id)
);

CREATE INDEX idx_srs_due ON srs_cards (auth0_id, due_date);
```

**`extra`** stores optional fields (e.g. `lastSyncedAt`) as JSON.

**Due cards query:**

```sql
SELECT * FROM srs_cards
WHERE auth0_id = ? AND due_date <= ?
ORDER BY due_date;
```

Uses `idx_srs_due` — no full table scan. Efficient even with 10k+ cards; typical "due today" result is hundreds of rows.

---

## DynamoDB schema

### Base table

| PK                | SK        | easeFactor | interval | dueDate   | repetitions | lastReviewDate | lastSyncedAt |
|-------------------|-----------|------------|----------|-----------|-------------|----------------|--------------|
| `USER#auth0\|xxx` | `SRS#ko-1`| 2.5        | 1        | 2025-02-19| 2           | 2025-02-18     | …            |
| `USER#auth0\|xxx` | `SRS#ko-2`| 2.36       | 3        | 2025-02-21| 3           | 2025-02-18     | …            |

- **PK** = `USER#auth0|xxx` (partition by user)
- **SK** = `SRS#cardId` (sort by card)
- One item per card; attributes match SRSCardState

**Full sync load:** `Query PK = USER#xxx, SK begins_with "SRS#"`  
**Get single card:** `GetItem(PK, SK)`  
**Update:** `PutItem` or `BatchWriteItem`

### GSI: cards due

- **GSI1PK** = `USER#auth0|xxx` (same as base PK)
- **GSI1SK** = `DUE#YYYY-MM-DD#cardId` (dueDate + cardId for uniqueness)

**Cards due query:**

```
Query GSI1 where
  GSI1PK = USER#auth0|xxx
  GSI1SK between "DUE#0000-01-01" and "DUE#2025-02-18"
```

Returns only overdue cards. No scan. ~1 RCU per 4 KB read; even 500 due cards ≈ 50 KB ≈ 13 RCU per query.

---

## Cost notes

- **SQLite:** Free; local dev only.
- **DynamoDB:** Pay per request + storage. Per-card design keeps reads minimal:
  - Full load: 1 Query (base table)
  - Due cards: 1 Query (GSI), returns only due items
  - Sync: BatchWriteItem for dirty cards only

Avoid PK = `userId:cardId` (each card its own partition) — that breaks "get all for user" and would require many GetItems or a Scan.

---

## API contract

- `GET /api/core/srs/v1/state` — Full SRS map for current user
- `GET /api/core/srs/v1/due?onOrBefore=YYYY-MM-DD` — Cards due on or before date (optional)
- `POST /api/core/srs/v1/sync` — Push dirty cards, receive merged state
- `DELETE /api/core/srs/v1/cards` — Remove state for specific cards
- `DELETE /api/core/srs/v1/all` — Wipe all SRS state for user
