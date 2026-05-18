# Product backlog (ideas)

Living list of **planned work**, not launch blockers. MVP is **ad-supported only** (no Stripe billing); premium and live finance sync come later. SRS state is in good shape; **content progress** and **rewards** need design time.

**Also see:** [TODO.md](./TODO.md) · [FEATURES.md](./FEATURES.md) · [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) · [tasks/backend-progress-api.md](./tasks/backend-progress-api.md)

---

## MVP economics (decision)

| Choice | Notes |
|--------|--------|
| **No billing in MVP** | Free tier + optional ads after consent; no Checkout / subscriptions at launch |
| **Expect negative margin early** | Hosting, Auth0, API, and support cost more than AdSense until traffic scales |
| **Funding meter** | UX transparency only; `FUNDING_*` env / manual % until AdSense (+ later Stripe) sync |
| **Premium / Stripe** | Post-MVP — see [ADS_AND_FINANCE_ARCHITECTURE.md](./ADS_AND_FINANCE_ARCHITECTURE.md) |

---

## Launch-adjacent (next 2–4 weeks)

| Item | Notes |
|------|--------|
| **Polish home / landing** | Logged-in `/home` and `/landing` hierarchy, CTAs, continue learning, less clutter; align with final brand |
| **Product name** | Decide public name (keep “Open Lingo” vs rename); update meta, legal, footer, Auth0 app name |
| **CI/CD pipelines** | PR checks (lint, test, build); staging deploy on `main`; prod promote with approval; env injection for `VITE_*` + API |
| **Feature flags audit** | `public/feature-flags.json` — document deploy/invalidation in runbook |

---

## Admin & operations console

Today: `/admin` (users, deck/story lists) and deck `draft` / `published` + `PATCH .../status`. **Want a proper ops hub:**

| Capability | Idea |
|------------|------|
| **Feature toggles UI** | Edit or preview `feature-flags.json` (or server-backed flags later); per-env; audit who changed what |
| **User management** | Search users, roles (`user` → `moderator` → `admin`), suspend, view subscriptions/decks authored |
| **Finance knobs (pre-Stripe)** | Admin-set `FUNDING_AD_PERCENT`, period label, `FUNDING_SOURCE`; preview funding meter; placeholders for future payment-provider split fields |
| **Quick stats dashboard** | Record counts: decks (by status/language), cards, users, SRS rows, subscriptions, stories; optional 24h deltas |
| **Moderation queue** | List `pending_review` / draft community decks; approve → publish, reject → draft + reason |

Backend already has roles in `app/auth/roles.py` and admin routes in `app/admin/router.py` — extend rather than replace.

---

## User management & safety

| Item | Notes |
|------|--------|
| **Roles & permissions** | Extend Auth0 app metadata or DB roles; gate admin/moderator routes consistently |
| **User blocking** | Block user ↔ user (social) and/or platform ban (moderator); hide content, stop DMs/forum when those ship |
| **Content blocking / reports** | Report deck/card/thread; moderator actions; optional auto-hide after N reports |
| **Account lifecycle** | Delete exists; add suspend (read-only), export (GDPR), merge duplicate accounts (later) |

---

## Content moderation & staging

**Problem:** Contributors shouldn’t publish straight to community browse without review.

| Concept | Proposal |
|---------|----------|
| **Staging / temp decks** | Author works in `draft` or new status `pending_review` (“temp” workspace); not listed in public explore until approved |
| **Approval workflow** | Submit for review → moderator approves → `published`; reject with comment → stays draft |
| **Versioning** | Optional snapshot on submit so moderators review a fixed revision ([schema-versioning-migration](tasks/schema-versioning-migration.md)) |
| **Existing hooks** | `PATCH /decks/admin/{id}/status`, author `PATCH /decks/{id}/status`; align UI in Contribute + Admin |

See also [COMMUNITY_PLANNING.md](./COMMUNITY_PLANNING.md).

---

## Progress tracking (planning — SRS separate)

**SRS:** Working — card-level state, sync, review queue. **Don’t duplicate in progress API.**

**Content progress (needs design):**

| Track | Examples |
|-------|----------|
| **Lessons** | Started / completed / score; unlock next module |
| **Courses** | % complete; test-out |
| **Stories** | Read progress, exercise completion |
| **Vocab / particles** | Seen, practiced, mastered flags |
| **Alphabet** | Lesson steps completed |

**Later — rewards & gamification:**

- Streaks, XP, daily goals, badges (leaderboard depends on this)
- Tie to real progress API, not mocks in `mockProgress.ts`

**Next doc step:** Extend [backend-progress-api.md](./tasks/backend-progress-api.md) with lesson/story event model and idempotency; keep SRS on `/srs` routes only.

---

## Infrastructure (evaluate soon, not MVP-critical)

| Item | When | Notes |
|------|------|--------|
| **Caching** | Soon-ish post-launch | Reduce hot read paths (deck list, manifests, flags); CDN for static; API cache (Redis / CloudFront) for public browse — **no action for MVP** |
| **Read replicas / DAX** | When traffic warrants | After metrics show DB-bound endpoints |

Research: [local-cache-server-state-research](tasks/local-cache-server-state-research.md), [performance-budgeting](tasks/performance-budgeting.md).

---

## Revenue (post-MVP)

| Item | Notes |
|------|--------|
| AdSense approval + placements | [ADS_PLACEMENT.md](./ADS_PLACEMENT.md) |
| Live funding % | AdSense Management API job |
| Stripe / premium | Not MVP; hide ads + update % when ready |

---

## Brand & UX polish

- [ ] Home + landing polish (see launch-adjacent)
- [ ] Final product name + domain alignment
- [ ] SRS viewer redesign (partial)
- [ ] Card markdown editor
- [ ] `ja.json` UI locale

---

## Suggested epic order (after prod launch)

1. **CI/CD + staging/prod** (if not done at launch)
2. **Admin v2** — stats, flags UI, finance knobs
3. **Moderation** — `pending_review`, staging decks, approval UI
4. **Progress API v1** — lessons + course completion (no rewards yet)
5. **User management** — roles, ban/suspend, reports
6. **Home + naming** polish
7. **Caching** evaluation from metrics
8. **Rewards / leaderboard** (needs progress API)
9. **AdSense live** → **Stripe** when economics justify it
