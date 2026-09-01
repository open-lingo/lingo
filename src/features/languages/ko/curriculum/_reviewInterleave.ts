/**
 * KO review-interleave applier — the module-level face of the compounding-
 * review machinery in `../grammarHelpers.ts` (`pickReviewEntries` /
 * `reviewMatchPairs`).
 *
 * WHY: the 2026-09-01 release audit (§2 #5) found KO had ZERO review
 * machinery — modules never resurfaced earlier material except by
 * accidental vocabulary reuse, the biggest retention risk in m3–m15.
 * ES enforces "compounding review" as a module property (es-quality:
 * ≥60% of a module's lessons reference a prior-module item); JA gets it
 * from `pickReviewAtoms` draws + the kana `priorRowReviewTail`. This is
 * the KO port, applied declaratively per module.
 *
 * WHAT IT DOES: given a module's lesson array, returns a copy with two
 * deterministic prior-module review grids spliced in as lesson TAILS
 * ("review after", never interrupting the teach flow):
 *   - a MID grid at the end of the 3rd lesson — resurfaces 6 earlier-module
 *     words right after the module's first teaching arc;
 *   - a TAIL grid at the end of the second-to-last lesson (the
 *     mini-dialogue in the standard 8-lesson shape) — a second, different
 *     draw before the mastery test, which stays module-pure.
 * Draws are seeded per module+position, so every grid is a stable but
 * distinct 6-word sample; each grid writes recognition SRS credit for the
 * prior-module atoms it exercises (`exercisedAtoms`).
 *
 * The hangul tier (m1/m2) is exempt: its row lessons already carry
 * per-row sweeps + the m2 full review, and glyph drills don't fit the
 * word→meaning grid. Gate: `__tests__/koCompoundingReview.test.ts`.
 */
import type { LessonContent } from "@/features/lesson/types";
import { reviewMatchPairs } from "../grammarHelpers";

/** 0-based lesson indexes that receive a review tail. */
export function reviewSpliceIndexes(lessonCount: number): { mid: number; tail: number } {
  return { mid: 2, tail: lessonCount - 2 };
}

export function withReviewInterleave(
  moduleId: string,
  lessons: LessonContent[],
): LessonContent[] {
  if (lessons.length < 5) {
    throw new Error(
      `ko withReviewInterleave(${moduleId}): needs >= 5 lessons (got ${lessons.length})`,
    );
  }
  const { mid, tail } = reviewSpliceIndexes(lessons.length);
  return lessons.map((l, i) => {
    if (i === mid) {
      return {
        ...l,
        steps: [
          ...l.steps,
          reviewMatchPairs(`ko-${moduleId}-review-mid`, `${moduleId}-mid`, moduleId),
        ],
      };
    }
    if (i === tail) {
      return {
        ...l,
        steps: [
          ...l.steps,
          reviewMatchPairs(`ko-${moduleId}-review-tail`, `${moduleId}-tail`, moduleId),
        ],
      };
    }
    return l;
  });
}
