/**
 * Token registry for the tile-sizing QA page (`/:lang/qa/tiles`, TestFlight
 * #137). Single source of truth for which CSS custom properties the page can
 * dial, their slider ranges, and their SHIPPED defaults (mirroring
 * `src/index.css`'s `:root` block: `base` = <640px, `sm` = the Tailwind
 * `sm:` breakpoint). `src/index.css` is the source of truth for the VALUES;
 * this file is the registry the sliders read — add a token in CSS first,
 * then here.
 *
 * Model (Spencer 2026-09-15, "they can scale off the plain tile"):
 *   - `section: "base"` is the PLAIN TILE (build, dense tier). Every other
 *     tile-shaped step type derives from it.
 *   - `kind: "scale"` tokens are unitless multipliers over a base token; the
 *     CSS reads `var(--X-abs, calc(base * var(--X-scale)))`, so the page can
 *     flip a section to ABSOLUTE mode by setting `absKey` (and clearing it to
 *     go back to scaling). Defaults reproduce today's shipped ratios exactly.
 *   - `kind: "abs"` tokens are plain values in their own unit.
 *   - `hidden` tokens stay in the value map (Copy CSS / Save still emit them)
 *     but get no slider — `--mcq-*` are the legacy aliases `--option-*`
 *     indirects through.
 */

export type TileTokenGroup = "build" | "match" | "mcq" | "option" | "card";
export type TileSection = "base" | "huge" | "big" | "listen" | "match" | "option" | "card";
export type TileTier = "base" | "sm";

export type TileTokenDef = {
  key: string;
  label: string;
  unit: "px" | "em" | "rem" | "vh" | "";
  /** Legacy grouping kept for Copy CSS comments and older tests. */
  group: TileTokenGroup;
  section: TileSection;
  kind: "abs" | "scale";
  min: number;
  max: number;
  step: number;
  base: number;
  sm: number;
  /** For `kind: "scale"`: the absolute override property the CSS prefers when set. */
  absKey?: string;
  absUnit?: "px" | "rem";
  absMin?: number;
  absMax?: number;
  absStep?: number;
  hidden?: boolean;
};

