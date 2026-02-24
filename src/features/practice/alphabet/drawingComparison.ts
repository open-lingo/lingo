/**
 * Compare a user's canvas drawing to a reference symbol using overlap scoring.
 * No external library: render reference to an offscreen canvas, binarize both,
 * dilate the reference for tolerance, then score overlap.
 */

const REFERENCE_FONT = "80px sans-serif";
const WIDTH = 280;
const HEIGHT = 200;

/** Luminance (0–1). Pixels below this are treated as "stroke". */
const STROKE_LUMINANCE_THRESHOLD = 0.45;
/** Minimum number of stroke pixels the user must draw (avoids passing with a dot). */
const MIN_STROKE_PIXELS = 80;
/** Pass when final score >= this. 0.75 = require 75%+ to pass. */
const OVERLAP_PASS_THRESHOLD = 0.75;
/** Pixels to dilate the reference mask so thick strokes and slight offsets still score high (~85% for a good trace). */
const DILATE_RADIUS = 12;
/** When measuring "ref covered", dilate the user stroke by this much only. Small = partial traces score low. */
const REF_COVERAGE_USER_DILATE = 3;
/** Max "scale up" for overlap check: dilate user by this (≈2×) for slightly more forgiving overlap. */
const REF_COVERAGE_SCALE_UP_RADIUS = 7;
/** Combined score: weight scaled template overlap higher than plain score. (0.55 = 55% scaled, 45% plain.) */
const SCALED_OVERLAP_WEIGHT = 0.55;
/** Penalty for template pixels still unfilled after scaling. finalScore *= (1 - this * (1 - referenceCoverageScaled)). */
const UNFILLED_PENALTY = 0.7;
/** Coverage ceiling: score cannot exceed coverage/this. 0.5 = less extreme (need 50%+ drawn for full score). */
const MIN_COVERAGE_FOR_FULL_CREDIT = 0.5;

function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Pixels with alpha above this are considered drawn (used for drawing layer with transparent bg). */
const USER_STROKE_ALPHA_MIN = 50;

function getStrokeMask(
  imageData: ImageData,
  width: number,
  height: number
): Uint8Array {
  const mask = new Uint8Array(width * height);
  const d = imageData.data;
  for (let i = 0; i < width * height; i++) {
    const r = d[i * 4];
    const g = d[i * 4 + 1];
    const b = d[i * 4 + 2];
    mask[i] = luminance(r, g, b) < STROKE_LUMINANCE_THRESHOLD ? 1 : 0;
  }
  return mask;
}

/** User drawing layer: only opaque + dark pixels count (ignores transparent background and template). */
function getUserStrokeMask(
  imageData: ImageData,
  width: number,
  height: number
): Uint8Array {
  const mask = new Uint8Array(width * height);
  const d = imageData.data;
  for (let i = 0; i < width * height; i++) {
    const r = d[i * 4];
    const g = d[i * 4 + 1];
    const b = d[i * 4 + 2];
    const a = d[i * 4 + 3];
    const opaque = a >= USER_STROKE_ALPHA_MIN;
    const dark = luminance(r, g, b) < STROKE_LUMINANCE_THRESHOLD;
    mask[i] = opaque && dark ? 1 : 0;
  }
  return mask;
}

function dilateMask(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array {
  const out = new Uint8Array(mask);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] !== 1) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            out[ny * width + nx] = 1;
          }
        }
      }
    }
  }
  return out;
}

function renderReferenceToCanvas(
  ctx: CanvasRenderingContext2D,
  symbol: string,
  width: number,
  height: number
): void {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "black";
  ctx.font = REFERENCE_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, width / 2, height / 2);
}

export type CompareResult = {
  pass: boolean;
  score: number;
  userStrokePixels: number;
};

/**
 * Compare the user's canvas drawing to the expected symbol.
 * Returns pass=true if overlap score meets threshold and they drew enough.
 * Handles devicePixelRatio: uses actual buffer dimensions for comparison.
 */
