/**
 * OpsApi — client for the lingo-ops admin dashboard.
 *
 * lingo-ops runs on a different host/port than lingo-core. The base URL
 * comes from VITE_OPS_API_BASE_URL (defaults to localhost:8001 for local
 * dev — matches the uvicorn line in lingo-ops/CLAUDE.md).
 *
 * The Auth0 JWT is attached by ApiClient just like every other domain;
 * the backend gates each route on its own ADMIN_USER_IDS allow-list, so
 * a non-admin user gets 403 on first call (rendered as the unavailable
 * banner by AdminOperationsPage).
 *
 * Most endpoints carry mocked data today (subscriptions/ads). The mock
 * pill is sourced from each response's top-level `_mock` field — when
 * the real source lands, the backend drops the flag and the pill goes
 * away automatically.
 */

import { ApiClient } from "./client";
import type {
  EventFilters,
  EventListResponse,
  EventRow,
} from "@/features/admin/events/types";

const PREFIX = "/api/ops/v1";

// ── Finance / cost & revenue ────────────────────────────────

export type AwsCostsByService = {
  periodStart: string;
  periodEnd: string;
  /** USD as a decimal string (server formats as `"12.34"`). */
  totalUsd: string;
  byService: Record<string, string>;
  updatedAt: string | null;
};

export type CostsByDomain = {
  /** Integer cents per Domain tag value. */
  domains: Record<string, number>;
  totalCents: number;
  source: "aws_cost_explorer";
  asOf: string | null;
};

export type Auth0Costs = {
  mau: number;
  estimatedMonthlyUsd: string;
  tier: string;
  source: "manual" | "live";
  updatedAt: string | null;
};

export type RevenuePeriod = {
  label: string;
  grossUsd: string;
  netUsd: string;
  feesUsd: string;
};

export type RevenueSummary = {
  ytd: RevenuePeriod;
  mtd: RevenuePeriod;
  last30Days: RevenuePeriod;
  updatedAt: string | null;
};

export type RevenueBySource = {
  stripe: { grossUsd: string; netUsd: string; feesUsd: string };
  adsense: { grossUsd: string; netUsd: string };
  updatedAt: string | null;
};

export type FundingPercent = {
  percent: number;
  netRevenueUsd: string;
  totalCostUsd: string;
  updatedAt: string | null;
};

// ── Subscriptions ─────────────────────────────────────────────

export type SubscriptionTier = "free" | "supporter" | "patron" | "lifetime";
export type SubscriptionEvent = "new" | "upgraded" | "downgraded" | "churned";

export type SubscriptionsSummary = {
  totalActive: number;
  totalLifetime: number;
  byTier: { free: number; supporter: number; patron: number; lifetime: number };
  mrrCents: number;
  arrCents: number;
  last30dNew: number;
  last30dChurned: number;
  asOf: string;
  _mock?: boolean;
};

export type SubscriptionEventRow = {
  userId: string;
  username: string;
  tier: SubscriptionTier;
  event: SubscriptionEvent;
  happenedAt: string;
  amountCents: number;
};

export type RecentSubscriptionsResponse = {
  events: SubscriptionEventRow[];
  _mock?: boolean;
};

// ── Ads ───────────────────────────────────────────────────────

export type AdsSummary = {
  impressionsToday: number;
  impressionsMtd: number;
  fillRatePct: number;
  ecpmCents: number;
  revenueTodayCents: number;
  revenueMtdCents: number;
  byUnit: { homeBanner: number; lessonBanner: number; rewardedVideo: number };
  asOf: string;
  _mock?: boolean;
};

export type AdPlacement = {
  slotId: string;
  location: string;
  enabled: boolean;
  lastFilledAt: string | null;
};

export type AdPlacementsResponse = {
  placements: AdPlacement[];
  _mock?: boolean;
};

// ── Jobs ──────────────────────────────────────────────────────

export type JobStatus = "running" | "success" | "failed" | "skipped";

export type JobRun = {
  id: number;
  jobName: string;
  status: JobStatus;
  startedAt: string;
  durationMs: number | null;
  message: string | null;
  details: Record<string, unknown> | null;
};

export type RecentJobsResponse = { runs: JobRun[] };

export type JobsSummaryResponse = {
  last24h: { success: number; failed: number; running: number };
  byJob: Record<
    string,
    {
      count: number;
      lastStatus: JobStatus | null;
      lastRunAt: string | null;
      p95DurationMs: number | null;
    }
  >;
};

// ── Infrastructure health (AWS budget + alarms) ───────────────

export type BudgetStatus = "ok" | "warn" | "exceeded";
export type AlarmState = "OK" | "ALARM" | "INSUFFICIENT_DATA";

