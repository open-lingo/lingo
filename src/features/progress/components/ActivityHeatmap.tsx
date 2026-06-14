import { useMemo, useState } from "react";
import { Card } from "@/shared/components/ui";
import { useTranslation } from "react-i18next";
import { buildHeatmap, type HeatCell } from "../journey";
import type { DayActivity } from "@/shared/api/progress";

/** Accent opacity per intensity bucket — empty days read as faint outlines. */
const INTENSITY_OPACITY = [0, 0.22, 0.45, 0.7, 1] as const;
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function formatDate(iso: string): string {
  // Parse as UTC so the label matches the bucket, not the viewer's tz.
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

type Props = {
  days: DayActivity[];
};

/**
 * GitHub-contribution-style activity calendar. Hand-rolled (no chart lib) so
 * it stays playful and on-token. Colour = XP intensity that day; tap/hover a
 * cell for the day's detail. Reads `last30days` from ProgressSummary.
 */
export function ActivityHeatmap({ days }: Props) {
  const { t } = useTranslation();
  const { cells, weeks } = useMemo(() => buildHeatmap(days), [days]);
  const [active, setActive] = useState<HeatCell | null>(null);

  const activeDays = days.filter((d) => d.xpEarned > 0 || d.lessonsCompleted > 0).length;

  if (cells.length === 0) {
    return (
      <Card as="section" aria-label={t("journey.activity.title", "Activity")}>
        <h2 className="text-lg font-semibold text-text-primary">
          {t("journey.activity.title", "Activity")}
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {t("journey.activity.empty", "Complete a lesson to start your calendar.")}
        </p>
      </Card>
    );
  }

  return (
    <Card as="section" aria-label={t("journey.activity.title", "Activity")}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("journey.activity.title", "Activity")}
        </h2>
        <span className="text-sm text-text-muted">
          {t("journey.activity.activeDays", "{{count}} active days", { count: activeDays })}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        {/* Weekday axis */}
        <div className="flex flex-col justify-between py-0.5 pr-1">
          {WEEKDAY_LABELS.map((d, i) => (
            <span
              key={i}
              className="text-[9px] leading-[14px] text-text-muted"
              aria-hidden
              style={{ height: 14 }}
            >
              {i % 2 === 1 ? d : ""}
            </span>
          ))}
        </div>

        {/* Grid: columns = weeks, rows = weekdays */}
        <div
          className="grid flex-1 grid-flow-col gap-1"
          style={{
            gridTemplateRows: "repeat(7, 14px)",
            gridTemplateColumns: `repeat(${weeks}, minmax(10px, 1fr))`,
          }}
          role="img"
          aria-label={t("journey.activity.gridLabel", "Daily activity over the last 30 days")}
        >
          {cells.map((cell, i) =>
            cell.filler ? (
              <span key={i} aria-hidden />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => setActive(active?.date === cell.date ? null : cell)}
                onMouseEnter={() => setActive(cell)}
                onFocus={() => setActive(cell)}
                className="rounded-[3px] border border-border-muted transition-transform hover:scale-110 focus-visible:scale-110"
                style={{
                  backgroundColor: "var(--color-accent)",
                  opacity: INTENSITY_OPACITY[cell.intensity] || 0.12,
                }}
                aria-label={`${formatDate(cell.date)}: ${cell.xpEarned} XP, ${cell.lessonsCompleted} lessons`}
              />
            ),
          )}
        </div>
      </div>

      {/* Detail line + legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-text-secondary" aria-live="polite">
          {active ? (
            <>
              <span className="font-semibold text-text-primary">{formatDate(active.date)}</span>
              {" — "}
              {t("journey.activity.detail", "{{xp}} XP · {{lessons}} lessons · {{min}} min", {
                xp: active.xpEarned,
                lessons: active.lessonsCompleted,
                min: active.minutesActive,
              })}
            </>
          ) : (
            t("journey.activity.hint", "Hover a day for details")
          )}
        </p>
        <div className="flex items-center gap-1" aria-hidden>
          <span className="text-[10px] text-text-muted">{t("journey.activity.less", "Less")}</span>
          {INTENSITY_OPACITY.map((o, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-[3px] border border-border-muted"
              style={{ backgroundColor: "var(--color-accent)", opacity: o || 0.12 }}
            />
          ))}
          <span className="text-[10px] text-text-muted">{t("journey.activity.more", "More")}</span>
        </div>
      </div>
    </Card>
  );
}
