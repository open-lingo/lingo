/**
 * Korean Module 4 — Things & possession.
 *
 * M3 gave the learner greetings, the 이에요/예요 copula, self-introduction,
 * and Sino numbers. M4 adds the vocabulary for everyday objects, the
 * possessive 의 (with its very common spoken contraction 제 = 저의), and the
 * three-way demonstrative system 이거 / 그거 / 저거.
 *
 * The grammar spine mirrors the JA M4 arc (の possessive + これ/それ/あれ
 * demonstratives) but uses Korean's own three-way deixis:
 *
 *   ko-m4-1  Everyday objects — 책 / 펜 / 가방 / 의자 / 문
 *   ko-m4-2  의 — the possessive particle (and 제 = 저의)
 *   ko-m4-3  이거 / 그거 / 저거 — this / that-near-you / that-over-there
 *   ko-m4-4  이게 뭐예요? — asking what something is
 *   ko-m4-5  누구 거예요? — whose is it? + 제 거예요
 *   ko-m4-6  Sentence build — possession + demonstratives
 *   ko-m4-7  Mini-dialogue — at a shop, pointing things out
 *   ko-m4-8  M4 Mastery Test
 *
 * Authoring follows the JA M3+ rubric (docs/lesson-authoring-guide.md §13):
 * teach steps (info / phrase_card) NEVER carry SRS weight; only the graded
 * factories do. Atom resolution is by Hangul surface via the KO grammar
 * helpers; the M4 vocab atoms live in courseAtoms.ts (M4_VOCAB).
 *
 * Korean note baked into the content: 거 is the spoken form of the bound
 * noun 것 ("thing"), so 이거 = 이것 ("this thing"), 제 거 = "my thing". We
 * teach the spoken contractions because that's what learners hear.
 *
 * NATIVE-REVIEW (module-wide): several sentences use a BARE demonstrative
 * before a noun — 이거 책이에요, 그거 가방이에요, 저거 친구 가방이에요,
 * 이거 제 책이에요 (steps ko-m4-3-build-thisbook, ko-m4-6-build-mybook,
 * ko-m4-6-q-friendbag, ko-m4-7-build-thatbag). This is natural in casual
 * spoken Korean but a textbook may prefer the particle form (이건/이게…).
 * A native speaker should confirm the register before this ships; if the
 * particle form is preferred, update those four steps (and their tiles).
 *
 * CONTENT-TODO: a Korean speaker should also review the 제 vs 저의 teaching
 * order and the naturalness of the shop mini-dialogue.
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

// Shared distractor pool for vocab-image MCQs. CRITICAL: every surface here
// has verified Noto-emoji art in the bundled subset (src/pub/noto-emoji/svg)
// — checked at authoring time. A missing file renders as a broken image.
const MCQ_POOL = [
  { surface: "책", emoji: "📖" },
  { surface: "펜", emoji: "🖊️" },
  { surface: "가방", emoji: "👜" },
  { surface: "의자", emoji: "🪑" },
  { surface: "문", emoji: "🚪" },
  { surface: "핸드폰", emoji: "📱" },
  { surface: "친구", emoji: "👫" },
  { surface: "나무", emoji: "🌳" },
];

// ─── ko-m4-1 — Everyday objects ─────────────────────────────────────────────

const M4_1: LessonContent = {
  id: "ko-m4-1",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Everyday objects — 책, 펜, 가방",
  description: "Name the things around you: book, pen, bag, chair, door.",
  estimatedMinutes: 5,
  xpReward: 10,
  steps: [
    infoStep(
      "ko-m4-1-info",
      "Naming things",
      "Korean nouns don't change for singular/plural and there are no 'a/the' articles. 책 is just 'book' — say it with the copula (책이에요 = 'it's a book') and you've made a sentence.",
      "grammar",
    ),
    phrase("ko-m4-1-p-book", "book", "chaek", "책", undefined, { emoji: "📖" }),
    phrase("ko-m4-1-p-pen", "pen", "pen", "펜", undefined, { emoji: "🖊️" }),
    phrase("ko-m4-1-p-bag", "bag", "gabang", "가방", undefined, { emoji: "👜" }),
    phrase("ko-m4-1-p-chair", "chair", "uija", "의자", undefined, { emoji: "🪑" }),
    phrase("ko-m4-1-p-door", "door", "mun", "문", undefined, { emoji: "🚪" }),
    vocabMcq("ko-m4-1-mcq-book", { surface: "책", meaningEn: "book", emoji: "📖" }, MCQ_POOL),
    vocabMcq("ko-m4-1-mcq-bag", { surface: "가방", meaningEn: "bag", emoji: "👜" }, MCQ_POOL),
    sentenceMcq({
      id: "ko-m4-1-q-itsabook",
      prompt: "책 ends in a consonant. How do you say 'It's a book'?",
      correctHangul: "책이에요",
      distractorsHangul: ["책예요", "책이예요", "책에요"],
      explanation: "Consonant ending → 이에요. 책 + 이에요.",
      exercisedAtomSurfaces: ["책", "이에요"],
    }),
    listeningCompSentence({
      id: "ko-m4-1-lc-chair",
      audioText: "의자예요",
      correctMeaningEn: "It's a chair",
      distractorsEn: ["It's a door", "It's a bag", "It's a pen"],
      exercisedAtomSurfaces: ["의자"],
    }),
    speaking("ko-m4-1-speak-bag", "가방이에요", "It's a bag"),
  ],
};

// ─── ko-m4-2 — 의 possessive ────────────────────────────────────────────────

const M4_2: LessonContent = {
  id: "ko-m4-2",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "의 — possessive 's",
  description: "Show ownership: 친구의 책 = 'friend's book'.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m4-2-info-1",
      "의 = 's (of)",
      "Stick 의 onto the owner: 친구의 책 = 'friend's book' (literally 'friend-of book'). The owner comes first, then 의, then the thing — same order as English 's.",
      "grammar",
    ),
    infoStep(
      "ko-m4-2-info-2",
      "'My' is almost always 제",
      "저 ('I') + 의 would be 저의, but in real speech it contracts to 제. So 'my book' is 제 책, not 저의 책. (제 is pronounced like 'jeh'.) You'll hear 제 constantly — learn it as a unit.",
      "tip",
    ),
    phrase("ko-m4-2-p-my", "my (polite)", "je", "제"),
    cloze(
      "ko-m4-2-cloze-friend",
      "친구",
      "책",
      "의",
      ["의", "이", "은", "에"],
      "friend's book",
      "친구의 책",
      "의 = possessive 's. 친구 + 의 = 'friend's'.",
    ),
    sentenceMcq({
      id: "ko-m4-2-q-mybook",
      prompt: "How do you say 'my book' in natural spoken Korean?",
      correctHangul: "제 책",
      distractorsHangul: ["저의 책", "저는 책", "제가 책"],
      explanation: "제 is the spoken contraction of 저의. 제 책 = 'my book'.",
      exercisedAtomSurfaces: ["제", "책"],
    }),
    translateStep({
      id: "ko-m4-2-tr-friendbag",
      promptEn: "friend's bag",
      acceptedAnswers: ["친구의 가방", "친구 가방"],
      audioText: "친구의 가방",
      exercisedAtomSurfaces: ["친구", "가방"],
    }),
    speaking("ko-m4-2-speak-mybook", "제 책이에요", "It's my book"),
  ],
};

// ─── ko-m4-3 — 이거 / 그거 / 저거 ──────────────────────────────────────────

const M4_3: LessonContent = {
  id: "ko-m4-3",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "이거 / 그거 / 저거 — this & that",
  description: "Korean splits 'that' by distance from the speaker and listener.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m4-3-info-1",
      "Three pointers, not two",
      "이거 = 'this' (near ME). 그거 = 'that' (near YOU, or something we both already know). 저거 = 'that over there' (far from both of us). English has two; Korean has three.",
      "grammar",
    ),
    infoStep(
      "ko-m4-3-info-2",
      "거 = 'thing'",
      "이거 is really 이 ('this') + 거 ('thing') — '이거' = 'this thing'. In writing you may see the fuller 이것 / 그것 / 저것; 이거 / 그거 / 저거 are the everyday spoken forms.",
      "tip",
    ),
    phrase("ko-m4-3-p-this", "this (thing)", "igeo", "이거"),
    phrase("ko-m4-3-p-that-you", "that (near you)", "geugeo", "그거"),
    phrase("ko-m4-3-p-that-there", "that (over there)", "jeogeo", "저거"),
    sentenceMcq({
      id: "ko-m4-3-q-overthere",
      prompt: "Something is far from both you and the listener. You say…",
      correctHangul: "저거예요",
      distractorsHangul: ["이거예요", "그거예요", "저는이에요"],
      explanation: "저거 = 'that thing over there' (far from both speakers).",
      exercisedAtomSurfaces: ["저거"],
    }),
    listeningCompSentence({
      id: "ko-m4-3-lc-this",
      audioText: "이거예요",
      correctMeaningEn: "It's this one",
      distractorsEn: ["It's that one (near you)", "It's that one over there", "What is it?"],
      exercisedAtomSurfaces: ["이거"],
    }),
    // NATIVE-REVIEW: bare 이거 + noun ("이거 책이에요") is natural in casual
    // speech, but a textbook may prefer the particle form 이건 책이에요
    // (이거+는) or 이게 책이에요 (이거+가). Confirm which to present to
    // beginners; if the particle form is preferred, update the tiles too.
    build(
      "ko-m4-3-build-thisbook",
      "Build: 'This is a book.' (this thing + is a book)",
      "이거 책이에요",
      ["이거", "책", "이에요", "저거", "예요"],
      ["이거", "책", "이에요"],
      ["이거", "책"],
    ),
    speaking("ko-m4-3-speak-that", "저거예요", "It's that one over there"),
  ],
};

// ─── ko-m4-4 — 이게 뭐예요? (what is this) ──────────────────────────────────

const M4_4: LessonContent = {
  id: "ko-m4-4",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "이게 뭐예요? — what is this?",
  description: "Ask what something is and answer with a noun.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "ko-m4-4-info",
      "이거 + 가 → 이게",
      "To ask 'what is this?' you make 이거 the subject. 이거 + 가 contracts to 이게: 이게 뭐예요? = 'What is this?' Likewise 그거→그게, 저거→저게. Answer with the noun + 이에요/예요.",
      "grammar",
    ),
    phrase("ko-m4-4-p-whatis", "What is this?", "ige mwoyeyo", "이게 뭐예요?"),
    sentenceMcq({
      id: "ko-m4-4-q-ask",
      prompt: "Point at something near you and ask 'What is this?'",
      correctHangul: "이게 뭐예요?",
      distractorsHangul: ["이게 누구예요?", "이거 어디예요?", "이게 뭐 입니다?"],
      explanation: "이게 뭐예요? — 뭐 (what) for things; 누구 (who) would be for people.",
      exercisedAtomSurfaces: ["뭐"],
    }),
    cloze(
      "ko-m4-4-cloze-copula",
      "그거 책",
      "",
      "이에요",
      ["이에요", "예요", "있어요", "주세요"],
      "That's a book.",
      "그거 책이에요",
      "책 ends in a consonant → 이에요 (the polite copula).",
    ),
    listeningCompSentence({
      id: "ko-m4-4-lc-whatis",
      audioText: "이게 뭐예요?",
      correctMeaningEn: "What is this?",
      distractorsEn: ["Who is this?", "Where is this?", "Whose is this?"],
    }),
    speaking("ko-m4-4-speak-ask", "이게 뭐예요?", "What is this?"),
  ],
};

// ─── ko-m4-5 — 누구 거예요? (whose is it) ───────────────────────────────────

const M4_5: LessonContent = {
  id: "ko-m4-5",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "누구 거예요? — whose is it?",
  description: "Ask who something belongs to, and claim it as yours.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "ko-m4-5-info",
      "거 = 'thing/one', so X 거 = 'X's one'",
      "누구 거예요? = 'Whose is it?' (literally 'whose thing is it?'). Answer with owner + 거예요: 제 거예요 = 'It's mine', 친구 거예요 = 'It's my friend's'. The 의 is usually dropped before 거 in speech.",
      "grammar",
    ),
    phrase("ko-m4-5-p-whose", "Whose is it?", "nugu geoyeyo", "누구 거예요?"),
    phrase("ko-m4-5-p-mine", "It's mine.", "je geoyeyo", "제 거예요"),
    sentenceMcq({
      id: "ko-m4-5-q-mine",
      prompt: "Someone asks 누구 거예요? It's yours. You answer…",
      correctHangul: "제 거예요",
      distractorsHangul: ["제가 거예요", "저는 거예요", "제 것이"],
      explanation: "제 거예요 = 'It's mine' (제 = my, 거 = thing/one).",
      exercisedAtomSurfaces: ["제"],
    }),
    sentenceMcq({
      id: "ko-m4-5-q-whose",
      prompt: "How do you ask 'Whose is it?'",
      correctHangul: "누구 거예요?",
      distractorsHangul: ["뭐 거예요?", "어디 거예요?", "누구이에요?"],
      explanation: "누구 = 'who', 거 = 'thing/one' → 누구 거예요? = 'Whose is it?'",
    }),
    translateStep({
      id: "ko-m4-5-tr-friends",
      promptEn: "It's my friend's.",
      acceptedAnswers: ["친구 거예요", "친구의 거예요", "친구 거예요."],
      audioText: "친구 거예요",
      exercisedAtomSurfaces: ["친구"],
    }),
    speaking("ko-m4-5-speak-mine", "제 거예요", "It's mine"),
  ],
};

// ─── ko-m4-6 — Sentence build (mixed) ───────────────────────────────────────

const M4_6: LessonContent = {
  id: "ko-m4-6",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Building it together",
  description: "Combine objects, possession, and demonstratives in full sentences.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    build(
      "ko-m4-6-build-mybook",
      "Build: 'This is my book.'",
      "이거 제 책이에요",
      ["이거", "제", "책", "이에요", "친구", "예요"],
      ["이거", "제", "책", "이에요"],
      ["이거", "제", "책"],
    ),
    sentenceMcq({
      id: "ko-m4-6-q-friendbag",
      prompt: "'That (over there) is my friend's bag.'",
      correctHangul: "저거 친구 가방이에요",
      distractorsHangul: ["이거 친구 가방이에요", "저거 친구 가방예요", "저거 친구 가방이"],
      explanation: "저거 (that over there) + 친구 가방 (friend's bag) + 이에요 (가방 ends in a consonant).",
      exercisedAtomSurfaces: ["저거", "친구", "가방"],
    }),
    cloze(
      "ko-m4-6-cloze-poss",
      "이거 친구",
      "펜이에요",
      "의",
      ["의", "이", "가", "에서"],
      "This is my friend's pen.",
      "이거 친구의 펜이에요",
      "의 = possessive 's. 친구 + 의 = 'friend's'.",
    ),
    listeningCompSentence({
      id: "ko-m4-6-lc-mine",
      audioText: "제 거예요",
      correctMeaningEn: "It's mine",
      distractorsEn: ["It's my friend's", "Whose is it?", "It's a book"],
      exercisedAtomSurfaces: ["제"],
    }),
    speaking("ko-m4-6-speak-full", "이거 제 책이에요", "This is my book"),
  ],
};

// ─── ko-m4-7 — Mini-dialogue ────────────────────────────────────────────────

const M4_7: LessonContent = {
  id: "ko-m4-7",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — at a shop",
  description: "Point at things, ask what they are, and ask whose they are.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m4-7-info",
      "Pointing things out",
      "A: 이게 뭐예요? (What is this?)\nB: 그거 가방이에요. (That's a bag.)\nA: 저거는 누구 거예요? (Whose is that one over there?)\nB: 제 거예요. (It's mine.)\nYou can run this whole exchange now.",
      "default",
    ),
    build(
      "ko-m4-7-build-thatbag",
      "Build: 'That (near you) is a bag.'",
      "그거 가방이에요",
      ["그거", "가방", "이에요", "저거", "예요"],
      ["그거", "가방", "이에요"],
      ["그거", "가방"],
    ),
    sentenceMcq({
      id: "ko-m4-7-q-reply",
      prompt: "Someone asks 누구 거예요? — they are asking…",
      correctHangul: "누구 거예요?",
      distractorsHangul: ["이게 뭐예요?", "어디예요?", "얼마예요?"],
      explanation: "누구 거예요? = 'Whose is it?' — you'd answer with an owner.",
    }),
    translateStep({
      id: "ko-m4-7-tr-whatis",
      promptEn: "What is this?",
      acceptedAnswers: ["이게 뭐예요?", "이게 뭐예요"],
      audioText: "이게 뭐예요?",
      exercisedAtomSurfaces: ["뭐"],
    }),
    listeningCompSentence({
      id: "ko-m4-7-lc-thatbook",
      audioText: "저거 책이에요",
      correctMeaningEn: "That over there is a book",
      distractorsEn: ["This is a book", "Whose book is it?", "It's my bag"],
      exercisedAtomSurfaces: ["저거", "책"],
    }),
    speaking("ko-m4-7-speak-full", "이게 뭐예요?", "What is this?"),
  ],
};

// ─── ko-m4-8 — Mastery test ─────────────────────────────────────────────────

const M4_8: LessonContent = {
  id: "ko-m4-8",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M4 Mastery Test",
  description: "Prove you've got objects, possession, and the 이거/그거/저거 system.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "ko-m4-8-q-object",
      prompt: "Which means 'bag'?",
      correctHangul: "가방",
      distractorsHangul: ["의자", "책", "문"],
      exercisedAtomSurfaces: ["가방"],
    }),
    sentenceMcq({
      id: "ko-m4-8-q-poss",
      prompt: "'my book' (natural spoken Korean) —",
      correctHangul: "제 책",
      distractorsHangul: ["저 책", "제가 책", "저는 책"],
      exercisedAtomSurfaces: ["제", "책"],
    }),
    sentenceMcq({
      id: "ko-m4-8-q-deixis",
      prompt: "Something far from both you and the listener —",
      correctHangul: "저거",
      distractorsHangul: ["이거", "그거", "여기"],
      exercisedAtomSurfaces: ["저거"],
    }),
    sentenceMcq({
      id: "ko-m4-8-q-whatis",
      prompt: "'What is this?' —",
      correctHangul: "이게 뭐예요?",
      distractorsHangul: ["이게 누구예요?", "이거 어디예요?", "이게 얼마예요?"],
      exercisedAtomSurfaces: ["뭐"],
    }),
    cloze(
      "ko-m4-8-cloze-poss",
      "친구",
      "가방이에요",
      "의",
      ["의", "이", "은", "에"],
      "It's my friend's bag.",
      "친구의 가방이에요",
      "의 = possessive 's.",
    ),
    listeningCompSentence({
      id: "ko-m4-8-lc-mine",
      audioText: "제 거예요",
      correctMeaningEn: "It's mine",
      distractorsEn: ["What is this?", "It's a book", "Whose is it?"],
      exercisedAtomSurfaces: ["제"],
    }),
    speaking("ko-m4-8-speak-recap", "이거 제 책이에요", "This is my book"),
  ],
};

export const KO_M4_LESSONS: LessonContent[] = [
  M4_1,
  M4_2,
  M4_3,
  M4_4,
  M4_5,
  M4_6,
  M4_7,
  M4_8,
];
