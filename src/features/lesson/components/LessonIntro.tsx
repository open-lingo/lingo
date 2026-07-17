import { useEffect, useState, type CSSProperties } from "react";

/**
 * One-shot lesson-start flourish: a swirl spins and scales out from the
 * center over a themed backdrop that fades in then out, ~900ms, then the
 * overlay unmounts itself. Plays once per LessonPage mount (LessonPage is
 * remounted per lesson via KeyedLessonPage, so a fresh swirl fires on every
 * lesson start and Next-lesson navigation).
 *
 * Reduced motion is honored twice over — the OS media query AND the in-app
 * setting (`root.dataset.reducedMotion`, set by SettingsContext). Either one
 * renders nothing (no flash, no delay).
 */
function reducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  if (document.documentElement.dataset.reducedMotion === "true") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const DURATION_MS = 1250;

export function LessonIntro() {
  const [done, setDone] = useState(() => reducedMotion());

  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => setDone(true), DURATION_MS);
    return () => window.clearTimeout(id);
  }, [done]);

  if (done) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] grid place-items-center"
      aria-hidden
    >
      {/* Themed backdrop veil — fades in, holds over the page mount, fades out */}
      <div className="lesson-intro-veil absolute inset-0 bg-surface/80 backdrop-blur-sm" />

      {/* Spiral arms — each flings outward along its own rotating axis so the
          spiral grows by trajectory, not just scale. */}
      {ARMS.map((rot, i) => (
        <div
          key={i}
          className="lesson-intro-arm absolute h-40 w-2 origin-bottom rounded-full"
          style={
            {
              "--arm-rot": `${rot}deg`,
              background:
                "linear-gradient(to top, var(--color-accent), transparent)",
            } as CSSProperties
          }
        />
      ))}

      {/* Core — two counter-rotating conic rings scaling out from center */}
      <div className="lesson-intro-swirl relative h-80 w-80">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, var(--color-accent) 90deg, transparent 200deg, var(--color-accent-hover) 300deg, transparent 360deg)",
            maskImage:
              "radial-gradient(closest-side, transparent 55%, #000 60%, #000 100%)",
            WebkitMaskImage:
              "radial-gradient(closest-side, transparent 55%, #000 60%, #000 100%)",
          }}
        />
        <div
          className="absolute inset-12 rounded-full"
          style={{
            background:
              "conic-gradient(from 180deg, transparent 0deg, var(--color-warning) 120deg, transparent 260deg)",
            maskImage:
              "radial-gradient(closest-side, transparent 45%, #000 52%, #000 100%)",
            WebkitMaskImage:
              "radial-gradient(closest-side, transparent 45%, #000 52%, #000 100%)",
          }}
        />
      </div>
    </div>
  );
}

/** Base angles for the six spiral arms, evenly spread around the circle. */
const ARMS = [0, 60, 120, 180, 240, 300];
