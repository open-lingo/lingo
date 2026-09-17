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
/**
 * How much measured, on-screen slack under the content it takes before a
 * stage is allowed to RELEASE its anti-flicker cap once (see `StageRecord.cap`
 * and `releases`). Four times `FILL_SAFETY_PX`: the flicker the cap exists to
 * stop is a stage oscillating around ZERO slack, so a stage sitting on tens of
 * spare pixels is not that stage — it is a stage still paying for an overflow
 * that has since gone away.
 */
const CAP_RELEASE_SLACK_PX = 24;
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
  /** How far FILL may shrink an OVERFLOWING stage. Defaults to 1 (grow-only,
   *  the pre-2026-09-16 behaviour). */
  floorRatio?: number;
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
 * FILL WORKS BOTH WAYS (2026-09-16, Class E / T4+T6). It used to refuse to go
 * below 1 — "shrinking is FIT's job" — which is true for a label that is too
 * WIDE and false for a stage that is too TALL: 8 of the 25 routes measured on
 * the 15 Pro Max scrolled at 125% (up to 234px on a 27-tile bank at 140%) and
 * FILL sat at exactly 1.0 watching it, because the one branch that could give
 * room back was gated on `rec.fill > 1`. Spencer, #89: "there should be no
 * scroll here." The floor is the SAME `--tile-font-floor` FIT bottoms out at,
 * so no tile is ever smaller than the size he dialled as "too small".
 */
export function computeFillScale({
  freeHeight,
  groupHeight,
  currentFill,
  ceilingRatio,
  floorRatio = 1,
  safetyPx = FILL_SAFETY_PX,
}: FillInput): number {
  const base = Number.isFinite(currentFill) && currentFill > 0 ? currentFill : 1;
  if (!(groupHeight > 0) || !Number.isFinite(groupHeight)) return clampFill(base, ceilingRatio, floorRatio);
  const usable = freeHeight - safetyPx;
  const growth = (groupHeight + usable) / groupHeight;
  if (!Number.isFinite(growth)) return clampFill(base, ceilingRatio, floorRatio);
  const next = base * growth;
  if (next > base && next - base < FILL_GROW_EPSILON) return clampFill(base, ceilingRatio, floorRatio);
  if (next < base && base - next < FILL_SHRINK_EPSILON) return clampFill(base, ceilingRatio, floorRatio);
  return clampFill(quantizeScale(next), ceilingRatio, floorRatio);
}

/** `floorRatio` defaults to 1, so every caller that has not opted into the
 *  shrink half behaves exactly as it did before it existed. A ceiling BELOW 1
 *  is legal and load-bearing: `planStageFill` caps a stage it has caught
 *  overflowing, and that cap has to survive the clamp or the stage grows
 *  straight back into the overflow it just escaped. */
function clampFill(value: number, ceilingRatio: number, floorRatio = 1): number {
  const floor = Number.isFinite(floorRatio) && floorRatio > 0 ? Math.min(floorRatio, 1) : 1;
  const raw = Number.isFinite(ceilingRatio) && ceilingRatio > 0 ? ceilingRatio : 1;
  const ceiling = Math.max(raw, floor);
  return Math.min(Math.max(value, floor), ceiling);
}

