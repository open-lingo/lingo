import type { LessonContent, LessonStep } from "../types";
import { MOCK_LESSON_KO_M1_INTRO } from "@/features/languages/ko/curriculum/m1-intro";
import {
  MOCK_LESSON_KO_M1_V1,
  MOCK_LESSON_KO_M1_V2,
} from "@/features/languages/ko/curriculum/m1-vowels";
import { buildAllKoreanRowLessons } from "@/features/languages/ko/curriculum/m1-rows";
import { buildAllKoreanM2Lessons } from "@/features/languages/ko/curriculum/m2";
import { KO_M3_LESSONS } from "@/features/languages/ko/curriculum/m3";
import { KO_M4_LESSONS } from "@/features/languages/ko/curriculum/m4";
import { KO_M5_LESSONS } from "@/features/languages/ko/curriculum/m5";
import { KO_M6_LESSONS } from "@/features/languages/ko/curriculum/m6";
import { KO_M7_LESSONS } from "@/features/languages/ko/curriculum/m7";
import { KO_M8_LESSONS } from "@/features/languages/ko/curriculum/m8";
import { KO_M9_LESSONS } from "@/features/languages/ko/curriculum/m9";
import { KO_M10_LESSONS } from "@/features/languages/ko/curriculum/m10";
import { KO_M11_LESSONS } from "@/features/languages/ko/curriculum/m11";
import { KO_M12_LESSONS } from "@/features/languages/ko/curriculum/m12";
import { KO_M13_LESSONS } from "@/features/languages/ko/curriculum/m13";
import { KO_M14_LESSONS } from "@/features/languages/ko/curriculum/m14";
import { KO_M15_LESSONS } from "@/features/languages/ko/curriculum/m15";
import { KO_M16_LESSONS } from "@/features/languages/ko/curriculum/m16";
import { KO_M17_LESSONS } from "@/features/languages/ko/curriculum/m17";
import { KO_M18_LESSONS } from "@/features/languages/ko/curriculum/m18";
import { KO_M19_LESSONS } from "@/features/languages/ko/curriculum/m19";
import { KO_M20_LESSONS } from "@/features/languages/ko/curriculum/m20";
import { KO_M21_LESSONS } from "@/features/languages/ko/curriculum/m21";
import { KO_M22_LESSONS } from "@/features/languages/ko/curriculum/m22";
import { KO_M23_LESSONS } from "@/features/languages/ko/curriculum/m23";
import { KO_M24_LESSONS } from "@/features/languages/ko/curriculum/m24";
import { KO_M25_LESSONS } from "@/features/languages/ko/curriculum/m25";
import { KO_M26_LESSONS } from "@/features/languages/ko/curriculum/m26";
import { KO_M27_LESSONS } from "@/features/languages/ko/curriculum/m27";
import { MOCK_LESSON_KO_SIDEQUEST_SURVIVAL } from "@/features/languages/ko/curriculum/sidequest-survival";
import {
  MOCK_LESSON_JA_M1_L1A,
  MOCK_LESSON_JA_M1_L1B,
  MOCK_LESSON_JA_M1_L1C,
} from "@/features/languages/ja/curriculum/m1-l1";
import {
  MOCK_LESSON_JA_M1_KA_1,
  MOCK_LESSON_JA_M1_KA_2,
  MOCK_LESSON_JA_M1_KA_3,
} from "@/features/languages/ja/curriculum/m1-ka";
import {
  MOCK_LESSON_JA_M1_SA_1,
  MOCK_LESSON_JA_M1_SA_2,
  MOCK_LESSON_JA_M1_SA_3,
} from "@/features/languages/ja/curriculum/m1-sa";
import {
  MOCK_LESSON_JA_M1_TA_1,
  MOCK_LESSON_JA_M1_TA_2,
  MOCK_LESSON_JA_M1_TA_3,
} from "@/features/languages/ja/curriculum/m1-ta";
import {
  MOCK_LESSON_JA_M1_NA_1,
  MOCK_LESSON_JA_M1_NA_2,
  MOCK_LESSON_JA_M1_NA_3,
} from "@/features/languages/ja/curriculum/m1-na";
import {
  MOCK_LESSON_JA_M1_HA_1,
  MOCK_LESSON_JA_M1_HA_2,
  MOCK_LESSON_JA_M1_HA_3,
} from "@/features/languages/ja/curriculum/m1-ha";
import {
  MOCK_LESSON_JA_M1_MA_1,
  MOCK_LESSON_JA_M1_MA_2,
  MOCK_LESSON_JA_M1_MA_3,
} from "@/features/languages/ja/curriculum/m1-ma";
import {
  MOCK_LESSON_JA_M1_RA_1,
  MOCK_LESSON_JA_M1_RA_2,
  MOCK_LESSON_JA_M1_RA_3,
} from "@/features/languages/ja/curriculum/m1-ra";
import {
  MOCK_LESSON_JA_M1_YA_1,
  MOCK_LESSON_JA_M1_YA_2,
  MOCK_LESSON_JA_M1_YA_3,
} from "@/features/languages/ja/curriculum/m1-ya";
import {
  MOCK_LESSON_JA_M1_WA_1,
  MOCK_LESSON_JA_M1_WA_2,
  MOCK_LESSON_JA_M1_WA_3,
} from "@/features/languages/ja/curriculum/m1-wa";
import {
  MOCK_LESSON_JA_M2_G_1,
  MOCK_LESSON_JA_M2_G_2,
  MOCK_LESSON_JA_M2_G_3,
} from "@/features/languages/ja/curriculum/m2-g";
import {
  MOCK_LESSON_JA_M2_Z_1,
  MOCK_LESSON_JA_M2_Z_2,
  MOCK_LESSON_JA_M2_Z_3,
} from "@/features/languages/ja/curriculum/m2-z";
import {
  MOCK_LESSON_JA_M2_D_1,
  MOCK_LESSON_JA_M2_D_2,
  MOCK_LESSON_JA_M2_D_3,
} from "@/features/languages/ja/curriculum/m2-d";
import {
  MOCK_LESSON_JA_M2_B_1,
  MOCK_LESSON_JA_M2_B_2,
  MOCK_LESSON_JA_M2_B_3,
} from "@/features/languages/ja/curriculum/m2-b";
import {
  MOCK_LESSON_JA_M2_P_1,
  MOCK_LESSON_JA_M2_P_2,
  MOCK_LESSON_JA_M2_P_3,
} from "@/features/languages/ja/curriculum/m2-p";
import {
  MOCK_LESSON_JA_M2_YOON_INTRO_1,
  MOCK_LESSON_JA_M2_YOON_INTRO_2,
  MOCK_LESSON_JA_M2_YOON_INTRO_3,
} from "@/features/languages/ja/curriculum/m2-yoon-intro";
import {
  MOCK_LESSON_JA_M2_YOON_SH_CH_1,
  MOCK_LESSON_JA_M2_YOON_SH_CH_2,
  MOCK_LESSON_JA_M2_YOON_SH_CH_3,
} from "@/features/languages/ja/curriculum/m2-yoon-sh-ch";
import {
  MOCK_LESSON_JA_M2_YOON_VOICED_1,
  MOCK_LESSON_JA_M2_YOON_VOICED_2,
  MOCK_LESSON_JA_M2_YOON_VOICED_3,
} from "@/features/languages/ja/curriculum/m2-yoon-voiced";
import {
  MOCK_LESSON_JA_M2_YOON_RARE_1,
  MOCK_LESSON_JA_M2_YOON_RARE_2,
  MOCK_LESSON_JA_M2_YOON_RARE_3,
} from "@/features/languages/ja/curriculum/m2-yoon-rare";
import { MOCK_LESSON_JA_SIDEQUEST_SURVIVAL } from "@/features/languages/ja/curriculum/sidequest-survival";
import { MOCK_LESSON_JA_SIDEQUEST_TRAVEL_NAVIGATION } from "@/features/languages/ja/curriculum/sidequest-travel-navigation";
import { MOCK_LESSON_JA_SIDEQUEST_TRAVEL_ORDERING } from "@/features/languages/ja/curriculum/sidequest-travel-ordering";
import { MOCK_LESSON_JA_SIDEQUEST_TRAVEL_HELP } from "@/features/languages/ja/curriculum/sidequest-travel-help";
import { MOCK_LESSON_JA_SIDEQUEST_TRAVEL_SHOPPING } from "@/features/languages/ja/curriculum/sidequest-travel-shopping";
import {
  M8_1_1, M8_1_2, M8_2_1, M8_2_2, M8_3_1, M8_3_2,
  M8_4_1, M8_4_2, M8_5_1, M8_5_2, M8_6_1, M8_6_2,
  M8_8_1, M8_8_2, M8_STORY, M8_7_1, M8_7_2,
} from "@/features/languages/ja/curriculum/m8";
import {
  M9_1_1, M9_1_2, M9_2_1, M9_2_2, M9_3_1, M9_3_2,
  M9_4_1, M9_4_2, M9_5_1, M9_5_2, M9_6_1, M9_6_2,
  M9_STORY, M9_7_1, M9_7_2,
} from "@/features/languages/ja/curriculum/m9";
import {
  M10_1_1, M10_1_2, M10_2_1, M10_2_2, M10_3_1, M10_3_2,
  M10_4_1, M10_4_2, M10_5_1, M10_5_2, M10_6_1, M10_6_2,
  M10_STORY, M10_7_1, M10_7_2,
} from "@/features/languages/ja/curriculum/m10";
import {
  M11_1_1, M11_1_2, M11_2_1, M11_2_2, M11_3_1, M11_3_2,
  M11_4_1, M11_4_2, M11_5_1, M11_5_2, M11_6_1, M11_6_2,
  M11_STORY, M11_7_1, M11_7_2,
} from "@/features/languages/ja/curriculum/m11";
import {
  M12_1_1, M12_1_2, M12_2_1, M12_2_2, M12_3_1, M12_3_2,
  M12_4_1, M12_4_2, M12_5_1, M12_5_2, M12_6_1, M12_6_2,
  M12_STORY, M12_7_1, M12_7_2,
} from "@/features/languages/ja/curriculum/m12";
import {
  M13_1_1, M13_1_2, M13_2_1, M13_2_2, M13_3_1, M13_3_2,
  M13_4_1, M13_4_2, M13_5_1, M13_5_2, M13_6_1, M13_6_2,
  M13_STORY, M13_7_1, M13_7_2,
} from "@/features/languages/ja/curriculum/m13";
import {
  M14_1_1, M14_1_2, M14_2_1, M14_2_2, M14_3_1, M14_3_2,
  M14_4_1, M14_4_2, M14_5_1, M14_5_2, M14_6_1, M14_6_2,
  M14_STORY, M14_7_1, M14_7_2,
} from "@/features/languages/ja/curriculum/m14";
import {
  M15_1_1, M15_1_2, M15_2_1, M15_2_2, M15_3_1, M15_3_2,
  M15_4_1, M15_4_2, M15_5_1, M15_5_2, M15_6_1, M15_6_2,
  M15_STORY, M15_7_1, M15_7_2,
} from "@/features/languages/ja/curriculum/m15";
import {
  M16_1_1, M16_1_2, M16_2_1, M16_2_2, M16_3_1, M16_3_2,
  M16_4_1, M16_4_2, M16_5_1, M16_5_2, M16_6_1, M16_6_2,
  M16_STORY, M16_7_1, M16_7_2,
} from "@/features/languages/ja/curriculum/m16";
import {
  M17_1_1, M17_1_2, M17_2_1, M17_2_2, M17_3_1, M17_3_2,
  M17_4_1, M17_4_2, M17_5_1, M17_5_2, M17_6_1, M17_6_2,
  M17_8_1, M17_8_2,
  M17_STORY, M17_7_1, M17_7_2,
} from "@/features/languages/ja/curriculum/m17";
import {
  M18_1_1, M18_1_2, M18_2_1, M18_2_2, M18_3_1, M18_3_2,
  M18_4_1, M18_4_2, M18_5_1, M18_5_2, M18_6_1, M18_6_2,
  M18_STORY, M18_7_1, M18_7_2,
} from "@/features/languages/ja/curriculum/m18";
import {
  M19_1_1, M19_1_2, M19_2_1, M19_2_2, M19_3_1, M19_3_2,
  M19_4_1, M19_4_2, M19_5_1, M19_5_2, M19_6_1, M19_6_2,
  M19_STORY, M19_7_1, M19_7_2,
} from "@/features/languages/ja/curriculum/m19";
import {
  M20_1_1, M20_1_2, M20_2_1, M20_2_2, M20_3_1, M20_3_2,
  M20_4_1, M20_4_2, M20_5_1, M20_5_2, M20_6_1, M20_6_2,
  M20_STORY, M20_7_1, M20_7_2,
} from "@/features/languages/ja/curriculum/m20";
import {
  M21_1_1, M21_1_2, M21_2_1, M21_2_2, M21_3_1, M21_3_2,
  M21_4_1, M21_4_2, M21_5_1, M21_5_2, M21_6_1, M21_6_2,
  M21_STORY, M21_7_1, M21_7_2,
} from "@/features/languages/ja/curriculum/m21";
import {
  M22_1_1, M22_1_2, M22_2_1, M22_2_2, M22_3_1, M22_3_2,
  M22_4_1, M22_4_2, M22_5_1, M22_5_2, M22_6_1, M22_6_2,
  M22_STORY, M22_7_1, M22_7_2,
} from "@/features/languages/ja/curriculum/m22";
import {
  M23_1_1, M23_1_2, M23_2_1, M23_2_2, M23_3_1, M23_3_2,
  M23_4_1, M23_4_2, M23_5_1, M23_5_2, M23_6_1, M23_6_2,
  M23_8_1, M23_8_2,
  M23_STORY, M23_7_1, M23_7_2,
} from "@/features/languages/ja/curriculum/m23";
import {
  M25_1_1, M25_1_2, M25_2_1, M25_2_2, M25_3_1, M25_3_2,
  M25_4_1, M25_4_2, M25_5_1, M25_5_2, M25_6_1, M25_6_2,
  M25_STORY, M25_7_1, M25_7_2,
} from "@/features/languages/ja/curriculum/m25";
import {
  M26_1_1, M26_1_2, M26_2_1, M26_2_2, M26_3_1, M26_3_2,
  M26_4_1, M26_4_2, M26_5_1, M26_5_2, M26_6_1, M26_6_2,
  M26_STORY, M26_7_1, M26_7_2,
} from "@/features/languages/ja/curriculum/m26";
import {
  M24_1_1, M24_1_2, M24_2_1, M24_2_2, M24_3_1, M24_3_2,
  M24_4_1, M24_4_2, M24_5_1, M24_5_2, M24_6_1, M24_6_2,
  M24_STORY, M24_7_1, M24_7_2,
} from "@/features/languages/ja/curriculum/m24";
import {
  M27_1_1, M27_1_2, M27_2_1, M27_2_2, M27_3_1, M27_3_2,
  M27_4_1, M27_4_2, M27_5_1, M27_5_2, M27_6_1, M27_6_2,
  M27_STORY, M27_7_1, M27_7_2,
} from "@/features/languages/ja/curriculum/m27";
import {
  M3_1_1,
  M3_1_2,
  M3_2_1,
  M3_2_2,
  M3_3_1,
  M3_3_2,
  M3_4_1,
  M3_4_2,
  M3_5_1,
  M3_5_2,
  M3_6_1,
  M3_6_2,
  M3_7_1,
  M3_7_2,
  M3_9,
} from "@/features/languages/ja/curriculum/m3-v2";
// Katakana base-gojūon rollout — one row lesson per module M4-M12 (the
// ア row is the repurposed ja-m3-1-1/1-2 pair in m3-v2). Spec:
// docs/katakana-rollout-romaji-fade-spec-2026-06-30.md
import {
  KATA_M4_KA,
  KATA_M5_SA,
  KATA_M6_TA,
  KATA_M7_NA,
  KATA_M8_HA,
  KATA_M9_MA,
  KATA_M10_YA,
  KATA_M11_RA,
  KATA_M12_WA,
} from "@/features/languages/ja/curriculum/katakanaRows";
import {
  M4_1_1,
  M4_1_2,
  M4_2_1,
  M4_2_2,
  M4_3_1,
  M4_3_2,
  M4_4_1,
  M4_4_2,
  M4_5_1,
  M4_5_2,
  M4_6_1,
  M4_6_2,
  M4_7_1,
  M4_7_2,
  M4_STORY,
} from "@/features/languages/ja/curriculum/m4";
import {
  M5_1_1,
  M5_1_2,
  M5_2_1,
  M5_2_2,
  M5_3_1,
  M5_3_2,
  M5_4_1,
  M5_4_2,
  M5_5_1,
  M5_5_2,
  M5_6_1,
  M5_6_2,
  M5_7_1,
  M5_7_2,
  M5_STORY,
} from "@/features/languages/ja/curriculum/m5";
import {
  M6_1_1,
  M6_1_2,
  M6_2_1,
  M6_2_2,
  M6_3_1,
  M6_3_2,
  M6_4_1,
  M6_4_2,
  M6_5_1,
  M6_5_2,
  M6_6_1,
  M6_6_2,
  M6_7_1,
  M6_7_2,
  M6_8_1,
  M6_8_2,
  M6_STORY,
} from "@/features/languages/ja/curriculum/m6";
import {
  M7_1_1,
  M7_1_2,
  M7_2_1,
  M7_2_2,
  M7_3_1,
  M7_3_2,
  M7_4_1,
  M7_4_2,
  M7_5_1,
  M7_5_2,
  M7_6_1,
  M7_6_2,
  M7_7_1,
  M7_7_2,
  M7_8_1,
  M7_8_2,
  M7_STORY,
} from "@/features/languages/ja/curriculum/m7";
// Standalone inter-module Review pseudo-modules were removed from the pathway
// (2026-05-18); the live ja-mN-review-1/2 lessons are built by
// buildSrsReviewLesson (imported below). The old buildModuleReviewLessons +
// jaReviewPools builder was deleted as dead code (2026-07-01).
import { GENERATED_HIRAGANA_LESSONS } from "./generatedHiraganaLessons";
import { withKanaReviewTail } from "./kanaReviewTails";
import { padMatchPairsFloor, type MatchPadContext } from "./matchPairsFloor";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { ALL_ROWS } from "./hiraganaCurriculum";
import { getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { buildReviewTailSteps } from "./buildReviewTailSteps";
import { buildSrsReviewLesson } from "./buildSrsReviewLesson";
import { buildPlacementTest } from "./buildPlacementTest";

const KOREAN_ROW_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  buildAllKoreanRowLessons().map((l) => [l.id, l]),
);
const KOREAN_M2_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  buildAllKoreanM2Lessons().map((l) => [l.id, l]),
);
const KOREAN_M3_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M3_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M4_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M4_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M5_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M5_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M6_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M6_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M7_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M7_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M8_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M8_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M9_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M9_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M10_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M10_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M11_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M11_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M12_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M12_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M13_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M13_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M14_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M14_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M15_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M15_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M16_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M16_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M17_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M17_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M18_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M18_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M19_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M19_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M20_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M20_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M21_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M21_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M22_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M22_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M23_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M23_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M24_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M24_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M25_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M25_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M26_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M26_LESSONS.map((l) => [l.id, l]),
);
const KOREAN_M27_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  KO_M27_LESSONS.map((l) => [l.id, l]),
);

