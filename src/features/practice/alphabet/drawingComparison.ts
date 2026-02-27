/**
 * Compare a user's canvas drawing to a reference symbol using a simple
 * coverage/overflow metric:
 *
 * - Layer 1 (background + template) is ignored for scoring.
 * - Layer 2 (user strokes) is compared against the template:
 *   - Dilate both template and user by TEMPLATE_COVERAGE_DILATE_RADIUS.
 *   - Compute templateCoverage = how many template pixels are covered by dilated user.
 *   - Dilate template by TEMPLATE_COVERAGE_DILATE_RADIUS + OVERFLOW_EXTRA_RADIUS
 *     to form an "allowed" box; any user pixels outside this box are overflow.
 *   - Compute overflowFraction = overflowUserPixels / userStrokePixels.
 *   - Score = templateCoverage * (1 - overflowFraction).
 *   - Pass when:
 *       templateCoverage >= TEMPLATE_COVERAGE_PASS_THRESHOLD
 *       overflowFraction <= MAX_OVERFLOW_FRACTION
 *       userStrokePixels >= MIN_STROKE_PIXELS
 *
 * Tunable factors are defined below.
 */
const REFERENCE_FONT = "90px sans-serif";
const WIDTH = 280;
const HEIGHT = 200;

/** Luminance (0–1). Pixels below this are treated as "stroke". */
const STROKE_LUMINANCE_THRESHOLD = 0.45;
/** Minimum number of stroke pixels the user must draw (avoids passing with a dot). */
const MIN_STROKE_PIXELS = 80;
/** Radius (in logical template space) to dilate template & user for coverage comparison. */
const TEMPLATE_COVERAGE_DILATE_RADIUS = 5;
/** Extra radius beyond coverage region that defines the allowed drawing box. */
const OVERFLOW_EXTRA_RADIUS = 8;
/** Require at least this fraction of template pixels (after dilation) to be covered to pass. */
const TEMPLATE_COVERAGE_PASS_THRESHOLD = 0.8;
/** Max fraction of user strokes allowed outside the allowed region. */
const MAX_OVERFLOW_FRACTION = 0.25;
/** Toggle detailed logging of drawing comparison (via ?alphabetDebugLog=1). */
const ENABLE_DRAWING_DEBUG_LOG =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("alphabetDebugLog") === "1";

function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Pixels with alpha above this are considered drawn (used for drawing layer with transparent bg). */
const USER_STROKE_ALPHA_MIN = 50;

function getStrokeMask(
  imageData: ImageData,
  width: number,
  height: number,
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
  height: number,
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
  radius: number,
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
  height: number,
): void {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "black";
  ctx.font = REFERENCE_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, width / 2, height / 2);
}

function renderDebugMasks(
  width: number,
  height: number,
  templateMask: Uint8Array,
  userMask: Uint8Array,
): void {
  if (typeof document === "undefined") return;

  const canvasId = "drawing-debug-canvas";
  let canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = canvasId;
    canvas.style.position = "fixed";
    canvas.style.bottom = "8px";
    canvas.style.right = "8px";
    canvas.style.border = "1px solid #4b5563";
    canvas.style.backgroundColor = "#111827";
    canvas.style.zIndex = "9999";
    canvas.style.width = "200px";
    canvas.style.height = "auto";
    document.body.appendChild(canvas);
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < width * height; i++) {
    const t = templateMask[i] === 1;
    const u = userMask[i] === 1;
    const idx = i * 4;

    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;

    if (t && !u) {
      // Template-only (dilated template): teal
      r = 56;
      g = 189;
      b = 248;
      a = 180;
    } else if (!t && u) {
      // User-only (dilated user): orange
      r = 249;
      g = 115;
      b = 22;
      a = 200;
    } else if (t && u) {
      // Overlap: bright purple
      r = 192;
      g = 132;
      b = 252;
      a = 220;
    } else {
      // Background: transparent
      r = 0;
      g = 0;
      b = 0;
      a = 0;
    }

    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = a;
  }

  ctx.putImageData(imageData, 0, 0);
}

export type CompareResult = {
  pass: boolean;
  score: number;
  userStrokePixels: number;
};

type Corner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

