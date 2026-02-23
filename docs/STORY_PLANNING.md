# Story Editor & Reader — Planning Document

**Status:** Planning  
**Scope:** Community story content — editor, reader, "add word to deck," data structure, API, AI

---

## Executive Summary

We need: (1) a **story data format** with a **companion card pack** (deck) and embed syntax for cards, (2) a **story editor** for community creators, (3) a **reader** with "add word to deck" on hover/click, and (4) **API endpoints** for stories (CRUD, subscriptions). Stories reference cards by ID; card content lives in the deck. **Duplicate cards:** dedupe before add + "Find duplicates" in card manager.

---

## 1. Companion Deck Model (Recommended)

**Idea:** A story has a **companion card pack** (deck) alongside it. The story body references cards by ID using `[card:cardId]display[/card]` (display text required; no fallback to card.front). Clicking a word shows the card's front/back and "Add to deck".

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

// Embed syntax: [card:cardId]display[/card] — display required
```

### Embed Syntax

**Decision: BBCode-style** — `[card:cardId]display[/card]`

- `cardId` — ID of the card in the companion deck
- `display` — **required.** Explicit display text in the story. No fallback to `card.front` — keeps room for future markdown support in display.
- Parser-friendly, explicit boundaries, no HTML conflicts

Examples:
- `[card:card-123]안녕하세요[/card]`
- `[card:kdrama-2]진짜요?[/card]`

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

**Decision: My vocab deck.** A single auto-created deck per user, per language (`user-{id}-saved-vocab` or similar). All story-added words, "add to deck" from videos, and any manually saved vocab go there. User is implicitly subscribed. SRS works like any other deck.

- ~~**Option B:**~~ User picks deck — not chosen; adds complexity.
- ~~**Option C:**~~ Add to first subscribed deck — not chosen.

Backend: Create "My vocab" deck on first add if it doesn't exist. `PATCH /decks/{id}` with `{ addCards: [...] }` or `POST /decks/{id}/cards` to append. Dedupe by front+back before adding.

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
- Reuse: StudioHeader, save/publish logic, unsaved indicator, status badge
- **Different from DeckEditor:** Text-first, lighter weight, writing canvas feel

### Layout: Three-Pane (Balanced)

```
| Companion Deck | Story Body Editor (main) | Reader Preview |
```

- **Left:** Companion deck panel — card list (compact rows), search, "+ New Card", click card → quick preview
- **Center:** Story body editor — primary, large text area, minimal toolbar
- **Right:** Preview — parsed body, embedded words highlighted; **collapsible** for full-width editor

Stories are written, not "managed like cards." Deck = structured builder; Story = writing canvas. More whitespace, softer separators.

### "Link to Card" Affordance

- **Primary:** Floating toolbar on text selection — small bubble with "Link to card" → opens card picker
- **Secondary:** Slash command `/card` — opens picker (power users)
- **Fallback:** Toolbar button "Link to card"
- **No** right-click menu (too hidden)

### Card Picker UI

- **Not** a full modal — breaks flow
- Use **popover** or **side drawer** anchored to selection
- Compact rows: Front (bold), Back (subtle), Type tag
- Search — instant filter
- "+ Create new card" at bottom → opens **Compact Card Modal**
- If 100+ cards: virtualized list, infinite scroll (no pagination)

### Compact Card Modal

- **Purpose:** Create/edit cards inline while writing. Do not redirect to full DeckEditor.
- **Scope:** Cards in the linked companion deck only. No deck switching.
- **Fields (Phase 1):** Front (required), Back (required), Type (Word/Sentence), Note (optional), Image URL (optional, collapsed)
- **No:** Parts breakdown, reasoning editor, markdown — those stay in full DeckEditor
- **Pre-fill:** When linking from selection, pre-fill Front with selected text
- **After save:** Add to companion deck, insert `[card:newId]selected text[/card]`, close modal, stay in writing position
- **Edit mode:** Click linked word in preview → open same modal in edit mode
- **Power user link:** "Open in full deck editor →" inside modal
- **Reusable:** `<CardQuickEditor deckId cardId? onSave onCancel />` — independent of DeckEditor

### Empty State

- **Before companion deck linked:** Show "Step 1: Link or create a companion deck" with [Create New Deck] [Link Existing Deck]
- **Until `companionDeckId` exists:** Disable card linking, show info banner in editor

### Validation: Broken Card Refs

- If card deleted from deck: Preview renders `⚠ 학생 (card not found)`
- Editor: highlight broken embed, show inline warning
- Banner: "2 broken card references"

### Body Editor

- Plain `textarea` or `contentEditable` div
- Minimal controls: Link to card, Preview toggle
- No markdown toolbar yet. Text-first.

### Editor Features (Phase 2)

- AI: "Generate word meanings"
- Comprehension questions editor
- Import from file

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
