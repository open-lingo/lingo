/**
 * DEV-ONLY geometry probe for the iOS Simulator capture harness
 * (`scripts/ux-loop/sim-capture.mjs`). Capacitor forwards `console.log` to the
 * native log, so a `log stream` on the sim reads real-WebKit numbers that no
 * Chromium emulation reproduces (TestFlight 2026-09-05: a 125pt dead band under
 * the CTA on a 15 Pro Max that Playwright never showed).
 *
 * Armed by the `/__sim` seed page via `localStorage["lingo:sim-probe"]`.
 *
 * 2026-09-15: extended for the two variables the tile-sizing misses (#152,
 * #156, #157, #161) traced back to and that no Chromium/Playwright run can
 * see — the accessibility root-font multiplier (`ThemeContext.tsx`, 85–140%)
 * and which CJK font actually painted (`index.html`'s `display=optional`
 * Noto Sans JP load can silently fall back to Hiragino for a whole session)
 * — plus per-tile wrap/clip flags so a capture can fail loudly instead of a
 * human re-discovering the same wrap on the next build.
 */

import { IS_NATIVE } from "@/shared/platform/native";
import { recordLayoutTrace, sampleLayout, type LayoutTrace, type LayoutTraceFrame } from "./layoutTrace";

export type { LayoutTrace, LayoutTraceFrame };

// ---------------------------------------------------------------------------
// Pure parts — no DOM required, exercised directly by simProbe.test.ts.
// ---------------------------------------------------------------------------

/** Minimal shape of a DOMRect (or DOMRectReadOnly) this module needs. */
export interface RectLike {
  top: number;
  /** Optional — when present and `<= 0` the rect is ignored (an empty text
   *  node / Range boundary artifact, never a real line). */
  height?: number;
}

/**
 * G8 (`<S>/tile-sweep/PHASE2B.md` §4): a wrapped label's TEXT produces one
 * line-box rect per rendered line — but only when the rects come from a
 * `Range` over the text (`collectBaseTextRects`), NOT from
 * `label.getClientRects()`. In a FLEX tile (every option tier except
 * `sentence`/`row`, plus build/listen) the label is a flex ITEM, which is
 * blockified, so `label.getClientRects()` always returns exactly one
 * border-box rect however many lines actually render.
 *
 * Tops within `toleranceLinePx` of each other are the same line (sub-pixel
 * jitter between rects on one line is real and must not count as two lines).
 * Clustered by GAP after sorting, not by rounding to the same integer — a
 * rounding bucket boundary (100.6 vs 101.4, one rounds down and one up) would
 * otherwise misreport two rects on the same visual line as two lines.
 */
export function countDistinctLines(rects: ArrayLike<RectLike>, toleranceLinePx = 2): number {
  const tops: number[] = [];
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    if (rect.height !== undefined && rect.height <= 0) continue;
    tops.push(rect.top);
  }
  if (tops.length === 0) return 0;
  tops.sort((a, b) => a - b);
  let lines = 1;
  for (let i = 1; i < tops.length; i++) {
    if (tops[i] - tops[i - 1] > toleranceLinePx) lines++;
  }
  return lines;
}

/** Wrap/clip verdict from measured line count + scroll/overhang geometry. Pure. */
export function deriveTileFlags(opts: {
  lineCount: number;
  scrollWidth: number;
  clientWidth: number;
  /**
   * G8: max px any BASE-text line rect's right edge extends past the tile's
   * content-box right edge — 0 (or omitted) when not measured / no overhang.
   * Deliberately excludes furigana (`<rt>`, see `collectBaseTextRects`): a
   * `<ruby>` annotation can overhang the tile without its base text ever
   * exceeding the box, and THAT case shows up only via `scrollWidth`
   * inflating on the label, not here — so a reader can tell "the base text
   * itself doesn't fit" (`overhangPx > 0`) from "only the ruby annotation
   * overhangs" (`clipped` true via `scrollWidth`, `overhangPx === 0`).
   */
  overhangPx?: number;
}): { wrapped: boolean; clipped: boolean; overhangPx: number } {
  const overhangPx = Math.max(0, opts.overhangPx ?? 0);
  return {
    wrapped: opts.lineCount > 1,
    // > (not >=): equal widths/edges is a tight but non-clipping fit. OR'd
    // so either signal alone can flag a real clip (see overhangPx doc above).
    clipped: opts.scrollWidth > opts.clientWidth + 1 || overhangPx > 1,
    overhangPx: Math.round(overhangPx * 100) / 100,
  };
}

/**
 * Task C (2026-09-17): is a `data-collapse` attribute value one of the
 * huge-bank-collapse states (`useHugeBankCollapse`,
 * `BuildSentenceStepView.tsx`) whose geometry a real learner never reads?
 * `"done"` = fully collapsed to zero width; `"pending"` = the 350ms collapse
 * ANIMATION is still in flight (same zero-meaning, shrinking geometry).
 * Pure — split out from `measureTile` so it's directly unit-testable
 * without a DOM tile element.
 */
export function isCollapsedTileState(dataCollapse: string | null): boolean {
  return dataCollapse === "done" || dataCollapse === "pending";
}

export interface TileReport {
  text: string;
  variant: string | null;
  /** `data-size` (e.g. "word" | "particle" | "sentence") — G4 (REPORT.md
   *  "Harness defects"): a `sentence`-tier MCQ tile wraps by design (it's
   *  prose, not a tile bank), so the harness's evaluator needs this to tell
   *  a real tile-wrap defect from an allowed prose wrap. */
  size: string | null;
  fontPx: number;
  boxW: number;
  boxH: number;
  lineCount: number;
  wrapped: boolean;
  clipped: boolean;
  /** G8: max px the base text overhangs the tile's content box (0 = none /
   *  not the cause of `clipped`). See `deriveTileFlags`'s `overhangPx` doc —
   *  0 while `clipped` is true means the clip is scrollWidth-only (commonly
   *  a ruby/furigana overhang, since base text excludes `<rt>`). */
  overhangPx: number;
  /** Task C (2026-09-17): true when `data-collapse` is `"done"` (a spent
   *  huge-bank tile fully collapsed to zero width,
   *  `useHugeBankCollapse`/`BuildSentenceStepView.tsx`) OR `"pending"` (the
   *  350ms collapse animation is still in flight — same zero-meaning,
   *  shrinking geometry). `sim-capture.mjs`'s `evaluateReport` excludes
   *  these tiles from `clipped`/overhang counts (a learner never reads that
   *  geometry) and reports their count separately as `collapsed=N`. */
  collapsed: boolean;
}

export interface RectTB {
  top: number;
  bottom: number;
}

/** Height of the overlap between two top/bottom rects. Pure. 0 if disjoint. */
export function intersectHeight(a: RectTB, b: RectTB): number {
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.bottom, b.bottom);
  return Math.max(0, bottom - top);
}

/** Fixed chrome ABOVE the stage (header, eyebrow row). Informational — no budget. */
export function chromeAbovePx(stageTop: number | null, viewportTop: number): number | null {
  if (stageTop == null) return null;
  return Math.round(stageTop - viewportTop);
}

/** Fixed chrome BELOW the stage (CTA row, safe area). Informational — no budget. */
export function chromeBelowPx(viewportBottom: number, stageBottom: number | null): number | null {
  if (stageBottom == null) return null;
  return Math.round(viewportBottom - stageBottom);
}

/**
 * The stage over-report this probe exists to expose is NOT the fixed chrome
 * above/below the stage (that's expected — see `chromeAbovePx`/
 * `chromeBelowPx`, no budget). It's the step SCROLLER reporting more usable
 * height than is actually on screen: `scroller.clientHeight` vs. how much of
 * the scroller's own box actually intersects the real visual viewport, minus
 * whatever a `position:fixed` CTA sitting over the scroller's bottom occludes
 * (b20 #157/#161 — the ~200px a `cqh`/fill rule must not spend). Pure so the
 * CLI's threshold check is testable without a live capture.
 */
export function computeStageOverReportPx(opts: {
  scrollerClientHeight: number | null;
  scrollerRect: RectTB | null;
  viewportRect: RectTB;
  ctaRect?: RectTB | null;
  ctaFixed?: boolean;
}): number | null {
  const { scrollerClientHeight, scrollerRect, viewportRect, ctaRect, ctaFixed } = opts;
  if (scrollerClientHeight == null || scrollerRect == null) return null;
  const visible = intersectHeight(scrollerRect, viewportRect);
  const ctaOverlap = ctaFixed && ctaRect ? intersectHeight(ctaRect, scrollerRect) : 0;
  const usable = Math.max(0, visible - ctaOverlap);
  return Math.round(scrollerClientHeight - usable);
}

// ---------------------------------------------------------------------------
// DOM-dependent collection — thin wrappers around the pure parts above.
// ---------------------------------------------------------------------------

const FONT_SCALE_PARAM = "simFontScale";
/** Mirrors `SETTINGS_KEY` in `src/features/settings/storage.ts` (not imported
 *  to keep this module dependency-free for the dev-only bundle boundary). */
const SETTINGS_STORAGE_KEY = "open-lingo-settings";

/**
 * A capture route may carry `?simFontScale=125` (sim-capture.mjs writes it
 * into the `/tmp/lingo-sim-target` route string so no `vite.config.ts`
 * middleware change is needed). Applied to the SAME localStorage key
 * `ThemeContext`/`SettingsContext` read (`accessibility.fontSize`, a 0.85–1.4
 * multiplier) BEFORE React mounts, so the normal hydration path picks it up
 * — no separate apply/reload path to drift from the real setting.
 */
