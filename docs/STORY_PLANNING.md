# Story Editor & Reader — Planning Document

**Status:** Planning  
**Scope:** Community story content — editor, reader, "add word to deck," data structure, API, AI

---

## Executive Summary

We need: (1) a **story data format** with a **companion card pack** (deck) and embed syntax for cards, (2) a **story editor** for community creators, (3) a **reader** with "add word to deck" on hover/click, and (4) **API endpoints** for stories (CRUD, subscriptions). Stories reference cards by ID; card content lives in the deck. **Duplicate cards:** dedupe before add + "Find duplicates" in card manager.

---

## 1. Companion Deck Model (Recommended)

**Idea:** A story has a **companion card pack** (deck) alongside it. The story body references cards by ID using an embed syntax like `<card id="card-123">안녕하세요</card>` or `[card:card-123]안녕하세요[/card]`. Clicking a word shows the card's front/back and "Add to deck".

### Why This Works Well

| Benefit | Detail |
|---------|--------|
| **Reuse** | Same deck can back multiple stories. "Korean Greetings" pack → Story A, Story B. |
| **Single source of truth** | Card content lives in the deck. Story only references it — no duplicate word+meaning in body. |
| **Leverage DeckEditor** | Creators already build decks. Story vocab = a deck. Editor flow: create deck → create story → embed card IDs in text. |
| **Add to deck** | Card definition comes from companion deck. "Add" copies card to user's deck (or adds reference). |

### Story + Companion Deck Structure

```ts
type Story = {
  id: string;
  languageId: string;
  title: string;
  description?: string;
  /** The vocab pack for this story. All card IDs in body reference this deck. */
  companionDeckId: string;
  /** Body: paragraphs. Text can embed cards via syntax. */
  body: StoryBody;
};

// Embed syntax options:
// - [card:card-id]display text[/card]
// - [[card-id|display text]]
// - {card:card-id}display text{/card}
```

### Embed Syntax

**Option A: BBCode-style** — `[card:card-123]안녕하세요[/card]`
- Parser-friendly, explicit boundaries
- Display text can differ from card front (e.g. abbreviated)

**Option B: Wiki-style** — `[[card-123|안녕하세요]]`
- Compact
- `[[card-123]]` could default to card.front as display

**Option C: HTML-like** — `<card id="card-123">안녕하세요</card>`
- Familiar, works with existing HTML parsers if we're careful
- May conflict with markdown/HTML in body

**Recommendation:** `[card:cardId]display[/card]` — clear, easy to parse, no HTML conflicts.

### Duplicate Cards: Content Management

When users "add to deck" from multiple stories (or from story + flashcard review), the same logical card (same front+back) can end up in their deck multiple times.

**Mitigations:**

1. **Before add:** Check if user already has a card with same `front` (and optionally `back`) in the target deck. If yes, show "Already in deck" or skip.
2. **Card manager deduplication:** "Find duplicates" scans all cards across user's decks, groups by `front` (or `front+back`), lets user merge or delete duplicates.
3. **Content-based identity:** Two cards are "same" if `front` + `back` + `type` match. Normalise for comparison (trim, maybe case for some languages).
4. **Optional: card fingerprint:** Store `contentHash` (e.g. hash of front+back+type) to speed up dedupe checks.

**Card manager UI:** Tab or button "Find duplicates" → list of groups → "Merge" (keep one, delete rest) or "Remove duplicate".

### Dependency & Ownership

- Story **depends on** companion deck. If deck is deleted/private, story needs fallback (show plain text, or "card unavailable").
- Typical flow: **Story author owns the companion deck.** Create story → create "Story Vocab" deck → add cards → embed IDs in story. Deck is part of the story package.
- Alternative: Story could reference a **community deck** (e.g. "Uses K-Drama Greetings pack"). Then story + deck can have different authors. Need to handle: deck disappears, deck updated (new cards), permission.

**Phase 1:** Story author creates companion deck. 1:1. Simpler.

---

## 2. Data Structure: Per-Word vs Per-Sentence (Alternative: Inline)

*If we don't use companion deck, we can embed meanings inline. See below for comparison.*

### Option A: Per-Sentence Only (Simple)

```ts
paragraphs: [
  { sentences: [{ text: "안녕하세요", translation: "Hello" }] }
]
```

- **Pros:** Easy to author. Paste text + translation. Minimal storage.
- **Cons:** No per-word meaning → "add word to deck" requires a meaning. We'd need AI at read-time or a dictionary lookup.

### Option B: Per-Word/Segment (Rich)

```ts
paragraphs: [
  {
    segments: [
      { segment: "안녕하세요", meaning: "Hello", particleId?: "세요" },
      { segment: "저는", meaning: "I (topic)", particleId?: "는" }
    ]
  }
]
```

- **Pros:** Every word is clickable. Meaning + "add to deck" from stored data. No AI at read-time.
- **Cons:** Labour-intensive to author manually. Korean/Japanese tokenization is non-trivial.

### Option C: Hybrid (Recommended)

Support **both** in a single format. Creators choose granularity per story or per paragraph.

