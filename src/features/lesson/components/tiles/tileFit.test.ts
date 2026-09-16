/**
 * THE TILE TEXT RULE — the arithmetic, the wiring, and the CSS ratchet.
 *
 * Three halves, because a fit rule can fail in three different places:
 *
 *   1. THE MATH (`computeWidthRatio` / `computeFillScale` /
 *      `resolveTileScale`) — pure, so it is tested as arithmetic: a long
 *      label bottoms out AT the floor and says so, a short one stays at 1,
 *      spare room grows to the ceiling and no further.
 *   2. THE PASS (`runTileFitPass`) — the measure→decide→write loop, driven
 *      over a stubbed layout because happy-dom has none. This is the half
 *      that catches "we measured the box instead of the text" and "we wrote
 *      the variable on the wrong element".
 *   3. THE CSS (`src/index.css`) — the scale is inert unless every tile tier
 *      multiplies by it. A tier that forgets is invisible in every unit test
 *      and on every screenshot until one string is one glyph too long, which
 *      is exactly how #156 shipped.
 *
 * Geometry itself is still verified by measurement on the iPhone 15 Pro Max
 * SIMULATOR, not here and not in Chromium — Chromium and Playwright WebKit
 * both rendered #156's grid on one line while the device wrapped it.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_FILL_CEILING_RATIO,
  DEFAULT_FIT_FLOOR_RATIO,
  __resetTileFitForTests,
  computeFillScale,
  computeWidthRatio,
  quantizeScale,
  pxToken,
  readFitRatios,
  registerTile,
  resolveTileScale,
  runTileFitPass,
} from "./tileFit";
import { TILE_TOKEN_DEFS } from "@/features/lesson/dev/tileSizingTokens";

const CSS = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../../../index.css"),
  "utf8",
);

/* ── 1. The math ─────────────────────────────────────────────────────── */

