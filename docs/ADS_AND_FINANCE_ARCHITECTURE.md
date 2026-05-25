# Ads & finance architecture

How Open Lingo funds the free tier (AdSense), optional premium (Stripe, later), the bottom **ad-funded %** bar, and the **ad-density modulation** signal that quiets the UI when costs are already covered for the month.

| Doc | Purpose |
|-----|---------|
| [ECONOMICS.md](./ECONOMICS.md) | Unit economics, per-user cost model, revenue assumptions, tripwires |
| [ADS_PLACEMENT.md](./ADS_PLACEMENT.md) | Where to put ads, components, env, backlog |
| [MVP_PRODUCTION_READINESS.md](./MVP_PRODUCTION_READINESS.md) | Launch checklist (legal, AdSense approval, Stripe) |

**Status:** Ad UI + consent + funding meter API exist in code. Dollar amounts are **manual/env** until server sync jobs run. AWS cost integration and ad-density modulation are designed in this doc but not yet implemented.

---

## Goals

| Goal | Approach |
|------|----------|
| Show ads only with consent | Cookie banner → `useAdsEnabled()` |
| Hide ads for premium (future) | `premiumActive` from subscription state |
| Display placements | `CollapsibleAdBanner`, `AdSlot` — see placement doc |
| Real "% ad-funded" bar | **Not in the browser** — `GET /api/core/v1/finance/transparency` |
| Ad revenue | [AdSense Management API v2](https://developers.google.com/adsense/management/reference/rest) (server-only) |
| Premium revenue | Stripe webhooks + Billing API (server-only) |
| Infra cost | AWS Cost Explorer API → daily snapshot job → DB (server-only) |
| Reduce ad density when we're in the green | Compute `adDensityHint` server-side; frontend gates banner frequency |

The first three are shipped. Everything below the divider is the design for the next phase.

---

## AdSense: display vs earnings

**There is no client-side API for earnings.** The browser only loads `adsbygoogle.js` after consent.

| Surface | Role |
|---------|------|
| AdSense tag | Render units (`src/features/ads/`) |
| Management API | `accounts.reports.generate` → metrics like `ESTIMATED_EARNINGS` |

**Management API requirements:** Google Cloud + OAuth, AdSense account linked, secrets **only on lingo-core**, daily (or similar) job → cache → transparency endpoint. Reports lag ~1 day; expose `updatedAt` in the API and a `lagDays` hint in the JSON.

---

## Stripe (premium, later)

| Piece | Role |
|-------|------|
| Checkout / Customer Portal | Purchase and manage subscription |
| Webhooks | `customer.subscription.*`, `invoice.paid` → `user.premium_until` |
| Balance / revenue APIs | Premium share for transparency math |

Checkout/Elements on the frontend; secrets and webhooks on **lingo-core**. Premium net (after Stripe fees) is what counts toward the transparency math, not gross — see `revenue.premium.stripeNetUsd` below.

---

## Cost data: AWS Cost Explorer

Revenue alone isn't a number worth showing on a "% ad-funded" bar — it's only honest in context of what we spend. The cost side of the math comes from AWS.

### Primary source: Cost Explorer API (`ce:GetCostAndUsage`)

- **Granularity:** `DAILY` is what we want — gives us MTD totals and lets us trend the runway curve. `MONTHLY` is fine for the headline number but loses the "where in the month are we" signal that drives ad-density modulation.
- **Dimensions:** group by `SERVICE` for the `byService` breakdown (EC2 / RDS / S3 / CloudFront / Lambda / DynamoDB / WAF / CloudWatch / etc.). `USAGE_TYPE` is a second-level drill that we don't surface to users — useful only when debugging a cost spike.
- **Date range:** `Start = first day of current UTC month`, `End = today + 1 day` (Cost Explorer end-date is exclusive).
- **Latency:** Cost Explorer data lags **roughly 24 hours**. The most recent day is partial and subject to revision. The job records `updatedAt` and consumers must treat very-recent numbers as estimates.
- **Cost of calling it:** each `GetCostAndUsage` request is **~$0.01** (paginated requests count separately). This is small but real — at 100 calls/day it becomes ~$30/month, which is more than our entire AWS bill at MVP scale. Cache aggressively; one call per day is plenty.
- **Rate limits:** Cost Explorer has API throttling. Not a concern at our cadence, but burst-querying it from a request path would fail.
- See: [Cost Explorer GetCostAndUsage docs](https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_GetCostAndUsage.html), [Cost Explorer pricing](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/pricing/).

### When to graduate to Cost & Usage Reports (CUR)

CUR is the high-resolution, hourly-granularity, line-item-level cost feed. It's delivered as CSV/Parquet to an S3 bucket and queried via Athena. Use it when **any** of these become true:

- We need per-tag or per-resource cost attribution (e.g., per-feature cost — "lessons cost X, social costs Y").
- We hit Cost Explorer API cost ceilings (won't happen at this scale).
- We need historical data > 14 months (Cost Explorer caps there).
- Finance audit / external reporting requires line-item evidence.

Until then, Cost Explorer is strictly cheaper to operate. See [CUR overview](https://docs.aws.amazon.com/cur/latest/userguide/what-is-cur.html).

### Pricing API — NOT for historicals

`pricing.us-east-1.amazonaws.com` (`pricing:GetProducts`) returns **list prices**, not what we actually paid. It's useful for forecasting ("if we add a t4g.small, how much more?") but worthless for the transparency math. Mentioned here only to head off the confusion — Cost Explorer is the right tool for "what did this month cost us."

### AWS Budgets — alerts, not data source

Budgets fires alarms when spend crosses a threshold (e.g., monthly bill > $50 → SNS → email). Use it as the **out-of-band tripwire** in [ECONOMICS.md](./ECONOMICS.md). Don't use it as a data source for the transparency endpoint — Budgets exposes its own state but the cost math should come from one place (Cost Explorer).

### IAM scope — separate read-only principal

The Lambda runtime role must **not** have Cost Explorer permissions. A separate IAM user/role (with no other AWS access) holds the cost-read credentials. This way a compromised app runtime can't dump our billing data.

Minimum policy for the cost-reader:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "ce:GetCostAndUsage",
      "ce:GetCostForecast",
      "ce:GetDimensionValues"
    ],
    "Resource": "*"
  }]
}
```

`ce:GetCostForecast` is optional — useful if we ever surface "projected month-end cost" alongside MTD. `ce:GetDimensionValues` is needed to enumerate services dynamically (otherwise we hardcode the SERVICE list). No `ce:Update*` or `ce:Create*` — read-only.

Store the credentials in AWS Secrets Manager (or env vars on the cron host), accessed only by the snapshot job. **Never on the request path. Never in the Lambda runtime role. Never in the browser.**

### Cadence & caching

- **Snapshot job runs once daily** (cron, e.g., 02:00 UTC — after Cost Explorer's overnight refresh).
- Job persists rows to a `finance_daily_snapshot` table — one row per `(date, source)` pair (`aws_costs`, `adsense_earnings`, `stripe_revenue`).
- The transparency endpoint **reads only from the DB**, never calls Cost Explorer / AdSense / Stripe inline. Endpoint latency is whatever the DB takes (single-digit ms).
- If a snapshot fails, the endpoint returns the last successful row with `updatedAt` reflecting that — staleness is visible to the client, not hidden.

### Where this lives

| Concern | Location |
|---------|----------|
| Cost Explorer client | `lingo-core/app/finance/aws_costs.py` (planned) |
| AdSense client | `lingo-core/app/finance/adsense_sync.py` (planned) |
| Stripe revenue rollup | `lingo-core/app/billing/` (planned, after Stripe lands) |
| Daily cron entrypoint | `lingo-core/app/finance/snapshot_job.py` (planned) |
| Endpoint | `lingo-core/app/finance/router.py` (exists, MVP only) |
| Frontend hook | `lingo/src/features/funding/useFundingTransparency.ts` (exists) |
| Frontend types | `lingo/src/shared/api/finance.ts` (exists, will expand) |

---

## Transparency endpoint shape

The MVP response (in code today) is `{ adFundedPercent, premiumPercent, source, periodLabel, updatedAt }`. The "Phase 2" shape below is what the live job emits once cost data is wired. Both shapes coexist — old clients ignore extra fields, new clients fall back when fields are missing.

### `GET /api/core/v1/finance/transparency` — Phase 2 response

```jsonc
{
  "period": {
    "start": "2026-05-01",          // ISO date (UTC), first of current month
    "end":   "2026-05-31",          // ISO date (UTC), last of current month
    "updatedAt": "2026-05-25T02:14:00Z" // when the snapshot job last succeeded
  },

  "revenue": {
    "adsense": {
      "estimatedEarningsUsd": 312.40, // MTD, from AdSense Management API; "estimated" by Google
      "source": "adsense-management-api",
      "lagDays": 1                    // most recent day in this number lags ~1d
    },
    "premium": {
      "stripeNetUsd": 184.20,         // MTD net (gross minus Stripe fees)
      "subscriberCount": 47           // active paid subs as of updatedAt
    }
  },

  "costs": {
    "aws": {
      "totalUsd": 38.55,              // MTD, sum of byService
      "byService": {
        "EC2":        0.00,
        "Lambda":     6.20,
        "RDS":        0.00,
        "DynamoDB":   4.10,
        "S3":         0.85,
        "CloudFront": 1.40,
        "WAF":        8.00,
        "CloudWatch": 2.10,
        "Other":     15.90            // bucket for services below display threshold
      }
    },
    "thirdParty": {
      "auth0":  0.00,                 // free tier today; non-zero post-7.5k MAU
      "openai": 0.00,                 // see ECONOMICS.md — we don't add LLM-per-request features
      "other":  0.00
    }
  },

  "derived": {
    "adFundedPercent": 63,           // see formula below; integer 0..100, or null if no revenue
    "monthRunwayCovered": true,      // (revenue.total >= costs.total) MTD
    "adDensityHint": "reduced"       // "high" | "normal" | "reduced" — see modulation section
  },

  // Back-compat fields (still emitted alongside the new shape)
  "adFundedPercent": 63,
  "premiumPercent":  37,
  "source": "live",                  // "manual" | "estimated" | "live"
  "periodLabel": "May 2026",
  "updatedAt": "2026-05-25T02:14:00Z"
}
```

### Field semantics

- **All money values are USD dollars (decimal, two places).** Not cents. We're not doing financial math in the frontend, just rendering — picking dollars avoids both the "divide by 100" footgun and the "Number precision on cents-as-int" footgun simultaneously. Backend computes the integer `adFundedPercent` so frontend doesn't repeat the rounding choice.
- **`period.updatedAt`** is the `created_at` of the snapshot row, not the timestamp of any single upstream API call. Cost Explorer and AdSense lag is rolled into this single signal.
- **`revenue.adsense.lagDays`** is the worst-case lag of the underlying source. Useful for a `<small>data lags Nd</small>` annotation in the UI.
- **`revenue.premium.stripeNetUsd`** is **net** — gross minus Stripe fees — because the maintainer doesn't keep the fees. See [ECONOMICS.md](./ECONOMICS.md) for the fee math. This is the honest number for the "% ad-funded" denominator.
- **`costs.aws.byService.Other`** is everything below a display threshold (e.g., < $1/mo). Keeps the breakdown legible.
- **`derived.adFundedPercent`** = `round( adsense / (adsense + premium) * 100 )`, where `adsense` and `premium` are the dollar fields above. **Returns `null` when both revenues are 0** — the UI hides the meter rather than showing 0% or 100%. (See open question below: should the denominator be revenue, or should costs anchor it?)
- **`derived.monthRunwayCovered`** = `total_revenue >= total_costs` for the period MTD. Boolean; the modulation rule below uses a stricter threshold.
- **`derived.adDensityHint`** is the only field that drives client behavior beyond display. See next section.

### Auth & caching

- **Public, unauthenticated** (consistent with the existing endpoint). No PII, no per-user data, identical response for every caller.
- **Cache-Control: `public, max-age=3600`** (one hour). Browsers and CDNs hold the response for an hour; the actual data refreshes once a day anyway.
- **Rate-limit** on the endpoint (slowapi / gateway): the response is cheap but a bot loop is still wasteful.

---

## Ad density modulation

If the month's revenue has already covered the month's costs, we should be **less aggressive with ads**. Quieter UI is the point of building this — ad density is a knob, not a constant.

### Rule

Given `r = total_revenue_mtd`, `c = total_costs_mtd`:

| Condition | `adDensityHint` |
|-----------|-----------------|
| `r >= 1.2 * c` (revenue ≥ 120% of cost, comfortable buffer) | `"reduced"` |
| `0.8 * c <= r < 1.2 * c` (roughly breaking even) | `"normal"` |
| `r < 0.8 * c` (under-covering — need the ad dollars) | `"high"` |

A 20% deadband around break-even prevents flapping between `normal` and the extremes day-to-day as costs trickle in. The threshold is **per-month** (resets on the 1st), not rolling — the goal is "covered the month" not "covered the trailing 30d."

The `1.2×` coverage threshold is intentionally conservative: AWS bills late-month tend to creep up, and we want a real buffer before we leave ad dollars on the table.

### What the frontend does with the hint

```
"high"    → all configured AdSlot placements render; banner shows on hubs and lists
"normal"  → default behavior (current code)
"reduced" → banner shows on at most 1 surface per session; inline AdSlots skip every other render
```

Concrete behaviors are owned by the ads module — this doc only specifies the **contract**. The ad agent's `useAdsEnabled()` and a new sibling `useAdDensity()` (returning `"high" | "normal" | "reduced"`) consume the hint. Pseudo-shape:

```ts
// in src/features/ads/useAdDensity.ts (sibling to useAdsEnabled)
export function useAdDensity(): "high" | "normal" | "reduced" {
  const { data } = useTransparency();
  return data?.derived?.adDensityHint ?? "normal";
}

