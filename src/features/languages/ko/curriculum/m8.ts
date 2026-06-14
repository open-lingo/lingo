/**
 * Korean Module 8 — Describing things (descriptive verbs / adjectives).
 *
 * M7 gave the learner action verbs in the 해요 present. M8 introduces the
 * other big verb class: descriptive verbs (what English calls adjectives).
 * The headline insight is that Korean adjectives ARE verbs — they conjugate
 * to 해요-style exactly like action verbs (좋다 → 좋아요, 크다 → 커요) — and
 * they also have an attributive form that goes BEFORE a noun (좋은 책 "a good
 * book", 큰 가방 "a big bag").
 *
 * Grammar spine mirrors the JA M8 arc (い-adjective predicate + attributive),
 * re-expressed in Korean's own grammar:
 *
 *   ko-m8-1  Describing words — 좋다 / 크다 / 작다 / 예쁘다 / 맛있다
 *   ko-m8-2  Adjectives as verbs — 좋아요 / 커요 / 작아요
 *   ko-m8-3  The ㅡ-drop — 예쁘다 → 예뻐요, 크다 → 커요
 *   ko-m8-4  맛있어요 / 비싸요 — food & price
 *   ko-m8-5  Attributive — 좋은 책, 큰 가방 (adjective before a noun)
 *   ko-m8-6  Building descriptions
 *   ko-m8-7  Mini-dialogue — at a shop, reacting
 *   ko-m8-8  M8 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - Adjectives conjugate like verbs: same 아요/어요 vowel split as M7.
 *   - ㅡ-stems drop ㅡ before the ending: 크다 → 커요, 예쁘다 → 예뻐요.
 *   - Attributive = stem + -(으)ㄴ: 좋다 → 좋은, 작다 → 작은, 크다 → 큰.
 *
 * Negation (안) is deliberately deferred to M11 so all negation lands once.
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

// ─── ko-m8-1 — Describing words (dictionary forms) ──────────────────────────

const M8_1: LessonContent = {
  id: "ko-m8-1",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Describing words — 좋다, 크다, 작다",
  description: "Korean adjectives are verbs too — meet them in dictionary form.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "ko-m8-1-info",
      "Adjectives end in 다 too",
      "In Korean, descriptive words are 'descriptive verbs' — they end in 다 just like action verbs. 좋다 (to be good), 크다 (to be big), 작다 (to be small), 예쁘다 (to be pretty), 맛있다 (to be delicious), 비싸다 (to be expensive). They conjugate the same way you just learned.",
      "grammar",
    ),
    phrase("ko-m8-1-p-good", "to be good", "jota", "좋다"),
    phrase("ko-m8-1-p-big", "to be big", "keuda", "크다"),
    phrase("ko-m8-1-p-small", "to be small", "jakda", "작다"),
    phrase("ko-m8-1-p-pretty", "to be pretty", "yeppeuda", "예쁘다"),
    phrase("ko-m8-1-p-delicious", "to be delicious", "masitda", "맛있다"),
    sentenceMcq({
      id: "ko-m8-1-q-big",
      prompt: "Which means 'to be big'?",
      correctHangul: "크다",
      distractorsHangul: ["작다", "좋다", "예쁘다"],
      explanation: "크다 = big, 작다 = small — the opposite pair.",
      exercisedAtomSurfaces: ["크다"],
    }),
    sentenceMcq({
      id: "ko-m8-1-q-good",
      prompt: "Which means 'to be good'?",
      correctHangul: "좋다",
      distractorsHangul: ["맛있다", "비싸다", "작다"],
      explanation: "좋다 = good. 맛있다 = delicious.",
      exercisedAtomSurfaces: ["좋다"],
    }),
    listeningCompSentence({
      id: "ko-m8-1-lc-small",
      audioText: "작다",
      correctMeaningEn: "to be small",
      distractorsEn: ["to be big", "to be good", "to be pretty"],
      exercisedAtomSurfaces: ["작다"],
    }),
  ],
};

// ─── ko-m8-2 — Adjectives as verbs ──────────────────────────────────────────

const M8_2: LessonContent = {
  id: "ko-m8-2",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "좋아요 / 작아요 — adjectives conjugate",
  description: "Same 아요/어요 rule as action verbs.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m8-2-info",
      "Drop 다, add 아요 / 어요",
      "Adjectives conjugate exactly like M7's verbs. 좋다 → 좋아요 ('it's good' — ㅗ stem, so 아요). 작다 → 작아요 ('it's small' — ㅏ stem). 좋아요 also means 'I like it'. No subject needed: 작아요 alone = 'it's small'.",
      "grammar",
    ),
    phrase("ko-m8-2-p-good", "is good / I like it", "joayo", "좋아요"),
    phrase("ko-m8-2-p-small", "is small", "jagayo", "작아요"),
    sentenceMcq({
      id: "ko-m8-2-q-good",
      prompt: "Make 좋다 polite ('it's good'):",
      correctHangul: "좋아요",
      distractorsHangul: ["좋어요", "좋요", "좋다요"],
      explanation: "좋 has ㅗ → add 아요. 좋아요.",
      exercisedAtomSurfaces: ["좋아요"],
    }),
    cloze(
      "ko-m8-2-cloze-small",
      "가방이",
      "",
      "작아요",
      ["작아요", "작어요", "작다", "작요"],
      "The bag is small.",
      "가방이 작아요",
      "작 has ㅏ → 작아요. The adjective is the whole predicate.",
    ),
    sentenceMcq({
      id: "ko-m8-2-q-bagbig",
      prompt: "'The bag is good.' (가방 ends in a consonant) —",
      correctHangul: "가방이 좋아요",
      distractorsHangul: ["가방가 좋아요", "가방이 좋어요", "가방을 좋아요"],
      explanation: "가방 (consonant) → subject 이; 좋다 → 좋아요.",
      exercisedAtomSurfaces: ["좋아요"],
    }),
    listeningCompSentence({
      id: "ko-m8-2-lc-good",
      audioText: "좋아요",
      correctMeaningEn: "It's good / I like it",
      distractorsEn: ["It's small", "It's big", "It's pretty"],
      exercisedAtomSurfaces: ["좋아요"],
    }),
    speaking("ko-m8-2-speak-good", "좋아요", "It's good", ["좋아요"]),
  ],
};

// ─── ko-m8-3 — The ㅡ-drop ──────────────────────────────────────────────────

const M8_3: LessonContent = {
  id: "ko-m8-3",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "크다 → 커요 — the ㅡ drop",
  description: "Stems ending in ㅡ drop it before the ending.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m8-3-info",
      "ㅡ disappears before 아/어",
      "When a stem's last vowel is ㅡ, the ㅡ drops out and the previous vowel decides 아 or 어. 크다 → 커요 (big). 예쁘다 → 예뻐요 (pretty). Don't say 크어요 or 예쁘어요 — the ㅡ is gone. Learn these as whole forms.",
      "grammar",
    ),
    phrase("ko-m8-3-p-big", "is big", "keoyo", "커요"),
    phrase("ko-m8-3-p-pretty", "is pretty", "yeppeoyo", "예뻐요"),
    sentenceMcq({
      id: "ko-m8-3-q-big",
      prompt: "Make 크다 polite ('it's big'):",
      correctHangul: "커요",
      distractorsHangul: ["크어요", "크아요", "크요"],
      explanation: "ㅡ drops → 커요, never 크어요.",
      exercisedAtomSurfaces: ["커요"],
    }),
    sentenceMcq({
      id: "ko-m8-3-q-pretty",
      prompt: "Make 예쁘다 polite ('it's pretty'):",
      correctHangul: "예뻐요",
      distractorsHangul: ["예쁘어요", "예쁘아요", "예뻐어요"],
      explanation: "예쁘 → drop ㅡ → 예뻐요.",
      exercisedAtomSurfaces: ["예뻐요"],
    }),
    cloze(
      "ko-m8-3-cloze-big",
      "가방이",
      "",
      "커요",
      ["커요", "크어요", "큰", "크다"],
      "The bag is big.",
      "가방이 커요",
      "크다 → 커요 (ㅡ drops).",
    ),
    listeningCompSentence({
      id: "ko-m8-3-lc-pretty",
      audioText: "예뻐요",
      correctMeaningEn: "It's pretty",
      distractorsEn: ["It's big", "It's small", "It's good"],
      exercisedAtomSurfaces: ["예뻐요"],
    }),
    speaking("ko-m8-3-speak-big", "커요", "It's big", ["커요"]),
  ],
};

// ─── ko-m8-4 — 맛있어요 / 비싸요 ────────────────────────────────────────────

const M8_4: LessonContent = {
  id: "ko-m8-4",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "맛있어요 / 비싸요 — food & price",
  description: "Two adjectives you'll use every day.",
  estimatedMinutes: 5,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m8-4-info",
      "Delicious & expensive",
      "맛있다 → 맛있어요 ('it's delicious'). 비싸다 → 비싸요 ('it's expensive' — 비싸 already ends in ㅏ, so the 아요 merges in). Pair them with food and shopping: 커피가 비싸요 = 'the coffee is expensive'.",
      "grammar",
    ),
    phrase("ko-m8-4-p-delicious", "is delicious", "masisseoyo", "맛있어요"),
    phrase("ko-m8-4-p-expensive", "is expensive", "bissayo", "비싸요"),
    sentenceMcq({
      id: "ko-m8-4-q-delicious",
      prompt: "'It's delicious.' —",
      correctHangul: "맛있어요",
      distractorsHangul: ["맛있아요", "맛있다요", "맛있요"],
      explanation: "맛있 → 맛있어요.",
      exercisedAtomSurfaces: ["맛있어요"],
    }),
    cloze(
      "ko-m8-4-cloze-expensive",
      "커피가",
      "",
      "비싸요",
      ["비싸요", "비싸어요", "비싼", "비싸다"],
      "The coffee is expensive.",
      "커피가 비싸요",
      "비싸다 → 비싸요. 커피 (vowel) → subject 가.",
    ),
    sentenceMcq({
      id: "ko-m8-4-q-foodgood",
      prompt: "'The rice is delicious.' (밥 ends in a consonant) —",
      correctHangul: "밥이 맛있어요",
      distractorsHangul: ["밥가 맛있어요", "밥이 맛있아요", "밥을 맛있어요"],
      explanation: "밥 (consonant) → subject 이; 맛있다 → 맛있어요.",
      exercisedAtomSurfaces: ["맛있어요"],
    }),
    listeningCompSentence({
      id: "ko-m8-4-lc-expensive",
      audioText: "비싸요",
      correctMeaningEn: "It's expensive",
      distractorsEn: ["It's delicious", "It's cheap", "It's good"],
      exercisedAtomSurfaces: ["비싸요"],
    }),
    speaking("ko-m8-4-speak-delicious", "맛있어요", "It's delicious", ["맛있어요"]),
  ],
};

// ─── ko-m8-5 — Attributive (adjective + noun) ───────────────────────────────

const M8_5: LessonContent = {
  id: "ko-m8-5",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "좋은 책 — describing a noun",
  description: "Put an adjective in front of a noun with -(으)ㄴ.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m8-5-info",
      "Adjective + -(으)ㄴ before a noun",
      "To describe a noun directly, change the adjective's ending to -(으)ㄴ and put it BEFORE the noun. 좋다 → 좋은 책 ('a good book'). 작다 → 작은 가방 ('a small bag'). 크다 → 큰 가방 ('a big bag'). This is different from the 좋아요 predicate form — here the adjective dresses the noun.",
      "grammar",
    ),
    phrase("ko-m8-5-p-good", "good (+ noun)", "joeun", "좋은"),
    phrase("ko-m8-5-p-big", "big (+ noun)", "keun", "큰"),
    phrase("ko-m8-5-p-small", "small (+ noun)", "jageun", "작은"),
    sentenceMcq({
      id: "ko-m8-5-q-goodbook",
      prompt: "'a good book' —",
      correctHangul: "좋은 책",
      distractorsHangul: ["좋아요 책", "좋다 책", "책 좋은"],
      explanation: "Attributive 좋은 goes BEFORE the noun: 좋은 책.",
      exercisedAtomSurfaces: ["책"],
    }),
    sentenceMcq({
      id: "ko-m8-5-q-bigbag",
      prompt: "'a big bag' —",
      correctHangul: "큰 가방",
      distractorsHangul: ["커요 가방", "크다 가방", "가방 큰"],
      explanation: "크다 → 큰 (attributive) → 큰 가방.",
      exercisedAtomSurfaces: ["가방"],
    }),
    build(
      "ko-m8-5-build-smallbag",
      "Build: 'a small bag' (small + bag)",
      "작은 가방",
      ["작은", "가방", "큰", "좋은"],
      ["작은", "가방"],
      ["가방"],
    ),
    listeningCompSentence({
      id: "ko-m8-5-lc-goodbook",
      audioText: "좋은 책",
      correctMeaningEn: "a good book",
      distractorsEn: ["a big bag", "a small book", "a pretty bag"],
      exercisedAtomSurfaces: ["책"],
    }),
    speaking("ko-m8-5-speak-bigbag", "큰 가방", "a big bag", ["가방"]),
  ],
};

// ─── ko-m8-6 — Building descriptions ────────────────────────────────────────

const M8_6: LessonContent = {
  id: "ko-m8-6",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Building descriptions",
  description: "Combine subjects, adjectives, and the attributive form.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m8-6-info",
      "Predicate vs attributive — pick the right one",
      "Use the 아요/어요 form to MAKE A STATEMENT: 가방이 커요 ('the bag is big'). Use the -(으)ㄴ form to DESCRIBE A NOUN inside a sentence: 큰 가방이 좋아요 ('the big bag is good'). Two tools, two jobs.",
      "grammar",
    ),
    build(
      "ko-m8-6-build-bagbig",
      "Build: 'The bag is big.' (bag + subject + is-big)",
      "가방이 커요",
      ["가방이", "커요", "큰", "좋아요"],
      ["가방이", "커요"],
      ["커요"],
    ),
    build(
      "ko-m8-6-build-goodbookgood",
      "Build: 'The good book is good.' (good + book + subject + is-good)",
      "좋은 책이 좋아요",
      ["좋은", "책이", "좋아요", "커요"],
      ["좋은", "책이", "좋아요"],
      ["책", "좋아요"],
    ),
    sentenceMcq({
      id: "ko-m8-6-q-prettybag",
      prompt: "'The bag is pretty.' —",
      correctHangul: "가방이 예뻐요",
      distractorsHangul: ["가방이 예쁘어요", "가방을 예뻐요", "예쁜 가방이"],
      explanation: "예쁘다 → 예뻐요 (ㅡ drop); 가방 (consonant) → 이.",
      exercisedAtomSurfaces: ["예뻐요"],
    }),
    translateStep({
      id: "ko-m8-6-tr-coffeedelicious",
      promptEn: "The coffee is delicious.",
      acceptedAnswers: ["커피가 맛있어요", "커피가 맛있어요."],
      audioText: "커피가 맛있어요",
      exercisedAtomSurfaces: ["맛있어요"],
    }),
    speaking("ko-m8-6-speak-bagbig", "가방이 커요", "The bag is big", ["커요"]),
  ],
};

// ─── ko-m8-7 — Mini-dialogue ────────────────────────────────────────────────

const M8_7: LessonContent = {
  id: "ko-m8-7",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — at a shop",
  description: "React to things you see and try.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m8-7-info",
      "Reacting like a local",
      "A: 이 가방 어때요? (How about this bag?)\nB: 예뻐요! 그런데 비싸요. (It's pretty! But it's expensive.)\nA: 이 책은 좋아요. (This book is good.)\n어때요? ('how is it?') invites exactly the adjectives you just learned.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m8-7-q-prettybut",
      prompt: "'It's pretty, but it's expensive.' —",
      // NATIVE-REVIEW: 그런데 ('but / by the way') is introduced here for the
      // dialogue only — confirm it reads naturally for an A2 learner and isn't
      // ahead of its teaching point.
      correctHangul: "예뻐요. 그런데 비싸요",
      distractorsHangul: ["예뻐요. 그런데 작아요", "커요. 그런데 비싸요", "좋아요. 그런데 예뻐요"],
      explanation: "예뻐요 (pretty) + 그런데 (but) + 비싸요 (expensive).",
      exercisedAtomSurfaces: ["예뻐요", "비싸요"],
    }),
    build(
      "ko-m8-7-build-bookgood",
      "Build: 'This book is good.' (this + book + topic + is-good)",
      "이 책은 좋아요",
      ["이", "책은", "좋아요", "커요"],
      ["이", "책은", "좋아요"],
      ["책", "좋아요"],
    ),
    translateStep({
      id: "ko-m8-7-tr-bagpretty",
      promptEn: "The bag is pretty.",
      acceptedAnswers: ["가방이 예뻐요", "가방이 예뻐요."],
      audioText: "가방이 예뻐요",
      exercisedAtomSurfaces: ["예뻐요"],
    }),
    listeningCompSentence({
      id: "ko-m8-7-lc-expensive",
      audioText: "비싸요",
      correctMeaningEn: "It's expensive",
      distractorsEn: ["It's pretty", "It's cheap", "It's good"],
      exercisedAtomSurfaces: ["비싸요"],
    }),
    speaking("ko-m8-7-speak-prettybut", "예뻐요. 그런데 비싸요", "It's pretty, but it's expensive", ["예뻐요", "비싸요"]),
  ],
};

// ─── ko-m8-8 — Mastery test ─────────────────────────────────────────────────

const M8_8: LessonContent = {
  id: "ko-m8-8",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M8 Mastery Test",
  description: "Adjectives as verbs, the ㅡ-drop, and the attributive form.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "ko-m8-8-q-good",
      prompt: "Make 좋다 polite ('it's good'):",
      correctHangul: "좋아요",
      distractorsHangul: ["좋어요", "좋다요", "좋요"],
      exercisedAtomSurfaces: ["좋아요"],
    }),
    sentenceMcq({
      id: "ko-m8-8-q-big",
      prompt: "Make 크다 polite ('it's big'):",
      correctHangul: "커요",
      distractorsHangul: ["크어요", "크아요", "크요"],
      exercisedAtomSurfaces: ["커요"],
    }),
    cloze(
      "ko-m8-8-cloze-small",
      "가방이",
      "",
      "작아요",
      ["작아요", "작어요", "작은", "작다"],
      "The bag is small.",
      "가방이 작아요",
      "작다 → 작아요.",
    ),
    sentenceMcq({
      id: "ko-m8-8-q-goodbook",
      prompt: "'a good book' —",
      correctHangul: "좋은 책",
      distractorsHangul: ["좋아요 책", "책 좋은", "좋다 책"],
      exercisedAtomSurfaces: ["책"],
    }),
    sentenceMcq({
      id: "ko-m8-8-q-delicious",
      prompt: "'The rice is delicious.' —",
      correctHangul: "밥이 맛있어요",
      distractorsHangul: ["밥가 맛있어요", "밥이 맛있아요", "밥을 맛있어요"],
      exercisedAtomSurfaces: ["맛있어요"],
    }),
    listeningCompSentence({
      id: "ko-m8-8-lc-pretty",
      audioText: "예뻐요",
      correctMeaningEn: "It's pretty",
      distractorsEn: ["It's big", "It's small", "It's expensive"],
      exercisedAtomSurfaces: ["예뻐요"],
    }),
    speaking("ko-m8-8-speak-recap", "커피가 맛있어요", "The coffee is delicious", ["맛있어요"]),
  ],
};

export const KO_M8_LESSONS: LessonContent[] = [
  M8_1,
  M8_2,
  M8_3,
  M8_4,
  M8_5,
  M8_6,
  M8_7,
  M8_8,
];