function getBoundingBox(
  mask: Uint8Array,
  width: number,
  height: number,
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] === 1) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1 || maxY === -1) return null;
  return { minX, minY, maxX, maxY };
}

function getCornerPoint(
  box: { minX: number; minY: number; maxX: number; maxY: number },
  corner: Corner,
): { x: number; y: number } {
  switch (corner) {
    case "topLeft":
      return { x: box.minX, y: box.minY };
    case "topRight":
      return { x: box.maxX, y: box.minY };
    case "bottomLeft":
      return { x: box.minX, y: box.maxY };
    case "bottomRight":
      return { x: box.maxX, y: box.maxY };
  }
}

function translateMask(
  mask: Uint8Array,
  width: number,
  height: number,
  dx: number,
  dy: number,
): Uint8Array {
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] !== 1) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        out[ny * width + nx] = 1;
      }
    }
  }
  return out;
}

/**
 * Compare the user's canvas drawing to the expected symbol.
 * Returns pass=true if overlap score meets threshold and they drew enough.
 * Handles devicePixelRatio: uses actual buffer dimensions for comparison.
 */
export function compareDrawingToSymbol(
  userCanvas: HTMLCanvasElement,
  symbol: string,
  options?: {
    minStrokePixels?: number;
  },
): CompareResult {
  const minStrokePixels = options?.minStrokePixels ?? MIN_STROKE_PIXELS;

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
  const refCount = refMask.reduce((a, b) => a + b, 0);

  // ----- New scoring: coverage vs overflow -----

  // Template coverage region: dilate the template so a correctly drawn, slightly thicker or misaligned stroke
  // still counts as "on template".
  const coverageRadius = Math.max(
    1,
    Math.round(TEMPLATE_COVERAGE_DILATE_RADIUS * dpr),
  );
  const userDilatedForTemplateCoverage = dilateMask(
    userMask,
    width,
    height,
    coverageRadius,
  );

  const templatePixelCount = refMask.reduce((a, b) => a + b, 0);

  // How many template pixels (before dilation) are covered by the dilated user stroke?
  let coveredTemplatePixels = 0;
  for (let i = 0; i < width * height; i++) {
    if (refMask[i] === 1 && userDilatedForTemplateCoverage[i] === 1) {
      coveredTemplatePixels++;
    }
  }

  const templateCoverage =
    templatePixelCount > 0 ? coveredTemplatePixels / templatePixelCount : 0;

  // Overflow region: template dilated by coverageRadius + OVERFLOW_EXTRA_RADIUS.
  // Anything outside this region is considered "scribble".
  const overflowRadius = Math.max(
    1,
    Math.round((TEMPLATE_COVERAGE_DILATE_RADIUS + OVERFLOW_EXTRA_RADIUS) * dpr),
  );
  const allowedRegion = dilateMask(refMask, width, height, overflowRadius);

  let overflowUserPixels = 0;
  for (let i = 0; i < width * height; i++) {
    if (userMask[i] === 1 && allowedRegion[i] === 0) {
      overflowUserPixels++;
    }
  }

  const overflowFraction = userCount > 0 ? overflowUserPixels / userCount : 0;

  // Final score: mostly "how much of the template did you fill", reduced by overflow.
  // This stays in [0, 1] and you can display it as a percentage.
  let score = templateCoverage * (1 - overflowFraction);
  score = Math.max(0, Math.min(1, score));

  const pass =
    templateCoverage >= TEMPLATE_COVERAGE_PASS_THRESHOLD &&
    overflowFraction <= MAX_OVERFLOW_FRACTION &&
    userCount >= minStrokePixels;

  if (ENABLE_DRAWING_DEBUG_LOG) {
    renderDebugMasks(
      width,
      height,
      dilateMask(refMask, width, height, coverageRadius),
      userDilatedForTemplateCoverage,
    );

    console.log("[drawingComparison]", {
      symbol,
      pass,
      score: Math.round(score * 1000) / 1000,
      scorePercent: `${(score * 100).toFixed(1)}%`,
      templateCoverage: Math.round(templateCoverage * 1000) / 1000,
      overflowFraction: Math.round(overflowFraction * 1000) / 1000,
      coveredTemplatePixels,
      templatePixelCount,
      overflowUserPixels,
      userStrokePixels: userCount,
      referenceStrokePixels: refCount,
      templateCoveragePassThreshold: TEMPLATE_COVERAGE_PASS_THRESHOLD,
      maxOverflowFraction: MAX_OVERFLOW_FRACTION,
      canvasSize: `${width}x${height}`,
      ...(pass ? {} : { reason: "coverage_or_overflow" }),
    });
  }

  return {
    pass,
    score,
    userStrokePixels: userCount,
  };
}

