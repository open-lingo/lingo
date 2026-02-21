# Task: Backend — SRS API

**Service:** `lingo-core` (FastAPI, Python 3.13+)
**Router prefix:** `/api/core/srs/v1`
**Status:** Implemented (SQLite). DynamoDB pending.

**References:**
- Storage design: `docs/dataformats/srs/README.md` (SQLite + DynamoDB schema)
- Frontend types: `src/features/flashcards/data/types.ts` (SRSCardState)
- Frontend API: `src/shared/api/srs.ts` (SrsApi)

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/state` | Full SRS map for current user |
| `GET` | `/due?on_or_before=YYYY-MM-DD` | Cards due on or before date |
| `POST` | `/sync` | Push dirty cards, receive merged state |
| `DELETE` | `/cards` | Remove state for specific card IDs |
| `DELETE` | `/all` | Wipe all SRS state for user |

---

## Implementation

- **Router:** `lingo-core/app/srs/router.py`
- **Schemas:** `lingo-core/app/srs/schemas.py`
- **SQLite:** `lingo-core/app/db/srs_sqlite.py` (per-card rows, index on due_date)
- **DynamoDB:** Not yet implemented; design documented in `docs/dataformats/srs/README.md`

---

## Remaining work

- [ ] Implement DynamoSRSRepository (GSI for due-date queries)
- [ ] Wire DynamoDB SRS repo in `app/db/dependencies.py` when DB_BACKEND=dynamodb
