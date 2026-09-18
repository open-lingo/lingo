/**
 * P3 residual (`docs/tile-tray-ux-2026-09-18.md`, lane LONGANS, TestFlight
 * T18): "THE ONE RESERVATION" (`BuildSentenceStepView.tsx` /
 * `ListeningBuildStepView.tsx`, build 25) sizes the answer tray to the FULL
 * answer up front so nothing grows mid-build — correct, and untouched here.
 * On a long answer (>=12 tiles) at a large accessibility scale, that
 * up-front reservation can still be taller than the room the bank + CTA
 * leave it once the fit rule's shrink floor is already spent: measured on
 * `ja-m42-neo-challenge?step=11` (a 21-tile `listening_build` answer, the
 * course's longest) at 125%, fit-scale sits on the 0.638 fill floor and the
 * bank's own bottom edge still lands 212.4px past the fixed stage's bottom
 * edge — the whole stage then needs its native scrollbar to reach a bank
 * and CTA the fit rule already promised would not move (~2% of JA
 * `listening_build` steps).
 *
 * The lead's ruling (implement, don't re-decide): tiles never shrink below
 * the existing floor, the bank + CTA never move, and the ANSWER tray
 * becomes a BOUNDED internal scroll region — but ONLY when its reservation
 * would otherwise push the stage past the shell. This is the pure sizing
 * math for that cap: given how far the bank currently overflows the stage
 * and the tray's own row geometry, how tall may the tray's VISIBLE box be
 * so the overflow is gone — snapped to a whole number of rows so the clip
 * line always lands on a row boundary (never mid-tile).
 *
 * Deliberately pure and DOM-free: `useBoundedAnswerTray.ts` supplies the
 * live `getBoundingClientRect()` numbers and re-invokes this on every
 * observed resize, so this file owns none of the layout reading and none of
 * the "when to re-measure" policy. It does not touch `tileFit.ts`'s own
 * reservation math (row count, ghost sizing, fill/shrink) — this caps the
 * tray's rendered height on TOP of that accounting, never changes it.
 */

export interface AnswerTrayBoundInput {
  /** How far the bank's own bottom edge sits past the stage's fixed bottom
   *  edge (`bankRect.bottom - stageRect.bottom`), in CSS px. The SAME
   *  comparison `sim-capture.mjs`'s `stageFits` verdict makes. `<= 0` (within
   *  tolerance) means the step already fits and the tray needs no cap. */
  overflowPx: number;
  /** The tray's height as currently rendered — its cap from a previous pass,
   *  or its natural (uncapped) content height if none has been applied yet. */
  currentHeightPx: number;
  /** One tray row's height in px — `--tile-row-h`, the SAME custom property
   *  `tileFit.ts` publishes per stage+variant cohort, read off any tile
   *  inside the tray so the cap can never disagree with what the fit rule
   *  actually rendered. */
  rowHeightPx: number;
  /** The gap between wrapped rows inside the tray (`--tile-tray-gap`). */
  rowGapPx: number;
  /** Never cap tighter than this many rows — always show at least one full
   *  row of the answer, even if the overflow alone would erase it. */
  minRows?: number;
}

export interface AnswerTrayBound {
  /** `null` = no cap needed; the tray renders at its natural height with no
   *  internal scroll. A number is the `max-height` (px) to apply, always a
   *  whole number of rows and never taller than `currentHeightPx`. */
  maxHeightPx: number | null;
}

/** Sub-pixel layout noise (fractional DPR rounding) is not a real overflow —
 *  matches `tests/mobile/stage-fit.mobile.spec.ts`'s own `TOLERANCE_PX`. */
const OVERFLOW_TOLERANCE_PX = 2;

export function computeAnswerTrayBound(input: AnswerTrayBoundInput): AnswerTrayBound {
  const { overflowPx, currentHeightPx, rowHeightPx, rowGapPx, minRows = 1 } = input;

  if (!(overflowPx > OVERFLOW_TOLERANCE_PX)) return { maxHeightPx: null };
  // No row unit to snap the cut line to — leave the tray alone rather than
  // guess a height that might slice a tile in half.
  if (!(rowHeightPx > 0)) return { maxHeightPx: null };

  const rowStep = rowHeightPx + rowGapPx;
  const target = currentHeightPx - overflowPx;
  // Snap DOWN to the tallest whole number of rows that fits inside `target`
  // — floor, never round, so the reservation never advertises a row it
  // cannot actually show without scrolling.
  const rows = Math.max(minRows, Math.floor((target + rowGapPx) / rowStep));
  const capped = rows * rowStep - rowGapPx;

  // A cap only ever SHRINKS the box — never render taller than what is
  // already on screen.
  return { maxHeightPx: Math.min(capped, currentHeightPx) };
}
