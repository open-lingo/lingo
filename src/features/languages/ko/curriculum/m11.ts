/**
 * Korean Module 11 — Saying no & saying can't (negation + ability + wanting).
 *
 * M7-M10 built affirmative sentences in present and past. M11 gives the
 * learner the other half of every conversation: how to say you DON'T do
 * something (안), how to say you CAN'T (못), and how to say you WANT to
 * (고 싶어요).
 *
 * Grammar spine mirrors the JA M11 negation arc (ません / ない + can't),
 * re-expressed in Korean's own grammar:
 *
 *   ko-m11-1  안 — simple negation ('don't / not')
 *   ko-m11-2  안 with 하다 verbs — 공부 안 해요 (the split gotcha)
 *   ko-m11-3  못 — can't (inability)
 *   ko-m11-4  안 vs 못 — choosing the right 'no'
 *   ko-m11-5  Negation in the past — 안 갔어요 / 못 갔어요
 *   ko-m11-6  고 싶어요 — want to
 *   ko-m11-7  Mini-dialogue — declining politely
 *   ko-m11-8  M11 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - 안 + verb = simple negation; 안 sits BEFORE the verb (short negation).
 *   - 못 + verb = inability ('can't' — circumstance, not lack of skill).
 *   - 하다-verbs split: the noun keeps 하다 but 안/못 goes BETWEEN them
 *     (공부 안 해요, 공부 못 해요), NOT before the whole word. Headline gotcha.
 *   - 'want to' = verb stem + 고 싶어요 (가다 → 가고 싶어요).
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
import { withReviewInterleave } from "./_reviewInterleave";

const COURSE_ID = "mock-1";

// ─── ko-m11-1 — 안 (simple negation) ────────────────────────────────────────

const M11_1: LessonContent = {
  id: "ko-m11-1",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "안 — don't / not",
  description: "Say you don't do something: just add 안 before the verb.",
  estimatedMinutes: 5,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m11-1-info",
      "안 goes before the verb",
      "To make a verb negative, put 안 right before it. 가요 → 안 가요 ('I don't go'). 먹어요 → 안 먹어요 ('I don't eat'). It's that simple — 안 is a small word that flips the whole verb. (This is the everyday 'short' negation.)",
      "grammar",
    ),
    phrase("ko-m11-1-p-not", "not (before a verb)", "an", "안"),
    sentenceMcq({
      id: "ko-m11-1-q-dontgo",
      prompt: "'I don't go.' —",
      correctHangul: "안 가요",
      distractorsHangul: ["가요 안", "안가요를", "못 가요"],
      explanation: "안 sits BEFORE the verb: 안 가요. (못 가요 = 'can't go'.)",
      exercisedAtomSurfaces: ["안", "가요"],
    }),
    cloze(
      "ko-m11-1-cloze-donteat",
      "밥을",
      "먹어요",
      "안",
      ["안", "못", "도", "를"],
      "I don't eat (rice).",
      "밥을 안 먹어요",
      "안 goes right before the verb 먹어요.",
    ),
    sentenceMcq({
      id: "ko-m11-1-q-dontdrink",
      prompt: "'I don't drink coffee.' —",
      correctHangul: "커피를 안 마셔요",
      distractorsHangul: ["커피를 마셔요 안", "커피를 안마셔요를", "커피 안를 마셔요"],
      explanation: "Object first, then 안 + verb: 커피를 안 마셔요.",
      exercisedAtomSurfaces: ["커피", "안", "마셔요"],
    }),
    listeningCompSentence({
      id: "ko-m11-1-lc-dontgo",
      audioText: "안 가요",
      correctMeaningEn: "I don't go",
      distractorsEn: ["I go", "I can't go", "I went"],
      exercisedAtomSurfaces: ["안", "가요"],
    }),
    speaking("ko-m11-1-speak-dontgo", "안 가요", "I don't go", ["안", "가요"]),
  ],
};

// ─── ko-m11-2 — 안 with 하다 verbs ──────────────────────────────────────────

const M11_2: LessonContent = {
  id: "ko-m11-2",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "공부 안 해요 — the 하다 split",
  description: "With noun + 하다 verbs, 안 sneaks INTO the middle.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m11-2-info",
      "안 goes between the noun and 하다",
      "Watch out: with 하다 verbs like 공부하다, the 안 does NOT go in front of the whole word. It slips between the noun and 하다: 공부 안 해요 ('I don't study'), NOT 안 공부해요. This is the most common negation mistake — the noun and 하다 split apart.",
      "tip",
    ),
    sentenceMcq({
      id: "ko-m11-2-q-dontstudy",
      prompt: "'I don't study.' —",
      correctHangul: "공부 안 해요",
      distractorsHangul: ["안 공부해요", "공부해요 안", "공부 못 해요"],
      explanation: "안 splits in: 공부 안 해요. (안 공부해요 is the classic mistake.)",
      exercisedAtomSurfaces: ["공부", "안", "해요"],
    }),
    cloze(
      "ko-m11-2-cloze-dontstudy",
      "공부",
      "해요",
      "안",
      ["안", "못", "도", "를"],
      "I don't study.",
      "공부 안 해요",
      "With 하다 verbs, 안 goes between the noun and 해요.",
    ),
    build(
      "ko-m11-2-build-dontstudy",
      "Build: 'Today I don't study.' (today + study + not + do)",
      "오늘 공부 안 해요",
      ["오늘", "공부", "안", "해요"],
      ["오늘", "공부", "안", "해요"],
      ["공부", "안", "해요"],
    ),
    listeningCompSentence({
      id: "ko-m11-2-lc-dontstudy",
      audioText: "공부 안 해요",
      correctMeaningEn: "I don't study",
      distractorsEn: ["I study", "I can't study", "I studied"],
      exercisedAtomSurfaces: ["공부", "안", "해요"],
    }),
    speaking("ko-m11-2-speak-dontstudy", "공부 안 해요", "I don't study", ["공부", "안", "해요"]),
  ],
};

// ─── ko-m11-3 — 못 (can't) ──────────────────────────────────────────────────

const M11_3: LessonContent = {
  id: "ko-m11-3",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "못 — can't",
  description: "Say you're unable to do something with 못.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m11-3-info",
      "못 = 'can't' (unable)",
      "못 works like 안, but means 'can't' — something stops you. 못 가요 = 'I can't go' (maybe you're busy). 못 먹어요 = 'I can't eat (it)'. Like 안, 못 sits before the verb, and 하다 verbs split the same way: 공부 못 해요.",
      "grammar",
    ),
    phrase("ko-m11-3-p-cant", "can't (before a verb)", "mot", "못"),
    sentenceMcq({
      id: "ko-m11-3-q-cantgo",
      prompt: "'I can't go.' —",
      correctHangul: "못 가요",
      distractorsHangul: ["안 가요", "가요 못", "못가요를"],
      explanation: "못 = 'can't'. 못 가요. (안 가요 = 'don't go'.)",
      exercisedAtomSurfaces: ["못", "가요"],
    }),
    cloze(
      "ko-m11-3-cloze-canteat",
      "밥을",
      "먹어요",
      "못",
      ["못", "안", "도", "를"],
      "I can't eat (rice).",
      "밥을 못 먹어요",
      "못 ('can't') sits before the verb.",
    ),
    sentenceMcq({
      id: "ko-m11-3-q-cantstudy",
      prompt: "'I can't study.' —",
      correctHangul: "공부 못 해요",
      distractorsHangul: ["못 공부해요", "공부해요 못", "공부 안 해요"],
      explanation: "하다 verbs split: 공부 못 해요.",
      exercisedAtomSurfaces: ["공부", "못", "해요"],
    }),
    listeningCompSentence({
      id: "ko-m11-3-lc-cantgo",
      audioText: "못 가요",
      correctMeaningEn: "I can't go",
      distractorsEn: ["I don't go", "I go", "I went"],
      exercisedAtomSurfaces: ["못", "가요"],
    }),
    speaking("ko-m11-3-speak-cantgo", "못 가요", "I can't go", ["못", "가요"]),
  ],
};

// ─── ko-m11-4 — 안 vs 못 ────────────────────────────────────────────────────

const M11_4: LessonContent = {
  id: "ko-m11-4",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "안 vs 못 — which 'no'?",
  description: "Choose 'don't' (안) vs 'can't' (못) by meaning.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m11-4-info",
      "Choice vs circumstance",
      "안 = you DON'T (a choice): 안 먹어요 = 'I don't eat (it)'. 못 = you CAN'T (something prevents it): 못 먹어요 = 'I can't eat (it)' — maybe you're full or allergic. Same verb, different 'no'.",
      "grammar",
    ),
    sentenceMcq({
      id: "ko-m11-4-q-choice",
      prompt: "You're choosing not to eat it. 'I don't eat it.' —",
      correctHangul: "안 먹어요",
      distractorsHangul: ["못 먹어요", "먹어요 안", "안 못 먹어요"],
      explanation: "A choice → 안.",
      exercisedAtomSurfaces: ["안", "먹어요"],
    }),
    sentenceMcq({
      id: "ko-m11-4-q-cant",
      prompt: "You're too full. 'I can't eat (any more).' —",
      correctHangul: "못 먹어요",
      distractorsHangul: ["안 먹어요", "먹어요 못", "못 안 먹어요"],
      explanation: "Prevented → 못.",
      exercisedAtomSurfaces: ["못", "먹어요"],
    }),
    cloze(
      "ko-m11-4-cloze-cantgo",
      "오늘",
      "가요",
      "못",
      ["못", "안", "도", "를"],
      "Today I can't go.",
      "오늘 못 가요",
      "Unable → 못.",
    ),
    listeningCompSentence({
      id: "ko-m11-4-lc-cant",
      audioText: "못 먹어요",
      correctMeaningEn: "I can't eat (it)",
      distractorsEn: ["I don't eat (it)", "I eat (it)", "I ate (it)"],
      exercisedAtomSurfaces: ["못", "먹어요"],
    }),
    speaking("ko-m11-4-speak-donteat", "안 먹어요", "I don't eat it", ["안", "먹어요"]),
  ],
};

// ─── ko-m11-5 — Negation in the past ────────────────────────────────────────

const M11_5: LessonContent = {
  id: "ko-m11-5",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Negation in the past",
  description: "안/못 + the past tense you already know.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m11-5-info",
      "안/못 just sit before the past verb",
      "Negating the past is easy: keep 안/못 before the verb and put the verb in the past. 안 갔어요 = 'I didn't go'. 못 먹었어요 = 'I couldn't eat'. 어제 공부 안 했어요 = 'Yesterday I didn't study'.",
      "grammar",
    ),
    sentenceMcq({
      id: "ko-m11-5-q-didntgo",
      prompt: "'I didn't go.' —",
      correctHangul: "안 갔어요",
      distractorsHangul: ["안 가요", "못 갔어요", "갔어요 안"],
      explanation: "안 + past 갔어요 = 'didn't go'. (못 갔어요 = 'couldn't go'.)",
      exercisedAtomSurfaces: ["안", "갔어요"],
    }),
    sentenceMcq({
      id: "ko-m11-5-q-couldnteat",
      prompt: "'I couldn't eat.' —",
      correctHangul: "못 먹었어요",
      distractorsHangul: ["안 먹었어요", "못 먹어요", "먹었어요 못"],
      explanation: "못 + past 먹었어요 = 'couldn't eat'.",
      exercisedAtomSurfaces: ["못", "먹었어요"],
    }),
    cloze(
      "ko-m11-5-cloze-didntstudy",
      "어제 공부",
      "했어요",
      "안",
      ["안", "못", "도", "를"],
      "Yesterday I didn't study.",
      "어제 공부 안 했어요",
      "하다 verb → 공부 안 했어요 (안 splits in, verb is past).",
    ),
    listeningCompSentence({
      id: "ko-m11-5-lc-didntgo",
      audioText: "어제 안 갔어요",
      correctMeaningEn: "I didn't go yesterday",
      distractorsEn: ["I couldn't go yesterday", "I don't go", "I went yesterday"],
      exercisedAtomSurfaces: ["어제", "안", "갔어요"],
    }),
    speaking("ko-m11-5-speak-didntgo", "안 갔어요", "I didn't go", ["안", "갔어요"]),
  ],
};

// ─── ko-m11-6 — 고 싶어요 (want to) ─────────────────────────────────────────

const M11_6: LessonContent = {
  id: "ko-m11-6",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "고 싶어요 — want to",
  description: "Say what you want to do: verb stem + 고 싶어요.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m11-6-info",
      "verb stem + 고 싶어요",
      "To say 'I want to (verb)', take the verb stem (drop 다) and add 고 싶어요. 가다 → 가고 싶어요 ('I want to go'). 먹다 → 먹고 싶어요 ('I want to eat'). 보다 → 보고 싶어요 ('I want to watch'; it also means 'I miss you'!).",
      "grammar",
    ),
    phrase("ko-m11-6-p-wanttogo", "want to go", "gago sipeoyo", "가고 싶어요"),
    phrase("ko-m11-6-p-wanttoeat", "want to eat", "meokgo sipeoyo", "먹고 싶어요"),
    sentenceMcq({
      id: "ko-m11-6-q-wanttoeat",
      prompt: "'I want to eat.' —",
      correctHangul: "먹고 싶어요",
      distractorsHangul: ["먹어 싶어요", "먹다 싶어요", "먹고 싶다요"],
      explanation: "Stem 먹 + 고 싶어요 = 먹고 싶어요.",
      exercisedAtomSurfaces: ["먹고 싶어요"],
    }),
    build(
      "ko-m11-6-build-wanteatrice",
      "Build: 'I want to eat rice.' (rice + want-to-eat)",
      "밥을 먹고 싶어요",
      ["밥을", "먹고 싶어요", "가고 싶어요", "안"],
      ["밥을", "먹고 싶어요"],
      ["밥", "먹고 싶어요"],
    ),
    sentenceMcq({
      id: "ko-m11-6-q-wanttogo",
      prompt: "'I want to go home.' —",
      correctHangul: "집에 가고 싶어요",
      distractorsHangul: ["집에 가고 싶다요", "집에서 가고 싶어요", "집을 가고 싶어요"],
      explanation: "집에 (to home) + 가고 싶어요.",
      exercisedAtomSurfaces: ["집", "가고 싶어요"],
    }),
    listeningCompSentence({
      id: "ko-m11-6-lc-wanttogo",
      audioText: "가고 싶어요",
      correctMeaningEn: "I want to go",
      distractorsEn: ["I don't go", "I went", "I can't go"],
      exercisedAtomSurfaces: ["가고 싶어요"],
    }),
    speaking("ko-m11-6-speak-wanttoeat", "밥을 먹고 싶어요", "I want to eat rice", ["밥", "먹고 싶어요"]),
  ],
};

// ─── ko-m11-7 — Mini-dialogue ───────────────────────────────────────────────

const M11_7: LessonContent = {
  id: "ko-m11-7",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — declining politely",
  description: "Turn something down and say what you'd rather do.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m11-7-info",
      "Saying no, nicely",
      "A: 커피 마셔요? (Are you drinking coffee?)\nB: 아니요, 커피 안 마셔요. (No, I don't drink coffee.)\nA: 영화 보고 싶어요? (Do you want to watch a movie?)\nB: 오늘은 못 봐요. (I can't today.)\nEverything here uses 안, 못, and 고 싶어요.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m11-7-q-dontdrink",
      // NATIVE-REVIEW: 커피 with the object particle dropped before the verb is
      // the natural spoken register; confirm 커피 안 마셔요 reads naturally vs
      // 커피를 안 마셔요.
      prompt: "'No, I don't drink coffee.' —",
      correctHangul: "아니요, 커피 안 마셔요",
      distractorsHangul: ["아니요, 커피 못 마셔요", "네, 커피 마셔요", "아니요, 커피 마셔요 안"],
      explanation: "아니요 (no) + 커피 안 마셔요 (don't drink coffee).",
      exercisedAtomSurfaces: ["커피", "안", "마셔요"],
    }),
    sentenceMcq({
      id: "ko-m11-7-q-canttoday",
      // NATIVE-REVIEW: 오늘은 (topic-marked 'today') for contrast is natural but
      // slightly beyond the bare 오늘 taught in M10; confirm it's not too far
      // ahead for an A2 learner.
      prompt: "'I can't (watch) today.' —",
      correctHangul: "오늘은 못 봐요",
      distractorsHangul: ["오늘은 안 봐요", "오늘은 봐요 못", "오늘은 보고 싶어요"],
      explanation: "Prevented today → 못 봐요.",
      exercisedAtomSurfaces: ["못", "봐요"],
    }),
    translateStep({
      id: "ko-m11-7-tr-wanttowatch",
      promptEn: "I want to watch a movie.",
      acceptedAnswers: ["영화를 보고 싶어요", "영화를 보고 싶어요.", "영화 보고 싶어요", "영화 보고 싶어요."],
      audioText: "영화를 보고 싶어요",
      exercisedAtomSurfaces: ["영화"],
    }),
    listeningCompSentence({
      id: "ko-m11-7-lc-dontdrink",
      audioText: "커피 안 마셔요",
      correctMeaningEn: "I don't drink coffee",
      distractorsEn: ["I can't drink coffee", "I drink coffee", "I want to drink coffee"],
      exercisedAtomSurfaces: ["커피", "안", "마셔요"],
    }),
    speaking("ko-m11-7-speak-canttoday", "오늘은 못 봐요", "I can't (watch) today", ["못", "봐요"]),
  ],
};

// ─── ko-m11-8 — Mastery test ────────────────────────────────────────────────

const M11_8: LessonContent = {
  id: "ko-m11-8",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M11 Mastery Test",
  description: "안, 못, the 하다 split, and 고 싶어요.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "ko-m11-8-q-dontgo",
      prompt: "'I don't go.' —",
      correctHangul: "안 가요",
      distractorsHangul: ["못 가요", "가요 안", "안 갔어요"],
      exercisedAtomSurfaces: ["안", "가요"],
    }),
    sentenceMcq({
      id: "ko-m11-8-q-dontstudy",
      prompt: "'I don't study.' —",
      correctHangul: "공부 안 해요",
      distractorsHangul: ["안 공부해요", "공부해요 안", "공부 못 해요"],
      exercisedAtomSurfaces: ["공부", "안", "해요"],
    }),
    sentenceMcq({
      id: "ko-m11-8-q-cantgo",
      prompt: "'I can't go.' —",
      correctHangul: "못 가요",
      distractorsHangul: ["안 가요", "가요 못", "못 갔어요"],
      exercisedAtomSurfaces: ["못", "가요"],
    }),
    cloze(
      "ko-m11-8-cloze-didntstudy",
      "어제 공부",
      "했어요",
      "안",
      ["안", "못", "도", "를"],
      "Yesterday I didn't study.",
      "어제 공부 안 했어요",
      "하다 verb → 공부 안 했어요.",
    ),
    sentenceMcq({
      id: "ko-m11-8-q-wanttoeat",
      prompt: "'I want to eat rice.' —",
      correctHangul: "밥을 먹고 싶어요",
      distractorsHangul: ["밥을 먹어 싶어요", "밥을 먹고 싶다요", "밥을 먹고 싶어요는"],
      exercisedAtomSurfaces: ["밥", "먹고 싶어요"],
    }),
    listeningCompSentence({
      id: "ko-m11-8-lc-cant",
      audioText: "못 먹어요",
      correctMeaningEn: "I can't eat (it)",
      distractorsEn: ["I don't eat (it)", "I want to eat", "I ate (it)"],
      exercisedAtomSurfaces: ["못", "먹어요"],
    }),
    speaking("ko-m11-8-speak-recap", "밥을 먹고 싶어요", "I want to eat rice", ["밥", "먹고 싶어요"]),
  ],
};

export const KO_M11_LESSONS: LessonContent[] = withReviewInterleave("m11", [
  M11_1,
  M11_2,
  M11_3,
  M11_4,
  M11_5,
  M11_6,
  M11_7,
  M11_8,
]);
