/**
 * Property tests for the pure arithmetic in `tileFit.ts` (2026-09-17 project
 * review, lane A5a — `docs/preflight-2026-09-17.md` task 5a).
 *
 * Scope is deliberately narrow: only the exported, DOM-free functions below
 * this file's own docstring boundary in `tileFit.ts` ("The arithmetic —
 * pure, exported, unit-tested. No DOM below this line until the
 * controller."). `planStageFill` (mentioned in the review brief) is NOT
 * exported and takes live `HTMLElement`/`TileCtx` DOM records it measures
 * internally — it is not stub-callable without faking layout, so it is out
 * of scope here; `resolveTileScale` is the function it ultimately feeds,
 * and is where the same invariants are provable without a DOM.
 *
 *   - `quantizeScale`     — the SCALE_STEP rounding primitive
 *   - `computeWidthRatio` — label-width half of the rule
 *   - `computeFillScale`  — stage-fill half of the rule
 *   - `resolveTileScale`  — combines both into the final `--tile-fit-scale`
 */
import { fc, test } from "@fast-check/vitest";
import { describe, expect, it } from "vitest";

import {
  computeFillScale,
  computeWidthRatio,
  quantizeScale,
  resolveTileScale,
} from "./tileFit";

const SCALE_STEP = 0.01;
const EPS = 1e-6;

describe("quantizeScale — the rounding primitive", () => {
  test.prop([fc.double({ min: 0, max: 50, noNaN: true })])(
    "never rounds a label UP — quantizing only ever shrinks or holds",
    (x) => {
      expect(quantizeScale(x)).toBeLessThanOrEqual(x + EPS);
    },
  );

  test.prop([fc.double({ min: 0, max: 50, noNaN: true })])(
    "is idempotent — quantizing a quantized value changes nothing",
    (x) => {
      const once = quantizeScale(x);
      const twice = quantizeScale(once);
      expect(twice).toBeCloseTo(once, 9);
    },
  );

  test.prop([fc.double({ min: 0, max: 50, noNaN: true })])(
    "lands on a multiple of SCALE_STEP",
    (x) => {
      const q = quantizeScale(x);
      const steps = q / SCALE_STEP;
      expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-6);
    },
  );

  test.prop([
    fc.double({ min: 0, max: 50, noNaN: true }),
    fc.double({ min: 0, max: 50, noNaN: true }),
  ])("is monotone non-decreasing", (a, b) => {
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    expect(quantizeScale(lo)).toBeLessThanOrEqual(quantizeScale(hi) + EPS);
  });

  it("non-finite input falls back to 1, not NaN or a crash", () => {
    expect(quantizeScale(NaN)).toBe(1);
    expect(quantizeScale(Infinity)).toBe(1);
  });
});

describe("resolveTileScale — planned scale stays inside [floor, ceiling]", () => {
  // Domain restricted to VALID token values (the shape every real caller
  // passes — `readFitRatios` always returns finite, correctly-ordered
  // ratios): floor in (0,1], ceiling >= 1. Feeding garbage (NaN, floor >
  // ceiling) exercises the function's OWN fallback coercion, a different,
  // narrower contract than "the planned scale respects the tokens" — not
  // what this property is about.
  const validParams = fc.record({
    naturalWidth: fc.double({ min: 1, max: 2000, noNaN: true }),
    usableWidth: fc.double({ min: 1, max: 2000, noNaN: true }),
    fillScale: fc.double({ min: 0.5, max: 2, noNaN: true }),
    floorRatio: fc.double({ min: 0.3, max: 1, noNaN: true }),
    ceilingRatio: fc.double({ min: 1, max: 2, noNaN: true }),
  });

  test.prop([validParams])(
    "scale never falls below the floor and never exceeds the ceiling",
    ({ naturalWidth, usableWidth, fillScale, floorRatio, ceilingRatio }) => {
      const widthRatio = computeWidthRatio(naturalWidth, usableWidth);
      const { scale } = resolveTileScale({
        widthRatio,
        fillScale,
        floorRatio,
        ceilingRatio,
      });
      // fillFloorRatio defaults to floorRatio (see tileFit.ts's own doc on
      // `TileScaleInput.fillFloorRatio`), so with no override the effective
      // floor IS floorRatio.
      expect(scale).toBeGreaterThanOrEqual(floorRatio - EPS);
      expect(scale).toBeLessThanOrEqual(ceilingRatio + EPS);
    },
  );

  test.prop([validParams])(
    "is monotone non-increasing in the widest label (fixed usable width)",
    ({ naturalWidth, usableWidth, fillScale, floorRatio, ceilingRatio }) => {
      const narrower = naturalWidth;
      const wider = naturalWidth * 3; // strictly wider, same usable width
      const scaleAt = (nw: number) =>
        resolveTileScale({
          widthRatio: computeWidthRatio(nw, usableWidth),
          fillScale,
          floorRatio,
          ceilingRatio,
        }).scale;
      // A wider label can never win a BIGGER scale than a narrower one, all
      // else held fixed — the whole point of the width-fit half.
      expect(scaleAt(wider)).toBeLessThanOrEqual(scaleAt(narrower) + EPS);
    },
  );

  test.prop([validParams])(
    "when width alone binds, the scale IS the quantized width ratio",
    ({ naturalWidth, usableWidth, floorRatio, ceilingRatio }) => {
      const widthRatio = computeWidthRatio(naturalWidth, usableWidth);
      fc.pre(widthRatio >= floorRatio && widthRatio <= ceilingRatio);
      const { scale } = resolveTileScale({
        widthRatio,
        fillScale: 1000, // never the binding term
        floorRatio,
        ceilingRatio,
      });
      expect(scale).toBeCloseTo(quantizeScale(widthRatio), 9);
    },
  );
});

