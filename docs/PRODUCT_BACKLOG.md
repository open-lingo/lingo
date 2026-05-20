# Product backlog (ideas)

Living list of **planned work**, not launch blockers. MVP is **ad-supported only** (no Stripe billing); premium and live finance sync come later. SRS state is in good shape; **content progress** and **rewards** need design time.

**Also see:** [TODO.md](./TODO.md) · [FEATURES.md](./FEATURES.md) · [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) · [MVP_PAGES_PLAN.md](./MVP_PAGES_PLAN.md) · [ECONOMICS.md](./ECONOMICS.md) · [tasks/backend-progress-api.md](./tasks/backend-progress-api.md)

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

## Profile & social economy (post-MVP)

A purchasable cosmetic layer over user profiles. **Not MVP.** Profile page itself ships empty-shell at MVP — see [MVP_PAGES_PLAN.md](./MVP_PAGES_PLAN.md) §7.

| Capability | Idea |
|---|---|
| **Lingots currency** | In-app currency. Earn via lesson completion, streaks, deck approval. Never mutate user balance directly — write to a `lingot_transactions` ledger (`PK = USER#<id>`, `SK = TX#<ts>#<uuid>`, signed `delta`, `reason`) and update balance via `TransactWriteItems` for atomicity. |
| **Earn rules** | `EARN_RULES` constant; tunable without DB changes. Starting values: lesson +10, weekly streak +50, deck approved +100, first module finish +25. |
| **Cosmetics catalog** | `PK = COSMETIC#<id>`. Kinds: banner, decoration, title. Attrs: `price_lingots`, `art_url`, `rarity`. Static JSON in S3 also viable. |
| **Owned items** | `user_cosmetics`: `PK = USER#<user_id>`, `SK = COSMETIC#<id>`. |
| **Equip slots** | On user profile: `equipped: { banner_id?, decoration_id?, title_id? }`. PATCH endpoint validates ownership. |
| **Tagline** | Free-form text, ≤80 chars, sync profanity filter on write (not async approval — UX). |
| **Purchase endpoint** | `POST /me/cosmetics/{id}/purchase` — transactional balance check + ledger write + grant. |
| **Profile page** | Public route `/:lang/u/:username` displaying banner + decoration + title + tagline + deck list. |
| **Art pipeline** | S3 origin + CloudFront for banner / decoration assets; cache-busting via path versioning. |

**Risks:** race conditions on purchase (mitigate with Dynamo transactions); profanity filter false positives on taglines; cosmetic art asset management overhead.

---

## Deck voting (post-MVP UI, schema at MVP)

Like / dislike on community decks. Schema lands at MVP so counts accrue from day 1 (see [MVP_PAGES_PLAN.md](./MVP_PAGES_PLAN.md) §4-C). Endpoints + UI deferred.

| Concept | Proposal |
|---|---|
| **Per-user vote** | `PK = DECK#<id>`, `SK = VOTE#<user_id>`, `value: 1 \| -1`. Toggle/change/unset via single `PutItem`. |
| **Aggregate counters** | `likeCount`, `dislikeCount` on deck manifest. Atomic `UpdateItem` with `ADD`. Never recompute from votes on read. |
| **Endpoints** | `POST /decks/{id}/vote` with `{ value: 1 \| -1 \| 0 }`. `GET /decks/{id}` returns counts + `myVote`. |
| **Reconciler** | Weekly Lambda fixes drift from race conditions. |
| **Abuse** | One vote per user per deck enforced by SK uniqueness; vote rate-limited per IP via the same `slowapi` rules used app-wide. |
| **Ranking** | Replaces the current mocked `>5 upvotes` filter in `ContentBrowserPage`. Trending = simple `(likeCount - dislikeCount) * recency_decay` on the server, paginated. |

---

## Explore search optimization (post-MVP)

DynamoDB `Scan` for keyword search is the trap. MVP uses GSI + denormalized `searchTokens` + client-side `contains` (see [MVP_PAGES_PLAN.md](./MVP_PAGES_PLAN.md) §4-D). When traffic warrants a real index:

