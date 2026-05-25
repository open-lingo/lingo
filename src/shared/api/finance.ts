import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/finance";

/**
 * Funding transparency response — Phase 1 (manual/env, shipped today).
 *
 * This is the legacy shape from `lingo-core/app/finance/router.py`. The Phase 2
 * shape (`FundingTransparencyV2`) is a superset; both are emitted by the v2
 * endpoint so old clients still parse it. See
 * `docs/ADS_AND_FINANCE_ARCHITECTURE.md` for the rollout.
 */
export type FundingTransparency = {
  adFundedPercent: number;
  premiumPercent: number;
  source: "manual" | "estimated" | "live";
  periodLabel: string;
  updatedAt?: string | null;
};

/**
 * Ad density hint computed server-side from MTD revenue vs MTD cost.
 *
 * - `"high"`   — under-covering (revenue < 0.8 × cost); render all configured ads.
 * - `"normal"` — roughly breaking even (default behavior).
 * - `"reduced"`— comfortably covered (revenue ≥ 1.2 × cost); thin the banner cadence.
 *
 * Frontend never computes this — server emits it, frontend obeys. Defaults to
 * `"normal"` when the field is missing or transparency data is unavailable.
 */
export type AdDensityHint = "high" | "normal" | "reduced";

/**
 * Funding transparency response — Phase 2 (designed; lands when daily snapshot
 * job is built on `lingo-core`). All money values are USD dollars (decimal,
 * two places). See `docs/ADS_AND_FINANCE_ARCHITECTURE.md` for field semantics.
 *
 * Back-compat: the Phase 1 fields (`adFundedPercent`, `premiumPercent`,
 * `source`, `periodLabel`, `updatedAt`) are still emitted at the top level
 * alongside the structured `period` / `revenue` / `costs` / `derived` blocks.
 */
export type FundingTransparencyV2 = FundingTransparency & {
  period: {
    /** ISO date, first of current UTC month. */
    start: string;
    /** ISO date, last of current UTC month. */
    end: string;
    /** When the snapshot job last succeeded. */
    updatedAt: string;
  };
  revenue: {
    adsense: {
      /** MTD; "estimated" per Google Management API. */
      estimatedEarningsUsd: number;
      source: "adsense-management-api";
      /** Worst-case lag of the underlying source (typically 1). */
      lagDays: number;
    };
    premium: {
      /** MTD net (gross minus Stripe fees). */
      stripeNetUsd: number;
      subscriberCount: number;
    };
  };
  costs: {
    aws: {
      totalUsd: number;
      /** Keyed by AWS service name; `Other` aggregates below-threshold services. */
      byService: Record<string, number>;
    };
    thirdParty: {
      auth0: number;
      openai: number;
      other: number;
    };
  };
  derived: {
    /** `round(adsense / (adsense + premium) * 100)`, or `null` if no revenue. */
    adFundedPercent: number | null;
    /** `total_revenue_mtd >= total_costs_mtd`. */
    monthRunwayCovered: boolean;
    /** See `AdDensityHint`. */
    adDensityHint: AdDensityHint;
  };
};

export class FinanceApi extends ApiClient {
  /** Public sustainability split for the funding meter (no auth). */
  async getTransparency(signal?: AbortSignal): Promise<FundingTransparency> {
    return this.get<FundingTransparency>(`${PREFIX}/transparency`, {
      signal,
      tag: "finance:transparency",
    });
  }
}
