import { describe, it, expect } from "vitest";
import { buildHeatmap, buildXpSeries, buildMastery } from "./journey";
import type { DayActivity, ConceptRollup } from "@/shared/api/progress";

function day(date: string, xp: number, lessons = 0, minutes = 0): DayActivity {
  return { date, xpEarned: xp, lessonsCompleted: lessons, minutesActive: minutes };
}

describe("buildHeatmap", () => {
  it("returns empty for no days", () => {
    expect(buildHeatmap([])).toEqual({ cells: [], weeks: 0 });
  });

  it("pads to whole weeks and aligns first cell to its weekday", () => {
    // 2026-06-01 is a Monday (UTC) → dow 1 → 1 leading filler.
    const { cells, weeks } = buildHeatmap([day("2026-06-01", 10)]);
    expect(cells.length % 7).toBe(0);
    expect(weeks).toBe(1);
    expect(cells[0].filler).toBe(true);
    expect(cells[1].filler).toBe(false);
    expect(cells[1].date).toBe("2026-06-01");
  });

  it("scales intensity by xp relative to the busiest day", () => {
    const { cells } = buildHeatmap([
      day("2026-06-01", 0),
      day("2026-06-02", 100),
      day("2026-06-03", 10),
    ]);
    const real = cells.filter((c) => !c.filler);
    expect(real[0].intensity).toBe(0); // 0 xp
    expect(real[1].intensity).toBe(4); // max
    expect(real[2].intensity).toBe(1); // 10% of max
  });

  it("sorts unsorted input by date", () => {
    const { cells } = buildHeatmap([day("2026-06-03", 5), day("2026-06-01", 5)]);
    const real = cells.filter((c) => !c.filler);
    expect(real[0].date).toBe("2026-06-01");
    expect(real[1].date).toBe("2026-06-03");
  });
});

describe("buildXpSeries", () => {
  it("accumulates daily xp into a running total", () => {
    const series = buildXpSeries([
      day("2026-06-01", 10),
      day("2026-06-02", 20),
      day("2026-06-03", 5),
    ]);
    expect(series.map((p) => p.cumulative)).toEqual([10, 30, 35]);
    expect(series.map((p) => p.daily)).toEqual([10, 20, 5]);
  });
});

describe("buildMastery", () => {
  const id = (s: string) => `label:${s}`;

  function concept(over: Partial<ConceptRollup>): ConceptRollup {
    return {
      conceptId: "c1",
      encounters: 5,
      correctCount: 4,
      incorrectCount: 1,
      recentResults: [true, true, true, false],
      firstSeenAt: "2026-06-01",
      lastSeenAt: "2026-06-10",
      ...over,
    };
  }

  it("computes accuracy and recent strength", () => {
    const [m] = buildMastery([concept({})], id);
    expect(m.accuracy).toBe(80); // 4/5
    expect(m.recentStrength).toBe(75); // 3/4 recent
    expect(m.label).toBe("label:c1");
    expect(m.tier).toBe("solid");
  });

  it("flags low-encounter concepts as weak regardless of accuracy", () => {
    const [m] = buildMastery(
      [concept({ encounters: 1, correctCount: 1, incorrectCount: 0, recentResults: [true] })],
      id,
    );
    expect(m.tier).toBe("weak");
  });

  it("sorts weakest recent-strength first so decay surfaces at the top", () => {
    const sorted = buildMastery(
      [
        concept({ conceptId: "strong", recentResults: [true, true, true, true] }),
        concept({ conceptId: "weak", recentResults: [false, false, false, true] }),
      ],
      id,
    );
    expect(sorted[0].conceptId).toBe("weak");
    expect(sorted[1].conceptId).toBe("strong");
  });
});
