import {
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  forwardRef,
} from "react";
import type {
  GlyphData,
  StrokeAnimationFrame,
  SymbolReference,
} from "@/shared/glyphs";
import {
  renderStrokeNumbers,
  renderStrokesProgressive,
} from "@/shared/glyphs";

/** Canvas scale: 1.25 = slightly larger box so template and drawing fill more space. */
const CANVAS_SCALE = 1.25;
const DEFAULT_WIDTH = Math.round(280 * CANVAS_SCALE);
const DEFAULT_HEIGHT = Math.round(200 * CANVAS_SCALE);
/** User pen width. Sized to feel substantial on the wider canvas now in use. */
const STROKE_WIDTH = 12;
/** Pixel-space stroke thickness for SVG-backed guide renders. Slightly wider
 *  than the user pen so the template reads as the underlying line you trace. */
const GUIDE_SVG_STROKE_PX = 14;
/** Ink color for the user's drawing (black). */
const STROKE_COLOR = "#000000";
/** Canvas background: darker grey (layer 1 only; ignored in scoring). */
const CANVAS_BG_LIGHT = "#9ca3af"; /* gray-400 */
const CANVAS_BG_DARK = "#4b5563"; /* gray-600 */
/** Guide letter: light grey (layer 1 only; reference for display, not used as "user" stroke). */
const GUIDE_COLOR = "#d1d5db"; /* gray-300 */

export type StrokePoint = { x: number; y: number };
export type UserStroke = { points: StrokePoint[] };

export type DrawingCanvasHandle = {
  clear: () => void;
  /** Drawing-only canvas (transparent bg + user strokes). Use this for validation. */
  getCanvas: () => HTMLCanvasElement | null;
  /**
   * Strokes recorded since the last `clear()`. Each stroke is a list of points
   * in CSS-pixel coordinates relative to the canvas top-left. Use for
   * stroke-aware feedback, animations, or future stroke-order matching.
   */
  getStrokes: () => UserStroke[];
  /**
   * Fade the user's strokes to transparent over `durationMs`, then clear.
   * Honors prefers-reduced-motion (snaps straight to clear). Returns a
   * promise that resolves once the canvas is cleared so callers can gate
   * follow-up work (e.g. re-enabling Check).
   */
  fadeAndClear: (durationMs?: number) => Promise<void>;
};

