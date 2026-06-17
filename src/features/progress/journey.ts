/**
 * Pure transforms for the Journey (progress) page.
 *
 * All inputs come from `ProgressSummary` (GET /progress/me) — no new
 * endpoints. Kept side-effect-free so the heatmap / XP chart / mastery grid
 * are unit-testable without React. See `ProgressPage.tsx` for the wiring.
 */
import type { DayActivity, ConceptRollup } from "@/shared/api/progress";

/** One cell in the activity heatmap. */
export type HeatCell = {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  xpEarned: number;
  lessonsCompleted: number;
  minutesActive: number;
  /** 0 (empty) … 4 (most active) — drives colour intensity. */
  intensity: 0 | 1 | 2 | 3 | 4;
  /** True for filler cells that pad the grid to whole weeks. */
  filler: boolean;
};

/** Heatmap range presets (days back from today; null = all available). */
export type HeatmapRange = "3m" | "6m" | "1y" | "all";

/** Days back per range. `all` returns Infinity (no slice). */
export function rangeDays(range: HeatmapRange): number {
  switch (range) {
    case "3m":
      return 91;
    case "6m":
      return 182;
    case "1y":
      return 365;
    case "all":
      return Number.POSITIVE_INFINITY;
  }
}

/**
 * One month-label tick for the heatmap top axis. `weekIndex` is the grid
 * column (0-based) the label sits above.
 */
export type HeatMonthLabel = { weekIndex: number; label: string };

/** One point on the cumulative-XP area chart. */
export type XpPoint = {
  date: string;
  /** XP earned that day. */
  daily: number;
  /** Running total across the window. */
  cumulative: number;
};

/** One concept's mastery state for the grid. */
export type MasteryCell = {
  conceptId: string;
  label: string;
  encounters: number;
  /** 0–100 accuracy over all encounters. */
  accuracy: number;
  /** 0–100 over the last N recent results (recency-weighted strength). */
  recentStrength: number;
  /** Coarse bucket for colour: weak < fading < solid < strong. */
  tier: "weak" | "fading" | "solid" | "strong";
};

