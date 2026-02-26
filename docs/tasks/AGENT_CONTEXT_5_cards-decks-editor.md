# Agent Context: Cards, Decks & Editor — Format & Extension Guide

Quick reference for expanding the card/deck data format and editor. Target: another agent onboarding.

---

## 1. Card Format (`DeckCard` / `Flashcard`)

**Location:** `lingo/src/shared/api/decks.ts` (API types), `lingo/src/features/flashcards/data/types.ts` (internal types)

### Core fields (all card types)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | e.g. `card-123` |
| `front` | string | yes | Primary display (target language) |
| `back` | string | yes | Translation/answer |
| `type` | `"word" \| "sentence" \| "other"` | yes | Determines which optional fields apply |
| `note` | string | no | Extra context |
| `image` | string | no | Full image URL |
| `reasoning` | string | no | Etymology / explanation (Markdown) |
| `definition` | string | no | For `other` type |
| `context` | string | no | Example sentence, usage |

### Type-specific fields

- **`word`**: `parts?: CardSegment[]` — segments for highlighting, e.g. `[{ segment: "안녕", meaning: "peace" }, { segment: "하", meaning: "do" }]`
- **`sentence`**: `words?: CardSegment[]` — same structure, per-word breakdown
- **`other`**: uses `definition`, `context`; no `parts`/`words`

### `CardSegment`

```ts
{ segment: string; meaning?: string; particleId?: string }
```

**Markdown:** `front`, `back`, `note`, `reasoning` support Markdown. Plain text renders unchanged.

---

## 2. Deck Format

**Location:** `lingo-core/app/decks/schemas.py`, `lingo/src/shared/api/decks.ts`

### Deck manifest (metadata)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | e.g. `comm-abc123` |
| `languageId` | string | `ko`, `ja`, etc. |
| `name` | string | Display name |
| `description` | string | Optional |
| `image` | string | Cover URL |
| `courseId` | string? | If set = course deck; null = community |
| `status` | string | `draft` \| `published` |
| `cardCount` | number | Denormalized |
| `defaultEase` | number? | SM-2, 1.3–3.0 |
| `companionToStoryId` | string? | If set = story companion deck; excluded from community browse. In backend schemas + SQLite; add to `DeckResponse` in `decks.ts` when needed. |
| `cards` | Card[] | Full card array in response |

---

## 3. Story Embed Syntax

**Location (spec):** `lingo/docs/STORY_PLANNING.md`. Parser implementation (e.g. `parseStoryEmbeds.ts`) may live under `lingo/src/features/community/contribute/` or story feature when implemented.

```
[card:cardId]display[/card]
```

- `cardId` — ID in the companion deck
- `display` — Required display text (no fallback to `card.front`)

Example: `[card:card-123]안녕하세요[/card]`

---

## 4. Editor Components

### DeckEditor

- **Path:** `lingo/src/features/community/contribute/DeckEditor.tsx`
- **Payload:** `buildPayload()` (lines ~410–431) — maps `cards` to API shape
- **Card mode:** `simple` vs `segmented`; segmented shows `parts`/`words` editor
- **Fields sent:** `id`, `front`, `back`, `type`, `note`, `image`, `reasoning`, `definition`, `context`, `parts` (word), `words` (sentence)

### CardQuickEditor (Story Editor)

- **Path:** When present, likely `lingo/src/features/community/contribute/CardQuickEditor.tsx` or under story feature.
- **Scope:** Compact modal for create/edit in story flow.
- **Fields:** `front`, `back`, `type`, `note`, `image` — no `parts`/`words`/`reasoning` yet.

---

## 5. Where to Add New Fields

| Layer | Files |
|-------|-------|
| **API (frontend)** | `lingo/src/shared/api/decks.ts` — `DeckCard` interface |
| **API (backend)** | `lingo-core/app/decks/schemas.py` — cards are `list[dict]`; no strict card schema |
| **Internal types** | `lingo/src/features/flashcards/data/types.ts` — `FlashcardBase`, `FlashcardWord`, etc. |
| **DeckEditor payload** | `DeckEditor.tsx` — `buildPayload()` |
| **CardQuickEditor** | `CardQuickEditor.tsx` — form fields + `onSave` payload (when present) |
| **CardPreview** | `lingo/src/features/flashcards/CardPreview.tsx` — renders card |
| **FlashcardTester** | `lingo/src/features/flashcards/FlashcardTester.tsx` — review UI |

---

## 6. Backend Storage

- **SQLite:** `lingo-core/app/db/sqlite/deck.py` — `deck_manifests` (metadata) + `deck_content` (cards as JSON)
- **DynamoDB:** `lingo-core/app/db/dynamo/deck.py` — same structure
- Cards stored as JSON; no per-field schema in DB. Add fields in API/client; backend passes through.

---

## 7. Example Card (full)

```json
{
  "id": "ko-1",
  "front": "안녕하세요",
  "back": "Hello / Good day",
  "type": "word",
  "note": "Polite greeting.",
  "reasoning": "안녕 = peace, 하다 = do...",
  "parts": [
    { "segment": "안녕", "meaning": "peace, wellness" },
    { "segment": "하", "meaning": "do (stem)" },
    { "segment": "세요", "particleId": "세요" }
  ]
}
```

---

## 8. Checklist to Expand the Format

1. Add field to `DeckCard` in `lingo/src/shared/api/decks.ts`
2. Add to `FlashcardBase` or type-specific in `lingo/src/features/flashcards/data/types.ts`
3. Include in `DeckEditor.buildPayload()` if editable
4. Add UI in `DeckEditor` (and optionally `CardQuickEditor`)
5. Render in `CardPreview` / `FlashcardTester` if visible
6. Backend: no change needed (cards are `list[dict]`)
