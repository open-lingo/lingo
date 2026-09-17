import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import {
  clearSessionLog,
  logReviewGridServed,
  summarizeReviewGridEvents,
  logTileTap,
  buildTapReplayDocument,
  getSessionLog,
  type TileTapPayload,
} from "./sessionLog";

describe("review_grid_served telemetry (A8, docs/learning-loop-2026-09-17.md)", () => {
  beforeEach(() => {
    clearSessionLog();
  });

  it("starts empty", () => {
    const s = summarizeReviewGridEvents();
    expect(s).toEqual({
      stepsServed: 0,
      lessonsSeen: 0,
      totalAtomSlotsServed: 0,
      totalOverlap: 0,
      totalNotDueServed: 0,
      latestDueAtomCount: 0,
      overlapRate: 0,
    });
  });

  it("aggregates across multiple logged rows", () => {
    logReviewGridServed({
      lessonId: "ja-m9-neo-3",
      stepIndex: 2,
      servedAtomIds: 2,
      dueAtomIds: 5,
      overlap: 1,
      notDueServed: 1,
      dueNotServed: 4,
    });
    logReviewGridServed({
      lessonId: "ja-m9-neo-3",
      stepIndex: 4,
      servedAtomIds: 3,
      dueAtomIds: 5,
      overlap: 2,
      notDueServed: 1,
      dueNotServed: 3,
    });
    logReviewGridServed({
      lessonId: "ja-m10-neo-1",
      stepIndex: 0,
      servedAtomIds: 1,
      dueAtomIds: 6,
      overlap: 0,
      notDueServed: 1,
      dueNotServed: 6,
    });

    const s = summarizeReviewGridEvents();
    expect(s.stepsServed).toBe(3);
    expect(s.lessonsSeen).toBe(2);
    expect(s.totalAtomSlotsServed).toBe(6); // 2 + 3 + 1
    expect(s.totalOverlap).toBe(3); // 1 + 2 + 0
    expect(s.totalNotDueServed).toBe(3); // 1 + 1 + 1
    expect(s.latestDueAtomCount).toBe(6); // snapshot from the LAST logged row
    expect(s.overlapRate).toBeCloseTo(0.5, 5); // 3/6
  });

  it("returns a STABLE reference between calls when nothing new was logged (useSyncExternalStore contract)", () => {
    logReviewGridServed({
      lessonId: "ja-m9-neo-3",
      stepIndex: 0,
      servedAtomIds: 1,
      dueAtomIds: 1,
      overlap: 1,
      notDueServed: 0,
      dueNotServed: 0,
    });
    const a = summarizeReviewGridEvents();
    const b = summarizeReviewGridEvents();
    expect(a).toBe(b); // same object reference, not just deep-equal
  });

  it("invalidates the cached reference when a new event is logged", () => {
    const before = summarizeReviewGridEvents();
    logReviewGridServed({
      lessonId: "ja-m9-neo-3",
      stepIndex: 0,
      servedAtomIds: 1,
      dueAtomIds: 1,
      overlap: 0,
      notDueServed: 1,
      dueNotServed: 1,
    });
    const after = summarizeReviewGridEvents();
    expect(after).not.toBe(before);
    expect(after.stepsServed).toBe(1);
  });

  it("clearSessionLog resets the summary", () => {
    logReviewGridServed({
      lessonId: "ja-m9-neo-3",
      stepIndex: 0,
      servedAtomIds: 1,
      dueAtomIds: 1,
      overlap: 1,
      notDueServed: 0,
      dueNotServed: 0,
    });
    expect(summarizeReviewGridEvents().stepsServed).toBe(1);
    clearSessionLog();
    expect(summarizeReviewGridEvents().stepsServed).toBe(0);
  });
});

function tap(overrides: Partial<TileTapPayload> = {}): TileTapPayload {
  return {
    lessonId: "ja-m34-neo-3",
    stepIndex: 16,
    stepType: "build_sentence",
    label: "た",
    source: "bank",
    position: 0,
    tMs: 100,
    fontScalePct: 100,
    viewportW: 430,
    ...overrides,
  };
}