const LESSONS: Record<string, LessonContent> = {
  // ─── Korean — Module 1 (Hangul foundation, 2026-05-19) ───────────────
  // The legacy m1-l1 (Greetings) / m1-l2 (Introductions) lessons were
  // deleted in favor of teaching the script first. Greetings come back
  // in M3 once the learner can actually read 안녕하세요.
  "ko-m1-intro": MOCK_LESSON_KO_M1_INTRO,
  "ko-m1-v-1": MOCK_LESSON_KO_M1_V1,
  "ko-m1-v-2": MOCK_LESSON_KO_M1_V2,
  ...KOREAN_ROW_LESSONS,
  ...KOREAN_M2_LESSONS,
  // ─── Korean — Module 3 (First phrases, 2026-06-13) ───────────────────
  // greetings → formality → 이에요/예요 copula → 저는 X → asking names →
  // Sino numbers → mini-dialogue → mastery test. Backs the M3 pathway
  // nodes that previously resolved to null.
  ...KOREAN_M3_LESSONS,
  // ─── Korean — Modules 4-6 (2026-06-13) ───────────────────────────────
  // M4 things & possession (의 + 이거/그거/저거), M5 numbers/counters/
  // ordering (native numbers + 개/명/잔 + 주세요), M6 places & existence
  // (있어요/없어요 + 에/에서 + 어디). Mirrors the JA M4-M6 grammar arc with
  // Korean's own grammar. Backs the M4/M5/M6 pathway nodes added to the
  // KO course in mockCourse.ts.
  ...KOREAN_M4_LESSONS,
  ...KOREAN_M5_LESSONS,
  ...KOREAN_M6_LESSONS,
  // ─── Korean — Modules 7-12 (2026-06-13) ──────────────────────────────
  // The N5→N4 grammar spine continuing KO→JA parity. M7 verbs + 해요 present
  // + 을/를, M8 descriptive verbs (adjectives) + attributive, M9 connectors
  // (하고/와/과/도), M10 past tense (았/었/했어요 + copula past), M11 negation
  // (안/못 + 고 싶어요), M12 time & days (native-hour/Sino-minute clock + 요일
  // + time 에). Mirrors the JA M7-M12 arc in Korean's own grammar. Backs the
  // M7-M12 pathway nodes added to the KO course in mockCourse.ts.
  ...KOREAN_M7_LESSONS,
  ...KOREAN_M8_LESSONS,
  ...KOREAN_M9_LESSONS,
  ...KOREAN_M10_LESSONS,
  ...KOREAN_M11_LESSONS,
  ...KOREAN_M12_LESSONS,
  // ─── Korean — Modules 13-18 (2026-06-13) ─────────────────────────────
  // N4-ish spine continuing KO→JA parity. M13 months/frequency/부터·까지·
  // 그래서, M14 clause connectives (고 / 아·어서) + 아·어 주세요 requests +
  // big numbers, M15 progressive (고 있어요) + permission (도 돼요) + 지만,
  // M16 prohibition ((으)면 안 돼요) + 지 마세요 + 고 나서 + 좋아하다/싫어하다,
  // M17 transport + (으)로 + 타다/내리다 + directions + place 까지, M18
  // weather/seasons + future ((으)ㄹ 거예요) + 것 같아요. Mirrors the JA
  // M13-M18 arc in Korean's own grammar. Backs the M13-M18 pathway nodes
  // added to the KO course in mockCourse.ts.
  ...KOREAN_M13_LESSONS,
  ...KOREAN_M14_LESSONS,
  ...KOREAN_M15_LESSONS,
  ...KOREAN_M16_LESSONS,
  ...KOREAN_M17_LESSONS,
  ...KOREAN_M18_LESSONS,
  ...KOREAN_M19_LESSONS,
  ...KOREAN_M20_LESSONS,
  ...KOREAN_M21_LESSONS,
  ...KOREAN_M22_LESSONS,
  ...KOREAN_M23_LESSONS,
  ...KOREAN_M24_LESSONS,
  // ─── Korean — Modules 25-27 (final KO module parity, M1-M27) ─────────
  // M25 plans & intentions ((으)려고 하다 + (으)러 가다 + (으)ㄴ 적이 있다 +
  // (으)ㄹ 때), M26 explaining & excess (거든요 + 너무 + 아/어서 + connectives),
  // M27 modal grammar (아/어야 되다 + 는 게 좋다 + 아/어지다 + 이/가 되다).
  // Mirrors the JA M25-M27 arc in Korean's own grammar. Completes KO module
  // parity with JA. Backs the M25-M27 pathway nodes added in mockCourse.ts.
  ...KOREAN_M25_LESSONS,
  ...KOREAN_M26_LESSONS,
  ...KOREAN_M27_LESSONS,
  "ko-sidequest-survival-phrases": MOCK_LESSON_KO_SIDEQUEST_SURVIVAL,
  // ─── Japanese ────────────────────────────────────────────────────────
  "ja-m1-l1-1": MOCK_LESSON_JA_M1_L1A,
  "ja-m1-l1-2": MOCK_LESSON_JA_M1_L1B,
  "ja-m1-l1-3": MOCK_LESSON_JA_M1_L1C,
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
  "ja-sidequest-travel-navigation": MOCK_LESSON_JA_SIDEQUEST_TRAVEL_NAVIGATION,
  "ja-sidequest-travel-ordering": MOCK_LESSON_JA_SIDEQUEST_TRAVEL_ORDERING,
  "ja-sidequest-travel-help": MOCK_LESSON_JA_SIDEQUEST_TRAVEL_HELP,
  "ja-sidequest-travel-shopping": MOCK_LESSON_JA_SIDEQUEST_TRAVEL_SHOPPING,
  // M3-M7 — grammar-spine modules (restructure 2026-05-16). Hand-authored
  // and registered explicitly. The augmentWithReviewTail helper skips them
  // because their ids don't match `ja-mN-{rowId}-{suffix}`.
  "ja-m3-1-1": M3_1_1,
  "ja-m3-1-2": M3_1_2,
  "ja-m3-2-1": M3_2_1,
  "ja-m3-2-2": M3_2_2,
  "ja-m3-3-1": M3_3_1,
  "ja-m3-3-2": M3_3_2,
  "ja-m3-4-1": M3_4_1,
  "ja-m3-4-2": M3_4_2,
  "ja-m3-5-1": M3_5_1,
  "ja-m3-5-2": M3_5_2,
  "ja-m3-6-1": M3_6_1,
  "ja-m3-6-2": M3_6_2,
  "ja-m3-7-1": M3_7_1,
  "ja-m3-7-2": M3_7_2,
  "ja-m3-9": M3_9,
  // Katakana row lessons (M4-M12) — rendered as normal LessonPage rows,
  // NOT the AlphabetLessonPage trainer (spec D3). Prior-row review tails
  // are appended centrally by withKanaReviewTail.
  "ja-m4-kata": KATA_M4_KA,
  "ja-m5-kata": KATA_M5_SA,
  "ja-m6-kata": KATA_M6_TA,
  "ja-m7-kata": KATA_M7_NA,
  "ja-m8-kata": KATA_M8_HA,
  "ja-m9-kata": KATA_M9_MA,
  "ja-m10-kata": KATA_M10_YA,
  "ja-m11-kata": KATA_M11_RA,
  "ja-m12-kata": KATA_M12_WA,
  "ja-m4-1-1": M4_1_1,
  "ja-m4-1-2": M4_1_2,
  "ja-m4-2-1": M4_2_1,
  "ja-m4-2-2": M4_2_2,
  "ja-m4-3-1": M4_3_1,
  "ja-m4-3-2": M4_3_2,
  "ja-m4-4-1": M4_4_1,
  "ja-m4-4-2": M4_4_2,
  "ja-m4-5-1": M4_5_1,
  "ja-m4-5-2": M4_5_2,
  "ja-m4-6-1": M4_6_1,
  "ja-m4-6-2": M4_6_2,
  "ja-m4-7-1": M4_7_1,
  "ja-m4-7-2": M4_7_2,
  "ja-m4-story": M4_STORY,
  "ja-m5-1-1": M5_1_1,
  "ja-m5-1-2": M5_1_2,
  "ja-m5-2-1": M5_2_1,
  "ja-m5-2-2": M5_2_2,
  "ja-m5-3-1": M5_3_1,
  "ja-m5-3-2": M5_3_2,
  "ja-m5-4-1": M5_4_1,
  "ja-m5-4-2": M5_4_2,
  "ja-m5-5-1": M5_5_1,
  "ja-m5-5-2": M5_5_2,
  "ja-m5-6-1": M5_6_1,
  "ja-m5-6-2": M5_6_2,
  "ja-m5-7-1": M5_7_1,
  "ja-m5-7-2": M5_7_2,
  "ja-m5-story": M5_STORY,
  "ja-m6-1-1": M6_1_1,
  "ja-m6-1-2": M6_1_2,
  "ja-m6-2-1": M6_2_1,
  "ja-m6-2-2": M6_2_2,
  "ja-m6-3-1": M6_3_1,
  "ja-m6-3-2": M6_3_2,
  "ja-m6-4-1": M6_4_1,
  "ja-m6-4-2": M6_4_2,
  "ja-m6-5-1": M6_5_1,
  "ja-m6-5-2": M6_5_2,
  "ja-m6-6-1": M6_6_1,
  "ja-m6-6-2": M6_6_2,
  "ja-m6-7-1": M6_7_1,
  "ja-m6-7-2": M6_7_2,
  "ja-m6-8-1": M6_8_1,
  "ja-m6-8-2": M6_8_2,
  "ja-m6-story": M6_STORY,
  "ja-m7-1-1": M7_1_1,
  "ja-m7-1-2": M7_1_2,
  "ja-m7-2-1": M7_2_1,
  "ja-m7-2-2": M7_2_2,
  "ja-m7-3-1": M7_3_1,
  "ja-m7-3-2": M7_3_2,
  "ja-m7-4-1": M7_4_1,
  "ja-m7-4-2": M7_4_2,
  "ja-m7-5-1": M7_5_1,
  "ja-m7-5-2": M7_5_2,
  "ja-m7-6-1": M7_6_1,
  "ja-m7-6-2": M7_6_2,
  "ja-m7-7-1": M7_7_1,
  "ja-m7-7-2": M7_7_2,
  "ja-m7-8-1": M7_8_1,
  "ja-m7-8-2": M7_8_2,
  "ja-m7-story": M7_STORY,
  // M8 — i-Adjectives + kanji parallel track begins
  "ja-m8-1-1": M8_1_1,
  "ja-m8-1-2": M8_1_2,
  "ja-m8-2-1": M8_2_1,
  "ja-m8-2-2": M8_2_2,
  "ja-m8-3-1": M8_3_1,
  "ja-m8-3-2": M8_3_2,
  "ja-m8-4-1": M8_4_1,
  "ja-m8-4-2": M8_4_2,
  "ja-m8-5-1": M8_5_1,
  "ja-m8-5-2": M8_5_2,
  "ja-m8-6-1": M8_6_1,
  "ja-m8-6-2": M8_6_2,
  "ja-m8-8-1": M8_8_1,
  "ja-m8-8-2": M8_8_2,
  "ja-m8-story": M8_STORY,
  "ja-m8-7-1": M8_7_1,
  "ja-m8-7-2": M8_7_2,
  // M9 — na-Adjectives + よ/ね
  "ja-m9-1-1": M9_1_1, "ja-m9-1-2": M9_1_2,
  "ja-m9-2-1": M9_2_1, "ja-m9-2-2": M9_2_2,
  "ja-m9-3-1": M9_3_1, "ja-m9-3-2": M9_3_2,
  "ja-m9-4-1": M9_4_1, "ja-m9-4-2": M9_4_2,
  "ja-m9-5-1": M9_5_1, "ja-m9-5-2": M9_5_2,
  "ja-m9-6-1": M9_6_1, "ja-m9-6-2": M9_6_2,
  "ja-m9-story": M9_STORY,
  "ja-m9-7-1": M9_7_1, "ja-m9-7-2": M9_7_2,
  // M10 — Past tense (polite only)
  "ja-m10-1-1": M10_1_1, "ja-m10-1-2": M10_1_2,
  "ja-m10-2-1": M10_2_1, "ja-m10-2-2": M10_2_2,
  "ja-m10-3-1": M10_3_1, "ja-m10-3-2": M10_3_2,
  "ja-m10-4-1": M10_4_1, "ja-m10-4-2": M10_4_2,
  "ja-m10-5-1": M10_5_1, "ja-m10-5-2": M10_5_2,
  "ja-m10-6-1": M10_6_1, "ja-m10-6-2": M10_6_2,
  "ja-m10-story": M10_STORY,
  "ja-m10-7-1": M10_7_1, "ja-m10-7-2": M10_7_2,
  // M11 — Negation (ません, ない-form, まだ/もう)
  "ja-m11-1-1": M11_1_1, "ja-m11-1-2": M11_1_2,
  "ja-m11-2-1": M11_2_1, "ja-m11-2-2": M11_2_2,
  "ja-m11-3-1": M11_3_1, "ja-m11-3-2": M11_3_2,
  "ja-m11-4-1": M11_4_1, "ja-m11-4-2": M11_4_2,
  "ja-m11-5-1": M11_5_1, "ja-m11-5-2": M11_5_2,
  "ja-m11-6-1": M11_6_1, "ja-m11-6-2": M11_6_2,
  "ja-m11-story": M11_STORY,
  "ja-m11-7-1": M11_7_1, "ja-m11-7-2": M11_7_2,
  // M12 — Time & Calendar
  "ja-m12-1-1": M12_1_1, "ja-m12-1-2": M12_1_2,
  "ja-m12-2-1": M12_2_1, "ja-m12-2-2": M12_2_2,
  "ja-m12-3-1": M12_3_1, "ja-m12-3-2": M12_3_2,
  "ja-m12-4-1": M12_4_1, "ja-m12-4-2": M12_4_2,
  "ja-m12-5-1": M12_5_1, "ja-m12-5-2": M12_5_2,
  "ja-m12-6-1": M12_6_1, "ja-m12-6-2": M12_6_2,
  "ja-m12-story": M12_STORY,
  "ja-m12-7-1": M12_7_1, "ja-m12-7-2": M12_7_2,
  // M13 — Months + Frequency + から (because)
  "ja-m13-1-1": M13_1_1, "ja-m13-1-2": M13_1_2,
  "ja-m13-2-1": M13_2_1, "ja-m13-2-2": M13_2_2,
  "ja-m13-3-1": M13_3_1, "ja-m13-3-2": M13_3_2,
  "ja-m13-4-1": M13_4_1, "ja-m13-4-2": M13_4_2,
  "ja-m13-5-1": M13_5_1, "ja-m13-5-2": M13_5_2,
  "ja-m13-6-1": M13_6_1, "ja-m13-6-2": M13_6_2,
  "ja-m13-story": M13_STORY,
  "ja-m13-7-1": M13_7_1, "ja-m13-7-2": M13_7_2,
  // M14 — Te-form + Ta-form + Counters
  "ja-m14-1-1": M14_1_1, "ja-m14-1-2": M14_1_2,
  "ja-m14-2-1": M14_2_1, "ja-m14-2-2": M14_2_2,
  "ja-m14-3-1": M14_3_1, "ja-m14-3-2": M14_3_2,
  "ja-m14-4-1": M14_4_1, "ja-m14-4-2": M14_4_2,
  "ja-m14-5-1": M14_5_1, "ja-m14-5-2": M14_5_2,
  "ja-m14-6-1": M14_6_1, "ja-m14-6-2": M14_6_2,
  "ja-m14-story": M14_STORY,
  "ja-m14-7-1": M14_7_1, "ja-m14-7-2": M14_7_2,
  // M15 — Te-form applications + Wants
  "ja-m15-1-1": M15_1_1, "ja-m15-1-2": M15_1_2,
  "ja-m15-2-1": M15_2_1, "ja-m15-2-2": M15_2_2,
  "ja-m15-3-1": M15_3_1, "ja-m15-3-2": M15_3_2,
  "ja-m15-4-1": M15_4_1, "ja-m15-4-2": M15_4_2,
  "ja-m15-5-1": M15_5_1, "ja-m15-5-2": M15_5_2,
  "ja-m15-6-1": M15_6_1, "ja-m15-6-2": M15_6_2,
  "ja-m15-story": M15_STORY,
  "ja-m15-7-1": M15_7_1, "ja-m15-7-2": M15_7_2,
  // M16 — Te-form Part 2 (prohibition + sequence + すき/きらい)
  "ja-m16-1-1": M16_1_1, "ja-m16-1-2": M16_1_2,
  "ja-m16-2-1": M16_2_1, "ja-m16-2-2": M16_2_2,
  "ja-m16-3-1": M16_3_1, "ja-m16-3-2": M16_3_2,
  "ja-m16-4-1": M16_4_1, "ja-m16-4-2": M16_4_2,
  "ja-m16-5-1": M16_5_1, "ja-m16-5-2": M16_5_2,
  "ja-m16-6-1": M16_6_1, "ja-m16-6-2": M16_6_2,
  "ja-m16-story": M16_STORY,
  "ja-m16-7-1": M16_7_1, "ja-m16-7-2": M16_7_2,
  // M17 — Transportation & Directions
  "ja-m17-1-1": M17_1_1, "ja-m17-1-2": M17_1_2,
  "ja-m17-2-1": M17_2_1, "ja-m17-2-2": M17_2_2,
  "ja-m17-3-1": M17_3_1, "ja-m17-3-2": M17_3_2,
  "ja-m17-4-1": M17_4_1, "ja-m17-4-2": M17_4_2,
  "ja-m17-8-1": M17_8_1, "ja-m17-8-2": M17_8_2,
  "ja-m17-5-1": M17_5_1, "ja-m17-5-2": M17_5_2,
  "ja-m17-6-1": M17_6_1, "ja-m17-6-2": M17_6_2,
  "ja-m17-story": M17_STORY,
  "ja-m17-7-1": M17_7_1, "ja-m17-7-2": M17_7_2,
  // M18 — Weather & Nature
  "ja-m18-1-1": M18_1_1, "ja-m18-1-2": M18_1_2,
  "ja-m18-2-1": M18_2_1, "ja-m18-2-2": M18_2_2,
  "ja-m18-3-1": M18_3_1, "ja-m18-3-2": M18_3_2,
  "ja-m18-4-1": M18_4_1, "ja-m18-4-2": M18_4_2,
  "ja-m18-5-1": M18_5_1, "ja-m18-5-2": M18_5_2,
  "ja-m18-6-1": M18_6_1, "ja-m18-6-2": M18_6_2,
  "ja-m18-story": M18_STORY,
  "ja-m18-7-1": M18_7_1, "ja-m18-7-2": M18_7_2,
  // M19 — Family & People
  "ja-m19-1-1": M19_1_1, "ja-m19-1-2": M19_1_2,
  "ja-m19-2-1": M19_2_1, "ja-m19-2-2": M19_2_2,
  "ja-m19-3-1": M19_3_1, "ja-m19-3-2": M19_3_2,
  "ja-m19-4-1": M19_4_1, "ja-m19-4-2": M19_4_2,
  "ja-m19-5-1": M19_5_1, "ja-m19-5-2": M19_5_2,
  "ja-m19-6-1": M19_6_1, "ja-m19-6-2": M19_6_2,
  "ja-m19-story": M19_STORY,
  "ja-m19-7-1": M19_7_1, "ja-m19-7-2": M19_7_2,
  // M20 — Body & Health
  "ja-m20-1-1": M20_1_1, "ja-m20-1-2": M20_1_2,
  "ja-m20-2-1": M20_2_1, "ja-m20-2-2": M20_2_2,
  "ja-m20-3-1": M20_3_1, "ja-m20-3-2": M20_3_2,
  "ja-m20-4-1": M20_4_1, "ja-m20-4-2": M20_4_2,
  "ja-m20-5-1": M20_5_1, "ja-m20-5-2": M20_5_2,
  "ja-m20-6-1": M20_6_1, "ja-m20-6-2": M20_6_2,
  "ja-m20-story": M20_STORY,
  "ja-m20-7-1": M20_7_1, "ja-m20-7-2": M20_7_2,
  // M21 — Food & Restaurants
  "ja-m21-1-1": M21_1_1, "ja-m21-1-2": M21_1_2,
  "ja-m21-2-1": M21_2_1, "ja-m21-2-2": M21_2_2,
  "ja-m21-3-1": M21_3_1, "ja-m21-3-2": M21_3_2,
  "ja-m21-4-1": M21_4_1, "ja-m21-4-2": M21_4_2,
  "ja-m21-5-1": M21_5_1, "ja-m21-5-2": M21_5_2,
  "ja-m21-6-1": M21_6_1, "ja-m21-6-2": M21_6_2,
  "ja-m21-story": M21_STORY,
  "ja-m21-7-1": M21_7_1, "ja-m21-7-2": M21_7_2,
  // M22 — Comparison
  "ja-m22-1-1": M22_1_1, "ja-m22-1-2": M22_1_2,
  "ja-m22-2-1": M22_2_1, "ja-m22-2-2": M22_2_2,
  "ja-m22-3-1": M22_3_1, "ja-m22-3-2": M22_3_2,
  "ja-m22-4-1": M22_4_1, "ja-m22-4-2": M22_4_2,
  "ja-m22-5-1": M22_5_1, "ja-m22-5-2": M22_5_2,
  "ja-m22-6-1": M22_6_1, "ja-m22-6-2": M22_6_2,
  "ja-m22-story": M22_STORY,
  "ja-m22-7-1": M22_7_1, "ja-m22-7-2": M22_7_2,
  // M23 — Capability & Suggestions
  "ja-m23-1-1": M23_1_1, "ja-m23-1-2": M23_1_2,
  "ja-m23-8-1": M23_8_1, "ja-m23-8-2": M23_8_2,
  "ja-m23-2-1": M23_2_1, "ja-m23-2-2": M23_2_2,
  "ja-m23-3-1": M23_3_1, "ja-m23-3-2": M23_3_2,
  "ja-m23-4-1": M23_4_1, "ja-m23-4-2": M23_4_2,
  "ja-m23-5-1": M23_5_1, "ja-m23-5-2": M23_5_2,
  "ja-m23-6-1": M23_6_1, "ja-m23-6-2": M23_6_2,
  "ja-m23-story": M23_STORY,
  "ja-m23-7-1": M23_7_1, "ja-m23-7-2": M23_7_2,
  // M25 — Plans & Intentions
  "ja-m25-1-1": M25_1_1, "ja-m25-1-2": M25_1_2,
  "ja-m25-2-1": M25_2_1, "ja-m25-2-2": M25_2_2,
  "ja-m25-3-1": M25_3_1, "ja-m25-3-2": M25_3_2,
  "ja-m25-4-1": M25_4_1, "ja-m25-4-2": M25_4_2,
  "ja-m25-5-1": M25_5_1, "ja-m25-5-2": M25_5_2,
  "ja-m25-6-1": M25_6_1, "ja-m25-6-2": M25_6_2,
  "ja-m25-story": M25_STORY,
  "ja-m25-7-1": M25_7_1, "ja-m25-7-2": M25_7_2,
  // M26 — Explanatory & Excess
  "ja-m26-1-1": M26_1_1, "ja-m26-1-2": M26_1_2,
  "ja-m26-2-1": M26_2_1, "ja-m26-2-2": M26_2_2,
  "ja-m26-3-1": M26_3_1, "ja-m26-3-2": M26_3_2,
  "ja-m26-4-1": M26_4_1, "ja-m26-4-2": M26_4_2,
  "ja-m26-5-1": M26_5_1, "ja-m26-5-2": M26_5_2,
  "ja-m26-6-1": M26_6_1, "ja-m26-6-2": M26_6_2,
  "ja-m26-story": M26_STORY,
  "ja-m26-7-1": M26_7_1, "ja-m26-7-2": M26_7_2,
  // M24 — Hobbies & Activities
  "ja-m24-1-1": M24_1_1, "ja-m24-1-2": M24_1_2,
  "ja-m24-2-1": M24_2_1, "ja-m24-2-2": M24_2_2,
  "ja-m24-3-1": M24_3_1, "ja-m24-3-2": M24_3_2,
  "ja-m24-4-1": M24_4_1, "ja-m24-4-2": M24_4_2,
  "ja-m24-5-1": M24_5_1, "ja-m24-5-2": M24_5_2,
  "ja-m24-6-1": M24_6_1, "ja-m24-6-2": M24_6_2,
  "ja-m24-story": M24_STORY,
  "ja-m24-7-1": M24_7_1, "ja-m24-7-2": M24_7_2,
  // M27 — Modal Grammar
  "ja-m27-1-1": M27_1_1, "ja-m27-1-2": M27_1_2,
  "ja-m27-2-1": M27_2_1, "ja-m27-2-2": M27_2_2,
  "ja-m27-3-1": M27_3_1, "ja-m27-3-2": M27_3_2,
  "ja-m27-4-1": M27_4_1, "ja-m27-4-2": M27_4_2,
  "ja-m27-5-1": M27_5_1, "ja-m27-5-2": M27_5_2,
  "ja-m27-6-1": M27_6_1, "ja-m27-6-2": M27_6_2,
  "ja-m27-story": M27_STORY,
  "ja-m27-7-1": M27_7_1, "ja-m27-7-2": M27_7_2,
};

