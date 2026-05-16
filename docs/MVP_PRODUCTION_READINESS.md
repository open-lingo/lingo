# MVP production readiness (Open Lingo)

Living checklist for shipping the learner app to real users and eventually accepting revenue. Not legal advice — confirm with counsel and your jurisdiction.

**Related:** `public/feature-flags.json` (hide unfinished surfaces), `lingo-infra/` (deploy), Auth0 + Stripe when you add billing.

---

## P0 — Block launch without these

### Security & reliability

- [ ] **HTTPS everywhere** (TLS on CDN + API; HSTS in production).
- [ ] **Secrets only in env** — Auth0, API keys, Stripe, DB; never in git; rotate if leaked.
- [ ] **Auth0 production tenant** — correct callback/logout URLs, API audience, refresh/silent auth tested on prod domain.
- [ ] **CORS** — API allows only your web origin(s).
- [ ] **Rate limiting** — login-adjacent and write endpoints (decks, SRS sync, uploads).
- [ ] **Error monitoring** — Sentry (or similar) on frontend + backend with release tags.
- [ ] **Uptime / health** — `/health` on API; synthetic check or uptime robot.
- [ ] **Backups** — DB and object storage; tested restore once.
- [ ] **Dependency audit** — `npm audit` / `pip audit`; patch critical CVEs before launch.

### Legal & privacy (users in EU/UK/CA/CA-US states)

- [x] **Privacy Policy** — `/privacy` (no sale of data; Auth0; AdSense with consent; contact via `VITE_LEGAL_CONTACT_EMAIL` or GitHub).
- [x] **Terms of Service** — `/terms`
- [x] **About / contact** — `/about` + footer links
- [x] **Cookie / consent** — banner + Settings controls; AdSense loads only after consent (`VITE_ADSENSE_CLIENT`).
- [x] **Account deletion** — Settings → delete account; `DELETE /api/core/v1/users/me`; clears local data.
- [ ] **Data export** (nice-to-have for GDPR) — export settings/progress JSON.
- [ ] **Age** — if general audience, state minimum age (13+ typical in US); stricter if targeting children (COPPA).

### Product truth (MVP)

- [ ] **Feature flags** — ship with unfinished areas off (`feature-flags.json`: leaderboard, discuss, contribute, etc.).
- [ ] **Landing vs app** — logged-out users on `/landing`; app routes behind auth (`RequireAuth`).
- [ ] **No mock data presented as live** — leaderboard, XP, community stats labeled or hidden until real APIs exist.

---

## P1 — Revenue & ads (when you turn them on)

### Payments (Stripe is the usual choice for SaaS)

- [ ] **Stripe account** — business verified; live mode keys in prod only.
- [ ] **Products / prices** — free vs premium (or one-time); metadata for entitlements.
- [ ] **Checkout or Customer Portal** — hosted checkout or Elements; never store raw card data yourself.
- [ ] **Webhooks** — `checkout.session.completed`, `customer.subscription.*`, `invoice.paid/failed`; verify signatures; idempotent handlers.
- [ ] **Entitlements in app** — map Stripe subscription → user record; gate premium (no ads, extra features).
- [ ] **Cancel / upgrade flows** — link to Customer Portal or in-app; clear renewal date.
- [ ] **Tax** — Stripe Tax or manual nexus decision; invoices/receipts emailed.
- [ ] **Refund policy** — stated in Terms; process in Stripe Dashboard.