export type TileScaleInput = {
  /** `computeWidthRatio` for this tile. */
  widthRatio: number;
  /** `computeFillScale` for this tile's group (≥ 1). */
  fillScale: number;
  floorRatio: number;
  ceilingRatio: number;
  /**
   * The floor the STAGE-FILL half may shrink to, which is not the same number
   * as the width-fit floor once the accessibility slider is above 100% — see
   * `readFitRatios`. Defaults to `floorRatio`, which is what it was before the
   * slider reached tile type at all.
   */
  fillFloorRatio?: number;
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
  fillFloorRatio,
}: TileScaleInput): TileScale {
  const floor = Number.isFinite(floorRatio) && floorRatio > 0 ? Math.min(floorRatio, 1) : DEFAULT_FIT_FLOOR_RATIO;
  const ceiling = Number.isFinite(ceilingRatio) && ceilingRatio >= 1 ? ceilingRatio : 1;
  const fill = Number.isFinite(fillScale) && fillScale > 0 ? fillScale : 1;
  // EACH HALF IS HELD BY ITS OWN FLOOR (2026-09-16, phase 2B). They are the
  // same number until the accessibility slider goes above 100%, and then they
  // are not, because they answer different questions:
  //   the WIDTH floor  — "how small may a label shrink rather than WRAP".
  //     The slider raises it: a user at 125% asked for bigger text, and a tile
  //     with room should honour that even if it then wraps.
  //   the FILL floor   — "how small may everything shrink rather than SCROLL".
  //     The slider does NOT raise it: scrolling is the worse outcome (#89), so
  //     a full stage may still come all the way down to the px Spencer dialled.
  // Clamping one `min(width, fill)` with one floor cannot express that — it
  // gives the width floor to the fill half (an overflowing stage that cannot
  // shrink: measured 232px on `es-m34-10?step=4` at 125%) or the fill floor to
  // the width half (a label that shrinks past "too small" to avoid a wrap).
  const fillFloor =
    Number.isFinite(fillFloorRatio) && (fillFloorRatio as number) > 0
      ? Math.min(fillFloorRatio as number, floor)
      : floor;
  const widthCap = Number.isFinite(widthRatio)
    ? Math.max(quantizeScale(widthRatio), floor)
    : Infinity;
  const fillCap = Math.max(quantizeScale(fill), fillFloor);
  const scale = Math.min(widthCap, fillCap, ceiling);
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
  /** Whether this tile participates in FILL at all. */
  fill: boolean;
  /**
   * May FILL GROW this tile, or only shrink it? (Default `true`.)
   *
   * `false` is the match variant, and it is two rulings at once. Growing a
   * match label is the regression Spencer reported (#157): its grid is
   * height-capped by `--match-tile-h`, which is his own b17 dial-in, and a
   * bigger label inside a fixed card is what "the tile sizing regressed"
   * meant. But SHRINKING it is #89, and phase 2B measured what excluding
   * match from FILL entirely costs: `ja-m3-neo-5?step=23` at 125% put the
   * English gloss on three lines, the grid's min-content rows burst the
   * `--match-tile-h` ceiling and the step overflowed by 103px with rows
   * ragged by 30% — with nothing able to give the row back, because the one
   * mechanism that can was switched off for the whole variant.
   *
   * So the exclusion is now one-directional: match is in the shrink half and
   * out of the grow half. A stage whose tiles are ALL shrink-only takes
   * ceiling 1 in `planStageFill`, so `rec.fill` never climbs above 1 and the
   * shrink branch starts from where it actually is.
   */
  fillGrow?: boolean;
  /**
   * Whether this tile belongs to a cohort that must render ONE box height
   * (#137). True for build/listen, where the pass publishes `--tile-row-h`;
   * false for match (a grid row owns its height) and option (`auto-rows-fr`
   * already equalises the cells, and a `min-height` there is not inert — see
   * the note on the rule in `index.css`). Optional, default `false`: a caller
   * that does not know about the row rule gets exactly today's behaviour.
   */
  uniformHeight?: boolean;
  /**
   * PROSE (`false`) vs LABEL (`true`, the default).
   *
   * A label is one unbreakable thing: it holds `white-space: nowrap`, shrinks
   * to the floor, and only then releases and wraps. Prose is a paragraph: it
   * may always wrap, and shrinking it just buys fewer lines.
   *
   * The distinction is not cosmetic, it is the difference between a fix and a
   * regression. Measured on the 15 Pro Max 2026-09-16, with the prose tier on
   * the label path: `es-m34-10?step=4`'s four Spanish sentence options stopped
   * wrapping and rendered as ONE line **cut off at the tile edge** ("me duelen
   * los ojos — ter|") in a 178px-tall box. `atFloor` — the flag that releases
   * `nowrap` — never fired, because a `display: block` prose tile's Range
   * measures the BLOCK (192px), not the 600px of ink inside it, so the width
   * fit always reports "it fits". A tier whose own box defines the line width
   * can never be trusted to detect its own overflow, so it must never be given
   * nowrap in the first place.
   */
  nowrap?: boolean;
};


type TileRecord = Omit<TileFitOptions, "uniformHeight" | "nowrap" | "fillGrow"> & {
  uniformHeight: boolean;
  nowrap: boolean;
  fillGrow: boolean;
  scale: number;
  atFloor: boolean;
  /** Natural single-line width at scale 1, and the key it was measured for. */
  natural: number;
  naturalKey: string;
  /** Last `--tile-row-h` written, so a settled pass writes nothing. */
  rowH: number;
};

type StageRecord = {
  key: string;
  fill: number;
  moves: number;
  /**
   * The highest fill this stage may return to for this layout generation.
   * Set when a stage is found overflowing: without it the shrink half and the
   * grow half take turns (shrink -> fits -> grow -> overflows -> shrink) and
   * the stage flickers instead of settling.
   */
  cap: number;
  /**
   * How many times this layout generation has RELEASED its cap. Bounded at 1.
   *
   * 2A wrote the cap and 2A/2B both logged that it never lets go inside a
   * generation (2A §5.8, 2B §5.4): a stage caught overflowing ONCE — by a late
   * font, a late image, a tray ghost row that had not settled — stays capped
   * at the scale that fitted the transient, however much room it then has.
   * Measured on the 15 Pro Max, `ja-m34-neo-3?step=11` at 125%: word 19px with
   * 85px of visible slack under the bank, against 23px at 100% on a SMALLER
   * budget — i.e. the accessibility slider made the tiles smaller.
   *
   * The release is allowed exactly once and only on a stage that is (a) not
   * scrolling and (b) sitting on more than `CAP_RELEASE_SLACK_PX` of measured
   * on-screen slack. So the worst case is one extra grow→overflow→shrink
   * cycle, after which `releases` is spent and the cap is permanent for this
   * generation — the limit cycle the cap was written to stop cannot come back.
   */
  releases: number;
  /**
   * The grow half has run once and CHANGED NOTHING for this generation: the
   * stage has found its size. From here the grow branch is closed until the
   * generation changes (viewport, label set) or the cap is released — only
   * the shrink branch (a real scroll) may still move it, and it is monotonic.
   *
   * Why (#174, build 22): a tap that places a tile changes the tray's height
   * and therefore the stage's free space; re-running the grow half on that
   * new number gives a NEW fill, the tiles resize, the ResizeObserver fires,
   * the free space changes again… One pass per frame through the observer is
   * an alternate-frame flicker — which is what the founder's 120 Hz recording
   * shows (prompt + cluster ±33 CSS px on alternate frames, ~130 ms per tap).
   * A tile's size must not depend on where the OTHER tiles currently sit.
   */
  settled: boolean;
};

