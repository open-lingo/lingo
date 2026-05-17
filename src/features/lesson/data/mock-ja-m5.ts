/**
 * M5 — Numbers (restructure 2026-05-16).
 *
 * New grammar:
 *   - Numbers 1-10 (Sino-Japanese: いち, に, さん…)
 *   - Counter 人 (people only) — other counters interleave later in M6+
 *
 * Reuses M3+M4: every drill leans on は + です + の + pointers. Café
 * dialogue lives here (it's the natural fit — uses numbers + ください).
 *
 * Lesson list (8 lessons):
 *   M5-1  Numbers 1-5 + intro
 *   M5-2  Numbers 6-10 + ください pattern
 *   M5-3  人 counter (ひとり/ふたり/さんにん + the "use the people-counter at restaurants" idiom)
 *   M5-4  Vocab — café + money + ください essentials
 *   M5-5  Iteration drill — numbers + これ/それ + ください
 *   M5-6  Sentence Build (5 transactional sentences)
 *   M5-7  Dialogue — ordering at a café (from M3 v1, expanded)
 *   M5-8  Row test (mastery ★)
 */
import type {
  LessonContent,
  MatchPairsStep,
  MultipleChoiceStep,
  RowTestItem,
  RowTestStep,
  BuildSentenceStep,
} from "../types";
import {
  build,
  cloze,
  dialogueLesson,
  infoStep,
  phrase,
  vocab,
} from "./_jaGrammarHelpers";

const COURSE = "mock-1";
const LANG = "ja";

export const M5_1: LessonContent = {
  id: "ja-m5-1",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Numbers 1–5",
  description: "The first half of the Sino-Japanese counting system.",
  estimatedMinutes: 5,
  xpReward: 12,
  steps: [
    infoStep(
      "ja-m5-1-info-open",
      "Numbers — yes, there are two systems",
      "Japanese has two number systems: Sino-Japanese (いち, に, さん…) used for math, money, time, addresses, and counting most things; and Native (ひとつ, ふたつ…) used for generic objects. We teach the Sino set first — it's what you hear at the register, at train platforms, and in addresses.",
      "culture",
    ),
    vocab("ja-m5-1-1", "1 (one)", "ichi", "いち"),
    vocab("ja-m5-1-2", "2 (two)", "ni", "に"),
    vocab("ja-m5-1-3", "3 (three)", "san", "さん"),
    vocab(
      "ja-m5-1-4",
      "4 (four)",
      "yon",
      "よん",
      "Also pronounced 'shi' — but 'shi' overlaps with 'death,' so most modern speakers prefer 'yon' for clarity.",
    ),
    vocab("ja-m5-1-5", "5 (five)", "go", "ご"),
    infoStep(
      "ja-m5-1-info-end",
      "Half-way to ten",
      "Five numbers loaded. Next: 6 through 10, plus the ください pattern that turns numbers into orders.",
      "win",
    ),
  ],
};

export const M5_2: LessonContent = {
  id: "ja-m5-2",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Numbers 6–10 + ください",
  description: "Finish counting to 10 and learn the order pattern.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m5-2-info-open",
      "Round out the set",
      "Five more numbers, then the magic word — ください. Pattern: [item] [number] ください = 'N of these, please.'",
    ),
    vocab("ja-m5-2-6", "6 (six)", "roku", "ろく"),
    vocab(
      "ja-m5-2-7",
      "7 (seven)",
      "nana",
      "なな",
      "Also pronounced 'shichi.' 'Nana' is preferred when 'shichi' could be misheard as いち.",
    ),
    vocab("ja-m5-2-8", "8 (eight)", "hachi", "はち"),
    vocab(
      "ja-m5-2-9",
      "9 (nine)",
      "kyuu",
      "きゅう",
      "Also 'ku' — but 'ku' overlaps with the word for 'pain/suffering,' so 'kyuu' wins in most contexts.",
    ),
    vocab("ja-m5-2-10", "10 (ten)", "juu", "じゅう"),
    phrase(
      "ja-m5-2-kudasai",
      "Please give me / I'll have",
      "kudasai",
      "ください",
      "Goes after a noun. 'コーヒー ください' = coffee, please.",
    ),
    phrase(
      "ja-m5-2-order-1",
      "Two beers, please.",
      "biiru futatsu kudasai",
      "ビール ふたつ ください",
      "ふたつ (futatsu) is the native counter for two generic things — used heavily at restaurants where you don't know the specific counter for an item.",
    ),
    infoStep(
      "ja-m5-2-info-end",
      "1–10 + ください",
      "You can count to ten and ask for things by quantity. Next: the people-counter — special readings for 1 and 2 people.",
      "win",
    ),
  ],
};