// AdSlot consumes both
function AdSlot(props: AdSlotProps) {
  if (!useAdsEnabled(props.premiumActive)) return null;
  const density = useAdDensity();
  if (density === "reduced" && props.slot === "inline") {
    // every-other-render gating, owned by ads module
  }
  // ...
}
```

The hook contract: **return one of three string literals, always.** Never throw, never return `undefined`. Default to `"normal"` when transparency data is unavailable — same UX as today.

### What the frontend does NOT do

- **Does not compute the hint itself.** The math is server-side. The frontend cannot see costs, only the hint.
- **Does not change ad placement** based on the hint. Same placements; just lower frequency in `"reduced"`.
- **Does not hide the funding meter.** The meter still renders — but with a friendlier message ("Costs covered — fewer ads today") when `monthRunwayCovered` is true. That copy work is i18n, not architecture; tracked separately.

---

## Funding transparency — math

```
ad_funded_percent = round( adsense_net / (adsense_net + premium_net) * 100 )
premium_percent   = 100 - ad_funded_percent
```

If both revenues are zero → endpoint returns `null` for `adFundedPercent` and the UI hides the bar (or shows N/A). The denominator is **revenue only**, not revenue+costs — the "% ad-funded" question is "of the dollars coming in, what share is ads?" Cost coverage is a separate question, answered by `monthRunwayCovered` and the density hint.

**Today (implemented):**

- `lingo-core/app/finance/` — `GET /finance/transparency` (public, no auth).
- Env: `FUNDING_AD_PERCENT`, `FUNDING_PERIOD_LABEL`, `FUNDING_SOURCE` (`manual` \| `estimated` \| `live`).
- `lingo/src/features/funding/useFundingTransparency.ts` → `FundingMeter`.

**Phase 2 (designed in this doc, not yet built):**

- Table `finance_daily_snapshot` (`date`, `source`, `payload_json`, `created_at`).
- Daily cron at 02:00 UTC → Cost Explorer + AdSense (+ Stripe when live) → upsert snapshot rows.
- Endpoint reads only the most recent row per `source`, composes the JSON above. Set `FUNDING_SOURCE=live`.
- See `docs/finance-transparency-endpoint-spec-2026-05-25.md` for the backend stub spec.

---

## Code map

**lingo-core**

```
app/finance/
  schemas.py         # response models (will expand for Phase 2 shape)
  router.py          # GET /finance/transparency
  aws_costs.py       # (planned) Cost Explorer client + monthly rollup
  adsense_sync.py    # (planned) Management API client
  snapshot_job.py    # (planned) daily cron entrypoint
