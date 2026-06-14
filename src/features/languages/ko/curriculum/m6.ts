/**
 * Korean Module 6 — Places & existence.
 *
 * M6 gives the learner place vocabulary plus the existence verbs 있어요
 * ("there is / I have") and 없어요 ("there isn't / I don't have"), the
 * location particles 에 (static location of existence) vs 에서 (location of
 * an action), subject marking with 이/가, and 어디 ("where").
 *
 * Grammar spine mirrors the JA M6 arc (に / で / が + あります/います) — but
 * a deliberate simplification falls out of Korean grammar: Korean uses ONE
 * existence verb 있다 for both living and non-living things, so there is no
 * あります/います split to teach. That contrast becomes the 에 (location of
 * existence) vs 에서 (location of action) contrast instead.
 *
 *   ko-m6-1  Places — 집 / 학교 / 가게 / 식당 / 역
 *   ko-m6-2  있어요 / 없어요 — there is / there isn't
 *   ko-m6-3  에 — "at / in" (location of existence)
 *   ko-m6-4  에서 — "at" (location of an action)  [에 vs 에서 contrast]
 *   ko-m6-5  이/가 + 있어요 — marking the subject of existence
 *   ko-m6-6  어디에 있어요? — asking where something is
 *   ko-m6-7  Mini-dialogue — finding your way around
 *   ko-m6-8  M6 Mastery Test
 *
 * Authoring follows the JA M3+ rubric (docs/lesson-authoring-guide.md §13).
 * Place + existence atoms live in courseAtoms.ts (M6_VOCAB); 에 / 에서 are
 * already registered as M3 particles.
 *
 * CONTENT-TODO: native-speaker review of (1) the 에 vs 에서 introduction
 * order — beginners conflate them — and (2) the naturalness of the
 * wayfinding mini-dialogue.
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

// Shared distractor pool for vocab-image MCQs. Every surface has verified
// Noto-emoji art in the bundled subset (checked at authoring time).
const MCQ_POOL = [
  { surface: "집", emoji: "🏠" },
  { surface: "학교", emoji: "🏫" },
  { surface: "가게", emoji: "🏪" },
  { surface: "식당", emoji: "🍜" },
  { surface: "역", emoji: "🚉" },
  { surface: "병원", emoji: "🏥" },
];

// ─── ko-m6-1 — Places ───────────────────────────────────────────────────────

const M6_1: LessonContent = {
  id: "ko-m6-1",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Places — 집, 학교, 가게",
  description: "Name the places you go: home, school, store, restaurant, station.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "ko-m6-1-info",
      "Places you go",
      "These are the everyday destinations. 집 (home), 학교 (school), 가게 (store), 식당 (restaurant), 역 (station). Soon you'll say where you are and where things are using them.",
      "grammar",
    ),
    phrase("ko-m6-1-p-home", "house / home", "jip", "집", undefined, { emoji: "🏠" }),
    phrase("ko-m6-1-p-school", "school", "hakgyo", "학교", undefined, { emoji: "🏫" }),
    phrase("ko-m6-1-p-store", "store / shop", "gage", "가게", undefined, { emoji: "🏪" }),
    phrase("ko-m6-1-p-restaurant", "restaurant", "sikdang", "식당", undefined, { emoji: "🍜" }),
    phrase("ko-m6-1-p-station", "(train) station", "yeok", "역", undefined, { emoji: "🚉" }),
    vocabMcq("ko-m6-1-mcq-school", { surface: "학교", meaningEn: "school", emoji: "🏫" }, MCQ_POOL),
    vocabMcq("ko-m6-1-mcq-home", { surface: "집", meaningEn: "house / home", emoji: "🏠" }, MCQ_POOL),
    sentenceMcq({
      id: "ko-m6-1-q-restaurant",
      prompt: "Which means 'restaurant'?",
      correctHangul: "식당",
      distractorsHangul: ["학교", "가게", "역"],
      explanation: "식당 = restaurant. 가게 = store, 학교 = school.",
      exercisedAtomSurfaces: ["식당"],
    }),
    listeningCompSentence({
      id: "ko-m6-1-lc-store",
      audioText: "가게예요",
      correctMeaningEn: "It's a store",
      distractorsEn: ["It's a school", "It's a station", "It's a house"],
      exercisedAtomSurfaces: ["가게"],
    }),
    speaking("ko-m6-1-speak-school", "학교예요", "It's a school"),
  ],
};

// ─── ko-m6-2 — 있어요 / 없어요 ──────────────────────────────────────────────

const M6_2: LessonContent = {
  id: "ko-m6-2",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "있어요 / 없어요 — there is / isn't",
  description: "Korea uses ONE verb for existence — for things, people, anything.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m6-2-info-1",
      "있어요 = 'there is' / 'I have'",
      "있어요 means 'there is' AND 'I have' — same word. 책 있어요 = 'There's a book' or 'I have a book'. The negative is 없어요 = 'there isn't' / 'I don't have'. (Unlike Japanese, Korean uses ONE existence verb for living and non-living things.)",
      "grammar",
    ),
    infoStep(
      "ko-m6-2-info-2",
      "없어요 is its own word",
      "Don't say '안 있어요'. The negative of 있어요 is the separate word 없어요. 시간 없어요 = 'I don't have time'. 물 없어요 = 'There's no water'.",
      "tip",
    ),
    phrase("ko-m6-2-p-have", "there is / I have", "isseoyo", "있어요"),
    phrase("ko-m6-2-p-havenot", "there isn't / I don't have", "eopseoyo", "없어요"),
    sentenceMcq({
      id: "ko-m6-2-q-have",
      prompt: "How do you say 'I have a book' / 'There is a book'?",
      correctHangul: "책 있어요",
      distractorsHangul: ["책 없어요", "책이에요", "책 주세요"],
      explanation: "있어요 = 'there is / I have'. 책 있어요.",
      exercisedAtomSurfaces: ["책", "있어요"],
    }),
    sentenceMcq({
      id: "ko-m6-2-q-havenot",
      prompt: "How do you say 'There is no water'?",
      correctHangul: "물 없어요",
      distractorsHangul: ["물 있어요", "물 안 있어요", "물이에요"],
      explanation: "없어요 is the dedicated negative — never 안 있어요.",
      exercisedAtomSurfaces: ["물", "없어요"],
    }),
    listeningCompSentence({
      id: "ko-m6-2-lc-have",
      audioText: "있어요",
      correctMeaningEn: "There is / I have",
      distractorsEn: ["There isn't", "It is", "Please give"],
      exercisedAtomSurfaces: ["있어요"],
    }),
    speaking("ko-m6-2-speak-have", "책 있어요", "I have a book"),
  ],
};

// ─── ko-m6-3 — 에 (location of existence) ───────────────────────────────────

const M6_3: LessonContent = {
  id: "ko-m6-3",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "에 — at / in (a place)",
  description: "Mark WHERE something is with 에 + 있어요.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m6-3-info",
      "에 marks the location of existence",
      "To say WHERE something is, mark the place with 에, then use 있어요/없어요. 집에 있어요 = 'I'm at home'. 학교에 있어요 = '(it/I) is at school'. Pattern: PLACE + 에 + 있어요.",
      "grammar",
    ),
    phrase("ko-m6-3-p-athome", "I'm at home.", "jibe isseoyo", "집에 있어요"),
    cloze(
      "ko-m6-3-cloze-school",
      "학교",
      "있어요",
      "에",
      ["에", "에서", "이", "을"],
      "(I) am at school.",
      "학교에 있어요",
      "에 marks the location of existence (where something is).",
    ),
    sentenceMcq({
      id: "ko-m6-3-q-athome",
      prompt: "How do you say 'I'm at home'?",
      correctHangul: "집에 있어요",
      distractorsHangul: ["집에서 있어요", "집이 있어요", "집 있어요"],
      explanation: "Location of existence → 에. 집에 있어요.",
      exercisedAtomSurfaces: ["집", "있어요"],
    }),
    listeningCompSentence({
      id: "ko-m6-3-lc-station",
      audioText: "역에 있어요",
      correctMeaningEn: "(I) am at the station",
      distractorsEn: ["(I) am at home", "There's no station", "Where is the station?"],
      exercisedAtomSurfaces: ["역", "있어요"],
    }),
    speaking("ko-m6-3-speak-athome", "집에 있어요", "I'm at home"),
  ],
};

// ─── ko-m6-4 — 에서 (location of action) ────────────────────────────────────

const M6_4: LessonContent = {
  id: "ko-m6-4",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "에 vs 에서 — being vs doing",
  description: "Two location particles, split by whether something is happening.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m6-4-info",
      "에 = where you ARE, 에서 = where you DO",
      "Use 에 for static location (existence, with 있어요): 집에 있어요 = 'I'm at home'. Use 에서 for the place an ACTION happens: 식당에서 먹어요 = 'I eat at a restaurant'. Same English 'at' — Korean splits by being vs doing.",
      "grammar",
    ),
    phrase("ko-m6-4-p-eat", "(I) eat / am eating", "meogeoyo", "먹어요"),
    sentenceMcq({
      id: "ko-m6-4-q-action",
      prompt: "'I eat at a restaurant.' — which particle marks the place of the action?",
      correctHangul: "식당에서 먹어요",
      distractorsHangul: ["식당에 먹어요", "식당이 먹어요", "식당을 먹어요"],
      explanation: "An action (eating) happens there → 에서. (에 would be for just BEING there.)",
      exercisedAtomSurfaces: ["식당"],
    }),
    cloze(
      "ko-m6-4-cloze-action",
      "가게",
      "있어요",
      "에",
      ["에", "에서", "이", "을"],
      "(I) am at the store. (existence → 에)",
      "가게에 있어요",
      "Existence (있어요) takes 에, not 에서.",
    ),
    sentenceMcq({
      id: "ko-m6-4-q-being",
      prompt: "'I'm at school.' (just being there) —",
      correctHangul: "학교에 있어요",
      distractorsHangul: ["학교에서 있어요", "학교에서 먹어요", "학교가 있어요"],
      explanation: "Existence (있어요) → 에, never 에서.",
      exercisedAtomSurfaces: ["학교", "있어요"],
    }),
    listeningCompSentence({
      id: "ko-m6-4-lc-eat",
      audioText: "식당에서 먹어요",
      correctMeaningEn: "I eat at a restaurant",
      distractorsEn: ["I'm at a restaurant", "There's no restaurant", "Where is the restaurant?"],
      exercisedAtomSurfaces: ["식당"],
    }),
    speaking("ko-m6-4-speak-eat", "식당에서 먹어요", "I eat at a restaurant"),
  ],
};

// ─── ko-m6-5 — 이/가 + 있어요 ───────────────────────────────────────────────

const M6_5: LessonContent = {
  id: "ko-m6-5",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "이/가 + 있어요 — marking the subject",
  description: "Mark WHAT exists with the subject particle 이 or 가.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m6-5-info",
      "이 (after consonant) / 가 (after vowel)",
      "To say 'there is a CAT', mark the thing that exists with the subject particle: 이 after a consonant, 가 after a vowel. 가게에 사람이 있어요 = 'There's a person in the store' (사람 ends in a consonant → 이). 의자가 있어요 = 'There's a chair' (의자 ends in a vowel → 가).",
      "grammar",
    ),
    cloze(
      "ko-m6-5-cloze-consonant",
      "집에 책",
      "있어요",
      "이",
      ["이", "가", "은", "에"],
      "There's a book at home.",
      "집에 책이 있어요",
      "책 ends in a consonant → subject particle 이.",
    ),
    cloze(
      "ko-m6-5-cloze-vowel",
      "의자",
      "있어요",
      "가",
      ["가", "이", "는", "에"],
      "There's a chair.",
      "의자가 있어요",
      "의자 ends in a vowel → subject particle 가.",
    ),
    sentenceMcq({
      id: "ko-m6-5-q-subject",
      prompt: "친구 ends in a vowel. 'There's a friend at school.' —",
      correctHangul: "학교에 친구가 있어요",
      distractorsHangul: ["학교에 친구이 있어요", "학교에서 친구가 있어요", "학교가 친구에 있어요"],
      explanation: "친구 (vowel) → 가; existence place → 에.",
      exercisedAtomSurfaces: ["학교", "친구", "있어요"],
    }),
    listeningCompSentence({
      id: "ko-m6-5-lc-chair",
      audioText: "의자가 있어요",
      correctMeaningEn: "There's a chair",
      distractorsEn: ["There's no chair", "It's a chair", "Where's the chair?"],
      exercisedAtomSurfaces: ["있어요"],
    }),
    speaking("ko-m6-5-speak-subject", "친구가 있어요", "I have a friend"),
  ],
};

// ─── ko-m6-6 — 어디에 있어요? ───────────────────────────────────────────────

const M6_6: LessonContent = {
  id: "ko-m6-6",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "어디에 있어요? — where is it?",
  description: "Ask where something is, and answer with a place.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m6-6-info",
      "어디 = where",
      "어디 = 'where'. Add 에 and 있어요 to ask location: 어디에 있어요? = 'Where is it?'. Answer with PLACE + 에 있어요: 집에 있어요 = 'It's at home'. 화장실 어디에 있어요? = 'Where's the restroom?'",
      "grammar",
    ),
    phrase("ko-m6-6-p-where", "where", "eodi", "어디"),
    phrase("ko-m6-6-p-whereis", "Where is it?", "eodie isseoyo", "어디에 있어요?"),
    sentenceMcq({
      id: "ko-m6-6-q-where",
      prompt: "How do you ask 'Where is it?'",
      correctHangul: "어디에 있어요?",
      distractorsHangul: ["뭐예요?", "어디에서 있어요?", "어디가 있어요?"],
      explanation: "어디 (where) + 에 + 있어요 = 'Where is it?'. Existence → 에.",
      exercisedAtomSurfaces: ["어디", "있어요"],
    }),
    cloze(
      "ko-m6-6-cloze-where",
      "어디",
      "있어요?",
      "에",
      ["에", "에서", "이", "가"],
      "Where is it?",
      "어디에 있어요?",
      "Existence question → 에. 어디에 있어요?",
    ),
    translateStep({
      id: "ko-m6-6-tr-athome",
      promptEn: "It's at home.",
      acceptedAnswers: ["집에 있어요", "집에 있어요."],
      audioText: "집에 있어요",
      exercisedAtomSurfaces: ["집", "있어요"],
    }),
    listeningCompSentence({
      id: "ko-m6-6-lc-where",
      audioText: "어디에 있어요?",
      correctMeaningEn: "Where is it?",
      distractorsEn: ["What is it?", "Whose is it?", "How much is it?"],
      exercisedAtomSurfaces: ["어디", "있어요"],
    }),
    speaking("ko-m6-6-speak-where", "어디에 있어요?", "Where is it?"),
  ],
};

// ─── ko-m6-7 — Mini-dialogue ────────────────────────────────────────────────

const M6_7: LessonContent = {
  id: "ko-m6-7",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — finding your way",
  description: "Ask where a place is and say where you are.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m6-7-info",
      "Asking around",
      "A: 식당이 어디에 있어요? (Where's the restaurant?)\nB: 역에 있어요. (It's at the station.)\nA: 친구가 학교에 있어요. (My friend is at school.)\nYou can run this whole exchange now.",
      "default",
    ),
    build(
      "ko-m6-7-build-whererest",
      "Build: 'Where is the restaurant?' (restaurant + subject + where + at + is)",
      "식당이 어디에 있어요",
      ["식당이", "어디에", "있어요", "식당에서", "없어요"],
      ["식당이", "어디에", "있어요"],
      ["어디에", "있어요"],
    ),
    sentenceMcq({
      id: "ko-m6-7-q-atstation",
      prompt: "'It's at the station.' —",
      correctHangul: "역에 있어요",
      distractorsHangul: ["역에서 있어요", "역이 있어요", "역 없어요"],
      explanation: "Existence at a place → 에. 역에 있어요.",
      exercisedAtomSurfaces: ["역", "있어요"],
    }),
    translateStep({
      id: "ko-m6-7-tr-whereis",
      promptEn: "Where is it?",
      acceptedAnswers: ["어디에 있어요?", "어디에 있어요"],
      audioText: "어디에 있어요?",
      exercisedAtomSurfaces: ["어디", "있어요"],
    }),
    listeningCompSentence({
      id: "ko-m6-7-lc-friend",
      audioText: "친구가 학교에 있어요",
      correctMeaningEn: "My friend is at school",
      distractorsEn: ["I'm at school", "There's no friend", "Where's my friend?"],
      exercisedAtomSurfaces: ["친구", "학교", "있어요"],
    }),
    speaking("ko-m6-7-speak-where", "식당이 어디에 있어요?", "Where is the restaurant?"),
  ],
};

// ─── ko-m6-8 — Mastery test ─────────────────────────────────────────────────

const M6_8: LessonContent = {
  id: "ko-m6-8",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M6 Mastery Test",
  description: "Prove you've got places, existence, and the 에 / 에서 contrast.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "ko-m6-8-q-place",
      prompt: "Which means 'station'?",
      correctHangul: "역",
      distractorsHangul: ["집", "가게", "식당"],
      exercisedAtomSurfaces: ["역"],
    }),
    sentenceMcq({
      id: "ko-m6-8-q-exist",
      prompt: "'There is no water.' —",
      correctHangul: "물 없어요",
      distractorsHangul: ["물 있어요", "물 안 있어요", "물이에요"],
      exercisedAtomSurfaces: ["물", "없어요"],
    }),
    cloze(
      "ko-m6-8-cloze-loc",
      "집",
      "있어요",
      "에",
      ["에", "에서", "이", "을"],
      "I'm at home.",
      "집에 있어요",
      "Existence location → 에.",
    ),
    sentenceMcq({
      id: "ko-m6-8-q-action",
      prompt: "'I eat at a restaurant.' —",
      correctHangul: "식당에서 먹어요",
      distractorsHangul: ["식당에 먹어요", "식당이 먹어요", "식당에서 있어요"],
      exercisedAtomSurfaces: ["식당"],
    }),
    sentenceMcq({
      id: "ko-m6-8-q-where",
      prompt: "'Where is it?' —",
      correctHangul: "어디에 있어요?",
      distractorsHangul: ["뭐예요?", "어디에서 있어요?", "어디가 있어요?"],
      exercisedAtomSurfaces: ["어디", "있어요"],
    }),
    listeningCompSentence({
      id: "ko-m6-8-lc-athome",
      audioText: "집에 있어요",
      correctMeaningEn: "I'm at home",
      distractorsEn: ["Where is it?", "I'm at school", "There's no home"],
      exercisedAtomSurfaces: ["집", "있어요"],
    }),
    speaking("ko-m6-8-speak-recap", "어디에 있어요?", "Where is it?"),
  ],
};

export const KO_M6_LESSONS: LessonContent[] = [
  M6_1,
  M6_2,
  M6_3,
  M6_4,
  M6_5,
  M6_6,
  M6_7,
  M6_8,
];
