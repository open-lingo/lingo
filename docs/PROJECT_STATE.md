# Open Lingo — project state

**Last updated:** 2026-05-16  
**Purpose:** Accurate snapshot for humans and agents. For launch tasks see [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md).

---

## Executive summary

Open Lingo is a language-learning SPA (**lingo**, Vite + React) with **lingo-core** (FastAPI). Core loop: **learn → lessons → flashcards (SRS) → settings**. Community deck browse/subscribe works; forum, contribute, and leaderboard are **feature-flagged off** for launch. Legal, landing/auth split, ads framework, and funding meter API exist; **live revenue** is post-launch.

---

## Launch-ready (verified in code)

### Auth & routing

- [x] Auth0 (`VITE_AUTH0_*`), `RequireAuth` on `/:lang/*`
- [x] `/` → logged-in `/home`, else `/landing`
- [x] Public: `/privacy`, `/terms`, `/about`, `/login`
- [x] Leaderboard route gated by `isLeaderboardEnabled(flags)` (default off)

### Legal & privacy

- [x] Privacy, Terms, About pages; `CookieConsent`; advertising consent before AdSense
- [x] Account deletion in Settings; `DELETE /api/core/v1/users/me`
- [x] `AccountPrivacySection` — cookie controls

### Learn & practice

- [x] Learn page, lesson flow (multiple step types)
- [x] **Practice hub** — `/:lang/practice` index → `PracticePage` (not only flashcards)
- [x] Flashcards: hub, review (`FlashcardTester`), card/deck managers
- [x] Study options (settings + deck manager); review URL filters / scope shortcuts
- [x] SRS: SM-2, localStorage, sync to API (`srsSync`, `SrsApi`)
- [x] Particles, alphabet (+ hub + lesson), kanji/components/videos pages (depth varies)

### Community & API

- [x] `ContentBrowserPage` — decks API, subscribe
- [x] `FlashcardsPage` — subscribed + course decks
- [x] `list_owned_manifests` on backend (efficient author listing)
- [x] Contribute / forum / admin / studio routes exist — **disable via flags** for launch

### Ads & funding (code only)

- [x] `features/ads/` — `AdSlot`, `CollapsibleAdBanner`, consent gating
- [x] Global banner: logged-in app routes, not marketing URLs
- [x] `GET /api/core/v1/finance/transparency` + `FundingMeter` (manual/estimated %)
- [ ] Live AdSense fills — needs Google approval + env
- [ ] Live % from AdSense/Stripe — needs sync jobs

### Backend (lingo-core)

- [x] Decks, users/subscriptions, SRS, community routers
- [x] Finance transparency router; security headers middleware
- [ ] Rate limiting — not in app yet
- [ ] Stripe / AdSense Management API — not wired

---

## Not launch-critical (stubs / backlog)

| Area | State | Notes |
|------|--------|--------|
| **VocabPage** | Stub | `tasks/vocab-page.md` |
| **Grammar** | Redirect / practice grammar partial | `tasks/grammar-page.md` |
| **StoryDetailPage** | Layout; placeholder content | `tasks/story-content.md` |
| **Leaderboard** | UI + mock data | Flag off |
| **Forum / contribute** | Implemented but immature | Flags off |
| **Content volume** | ~5 cards / language stubs | `korean-content`, `japanese-content` tasks |
| **Funding %** | API + env override | Not live Google/Stripe data |
| **User settings API** | Partial / local-first | `tasks/backend-user-api.md` |
| **Progress API** | Partial | `tasks/backend-progress-api.md` |
| **Auth 401 refresh** | Planned | `tasks/auth-session-strategy.md` |
| **ja.json UI** | Not started | `LOCALIZATION.md` |
| **`.env.example` in lingo/** | Missing | README documents vars; add file optional |

---

## Routes (abbreviated)

```
/                         → RootRoute (home or landing)
/landing, /home, /login, /logout
/privacy, /terms, /about
/:lang/*                  → RequireAuth
  learn, learn/lessons/:id
  practice                → PracticePage (index)
  practice/flashcards, …/review, …/cards, …/decks
  practice/stories, particles, alphabet, kanji, …
  vocab, grammar, speech-tune
  community/explore, external-content, contribute/*, discuss/*, leaderboard
  studio/decks/*
/admin/*                  → admin (operators)
```

Full tree: `src/App.tsx`.

---

## Feature flags (launch defaults)

See `public/feature-flags.json` — explore + deck browse **on**; leaderboard, discuss, contribute, stories, videos **off**.

---

## Task docs vs reality

| Task | Doc status | Reality (2026-05) |
|------|------------|---------------------|
| practice-hub | stub | **Routed** — `PracticePage` is practice index |
| homepage-ux | open in old index | **Done** — landing + guest patterns |
| srs-engine | — | **Done** |
| community-deck-preview | — | **Done** |
| community-content-wiring | — | **Done** for explore + flashcards |
| funding meter | “plug real %” | **Wired to API**; live revenue is phase 2 |
| legal / ads framework | — | **Done in code**; approval/env later |

---

## Planned epics (not built)

See [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md): admin v2, moderation/staging decks, blocking, progress API (content + rewards), CI/CD, home polish, product name, caching evaluation. **MVP: no billing.**

## Recommended reading order

1. [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) — 2-week plan
2. [MVP_PAGES_PLAN.md](./MVP_PAGES_PLAN.md) — page-by-page UI scope for launch
3. [ECONOMICS.md](./ECONOMICS.md) — pricing tiers, cost math, sustainability targets
4. [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md) — ideas & epics (incl. lingots, cosmetics, voting, search, infra)
5. [MVP_PRODUCTION_READINESS.md](./MVP_PRODUCTION_READINESS.md) — checklists
6. [TODO.md](./TODO.md) — checklist items
7. [tasks/README.md](./tasks/README.md) — individual specs  
