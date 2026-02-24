import { useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";

const DEFAULT_WIDTH = 280;
const DEFAULT_HEIGHT = 200;
/** Line width to better match template stroke width (~85% of typical character stroke). */
const STROKE_WIDTH = 6;
/** Ink color for the user's drawing (black). */
const STROKE_COLOR = "#000000";
/** Canvas background: darker grey (layer 1 only; ignored in scoring). */
const CANVAS_BG_LIGHT = "#9ca3af"; /* gray-400 */
const CANVAS_BG_DARK = "#4b5563"; /* gray-600 */
/** Guide letter: light grey (layer 1 only; reference for display, not used as "user" stroke). */
const GUIDE_COLOR = "#d1d5db"; /* gray-300 */

export type DrawingCanvasHandle = {
  clear: () => void;
  /** Drawing-only canvas (transparent bg + user strokes). Use this for validation. */
  getCanvas: () => HTMLCanvasElement | null;
};

type Props = {
  width?: number;
  height?: number;
  /** Optional faint symbol to show as guide (trace mode). Layer 1 only. */
  guideSymbol?: string;
  guideOpacity?: number;
  onClear?: () => void;
  className?: string;
  "aria-label"?: string;
};

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  guideSymbol,
  guideOpacity = 0.25,
  onClear,
  className = "",
  "aria-label": ariaLabel = "Drawing area",
}, ref) {
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const guideSymbolRef = useRef(guideSymbol);
  const guideOpacityRef = useRef(guideOpacity);
  guideSymbolRef.current = guideSymbol;
  guideOpacityRef.current = guideOpacity;

  const getDrawCtx = useCallback(() => drawCanvasRef.current?.getContext("2d") ?? null, []);

  const clear = useCallback(() => {
    const canvas = drawCanvasRef.current;
    const ctx = getDrawCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear?.();
  }, [getDrawCtx, onClear]);

  useImperativeHandle(
    ref,
    () => ({
      clear,
      getCanvas: () => drawCanvasRef.current,
    }),
    [clear]
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
    },
    [getDrawCtx]
  );

  const startStroke = useCallback(() => {
    const ctx = getDrawCtx();
    if (!ctx) return;
    isDrawingRef.current = true;
    ctx.beginPath();
  }, [getDrawCtx]);

  const endStroke = useCallback(() => {
    isDrawingRef.current = false;
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

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const bgColor = isDark ? CANVAS_BG_DARK : CANVAS_BG_LIGHT;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 border-gray-400 dark:border-gray-500 ${className}`}
      style={{ width, height }}
    >
      {/* Layer 1: Background + template (ignored in scoring) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
        aria-hidden
      >
        {guideSymbol && (
          <span
            className="select-none font-bold"
            style={{
              fontSize: "80px",
              color: GUIDE_COLOR,
              opacity: guideOpacity,
            }}
          >
            {guideSymbol}
          </span>
        )}
      </div>
      {/* Layer 2: Drawing only (transparent; user strokes in black). This is what we score. */}
      <canvas
        ref={drawCanvasRef}
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className="absolute left-0 top-0 touch-none cursor-crosshair"
        style={{ width, height }}
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