```ts
type StoryParagraph = {
  // Option 1: Simple — sentence + translation. No per-word add.
  sentences?: { text: string; translation?: string }[];
  // Option 2: Rich — segments with meanings. Per-word add works.
  segments?: { segment: string; meaning?: string; particleId?: string }[];
};

type StoryContent = {
  id: string;
  languageId: string;
  title: string;
  description?: string;
  body: StoryParagraph[];
  questions?: ComprehensionQuestion[];
};
```

**Rules:**
- If `segments` present: render clickable words. Hover/click shows meaning + "Add to deck".
- If only `sentences`: render sentence + translation below. No per-word add (or: "Add sentence to deck" if we want that).
- **Vocab lookup fallback:** Optional `vocab?: { [word: string]: { meaning, reading? } }` — a dictionary of words that appear in the story. For sentences-only stories, we can still support add-to-deck if the word is in `vocab`. Creator populates it or AI helps at authoring.

**Scalability:** Start with segments for rich stories. Add `vocab` later for "simple story + optional word lookup." Most community stories can be sentence-only initially; power users add segments.

### Comparison: Companion Deck vs Inline

| | Companion Deck | Inline Segments/Vocab |
|---|----------------|------------------------|
| **Card definition** | In deck; story references by ID | In story body |
| **Reuse** | Same deck → multiple stories | No reuse |
| **Authoring** | Create deck first, then story | Edit story body directly |
| **Deduplication** | Card lives once in deck; "add" copies. Dedupe in user's deck by content. | Same issue when adding to user's deck |
| **Dependency** | Story depends on deck | Self-contained |

**Recommendation:** Companion deck model. Better reuse, cleaner separation, leverages DeckEditor. Inline `meaning` can still be a fallback for segments without cardId (tooltip only, no add-to-deck).

---

## 3. "Add Word to Deck" — Embedding & UX

### With Companion Deck

Card content comes from the companion deck. Story body embeds card references: `[card:card-123]안녕하세요[/card]`. On click/hover:

1. Fetch card from companion deck (or from preloaded deck data)
2. Show tooltip: card front + back (+ note/reasoning if present)
3. "Add to deck" → copy card to user's chosen deck
4. **Dedupe check:** Before adding, check if target deck already has a card with same `front` (+ `back` for disambiguation). If yes, show "Already in deck" or skip.

### Hover vs Click

- **Hover:** Tooltip with meaning + "Add to deck" button. Fast. Good for discovery.
- **Click:** Same content, but persists tooltip until user dismisses. Better for mobile (no hover).
- **Both:** Hover shows tooltip; click toggles "pinned" state or opens a small popover. Match VideosPracticePage (click to add).

### Add to which deck?

- **Option A:** "Reading vocab" deck — auto-created per user, per language. All story-added words go there.
- **Option B:** User picks deck (dropdown). Requires deck list + append card API.
- **Option C:** Add to first subscribed deck, or prompt to create one.

Backend: Decks API has `GET /decks/{id}`, `PUT /decks/{id}`. We need `POST /decks/{id}/cards` or we fetch, append, put. Simpler: `PATCH /decks/{id}` with `{ addCards: [...] }`.

---

## 4. Translation Granularity — Summary

| Mode | Data | Add Word to Deck | Author Effort |
|------|------|------------------|---------------|
| Sentence | `sentences: [{ text, translation }]` | No (or sentence-level only) | Low |
| Segment | `segments: [{ segment, meaning }]` | Yes | High (manual) or AI-assisted |
| Hybrid | Both; optional `vocab` | Yes when segment/vocab present | Flexible |

**Recommendation:** Hybrid. Support sentence-only for quick stories; segment-level for rich, interactive ones. Optional `vocab` for sentence-only stories that still want some clickable words.

---

## 5. AI Usage

### Where AI Helps

| Phase | Use Case | Pros | Cons |
|-------|----------|------|------|
| **Authoring** | Given raw text + translation, AI segments and aligns meanings | Reduces creator work; rich stories feasible | Need API, review step, cost per story |
| **Authoring** | Given raw text only, AI generates translation + segments | Fully automated first draft | Quality varies; must review |
| **Read-time** | Word not in vocab → AI lookup meaning | No author work for unknowns | Latency, cost, rate limits |

### Recommendation

1. **No AI at read-time** for "add to deck". Meaning must be in story data or vocab.
2. **AI at authoring (optional):** Creator pastes text + translation (or text only). We offer "Generate word meanings" → AI returns segments/vocab. Creator reviews and edits. Stored in story. This is a **phase 2** feature.
3. **Phase 1:** Manual authoring only. Segments or sentences. Prove the UX first.

---

## 6. API Endpoints (lingo-core)

### Stories API (new)

Mirror the decks pattern:

- `GET /api/core/stories/v1` — List stories (my stories for contribute; browse for explore)
- `GET /api/core/stories/v1/admin` — List all (admin/browse, filter by status, language)
- `GET /api/core/stories/v1/{story_id}` — Get full story (manifest + content)
- `POST /api/core/stories/v1` — Create story
- `PUT /api/core/stories/v1/{story_id}` — Update story
- `PATCH /api/core/stories/v1/{story_id}/status` — draft → published

