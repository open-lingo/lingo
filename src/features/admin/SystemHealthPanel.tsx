/**
 * SystemHealthPanel — live service health strip for the admin home page.
 *
 * Pings each backend service and reports status + latency:
 *   - lingo-core  → GET {VITE_API_BASE_URL}/health        (public, no auth)
 *   - lingo-ops   → GET {VITE_OPS_API_BASE_URL}/health    (public, no auth)
 *   - lingo-async → no HTTP surface (SQS-driven Lambda), so its health is
 *     inferred from the event log: the most recent event's status + age.
 *     A recent "ok" event proves the whole pipeline (publish → SQS →
 *     lingo-async → event log) is functioning.
 *   - web/CDN     → implicit: if you're reading this page, S3+CloudFront work.
 *
 * Health pings bypass the ApiClient on purpose — raw fetch with a timeout —
 * so an auth/token problem can't masquerade as an outage (and vice versa).
 */
import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/shared/api/provider";
import type { EventListResponse } from "@/features/admin/events/types";
import { Badge } from "@/shared/components/ui/Badge";
import { Card } from "@/shared/components/ui/Card";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";

// ── Config ────────────────────────────────────────────────────────────────────

const CORE_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";
const OPS_BASE =
  (import.meta.env.VITE_OPS_API_BASE_URL as string | undefined) ?? "http://localhost:8001";

const PING_TIMEOUT_MS = 8_000;
const REFRESH_INTERVAL_MS = 30_000;
/** Events older than this make async health "unknown" rather than "ok" —
 * no recent traffic isn't an outage, but it isn't proof of life either. */
const ASYNC_STALE_MS = 24 * 60 * 60 * 1000;

// ── Types ─────────────────────────────────────────────────────────────────────

type HealthStatus = "ok" | "down" | "degraded" | "unknown" | "checking";

type ServiceHealth = {
  status: HealthStatus;
  latencyMs?: number;
  detail?: string;
};

// ── Pinging ───────────────────────────────────────────────────────────────────

async function pingHealth(baseUrl: string): Promise<ServiceHealth> {
  const url = `${baseUrl.replace(/\/$/, "")}/health`;
  const started = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - started);
    if (res.ok) return { status: "ok", latencyMs };
    return { status: "down", latencyMs, detail: `HTTP ${res.status}` };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - started);
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return {
      status: "down",
      latencyMs,
      detail: aborted ? `timeout after ${PING_TIMEOUT_MS / 1000}s` : "network error",
    };
  }
}

/** Async health from the event log: most recent event's status + age. */
function asyncHealthFromEvents(events: EventListResponse | undefined, errored: boolean): ServiceHealth {
  if (errored) return { status: "unknown", detail: "event log unreachable" };
  const latest = events?.items?.[0];
  if (!latest) return { status: "unknown", detail: "no events yet" };

  const ageMs = Date.now() - new Date(latest.receivedAt).getTime();
  const ageLabel =
    ageMs < 60_000
      ? "just now"
      : ageMs < 3_600_000
        ? `${Math.floor(ageMs / 60_000)}m ago`
        : ageMs < 86_400_000
          ? `${Math.floor(ageMs / 3_600_000)}h ago`
          : `${Math.floor(ageMs / 86_400_000)}d ago`;

  if (latest.status === "failed") {
    return { status: "degraded", detail: `last event failed (${ageLabel})` };
  }
  if (ageMs > ASYNC_STALE_MS) {
    return { status: "unknown", detail: `no events since ${ageLabel}` };
  }
  return { status: "ok", detail: `last event ${ageLabel}` };
}

// ── Presentation ──────────────────────────────────────────────────────────────

const STATUS_META: Record<HealthStatus, { label: string; variant: "success" | "error" | "warning" | "neutral" | "info"; dot: string }> = {
  ok: { label: "Operational", variant: "success", dot: "bg-success" },
  down: { label: "Down", variant: "error", dot: "bg-error" },
  degraded: { label: "Degraded", variant: "warning", dot: "bg-warning" },
  unknown: { label: "Unknown", variant: "neutral", dot: "bg-text-muted" },
  checking: { label: "Checking…", variant: "info", dot: "bg-info animate-pulse" },
};

