/**
 * M4 — Things and people (restructure 2026-05-16).
 *
 * New grammar:
 *   - の (possession + "kind of" particle)
 *   - これ/それ/あれ/どれ (the こそあど pointer system)
 *
 * Reuses M3: は + です + か appears in every drill. No new particle beyond
 * の; pointer words pattern-match against M3's これ exposure.
 *
 * Lesson list (8 lessons):
 *   M4-1  Vocab — 5 everyday objects
 *   M4-2  Grammar Rule Card — の (possession + "kind of")
 *   M4-3  Vocab + の in context (5 more vocab)
 *   M4-4  Grammar Rule Card — これ/それ/あれ/どれ
 *   M4-5  Iteration — の + pointers + は
 *   M4-6  Sentence Build (5 cumulative sentences)
 *   M4-7  Dialogue — at a friend's place
 *   M4-8  Row test (mastery ★)
 */
import type { LessonContent, MatchPairsStep, MultipleChoiceStep, RowTestItem, RowTestStep, BuildSentenceStep } from "../types";
import {
  build,
  cloze,
  dialogueLesson,
  grammarRule,
  infoStep,
  vocab,
} from "./_jaGrammarHelpers";

const COURSE = "mock-1";
const LANG = "ja";

export const M4_1: LessonContent = {
  id: "ja-m4-1",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Everyday objects",
  description: "Five concrete nouns you'll point at every day.",
  estimatedMinutes: 5,
  xpReward: 12,
  steps: [
    infoStep(
      "ja-m4-1-info-open",
      "Vocab drop",
      "Five concrete objects. Two katakana sprinkles (ペン, カメラ) — same pattern-match exposure as M3.",
    ),
    vocab("ja-m4-1-v-pen", "Pen", "pen", "ペン", "Katakana loanword."),
    vocab(
      "ja-m4-1-v-kaban",
      "Bag",
      "kaban",
      "かばん",
      "Generic for any handbag, backpack, or briefcase.",
    ),
    vocab("ja-m4-1-v-kuruma", "Car", "kuruma", "くるま"),
    vocab(
      "ja-m4-1-v-kamera",
      "Camera",
      "kamera",
      "カメラ",
      "Notice カ here is the same shape as in カメラ — angular twin of hiragana か.",
    ),
    vocab(
      "ja-m4-1-v-keitai",
      "Mobile phone",
      "keitai",
      "けいたい",
      "Literally 'portable.' Sometimes written ケータイ in katakana for emphasis.",
    ),
    infoStep(
      "ja-m4-1-info-end",
      "Object pool loaded",
      "Five objects you can now point at. Next: の, the particle that glues two nouns together.",
      "win",
    ),
  ],
};

const RULE_NO = grammarRule({
  id: "ja-m4-2-rule-no",
  title: "の — the 'kind of' particle",
  rule:
    "の sits between two nouns and means 'the [LEFT] kind of [RIGHT].' Most often this maps to English possessive 's (わたしのほん = my book). But the deeper pattern is broader: にほんのくるま = a Japanese car (Japan-kind-of car).",
  examples: [
    {
      ja: "わたしの ほんです。",
      romaji: "watashi no hon desu.",
      en: "It's my book. (the me-kind of book)",
    },
    {
      ja: "にほんの くるまです。",
      romaji: "nihon no kuruma desu.",
      en: "It's a Japanese car. (the Japan-kind of car)",
    },
  ],
  antiPattern: {
    ja: "わたし ほんです。",
    romaji: "watashi hon desu.",
    en: "(broken — missing の reads as 'I book')",
    why: "Without の the two nouns just sit next to each other and the relationship is ambiguous. の glues them: わたし + の + ほん = my book.",
  },
  cultureNote:
    "If you can rephrase the English as 'the X kind of Y,' の works. If not (verb phrases, time expressions), you need a different particle.",
});

