import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getGrindSnapshot } from "./grindDetector";
import {
  GRIND_LINGOTS_24H_THRESHOLD,
  GRIND_LINGOTS_PER_MINUTE_THRESHOLD,
} from "./config";
import type { LingotEvent } from "./storage";

const NOW = 1_700_000_000_000;

describe("getGrindSnapshot", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // No fake timers needed — grind detector is pure; we just need a
    // pinned `now` value.
    vi.setSystemTime(new Date(NOW));
  });
  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("returns zeros when no events are stored", () => {
    const snap = getGrindSnapshot(NOW, []);
    expect(snap.last24hLingotsEarned).toBe(0);
    expect(snap.activeMinutes24h).toBe(0);
    expect(snap.isGrinding).toBe(false);
  });

  it("does not flag a normal learning session", () => {
    // Three reasonable lessons over a 90-minute span, ~40 lingots each.
    const events: LingotEvent[] = [
      { ts: NOW - 90 * 60_000, amount: 40, source: "lesson" },
      { ts: NOW - 60 * 60_000, amount: 40, source: "lesson" },
      { ts: NOW - 30 * 60_000, amount: 40, source: "lesson" },
    ];
    const snap = getGrindSnapshot(NOW, events);
    expect(snap.last24hLingotsEarned).toBe(120);
    expect(snap.isGrinding).toBe(false);
  });

  it("flags grinding when both volume AND rate exceed thresholds", () => {
    // 30 fast events of 25 lingots each, all in a 10-minute window
    // (events 20s apart so they collapse into one ~10min session).
    const events: LingotEvent[] = Array.from({ length: 30 }, (_, i) => ({
      ts: NOW - (30 - i) * 20_000,
      amount: 25,
      source: "practice",
    }));
    const snap = getGrindSnapshot(NOW, events);
    expect(snap.last24hLingotsEarned).toBeGreaterThan(
      GRIND_LINGOTS_24H_THRESHOLD,
    );
    expect(snap.lingotsPerActiveMinute).toBeGreaterThan(
      GRIND_LINGOTS_PER_MINUTE_THRESHOLD,
    );
    expect(snap.isGrinding).toBe(true);
  });

  it("does NOT flag when volume is high but rate is normal (long honest grind)", () => {
    // 20 events of 30 lingots each, spaced 30 minutes apart →
    // total 600 lingots over ~10 hours. Volume crosses threshold but
    // per-minute rate is sane.
    const events: LingotEvent[] = Array.from({ length: 20 }, (_, i) => ({
      ts: NOW - i * 30 * 60_000,
      amount: 30,
      source: "lesson",
    }));
    const snap = getGrindSnapshot(NOW, events);
    expect(snap.last24hLingotsEarned).toBe(600);
    expect(snap.lingotsPerActiveMinute).toBeLessThan(
      GRIND_LINGOTS_PER_MINUTE_THRESHOLD,
    );
    expect(snap.isGrinding).toBe(false);
  });

  it("ignores events older than 24h", () => {
    const events: LingotEvent[] = [
      { ts: NOW - 25 * 60 * 60_000, amount: 5000, source: "lesson" },
    ];
    const snap = getGrindSnapshot(NOW, events);
    expect(snap.last24hLingotsEarned).toBe(0);
    expect(snap.isGrinding).toBe(false);
  });
});
