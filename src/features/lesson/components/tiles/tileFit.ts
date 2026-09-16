/**
 * THE TILE TEXT RULE — fit the label, then fill the stage.
 *
 * Spencer, TestFlight #156 (build 20): "Text wrap is so ugly here, shrinking
 * the font size floor is preferred and we can fill up to a certain size."
 * And #152: "I'm still mad with the UI sizing" — measured at 430×932, 34% of
 * the build screen is dead space while every tile sits pinned at the 45px
 * `--tile-box-h` FLOOR. Before this file there was NO text-fitting code
 * anywhere in `src/` (`grep -rln "useFitText|fitText|autoFit|shrinkToFit"` →
 * 0 hits): every tile font was a fixed token, so any string one glyph longer
 * than the token allowed wrapped, on some device, forever.
 *
 * ONE RULE, TWO HALVES, expressed as a single per-tile multiplier
 * `--tile-fit-scale` that `src/index.css` § "TILE PRIMITIVE" multiplies into
 * every tier's `font-size` (and its absolute `line-height`s):
 *
 *   FIT   a label never wraps. When it is wider than the space it may
 *         occupy, the font shrinks — down to `--tile-font-floor` (default
 *         0.8 × `--tile-font`) and no further. Only at the floor does the
 *         tile release `white-space: nowrap` and wrap, which is exactly the
 *         order he asked for ("shrinking … is preferred").
 *   FILL  when the tile's bank/grid has spare vertical room in the stage,
 *         the font grows — up to `--tile-font-ceiling` (default 1.25 ×
 *         `--tile-font`) and no further, and never far enough to push the
 *         stage into overflow ("we can fill up to a certain size").
 *
 * Both bounds are TOKENS, dialled per tier on `/:lang/qa/tiles`
 * (`tileSizingTokens.ts`) — the floor is the "how small is too small"
 * question only he can answer. They are stated in px against the PLAIN TILE
 * (`--tile-font`) and converted here into one ratio pair that every tier
 * inherits, which is the same scale-off-the-plain-tile model the rest of the
 * block uses (Spencer 2026-09-15: "they can scale off the plain tile").
 *
 * WHY NOT PURE CSS. `text-wrap: nowrap` plus container-query units can size a
 * box to its container, but nothing in CSS can size text to its *own*
 * measured advance width — `clamp()` off `cqi` needs a glyph count, and a
 * glyph count is a lie for ruby (the `<rt>` is frequently wider than the
 * kanji run it annotates) and for mixed kana/kanji/latin. So the width half
 * is measured, once per layout, batched.
 *
 * WHY MEASURED, NOT COMPUTED. Chromium and Playwright WebKit both rendered
 * #156's grid on ONE line at 430×932 while his phone wrapped it at 4 glyphs —
 * the third time in one pull that the emulator lied about phone layout (b20
 * §4B). Measured on the 15 Pro Max simulator 2026-09-15, the missing variable
 * was the ACCESSIBILITY FONT SCALE (`settings.accessibility.fontSize`, 85–140%,
 * multiplied onto the root font in `ThemeContext`): at 100% the option grid is
 * 30px and ばんごはん is 150px of ink in a 192px tile; at 125% the same tier is
 * `1.875rem` = 37.5px, 188px of ink in a 186px tile, and 2 of 4 options wrap —
 * his screenshot, reproduced. It is NOT WKWebView text inflation: Tailwind's
 * preflight ships `-webkit-text-size-adjust: 100%` (verified in the served
 * CSS). This is why the rule reads the tile's OWN computed font and its OWN
 * laid-out ink instead of a token and a glyph count: it holds at every root
 * size, at every zoom, in every engine, including the ones we cannot run here.
 *
 * WHAT FILL IS ALLOWED TO SPEND: measured px, and only px that are provably on
 * screen — `--stage-h` if the shell publishes one, else `visualViewport` minus
 * the shell's bottom safe-area padding, capped by the geometric slack. NEVER
 * `cqh`, `vh`/`dvh` or the scroller's self-reported height: three height units
 * are live in the lesson shell at once and the stage's box over-reports on the
 * founder's phone by ~200px (#157/#161), so a budget in any of them grows
 * tiles into space that does not exist. With no px source, FILL is a no-op.
 *
 * NO LAYOUT THRASH. One pass per layout, batched: every read happens first
 * (one forced layout), every write second, so N tiles cost one reflow, not N.
 * The pass is scheduled on a microtask — after React's layout effects, before
 * paint — so a tile never paints unscaled and then jumps.
 */

