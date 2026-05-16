/**
 * Sub-lesson density configuration.
 *
 * Each hiragana sub-lesson today emits ~6 items (one minute of work). Spencer
 * wants ~4-5 minutes per sub-lesson by chaining additional drill blocks
 * between the per-kana intro/teach cycle and the existing match/build wrap.
 *
 * The drill blocks (`symbol_recognition`, `symbol_to_sound`,
 * `listening_comprehension`, `fill_blank`, `speaking`, `symbol_production`)
 * are emitted in a fixed order; this module decides *how many* of each.
 *
 * Per-key counts come from a preset (minimal / standard / thorough) plus
 * optional per-key URL-bar overrides — same sessionStorage-backed pattern as
 * `src/shared/speech/featureFlag.ts`. Set via `?density=standard` to pick a
 * preset, `?density-recognition=N` to override a single dial. Speaking
 * defaults to 0 in Standard because voice tuning is still in flight; the
 * voice agent will bump it once thresholds stabilize.
 *
 * Boundaries:
 *   - Counts are clamped to [0, 12] per key (sanity, not policy).
 *   - The lesson builder is responsible for capping requested counts against
 *     what the row can actually produce (e.g. yōon-intro has 1 kana and
 *     can't produce 6 distinct recognition prompts).
 */

export type DensityMode = "minimal" | "standard" | "thorough";

export type DensityConfig = {
  /** symbol_recognition: see kana, pick correct romaji. */
  recognition: number;
  /** symbol_to_sound: see kana, pick correct audio (play button + 4 romaji options). */
  symbolToSound: number;
  /** listening_comprehension: hear anchor word audio, pick meaning. */
  listening: number;
  /** fill_blank: word with a kana blanked, pick the missing kana. */
  fillBlank: number;
  /** speaking: pronounce the kana / word into the mic. */
  speaking: number;
  /** symbol_production: write the kana on a canvas from memory. */
  production: number;
};

export const DENSITY_PRESETS: Record<DensityMode, DensityConfig> = {
  minimal: {
    recognition: 2,
    symbolToSound: 0,
    listening: 0,
    fillBlank: 0,
    speaking: 0,
    production: 0,
  },
  standard: {
    recognition: 4,
    symbolToSound: 2,
    listening: 3,
    fillBlank: 2,
    speaking: 0,
    production: 1,
  },
  thorough: {
    recognition: 6,
    symbolToSound: 3,
    listening: 5,
    fillBlank: 3,
    speaking: 3,
    production: 2,
  },
};

export const DEFAULT_DENSITY_MODE: DensityMode = "standard";

const MODE_KEY = "lingo_density_mode_v1";
const PER_KEY_PREFIX = "lingo_density_";

const PER_KEY_STORAGE: Record<keyof DensityConfig, string> = {
  recognition: `${PER_KEY_PREFIX}recognition_v1`,
  symbolToSound: `${PER_KEY_PREFIX}symbolToSound_v1`,
  listening: `${PER_KEY_PREFIX}listening_v1`,
  fillBlank: `${PER_KEY_PREFIX}fillBlank_v1`,
  speaking: `${PER_KEY_PREFIX}speaking_v1`,
  production: `${PER_KEY_PREFIX}production_v1`,
};

/**
 * URL param ↔ density key map. Mirrors the speech-config layout so the
 * top-level route's query-param sync can iterate this list, apply, and clean.
 */
export const DENSITY_QUERY_KEYS: ReadonlyArray<
  readonly [string, keyof DensityConfig]
> = [
  ["density-recognition", "recognition"],
  ["density-symbol-to-sound", "symbolToSound"],
  ["density-listening", "listening"],
  ["density-fill-blank", "fillBlank"],
  ["density-speaking", "speaking"],
  ["density-production", "production"],
];

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    /* storage may be unavailable (private mode); silently ignore */
  }
}

function parseCount(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 12) return 12;
  return n;
}

function isDensityMode(value: string | null): value is DensityMode {
  return value === "minimal" || value === "standard" || value === "thorough";
}

/** Read the current density preset (defaults to Standard). */
export function getDensityMode(): DensityMode {
  const raw = safeGet(MODE_KEY);
  return isDensityMode(raw) ? raw : DEFAULT_DENSITY_MODE;
}

/** Persist a density preset (or `null` to clear back to the default). */
export function setDensityMode(mode: DensityMode | null): void {
  safeSet(MODE_KEY, mode);
}

/** Persist a per-key override (or `null` to clear back to the preset). */
export function setDensityOverride(
  key: keyof DensityConfig,
  value: string | null,
): void {
  safeSet(PER_KEY_STORAGE[key], value);
}

/**
 * Read the resolved density config: preset values overridden per-key by any
 * `?density-*` overrides previously persisted. Pure (no DOM writes).
 */
export function getDensityConfig(): DensityConfig {
  const mode = getDensityMode();
  const base = DENSITY_PRESETS[mode];
  const keys = Object.keys(base) as (keyof DensityConfig)[];
  const out = { ...base };
  for (const key of keys) {
    const raw = safeGet(PER_KEY_STORAGE[key]);
    out[key] = parseCount(raw, base[key]);
  }
  return out;
}

/**
 * Apply any `?density=` + `?density-*=` params found in the given
 * `URLSearchParams` (mutates the object: removes the consumed keys) and
 * returns true if anything changed, so the caller knows to write the
 * cleaned URL back.
 */
export function applyDensityQueryParams(params: URLSearchParams): boolean {
  let changed = false;
  if (params.has("density")) {
    const raw = params.get("density");
    if (isDensityMode(raw)) {
      setDensityMode(raw);
    } else if (raw === "" || raw === null) {
      setDensityMode(null);
    }
    params.delete("density");
    changed = true;
  }
  for (const [param, configKey] of DENSITY_QUERY_KEYS) {
    if (!params.has(param)) continue;
    const raw = params.get(param);
    setDensityOverride(configKey, raw);
    params.delete(param);
    changed = true;
  }
  return changed;
}

let warnedKeys: Set<string> | null = null;

/**
 * Warn (once per key per page load) when a requested density count is capped
 * because the row doesn't produce enough distinct items. Dev-only — silent
 * in production builds so the console stays clean for end users.
 */
export function warnDensityCapped(
  rowId: string,
  key: keyof DensityConfig,
  requested: number,
  capped: number,
): void {
  if (typeof window === "undefined") return;
  // Vite injects `import.meta.env.DEV` at build time.
  const isDev =
    typeof import.meta !== "undefined" &&
    (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;
  if (!isDev) return;
  const warnKey = `${rowId}:${key}`;
  if (!warnedKeys) warnedKeys = new Set();
  if (warnedKeys.has(warnKey)) return;
  warnedKeys.add(warnKey);
  // eslint-disable-next-line no-console
  console.info(
    `[lessonDensity] ${rowId}: ${key} requested ${requested}, capped at ${capped} (not enough content).`,
  );
}

/** Test-only: reset the dev-warning dedupe set. */
export function __resetDensityWarnings(): void {
  warnedKeys = null;
}
