import { useEffect, useRef, useState } from "react";
import { getGlyphData } from "./registry";
import type { GlyphData } from "./types";

/**
 * SVG stroke-order draw-on for a single character.
 *
 * This is the declarative counterpart to `renderStrokesProgressive` +
 * `useStrokeAnimation` (canvas + requestAnimationFrame), which exist because
 * the tracing surfaces need per-frame pixel access to score a learner's
 * drawing. A reveal has no scoring, so it wants none of that: one `<path>` per
 * stroke, `stroke-dashoffset` animated in CSS, compositor-driven, no React
 * re-render per frame.
 *
 * `pathLength="1"` is what makes it cheap — it renormalizes every path to unit
 * length, so `stroke-dasharray: 1` / `stroke-dashoffset: 1 → 0` draws any
 * stroke with no `getTotalLength()` measurement (the canvas path needs a
 * hidden SVG element and a length cache to do the same thing).
 *
 * Falls back to the plain glyph as text when the character is not in the
 * bundled data — the caller gets the character either way, just not animated.
 * `prefers-reduced-motion` renders the finished strokes with no animation.
 */

const KEYFRAMES_ID = "kanji-stroke-draw-keyframes";
const KEYFRAMES = `
@keyframes kanji-stroke-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
`;

/** Injected once per document — a component-local <style> per instance would
 *  duplicate the rule for every glyph on a gallery page. */
function useKeyframes(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(KEYFRAMES_ID)) return;
    const el = document.createElement("style");
    el.id = KEYFRAMES_ID;
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
  }, []);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export type KanjiStrokeDrawProps = {
  /** A single character. Multi-character words: one component per character. */
  char: string;
  /** Rendered pixel size (square). */
  size?: number;
  /** Per-stroke draw duration, ms. */
  strokeMs?: number;
  /** Gap between strokes, ms. */
  gapMs?: number;
  /** Delay before the first stroke, ms — used to stagger a two-kanji word. */
  delayMs?: number;
  /** Bumping this restarts the animation. */
  replayKey?: number;
  /** Stroke color. Defaults to `currentColor` so it inherits text color. */
  color?: string;
  /** Stroke thickness in viewBox units (KanjiVG box is 109×109). */
  strokeWidth?: number;
  /**
   * Draw a faint full glyph underneath. Off by default: for a reveal the
   * suspense is the point, whereas a tracing guide wants it on.
   */
  showGhost?: boolean;
  className?: string;
};

/** Total wall time of a draw, so callers can sequence what comes after it. */
export function strokeDrawDurationMs(
  strokeCount: number,
  strokeMs: number,
  gapMs: number,
): number {
  if (strokeCount <= 0) return 0;
  return strokeMs * strokeCount + gapMs * (strokeCount - 1);
}

export function KanjiStrokeDraw({
  char,
  size = 96,
  strokeMs = 380,
  gapMs = 90,
  delayMs = 0,
  replayKey = 0,
  color,
  strokeWidth = 5.5,
  showGhost = false,
  className,
}: KanjiStrokeDrawProps) {
  const [glyph, setGlyph] = useState<GlyphData | null>(null);
  const [missing, setMissing] = useState(false);
  useKeyframes();

  // `char` can change while a load is in flight (gallery replay, word swap);
  // the stale flag stops a late resolve from painting the wrong glyph.
  const liveChar = useRef(char);
  useEffect(() => {
    liveChar.current = char;
    let stale = false;
    setGlyph(null);
    setMissing(false);
    void getGlyphData("kanji", char).then((data) => {
      if (stale) return;
      if (data) setGlyph(data);
      else setMissing(true);
    });
    return () => {
      stale = true;
    };
  }, [char]);

  if (missing || (!glyph && !missing)) {
    // Not-in-data and still-loading render the same thing, deliberately: the
    // glyph is legible immediately and the strokes take over if they arrive,
    // so a slow chunk never shows an empty box where a character should be.
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          fontSize: size * 0.86,
          lineHeight: 1,
          color,
        }}
      >
        {char}
      </span>
    );
  }
  if (!glyph) return null;

  const reduced = prefersReducedMotion();
  const [vx, vy, vw, vh] = glyph.viewBox;

  return (
    <svg
      key={replayKey}
      className={className}
      width={size}
      height={size}
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      role="img"
      aria-label={char}
      style={{ overflow: "visible", color }}
    >
      {showGhost &&
        glyph.strokes.map((s, i) => (
          <path
            key={`ghost-${i}`}
            d={s.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.12}
          />
        ))}
      {glyph.strokes.map((s, i) => (
        <path
          key={i}
          d={s.d}
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            reduced
              ? undefined
              : {
                  strokeDasharray: 1,
                  strokeDashoffset: 1,
                  animation: `kanji-stroke-draw ${strokeMs}ms linear forwards`,
                  animationDelay: `${delayMs + i * (strokeMs + gapMs)}ms`,
                }
          }
        />
      ))}
    </svg>
  );
}

/** A whole word drawn left-to-right, each character starting after the last. */
export function KanjiWordStrokeDraw({
  word,
  size = 96,
  strokeMs = 380,
  gapMs = 90,
  betweenCharsMs = 160,
  replayKey = 0,
  color,
  className,
}: {
  word: string;
  size?: number;
  strokeMs?: number;
  gapMs?: number;
  /** Extra pause between one character finishing and the next starting. */
  betweenCharsMs?: number;
  replayKey?: number;
  color?: string;
  className?: string;
}) {
  const chars = [...word];
  const [counts, setCounts] = useState<number[]>([]);

  // Per-character delays need each PRIOR character's stroke count, so the
  // cumulative offset can only be computed once the data is in hand. Until
  // then every character starts at 0 — they draw together for one frame rather
  // than not at all, which reads as a flicker instead of a gap.
  useEffect(() => {
    let stale = false;
    void Promise.all(chars.map((c) => getGlyphData("kanji", c))).then((all) => {
      if (stale) return;
      setCounts(all.map((g) => g?.strokes.length ?? 0));
    });
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  let acc = 0;
  const delays = chars.map((_, i) => {
    const d = acc;
    const n = counts[i] ?? 0;
    acc += strokeDrawDurationMs(n, strokeMs, gapMs) + betweenCharsMs;
    return d;
  });

  return (
    <span className={className} style={{ display: "inline-flex", gap: size * 0.06 }}>
      {chars.map((c, i) => (
        <KanjiStrokeDraw
          key={`${c}-${i}`}
          char={c}
          size={size}
          strokeMs={strokeMs}
          gapMs={gapMs}
          delayMs={delays[i]}
          replayKey={replayKey}
          color={color}
        />
      ))}
    </span>
  );
}

/** Wall time for a whole word, given its per-character stroke counts. */
export function wordStrokeDrawDurationMs(
  strokeCounts: number[],
  strokeMs: number,
  gapMs: number,
  betweenCharsMs: number,
): number {
  return strokeCounts.reduce(
    (total, n, i) =>
      total +
      strokeDrawDurationMs(n, strokeMs, gapMs) +
      (i < strokeCounts.length - 1 ? betweenCharsMs : 0),
    0,
  );
}
