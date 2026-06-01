/**
 * MCQ correct-answer position distribution audit (2026-05-18).
 *
 * Across every MCQ-shape lesson step in M1 (vowels + sa-row inline LC)
 * + every M3-M7 sub-lesson, count how often the correct option lands
 * in each slot (0..N-1). Confirms that no generator hardcodes the
 * correct answer to a fixed position, which would let learners
 * pattern-match the screen instead of the content.
 *
 * Why: per Spencer's M2 sub-lesson 1 walkthrough, the user can game
 * MCQs whose correct-answer slot is fixed. The shape we want:
 *
 *   - distribution per slot ≈ 1/N for an unbiased generator
 *   - allow some variance — assert no slot holds > MAX_CONCENTRATION
 *     of the corpus per step type
 *
 * This test doubles as a regression guard — if a future sub-lesson
 * lands a new generator that forgets slot rotation, the corresponding
 * step type's distribution will skew and the assertion will fire.
 *
 * What's covered:
 *   - 4-option types (multiple_choice, word_image_mcq,
 *     listening_comprehension, particle_cloze)
 *   - 3-option types (self_explanation_mcq)
 *
 * Step types intentionally NOT in scope:
 *   - match_pairs (no "correct slot" — pairs are unordered relations)
 *   - build_sentence / listening_build (tile-order, not slot-select)
 *   - speaking / translate (generation, not selection)
 *   - symbol_to_sound / symbol_recognition / symbol_intro / symbol_trace
 *     (kana drill primitives — covered by their own helper randomization
 *     in _consonantRowHelpers.ts, not surveyed here)
 */
import { describe, it, expect } from "vitest";
import type { LessonContent, LessonStep } from "../types";

// M3-M7 sub-lessons
import { M3_1_1, M3_1_2, M3_2_1, M3_2_2, M3_3_1, M3_3_2, M3_4_1, M3_4_2, M3_5_1, M3_5_2, M3_6_1, M3_6_2, M3_7_1, M3_7_2, M3_8 } from "@/features/languages/ja/curriculum/m3-v2";
import { M4_1_1, M4_1_2, M4_2_1, M4_2_2, M4_3_1, M4_3_2, M4_4_1, M4_4_2, M4_5_1, M4_5_2, M4_6_1, M4_6_2, M4_7_1, M4_7_2 } from "@/features/languages/ja/curriculum/m4";
import { M5_1_1, M5_1_2, M5_2_1, M5_2_2, M5_3_1, M5_3_2, M5_4_1, M5_4_2, M5_5_1, M5_5_2, M5_6_1, M5_6_2, M5_7_1, M5_7_2 } from "@/features/languages/ja/curriculum/m5";
import { M6_1_1, M6_1_2, M6_2_1, M6_2_2, M6_3_1, M6_3_2, M6_4_1, M6_4_2, M6_5_1, M6_5_2, M6_6_1, M6_6_2, M6_7_1, M6_7_2, M6_8_1, M6_8_2 } from "@/features/languages/ja/curriculum/m6";
import { M7_1_1, M7_1_2, M7_2_1, M7_2_2, M7_3_1, M7_3_2, M7_4_1, M7_4_2, M7_5_1, M7_5_2, M7_6_1, M7_6_2, M7_7_1, M7_7_2, M7_8_1, M7_8_2 } from "@/features/languages/ja/curriculum/m7";

// M1 (only the vowel + sa-row files contain inline LC — others use helper factories
// from _consonantRowHelpers.ts that are already known-good).
import { MOCK_LESSON_JA_M1_L1A, MOCK_LESSON_JA_M1_L1B } from "@/features/languages/ja/curriculum/m1-l1";
import {
  MOCK_LESSON_JA_M1_SA_1,
  MOCK_LESSON_JA_M1_SA_2,
  MOCK_LESSON_JA_M1_SA_3,
} from "@/features/languages/ja/curriculum/m1-sa";

const ALL_LESSONS: LessonContent[] = [
  MOCK_LESSON_JA_M1_L1A, MOCK_LESSON_JA_M1_L1B,
  MOCK_LESSON_JA_M1_SA_1, MOCK_LESSON_JA_M1_SA_2, MOCK_LESSON_JA_M1_SA_3,
  M3_1_1, M3_1_2, M3_2_1, M3_2_2, M3_3_1, M3_3_2, M3_4_1, M3_4_2, M3_5_1, M3_5_2, M3_6_1, M3_6_2, M3_7_1, M3_7_2, M3_8,
  M4_1_1, M4_1_2, M4_2_1, M4_2_2, M4_3_1, M4_3_2, M4_4_1, M4_4_2, M4_5_1, M4_5_2, M4_6_1, M4_6_2, M4_7_1, M4_7_2,
  M5_1_1, M5_1_2, M5_2_1, M5_2_2, M5_3_1, M5_3_2, M5_4_1, M5_4_2, M5_5_1, M5_5_2, M5_6_1, M5_6_2, M5_7_1, M5_7_2,
  M6_1_1, M6_1_2, M6_2_1, M6_2_2, M6_3_1, M6_3_2, M6_4_1, M6_4_2, M6_5_1, M6_5_2, M6_6_1, M6_6_2, M6_7_1, M6_7_2, M6_8_1, M6_8_2,
  M7_1_1, M7_1_2, M7_2_1, M7_2_2, M7_3_1, M7_3_2, M7_4_1, M7_4_2, M7_5_1, M7_5_2, M7_6_1, M7_6_2, M7_7_1, M7_7_2, M7_8_1, M7_8_2,
];

