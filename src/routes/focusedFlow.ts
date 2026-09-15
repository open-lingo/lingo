/**
 * "Focused flow" = a surface that owns the whole screen: no app header, no
 * breadcrumbs, no bottom tab bar, no ads, and tightened `<main>` padding. The
 * session's own chrome (an exit control and a progress bar) is the only chrome,
 * so the learner's attention and the vertical budget both go to the exercise.
 *
 * Two patterns, because focus is not purely a property of the route:
 *
 * - `FOCUSED_FLOW_PATTERN` — always focused, at every width. Lessons,
 *   per-module test-out, the placement test, the grammar review session.
 * - `MOBILE_FOCUSED_FLOW_PATTERN` — focused only below `md`. Today that is the
 *   flashcard review session (Decision 2, Spencer 2026-09-02): on a phone the
 *   reviewer stacked header → breadcrumbs → its own toolbar → progress →
 *   modality chip → 360px card → grade row → detail panel → stats → undo
 *   inside a 667px viewport and forced a scroll. On desktop that chrome is
 *   free, and the sidebar is how you leave, so it stays.
 *
 * `isMobile` is `useViewport().isMobile` — true below `md` (768px), the app's
 * one documented mobile/desktop seam (`shared/hooks/breakpoints.ts`).
 */
// `/qa/tiles/frame` (TestFlight #137, b16.1 2026-09-15): the tile-sizing QA
// page embeds this route in an iframe and needs it to render at the SAME
// frameless stage width/height a real lesson does — the app header/sidebar/
// bottom-tab-bar were eating vertical budget inside the iframe that a real
// lesson never pays, and Spencer asked for the desktop pane specifically to
// stop rendering the whole app shell ("I just need the element for
// desktop"). See TileSizingQaFramePage.tsx.
export const FOCUSED_FLOW_PATTERN =
  /\/lessons\/|\/test-out\/|\/placement-test|\/practice\/grammar\/review|\/qa\/tiles\/frame/;

export const MOBILE_FOCUSED_FLOW_PATTERN = /\/practice\/flashcards\/review\/?$/;

export function isFocusedFlow(pathname: string, isMobile: boolean): boolean {
  if (FOCUSED_FLOW_PATTERN.test(pathname)) return true;
  return isMobile && MOBILE_FOCUSED_FLOW_PATTERN.test(pathname);
}