export const TILE_TOKEN_DEFS: readonly TileTokenDef[] = [
  { key: "--tile-font", label: "Word size", unit: "px", group: "build", section: "base", kind: "abs", min: 10, max: 32, step: 0.1, base: 18.3, sm: 20.4 },
  { key: "--tile-px", label: "Tile padding X", unit: "px", group: "build", section: "base", kind: "abs", min: 4, max: 30, step: 0.25, base: 5, sm: 14 },
  { key: "--tile-py", label: "Tile padding Y", unit: "px", group: "build", section: "base", kind: "abs", min: 0, max: 20, step: 0.25, base: 3.75, sm: 7 },
  { key: "--tile-box-h", label: "Tile height floor (lock uses this)", unit: "px", group: "build", section: "base", kind: "abs", min: 28, max: 80, step: 0.5, base: 45, sm: 51 },
  { key: "--tile-radius", label: "Tile corner radius", unit: "rem", group: "build", section: "base", kind: "abs", min: 0, max: 2, step: 0.0625, base: 0.75, sm: 0.75 },
  { key: "--tile-gap", label: "Bank row gap", unit: "px", group: "build", section: "base", kind: "abs", min: 0, max: 24, step: 0.5, base: 5.5, sm: 10 },
  { key: "--tile-tray-gap", label: "Tray row gap", unit: "px", group: "build", section: "base", kind: "abs", min: 0, max: 24, step: 0.5, base: 8, sm: 10 },
  { key: "--tile-h", label: "Sentence tray floor", unit: "px", group: "build", section: "base", kind: "abs", min: 20, max: 100, step: 0.5, base: 20, sm: 61 },
  { key: "--tile-kana-font", label: "Kana-only word growth", unit: "em", group: "build", section: "base", kind: "abs", min: 0.8, max: 2, step: 0.01, base: 1.28, sm: 1.2 },
  { key: "--ruby-font", label: "Furigana size", unit: "em", group: "build", section: "base", kind: "abs", min: 0.3, max: 1, step: 0.01, base: 0.62, sm: 0.55 },
  { key: "--ruby-floor-romaji", label: "Romaji reading floor", unit: "rem", group: "build", section: "base", kind: "abs", min: 0.4, max: 1.2, step: 0.0125, base: 0.75, sm: 0.75 },
  { key: "--ruby-floor-kanji", label: "Kanji reading floor", unit: "rem", group: "build", section: "base", kind: "abs", min: 0.4, max: 1.2, step: 0.0125, base: 0.75, sm: 0.625 },
  { key: "--huge-font-scale", label: "Word size × base", unit: "", group: "build", section: "huge", kind: "scale", min: 0.5, max: 1.5, step: 0.005, base: 1.032787, sm: 0.833333, absKey: "--huge-font-abs", absUnit: "px", absMin: 10, absMax: 32, absStep: 0.1 },
  { key: "--huge-py-scale", label: "Padding Y × base", unit: "", group: "build", section: "huge", kind: "scale", min: 0.25, max: 2, step: 0.01, base: 0.666667, sm: 0.75, absKey: "--huge-py-abs", absUnit: "px", absMin: 0, absMax: 20, absStep: 0.25 },
  { key: "--big-font-scale", label: "Word size × base", unit: "", group: "build", section: "big", kind: "scale", min: 0.5, max: 2, step: 0.005, base: 1, sm: 1, absKey: "--big-font-abs", absUnit: "px", absMin: 10, absMax: 32, absStep: 0.1 },
  { key: "--big-px-scale", label: "Padding X × base", unit: "", group: "build", section: "big", kind: "scale", min: 0.25, max: 3, step: 0.005, base: 1, sm: 1.25, absKey: "--big-px-abs", absUnit: "px", absMin: 0, absMax: 30, absStep: 0.25 },
  { key: "--big-py-scale", label: "Padding Y × base", unit: "", group: "build", section: "big", kind: "scale", min: 0.25, max: 3, step: 0.005, base: 1, sm: 1, absKey: "--big-py-abs", absUnit: "px", absMin: 0, absMax: 20, absStep: 0.25 },
  { key: "--listen-font-scale", label: "Word size × base", unit: "", group: "build", section: "listen", kind: "scale", min: 0.5, max: 2.5, step: 0.005, base: 1.103825, sm: 1.25, absKey: "--listen-font-abs", absUnit: "px", absMin: 10, absMax: 32, absStep: 0.1 },
  { key: "--listen-px-scale", label: "Padding X × base", unit: "", group: "build", section: "listen", kind: "scale", min: 0.5, max: 2.5, step: 0.005, base: 2.4, sm: 1.25, absKey: "--listen-px-abs", absUnit: "px", absMin: 4, absMax: 30, absStep: 0.25 },
  { key: "--listen-py-scale", label: "Padding Y × base (tray)", unit: "", group: "build", section: "listen", kind: "scale", min: 0.5, max: 2.5, step: 0.005, base: 0.8, sm: 1.25, absKey: "--listen-py-abs", absUnit: "px", absMin: 0, absMax: 20, absStep: 0.25 },
  { key: "--listen-bank-py-scale", label: "Padding Y × base (bank)", unit: "", group: "build", section: "listen", kind: "scale", min: 0.5, max: 2.5, step: 0.005, base: 1.066667, sm: 1.25, absKey: "--listen-bank-py-abs", absUnit: "px", absMin: 0, absMax: 20, absStep: 0.25 },
  { key: "--listen-bank-gap", label: "Bank gap", unit: "px", group: "build", section: "listen", kind: "abs", min: 0, max: 24, step: 0.5, base: 7, sm: 12 },
  { key: "--match-tile-h", label: "Row height", unit: "rem", group: "match", section: "match", kind: "abs", min: 2, max: 8, step: 0.125, base: 5.25, sm: 4.75 },
  { key: "--match-gap", label: "Row gap", unit: "rem", group: "match", section: "match", kind: "abs", min: 0, max: 2, step: 0.0625, base: 0.5, sm: 0.5 },
  { key: "--match-font-scale", label: "Font scale (×, all 4 tiers)", unit: "", group: "match", section: "match", kind: "abs", min: 0.5, max: 2, step: 0.01, base: 0.91, sm: 1 },
  { key: "--match-px", label: "Padding X", unit: "rem", group: "match", section: "match", kind: "abs", min: 0, max: 3, step: 0.0625, base: 1, sm: 1 },
  { key: "--match-py", label: "Padding Y", unit: "rem", group: "match", section: "match", kind: "abs", min: 0, max: 2, step: 0.0625, base: 0.4375, sm: 0.375 },
  { key: "--match-radius", label: "Corner radius", unit: "rem", group: "match", section: "match", kind: "abs", min: 0, max: 2, step: 0.0625, base: 1, sm: 0.75 },
  { key: "--option-px", label: "Option padding X", unit: "rem", group: "option", section: "option", kind: "abs", min: 0, max: 3, step: 0.0625, base: 0.4375, sm: 1 },
  { key: "--option-py", label: "Option padding Y (sentence/pick tiers)", unit: "rem", group: "option", section: "option", kind: "abs", min: 0.25, max: 3, step: 0.0625, base: 1.25, sm: 1.5 },
  { key: "--option-font", label: "Option font size (sentence/pick tiers)", unit: "rem", group: "option", section: "option", kind: "abs", min: 0.75, max: 2.5, step: 0.0625, base: 1.375, sm: 1.25 },
  { key: "--option-radius", label: "Option corner radius", unit: "rem", group: "option", section: "option", kind: "abs", min: 0, max: 2, step: 0.0625, base: 0.75, sm: 0.75 },
  { key: "--option-gap", label: "Option grid gap", unit: "rem", group: "option", section: "option", kind: "abs", min: 0, max: 2, step: 0.0625, base: 0.875, sm: 1 },
  { key: "--mcq-font", label: "Option font size", unit: "rem", group: "mcq", section: "option", kind: "abs", min: 0.75, max: 2.5, step: 0.0625, base: 1.25, sm: 1.25, hidden: true },
  { key: "--mcq-py", label: "Option padding Y", unit: "rem", group: "mcq", section: "option", kind: "abs", min: 0.25, max: 3, step: 0.0625, base: 1.5, sm: 1.5, hidden: true },
  { key: "--card-pad", label: "Card padding", unit: "rem", group: "card", section: "card", kind: "abs", min: 0.5, max: 3, step: 0.0625, base: 1.25, sm: 1.25 },
  { key: "--card-max-h", label: "Card max height (vh)", unit: "vh", group: "card", section: "card", kind: "abs", min: 40, max: 100, step: 1, base: 85, sm: 85 },
];