function applyFontScaleFromUrl(): void {
  let pct: number | null = null;
  try {
    pct = Number(new URLSearchParams(location.search).get(FONT_SCALE_PARAM));
  } catch { /* no location */ }
  if (!pct || !Number.isFinite(pct) || pct <= 0) return;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.accessibility = { ...(parsed.accessibility ?? {}), fontSize: pct / 100 };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed));
  } catch { /* no storage */ }
}

const EMU_W_PARAM = "simEmuW";
const EMU_H_PARAM = "simEmuH";
const RUN_PARAM = "simRun";

/**
 * Per-run nonce (`sim-capture.mjs` writes `?simRun=<uuid>` onto the target
 * route it puts in `/tmp/lingo-sim-target`). Two `sim:capture` invocations
 * driving the same shared target file/`__sim` seed — the corruption class
 * PHASE2A.md §6.7 documents (8 of 40 captures in that sweep were silently
 * another lane's route at another lane's font scale) — produce reports whose
 * `runNonce` doesn't match what the CLI itself just wrote; that's a stronger,
 * unambiguous signal than comparing route/scale alone (two lanes CAN request
 * the identical route+scale on different devices). Echoed back verbatim so
 * the CLI's validator can tell "this is my report" from "this is a stale or
 * concurrent lane's report" without guessing.
 */
export function extractRunNonce(search: string): string | null {
  try {
    return new URLSearchParams(search).get(RUN_PARAM);
  } catch {
    return null;
  }
}

function readRunNonce(): string | null {
  try {
    return extractRunNonce(location.search);
  } catch {
    return null;
  }
}

/**
 * Pure half of the G5 viewport-emulation fallback (REPORT.md "Harness
 * defects") — exercised directly by `simProbe.test.ts` without a DOM. The
 * `<meta name="viewport">` `content` string that makes the LAYOUT viewport
 * `w`×`h` CSS px regardless of the WKWebView's real frame: `initial-scale`
 * is set so the physical screen (`screenW`×`screenH`) still fills edge to
 * edge — the browser scales the `w`×`h` layout DOWN (or up) to fit whatever
 * the real screen is. `scale = min(screenW/w, screenH/h)` so neither axis
 * overflows the physical screen.
 */
export function viewportEmulationMeta(
  w: number,
  h: number,
  screenW: number,
  screenH: number
): { content: string; scale: number } {
  const scale = Math.min(screenW / w, screenH / h) || 1;
  return { content: `width=${w}, height=${h}, initial-scale=${scale}, user-scalable=no`, scale };
}

/**
 * G5 (REPORT.md "Harness defects") — landscape emulation fallback. No real
 * rotation path exists: `xcrun simctl` has no orientation subcommand, and
 * `simctl io <device> screenConfig geometry <w>x<h>` (the one geometry knob
 * simctl DOES expose) refuses a swapped w/h pair with "no mode found" — it
 * picks a different device's screen MODE, it doesn't rotate the current one
 * (verified live against the booted iPad Air 11" M4, 2026-09-16). `idb`/
 * `fbsimctl` are not installed either.
 *
 * Fallback: the standard mobile-web "emulate a narrower/wider viewport"
 * trick — `viewportEmulationMeta` above computes the `<meta
 * name="viewport">` `content`, which makes the LAYOUT viewport `<W>`×`<H>`
 * CSS px regardless of the WKWebView's real frame, so `cqw`/media-query-
 * driven layout responds as if the device were that size. The physical
 * screenshot (`simctl io … screenshot`) is still a portrait photo with the
 * content visually scaled/letterboxed to fit — this measures LAYOUT
 * geometry, not a true rotated render. Reported as `emulatedViewport` so a
 * capture can be labeled `emulated-landscape` rather than mistaken for a
 * real rotation.
 */
function applyViewportEmulationFromUrl(): { w: number; h: number } | null {
  let w: number | null = null;
  let h: number | null = null;
  try {
    const params = new URLSearchParams(location.search);
    w = Number(params.get(EMU_W_PARAM));
    h = Number(params.get(EMU_H_PARAM));
  } catch { /* no location */ }
  if (!w || !h || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  try {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "viewport");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", viewportEmulationMeta(w, h, window.screen.width, window.screen.height).content);
  } catch { /* no document */ }
  return { w, h };
}

function readFontScaleSetting(): number {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const v = parsed?.accessibility?.fontSize;
    return typeof v === "number" && Number.isFinite(v) ? v : 1;
  } catch {
    return 1;
  }
}

/**
 * G6 (REPORT.md "Harness defects") — real `env(safe-area-inset-*)` px, read
 * off a throwaway `position: fixed` probe element rather than trusted from
 * any app chrome (which may not paint edge-to-edge on every route). Only
 * meaningful in a REAL WKWebView with `viewport-fit=cover` on the `<meta
 * name="viewport">` (`index.html` already sets it) — Chromium under
 * Playwright reports these as 0 unless insets are pushed over CDP
 * (`CLAUDE.md`'s "Every viewport carries insets" rule exists for exactly
 * that gap), so this is one of the numbers this native-simulator probe
 * exists to get that no Chromium run can. Returns `null` (never throws) if
 * `document`/`getComputedStyle` aren't available.
 */
function measureSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } | null {
  try {
    const probe = document.createElement("div");
    probe.style.position = "fixed";
    probe.style.top = "0";
    probe.style.left = "0";
    probe.style.width = "0";
    probe.style.height = "0";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    probe.style.paddingTop = "env(safe-area-inset-top, 0px)";
    probe.style.paddingRight = "env(safe-area-inset-right, 0px)";
    probe.style.paddingBottom = "env(safe-area-inset-bottom, 0px)";
    probe.style.paddingLeft = "env(safe-area-inset-left, 0px)";
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const insets = {
      top: Math.round(parseFloat(cs.paddingTop) || 0),
      right: Math.round(parseFloat(cs.paddingRight) || 0),
      bottom: Math.round(parseFloat(cs.paddingBottom) || 0),
      left: Math.round(parseFloat(cs.paddingLeft) || 0),
    };
    probe.remove();
    return insets;
  } catch {
    return null;
  }
}

/**
 * The label element whose line boxes reflect the visible word, not the
 * tile's own (block-level, single-rect) border box. Every JA text render
 * passes through `AnnotatedText`, which always emits an outer
 * `<span lang="...">` (`shared/readingAnnotation/AnnotatedText.tsx`); build
 * tiles additionally wrap it in `[data-build-tile-kana]` /
 * `[data-build-tile-kanji]` (`BuildTileSurface.tsx`). Falls back to the tile
 * itself so a probe on an unrecognised tile shape still reports something
 * rather than throwing.
 */
function tileLabelEl(tile: Element): Element {
  return (
    tile.querySelector("[data-build-tile-kana], [data-build-tile-kanji], span[lang]") ??
    tile
  );
}

/**
 * G8 fix (`<S>/tile-sweep/PHASE2B.md` §4): leaf line-box rects for the
 * label's BASE text — everything except furigana (`<rt>`, both the kanji
 * `KanjiRuby` reading AND the plain-kana romaji helper ruby in
 * `AnnotatedText.tsx` use `<ruby><rt>…</rt></ruby>`) — via one `Range` per
 * qualifying text node. Unlike `label.getClientRects()` (one border-box rect
 * for a flex ITEM however many lines it renders — the label is blockified in
 * every FLEX tile tier), a Range's `getClientRects()` reports real line boxes
 * regardless of the label's own `display`.
 */
export function collectBaseTextRects(label: Element): DOMRect[] {
  const doc = label.ownerDocument;
  if (!doc) return [];
  const rects: DOMRect[] = [];
  const walker = doc.createTreeWalker(label, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node) {
      for (let el = node.parentElement; el && el !== label; el = el.parentElement) {
        if (el.tagName === "RT") return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const range = doc.createRange();
    range.selectNodeContents(node);
    const nodeRects = range.getClientRects();
    for (let i = 0; i < nodeRects.length; i++) rects.push(nodeRects[i] as DOMRect);
  }
  return rects;
}

/**
 * Fallback for when `collectBaseTextRects` returns nothing (a label with no
 * text at all, e.g. an image-only option tier) — `round(labelHeight /
 * computedLineHeight)`. `lineHeight: normal` doesn't resolve to a px value
 * from `getComputedStyle`, so approximate it the way browsers do (~1.2×
 * font-size) rather than divide by zero / NaN.
 */
function fallbackLineCount(label: Element): number {
  const el = label as HTMLElement;
  const cs = getComputedStyle(el);
  let lineHeightPx = parseFloat(cs.lineHeight);
  if (!Number.isFinite(lineHeightPx) || lineHeightPx <= 0) {
    lineHeightPx = (parseFloat(cs.fontSize) || 16) * 1.2;
  }
  const height = el.offsetHeight || el.getBoundingClientRect().height;
  if (height <= 0 || lineHeightPx <= 0) return 0;
  return Math.max(1, Math.round(height / lineHeightPx));
}

/** The tile's CONTENT-box right edge (border-box right minus border+padding),
 *  in the same viewport coordinate space as `getClientRects()`. */
function contentBoxRight(tile: Element): number {
  const box = tile.getBoundingClientRect();
  const cs = getComputedStyle(tile);
  const borderR = parseFloat(cs.borderRightWidth) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  return box.right - borderR - padR;
}

function measureTile(tile: Element): TileReport {
  const label = tileLabelEl(tile);
  const baseTextRects = collectBaseTextRects(label).filter((r) => r.height > 0);
  const lineCount = baseTextRects.length > 0 ? countDistinctLines(baseTextRects) : fallbackLineCount(label);
  const box = tile.getBoundingClientRect();
  const cs = getComputedStyle(label);
  const el = label as HTMLElement;
  const contentRight = contentBoxRight(tile);
  let overhangPx = 0;
  for (const r of baseTextRects) {
    if (r.right - contentRight > overhangPx) overhangPx = r.right - contentRight;
  }
  const flags = deriveTileFlags({
    lineCount,
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    overhangPx,
  });
  const collapsed = isCollapsedTileState(tile.getAttribute("data-collapse"));
  return {
    text: (tile.textContent ?? "").trim().slice(0, 40),
    variant: tile.getAttribute("data-variant"),
    size: tile.getAttribute("data-size"),
    fontPx: Math.round(parseFloat(cs.fontSize) || 0),
    boxW: Math.round(box.width),
    boxH: Math.round(box.height),
    lineCount,
    wrapped: flags.wrapped,
    clipped: flags.clipped,
    overhangPx: flags.overhangPx,
    collapsed,
  };
}

export interface OptionGeometry {
  i: number;
  text: string;
  top: number;
  left: number;
  w: number;
  h: number;
}

export interface TapResult {
  tapSelector: string | null;
  answerFirstOption: boolean;
  tapped: boolean;
  pre: { cta: OptionGeometry | null; options: OptionGeometry[] };
  post: { cta: OptionGeometry | null; options: OptionGeometry[] };
  /** Per-frame stage geometry across the tap (see `recordLayoutTrace`). */
  layoutTrace?: LayoutTrace;
}

const rectTL = (el: Element, i = 0): OptionGeometry => {
  const b = el.getBoundingClientRect();
  return { i, text: (el.textContent ?? "").trim().slice(0, 30), top: Math.round(b.top), left: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height) };
};

