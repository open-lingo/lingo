/**
 * AdminInfraHealthPage — Infrastructure Health at /admin/infra.
 *
 * Surfaces the AWS budget + CloudWatch alarm state from lingo-ops
 * (`GET /observability/health`). The budget is the cost tripwire; the alarms
 * list is the operational tripwire (concurrency / Dynamo / billing). Both are
 * defense-in-depth signals from the pre-production security audit.
 *
 * Server-authoritative, read-only, admin-gated (the AdminInnerShell handles
 * the auth gate). Polls on a short staleTime with a manual refresh control.
 */
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/shared/api/provider";
import type {
  AlarmState,
  BudgetStatus,
  ObservabilityBudget,
  ObservabilityHealth,
} from "@/shared/api/ops";
import { Badge, type BadgeVariant } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { cn } from "@/shared/components/ui/cn";

const STALE_MS = 30_000;

// ── Helpers ─────────────────────────────────────────────────────────────────

function usd(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

const BUDGET_META: Record<BudgetStatus, { variant: BadgeVariant; bar: string }> = {
  ok: { variant: "success", bar: "bg-success" },
  warn: { variant: "warning", bar: "bg-warning" },
  exceeded: { variant: "error", bar: "bg-error" },
};

const ALARM_META: Record<AlarmState, { variant: BadgeVariant; icon: IconName; dot: string }> = {
  OK: { variant: "success", icon: "checkCircle", dot: "bg-success" },
  ALARM: { variant: "error", icon: "alertTriangle", dot: "bg-error" },
  INSUFFICIENT_DATA: { variant: "neutral", icon: "help", dot: "bg-text-muted" },
};

// ── Budget card ─────────────────────────────────────────────────────────────

function BudgetCard({ budget }: { budget: ObservabilityBudget | null }) {
  const { t } = useTranslation();

  if (!budget) {
    return (
      <Card padding="md">
        <div className="mb-3 flex items-center gap-2">
          <Icon name="gauge" size={16} aria-hidden className="text-text-muted" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("admin.infra.budget.heading", "AWS budget")}
          </h2>
        </div>
        <p className="text-sm text-text-muted">
          {t("admin.infra.budget.unavailable", "Budget data unavailable.")}
        </p>
      </Card>
    );
  }

  const meta = BUDGET_META[budget.status];
  const pct = Math.max(0, budget.percent_used);
  const statusLabel = t(`admin.infra.budget.status.${budget.status}`, budget.status);

  return (
    <Card padding="md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="gauge" size={16} aria-hidden className="text-text-muted" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("admin.infra.budget.heading", "AWS budget")}
          </h2>
        </div>
        <Badge size="sm" variant={meta.variant}>
          {statusLabel}
        </Badge>
      </div>

      <p className="text-sm font-medium text-text-primary">{budget.name}</p>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-text-primary">
          {usd(budget.actual_usd)}
        </span>
        <span className="text-sm text-text-muted">
          {t("admin.infra.budget.ofLimit", "of {{limit}}", { limit: usd(budget.limit_usd) })}
        </span>
      </div>

      {/* Percent-used gauge bar */}
      <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("admin.infra.budget.percentUsed", "{{pct}}% of budget used", {
          pct: Math.round(pct),
        })}
      >
        <div
          className={cn("h-full rounded-full transition-all", meta.bar)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            {t("admin.infra.budget.percentUsedLabel", "Used")}
          </dt>
          <dd className="tabular-nums text-text-primary">{pct.toFixed(1)}%</dd>
        </div>
        {budget.forecast_usd !== null && (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              {t("admin.infra.budget.forecast", "Forecast")}
            </dt>
            <dd className="tabular-nums text-text-primary">{usd(budget.forecast_usd)}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}

// ── Alarms card ─────────────────────────────────────────────────────────────

function AlarmsCard({ alarms }: { alarms: ObservabilityHealth["alarms"] }) {
  const { t } = useTranslation();

  return (
    <Card padding="md">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="activity" size={16} aria-hidden className="text-text-muted" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t("admin.infra.alarms.heading", "CloudWatch alarms")}
        </h2>
      </div>

      {alarms.length === 0 ? (
        <EmptyState
          icon={<Icon name="checkCircle" size={28} aria-hidden />}
          title={t("admin.infra.alarms.emptyTitle", "No alarms configured")}
          description={t(
            "admin.infra.alarms.emptyDesc",
            "No CloudWatch alarms are reporting state yet.",
          )}
        />
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-text-muted">
                <th className="py-2 pr-3 font-semibold">{t("admin.infra.alarms.colName", "Alarm")}</th>
                <th className="py-2 pr-3 font-semibold">{t("admin.infra.alarms.colState", "State")}</th>
                <th className="py-2 pr-3 font-semibold">{t("admin.infra.alarms.colMetric", "Metric")}</th>
                <th className="py-2 pr-3 font-semibold">
                  {t("admin.infra.alarms.colDescription", "Description")}
                </th>
                <th className="py-2 font-semibold">{t("admin.infra.alarms.colUpdated", "Updated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alarms.map((alarm) => {
                const meta = ALARM_META[alarm.state];
                const stateLabel = t(`admin.infra.alarms.state.${alarm.state}`, alarm.state);
                return (
                  <tr key={alarm.name}>
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn("inline-block h-2 w-2 shrink-0 rounded-full", meta.dot)}
                          aria-hidden
                        />
                        <span className="font-medium text-text-primary">{alarm.name}</span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge
                        size="sm"
                        variant={meta.variant}
                        leading={<Icon name={meta.icon} size={12} aria-hidden />}
                      >
                        {stateLabel}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="font-mono text-xs text-text-secondary">{alarm.metric}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-text-secondary">{alarm.description}</td>
                    <td className="py-2.5 whitespace-nowrap text-xs text-text-muted">
                      {formatTimestamp(alarm.updated_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export function AdminInfraHealthPage() {
  const { t } = useTranslation();
  const { ops } = useApi();

  const health = useQuery<ObservabilityHealth>({
    queryKey: ["ops", "observability", "health"],
    queryFn: () => ops.getObservabilityHealth(),
    staleTime: STALE_MS,
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("admin.infra.title", "Infrastructure Health")}
          </h1>
          <p className="text-sm text-text-muted">
            {t("admin.infra.subtitle", "AWS budget usage and CloudWatch alarm state.")}
            {health.data?.generated_at && (
              <>
                {" · "}
                {t("admin.infra.generatedAt", "as of {{time}}", {
                  time: formatTimestamp(health.data.generated_at),
                })}
              </>
            )}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => health.refetch()}
          disabled={health.isFetching}
        >
          <Icon
            name="refresh"
            size={16}
            aria-hidden
            className={health.isFetching ? "animate-spin" : undefined}
          />
          {t("admin.infra.refresh", "Refresh")}
        </Button>
      </div>

      {health.isError ? (
        <Card padding="md">
          <div className="flex items-start gap-3">
            <Icon name="alertTriangle" size={20} aria-hidden className="mt-0.5 text-error" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                {t("admin.infra.error.title", "Infrastructure health unavailable")}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {t(
                  "admin.infra.error.desc",
                  "Could not reach the ops API. Confirm lingo-ops is running and VITE_OPS_API_BASE_URL is set.",
                )}
              </p>
            </div>
          </div>
        </Card>
      ) : health.isLoading ? (
        <p className="text-sm text-text-muted">{t("common.loading", "Loading…")}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <BudgetCard budget={health.data?.budget ?? null} />
          </div>
          <div className="lg:col-span-2">
            <AlarmsCard alarms={health.data?.alarms ?? []} />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInfraHealthPage;
