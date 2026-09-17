/**
 * Pure-part tests for the sim-capture geometry probe (`simProbe.ts`).
 *
 * These pin the wrap/clip verdict — the signal `sim-capture.mjs` exits
 * non-zero on — against fake rect/scroll numbers, no DOM required. The
 * DOM-dependent half (`installSimProbe`, real `getClientRects()`) is
 * exercised for real by `scripts/ux-loop/sim-capture.mjs` against the
 * simulator; see docs/mobile-testing-setup-2026-08-06.md.
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  captureBuildSample,
  chromeAbovePx,
  chromeBelowPx,
  collectBaseTextRects,
  computeGroupMetrics,
  computeNextTapDelayMs,
  computeStageOverReportPx,
  countDistinctLines,
  deriveTileFlags,
  extractRunNonce,
  frameStabilityKey,
  intersectHeight,
  isCollapsedTileState,
  shouldStopFrameTrace,
  viewportEmulationMeta,
} from "./simProbe";

describe("countDistinctLines", () => {
  it("returns 1 for a single-line label (one rect)", () => {
    expect(countDistinctLines([{ top: 100 }])).toBe(1);
  });

  it("returns 2 for a wrapped label (two rects at different tops)", () => {
    // ばんごはん wrapping as ばんごは / ん (TestFlight #156's shape).
    expect(countDistinctLines([{ top: 100 }, { top: 130.4 }])).toBe(2);
  });

  it("collapses sub-pixel jitter on the same line to one line", () => {
    // Inline fragments on one line can report tops that differ by <1px
    // (kerning/antialiasing rounding) — must not read as a wrap.
    expect(countDistinctLines([{ top: 100 }, { top: 100.4 }, { top: 99.6 }])).toBe(1);
  });

  it("returns 0 for no rects (element not laid out / empty label)", () => {
    expect(countDistinctLines([])).toBe(0);
  });

  it("counts three distinct lines", () => {
    expect(countDistinctLines([{ top: 10 }, { top: 40 }, { top: 70 }])).toBe(3);
  });

  // G8 (PHASE2B.md §4) additions below.
  it("ignores zero-height rects (empty text node / Range boundary artifacts)", () => {
    expect(
      countDistinctLines([{ top: 100, height: 20 }, { top: 999, height: 0 }])
    ).toBe(1);
  });

  it("clusters by gap, not by rounding bucket (100.6 and 101.4 are one line)", () => {
    // Math.round(100.6)=101, Math.round(101.4)=101 -- would already pass under
    // rounding, but 100.9/101.1 rounds to 101/101 too while straddling a
    // bucket at the .5 boundary either way; the gap-based version is robust
    // to where the boundary falls, not just to this specific pair.
    expect(countDistinctLines([{ top: 100.9 }, { top: 101.1 }])).toBe(1);
  });

  it("a gap just over the 2px tolerance counts as two lines", () => {
    expect(countDistinctLines([{ top: 100 }, { top: 102.1 }])).toBe(2);
  });
});

describe("collectBaseTextRects (G8 — Range over text, excluding <rt> furigana)", () => {
  it("returns one rect per qualifying text node's Range.getClientRects(), skipping <rt> subtrees", () => {
    document.body.innerHTML =
      '<span lang="ja" id="label">' +
      '<ruby>' +
      "食べ" +
      '<rt class="kana-helper">た</rt>' +
      "</ruby>" +
      "</span>";
    const label = document.getElementById("label")!;
    const stub = [{ top: 10, left: 0, right: 20, bottom: 30, width: 20, height: 20 } as DOMRect];
    const originalGetClientRects = Range.prototype.getClientRects;
    // collectBaseTextRects creates one Range per qualifying text node, so the
    // stub's rects appear once per node it walked. "食べ" and "た" are the
    // only two text nodes in the fixture; if <rt>'s "た" were NOT excluded
    // this would return 2 rects instead of 1.
    Range.prototype.getClientRects = function (this: Range) {
      return stub as unknown as DOMRectList;
    };
    try {
      const rects = collectBaseTextRects(label);
      expect(rects).toHaveLength(1); // proves "た" (inside <rt>) was skipped
      expect(rects[0].top).toBe(10);
    } finally {
      Range.prototype.getClientRects = originalGetClientRects;
      document.body.innerHTML = "";
    }
  });

  it("stubbed Range returning rects at two distinct tops proves a wrap is detectable from TEXT even though the label is a single-rect flex item (the G8 bug shape)", () => {
    // Reproduces ja-m3-neo-5?step=12 at 125%: ありがとうございます wraps to two
    // lines inside a flex-item label. label.getClientRects() (the pre-fix
    // path) would report ONE rect here; a Range over the text reports one
    // per line, which is what this stub simulates.
    document.body.innerHTML = '<span lang="ja" id="label">ありがとうございます</span>';
    const label = document.getElementById("label")!;
    const line1 = { top: 100, left: 0, right: 120, bottom: 120, width: 120, height: 20 } as DOMRect;
    const line2 = { top: 120, left: 0, right: 60, bottom: 140, width: 60, height: 20 } as DOMRect;
    const originalGetClientRects = Range.prototype.getClientRects;
    Range.prototype.getClientRects = function (this: Range) {
      return [line1, line2] as unknown as DOMRectList;
    };
    try {
      const rects = collectBaseTextRects(label);
      expect(countDistinctLines(rects)).toBe(2);
    } finally {
      Range.prototype.getClientRects = originalGetClientRects;
      document.body.innerHTML = "";
    }
  });
});

describe("deriveTileFlags", () => {
  it("flags neither wrap nor clip for a one-line label that fits", () => {
    expect(
      deriveTileFlags({ lineCount: 1, scrollWidth: 150, clientWidth: 180 })
    ).toEqual({ wrapped: false, clipped: false, overhangPx: 0 });
  });

  it("flags wrapped when lineCount > 1, independent of scroll geometry", () => {
    expect(
      deriveTileFlags({ lineCount: 2, scrollWidth: 150, clientWidth: 180 })
    ).toEqual({ wrapped: true, clipped: false, overhangPx: 0 });
  });

  it("flags clipped when scrollWidth exceeds clientWidth", () => {
    expect(
      deriveTileFlags({ lineCount: 1, scrollWidth: 200, clientWidth: 180 })
    ).toEqual({ wrapped: false, clipped: true, overhangPx: 0 });
  });

  it("an exact-fit label (scrollWidth === clientWidth) is not clipped", () => {
    expect(
      deriveTileFlags({ lineCount: 1, scrollWidth: 180, clientWidth: 180 })
    ).toEqual({ wrapped: false, clipped: false, overhangPx: 0 });
  });

  it("can flag both wrapped and clipped at once", () => {
    expect(
      deriveTileFlags({ lineCount: 2, scrollWidth: 200, clientWidth: 180 })
    ).toEqual({ wrapped: true, clipped: true, overhangPx: 0 });
  });

  // G8 additions below.
  it("flags clipped from base-text overhang alone, even when scrollWidth === clientWidth (the flex-item-blockified case)", () => {
    // This is exactly why scrollWidth/clientWidth on the label was "dead"
    // for clip detection on a flex tier (PHASE2B.md §4): a block absorbs its
    // own content, so scrollWidth never exceeds clientWidth once it wraps.
    expect(
      deriveTileFlags({ lineCount: 2, scrollWidth: 180, clientWidth: 180, overhangPx: 5 })
    ).toEqual({ wrapped: true, clipped: true, overhangPx: 5 });
  });

  it("does not clip on a sub-tolerance overhang (<= 1px)", () => {
    expect(
      deriveTileFlags({ lineCount: 1, scrollWidth: 180, clientWidth: 180, overhangPx: 1 })
    ).toEqual({ wrapped: false, clipped: false, overhangPx: 1 });
  });

  it("clipped-via-scrollWidth with overhangPx: 0 is distinguishable from clipped-via-overhang (ruby/furigana overhang vs. real base-text clipping)", () => {
    const rubyOverhangOnly = deriveTileFlags({ lineCount: 1, scrollWidth: 200, clientWidth: 180, overhangPx: 0 });
    const realTextClip = deriveTileFlags({ lineCount: 1, scrollWidth: 180, clientWidth: 180, overhangPx: 8 });
    expect(rubyOverhangOnly).toEqual({ wrapped: false, clipped: true, overhangPx: 0 });
    expect(realTextClip).toEqual({ wrapped: false, clipped: true, overhangPx: 8 });
  });

  it("clamps a negative overhangPx (text short of the edge) to 0", () => {
    expect(
      deriveTileFlags({ lineCount: 1, scrollWidth: 150, clientWidth: 180, overhangPx: -12 })
    ).toEqual({ wrapped: false, clipped: false, overhangPx: 0 });
  });
});

describe("intersectHeight", () => {
  it("returns the overlap height of two rects", () => {
    expect(intersectHeight({ top: 100, bottom: 700 }, { top: 0, bottom: 844 })).toBe(600);
  });

  it("returns 0 for disjoint rects", () => {
    expect(intersectHeight({ top: 900, bottom: 1000 }, { top: 0, bottom: 844 })).toBe(0);
  });

  it("clamps a rect that overhangs the viewport to the viewport edge", () => {
    // scroller taller than the viewport (starts above, ends below it).
    expect(intersectHeight({ top: -50, bottom: 900 }, { top: 0, bottom: 844 })).toBe(844);
  });
});

describe("chromeAbovePx / chromeBelowPx", () => {
  it("chromeAbovePx is the gap between the viewport top and the stage top", () => {
    expect(chromeAbovePx(184, 0)).toBe(184);
  });

  it("chromeBelowPx is the gap between the stage bottom and the viewport bottom", () => {
    expect(chromeBelowPx(932, 863)).toBe(69);
  });

  it("both return null when the stage wasn't found", () => {
    expect(chromeAbovePx(null, 0)).toBeNull();
    expect(chromeBelowPx(932, null)).toBeNull();
  });
});

describe("viewportEmulationMeta (G5 landscape-emulation fallback)", () => {
  it("scales down to fit a wider-than-tall emulated viewport on a taller physical screen (the iPad landscape shape)", () => {
    // iPad Air 11" M4: real portrait screen 820x1180 CSS px; emulating its
    // own landscape shape (1180x820) on that same physical screen.
    const { content, scale } = viewportEmulationMeta(1180, 820, 820, 1180);
    expect(scale).toBeCloseTo(820 / 1180, 5); // the binding axis is width
    expect(content).toContain("width=1180");
    expect(content).toContain("height=820");
    expect(content).toContain(`initial-scale=${scale}`);
    expect(content).toContain("user-scalable=no");
  });

  it("scale is min(screenW/w, screenH/h) so neither axis overflows", () => {
    expect(viewportEmulationMeta(100, 100, 50, 200).scale).toBe(0.5); // width-bound
    expect(viewportEmulationMeta(100, 100, 200, 50).scale).toBe(0.5); // height-bound
  });

  it("falls back to scale=1 rather than dividing by zero on a degenerate screen size", () => {
    expect(viewportEmulationMeta(100, 100, 0, 0).scale).toBe(1);
  });
});

describe("computeStageOverReportPx", () => {
  const viewportRect = { top: 0, bottom: 844 };

  it("returns 0 when the scroller's reported height matches what's actually visible", () => {
    expect(
      computeStageOverReportPx({
        scrollerClientHeight: 600,
        scrollerRect: { top: 100, bottom: 700 },
        viewportRect,
      })
    ).toBe(0);
  });

  it("reports the gap when clientHeight exceeds the on-screen intersection (the real bug shape)", () => {
    // Scroller's box runs off the bottom of the real viewport (extends to
    // 900 vs. a device viewport that ends at 844) while its own clientHeight
    // still claims the full 700px — the emulator-vs-device over-report.
    expect(
      computeStageOverReportPx({
        scrollerClientHeight: 700,
        scrollerRect: { top: 200, bottom: 900 },
        viewportRect,
      })
    ).toBe(56); // 700 - (844-200)=644 visible => 56
  });

  it("subtracts a position:fixed CTA's overlap with the scroller from the usable area", () => {
    const withoutCta = computeStageOverReportPx({
      scrollerClientHeight: 600,
      scrollerRect: { top: 100, bottom: 700 },
      viewportRect,
      ctaRect: { top: 650, bottom: 750 },
      ctaFixed: false,
    });
    const withCta = computeStageOverReportPx({
      scrollerClientHeight: 600,
      scrollerRect: { top: 100, bottom: 700 },
      viewportRect,
      ctaRect: { top: 650, bottom: 750 }, // occludes the scroller's bottom 50px
      ctaFixed: true,
    });
    expect(withoutCta).toBe(0); // fixed CTA overlap ignored when not actually fixed
    expect(withCta).toBe(50); // 600 - (600-50)=550 usable => 50
  });

  it("returns null when the scroller wasn't found", () => {
    expect(computeStageOverReportPx({ scrollerClientHeight: null, scrollerRect: null, viewportRect })).toBeNull();
    expect(computeStageOverReportPx({ scrollerClientHeight: 600, scrollerRect: null, viewportRect })).toBeNull();
  });
});

describe("extractRunNonce", () => {
  // PHASE2A.md §6.7 — the per-run token sim-capture.mjs writes onto the
  // target route (`?simRun=<uuid>`) so its validator can tell its own report
  // apart from a concurrent lane's.
  it("reads simRun off the query string", () => {
    expect(extractRunNonce("?simFontScale=125&simRun=abc-123")).toBe("abc-123");
  });

  it("returns null when simRun is absent", () => {
    expect(extractRunNonce("?simFontScale=125")).toBeNull();
    expect(extractRunNonce("")).toBeNull();
  });
});

describe("computeGroupMetrics (`--simulate build`'s per-tap tray/bank aggregate)", () => {
  it("returns all-null with count 0 for an empty group (no Infinity/-Infinity leaking out)", () => {
    expect(computeGroupMetrics([])).toEqual({
      count: 0,
      fontPxMin: null,
      fontPxMax: null,
      boxHMin: null,
      boxHMax: null,
      fitScaleMin: null,
      fitScaleMax: null,
    });
  });

  it("aggregates min/max across a uniform group", () => {
    const g = computeGroupMetrics([
      { fontPx: 29, boxH: 48, fitScale: 1 },
      { fontPx: 29, boxH: 48, fitScale: 1 },
    ]);
    expect(g).toEqual({ count: 2, fontPxMin: 29, fontPxMax: 29, boxHMin: 48, boxHMax: 48, fitScaleMin: 1, fitScaleMax: 1 });
  });

  // The b23 defect this whole mode exists to catch: a placed tray tile
  // rendering at 19px against a 29px bank sibling.
  it("surfaces a font-size spread across a mixed group (the 19px-vs-29px defect shape)", () => {
    const g = computeGroupMetrics([
      { fontPx: 19, boxH: 40, fitScale: 0.65 },
      { fontPx: 29, boxH: 48, fitScale: 1 },
    ]);
    expect(g.fontPxMin).toBe(19);
    expect(g.fontPxMax).toBe(29);
  });

  it("drops a null fitScale from the fitScale min/max without dropping the tile from count/font/box", () => {
    const g = computeGroupMetrics([
      { fontPx: 20, boxH: 40, fitScale: null }, // e.g. a ghost pre-sizer never registered with tileFit.ts
      { fontPx: 24, boxH: 44, fitScale: 0.9 },
    ]);
    expect(g.count).toBe(2);
    expect(g.fontPxMin).toBe(20);
    expect(g.fontPxMax).toBe(24);
    expect(g.fitScaleMin).toBe(0.9);
    expect(g.fitScaleMax).toBe(0.9);
  });
});

describe("frameStabilityKey (per-tap FRAME CAPTURE, 2026-09-17)", () => {
  it("returns 'null' for a not-yet-mounted/lost tile", () => {
    expect(frameStabilityKey(null)).toBe("null");
  });

  it("keys on rect + font only, not transform/opacity (those are the animation itself)", () => {
    const a = frameStabilityKey({ x: 10, y: 20, w: 30, h: 40, fontPx: 29, transform: "matrix(1,0,0,0.5,0,0)", opacity: 0.4 });
    const b = frameStabilityKey({ x: 10, y: 20, w: 30, h: 40, fontPx: 29, transform: "none", opacity: 1 });
    expect(a).toBe(b);
  });

  it("differs when the rect or font actually changes", () => {
    const a = frameStabilityKey({ x: 10, y: 20, w: 30, h: 40, fontPx: 29, transform: "none", opacity: 1 });
    const b = frameStabilityKey({ x: 10, y: 20, w: 30, h: 40, fontPx: 19, transform: "none", opacity: 1 });
    expect(a).not.toBe(b);
  });
});

describe("shouldStopFrameTrace (per-tap FRAME CAPTURE stop condition)", () => {
  it("never stops before 700ms even if already stable", () => {
    expect(shouldStopFrameTrace(400, 10, false)).toBe(false);
    expect(shouldStopFrameTrace(699, 10, false)).toBe(false);
  });

  it("stops at 700ms once 3 stable frames have been counted", () => {
    expect(shouldStopFrameTrace(700, 3, false)).toBe(true);
    expect(shouldStopFrameTrace(700, 2, false)).toBe(false);
  });

  it("keeps running past 700ms until stability is reached (whichever is later)", () => {
    expect(shouldStopFrameTrace(900, 2, false)).toBe(false);
    expect(shouldStopFrameTrace(900, 3, false)).toBe(true);
  });

  it("always stops once capped, regardless of time/stability", () => {
    expect(shouldStopFrameTrace(3000, 0, true)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Task C (2026-09-17) — isCollapsedTileState.
// ---------------------------------------------------------------------------
describe("isCollapsedTileState (huge-bank collapse, task C)", () => {
  it("is true for 'done' (fully collapsed)", () => {
    expect(isCollapsedTileState("done")).toBe(true);
  });

  it("is true for 'pending' (collapse animation still in flight)", () => {
    expect(isCollapsedTileState("pending")).toBe(true);
  });

  it("is false for null (no data-collapse attribute — a normal tile)", () => {
    expect(isCollapsedTileState(null)).toBe(false);
  });

  it("is false for an unrecognized value", () => {
    expect(isCollapsedTileState("something-else")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Task D (2026-09-17) — computeNextTapDelayMs, the browser-side mirror of
// sim-capture.mjs's copy of the same scheduling decision.
// ---------------------------------------------------------------------------
describe("computeNextTapDelayMs (task D scheduling decision)", () => {
  it("is the tap-interval floor when trace-stable and screenshot-return are both faster", () => {
    expect(computeNextTapDelayMs({ tapIntervalMs: 450, traceStableMs: 300, screenshotReturnMs: 200 })).toBe(450);
  });

  it("is trace-stable time when it's the slowest of the three", () => {
    expect(computeNextTapDelayMs({ tapIntervalMs: 450, traceStableMs: 900, screenshotReturnMs: 200 })).toBe(900);
  });

  it("is screenshot-return time when it's the slowest of the three ('do not fire until the screenshot has returned')", () => {
    expect(computeNextTapDelayMs({ tapIntervalMs: 450, traceStableMs: 300, screenshotReturnMs: 500 })).toBe(500);
  });

  it("treats a null traceStableMs as no floor from that input", () => {
    expect(computeNextTapDelayMs({ tapIntervalMs: 450, traceStableMs: null, screenshotReturnMs: 200 })).toBe(450);
  });

  it("treats a null screenshotReturnMs as no floor from that input", () => {
    expect(computeNextTapDelayMs({ tapIntervalMs: 450, traceStableMs: 300, screenshotReturnMs: null })).toBe(450);
  });
});

/**
 * `captureBuildSample` — the collection half of the build-25 ruling that
 * nothing on screen may move between the learner's first tap and the last
 * (TestFlight #184/#185; judgment lives in `sim-capture.mjs`'s
 * `promptStable`/`chromeStable`). happy-dom has no layout, so every rect
 * here is stubbed; what this pins is that the sample reads the RIGHT
 * elements and re-reads them every tap — the `#165` failure mode was a whole
 * lane measuring the wrong element's card.
 */