### Schemas

```ts
// Story manifest (metadata)
StoryManifest: { id, languageId, title, description, authorId, status, version, createdAt, updatedAt }

// Story content (body)
StoryContent: { id, body: StoryParagraph[], questions?: [...] }

// Full story = manifest + content
StoryResponse: StoryManifest & { body, questions }
```

### Subscriptions

Already supported: `content_type: "story"` in users API. Stories appear in ContentBrowserPage like decks. Subscribe → appears in "My content" / Stories hub.

### Add Card from Story

- **Option A:** `POST /api/core/decks/v1/{deck_id}/cards` — append card(s)
- **Option B:** `PATCH` deck with `addCards: [{ front, back, type: "word" }]`

---

## 7. Story Editor (Frontend)

### Location

- Contribute flow: `community/contribute` → Create → "New story" (like "New deck")
- Route: `community/contribute/create/story` and `create/story/:storyId`
- Reuse patterns from DeckEditor: StudioHeader, tabs, save/publish

### Editor Features (Phase 1)

1. **Metadata:** Title, description, language
2. **Companion deck:** Create new or link existing deck. Story vocab lives in this deck.
3. **Body editor:**
   - Write/paste story text
   - Select word/phrase → "Link to card" → pick card from companion deck → inserts `[card:id]text[/card]`
   - Or type embed syntax manually
4. **Preview:** Render as reader would (parse embeds, show clickable words)
5. **Save / Publish**

### Editor Features (Phase 2)

- AI: "Generate word meanings" → suggest cards to create in companion deck + embed
- Comprehension questions editor
- Import from file (e.g. JSON, or simple format)

---

## 8. Reader Updates (StoryDetailPage)

1. **Render body** — Parse paragraphs. For `[card:id]text[/card]` embeds: render as clickable span
2. **Card embeds:** Hover/click → fetch card from companion deck (or use preloaded) → tooltip with front/back + "Add to deck"
3. **Add to deck:** Copy card to user's deck. Dedupe check first (same front in target deck → "Already in deck")
4. **Comprehension questions** — below story, multiple choice
5. **Progress** — mark as read; persist (localStorage or API)

---

## 9. Implementation Phases

### Phase 1: Foundation (Companion Deck Model)
- [ ] Story data format: `companionDeckId` + body with `[card:id]text[/card]` embed syntax
- [ ] Stories API (CRUD) in lingo-core
- [ ] Story editor: body editor + card embed UI (pick from companion deck, insert)
- [ ] Reader: render body, parse embeds, show plain text for non-embed segments
- [ ] Wire subscriptions for stories (already exists; wire UI)

### Phase 2: Add Word to Deck
- [ ] Reader: click/hover on embedded card → tooltip with card front/back + "Add to deck"
- [ ] "Add to deck" — deck picker or default "reading vocab" deck
- [ ] Backend: append card to deck (new endpoint or PATCH)
- [ ] **Before add:** Check for duplicate (same front in target deck). Show "Already in deck" if found.
- [ ] **Card manager:** "Find duplicates" — group by front, merge/remove UI

### Phase 3: Polish
- [ ] Comprehension questions
- [ ] AI-assisted authoring (optional)
- [ ] Support inline `meaning` as fallback (tooltip only) for text without card embed

---

## 10. Open Questions

1. **Default deck for "add to deck":** One global "Reading vocab" deck per user per language? Or require user to pick?
2. **Add from story:** Copy card from companion deck to user's deck. Same card content — dedupe by front+back before adding. Link back to story? (e.g. `sourceStoryId` for analytics — optional)
3. **Story versioning:** Like decks? Or simpler (single version per story)?
4. **Companion deck lifecycle:** If story author deletes companion deck, story breaks. Options: (a) prevent delete if story references it; (b) story stores a snapshot of card content on publish; (c) show "unavailable" for broken refs.
5. **Card manager deduplication:** Group by `front` only, or `front+back`? For homographs (same word, different meaning), front+back. Add "Merge duplicates" and "Remove duplicate" actions.

---

## 11. Files to Create/Modify

### Data format
- `docs/dataformats/stories/README.md` — schema
- `docs/dataformats/stories/story.example.json`

### Backend (lingo-core)
- `app/stories/router.py` — CRUD
- `app/stories/schemas.py` — request/response
- `app/db/story_sqlite.py` or extend community repo
- `app/main.py` — include stories router

### Frontend
- `src/features/stories/StoryDetailPage.tsx` — reader with body, card embeds, add-to-deck
- `src/features/community/contribute/StoryEditor.tsx` — new
- `src/features/stories/data/types.ts` — StoryContent, companionDeckId, embed parsing
- `src/shared/api/stories.ts` — API client
- ContributePage, CreateTab — add "New story" entry
- App.tsx — route for story editor
- `src/features/flashcards/CardManagerPage.tsx` — add "Find duplicates" / merge UI