app/billing/         # (planned) Stripe webhooks + Stripe net rollup
```

**lingo**

```
src/features/ads/                 # display framework
  useAdsEnabled.ts                # consent + config gate (exists)
  useAdDensity.ts                 # (planned) reads transparency.derived.adDensityHint
src/features/funding/             # funding meter data hook
  useFundingTransparency.ts       # TanStack Query hook (exists; will expand)
src/shared/api/finance.ts         # types (exists; will expand for Phase 2 fields)
src/shared/components/FundingMeter.tsx  # the right-edge panel
```

Frontend AdSense env vars: see [README](../README.md#environment-variables) and [ADS_PLACEMENT.md](./ADS_PLACEMENT.md).

---

## Environment (server)

```bash
# Manual funding meter until sync jobs exist
FUNDING_AD_PERCENT=40
FUNDING_PERIOD_LABEL="Last 30 days"
FUNDING_SOURCE=manual   # manual | estimated | live

# Phase 2 — server only (separate cost-reader IAM principal)
AWS_COST_READER_ACCESS_KEY_ID=AKIA...
AWS_COST_READER_SECRET_ACCESS_KEY=...
AWS_COST_READER_REGION=us-east-1   # Cost Explorer endpoint is us-east-1 only

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
| Rate limiting on transparency endpoint | TODO — slowapi or gateway |
| AdSense / Stripe / Cost Explorer secrets | Server-only; cost reader in a **separate IAM principal** from the Lambda runtime role |
| Revenue / cost numbers in frontend | Transparency API only — never OAuth tokens, raw earnings, or raw AWS line items |