// ----- Inter-module review modules — REMOVED 2026-05-18 -------------------
// The four standalone Review pseudo-modules (m3-review..m6-review) that
// sat between content modules in the pathway were retired. The M3-M7
// density rebuild now bakes compounding review into every sub-lesson tail
// (per docs/m3-m7-rebuild-spec-2026-05-18.md §3 — review-to-new ratio
// ≥0.25), so the dedicated review-module entries became pathway weight
// without pedagogical value. The `buildModuleReviewLessons` + jaReviewPools
// builder they relied on was deleted as dead code (2026-07-01); the live
// `moduleReviewSchedule` infrastructure remains in its own file.

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
// 2026-05-18 rebuild: M5-M7 sunset removed. Rebuilt M5-M7 substitute
// build_sentence with translateStep + listeningBuildSentence + speaking
// per docs/m3-m7-rebuild-spec-2026-05-18.md §4, so the runtime strip is
// no longer needed. Empty set kept as a future safety net — re-populate
// if a downstream module legitimately needs the strip path.
const BUILD_SENTENCE_SUNSET_MODULES = new Set<string>();

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

/**
 * Heavy, curriculum-wide indexes for the match-pairs floor pass, built
 * once from the RAW LESSONS map (no post-passes → no recursion). `todayMs`
 * is refreshed per call so FSRS overdue scoring stays current.
 */