function captureOptionGeometry(): { cta: OptionGeometry | null; options: OptionGeometry[] } {
  const cta = document.querySelector('[data-testid="primary-cta"]');
  const options = [...document.querySelectorAll('[data-lesson-stage] [data-tile][data-variant="option"]')];
  return {
    cta: cta ? rectTL(cta) : null,
    options: options.map((el, i) => rectTL(el, i)),
  };
}

const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

// ---------------------------------------------------------------------------
// Build-sentence USER SIMULATION (`--simulate build`, 2026-09-17).
//
// Founder, TestFlight three rounds running: "the tiles resize while I build
// the sentence… you need USER SIMULATION." A single `--tap <selector>` only
// ever taps ONE tile — it missed two real defects that only show up across
// SEVERAL taps: (1) every tile's size changing the moment the tray gains its
// FIRST row (nothing to compare against before that), and (2) a placed tray
// tile rendering at a different font size than its own bank sibling
// (19px vs 29px, live on ja-m34-neo-7?step=5 as of this writing). This
// section taps every bank tile in turn, like a learner placing the whole
// sentence, and records geometry before/after each tap.
//
// Split follows the rest of this file: COLLECTION lives here (DOM-dependent,
// posted raw in `report.simulation`); JUDGMENT (the pass/fail verdicts) is
// computed Node-side in `scripts/ux-loop/sim-capture.mjs`'s
// `computeBuildVerdicts` — same division as `tiles` (collected here) vs.
// `evaluateReport`'s wrap/clip verdicts (judged there). Keeps this file
// data-only and the judgment pinned in one place, testable without a DOM.
// ---------------------------------------------------------------------------

/** Per-group aggregate over a set of tiles' font/box/fit-scale readings.
 *  Pure — exercised directly by `simProbe.test.ts`. `count === 0` reports
 *  every other field `null` rather than `Infinity`/`-Infinity` from an empty
 *  `Math.min`/`Math.max`. `fitScale` is aggregated separately from
 *  count/font/box because a tile with no `--tile-fit-scale` custom property
 *  yet (e.g. a ghost pre-sizer never registered with `tileFit.ts`) reports
 *  `null` for that ONE field without dropping the whole tile from the
 *  font/box aggregates. */
export interface GroupMetrics {
  count: number;
  fontPxMin: number | null;
  fontPxMax: number | null;
  boxHMin: number | null;
  boxHMax: number | null;
  fitScaleMin: number | null;
  fitScaleMax: number | null;
}

export interface TileMetricInput {
  fontPx: number;
  boxH: number;
  fitScale: number | null;
}

export function computeGroupMetrics(items: TileMetricInput[]): GroupMetrics {
  if (items.length === 0) {
    return { count: 0, fontPxMin: null, fontPxMax: null, boxHMin: null, boxHMax: null, fitScaleMin: null, fitScaleMax: null };
  }
  const fontPxs = items.map((i) => i.fontPx);
  const boxHs = items.map((i) => i.boxH);
  const fitScales = items.map((i) => i.fitScale).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  return {
    count: items.length,
    fontPxMin: Math.min(...fontPxs),
    fontPxMax: Math.max(...fontPxs),
    boxHMin: Math.min(...boxHs),
    boxHMax: Math.max(...boxHs),
    fitScaleMin: fitScales.length > 0 ? Math.min(...fitScales) : null,
    fitScaleMax: fitScales.length > 0 ? Math.max(...fitScales) : null,
  };
}

/** One sample of the whole build-sentence stage's geometry, tap-indexed
 *  (`tap: 0` = before the first tap). The `h2Top`/`trayTop`/`trayH`/
 *  `bankTop`/`bankH`/`stageH`/`rowH`/`fitScale` fields are exactly
 *  `sampleLayout()`'s return shape (reused verbatim, per the brief — the
 *  on-device Sync-panel trace and this harness read the same geometry);
 *  `stageTop` is added alongside because `sampleLayout()` itself doesn't
 *  expose it and `layoutTrace.ts` is shared with the on-device panel, so
 *  extending ITS return shape for one caller isn't worth the coupling —
 *  `stageTop` is read here the same way `installSimProbe`'s own `tick()`
 *  already reads it for `chromeAbovePx`/`chromeBelowPx`. */
export interface BuildSample extends ReturnType<typeof sampleLayout> {
  tap: number;
  /**
   * The prompt heading's own rect top (`[data-lesson-stage] h2`), and the
   * bottom-anchored CTA block's (`[data-testid="primary-cta"]`) — the two
   * ends of the step column, added 2026-09-17 for the build-25 ruling that
   * NOTHING on screen may move between the learner's first tap and the last.
   * `sim-capture.mjs` judges them as `promptStable` / `chromeStable` (with
   * `bankTop`, which `sampleLayout()` already carries).
   *
   * `promptTop` is the element `PROMPT_SELECTOR` finds — the `<h2>`
   * `h2Top` reads through `sampleLayout()` on a `build_sentence` route, or
   * the `[data-lesson-prompt]` paragraph on a `listening_build` one, which
   * renders no `<h2>` at all (build 25 / P1b). It is sampled here, off this
   * probe's own rect, so the verdict does not depend on `layoutTrace.ts`'s
   * return shape — that module is shared with the on-device Sync panel and
   * is not this harness's to extend — and so the 1px contract the lead
   * stated is checked against a number this file produces, independently of
   * whatever `layoutTrace.ts` does.
   *
   * 2026-09-17 (lane A5b, P1b open item 3): `layoutTrace.ts`'s OWN prompt
   * selector was widened to the same `"h2, [data-lesson-prompt]"` shape (it
   * had been `"h2"` only, P1b's stated reason for leaving `h2Stable`/
   * `noFlicker` N/A on a listening route) — so `h2Top` now reads the same
   * element `promptTop` does there too, and both verdicts are LIVE on
   * listening routes, not N/A. `promptTop` stays a separate field/verdict
   * regardless (this file's own number, independent of the shared module,
   * per the paragraph above) — the two happen to agree today because
   * nothing renders both an `<h2>` and a `[data-lesson-prompt]` at once.
   */
  promptTop: number | null;
  ctaTop: number | null;
  stageTop: number | null;
  /** Stage left/width alongside `stageTop` — added for the same reason
   *  (2026-09-17, Spencer's frame-capture ask): the Node side needs the
   *  stage's full rect, in CSS px, to crop a raw simulator screenshot (device
   *  px) down to just the stage before tiling a contact sheet. */
  stageLeft: number | null;
  stageWidth: number | null;
  tray: GroupMetrics;
  bank: GroupMetrics;
}

/**
 * One rAF-sampled frame of the geometry AROUND A SINGLE TAP (2026-09-17,
 * Spencer: "the simulation needs FRAME CAPTURE so we can analyze animations,
 * not only settled geometry"). Distinct from `BuildSample` (one reading per
 * tap, taken 120ms after the fact) — this is many readings across the
 * 700ms+ window the tap's own transition plays out in. `t` is ms since the
 * tap's `.click()` call, not since page load or trace start.
 */
export interface TapFrameSample {
  /** ms since this tap's `.click()`. */
  t: number;
  /** The newly-placed tray tile's geometry, or `null` before it has mounted
   *  (early frames) or if it can no longer be found (`tileLost`). */
  tile: { x: number; y: number; w: number; h: number; fontPx: number; transform: string; opacity: number } | null;
  /** `true` once `tile` was seen non-null at least once and then dropped out
   *  (unmounted/reparented) — distinguishes "not mounted yet" from "lost". */
  tileLost: boolean;
  trayRow: { x: number; y: number; w: number; h: number } | null;
  trayClientHeight: number | null;
  trayFitScaleMin: number | null;
  trayFitScaleMax: number | null;
  bankFitScaleMin: number | null;
  bankFitScaleMax: number | null;
}

