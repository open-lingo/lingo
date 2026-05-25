# Open Lingo — Economics

> **Mission target:** earn enough revenue to justify the maintainer's couple hours per week, until the community picks the project up or it stops needing to mature. Anything above that is reinvestment buffer; anything below means donated time. We're not building a growth-stage business — we're keeping a useful free thing online without it becoming a cost burden.

**Anchor number:** at $50–100/hr value × 8 hours/month maintenance = **$400–800/month** is the breakeven for the maintainer's time. Hit that and the project is sustainable. Don't optimize past it.

**Also see:** [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md) · [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) · [PROJECT_STATE.md](./PROJECT_STATE.md) · [ADS_AND_FINANCE_ARCHITECTURE.md](./ADS_AND_FINANCE_ARCHITECTURE.md) · [finance-transparency-endpoint-spec-2026-05-25.md](./finance-transparency-endpoint-spec-2026-05-25.md)

The numbers below are the *modelled* economics. The *measured* version — what the live month is actually doing — lives behind `GET /api/core/v1/finance/transparency`, sourced from AWS Cost Explorer + AdSense Management API + Stripe. See [ADS_AND_FINANCE_ARCHITECTURE.md](./ADS_AND_FINANCE_ARCHITECTURE.md#cost-data-aws-cost-explorer) for how that pipeline works; the same endpoint drives the ad-density modulation that quiets the UI when the month is already in the green.

---

## At a glance

| Stage | MAU | Net profit/month | Status |
|---|---|---|---|
| Pre-launch | <1k | ~$0 (mostly volunteer) | Bootstrap |
| **Survival** | ~5,000 | $400–800 | **Mission accomplished — maintainer's time covered** |
| Sustainable | ~25,000 | $4,000–6,000 | Light contractor work possible |
| Indie business | 100,000+ | $15,000+ | Founder full-time territory |

The explicit target is **Survival**. Everything above is bonus.

---

## Pricing tiers

| Tier | Price | Features | Naming rationale |
|---|---|---|---|
| **Free** | $0 | All learning features, banner ads + 10s rewarded video gates on deck downloads / social, 10-deck author cap | The default — generous on purpose |
| **Supporter** | $1/mo or $10/yr | Ad-free, supporter badge, 25-deck cap | "Buy us a coffee" framing — accessible for anyone |
| **Patron** | $5/mo or $50/yr | + profile cosmetics (banner / decoration / title), early-access beta channel, 100-deck cap, "Patron" badge, **dynamic "you fund ~N free learners" counter on profile** | Where the revenue leverage actually lives |
| **Lifetime** *(optional)* | $50 one-time | Patron features forever, single Stripe transaction, "Founding Patron" badge | Front-loaded cash, no churn risk |

**Naming**: avoid "Premium." The open-source ethos is the brand. Supporter / Patron sit right.

**The "fund N free learners" stat** on the Patron tier is just honest arithmetic shown to the user: `(net Patron revenue ÷ per-free-user cost) = N`. As we scale, N grows naturally (per-user cost drops; Patron revenue holds). Showing it on checkout + profile turns the tier into a story you can share.

---

## Per-user AWS cost breakdown

Per **active** user per month, current architecture (Lambda + Lambda URL + Dynamo on-demand + CloudFront + WAF + CloudWatch):

| Service | $/user-month | Notes |
|---|---|---|
| Lambda (5k invocations + ~125 GB-s compute) | $0.003 | FastAPI on Mangum, ~100ms avg at 256MB |
| Lambda URL routing | $0 | Free routing; already in use instead of API Gateway |
| DynamoDB on-demand (~1500 RCU + 500 WCU + ~1MB storage) | $0.001 | Includes the planned progress tables |
| CloudFront (~5 MB delivered) | $0.0005 | SPA ~1.7MB cached after first load |
| WAF (amortized at 10k users) | $0.0008 | $8/mo flat + per-request |
| CloudWatch logs (~2.5 MB ingested) | $0.001 | Lambda stderr/stdout |
| Bandwidth (API response egress) | $0.0005 | Small JSON |
| **AWS subtotal** | **~$0.007** | Less than one cent |

Auth0 is the cost line that bites at scale:

| Auth0 tier | Per-MAU cost | Total per active user |
|---|---|---|
| Free (≤7,500 MAU) | $0 | $0.007 |
| Essentials (>7,500 MAU at ~$35 per 1k extra) | ~$0.03 | $0.04 |
| Pro (custom domains, etc.) | ~$0.05+ | $0.06+ |
| B2C custom plan | $0.10+ | $0.11+ |

---

## Revenue assumptions

### Ad ARPU (blended global, education category, 2024 baselines)

- Rewarded video eCPM: $3–12, blended ~$5–8
- Banner eCPM: $0.50–2, blended ~$1
- Full-engagement ad load (~35 video + ~80 banner impressions/month): ~$0.25 ARPU

**Realistic ARPU** accounting for the fact that most users don't engage every ad surface:

| User segment | Share | $/user-month |
|---|---|---|
| Casual (lessons only, no community) | 70% | $0.005 |
| Active (some community / deck downloads) | 25% | $0.05 |
| Power user | 5% | $0.50 |
| **Weighted average** | | **~$0.04** |

### Stripe fee math — the micro-transaction tax

| Charge | Stripe fee | % of gross lost |
|---|---|---|
| $1/mo | $0.30 + 2.9% = $0.33 | **33%** |
| $5/mo | $0.30 + 14.5¢ = $0.445 | 9% |
| $10/yr | $0.30 + 29¢ = $0.59 | 6% |
| $50/yr or lifetime | $0.30 + $1.45 = $1.75 | 3.5% |

**Annual / lifetime billing is the highest-leverage margin recovery you can do.** Push it hard in the UI. "Save 16% and we keep more of your support" works.

---

## Break-even math at 10k MAU

Modeling 10% premium conversion at an 80/20 Supporter/Patron split:

| Segment | Count | Gross/mo | Stripe | Net/mo |
|---|---|---|---|---|
| 90% Free | 9,000 | $360 (ads at $0.04 ARPU) | — | $360 |
| 8% Supporter $1/mo | 800 | $800 | $264 | $536 |
| 2% Patron $5/mo | 200 | $1,000 | $89 | $911 |
| **Revenue** | | | | **$1,807** |

Costs at 10k MAU:

| Line | $/mo |
|---|---|
| AWS (10k × $0.007) | $70 |
| Auth0 Essentials (2,500 paid MAU at $0.035) | $88 |
| WAF + CloudWatch + flat overhead | $25 |
| **Cost** | **~$183** |

**Net: ~$1,624/month profit. Annualized: ~$19.5k.** Comfortably above the "couple hours/week" floor.

### Conversion mix sensitivity

Same 10% conversion, three Supporter/Patron splits:

| Mix | Supporter net | Patron net | Total net (with ads) |
|---|---|---|---|
| 8% / 2% (modeled) | $536 | $911 | $1,807 |
| 5% / 5% (Patron-heavy) | $335 | $2,275 | $2,970 |
| 9% / 1% (Supporter-heavy) | $603 | $456 | $1,419 |

**Patron is ~4× as valuable per user.** Marketing energy should weight there. Don't dilute the $1 Supporter pitch — it's the volume play — but make Patron *genuinely better* with real (cheap-to-ship) extras like cosmetics + early access.

### Industry caveat

10% conversion is optimistic. Industry baseline for freemium learning apps is **2–5%**. Duolingo at ~8% is the outlier. Plan for 5% as the realistic case; treat 10% as the stretch goal. At 5% conversion (4/1 split), the 10k MAU net drops to ~$900/mo — still above the mission floor.

---

## DynamoDB cost analysis

### On-demand vs provisioned pricing

**On-demand (no commit, pay-per-request):**
- Read: $0.25 per million RRUs (eventually consistent)
- Write: $1.25 per million WRUs
- Storage: $0.25 per GB-month

**Provisioned (commit to N RCUs/WCUs, billed continuously):**
- Read: $0.00013/RCU-hour → ~$0.094/RCU-month
- Write: $0.00065/WCU-hour → ~$0.47/WCU-month
- Storage: same $0.25/GB-month

**Reserved Capacity** (1-year or 3-year term, paid upfront, applies to provisioned only):
- 1y reserved: ~30% off the provisioned base
- 3y reserved: ~50% off the provisioned base
- Minimum buy: 100 RCUs and/or 100 WCUs

### Where the inflection point lives

At 10k MAU with the planned progress tables:
- ~1500 RCUs/month/user × 10k = 15M RCUs/month → ~5.8 RCUs sustained
- ~500 WCUs/month/user × 10k = 5M WCUs/month → ~1.9 WCUs sustained

Both sit **far below the 100-RCU/100-WCU minimum** for Reserved Capacity. On-demand wins by a wide margin at this scale — you're not paying for capacity you'd never use.

**Inflection happens around 50–80k MAU**, where sustained load creeps past 100 RCUs. At that point a 3y reserved purchase pencils out:
- Hypothetical: 100 sustained RCUs at 80k MAU
- On-demand cost: ~$30/month for that load
- Provisioned: ~$9.40/month
- 3y reserved: ~$4.70/month

**Verdict: stay on-demand until ≥50k MAU.** When the bill crosses ~$30/month sustained, do the math again.

---

## AWS cost-saving levers, in order of ROI

### Do these immediately (zero downside)

1. **Lambda ARM (Graviton2/3 architecture)** — flip `Architectures=arm64` in the Lambda config. FastAPI on Mangum is ARM-compatible out of the box. **~20% Lambda compute cost reduction with no code changes.** Single deploy-config change.

2. **CloudWatch log retention** — default is unlimited (you pay storage forever). Set 7-day retention on hot Lambda logs, 30-day on auth/admin. **~80% log-storage savings.** Single AWS console / Terraform change.

3. **WAF rule discipline** — keep AWS Managed Rules — Core Rule Set ($1/mo) + SQLi + XSS ($1/mo each). **Skip Bot Control ($10/mo)** — overkill for a free language app. Cap WAF at ~$8–10/month total.

4. **Lambda URL instead of API Gateway** — already done. No per-request fee. Save vs API Gateway: ~$1 per million requests.

### Do these when load justifies them

5. **Lambda memory tuning** — Lambda is billed per GB-second. Increasing memory *also* speeds up compute (proportional CPU). For FastAPI, the sweet spot is often 512–1024MB depending on cold-start vs warm-execution profile. Profile first; expect 20–40% savings on Lambda compute when tuned right. Worth doing when Lambda spend exceeds ~$20/month.

6. **Compute Savings Plans for Lambda** — 1y or 3y commit to $X/hour of Lambda compute. ~17–72% savings on the compute portion (compute, not invocation count). Worth it when Lambda compute spend exceeds **~$50/month** sustained — at our $0.003/user × MAU = roughly **20k+ MAU**.

7. **DynamoDB provisioned + Reserved Capacity** — see inflection-point math above. Threshold: ~50k MAU.

### Do these only if specific surfaces appear

8. **S3 lifecycle rules (Standard → Standard-IA)** — only relevant once we have user-uploaded media (deck cover images, audio clips). ~50% storage savings on older content. Not yet relevant.

9. **CloudFront price-class restriction** — set distribution to "Use only North America and Europe" if our audience skews that way. Saves nothing if global. Defer.

10. **Auth0 migration alternatives** — at ~25k+ MAU, Auth0 is the dominant cost line. Options:
    - **Clerk** — simpler scaling, ~$25/mo flat tier covers up to ~10k MAU
    - **Supabase Auth** — essentially free until ~50k MAU (Postgres-based)
    - **Self-hosted Keycloak** — free in license, ops-heavy
    
    Don't migrate prematurely. Tripwire: when Auth0 bill exceeds ~6 months of dev time to migrate.

### The most important lever is what you DON'T do

11. **Do not add AI features that cost per-request.** A single GPT-4-class call per lesson is $0.01–0.10. At 5 lessons/day × an active user = $1.50–15/month per user in AI alone. That single decision can flip the unit economics from "covers infra" to "loses money on every active user." Either skip AI entirely or use small open models hosted as part of the existing Lambda runtime.

---

## Sustainability targets

| Scenario | MAU | Net profit/month | Maintainer commitment |
|---|---|---|---|
| **Survival** *(the actual goal)* | 5,000 | $400–800 | Couple hours/week, sustainable indefinitely |
| Sustainable | 25,000 | $4,000–6,000 | Maintainer covered + light contractor work |
| Indie business | 100,000+ | $15,000+ | Full-time founder, support staff possible |

The mission says **Survival** is the target. Don't optimize past it. If revenue creeps comfortably past Survival, that's reinvestment buffer for one-off content investments (a content writer for a new language, a designer for the brand refresh, etc.) — not founder pay.

---

## Tripwires (when to revisit each decision)

Concrete numeric triggers — when crossed, sit down and re-do the math:

| Tripwire | What to revisit |
|---|---|
| Monthly AWS bill > $50 | Lambda ARM (if not done), CloudWatch retention, WAF rule audit |
| Auth0 MAU > 7,500 | Start budgeting Essentials. Plan migration path to Clerk/Supabase. |
| Auth0 monthly bill > $200 | Begin migration in earnest |
| Sustained DynamoDB read load > 50 RCUs | Re-evaluate on-demand vs provisioned + 1y reserved |
| Stripe fees > 20% of gross monthly revenue | Push annual billing harder, raise prices, or evaluate Paddle/Lemon Squeezy as alternative processor |
| Premium conversion < 1% after 6 months at >10k MAU | The offer needs rethinking — extras too thin, pricing wrong, or CTAs not surfaced enough |
| Any month of negative profit (after 1k MAU) | Emergency review — what changed? |
| Maintainer time < 2 hours/week sustained for 3 months | Begin community handoff conversation — project is mature enough |
| Maintainer time > 10 hours/week sustained | Consider raising prices, cutting scope, or finding a co-maintainer |
| AI features being considered | Re-do the unit-economics math first |

---

## Things to NOT do (cost discipline)

- **Don't add AI features that cost per-request.** Single most expensive decision available. Anything that hits an external LLM API per user request changes everything. If we add AI, it has to be cached aggressively or self-hosted on existing Lambda runtime.
- **Don't pre-optimize for scale we don't have.** Provisioned capacity + reserved capacity at <50k MAU is over-buying. Stay on-demand until the math clearly flips.
- **Don't migrate Auth0 prematurely.** Migration costs real dev time. Tripwire is when Auth0 cost > 6 months of migration effort, not "I read on HN that Clerk is cheaper."
- **Don't expand the storage surface arbitrarily.** Every new table is another line item. The current four-table layout (users / decks / srs / progress) is the minimum that makes architectural sense. Adding more should be deliberate.
- **Don't price below sustainability for "branding."** $1/mo is already the floor — going lower (or "free for life as a launch promo") undercuts the model. The price is the price.

---

## Caveats (estimates, not measurements)

Several numbers in this doc are extrapolations rather than measured values. Flag these before quoting them externally:

- **Ad eCPMs** are 2024 blends from public industry reports. Education-category rates vary considerably by season and traffic source.
- **The 70/25/5 ARPU user-mix split** is an educated guess based on common freemium-app behavior, not measured from our own traffic.
- **Per-user Lambda invocations (~5k/month)** and DynamoDB usage (~1500 RCU + 500 WCU) are projections from current API surface area, not load-tested.
- **10% premium conversion** is optimistic; realistic education-app freemium is 2–5%.
- **Stripe fees** assume standard pricing. Stripe sometimes offers reduced micro-transaction rates at >$500k/year processed — re-check at scale.
- **Auth0 tier pricing** changes occasionally and varies by region. Verify against the current Auth0 pricing page before quoting.
- **Reserved Capacity discounts** are AWS marketing numbers (~30%/50%) but actual savings depend on the specific RCU/WCU mix. Verify with the AWS Pricing Calculator before committing.

Update this doc when real numbers become available. Replace estimates with measurements as they arrive.

---

## References

- [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md) — see "Revenue (post-MVP)" and the lingots/cosmetics economy entries
- [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) — 2-week launch plan
- [PROJECT_STATE.md](./PROJECT_STATE.md) — what's actually built today
- [ADS_AND_FINANCE_ARCHITECTURE.md](./ADS_AND_FINANCE_ARCHITECTURE.md) — funding meter + AdSense plumbing
- [MVP_PAGES_PLAN.md](./MVP_PAGES_PLAN.md) — premium tier visibility on profile + checkout pages