export function compareDrawingToSymbol(
  userCanvas: HTMLCanvasElement,
  symbol: string,
  options?: {
    overlapThreshold?: number;
    minStrokePixels?: number;
    dilateRadius?: number;
  }
): CompareResult {
  const overlapThreshold = options?.overlapThreshold ?? OVERLAP_PASS_THRESHOLD;
  const minStrokePixels = options?.minStrokePixels ?? MIN_STROKE_PIXELS;
  const dilateRadius = options?.dilateRadius ?? DILATE_RADIUS;

  const width = userCanvas.width;
  const height = userCanvas.height;
  const userCtx = userCanvas.getContext("2d", { willReadFrequently: true });
  if (!userCtx) return { pass: false, score: 0, userStrokePixels: 0 };

  const userImageData = userCtx.getImageData(0, 0, width, height);
  const userMask = getUserStrokeMask(userImageData, width, height);
  const userCount = userMask.reduce((a, b) => a + b, 0);

  if (userCount < minStrokePixels) {
    console.log("[drawingComparison]", {
      symbol,
      pass: false,
      reason: "too_few_stroke_pixels",
      userStrokePixels: userCount,
      minRequired: minStrokePixels,
      canvasSize: `${width}x${height}`,
    });
    return { pass: false, score: 0, userStrokePixels: userCount };
  }

  const refCanvas = document.createElement("canvas");
  refCanvas.width = width;
  refCanvas.height = height;
  const refCtx = refCanvas.getContext("2d", { willReadFrequently: true });
  if (!refCtx) return { pass: false, score: 0, userStrokePixels: userCount };

  const dpr = width / WIDTH;
  refCtx.scale(dpr, dpr);
  renderReferenceToCanvas(refCtx, symbol, WIDTH, HEIGHT);
  refCtx.setTransform(1, 0, 0, 1, 0, 0);
  const refImageData = refCtx.getImageData(0, 0, width, height);
  const refMask = getStrokeMask(refImageData, width, height);
  const refDilated = dilateMask(refMask, width, height, Math.max(1, Math.round(dilateRadius * dpr)));

  const refCount = refMask.reduce((a, b) => a + b, 0);
  const refDilatedCount = refDilated.reduce((a, b) => a + b, 0);
  const userDilatedForCoverage = dilateMask(
    userMask,
    width,
    height,
    Math.max(1, Math.round(REF_COVERAGE_USER_DILATE * dpr))
  );
  const userDilatedScaledUp = dilateMask(
    userMask,
    width,
    height,
    Math.max(1, Math.round(REF_COVERAGE_SCALE_UP_RADIUS * dpr))
  );

  // User-on-target: user pixels that fall inside dilated reference (for precision).
  let overlap = 0;
  for (let i = 0; i < width * height; i++) {
    if (userMask[i] === 1 && refDilated[i] === 1) overlap++;
  }
  // Ref-covered: reference pixels that the user actually drew over (tight dilation so partials score low).
  let refCovered = 0;
  for (let i = 0; i < width * height; i++) {
    if (refMask[i] === 1 && userDilatedForCoverage[i] === 1) refCovered++;
  }
  // Scaled-up coverage: with user stroke "scaled" up to ~1.3–1.5×, what fraction of template is covered? Pass requires ≥90%.
  let refCoveredScaled = 0;
  for (let i = 0; i < width * height; i++) {
    if (refMask[i] === 1 && userDilatedScaledUp[i] === 1) refCoveredScaled++;
  }
  const referenceCoverageScaled = refCount > 0 ? refCoveredScaled / refCount : 0;

  // Precision: what fraction of the user's stroke is on target.
  const precision = userCount > 0 ? overlap / userCount : 0;
  // Reference coverage: what fraction of the reference stroke did they draw over.
  const referenceCoverage = refCount > 0 ? Math.min(1, refCovered / refCount) : 0;
  // Weighted blend: precision (on-target) + coverage (how much of shape they drew). Then cap by coverage so single-stroke partials can't pass.
  const sizeRatio =
    refCount > 0 ? Math.min(userCount, refCount) / Math.max(userCount, refCount) : 0;
  const PRECISION_WEIGHT = 0.65;
  const COVERAGE_WEIGHT = 0.35;
  let score = PRECISION_WEIGHT * precision + COVERAGE_WEIGHT * referenceCoverage;
  score = Math.min(1, score + 0.02 * sizeRatio);
  // Cap score by coverage. Use scaled coverage when higher (so a 62% scaled, 30% raw trace can score ~75–80%).
  const effectiveCoverage = Math.max(referenceCoverage, referenceCoverageScaled);
  score = Math.min(score, effectiveCoverage / MIN_COVERAGE_FOR_FULL_CREDIT, 1);
  // Combined metric: plain score + scaled template overlap (overlap weighted higher). Apply unfilled penalty only to the scaled-overlap term so we penalize "still empty after scaling" on the right part.
  const unfilledFractionAfterScaling = 1 - referenceCoverageScaled;
  const scaledOverlapTerm =
    SCALED_OVERLAP_WEIGHT * referenceCoverageScaled * (1 - UNFILLED_PENALTY * unfilledFractionAfterScaling);
  const finalScore = (1 - SCALED_OVERLAP_WEIGHT) * score + scaledOverlapTerm;
  const pass = finalScore >= overlapThreshold;

  const combinedScoreBeforePenalty =
    (1 - SCALED_OVERLAP_WEIGHT) * score + SCALED_OVERLAP_WEIGHT * referenceCoverageScaled;
  const failReason = !pass ? "score_below_threshold" : undefined;
  console.log("[drawingComparison]", {
    symbol,
    pass,
    score: Math.round(finalScore * 1000) / 1000,
    scorePercent: `${(finalScore * 100).toFixed(1)}%`,
    combinedScoreBeforePenalty: Math.round(combinedScoreBeforePenalty * 1000) / 1000,
    plainScore: Math.round(score * 1000) / 1000,
    unfilledPenalty: Math.round((UNFILLED_PENALTY * unfilledFractionAfterScaling) * 1000) / 1000,
    referenceCoverage: Math.round(referenceCoverage * 1000) / 1000,
    referenceCoverageScaled: Math.round(referenceCoverageScaled * 1000) / 1000,
    precision: Math.round(precision * 1000) / 1000,
    refCovered,
    refCoveredScaled,
    sizeRatio: Math.round(sizeRatio * 1000) / 1000,
    overlap,
    userStrokePixels: userCount,
    referenceStrokePixels: refCount,
    referenceDilatedPixels: refDilatedCount,
    threshold: overlapThreshold,
    thresholdPercent: `${(overlapThreshold * 100).toFixed(0)}%`,
    scaledOverlapWeight: SCALED_OVERLAP_WEIGHT,
    canvasSize: `${width}x${height}`,
    ...(failReason ? { reason: failReason } : {}),
  });

  return {
    pass,
    score: finalScore,
    userStrokePixels: userCount,
  };
}