type ServiceRowProps = {
  name: string;
  description: string;
  health: ServiceHealth;
};

function ServiceRow({ name, description, health }: ServiceRowProps) {
  const meta = STATUS_META[health.status];
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", meta.dot)}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">{name}</p>
          <p className="truncate text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {health.latencyMs !== undefined && health.status === "ok" && (
          <span className="text-xs tabular-nums text-text-muted">{health.latencyMs}ms</span>
        )}
        {health.detail && health.status !== "ok" && (
          <span className="hidden text-xs text-text-muted sm:inline">{health.detail}</span>
        )}
        {health.detail && health.status === "ok" && health.latencyMs === undefined && (
          <span className="hidden text-xs text-text-muted sm:inline">{health.detail}</span>
        )}
        <Badge size="sm" variant={meta.variant}>
          {meta.label}
        </Badge>
      </div>
    </li>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SystemHealthPanel() {
  const { ops } = useApi();

  const coreHealth = useQuery<ServiceHealth>({
    queryKey: ["health", "lingo-core"],
    queryFn: () => pingHealth(CORE_BASE),
    refetchInterval: REFRESH_INTERVAL_MS,
    staleTime: REFRESH_INTERVAL_MS,
    retry: false,
  });

  const opsHealth = useQuery<ServiceHealth>({
    queryKey: ["health", "lingo-ops"],
    queryFn: () => pingHealth(OPS_BASE),
    refetchInterval: REFRESH_INTERVAL_MS,
    staleTime: REFRESH_INTERVAL_MS,
    retry: false,
  });

  // lingo-async: no HTTP endpoint — most recent event in the log is the signal.
  const latestEvent = useQuery<EventListResponse>({
    queryKey: ["health", "lingo-async", "latest-event"],
    queryFn: () => ops.listEvents({ limit: 1 }),
    refetchInterval: REFRESH_INTERVAL_MS,
    staleTime: REFRESH_INTERVAL_MS,
    retry: false,
  });

  const core: ServiceHealth = coreHealth.isLoading ? { status: "checking" } : (coreHealth.data ?? { status: "unknown" });
  const opsSvc: ServiceHealth = opsHealth.isLoading ? { status: "checking" } : (opsHealth.data ?? { status: "unknown" });
  const asyncSvc: ServiceHealth = latestEvent.isLoading
    ? { status: "checking" }
    : asyncHealthFromEvents(latestEvent.data, latestEvent.isError);

  const services = [core, opsSvc, asyncSvc];
  const allOk = services.every((s) => s.status === "ok");
  const anyDown = services.some((s) => s.status === "down" || s.status === "degraded");

  return (
    <Card padding="md">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          System health
        </h2>
        <div className="flex items-center gap-2">
          {allOk ? (
            <Badge size="sm" variant="success" leading={<Icon name="checkCircle" size={12} aria-hidden />}>
              All systems go
            </Badge>
          ) : anyDown ? (
            <Badge size="sm" variant="error" leading={<Icon name="alertTriangle" size={12} aria-hidden />}>
              Issues detected
            </Badge>
          ) : (
            <Badge size="sm" variant="neutral">Partial data</Badge>
          )}
        </div>
      </div>

      <ul className="divide-y divide-border">
        <ServiceRow
          name="lingo-core"
          description="Main API — lessons, decks, users, SRS"
          health={core}
        />
        <ServiceRow
          name="lingo-ops"
          description="Ops API — finance, jobs, events, audit"
          health={opsSvc}
        />
        <ServiceRow
          name="lingo-async"
          description="Event worker (SQS) — quests, leaderboards, XP"
          health={asyncSvc}
        />
        <ServiceRow
          name="web / CDN"
          description="S3 + CloudFront static hosting"
          // If this page rendered, the CDN delivered it.
          health={{ status: "ok", detail: "serving this page" }}
        />
      </ul>
    </Card>
  );
}

export default SystemHealthPanel;