/** Fallbacks when the tokens are missing (SSR, a stripped stylesheet, a test
 *  harness with no CSS): the shipped defaults, so the ratios are never 0. */
export const DEFAULT_FIT_FLOOR_RATIO = 0.8;
export const DEFAULT_FILL_CEILING_RATIO = 1.25;

/** Scale steps. Quantising kills the ±0.3px jitter loop a ResizeObserver can
 *  otherwise sustain (write → resize → read → write …). */
const SCALE_STEP = 0.01;
/** Growth has to be worth a reflow; shrink is applied as soon as it is real.
 *  The asymmetry is the hysteresis that stops a grow/wrap/shrink limit cycle. */
const FILL_GROW_EPSILON = 0.03;
const FILL_SHRINK_EPSILON = 0.01;
/** Sub-pixel headroom on the width fit, so an exact-fit label cannot tip into
 *  an overflow on a device whose rounding differs from ours. */
const FIT_SAFETY_PX = 1;
/** Never spend the last few px of free space — sub-pixel rounding, a scrollbar
 *  gutter appearing, a font swapping late. */
const FILL_SAFETY_PX = 6;
/** A group may re-negotiate its fill this many times per layout generation
 *  before it is frozen. Bounded work, and a hard stop on any cycle the
 *  hysteresis above fails to damp. */
const FILL_MAX_MOVES = 12;
/** Passes allowed inside one animation frame before the rest defer to rAF. */
const MAX_PASSES_PER_FRAME = 8;

/* ════════════════════════════════════════════════════════════════════
   The arithmetic — pure, exported, unit-tested. No DOM below this line
   until the controller.
   ════════════════════════════════════════════════════════════════════ */

/** Round DOWN to a scale step: never round a tile INTO an overflow. */
export function quantizeScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.floor(scale / SCALE_STEP + 1e-9) * SCALE_STEP;
}

/**
 * How far the label may scale before it is wider than the room it has.
 * `Infinity` when there is nothing to measure (empty tile, unmeasured box in
 * a headless test) — an unmeasurable tile must never be shrunk.
 */
export function computeWidthRatio(naturalWidth: number, usableWidth: number): number {
  if (!(naturalWidth > 0) || !Number.isFinite(naturalWidth)) return Infinity;
  if (!(usableWidth > 0) || !Number.isFinite(usableWidth)) return Infinity;
  return usableWidth / naturalWidth;
}

export type FillInput = {
  /** Free vertical px in the stage that this group could grow into. */
  freeHeight: number;
  /** The group's current height. */
  groupHeight: number;
  /** The fill scale currently applied to the group's tiles. */
  currentFill: number;
  ceilingRatio: number;
  safetyPx?: number;
};

/**
 * The group's new ABSOLUTE fill scale.
 *
 * Read relative to what is on screen right now: `freeHeight` is what is left
 * over AFTER the current fill, so the growth factor is applied on top of the
 * current scale and the loop settles at free ≈ 0 (or at the ceiling). The
 * height model is linear — "a group that is 20% taller costs 20% more room" —
 * which UNDER-spends the budget in practice, because a tile's padding and its
 * `--tile-box-h` floor do not grow with the word. Under-spending is the safe
 * direction; the overflow backoff in the controller covers the other one.
 *
 * Never below 1: shrinking is FIT's job, and a group with no room simply
 * keeps the size the founder dialled.
 */