describe("tile fit arithmetic", () => {
  const floorRatio = DEFAULT_FIT_FLOOR_RATIO; // 0.8
  const ceilingRatio = DEFAULT_FILL_CEILING_RATIO; // 1.25

  it("leaves a label that already fits alone", () => {
    // こうえん at 30px in a 178px box: 120px of ink, nothing to do.
    const widthRatio = computeWidthRatio(120, 178);
    expect(widthRatio).toBeGreaterThan(1);
    expect(resolveTileScale({ widthRatio, fillScale: 1, floorRatio, ceilingRatio })).toEqual({
      scale: 1,
      atFloor: false,
    });
  });

  it("shrinks a label that overflows, exactly as far as it has to", () => {
    // ばんごはん: 150px of ink in a 140px box — 0.93 fits it on one line.
    const widthRatio = computeWidthRatio(150, 140);
    const { scale, atFloor } = resolveTileScale({ widthRatio, fillScale: 1, floorRatio, ceilingRatio });
    expect(scale).toBeCloseTo(0.93, 2);
    expect(scale).toBeLessThan(1);
    expect(scale).toBeGreaterThanOrEqual(floorRatio);
    expect(atFloor).toBe(false); // it fits at this size, so it must not wrap
  });

  it("stops AT the floor for a label no shrink can save, and only then allows a wrap", () => {
    // Twice as wide as its box: 0.5 would be needed, 0.8 is the floor.
    const widthRatio = computeWidthRatio(360, 180);
    const { scale, atFloor } = resolveTileScale({ widthRatio, fillScale: 1, floorRatio, ceilingRatio });
    expect(scale).toBe(floorRatio);
    expect(scale).toBeGreaterThanOrEqual(floorRatio);
    expect(atFloor).toBe(true);
  });

  it("never shrinks a tile it could not measure", () => {
    expect(computeWidthRatio(0, 180)).toBe(Infinity);
    expect(computeWidthRatio(150, 0)).toBe(Infinity);
    expect(resolveTileScale({ widthRatio: Infinity, fillScale: 1, floorRatio, ceilingRatio }).scale).toBe(1);
  });

  it("rounds DOWN to a scale step, never into an overflow", () => {
    expect(quantizeScale(0.9349)).toBeCloseTo(0.93, 5);
    expect(quantizeScale(1.2499)).toBeCloseTo(1.24, 5);
  });

  it("grows into spare room, up to the ceiling and no further", () => {
    // 95px of bank under 320px of dead space (the #152 screen).
    const fill = computeFillScale({ freeHeight: 320, groupHeight: 95, currentFill: 1, ceilingRatio });
    expect(fill).toBe(ceilingRatio);
    const { scale } = resolveTileScale({ widthRatio: Infinity, fillScale: fill, floorRatio, ceilingRatio });
    expect(scale).toBe(ceilingRatio);
  });

  it("grows only part-way when the room is only part-way there", () => {
    const fill = computeFillScale({ freeHeight: 26, groupHeight: 100, currentFill: 1, ceilingRatio });
    expect(fill).toBeCloseTo(1.2, 2); // (100 + 26 - 6) / 100
    expect(fill).toBeLessThan(ceilingRatio);
  });

  it("stays at 1 when there is no room — a full stage keeps the founder's numbers", () => {
    expect(computeFillScale({ freeHeight: 0, groupHeight: 200, currentFill: 1, ceilingRatio })).toBe(1);
    expect(computeFillScale({ freeHeight: 4, groupHeight: 200, currentFill: 1, ceilingRatio })).toBe(1);
  });

  it("never returns a fill below 1 — shrinking is FIT's job, not FILL's", () => {
    expect(
      computeFillScale({ freeHeight: -400, groupHeight: 200, currentFill: 1, ceilingRatio }),
    ).toBe(1);
  });

  it("gives room back when the stage loses it (a grown tile shrinks toward 1)", () => {
    const back = computeFillScale({ freeHeight: -30, groupHeight: 200, currentFill: 1.25, ceilingRatio });
    expect(back).toBeLessThan(1.25);
    expect(back).toBeGreaterThanOrEqual(1);
  });

  it("holds the width cap when the fill wants more than the label can take", () => {
    // The founder's own case: room to grow, but only 1.18x before it wraps.
    const widthRatio = computeWidthRatio(150, 178);
    const { scale } = resolveTileScale({ widthRatio, fillScale: 1.25, floorRatio, ceilingRatio });
    expect(scale).toBeCloseTo(1.18, 2);
    expect(scale).toBeLessThan(1.25);
  });

  it("reads the floor/ceiling RATIO off the plain-tile tokens, whatever tier it runs in", () => {
    const cs = fakeStyle({ "--tile-font": "18.3px", "--tile-font-floor": "14.6px", "--tile-font-ceiling": "22.9px" });
    const { floorRatio: f, ceilingRatio: c } = readFitRatios(cs);
    expect(f).toBeCloseTo(0.798, 3);
    expect(c).toBeCloseTo(1.251, 3);
    // …and falls back to the shipped defaults when the tokens are absent.
    const bare = readFitRatios(fakeStyle({}));
    expect(bare).toEqual({ floorRatio: DEFAULT_FIT_FLOOR_RATIO, ceilingRatio: DEFAULT_FILL_CEILING_RATIO });
  });
});

describe("FILL spends measured px only", () => {
  // The budget's unit is the whole safety argument: on the founder's phone the
  // stage's own box over-reports by ~200px and three height units are live at
  // once (dvh on the shell, cqh on the stage, vh on the overlay card), so a
  // budget in any of them would grow tiles into space that is not on screen
  // (b20 #157/#161). px, or nothing.
  it("accepts a px stage height and rejects every unit that lies on device", () => {
    expect(pxToken("743px")).toBe(743);
    expect(pxToken(" 584.5px ")).toBe(584.5);
    for (const bad of ["80vh", "100dvh", "10cqh", "50%", "743", "", "calc(100dvh - 24px)", "auto"]) {
      expect(pxToken(bad), bad).toBeNull();
    }
  });
});