References: [Stripe integration checklist](https://stripe.com/docs/payments/checkout), SaaS launch checklists (webhooks + idempotency are the common failure mode).

### Google AdSense (if you use the funding meter / display ads)

AdSense is **not** a day-one MVP requirement; approval takes time and needs a content-rich public site.

- [ ] **Own domain** with **substantial original content** (Google often expects many quality pages; a SPA with thin routes may struggle).
- [ ] **Required pages** — Privacy Policy, About, Contact (linked in footer); Terms recommended.
- [ ] **Policy compliance** — no incentivized clicks, no ads on login-only screens without content, no copyrighted lesson text you don’t own.
- [ ] **ads.txt** — host at site root when approved.
- [ ] **CMP / consent** — if EU traffic, consent mode for personalized ads.
- [ ] **Separate “premium = no ads”** — don’t show AdSense to paying users; document in privacy policy.

References: [AdSense eligibility](https://support.google.com/adsense/answer/9724), [Publisher policies](https://support.google.com/adsense/answer/9335564), [Site readiness](https://support.google.com/adsense/answer/7299563).

### Open-source attribution (you ship a bundled web app)

- [ ] **LICENSE** at repo root — your project license (e.g. Apache-2.0 in `lingo/LICENSE`).
- [ ] **NOTICE or THIRD_PARTY_NOTICES** — list dependencies you **distribute** in the built JS bundle (not dev-only tools).
- [ ] **Generate from lockfile** — e.g. `license-checker`, `npm-license-crawler`, or CI step on `dist/`; review copyleft deps (GPL in frontend bundle may affect distribution).
- [ ] **Special attributions** — keep existing credits (e.g. KanjiVG on landing footer); add others as you integrate (fonts, audio, course content).
- [ ] **In-app “Open source” page** — link from Settings/Docs to GitHub + notices file.

References: [CNCF attribution guidance](https://github.com/cncf/foundation/blob/main/policies-guidance/recommendations-for-attribution.md), Apache [LICENSE/NOTICE how-to](https://infra.apache.org/licensing-howto.html).

---

## P2 — Governance & operations (small team / OSS)

### Project governance

- [ ] **CODE_OF_CONDUCT** — Contributor Covenant or similar in repo root.
- [ ] **CONTRIBUTING.md** — how to run app, PR expectations, CLA if needed.
- [ ] **SECURITY.md** — how to report vulnerabilities (email or GitHub private advisory).
- [ ] **MAINTAINERS / decision process** — who can merge, release, and handle incidents.
- [ ] **Issue / PR templates** — bug vs feature; link to Discord/forum if you use one.

### Open-source + commercial together

- [ ] **License clarity** — code vs content (decks/stories may be CC BY-SA from users); DMCA/contact for user uploads.
- [ ] **Trademark** — “Open Lingo” usage guidelines if others contribute branding.

### Observability & ops

- [ ] **Structured logs** on API; no PII in logs.
- [ ] **CI** — lint, test, build on PR; deploy from `main` with approval.
- [ ] **Staging environment** — same Auth0/API shape as prod; separate Stripe test mode.
- [ ] **Runbook** — deploy steps, rollback, “API down” comms.

---

## P3 — Polish before marketing push

- [ ] **Accessibility pass** — focus order, labels, reduced motion (you already have a setting).
- [ ] **Performance** — Lighthouse on landing + `/home`; code-split heavy editors.
- [ ] **SEO** — landing meta, `robots.txt`, sitemap for public pages only.
- [ ] **Support channel** — email or GitHub Discussions linked from app.
- [ ] **Status page** (optional) — for outages once you have paying users.

---

## Open Lingo–specific gaps (as of this doc)

| Area | Status | Notes |
|------|--------|--------|
| Leaderboard | Flag off | `community.tabs.leaderboard` in `feature-flags.json`; mock data |
| Forum / contribute | Flags off | Enable when moderated + backend ready |
| Payments | Not wired | Funding meter is UX placeholder |
| AdSense | Not wired | Needs policy pages + content volume |
| Privacy / Terms | Done (MVP templates) | Lawyer review + set `VITE_LEGAL_CONTACT_EMAIL` in prod |
| Real SRS / progress API | Partial | Confirm prod Dynamo/SQLite + sync |
| OSS notices | Manual | Automate from `package-lock.json` |

---

## Suggested launch order

1. **Auth + core loop** — learn, flashcards, subscribe to decks, settings sync.
2. **Legal pages + account delete** — even without payments.
3. **Prod deploy + monitoring** — feature flags conservative.
4. **Stripe premium** (if planned) — before promising “remove ads”.
5. **AdSense** — only after public content and policies; expect review delays.
6. **Enable flags** — leaderboard, discuss, contribute one at a time with real data.

---

## Enable leaderboard later

Set in deploy `public/feature-flags.json`:

```json
"community": {
  "tabs": {
    "leaderboard": true
  }
}
```

Redeploy or invalidate CDN cache so clients fetch the updated JSON.
