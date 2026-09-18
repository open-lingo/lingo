import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { computeAnswerTrayBound } from "../components/tiles/answerTrayBound";
import { prefersReducedMotion } from "../components/steps/SortableBuildTiles";

/**
 * P3 residual (`docs/tile-tray-ux-2026-09-18.md`, lane LONGANS, TestFlight
 * T18): a long answer's full-answer reservation (THE ONE RESERVATION, build
 * 25 — `BuildSentenceStepView.tsx` / `ListeningBuildStepView.tsx`) can be
 * taller than the room the bank + CTA leave it once the fit rule's shrink
 * floor is already spent. `applyBoundedAnswerTray` watches the SAME two
 * rects `sim-capture.mjs`'s `stageFits` verdict compares —
 * `[data-lesson-stage]`'s own box vs. the bank's — and, ONLY when the
 * bank's bottom edge would spill past the stage's, caps the tray's rendered
 * box to the tallest whole number of rows that removes the overflow
 * (`answerTrayBound.ts`'s pure math), snapped to the SAME `--tile-row-h`
 * `tileFit.ts` already publishes so the cut line always lands on a row
 * boundary.
 *
 * Deliberately imperative (direct `style`/`dataset` writes, no React state):
 * matches `tileFit.ts`'s own pattern for measurement-driven styling (see its
 * `registerTile`), and means applying/removing the cap causes no extra
 * render — CSS (`[data-tile-tray][data-kind="tray"][data-bounded="true"]`,
 * `index.css`) turns `data-bounded` into `overflow-y: auto` + the scroll
 * affordance. Below the cap the ANSWER scrolls internally; the fixed shell
 * and the bank/CTA below it do not move — "nothing moves or resizes while
 * the learner builds" (mobile-sizing-spec.md §3) is about what happens
 * BETWEEN the first and last tap, and the reservation is already at its
 * final size before the first tap, so this settles once at mount (a
 * synchronous `useLayoutEffect` pass against the already-committed, already-
 * painted layout, plus a bounded number of `ResizeObserver` follow-up
 * passes for late-settling content) and never re-fires on a tap.
 *
 * `root` / `rootRef` is the step view's own root element (NOT a ref threaded
 * through `TileTray`, which stays a plain, ref-less primitive) — the tray,
 * the bank and the ancestor stage are all found by selector from there, the
 * same way every other geometry probe in this codebase (`simProbe.ts`,
 * `layoutTrace.ts`) reads the DOM it needs without new prop plumbing.
 */

const STAGE_SELECTOR = "[data-lesson-stage]";
const TRAY_SELECTOR = '[data-tile-tray][data-kind="tray"]';
const BANK_SELECTOR = '[data-tile-tray][data-kind="bank"]';
const ROW_SELECTOR = '[data-tile-tray][data-kind="row"][data-layer="true"]';
const TILE_SELECTOR = "[data-tile]";

/** Matches `tests/mobile/stage-fit.mobile.spec.ts`'s own tolerance — a
 *  fractional-DPR layout delta is not a real overflow. */
const OVERFLOW_TOLERANCE_PX = 2;
/** Safety valve against a pathological resize loop; real convergence (see
 *  `answerTrayBound.ts`'s monotonic-shrink contract) needs far fewer passes
 *  than this in practice. */
const MAX_CONVERGENCE_PASSES = 8;

function readRowMetrics(trayEl: HTMLElement): { rowHeightPx: number; rowGapPx: number } {
  const sampleTile = trayEl.querySelector<HTMLElement>(TILE_SELECTOR);
  const rowHeightPx = sampleTile
    ? Number.parseFloat(getComputedStyle(sampleTile).getPropertyValue("--tile-row-h")) || 0
    : 0;
  const rowGapPx = Number.parseFloat(getComputedStyle(trayEl).rowGap) || 0;
  return { rowHeightPx, rowGapPx };
}

function applyCap(trayEl: HTMLElement, maxHeightPx: number | null) {
  if (maxHeightPx === null) {
    if (trayEl.dataset.bounded) delete trayEl.dataset.bounded;
    trayEl.style.removeProperty("max-height");
    return;
  }
  trayEl.dataset.bounded = "true";
  trayEl.style.maxHeight = `${maxHeightPx}px`;
}

/** Clears any cap from a previous step — exported so a step-id change can
 *  start the new answer's reservation from its true natural height instead
 *  of compounding a stale cap from the step before it. */
export function resetBoundedAnswerTray(root: HTMLElement): void {
  const trayEl = root.querySelector<HTMLElement>(TRAY_SELECTOR);
  if (trayEl) applyCap(trayEl, null);
}

