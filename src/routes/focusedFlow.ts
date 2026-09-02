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
export const FOCUSED_FLOW_PATTERN =
  /\/lessons\/|\/test-out\/|\/placement-test|\/practice\/grammar\/review/;

export const MOBILE_FOCUSED_FLOW_PATTERN = /\/practice\/flashcards\/review\/?$/;

export function isFocusedFlow(pathname: string, isMobile: boolean): boolean {
  if (FOCUSED_FLOW_PATTERN.test(pathname)) return true;
  return isMobile && MOBILE_FOCUSED_FLOW_PATTERN.test(pathname);
}
