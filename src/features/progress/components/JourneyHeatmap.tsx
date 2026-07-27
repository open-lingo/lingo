import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, SegmentedControl } from "@/shared/components/ui";
import {
  buildHeatmap,
  extendActivityToYear,
  sliceHeatmapDays,
  type HeatCell,
  type HeatmapRange,
} from "../journey";
import type { DayActivity } from "@/shared/api/progress";

/** Accent opacity per intensity bucket — empty days read as faint outlines. */
const INTENSITY_OPACITY = [0, 0.22, 0.45, 0.7, 1] as const;
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const RANGES: HeatmapRange[] = ["3m", "6m", "1y", "all"];

function formatDate(iso: string): string {
  // Parse as UTC so the label matches the bucket, not the viewer's tz.
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  /** Real daily activity from ProgressSummary (server returns last30days). */
  days: DayActivity[];
};

/**
 * GitHub-contribution-style activity calendar with a range selector.
 *
 * REAL completion days come straight from `days`; everything earlier than the
 * server window is MOCK-filled by `extendActivityToYear` (deterministic,
 * centralised + commented in `journey.ts`) so the 3m/6m/1y/All selector has a
 * believable history to slice. Range slicing + the column/row grid build are
 * pure (`sliceHeatmapDays` + `buildHeatmap`) and unit-tested.
 */
export function JourneyHeatmap({ days }: Props) {
  const { t } = useTranslation();
  const [range, setRange] = useState<HeatmapRange>("6m");
  const [active, setActive] = useState<HeatCell | null>(null);

  const today = useMemo(() => todayIso(), []);

  // Extend the short real window to a full year once, then slice per range.
  const yearDays = useMemo(
    () => extendActivityToYear(days, today),
    [days, today],
  );
  const sliced = useMemo(
    () => sliceHeatmapDays(yearDays, range, today),
    [yearDays, range, today],
  );
  const { cells, weeks, monthLabels } = useMemo(
    () => buildHeatmap(sliced),
    [sliced],
  );

  const activeDays = sliced.filter(
    (d) => d.xpEarned > 0 || d.lessonsCompleted > 0,
  ).length;

  const rangeLabel: Record<HeatmapRange, string> = {
    "3m": t("journey.activity.range.3m", { defaultValue: "3m" }),
    "6m": t("journey.activity.range.6m", { defaultValue: "6m" }),
    "1y": t("journey.activity.range.1y", { defaultValue: "1y" }),
    all: t("journey.activity.range.all", { defaultValue: "All" }),
  };

  return (
    <Card as="section" aria-label={t("journey.activity.title", { defaultValue: "Activity" })}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {t("journey.activity.title", { defaultValue: "Activity" })}
          </h2>
          <p className="mt-0.5 text-sm text-text-muted">
            {t("journey.activity.activeDays", {
              defaultValue: "{{count}} active days",
              count: activeDays,
            })}
          </p>
        </div>
        <SegmentedControl<HeatmapRange>
          value={range}
          onChange={setRange}
          size="sm"
          ariaLabel={t("journey.activity.rangeAria", { defaultValue: "Activity range" })}
          options={RANGES.map((r) => ({ value: r, label: rangeLabel[r] }))}
        />
      </div>

      {cells.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          {t("journey.activity.empty", {
            defaultValue: "Complete a lesson to start your calendar.",
          })}
        </p>
      ) : (
        <>
          {/* Scroll wrapper so a full year of columns stays usable on mobile. */}
          <div className="mt-4 overflow-x-auto pb-1">
            <div className="inline-flex min-w-full flex-col gap-1">
              {/* Month-label axis */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `18px repeat(${weeks}, minmax(10px, 1fr))`,
                }}
                aria-hidden
              >
                <span />
                {Array.from({ length: weeks }, (_, w) => {
                  const tick = monthLabels.find((m) => m.weekIndex === w);
                  return (
                    <span
                      key={w}
                      className="text-[9px] leading-none text-text-muted"
                    >
                      {tick ? tick.label : ""}
                    </span>
                  );
                })}
              </div>

              <div className="flex gap-1">
                {/* Weekday axis */}
                <div className="flex w-[18px] flex-col justify-between py-0.5">
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
                  aria-label={t("journey.activity.gridLabel", {
                    defaultValue: "Daily activity heatmap",
                  })}
                >
                  {cells.map((cell, i) =>
                    cell.filler ? (
                      <span key={i} aria-hidden />
                    ) : (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setActive(active?.date === cell.date ? null : cell)
                        }
                        onMouseEnter={() => setActive(cell)}
                        onFocus={() => setActive(cell)}
                        className="rounded-[3px] border border-border-muted transition-transform hover:scale-110 focus-visible:scale-110"
                        style={{
                          backgroundColor: "rgb(var(--color-accent))",
                          opacity: INTENSITY_OPACITY[cell.intensity] || 0.12,
                        }}
                        aria-label={`${formatDate(cell.date)}: ${cell.xpEarned} XP, ${cell.lessonsCompleted} lessons`}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detail line + legend */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-text-secondary" aria-live="polite">
              {active ? (
                <>
                  <span className="font-semibold text-text-primary">
                    {formatDate(active.date)}
                  </span>
                  {" — "}
                  {t("journey.activity.detail", {
                    defaultValue: "{{xp}} XP · {{lessons}} lessons · {{min}} min",
                    xp: active.xpEarned,
                    lessons: active.lessonsCompleted,
                    min: active.minutesActive,
                  })}
                </>
              ) : (
                t("journey.activity.hint", { defaultValue: "Hover a day for details" })
              )}
            </p>
            <div className="flex items-center gap-1" aria-hidden>
              <span className="text-[10px] text-text-muted">
                {t("journey.activity.less", { defaultValue: "Less" })}
              </span>
              {INTENSITY_OPACITY.map((o, i) => (
                <span
                  key={i}
                  className="h-3 w-3 rounded-[3px] border border-border-muted"
                  style={{ backgroundColor: "rgb(var(--color-accent))", opacity: o || 0.12 }}
                />
              ))}
              <span className="text-[10px] text-text-muted">
                {t("journey.activity.more", { defaultValue: "More" })}
              </span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
