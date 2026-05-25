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
import type { LessonContent } from "../types";
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
} from "./_jaGrammarHelpers";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  assertPassiveCardsHaveFollowup,
} from "./_stepAssertions";

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
    infoStep(
      "ja-m14-1-1-info-open",
      "The て-form begins",
      "て-form is the Swiss Army knife of Japanese grammar. It powers requests, connections, and more. Group 2 verbs are the easiest — just swap る for て.",
    ),
    RULE_TE_GROUP2,
    // ── たべて (eat → te-form) ──
    build(
      "ja-m14-1-1-build-tabete",
      "Convert たべる to て-form",
      "たべて",
      ["たべて", "たべって", "たべんで", "たべいて"],
      ["たべて"],
    ),
    listeningCompSentence({
      id: "ja-m14-1-1-lc-tabete",
      audioText: "たべて",
      correctMeaningEn: "eat (te-form)",
      distractorsEn: ["ate", "will eat", "eating (polite)"],
    }),
    // ── みて (watch → te-form) ──
    build(
      "ja-m14-1-1-build-mite",
      "Convert みる to て-form",
      "みて",
      ["みて", "みって", "みんで", "みいて"],
      ["みて"],
    ),
    speaking("ja-m14-1-1-speak-mite", "みて", "Watch (te-form)"),
    // ── みせる (show) — new verb ──
    build(
      "ja-m14-1-1-build-miseru",
      "Pick the Japanese word for: Show",
      "みせる",
      ["みせる", "みる", "おしえる", "たべる"],
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
      ["おしえる", "みせる", "たべる", "みる"],
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
      ["たべて", "ください", "たべる", "みせて"],
      ["たべて", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m14-1-1-lb-oshiete",
      target: "おしえてください",
      tiles: ["おしえて", "ください", "みせて", "たべて"],
      correctOrder: ["おしえて", "ください"],
      promptEn: "Hear it, build it: 'Please teach me.'",
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
      audioText: M14_1_1_REVIEW[1].kana,
      correctMeaningEn: M14_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_1_1_REVIEW[2].meaningEn,
        M14_1_1_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m14-1-1-rev-speak-1", M14_1_1_REVIEW[2].kana, M14_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m14-1-1-rev", M14_1_1_REVIEW),
    infoStep(
      "ja-m14-1-1-info-end",
      "You can now convert Group 2 verbs to て-form",
      "たべて, みて, みせて, おしえて — the ichidan pattern is simple: る → て. The hardest part is knowing which verbs are Group 2.",
      "win",
    ),
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
    infoStep(
      "ja-m14-1-2-info-open",
      "More Group 2 practice",
      "Let's drill three more Group 2 verbs — and sneak in one Group 1 verb to see the contrast.",
    ),
    // ── でんわ (phone) — object vocab ──
    build(
      "ja-m14-1-2-build-denwa",
      "Pick the Japanese word for: Phone",
      "でんわ",
      ["でんわ", "カメラ", "かぎ", "さいふ"],
      ["でんわ"],
    ),
    vocabMcq(
      "ja-m14-1-2-mcq-denwa",
      { kana: "でんわ", meaningEn: "phone", emoji: "☎️", fromModule: "m2" },
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
      ["あけて", "あけって", "あけんで", "あけいて"],
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
      id: "ja-m14-1-2-lc-shimete",
      audioText: "まどを しめてください",
      correctMeaningEn: "Please close the window.",
      distractorsEn: [
        "Please open the window.",
        "Please break the window.",
        "Close the door, please.",
      ],
    }),
    // ── てつだう (help) — Group 1 preview ──
    build(
      "ja-m14-1-2-build-tetsudau",
      "Pick the Japanese word for: Help (someone)",
      "てつだう",
      ["てつだう", "おしえる", "みせる", "かける"],
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
      ["みせて", "ください", "おしえて", "かけて"],
      ["みせて", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m14-1-2-lb-akete",
      target: "あけてください",
      tiles: ["あけて", "ください", "しめて", "みせて"],
      correctOrder: ["あけて", "ください"],
      promptEn: "Hear it, build it: 'Please open it.'",
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
      audioText: M14_1_2_REVIEW[1].kana,
      correctMeaningEn: M14_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_1_2_REVIEW[2].meaningEn,
        M14_1_2_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[1].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m14-1-2-rev", M14_1_2_REVIEW),
    infoStep(
      "ja-m14-1-2-info-end",
      "You can now make requests with Group 2 verbs",
      "あけて, しめて, かけて — you're building polite requests. Next: Group 1 verbs and their consonant changes.",
      "win",
    ),
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
    infoStep(
      "ja-m14-2-1-info-open",
      "Group 1: the って pattern",
      "Three endings — う, つ, る — all become って. The consonant drops and doubles into っ.",
    ),
    RULE_TE_GROUP1_TTE,
    // ── まつ (wait) — new verb ──
    build(
      "ja-m14-2-1-build-matsu",
      "Pick the Japanese word for: Wait",
      "まつ",
      ["まつ", "かう", "かえる", "とる"],
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
      ["かって", "かいて", "かて", "かんで"],
      ["かって"],
    ),
    listeningCompSentence({
      id: "ja-m14-2-1-lc-katte",
      audioText: "かって",
      correctMeaningEn: "buy (te-form)",
      distractorsEn: ["write (te-form)", "return (te-form)", "wait (te-form)"],
    }),
    // ── かえる (return — Group 1 trap!) ──
    build(
      "ja-m14-2-1-build-kaette",
      "Convert かえる (return) to て-form. Careful — it's Group 1!",
      "かえって",
      ["かえって", "かえて", "かえんで", "かえいて"],
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
      ["とる", "まつ", "かう", "かえる"],
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
      tiles: ["ちょっと", "まって", "ください", "かえって", "とって"],
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
    infoStep(
      "ja-m14-2-1-info-end",
      "You can now handle って verbs",
      "まって, かって, かえって, とって — three endings (う/つ/る) all become って. Watch out for かえる — it looks like Group 2 but isn't!",
      "win",
    ),
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
    infoStep(
      "ja-m14-2-2-info-open",
      "って mastery round",
      "Time to drill って until it's automatic — plus one tricky contrast between Group 1 and Group 2.",
    ),
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
    speaking("ja-m14-2-2-speak-tetsudatte", "てつだってください", "Please help."),
    // ── かす (lend) — new verb ──
    build(
      "ja-m14-2-2-build-kasu",
      "Pick the Japanese word for: Lend",
      "かす",
      ["かす", "とる", "まつ", "かう"],
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
      "ま",
      "ください。",
      "って",
      ["って", "て", "んで", "して"],
      "Please wait. (まつ → まって)",
      "まってください。",
      "まつ is Group 1, つ → って.",
    ),
    cloze(
      "ja-m14-2-2-cloze-contrast-tabete",
      "たべ",
      "ください。",
      "て",
      ["て", "って", "んで", "いて"],
      "Please eat. (たべる → たべて, Group 2!)",
      "たべてください。",
      "たべる is Group 2 (ichidan). る → て, no doubling.",
    ),
    build(
      "ja-m14-2-2-build-tetsudatte-sentence",
      "Say: Please help.",
      "てつだってください",
      ["てつだって", "ください", "てつだて", "おしえて"],
      ["てつだって", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m14-2-2-lc-totte",
      audioText: "しゃしんを とってください",
      correctMeaningEn: "Please take a photo.",
      distractorsEn: [
        "Please wait a moment.",
        "Please show me the photo.",
        "Please buy a camera.",
      ],
    }),
    // ── Mixed production drill ──
    build(
      "ja-m14-2-2-build-kaette-sentence",
      "Say: Please return home.",
      "うちに かえってください",
      ["うち", "に", "かえって", "ください", "かえて", "まって"],
      ["うち", "に", "かえって", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m14-2-2-lb-katte",
      target: "これを かってください",
      tiles: ["これ", "を", "かって", "ください", "まって", "とって"],
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
      audioText: M14_2_2_REVIEW[1].kana,
      correctMeaningEn: M14_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_2_2_REVIEW[2].meaningEn,
        M14_2_2_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[3].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m14-2-2-rev", M14_2_2_REVIEW),
    infoStep(
      "ja-m14-2-2-info-end",
      "You can now contrast Group 1 って with Group 2 て",
      "The って pattern is locked in. You know the trap: かえる looks Group 2 but uses って. Next: the other Group 1 patterns.",
      "win",
    ),
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
    infoStep(
      "ja-m14-3-1-info-open",
      "Four more て-form patterns",
      "Group 1 has four more patterns. む/ぶ nasalize into んで, く softens to いて, ぐ to いで, and す to して.",
    ),
    RULE_TE_GROUP1_NDE_ITE,
    // ── のむ (drink) → のんで ──
    build(
      "ja-m14-3-1-build-nonde",
      "Convert のむ (drink) to て-form",
      "のんで",
      ["のんで", "のって", "のみて", "のいて"],
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
      ["あそんで", "あそって", "あそいて", "あそいで"],
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
      ["およいで", "およいて", "およんで", "およって"],
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
      tiles: ["コーヒー", "を", "のんで", "ください", "かいて", "はなして"],
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
      audioText: M14_3_1_REVIEW[1].kana,
      correctMeaningEn: M14_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_3_1_REVIEW[2].meaningEn,
        M14_3_1_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[4].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m14-3-1-rev", M14_3_1_REVIEW),
    infoStep(
      "ja-m14-3-1-info-end",
      "You know four more て-form patterns",
      "のんで, あそんで (んで), かいて (いて), およいで (いで), はなして (して). Six of seven Group 1 patterns are now yours.",
      "win",
    ),
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
    infoStep(
      "ja-m14-3-2-info-open",
      "The big exception: いく → いって",
      "All く-ending verbs use いて... except いく (go). いく → いって, NOT いいて. This is the #1 mistake learners make.",
    ),
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
      ["いって", "いいて", "いんで", "いて"],
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
      ["さいふ", "かぎ", "でんわ", "カメラ"],
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
      ["みず", "を", "のんで", "ください", "かいて", "はなして"],
      ["みず", "を", "のんで", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m14-3-2-lb-itte",
      target: "がっこうに いってください",
      tiles: ["がっこう", "に", "いって", "ください", "かえって", "いいて"],
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
      "ペンを かしてください",
      "Please lend me a pen.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-3-2-rev-mcq-1", M14_3_2_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-3-2-rev-lc-1",
      audioText: M14_3_2_REVIEW[1].kana,
      correctMeaningEn: M14_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_3_2_REVIEW[2].meaningEn,
        M14_3_2_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[5].meaningEn,
      ],
    }),
    speaking("ja-m14-3-2-rev-speak-1", M14_3_2_REVIEW[2].kana, M14_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m14-3-2-rev", M14_3_2_REVIEW),
    infoStep(
      "ja-m14-3-2-info-end",
      "You know the biggest て-form exception",
      "いく → いって (NOT いいて). The #1 mistake learners make, and now you won't make it. All Group 1 patterns are yours.",
      "win",
    ),
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
    infoStep(
      "ja-m14-4-1-info-open",
      "Irregulars + the た-form shortcut",
      "Just two irregular verbs — する and くる. Plus a bonus: once you know て-form, the た-form (plain past) is free.",
    ),
    RULE_TE_IRREGULARS,
    // ── する → して ──
    build(
      "ja-m14-4-1-build-shite",
      "Convert する (do) to て-form",
      "して",
      ["して", "すって", "すんで", "すいて"],
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
    // ── くる → きて ──
    build(
      "ja-m14-4-1-build-kite",
      "Convert くる (come) to て-form",
      "きて",
      ["きて", "くって", "くんで", "くいて"],
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
      ["のんだ", "のんた", "のった", "のいた"],
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
      ["きた", "きだ", "くった", "くんだ"],
      ["きた"],
    ),
    listeningBuildSentence({
      id: "ja-m14-4-1-lb-shite",
      target: "べんきょうしてください",
      tiles: ["べんきょう", "して", "ください", "きて", "いって"],
      correctOrder: ["べんきょう", "して", "ください"],
      promptEn: "Hear it, build it: 'Please study.'",
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
      audioText: M14_4_1_REVIEW[1].kana,
      correctMeaningEn: M14_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_4_1_REVIEW[2].meaningEn,
        M14_4_1_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[6].meaningEn,
      ],
    }),
    speaking("ja-m14-4-1-rev-speak-1", M14_4_1_REVIEW[2].kana, M14_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m14-4-1-rev", M14_4_1_REVIEW),
    infoStep(
      "ja-m14-4-1-info-end",
      "You now know every て-form pattern in Japanese",
      "Group 2, Group 1 (って/んで/いて/いで/して), いく exception, する/くる irregulars — and the た-form is free. All patterns unlocked.",
      "win",
    ),
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
    infoStep(
      "ja-m14-4-2-info-open",
      "た-form mastery",
      "You know the rule: て → た, で → だ. Let's drill it until the conversion is instant.",
    ),
    // ── た-form production chain ──
    build(
      "ja-m14-4-2-build-tabeta",
      "What is the た-form (plain past) of たべる?",
      "たべた",
      ["たべた", "たべだ", "たべった", "たべんだ"],
      ["たべた"],
    ),
    build(
      "ja-m14-4-2-build-nonda",
      "What is the た-form of のむ?",
      "のんだ",
      ["のんだ", "のんた", "のった", "のいた"],
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
      ["およいだ", "およいた", "およんだ", "およった"],
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
      ["べんきょう", "した", "して", "きた", "きて"],
      ["べんきょう", "した"],
    ),
    listeningBuildSentence({
      id: "ja-m14-4-2-lb-itta",
      target: "がっこうに いった",
      tiles: ["がっこう", "に", "いった", "いいた", "かえった", "きた"],
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
      audioText: M14_4_2_REVIEW[1].kana,
      correctMeaningEn: M14_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_4_2_REVIEW[2].meaningEn,
        M14_4_2_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[7].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m14-4-2-rev", M14_4_2_REVIEW),
    infoStep(
      "ja-m14-4-2-info-end",
      "You can now produce both て-form and た-form for any verb",
      "て→た, で→だ — the entire Japanese conjugation system for requests AND plain past is in your hands.",
      "win",
    ),
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
    infoStep(
      "ja-m14-5-1-info-open",
      "Making requests",
      "You already know ください ('please give me'). Now: て-form + ください = polite requests for actions.",
    ),
    RULE_TE_KUDASAI,
    // ── しゃしん (photo) — object vocab ──
    build(
      "ja-m14-5-1-build-shashin",
      "Pick the Japanese word for: Photo",
      "しゃしん",
      ["しゃしん", "でんわ", "カメラ", "さいふ"],
      ["しゃしん"],
    ),
    vocabMcq(
      "ja-m14-5-1-mcq-shashin",
      { kana: "しゃしん", meaningEn: "photo", emoji: "📸", fromModule: "m2" },
      M14_REVIEW_POOL,
    ),
    // ── Request drills ──
    build(
      "ja-m14-5-1-build-matte-kudasai",
      "Say: Please wait.",
      "まってください",
      ["まって", "ください", "かえって", "みせて"],
      ["まって", "ください"],
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
      "Say: Please drink water.",
      "みずを のんでください",
      ["みず", "を", "のんで", "ください", "かいて", "して"],
      ["みず", "を", "のんで", "ください"],
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
      ["でんわ", "を", "かして", "ください", "みせて", "とって"],
      ["でんわ", "を", "かして", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m14-5-1-lb-tetsudatte",
      target: "てつだってください",
      tiles: ["てつだって", "ください", "まって", "して", "おしえて"],
      correctOrder: ["てつだって", "ください"],
      promptEn: "Hear it, build it: 'Please help.'",
    }),
    translateStep({
      id: "ja-m14-5-1-translate",
      promptEn: "Please take a photo.",
      acceptedAnswers: [
        "しゃしんを とってください",
        "しゃしんを とってください。",
        "しゃしんをとってください",
      ],
      audioText: "しゃしんを とってください",
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
    infoStep(
      "ja-m14-5-1-info-end",
      "You can now make polite requests in any situation",
      "まってください, みせてください, おしえてください — the て-form + ください pattern works with every verb.",
      "win",
    ),
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
    infoStep(
      "ja-m14-5-2-info-open",
      "Requests in the real world",
      "Let's use てください in practical situations — asking for help in a shop, giving directions, and more.",
    ),
    // ── かぎ (key) — object vocab ──
    build(
      "ja-m14-5-2-build-kagi",
      "Pick the Japanese word for: Key",
      "かぎ",
      ["かぎ", "さいふ", "でんわ", "しゃしん"],
      ["かぎ"],
    ),
    vocabMcq(
      "ja-m14-5-2-mcq-kagi",
      { kana: "かぎ", meaningEn: "key", emoji: "🔑", fromModule: "m2" },
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
      ["えき", "に", "いって", "ください", "かえって", "きて"],
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
      ["この", "ほん", "を", "よんで", "ください", "かいて", "みて"],
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
      tiles: ["あした", "きて", "ください", "いって", "して", "まって"],
      correctOrder: ["あした", "きて", "ください"],
      promptEn: "Hear it, build it: 'Please come tomorrow.'",
    }),
    translateStep({
      id: "ja-m14-5-2-translate",
      promptEn: "Please lend me the key.",
      acceptedAnswers: [
        "かぎを かしてください",
        "かぎを かしてください。",
        "かぎをかしてください",
      ],
      audioText: "かぎを かしてください",
    }),
    selfExplain({
      id: "ja-m14-5-2-self-explain",
      anchorLabel: "みてください (Group 2) vs かえってください (Group 1) vs きてください (irregular)",
      anchorAudioText: "きてください",
      question: "How do you decide between て, って, んで etc. before ください?",
      rule: { text: "First identify the verb group, then apply the て-form rule: Group 2 drops る → て; Group 1 depends on the ending consonant; irregulars are memorized." },
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
      audioText: M14_5_2_REVIEW[1].kana,
      correctMeaningEn: M14_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_5_2_REVIEW[2].meaningEn,
        M14_5_2_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[9].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m14-5-2-rev", M14_5_2_REVIEW),
    infoStep(
      "ja-m14-5-2-info-end",
      "You can now request anything politely in Japanese",
      "From 'please wait' to 'please come tomorrow' — てください is the universal polite request. You're using all verb groups fluently.",
      "win",
    ),
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
    infoStep(
      "ja-m14-6-1-info-open",
      "Numbers get bigger, counting gets specific",
      "ひゃく (100), せん (1,000), まん (10,000) — plus Japanese counts objects differently depending on their shape.",
    ),
    RULE_BIG_NUMBERS,
    // ── ひゃく (100) ──
    build(
      "ja-m14-6-1-build-hyaku",
      "Pick the Japanese word for: 100",
      "ひゃく",
      ["ひゃく", "せん", "まん", "じゅう"],
      ["ひゃく"],
    ),
    listeningCompSentence({
      id: "ja-m14-6-1-lc-hyaku",
      audioText: "ひゃく",
      correctMeaningEn: "100",
      distractorsEn: ["1,000", "10,000", "10"],
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
      ["せん", "ひゃく", "まん", "じゅう"],
      ["せん"],
    ),
    speaking("ja-m14-6-1-speak-nisen", "にせん", "2,000"),
    // ── いちまん (10,000) ──
    build(
      "ja-m14-6-1-build-ichiman",
      "Pick the Japanese for: 10,000",
      "いちまん",
      ["いちまん", "せん", "ひゃく", "にせん"],
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
      "きっぷを に",
      " ください。",
      "まい",
      ["まい", "こ", "ほん", "にん"],
      "Two tickets, please. (枚/まい = counter for flat things)",
      "きっぷを にまい ください。",
      "枚 (まい) counts flat things: tickets, paper, photos. きっぷ = ticket.",
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
      ["いっぽん", "いちほん", "いちぼん", "いっぼん"],
      ["いっぽん"],
    ),
    listeningBuildSentence({
      id: "ja-m14-6-1-lb-gohyaku",
      target: "ごひゃくえんです",
      tiles: ["ごひゃく", "えん", "です", "さんびゃく", "せん"],
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
    infoStep(
      "ja-m14-6-1-info-end",
      "You can now count to 10,000 and use three counters",
      "ひゃく, せん, まん + 個, 枚, 本. Watch those sound changes: さんびゃく, さんぼん, いっぽん.",
      "win",
    ),
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
    "More counter practice with 個/枚/本 plus big numbers in shopping contexts.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m14-6-2-info-open",
      "Counting in context",
      "Let's use counters and big numbers in real shopping conversations — prices, quantities, and more.",
    ),
    // ── カメラ (camera) — review/context ──
    vocabMcq(
      "ja-m14-6-2-mcq-camera",
      { kana: "カメラ", meaningEn: "camera", emoji: "📷", fromModule: "m4" },
      M14_REVIEW_POOL,
    ),
    // ── Counter discrimination drill ──
    cloze(
      "ja-m14-6-2-cloze-mai-shashin",
      "しゃしんを ご",
      " とってください。",
      "まい",
      ["まい", "こ", "ほん", "にん"],
      "Please take five photos. (photos are flat → 枚/まい)",
      "しゃしんを ごまい とってください。",
      "Photos are flat → use 枚 (まい). Five photos = ごまい.",
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
      ["さんこ", "ください", "さんぼん", "さんまい"],
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
      ["さんぜん", "さんせん", "さんげん", "さんねん"],
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
      tiles: ["にせん", "えん", "です", "さんぜん", "ごひゃく"],
      correctOrder: ["にせん", "えん", "です"],
      promptEn: "Hear it, build it: 'It's 2,000 yen.'",
    }),
    // ── Combined counters + requests ──
    build(
      "ja-m14-6-2-build-nimai-kudasai",
      "Say: Two tickets, please.",
      "きっぷを にまい ください",
      ["きっぷ", "を", "にまい", "ください", "にほん", "にこ"],
      ["きっぷ", "を", "にまい", "ください"],
    ),
    translateStep({
      id: "ja-m14-6-2-translate",
      promptEn: "Three pens, please.",
      acceptedAnswers: [
        "ペンを さんぼん ください",
        "ペンを さんぼん ください。",
        "ペンをさんぼんください",
      ],
      audioText: "ペンを さんぼん ください",
    }),
    selfExplain({
      id: "ja-m14-6-2-self-explain",
      anchorLabel: "しゃしん → まい (flat), ペン → ほん (cylindrical), りんご → こ (general)",
      anchorAudioText: "さんぼん ください",
      question: "How do you pick the right counter for an object?",
      rule: { text: "Match the counter to the object's shape: 枚 (まい) for flat things (paper, tickets, photos), 本 (ほん) for long/cylindrical things (pens, bottles, trees), 個 (こ) for small round or general objects." },
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
    // ── Review tail ──
    vocabMcq("ja-m14-6-2-rev-mcq-1", M14_6_2_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-6-2-rev-lc-1",
      audioText: M14_6_2_REVIEW[1].kana,
      correctMeaningEn: M14_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_6_2_REVIEW[2].meaningEn,
        M14_6_2_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[11].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m14-6-2-rev", M14_6_2_REVIEW),
    infoStep(
      "ja-m14-6-2-info-end",
      "You can now count objects by shape and handle big numbers",
      "個, 枚, 本 — three counters covering most everyday objects. Plus prices up to 10,000 yen with all the sound changes.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M14_6_2.steps);
assertAnswerRotation(M14_6_2.steps, 1);
assertNoConsecutiveSame(M14_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M14-STORY — Dialogue: asking for help at a store
//   ("すみません、それを みせてください")
// ═══════════════════════════════════════════════════════════════════════

export const M14_STORY: LessonContent = {
  id: "ja-m14-story",
  moduleId: "m14",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — At the electronics shop",
  description:
    "Listen to a customer asking for help at a store using te-form requests and counters.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m14-story-info-open",
      "Story time — Shopping for gifts",
      "ゆき is at an electronics shop buying gifts. She needs help from the store clerk. Listen as she uses てください to make requests.",
    ),
    dialogueListen({
      id: "ja-m14-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "すみません。あの カメラを みせてください。" },
        { speaker: "てんいん", kana: "はい、どうぞ。さんぜんえんです。" },
        { speaker: "ゆき", kana: "いいですね。しゃしんを とってもいいですか。" },
        { speaker: "てんいん", kana: "はい、とってください。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "What does ゆき ask the clerk to do first?",
          correctText: "Show her the camera.",
          distractors: ["Lend her the camera.", "Buy the camera.", "Take a photo."],
          explanation: "ゆき says あの カメラを みせてください = 'Please show me that camera.'",
        },
        {
          id: "s1-q2",
          prompt: "How much does the camera cost?",
          correctText: "3,000 yen.",
          distractors: ["300 yen.", "30,000 yen.", "1,500 yen."],
          explanation: "てんいん says さんぜんえんです = 'It's 3,000 yen.'",
        },
      ],
    }),
    build(
      "ja-m14-story-build-misete",
      "Say: Please show me that camera.",
      "あの カメラを みせてください",
      ["あの", "カメラ", "を", "みせて", "ください", "この", "かって"],
      ["あの", "カメラ", "を", "みせて", "ください"],
    ),
    sentenceMcq({
      id: "ja-m14-story-mcq-totte",
      prompt: "ゆき asked とってもいいですか. What does this mean?",
      correctKana: "Is it OK to take (a photo)?",
      distractorsKana: [
        "Please take a photo.",
        "I took a photo.",
        "Can you take a photo for me?",
      ],
      explanation: "て-form + もいいですか = 'Is it OK if I ~?' Another て-form construction!",
    }),
    dialogueListen({
      id: "ja-m14-story-scene-2",
      lines: [
        { speaker: "ゆき", kana: "ペンも ありますか。ともだちに あげたいです。" },
        { speaker: "てんいん", kana: "はい、あります。なんぼん ほしいですか。" },
        { speaker: "ゆき", kana: "さんぼん ください。" },
        { speaker: "てんいん", kana: "はい。カメラと ペンで さんぜんごひゃくえんです。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "How many pens does ゆき want?",
          correctText: "3 (さんぼん).",
          distractors: ["2 (にほん).", "5 (ごほん).", "1 (いっぽん)."],
          explanation: "ゆき says さんぼん ください = 'Three (pens), please.'",
        },
        {
          id: "s2-q2",
          prompt: "What is the total cost?",
          correctText: "3,500 yen.",
          distractors: ["3,000 yen.", "5,300 yen.", "350 yen."],
          explanation: "てんいん says さんぜんごひゃくえんです = 'It's 3,500 yen.'",
        },
      ],
    }),
    cloze(
      "ja-m14-story-cloze-sanbon",
      "ペンを さん",
      " ください。",
      "ぼん",
      ["ぼん", "ほん", "ぽん", "こ"],
      "Three pens, please. (3 + 本 = さんぼん)",
      "ペンを さんぼん ください。",
      "3 + 本 = さんぼん. The ほ voices to ぼ after ん.",
    ),
    listeningBuildSentence({
      id: "ja-m14-story-lb-misete",
      target: "あの カメラを みせてください",
      tiles: ["あの", "カメラ", "を", "みせて", "ください", "この", "かって"],
      correctOrder: ["あの", "カメラ", "を", "みせて", "ください"],
      promptEn: "Hear it, build it: 'Please show me that camera.'",
    }),
    listeningCompSentence({
      id: "ja-m14-story-lc-sanzen",
      audioText: "さんぜんごひゃくえんです",
      correctMeaningEn: "It's 3,500 yen.",
      distractorsEn: [
        "It's 3,000 yen.",
        "It's 5,300 yen.",
        "It's 350 yen.",
      ],
    }),
    speaking(
      "ja-m14-story-speak-misete",
      "すみません、みせてください",
      "Excuse me, please show me.",
    ),
    sentenceMcq({
      id: "ja-m14-story-mcq-summary",
      prompt: "What two items did ゆき buy?",
      correctKana: "カメラと ペン",
      distractorsKana: ["カメラと でんわ", "ペンと ほん", "カメラと さいふ"],
      explanation: "ゆき bought a camera (カメラ) and three pens (ペン).",
    }),
    speaking(
      "ja-m14-story-speak-sanbon",
      "さんぼん ください",
      "Three (cylindrical things), please.",
    ),
    infoStep(
      "ja-m14-story-info-end",
      "You followed a real shopping conversation",
      "てください requests, counters (さんぼん), and big numbers (さんぜんごひゃくえん) — all in a realistic store scene.",
      "win",
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
    infoStep(
      "ja-m14-7-1-info-open",
      "The ultimate て-form test",
      "Every group, every pattern, every exception — all mixed together. Can you conjugate them all?",
    ),
    // ── Rapid-fire conjugation: Group 2 ──
    cloze(
      "ja-m14-7-1-cloze-tabete",
      "たべ",
      "ください。",
      "て",
      ["て", "って", "んで", "いて"],
      "Please eat. (たべる → たべて, Group 2)",
      "たべてください。",
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
      ["べんきょう", "して", "ください", "きて", "いって"],
      ["べんきょう", "して", "ください"],
    ),
    // ── Irregular: くる ──
    build(
      "ja-m14-7-1-build-kite-kudasai",
      "Say: Please come here.",
      "ここに きてください",
      ["ここ", "に", "きて", "ください", "いって", "して"],
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
      id: "ja-m14-7-1-lb-tetsudatte",
      target: "てつだってください",
      tiles: ["てつだって", "ください", "おしえて", "して", "きて", "いって"],
      correctOrder: ["てつだって", "ください"],
      promptEn: "Hear it, build it: 'Please help.'",
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
      promptEn: "Please wait a moment.",
      acceptedAnswers: [
        "ちょっと まってください",
        "ちょっと まってください。",
        "ちょっとまってください",
      ],
      audioText: "ちょっと まってください",
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
      "にほんごで はなしてください",
      "Please speak in Japanese.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m14-7-1-rev-mcq-1", M14_7_1_REVIEW[0], M14_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m14-7-1-rev-lc-1",
      audioText: M14_7_1_REVIEW[1].kana,
      correctMeaningEn: M14_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_7_1_REVIEW[2].meaningEn,
        M14_7_1_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[12].meaningEn,
      ],
    }),
    speaking("ja-m14-7-1-rev-speak-1", M14_7_1_REVIEW[2].kana, M14_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m14-7-1-rev", M14_7_1_REVIEW),
    infoStep(
      "ja-m14-7-1-info-end",
      "You can conjugate any verb to て-form on demand",
      "Group 2, Group 1 (all patterns), irregulars, and the いく exception — interleaved and drilled. て-form mastery is real.",
      "win",
    ),
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
    infoStep(
      "ja-m14-7-2-info-open",
      "Production time",
      "No more multiple choice. Translate and speak full て-form requests from English — the hardest test of all.",
    ),
    // ── Translation chain ──
    translateStep({
      id: "ja-m14-7-2-translate-1",
      promptEn: "Please eat.",
      acceptedAnswers: [
        "たべてください",
        "たべてください。",
      ],
      audioText: "たべてください",
    }),
    speaking(
      "ja-m14-7-2-speak-tabete",
      "たべてください",
      "Please eat.",
    ),
    translateStep({
      id: "ja-m14-7-2-translate-2",
      promptEn: "Please wait.",
      acceptedAnswers: [
        "まってください",
        "まってください。",
        "ちょっと まってください",
        "ちょっと まってください。",
      ],
      audioText: "まってください",
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
      promptEn: "Please write your name.",
      acceptedAnswers: [
        "なまえを かいてください",
        "なまえを かいてください。",
        "なまえをかいてください",
      ],
      audioText: "なまえを かいてください",
    }),
    speaking(
      "ja-m14-7-2-speak-kaite",
      "なまえを かいてください",
      "Please write your name.",
    ),
    build(
      "ja-m14-7-2-build-itte",
      "Say: Please go to the station.",
      "えきに いってください",
      ["えき", "に", "いって", "ください", "いいて", "かえって"],
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
      promptEn: "Please come tomorrow.",
      acceptedAnswers: [
        "あした きてください",
        "あした きてください。",
        "あしたきてください",
      ],
      audioText: "あした きてください",
    }),
    speaking(
      "ja-m14-7-2-speak-kite",
      "あした きてください",
      "Please come tomorrow.",
    ),
    listeningBuildSentence({
      id: "ja-m14-7-2-lb-shite",
      target: "べんきょうしてください",
      tiles: ["べんきょう", "して", "ください", "きて", "まって", "いって"],
      correctOrder: ["べんきょう", "して", "ください"],
      promptEn: "Hear it, build it: 'Please study.'",
    }),
    selfExplain({
      id: "ja-m14-7-2-self-explain",
      anchorLabel: "You translated 5 different てください requests from English",
      anchorAudioText: "はなしてください",
      question: "What is the most reliable way to determine a verb's て-form?",
      rule: { text: "Step 1: identify the verb group (1/2/irregular). Step 2: for Group 1, check the final kana of dictionary form. Step 3: apply the matching pattern (って/んで/いて/いで/して). Check for いく exception." },
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
      audioText: M14_7_2_REVIEW[1].kana,
      correctMeaningEn: M14_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M14_7_2_REVIEW[2].meaningEn,
        M14_7_2_REVIEW[3].meaningEn,
        M14_REVIEW_POOL[13].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m14-7-2-rev", M14_7_2_REVIEW),
    infoStep(
      "ja-m14-7-2-info-end",
      "You can produce て-form requests from scratch in any situation",
      "Free-recall translation, speaking, building — you've proven you can conjugate and request without any prompts. Module 14 complete.",
      "win",
    ),
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