export function computeFillScale({
  freeHeight,
  groupHeight,
  currentFill,
  ceilingRatio,
  safetyPx = FILL_SAFETY_PX,
}: FillInput): number {
  const base = Number.isFinite(currentFill) && currentFill > 0 ? currentFill : 1;
  if (!(groupHeight > 0) || !Number.isFinite(groupHeight)) return clampFill(base, ceilingRatio);
  const usable = freeHeight - safetyPx;
  const growth = (groupHeight + usable) / groupHeight;
  if (!Number.isFinite(growth)) return clampFill(base, ceilingRatio);
  const next = base * growth;
  if (next > base && next - base < FILL_GROW_EPSILON) return clampFill(base, ceilingRatio);
  if (next < base && base - next < FILL_SHRINK_EPSILON) return clampFill(base, ceilingRatio);
  return clampFill(quantizeScale(next), ceilingRatio);
}

function clampFill(value: number, ceilingRatio: number): number {
  const ceiling = Number.isFinite(ceilingRatio) && ceilingRatio >= 1 ? ceilingRatio : 1;
  return Math.min(Math.max(value, 1), ceiling);
}

export type TileScaleInput = {
  /** `computeWidthRatio` for this tile. */
  widthRatio: number;
  /** `computeFillScale` for this tile's group (≥ 1). */
  fillScale: number;
  floorRatio: number;
  ceilingRatio: number;
};

export type TileScale = {
  /** The multiplier written to `--tile-fit-scale`. */
  scale: number;
  /** True when the label STILL does not fit at the floor — the one case where
   *  the tile is allowed to wrap. */
  atFloor: boolean;
};

/**
 * The whole rule in four lines: take the smaller of "what the width allows"
 * and "what the free space affords", hold it between the floor and the
 * ceiling, and report whether we bottomed out.
 */
export function resolveTileScale({
  widthRatio,
  fillScale,
  floorRatio,
  ceilingRatio,
}: TileScaleInput): TileScale {
  const floor = Number.isFinite(floorRatio) && floorRatio > 0 ? Math.min(floorRatio, 1) : DEFAULT_FIT_FLOOR_RATIO;
  const ceiling = Number.isFinite(ceilingRatio) && ceilingRatio >= 1 ? ceilingRatio : 1;
  const fill = Number.isFinite(fillScale) && fillScale > 0 ? fillScale : 1;
  const wanted = Math.min(widthRatio, fill);
  const scale = Math.min(Math.max(quantizeScale(wanted), floor), ceiling);
  return { scale, atFloor: widthRatio < floor };
}

/* ════════════════════════════════════════════════════════════════════
   The controller — DOM, batched. One registry, one observer, one pass.
   ════════════════════════════════════════════════════════════════════ */

/** What the primitive tells the pass about a tile. */
export type TileFitOptions = {
  /**
   * `false` for a tile whose width is set by its own box (an option or match
   * grid cell): it may only ever shrink to fit. `true` for a bank/tray tile
   * that hugs its content (build, listen) — those may grow up to the width of
   * the row they sit in, because growing them widens the TILE, not the text
   * inside a fixed box.
   */
  hugsContent: boolean;
  /** Whether this tile participates in FILL at all (match does not: its grid
   *  is height-capped by `--match-tile-h`, and the b17 dial-in of that token
   *  is the founder's, not ours — #157). */
  fill: boolean;
};


type TileRecord = TileFitOptions & {
  scale: number;
  atFloor: boolean;
  /** Natural single-line width at scale 1, and the key it was measured for. */
  natural: number;
  naturalKey: string;
};

type StageRecord = {
  key: string;
  fill: number;
  moves: number;
};

const tiles = new Map<HTMLElement, TileRecord>();
const stages = new WeakMap<HTMLElement, StageRecord>();

let observer: ResizeObserver | null = null;
let observed = new WeakSet<Element>();
let scheduled = false;
let rafScheduled = false;
let passesThisFrame = 0;
let installed = false;

const canMeasure = () =>
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  typeof window.getComputedStyle === "function";

function install() {
  if (installed || !canMeasure()) return;
  installed = true;
  window.addEventListener("resize", scheduleTileFitPass, { passive: true });
  window.addEventListener("orientationchange", scheduleTileFitPass, { passive: true });
  // A late webfont swap changes every advance width on the screen.
  const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
  if (fonts?.ready && typeof fonts.ready.then === "function") {
    void fonts.ready.then(() => scheduleTileFitPass()).catch(() => {});
  }
}

function ensureObserver(): ResizeObserver | null {
  if (typeof ResizeObserver === "undefined") return null;
  observer ??= new ResizeObserver(() => scheduleTileFitPass());
  return observer;
}

