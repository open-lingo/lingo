/**
 * Form-factor predicates (iPad pass, docs/ipad-scoping-2026-09-15.md §2).
 *
 * These are the one place that decides "phone-shaped vs tablet-portrait vs
 * landscape desktop-mirror", so the cases below are written as DEVICES, not as
 * media queries: each stub answers the four queries the way a real device
 * would, and the assertions say which layout that device must get. A fake
 * matchMedia that answered every query `true` would pass a naive test, so
 * every case also asserts the predicates that must be FALSE.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  MQ,
  isTabletPortrait,
  isLandscapeDesktopTouch,
  isLandscapeLg,
  shouldForceVerticalLearnMap,
} from "./formFactor";

const realMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = realMatchMedia;
  vi.restoreAllMocks();
});

/**
 * Evaluate the real query strings against a device's width/height/pointer —
 * so the test exercises `MQ`'s ACTUAL strings, not a re-spelling of them. A
 * typo in `MQ.tabletPortrait` fails here rather than passing a hand-written
 * mirror of the same typo.
 */
function stubDevice({ w, h, coarse }: { w: number; h: number; coarse: boolean }) {
  const evaluate = (query: string): boolean => {
    const min = /min-width:\s*(\d+)px/.exec(query);
    const max = /max-width:\s*(\d+)px/.exec(query);
    if (min && w < Number(min[1])) return false;
    if (max && w > Number(max[1])) return false;
    if (query.includes("orientation: portrait") && !(h > w)) return false;
    if (query.includes("orientation: landscape") && !(w > h)) return false;
    if (query.includes("pointer: coarse") && !coarse) return false;
    return true;
  };
  window.matchMedia = vi.fn((query: string) => ({
    matches: evaluate(query),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("formFactor", () => {
  it("iPhone 15 Pro Max portrait (430x932, touch) — phone: map forced, no tier, no sidebar", () => {
    stubDevice({ w: 430, h: 932, coarse: true });
    expect(shouldForceVerticalLearnMap()).toBe(true);
    expect(isTabletPortrait()).toBe(false); // below 640 — stays on the base tokens
    expect(isLandscapeLg()).toBe(false);
    expect(isLandscapeDesktopTouch()).toBe(false);
  });

  it("iPhone landscape (844x390, touch) — still a phone: map forced, no sidebar", () => {
    stubDevice({ w: 844, h: 390, coarse: true });
    expect(shouldForceVerticalLearnMap()).toBe(true);
    expect(isLandscapeLg()).toBe(false); // 844 < 1024
    expect(isTabletPortrait()).toBe(false); // landscape
  });

  it("iPad mini portrait (744x1133, touch) — roomy mobile: tablet tier + map", () => {
    stubDevice({ w: 744, h: 1133, coarse: true });
    expect(isTabletPortrait()).toBe(true);
    expect(shouldForceVerticalLearnMap()).toBe(true);
    expect(isLandscapeLg()).toBe(false);
  });

  it("iPad Air portrait (820x1180, touch) — roomy mobile: tablet tier, map, no sidebar", () => {
    stubDevice({ w: 820, h: 1180, coarse: true });
    expect(isTabletPortrait()).toBe(true);
    expect(shouldForceVerticalLearnMap()).toBe(true);
    expect(isLandscapeLg()).toBe(false);
    expect(isLandscapeDesktopTouch()).toBe(false);
  });

  it("iPad Air landscape (1180x820, touch) — desktop mirror: sidebar, list toggle, tap bump", () => {
    stubDevice({ w: 1180, h: 820, coarse: true });
    expect(isLandscapeLg()).toBe(true);
    expect(isLandscapeDesktopTouch()).toBe(true);
    expect(shouldForceVerticalLearnMap()).toBe(false);
    expect(isTabletPortrait()).toBe(false);
  });

  it("Split View half pane (678x820, touch) — portrait by geometry: tablet tier + map", () => {
    stubDevice({ w: 678, h: 820, coarse: true });
    expect(isTabletPortrait()).toBe(true);
    expect(shouldForceVerticalLearnMap()).toBe(true);
    expect(isLandscapeLg()).toBe(false);
  });

  it("laptop 1280x720 (mouse) — unchanged from the old `lg:` behaviour", () => {
    stubDevice({ w: 1280, h: 720, coarse: false });
    expect(isLandscapeLg()).toBe(true); // the sidebar still shows
    expect(isLandscapeDesktopTouch()).toBe(false); // no tap bump
    expect(isTabletPortrait()).toBe(false); // no tablet tokens
    expect(shouldForceVerticalLearnMap()).toBe(false); // List stays available
  });

  // The clause that keeps a narrow desktop window off the tablet tier.
  it("narrow desktop window (800x1000, mouse) — NOT tablet portrait", () => {
    stubDevice({ w: 800, h: 1000, coarse: false });
    expect(isTabletPortrait()).toBe(false);
    expect(shouldForceVerticalLearnMap()).toBe(false);
    expect(isLandscapeLg()).toBe(false);
  });

  // This case is why the tier has no max-width. Until 2026-09-15 the query
  // stopped at 1023px, so a 13" iPad upright — 1024 CSS px wide — fell OUT of
  // the tier and rendered a mobile shell around desktop-sized tiles. Both
  // halves are asserted here so neither can regress silently: the layout is
  // mobile (orientation) AND the tokens are the tablet tier (no width bound).
  it('13" iPad portrait (1024x1366, touch) — mobile layout AND the tablet token tier', () => {
    stubDevice({ w: 1024, h: 1366, coarse: true });
    expect(isTabletPortrait()).toBe(true); // no max-width — the 1023px gap is gone
    expect(shouldForceVerticalLearnMap()).toBe(true); // orientation, not width
    expect(isLandscapeLg()).toBe(false); // no sidebar upright
    expect(isLandscapeDesktopTouch()).toBe(false);
  });

  // The same device rotated: the ONLY thing that changes is orientation, and
  // it must flip the whole verdict. A width-based rule could not express this.
  it('13" iPad landscape (1366x1024, touch) — desktop mirror, tier OFF', () => {
    stubDevice({ w: 1366, h: 1024, coarse: true });
    expect(isTabletPortrait()).toBe(false);
    expect(isLandscapeLg()).toBe(true);
    expect(isLandscapeDesktopTouch()).toBe(true);
    expect(shouldForceVerticalLearnMap()).toBe(false);
  });

  it("returns false everywhere when matchMedia is unavailable (SSR safety)", () => {
    // @ts-expect-error deliberately removing the API to model a non-DOM env
    window.matchMedia = undefined;
    expect(isTabletPortrait()).toBe(false);
    expect(isLandscapeDesktopTouch()).toBe(false);
    expect(isLandscapeLg()).toBe(false);
    expect(shouldForceVerticalLearnMap()).toBe(false);
  });

  it("MQ.tabletPortrait is byte-identical to the index.css tier block", () => {
    // Two `:root` blocks in src/index.css and the QA page's
    // TABLET_PORTRAIT_MEDIA constant must all spell this the same way; if this
    // literal changes, grep for the others before touching it.
    expect(MQ.tabletPortrait).toBe(
      "(min-width: 640px) and (orientation: portrait) and (pointer: coarse)",
    );
    expect(MQ.tabletPortrait).not.toContain("max-width");
    expect(MQ.landscapeLg).toBe("(min-width: 1024px) and (orientation: landscape)");
  });
});
