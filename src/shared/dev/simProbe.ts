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

// ---------------------------------------------------------------------------
// Pure parts — no DOM required, exercised directly by simProbe.test.ts.
// ---------------------------------------------------------------------------

/** Minimal shape of a DOMRect (or DOMRectReadOnly) this module needs. */
export interface RectLike {
  top: number;
}

/**
 * A wrapped label produces one `getClientRects()` entry per line; a
 * single-line label produces one. Rects with the same rounded `top` are the
 * same line (sub-pixel jitter between rects on one line is real and must not
 * count as two lines), so distinct rounded tops = line count.
 */
export function countDistinctLines(rects: ArrayLike<RectLike>): number {
  if (rects.length === 0) return 0;
  const tops = new Set<number>();
  for (let i = 0; i < rects.length; i++) tops.add(Math.round(rects[i].top));
  return tops.size;
}

/** Wrap/clip verdict from measured line count + scroll geometry. Pure. */
export function deriveTileFlags(opts: {
  lineCount: number;
  scrollWidth: number;
  clientWidth: number;
}): { wrapped: boolean; clipped: boolean } {
  return {
    wrapped: opts.lineCount > 1,
    // > (not >=): equal widths is a tight but non-clipping fit.
    clipped: opts.scrollWidth > opts.clientWidth,
  };
}

export interface TileReport {
  text: string;
  variant: string | null;
  fontPx: number;
  boxW: number;
  boxH: number;
  lineCount: number;
  wrapped: boolean;
  clipped: boolean;
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

function measureTile(tile: Element): TileReport {
  const label = tileLabelEl(tile);
  const rects = label.getClientRects();
  const lineCount = countDistinctLines(rects);
  const box = tile.getBoundingClientRect();
  const cs = getComputedStyle(label);
  const el = label as HTMLElement;
  const { wrapped, clipped } = deriveTileFlags({
    lineCount,
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  });
  return {
    text: (tile.textContent ?? "").trim().slice(0, 40),
    variant: tile.getAttribute("data-variant"),
    fontPx: Math.round(parseFloat(cs.fontSize) || 0),
    boxW: Math.round(box.width),
    boxH: Math.round(box.height),
    lineCount,
    wrapped,
    clipped,
  };
}

export function installSimProbe(): void {
  if (!import.meta.env.DEV) return;
  let armed = false;
  try { armed = localStorage.getItem("lingo:sim-probe") === "1"; } catch { /* no storage */ }
  if (!armed) return;
  applyFontScaleFromUrl();
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
