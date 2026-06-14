/**
 * Korean Module 7 — Verbs & the 해요 present.
 *
 * M3-M6 gave the learner the copula, possession, numbers/counters, and
 * existence. M7 introduces the engine of Korean sentences: action verbs in
 * the polite 해요-style present tense plus the object particle 을/를. After
 * this module the learner can say "I eat rice", "I drink coffee", "I watch
 * a movie".
 *
 * Grammar spine mirrors the JA M7 arc (dictionary verbs + ます polite + を),
 * re-expressed in Korean's own grammar:
 *
 *   ko-m7-1  Action verbs — dictionary forms (가다 / 오다 / 먹다 …)
 *   ko-m7-2  The 해요 present — 가요 / 와요 / 먹어요 (아요 vs 어요 split)
 *   ko-m7-3  하다 verbs — 해요 / 공부해요
 *   ko-m7-4  Object nouns — 밥 / 커피 / 영화
 *   ko-m7-5  을 / 를 — the object particle
 *   ko-m7-6  Putting it together — OBJECT + 을/를 + VERB
 *   ko-m7-7  Mini-dialogue — what are you doing?
 *   ko-m7-8  M7 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - 해요-present doubles as the future ("I eat" / "I'll eat").
 *   - 해요 conjugation depends on the stem's final vowel:
 *       ㅏ/ㅗ → 아요 (가다→가요, 보다→봐요),
 *       other → 어요 (먹다→먹어요, 마시다→마셔요),
 *       하다  → 해요.
 *   - Object particle: 을 after a consonant, 를 after a vowel (M3 particles).
 *
 * Authoring follows the JA M3+ rubric (docs/lesson-authoring-guide.md §13):
 * teach steps never carry SRS weight; only graded factories do. Atoms live
 * in courseAtoms.ts (M7_VOCAB).
 *
 * NATIVE-REVIEW flags are inline at the relevant steps. See WORKTREE_REPORT.md
 * for the consolidated list.
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
  vocabMcq,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

// Verified Noto-emoji art for the object-noun image MCQs.
const MCQ_POOL = [
  { surface: "밥", emoji: "🍚" },
  { surface: "커피", emoji: "☕" },
  { surface: "영화", emoji: "🎬" },
  { surface: "공부", emoji: "📚" },
  { surface: "물", emoji: "💧" },
  { surface: "빵", emoji: "🍞" },
];

// ─── ko-m7-1 — Action verbs (dictionary forms) ──────────────────────────────

const M7_1: LessonContent = {
  id: "ko-m7-1",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Action verbs — 가다, 먹다, 보다",
  description: "Meet your first Korean verbs in their dictionary (base) form.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "ko-m7-1-info",
      "Verbs end in 다",
      "Every Korean verb's dictionary form ends in 다. 가다 (to go), 오다 (to come), 먹다 (to eat), 마시다 (to drink), 보다 (to see/watch), 하다 (to do). You'll never SAY the 다 form by itself — it's the entry you'd find in a dictionary. Next lesson you'll make it polite.",
      "grammar",
    ),
    phrase("ko-m7-1-p-go", "to go", "gada", "가다"),
    phrase("ko-m7-1-p-come", "to come", "oda", "오다"),
    phrase("ko-m7-1-p-eat", "to eat", "meokda", "먹다"),
    phrase("ko-m7-1-p-drink", "to drink", "masida", "마시다"),
    phrase("ko-m7-1-p-see", "to see / watch", "boda", "보다"),
    phrase("ko-m7-1-p-do", "to do", "hada", "하다"),
    sentenceMcq({
      id: "ko-m7-1-q-eat",
      prompt: "Which verb means 'to eat'?",
      correctHangul: "먹다",
      distractorsHangul: ["가다", "보다", "마시다"],
      explanation: "먹다 = to eat. 가다 = go, 보다 = see, 마시다 = drink.",
      exercisedAtomSurfaces: ["먹다"],
    }),
    sentenceMcq({
      id: "ko-m7-1-q-go",
      prompt: "Which verb means 'to go'?",
      correctHangul: "가다",
      distractorsHangul: ["오다", "하다", "먹다"],
      explanation: "가다 = go. 오다 = come — easy to mix up, opposite directions.",
      exercisedAtomSurfaces: ["가다"],
    }),
    listeningCompSentence({
      id: "ko-m7-1-lc-drink",
      audioText: "마시다",
      correctMeaningEn: "to drink",
      distractorsEn: ["to eat", "to see", "to come"],
      exercisedAtomSurfaces: ["마시다"],
    }),
  ],
};

// ─── ko-m7-2 — The 해요 present (아요 vs 어요) ───────────────────────────────

const M7_2: LessonContent = {
  id: "ko-m7-2",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "The 해요 present — 가요, 먹어요",
  description: "Make a verb polite: drop 다, add 아요 or 어요.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m7-2-info-1",
      "Drop 다, add 아요 / 어요",
      "To speak politely, drop the 다 and add an ending. If the stem's last vowel is ㅏ or ㅗ, add 아요: 가다 → 가요, 보다 → 봐요. Otherwise add 어요: 먹다 → 먹어요, 마시다 → 마셔요. This polite present also covers the future — 가요 = 'I go' OR 'I'll go'.",
      "grammar",
    ),
    infoStep(
      "ko-m7-2-info-2",
      "Sound-blend shortcuts",
      "Some forms blend: 오다 → 와요 (o + a = wa), 보다 → 봐요, 마시다 → 마셔요 (i + eo = yeo). Learn these as whole words for now — the pattern clicks with practice.",
      "tip",
    ),
    phrase("ko-m7-2-p-go", "go / will go (polite)", "gayo", "가요"),
    phrase("ko-m7-2-p-come", "come / will come (polite)", "wayo", "와요"),
    phrase("ko-m7-2-p-eat", "eat / will eat (polite)", "meogeoyo", "먹어요"),
    phrase("ko-m7-2-p-drink", "drink / will drink (polite)", "masyeoyo", "마셔요"),
    phrase("ko-m7-2-p-see", "see / watch (polite)", "bwayo", "봐요"),
    sentenceMcq({
      id: "ko-m7-2-q-eat",
      prompt: "Make 먹다 polite ('I eat'):",
      correctHangul: "먹어요",
      distractorsHangul: ["먹아요", "먹요", "먹다요"],
      explanation: "먹 has no ㅏ/ㅗ → add 어요. 먹어요.",
      exercisedAtomSurfaces: ["먹어요"],
    }),
    sentenceMcq({
      id: "ko-m7-2-q-go",
      prompt: "Make 가다 polite ('I go'):",
      correctHangul: "가요",
      distractorsHangul: ["가어요", "가아요", "가다요"],
      explanation: "가 ends in ㅏ → 아요, which merges to 가요 (not 가아요).",
      exercisedAtomSurfaces: ["가요"],
    }),
    listeningCompSentence({
      id: "ko-m7-2-lc-come",
      audioText: "와요",
      correctMeaningEn: "(I) come / (I)'ll come",
      distractorsEn: ["(I) go", "(I) eat", "(I) see"],
      exercisedAtomSurfaces: ["와요"],
    }),
    speaking("ko-m7-2-speak-eat", "먹어요", "I eat", ["먹어요"]),
  ],
};

// ─── ko-m7-3 — 하다 verbs ───────────────────────────────────────────────────

const M7_3: LessonContent = {
  id: "ko-m7-3",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "하다 verbs — 해요, 공부해요",
  description: "The most useful verb pattern: noun + 하다 → noun + 해요.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m7-3-info",
      "하다 → 해요",
      "하다 ('to do') becomes 해요. Its real power: stick 하다 onto a noun to make a verb. 공부 (study) + 하다 → 공부하다 → 공부해요 ('I study'). Hundreds of Korean verbs work this way, so 해요 is one of the highest-value forms you'll learn.",
      "grammar",
    ),
    phrase("ko-m7-3-p-do", "do / will do (polite)", "haeyo", "해요"),
    phrase("ko-m7-3-p-study", "study / studying", "gongbu", "공부", undefined, { emoji: "📚" }),
    vocabMcq("ko-m7-3-mcq-study", { surface: "공부", meaningEn: "study", emoji: "📚" }, MCQ_POOL),
    sentenceMcq({
      id: "ko-m7-3-q-study",
      prompt: "How do you say 'I study'?",
      correctHangul: "공부해요",
      distractorsHangul: ["공부하요", "공부어요", "공부다요"],
      explanation: "공부 + 하다 → 공부해요. 하다 always becomes 해요.",
      exercisedAtomSurfaces: ["공부", "해요"],
    }),
    sentenceMcq({
      id: "ko-m7-3-q-do",
      prompt: "Make 하다 polite:",
      correctHangul: "해요",
      distractorsHangul: ["하요", "하아요", "하어요"],
      explanation: "하다 is irregular — it becomes 해요, not 하아요.",
      exercisedAtomSurfaces: ["해요"],
    }),
    listeningCompSentence({
      id: "ko-m7-3-lc-study",
      audioText: "공부해요",
      correctMeaningEn: "(I) study",
      distractorsEn: ["(I) eat", "(I) go", "(I) watch"],
      exercisedAtomSurfaces: ["공부", "해요"],
    }),
    speaking("ko-m7-3-speak-study", "공부해요", "I study", ["공부", "해요"]),
  ],
};

// ─── ko-m7-4 — Object nouns ─────────────────────────────────────────────────

const M7_4: LessonContent = {
  id: "ko-m7-4",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Things to eat, drink & watch",
  description: "The nouns your verbs act on: rice, coffee, a movie.",
  estimatedMinutes: 5,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m7-4-info",
      "Objects of your verbs",
      "밥 (rice / a meal), 커피 (coffee), 영화 (movie). 밥 먹어요 literally is 'eat rice' but is the everyday way to say 'have a meal'. Next you'll mark these as the object with 을/를.",
      "grammar",
    ),
    phrase("ko-m7-4-p-rice", "(cooked) rice / a meal", "bap", "밥", undefined, { emoji: "🍚" }),
    phrase("ko-m7-4-p-coffee", "coffee", "keopi", "커피", undefined, { emoji: "☕" }),
    phrase("ko-m7-4-p-movie", "movie", "yeonghwa", "영화", undefined, { emoji: "🎬" }),
    vocabMcq("ko-m7-4-mcq-rice", { surface: "밥", meaningEn: "rice / a meal", emoji: "🍚" }, MCQ_POOL),
    vocabMcq("ko-m7-4-mcq-movie", { surface: "영화", meaningEn: "movie", emoji: "🎬" }, MCQ_POOL),
    sentenceMcq({
      id: "ko-m7-4-q-coffee",
      prompt: "Which means 'coffee'?",
      correctHangul: "커피",
      distractorsHangul: ["영화", "밥", "공부"],
      explanation: "커피 = coffee.",
      exercisedAtomSurfaces: ["커피"],
    }),
    listeningCompSentence({
      id: "ko-m7-4-lc-movie",
      audioText: "영화 봐요",
      correctMeaningEn: "(I) watch a movie",
      distractorsEn: ["(I) eat rice", "(I) drink coffee", "(I) study"],
      exercisedAtomSurfaces: ["영화", "봐요"],
    }),
  ],
};

// ─── ko-m7-5 — 을 / 를 (object particle) ────────────────────────────────────

const M7_5: LessonContent = {
  id: "ko-m7-5",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "을 / 를 — the object marker",
  description: "Mark WHAT the verb acts on: 을 after a consonant, 를 after a vowel.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m7-5-info",
      "을 (after consonant) / 를 (after vowel)",
      "Mark the object of a verb with 을 or 를. Use 을 after a consonant: 밥을 먹어요 ('I eat rice', 밥 ends in ㅂ). Use 를 after a vowel: 커피를 마셔요 ('I drink coffee', 커피 ends in 이). In casual speech Koreans often drop it — but learn to use it.",
      "grammar",
    ),
    cloze(
      "ko-m7-5-cloze-consonant",
      "밥",
      "먹어요",
      "을",
      ["을", "를", "이", "에"],
      "I eat rice.",
      "밥을 먹어요",
      "밥 ends in a consonant → object particle 을.",
    ),
    cloze(
      "ko-m7-5-cloze-vowel",
      "커피",
      "마셔요",
      "를",
      ["를", "을", "가", "에"],
      "I drink coffee.",
      "커피를 마셔요",
      "커피 ends in a vowel → object particle 를.",
    ),
    sentenceMcq({
      id: "ko-m7-5-q-movie",
      prompt: "영화 ends in a vowel. 'I watch a movie.' —",
      correctHangul: "영화를 봐요",
      distractorsHangul: ["영화을 봐요", "영화가 봐요", "영화에 봐요"],
      explanation: "영화 (vowel) → 를; it's the object of 봐요.",
      exercisedAtomSurfaces: ["영화", "봐요"],
    }),
    listeningCompSentence({
      id: "ko-m7-5-lc-eat",
      audioText: "밥을 먹어요",
      correctMeaningEn: "I eat rice",
      distractorsEn: ["I drink coffee", "I watch a movie", "I go home"],
      exercisedAtomSurfaces: ["밥", "먹어요"],
    }),
    speaking("ko-m7-5-speak-coffee", "커피를 마셔요", "I drink coffee", ["커피", "마셔요"]),
  ],
};

// ─── ko-m7-6 — Putting it together ──────────────────────────────────────────

const M7_6: LessonContent = {
  id: "ko-m7-6",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Building full sentences",
  description: "OBJECT + 을/를 + VERB — the core Korean sentence.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m7-6-info",
      "Korean word order: object before verb",
      "The verb comes LAST in Korean. 저는 밥을 먹어요 = 'I eat rice' (literally: I / rice / eat). Topic (저는) → object (밥을) → verb (먹어요). The verb anchoring the end is the rhythm of every Korean sentence.",
      "grammar",
    ),
    build(
      "ko-m7-6-build-eatrice",
      "Build: 'I eat rice.' (I + rice + eat)",
      "저는 밥을 먹어요",
      ["저는", "밥을", "먹어요", "커피를", "봐요"],
      ["저는", "밥을", "먹어요"],
      ["밥", "먹어요"],
    ),
    build(
      "ko-m7-6-build-watchmovie",
      "Build: 'I watch a movie.' (movie + watch)",
      "영화를 봐요",
      ["영화를", "봐요", "밥을", "마셔요"],
      ["영화를", "봐요"],
      ["영화", "봐요"],
    ),
    sentenceMcq({
      id: "ko-m7-6-q-drinkcoffee",
      prompt: "'I drink coffee.' —",
      correctHangul: "커피를 마셔요",
      distractorsHangul: ["커피를 먹어요", "커피을 마셔요", "커피를 봐요"],
      explanation: "Drink → 마셔요; 커피 (vowel) → 를.",
      exercisedAtomSurfaces: ["커피", "마셔요"],
    }),
    translateStep({
      id: "ko-m7-6-tr-eatrice",
      promptEn: "I eat rice.",
      acceptedAnswers: ["밥을 먹어요", "밥을 먹어요.", "저는 밥을 먹어요", "저는 밥을 먹어요."],
      audioText: "밥을 먹어요",
      exercisedAtomSurfaces: ["밥", "먹어요"],
    }),
    speaking("ko-m7-6-speak-eatrice", "밥을 먹어요", "I eat rice", ["밥", "먹어요"]),
  ],
};

// ─── ko-m7-7 — Mini-dialogue ────────────────────────────────────────────────

const M7_7: LessonContent = {
  id: "ko-m7-7",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — what are you doing?",
  description: "Ask and answer about everyday actions.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m7-7-info",
      "Talking about your day",
      "A: 뭐 해요? (What are you doing?)\nB: 영화를 봐요. (I'm watching a movie.)\nA: 저는 공부해요. (I'm studying.)\n뭐 해요? is one of the most common questions in spoken Korean — you can answer it now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m7-7-q-whatdoing",
      // NATIVE-REVIEW: 뭐 해요? (object particle 를 dropped) is the natural
      // spoken form; a textbook might prefer 뭐를 해요? / 무엇을 해요?.
      prompt: "How do you ask 'What are you doing?'",
      correctHangul: "뭐 해요?",
      distractorsHangul: ["뭐예요?", "어디예요?", "누구예요?"],
      explanation: "뭐 (what) + 해요 (do) = 'What are you doing?'. 뭐예요? = 'What is it?'.",
      exercisedAtomSurfaces: ["뭐", "해요"],
    }),
    build(
      "ko-m7-7-build-watchmovie",
      "Answer: 'I'm watching a movie.' (movie + watch)",
      "영화를 봐요",
      ["영화를", "봐요", "공부해요", "밥을"],
      ["영화를", "봐요"],
      ["영화", "봐요"],
    ),
    translateStep({
      id: "ko-m7-7-tr-study",
      promptEn: "I'm studying.",
      acceptedAnswers: ["공부해요", "공부해요.", "저는 공부해요", "저는 공부해요."],
      audioText: "공부해요",
      exercisedAtomSurfaces: ["공부", "해요"],
    }),
    listeningCompSentence({
      id: "ko-m7-7-lc-drinkcoffee",
      audioText: "커피를 마셔요",
      correctMeaningEn: "I'm drinking coffee",
      distractorsEn: ["I'm eating rice", "I'm watching a movie", "I'm studying"],
      exercisedAtomSurfaces: ["커피", "마셔요"],
    }),
    speaking("ko-m7-7-speak-whatdoing", "뭐 해요?", "What are you doing?", ["뭐", "해요"]),
  ],
};

// ─── ko-m7-8 — Mastery test ─────────────────────────────────────────────────

const M7_8: LessonContent = {
  id: "ko-m7-8",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M7 Mastery Test",
  description: "Verbs, the 해요 present, and the 을/를 object marker.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "ko-m7-8-q-eatpolite",
      prompt: "Make 먹다 polite ('I eat'):",
      correctHangul: "먹어요",
      distractorsHangul: ["먹아요", "먹다요", "먹요"],
      exercisedAtomSurfaces: ["먹어요"],
    }),
    sentenceMcq({
      id: "ko-m7-8-q-study",
      prompt: "'I study.' —",
      correctHangul: "공부해요",
      distractorsHangul: ["공부하요", "공부어요", "공부다요"],
      exercisedAtomSurfaces: ["공부", "해요"],
    }),
    cloze(
      "ko-m7-8-cloze-object",
      "밥",
      "먹어요",
      "을",
      ["을", "를", "이", "에"],
      "I eat rice.",
      "밥을 먹어요",
      "밥 ends in a consonant → object particle 을.",
    ),
    sentenceMcq({
      id: "ko-m7-8-q-drinkcoffee",
      prompt: "'I drink coffee.' —",
      correctHangul: "커피를 마셔요",
      distractorsHangul: ["커피을 마셔요", "커피를 먹어요", "커피가 마셔요"],
      exercisedAtomSurfaces: ["커피", "마셔요"],
    }),
    sentenceMcq({
      id: "ko-m7-8-q-whatdoing",
      prompt: "'What are you doing?' —",
      correctHangul: "뭐 해요?",
      distractorsHangul: ["뭐예요?", "어디에 있어요?", "누구예요?"],
      exercisedAtomSurfaces: ["뭐", "해요"],
    }),
    listeningCompSentence({
      id: "ko-m7-8-lc-watchmovie",
      audioText: "영화를 봐요",
      correctMeaningEn: "I watch a movie",
      distractorsEn: ["I eat rice", "I drink coffee", "I study"],
      exercisedAtomSurfaces: ["영화", "봐요"],
    }),
    speaking("ko-m7-8-speak-recap", "밥을 먹어요", "I eat rice", ["밥", "먹어요"]),
  ],
};

export const KO_M7_LESSONS: LessonContent[] = [
  M7_1,
  M7_2,
  M7_3,
  M7_4,
  M7_5,
  M7_6,
  M7_7,
  M7_8,
];
