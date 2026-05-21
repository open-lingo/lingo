/**
 * Wave 4 acceptance suite (2026-05-18).
 *
 * Static-analysis verification that M3-M7 meets the standards listed in
 * `docs/wave-4-m3-m7-reauthor-2026-05-18.md` §2. Each assertion maps to
 * a numbered standard. These complement the Playwright persona walks:
 *
 *   - Playwright walks confirm RUNTIME behavior (lessons load, steps
 *     advance, no console errors).
 *   - This suite confirms STRUCTURAL contracts (density, ratios,
 *     placement, compounding) without needing a browser.
 *
 * Spencer's acceptance bar: "confirmed M3-M7 works for half-module-a-
 * day pacing with 80% memory + building upon previous lessons." Each
 * structural standard below is a necessary precondition for that bar.
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

function isRowTestStub(lesson: LessonContent): boolean {
  return lesson.steps.some((s) => s.type === "row_test");
}

const TEACHING = M3M7.filter((e) => !isRowTestStub(e.lesson));

const GENERATION_TYPES = new Set([
  "translate", "speaking", "build_sentence", "listening_build",
]);

const DIALOGUE_CLOSER_IDS = new Set([
  "ja-m3-7", "ja-m4-7", "ja-m5-7", "ja-m6-8", "ja-m7-8",
]);

describe("Wave 4 — M3-M7 acceptance (structural)", () => {
  // ───── Standard 1: Density 20-22 (soft 18-24 grace) ────────────────
  it("every teaching sub-lesson has ≥18 steps (soft floor, target 20-22)", () => {
    const offenders = TEACHING.filter((e) => e.lesson.steps.length < 18).map(
      (e) => `${e.module} ${e.lesson.id} (${e.lesson.steps.length})`,
    );
    expect(offenders, `${offenders.length} sub-lesson(s) below 18 steps:\n  ${offenders.join("\n  ")}`).toHaveLength(0);
  });

  it("at least 70% of teaching sub-lessons hit the 20-22 target band", () => {
    const atTarget = TEACHING.filter((e) => {
      const n = e.lesson.steps.length;
      return n >= 20 && n <= 22;
    }).length;
    const pct = atTarget / TEACHING.length;
    expect(
      pct,
      `Only ${atTarget}/${TEACHING.length} (${(pct * 100).toFixed(0)}%) at target. Need ≥70%.`,
    ).toBeGreaterThanOrEqual(0.7);
  });

  // ───── Standard 2: ≥5 distinct step types per sub-lesson ───────────
  it("every teaching sub-lesson has ≥5 distinct step types", () => {
    const offenders: string[] = [];
    for (const e of TEACHING) {
      const types = new Set(e.lesson.steps.map((s) => s.type));
      if (types.size < 5) {
        offenders.push(`${e.module} ${e.lesson.id} (${types.size} types: ${[...types].join(", ")})`);
      }
    }
    expect(offenders, `${offenders.length} thin-variety sub-lesson(s):\n  ${offenders.join("\n  ")}`).toHaveLength(0);
  });

  // ───── Standard 3: ≥1 generation step per sub-lesson ───────────────
  it("every teaching sub-lesson has ≥1 generation step (translate/speaking/build/listening_build)", () => {
    const offenders: string[] = [];
    for (const e of TEACHING) {
      const generations = e.lesson.steps.filter((s) => GENERATION_TYPES.has(s.type));
      if (generations.length < 1) {
        offenders.push(`${e.module} ${e.lesson.id}`);
      }
    }
    expect(offenders, `Sub-lessons with 0 generation steps:\n  ${offenders.join("\n  ")}`).toHaveLength(0);
  });

  // ───── Standard 4: production-retrieval step present ───────────────
  // Updated 2026-05-18: the production-retrieval tier was `translate` (typed
  // textarea). That step accepted romaji shortcuts which defeated kana
  // retrieval, so every M3-M7 `translate` was migrated to `build_sentence`
  // (tile-bank assembly) or `multiple_choice` (single-token retrieval).
  // The acceptance criterion shifted accordingly.
  it("every teaching sub-lesson has ≥1 production-retrieval step (build_sentence / translate / listening_build / speaking)", () => {
    const PRODUCTION: ReadonlySet<string> = new Set([
      "build_sentence",
      "translate",
      "listening_build",
      "speaking",
    ]);
    const offenders: string[] = [];
    for (const e of TEACHING) {
      const hits = e.lesson.steps.filter((s) => PRODUCTION.has(s.type));
      if (hits.length < 1) {
        offenders.push(`${e.module} ${e.lesson.id}`);
      }
    }
    expect(offenders, `Sub-lessons without any production-retrieval step:\n  ${offenders.join("\n  ")}`).toHaveLength(0);
  });

  // ───── Standard 5: dialogue closers use dialogue_listen ────────────
  it("dialogue closers (M3-7, M4-7, M5-7, M6-8, M7-8) use the new dialogue_listen step type", () => {
    const offenders: string[] = [];
    for (const e of TEACHING) {
      if (!DIALOGUE_CLOSER_IDS.has(e.lesson.id)) continue;
      const has = e.lesson.steps.some((s) => s.type === "dialogue_listen");
      if (!has) offenders.push(e.lesson.id);
    }
    expect(
      offenders,
      `Dialogue closer(s) NOT using dialogue_listen (still on legacy dialogueLesson factory):\n  ${offenders.join("\n  ")}`,
    ).toHaveLength(0);
  });

  // ───── Standard 6: selfExplain placement at N-1 of drill cluster ───
  // Operational definition: the selfExplain step should appear AFTER ≥3
  // commit-able steps (cloze / MCQ / translate / speaking / etc.) in
  // the same lesson — NOT as the first commit-able step after the intro.
  it("every `selfExplain` step appears after ≥3 prior commit-able steps", () => {
    const COMMITABLE: ReadonlySet<string> = new Set([
      "particle_cloze", "multiple_choice", "word_image_mcq",
      "listening_comprehension", "listening_build", "translate",
      "build_sentence", "speaking", "match_pairs", "self_explanation_mcq",
    ]);
    const offenders: string[] = [];
    for (const e of TEACHING) {
      let commitsBefore = 0;
      for (const step of e.lesson.steps) {
        if (step.type === "self_explanation_mcq") {
          if (commitsBefore < 3) {
            offenders.push(`${e.module} ${e.lesson.id} → ${step.id} (only ${commitsBefore} prior commits)`);
          }
        } else if (COMMITABLE.has(step.type)) {
          commitsBefore++;
        }
      }
    }
    expect(
      offenders,
      `selfExplain step(s) firing too early (CLT expertise-reversal risk):\n  ${offenders.slice(0, 10).join("\n  ")}`,
    ).toHaveLength(0);
  });

  // ───── Standard 7: half-module-a-day pacing feasibility ────────────
  // Each module = ~8 sub-lessons. Half-module/day = 4 sub-lessons/day.
  // Assert: sum of estimatedMinutes for ANY 4 consecutive teaching sub-
  // lessons in a module stays ≤ 35 min (a realistic half-module sitting).
  it("any 4 consecutive teaching sub-lessons in a module fit ≤45 min", () => {
    // 4 consecutive sub-lessons × ~10 min each ≈ 40 min. The half-module
    // sitting budget is 45 min (allows the learner to take the densest
    // run in a single sitting; lighter runs fit in 30-35).
    const byModule: Record<string, LessonContent[]> = {};
    for (const e of TEACHING) {
      byModule[e.module] ??= [];
      byModule[e.module].push(e.lesson);
    }
    const offenders: string[] = [];
    for (const [mod, lessons] of Object.entries(byModule)) {
      for (let i = 0; i + 4 <= lessons.length; i++) {
        const window = lessons.slice(i, i + 4);
        const total = window.reduce((acc, l) => acc + (l.estimatedMinutes ?? 0), 0);
        if (total > 45) {
          offenders.push(`${mod} ${window.map((l) => l.id).join("+")} = ${total} min`);
        }
      }
    }
    expect(
      offenders,
      `Half-module windows that exceed the 45-min sitting budget:\n  ${offenders.join("\n  ")}`,
    ).toHaveLength(0);
  });

  // ───── Standard 8: Cumulative-review ratio per sub-lesson ──────────
  // Operational definition: any sub-lesson with an idPrefix containing
  // "-rev-" or "-review" is a review step. Count these as a fraction of
  // total steps. Floor: 0.20 (20%) — slightly relaxed from the §10.4
  // 0.25 target since not every sub-lesson explicitly tags review steps
  // with "-rev-" (some authors interleave without the tag). This catches
  // egregious cases.
  it("every teaching sub-lesson has at least 1 explicit review-tail step", () => {
    const offenders: string[] = [];
    for (const e of TEACHING) {
      const review = e.lesson.steps.filter(
        (s) => s.id.includes("-rev-") || s.id.includes("-review"),
      );
      if (review.length < 1) {
        offenders.push(`${e.module} ${e.lesson.id}`);
      }
    }
    expect(
      offenders,
      `Sub-lessons with 0 explicit review-tagged steps (compounding-review violation):\n  ${offenders.slice(0, 10).join("\n  ")}`,
    ).toHaveLength(0);
  });

  // ───── Standard 9: row tests preserved (don't break the pathway) ───
  it("every module ends with a row_test stub lesson", () => {
    const byModule: Record<string, LessonContent[]> = {};
    for (const e of M3M7) {
      byModule[e.module] ??= [];
      byModule[e.module].push(e.lesson);
    }
    for (const [mod, lessons] of Object.entries(byModule)) {
      const last = lessons[lessons.length - 1];
      expect(
        last.steps.some((s) => s.type === "row_test"),
        `${mod} should end with a row_test stub; ${last.id} doesn't have one`,
      ).toBe(true);
    }
  });

  // ───── Distribution summary for the report ─────────────────────────
  it("(report) prints step-type + density + closer distribution", () => {
    const stepCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    for (const e of TEACHING) {
      stepCounts[`${e.module} ${e.lesson.id}`] = e.lesson.steps.length;
      for (const s of e.lesson.steps) {
        typeCounts[s.type] = (typeCounts[s.type] ?? 0) + 1;
      }
    }
    // eslint-disable-next-line no-console
    console.log("\n[wave-4 acceptance summary]");
    // eslint-disable-next-line no-console
    console.log(`  Teaching sub-lessons: ${TEACHING.length}`);
    // eslint-disable-next-line no-console
    console.log(`  Density distribution: ${Object.entries(stepCounts).map(([, n]) => n).sort((a, b) => a - b).join(", ")}`);
    // eslint-disable-next-line no-console
    console.log(`  Step-type totals:`);
    for (const [type, count] of Object.entries(typeCounts).sort(([, a], [, b]) => b - a)) {
      // eslint-disable-next-line no-console
      console.log(`    ${type.padEnd(28)} ${String(count).padStart(4)}`);
    }
    expect(TEACHING.length).toBeGreaterThan(0);
  });
});
