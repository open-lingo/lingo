/**
 * Token registry for the tile-sizing QA page (`/:lang/qa/tiles`,
 * TestFlight #137). Single source of truth for:
 *   - which CSS custom properties the page can dial (name, unit, slider
 *     range, group),
 *   - their SHIPPED defaults, read straight off `src/index.css`'s
 *     `:root` token block — base = phone (<640px), sm = desktop
 *     (`@media (min-width: 640px)`, Tailwind's own `sm:` breakpoint).
 *
 * The page keeps TWO independent value maps (one per pane) seeded from
 * `base`/`sm` here; moving a mobile-pane slider only ever posts to the
 * mobile iframe's own document root, and likewise for desktop, so the two
 * panes can never cross-contaminate each other.
 */

export type TileTokenGroup = "build" | "match" | "mcq";

export type TileTokenDef = {
  /** CSS custom property name, e.g. "--tile-font". */
  key: string;
  /** Human label shown next to the slider. */
  label: string;
  /** CSS unit appended to the slider's numeric value. "" = unitless. */
  unit: "px" | "em" | "rem" | "";
  group: TileTokenGroup;
  min: number;
  max: number;
  step: number;
  /** Shipped default at <640px (the phone/base tier). */
  base: number;
  /** Shipped default at ≥640px (the `sm:`/desktop tier). */
  sm: number;
};

export const TILE_TOKEN_DEFS: readonly TileTokenDef[] = [
  // ── Build tiles (BuildSentenceStepView dense tier + ListeningBuildStepView
  //    via fixed ratios — see comments at each call site) ──────────────────
  {
    key: "--tile-h",
    label: "Tray floor height",
    unit: "px",
    group: "build",
    min: 20,
    max: 100,
    step: 0.5,
    // Mobile base updated 2026-09-15 — Spencer's own live dial-in on the QA
    // page, saved to scratchpad/fb16-research/spencer-mobile-tokens-2026-09-15.css
    // and applied verbatim (see the matching index.css comment). Desktop
    // (`sm`) is untouched — he dialled mobile only.
    base: 20,
    sm: 61,
  },
  {
    key: "--tile-font",
    label: "Word size",
    unit: "px",
    group: "build",
    min: 10,
    max: 32,
    step: 0.1,
    base: 15.8,
    sm: 20.4,
  },
  {
    key: "--tile-kana-font",
    label: "Kana-only word growth",
    unit: "em",
    group: "build",
    min: 0.8,
    max: 2,
    step: 0.01,
    base: 1.28,
    sm: 1.2,
  },
  {
    key: "--ruby-font",
    label: "Furigana size",
    unit: "em",
    group: "build",
    min: 0.3,
    max: 1,
    step: 0.01,
    base: 0.72,
    sm: 0.55,
  },
  {
    key: "--ruby-floor-romaji",
    label: "Romaji reading floor",
    unit: "rem",
    group: "build",
    min: 0.4,
    max: 1.2,
    step: 0.0125,
    base: 0.75,
    sm: 0.75,
  },
  {
    key: "--ruby-floor-kanji",
    label: "Kanji reading floor",
    unit: "rem",
    group: "build",
    min: 0.4,
    max: 1.2,
    step: 0.0125,
    base: 0.7375,
    sm: 0.625,
  },
  {
    key: "--tile-px",
    label: "Tile padding X",
    unit: "px",
    group: "build",
    min: 4,
    max: 30,
    step: 0.25,
    base: 10.75,
    sm: 14,
  },
  {
    key: "--tile-py",
    label: "Tile padding Y",
    unit: "px",
    group: "build",
    min: 0,
    max: 20,
    step: 0.25,
    base: 4,
    sm: 7,
  },
  {
    key: "--tile-gap",
    label: "Bank row gap",
    unit: "px",
    group: "build",
    min: 0,
    max: 24,
    step: 0.5,
    base: 8,
    sm: 10,
  },
  {
    key: "--tile-tray-gap",
    label: "Tray row gap",
    unit: "px",
    group: "build",
    min: 0,
    max: 24,
    step: 0.5,
    base: 8,
    sm: 10,
  },
  {
    key: "--tile-radius",
    label: "Tile corner radius",
    unit: "rem",
    group: "build",
    min: 0,
    max: 2,
    step: 0.0625,
    base: 0.75,
    sm: 0.75,
  },
  // TestFlight #137 (b16.1, 2026-09-15): min-height floor applied to EVERY
  // build tile box (dense/hugeBank/bigTiles AND ListeningBuildStepView's
  // bank/tray) so furigana no longer makes one tile's box taller than its
  // neighbour's. Default is LITERALLY 0 (provably inert for every fixture),
  // which sits below this slider's 28px floor on purpose — see the
  // index.css token-block comment for why 0 and not an "observed" number.
  // "Lock tile heights" on the QA page drives this LIVE from a measurement
  // instead of the slider; see TileSizingQaPage.tsx.
  {
    key: "--tile-box-h",
    label: "Tile box min-height (uniform)",
    unit: "px",
    group: "build",
    min: 28,
    max: 80,
    step: 0.5,
    base: 0,
    sm: 0,
  },
  // bigTiles' three literal numbers (px/py/font-clamp) wrapped in ONE
  // unitless multiplier so a single slider scales the whole tier. Default 1
  // = today's exact numbers — bigTiles was never derived from --tile-font/
  // --tile-px (no `sm:` step, cqh-driven clamp), so "today's ratio" is
  // self-relative identity, not a ratio against the dense tier's tokens.
  {
    key: "--tile-big-scale",
    label: "Big-tile scale (≤6-tile / word-build, ×)",
    unit: "",
    group: "build",
    min: 0.5,
    max: 2,
    step: 0.01,
    base: 1,
    sm: 1,
  },
  // ListeningBuildStepView's bank gap was a literal `gap-3` (12px, no `sm:`
  // step) that did NOT match `--tile-gap`'s own default (8px) — wiring it
  // there would have shrunk it. Own token, default 12, preserves today's
  // TestFlight #125 "12px vs 8px" bank/tray mismatch as a disclosed default
  // rather than silently changing it.
  {
    key: "--listen-bank-gap",
    label: "Listen-build bank gap",
    unit: "px",
    group: "build",
    min: 0,
    max: 24,
    step: 0.5,
    base: 12,
    sm: 12,
  },

  // ── Match pairs (own group) ───────────────────────────────────────────
  {
    key: "--match-tile-h",
    label: "Row height",
    unit: "rem",
    group: "match",
    min: 2,
    max: 8,
    step: 0.125,
    base: 4.75,
    sm: 4.75,
  },
  {
    key: "--match-gap",
    label: "Row gap",
    unit: "rem",
    group: "match",
    min: 0,
    max: 2,
    step: 0.0625,
    base: 0.5,
    sm: 0.5,
  },
  {
    key: "--match-font-scale",
    label: "Font scale (×, all 4 tiers)",
    unit: "",
    group: "match",
    min: 0.5,
    max: 2,
    step: 0.01,
    base: 1,
    sm: 1,
  },

  // ── Multiple choice (own group, regular/sentence layout only) ─────────
  {
    key: "--mcq-font",
    label: "Option font size",
    unit: "rem",
    group: "mcq",
    min: 0.75,
    max: 2.5,
    step: 0.0625,
    base: 1.25,
    sm: 1.25,
  },
  {
    key: "--mcq-py",
    label: "Option padding Y",
    unit: "rem",
    group: "mcq",
    min: 0.25,
    max: 3,
    step: 0.0625,
    base: 1.5,
    sm: 1.5,
  },
] as const;