export const M4_2: LessonContent = {
  id: "ja-m4-2",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "の — possession and 'kind of'",
  description:
    "The particle that glues two nouns. Possession is the most common use; the deeper pattern is 'kind of.'",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m4-2-info-open",
      "One particle, two flavors",
      "の glues nouns. Most of the time it means possessive 's. But it also means 'the X kind of Y' — same particle, broader pattern.",
    ),
    RULE_NO,
    cloze(
      "ja-m4-2-cloze-1",
      "わたし",
      " かばんです。",
      "の",
      ["の", "は", "が", "を"],
      "It's my bag.",
      "わたしの かばんです。",
      "わたし + の + かばん = my bag. The full sentence has です to politely assert.",
    ),
    cloze(
      "ja-m4-2-cloze-2",
      "せんせい",
      " ほんです。",
      "の",
      ["は", "の", "に", "を"],
      "It's the teacher's book.",
      "せんせいの ほんです。",
      "せんせい + の + ほん = teacher-kind-of book = the teacher's book.",
    ),
    cloze(
      "ja-m4-2-cloze-3",
      "にほん",
      " くるまです。",
      "の",
      ["は", "の", "が", "に"],
      "It's a Japanese car.",
      "にほんの くるまです。",
      "Origin/kind reading: 'Japan-kind-of car' = a Japanese car. Same particle, broader use.",
    ),
    cloze(
      "ja-m4-2-cloze-4",
      "ともだち",
      " ペンです。",
      "の",
      ["は", "の", "を", "に"],
      "It's my friend's pen.",
      "ともだちの ペンです。",
    ),
    infoStep(
      "ja-m4-2-info-end",
      "の internalized",
      "Four drills, one pattern: noun + の + noun = the L-kind of R. Next: more vocab + interleaving with は from M3.",
      "win",
    ),
  ],
};

export const M4_3: LessonContent = {
  id: "ja-m4-3",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "More objects + の in context",
  description: "Five more vocab words, each used in a の sentence.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m4-3-info-open",
      "Vocab + immediate use",
      "Five more concrete objects. Each one shows up in a sample possessive sentence so の sticks.",
    ),
    vocab("ja-m4-3-v-kasa", "Umbrella", "kasa", "かさ"),
    vocab(
      "ja-m4-3-v-jisho",
      "Dictionary",
      "jisho",
      "じしょ",
      "Mostly digital now, but the word survives for the app/site.",
    ),
    vocab("ja-m4-3-v-isu", "Chair", "isu", "いす"),
    vocab(
      "ja-m4-3-v-tegami",
      "Letter (postal)",
      "tegami",
      "てがみ",
      "Less common than email, but still the formal way to thank a host family.",
    ),
    vocab(
      "ja-m4-3-v-jitensha",
      "Bicycle",
      "jitensha",
      "じてんしゃ",
      "Tokyo runs on these for short errands.",
    ),
    cloze(
      "ja-m4-3-cloze-1",
      "これは わたし",
      " かさです。",
      "の",
      ["の", "は", "が", "を"],
      "This is my umbrella.",
      "これは わたしの かさです。",
    ),
    cloze(
      "ja-m4-3-cloze-2",
      "せんせい",
      " じしょです。",
      "の",
      ["の", "は", "が", "に"],
      "It's the teacher's dictionary.",
      "せんせいの じしょです。",
    ),
    cloze(
      "ja-m4-3-cloze-3",
      "ともだち",
      " じてんしゃですか。",
      "の",
      ["の", "は", "を", "が"],
      "Is it your friend's bicycle?",
      "ともだちの じてんしゃですか。",
    ),
    infoStep(
      "ja-m4-3-info-end",
      "Possession unlocked",
      "Five more nouns, three more の sentences. Next: the four pointer words これ/それ/あれ/どれ.",
      "win",
    ),
  ],
};

