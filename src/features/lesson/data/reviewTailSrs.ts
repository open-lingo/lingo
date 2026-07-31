import { JA_COURSE_ATOMS_BY_ID } from "@/features/languages/ja/courseAtoms";
import { parseModuleIndex } from "@/shared/settings/romanizationAutoFlip";

/**
 * D2 — sub-lesson vocab review tails write Track A FSRS.
 * (`docs/srs-scheduling-model-2026-06-15.md`)
 *
 * These predicates decide WHICH Track A (vocab) writes fire when a graded
 * step completes. `LessonPage.handleStepComplete` owns the FSRS plumbing;
 * the gating lives here so it's pure + unit-testable.
 */

/**
 * Is `lessonId` one of the dedicated per-module SRS review lessons
 * (`ja-mN-review-1` / `ja-mN-review-2`)? These grade EVERY exercised atom
 * (vocab) and EVERY exercised grammar point — unfiltered — because every
 * atom they surface was introduced in an earlier module. Track B (grammar)
 * writes are still confined to these lessons.
 */
export function isDedicatedReviewLesson(lessonId: string): boolean {
  // OLD course: ja-m4-review-1 / ja-m4-review-2.
  // NEO course (2026-07-26): ja-m7-neo-review-1 … -3, plus the single
  // unnumbered ja-m6-neo-review. This regex used to match the old shape ONLY,
  // which meant NO neo lesson could write to Track B — every grammar point
  // practised in m3-m10 was graded into a closed valve.
  return /^ja-m\d+(-neo)?-review(-\d+)?$/.test(lessonId);
}

/** Parse a bare `fromModule` ordinal ("m4" → 4). 0 if unrecognized. */
function fromModuleIdx(fromModule: string): number {
  const m = /^m(\d+)$/.exec(fromModule);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * D2 core gate: should completing a graded step in a CONTENT sub-lesson
 * advance Track A (vocab) FSRS for `atomId`?
 *
 * Only PRIOR-atom review-tail retrieval writes — never the lesson's own
 * just-introduced words (grading a brand-new word the same session it's
 * taught is not spaced retrieval; violates D6). BOTH conditions must hold:
 *
 *  1. Strictly-prior module: the atom's introducing module ordinal is less
 *     than this lesson's module ordinal. Content review tails (M3–M7) draw
 *     exclusively from strictly-earlier modules, so this admits every tail
 *     atom while excluding all current-module new material. It also filters
 *     forward-reference kana homographs — e.g. すし resolves (via the last-
 *     wins kana→id map) to the m7 atom id `ja-m7-4-v-sushi`; grading that in
 *     an M3 tail would touch a not-yet-introduced atom, so it's skipped.
 *
 *  2. Not introduced here: the atom isn't introduced by this lesson (or its
 *     sub-lesson cluster). Catches kana-words re-introduced as SRS vocab
 *     from an earlier kana module — e.g. `neko` is `fromModule: "m1"` but
 *     `introducedByLessonId: "ja-m3-3"`, so it's brand-new material in the
 *     ja-m3-3-x sub-lessons even though its module ordinal (1) is "prior".
 *     Condition 1 alone would mis-grade those same-day.
 *
 * Returns false for non-JA / unknown atoms, so Korean +未resolved ids never
 * write. Dedicated review lessons bypass this gate entirely — but NOT the
 * collision guard {@link shouldWriteReviewLessonAtom} below — callers should
 * check {@link isDedicatedReviewLesson} first.
 */
export function shouldWriteContentReviewAtom(
  atomId: string,
  lessonId: string,
): boolean {
  const atom = JA_COURSE_ATOMS_BY_ID.get(atomId);
  if (!atom) return false;
  const lessonModuleIdx = parseModuleIndex(lessonId);
  if (lessonModuleIdx <= 0) return false;
  const atomModuleIdx = fromModuleIdx(atom.fromModule);
  // Condition 1 — strictly-prior module (also excludes forward-ref homographs).
  if (atomModuleIdx <= 0 || atomModuleIdx >= lessonModuleIdx) return false;
  // Condition 2 — not introduced by this lesson / its sub-lesson cluster.
  const src = atom.introducedByLessonId;
  if (src && (lessonId === src || lessonId.startsWith(`${src}-`))) return false;
  return true;
}

/**
 * Review-lesson collision guard (2026-07-29, learner-sim BLOCKER on m11):
 * dedicated review lessons grade every exercised atom unconditionally, which
 * is right for the review's own material — but `exercisedAtoms` entries are
 * bare strings, and a string can collide with an unrelated registry row. The
 * m11 plain-past beats emitted `"shita"` / `"kita"` for した/きた (irregular
 * pasts, deliberately unregistered), which are ALSO the registry ids of 下
 * ("below", m17) and 北 ("north", future): every completion of
 * ja-m11-neo-review-3 wrote FSRS history onto flashcards for words the
 * learner meets 5+ modules later — silently, through the flat card keystore.
 *
 * A review lesson may legitimately grade same-module and earlier words only
 * (intro-before-review law), so: skip any id that RESOLVES to a registry row
 * whose module is strictly LATER than the review's own, or whose home isn't a
 * course module at all ("future", quest tags). Ids with no registry row keep
 * grading — IR-only inflection ids (わかった …) are deliberate, and their
 * cards are unreachable by any review surface, so writing them is inert.
 * The content-side rename (した → e.g. `shita-suru`, mirroring `itta-iku`)
 * remains the right cleanup; this guard kills the whole collision class.
 */
export function shouldWriteReviewLessonAtom(
  atomId: string,
  lessonId: string,
): boolean {
  const atom = JA_COURSE_ATOMS_BY_ID.get(atomId);
  if (!atom) return true;
  const lessonModuleIdx = parseModuleIndex(lessonId);
  if (lessonModuleIdx <= 0) return true;
  const atomModuleIdx = fromModuleIdx(atom.fromModule);
  return atomModuleIdx > 0 && atomModuleIdx <= lessonModuleIdx;
}
