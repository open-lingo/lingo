/**
 * Pure frame-gating helper for the ghost-train ambient loop
 * (see TransitLearnPage.tsx).
 *
 * The ghost train requests an animation frame on EVERY vsync (cheap: one
 * callback) but only recomputes + writes the transform when enough time has
 * elapsed since the last draw. This lands draws on a stable vsync grid
 * (~30fps on 60Hz, exactly every 4th frame on 120Hz ProMotion) instead of
 * drifting the way a `setTimeout(FRAME_MS) -> requestAnimationFrame` chain
 * does — a timer and vsync are two independent clocks, so that chain's
 * actual frame spacing wanders between ~33ms and ~41ms and the train visibly
 * stutters.
 *
 * The remainder-carrying update (`lastDraw += frameMs * floor(elapsed /
 * frameMs)`, not `lastDraw = now`) is what keeps the phase from drifting:
 * each draw lands `frameMs` (or a whole multiple of it, after a stall) after
 * the previous one, on the original grid, rather than resetting the grid to
 * wherever `now` happened to land.
 */
export interface GhostPacingResult {
  /** Whether this call should recompute + write the frame. */
  draw: boolean;
  /** The `lastDraw` value to carry into the next call. */
  lastDraw: number;
}

/**
 * Decide whether a vsync callback firing at `now` should draw, given the
 * timestamp of the last draw (`lastDraw`) and the target frame interval
 * (`frameMs`).
 *
 * - First call (lastDraw <= 0): always draws, anchoring the grid at `now`.
 * - Otherwise draws only once at least one full `frameMs` has elapsed,
 *   advancing `lastDraw` by whole multiples of `frameMs` (never snapping to
 *   `now`) so a long stall (e.g. a backgrounded tab) catches up onto the
 *   same grid instead of shifting it.
 */
export function nextDrawGate(now: number, lastDraw: number, frameMs: number): GhostPacingResult {
  if (lastDraw <= 0) {
    return { draw: true, lastDraw: now };
  }
  const elapsed = now - lastDraw;
  if (elapsed < frameMs) {
    return { draw: false, lastDraw };
  }
  const steps = Math.floor(elapsed / frameMs);
  return { draw: true, lastDraw: lastDraw + steps * frameMs };
}
