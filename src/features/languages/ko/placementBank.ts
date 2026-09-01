/**
 * Korean placement-test bank — Stage 1 screener + Stage 2 per-module pool.
 *
 * Per ADR-001's `PlacementBank` shape: `screener` is one item per shipped
 * module (used at the start of placement to estimate a learner's floor);
 * `byModule` is the M-keyed pool consulted during stage-2 narrowing.
 *
 * Phase 5 spec: 8 total items (~1 stage-1 + 3 stage-2 per shipped module
 * past M3 — but KO currently ships M1 + M2 (script-only, no testable
 * grammar) + the existing 6 M3 items). We keep the 6 M3 items as the
 * placement spine and add 2 lightweight M1/M2 reading screeners so the
 * pathway has a screener per shipped module, even when M1/M2 are
 * script-recognition rather than grammar.
 *
 * Items reuse the JA `cloze` / `sentenceMcq` factories (ADR-005-conformant
 * shape) but resolve atoms via the KO atom map. M1/M2 items use
 * sentenceMcq + Hangul reading prompts (no particle grammar exists yet
 * to cloze in those modules).
 */
import type { PlacementBank, PlacementItem } from "@/shared/language/types";
import { cloze, sentenceMcq } from "./grammarHelpers";

/**
 * Stage-2 per-module item generator. The factory signature mirrors the
 * JA `PLACEMENT_QUESTION_BANK` entries — each item is a small builder
 * that materializes a `LessonStep` when called.
 */
function makeM1Items(): PlacementItem[] {
  return [
    {
      id: "pt-ko-m1-1",
      moduleId: "m1",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m1-1",
          prompt: "Which block reads 'ga' (the syllable ㄱ + ㅏ)?",
          correctHangul: "가",
          distractorsHangul: ["거", "기", "고"],
        }),
    },
    {
      id: "pt-ko-m1-2",
      moduleId: "m1",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m1-2",
          prompt: "Which word means 'meat'?",
          correctHangul: "고기",
          distractorsHangul: ["아기", "거기", "오이"],
        }),
    },
    {
      id: "pt-ko-m1-3",
      moduleId: "m1",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m1-3",
          prompt: "Which word means 'mother'?",
          correctHangul: "어머니",
          distractorsHangul: ["우리", "다리", "머리"],
        }),
    },
  ];
}

function makeM2Items(): PlacementItem[] {
  return [
    {
      id: "pt-ko-m2-1",
      moduleId: "m2",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m2-1",
          prompt: "Which block uses an aspirated consonant?",
          correctHangul: "커피",
          distractorsHangul: ["고기", "구두", "거기"],
        }),
    },
    {
      id: "pt-ko-m2-2",
      moduleId: "m2",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m2-2",
          prompt: "Which word means 'rabbit'?",
          correctHangul: "토끼",
          distractorsHangul: ["치마", "야구", "오빠"],
        }),
    },
    {
      id: "pt-ko-m2-3",
      moduleId: "m2",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m2-3",
          prompt: "Which uses the y-vowel ㅑ?",
          correctHangul: "야구",
          distractorsHangul: ["아기", "여기", "우유"],
        }),
    },
    // Compound vowels — taught in m2 since 2026-09-01 (cv-1/cv-2/cv-3); a
    // learner placing past m2 must be able to read them. One item per CV
    // lesson. Sound-identical glyph pairs (애/에, 왜/외) are never pitted
    // against each other as sound distractors.
    {
      id: "pt-ko-m2-4",
      moduleId: "m2",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m2-4",
          prompt: "Which word means 'store / shop'? (compound vowel ㅔ)",
          correctHangul: "가게",
          distractorsHangul: ["고기", "거기", "아기"],
        }),
    },
    {
      id: "pt-ko-m2-5",
      moduleId: "m2",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m2-5",
          prompt: "Which block reads 'wi' (as in 'week')?",
          correctHangul: "위",
          distractorsHangul: ["와", "워", "의"],
        }),
    },
    {
      id: "pt-ko-m2-6",
      moduleId: "m2",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m2-6",
          prompt: "Which word means 'company / office'? (compound vowel ㅚ)",
          correctHangul: "회사",
          distractorsHangul: ["의자", "사과", "노래"],
        }),
    },
  ];
}

