# Agent Context: External Content — Community-Curated Learning Materials

**Copy this entire document** and give it to the AI agent. It contains everything needed to implement the task.

---

## Task

Add an **External Content** tab to the Community section. A curated list of external links (YouTube, podcasts, websites, etc.) for language learning. Each item has multiple URLs with labels/descriptions, content type (song, podcast, video, movie, etc.), difficulty level, content language, and optional translation language. **URL parsing** auto-detects platform (YouTube, Spotify, etc.) for icons. All strings via i18n.

---

## Project context

- **Stack:** Vite + React, Tailwind, react-i18next
- **Routes:** Community at `/:lang/community/`. Add tab + route `community/external-content`
- **Lang path:** `useLangPath()` for links. `langPath("community/external-content")` → `/ko/community/external-content`
- **Language:** `useLanguage()` for current learning language. Filter by `language?.id`
- **i18n:** All strings via `t()`. Add keys to `en.json` and `ko.json`

---

## Data model

### ExternalContentItem

```ts
type ExternalContentItem = {
  id: string;
  title: string;
  description?: string;
  links: ExternalContentLink[];
  contentType: ContentType;       // required
  contentLanguageId: string;      // required
  translationLanguageId?: string;
  level: ExternalContentLevel;    // required
  skill?: "listening" | "reading" | "both" | "other";
  upvoteCount: number;
  createdAt: string;  // ISO
  updatedAt: string;  // ISO
};

type ExternalContentLink = {
  url: string;
  label?: string;
  description?: string;
};

type ContentType = "song" | "podcast" | "text" | "video" | "movie" | "tv_show" | "article" | "website" | "app" | "other";

type ExternalContentLevel = "new" | "beginner" | "intermediate" | "hard" | "advanced";
```

---

## URL platform parsing

Create `src/features/community/parseUrlPlatform.ts`:

```ts
export type UrlPlatform = "youtube" | "spotify" | "apple_podcasts" | "netflix" | "website";

export function parseUrlPlatform(url: string): UrlPlatform {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("spotify.com")) return "spotify";
    if (host.includes("podcasts.apple.com") || host.includes("apple.com") && u.pathname.includes("podcast")) return "apple_podcasts";
    if (host.includes("netflix.com")) return "netflix";
    return "website";
  } catch {
    return "website";
  }
}
```

Use this to pick an icon for each link. Map platform → emoji or icon: youtube=▶️, spotify=🎧, apple_podcasts=🎙️, netflix=🎬, website=🔗. Or use SVG/icons if you prefer.

---

## Content type and level

**Content types:** song, podcast, text, video, movie, tv_show, article, website, app, other

**Levels:** new, beginner, intermediate, hard, advanced

Add i18n keys:
- `externalContent.contentType.song`, `.podcast`, `.video`, etc.
- `externalContent.level.new`, `.beginner`, `.intermediate`, `.hard`, `.advanced`

---

## UI — External Content Page

### Layout

- **Header:** "External Content" + short intro
- **Filters (top row):**
  - Content language (dropdown; default = user's learning language)
  - Content type (All, Song, Podcast, Video, Movie, TV Show, Article, Website, App, Other)
  - Level (All, New, Beginner, Intermediate, Hard, Advanced)
  - Translation language (All, Has English, Has Korean, etc.) — optional
  - Skill (All, Listening, Reading, Both)
  - Sort (Newest, Most upvoted, A–Z)
- **Search:** Text search on title, description, link labels (client-side)
- **Add button:** "Add external content" (can show "Coming soon" for phase 1, or mock form)
- **List:** Cards in responsive grid (1 col mobile, 2–3 desktop)

### Card design

- **Title**
- **Description** (1–2 lines, truncated)
- **Content type badge** (e.g. Podcast, Video)
- **Level badge** (e.g. Beginner)
- **Content language** flag (e.g. 🇰🇷)
- **Translation language** badge if set (e.g. "English available")
- **Links** — buttons for each link. **Use `parseUrlPlatform(link.url)` to pick icon.** Show icon + label (or "Open" if no label). Tooltip for description. `target="_blank" rel="noopener noreferrer"`
- **Skill badge** if set
- **Upvote count** ↑ N
- **Submitted by** (optional)

---

## Mock data

Create `mockExternalContent.ts` with 5–10 items for ko and ja. Include:
- Items with multiple links (YouTube + Spotify)
- Variety of content types (podcast, video, song, article)
- Variety of levels (beginner, intermediate, advanced)
- Some with translationLanguageId set
- Mix of skills (listening, reading)

---

## Files to create/edit

| File | Action |
|------|--------|
| `src/features/community/ExternalContentPage.tsx` | **Create** — main page |
| `src/features/community/mockExternalContent.ts` | **Create** — mock data |
| `src/features/community/types.ts` | **Edit** — add `ExternalContentItem`, `ExternalContentLink`, `ContentType`, `ExternalContentLevel` |
| `src/features/community/parseUrlPlatform.ts` | **Create** — URL → platform for icons |
| `src/App.tsx` | **Edit** — add route `community/external-content` → ExternalContentPage |
| `src/features/community/CommunityLayout.tsx` | **Edit** — add External Content tab (after Explore, before Discuss) |
| `src/shared/i18n/locales/en.json` | **Edit** — add `externalContent.*`, `community.externalContent` tab key |
| `src/shared/i18n/locales/ko.json` | **Edit** — same keys, Korean translations |

---

## Community tab and route

**Tab order:** Explore | **External Content** | Discuss | Contribute | Leaderboard

**Path:** `community/external-content` — add to TAB_KEYS in CommunityLayout.

**Route:** In App.tsx, add under community children:
```tsx
{ path: "external-content", element: <ExternalContentPage /> }
```

**Active state:** Update `isActive` logic in CommunityLayout to include `pathname.includes("/community/external-content")`.

---

## Implementation approach

1. **Types** — Add to `community/types.ts` or new file. Export `ExternalContentItem`, `ExternalContentLink`, `ContentType`, `ExternalContentLevel`.

2. **parseUrlPlatform** — Create utility. Test with sample URLs.

3. **Mock data** — Build 5–10 items. Ensure variety.

4. **ExternalContentPage** — Similar structure to ContentBrowserPage. Filters at top, search, grid of cards. Each card renders links with platform icons from `parseUrlPlatform`.

5. **Routing** — Add route and tab.

6. **i18n** — Add all keys. Content type and level labels, page title, intro, empty state, filter labels, etc.

---

## Acceptance criteria

- [ ] New "External Content" tab in Community
- [ ] Route `/:lang/community/external-content` works
- [ ] Page shows cards with title, description, content type badge, level badge, content language, links
- [ ] Links use **platform icon from URL parsing** (YouTube, Spotify, etc.)
- [ ] Filters: content language, content type, level, translation language, skill — all work (client-side)
- [ ] Sort: Newest, Most upvoted, A–Z
- [ ] Search: client-side on title, description, link labels
- [ ] Mock data: 5–10 items with variety
- [ ] All strings use `t()`
- [ ] `npm run build` passes

---

## Conventions

- Tailwind for styling. Match ContentBrowserPage, Explore cards.
- Links open in new tab: `target="_blank" rel="noopener noreferrer"`
- Use `getLanguageConfig()` from `@/shared/domain/languageConfig` for language names/flags
- Follow existing community layout patterns
