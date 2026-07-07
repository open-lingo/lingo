# Deck manifest

The deck manifest is metadata about a flashcard deck. It is stored separately from deck content (cards) so we can list decks and check versions without loading card data.

**Canonical planning:** [ADR 0002 — deck content storage & versioning](../../../../lingo-core/docs/adr/0002-deck-content-storage-and-versioning.md) (implementation status, large-deck tiers).

**Implementation status (2026-05-25):** Card bodies are a **single JSON array** per deck. **Sharding and S3 tiers are planned, not built.**

**Relationship:**
- **Manifest** — id, languageId, name, courseId, version, cardCount (metadata only)
- **Content** — deck id + cards array (the actual card payload)
- Both keyed by `deckId`; fetch manifest for catalog/listing, fetch content when loading a deck for review.

**Placeholder image:** When `image` is omitted, the client uses a deterministic placeholder (e.g. `https://picsum.photos/seed/{deckId}/400/200` or internal `/api/placeholder/deck/{deckId}`) so deck cards in the content browser have consistent thumbnails.

---

## DeckManifest

| Field     | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| id        | string | yes      | Unique deck ID                                   |
| languageId| string | yes      | Learning language (ko, ja, etc.)                 |
| name      | string | yes      | Display name                                     |
| courseId  | string | no       | If set, deck is course-linked; null for community|
| version   | string | yes      | Cache-sync label (e.g. `"1.0"`). **Not** a multi-snapshot version index; not auto-bumped on every edit today. |
| cardCount | number | yes      | Number of cards (denormalized for listing)       |
| image     | string | no       | Cover/thumbnail URL; use placeholder if omitted  |
| ~~defaultEase~~| number | no       | **Deprecated / ignored.** Legacy SM-2 field; the FSRS-6 engine derives scheduling from per-card stability/difficulty and has no deck-level ease. Do not author. |
| locale    | string | no       | UI locale for names/descriptions (e.g. `en`, `ko`). Filter content by user's selected locale. |
| createdAt | string | no       | ISO timestamp                                    |
| updatedAt | string | no       | ISO timestamp                                    |

---

## Deck content

The card array format is unchanged from [flashcards README](./README.md). Content is keyed by deck id:

- **Manifest** → deck catalog, lightweight
- **Content** → full cards array, loaded when starting a session

---

## Deck types (by courseId)

| Type      | courseId | Unlock behavior                    |
|-----------|----------|------------------------------------|
| Course    | set      | Cards unlock when lesson completed |
| Community | null     | All cards available immediately    |

---

## SQLite schema

```sql
CREATE TABLE deck_manifests (
    id          TEXT PRIMARY KEY,
    language_id TEXT NOT NULL,
    name        TEXT NOT NULL,
    course_id   TEXT,
    version     TEXT NOT NULL DEFAULT '1.0',
    card_count  INTEGER NOT NULL DEFAULT 0,
    image       TEXT,
    default_ease REAL,   -- deprecated (legacy SM-2; ignored by FSRS-6 engine)
    locale      TEXT,
    created_at  TEXT,
    updated_at  TEXT
);

CREATE INDEX idx_deck_manifests_language ON deck_manifests (language_id);
CREATE INDEX idx_deck_manifests_course ON deck_manifests (course_id) WHERE course_id IS NOT NULL;

CREATE TABLE deck_content (
    deck_id TEXT PRIMARY KEY,
    cards   TEXT NOT NULL,
    FOREIGN KEY (deck_id) REFERENCES deck_manifests (id)
);
```

- `deck_manifests` — metadata for listing and version checks
- `deck_content` — JSON array of cards, one row per deck

---

## DynamoDB schema (implemented)

Table: `lingo_decks`. Per deck: `PK = DECK#<id>`, `SK = META` with manifest + `cards` JSON on one item. GSIs: `StatusLanguage-Index`, `AuthorUpdated-Index`. Planned S3 tiers: see [ADR 0002 — deck content storage & versioning](../../../../lingo-core/docs/adr/0002-deck-content-storage-and-versioning.md).

---

## API shape

- `GET /content/decks` — List manifests (optional: ?languageId=ko)
- `GET /content/decks/{deckId}` — Manifest + content (full deck)
- `GET /content/decks/{deckId}/manifest` — Manifest only
- `GET /content/decks/versions?ids=deck1,deck2` — Version map for cache sync
- `GET /content/decks/{deckId}/preview?limit=N` — Preview: manifest + first N cards (for content browser, card preview modal). Returns `{ manifest, cards }` with `cards` truncated to `limit` (default 6). Enables rich deck browsing without loading full content.
