import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { buildXpSeries, type XpPoint } from "../journey";
import type { DayActivity } from "@/shared/api/progress";

function tickDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload: XpPoint }>;
};

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs shadow-popover">
      <p className="font-semibold text-text-primary">{tickDate(point.date)}</p>
      <p className="mt-0.5 text-text-secondary">
        +{point.daily} XP · {point.cumulative} total
      </p>
    </div>
  );
}

type Props = {
  days: DayActivity[];
};

/**
 * Cumulative-XP area chart over the activity window. The one place a real
 * charting lib earns its keep (gradient fill + axes + zoom-free hover). All
 * colours come from CSS tokens so it tracks theme switches.
 */
export function XpAreaChart({ days }: Props) {
  const { t } = useTranslation();
  const series = useMemo(() => buildXpSeries(days), [days]);
  const total = series.length > 0 ? series[series.length - 1].cumulative : 0;

  return (
    <Card as="section" aria-label={t("journey.xp.title", "XP over time")}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("journey.xp.title", "XP over time")}
        </h2>
        <span className="text-sm text-text-muted">
          {t("journey.xp.window", "+{{xp}} XP in 30 days", { xp: total })}
        </span>
      </div>

      <div className="mt-4 h-48 w-full">
        {series.length === 0 ? (
          <p className="text-sm text-text-muted">
            {t("journey.xp.empty", "Earn XP to chart your climb.")}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--color-accent))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="rgb(var(--color-accent))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={tickDate}
                tick={{ fontSize: 10, fill: "rgb(var(--color-text-muted))" }}
                tickLine={false}
                axisLine={{ stroke: "rgb(var(--color-border-muted))" }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgb(var(--color-text-muted))" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgb(var(--color-border))" }} />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="rgb(var(--color-accent))"
                strokeWidth={2}
                fill="url(#xpFill)"
                animationDuration={400}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
