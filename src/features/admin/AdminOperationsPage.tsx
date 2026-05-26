/**
 * AdminOperationsPage — single-page ops dashboard backed by lingo-ops.
 *
 * Four tabs: Cost & Revenue (default), Subscriptions, Ads, Jobs.
 *
 * Wiring notes:
 * - All server state through TanStack Query. Each useQuery sets an
 *   explicit `staleTime` per CLAUDE.md.
 * - When lingo-ops is unreachable, the cost/revenue tab surfaces an
 *   "Ops API unavailable" banner naming `VITE_OPS_API_BASE_URL`.
 * - Mocked-data tabs (subs, ads) render a "mock data" Badge sourced
 *   from the response's `_mock` field. When the real source lands the
 *   backend drops the flag and the pill disappears automatically.
 * - The jobs tab is the only domain with real persistence — empty state
 *   tells the maintainer how to populate it.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/shared/api/client";
import { useApi } from "@/shared/api/provider";
import type {
  AdPlacement,
  AdsSummary,
  AwsCostsByService,
  Auth0Costs,
  CostsByDomain,
  JobRun,
  JobsSummaryResponse,
  RecentJobsResponse,
  RecentSubscriptionsResponse,
  RevenueBySource,
  RevenueSummary,
  SubscriptionsSummary,
  JobStatus,
} from "@/shared/api/ops";
import { AlertBanner } from "@/shared/components/ui/AlertBanner";
import { Badge } from "@/shared/components/ui/Badge";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { TabButton, TabList } from "@/shared/components/ui/Tabs";

type TabId = "cost-revenue" | "subscriptions" | "ads" | "jobs";

// Per CLAUDE.md: always set explicit staleTime. Live-ish data uses 60s,
// slower-moving rollups use 5 min. Job recent + cost are the freshest;
// subscriptions / ads roll over hours-to-days so a longer cache is fine.
const STALE_LIVE = 60_000;
const STALE_SLOW = 5 * 60_000;

const OPS_ENV_NAME = "VITE_OPS_API_BASE_URL";

// ─── helpers ─────────────────────────────────────────────────

function centsToUsd(cents: number, opts: { sign?: boolean } = {}): string {
  const abs = Math.abs(cents) / 100;
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (cents < 0) return `-$${formatted}`;
  if (opts.sign && cents > 0) return `+$${formatted}`;
  return `$${formatted}`;
}

function usdStringToCents(s: string): number {
  // "12.34" → 1234. The backend formats decimals as strings to avoid
  // float drift; we only need cents for the bar/sum math.
  const num = Number(s);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

function formatRelativeOrAbs(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function isOpsUnavailable(err: unknown): boolean {
  if (err instanceof ApiError) return err.status >= 500 || err.status === 0;
  if (err instanceof Error) {
    // Network errors (fetch failed, CORS, etc.) reach us as plain Error.
    const msg = err.message.toLowerCase();
    return msg.includes("failed to fetch") || msg.includes("network");
  }
  return false;
}

// ─── small subcomponents ─────────────────────────────────────

function MockDataPill() {
  return (
    <Badge variant="warning" size="sm" title="Placeholder values until real source is wired.">
      mock data
    </Badge>
  );
}

function HorizontalBar({
  fraction,
  variant = "accent",
}: {
  fraction: number;
  variant?: "accent" | "success" | "warning";
}) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  const bg =
    variant === "success" ? "bg-success" : variant === "warning" ? "bg-warning" : "bg-accent";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
      <div className={`h-full ${bg} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function OpsUnavailableBanner({ where }: { where: string }) {
  return (
    <AlertBanner
      variant="error"
      title="Ops API unavailable"
    >
      Couldn't reach lingo-ops while loading {where}. Check the{" "}
      <code className="rounded bg-surface px-1 py-0.5 font-mono text-xs">{OPS_ENV_NAME}</code>{" "}
      environment variable, and confirm <code className="font-mono text-xs">uvicorn app.main:app --port 8001</code>{" "}
      is running.
    </AlertBanner>
  );
}

// ─── Cost & Revenue tab ──────────────────────────────────────

function CostRevenueTab() {
  const { ops } = useApi();
  const qc = useQueryClient();

  const syncAws = useMutation({
    mutationFn: () => ops.syncAwsCosts(),
    onSuccess: () => {
      // Refetch cost-side data; revenue is independent.
      qc.invalidateQueries({ queryKey: ["ops", "costs"] });
    },
  });

  const revenueSummary = useQuery<RevenueSummary>({
    queryKey: ["ops", "revenue", "summary"],
    queryFn: () => ops.getRevenueSummary(),
    staleTime: STALE_LIVE,
  });
  const revenueBySource = useQuery<RevenueBySource>({
    queryKey: ["ops", "revenue", "by-source"],
    queryFn: () => ops.getRevenueBySource(),
    staleTime: STALE_LIVE,
  });
  const costsByService = useQuery<AwsCostsByService>({
    queryKey: ["ops", "costs", "aws"],
    queryFn: () => ops.getCostsByService(),
    staleTime: STALE_LIVE,
  });
  const costsByDomain = useQuery<CostsByDomain>({
    queryKey: ["ops", "costs", "by-domain"],
    queryFn: () => ops.getCostsByDomain(),
    staleTime: STALE_LIVE,
  });
  const auth0Costs = useQuery<Auth0Costs>({
    queryKey: ["ops", "costs", "auth0"],
    queryFn: () => ops.getCostsAuth0(),
    staleTime: STALE_SLOW,
  });

  const queries = [revenueSummary, revenueBySource, costsByService, costsByDomain, auth0Costs];
  const opsDown = queries.some((q) => isOpsUnavailable(q.error));
  const anyLoading = queries.some((q) => q.isLoading);

  // Net (revenue MTD − costs MTD) in cents.
  const { netCents, costsMtdCents, revenueMtdCents } = useMemo(() => {
    const r = revenueSummary.data?.mtd;
    const awsCents = usdStringToCents(costsByService.data?.totalUsd ?? "0");
    const auth0Cents = usdStringToCents(auth0Costs.data?.estimatedMonthlyUsd ?? "0");
    const revCents = r ? usdStringToCents(r.netUsd) : 0;
    const costCents = awsCents + auth0Cents;
    return {
      revenueMtdCents: revCents,
      costsMtdCents: costCents,
      netCents: revCents - costCents,
    };
  }, [revenueSummary.data, costsByService.data, auth0Costs.data]);

  const fundingPercent = costsMtdCents > 0 ? (revenueMtdCents / costsMtdCents) * 100 : 0;

  // "Activate cost tags" hint shows when every domain reports zero —
  // matches the sibling agent's documented one-time AWS Billing step.
  const allDomainsZero = useMemo(() => {
    const d = costsByDomain.data?.domains;
    if (!d) return false;
    const vals = Object.values(d);
    return vals.length > 0 && vals.every((v) => v === 0);
  }, [costsByDomain.data]);

  if (opsDown) {
    return <OpsUnavailableBanner where="cost & revenue" />;
  }

  return (
    <div className="space-y-6">
      {/* Sync controls */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted px-4 py-3">
        <div>
          <p className="text-sm font-medium text-text-primary">AWS cost sync</p>
          <p className="text-xs text-text-muted">
            {syncAws.isPending
              ? "Syncing — calling Cost Explorer (~$0.03)…"
              : syncAws.isSuccess
                ? "Synced. Numbers refresh below."
                : syncAws.isError
                  ? `Failed: ${(syncAws.error as Error)?.message ?? "unknown"}`
                  : "Fetches month-to-date costs by service + by domain. Costs ~$0.03 per call."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => syncAws.mutate()}
          disabled={syncAws.isPending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncAws.isPending ? "Syncing…" : "Sync now"}
        </button>
      </div>

      {/* Headline net + funding meter */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card padding="lg">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Net this month
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${
              netCents >= 0 ? "text-success" : "text-error"
            }`}
          >
            {anyLoading ? "…" : centsToUsd(netCents, { sign: true })}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Revenue MTD {centsToUsd(revenueMtdCents)} − costs MTD {centsToUsd(costsMtdCents)}
          </p>
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Funding meter
            </p>
            <span className="text-sm font-semibold text-text-primary">
              {Math.min(100, Math.round(fundingPercent))}%
            </span>
          </div>
          <div className="mt-3">
            <HorizontalBar
              fraction={fundingPercent / 100}
              variant={fundingPercent >= 100 ? "success" : "warning"}
            />
          </div>
          <p className="mt-2 text-xs text-text-muted">
            % of monthly costs covered by net revenue.
          </p>
        </Card>
      </div>

      {/* Costs grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <CostsByServiceCard data={costsByService.data} loading={costsByService.isLoading} />
        <CostsByDomainCard
          data={costsByDomain.data}
          loading={costsByDomain.isLoading}
          allZero={allDomainsZero}
        />
      </div>

      {/* Revenue card */}
      <RevenueCard
        bySource={revenueBySource.data}
        summary={revenueSummary.data}
        loading={revenueBySource.isLoading || revenueSummary.isLoading}
      />

      {/* Auth0 + sync timestamps */}
      <Card padding="md" className="text-xs text-text-muted">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>
            Auth0: {auth0Costs.data ? `${auth0Costs.data.mau} MAU · ${auth0Costs.data.tier}` : "—"}{" "}
            (
            {auth0Costs.data ? `$${auth0Costs.data.estimatedMonthlyUsd}/mo` : "—"})
          </span>
          <span>Costs synced: {formatRelativeOrAbs(costsByService.data?.updatedAt)}</span>
          <span>Revenue synced: {formatRelativeOrAbs(revenueSummary.data?.updatedAt)}</span>
        </div>
      </Card>
    </div>
  );
}

function CostsByServiceCard({
  data,
  loading,
}: {
  data: AwsCostsByService | undefined;
  loading: boolean;
}) {
  const rows = useMemo(() => {
    if (!data) return [];
    const max = Math.max(
      0,
      ...Object.values(data.byService).map((v) => usdStringToCents(v)),
    );
    return Object.entries(data.byService)
      .map(([service, usd]) => ({
        service,
        cents: usdStringToCents(usd),
      }))
      .sort((a, b) => b.cents - a.cents)
      .map((row) => ({ ...row, fraction: max > 0 ? row.cents / max : 0 }));
  }, [data]);

  return (
    <Card padding="md">
      <h3 className="text-sm font-semibold text-text-primary">Costs MTD — by service</h3>
      <p className="mt-1 text-xs text-text-muted">
        AWS Cost Explorer total: ${data?.totalUsd ?? "0.00"}
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          No cost data yet. Run the AWS cost sync to populate.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.service}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-primary">{row.service}</span>
                <span className="text-text-secondary">{centsToUsd(row.cents)}</span>
              </div>
              <div className="mt-1">
                <HorizontalBar fraction={row.fraction} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CostsByDomainCard({
  data,
  loading,
  allZero,
}: {
  data: CostsByDomain | undefined;
  loading: boolean;
  allZero: boolean;
}) {
  const rows = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.domains);
    const max = Math.max(0, ...entries.map(([, c]) => c));
    return entries
      .map(([domain, cents]) => ({ domain, cents, fraction: max > 0 ? cents / max : 0 }))
      .sort((a, b) => b.cents - a.cents);
  }, [data]);

  return (
    <Card padding="md">
      <h3 className="text-sm font-semibold text-text-primary">Costs MTD — by domain</h3>
      <p className="mt-1 text-xs text-text-muted">
        Grouped by the AWS <code className="font-mono text-[11px]">Domain</code> cost-allocation tag.
      </p>

      {allZero ? (
        <div className="mt-4">
          <AlertBanner variant="warning" title="Activate cost-allocation tags">
            All by-domain values are zero. In the AWS Billing console, open{" "}
            <em>Cost allocation tags</em>, search for{" "}
            <code className="font-mono text-xs">Domain</code>, and click <em>Activate</em>.
            New data takes up to 24h to surface.
          </AlertBanner>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No domain data.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.domain}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-primary">{row.domain}</span>
                <span className="text-text-secondary">{centsToUsd(row.cents)}</span>
              </div>
              <div className="mt-1">
                <HorizontalBar fraction={row.fraction} variant="success" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function RevenueCard({
  bySource,
  summary,
  loading,
}: {
  bySource: RevenueBySource | undefined;
  summary: RevenueSummary | undefined;
  loading: boolean;
}) {
  const stripeMtd = bySource?.stripe.netUsd ?? "0.00";
  const adsenseMtd = bySource?.adsense.netUsd ?? "0.00";
  const totalMtdCents =
    usdStringToCents(stripeMtd) + usdStringToCents(adsenseMtd);
  return (
    <Card padding="md">
      <h3 className="text-sm font-semibold text-text-primary">Revenue MTD</h3>
      {loading ? (
        <p className="mt-3 text-sm text-text-muted">Loading…</p>
      ) : (
        <>
          <p className="mt-3 text-2xl font-semibold text-text-primary">
            {centsToUsd(totalMtdCents)}
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-text-muted">Stripe (premium)</dt>
              <dd className="text-sm text-text-primary">${stripeMtd}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-text-muted">AdSense (ads)</dt>
              <dd className="text-sm text-text-primary">${adsenseMtd}</dd>
            </div>
          </dl>
          {summary?.last30Days ? (
            <p className="mt-3 text-xs text-text-muted">
              Last 30d net: ${summary.last30Days.netUsd}
            </p>
          ) : null}
        </>
      )}
    </Card>
  );
}

// ─── Subscriptions tab ───────────────────────────────────────

function SubscriptionsTab() {
  const { ops } = useApi();
  const summary = useQuery<SubscriptionsSummary>({
    queryKey: ["ops", "subs", "summary"],
    queryFn: () => ops.getSubscriptionsSummary(),
    staleTime: STALE_SLOW,
  });
  const recent = useQuery<RecentSubscriptionsResponse>({
    queryKey: ["ops", "subs", "recent"],
    queryFn: () => ops.getRecentSubscriptions(20),
    staleTime: STALE_LIVE,
  });

  if (isOpsUnavailable(summary.error) || isOpsUnavailable(recent.error)) {
    return <OpsUnavailableBanner where="subscriptions" />;
  }

  const s = summary.data;
  const isMock = Boolean(s?._mock || recent.data?._mock);

  return (
    <div className="space-y-6">
      {isMock ? (
        <div className="flex justify-end">
          <MockDataPill />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card padding="md">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Active subscribers
          </p>
          <p className="mt-2 text-3xl font-bold text-text-primary">
            {s?.totalActive ?? "—"}
          </p>
          {s ? (
            <p className="mt-1 text-xs text-text-muted">
              {s.totalLifetime} lifetime
            </p>
          ) : null}
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            MRR
          </p>
          <p className="mt-2 text-3xl font-bold text-text-primary">
            {s ? centsToUsd(s.mrrCents) : "—"}
          </p>
          {s ? (
            <p className="mt-1 text-xs text-text-muted">
              ARR {centsToUsd(s.arrCents)}
            </p>
          ) : null}
        </Card>
        <Card padding="md">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Last 30 days
          </p>
          <div className="mt-2 flex items-baseline gap-4">
            <div>
              <p className="text-2xl font-bold text-success">+{s?.last30dNew ?? "—"}</p>
              <p className="text-[11px] text-text-muted">new</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-error">−{s?.last30dChurned ?? "—"}</p>
              <p className="text-[11px] text-text-muted">churned</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-text-primary">By tier</h3>
        {s ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-4">
            {(["free", "supporter", "patron", "lifetime"] as const).map((tier) => (
              <li key={tier} className="rounded-md border border-border p-3">
                <p className="text-xs uppercase text-text-muted">{tier}</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">
                  {s.byTier[tier]}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-text-muted">Loading…</p>
        )}
      </Card>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-text-primary">Recent events</h3>
        {recent.data?.events.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="text-left text-xs uppercase text-text-muted">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Tier</th>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.data.events.map((ev) => (
                  <tr key={`${ev.userId}-${ev.happenedAt}`}>
                    <td className="px-3 py-2 text-text-secondary">
                      {formatRelativeOrAbs(ev.happenedAt)}
                    </td>
                    <td className="px-3 py-2 font-medium text-text-primary">
                      @{ev.username}
                    </td>
                    <td className="px-3 py-2">
                      <Badge size="sm">{ev.tier}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        size="sm"
                        variant={
                          ev.event === "new" || ev.event === "upgraded"
                            ? "success"
                            : ev.event === "churned"
                              ? "error"
                              : "warning"
                        }
                      >
                        {ev.event}
                      </Badge>
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono text-xs ${
                        ev.amountCents >= 0 ? "text-text-primary" : "text-error"
                      }`}
                    >
                      {centsToUsd(ev.amountCents, { sign: ev.amountCents !== 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : recent.isLoading ? (
          <p className="mt-3 text-sm text-text-muted">Loading…</p>
        ) : (
          <p className="mt-3 text-sm text-text-muted">No recent events.</p>
        )}
      </Card>
    </div>
  );
}