export const M5_3: LessonContent = {
  id: "ja-m5-3",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Counting people — 人 (nin / r)",
  description:
    "The people-counter. Special readings for 1 and 2 people; regular from 3 onward.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m5-3-info-open",
      "Counters — why Japanese doesn't say 'three cats'",
      "Japanese doesn't say 'three cats' — it says 'cats, three [animal-counter].' Each category has its own counter. We start with 人 (the people-counter) because every restaurant entrance asks you 'how many people?'",
      "grammar",
    ),
    vocab(
      "ja-m5-3-hitori",
      "1 person",
      "hitori",
      "ひとり",
      "1 and 2 people use NATIVE readings, not Sino. ひとり, ふたり. From 3 onward it's regular: さんにん, よにん.",
    ),
    vocab("ja-m5-3-futari", "2 people", "futari", "ふたり"),
    vocab(
      "ja-m5-3-sannin",
      "3 people",
      "san nin",
      "さんにん",
      "From 3 onward: number + にん. 4 people = よにん, 5 people = ごにん, etc.",
    ),
    vocab("ja-m5-3-yonin", "4 people", "yo nin", "よにん"),
    vocab("ja-m5-3-gonin", "5 people", "go nin", "ごにん"),
    infoStep(
      "ja-m5-3-info-restaurant",
      "At a restaurant entrance",
      "Staff will ask 'なんめいさまですか' (how many people?). You answer with the people-counter: 'さんにんです.' (Three.) The Native readings for 1 and 2 (ひとり, ふたり) are baked into every Japanese person — say 'いちにん' or 'ににん' and they'll smile and gently correct you.",
      "culture",
    ),
    phrase(
      "ja-m5-3-table-2",
      "A table for two, please.",
      "futari desu",
      "ふたりです",
      "Short and sufficient at the entrance. Just the counter + です.",
    ),
    infoStep(
      "ja-m5-3-info-end",
      "Counter pool — 人 loaded",
      "You can count people. Other counters (個 small objects, 本 long objects, 匹 small animals, 杯 cups) sprinkle in over the next modules — for now, 人 covers every group-of-people interaction.",
      "win",
    ),
  ],
};

export const M5_4: LessonContent = {
  id: "ja-m5-4",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Café + transactions",
  description: "Five vocab words that turn numbers into real orders.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m5-4-info-open",
      "Money + food = numbers in action",
      "Five vocab words centered on cafés and shops. Each one pairs naturally with the numbers + ください pattern.",
    ),
    vocab(
      "ja-m5-4-okane",
      "Money",
      "okane",
      "おかね",
      "The お prefix is a politeness marker — strip it for casual use, keep it for shops.",
    ),
    vocab(
      "ja-m5-4-ikura",
      "How much?",
      "ikura",
      "いくら",
      "'いくらですか' is the universal price question.",
    ),
    vocab(
      "ja-m5-4-en",
      "Yen",
      "en",
      "えん",
      "Written 円. Pronounced 'en' (no 'y' sound). 'A thousand yen' = せんえん.",
    ),
    vocab(
      "ja-m5-4-mizu",
      "Water",
      "mizu",
      "みず",
      "Reused from M3 — comes back as 'みず ください' (water, please) at every restaurant.",
    ),
    vocab(
      "ja-m5-4-ocha",
      "Green tea",
      "ocha",
      "おちゃ",
      "Free at most sit-down restaurants — just ask 'おちゃ ください.'",
    ),
    phrase(
      "ja-m5-4-three-coffees",
      "Three coffees, please.",
      "koohii mittsu kudasai",
      "コーヒー みっつ ください",
      "みっつ = 3 generic things. Numbers + ください = orders.",
    ),
    infoStep(
      "ja-m5-4-info-end",
      "Order vocab loaded",
      "Five vocab + the ください pattern + numbers = you can order anything by quantity. Next: interleave with M3+M4 grammar in a mixed drill.",
      "win",
    ),
  ],
};

