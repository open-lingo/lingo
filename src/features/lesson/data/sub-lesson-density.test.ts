/**
 * Per-sub-lesson step-count density audit (2026-05-18).
 *
 * Spencer's directive after the 2026-05-18 tester walkthrough: every
 * sub-lesson should aim for 20-22 steps (target raised from "14-20,
 * aim 18" because the tester explicitly asked for more end-of-sub-
 * lesson recap and confirmed M1/M2-level density is the right shape).
 * Full context: docs/user-feedback/2026-05-18-tester-m1-m2-walkthrough.md
 *
 * Bands enforced here:
 *   - HARD FAIL  if any sub-lesson has < 12 or > 25 steps (extreme
 *     outliers — either too thin to teach or too dense to sit through).
 *   - SOFT REPORT for the 12-19 band (below the new floor of 20; logged
 *     so the wave-4 re-density pass knows what to lift).
 *   - SOFT REPORT for the 23-25 band (above the aim; logged so the
 *     authoring guide can consider splits).
 *
 * The soft band intentionally does NOT fail the build — Spencer's
 * directive is "going forward," not "stop the world." The hard-fail
 * outliers are the only block.
 *
 * Row-tests + recap stubs are excluded (they're 3-step wrappers around
 * a row_test step by design; not subject to the density bar).
 */
import { describe, expect, it } from "vitest";
import type { LessonContent } from "../types";

import { M3_1, M3_2, M3_3, M3_4, M3_5, M3_6, M3_7, M3_8 } from "./mock-ja-m3-v2";
import { M4_1, M4_2, M4_3, M4_4, M4_5, M4_6, M4_7, M4_8 } from "./mock-ja-m4";
import { M5_1, M5_2, M5_3, M5_4, M5_5, M5_6, M5_7, M5_8 } from "./mock-ja-m5";
import { M6_1, M6_2, M6_3, M6_4, M6_5, M6_6, M6_7, M6_8, M6_9 } from "./mock-ja-m6";
import { M7_1, M7_2, M7_3, M7_4, M7_5, M7_6, M7_7, M7_8, M7_9 } from "./mock-ja-m7";

type Entry = { module: string; lesson: LessonContent };

const M3M7: Entry[] = [
  { module: "M3", lesson: M3_1 }, { module: "M3", lesson: M3_2 },
  { module: "M3", lesson: M3_3 }, { module: "M3", lesson: M3_4 },
  { module: "M3", lesson: M3_5 }, { module: "M3", lesson: M3_6 },
  { module: "M3", lesson: M3_7 }, { module: "M3", lesson: M3_8 },
  { module: "M4", lesson: M4_1 }, { module: "M4", lesson: M4_2 },
  { module: "M4", lesson: M4_3 }, { module: "M4", lesson: M4_4 },
  { module: "M4", lesson: M4_5 }, { module: "M4", lesson: M4_6 },
  { module: "M4", lesson: M4_7 }, { module: "M4", lesson: M4_8 },
  { module: "M5", lesson: M5_1 }, { module: "M5", lesson: M5_2 },
  { module: "M5", lesson: M5_3 }, { module: "M5", lesson: M5_4 },
  { module: "M5", lesson: M5_5 }, { module: "M5", lesson: M5_6 },
  { module: "M5", lesson: M5_7 }, { module: "M5", lesson: M5_8 },
  { module: "M6", lesson: M6_1 }, { module: "M6", lesson: M6_2 },
  { module: "M6", lesson: M6_3 }, { module: "M6", lesson: M6_4 },
  { module: "M6", lesson: M6_5 }, { module: "M6", lesson: M6_6 },
  { module: "M6", lesson: M6_7 }, { module: "M6", lesson: M6_8 },
  { module: "M6", lesson: M6_9 },
  { module: "M7", lesson: M7_1 }, { module: "M7", lesson: M7_2 },
  { module: "M7", lesson: M7_3 }, { module: "M7", lesson: M7_4 },
  { module: "M7", lesson: M7_5 }, { module: "M7", lesson: M7_6 },
  { module: "M7", lesson: M7_7 }, { module: "M7", lesson: M7_8 },
  { module: "M7", lesson: M7_9 },
];

