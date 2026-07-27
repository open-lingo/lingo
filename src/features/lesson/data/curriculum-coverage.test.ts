/**
 * Coverage audit for the alphabet-streamline curriculum.
 *
 * Asserts that the per-row sub-lesson split preserves every kana + anchor
 * word from the source RowDef. Without this test, anchor-word attrition
 * during refactors is silent and the module recap (which sources its pool
 * from the rows) can quietly diverge from the row's introduced material.
 *
 * Per-row row-tests were retired 2026-07-20 — rows now emit only their
 * content sub-lessons; ★ mastery gates on the module recap.
 */
import { describe, it, expect } from "vitest";
import { ALL_ROWS } from "./hiraganaCurriculum";
import { buildRowSubLessons } from "./lessonBuilder";
import { MOCK_LESSON_JA_M1_KA_3 } from "@/features/languages/ja/curriculum/m1-ka";
import { MOCK_LESSON_JA_M1_SA_3 } from "@/features/languages/ja/curriculum/m1-sa";
import { MOCK_LESSON_JA_M1_TA_3 } from "@/features/languages/ja/curriculum/m1-ta";
import { MOCK_LESSON_JA_M1_NA_3 } from "@/features/languages/ja/curriculum/m1-na";
import { MOCK_LESSON_JA_M1_HA_3 } from "@/features/languages/ja/curriculum/m1-ha";
import { MOCK_LESSON_JA_M1_MA_3 } from "@/features/languages/ja/curriculum/m1-ma";
import { MOCK_LESSON_JA_M1_YA_3 } from "@/features/languages/ja/curriculum/m1-ya";
import { MOCK_LESSON_JA_M1_RA_3 } from "@/features/languages/ja/curriculum/m1-ra";
import { MOCK_LESSON_JA_M1_WA_3 } from "@/features/languages/ja/curriculum/m1-wa";
import { M1_PRIOR_KANA_POOL, M1_PRIOR_WORDS_POOL } from "@/features/languages/ja/curriculum/_consonantRowHelpers";

describe("alphabet-streamline coverage", () => {
  for (const row of ALL_ROWS) {
    describe(`row ${row.id}`, () => {
      it("populates a non-empty subLessons array", () => {
        expect(row.subLessons).toBeDefined();
        expect((row.subLessons ?? []).length).toBeGreaterThan(0);
      });

      it("every introduced kana appears in exactly one sub-lesson", () => {
        const subs = row.subLessons ?? [];
        const seen = new Set<string>();
        for (const sub of subs) {
          for (const k of sub.introduces) {
            expect(
              seen.has(k.kana),
              `${row.id}: kana ${k.kana} introduced in multiple sub-lessons`,
            ).toBe(false);
            seen.add(k.kana);
          }
        }
        for (const k of row.introduces) {
          expect(
            seen.has(k.kana),
            `${row.id}: kana ${k.kana} missing from sub-lessons`,
          ).toBe(true);
        }
      });

      it("every anchor word appears in at least one sub-lesson's anchorWords or build", () => {
        const subs = row.subLessons ?? [];
        const seen = new Set<string>();
        for (const sub of subs) {
          for (const w of sub.anchorWords) seen.add(w.kana);
          if (sub.build) seen.add(sub.build.answer);
        }
        for (const w of row.anchorWords) {
          expect(
            seen.has(w.kana),
            `${row.id}: anchor ${w.kana} missing from sub-lessons`,
          ).toBe(true);
        }
      });

      it("no row carries a per-row row-test sub-lesson (retired 2026-07-20)", () => {
        // Per-row row-tests were retired 2026-07-20; ★ mastery gates on the
        // module recap. Rows now emit only content sub-lessons.
        const subs = row.subLessons ?? [];
        const tests = subs.filter((s) => s.isTest);
        expect(tests.length, `${row.id}: expected no test sub-lessons`).toBe(0);
        expect(
          subs.some((s) => s.suffix === "test"),
          `${row.id}: no sub-lesson should use the "test" suffix`,
        ).toBe(false);
      });

      it("emits a LessonContent per sub-lesson", () => {
        const lessons = buildRowSubLessons(row);
        expect(lessons.length).toBe((row.subLessons ?? []).length);
        for (const lesson of lessons) {
          expect(lesson.id.startsWith(`ja-m1-${row.id}-`)).toBe(true);
          expect(lesson.steps.length).toBeGreaterThan(0);
          // No generated lesson is a row_test any more.
          expect(lesson.steps.some((s) => s.type === "row_test")).toBe(false);
        }
      });
    });
  }
});

