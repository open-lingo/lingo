# Task: External Content — Community-Curated Learning Materials

**Status:** Planned  
**See:** [COMMUNITY_RESOURCES_PLANNING.md](../COMMUNITY_RESOURCES_PLANNING.md)  
**Agent context:** [AGENT_CONTEXT_4_external-content.md](./AGENT_CONTEXT_4_external-content.md)

## Goal

Add an **External Content** tab in Community: a curated list of external links (YouTube, podcasts, websites) for language learning. Each item has multiple URLs (with platform icons auto-parsed from URL), **content type** (song, podcast, video, movie, etc.), **level** (new, beginner, intermediate, hard, advanced), content language, optional translation language.

## Phase 1 (MVP)

- [ ] New tab "External Content" in CommunityLayout
- [ ] Route `/:lang/community/external-content` → ExternalContentPage
- [ ] `parseUrlPlatform(url)` — auto-detect YouTube, Spotify, etc. for icons
- [ ] Mock data: 5–10 sample items (multiple links, variety of content types and levels)
- [ ] Page: cards with platform icons on links, content type badge, level badge
- [ ] Filters: content language, content type, level, translation language, skill
- [ ] Sort: Newest, Most upvoted, A–Z
- [ ] Search: client-side on title, description, link labels
- [ ] i18n keys for all strings

## Phase 2 (future)

- Backend API + DB
- "Add external content" form (real submit)
- Real upvotes
- Moderation

## Files

- `src/features/community/ExternalContentPage.tsx`
- `src/features/community/mockExternalContent.ts`
- `src/features/community/parseUrlPlatform.ts`
- `src/features/community/types.ts` — add types
- `src/App.tsx` — route
- `src/features/community/CommunityLayout.tsx` — tab
- `src/shared/i18n/locales/en.json`, `ko.json`
