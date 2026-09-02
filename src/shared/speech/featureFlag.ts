/**
 * Speech-recognition feature flag.
 *
 * Whisper-backed pronunciation is the default for everyone (2026-05-16).
 * `?speech=0` is the explicit opt-out for slow devices / mic-less testers
 * — that override persists in `sessionStorage` so it survives internal
 * navigation. Visit `?speech=1` to clear the override and return to the
 * default. Mirrors the `?dev=` toggle in `LearnPage`.
 *
 * In addition to the main `?speech=` toggle, we expose a small set of
 * dials (also sessionStorage-backed) so Spencer can tune thresholds and
 * the normalization pipeline from the URL bar without rebuilding:
 *
 *   ?speech-perfect=0.85       perfect-tier threshold (default 0.85)
 *   ?speech-close=0.55         close-tier threshold   (default 0.55)
 *   ?speech-strict=1           disable normalization (raw char-overlap)
 *   ?speech-alts=5             number of N-best alternatives to request
 *   ?speech-debug=1            render debug panel under the verdict
 *   ?speech-engine=whisper     pick the on-device Whisper backend
 *                              (default: `web`, the Web Speech API).
 */

const KEY = "lingo_speech_flag_v1";

const PERFECT_KEY = "lingo_speech_perfect_v1";
const CLOSE_KEY = "lingo_speech_close_v1";
const STRICT_KEY = "lingo_speech_strict_v1";
const ALTS_KEY = "lingo_speech_alts_v1";
const DEBUG_KEY = "lingo_speech_debug_v1";
const ENGINE_KEY = "lingo_speech_engine_v1";

export function isSpeechFlagEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    // Default: on. Explicit "0" is the opt-out.
    return window.sessionStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

export function setSpeechFlag(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.sessionStorage.removeItem(KEY); // clear → default (on)
    else window.sessionStorage.setItem(KEY, "0"); // explicit off
  } catch {
    /* storage may be unavailable (private mode); silently ignore */
  }
}

/* -------------------------------------------------------------------------- */
/*  Dials                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Recognition backend. `web` is the Web Speech API (Chrome/Safari/Edge,
 * default). `whisper` is the on-device transformers.js spike (Path B
 * from the speech-research spec). Selectable via `?speech-engine=`.
 */
export type SpeechEngine = "web" | "whisper";

export type SpeechConfig = {
  /** Perfect-tier threshold; ≥ this → verdict "perfect". */
  perfectThreshold: number;
  /** Close-tier threshold; ≥ this and < perfectThreshold → verdict "close". */
  closeThreshold: number;
  /** When true, disable normalization (use raw char-overlap). */
  strict: boolean;
  /** Number of N-best alternatives requested from the API (1-5). */
  maxAlternatives: number;
  /** When true, render the debug panel under the verdict. */
  debug: boolean;
  /** Backend used for speech recognition. */
  engine: SpeechEngine;
};

export const SPEECH_DEFAULTS: SpeechConfig = {
  perfectThreshold: 0.85,
  closeThreshold: 0.55,
  strict: false,
  maxAlternatives: 5,
  debug: false,
  // Web Speech by default. Whisper-small genuinely recognises JA better
  // (kanji/katakana handling, no English phonotactic priors) and stays
  // available via `?speech-engine=whisper` — but it cannot be the DEFAULT for
  // a web app: `Xenova/whisper-small` fetches its weights from HuggingFace at
  // runtime and the smallest quantised encoder+decoder pair is still >300 MB
  // EACH. Shipping that to every learner who taps a speaking step is not a
  // download we can justify.
  //
  // It was also simply broken in production: the CSP has no HuggingFace
  // origin, so the fetch was blocked outright and the default engine could
  // never initialise on app.openlingoapp.com. It only ever worked in
  // `npm run dev`, because the CSP plugin is `apply: "build"`.
  //
  // Native does not consult this dial at all — iOS uses SFSpeechRecognizer
  // (`useNativeSpeechRecognition`), which is on-device and needs no download.
  engine: "web",
};

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
    /* ignore */
  }
}

function parseFloatInRange(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === null) return fallback;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function parseIntInRange(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === null) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

/**
 * Read all dials from sessionStorage, applying defaults. Pure (no DOM
 * writes). Safe to call during render; cheap.
 */
export function getSpeechConfig(): SpeechConfig {
  const rawEngine = safeGet(ENGINE_KEY);
  const engine: SpeechEngine = rawEngine === "whisper" ? "whisper" : "web";
  return {
    perfectThreshold: parseFloatInRange(
      safeGet(PERFECT_KEY),
      SPEECH_DEFAULTS.perfectThreshold,
      0,
      1,
    ),
    closeThreshold: parseFloatInRange(
      safeGet(CLOSE_KEY),
      SPEECH_DEFAULTS.closeThreshold,
      0,
      1,
    ),
    strict: safeGet(STRICT_KEY) === "1",
    maxAlternatives: parseIntInRange(
      safeGet(ALTS_KEY),
      SPEECH_DEFAULTS.maxAlternatives,
      1,
      5,
    ),
    debug: safeGet(DEBUG_KEY) === "1",
    engine,
  };
}

/**
 * Persist a single dial value (or clear it via null). Called by the
 * top-level query-param sync that already drives `?speech=1`.
 */
export function setSpeechConfigValue(
  key: keyof SpeechConfig,
  value: string | null,
): void {
  switch (key) {
    case "perfectThreshold":
      safeSet(PERFECT_KEY, value);
      return;
    case "closeThreshold":
      safeSet(CLOSE_KEY, value);
      return;
    case "strict":
      safeSet(STRICT_KEY, value);
      return;
    case "maxAlternatives":
      safeSet(ALTS_KEY, value);
      return;
    case "debug":
      safeSet(DEBUG_KEY, value);
      return;
    case "engine":
      // Canonicalize to known values; clearing on anything else.
      if (value === "whisper" || value === "web") safeSet(ENGINE_KEY, value);
      else safeSet(ENGINE_KEY, null);
      return;
  }
}

/**
 * Param-name → dial-key mapping for the URL bar.
 *
 * Mirrors the layout of the dials so a top-level route can iterate
 * `?speech-*=` params, persist them, and delete from the URL — same
 * shape as the existing `?speech=1` sync.
 */
export const SPEECH_QUERY_KEYS: ReadonlyArray<
  readonly [string, keyof SpeechConfig]
> = [
  ["speech-perfect", "perfectThreshold"],
  ["speech-close", "closeThreshold"],
  ["speech-strict", "strict"],
  ["speech-alts", "maxAlternatives"],
  ["speech-debug", "debug"],
  ["speech-engine", "engine"],
];

/**
 * Apply any `?speech-*=` params found in the given `URLSearchParams`
 * (mutates the object: removes the consumed keys) and returns true if
 * anything changed, so the caller knows to write the cleaned URL back.
 *
 * Boolean dials accept `1`/`0`; numeric dials accept any parseable
 * number (clamped server-side in `getSpeechConfig`).
 */
export function applySpeechQueryParams(params: URLSearchParams): boolean {
  let changed = false;
  for (const [param, configKey] of SPEECH_QUERY_KEYS) {
    if (!params.has(param)) continue;
    const raw = params.get(param);
    setSpeechConfigValue(configKey, raw);
    params.delete(param);
    changed = true;
  }
  return changed;
}

/**
 * Web Speech API capability check. Some browsers expose
 * `webkitSpeechRecognition` but not `SpeechRecognition`. Firefox exposes
 * neither.
 */
type SpeechWindow = Window & {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
};

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as SpeechWindow;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}
