# Community marketplace redesign — worktree report

Branch: `ui/community-marketplace`

## What changed (before → after)

**Before:** `/community/explore` was a flat deck *browser* — a faceted sidebar
(25% of the width) next to a content table, no creator presence, "0 results" on
an unseeded language, empty trending-tags rail. It read like an admin
spreadsheet, and "Subscribed" / "My decks" lived in the same tab strip as the
discovery surface, mixing two different user mindsets.

**After:** `/community/explore` is a sectioned, streaming-style **marketplace
home** (Netflix/Steam vibe): a hero with headline + search + quick pills + live
catalog metrics + language tiles, a **Featured spotlight**, a **Top
contributors** rail, a **New content** rail, **browse-by-language** rails, and a
"Browse all" entry at the bottom. Discovery and personal content are now
separate areas. Creator avatars render on every card and in the list view.

## Information architecture (discovery vs library split)

Primary nav (`CommunityDiscoveryLayout`): **Discover · Browse · Contributors**,
with a trailing **My library** link and the **New Deck** CTA.

| Route | Surface | Component |
|---|---|---|
| `community/explore` | Discovery home (rails) | `CommunityHomePage` |
| `community/browse` | Faceted "browse all" (sidebar kept) | `ContentBrowserPage` |
| `community/contributors` | Full contributors list | `ContributorsPage` |
| `community/library` | **Personal** area, tabbed | `LibraryPage` |

`community/library` (`CommunityLibraryLayout`) hosts **Subscribed** + **My
decks** as URL-driven tabs (`?tab=mine`; default unrepresented). The old
`community/subscribed` and `community/decks/mine` routes were removed (no
redirects per house rules); their page bodies were extracted to
`SubscribedBody` / `MyDecksBody` and now live inside the library.

## Section architecture (how new content types slot in)

The home composes from **`<ContentRail>`** (shared primitive: titled section,
optional see-all, `scroll` snap rail or `grid` layout) fed by a single
normalized list from **`useMarketplaceContent`**. To add a new content type
(course / quiz / external resource): extend the `MarketplaceItem` normalizer in
`useMarketplaceContent.ts` (one `for` loop per source) and the type already
carries a `kind` badge rendered by `MarketplaceCard` / `FeaturedHero`. No
bespoke fetch wiring or section markup per type — the rails iterate the same
shape. The type-badge model (DECK / STORY / COURSE) is already in place.

## Creator avatars

`useCreatorDirectory` resolves an opaque content `authorId` → public profile
(name + avatar) and is used by the home cards, the browse cards + list view, and
the contributors table. Uses the shared `<Avatar>` (image → initials → icon
fallback), so unknown/private authors degrade to initials gracefully.

## Backend: what exists vs. what's stubbed/needed

**Real endpoints used (no fabricated data shown as real):**
- `GET /decks/admin?status=published` — published community decks (carries
  `authorId`, `voteCount`, `cardCount`, `image`).
- `GET /stories/browse` — community stories.
- `GET /users/discover` — the only user *directory* keyed by `user_id`; powers
  creator-avatar resolution + the contributor derivation. (Total is small and
  returns `has_more:false`, so a single fetch covers the catalog today.)
- `GET /decks/:id/vote` + vote toggle — live upvote counts on cards.

**Gaps degraded honestly (UI built against a typed path; no fake content):**
- **No `featured` / curation flag** → the Featured rail derives from
  `voteCount` desc, with the learner's suggested language nudged up. When a real
  curation flag ships, sort on it.
- **No `/community/contributors` aggregate** → `useTopContributors` derives
  contributors from real authored-content signals (count + upvotes) joined to
  the discover directory. Authors not in the directory are never invented. The
  `Contributor` shape mirrors what such an endpoint would return.
- **No `GET /users/{id}` by id** → resolution goes through `discover`. When a
  `POST /users/batch` (ids → public summaries) lands, swap the query body in
  `useCreatorDirectory`; the `resolveCreator(id)` consumer API stays stable.
- **No download/install metric** → omitted (the old browser multiplied upvotes
  for a fake number; that was dropped, not carried forward).
- **No "collections / learning paths" backend** → the ChatGPT-suggested
  Collections section is intentionally not built (would require fabricating
  curated bundles). Left as a clean future rail.

## House style / conformance
- Tailwind tokens only, no hardcoded hex. lucide via `Icon` registry (added
  `compass`, `library`, `bookmark`). No emoji as UI affordances (language flags
  are authored catalog data).
- All strings via `t()`; 34 new keys added to **en + ko**.
- Every `useQuery` has explicit `staleTime`.
- New shared primitive: `ContentRail` (`shared/components/ui/`).
- All new components < 400 LOC; sections extracted.

## Verification
- `npx tsc --noEmit` clean.
- `npm run build` clean (pre-existing chunk-size warnings only).
- `npx vitest run` — **115 files / 1034 tests pass**. New tests:
  `CommunityHomePage.test.tsx` (rails + creator resolution + companion-deck
  exclusion + empty state), `LibraryPage.test.tsx` (URL-driven tab split).
- Screenshots (desktop + mobile): discover home, library, browse — all render
  end-to-end against the real backend.

## Screenshots
- `/tmp/community-before-explore.png` — before
- `/tmp/community-after-home.png` — after (full discover home)
- `/tmp/community-library.png` — separated library
- `/tmp/community-browse.png` — faceted browse-all (creator avatar visible)
- `/tmp/community-home-mobile.png`, `/tmp/community-library-mobile.png` — mobile
