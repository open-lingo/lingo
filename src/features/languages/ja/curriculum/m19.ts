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
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  M3_M7_REVIEW_POOL,
  withoutMcqBlocked,
  pickReviewAtoms,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
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
    infoStep(
      "ja-m19-1-1-info-open",
      "Two words for 'father,' two for 'mother'",
      "Japanese has humble forms (ちち, はは) for YOUR family and honorific forms (おとうさん, おかあさん) for OTHER people's family. This is the key to sounding natural.",
    ),
    RULE_FAMILY_REGISTER,
    // ── ちち (humble: father) ──
    build(
      "ja-m19-1-1-build-chichi",
      "Pick the humble word for: my father",
      "ちち",
      ["ちち", "おとうさん", "はは", "おかあさん"],
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
      ["おとうさん", "ちち", "おかあさん", "はは"],
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
      ["はは", "おかあさん", "ちち", "おとうさん"],
      ["はは"],
    ),
    speaking("ja-m19-1-1-speak-haha", "はは", "Mother (humble)"),
    // ── おかあさん (honorific: mother) ──
    build(
      "ja-m19-1-1-build-okaasan",
      "Pick the honorific word for: (someone else's) mother",
      "おかあさん",
      ["おかあさん", "はは", "おとうさん", "ちち"],
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
      "ja-m19-1-1-cloze-ha-1",
      "ちち",
      " かいしゃいんです。",
      "は",
      ["は", "が", "を", "の"],
      "My father is a company employee.",
      "ちちは かいしゃいんです。",
      "は marks the topic — 'my father.'",
    ),
    build(
      "ja-m19-1-1-build-haha-sentence",
      "Say: My mother is a teacher.",
      "ははは せんせいです",
      ["はは", "は", "せんせい", "です", "ちち", "がくせい"],
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
      "ja-m19-1-1-cloze-ga",
      "おかあさん",
      " おげんきですか。",
      "は",
      ["は", "が", "を", "も"],
      "Is your mother well?",
      "おかあさんは おげんきですか。",
      "は marks the topic when asking about someone else's family.",
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
      "ちちは かいしゃいんです",
      "My father is a company employee.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-1-1-rev-mcq-1", M19_1_1_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-1-1-rev-lc-1",
      audioText: M19_1_1_REVIEW[1].kana,
      correctMeaningEn: M19_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_1_1_REVIEW[2].meaningEn,
        M19_1_1_REVIEW[3].meaningEn,
        M19_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m19-1-1-rev-speak-1", M19_1_1_REVIEW[2].kana, M19_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-1-1-rev", M19_1_1_REVIEW),
    infoStep(
      "ja-m19-1-1-info-end",
      "You can now introduce your parents to a Japanese friend — using the right register",
      "ちち/はは for YOUR family. おとうさん/おかあさん for THEIRS. The humble/honorific distinction is the heart of Japanese politeness.",
      "win",
    ),
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
    infoStep(
      "ja-m19-1-2-info-open",
      "Register practice",
      "Humble or honorific? Every sentence demands you pick the right form for father and mother.",
    ),
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
      ["おとうさん", "は", "おげんき", "です", "か", "ちち", "も"],
      ["おとうさん", "は", "おげんき", "です", "か"],
    ),
    cloze(
      "ja-m19-1-2-cloze-wa-1",
      "はは",
      " せんせいです。",
      "は",
      ["は", "が", "を", "の"],
      "My mother is a teacher.",
      "ははは せんせいです。",
      "は marks the topic.",
    ),
    listeningCompSentence({
      id: "ja-m19-1-2-lc-chichi",
      audioText: "ちちは いしゃです",
      correctMeaningEn: "My father is a doctor.",
      distractorsEn: [
        "Your father is a doctor.",
        "My father is a teacher.",
        "My mother is a doctor.",
      ],
    }),
    build(
      "ja-m19-1-2-build-haha-ryouri",
      "Say: My mother is good at cooking.",
      "ははは りょうりが じょうずです",
      ["はは", "は", "りょうり", "が", "じょうず", "です", "おかあさん"],
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
      id: "ja-m19-1-2-lb-okaasan",
      target: "おかあさんは おげんきですか",
      tiles: ["おかあさん", "は", "おげんき", "です", "か", "ちち", "はは"],
      correctOrder: ["おかあさん", "は", "おげんき", "です", "か"],
      promptEn: "Hear it, build it: 'Is your mother well?'",
    }),
    speaking(
      "ja-m19-1-2-speak-chichi",
      "ちちは かいしゃいんです",
      "My father is a company employee.",
    ),
    translateStep({
      id: "ja-m19-1-2-translate",
      promptEn: "My mother is a teacher.",
      acceptedAnswers: [
        "ははは せんせいです",
        "ははは せんせいです。",
      ],
      audioText: "ははは せんせいです",
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
      ["ちち", "は", "げんき", "です", "おとうさん", "お"],
      ["ちち", "は", "げんき", "です"],
    ),
    cloze(
      "ja-m19-1-2-cloze-wa-2",
      "おとうさん",
      " せんせいですか。",
      "は",
      ["は", "が", "を", "の"],
      "Is your father a teacher?",
      "おとうさんは せんせいですか。",
      "は marks the topic in a question about someone else's father.",
    ),
    selfExplain({
      id: "ja-m19-1-2-self-explain",
      anchorLabel: "Register choice in context",
      anchorAudioText: "ちちは いしゃです",
      question: "When would you use おとうさん instead of ちち?",
      rule: { text: "Use おとうさん when talking about someone ELSE's father, or when addressing your own father directly at home." },
      surface: { text: "おとうさん is only used by children; adults always use ちち." },
      distractor: { text: "おとうさん is for formal situations and ちち is for casual situations." },
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
      audioText: M19_1_2_REVIEW[1].kana,
      correctMeaningEn: M19_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_1_2_REVIEW[2].meaningEn,
        M19_1_2_REVIEW[3].meaningEn,
        M19_REVIEW_POOL[1].meaningEn,
      ],
    }),
    speaking("ja-m19-1-2-rev-speak-1", M19_1_2_REVIEW[2].kana, M19_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-1-2-rev", M19_1_2_REVIEW),
    infoStep(
      "ja-m19-1-2-info-end",
      "You instinctively pick the right register for parents now",
      "ちち/はは for your own. おとうさん/おかあさん for theirs. That switch is becoming automatic.",
      "win",
    ),
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
    infoStep(
      "ja-m19-2-1-info-open",
      "Older siblings — same register rule",
      "The humble/honorific pattern extends to siblings. あに = my older brother. おにいさん = your older brother (or addressing yours directly).",
    ),
    // ── あに (humble: older brother) ──
    build(
      "ja-m19-2-1-build-ani",
      "Pick the humble word for: my older brother",
      "あに",
      ["あに", "おにいさん", "あね", "おねえさん"],
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
      ["おにいさん", "あに", "おねえさん", "あね"],
      ["おにいさん"],
    ),
    speaking("ja-m19-2-1-speak-oniisan", "おにいさん", "Older brother (honorific)"),
    // ── あね (humble: older sister) ──
    build(
      "ja-m19-2-1-build-ane",
      "Pick the humble word for: my older sister",
      "あね",
      ["あね", "おねえさん", "あに", "おにいさん"],
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
      ["おねえさん", "あね", "おにいさん", "あに"],
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
      "ja-m19-2-1-cloze-wa-1",
      "あに",
      " にほんに います。",
      "は",
      ["は", "が", "を", "に"],
      "My older brother is in Japan.",
      "あには にほんに います。",
      "は marks the topic — 'my older brother.'",
    ),
    build(
      "ja-m19-2-1-build-ane-sentence",
      "Say: My older sister is a nurse.",
      "あねは かんごしです",
      ["あね", "は", "かんごし", "です", "おねえさん", "いしゃ"],
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
    cloze(
      "ja-m19-2-1-cloze-no",
      "あね",
      " ともだちは やさしいです。",
      "の",
      ["の", "は", "が", "を"],
      "My older sister's friend is kind.",
      "あねの ともだちは やさしいです。",
      "の marks possession.",
    ),
    listeningBuildSentence({
      id: "ja-m19-2-1-lb-ani",
      target: "あには だいがくせいです",
      tiles: ["あに", "は", "だいがくせい", "です", "おにいさん", "がくせい"],
      correctOrder: ["あに", "は", "だいがくせい", "です"],
      promptEn: "Hear it, build it: 'My older brother is a university student.'",
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
      "あねは かんごしです",
      "My older sister is a nurse.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-2-1-rev-mcq-1", M19_2_1_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-2-1-rev-lc-1",
      audioText: M19_2_1_REVIEW[1].kana,
      correctMeaningEn: M19_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_2_1_REVIEW[2].meaningEn,
        M19_2_1_REVIEW[3].meaningEn,
        M19_REVIEW_POOL[2].meaningEn,
      ],
    }),
    speaking("ja-m19-2-1-rev-speak-1", M19_2_1_REVIEW[2].kana, M19_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-2-1-rev", M19_2_1_REVIEW),
    infoStep(
      "ja-m19-2-1-info-end",
      "You can now talk about your older siblings — and ask about theirs",
      "あに/あね (yours, humble) and おにいさん/おねえさん (theirs, honorific). Same pattern as parents.",
      "win",
    ),
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
    infoStep(
      "ja-m19-2-2-info-open",
      "Younger siblings are simpler",
      "For younger siblings, there's one base word — おとうと and いもうと. Add さん when talking about someone ELSE's younger sibling: おとうとさん, いもうとさん.",
    ),
    // ── おとうと (younger brother) ──
    build(
      "ja-m19-2-2-build-otouto",
      "Pick the Japanese word for: younger brother",
      "おとうと",
      ["おとうと", "いもうと", "あに", "あね"],
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
      ["いもうと", "おとうと", "あね", "おねえさん"],
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
      "Say: My younger brother is 10 years old.",
      "おとうとは じゅっさいです",
      ["おとうと", "は", "じゅっさい", "です", "いもうと", "ごさい"],
      ["おとうと", "は", "じゅっさい", "です"],
    ),
    cloze(
      "ja-m19-2-2-cloze-wa",
      "いもうと",
      " ちゅうがくせいです。",
      "は",
      ["は", "が", "を", "の"],
      "My younger sister is a middle school student.",
      "いもうとは ちゅうがくせいです。",
      "は marks the topic.",
    ),
    sentenceMcq({
      id: "ja-m19-2-2-mcq-san",
      prompt: "Asking about a friend's younger brother: 'How old is your younger brother?'",
      correctKana: "おとうとさんは なんさいですか。",
      distractorsKana: [
        "おとうとは なんさいですか。",
        "いもうとさんは なんさいですか。",
        "おにいさんは なんさいですか。",
      ],
      explanation: "Asking about SOMEONE ELSE's younger brother → add さん: おとうとさん.",
    }),
    build(
      "ja-m19-2-2-build-imouto-sentence",
      "Say: My younger sister likes cats.",
      "いもうとは ねこが すきです",
      ["いもうと", "は", "ねこ", "が", "すき", "です", "おとうと", "いぬ"],
      ["いもうと", "は", "ねこ", "が", "すき", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m19-2-2-lb-otouto",
      target: "おとうとは しょうがくせいです",
      tiles: ["おとうと", "は", "しょうがくせい", "です", "いもうと", "ちゅうがくせい"],
      correctOrder: ["おとうと", "は", "しょうがくせい", "です"],
      promptEn: "Hear it, build it: 'My younger brother is an elementary school student.'",
    }),
    cloze(
      "ja-m19-2-2-cloze-ga",
      "いもうとは ねこ",
      " すきです。",
      "が",
      ["が", "は", "を", "の"],
      "My younger sister likes cats.",
      "いもうとは ねこが すきです。",
      "が marks the object of すき — what is liked.",
    ),
    translateStep({
      id: "ja-m19-2-2-translate",
      promptEn: "My younger brother is an elementary school student.",
      acceptedAnswers: [
        "おとうとは しょうがくせいです",
        "おとうとは しょうがくせいです。",
      ],
      audioText: "おとうとは しょうがくせいです",
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
      audioText: M19_2_2_REVIEW[1].kana,
      correctMeaningEn: M19_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_2_2_REVIEW[2].meaningEn,
        M19_2_2_REVIEW[3].meaningEn,
        M19_REVIEW_POOL[3].meaningEn,
      ],
    }),
    speaking("ja-m19-2-2-rev-speak-1", M19_2_2_REVIEW[2].kana, M19_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-2-2-rev", M19_2_2_REVIEW),
    infoStep(
      "ja-m19-2-2-info-end",
      "You can now talk about your younger siblings — and politely ask about theirs",
      "おとうと/いもうと (yours). おとうとさん/いもうとさん (theirs). Simpler than the older-sibling pairs.",
      "win",
    ),
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
    infoStep(
      "ja-m19-3-1-info-open",
      "Grandparents — same rule, bigger words",
      "The humble/honorific pattern continues. そふ = my grandfather. おじいさん = your grandfather (or any elderly man). Same with そぼ / おばあさん.",
    ),
    // ── そふ (humble: grandfather) ──
    build(
      "ja-m19-3-1-build-sofu",
      "Pick the humble word for: my grandfather",
      "そふ",
      ["そふ", "おじいさん", "そぼ", "おばあさん"],
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
      ["おじいさん", "そふ", "おばあさん", "そぼ"],
      ["おじいさん"],
    ),
    speaking("ja-m19-3-1-speak-ojiisan", "おじいさん", "Grandfather (honorific)"),
    // ── そぼ (humble: grandmother) ──
    build(
      "ja-m19-3-1-build-sobo",
      "Pick the humble word for: my grandmother",
      "そぼ",
      ["そぼ", "おばあさん", "そふ", "おじいさん"],
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
      ["おばあさん", "そぼ", "おじいさん", "そふ"],
      ["おばあさん"],
    ),
    vocabMcq(
      "ja-m19-3-1-mcq-obaasan",
      { kana: "おばあさん", meaningEn: "grandmother (honorific)", emoji: "👵", fromModule: "m19" },
      M19_REVIEW_POOL,
    ),
    // ── Register drills ──
    cloze(
      "ja-m19-3-1-cloze-wa",
      "そふ",
      " にほんに すんでいます。",
      "は",
      ["は", "が", "を", "に"],
      "My grandfather lives in Japan.",
      "そふは にほんに すんでいます。",
      "は marks the topic.",
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
      ["そぼ", "は", "おおさか", "に", "すんでいます", "おばあさん", "とうきょう"],
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
      target: "そふは はちじゅうさいです",
      tiles: ["そふ", "は", "はちじゅうさい", "です", "おじいさん", "ななじゅうさい"],
      correctOrder: ["そふ", "は", "はちじゅうさい", "です"],
      promptEn: "Hear it, build it: 'My grandfather is 80 years old.'",
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
    infoStep(
      "ja-m19-3-1-info-end",
      "You can now talk about your grandparents respectfully",
      "そふ/そぼ (yours, humble). おじいさん/おばあさん (theirs, honorific). The full family register is building.",
      "win",
    ),
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
    "Mix all family pairs: parents, siblings, grandparents. Choose the right register every time.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m19-3-2-info-open",
      "All family pairs — can you keep them straight?",
      "Parents, older siblings, younger siblings, grandparents. Humble for yours, honorific for theirs. Mix and match.",
    ),
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
      "ja-m19-3-2-cloze-wa-1",
      "そぼ",
      " とうきょうに すんでいます。",
      "は",
      ["は", "が", "を", "に"],
      "My grandmother lives in Tokyo.",
      "そぼは とうきょうに すんでいます。",
      "は marks the topic.",
    ),
    build(
      "ja-m19-3-2-build-1",
      "Ask: Is your older brother a student?",
      "おにいさんは がくせいですか",
      ["おにいさん", "は", "がくせい", "です", "か", "あに", "せんせい"],
      ["おにいさん", "は", "がくせい", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m19-3-2-lc-1",
      audioText: "ちちは いしゃです",
      correctMeaningEn: "My father is a doctor.",
      distractorsEn: [
        "Your father is a doctor.",
        "My mother is a doctor.",
        "My grandfather is a doctor.",
      ],
    }),
    sentenceMcq({
      id: "ja-m19-3-2-mcq-2",
      prompt: "Asking about someone else's younger sister:",
      correctKana: "いもうとさんは なんさいですか。",
      distractorsKana: [
        "いもうとは なんさいですか。",
        "おねえさんは なんさいですか。",
        "おとうとさんは なんさいですか。",
      ],
      explanation: "SOMEONE ELSE's younger sister → いもうとさん (add さん).",
    }),
    cloze(
      "ja-m19-3-2-cloze-no",
      "はは",
      " りょうりは おいしいです。",
      "の",
      ["の", "は", "が", "を"],
      "My mother's cooking is delicious.",
      "ははの りょうりは おいしいです。",
      "の marks possession — my mother's cooking.",
    ),
    build(
      "ja-m19-3-2-build-2",
      "Say: My grandfather likes fishing.",
      "そふは つりが すきです",
      ["そふ", "は", "つり", "が", "すき", "です", "おじいさん", "きらい"],
      ["そふ", "は", "つり", "が", "すき", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m19-3-2-lb-1",
      target: "おかあさんは おげんきですか",
      tiles: ["おかあさん", "は", "おげんき", "です", "か", "はは", "ちち"],
      correctOrder: ["おかあさん", "は", "おげんき", "です", "か"],
      promptEn: "Hear it, build it: 'Is your mother well?'",
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
    cloze(
      "ja-m19-3-2-cloze-wa-2",
      "あに",
      " とうきょうに すんでいます。",
      "は",
      ["は", "が", "を", "も"],
      "My older brother lives in Tokyo.",
      "あには とうきょうに すんでいます。",
      "は marks the topic.",
    ),
    translateStep({
      id: "ja-m19-3-2-translate",
      promptEn: "My grandmother likes tea.",
      acceptedAnswers: [
        "そぼは おちゃが すきです",
        "そぼは おちゃが すきです。",
      ],
      audioText: "そぼは おちゃが すきです",
    }),
    build(
      "ja-m19-3-2-build-3",
      "Ask: How old is your younger sister?",
      "いもうとさんは なんさいですか",
      ["いもうとさん", "は", "なんさい", "です", "か", "おとうとさん", "おいくつ"],
      ["いもうとさん", "は", "なんさい", "です", "か"],
    ),
    selfExplain({
      id: "ja-m19-3-2-self-explain",
      anchorLabel: "Family register system overview",
      anchorAudioText: "ちちは いしゃです",
      question: "Summarize the humble/honorific rule:",
      rule: { text: "YOUR family → humble forms (ちち, はは, あに, あね, そふ, そぼ). THEIR family → honorific forms (おとうさん, おかあさん, おにいさん, おねえさん, おじいさん, おばあさん). Younger siblings add さん for theirs." },
      surface: { text: "Humble forms are casual and honorific forms are formal — use honorific at work." },
      distractor: { text: "Men use humble forms and women use honorific forms." },
      ruleExplanation:
        "The うち/よそ distinction is about whose family, not the level of formality or the speaker's gender.",
    }),
    speaking(
      "ja-m19-3-2-speak",
      "ちちは いしゃです",
      "My father is a doctor.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m19-3-2-rev-mcq-1", M19_3_2_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-3-2-rev-lc-1",
      audioText: M19_3_2_REVIEW[1].kana,
      correctMeaningEn: M19_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_3_2_REVIEW[2].meaningEn,
        M19_3_2_REVIEW[3].meaningEn,
        M19_REVIEW_POOL[5].meaningEn,
      ],
    }),
    speaking("ja-m19-3-2-rev-speak-1", M19_3_2_REVIEW[2].kana, M19_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-3-2-rev", M19_3_2_REVIEW),
    infoStep(
      "ja-m19-3-2-info-end",
      "You can switch between humble and honorific for every family member on command",
      "All eight pairs — parents, siblings, grandparents. The register switch is becoming second nature.",
      "win",
    ),
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
    infoStep(
      "ja-m19-4-1-info-open",
      "Boy, girl, adult, child, baby",
      "Five words for people at different life stages. Watch how おとこのこ and おんなのこ are built: おとこ (male) + の + こ (child).",
    ),
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
      ["こども", "は", "あそんで", "います", "おとな", "たべて"],
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
      ["あかちゃん", "こども", "おとな", "おんなのこ"],
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
    cloze(
      "ja-m19-4-1-cloze-ga",
      "おとこのこ",
      " さんにん います。",
      "が",
      ["が", "は", "を", "の"],
      "There are three boys.",
      "おとこのこが さんにん います。",
      "が marks the subject with います for existence/counting.",
    ),
    build(
      "ja-m19-4-1-build-otona-kodomo",
      "Say: There are two adults and three children.",
      "おとなが ふたりと こどもが さんにん います",
      ["おとな", "が", "ふたり", "と", "こども", "が", "さんにん", "います", "よにん"],
      ["おとな", "が", "ふたり", "と", "こども", "が", "さんにん", "います"],
    ),
    cloze(
      "ja-m19-4-1-cloze-wa",
      "あかちゃん",
      " ねています。",
      "は",
      ["は", "が", "を", "に"],
      "The baby is sleeping.",
      "あかちゃんは ねています。",
      "は marks the topic — 'the baby.'",
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
      audioText: M19_4_1_REVIEW[1].kana,
      correctMeaningEn: M19_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_4_1_REVIEW[2].meaningEn,
        M19_4_1_REVIEW[3].meaningEn,
        M19_REVIEW_POOL[6].meaningEn,
      ],
    }),
    speaking("ja-m19-4-1-rev-speak-1", M19_4_1_REVIEW[2].kana, M19_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-4-1-rev", M19_4_1_REVIEW),
    infoStep(
      "ja-m19-4-1-info-end",
      "You can now describe anyone — boy, girl, adult, child, or baby",
      "おとこのこ, おんなのこ, おとな, こども, あかちゃん. Five people words in your toolkit.",
      "win",
    ),
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
    "Two more people words — せいと (student/pupil) and おまわりさん (police officer) — plus practice using all people words in sentences.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m19-4-2-info-open",
      "Students and police officers",
      "Two more people words plus practice combining all the people vocabulary with family and counting words.",
    ),
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
      ["せいと", "は", "べんきょう", "しています", "おとな", "あそんで"],
      ["せいと", "は", "べんきょう", "しています"],
    ),
    // ── おまわりさん (police officer) ──
    build(
      "ja-m19-4-2-build-omawarisan",
      "Pick the Japanese word for: police officer",
      "おまわりさん",
      ["おまわりさん", "せいと", "せんせい", "いしゃ"],
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
    cloze(
      "ja-m19-4-2-cloze-ni",
      "おまわりさん",
      " ききましょう。",
      "に",
      ["に", "は", "が", "を"],
      "Let's ask the police officer.",
      "おまわりさんに ききましょう。",
      "に marks the person you ask/tell.",
    ),
    build(
      "ja-m19-4-2-build-otokonoko-count",
      "Say: There are two boys.",
      "おとこのこが ふたり います",
      ["おとこのこ", "が", "ふたり", "います", "おんなのこ", "さんにん"],
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
      tiles: ["せいと", "は", "べんきょう", "しています", "あそんで", "います"],
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
      promptEn: "There are three girls.",
      acceptedAnswers: [
        "おんなのこが さんにん います",
        "おんなのこが さんにん います。",
      ],
      audioText: "おんなのこが さんにん います",
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
    infoStep(
      "ja-m19-4-2-info-end",
      "You can describe and count people in any situation",
      "Students, police officers, boys, girls, adults, children, babies — all in sentences with proper particles.",
      "win",
    ),
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
    infoStep(
      "ja-m19-5-1-info-open",
      "Counting years of age",
      "Number + さい tells someone's age. But watch out — いっさい (1), はっさい (8), and じゅっさい (10) have sound changes.",
    ),
    RULE_SAI_COUNTER,
    // ── Core age forms ──
    build(
      "ja-m19-5-1-build-issai",
      "Pick: 1 year old",
      "いっさい",
      ["いっさい", "にさい", "さんさい", "いちさい"],
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
      ["はっさい", "ろくさい", "はちさい", "きゅうさい"],
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
      ["じゅっさい", "じゅうさい", "きゅうさい", "ごさい"],
      ["じゅっさい"],
    ),
    speaking("ja-m19-5-1-speak-jussai", "じゅっさい", "10 years old"),
    // ── Age sentence drills ──
    build(
      "ja-m19-5-1-build-age-sentence",
      "Say: I am 20 years old.",
      "わたしは にじゅっさいです",
      ["わたし", "は", "にじゅっさい", "です", "にじゅうごさい", "さんじゅっさい"],
      ["わたし", "は", "にじゅっさい", "です"],
    ),
    cloze(
      "ja-m19-5-1-cloze-wa",
      "いもうと",
      " ごさいです。",
      "は",
      ["は", "が", "を", "の"],
      "My younger sister is 5 years old.",
      "いもうとは ごさいです。",
      "は marks the topic.",
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
      ["おいくつ", "です", "か", "なんさい", "なん"],
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
      "ja-m19-5-1-cloze-wa-2",
      "おとうと",
      " じゅっさいです。",
      "は",
      ["は", "が", "を", "に"],
      "My younger brother is 10 years old.",
      "おとうとは じゅっさいです。",
      "は marks the topic.",
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
      audioText: M19_5_1_REVIEW[1].kana,
      correctMeaningEn: M19_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_5_1_REVIEW[2].meaningEn,
        M19_5_1_REVIEW[3].meaningEn,
        M19_REVIEW_POOL[8].meaningEn,
      ],
    }),
    speaking("ja-m19-5-1-rev-speak-1", M19_5_1_REVIEW[2].kana, M19_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-5-1-rev", M19_5_1_REVIEW),
    infoStep(
      "ja-m19-5-1-info-end",
      "You can now ask and answer age questions in Japanese",
      "なんさいですか / おいくつですか. Number + さい with sound changes for 1, 8, 10.",
      "win",
    ),
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
    infoStep(
      "ja-m19-5-2-info-open",
      "How big is your family?",
      "Number + にんかぞく describes family size. よにんかぞく = a family of four. Let's learn to talk about family composition.",
    ),
    RULE_NIN_KAZOKU,
    // ── Family size forms ──
    build(
      "ja-m19-5-2-build-yonin",
      "Pick: a family of four",
      "よにんかぞく",
      ["よにんかぞく", "さんにんかぞく", "ごにんかぞく", "ろくにんかぞく"],
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
      ["ごにんかぞく", "よにんかぞく", "ろくにんかぞく", "さんにんかぞく"],
      ["ごにんかぞく"],
    ),
    speaking("ja-m19-5-2-speak-gonin", "ごにんかぞく", "A family of five"),
    // ── Family composition sentences ──
    build(
      "ja-m19-5-2-build-composition",
      "Say: I'm from a family of four — father, mother, older sister, and me.",
      "よにんかぞくです ちちと ははと あねと わたしです",
      ["よにんかぞく", "です", "ちち", "と", "はは", "と", "あね", "と", "わたし", "です"],
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
      "ja-m19-5-2-cloze-wa",
      "わたし",
      " ごにんかぞくです。",
      "は",
      ["は", "が", "を", "の"],
      "I'm from a family of five.",
      "わたしは ごにんかぞくです。",
      "は marks the topic.",
    ),
    listeningBuildSentence({
      id: "ja-m19-5-2-lb-yonin",
      target: "わたしは よにんかぞくです",
      tiles: ["わたし", "は", "よにんかぞく", "です", "ごにんかぞく", "さんにんかぞく"],
      correctOrder: ["わたし", "は", "よにんかぞく", "です"],
      promptEn: "Hear it, build it: 'I'm from a family of four.'",
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
      ["さんにんかぞく", "です", "よにんかぞく", "ごにんかぞく"],
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
      promptEn: "I'm from a family of five.",
      acceptedAnswers: [
        "わたしは ごにんかぞくです",
        "わたしは ごにんかぞくです。",
        "ごにんかぞくです",
        "ごにんかぞくです。",
      ],
      audioText: "わたしは ごにんかぞくです",
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
    // ── Review tail ──
    vocabMcq("ja-m19-5-2-rev-mcq-1", M19_5_2_REVIEW[0], M19_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m19-5-2-rev-lc-1",
      audioText: M19_5_2_REVIEW[1].kana,
      correctMeaningEn: M19_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_5_2_REVIEW[2].meaningEn,
        M19_5_2_REVIEW[3].meaningEn,
        M19_REVIEW_POOL[9].meaningEn,
      ],
    }),
    speaking("ja-m19-5-2-rev-speak-1", M19_5_2_REVIEW[2].kana, M19_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-5-2-rev", M19_5_2_REVIEW),
    infoStep(
      "ja-m19-5-2-info-end",
      "You can now describe your family size and list every member",
      "〜にんかぞく + family member list with と. A full self-introduction skill.",
      "win",
    ),
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
    infoStep(
      "ja-m19-6-1-info-open",
      "Everything at once",
      "Register, age, family size — all mixed. Can you keep the humble/honorific pairs straight while counting ages?",
    ),
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
    cloze(
      "ja-m19-6-1-cloze-wa",
      "はは",
      " よんじゅうごさいです。",
      "は",
      ["は", "が", "を", "の"],
      "My mother is 45 years old.",
      "ははは よんじゅうごさいです。",
      "は marks the topic.",
    ),
    build(
      "ja-m19-6-1-build-1",
      "Ask: How old is your younger sister?",
      "いもうとさんは なんさいですか",
      ["いもうとさん", "は", "なんさい", "です", "か", "いもうと", "おいくつ"],
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
    cloze(
      "ja-m19-6-1-cloze-to",
      "ちち",
      " ははと あにと おとうとと わたしです。",
      "と",
      ["と", "は", "が", "の"],
      "Father, mother, older brother, younger brother, and me.",
      "ちちと ははと あにと おとうとと わたしです。",
      "と lists family members.",
    ),
    build(
      "ja-m19-6-1-build-2",
      "Say: My grandmother is 70 years old.",
      "そぼは ななじゅっさいです",
      ["そぼ", "は", "ななじゅっさい", "です", "おばあさん", "はちじゅっさい"],
      ["そぼ", "は", "ななじゅっさい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m19-6-1-lb-1",
      target: "よにんかぞくです ちちと ははと あねと わたしです",
      tiles: ["よにんかぞく", "です", "ちち", "と", "はは", "と", "あね", "と", "わたし", "です"],
      correctOrder: ["よにんかぞく", "です", "ちち", "と", "はは", "と", "あね", "と", "わたし", "です"],
      promptEn: "Hear it, build it: 'Family of four — dad, mom, older sister, and me.'",
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
    cloze(
      "ja-m19-6-1-cloze-no",
      "おかあさん",
      " おしごとは なんですか。",
      "の",
      ["の", "は", "が", "を"],
      "What is your mother's job?",
      "おかあさんの おしごとは なんですか。",
      "の marks possession — your mother's job.",
    ),
    build(
      "ja-m19-6-1-build-3",
      "Say: My younger brother is 10 years old.",
      "おとうとは じゅっさいです",
      ["おとうと", "は", "じゅっさい", "です", "おとうとさん", "じゅうさい"],
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
    infoStep(
      "ja-m19-6-1-info-end",
      "You can introduce your entire family with ages and proper register",
      "Register + age counter + family size — all three systems working together.",
      "win",
    ),
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
    infoStep(
      "ja-m19-6-2-info-open",
      "Full family introductions — from memory",
      "Build, translate, and speak: introduce your family members, state their ages, describe family size. All from production.",
    ),
    // ── Production drills ──
    build(
      "ja-m19-6-2-build-1",
      "Say: My father is 50 years old.",
      "ちちは ごじゅっさいです",
      ["ちち", "は", "ごじゅっさい", "です", "おとうさん", "よんじゅっさい"],
      ["ちち", "は", "ごじゅっさい", "です"],
    ),
    speaking(
      "ja-m19-6-2-speak-1",
      "ちちは ごじゅっさいです",
      "My father is 50 years old.",
    ),
    translateStep({
      id: "ja-m19-6-2-translate-1",
      promptEn: "My mother is a teacher.",
      acceptedAnswers: [
        "ははは せんせいです",
        "ははは せんせいです。",
      ],
      audioText: "ははは せんせいです",
    }),
    build(
      "ja-m19-6-2-build-2",
      "Say: Is your older brother a university student?",
      "おにいさんは だいがくせいですか",
      ["おにいさん", "は", "だいがくせい", "です", "か", "あに", "がくせい"],
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
      ["さんにんかぞく", "です", "よにんかぞく", "ごにんかぞく"],
      ["さんにんかぞく", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m19-6-2-lb-1",
      target: "そふは はちじゅうさいです",
      tiles: ["そふ", "は", "はちじゅうさい", "です", "おじいさん", "ななじゅうさい"],
      correctOrder: ["そふ", "は", "はちじゅうさい", "です"],
      promptEn: "Hear it, build it: 'My grandfather is 80 years old.'",
    }),
    translateStep({
      id: "ja-m19-6-2-translate-2",
      promptEn: "How many people are in your family?",
      acceptedAnswers: [
        "なんにんかぞくですか",
        "なんにんかぞくですか。",
      ],
      audioText: "なんにんかぞくですか",
    }),
    build(
      "ja-m19-6-2-build-4",
      "Say: My older sister likes cooking.",
      "あねは りょうりが すきです",
      ["あね", "は", "りょうり", "が", "すき", "です", "おねえさん", "きらい"],
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
      "Say: My younger brother likes soccer.",
      "おとうとは サッカーが すきです",
      ["おとうと", "は", "サッカー", "が", "すき", "です", "いもうと", "やきゅう"],
      ["おとうと", "は", "サッカー", "が", "すき", "です"],
    ),
    cloze(
      "ja-m19-6-2-cloze-wa",
      "そぼ",
      " ななじゅうはっさいです。",
      "は",
      ["は", "が", "を", "の"],
      "My grandmother is 78 years old.",
      "そぼは ななじゅうはっさいです。",
      "は marks the topic.",
    ),
    selfExplain({
      id: "ja-m19-6-2-self-explain",
      anchorLabel: "Full family introduction pattern",
      anchorAudioText: "ごにんかぞくです",
      question: "What's the order for a family self-introduction?",
      rule: { text: "1) State family size (〜にんかぞくです). 2) List members with と (ちちと ははと…). 3) Add details (age, job) per member. Always use humble forms for YOUR family." },
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
      audioText: M19_6_2_REVIEW[1].kana,
      correctMeaningEn: M19_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_6_2_REVIEW[2].meaningEn,
        M19_6_2_REVIEW[3].meaningEn,
        M19_6_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m19-6-2-rev-mcq-1", M19_6_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M19_REVIEW_POOL),
    speaking("ja-m19-6-2-rev-speak-2", M19_6_2_REVIEW[2].kana, M19_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-6-2-rev", M19_6_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m19-6-2-info-end",
      "You can produce a complete family self-introduction from memory",
      "Size, members, ages, jobs — all in proper humble register. A real-world skill you'll use from day one in Japan.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M19_6_2.steps);
assertAnswerRotation(M19_6_2.steps, 1);
assertNoConsecutiveSame(M19_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M19-STORY — Meeting a friend's family
// ═══════════════════════════════════════════════════════════════════════

export const M19_STORY: LessonContent = {
  id: "ja-m19-story",
  moduleId: "m19",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Meeting a friend's family",
  description:
    "Listen to two friends introduce their families. Answer questions and practice key patterns.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m19-story-info-open",
      "Story time — Meeting ゆき's family",
      "たけし visits ゆき's home and meets her family. They trade family introductions.",
    ),
    dialogueListen({
      id: "ja-m19-story-scene-1",
      lines: [
        { speaker: "たけし", kana: "ゆきさん、なんにんかぞくですか。" },
        { speaker: "ゆき", kana: "ごにんかぞくです。ちちと ははと あにと いもうとと わたしです。" },
        { speaker: "たけし", kana: "おにいさんは なんさいですか。" },
        { speaker: "ゆき", kana: "あには にじゅうにさいです。だいがくせいです。" },
      ],
      questions: [
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
          distractors: ["He is 20 and works.", "He is 22 and a teacher.", "He is a high school student."],
          explanation: "にじゅうにさい = 22 years old. だいがくせい = university student.",
        },
      ],
    }),
    build(
      "ja-m19-story-build-1",
      "Say: We're a family of five.",
      "ごにんかぞくです",
      ["ごにんかぞく", "です", "よにんかぞく", "さんにんかぞく"],
      ["ごにんかぞく", "です"],
    ),
    sentenceMcq({
      id: "ja-m19-story-mcq-1",
      prompt: "Notice: たけし asked おにいさん, but ゆき answered あに. Why?",
      correctKana: "たけし asks about HER brother (honorific). ゆき talks about HER OWN brother (humble).",
      distractorsKana: [
        "たけし made a mistake — he should have said あに too.",
        "ゆき made a mistake — she should have said おにいさん.",
        "Both forms mean exactly the same thing.",
      ],
      explanation: "The register switch is natural: listener uses honorific for YOUR family, you use humble for YOUR OWN.",
    }),
    dialogueListen({
      id: "ja-m19-story-scene-2",
      lines: [
        { speaker: "たけし", kana: "いもうとさんは おいくつですか。" },
        { speaker: "ゆき", kana: "いもうとは はっさいです。しょうがくせいです。" },
        { speaker: "ゆき", kana: "たけしさんは なんにんかぞくですか。" },
        { speaker: "たけし", kana: "さんにんかぞくです。ちちと ははと わたしです。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "How old is ゆき's younger sister?",
          correctText: "8 years old.",
          distractors: ["10 years old.", "5 years old.", "18 years old."],
          explanation: "はっさい = 8 years old (sound change from はち).",
        },
        {
          id: "s2-q2",
          prompt: "How many people are in たけし's family?",
          correctText: "Three — father, mother, and たけし.",
          distractors: ["Four people.", "Five people.", "Two — just parents."],
          explanation: "さんにんかぞく = family of three.",
        },
      ],
    }),
    cloze(
      "ja-m19-story-cloze-1",
      "いもうと",
      " はっさいです。",
      "は",
      ["は", "が", "を", "の"],
      "My younger sister is 8 years old.",
      "いもうとは はっさいです。",
      "は marks the topic — talking about her own sister (humble).",
    ),
    listeningBuildSentence({
      id: "ja-m19-story-lb-1",
      target: "さんにんかぞくです ちちと ははと わたしです",
      tiles: ["さんにんかぞく", "です", "ちち", "と", "はは", "と", "わたし", "です", "あに"],
      correctOrder: ["さんにんかぞく", "です", "ちち", "と", "はは", "と", "わたし", "です"],
      promptEn: "Hear it, build it: 'Family of three — dad, mom, and me.'",
    }),
    listeningCompSentence({
      id: "ja-m19-story-lc-1",
      audioText: "いもうとさんは おいくつですか",
      correctMeaningEn: "How old is your younger sister?",
      distractorsEn: [
        "How old is my younger sister?",
        "How old is your older sister?",
        "How old are you?",
      ],
    }),
    speaking(
      "ja-m19-story-speak-1",
      "ごにんかぞくです",
      "We're a family of five.",
    ),
    sentenceMcq({
      id: "ja-m19-story-mcq-summary",
      prompt: "In the story, which register patterns appeared?",
      correctKana: "たけし used honorific (おにいさん, いもうとさん) for ゆき's family. ゆき used humble (あに, いもうと) for her own.",
      distractorsKana: [
        "Both used honorific forms throughout.",
        "Both used humble forms throughout.",
        "Only age-related vocabulary appeared.",
      ],
      explanation: "The natural register switch: honorific for others' family, humble for your own.",
    }),
    speaking(
      "ja-m19-story-speak-2",
      "さんにんかぞくです ちちと ははと わたしです",
      "Family of three — dad, mom, and me.",
    ),
    infoStep(
      "ja-m19-story-info-end",
      "You followed a real family introduction — hearing the register switch in action",
      "たけし and ゆき naturally switched between honorific and humble. You can do the same.",
      "win",
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
    infoStep(
      "ja-m19-7-1-info-open",
      "School open day",
      "Two parents meet at a school open day and talk about their families. Listen carefully for the register switches.",
    ),
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
      ["よにんかぞく", "です", "さんにんかぞく", "ごにんかぞく"],
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
      "ja-m19-7-1-cloze-wa",
      "むすめ",
      " じゅうにさいです。",
      "は",
      ["は", "が", "を", "の"],
      "My daughter is 12 years old.",
      "むすめは じゅうにさいです。",
      "は marks the topic.",
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
      ["むすこ", "は", "はっさい", "です", "おむすこさん", "じゅっさい"],
      ["むすこ", "は", "はっさい", "です"],
    ),
    speaking(
      "ja-m19-7-1-speak-1",
      "よにんかぞくです",
      "We're a family of four.",
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
      target: "むすめは じゅうにさいです",
      tiles: ["むすめ", "は", "じゅうにさい", "です", "おむすめさん", "じゅっさい"],
      correctOrder: ["むすめ", "は", "じゅうにさい", "です"],
      promptEn: "Hear it, build it: 'My daughter is 12 years old.'",
    }),
    cloze(
      "ja-m19-7-1-cloze-to",
      "しゅじん",
      " むすめと むすこと わたしです。",
      "と",
      ["と", "は", "が", "の"],
      "Husband and daughter and son and me.",
      "しゅじんと むすめと むすこと わたしです。",
      "と lists family members.",
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
      audioText: M19_7_1_REVIEW[1].kana,
      correctMeaningEn: M19_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M19_7_1_REVIEW[2].meaningEn,
        M19_7_1_REVIEW[3].meaningEn,
        M19_7_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m19-7-1-rev-mcq-1", M19_7_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M19_REVIEW_POOL),
    speaking("ja-m19-7-1-rev-speak-2", M19_7_1_REVIEW[2].kana, M19_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m19-7-1-rev", M19_7_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m19-7-1-info-end",
      "You can hold a family introduction conversation — switching registers naturally",
      "Humble for yours, honorific for theirs. Age counter, family size, occupations. The full package.",
      "win",
    ),
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
    infoStep(
      "ja-m19-7-2-info-open",
      "Final round — everything",
      "Every M19 pattern in production. Register, age, family size, and all the people words.",
    ),
    // ── Production drills ──
    build(
      "ja-m19-7-2-build-1",
      "Say: My older brother is 25 years old.",
      "あには にじゅうごさいです",
      ["あに", "は", "にじゅうごさい", "です", "おにいさん", "さんじゅうさい"],
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
      ["おとこのこ", "が", "ふたり", "と", "おんなのこ", "が", "さんにん", "います"],
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
      ["おまわりさん", "に", "ききましょう", "せんせい", "を", "いきましょう"],
      ["おまわりさん", "に", "ききましょう"],
    ),
    cloze(
      "ja-m19-7-2-cloze-wa",
      "あね",
      " にじゅうはっさいです。",
      "は",
      ["は", "が", "を", "の"],
      "My older sister is 28 years old.",
      "あねは にじゅうはっさいです。",
      "は marks the topic.",
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
      ["おとな", "は", "コーヒー", "を", "のみます", "こども", "は", "ぎゅうにゅう", "を", "のみます"],
      ["おとな", "は", "コーヒー", "を", "のみます", "こども", "は", "ぎゅうにゅう", "を", "のみます"],
    ),
    listeningBuildSentence({
      id: "ja-m19-7-2-lb-1",
      target: "おとうとさんは おいくつですか",
      tiles: ["おとうとさん", "は", "おいくつ", "です", "か", "おとうと", "なんさい"],
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
      "ごにんかぞくです ちちと ははと あにと いもうとと わたしです",
      "Family of five — dad, mom, older brother, younger sister, and me.",
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
    infoStep(
      "ja-m19-7-2-info-end",
      "You can talk about family, people, and ages — with perfect register",
      "Family register, age counter, family composition, and people vocabulary. Module 19 complete.",
      "win",
    ),
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