export const M5_5: LessonContent = {
  id: "ja-m5-5",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved drill — numbers + pointers + は",
  description: "Six mixed clozes drawing from M3 + M4 + M5.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m5-5-info-open",
      "Three modules, one drill",
      "Six mixed particles + a transaction context. No new rules — just sorting which fits.",
    ),
    cloze(
      "ja-m5-5-cloze-1",
      "これ",
      " いくらですか。",
      "は",
      ["は", "が", "の", "を"],
      "How much is this?",
      "これは いくらですか。",
      "Topic = this. Question = how much?",
    ),
    cloze(
      "ja-m5-5-cloze-2",
      "あれは わたし",
      " かばんです。",
      "の",
      ["の", "は", "が", "を"],
      "That over there is my bag.",
      "あれは わたしの かばんです。",
    ),
    cloze(
      "ja-m5-5-cloze-3",
      "コーヒー",
      " いくらですか。",
      "は",
      ["は", "の", "が", "を"],
      "How much is the coffee?",
      "コーヒーは いくらですか。",
    ),
    cloze(
      "ja-m5-5-cloze-4",
      "それ",
      " せんせいの ペンですか。",
      "は",
      ["は", "の", "が", "を"],
      "Is that the teacher's pen?",
      "それは せんせいの ペンですか。",
    ),
    cloze(
      "ja-m5-5-cloze-5",
      "おちゃ",
      " おねがいします。",
      "を",
      ["を", "は", "が", "の"],
      "Green tea, please.",
      "おちゃを おねがいします。",
      "Hint — を marks the thing you want (preview of M7's を particle). おねがいします = please (more formal than ください).",
    ),
    cloze(
      "ja-m5-5-cloze-6",
      "ふたり",
      "。",
      "です",
      ["です", "は", "の", "が"],
      "(A table for) two.",
      "ふたりです。",
      "Counter + です. Trick option — です is the answer here, not a particle.",
    ),
    infoStep(
      "ja-m5-5-info-end",
      "Three modules synthesized",
      "You're now drilling across M3 + M4 + M5 in one lesson. The patterns are stacking.",
      "win",
    ),
  ],
};

export const M5_6: LessonContent = {
  id: "ja-m5-6",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build — at the café",
  description: "Five transactional sentences.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m5-6-info-open",
      "Five transactions",
      "Tap the tiles. Each sentence is something you'd actually say at a counter.",
    ),
    build(
      "ja-m5-6-s1",
      "Order: Two coffees, please.",
      "コーヒー ふたつ ください",
      ["コーヒー", "ふたつ", "ください", "ビール", "ひとつ"],
      ["コーヒー", "ふたつ", "ください"],
    ),
    build(
      "ja-m5-6-s2",
      "Ask: How much is this?",
      "これは いくらですか",
      ["これは", "いくらですか", "それは", "なんですか"],
      ["これは", "いくらですか"],
    ),
    build(
      "ja-m5-6-s3",
      "Say: (A table for) three people.",
      "さんにんです",
      ["さんにんです", "ふたりです", "ひとりです", "よにんです"],
      ["さんにんです"],
    ),
    build(
      "ja-m5-6-s4",
      "Order: Water, please.",
      "みず ください",
      ["みず", "ください", "おちゃ", "ビール", "おねがいします"],
      ["みず", "ください"],
    ),
    build(
      "ja-m5-6-s5",
      "Ask: How much is the dictionary?",
      "じしょは いくらですか",
      ["じしょは", "いくらですか", "ほんは", "なんですか"],
      ["じしょは", "いくらですか"],
    ),
    infoStep(
      "ja-m5-6-info-end",
      "Café Japanese unlocked",
      "Five transactions, full sentences. You can now navigate a café from entry to payment.",
      "win",
    ),
  ],
};