/* ── 2. The pass ─────────────────────────────────────────────────────── */

type StyleMap = Record<string, string>;

function fakeStyle(vars: StyleMap, extra: StyleMap = {}): CSSStyleDeclaration {
  return {
    ...extra,
    getPropertyValue: (k: string) => vars[k] ?? "",
  } as unknown as CSSStyleDeclaration;
}

/**
 * A tile with a known box and a known ink width. happy-dom lays nothing out,
 * so the three things the pass reads — the element's content box, its
 * computed style, and the Range around its contents — are each stubbed.
 */
function makeTile(opts: {
  text: string;
  boxWidth: number;
  inkWidth: number;
  variant?: string;
  fontPx?: number;
  tray?: HTMLElement;
}) {
  const el = document.createElement("button");
  el.setAttribute("data-tile", "");
  el.setAttribute("data-variant", opts.variant ?? "option");
  el.textContent = opts.text;
  Object.defineProperty(el, "clientWidth", { value: opts.boxWidth, configurable: true });
  Object.defineProperty(el, "offsetWidth", { value: opts.boxWidth + 4, configurable: true });
  Object.defineProperty(el, "isConnected", { value: true, configurable: true });
  (el as unknown as { __ink: number }).__ink = opts.inkWidth;
  (el as unknown as { __font: number }).__font = opts.fontPx ?? 30;
  (opts.tray ?? document.body).appendChild(el);
  return el;
}

/** A tray, so two tiles can be put in different cohorts. */
function makeTray() {
  const tray = document.createElement("div");
  tray.setAttribute("data-tile-tray", "");
  tray.setAttribute("data-kind", "grid");
  Object.defineProperty(tray, "clientWidth", { value: 400, configurable: true });
  document.body.appendChild(tray);
  return tray;
}

const TOKENS: StyleMap = {
  "--tile-font": "18.3px",
  "--tile-font-floor": "14.6px",
  "--tile-font-ceiling": "22.9px",
};