/**
 * R2-defer-F (2026-05-18): every M1 non-vowel row's final sub-lesson
 * appends a 4-item prior-row review tail (priorRowReviewTail). Asserts
 * the tail lands in the 14-20 step band (Spencer's 14-18 target plus
 * a +2 cushion for rows with rich pre-sentence content), exercises
 * prior-row sources only (no current-row kana leaks into the recall
 * prompts), and uses 3+ distinct step types so the interleave rule
 * holds. Vowels (l1) is intentionally not in the table — it has no
 * prior to review.
 */
describe("M1 non-vowel rows — prior-row review tail (R2-defer-F)", () => {
  const FINAL_SUBS = [
    { id: "ka", lesson: MOCK_LESSON_JA_M1_KA_3 },
    { id: "sa", lesson: MOCK_LESSON_JA_M1_SA_3 },
    { id: "ta", lesson: MOCK_LESSON_JA_M1_TA_3 },
    { id: "na", lesson: MOCK_LESSON_JA_M1_NA_3 },
    { id: "ha", lesson: MOCK_LESSON_JA_M1_HA_3 },
    { id: "ma", lesson: MOCK_LESSON_JA_M1_MA_3 },
    { id: "ya", lesson: MOCK_LESSON_JA_M1_YA_3 },
    { id: "ra", lesson: MOCK_LESSON_JA_M1_RA_3 },
    { id: "wa", lesson: MOCK_LESSON_JA_M1_WA_3 },
  ];

  for (const { id, lesson } of FINAL_SUBS) {
    describe(`${id}-3`, () => {
      // Tail items use the helper id pattern `m1-<row>-3-rev-…`.
      const tailSteps = lesson.steps.filter((s) =>
        s.id.startsWith(`m1-${id}-3-rev-`),
      );

      it("appends exactly 4 review tail steps", () => {
        expect(tailSteps.length).toBe(4);
      });

      it("total step count sits in the 14-20 band", () => {
        expect(lesson.steps.length).toBeGreaterThanOrEqual(14);
        expect(lesson.steps.length).toBeLessThanOrEqual(20);
      });

      it("tail uses 3+ distinct step types (interleave rule)", () => {
        const types = new Set(tailSteps.map((s) => s.type));
        expect(types.size).toBeGreaterThanOrEqual(3);
      });

      it("tail draws only from prior-row kana + words", () => {
        const priorKana = new Set(
          (M1_PRIOR_KANA_POOL[id] ?? []).map((k) => k.symbol),
        );
        const priorWordKana = new Set(
          (M1_PRIOR_WORDS_POOL[id] ?? []).map((w) => w.kana),
        );
        for (const step of tailSteps) {
          if (step.type === "symbol_recognition" || step.type === "symbol_to_sound") {
            const sym = step.payload.symbol;
            expect(
              priorKana.has(sym),
              `${id} tail step ${step.id} uses non-prior kana ${sym}`,
            ).toBe(true);
          } else if (step.type === "word_image_mcq") {
            // The correct option's `word` field carries the kana.
            const correct = step.options.find((o) => o.id === step.correctOptionId);
            expect(correct).toBeDefined();
            if (!correct) return;
            expect(
              priorWordKana.has(correct.word),
              `${id} tail step ${step.id} uses non-prior word ${correct.word}`,
            ).toBe(true);
          } else if (step.type === "build_sentence") {
            expect(
              priorWordKana.has(step.targetSentence),
              `${id} tail step ${step.id} builds non-prior word ${step.targetSentence}`,
            ).toBe(true);
          }
        }
      });

      it("tail sits at the END (only the closing info-end step follows)", () => {
        const lastTailIdx = lesson.steps.findIndex(
          (s) => s.id === tailSteps[tailSteps.length - 1].id,
        );
        const after = lesson.steps.slice(lastTailIdx + 1);
        // Only an `info` close-out card may follow the tail.
        for (const s of after) {
          expect(s.type, `${id}: non-info step after tail`).toBe("info");
        }
      });
    });
  }
});
