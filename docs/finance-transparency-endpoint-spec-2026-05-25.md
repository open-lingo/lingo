# Finance transparency endpoint v2 — backend spec (lingo-core)

**Author:** finance-transparency agent
**Date:** 2026-05-25
**Target repo:** `../lingo-core/`
**Reader:** lingo-core maintainer / next agent picking up the finance module

Companion doc: [ADS_AND_FINANCE_ARCHITECTURE.md](./ADS_AND_FINANCE_ARCHITECTURE.md) — has the full JSON shape, AWS research, and modulation rules. This file is the implementation contract.

---

## Endpoint

```
GET /api/core/v1/finance/transparency
```

- **Auth:** public. No PII in response, identical for every caller.
- **Cache:** `Cache-Control: public, max-age=3600` (1 hour). Data refreshes once a day; aggressive caching is fine.
- **Rate limit:** apply slowapi (or gateway) — cheap response but bot loops are wasteful. Suggested: 60/min/IP.
- **Response model:** `FundingTransparencyResponse` (expanded — see schemas below). All money values are **USD dollars (Decimal, 2dp)**, not cents.

Back-compat: keep the top-level fields (`adFundedPercent`, `premiumPercent`, `source`, `periodLabel`, `updatedAt`) so existing frontend clients continue to parse.

---

## Pydantic schemas (`app/finance/schemas.py` additions)

```python
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class TransparencyPeriod(BaseModel):
    start: str  # ISO date, first of current UTC month
    end: str    # ISO date, last of current UTC month
    updated_at: str = Field(..., alias="updatedAt")
    model_config = {"populate_by_name": True}


class AdsenseRevenue(BaseModel):
    estimated_earnings_usd: Decimal = Field(..., alias="estimatedEarningsUsd")
    source: Literal["adsense-management-api"] = "adsense-management-api"
    lag_days: int = Field(1, alias="lagDays")
    model_config = {"populate_by_name": True}


class PremiumRevenue(BaseModel):
    stripe_net_usd: Decimal = Field(..., alias="stripeNetUsd")
    subscriber_count: int = Field(0, alias="subscriberCount")
    model_config = {"populate_by_name": True}


class AwsCosts(BaseModel):
    total_usd: Decimal = Field(..., alias="totalUsd")
    by_service: dict[str, Decimal] = Field(default_factory=dict, alias="byService")
    model_config = {"populate_by_name": True}


class ThirdPartyCosts(BaseModel):
    auth0: Decimal = Decimal("0")
    openai: Decimal = Decimal("0")
    other: Decimal = Decimal("0")


class Derived(BaseModel):
    ad_funded_percent: int | None = Field(..., alias="adFundedPercent")
    month_runway_covered: bool = Field(..., alias="monthRunwayCovered")
    ad_density_hint: Literal["high", "normal", "reduced"] = Field(
        "normal", alias="adDensityHint"
    )
    model_config = {"populate_by_name": True}


class FundingTransparencyV2Response(FundingTransparencyResponse):
    """Phase 2 shape; superset of the Phase 1 response."""
    period: TransparencyPeriod
    revenue: dict  # {adsense: AdsenseRevenue, premium: PremiumRevenue}
    costs: dict    # {aws: AwsCosts, thirdParty: ThirdPartyCosts}
    derived: Derived
```

(The nested `revenue` / `costs` should be proper models — `dict` shown for brevity.)

---

## DB schema

One new table; one row per source per UTC day.

```sql
CREATE TABLE finance_daily_snapshot (
  snapshot_date    DATE        NOT NULL,
  source           TEXT        NOT NULL,  -- 'aws_costs' | 'adsense' | 'stripe'
  payload_json     TEXT        NOT NULL,  -- source-specific shape
  created_at       TIMESTAMP   NOT NULL,
  PRIMARY KEY (snapshot_date, source)
);
```

`payload_json` is source-shaped, not endpoint-shaped — keep transformation in the endpoint, not the storage layer.

**SQLite repo:** `app/db/sqlite/finance_repo.py` (new). Methods:
- `upsert_snapshot(date, source, payload) -> None`
- `latest_for_source(source) -> SnapshotRow | None`
- `range(source, start, end) -> list[SnapshotRow]` (for future trend chart)

**DynamoDB repo:** mirror; partition key `source`, sort key `snapshot_date`. Same protocol.

**Protocol** lives at `app/db/protocols/finance.py`.

---

## Cron job

`app/finance/snapshot_job.py` — entrypoint callable from EventBridge (Lambda) or local cron. Idempotent on `(date, source)`.

```python
async def run_daily_snapshot(today: date | None = None) -> None:
    today = today or datetime.now(timezone.utc).date()
    period_start = today.replace(day=1)

    # 1. AWS Cost Explorer
    aws_payload = await aws_costs.fetch_month_to_date(period_start, today)
    await finance_repo.upsert_snapshot(today, "aws_costs", aws_payload)

    # 2. AdSense Management API
    adsense_payload = await adsense_sync.fetch_month_to_date(period_start, today)
    await finance_repo.upsert_snapshot(today, "adsense", adsense_payload)

    # 3. Stripe (when wired)
    if settings.STRIPE_SECRET_KEY:
        stripe_payload = await stripe_sync.fetch_month_to_date(period_start, today)
        await finance_repo.upsert_snapshot(today, "stripe", stripe_payload)
```