/**
 * Shapes mirror the lingo-ops `/observability/health` contract verbatim
 * (snake_case as the backend serializes it — this endpoint does not use the
 * camelCase convention the finance/jobs endpoints do).
 */
export type ObservabilityBudget = {
  name: string;
  limit_usd: number;
  actual_usd: number;
  forecast_usd: number | null;
  percent_used: number;
  status: BudgetStatus;
};

export type ObservabilityAlarm = {
  name: string;
  state: AlarmState;
  metric: string;
  description: string;
  updated_at: string;
};

export type ObservabilityHealth = {
  generated_at: string;
  budget: ObservabilityBudget | null;
  alarms: ObservabilityAlarm[];
};

// ── Client ────────────────────────────────────────────────────

export class OpsApi extends ApiClient {
  // Finance — cost & revenue
  async getCostsByService(): Promise<AwsCostsByService> {
    return this.get<AwsCostsByService>(`${PREFIX}/finance/costs/aws`);
  }
  async getCostsByDomain(): Promise<CostsByDomain> {
    return this.get<CostsByDomain>(`${PREFIX}/finance/costs/by-domain`);
  }
  async getCostsAuth0(): Promise<Auth0Costs> {
    return this.get<Auth0Costs>(`${PREFIX}/finance/costs/auth0`);
  }
  async getRevenueSummary(): Promise<RevenueSummary> {
    return this.get<RevenueSummary>(`${PREFIX}/finance/revenue/summary`);
  }
  async getRevenueBySource(): Promise<RevenueBySource> {
    return this.get<RevenueBySource>(`${PREFIX}/finance/revenue/by-source`);
  }
  /** Public — no auth, used by the funding meter on the marketing pages. */
  async getFundingPercent(): Promise<FundingPercent> {
    return this.get<FundingPercent>(`${PREFIX}/finance/funding/percent`);
  }

  /**
   * Trigger an AWS Cost Explorer sync. Admin only.
   * Cost: ~$0.03 per call (3 CE requests). Use sparingly.
   */
  async syncAwsCosts(): Promise<unknown> {
    return this.post<unknown>(`${PREFIX}/finance/sources/aws/sync`, {});
  }

  // Subscriptions
  async getSubscriptionsSummary(): Promise<SubscriptionsSummary> {
    return this.get<SubscriptionsSummary>(`${PREFIX}/subscriptions/summary`);
  }
  async getRecentSubscriptions(limit = 20): Promise<RecentSubscriptionsResponse> {
    return this.get<RecentSubscriptionsResponse>(`${PREFIX}/subscriptions/recent`, {
      params: { limit },
    });
  }

  // Ads
  async getAdsSummary(): Promise<AdsSummary> {
    return this.get<AdsSummary>(`${PREFIX}/ads/summary`);
  }
  async getAdPlacements(): Promise<AdPlacementsResponse> {
    return this.get<AdPlacementsResponse>(`${PREFIX}/ads/placements`);
  }

  // Jobs
  async getJobsRecent(params?: {
    limit?: number;
    status?: JobStatus;
    job_name?: string;
  }): Promise<RecentJobsResponse> {
    return this.get<RecentJobsResponse>(`${PREFIX}/jobs/recent`, {
      params: params as Record<string, string | number | undefined>,
    });
  }
  async getJobsSummary(): Promise<JobsSummaryResponse> {
    return this.get<JobsSummaryResponse>(`${PREFIX}/jobs/summary`);
  }

  // Infrastructure health — AWS budget + CloudWatch alarm state.
  async getObservabilityHealth(): Promise<ObservabilityHealth> {
    return this.get<ObservabilityHealth>(`${PREFIX}/observability/health`);
  }

  // Events
  async listEvents(filters: EventFilters = {}): Promise<EventListResponse> {
    return this.get<EventListResponse>(`${PREFIX}/events`, {
      params: {
        user_id: filters.userId,
        event_type: filters.eventType,
        status: filters.status,
        since: filters.since,
        until: filters.until,
        limit: filters.limit,
      },
    });
  }

  async getEvent(id: string): Promise<EventRow> {
    return this.get<EventRow>(`${PREFIX}/events/${encodeURIComponent(id)}`);
  }

  /**
   * Synthetic event publisher — admin-only. Forwards to the kombu broker
   * so the async pipeline (quest eval + leaderboard) sees a real event.
   * Use for leaderboard / quest QA when you don't want to drive the UX.
   */
  async publishEvent(input: {
    userId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<{ published: boolean; event: Record<string, unknown> }> {
    return this.post(`${PREFIX}/events/publish`, {
      userId: input.userId,
      eventType: input.eventType,
      payload: input.payload,
    });
  }
}
