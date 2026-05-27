/**
 * AdminHomePage — operational vital signs at /admin/home.
 *
 * Grid of cards:
 *   - Users (total / new last 7d / active last 7d)
 *   - Net this month (revenue MTD − costs MTD)
 *   - AWS costs MTD by service
 *   - Recent jobs (last 5)
 *   - Active alerts (rule-based, static for now)
 *
 * Each card has a "Details →" link to the relevant /admin/ops sub-section.
 * Data is sourced from lingo-core (`/admin/stats/users`) and lingo-ops
 * (cost/revenue/jobs); transient ops outages render a soft warning
 * instead of failing the whole dashboard.
 */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/shared/api/client";
import { useApi } from "@/shared/api/provider";
import type { AdminUserStats } from "@/shared/api/admin";
import type {
  AwsCostsByService,
  Auth0Costs,
  JobsSummaryResponse,
  RecentJobsResponse,
  RevenueSummary,
} from "@/shared/api/ops";
import { Badge } from "@/shared/components/ui/Badge";
import { Card } from "@/shared/components/ui/Card";

type CardChromeProps = {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
};

function DashCard({ title, href, hrefLabel, children }: CardChromeProps) {
  return (
    <Card padding="lg" className="flex h-full flex-col">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {title}
        </h2>
        {href ? (
          <Link
            to={href}
            className="text-xs font-medium text-accent hover:underline"
          >
            {hrefLabel ?? "Details →"}
          </Link>
        ) : null}
      </header>
      <div className="flex-1">{children}</div>
    </Card>
  );
}

function isOpsUnavailable(err: unknown): boolean {
  if (err instanceof ApiError) return err.status >= 500 || err.status === 0;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes("failed to fetch") || msg.includes("network");
  }
  return false;
}

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
  const num = Number(s);
  return Number.isFinite(num) ? Math.round(num * 100) : 0;
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

const STATUS_VARIANT = {
  success: "success",
  failed: "error",
  running: "info",
  skipped: "warning",
} as const;

export function AdminHomePage() {
  const { t } = useTranslation();
  const { admin, ops } = useApi();

  const userStats = useQuery<AdminUserStats>({
    queryKey: ["admin", "stats", "users", 7],
    queryFn: () => admin.getUserStats(7),
    staleTime: 60_000,
  });

  const revenue = useQuery<RevenueSummary>({
    queryKey: ["ops", "revenue", "summary"],
    queryFn: () => ops.getRevenueSummary(),
    staleTime: 60_000,
  });

  const costsByService = useQuery<AwsCostsByService>({
    queryKey: ["ops", "costs", "aws"],
    queryFn: () => ops.getCostsByService(),
    staleTime: 60_000,
  });

  const auth0 = useQuery<Auth0Costs>({
    queryKey: ["ops", "costs", "auth0"],
    queryFn: () => ops.getCostsAuth0(),
    staleTime: 5 * 60_000,
  });

  const jobsSummary = useQuery<JobsSummaryResponse>({
    queryKey: ["ops", "jobs", "summary"],
    queryFn: () => ops.getJobsSummary(),
    staleTime: 60_000,
  });

  const recentJobs = useQuery<RecentJobsResponse>({
    queryKey: ["ops", "jobs", "recent", "home"],
    queryFn: () => ops.getJobsRecent({ limit: 5 }),
    staleTime: 60_000,
  });

  const opsDown =
    isOpsUnavailable(revenue.error) ||
    isOpsUnavailable(costsByService.error) ||
    isOpsUnavailable(auth0.error) ||
    isOpsUnavailable(jobsSummary.error) ||
    isOpsUnavailable(recentJobs.error);

  // Net MTD
  const revenueMtdCents = revenue.data
    ? usdStringToCents(revenue.data.mtd.netUsd)
    : 0;
  const awsCents = costsByService.data
    ? usdStringToCents(costsByService.data.totalUsd)
    : 0;
  const auth0Cents = auth0.data ? usdStringToCents(auth0.data.estimatedMonthlyUsd) : 0;
  const costsMtdCents = awsCents + auth0Cents;
  const netCents = revenueMtdCents - costsMtdCents;

  const failed24h = jobsSummary.data?.last24h.failed ?? 0;
  const alerts = buildAlerts({
    failedJobs24h: failed24h,
    opsDown,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {/* Users */}
      <DashCard
        title={t("admin.nav.users", "Users")}
        href="/admin/users"
        hrefLabel={t("admin.home.viewUsers", "Browse →")}
      >
        {userStats.isLoading ? (
          <p className="text-sm text-text-muted">{t("common.loading")}</p>
        ) : userStats.error ? (
          <p className="text-sm text-error">
            {t("admin.home.usersError", "Couldn't load user stats")}
          </p>
        ) : (
          <dl className="grid grid-cols-3 gap-3">
            <Stat label={t("admin.home.usersTotal", "Total")} value={userStats.data?.total ?? 0} />
            <Stat label={t("admin.home.usersNew7d", "New 7d")} value={userStats.data?.new_since ?? 0} variant="success" />
            <Stat label={t("admin.home.usersActive7d", "Active 7d")} value={userStats.data?.active_since ?? 0} />
          </dl>
        )}
      </DashCard>

      {/* Net MTD */}
      <DashCard
        title={t("admin.home.netMonth", "Net this month")}
        href="/admin/ops"
      >
        {opsDown ? (
          <OpsDownNote />
        ) : (
          <>
            <p
              className={`text-3xl font-bold ${
                netCents >= 0 ? "text-success" : "text-error"
              }`}
            >
              {centsToUsd(netCents, { sign: true })}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Revenue {centsToUsd(revenueMtdCents)} − costs {centsToUsd(costsMtdCents)}
            </p>
          </>
        )}
      </DashCard>

      {/* AWS costs by service */}
      <DashCard
        title={t("admin.home.awsByService", "AWS costs MTD")}
        href="/admin/ops"
      >
        {opsDown ? (
          <OpsDownNote />
        ) : costsByService.isLoading ? (
          <p className="text-sm text-text-muted">{t("common.loading")}</p>
        ) : (
          <ServiceBars data={costsByService.data} />
        )}
      </DashCard>

      {/* Recent jobs */}
      <DashCard
        title={t("admin.home.recentJobs", "Recent jobs")}
        href="/admin/ops"
      >
        {opsDown ? (
          <OpsDownNote />
        ) : recentJobs.isLoading ? (
          <p className="text-sm text-text-muted">{t("common.loading")}</p>
        ) : (recentJobs.data?.runs.length ?? 0) === 0 ? (
          <p className="text-sm text-text-muted">{t("admin.home.noJobs", "No jobs logged in the last day.")}</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recentJobs.data!.runs.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-mono text-xs text-text-primary">{r.jobName}</span>
                  <span className="ml-2 text-xs text-text-muted">{formatRelative(r.startedAt)}</span>
                </span>
                <Badge size="sm" variant={STATUS_VARIANT[r.status]}>
                  {r.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </DashCard>

      {/* Alerts */}
      <DashCard
        title={t("admin.home.alerts", "Active alerts")}
        href="/admin/moderation"
        hrefLabel={t("admin.home.viewMod", "Review →")}
      >
        {alerts.length === 0 ? (
          <p className="text-sm text-text-muted">
            {t("admin.home.allClear", "All systems nominal.")}
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
              >
                <Badge size="sm" variant={a.variant}>
                  {a.tag}
                </Badge>
                <span className="text-text-primary">{a.message}</span>
              </li>
            ))}
          </ul>
        )}
      </DashCard>
    </div>
  );
}

function Stat({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: "success" | "muted";
}) {
  const color = variant === "success" ? "text-success" : "text-text-primary";
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className={`mt-1 text-2xl font-bold ${color}`}>{value.toLocaleString()}</dd>
    </div>
  );
}

