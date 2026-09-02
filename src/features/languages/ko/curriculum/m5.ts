/**
 * Korean Module 5 — Numbers, counting & ordering.
 *
 * M3 taught the SINO-Korean number set (일 이 삼…) used for dates, money,
 * and phone numbers. M5 introduces the OTHER set — the NATIVE-Korean numbers
 * (하나 둘 셋…) used for counting things, people, age, and hours — plus the
 * three most common counters (개 / 명 / 잔) and 주세요 ("please give"),
 * so the learner can actually order at a cafe. 빵 ("bread") is taught here
 * too (R4 re-author 2026-09-01): reading came free from m2's batchim drill
 * (bt-2), ko-m5-3 attaches the meaning, ko-m5-5 grades it while ordering.
 *
 * Grammar spine mirrors the JA M5 arc (native numbers + counters + ください),
 * adapted to Korean:
 *
 *   ko-m5-1  Native numbers 1–5 — 하나 둘 셋 넷 다섯
 *   ko-m5-2  Native numbers 6–10 — 여섯 일곱 여덟 아홉 열
 *   ko-m5-3  주세요 — "please give (me)"
 *   ko-m5-4  Counters — 개 (things) / 명 (people) / 잔 (cups)
 *   ko-m5-5  Ordering — 이거 한 개 주세요 (the pre-counter contractions)
 *   ko-m5-6  얼마예요? — asking the price (money reuses Sino numbers)
 *   ko-m5-7  Mini-dialogue — ordering at a cafe
 *   ko-m5-8  M5 Mastery Test
 *
 * KEY Korean fact taught explicitly (NOT a content bug): the native numbers
 * 1–4 contract directly before a counter — 하나→한, 둘→두, 셋→세, 넷→네 —
 * so "one coffee" is 커피 한 잔, never 하나 잔. Lesson ko-m5-5 teaches this
 * contraction before the ordering drill.
 *
 * Authoring follows the JA M3+ rubric (docs/lesson-authoring-guide.md §13).
 * The native-number atoms live in courseAtoms.ts (M5_VOCAB).
 *
 * CONTENT-TODO: native-speaker review of (1) whether 개/명/잔 are the right
 * first three counters and (2) the cafe-ordering register (해요-polite 주세요
 * is correct and standard, but confirm naturalness of the full dialogue).
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  cloze,
  infoStep,
  listeningCompSentence,
  phrase,
  sentenceMcq,
  speaking,
  translateStep,
} from "../grammarHelpers";
import { withReviewInterleave } from "./_reviewInterleave";

const COURSE_ID = "mock-1";

// ─── ko-m5-1 — Native numbers 1–5 ───────────────────────────────────────────

const M5_1: LessonContent = {
  id: "ko-m5-1",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Native numbers 1–5",
  description: "Korea's second number set — for counting things, people, and age.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m5-1-info",
      "Korea's other number set",
      "You learned the Sino numbers (일 이 삼) for money and dates. This is the NATIVE set — 하나 둘 셋 넷 다섯 — used for counting objects, people, age, and the hour. You need both; this lesson starts the native one.",
      "culture",
    ),
    phrase("ko-m5-1-p-1", "one (1, native)", "hana", "하나", undefined, { emoji: "1️⃣" }),
    phrase("ko-m5-1-p-2", "two (2, native)", "dul", "둘", undefined, { emoji: "2️⃣" }),
    phrase("ko-m5-1-p-3", "three (3, native)", "set", "셋", undefined, { emoji: "3️⃣" }),
    phrase("ko-m5-1-p-4", "four (4, native)", "net", "넷", undefined, { emoji: "4️⃣" }),
    phrase("ko-m5-1-p-5", "five (5, native)", "daseot", "다섯", undefined, { emoji: "5️⃣" }),
    sentenceMcq({
      id: "ko-m5-1-q-three",
      prompt: "Which is 'three' (native Korean)?",
      correctHangul: "셋",
      distractorsHangul: ["삼", "넷", "다섯"],
      explanation: "셋 = 3 (native). 삼 is the SINO 3 — used for money/dates, not counting.",
      exercisedAtomSurfaces: ["셋"],
    }),
    listeningCompSentence({
      id: "ko-m5-1-lc-five",
      audioText: "다섯",
      correctMeaningEn: "five (native)",
      distractorsEn: ["four", "three", "two"],
      exercisedAtomSurfaces: ["다섯"],
    }),
    speaking("ko-m5-1-speak-count", "하나 둘 셋", "one two three"),
  ],
};

// ─── ko-m5-2 — Native numbers 6–10 ──────────────────────────────────────────

const M5_2: LessonContent = {
  id: "ko-m5-2",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Native numbers 6–10",
  description: "Finish the native set: 여섯 일곱 여덟 아홉 열.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    phrase("ko-m5-2-p-6", "six (6, native)", "yeoseot", "여섯", undefined, { emoji: "6️⃣" }),
    phrase("ko-m5-2-p-7", "seven (7, native)", "ilgop", "일곱", undefined, { emoji: "7️⃣" }),
    phrase("ko-m5-2-p-8", "eight (8, native)", "yeodeol", "여덟", undefined, { emoji: "8️⃣" }),
    phrase("ko-m5-2-p-9", "nine (9, native)", "ahop", "아홉", undefined, { emoji: "9️⃣" }),
    phrase("ko-m5-2-p-10", "ten (10, native)", "yeol", "열", undefined, { emoji: "🔟" }),
    sentenceMcq({
      id: "ko-m5-2-q-eight",
      prompt: "Which is 'eight' (native Korean)?",
      correctHangul: "여덟",
      distractorsHangul: ["여섯", "일곱", "아홉"],
      explanation: "여덟 = 8 (native).",
      exercisedAtomSurfaces: ["여덟"],
    }),
    sentenceMcq({
      id: "ko-m5-2-q-ten",
      prompt: "Which is 'ten' (native Korean)?",
      correctHangul: "열",
      distractorsHangul: ["십", "여덟", "아홉"],
      explanation: "열 = 10 (native). 십 is the SINO 10.",
      exercisedAtomSurfaces: ["열"],
    }),
    listeningCompSentence({
      id: "ko-m5-2-lc-seven",
      audioText: "일곱",
      correctMeaningEn: "seven (native)",
      distractorsEn: ["six", "eight", "nine"],
      exercisedAtomSurfaces: ["일곱"],
    }),
    speaking("ko-m5-2-speak-count", "여섯 일곱 여덟", "six seven eight"),
  ],
};

// ─── ko-m5-3 — 주세요 ───────────────────────────────────────────────────────

const M5_3: LessonContent = {
  id: "ko-m5-3",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "주세요 — please give me",
  description: "The single most useful ordering word in Korean.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "ko-m5-3-info",
      "주세요 = 'please give (me)'",
      "Put the thing you want + 주세요. 물 주세요 = 'Water, please'. 이거 주세요 = 'This one, please'. It's polite and works in any shop, cafe, or restaurant. Mark the thing with the object particle 을/를, or drop it in casual speech.",
      "grammar",
    ),
    phrase("ko-m5-3-p-give", "please give (me)", "juseyo", "주세요"),
    phrase("ko-m5-3-p-water", "water", "mul", "물", undefined, { emoji: "💧" }),
    // R4 re-author (2026-09-01): 빵 semantic intro. The learner can already
    // READ it — m2's bt-2 drilled 빵 as a batchim word — this card attaches
    // the meaning and opens its SRS entry; graded ordering use lands in
    // ko-m5-5 (interleave: a counters lesson sits between).
    phrase("ko-m5-3-p-bread", "bread", "ppang", "빵", undefined, { emoji: "🍞" }),
    sentenceMcq({
      id: "ko-m5-3-q-water",
      prompt: "How do you say 'Water, please'?",
      correctHangul: "물 주세요",
      distractorsHangul: ["물 있어요", "물이에요", "물 얼마예요"],
      explanation: "물 (water) + 주세요 (please give) = 'Water, please'.",
      exercisedAtomSurfaces: ["물", "주세요"],
    }),
    cloze(
      "ko-m5-3-cloze-obj",
      "물",
      "주세요",
      "을",
      ["을", "를", "이", "에"],
      "Water, please. (with object particle)",
      "물을 주세요",
      "물 ends in a consonant → object particle 을. (을 is often dropped in casual speech.)",
    ),
    listeningCompSentence({
      id: "ko-m5-3-lc-this",
      audioText: "이거 주세요",
      correctMeaningEn: "This one, please",
      distractorsEn: ["What is this?", "How much is it?", "It's mine"],
      exercisedAtomSurfaces: ["주세요"],
    }),
    speaking("ko-m5-3-speak-water", "물 주세요", "Water, please"),
  ],
};

// ─── ko-m5-4 — Counters ─────────────────────────────────────────────────────

const M5_4: LessonContent = {
  id: "ko-m5-4",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Counters — 개 / 명 / 잔",
  description: "Korean counts with classifier words, like 'two cups of coffee'.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m5-4-info-1",
      "You can't just say 'two coffees'",
      "Korean (like Japanese) needs a COUNTER word after the number. The big three to start: 개 for general things, 명 for people, 잔 for cups/glasses. Pattern: NOUN + NUMBER + COUNTER. 커피 두 잔 = 'two cups of coffee'.",
      "grammar",
    ),
    infoStep(
      "ko-m5-4-info-2",
      "Counters use the NATIVE numbers",
      "Counting with 개/명/잔 uses the native set you just learned (하나 둘 셋…), NOT the Sino set. So '두 잔' (two cups), not '이 잔'. (Money and minutes use Sino — but counting objects is native.)",
      "tip",
    ),
    phrase("ko-m5-4-p-gae", "counter: things", "gae", "개"),
    phrase("ko-m5-4-p-myeong", "counter: people", "myeong", "명"),
    phrase("ko-m5-4-p-jan", "counter: cups/glasses", "jan", "잔"),
    sentenceMcq({
      id: "ko-m5-4-q-people",
      prompt: "Which counter do you use for PEOPLE?",
      // 2026-09-01 audit: 원 (won) was a distractor here 2 lessons before its
      // m5-6 intro — swapped for the taught 열 (native ten).
      correctHangul: "명",
      distractorsHangul: ["개", "잔", "열"],
      explanation: "명 counts people. 개 = things, 잔 = cups.",
      exercisedAtomSurfaces: ["명"],
    }),
    sentenceMcq({
      id: "ko-m5-4-q-cups",
      prompt: "Which counter do you use for cups of coffee?",
      correctHangul: "잔",
      distractorsHangul: ["개", "명", "열"],
      explanation: "잔 counts cups/glasses (커피 한 잔 = one coffee).",
      exercisedAtomSurfaces: ["잔"],
    }),
    listeningCompSentence({
      id: "ko-m5-4-lc-things",
      audioText: "개",
      correctMeaningEn: "counter for general things",
      distractorsEn: ["counter for people", "counter for cups", "counter for money"],
      exercisedAtomSurfaces: ["개"],
    }),
    speaking("ko-m5-4-speak-counters", "개 명 잔", "things, people, cups"),
  ],
};

// ─── ko-m5-5 — Ordering with contractions ───────────────────────────────────

const M5_5: LessonContent = {
  id: "ko-m5-5",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "이거 한 개 주세요 — ordering",
  description: "Numbers 1–4 shrink before a counter. Learn the contractions and order.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m5-5-info",
      "1–4 shrink before a counter",
      "Right before a counter, the native numbers 1–4 contract:\n하나 → 한,  둘 → 두,  셋 → 세,  넷 → 네.\nSo 'one item' is 한 개 (not 하나 개), 'two cups' is 두 잔. (5 and up don't change: 다섯 개.) Now you can order: 이거 한 개 주세요 = 'One of these, please'.",
      "grammar",
    ),
    phrase("ko-m5-5-p-han", "one (before a counter)", "han", "한"),
    phrase("ko-m5-5-p-du", "two (before a counter)", "du", "두"),
    phrase("ko-m5-5-p-se", "three (before a counter)", "se", "세"),
    // 2026-09-01 audit: 커피 had only an m2 reading-word exposure — semantic
    // re-intro here before the first 커피 build/order drills.
    phrase("ko-m5-5-p-coffee", "coffee", "keopi", "커피", undefined, { emoji: "☕" }),
    sentenceMcq({
      id: "ko-m5-5-q-onecounter",
      prompt: "'One of these, please.' — which is correct?",
      correctHangul: "이거 한 개 주세요",
      distractorsHangul: ["이거 하나 개 주세요", "이거 일 개 주세요", "이거 한 잔 주세요"],
      explanation: "Before a counter, 하나 → 한. 이거 한 개 주세요 = 'one of these, please'.",
      exercisedAtomSurfaces: ["이거", "개", "주세요"],
    }),
    build(
      "ko-m5-5-build-twocoffees",
      "Build: 'Two coffees, please.' (coffee + two + cups + please give)",
      "커피 두 잔 주세요",
      ["커피", "두", "잔", "주세요", "둘", "개"],
      ["커피", "두", "잔", "주세요"],
      ["커피", "잔", "주세요"],
    ),
    // 빵 was introduced in ko-m5-3 — first graded use, and it pulls its
    // counter (개, things) against 잔 right after the 커피/잔 build above.
    sentenceMcq({
      id: "ko-m5-5-q-bread",
      prompt: "'One piece of bread, please.' — which is correct?",
      correctHangul: "빵 한 개 주세요",
      distractorsHangul: ["빵 하나 개 주세요", "빵 한 잔 주세요", "빵 일 개 주세요"],
      explanation: "Bread is a thing → 개 (not 잔), and 하나 → 한 before a counter.",
      exercisedAtomSurfaces: ["빵", "개", "주세요"],
    }),
    cloze(
      "ko-m5-5-cloze-counter",
      "물 한",
      "주세요",
      "잔",
      ["잔", "개", "명", "열"],
      "One glass of water, please.",
      "물 한 잔 주세요",
      "Water comes in a glass → 잔. (한 = 'one' before a counter.)",
    ),
    speaking("ko-m5-5-speak-order", "커피 두 잔 주세요", "Two coffees, please"),
  ],
};

// ─── ko-m5-6 — 얼마예요? (price) ────────────────────────────────────────────

const M5_6: LessonContent = {
  id: "ko-m5-6",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "얼마예요? — how much?",
  description: "Ask the price. Money uses the Sino numbers you already know.",
  estimatedMinutes: 5,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m5-6-info",
      "얼마예요? = How much is it?",
      "얼마 = 'how much'. 얼마예요? = 'How much is it?'. Prices are answered with SINO numbers + 원 (won): 삼천 원 = '3,000 won'. (You won't compute big numbers yet — just recognize the question and 원.)",
      "grammar",
    ),
    // 2026-09-01 gate catch: the 얼마예요? chunk card resolves to the survival
    // phrase atom, so the word 얼마 itself was graded with no intro — real
    // word card first, then the chunk.
    phrase("ko-m5-6-p-eolma", "how much", "eolma", "얼마"),
    phrase("ko-m5-6-p-howmuch", "How much is it?", "eolmayeyo", "얼마예요?"),
    phrase("ko-m5-6-p-won", "won (₩)", "won", "원"),
    sentenceMcq({
      id: "ko-m5-6-q-ask",
      prompt: "How do you ask the price of something?",
      correctHangul: "얼마예요?",
      distractorsHangul: ["뭐예요?", "어디예요?", "누구예요?"],
      explanation: "얼마 = 'how much' → 얼마예요? = 'How much is it?'",
      exercisedAtomSurfaces: ["얼마"],
    }),
    listeningCompSentence({
      id: "ko-m5-6-lc-price",
      audioText: "얼마예요?",
      correctMeaningEn: "How much is it?",
      distractorsEn: ["What is it?", "Where is it?", "Whose is it?"],
      exercisedAtomSurfaces: ["얼마"],
    }),
    translateStep({
      id: "ko-m5-6-tr-howmuch",
      promptEn: "How much is this? (this thing + how much)",
      acceptedAnswers: ["이거 얼마예요?", "이게 얼마예요?", "이거 얼마예요"],
      audioText: "이거 얼마예요?",
      exercisedAtomSurfaces: ["이거", "얼마"],
    }),
    speaking("ko-m5-6-speak-howmuch", "얼마예요?", "How much is it?"),
  ],
};

// ─── ko-m5-7 — Mini-dialogue ────────────────────────────────────────────────

const M5_7: LessonContent = {
  id: "ko-m5-7",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — at a cafe",
  description: "Order, ask the price, and count — all together.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m5-7-info",
      "Ordering, start to finish",
      "You: 커피 두 잔 주세요. (Two coffees, please.)\nStaff: 네. (Sure.)\nYou: 이거 얼마예요? (How much is this?)\nStaff: 사천 원이에요. (It's 4,000 won.)\nYou can run this whole exchange now.",
      "default",
    ),
    build(
      "ko-m5-7-build-order",
      "Build: 'Three coffees, please.'",
      "커피 세 잔 주세요",
      ["커피", "세", "잔", "주세요", "셋", "개"],
      ["커피", "세", "잔", "주세요"],
      ["커피", "잔", "주세요"],
    ),
    sentenceMcq({
      id: "ko-m5-7-q-water",
      prompt: "'One glass of water, please.' —",
      correctHangul: "물 한 잔 주세요",
      distractorsHangul: ["물 하나 잔 주세요", "물 한 개 주세요", "물 일 잔 주세요"],
      explanation: "Water → 잔 (a glass); 하나 → 한 before a counter.",
      exercisedAtomSurfaces: ["물", "잔", "주세요"],
    }),
    translateStep({
      id: "ko-m5-7-tr-howmuch",
      promptEn: "How much is it?",
      acceptedAnswers: ["얼마예요?", "얼마예요"],
      audioText: "얼마예요?",
      exercisedAtomSurfaces: ["얼마"],
    }),
    listeningCompSentence({
      id: "ko-m5-7-lc-order",
      audioText: "커피 두 잔 주세요",
      correctMeaningEn: "Two coffees, please",
      distractorsEn: ["One coffee, please", "How much is the coffee?", "Three coffees, please"],
      exercisedAtomSurfaces: ["잔", "주세요"],
    }),
    speaking("ko-m5-7-speak-order", "커피 두 잔 주세요", "Two coffees, please"),
  ],
};

// ─── ko-m5-8 — Mastery test ─────────────────────────────────────────────────

const M5_8: LessonContent = {
  id: "ko-m5-8",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M5 Mastery Test",
  description: "Prove you've got native numbers, counters, and ordering.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "ko-m5-8-q-three",
      prompt: "Which is 'three' (native, for counting)?",
      correctHangul: "셋",
      distractorsHangul: ["삼", "셋째", "다섯"],
      exercisedAtomSurfaces: ["셋"],
    }),
    sentenceMcq({
      id: "ko-m5-8-q-counter-people",
      prompt: "Which counter is for PEOPLE?",
      correctHangul: "명",
      distractorsHangul: ["개", "잔", "원"],
      exercisedAtomSurfaces: ["명"],
    }),
    sentenceMcq({
      id: "ko-m5-8-q-order",
      prompt: "'Two coffees, please.' —",
      correctHangul: "커피 두 잔 주세요",
      distractorsHangul: ["커피 둘 잔 주세요", "커피 이 잔 주세요", "커피 두 개 주세요"],
      exercisedAtomSurfaces: ["잔", "주세요"],
    }),
    sentenceMcq({
      id: "ko-m5-8-q-price",
      prompt: "'How much is it?' —",
      correctHangul: "얼마예요?",
      distractorsHangul: ["뭐예요?", "어디예요?", "몇 개예요?"],
      exercisedAtomSurfaces: ["얼마"],
    }),
    cloze(
      "ko-m5-8-cloze-counter",
      "물 한",
      "주세요",
      "잔",
      ["잔", "개", "명", "원"],
      "One glass of water, please.",
      "물 한 잔 주세요",
      "Water → 잔 (a glass).",
    ),
    listeningCompSentence({
      id: "ko-m5-8-lc-give",
      audioText: "이거 주세요",
      correctMeaningEn: "This one, please",
      distractorsEn: ["How much is it?", "What is this?", "Two of these"],
      exercisedAtomSurfaces: ["주세요"],
    }),
    speaking("ko-m5-8-speak-recap", "커피 한 잔 주세요", "One coffee, please"),
  ],
};

export const KO_M5_LESSONS: LessonContent[] = withReviewInterleave("m5", [
  M5_1,
  M5_2,
  M5_3,
  M5_4,
  M5_5,
  M5_6,
  M5_7,
  M5_8,
]);
