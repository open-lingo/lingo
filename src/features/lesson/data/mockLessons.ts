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
import {
  MOCK_LESSON_JA_M2_G_1,
  MOCK_LESSON_JA_M2_G_2,
  MOCK_LESSON_JA_M2_G_3,
} from "./mock-ja-m2-g";
import {
  MOCK_LESSON_JA_M2_Z_1,
  MOCK_LESSON_JA_M2_Z_2,
  MOCK_LESSON_JA_M2_Z_3,
} from "./mock-ja-m2-z";
import {
  MOCK_LESSON_JA_M2_D_1,
  MOCK_LESSON_JA_M2_D_2,
  MOCK_LESSON_JA_M2_D_3,
} from "./mock-ja-m2-d";
import {
  MOCK_LESSON_JA_M2_B_1,
  MOCK_LESSON_JA_M2_B_2,
  MOCK_LESSON_JA_M2_B_3,
} from "./mock-ja-m2-b";
import {
  MOCK_LESSON_JA_M2_P_1,
  MOCK_LESSON_JA_M2_P_2,
  MOCK_LESSON_JA_M2_P_3,
} from "./mock-ja-m2-p";
import {
  MOCK_LESSON_JA_M2_YOON_INTRO_1,
  MOCK_LESSON_JA_M2_YOON_INTRO_2,
  MOCK_LESSON_JA_M2_YOON_INTRO_3,
} from "./mock-ja-m2-yoon-intro";
import {
  MOCK_LESSON_JA_M2_YOON_SH_CH_1,
  MOCK_LESSON_JA_M2_YOON_SH_CH_2,
  MOCK_LESSON_JA_M2_YOON_SH_CH_3,
} from "./mock-ja-m2-yoon-sh-ch";
import {
  MOCK_LESSON_JA_M2_YOON_VOICED_1,
  MOCK_LESSON_JA_M2_YOON_VOICED_2,
  MOCK_LESSON_JA_M2_YOON_VOICED_3,
} from "./mock-ja-m2-yoon-voiced";
import {
  MOCK_LESSON_JA_M2_YOON_RARE_1,
  MOCK_LESSON_JA_M2_YOON_RARE_2,
  MOCK_LESSON_JA_M2_YOON_RARE_3,
} from "./mock-ja-m2-yoon-rare";
import { MOCK_LESSON_JA_SIDEQUEST_SURVIVAL } from "./mock-ja-sidequest-survival";
import {
  M3_1,
  M3_2,
  M3_3,
  M3_4,
  M3_5,
  M3_6,
  M3_7,
  M3_8,
} from "./mock-ja-m3-v2";
import {
  M4_1,
  M4_2,
  M4_3,
  M4_4,
  M4_5,
  M4_6,
  M4_7,
  M4_8,
} from "./mock-ja-m4";
import {
  M5_1,
  M5_2,
  M5_3,
  M5_4,
  M5_5,
  M5_6,
  M5_7,
  M5_8,
} from "./mock-ja-m5";
import {
  M6_1,
  M6_2,
  M6_3,
  M6_4,
  M6_5,
  M6_6,
  M6_7,
  M6_8,
  M6_9,
} from "./mock-ja-m6";
import {
  M7_1,
  M7_2,
  M7_3,
  M7_4,
  M7_5,
  M7_6,
  M7_7,
  M7_8,
  M7_9,
} from "./mock-ja-m7";
import { buildModuleReviewLessons } from "./buildModuleReview";
import {
  POOL_M3,
  POOL_M4,
  POOL_M5,
  POOL_M6,
} from "./jaReviewPools";
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
  // M2 voiced + handakuten — 3 hand-authored sub-lessons per row + auto
  // row-test (g-row template, extrapolated 2026-05-17 per Spencer).
  "ja-m1-g-1": MOCK_LESSON_JA_M2_G_1,
  "ja-m1-g-2": MOCK_LESSON_JA_M2_G_2,
  "ja-m1-g-3": MOCK_LESSON_JA_M2_G_3,
  "ja-m1-z-1": MOCK_LESSON_JA_M2_Z_1,
  "ja-m1-z-2": MOCK_LESSON_JA_M2_Z_2,
  "ja-m1-z-3": MOCK_LESSON_JA_M2_Z_3,
  "ja-m1-d-1": MOCK_LESSON_JA_M2_D_1,
  "ja-m1-d-2": MOCK_LESSON_JA_M2_D_2,
  "ja-m1-d-3": MOCK_LESSON_JA_M2_D_3,
  "ja-m1-b-1": MOCK_LESSON_JA_M2_B_1,
  "ja-m1-b-2": MOCK_LESSON_JA_M2_B_2,
  "ja-m1-b-3": MOCK_LESSON_JA_M2_B_3,
  "ja-m1-p-1": MOCK_LESSON_JA_M2_P_1,
  "ja-m1-p-2": MOCK_LESSON_JA_M2_P_2,
  "ja-m1-p-3": MOCK_LESSON_JA_M2_P_3,
  // M2 yōon — 3 hand-authored sub-lessons per row + auto row-test.
  "ja-m1-yoon-intro-1": MOCK_LESSON_JA_M2_YOON_INTRO_1,
  "ja-m1-yoon-intro-2": MOCK_LESSON_JA_M2_YOON_INTRO_2,
  "ja-m1-yoon-intro-3": MOCK_LESSON_JA_M2_YOON_INTRO_3,
  "ja-m1-yoon-sh-ch-1": MOCK_LESSON_JA_M2_YOON_SH_CH_1,
  "ja-m1-yoon-sh-ch-2": MOCK_LESSON_JA_M2_YOON_SH_CH_2,
  "ja-m1-yoon-sh-ch-3": MOCK_LESSON_JA_M2_YOON_SH_CH_3,
  "ja-m1-yoon-voiced-1": MOCK_LESSON_JA_M2_YOON_VOICED_1,
  "ja-m1-yoon-voiced-2": MOCK_LESSON_JA_M2_YOON_VOICED_2,
  "ja-m1-yoon-voiced-3": MOCK_LESSON_JA_M2_YOON_VOICED_3,
  "ja-m1-yoon-rare-1": MOCK_LESSON_JA_M2_YOON_RARE_1,
  "ja-m1-yoon-rare-2": MOCK_LESSON_JA_M2_YOON_RARE_2,
  "ja-m1-yoon-rare-3": MOCK_LESSON_JA_M2_YOON_RARE_3,
  // Sidequest lessons — day-1 unlocks, no row/module attachment.
  "ja-sidequest-survival-phrases": MOCK_LESSON_JA_SIDEQUEST_SURVIVAL,
  // M3-M7 — grammar-spine modules (restructure 2026-05-16). Hand-authored
  // and registered explicitly. The augmentWithReviewTail helper skips them
  // because their ids don't match `ja-mN-{rowId}-{suffix}`.
  "ja-m3-1": M3_1,
  "ja-m3-2": M3_2,
  "ja-m3-3": M3_3,
  "ja-m3-4": M3_4,
  "ja-m3-5": M3_5,
  "ja-m3-6": M3_6,
  "ja-m3-7": M3_7,
  "ja-m3-8": M3_8,
  "ja-m4-1": M4_1,
  "ja-m4-2": M4_2,
  "ja-m4-3": M4_3,
  "ja-m4-4": M4_4,
  "ja-m4-5": M4_5,
  "ja-m4-6": M4_6,
  "ja-m4-7": M4_7,
  "ja-m4-8": M4_8,
  "ja-m5-1": M5_1,
  "ja-m5-2": M5_2,
  "ja-m5-3": M5_3,
  "ja-m5-4": M5_4,
  "ja-m5-5": M5_5,
  "ja-m5-6": M5_6,
  "ja-m5-7": M5_7,
  "ja-m5-8": M5_8,
  "ja-m6-1": M6_1,
  "ja-m6-2": M6_2,
  "ja-m6-3": M6_3,
  "ja-m6-4": M6_4,
  "ja-m6-5": M6_5,
  "ja-m6-6": M6_6,
  "ja-m6-7": M6_7,
  "ja-m6-8": M6_8,
  "ja-m6-9": M6_9,
  "ja-m7-1": M7_1,
  "ja-m7-2": M7_2,
  "ja-m7-3": M7_3,
  "ja-m7-4": M7_4,
  "ja-m7-5": M7_5,
  "ja-m7-6": M7_6,
  "ja-m7-7": M7_7,
  "ja-m7-8": M7_8,
  "ja-m7-9": M7_9,
};

