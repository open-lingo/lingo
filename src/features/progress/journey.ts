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

/**
 * Build a GitHub-style heatmap grid from daily activity.
 *
 * Returns cells in column-major weekly order (Sun→Sat rows) padded with
 * leading filler so the first real day lands on its true weekday. The caller
 * renders 7 rows; `weeks` is the column count.
 */
export function buildHeatmap(days: DayActivity[]): {
  cells: HeatCell[];
  weeks: number;
} {
  if (days.length === 0) return { cells: [], weeks: 0 };

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

  return { cells, weeks: cells.length / 7 };
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