function observe(el: Element | null | undefined) {
  if (!el || observed.has(el)) return;
  const ro = ensureObserver();
  if (!ro) return;
  observed.add(el);
  ro.observe(el);
}

/**
 * Idempotent by design: the primitive calls this after EVERY render (a tile's
 * children change far more often than its identity), so a repeat call only
 * refreshes the options — it must not re-write the element's style, or every
 * re-render would dirty a style the pass has already settled.
 */
export function registerTile(el: HTMLElement, opts: TileFitOptions): void {
  install();
  const prev = tiles.get(el);
  if (prev) {
    prev.hugsContent = opts.hugsContent;
    prev.fill = opts.fill;
    scheduleTileFitPass();
    return;
  }
  tiles.set(el, { ...opts, scale: 1, atFloor: false, natural: 0, naturalKey: "" });
  // Written before the first measurement so a tile never paints without a
  // value, and `data-tile-fit` is what turns `white-space: nowrap` ON: the
  // CSS default is today's wrapping behaviour, so a tile that never reaches
  // this line looks exactly like it did before this rule existed.
  el.style.setProperty("--tile-fit-scale", "1");
  el.dataset.tileFit = "fit";
  observe(el);
  // The stage's height is the FILL budget; a tile is the only thing that can
  // tell us where its stage is.
  observe(scrollerFor(el));
  scheduleTileFitPass();
}

export function unregisterTile(el: HTMLElement): void {
  tiles.delete(el);
  if (observer && observed.has(el)) {
    observed.delete(el);
    observer.unobserve(el);
  }
}

/**
 * Queue one pass. A microtask, not a frame: React has just run its layout
 * effects, the DOM is final, and nothing has painted yet — so the first paint
 * already carries the right size. Falls back to rAF once a frame has spent
 * its pass budget, which is the hard stop on any observer feedback loop.
 */
export function scheduleTileFitPass(): void {
  if (!canMeasure() || tiles.size === 0) return;
  if (scheduled || rafScheduled) return;
  if (passesThisFrame >= MAX_PASSES_PER_FRAME) {
    rafScheduled = true;
    requestAnimationFrame(() => {
      rafScheduled = false;
      passesThisFrame = 0;
      runTileFitPass();
    });
    return;
  }
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    passesThisFrame += 1;
    runTileFitPass();
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        passesThisFrame = 0;
      });
    } else {
      passesThisFrame = 0;
    }
  });
}

