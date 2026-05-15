import type { GlyphData, SymbolReference } from "./types";

/**
 * Pixel-space stroke thickness used to rasterize skeletal KanjiVG paths into a
 * comparison mask. Picked to roughly match a learner's drawing-canvas stroke
 * width. Treat as a calibration knob — pair with the existing
 * `drawingComparison` coverage/overflow thresholds. Increasing it makes the
 * mask fatter and trace easier.
 */
const DEFAULT_STROKE_PX = 12;

/**
 * Reference backed by bundled per-stroke path data (KanjiVG-style). Renders
 * deterministically across systems — same pixels everywhere given the same
 * canvas size.
 *
 * The output is a stroked centerline rasterized to the destination canvas;
 * `drawingComparison` reads back the alpha/luminance mask exactly as it did
 * for the legacy `fillText` reference, so the downstream math is unchanged.
 */
export function svgReference(glyph: GlyphData): SymbolReference {
  return {
    glyph,
    renderTo(ctx, width, height, opts) {
      const lineWidthPx = opts?.lineWidth ?? DEFAULT_STROKE_PX;
      const [vbMinX, vbMinY, vbW, vbH] = glyph.viewBox;
      const scale = Math.min(width / vbW, height / vbH);
      const offsetX = (width - vbW * scale) / 2 - vbMinX * scale;
      const offsetY = (height - vbH * scale) / 2 - vbMinY * scale;

      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      // After scale, lineWidth is also scaled. Compensate so the rasterized
      // stroke width stays in destination-pixel space.
      ctx.lineWidth = lineWidthPx / scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const stroke of glyph.strokes) {
        const p = new Path2D(stroke.d);
        ctx.stroke(p);
      }
      ctx.restore();
    },
  };
}
