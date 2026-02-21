# Deck manifest

The deck manifest is metadata about a flashcard deck. It is stored separately from deck content (cards) so we can list decks and check versions without loading card data.

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
| version   | string | yes      | Content version for cache sync (e.g. "1.0", hash)|
| cardCount | number | yes      | Number of cards (denormalized for listing)       |
| image     | string | no       | Cover/thumbnail URL; use placeholder if omitted  |
| defaultEase| number | no       | Initial ease for new cards (SM-2, 1.3–3.0). Omit = 2.5. Affects interval growth when the user first reviews a card. |
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
    default_ease REAL,
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

## DynamoDB schema (future)

**Base table (single-table):**
- PK: `DECK#ko-beginner`, SK: `META` — manifest attributes
- PK: `DECK#ko-beginner`, SK: `CONTENT` — cards (or separate attribute)

**GSI for listing by language:**
- GSI1PK: `DECK#LANG#ko`, GSI1SK: `ko-beginner` — list decks for a language

**GSI for course decks:**
- GSI2PK: `DECK#COURSE#mock-1`, GSI2SK: `ko-beginner` — list decks for a course

---

## API shape

- `GET /content/decks` — List manifests (optional: ?languageId=ko)
- `GET /content/decks/{deckId}` — Manifest + content (full deck)
- `GET /content/decks/{deckId}/manifest` — Manifest only
- `GET /content/decks/versions?ids=deck1,deck2` — Version map for cache sync
- `GET /content/decks/{deckId}/preview?limit=N` — Preview: manifest + first N cards (for content browser, card preview modal). Returns `{ manifest, cards }` with `cards` truncated to `limit` (default 6). Enables rich deck browsing without loading full content.
