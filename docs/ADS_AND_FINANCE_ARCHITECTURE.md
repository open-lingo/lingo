# Ads & finance architecture

How Open Lingo funds the free tier (AdSense), optional premium (Stripe, later), and the bottom **ad-funded %** bar.

| Doc | Purpose |
|-----|---------|
| [ADS_PLACEMENT.md](./ADS_PLACEMENT.md) | Where to put ads, components, env, backlog |
| [MVP_PRODUCTION_READINESS.md](./MVP_PRODUCTION_READINESS.md) | Launch checklist (legal, AdSense approval, Stripe) |

**Status:** Ad UI + consent + funding meter API exist in code. Dollar amounts are **manual/env** until server sync jobs run.

---

## Goals

| Goal | Approach |
|------|----------|
| Show ads only with consent | Cookie banner → `useAdsEnabled()` |
| Hide ads for premium (future) | `premiumActive` from subscription state |
| Display placements | `CollapsibleAdBanner`, `AdSlot` — see placement doc |
| Real “% ad-funded” bar | **Not in the browser** — `GET /api/core/v1/finance/transparency` |
| Ad revenue | [AdSense Management API v2](https://developers.google.com/adsense/management/reference/rest) (server-only) |
| Premium revenue | Stripe webhooks + Billing API (server-only) |

---

## AdSense: display vs earnings

**There is no client-side API for earnings.** The browser only loads `adsbygoogle.js` after consent.

| Surface | Role |
|---------|------|
| AdSense tag | Render units (`src/features/ads/`) |
| Management API | `accounts.reports.generate` → metrics like `ESTIMATED_EARNINGS` |

**Management API requirements:** Google Cloud + OAuth, AdSense account linked, secrets **only on lingo-core**, daily (or similar) job → cache → transparency endpoint. Reports lag; expose `updatedAt` in the API.

---

## Stripe (premium, later)

| Piece | Role |
|-------|------|
| Checkout / Customer Portal | Purchase and manage subscription |
| Webhooks | `customer.subscription.*`, `invoice.paid` → `user.premium_until` |
| Balance / revenue APIs | Premium share for transparency math |

Checkout/Elements on the frontend; secrets and webhooks on **lingo-core**.

---

## Funding transparency

```
ad_funded_percent = round( ad_revenue / (ad_revenue + premium_revenue) * 100 )
premium_percent = 100 - ad_funded_percent
```

If both revenues are zero → hide bar or show N/A.

**Today (implemented):**

- `lingo-core/app/finance/` — `GET /finance/transparency` (public, no auth).
- Env: `FUNDING_AD_PERCENT`, `FUNDING_PERIOD_LABEL`, `FUNDING_SOURCE` (`manual` \| `estimated` \| `live`).
- `lingo/src/features/funding/useFundingTransparency.ts` → `FundingMeter`.

**Phase 2:**

- Table `finance_snapshots` (`period_start`, `period_end`, `adsense_usd`, `stripe_usd`, `computed_at`).
- Nightly sync from AdSense + Stripe; set `FUNDING_SOURCE=live`.

---

## Code map

**lingo-core**

```
app/finance/
  schemas.py       # response models
  router.py        # GET /finance/transparency
  adsense_sync.py  # (future)
app/billing/       # (future) Stripe webhooks
```

**lingo**

```
src/features/ads/          # display framework
src/features/funding/      # funding meter data hook
src/shared/api/finance.ts  # types
```

Frontend AdSense env vars: see [README](../README.md#environment-variables) and [ADS_PLACEMENT.md](./ADS_PLACEMENT.md).

---

## Environment (server)

```bash
# Manual funding meter until sync jobs exist
FUNDING_AD_PERCENT=40
FUNDING_PERIOD_LABEL="Last 30 days"
FUNDING_SOURCE=manual   # manual | estimated | live

# Future — server only
GOOGLE_ADSENSE_ACCOUNT=accounts/pub-xxxxxxxx
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REFRESH_TOKEN=...

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
```

---

## Security (revenue-related)

| Item | Status |
|------|--------|
| Auth0 JWT on protected routes | Done |
| `DEBUG=false` in production | Required — bypasses auth when true |
| `CORS_ORIGINS` locked to prod | Configure at deploy |
| Security headers on API | Done (`X-Frame-Options`, `nosniff`, HSTS on HTTPS) |
| Rate limiting | TODO — gateway or slowapi |
| AdSense / Stripe secrets | Server-only |
| Revenue numbers in frontend | Transparency API only — never OAuth or raw earnings |

---

## Rollout order

1. **Done:** Ad framework, consent, transparency API (manual %), funding meter wired to API.
2. **AdSense approval** — policies, content volume, `ads.txt`, set `VITE_ADSENSE_*`.
3. **Page placements** — add `AdSlot` where you want (placement doc backlog).
4. **AdSense sync job** — Management API → snapshots → live %.
5. **Stripe** — products, webhooks, `premiumActive`, hide ads + update %.
6. **Optional** — Premium CTA on funding meter → Checkout.

---

## References

- [reports.generate](https://developers.google.com/adsense/management/reference/rest/v2/accounts.reports/generate)
- [AdSense metrics](https://developers.google.com/adsense/management/reporting/dimensions_metrics)
- [Stripe subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