describe("runTileFitPass", () => {
  // Saved and restored by hand rather than with `vi.spyOn`: `getComputedStyle`
  // is read through the bare global by the module under test, and happy-dom's
  // `Range` may not carry `getBoundingClientRect` at all.
  type G = { getComputedStyle: (node: Element) => CSSStyleDeclaration };
  let realGetComputedStyle: G["getComputedStyle"];
  let realRangeRect: Range["getBoundingClientRect"] | undefined;

  beforeEach(() => {
    __resetTileFitForTests();
    document.body.innerHTML = "";
    const g = globalThis as unknown as G;
    realGetComputedStyle = g.getComputedStyle;
    realRangeRect = Range.prototype.getBoundingClientRect;
    g.getComputedStyle = (node: Element) => {
      const el = node as HTMLElement & { __font?: number };
      return fakeStyle(TOKENS, {
        display: "flex",
        fontSize: `${(el.__font ?? 16) * currentScale(el)}px`,
        fontFamily: "system-ui",
        fontWeight: "700",
        letterSpacing: "normal",
        paddingLeft: "7px",
        paddingRight: "7px",
        paddingTop: "0px",
        paddingBottom: "0px",
        borderTopWidth: "0px",
        borderBottomWidth: "0px",
        rowGap: "0px",
      });
    };
    // The ink the engine would lay out, scaled by whatever we have applied.
    Range.prototype.getBoundingClientRect = function (this: Range) {
      const el = this.commonAncestorContainer as HTMLElement & { __ink?: number };
      const ink = (el?.__ink ?? 0) * currentScale(el);
      return { width: ink, height: 20, top: 0, bottom: 20, left: 0, right: ink } as DOMRect;
    };
  });
  afterEach(() => {
    const g = globalThis as unknown as G;
    g.getComputedStyle = realGetComputedStyle;
    if (realRangeRect) Range.prototype.getBoundingClientRect = realRangeRect;
    vi.restoreAllMocks();
    __resetTileFitForTests();
  });

  function currentScale(el: HTMLElement | null | undefined): number {
    const raw = el?.style?.getPropertyValue?.("--tile-fit-scale");
    const n = Number.parseFloat(raw ?? "");
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  it("marks every registered tile with the scale variable and the fit state", () => {
    const el = makeTile({ text: "こうえん", boxWidth: 192, inkWidth: 120 });
    registerTile(el, { hugsContent: false, fill: false });
    expect(el.style.getPropertyValue("--tile-fit-scale")).toBe("1");
    expect(el.dataset.tileFit).toBe("fit");
  });

  it("leaves a grid whose labels all fit at 1", () => {
    const tray = makeTray();
    // 14px of padding + 1px of sub-pixel headroom comes off each box.
    const a = makeTile({ text: "こうえん", boxWidth: 164, inkWidth: 120, tray });
    const b = makeTile({ text: "だいがく", boxWidth: 164, inkWidth: 120, tray });
    registerTile(a, { hugsContent: false, fill: false });
    registerTile(b, { hugsContent: false, fill: false });
    runTileFitPass();
    expect(Number(a.style.getPropertyValue("--tile-fit-scale"))).toBe(1);
    expect(Number(b.style.getPropertyValue("--tile-fit-scale"))).toBe(1);
  });

  it("shrinks a grid to its LONGEST label — siblings never render at two sizes", () => {
    // The 2026-05-17 MCQ rule ("one uniform display size picked by the longest
    // option"), and #137. `long` needs 0.83; `short` would happily sit at 1.
    const tray = makeTray();
    const long = makeTile({ text: "ばんごはん", boxWidth: 140, inkWidth: 150, tray });
    const short = makeTile({ text: "こうえん", boxWidth: 140, inkWidth: 100, tray });
    registerTile(long, { hugsContent: false, fill: false });
    registerTile(short, { hugsContent: false, fill: false });
    runTileFitPass();
    const scale = Number(long.style.getPropertyValue("--tile-fit-scale"));
    expect(scale).toBeCloseTo(0.83, 2);
    expect(Number(short.style.getPropertyValue("--tile-fit-scale"))).toBe(scale);
    expect(long.dataset.tileFit).toBe("fit"); // shrunk, not wrapped
  });

  it("keeps a different tray out of it", () => {
    const one = makeTray();
    const two = makeTray();
    const tight = makeTile({ text: "ばんごはん", boxWidth: 140, inkWidth: 150, tray: one });
    const roomy = makeTile({ text: "こうえん", boxWidth: 164, inkWidth: 100, tray: two });
    registerTile(tight, { hugsContent: false, fill: false });
    registerTile(roomy, { hugsContent: false, fill: false });
    runTileFitPass();
    expect(Number(tight.style.getPropertyValue("--tile-fit-scale"))).toBeLessThan(1);
    expect(Number(roomy.style.getPropertyValue("--tile-fit-scale"))).toBe(1);
  });

  it("stops at the floor, and only there does the tile get to wrap", () => {
    const tray = makeTray();
    const tighter = makeTile({ text: "ばんごはん", boxWidth: 120, inkWidth: 150, tray });
    registerTile(tighter, { hugsContent: false, fill: false });
    runTileFitPass();
    // 105 usable against 150 of ink → 0.70 needed; the floor is 14.6/18.3.
    expect(Number(tighter.style.getPropertyValue("--tile-fit-scale"))).toBeCloseTo(0.8, 2);
    expect(tighter.dataset.tileFit).toBe("floor");
  });

  it("converges — a second pass over an already-fitted tile changes nothing", () => {
    const el = makeTile({ text: "ばんごはん", boxWidth: 140, inkWidth: 150 });
    registerTile(el, { hugsContent: false, fill: false });
    runTileFitPass();
    const first = el.style.getPropertyValue("--tile-fit-scale");
    expect(Number(first)).toBeLessThan(1);
    runTileFitPass();
    runTileFitPass();
    expect(el.style.getPropertyValue("--tile-fit-scale")).toBe(first);
  });

  it("does not fit the word-build pill's zero-width pre-sizer", () => {
    const el = makeTile({ text: "ひま", boxWidth: 0, inkWidth: 47, variant: "build" });
    el.dataset.collapsed = "true";
    registerTile(el, { hugsContent: true, fill: true });
    runTileFitPass();
    expect(el.style.getPropertyValue("--tile-fit-scale")).toBe("1");
  });

  it("leaves tiles alone outside a lesson stage (the QA page dials real numbers)", () => {
    const el = makeTile({ text: "こうえん", boxWidth: 192, inkWidth: 120 });
    registerTile(el, { hugsContent: false, fill: true });
    runTileFitPass();
    expect(Number(el.style.getPropertyValue("--tile-fit-scale"))).toBe(1);
  });
});

/* ── 3. The CSS ratchet ──────────────────────────────────────────────── */

describe("index.css carries the rule", () => {
  it("declares the floor and ceiling in all three tiers, at the registry's values", () => {
    for (const key of ["--tile-font-floor", "--tile-font-ceiling"]) {
      const def = TILE_TOKEN_DEFS.find((d) => d.key === key);
      expect(def, `${key} must be dialable on /:lang/qa/tiles`).toBeDefined();
      for (const tier of ["base", "sm", "tabletPortrait"] as const) {
        expect(
          CSS.includes(`${key}: ${def![tier]}px;`),
          `${key} ${tier} (${def![tier]}px) must exist verbatim in index.css`,
        ).toBe(true);
      }
    }
  });

  it("multiplies every tile tier's font-size by the scale (except prose)", () => {
    const block = CSS.slice(
      CSS.indexOf("TILE PRIMITIVE — one block"),
      CSS.indexOf("/* ── Tray / bank / grid layout"),
    );
    // Split into rules and check each one that sets a font-size.
    const rules = block.split("}");
    for (const rule of rules) {
      const brace = rule.indexOf("{");
      if (brace < 0) continue;
      const selector = rule.slice(0, brace);
      const body = rule.slice(brace + 1);
      if (!selector.includes("[data-tile]") || !body.includes("font-size:")) continue;
      if (selector.includes('data-size="sentence"')) {
        expect(body.includes("--tile-fit-scale")).toBe(false); // prose opts out
        continue;
      }
      expect(
        body.includes("var(--tile-fit-scale)"),
        `tier ${selector.trim().slice(0, 60)} sets a font-size the fit rule cannot reach`,
      ).toBe(true);
    }
  });

  it("keeps the ruby em-relative, so furigana scales with the word it sits on", () => {
    // #87 ("we didn't shrink the furigana small enough… needed to be the other
    // way around"): the reading is a fraction of the WORD, so a scaled word
    // carries it. The two absolute floors below it are Spencer's readability
    // minimum and are supposed to stop following.
    expect(/--ruby-font:\s*0?\.\d+em;/.test(CSS)).toBe(true);
    expect(/--tile-kana-font:\s*1\.\d+em;/.test(CSS)).toBe(true);
    expect(CSS.includes("font-size: max(var(--ruby-font), var(--ruby-floor-kanji));")).toBe(true);
  });

  it("only lets a tile wrap once it has bottomed out at the floor", () => {
    expect(CSS.includes("[data-tile][data-tile-fit] {\n  white-space: nowrap;\n}")).toBe(true);
    expect(CSS.includes('[data-tile][data-tile-fit="floor"] {\n  white-space: normal;')).toBe(true);
  });
});
