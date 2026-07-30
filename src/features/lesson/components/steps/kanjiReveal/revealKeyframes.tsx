import { useEffect, useRef, useState } from "react";

/**
 * Keyframes + timing helpers shared by the kana→kanji reveal candidates.
 *
 * Injected as one document-level <style> rather than per-component, because the
 * gallery mounts every candidate at once and Tailwind cannot express these
 * (dynamic delays, clip-path wipes, transform sequences).
 *
 * Every animation below is transform/opacity/clip-path only — no layout
 * properties — so they composite off the main thread. That matters more than
 * usual here: the reveal shares a step with the lesson shell, and a reveal that
 * janks the progress bar reads as the app stuttering, not as polish.
 */

const STYLE_ID = "kanji-reveal-keyframes";

const CSS = `
@keyframes krv-fade-up   { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes krv-fade-in   { from { opacity: 0; } to { opacity: 1; } }
@keyframes krv-fade-out  { from { opacity: 1; } to { opacity: 0; } }
@keyframes krv-emerge    { from { opacity: 0; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
@keyframes krv-pop       { 0% { transform: scale(0.9); } 60% { transform: scale(1.06); } 100% { transform: scale(1); } }
@keyframes krv-in-left   { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: none; } }
@keyframes krv-in-right  { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: none; } }
@keyframes krv-wipe      { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
/* The erase half of the pair: same left-to-right hand, removing instead of
   laying down. Kept as its own rule rather than running krv-wipe with
   animation-direction: reverse, which would also reverse the easing. */
@keyframes krv-erase     { from { clip-path: inset(0 0 0 0); } to { clip-path: inset(0 0 0 100%); } }
@keyframes krv-sweep     { from { transform: translateX(-110%); } to { transform: translateX(110%); } }

/* Motion is decoration on every candidate here — the learner must still end up
   looking at the finished form, so reduced-motion snaps to the end state
   instead of removing the reveal. Every call site uses fill-mode "both", so a
   1ms duration lands on the final frame rather than skipping it. */
@media (prefers-reduced-motion: reduce) {
  [data-krv] { animation-duration: 1ms !important; animation-delay: 0ms !important; }
}
`;

export function useRevealKeyframes(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

/**
 * Advances through `durations` (ms) and reports the current phase index, so a
 * candidate can swap what it renders at each beat instead of expressing the
 * whole sequence in one keyframe set.
 *
 * Resets whenever `replayKey` changes. `phase === durations.length` means the
 * sequence finished — that is the cue to render the resting state (for most
 * candidates, the real `AnnotatedText`, so the last thing on screen is the
 * production renderer rather than a mock of it).
 */
export function useRevealPhase(
  durations: number[],
  replayKey: number,
  /**
   * Called once per run, when the last phase lands. Fired from an effect, not
   * from the phase computation — a reveal's whole job is to unlock a Continue
   * button, so `onDone` is a parent `setState` and calling it during render
   * is an infinite loop.
   */
  onDone?: () => void,
): { phase: number; done: boolean; totalMs: number } {
  const [phase, setPhase] = useState(0);
  const timers = useRef<number[]>([]);
  const totalMs = durations.reduce((a, b) => a + b, 0);
  const key = durations.join(",");

  useEffect(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setPhase(0);
    let acc = 0;
    durations.forEach((d, i) => {
      acc += d;
      timers.current.push(window.setTimeout(() => setPhase(i + 1), acc));
    });
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
    // `durations` is a literal array at every call site, so keying on its
    // content avoids a new-identity-every-render reset loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey, key]);

  const done = phase >= durations.length;
  // `onDone` is intentionally not a dependency: call sites pass inline arrows,
  // and depending on it would re-fire on every parent render.
  const fired = useRef(false);
  useEffect(() => {
    fired.current = false;
  }, [replayKey, key]);
  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return { phase, done, totalMs };
}