---

## Rollout order

1. **Done:** Ad framework, consent, transparency API (manual %), funding meter wired to API.
2. **AdSense approval** — policies, content volume, `ads.txt`, set `VITE_ADSENSE_*`.
3. **Page placements** — add `AdSlot` where you want (placement doc backlog).
4. **AWS cost reader IAM principal** — create, attach minimum policy, store keys in Secrets Manager.
5. **Cost snapshot job** — Cost Explorer → `finance_daily_snapshot`. Daily cron, idempotent.
6. **AdSense sync job** — Management API → `finance_daily_snapshot`. Daily cron.
7. **Transparency endpoint v2** — emit the Phase 2 JSON shape (back-compat fields stay).
8. **Frontend types + `useAdDensity()` hook** — wire into ads module without behavior change yet.
9. **Ad density modulation behavior** — switch `AdSlot` to honor density hint.
10. **Stripe** — products, webhooks, `premiumActive`, hide ads + update %.
11. **Optional** — Premium CTA on funding meter → Checkout.

---

## References

- [Cost Explorer GetCostAndUsage](https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_GetCostAndUsage.html)
- [Cost Explorer pricing](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/pricing/)
- [Cost & Usage Reports overview](https://docs.aws.amazon.com/cur/latest/userguide/what-is-cur.html)
- [AWS Pricing API (`pricing:GetProducts`)](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/price-changes.html) — see also the AWS Pricing API docs
- [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
- [AdSense `reports.generate`](https://developers.google.com/adsense/management/reference/rest/v2/accounts.reports/generate)
- [AdSense metrics](https://developers.google.com/adsense/management/reporting/dimensions_metrics)
- [Stripe subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [ECONOMICS.md](./ECONOMICS.md) — unit economics, tripwires, per-user cost model