/** Allow at most this fraction of the corpus per slot before we say the
 *  generator is biased. Uniform target = 1/N (0.25 for N=4, 0.33 for N=3);
 *  cap at 0.55 which catches "all slot 0" (1.0) and "mostly slot 0" (0.7+)
 *  but tolerates real per-id-hash variance on small samples. */
const MAX_CONCENTRATION = 0.55;
/** Below this sample size, skip the assertion — distribution is noisy at
 *  small n and we don't want spurious failures for step types that only
 *  appear a handful of times in the corpus. */
const MIN_SAMPLE_FOR_ASSERT = 8;

type CorrectIdx = number | null;

function correctIndexFor(step: LessonStep): CorrectIdx {
  switch (step.type) {
    case "multiple_choice":
    case "word_image_mcq":
    case "listening_comprehension":
    case "self_explanation_mcq": {
      const opts = (step as { options: Array<{ id: string }> }).options;
      const correctId = (step as { correctOptionId: string }).correctOptionId;
      const idx = opts.findIndex((o) => o.id === correctId);
      return idx === -1 ? null : idx;
    }
    case "particle_cloze": {
      const opts = (step as { options: string[] }).options;
      const correct = (step as { correctParticle: string }).correctParticle;
      const idx = opts.indexOf(correct);
      return idx === -1 ? null : idx;
    }
    default:
      return null;
  }
}

/** Build per-step-type histograms across the whole corpus. */
function tallyDistributions(): Record<
  string,
  { total: number; slots: number[]; sampleIds: string[] }
> {
  const acc: Record<
    string,
    { total: number; slots: number[]; sampleIds: string[] }
  > = {};
  for (const lesson of ALL_LESSONS) {
    for (const step of lesson.steps) {
      const idx = correctIndexFor(step);
      if (idx == null) continue;
      const bucket = acc[step.type] ??= { total: 0, slots: [], sampleIds: [] };
      while (bucket.slots.length <= idx) bucket.slots.push(0);
      bucket.slots[idx] += 1;
      bucket.total += 1;
      if (bucket.sampleIds.length < 3) bucket.sampleIds.push(step.id);
    }
  }
  return acc;
}

describe("MCQ correct-position distribution audit", () => {
  const dist = tallyDistributions();

  it("logs the distribution per step type (visual sanity check)", () => {
    // eslint-disable-next-line no-console
    console.log("\n[MCQ position distribution across M1 vowels + sa LC + M3-M7]");
    const stepTypes = Object.keys(dist).sort();
    for (const type of stepTypes) {
      const { total, slots } = dist[type];
      const pct = slots.map((c) => ((c / total) * 100).toFixed(1).padStart(5));
      const counts = slots.map((c) => String(c).padStart(3));
      // eslint-disable-next-line no-console
      console.log(
        `  ${type.padEnd(24)}  n=${String(total).padStart(3)}  ` +
          `slots=[${counts.join(", ")}]  pct=[${pct.join("% ")}%]`,
      );
    }
    expect(stepTypes.length).toBeGreaterThan(0);
  });

  // Hard guard per step type. Bias would mean a generator hardcodes the
  // correct slot — the M3-M7 audit found 4 such generators on
  // 2026-05-18.
  for (const type of [
    "multiple_choice",
    "word_image_mcq",
    "listening_comprehension",
    "self_explanation_mcq",
    "particle_cloze",
  ]) {
    it(`${type}: no slot holds > ${(MAX_CONCENTRATION * 100).toFixed(0)}% of correct answers`, () => {
      const bucket = dist[type];
      if (!bucket) return; // step type unused in the corpus — skip
      if (bucket.total < MIN_SAMPLE_FOR_ASSERT) return; // noise floor
      const maxSlot = Math.max(...bucket.slots);
      const maxFrac = maxSlot / bucket.total;
      if (maxFrac > MAX_CONCENTRATION) {
        const idx = bucket.slots.indexOf(maxSlot);
        const pct = bucket.slots.map((c) =>
          ((c / bucket.total) * 100).toFixed(1),
        );
        throw new Error(
          `${type} concentrated in slot ${idx}: ${maxSlot}/${bucket.total} ` +
            `(${(maxFrac * 100).toFixed(1)}%). Distribution: [${pct.join("%, ")}%]. ` +
            `Sample ids: ${bucket.sampleIds.join(", ")}. ` +
            `Likely a generator that hardcodes the correct option's position — ` +
            `add slot rotation via slotFor(id, N) (see _jaGrammarHelpers.ts).`,
        );
      }
      expect(maxFrac).toBeLessThanOrEqual(MAX_CONCENTRATION);
    });
  }
});