let matchPadHeavyBits: Omit<MatchPadContext, "todayMs"> | null = null;
function getMatchPadContext(): MatchPadContext {
  if (!matchPadHeavyBits) {
    const rawLessons = Object.values(LESSONS);
    const rawById = new Map(rawLessons.map((l) => [l.id, l]));
    const orderedLessonIds: string[] = [];
    const course = getMockCourse("ja");
    for (const mod of course.modules) {
      const m = mod as unknown as {
        lessons?: { id: string }[];
        lessonGroups?: { lessons?: { id: string }[] }[];
      };
      for (const l of m.lessons ?? []) orderedLessonIds.push(l.id);
      for (const g of m.lessonGroups ?? [])
        for (const l of g.lessons ?? []) orderedLessonIds.push(l.id);
    }
    matchPadHeavyBits = { rawLessons, rawById, orderedLessonIds };
  }
  return { ...matchPadHeavyBits, todayMs: Date.now() };
}

export function getMockLessonContent(
  lessonId: string,
): LessonContent | null {
  const base = LESSONS[lessonId] ?? null;
  if (base) {
    const augmented = withKanaReviewTail(augmentWithReviewTail(base));
    const shaped = isSunsetModuleForBuildSentence(augmented.moduleId)
      ? stripBuildSentenceSteps(augmented)
      : augmented;
    return padMatchPairsFloor(shaped, getMatchPadContext());
  }

  const reviewMatch = /^ja-(m\d+)-review-([12])$/.exec(lessonId);
  if (reviewMatch) {
    return padMatchPairsFloor(
      buildSrsReviewLesson({
        moduleId: reviewMatch[1],
        position: parseInt(reviewMatch[2]) as 1 | 2,
        courseId: "mock-1",
        languageId: "ja",
      }),
      getMatchPadContext(),
    );
  }

  // Placement test — dynamically built, not in the static LESSONS map.
  if (lessonId === "ja-placement") {
    return buildPlacementTest();
  }

  return null;
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
