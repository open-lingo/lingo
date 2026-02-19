# Task: Backend — User Settings API

**Service:** `lingo-core` (FastAPI, Python 3.13+)
**Router prefix:** `/api/core/users/v1` (already implemented)
**Current state:** Fully implemented and wired.

**References:**
- Router: `lingo-core/app/users/router.py`
- Schemas: `lingo-core/app/users/schemas.py`
- DB protocols: `lingo-core/app/db/protocols.py`

---

## Status: DONE

The user API is implemented with the following endpoints:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/me` | Register new user |
| `GET` | `/me` | Get current user profile |
| `PATCH` | `/me` | Update current user profile |
| `GET` | `/u/{username}` | Public profile lookup by username |
| `GET` | `/me/settings` | Get user settings |
| `PATCH` | `/me/settings` | Partial update user settings |

Auth: All `/me` endpoints require `get_current_user` dependency. The `/u/{username}` endpoint uses `get_current_user_optional`.

Database: SQLite (local dev) and DynamoDB (prod) implementations exist via the `UserRepository` protocol.

Frontend: `UsersApi` class in `src/api/users.ts` is wired to all endpoints. Profile and settings components use `useApi().users.*`.

---

## Remaining work

- [ ] DynamoDB implementation tested end-to-end (currently SQLite is primary)
- [ ] Profile picture upload (S3 presigned URL endpoint)
- [ ] Rate limiting on registration
