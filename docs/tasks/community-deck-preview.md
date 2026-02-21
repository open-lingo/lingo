# Community Deck Preview Modal

**Status: DONE** (2025-02-19)

## Goal

Make the deck preview modal a rich content browser: cover image, metadata sidebar, card list preview, and comments stub. Prepare for wiring to content backend and community ratings.

## Context

- `DeckPreviewModal` is used from `FlashcardsPage` when users click Preview on course decks or community packs.
- Current layout: image, title, search, card list, footer. No metadata sidebar or comments.
- Community ratings (upvotes/downvotes) are designed in `COMMUNITY_PLANNING.md` but not implemented — defer until backend is ready.

## Layout

```
+----------------------------+------------------+
|                            |  Creator / by    |
|        Cover image         |  Updated date    |
|                            |  Language        |
+----------------------------+  Card count      |
|  Deck name                 |  ↑ Upvotes       |
+----------------------------+------------------+
|  Card previewer (searchable list)              |
+-----------------------------------------------+
|  Comments (stub — coming soon)                 |
+-----------------------------------------------+
|  [Close]                    [Start review]     |
+-----------------------------------------------+
```

- **Image + name:** Full-width cover; deck name below.
- **Sidebar:** Metadata (creator, updated date, language, card count, upvotes when addon).
- **Card previewer:** Scrollable list of cards (front/back); search filter.
- **Comments:** Placeholder section — "Comments coming soon" or similar.

## Acceptance criteria

- [x] Layout matches diagram above (sidebar beside image+name).
- [x] Sidebar shows: creator (or "—" if unknown), updated date, language, card count.
- [x] For community addons: show upvote count in sidebar.
- [x] Card previewer unchanged (search + list).
- [x] Comments section stub with placeholder text.
- [x] All strings use i18n keys.
- [x] Subscribe/Unsubscribe button (API integration).

## Files

- `src/features/flashcards/DeckPreviewModal.tsx`
- `src/shared/i18n/locales/en.json`, `ko.json`

## Related

- Community ratings: `docs/COMMUNITY_PLANNING.md` (§ Community Content Ratings)
- Deck manifest: `docs/dataformats/flashcards/deck-manifest.md`
- Backend content API: `docs/tasks/backend-content-api.md`

## Todos (future)

- [ ] Wire deck preview to content backend `GET /content/decks/{id}/preview`
- [ ] Implement community ratings (separate `content_votes` table + API)
- [ ] Implement comments (threads linked to deck/addon via `forum_content_links`)
