# MVP pages plan

**Purpose:** Page-by-page scope for what needs to be on screen at MVP. Active planning surface for the launch sprint. Broader project ideas (currency, cosmetics, search index, infra) live in [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md) and are explicitly **not MVP**.

**Last updated:** 2026-05-18

**Companion docs:** [PROJECT_STATE.md](./PROJECT_STATE.md) (what exists today) · [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) (2-week schedule) · [MVP_PRODUCTION_READINESS.md](./MVP_PRODUCTION_READINESS.md) (P0/P1 checklists) · [ARCHITECTURE_REVIEW.md](./ARCHITECTURE_REVIEW.md)

---

## Reading guide

Each page section follows the same shape:

- **State today** — what is shipped (with file refs)
- **MVP scope** — what must be on screen before launch
- **Deferred** — explicitly punted to backlog, link to entry

If a page isn't in this doc, it is either already launch-ready (per PROJECT_STATE) or flag-gated off (forum, leaderboard, contribute, stories).

---

## 1. Landing page

**State today:** Complete. `src/features/landing/LandingPage.tsx` (292 LOC) + companions. Hero, why-cards, features, "open by default" stats, CTA, footer.

**MVP scope:** No structural changes. Pre-launch pass only:

- [ ] Final product-name decision applied to copy + meta tags + footer
- [ ] Live `LANGUAGE_COUNT` / `COMMUNITY_DECK_COUNT` (currently hardcoded) wired to public endpoints, or accept hardcoded values as a launch trade-off
- [ ] Lighthouse pass (LCP/CLS) on mid-tier mobile — see roadmap Week 2 #18
- [ ] `robots.txt` + sitemap for landing/about/privacy/terms (roadmap #20)

**Deferred:** Hero A/B, video walkthrough, language-flag interactivity beyond "Soon" badge.

---

## 2. Home page

**State today:** `src/features/home/HomePage.tsx` (249 LOC) — three flows (guest, first-time, returning):

- Returning: h1 welcome + `ResumeBar` link card + `ProgressSummary` (streak / lessons / cards due / daily goal) + nav cards grid + `HomeActivityPanel` (mock forum threads, hardcoded new-deck count, leaderboard if flagged)
- First-time: `WelcomeBanner` + nav cards + `EmptyActivityNotice`
- Guest: static welcome card + nav cards

### MVP scope

**A. Dynamic welcome element with module overview badge inset**

- [ ] New `WelcomeCard` component replaces the plain `h1` + resume link pattern
- [ ] Header line: "Welcome back, {name}" for returning users; "Welcome to Lingo, {name}" for first-time
- [ ] **Inset module badge** showing: current module name, % complete, next-up lesson title, primary CTA → that lesson
- [ ] Pull progress from existing learn-state source (same one feeding `ProgressSummary`); no new backend endpoint
- [ ] Existing `ResumeBar` can collapse into the badge — don't ship both

**B. Community / activity right rail (taller bar)**

- [ ] Restructure `HomePage` from stacked sections to **2-column layout on `lg+`** (main content left, community rail right). Stacks on smaller breakpoints.
- [ ] Right rail content (top to bottom):
  1. Flashcards quick-link card (review queue count badge)
  2. Most-used practice feature link — see section C below
  3. Community recent posts (3 latest, link to community page; can show mock until forum flips on)
  4. New decks this week count (real, from explore deck list filtered by `createdAt`)
- [ ] Rail height extends with content; sticky-positioning optional
- [ ] When `community.tabs.discuss` flag is off, posts block becomes "Coming soon" placeholder rather than mock data

**C. "Most-used practice feature" link (dynamic)**

- [ ] Client-side usage counter in `localStorage` keyed by practice route (alphabet / particles / kanji / flashcards / etc.)
- [ ] Increment on practice page mount; store last-7-days rolling tally
- [ ] On home render, pick the top entry. **Default to alphabet** when tally is empty or tied.
- [ ] No backend endpoint. Pure frontend. See backlog entry for the eventual usage-API replacement.

**D. Shared primitives required**

Build before this work, per [ARCHITECTURE_REVIEW.md](./ARCHITECTURE_REVIEW.md):

- [ ] `<Modal>` (header + close + dividers + backdrop control)
- [ ] `<CenteredLoader>` (full-area Spinner, size/py props)
- [ ] `<EmptyState>` (title + description + optional action)

### Deferred (to backlog)

- Real usage-tracking API → see backlog "Usage telemetry"
- Real forum threads in rail → blocked on forum flag flip
- Banner / cosmetic display on the welcome card → see backlog "Profile & social economy"
- Personalized "what's new" feed beyond new-deck count

---

## 3. Learn page

**State today:** Complete. `src/features/learn/LearnPage.tsx` (386 LOC) + 16 components, full course map, progress, side-quests, dev panel.

**MVP scope:** No structural changes.

- [ ] Side-quest unlock conditions point at real lessons (currently one wired example)
- [ ] Stub side-quest cards either hidden or marked "Coming soon" so dead clicks don't ship

**Deferred:** Course outline redesign, multi-course switching UI beyond profile selector.

---

## 4. Community — Explore page

**State today:** `ContentBrowserPage.tsx` (1,054 LOC). Browse + subscribe works. Filters: language, type, sort, discover mode. `upvoteCount` mocked to 0 at line 46. Backend `GET /decks/admin` lists published decks.

### MVP scope

**A. All-languages / all-content-types view**

- [ ] Add "All languages" toggle in the language picker on explore (today defaults to current `:lang` context)
- [ ] Backend: add `GET /api/core/v1/decks/explore` (or extend existing endpoint with a `language=all` param) backed by `Status-Index` keyed on `approved` status, sorted by `updatedAt` — avoids per-language fan-out cost
- [ ] Content-type filter remains a client-side chip filter for MVP

**B. Approval-only listing**

- [ ] Explore endpoint returns only decks with `approval_status = approved` — see Deck Editor / Moderation sections
- [ ] Subscribed-tab unaffected (users keep access to anything they've subscribed to even if later unpublished)

**C. Like / dislike attributes (schema in, UI optional)**

- [ ] Add `likeCount: int`, `dislikeCount: int` to deck manifest schema; default 0. **Ship the schema even if the UI lands later** so counts accrue from day 1.
- [ ] Endpoint + UI: deferred — see backlog "Deck voting".

**D. Search (no new infra)**

- [ ] Add denormalized `searchTokens: string` to deck manifest (lowercase concat of `name | tags | description`) populated on upsert
- [ ] Client-side `contains` filter on the fetched page; bounded by the GSI pre-filter on language+type+status
- [ ] Real search index is **post-MVP** — see backlog "Explore search optimization"

### Deferred (to backlog)

- Vote UI + endpoints (schema only at MVP)
- Trending / popular ranking (today the `>5 upvotes` filter is a hardcoded mock)
- Report/flag content button → see backlog "Content reporting"
- OpenSearch / Algolia migration

---

## 5. Community — Deck Editor

**State today:** `DeckEditor.tsx` (1,091 LOC) — fully featured. Backend `POST /decks` accepts unlimited per-user decks (zero validation). No approval state on the deck model (`status: draft | published` only). Currently flag-gated off (`community.tabs.contribute: false`).

### MVP scope

**A. Per-user deck cap**

- [ ] Backend constant: `MAX_DECKS_PER_USER = 10` (non-approved decks)
- [ ] On `POST /api/core/v1/decks`: count author's existing decks where `approval_status != approved`. Return `403 Forbidden` with structured error when at limit.
- [ ] Frontend: surface the limit on the "New deck" CTA (disabled state + tooltip with current count); show count somewhere in the contributor view
- [ ] Approved decks **do not count** toward the cap — once approved, the slot frees up

**B. Approval workflow on the deck model**

- [ ] Add `approval_status: draft | pending_review | approved | rejected` to the deck schema (Pydantic + Dynamo + SQLite mirror)
- [ ] Add `rejected_reason: string?` (moderator-supplied, surfaced to author)
- [ ] Add `submitted_at`, `reviewed_at`, `reviewed_by` (moderator id)
- [ ] New endpoint: `POST /api/core/v1/decks/{id}/submit` — author action, transitions `draft → pending_review`. Validates deck has ≥1 card.
- [ ] Existing `PATCH .../status` (publish/unpublish) becomes **moderator-only**; author publish flow now goes through submit.

**C. Editor UX changes**

- [ ] Replace "Publish" button with **"Submit for review"** when deck is in `draft`
- [ ] When deck is `pending_review`: editor is read-only, banner explains state
- [ ] When deck is `rejected`: editor unlocked, banner shows `rejected_reason`, author can edit and re-submit
- [ ] When deck is `approved`: editor is read-only; "Unpublish" sends back to draft (returns to author's slot pool)

**D. Flag flip**

- [ ] `community.tabs.contribute: true` once A–C are in. Until then the page is reachable but flag-gated.

### Deferred (to backlog)

- Deck versioning / snapshot on submit (review a frozen revision)
- Auto-approval for "trusted creator" role
- Approval SLA / queue aging metrics
- Author analytics (subscribers, completions)

---

## 6. Admin — Moderation queue

**State today:** `AdminDecksPage.tsx` (262 LOC) lists all decks with publish/unpublish toggle + delete. Backend has `admin/router.py` (431 LOC) but **`has_admin_access()` returns `True` for everyone** (`lingo-core/app/auth/roles.py:32`). `moderation/schemas.py` has stubs for reports + action log but nothing is wired.

### MVP scope

**A. Fix admin access gate (P0 launch blocker)**

- [ ] Replace `has_admin_access()` placeholder with real check: Auth0 role claim, or DB role lookup against `ADMIN_ROLES` set
- [ ] Verify every `Depends(require_admin)`-protected route 403s for non-admins in a staging smoke test

**B. Moderation queue tab**

- [ ] Extend `AdminDecksPage` with a **Pending review** tab (default tab when there's queue depth)
- [ ] Filters: language, submitted-by, age
- [ ] Row actions per deck: **Approve**, **Reject (with reason)**, **Preview**
- [ ] Preview links to a read-only deck view with full card list

**C. Approve / reject endpoints**

- [ ] `POST /api/core/v1/admin/decks/{id}/approve` — sets `approval_status = approved`, `reviewed_at`, `reviewed_by`
- [ ] `POST /api/core/v1/admin/decks/{id}/reject` — body `{ reason: string }`, sets `rejected`, persists reason, returns deck to author's edit pool

**D. Lightweight audit trail**

- [ ] Persist approve/reject actions to a `moderation_log` Dynamo table (`PK = DECK#<id>`, `SK = ACTION#<ts>`)
- [ ] No UI for the log at MVP — it exists for forensics. Surface in admin v2.

### Deferred (to backlog)

- Report/flag content endpoint
- Moderator audit log UI
- Auto-hide after N reports
- Moderator role tier separate from full admin

---

## 7. Profile page (new)

**State today:** None. No `/me` or `/u/:username` route. Settings page exists but is not a public profile.

### MVP scope (minimal viable)

- [ ] New route `/:lang/u/me` (private — only logged-in user)
- [ ] Shows: display name, joined date, language(s) in progress, decks authored (approved only — public count), subscribed decks count
- [ ] Header area sized to **accommodate future banner + decoration + title slots**, but ship with placeholder/blank styling — schema additions are post-MVP

**Why ship even an empty profile page at MVP:** the home welcome card and community pages need a target for "@yourname" links, and shipping nothing forces a redesign later.

### Deferred (to backlog)

- Banner / decoration / title / tagline cosmetic slots → see backlog "Profile & social economy"
- Public profile route `/:lang/u/:username`
- Activity feed on profile
- Follow / followers

---

## 8. Page-level shared primitives (build first)

These do not exist yet and block several of the page items above. Build in this order:

1. [ ] `<Modal>` — header + close button + content + footer slots, backdrop click control
2. [ ] `<CenteredLoader>` — full-area Spinner, configurable size and vertical padding
3. [ ] `<EmptyState>` — title + description + optional CTA
4. [ ] `<RightRail>` (new for home + future profile) — sticky-optional column wrapper with `lg+` breakpoint switching

Place under `src/shared/components/ui/`. Tailwind-native, no MUI. Match existing component style.

---

## Out of scope for MVP pages

The following are explicitly **not** in the page-level MVP and live in [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md):

- Profile cosmetics (banners, decorations, titles, taglines) and **lingots** currency
- Deck like/dislike voting UI and endpoints (schema only at MVP)
- Search index (OpenSearch / Algolia)
- Forum / discuss
- Leaderboard
- Stories detail
- Vocab / grammar full pages
- Public user profile route `/:lang/u/:username`

Each has a dedicated backlog entry. Don't expand MVP scope to cover them without a roadmap change.