function intensityFor(xp: number, max: number): HeatCell["intensity"] {
  if (xp <= 0 || max <= 0) return 0;
  const ratio = xp / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

function isoOffset(fromIso: string, deltaDays: number): string {
  const d = new Date(`${fromIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

/**
 * MOCK — extend a short real activity window (the server only returns
 * `last30days`) back to a full year so the 3m / 6m / 1y range selector has
 * something to chart. Real days are preserved verbatim; any earlier day not
 * covered by the real window is synthesised with a deterministic,
 * streak-flavoured pattern (seeded off the date so it's stable across renders
 * and SSR). Swap this for a real long-range activity endpoint when one exists.
 *
 * The synthesis is intentionally sparse + weekday-biased so it reads like a
 * believable learning history, not noise. `todayIso` is injectable for tests.
 */
export function extendActivityToYear(
  realDays: DayActivity[],
  todayIso: string,
  spanDays = 365,
): DayActivity[] {
  const byDate = new Map(realDays.map((d) => [d.date, d]));
  // Anchor the window end on the later of today / latest real day so a real
  // day in the "future" relative to a test clock never gets clobbered.
  const latestReal = realDays.reduce(
    (acc, d) => (d.date > acc ? d.date : acc),
    todayIso,
  );
  const out: DayActivity[] = [];
  for (let i = spanDays - 1; i >= 0; i--) {
    const date = isoOffset(latestReal, -i);
    const real = byDate.get(date);
    if (real) {
      out.push(real);
      continue;
    }
    // Deterministic pseudo-random fill. Hash the date → 0..1.
    const seed = hashDate(date);
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    // ~55% active days, lighter on weekends, occasional rest gaps.
    const activeThreshold = dow === 0 || dow === 6 ? 0.6 : 0.42;
    const active = seed > activeThreshold;
    if (!active) {
      out.push({ date, lessonsCompleted: 0, minutesActive: 0, xpEarned: 0 });
      continue;
    }
    const lessons = 1 + Math.floor(seed2(date) * 3); // 1..3
    out.push({
      date,
      lessonsCompleted: lessons,
      minutesActive: lessons * (4 + Math.floor(seed2(date) * 6)),
      xpEarned: lessons * (10 + Math.floor(seed * 25)),
    });
  }
  return out;
}

/** Stable [0,1) hash of a YYYY-MM-DD string (mulberry-ish, deterministic). */
function hashDate(iso: string): number {
  let h = 2166136261;
  for (let i = 0; i < iso.length; i++) {
    h ^= iso.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Second independent stream off the same date for magnitude jitter. */
function seed2(iso: string): number {
  return hashDate(`${iso}#x`);
}

/** Keep only days within `range` of today (today = latest day when omitted). */
export function sliceHeatmapDays(
  days: DayActivity[],
  range: HeatmapRange,
  todayIso?: string,
): DayActivity[] {
  if (days.length === 0) return days;
  const span = rangeDays(range);
  if (!Number.isFinite(span)) return days;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const anchor = todayIso ?? sorted[sorted.length - 1].date;
  const cutoff = isoOffset(anchor, -(span - 1));
  return sorted.filter((d) => d.date >= cutoff && d.date <= anchor);
}

/**
 * Build a GitHub-style heatmap grid from daily activity.
 *
 * Returns cells in column-major weekly order (Sun→Sat rows) padded with
 * leading filler so the first real day lands on its true weekday. The caller
 * renders 7 rows; `weeks` is the column count. `monthLabels` carries the
 * top-axis month ticks (column index → short month name).
 */
export function buildHeatmap(days: DayActivity[]): {
  cells: HeatCell[];
  weeks: number;
  monthLabels: HeatMonthLabel[];
} {
  if (days.length === 0) return { cells: [], weeks: 0, monthLabels: [] };

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const maxXp = Math.max(0, ...sorted.map((d) => d.xpEarned));

  const real: HeatCell[] = sorted.map((d) => ({
    date: d.date,
    xpEarned: d.xpEarned,
    lessonsCompleted: d.lessonsCompleted,
    minutesActive: d.minutesActive,
    intensity: intensityFor(d.xpEarned, maxXp),
    filler: false,
  }));

  // Pad the front so column 0 aligns to the weekday of the first real day.
  // `new Date(iso)` parses YYYY-MM-DD as UTC midnight; getUTCDay keeps it
  // stable regardless of the viewer's timezone.
  const firstDow = new Date(`${real[0].date}T00:00:00Z`).getUTCDay();
  const leading: HeatCell[] = Array.from({ length: firstDow }, () => ({
    date: "",
    xpEarned: 0,
    lessonsCompleted: 0,
    minutesActive: 0,
    intensity: 0 as const,
    filler: true,
  }));

  const cells = [...leading, ...real];
  // Pad the tail to a whole week so the grid is rectangular.
  while (cells.length % 7 !== 0) {
    cells.push({
      date: "",
      xpEarned: 0,
      lessonsCompleted: 0,
      minutesActive: 0,
      intensity: 0,
      filler: true,
    });
  }

  const weeks = cells.length / 7;
  // Month labels: place a tick at the first column whose top non-filler cell
  // (or first dated cell) begins a new month. One label per month, deduped.
  const monthLabels: HeatMonthLabel[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const col = cells.slice(w * 7, w * 7 + 7).filter((c) => !c.filler);
    if (col.length === 0) continue;
    const d = new Date(`${col[0].date}T00:00:00Z`);
    const month = d.getUTCMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        weekIndex: w,
        label: d.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }),
      });
      lastMonth = month;
    }
  }

  return { cells, weeks, monthLabels };
}

/** Cumulative XP series for the area chart. */
export function buildXpSeries(days: DayActivity[]): XpPoint[] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  return sorted.map((d) => {
    running += d.xpEarned;
    return { date: d.date, daily: d.xpEarned, cumulative: running };
  });
}

function tierFor(recentStrength: number, encounters: number): MasteryCell["tier"] {
  if (encounters < 2) return "weak";
  if (recentStrength >= 85) return "strong";
  if (recentStrength >= 60) return "solid";
  if (recentStrength >= 35) return "fading";
  return "weak";
}

/**
 * Shape concept rollups into mastery cells, strongest-first hidden behind a
 * "needs work first" sort so the decay nudge is what the learner sees up top.
 *
 * `labelFor` resolves a human label (kana / meaning) from the concept id;
 * falls back to the raw id when the language can't resolve it.
 */
export function buildMastery(
  concepts: ConceptRollup[],
  labelFor: (conceptId: string) => string,
): MasteryCell[] {
  return concepts
    .map((c) => {
      const total = c.correctCount + c.incorrectCount;
      const accuracy = total > 0 ? Math.round((c.correctCount / total) * 100) : 0;
      const recent = c.recentResults ?? [];
      const recentStrength =
        recent.length > 0
          ? Math.round((recent.filter(Boolean).length / recent.length) * 100)
          : accuracy;
      return {
        conceptId: c.conceptId,
        label: labelFor(c.conceptId),
        encounters: c.encounters,
        accuracy,
        recentStrength,
        tier: tierFor(recentStrength, c.encounters),
      };
    })
    .sort((a, b) => a.recentStrength - b.recentStrength || b.encounters - a.encounters);
}