export interface TapFrameTrace {
  tap: number;
  frames: TapFrameSample[];
  /** Hit the safety cap (`FRAME_TRACE_MAX_MS`) without ever satisfying the
   *  "3 stable frames after 300ms" settle condition — the tap's transition
   *  genuinely never stopped moving within the cap, OR the tracked tile was
   *  lost. Not part of the brief's own spec; recorded so a reader can tell
   *  "settled normally" from "gave up" without re-deriving it from the raw
   *  frames. */
  capped: boolean;
}

export interface BuildSimulationResult {
  mode: "build";
  taps: number;
  samples: BuildSample[];
  layoutTrace: LayoutTrace;
  frames: TapFrameTrace[];
}

const STAGE_SELECTOR = "[data-lesson-stage]";
/**
 * The prompt the learner reads, at the top of the step column.
 *
 * `build_sentence` renders it as the stage's one `<h2>` — which is also what
 * `sampleLayout()`'s `h2Top` reads. `listening_build` renders NO `<h2>` at
 * all: its prompt is a `<p>` inside the shared `ListenPromptHeader`, so
 * `promptTop` was `null` on every listening route and `promptStable` had
 * nothing to judge (build 25 / P1b, 2026-09-17 — the verdict said so out
 * loud because `computeBuildVerdicts` reports an unsampled field, which is
 * how the gap was found). That view now marks its prompt
 * `data-lesson-prompt`, and this selector matches either shape.
 *
 * Order note: a selector list resolves in DOCUMENT order, not selector
 * order, and no build view renders both — so this is unambiguous on every
 * route today. `h2Top` is left alone: `layoutTrace.ts` is shared with the
 * on-device Sync panel and is not this harness's to extend.
 */
const PROMPT_SELECTOR = "h2, [data-lesson-prompt]";
/** The bottom-anchored wrong-answer-banner + CHECK/CONTINUE block. Same
 *  selector `installSimProbe`'s `tick()` already uses for `cta`. */
const CTA_SELECTOR = '[data-testid="primary-cta"]';
/** Every tile actually placed — no spent/collapse filtering needed, a tray
 *  never holds a spent bank tile. */
const TRAY_TILE_SELECTOR = '[data-tile-tray][data-kind="tray"] [data-tile]';
/** `data-spent` does not exist anywhere in this codebase (checked live,
 *  2026-09-17, `rg data-spent src/` — zero hits) — a bank tile's "already
 *  placed" state is `data-state="spent"` (`Tile.tsx`'s `state={used ?
 *  "spent" : "idle"}`). Excluding `[data-collapse="done"]` too is
 *  belt-and-suspenders: `collapse` is only ever set on an already-spent
 *  huge-bank tile (`BuildSentenceStepView.tsx`'s `bankCollapse` tracks
 *  `placedIdx`), so it can never fire on its own, but it costs nothing to
 *  keep both guards explicit. */
const BANK_TAPPABLE_SELECTOR =
  '[data-tile-tray][data-kind="bank"] [data-tile]:not([data-state="spent"]):not([data-collapse="done"])';
/** Same tile set as `BANK_TAPPABLE_SELECTOR` but without the collapse guard
 *  — used for the bank GROUP METRICS (a collapsing tile is mid-animation,
 *  not gone, and its shrinking box would only pollute the min, not explain
 *  anything a reader needs); the brief's own selector for the metrics group
 *  is spent-only. */
const BANK_METRIC_SELECTOR = '[data-tile-tray][data-kind="bank"] [data-tile]:not([data-state="spent"])';

/** Same fontPx measurement `measureTile()` uses (the label's computed
 *  `font-size`, not the tile's) — reused rather than reinvented so a
 *  build-sim reading and a `tiles[]` reading of the SAME tile never disagree
 *  on what "the font size" means. */
function measureTileMetric(tile: Element): TileMetricInput {
  const label = tileLabelEl(tile);
  const fontPx = parseFloat(getComputedStyle(label).fontSize) || 0;
  const box = tile.getBoundingClientRect();
  const fitScaleRaw = getComputedStyle(tile).getPropertyValue("--tile-fit-scale");
  const fitScaleNum = fitScaleRaw ? Number.parseFloat(fitScaleRaw) : NaN;
  return {
    fontPx: Math.round(fontPx * 100) / 100,
    boxH: Math.round(box.height * 100) / 100,
    fitScale: Number.isFinite(fitScaleNum) ? fitScaleNum : null,
  };
}

/** Rect top, rounded to 0.1px — `null` for an element that is not there. */
function rectTop(el: Element | null): number | null {
  if (!el) return null;
  const t = el.getBoundingClientRect().top;
  return Number.isFinite(t) ? Math.round(t * 10) / 10 : null;
}

/** Exported for `simProbe.test.ts` (rect-stubbed DOM): the per-tap sample. */
export function captureBuildSample(tap: number): BuildSample {
  const base = sampleLayout();
  const stage = document.querySelector(STAGE_SELECTOR);
  const stageBox = stage ? stage.getBoundingClientRect() : null;
  const trayTiles = [...document.querySelectorAll(TRAY_TILE_SELECTOR)];
  const bankTiles = [...document.querySelectorAll(BANK_METRIC_SELECTOR)];
  return {
    tap,
    ...base,
    promptTop: rectTop(stage ? stage.querySelector(PROMPT_SELECTOR) : null),
    ctaTop: rectTop(document.querySelector(CTA_SELECTOR)),
    stageTop: stageBox ? Math.round(stageBox.top * 10) / 10 : null,
    stageLeft: stageBox ? Math.round(stageBox.left * 10) / 10 : null,
    stageWidth: stageBox ? Math.round(stageBox.width * 10) / 10 : null,
    tray: computeGroupMetrics(trayTiles.map(measureTileMetric)),
    bank: computeGroupMetrics(bankTiles.map(measureTileMetric)),
  };
}

// ---------------------------------------------------------------------------
// Per-tap FRAME CAPTURE (2026-09-17) — rAF-sampled geometry around a single
// tap's transition, for animation analysis (not just settled geometry).
// ---------------------------------------------------------------------------

const ROW_SELECTOR = '[data-tile-tray][data-kind="row"][data-layer]:not([data-ghost])';
const TRAY_GROUP_SELECTOR = '[data-tile-tray][data-kind="tray"]';

function rectXYWH(el: Element): { x: number; y: number; w: number; h: number } {
  const b = el.getBoundingClientRect();
  return {
    x: Math.round(b.left * 10) / 10,
    y: Math.round(b.top * 10) / 10,
    w: Math.round(b.width * 10) / 10,
    h: Math.round(b.height * 10) / 10,
  };
}

