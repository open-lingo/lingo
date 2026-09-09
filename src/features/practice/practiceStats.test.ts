import { beforeEach, describe, expect, it } from "vitest";
import {
  getFeatureStats,
  getItemAccuracy,
  getTodayCount,
  recordPracticeResult,
  recordSessionEnd,
} from "./practiceStats";

const KEY = "lingo:practice-stats:v1";

describe("practice stats — particle drills share the store", () => {
  beforeEach(() => {
    localStorage.removeItem(KEY);
  });

  it("writes particle results under the `particles` feature with a per-day count", () => {
    expect(getTodayCount("particles")).toBe(0);
    recordPracticeResult("particles", "ni-kara:m15-x", true);
    recordPracticeResult("particles", "ni-kara:m15-x", false);
    recordPracticeResult("particles", "wa-ga:m6-y", true);

    expect(getTodayCount("particles")).toBe(3);
    expect(getItemAccuracy("particles", "ni-kara:m15-x")).toBe(0.5);
    const stats = getFeatureStats("particles");
    expect(Object.keys(stats.items)).toHaveLength(2);
    // Same store, separate feature buckets — conjugation is untouched.
    expect(getTodayCount("conjugation")).toBe(0);
  });

  it("session end bumps the session counter without touching the day count", () => {
    recordPracticeResult("particles", "a", true);
    recordSessionEnd("particles");
    expect(getFeatureStats("particles").sessions).toBe(1);
    expect(getTodayCount("particles")).toBe(1);
  });

  it("reads a pre-daily store (no `daily` field) as zero today", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ particles: { items: { a: { correct: 1, total: 1, lastPracticed: "2026-01-01" } }, sessions: 1, lastSessionDate: "2026-01-01" } }),
    );
    expect(getTodayCount("particles")).toBe(0);
    recordPracticeResult("particles", "a", true);
    expect(getTodayCount("particles")).toBe(1);
    expect(getFeatureStats("particles").items.a.total).toBe(2);
  });

  it("prunes the daily map to a rolling window", () => {
    const daily: Record<string, number> = {};
    for (let d = 1; d <= 20; d++) daily[`2026-01-${String(d).padStart(2, "0")}`] = 1;
    localStorage.setItem(KEY, JSON.stringify({ particles: { items: {}, sessions: 0, lastSessionDate: null, daily } }));
    recordPracticeResult("particles", "a", true);
    const kept = Object.keys(getFeatureStats("particles").daily ?? {});
    expect(kept).toHaveLength(14);
    expect(kept).not.toContain("2026-01-01");
    expect(getTodayCount("particles")).toBe(1);
  });
});
