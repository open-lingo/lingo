/**
 * M14 — Te-form + Ta-form (Formation + Requests) + Counters + Numbers 100-10000.
 *
 * THE core grammar module. M14 introduces:
 *   - て-form formation (the most important grammar rule in N5):
 *     - Group 2 (ichidan/ru-verbs): drop る, add て → たべる → たべて
 *     - Group 1 (godan/u-verbs): consonant changes:
 *       う/つ/る → って, む/ぶ/ぬ → んで, く → いて (EXCEPT いく → いって),
 *       ぐ → いで, す → して
 *     - Irregular: する → して, くる → きて
 *   - た-form as て derivative: て → た, で → だ
 *   - 〜てください (polite requests)
 *   - Numbers 100-10,000: ひゃく, せん, まん
 *   - Counters: 個 (general), 枚 (flat things), 本 (cylindrical)
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps. Conjugation drilling maximized throughout.
 *
 * ID scheme: ja-m14-{n}-{sub} e.g. ja-m14-1-1, ja-m14-1-2
 * Export names: M14_1_1, M14_1_2, M14_2_1, M14_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m14-1, etc.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  cloze,
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
const M14_REVIEW_POOL = withoutMcqBlocked(
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
// Grammar rules (shared across sub-lessons)
// ═══════════════════════════════════════════════════════════════════════

const RULE_TE_GROUP2 = grammarRule({
  id: "ja-m14-rule-te-group2",
  grammarPointId: "te-form",
  title: "て-form: Group 2 (ichidan/る-verbs)",
  rule:
    "Group 2 verbs (ichidan) end in -いる or -える. To make the て-form: drop る, add て. This is the easiest group. たべる → たべて, みる → みて, おしえる → おしえて.",
  examples: [
    {
      ja: "たべる → たべて",
      romaji: "taberu → tabete",
      en: "eat → (te-form)",
    },
    {
      ja: "みる → みて",
      romaji: "miru → mite",
      en: "watch → (te-form)",
    },
    {
      ja: "おしえる → おしえて",
      romaji: "oshieru → oshiete",
      en: "teach → (te-form)",
    },
  ],
  antiPattern: {
    ja: "たべる → たべって",
    romaji: "taberu → tabette",
    en: "(broken — って is for Group 1 verbs, not Group 2)",
    why: "Group 2 verbs simply swap る for て. The って doubling only applies to certain Group 1 endings (う/つ/る).",
  },
  cultureNote:
    "How to tell Group 2 from Group 1: most verbs ending in -いる or -える are Group 2. Exceptions exist (かえる 'return' is Group 1!) but the pattern covers ~90% of cases.",
});

const RULE_TE_GROUP1_TTE = grammarRule({
  id: "ja-m14-rule-te-group1-tte",
  grammarPointId: "te-form",
  title: "て-form: Group 1 — う/つ/る → って",
  rule:
    "Group 1 verbs ending in う, つ, or る change to って. The consonant before the ending drops and doubles into っ. かう → かって, まつ → まって, かえる → かえって.",
  examples: [
    {
      ja: "かう → かって",
      romaji: "kau → katte",
      en: "buy → (te-form)",
    },
    {
      ja: "まつ → まって",
      romaji: "matsu → matte",
      en: "wait → (te-form)",
    },
    {
      ja: "かえる → かえって",
      romaji: "kaeru → kaette",
      en: "return → (te-form)",
    },
  ],
  antiPattern: {
    ja: "まつ → まいて",
    romaji: "matsu → maite",
    en: "(broken — いて is for く-ending verbs, not つ)",
    why: "つ-ending verbs use って, not いて. Only く-ending verbs use いて.",
  },
  cultureNote:
    "かえる (return) is a famous trap: it ends in -える but is Group 1, so it takes って not て. The dictionary form looks like Group 2 but behaves like Group 1.",
});

const RULE_TE_GROUP1_NDE_ITE = grammarRule({
  id: "ja-m14-rule-te-group1-nde-ite",
  grammarPointId: "te-form",
  title: "て-form: Group 1 — む/ぶ → んで, く → いて, ぐ → いで, す → して",
  rule:
    "The remaining Group 1 patterns: む/ぶ/ぬ → んで (nasalize + で). く → いて. ぐ → いで. す → して. MAJOR EXCEPTION: いく → いって (NOT いいて).",
  examples: [
    {
      ja: "のむ → のんで",
      romaji: "nomu → nonde",
      en: "drink → (te-form)",
    },
    {
      ja: "かく → かいて",
      romaji: "kaku → kaite",
      en: "write → (te-form)",
    },
    {
      ja: "およぐ → およいで",
      romaji: "oyogu → oyoide",
      en: "swim → (te-form)",
    },
    {
      ja: "はなす → はなして",
      romaji: "hanasu → hanashite",
      en: "speak → (te-form)",
    },
  ],
  antiPattern: {
    ja: "いく → いいて",
    romaji: "iku → iite",
    en: "(broken — いく is the big exception: いく → いって, NOT いいて)",
    why: "いく ('go') is the ONLY く-ending verb that takes って instead of いて. All other く-verbs follow the regular rule (かく → かいて).",
  },
  cultureNote:
    "The んで pattern makes sense if you say it aloud: the nasal ん naturally flows into で. Try saying 'のんで' — the ん makes it smoother than 'のみて' would be.",
});

const RULE_TE_IRREGULARS = grammarRule({
  id: "ja-m14-rule-te-irregulars",
  grammarPointId: "te-form",
  title: "て-form: Irregulars + た-form",
  rule:
    "Two irregular verbs: する → して, くる → きて. The た-form (plain past) is a free derivative of て-form: swap て → た, で → だ. たべて → たべた, のんで → のんだ, して → した, きて → きた.",
  examples: [
    {
      ja: "する → して → した",
      romaji: "suru → shite → shita",
      en: "do → (te) → (ta/past)",
    },
    {
      ja: "くる → きて → きた",
      romaji: "kuru → kite → kita",
      en: "come → (te) → (ta/past)",
    },
    {
      ja: "のむ → のんで → のんだ",
      romaji: "nomu → nonde → nonda",
      en: "drink → (te) → (ta/past)",
    },
  ],
  antiPattern: {
    ja: "する → すて, くる → くて",
    romaji: "suru → sute, kuru → kute",
    en: "(broken — both are fully irregular; memorize して and きて)",
    why: "する and くる don't follow any group pattern. Their て-forms (して, きて) must be memorized as fixed forms.",
  },
  cultureNote:
    "Once you know the て-form of any verb, you automatically know the た-form. This makes て-form the single most important conjugation to master.",
});

const RULE_TE_KUDASAI = grammarRule({
  id: "ja-m14-rule-te-kudasai",
  grammarPointId: "te-kudasai",
  title: "〜てください — polite requests",
  rule:
    "て-form + ください = 'please do ~.' This is the standard polite request. まって + ください = まってください (please wait). みせて + ください = みせてください (please show me).",
  examples: [
    {
      ja: "まってください。",
      romaji: "matte kudasai.",
      en: "Please wait.",
    },
    {
      ja: "おしえてください。",
      romaji: "oshiete kudasai.",
      en: "Please teach/tell me.",
    },
    {
      ja: "しゃしんを とってください。",
      romaji: "shashin o totte kudasai.",
      en: "Please take a photo.",
    },
  ],
  antiPattern: {
    ja: "まつください。",
    romaji: "matsu kudasai.",
    en: "(broken — you need the te-form before ください, not dictionary form)",
    why: "ください attaches to the て-form, not the dictionary form. まつ → まって → まってください.",
  },
  cultureNote:
    "〜てください is polite but direct. In very formal situations, Japanese speakers might soften further with ～ていただけませんか (could you possibly ~). For N5, ～てください is the standard.",
});

const RULE_BIG_NUMBERS = grammarRule({
  id: "ja-m14-rule-big-numbers",
  title: "Numbers 100-10,000 + counters 個/枚/本",
  rule:
    "ひゃく = 100, せん = 1,000, いちまん = 10,000. Sound changes: さんびゃく (300), ろっぴゃく (600), はっぴゃく (800), さんぜん (3,000), はっせん (8,000). Counters: 個 (こ — general objects), 枚 (まい — flat things), 本 (ほん — cylindrical). 本 has irregulars: いっぽん, にほん, さんぼん.",
  examples: [
    {
      ja: "にひゃくえん",
      romaji: "nihyaku en",
      en: "200 yen",
    },
    {
      ja: "さんぼん ください。",
      romaji: "sanbon kudasai.",
      en: "Three (cylindrical things), please.",
    },
    {
      ja: "ごまい あります。",
      romaji: "gomai arimasu.",
      en: "There are five (flat things).",
    },
  ],
  antiPattern: {
    ja: "さんほん",
    romaji: "sanhon",
    en: "(broken — 3 + 本 = さんぼん, not さんほん)",
    why: "本 changes its reading with certain numbers: いっぽん (1), にほん (2), さんぼん (3), よんほん (4), ごほん (5), ろっぽん (6)… The pattern is rendaku (voicing) at 3 and gemination at 1/6/8/10.",
  },
});

// ═══════════════════════════════════════════════════════════════════════
// M14-1-1 — "Te-form: Group 2 (I)"
//   (ichidan te-form — the easy group: たべる→たべて, みる→みて, みせる→みせて)
// ═══════════════════════════════════════════════════════════════════════

const M14_1_1_REVIEW = pickReviewAtoms("ja-m14-1-1-rev", M14_REVIEW_POOL, 4);

export const M14_1_1: LessonContent = {
  id: "ja-m14-1-1",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Te-form: Group 2 (I)",
  description:
    "The easiest te-form pattern — ichidan verbs just swap る for て.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_TE_GROUP2,
    // ── たべて (eat → te-form) ──
    build(
      "ja-m14-1-1-build-tabete",
      "Convert たべる to て-form",
      "たべて",
      ["たべって", "たべて", "たべいて", "たべんで"],
      ["たべて"],
    ),
    listeningCompSentence({
      id: "ja-m14-1-1-lc-tabete",
      audioText: "すしを たべてください",
      correctMeaningEn: "Please eat the sushi.",
      distractorsEn: [
        "Please drink the tea.",
        "I eat sushi.",
        "Please buy sushi.",
      ],
    }),
    // ── みて (watch → te-form) ──
    build(
      "ja-m14-1-1-build-mite",
      "Convert みる to て-form",
      "みて",
      ["みって", "みいて", "みて", "みんで"],
      ["みて"],
    ),
    speaking("ja-m14-1-1-speak-mite", "みて", "Watch (te-form)"),
    // ── みせる (show) — new verb ──
    build(
      "ja-m14-1-1-build-miseru",
      "Pick the Japanese word for: Show",
      "みせる",
      ["たべる", "みせる", "おしえる", "みる"],
      ["みせる"],
    ),
    cloze(
      "ja-m14-1-1-cloze-misete",
      "みせ",
      "",
      "て",
      ["て", "って", "んで", "いて"],
      "Show (te-form): みせて",
      "みせて",
      "Group 2: drop る, add て. みせる → みせて.",
    ),
    // ── おしえる (teach) — new verb ──
    build(
      "ja-m14-1-1-build-oshieru",
      "Pick the Japanese word for: Teach",
      "おしえる",
      ["みせる", "たべる", "おしえる", "みる"],
      ["おしえる"],
    ),
    cloze(
      "ja-m14-1-1-cloze-oshiete",
      "おしえ",
      "",
      "て",
      ["て", "って", "んで", "いて"],
      "Teach (te-form): おしえて",
      "おしえて",
      "Group 2: drop る, add て. おしえる → おしえて.",
    ),
    // ── Discrimination drill ──
    sentenceMcq({
      id: "ja-m14-1-1-mcq-group2",
      prompt: "Which is the correct て-form of みせる?",
      correctKana: "みせて",
      distractorsKana: ["みせって", "みせんで", "みせいて"],
      explanation: "みせる is Group 2 (ichidan). Drop る, add て → みせて.",
    }),
    build(
      "ja-m14-1-1-build-tabete-sentence",
      "Say: Please eat.",
      "たべてください",
      ["みせて", "たべる", "ください", "たべて"],
      ["たべて", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m14-1-1-lb-oshiete",
      target: "なまえを おしえてください",
      tiles: ["なまえ", "を", "おしえて", "ください", "たべて", "みせて"],
      correctOrder: ["なまえ", "を", "おしえて", "ください"],
      promptEn: "Hear it, build it: 'Please tell me your name.'",
    }),
    selfExplain({
      id: "ja-m14-1-1-self-explain",
      anchorLabel: "たべる → たべて, みせる → みせて",
      anchorAudioText: "たべて",
      question: "Why do Group 2 verbs just swap る for て?",
      rule: { text: "Group 2 (ichidan) verbs have a single stem that doesn't change. Drop る, add て — no consonant changes needed." },
      surface: { text: "All verbs swap their last character for て." },
      distractor: { text: "Group 2 verbs use って because the る doubles." },
      ruleExplanation:
        "Group 2 verbs keep their stem intact. The る is just a suffix — removing it and adding て is the simplest conjugation pattern.",
    }),
    speaking(
      "ja-m14-1-1-speak-oshiete",
      "おしえてください",
      "Please teach me.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-1-1-rev-mcq-1", M14_1_1_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-1-1-rev-lc-1",
      // Sentence-level review of ほん (M3) — 2026-07-12 listening backfill.
      audioText: "この ほんは おもしろいです",
      correctMeaningEn: "This book is interesting.",
      distractorsEn: [
        "This book is boring.",
        "This movie is interesting.",
        "That book is old.",
      ],
    }),
    speaking("ja-m14-1-1-rev-speak-1", M14_1_1_REVIEW[2].kana, M14_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m14-1-1-rev", M14_1_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M14_1_1.steps);
// TODO(wave-N): tighten — single conjugation pattern means only て-form answers
assertAnswerRotation(M14_1_1.steps, 1);
assertNoConsecutiveSame(M14_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-1-2 — "Te-form: Group 2 (II)"
//   (more ichidan drilling + てつだう intro for contrast preview)
// ═══════════════════════════════════════════════════════════════════════

const M14_1_2_REVIEW = pickReviewAtoms("ja-m14-1-2-rev", M14_REVIEW_POOL, 4);

export const M14_1_2: LessonContent = {
  id: "ja-m14-1-2",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Te-form: Group 2 (II)",
  description:
    "Drilling ichidan て-form with more verbs and introducing てつだう (help) as a Group 1 preview.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── でんわ (phone) — object vocab ──
    build(
      "ja-m14-1-2-build-denwa",
      "Pick the Japanese word for: Phone",
      "でんわ",
      ["かぎ", "さいふ", "カメラ", "でんわ"],
      ["でんわ"],
    ),
    vocabMcq(
      "ja-m14-1-2-mcq-denwa",
      { kana: "でんわ", meaningEn: "phone", emoji: "☎️", fromModule: "m14" },
      M14_REVIEW_POOL,
    ),
    // ── かける (make a call / hang) — Group 2 ──
    cloze(
      "ja-m14-1-2-cloze-kakete",
      "でんわを かけ",
      "ください。",
      "て",
      ["て", "って", "んで", "いて"],
      "Please make a phone call. (かける → かけて)",
      "でんわを かけてください。",
      "かける is Group 2. Drop る, add て → かけて.",
    ),
    // ── あける (open) — Group 2 ──
    build(
      "ja-m14-1-2-build-akete",
      "Convert あける (open) to て-form",
      "あけて",
      ["あけって", "あけて", "あけんで", "あけいて"],
      ["あけて"],
    ),
    speaking("ja-m14-1-2-speak-akete", "あけてください", "Please open it."),
    // ── しめる (close) — Group 2 ──
    cloze(
      "ja-m14-1-2-cloze-shimete",
      "まどを しめ",
      "ください。",
      "て",
      ["て", "って", "んで", "いて"],
      "Please close the window. (しめる → しめて)",
      "まどを しめてください。",
      "しめる is Group 2. Drop る, add て → しめて.",
    ),
    listeningCompSentence({
      id: "ja-m14-1-2-lc-akete-mado",
      audioText: "まどを あけてください",
      correctMeaningEn: "Please open the window.",
      distractorsEn: [
        "Please close the window.",
        "Please look at the window.",
        "Open the door, please.",
      ],
    }),
    // ── てつだう (help) — Group 1 preview ──
    build(
      "ja-m14-1-2-build-tetsudau",
      "Pick the Japanese word for: Help (someone)",
      "てつだう",
      ["かける", "てつだう", "おしえる", "みせる"],
      ["てつだう"],
    ),
    sentenceMcq({
      id: "ja-m14-1-2-mcq-tetsudatte",
      prompt: "てつだう ends in う. What is its て-form?",
      correctKana: "てつだって",
      distractorsKana: ["てつだて", "てつだいて", "てつだんで"],
      explanation: "てつだう is Group 1 (う-ending). う → って. てつだう → てつだって. Preview of next lesson!",
    }),
    // ── Mixed Group 2 drill ──
    build(
      "ja-m14-1-2-build-misete-kudasai",
      "Say: Please show me.",
      "みせてください",
      ["おしえて", "ください", "みせて", "かけて"],
      ["みせて", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m14-1-2-lb-akete",
      target: "かばんを あけてください",
      tiles: ["しめて", "みせて", "を", "あけて", "ください", "かばん"],
      correctOrder: ["かばん", "を", "あけて", "ください"],
      promptEn: "Hear it, build it: 'Please open the bag.'",
    }),
    translateStep({
      id: "ja-m14-1-2-translate",
      promptEn: "Please close the window.",
      acceptedAnswers: [
        "まどを しめてください",
        "まどを しめてください。",
        "まどをしめてください",
      ],
      audioText: "まどを しめてください",
    }),
    selfExplain({
      id: "ja-m14-1-2-self-explain",
      anchorLabel: "かける → かけて (Group 2) vs てつだう → てつだって (Group 1)",
      anchorAudioText: "かけてください",
      question: "Why does かける use て but てつだう uses って?",
      rule: { text: "かける is Group 2 (ichidan) — drop る, add て. てつだう is Group 1 (godan, う-ending) — う becomes って." },
      surface: { text: "Longer verbs always use て and shorter verbs use って." },
      distractor: { text: "Both are Group 2 but てつだう has a special exception." },
      ruleExplanation:
        "The key is verb group, not length. Group 2 (ichidan): る → て. Group 1 (godan): ending determines the て-form pattern.",
    }),
    speaking(
      "ja-m14-1-2-speak-kakete",
      "でんわを かけてください",
      "Please make a phone call.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-1-2-rev-mcq-1", M14_1_2_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-1-2-rev-lc-1",
      // Sentence-level review of きゅう (M5) — 2026-07-12 listening backfill.
      audioText: "これは きゅうじゅうえんです",
      correctMeaningEn: "It's 90 yen.",
      distractorsEn: [
        "It's 19 yen.",
        "It's 60 yen.",
        "It's 9 yen.",
      ],
    }),
    reviewMatchPairs("ja-m14-1-2-rev", M14_1_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M14_1_2.steps);
// TODO(wave-N): tighten — single conjugation pattern (て) dominates
assertAnswerRotation(M14_1_2.steps, 1);
assertNoConsecutiveSame(M14_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-2-1 — "Te-form: Group 1 (って) I"
//   (う/つ/る → って: かう→かって, まつ→まって, かえる→かえって)
// ═══════════════════════════════════════════════════════════════════════

const M14_2_1_REVIEW = pickReviewAtoms("ja-m14-2-1-rev", M14_REVIEW_POOL, 4);

export const M14_2_1: LessonContent = {
  id: "ja-m14-2-1",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Te-form: Group 1 (って) I",
  description:
    "う/つ/る endings all become って — the first Group 1 pattern.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_TE_GROUP1_TTE,
    // ── まつ (wait) — new verb ──
    build(
      "ja-m14-2-1-build-matsu",
      "Pick the Japanese word for: Wait",
      "まつ",
      ["かう", "まつ", "とる", "かえる"],
      ["まつ"],
    ),
    cloze(
      "ja-m14-2-1-cloze-matte",
      "ま",
      "ください。",
      "って",
      ["って", "て", "んで", "いて"],
      "Please wait. (まつ → まって)",
      "まってください。",
      "まつ ends in つ. Group 1 つ → って.",
    ),
    speaking("ja-m14-2-1-speak-matte", "まってください", "Please wait."),
    // ── かう (buy) ──
    build(
      "ja-m14-2-1-build-katte",
      "Convert かう (buy) to て-form",
      "かって",
      ["かんで", "かって", "かいて", "かて"],
      ["かって"],
    ),
    listeningCompSentence({
      id: "ja-m14-2-1-lc-katte",
      audioText: "パンを かってください",
      correctMeaningEn: "Please buy bread.",
      distractorsEn: [
        "Please wait a moment.",
        "Please return home.",
        "I bought bread.",
      ],
    }),
    // ── かえる (return — Group 1 trap!) ──
    build(
      "ja-m14-2-1-build-kaette",
      "Convert かえる (return) to て-form. Careful — it's Group 1!",
      "かえって",
      ["かえいて", "かえって", "かえんで", "かえて"],
      ["かえって"],
    ),
    cloze(
      "ja-m14-2-1-cloze-kaette",
      "かえ",
      "",
      "って",
      ["って", "て", "んで", "いて"],
      "Return (te-form): かえって (Group 1!)",
      "かえって",
      "かえる LOOKS like Group 2 (-える ending) but is Group 1. る → って.",
    ),
    // ── とる (take) — new verb ──
    build(
      "ja-m14-2-1-build-toru",
      "Pick the Japanese word for: Take",
      "とる",
      ["まつ", "とる", "かえる", "かう"],
      ["とる"],
    ),
    sentenceMcq({
      id: "ja-m14-2-1-mcq-totte",
      prompt: "とる ends in る and is Group 1. What is its て-form?",
      correctKana: "とって",
      distractorsKana: ["とて", "とんで", "といて"],
      explanation: "とる is Group 1 (godan). る → って. とる → とって.",
    }),
    // ── Contrast drill ──
    cloze(
      "ja-m14-2-1-cloze-contrast-katte",
      "これを か",
      "ください。",
      "って",
      ["って", "て", "んで", "いて"],
      "Please buy this. (かう → かって)",
      "これを かってください。",
      "かう → かって. う-ending → って.",
    ),
    listeningBuildSentence({
      id: "ja-m14-2-1-lb-matte",
      target: "ちょっと まってください",
      tiles: ["ください", "かえって", "まって", "とって", "ちょっと"],
      correctOrder: ["ちょっと", "まって", "ください"],
      promptEn: "Hear it, build it: 'Please wait a moment.'",
    }),
    selfExplain({
      id: "ja-m14-2-1-self-explain",
      anchorLabel: "かえる → かえって (Group 1, NOT かえて)",
      anchorAudioText: "かえって",
      question: "Why is かえる Group 1 even though it ends in -える?",
      rule: { text: "かえる (return) is a known exception. Despite the -える ending, it conjugates as Group 1: かえる → かえって, not かえて." },
      surface: { text: "All verbs ending in -える are Group 1." },
      distractor: { text: "かえる is actually Group 2 — both かえて and かえって are correct." },
      ruleExplanation:
        "Most -える verbs are Group 2, but some common ones like かえる (return) are Group 1 exceptions that must be memorized.",
    }),
    speaking(
      "ja-m14-2-1-speak-totte",
      "しゃしんを とってください",
      "Please take a photo.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-2-1-rev-mcq-1", M14_2_1_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-2-1-rev-lc-1",
      audioText: M14_2_1_REVIEW[1].kana,
      correctMeaningEn: M14_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_2_1_REVIEW[2].meaningEn,
        M14_2_1_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[2].meaningEn,
      ],
    }),
    speaking("ja-m14-2-1-rev-speak-1", M14_2_1_REVIEW[2].kana, M14_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m14-2-1-rev", M14_2_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M14_2_1.steps);
// TODO(wave-N): tighten — って dominates this block
assertAnswerRotation(M14_2_1.steps, 1);
assertNoConsecutiveSame(M14_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-2-2 — "Te-form: Group 1 (って) II"
//   (more って drilling + てつだう→てつだって + contrast with Group 2)
// ═══════════════════════════════════════════════════════════════════════

const M14_2_2_REVIEW = pickReviewAtoms("ja-m14-2-2-rev", M14_REVIEW_POOL, 4);

export const M14_2_2: LessonContent = {
  id: "ja-m14-2-2",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Te-form: Group 1 (って) II",
  description:
    "Deeper って drilling with てつだう and Group 1 vs Group 2 contrast.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── てつだう (help) — full drill ──
    cloze(
      "ja-m14-2-2-cloze-tetsudatte",
      "てつだ",
      "ください。",
      "って",
      ["って", "て", "んで", "いて"],
      "Please help. (てつだう → てつだって)",
      "てつだってください。",
      "てつだう ends in う. Group 1: う → って.",
    ),
    speaking("ja-m14-2-2-speak-totte-are", "あれを とってください", "Please take that one."),
    // ── かす (lend) — new verb ──
    build(
      "ja-m14-2-2-build-kasu",
      "Pick the Japanese word for: Lend",
      "かす",
      ["かう", "まつ", "とる", "かす"],
      ["かす"],
    ),
    sentenceMcq({
      id: "ja-m14-2-2-mcq-kashite",
      prompt: "かす ends in す. What is its て-form?",
      correctKana: "かして",
      distractorsKana: ["かって", "かんで", "かいて"],
      explanation: "す → して. かす → かして. (Preview of the next lesson's pattern!)",
    }),
    // ── Group 1 vs Group 2 contrast drill ──
    cloze(
      "ja-m14-2-2-cloze-contrast-matte",
      "ともだちを ま",
      "ください。",
      "って",
      ["って", "て", "んで", "して"],
      "Please wait for your friend. (まつ → まって)",
      "ともだちを まってください。",
      "まつ is Group 1, つ → って.",
    ),
    cloze(
      "ja-m14-2-2-cloze-contrast-mite",
      "テレビを み",
      "ください。",
      "て",
      ["て", "って", "んで", "いて"],
      "Please watch TV. (みる → みて, Group 2!)",
      "テレビを みてください。",
      "みる is Group 2 (ichidan). る → て, no doubling.",
    ),
    build(
      "ja-m14-2-2-build-katte-hana",
      "Say: Please buy flowers.",
      "はなを かってください",
      ["ください", "かて", "を", "まって", "かって", "はな"],
      ["はな", "を", "かって", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m14-2-2-lc-totte",
      audioText: "かさを とってください",
      correctMeaningEn: "Please take the umbrella.",
      distractorsEn: [
        "Please wait a moment.",
        "Please buy an umbrella.",
        "Please lend me the umbrella.",
      ],
    }),
    // ── Mixed production drill ──
    build(
      "ja-m14-2-2-build-kaette-sentence",
      "Say: Please return home.",
      "うちに かえってください",
      ["に", "かえて", "まって", "うち", "かえって", "ください"],
      ["うち", "に", "かえって", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m14-2-2-lb-katte",
      target: "これを かってください",
      tiles: ["とって", "これ", "ください", "かって", "を", "まって"],
      correctOrder: ["これ", "を", "かって", "ください"],
      promptEn: "Hear it, build it: 'Please buy this.'",
    }),
    translateStep({
      id: "ja-m14-2-2-translate",
      promptEn: "Please help.",
      acceptedAnswers: [
        "てつだってください",
        "てつだってください。",
      ],
      audioText: "てつだってください",
    }),
    sentenceMcq({
      id: "ja-m14-2-2-mcq-kaette-vs-kaete",
      prompt: "かえる (return, Group 1) vs かける (make call, Group 2). Which pair is correct?",
      correctKana: "かえって / かけて",
      distractorsKana: [
        "かえて / かけって",
        "かえって / かけって",
        "かえて / かけて",
      ],
      explanation: "かえる (return) is Group 1: かえって. かける (call) is Group 2: かけて.",
    }),
    selfExplain({
      id: "ja-m14-2-2-self-explain",
      anchorLabel: "まつ → まって, てつだう → てつだって, かえる → かえって",
      anchorAudioText: "まってください",
      question: "What do う, つ, and る endings have in common in て-form?",
      rule: { text: "All three become って — the final consonant drops and becomes the double consonant っ + て." },
      surface: { text: "They all end in a vowel, so they all just add て." },
      distractor: { text: "Each uses a different pattern — って, いて, and んで respectively." },
      ruleExplanation:
        "う, つ, and る are grouped together because they all produce って. This is the first and most common Group 1 pattern.",
    }),
    speaking(
      "ja-m14-2-2-speak-kaette",
      "うちに かえってください",
      "Please return home.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-2-2-rev-mcq-1", M14_2_2_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-2-2-rev-lc-1",
      // Sentence-level review of うち (M6) — 2026-07-12 listening backfill.
      audioText: "うちに かえってください",
      correctMeaningEn: "Please go home.",
      distractorsEn: [
        "Please come to my house.",
        "Please wait at home.",
        "I went home.",
      ],
    }),
    reviewMatchPairs("ja-m14-2-2-rev", M14_2_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M14_2_2.steps);
assertAnswerRotation(M14_2_2.steps, 1);
assertNoConsecutiveSame(M14_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-3-1 — "Te-form: Group 1 (んで/いて) I"
//   (む/ぶ→んで, く→いて, ぐ→いで, す→して)
// ═══════════════════════════════════════════════════════════════════════

const M14_3_1_REVIEW = pickReviewAtoms("ja-m14-3-1-rev", M14_REVIEW_POOL, 4);

export const M14_3_1: LessonContent = {
  id: "ja-m14-3-1",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Te-form: Group 1 (んで/いて) I",
  description:
    "Four more Group 1 patterns: む/ぶ→んで, く→いて, ぐ→いで, す→して.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_TE_GROUP1_NDE_ITE,
    // ── のむ (drink) → のんで ──
    build(
      "ja-m14-3-1-build-nonde",
      "Convert のむ (drink) to て-form",
      "のんで",
      ["のみて", "のんで", "のって", "のいて"],
      ["のんで"],
    ),
    cloze(
      "ja-m14-3-1-cloze-nonde",
      "コーヒーを の",
      "ください。",
      "んで",
      ["んで", "って", "いて", "して"],
      "Please drink coffee. (のむ → のんで)",
      "コーヒーを のんでください。",
      "のむ ends in む. Group 1: む → んで.",
    ),
    // ── あそぶ (play) → あそんで ──
    build(
      "ja-m14-3-1-build-asonde",
      "Convert あそぶ (play) to て-form",
      "あそんで",
      ["あそいで", "あそんで", "あそいて", "あそって"],
      ["あそんで"],
    ),
    listeningCompSentence({
      id: "ja-m14-3-1-lc-asonde",
      audioText: "あそんで",
      correctMeaningEn: "play (te-form)",
      distractorsEn: ["drink (te-form)", "write (te-form)", "wait (te-form)"],
    }),
    // ── かく (write) → かいて ──
    cloze(
      "ja-m14-3-1-cloze-kaite",
      "なまえを か",
      "ください。",
      "いて",
      ["いて", "んで", "って", "して"],
      "Please write your name. (かく → かいて)",
      "なまえを かいてください。",
      "かく ends in く. Group 1: く → いて.",
    ),
    speaking("ja-m14-3-1-speak-kaite", "なまえを かいてください", "Please write your name."),
    // ── およぐ (swim) → およいで ──
    build(
      "ja-m14-3-1-build-oyoide",
      "Convert およぐ (swim) to て-form",
      "およいで",
      ["およいて", "およんで", "およいで", "およって"],
      ["およいで"],
    ),
    sentenceMcq({
      id: "ja-m14-3-1-mcq-oyoide",
      prompt: "およぐ ends in ぐ. What is the correct て-form?",
      correctKana: "およいで",
      distractorsKana: ["およいて", "およんで", "およって"],
      explanation: "ぐ → いで (voiced pair of く → いて). およぐ → およいで.",
    }),
    // ── はなす (speak) → はなして ──
    cloze(
      "ja-m14-3-1-cloze-hanashite",
      "にほんごで はな",
      "ください。",
      "して",
      ["して", "いて", "んで", "って"],
      "Please speak in Japanese. (はなす → はなして)",
      "にほんごで はなしてください。",
      "はなす ends in す. Group 1: す → して.",
    ),
    listeningBuildSentence({
      id: "ja-m14-3-1-lb-nonde",
      target: "コーヒーを のんでください",
      tiles: ["ください", "かいて", "はなして", "コーヒー", "のんで", "を"],
      correctOrder: ["コーヒー", "を", "のんで", "ください"],
      promptEn: "Hear it, build it: 'Please drink coffee.'",
    }),
    selfExplain({
      id: "ja-m14-3-1-self-explain",
      anchorLabel: "のんで (む→んで) vs かいて (く→いて) vs およいで (ぐ→いで) vs はなして (す→して)",
      anchorAudioText: "のんで",
      question: "Why do む and ぶ both become んで?",
      rule: { text: "む and ぶ are both labial consonants. In て-form, they nasalize to ん and take で (the voiced pair of て)." },
      surface: { text: "む and ぶ look similar so they use the same て-form ending." },
      distractor: { text: "む uses んで but ぶ actually uses いで, not んで." },
      ruleExplanation:
        "The phonological grouping: labials (む/ぶ/ぬ) → んで, velars (く) → いて, voiced velars (ぐ) → いで, sibilants (す) → して.",
    }),
    speaking(
      "ja-m14-3-1-speak-hanashite",
      "にほんごで はなしてください",
      "Please speak in Japanese.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-3-1-rev-mcq-1", M14_3_1_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-3-1-rev-lc-1",
      // Sentence-level review of みます (M7) — 2026-07-12 listening backfill.
      audioText: "よる テレビを みます",
      correctMeaningEn: "I watch TV at night.",
      distractorsEn: [
        "I watch TV in the morning.",
        "I read books at night.",
        "I listen to music at night.",
      ],
    }),
    reviewMatchPairs("ja-m14-3-1-rev", M14_3_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M14_3_1.steps);
assertAnswerRotation(M14_3_1.steps, 1);
assertNoConsecutiveSame(M14_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-3-2 — "Te-form: Group 1 (んで/いて) II"
//   (deeper drilling + いく→いって exception)
// ═══════════════════════════════════════════════════════════════════════

const M14_3_2_REVIEW = pickReviewAtoms("ja-m14-3-2-rev", M14_REVIEW_POOL, 4);

export const M14_3_2: LessonContent = {
  id: "ja-m14-3-2",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Te-form: Group 1 (んで/いて) II",
  description:
    "More drilling on んで/いて/いで/して patterns plus the critical いく→いって exception.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── いく → いって (THE exception) ──
    sentenceMcq({
      id: "ja-m14-3-2-mcq-itte",
      prompt: "いく ends in く. What is its て-form?",
      correctKana: "いって",
      distractorsKana: ["いいて", "いんで", "いして"],
      explanation: "いく is THE exception: いく → いって (NOT いいて). The only く-verb that uses って.",
    }),
    build(
      "ja-m14-3-2-build-itte",
      "Convert いく (go) to て-form. Remember the exception!",
      "いって",
      ["いて", "いって", "いいて", "いんで"],
      ["いって"],
    ),
    speaking("ja-m14-3-2-speak-itte", "いってください", "Please go."),
    // ── Contrast: かく→かいて vs いく→いって ──
    cloze(
      "ja-m14-3-2-cloze-kaite-2",
      "ここに なまえを か",
      "ください。",
      "いて",
      ["いて", "って", "んで", "して"],
      "Please write your name here. (かく → かいて, regular)",
      "ここに なまえを かいてください。",
      "かく → かいて follows the regular く → いて pattern.",
    ),
    cloze(
      "ja-m14-3-2-cloze-itte",
      "がっこうに い",
      "ください。",
      "って",
      ["って", "いて", "んで", "して"],
      "Please go to school. (いく → いって, exception!)",
      "がっこうに いってください。",
      "いく is the exception: いく → いって, NOT いいて.",
    ),
    // ── かす (lend) → かして ──
    cloze(
      "ja-m14-3-2-cloze-kashite",
      "ペンを か",
      "ください。",
      "して",
      ["して", "って", "いて", "んで"],
      "Please lend me a pen. (かす → かして)",
      "ペンを かしてください。",
      "かす ends in す. Group 1: す → して.",
    ),
    // ── さいふ (wallet) — new object vocab ──
    build(
      "ja-m14-3-2-build-saifu",
      "Pick the Japanese word for: Wallet",
      "さいふ",
      ["カメラ", "さいふ", "でんわ", "かぎ"],
      ["さいふ"],
    ),
    listeningCompSentence({
      id: "ja-m14-3-2-lc-kashite",
      audioText: "さいふを かしてください",
      correctMeaningEn: "Please lend me your wallet.",
      distractorsEn: [
        "Please take your wallet.",
        "Please buy a wallet.",
        "Please show me the wallet.",
      ],
    }),
    // ── Mixed all-patterns drill ──
    build(
      "ja-m14-3-2-build-nonde-sentence",
      "Say: Please drink water.",
      "みずを のんでください",
      ["はなして", "を", "かいて", "みず", "ください", "のんで"],
      ["みず", "を", "のんで", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m14-3-2-lb-itte",
      target: "がっこうに いってください",
      tiles: ["かえって", "ください", "いって", "いいて", "に", "がっこう"],
      correctOrder: ["がっこう", "に", "いって", "ください"],
      promptEn: "Hear it, build it: 'Please go to school.'",
    }),
    translateStep({
      id: "ja-m14-3-2-translate",
      promptEn: "Please lend me a pen.",
      acceptedAnswers: [
        "ペンを かしてください",
        "ペンを かしてください。",
        "ペンをかしてください",
      ],
      audioText: "ペンを かしてください",
    }),
    selfExplain({
      id: "ja-m14-3-2-self-explain",
      anchorLabel: "かく → かいて (regular) vs いく → いって (exception)",
      anchorAudioText: "いってください",
      question: "Why does いく become いって instead of いいて?",
      rule: { text: "いく is the only く-ending verb that doesn't follow く → いて. Its て-form is いって — a historical irregularity that must be memorized." },
      surface: { text: "いく is actually a Group 2 verb, so it uses a different rule." },
      distractor: { text: "Both いいて and いって are acceptable — either form works." },
      ruleExplanation:
        "いく → いって is the single most important exception in て-form. Every other く verb follows かく → かいて. Just this one verb breaks the pattern.",
    }),
    speaking(
      "ja-m14-3-2-speak-kashite",
      "かさを かしてください",
      "Please lend me an umbrella.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-3-2-rev-mcq-1", M14_3_2_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-3-2-rev-lc-1",
      // Sentence-level review of いくら (M5) — 2026-07-12 listening backfill.
      audioText: "この かばんは いくらですか",
      correctMeaningEn: "How much is this bag?",
      distractorsEn: [
        "How much is this umbrella?",
        "Where is this bag?",
        "This bag is 1,000 yen.",
      ],
    }),
    speaking("ja-m14-3-2-rev-speak-1", M14_3_2_REVIEW[2].kana, M14_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m14-3-2-rev", M14_3_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M14_3_2.steps);
assertAnswerRotation(M14_3_2.steps, 1);
assertNoConsecutiveSame(M14_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-4-1 — "Te-form: Irregulars I"
//   (する→して, くる→きて + た-form intro)
// ═══════════════════════════════════════════════════════════════════════

const M14_4_1_REVIEW = pickReviewAtoms("ja-m14-4-1-rev", M14_REVIEW_POOL, 4);

export const M14_4_1: LessonContent = {
  id: "ja-m14-4-1",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Te-form: Irregulars I",
  description:
    "The two irregular verbs する→して, くる→きて, plus the た-form as a て-form derivative.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_TE_IRREGULARS,
    // ── する (to do) — formal vocab intro + て-form ──
    build(
      "ja-m14-4-1-build-suru",
      "Pick the Japanese word for: To do",
      "する",
      ["みる", "する", "くる", "とる"],
      ["する"],
    ),
    build(
      "ja-m14-4-1-build-shite",
      "Convert する (do) to て-form",
      "して",
      ["すって", "すんで", "すいて", "して"],
      ["して"],
    ),
    cloze(
      "ja-m14-4-1-cloze-shite",
      "べんきょう",
      "ください。",
      "して",
      ["して", "って", "んで", "いて"],
      "Please study. (する → して)",
      "べんきょうしてください。",
      "する is irregular. する → して. Memorize it.",
    ),
    speaking("ja-m14-4-1-speak-shite", "べんきょうしてください", "Please study."),
    // ── くる (to come) — formal vocab intro + て-form ──
    build(
      "ja-m14-4-1-build-kuru",
      "Pick the Japanese word for: To come",
      "くる",
      ["いく", "する", "かえる", "くる"],
      ["くる"],
    ),
    build(
      "ja-m14-4-1-build-kite",
      "Convert くる (come) to て-form",
      "きて",
      ["くんで", "きて", "くいて", "くって"],
      ["きて"],
    ),
    listeningCompSentence({
      id: "ja-m14-4-1-lc-kite",
      audioText: "きてください",
      correctMeaningEn: "Please come.",
      distractorsEn: [
        "Please go.",
        "Please do it.",
        "Please wait.",
      ],
    }),
    // ── た-form: て→た, で→だ ──
    sentenceMcq({
      id: "ja-m14-4-1-mcq-tabeta",
      prompt: "たべて → た-form. Replace て with た. What do you get?",
      correctKana: "たべた",
      distractorsKana: ["たべだ", "たべった", "たべんだ"],
      explanation: "て → た. たべて → たべた (ate). The た-form is the plain past.",
    }),
    build(
      "ja-m14-4-1-build-nonda",
      "Convert のんで to た-form (replace で with だ)",
      "のんだ",
      ["のんた", "のった", "のんだ", "のいた"],
      ["のんだ"],
    ),
    cloze(
      "ja-m14-4-1-cloze-katta",
      "か",
      "",
      "った",
      ["った", "た", "んだ", "いた"],
      "Bought (ta-form of かう): かった",
      "かった",
      "かって → かった. って → った.",
    ),
    // ── Irregular た-forms ──
    sentenceMcq({
      id: "ja-m14-4-1-mcq-shita",
      prompt: "する → して → た-form. What is it?",
      correctKana: "した",
      distractorsKana: ["すた", "しだ", "すった"],
      explanation: "して → した. て → た. する's plain past is した.",
    }),
    build(
      "ja-m14-4-1-build-kita",
      "Convert きて (come, te-form) to た-form",
      "きた",
      ["くんだ", "きた", "きだ", "くった"],
      ["きた"],
    ),
    listeningBuildSentence({
      id: "ja-m14-4-1-lb-shite",
      target: "うちで べんきょうしてください",
      tiles: ["して", "で", "うち", "きて", "べんきょう", "ください"],
      correctOrder: ["うち", "で", "べんきょう", "して", "ください"],
      promptEn: "Hear it, build it: 'Please study at home.'",
    }),
    selfExplain({
      id: "ja-m14-4-1-self-explain",
      anchorLabel: "する → して → した, くる → きて → きた",
      anchorAudioText: "してください",
      question: "Why is the た-form so easy once you know the て-form?",
      rule: { text: "The た-form is a mechanical swap: て → た, で → だ. No new rules — just replace the last character." },
      surface: { text: "The た-form and て-form are completely different conjugation systems." },
      distractor: { text: "The た-form only works for irregular verbs — regular verbs have a separate past-tense rule." },
      ruleExplanation:
        "て-form and た-form share the same consonant changes. Once you master て, た is free: のんで→のんだ, かって→かった, して→した.",
    }),
    speaking(
      "ja-m14-4-1-speak-kite",
      "きてください",
      "Please come.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-4-1-rev-mcq-1", M14_4_1_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-4-1-rev-lc-1",
      // Sentence-level review of ご (M5) — 2026-07-12 listening backfill.
      audioText: "ごじに きっさてんに いきます",
      correctMeaningEn: "I go to the cafe at 5.",
      distractorsEn: [
        "I go to the cafe at 9.",
        "I go to the office at 5.",
        "I went to the cafe at 5.",
      ],
    }),
    speaking("ja-m14-4-1-rev-speak-1", M14_4_1_REVIEW[2].kana, M14_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m14-4-1-rev", M14_4_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M14_4_1.steps);
assertAnswerRotation(M14_4_1.steps, 1);
assertNoConsecutiveSame(M14_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-4-2 — "Te-form: Irregulars II"
//   (た-form production + mixed irregular/regular drill)
// ═══════════════════════════════════════════════════════════════════════

const M14_4_2_REVIEW = pickReviewAtoms("ja-m14-4-2-rev", M14_REVIEW_POOL, 4);

export const M14_4_2: LessonContent = {
  id: "ja-m14-4-2",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Te-form: Irregulars II",
  description:
    "た-form production drill and mixed irregular/regular verb conjugation.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── た-form production chain ──
    build(
      "ja-m14-4-2-build-tabeta",
      "What is the た-form (plain past) of たべる?",
      "たべた",
      ["たべだ", "たべた", "たべんだ", "たべった"],
      ["たべた"],
    ),
    build(
      "ja-m14-4-2-build-nonda",
      "What is the た-form of のむ?",
      "のんだ",
      ["のんた", "のいた", "のんだ", "のった"],
      ["のんだ"],
    ),
    sentenceMcq({
      id: "ja-m14-4-2-mcq-itta",
      prompt: "いく → いって. What is the た-form?",
      correctKana: "いった",
      distractorsKana: ["いいた", "いんだ", "いした"],
      explanation: "いって → いった. って → った.",
    }),
    cloze(
      "ja-m14-4-2-cloze-kaita",
      "てがみを か",
      "。",
      "いた",
      ["いた", "った", "んだ", "した"],
      "I wrote a letter. (かく → かいて → かいた)",
      "てがみを かいた。",
      "かく → かいて → かいた. て-form いて → た-form いた.",
    ),
    cloze(
      "ja-m14-4-2-cloze-hanashita",
      "にほんごで はな",
      "。",
      "した",
      ["した", "いた", "った", "んだ"],
      "I spoke in Japanese. (はなす → はなして → はなした)",
      "にほんごで はなした。",
      "はなす → はなして → はなした. して → した.",
    ),
    listeningCompSentence({
      id: "ja-m14-4-2-lc-katta",
      audioText: "カメラを かった",
      correctMeaningEn: "I bought a camera.",
      distractorsEn: [
        "I will buy a camera.",
        "I wrote about a camera.",
        "Please buy a camera.",
      ],
    }),
    build(
      "ja-m14-4-2-build-oyoida",
      "What is the た-form of およぐ? (ぐ→いで→いだ)",
      "およいだ",
      ["およった", "およいだ", "およいた", "およんだ"],
      ["およいだ"],
    ),
    // ── Mixed て/た discrimination ──
    sentenceMcq({
      id: "ja-m14-4-2-mcq-mixed-te-ta",
      prompt: "Which pair is correct? (て-form / た-form)",
      correctKana: "のんで / のんだ",
      distractorsKana: [
        "のんで / のんた",
        "のって / のった",
        "のいて / のいた",
      ],
      explanation: "のむ → のんで (て) / のんだ (た). で → だ.",
    }),
    build(
      "ja-m14-4-2-build-shita-sentence",
      "Say: I studied. (past tense of する)",
      "べんきょうした",
      ["きた", "きて", "した", "して", "べんきょう"],
      ["べんきょう", "した"],
    ),
    listeningBuildSentence({
      id: "ja-m14-4-2-lb-itta",
      target: "がっこうに いった",
      tiles: ["きた", "に", "いいた", "がっこう", "かえった", "いった"],
      correctOrder: ["がっこう", "に", "いった"],
      promptEn: "Hear it, build it: 'I went to school.'",
    }),
    translateStep({
      id: "ja-m14-4-2-translate",
      promptEn: "I came. (plain past of くる)",
      acceptedAnswers: [
        "きた",
        "きた。",
      ],
      audioText: "きた",
    }),
    selfExplain({
      id: "ja-m14-4-2-self-explain",
      anchorLabel: "のんで→のんだ, かって→かった, およいで→およいだ",
      anchorAudioText: "のんだ",
      question: "What is the pattern connecting て-form and た-form?",
      rule: { text: "Replace て with た, and で with だ. The consonant changes are identical — only the final mora differs." },
      surface: { text: "The た-form adds た to the dictionary form, ignoring て-form entirely." },
      distractor: { text: "Only Group 1 verbs can use the て→た shortcut. Group 2 and irregulars have separate た-form rules." },
      ruleExplanation:
        "て/た forms are two sides of the same coin. Master one and the other is automatic: て→た, で→だ. This works for ALL verbs, all groups.",
    }),
    speaking(
      "ja-m14-4-2-speak-itta",
      "がっこうに いった",
      "I went to school.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-4-2-rev-mcq-1", M14_4_2_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-4-2-rev-lc-1",
      // Sentence-level review of いち (M5) — 2026-07-12 listening backfill.
      audioText: "いちがつに にほんに いきます",
      correctMeaningEn: "I'm going to Japan in January.",
      distractorsEn: [
        "I'm going to Japan in February.",
        "I'm going to America in January.",
        "I went to Japan in January.",
      ],
    }),
    reviewMatchPairs("ja-m14-4-2-rev", M14_4_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M14_4_2.steps);
assertAnswerRotation(M14_4_2.steps, 1);
assertNoConsecutiveSame(M14_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-5-1 — "Please do" (てください — requests I)
// ═══════════════════════════════════════════════════════════════════════

const M14_5_1_REVIEW = pickReviewAtoms("ja-m14-5-1-rev", M14_REVIEW_POOL, 4);

export const M14_5_1: LessonContent = {
  id: "ja-m14-5-1",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Please do (I)",
  description:
    "〜てください — the polite request pattern, drilled with real-world scenarios.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_TE_KUDASAI,
    // ── しゃしん (photo) — object vocab ──
    build(
      "ja-m14-5-1-build-shashin",
      "Pick the Japanese word for: Photo",
      "しゃしん",
      ["でんわ", "カメラ", "さいふ", "しゃしん"],
      ["しゃしん"],
    ),
    vocabMcq(
      "ja-m14-5-1-mcq-shashin",
      { kana: "しゃしん", meaningEn: "photo", emoji: "📸", fromModule: "m14" },
      M14_REVIEW_POOL,
    ),
    // ── Request drills ──
    build(
      "ja-m14-5-1-build-matte-kudasai",
      "Say: Please wait here.",
      "ここで まってください",
      ["かえって", "ここ", "ください", "で", "みせて", "まって"],
      ["ここ", "で", "まって", "ください"],
    ),
    cloze(
      "ja-m14-5-1-cloze-misete",
      "それを みせ",
      "ください。",
      "て",
      ["て", "って", "んで", "いて"],
      "Please show me that. (みせる → みせて, Group 2)",
      "それを みせてください。",
      "みせる is Group 2. る → て.",
    ),
    listeningCompSentence({
      id: "ja-m14-5-1-lc-totte",
      audioText: "しゃしんを とってください",
      correctMeaningEn: "Please take a photo.",
      distractorsEn: [
        "Please show me the photo.",
        "Please buy a camera.",
        "Please wait for the photo.",
      ],
    }),
    cloze(
      "ja-m14-5-1-cloze-oshiete",
      "にほんごを おしえ",
      "ください。",
      "て",
      ["て", "って", "して", "んで"],
      "Please teach me Japanese. (おしえる → おしえて, Group 2)",
      "にほんごを おしえてください。",
      "おしえる is Group 2. る → て.",
    ),
    build(
      "ja-m14-5-1-build-nonde-kudasai",
      "Say: Please drink tea.",
      "おちゃを のんでください",
      ["して", "ください", "かいて", "を", "おちゃ", "のんで"],
      ["おちゃ", "を", "のんで", "ください"],
    ),
    sentenceMcq({
      id: "ja-m14-5-1-mcq-hanashite",
      prompt: "Which sentence means 'Please speak slowly.'?",
      correctKana: "ゆっくり はなしてください。",
      distractorsKana: [
        "ゆっくり かいてください。",
        "ゆっくり まってください。",
        "ゆっくり はなしてです。",
      ],
      explanation: "はなす → はなして + ください. ゆっくり = slowly.",
    }),
    // ── Real-world scenarios ──
    build(
      "ja-m14-5-1-build-kashite-kudasai",
      "Say: Please lend me your phone.",
      "でんわを かしてください",
      ["みせて", "でんわ", "を", "ください", "とって", "かして"],
      ["でんわ", "を", "かして", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m14-5-1-lb-kashite-jisho",
      target: "じしょを かしてください",
      tiles: ["を", "かして", "ください", "おしえて", "まって", "じしょ"],
      correctOrder: ["じしょ", "を", "かして", "ください"],
      promptEn: "Hear it, build it: 'Please lend me a dictionary.'",
    }),
    translateStep({
      id: "ja-m14-5-1-translate",
      promptEn: "Please show me the photo.",
      acceptedAnswers: [
        "しゃしんを みせてください",
        "しゃしんを みせてください。",
        "しゃしんをみせてください",
      ],
      audioText: "しゃしんを みせてください",
    }),
    selfExplain({
      id: "ja-m14-5-1-self-explain",
      anchorLabel: "まってください, みせてください, のんでください",
      anchorAudioText: "まってください",
      question: "Why does ください always attach to て-form, not dictionary form?",
      rule: { text: "〜てください is a fixed grammatical pattern: て-form + ください. The て-form provides the 'action' and ください adds 'please do it.'" },
      surface: { text: "ください can attach to any verb form — て-form is just the most common." },
      distractor: { text: "Dictionary form + ください is actually correct in casual speech." },
      ruleExplanation:
        "〜てください is how you make polite requests in Japanese. Dictionary form + ください would be ungrammatical. Always convert to て-form first.",
    }),
    speaking(
      "ja-m14-5-1-speak-oshiete",
      "にほんごを おしえてください",
      "Please teach me Japanese.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-5-1-rev-mcq-1", M14_5_1_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-5-1-rev-lc-1",
      audioText: M14_5_1_REVIEW[1].kana,
      correctMeaningEn: M14_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_5_1_REVIEW[2].meaningEn,
        M14_5_1_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[8].meaningEn,
      ],
    }),
    speaking("ja-m14-5-1-rev-speak-1", M14_5_1_REVIEW[2].kana, M14_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m14-5-1-rev", M14_5_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M14_5_1.steps);
// TODO(wave-N): tighten — て dominates cloze answers in this request-focused block
assertAnswerRotation(M14_5_1.steps, 1);
assertNoConsecutiveSame(M14_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-5-2 — "Please do (II)"
//   (more request scenarios + mixed all-group て-form production)
// ═══════════════════════════════════════════════════════════════════════

const M14_5_2_REVIEW = pickReviewAtoms("ja-m14-5-2-rev", M14_REVIEW_POOL, 4);

export const M14_5_2: LessonContent = {
  id: "ja-m14-5-2",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Please do (II)",
  description:
    "Advanced request scenarios mixing all て-form groups.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── かぎ (key) — object vocab ──
    build(
      "ja-m14-5-2-build-kagi",
      "Pick the Japanese word for: Key",
      "かぎ",
      ["でんわ", "かぎ", "しゃしん", "さいふ"],
      ["かぎ"],
    ),
    vocabMcq(
      "ja-m14-5-2-mcq-kagi",
      { kana: "かぎ", meaningEn: "key", emoji: "🔑", fromModule: "m14" },
      M14_REVIEW_POOL,
    ),
    // ── Real-world requests mixing all groups ──
    cloze(
      "ja-m14-5-2-cloze-mite",
      "これを み",
      "ください。",
      "て",
      ["て", "って", "んで", "して"],
      "Please look at this. (みる → みて, Group 2)",
      "これを みてください。",
      "みる is Group 2. る → て.",
    ),
    build(
      "ja-m14-5-2-build-itte-kudasai",
      "Say: Please go to the station.",
      "えきに いってください",
      ["に", "きて", "ください", "いって", "えき", "かえって"],
      ["えき", "に", "いって", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m14-5-2-lc-kagi-kashite",
      audioText: "かぎを かしてください",
      correctMeaningEn: "Please lend me the key.",
      distractorsEn: [
        "Please take the key.",
        "Please show me the key.",
        "Please buy a key.",
      ],
    }),
    cloze(
      "ja-m14-5-2-cloze-kaette",
      "うちに かえ",
      "ください。",
      "って",
      ["って", "て", "んで", "いて"],
      "Please return home. (かえる → かえって, Group 1!)",
      "うちに かえってください。",
      "かえる is Group 1 despite -える ending. る → って.",
    ),
    sentenceMcq({
      id: "ja-m14-5-2-mcq-mixed-request",
      prompt: "Which sentence means 'Please come to school.'?",
      correctKana: "がっこうに きてください。",
      distractorsKana: [
        "がっこうに いってください。",
        "がっこうに くってください。",
        "がっこうに きんでください。",
      ],
      explanation: "くる → きて (irregular). きてください = please come.",
    }),
    build(
      "ja-m14-5-2-build-yonde-kudasai",
      "Say: Please read this book.",
      "この ほんを よんでください",
      ["を", "ほん", "みて", "この", "ください", "よんで", "かいて"],
      ["この", "ほん", "を", "よんで", "ください"],
    ),
    cloze(
      "ja-m14-5-2-cloze-tabete",
      "すしを たべ",
      "ください。",
      "て",
      ["て", "って", "んで", "して"],
      "Please eat sushi. (たべる → たべて, Group 2)",
      "すしを たべてください。",
      "たべる is Group 2. る → て.",
    ),
    listeningBuildSentence({
      id: "ja-m14-5-2-lb-kite-kudasai",
      target: "あした きてください",
      tiles: ["ください", "して", "いって", "きて", "まって", "あした"],
      correctOrder: ["あした", "きて", "ください"],
      promptEn: "Hear it, build it: 'Please come tomorrow.'",
    }),
    translateStep({
      id: "ja-m14-5-2-translate",
      promptEn: "Please lend me your wallet.",
      acceptedAnswers: [
        "さいふを かしてください",
        "さいふを かしてください。",
        "さいふをかしてください",
      ],
      audioText: "さいふを かしてください",
    }),
    selfExplain({
      id: "ja-m14-5-2-self-explain",
      anchorLabel: "みてください (Group 2) vs かえってください (Group 1) vs きてください (irregular)",
      anchorAudioText: "きてください",
      question: "How do you decide between て, って, んで etc. before ください?",
      rule: { text: "Identify the verb group first: Group 2 drops る → て; Group 1 depends on the ending consonant; irregulars are memorized." },
      surface: { text: "Just add ください to the dictionary form — the て is optional." },
      distractor: { text: "Use って for all Group 1 verbs and て for all Group 2 verbs — there are no other patterns." },
      ruleExplanation:
        "The て-form rule determines the shape before ください. All the patterns you've learned (って/んで/いて/いで/して/て) apply.",
    }),
    speaking(
      "ja-m14-5-2-speak-yonde",
      "この ほんを よんでください",
      "Please read this book.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-5-2-rev-mcq-1", M14_5_2_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-5-2-rev-lc-1",
      // Sentence-level review of どれ (M4) — 2026-07-12 listening backfill.
      audioText: "わたしの コーヒーは どれですか",
      correctMeaningEn: "Which one is my coffee?",
      distractorsEn: [
        "Which one is my tea?",
        "Where is my coffee?",
        "This is my coffee.",
      ],
    }),
    reviewMatchPairs("ja-m14-5-2-rev", M14_5_2_REVIEW),
    // Coverage backfill — full-spine atom re-exposure gate (retrospective §4 Gate 4).
    speaking("ja-m14-5-2-cov-akeru", "あける", "to open"),
    speaking("ja-m14-5-2-cov-hanasu", "はなす", "to speak"),
    speaking("ja-m14-5-2-cov-miseru", "みせる", "to show"),
    speaking("ja-m14-5-2-cov-oshieru", "おしえる", "to teach"),
  ],
};

assertNoSameAnswerCluster(M14_5_2.steps);
assertAnswerRotation(M14_5_2.steps, 1);
assertNoConsecutiveSame(M14_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-6-1 — "Big numbers + counters I"
//   (100-10000 + 個/枚/本)
// ═══════════════════════════════════════════════════════════════════════

const M14_6_1_REVIEW = pickReviewAtoms("ja-m14-6-1-rev", M14_REVIEW_POOL, 4);

export const M14_6_1: LessonContent = {
  id: "ja-m14-6-1",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Big numbers + counters (I)",
  description:
    "Numbers from 100 to 10,000 plus three essential counters: 個, 枚, 本.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_BIG_NUMBERS,
    // ── ひゃく (100) ──
    build(
      "ja-m14-6-1-build-hyaku",
      "Pick the Japanese word for: 100",
      "ひゃく",
      ["じゅう", "せん", "ひゃく", "まん"],
      ["ひゃく"],
    ),
    listeningCompSentence({
      id: "ja-m14-6-1-lc-hyaku",
      audioText: "これは ひゃくえんです",
      correctMeaningEn: "It's 100 yen.",
      distractorsEn: [
        "It's 1,000 yen.",
        "It's 10,000 yen.",
        "It's 10 yen.",
      ],
    }),
    // ── にひゃく (200), さんびゃく (300 — sound change!) ──
    sentenceMcq({
      id: "ja-m14-6-1-mcq-sanbyaku",
      prompt: "What is 300 in Japanese? (Watch for the sound change!)",
      correctKana: "さんびゃく",
      distractorsKana: ["さんひゃく", "さんぴゃく", "さんぎゃく"],
      explanation: "300 = さんびゃく (not さんひゃく). The ひ voices to び after さん.",
    }),
    // ── せん (1,000) ──
    build(
      "ja-m14-6-1-build-sen",
      "Pick the Japanese word for: 1,000",
      "せん",
      ["まん", "せん", "ひゃく", "じゅう"],
      ["せん"],
    ),
    speaking("ja-m14-6-1-speak-nisen", "にせん", "2,000"),
    // ── いちまん (10,000) ──
    build(
      "ja-m14-6-1-build-ichiman",
      "Pick the Japanese for: 10,000",
      "いちまん",
      ["ひゃく", "にせん", "いちまん", "せん"],
      ["いちまん"],
    ),
    // ── Counters: 個 (こ) general objects ──
    cloze(
      "ja-m14-6-1-cloze-ko",
      "りんごを さん",
      " ください。",
      "こ",
      ["こ", "まい", "ほん", "にん"],
      "Three apples, please. (個/こ = general counter)",
      "りんごを さんこ ください。",
      "個 (こ) is the general counter for small objects. Apples = さんこ.",
    ),
    // ── 枚 (まい) flat things ──
    cloze(
      "ja-m14-6-1-cloze-mai",
      "しゃしんを に",
      " ください。",
      "まい",
      ["まい", "こ", "ほん", "にん"],
      "Two photos, please. (枚/まい = counter for flat things)",
      "しゃしんを にまい ください。",
      "枚 (まい) counts flat things: paper, photos, tickets.",
    ),
    // ── 本 (ほん) cylindrical + irregulars ──
    sentenceMcq({
      id: "ja-m14-6-1-mcq-sanbon",
      prompt: "What is 'three (cylindrical things)'? Watch for the counter irregular!",
      correctKana: "さんぼん",
      distractorsKana: ["さんほん", "さんぽん", "さんぶん"],
      explanation: "3 + 本 = さんぼん (NOT さんほん). The ほ voices to ぼ after さん.",
    }),
    build(
      "ja-m14-6-1-build-ippon",
      "How do you say 'one (cylindrical thing)'?",
      "いっぽん",
      ["いちほん", "いっぽん", "いっぼん", "いちぼん"],
      ["いっぽん"],
    ),
    listeningBuildSentence({
      id: "ja-m14-6-1-lb-gohyaku",
      target: "ごひゃくえんです",
      tiles: ["えん", "さんびゃく", "です", "ごひゃく", "せん"],
      correctOrder: ["ごひゃく", "えん", "です"],
      promptEn: "Hear it, build it: 'It's 500 yen.'",
    }),
    selfExplain({
      id: "ja-m14-6-1-self-explain",
      anchorLabel: "さんぼん (NOT さんほん), いっぽん (NOT いちほん)",
      anchorAudioText: "さんぼん",
      question: "Why does 本 change its reading with different numbers?",
      rule: { text: "本 undergoes rendaku (sequential voicing) and gemination. The ほ changes to ぼ after ん (さんぼん) and to ぽ after っ (いっぽん, ろっぽん)." },
      surface: { text: "本 always reads as ほん — さんぼん is just a dialect variation." },
      distractor: { text: "Only 本 has irregular readings — 個 and 枚 change the same way." },
      ruleExplanation:
        "Counter sound changes (rendaku) are predictable: after ん → voicing (ぼん), after っ → p-sound (ぽん). The pattern applies to several counters in Japanese.",
    }),
    speaking(
      "ja-m14-6-1-speak-sanbon",
      "ペンを さんぼん ください",
      "Three pens, please.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-6-1-rev-mcq-1", M14_6_1_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-6-1-rev-lc-1",
      audioText: M14_6_1_REVIEW[1].kana,
      correctMeaningEn: M14_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_6_1_REVIEW[2].meaningEn,
        M14_6_1_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[10].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m14-6-1-rev", M14_6_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M14_6_1.steps);
assertAnswerRotation(M14_6_1.steps, 1);
assertNoConsecutiveSame(M14_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-6-2 — "Big numbers + counters II"
//   (more counter drilling + numbers in context)
// ═══════════════════════════════════════════════════════════════════════

const M14_6_2_REVIEW = pickReviewAtoms("ja-m14-6-2-rev", M14_REVIEW_POOL, 4);

export const M14_6_2: LessonContent = {
  id: "ja-m14-6-2",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Big numbers + counters (II)",
  description:
    "Counter practice with 個/枚/本 at the post office — stamps, postcards, and envelopes — plus big numbers in prices.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── きって (postage stamp) — new vocab ──
    build(
      "ja-m14-6-2-build-kitte",
      "Pick the Japanese word for: Postage stamp",
      "きって",
      ["はがき", "きって", "てがみ", "かぎ"],
      ["きって"],
    ),
    listeningCompSentence({
      id: "ja-m14-6-2-lc-kitte",
      audioText: "きってを ください",
      correctMeaningEn: "A stamp, please.",
      distractorsEn: [
        "A letter, please.",
        "A ticket, please.",
        "Please cut it.",
      ],
    }),
    // ── はがき (postcard) — new vocab ──
    build(
      "ja-m14-6-2-build-hagaki",
      "Pick the Japanese word for: Postcard",
      "はがき",
      ["きって", "しゃしん", "はがき", "てがみ"],
      ["はがき"],
    ),
    cloze(
      "ja-m14-6-2-cloze-mai-hagaki",
      "はがきを ご",
      " ください。",
      "まい",
      ["まい", "こ", "ほん", "にん"],
      "Five postcards, please. (postcards are flat → 枚/まい)",
      "はがきを ごまい ください。",
      "Postcards are flat → use 枚 (まい). Five postcards = ごまい.",
    ),
    // ── ふうとう (envelope) — new vocab ──
    build(
      "ja-m14-6-2-build-fuutou",
      "Pick the Japanese word for: Envelope",
      "ふうとう",
      ["きって", "ふうとう", "はがき", "かばん"],
      ["ふうとう"],
    ),
    vocabMcq(
      "ja-m14-6-2-mcq-fuutou",
      { kana: "ふうとう", meaningEn: "envelope", emoji: "✉️", fromModule: "m14" },
      M14_REVIEW_POOL,
    ),
    cloze(
      "ja-m14-6-2-cloze-hon-pen",
      "ペンを に",
      " かしてください。",
      "ほん",
      ["ほん", "まい", "こ", "にん"],
      "Please lend me two pens. (pens are cylindrical → 本/ほん)",
      "ペンを にほん かしてください。",
      "Pens are cylindrical → use 本 (ほん). Two pens = にほん.",
    ),
    sentenceMcq({
      id: "ja-m14-6-2-mcq-roppon",
      prompt: "How do you count 6 cylindrical things?",
      correctKana: "ろっぽん",
      distractorsKana: ["ろくほん", "ろくぼん", "ろっぼん"],
      explanation: "6 + 本 = ろっぽん. The く becomes っ and ほ becomes ぽ.",
    }),
    build(
      "ja-m14-6-2-build-sanko",
      "Say: Three (general objects), please.",
      "さんこ ください",
      ["ください", "さんまい", "さんこ", "さんぼん"],
      ["さんこ", "ください"],
    ),
    // ── Numbers in prices ──
    listeningCompSentence({
      id: "ja-m14-6-2-lc-sengohyaku",
      audioText: "せんごひゃくえんです",
      correctMeaningEn: "It's 1,500 yen.",
      distractorsEn: [
        "It's 500 yen.",
        "It's 5,000 yen.",
        "It's 15,000 yen.",
      ],
    }),
    build(
      "ja-m14-6-2-build-sanzen",
      "How do you say 3,000? (Watch the sound change!)",
      "さんぜん",
      ["さんねん", "さんせん", "さんげん", "さんぜん"],
      ["さんぜん"],
    ),
    sentenceMcq({
      id: "ja-m14-6-2-mcq-hassen",
      prompt: "What is 8,000 in Japanese?",
      correctKana: "はっせん",
      distractorsKana: ["はちせん", "はっぜん", "はちぜん"],
      explanation: "8,000 = はっせん (not はちせん). The ち becomes っ before せ.",
    }),
    listeningBuildSentence({
      id: "ja-m14-6-2-lb-nisen",
      target: "にせんえんです",
      tiles: ["さんぜん", "にせん", "です", "えん", "ごひゃく"],
      correctOrder: ["にせん", "えん", "です"],
      promptEn: "Hear it, build it: 'It's 2,000 yen.'",
    }),
    // ── ポスト (postbox) — new vocab ──
    build(
      "ja-m14-6-2-build-posuto",
      "Pick the Japanese word for: Postbox",
      "ポスト",
      ["はがき", "ふうとう", "ポスト", "きって"],
      ["ポスト"],
    ),
    build(
      "ja-m14-6-2-build-posuto-doko",
      "Ask: Where is the postbox?",
      "ポストは どこですか",
      ["は", "です", "どこ", "ポスト", "ですか", "きって"],
      ["ポスト", "は", "どこ", "ですか"],
    ),
    // ── Combined counters + requests ──
    translateStep({
      id: "ja-m14-6-2-translate",
      promptEn: "One postcard, please.",
      acceptedAnswers: [
        "はがきを いちまい ください",
        "はがきを いちまい ください。",
        "はがきをいちまいください",
      ],
      audioText: "はがきを いちまい ください",
    }),
    build(
      "ja-m14-6-2-build-nimai-kudasai",
      "Say: Two envelopes, please.",
      "ふうとうを にまい ください",
      ["ください", "ふうとう", "にまい", "にほん", "にこ", "を"],
      ["ふうとう", "を", "にまい", "ください"],
    ),
    selfExplain({
      id: "ja-m14-6-2-self-explain",
      anchorLabel: "きって/はがき → まい (flat), ペン → ほん (cylindrical), りんご → こ (general)",
      anchorAudioText: "さんぼん ください",
      question: "How do you pick the right counter for an object?",
      rule: { text: "Match the counter to shape: 枚(まい) = flat (paper, tickets), 本(ほん) = cylindrical (pens, bottles), 個(こ) = round or general." },
      surface: { text: "All counters are interchangeable — just pick whichever one you remember." },
      distractor: { text: "Use 個 (こ) for everything — 枚 and 本 are formal alternatives." },
      ruleExplanation:
        "Japanese counters classify objects by shape. While 個 works as a general fallback, using the specific counter (枚/本) sounds natural and is expected at N5.",
    }),
    speaking(
      "ja-m14-6-2-speak-gomai",
      "しゃしんを ごまい とってください",
      "Please take five photos.",
    ),
    // ── いくつ (how many) — new word; question form of the counter series ──
    build(
      "ja-m14-6-2-build-ikutsu",
      "Pick the Japanese for: how many",
      "いくつ",
      ["どこ", "いくつ", "いつ", "なに"],
      ["いくつ"],
    ),
    listeningCompSentence({
      id: "ja-m14-6-2-lc-ikutsu",
      audioText: "りんごは いくつ ありますか",
      correctMeaningEn: "How many apples are there?",
      distractorsEn: [
        "Where are the apples?",
        "Are there any apples?",
        "How much are the apples?",
      ],
    }),
    // ── はる (to stick / paste) — new word; classic stamp pairing ──
    build(
      "ja-m14-6-2-build-haru",
      "Pick the Japanese for: to stick / paste (a stamp)",
      "はる",
      ["かく", "はる", "よむ", "みる"],
      ["はる"],
    ),
    listeningBuildSentence({
      id: "ja-m14-6-2-lb-haru",
      target: "きってを はって ください",
      tiles: ["ください", "きって", "はって", "を", "かいて", "はがき"],
      correctOrder: ["きって", "を", "はって", "ください"],
      promptEn: "Hear it, build it: 'Please stick the stamp on.'",
    }),
    // ── Review tail ──
    vocabMcq("ja-m14-6-2-rev-mcq-1", M14_6_2_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-6-2-rev-lc-1",
      // Sentence-level review of いきます (M7) — 2026-07-12 listening backfill.
      audioText: "どようびに としょかんに いきます",
      correctMeaningEn: "I go to the library on Saturday.",
      distractorsEn: [
        "I go to the library on Sunday.",
        "I go to the bank on Saturday.",
        "I went to the library on Saturday.",
      ],
    }),
    reviewMatchPairs("ja-m14-6-2-rev", M14_6_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M14_6_2.steps);
assertAnswerRotation(M14_6_2.steps, 1);
assertNoConsecutiveSame(M14_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-STORY — Narrative: a trip to the post office
//   (storyComprehension closer — te-form requests + 枚 counting + prices)
// ═══════════════════════════════════════════════════════════════════════

export const M14_STORY: LessonContent = {
  id: "ja-m14-story",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — At the post office",
  description:
    "Follow ゆき to the post office — buying stamps and postcards with counters, requests, and prices.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    ...storyComprehension({
      idPrefix: "ja-m14-story-scene-1",
      narrative: [
        { kana: "きょう、ゆきは ゆうびんきょくに いきました。" },
        { kana: "ともだちに てがみを かきました。" },
        { kana: "「すみません。きってを さんまい ください。」" },
        { kana: "「はい、さんびゃくえんです。」" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "Where did ゆき go today?",
          correctText: "The post office.",
          distractors: ["The station.", "The library.", "An electronics shop."],
          explanation: "ゆうびんきょくに いきました = 'went to the post office.'",
        },
        {
          id: "s1-q2",
          prompt: "How many stamps does ゆき ask for?",
          correctText: "3 (さんまい).",
          distractors: ["2 (にまい).", "5 (ごまい).", "1 (いちまい)."],
          explanation: "きってを さんまい ください = 'Three stamps, please.' Stamps are flat → 枚.",
        },
        {
          id: "s1-q3",
          prompt: "How much do the stamps cost?",
          correctText: "300 yen.",
          distractors: ["3,000 yen.", "100 yen.", "600 yen."],
          explanation: "さんびゃくえんです = 'It's 300 yen.'",
        },
      ],
      responseBuild: {
        target: "きってを さんまい ください",
        tiles: ["きって", "を", "さんまい", "ください", "さんぼん", "ごまい"],
        correctOrder: ["きって", "を", "さんまい", "ください"],
        promptEn: "Ask like ゆき: 'Three stamps, please.'",
      },
    }),
    sentenceMcq({
      id: "ja-m14-story-mcq-sanbyaku",
      prompt: "Which sentence means 'It's 300 yen'?",
      correctKana: "さんびゃくえんです。",
      distractorsKana: [
        "さんぜんえんです。",
        "ろっぴゃくえんです。",
        "さんびゃくまいです。",
      ],
      explanation: "300 = さんびゃく (the ひ voices to び after さん). えん = yen.",
    }),
    ...storyComprehension({
      idPrefix: "ja-m14-story-scene-2",
      narrative: [
        { kana: "「はがきも ありますか。」" },
        { kana: "「はい、あります。いちまい ひゃくえんです。」" },
        { kana: "「はがきを にまい ください。ふうとうも いちまい ください。」" },
        { kana: "「ポストは どこですか。」" },
        { kana: "「えきの まえに あります。」" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "How much is one postcard?",
          correctText: "100 yen.",
          distractors: ["200 yen.", "300 yen.", "1,000 yen."],
          explanation: "いちまい ひゃくえんです = 'One (postcard) is 100 yen.'",
        },
        {
          id: "s2-q2",
          prompt: "Where is the postbox?",
          correctText: "In front of the station.",
          distractors: ["Inside the post office.", "Next to the school.", "Behind the park."],
          explanation: "えきの まえに あります = 'It's in front of the station.'",
        },
      ],
      responseBuild: {
        target: "はがきを にまい ください",
        tiles: ["はがき", "を", "にまい", "ください", "にほん", "いちまい"],
        correctOrder: ["はがき", "を", "にまい", "ください"],
        promptEn: "Ask like ゆき: 'Two postcards, please.'",
      },
    }),
    cloze(
      "ja-m14-story-cloze-fuutou",
      "ふうとうも いち",
      " ください。",
      "まい",
      ["まい", "こ", "ほん", "にん"],
      "One envelope too, please. (envelopes are flat → 枚/まい)",
      "ふうとうも いちまい ください。",
      "Envelopes are flat → 枚 (まい). One envelope = いちまい.",
    ),
    listeningBuildSentence({
      id: "ja-m14-story-lb-posuto",
      target: "ポストは えきの まえに あります",
      tiles: ["えき", "は", "の", "あります", "うしろ", "ポスト", "まえ", "に"],
      correctOrder: ["ポスト", "は", "えき", "の", "まえ", "に", "あります"],
      promptEn: "Hear it, build it: 'The postbox is in front of the station.'",
    }),
    listeningCompSentence({
      id: "ja-m14-story-lc-hyakuen",
      audioText: "いちまい ひゃくえんです",
      correctMeaningEn: "One (sheet) is 100 yen.",
      distractorsEn: [
        "One (sheet) is 1,000 yen.",
        "It's 100 yen for everything.",
        "Ten sheets are 100 yen.",
      ],
    }),
    speaking(
      "ja-m14-story-speak-posuto",
      "ポストは どこですか",
      "Where is the postbox?",
    ),
    sentenceMcq({
      id: "ja-m14-story-mcq-summary",
      prompt: "What did ゆき buy at the post office?",
      correctKana: "きってと はがきと ふうとう",
      distractorsKana: [
        "きってと てがみ",
        "はがきと しゃしん",
        "ふうとうと ペン",
      ],
      explanation: "ゆき bought stamps (きって), postcards (はがき), and an envelope (ふうとう).",
    }),
    speaking(
      "ja-m14-story-speak-hagaki",
      "はがきを にまい ください",
      "Two postcards, please.",
    ),
  ],
};

assertNoConsecutiveSame(M14_STORY.steps);
assertPassiveCardsHaveFollowup(M14_STORY.steps);
assertNoExplanationOnPassive(M14_STORY.steps);
assertExplanationDoesntLeakAnswer(M14_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-7-1 — "Mixed te-form drill"
//   (all groups interleaved — comprehensive conjugation challenge)
// ═══════════════════════════════════════════════════════════════════════

const M14_7_1_REVIEW = pickReviewAtoms("ja-m14-7-1-rev", M14_REVIEW_POOL, 4);

export const M14_7_1: LessonContent = {
  id: "ja-m14-7-1",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed te-form drill",
  description:
    "All groups interleaved — the ultimate て-form conjugation challenge.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── Rapid-fire conjugation: Group 2 ──
    cloze(
      "ja-m14-7-1-cloze-kakete",
      "ともだちに でんわを かけ",
      "ください。",
      "て",
      ["て", "って", "んで", "いて"],
      "Please call your friend. (かける → かけて, Group 2)",
      "ともだちに でんわを かけてください。",
      "Group 2: る → て.",
    ),
    // ── Group 1: って ──
    cloze(
      "ja-m14-7-1-cloze-matte",
      "ちょっと ま",
      "ください。",
      "って",
      ["って", "て", "んで", "して"],
      "Please wait a moment. (まつ → まって)",
      "ちょっと まってください。",
      "Group 1: つ → って.",
    ),
    // ── Group 1: んで ──
    cloze(
      "ja-m14-7-1-cloze-yonde",
      "この ほんを よ",
      "ください。",
      "んで",
      ["んで", "って", "いて", "して"],
      "Please read this book. (よむ → よんで)",
      "この ほんを よんでください。",
      "Group 1: む → んで.",
    ),
    // ── Group 1: いて ──
    cloze(
      "ja-m14-7-1-cloze-kaite",
      "なまえを か",
      "ください。",
      "いて",
      ["いて", "んで", "って", "て"],
      "Please write your name. (かく → かいて)",
      "なまえを かいてください。",
      "Group 1: く → いて.",
    ),
    // ── Exception: いく → いって ──
    sentenceMcq({
      id: "ja-m14-7-1-mcq-itte",
      prompt: "いく → て-form. Choose carefully!",
      correctKana: "いって",
      distractorsKana: ["いいて", "いんで", "いて"],
      explanation: "いく is THE exception: いって, NOT いいて.",
    }),
    // ── Group 1: して ──
    cloze(
      "ja-m14-7-1-cloze-hanashite",
      "ゆっくり はな",
      "ください。",
      "して",
      ["して", "いて", "って", "んで"],
      "Please speak slowly. (はなす → はなして)",
      "ゆっくり はなしてください。",
      "Group 1: す → して.",
    ),
    // ── Irregular: する ──
    build(
      "ja-m14-7-1-build-shite-kudasai",
      "Say: Please study.",
      "べんきょうしてください",
      ["ください", "きて", "して", "いって", "べんきょう"],
      ["べんきょう", "して", "ください"],
    ),
    // ── Irregular: くる ──
    build(
      "ja-m14-7-1-build-kite-kudasai",
      "Say: Please come here.",
      "ここに きてください",
      ["きて", "ここ", "いって", "ください", "して", "に"],
      ["ここ", "に", "きて", "ください"],
    ),
    // ── Mixed discrimination ──
    sentenceMcq({
      id: "ja-m14-7-1-mcq-mixed",
      prompt: "Which pair is CORRECT? (verb → て-form)",
      correctKana: "のむ → のんで / みる → みて",
      distractorsKana: [
        "のむ → のって / みる → みって",
        "のむ → のんで / みる → みって",
        "のむ → のいて / みる → みて",
      ],
      explanation: "のむ (Group 1, む→んで) = のんで. みる (Group 2, る→て) = みて.",
    }),
    listeningBuildSentence({
      id: "ja-m14-7-1-lb-shimete",
      target: "まどを しめてください",
      tiles: ["ください", "あけて", "とって", "を", "まど", "しめて"],
      correctOrder: ["まど", "を", "しめて", "ください"],
      promptEn: "Hear it, build it: 'Please close the window.'",
    }),
    listeningCompSentence({
      id: "ja-m14-7-1-lc-kite",
      audioText: "あした きてください",
      correctMeaningEn: "Please come tomorrow.",
      distractorsEn: [
        "Please go tomorrow.",
        "I came yesterday.",
        "Please wait until tomorrow.",
      ],
    }),
    translateStep({
      id: "ja-m14-7-1-translate",
      promptEn: "Please read the letter.",
      acceptedAnswers: [
        "てがみを よんでください",
        "てがみを よんでください。",
        "てがみをよんでください",
      ],
      audioText: "てがみを よんでください",
    }),
    selfExplain({
      id: "ja-m14-7-1-self-explain",
      anchorLabel: "て(G2), って(う/つ/る), んで(む/ぶ), いて(く), いで(ぐ), して(す), いって(いく!), して/きて(irregular)",
      anchorAudioText: "まってください",
      question: "A verb ends in む. What て-form ending does it take?",
      rule: { text: "む → んで. Labial consonants (む/ぶ/ぬ) nasalize to ん and pair with で." },
      surface: { text: "む → って, because all Group 1 verbs use って." },
      distractor: { text: "む → みて, because you keep the み sound and add て." },
      ruleExplanation:
        "Group 1 て-form endings are determined by the final consonant. む/ぶ → んで is the nasal pattern, distinct from う/つ/る → って (geminate) and く → いて (vowel insertion).",
    }),
    speaking(
      "ja-m14-7-1-speak-hanashite",
      "ともだちと はなしてください",
      "Please talk with your friend.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-7-1-rev-mcq-1", M14_7_1_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-7-1-rev-lc-1",
      // Sentence-level review of だれ (M4) — 2026-07-12 listening backfill.
      audioText: "これは だれの けいたいですか",
      correctMeaningEn: "Whose mobile phone is this?",
      distractorsEn: [
        "Whose camera is this?",
        "Where is my mobile phone?",
        "This is my mobile phone.",
      ],
    }),
    speaking("ja-m14-7-1-rev-speak-1", M14_7_1_REVIEW[2].kana, M14_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m14-7-1-rev", M14_7_1_REVIEW),
    // Coverage backfill — full-spine atom re-exposure gate (retrospective §4 Gate 4).
    speaking("ja-m14-7-1-cov-akeru", "あける", "to open"),
    speaking("ja-m14-7-1-cov-hanasu", "はなす", "to speak"),
    speaking("ja-m14-7-1-cov-miseru", "みせる", "to show"),
    speaking("ja-m14-7-1-cov-oshieru", "おしえる", "to teach"),
  ],
};

assertNoSameAnswerCluster(M14_7_1.steps);
assertAnswerRotation(M14_7_1.steps, 1);
assertNoConsecutiveSame(M14_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-7-2 — "Te-form production"
//   (translate + speaking — highest-tier retrieval)
// ═══════════════════════════════════════════════════════════════════════

const M14_7_2_REVIEW = pickReviewAtoms("ja-m14-7-2-rev", M14_REVIEW_POOL, 4);

export const M14_7_2: LessonContent = {
  id: "ja-m14-7-2",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Te-form production",
  description:
    "Free-recall translation and speaking — producing て-form from scratch.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── Translation chain ──
    translateStep({
      id: "ja-m14-7-2-translate-1",
      promptEn: "Please eat an apple.",
      acceptedAnswers: [
        "りんごを たべてください",
        "りんごを たべてください。",
        "りんごをたべてください",
      ],
      audioText: "りんごを たべてください",
    }),
    speaking(
      "ja-m14-7-2-speak-tabete",
      "りんごを たべてください",
      "Please eat an apple.",
    ),
    translateStep({
      id: "ja-m14-7-2-translate-2",
      promptEn: "Please wait at the station.",
      acceptedAnswers: [
        "えきで まってください",
        "えきで まってください。",
        "えきでまってください",
      ],
      audioText: "えきで まってください",
    }),
    sentenceMcq({
      id: "ja-m14-7-2-mcq-nonde",
      prompt: "Which sentence means 'Please drink water.'?",
      correctKana: "みずを のんでください。",
      distractorsKana: [
        "みずを のってください。",
        "みずを のいてください。",
        "みずを のしてください。",
      ],
      explanation: "のむ → のんで (む→んで). みずを のんでください.",
    }),
    translateStep({
      id: "ja-m14-7-2-translate-3",
      promptEn: "Please write a letter.",
      acceptedAnswers: [
        "てがみを かいてください",
        "てがみを かいてください。",
        "てがみをかいてください",
      ],
      audioText: "てがみを かいてください",
    }),
    speaking(
      "ja-m14-7-2-speak-kaite",
      "てがみを かいてください",
      "Please write a letter.",
    ),
    build(
      "ja-m14-7-2-build-itte",
      "Say: Please go to the station.",
      "えきに いってください",
      ["かえって", "ください", "いって", "に", "いいて", "えき"],
      ["えき", "に", "いって", "ください"],
    ),
    translateStep({
      id: "ja-m14-7-2-translate-4",
      promptEn: "Please speak in Japanese.",
      acceptedAnswers: [
        "にほんごで はなしてください",
        "にほんごで はなしてください。",
        "にほんごではなしてください",
      ],
      audioText: "にほんごで はなしてください",
    }),
    listeningCompSentence({
      id: "ja-m14-7-2-lc-kashite",
      audioText: "かぎを かしてください",
      correctMeaningEn: "Please lend me the key.",
      distractorsEn: [
        "Please take the key.",
        "Please return the key.",
        "Please buy a key.",
      ],
    }),
    translateStep({
      id: "ja-m14-7-2-translate-5",
      promptEn: "Please come to the library.",
      acceptedAnswers: [
        "としょかんに きてください",
        "としょかんに きてください。",
        "としょかんにきてください",
      ],
      audioText: "としょかんに きてください",
    }),
    speaking(
      "ja-m14-7-2-speak-kite",
      "としょかんに きてください",
      "Please come to the library.",
    ),
    listeningBuildSentence({
      id: "ja-m14-7-2-lb-akete-mado",
      target: "まどを あけてください",
      tiles: ["きて", "まど", "しめて", "ください", "あけて", "を"],
      correctOrder: ["まど", "を", "あけて", "ください"],
      promptEn: "Hear it, build it: 'Please open the window.'",
    }),
    selfExplain({
      id: "ja-m14-7-2-self-explain",
      anchorLabel: "You translated 5 different てください requests from English",
      anchorAudioText: "はなしてください",
      question: "What is the most reliable way to determine a verb's て-form?",
      rule: { text: "1) Identify the verb group. 2) For Group 1, check the dictionary form's final kana. 3) Apply って/んで/いて/いで/して — watch for the いく exception." },
      surface: { text: "Just memorize every verb's て-form individually — there are no reliable patterns." },
      distractor: { text: "Count the number of kana in the verb — longer verbs are Group 2, shorter are Group 1." },
      ruleExplanation:
        "て-form is systematic. Group ID + final kana = predictable output. The only real memorization is いく→いって and する/くる. Everything else follows rules.",
    }),
    speaking(
      "ja-m14-7-2-speak-misete",
      "それを みせてください",
      "Please show me that.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-7-2-rev-mcq-1", M14_7_2_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-7-2-rev-lc-1",
      // Sentence-level review of さん (M5) — 2026-07-12 listening backfill.
      audioText: "しゃしんを さんまい ください",
      correctMeaningEn: "Three photos, please.",
      distractorsEn: [
        "Two photos, please.",
        "Three tickets, please.",
        "Three pens, please.",
      ],
    }),
    reviewMatchPairs("ja-m14-7-2-rev", M14_7_2_REVIEW),
    // Coverage backfill — full-spine atom re-exposure gate (retrospective §4 Gate 4).
    speaking("ja-m14-7-2-cov-akeru", "あける", "to open"),
    speaking("ja-m14-7-2-cov-hanasu", "はなす", "to speak"),
  ],
};

assertNoSameAnswerCluster(M14_7_2.steps);
assertAnswerRotation(M14_7_2.steps, 1);
assertNoConsecutiveSame(M14_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

const ALL_M14 = [
  M14_1_1, M14_1_2, M14_2_1, M14_2_2, M14_3_1, M14_3_2,
  M14_4_1, M14_4_2, M14_5_1, M14_5_2, M14_6_1, M14_6_2,
  M14_STORY, M14_7_1, M14_7_2,
];

assertNoSameAnswerCluster(ALL_M14.flatMap((l) => l.steps));

// Passive-card lint
for (const lesson of ALL_M14) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
