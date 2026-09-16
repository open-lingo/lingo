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
  if (target instanceof HTMLElement) target.click();
  await sleep(800); // let the submit/advance animation settle before measuring "post".
  const post = captureOptionGeometry();
  return { tapSelector, answerFirstOption, tapped, pre, post };
}

export function installSimProbe(): void {
  if (!import.meta.env.DEV) return;
  let armed = false;
  try { armed = localStorage.getItem("lingo:sim-probe") === "1"; } catch { /* no storage */ }
  if (!armed) return;
  applyFontScaleFromUrl();
  const emulatedViewport = applyViewportEmulationFromUrl();
  let tapResult: TapResult | null = null;
  void runTapSequence().then((r) => { tapResult = r; });
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
      vv,
      docH: document.documentElement.clientHeight,
      bodyScrollH: document.body.scrollHeight,
      cookieVar: cs.getPropertyValue("--cookie-consent-height") || null,
      main: r(document.querySelector("main")),
      shell: r(shell),
      scroller: scroller ? { ...r(scroller), scrollH: scroller.scrollHeight, clientH: scroller.clientHeight } : null,
      stage: stageBox,
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
  for (const ms of [3000, 5000, 7000, 9000, 12000]) window.setTimeout(tick, ms);
}
