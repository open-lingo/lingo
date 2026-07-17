import { useEffect, useState } from "react";

/**
 * One-shot lesson-start page wipe: a themed curtain masks the screen the
 * instant the lesson mounts (so the route swap happens under cover), then a
 * per-language vehicle sweeps across on a rail and drags the curtain off,
 * revealing the lesson behind it. ~1.4s, then the overlay unmounts itself.
 *
 * Plays once per LessonPage mount (LessonPage is remounted per lesson via
 * KeyedLessonPage, so a fresh wipe fires on every lesson start and
 * Next-lesson navigation).
 *
 * Reduced motion is honored twice over — the OS media query AND the in-app
 * setting (`root.dataset.reducedMotion`). Either one renders nothing.
 */
function reducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  if (document.documentElement.dataset.reducedMotion === "true") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const DURATION_MS = 1400;

/**
 * The wipe vehicle per learning language — a bullet train for JA/KO (the
 * bundled Noto set has no high-speed-train glyph, so this is one of the few
 * places raw emoji beats the image path), a subway for EN, a tram for FR,
 * a camel for AR because why not. Purely decorative, transient art.
 */
const VEHICLE: Record<string, string> = {
  ja: "🚅",
  ko: "🚄",
  en: "🚇",
  es: "🚈",
  fr: "🚊",
  de: "🚆",
  zh: "🚄",
  ar: "🐫",
};
const DEFAULT_VEHICLE = "🚆";

export function LessonIntro({ langId }: { langId?: string }) {
  const [done, setDone] = useState(() => reducedMotion());

  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => setDone(true), DURATION_MS);
    return () => window.clearTimeout(id);
  }, [done]);

  if (done) return null;

  const vehicle = (langId && VEHICLE[langId]) || DEFAULT_VEHICLE;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      aria-hidden
    >
      {/* Curtain — opaque from frame one (masks the mount), then wipes off
          to the left, trailing the vehicle. */}
      <div className="lesson-wipe-curtain absolute inset-0 bg-surface" />

      {/* Vehicle rides across on a short rail, right → left, leading the
          curtain's wipe edge. */}
      <div className="lesson-wipe-vehicle absolute left-0 top-1/2">
        <div className="flex flex-col items-center">
          <span className="text-7xl leading-none drop-shadow-lg sm:text-8xl">
            {vehicle}
          </span>
          {/* rail segment under the wheels */}
          <div className="mt-1 h-[3px] w-44 rounded-full bg-accent/60" />
        </div>
      </div>
    </div>
  );
}
