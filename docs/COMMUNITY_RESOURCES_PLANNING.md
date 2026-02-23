# External Content — Community-Curated Learning Materials

**Status:** Planning  
**Scope:** A community-curated list of external links (YouTube, podcasts, websites, etc.) for language learning. Materials that *aren't* in Open Lingo format — e.g. "Simple Korean Podcast," "Japanese listening practice YouTube channel." Each item can have **multiple URLs** (e.g. YouTube + Spotify + website) with descriptions. Tracks **content language** and optional **translation language** where applicable.

---

## 1. What It Is

A **shared library of external content** where users can:
- **Browse** links to external learning materials (YouTube, podcasts, websites, articles, apps)
- **Add** recommendations with title, description, and **multiple URLs** — each URL can have its own description (e.g. "Main episodes" vs "Spotify mirror")
- **Upvote** to surface the best content
- **Filter** by content language, translation language (if set), type, skill

**Not** Open Lingo native content — external links open in a new tab. No subscription, no in-app playback. Discovery and curation only.

---

## 2. Placement in Community

**New tab:** "External Content" in the Community tabs.

**Current tabs:** Explore | Discuss | Contribute | Leaderboard  
**New:** Explore | **External Content** | Discuss | Contribute | Leaderboard

**Route:** `/:lang/community/external-content`

**Subtitle/intro:** "Community-curated links to podcasts, YouTube channels, websites, and more — great for listening and reading practice outside Open Lingo."

---

## 3. Data Model

### External Content Item (one resource, multiple links)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | UUID or slug |
| title | string | yes | e.g. "Simple Korean Podcast" |
| description | string | no | Overall blurb; why it's useful |
| **links** | Link[] | yes | **Array of URLs** — at least one. Each has url, label/description. Platform icon auto-derived from URL. |
| **contentType** | enum | yes | `song` \| `podcast` \| `text` \| `video` \| `movie` \| `tv_show` \| `article` \| `website` \| `app` \| `other` — searchable |
| **contentLanguageId** | string | yes | Language of the content itself (ko, ja, etc.) |
| **translationLanguageId** | string | no | If content is translated or has subtitles elsewhere — e.g. "en" for "English subs available" |
| **level** | enum | yes | `new` \| `beginner` \| `intermediate` \| `hard` \| `advanced` — difficulty |
| skill | enum? | no | `listening` \| `reading` \| `both` \| `other` — for filtering |
| submittedById | string | no | User who added it (if auth) |
| upvoteCount | number | yes | Denormalized; for sorting |
| createdAt | string | yes | ISO date |
| updatedAt | string | yes | ISO date |
| status | enum | yes | `published` \| `pending` \| `rejected` — for moderation |

### Link (per URL)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | yes | Full URL |
| label | string | no | Short label, e.g. "YouTube", "Spotify", "Website" |
| description | string | no | What this link is for, e.g. "Full episodes with transcripts" |

**Platform icon:** Parse URL to detect platform (YouTube, Spotify, Apple Podcasts, etc.). Use `getPlatformFromUrl(url)` → returns platform id for icon lookup. Label can override for display, but icon comes from URL parsing.

### Content type (searchable)

| Value | Label | Use case |
|-------|-------|----------|
| song | Song | Music, lyrics practice |
| podcast | Podcast | Audio episodes |
| text | Text | Articles, blogs, stories |
| video | Video | YouTube clips, short videos |
| movie | Movie | Full-length films |
| tv_show | TV Show | Drama, series episodes |
| article | Article | News, blog posts |
| website | Website | General site |
| app | App | Mobile/web app |
| other | Other | Misc |

### Level (difficulty)

| Value | Label |
|-------|-------|
| new | New |
| beginner | Beginner |
| intermediate | Intermediate |
| hard | Hard |
| advanced | Advanced |

### URL → Platform icon mapping

Parse URL host/path to detect platform. Use for link buttons in preview.

| URL pattern | Platform | Icon |
|-------------|----------|------|
| youtube.com, youtu.be | youtube | ▶️ or YouTube SVG |
| spotify.com | spotify | 🎧 or Spotify brand |
| podcasts.apple.com, apple.com/podcast | apple_podcasts | 🎙️ |
| open.spotify.com | spotify | same |
| netflix.com | netflix | Netflix icon if available |
| Default | website | 🔗 or generic link |

Implementation: `parseUrlPlatform(url: string): PlatformId`. Return `"youtube" | "spotify" | "apple_podcasts" | "netflix" | "website"` (or similar). Map to icon component or emoji.

### Example