/**
 * M3 — first-phrases items. Six handlers cover greetings + 이에요/예요 +
 * 저는 + names + introductions + Sino-Korean numbers. These were the
 * starter KO items registered in the legacy JA `PLACEMENT_QUESTION_BANK`
 * file; we keep the same item ids so any saved placement state survives.
 */
function makeM3Items(): PlacementItem[] {
  return [
    {
      id: "pt-ko-m3-1",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m3-1",
          prompt: "'Hello' (polite, all-purpose) — which is correct?",
          correctHangul: "안녕하세요",
          distractorsHangul: ["안녕히 가세요", "잘 자요", "감사합니다"],
        }),
    },
    {
      id: "pt-ko-m3-2",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m3-2",
          prompt: "'I am a student.' (저 = I, 학생 = student) — which is correct?",
          correctHangul: "저는 학생이에요",
          distractorsHangul: ["저는 학생예요", "저가 학생이에요", "저는 학생을 이에요"],
        }),
    },
    {
      id: "pt-ko-m3-3",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m3-3",
          prompt:
            "'I am Min-su.' — which is correct? (이에요 vs 예요 — name ends in a vowel)",
          correctHangul: "저는 민수예요",
          distractorsHangul: ["저는 민수이에요", "저는 민수에요", "저는 민수입니다요"],
        }),
    },
    {
      id: "pt-ko-m3-4",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m3-4",
          prompt: "'What is your name?' — which is the polite question?",
          correctHangul: "이름이 뭐예요?",
          distractorsHangul: [
            "이름이 뭐이에요?",
            "이름은 뭐 입니다?",
            "이름이 누구예요?",
          ],
        }),
    },
    {
      id: "pt-ko-m3-5",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m3-5",
          prompt: "'Nice to meet you.' (first-time greeting) — which is correct?",
          correctHangul: "반갑습니다",
          distractorsHangul: ["미안합니다", "괜찮아요", "안녕히 계세요"],
        }),
    },
    {
      id: "pt-ko-m3-6",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-ko-m3-6",
          prompt: "'Three' (Sino-Korean number) — which is correct?",
          correctHangul: "삼",
          distractorsHangul: ["셋", "이", "사"],
        }),
    },
  ];
}

/**
 * Stage-1 screener — one representative item per shipped module. Used by
 * the placement engine to estimate the learner's floor before stage 2
 * narrows in.
 */
function makeScreener(): PlacementItem[] {
  return [
    {
      id: "pt-ko-screen-m1",
      moduleId: "m1",
      build: () =>
        sentenceMcq({
          id: "pt-ko-screen-m1",
          prompt: "Can you read this? Which means 'mother'?",
          correctHangul: "어머니",
          distractorsHangul: ["나무", "다리", "우리"],
        }),
    },
    {
      id: "pt-ko-screen-m2",
      moduleId: "m2",
      build: () =>
        sentenceMcq({
          id: "pt-ko-screen-m2",
          prompt: "Can you read this? Which means 'coffee'?",
          correctHangul: "커피",
          distractorsHangul: ["우유", "차", "포도"],
        }),
    },
    {
      id: "pt-ko-screen-m3",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-ko-screen-m3",
          prompt: "'Hello' (polite) — which is correct?",
          correctHangul: "안녕하세요",
          distractorsHangul: ["안녕히 가세요", "감사합니다", "괜찮아요"],
        }),
    },
  ];
}

export const KO_PLACEMENT_BANK: PlacementBank = {
  screener: makeScreener(),
  byModule: {
    m1: makeM1Items(),
    m2: makeM2Items(),
    m3: makeM3Items(),
  },
};

// Mark cloze as used to silence the "unused import" lint — kept available
// for M3+ KO grammar items that will land alongside particle teaching.
void cloze;