| Option | Cost | Notes |
|---|---|---|
| **DynamoDB Streams → Lambda → OpenSearch Serverless** | ~$20–$50/mo baseline | Real full-text search, AWS-native, control over schema and analyzers |
| **Algolia / Typesense Cloud** | ~$10–$50/mo | Better DX, search-as-you-type out of the box |
| **Postgres `tsvector` (if/when we add Postgres)** | Bundled cost | Only if we move some workload off Dynamo |

**Trigger:** explore traffic exceeds ~10k searches/day or the GSI+token approach produces user complaints about missing results.

---

## Deck chunking (backend infrastructure)

DynamoDB has a 400 KB per-item ceiling. Cards today live in a single JSON-stringified field on the deck manifest (`lingo-core/app/db/dynamo/deck.py`). 200+ card decks will cliff.

**Recommended: single-table chunks (Option A)** over the alternative of a separate `DeckCards` table:

- `SK = META` — manifest only, move `cards` out of this item
- `SK = CHUNK#0`, `CHUNK#1`, … — ~100–150 cards per chunk (tune to stay ~200 KB)
- Repo layer hides chunking: `_chunk_cards()` / `_merge_chunks()` — routers stay flat
- GSIs unchanged (`AuthorUpdated-Index`, `StatusLanguage-Index`)
- Atomic delete by `PK` (all chunks together)

**Migration:** dual-read (try chunks → fall back to `META.cards` if absent → re-chunk on next write); background job re-chunks existing decks over ~1 week; remove fallback once 100% migrated.

**Affected operations:** `upsert_deck`, `get_deck`, `get_decks_batch`, `add_cards_to_deck`, `delete_deck`, `duplicate_deck`. Cost: ~2–4× write cost on deck upsert; read cost equal or better.

**Status:** Required before approving any deck >150 cards. Considered MVP-adjacent — schedule alongside the moderation work in Week 1 of the launch sprint.

---

## CI/CD automation (Terraform + API deploy)

Today: zero GitHub Actions. Frontend builds locally. Backend deploys via manual `scripts/build-zip.sh` push to Lambda. No Terraform in either repo. See [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) Week 1 #13.

| Item | Notes |
|---|---|
| **Frontend CI** | `.github/workflows/lingo-ci.yml` — on PR: `npm ci && npm run test:run && npm run build`. On `main`: deploy `dist/` to S3 + CloudFront invalidation. |
| **Backend CI** | `.github/workflows/lingo-core-ci.yml` — on PR: `pip install -e .[dev] && pytest && ruff check`. On `main`: manual-approval gate then run existing `build-zip.sh` with `LAMBDA_ARN` from secret. |
| **Terraform repo** | New `lingo-infra/` sibling repo. Modules: Lambda, DynamoDB tables, API Gateway, S3 + CloudFront, WAF, Route53, Auth0 (provider). |
| **Terraform state** | S3 backend + DynamoDB lock table. Bootstrap manually once. |
| **Terraform CI** | `terraform-plan` on PR (comments plan output), `terraform-apply` via manual `workflow_dispatch` only — **do not auto-apply infra**. |
| **Secrets** | AWS Secrets Manager for Auth0 + AdSense + Stripe (when it lands). Inject at deploy via env, never commit. |
| **Test baseline** | Backend currently has 1 smoke test. Need 5–10 happy-path tests per router (users, srs, decks, admin) before gating PRs. |

---

## Infrastructure: dev environment

Today: no staging or dev environment. Single-path Lambda deploy goes straight to whatever the current `LAMBDA_ARN` points at. See [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) Week 1 #2.

| Need | Approach |
|---|---|
| **Separate Lambda + DynamoDB** | Tables prefixed `lingo-dev-*`, `lingo-staging-*`, `lingo-*`. Same Terraform module, different workspace/tfvars. |
| **Separate Auth0 tenant** | Dev tenant for ad-hoc testing; staging tenant shares prod tenant settings minus callback URLs. |
| **Separate CloudFront distribution** | Per environment. Avoids prod cache pollution during testing. |
| **Frontend env injection** | `.env.staging`, `.env.production`. Build per environment in CI matrix. |
| **Local dev** | Already works (uvicorn + SQLite + Vite). Don't change. |

---

## Infrastructure: rate limiting, WAF, DDoS

