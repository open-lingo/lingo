# MVP production readiness

Checklist for shipping to real users and turning on revenue. Not legal advice — confirm with counsel for your jurisdiction.

**Related:** [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) (**2-week schedule**) · [PROJECT_STATE.md](./PROJECT_STATE.md) · [ADS_PLACEMENT.md](./ADS_PLACEMENT.md) · [ADS_AND_FINANCE_ARCHITECTURE.md](./ADS_AND_FINANCE_ARCHITECTURE.md) · `public/feature-flags.json`

---

## P0 — Block launch

### Security & reliability

- [ ] **HTTPS everywhere** (TLS on CDN + API; HSTS in production).
- [ ] **Secrets only in env** — Auth0, API keys, Stripe, Google OAuth, DB; never in git.
- [ ] **Auth0 production tenant** — callback/logout URLs, audience, silent auth on prod domain.
- [ ] **CORS** — API allows only your web origin(s).
- [ ] **`DEBUG=false` in production** — API bypasses auth when debug is on.
- [ ] **Rate limiting** — login-adjacent and write endpoints (decks, SRS sync, uploads).
- [ ] **Error monitoring** — Sentry (or similar) on frontend + backend.
- [ ] **Uptime / health** — `/health` on API; synthetic check.
- [ ] **Backups** — DB and object storage; tested restore once.
- [ ] **Dependency audit** — `npm audit` / `pip audit` before launch.

API security headers are in place; rate limiting is still open.

### Legal & privacy (EU/UK/CA/US states)

- [x] **Privacy Policy** — `/privacy` (no sale of data; Auth0; AdSense with consent).
- [x] **Terms of Service** — `/terms`
- [x] **About / contact** — `/about` + footer
- [x] **Cookie / consent** — banner + Settings; ads only after advertising consent.
- [x] **Account deletion** — Settings; `DELETE /api/core/v1/users/me`; local data cleared.
- [ ] **Data export** — JSON export of settings/progress (GDPR nice-to-have).
- [ ] **Age statement** — minimum age in Terms if general audience.

Set `VITE_LEGAL_CONTACT_EMAIL` in production (or document GitHub Issues fallback).

### Product truth (MVP)

- [ ] **Feature flags** — unfinished surfaces off in `feature-flags.json`.
- [x] **Landing vs app** — logged-out → `/landing`; `/:lang/*` behind auth.
- [ ] **No mock data as live** — leaderboard / stats hidden or labeled until real APIs exist.

---

## P1 — Revenue (post-MVP; ads only at launch)

**MVP:** Ad-supported only — no Stripe. Plan for costs to exceed ad revenue initially ([PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md)).

### Stripe (premium) — not in MVP

- [ ] Stripe account verified; live keys in prod only.
- [ ] Products / prices and entitlements on user record.
- [ ] Checkout or Customer Portal; webhooks verified and idempotent.
- [ ] Cancel / upgrade flows; tax and refund policy in Terms.

See [ADS_AND_FINANCE_ARCHITECTURE.md](./ADS_AND_FINANCE_ARCHITECTURE.md) for webhook and transparency wiring.

### AdSense

**Code:** framework, consent, global collapsible banner, funding meter → transparency API. **Google:** approval, content volume, and `ads.txt` still required.

- [ ] **AdSense account approved** on production domain.
- [ ] **Substantial original content** — thin SPA routes often fail review.
- [ ] **Policy pages** linked in footer (done for MVP templates; lawyer review recommended).
- [ ] **`ads.txt`** at site root.
- [ ] **CMP / consent mode** if significant EU traffic and personalized ads.
- [ ] **Premium = no ads** when Stripe is live (`premiumActive`).

Implementation details: [ADS_PLACEMENT.md](./ADS_PLACEMENT.md).  
Google: [eligibility](https://support.google.com/adsense/answer/9724), [policies](https://support.google.com/adsense/answer/9335564).

### Open-source attribution

- [ ] **LICENSE** at repo root.
- [ ] **THIRD_PARTY_NOTICES** from lockfile / `dist/` bundle.
- [ ] **In-app link** to GitHub + notices (Settings or About).

---

## P2 — Governance & ops

- [ ] **CODE_OF_CONDUCT**, **CONTRIBUTING.md**, **SECURITY.md**
- [ ] **License clarity** — code vs user-generated decks/stories
- [ ] **Structured logs** without PII; CI on PR; staging env; deploy runbook

---

## P3 — Polish

- [ ] Accessibility, Lighthouse on landing + `/home`, SEO (`robots.txt`, sitemap), support channel

---

## Project status snapshot

| Area | Status | Notes |
|------|--------|--------|
| Privacy / Terms / cookies / delete | Done (MVP) | Lawyer review; prod contact email |
| Landing + auth gating | Done | `/landing`, `RequireAuth` on app routes |
| AdSense UI framework | Done in code | Real ads need approval + env |
| Funding meter | Wired | API returns manual/estimated %; live sync later |
| Stripe / premium | Not wired | Hide ads + real % need webhooks |
| Leaderboard | Flag off | `community.tabs.leaderboard` |
| Forum / contribute | Flags off | Enable with moderation + APIs |
| OSS notices | Manual | Automate from lockfile |
| SRS / progress in prod | Verify | Dynamo/SQLite + sync per environment |

---

## Suggested launch order

1. Auth + core loop (learn, flashcards, decks, settings sync).
2. Legal pages + account delete (done — keep maintained).
3. Prod deploy + monitoring; conservative feature flags.
4. Stripe premium **before** promising “remove ads”.
5. AdSense approval + env + optional page placements.
6. Enable community flags one at a time with real data.

### Enable leaderboard later

In deploy `public/feature-flags.json`:

```json
"community": {
  "tabs": {
    "leaderboard": true
  }
}
```

Redeploy or invalidate CDN cache for `feature-flags.json`.