const tiles = new Map<HTMLElement, TileRecord>();
const stages = new WeakMap<HTMLElement, StageRecord>();
/**
 * THE SIZE A TILE JOINING AN ESTABLISHED COHORT IS BORN AT (build 25).
 *
 * Per stage, per `cohortKey`: the last scale/row-height/floor-state the pass
 * wrote. `registerTile` applies it to a NEW tile before that tile has ever
 * been measured or painted, which is the difference between a tile that
 * arrives at its cohort's size and a tile that arrives at scale 1 and is
 * corrected one frame later. The correction was measurable: a tile placed in
 * the tray mounted unscaled, its ink was read as a scale-1 natural, and
 * `--tile-row-h` (a MAX over the cohort) inflated for exactly one painted
 * frame — 15 Pro Max, `--simulate build`: rowH 53→80→53 at 125% (prompt
 * 5.4px) and 53.5→54→53.5 at 100% (prompt 1.2px). The lead's ruling after
 * #184/#185 is that nothing moves between the first tap and the last, and one
 * frame of 5.4px is a move.
 *
 * Stale is safe: a cohort whose viewport has changed hands the new tile a
 * size that is one pass out of date, which is what every OTHER tile in it is
 * rendering at anyway — and the pass that follows corrects all of them
 * together. Keyed on the stage element, so it dies with the step.
 */
const cohortSizes = new WeakMap<HTMLElement, Map<string, { scale: number; atFloor: boolean; rowH: number }>>();

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
    prev.uniformHeight = opts.uniformHeight === true;
    prev.nowrap = opts.nowrap !== false;
    prev.fillGrow = opts.fillGrow !== false;
    scheduleTileFitPass();
    return;
  }
  tiles.set(el, {
    ...opts,
    uniformHeight: opts.uniformHeight === true,
    nowrap: opts.nowrap !== false,
    fillGrow: opts.fillGrow !== false,
    scale: 1,
    atFloor: false,
    natural: 0,
    naturalKey: "",
    rowH: 0,
  });
  // Written before the first measurement so a tile never paints without a
  // value, and `data-tile-fit` is what turns `white-space: nowrap` ON: the
  // CSS default is today's wrapping behaviour, so a tile that never reaches
  // this line looks exactly like it did before this rule existed.
  //
  // The value is the COHORT's, not 1, when this tile is joining a cohort the
  // pass has already sized — see `cohortSizes`. Registration runs inside
  // React's layout effects, before paint, so a tile placed in the tray during
  // a build is born at the size its siblings render at instead of being
  // corrected a frame later.
  const rec = tiles.get(el)!;
  const born = cohortSizeFor(el);
  if (born) {
    rec.scale = born.scale;
    rec.atFloor = born.atFloor;
    el.style.setProperty("--tile-fit-scale", String(round3(born.scale)));
    if (rec.uniformHeight && born.rowH > 0) {
      rec.rowH = born.rowH;
      el.style.setProperty("--tile-row-h", `${born.rowH}px`);
    }
  } else {
    el.style.setProperty("--tile-fit-scale", "1");
  }
  el.dataset.tileFit =
    opts.nowrap === false ? "prose" : born?.atFloor ? "floor" : "fit";
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

/**
 * The ratio pair, read off the tile itself so it works wherever the tokens
 * are defined (`:root`, or the QA frame's own wrapper).
 *
 * PER TIER FIRST (2026-09-16, Class B). The pair used to be derived only from
 * `--tile-font` / `--tile-font-floor`, i.e. from the 18.3px BUILD tile, and
 * then applied as a bare ratio to tiers of wildly different absolute size: the
 * 30px MCQ `word` tier inherited a 24px floor (a 10-glyph single word cannot
 * reach it, so it wrapped instead — #156's shape), and the 22px prose tier
 * inherited a 17.6px floor it never used because it opted out of FIT entirely.
 * A tier may now state its OWN pair with `--fit-font` / `--fit-font-floor` /
 * `--fit-font-ceiling` (see `index.css` § option variant); anything that does
 * not falls back to the plain tile exactly as before, so build, listen and
 * match are byte-identical.
 */
export function readFitRatios(cs: CSSStyleDeclaration): {
  floorRatio: number;
  ceilingRatio: number;
  fillFloorRatio: number;
} {
  const tierBase = num(cs.getPropertyValue("--fit-font"));
  const base = tierBase > 0 ? tierBase : num(cs.getPropertyValue("--tile-font"));
  const floor = tierBase > 0
    ? num(cs.getPropertyValue("--fit-font-floor")) || base * DEFAULT_FIT_FLOOR_RATIO
    : num(cs.getPropertyValue("--tile-font-floor"));
  const ceilingRaw = tierBase > 0
    ? num(cs.getPropertyValue("--fit-font-ceiling"))
    : num(cs.getPropertyValue("--tile-font-ceiling"));
  // A tier that states its own floor but no ceiling keeps the PLAIN TILE's
  // growth ratio — the ceiling is a stage-fill policy ("how much bigger may a
  // tile get"), not a per-tier readability number, and Spencer dials one.
  const ceilingRatio = ceilingRaw > 0 && base > 0
    ? Math.max(ceilingRaw / base, 1)
    : plainCeilingRatio(cs);
  if (!(base > 0)) {
    return {
      floorRatio: DEFAULT_FIT_FLOOR_RATIO,
      ceilingRatio: DEFAULT_FILL_CEILING_RATIO,
      fillFloorRatio: DEFAULT_FIT_FLOOR_RATIO,
    };
  }
  // TWO FLOORS, BECAUSE THE SLIDER ONLY MOVES ONE OF THEM (2026-09-16, 2B).
  //
  // `--tile-a11y-scale` multiplies every tier's rendered font (index.css
  // § `--tile-type-scale`), so at 125% the DECLARED size is 25% larger — which
  // is the point, and the WIDTH floor rides it with the declared size: a user
  // at 125% asked for bigger text, and a tile with room to wrap should give it
  // to them (`ja-m3-neo-5?step=12` renders 22 / 27 / 31px at 100 / 125 / 140%
  // and never overflows).
  //
  // The FILL floor does not ride it. That one is "how small may everything get
  // rather than SCROLL", and scrolling is the worse outcome (#89), so a full
  // stage may still come down to the absolute px Spencer dialled. Measured on
  // `es-m34-10?step=4` at 125%: with a scaled fill floor the four Spanish
  // sentence options could not shrink below 22.5px and the step overflowed by
  // 232px; de-scaled they reach the dialled 18px and the overflow is 35px —
  // exactly what it was before the slider reached tiles at all.
  //
  // `max(1, …)` keeps the low end honest: below 100% the user asked for
  // SMALLER text, and both floors must come down with it or FIT has no room
  // and labels wrap instead of shrinking, which is the order backwards.
  const a11y = num(cs.getPropertyValue("--tile-a11y-scale"));
  const floorRatio = floor > 0 ? Math.min(floor / base, 1) : DEFAULT_FIT_FLOOR_RATIO;
  const fillDivisor = Math.max(1, a11y > 0 ? a11y : 1);
  return {
    floorRatio,
    ceilingRatio,
    fillFloorRatio: Math.min(floorRatio / fillDivisor, floorRatio),
  };
}