/**
 * One measurement-and-cap pass, against whatever is ALREADY committed and
 * painted in `root`'s subtree. Pure DOM reads/writes, no scheduling of its
 * own — call it after a real layout (`useLayoutEffect`, a `ResizeObserver`
 * callback, or a test that has stubbed `getBoundingClientRect`) — so it is
 * directly unit-testable without faking `requestAnimationFrame`.
 *
 * Returns whether it changed anything (tightened the cap), so a caller that
 * wants to bound how many follow-up passes it runs can stop once a pass
 * changes nothing.
 */
export function applyBoundedAnswerTray(root: HTMLElement): boolean {
  const trayEl = root.querySelector<HTMLElement>(TRAY_SELECTOR);
  if (!trayEl) return false;
  const stageEl = trayEl.closest<HTMLElement>(STAGE_SELECTOR);
  if (!stageEl) return false;
  const bankEl = root.querySelector<HTMLElement>(BANK_SELECTOR);
  if (!bankEl) return false;

  const overflowPx = bankEl.getBoundingClientRect().bottom - stageEl.getBoundingClientRect().bottom;
  if (!(overflowPx > OVERFLOW_TOLERANCE_PX)) return false;

  const { rowHeightPx, rowGapPx } = readRowMetrics(trayEl);
  const { maxHeightPx } = computeAnswerTrayBound({
    overflowPx,
    currentHeightPx: trayEl.getBoundingClientRect().height,
    rowHeightPx,
    rowGapPx,
  });
  if (maxHeightPx === null) return false;

  // Monotonic shrink only, per pass — never grow a cap back mid-settle (the
  // centred column's own re-negotiation as the tray shrinks is exactly what
  // can make one pass under- or over-correct; only ever tightening
  // guarantees this converges instead of oscillating).
  const appliedPx = Number.parseFloat(trayEl.style.maxHeight);
  if (Number.isFinite(appliedPx) && maxHeightPx >= appliedPx) return false;

  applyCap(trayEl, maxHeightPx);
  return true;
}

export function useBoundedAnswerTray(rootRef: RefObject<HTMLElement | null>, resetKey: string): void {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Every step starts from the tray's TRUE natural height — a cap carried
    // over from a previous step (this hook instance is not remounted by a
    // step-view `key`) would price the new answer against the old one's
    // reservation.
    resetBoundedAnswerTray(root);
    // First pass, synchronous, against the layout React just committed and
    // the browser just painted — no `requestAnimationFrame` needed.
    applyBoundedAnswerTray(root);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      let passes = 0;
      ro = new ResizeObserver(() => {
        if (passes >= MAX_CONVERGENCE_PASSES) return;
        passes += 1;
        applyBoundedAnswerTray(root);
      });
      const trayEl = root.querySelector<HTMLElement>(TRAY_SELECTOR);
      const stageEl = trayEl?.closest<HTMLElement>(STAGE_SELECTOR) ?? null;
      const bankEl = root.querySelector<HTMLElement>(BANK_SELECTOR);
      if (stageEl) ro.observe(stageEl);
      if (trayEl) ro.observe(trayEl);
      if (bankEl) ro.observe(bankEl);
    }

    return () => ro?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);
}

/**
 * The most recently PLACED tile (not the most recently reordered one) auto-
 * scrolled into view inside a bounded tray — `scrollIntoView({ block:
 * "nearest" })`, smooth unless the learner has reduced motion on (in-app
 * setting or OS preference — `prefersReducedMotion()`, shared with
 * `SortableBuildTiles`'s own reorder animation). Fires only when
 * `placedCount` GREW since the last render, so reordering the tray (which
 * does not change the count) never re-triggers a scroll — only an add does.
 * A tray that is not bounded (the common case) still has this wired, but
 * `scrollIntoView({block:"nearest"})` on an element already fully in view is
 * a no-op.
 */
export function useScrollNewestAnswerTileIntoView(
  rootRef: RefObject<HTMLElement | null>,
  placedCount: number,
): void {
  const prevCountRef = useRef(0);

  useEffect(() => {
    const grew = placedCount > prevCountRef.current;
    prevCountRef.current = placedCount;
    if (!grew) return;
    const root = rootRef.current;
    if (!root) return;
    const row = root.querySelector<HTMLElement>(ROW_SELECTOR);
    const tiles = row ? row.querySelectorAll<HTMLElement>(TILE_SELECTOR) : null;
    const last = tiles && tiles.length > 0 ? tiles[tiles.length - 1] : null;
    if (last && typeof last.scrollIntoView === "function") {
      last.scrollIntoView({
        block: "nearest",
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placedCount]);
}