// ----- Inter-module review modules ----------------------------------------
// Per Spencer's spec (2026-05-16): 4 review modules, one between each pair
// of content modules. Each cycle = 3 review lessons + 1 mastery test.
// Coverage scales: R1 = M3 only; R2 = M3+M4; R3 = M3+M4+M5; R4 = M4+M5+M6
// (M3 has graduated to its own SRS schedule by the time R4 lands).
function registerReviewLessons() {
  const COURSE = "mock-1";
  const LANG = "ja";
  const reviewBundles = [
    {
      reviewModuleId: "m3-review",
      reviewTitle: "Review · M3",
      pools: [POOL_M3],
    },
    {
      reviewModuleId: "m4-review",
      reviewTitle: "Review · M3 + M4",
      pools: [POOL_M3, POOL_M4],
    },
    {
      reviewModuleId: "m5-review",
      reviewTitle: "Review · M3 + M4 + M5",
      pools: [POOL_M3, POOL_M4, POOL_M5],
    },
    {
      reviewModuleId: "m6-review",
      reviewTitle: "Review · M4 + M5 + M6",
      pools: [POOL_M4, POOL_M5, POOL_M6],
    },
  ];
  for (const bundle of reviewBundles) {
    const lessons = buildModuleReviewLessons({
      ...bundle,
      courseId: COURSE,
      languageId: LANG,
    });
    for (const lesson of lessons) {
      LESSONS[lesson.id] = lesson;
    }
  }
}
registerReviewLessons();

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

