import { useEffect, useState } from "react";
import { TrainMascotArt } from "@/features/learn/components/TrainMascotArt";
import { playSfx } from "@/shared/audio/sfx";

/**
 * One-shot lesson-start page wipe: a themed curtain masks the screen the
 * instant the lesson mounts (so the route swap happens under cover), then
 * the map's train mascot sweeps across from the left on a rail and drags
 * the curtain off, revealing the lesson behind it. ~1.4s, then the overlay
 * unmounts itself.
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

export function LessonIntro() {
  const [done, setDone] = useState(() => reducedMotion());

  useEffect(() => {
    if (done) return;
    playSfx("lesson-start");
    const id = window.setTimeout(() => setDone(true), DURATION_MS);
    return () => window.clearTimeout(id);
  }, [done]);

  if (done) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      aria-hidden
    >
      {/* Curtain — opaque from frame one (masks the mount), then wipes off
          to the right, trailing the train. */}
      <div className="lesson-wipe-curtain absolute inset-0 bg-surface" />

      {/* Train rides across on a short rail, left → right, leading the
          curtain's wipe edge. */}
      <div className="lesson-wipe-vehicle absolute left-0 top-1/2">
        <div className="flex flex-col items-center">
          <TrainMascotArt className="h-28 w-28 drop-shadow-lg sm:h-32 sm:w-32" />
          {/* rail segment under the wheels */}
          <div className="h-[3px] w-44 rounded-full bg-accent/60" />
        </div>
      </div>
    </div>
  );
}
