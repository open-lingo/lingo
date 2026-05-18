# Production roadmap (~2 weeks)

**Target:** Soft launch to real users with the **core learn + flashcards + settings** loop stable.

**MVP money:** **Ad-supported only** — no Stripe/billing. Expect hosting and API costs to exceed AdSense revenue at first. Live AdSense fills and real funding % are post-launch. See [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md) for admin, moderation, and progress epics.

**Last updated:** 2026-05-16

| Doc | Use |
|-----|-----|
| [MVP_PRODUCTION_READINESS.md](./MVP_PRODUCTION_READINESS.md) | Detailed P0/P1/P2 checklists |
| [PROJECT_STATE.md](./PROJECT_STATE.md) | What exists in code today |
| [TODO.md](./TODO.md) | Backlog by area |
| [ADS_PLACEMENT.md](./ADS_PLACEMENT.md) / [ADS_AND_FINANCE_ARCHITECTURE.md](./ADS_AND_FINANCE_ARCHITECTURE.md) | Ads & funding (after launch) |

---

## Launch scope (what “prod-ready” means)

### In scope for v1

- Auth0 login; app routes behind `RequireAuth`; logged-out users on `/landing`
- Learn path + lessons (ko/ja)
- Flashcards: review, deck manager, study options, SRS sync to API
- Community **explore + deck subscribe** (flags: explore on, discuss/contribute/leaderboard off)
- Settings, profile, legal pages, cookie consent, account delete
- Deployed API + SPA with HTTPS, monitoring, conservative feature flags

### Out of scope for v1 (keep flagged or stub)

- Leaderboard, forum, contribute tabs (mock or incomplete backends)
- Stories / videos / external content as primary flows (`feature-flags.json`)
- Stripe premium, live AdSense fills, real funding % from Google
- Vocab / grammar pages beyond stubs
- 30+ cards per language content push
- Data export (GDPR nice-to-have)

---

## Week 1 — Blockers & environment

**Goal:** Staging that mirrors prod; no auth bypass; core loop verified end-to-end.

| # | Task | Owner hint | Done when |
|---|------|------------|-----------|
| 1 | **Prod Auth0** — callbacks, logout URLs, audience, silent auth on real domain | Infra | Login/logout/refresh on staging URL |
| 2 | **Deploy staging** — SPA + `lingo-core`; env from secrets manager | Infra | `VITE_*` + API URL point at staging |
| 3 | **`DEBUG=false`**, **`CORS_ORIGINS`** = prod/staging origins only | Backend | No CRITICAL debug+CORS warning at startup |
| 4 | **HTTPS** — CDN + API TLS; HSTS on API (headers already in code) | Infra | Browser shows valid cert |
| 5 | **Feature flags audit** — confirm `public/feature-flags.json` matches launch scope | Product | Only explore + flashcard decks on in community |
| 6 | **SRS + settings in staging DB** — Dynamo/SQLite as prod; run full review + settings save | QA | Cards persist across refresh/devices |
| 7 | **Sentry** (or equivalent) — frontend + API, release version tags | Eng | Test error appears in dashboard |
| 8 | **`/health` + uptime check** | Infra | Alert if API down |
| 9 | **Rate limiting** — API gateway or `slowapi` on auth + write routes | Backend | Basic abuse protection |
| 10 | **`npm audit` / `pip audit`** — fix critical/high | Eng | CI or manual sign-off |
| 11 | **Legal prod config** — `VITE_LEGAL_CONTACT_EMAIL`; lawyer skim of privacy/terms | Product | Footer contact works |
| 12 | **Backups** — DB + assets; one restore drill | Infra | Documented restore steps |
| 13 | **CI/CD** — PR: lint, test, build; auto-deploy staging | Eng | Green checks on default branch |

**Exit criteria:** Staging URL usable by team; learn → lesson → flashcard review → settings; no mock leaderboard in nav (flag off).

---

## Week 2 — Hardening & launch

**Goal:** Production cutover; smoke tests; comms ready.

| # | Task | Done when |
|---|------|-----------|
| 15 | **Prod deploy** — same shape as staging; prod Auth0 + secrets | Live URL |
| 16 | **Home / landing polish** — pass on copy, layout, CTAs (name can be tentative) | Team sign-off |
| 17 | **Smoke test script** — login, learn lesson, 10-card review, subscribe deck, delete-account flow on staging then prod | Checklist signed |
| 18 | **Performance pass** — Lighthouse on `/landing` + `/home`; fix worst regressions | LCP/CLS acceptable on mid mobile |
| 19 | **Accessibility spot-check** — focus order on login, lesson, review; reduced motion | No blocking a11y issues |
| 20 | **SEO basics** — `robots.txt`, landing meta, sitemap for public routes only | Crawl public pages |
| 21 | **OSS notices** — minimal `THIRD_PARTY_NOTICES` or generate from lockfile | Linked from About/Settings |
| 22 | **Runbook** — deploy, rollback, “API down”, Auth0 misconfig | One page in repo or wiki |
| 23 | **Announce / support** — GitHub Discussions or email in About | Users know where to report bugs |

**Exit criteria:** Prod live; flags conservative; core loop works for ko + ja; monitoring green 24h.

---

## Post-launch (ordered backlog)

Not required for the 2-week launch unless you reprioritize.

| Phase | Items | Docs |
|-------|--------|------|
| **Ops** | Admin v2 (flags, users, stats, finance knobs); CI/CD hardening | `PRODUCT_BACKLOG.md` |
| **Safety** | Moderation queue, staging/temp decks, blocking, reports | `PRODUCT_BACKLOG.md`, `COMMUNITY_PLANNING.md` |
| **Progress** | Content progress API; then XP/streaks/rewards | `PRODUCT_BACKLOG.md`, `tasks/backend-progress-api.md` |
| **Stability** | 401 token refresh; structured logs without PII | `tasks/auth-session-strategy.md` |
| **Content** | Korean/Japanese expansion; real story text | `tasks/korean-content.md`, etc. |
| **Revenue** | AdSense approval + placements (**no Stripe in MVP**) | `ADS_*` |
| **Caching** | Evaluate when metrics show hot DB paths | `PRODUCT_BACKLOG.md` |
| **Polish** | Product name; home polish; `ja.json` | `PRODUCT_BACKLOG.md` |

---

## Feature flags at launch (current defaults)

File: `lingo/public/feature-flags.json`

| Flag | Launch value | Notes |
|------|----------------|-------|
| `community.tabs.explore` | `true` | Deck browse + subscribe |
| `community.tabs.leaderboard` | `false` | Mock data — keep off |
| `community.tabs.discuss` | `false` | Forum not ready |
| `community.tabs.contribute` | `false` | Creator flows admin-heavy |
| `practice.stories` | `false` | Placeholder content |
| `practice.videoTrainers` | `false` | Mock videos |

---

## Risk register

| Risk | Mitigation |
|------|------------|
| AdSense rejects thin SPA | Don’t block launch on ads; framework is consent-ready |
| SRS sync conflicts | Test multi-device on staging; document “last write wins” if needed |
| Auth0 misconfigured audience | Staging rehearsal + runbook |
| Scope creep (contribute/admin) | Flags off; admin routes only for operators |
| Content too thin for ko/ja | Launch with existing course + stub decks; label “beta” on landing |

---

## Weekly check-in template

1. Staging up? Auth + review + settings OK?
2. Any P0 from [MVP_PRODUCTION_READINESS.md](./MVP_PRODUCTION_READINESS.md) still open?
3. Flags still conservative?
4. Blockers for prod cutover?
5. Post-launch: pick **one** item from the backlog table above.