const RULE_KOSOADO = grammarRule({
  id: "ja-m4-4-rule-kosoado",
  title: "これ / それ / あれ / どれ — the four-way pointer system",
  rule:
    "Four words for the spatial 'this/that' system. これ = near me. それ = near you (the listener). あれ = far from both of us. どれ = which one (the question).",
  examples: [
    {
      ja: "これは わたしの かばんです。",
      romaji: "kore wa watashi no kaban desu.",
      en: "This (near me) is my bag.",
    },
    {
      ja: "それは なんですか。",
      romaji: "sore wa nan desu ka.",
      en: "What's that (near you)?",
    },
    {
      ja: "あれは せんせいの くるまです。",
      romaji: "are wa sensei no kuruma desu.",
      en: "That (over there) is the teacher's car.",
    },
  ],
  antiPattern: {
    ja: "これは どれですか。",
    romaji: "kore wa dore desu ka.",
    en: "(broken — 'this is which?' mixes pointer and question)",
    why: "どれ ('which one') is the question word — pair it with は marking the topic, like 'どれが あなたの ペンですか' (which is your pen?). You don't ask 'this is which.'",
  },
  cultureNote:
    "Japanese splits 'that' into two — near the listener (それ) vs far from both (あれ). English mashes them together. Pointing at something on the shop counter? それ. Pointing at a mountain in the distance? あれ.",
});

export const M4_4: LessonContent = {
  id: "ja-m4-4",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "これ / それ / あれ / どれ",
  description: "Four spatial pointers — based on distance from each speaker.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m4-4-info-open",
      "Pointing precisely",
      "English collapses 'this/that' into two words. Japanese splits it into four, organized by who's closer to the thing.",
    ),
    RULE_KOSOADO,
    cloze(
      "ja-m4-4-cloze-1",
      "それ",
      " なんですか。",
      "は",
      ["は", "が", "を", "の"],
      "What's that (near you)?",
      "それは なんですか。",
      "それ = near the listener. Topic = that. Question = what?",
    ),
    cloze(
      "ja-m4-4-cloze-2",
      "あれは せんせい",
      " くるまです。",
      "の",
      ["は", "の", "が", "に"],
      "That (over there) is the teacher's car.",
      "あれは せんせいの くるまです。",
      "Combine pointer + possessive の in one sentence.",
    ),
    cloze(
      "ja-m4-4-cloze-3",
      "これ",
      " あなたの ほんですか。",
      "は",
      ["は", "が", "を", "に"],
      "Is this your book?",
      "これは あなたの ほんですか。",
      "これ = near me. Topic = this. Question = your book?",
    ),
    infoStep(
      "ja-m4-4-info-end",
      "Four pointers, one system",
      "これ near me, それ near you, あれ far from both, どれ which. Next: interleave pointers + の + は in a mixed drill.",
      "win",
    ),
  ],
};

export const M4_5: LessonContent = {
  id: "ja-m4-5",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved drill — の + pointers + は",
  description: "Six mixed clozes. Choose the right particle from M3 + M4.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m4-5-info-open",
      "Mix and match",
      "Every drill picks between particles you've now seen. No new rules — just sorting which pattern fits.",
    ),
    cloze(
      "ja-m4-5-cloze-1",
      "わたし",
      " かばんです。",
      "の",
      ["の", "は", "が", "を"],
      "It's my bag.",
      "わたしの かばんです。",
    ),
    cloze(
      "ja-m4-5-cloze-2",
      "これ",
      " ともだちの ペンです。",
      "は",
      ["は", "の", "が", "を"],
      "This is my friend's pen.",
      "これは ともだちの ペンです。",
      "Two particles in one sentence: は marks the topic, の glues friend + pen.",
    ),
    cloze(
      "ja-m4-5-cloze-3",
      "それは ねこ",
      " ほんです。",
      "の",
      ["の", "は", "が", "を"],
      "That's the cat's book.",
      "それは ねこの ほんです。",
    ),
    cloze(
      "ja-m4-5-cloze-4",
      "あれ",
      " せんせいですか。",
      "は",
      ["は", "の", "が", "を"],
      "Is that the teacher (over there)?",
      "あれは せんせいですか。",
    ),
    cloze(
      "ja-m4-5-cloze-5",
      "あなた",
      " かさですか。",
      "の",
      ["の", "は", "を", "に"],
      "Is it your umbrella?",
      "あなたの かさですか。",
    ),
    cloze(
      "ja-m4-5-cloze-6",
      "これは にほん",
      " くるまです。",
      "の",
      ["の", "は", "が", "を"],
      "This is a Japanese car.",
      "これは にほんの くるまです。",
      "'Kind-of' reading: にほん-kind-of car = Japanese car.",
    ),
    infoStep(
      "ja-m4-5-info-end",
      "Mixed and sorted",
      "Six drills sorted across two particles. Your brain now has explicit slots for は (topic) and の (glue) — they don't get confused.",
      "win",
    ),
  ],
};

