/**
 * Tests for the layout-jump trace recorder (`layoutTrace.ts`, moved out of
 * `simProbe.ts` so it can ship in a release bundle for TestFlight #174).
 *
 * `recordLayoutTrace` drives its own rAF loop, so these tests stub
 * `requestAnimationFrame` with a manually-driven queue and mock
 * `performance.now` for a deterministic `t0` — no timers, no real frames.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  armLayoutTraceOnNextTap,
  disarmLayoutTrace,
  getLastLayoutTrace,
  isLayoutTraceArmed,
  isLayoutTraceRecording,
  recordLayoutTrace,
  resetLayoutTraceForTests,
  sampleLayout,
  subscribeLayoutTrace,
} from "./layoutTrace";

function fixedRect(top: number, height: number) {
  return () =>
    ({
      top,
      bottom: top + height,
      height,
      left: 0,
      right: 100,
      width: 100,
      x: 0,
      y: top,
      toJSON() {
        return {};
      },
    }) as DOMRect;
}

/** Stage with an h2 whose `getBoundingClientRect().top` walks `h2Tops` across
 *  calls (clamped to the last value once exhausted — a settle). Tray/bank/
 *  stage stay fixed so only h2Top varies frame to frame. */
function setupStage(h2Tops: number[]) {
  document.body.innerHTML = `
    <div data-lesson-stage>
      <h2>Prompt</h2>
      <div data-tile-tray data-kind="tray"><div data-tile>Tile</div></div>
      <div data-tile-tray data-kind="bank"><div data-tile>Bank</div></div>
    </div>`;
  const stage = document.querySelector("[data-lesson-stage]") as HTMLElement;
  const h2 = stage.querySelector("h2") as HTMLElement;
  const tray = stage.querySelector('[data-tile-tray][data-kind="tray"]') as HTMLElement;
  const bank = stage.querySelector('[data-tile-tray][data-kind="bank"]') as HTMLElement;

  let call = 0;
  h2.getBoundingClientRect = vi.fn(() => {
    const top = h2Tops[Math.min(call, h2Tops.length - 1)];
    call += 1;
    return fixedRect(top, 20)();
  });
  stage.getBoundingClientRect = fixedRect(0, 600);
  tray.getBoundingClientRect = fixedRect(300, 200);
  bank.getBoundingClientRect = fixedRect(520, 100);
  return { stage, h2, tray, bank };
}

/** Drives `recordLayoutTrace` to completion with a controlled fake rAF: each
 *  queued callback is invoked immediately, `now` advancing by `dtMs` per
 *  frame — fully synchronous except for the promise microtask on resolve. */
async function drive(durationMs: number, dtMs = 16) {
  let queued: FrameRequestCallback | null = null;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    queued = cb;
    return 0;
  });
  vi.spyOn(performance, "now").mockReturnValue(0);

  const tracePromise = recordLayoutTrace(durationMs);
  let now = 0;
  while (queued !== null) {
    const cb: FrameRequestCallback = queued;
    queued = null;
    now += dtMs;
    cb(now);
  }
  return tracePromise;
}

describe("sampleLayout", () => {
  it("reads h2/tray/bank/stage geometry off [data-lesson-stage]", () => {
    setupStage([133]);
    const s = sampleLayout();
    expect(s.h2Top).toBe(133);
    expect(s.trayTop).toBe(300);
    expect(s.trayH).toBe(200);
    expect(s.bankTop).toBe(520);
    expect(s.bankH).toBe(100);
    expect(s.stageH).toBe(600);
  });

  it("returns nulls when there is no lesson stage on the page", () => {
    document.body.innerHTML = "";
    const s = sampleLayout();
    expect(s.h2Top).toBeNull();
    expect(s.trayTop).toBeNull();
    expect(s.stageH).toBeNull();
  });
});

