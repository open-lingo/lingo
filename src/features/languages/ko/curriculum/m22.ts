/**
 * Korean Module 22 — Comparison.
 *
 * KO analog of JA M22 (〜のほうが〜より comparatives + 〜のなかで〜がいちばん
 * superlatives + どちら which-of-two). Re-expressed in Korean's own grammar:
 *
 *   ko-m22-1  보다 — "than" (A가 B보다 …): basic comparison
 *   ko-m22-2  더 / 덜 — more / less (보다 더 …)
 *   ko-m22-3  제일 / 가장 — most / -est (the superlative)
 *   ko-m22-4  중에서 — among / out of (group) + 제일
 *   ko-m22-5  어느 / 뭐가 더 — "which is more …?" (choosing between two)
 *   ko-m22-6  Putting it together — comparing places & food
 *   ko-m22-7  Mini-dialogue — which is better?
 *   ko-m22-8  M22 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - 보다 = 'than', attached to the STANDARD (the thing compared against),
 *     so the order is reversed from English: 커피가 차보다 비싸요 = 'Coffee is
 *     more expensive than tea' (lit. 'coffee, than tea, is expensive'). 보다
 *     attaches with no space: 차보다.
 *   - 더 ('more') optionally reinforces 보다: 커피가 차보다 더 비싸요. 덜
 *     ('less') is the opposite: 차가 커피보다 덜 비싸요 = 'Tea is less
 *     expensive than coffee.'
 *   - The superlative is the adverb 제일 or 가장 ('most') before the
 *     adjective: 이게 제일 비싸요 = 'This is the most expensive.' 제일 (Sino
 *     第一) is the everyday one; 가장 is slightly more formal — both fine.
 *   - 중에서 = 'among / out of': 셋 중에서 라면이 제일 맛있어요 = 'Among the
 *     three, ramyeon is the tastiest.' This is the KO match to JA's なかで.
 *   - To ask 'which is more …?' use 어느 게 더 …? or 뭐가 더 …?.
 *
 * Builds on: 비싸요/싸요 (expensive/cheap, M-earlier shopping), 맛있어요
 * (delicious), 라면/커피/차. 비싸다/싸다 treated as known adjectives.
 * NATIVE-REVIEW flags inline.
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

const COURSE_ID = "mock-1";

// ─── ko-m22-1 — 보다 (than) ─────────────────────────────────────────────────

const M22_1: LessonContent = {
  id: "ko-m22-1",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "보다 — than",
  description: "Compare two things: A가 B보다 비싸요.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m22-1-info",
      "보다 marks the thing you compare against",
      "보다 = 'than'. It attaches (no space) to the STANDARD — the thing being compared against — so the order looks flipped to English eyes: 커피가 차보다 비싸요 = 'Coffee is more expensive than tea' (literally 'coffee, than tea, is-expensive'). Pattern: [A]가/이 [B]보다 [adjective].",
      "grammar",
    ),
    phrase("ko-m22-1-p-boda", "than", "boda", "보다"),
    sentenceMcq({
      id: "ko-m22-1-q-coffeetea",
      prompt: "'Coffee is more expensive than tea.' —",
      correctHangul: "커피가 차보다 비싸요",
      distractorsHangul: ["커피가 차에서 비싸요", "커피를 차보다 비싸요", "차가 커피보다 비싸요"],
      explanation: "보다 attaches to the standard (차보다 'than tea'). The last option reverses the meaning.",
      exercisedAtomSurfaces: ["커피", "차", "보다"],
    }),
    cloze(
      "ko-m22-1-cloze-bigger",
      "집이 학교",
      "커요",
      "보다",
      ["보다", "에서", "하고", "을"],
      "The house is bigger than the school.",
      "집이 학교보다 커요",
      "보다 = 'than', attached to 학교.",
    ),
    sentenceMcq({
      id: "ko-m22-1-q-cheaper",
      prompt: "'Tea is cheaper than coffee.' —",
      correctHangul: "차가 커피보다 싸요",
      distractorsHangul: ["차가 커피보다 비싸요", "차를 커피보다 싸요", "커피가 차보다 싸요"],
      explanation: "차가 커피보다 싸요 = 'tea, than coffee, is cheap.'",
      exercisedAtomSurfaces: ["차", "커피", "보다"],
    }),
    listeningCompSentence({
      id: "ko-m22-1-lc-coffeetea",
      audioText: "커피가 차보다 비싸요",
      correctMeaningEn: "Coffee is more expensive than tea",
      distractorsEn: ["Tea is more expensive than coffee", "Coffee and tea are expensive", "Coffee is cheap"],
      exercisedAtomSurfaces: ["커피", "차"],
    }),
    speaking("ko-m22-1-speak-coffeetea", "커피가 차보다 비싸요", "Coffee is more expensive than tea", ["커피", "차", "보다"]),
  ],
};

// ─── ko-m22-2 — 더 / 덜 (more / less) ───────────────────────────────────────

const M22_2: LessonContent = {
  id: "ko-m22-2",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "더 / 덜 — more / less",
  description: "Strengthen a comparison with 더, or flip it with 덜.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m22-2-info",
      "더 ('more') and 덜 ('less')",
      "더 = 'more', placed right before the adjective to reinforce 보다: 커피가 차보다 더 비싸요 = 'Coffee is even more expensive than tea.' 덜 = 'less': 차가 커피보다 덜 비싸요 = 'Tea is less expensive than coffee.' 더 can also stand alone: 더 주세요 = 'more, please.'",
      "grammar",
    ),
    phrase("ko-m22-2-p-deo", "more", "deo", "더"),
    phrase("ko-m22-2-p-deol", "less", "deol", "덜"),
    sentenceMcq({
      id: "ko-m22-2-q-moreexpensive",
      prompt: "'Coffee is even more expensive than tea.' —",
      correctHangul: "커피가 차보다 더 비싸요",
      distractorsHangul: ["커피가 차보다 덜 비싸요", "커피가 차보다 더 싸요", "커피가 더 차보다 비싸요"],
      explanation: "더 ('more') sits right before the adjective: 더 비싸요.",
      exercisedAtomSurfaces: ["커피", "차", "보다"],
    }),
    cloze(
      "ko-m22-2-cloze-lessexpensive",
      "차가 커피보다",
      "비싸요",
      "덜",
      ["덜", "더", "안", "잘"],
      "Tea is less expensive than coffee.",
      "차가 커피보다 덜 비싸요",
      "덜 = 'less', before the adjective.",
    ),
    sentenceMcq({
      id: "ko-m22-2-q-moreplease",
      prompt: "'More, please.' —",
      correctHangul: "더 주세요",
      distractorsHangul: ["덜 주세요", "더 가요", "더를 주세요"],
      explanation: "더 ('more') can stand alone: 더 주세요.",
      exercisedAtomSurfaces: ["더"],
    }),
    listeningCompSentence({
      id: "ko-m22-2-lc-moreexpensive",
      audioText: "커피가 차보다 더 비싸요",
      correctMeaningEn: "Coffee is even more expensive than tea",
      distractorsEn: ["Coffee is less expensive than tea", "Tea is more expensive than coffee", "Coffee is cheaper"],
      exercisedAtomSurfaces: ["커피", "차"],
    }),
    speaking("ko-m22-2-speak-moreexpensive", "커피가 차보다 더 비싸요", "Coffee is even more expensive than tea", ["커피", "차", "보다"]),
  ],
};

// ─── ko-m22-3 — 제일 / 가장 (most) ──────────────────────────────────────────

const M22_3: LessonContent = {
  id: "ko-m22-3",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "제일 / 가장 — the most",
  description: "Say something is the biggest, best, tastiest.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m22-3-info",
      "제일 / 가장 ('most')",
      "For the superlative ('the -est / the most'), put 제일 or 가장 ('most') before the adjective: 이게 제일 비싸요 = 'This is the most expensive.' 라면이 제일 맛있어요 = 'Ramyeon is the tastiest.' 제일 is the everyday word; 가장 is slightly more formal — both are correct.",
      "grammar",
    ),
    phrase("ko-m22-3-p-jeil", "most / -est", "jeil", "제일"),
    phrase("ko-m22-3-p-gajang", "most (formal)", "gajang", "가장"),
    sentenceMcq({
      id: "ko-m22-3-q-mostexpensive",
      prompt: "'This is the most expensive.' —",
      correctHangul: "이게 제일 비싸요",
      distractorsHangul: ["이게 더 비싸요", "이게 제일 비싸보다", "이게 제일을 비싸요"],
      // NATIVE-REVIEW: 이게 (contraction of 이것이 'this') used as subject — a
      // very common spoken form. Confirm 이게 제일 비싸요 reads natural at this
      // level (vs the fuller 이것이).
      explanation: "제일 ('most') before the adjective: 제일 비싸요.",
      exercisedAtomSurfaces: ["제일"],
    }),
    cloze(
      "ko-m22-3-cloze-tastiest",
      "라면이",
      "맛있어요",
      "제일",
      ["제일", "보다", "더", "덜"],
      "Ramyeon is the tastiest.",
      "라면이 제일 맛있어요",
      "제일 = 'most', before the adjective.",
    ),
    sentenceMcq({
      id: "ko-m22-3-q-best",
      prompt: "'Bibimbap is the best.' —",
      correctHangul: "비빔밥이 제일 좋아요",
      distractorsHangul: ["비빔밥이 더 좋아요", "비빔밥을 제일 좋아요", "비빔밥이 제일 좋아보다"],
      explanation: "제일 좋아요 = 'is the best / I like it most.'",
      exercisedAtomSurfaces: ["비빔밥", "제일"],
    }),
    listeningCompSentence({
      id: "ko-m22-3-lc-tastiest",
      audioText: "라면이 제일 맛있어요",
      correctMeaningEn: "Ramyeon is the tastiest",
      distractorsEn: ["Ramyeon is tastier than rice", "Ramyeon is not tasty", "Ramyeon is cheap"],
      exercisedAtomSurfaces: ["라면", "제일"],
    }),
    speaking("ko-m22-3-speak-tastiest", "라면이 제일 맛있어요", "Ramyeon is the tastiest", ["라면", "제일"]),
  ],
};

// ─── ko-m22-4 — 중에서 (among) ──────────────────────────────────────────────

const M22_4: LessonContent = {
  id: "ko-m22-4",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "중에서 — among / out of",
  description: "Pick the best out of a group.",
  estimatedMinutes: 7,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m22-4-info",
      "중에서 … 제일 (among …, the most)",
      "중에서 = 'among / out of (a group)'. Pair it with 제일 for 'the most among': 셋 중에서 라면이 제일 맛있어요 = 'Among the three, ramyeon is the tastiest.' 과일 중에서 사과가 제일 좋아요 = 'Of the fruits, apples are the best.' Pattern: [group] 중에서 [item]이/가 제일 [adjective].",
      "grammar",
    ),
    phrase("ko-m22-4-p-jungeseo", "among / out of", "jungeseo", "중에서"),
    sentenceMcq({
      id: "ko-m22-4-q-amongthree",
      prompt: "'Among the three, ramyeon is the tastiest.' —",
      correctHangul: "셋 중에서 라면이 제일 맛있어요",
      distractorsHangul: ["셋 보다 라면이 제일 맛있어요", "셋 중에서 라면이 더 맛있어요보다", "셋 중에서 라면을 제일 맛있어요"],
      explanation: "중에서 marks the group; 제일 picks the top.",
      exercisedAtomSurfaces: ["중에서", "라면", "제일"],
    }),
    cloze(
      "ko-m22-4-cloze-amongfruit",
      "과일",
      "사과가 제일 좋아요",
      "중에서",
      ["중에서", "보다", "하고", "에서"],
      "Of the fruits, apples are the best.",
      "과일 중에서 사과가 제일 좋아요",
      "중에서 = 'among', after the group noun.",
    ),
    translateStep({
      id: "ko-m22-4-tr-amongfamily",
      promptEn: "Among my family, my dad is the tallest.",
      acceptedAnswers: ["우리 가족 중에서 아빠가 제일 커요", "우리 가족 중에서 아빠가 제일 커요."],
      audioText: "우리 가족 중에서 아빠가 제일 커요",
      // NATIVE-REVIEW: uses 크다 → 커요 for 'tall' (커요 covers both 'big' and
      // 'tall' of people in Korean). 우리 가족 중에서 아빠가 제일 커요 is
      // natural. Confirm 커요 = 'is tall' reads right here.
      exercisedAtomSurfaces: ["우리", "가족", "중에서", "제일"],
    }),
    listeningCompSentence({
      id: "ko-m22-4-lc-amongthree",
      audioText: "셋 중에서 라면이 제일 맛있어요",
      correctMeaningEn: "Among the three, ramyeon is the tastiest",
      distractorsEn: ["Ramyeon is tastier than three things", "Among the three, ramyeon is cheapest", "Three ramyeon are tasty"],
      exercisedAtomSurfaces: ["중에서", "라면"],
    }),
    speaking("ko-m22-4-speak-amongthree", "셋 중에서 라면이 제일 맛있어요", "Among the three, ramyeon is the tastiest", ["중에서", "라면", "제일"]),
  ],
};

// ─── ko-m22-5 — Which is more …? ────────────────────────────────────────────

const M22_5: LessonContent = {
  id: "ko-m22-5",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Which is more …?",
  description: "Ask someone to choose between two.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m22-5-info",
      "어느 게 더 …? / 뭐가 더 …?",
      "To ask 'which is more …?', use 어느 게 ('which one') or 뭐가 ('what') + 더 + adjective: 어느 게 더 비싸요? = 'Which is more expensive?' 커피하고 차 중에서 뭐가 더 좋아요? = 'Between coffee and tea, which do you like more?' Answer with 보다 or 제일.",
      "grammar",
    ),
    phrase("ko-m22-5-p-eoneuge", "which one", "eoneu ge", "어느 게"),
    sentenceMcq({
      id: "ko-m22-5-q-whichmore",
      prompt: "'Which is more expensive?' —",
      correctHangul: "어느 게 더 비싸요?",
      distractorsHangul: ["어느 게 제일 비싸요?", "어느 게 더 비싸보다?", "뭐가 더 비싸요보다?"],
      // NATIVE-REVIEW: 어느 게 더 비싸요? for a two-way choice; 제일 would imply
      // 3+. Confirm 어느 게 더 …? is the natural two-item question.
      explanation: "어느 게 더 …? asks 'which (of two) is more …?'",
      exercisedAtomSurfaces: ["더"],
    }),
    cloze(
      "ko-m22-5-cloze-betweencoffee",
      "커피하고 차 중에서 뭐가 더",
      "?",
      "좋아요",
      ["좋아요", "좋아요보다", "좋아제일", "좋아중에서"],
      "Between coffee and tea, which do you like more?",
      "커피하고 차 중에서 뭐가 더 좋아요?",
      "뭐가 더 좋아요? = 'which do you like more?'",
    ),
    sentenceMcq({
      id: "ko-m22-5-q-answer",
      prompt: "Answer: 'I like coffee more.' —",
      correctHangul: "커피가 더 좋아요",
      distractorsHangul: ["커피를 더 좋아요", "커피가 제일 좋아요", "커피가 더 좋아보다"],
      explanation: "커피가 더 좋아요 = 'coffee is more to my liking.'",
      exercisedAtomSurfaces: ["커피", "더"],
    }),
    listeningCompSentence({
      id: "ko-m22-5-lc-whichmore",
      audioText: "어느 게 더 비싸요?",
      correctMeaningEn: "Which is more expensive?",
      distractorsEn: ["Which is the cheapest?", "Is this expensive?", "Which do you like?"],
      exercisedAtomSurfaces: ["더"],
    }),
    speaking("ko-m22-5-speak-whichmore", "어느 게 더 비싸요?", "Which is more expensive?", ["더"]),
  ],
};

// ─── ko-m22-6 — Putting it together ─────────────────────────────────────────

const M22_6: LessonContent = {
  id: "ko-m22-6",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Comparing food & places",
  description: "Combine 보다, 더, 제일, and 중에서.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m22-6-info",
      "Stacking comparisons",
      "서울이 부산보다 더 커요 = 'Seoul is bigger than Busan.' 한국 음식 중에서 비빔밥이 제일 좋아요 = 'Of Korean food, bibimbap is the best.' Combine the 보다 comparison, 더/덜, the 제일 superlative, and 중에서.",
      "default",
    ),
    build(
      "ko-m22-6-build-seoulbusan",
      "Build: 'Seoul is bigger than Busan.' (Seoul-subject + Busan-than + more + is-big)",
      "서울이 부산보다 더 커요",
      ["서울이", "부산보다", "더", "커요", "제일"],
      ["서울이", "부산보다", "더", "커요"],
      ["보다", "더"],
    ),
    sentenceMcq({
      id: "ko-m22-6-q-bestfood",
      prompt: "'Of Korean food, bibimbap is the best.' —",
      correctHangul: "한국 음식 중에서 비빔밥이 제일 좋아요",
      distractorsHangul: ["한국 음식 보다 비빔밥이 제일 좋아요", "한국 음식 중에서 비빔밥을 제일 좋아요", "한국 음식 중에서 비빔밥이 더 좋아요보다"],
      // NATIVE-REVIEW: 음식 ('food') used in 한국 음식 ('Korean food'); confirm
      // 음식 is acceptable here as recognition vocab (introduced in earlier
      // food contexts / side-quest). 중에서 + 제일 frame is standard.
      explanation: "중에서 marks the group; 제일 좋아요 = 'is the best'.",
      exercisedAtomSurfaces: ["중에서", "비빔밥", "제일"],
    }),
    translateStep({
      id: "ko-m22-6-tr-cheaperthan",
      promptEn: "Tea is cheaper than coffee.",
      acceptedAnswers: ["차가 커피보다 싸요", "차가 커피보다 싸요.", "차가 커피보다 더 싸요"],
      audioText: "차가 커피보다 싸요",
      exercisedAtomSurfaces: ["차", "커피", "보다"],
    }),
    listeningCompSentence({
      id: "ko-m22-6-lc-seoulbusan",
      audioText: "서울이 부산보다 더 커요",
      correctMeaningEn: "Seoul is bigger than Busan",
      distractorsEn: ["Busan is bigger than Seoul", "Seoul is the biggest", "Seoul and Busan are big"],
      exercisedAtomSurfaces: ["보다", "더"],
    }),
    speaking("ko-m22-6-speak-seoulbusan", "서울이 부산보다 더 커요", "Seoul is bigger than Busan", ["보다", "더"]),
  ],
};

// ─── ko-m22-7 — Mini-dialogue ───────────────────────────────────────────────

const M22_7: LessonContent = {
  id: "ko-m22-7",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — which is better?",
  description: "Help a friend choose between two options.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m22-7-info",
      "Choosing together",
      "친구: 커피하고 차 중에서 뭐가 더 좋아요? (Between coffee and tea, which is better?)\nYou: 저는 커피가 더 좋아요. (I like coffee more.)\n친구: 여기는 차가 커피보다 싸요. (Here, tea is cheaper than coffee.)\nYou: 그래도 커피가 제일 맛있어요. (Still, coffee is the tastiest.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m22-7-q-whichbetter",
      prompt: "'Between coffee and tea, which is better?' —",
      correctHangul: "커피하고 차 중에서 뭐가 더 좋아요?",
      distractorsHangul: ["커피하고 차 보다 뭐가 더 좋아요?", "커피하고 차 중에서 뭐가 제일 좋아요보다?", "커피를 차 중에서 뭐가 더 좋아요?"],
      explanation: "중에서 marks the two options; 뭐가 더 좋아요? = 'which is better?'",
      exercisedAtomSurfaces: ["커피", "차", "중에서"],
    }),
    build(
      "ko-m22-7-build-likecoffeemore",
      "Build: 'I like coffee more.' (I-topic + coffee-subject + more + good)",
      "저는 커피가 더 좋아요",
      ["저는", "커피가", "더", "좋아요", "제일"],
      ["저는", "커피가", "더", "좋아요"],
      ["커피", "더"],
    ),
    sentenceMcq({
      id: "ko-m22-7-q-tastiest",
      prompt: "'Coffee is the tastiest.' —",
      correctHangul: "커피가 제일 맛있어요",
      distractorsHangul: ["커피가 더 맛있어요", "커피를 제일 맛있어요", "커피가 제일 맛있어요보다"],
      explanation: "제일 맛있어요 = 'is the tastiest.'",
      exercisedAtomSurfaces: ["커피", "제일"],
    }),
    listeningCompSentence({
      id: "ko-m22-7-lc-likecoffeemore",
      audioText: "저는 커피가 더 좋아요",
      correctMeaningEn: "I like coffee more",
      distractorsEn: ["I like tea more", "Coffee is the best", "I don't like coffee"],
      exercisedAtomSurfaces: ["커피", "더"],
    }),
    speaking("ko-m22-7-speak-likecoffeemore", "저는 커피가 더 좋아요", "I like coffee more", ["커피", "더"]),
  ],
};

// ─── ko-m22-8 — Mastery test ────────────────────────────────────────────────

const M22_8: LessonContent = {
  id: "ko-m22-8",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M22 Mastery Test",
  description: "보다, 더/덜, 제일/가장, and 중에서.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "ko-m22-8-q-coffeetea",
      prompt: "'Coffee is more expensive than tea.' —",
      correctHangul: "커피가 차보다 비싸요",
      distractorsHangul: ["커피가 차에서 비싸요", "커피를 차보다 비싸요", "차가 커피보다 비싸요"],
      exercisedAtomSurfaces: ["커피", "차", "보다"],
    }),
    sentenceMcq({
      id: "ko-m22-8-q-moreexpensive",
      prompt: "'Coffee is even more expensive than tea.' —",
      correctHangul: "커피가 차보다 더 비싸요",
      distractorsHangul: ["커피가 차보다 덜 비싸요", "커피가 차보다 더 싸요", "커피가 더 차보다 비싸요"],
      exercisedAtomSurfaces: ["커피", "차"],
    }),
    sentenceMcq({
      id: "ko-m22-8-q-tastiest",
      prompt: "'Ramyeon is the tastiest.' —",
      correctHangul: "라면이 제일 맛있어요",
      distractorsHangul: ["라면이 더 맛있어요", "라면을 제일 맛있어요", "라면이 제일 맛있어요보다"],
      exercisedAtomSurfaces: ["라면", "제일"],
    }),
    cloze(
      "ko-m22-8-cloze-amongfruit",
      "과일",
      "사과가 제일 좋아요",
      "중에서",
      ["중에서", "보다", "하고", "에서"],
      "Of the fruits, apples are the best.",
      "과일 중에서 사과가 제일 좋아요",
      "중에서 = 'among'.",
    ),
    sentenceMcq({
      id: "ko-m22-8-q-whichmore",
      prompt: "'Which is more expensive?' —",
      correctHangul: "어느 게 더 비싸요?",
      distractorsHangul: ["어느 게 제일 비싸요?", "어느 게 더 비싸보다?", "뭐가 더 비싸요보다?"],
      exercisedAtomSurfaces: ["더"],
    }),
    listeningCompSentence({
      id: "ko-m22-8-lc-cheaper",
      audioText: "차가 커피보다 싸요",
      correctMeaningEn: "Tea is cheaper than coffee",
      distractorsEn: ["Coffee is cheaper than tea", "Tea is the cheapest", "Tea is expensive"],
      exercisedAtomSurfaces: ["차", "커피"],
    }),
    speaking("ko-m22-8-speak-recap", "라면이 제일 맛있어요", "Ramyeon is the tastiest", ["라면", "제일"]),
  ],
};

export const KO_M22_LESSONS: LessonContent[] = [
  M22_1,
  M22_2,
  M22_3,
  M22_4,
  M22_5,
  M22_6,
  M22_7,
  M22_8,
];