function plainCeilingRatio(cs: CSSStyleDeclaration): number {
  const base = num(cs.getPropertyValue("--tile-font"));
  const ceiling = num(cs.getPropertyValue("--tile-font-ceiling"));
  if (!(base > 0) || !(ceiling > 0)) return DEFAULT_FILL_CEILING_RATIO;
  return Math.max(ceiling / base, 1);
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
function measureNaturalWidth(el: HTMLElement, countOverflow: boolean): number {
  const doc = el.ownerDocument;
  if (!doc || typeof doc.createRange !== "function" || !el.firstChild) return 0;
  try {
    const range = doc.createRange();
    range.selectNodeContents(el);
    const rect = range.getBoundingClientRect();
    const boxed = rect && Number.isFinite(rect.width) ? rect.width : 0;
    // T3 — the Range under-reads a SHRINK-TO-FIT flex item. A match TARGET's
    // label is a bare text node: an anonymous flex item inside a `display:flex`
    // tile that `index.css` gives `min-width: 0`, so the item is shrunk to the
    // content box and the Range reports the BOX, not the label's max-content
    // width. Measured on `ja-m3-neo-5?step=23`: "excuse me / sorry (to a
    // stranger)" reported `clipped=true` at 19px (fit-scale ~0.88) while its
    // own siblings sat at the 0.80 floor — `widthRatio` never dropped below
    // `floorRatio`, `atFloor` never fired, `white-space: nowrap` stayed on and
    // the gloss was cut off at the tile edge at BOTH 100% and 125%.
    // `scrollWidth - clientWidth` is exactly the ink that did not fit, and it
    // is a read, not a write — no extra layout.
    //
    // FIXED-WIDTH TILES ONLY (`countOverflow`), and that scoping is not a
    // detail. A content-hugging build/listen tile is sized BY its own word, so
    // its `scrollWidth - clientWidth` is never unfitted ink — it is the RUBY
    // OVERHANG: an `<rt>` is routinely wider than the kanji run it annotates
    // (駅 vs えき) and sticks out of the box by design. Counting that as
    // "ink that did not fit" made one furigana tile drag its whole cohort
    // down, and the cohort cap is a MINIMUM: measured on the 15 Pro Max, the
    // m16 listen bank went from a 21px word to 16px, the m42 bank 21px -> 15px
    // and the iPad m16 bank 28px -> 19px, on stages that were not overflowing
    // at all. A grid CELL has no such overhang — its box is the budget, which
    // is exactly why this correction exists (T3, the match target).
    if (!countOverflow) return boxed;
    const over = el.scrollWidth - el.clientWidth;
    return over > 0 ? boxed + over : boxed;
  } catch {
    return 0;
  }
}

/**
 * The tile's NATURAL box height — what it would be with no `min-height` at all.
 *
 * This is the input to the #137 equal-rows rule (Class A) and it MUST NOT read
 * the tile's own border box: that box is already floored by `--tile-row-h`, so
 * feeding it back would ratchet the row height up and never let it down again.
 * A Range over the CONTENTS is immune — `justify-content: flex-end` moves the
 * word inside the box, it does not resize it — and it includes the ruby band,
 * which is the whole point (a kanji tile is taller than a kana tile by exactly
 * that band). Padding and border are added back because `min-height` is a
 * border-box length here (`box-sizing: border-box`, Tailwind preflight).
 *
 * TWO NUMBERS, BECAUSE ONLY ONE OF THEM SCALES (build 25, 2026-09-17). The
 * `inner` half is ink and line boxes: it is proportional to the font size,
 * and therefore to `--tile-fit-scale`. The `frame` half (padding + border) is
 * px tokens and does not move with the slider or the fit. Keeping them apart
 * is what lets the write phase state a natural height at a scale OTHER than
 * the one the tile is currently rendering at — which is the whole fix for the
 * one-frame row-height flicker below: a tile that has just mounted is
 * measured before its scale has ever been written, so its ink is a scale-1
 * lie, and `--tile-row-h` is a MAX over the cohort, so that one lie inflated
 * the row for exactly one painted frame. Measured on the 15 Pro Max at 125%
 * (`ja-m15-neo-6?step=15`, `--simulate build`): rowH 53 → 80 → 53 in 12ms on
 * the tap that mounted a new tray tile, which moved the prompt 5.4px and back
 * (`noFlicker` maxH2Jump=5.4, 4 reversals; both are 0 after this).
 */
function measureNaturalHeight(
  el: HTMLElement,
  cs: CSSStyleDeclaration,
): { inner: number; frame: number } {
  const none = { inner: 0, frame: 0 };
  const doc = el.ownerDocument;
  if (!doc || typeof doc.createRange !== "function" || !el.firstChild) return none;
  try {
    const range = doc.createRange();
    range.selectNodeContents(el);
    const rect = range.getBoundingClientRect();
    const inner = rect && Number.isFinite(rect.height) ? rect.height : 0;
    if (!(inner > 0)) return none;
    return {
      inner,
      frame:
        num(cs.paddingTop) +
        num(cs.paddingBottom) +
        num(cs.borderTopWidth) +
        num(cs.borderBottomWidth),
    };
  } catch {
    return none;
  }
}

/**
 * A cohort member's natural height AT the scale the pass is about to write.
 *
 * `inner` was measured while the tile rendered at `applied`; ink is linear in
 * the font size, so `inner / applied × target` is its height at `target`. The
 * frame (padding + border) is px and is added unscaled. `0` in, `0` out — an
 * unmeasurable tile contributes nothing to the row, which is what `max` wants.
 */
export function naturalHeightAtScale(
  natural: { inner: number; frame: number },
  applied: number,
  target: number,
): number {
  if (!(natural.inner > 0)) return 0;
  const from = Number.isFinite(applied) && applied > 0 ? applied : 1;
  const to = Number.isFinite(target) && target > 0 ? target : 1;
  return (natural.inner / from) * to + natural.frame;
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

/*
 * THE FILL RESERVE IS THE TRAY ITSELF (build 25, 2026-09-17).
 *
 * b24 had a `phantomReserve(row)` here: a huge bank rendered the full answer
 * a SECOND time in a zero-height clipped host (`data-phantom`) and this file
 * measured it, kept it out of the stage's groups, and charged the difference
 * to the FILL budget so the fit priced the finished sentence up front. It
 * held the scale still at 100% and nothing else — the tray still GREW, so the
 * prompt re-centred 36.8px, the bank walked down under it, and at 125% the
 * stage was already overflowing with an empty tray, so the shrink branch
 * capped the fill before the reserve was ever read (0.82 → 0.72 at tap 9;
 * `ja-m15-neo-6?step=15`, `--simulate build`, 15 Pro Max).
 *
 * The lead's ruling (nothing moves or resizes between the first tap and the
 * last, and a smaller constant tile beats a bigger one that shrinks) is
 * satisfied by the markup instead: the huge-bank tray reserves the full
 * answer in its VISIBLE ghost row, the way every normal bank has since #75.
 * The tray is then already its final height on the first pass, so there is
 * nothing to reserve, nothing to re-price, and no second copy to keep out of
 * the groups — the plain FILL arithmetic below sees the finished layout.
 */

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
  /** The stage-fill half's floor — see `readFitRatios`. */
  fillFloorRatio: number;
  ceilingRatio: number;
  usable: number;
  natural: number;
  /** The tile's own content height, floor-free, split into the half that
   *  scales with the font and the px frame that does not (see
   *  `measureNaturalHeight`), plus the fit scale it was measured AT. */
  naturalH: { inner: number; frame: number };
  appliedScale: number;
  /** `--tile-box-h` for this tile's tier, in px. */
  boxH: number;
  /** stage-or-group + variant: the cohort that renders ONE row height (#137). */
  rowKey: string;
  /** The tile's lesson stage, whether or not it participates in FILL — the
   *  key `cohortSizes` remembers this tier's rendered size under, so a tile
   *  that joins later is born at it. `stage` above is null for a tile that
   *  opted out of FILL and is the wrong thing to cache on. */
  host: HTMLElement | null;
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
 * The size a tile joining this stage + tier should be born at, if the pass
 * has already sized that cohort — see `cohortSizes`.
 *
 * TWO LOOKUPS, BECAUSE THE FIRST PLACED TILE IS ITS COHORT'S FIRST MEMBER.
 * `cohortKey` carries `data-slot`, so a build step has three build cohorts —
 * the bank (`slot="bank"`), the tray (`slot="tray"`) and the ghost
 * reservation (no slot) — and the tile placed by the FIRST tap is the first
 * tray-slot tile there has ever been. Measured on the 15 Pro Max
 * (`ja-m34-neo-7?step=5`, 100%): with only the exact-key lookup, taps 2..6
 * were frame-perfect and tap 1 still moved the prompt 1.2px for 24ms
 * (`--tile-row-h` 53.5 → 54 → 53.5, because the unscaled newcomer is a MAX
 * over the row cohort). The fallback is the smallest scale any cohort of the
 * SAME VARIANT on this stage renders at: those tiles all share one row height
 * by #137 and one stage FILL, so in practice it is the identical number (the
 * harness's `trayBankFontEqual` verdict is exactly the claim that a placed
 * tray tile and its bank sibling render at the same font), and `min` is the
 * safe direction — a tile born too small cannot inflate a row, it can only
 * grow into one on the pass that follows.
 */
function cohortSizeFor(el: HTMLElement): { scale: number; atFloor: boolean; rowH: number } | null {
  const stage = stageOf(el);
  if (!stage) return null;
  const byCohort = cohortSizes.get(stage);
  if (!byCohort) return null;
  const exact = byCohort.get(cohortKey(el));
  if (exact) return exact;
  const variant = `${el.dataset.variant ?? ""}|`;
  let best: { scale: number; atFloor: boolean; rowH: number } | null = null;
  for (const [key, size] of byCohort) {
    if (!key.startsWith(variant)) continue;
    if (!best || size.scale < best.scale) best = size;
  }
  return best;
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
  const collapsed: { el: HTMLElement; rec: TileRecord; rowKey: string }[] = [];
  const stageGroups = new Map<HTMLElement, Set<HTMLElement>>();

  for (const [el, rec] of tiles) {
    if (!el.isConnected) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none") continue;
    // The word-build pill's zero-width pre-sizer: no width to fit into, and
    // fitting it would collapse the row height it exists to reserve. It is
    // still handed the cohort's row height below — reserving that row is the
    // ONLY thing it exists to do, and leaving it on the unscaled
    // `--tile-box-h` fallback would make the pill's row the one row in the
    // step that did not match (#137, and the tray would jump on every fill).
    if (el.dataset.collapsed === "true") {
      if (rec.uniformHeight) {
        const host = stageOf(el) ?? groupOf(el);
        if (host) collapsed.push({ el, rec, rowKey: `${groupId(host)}|${el.dataset.variant ?? ""}` });
      }
      continue;
    }

    const { floorRatio, ceilingRatio, fillFloorRatio } = readFitRatios(cs);
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
    // The row cohort spans the whole STAGE, not one tray: a build step shows a
    // tray and a bank at once and #137 is "the height of every tile should be
    // the same" across both. Outside a stage (the QA fixtures) it falls back to
    // the group, so the page still shows one height per fixture.
    const rowHost = rec.uniformHeight ? (stageOf(el) ?? group) : null;
    ctxs.push({
      el,
      rec,
      stage,
      group,
      cohort: cohortKey(el),
      floorRatio,
      fillFloorRatio,
      ceilingRatio,
      usable: Math.max(own, row) - FIT_SAFETY_PX,
      natural: naturalWidthAtScaleOne(el, rec, cs),
      naturalH: rec.uniformHeight ? measureNaturalHeight(el, cs) : { inner: 0, frame: 0 },
      appliedScale: rec.scale > 0 ? rec.scale : 1,
      boxH: num(cs.getPropertyValue("--tile-box-h")),
      rowKey: rowHost ? `${groupId(rowHost)}|${el.dataset.variant ?? ""}` : "",
      host: stageOf(el),
    });
  }

  const fills = new Map<HTMLElement, number>();
  for (const [stage, groupSet] of stageGroups) {
    fills.set(stage, planStageFill(stage, groupSet, ctxs, stageLabelSignature(stage, ctxs)));
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

  /* ── EVERY TILE'S TARGET SCALE, BEFORE ANY ROW HEIGHT (build 25) ──────
     The scale each tile is about to render at, resolved first and reused
     twice: once as the row-height cohort's input and once as the value
     written. It used to be computed inside the write loop, which forced the
     row height to be built from naturals measured at whatever scale each tile
     happened to be rendering at — a scale-1 lie for a tile that had just
     mounted, and `--tile-row-h` is a MAX, so that lie inflated the row for
     one painted frame (see `measureNaturalHeight`). */
  const targets = new Map<HTMLElement, TileScale>();
  for (const ctx of ctxs) {
    const stageFill = ctx.stage ? (fills.get(ctx.stage) ?? 1) : 1;
    // Shrink-only tiles (match) never take a fill ABOVE 1 — see `fillGrow`.
    // The clamp is per tile, not per stage, so a mixed stage still grows the
    // tiles that may grow.
    const fillScale = ctx.rec.fillGrow ? stageFill : Math.min(1, stageFill);
    targets.set(
      ctx.el,
      resolveTileScale({
        widthRatio: caps.get(`${groupId(ctx.group)}|${ctx.cohort}`) ?? Infinity,
        fillScale,
        // THE WIDTH FLOOR RIDES THE SLIDER ONLY FOR A TILE THAT CAN BE
        // RESCUED.
        //
        // 2B's two-floor rule is right for a full FILL participant: at 125%
        // the user asked for bigger text, the width floor rises with the
        // declared size, and if the stage then runs out of room the FILL
        // half — which does NOT ride the slider — takes it back. A tile FILL
        // cannot rescue has no second half: the `image` tier is out of FILL
        // entirely (an `aspect-square` card's height comes from its width, so
        // growing the word can only steal room from the art) and `match` is
        // shrink-only and only shrinks when its stage actually SCROLLS —
        // which a roomy stage never does. Measured on the device at 125%: the
        // word-image card's label overhung its box by 7.04px and read as
        // clipped (`ja-m34-neo-6?step=4`), and the iPad's match grid sat at
        // 25% row spread with 0 overflow because nothing was scrolling to
        // trigger the shrink. Both get the absolute, de-scaled floor — the px
        // Spencer dialled, at every slider position.
        floorRatio: ctx.rec.fill && ctx.rec.fillGrow ? ctx.floorRatio : ctx.fillFloorRatio,
        fillFloorRatio: ctx.fillFloorRatio,
        ceilingRatio: ctx.ceilingRatio,
      }),
    );
  }

  /* ── ONE ROW HEIGHT PER COHORT (#137) ─────────────────────────────────
     The single owner of the equal-rows invariant. Two terms, both already
     measured above: the tallest NATURAL tile in the cohort (a kanji tile with
     its reading band, normally) and the founder's `--tile-box-h` dial, scaled
     DOWN — never up — with the cohort's fit scale so an overflowing stage can
     actually shrink (Class E) while a growing one is carried by the naturals.
     Growth must not come from this term or it feeds back into the FILL budget
     and the two negotiate forever.

     Every natural is stated AT THE SCALE THIS PASS WRITES (build 25), not at
     the scale it was measured at, so a tile that mounts mid-build cannot
     inflate its cohort's row for a frame. */
  const rows = new Map<string, { natural: number; boxH: number; fill: number }>();
  for (const ctx of ctxs) {
    if (!ctx.rowKey) continue;
    const fillScale = ctx.stage ? (fills.get(ctx.stage) ?? 1) : 1;
    const natural = naturalHeightAtScale(
      ctx.naturalH,
      ctx.appliedScale,
      targets.get(ctx.el)?.scale ?? ctx.appliedScale,
    );
    const row = rows.get(ctx.rowKey);
    if (!row) {
      rows.set(ctx.rowKey, { natural, boxH: ctx.boxH, fill: fillScale });
      continue;
    }
    if (natural > row.natural) row.natural = natural;
    if (ctx.boxH > row.boxH) row.boxH = ctx.boxH;
    if (fillScale < row.fill) row.fill = fillScale;
  }
  const rowHeights = new Map<string, number>();
  for (const [key, row] of rows) {
    rowHeights.set(key, Math.max(row.natural, row.boxH * Math.min(1, row.fill)));
  }

  /* ── WRITE ────────────────────────────────────────────────────────── */
  for (const ctx of ctxs) {
    const next = targets.get(ctx.el) ?? { scale: ctx.rec.scale, atFloor: ctx.rec.atFloor };
    writeRowHeight(ctx.el, ctx.rec, ctx.rowKey ? (rowHeights.get(ctx.rowKey) ?? 0) : 0);
    // Remember what this tier renders at, for the next tile to join it.
    if (ctx.host) {
      const byCohort = cohortSizes.get(ctx.host) ?? new Map();
      byCohort.set(ctx.cohort, { scale: next.scale, atFloor: next.atFloor, rowH: ctx.rec.rowH });
      cohortSizes.set(ctx.host, byCohort);
    }
    if (Math.abs(next.scale - ctx.rec.scale) < SCALE_STEP / 2 && next.atFloor === ctx.rec.atFloor) {
      continue;
    }
    ctx.rec.scale = next.scale;
    ctx.rec.atFloor = next.atFloor;
    ctx.el.style.setProperty("--tile-fit-scale", String(round3(next.scale)));
    // "prose" is a terminal state: it scales with the rule but is never told
    // not to wrap, so it can never be clipped by it.
    ctx.el.dataset.tileFit = !ctx.rec.nowrap ? "prose" : next.atFloor ? "floor" : "fit";
  }
  for (const c of collapsed) {
    writeRowHeight(c.el, c.rec, rowHeights.get(c.rowKey) ?? 0);
  }
}

/** Idempotent, and quantised to 0.5px so sub-pixel jitter cannot sustain a
 *  write -> resize -> write loop through the ResizeObserver. */
function writeRowHeight(el: HTMLElement, rec: TileRecord, rowH: number): void {
  if (!rec.uniformHeight) return;
  if (!(rowH > 0)) {
    if (rec.rowH !== 0) {
      rec.rowH = 0;
      el.style.removeProperty("--tile-row-h");
    }
    return;
  }
  const snapped = Math.ceil(rowH * 2) / 2;
  if (Math.abs(snapped - rec.rowH) < 0.25) return;
  rec.rowH = snapped;
  el.style.setProperty("--tile-row-h", `${snapped}px`);
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
  const measured = measureNaturalWidth(el, !rec.hugsContent);
  if (measured > 0) {
    rec.natural = measured / applied;
    rec.naturalKey = key;
  }
  return rec.natural;
}

/**
 * WHAT A LAYOUT GENERATION IS. The distinct labels on the stage — not the
 * tile COUNT. A build step's tiles move from the bank to the tray as the
 * learner taps, and each placed tile is a NEW element with a label that was
 * already on the stage; the words the fit was computed for have not changed,
 * so the decisions (fill, cap, move budget) must not be thrown away (#174).
 * A new step, a new word, or a viewport change still opens a new generation.
 */
export function stageLabelSignature(stage: HTMLElement, ctxs: TileCtx[]): string {
  const labels = new Set<string>();
  for (const ctx of ctxs) {
    if (ctx.stage === stage) labels.add(ctx.el.textContent ?? "");
  }
  return [...labels].sort().join("\u0001");
}

/** One FILL decision per stage per pass, with the overflow backoff. */
function planStageFill(
  stage: HTMLElement,
  groupSet: Set<HTMLElement>,
  ctxs: TileCtx[],
  labelSig: string,
): number {
  const scroller = stage.parentElement;
  const groupList = [...groupSet];
  // Keyed on viewport + LABEL SET (see `stageLabelSignature`). The key used to
  // carry `ctxs.length`, and a tap changes that: every tap of a build step
  // reset the cap and the move budget and re-ran the whole negotiation.
  const key = `${scroller?.clientHeight ?? 0}x${Math.round(stage.clientWidth)}x${labelSig}`;
  let rec = stages.get(stage);
  if (!rec || rec.key !== key) {
    rec = { key, fill: rec?.fill ?? 1, moves: 0, cap: Infinity, releases: 0, settled: false };
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
  /**
   * WHAT THE SHRINK HALF IS ALLOWED TO BELIEVE.
   *
   * `scrolling` only. `overReach` is `contentBottom - budgetBottom`, and
   * `contentBottom` is `max(group bottoms, THE STAGE'S OWN bottom)` — the stage
   * box belongs to the fitted shell and does not move when a tile gets
   * smaller. So on any step whose stage box ends a few px below the visual
   * viewport's usable floor, `overReach` is a constant that shrinking can
   * never satisfy, and a shrink loop with that as its trigger runs to the
   * floor. Measured the first time this branch shipped: `m16-neo-challenge
   * ?step=7` at 100%, a stage with `scrollHeight === clientHeight` (not
   * scrolling at all) and 204px of visible slack under its bank, took its
   * listen word from 21px to 16px and pushed dead space 29.4% -> 39.7%.
   *
   * `scrolling` does not have that problem: it is a property of the content,
   * it falls as the content shrinks, and it is literally #89 ("there should be
   * no scroll here"). `overReach` keeps its old job — backing a stage out of a
   * fill WE applied, where the arithmetic is self-correcting — and its old
   * gate, `rec.fill > 1`.
   */
  const shrinkBy = Math.max(scrolling, rec.fill > 1 ? overReach : 0);

  /* ── RELEASE THE ANTI-FLICKER CAP, ONCE (2026-09-16, phase 3) ─────────
     See `StageRecord.releases`. A cap set against a transient overflow is
     indistinguishable, later in the same generation, from a cap set against a
     real one — except by the slack. Measure it: a stage that is not scrolling
     AND has more than `CAP_RELEASE_SLACK_PX` of on-screen room under its
     content is not the stage the cap was written for. */
  const slackToFold = budgetBottom === null ? 0 : budgetBottom - contentBottom;
  if (
    rec.cap < Infinity &&
    rec.releases < 1 &&
    shrinkBy <= 1 &&
    overflow <= 1 &&
    slackToFold > CAP_RELEASE_SLACK_PX
  ) {
    rec.cap = Infinity;
    rec.releases = 1;
    // The freeze counts GROWTH moves; a released cap that stays frozen is the
    // same tile size by another route. Same for `settled`.
    rec.moves = 0;
    rec.settled = false;
  }

  // The FILL floor, not the width floor: the slider does not raise how small a
  // full stage may go rather than scroll (`readFitRatios`).
  const fitFloor = ctxs.find((c) => c.stage === stage)?.fillFloorRatio ?? DEFAULT_FIT_FLOOR_RATIO;

  let fill: number;
  if (shrinkBy > 1) {
    // THE STAGE IS OVERFLOWING. Give the room back — measured, not by a fixed
    // step, so it lands in one pass instead of five: the same linear height
    // model as the growth, run backwards. This branch is checked FIRST and is
    // never frozen (it only ever decreases, so it cannot cycle); an earlier
    // version checked the freeze first and left a stage parked at fill 1.11
    // with 79px of overflow at 375x667 — measured, and the reason this is
    // written the way it is.
    //
    // 2026-09-16 (Class E / T4): the floor used to be 1 — "overflowing at fill
    // 1 is a different lane's problem (#157/#161)" — so a step that did not fit
    // simply scrolled, on 8 of 25 measured routes at 125%, up to 234px at 140%.
    // It now shrinks to the SAME `--tile-font-floor` FIT stops at, which is the
    // founder's own "how small is too small" dial, and no further.
    const factor = groupHeight > 0 ? Math.max(0.5, (groupHeight - shrinkBy) / groupHeight) : 0.9;
    fill = Math.max(fitFloor, round3(Math.min(rec.fill * factor, rec.fill - SCALE_STEP)));
    // Never grow back past what we know overflows: without this the two halves
    // take turns and the stage flickers rather than settling.
    rec.cap = Math.min(rec.cap, fill);
  } else if (rec.moves >= FILL_MAX_MOVES || rec.settled) {
    fill = rec.fill; // frozen for this layout generation (budget spent, or settled)
  } else if (overflow > 1) {
    // Over-reaching the visible floor but not scrolling: do not grow, and do
    // not shrink either (see `shrinkBy` — that number cannot be satisfied).
    fill = rec.fill;
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
    // NOTHING IS RESERVED HERE ANY MORE (b25). The tray a build step measures
    // against is already the height the finished sentence needs — its ghost
    // row holds the whole answer — so `groupHeight` IS the final layout and
    // the scale this picks is the scale the last tap renders at. b24's
    // `reservePx` (a hidden second copy of the answer, charged to the group
    // and taken off the free space) is gone with it.
    // A stage whose every tile is shrink-only (a match step) may not grow at
    // all: its ceiling is 1, so `rec.fill` cannot climb to 1.25 and then have
    // to walk all the way back down through the shrink branch before the
    // scale it writes changes at all (`resolveTileScale` takes
    // `min(widthCap, fillCap)`, and `widthCap` is already at the floor on the
    // route that needs the shrink).
    const mayGrow = ctxs.some((c) => c.stage === stage && c.rec.fillGrow);
    const ceilingRatio = mayGrow
      ? (ctxs.find((c) => c.stage === stage)?.ceilingRatio ?? DEFAULT_FILL_CEILING_RATIO)
      : 1;
    fill = computeFillScale({
      freeHeight: Number.isFinite(free) ? Math.max(0, free) : 0,
      groupHeight,
      currentFill: rec.fill,
      ceilingRatio: Math.min(ceilingRatio, rec.cap),
      // THE GROW BRANCH MAY NOT SHRINK. `freeHeight` here is clamped at >= 0
      // and then `FILL_SAFETY_PX` (6px) is taken off it, so a stage with no
      // room to grow computes a growth factor of (H - 6)/H — about 0.98 — and
      // with a floor below 1 available it took that 2% EVERY PASS, walking to
      // the floor on a stage that was never overflowing. Measured: the m16
      // listen bank's word went 21px -> 16px and the iPad's 28px -> 19px with
      // `scrollHeight === clientHeight` throughout; Chromium, which runs fewer
      // passes, showed the same stage mid-walk at 0.97. Shrinking belongs to
      // the branch above, which has a real trigger and a cap; this one may
      // only give back fill IT applied.
      floorRatio: Math.min(1, rec.fill),
    });
    // The grow half ran on a real budget and stood still: this generation
    // has found its size (see `StageRecord.settled`).
    if (Math.abs(fill - rec.fill) < SCALE_STEP / 2) rec.settled = true;
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
