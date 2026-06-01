/**
 * AdminHomePage — full-width dashboard hub at /admin/home.
 *
 * No sidebar — this IS the landing for all admin work and the only
 * navigation surface for the admin area. Every inner /admin/* route is a
 * leaf; reach them via the nav-cards grid below or content cross-links
 * (e.g. an event row linking to /admin/users/:id).
 *
 * Sections:
 *   1. Header — "Admin" heading + current admin's display name
 *   2. Metrics strip — user count, events last 24h, pending moderation,
 *      failed jobs (24h)
 *   3. Navigation cards — one card per top-level surface. We don't have
 *      sub-tab cards: if it's a tab inside a page, the page-level card
 *      covers it.
 *   4. Recent events strip — last 5 events + "See all" link
 *   5. 7-day events chart — vanilla SVG bar chart from events data
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Activity,
  ShieldCheck,
  Wrench,
  BookOpen,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

import { useApi } from "@/shared/api/provider";
import { useAuth } from "@/shared/auth/useAuth";
import type { AdminUserStats } from "@/shared/api/admin";
import type { JobsSummaryResponse } from "@/shared/api/ops";
import type { EventListResponse } from "@/features/admin/events/types";
import { Badge } from "@/shared/components/ui/Badge";
import { Card } from "@/shared/components/ui/Card";
import { NavCard } from "@/shared/components/ui/NavCard";
import { cn } from "@/shared/components/ui/cn";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}

function isoToDate(iso: string): string {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

// ── Metrics strip ─────────────────────────────────────────────────────────────

type MetricCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "success" | "error";
};

function MetricCard({ label, value, sub, icon, variant = "default" }: MetricCardProps) {
  const iconBg = {
    default: "bg-accent-muted text-accent",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/15 text-success",
    error: "bg-error/15 text-error",
  }[variant];

  const valueCls = {
    default: "text-text-primary",
    warning: "text-warning",
    success: "text-success",
    error: "text-error",
  }[variant];

  return (
    <Card padding="md" className="flex items-center gap-4">
      <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconBg)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
        <p className={cn("text-2xl font-bold tabular-nums", valueCls)}>{value}</p>
        {sub && <p className="text-xs text-text-muted">{sub}</p>}
      </div>
    </Card>
  );
}

// ── 7-day SVG bar chart ───────────────────────────────────────────────────────

function EventsBarChart({ events }: { events: EventListResponse | undefined }) {
  const data = useMemo(() => {
    if (!events?.items.length) return [];
    const counts: Record<string, number> = {};
    for (const e of events.items) {
      const day = isoToDate(e.receivedAt);
      counts[day] = (counts[day] ?? 0) + 1;
    }
    // Build 7-day window ending today
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        count: counts[key] ?? 0,
      });
    }
    return days;
  }, [events]);

  if (!data.length) {
    return <p className="text-sm text-text-muted">No event data for chart.</p>;
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const chartH = 80;
  const barW = 28;
  const gap = 8;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalW} ${chartH + 20}`}
        width={totalW}
        height={chartH + 20}
        aria-label="Events per day (last 7 days)"
        role="img"
        className="block"
      >
        {data.map((d, i) => {
          const barH = max > 0 ? Math.max(2, (d.count / max) * chartH) : 2;
          const x = i * (barW + gap);
          const y = chartH - barH;
          return (
            <g key={d.label}>
              <title>{`${d.label}: ${d.count} event${d.count === 1 ? "" : "s"}`}</title>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                className="fill-accent opacity-80"
              />
              <text
                x={x + barW / 2}
                y={chartH + 14}
                textAnchor="middle"
                fontSize={9}
                className="fill-text-muted"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminHomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { admin, ops, decks: decksApi } = useApi();

  // ── Data fetching ────────────────────────────────────────────────────────
  const userStats = useQuery<AdminUserStats>({
    queryKey: ["admin", "stats", "users", 7],
    queryFn: () => admin.getUserStats(7),
    staleTime: 60_000,
  });

  const jobsSummary = useQuery<JobsSummaryResponse>({
    queryKey: ["ops", "jobs", "summary"],
    queryFn: () => ops.getJobsSummary(),
    staleTime: 60_000,
  });

  // Events: fetch enough for the 7-day chart + recent strip
  const since7d = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }, []);

  const recentEvents = useQuery<EventListResponse>({
    queryKey: ["ops", "events", "dashboard", since7d],
    queryFn: () => ops.listEvents({ since: since7d, limit: 200 }),
    staleTime: 30_000,
  });

  // Recent 5 events for the strip (sorted newest-first from list)
  const last5Events = useMemo(
    () =>
      [...(recentEvents.data?.items ?? [])]
        .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
        .slice(0, 5),
    [recentEvents.data],
  );

  // Events in the last 24h (subset of the 7d fetch)
  const events24h = useMemo(() => {
    const cutoff = Date.now() - 86_400_000;
    return (recentEvents.data?.items ?? []).filter(
      (e) => new Date(e.receivedAt).getTime() >= cutoff,
    ).length;
  }, [recentEvents.data]);

  // Pending moderation items — draft decks (non-vocab) + draft stories
  const pendingDecksQuery = useQuery({
    queryKey: ["admin", "dashboard", "pendingDecks"],
    queryFn: async () => {
      const items = await decksApi.listAdminDecks({ status: "draft" });
      return items.filter((d) => !d.id.startsWith("vocab-")).length;
    },
    staleTime: 60_000,
  });

  const pendingStoriesQuery = useQuery({
    queryKey: ["admin", "dashboard", "pendingStories"],
    queryFn: async () => {
      const items = await admin.listStories({ status: "draft" });
      return items.length;
    },
    staleTime: 60_000,
  });

  const pendingTotal =
    pendingDecksQuery.data !== undefined && pendingStoriesQuery.data !== undefined
      ? pendingDecksQuery.data + pendingStoriesQuery.data
      : null;

  const failed24h = jobsSummary.data?.last24h.failed ?? 0;
  const adminDisplayName = user?.name ?? user?.email ?? "Admin";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Admin</h1>
        <p className="mt-1 text-text-muted">
          Welcome back, {adminDisplayName}
        </p>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Total users"
          value={userStats.isLoading ? "—" : (userStats.data?.total ?? "—").toLocaleString()}
          sub={
            userStats.data
              ? `${userStats.data.new_since} new last 7d`
              : undefined
          }
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Events (24h)"
          value={recentEvents.isLoading ? "—" : events24h.toLocaleString()}
          icon={<Activity size={20} />}
        />
        <MetricCard
          label="Pending review"
          value={pendingTotal === null ? "—" : pendingTotal.toLocaleString()}
          sub="decks + stories"
          icon={<ShieldCheck size={20} />}
          variant={pendingTotal !== null && pendingTotal > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Failed jobs (24h)"
          value={jobsSummary.isLoading ? "—" : failed24h.toLocaleString()}
          icon={failed24h > 0 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          variant={failed24h > 0 ? "error" : "success"}
        />
      </div>

      {/* Navigation cards — one card per top-level surface. Each card is
          the entry point for its area; tabs/sub-pages live inside. */}
      <section aria-labelledby="nav-cards-heading">
        <h2
          id="nav-cards-heading"
          className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
        >
          Admin sections
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <NavCard
            to="/admin/users"
            title="Users"
            description="Browse, search, and manage user accounts."
            icon={<Users size={20} />}
          />
          <NavCard
            to="/admin/moderation"
            title="Moderation"
            description="Review pending decks, stories, reports, and bans."
            icon={<ShieldCheck size={20} />}
            count={pendingTotal ?? undefined}
          />
          <NavCard
            to="/admin/ops"
            title="Operations"
            description="Costs, revenue, subscriptions, ads, jobs, and the audit log."
            icon={<Wrench size={20} />}
          />
          <NavCard
            to="/admin/events"
            title="Events"
            description="Inspect the real-time event stream and handler outcomes."
            icon={<Activity size={20} />}
          />
          <NavCard
            to="/admin/content/lessons"
            title="Content"
            description="Author lessons; review and manage decks and stories."
            icon={<BookOpen size={20} />}
          />
          <NavCard
            to="/admin/lms"
            title="LMS"
            description="Per-user learning-state moderation tool."
            icon={<BookOpen size={20} />}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent events strip */}
        <section aria-labelledby="recent-events-heading">
          <Card padding="md" className="h-full">
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="recent-events-heading"
                className="text-xs font-semibold uppercase tracking-wide text-text-muted"
              >
                Recent events
              </h2>
              <Link
                to="/admin/events"
                className="text-xs font-medium text-accent hover:underline"
              >
                See all →
              </Link>
            </div>
            {recentEvents.isLoading ? (
              <p className="text-sm text-text-muted">{t("common.loading")}</p>
            ) : last5Events.length === 0 ? (
              <p className="text-sm text-text-muted">No events yet.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {last5Events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-mono text-xs text-text-primary">{e.eventType}</span>
                      <span className="ml-2 text-xs text-text-muted">
                        {e.userId.slice(0, 8)}…
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">
                      {formatRelative(e.receivedAt)}
                    </span>
                    <Badge
                      size="sm"
                      variant={
                        e.status === "ok"
                          ? "success"
                          : e.status === "failed"
                            ? "error"
                            : "info"
                      }
                    >
                      {e.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* 7-day events chart */}
        <section aria-labelledby="events-chart-heading">
          <Card padding="md" className="h-full">
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="events-chart-heading"
                className="text-xs font-semibold uppercase tracking-wide text-text-muted"
              >
                Events per day (7d)
              </h2>
            </div>
            {recentEvents.isLoading ? (
              <p className="text-sm text-text-muted">{t("common.loading")}</p>
            ) : (
              <EventsBarChart events={recentEvents.data} />
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}

export default AdminHomePage;
