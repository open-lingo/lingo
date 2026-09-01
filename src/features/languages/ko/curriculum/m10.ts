/**
 * Korean Module 10 — The past tense.
 *
 * M7-M9 worked entirely in the present. M10 unlocks the past: the polite
 * past of action verbs (갔어요, 먹었어요), of descriptive verbs (좋았어요),
 * and the past copula (학생이었어요 'was a student'). With time adverbs
 * (어제 'yesterday', 오늘 'today') the learner can now narrate.
 *
 * Grammar spine mirrors the JA M10 arc (ました polite past + でした copula
 * past), re-expressed in Korean's own grammar:
 *
 *   ko-m10-1  어제 / 오늘 — anchoring time
 *   ko-m10-2  Past tense — drop 다, add 았어요 / 었어요
 *   ko-m10-3  Irregular blends — 갔어요 / 왔어요 / 했어요
 *   ko-m10-4  Adjectives in the past — 좋았어요 / 맛있었어요
 *   ko-m10-5  Past copula — 였어요 / 이었어요 (was)
 *   ko-m10-6  Narrating a day
 *   ko-m10-7  Mini-dialogue — how was it?
 *   ko-m10-8  M10 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - Past stem mirrors the 해요 vowel choice: ㅏ/ㅗ → 았어요, other → 었어요,
 *     하다 → 했어요.
 *   - Same sound blends as the present: 가다 → 갔어요, 오다 → 왔어요,
 *     마시다 → 마셨어요, 보다 → 봤어요.
 *   - Copula past: 였어요 (after a vowel), 이었어요 (after a consonant).
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

// ─── ko-m10-1 — Time adverbs ────────────────────────────────────────────────

const M10_1: LessonContent = {
  id: "ko-m10-1",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "어제 / 오늘 — yesterday & today",
  description: "Set the time frame before you change the verb.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "ko-m10-1-info",
      "When did it happen?",
      "어제 = 'yesterday', 오늘 = 'today'. These time words usually sit near the start of the sentence: 어제 영화를 봤어요 = 'Yesterday I watched a movie'. Next you'll learn how to put the verb itself into the past.",
      "grammar",
    ),
    phrase("ko-m10-1-p-yesterday", "yesterday", "eoje", "어제"),
    phrase("ko-m10-1-p-today", "today", "oneul", "오늘"),
    sentenceMcq({
      id: "ko-m10-1-q-yesterday",
      prompt: "Which means 'yesterday'?",
      correctHangul: "어제",
      distractorsHangul: ["오늘", "지금", "여기"],
      explanation: "어제 = yesterday, 오늘 = today.",
      exercisedAtomSurfaces: ["어제"],
    }),
    sentenceMcq({
      id: "ko-m10-1-q-today",
      prompt: "Which means 'today'?",
      correctHangul: "오늘",
      distractorsHangul: ["어제", "어디", "친구"],
      explanation: "오늘 = today.",
      exercisedAtomSurfaces: ["오늘"],
    }),
    listeningCompSentence({
      id: "ko-m10-1-lc-yesterday",
      audioText: "어제",
      correctMeaningEn: "yesterday",
      distractorsEn: ["today", "now", "here"],
      exercisedAtomSurfaces: ["어제"],
    }),
  ],
};

// ─── ko-m10-2 — Past tense formation ────────────────────────────────────────

const M10_2: LessonContent = {
  id: "ko-m10-2",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Past tense — 먹었어요",
  description: "Drop 다, add 았어요 or 었어요.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m10-2-info",
      "았어요 / 었어요 — same vowel rule",
      "The past works just like the present, but the ending is longer. ㅏ/ㅗ stems take 았어요: 작다 → 작았어요. Other stems take 었어요: 먹다 → 먹었어요, 마시다 → 마셨어요. Think of it as the 해요 form with 았/었 worked into the middle.",
      "grammar",
    ),
    phrase("ko-m10-2-p-ate", "ate (polite past)", "meogeosseoyo", "먹었어요"),
    phrase("ko-m10-2-p-drank", "drank (polite past)", "masyeosseoyo", "마셨어요"),
    sentenceMcq({
      id: "ko-m10-2-q-ate",
      prompt: "Put 먹다 in the past ('I ate'):",
      correctHangul: "먹었어요",
      distractorsHangul: ["먹았어요", "먹어요", "먹었다요"],
      explanation: "먹 has no ㅏ/ㅗ → 었어요. 먹었어요.",
      exercisedAtomSurfaces: ["먹었어요"],
    }),
    cloze(
      "ko-m10-2-cloze-ate",
      "어제 밥",
      "먹었어요",
      "을",
      ["을", "를", "이", "도"],
      "Yesterday I ate rice.",
      "어제 밥을 먹었어요",
      "밥 (consonant) → object 을; the verb is past 먹었어요.",
    ),
    sentenceMcq({
      id: "ko-m10-2-q-drank",
      prompt: "'I drank coffee.' —",
      correctHangul: "커피를 마셨어요",
      distractorsHangul: ["커피를 마셔요", "커피를 마시었어요", "커피을 마셨어요"],
      explanation: "마시다 → 마셨어요 (past); 커피 (vowel) → 를.",
      exercisedAtomSurfaces: ["커피", "마셨어요"],
    }),
    listeningCompSentence({
      id: "ko-m10-2-lc-ate",
      audioText: "밥을 먹었어요",
      correctMeaningEn: "I ate rice",
      distractorsEn: ["I eat rice", "I drank coffee", "I'll eat rice"],
      exercisedAtomSurfaces: ["밥", "먹었어요"],
    }),
    speaking("ko-m10-2-speak-ate", "밥을 먹었어요", "I ate rice", ["밥", "먹었어요"]),
  ],
};

// ─── ko-m10-3 — Irregular blends ────────────────────────────────────────────

const M10_3: LessonContent = {
  id: "ko-m10-3",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "갔어요 / 왔어요 / 했어요",
  description: "The same blends you saw in the present, now in the past.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m10-3-info",
      "Blended past forms",
      "Just like 가요/와요/해요 blended in the present, the past blends too: 가다 → 갔어요 (went), 오다 → 왔어요 (came), 보다 → 봤어요 (saw), 하다 → 했어요 (did). 공부하다 → 공부했어요 (studied). Learn them as whole words.",
      "grammar",
    ),
    phrase("ko-m10-3-p-went", "went (polite past)", "gasseoyo", "갔어요"),
    phrase("ko-m10-3-p-came", "came (polite past)", "wasseoyo", "왔어요"),
    phrase("ko-m10-3-p-saw", "saw / watched (polite past)", "bwasseoyo", "봤어요"),
    phrase("ko-m10-3-p-did", "did (polite past)", "haesseoyo", "했어요"),
    sentenceMcq({
      id: "ko-m10-3-q-went",
      prompt: "Put 가다 in the past ('I went'):",
      correctHangul: "갔어요",
      distractorsHangul: ["가았어요", "갔다요", "가어요"],
      explanation: "가다 → 갔어요 (blended).",
      exercisedAtomSurfaces: ["갔어요"],
    }),
    sentenceMcq({
      id: "ko-m10-3-q-studied",
      prompt: "'I studied.' —",
      correctHangul: "공부했어요",
      distractorsHangul: ["공부핬어요", "공부하었어요", "공부했다요"],
      explanation: "하다 → 했어요, so 공부 + 했어요 = 공부했어요.",
      exercisedAtomSurfaces: ["공부", "했어요"],
    }),
    cloze(
      "ko-m10-3-cloze-sawmovie",
      "어제 영화",
      "봤어요",
      "를",
      ["를", "을", "가", "도"],
      "Yesterday I watched a movie.",
      "어제 영화를 봤어요",
      "영화 (vowel) → object 를; 보다 → 봤어요.",
    ),
    listeningCompSentence({
      id: "ko-m10-3-lc-went",
      audioText: "학교에 갔어요",
      correctMeaningEn: "I went to school",
      distractorsEn: ["I'm at school", "I go to school", "I came from school"],
      exercisedAtomSurfaces: ["학교", "갔어요"],
    }),
    speaking("ko-m10-3-speak-studied", "공부했어요", "I studied", ["공부", "했어요"]),
  ],
};

// ─── ko-m10-4 — Adjectives in the past ──────────────────────────────────────

const M10_4: LessonContent = {
  id: "ko-m10-4",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "좋았어요 / 맛있었어요",
  description: "Descriptive verbs take the past too.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m10-4-info",
      "Adjectives have a past tense",
      "Because Korean adjectives are verbs, they take the same past ending. 좋다 → 좋았어요 ('was good' — ㅗ stem → 았). 맛있다 → 맛있었어요 ('was delicious'). 영화가 좋았어요 = 'the movie was good'.",
      "grammar",
    ),
    phrase("ko-m10-4-p-wasgood", "was good", "joasseoyo", "좋았어요"),
    phrase("ko-m10-4-p-wasdelicious", "was delicious", "masisseosseoyo", "맛있었어요"),
    sentenceMcq({
      id: "ko-m10-4-q-wasgood",
      prompt: "'The movie was good.' —",
      correctHangul: "영화가 좋았어요",
      distractorsHangul: ["영화가 좋았다요", "영화를 좋았어요", "영화가 좋어요"],
      explanation: "좋다 → 좋았어요; 영화 (vowel) → subject 가.",
      exercisedAtomSurfaces: ["영화", "좋았어요"],
    }),
    cloze(
      "ko-m10-4-cloze-wasdelicious",
      "밥이",
      "",
      "맛있었어요",
      ["맛있었어요", "맛있어요", "맛있었다", "맛있았어요"],
      "The rice was delicious.",
      "밥이 맛있었어요",
      "맛있다 → 맛있었어요 (past).",
    ),
    sentenceMcq({
      id: "ko-m10-4-q-coffeegood",
      prompt: "'The coffee was good.' —",
      correctHangul: "커피가 좋았어요",
      distractorsHangul: ["커피가 좋아요", "커피를 좋았어요", "커피가 좋았다요"],
      explanation: "좋다 → 좋았어요; 커피 (vowel) → 가.",
      exercisedAtomSurfaces: ["커피", "좋았어요"],
    }),
    listeningCompSentence({
      id: "ko-m10-4-lc-wasdelicious",
      audioText: "맛있었어요",
      correctMeaningEn: "It was delicious",
      distractorsEn: ["It's delicious", "It was expensive", "It was good"],
      exercisedAtomSurfaces: ["맛있었어요"],
    }),
    speaking("ko-m10-4-speak-wasgood", "영화가 좋았어요", "The movie was good", ["영화", "좋았어요"]),
  ],
};

// ─── ko-m10-5 — Past copula ─────────────────────────────────────────────────

const M10_5: LessonContent = {
  id: "ko-m10-5",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "였어요 / 이었어요 — was",
  description: "The past of 이에요/예요: 'I was a student'.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m10-5-info",
      "The 'was' copula",
      "The past of the copula 이에요/예요 is 였어요 (after a vowel) / 이었어요 (after a consonant). 친구였어요 = 'was a friend' (친구 ends in a vowel). 학생이었어요 = 'was a student' (학생 ends in a consonant). Just like the present split, only the vowel/consonant of the noun matters.",
      "grammar",
    ),
    phrase("ko-m10-5-p-wasfriend", "was a friend", "chinguyeosseoyo", "친구였어요"),
    phrase("ko-m10-5-p-wasstudent", "was a student", "haksaengieosseoyo", "학생이었어요"),
    cloze(
      "ko-m10-5-cloze-wasstudent",
      "저는 학생",
      "",
      "이었어요",
      ["이었어요", "였어요", "이에요", "예요"],
      "I was a student.",
      "저는 학생이었어요",
      "학생 ends in a consonant → 이었어요.",
    ),
    sentenceMcq({
      id: "ko-m10-5-q-wasfriend",
      prompt: "친구 ends in a vowel. 'It was a friend.' —",
      correctHangul: "친구였어요",
      distractorsHangul: ["친구이었어요", "친구예요", "친구였다요"],
      explanation: "친구 (vowel) → 였어요.",
      exercisedAtomSurfaces: ["친구"],
    }),
    sentenceMcq({
      id: "ko-m10-5-q-wasteacher",
      prompt: "선생님 ends in a consonant. 'I was a teacher.' —",
      correctHangul: "저는 선생님이었어요",
      distractorsHangul: ["저는 선생님였어요", "저는 선생님이에요", "저는 선생님이었다요"],
      explanation: "선생님 (consonant) → 이었어요.",
      exercisedAtomSurfaces: ["선생님"],
    }),
    listeningCompSentence({
      id: "ko-m10-5-lc-wasstudent",
      audioText: "학생이었어요",
      correctMeaningEn: "(I) was a student",
      distractorsEn: ["(I) am a student", "(I) was a teacher", "(I) was a friend"],
      exercisedAtomSurfaces: ["학생"],
    }),
    speaking("ko-m10-5-speak-wasstudent", "학생이었어요", "I was a student", ["학생"]),
  ],
};

// ─── ko-m10-6 — Narrating a day ─────────────────────────────────────────────

const M10_6: LessonContent = {
  id: "ko-m10-6",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Narrating a day",
  description: "Chain past-tense sentences with time words.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m10-6-info",
      "Telling what happened",
      "Lead with the time, then the action: 어제 친구하고 영화를 봤어요 = 'Yesterday I watched a movie with a friend'. 오늘 밥을 먹었어요 = 'Today I ate'. Stack the grammar you already know on top of the past tense.",
      "grammar",
    ),
    build(
      "ko-m10-6-build-yesterdaymovie",
      "Build: 'Yesterday I watched a movie.' (yesterday + movie + watched)",
      "어제 영화를 봤어요",
      ["어제", "영화를", "봤어요", "봐요"],
      ["어제", "영화를", "봤어요"],
      ["영화", "봤어요"],
    ),
    sentenceMcq({
      id: "ko-m10-6-q-todayate",
      prompt: "'Today I ate rice.' —",
      correctHangul: "오늘 밥을 먹었어요",
      distractorsHangul: ["오늘 밥을 먹어요", "어제 밥을 먹었어요", "오늘 밥을 먹었다요"],
      explanation: "오늘 (today) + past 먹었어요.",
      exercisedAtomSurfaces: ["밥", "먹었어요"],
    }),
    translateStep({
      id: "ko-m10-6-tr-wentschool",
      promptEn: "Yesterday I went to school.",
      acceptedAnswers: ["어제 학교에 갔어요", "어제 학교에 갔어요."],
      audioText: "어제 학교에 갔어요",
      exercisedAtomSurfaces: ["학교", "갔어요"],
    }),
    listeningCompSentence({
      id: "ko-m10-6-lc-watchedfriend",
      audioText: "어제 친구하고 영화를 봤어요",
      correctMeaningEn: "Yesterday I watched a movie with a friend",
      distractorsEn: ["Today I watch a movie with a friend", "Yesterday I ate with a friend", "Yesterday a friend watched a movie"],
      exercisedAtomSurfaces: ["친구", "하고", "영화", "봤어요"],
    }),
    speaking("ko-m10-6-speak-yesterdaymovie", "어제 영화를 봤어요", "Yesterday I watched a movie", ["영화", "봤어요"]),
  ],
};

// ─── ko-m10-7 — Mini-dialogue ───────────────────────────────────────────────

const M10_7: LessonContent = {
  id: "ko-m10-7",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — how was it?",
  description: "Ask about the past and react.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m10-7-info",
      "Asking how it went",
      "A: 어제 뭐 했어요? (What did you do yesterday?)\nB: 영화를 봤어요. 좋았어요. (I watched a movie. It was good.)\nA: 저는 친구하고 밥을 먹었어요. (I ate with a friend.)\n뭐 했어요? is the past of 뭐 해요? you learned in M7.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m10-7-q-whatdid",
      // NATIVE-REVIEW: 뭐 했어요? with the object particle dropped is the
      // natural spoken form (parallels 뭐 해요? in M7); a textbook might use
      // 뭐를 했어요? / 무엇을 했어요?.
      prompt: "'What did you do yesterday?' —",
      correctHangul: "어제 뭐 했어요?",
      distractorsHangul: ["어제 뭐 해요?", "오늘 뭐 했어요?", "어제 뭐예요?"],
      explanation: "어제 (yesterday) + 뭐 했어요? (what did you do).",
      exercisedAtomSurfaces: ["어제", "뭐", "했어요"],
    }),
    build(
      "ko-m10-7-build-sawgood",
      "Build: 'I watched a movie. It was good.' (movie + watched + was-good)",
      "영화를 봤어요 좋았어요",
      ["영화를", "봤어요", "좋았어요", "봐요"],
      ["영화를", "봤어요", "좋았어요"],
      ["영화", "봤어요", "좋았어요"],
    ),
    translateStep({
      id: "ko-m10-7-tr-atewithfriend",
      promptEn: "I ate with a friend.",
      acceptedAnswers: ["친구하고 밥을 먹었어요", "친구하고 밥을 먹었어요."],
      audioText: "친구하고 밥을 먹었어요",
      exercisedAtomSurfaces: ["친구", "하고", "밥", "먹었어요"],
    }),
    listeningCompSentence({
      id: "ko-m10-7-lc-wasgood",
      audioText: "영화가 좋았어요",
      correctMeaningEn: "The movie was good",
      distractorsEn: ["The movie is good", "The movie was expensive", "I watched a movie"],
      exercisedAtomSurfaces: ["영화", "좋았어요"],
    }),
    speaking("ko-m10-7-speak-whatdid", "어제 뭐 했어요?", "What did you do yesterday?", ["어제", "뭐", "했어요"]),
  ],
};

// ─── ko-m10-8 — Mastery test ────────────────────────────────────────────────

const M10_8: LessonContent = {
  id: "ko-m10-8",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M10 Mastery Test",
  description: "Past tense for verbs, adjectives, and the copula.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "ko-m10-8-q-ate",
      prompt: "Put 먹다 in the past ('I ate'):",
      correctHangul: "먹었어요",
      distractorsHangul: ["먹았어요", "먹어요", "먹었다요"],
      exercisedAtomSurfaces: ["먹었어요"],
    }),
    sentenceMcq({
      id: "ko-m10-8-q-went",
      prompt: "'I went to school.' —",
      correctHangul: "학교에 갔어요",
      distractorsHangul: ["학교에 가요", "학교에서 갔어요", "학교를 갔어요"],
      exercisedAtomSurfaces: ["학교", "갔어요"],
    }),
    cloze(
      "ko-m10-8-cloze-wasdelicious",
      "밥이",
      "",
      "맛있었어요",
      ["맛있었어요", "맛있어요", "맛있았어요", "맛있었다"],
      "The rice was delicious.",
      "밥이 맛있었어요",
      "맛있다 → 맛있었어요.",
    ),
    sentenceMcq({
      id: "ko-m10-8-q-wasstudent",
      prompt: "'I was a student.' —",
      correctHangul: "저는 학생이었어요",
      distractorsHangul: ["저는 학생였어요", "저는 학생이에요", "저는 학생이었다요"],
      exercisedAtomSurfaces: ["학생"],
    }),
    sentenceMcq({
      id: "ko-m10-8-q-studied",
      prompt: "'Yesterday I studied.' —",
      correctHangul: "어제 공부했어요",
      distractorsHangul: ["어제 공부해요", "오늘 공부했어요", "어제 공부했다요"],
      exercisedAtomSurfaces: ["어제", "공부", "했어요"],
    }),
    listeningCompSentence({
      id: "ko-m10-8-lc-watchedmovie",
      audioText: "어제 영화를 봤어요",
      correctMeaningEn: "Yesterday I watched a movie",
      distractorsEn: ["Today I watch a movie", "Yesterday I ate", "I'll watch a movie"],
      exercisedAtomSurfaces: ["영화", "봤어요"],
    }),
    speaking("ko-m10-8-speak-recap", "어제 영화를 봤어요", "Yesterday I watched a movie", ["영화", "봤어요"]),
  ],
};

export const KO_M10_LESSONS: LessonContent[] = withReviewInterleave("m10", [
  M10_1,
  M10_2,
  M10_3,
  M10_4,
  M10_5,
  M10_6,
  M10_7,
  M10_8,
]);