- Schedule: **daily at 02:00 UTC** (Cost Explorer overnight refresh has settled).
- Failures: log + Sentry; don't crash. Endpoint serves last-known-good snapshot.
- Concurrency: protect with a DB-level lock or a CloudWatch single-instance schedule. Don't re-enter.

---

## Cost Explorer client (`app/finance/aws_costs.py`)

```python
import aioboto3
from app.config import settings

async def fetch_month_to_date(period_start: date, today: date) -> dict:
    session = aioboto3.Session(
        aws_access_key_id=settings.AWS_COST_READER_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_COST_READER_SECRET_ACCESS_KEY,
        region_name="us-east-1",  # Cost Explorer endpoint
    )
    async with session.client("ce") as ce:
        resp = await ce.get_cost_and_usage(
            TimePeriod={
                "Start": period_start.isoformat(),
                "End":   (today + timedelta(days=1)).isoformat(),  # exclusive
            },
            Granularity="DAILY",
            Metrics=["UnblendedCost"],
            GroupBy=[{"Type": "DIMENSION", "Key": "SERVICE"}],
        )
    return _rollup(resp)  # → {totalUsd, byService}
```

**Critical:** the cost-reader credentials are a **separate IAM principal** from the Lambda runtime role. Minimum policy: `ce:GetCostAndUsage`, `ce:GetCostForecast` (optional), `ce:GetDimensionValues` (optional). Read-only.

Cost Explorer charges ~$0.01 per request. Daily cadence → ~$0.30/mo. Don't call from request paths.

---

## Endpoint logic (`app/finance/router.py`)

```python
@router.get("/transparency", response_model=FundingTransparencyV2Response)
async def get_funding_transparency():
    today = datetime.now(timezone.utc).date()
    period_start = today.replace(day=1)
    period_end = last_day_of_month(today)

    aws    = await finance_repo.latest_for_source("aws_costs")
    ads    = await finance_repo.latest_for_source("adsense")
    stripe = await finance_repo.latest_for_source("stripe")

    if not (aws and ads):
        # Fall back to Phase 1 manual response
        return _manual_response()

    revenue_total = Decimal(ads.payload["totalUsd"]) + Decimal(
        stripe.payload["netUsd"] if stripe else "0"
    )
    cost_total = Decimal(aws.payload["totalUsd"]) + _third_party_total()

    ad_funded = _round_percent(ads, stripe) if revenue_total > 0 else None
    covered = revenue_total >= cost_total
    density = _density_hint(revenue_total, cost_total)

    return _compose_response(today, period_start, period_end, aws, ads, stripe,
                             ad_funded, covered, density)
```

Helpers:
- `_round_percent(ads, stripe)` — `round(ads_net / (ads_net + stripe_net) * 100)`.
- `_density_hint(r, c)` — `"reduced"` if `r >= 1.2 * c`; `"high"` if `r < 0.8 * c`; else `"normal"`. Both zero → `"normal"`.
- `_manual_response()` — emits Phase 1 fields from env (current behavior). Frontend ignores missing Phase 2 fields.

---

## Config additions (`app/config.py`)

```python
AWS_COST_READER_ACCESS_KEY_ID: str = ""
AWS_COST_READER_SECRET_ACCESS_KEY: str = ""
# (Cost Explorer endpoint is us-east-1 — hardcode in the client.)

GOOGLE_ADSENSE_ACCOUNT: str = ""
GOOGLE_OAUTH_CLIENT_ID: str = ""
GOOGLE_OAUTH_CLIENT_SECRET: str = ""
GOOGLE_OAUTH_REFRESH_TOKEN: str = ""
```

Stripe vars already exist (or are planned alongside the billing module).

---

## Test plan

- **Unit:** density-hint thresholds (`r=0`/`c=0`, exact 1.2× boundary, exact 0.8× boundary). `_round_percent` with both revenues zero returns `None`.
- **Integration:** Cost Explorer client against the AWS Cost Explorer **mock** (`moto[ce]` or recorded fixtures). Don't hit real CE in tests — costs money.
- **Endpoint:** snapshot rows present → v2 shape; snapshot rows missing → Phase 1 fallback.
- **Cron:** idempotency — running `run_daily_snapshot(today)` twice produces one row per source.

---

## Out of scope (next iteration)

- Per-feature cost attribution (needs CUR + Athena).
- Trend chart endpoint (`GET /finance/trend?days=30`) — schema supports it; UI doesn't need it yet.
- Forecasting (`ce:GetCostForecast`) — useful for "projected month-end cost" on a future admin dashboard, not for the public meter.
- Admin override endpoint to set `adDensityHint` manually — explicit non-goal; the math is the source of truth.

---

## Open questions for the lingo-core maintainer

1. **Snapshot host:** EventBridge → Lambda is the obvious choice (already on Mangum). Confirm vs. a separate cron host.
2. **Third-party costs:** Auth0 and any future LLM spend need a "manual entry" path until we wire their APIs. Should the endpoint accept env vars for those (`AUTH0_MONTHLY_COST_USD`) so the cost side is honest before we automate it?
3. **Stripe net definition:** "MTD net" — Stripe Balance Transactions API gives fees per-charge. Confirm the sync job groups by `created` rather than `available_on` for the MTD math (we want recognition in the month the charge happened).