function fitScaleOf(el: Element): number | null {
  const raw = getComputedStyle(el).getPropertyValue("--tile-fit-scale");
  const n = raw ? Number.parseFloat(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Min/max `--tile-fit-scale` across every element matching `selector` at
 *  this instant. Cheap re-query per frame (only `--tile-fit-scale`, not the
 *  full `TileMetricInput` triple `computeGroupMetrics` aggregates) — a
 *  build-sentence bank/tray tops out in the low tens of tiles, so this is
 *  well inside a single rAF's budget. */
function groupFitScaleRange(selector: string): { min: number | null; max: number | null } {
  const vals = [...document.querySelectorAll(selector)]
    .map(fitScaleOf)
    .filter((v): v is number => v !== null);
  if (vals.length === 0) return { min: null, max: null };
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

/** DOM read for one frame of a tap's trace. `trackedTile` is re-resolved by
 *  the CALLER every frame (not cached across frames) — see
 *  `recordTapFrameTrace`'s doc comment for why. */
function sampleTapFrame(t: number, trackedTile: Element | null, everSeen: boolean): TapFrameSample {
  let tile: TapFrameSample["tile"] = null;
  if (trackedTile) {
    const box = rectXYWH(trackedTile);
    const label = tileLabelEl(trackedTile);
    const cs = getComputedStyle(trackedTile);
    tile = {
      ...box,
      fontPx: Math.round((parseFloat(getComputedStyle(label).fontSize) || 0) * 100) / 100,
      transform: cs.transform,
      opacity: Math.round((Number.parseFloat(cs.opacity) || 0) * 1000) / 1000,
    };
  }
  const rowEl = document.querySelector(ROW_SELECTOR);
  const trayRow = rowEl ? rectXYWH(rowEl) : null;
  const trayGroupEl = document.querySelector(TRAY_GROUP_SELECTOR) as HTMLElement | null;
  const trayFit = groupFitScaleRange(TRAY_TILE_SELECTOR);
  const bankFit = groupFitScaleRange(BANK_METRIC_SELECTOR);
  return {
    t,
    tile,
    tileLost: everSeen && tile === null,
    trayRow,
    trayClientHeight: trayGroupEl ? trayGroupEl.clientHeight : null,
    trayFitScaleMin: trayFit.min,
    trayFitScaleMax: trayFit.max,
    bankFitScaleMin: bankFit.min,
    bankFitScaleMax: bankFit.max,
  };
}

/** Safety valve, NOT part of the brief's own stop condition (which has no
 *  upper bound: "until 700ms later, or until 3 stable frames after 300ms,
 *  whichever is later") — without a hard cap, a transition that genuinely
 *  never settles (a bug, or a tracked tile that's lost and never reappears)
 *  would hang this promise, and with it the whole build simulation, forever.
 *  3000ms is generous next to the 700ms floor. */
const FRAME_TRACE_MAX_MS = 3000;

/**
 * Pure stop-condition check, split out so it's testable without rAF/DOM
 * (`simProbe.test.ts`). Mirrors the brief literally: run at least 700ms;
 * past that, stop only once 3 CONSECUTIVE frames (counted starting no
 * earlier than t=300ms) showed no rect/font change — "whichever is later"
 * means neither trigger can fire the other short.
 */
export function shouldStopFrameTrace(tMs: number, stableCount: number, capped: boolean): boolean {
  if (capped) return true;
  return tMs >= 700 && stableCount >= 3;
}

/** Frame-to-frame stability key — rect + font only (transform/opacity are
 *  the ANIMATION itself and are expected to keep changing right up to the
 *  settle point; keying on them would delay "settled" past the geometry
 *  actually being stable). Pure. */
export function frameStabilityKey(tile: TapFrameSample["tile"]): string {
  if (!tile) return "null";
  return `${tile.x},${tile.y},${tile.w},${tile.h},${tile.fontPx}`;
}

/**
 * Records EVERY rAF frame (not just changed ones, unlike `recordLayoutTrace`
 * — the brief asks for animation analysis, which needs the in-between
 * frames too) from the moment it's called (assumed to be immediately after
 * the tap's `.click()`) until `shouldStopFrameTrace` says stop.
 *
 * `preTrayCount` (the tray's tile count captured BEFORE this tap's click)
 * identifies "the moved tile": the tray tiles are re-queried FRESH every
 * frame (not a cached element reference) and, once the tray grows past
 * `preTrayCount`, the tile at index `preTrayCount` (the newly-added one) is
 * tracked. Re-querying rather than caching means (a) frames before the
 * placement animation has mounted the tray tile correctly report `tile:
 * null` instead of guessing, and (b) a tile a re-render actually replaces
 * (not just moves) is detected as "lost" (`tileLost`) rather than silently
 * reporting a stale/disconnected element's last-known rect.
 */
async function recordTapFrameTrace(tap: number, preTrayCount: number): Promise<TapFrameTrace> {
  const t0 = performance.now();
  const frames: TapFrameSample[] = [];
  let stableCount = 0;
  let prevKey: string | null = null;
  let everSeen = false;
  let capped = false;
  return new Promise((resolve) => {
    const step = () => {
      const t = Math.round((performance.now() - t0) * 10) / 10;
      const trayTiles = [...document.querySelectorAll(TRAY_TILE_SELECTOR)];
      const trackedTile = trayTiles.length > preTrayCount ? trayTiles[preTrayCount] : null;
      if (trackedTile) everSeen = true;
      const sample = sampleTapFrame(t, trackedTile, everSeen);
      frames.push(sample);

      if (t >= 300) {
        const key = frameStabilityKey(sample.tile);
        stableCount = key === prevKey ? stableCount + 1 : 1;
        prevKey = key;
      }
      capped = t >= FRAME_TRACE_MAX_MS;
      if (shouldStopFrameTrace(t, stableCount, capped)) {
        resolve({ tap, frames, capped });
      } else {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  });
}

/** Best-effort marker POST so the Node harness can take real screenshots
 *  keyed to real tap events (a `"tap"` marker per tap, immediately after its
 *  `.click()`, plus one `"final"` once the sequence ends) instead of only
 *  the one end-of-wait screenshot every other capture mode takes — see
 *  `waitWithBuildMarkerScreenshots`/`burstScreenshots` in sim-capture.mjs.
 *  Reuses the SAME `/__sim/report` endpoint every other report already
 *  posts to — the middleware (`vite.config.ts`) just appends whatever JSON
 *  body it's given, no schema check — so this needed no server-side change.
 *  `runNonce` is echoed so a concurrent lane's markers can't be mistaken for
 *  this run's (PHASE2A.md §6.7 lane isolation, same pattern `readRunNonce`
 *  serves everywhere else in this file). */
function postSimMarker(phase: "tap" | "final", extra: Record<string, unknown> = {}): void {
  try {
    const body = JSON.stringify({ simMarker: true, phase, runNonce: readRunNonce(), ...extra });
    void fetch("/__sim/report", { method: "POST", headers: { "content-type": "application/json" }, body }).catch(() => {});
  } catch { /* no fetch */ }
}

/**
 * Task D (2026-09-17, single-shot-per-tap precision fix — Spencer's #182-
 * class complaint: "the queue lagged 2.8-5.2s behind the taps, so the 'tap
 * 10' contact sheet on ja-m15-neo-6?step=15 actually shows the final state
 * after tap 16"). MIRRORS `computeNextTapDelayMs` in `sim-capture.mjs` (no
 * shared module crosses the browser/Node boundary in this harness — same
 * established pattern as `SCREENSHOT_BURST_MS`/`FRAME_TRACE_MAX_MS` staying
 * in sync by hand); see that copy's doc comment for the formula's
 * rationale. This copy's `screenshotReturnMs` input
 * (`ESTIMATED_SCREENSHOT_RETURN_MS` below) is necessarily an ESTIMATE, not
 * a live ack from the Node process that's actually taking the screenshot:
 * `/__sim/report` (this module's ONLY channel to the dev server) is POST-
 * only, and no GET-back/ack channel exists without adding one in
 * `vite.config.ts` — out of this lane's owned files
 * (`scripts/ux-loop/sim-capture.mjs` + this file). The estimate is the
 * MEASURED single-shot `xcrun simctl io <udid> screenshot` latency recorded
 * live in `sim-capture.mjs`'s own doc comment (386-394ms, 5 back-to-back
 * calls) plus a safety margin — since the Node side ALSO now takes exactly
 * one screenshot per tap by default (see `waitAndCaptureBuildTapShots`),
 * pacing taps to this floor keeps the two sides roughly in lockstep without
 * a real synchronous handshake.
 */
const ESTIMATED_SCREENSHOT_RETURN_MS = 500;

/** See the Node-side `computeNextTapDelayMs` in `sim-capture.mjs` — same
 *  name, same formula, kept in sync by hand. Pure. */
export function computeNextTapDelayMs(opts: {
  tapIntervalMs: number;
  traceStableMs: number | null;
  screenshotReturnMs: number | null;
}): number {
  const floor = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return Math.max(floor(opts.tapIntervalMs), floor(opts.traceStableMs), floor(opts.screenshotReturnMs));
}

/**
 * Taps every bank tile in turn (`BANK_TAPPABLE_SELECTOR`, first-match order —
 * order doesn't matter for layout, only that every tile gets placed like a
 * learner would), sampling geometry before the first tap and after each one
 * (one rAF + 120ms after the click, so the tap/placement transition
 * settles), AND recording a full per-frame trace around every tap (see
 * `recordTapFrameTrace` — 2026-09-17, "FRAME CAPTURE... not only settled
 * geometry"). Stops when the bank is empty or `maxTaps` is reached, whichever
 * first — `initialBankCount` is read ONCE up front (the bank only ever
 * SHRINKS as tiles are placed, never grows mid-sequence) so the continuous
 * `recordLayoutTrace` below can be sized to the actual planned run instead of
 * always paying for the full `maxTaps` worst case.
 *
 * `frameBurstMode` (`--frame-burst` → `simFrameBurst=1`, task D) selects
 * between two tap-pacing strategies, matched to what the Node side is doing
 * with the marker (see `waitAndCaptureBuildTapShots` in `sim-capture.mjs`):
 *   - `false` (DEFAULT, 2026-09-17): the per-tap `recordTapFrameTrace` is
 *     AWAITED before the next tap — "after the tap's frame trace reports
 *     stable" is exactly this trace's own resolution (it already implements
 *     "700ms floor, then 3 stable frames after 300ms, else a 3000ms safety
 *     cap" — see `shouldStopFrameTrace`). Combined with `--tap-interval` and
 *     `ESTIMATED_SCREENSHOT_RETURN_MS` via `computeNextTapDelayMs`, this
 *     paces the tap loop to the Node side's now-single-screenshot-per-tap
 *     capture instead of outrunning it.
 *   - `true` (`--frame-burst`, the OLD behavior): fire-and-forgotten (pushed
 *     onto `frameTracePromises`, not awaited inline) so it runs CONCURRENTLY
 *     with the tap loop's own fixed `tapIntervalMs` cadence — appropriate
 *     only when the Node side is ALSO back in its old multi-shot burst mode
 *     (a burst spans the whole transition on its own, so it doesn't need
 *     the browser to wait for a single settled moment).
 *
 * One continuous `recordLayoutTrace` still runs for the WHOLE sequence in
 * BOTH modes (extended to a longer duration rather than restarted per tap —
 * a fresh trace per tap would reset `h2Reversals` detection at each
 * boundary, exactly where cross-tap flicker would show up).
 */
async function runBuildSimulation(tapIntervalMs: number, maxTaps: number, frameBurstMode: boolean): Promise<BuildSimulationResult> {
  await sleep(1500); // let the step mount + fit/fill settle before measuring — same wait runTapSequence uses.
  const initialBankCount = document.querySelectorAll(BANK_TAPPABLE_SELECTOR).length;
  const plannedTaps = Math.max(0, Math.min(maxTaps, initialBankCount));
  // Non-burst mode awaits each tap's own frame trace (up to FRAME_TRACE_MAX_MS)
  // before the next tap, so the whole sequence can take far longer than
  // `plannedTaps * tapIntervalMs` in the worst case — size the continuous
  // layout trace generously for either mode rather than risk it ending
  // before the last tap's settle.
  const totalTraceMs = frameBurstMode
    ? Math.max(1, plannedTaps) * tapIntervalMs + 1500
    : Math.max(1, plannedTaps) * (Math.max(tapIntervalMs, FRAME_TRACE_MAX_MS) + 200) + 1500;
  const tracePromise = recordLayoutTrace(totalTraceMs);
  const frameTracePromises: Promise<TapFrameTrace>[] = [];
  const frames: TapFrameTrace[] = [];

  const samples: BuildSample[] = [captureBuildSample(0)];
  let taps = 0;
  for (let i = 1; i <= maxTaps; i++) {
    const target = document.querySelector(BANK_TAPPABLE_SELECTOR) as HTMLElement | null;
    if (!target) break;
    const preTrayCount = document.querySelectorAll(TRAY_TILE_SELECTOR).length;
    const tapClickedAt = performance.now();
    target.click();
    taps++;
    // Marker + frame trace fired as close to the click as possible, BEFORE
    // the settle waits below, so the Node-side screenshot's "t=0" and this
    // trace's own t=0 are both as close to the real click as possible.
    postSimMarker("tap", { tapNumber: i });
    const tapTracePromise = recordTapFrameTrace(i, preTrayCount);
    if (frameBurstMode) {
      frameTracePromises.push(tapTracePromise);
      await nextFrame();
      await sleep(120);
      samples.push(captureBuildSample(i));
      if (i < maxTaps) await sleep(Math.max(0, tapIntervalMs - 120));
    } else {
      // Default: wait for the tap's OWN trace to report stable before doing
      // anything else — see the doc comment above.
      const tapTrace = await tapTracePromise;
      frames.push(tapTrace);
      const traceStableMs = tapTrace.frames.length > 0 ? tapTrace.frames[tapTrace.frames.length - 1].t : null;
      await nextFrame();
      await sleep(120);
      samples.push(captureBuildSample(i));
      if (i < maxTaps) {
        const fireAtMs = computeNextTapDelayMs({ tapIntervalMs, traceStableMs, screenshotReturnMs: ESTIMATED_SCREENSHOT_RETURN_MS });
        const elapsedMs = performance.now() - tapClickedAt;
        await sleep(Math.max(0, fireAtMs - elapsedMs));
      }
    }
  }
  postSimMarker("final", { taps });

  const [layoutTrace, burstFrames] = await Promise.all([tracePromise, Promise.all(frameTracePromises)]);
  return { mode: "build", taps, samples, layoutTrace, frames: frameBurstMode ? burstFrames : frames };
}

/**
 * Golden-learner replay (2026-09-17, lane A2d, docs/golden-replay-2026-09-17.md).
 *
 * DEVIATION NOTE (lane A2d's brief scoped this file OUT of its owned-files
 * list — every other change this lane made lives in
 * `scripts/ux-loop/sim-capture.mjs`, `src/shared/telemetry/sessionLog.ts`,
 * `src/features/sync/LayoutTracePanel.tsx`, and the two build step views).
 * This function + its ~10-line hook in `installSimProbe` below are the ONE
 * exception, made deliberately and flagged here for whoever reviews this
 * lane: there is no live JS-execution channel from the Node harness into
 * the WKWebView (confirmed — see `sim-capture.mjs`'s own "Per-tap
 * screenshot timing" doc comment, which researched exactly this and found
 * none), so a MULTI-tap, IN-SESSION, label-driven replay has nowhere else
 * to run from — every other `sim*` capability in this harness (`--tap`,
 * `--simulate build`, `--seed`, `--font-scale`, …) is ALSO driven from
 * exactly this file, read from query params at page load, for the same
 * reason. The change is purely ADDITIVE (one new exported function, one
 * new `else if` branch below — nothing existing is touched) to minimize
 * collision risk with whichever lane owns this file's other work.
 *
 * Taps by the tile's own visible LABEL text (not a DOM index or CSS
 * selector) against whichever pool (`source: "bank"`/`"answer"`) the
 * recording says, so a replay survives a reshuffled bank. `source: "bank"`
 * picks the FIRST remaining match in `BANK_TAPPABLE_SELECTOR` order — a
 * spent tile drops out of that selector automatically (see its own doc
 * comment), so "first remaining match" is exact even with duplicate
 * glyphs, same guarantee `BuildSentenceStepView`'s own INDEX-based
 * placedIdx tracking documents. `source: "answer"` trusts the recorded
 * tray SLOT (`position`) directly and only falls back to a label search if
 * the label there has drifted — mirrors `resolveReplayLabelMatch` in
 * `sim-capture.mjs` (kept in sync BY HAND, the same established pattern as
 * `FRAME_TRACE_MAX_MS`/`ESTIMATED_SCREENSHOT_RETURN_MS` — no shared module
 * crosses the browser/Node boundary in this harness).
 *
 * A label not found on screen is a HARD FAIL (the brief: "a tap whose
 * label is not on screen = hard fail with the visible labels listed") —
 * returns immediately with `ok: false` + `missingLabel`/`visibleLabels`/
 * `missingAtTapIndex` instead of pressing on with a broken sequence.
 *
 * `speedMode: 1` (real-time) waits out each tap's OWN recorded `tMs` delta
 * from the previous tap (a human's actual pauses); `speedMode: 0` fires as
 * soon as the previous tap's own frame trace settles (as-fast-as-possible).
 * Either way every tap still gets its full settle wait — replay fidelity
 * to WHAT was tapped and in what order never trades off against measuring
 * it correctly.
 */
async function runTapReplay(
  taps: { tMs: number; label: string; source: "bank" | "answer"; position: number }[],
  speedMode: 0 | 1,
): Promise<
  Omit<BuildSimulationResult, "mode"> & {
    mode: "replay";
    ok: boolean;
    missingLabel?: string;
    visibleLabels?: string[];
    missingAtTapIndex?: number;
  }
> {
  await sleep(1500); // same pre-measure settle runBuildSimulation/runTapSequence use.
  const totalTraceMs = Math.max(1, taps.length) * (FRAME_TRACE_MAX_MS + 200) + 1500;
  const tracePromise = recordLayoutTrace(totalTraceMs);
  const frames: TapFrameTrace[] = [];
  const samples: BuildSample[] = [captureBuildSample(0)];
  let lastTMs = 0;

  // `tileLabelEl(...).textContent` is not the clean recorded label:
  // `AnnotatedText.tsx`'s `<rt>` furigana helper renders a `​`
  // zero-width-space PLACEHOLDER even when hidden (`showHelper ? helper :
  // "​"`, so its box never collapses to 0 width) — `textContent`
  // walks INTO that `<rt>`, so a plain kana tile's textContent came back
  // as e.g. "な​った​" against a recorded label of "なった"
  // (found live, 2026-09-17: every replay label-matched as "missing" until
  // this strip was added). Strip zero-width space before comparing —
  // `sessionLog.ts`'s recorded `label` never contains one (it's the raw
  // `bankTiles[i]` string, not DOM text).
  const cleanTileText = (el: Element): string => (tileLabelEl(el).textContent ?? "").replace(/​/g, "").trim();
  const poolLabelsFor = (source: "bank" | "answer"): string[] =>
    [...document.querySelectorAll(source === "bank" ? BANK_TAPPABLE_SELECTOR : TRAY_TILE_SELECTOR)].map(cleanTileText);

  for (let i = 0; i < taps.length; i++) {
    const t = taps[i];
    const pool = [...document.querySelectorAll(t.source === "bank" ? BANK_TAPPABLE_SELECTOR : TRAY_TILE_SELECTOR)] as HTMLElement[];
    const labels = pool.map(cleanTileText);
    // A word tile's `textContent` is not always the recorded label exactly:
    // `sessionLog.ts` records the tile's SEMANTIC value (`bankTiles[i]`,
    // e.g. the reading "いえ"), but a kanji tile's rendered `<ruby>家<rt>
    // いえ</rt></ruby>` has `textContent` "家いえ" (base + reading
    // concatenated — found live, 2026-09-17). EXACT match first (every
    // plain kana tile); a CONTAINS fallback catches the kanji case without
    // giving up the exact match's precision where it's available.
    let targetIdx = -1;
    if (t.source === "answer" && labels[t.position] === t.label) {
      targetIdx = t.position;
    } else {
      targetIdx = labels.indexOf(t.label);
      if (targetIdx === -1) targetIdx = labels.findIndex((l) => l.includes(t.label));
    }
    if (targetIdx === -1) {
      // HARD FAIL — return immediately. Deliberately does NOT `await
      // tracePromise` (found live, 2026-09-17: `tracePromise` runs for the
      // WHOLE planned sequence, up to ~20s+ for a 6-tap replay — awaiting
      // it here meant a hard fail on tap 2 of 6 didn't actually RETURN
      // until the other ~18s had elapsed, and by the time it did,
      // `installSimProbe`'s own periodic `tick()` had already stopped
      // scheduling new report POSTs, so the Node harness's LAST-read report
      // still showed `simulation: null` — "final marker not yet seen" even
      // though the hard fail had genuinely already happened). Posts
      // `"final"` too so `sim-capture.mjs`'s marker-driven poll loop can
      // stop waiting immediately instead of idling out its own budget.
      postSimMarker("final", { taps: i, failed: true });
      return {
        mode: "replay",
        taps: i,
        samples,
        layoutTrace: { frames: 0, changed: [], maxH2Jump: 0, h2Reversals: 0, meanDt: 0, maxDt: 0 },
        frames,
        ok: false,
        missingLabel: t.label,
        visibleLabels: poolLabelsFor(t.source),
        missingAtTapIndex: i,
      };
    }
    if (speedMode === 1 && i > 0) {
      await sleep(Math.max(0, t.tMs - lastTMs));
    }
    const preTrayCount = document.querySelectorAll(TRAY_TILE_SELECTOR).length;
    pool[targetIdx].click();
    postSimMarker("tap", { tapNumber: i + 1 });
    const tapTrace = await recordTapFrameTrace(i + 1, preTrayCount);
    frames.push(tapTrace);
    await nextFrame();
    await sleep(120);
    samples.push(captureBuildSample(i + 1));
    lastTMs = t.tMs;
  }
  postSimMarker("final", { taps: taps.length });
  const layoutTrace = await tracePromise;
  return { mode: "replay", taps: taps.length, samples, layoutTrace, frames, ok: true };
}

/**
 * G5 (REPORT.md "Harness defects") — `--tap <selector>` /
 * `--answer-first-option`. No touch-injection channel exists anywhere in
 * this repo already (the "injected taps" the speech-recognition harness
 * uses are an INJECTED PLUGIN OBJECT for unit tests — `useNativeSpeechRecognition`'s
 * `injected` param — not a UI tap channel; checked before writing this).
 * Simplest reliable option available from inside the WKWebView itself: a
 * real DOM `.click()` on the target element, which fires the same React
 * `onClick` a finger tap would. Reuses the SAME "encode intent in the
 * target route's query string, read it client-side" bridge as
 * `simFontScale`/`simEmu*` — no new HTTP endpoint needed. Records CTA +
 * every option's `{top, left}` before and after so a capture can answer
 * "did the CTA/options move on submit" (the mobile-sizing invariant in
 * CLAUDE.md: "Option buttons + the CTA must NOT move on submit").
 */
async function runTapSequence(): Promise<TapResult | null> {
  let tapSelector: string | null = null;
  let answerFirstOption = false;
  try {
    const params = new URLSearchParams(location.search);
    tapSelector = params.get("simTap");
    answerFirstOption = params.get("simAnswerFirstOption") === "1";
  } catch { /* no location */ }
  if (!tapSelector && !answerFirstOption) return null;

  await sleep(1500); // let the step mount + fit/fill settle before measuring "pre".
  const pre = captureOptionGeometry();
  let target: Element | null = null;
  try {
    target = answerFirstOption
      ? document.querySelector('[data-lesson-stage] [data-tile][data-variant="option"]')
      : tapSelector
        ? document.querySelector(tapSelector)
        : null;
  } catch { /* invalid selector */ }
  const tapped = Boolean(target);
  // LAYOUT TRACE (2026-09-16, TestFlight #174 / Spencer's 18:29 screen
  // recording): sample the stage geometry on EVERY animation frame from
  // just before the click until the step settles, so a one-frame layout
  // jump (the prompt dropping ~33 CSS px on alternate frames after a tile
  // tap) is measurable here instead of only in a phone video. Only frames
  // whose values differ from the previous frame are kept.
  const tracePromise = recordLayoutTrace(700);
  await sleep(16);
  if (target instanceof HTMLElement) target.click();
  await sleep(800); // let the submit/advance animation settle before measuring "post".
  const post = captureOptionGeometry();
  const layoutTrace = await tracePromise;
  return { tapSelector, answerFirstOption, tapped, pre, post, layoutTrace };
}

export function installSimProbe(): void {
  if (!import.meta.env.DEV) return;
  let armed = false;
  try { armed = localStorage.getItem("lingo:sim-probe") === "1"; } catch { /* no storage */ }
  if (!armed) return;
  applyFontScaleFromUrl();
  const emulatedViewport = applyViewportEmulationFromUrl();
  // `--simulate build` (sim-capture.mjs) writes `simSimulate=build` +
  // `simTapInterval`/`simMaxTaps` onto the target route — mutually exclusive
  // with `--tap`/`--answer-first-option`'s single-tap `runTapSequence`
  // (both click bank tiles; running both would race each other for no
  // benefit, so a `simSimulate=build` route runs ONLY the build simulation).
  let simulateMode: string | null = null;
  let tapIntervalMs = 450;
  let maxTaps = 20;
  // Task D: `--frame-burst` → `simFrameBurst=1` — see `runBuildSimulation`'s
  // `frameBurstMode` doc comment for the two pacing strategies this selects.
  let frameBurstMode = false;
  // Golden-learner replay (2026-09-17, lane A2d) — `simSimulate=replay` +
  // `simTapsReplay` (base64 JSON `{tMs,label,source,position}[]`) +
  // `simReplaySpeed` (`"0"|"1"`), written by `sim-capture.mjs`'s
  // `buildTargetRoute` under `--replay <file>`. See `runTapReplay`'s doc
  // comment for why this lives here rather than a file this lane normally
  // owns.
  let replayTaps: { tMs: number; label: string; source: "bank" | "answer"; position: number }[] | null = null;
  let replaySpeed: 0 | 1 = 1;
  try {
    const params = new URLSearchParams(location.search);
    simulateMode = params.get("simSimulate");
    const ti = Number(params.get("simTapInterval"));
    if (Number.isFinite(ti) && ti > 0) tapIntervalMs = ti;
    const mt = Number(params.get("simMaxTaps"));
    if (Number.isFinite(mt) && mt > 0) maxTaps = mt;
    frameBurstMode = params.get("simFrameBurst") === "1";
    const tapsB64 = params.get("simTapsReplay");
    if (simulateMode === "replay" && tapsB64) {
      // Plain `atob()` decodes base64 to a "binary string" (one JS char per
      // BYTE, 0-255) — WRONG for the multi-byte UTF-8 tile labels here
      // (found live, 2026-09-17: a Japanese label made `JSON.parse` throw,
      // silently swallowed by this function's own outer try/catch, which
      // left `replayTaps` null and every replay run waited out its full
      // budget doing nothing). `TextDecoder("utf-8")` over the raw bytes is
      // the correct decode — mirrors `Buffer.from(json, "utf8").toString
      // ("base64")` on the Node side (`sim-capture.mjs`'s `buildTargetRoute`).
      const binary = atob(tapsB64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const decoded = JSON.parse(new TextDecoder("utf-8").decode(bytes));
      if (Array.isArray(decoded)) replayTaps = decoded;
      replaySpeed = params.get("simReplaySpeed") === "0" ? 0 : 1;
    }
  } catch { /* no location */ }
  const buildSimActive = simulateMode === "build";
  const replayActive = simulateMode === "replay" && Array.isArray(replayTaps) && replayTaps.length > 0;
  let tapResult: TapResult | null = null;
  let simulationResult:
    | BuildSimulationResult
    | (Omit<BuildSimulationResult, "mode"> & {
        mode: "replay";
        ok: boolean;
        missingLabel?: string;
        visibleLabels?: string[];
        missingAtTapIndex?: number;
      })
    | null = null;
  if (replayActive && replayTaps) {
    // `tick()` (below) is scheduled at FIXED times (plus a padded estimate
    // for this mode) — Node's own report-reading wait for
    // `--simulate replay` is marker-driven (`waitAndCaptureBuildTapShots`)
    // and returns as soon as the "final" marker + expected shot count are
    // seen, which can be BEFORE any later scheduled tick fires (found
    // live, 2026-09-17: even after padding `scheduleTicks` for replay's
    // own worst-case duration, Node's shot-completion check still won out
    // the race and moved on to `readNewReports` before that tick posted,
    // so every replay's `report.simulation` stayed `null` regardless of
    // the padding). Call `tick()` directly, synchronously, the INSTANT the
    // promise resolves — no scheduling estimate to get wrong, it fires
    // exactly when `simulationResult` becomes non-null, always before
    // Node's own `postSimMarker("final", ...)`-driven check can see it
    // (that same call posts synchronously milliseconds earlier inside
    // `runTapReplay`, same microtask queue turn).
    void runTapReplay(replayTaps, replaySpeed).then((r) => { simulationResult = r; tick(); });
  } else if (buildSimActive) {
    void runBuildSimulation(tapIntervalMs, maxTaps, frameBurstMode).then((r) => { simulationResult = r; tick(); });
  } else {
    void runTapSequence().then((r) => { tapResult = r; });
  }
  const r = (el: Element | null) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) };
  };
  const tick = () => {
    const cs = getComputedStyle(document.documentElement);
    const stage = document.querySelector("[data-lesson-stage]");
    const scroller = stage?.parentElement ?? null;
    const shell = scroller?.parentElement ?? null;
    // (b24's `[data-phantom]` exclusion lived here: a huge bank rendered a
    // hidden second copy of the answer, whose zero-height tiles had to be
    // kept out of the tray count/histogram. Build 25 reserves the tray's
    // height in its VISIBLE ghost row instead, so there is no hidden copy
    // left to exclude — every `[data-tile]` on the stage is a real one.)
    const tileEls = [...document.querySelectorAll("[data-lesson-stage] [data-tile]")];
    const tiles = tileEls.map(measureTile);
    const rootFontPx = Math.round(parseFloat(getComputedStyle(document.documentElement).fontSize) || 0);
    const sampleTile = tiles.length > 0 ? tiles[0] : null;
    const vv = window.visualViewport ? Math.round(window.visualViewport.height) : null;
    const stageBox = r(stage);
    const vvTop = window.visualViewport ? window.visualViewport.offsetTop : 0;
    const vvBottom = window.visualViewport ? vvTop + window.visualViewport.height : window.innerHeight;
    const viewportRect: RectTB = { top: Math.round(vvTop), bottom: Math.round(vvBottom) };
    const scrollerEl = scroller as HTMLElement | null;
    const scrollerRect: RectTB | null = scrollerEl
      ? (() => { const b = scrollerEl.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; })()
      : null;
    const ctaEl = document.querySelector('[data-testid="primary-cta"]');
    const ctaRect: RectTB | null = ctaEl
      ? (() => { const b = (ctaEl as HTMLElement).getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; })()
      : null;
    const ctaFixed = ctaEl ? getComputedStyle(ctaEl).position === "fixed" : false;
    const out = {
      // --- 2026-09-16 additions (G1/G5 — REPORT.md "Harness defects") ---
      // G1: a capture whose dev server wasn't started with VITE_NATIVE=true
      // takes the web auth path and shows the native-scheme alert over the
      // screenshot — report it so the harness fails loudly on a wrong
      // server instead of a silently-covered screenshot.
      nativeMode: IS_NATIVE,
      // G5: set only when `--viewport WxH` requested emulated-landscape.
      emulatedViewport,
      tapResult,
      // `--simulate build` — raw per-tap samples + the continuous flicker
      // trace; JUDGMENT (verdicts) is computed Node-side, see the doc
      // comment above `runBuildSimulation`.
      simulation: simulationResult,
      // PHASE2A.md §6.7 (lane isolation) — echoed back so the CLI can tell
      // its own report apart from a concurrent lane's, see readRunNonce().
      runNonce: readRunNonce(),
      // --- 2026-09-15 additions ---
      rootFontPx,
      fontScale: readFontScaleSetting(),
      notoLoaded: (() => {
        try { return document.fonts.check('16px "Noto Sans JP"'); } catch { return null; }
      })(),
      sampleTileFontFamily: tileEls.length > 0 ? getComputedStyle(tileLabelEl(tileEls[0])).fontFamily : null,
      emRatio: sampleTile && rootFontPx > 0 ? Math.round((sampleTile.fontPx / rootFontPx) * 1000) / 1000 : null,
      textSizeAdjust: cs.getPropertyValue("-webkit-text-size-adjust") || getComputedStyle(document.documentElement).getPropertyValue("text-size-adjust") || null,
      dpr: window.devicePixelRatio,
      pointerCoarse: matchMedia("(pointer: coarse)").matches,
      stageOverReportPx: computeStageOverReportPx({
        scrollerClientHeight: scrollerEl ? scrollerEl.clientHeight : null,
        scrollerRect,
        viewportRect,
        ctaRect,
        ctaFixed,
      }),
      chromeAbovePx: chromeAbovePx(stageBox?.top ?? null, viewportRect.top),
      chromeBelowPx: chromeBelowPx(viewportRect.bottom, stageBox?.bottom ?? null),
      tiles,
      // --- pre-existing fields ---
      innerHeight: window.innerHeight,
      // Added alongside runNonce — a device/viewport mismatch (the other
      // half of lane isolation: the 15 Pro Max vs iPad Air corruption case)
      // shows up here even on a NON-emulated capture, where `emulatedViewport`
      // is null and so can't be the validator's only width signal.
      innerWidth: window.innerWidth,
      // G6 — real `env(safe-area-inset-*)` px (see `measureSafeAreaInsets`
      // doc comment); part of the orientation harness's oracle so a
      // real-landscape capture can be checked for real landscape insets,
      // not just innerWidth/innerHeight.
      safeAreaInsets: measureSafeAreaInsets(),
      vv,
      docH: document.documentElement.clientHeight,
      bodyScrollH: document.body.scrollHeight,
      cookieVar: cs.getPropertyValue("--cookie-consent-height") || null,
      main: r(document.querySelector("main")),
      shell: r(shell),
      scroller: scroller ? { ...r(scroller), scrollH: scroller.scrollHeight, clientH: scroller.clientHeight } : null,
      stage: stageBox,
      // `left`/`width` alongside the pre-existing `stage.top`/`.bottom`/`.h`
      // (`r()` only ever returned those three — widening it would change
      // every OTHER caller's shape) — added 2026-09-17 (lane A5b) so a PLAIN
      // capture (not `--simulate build`, which already carries
      // `stageLeft`/`stageWidth` per-tap via `captureBuildSample` in this
      // same file) can crop its screenshot to `[data-lesson-stage]` for the
      // pixel-baseline check in `sim-capture.mjs`. Same naming as
      // `BuildSample.stageLeft`/`.stageWidth` on purpose — one vocabulary
      // for "the stage's own rect" across both capture modes.
      stageLeft: stage ? Math.round(stage.getBoundingClientRect().left) : null,
      stageWidth: stage ? Math.round(stage.getBoundingClientRect().width) : null,
      cta: r(document.querySelector('[data-testid="primary-cta"]')),
      tray: r(document.querySelector("[data-lesson-stage] .border-dashed")),
      // Every box in the step column, so the budget can be read line by line.
      kids: [...(stage?.firstElementChild?.firstElementChild?.children ?? [])].map((k) => ({
        cls: (k.getAttribute("class") ?? k.tagName).slice(0, 40),
        ...r(k),
      })),
      // Kanji reveal ruby (TestFlight #12): every box inside the choreo
      // span, with the styles that decide whether the furigana can paint.
      ruby: [...document.querySelectorAll(".krv-choreo, .krv-choreo ruby, .krv-choreo rt, .krv-choreo rt *")].map((el) => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return { tag: el.tagName, cls: (el as HTMLElement).className?.toString().slice(0, 30), t: Math.round(r.top), l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), disp: cs.display, vis: cs.visibility, op: cs.opacity, fs: cs.fontSize, clip: cs.clipPath, anim: cs.animationName, text: (el.textContent ?? "").slice(0, 8) };
      }),
      rubyAncestors: (() => {
        const out: unknown[] = []; let el: Element | null = document.querySelector(".krv-choreo");
        for (let i = 0; el && i < 6; i++) { el = el.parentElement; if (!el) break; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); out.push({ tag: el.tagName, cls: el.className.toString().slice(0, 40), t: Math.round(r.top), h: Math.round(r.height), ov: cs.overflow, pos: cs.position }); }
        return out;
      })(),
      // Body scrollbar on touch (TestFlight #1): is OverlayScrollbars mounted?
      osBars: [...document.querySelectorAll(".os-scrollbar")].map((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { cls: el.className.toString().slice(0, 60), l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), vis: cs.visibility, op: cs.opacity }; }),
      coarse: matchMedia("(pointer: coarse)").matches,
    };
    const body = JSON.stringify({ ...out, href: location.pathname + location.search, ua: navigator.userAgent.slice(0, 80) });
    console.log("SIMPROBE " + body);
    // Same-origin in the dev harness (the app is served by vite), so this lands
    // in vite.config.ts's `/__sim/report` → artifacts/ux-loop/sim-probe.jsonl.
    void fetch("/__sim/report", { method: "POST", headers: { "content-type": "application/json" }, body }).catch(() => {});
  };
  const scheduleTicks = [3000, 5000, 7000, 9000, 12000];
  if (buildSimActive) {
    // A build-sim sequence's own worst-case duration — 1500ms settle +
    // the tap loop itself + a 3000ms tail for the trace/report round trip —
    // can outlast the fixed 12000ms last tick on a big bank/high
    // --max-taps. Add one more tick sized to it so the LAST report the CLI
    // reads always carries a finished `simulation` (not a still-in-flight
    // null). Mirrors `sim-capture.mjs`'s own `effectiveWaitMs`/
    // `buildSimTotalMs` bump for this mode (kept in sync by hand — no
    // shared module crosses the browser/Node boundary here).
    //   - `--frame-burst` (`frameBurstMode`): unchanged from before —
    //     maxTaps*tapIntervalMs (fixed cadence) + FRAME_TRACE_MAX_MS (the
    //     LAST tap's fire-and-forgotten frame trace, which starts near the
    //     end of the loop and can take up to its own 3000ms cap to
    //     resolve).
    //   - default (2026-09-17): EVERY tap now awaits its own frame trace
    //     before the next fires, so the worst case is maxTaps full
    //     FRAME_TRACE_MAX_MS caps back to back, not just the last one.
    const tapLoopWorstMs = frameBurstMode
      ? maxTaps * tapIntervalMs + FRAME_TRACE_MAX_MS
      : maxTaps * (Math.max(tapIntervalMs, FRAME_TRACE_MAX_MS, ESTIMATED_SCREENSHOT_RETURN_MS) + 200);
    scheduleTicks.push(1500 + tapLoopWorstMs + 3000);
  } else if (replayActive && replayTaps) {
    // Same problem, found live 2026-09-17 seeding the golden set: this
    // branch was MISSING entirely (only `buildSimActive` pushed the padded
    // tick), so EVERY replay's `runTapReplay` promise resolved well after
    // the fixed 12000ms last tick (6 taps × ~3120ms/tap ≈ 20s, all inside
    // `recordTapFrameTrace`'s own FRAME_TRACE_MAX_MS budget) — no tick
    // ever fired again to carry the finished `simulation` back to Node, so
    // `report.simulation` stayed `null` in every posted report forever.
    // Node's marker-driven poll loop still noticed the run had finished
    // (via `postSimMarker("final", ...)`) and pixelDiff still passed
    // correctly (it reads the screenshot file, not `report.simulation`) —
    // which is exactly why this stayed hidden until someone actually READ
    // the printed verdicts/tap-table columns instead of only the
    // pixelDiff/PASS line. Mirrors `sim-capture.mjs`'s own
    // `replayTotalMs` formula (kept in sync by hand, same as the
    // `buildSimActive` branch above).
    const replaySettleSumMs = replayTaps.length * (FRAME_TRACE_MAX_MS + ESTIMATED_SCREENSHOT_RETURN_MS + 200);
    const replayTotalMs =
      1500 + (replaySpeed === 1 ? Math.max(0, ...replayTaps.map((t) => t.tMs)) : 0) + replaySettleSumMs + 3000;
    scheduleTicks.push(replayTotalMs + 2000);
  }
  for (const ms of scheduleTicks) window.setTimeout(tick, ms);
}