type Props = {
  width?: number;
  height?: number;
  /**
   * Optional reference to render as a faint guide on layer 1 (trace mode).
   * When null/undefined, no guide is drawn. Use the same {@link SymbolReference}
   * the step view passes to `drawingComparison` so the visible template and the
   * scored mask are pixel-aligned.
   */
  guideReference?: SymbolReference | null;
  guideOpacity?: number;
  /**
   * Stroke data to render the optional overlay layer. Required for both
   * {@link showStrokeNumbers} and {@link animationFrame} to render anything.
   */
  strokeOrderGlyph?: GlyphData | null;
  /** When true, paints numbered circles at stroke start points on the overlay. */
  showStrokeNumbers?: boolean;
  /**
   * When provided, paints a progressive stroke-order animation frame on the
   * overlay (and suppresses {@link showStrokeNumbers}, since active animation
   * already conveys the same information).
   */
  animationFrame?: StrokeAnimationFrame | null;
  onClear?: () => void;
  /**
   * Fires the first time a stroke begins after the canvas has been cleared.
   * Parents use this to gate UI that only makes sense once the user has
   * drawn something (e.g. a "Clear" button).
   */
  onStrokeStart?: () => void;
  className?: string;
  "aria-label"?: string;
};

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  guideReference,
  guideOpacity = 0.25,
  strokeOrderGlyph,
  showStrokeNumbers = false,
  animationFrame = null,
  onClear,
  onStrokeStart,
  className = "",
  "aria-label": ariaLabel = "Drawing area",
}, ref) {
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<UserStroke[]>([]);
  const currentStrokeRef = useRef<UserStroke | null>(null);
  const [fadeStyle, setFadeStyle] = useState<{
    opacity: number;
    durationMs: number;
  }>({ opacity: 1, durationMs: 0 });
  const fadeTimerRef = useRef<number | null>(null);

  const getDrawCtx = useCallback(() => drawCanvasRef.current?.getContext("2d") ?? null, []);

  const clear = useCallback(() => {
    const canvas = drawCanvasRef.current;
    const ctx = getDrawCtx();
    if (!canvas || !ctx) return;
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = [];
    currentStrokeRef.current = null;
    setFadeStyle({ opacity: 1, durationMs: 0 });
    onClear?.();
  }, [getDrawCtx, onClear]);

  const fadeAndClear = useCallback(
    (durationMs = 750): Promise<void> => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion || durationMs <= 0) {
        clear();
        return Promise.resolve();
      }
      // Cancel any in-flight fade before starting a new one.
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      setFadeStyle({ opacity: 0, durationMs });
      return new Promise<void>((resolve) => {
        fadeTimerRef.current = window.setTimeout(() => {
          fadeTimerRef.current = null;
          clear();
          resolve();
        }, durationMs);
      });
    },
    [clear],
  );

  // Cancel any pending fade timer on unmount so we don't touch a torn-down ref.
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      clear,
      getCanvas: () => drawCanvasRef.current,
      getStrokes: () => strokesRef.current,
      fadeAndClear,
    }),
    [clear, fadeAndClear]
  );

  const draw = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = drawCanvasRef.current;
      const ctx = getDrawCtx();
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.stroke();
      currentStrokeRef.current?.points.push({ x, y });
    },
    [getDrawCtx]
  );

  const startStroke = useCallback(() => {
    const ctx = getDrawCtx();
    if (!ctx) return;
    isDrawingRef.current = true;
    ctx.beginPath();
    const stroke: UserStroke = { points: [] };
    currentStrokeRef.current = stroke;
    // Fire onStrokeStart on the transition from 0 → 1 strokes so parents can
    // flip a "has drawn anything" flag without re-firing for every stroke.
    const isFirstStroke = strokesRef.current.length === 0;
    strokesRef.current.push(stroke);
    if (isFirstStroke) onStrokeStart?.();
  }, [getDrawCtx, onStrokeStart]);

  const endStroke = useCallback(() => {
    isDrawingRef.current = false;
    currentStrokeRef.current = null;
    const ctx = getDrawCtx();
    if (ctx) ctx.beginPath();
  }, [getDrawCtx]);

  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.clearRect(0, 0, width, height);
  }, [width, height]);

  useEffect(() => {
    const canvas = guideCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!guideReference) {
      return;
    }

    ctx.save();
    ctx.fillStyle = GUIDE_COLOR;
    ctx.strokeStyle = GUIDE_COLOR;
    ctx.globalAlpha = guideOpacity;
    guideReference.renderTo(ctx, width, height, { lineWidth: GUIDE_SVG_STROKE_PX });
    ctx.restore();
  }, [guideReference, guideOpacity, width, height]);

  // Overlay: stroke-order numbers OR progressive animation, in destination
  // pixel space (DPR-aware).
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!strokeOrderGlyph) return;

    if (animationFrame) {
      renderStrokesProgressive(ctx, strokeOrderGlyph, width, height, animationFrame, {
        lineWidth: GUIDE_SVG_STROKE_PX,
      });
      return;
    }
    if (showStrokeNumbers) {
      renderStrokeNumbers(ctx, strokeOrderGlyph, width, height);
    }
  }, [
    strokeOrderGlyph,
    showStrokeNumbers,
    animationFrame,
    width,
    height,
  ]);

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const bgColor = isDark ? CANVAS_BG_DARK : CANVAS_BG_LIGHT;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-[1.5px] border-border ${className}`}
      style={{ width, height }}
    >
      {/* Layer 1: Background + template (ignored in scoring) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
        aria-hidden
      >
        <canvas
          ref={guideCanvasRef}
          width={width}
          height={height}
          className="w-full h-full"
        />
      </div>
      {/* Layer 1.5: Stroke-order numbers / animation overlay. */}
      <canvas
        ref={overlayCanvasRef}
        width={width}
        height={height}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0"
        style={{ width, height }}
      />
      {/* Layer 2: Drawing only (transparent; user strokes in black). This is what we score. */}
      <canvas
        ref={drawCanvasRef}
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className="absolute left-0 top-0 touch-none cursor-crosshair"
        style={{
          width,
          height,
          opacity: fadeStyle.opacity,
          transition:
            fadeStyle.durationMs > 0
              ? `opacity ${fadeStyle.durationMs}ms ease-out`
              : undefined,
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          const canvas = drawCanvasRef.current;
          if (!canvas) return;
          canvas.setPointerCapture(e.pointerId);
          startStroke();
          draw(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!isDrawingRef.current) return;
          draw(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          const canvas = drawCanvasRef.current;
          if (canvas) canvas.releasePointerCapture(e.pointerId);
          endStroke();
        }}
        onPointerLeave={endStroke}
        onPointerCancel={endStroke}
      />
    </div>
  );
});
