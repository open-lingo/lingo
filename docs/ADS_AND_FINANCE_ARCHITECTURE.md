# Ads (AdSense) & finance transparency — architecture plan

How Open Lingo funds free tier with ads, optional premium (later), and the bottom “ad-funded %” bar.

**Status:** MVP framework in code; revenue numbers are manual or mocked until server-side sync jobs exist.

---

## Goals

| Goal | Approach |
|------|----------|
| Show ads only with consent | Existing cookie banner + `useAdsEnabled()` |
| Hide ads for premium (future) | `premiumActive` from Stripe subscription API |
| Collapsible / banner placements | `CollapsibleAdBanner`, `AdSlot`, layout slots |
| Real “% ad-funded” bar | **Not from the browser** — server `GET /finance/transparency` |
| Ad revenue data | **AdSense Management API v2** (server-only, OAuth) |
| Subscription revenue | **Stripe** webhooks + Billing API (server-only) |

---

## What Google provides (AdSense)

**There is no client-side JavaScript API for earnings.** The browser only loads ad tags; Google pays you and reports in AdSense / via backend API.

| API | Use |
|-----|-----|
| [AdSense Management API v2](https://developers.google.com/adsense/management/reference/rest) | `accounts.reports.generate` with metrics like `ESTIMATED_EARNINGS`, `PAGE_VIEWS`, date range |
| AdSense tag (`adsbygoogle.js`) | Display ads in the app after consent |

**Requirements for Management API:**

1. Google Cloud project + OAuth 2.0 (service account or user consent).
2. AdSense account linked to that project.
3. **Server-side only** — never put OAuth client secrets in the frontend.
4. Periodic job (cron / Lambda) e.g. daily: fetch last 30 days earnings → store in DB or cache → expose via `/finance/transparency`.

**Not suitable for real-time UI:** Reports can lag; use cached values + `updatedAt` in the API response.

---

## What Stripe provides (premium / payments)

| Piece | Use |
|-------|-----|
| [Stripe Checkout](https://stripe.com/docs/payments/checkout) | User buys “Premium” |
| [Customer Portal](https://stripe.com/docs/customer-management/portal) | Manage/cancel subscription |
| [Webhooks](https://stripe.com/docs/webhooks) | `customer.subscription.*`, `invoice.paid` → update `user.premium_until` |
| [Balance / Revenue](https://stripe.com/docs/api/balance_transactions/list) | Gross subscription revenue for transparency math |

**Frontend:** Stripe.js or Checkout redirect only; **all secrets and webhooks on lingo-core.**

---

## Funding transparency formula

```
ad_funded_percent = round( ad_revenue / (ad_revenue + premium_revenue) * 100 )
```

- If both are zero → hide bar or show “N/A”.
- Clamp 0–100; `premium_percent = 100 - ad_funded_percent`.
- Optional: separate “infrastructure” bucket later (donations, grants).

**MVP (implemented):**

- Env `FUNDING_AD_PERCENT` on API (manual override).
- Else default `40` with `source: "estimated"` until sync jobs exist.

**Phase 2:**

- Table `finance_snapshots` (`period_start`, `period_end`, `adsense_usd`, `stripe_usd`, `computed_at`).
- Admin-only refresh endpoint or nightly Lambda.

---

## Backend modules (lingo-core)

```
app/finance/
  schemas.py      # FundingTransparencyResponse
  router.py       # GET /finance/transparency (public)
  adsense_sync.py # (future) OAuth + reports.generate
  stripe_sync.py  # (future) webhook handlers live under app/billing/
```

**New env vars (future):**

```
# Manual override until sync
FUNDING_AD_PERCENT=40

# AdSense Management API (server only)
GOOGLE_ADSENSE_ACCOUNT=accounts/pub-xxxxxxxx
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REFRESH_TOKEN=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
```

---

## Frontend modules (lingo)

```
src/features/ads/
  config.ts              # VITE_ADSENSE_* slot IDs
  adsense.ts             # load script, pushAd()
  useAdsEnabled.ts       # consent + client + !premium
  AdSlot.tsx             # <ins class="adsbygoogle">
  CollapsibleAdBanner.tsx
  index.ts

src/shared/api/finance.ts
src/features/funding/useFundingTransparency.ts
```

**Env:**

```
VITE_ADSENSE_CLIENT=ca-pub-xxx
VITE_ADSENSE_SLOT_BANNER=1234567890   # create units in AdSense UI
VITE_ADSENSE_SLOT_INLINE=0987654321
VITE_ADSENSE_ENABLED=true             # master switch (default true if client set)
```

---

## Ad placement map (MVP)

| Placement | Component | When |
|-----------|-----------|------|
| Bottom collapsible | `CollapsibleAdBanner` | Logged-in app shell, consent, not premium |
| Inline / sidebar | `AdSlot` | Optional on community browse, flashcards hub |
| Landing | Off by default | Keep landing clean until AdSense approval |

Dismiss state: `sessionStorage` per session (not a cookie — no extra consent).

---

## Security checklist (baseline)

| Item | Status |
|------|--------|
| Auth0 JWT on protected routes | Done |
| `DEBUG=false` in production | **Required** — bypasses all auth |
| `CORS_ORIGINS` locked to prod domain | Configure in deploy |
| Security headers middleware | Added (`X-Frame-Options`, `nosniff`, etc.) |
| Rate limiting | **TODO** — add at API gateway or slowapi |
| AdSense / Stripe secrets server-only | Plan enforced above |
| No ad $ in frontend | Transparency API only |

---

## Suggested implementation order

1. **Done in this pass:** Ad UI framework, transparency API (manual %), security headers, startup warning if `DEBUG` in prod-like env.
2. **AdSense approval** + create ad units → set `VITE_ADSENSE_*`.
3. **Server job:** AdSense Management API → `finance_snapshots` → real %.
4. **Stripe:** products, webhooks, `premiumActive` → hide ads + update %.
5. **Optional:** Link “Premium” on funding meter to Checkout.

---

## References

- [AdSense Management API — reports.generate](https://developers.google.com/adsense/management/reference/rest/v2/accounts.reports/generate)
- [AdSense metrics (ESTIMATED_EARNINGS)](https://developers.google.com/adsense/management/reporting/dimensions_metrics)
- [Stripe subscriptions overview](https://stripe.com/docs/billing/subscriptions/overview)
