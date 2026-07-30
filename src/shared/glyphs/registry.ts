import type { GlyphData, SymbolReference } from "./types";
import { systemFontReference } from "./systemFontReference";
import { svgReference } from "./svgReference";

/**
 * Script identifier used by alphabets to opt into bundled glyph data. Strings
 * deliberately match the `AlphabetDef.id` they appear in.
 */
export type ScriptId = "hiragana" | "katakana" | "hangul" | "kanji" | string;

type GlyphFile = {
  viewBox: [number, number, number, number];
  characters: Record<string, { strokes: Array<{ d: string; start: [number, number] }> }>;
};

type GlyphSource = () => Promise<GlyphFile>;

/**
 * Lazy-loaded glyph data — Vite splits these into separate chunks. Add a new
 * script by writing `data/<script>.json` and registering it here.
 */
const SCRIPT_LOADERS: Record<string, GlyphSource> = {
  hiragana: () =>
    import("./data/hiragana.json").then((m) => m.default as unknown as GlyphFile),
  katakana: () =>
    import("./data/katakana.json").then((m) => m.default as unknown as GlyphFile),
  hangul: () =>
    import("./data/hangul.json").then((m) => m.default as unknown as GlyphFile),
  // The N5_KANJI catalog (n5 + exposure tiers), 147 glyphs / ~120 KB. NOT an
  // alphabet — no AlphabetDef points at it and there is no kanji trace/produce
  // step (recognition-only is policy). It exists so reading surfaces can draw a
  // kanji stroke by stroke; keep it out of any production/drawing path.
  kanji: () =>
    import("./data/kanji.json").then((m) => m.default as unknown as GlyphFile),
};

const cache = new Map<string, Promise<GlyphFile>>();

function loadScript(scriptId: string): Promise<GlyphFile> | null {
  const loader = SCRIPT_LOADERS[scriptId];
  if (!loader) return null;
  let p = cache.get(scriptId);
  if (!p) {
    p = loader();
    cache.set(scriptId, p);
  }
  return p;
}

export function hasBundledData(scriptId: string | undefined): boolean {
  return Boolean(scriptId && SCRIPT_LOADERS[scriptId]);
}

/**
 * Resolve a reference for a symbol. Returns the bundled SVG-backed reference
 * if data exists for the script and character; otherwise falls back to the
 * system-font reference (non-deterministic but always works).
 *
 * The promise resolves once the script's glyph file is loaded (cached after
 * first call). Call sites should kick this off in an effect and render only
 * after it resolves.
 */
export async function getReferenceFor(
  scriptId: string | undefined,
  symbol: string,
): Promise<SymbolReference> {
  if (scriptId) {
    const filePromise = loadScript(scriptId);
    if (filePromise) {
      const file = await filePromise;
      const entry = file.characters[symbol];
      if (entry) {
        const glyph: GlyphData = {
          viewBox: file.viewBox,
          strokes: entry.strokes,
        };
        return svgReference(glyph);
      }
    }
  }
  return systemFontReference(symbol);
}

/**
 * Raw stroke data for one character, or `null` when the script has no bundled
 * file or the file has no entry for it.
 *
 * `getReferenceFor` wraps the same data in a canvas-drawing `SymbolReference`
 * (and silently substitutes a system-font reference on a miss, which is right
 * for tracing and wrong for animation — a font fallback has no strokes to
 * animate). Callers that render strokes themselves — e.g. an SVG
 * `stroke-dashoffset` draw-on — want this instead, and want the null so they
 * can fall back to plain text rather than animate nothing.
 */
export async function getGlyphData(
  scriptId: string | undefined,
  symbol: string,
): Promise<GlyphData | null> {
  if (!scriptId) return null;
  const filePromise = loadScript(scriptId);
  if (!filePromise) return null;
  const file = await filePromise;
  const entry = file.characters[symbol];
  if (!entry) return null;
  return { viewBox: file.viewBox, strokes: entry.strokes };
}

/** Synchronous fallback — used when the async load hasn't resolved yet. */
export function getSystemFontReferenceFor(symbol: string): SymbolReference {
  return systemFontReference(symbol);
}