const num = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** The ratio pair, read off the tile itself so it works wherever the tokens
 *  are defined (`:root`, or the QA frame's own wrapper). */
export function readFitRatios(cs: CSSStyleDeclaration): { floorRatio: number; ceilingRatio: number } {
  const base = num(cs.getPropertyValue("--tile-font"));
  const floor = num(cs.getPropertyValue("--tile-font-floor"));
  const ceiling = num(cs.getPropertyValue("--tile-font-ceiling"));
  if (!(base > 0)) return { floorRatio: DEFAULT_FIT_FLOOR_RATIO, ceilingRatio: DEFAULT_FILL_CEILING_RATIO };
  return {
    floorRatio: floor > 0 ? Math.min(floor / base, 1) : DEFAULT_FIT_FLOOR_RATIO,
    ceilingRatio: ceiling > 0 ? Math.max(ceiling / base, 1) : DEFAULT_FILL_CEILING_RATIO,
  };
}

/**
 * The label's laid-out width, ruby and all.
 *
 * A Range over the tile's contents, not a canvas `measureText`: the tile's
 * children are ruby (an `<rt>` is frequently wider than its kanji run), a kana
 * span that grows itself by `--tile-kana-font`, sometimes an icon. Only the
 * engine knows how wide that is, and the Range's own bounding box is exactly
 * what the engine laid out. `white-space: nowrap` is on while this runs, so
 * the contents are on ONE line and that box IS the single-line width.
 */
function measureNaturalWidth(el: HTMLElement): number {
  const doc = el.ownerDocument;
  if (!doc || typeof doc.createRange !== "function" || !el.firstChild) return 0;
  try {
    const range = doc.createRange();
    range.selectNodeContents(el);
    const rect = range.getBoundingClientRect();
    return rect && Number.isFinite(rect.width) ? rect.width : 0;
  } catch {
    return 0;
  }
}

/** The bank/tray/grid the tile lives in: the width a content-hugging tile may
 *  grow into, and the unit whose height the FILL budget is spent on. */
function groupOf(el: HTMLElement): HTMLElement | null {
  return el.closest<HTMLElement>("[data-tile-tray]") ?? el.parentElement;
}

/** The lesson stage — FILL happens only inside one. Outside it (the tile QA
 *  page's fixtures, any future embed) a tile keeps the size the tokens say,
 *  which is what makes the QA page's numbers mean what they show. */
function stageOf(el: HTMLElement): HTMLElement | null {
  return el.closest<HTMLElement>("[data-lesson-stage]");
}

/** The scroller whose overflow the fill must never cause. */
function scrollerFor(el: HTMLElement): HTMLElement | null {
  return stageOf(el)?.parentElement ?? null;
}

/** A stable per-pass identity for a tray, so cohorts never span two of them. */
const groupIds = new WeakMap<HTMLElement, number>();
let nextGroupId = 1;
function groupId(el: HTMLElement | null): number {
  if (!el) return 0;
  let id = groupIds.get(el);
  if (id === undefined) {
    id = nextGroupId++;
    groupIds.set(el, id);
  }
  return id;
}

function innerWidthOf(el: HTMLElement | null): number {
  if (!el) return 0;
  const cs = getComputedStyle(el);
  return el.clientWidth - num(cs.paddingLeft) - num(cs.paddingRight);
}

/**
 * Unused vertical px inside one container: the gap above the first child, the
 * gap below the last, and any gap between two children BEYOND the container's
 * own `row-gap` (designed spacing is not free space — an `mt-auto` band is).
 *
 * Purely geometric, so it reads auto margins, `justify-content` distribution
 * and sticky offsets correctly. A container whose children overlap vertically
 * (a wrapping bank, a 2-column grid, the tray's layered rows) reports 0: its
 * free space, if it has any, belongs to an ancestor level.
 */
export function columnSlack(parent: HTMLElement): number {
  const kids = Array.from(parent.children) as HTMLElement[];
  if (kids.length === 0) return 0;
  const cs = getComputedStyle(parent);
  if (cs.display === "none") return 0;
  const box = parent.getBoundingClientRect();
  const top = box.top + num(cs.borderTopWidth) + num(cs.paddingTop);
  const bottom = box.bottom - num(cs.borderBottomWidth) - num(cs.paddingBottom);
  if (!(bottom > top)) return 0;
  const rects = kids
    .map((k) => k.getBoundingClientRect())
    .filter((r) => r.height > 0 || r.width > 0)
    .sort((a, b) => a.top - b.top);
  if (rects.length === 0) return 0;
  const rowGap = num(cs.rowGap); // `normal` → 0, which is what a block is
  let slack =
    Math.max(0, rects[0].top - top) + Math.max(0, bottom - rects[rects.length - 1].bottom);
  for (let i = 1; i < rects.length; i += 1) {
    if (rects[i].top < rects[i - 1].bottom - 0.5) return 0; // not a single column
    slack += Math.max(0, rects[i].top - rects[i - 1].bottom - rowGap);
  }
  return slack;
}

/**
 * Free vertical space a group can grow into, walking from the group up to the
 * lesson stage's scroller.
 *
 * SUMMED, not min()'d: a `flex-1` wrapper that already fills its parent has
 * zero slack of its own while holding all the slack INSIDE it, so a `min`
 * reads 0 on every real step column. Growth is absorbed by the first ancestor
 * with room and never reaches the ones above it, so the sum double-counts
 * nothing. (Measured on the #152 screen: 258px, which is the two dead bands
 * that complaint is about.)
 */
export function freeHeightFor(group: HTMLElement): number {
  let free = 0;
  let node: HTMLElement = group;
  for (let depth = 0; depth < 10; depth += 1) {
    const parent = node.parentElement;
    if (!parent) break;
    free += columnSlack(parent);
    if (parent.hasAttribute("data-lesson-stage")) {
      if (parent.parentElement) free += columnSlack(parent.parentElement);
      break;
    }
    node = parent;
  }
  return free;
}

/**
 * A CSS length that is measured PX and nothing else. `vh`, `dvh`, `cqh`, `%`
 * and bare numbers are rejected on purpose: the whole point of the budget
 * below is that FILL may only spend px that are provably on screen, and every
 * one of those units is a unit that lies on this device (b20 §4B, #157/#161 —
 * three height units live in the lesson shell at once, and the stage's box
 * over-reports on the founder's phone).
 */
export function pxToken(raw: string): number | null {
  const v = raw.trim();
  if (!/^-?\d*\.?\d+px$/.test(v)) return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * The lowest y a tile block may reach — in px, in `getBoundingClientRect`
 * coordinates. FILL spends the gap between the content and THIS line, not the
 * scroller's self-reported height.
 *
 * Two sources, in order:
 *   1. `--stage-h` — a px height published by the lesson shell (the
 *      stage-height lane's contract: `visualViewport`, minus safe areas and
 *      the top bar). If it is ever published in `vh`/`dvh`/`cqh`, `pxToken`
 *      rejects it and we fall through, which is the safe direction.
 *   2. `window.visualViewport` — the px the engine says are actually visible,
 *      minus the shell's own bottom safe-area padding. This is the same
 *      arithmetic option 1 would publish, done read-only so this lane does not
 *      touch the shell the #161 lane is working in.
 * `null` = neither is available (no visualViewport, no token) → FILL is a
 * NO-OP. It never falls back to `cqh`/`vh`/`scrollHeight`.
 */
function stageBudgetBottom(stage: HTMLElement): number | null {
  const stageH = pxToken(getComputedStyle(stage).getPropertyValue("--stage-h"));
  if (stageH !== null) return stage.getBoundingClientRect().top + stageH;
  const vv = typeof window !== "undefined" ? window.visualViewport : null;
  if (!vv || !(vv.height > 0)) return null;
  // The shell carries the bottom inset as `pb-safe`; the scroller's box is
  // already inside it, so subtracting it here is a second guard, not a
  // double-count — it only ever makes the budget smaller.
  const shell = stage.parentElement?.parentElement ?? null;
  const safeBottom = shell ? num(getComputedStyle(shell).paddingBottom) : 0;
  return vv.offsetTop + vv.height - safeBottom;
}

type TileCtx = {
  el: HTMLElement;
  rec: TileRecord;
  stage: HTMLElement | null;
  group: HTMLElement | null;
  /** Tiles that render at the same size must KEEP rendering at the same size
   *  — see `cohortKey`. */
  cohort: string;
  floorRatio: number;
  ceilingRatio: number;
  usable: number;
  natural: number;
};

/**
 * The uniformity cohort: one tray, one CSS tier.
 *
 * MultipleChoiceStepView has carried this rule since 2026-05-17 in prose —
 * "one uniform display size picked by the longest option", written after a
 * 2-mora option rendered at text-5xl beside its text-xl siblings and "tiles
 * looked broken" — and Spencer restated it as #137 ("the height of every tile
 * should be the same"). A per-tile fit would re-introduce exactly that, one
 * grid at a time, so the width cap is taken as the MINIMUM over the cohort:
 * the longest label decides, and its siblings follow it.
 *
 * Keyed on the attributes the CSS itself selects on, so two tiles are in one
 * cohort only if they really do resolve to the same font-size rule.
 */
function cohortKey(el: HTMLElement): string {
  const d = el.dataset;
  return [d.variant, d.size ?? "", d.side ?? "", d.density ?? "", d.text ?? "", d.slot ?? ""].join("|");
}

/**
 * ONE pass: read every tile, decide one FILL per stage, write the scales.
 *
 * The fill is per STAGE, not per bank, on purpose: a build step shows a tray
 * and a bank at once, and Spencer's #137 ruling is that "the height of every
 * tile should be the same" across them. Two independently-negotiated banks
 * would break that the first time one of them had a millimetre less room.
 */
export function runTileFitPass(): void {
  if (!canMeasure() || tiles.size === 0) return;

  /* ── READ ─────────────────────────────────────────────────────────── */
  const ctxs: TileCtx[] = [];
  const stageGroups = new Map<HTMLElement, Set<HTMLElement>>();

  for (const [el, rec] of tiles) {
    if (!el.isConnected) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none") continue;
    // The word-build pill's zero-width pre-sizer: no width to fit into, and
    // fitting it would collapse the row height it exists to reserve.
    if (el.dataset.collapsed === "true") continue;

    const { floorRatio, ceilingRatio } = readFitRatios(cs);
    const group = groupOf(el);
    const stage = rec.fill ? stageOf(el) : null;
    if (stage && group) {
      const set = stageGroups.get(stage) ?? new Set<HTMLElement>();
      set.add(group);
      stageGroups.set(stage, set);
    }

    // A content-hugging tile (a build/listen bank or tray tile) is as wide as
    // its own word, so its box can never report room to grow — the ROW is its
    // constraint. A fixed-width tile (an option or match grid cell) is the
    // opposite: its box is the whole budget.
    const own = el.clientWidth - num(cs.paddingLeft) - num(cs.paddingRight);
    const row = rec.hugsContent
      ? innerWidthOf(group) - (el.offsetWidth - el.clientWidth) - num(cs.paddingLeft) - num(cs.paddingRight)
      : 0;
    ctxs.push({
      el,
      rec,
      stage,
      group,
      cohort: cohortKey(el),
      floorRatio,
      ceilingRatio,
      usable: Math.max(own, row) - FIT_SAFETY_PX,
      natural: naturalWidthAtScaleOne(el, rec, cs),
    });
  }

  const fills = new Map<HTMLElement, number>();
  for (const [stage, groupSet] of stageGroups) {
    fills.set(stage, planStageFill(stage, groupSet, ctxs));
  }

  // One width cap per cohort — the longest label in a tray's tier decides for
  // every tile in it (see `cohortKey`).
  const caps = new Map<string, number>();
  for (const ctx of ctxs) {
    const key = `${groupId(ctx.group)}|${ctx.cohort}`;
    const ratio = computeWidthRatio(ctx.natural, ctx.usable);
    const prev = caps.get(key);
    if (prev === undefined || ratio < prev) caps.set(key, ratio);
  }

  /* ── WRITE ────────────────────────────────────────────────────────── */
  for (const ctx of ctxs) {
    const fillScale = ctx.stage ? (fills.get(ctx.stage) ?? 1) : 1;
    const next = resolveTileScale({
      widthRatio: caps.get(`${groupId(ctx.group)}|${ctx.cohort}`) ?? Infinity,
      fillScale,
      floorRatio: ctx.floorRatio,
      ceilingRatio: ctx.ceilingRatio,
    });
    if (Math.abs(next.scale - ctx.rec.scale) < SCALE_STEP / 2 && next.atFloor === ctx.rec.atFloor) {
      continue;
    }
    ctx.rec.scale = next.scale;
    ctx.rec.atFloor = next.atFloor;
    ctx.el.style.setProperty("--tile-fit-scale", String(round3(next.scale)));
    ctx.el.dataset.tileFit = next.atFloor ? "floor" : "fit";
  }
}

/**
 * Natural single-line width at scale 1, cached against the text and the
 * tier's own font size so a QA-page slider invalidates it. The cache is what
 * lets a tile that has RELEASED nowrap (`atFloor`, and therefore measures as
 * a wrapped block) still know how wide its label wants to be, and so climb
 * back out when the viewport widens.
 */
function naturalWidthAtScaleOne(
  el: HTMLElement,
  rec: TileRecord,
  cs: CSSStyleDeclaration,
): number {
  const applied = rec.scale > 0 ? rec.scale : 1;
  const fontPx = num(cs.fontSize);
  const key = `${el.textContent ?? ""}|${round3(fontPx / applied)}|${cs.fontFamily}|${cs.fontWeight}|${cs.letterSpacing}`;
  if (rec.atFloor && rec.naturalKey === key && rec.natural > 0) return rec.natural;
  const measured = measureNaturalWidth(el);
  if (measured > 0) {
    rec.natural = measured / applied;
    rec.naturalKey = key;
  }
  return rec.natural;
}

/** One FILL decision per stage per pass, with the overflow backoff. */
function planStageFill(
  stage: HTMLElement,
  groupSet: Set<HTMLElement>,
  ctxs: TileCtx[],
): number {
  const scroller = stage.parentElement;
  const groupList = [...groupSet];
  const key = `${scroller?.clientHeight ?? 0}x${Math.round(stage.clientWidth)}x${ctxs.length}`;
  let rec = stages.get(stage);
  if (!rec || rec.key !== key) {
    rec = { key, fill: rec?.fill ?? 1, moves: 0 };
    stages.set(stage, rec);
  }

  const groupHeight = groupList.reduce((sum, g) => sum + g.getBoundingClientRect().height, 0);
  // The VISIBLE floor, in px (see `stageBudgetBottom`). No budget → no fill.
  const budgetBottom = stageBudgetBottom(stage);
  const contentBottom = Math.max(
    ...groupList.map((g) => g.getBoundingClientRect().bottom),
    stage.getBoundingClientRect().bottom,
  );
  // `scrollHeight` is used ONLY as an overflow DETECTOR here — "this scroller
  // is actually scrolling", which is a defect on a fitted shell — never as a
  // height to spend. The px over-reach below is the other half of the trigger,
  // and the only one that catches a stage whose box extends past the screen.
  const scrolling = scroller ? scroller.scrollHeight - scroller.clientHeight : 0;
  const overReach = budgetBottom === null ? 0 : Math.max(0, contentBottom - budgetBottom);
  const overflow = Math.max(scrolling, overReach);

  let fill: number;
  if (overflow > 1 && rec.fill > 1) {
    // THE STAGE IS OVERFLOWING AND WE GREW IT. Give the room back — measured,
    // not by a fixed step, so it lands in one pass instead of five: the same
    // linear height model as the growth, run backwards. This branch is checked
    // FIRST and is never frozen (it only ever decreases, so it cannot cycle);
    // an earlier version checked the freeze first and left a stage parked at
    // fill 1.11 with 79px of overflow at 375x667 — measured, and the reason
    // this is written the way it is.
    const factor = groupHeight > 0 ? Math.max(0.5, (groupHeight - overflow) / groupHeight) : 0.9;
    fill = Math.max(1, round3(Math.min(rec.fill * factor, rec.fill - SCALE_STEP)));
  } else if (rec.moves >= FILL_MAX_MOVES) {
    fill = rec.fill; // frozen for this layout generation
  } else if (overflow > 1) {
    // Overflowing at fill 1 — this step simply does not fit, which is a
    // different lane's problem (the stage-height chain, #157/#161). Do not
    // make it worse.
    fill = 1;
  } else if (budgetBottom === null) {
    // No px budget to spend (no visualViewport, no `--stage-h`): FILL is off.
    fill = 1;
  } else {
    // Conservative on every term: the SMALLEST free-space reading any group
    // reports, capped by the px distance to the VISIBLE floor, against the SUM
    // of every group's height (the tray's layered ghost row counts twice on
    // purpose — over-stating the cost under-spends the budget, and
    // under-spending is the safe direction).
    const slack = Math.min(...groupList.map((g) => freeHeightFor(g)));
    const visible = budgetBottom - contentBottom;
    const free = Math.min(slack, Math.max(0, visible));
    const ceilingRatio = ctxs.find((c) => c.stage === stage)?.ceilingRatio ?? DEFAULT_FILL_CEILING_RATIO;
    fill = computeFillScale({
      freeHeight: Number.isFinite(free) ? free : 0,
      groupHeight,
      currentFill: rec.fill,
      ceilingRatio,
    });
  }
  // Only GROWTH counts toward the freeze: a decrease is monotonic and safe.
  if (fill - rec.fill > SCALE_STEP / 2) rec.moves += 1;
  rec.fill = fill;
  return fill;
}

/** Test seam: forget every registration and every cached decision. */
export function __resetTileFitForTests(): void {
  tiles.clear();
  observer?.disconnect();
  observer = null;
  observed = new WeakSet<Element>();
  scheduled = false;
  rafScheduled = false;
  passesThisFrame = 0;
}
