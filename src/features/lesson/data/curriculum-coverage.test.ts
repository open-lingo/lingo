/**
 * Coverage audit for the alphabet-streamline curriculum.
 *
 * Asserts that the per-row sub-lesson split preserves every kana + anchor
 * word from the source RowDef. Without this test, anchor-word attrition
 * during refactors is silent and the row-test queue can quietly diverge
 * from the row's introduced material.
 */
import { describe, it, expect } from "vitest";
import { ALL_ROWS } from "./hiraganaCurriculum";
import { buildRowSubLessons } from "./lessonBuilder";

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
          if (sub.isTest) continue;
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

      it("every row has exactly one row-test sub-lesson (M2 compact: per-row tests required for mastery)", () => {
        // M2 compact (curriculum-design-v2, 2026-05-16): every voiced and
        // yōon row carries its own row-test for ★ mastery. The standalone
        // yōon-capstone was removed 2026-05-17 (Hannah audit) — m2-recap
        // absorbs the cross-yōon sweep.
        const subs = row.subLessons ?? [];
        const tests = subs.filter((s) => s.isTest);
        expect(tests.length, `${row.id}: expected exactly 1 test`).toBe(1);
        expect(subs[subs.length - 1].isTest).toBe(true);
      });

      it("emits a LessonContent per sub-lesson (including any test)", () => {
        const lessons = buildRowSubLessons(row);
        expect(lessons.length).toBe((row.subLessons ?? []).length);
        for (const lesson of lessons) {
          expect(lesson.id.startsWith(`ja-m1-${row.id}-`)).toBe(true);
          expect(lesson.steps.length).toBeGreaterThan(0);
        }
      });

      it("row-test step covers every kana in the row", () => {
        const lessons = buildRowSubLessons(row);
        const testLesson = lessons.find((l) => l.id.endsWith("-test"));
        expect(testLesson, `${row.id}: missing -test lesson`).toBeDefined();
        if (!testLesson) return;
        const rowTest = testLesson.steps.find((s) => s.type === "row_test");
        expect(rowTest).toBeDefined();
        if (!rowTest || rowTest.type !== "row_test") return;
        const mcKana = new Set<string>();
        for (const item of rowTest.items) {
          if (item.kind === "mc") {
            // The MC prompt includes the kana via promptAudioText.
            if (item.payload.promptAudioText) {
              mcKana.add(item.payload.promptAudioText);
            }
          }
        }
        for (const k of row.introduces) {
          expect(
            mcKana.has(k.kana),
            `${row.id}: kana ${k.kana} missing from row test MC items`,
          ).toBe(true);
        }
      });
    });
  }
});