P0 launch blocker per [MVP_PRODUCTION_READINESS.md](./MVP_PRODUCTION_READINESS.md). Currently **nothing** stands between an attacker and the API.

| Layer | Item | Approx cost |
|---|---|---|
| **App** | `slowapi` on FastAPI for `/login`, `/srs/sync`, `POST /decks`, `POST /decks/{id}/cards`, `POST /decks/{id}/vote`, `POST /reports`. Per-user where authed, per-IP otherwise. | $0 |
| **API Gateway** | Stage throttle: 50 req/sec burst, 25 req/sec steady (tune from traffic data). Free with API Gateway. | $0 |
| **AWS WAF v2 on CloudFront + API Gateway** | One web ACL: AWS managed rules + rate-based rule (2000 req / 5min / IP). | ~$5 + $1/managed-rule + $0.60/M requests |
| **Reactive IP block list** | Empty `aws_wafv2_ip_set` referenced by the WAF web ACL. Add IPs via `terraform apply` during an incident. | Negligible |
| **CloudWatch alarms on WAF** | Alert on rate-rule firing >N/min — visibility into attempted abuse. | Cents/mo |
| **DDoS Shield Standard** | Auto-enabled on CloudFront / Route53 / WAF resources. Free. | $0 |

**Notes:** AWS WAF is per-request priced; under sustained attack costs can spike. The rate-based rule blocks fast, so cost exposure stays bounded. Shield Advanced ($3k/mo) is **not** justified for MVP.

---

## Infrastructure: CloudWatch cost monitoring

No budget alerts today. Single Stripe-less revenue stream means a runaway bill is the principal financial risk. See [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) Week 1.

| Item | Notes |
|---|---|
| **AWS Budgets** | `aws_budgets_budget` at $50 / $100 / $200 monthly thresholds. SNS → email. |
| **Cost anomaly detection** | `aws_ce_anomaly_monitor` + `aws_ce_anomaly_subscription` on Lambda, DynamoDB, WAF, CloudFront. Free service. |
| **Per-service alarms** | CloudWatch alarms on Lambda duration p95, Dynamo throttled requests, WAF blocked requests, CloudFront 5xx rate. |
| **Cost dashboard** | One CloudWatch dashboard with the four above metrics + estimated charges. Pin to ops Slack. |
| **Runbook entry** | "How to triage a cost spike" — link from dashboard. |

---

## Usage telemetry (post-MVP)

Drives the home-page "most-used practice" link beyond the MVP localStorage hack (see [MVP_PAGES_PLAN.md](./MVP_PAGES_PLAN.md) §2-C).

| Item | Notes |
|---|---|
| **Event model** | `PK = USER#<id>`, `SK = EVENT#<ts>#<uuid>`. Attrs: `kind` (practice/lesson/review/etc), `target`, `duration`, `result`. |
| **Ingestion** | Lightweight `POST /me/events` batch endpoint. Client buffers and flushes every N events / N seconds. |
| **Aggregation** | Nightly job rolls into per-user `usage_summary` items (7d / 30d windows). |
| **Privacy** | Tied to account; deleted on account deletion (existing flow). No third-party telemetry. |

---

## Suggested epic order (after prod launch)

1. **CI/CD + staging/prod** (if not done at launch) — see CI/CD section above
2. **Admin v2** — stats, flags UI, finance knobs
3. **Moderation** — `pending_review`, staging decks, approval UI (MVP ships baseline, v2 adds reports + audit UI)
4. **Deck voting** — endpoints + UI; schema already shipped at MVP
5. **Profile page (public)** + cosmetics MVP — empty profile shipped at MVP, fill in slots here
6. **Lingots economy** — currency, ledger, catalog, purchase flow
7. **Progress API v1** — lessons + course completion (no rewards yet)
8. **Usage telemetry** — replaces localStorage "most-used practice" tracking
9. **User management** — roles, ban/suspend, reports
10. **Home + naming** polish
11. **Search index** — OpenSearch / Algolia when explore traffic justifies
12. **Caching** evaluation from metrics
13. **Rewards / leaderboard** (needs progress API + lingots)
14. **AdSense live** → **Stripe** when economics justify it