export type TileVarMap = Record<string, number>;

export function defaultVars(tier: "base" | "sm"): TileVarMap {
  const out: TileVarMap = {};
  for (const def of TILE_TOKEN_DEFS) out[def.key] = def[tier];
  return out;
}

/**
 * Format one token's value for CSS output. `value` is typed as possibly
 * `undefined` because `TileVarMap` is `Record<string, number>` in name only
 * — the actual object can be missing a key whenever it came from
 * `localStorage` (a blob saved before a token existed, e.g. Spencer's
 * pre-#137-follow-up mobile save had no `--tile-box-h`/`--tile-big-scale`/
 * `--listen-bank-gap` entries) or from `docs/qa/tile-sizing.json`. Falling
 * through to `${undefined}${unit}` produced literal `"undefinedpx"` in Copy
 * CSS / Save (Spencer, 2026-09-15) — `tier` picks which shipped default
 * (`base` or `sm`) to fall back to, so the OUTPUT is always a real number,
 * never a string with "undefined" in it.
 */
export function formatVar(
  def: TileTokenDef,
  value: number | undefined,
  tier: "base" | "sm" = "base",
): string {
  const v = typeof value === "number" && Number.isFinite(value) ? value : def[tier];
  return `${v}${def.unit}`;
}

const GROUP_LABEL: Record<TileTokenGroup, string> = {
  build: "Build tiles (build_sentence + listening_build)",
  match: "Match pairs",
  mcq: "Multiple choice",
};

export function groupLabel(group: TileTokenGroup): string {
  return GROUP_LABEL[group];
}
