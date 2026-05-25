# Flashcard data format

Canonical format for flashcard decks and related data. See example JSON files in this folder.

---

## Deck manifest vs content

Deck metadata (id, languageId, name, courseId, version) lives in the **deck manifest**. Card data lives in **deck content**. Both keyed by deck id. See [deck-manifest.md](./deck-manifest.md) and `deck-manifest.example.json`.

---

## Deck format (full deck = manifest + content)

See `course-deck.example.json` and `community-deck.example.json`.

### FlashcardDeck (combined view)

| Field      | Type   | Required | Description                                          |
|------------|--------|----------|------------------------------------------------------|
| id         | string | yes      | Unique deck ID (e.g. `ko-beginner`, `addon-kdrama`)  |
| languageId | string | yes      | Learning language (ko, ja, etc.)                     |
| name       | string | yes      | Display name                                         |
| cards      | Card[] | yes      | Array of cards                                       |
| courseId   | string | no       | If set, deck is course-linked; cards unlock by lesson |

### Card fields (all types)

| Field  | Type   | Description     |
|--------|--------|-----------------|
| image  | string | Full image URL. |

**Markdown:** The fields `front`, `back`, `note`, and `reasoning` support Markdown (e.g. **bold**, *italic*, lists, `![alt](url)` for inline images). Plain text renders unchanged.

### Card types

**word** -- Single vocabulary word with optional `parts` (segments for highlighting).

```json
{
  "id": "ko-1",
  "front": "안녕하세요",
  "back": "Hello / Good day",
  "type": "word",
  "note": "Polite greeting.",
  "reasoning": "안녕 = peace/wellness, 하다 = do...",
  "parts": [
    { "segment": "안녕", "meaning": "peace, wellness" },
    { "segment": "하", "meaning": "do (stem)" },
    { "segment": "세요", "particleId": "세요" }
  ]
}
```

**sentence** -- Full sentence with `words` for segment-level highlighting.

**other** -- Phrase, expression, or misc. Supports `definition`, `context`.

### CardSegment

| Field      | Type   | Description                     |
|------------|--------|---------------------------------|
| segment    | string | The text segment                |
| meaning    | string | Optional meaning for the segment|
| particleId | string | Optional; links to particle     |

---

## Lesson-card mapping (course decks)

See `lesson-card-map.example.json`. Maps which lessons unlock which cards.

- Key: `languageId`
- Value: `{ [lessonId]: cardIds[] }`
- When a lesson is completed, its cards become unlocked for practice and SRS.

---

## Images

`card.image` is always a full URL. Use as-is. Course content may use S3 signed URLs; community uses user-provided URLs.

---

## SRS state (per user, per card)

See `srs-state.example.json`. Stored in localStorage or backend; not in deck JSON.

- Cards with no state = new cards (due when introduced).
- `dueDate` (YYYY-MM-DD): when the card is next due.
- SRS only applies to **unlocked** cards for course decks.

---

## Deck types

| Type      | courseId | Unlock behavior                    |
|-----------|---------|------------------------------------|
| Course    | set     | Cards unlock when lesson completed |
| Community | not set | All cards available immediately    |

---

## Anki import (planned)

Import from Anki `.apkg` is **not implemented** yet. Architecture, scheduling migration, and client vs server decisions: **[anki-import.md](./anki-import.md)**.

Today, use **Upload deck** with Open Lingo JSON (see `community-deck.example.json`). After Anki import ships, the pipeline will be: `.apkg` → normalized `AnkiPackageJsonV1` → Open Lingo deck + optional SRS state.

---

## Relationship to other formats

- **Courses** ([courses/](../courses/)): Course-linked decks reference `courseId`. The lesson-card map ties card unlock to lesson completion within the course.
- **Lessons** ([lessons/](../lessons/)): Lessons specify `introducesCardIds` listing which flashcard IDs they unlock.
- **Progress** ([progress/](../progress/)): SRS state is per-user, per-card -- separate from deck definitions.
- **SRS backend** ([srs/](../srs/)): Storage for imported Anki scheduling mapped to `SRSCardState`.
