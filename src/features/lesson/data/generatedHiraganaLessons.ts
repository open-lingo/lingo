/**
 * Generated hiragana lessons. Pure module-level evaluation —
 * `buildRowSubLessons` walks the curriculum catalog once at import time and
 * exposes the resulting `LessonContent` instances by id.
 *
 * Adding a row = add it to `hiraganaCurriculum.ts`. No code changes here.
 *
 * Lesson id shape: `ja-m1-${row.id}-${subSuffix}` where subSuffix is
 * "1" | "2" | "3" | "test" (per the alphabet-streamline spec). Legacy id
 * `ja-m1-${row.id}` is migrated forward by `mockProgress.ts`.
 */
import type { LessonContent } from "../types";
import { ALL_ROWS, HIRAGANA_ROWS, DAKUTEN_ROWS, YOON_ROWS } from "./hiraganaCurriculum";
import { buildRowSubLessons } from "./lessonBuilder";
import { buildRecapLesson } from "./buildRecapLesson";

/**
 * Module → row-ids mapping. Mirrors `mockCourse.ts`:
 *   M1 = vowels stub + every HIRAGANA_ROW (pure hiragana).
 *   M2 = every DAKUTEN_ROW then every YOON_ROW (intro/sh-ch/voiced/rare
 *        + capstone). Per curriculum-restructure (2026-05-15).
 */
function buildModuleLessonIdMap(): Record<string, string[]> {
  const rowToIds = (rowId: string) => {
    const row = ALL_ROWS.find((r) => r.id === rowId);
    if (!row) return [];
    const subs = row.subLessons ?? [];
    return subs.length === 0
      ? [`ja-m1-${row.id}`]
      : subs.map((s) => `ja-m1-${row.id}-${s.suffix}`);
  };
  const m1: string[] = ["ja-m1-l1-1", "ja-m1-l1-2"]; // vowels (2 sub-lessons)
  for (const row of HIRAGANA_ROWS) {
    m1.push(...rowToIds(row.id));
  }
  const m2: string[] = [];
  for (const row of DAKUTEN_ROWS) {
    m2.push(...rowToIds(row.id));
  }
  for (const row of YOON_ROWS) {
    m2.push(...rowToIds(row.id));
  }
  return { m1, m2 };
}

const MODULE_LESSON_IDS = buildModuleLessonIdMap();

const MODULE_TITLES: Record<string, string> = {
  m1: "Module 1 · Hiragana",
  m2: "Module 2 · Voicing",
};

export const GENERATED_HIRAGANA_LESSONS: Record<string, LessonContent> = (() => {
  const map: Record<string, LessonContent> = {};
  ALL_ROWS.forEach((row) => {
    // ka's Intro 1 + Intro 2 are hand-authored (mock-ja-m1-ka.ts overrides
    // via mockLessons.ts spread order). The row-test (suffix "test") IS
    // auto-built here — buildRowTestLesson produces a row_test step
    // covering all 5 kana, same as every other consonant row's test.
    for (const lesson of buildRowSubLessons(row)) {
      map[lesson.id] = lesson;
    }
  });
  // Append one recap lesson per module. Recap items source from every
  // row that contributes lessons to that module.
  for (const [moduleId, ids] of Object.entries(MODULE_LESSON_IDS)) {
    const recap = buildRecapLesson(
      moduleId,
      MODULE_TITLES[moduleId] ?? moduleId,
      ids,
    );
    if (recap) map[recap.id] = recap;
  }
  return map;
})();

/** Ordered recap lesson ids per module — consumed by `mockCourse.ts`. */
export const MODULE_RECAP_LESSON_IDS: Record<string, string> = {
  m1: "ja-m1-recap",
  m2: "ja-m2-recap",
};

/**
 * Ordered ids matching the row catalog × sub-lesson order (for course
 * module wiring). Mirrors the array used by `mockCourse.ts` so the
 * pathway renders sub-lessons in pedagogy order.
 */
export const GENERATED_HIRAGANA_LESSON_IDS: string[] = (() => {
  const out: string[] = [];
  for (const row of ALL_ROWS) {
    if (!row.subLessons || row.subLessons.length === 0) {
      out.push(`ja-m1-${row.id}`);
      continue;
    }
    for (const sub of row.subLessons) {
      out.push(`ja-m1-${row.id}-${sub.suffix}`);
    }
  }
  return out;
})();

/**
 * Maps a base row id (e.g. "ka") to all sub-lesson ids in order. Used by
 * the ModulePathway cluster grouper to draw row dividers and by the
 * mockProgress migration to credit legacy `ja-m1-ka` → all sub-lessons.
 */
export const ROW_SUB_LESSON_IDS: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {};
  for (const row of ALL_ROWS) {
    out[row.id] = (row.subLessons ?? []).map(
      (sub) => `ja-m1-${row.id}-${sub.suffix}`,
    );
  }
  return out;
})();

/**
 * Register the row→sub-lesson map on `globalThis` so `mockProgress.ts` can
 * run the streamline migration without a circular import. The progress
 * module is loaded by every page; this map is computed once at curriculum
 * import time.
 */
if (typeof globalThis !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__lingo_row_sub_lesson_ids__ = ROW_SUB_LESSON_IDS;
}