export type TileSectionDef = {
  id: TileSection;
  label: string;
  /** Which frame fixture(s) this section dials — the page scrolls the panes here. */
  fixture: string;
  /** Sections that derive from the plain tile get the scale/absolute toggle. */
  derived: boolean;
  note?: string;
};

export const TILE_SECTIONS: readonly TileSectionDef[] = [
  { id: "base", label: "Plain tile — build, 7–11 tiles", fixture: "qa-tiles-build-8", derived: false, note: "Everything below scales off these." },
  { id: "huge", label: "Build — 12+ tiles", fixture: "qa-tiles-build-16", derived: true },
  { id: "big", label: "Build — ≤6 tiles / word build", fixture: "qa-tiles-build-5", derived: true },
  { id: "listen", label: "Listening build", fixture: "qa-tiles-listen-9", derived: true },
  { id: "match", label: "Match pairs", fixture: "qa-tiles-match-5", derived: false, note: "Own height; uniform within the grid (Spencer)." },
  { id: "option", label: "Answer options — MCQ, cloze, pickers", fixture: "qa-tiles-mcq-4", derived: false },
  { id: "card", label: "Overlay / rule card", fixture: "qa-tiles-overlay", derived: false },
];

export type TileVarMap = Record<string, number>;

export function defaultVars(tier: TileTier): TileVarMap {
  const out: TileVarMap = {};
  for (const def of TILE_TOKEN_DEFS) {
    out[def.key] = def[tier];
    if (def.absKey) out[def.absKey] = absDefault(def, tier);
  }
  return out;
}

/** Today's effective absolute value of a scale token = base token × ratio. */
export function absDefault(def: TileTokenDef, tier: TileTier): number {
  const baseKey = def.key.endsWith("-font-scale")
    ? "--tile-font"
    : def.key.endsWith("-px-scale")
      ? "--tile-px"
      : "--tile-py";
  const base = TILE_TOKEN_DEFS.find((d) => d.key === baseKey);
  const v = (base ? base[tier] : 0) * def[tier];
  return Math.round(v * 100) / 100;
}

/**
 * Format one token's value for CSS output. `value` may be missing when the
 * map came from localStorage / the saved JSON (a blob saved before a token
 * existed) — fall back to the shipped default for `tier` so the output is a
 * real number, never "undefinedpx".
 */
export function formatVar(def: TileTokenDef, value: number | undefined, tier: TileTier = "base"): string {
  const v = typeof value === "number" && Number.isFinite(value) ? value : def[tier];
  return `${v}${def.unit}`;
}

export function formatAbs(def: TileTokenDef, value: number | undefined, tier: TileTier = "base"): string {
  const v = typeof value === "number" && Number.isFinite(value) ? value : absDefault(def, tier);
  return `${v}${def.absUnit ?? "px"}`;
}

const GROUP_LABEL: Record<TileTokenGroup, string> = {
  build: "Build tiles (build_sentence + listening_build)",
  match: "Match pairs",
  mcq: "Multiple choice",
  option: "Answer options (every step type)",
  card: "Lesson overlay card",
};

export function groupLabel(group: TileTokenGroup): string {
  return GROUP_LABEL[group];
}

export function sectionTokens(section: TileSection): TileTokenDef[] {
  return TILE_TOKEN_DEFS.filter((d) => d.section === section && !d.hidden);
}
