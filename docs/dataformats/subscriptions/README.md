# Subscriptions

User subscriptions to content (decks, addons, stories). Stored in a **separate table** from user settings — different query pattern.

## Schema

| Field       | Type   | Description                          |
|------------|--------|--------------------------------------|
| auth0_id   | string | User identifier (Auth0 sub)          |
| content_type | string | `deck`, `addon`, `story`            |
| content_id | string | ID of the content                    |
| created_at | string | ISO timestamp                        |

**Primary key:** `(auth0_id, content_type, content_id)` — one subscription per content per user.

## API (User API)

- `GET /api/core/users/v1/me/subscriptions?content_type=deck` — List subscriptions
- `POST /api/core/users/v1/me/subscriptions` — Add: `{ contentType, contentId }`
- `DELETE /api/core/users/v1/me/subscriptions/{content_type}/{content_id}` — Remove

## Content type subclasses

Content types evolve independently under `app/users/subscriptions/content_types/`:

- `deck.py` — Validates deck exists via DeckRepository
- `addon.py` — Stub for addon validation
- `story.py` — Stub for story validation

Add new types in `ContentType` enum and create a handler subclass.

## DynamoDB (future)

- PK: `USER#{auth0_id}`, SK: `SUB#{content_type}#{content_id}`
- GSI: `GSI1PK: USER#{auth0_id}`, `GSI1SK: TYPE#{content_type}` for listing by type