describe("tile_tap telemetry (golden-learner replay, lane A2d, 2026-09-17)", () => {
  beforeEach(() => {
    clearSessionLog();
    window.localStorage.removeItem("lingo:sim-probe");
  });

  it("logs a tile_tap row per call", () => {
    logTileTap(tap({ position: 0 }));
    logTileTap(tap({ position: 1, label: "べ" }));
    const rows = getSessionLog().filter((e) => e.type === "tile_tap");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.payload).toMatchObject({ label: "た", position: 0 });
    expect(rows[1]?.payload).toMatchObject({ label: "べ", position: 1 });
  });

  it("caps at 60 taps per (lessonId, stepIndex) — the 61st is dropped", () => {
    for (let i = 0; i < 61; i++) {
      logTileTap(tap({ position: i, label: `t${i}` }));
    }
    const rows = getSessionLog().filter((e) => e.type === "tile_tap");
    expect(rows).toHaveLength(60);
    // The FIRST 60 landed, not the last 60 — the cap stops logging, it
    // doesn't evict earlier taps (the sequence's ORDER is the whole point
    // of a replay fixture).
    expect(rows[0]?.payload).toMatchObject({ label: "t0" });
    expect(rows[59]?.payload).toMatchObject({ label: "t59" });
  });

  it("the cap is per (lessonId, stepIndex) — a different step gets its own 60", () => {
    for (let i = 0; i < 60; i++) logTileTap(tap({ stepIndex: 1, position: i }));
    logTileTap(tap({ stepIndex: 2, position: 0 }));
    const rows = getSessionLog().filter((e) => e.type === "tile_tap");
    expect(rows).toHaveLength(61);
  });

  it("does NOT POST to /__sim/report when the sim-probe flag is not armed", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    logTileTap(tap());
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("POSTs the tap event to /__sim/report when the sim-probe flag IS armed (the automated golden-recording path)", async () => {
    window.localStorage.setItem("lingo:sim-probe", "1");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    logTileTap(tap({ label: "め" }));
    await Promise.resolve(); // let the fire-and-forget fetch's microtask run
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/__sim/report");
    const body = JSON.parse(String(init.body));
    expect(body.tapEvent.type).toBe("tile_tap");
    expect(body.tapEvent.payload.label).toBe("め");
    fetchSpy.mockRestore();
  });
});

describe("buildTapReplayDocument (the 'Copy tap replay' panel export)", () => {
  beforeEach(() => {
    clearSessionLog();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when nothing has been tapped this session", () => {
    expect(buildTapReplayDocument()).toBeNull();
  });

  it("groups taps by the MOST RECENTLY tapped (lessonId, stepIndex)", () => {
    logTileTap(tap({ lessonId: "ja-m10-neo-1", stepIndex: 3, label: "old-step-tap" }));
    logTileTap(tap({ lessonId: "ja-m34-neo-3", stepIndex: 16, label: "あ", position: 0, tMs: 200 }));
    logTileTap(tap({ lessonId: "ja-m34-neo-3", stepIndex: 16, label: "い", source: "answer", position: 0, tMs: 900 }));
    const doc = buildTapReplayDocument();
    expect(doc).not.toBeNull();
    expect(doc?.taps).toHaveLength(2);
    expect(doc?.taps.map((t) => t.label)).toEqual(["あ", "い"]);
    expect(doc?.taps[1]).toMatchObject({ source: "answer", position: 0, tMs: 900 });
  });

  it("reports fontScale rounded from the last tap and a WxH viewport string", () => {
    logTileTap(tap({ fontScalePct: 125.4 }));
    const doc = buildTapReplayDocument();
    expect(doc?.fontScale).toBe(125);
    expect(doc?.viewport).toMatch(/^\d+x\d+$/);
  });
});