/** Row-test wrappers are exempt — they're info+row_test+info by design,
 *  not subject to the density bar that applies to teaching sub-lessons. */
function isRowTestStub(lesson: LessonContent): boolean {
  return lesson.steps.some((s) => s.type === "row_test");
}

const TARGET_LOW = 20;
const TARGET_HIGH = 22;
const HARD_FAIL_LOW = 12;
const HARD_FAIL_HIGH = 25;

describe("Per-sub-lesson step density", () => {
  const teaching = M3M7.filter((e) => !isRowTestStub(e.lesson));

  it(`logs full distribution (target ${TARGET_LOW}-${TARGET_HIGH}, hard fail outside [${HARD_FAIL_LOW}, ${HARD_FAIL_HIGH}])`, () => {
    const rows: Array<{
      module: string;
      lesson: string;
      steps: number;
      band: "OUTLIER-LOW" | "BELOW" | "AT-TARGET" | "ABOVE" | "OUTLIER-HIGH";
    }> = [];
    for (const e of teaching) {
      const n = e.lesson.steps.length;
      let band: typeof rows[number]["band"];
      if (n < HARD_FAIL_LOW) band = "OUTLIER-LOW";
      else if (n < TARGET_LOW) band = "BELOW";
      else if (n <= TARGET_HIGH) band = "AT-TARGET";
      else if (n <= HARD_FAIL_HIGH) band = "ABOVE";
      else band = "OUTLIER-HIGH";
      rows.push({ module: e.module, lesson: e.lesson.id, steps: n, band });
    }
    const counts = {
      "AT-TARGET": rows.filter((r) => r.band === "AT-TARGET").length,
      BELOW: rows.filter((r) => r.band === "BELOW").length,
      ABOVE: rows.filter((r) => r.band === "ABOVE").length,
      "OUTLIER-LOW": rows.filter((r) => r.band === "OUTLIER-LOW").length,
      "OUTLIER-HIGH": rows.filter((r) => r.band === "OUTLIER-HIGH").length,
    };
    // eslint-disable-next-line no-console
    console.log(
      `\n[sub-lesson density] target ${TARGET_LOW}-${TARGET_HIGH}, hard fail outside [${HARD_FAIL_LOW}, ${HARD_FAIL_HIGH}]`,
    );
    // eslint-disable-next-line no-console
    console.log(
      `  Distribution: at-target=${counts["AT-TARGET"]}  below=${counts.BELOW}  above=${counts.ABOVE}  outlier-low=${counts["OUTLIER-LOW"]}  outlier-high=${counts["OUTLIER-HIGH"]}  (of ${rows.length} teaching sub-lessons)`,
    );
    for (const r of rows) {
      const marker =
        r.band === "AT-TARGET"
          ? "✓"
          : r.band === "BELOW" || r.band === "ABOVE"
            ? "·"
            : "✗";
      // eslint-disable-next-line no-console
      console.log(
        `  ${marker} ${r.module}  ${r.lesson.padEnd(14)}  steps=${String(r.steps).padStart(2)}  ${r.band}`,
      );
    }
    expect(rows.length).toBeGreaterThan(0);
  });

  // Hard guard: extreme outliers only. The 12-19 SOFT band is reported
  // above but does not fail the build (per Spencer's "going forward"
  // directive — incremental re-density, not big-bang).
  for (const e of teaching) {
    it(`${e.module} ${e.lesson.id}: step count within hard bounds [${HARD_FAIL_LOW}, ${HARD_FAIL_HIGH}]`, () => {
      const n = e.lesson.steps.length;
      expect(n).toBeGreaterThanOrEqual(HARD_FAIL_LOW);
      expect(n).toBeLessThanOrEqual(HARD_FAIL_HIGH);
    });
  }
});
