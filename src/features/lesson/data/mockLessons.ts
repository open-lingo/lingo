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
import { ES_ALL_LESSONS } from "@/features/languages/es/curriculum";
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
import {
  M30_1_1, M30_1_2, M30_2_1, M30_2_2, M30_3_1, M30_3_2,
  M30_4_1, M30_4_2, M30_5_1, M30_5_2, M30_6_1, M30_6_2,
  M30_STORY, M30_7_1, M30_7_2,
} from "@/features/languages/ja/curriculum/m30";
// m3-neo — PILOT of the dict-form-first rewrite (spine tile s03). Deep-link
// only: registered here so the lessons resolve, deliberately NOT wired into
// mockCourse.ts pathways.
import {
  M3_NEO_1, M3_NEO_2, M3_NEO_3, M3_NEO_4, M3_NEO_5, M3_NEO_6,
  M3_NEO_REVIEW,
} from "@/features/languages/ja/curriculum/m3-neo";
// m4-neo — first at-scale module of the rewrite (spine tile s04).
import {
  M4_NEO_1, M4_NEO_2, M4_NEO_3, M4_NEO_4, M4_NEO_5, M4_NEO_6,
  M4_NEO_7, M4_NEO_8, M4_NEO_9, M4_NEO_10, M4_NEO_11, M4_NEO_REVIEW,
} from "@/features/languages/ja/curriculum/m4-neo";
// m5-neo — VERBS I (spine tile s05).
import {
  M5_NEO_1, M5_NEO_2, M5_NEO_3, M5_NEO_4, M5_NEO_5, M5_NEO_6,
  M5_NEO_7, M5_NEO_8, M5_NEO_9, M5_NEO_10, M5_NEO_11, M5_NEO_REVIEW,
} from "@/features/languages/ja/curriculum/m5-neo";
// m6-neo — NEGATIVES & EXISTENCE (spine tile n06a). FIRST compiler-pipeline
// module: lessons compiled from ir/m6.ir.json at import (moduleCompiler).
import { M6_NEO_LESSONS } from "@/features/languages/ja/curriculum/m6-neo";
// m7-neo — POLITENESS AS A LAYER (spine tile s07). First module on the
// 2026-07-26 shape: 11 teaching (2 of them katakana) + 3 review + 1 challenge.
import { M7_NEO_LESSONS } from "@/features/languages/ja/curriculum/m7-neo";
import { M8_NEO_LESSONS } from "@/features/languages/ja/curriculum/m8-neo";
import { M9_NEO_LESSONS } from "@/features/languages/ja/curriculum/m9-neo";
import { M10_NEO_LESSONS } from "@/features/languages/ja/curriculum/m10-neo";
import { M11_NEO_LESSONS } from "@/features/languages/ja/curriculum/m11-neo";
import { M12_NEO_LESSONS } from "@/features/languages/ja/curriculum/m12-neo";
import { M13_NEO_LESSONS } from "@/features/languages/ja/curriculum/m13-neo";
import { M14_NEO_LESSONS } from "@/features/languages/ja/curriculum/m14-neo";
import { M15_NEO_LESSONS } from "@/features/languages/ja/curriculum/m15-neo";
import { M16_NEO_LESSONS } from "@/features/languages/ja/curriculum/m16-neo";
import { M17_NEO_LESSONS } from "@/features/languages/ja/curriculum/m17-neo";
import { M18_NEO_LESSONS } from "@/features/languages/ja/curriculum/m18-neo";
import { M19_NEO_LESSONS } from "@/features/languages/ja/curriculum/m19-neo";
import { M20_NEO_LESSONS } from "@/features/languages/ja/curriculum/m20-neo";
import { M21_NEO_LESSONS } from "@/features/languages/ja/curriculum/m21-neo";
import { M22_NEO_LESSONS } from "@/features/languages/ja/curriculum/m22-neo";
import { M23_NEO_LESSONS } from "@/features/languages/ja/curriculum/m23-neo";
import { M24_NEO_LESSONS } from "@/features/languages/ja/curriculum/m24-neo";
import { M25_NEO_LESSONS } from "@/features/languages/ja/curriculum/m25-neo";
import { M26_NEO_LESSONS } from "@/features/languages/ja/curriculum/m26-neo";
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
// Standalone inter-module Review pseudo-modules were removed from the pathway
// (2026-05-18); the live ja-mN-review-1/2 lessons are built by
// buildSrsReviewLesson (imported below). The old buildModuleReviewLessons +
// jaReviewPools builder was deleted as dead code (2026-07-01).
import { GENERATED_HIRAGANA_LESSONS } from "./generatedHiraganaLessons";
import { withKanaReviewTail } from "./kanaReviewTails";
import { padMatchPairsFloor, type MatchPadContext } from "./matchPairsFloor";
import { padBuildTileFloor } from "./buildTileFloor";
import { applyKanjiSurfaces } from "@/features/languages/ja/secondScript/applyKanjiSurfaces";
import { deriveGrammarMicroSteps } from "./deriveGrammarMicroSteps";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { ALL_ROWS } from "./hiraganaCurriculum";
import { getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { buildReviewTailSteps } from "./buildReviewTailSteps";
import { buildSrsReviewLesson } from "./buildSrsReviewLesson";

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
const SPANISH_LESSONS: Record<string, LessonContent> = Object.fromEntries(
  ES_ALL_LESSONS.map((l) => [l.id, l]),
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
  // ─── Spanish — authored modules (assembled in es/curriculum/index.ts;
  // stub modules contribute nothing until their authoring wave lands) ───
  ...SPANISH_LESSONS,
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
  // Sidequest lessons — DELETED 2026-07-16 (Spencer: content to be remade
  // from scratch). The quest tiles + map stops stay (comingSoon) so the
  // transit-map dots keep rendering; re-register remade lessons here.
  // M3-M7 — grammar-spine modules (restructure 2026-05-16). Hand-authored
  // and registered explicitly. The augmentWithReviewTail helper skips them
  // because their ids don't match `ja-mN-{rowId}-{suffix}`.
  // m3-neo pilot (deep-link only — not in mockCourse pathways)
  "ja-m3-neo-1": M3_NEO_1,
  "ja-m3-neo-2": M3_NEO_2,
  "ja-m3-neo-3": M3_NEO_3,
  "ja-m3-neo-4": M3_NEO_4,
  "ja-m3-neo-5": M3_NEO_5,
  "ja-m3-neo-6": M3_NEO_6,
  "ja-m3-neo-review": M3_NEO_REVIEW,
  // m4-neo (spine tile s04)
  "ja-m4-neo-1": M4_NEO_1,
  "ja-m4-neo-2": M4_NEO_2,
  "ja-m4-neo-3": M4_NEO_3,
  "ja-m4-neo-4": M4_NEO_4,
  "ja-m4-neo-5": M4_NEO_5,
  "ja-m4-neo-6": M4_NEO_6,
  "ja-m4-neo-7": M4_NEO_7,
  "ja-m4-neo-8": M4_NEO_8,
  "ja-m4-neo-9": M4_NEO_9,
  "ja-m4-neo-10": M4_NEO_10,
  "ja-m4-neo-11": M4_NEO_11,
  "ja-m4-neo-review": M4_NEO_REVIEW,
  // m5-neo (spine tile s05)
  "ja-m5-neo-1": M5_NEO_1,
  "ja-m5-neo-2": M5_NEO_2,
  "ja-m5-neo-3": M5_NEO_3,
  "ja-m5-neo-4": M5_NEO_4,
  "ja-m5-neo-5": M5_NEO_5,
  "ja-m5-neo-6": M5_NEO_6,
  "ja-m5-neo-7": M5_NEO_7,
  "ja-m5-neo-8": M5_NEO_8,
  "ja-m5-neo-9": M5_NEO_9,
  "ja-m5-neo-10": M5_NEO_10,
  "ja-m5-neo-11": M5_NEO_11,
  "ja-m5-neo-review": M5_NEO_REVIEW,
  // m6-neo (spine tile n06a) — compiled from ir/m6.ir.json at import.
  ...Object.fromEntries(M6_NEO_LESSONS.map((l) => [l.id, l] as const)),
  // m7-neo (spine tile s07) — compiled from ir/m7.ir.json + 2 katakana rows.
  ...Object.fromEntries(M7_NEO_LESSONS.map((l) => [l.id, l] as const)),
  // m8-neo (tile n02) — compiled from ir/m8.ir.json + 2 katakana rows.
  ...Object.fromEntries(M8_NEO_LESSONS.map((l) => [l.id, l] as const)),
  ...Object.fromEntries(M9_NEO_LESSONS.map((l) => [l.id, l] as const)),
  ...Object.fromEntries(M10_NEO_LESSONS.map((l) => [l.id, l] as const)),
  ...Object.fromEntries(M11_NEO_LESSONS.map((l) => [l.id, l] as const)),
  // m12-neo (tile s09) — compiled from ir/m12.ir.json. No katakana rows:
  // the katakana programme ended at m11.
  ...Object.fromEntries(M12_NEO_LESSONS.map((l) => [l.id, l] as const)),
  // m13-neo (tile n05) — compiled from ir/m13.ir.json. Wanting: たい + ほしい.
  ...Object.fromEntries(M13_NEO_LESSONS.map((l) => [l.id, l] as const)),
  // m14-neo (tile n06b) — compiled from ir/m14.ir.json. ている + the
  // permission/prohibition family.
  ...Object.fromEntries(M14_NEO_LESSONS.map((l) => [l.id, l] as const)),
  // m15-neo (tile s11) — compiled from ir/m15.ir.json. Relative clauses,
  // こと/の nominalizers, とき, and the まえに / てから ordering pair.
  ...Object.fromEntries(M15_NEO_LESSONS.map((l) => [l.id, l] as const)),
  // m16-neo (tile s13) — compiled from ir/m16.ir.json. Clause linking with
  // から / ので / けど, から…まで spans, and the past-negative cells that
  // close both paradigms (ませんでした, なかった).
  ...Object.fromEntries(M16_NEO_LESSONS.map((l) => [l.id, l] as const)),
  // m17-neo (tile n07) — compiled from ir/m17.ir.json. Family I: the うち
  // (your-side) family words, 〜にん / 〜さい counters, and the adnominal
  // demonstratives この / その / あの / どの.
  ...Object.fromEntries(M17_NEO_LESSONS.map((l) => [l.id, l] as const)),
  // m18-neo (tile n08) — compiled from ir/m18.ir.json. The quotation particle
  // と: 〜と おもう for opinions, 〜と いう for names and reported speech, and
  // the first kanji READING set.
  ...Object.fromEntries(M18_NEO_LESSONS.map((l) => [l.id, l] as const)),
  // m19-neo (tile s15) — compiled from ir/m19.ir.json. Motion particles: に
  // for arrival, へ for direction (written he, read e), で for the means,
  // ます-stem + に いく for the purpose, 〜ふん/〜ぷん, から and までに.
  ...Object.fromEntries(M19_NEO_LESSONS.map((l) => [l.id, l] as const)),
  // m20-neo (tile n09) — compiled from ir/m20.ir.json. Comparisons: the winner
  // first with ほうが, the loser with より, 「AとBと どっちが〜？」 to ask,
  // どちら as its polite twin, numbers 100-10000 and the 〜こ counter.
  ...Object.fromEntries(M20_NEO_LESSONS.map((l) => [l.id, l] as const)),
  ...Object.fromEntries(M21_NEO_LESSONS.map((l) => [l.id, l] as const)),
  ...Object.fromEntries(M22_NEO_LESSONS.map((l) => [l.id, l] as const)),
  ...Object.fromEntries(M23_NEO_LESSONS.map((l) => [l.id, l] as const)),
  ...Object.fromEntries(M24_NEO_LESSONS.map((l) => [l.id, l] as const)),
  ...Object.fromEntries(M25_NEO_LESSONS.map((l) => [l.id, l] as const)),
  ...Object.fromEntries(M26_NEO_LESSONS.map((l) => [l.id, l] as const)),
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
  // M8 — i-Adjectives + kanji parallel track begins
  // M9 — na-Adjectives + よ/ね
  // M10 — Past tense (polite only)
  // M11 — Negation (ません, ない-form, まだ/もう)
  // M12 — Time & Calendar
  // M13 — Months + Frequency + から (because)
  // M14 — Te-form + Ta-form + Counters
  // M15 — Te-form applications + Wants
  // M16 — Te-form Part 2 (prohibition + sequence + すき/きらい)
  // M17 — Transportation & Directions
  // M18 — Weather & Nature
  // M19 — Family & People
  // M20 — Body & Health
  // M21 — Food & Restaurants
  // M22 — Comparison
  // M23 — Capability & Suggestions
  // M25 — Plans & Intentions
  // M26 — Explanatory & Excess
  // M24 — Hobbies & Activities
  // M27 — Modal Grammar
  // M29 — Plain form (N4 pilot #1)
  // M30 — Casual register (N4 pilot #2).
  "ja-m30-1-1": M30_1_1, "ja-m30-1-2": M30_1_2,
  "ja-m30-2-1": M30_2_1, "ja-m30-2-2": M30_2_2,
  "ja-m30-3-1": M30_3_1, "ja-m30-3-2": M30_3_2,
  "ja-m30-4-1": M30_4_1, "ja-m30-4-2": M30_4_2,
  "ja-m30-5-1": M30_5_1, "ja-m30-5-2": M30_5_2,
  "ja-m30-6-1": M30_6_1, "ja-m30-6-2": M30_6_2,
  "ja-m30-story": M30_STORY,
  "ja-m30-7-1": M30_7_1, "ja-m30-7-2": M30_7_2,
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
// 2026-05-18 rebuild: M5-M7 sunset removed — the rebuild made the runtime
// strip unnecessary. (Earlier note claimed M5-M7 use translateStep; as of
// 2026-07-12 the earliest translate is M11 — content drifted since.)
// Empty set kept as a future safety net — re-populate if a downstream
// module legitimately needs the strip path.
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
 * once PER LANGUAGE from the RAW LESSONS map (no post-passes → no
 * recursion) and the language's own course order — fill pools are
 * language-keyed, so an es lesson must never pad from ja indexes. Cached
 * per language (the ja fast path stays a single build); `todayMs` is
 * refreshed per call so FSRS overdue scoring stays current.
 */
const matchPadHeavyBits = new Map<string, Omit<MatchPadContext, "todayMs">>();
function getMatchPadContext(languageId: string): MatchPadContext {
  let bits = matchPadHeavyBits.get(languageId);
  if (!bits) {
    const rawLessons = Object.values(LESSONS);
    const rawById = new Map(rawLessons.map((l) => [l.id, l]));
    const orderedLessonIds: string[] = [];
    const moduleOrder: string[] = [];
    const course = getMockCourse(languageId);
    for (const mod of course.modules) {
      moduleOrder.push(mod.id);
      const m = mod as unknown as {
        lessons?: { id: string }[];
        lessonGroups?: { lessons?: { id: string }[] }[];
      };
      for (const l of m.lessons ?? []) orderedLessonIds.push(l.id);
      for (const g of m.lessonGroups ?? [])
        for (const l of g.lessons ?? []) orderedLessonIds.push(l.id);
    }
    bits = { rawLessons, rawById, orderedLessonIds, moduleOrder };
    matchPadHeavyBits.set(languageId, bits);
  }
  return { ...bits, todayMs: Date.now() };
}

export function getMockLessonContent(
  lessonId: string,
): LessonContent | null {
  const base = LESSONS[lessonId] ?? null;
  if (base) {
    const augmented = withKanaReviewTail(
      augmentWithReviewTail(deriveGrammarMicroSteps(base)),
    );
    const shaped = isSunsetModuleForBuildSentence(augmented.moduleId)
      ? stripBuildSentenceSteps(augmented)
      : augmented;
    // Kanji surface pass runs on the fully-shaped lesson (needs moduleId),
    // beside the tile/pair pads. It edits ONLY *Annotation display fields, so
    // it commutes with the pads (disjoint fields) — see applyKanjiSurfaces.
    return applyKanjiSurfaces(
      padBuildTileFloor(
        padMatchPairsFloor(shaped, getMatchPadContext(shaped.languageId)),
      ),
    );
  }

  const reviewMatch = /^ja-(m\d+)-review-([12])$/.exec(lessonId);
  if (reviewMatch) {
    // Reviews inherit the kanji surface layer via the SAME pass: the review
    // lesson's moduleId is where the learner is, so an m10 review of m8 vocab
    // shows kanji with furigana OFF (past the m8+2 window) while m9 vocab
    // (window m9‑m10) still shows furigana — the owner's "reviews bake in m8 &
    // m9 production systematically".
    return applyKanjiSurfaces(
      padBuildTileFloor(
        padMatchPairsFloor(
          buildSrsReviewLesson({
            moduleId: reviewMatch[1],
            position: parseInt(reviewMatch[2]) as 1 | 2,
            courseId: "mock-1",
            languageId: "ja",
          }),
          getMatchPadContext("ja"),
        ),
      ),
    );
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