describe("recordLayoutTrace", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("records the #174 jump-then-settle shape: changed frames, maxH2Jump, one reversal", async () => {
    // h2 sits at 100, jumps +33 on frame 3, back to 100 on frame 4, then
    // holds — the alternate-frame ~33px drop-then-settle bug #174 describes.
    setupStage([100, 100, 133, 100, 100]);

    const trace = await drive(700);

    // Frame 1 (first sample always counts), frame 3 (the jump) and frame 4
    // (the settle back) differ from their predecessor; frame 2 and every
    // frame from 5 on repeat the previous value and are dropped.
    expect(trace.changed.map((f) => f.h2Top)).toEqual([100, 133, 100]);
    expect(trace.maxH2Jump).toBe(33);
    expect(trace.h2Reversals).toBe(1);
    expect(trace.frames).toBeGreaterThan(trace.changed.length);
  });

  it("reports 0 jump and 0 reversals for a stable stage", async () => {
    setupStage([100]);
    const trace = await drive(700);
    expect(trace.changed).toHaveLength(1); // just the first frame
    expect(trace.maxH2Jump).toBe(0);
    expect(trace.h2Reversals).toBe(0);
  });

  it("counts two reversals for a jump-back-jump oscillation", async () => {
    // 100 -> 133 (up) -> 100 (down, reversal 1) -> 133 (up, reversal 2) -> 133 (hold)
    setupStage([100, 133, 100, 133, 133]);
    const trace = await drive(700);
    expect(trace.h2Reversals).toBe(2);
    expect(trace.maxH2Jump).toBe(33);
  });

  it("tracks frame spacing (meanDt/maxDt) from the driven rAF cadence", async () => {
    setupStage([100]);
    const trace = await drive(700, 16);
    expect(trace.meanDt).toBe(16);
    expect(trace.maxDt).toBe(16);
  });

  it("stops once the elapsed time reaches durationMs", async () => {
    setupStage([100]);
    const trace = await drive(700, 16);
    // 700 / 16 rounds up to 44 frames (16*44 = 704 >= 700 stops the loop).
    expect(trace.frames).toBe(44);
  });
});

describe("arm/read workflow", () => {
  beforeEach(() => {
    localStorage.clear();
    disarmLayoutTrace();
    resetLayoutTraceForTests();
  });

  it("is not armed by default and becomes armed after arming", () => {
    expect(isLayoutTraceArmed()).toBe(false);
    armLayoutTraceOnNextTap();
    expect(isLayoutTraceArmed()).toBe(true);
    expect(localStorage.getItem("ol:layoutTrace:armed")).toBe("1");
  });

  it("disarms and clears the localStorage flag", () => {
    armLayoutTraceOnNextTap();
    disarmLayoutTrace();
    expect(isLayoutTraceArmed()).toBe(false);
    expect(localStorage.getItem("ol:layoutTrace:armed")).toBeNull();
  });

  it("a tap outside [data-lesson-stage] does not disarm or start recording", () => {
    document.body.innerHTML = `<button id="elsewhere">Not the stage</button>`;
    armLayoutTraceOnNextTap();
    document.getElementById("elsewhere")!.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true }),
    );
    expect(isLayoutTraceArmed()).toBe(true);
    expect(isLayoutTraceRecording()).toBe(false);
  });

  it("a tap inside [data-lesson-stage] disarms, starts recording, and stores the result", async () => {
    setupStage([100, 100, 133, 100]);
    armLayoutTraceOnNextTap();

    vi.stubGlobal("requestAnimationFrame", (_cb: FrameRequestCallback) => 0);

    document.querySelector("[data-lesson-stage]")!.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true }),
    );

    expect(isLayoutTraceArmed()).toBe(false);
    expect(isLayoutTraceRecording()).toBe(true);

    vi.unstubAllGlobals();
  });

  it("notifies subscribers when arm state changes", () => {
    const fn = vi.fn();
    const unsubscribe = subscribeLayoutTrace(fn);
    armLayoutTraceOnNextTap();
    expect(fn).toHaveBeenCalled();
    unsubscribe();
  });

  it("getLastLayoutTrace reads a persisted trace back from localStorage", () => {
    const fake = {
      frames: 5,
      changed: [],
      maxH2Jump: 12,
      h2Reversals: 1,
      meanDt: 16,
      maxDt: 20,
    };
    localStorage.setItem("ol:layoutTrace:last", JSON.stringify(fake));
    expect(getLastLayoutTrace()).toEqual(fake);
  });

  it("getLastLayoutTrace returns null when nothing has been recorded", () => {
    localStorage.removeItem("ol:layoutTrace:last");
    expect(getLastLayoutTrace()).toBeNull();
  });
});