const PRODUCTION_TEMPLATE_COVERAGE_PASS_THRESHOLD = 0.6;
const PRODUCTION_MAX_OVERFLOW_FRACTION = 0.4;
const PRODUCTION_MIN_SCORE = 0.6;

export function compareProductionDrawingToSymbol(
  userCanvas: HTMLCanvasElement,
  symbol: string,
  options?: {
    minStrokePixels?: number;
  },
): CompareResult {
  const minStrokePixels = options?.minStrokePixels ?? MIN_STROKE_PIXELS;

  const width = userCanvas.width;
  const height = userCanvas.height;
  const userCtx = userCanvas.getContext("2d", { willReadFrequently: true });
  if (!userCtx) return { pass: false, score: 0, userStrokePixels: 0 };

  const userImageData = userCtx.getImageData(0, 0, width, height);
  const userMask = getUserStrokeMask(userImageData, width, height);
  const userCount = userMask.reduce((a, b) => a + b, 0);

  if (userCount < minStrokePixels) {
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

  const templatePixelCount = refMask.reduce((a, b) => a + b, 0);
  if (templatePixelCount === 0) {
    return { pass: false, score: 0, userStrokePixels: userCount };
  }

  const userBox = getBoundingBox(userMask, width, height);
  const refBox = getBoundingBox(refMask, width, height);
  if (!userBox || !refBox) {
    return { pass: false, score: 0, userStrokePixels: userCount };
  }

  const dprCoverageRadius = Math.max(
    1,
    Math.round(TEMPLATE_COVERAGE_DILATE_RADIUS * dpr),
  );
  const overflowRadius = Math.max(
    1,
    Math.round((TEMPLATE_COVERAGE_DILATE_RADIUS + OVERFLOW_EXTRA_RADIUS) * dpr),
  );
  const allowedRegion = dilateMask(refMask, width, height, overflowRadius);

  const corners: Corner[] = [
    "topLeft",
    "topRight",
    "bottomLeft",
    "bottomRight",
  ];

  let bestScore = 0;
  let bestPass = false;

  for (const corner of corners) {
    const userCorner = getCornerPoint(userBox, corner);
    const refCorner = getCornerPoint(refBox, corner);
    const dx = refCorner.x - userCorner.x;
    const dy = refCorner.y - userCorner.y;

    const alignedUserMask = translateMask(userMask, width, height, dx, dy);
    const alignedUserDilated = dilateMask(
      alignedUserMask,
      width,
      height,
      dprCoverageRadius,
    );

    let coveredTemplatePixels = 0;
    let overflowUserPixels = 0;

    for (let i = 0; i < width * height; i++) {
      if (refMask[i] === 1 && alignedUserDilated[i] === 1) {
        coveredTemplatePixels++;
      }
      if (alignedUserMask[i] === 1 && allowedRegion[i] === 0) {
        overflowUserPixels++;
      }
    }

    const templateCoverage =
      templatePixelCount > 0 ? coveredTemplatePixels / templatePixelCount : 0;
    const overflowFraction =
      userCount > 0 ? overflowUserPixels / userCount : 0;

    let score = templateCoverage * (1 - overflowFraction);
    score = Math.max(0, Math.min(1, score));

    const pass =
      templateCoverage >= PRODUCTION_TEMPLATE_COVERAGE_PASS_THRESHOLD &&
      overflowFraction <= PRODUCTION_MAX_OVERFLOW_FRACTION &&
      score >= PRODUCTION_MIN_SCORE &&
      userCount >= minStrokePixels;

    if (score > bestScore || (pass && !bestPass)) {
      bestScore = score;
      bestPass = pass;
    }
  }

  return {
    pass: bestPass,
    score: bestScore,
    userStrokePixels: userCount,
  };
}