export const M4_6: LessonContent = {
  id: "ja-m4-6",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build — pointers + possessives",
  description: "Five sentences using the M4 pieces with M3 baseline.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m4-6-info-open",
      "Build five sentences",
      "Tap the tiles in order. Audio plays the finished sentence on Check.",
    ),
    build(
      "ja-m4-6-s1",
      "Say: This is my umbrella.",
      "これは わたしの かさです",
      ["これは", "わたしの", "かさです", "それは", "ともだちの"],
      ["これは", "わたしの", "かさです"],
    ),
    build(
      "ja-m4-6-s2",
      "Ask: Is that your bag?",
      "それは あなたの かばんですか",
      ["それは", "あなたの", "かばんですか", "わたしの", "これは"],
      ["それは", "あなたの", "かばんですか"],
    ),
    build(
      "ja-m4-6-s3",
      "Say: That over there is the teacher's car.",
      "あれは せんせいの くるまです",
      ["あれは", "せんせいの", "くるまです", "ともだちの", "これは"],
      ["あれは", "せんせいの", "くるまです"],
    ),
    build(
      "ja-m4-6-s4",
      "Say: It's a Japanese camera.",
      "にほんの カメラです",
      ["にほんの", "カメラです", "わたしの", "ペンです"],
      ["にほんの", "カメラです"],
    ),
    build(
      "ja-m4-6-s5",
      "Ask: Which is your dictionary?",
      "どれが あなたの じしょですか",
      ["どれが", "あなたの", "じしょですか", "どれは", "わたしの"],
      ["どれが", "あなたの", "じしょですか"],
    ),
    infoStep(
      "ja-m4-6-info-end",
      "Production locked",
      "Five sentences combining M3 + M4 grammar. Two new pieces, full flexibility.",
      "win",
    ),
  ],
};

export const M4_7: LessonContent = {
  id: "ja-m4-7",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — at a friend's place",
  description:
    "Identifying objects. 'Whose is this?' / 'Which one?' — natural use of の and the pointer system.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m4-7-info-open",
      "Drop into the scene",
      "You're at a friend's apartment. There are a few objects on the table — who do they belong to?",
      "culture",
    ),
    ...dialogueLesson({
      idPrefix: "ja-m4-7",
      representative: {
        phrase: "それは ともだちの ペンです",
        translation: "That's my friend's pen.",
      },
      lines: [
        {
          speaker: "Friend",
          meaningEn: "Is that your bag?",
          romaji: "sore wa anata no kaban desu ka",
          kana: "それは あなたの かばんですか",
          speakingPhrase: "それは あなたの かばんですか",
        },
        {
          speaker: "You",
          meaningEn: "Yes, it's mine.",
          romaji: "hai, watashi no desu",
          kana: "はい、わたしのです",
          cultureNote: "When the noun is obvious from context (the bag we're looking at), you can drop it and just say 'わたしの' = 'mine.'",
        },
        {
          speaker: "Friend",
          meaningEn: "And this pen?",
          romaji: "kono pen wa",
          kana: "このペンは？",
          cultureNote: "この + noun is a shorter way to say 'this [noun]' — preview of next module.",
        },
        {
          speaker: "You",
          meaningEn: "That's my friend's pen.",
          romaji: "sore wa tomodachi no pen desu",
          kana: "それは ともだちの ペンです",
          speakingPhrase: "それは ともだちの ペンです",
        },
      ],
    }),
    infoStep(
      "ja-m4-7-info-end",
      "Object talk",
      "Four lines, real flow. You can now identify and possess objects — half of small-talk Japanese.",
      "win",
    ),
  ],
};