```json
{
  "id": "ext-1",
  "title": "Talk To Me In Korean",
  "description": "Popular Korean learning podcast.",
  "links": [
    { "url": "https://youtube.com/ttmik", "label": "YouTube", "description": "Videos with subtitles" },
    { "url": "https://spotify.com/ttmik", "label": "Spotify", "description": "Audio episodes" }
  ],
  "contentType": "podcast",
  "contentLanguageId": "ko",
  "translationLanguageId": "en",
  "level": "beginner",
  "skill": "listening"
}
```

---

## 4. UI — External Content Page

### Layout

- **Header:** "External Content" + short intro
- **Filters (top):**
  - Content language (dropdown; default = user's learning language)
  - Content type (All, Song, Podcast, Video, Movie, etc.)
  - Level (All, New, Beginner, Intermediate, Hard, Advanced)
  - Translation language (optional: "Has English", "Has Korean", etc.)
  - Skill (All, Listening, Reading, Both)
  - Sort (Newest, Most upvoted, A–Z)
- **Search:** Text search on title, description, link labels
- **Add button:** "Add external content" — opens form (auth required)
- **List:** Cards in a responsive grid (1 col mobile, 2–3 desktop)

### Card design

Each card shows:
- **Title**
- **Description** (1–2 lines, truncated)
- **Content language** flag (e.g. 🇰🇷 Korean)
- **Translation language** badge if set (e.g. "English available")
- **Links** — list of link buttons. **Auto-pick platform icon** from URL (YouTube, Spotify, etc.) via `parseUrlPlatform()`. Show icon + label; tooltip for description.
- **Content type badge** (e.g. Podcast, Video)
- **Level badge** (e.g. Beginner)
- **Skill badge** (Listening, Reading) if set
- **Upvote count** ↑ 42
- **Submitted by** (optional)

### Empty state

"No external content yet for Korean. Be the first to add some!"

---

## 5. Contribution Flow

**"Add external content" form:**
- Title (required)
- Description (optional)
- **Content type** (required): Song, Podcast, Text, Video, Movie, TV Show, Article, Website, App, Other
- **Level** (required): New, Beginner, Intermediate, Hard, Advanced
- **Links** (required, at least one):
  - Repeatable: URL + label (e.g. "YouTube") + description (e.g. "Episodes with subtitles")
  - Platform icon auto-derived from URL on save/preview
  - "Add another link" button
- Content language (required)
- Translation language (optional)
- Skill (optional): Listening, Reading, Both, Other

**Auth:** Require login to submit. Guests can browse.

**Moderation (phase 1):** Auto-publish, or "pending" until reviewed. Start simple: auto-publish.

---

## 6. Backend

### API (lingo-core or extend community)

- `GET /api/core/external-content/v1` — List. Query params: `content_language`, `content_type`, `level`, `translation_language`, `skill`, `sort`, `search`
- `GET /api/core/external-content/v1/{id}` — Get one (for detail view)
- `POST /api/core/external-content/v1` — Create (auth required)
- `PATCH /api/core/external-content/v1/{id}` — Update (author or admin)
- `POST /api/core/external-content/v1/{id}/vote` — Upvote
- `DELETE /api/core/external-content/v1/{id}/vote` — Remove vote

### Storage

New table `external_content`. Nested `links` as JSONB or separate `external_content_links` table. Votes in separate table with denormalized count.

---

## 7. Phase 1 (MVP)

**Scope:**
- New tab "External Content" in Community
- Mock data for 5–10 sample items (some with multiple links) per language; include contentType, level
- **URL platform parsing** — `parseUrlPlatform(url)` utility; map to icons for link buttons
- **Content type** and **level** in data model; filterable
- Page: list, filters (content language, content type, level, translation language, skill), sort, search (client-side)
- Card layout with platform icons on links, content type badge, level badge
- "Add external content" button → form (mock submit or "Coming soon")
- Upvote: mock for phase 1

**No backend yet:** Use mock data in `mockExternalContent.ts`.

---

## 8. Phase 2

- Backend API + DB
- Real submit flow (with multiple links)
- Real upvotes
- Moderation (optional)

---

## 9. Phase 3 (Polish)

- Tags
- Thumbnail extraction
- Report / admin

---

## 10. Files to Create (Phase 1)

### Frontend
- `src/features/community/ExternalContentPage.tsx` — main page
- `src/features/community/mockExternalContent.ts` — mock data
- `src/features/community/types.ts` — add `ExternalContentItem`, `ExternalContentLink`, `ContentType`, `ExternalContentLevel` types
- `src/features/community/parseUrlPlatform.ts` — parse URL → platform id for icon lookup
- `src/features/community/components/PlatformIcon.tsx` — optional: icon component per platform
- `src/App.tsx` — add route `community/external-content`
- `CommunityLayout.tsx` — add External Content tab
- `src/shared/i18n/locales/en.json`, `ko.json` — new keys (externalContent.*, contentTypes.*, levels.*)
