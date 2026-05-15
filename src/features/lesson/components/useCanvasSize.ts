import { useEffect, useRef, useState } from "react";

type Options = {
  /** Maximum canvas width in CSS pixels. */
  maxWidth?: number;
  /** Minimum canvas width in CSS pixels (mobile floor). */
  minWidth?: number;
  /** height / width ratio. 0.71 ≈ 5/7 (current default aspect). */
  aspectRatio?: number;
  /**
   * Horizontal pixels to reserve inside the wrapper for siblings (progress
   * dots, etc) so the canvas leaves room instead of crowding them.
   */
  reservedHorizontalPx?: number;
};

/**
 * Drives a responsive {@link DrawingCanvas} that fills the available column
 * width up to `maxWidth`, falling back to `minWidth` on tight viewports.
 *
 * Attach `wrapperRef` to a `w-full` container around the canvas; the hook
 * watches the container's clientWidth via ResizeObserver and recomputes the
 * canvas dimensions. Re-render is cheap (props only).
 *
 * Note: the underlying canvas resets on width changes (DrawingCanvas re-runs
 * its setup effect). Browser-resize while drawing is rare, so we accept that.
 */
export function useCanvasSize({
  maxWidth = 560,
  minWidth = 280,
  aspectRatio = 0.71,
  reservedHorizontalPx = 0,
}: Options = {}): {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
} {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(maxWidth);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const compute = () => {
      const available =
        (el.clientWidth || maxWidth) - reservedHorizontalPx;
      const next = Math.max(minWidth, Math.min(maxWidth, available));
      setWidth(next);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth, minWidth, reservedHorizontalPx]);

  return {
    wrapperRef,
    width,
    height: Math.round(width * aspectRatio),
  };
}
