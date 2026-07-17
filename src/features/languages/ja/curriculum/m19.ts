/**
 * M19 — Family & People (2026-05-25).
 *
 * M19 introduces:
 *   - Family register system: うち (in-group/humble) vs よそ (out-group/honorific)
 *     ちち vs おとうさん, はは vs おかあさん, etc.
 *   - Counter 〜さい/歳 (age): いっさい, にさい, さんさい, …
 *   - 〜にんかぞく (X-person family)
 *
 * Key cultural concept: When talking about YOUR family to others, use
 * plain/humble forms (ちち, はは). When talking about SOMEONE ELSE's family
 * or addressing your own family members directly, use honorific forms
 * (おとうさん, おかあさん).
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * ID scheme: ja-m19-{n}-{sub} e.g. ja-m19-1-1, ja-m19-1-2
 * Export names: M19_1_1, M19_1_2, M19_2_1, M19_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m19-1, etc.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  cloze,
  dialogueListen,
  grammarRule,
  listeningBuildSentence,
  listeningCompSentence,
  M3_M7_REVIEW_POOL,
  withoutMcqBlocked,
  pickReviewAtoms,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  storyComprehension,
  translateStep,
  vocabMcq,
  assertNoSameAnswerCluster,
  assertAnswerRotation,
  assertNoConsecutiveSame,
} from "@/features/languages/ja/grammarHelpers";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  assertPassiveCardsHaveFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// Per-sub-lesson review-atom draws. Pool is M3-M7.
// ───────────────────────────────────────────────────────────────────────
const M19_REVIEW_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter(
    (a) =>
      a.fromModule === "m3" ||
      a.fromModule === "m4" ||
      a.fromModule === "m5" ||
      a.fromModule === "m6" ||
      a.fromModule === "m7",
  ),
);

// ═══════════════════════════════════════════════════════════════════════
// Grammar rules (defined once, reused across sub-lessons)
// ═══════════════════════════════════════════════════════════════════════

const RULE_FAMILY_REGISTER = grammarRule({
  id: "ja-m19-rule-family-register",
  grammarPointId: "family-register",
  title: "うち vs よそ — Talking about family",
  rule:
    "Japanese has two sets of family words. When talking about YOUR family to outsiders, use humble/plain forms (ちち, はは, あに, あね). When talking about SOMEONE ELSE's family OR addressing your own family members directly, use honorific forms (おとうさん, おかあさん, おにいさん, おねえさん). This is the うち (in-group) vs よそ (out-group) distinction.",
  examples: [
    {
      ja: "ちちは かいしゃいんです。",
      romaji: "chichi wa kaishain desu.",
      en: "My father is a company employee. (talking about your own father to others)",
    },
    {
      ja: "おとうさんは おげんきですか。",
      romaji: "otousan wa ogenki desu ka.",
      en: "Is your father well? (asking about someone else's father)",
    },
    {
      ja: "はは は りょうりが じょうずです。",
      romaji: "haha wa ryouri ga jouzu desu.",
      en: "My mother is good at cooking. (talking about your own mother to others)",
    },
  ],
  antiPattern: {
    ja: "おかあさんは りょうりが じょうずです。",
    romaji: "okaasan wa ryouri ga jouzu desu.",
    en: "(wrong register — talking about YOUR mother to an outsider should use はは, not おかあさん)",
    why: "When describing your own family to someone outside your family, humble forms show respect to the listener. おかあさん elevates your own family, which is inappropriate.",
  },
  cultureNote:
    "This うち/よそ distinction is one of the most important cultural concepts in Japanese. It applies to all family members and reflects the value of modesty about one's own group.",
});

const RULE_SAI_COUNTER = grammarRule({
  id: "ja-m19-rule-sai-counter",
  grammarPointId: "counter-sai",
  title: "〜さい / 歳 — counting age",
  rule:
    "To say someone's age, use the number + さい (歳). Most numbers follow regular counting: にさい (2), さんさい (3). Watch for sound changes: いっさい (1), はっさい (8), じゅっさい (10). To ask age: なんさいですか or おいくつですか (polite).",
  examples: [
    {
      ja: "わたしは にじゅうごさいです。",
      romaji: "watashi wa nijuugo-sai desu.",
      en: "I am 25 years old.",
    },
    {
      ja: "いもうとは はっさいです。",
      romaji: "imouto wa hassai desu.",
      en: "My younger sister is 8 years old.",
    },
    {
      ja: "おいくつですか。",
      romaji: "oikutsu desu ka.",
      en: "How old are you? (polite)",
    },
  ],
  antiPattern: {
    ja: "いちさいです。",
    romaji: "ichisai desu.",
    en: "(broken — 1 year old has a sound change: いっさい, not いちさい)",
    why: "Counter sound changes: いち → いっ (1), はち → はっ (8), じゅう → じゅっ (10). These are mandatory.",
  },
  cultureNote:
    "おいくつですか is the polite way to ask age. なんさいですか is more direct and used for children. Asking an adult's age can be impolite in Japan.",
});

const RULE_NIN_KAZOKU = grammarRule({
  id: "ja-m19-rule-nin-kazoku",
  grammarPointId: "counter-nin",
  title: "〜にんかぞく — X-person family",
  rule:
    "To describe family size, use number + にんかぞく: ごにんかぞく = 'a family of five.' For asking: なんにんかぞくですか. Remember ひとり (1 person) and ふたり (2 people) use native Japanese numbers; さんにん (3+) use Sino-Japanese.",
  examples: [
    {
      ja: "わたしは よにんかぞくです。",
      romaji: "watashi wa yonin-kazoku desu.",
      en: "I'm from a family of four.",
    },
    {
      ja: "ごにんかぞくです。",
      romaji: "gonin-kazoku desu.",
      en: "We're a family of five.",
    },
    {
      ja: "なんにんかぞくですか。",
      romaji: "nannin-kazoku desu ka.",
      en: "How many people are in your family?",
    },
  ],
  antiPattern: {
    ja: "いちにんかぞくです。",
    romaji: "ichinin-kazoku desu.",
    en: "(broken — one person uses ひとり, not いちにん)",
    why: "The first two person counters use native Japanese: ひとり (1), ふたり (2). From three onward, use Sino-Japanese: さんにん, よにん, ごにん.",
  },
  cultureNote:
    "Japanese families today average 2.3 members. The traditional ideal was a large multi-generational household — おじいさん, おばあさん, parents, and children under one roof.",
});

// ═══════════════════════════════════════════════════════════════════════
// M19-1-1 — "My family" intro (parents)
//   (ちち/おとうさん, はは/おかあさん, family register rule)
// ═══════════════════════════════════════════════════════════════════════

const M19_1_1_REVIEW = pickReviewAtoms("ja-m19-1-1-rev", M19_REVIEW_POOL, 4);

export const M19_1_1: LessonContent = {
  id: "ja-m19-1-1",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "My family — Parents",
  description:
    "Learn the humble/honorific pairs for father and mother, plus the family register rule.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_FAMILY_REGISTER,
    // ── ちち (humble: father) ──
    build(
      "ja-m19-1-1-build-chichi",
      "Pick the humble word for: my father",
      "ちち",
      ["おかあさん", "はは", "ちち", "おとうさん"],
      ["ちち"],
    ),
    listeningCompSentence({
      id: "ja-m19-1-1-lc-chichi",
      audioText: "ちちは かいしゃいんです",
      correctMeaningEn: "My father is a company employee.",
      distractorsEn: [
        "Your father is a company employee.",
        "My mother is a company employee.",
        "My father is a teacher.",
      ],
    }),
    // ── おとうさん (honorific: father) ──
    build(
      "ja-m19-1-1-build-otousan",
      "Pick the honorific word for: (someone else's) father",
      "おとうさん",
      ["はは", "ちち", "おとうさん", "おかあさん"],
      ["おとうさん"],
    ),
    sentenceMcq({
      id: "ja-m19-1-1-mcq-otousan",
      prompt: "Asking about a friend's father: 'Is your father a teacher?'",
      correctKana: "おとうさんは せんせいですか。",
      distractorsKana: [
        "ちちは せんせいですか。",
        "おかあさんは せんせいですか。",
        "おとうさんは がくせいですか。",
      ],
      explanation: "おとうさん = someone else's father. ちち = my father (when talking to outsiders).",
    }),
    // ── はは (humble: mother) ──
    build(
      "ja-m19-1-1-build-haha",
      "Pick the humble word for: my mother",
      "はは",
      ["ちち", "おかあさん", "おとうさん", "はは"],
      ["はは"],
    ),
    speaking("ja-m19-1-1-speak-haha", "はは", "Mother (humble)"),
    // ── おかあさん (honorific: mother) ──
    build(
      "ja-m19-1-1-build-okaasan",
      "Pick the honorific word for: (someone else's) mother",
      "おかあさん",
      ["ちち", "おとうさん", "おかあさん", "はは"],
      ["おかあさん"],
    ),
    listeningCompSentence({
      id: "ja-m19-1-1-lc-okaasan",
      audioText: "おかあさんは おげんきですか",
      correctMeaningEn: "Is your mother well?",
      distractorsEn: [
        "Is my mother well?",
        "Is your father well?",
        "My mother is well.",
      ],
    }),
    // ── Register drill ──
    cloze(
      "ja-m19-1-1-cloze-register-1",
      "",
      "は ぎんこうで はたらいています。",
      "ちち",
      ["ちち", "おとうさん", "はは", "おかあさん"],
      "My father works at a bank. (telling a friend)",
      "ちちは ぎんこうで はたらいています。",
      "Talking about YOUR father to an outsider → humble form ちち.",
    ),
    build(
      "ja-m19-1-1-build-haha-sentence",
      "Say: My mother is a teacher.",
      "ははは せんせいです",
      ["は", "です", "せんせい", "がくせい", "はは", "ちち"],
      ["はは", "は", "せんせい", "です"],
    ),
    sentenceMcq({
      id: "ja-m19-1-1-mcq-register",
      prompt: "You are telling a classmate about YOUR father. Which is correct?",
      correctKana: "ちちは いしゃです。",
      distractorsKana: [
        "おとうさんは いしゃです。",
        "ちちは いしゃですか。",
        "おとうさんが いしゃです。",
      ],
      explanation: "When talking about YOUR father to an outsider, use the humble form ちち.",
    }),
    cloze(
      "ja-m19-1-1-cloze-register-2",
      "",
      "は ねこが すきですか。",
      "おかあさん",
      ["おかあさん", "はは", "おとうさん", "ちち"],
      "Does your mother like cats? (asking a friend)",
      "おかあさんは ねこが すきですか。",
      "Asking about SOMEONE ELSE's mother → honorific form おかあさん.",
    ),
    selfExplain({
      id: "ja-m19-1-1-self-explain",
      anchorLabel: "ちち vs おとうさん",
      anchorAudioText: "ちちは かいしゃいんです",
      question: "Why ちち and not おとうさん here?",
      rule: { text: "When talking about YOUR family to outsiders, use humble forms (ちち). おとうさん is used for someone else's father or when addressing your own father directly." },
      surface: { text: "ちち is shorter, so it's used in formal sentences." },
      distractor: { text: "ちち is for older fathers and おとうさん is for younger fathers." },
      ruleExplanation:
        "The うち/よそ register system: humble forms for your own family, honorific forms for others' family.",
    }),
    speaking(
      "ja-m19-1-1-speak-sentence",
      "ははは りょうりが じょうずです",
      "My mother is good at cooking.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-1-1-rev-mcq-1", M19_1_1_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-1-1-rev-lc-1",
      audioText: "わたしは アメリカから きました",
      correctMeaningEn: "I came from America.",
      distractorsEn: [
        "I came from Japan.",
        "I am going to America.",
        "I live in America.",
      ],
      exercisedAtomKanas: ["アメリカ"],
    }),
    speaking("ja-m19-1-1-rev-speak-1", M19_1_1_REVIEW[2].kana, M19_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-1-1-rev", M19_1_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M19_1_1.steps);
assertAnswerRotation(M19_1_1.steps, 1);
assertNoConsecutiveSame(M19_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-1-2 — "My family" drill (parents register practice)
// ═══════════════════════════════════════════════════════════════════════

const M19_1_2_REVIEW = pickReviewAtoms("ja-m19-1-2-rev", M19_REVIEW_POOL, 4);

export const M19_1_2: LessonContent = {
  id: "ja-m19-1-2",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "My family — Parents drill",
  description:
    "Practice choosing the correct register for father/mother in context.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── Register discrimination ──
    sentenceMcq({
      id: "ja-m19-1-2-mcq-1",
      prompt: "A colleague asks about YOUR mother. Which do you say?",
      correctKana: "ははは びょういんで はたらいています。",
      distractorsKana: [
        "おかあさんは びょういんで はたらいています。",
        "ははは びょういんに います。",
        "おかあさんが びょういんで はたらいています。",
      ],
      explanation: "Talking about YOUR mother to an outsider → はは (humble).",
    }),
    build(
      "ja-m19-1-2-build-otousan-q",
      "Ask: Is your father well?",
      "おとうさんは おげんきですか",
      ["は", "ちち", "おげんき", "です", "か", "も", "おとうさん"],
      ["おとうさん", "は", "おげんき", "です", "か"],
    ),
    build(
      "ja-m19-1-2-build-chichi-kuruma",
      "Say: My father likes cars.",
      "ちちは くるまが すきです",
      ["は", "ほん", "ちち", "おとうさん", "が", "くるま", "すき", "です"],
      ["ちち", "は", "くるま", "が", "すき", "です"],
    ),
    listeningCompSentence({
      id: "ja-m19-1-2-lc-haha",
      audioText: "ははは いしゃです",
      correctMeaningEn: "My mother is a doctor.",
      distractorsEn: [
        "Your mother is a doctor.",
        "My mother is a teacher.",
        "My father is a doctor.",
      ],
    }),
    build(
      "ja-m19-1-2-build-haha-ryouri",
      "Say: My mother is good at cooking.",
      "ははは りょうりが じょうずです",
      ["じょうず", "りょうり", "です", "が", "は", "はは", "おかあさん"],
      ["はは", "は", "りょうり", "が", "じょうず", "です"],
    ),
    sentenceMcq({
      id: "ja-m19-1-2-mcq-2",
      prompt: "Asking about a friend's mother: 'What does your mother do?'",
      correctKana: "おかあさんは なにを していますか。",
      distractorsKana: [
        "ははは なにを していますか。",
        "おかあさんは なにが すきですか。",
        "おとうさんは なにを していますか。",
      ],
      explanation: "Asking about SOMEONE ELSE's mother → おかあさん (honorific).",
    }),
    cloze(
      "ja-m19-1-2-cloze-no",
      "ちち",
      " しごとは たいへんです。",
      "の",
      ["の", "は", "が", "を"],
      "My father's job is tough.",
      "ちちの しごとは たいへんです。",
      "の marks possession — my father's job.",
    ),
    listeningBuildSentence({
      id: "ja-m19-1-2-lb-otousan",
      target: "おとうさんは とうきょうに すんでいますか",
      tiles: ["に", "すんでいます", "は", "とうきょう", "おとうさん", "ちち", "か"],
      correctOrder: ["おとうさん", "は", "とうきょう", "に", "すんでいます", "か"],
      promptEn: "Hear it, build it: 'Does your father live in Tokyo?'",
    }),
    speaking(
      "ja-m19-1-2-speak-chichi",
      "ちちは コーヒーが すきです",
      "My father likes coffee.",
    ),
    translateStep({
      id: "ja-m19-1-2-translate",
      promptEn: "My mother likes tea.",
      acceptedAnswers: [
        "ははは おちゃが すきです",
        "ははは おちゃが すきです。",
      ],
      audioText: "ははは おちゃが すきです",
    }),
    sentenceMcq({
      id: "ja-m19-1-2-mcq-3",
      prompt: "You are introducing YOUR father to your teacher. Which is correct?",
      correctKana: "ちちです。",
      distractorsKana: [
        "おとうさんです。",
        "ちちの おとうさんです。",
        "おとうさんの ちちです。",
      ],
      explanation: "Introducing YOUR own father → humble form ちち.",
    }),
    build(
      "ja-m19-1-2-build-chichi-genki",
      "Say: My father is well.",
      "ちちは げんきです",
      ["げんき", "です", "お", "は", "ちち", "おとうさん"],
      ["ちち", "は", "げんき", "です"],
    ),
    cloze(
      "ja-m19-1-2-cloze-register",
      "",
      "は えいがが すきですか。",
      "おとうさん",
      ["おとうさん", "ちち", "おかあさん", "はは"],
      "Does your father like movies? (asking a friend)",
      "おとうさんは えいがが すきですか。",
      "Asking about SOMEONE ELSE's father → honorific form おとうさん.",
    ),
    selfExplain({
      id: "ja-m19-1-2-self-explain",
      anchorLabel: "Register choice in context",
      anchorAudioText: "ははは いしゃです",
      question: "When would you use おかあさん instead of はは?",
      rule: { text: "Use おかあさん when talking about someone ELSE's mother, or when addressing your own mother directly at home." },
      surface: { text: "おかあさん is only used by children; adults always use はは." },
      distractor: { text: "おかあさん is for formal situations and はは is for casual situations." },
      ruleExplanation:
        "The distinction is about whose family, not formality level. Your family = humble. Their family = honorific.",
    }),
    speaking(
      "ja-m19-1-2-speak-okaasan",
      "おかあさんは おげんきですか",
      "Is your mother well?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-1-2-rev-mcq-1", M19_1_2_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-1-2-rev-lc-1",
      audioText: "ラーメンが たべたいです",
      correctMeaningEn: "I want to eat ramen.",
      distractorsEn: [
        "I want to eat sushi.",
        "I ate ramen yesterday.",
        "I like ramen.",
      ],
      exercisedAtomKanas: ["ラーメン"],
    }),
    speaking("ja-m19-1-2-rev-speak-1", M19_1_2_REVIEW[2].kana, M19_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-1-2-rev", M19_1_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M19_1_2.steps);
assertAnswerRotation(M19_1_2.steps, 1);
assertNoConsecutiveSame(M19_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-2-1 — Siblings (あに/おにいさん, あね/おねえさん)
// ═══════════════════════════════════════════════════════════════════════

const M19_2_1_REVIEW = pickReviewAtoms("ja-m19-2-1-rev", M19_REVIEW_POOL, 4);

export const M19_2_1: LessonContent = {
  id: "ja-m19-2-1",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "Siblings — Older brother & sister",
  description:
    "Humble/honorific pairs for older siblings: あに/おにいさん and あね/おねえさん.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── あに (humble: older brother) ──
    build(
      "ja-m19-2-1-build-ani",
      "Pick the humble word for: my older brother",
      "あに",
      ["おねえさん", "あに", "おにいさん", "あね"],
      ["あに"],
    ),
    listeningCompSentence({
      id: "ja-m19-2-1-lc-ani",
      audioText: "あには だいがくせいです",
      correctMeaningEn: "My older brother is a university student.",
      distractorsEn: [
        "Your older brother is a university student.",
        "My older sister is a university student.",
        "My older brother is a high school student.",
      ],
    }),
    // ── おにいさん (honorific: older brother) ──
    build(
      "ja-m19-2-1-build-oniisan",
      "Pick the honorific word for: (someone else's) older brother",
      "おにいさん",
      ["おねえさん", "あに", "あね", "おにいさん"],
      ["おにいさん"],
    ),
    speaking("ja-m19-2-1-speak-oniisan", "おにいさん", "Older brother (honorific)"),
    // ── あね (humble: older sister) ──
    build(
      "ja-m19-2-1-build-ane",
      "Pick the humble word for: my older sister",
      "あね",
      ["おにいさん", "おねえさん", "あに", "あね"],
      ["あね"],
    ),
    listeningCompSentence({
      id: "ja-m19-2-1-listen-ane",
      audioText: "あねは だいがくせいです",
      correctMeaningEn: "My older sister is a university student",
      distractorsEn: ["My older brother is a university student", "Her older sister is a teacher", "My younger sister is a student"],
    }),
    // ── おねえさん (honorific: older sister) ──
    build(
      "ja-m19-2-1-build-oneesan",
      "Pick the honorific word for: (someone else's) older sister",
      "おねえさん",
      ["おにいさん", "あに", "あね", "おねえさん"],
      ["おねえさん"],
    ),
    listeningCompSentence({
      id: "ja-m19-2-1-lc-oneesan",
      audioText: "おねえさんは なにを していますか",
      correctMeaningEn: "What does your older sister do?",
      distractorsEn: [
        "What does my older sister do?",
        "What does your older brother do?",
        "Where is your older sister?",
      ],
    }),
    // ── Sibling register drills ──
    cloze(
      "ja-m19-2-1-cloze-register",
      "",
      "は サッカーが すきです。",
      "あに",
      ["あに", "おにいさん", "あね", "おねえさん"],
      "My older brother likes soccer. (telling a friend)",
      "あには サッカーが すきです。",
      "Talking about YOUR older brother to an outsider → humble form あに.",
    ),
    build(
      "ja-m19-2-1-build-ane-sentence",
      "Say: My older sister is a nurse.",
      "あねは かんごしです",
      ["です", "かんごし", "は", "いしゃ", "おねえさん", "あね"],
      ["あね", "は", "かんごし", "です"],
    ),
    sentenceMcq({
      id: "ja-m19-2-1-mcq-register",
      prompt: "Asking about a friend's older brother: 'Is your older brother a student?'",
      correctKana: "おにいさんは がくせいですか。",
      distractorsKana: [
        "あには がくせいですか。",
        "おねえさんは がくせいですか。",
        "おにいさんが がくせいですか。",
      ],
      explanation: "Asking about SOMEONE ELSE's sibling → honorific form おにいさん.",
    }),
    build(
      "ja-m19-2-1-build-ane-tomodachi",
      "Say: My older sister's friend is kind.",
      "あねの ともだちは やさしいです",
      ["おねえさん", "が", "です", "は", "やさしい", "あね", "ともだち", "の"],
      ["あね", "の", "ともだち", "は", "やさしい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m19-2-1-lb-ane",
      target: "あねは ぎんこうで はたらいています",
      tiles: ["ぎんこう", "はたらいています", "びょういん", "は", "で", "あね", "おねえさん"],
      correctOrder: ["あね", "は", "ぎんこう", "で", "はたらいています"],
      promptEn: "Hear it, build it: 'My older sister works at a bank.'",
    }),
    selfExplain({
      id: "ja-m19-2-1-self-explain",
      anchorLabel: "あに vs おにいさん",
      anchorAudioText: "あには だいがくせいです",
      question: "Why あに and not おにいさん?",
      rule: { text: "Talking about YOUR older brother to an outsider → humble form あに. おにいさん is for someone else's older brother." },
      surface: { text: "あに is for younger people and おにいさん is for older people." },
      distractor: { text: "あに is the casual form and おにいさん is the polite form — use おにいさん with teachers." },
      ruleExplanation:
        "Same うち/よそ rule as ちち/おとうさん. Your family = humble. Their family = honorific.",
    }),
    speaking(
      "ja-m19-2-1-speak-sentence",
      "あには にほんに います",
      "My older brother is in Japan.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-2-1-rev-mcq-1", M19_2_1_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-2-1-rev-lc-1",
      audioText: "あの みせは やすいです",
      correctMeaningEn: "That shop is cheap.",
      distractorsEn: [
        "That shop is expensive.",
        "This shop is cheap.",
        "That shop is closed.",
      ],
      exercisedAtomKanas: ["みせ"],
    }),
    speaking("ja-m19-2-1-rev-speak-1", M19_2_1_REVIEW[2].kana, M19_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-2-1-rev", M19_2_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M19_2_1.steps);
assertAnswerRotation(M19_2_1.steps, 1);
assertNoConsecutiveSame(M19_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-2-2 — Younger siblings (おとうと, いもうと — no honorific pair)
// ═══════════════════════════════════════════════════════════════════════

const M19_2_2_REVIEW = pickReviewAtoms("ja-m19-2-2-rev", M19_REVIEW_POOL, 4);

export const M19_2_2: LessonContent = {
  id: "ja-m19-2-2",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "Younger siblings",
  description:
    "おとうと (younger brother) and いもうと (younger sister). Younger siblings use the same word for humble and honorific, with さん added for others'.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── おとうと (younger brother) ──
    build(
      "ja-m19-2-2-build-otouto",
      "Pick the Japanese word for: younger brother",
      "おとうと",
      ["いもうと", "あね", "あに", "おとうと"],
      ["おとうと"],
    ),
    vocabMcq(
      "ja-m19-2-2-mcq-otouto",
      { kana: "おとうと", meaningEn: "younger brother", emoji: "👦", fromModule: "m19" },
      M19_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m19-2-2-lc-otouto",
      audioText: "おとうとは しょうがくせいです",
      correctMeaningEn: "My younger brother is an elementary school student.",
      distractorsEn: [
        "My younger sister is an elementary school student.",
        "My older brother is an elementary school student.",
        "My younger brother is a high school student.",
      ],
    }),
    // ── いもうと (younger sister) ──
    build(
      "ja-m19-2-2-build-imouto",
      "Pick the Japanese word for: younger sister",
      "いもうと",
      ["おとうと", "いもうと", "あね", "おねえさん"],
      ["いもうと"],
    ),
    vocabMcq(
      "ja-m19-2-2-mcq-imouto",
      { kana: "いもうと", meaningEn: "younger sister", emoji: "👧", fromModule: "m19" },
      M19_REVIEW_POOL,
    ),
    speaking("ja-m19-2-2-speak-imouto", "いもうと", "Younger sister"),
    // ── Sentence drills ──
    build(
      "ja-m19-2-2-build-otouto-sentence",
      "Say: My younger brother likes dogs.",
      "おとうとは いぬが すきです",
      ["いぬ", "おとうと", "が", "いもうと", "ねこ", "は", "すき", "です"],
      ["おとうと", "は", "いぬ", "が", "すき", "です"],
    ),
    cloze(
      "ja-m19-2-2-cloze-register-1",
      "",
      "は ちゅうがくせいです。",
      "いもうと",
      ["いもうと", "いもうとさん", "おとうとさん", "おねえさん"],
      "My younger sister is a middle school student. (telling a friend)",
      "いもうとは ちゅうがくせいです。",
      "YOUR younger sister → plain いもうと (no さん).",
    ),
    sentenceMcq({
      id: "ja-m19-2-2-mcq-san",
      prompt: "Asking about a friend's younger brother: 'Is your younger brother well?'",
      correctKana: "おとうとさんは おげんきですか。",
      distractorsKana: [
        "おとうとは おげんきですか。",
        "いもうとさんは おげんきですか。",
        "おにいさんは おげんきですか。",
      ],
      explanation: "Asking about SOMEONE ELSE's younger brother → add さん: おとうとさん.",
    }),
    build(
      "ja-m19-2-2-build-imouto-sentence",
      "Say: My younger sister likes cats.",
      "いもうとは ねこが すきです",
      ["いぬ", "です", "おとうと", "が", "すき", "いもうと", "は", "ねこ"],
      ["いもうと", "は", "ねこ", "が", "すき", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m19-2-2-lb-otouto",
      target: "おとうとは こうえんで あそんでいます",
      tiles: ["で", "いもうと", "がっこう", "あそんでいます", "は", "こうえん", "おとうと"],
      correctOrder: ["おとうと", "は", "こうえん", "で", "あそんでいます"],
      promptEn: "Hear it, build it: 'My younger brother is playing in the park.'",
    }),
    cloze(
      "ja-m19-2-2-cloze-register-2",
      "",
      "は サッカーが すきですか。",
      "おとうとさん",
      ["おとうとさん", "おとうと", "いもうとさん", "おにいさん"],
      "Does your younger brother like soccer? (asking a friend)",
      "おとうとさんは サッカーが すきですか。",
      "SOMEONE ELSE's younger brother → add さん: おとうとさん.",
    ),
    translateStep({
      id: "ja-m19-2-2-translate",
      promptEn: "My younger sister is an elementary school student.",
      acceptedAnswers: [
        "いもうとは しょうがくせいです",
        "いもうとは しょうがくせいです。",
      ],
      audioText: "いもうとは しょうがくせいです",
    }),
    selfExplain({
      id: "ja-m19-2-2-self-explain",
      anchorLabel: "おとうと vs おとうとさん",
      anchorAudioText: "おとうとは しょうがくせいです",
      question: "When do you add さん to おとうと?",
      rule: { text: "Add さん when talking about someone ELSE's younger sibling: おとうとさん. For YOUR own younger sibling, just おとうと." },
      surface: { text: "さん is added to be polite to your younger brother." },
      distractor: { text: "さん is only added when the younger brother is an adult." },
      ruleExplanation:
        "Same うち/よそ pattern. For younger siblings: plain form for yours, + さん for theirs.",
    }),
    speaking(
      "ja-m19-2-2-speak-sentence",
      "いもうとは ねこが すきです",
      "My younger sister likes cats.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-2-2-rev-mcq-1", M19_2_2_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-2-2-rev-lc-1",
      audioText: "うちに ねこが います",
      correctMeaningEn: "There is a cat at my house.",
      distractorsEn: [
        "There is a dog at my house.",
        "The cat is in the garden.",
        "There is a cat at school.",
      ],
      exercisedAtomKanas: ["うち"],
    }),
    speaking("ja-m19-2-2-rev-speak-1", M19_2_2_REVIEW[2].kana, M19_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-2-2-rev", M19_2_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M19_2_2.steps);
assertAnswerRotation(M19_2_2.steps, 1);
assertNoConsecutiveSame(M19_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-3-1 — Grandparents (そふ/おじいさん, そぼ/おばあさん)
// ═══════════════════════════════════════════════════════════════════════

const M19_3_1_REVIEW = pickReviewAtoms("ja-m19-3-1-rev", M19_REVIEW_POOL, 4);

export const M19_3_1: LessonContent = {
  id: "ja-m19-3-1",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "Grandparents",
  description:
    "Humble/honorific pairs for grandfather and grandmother: そふ/おじいさん, そぼ/おばあさん.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── そふ (humble: grandfather) ──
    build(
      "ja-m19-3-1-build-sofu",
      "Pick the humble word for: my grandfather",
      "そふ",
      ["おじいさん", "そぼ", "そふ", "おばあさん"],
      ["そふ"],
    ),
    listeningCompSentence({
      id: "ja-m19-3-1-lc-sofu",
      audioText: "そふは はちじゅうさいです",
      correctMeaningEn: "My grandfather is 80 years old.",
      distractorsEn: [
        "Your grandfather is 80 years old.",
        "My grandmother is 80 years old.",
        "My grandfather is 18 years old.",
      ],
    }),
    // ── おじいさん (honorific: grandfather) ──
    build(
      "ja-m19-3-1-build-ojiisan",
      "Pick the honorific word for: (someone else's) grandfather",
      "おじいさん",
      ["そぼ", "おじいさん", "おばあさん", "そふ"],
      ["おじいさん"],
    ),
    speaking("ja-m19-3-1-speak-ojiisan", "おじいさん", "Grandfather (honorific)"),
    // ── そぼ (humble: grandmother) ──
    build(
      "ja-m19-3-1-build-sobo",
      "Pick the humble word for: my grandmother",
      "そぼ",
      ["おじいさん", "おばあさん", "そぼ", "そふ"],
      ["そぼ"],
    ),
    listeningCompSentence({
      id: "ja-m19-3-1-lc-sobo",
      audioText: "そぼは おちゃが すきです",
      correctMeaningEn: "My grandmother likes tea.",
      distractorsEn: [
        "My grandfather likes tea.",
        "Your grandmother likes tea.",
        "My grandmother likes coffee.",
      ],
    }),
    // ── おばあさん (honorific: grandmother) ──
    build(
      "ja-m19-3-1-build-obaasan",
      "Pick the honorific word for: (someone else's) grandmother",
      "おばあさん",
      ["おじいさん", "おばあさん", "そふ", "そぼ"],
      ["おばあさん"],
    ),
    vocabMcq(
      "ja-m19-3-1-mcq-obaasan",
      { kana: "おばあさん", meaningEn: "grandmother (honorific)", emoji: "👵", fromModule: "m19" },
      M19_REVIEW_POOL,
    ),
    // ── Register drills ──
    cloze(
      "ja-m19-3-1-cloze-register",
      "",
      "は にほんに すんでいます。",
      "そふ",
      ["そふ", "おじいさん", "そぼ", "おばあさん"],
      "My grandfather lives in Japan. (telling a friend)",
      "そふは にほんに すんでいます。",
      "Talking about YOUR grandfather to an outsider → humble form そふ.",
    ),
    sentenceMcq({
      id: "ja-m19-3-1-mcq-register",
      prompt: "Asking about a friend's grandmother: 'Is your grandmother well?'",
      correctKana: "おばあさんは おげんきですか。",
      distractorsKana: [
        "そぼは おげんきですか。",
        "おじいさんは おげんきですか。",
        "おばあさんは げんきですか。",
      ],
      explanation: "Asking about SOMEONE ELSE's grandmother → honorific form おばあさん. With お before げんき for politeness.",
    }),
    build(
      "ja-m19-3-1-build-sobo-sentence",
      "Say: My grandmother lives in Osaka.",
      "そぼは おおさかに すんでいます",
      ["に", "そぼ", "は", "おおさか", "すんでいます", "おばあさん", "とうきょう"],
      ["そぼ", "は", "おおさか", "に", "すんでいます"],
    ),
    cloze(
      "ja-m19-3-1-cloze-ni",
      "おじいさんは にほん",
      " すんでいますか。",
      "に",
      ["に", "は", "で", "を"],
      "Does your grandfather live in Japan?",
      "おじいさんは にほんに すんでいますか。",
      "に marks the place of residence with すんでいます.",
    ),
    listeningBuildSentence({
      id: "ja-m19-3-1-lb-sofu",
      target: "そふは まいにち さんぽします",
      tiles: ["は", "まいにち", "さんぽします", "そふ", "そぼ", "おじいさん"],
      correctOrder: ["そふ", "は", "まいにち", "さんぽします"],
      promptEn: "Hear it, build it: 'My grandfather takes a walk every day.'",
    }),
    selfExplain({
      id: "ja-m19-3-1-self-explain",
      anchorLabel: "そふ vs おじいさん",
      anchorAudioText: "そふは はちじゅうさいです",
      question: "Why そふ instead of おじいさん?",
      rule: { text: "Talking about YOUR grandfather to an outsider → humble form そふ. おじいさん is for someone else's grandfather or any elderly gentleman." },
      surface: { text: "そふ is shorter, so it's more convenient to say." },
      distractor: { text: "そふ is used only for grandfathers who have passed away." },
      ruleExplanation:
        "Same うち/よそ pattern as all family words. Your family = humble. Their family = honorific.",
    }),
    speaking(
      "ja-m19-3-1-speak-sentence",
      "そぼは おおさかに すんでいます",
      "My grandmother lives in Osaka.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-3-1-rev-mcq-1", M19_3_1_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-3-1-rev-lc-1",
      audioText: M19_3_1_REVIEW[1].kana,
      correctMeaningEn: M19_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_3_1_REVIEW[2].meaningEn,
        M19_3_1_REVIEW[3].meaningEn,
        M19_REVIEW_POOL[4].meaningEn,
      ],
    }),
    speaking("ja-m19-3-1-rev-speak-1", M19_3_1_REVIEW[2].kana, M19_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-3-1-rev", M19_3_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M19_3_1.steps);
assertAnswerRotation(M19_3_1.steps, 1);
assertNoConsecutiveSame(M19_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-3-2 — Family register mixed drill (all 8 pairs)
// ═══════════════════════════════════════════════════════════════════════

const M19_3_2_REVIEW = pickReviewAtoms("ja-m19-3-2-rev", M19_REVIEW_POOL, 4);

export const M19_3_2: LessonContent = {
  id: "ja-m19-3-2",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "Family register — mixed drill",
  description:
    "Mix all family pairs: parents, siblings, grandparents. Choose the right register every time. Plus わたくし — the extra-humble 'I.'",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    // ── Mixed register discrimination ──
    sentenceMcq({
      id: "ja-m19-3-2-mcq-1",
      prompt: "Telling a colleague about YOUR older sister:",
      correctKana: "あねは きょうしです。",
      distractorsKana: [
        "おねえさんは きょうしです。",
        "あには きょうしです。",
        "いもうとは きょうしです。",
      ],
      explanation: "YOUR older sister → humble form あね.",
    }),
    cloze(
      "ja-m19-3-2-cloze-register-1",
      "",
      "は とうきょうに すんでいます。",
      "そぼ",
      ["そぼ", "おばあさん", "そふ", "おじいさん"],
      "My grandmother lives in Tokyo. (telling a friend)",
      "そぼは とうきょうに すんでいます。",
      "YOUR grandmother → humble form そぼ.",
    ),
    build(
      "ja-m19-3-2-build-1",
      "Ask: Is your older brother a student?",
      "おにいさんは がくせいですか",
      ["です", "あに", "おにいさん", "がくせい", "か", "は", "せんせい"],
      ["おにいさん", "は", "がくせい", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m19-3-2-lc-1",
      audioText: "おとうさんは いしゃですか",
      correctMeaningEn: "Is your father a doctor?",
      distractorsEn: [
        "My father is a doctor.",
        "Is your mother a doctor?",
        "Is your father a teacher?",
      ],
    }),
    sentenceMcq({
      id: "ja-m19-3-2-mcq-2",
      prompt: "Asking about someone else's younger sister:",
      correctKana: "いもうとさんは おげんきですか。",
      distractorsKana: [
        "いもうとは おげんきですか。",
        "おねえさんは おげんきですか。",
        "いもうとさんが おげんきですか。",
      ],
      explanation: "SOMEONE ELSE's younger sister → いもうとさん (add さん).",
    }),
    build(
      "ja-m19-3-2-build-haha-ryouri",
      "Say: My mother's cooking is delicious.",
      "ははの りょうりは おいしいです",
      ["です", "じょうず", "は", "の", "おかあさん", "りょうり", "おいしい", "はは"],
      ["はは", "の", "りょうり", "は", "おいしい", "です"],
    ),
    build(
      "ja-m19-3-2-build-2",
      "Say: My grandfather likes fishing.",
      "そふは つりが すきです",
      ["つり", "が", "きらい", "そふ", "すき", "です", "は", "おじいさん"],
      ["そふ", "は", "つり", "が", "すき", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m19-3-2-lb-1",
      target: "おじいさんは おげんきですか",
      tiles: ["は", "そふ", "です", "そぼ", "おじいさん", "おげんき", "か"],
      correctOrder: ["おじいさん", "は", "おげんき", "です", "か"],
      promptEn: "Hear it, build it: 'Is your grandfather well?'",
    }),
    sentenceMcq({
      id: "ja-m19-3-2-mcq-3",
      prompt: "Telling a teacher about YOUR younger brother:",
      correctKana: "おとうとは サッカーが すきです。",
      distractorsKana: [
        "おとうとさんは サッカーが すきです。",
        "あには サッカーが すきです。",
        "おにいさんは サッカーが すきです。",
      ],
      explanation: "YOUR younger brother → おとうと (no さん).",
    }),
    // ── わたくし (extra-humble I) — the register system applies to "I" too ──
    build(
      "ja-m19-3-2-build-watakushi",
      "Pick the extra-humble word for: I / me (formal speech)",
      "わたくし",
      ["あに", "あなた", "わたくし", "わたし"],
      ["わたくし"],
    ),
    listeningCompSentence({
      id: "ja-m19-3-2-lc-watakushi",
      audioText: "わたくしは たなかです",
      correctMeaningEn: "I am Tanaka. (very formal)",
      distractorsEn: [
        "You are Tanaka.",
        "I am a teacher.",
        "That person is Tanaka.",
      ],
    }),
    sentenceMcq({
      id: "ja-m19-3-2-mcq-watakushi",
      prompt: "Which is the MOST humble way to say 'I am a student'?",
      correctKana: "わたくしは がくせいです。",
      distractorsKana: [
        "わたしは がくせいです。",
        "あなたは がくせいです。",
        "わたくしが がくせいですか。",
      ],
      explanation: "わたくし is the extra-humble form of わたし — the same modesty that drives ちち/はは.",
    }),
    translateStep({
      id: "ja-m19-3-2-translate",
      promptEn: "My grandmother drinks tea every day.",
      acceptedAnswers: [
        "そぼは まいにち おちゃを のみます",
        "そぼは まいにち おちゃを のみます。",
      ],
      audioText: "そぼは まいにち おちゃを のみます",
    }),
    build(
      "ja-m19-3-2-build-3",
      "Ask: What does your older brother do?",
      "おにいさんは なにを していますか",
      ["か", "を", "なに", "しています", "は", "おにいさん", "あに"],
      ["おにいさん", "は", "なに", "を", "しています", "か"],
    ),
    selfExplain({
      id: "ja-m19-3-2-self-explain",
      anchorLabel: "Family register system overview",
      anchorAudioText: "あねは きょうしです",
      question: "Summarize the humble/honorific rule:",
      rule: { text: "YOUR family: humble (ちち, はは, あに, あね, そふ, そぼ). THEIR family: honorific (おとうさん, おかあさん, おにいさん, おねえさん, おじいさん, おばあさん), + さん for younger siblings." },
      surface: { text: "Humble forms are casual and honorific forms are formal — use honorific at work." },
      distractor: { text: "Men use humble forms and women use honorific forms." },
      ruleExplanation:
        "The うち/よそ distinction is about whose family, not the level of formality or the speaker's gender.",
    }),
    speaking(
      "ja-m19-3-2-speak",
      "わたくしは たなかです",
      "I am Tanaka. (very formal)",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-3-2-rev-mcq-1", M19_3_2_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-3-2-rev-lc-1",
      audioText: "おとうさんの なまえは なんですか",
      correctMeaningEn: "What is your father's name?",
      distractorsEn: [
        "What is your mother's name?",
        "How old is your father?",
        "Where does your father live?",
      ],
      exercisedAtomKanas: ["なまえ"],
    }),
    speaking("ja-m19-3-2-rev-speak-1", M19_3_2_REVIEW[2].kana, M19_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-3-2-rev", M19_3_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M19_3_2.steps);
assertAnswerRotation(M19_3_2.steps, 1);
assertNoConsecutiveSame(M19_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-4-1 — People vocab (おとこのこ, おんなのこ, おとな, こども, あかちゃん)
// ═══════════════════════════════════════════════════════════════════════

const M19_4_1_REVIEW = pickReviewAtoms("ja-m19-4-1-rev", M19_REVIEW_POOL, 4);

export const M19_4_1: LessonContent = {
  id: "ja-m19-4-1",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "People words",
  description:
    "Five people words: boy, girl, adult, child, baby.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── おとこのこ (boy) ──
    vocabMcq(
      "ja-m19-4-1-mcq-otokonoko",
      { kana: "おとこのこ", meaningEn: "boy", emoji: "👦", fromModule: "m19" },
      M19_REVIEW_POOL,
    ),
    speaking("ja-m19-4-1-speak-otokonoko", "おとこのこ", "Boy"),
    // ── おんなのこ (girl) ──
    vocabMcq(
      "ja-m19-4-1-mcq-onnanoko",
      { kana: "おんなのこ", meaningEn: "girl", emoji: "👧", fromModule: "m19" },
      M19_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m19-4-1-lc-onnanoko",
      audioText: "おんなのこが います",
      correctMeaningEn: "There is a girl.",
      distractorsEn: [
        "There is a boy.",
        "There is a woman.",
        "There is no girl.",
      ],
    }),
    // ── こども (child) ──
    vocabMcq(
      "ja-m19-4-1-mcq-kodomo",
      { kana: "こども", meaningEn: "child", emoji: "🧒", fromModule: "m19" },
      M19_REVIEW_POOL,
    ),
    build(
      "ja-m19-4-1-build-kodomo",
      "Say: The child is playing.",
      "こどもは あそんでいます",
      ["たべて", "います", "は", "こども", "あそんで", "おとな"],
      ["こども", "は", "あそんで", "います"],
    ),
    // ── おとな (adult) ──
    vocabMcq(
      "ja-m19-4-1-mcq-otona",
      { kana: "おとな", meaningEn: "adult", emoji: "🧑", fromModule: "m19" },
      M19_REVIEW_POOL,
    ),
    sentenceMcq({
      id: "ja-m19-4-1-mcq-sentence",
      prompt: "Which means 'Adults drink coffee.'?",
      correctKana: "おとなは コーヒーを のみます。",
      distractorsKana: [
        "こどもは コーヒーを のみます。",
        "おとなは おちゃを のみます。",
        "おとなは コーヒーが すきです。",
      ],
      explanation: "おとな = adult. のみます = drink.",
    }),
    // ── あかちゃん (baby) ──
    build(
      "ja-m19-4-1-build-akachan",
      "Pick the Japanese word for: baby",
      "あかちゃん",
      ["おとな", "こども", "おんなのこ", "あかちゃん"],
      ["あかちゃん"],
    ),
    listeningCompSentence({
      id: "ja-m19-4-1-lc-akachan",
      audioText: "あかちゃんが ないています",
      correctMeaningEn: "The baby is crying.",
      distractorsEn: [
        "The child is crying.",
        "The baby is sleeping.",
        "The baby is playing.",
      ],
    }),
    speaking("ja-m19-4-1-speak-akachan", "あかちゃん", "Baby"),
    // ── People in context ──
    listeningBuildSentence({
      id: "ja-m19-4-1-lb-otokonoko",
      target: "おとこのこが さんにん います",
      tiles: ["さんにん", "が", "います", "おとこのこ", "ふたり", "おんなのこ"],
      correctOrder: ["おとこのこ", "が", "さんにん", "います"],
      promptEn: "Hear it, build it: 'There are three boys.'",
    }),
    build(
      "ja-m19-4-1-build-otona-kodomo",
      "Say: There are two adults and three children.",
      "おとなが ふたりと こどもが さんにん います",
      ["よにん", "が", "と", "おとな", "さんにん", "ふたり", "こども", "います", "が"],
      ["おとな", "が", "ふたり", "と", "こども", "が", "さんにん", "います"],
    ),
    build(
      "ja-m19-4-1-build-akachan-neteimasu",
      "Say: The baby is sleeping.",
      "あかちゃんは ねています",
      ["は", "こども", "あかちゃん", "ないています", "ねています"],
      ["あかちゃん", "は", "ねています"],
    ),
    selfExplain({
      id: "ja-m19-4-1-self-explain",
      anchorLabel: "おとこのこ structure",
      anchorAudioText: "おとこのこが さんにん います",
      question: "How is おとこのこ formed?",
      rule: { text: "おとこ (male) + の (possessive/connector) + こ (child) = 'male child' → boy. Same pattern: おんなのこ = おんな + の + こ = girl." },
      surface: { text: "おとこのこ is one word that cannot be broken down." },
      distractor: { text: "おとこのこ means 'male's thing' because の means 'of.'" },
      ruleExplanation:
        "の here functions as a connector joining おとこ/おんな with こ. It's a compound word but の retains its role.",
    }),
    speaking(
      "ja-m19-4-1-speak-sentence",
      "こどもは あそんでいます",
      "The child is playing.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-4-1-rev-mcq-1", M19_4_1_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-4-1-rev-lc-1",
      audioText: "その かばんは たかいですね",
      correctMeaningEn: "That bag is expensive, isn't it?",
      distractorsEn: [
        "That bag is cheap, isn't it?",
        "This bag is expensive, isn't it?",
        "That bag is yours, right?",
      ],
      exercisedAtomKanas: ["かばん"],
    }),
    speaking("ja-m19-4-1-rev-speak-1", M19_4_1_REVIEW[2].kana, M19_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-4-1-rev", M19_4_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M19_4_1.steps);
assertAnswerRotation(M19_4_1.steps, 1);
assertNoConsecutiveSame(M19_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-4-2 — More people (せいと, おまわりさん) + people in context
// ═══════════════════════════════════════════════════════════════════════

const M19_4_2_REVIEW = pickReviewAtoms("ja-m19-4-2-rev", M19_REVIEW_POOL, 4);

export const M19_4_2: LessonContent = {
  id: "ja-m19-4-2",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "People in context",
  description:
    "More people words — せいと (pupil), おまわりさん (police officer), かた (polite 'person'), みんな and みなさん (everyone), どなた (polite 'who') — plus practice using all people words in sentences.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    // ── せいと (pupil/student) ──
    vocabMcq(
      "ja-m19-4-2-mcq-seito",
      { kana: "せいと", meaningEn: "pupil", emoji: "🎒", fromModule: "m19" },
      M19_REVIEW_POOL,
    ),
    build(
      "ja-m19-4-2-build-seito",
      "Say: The students are studying.",
      "せいとは べんきょうしています",
      ["あそんで", "おとな", "は", "せいと", "しています", "べんきょう"],
      ["せいと", "は", "べんきょう", "しています"],
    ),
    // ── おまわりさん (police officer) ──
    build(
      "ja-m19-4-2-build-omawarisan",
      "Pick the Japanese word for: police officer",
      "おまわりさん",
      ["せんせい", "いしゃ", "おまわりさん", "せいと"],
      ["おまわりさん"],
    ),
    listeningCompSentence({
      id: "ja-m19-4-2-lc-omawarisan",
      audioText: "おまわりさんに ききましょう",
      correctMeaningEn: "Let's ask the police officer.",
      distractorsEn: [
        "Let's call the police officer.",
        "The police officer is coming.",
        "Let's ask the teacher.",
      ],
    }),
    speaking("ja-m19-4-2-speak-omawarisan", "おまわりさん", "Police officer"),
    // ── かた (person, polite) ──
    build(
      "ja-m19-4-2-build-kata",
      "Pick the POLITE word for: person",
      "かた",
      ["おとな", "ひと", "かた", "こども"],
      ["かた"],
    ),
    listeningCompSentence({
      id: "ja-m19-4-2-lc-kata",
      audioText: "あの かたは ゆきさんの おかあさんです",
      correctMeaningEn: "That person (polite) is Yuki's mother.",
      distractorsEn: [
        "That child is Yuki's mother.",
        "That person is Yuki's older sister.",
        "Yuki's mother is a teacher.",
      ],
    }),
    // ── みんな / みなさん (everyone) ──
    vocabMcq(
      "ja-m19-4-2-mcq-minna",
      { kana: "みんな", meaningEn: "everyone", emoji: "👥", fromModule: "m19" },
      M19_REVIEW_POOL,
    ),
    build(
      "ja-m19-4-2-build-minna",
      "Say: My family are all well.",
      "かぞくは みんな げんきです",
      ["げんき", "おとな", "は", "かぞく", "みんな", "です"],
      ["かぞく", "は", "みんな", "げんき", "です"],
    ),
    build(
      "ja-m19-4-2-build-minasan",
      "Pick the POLITE word for: everyone",
      "みなさん",
      ["せいと", "かた", "みなさん", "みんな"],
      ["みなさん"],
    ),
    listeningCompSentence({
      id: "ja-m19-4-2-lc-minasan",
      audioText: "みなさん、おげんきですか",
      correctMeaningEn: "Is everyone well?",
      distractorsEn: [
        "Everyone is here.",
        "Is your mother well?",
        "Everyone is a student.",
      ],
    }),
    // ── どなた (polite who) — だれ's register partner, like ひと → かた ──
    build(
      "ja-m19-4-2-build-donata",
      "だれ is casual. Pick the POLITE word for: who",
      "どなた",
      ["だれ", "かた", "どなた", "あなた"],
      ["どなた"],
    ),
    listeningCompSentence({
      id: "ja-m19-4-2-lc-donata",
      audioText: "あの かたは どなたですか",
      correctMeaningEn: "Who is that person? (polite)",
      distractorsEn: [
        "Who is that child?",
        "Whose mother is that?",
        "Where is that person from?",
      ],
    }),
    sentenceMcq({
      id: "ja-m19-4-2-mcq-donata",
      prompt: "A guest arrives at your office. Which is the properly POLITE way to ask who it is?",
      correctKana: "どなたですか。",
      distractorsKana: [
        "だれですか。",
        "どなたです。",
        "なんですか。",
      ],
      explanation: "どなた = polite 'who' (matches かた and みなさん). だれ is the casual word you already know.",
    }),
    // ── Context drills ──
    sentenceMcq({
      id: "ja-m19-4-2-mcq-1",
      prompt: "Which means 'There are five students.'?",
      correctKana: "せいとが ごにん います。",
      distractorsKana: [
        "せいとが さんにん います。",
        "せんせいが ごにん います。",
        "せいとは ごにん です。",
      ],
      explanation: "せいと = student. ごにん = five people. が marks the subject with います.",
    }),
    build(
      "ja-m19-4-2-build-otokonoko-count",
      "Say: There are two boys.",
      "おとこのこが ふたり います",
      ["さんにん", "が", "おんなのこ", "ふたり", "います", "おとこのこ"],
      ["おとこのこ", "が", "ふたり", "います"],
    ),
    listeningCompSentence({
      id: "ja-m19-4-2-lc-kodomo",
      audioText: "こどもが よにん います",
      correctMeaningEn: "There are four children.",
      distractorsEn: [
        "There are four adults.",
        "There are two children.",
        "There are four boys.",
      ],
    }),
    cloze(
      "ja-m19-4-2-cloze-ga",
      "おんなのこ",
      " さんにん います。",
      "が",
      ["が", "は", "を", "に"],
      "There are three girls.",
      "おんなのこが さんにん います。",
      "が marks the subject with います for counting people.",
    ),
    listeningBuildSentence({
      id: "ja-m19-4-2-lb-seito",
      target: "せいとは べんきょうしています",
      tiles: ["あそんで", "しています", "います", "せいと", "べんきょう", "は"],
      correctOrder: ["せいと", "は", "べんきょう", "しています"],
      promptEn: "Hear it, build it: 'The students are studying.'",
    }),
    sentenceMcq({
      id: "ja-m19-4-2-mcq-2",
      prompt: "Which means 'The baby is cute.'?",
      correctKana: "あかちゃんは かわいいです。",
      distractorsKana: [
        "こどもは かわいいです。",
        "あかちゃんは ちいさいです。",
        "おんなのこは かわいいです。",
      ],
      explanation: "あかちゃん = baby. かわいい = cute.",
    }),
    translateStep({
      id: "ja-m19-4-2-translate",
      promptEn: "There are two girls.",
      acceptedAnswers: [
        "おんなのこが ふたり います",
        "おんなのこが ふたり います。",
      ],
      audioText: "おんなのこが ふたり います",
    }),
    selfExplain({
      id: "ja-m19-4-2-self-explain",
      anchorLabel: "People counting pattern",
      anchorAudioText: "おとこのこが ふたり います",
      question: "What particle pattern do you use to say 'there are N people'?",
      rule: { text: "[person]が + [counter] + います. が marks the subject; います shows existence of living things." },
      surface: { text: "Use は instead of が because the people are the topic." },
      distractor: { text: "Use を because the people are the object of counting." },
      ruleExplanation:
        "When stating existence/count of people, が marks the subject and います is the verb. は would imply already-known topic, but here we're introducing new information.",
    }),
    speaking(
      "ja-m19-4-2-speak-sentence",
      "せいとが ごにん います",
      "There are five students.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-4-2-rev-mcq-1", M19_4_2_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-4-2-rev-lc-1",
      audioText: M19_4_2_REVIEW[1].kana,
      correctMeaningEn: M19_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_4_2_REVIEW[2].meaningEn,
        M19_4_2_REVIEW[3].meaningEn,
        M19_REVIEW_POOL[7].meaningEn,
      ],
    }),
    speaking("ja-m19-4-2-rev-speak-1", M19_4_2_REVIEW[2].kana, M19_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-4-2-rev", M19_4_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M19_4_2.steps);
assertAnswerRotation(M19_4_2.steps, 1);
assertNoConsecutiveSame(M19_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-5-1 — Age counter (〜さい) intro
// ═══════════════════════════════════════════════════════════════════════

const M19_5_1_REVIEW = pickReviewAtoms("ja-m19-5-1-rev", M19_REVIEW_POOL, 4);

export const M19_5_1: LessonContent = {
  id: "ja-m19-5-1",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "How old? — Age counter",
  description:
    "The 〜さい counter for age. Sound changes for 1, 8, 10. Asking and answering age questions.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_SAI_COUNTER,
    // ── Core age forms ──
    build(
      "ja-m19-5-1-build-issai",
      "Pick: 1 year old",
      "いっさい",
      ["いちさい", "さんさい", "いっさい", "にさい"],
      ["いっさい"],
    ),
    listeningCompSentence({
      id: "ja-m19-5-1-lc-issai",
      audioText: "あかちゃんは いっさいです",
      correctMeaningEn: "The baby is 1 year old.",
      distractorsEn: [
        "The baby is 2 years old.",
        "The child is 1 year old.",
        "The baby is 10 years old.",
      ],
    }),
    build(
      "ja-m19-5-1-build-hassai",
      "Pick: 8 years old",
      "はっさい",
      ["きゅうさい", "はちさい", "はっさい", "ろくさい"],
      ["はっさい"],
    ),
    sentenceMcq({
      id: "ja-m19-5-1-mcq-age",
      prompt: "Which means 'My younger brother is 8 years old.'?",
      correctKana: "おとうとは はっさいです。",
      distractorsKana: [
        "おとうとは はちさいです。",
        "いもうとは はっさいです。",
        "おとうとは ろくさいです。",
      ],
      explanation: "はっさい (not はちさい) = 8 years old. Sound change is mandatory.",
    }),
    build(
      "ja-m19-5-1-build-jussai",
      "Pick: 10 years old",
      "じゅっさい",
      ["きゅうさい", "ごさい", "じゅうさい", "じゅっさい"],
      ["じゅっさい"],
    ),
    speaking("ja-m19-5-1-speak-jussai", "じゅっさい", "10 years old"),
    // ── Age sentence drills ──
    build(
      "ja-m19-5-1-build-age-sentence",
      "Say: I am 20 years old.",
      "わたしは にじゅっさいです",
      ["さんじゅっさい", "です", "わたし", "にじゅうごさい", "は", "にじゅっさい"],
      ["わたし", "は", "にじゅっさい", "です"],
    ),
    cloze(
      "ja-m19-5-1-cloze-sai-1",
      "あには ",
      "です。",
      "じゅうはっさい",
      ["じゅうはっさい", "じゅうはちさい", "じゅうろくさい", "じゅうきゅうさい"],
      "My older brother is 18 years old.",
      "あには じゅうはっさいです。",
      "The 8 → はっさい sound change applies inside bigger numbers too: じゅうはっさい.",
    ),
    listeningCompSentence({
      id: "ja-m19-5-1-lc-nansai",
      audioText: "なんさいですか",
      correctMeaningEn: "How old are you?",
      distractorsEn: [
        "How many people?",
        "What is your name?",
        "Where are you from?",
      ],
    }),
    build(
      "ja-m19-5-1-build-oikutsu",
      "Ask politely: How old are you?",
      "おいくつですか",
      ["なん", "おいくつ", "か", "なんさい", "です"],
      ["おいくつ", "です", "か"],
    ),
    sentenceMcq({
      id: "ja-m19-5-1-mcq-polite",
      prompt: "Which is the more POLITE way to ask someone's age?",
      correctKana: "おいくつですか。",
      distractorsKana: [
        "なんさいですか。",
        "いくつですか。",
        "としは なんですか。",
      ],
      explanation: "おいくつですか is the most polite form. なんさいですか is fine for children.",
    }),
    cloze(
      "ja-m19-5-1-cloze-sai-2",
      "おとうとは ",
      "です。",
      "じゅっさい",
      ["じゅっさい", "じゅうさい", "きゅうさい", "はっさい"],
      "My younger brother is 10 years old.",
      "おとうとは じゅっさいです。",
      "10 → じゅっさい (not じゅうさい). The sound change is mandatory.",
    ),
    selfExplain({
      id: "ja-m19-5-1-self-explain",
      anchorLabel: "Age counter sound changes",
      anchorAudioText: "おとうとは はっさいです",
      question: "Which ages have special sound changes?",
      rule: { text: "1 → いっさい (not いちさい), 8 → はっさい (not はちさい), 10 → じゅっさい (not じゅうさい). Other ages follow regular number + さい." },
      surface: { text: "Only 1 (いっさい) has a sound change; all others are regular." },
      distractor: { text: "Every even number has a sound change." },
      ruleExplanation:
        "The sound changes いっ, はっ, じゅっ occur because of consonant doubling before さ. This is a common pattern with counters.",
    }),
    speaking(
      "ja-m19-5-1-speak-sentence",
      "わたしは にじゅっさいです",
      "I am 20 years old.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-5-1-rev-mcq-1", M19_5_1_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-5-1-rev-lc-1",
      audioText: "バスで がっこうに いきます",
      correctMeaningEn: "I go to school by bus.",
      distractorsEn: [
        "I go to school by train.",
        "I go to the bank by bus.",
        "I walk to school.",
      ],
      exercisedAtomKanas: ["バス"],
    }),
    speaking("ja-m19-5-1-rev-speak-1", M19_5_1_REVIEW[2].kana, M19_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-5-1-rev", M19_5_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M19_5_1.steps);
assertAnswerRotation(M19_5_1.steps, 1);
assertNoConsecutiveSame(M19_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-5-2 — 〜にんかぞく + family size
// ═══════════════════════════════════════════════════════════════════════

const M19_5_2_REVIEW = pickReviewAtoms("ja-m19-5-2-rev", M19_REVIEW_POOL, 4);

export const M19_5_2: LessonContent = {
  id: "ja-m19-5-2",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "Family size — にんかぞく",
  description:
    "Describe family size with 〜にんかぞく. Ask なんにんかぞくですか.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_NIN_KAZOKU,
    // ── Family size forms ──
    build(
      "ja-m19-5-2-build-yonin",
      "Pick: a family of four",
      "よにんかぞく",
      ["ごにんかぞく", "ろくにんかぞく", "よにんかぞく", "さんにんかぞく"],
      ["よにんかぞく"],
    ),
    listeningCompSentence({
      id: "ja-m19-5-2-lc-yonin",
      audioText: "わたしは よにんかぞくです",
      correctMeaningEn: "I'm from a family of four.",
      distractorsEn: [
        "I'm from a family of five.",
        "I'm from a family of three.",
        "There are four people.",
      ],
    }),
    build(
      "ja-m19-5-2-build-gonin",
      "Pick: a family of five",
      "ごにんかぞく",
      ["よにんかぞく", "ろくにんかぞく", "さんにんかぞく", "ごにんかぞく"],
      ["ごにんかぞく"],
    ),
    speaking("ja-m19-5-2-speak-gonin", "ごにんかぞく", "A family of five"),
    // ── Family composition sentences ──
    build(
      "ja-m19-5-2-build-composition",
      "Say: I'm from a family of four — father, mother, older sister, and me.",
      "よにんかぞくです ちちと ははと あねと わたしです",
      ["と", "です", "よにんかぞく", "わたし", "です", "と", "ちち", "と", "はは", "あね"],
      ["よにんかぞく", "です", "ちち", "と", "はは", "と", "あね", "と", "わたし", "です"],
    ),
    sentenceMcq({
      id: "ja-m19-5-2-mcq-nannin",
      prompt: "Which means 'How many people are in your family?'",
      correctKana: "なんにんかぞくですか。",
      distractorsKana: [
        "なんにんですか。",
        "かぞくは なんですか。",
        "なんにんかぞくです。",
      ],
      explanation: "なんにんかぞく = how many-person family. か makes it a question.",
    }),
    cloze(
      "ja-m19-5-2-cloze-nin",
      "わたしは ",
      "かぞくです。",
      "ごにん",
      ["ごにん", "いつにん", "ごさい", "ごまい"],
      "I'm from a family of five.",
      "わたしは ごにんかぞくです。",
      "People counter: ごにん. (いつにん doesn't exist — native numbers stop at ふたり.)",
    ),
    listeningBuildSentence({
      id: "ja-m19-5-2-lb-rokunin",
      target: "わたしは ろくにんかぞくです",
      tiles: ["ごにんかぞく", "ろくにんかぞく", "です", "わたし", "よにんかぞく", "は"],
      correctOrder: ["わたし", "は", "ろくにんかぞく", "です"],
      promptEn: "Hear it, build it: 'I'm from a family of six.'",
    }),
    listeningCompSentence({
      id: "ja-m19-5-2-lc-sannin",
      audioText: "さんにんかぞくです ちちと ははと わたしです",
      correctMeaningEn: "We're a family of three — father, mother, and me.",
      distractorsEn: [
        "We're a family of four.",
        "We're a family of three — mother, sister, and me.",
        "We're a family of two.",
      ],
    }),
    build(
      "ja-m19-5-2-build-sannin",
      "Say: We're a family of three.",
      "さんにんかぞくです",
      ["ごにんかぞく", "よにんかぞく", "さんにんかぞく", "です"],
      ["さんにんかぞく", "です"],
    ),
    cloze(
      "ja-m19-5-2-cloze-to",
      "ちち",
      " ははと あねと わたしです。",
      "と",
      ["と", "は", "が", "の"],
      "Father and mother and older sister and me.",
      "ちちと ははと あねと わたしです。",
      "と connects nouns — 'A and B and C.'",
    ),
    translateStep({
      id: "ja-m19-5-2-translate",
      promptEn: "We're a family of five.",
      acceptedAnswers: [
        "ごにんかぞくです",
        "ごにんかぞくです。",
      ],
      audioText: "ごにんかぞくです",
    }),
    selfExplain({
      id: "ja-m19-5-2-self-explain",
      anchorLabel: "にんかぞく counter",
      anchorAudioText: "わたしは よにんかぞくです",
      question: "Why よにん and not しにん?",
      rule: { text: "When counting people, 4 uses よにん (not しにん). This matches the native number よ that avoids the homophone し (death). Same as よじ (4 o'clock)." },
      surface: { text: "よにん is the polite form and しにん is the casual form." },
      distractor: { text: "よにん is only used for family members; しにん is for counting other people." },
      ruleExplanation:
        "Japanese avoids し (which sounds like 死 'death') in many counters. よ is the preferred alternate reading for 4 in most counting contexts.",
    }),
    speaking(
      "ja-m19-5-2-speak-sentence",
      "なんにんかぞくですか",
      "How many people are in your family?",
    ),
    // ── たんじょうび (birthday) — new word; family milestone vocab ──
    build(
      "ja-m19-5-2-build-tanjoubi",
      "Pick the Japanese for: birthday",
      "たんじょうび",
      ["やすみ", "たんじょうび", "ようび", "ともだち"],
      ["たんじょうび"],
    ),
    listeningCompSentence({
      id: "ja-m19-5-2-lc-tanjoubi",
      audioText: "あしたは ちちの たんじょうびです",
      correctMeaningEn: "Tomorrow is my dad's birthday.",
      distractorsEn: [
        "Yesterday was my dad's birthday.",
        "Tomorrow is my mom's birthday.",
        "Tomorrow is my dad's day off.",
      ],
    }),
    // ── けっこん (marriage) — new word; ています stative from m15 ──
    build(
      "ja-m19-5-2-build-kekkon",
      "Pick the Japanese for: marriage",
      "けっこん",
      ["かぞく", "けっこん", "たんじょうび", "しごと"],
      ["けっこん"],
    ),
    listeningCompSentence({
      id: "ja-m19-5-2-lc-kekkon",
      audioText: "あねは けっこんしています",
      correctMeaningEn: "My older sister is married.",
      distractorsEn: [
        "My older sister is working.",
        "My younger sister is married.",
        "My older sister got divorced.",
      ],
    }),
    speaking(
      "ja-m19-5-2-speak-tanjoubi",
      "たんじょうびは いつですか",
      "When is your birthday?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-5-2-rev-mcq-1", M19_5_2_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-5-2-rev-lc-1",
      audioText: "まいにち コーヒーを のみます",
      correctMeaningEn: "I drink coffee every day.",
      distractorsEn: [
        "I drink tea every day.",
        "I sometimes drink coffee.",
        "I drank coffee yesterday.",
      ],
      exercisedAtomKanas: ["コーヒー"],
    }),
    speaking("ja-m19-5-2-rev-speak-1", M19_5_2_REVIEW[2].kana, M19_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-5-2-rev", M19_5_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M19_5_2.steps);
assertAnswerRotation(M19_5_2.steps, 1);
assertNoConsecutiveSame(M19_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-6-1 — Interleaved drill (register + age + family size)
// ═══════════════════════════════════════════════════════════════════════

const M19_6_1_REVIEW = pickReviewAtoms("ja-m19-6-1-rev", M19_REVIEW_POOL, 5);

export const M19_6_1: LessonContent = {
  id: "ja-m19-6-1",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "Family — interleaved drill",
  description:
    "Mix all M19 patterns: family register, age counter, family size. Every step requires choosing the right form.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    // ── Mixed drills ──
    sentenceMcq({
      id: "ja-m19-6-1-mcq-1",
      prompt: "Telling a colleague your family size:",
      correctKana: "ごにんかぞくです。",
      distractorsKana: [
        "ごにんです。",
        "いつにんかぞくです。",
        "ごにんかぞくですか。",
      ],
      explanation: "ごにんかぞく = a family of five.",
    }),
    build(
      "ja-m19-6-1-build-haha-age",
      "Say: My mother is 45 years old.",
      "ははは よんじゅうごさいです",
      ["よんじゅうごさい", "おかあさん", "です", "よんじゅっさい", "は", "はは"],
      ["はは", "は", "よんじゅうごさい", "です"],
    ),
    build(
      "ja-m19-6-1-build-1",
      "Ask: How old is your younger sister?",
      "いもうとさんは なんさいですか",
      ["いもうと", "いもうとさん", "なんさい", "です", "おいくつ", "か", "は"],
      ["いもうとさん", "は", "なんさい", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m19-6-1-lc-1",
      audioText: "あには にじゅうさんさいです",
      correctMeaningEn: "My older brother is 23 years old.",
      distractorsEn: [
        "Your older brother is 23.",
        "My older sister is 23.",
        "My older brother is 32.",
      ],
    }),
    sentenceMcq({
      id: "ja-m19-6-1-mcq-2",
      prompt: "Asking about someone else's grandfather politely:",
      correctKana: "おじいさんは おいくつですか。",
      distractorsKana: [
        "そふは おいくつですか。",
        "おじいさんは なんさいですか。",
        "おばあさんは おいくつですか。",
      ],
      explanation: "SOMEONE ELSE's grandfather → おじいさん. Polite age question → おいくつ.",
    }),
    listeningCompSentence({
      id: "ja-m19-6-1-lc-list",
      audioText: "ちちと ははと おとうとと わたしです",
      correctMeaningEn: "Dad, mom, my younger brother, and me.",
      distractorsEn: [
        "Dad, mom, my older brother, and me.",
        "Dad, mom, my younger sister, and me.",
        "Grandfather, dad, mom, and me.",
      ],
    }),
    build(
      "ja-m19-6-1-build-2",
      "Say: My grandmother is 70 years old.",
      "そぼは ななじゅっさいです",
      ["はちじゅっさい", "は", "おばあさん", "そぼ", "です", "ななじゅっさい"],
      ["そぼ", "は", "ななじゅっさい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m19-6-1-lb-1",
      target: "ごにんかぞくです そふと ちちと ははと あねと わたしです",
      tiles: ["そふ", "おとうと", "と", "ごにんかぞく", "と", "と", "と", "わたし", "はは", "です", "あね", "です", "ちち", "そぼ"],
      correctOrder: ["ごにんかぞく", "です", "そふ", "と", "ちち", "と", "はは", "と", "あね", "と", "わたし", "です"],
      promptEn: "Hear it, build it: 'Family of five — grandfather, dad, mom, older sister, and me.'",
    }),
    sentenceMcq({
      id: "ja-m19-6-1-mcq-3",
      prompt: "Talking about YOUR older sister to a colleague:",
      correctKana: "あねは にじゅうはっさいです。",
      distractorsKana: [
        "おねえさんは にじゅうはっさいです。",
        "あねは にじゅうはちさいです。",
        "いもうとは にじゅうはっさいです。",
      ],
      explanation: "YOUR sister → あね. 28 → にじゅうはっさい (sound change for 8).",
    }),
    build(
      "ja-m19-6-1-build-shigoto",
      "Ask: What is your mother's job?",
      "おかあさんの おしごとは なんですか",
      ["か", "おしごと", "です", "の", "は", "なん", "はは", "おかあさん"],
      ["おかあさん", "の", "おしごと", "は", "なん", "です", "か"],
    ),
    build(
      "ja-m19-6-1-build-3",
      "Say: My younger brother is 10 years old.",
      "おとうとは じゅっさいです",
      ["じゅうさい", "おとうとさん", "おとうと", "は", "じゅっさい", "です"],
      ["おとうと", "は", "じゅっさい", "です"],
    ),
    translateStep({
      id: "ja-m19-6-1-translate",
      promptEn: "I'm from a family of four.",
      acceptedAnswers: [
        "よにんかぞくです",
        "よにんかぞくです。",
        "わたしは よにんかぞくです",
        "わたしは よにんかぞくです。",
      ],
      audioText: "わたしは よにんかぞくです",
    }),
    selfExplain({
      id: "ja-m19-6-1-self-explain",
      anchorLabel: "Family register in age sentences",
      anchorAudioText: "あには にじゅうさんさいです",
      question: "Why あに and not おにいさん when saying his age?",
      rule: { text: "You're talking about YOUR older brother to an outsider. Use humble form あに regardless of what you're saying about him." },
      surface: { text: "あに is used because he's older than you." },
      distractor: { text: "あに is used for ages under 30; おにいさん for ages over 30." },
      ruleExplanation:
        "The register choice depends on WHOSE family member, not what you're saying. Your brother = あに always (when talking to outsiders).",
    }),
    speaking(
      "ja-m19-6-1-speak",
      "ごにんかぞくです ちちと ははと あにと いもうとと わたしです",
      "Family of five — dad, mom, older brother, younger sister, and me.",
    ),
    // ── Review tail ──
    speaking("ja-m19-6-1-rev-speak-1", M19_6_1_REVIEW[0].kana, M19_6_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m19-6-1-rev-lc-1",
      audioText: M19_6_1_REVIEW[1].kana,
      correctMeaningEn: M19_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_6_1_REVIEW[2].meaningEn,
        M19_6_1_REVIEW[3].meaningEn,
        M19_6_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m19-6-1-rev-mcq-1", M19_6_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M19_REVIEW_POOL),
    speaking("ja-m19-6-1-rev-speak-2", M19_6_1_REVIEW[2].kana, M19_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-6-1-rev", M19_6_1_REVIEW.slice(0, 5)),
  ],
};

assertNoSameAnswerCluster(M19_6_1.steps);
assertAnswerRotation(M19_6_1.steps, 1);
assertNoConsecutiveSame(M19_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-6-2 — Production (translate + speaking family introductions)
// ═══════════════════════════════════════════════════════════════════════

const M19_6_2_REVIEW = pickReviewAtoms("ja-m19-6-2-rev", M19_REVIEW_POOL, 5);

export const M19_6_2: LessonContent = {
  id: "ja-m19-6-2",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "Family — production",
  description:
    "Production-heavy: translate, build, and speak family introductions.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    // ── Production drills ──
    build(
      "ja-m19-6-2-build-1",
      "Say: My father is 50 years old.",
      "ちちは ごじゅっさいです",
      ["よんじゅっさい", "ごじゅっさい", "ちち", "おとうさん", "です", "は"],
      ["ちち", "は", "ごじゅっさい", "です"],
    ),
    speaking(
      "ja-m19-6-2-speak-1",
      "ちちは ごじゅっさいです",
      "My father is 50 years old.",
    ),
    translateStep({
      id: "ja-m19-6-2-translate-1",
      promptEn: "My older sister is a nurse.",
      acceptedAnswers: [
        "あねは かんごしです",
        "あねは かんごしです。",
      ],
      audioText: "あねは かんごしです",
    }),
    build(
      "ja-m19-6-2-build-2",
      "Say: Is your older brother a university student?",
      "おにいさんは だいがくせいですか",
      ["がくせい", "は", "あに", "か", "です", "おにいさん", "だいがくせい"],
      ["おにいさん", "は", "だいがくせい", "です", "か"],
    ),
    speaking(
      "ja-m19-6-2-speak-2",
      "おにいさんは だいがくせいですか",
      "Is your older brother a university student?",
    ),
    sentenceMcq({
      id: "ja-m19-6-2-mcq-1",
      prompt: "Which is correct for 'My younger sister is 8 years old'?",
      correctKana: "いもうとは はっさいです。",
      distractorsKana: [
        "いもうとは はちさいです。",
        "いもうとさんは はっさいです。",
        "おねえさんは はっさいです。",
      ],
      explanation: "YOUR sister → いもうと. 8 → はっさい (sound change).",
    }),
    build(
      "ja-m19-6-2-build-3",
      "Say: We are a family of three.",
      "さんにんかぞくです",
      ["です", "ごにんかぞく", "よにんかぞく", "さんにんかぞく"],
      ["さんにんかぞく", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m19-6-2-lb-1",
      target: "そふは きゅうじゅっさいです",
      tiles: ["おじいさん", "そふ", "はちじゅっさい", "は", "きゅうじゅっさい", "です"],
      correctOrder: ["そふ", "は", "きゅうじゅっさい", "です"],
      promptEn: "Hear it, build it: 'My grandfather is 90 years old.'",
    }),
    translateStep({
      id: "ja-m19-6-2-translate-2",
      promptEn: "How old is your mother? (polite)",
      acceptedAnswers: [
        "おかあさんは おいくつですか",
        "おかあさんは おいくつですか。",
      ],
      audioText: "おかあさんは おいくつですか",
    }),
    build(
      "ja-m19-6-2-build-4",
      "Say: My older sister likes cooking.",
      "あねは りょうりが すきです",
      ["おねえさん", "です", "りょうり", "は", "きらい", "が", "あね", "すき"],
      ["あね", "は", "りょうり", "が", "すき", "です"],
    ),
    speaking(
      "ja-m19-6-2-speak-3",
      "あねは りょうりが すきです",
      "My older sister likes cooking.",
    ),
    listeningCompSentence({
      id: "ja-m19-6-2-lc-1",
      audioText: "おばあさんは おいくつですか",
      correctMeaningEn: "How old is your grandmother?",
      distractorsEn: [
        "How old is my grandmother?",
        "How old is your grandfather?",
        "Is your grandmother well?",
      ],
    }),
    build(
      "ja-m19-6-2-build-5",
      "Say: My younger sister likes movies.",
      "いもうとは えいがが すきです",
      ["おとうと", "えいが", "すき", "ほん", "は", "いもうと", "が", "です"],
      ["いもうと", "は", "えいが", "が", "すき", "です"],
    ),
    cloze(
      "ja-m19-6-2-cloze-sai",
      "そぼは ",
      "です。",
      "ななじゅうはっさい",
      ["ななじゅうはっさい", "ななじゅうはちさい", "ななじゅっさい", "ななじゅうごさい"],
      "My grandmother is 78 years old.",
      "そぼは ななじゅうはっさいです。",
      "78 → ななじゅうはっさい — the はっさい sound change applies.",
    ),
    selfExplain({
      id: "ja-m19-6-2-self-explain",
      anchorLabel: "Full family introduction pattern",
      anchorAudioText: "ごにんかぞくです",
      question: "What's the order for a family self-introduction?",
      rule: { text: "1) State family size (〜にんかぞくです). 2) List members with と (ちちと ははと…). 3) Add details per member. Use humble forms for YOUR family." },
      surface: { text: "Start with the oldest member and work down by age." },
      distractor: { text: "Always use おとうさん/おかあさん in self-introductions to show respect." },
      ruleExplanation:
        "The family self-introduction follows: size → composition → details. Humble forms throughout because you're talking about YOUR family.",
    }),
    speaking(
      "ja-m19-6-2-speak-4",
      "よにんかぞくです",
      "We're a family of four.",
    ),
    // ── Review tail ──
    speaking("ja-m19-6-2-rev-speak-1", M19_6_2_REVIEW[0].kana, M19_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m19-6-2-rev-lc-1",
      audioText: "えきの ちかくに みせが あります",
      correctMeaningEn: "There is a shop near the station.",
      distractorsEn: [
        "There is a bank near the station.",
        "The shop is inside the station.",
        "There is a shop near the school.",
      ],
      exercisedAtomKanas: ["みせ"],
    }),
    vocabMcq("ja-m19-6-2-rev-mcq-1", M19_6_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M19_REVIEW_POOL),
    speaking("ja-m19-6-2-rev-speak-2", M19_6_2_REVIEW[2].kana, M19_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-6-2-rev", M19_6_2_REVIEW.slice(0, 5)),
  ],
};

assertNoSameAnswerCluster(M19_6_2.steps);
assertAnswerRotation(M19_6_2.steps, 1);
assertNoConsecutiveSame(M19_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-STORY — ゆき introduces her family (storyComprehension narrative,
//   §13.13 closer: family register + age + family size in one story)
// ═══════════════════════════════════════════════════════════════════════

export const M19_STORY: LessonContent = {
  id: "ja-m19-story",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — ゆき introduces her family",
  description:
    "Listen to ゆき tell you about her family — who they are, what they do, how old they are — then reply with questions and your own introduction.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    ...storyComprehension({
      idPrefix: "ja-m19-story-s1",
      narrative: [
        { kana: "わたしは ごにんかぞくです。" },
        { kana: "ちちと ははと あにと いもうとと わたしです。" },
        { kana: "ちちは ぎんこうで はたらいています。" },
        { kana: "あには にじゅうにさいです。だいがくせいです。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "How many people are in ゆき's family?",
          correctText: "Five people.",
          distractors: ["Four people.", "Three people.", "Six people."],
          explanation: "ごにんかぞく = family of five.",
        },
        {
          id: "s1-q2",
          prompt: "What does ゆき say about her older brother?",
          correctText: "He is 22 and a university student.",
          distractors: [
            "He is 20 and works at a bank.",
            "He is 22 and a teacher.",
            "He is a high school student.",
          ],
          explanation: "にじゅうにさい = 22 years old. だいがくせい = university student.",
        },
      ],
      responseBuild: {
        target: "いもうとさんは おいくつですか",
        tiles: ["おいくつ", "いもうとさん", "なんにん", "は", "です", "いもうと", "か"],
        correctOrder: ["いもうとさん", "は", "おいくつ", "です", "か"],
        promptEn:
          "Ask ゆき politely about HER younger sister: 'How old is your younger sister?'",
      },
    }),
    sentenceMcq({
      id: "ja-m19-story-mcq-1",
      prompt:
        "ゆき said あに for her own brother. How would YOU ask her about him?",
      correctKana: "おにいさんは おいくつですか。",
      distractorsKana: [
        "あには おいくつですか。",
        "おとうとさんは おいくつですか。",
        "おにいさんが おいくつです。",
      ],
      explanation:
        "SOMEONE ELSE's older brother → honorific おにいさん. あに is only for your own.",
    }),
    ...storyComprehension({
      idPrefix: "ja-m19-story-s2",
      narrative: [
        { kana: "いもうとは はっさいです。" },
        { kana: "いもうとは えいがが すきです。" },
        { kana: "そぼは ななじゅうはっさいです。" },
        { kana: "かぞくは みんな げんきです。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "How old is ゆき's younger sister?",
          correctText: "8 years old.",
          distractors: ["10 years old.", "5 years old.", "18 years old."],
          explanation: "はっさい = 8 years old (sound change from はち).",
        },
        {
          id: "s2-q2",
          prompt: "What does ゆき say at the end?",
          correctText: "Everyone in the family is well.",
          distractors: [
            "Her grandmother is sick.",
            "Everyone likes movies.",
            "Her family lives far away.",
          ],
          explanation: "かぞくは みんな げんきです = my family are all well.",
        },
      ],
      responseBuild: {
        target: "さんにんかぞくです ちちと ははと わたしです",
        tiles: ["ちち", "さんにんかぞく", "と", "はは", "です", "と", "わたし", "です", "あに"],
        correctOrder: ["さんにんかぞく", "です", "ちち", "と", "はは", "と", "わたし", "です"],
        promptEn:
          "Now introduce YOUR family: 'We're a family of three — dad, mom, and me.'",
      },
    }),
    cloze(
      "ja-m19-story-cloze-1",
      "",
      "は にじゅうにさいです。",
      "あに",
      ["あに", "おにいさん", "あね", "いもうと"],
      "My older brother is 22. (ゆき, about her own brother)",
      "あには にじゅうにさいです。",
      "ゆき talks about her OWN brother → humble あに, not おにいさん.",
    ),
    listeningBuildSentence({
      id: "ja-m19-story-lb-1",
      target: "かぞくは みんな げんきです",
      tiles: ["みんな", "かぞく", "げんき", "は", "です", "みなさん"],
      correctOrder: ["かぞく", "は", "みんな", "げんき", "です"],
      promptEn: "Hear it, build it: 'My family are all well.'",
    }),
    speaking(
      "ja-m19-story-speak-1",
      "いもうとさんは おいくつですか",
      "How old is your younger sister?",
    ),
    sentenceMcq({
      id: "ja-m19-story-mcq-summary",
      prompt: "In the story, which register pattern did ゆき use?",
      correctKana:
        "ゆき used humble forms (ちち, はは, あに, いもうと, そぼ) for her own family. You replied with honorific forms (いもうとさん, おにいさん).",
      distractorsKana: [
        "ゆき used honorific forms for her own family.",
        "Both sides used humble forms throughout.",
        "Only age-related vocabulary appeared.",
      ],
      explanation:
        "The natural register switch: humble for your own family, honorific for someone else's.",
    }),
    speaking(
      "ja-m19-story-speak-2",
      "さんにんかぞくです ちちと ははと わたしです",
      "Family of three — dad, mom, and me.",
    ),
  ],
};

assertNoConsecutiveSame(M19_STORY.steps);
assertPassiveCardsHaveFollowup(M19_STORY.steps);
assertNoExplanationOnPassive(M19_STORY.steps);
assertExplanationDoesntLeakAnswer(M19_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-7-1 — Comprehension closer (dialogue)
// ═══════════════════════════════════════════════════════════════════════

const M19_7_1_REVIEW = pickReviewAtoms("ja-m19-7-1-rev", M19_REVIEW_POOL, 5);

export const M19_7_1: LessonContent = {
  id: "ja-m19-7-1",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "Family introduction — dialogue",
  description:
    "A longer dialogue: introducing family at a school open day. All M19 patterns combined.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    dialogueListen({
      id: "ja-m19-7-1-scene-1",
      lines: [
        { speaker: "やまだ", kana: "はじめまして。やまだです。なんにんかぞくですか。" },
        { speaker: "たなか", kana: "よにんかぞくです。しゅじんと むすめと むすこと わたしです。" },
        { speaker: "やまだ", kana: "おむすめさんは なんさいですか。" },
        { speaker: "たなか", kana: "むすめは じゅうにさいです。ちゅうがくせいです。" },
      ],
      questions: [
        {
          id: "d1-q1",
          prompt: "How big is たなか's family?",
          correctText: "Four people.",
          distractors: ["Three people.", "Five people.", "Two people."],
          explanation: "よにんかぞく = family of four.",
        },
        {
          id: "d1-q2",
          prompt: "How old is たなか's daughter?",
          correctText: "12 years old, a middle school student.",
          distractors: ["10 years old.", "12 years old, an elementary student.", "8 years old."],
          explanation: "じゅうにさい = 12 years old. ちゅうがくせい = middle school student.",
        },
      ],
    }),
    build(
      "ja-m19-7-1-build-1",
      "Say: We're a family of four.",
      "よにんかぞくです",
      ["です", "ごにんかぞく", "よにんかぞく", "さんにんかぞく"],
      ["よにんかぞく", "です"],
    ),
    sentenceMcq({
      id: "ja-m19-7-1-mcq-1",
      prompt: "やまだ said おむすめさん, but たなか said むすめ. Why?",
      correctKana: "やまだ uses honorific for たなか's child. たなか uses humble for her own.",
      distractorsKana: [
        "They are synonyms with no difference.",
        "むすめ is for girls, おむすめさん is for boys.",
        "おむすめさん is only for older daughters.",
      ],
      explanation: "Same うち/よそ pattern: honorific for others' family, humble for your own.",
    }),
    cloze(
      "ja-m19-7-1-cloze-register",
      "",
      "は じゅうにさいです。",
      "むすめ",
      ["むすめ", "おむすめさん", "むすこ", "おむすこさん"],
      "My daughter is 12 years old. (talking about your own daughter)",
      "むすめは じゅうにさいです。",
      "YOUR daughter → humble form むすめ (no お…さん).",
    ),
    listeningCompSentence({
      id: "ja-m19-7-1-lc-1",
      audioText: "おむすこさんは おいくつですか",
      correctMeaningEn: "How old is your son?",
      distractorsEn: [
        "How old is my son?",
        "How old is your daughter?",
        "What does your son do?",
      ],
    }),
    build(
      "ja-m19-7-1-build-2",
      "Say: My son is 8 years old.",
      "むすこは はっさいです",
      ["は", "じゅっさい", "むすこ", "です", "おむすこさん", "はっさい"],
      ["むすこ", "は", "はっさい", "です"],
    ),
    speaking(
      "ja-m19-7-1-speak-1",
      "おむすこさんは おいくつですか",
      "How old is your son?",
    ),
    sentenceMcq({
      id: "ja-m19-7-1-mcq-2",
      prompt: "If たなか asks about やまだ's father, which form?",
      correctKana: "おとうさんは おげんきですか。",
      distractorsKana: [
        "ちちは おげんきですか。",
        "おかあさんは おげんきですか。",
        "そふは おげんきですか。",
      ],
      explanation: "Asking about SOMEONE ELSE's father → おとうさん.",
    }),
    listeningBuildSentence({
      id: "ja-m19-7-1-lb-1",
      target: "むすめは ほんが すきです",
      tiles: ["が", "は", "むすめ", "おむすめさん", "です", "すき", "ほん"],
      correctOrder: ["むすめ", "は", "ほん", "が", "すき", "です"],
      promptEn: "Hear it, build it: 'My daughter likes books.'",
    }),
    build(
      "ja-m19-7-1-build-3",
      "Say: My husband, daughter, son, and me.",
      "しゅじんと むすめと むすこと わたしです",
      ["あに", "わたし", "と", "と", "と", "しゅじん", "むすこ", "むすめ", "です"],
      ["しゅじん", "と", "むすめ", "と", "むすこ", "と", "わたし", "です"],
    ),
    translateStep({
      id: "ja-m19-7-1-translate",
      promptEn: "How old is your daughter?",
      acceptedAnswers: [
        "おむすめさんは なんさいですか",
        "おむすめさんは なんさいですか。",
        "おむすめさんは おいくつですか",
        "おむすめさんは おいくつですか。",
      ],
      audioText: "おむすめさんは なんさいですか",
    }),
    selfExplain({
      id: "ja-m19-7-1-self-explain",
      anchorLabel: "Register in a real conversation",
      anchorAudioText: "おむすめさんは なんさいですか",
      question: "In a conversation, who switches registers?",
      rule: { text: "BOTH speakers switch. Each uses humble for their own family and honorific for the other person's family. The switch happens naturally in every exchange." },
      surface: { text: "Only the listener uses honorific; the speaker always uses humble." },
      distractor: { text: "Only younger speakers need to use humble; older speakers can use either." },
      ruleExplanation:
        "Both parties follow the same rule: MY family = humble, YOUR family = honorific. This creates the natural back-and-forth you hear in the dialogue.",
    }),
    speaking(
      "ja-m19-7-1-speak-2",
      "むすめは じゅうにさいです",
      "My daughter is 12 years old.",
    ),
    // ── Review tail ──
    speaking("ja-m19-7-1-rev-speak-1", M19_7_1_REVIEW[0].kana, M19_7_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m19-7-1-rev-lc-1",
      audioText: "いぬの なまえは ハチです",
      correctMeaningEn: "The dog's name is Hachi.",
      distractorsEn: [
        "The cat's name is Hachi.",
        "What is the dog's name?",
        "The dog is small.",
      ],
      exercisedAtomKanas: ["なまえ"],
    }),
    vocabMcq("ja-m19-7-1-rev-mcq-1", M19_7_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M19_REVIEW_POOL),
    speaking("ja-m19-7-1-rev-speak-2", M19_7_1_REVIEW[2].kana, M19_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-7-1-rev", M19_7_1_REVIEW.slice(0, 5)),
  ],
};

assertNoSameAnswerCluster(M19_7_1.steps);
assertAnswerRotation(M19_7_1.steps, 1);
assertNoConsecutiveSame(M19_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-7-2 — Production wrap-up (all M19 patterns)
// ═══════════════════════════════════════════════════════════════════════

const M19_7_2_REVIEW = pickReviewAtoms("ja-m19-7-2-rev", M19_REVIEW_POOL, 5);

export const M19_7_2: LessonContent = {
  id: "ja-m19-7-2",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "Family & people — wrap-up",
  description:
    "Final production round: all family register pairs, age counter, family size, people vocabulary.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    // ── Production drills ──
    build(
      "ja-m19-7-2-build-1",
      "Say: My older brother is 25 years old.",
      "あには にじゅうごさいです",
      ["です", "さんじゅうさい", "にじゅうごさい", "おにいさん", "は", "あに"],
      ["あに", "は", "にじゅうごさい", "です"],
    ),
    speaking(
      "ja-m19-7-2-speak-1",
      "あには にじゅうごさいです",
      "My older brother is 25 years old.",
    ),
    translateStep({
      id: "ja-m19-7-2-translate-1",
      promptEn: "Is your grandmother well?",
      acceptedAnswers: [
        "おばあさんは おげんきですか",
        "おばあさんは おげんきですか。",
      ],
      audioText: "おばあさんは おげんきですか",
    }),
    build(
      "ja-m19-7-2-build-2",
      "Say: There are two boys and three girls.",
      "おとこのこが ふたりと おんなのこが さんにん います",
      ["おんなのこ", "ふたり", "と", "さんにん", "おとこのこ", "が", "います", "が"],
      ["おとこのこ", "が", "ふたり", "と", "おんなのこ", "が", "さんにん", "います"],
    ),
    speaking(
      "ja-m19-7-2-speak-2",
      "おとこのこが ふたりと おんなのこが さんにん います",
      "There are two boys and three girls.",
    ),
    sentenceMcq({
      id: "ja-m19-7-2-mcq-1",
      prompt: "Talking about YOUR mother to a colleague:",
      correctKana: "ははは かんごしです。",
      distractorsKana: [
        "おかあさんは かんごしです。",
        "ははは かんごしですか。",
        "おかあさんが かんごしです。",
      ],
      explanation: "YOUR mother → humble form はは.",
    }),
    listeningCompSentence({
      id: "ja-m19-7-2-lc-1",
      audioText: "せいとが じゅうにん います",
      correctMeaningEn: "There are 10 students.",
      distractorsEn: [
        "There are 12 students.",
        "There are 10 teachers.",
        "There are 10 children.",
      ],
    }),
    build(
      "ja-m19-7-2-build-3",
      "Ask: Let's ask the police officer.",
      "おまわりさんに ききましょう",
      ["に", "せんせい", "を", "いきましょう", "おまわりさん", "ききましょう"],
      ["おまわりさん", "に", "ききましょう"],
    ),
    cloze(
      "ja-m19-7-2-cloze-sai",
      "あねは ",
      "です。",
      "にじゅうはっさい",
      ["にじゅうはっさい", "にじゅうはちさい", "にじゅっさい", "にじゅうごさい"],
      "My older sister is 28 years old.",
      "あねは にじゅうはっさいです。",
      "28 → にじゅうはっさい — sound change for 8 inside larger numbers.",
    ),
    translateStep({
      id: "ja-m19-7-2-translate-2",
      promptEn: "The baby is sleeping.",
      acceptedAnswers: [
        "あかちゃんは ねています",
        "あかちゃんは ねています。",
      ],
      audioText: "あかちゃんは ねています",
    }),
    build(
      "ja-m19-7-2-build-4",
      "Say: Adults drink coffee. Children drink milk.",
      "おとなは コーヒーを のみます こどもは ぎゅうにゅうを のみます",
      ["は", "ぎゅうにゅう", "おとな", "こども", "を", "は", "を", "のみます", "コーヒー", "のみます"],
      ["おとな", "は", "コーヒー", "を", "のみます", "こども", "は", "ぎゅうにゅう", "を", "のみます"],
    ),
    listeningBuildSentence({
      id: "ja-m19-7-2-lb-1",
      target: "おとうとさんは おいくつですか",
      tiles: ["か", "です", "おとうとさん", "おいくつ", "なんさい", "は", "おとうと"],
      correctOrder: ["おとうとさん", "は", "おいくつ", "です", "か"],
      promptEn: "Hear it, build it: 'How old is your younger brother?'",
    }),
    sentenceMcq({
      id: "ja-m19-7-2-mcq-2",
      prompt: "Which means 'There are five children.'?",
      correctKana: "こどもが ごにん います。",
      distractorsKana: [
        "おとなが ごにん います。",
        "こどもは ごにん です。",
        "こどもが さんにん います。",
      ],
      explanation: "こども = child. ごにん = five people. が + います for existence.",
    }),
    selfExplain({
      id: "ja-m19-7-2-self-explain",
      anchorLabel: "M19 complete system",
      anchorAudioText: "あには にじゅうごさいです",
      question: "What three systems did M19 teach?",
      rule: { text: "1) Family register (humble/honorific pairs for family words). 2) Age counter (〜さい with sound changes). 3) Family size (〜にんかぞく). All three combine in self-introductions." },
      surface: { text: "M19 only taught family vocabulary — no grammar patterns." },
      distractor: { text: "M19 taught a new particle and two new verb forms." },
      ruleExplanation:
        "The three systems interlock: register tells you WHICH word to use, さい tells age, にんかぞく tells size. Together they enable a complete family introduction.",
    }),
    speaking(
      "ja-m19-7-2-speak-3",
      "よにんかぞくです ははと あにと いもうとと わたしです",
      "Family of four — mom, older brother, younger sister, and me.",
    ),
    // ── Review tail ──
    speaking("ja-m19-7-2-rev-speak-1", M19_7_2_REVIEW[0].kana, M19_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m19-7-2-rev-lc-1",
      audioText: M19_7_2_REVIEW[1].kana,
      correctMeaningEn: M19_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_7_2_REVIEW[2].meaningEn,
        M19_7_2_REVIEW[3].meaningEn,
        M19_7_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m19-7-2-rev-mcq-1", M19_7_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M19_REVIEW_POOL),
    speaking("ja-m19-7-2-rev-speak-2", M19_7_2_REVIEW[2].kana, M19_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-7-2-rev", M19_7_2_REVIEW.slice(0, 5)),
  ],
};

assertNoSameAnswerCluster(M19_7_2.steps);
assertAnswerRotation(M19_7_2.steps, 1);
assertNoConsecutiveSame(M19_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M19_1_1.steps,
  ...M19_1_2.steps,
  ...M19_2_1.steps,
  ...M19_2_2.steps,
  ...M19_3_1.steps,
  ...M19_3_2.steps,
  ...M19_4_1.steps,
  ...M19_4_2.steps,
  ...M19_5_1.steps,
  ...M19_5_2.steps,
  ...M19_6_1.steps,
  ...M19_6_2.steps,
  ...M19_7_1.steps,
  ...M19_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M19_1_1, M19_1_2, M19_2_1, M19_2_2, M19_3_1, M19_3_2,
  M19_4_1, M19_4_2, M19_5_1, M19_5_2, M19_6_1, M19_6_2,
  M19_STORY, M19_7_1, M19_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
