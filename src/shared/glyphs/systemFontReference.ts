import type { SymbolReference } from "./types";

/**
 * Fallback reference for scripts without bundled glyph data (Latin, Hangul
 * pre-data-bundle, etc). Renders via `fillText` in the OS-resolved `sans-serif`
 * family. Not deterministic across systems — this is the legacy behavior, kept
 * so unsupported scripts keep working unchanged.
 *
 * If `fontSize` is not provided, the glyph auto-scales to roughly fill the
 * destination canvas (45% of the shorter side).
 */
export function systemFontReference(
  symbol: string,
  fontSize?: number,
): SymbolReference {
  return {
    glyph: null,
    renderTo(ctx, width, height) {
      const size = fontSize ?? Math.round(Math.min(width, height) * 0.45);
      ctx.save();
      ctx.font = `${size}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(symbol, width / 2, height / 2);
      ctx.restore();
    },
  };
}