describe("captureBuildSample (per-tap column geometry)", () => {
  /** Stub one element's rect top/height. */
  const stubTop = (el: Element, top: number, height = 10) => {
    Object.defineProperty(el, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        top,
        bottom: top + height,
        left: 0,
        right: 400,
        width: 400,
        height,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }),
    });
  };

  /** The build step's real column: prompt, tray, bank, bottom-anchored CTA. */
  function mountStage() {
    document.body.innerHTML = `
      <div id="scroller">
        <div data-lesson-stage>
          <h2>Build it</h2>
          <div data-tile-tray data-kind="tray">
            <div data-tile data-slot="tray" data-variant="build"><span>あさ</span></div>
          </div>
          <div data-tile-tray data-kind="bank">
            <button data-tile data-slot="bank" data-variant="build" data-state="idle"><span>ごはん</span></button>
          </div>
          <div data-testid="primary-cta"></div>
        </div>
      </div>`;
    const q = (sel: string) => document.querySelector(sel)!;
    stubTop(q("[data-lesson-stage]"), 159, 711);
    stubTop(q("h2"), 202, 56);
    stubTop(q('[data-kind="tray"]'), 274, 235);
    stubTop(q('[data-kind="bank"]'), 525, 137);
    stubTop(q('[data-testid="primary-cta"]'), 724, 75);
    return q;
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reads the prompt heading's top, the bank's top and the CTA block's top", () => {
    mountStage();
    const s = captureBuildSample(0);
    expect(s.tap).toBe(0);
    expect(s.promptTop).toBe(202);
    expect(s.bankTop).toBe(525);
    expect(s.ctaTop).toBe(724);
    // `h2Top` (via layoutTrace) and `promptTop` (this file) must agree —
    // they are the same element, read two ways, and a silent divergence
    // would make `h2Stable` and `promptStable` disagree on the device.
    expect(s.h2Top).toBe(s.promptTop);
  });

  it("re-reads them on the next tap — a moved prompt or CTA shows up in the sample", () => {
    const q = mountStage();
    const before = captureBuildSample(0);
    // The measured defect: the column re-centres 36.8px up and the CTA rides
    // down as the tray takes a row.
    stubTop(q("h2"), 165.2, 56);
    stubTop(q('[data-testid="primary-cta"]'), 760, 75);
    const after = captureBuildSample(1);
    expect(after.promptTop).toBe(165.2);
    expect(before.promptTop! - after.promptTop!).toBeCloseTo(36.8, 1);
    expect(after.ctaTop).toBe(760);
  });

  it("reports null rather than 0 for a step that has no CTA block", () => {
    const q = mountStage();
    q('[data-testid="primary-cta"]').remove();
    expect(captureBuildSample(0).ctaTop).toBeNull();
  });
});
