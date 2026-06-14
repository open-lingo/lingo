/**
 * Korean Module 9 — Connecting things (and / with / also).
 *
 * M7-M8 gave the learner verbs and adjectives. M9 is the "glue" module:
 * how to join two nouns ("coffee and bread"), how to say "with someone",
 * and how to say "me too". These small words turn single statements into
 * real conversation.
 *
 * Grammar spine mirrors the JA M8 と (and / with) plus the JA M9 sense of
 * layering extra meaning onto a sentence (よ/ね), re-expressed in Korean:
 *
 *   ko-m9-1  하고 — and / with (the everyday connector)
 *   ko-m9-2  하고 = "with" — 친구하고 (with a friend)
 *   ko-m9-3  와 / 과 — the formal "and"
 *   ko-m9-4  도 — too / also (and what it replaces)
 *   ko-m9-5  Putting connectors together
 *   ko-m9-6  More practice — lists & company
 *   ko-m9-7  Mini-dialogue — ordering together
 *   ko-m9-8  M9 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - 하고 joins nouns AND means "with"; it works after vowel or consonant,
 *     which makes it the friendliest connector to learn first.
 *   - 와 (after a vowel) / 과 (after a consonant) is the more formal "and".
 *   - 도 ('too/also') REPLACES the subject/object/topic particle — it never
 *     stacks (저도, not 저는도). This is the headline teaching point.
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
  vocabMcq,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

// Verified Noto-emoji art for the list/MCQ drills.
const MCQ_POOL = [
  { surface: "커피", emoji: "☕" },
  { surface: "빵", emoji: "🍞" },
  { surface: "우유", emoji: "🥛" },
  { surface: "사과", emoji: "🍎" },
  { surface: "물", emoji: "💧" },
  { surface: "밥", emoji: "🍚" },
];

// ─── ko-m9-1 — 하고 (and) ───────────────────────────────────────────────────

const M9_1: LessonContent = {
  id: "ko-m9-1",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "하고 — and",
  description: "Join two nouns with one easy word: 하고.",
  estimatedMinutes: 5,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m9-1-info",
      "하고 = 'and' (between nouns)",
      "Put 하고 between two nouns to mean 'and'. 커피하고 빵 = 'coffee and bread'. 밥하고 물 = 'rice and water'. The best part: 하고 works after BOTH vowels and consonants, so there's no ending to choose. Attach it to the first noun.",
      "grammar",
    ),
    phrase("ko-m9-1-p-and", "and / with", "hago", "하고"),
    phrase("ko-m9-1-p-apple", "apple", "sagwa", "사과", undefined, { emoji: "🍎" }),
    vocabMcq("ko-m9-1-mcq-apple", { surface: "사과", meaningEn: "apple", emoji: "🍎" }, MCQ_POOL),
    sentenceMcq({
      id: "ko-m9-1-q-coffeebread",
      prompt: "'coffee and bread' —",
      correctHangul: "커피하고 빵",
      distractorsHangul: ["커피 빵하고", "커피를 빵", "커피하고도 빵"],
      explanation: "하고 attaches to the first noun: 커피하고 빵.",
      exercisedAtomSurfaces: ["커피", "하고", "빵"],
    }),
    cloze(
      "ko-m9-1-cloze-and",
      "밥",
      "물",
      "하고",
      ["하고", "도", "을", "에"],
      "rice and water",
      "밥하고 물",
      "하고 = 'and' between two nouns.",
    ),
    listeningCompSentence({
      id: "ko-m9-1-lc-and",
      audioText: "사과하고 우유",
      correctMeaningEn: "an apple and milk",
      distractorsEn: ["coffee and bread", "rice and water", "an apple or milk"],
      exercisedAtomSurfaces: ["사과", "하고", "우유"],
    }),
  ],
};

// ─── ko-m9-2 — 하고 = "with" ────────────────────────────────────────────────

const M9_2: LessonContent = {
  id: "ko-m9-2",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "하고 — with (someone)",
  description: "The same 하고 also means 'with a person'.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m9-2-info",
      "하고 also means 'with'",
      "Attach 하고 to a person to mean 'with them'. 친구하고 = 'with a friend'. 친구하고 영화를 봐요 = 'I watch a movie with a friend'. Same word, context tells you whether it's 'and' or 'with'.",
      "grammar",
    ),
    phrase("ko-m9-2-p-withfriend", "with a friend", "chinguhago", "친구하고"),
    sentenceMcq({
      id: "ko-m9-2-q-withfriend",
      prompt: "'with a friend' —",
      correctHangul: "친구하고",
      distractorsHangul: ["친구를", "친구도", "친구에"],
      explanation: "하고 on a person = 'with'. 친구하고.",
      exercisedAtomSurfaces: ["친구", "하고"],
    }),
    build(
      "ko-m9-2-build-watchwithfriend",
      "Build: 'I watch a movie with a friend.' (with-friend + movie + watch)",
      "친구하고 영화를 봐요",
      ["친구하고", "영화를", "봐요", "밥을"],
      ["친구하고", "영화를", "봐요"],
      ["친구", "하고", "영화", "봐요"],
    ),
    translateStep({
      id: "ko-m9-2-tr-eatwithfriend",
      promptEn: "I eat rice with a friend.",
      acceptedAnswers: ["친구하고 밥을 먹어요", "친구하고 밥을 먹어요."],
      audioText: "친구하고 밥을 먹어요",
      exercisedAtomSurfaces: ["친구", "하고", "밥", "먹어요"],
    }),
    listeningCompSentence({
      id: "ko-m9-2-lc-withfriend",
      audioText: "친구하고 커피를 마셔요",
      correctMeaningEn: "I drink coffee with a friend",
      distractorsEn: ["I drink coffee and bread", "A friend drinks coffee", "I watch a movie with a friend"],
      exercisedAtomSurfaces: ["친구", "하고", "커피", "마셔요"],
    }),
    speaking("ko-m9-2-speak-withfriend", "친구하고 영화를 봐요", "I watch a movie with a friend", ["친구", "하고", "영화", "봐요"]),
  ],
};

// ─── ko-m9-3 — 와 / 과 (formal "and") ──────────────────────────────────────

const M9_3: LessonContent = {
  id: "ko-m9-3",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "와 / 과 — the formal 'and'",
  description: "A more written-sounding 'and', split by vowel vs consonant.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m9-3-info",
      "와 (after vowel) / 과 (after consonant)",
      "와/과 is a more formal 'and' — common in writing and careful speech. Use 와 after a vowel: 커피와 우유 ('coffee and milk'). Use 과 after a consonant: 빵과 우유 ('bread and milk'). Meaning is identical to 하고; the register is just dressier.",
      "grammar",
    ),
    phrase("ko-m9-3-p-wa", "and (after a vowel)", "wa", "와"),
    phrase("ko-m9-3-p-gwa", "and (after a consonant)", "gwa", "과"),
    cloze(
      "ko-m9-3-cloze-vowel",
      "커피",
      "우유",
      "와",
      ["와", "과", "하고", "도"],
      "coffee and milk",
      "커피와 우유",
      "커피 ends in a vowel → 와.",
    ),
    cloze(
      "ko-m9-3-cloze-consonant",
      "빵",
      "우유",
      "과",
      ["과", "와", "하고", "도"],
      "bread and milk",
      "빵과 우유",
      "빵 ends in a consonant → 과.",
    ),
    sentenceMcq({
      id: "ko-m9-3-q-applemilk",
      prompt: "사과 ends in a vowel. 'an apple and milk' (formal) —",
      correctHangul: "사과와 우유",
      distractorsHangul: ["사과과 우유", "사과를 우유", "사과도 우유"],
      explanation: "사과 (vowel) → 와.",
      exercisedAtomSurfaces: ["사과", "와", "우유"],
    }),
    listeningCompSentence({
      id: "ko-m9-3-lc-breadmilk",
      audioText: "빵과 우유",
      correctMeaningEn: "bread and milk",
      distractorsEn: ["coffee and milk", "an apple and milk", "rice and water"],
      exercisedAtomSurfaces: ["빵", "과", "우유"],
    }),
  ],
};

// ─── ko-m9-4 — 도 (too / also) ──────────────────────────────────────────────

const M9_4: LessonContent = {
  id: "ko-m9-4",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "도 — too / also",
  description: "Add 'also' — and learn what it kicks out.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m9-4-info",
      "도 REPLACES the particle",
      "도 means 'too / also'. The trick: it REPLACES 은/는/이/가/을/를 — it never stacks on top of them. 저 + 도 = 저도 ('me too'), NOT 저는도. 커피도 마셔요 = 'I drink coffee too' (도 replaces 를). Attach 도 directly to the noun.",
      "grammar",
    ),
    phrase("ko-m9-4-p-metoo", "me too", "jeodo", "저도"),
    sentenceMcq({
      id: "ko-m9-4-q-metoo",
      prompt: "'me too' —",
      correctHangul: "저도",
      distractorsHangul: ["저는도", "저를도", "저도는"],
      explanation: "도 replaces the particle — 저도, never 저는도.",
      exercisedAtomSurfaces: ["저", "도"],
    }),
    cloze(
      "ko-m9-4-cloze-coffeetoo",
      "커피",
      "마셔요",
      "도",
      ["도", "를", "하고", "에"],
      "I drink coffee too.",
      "커피도 마셔요",
      "도 ('too') replaces the object particle 를.",
    ),
    sentenceMcq({
      id: "ko-m9-4-q-friendtoo",
      prompt: "'A friend goes too.' —",
      correctHangul: "친구도 가요",
      distractorsHangul: ["친구가도 가요", "친구도가 가요", "친구를도 가요"],
      explanation: "도 replaces 가 — 친구도 가요.",
      exercisedAtomSurfaces: ["친구", "도"],
    }),
    listeningCompSentence({
      id: "ko-m9-4-lc-metoo",
      audioText: "저도 가요",
      correctMeaningEn: "I'm going too",
      distractorsEn: ["I'm not going", "A friend is going", "I'm going with a friend"],
      exercisedAtomSurfaces: ["저", "도"],
    }),
    speaking("ko-m9-4-speak-metoo", "저도 가요", "I'm going too", ["저", "도"]),
  ],
};

// ─── ko-m9-5 — Putting connectors together ──────────────────────────────────

const M9_5: LessonContent = {
  id: "ko-m9-5",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Connectors together",
  description: "Mix 하고, 와/과, and 도 in real sentences.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m9-5-info",
      "Choosing your connector",
      "하고 = everyday 'and / with'. 와/과 = formal 'and'. 도 = 'too' (and it replaces the particle). 커피하고 빵을 먹어요 = 'I eat coffee and bread'. 저도 커피를 마셔요 = 'I drink coffee too'.",
      "grammar",
    ),
    build(
      "ko-m9-5-build-coffeebread",
      "Build: 'I eat coffee and bread.' (coffee + and + bread + eat)",
      "커피하고 빵을 먹어요",
      ["커피하고", "빵을", "먹어요", "마셔요"],
      ["커피하고", "빵을", "먹어요"],
      ["커피", "하고", "빵", "먹어요"],
    ),
    sentenceMcq({
      id: "ko-m9-5-q-itoo",
      prompt: "'I drink coffee too.' —",
      correctHangul: "저도 커피를 마셔요",
      distractorsHangul: ["저는도 커피를 마셔요", "저도 커피도 마셔요는", "저를 커피도 마셔요"],
      explanation: "저도 (me too) + 커피를 마셔요.",
      exercisedAtomSurfaces: ["저", "도", "커피", "마셔요"],
    }),
    translateStep({
      id: "ko-m9-5-tr-applemilk",
      promptEn: "an apple and milk",
      acceptedAnswers: ["사과하고 우유", "사과와 우유"],
      audioText: "사과하고 우유",
      exercisedAtomSurfaces: ["사과", "하고", "우유"],
    }),
    listeningCompSentence({
      id: "ko-m9-5-lc-coffeebread",
      audioText: "커피하고 빵을 먹어요",
      correctMeaningEn: "I eat coffee and bread",
      distractorsEn: ["I drink coffee and milk", "I eat bread too", "I eat rice and bread"],
      exercisedAtomSurfaces: ["커피", "하고", "빵", "먹어요"],
    }),
    speaking("ko-m9-5-speak-coffeebread", "커피하고 빵을 먹어요", "I eat coffee and bread", ["커피", "하고", "빵", "먹어요"]),
  ],
};

// ─── ko-m9-6 — More practice ────────────────────────────────────────────────

const M9_6: LessonContent = {
  id: "ko-m9-6",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Lists & company",
  description: "Stretch your connectors over longer sentences.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    sentenceMcq({
      id: "ko-m9-6-q-ricewater",
      prompt: "'rice and water' (everyday) —",
      correctHangul: "밥하고 물",
      distractorsHangul: ["밥와 물", "밥을 물하고", "밥도 물"],
      explanation: "하고 is the everyday 'and': 밥하고 물.",
      exercisedAtomSurfaces: ["밥", "하고", "물"],
    }),
    cloze(
      "ko-m9-6-cloze-withfriend",
      "친구",
      "가요",
      "하고",
      ["하고", "도", "를", "와"],
      "I go with a friend.",
      "친구하고 가요",
      "하고 on a person = 'with'.",
    ),
    build(
      "ko-m9-6-build-friendtoo",
      "Build: 'A friend studies too.' (friend + too + studies)",
      "친구도 공부해요",
      ["친구도", "공부해요", "친구를", "가요"],
      ["친구도", "공부해요"],
      ["친구", "도", "공부", "해요"],
    ),
    translateStep({
      id: "ko-m9-6-tr-metoo",
      promptEn: "Me too.",
      acceptedAnswers: ["저도", "저도요", "저도."],
      audioText: "저도",
      exercisedAtomSurfaces: ["저", "도"],
    }),
    listeningCompSentence({
      id: "ko-m9-6-lc-withfriend",
      audioText: "친구하고 공부해요",
      correctMeaningEn: "I study with a friend",
      distractorsEn: ["A friend studies too", "I study and a friend", "I go with a friend"],
      exercisedAtomSurfaces: ["친구", "하고", "공부", "해요"],
    }),
  ],
};

// ─── ko-m9-7 — Mini-dialogue ────────────────────────────────────────────────

const M9_7: LessonContent = {
  id: "ko-m9-7",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — ordering together",
  description: "Order for two and say 'me too'.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m9-7-info",
      "At the cafe, together",
      "A: 커피하고 빵 주세요. (Coffee and bread, please.)\nB: 저도 커피 주세요. (Coffee for me too, please.)\nA: 친구하고 같이 가요. (I'm going with a friend.)\nEverything here uses the connectors you just learned.",
      "default",
    ),
    build(
      "ko-m9-7-build-order",
      "Build: 'Coffee and bread, please.' (coffee + and + bread + please)",
      "커피하고 빵 주세요",
      ["커피하고", "빵", "주세요", "저도"],
      ["커피하고", "빵", "주세요"],
      ["커피", "하고", "빵", "주세요"],
    ),
    sentenceMcq({
      id: "ko-m9-7-q-metoocoffee",
      // NATIVE-REVIEW: 커피 with the object particle dropped before 주세요 is the
      // natural ordering register (matches M5); confirm 저도 커피 주세요 reads
      // naturally vs 저도 커피 주세요 with 를.
      prompt: "'Coffee for me too, please.' —",
      correctHangul: "저도 커피 주세요",
      distractorsHangul: ["저는도 커피 주세요", "저도 커피도 주세요는", "저를 커피 주세요"],
      explanation: "저도 (me too) + 커피 주세요.",
      exercisedAtomSurfaces: ["저", "도", "커피", "주세요"],
    }),
    translateStep({
      id: "ko-m9-7-tr-withfriend",
      promptEn: "I'm going with a friend.",
      // NATIVE-REVIEW: 같이 ('together') appears only in the info card; the
      // accepted answer keeps it optional so a learner isn't forced to produce
      // an untaught word.
      acceptedAnswers: ["친구하고 가요", "친구하고 가요.", "친구하고 같이 가요", "친구하고 같이 가요."],
      audioText: "친구하고 가요",
      exercisedAtomSurfaces: ["친구", "하고"],
    }),
    listeningCompSentence({
      id: "ko-m9-7-lc-order",
      audioText: "커피하고 빵 주세요",
      correctMeaningEn: "Coffee and bread, please",
      distractorsEn: ["Coffee for me too, please", "Bread and milk, please", "Coffee, please"],
      exercisedAtomSurfaces: ["커피", "하고", "빵", "주세요"],
    }),
    speaking("ko-m9-7-speak-metoo", "저도 커피 주세요", "Coffee for me too, please", ["저", "도", "커피", "주세요"]),
  ],
};

// ─── ko-m9-8 — Mastery test ─────────────────────────────────────────────────

const M9_8: LessonContent = {
  id: "ko-m9-8",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M9 Mastery Test",
  description: "하고, 와/과, and 도 — the connector toolkit.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "ko-m9-8-q-coffeebread",
      prompt: "'coffee and bread' (everyday) —",
      correctHangul: "커피하고 빵",
      distractorsHangul: ["커피와 빵", "커피 빵하고", "커피도 빵"],
      exercisedAtomSurfaces: ["커피", "하고", "빵"],
    }),
    cloze(
      "ko-m9-8-cloze-formal",
      "빵",
      "우유",
      "과",
      ["과", "와", "하고", "도"],
      "bread and milk (formal)",
      "빵과 우유",
      "빵 ends in a consonant → 과.",
    ),
    sentenceMcq({
      id: "ko-m9-8-q-metoo",
      prompt: "'me too' —",
      correctHangul: "저도",
      distractorsHangul: ["저는도", "저를도", "저도는"],
      exercisedAtomSurfaces: ["저", "도"],
    }),
    sentenceMcq({
      id: "ko-m9-8-q-withfriend",
      prompt: "'I watch a movie with a friend.' —",
      correctHangul: "친구하고 영화를 봐요",
      distractorsHangul: ["친구도 영화를 봐요", "친구를 영화하고 봐요", "친구하고 영화도 봐요는"],
      exercisedAtomSurfaces: ["친구", "하고", "영화", "봐요"],
    }),
    cloze(
      "ko-m9-8-cloze-too",
      "커피",
      "마셔요",
      "도",
      ["도", "를", "하고", "와"],
      "I drink coffee too.",
      "커피도 마셔요",
      "도 ('too') replaces 를.",
    ),
    listeningCompSentence({
      id: "ko-m9-8-lc-applemilk",
      audioText: "사과하고 우유",
      correctMeaningEn: "an apple and milk",
      distractorsEn: ["bread and milk", "coffee and bread", "an apple too"],
      exercisedAtomSurfaces: ["사과", "하고", "우유"],
    }),
    speaking("ko-m9-8-speak-recap", "친구하고 영화를 봐요", "I watch a movie with a friend", ["친구", "하고", "영화", "봐요"]),
  ],
};

export const KO_M9_LESSONS: LessonContent[] = [
  M9_1,
  M9_2,
  M9_3,
  M9_4,
  M9_5,
  M9_6,
  M9_7,
  M9_8,
];