function OpsDownNote() {
  return (
    <p className="text-sm text-text-muted">
      Ops API unavailable. Check{" "}
      <code className="font-mono text-[11px]">VITE_OPS_API_BASE_URL</code>.
    </p>
  );
}

function ServiceBars({ data }: { data: AwsCostsByService | undefined }) {
  if (!data) return <p className="text-sm text-text-muted">No data.</p>;
  const entries = Object.entries(data.byService).map(([svc, usd]) => ({
    svc,
    cents: usdStringToCents(usd),
  }));
  entries.sort((a, b) => b.cents - a.cents);
  const top = entries.slice(0, 5);
  const max = top.length ? top[0]!.cents : 0;
  return (
    <div className="space-y-2">
      <p className="text-2xl font-semibold text-text-primary">${data.totalUsd}</p>
      <ul className="space-y-1">
        {top.map((row) => {
          const pct = max > 0 ? (row.cents / max) * 100 : 0;
          return (
            <li key={row.svc}>
              <div className="flex items-center justify-between text-xs">
                <span className="truncate text-text-secondary">{row.svc}</span>
                <span className="text-text-muted">{centsToUsd(row.cents)}</span>
              </div>
              <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type AlertItem = {
  id: string;
  variant: "warning" | "error" | "info";
  tag: string;
  message: string;
};

function buildAlerts({
  failedJobs24h,
  opsDown,
}: {
  failedJobs24h: number;
  opsDown: boolean;
}): AlertItem[] {
  const items: AlertItem[] = [];
  if (opsDown) {
    items.push({
      id: "ops-down",
      variant: "error",
      tag: "ops",
      message: "Ops API unreachable — cost/revenue/jobs are stale.",
    });
  }
  if (failedJobs24h > 0) {
    items.push({
      id: "failed-jobs",
      variant: "warning",
      tag: "jobs",
      message: `${failedJobs24h} failed job${failedJobs24h === 1 ? "" : "s"} in the last 24h.`,
    });
  }
  return items;
}

export default AdminHomePage;