// ─── Ads tab ─────────────────────────────────────────────────

function AdsTab() {
  const { ops } = useApi();
  const summary = useQuery<AdsSummary>({
    queryKey: ["ops", "ads", "summary"],
    queryFn: () => ops.getAdsSummary(),
    staleTime: STALE_SLOW,
  });
  const placements = useQuery({
    queryKey: ["ops", "ads", "placements"],
    queryFn: () => ops.getAdPlacements(),
    staleTime: STALE_SLOW,
  });

  if (isOpsUnavailable(summary.error) || isOpsUnavailable(placements.error)) {
    return <OpsUnavailableBanner where="ads" />;
  }

  const a = summary.data;
  const isMock = Boolean(a?._mock || placements.data?._mock);

  return (
    <div className="space-y-6">
      {isMock ? (
        <div className="flex justify-end">
          <MockDataPill />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card padding="md">
          <p className="text-xs uppercase text-text-muted">Impressions today</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">
            {a ? a.impressionsToday.toLocaleString() : "—"}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase text-text-muted">Impressions MTD</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">
            {a ? a.impressionsMtd.toLocaleString() : "—"}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase text-text-muted">Fill rate</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">
            {a ? `${a.fillRatePct.toFixed(1)}%` : "—"}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase text-text-muted">eCPM</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">
            {a ? centsToUsd(a.ecpmCents) : "—"}
          </p>
        </Card>
      </div>

      <Card padding="md">
        <h3 className="text-sm font-semibold text-text-primary">Revenue by unit (MTD)</h3>
        {a ? (
          <ul className="mt-3 space-y-3">
            {(
              [
                ["homeBanner", "Home banner"],
                ["lessonBanner", "Lesson banner"],
                ["rewardedVideo", "Rewarded video"],
              ] as const
            ).map(([key, label]) => {
              const cents = a.byUnit[key];
              const max = Math.max(
                a.byUnit.homeBanner,
                a.byUnit.lessonBanner,
                a.byUnit.rewardedVideo,
              );
              return (
                <li key={key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-primary">{label}</span>
                    <span className="text-text-secondary">{centsToUsd(cents)}</span>
                  </div>
                  <div className="mt-1">
                    <HorizontalBar fraction={max > 0 ? cents / max : 0} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-text-muted">Loading…</p>
        )}
        {a ? (
          <p className="mt-3 text-xs text-text-muted">
            Revenue today: {centsToUsd(a.revenueTodayCents)} · MTD:{" "}
            {centsToUsd(a.revenueMtdCents)}
          </p>
        ) : null}
      </Card>

      <PlacementsCard placements={placements.data?.placements ?? []} loading={placements.isLoading} />
    </div>
  );
}

function PlacementsCard({
  placements,
  loading,
}: {
  placements: AdPlacement[];
  loading: boolean;
}) {
  return (
    <Card padding="md">
      <h3 className="text-sm font-semibold text-text-primary">Placements</h3>
      {loading ? (
        <p className="mt-3 text-sm text-text-muted">Loading…</p>
      ) : placements.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">No placements configured.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="text-left text-xs uppercase text-text-muted">
              <tr>
                <th className="px-3 py-2">Slot</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Last filled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {placements.map((p) => (
                <tr key={p.slotId}>
                  <td className="px-3 py-2 font-mono text-xs text-text-primary">{p.slotId}</td>
                  <td className="px-3 py-2 text-text-secondary">{p.location}</td>
                  <td className="px-3 py-2">
                    <Badge size="sm" variant={p.enabled ? "success" : "neutral"}>
                      {p.enabled ? "enabled" : "disabled"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {formatRelativeOrAbs(p.lastFilledAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Jobs tab ────────────────────────────────────────────────

const STATUS_VARIANT: Record<JobStatus, "success" | "error" | "warning" | "info"> = {
  success: "success",
  failed: "error",
  running: "info",
  skipped: "warning",
};

function JobsTab() {
  const { ops } = useApi();
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [jobNameFilter, setJobNameFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const summary = useQuery<JobsSummaryResponse>({
    queryKey: ["ops", "jobs", "summary"],
    queryFn: () => ops.getJobsSummary(),
    staleTime: STALE_LIVE,
  });
  const recent = useQuery<RecentJobsResponse>({
    queryKey: ["ops", "jobs", "recent", statusFilter, jobNameFilter],
    queryFn: () =>
      ops.getJobsRecent({
        limit: 50,
        status: statusFilter || undefined,
        job_name: jobNameFilter.trim() || undefined,
      }),
    staleTime: STALE_LIVE,
  });

  if (isOpsUnavailable(summary.error) || isOpsUnavailable(recent.error)) {
    return <OpsUnavailableBanner where="jobs" />;
  }

  const s = summary.data;
  const runs = recent.data?.runs ?? [];
  const isEmpty =
    !recent.isLoading && runs.length === 0 && !statusFilter && !jobNameFilter.trim();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card padding="md">
          <p className="text-xs uppercase text-text-muted">Success (24h)</p>
          <p className="mt-2 text-3xl font-bold text-success">
            {s?.last24h.success ?? "—"}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase text-text-muted">Failed (24h)</p>
          <p className="mt-2 text-3xl font-bold text-error">
            {s?.last24h.failed ?? "—"}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase text-text-muted">Running (24h)</p>
          <p className="mt-2 text-3xl font-bold text-info">
            {s?.last24h.running ?? "—"}
          </p>
        </Card>
      </div>

      {isEmpty ? (
        <EmptyState
          title="No jobs logged yet"
          description={
            <>
              POST to{" "}
              <code className="rounded bg-surface px-1 py-0.5 font-mono text-xs">
                /api/ops/v1/jobs/log
              </code>{" "}
              from your batch scripts to populate this view. Auth is a static
              bearer token from <code className="font-mono text-xs">OPS_JOB_TOKEN</code>.
            </>
          }
        />
      ) : (
        <Card padding="md">
          <div className="flex flex-wrap items-end gap-3">
            <h3 className="text-sm font-semibold text-text-primary">Recent runs</h3>
            <div className="ml-auto flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as JobStatus | "")}
                className="rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                <option value="success">success</option>
                <option value="failed">failed</option>
                <option value="running">running</option>
                <option value="skipped">skipped</option>
              </select>
              <input
                type="text"
                value={jobNameFilter}
                onChange={(e) => setJobNameFilter(e.target.value)}
                placeholder="job_name"
                className="rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary"
                aria-label="Filter by job name"
              />
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="text-left text-xs uppercase text-text-muted">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Job</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Duration</th>
                  <th className="px-3 py-2">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((row) => (
                  <JobRow
                    key={row.id}
                    row={row}
                    expanded={expandedId === row.id}
                    onToggle={() => setExpandedId(expandedId === row.id ? null : row.id)}
                  />
                ))}
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-text-muted">
                      No runs match the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Per-job summary (count + p95) */}
      {s && Object.keys(s.byJob).length > 0 ? (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-text-primary">By job</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="text-left text-xs uppercase text-text-muted">
                <tr>
                  <th className="px-3 py-2">Job</th>
                  <th className="px-3 py-2 text-right">Runs</th>
                  <th className="px-3 py-2">Last status</th>
                  <th className="px-3 py-2">Last run</th>
                  <th className="px-3 py-2 text-right">p95 duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.entries(s.byJob).map(([name, entry]) => (
                  <tr key={name}>
                    <td className="px-3 py-2 font-mono text-xs text-text-primary">{name}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">{entry.count}</td>
                    <td className="px-3 py-2">
                      {entry.lastStatus ? (
                        <Badge size="sm" variant={STATUS_VARIANT[entry.lastStatus]}>
                          {entry.lastStatus}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {formatRelativeOrAbs(entry.lastRunAt)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-text-secondary">
                      {entry.p95DurationMs != null ? `${entry.p95DurationMs} ms` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function JobRow({
  row,
  expanded,
  onToggle,
}: {
  row: JobRun;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-surface-muted"
        aria-expanded={expanded}
      >
        <td className="px-3 py-2 text-text-secondary">{formatRelativeOrAbs(row.startedAt)}</td>
        <td className="px-3 py-2 font-mono text-xs text-text-primary">{row.jobName}</td>
        <td className="px-3 py-2">
          <Badge size="sm" variant={STATUS_VARIANT[row.status]}>
            {row.status}
          </Badge>
        </td>
        <td className="px-3 py-2 text-right font-mono text-xs text-text-secondary">
          {row.durationMs != null ? `${row.durationMs} ms` : "—"}
        </td>
        <td className="max-w-md truncate px-3 py-2 text-text-secondary" title={row.message ?? ""}>
          {row.message ?? "—"}
        </td>
      </tr>
      {expanded && row.details ? (
        <tr>
          <td colSpan={5} className="bg-surface-muted px-3 py-3">
            <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-text-secondary">
              {JSON.stringify(row.details, null, 2)}
            </pre>
          </td>
        </tr>
      ) : null}
    </>
  );
}

// ─── Page shell ──────────────────────────────────────────────

export function AdminOperationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("cost-revenue");

  const tabs: { id: TabId; label: string }[] = [
    { id: "cost-revenue", label: "Cost & Revenue" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "ads", label: "Ads" },
    { id: "jobs", label: "Jobs" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Operations</h1>
        <p className="text-sm text-text-muted">
          Daily cost / revenue / subscription / ad / job dashboard. Backed by lingo-ops.
        </p>
      </div>

      <TabList>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabList>

      <div>
        {activeTab === "cost-revenue" && <CostRevenueTab />}
        {activeTab === "subscriptions" && <SubscriptionsTab />}
        {activeTab === "ads" && <AdsTab />}
        {activeTab === "jobs" && <JobsTab />}
      </div>
    </div>
  );
}

export default AdminOperationsPage;