export const M5_7: LessonContent = {
  id: "ja-m5-7",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — ordering coffee",
  description: "A four-line café exchange using M5 numbers + ください + M3 politeness.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m5-7-info-open",
      "Drop into the scene",
      "You walk into a Tokyo café. Staff greets you, you order, confirm, thank. Every word and grammar piece is from M3-M5.",
      "culture",
    ),
    ...dialogueLesson({
      idPrefix: "ja-m5-7",
      representative: {
        phrase: "コーヒー ふたつ ください",
        translation: "Two coffees, please.",
      },
      lines: [
        {
          speaker: "Staff",
          meaningEn: "Welcome.",
          romaji: "irasshaimase",
          kana: "いらっしゃいませ",
          cultureNote: "The greeting every shop, restaurant, and café staffer uses when you walk in. Don't reply — a nod is enough.",
        },
        {
          speaker: "You",
          meaningEn: "Two coffees, please.",
          romaji: "koohii futatsu kudasai",
          kana: "コーヒー ふたつ ください",
          speakingPhrase: "コーヒー ふたつ ください",
        },
        {
          speaker: "Staff",
          meaningEn: "Is that everything?",
          romaji: "ijou de yoroshii desu ka",
          kana: "いじょうで よろしいですか",
          cultureNote: "Formal version of 'is that all?' Yoroshii is the polite form of 'good/OK.'",
        },
        {
          speaker: "You",
          meaningEn: "Yes. Thank you.",
          romaji: "hai. arigatou gozaimasu",
          kana: "はい。ありがとうございます",
          speakingPhrase: "はい。ありがとうございます",
        },
      ],
    }),
    infoStep(
      "ja-m5-7-info-end",
      "Café exchange handled",
      "Four lines, real rhythm. The staffer will speak faster IRL — but the pattern is exactly what you just practiced.",
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

const M5_TEST_ITEMS: RowTestItem[] = [
  {
    kind: "mc",
    payload: particleMc(
      "ja-m5-8-mc-1",
      "これ___ いくらですか。 (How much is this?)",
      "これは いくらですか",
      "は",
      ["の", "が", "を"],
      "Topic + price question.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m5-8-mc-2",
      "コーヒー___ いくらですか。 (How much is the coffee?)",
      "コーヒーは いくらですか",
      "は",
      ["の", "が", "を"],
      "Topic = coffee.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m5-8-mc-3",
      "わたし___ ペンです。 (It's my pen.)",
      "わたしの ペンです",
      "の",
      ["は", "が", "を"],
      "Possessive — reused from M4.",
    ),
  },
  {
    kind: "match",
    payload: {
      id: "ja-m5-8-match-numbers",
      type: "match_pairs",
      prompt: "Match each number to its meaning",
      pairs: [
        { id: "p1", source: "いち", target: "1", sourceAnnotation: [{ surface: "いち", reading: "いち" }] },
        { id: "p2", source: "さん", target: "3", sourceAnnotation: [{ surface: "さん", reading: "さん" }] },
        { id: "p3", source: "よん", target: "4", sourceAnnotation: [{ surface: "よん", reading: "よん" }] },
        { id: "p4", source: "なな", target: "7", sourceAnnotation: [{ surface: "なな", reading: "なな" }] },
        { id: "p5", source: "じゅう", target: "10", sourceAnnotation: [{ surface: "じゅう", reading: "じゅう" }] },
        { id: "p6", source: "ふたり", target: "2 people", sourceAnnotation: [{ surface: "ふたり", reading: "ふたり" }] },
      ],
    } as MatchPairsStep,
  },
  {
    kind: "build",
    payload: {
      id: "ja-m5-8-build",
      type: "build_sentence",
      prompt: "Order: Two coffees, please.",
      targetSentence: "コーヒー ふたつ ください",
      tiles: ["コーヒー", "ふたつ", "ください", "ビール", "ひとつ"],
      correctOrder: ["コーヒー", "ふたつ", "ください"],
      granularity: "word",
      audioKey: "コーヒー ふたつ ください",
      targetAnnotation: [{ surface: "コーヒー ふたつ ください", reading: "コーヒー ふたつ ください" }],
    } as BuildSentenceStep,
  },
];

const M5_ROW_TEST: RowTestStep = {
  id: "ja-m5-8-test",
  type: "row_test",
  rowId: "m5",
  items: M5_TEST_ITEMS,
  passThreshold: 0.7,
  maxRetries: 3,
};

export const M5_8: LessonContent = {
  id: "ja-m5-8",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "M5 Mastery Test",
  description: "Cumulative test of M5 numbers + counters + transactional grammar.",
  estimatedMinutes: 6,
  xpReward: 30,
  steps: [
    infoStep(
      "ja-m5-8-info-open",
      "Module 5 mastery",
      "Cumulative items across numbers, the people-counter, and the price/order pattern. Wrong answers re-queue. Pass once and Module 5 is mastered.",
    ),
    M5_ROW_TEST,
    infoStep(
      "ja-m5-8-info-end",
      "Module 5 complete",
      "You can count, order, and pay. M6 adds locations — where things are, where actions happen — plus the existence-pattern that finally introduces が.",
      "win",
    ),
  ],
};