function particleMc(
  id: string,
  prompt: string,
  audioText: string,
  correct: string,
  distractors: [string, string, string],
  explanation: string,
): MultipleChoiceStep {
  return {
    id,
    type: "multiple_choice",
    prompt,
    promptAudioText: audioText,
    options: [
      { id: "correct", text: correct },
      { id: "opt-1", text: distractors[0] },
      { id: "opt-2", text: distractors[1] },
      { id: "opt-3", text: distractors[2] },
    ],
    correctOptionId: "correct",
    explanation,
    optionsHideRomaji: true,
  };
}

const M4_TEST_ITEMS: RowTestItem[] = [
  {
    kind: "mc",
    payload: particleMc(
      "ja-m4-8-mc-1",
      "わたし___ かばんです。 (It's my bag.)",
      "わたしの かばんです",
      "の",
      ["は", "が", "を"],
      "わたし + の + かばん = my bag.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m4-8-mc-2",
      "これは せんせい___ ほんです。 (This is the teacher's book.)",
      "これは せんせいの ほんです",
      "の",
      ["は", "が", "を"],
      "せんせい + の + ほん = teacher's book.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m4-8-mc-3",
      "それ___ なんですか。 (What's that?)",
      "それは なんですか",
      "は",
      ["の", "が", "を"],
      "それ as topic — 'as for that thing near you, what is it?'",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m4-8-mc-4",
      "あれは ともだち___ くるまです。 (That over there is my friend's car.)",
      "あれは ともだちの くるまです",
      "の",
      ["は", "が", "を"],
      "ともだち + の + くるま = friend's car.",
    ),
  },
  {
    kind: "match",
    payload: {
      id: "ja-m4-8-match",
      type: "match_pairs",
      prompt: "Match each Japanese word to its meaning",
      pairs: [
        { id: "p1", source: "ペン", target: "pen", sourceAnnotation: [{ surface: "ペン", reading: "ペン" }] },
        { id: "p2", source: "かばん", target: "bag", sourceAnnotation: [{ surface: "かばん", reading: "かばん" }] },
        { id: "p3", source: "くるま", target: "car", sourceAnnotation: [{ surface: "くるま", reading: "くるま" }] },
        { id: "p4", source: "かさ", target: "umbrella", sourceAnnotation: [{ surface: "かさ", reading: "かさ" }] },
        { id: "p5", source: "じしょ", target: "dictionary", sourceAnnotation: [{ surface: "じしょ", reading: "じしょ" }] },
        { id: "p6", source: "カメラ", target: "camera", sourceAnnotation: [{ surface: "カメラ", reading: "カメラ" }] },
      ],
    } as MatchPairsStep,
  },
  {
    kind: "build",
    payload: {
      id: "ja-m4-8-build",
      type: "build_sentence",
      prompt: "Say: This is my friend's pen.",
      targetSentence: "これは ともだちの ペンです",
      tiles: ["これは", "ともだちの", "ペンです", "それは", "わたしの"],
      correctOrder: ["これは", "ともだちの", "ペンです"],
      granularity: "word",
      audioKey: "これは ともだちの ペンです",
      targetAnnotation: [{ surface: "これは ともだちの ペンです", reading: "これは ともだちの ペンです" }],
    } as BuildSentenceStep,
  },
];

const M4_ROW_TEST: RowTestStep = {
  id: "ja-m4-8-test",
  type: "row_test",
  rowId: "m4",
  items: M4_TEST_ITEMS,
  passThreshold: 0.7,
  maxRetries: 3,
};

export const M4_8: LessonContent = {
  id: "ja-m4-8",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "M4 Mastery Test",
  description: "Cumulative test of M4 grammar + vocab. Wrong answers re-queue — no fail.",
  estimatedMinutes: 6,
  xpReward: 30,
  steps: [
    infoStep(
      "ja-m4-8-info-open",
      "Module 4 mastery",
      "Cumulative items across の, pointers, and vocab. Missed items re-queue at the back. Pass once and Module 4 is mastered.",
    ),
    M4_ROW_TEST,
    infoStep(
      "ja-m4-8-info-end",
      "Module 4 complete",
      "You can identify and possess objects across four spatial distances. M5 adds numbers and the people-counter — counting comes next.",
      "win",
    ),
  ],
};
