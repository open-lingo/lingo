# Task: Community Themes

**Context:** Theme system in `docs/agents/basecontext/FRONTEND_CONTEXT.md`. Local theme editor, Your themes, and mock Community themes already exist.

**Current state:** Mock community themes in `src/shared/theme/community-mock.ts`. **Preview** (temporary apply via `ThemeContext.setPreviewTokens`), **Add** (install to Your themes), and star work locally. Custom/installed themes are not overridden by auto light/dark fallback. No backend or CDN yet.

## Goals

1. **Backend API** — List community themes, fetch by ID; store theme JSON (S3 or DB)
2. **Distribution** — CloudFront (or similar) in front of theme storage for caching
3. **Client** — Replace mock with API fetch; validate schema; cache locally
4. **Publishing** — Moderated submit flow (user creates theme → submit → moderator approves → goes live)

## Requirements

### Backend
- `GET /themes` or `/api/core/themes/v1/list` — Paginated list (id, name, author, downloads, stars)
- `GET /themes/{id}` — Full theme JSON (validated schema)
- Storage: S3 bucket for theme JSON files; CloudFront distribution in front
- Optional: DB table for metadata (name, author, ratings); JSON in S3 keyed by ID

### Client
- Fetch theme list from API (or static JSON behind CloudFront)
- Fetch individual theme on install
- Schema validation before apply
- Cache installed themes locally (already have this)

### Publishing (later)
- User submits theme JSON
- Backend validates, stores in S3
- Moderation queue; approve → theme goes live

## Out of scope

- CDN manifests (removed) — Use CloudFront caching on the bucket/API responses instead
- Complex versioning — Start with single version per theme

## Acceptance criteria

- [ ] Backend: theme list endpoint (or static JSON at CloudFront URL)
- [ ] Backend: theme by ID endpoint (or S3/CloudFront URL pattern)
- [ ] Client: replace MOCK_COMMUNITY_THEMES with API fetch
- [ ] Client: install flow validates schema, stores locally
- [ ] CloudFront (or similar) caches theme responses

## Files

- `lingo-core`: new router `app/themes/` or extend community router
- `src/shared/theme/community-mock.ts` — Replace with API client
- `src/shared/theme/types.ts` — Schema for validation
- Infrastructure: S3 bucket, CloudFront distribution
