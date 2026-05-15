import type { GlyphData } from "./types";

/**
 * Canvas-side stroke-order rendering helpers.
 *
 * All functions assume the canvas context already has the viewBox-to-canvas
 * transform applied externally — they treat (0,0)..(w,h) as the destination
 * pixel-space and compute their own scale from the glyph viewBox.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

let _measureSvg: SVGSVGElement | null = null;
let _measurePath: SVGPathElement | null = null;
const _lengthCache = new Map<string, number>();

/** Cached `SVGPathElement.getTotalLength` for a `d` string. */
export function getPathLength(d: string): number {
  const cached = _lengthCache.get(d);
  if (cached !== undefined) return cached;
  if (typeof document === "undefined") return 0;
  if (!_measureSvg || !_measurePath) {
    _measureSvg = document.createElementNS(SVG_NS, "svg");
    _measureSvg.style.position = "absolute";
    _measureSvg.style.visibility = "hidden";
    _measureSvg.style.pointerEvents = "none";
    _measureSvg.style.left = "-9999px";
    _measureSvg.style.top = "0";
    _measurePath = document.createElementNS(SVG_NS, "path");
    _measureSvg.appendChild(_measurePath);
    document.body.appendChild(_measureSvg);
  }
  _measurePath.setAttribute("d", d);
  const length = _measurePath.getTotalLength();
  _lengthCache.set(d, length);
  return length;
}

type ProjectFn = (x: number, y: number) => { x: number; y: number };

/** Compute the transform from glyph viewBox space to destination pixel-space. */
function buildProjector(glyph: GlyphData, width: number, height: number): {
  scale: number;
  offsetX: number;
  offsetY: number;
  project: ProjectFn;
} {
  const [vbMinX, vbMinY, vbW, vbH] = glyph.viewBox;
  const scale = Math.min(width / vbW, height / vbH);
  const offsetX = (width - vbW * scale) / 2 - vbMinX * scale;
  const offsetY = (height - vbH * scale) / 2 - vbMinY * scale;
  const project: ProjectFn = (x, y) => ({
    x: x * scale + offsetX,
    y: y * scale + offsetY,
  });
  return { scale, offsetX, offsetY, project };
}

export type StrokeNumberStyle = {
  /** Radius of the circle in destination-pixel space. */
  radius?: number;
  /** Circle fill color. */
  fillColor?: string;
  /** Circle outline color. */
  strokeColor?: string;
  /** Number text color. */
  textColor?: string;
  /** Font size for the number, in destination pixels. */
  fontSize?: number;
};

/**
 * Draw small numbered circles at each stroke's start point. Use as a passive
 * always-on guide telling the learner where each stroke begins.
 */
export function renderStrokeNumbers(
  ctx: CanvasRenderingContext2D,
  glyph: GlyphData,
  width: number,
  height: number,
  style: StrokeNumberStyle = {},
): void {
  const radius = style.radius ?? 11;
  const fillColor = style.fillColor ?? "#0ea5e9"; // sky-500
  const strokeColor = style.strokeColor ?? "#ffffff";
  const textColor = style.textColor ?? "#ffffff";
  const fontSize = style.fontSize ?? 12;

  const { project } = buildProjector(glyph, width, height);

  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < glyph.strokes.length; i++) {
    const [sx, sy] = glyph.strokes[i].start;
    const { x, y } = project(sx, sy);
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.fillText(String(i + 1), x, y + 0.5);
  }
  ctx.restore();
}

export type StrokeAnimationFrame = {
  /** Index of the stroke currently being drawn. */
  strokeIndex: number;
  /** Progress through that stroke, 0..1. Strokes < strokeIndex are full. */
  strokeProgress: number;
};

export type StrokeProgressiveStyle = {
  /** Pixel-space stroke thickness for finished strokes. */
  lineWidth?: number;
  /** Color of finished strokes. */
  completedColor?: string;
  /** Color of the currently-animating stroke. */
  activeColor?: string;
};

/**
 * Draw the glyph progressively — strokes before `frame.strokeIndex` rendered
 * fully in completedColor, the current stroke rendered up to `strokeProgress`
 * in activeColor.
 */
export function renderStrokesProgressive(
  ctx: CanvasRenderingContext2D,
  glyph: GlyphData,
  width: number,
  height: number,
  frame: StrokeAnimationFrame,
  style: StrokeProgressiveStyle = {},
): void {
  if (!glyph.strokes || glyph.strokes.length === 0) return;

  const lineWidthPx = style.lineWidth ?? 10;
  const completedColor = style.completedColor ?? "#374151"; // gray-700
  const activeColor = style.activeColor ?? "#0ea5e9"; // sky-500

  // Defensive bounds: frame may have been computed against a previous glyph
  // (StrictMode remount, async data swap, etc). Clamp every read.
  const total = glyph.strokes.length;
  const safeStrokeIndex = Math.max(
    0,
    Math.min(total, Math.floor(frame.strokeIndex || 0)),
  );
  const safeStrokeProgress = Math.max(0, Math.min(1, frame.strokeProgress || 0));

  const { scale } = buildProjector(glyph, width, height);
  const [, , vbW, vbH] = glyph.viewBox;
  const offsetX = (width - vbW * scale) / 2 - glyph.viewBox[0] * scale;
  const offsetY = (height - vbH * scale) / 2 - glyph.viewBox[1] * scale;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.lineWidth = lineWidthPx / scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Completed strokes
  ctx.setLineDash([]);
  ctx.strokeStyle = completedColor;
  for (let i = 0; i < safeStrokeIndex; i++) {
    const stroke = glyph.strokes[i];
    if (!stroke?.d) continue;
    ctx.stroke(new Path2D(stroke.d));
  }

  // Active (partial) stroke
  if (safeStrokeIndex < total && safeStrokeProgress > 0) {
    const stroke = glyph.strokes[safeStrokeIndex];
    if (stroke?.d) {
      const len = getPathLength(stroke.d);
      ctx.strokeStyle = activeColor;
      if (len > 0 && safeStrokeProgress < 1) {
        ctx.setLineDash([len, len]);
        ctx.lineDashOffset = len * (1 - safeStrokeProgress);
      } else {
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      }
      ctx.stroke(new Path2D(stroke.d));
    }
  }
  ctx.restore();
}
