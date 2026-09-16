/**
 * Pure-part tests for the sim-capture geometry probe (`simProbe.ts`).
 *
 * These pin the wrap/clip verdict — the signal `sim-capture.mjs` exits
 * non-zero on — against fake rect/scroll numbers, no DOM required. The
 * DOM-dependent half (`installSimProbe`, real `getClientRects()`) is
 * exercised for real by `scripts/ux-loop/sim-capture.mjs` against the
 * simulator; see docs/mobile-testing-setup-2026-08-06.md.
 */
import { describe, expect, it } from "vitest";
import {
  chromeAbovePx,
  chromeBelowPx,
  computeStageOverReportPx,
  countDistinctLines,
  deriveTileFlags,
  intersectHeight,
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
});

describe("deriveTileFlags", () => {
  it("flags neither wrap nor clip for a one-line label that fits", () => {
    expect(
      deriveTileFlags({ lineCount: 1, scrollWidth: 150, clientWidth: 180 })
    ).toEqual({ wrapped: false, clipped: false });
  });

  it("flags wrapped when lineCount > 1, independent of scroll geometry", () => {
    expect(
      deriveTileFlags({ lineCount: 2, scrollWidth: 150, clientWidth: 180 })
    ).toEqual({ wrapped: true, clipped: false });
  });

  it("flags clipped when scrollWidth exceeds clientWidth", () => {
    expect(
      deriveTileFlags({ lineCount: 1, scrollWidth: 200, clientWidth: 180 })
    ).toEqual({ wrapped: false, clipped: true });
  });

  it("an exact-fit label (scrollWidth === clientWidth) is not clipped", () => {
    expect(
      deriveTileFlags({ lineCount: 1, scrollWidth: 180, clientWidth: 180 })
    ).toEqual({ wrapped: false, clipped: false });
  });

  it("can flag both wrapped and clipped at once", () => {
    expect(
      deriveTileFlags({ lineCount: 2, scrollWidth: 200, clientWidth: 180 })
    ).toEqual({ wrapped: true, clipped: true });
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
