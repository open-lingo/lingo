import type { LessonContent, LessonStep } from "../types";
import { MOCK_LESSON_M1_L1 } from "./mock-m1-l1";
import { MOCK_LESSON_M1_L2 } from "./mock-m1-l2";
import {
  MOCK_LESSON_JA_M1_L1A,
  MOCK_LESSON_JA_M1_L1B,
} from "./mock-ja-m1-l1";
import {
  MOCK_LESSON_JA_M1_KA_1,
  MOCK_LESSON_JA_M1_KA_2,
  MOCK_LESSON_JA_M1_KA_3,
} from "./mock-ja-m1-ka";
import {
  MOCK_LESSON_JA_M1_SA_1,
  MOCK_LESSON_JA_M1_SA_2,
  MOCK_LESSON_JA_M1_SA_3,
} from "./mock-ja-m1-sa";
import {
  MOCK_LESSON_JA_M1_TA_1,
  MOCK_LESSON_JA_M1_TA_2,
  MOCK_LESSON_JA_M1_TA_3,
} from "./mock-ja-m1-ta";
import {
  MOCK_LESSON_JA_M1_NA_1,
  MOCK_LESSON_JA_M1_NA_2,
  MOCK_LESSON_JA_M1_NA_3,
} from "./mock-ja-m1-na";
import {
  MOCK_LESSON_JA_M1_HA_1,
  MOCK_LESSON_JA_M1_HA_2,
  MOCK_LESSON_JA_M1_HA_3,
} from "./mock-ja-m1-ha";
import {
  MOCK_LESSON_JA_M1_MA_1,
  MOCK_LESSON_JA_M1_MA_2,
  MOCK_LESSON_JA_M1_MA_3,
} from "./mock-ja-m1-ma";
import {
  MOCK_LESSON_JA_M1_RA_1,
  MOCK_LESSON_JA_M1_RA_2,
  MOCK_LESSON_JA_M1_RA_3,
} from "./mock-ja-m1-ra";
import {
  MOCK_LESSON_JA_M1_YA_1,
  MOCK_LESSON_JA_M1_YA_2,
  MOCK_LESSON_JA_M1_YA_3,
} from "./mock-ja-m1-ya";
import {
  MOCK_LESSON_JA_M1_WA_1,
  MOCK_LESSON_JA_M1_WA_2,
  MOCK_LESSON_JA_M1_WA_3,
} from "./mock-ja-m1-wa";
import { MOCK_LESSON_JA_M2_G_1 } from "./mock-ja-m2-g";
import { MOCK_LESSON_JA_M2_Z_1 } from "./mock-ja-m2-z";
import { MOCK_LESSON_JA_M2_D_1 } from "./mock-ja-m2-d";
import { MOCK_LESSON_JA_M2_B_1 } from "./mock-ja-m2-b";
import { MOCK_LESSON_JA_M2_P_1 } from "./mock-ja-m2-p";
import { MOCK_LESSON_JA_M2_YOON_INTRO_1 } from "./mock-ja-m2-yoon-intro";
import { MOCK_LESSON_JA_M2_YOON_SH_CH_1 } from "./mock-ja-m2-yoon-sh-ch";
import { MOCK_LESSON_JA_M2_YOON_VOICED_1 } from "./mock-ja-m2-yoon-voiced";
import { MOCK_LESSON_JA_M2_YOON_RARE_1 } from "./mock-ja-m2-yoon-rare";
import { MOCK_LESSON_JA_SIDEQUEST_SURVIVAL } from "./mock-ja-sidequest-survival";
import { MOCK_LESSON_JA_M3_1 } from "./mock-ja-m3-1";
import { MOCK_LESSON_JA_M3_2 } from "./mock-ja-m3-2";
import { MOCK_LESSON_JA_M3_3 } from "./mock-ja-m3-3";
import { MOCK_LESSON_JA_M3_4 } from "./mock-ja-m3-4";
import { MOCK_LESSON_JA_M3_5 } from "./mock-ja-m3-5";
import { MOCK_LESSON_JA_M3_6 } from "./mock-ja-m3-6";
import { MOCK_LESSON_JA_M3_7 } from "./mock-ja-m3-7";
import { MOCK_LESSON_JA_M3_8 } from "./mock-ja-m3-8";
import { MOCK_LESSON_JA_M3_9 } from "./mock-ja-m3-9";
import { MOCK_LESSON_JA_M3_10 } from "./mock-ja-m3-10";
import { GENERATED_HIRAGANA_LESSONS } from "./generatedHiraganaLessons";
import { ALL_ROWS } from "./hiraganaCurriculum";
import { getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { buildReviewTailSteps } from "./buildReviewTailSteps";

const LESSONS: Record<string, LessonContent> = {
  "m1-l1": MOCK_LESSON_M1_L1,
  "m1-l2": MOCK_LESSON_M1_L2,
  "ja-m1-l1-1": MOCK_LESSON_JA_M1_L1A,
  "ja-m1-l1-2": MOCK_LESSON_JA_M1_L1B,
  ...GENERATED_HIRAGANA_LESSONS,
  // Hand-authored consonant rows spread AFTER generators so they override
  // the auto-built sub-lessons. Mirrors the vowel approach.
  "ja-m1-ka-1": MOCK_LESSON_JA_M1_KA_1,
  "ja-m1-ka-2": MOCK_LESSON_JA_M1_KA_2,
  "ja-m1-ka-3": MOCK_LESSON_JA_M1_KA_3,
  "ja-m1-sa-1": MOCK_LESSON_JA_M1_SA_1,
  "ja-m1-sa-2": MOCK_LESSON_JA_M1_SA_2,
  "ja-m1-sa-3": MOCK_LESSON_JA_M1_SA_3,
  "ja-m1-ta-1": MOCK_LESSON_JA_M1_TA_1,
  "ja-m1-ta-2": MOCK_LESSON_JA_M1_TA_2,
  "ja-m1-ta-3": MOCK_LESSON_JA_M1_TA_3,
  "ja-m1-na-1": MOCK_LESSON_JA_M1_NA_1,
  "ja-m1-na-2": MOCK_LESSON_JA_M1_NA_2,
  "ja-m1-na-3": MOCK_LESSON_JA_M1_NA_3,
  "ja-m1-ha-1": MOCK_LESSON_JA_M1_HA_1,
  "ja-m1-ha-2": MOCK_LESSON_JA_M1_HA_2,
  "ja-m1-ha-3": MOCK_LESSON_JA_M1_HA_3,
  "ja-m1-ma-1": MOCK_LESSON_JA_M1_MA_1,
  "ja-m1-ma-2": MOCK_LESSON_JA_M1_MA_2,
  "ja-m1-ma-3": MOCK_LESSON_JA_M1_MA_3,
  "ja-m1-ra-1": MOCK_LESSON_JA_M1_RA_1,
  "ja-m1-ra-2": MOCK_LESSON_JA_M1_RA_2,
  "ja-m1-ra-3": MOCK_LESSON_JA_M1_RA_3,
  "ja-m1-ya-1": MOCK_LESSON_JA_M1_YA_1,
  "ja-m1-ya-2": MOCK_LESSON_JA_M1_YA_2,
  "ja-m1-ya-3": MOCK_LESSON_JA_M1_YA_3,
  "ja-m1-wa-1": MOCK_LESSON_JA_M1_WA_1,
  "ja-m1-wa-2": MOCK_LESSON_JA_M1_WA_2,
  "ja-m1-wa-3": MOCK_LESSON_JA_M1_WA_3,
  // M2 voiced + handakuten (compact, NO tracing). Each row has ONE
  // content sub-lesson + an auto-built row-test (the auto-builder still
  // generates -test from the curriculum's `isTest` sub-lesson entry).
  "ja-m1-g-1": MOCK_LESSON_JA_M2_G_1,
  "ja-m1-z-1": MOCK_LESSON_JA_M2_Z_1,
  "ja-m1-d-1": MOCK_LESSON_JA_M2_D_1,
  "ja-m1-b-1": MOCK_LESSON_JA_M2_B_1,
  "ja-m1-p-1": MOCK_LESSON_JA_M2_P_1,
  // M2 yōon (compact, NO tracing).
  "ja-m1-yoon-intro-1": MOCK_LESSON_JA_M2_YOON_INTRO_1,
  "ja-m1-yoon-sh-ch-1": MOCK_LESSON_JA_M2_YOON_SH_CH_1,
  "ja-m1-yoon-voiced-1": MOCK_LESSON_JA_M2_YOON_VOICED_1,
  "ja-m1-yoon-rare-1": MOCK_LESSON_JA_M2_YOON_RARE_1,
  // Sidequest lessons — day-1 unlocks, no row/module attachment.
  "ja-sidequest-survival-phrases": MOCK_LESSON_JA_SIDEQUEST_SURVIVAL,
  // M3 — katakana system + first vocab + first grammar. Hand-authored
  // grammar-spine lessons (not row-shaped); the augmentWithReviewTail
  // helper skips them because the ids don't match `ja-mN-{rowId}-{suffix}`.
  "ja-m3-1": MOCK_LESSON_JA_M3_1,
  "ja-m3-2": MOCK_LESSON_JA_M3_2,
  "ja-m3-3": MOCK_LESSON_JA_M3_3,
  "ja-m3-4": MOCK_LESSON_JA_M3_4,
  "ja-m3-5": MOCK_LESSON_JA_M3_5,
  "ja-m3-6": MOCK_LESSON_JA_M3_6,
  "ja-m3-7": MOCK_LESSON_JA_M3_7,
  "ja-m3-8": MOCK_LESSON_JA_M3_8,
  "ja-m3-9": MOCK_LESSON_JA_M3_9,
  "ja-m3-10": MOCK_LESSON_JA_M3_10,
};

/**
 * Extract the row id from a JA sub-lesson id. Returns null for any id that
 * doesn't follow the `ja-mN-{rowId}-{suffix}` shape (e.g. legacy
 * `ja-m1-l1a` / `ja-m1-l1b`, the alphabet-lesson stub, the recap node).
 */
function rowIdOf(lessonId: string): string | null {
  const m = /^ja-m\d+-(.+)-(\d+|test|recap)$/.exec(lessonId);
  return m ? m[1] : null;
}

/**
 * Augment a lesson with the cross-row review tail (Phase 2). Tail items
 * sit just before the final wrap-up info step so the user's last
 * interaction is a retrieval (Karpicke recency).
 *
 * The tail is skipped for:
 *   - lessons that aren't JA sub-lessons (legacy m1-l1 etc.)
 *   - row-test lessons (they ARE the review)
 *   - recap lessons (whole-module review)
 *   - cases where `buildReviewTailSteps` returns [] (empty cross-row pool)
 */
function augmentWithReviewTail(lesson: LessonContent): LessonContent {
  const id = lesson.id;
  // Skip row-test and recap lessons — they're already review-heavy.
  if (id.endsWith("-test") || id.endsWith("-recap")) return lesson;
  const rowId = rowIdOf(id);
  if (!rowId) return lesson;
  // Skip review tail for ids that look like sub-lessons but whose rowId
  // isn't an actual curriculum row (e.g. vowels `ja-m1-l1-1` — the "l1"
  // pseudo-row exists in the pathway but not in HIRAGANA_ROWS).
  if (!ALL_ROWS.some((r) => r.id === rowId)) return lesson;

  const priorLessonIds = new Set(getMockCompletedLessonIds());
  // The current lesson MUST be excluded from the prior set even when
  // revisiting — the tail draws from OTHER rows, not this one.
  priorLessonIds.delete(id);

  const tail = buildReviewTailSteps({
    currentLessonId: id,
    currentRowId: rowId,
    priorLessonIds,
  });
  if (tail.length === 0) return lesson;

  // Insert tail just BEFORE the trailing wrap-up info step (if any).
  const steps: LessonStep[] = [...lesson.steps];
  const lastIdx = steps.length - 1;
  const last = steps[lastIdx];
  if (last && last.type === "info" && last.id.endsWith("-info-end")) {
    steps.splice(lastIdx, 0, ...tail);
  } else {
    steps.push(...tail);
  }
  return { ...lesson, steps };
}

export function getMockLessonContent(
  lessonId: string,
): LessonContent | null {
  const base = LESSONS[lessonId] ?? null;
  if (!base) return null;
  return augmentWithReviewTail(base);
}

export function getAvailableMockLessonIds(): string[] {
  return Object.keys(LESSONS);
}
