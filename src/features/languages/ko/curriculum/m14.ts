/**
 * Korean Module 14 — Connecting clauses (고 / 아·어서) + requests (아·어 주세요)
 * + big Sino numbers (백 / 천 / 만).
 *
 * This is the KO analog of JA M14 ("the core grammar module" — て-form
 * formation + 〜てください requests + big numbers/counters). Korean has no
 * single て-form; its clause-joining work is split across two connectives,
 * so M14 teaches BOTH:
 *
 *   ko-m14-1  고 — and / and then (lists two actions: 먹고 자요)
 *   ko-m14-2  아서 / 어서 — and so / and then (sequence; vowel-harmony split)
 *   ko-m14-3  아서 / 어서 — as a reason ('because', in one clause)
 *   ko-m14-4  Big numbers — 백 / 천 / 만 (Sino)
 *   ko-m14-5  Prices — 원 + big numbers (얼마예요? recap)
 *   ko-m14-6  아 / 어 주세요 — please do (for me)
 *   ko-m14-7  Mini-dialogue — asking for help
 *   ko-m14-8  M14 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - 고 attaches to the PLAIN verb stem and just lists/sequences: 먹다 → 먹고,
 *     가다 → 가고. 밥을 먹고 자요 = 'I eat and (then) sleep'. No tense on the
 *     first verb — tense lands on the final verb only.
 *   - 아서/어서 follows VOWEL HARMONY (the same ㅏ/ㅗ → 아, else → 어 rule
 *     behind the M7 해요 present): 가다 → 가서, 먹다 → 먹어서. Two jobs:
 *     (a) tight sequence ('do A and then B, same subject') and
 *     (b) reason ('because A, B'). Tense never sits on the 아서/어서 clause.
 *   - The polite request is verb-아/어 + 주세요 (give-me-the-favor-of): 기다리다
 *     → 기다려 주세요 ('please wait'). This builds on 주세요 from M5.
 *   - Big Sino numbers stack: 만 (10,000), 천 (1,000), 백 (100). 만 원 = 10,000
 *     won; 삼만 원 = 30,000 won. Korean groups by 만 (10⁴), not by thousands.
 *
 * NATIVE-REVIEW flags are inline at the relevant steps. See WORKTREE_REPORT.md.
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

// ─── ko-m14-1 — 고 (and / and then) ─────────────────────────────────────────

const M14_1: LessonContent = {
  id: "ko-m14-1",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "고 — and / and then",
  description: "List two actions: 밥을 먹고 자요.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m14-1-info",
      "고 joins two verbs",
      "고 attaches to the PLAIN verb stem to list or sequence actions: 먹다 → 먹고, 가다 → 가고. 밥을 먹고 자요 = 'I eat and (then) sleep.' The first verb stays tense-less — only the FINAL verb carries tense and politeness. (You already met 고 inside 먹고 싶어요 'want to eat' in M11.)",
      "grammar",
    ),
    phrase("ko-m14-1-p-and", "and / and then (verb + 고)", "go", "고"),
    sentenceMcq({
      id: "ko-m14-1-q-eatsleep",
      prompt: "'I eat and (then) sleep.' —",
      correctHangul: "밥을 먹고 자요",
      distractorsHangul: ["밥을 먹어요 자요", "밥을 먹고 자고", "밥을 먹서 자요"],
      explanation: "Stem + 고 on the first verb; tense on the last: 먹고 자요.",
      exercisedAtomSurfaces: ["밥", "고"],
    }),
    cloze(
      "ko-m14-1-cloze-gowatch",
      "집에 가",
      "영화를 봐요",
      "고",
      ["고", "서", "도", "만"],
      "I go home and watch a movie.",
      "집에 가고 영화를 봐요",
      "고 lists the two actions; tense lands on 봐요.",
    ),
    build(
      "ko-m14-1-build-studysleep",
      "Build: 'I study and (then) sleep.' (study + and + sleep)",
      "공부하고 자요",
      ["공부하고", "자요", "공부해서", "먹고"],
      ["공부하고", "자요"],
      ["공부", "고"],
    ),
    listeningCompSentence({
      id: "ko-m14-1-lc-eatsleep",
      audioText: "밥을 먹고 자요",
      correctMeaningEn: "I eat and (then) sleep",
      distractorsEn: ["I sleep and (then) eat", "I want to eat", "I'm eating"],
      exercisedAtomSurfaces: ["밥", "고"],
    }),
    speaking("ko-m14-1-speak-eatsleep", "밥을 먹고 자요", "I eat and then sleep", ["밥", "고"]),
  ],
};

// ─── ko-m14-2 — 아서 / 어서 (sequence) ──────────────────────────────────────

const M14_2: LessonContent = {
  id: "ko-m14-2",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "아서 / 어서 — and so (sequence)",
  description: "Tightly link two actions with the same subject.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m14-2-info",
      "Vowel harmony picks 아서 or 어서",
      "아서/어서 glues two actions where the SECOND depends on the first (same subject): 가서 ('go and …'), 먹어서 ('eat and …'). The split follows vowel harmony — the same ㅏ/ㅗ → 아, everything else → 어 rule from the M7 해요 present. 가다 → 가서, 먹다 → 먹어서. The first clause never takes tense. 집에 가서 자요 = 'I go home and (there) sleep.'",
      "grammar",
    ),
    phrase("ko-m14-2-p-aseo", "and so (after ㅏ/ㅗ stem)", "aseo", "아서"),
    phrase("ko-m14-2-p-eoseo", "and so (other stems)", "eoseo", "어서"),
    sentenceMcq({
      id: "ko-m14-2-q-gosleep",
      prompt: "'I go home and (then there) sleep.' —",
      correctHangul: "집에 가서 자요",
      distractorsHangul: ["집에 가고 자요", "집에 가어서 자요", "집에 가서 자고"],
      // NATIVE-REVIEW: both 가서 자요 (go-and-there-sleep, tight) and 가고
      // 자요 (just listing) are grammatical Korean; this item teaches the
      // 아서 form specifically. Confirm the 가고 distractor reads as 'less
      // tight' rather than outright wrong to a native ear.
      explanation: "가다 → 가서 (ㅏ stem). 아서 = the second action happens at/after the first.",
      exercisedAtomSurfaces: ["아서", "가요"],
    }),
    cloze(
      "ko-m14-2-cloze-eatgo",
      "밥을 먹",
      "가요",
      "어서",
      ["어서", "아서", "고", "지만"],
      "I eat and (then) go.",
      "밥을 먹어서 가요",
      "먹다 → 먹어서 (not a ㅏ/ㅗ stem → 어서).",
    ),
    build(
      "ko-m14-2-build-comebuy",
      "Build: 'I go to the store and buy bread.' (store + to + go-and + bread + buy)",
      "가게에 가서 빵을 사요",
      ["가게에", "가서", "빵을", "사요", "가고"],
      ["가게에", "가서", "빵을", "사요"],
      // NATIVE-REVIEW: 사다/사요 ('to buy') is used as a support verb here and
      // is not its own atom — confirm it's fine as recognition-only at M14.
      ["아서", "빵"],
    ),
    listeningCompSentence({
      id: "ko-m14-2-lc-gosleep",
      audioText: "집에 가서 자요",
      correctMeaningEn: "I go home and sleep (there)",
      distractorsEn: ["I sleep and then go home", "I want to go home", "I'm going home"],
      exercisedAtomSurfaces: ["아서", "가요"],
    }),
    speaking("ko-m14-2-speak-gosleep", "집에 가서 자요", "I go home and sleep", ["아서", "가요"]),
  ],
};

// ─── ko-m14-3 — 아서 / 어서 (reason) ────────────────────────────────────────

const M14_3: LessonContent = {
  id: "ko-m14-3",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "아서 / 어서 — because",
  description: "The same ending also means 'because'.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m14-3-info",
      "아서/어서 = 'because', in one clause",
      "The very same 아서/어서 can mean 'because': 비가 와서 집에 있어요 = 'Because it's raining, I'm staying home.' Compare with M13's 그래서 ('비가 와요. 그래서 집에 있어요') — same idea, but 아서/어서 fuses the two clauses with no full stop. Reason clause takes no tense. NOTE: you can't use 아서/어서 for a reason before a command or suggestion — that's a different ending — but for plain statements it's the everyday 'because'.",
      "grammar",
    ),
    sentenceMcq({
      id: "ko-m14-3-q-rainstayhome",
      prompt: "'Because it's raining, I'm staying home.' —",
      correctHangul: "비가 와서 집에 있어요",
      distractorsHangul: ["비가 와고 집에 있어요", "비가 왔어서 집에 있어요", "비가 와서 집에 있었어요만"],
      explanation: "오다 → 와서. Reason clause carries no tense: 비가 와서.",
      exercisedAtomSurfaces: ["아서", "비"],
    }),
    cloze(
      "ko-m14-3-cloze-busy",
      "바빠",
      "못 가요",
      "서",
      ["서", "고", "지만", "도"],
      "I'm busy, so I can't go.",
      "바빠서 못 가요",
      // NATIVE-REVIEW: 바쁘다 → 바빠서 (ㅡ-drop + vowel harmony). 바쁘다 is not a
      // registered atom; confirm it reads naturally as a recognition-only word.
      "바쁘다 → 바빠서 (ㅡ drops, ㅏ harmony). 'because (I'm) busy'.",
    ),
    translateStep({
      id: "ko-m14-3-tr-deliciouseat",
      promptEn: "It's delicious, so I eat a lot.",
      acceptedAnswers: ["맛있어서 많이 먹어요", "맛있어서 많이 먹어요."],
      audioText: "맛있어서 많이 먹어요",
      // NATIVE-REVIEW: 많이 ('a lot/much') is used here without being a
      // registered atom — confirm acceptable as recognition-only support.
      exercisedAtomSurfaces: ["어서", "먹어요"],
    }),
    listeningCompSentence({
      id: "ko-m14-3-lc-rain",
      audioText: "비가 와서 집에 있어요",
      correctMeaningEn: "Because it's raining, I'm staying home",
      distractorsEn: ["It's raining, but I go out", "I stay home and it rains", "I want to stay home"],
      exercisedAtomSurfaces: ["아서", "비"],
    }),
    speaking("ko-m14-3-speak-rain", "비가 와서 집에 있어요", "Because it's raining, I stay home", ["아서", "비"]),
  ],
};

// ─── ko-m14-4 — Big numbers (백 / 천 / 만) ──────────────────────────────────

const M14_4: LessonContent = {
  id: "ko-m14-4",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Big numbers — 백 / 천 / 만",
  description: "Hundred, thousand, ten thousand (Sino).",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m14-4-info",
      "백 (100), 천 (1,000), 만 (10,000)",
      "Big numbers are Sino and stack left to right: 백 = 100, 천 = 1,000, 만 = 10,000. 이백 = 200, 삼천 = 3,000, 오만 = 50,000. Korean groups by 만 (ten-thousands), so 10,000 is just 만 (not 십천). 만 by itself usually appears as 만 (you don't say 일만 for plain 10,000).",
      "grammar",
    ),
    phrase("ko-m14-4-p-hundred", "hundred", "baek", "백"),
    phrase("ko-m14-4-p-thousand", "thousand", "cheon", "천"),
    phrase("ko-m14-4-p-tenthousand", "ten thousand", "man", "만"),
    sentenceMcq({
      id: "ko-m14-4-q-3000",
      prompt: "'3,000' —",
      correctHangul: "삼천",
      distractorsHangul: ["삼백", "삼만", "세천"],
      explanation: "삼 (Sino 3) + 천 (1,000) = 삼천.",
      exercisedAtomSurfaces: ["천"],
    }),
    sentenceMcq({
      id: "ko-m14-4-q-50000",
      prompt: "'50,000' —",
      correctHangul: "오만",
      distractorsHangul: ["오천", "오백", "다섯만"],
      explanation: "오 (Sino 5) + 만 (10,000) = 오만.",
      exercisedAtomSurfaces: ["만"],
    }),
    listeningCompSentence({
      id: "ko-m14-4-lc-200",
      audioText: "이백",
      correctMeaningEn: "200",
      distractorsEn: ["2,000", "20,000", "20"],
      exercisedAtomSurfaces: ["백"],
    }),
    speaking("ko-m14-4-speak-3000", "삼천", "3,000", ["천"]),
  ],
};

// ─── ko-m14-5 — Prices (원 + big numbers) ───────────────────────────────────

const M14_5: LessonContent = {
  id: "ko-m14-5",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Prices — 원 + big numbers",
  description: "얼마예요? Answer with thousands and ten-thousands.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m14-5-info",
      "Counting money",
      "Korean money uses 원 (₩) with Sino numbers (from M5's 얼마예요? 'how much?'). 만 원 = 10,000 won, 삼천 원 = 3,000 won, 오만 원 = 50,000 won. The number comes before 원, with a space: 만 원.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m14-5-q-10000won",
      prompt: "'10,000 won' —",
      correctHangul: "만 원",
      distractorsHangul: ["십천 원", "백 원", "만 분"],
      explanation: "10,000 = 만; with currency = 만 원.",
      exercisedAtomSurfaces: ["만"],
    }),
    cloze(
      "ko-m14-5-cloze-3000won",
      "삼천",
      "이에요",
      "원",
      ["원", "분", "시", "월"],
      "It's 3,000 won.",
      "삼천 원이에요",
      "Currency counter → 원.",
    ),
    translateStep({
      id: "ko-m14-5-tr-howmuch",
      promptEn: "It's 50,000 won.",
      acceptedAnswers: ["오만 원이에요", "오만 원이에요."],
      audioText: "오만 원이에요",
      exercisedAtomSurfaces: ["만"],
    }),
    listeningCompSentence({
      id: "ko-m14-5-lc-10000won",
      audioText: "만 원이에요",
      correctMeaningEn: "It's 10,000 won",
      distractorsEn: ["It's 1,000 won", "It's 100 won", "It's 100,000 won"],
      exercisedAtomSurfaces: ["만"],
    }),
    speaking("ko-m14-5-speak-3000won", "삼천 원이에요", "It's 3,000 won", ["천"]),
  ],
};

// ─── ko-m14-6 — 아 / 어 주세요 (requests) ───────────────────────────────────

const M14_6: LessonContent = {
  id: "ko-m14-6",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "아 / 어 주세요 — please do (for me)",
  description: "Ask someone to do something for you.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m14-6-info",
      "verb-아/어 + 주세요",
      "To ask someone to DO something for you, take the verb's 아/어 form (vowel harmony, like the 해요 present) and add 주세요: 기다리다 → 기다려 주세요 ('please wait'), 보다 → 봐 주세요 ('please look'). This extends the bare 주세요 ('please give', M5) to any action. 도와주세요 ('please help') is the everyday must-know.",
      "grammar",
    ),
    phrase("ko-m14-6-p-help", "please help me", "dowajuseyo", "도와주세요"),
    phrase("ko-m14-6-p-wait", "please wait", "gidaryeo juseyo", "기다려 주세요"),
    sentenceMcq({
      id: "ko-m14-6-q-pleasewait",
      prompt: "'Please wait.' —",
      correctHangul: "기다려 주세요",
      distractorsHangul: ["기다리 주세요", "기다려요 주세요", "기다리고 주세요"],
      explanation: "기다리다 → 기다려 (아/어 form) + 주세요.",
      exercisedAtomSurfaces: ["기다려 주세요"],
    }),
    sentenceMcq({
      id: "ko-m14-6-q-pleaselook",
      prompt: "'Please look (at it).' —",
      correctHangul: "봐 주세요",
      distractorsHangul: ["보 주세요", "봐요 주세요", "보고 주세요"],
      // NATIVE-REVIEW: 봐 주세요 vs the very common spaced/joined variants
      // (봐 주세요 / 봐주세요) — both spellings occur; confirm the spaced form
      // is the right one to teach as canonical here.
      explanation: "보다 → 봐 (아/어 form) + 주세요.",
      exercisedAtomSurfaces: ["봐요"],
    }),
    translateStep({
      id: "ko-m14-6-tr-pleasehelp",
      promptEn: "Please help me.",
      acceptedAnswers: ["도와주세요", "도와 주세요", "도와주세요."],
      audioText: "도와주세요",
      exercisedAtomSurfaces: ["도와주세요"],
    }),
    listeningCompSentence({
      id: "ko-m14-6-lc-wait",
      audioText: "기다려 주세요",
      correctMeaningEn: "Please wait",
      distractorsEn: ["Please help me", "Please look", "Please give it to me"],
      exercisedAtomSurfaces: ["기다려 주세요"],
    }),
    speaking("ko-m14-6-speak-help", "도와주세요", "Please help me", ["도와주세요"]),
  ],
};

// ─── ko-m14-7 — Mini-dialogue ───────────────────────────────────────────────

const M14_7: LessonContent = {
  id: "ko-m14-7",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — asking for help",
  description: "Link actions, give a reason, make a request.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m14-7-info",
      "Putting it together",
      "A: 도와주세요. (Please help me.)\nB: 네, 뭐예요? (Sure, what is it?)\nA: 바빠서 시간이 없어요. (I'm busy, so I have no time.)\nB: 알겠어요. 기다려 주세요. (Got it. Please wait.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m14-7-q-busynotime",
      prompt: "'I'm busy, so I have no time.' —",
      correctHangul: "바빠서 시간이 없어요",
      distractorsHangul: ["바빠고 시간이 없어요", "바빠서 시간이 있어요", "바빠지만 시간이 없어요"],
      explanation: "바쁘다 → 바빠서 (reason). 시간이 없어요 = 'have no time'.",
      exercisedAtomSurfaces: ["아서"],
    }),
    build(
      "ko-m14-7-build-eathelp",
      "Build: 'I eat and (then) help.' (eat + and + help)",
      "밥을 먹고 도와줘요",
      ["밥을", "먹고", "도와줘요", "먹어서"],
      ["밥을", "먹고", "도와줘요"],
      // NATIVE-REVIEW: 도와줘요 ('I help / help (casual request)') vs the
      // taught 도와주세요 ('please help'). The build target uses the plain
      // 도와줘요 statement form; confirm it's natural for 'I help' here.
      ["밥", "고"],
    ),
    translateStep({
      id: "ko-m14-7-tr-pleasewait",
      promptEn: "Please wait.",
      acceptedAnswers: ["기다려 주세요", "기다려 주세요."],
      audioText: "기다려 주세요",
      exercisedAtomSurfaces: ["기다려 주세요"],
    }),
    listeningCompSentence({
      id: "ko-m14-7-lc-help",
      audioText: "도와주세요",
      correctMeaningEn: "Please help me",
      distractorsEn: ["Please wait", "I'm busy", "Thank you"],
      exercisedAtomSurfaces: ["도와주세요"],
    }),
    speaking("ko-m14-7-speak-busy", "바빠서 시간이 없어요", "I'm busy, so I have no time", ["아서"]),
  ],
};

// ─── ko-m14-8 — Mastery test ────────────────────────────────────────────────

const M14_8: LessonContent = {
  id: "ko-m14-8",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M14 Mastery Test",
  description: "고, 아서/어서, big numbers, and requests.",
  estimatedMinutes: 7,
  xpReward: 17,
  steps: [
    sentenceMcq({
      id: "ko-m14-8-q-eatsleep",
      prompt: "'I eat and (then) sleep.' —",
      correctHangul: "밥을 먹고 자요",
      distractorsHangul: ["밥을 먹어요 자요", "밥을 먹고 자고", "밥을 먹서 자요"],
      exercisedAtomSurfaces: ["밥", "고"],
    }),
    sentenceMcq({
      id: "ko-m14-8-q-rain",
      prompt: "'Because it's raining, I'm staying home.' —",
      correctHangul: "비가 와서 집에 있어요",
      distractorsHangul: ["비가 와고 집에 있어요", "비가 왔어서 집에 있어요", "비가 와서 집에 가요"],
      exercisedAtomSurfaces: ["아서", "비"],
    }),
    sentenceMcq({
      id: "ko-m14-8-q-50000",
      prompt: "'50,000' —",
      correctHangul: "오만",
      distractorsHangul: ["오천", "오백", "다섯만"],
      exercisedAtomSurfaces: ["만"],
    }),
    cloze(
      "ko-m14-8-cloze-3000won",
      "삼천",
      "이에요",
      "원",
      ["원", "분", "시", "월"],
      "It's 3,000 won.",
      "삼천 원이에요",
      "Currency → 원.",
    ),
    sentenceMcq({
      id: "ko-m14-8-q-pleasewait",
      prompt: "'Please wait.' —",
      correctHangul: "기다려 주세요",
      distractorsHangul: ["기다리 주세요", "기다려요 주세요", "기다리고 주세요"],
      exercisedAtomSurfaces: ["기다려 주세요"],
    }),
    listeningCompSentence({
      id: "ko-m14-8-lc-help",
      audioText: "도와주세요",
      correctMeaningEn: "Please help me",
      distractorsEn: ["Please wait", "I'm busy", "Thank you"],
      exercisedAtomSurfaces: ["도와주세요"],
    }),
    speaking("ko-m14-8-speak-recap", "밥을 먹고 자요", "I eat and then sleep", ["밥", "고"]),
  ],
};

export const KO_M14_LESSONS: LessonContent[] = [
  M14_1,
  M14_2,
  M14_3,
  M14_4,
  M14_5,
  M14_6,
  M14_7,
  M14_8,
];
