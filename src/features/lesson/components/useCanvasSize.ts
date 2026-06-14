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
      // Short-viewport clamp: keep the canvas to ≤38% of the window
      // height so the prompt, feedback row, and Check button still fit
      // on one screen (MacBook 14" ≈ 840px usable). Width-derived sizing
      // alone overflowed there.
      const heightCapWidth =
        typeof window !== "undefined"
          ? Math.floor((window.innerHeight * 0.38) / aspectRatio)
          : maxWidth;
      const next = Math.max(
        minWidth,
        Math.min(maxWidth, available, heightCapWidth),
      );
      setWidth(next);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [maxWidth, minWidth, reservedHorizontalPx, aspectRatio]);

  return {
    wrapperRef,
    width,
    height: Math.round(width * aspectRatio),
  };
}
