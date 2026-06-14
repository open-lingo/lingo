/**
 * Korean Module 23 — Ability & suggestions.
 *
 * KO analog of JA M23 (〜のがじょうずです good-at + 〜のがへたです bad-at +
 * 〜ましょう let's + 〜ませんか shall-we invitation). Re-expressed in Korean's
 * own grammar:
 *
 *   ko-m23-1  Activity verbs — 수영하다 / 운전하다 / 노래하다 / 춤추다 / 요리하다
 *   ko-m23-2  (으)ㄹ 수 있다 / 없다 — can / cannot
 *   ko-m23-3  잘하다 / 못하다 — be good / bad at
 *   ko-m23-4  (으)ㄹ까요? — shall we …? / I wonder
 *   ko-m23-5  (으)ㅂ시다 — let's … (suggestion)
 *   ko-m23-6  Putting it together — making plans
 *   ko-m23-7  Mini-dialogue — let's do something
 *   ko-m23-8  M23 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - (으)ㄹ 수 있다 = 'can / be able to', (으)ㄹ 수 없다 = 'cannot'. The (으)ㄹ
 *     modifier + 수 ('way/possibility') + 있다/없다 ('exist/not'): 수영할 수
 *     있어요 = 'I can swim'; 운전할 수 없어요 = 'I can't drive'. After a vowel
 *     stem → ㄹ 수 (수영할 수); after a consonant stem → 을 수 (먹을 수).
 *   - 잘하다 ('do well / be good at') and 못하다 ('be bad at / can't do well')
 *     take the activity as object: 수영을 잘해요 = 'I'm good at swimming';
 *     요리를 못해요 = 'I'm bad at cooking'. Note 못하다 is written together and
 *     pronounced [모타다]. This is the KO match to JA's じょうず/へた.
 *   - (으)ㄹ까요? = 'shall we …? / shall I …? / I wonder': 같이 갈까요? = 'shall
 *     we go together?'. After a vowel stem → ㄹ까요 (갈까요); after a consonant
 *     stem → 을까요 (먹을까요). This is the KO match to JA's ましょうか/ませんか.
 *   - (으)ㅂ시다 = 'let's …' (a direct suggestion, polite-but-firm): 같이
 *     갑시다 = 'let's go together'. After a vowel stem → ㅂ시다 (갑시다); after
 *     a consonant stem → 읍시다 (먹읍시다). NOTE: (으)ㅂ시다 can sound a touch
 *     commanding to a senior; with friends 같이 가요 (plain polite) or 갈까요?
 *     is softer — flagged below. This is the KO match to JA's ましょう.
 *
 * Builds on: 같이 ('together', M-earlier), 수영 implied, 요리. Activity 하다-
 * verbs are introduced here as recognition vocab. NATIVE-REVIEW flags inline.
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

// ─── ko-m23-1 — Activity verbs ──────────────────────────────────────────────

const M23_1: LessonContent = {
  id: "ko-m23-1",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Activities — 수영, 운전, 노래, 요리",
  description: "Swimming, driving, singing, cooking.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m23-1-info",
      "하다-verbs for activities",
      "Many activities are a noun + 하다 ('do'): 수영하다 ('swim'), 운전하다 ('drive'), 노래하다 ('sing'), 요리하다 ('cook'). The noun alone is the activity: 수영 ('swimming'), 운전 ('driving'), 노래 ('a song'), 요리 ('cooking'). 춤추다 ('dance') is its own verb (춤 = dance + 추다).",
      "default",
    ),
    phrase("ko-m23-1-p-swim", "swimming", "suyeong", "수영", undefined, { emoji: "🏊" }),
    phrase("ko-m23-1-p-drive", "driving", "unjeon", "운전", undefined, { emoji: "🚗" }),
    phrase("ko-m23-1-p-sing", "singing / a song", "norae", "노래", undefined, { emoji: "🎤" }),
    phrase("ko-m23-1-p-cook", "cooking", "yori", "요리", undefined, { emoji: "🍳" }),
    phrase("ko-m23-1-p-dance", "to dance", "chumchuda", "춤추다", undefined, { emoji: "💃" }),
    sentenceMcq({
      id: "ko-m23-1-q-swim",
      prompt: "Which means 'swimming'?",
      correctHangul: "수영",
      distractorsHangul: ["운전", "노래", "요리"],
      explanation: "수영 = swimming.",
      exercisedAtomSurfaces: ["수영"],
    }),
    sentenceMcq({
      id: "ko-m23-1-q-cook",
      prompt: "Which means 'cooking'?",
      correctHangul: "요리",
      distractorsHangul: ["노래", "운전", "수영"],
      explanation: "요리 = cooking. 노래 = a song.",
      exercisedAtomSurfaces: ["요리"],
    }),
    listeningCompSentence({
      id: "ko-m23-1-lc-sing",
      audioText: "노래",
      correctMeaningEn: "a song / singing",
      distractorsEn: ["driving", "cooking", "swimming"],
      exercisedAtomSurfaces: ["노래"],
    }),
    speaking("ko-m23-1-speak-drive", "운전", "driving", ["운전"]),
  ],
};

// ─── ko-m23-2 — (으)ㄹ 수 있다 / 없다 (can / cannot) ────────────────────────

const M23_2: LessonContent = {
  id: "ko-m23-2",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(으)ㄹ 수 있다 / 없다 — can / cannot",
  description: "Say what you can and can't do.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m23-2-info",
      "(으)ㄹ 수 있어요 / 없어요",
      "To say 'can', use the (으)ㄹ modifier + 수 있어요 ('there's a way'): 수영할 수 있어요 = 'I can swim.' For 'cannot', swap to 수 없어요: 운전할 수 없어요 = 'I can't drive.' After a VOWEL stem → ㄹ 수 (수영할 수); after a CONSONANT stem → 을 수 (먹을 수 있어요 'I can eat').",
      "grammar",
    ),
    phrase("ko-m23-2-p-can", "can (do)", "-l su isseoyo", "ㄹ 수 있어요"),
    phrase("ko-m23-2-p-cannot", "cannot (do)", "-l su eopseoyo", "ㄹ 수 없어요"),
    sentenceMcq({
      id: "ko-m23-2-q-canswim",
      prompt: "'I can swim.' —",
      correctHangul: "수영할 수 있어요",
      distractorsHangul: ["수영할 수 없어요", "수영을 수 있어요", "수영할 수 있어요보다"],
      explanation: "수영하다 (vowel stem) → 수영할 수 있어요.",
      exercisedAtomSurfaces: ["수영"],
    }),
    cloze(
      "ko-m23-2-cloze-caneat",
      "매운 음식을 먹",
      "수 있어요",
      "을",
      ["을", "ㄹ", "고", "어서"],
      "I can eat spicy food.",
      "매운 음식을 먹을 수 있어요",
      "먹다 (consonant stem) → 먹을 수 있어요.",
    ),
    sentenceMcq({
      id: "ko-m23-2-q-cantdrive",
      prompt: "'I can't drive.' —",
      correctHangul: "운전할 수 없어요",
      distractorsHangul: ["운전할 수 있어요", "운전을 수 없어요", "운전할 수 안 어요"],
      explanation: "운전하다 → 운전할 수 없어요 ('cannot').",
      exercisedAtomSurfaces: ["운전"],
    }),
    listeningCompSentence({
      id: "ko-m23-2-lc-canswim",
      audioText: "수영할 수 있어요",
      correctMeaningEn: "I can swim",
      distractorsEn: ["I can't swim", "I like swimming", "I'm swimming now"],
      exercisedAtomSurfaces: ["수영"],
    }),
    speaking("ko-m23-2-speak-cantdrive", "운전할 수 없어요", "I can't drive", ["운전"]),
  ],
};

// ─── ko-m23-3 — 잘하다 / 못하다 (good / bad at) ─────────────────────────────

const M23_3: LessonContent = {
  id: "ko-m23-3",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "잘하다 / 못하다 — good / bad at",
  description: "Say what you're good and bad at.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m23-3-info",
      "잘해요 ('good at') / 못해요 ('bad at')",
      "잘하다 = 'do well / be good at', 못하다 = 'be bad at / not do well'. The activity takes 을/를: 수영을 잘해요 = 'I'm good at swimming'; 요리를 못해요 = 'I'm bad at cooking'. (잘 alone = 'well'; 못 alone = 'cannot' before a verb.) 못해요 is written together; it sounds like [모태요].",
      "grammar",
    ),
    phrase("ko-m23-3-p-goodat", "is good at", "jalhaeyo", "잘해요"),
    phrase("ko-m23-3-p-badat", "is bad at", "mothaeyo", "못해요"),
    sentenceMcq({
      id: "ko-m23-3-q-goodswim",
      prompt: "'I'm good at swimming.' —",
      correctHangul: "수영을 잘해요",
      distractorsHangul: ["수영을 못해요", "수영이 잘해요", "수영을 잘 있어요"],
      explanation: "Activity + 을/를 + 잘해요: 수영을 잘해요.",
      exercisedAtomSurfaces: ["수영"],
    }),
    cloze(
      "ko-m23-3-cloze-badcook",
      "요리",
      "못해요",
      "를",
      ["를", "이", "에", "보다"],
      "I'm bad at cooking.",
      "요리를 못해요",
      "The activity takes 을/를: 요리를 못해요.",
    ),
    sentenceMcq({
      id: "ko-m23-3-q-goodsing",
      prompt: "'I'm good at singing.' —",
      correctHangul: "노래를 잘해요",
      distractorsHangul: ["노래를 못해요", "노래가 잘해요", "노래를 잘 있어요"],
      explanation: "노래를 잘해요 = 'I sing well / I'm good at singing.'",
      exercisedAtomSurfaces: ["노래"],
    }),
    listeningCompSentence({
      id: "ko-m23-3-lc-badcook",
      audioText: "요리를 못해요",
      correctMeaningEn: "I'm bad at cooking",
      distractorsEn: ["I'm good at cooking", "I cook every day", "I can't cook today"],
      exercisedAtomSurfaces: ["요리"],
    }),
    speaking("ko-m23-3-speak-goodswim", "수영을 잘해요", "I'm good at swimming", ["수영"]),
  ],
};

// ─── ko-m23-4 — (으)ㄹ까요? (shall we?) ─────────────────────────────────────

const M23_4: LessonContent = {
  id: "ko-m23-4",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(으)ㄹ까요? — shall we …?",
  description: "Float a suggestion or wonder aloud.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m23-4-info",
      "(으)ㄹ까요? — 'shall we …?'",
      "(으)ㄹ까요? proposes something gently: 같이 갈까요? = 'shall we go together?', 뭐 먹을까요? = 'what shall we eat?'. After a VOWEL stem → ㄹ까요 (갈까요); after a CONSONANT stem → 을까요 (먹을까요). It's the softest, friendliest way to suggest — great with friends.",
      "grammar",
    ),
    phrase("ko-m23-4-p-shallwe", "shall we …? (after ㄹ)", "-lkkayo", "ㄹ까요?"),
    sentenceMcq({
      id: "ko-m23-4-q-shallgo",
      prompt: "'Shall we go together?' —",
      correctHangul: "같이 갈까요?",
      distractorsHangul: ["같이 가을까요?", "같이 갈까요보다?", "같이 갈수요?"],
      explanation: "가다 (vowel stem) → 갈까요?.",
      exercisedAtomSurfaces: ["같이"],
    }),
    cloze(
      "ko-m23-4-cloze-shalleat",
      "뭐 먹",
      "?",
      "을까요",
      ["을까요", "ㄹ까요", "을 수 있어요", "어서"],
      "What shall we eat?",
      "뭐 먹을까요?",
      "먹다 (consonant stem) → 먹을까요?.",
    ),
    sentenceMcq({
      id: "ko-m23-4-q-shallcoffee",
      prompt: "'Shall we drink coffee?' —",
      correctHangul: "커피 마실까요?",
      distractorsHangul: ["커피 마실까요보다?", "커피 마시을까요?", "커피 마실수요?"],
      explanation: "마시다 (vowel stem) → 마실까요?.",
      exercisedAtomSurfaces: ["커피"],
    }),
    listeningCompSentence({
      id: "ko-m23-4-lc-shallgo",
      audioText: "같이 갈까요?",
      correctMeaningEn: "Shall we go together?",
      distractorsEn: ["Let's not go", "Can we go?", "Where shall we go?"],
      exercisedAtomSurfaces: ["같이"],
    }),
    speaking("ko-m23-4-speak-shallgo", "같이 갈까요?", "Shall we go together?", ["같이"]),
  ],
};

// ─── ko-m23-5 — (으)ㅂ시다 (let's) ──────────────────────────────────────────

const M23_5: LessonContent = {
  id: "ko-m23-5",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(으)ㅂ시다 — let's …",
  description: "Make a firm 'let's do it' suggestion.",
  estimatedMinutes: 7,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m23-5-info",
      "(으)ㅂ시다 — 'let's …'",
      "(으)ㅂ시다 = 'let's …' — a clear, polite suggestion: 같이 갑시다 = 'let's go together', 밥 먹읍시다 = 'let's eat'. After a VOWEL stem → ㅂ시다 (갑시다); after a CONSONANT stem → 읍시다 (먹읍시다). HEADS-UP: to someone older or senior, ㅂ시다 can sound a bit pushy — with them, prefer the softer 갈까요? or plain 같이 가요.",
      "grammar",
    ),
    phrase("ko-m23-5-p-lets", "let's … (after ㅂ)", "-psida", "ㅂ시다"),
    sentenceMcq({
      id: "ko-m23-5-q-letsgo",
      prompt: "'Let's go together.' —",
      correctHangul: "같이 갑시다",
      distractorsHangul: ["같이 가읍시다", "같이 갈시다", "같이 갑시다보다"],
      // NATIVE-REVIEW: 가다 (vowel stem) → 갑시다 (not 가읍시다). 같이 갑시다 is
      // natural among peers. Register caveat is in the info step. Confirm.
      explanation: "가다 (vowel stem) → 갑시다.",
      exercisedAtomSurfaces: ["같이"],
    }),
    cloze(
      "ko-m23-5-cloze-letseat",
      "밥 먹",
      "",
      "읍시다",
      ["읍시다", "ㅂ시다", "을까요", "어서"],
      "Let's eat.",
      "밥 먹읍시다",
      "먹다 (consonant stem) → 먹읍시다.",
    ),
    sentenceMcq({
      id: "ko-m23-5-q-letsswim",
      prompt: "'Let's swim together.' —",
      correctHangul: "같이 수영합시다",
      distractorsHangul: ["같이 수영하읍시다", "같이 수영할시다", "같이 수영합시다보다"],
      explanation: "수영하다 (vowel stem) → 수영합시다.",
      exercisedAtomSurfaces: ["같이", "수영"],
    }),
    listeningCompSentence({
      id: "ko-m23-5-lc-letsgo",
      audioText: "같이 갑시다",
      correctMeaningEn: "Let's go together",
      distractorsEn: ["Shall we go?", "Let's not go", "I can go"],
      exercisedAtomSurfaces: ["같이"],
    }),
    speaking("ko-m23-5-speak-letsgo", "같이 갑시다", "Let's go together", ["같이"]),
  ],
};

// ─── ko-m23-6 — Putting it together ─────────────────────────────────────────

const M23_6: LessonContent = {
  id: "ko-m23-6",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Making plans",
  description: "Combine ability, 잘/못하다, and suggestions.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m23-6-info",
      "From ability to invitation",
      "저는 수영을 잘해요. 같이 수영할까요? = 'I'm good at swimming. Shall we swim together?' 저는 운전할 수 없으니까 같이 갑시다 = 'I can't drive, so let's go together.' Stack ability ((으)ㄹ 수 있다), 잘/못하다, the M20 으니까 reason, and the suggestions.",
      "default",
    ),
    build(
      "ko-m23-6-build-goodswimask",
      "Build: 'I'm good at swimming. Shall we swim together?' (swimming-obj + good-at + together + swim-shall-we)",
      "수영을 잘해요. 같이 수영할까요?",
      ["수영을", "잘해요.", "같이", "수영할까요?", "못해요."],
      ["수영을", "잘해요.", "같이", "수영할까요?"],
      ["수영", "같이"],
    ),
    sentenceMcq({
      id: "ko-m23-6-q-cantdrivelets",
      prompt: "'I can't drive, so let's go together.' —",
      correctHangul: "운전할 수 없으니까 같이 갑시다",
      distractorsHangul: ["운전할 수 없어서 같이 갑시다", "운전할 수 없으니까 같이 갈시다", "운전할 수 있으니까 같이 갑시다"],
      // NATIVE-REVIEW: 없다 (consonant stem 없-) → 없으니까. The chain
      // (으)ㄹ 수 없으니까 + (으)ㅂ시다 is natural. Confirm 없으니까 (not 없어서)
      // is preferred when a suggestion follows.
      explanation: "없다 → 없으니까 (으니까 allows the following suggestion); 갑시다 = 'let's go.'",
      exercisedAtomSurfaces: ["운전", "같이"],
    }),
    translateStep({
      id: "ko-m23-6-tr-letseat",
      promptEn: "Let's eat together.",
      acceptedAnswers: ["같이 밥 먹읍시다", "같이 밥 먹읍시다.", "같이 먹읍시다", "같이 밥 먹을까요?"],
      audioText: "같이 밥 먹읍시다",
      exercisedAtomSurfaces: ["같이", "밥"],
    }),
    listeningCompSentence({
      id: "ko-m23-6-lc-goodswimask",
      audioText: "수영을 잘해요. 같이 수영할까요?",
      correctMeaningEn: "I'm good at swimming. Shall we swim together?",
      distractorsEn: ["I'm bad at swimming. Let's not swim.", "I can swim. Let's eat.", "Do you like swimming?"],
      exercisedAtomSurfaces: ["수영", "같이"],
    }),
    speaking("ko-m23-6-speak-goodswimask", "같이 수영할까요?", "Shall we swim together?", ["같이", "수영"]),
  ],
};

// ─── ko-m23-7 — Mini-dialogue ───────────────────────────────────────────────

const M23_7: LessonContent = {
  id: "ko-m23-7",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — let's do something",
  description: "Suggest an activity with a friend.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m23-7-info",
      "Planning together",
      "친구: 주말에 뭐 할까요? (What shall we do on the weekend?)\nYou: 저는 요리를 잘해요. 같이 요리할까요? (I'm good at cooking. Shall we cook together?)\n친구: 좋아요! 같이 합시다. (Great! Let's do it.)\nYou: 저는 운전할 수 없으니까 친구가 와 주세요. (I can't drive, so please come over.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m23-7-q-whatdo",
      prompt: "'What shall we do on the weekend?' —",
      correctHangul: "주말에 뭐 할까요?",
      distractorsHangul: ["주말에 뭐 합시다?", "주말에 뭐 할 수 있어요까요?", "주말에 뭐 할까요보다?"],
      // NATIVE-REVIEW: 주말 ('weekend') used; confirm acceptable as recognition
      // vocab here (common N4 word, used in JA M23 parallel).
      explanation: "할까요? = 'shall we do?' (하다 → 할까요).",
      exercisedAtomSurfaces: [],
    }),
    build(
      "ko-m23-7-build-goodcookask",
      "Build: 'I'm good at cooking. Shall we cook together?' (cooking-obj + good-at + together + cook-shall-we)",
      "요리를 잘해요. 같이 요리할까요?",
      ["요리를", "잘해요.", "같이", "요리할까요?", "못해요."],
      ["요리를", "잘해요.", "같이", "요리할까요?"],
      ["요리", "같이"],
    ),
    sentenceMcq({
      id: "ko-m23-7-q-letsdoit",
      prompt: "'Let's do it together.' —",
      correctHangul: "같이 합시다",
      distractorsHangul: ["같이 하읍시다", "같이 할시다", "같이 합시다보다"],
      explanation: "하다 (vowel stem) → 합시다.",
      exercisedAtomSurfaces: ["같이"],
    }),
    listeningCompSentence({
      id: "ko-m23-7-lc-goodcookask",
      audioText: "요리를 잘해요. 같이 요리할까요?",
      correctMeaningEn: "I'm good at cooking. Shall we cook together?",
      distractorsEn: ["I'm bad at cooking. Let's eat out.", "I like cooking. Let's go.", "Can you cook?"],
      exercisedAtomSurfaces: ["요리", "같이"],
    }),
    speaking("ko-m23-7-speak-goodcookask", "같이 요리할까요?", "Shall we cook together?", ["같이", "요리"]),
  ],
};

// ─── ko-m23-8 — Mastery test ────────────────────────────────────────────────

const M23_8: LessonContent = {
  id: "ko-m23-8",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M23 Mastery Test",
  description: "Ability, 잘/못하다, and suggestions.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "ko-m23-8-q-canswim",
      prompt: "'I can swim.' —",
      correctHangul: "수영할 수 있어요",
      distractorsHangul: ["수영할 수 없어요", "수영을 수 있어요", "수영할 수 있어요보다"],
      exercisedAtomSurfaces: ["수영"],
    }),
    sentenceMcq({
      id: "ko-m23-8-q-goodswim",
      prompt: "'I'm good at swimming.' —",
      correctHangul: "수영을 잘해요",
      distractorsHangul: ["수영을 못해요", "수영이 잘해요", "수영을 잘 있어요"],
      exercisedAtomSurfaces: ["수영"],
    }),
    cloze(
      "ko-m23-8-cloze-caneat",
      "매운 음식을 먹",
      "수 있어요",
      "을",
      ["을", "ㄹ", "고", "어서"],
      "I can eat spicy food.",
      "매운 음식을 먹을 수 있어요",
      "먹다 (consonant stem) → 먹을 수 있어요.",
    ),
    sentenceMcq({
      id: "ko-m23-8-q-shallgo",
      prompt: "'Shall we go together?' —",
      correctHangul: "같이 갈까요?",
      distractorsHangul: ["같이 가을까요?", "같이 갈까요보다?", "같이 갈수요?"],
      exercisedAtomSurfaces: ["같이"],
    }),
    sentenceMcq({
      id: "ko-m23-8-q-letsgo",
      prompt: "'Let's go together.' —",
      correctHangul: "같이 갑시다",
      distractorsHangul: ["같이 가읍시다", "같이 갈시다", "같이 갑시다보다"],
      exercisedAtomSurfaces: ["같이"],
    }),
    listeningCompSentence({
      id: "ko-m23-8-lc-badcook",
      audioText: "요리를 못해요",
      correctMeaningEn: "I'm bad at cooking",
      distractorsEn: ["I'm good at cooking", "I can cook", "Let's cook"],
      exercisedAtomSurfaces: ["요리"],
    }),
    speaking("ko-m23-8-speak-recap", "같이 수영할까요?", "Shall we swim together?", ["같이", "수영"]),
  ],
};

export const KO_M23_LESSONS: LessonContent[] = [
  M23_1,
  M23_2,
  M23_3,
  M23_4,
  M23_5,
  M23_6,
  M23_7,
  M23_8,
];
