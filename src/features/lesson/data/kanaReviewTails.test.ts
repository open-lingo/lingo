import { describe, expect, it } from "vitest";
import { withKanaReviewTail } from "./kanaReviewTails";
import {
  ALL_KATAKANA_ROW_LESSONS,
  KATAKANA_ROW_SCHEDULE,
  katakanaTaughtBefore,
} from "@/features/languages/ja/curriculum/katakanaRows";
import { M3_1_1, M3_1_2 } from "@/features/languages/ja/curriculum/m3-v2";
import type { SymbolRecognitionStep } from "../types";

/**
 * Katakana extension of the kana review-tail post-pass (rollout
 * 2026-07-01, spec §4.3.2): every `ja-mN-kata` row lesson gets a 3-step
 * prior-katakana recognition tail, drawn STRICTLY from rows taught in
 * earlier modules — never the current row, never hiragana.
 */
describe("withKanaReviewTail — katakana row lessons", () => {
  const tailSteps = (lessonId: string, steps: { id: string }[]) =>
    steps.filter((s) =>
      s.id.startsWith(`${lessonId}-revtail-`),
    ) as SymbolRecognitionStep[];

  it("appends a 3-step katakana tail to every ja-mN-kata lesson", () => {
    for (const lesson of ALL_KATAKANA_ROW_LESSONS) {
      const augmented = withKanaReviewTail(lesson);
      const tail = tailSteps(lesson.id, augmented.steps);
      expect(tail, lesson.id).toHaveLength(3);
      for (const step of tail) {
        expect(step.type).toBe("symbol_recognition");
        expect(step.payload.scriptId).toBe("katakana");
      }
    }
  });

  it("draws targets and distractors only from strictly-earlier rows", () => {
    for (const lesson of ALL_KATAKANA_ROW_LESSONS) {
      const def = KATAKANA_ROW_SCHEDULE.find((r) => r.lessonId === lesson.id)!;
      const prior = new Set(
        katakanaTaughtBefore(def.moduleIndex).map((g) => g.symbol),
      );
      const augmented = withKanaReviewTail(lesson);
      for (const step of tailSteps(lesson.id, augmented.steps)) {
        expect(prior.has(step.payload.symbol), `${lesson.id} target`).toBe(
          true,
        );
        for (const opt of step.options) {
          expect(prior.has(opt.symbol), `${lesson.id} option`).toBe(true);
        }
      }
    }
  });

  it("inserts the tail before a trailing info card", () => {
    const lesson = ALL_KATAKANA_ROW_LESSONS[0];
    const augmented = withKanaReviewTail(lesson);
    const last = augmented.steps[augmented.steps.length - 1];
    expect(last.type).toBe("info");
    expect(augmented.steps.length).toBe(lesson.steps.length + 3);
  });

  it("leaves the M3 ア-row lessons untouched (no prior katakana + hand-authored -rev- tails)", () => {
    expect(withKanaReviewTail(M3_1_1)).toBe(M3_1_1);
    expect(withKanaReviewTail(M3_1_2)).toBe(M3_1_2);
  });

  it("is idempotent — an already-tailed lesson is not tailed again", () => {
    const once = withKanaReviewTail(ALL_KATAKANA_ROW_LESSONS[0]);
    const twice = withKanaReviewTail(once);
    expect(twice).toBe(once);
  });
});