/**
 * Modules where the tile-pick `build_sentence` step has outlived its
 * pedagogical purpose. Per Spencer's note (#R1-defer-G, 2026-05-17):
 * "[build_sentence] needs to disappear around module 5 — once we get more
 * than 5 mora words in the mix, it feels redundant." Once learners are
 * confidently assembling 5+ mora words the tile-assembly step adds no
 * value over translate/MCQ. M1-M4 keep it; their words are short enough
 * that production-via-tiles is still scaffolding, not busywork.
 *
 * Review pseudo-modules inherit their source module's status — a
 * `m5-review` lesson reviews M5 content, so it sunsets too.
 */
const BUILD_SENTENCE_SUNSET_MODULES = new Set(["m5", "m6", "m7"]);

export function isSunsetModuleForBuildSentence(moduleId: string): boolean {
  if (BUILD_SENTENCE_SUNSET_MODULES.has(moduleId)) return true;
  const source = /^(.+)-review$/.exec(moduleId)?.[1];
  return source !== undefined && BUILD_SENTENCE_SUNSET_MODULES.has(source);
}

/**
 * Strip `build_sentence` from `lesson.steps` AND from any nested `row_test`
 * item queue. Returns the original lesson if nothing was filtered (cheap
 * identity-equality for callers that compare references).
 *
 * In dev, warns when a lesson ends up with zero non-info steps post-filter
 * (a smell — Spencer would rather know than ship a degenerate lesson).
 */
function stripBuildSentenceSteps(lesson: LessonContent): LessonContent {
  let changed = false;
  const steps: LessonStep[] = [];
  for (const step of lesson.steps) {
    if (step.type === "build_sentence") {
      changed = true;
      continue;
    }
    if (step.type === "row_test") {
      const filtered = step.items.filter((item) => item.kind !== "build");
      if (filtered.length !== step.items.length) {
        changed = true;
        steps.push({ ...step, items: filtered });
        continue;
      }
    }
    steps.push(step);
  }
  if (!changed) return lesson;
  if (import.meta.env.DEV) {
    const realWork = steps.filter(
      (s) => s.type !== "info" && s.type !== "phrase_card",
    );
    if (realWork.length === 0) {
      console.warn(
        `[mockLessons] ${lesson.id}: zero real-work steps after build_sentence sunset filter`,
      );
    }
  }
  return { ...lesson, steps };
}

export function getMockLessonContent(
  lessonId: string,
): LessonContent | null {
  const base = LESSONS[lessonId] ?? null;
  if (!base) return null;
  const augmented = augmentWithReviewTail(base);
  if (isSunsetModuleForBuildSentence(augmented.moduleId)) {
    return stripBuildSentenceSteps(augmented);
  }
  return augmented;
}

// Register a globally-discoverable lookup so cross-feature consumers
// (e.g. mockProgress derivation in shared/domain) can avoid a hard
// import cycle: mockProgress → mockLessons → generatedHiragana → SRS.
// The shape mirrors `__lingo_row_sub_lesson_ids__` used by the
// streamline migration.
if (typeof globalThis !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__lingo_get_lesson_content__ = getMockLessonContent;
}

export function getAvailableMockLessonIds(): string[] {
  return Object.keys(LESSONS);
}

export type LessonLengthRow = {
  id: string;
  title: string;
  stepCount: number;
  estimatedMinutes: number;
  kind?: LessonContent["kind"];
};

export type ModuleLengthRow = {
  moduleId: string;
  lessons: LessonLengthRow[];
  totalLessons: number;
  totalSteps: number;
  totalMinutes: number;
};

/**
 * Dev-tool helper. Walks every registered lesson, groups by moduleId, and
 * returns per-module stats. Used by the `?dev=1` panel button so we can
 * eyeball module length before restructuring. Lesson ids are sorted
 * lexicographically — ja-mN-{slug} sort sensibly for the JA modules.
 */
export function getMockLessonStats(): ModuleLengthRow[] {
  const byModule = new Map<string, LessonLengthRow[]>();
  for (const lesson of Object.values(LESSONS)) {
    const row: LessonLengthRow = {
      id: lesson.id,
      title: lesson.title,
      stepCount: lesson.steps.length,
      estimatedMinutes: lesson.estimatedMinutes ?? 0,
      kind: lesson.kind,
    };
    const list = byModule.get(lesson.moduleId) ?? [];
    list.push(row);
    byModule.set(lesson.moduleId, list);
  }
  const out: ModuleLengthRow[] = [];
  for (const [moduleId, lessons] of byModule) {
    lessons.sort((a, b) => a.id.localeCompare(b.id));
    out.push({
      moduleId,
      lessons,
      totalLessons: lessons.length,
      totalSteps: lessons.reduce((sum, l) => sum + l.stepCount, 0),
      totalMinutes: lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0),
    });
  }
  out.sort((a, b) => a.moduleId.localeCompare(b.moduleId));
  return out;
}
