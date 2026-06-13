/**
 * Review tails for kana intro sub-lessons (Spencer 2026-06-13).
 *
 * The first two sub-lessons of every kana row drilled ONLY the new row —
 * zero look-back. Kana has no SRS (standing invariant), so in-lesson
 * interleave and each row's third sub-lesson are its only review
 * channels. This post-pass appends three retrieval reps drawn from
 * STRICTLY-EARLIER rows (vowels included) to each `-1` / `-2` kana
 * lesson, regardless of whether the lesson was hand-authored or
 * generated — it runs over the merged lesson map in `mockLessons.ts`,
 * so authoring style can't reintroduce the gap.
 *
 * Lessons that already carry a hand-authored tail (`-rev-` step ids,
 * e.g. the ka row) are left untouched.
 */
import { seededShuffle } from "@/shared/utils/seededShuffle";
import { ALL_ROWS } from "./hiraganaCurriculum";
import type {
  LessonContent,
  LessonStep,
  SymbolRecognitionStep,
} from "../types";

type ReviewKana = { kana: string; romaji: string; hint: string };

/** Vowels are hand-authored (no RowDef) but are every row's oldest
 *  review material — they head the prior pool. */
const VOWEL_KANA: ReviewKana[] = [
  { kana: "あ", romaji: "a", hint: "like 'a' in 'father'" },
  { kana: "い", romaji: "i", hint: "like 'ee' in 'see'" },
  { kana: "う", romaji: "u", hint: "like 'oo' in 'food'" },
  { kana: "え", romaji: "e", hint: "like 'e' in 'egg'" },
  { kana: "お", romaji: "o", hint: "like 'o' in 'more'" },
];

/** Kana introduced strictly before `rowId` in course order. */
function priorKanaPool(rowId: string): ReviewKana[] {
  const idx = ALL_ROWS.findIndex((r) => r.id === rowId);
  if (idx < 0) return [];
  const pool: ReviewKana[] = [...VOWEL_KANA];
  for (let i = 0; i < idx; i++) {
    for (const k of ALL_ROWS[i].introduces) {
      pool.push({ kana: k.kana, romaji: k.romaji, hint: k.hint });
    }
  }
  return pool;
}

function reviewRecognitionStep(
  lessonId: string,
  target: ReviewKana,
  pool: ReviewKana[],
  idx: number,
): SymbolRecognitionStep {
  const distractors = seededShuffle(
    pool.filter((k) => k.kana !== target.kana),
    `${lessonId}-revtail-d${idx}`,
  ).slice(0, 3);
  const options = seededShuffle(
    [
      { id: "correct", symbol: target.kana },
      ...distractors.map((d, i) => ({ id: `opt-${i}`, symbol: d.kana })),
    ],
    `${lessonId}-revtail-o${idx}`,
  );
  return {
    id: `${lessonId}-revtail-${idx}`,
    type: "symbol_recognition",
    payload: {
      symbol: target.kana,
      romanization: target.romaji,
      ipa: `/${target.romaji}/`,
      scriptId: "hiragana",
      hint: target.hint,
    },
    options,
    correctOptionId: "correct",
  };
}

/**
 * Append the review tail when the lesson qualifies; otherwise return the
 * lesson unchanged. Tail lands before a trailing info card (sub-1's wrap
 * slide) so the lesson still closes on its authored beat.
 */
export function withKanaReviewTail(lesson: LessonContent): LessonContent {
  const m = /^ja-m1-(.+)-(1|2)$/.exec(lesson.id);
  if (!m) return lesson;
  const rowId = m[1];
  const pool = priorKanaPool(rowId);
  if (pool.length === 0) return lesson;
  if (lesson.steps.some((s) => /-rev(tail)?-/.test(s.id))) return lesson;

  const picks = seededShuffle(pool, `${lesson.id}-revtail`).slice(0, 3);
  const tail = picks.map((k, i) =>
    reviewRecognitionStep(lesson.id, k, pool, i),
  );

  const steps: LessonStep[] = [...lesson.steps];
  const last = steps[steps.length - 1];
  const insertAt =
    last && last.type === "info" ? steps.length - 1 : steps.length;
  steps.splice(insertAt, 0, ...tail);
  return { ...lesson, steps };
}
