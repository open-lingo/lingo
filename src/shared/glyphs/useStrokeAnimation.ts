import { useCallback, useEffect, useRef, useState } from "react";
import type { GlyphData } from "./types";
import type { StrokeAnimationFrame } from "./strokeRender";

export type UseStrokeAnimationOptions = {
  /** Duration of each individual stroke in milliseconds. Default 600. */
  strokeDurationMs?: number;
  /** Pause between strokes in milliseconds. Default 180. */
  pauseBetweenMs?: number;
  /** Auto-play once on mount. Default false. */
  autoPlay?: boolean;
};

type State =
  | { kind: "idle" }
  | { kind: "playing"; frame: StrokeAnimationFrame }
  | { kind: "done"; frame: StrokeAnimationFrame };

const REDUCED_MOTION =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Drives a one-shot stroke-order animation over `glyph.strokes`. The current
 * frame is exposed via `frame`; pass it to {@link renderStrokesProgressive}.
 *
 * `prefers-reduced-motion: reduce` is honored: instead of animating, the hook
 * snaps to the final fully-drawn state on `play()` — the learner still sees
 * the full glyph but without motion.
 */
export function useStrokeAnimation(
  glyph: GlyphData | null,
  opts: UseStrokeAnimationOptions = {},
): {
  frame: StrokeAnimationFrame | null;
  isPlaying: boolean;
  isDone: boolean;
  play(): void;
  reset(): void;
} {
  // 2026-05-17: sped 30% (was 600ms / 180ms) per Spencer's M2 walkthrough.
  // Intro animation felt slow when learners are past initial trace
  // mechanics and just want to recognize the shape.
  const strokeDurationMs = opts.strokeDurationMs ?? 420;
  const pauseBetweenMs = opts.pauseBetweenMs ?? 125;
  const autoPlay = opts.autoPlay ?? false;

  const [state, setState] = useState<State>({ kind: "idle" });
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const reset = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setState({ kind: "idle" });
  }, []);

  const play = useCallback(() => {
    if (!glyph || glyph.strokes.length === 0) return;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    const total = glyph.strokes.length;
    const finalFrame: StrokeAnimationFrame = {
      strokeIndex: total,
      strokeProgress: 0,
    };

    if (REDUCED_MOTION) {
      setState({ kind: "done", frame: finalFrame });
      return;
    }

    startTimeRef.current = performance.now();
    const perStroke = strokeDurationMs + pauseBetweenMs;
    const totalMs = strokeDurationMs * total + pauseBetweenMs * (total - 1);

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      if (elapsed >= totalMs) {
        rafRef.current = null;
        setState({ kind: "done", frame: finalFrame });
        return;
      }
      const strokeIndex = Math.min(total - 1, Math.floor(elapsed / perStroke));
      const intoStroke = elapsed - strokeIndex * perStroke;
      const strokeProgress = Math.max(
        0,
        Math.min(1, intoStroke / strokeDurationMs),
      );
      setState({
        kind: "playing",
        frame: { strokeIndex, strokeProgress },
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [glyph, strokeDurationMs, pauseBetweenMs]);

  useEffect(() => {
    if (autoPlay && glyph && glyph.strokes.length > 0) {
      play();
    }
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [autoPlay, glyph, play]);

  const frame =
    state.kind === "idle"
      ? null
      : state.kind === "playing"
        ? state.frame
        : state.frame;

  return {
    frame,
    isPlaying: state.kind === "playing",
    isDone: state.kind === "done",
    play,
    reset,
  };
}