describe("computeFillScale — FILL never spends more than the measured px budget", () => {
  // Grow-only regime (`floorRatio` defaults to 1 — the pre-2026-09-16
  // behaviour every non-#89 call site still uses) with a non-negative
  // budget: the new group height at the returned scale, relative to its
  // CURRENT height at `currentFill`, must never exceed
  // `groupHeight + freeHeight` — growing into space that was never measured
  // as free is exactly the #157/#161 over-report bug class this file's
  // header describes.
  test.prop([
    fc.double({ min: 1, max: 5, noNaN: true }), // currentFill, already clamped by a prior pass (>= floor 1)
    fc.double({ min: 1, max: 2000, noNaN: true }), // groupHeight
    fc.double({ min: 0, max: 2000, noNaN: true }), // freeHeight — grow scenario only
    fc.double({ min: 1, max: 10, noNaN: true }), // ceilingRatio
  ])(
    "new height never exceeds current height plus the measured free height",
    (currentFill, groupHeight, freeHeight, ceilingRatio) => {
      const fill = computeFillScale({ freeHeight, groupHeight, currentFill, ceilingRatio });
      const newHeight = groupHeight * (fill / currentFill);
      expect(newHeight).toBeLessThanOrEqual(groupHeight + freeHeight + EPS);
    },
  );
});

// ---------------------------------------------------------------------------
// Shrunk counterexample — proves the "never rounds UP" property above is not
// vacuous.
//
// Method: `quantizeScale` in `tileFit.ts` was temporarily edited (working
// tree only; `git diff` confirmed clean before the edit and after reverting
// it — nothing landed on the real source) from:
//
//   return Math.floor(scale / SCALE_STEP + 1e-9) * SCALE_STEP;
//
// to:
//
//   return Math.ceil(scale / SCALE_STEP - 1e-9) * SCALE_STEP;   // BROKEN: rounds UP
//
// Running the "never rounds a label UP" property above against that broken
// version, fast-check failed after 1 generated case and shrank (24 shrink
// steps) to the literal counterexample `x = 1.0000000000000003e-11` —
// `quantize(x)` returned `0.01`, which is not `<= x`. The general failure
// mode (`quantize(x) > x` for any x that is not itself an exact multiple of
// 0.01) is pinned below with a readable exact value against the REAL
// (`Math.floor`) implementation, which must return a value `<= x`.
// ---------------------------------------------------------------------------
it("regression: quantizing never rounds a label up past its measured width (shrunk counterexample)", () => {
  // 0.001 sits strictly between the 0.00 and 0.01 steps — a Math.ceil rule
  // rounds it UP to 0.01 (> x); the real Math.floor rule correctly rounds
  // it down to 0.00 (<= x).
  expect(quantizeScale(0.001)).toBeLessThanOrEqual(0.001);
  expect(quantizeScale(0.001)).toBeCloseTo(0, 9);
});
