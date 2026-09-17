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
  naturalHeightAtScale,
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

  // Class E (2026-09-16). The grow-only rule is still the DEFAULT — every
  // caller that does not pass a floor gets it — but a stage that is
  // overflowing may now be handed one.
  it("shrinks below 1 when, and only when, it is given a floor to shrink to", () => {
    const overfull = { freeHeight: -120, groupHeight: 400, currentFill: 1, ceilingRatio: 1.25 };
    expect(computeFillScale(overfull)).toBe(1);
    const shrunk = computeFillScale({ ...overfull, floorRatio: 0.8 });
    expect(shrunk).toBeLessThan(1);
    expect(shrunk).toBeGreaterThanOrEqual(0.8);
  });

  it("never shrinks past the floor the founder dialled, however far it overflows", () => {
    expect(
      computeFillScale({ freeHeight: -5000, groupHeight: 400, currentFill: 1, ceilingRatio: 1.25, floorRatio: 0.8 }),
    ).toBe(0.8);
  });

  it("honours a sub-1 fill all the way to the tile — the stage cap is not lost in the clamp", () => {
    const { scale } = resolveTileScale({ widthRatio: Infinity, fillScale: 0.9, floorRatio: 0.8, ceilingRatio: 1.25 });
    expect(scale).toBeCloseTo(0.9, 2);
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

  // Class B (2026-09-16): a tier may state its own pair. The 30px MCQ `word`
  // tier used to inherit the 18.3px build tile's 0.8x ratio = a 24px floor, so
  // a 10-glyph single word wrapped instead of shrinking (#156's shape).
  /**
   * THE FLOOR DOES NOT RIDE THE SLIDER (phase 2B). `--tile-a11y-scale`
   * multiplies the rendered font, so a tier's floor expressed as a RATIO of
   * the declared size would grow with it — and a floor is "how small is too
   * small", an absolute number, not a target. Measured: with a scaled floor a
   * four-option Spanish sentence MCQ could not shrink below 22.5px at 125% and
   * overflowed by 232px. Below 100% the floor DOES come down, or FIT has no
   * room and labels wrap instead of shrinking.
   */
  it("gives the width half and the fill half different floors above 100%", () => {
    const cs = (a11y: string) =>
      ({
        getPropertyValue: (k: string) =>
          ({
            "--fit-font": "22px",
            "--fit-font-floor": "18px",
            "--tile-font": "18.3px",
            "--tile-font-ceiling": "22.9px",
            "--tile-a11y-scale": a11y,
          })[k] ?? "",
      }) as unknown as CSSStyleDeclaration;
    // 100%: one number, as it always was.
    const at100 = readFitRatios(cs("1"));
    expect(at100.floorRatio).toBeCloseTo(18 / 22, 4);
    expect(at100.fillFloorRatio).toBeCloseTo(18 / 22, 4);
    // 125%: the WIDTH floor rides the slider — 27.5px x ratio = 22.5px, so a
    // tile with room to wrap renders bigger, which is what the user asked for.
    const at125 = readFitRatios(cs("1.25"));
    expect(22 * 1.25 * at125.floorRatio).toBeCloseTo(22.5, 3);
    // …and the FILL floor does not: 27.5px x ratio is still the dialled 18px,
    // so a stage that would otherwise SCROLL can come all the way back down.
    expect(22 * 1.25 * at125.fillFloorRatio).toBeCloseTo(18, 3);
    // 85%: both come DOWN with the slider, or FIT has no room and labels wrap
    // instead of shrinking — the order backwards.
    const at85 = readFitRatios(cs("0.85"));
    expect(at85.floorRatio).toBeCloseTo(18 / 22, 4);
    expect(at85.fillFloorRatio).toBeCloseTo(18 / 22, 4);
    // The ceiling is a growth POLICY and rides the slider (its ratio holds).
    expect(at125.ceilingRatio).toBeCloseTo(22.9 / 18.3, 4);
  });

  it("lets FILL shrink past the width floor, and never lets the WIDTH fit do it", () => {
    // A stage that overflows: fill 0.7, no width constraint. The width floor is
    // 0.818 and the fill floor 0.654 — the fill number must survive.
    expect(
      resolveTileScale({
        widthRatio: Infinity,
        fillScale: 0.7,
        floorRatio: 0.818,
        fillFloorRatio: 0.654,
        ceilingRatio: 1.25,
      }).scale,
    ).toBeCloseTo(0.7, 2);
    // …and it stops at the fill floor, not below it.
    expect(
      resolveTileScale({
        widthRatio: Infinity,
        fillScale: 0.4,
        floorRatio: 0.818,
        fillFloorRatio: 0.654,
        ceilingRatio: 1.25,
      }).scale,
    ).toBeCloseTo(0.654, 2);
    // A label far too wide on a stage with room: the WIDTH half stops at ITS
    // floor and reports `atFloor` so the tile may wrap — it must NOT fall
    // through to the lower fill floor.
    const wide = resolveTileScale({
      widthRatio: 0.4,
      fillScale: 1,
      floorRatio: 0.818,
      fillFloorRatio: 0.654,
      ceilingRatio: 1.25,
    });
    expect(wide.scale).toBeCloseTo(0.818, 3);
    expect(wide.atFloor).toBe(true);
  });

  it("prefers a tier's OWN fit pair over the plain tile's", () => {
    const cs = {
      getPropertyValue: (k: string) =>
        ({
          "--tile-font": "18.3px",
          "--tile-font-floor": "14.6px",
          "--tile-font-ceiling": "22.9px",
          "--fit-font": "30px",
          "--fit-font-floor": "22px",
        })[k] ?? "",
    } as unknown as CSSStyleDeclaration;
    const { floorRatio, ceilingRatio } = readFitRatios(cs);
    expect(floorRatio).toBeCloseTo(22 / 30, 4);
    // No tier ceiling declared → it keeps the plain tile's growth policy.
    expect(ceilingRatio).toBeCloseTo(22.9 / 18.3, 4);
  });

  it("falls back to the plain tile for every tier that states nothing — build/listen/match are untouched", () => {
    const cs = {
      getPropertyValue: (k: string) =>
        ({ "--tile-font": "21px", "--tile-font-floor": "16.8px", "--tile-font-ceiling": "31.5px" })[k] ?? "",
    } as unknown as CSSStyleDeclaration;
    const { floorRatio, ceilingRatio } = readFitRatios(cs);
    expect(floorRatio).toBeCloseTo(0.8, 4);
    expect(ceilingRatio).toBeCloseTo(1.5, 4);
  });

  it("reads the floor/ceiling RATIO off the plain-tile tokens, whatever tier it runs in", () => {
    const cs = fakeStyle({ "--tile-font": "18.3px", "--tile-font-floor": "14.6px", "--tile-font-ceiling": "22.9px" });
    const { floorRatio: f, ceilingRatio: c } = readFitRatios(cs);
    expect(f).toBeCloseTo(0.798, 3);
    expect(c).toBeCloseTo(1.251, 3);
    // …and falls back to the shipped defaults when the tokens are absent.
    const bare = readFitRatios(fakeStyle({}));
    expect(bare).toEqual({
      floorRatio: DEFAULT_FIT_FLOOR_RATIO,
      ceilingRatio: DEFAULT_FILL_CEILING_RATIO,
      // No slider on the element (SSR, a stripped stylesheet) = the two floors
      // are the same number, which is what they were before the slider existed.
      fillFloorRatio: DEFAULT_FIT_FLOOR_RATIO,
    });
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
  /** Laid-out ink HEIGHT — a ruby tile is taller than a kana one by its band. */
  inkHeight?: number;
  /** Ink the engine could not fit, i.e. `scrollWidth - clientWidth` (T3). */
  overflowPx?: number;
}) {
  const el = document.createElement("button");
  el.setAttribute("data-tile", "");
  el.setAttribute("data-variant", opts.variant ?? "option");
  el.textContent = opts.text;
  Object.defineProperty(el, "clientWidth", { value: opts.boxWidth, configurable: true });
  Object.defineProperty(el, "offsetWidth", { value: opts.boxWidth + 4, configurable: true });
  Object.defineProperty(el, "scrollWidth", {
    value: opts.boxWidth + (opts.overflowPx ?? 0),
    configurable: true,
  });
  Object.defineProperty(el, "isConnected", { value: true, configurable: true });
  (el as unknown as { __ink: number }).__ink = opts.inkWidth;
  (el as unknown as { __inkH: number }).__inkH = opts.inkHeight ?? 20;
  (el as unknown as { __font: number }).__font = opts.fontPx ?? 30;
  (opts.tray ?? document.body).appendChild(el);
  return el;
}

/** A lesson stage + its scroller, so FILL and the row cohort have a host. */
function makeStage() {
  const scroller = document.createElement("div");
  const stage = document.createElement("div");
  stage.setAttribute("data-lesson-stage", "");
  scroller.appendChild(stage);
  document.body.appendChild(scroller);
  return stage;
}

/** A tray, so two tiles can be put in different cohorts. */
function makeTray(kind: "grid" | "tray" | "bank" = "grid") {
  const tray = document.createElement("div");
  tray.setAttribute("data-tile-tray", "");
  tray.setAttribute("data-kind", kind);
  Object.defineProperty(tray, "clientWidth", { value: 400, configurable: true });
  document.body.appendChild(tray);
  return tray;
}

/** Stub one element's layout box. `h()` is re-read on every pass, so a box
 *  may respond to the scale the previous pass applied. */
function stubBox(el: HTMLElement, top: () => number, bottom: () => number) {
  Object.defineProperty(el, "getBoundingClientRect", {
    value: () =>
      ({ top: top(), bottom: bottom(), height: bottom() - top(), left: 0, right: 400, width: 400 }) as DOMRect,
    configurable: true,
  });
}

const TOKENS: StyleMap = {
  "--tile-font": "18.3px",
  "--tile-font-floor": "14.6px",
  "--tile-font-ceiling": "22.9px",
  "--tile-box-h": "45px",
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
      const el = this.commonAncestorContainer as HTMLElement & {
        __ink?: number;
        __inkH?: number;
      };
      const ink = (el?.__ink ?? 0) * currentScale(el);
      const h = (el?.__inkH ?? 20) * currentScale(el);
      return { width: ink, height: h, top: 0, bottom: h, left: 0, right: ink } as DOMRect;
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

  /* ── #137: ONE row height per cohort (Class A, 2026-09-16) ─────────── */

  it("gives every tile in a build cohort ONE row height — a ruby tile and a kana tile match", () => {
    // The shipped failure verbatim: a kanji tile carries a reading band, a
    // kana-only tile does not, and on the 15 Pro Max they rendered 65px and
    // 53px in the same bank (22.6% spread, up to 52% on an m16 listen bank).
    const stage = makeStage();
    const tray = makeTray();
    stage.appendChild(tray);
    const kanji = makeTile({ text: "明日", boxWidth: 164, inkWidth: 60, inkHeight: 58, variant: "build", tray });
    const kana = makeTile({ text: "ひま", boxWidth: 164, inkWidth: 60, inkHeight: 46, variant: "build", tray });
    registerTile(kanji, { hugsContent: true, fill: false, uniformHeight: true });
    registerTile(kana, { hugsContent: true, fill: false, uniformHeight: true });
    runTileFitPass();
    const a = kanji.style.getPropertyValue("--tile-row-h");
    const b = kana.style.getPropertyValue("--tile-row-h");
    expect(a).toBe(b);
    expect(Number.parseFloat(a)).toBeGreaterThanOrEqual(58); // the tallest natural
  });

  it("never lets the row height ratchet: a settled cohort writes nothing on the next pass", () => {
    const stage = makeStage();
    const tray = makeTray();
    stage.appendChild(tray);
    const t = makeTile({ text: "明日", boxWidth: 164, inkWidth: 60, inkHeight: 58, variant: "build", tray });
    registerTile(t, { hugsContent: true, fill: false, uniformHeight: true });
    runTileFitPass();
    const first = t.style.getPropertyValue("--tile-row-h");
    runTileFitPass();
    runTileFitPass();
    expect(t.style.getPropertyValue("--tile-row-h")).toBe(first);
  });

  it("holds the cohort at the founder's --tile-box-h when every tile is shorter", () => {
    const stage = makeStage();
    const tray = makeTray();
    stage.appendChild(tray);
    const t = makeTile({ text: "で", boxWidth: 164, inkWidth: 30, inkHeight: 20, variant: "build", tray });
    registerTile(t, { hugsContent: true, fill: false, uniformHeight: true });
    runTileFitPass();
    expect(Number.parseFloat(t.style.getPropertyValue("--tile-row-h"))).toBe(45);
  });

  it("a tile joining a sized cohort is BORN at its scale and row height (b25)", () => {
    // The frame the learner sees on a tap: `registerTile` runs in a layout
    // effect, before paint, so the placed tile must already carry the
    // cohort's numbers — not 1, corrected a frame later.
    const stage = makeStage();
    const tray = makeTray("tray");
    stage.appendChild(tray);
    const first = makeTile({ text: "ながいことば", boxWidth: 100, inkWidth: 200, inkHeight: 58, variant: "build", tray });
    registerTile(first, { hugsContent: false, fill: false, uniformHeight: true });
    runTileFitPass();
    const scale = first.style.getPropertyValue("--tile-fit-scale");
    const rowH = first.style.getPropertyValue("--tile-row-h");
    expect(Number.parseFloat(scale)).toBeCloseTo(0.8, 2);

    const placed = makeTile({ text: "ながいことば", boxWidth: 100, inkWidth: 200, inkHeight: 58, variant: "build", tray });
    registerTile(placed, { hugsContent: false, fill: false, uniformHeight: true });
    // NO PASS YET — this is the mount frame.
    expect(placed.style.getPropertyValue("--tile-fit-scale")).toBe(scale);
    expect(placed.style.getPropertyValue("--tile-row-h")).toBe(rowH);
    expect(placed.dataset.tileFit).toBe("floor"); // the cohort's state, not "fit"

    // THE FIRST PLACED TILE is the first member of the `slot="tray"` cohort,
    // so the exact key misses and the same-variant fallback carries it — the
    // measured tap-1 case (`ja-m34-neo-7?step=5`, prompt moved 1.2px).
    const firstPlaced = makeTile({ text: "ながいことば", boxWidth: 100, inkWidth: 200, inkHeight: 58, variant: "build", tray });
    firstPlaced.dataset.slot = "tray";
    registerTile(firstPlaced, { hugsContent: false, fill: false, uniformHeight: true });
    expect(firstPlaced.style.getPropertyValue("--tile-fit-scale")).toBe(scale);

    // A tile in a DIFFERENT tier on the same stage inherits nothing.
    const other = makeTile({ text: "park", boxWidth: 164, inkWidth: 60, variant: "match", tray });
    registerTile(other, { hugsContent: false, fill: false });
    expect(other.style.getPropertyValue("--tile-fit-scale")).toBe("1");
  });

  it("a tile that mounts mid-build cannot inflate its cohort's row for a frame (b25)", () => {
    // MEASURED, 15 Pro Max at 125% (`ja-m15-neo-6?step=15`, `--simulate
    // build`): on the tap that mounted a new tray tile, `--tile-row-h` went
    // 53 → 80 → 53 in 12ms and took the prompt 5.4px up and back with it
    // (`noFlicker` maxH2Jump=5.4, 4 reversals). The new tile is read BEFORE
    // its scale has ever been written, so its ink is a scale-1 lie, and the
    // row height is a MAX over the cohort — one lie is enough.
    const stage = makeStage();
    const tray = makeTray("tray");
    stage.appendChild(tray);
    // A label wider than its box, so the cohort sits at the fit floor.
    const first = makeTile({ text: "ながいことば", boxWidth: 100, inkWidth: 200, inkHeight: 58, variant: "build", tray });
    registerTile(first, { hugsContent: false, fill: false, uniformHeight: true });
    runTileFitPass();
    expect(currentScale(first)).toBeCloseTo(0.8, 2);
    const settled = first.style.getPropertyValue("--tile-row-h");
    expect(Number.parseFloat(settled)).toBeLessThan(58); // the floor scaled the ink down

    // THE TAP: an identical tile mounts into the same cohort, unscaled.
    const placed = makeTile({ text: "ながいことば", boxWidth: 100, inkWidth: 200, inkHeight: 58, variant: "build", tray });
    registerTile(placed, { hugsContent: false, fill: false, uniformHeight: true });
    runTileFitPass(); // ONE pass — the frame the learner actually sees

    expect(placed.style.getPropertyValue("--tile-row-h")).toBe(settled);
    expect(first.style.getPropertyValue("--tile-row-h")).toBe(settled);
  });

  it("does not publish a row height for the tiers whose grid already owns one", () => {
    const stage = makeStage();
    const tray = makeTray();
    stage.appendChild(tray);
    const m = makeTile({ text: "park", boxWidth: 164, inkWidth: 60, variant: "match", tray });
    registerTile(m, { hugsContent: false, fill: false });
    runTileFitPass();
    expect(m.style.getPropertyValue("--tile-row-h")).toBe("");
  });

  /* ── T3: the Range under-reads a shrink-to-fit flex item ───────────── */

  it("counts the ink a clipped label could not fit, so `atFloor` can fire", () => {
    // `ja-m3-neo-5?step=23`: "excuse me / sorry (to a stranger)" reported
    // clipped=true at fit-scale 0.88 while its siblings sat at the 0.80 floor —
    // the Range measured the shrunk flex item, not the label.
    const tray = makeTray();
    const clipped = makeTile({
      text: "excuse me / sorry (to a stranger)",
      boxWidth: 160,
      inkWidth: 146, // what the Range reports: the content box, not the ink
      overflowPx: 120, // what scrollWidth knows: 120px more of label
      tray,
    });
    registerTile(clipped, { hugsContent: false, fill: false });
    runTileFitPass();
    expect(clipped.dataset.tileFit).toBe("floor");
    expect(Number(clipped.style.getPropertyValue("--tile-fit-scale"))).toBeCloseTo(0.8, 2);
  });

  it("scales a prose tile but never marks it nowrap, however narrow its box", () => {
    const tray = makeTray();
    const prose = makeTile({ text: "me duelen los ojos — tengo que ir al hospital", boxWidth: 192, inkWidth: 600, tray });
    registerTile(prose, { hugsContent: false, fill: false, nowrap: false });
    runTileFitPass();
    expect(prose.dataset.tileFit).toBe("prose");
    // Still in the rule: it took the floor rather than staying at 1.
    expect(Number(prose.style.getPropertyValue("--tile-fit-scale"))).toBeLessThan(1);
  });

  it("never walks the scale down pass after pass on a stage with no room to grow", () => {
    // `freeHeight` is clamped at >= 0 and `FILL_SAFETY_PX` is then taken off
    // it, so a full-but-not-overflowing stage computes a growth factor of
    // ~0.98. With a sub-1 floor reachable from the GROW branch it took that
    // 2% every pass: measured on the 15 Pro Max, the m16 listen word walked
    // 21px -> 16px and the iPad's 28px -> 19px with the scroller never
    // scrolling once.
    const stage = makeStage();
    const tray = makeTray();
    stage.appendChild(tray);
    const scroller = stage.parentElement as HTMLElement;
    Object.defineProperty(scroller, "scrollHeight", { value: 739, configurable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 739, configurable: true });
    const t = makeTile({ text: "こうえん", boxWidth: 164, inkWidth: 100, variant: "listen", tray });
    registerTile(t, { hugsContent: true, fill: true, uniformHeight: true });
    for (let i = 0; i < 10; i += 1) runTileFitPass();
    expect(Number(t.style.getPropertyValue("--tile-fit-scale"))).toBeGreaterThanOrEqual(1);
  });

  it("does not shrink a stage that is not scrolling, however close its box runs to the fold", () => {
    // The first cut of the shrink half triggered on `contentBottom >
    // budgetBottom`, which includes the STAGE'S OWN bottom — a constant no
    // amount of shrinking moves. Measured on the 15 Pro Max: a listen bank
    // with `scrollHeight === clientHeight` and 204px of visible slack took its
    // word from 21px to 16px and dead space from 29.4% to 39.7%.
    const stage = makeStage();
    const tray = makeTray();
    stage.appendChild(tray);
    const scroller = stage.parentElement as HTMLElement;
    // Not scrolling: scrollHeight === clientHeight.
    Object.defineProperty(scroller, "scrollHeight", { value: 743, configurable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 743, configurable: true });
    const t = makeTile({ text: "こうえん", boxWidth: 164, inkWidth: 100, variant: "listen", tray });
    registerTile(t, { hugsContent: true, fill: true, uniformHeight: true });
    runTileFitPass();
    runTileFitPass();
    expect(Number(t.style.getPropertyValue("--tile-fit-scale"))).toBeGreaterThanOrEqual(1);
  });

  it("gives a scrolling MATCH grid its row back — shrink-only is still in FILL", () => {
    // Phase 3, the one thing 2B made worse. `match` was excluded from FILL
    // outright (growing it is #157), so when the English gloss on
    // `ja-m3-neo-5?step=23` wrapped to three lines at 125% the grid's
    // min-content rows burst the `--match-tile-h` ceiling and the step
    // overflowed by 103px with rows ragged by 30% — and NOTHING could give
    // the row back, because the only mechanism that can was off for the whole
    // variant. The exclusion is one-directional now: out of GROW, in SHRINK.
    const stage = makeStage();
    const tray = makeTray();
    stage.appendChild(tray);
    const scroller = stage.parentElement as HTMLElement;
    Object.defineProperty(scroller, "scrollHeight", { value: 822, configurable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 719, configurable: true });
    Object.defineProperty(tray, "getBoundingClientRect", {
      value: () => ({ top: 0, bottom: 544, height: 544, left: 0, right: 400, width: 400 }) as DOMRect,
      configurable: true,
    });
    const t = makeTile({ text: "excuse me / sorry (to a stranger)", boxWidth: 188, inkWidth: 150, variant: "match", tray });
    registerTile(t, { hugsContent: false, fill: true, fillGrow: false });
    runTileFitPass();
    runTileFitPass();
    expect(Number(t.style.getPropertyValue("--tile-fit-scale"))).toBeLessThan(1);
  });

  it("never GROWS a shrink-only tile, on a stage that grows its siblings", () => {
    // The other half of the ruling, and the half with the founder's name on
    // it: `--match-tile-h` is his b17 dial (#157) and a match label bigger
    // than he dialled IS the regression he reported. The control tile in this
    // stage takes the same FILL decision and grows; the match tile holds at 1.
    const stage = makeStage();
    const tray = makeTray();
    stage.appendChild(tray);
    const scroller = stage.parentElement as HTMLElement;
    Object.defineProperty(scroller, "scrollHeight", { value: 500, configurable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 500, configurable: true });
    const rect = (top: number, bottom: number) =>
      ({ top, bottom, height: bottom - top, left: 0, right: 400, width: 400 }) as DOMRect;
    Object.defineProperty(tray, "getBoundingClientRect", { value: () => rect(0, 200), configurable: true });
    Object.defineProperty(stage, "getBoundingClientRect", { value: () => rect(0, 500), configurable: true });
    // A px `--stage-h` is the only height FILL is allowed to spend (every
    // other unit lies on the device), so the budget has to be declared here.
    const g = globalThis as unknown as { getComputedStyle: (n: Element) => CSSStyleDeclaration };
    const inner = g.getComputedStyle;
    g.getComputedStyle = (node: Element) => {
      const cs = inner(node);
      if (node !== stage) return cs;
      return {
        ...cs,
        getPropertyValue: (k: string) => (k === "--stage-h" ? "700px" : cs.getPropertyValue(k)),
      } as unknown as CSSStyleDeclaration;
    };
    const control = makeTile({ text: "こうえん", boxWidth: 164, inkWidth: 60, variant: "listen", tray });
    const shrinkOnly = makeTile({ text: "park", boxWidth: 188, inkWidth: 60, variant: "match", tray });
    registerTile(control, { hugsContent: true, fill: true, uniformHeight: true });
    registerTile(shrinkOnly, { hugsContent: false, fill: true, fillGrow: false });
    runTileFitPass();
    runTileFitPass();
    g.getComputedStyle = inner;
    expect(Number(control.style.getPropertyValue("--tile-fit-scale"))).toBeGreaterThan(1);
    expect(Number(shrinkOnly.style.getPropertyValue("--tile-fit-scale"))).toBeLessThanOrEqual(1);
  });

  it("releases the anti-flicker cap ONCE when the overflow it was set for has gone", () => {
    // 2A §5.8 / 2B §5.4, measured in phase 3: a stage caught overflowing by a
    // TRANSIENT (a late font, a late image, an unsettled ghost row) kept the
    // cap for the whole layout generation. `ja-m34-neo-3?step=11` at 125%
    // rendered its word at 19px with 85px of visible slack under the bank,
    // where the SAME step at 100% — a smaller budget — rendered 23px.
    const stage = makeStage();
    const tray = makeTray();
    stage.appendChild(tray);
    const scroller = stage.parentElement as HTMLElement;
    const rect = (top: number, bottom: number) =>
      ({ top, bottom, height: bottom - top, left: 0, right: 400, width: 400 }) as DOMRect;
    Object.defineProperty(tray, "getBoundingClientRect", { value: () => rect(0, 200), configurable: true });
    Object.defineProperty(stage, "getBoundingClientRect", { value: () => rect(0, 500), configurable: true });
    const g = globalThis as unknown as { getComputedStyle: (n: Element) => CSSStyleDeclaration };
    const inner = g.getComputedStyle;
    g.getComputedStyle = (node: Element) => {
      const cs = inner(node);
      if (node !== stage) return cs;
      return {
        ...cs,
        getPropertyValue: (k: string) => (k === "--stage-h" ? "700px" : cs.getPropertyValue(k)),
      } as unknown as CSSStyleDeclaration;
    };
    const t = makeTile({ text: "こうえん", boxWidth: 164, inkWidth: 60, variant: "listen", tray });
    registerTile(t, { hugsContent: true, fill: true, uniformHeight: true });

    // 1. The transient: the scroller IS scrolling, so the stage shrinks and
    //    caps itself at the scale that fitted.
    Object.defineProperty(scroller, "scrollHeight", { value: 900, configurable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 700, configurable: true });
    runTileFitPass();
    const capped = Number(t.style.getPropertyValue("--tile-fit-scale"));
    expect(capped).toBeLessThan(1);

    // 2. The transient resolves — nothing is scrolling and there are 500px of
    //    measured slack to the fold. The cap must let go, once.
    Object.defineProperty(scroller, "scrollHeight", { value: 700, configurable: true });
    runTileFitPass();
    runTileFitPass();
    g.getComputedStyle = inner;
    expect(Number(t.style.getPropertyValue("--tile-fit-scale"))).toBeGreaterThan(capped);
  });

  it("a TAP does not reopen the layout generation — the cap and fill survive a tile moving bank → tray (#174)", () => {
    // TestFlight #174 (build 22, iPhone 15 Pro Max @120 Hz): on every tile tap
    // the prompt and the whole tile cluster dropped ~33 CSS px on ALTERNATE
    // frames for ~130 ms, then settled. The generation key used to include the
    // tile COUNT, and a tap adds a tray tile: every tap threw away the cap and
    // the move budget and let the grow/shrink negotiation start over — through
    // the ResizeObserver, one pass per frame, which is exactly an
    // alternate-frame flicker. A tap changes no label, so the layout
    // generation must be keyed on the label SET, not the count.
    const stage = makeStage();
    const bank = makeTray();
    const tray = makeTray();
    stage.appendChild(bank);
    stage.appendChild(tray);
    const scroller = stage.parentElement as HTMLElement;
    const rect = (top: number, bottom: number) =>
      ({ top, bottom, height: bottom - top, left: 0, right: 400, width: 400 }) as DOMRect;
    Object.defineProperty(bank, "getBoundingClientRect", { value: () => rect(0, 200), configurable: true });
    Object.defineProperty(tray, "getBoundingClientRect", { value: () => rect(200, 260), configurable: true });
    // Exactly CAP_RELEASE_SLACK_PX (24px) of slack to the fold — not MORE, so
    // the cap is meant to HOLD for the rest of this generation, yet enough
    // that an uncapped grow branch would take it.
    Object.defineProperty(stage, "getBoundingClientRect", { value: () => rect(0, 676), configurable: true });
    const g = globalThis as unknown as { getComputedStyle: (n: Element) => CSSStyleDeclaration };
    const inner = g.getComputedStyle;
    g.getComputedStyle = (node: Element) => {
      const cs = inner(node);
      if (node !== stage) return cs;
      return {
        ...cs,
        getPropertyValue: (k: string) => (k === "--stage-h" ? "700px" : cs.getPropertyValue(k)),
      } as unknown as CSSStyleDeclaration;
    };
    const a = makeTile({ text: "しごと", boxWidth: 164, inkWidth: 60, variant: "listen", tray: bank });
    const b = makeTile({ text: "さがそう", boxWidth: 164, inkWidth: 60, variant: "listen", tray: bank });
    registerTile(a, { hugsContent: true, fill: true, uniformHeight: true });
    registerTile(b, { hugsContent: true, fill: true, uniformHeight: true });

    // 1. The stage is scrolling: shrink, and cap at the scale that fitted.
    Object.defineProperty(scroller, "scrollHeight", { value: 900, configurable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 700, configurable: true });
    runTileFitPass();
    const capped = Number(a.style.getPropertyValue("--tile-fit-scale"));
    expect(capped).toBeLessThan(1);

    // 2. Nothing scrolls any more but there is no slack either: settled.
    Object.defineProperty(scroller, "scrollHeight", { value: 700, configurable: true });
    runTileFitPass();
    runTileFitPass();
    expect(Number(a.style.getPropertyValue("--tile-fit-scale"))).toBe(capped);

    // 3. THE TAP: the learner places しごと — a tray tile with the SAME label
    //    appears (the bank tile stays in flow as a spent ghost). Same labels,
    //    same viewport ⇒ same generation ⇒ the cap holds and nothing moves.
    const placed = makeTile({ text: "しごと", boxWidth: 164, inkWidth: 60, variant: "listen", tray });
    registerTile(placed, { hugsContent: true, fill: true, uniformHeight: true });
    runTileFitPass();
    runTileFitPass();
    g.getComputedStyle = inner;
    expect(Number(a.style.getPropertyValue("--tile-fit-scale"))).toBe(capped);
    expect(Number(placed.style.getPropertyValue("--tile-fit-scale"))).toBe(capped);
  });

  it("gives the ABSOLUTE width floor to a tile FILL cannot rescue", () => {
    // 2B's two floors are right for a full FILL participant: the width floor
    // rides the accessibility slider, and if the stage then runs out of room
    // the FILL half (which does not ride it) takes it back. A tile FILL cannot
    // rescue has no second half. Measured on the 15 Pro Max at 125%: the
    // word-image card's label overhung its box by 7.04px and read as CLIPPED
    // (`ja-m34-neo-6?step=4`), and the iPad match grid sat at 25% row spread
    // with 0 overflow — nothing was scrolling, so the shrink half never fired.
    const stage = makeStage();
    const rescuable = makeTray();
    const stranded = makeTray();
    stage.appendChild(rescuable);
    stage.appendChild(stranded);
    const scroller = stage.parentElement as HTMLElement;
    Object.defineProperty(scroller, "scrollHeight", { value: 700, configurable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 700, configurable: true });
    const g = globalThis as unknown as { getComputedStyle: (n: Element) => CSSStyleDeclaration };
    const inner = g.getComputedStyle;
    // The slider at 125%: `readFitRatios` divides the FILL floor by it and
    // leaves the WIDTH floor alone.
    g.getComputedStyle = (node: Element) => {
      const cs = inner(node);
      return {
        ...cs,
        getPropertyValue: (k: string) =>
          k === "--tile-a11y-scale" ? "1.25" : cs.getPropertyValue(k),
      } as unknown as CSSStyleDeclaration;
    };
    // Far too much ink for the box either way: both bottom out at their floor.
    const a = makeTile({ text: "excuse me / sorry", boxWidth: 120, inkWidth: 400, variant: "option", tray: rescuable });
    const b = makeTile({ text: "excuse me / sorry", boxWidth: 120, inkWidth: 400, variant: "option", tray: stranded });
    registerTile(a, { hugsContent: false, fill: true });
    registerTile(b, { hugsContent: false, fill: false });
    runTileFitPass();
    g.getComputedStyle = inner;
    const rescuableScale = Number(a.style.getPropertyValue("--tile-fit-scale"));
    const strandedScale = Number(b.style.getPropertyValue("--tile-fit-scale"));
    expect(rescuableScale).toBeCloseTo(DEFAULT_FIT_FLOOR_RATIO, 2); // 0.8
    expect(strandedScale).toBeCloseTo(DEFAULT_FIT_FLOOR_RATIO / 1.25, 2); // 0.64
  });

  it("does not read a content-hugging tile's ruby overhang as unfitted ink", () => {
    // An `<rt>` is routinely wider than the kanji it annotates and sticks out
    // of a build tile by design. Counting that as overflow dragged whole
    // cohorts down (21px -> 16px on the m16 listen bank, on a stage that was
    // not overflowing at all), because the cohort cap is a MINIMUM.
    const tray = makeTray();
    const ruby = makeTile({
      text: "駅",
      boxWidth: 44,
      inkWidth: 30,
      overflowPx: 14, // the reading hanging out of the box
      variant: "build",
      tray,
    });
    registerTile(ruby, { hugsContent: true, fill: false, uniformHeight: true });
    runTileFitPass();
    expect(Number(ruby.style.getPropertyValue("--tile-fit-scale"))).toBe(1);
  });

  it("leaves a label that is NOT clipped exactly where it was", () => {
    const tray = makeTray();
    const fine = makeTile({ text: "こうえん", boxWidth: 164, inkWidth: 120, overflowPx: 0, tray });
    registerTile(fine, { hugsContent: false, fill: false });
    runTileFitPass();
    expect(Number(fine.style.getPropertyValue("--tile-fit-scale"))).toBe(1);
  });

  it("leaves tiles alone outside a lesson stage (the QA page dials real numbers)", () => {
    const el = makeTile({ text: "こうえん", boxWidth: 192, inkWidth: 120 });
    registerTile(el, { hugsContent: false, fill: true });
    runTileFitPass();
    expect(Number(el.style.getPropertyValue("--tile-fit-scale"))).toBe(1);
  });

  /* ── NOTHING RESIZES WHILE THE LEARNER BUILDS (#184/#185 → build 25) ──
     Spencer's verdict across three builds: a tile must not change size while
     he is building the sentence. Measured on the 15 Pro Max
     (`ja-m15-neo-6?step=15`, a 13-tile answer in a 17-tile bank): with the
     tray reserving ONE row the stage fitted at 1.25 empty and walked
     1.25 → 1.13 → 1.05 as the tray took its second and third row at 100%,
     and 0.82 → 0.72 at 125%. Both are FILL doing its job on a budget that
     was true when it was measured and false one tap later.

     b24 answered it inside this file (a hidden full-answer row, charged to
     the FILL budget up front). b25 answers it in the MARKUP instead: the
     tray's visible ghost row holds the WHOLE answer on every bank size, so
     the box this pass measures at step start is already the box the finished
     sentence needs (`BuildTrayRowNesting.test.tsx` pins that structure —
     those assertions fail on the b24 markup). What is left for this file to
     hold is the consequence, in both directions of FILL: the scale picked
     against a full-height tray survives the whole build, and the growing
     tray it replaced does not. */
  describe("a tray that starts at its final height keeps one scale for the build", () => {
    /**
     * One build step, driven the way a learner drives it. `trayUnits` is the
     * tray's height per unit of fill: `full` from the start models b25's
     * visible full-answer reservation, `empty` models the b24 tray that grew
     * a row at a time. Boxes respond to the scale the previous pass applied,
     * so the loop is the real one.
     */
    const buildStep = ({ trayStart, trayFull, bank, viewport, variant = "build" }: {
      trayStart: number;
      trayFull: number;
      bank: number;
      viewport: number;
      variant?: "build" | "listen";
    }) => {
      let trayUnits = trayStart;
      const stage = makeStage();
      const tray = makeTray("tray");
      const bankTray = makeTray("bank");
      stage.appendChild(tray);
      stage.appendChild(bankTray);
      const scroller = stage.parentElement as HTMLElement;
      const tile = makeTile({ text: "あさ", boxWidth: 164, inkWidth: 60, variant, tray: bankTray });
      const s = () => currentScale(tile);
      stubBox(scroller, () => 0, () => viewport);
      stubBox(tray, () => 0, () => trayUnits * s());
      stubBox(bankTray, () => trayUnits * s(), () => (trayUnits + bank) * s());
      stubBox(stage, () => 0, () => (trayUnits + bank) * s());
      Object.defineProperty(scroller, "clientHeight", { value: viewport, configurable: true });
      Object.defineProperty(scroller, "scrollHeight", {
        get: () => Math.max(viewport, (trayUnits + bank) * s()),
        configurable: true,
      });
      registerTile(tile, { hugsContent: true, fill: true, uniformHeight: true });
      const g = globalThis as unknown as { getComputedStyle: (n: Element) => CSSStyleDeclaration };
      const inner = g.getComputedStyle;
      g.getComputedStyle = (node: Element) => {
        const cs = inner(node);
        if (node !== stage) return cs;
        return {
          ...cs,
          getPropertyValue: (k: string) => (k === "--stage-h" ? `${viewport}px` : cs.getPropertyValue(k)),
        } as unknown as CSSStyleDeclaration;
      };
      // STEP START: let the stage settle before the first tap, the way the
      // pass does behind the microtask.
      runTileFitPass();
      runTileFitPass();
      runTileFitPass();
      const atStart = currentScale(tile);
      // THE SENTENCE IS BUILT: the tray needs all of `trayFull` now.
      trayUnits = trayFull;
      runTileFitPass();
      runTileFitPass();
      const atEnd = currentScale(tile);
      g.getComputedStyle = inner;
      return { atStart, atEnd, scroller };
    };

    it("holds its scale on a stage with room to grow (the 100% case)", () => {
      const full = buildStep({ trayStart: 200, trayFull: 200, bank: 300, viewport: 550 });
      expect(full.atStart).toBeGreaterThan(1); // the reservation is not a ban on FILL
      expect(full.atEnd).toBe(full.atStart);
      // …and it fitted: nothing scrolled, which is the only thing that may
      // legitimately re-fit a stage.
      expect(full.scroller.scrollHeight).toBe(full.scroller.clientHeight);

      // THE STRUCTURE THIS REPLACED, same numbers: a tray that shows one row
      // and grows to 200 re-fits mid-build. This is the defect, and it is
      // here so the assertion above cannot pass vacuously.
      const grew = buildStep({ trayStart: 100, trayFull: 200, bank: 300, viewport: 550 });
      expect(grew.atEnd).not.toBe(grew.atStart);
      expect(grew.atEnd).toBeLessThan(grew.atStart);
    });

    it("holds its scale on a stage it has to shrink (the 125% case)", () => {
      // A viewport the finished sentence does not fit at 1.0: the shrink half
      // fires at step start, once, and the build must not move it again.
      const full = buildStep({ trayStart: 200, trayFull: 200, bank: 300, viewport: 420 });
      expect(full.atStart).toBeLessThan(1);
      expect(full.atEnd).toBe(full.atStart);

      // The b24 tray on the same stage: it shrinks at step start for a tray
      // that is not there yet, and shrinks AGAIN when the sentence arrives.
      const grew = buildStep({ trayStart: 100, trayFull: 200, bank: 300, viewport: 420 });
      expect(grew.atEnd).toBeLessThan(grew.atStart);
    });

    /* SIBLING PARITY — the listen tray is priced by the same half (C3,
       build 25 / P1b). `listening_build` reserved its full answer too, but
       its ghost row was clamped at a literal `max-height: 92px`, so the box
       this pass measured at step start was 1.26-1.56 rows of a 2+ row
       answer and the tray grew by the remainder at the tap that took the
       next row (measured: tray 120 -> 154px in Chromium, 120 -> 182px on the
       15 Pro Max, and at 125% the growth re-triggered the shrink: fit
       1.05 -> 0.92). The clamp is gone; what this pins is that the listen
       VARIANT takes the same ruling — `cohortKey` carries `data-variant`, so
       a listen tile is a different cohort from a build tile and could
       plausibly have been priced differently. Shapes are the measured
       21-tile route: tray 320 / bank 290 in a 565px column. */
    it("prices the LISTEN tray's reservation the same way (sibling parity)", () => {
      const full = buildStep({ trayStart: 320, trayFull: 320, bank: 290, viewport: 565, variant: "listen" });
      expect(full.atStart).toBeLessThan(1); // the long answer forces the shrink
      expect(full.atEnd).toBe(full.atStart); // …once, at step start
      // The clamped tray on the same stage, same numbers: it re-fits when the
      // placed tiles take the rows the ghost was not reserving. Here so the
      // assertion above cannot pass vacuously.
      const clamped = buildStep({ trayStart: 160, trayFull: 320, bank: 290, viewport: 565, variant: "listen" });
      expect(clamped.atEnd).toBeLessThan(clamped.atStart);
    });
  });
});

describe("naturalHeightAtScale", () => {
  it("scales the ink and leaves the px frame alone", () => {
    // 58px of ink measured at scale 1, in a box with 4px of padding+border:
    // at 0.8 the ink is 46.4 and the frame is still 4.
    expect(naturalHeightAtScale({ inner: 58, frame: 4 }, 1, 0.8)).toBeCloseTo(50.4, 5);
  });

  it("normalises through the scale it was MEASURED at, both ways", () => {
    // Measured at 0.8, restated at 1.25: 58/0.8*1.25.
    expect(naturalHeightAtScale({ inner: 58, frame: 0 }, 0.8, 1.25)).toBeCloseTo(90.625, 5);
    // …and restating at the same scale is the identity.
    expect(naturalHeightAtScale({ inner: 58, frame: 6 }, 0.8, 0.8)).toBeCloseTo(64, 5);
  });

  it("contributes nothing for an unmeasurable tile, and treats a bad scale as 1", () => {
    expect(naturalHeightAtScale({ inner: 0, frame: 12 }, 1, 0.8)).toBe(0);
    expect(naturalHeightAtScale({ inner: 40, frame: 0 }, 0, 0.5)).toBeCloseTo(20, 5);
    expect(naturalHeightAtScale({ inner: 40, frame: 0 }, 1, Number.NaN)).toBeCloseTo(40, 5);
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

  it("multiplies EVERY tile tier's font-size by the scale — prose included", () => {
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
      // `--tile-type-scale` IS the fit scale — it is `fit × a11y` (2026-09-16,
      // phase 2B). A tier that still reads the bare `--tile-fit-scale` for its
      // TYPE is unreachable by the accessibility slider, which is the WCAG
      // 1.4.4 regression this ratchet now also guards.
      expect(
        body.includes("var(--tile-type-scale)"),
        `tier ${selector.trim().slice(0, 60)} sets a font-size the fit rule cannot reach`,
      ).toBe(true);
    }
  });

  /**
   * THE ACCESSIBILITY SLIDER REACHES TILE TYPE (phase 2B / spec §8, WCAG 1.4.4).
   *
   * Phase 2A made the tile system rem-free, which is what stopped a tile's box
   * and its word drifting apart under the slider — and, as a side effect, made
   * 85–140% inert on every tile. The fix is ONE unitless multiplier
   * (`--tile-a11y-scale`, written by `ThemeContext`) folded into the fit scale,
   * NOT rem put back token by token. Three things have to hold together or the
   * slider goes quiet again with nothing failing:
   *   1. the multiplier is defined with a `1` fallback (SSR / no JS),
   *   2. `--tile-type-scale` is fit × a11y,
   *   3. BOXES keep the bare fit scale — the particle tier's `height:` is the
   *      only box that rides a scale at all, and it must not ride this one.
   */
  it("folds the accessibility multiplier into tile TYPE and not into tile BOXES", () => {
    expect(
      CSS.includes("--tile-type-scale: calc(var(--tile-fit-scale) * var(--tile-a11y-scale, 1));"),
      "--tile-type-scale must be fit × a11y, with a 1 fallback for SSR",
    ).toBe(true);
    expect(CSS.includes("--tile-a11y-scale: 1;"), ":root needs the no-JS default").toBe(true);
    // The particle row's HEIGHT is a box: it rides FIT (so FILL's shrink half
    // can give an overflowing stage its room back) and must not ride the
    // slider, or the 41–198px overflows phase 2A closed come straight back.
    expect(
      CSS.includes("height: calc(clamp(56px, 8cqh, 72px) * var(--tile-fit-scale));"),
      "the particle BOX height must stay on the bare fit scale",
    ).toBe(true);
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

  it("never hands nowrap to the prose state — it cannot see its own overflow", () => {
    expect(CSS.includes('[data-tile][data-tile-fit="prose"] {\n  white-space: normal;')).toBe(true);
  });

  /**
   * CLASS C, AS A RATCHET (spec §8: "never rem inside the tile system").
   *
   * rem tokens track the root font, which the accessibility slider multiplies
   * by 0.85–1.4; the px tokens beside them do not. That split is what shipped
   * an option whose padding grew 25% around a word that did not move, 8 of 25
   * routes scrolling at 125%, and a furigana floor that grew over its own word
   * (reading:word 0.62 -> 0.76 at 140%, #87 inverted). Every one of those was
   * a single `rem` somebody added to a block full of px. This is the check
   * that makes the next one a red test instead of a TestFlight item.
   *
   * SCOPE: the TILE PRIMITIVE block and the tile `:root` token groups. `--card-*`
   * is deliberately exempt (an overlay card is prose chrome, not a tile box,
   * and `--card-max-h` is a viewport unit by design — `85dvh` since
   * 2026-09-16, spec §4's tracked drift closed).
   */
  it("carries no rem anywhere in the tile box system", () => {
    const regions = [
      ["tile token :root tiers", CSS.slice(CSS.indexOf(":root {\n  /* MOBILE = Spencer's"), CSS.indexOf("/* ── Landscape-tablet tap-target bump"))],
      ["TILE PRIMITIVE", CSS.slice(CSS.indexOf("TILE PRIMITIVE — one block"), CSS.indexOf("/* ── Tray / bank / grid layout"))],
    ] as const;
    for (const [name, region] of regions) {
      expect(region.length, `${name} region not found — the ratchet is measuring nothing`).toBeGreaterThan(500);
      const offenders = region
        .replace(/\/\*[\s\S]*?\*\//g, "") // comments explain history; they don't render
        .split("\n")
        .filter((line) => /\d(\.\d+)?rem/.test(line))
        .filter((line) => !/--card-|--wordimg-|--lc-/.test(line));
      expect(offenders, `${name}: rem inside the tile box system`).toEqual([]);
    }
  });

  /**
   * `docs/qa/tile-sizing.json` IS the registry, or it is a lie.
   *
   * The file was stale for weeks in exactly the way a hand-maintained mirror
   * goes stale — `--tile-box-h` read 32px/0px against a shipped 45/51/50.5,
   * it still listed `--tile-big-scale` (removed from the CSS at b16.3) and it
   * had no `tabletPortrait` section at all, four weeks after that tier
   * shipped (spec §12). It is regenerated from the registry now, and this
   * fails the suite the next time the two drift.
   */
  it("keeps docs/qa/tile-sizing.json in step with the token registry", () => {
    const saved = JSON.parse(
      readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../docs/qa/tile-sizing.json"), "utf8"),
    ) as Record<string, Record<string, string>>;
    const sections = { mobile: "base", desktop: "sm", tabletPortrait: "tabletPortrait" } as const;
    for (const [section, tier] of Object.entries(sections)) {
      expect(saved[section], `tile-sizing.json is missing its ${section} section`).toBeDefined();
      for (const def of TILE_TOKEN_DEFS) {
        expect(saved[section][def.key], `${section}.${def.key}`).toBe(`${def[tier]}${def.unit}`);
      }
      for (const key of Object.keys(saved[section])) {
        expect(
          TILE_TOKEN_DEFS.some((d) => d.key === key),
          `${section}.${key} is in the JSON but not in the registry (a dead token, like --tile-big-scale was)`,
        ).toBe(true);
      }
    }
  });
});
