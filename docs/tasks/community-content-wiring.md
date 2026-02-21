# Task: Wire Content API for Content Browser + Deck Subscriptions

**Status: DONE** (2025-02-19)

**Goal:** Use existing backend endpoints to power a simple content browser and deck subscription flow. No full-text search yet — use what we have. Replace with proper search later.

---

## Current State

### Backend (lingo-core)

**Decks API** (`/api/core/decks/v1`):
- `GET /decks` — List decks owned by current user (for My Content). Requires auth.
- `GET /decks/admin` — List all decks. Optional `?status=draft|published`. Requires auth. Use `status=published` for browseable content.
- `GET /decks/{deck_id}` — Get full deck (manifest + cards). Requires auth; 404 if draft and user is not author.
- `POST /decks` — Create deck.
- `PUT /decks/{deck_id}` — Update deck.
- `PATCH /decks/{deck_id}/status` — Author only.
- `PATCH /decks/admin/{deck_id}/status` — Admin approve/reject.

**Users API** (`/api/core/users/v1`):
- `GET /me/subscriptions?content_type=deck` — List user's subscriptions.
- `POST /me/subscriptions` — Add: `{ contentType: "deck", contentId: "<deck_id>" }`. Validates deck exists.
- `DELETE /me/subscriptions/{content_type}/{content_id}` — Remove.

### Frontend

**ContentBrowserPage** (`src/features/community/ContentBrowserPage.tsx`):
- Uses **mock data**: `getAllAddons()`, `getTrendingCardPacks()`, `getTrendingCourses()`, `getNewStories()` from `mockCommunity.ts`.
- Renders `CommunityAddon` cards with search, language filter, type filter.
- No API calls. Links go to flashcards/stories.

**FlashcardsPage** (`src/features/flashcards/FlashcardsPage.tsx`):
- Uses **local JSON** via `loadDeck.ts` (ko-beginner, ja-beginner, addon-kdrama, addon-particles, addon-jlpt-n5).
- Community packs from `mockCommunity` with `deckId` mapping.
- `DeckPreviewModal` for preview. No subscribe button.

**API clients**:
- `DecksApi` — `listMyDecks`, `listAdminDecks`, `getDeck`, etc.
- `UsersApi` — `getSubscriptions`, `addSubscription`, `removeSubscription`.

---

## What to Build

### 1. Content browser: fetch decks from API

**Option A (use existing):** Call `decks.listAdminDecks({ status: "published" })` to list browseable decks. Filter by `language_id` client-side for now (or add `?language_id=ko` to backend if supported — check `list_admin_decks`).

**Backend gap:** `list_admin_decks` does not support `language_id` filter. Add it:
```python
# In list_admin_decks: add language_id: str | None = Query(None)
# Pass to r.list_manifests(language_id=language_id, ...)
```

**Frontend:**
- Add `decks.listBrowseableDecks({ languageId?, status: "published" })` — can alias to `listAdminDecks` for now.
- In `ContentBrowserPage`, replace mock addon data for **flashcard-pack** with API-fetched decks.
- Map `DeckResponse` → UI card shape: `id`, `name`, `languageId`, `cardCount`, `image`, `description`, `status`.
- Keep mock for `course` and `story` for now (or show empty); focus on decks.
- Client-side search: filter by `name`, `description` (simple `.includes()`).
- Show loading and error states. Fall back to empty list or mock if API fails.

### 2. Subscribe to decks

- Add **Subscribe** / **Subscribed** button to deck cards in ContentBrowserPage and DeckPreviewModal.
- On Subscribe: `users.addSubscription({ contentType: "deck", contentId: deck.id })`.
- On Unsubscribe: `users.removeSubscription("deck", deck.id)`.
- Fetch `users.getSubscriptions({ contentType: "deck" })` to know which decks the user has. Store in state or React Query.
- Disable/loading state during subscribe/unsubscribe.

### 3. FlashcardsPage: show subscribed decks

- Fetch `users.getSubscriptions({ contentType: "deck" })`.
- For each subscribed `contentId`, fetch `decks.getDeck(contentId)`.
- Merge with course decks (ko-beginner, ja-beginner from local JSON or API).
- If deck fetch fails (404), optionally remove from subscriptions or show "unavailable".
- Community decks section: list subscribed decks from API. Keep fallback to mock/local for dev.

### 4. Deck preview: Subscribe from modal

- In `DeckPreviewModal`, add Subscribe/Subscribed button.
- Use same `users.getSubscriptions` + `addSubscription` / `removeSubscription` as ContentBrowserPage.

---

## Data Mapping

**DeckResponse** (from API) vs **CommunityAddon** (mock):
- `id` → `id` (use as contentId for subscriptions)
- `name` → `name`
- `languageId` → `languageId`
- `cardCount` → `itemCount`
- `image` → `image`
- `description` → `description`
- `status` → (published = browseable)
- `courseId` — if set, it's a course deck; if null, community deck.

**Subscription** shape: `{ contentType, contentId, createdAt }`.

---

## API Base URL / Auth

- `VITE_API_BASE_URL` (default `http://localhost:8000`).
- All deck and subscription endpoints require auth. Use `ApiProvider` + `useApi()`; ensure user is logged in for subscribe actions.
- Content browser can show decks without auth if we add a public browse endpoint later. For now, use `listAdminDecks` which requires auth.

---

## Files to Touch

**Frontend:**
- `src/features/community/ContentBrowserPage.tsx` — Replace mock with API, add subscribe.
- `src/features/flashcards/FlashcardsPage.tsx` — Use subscriptions + API decks.
- `src/features/flashcards/DeckPreviewModal.tsx` — Add subscribe button.
- `src/shared/api/decks.ts` — Optional: `listBrowseableDecks` alias or add `language_id` param.
- `src/features/flashcards/data/loadDeck.ts` — May need to fetch from API for subscribed decks; keep local JSON for course decks fallback.

**Backend (optional, small):**
- `lingo-core/app/decks/router.py` — Add `language_id` query param to `list_admin_decks` for filtering.

---

## Acceptance Criteria

- [x] ContentBrowserPage fetches published decks from `listAdminDecks({ status: "published" })` (or browse endpoint).
- [x] ContentBrowserPage filters by language (client-side or via API param).
- [x] Deck cards show Subscribe/Subscribed; subscribe calls `addSubscription`, unsubscribe calls `removeSubscription`.
- [x] FlashcardsPage shows user's subscribed decks (from `getSubscriptions` + `getDeck`).
- [x] DeckPreviewModal has Subscribe/Subscribed button.
- [x] Graceful fallback when API is unavailable (empty list, or keep mock).
- [x] No full-text search — simple client-side filter by name/description for now.

---

## Future (Out of Scope)

- Public browse endpoint (no auth).
- Full-text search DB and API.
- Dedicated content API router (`/api/core/content/v1`) for decks, addons, etc.
- Preview endpoint `GET /decks/{id}/preview?limit=6` for card preview in modal.
