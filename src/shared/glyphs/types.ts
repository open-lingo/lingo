/**
 * Script-agnostic glyph reference types.
 *
 * A {@link SymbolReference} is the contract `drawingComparison` and
 * `DrawingCanvas` use to render a target glyph — either as a comparison mask
 * for scoring, or as the faded guide layer the learner traces over.
 *
 * Two backends today:
 *   - {@link systemFontReference}: legacy `fillText("90px sans-serif", …)` —
 *     non-deterministic across OSes; used as the fallback when a script has no
 *     bundled data.
 *   - {@link svgReference}: deterministic KanjiVG-style stroke data — used for
 *     hiragana, katakana, and Hangul jamo today; further scripts plug in by
 *     shipping data and setting `hasStrokeOrder: true` in their AlphabetDef.
 */

export type StrokePoint = readonly [number, number];

export type StrokeData = {
  /** SVG path `d` attribute. Coordinates in the glyph's source viewBox. */
  d: string;
  /** First point of the stroke (parsed from the leading `M` command). */
  start: StrokePoint;
};

export type GlyphData = {
  /** Source viewBox as `[minX, minY, width, height]`. KanjiVG is `[0,0,109,109]`. */
  viewBox: readonly [number, number, number, number];
  /** Strokes in canonical draw order. */
  strokes: readonly StrokeData[];
};

export type SymbolReferenceRenderOpts = {
  /** Pixel line width for stroked path implementations. Ignored by text. */
  lineWidth?: number;
};

export type SymbolReference = {
  /**
   * Render the symbol's filled / stroked shape onto `ctx` at the given CSS
   * pixel dimensions. The caller sets `fillStyle` / `strokeStyle` first; this
   * method only emits geometry.
   *
   * Used to build the comparison mask in `drawingComparison`.
   */
  renderTo(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    opts?: SymbolReferenceRenderOpts,
  ): void;
  /** Stroke-order data when available, else `null`. */
  glyph: GlyphData | null;
};
