/**
 * M7 — Verbs + ます + を (Sub-lesson split 2026-05-24).
 *
 * Each original lesson (M7-1 through M7-8) is split into 2 sub-lessons of
 * ~18 steps each. M7-9 (mastery test) is deleted.
 *
 * All vocab/phrase introductions replaced with build() calls where the
 * learner assembles the word from tiles — figuroutable from context.
 *
 * Module teaches: dictionary form verbs, ます polite stem, を (direct object).
 * Learner already knows: です, か, は, の, これ/それ/あれ/どれ, に, で, が,
 * あります/います, numbers, ください, common nouns.
 *
 * 16-lesson ID list: ja-m7-1-1 through ja-m7-8-2.
 *
 * Lesson list (16 sub-lessons):
 *   M7-1-1  Verbs vocab — dictionary form (first 3 verbs)
 *   M7-1-2  Verbs vocab — dictionary form (last 3 verbs + retrieval)
 *   M7-2-1  Dictionary ↔ ます stem (Grammar Rule + verb-class MCQ)
 *   M7-2-2  Dictionary ↔ ます stem (match + production)
 *   M7-3-1  を (Grammar Rule + initial drills)
 *   M7-3-2  を (answer-rotating drills + production)
 *   M7-4-1  Food + drink vocab (first 3 items)
 *   M7-4-2  Food + drink vocab (last 3 items + production)
 *   M7-5-1  Drill — を rotated with に/で/が (first half)
 *   M7-5-2  Drill — を rotated with に/で/が (second half + selfExplain)
 *   M7-6-1  Compound sentences (first half)
 *   M7-6-2  Compound sentences (second half + selfExplain)
 *   M7-7-1  Production (translate + build, first half)
 *   M7-7-2  Production (listening_build + speaking, second half)
 *   M7-8-1  Mini-dialogue — ramen shop (warm-up + dialogue)
 *   M7-8-2  Mini-dialogue — post-dialogue drills + review
 */
import type {
  LessonContent,
  MatchPairsStep,
} from "@/features/lesson/types";
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
  vocabMcq,
  assertNoSameAnswerCluster,
  assertAnswerRotation,
  assertNoConsecutiveSame,
} from "@/features/languages/ja/grammarHelpers";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  assertPassiveCardsHaveFollowup,
} from "@/features/lesson/data/_stepAssertions";

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// Per-sub-lesson review-atom draws. Pool covers M1-M6 (M7 itself excluded
// — can't review the module being authored). Each sub-lesson gets a
// distinct seed so re-mounts get stable but different subsets.
// ───────────────────────────────────────────────────────────────────────
// withoutMcqBlocked: drops audit-deferred kana (image-MCQ-unsafe per
// docs/emoji-blocked-words-2026-05-18.md) from MCQ pools.
const M7_REVIEW_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule !== "m7"),
);
const M7_REVIEW_M1 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1"),
);
const M7_REVIEW_M3 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m3"),
);
const M7_REVIEW_M4 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m4"),
);
const M7_REVIEW_M5 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m5"),
);
const M7_REVIEW_M6 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m6"),
);
// Image-MCQ-safe sub-pools: emoji-only entries for vocabMcq targets/
// distractors. M5 contains no-emoji counters like ふたつ/みっつ; visual
// sub-pools strip those. (Coordinator 2026-05-18: re-ordered M7_REVIEW_M6
// before its _VISUAL derivation to fix TDZ.)
const M7_REVIEW_M5_VISUAL = M7_REVIEW_M5.filter((a) => Boolean(a.emoji));
const M7_REVIEW_M4_VISUAL = M7_REVIEW_M4.filter((a) => Boolean(a.emoji));
const M7_REVIEW_M6_VISUAL = M7_REVIEW_M6.filter((a) => Boolean(a.emoji));
const M7_REVIEW_POOL_VISUAL = M7_REVIEW_POOL.filter((a) => Boolean(a.emoji));

// ═══════════════════════════════════════════════════════════════════════
// M7-1-1 — Verbs vocab: dictionary form (first 3 verbs)
// ═══════════════════════════════════════════════════════════════════════

const M7_1_1_REVIEW = pickReviewAtoms("ja-m7-1-1-rev", M7_REVIEW_M3.filter((a) => Boolean(a.emoji)), 4);

export const M7_1_1: LessonContent = {
  id: "ja-m7-1-1",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Verbs — dictionary form (part 1)",
  description:
    "Three high-frequency verbs in their dictionary (citation) form: eat, drink, go.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m7-1-1-info-open",
      "The citation form",
      "Every Japanese verb has a dictionary form — the form you'd look up in a dictionary. It always ends in an -u sound (たべる, のむ, いく). This is what friends use and what writers write. Memorize it first; the polite ます-form comes next lesson.",
      "grammar",
    ),
    // ── たべる: single-tile build — the prompt "to eat" + the -u ending pattern
    // makes it figuroutable among the distractors. ──
    build(
      "ja-m7-1-1-build-taberu",
      "Pick the verb meaning 'to eat' (dictionary form)",
      "たべる",
      ["たべる", "のむ", "いく"],
      ["たべる"],
    ),
    speaking("ja-m7-1-1-say-taberu", "たべる", "to eat"),
    listeningCompSentence({
      id: "ja-m7-1-1-lc-taberu",
      audioText: "たべる",
      correctMeaningEn: "to eat",
      distractorsEn: ["to drink", "to go", "to read"],
    }),
    // ── のむ: single-tile build — "to drink" is unambiguous vs the other tiles. ──
    build(
      "ja-m7-1-1-build-nomu",
      "Pick the verb meaning 'to drink' (dictionary form)",
      "のむ",
      ["のむ", "たべる", "かく"],
      ["のむ"],
    ),
    listeningCompSentence({
      id: "ja-m7-1-1-lc-nomu",
      audioText: "のむ",
      correctMeaningEn: "to drink",
      distractorsEn: ["to eat", "to read", "to go"],
    }),
    speaking("ja-m7-1-1-say-nomu", "のむ", "to drink"),
    // ── いく: single-tile build — "to go" unambiguous. ──
    build(
      "ja-m7-1-1-build-iku",
      "Pick the verb meaning 'to go' (dictionary form)",
      "いく",
      ["いく", "たべる", "のむ"],
      ["いく"],
    ),
    sentenceMcq({
      id: "ja-m7-1-1-mcq-iku",
      prompt: "Which is the dictionary form of 'to go'?",
      correctKana: "いく",
      distractorsKana: ["いきます", "たべる", "のむ"],
      explanation:
        "いく = dictionary form of 'go'. いきます is its polite ます-form (next lesson). たべる = eat, のむ = drink.",
    }),
    // Review tap on a prior-module atom (M6 place — natural pair with いく).
    vocabMcq("ja-m7-1-1-rev-mcq-place", M7_REVIEW_M6_VISUAL[0], M7_REVIEW_M6),
    // sentenceMcq break — pattern discrimination on the -u ending shape.
    sentenceMcq({
      id: "ja-m7-1-1-mcq-pattern",
      prompt: "Which one is a verb (dictionary form)?",
      correctKana: "のむ",
      distractorsKana: ["ほん", "がくせい", "アメリカ"],
      explanation:
        "Dictionary-form verbs end in an -u sound (む, る, く, ぐ, す…). The other three are nouns.",
    }),
    // Retrieval MCQ on たべる — keeps the atom above 3-occurrence floor.
    sentenceMcq({
      id: "ja-m7-1-1-mcq-taberu",
      prompt: "Which means 'to eat' (dictionary form)?",
      correctKana: "たべる",
      distractorsKana: ["のむ", "いく", "みる"],
      explanation:
        "たべる = to eat. のむ = drink, いく = go, みる = see/watch.",
    }),
    speaking("ja-m7-1-1-say-iku", "いく", "to go"),
    // ── Review tail (M3 anchors) ──
    speaking("ja-m7-1-1-rev-speak-m3-1", M7_1_1_REVIEW[0].kana, M7_1_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-1-1-rev-lc-m3",
      audioText: M7_1_1_REVIEW[1].kana,
      correctMeaningEn: M7_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_1_1_REVIEW[2].meaningEn,
        M7_1_1_REVIEW[3].meaningEn,
        M7_REVIEW_M1[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-1-1-rev-mcq-m3-2", M7_1_1_REVIEW[2], M7_REVIEW_M3),
    reviewMatchPairs("ja-m7-1-1-rev", M7_1_1_REVIEW),
    infoStep(
      "ja-m7-1-1-info-end",
      "You can now name three actions in dictionary form",
      "たべる (eat), のむ (drink), いく (go) — the citation forms you'd look up in a dictionary. Three more coming next.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_1_1.steps);
assertNoConsecutiveSame(M7_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-1-2 — Verbs vocab: dictionary form (last 3 verbs + retrieval)
// ═══════════════════════════════════════════════════════════════════════

const M7_1_2_REVIEW = pickReviewAtoms("ja-m7-1-2-rev", M7_REVIEW_M4_VISUAL, 4);

export const M7_1_2: LessonContent = {
  id: "ja-m7-1-2",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Verbs — dictionary form (part 2)",
  description:
    "Three more dictionary-form verbs: see/watch, read, write. Then full 6-verb retrieval.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    // ── みる: single-tile build — "to see/watch" unambiguous vs other verbs. ──
    build(
      "ja-m7-1-2-build-miru",
      "Pick the verb meaning 'to see / watch' (dictionary form)",
      "みる",
      ["みる", "よむ", "かく"],
      ["みる"],
    ),
    listeningCompSentence({
      id: "ja-m7-1-2-lc-miru",
      audioText: "みる",
      correctMeaningEn: "to see / watch",
      distractorsEn: ["to go", "to drink", "to write"],
    }),
    speaking("ja-m7-1-2-say-miru", "みる", "to see / watch"),
    // ── よむ: single-tile build — "to read" unambiguous. ──
    build(
      "ja-m7-1-2-build-yomu",
      "Pick the verb meaning 'to read' (dictionary form)",
      "よむ",
      ["よむ", "みる", "のむ"],
      ["よむ"],
    ),
    listeningCompSentence({
      id: "ja-m7-1-2-lc-yomu",
      audioText: "よむ",
      correctMeaningEn: "to read",
      distractorsEn: ["to write", "to watch", "to eat"],
    }),
    // ── かく: single-tile build — "to write" unambiguous. ──
    build(
      "ja-m7-1-2-build-kaku",
      "Pick the verb meaning 'to write' (dictionary form)",
      "かく",
      ["かく", "よむ", "いく"],
      ["かく"],
    ),
    sentenceMcq({
      id: "ja-m7-1-2-mcq-kaku",
      prompt: "Which means 'to write'?",
      correctKana: "かく",
      distractorsKana: ["みる", "よむ", "いく"],
      explanation:
        "かく = write. All four are dictionary-form verbs with the -u ending.",
    }),
    speaking("ja-m7-1-2-say-yomu", "よむ", "to read"),
    // ── Full 6-verb retrieval ──
    sentenceMcq({
      id: "ja-m7-1-2-mcq-all-eat",
      prompt: "Which one means 'to eat' (dictionary form)?",
      correctKana: "たべる",
      distractorsKana: ["のむ", "よむ", "かく"],
      explanation:
        "たべる = to eat. のむ = drink, よむ = read, かく = write — all dictionary form.",
    }),
    sentenceMcq({
      id: "ja-m7-1-2-mcq-all-drink",
      prompt: "Which one means 'to drink'?",
      correctKana: "のむ",
      distractorsKana: ["たべる", "みる", "いく"],
      explanation:
        "のむ = to drink. All four are dictionary-form verbs.",
    }),
    listeningCompSentence({
      id: "ja-m7-1-2-lc-kaku",
      audioText: "かく",
      correctMeaningEn: "to write",
      distractorsEn: ["to read", "to go", "to eat"],
    }),
    // Match all 6 verbs — the high-leverage retrieval exercise.
    {
      id: "ja-m7-1-2-match-verbs",
      type: "match_pairs",
      prompt: "Match each verb to its English meaning",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "たべる", target: "to eat", sourceAnnotation: [{ surface: "たべる", reading: "たべる" }] },
        { id: "p2", source: "のむ",   target: "to drink", sourceAnnotation: [{ surface: "のむ", reading: "のむ" }] },
        { id: "p3", source: "いく",   target: "to go", sourceAnnotation: [{ surface: "いく", reading: "いく" }] },
        { id: "p4", source: "みる",   target: "to see / watch", sourceAnnotation: [{ surface: "みる", reading: "みる" }] },
        { id: "p5", source: "よむ",   target: "to read", sourceAnnotation: [{ surface: "よむ", reading: "よむ" }] },
        { id: "p6", source: "かく",   target: "to write", sourceAnnotation: [{ surface: "かく", reading: "かく" }] },
      ],
    } as MatchPairsStep,
    speaking("ja-m7-1-2-say-kaku", "かく", "to write"),
    // ── Review tail (M4 anchors) ──
    speaking("ja-m7-1-2-rev-speak-m4-1", M7_1_2_REVIEW[0].kana, M7_1_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-1-2-rev-lc-m4",
      audioText: M7_1_2_REVIEW[1].kana,
      correctMeaningEn: M7_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_1_2_REVIEW[2].meaningEn,
        M7_1_2_REVIEW[3].meaningEn,
        M7_REVIEW_M3[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-1-2-rev-mcq-m4-2", M7_1_2_REVIEW[2], M7_REVIEW_M4),
    reviewMatchPairs("ja-m7-1-2-rev", M7_1_2_REVIEW),
    infoStep(
      "ja-m7-1-2-info-end",
      "You can now name six actions in dictionary form",
      "Eat, drink, go, watch, read, write — all six dictionary-form verbs retrieval-checked. Next: the rule that turns each one into its polite ます-form.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_1_2.steps);
assertNoConsecutiveSame(M7_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-2-1 — Dictionary ↔ ます stem (Grammar Rule + verb-class MCQ)
// ═══════════════════════════════════════════════════════════════════════

const RULE_DICT_MASU = grammarRule({
  id: "ja-m7-2-1-rule-dict-masu",
  title: "Dictionary form ↔ polite ます stem",
  rule:
    "Every Japanese verb has two faces: the dictionary form (たべる, のむ, いく) and the polite ます-form (たべます, のみます, いきます). The polite form is what you use with strangers, shop staff, teachers, and at work. -る verbs (たべる, みる) drop -る and add -ます. -u verbs (のむ, よむ, かく, いく) change the final -u to -i + ます (のむ→のみます, かく→かきます).",
  examples: [
    {
      ja: "わたしは すしを たべます。",
      romaji: "watashi wa sushi wo tabemasu.",
      en: "I eat sushi. (polite)",
    },
    {
      ja: "コーヒーを のみます。",
      romaji: "koohii wo nomimasu.",
      en: "I drink coffee. (polite)",
    },
  ],
  antiPattern: {
    ja: "わたしは すしを たべる です。",
    romaji: "watashi wa sushi wo taberu desu.",
    en: "(broken — dictionary form does NOT take です)",
    why: "Dictionary form is already a full verb. Adding です creates a double-verb error. Use either たべる (casual standalone) or たべます (polite standalone) — never both.",
  },
  cultureNote:
    "Tae Kim's framing: the dictionary form is the authentic verb; ます is a polite suffix layered on top. Default to ます-form as a traveler — it's never wrong with strangers.",
});

const M7_2_1_REVIEW = pickReviewAtoms("ja-m7-2-1-rev", M7_REVIEW_M4_VISUAL, 4);

export const M7_2_1: LessonContent = {
  id: "ja-m7-2-1",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Dictionary form ↔ ます stem (part 1)",
  description:
    "The grammar rule that converts dictionary form to polite form. Classify verb types first.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m7-2-1-info-open",
      "Two forms, one verb",
      "Friends use dictionary form. Strangers, shopkeepers, and teachers get the polite ます-form. Same verb, two registers.",
    ),
    RULE_DICT_MASU,
    // ── Transitional verb-class MCQ — smooths the cliff into match_pairs.
    sentenceMcq({
      id: "ja-m7-2-1-mcq-ru-class",
      prompt: "Which one is a -る verb (the kind that drops -る)?",
      correctKana: "たべる",
      distractorsKana: ["のむ", "かく", "いく"],
      explanation:
        "-る verbs end in -eru / -iru. たべる (taberu) ends -eru → drop -る → add -ます = たべます. The others end in -u and follow the -u → -i + ます pattern.",
    }),
    sentenceMcq({
      id: "ja-m7-2-1-mcq-u-class",
      prompt: "Which one is a -u verb (changes -u to -i + ます)?",
      correctKana: "かく",
      distractorsKana: ["たべる", "みる", "おきる"],
      explanation:
        "かく ends in -ku → -ki + ます = かきます. たべる, みる, おきる are -る verbs (drop -る instead).",
    }),
    listeningCompSentence({
      id: "ja-m7-2-1-lc-nomu-class",
      audioText: "のむ",
      correctMeaningEn: "to drink (dictionary form, -u verb)",
      distractorsEn: [
        "to drink (polite form)",
        "to eat (dictionary form)",
        "to read (polite form)",
      ],
    }),
    // ── Dictionary ↔ ます match (the high-leverage mapping). ──
    {
      id: "ja-m7-2-1-match-dict-masu",
      type: "match_pairs",
      prompt: "Match each dictionary form to its ます-form",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "たべる", target: "たべます", sourceAnnotation: [{ surface: "たべる", reading: "たべる" }] },
        { id: "p2", source: "のむ",   target: "のみます", sourceAnnotation: [{ surface: "のむ", reading: "のむ" }] },
        { id: "p3", source: "いく",   target: "いきます", sourceAnnotation: [{ surface: "いく", reading: "いく" }] },
        { id: "p4", source: "みる",   target: "みます",   sourceAnnotation: [{ surface: "みる", reading: "みる" }] },
        { id: "p5", source: "よむ",   target: "よみます", sourceAnnotation: [{ surface: "よむ", reading: "よむ" }] },
        { id: "p6", source: "かく",   target: "かきます", sourceAnnotation: [{ surface: "かく", reading: "かく" }] },
      ],
    } as MatchPairsStep,
    // sentenceMcq — pick the correct ます-form.
    sentenceMcq({
      id: "ja-m7-2-1-mcq-miru-masu",
      prompt: "What is the polite form of みる (to watch)?",
      correctKana: "みます",
      distractorsKana: ["みるます", "みります", "みまする"],
      explanation:
        "みる is a -る verb: drop -る → み, add -ます → みます.",
    }),
    sentenceMcq({
      id: "ja-m7-2-1-mcq-yomu-masu",
      prompt: "What is the polite form of よむ (to read)?",
      correctKana: "よみます",
      distractorsKana: ["よむます", "よります", "よまます"],
      explanation:
        "よむ is a -u verb: む → み + ます = よみます.",
    }),
    // Build a polite verb — learner picks the correct ます-form.
    build(
      "ja-m7-2-1-build-tabemasu",
      "Pick the polite form of たべる (to eat)",
      "たべます",
      ["たべます", "たべるます", "のみます"],
      ["たべます"],
    ),
    build(
      "ja-m7-2-1-build-nomimasu",
      "Pick the polite form of のむ (to drink)",
      "のみます",
      ["のみます", "のむます", "たべます"],
      ["のみます"],
    ),
    speaking("ja-m7-2-1-speak-tabemasu", "たべます", "to eat (polite)"),
    // Self-explanation — why たべる becomes たべます.
    selfExplain({
      id: "ja-m7-2-1-self-masu-1",
      anchorLabel: "You matched たべる → たべます",
      anchorAudioText: "たべる、たべます",
      question: "Why does たべる become たべます (not たべるます)?",
      rule: {
        text: "-る verbs drop -る and add -ます; -u verbs change -u to -i + -ます.",
      },
      surface: { text: "all verbs add -ます to the end" },
      distractor: { text: "ます means 'I do' on its own" },
      ruleExplanation:
        "たべる is a -る verb: drop -る → たべ, add -ます → たべます. のむ is a -u verb: -u → -i, add -ます → のみます. The pattern is mechanical once you spot the verb type.",
    }),
    // ── Review tail (M4 anchors) ──
    speaking("ja-m7-2-1-rev-speak-m4", M7_2_1_REVIEW[0].kana, M7_2_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-2-1-rev-lc-m3",
      audioText: M7_REVIEW_M3[0].kana,
      correctMeaningEn: M7_REVIEW_M3[0].meaningEn,
      distractorsEn: [
        M7_REVIEW_M3[1].meaningEn,
        M7_REVIEW_M3[2].meaningEn,
        M7_REVIEW_M3[3].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-2-1-rev-mcq-m4-2", M7_2_1_REVIEW[1], M7_REVIEW_M4),
    reviewMatchPairs("ja-m7-2-1-rev", M7_2_1_REVIEW),
    infoStep(
      "ja-m7-2-1-info-end",
      "You can now classify verbs and convert to polite form",
      "-る verbs drop -る, -u verbs change -u to -i, then add ます. Next: use ます-form in full sentences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_2_1.steps);
assertNoConsecutiveSame(M7_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-2-2 — Dictionary ↔ ます stem (sentences + production)
// ═══════════════════════════════════════════════════════════════════════

const M7_2_2_REVIEW = pickReviewAtoms("ja-m7-2-2-rev", M7_REVIEW_M6_VISUAL, 4);

export const M7_2_2: LessonContent = {
  id: "ja-m7-2-2",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Dictionary form ↔ ます stem (part 2)",
  description:
    "Full polite-form sentences. Build sentences using ます-form verbs with を.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    // ── ます-form in sentences: build calls where only the verb is new. ──
    // "I eat sushi" — learner knows すし and を from context; only たべます is the new form.
    build(
      "ja-m7-2-2-build-sushi",
      "I eat sushi. (polite)",
      "すしを たべます",
      ["すし", "を", "たべます", "のみます", "は"],
      ["すし", "を", "たべます"],
    ),
    listeningCompSentence({
      id: "ja-m7-2-2-lc-mizu",
      audioText: "みずを のみます",
      correctMeaningEn: "I drink water.",
      distractorsEn: [
        "I eat water.",
        "I drink coffee.",
        "I read a book.",
      ],
    }),
    // "I read a book" — ほん known from prior modules; よみます is new form.
    build(
      "ja-m7-2-2-build-hon",
      "I read a book. (polite)",
      "ほんを よみます",
      ["ほん", "を", "よみます", "かきます", "に"],
      ["ほん", "を", "よみます"],
    ),
    build(
      "ja-m7-2-2-build-iku",
      "I go to the park. (polite)",
      "こうえんに いきます",
      ["こうえん", "に", "いきます", "たべます", "で"],
      ["こうえん", "に", "いきます"],
    ),
    speaking(
      "ja-m7-2-2-speak-tabe",
      "すしを たべます",
      "I eat sushi.",
    ),
    sentenceMcq({
      id: "ja-m7-2-2-mcq-polite",
      prompt: "Which sentence is the polite form of 'I eat ramen.'?",
      correctKana: "ラーメンを たべます。",
      distractorsKana: [
        "ラーメンを たべる。",
        "ラーメンを たべる で。",
        "ラーメンが たべます。",
      ],
      explanation:
        "Polite form ends in -ます. たべる is the casual dictionary form; pairing it with です/で is the double-verb error from the rule card.",
    }),
    // Build: I write my name (polite) — なまえ known, かきます new ます-form.
    build(
      "ja-m7-2-2-build-namae",
      "I write [my] name. (polite)",
      "なまえを かきます",
      ["なまえ", "を", "かきます", "よみます", "は"],
      ["なまえ", "を", "かきます"],
    ),
    listeningCompSentence({
      id: "ja-m7-2-2-lc-hon-yomi",
      audioText: "ほんを よみます",
      correctMeaningEn: "I read a book.",
      distractorsEn: [
        "I write a book.",
        "I eat a book.",
        "I see a book.",
      ],
    }),
    sentenceMcq({
      id: "ja-m7-2-2-mcq-kaki",
      prompt: "Which sentence means 'I write a letter.'?",
      correctKana: "てがみを かきます。",
      distractorsKana: [
        "てがみを よみます。",
        "てがみを のみます。",
        "てがみに かきます。",
      ],
      explanation:
        "かきます = write (polite). を marks the direct object (the letter being written).",
    }),
    speaking("ja-m7-2-2-speak-yomu", "ほんを よみます", "I read a book."),
    // Build a longer sentence — topic + object + verb.
    build(
      "ja-m7-2-2-build-watashi",
      "I eat sushi. (with topic)",
      "わたしは すしを たべます",
      ["わたし", "は", "すし", "を", "たべます", "のみます"],
      ["わたし", "は", "すし", "を", "たべます"],
    ),
    listeningBuildSentence({
      id: "ja-m7-2-2-lb-kouen",
      target: "こうえんに いきます",
      tiles: ["こうえん", "に", "いきます", "たべます", "で"],
      correctOrder: ["こうえん", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to the park.'",
    }),
    speaking("ja-m7-2-2-speak-kaki", "なまえを かきます", "I write my name."),
    // ── Review tail (M6 atoms) ──
    speaking("ja-m7-2-2-rev-speak-m6", M7_2_2_REVIEW[0].kana, M7_2_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-2-2-rev-lc-m6",
      audioText: M7_2_2_REVIEW[1].kana,
      correctMeaningEn: M7_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_2_2_REVIEW[2].meaningEn,
        M7_2_2_REVIEW[3].meaningEn,
        M7_REVIEW_M3[1].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-2-2-rev-mcq-m6-2", M7_2_2_REVIEW[2], M7_REVIEW_M6),
    reviewMatchPairs("ja-m7-2-2-rev", M7_2_2_REVIEW),
    infoStep(
      "ja-m7-2-2-info-end",
      "You can now build polite-form sentences with any verb",
      "すしを たべます, ほんを よみます, こうえんに いきます — ます-form verbs in real sentences. The を particle showed up multiple times — that's the next card.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_2_2.steps);
assertNoConsecutiveSame(M7_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-3-1 — を (Grammar Rule + initial drills)
// ═══════════════════════════════════════════════════════════════════════

const RULE_WO = grammarRule({
  id: "ja-m7-3-1-rule-wo",
  title: "を — the direct-object particle",
  rule:
    "を marks the thing being acted on by a transitive verb. すしを たべます = 'eat sushi.' みずを のみます = 'drink water.' ほんを よみます = 'read a book.' The verb does something TO the を-marked noun.",
  examples: [
    {
      ja: "すしを たべます。",
      romaji: "sushi wo tabemasu.",
      en: "I eat sushi.",
    },
    {
      ja: "コーヒーを のみます。",
      romaji: "koohii wo nomimasu.",
      en: "I drink coffee.",
    },
  ],
  antiPattern: {
    ja: "すしは たべます。",
    romaji: "sushi wa tabemasu.",
    en: "(odd — 'as for sushi, [someone] eats it.' Grammatical but unusual for a beginner.)",
    why: "は marks the topic, not the direct object. 'I eat sushi' standardly is わたしは すしを たべます — topic = me, direct object = sushi. Swapping は for を misframes the sentence.",
  },
  cultureNote:
    "を is written like the kana for 'wo' but pronounced 'o' (same as お). It only appears as a particle — never inside a word.",
});

const M7_3_1_REVIEW = pickReviewAtoms("ja-m7-3-1-rev", M7_REVIEW_M1.filter((a) => Boolean(a.emoji)), 4);

export const M7_3_1: LessonContent = {
  id: "ja-m7-3-1",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "を — the direct-object particle (part 1)",
  description:
    "What's being acted on. Eat WHAT, drink WHAT, read WHAT — that WHAT takes を. Grammar rule + initial drills.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m7-3-1-info-open",
      "The action-target",
      "Every transitive verb (eat, drink, read, watch, write) takes a direct object. In Japanese, that object gets marked by を.",
      "grammar",
    ),
    RULE_WO,
    // ── Rotating-answer cloze block: を → に → を → は ──
    cloze(
      "ja-m7-3-1-cloze-1",
      "すし",
      " たべます。",
      "を",
      ["を", "は", "が", "に"],
      "I eat sushi.",
      "すしを たべます。",
      "すし is the thing being eaten — を.",
    ),
    sentenceMcq({
      id: "ja-m7-3-1-mcq-wo-coffee",
      prompt: "Which sentence means 'I drink coffee.'?",
      correctKana: "コーヒーを のみます。",
      distractorsKana: [
        "コーヒーは のみます。",
        "コーヒーに のみます。",
        "コーヒーで のみます。",
      ],
      explanation:
        "Direct object → を. は = topic; に = destination; で = setting/means.",
    }),
    // Switch correct to に (M6 review — destination).
    cloze(
      "ja-m7-3-1-cloze-2",
      "こうえん",
      " いきます。",
      "に",
      ["を", "に", "で", "は"],
      "I go to the park. (M6 reminder)",
      "こうえんに いきます。",
      "Destination → に. を would be wrong — you don't 'eat' the park.",
    ),
    listeningCompSentence({
      id: "ja-m7-3-1-lc-hon",
      audioText: "ほんを よみます",
      correctMeaningEn: "I read a book.",
      distractorsEn: [
        "I write a book.",
        "I eat a book.",
        "I see a book.",
      ],
    }),
    // Back to を.
    cloze(
      "ja-m7-3-1-cloze-3",
      "みず",
      " のみます。",
      "を",
      ["を", "は", "が", "に"],
      "I drink water.",
      "みずを のみます。",
    ),
    // Switch to は (topic — the canonical anti-pattern).
    cloze(
      "ja-m7-3-1-cloze-4",
      "わたし",
      " すしを たべます。",
      "は",
      ["を", "は", "が", "に"],
      "I eat sushi. (topic-marked subject)",
      "わたしは すしを たべます。",
      "わたし = topic → は. The sushi (the direct object) takes を separately.",
    ),
    sentenceMcq({
      id: "ja-m7-3-1-mcq-mizu",
      prompt: "Which particle marks the thing being drunk in 'I drink water'?",
      correctKana: "を",
      distractorsKana: ["は", "に", "で"],
      explanation:
        "みず (water) is the direct object of のむ — を marks it.",
    }),
    build(
      "ja-m7-3-1-build-hon",
      "I read a book.",
      "ほんを よみます",
      ["ほん", "を", "よみます", "かきます", "は"],
      ["ほん", "を", "よみます"],
    ),
    speaking("ja-m7-3-1-speak-sushi", "すしを たべます", "I eat sushi."),
    // Self-explanation: WHY を on a transitive verb.
    selfExplain({
      id: "ja-m7-3-1-self-wo-1",
      anchorLabel: "You picked を in: すし＿ たべます",
      anchorAudioText: "すしを たべます",
      question: "Why is を correct here (and not に or は)?",
      rule: {
        text: "を marks the thing the verb acts on (sushi is being eaten).",
      },
      surface: { text: "を always comes after a food word" },
      distractor: { text: "を introduces the answer to a wh-question" },
      ruleExplanation:
        "を is the direct-object particle — it tags the noun the verb acts on. に would mark a destination (you don't eat a place); は would shift the topic ('as for sushi…').",
    }),
    // ── Review tail (M1 atoms) ──
    speaking("ja-m7-3-1-rev-speak-m1", M7_3_1_REVIEW[0].kana, M7_3_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-3-1-rev-lc-m1",
      audioText: M7_3_1_REVIEW[1].kana,
      correctMeaningEn: M7_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_3_1_REVIEW[2].meaningEn,
        M7_3_1_REVIEW[3].meaningEn,
        M7_REVIEW_M3[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-3-1-rev-mcq-m1-2", M7_3_1_REVIEW[2], M7_REVIEW_M1),
    reviewMatchPairs("ja-m7-3-1-rev", M7_3_1_REVIEW),
    infoStep(
      "ja-m7-3-1-info-end",
      "You can now mark direct objects with を",
      "Sushi, water, books — the thing the verb acts on takes を. Next: more drills with answer rotation across を, に, で, は.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_3_1.steps);
assertAnswerRotation(M7_3_1.steps, 3);
assertNoConsecutiveSame(M7_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-3-2 — を (answer-rotating drills + production)
// ═══════════════════════════════════════════════════════════════════════

const M7_3_2_REVIEW = pickReviewAtoms("ja-m7-3-2-rev", M7_REVIEW_M5_VISUAL, 4);

export const M7_3_2: LessonContent = {
  id: "ja-m7-3-2",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "を — rotating drills (part 2)",
  description:
    "Answers rotate across を/に/で/は so you can't pattern-match. Production build at the end.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    // ── Rotating: で → を → に → を → で → を ──
    cloze(
      "ja-m7-3-2-cloze-1",
      "じてんしゃ",
      " いきます。",
      "で",
      ["を", "に", "で", "は"],
      "I go by bicycle. (M6 reminder)",
      "じてんしゃで いきます。",
      "じてんしゃ = means → で.",
    ),
    cloze(
      "ja-m7-3-2-cloze-2",
      "ほん",
      " よみます。",
      "を",
      ["を", "は", "が", "の"],
      "I read a book.",
      "ほんを よみます。",
    ),
    sentenceMcq({
      id: "ja-m7-3-2-mcq-park",
      prompt: "Which particle fills the blank: こうえん＿ いきます (I go to the park)?",
      correctKana: "に",
      distractorsKana: ["を", "で", "は"],
      explanation:
        "Destination → に. The park is where you're headed.",
    }),
    cloze(
      "ja-m7-3-2-cloze-3",
      "なまえ",
      " かきます。",
      "を",
      ["を", "は", "が", "に"],
      "I write my name.",
      "なまえを かきます。",
      "なまえ is the thing being written → を.",
    ),
    listeningCompSentence({
      id: "ja-m7-3-2-lc-namae",
      audioText: "なまえを かきます",
      correctMeaningEn: "I write my name.",
      distractorsEn: [
        "I read my name.",
        "I say my name.",
        "I write a book.",
      ],
    }),
    cloze(
      "ja-m7-3-2-cloze-4",
      "うち",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go home.",
      "うちに いきます。",
      "Destination → に.",
    ),
    cloze(
      "ja-m7-3-2-cloze-5",
      "テレビ",
      " みます。",
      "を",
      ["を", "は", "が", "に"],
      "I watch TV.",
      "テレビを みます。",
      "テレビ is what's being watched → を.",
    ),
    sentenceMcq({
      id: "ja-m7-3-2-mcq-bicycle",
      prompt: "Which particle fills the blank: じてんしゃ＿ いきます (I go by bicycle)?",
      correctKana: "で",
      distractorsKana: ["を", "に", "は"],
      explanation:
        "Means of transport → で.",
    }),
    // Production: build sentences.
    build(
      "ja-m7-3-2-build-namae",
      "I write [my] name.",
      "なまえを かきます",
      ["なまえ", "を", "かきます", "よみます", "は"],
      ["なまえ", "を", "かきます"],
    ),
    speaking("ja-m7-3-2-speak-kaku", "なまえを かきます", "I write my name."),
    build(
      "ja-m7-3-2-build-terebi",
      "I watch TV.",
      "テレビを みます",
      ["テレビ", "を", "みます", "のみます", "に"],
      ["テレビ", "を", "みます"],
    ),
    listeningBuildSentence({
      id: "ja-m7-3-2-lb-mizu",
      target: "みずを のみます",
      tiles: ["みず", "を", "のみます", "たべます", "は"],
      correctOrder: ["みず", "を", "のみます"],
      promptEn: "Hear it, build it: 'I drink water.'",
    }),
    speaking("ja-m7-3-2-speak-terebi", "テレビを みます", "I watch TV."),
    // ── Review tail (M5 atoms) ──
    speaking("ja-m7-3-2-rev-speak-m5", M7_3_2_REVIEW[0].kana, M7_3_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-3-2-rev-lc-m5",
      audioText: M7_3_2_REVIEW[1].kana,
      correctMeaningEn: M7_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_3_2_REVIEW[2].meaningEn,
        M7_3_2_REVIEW[3].meaningEn,
        M7_REVIEW_M3[2].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-3-2-rev-mcq-m5-2", M7_3_2_REVIEW[2], M7_REVIEW_M5),
    reviewMatchPairs("ja-m7-3-2-rev", M7_3_2_REVIEW),
    infoStep(
      "ja-m7-3-2-info-end",
      "You can now pick を vs に vs で vs は from meaning alone",
      "Answers rotated across four particles — no pattern-matching shortcut. Next: food and drink vocab to pair with your verbs.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_3_2.steps);
assertAnswerRotation(M7_3_2.steps, 3);
assertNoConsecutiveSame(M7_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-4-1 — Food + drink vocab (first 3 items)
// ═══════════════════════════════════════════════════════════════════════

const M7_4_1_REVIEW = pickReviewAtoms("ja-m7-4-1-rev", M7_REVIEW_M5_VISUAL, 4);

export const M7_4_1: LessonContent = {
  id: "ja-m7-4-1",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Food + drink vocab (part 1)",
  description:
    "Three foods: sushi, ramen, bread. Each introduced via build, then drilled in verb sentences.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m7-4-1-info-open",
      "Things you'll eat",
      "Three foods. Each pairs naturally with たべる + を. Listen for katakana loanwords: ラーメン (ramen), パン (bread, from Portuguese).",
    ),
    // ── すし: single-tile build — "sushi" is obvious from English prompt. ──
    build(
      "ja-m7-4-1-build-sushi",
      "Pick: sushi (food)",
      "すし",
      ["すし", "みず", "ほん"],
      ["すし"],
    ),
    // Drill in a sentence immediately.
    build(
      "ja-m7-4-1-build-sushi-sent",
      "I eat sushi.",
      "すしを たべます",
      ["すし", "を", "たべます", "のみます", "は"],
      ["すし", "を", "たべます"],
    ),
    listeningCompSentence({
      id: "ja-m7-4-1-lc-sushi",
      audioText: "すしを たべます",
      correctMeaningEn: "I eat sushi.",
      distractorsEn: [
        "I drink sushi.",
        "I eat bread.",
        "I eat ramen.",
      ],
    }),
    // ── ラーメン: single-tile build — "ramen" obvious from prompt. ──
    build(
      "ja-m7-4-1-build-ramen",
      "Pick: ramen (food)",
      "ラーメン",
      ["ラーメン", "パン", "すし"],
      ["ラーメン"],
    ),
    build(
      "ja-m7-4-1-build-ramen-sent",
      "I eat ramen.",
      "ラーメンを たべます",
      ["ラーメン", "を", "たべます", "のみます", "は"],
      ["ラーメン", "を", "たべます"],
    ),
    listeningCompSentence({
      id: "ja-m7-4-1-lc-ramen",
      audioText: "ラーメンを たべます",
      correctMeaningEn: "I eat ramen.",
      distractorsEn: [
        "I drink ramen.",
        "I eat bread.",
        "I eat sushi.",
      ],
    }),
    // ── パン: single-tile build — "bread" obvious from prompt. ──
    build(
      "ja-m7-4-1-build-pan",
      "Pick: bread (food, from Portuguese 'pao')",
      "パン",
      ["パン", "ラーメン", "ごはん"],
      ["パン"],
    ),
    build(
      "ja-m7-4-1-build-pan-sent",
      "I eat bread.",
      "パンを たべます",
      ["パン", "を", "たべます", "のみます", "は"],
      ["パン", "を", "たべます"],
    ),
    speaking("ja-m7-4-1-speak-pan", "パンを たべます", "I eat bread."),
    sentenceMcq({
      id: "ja-m7-4-1-mcq-pan",
      prompt: "Which sentence means 'I eat bread.'?",
      correctKana: "パンを たべます。",
      distractorsKana: [
        "パンを のみます。",
        "パンは たべます。",
        "パンに たべます。",
      ],
      explanation:
        "Bread is eaten (たべる), not drunk. Direct object → を.",
    }),
    // Match all 3 foods.
    {
      id: "ja-m7-4-1-match-food",
      type: "match_pairs",
      prompt: "Match each food to its English name",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "すし", target: "sushi", sourceAnnotation: [{ surface: "すし", reading: "すし" }] },
        { id: "p2", source: "ラーメン", target: "ramen", sourceAnnotation: [{ surface: "ラーメン", reading: "ラーメン" }] },
        { id: "p3", source: "パン", target: "bread", sourceAnnotation: [{ surface: "パン", reading: "パン" }] },
      ],
    } as MatchPairsStep,
    speaking("ja-m7-4-1-speak-ramen", "ラーメンを たべます", "I eat ramen."),
    // ── Review tail (M5 atoms) ──
    speaking("ja-m7-4-1-rev-speak-m5", M7_4_1_REVIEW[0].kana, M7_4_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-4-1-rev-lc-m5",
      audioText: M7_4_1_REVIEW[1].kana,
      correctMeaningEn: M7_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_4_1_REVIEW[2].meaningEn,
        M7_4_1_REVIEW[3].meaningEn,
        M7_REVIEW_M6[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-4-1-rev-mcq-m5-2", M7_4_1_REVIEW[2], M7_REVIEW_M5),
    reviewMatchPairs("ja-m7-4-1-rev", M7_4_1_REVIEW),
    infoStep(
      "ja-m7-4-1-info-end",
      "You can now name three foods and order them in sentences",
      "すし, ラーメン, パン — each paired with たべます and を. Three drinks are next.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_4_1.steps);
assertNoConsecutiveSame(M7_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-4-2 — Food + drink vocab (last 3 items: ごはん, ジュース, さけ)
// ═══════════════════════════════════════════════════════════════════════

const M7_4_2_REVIEW = pickReviewAtoms("ja-m7-4-2-rev", M7_REVIEW_M6_VISUAL, 4);

export const M7_4_2: LessonContent = {
  id: "ja-m7-4-2",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Food + drink vocab (part 2)",
  description:
    "Three more: rice/meal, juice, sake. Build into verb sentences. Production at end.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    // ── ごはん: single-tile build — "rice / a meal" obvious from prompt. ──
    build(
      "ja-m7-4-2-build-gohan",
      "Pick: rice / a meal",
      "ごはん",
      ["ごはん", "すし", "さけ"],
      ["ごはん"],
    ),
    build(
      "ja-m7-4-2-build-gohan-sent",
      "I eat a meal.",
      "ごはんを たべます",
      ["ごはん", "を", "たべます", "のみます", "は"],
      ["ごはん", "を", "たべます"],
    ),
    listeningCompSentence({
      id: "ja-m7-4-2-lc-gohan",
      audioText: "ごはんを たべます",
      correctMeaningEn: "I eat a meal.",
      distractorsEn: [
        "I drink a meal.",
        "I eat sushi.",
        "I eat bread.",
      ],
    }),
    // ── ジュース: single-tile build — "juice" is an obvious loanword. ──
    build(
      "ja-m7-4-2-build-juusu",
      "Pick: juice (drink)",
      "ジュース",
      ["ジュース", "コーヒー", "みず"],
      ["ジュース"],
    ),
    sentenceMcq({
      id: "ja-m7-4-2-mcq-juice",
      prompt: "Which sentence means 'I drink juice.'?",
      correctKana: "ジュースを のみます。",
      distractorsKana: [
        "ジュースを たべます。",
        "みずを たべます。",
        "コーヒーを たべます。",
      ],
      explanation:
        "Juice is drunk (のむ), not eaten (たべる). Direct object → を.",
    }),
    speaking("ja-m7-4-2-speak-juusu", "ジュースを のみます", "I drink juice."),
    // ── さけ: single-tile build — "sake (rice wine)" obvious from prompt. ──
    build(
      "ja-m7-4-2-build-sake",
      "Pick: sake (rice wine)",
      "さけ",
      ["さけ", "ジュース", "みず"],
      ["さけ"],
    ),
    build(
      "ja-m7-4-2-build-sake-sent",
      "I drink sake.",
      "さけを のみます",
      ["さけ", "を", "のみます", "たべます", "は"],
      ["さけ", "を", "のみます"],
    ),
    sentenceMcq({
      id: "ja-m7-4-2-mcq-sake",
      prompt: "Which sentence means 'I drink sake.'?",
      correctKana: "さけを のみます。",
      distractorsKana: [
        "さけを たべます。",
        "さけは のみます。",
        "さけに のみます。",
      ],
      explanation:
        "さけ (sake) is drunk → のむ. Direct object → を.",
    }),
    listeningCompSentence({
      id: "ja-m7-4-2-lc-sake",
      audioText: "さけを のみます",
      correctMeaningEn: "I drink sake.",
      distractorsEn: [
        "I eat sake.",
        "I drink water.",
        "I drink juice.",
      ],
    }),
    // Production cap: build one sentence using a fresh food word.
    build(
      "ja-m7-4-2-build-final",
      "I eat a meal.",
      "ごはんを たべます",
      ["ごはん", "を", "たべます", "のみます", "は"],
      ["ごはん", "を", "たべます"],
    ),
    speaking("ja-m7-4-2-speak-gohan", "ごはんを たべます", "I eat a meal."),
    listeningBuildSentence({
      id: "ja-m7-4-2-lb-sake",
      target: "さけを のみます",
      tiles: ["さけ", "を", "のみます", "たべます", "は"],
      correctOrder: ["さけ", "を", "のみます"],
      promptEn: "Hear it, build it: 'I drink sake.'",
    }),
    // ── Review tail (M6 atoms) ──
    speaking("ja-m7-4-2-rev-speak-m6", M7_4_2_REVIEW[0].kana, M7_4_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-4-2-rev-lc-m6",
      audioText: M7_4_2_REVIEW[1].kana,
      correctMeaningEn: M7_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_4_2_REVIEW[2].meaningEn,
        M7_4_2_REVIEW[3].meaningEn,
        M7_REVIEW_M3[3].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-4-2-rev-mcq-m3", M7_REVIEW_M3[0], M7_REVIEW_M3),
    reviewMatchPairs("ja-m7-4-2-rev", M7_4_2_REVIEW),
    infoStep(
      "ja-m7-4-2-info-end",
      "You can now name six foods and drinks in verb sentences",
      "ごはん, ジュース, さけ join the earlier three. Each one goes into a を + verb pattern. Next: drill all four particles in rotation.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_4_2.steps);
assertNoConsecutiveSame(M7_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-5-1 — Drill: を rotated with に/で/が (first half)
// ═══════════════════════════════════════════════════════════════════════

const M7_5_1_REVIEW = pickReviewAtoms("ja-m7-5-1-rev", M7_REVIEW_M6_VISUAL, 4);

export const M7_5_1: LessonContent = {
  id: "ja-m7-5-1",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Drill — verbs + を (rotated, part 1)",
  description:
    "Cloze drills rotating answers across を/に/で/が. Parse meaning, don't guess.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m7-5-1-info-open",
      "Mix it up",
      "Each cloze picks between を (direct object), に (destination/existence), で (setting/means), and が (existence subject). The answer rotates every step.",
    ),
    // ── Rotating: を → に → を → で → を → が ──
    cloze(
      "ja-m7-5-1-cloze-1",
      "ラーメン",
      " たべます。",
      "を",
      ["を", "は", "が", "に"],
      "I eat ramen.",
      "ラーメンを たべます。",
      "Direct object → を.",
    ),
    sentenceMcq({
      id: "ja-m7-5-1-mcq-bicycle",
      prompt: "Which sentence means 'I go to school by bicycle.'?",
      correctKana: "じてんしゃで がっこうに いきます。",
      distractorsKana: [
        "じてんしゃに がっこうで いきます。",
        "じてんしゃを がっこうに いきます。",
        "じてんしゃで がっこうを いきます。",
      ],
      explanation:
        "じてんしゃ = means → で. がっこう = destination → に. Two particles, two roles.",
    }),
    cloze(
      "ja-m7-5-1-cloze-2",
      "うち",
      " いきます。",
      "に",
      ["を", "に", "で", "は"],
      "I go home.",
      "うちに いきます。",
      "Destination → に.",
    ),
    cloze(
      "ja-m7-5-1-cloze-3",
      "ともだちの ほん",
      " よみます。",
      "を",
      ["を", "は", "が", "の"],
      "I read my friend's book.",
      "ともだちの ほんを よみます。",
      "Combines の (possession) + を (direct object).",
    ),
    listeningCompSentence({
      id: "ja-m7-5-1-lc-uchi-tabe",
      audioText: "うちで ごはんを たべます",
      correctMeaningEn: "I eat a meal at home.",
      distractorsEn: [
        "I go to a meal at home.",
        "I drink a meal at home.",
        "I read a meal at home.",
      ],
    }),
    cloze(
      "ja-m7-5-1-cloze-4",
      "うち",
      " ごはんを たべます。",
      "で",
      ["を", "に", "で", "は"],
      "I eat a meal at home.",
      "うちで ごはんを たべます。",
      "うち = setting → で. ごはん already has を.",
    ),
    cloze(
      "ja-m7-5-1-cloze-5",
      "テレビ",
      " みます。",
      "を",
      ["を", "は", "が", "に"],
      "I watch TV.",
      "テレビを みます。",
      "テレビ is what's being watched → を.",
    ),
    build(
      "ja-m7-5-1-build-kafe",
      "I drink coffee at a cafe.",
      "カフェで コーヒーを のみます",
      ["カフェ", "で", "コーヒー", "を", "のみます", "に"],
      ["カフェ", "で", "コーヒー", "を", "のみます"],
    ),
    cloze(
      "ja-m7-5-1-cloze-6",
      "えきに ともだち",
      " います。",
      "が",
      ["が", "を", "で", "は"],
      "My friend is at the station.",
      "えきに ともだちが います。",
      "Existence (います) + subject of existence → が.",
    ),
    speaking("ja-m7-5-1-speak-terebi", "テレビを みます", "I watch TV."),
    listeningCompSentence({
      id: "ja-m7-5-1-lc-terebi",
      audioText: "テレビを みます",
      correctMeaningEn: "I watch TV.",
      distractorsEn: [
        "I read TV.",
        "I write TV.",
        "I eat TV.",
      ],
    }),
    // Listening — airport re-exposure (M6 atom compounding).
    listeningCompSentence({
      id: "ja-m7-5-1-lc-kuukou",
      audioText: "くうこうに いきます",
      correctMeaningEn: "I go to the airport.",
      distractorsEn: [
        "I go to the post office.",
        "I go to the park.",
        "I go home.",
      ],
    }),
    // ── Review tail (M6 places) ──
    speaking("ja-m7-5-1-rev-speak-m6", M7_5_1_REVIEW[0].kana, M7_5_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-5-1-rev-lc-m3",
      audioText: M7_REVIEW_M3[1].kana,
      correctMeaningEn: M7_REVIEW_M3[1].meaningEn,
      distractorsEn: [
        M7_REVIEW_M3[2].meaningEn,
        M7_REVIEW_M3[3].meaningEn,
        M7_REVIEW_M3[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-5-1-rev-mcq-m4", M7_REVIEW_M4[0], M7_REVIEW_M4),
    reviewMatchPairs("ja-m7-5-1-rev", M7_5_1_REVIEW),
    infoStep(
      "ja-m7-5-1-info-end",
      "You can now sort four particles across varied sentences",
      "を (object), に (destination), で (setting/means), が (existence) — rotating with no auto-pick. More drilling plus self-explanation next.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_5_1.steps);
assertAnswerRotation(M7_5_1.steps, 3);
assertNoConsecutiveSame(M7_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-5-2 — Drill: を rotated (second half + selfExplain)
// ═══════════════════════════════════════════════════════════════════════

const M7_5_2_REVIEW = pickReviewAtoms("ja-m7-5-2-rev", M7_REVIEW_POOL_VISUAL, 4);

export const M7_5_2: LessonContent = {
  id: "ja-m7-5-2",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Drill — verbs + を (rotated, part 2)",
  description:
    "More particle rotation. Self-explanation at N-1. Production build at the end.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    cloze(
      "ja-m7-5-2-cloze-1",
      "ゆうびんきょく",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to the post office.",
      "ゆうびんきょくに いきます。",
      "Destination → に. ゆうびんきょく = post office.",
    ),
    cloze(
      "ja-m7-5-2-cloze-2",
      "さけ",
      " のみます。",
      "を",
      ["を", "は", "が", "に"],
      "I drink sake.",
      "さけを のみます。",
      "Direct object → を.",
    ),
    sentenceMcq({
      id: "ja-m7-5-2-mcq-uchi",
      prompt: "Which sentence means 'I watch TV at home.'?",
      correctKana: "うちで テレビを みます。",
      distractorsKana: [
        "うちに テレビを みます。",
        "うちで テレビに みます。",
        "うちを テレビで みます。",
      ],
      explanation:
        "うち = setting → で. テレビ = direct object → を.",
    }),
    cloze(
      "ja-m7-5-2-cloze-3",
      "こうえんに ともだち",
      " います。",
      "が",
      ["が", "を", "で", "は"],
      "My friend is at the park.",
      "こうえんに ともだちが います。",
      "Existence subject → が.",
    ),
    cloze(
      "ja-m7-5-2-cloze-4",
      "レストラン",
      " すしを たべます。",
      "で",
      ["を", "に", "で", "は"],
      "I eat sushi at a restaurant.",
      "レストランで すしを たべます。",
      "Setting → で.",
    ),
    listeningCompSentence({
      id: "ja-m7-5-2-lc-yuubin",
      audioText: "ゆうびんきょくに いきます",
      correctMeaningEn: "I go to the post office.",
      distractorsEn: [
        "I go to the airport.",
        "I go to the park.",
        "I go home.",
      ],
    }),
    cloze(
      "ja-m7-5-2-cloze-5",
      "コーヒー",
      " のみます。",
      "を",
      ["を", "は", "が", "に"],
      "I drink coffee.",
      "コーヒーを のみます。",
    ),
    // ── selfExplain at N-1 placement ──
    selfExplain({
      id: "ja-m7-5-2-self-ni-wo",
      anchorLabel: "You picked に in: うち＿ いきます (I go home)",
      anchorAudioText: "うちに いきます",
      question: "Why is に correct (and not を)?",
      rule: {
        text: "に marks a destination. いく moves you toward the noun — it doesn't act on it.",
      },
      surface: { text: "に always comes after a place word" },
      distractor: { text: "に marks the subject of an existence sentence" },
      ruleExplanation:
        "いく is a motion verb, not a transitive one — it doesn't have a 'thing being acted on'. The place you go TO is marked with に. を would be wrong: you don't 'do' home.",
    }),
    build(
      "ja-m7-5-2-build-kuukou",
      "I go to the airport by bus.",
      "バスで くうこうに いきます",
      ["バス", "で", "くうこう", "に", "いきます", "あります"],
      ["バス", "で", "くうこう", "に", "いきます"],
    ),
    speaking("ja-m7-5-2-speak-kuukou", "くうこうに いきます", "I go to the airport."),
    build(
      "ja-m7-5-2-build-uchi",
      "I eat a meal at home.",
      "うちで ごはんを たべます",
      ["うち", "で", "ごはん", "を", "たべます", "に"],
      ["うち", "で", "ごはん", "を", "たべます"],
    ),
    speaking("ja-m7-5-2-speak-uchi", "うちで ごはんを たべます", "I eat a meal at home."),
    // ── Review tail (cumulative) ──
    speaking("ja-m7-5-2-rev-speak-cum", M7_5_2_REVIEW[0].kana, M7_5_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-5-2-rev-lc-cum",
      audioText: M7_5_2_REVIEW[1].kana,
      correctMeaningEn: M7_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_5_2_REVIEW[2].meaningEn,
        M7_5_2_REVIEW[3].meaningEn,
        M7_REVIEW_M1[1].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-5-2-rev-mcq-cum-2", M7_5_2_REVIEW[2], M7_REVIEW_POOL),
    reviewMatchPairs("ja-m7-5-2-rev", M7_5_2_REVIEW),
    infoStep(
      "ja-m7-5-2-info-end",
      "You can now explain why each particle is correct",
      "を, に, で, が — drilled and self-explained. You know the roles, not just the positions. That's the four-particle skeleton of beginner Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_5_2.steps);
assertAnswerRotation(M7_5_2.steps, 3);
assertNoConsecutiveSame(M7_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-6-1 — Compound sentences (first half)
// ═══════════════════════════════════════════════════════════════════════

const M7_6_1_REVIEW = pickReviewAtoms("ja-m7-6-1-rev", M7_REVIEW_POOL_VISUAL, 4);

export const M7_6_1: LessonContent = {
  id: "ja-m7-6-1",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Compound sentences (part 1)",
  description:
    "Two-particle sentences. Where + what + verb. The natural endpoint of M3-M7 grammar.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m7-6-1-info-open",
      "Two particles in one sentence",
      "Most real Japanese sentences use multiple particles. うちで ごはんを たべます (eat a meal at home) uses で AND を. The drill below tests one particle at a time but the carrier sentence contains both.",
    ),
    // ── Two-particle clozes: で → を → に → を → で ──
    cloze(
      "ja-m7-6-1-cloze-1",
      "レストラン",
      " すしを たべます。",
      "で",
      ["を", "に", "で", "は"],
      "I eat sushi at a restaurant.",
      "レストランで すしを たべます。",
      "レストラン = setting → で. すし already has を.",
    ),
    sentenceMcq({
      id: "ja-m7-6-1-mcq-pen",
      prompt: "Which sentence means 'I write my name with a pen.'?",
      correctKana: "ペンで なまえを かきます。",
      distractorsKana: [
        "ペンに なまえを かきます。",
        "ペンを なまえで かきます。",
        "ペンで なまえに かきます。",
      ],
      explanation:
        "ペン = means → で. なまえ = direct object → を.",
    }),
    cloze(
      "ja-m7-6-1-cloze-2",
      "うちで ごはん",
      " たべます。",
      "を",
      ["を", "に", "で", "は"],
      "I eat a meal at home.",
      "うちで ごはんを たべます。",
      "ごはん is what's being eaten → を. うち already has で.",
    ),
    cloze(
      "ja-m7-6-1-cloze-3",
      "じてんしゃで がっこう",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to school by bicycle.",
      "じてんしゃで がっこうに いきます。",
      "がっこう = destination → に.",
    ),
    listeningCompSentence({
      id: "ja-m7-6-1-lc-konbini",
      audioText: "コンビニで ジュースを のみます",
      correctMeaningEn: "I drink juice at the convenience store.",
      distractorsEn: [
        "I drink juice at home.",
        "I eat ramen at the convenience store.",
        "I go to the convenience store for juice.",
      ],
    }),
    cloze(
      "ja-m7-6-1-cloze-4",
      "カフェで コーヒー",
      " のみます。",
      "を",
      ["を", "に", "で", "は"],
      "I drink coffee at a cafe.",
      "カフェで コーヒーを のみます。",
      "コーヒー is what's being drunk → を.",
    ),
    // Production build — 2-particle sentence.
    build(
      "ja-m7-6-1-build-park",
      "I eat a meal at the park.",
      "こうえんで ごはんを たべます",
      ["こうえん", "で", "ごはん", "を", "たべます", "に"],
      ["こうえん", "で", "ごはん", "を", "たべます"],
    ),
    cloze(
      "ja-m7-6-1-cloze-5",
      "こうえん",
      " ともだちが います。",
      "に",
      ["に", "で", "を", "は"],
      "My friend is at the park.",
      "こうえんに ともだちが います。",
      "Existence place → に (not で).",
    ),
    sentenceMcq({
      id: "ja-m7-6-1-mcq-uchi-terebi",
      prompt: "Which sentence means 'I watch TV at home.'?",
      correctKana: "うちで テレビを みます。",
      distractorsKana: [
        "うちに テレビを みます。",
        "うちで テレビに みます。",
        "うちを テレビで みます。",
      ],
      explanation:
        "うち = setting → で. テレビ = direct object → を.",
    }),
    speaking("ja-m7-6-1-speak-compound", "うちで テレビを みます", "I watch TV at home."),
    build(
      "ja-m7-6-1-build-kafe",
      "I drink coffee at a cafe.",
      "カフェで コーヒーを のみます",
      ["カフェ", "で", "コーヒー", "を", "のみます", "に"],
      ["カフェ", "で", "コーヒー", "を", "のみます"],
    ),
    // ── Review tail ──
    speaking("ja-m7-6-1-rev-speak-cum", M7_6_1_REVIEW[0].kana, M7_6_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-6-1-rev-lc-cum",
      audioText: M7_6_1_REVIEW[1].kana,
      correctMeaningEn: M7_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_6_1_REVIEW[2].meaningEn,
        M7_6_1_REVIEW[3].meaningEn,
        M7_REVIEW_M1[2].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-6-1-rev-mcq-cum-2", M7_6_1_REVIEW[2], M7_REVIEW_POOL),
    reviewMatchPairs("ja-m7-6-1-rev", M7_6_1_REVIEW),
    infoStep(
      "ja-m7-6-1-info-end",
      "You can now combine two particles in one sentence",
      "Setting (で) + object (を), means (で) + destination (に) — two roles in one sentence. More compound sentences plus self-explanation next.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_6_1.steps);
assertAnswerRotation(M7_6_1.steps, 3);
assertNoConsecutiveSame(M7_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-6-2 — Compound sentences (second half + selfExplain)
// ═══════════════════════════════════════════════════════════════════════

const M7_6_2_REVIEW = pickReviewAtoms("ja-m7-6-2-rev", M7_REVIEW_M4_VISUAL, 5);

export const M7_6_2: LessonContent = {
  id: "ja-m7-6-2",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Compound sentences (part 2)",
  description:
    "More compound sentences. Self-explanation on why two particles co-occur.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    cloze(
      "ja-m7-6-2-cloze-1",
      "レストランで さけ",
      " のみます。",
      "を",
      ["を", "に", "で", "は"],
      "I drink sake at a restaurant.",
      "レストランで さけを のみます。",
      "さけ = direct object → を.",
    ),
    cloze(
      "ja-m7-6-2-cloze-2",
      "バス",
      " がっこうに いきます。",
      "で",
      ["で", "に", "を", "は"],
      "I go to school by bus.",
      "バスで がっこうに いきます。",
      "バス = means → で.",
    ),
    listeningCompSentence({
      id: "ja-m7-6-2-lc-yuubin",
      audioText: "ゆうびんきょくで てがみを かきます",
      correctMeaningEn: "I write a letter at the post office.",
      distractorsEn: [
        "I read a letter at the post office.",
        "I write a letter at home.",
        "I go to the post office.",
      ],
    }),
    cloze(
      "ja-m7-6-2-cloze-3",
      "ゆうびんきょくで てがみ",
      " かきます。",
      "を",
      ["を", "に", "で", "は"],
      "I write a letter at the post office.",
      "ゆうびんきょくで てがみを かきます。",
      "てがみ = direct object → を.",
    ),
    sentenceMcq({
      id: "ja-m7-6-2-mcq-library",
      prompt: "Which sentence means 'I read a book at the library.'?",
      correctKana: "としょかんで ほんを よみます。",
      distractorsKana: [
        "としょかんに ほんを よみます。",
        "としょかんで ほんに よみます。",
        "としょかんを ほんで よみます。",
      ],
      explanation:
        "としょかん = setting → で. ほん = direct object → を.",
    }),
    cloze(
      "ja-m7-6-2-cloze-4",
      "えき",
      " ともだちが います。",
      "に",
      ["に", "で", "を", "は"],
      "My friend is at the station.",
      "えきに ともだちが います。",
      "Existence place → に.",
    ),
    // ── selfExplain at N-1 placement ──
    selfExplain({
      id: "ja-m7-6-2-self-compound",
      anchorLabel: "You picked を + で in: うちで ごはんを たべます",
      anchorAudioText: "うちで ごはんを たべます",
      question: "Why does this sentence need BOTH で and を?",
      rule: {
        text: "で marks the setting (where the action happens); を marks the thing acted on. The verb たべる needs both — a place AND an object.",
      },
      surface: { text: "Japanese sentences always use two particles" },
      distractor: { text: "で and を both mark the direct object" },
      ruleExplanation:
        "で and を play different roles: で = the SETTING of the action; を = the THING being acted on. Verbs like たべる, よむ, かく, のむ are transitive — they need an object (を) AND can have a setting (で).",
    }),
    build(
      "ja-m7-6-2-build-restaurant",
      "I eat sushi at a restaurant.",
      "レストランで すしを たべます",
      ["レストラン", "で", "すし", "を", "たべます", "に"],
      ["レストラン", "で", "すし", "を", "たべます"],
    ),
    speaking(
      "ja-m7-6-2-speak-restaurant",
      "レストランで すしを たべます",
      "I eat sushi at a restaurant.",
    ),
    build(
      "ja-m7-6-2-build-bus",
      "I go to school by bus.",
      "バスで がっこうに いきます",
      ["バス", "で", "がっこう", "に", "いきます", "を"],
      ["バス", "で", "がっこう", "に", "いきます"],
    ),
    listeningBuildSentence({
      id: "ja-m7-6-2-lb-uchi",
      target: "うちで テレビを みます",
      tiles: ["うち", "で", "テレビ", "を", "みます", "に", "のみます"],
      correctOrder: ["うち", "で", "テレビ", "を", "みます"],
      promptEn: "Hear it, build it: 'I watch TV at home.'",
    }),
    speaking(
      "ja-m7-6-2-speak-bus",
      "バスで がっこうに いきます",
      "I go to school by bus.",
    ),
    // ── Review tail ──
    speaking("ja-m7-6-2-rev-speak-cum", M7_6_2_REVIEW[0].kana, M7_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-6-2-rev-lc-cum",
      audioText: M7_6_2_REVIEW[1].kana,
      correctMeaningEn: M7_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_6_2_REVIEW[2].meaningEn,
        M7_6_2_REVIEW[3].meaningEn,
        M7_6_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-6-2-rev-mcq-cum-2", M7_6_2_REVIEW[2], M7_REVIEW_POOL),
    vocabMcq("ja-m7-6-2-rev-mcq-m5", M7_REVIEW_M5[2], M7_REVIEW_M5),
    reviewMatchPairs("ja-m7-6-2-rev", M7_6_2_REVIEW),
    infoStep(
      "ja-m7-6-2-info-end",
      "You can now describe where you do what in compound sentences",
      "で + を, で + に — you know why each particle appears and what role it plays. Next: production-only with no multiple choice.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_6_2.steps);
assertAnswerRotation(M7_6_2.steps, 3);
assertNoConsecutiveSame(M7_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-STORY — Story comprehension: What do you eat?
// ═══════════════════════════════════════════════════════════════════════

export const M7_STORY: LessonContent = {
  id: "ja-m7-story",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — What do you eat?",
  description:
    "Listen to two friends talk about what they eat, drink, and do every day.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m7-story-info-open",
      "Story time — What do you eat?",
      "ゆき and たけし are talking about their daily habits — what they eat, drink, read, and watch.",
    ),
    dialogueListen({
      id: "ja-m7-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "たけしは なにを たべますか。" },
        { speaker: "たけし", kana: "わたしは ごはんを たべます。" },
        { speaker: "ゆき", kana: "わたしは パンを たべます。" },
        { speaker: "たけし", kana: "コーヒーを のみますか。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "What does たけし eat?",
          correctText: "Rice / a meal (ごはん)",
          distractors: ["Bread (パン)", "Sushi (すし)", "Ramen (ラーメン)"],
          explanation: "ごはんを たべます = 'I eat rice/a meal.'",
        },
        {
          id: "s1-q2",
          prompt: "What does ゆき eat?",
          correctText: "Bread (パン)",
          distractors: ["Rice (ごはん)", "Ramen (ラーメン)", "Sushi (すし)"],
          explanation: "わたしは パンを たべます = 'I eat bread.'",
        },
      ],
    }),
    build(
      "ja-m7-story-build-wo",
      "Say: I eat rice.",
      "ごはんを たべます",
      ["ごはん", "を", "たべます", "のみます", "に"],
      ["ごはん", "を", "たべます"],
    ),
    sentenceMcq({
      id: "ja-m7-story-mcq-nomu",
      prompt: "Which sentence means 'Do you drink coffee?'",
      correctKana: "コーヒーを のみますか",
      distractorsKana: [
        "コーヒーを たべますか",
        "コーヒーは のみますか",
        "コーヒーを のみます",
      ],
      explanation: "を marks what you drink. のみます = drink. か makes it a question.",
    }),
    dialogueListen({
      id: "ja-m7-story-scene-2",
      lines: [
        { speaker: "ゆき", kana: "はい、コーヒーを のみます。たけしは なにを のみますか。" },
        { speaker: "たけし", kana: "わたしは ジュースを のみます。" },
        { speaker: "ゆき", kana: "なにを よみますか。" },
        { speaker: "たけし", kana: "ほんを よみます。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "What does たけし drink?",
          correctText: "Juice (ジュース)",
          distractors: ["Coffee (コーヒー)", "Beer (ビール)", "Water (みず)"],
          explanation: "ジュースを のみます = 'I drink juice.'",
        },
        {
          id: "s2-q2",
          prompt: "What does たけし read?",
          correctText: "Books (ほん)",
          distractors: ["Letters (てがみ)", "A dictionary (じしょ)", "Nothing"],
          explanation: "ほんを よみます = 'I read books.' よみます = read.",
        },
      ],
    }),
    cloze(
      "ja-m7-story-cloze-wo",
      "ごはん",
      " たべます。 (I eat rice.)",
      "を",
      ["を", "は", "が", "に"],
      "I eat rice.",
      "ごはんを たべます。",
      "を marks the direct object — the thing being eaten/drunk/read.",
    ),
    listeningBuildSentence({
      id: "ja-m7-story-lb-yomu",
      target: "ほんを よみます",
      tiles: ["ほん", "を", "よみます", "たべます", "かきます"],
      correctOrder: ["ほん", "を", "よみます"],
      promptEn: "Hear it, build it: 'I read books.'",
    }),
    listeningCompSentence({
      id: "ja-m7-story-lc-juice",
      audioText: "ジュースを のみます",
      correctMeaningEn: "I drink juice.",
      distractorsEn: [
        "I eat juice.",
        "I drink coffee.",
        "I read juice.",
      ],
    }),
    speaking(
      "ja-m7-story-speak-taberu",
      "ごはんを たべます",
      "I eat rice.",
    ),
    sentenceMcq({
      id: "ja-m7-story-mcq-summary",
      prompt: "In the story, which particle marks WHAT you eat, drink, or read?",
      correctKana: "を",
      distractorsKana: ["は", "が", "に"],
      explanation: "を marks the direct object — the thing the verb acts on.",
    }),
    speaking(
      "ja-m7-story-speak-yomu",
      "ほんを よみます",
      "I read books.",
    ),
    infoStep(
      "ja-m7-story-info-end",
      "You followed a conversation about daily habits",
      "You heard を marking what gets eaten, drunk, and read — plus four verbs in ます form. たべます, のみます, よみます, and more are now part of your toolkit.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M7_STORY.steps);
assertPassiveCardsHaveFollowup(M7_STORY.steps);
assertNoExplanationOnPassive(M7_STORY.steps);
assertExplanationDoesntLeakAnswer(M7_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-7-1 — Production (translate + build, first half)
// ═══════════════════════════════════════════════════════════════════════

const M7_7_1_REVIEW = pickReviewAtoms("ja-m7-7-1-rev", M7_REVIEW_POOL_VISUAL, 4);

export const M7_7_1: LessonContent = {
  id: "ja-m7-7-1",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — actions (part 1)",
  description:
    "Build and speak sentences. No multiple choice — pure production.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m7-7-1-info-open",
      "Show your work",
      "Build sentences from tiles. Say them out loud. This is the production endpoint of M3-M7.",
    ),
    build(
      "ja-m7-7-1-s1",
      "I go to the park.",
      "こうえんに いきます",
      ["こうえん", "に", "いきます", "うち", "がっこう", "で"],
      ["こうえん", "に", "いきます"],
    ),
    speaking(
      "ja-m7-7-1-speak-s1",
      "こうえんに いきます",
      "I go to the park.",
    ),
    build(
      "ja-m7-7-1-s2",
      "I eat sushi.",
      "わたしは すしを たべます",
      ["わたし", "は", "すし", "を", "たべます", "のみます"],
      ["わたし", "は", "すし", "を", "たべます"],
    ),
    speaking(
      "ja-m7-7-1-speak-s2",
      "すしを たべます",
      "I eat sushi.",
    ),
    listeningBuildSentence({
      id: "ja-m7-7-1-lb-s3",
      target: "うちで ごはんを たべます",
      tiles: ["うち", "で", "ごはん", "を", "たべます", "に", "のみます"],
      correctOrder: ["うち", "で", "ごはん", "を", "たべます"],
      promptEn: "Hear it, build it: 'I eat a meal at home.'",
    }),
    sentenceMcq({
      id: "ja-m7-7-1-mcq-friend",
      prompt: "Which sentence means 'I read my friend's book.'?",
      correctKana: "ともだちの ほんを よみます。",
      distractorsKana: [
        "ともだちは ほんの よみます。",
        "ともだちに ほんを よみます。",
        "ともだちで ほんを よみます。",
      ],
      explanation:
        "の = possession (friend's book). を = direct object (the book is being read).",
    }),
    build(
      "ja-m7-7-1-s4",
      "I drink coffee at a cafe.",
      "カフェで コーヒーを のみます",
      ["カフェ", "で", "コーヒー", "を", "のみます", "に"],
      ["カフェ", "で", "コーヒー", "を", "のみます"],
    ),
    speaking(
      "ja-m7-7-1-speak-s4",
      "カフェで コーヒーを のみます",
      "I drink coffee at a cafe.",
    ),
    listeningCompSentence({
      id: "ja-m7-7-1-lc-sake",
      audioText: "さけを のみます",
      correctMeaningEn: "I drink sake.",
      distractorsEn: [
        "I eat sake.",
        "I drink water.",
        "I drink juice.",
      ],
    }),
    build(
      "ja-m7-7-1-s5",
      "I drink sake.",
      "さけを のみます",
      ["さけ", "を", "のみます", "たべます", "は"],
      ["さけ", "を", "のみます"],
    ),
    speaking(
      "ja-m7-7-1-speak-s5",
      "さけを のみます",
      "I drink sake.",
    ),
    build(
      "ja-m7-7-1-s6",
      "I write my name.",
      "なまえを かきます",
      ["なまえ", "を", "かきます", "よみます", "に"],
      ["なまえ", "を", "かきます"],
    ),
    // ── Review tail ──
    speaking("ja-m7-7-1-rev-speak-cum", M7_7_1_REVIEW[0].kana, M7_7_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-7-1-rev-lc-cum",
      audioText: M7_7_1_REVIEW[1].kana,
      correctMeaningEn: M7_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_7_1_REVIEW[2].meaningEn,
        M7_7_1_REVIEW[3].meaningEn,
        M7_REVIEW_M1[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-7-1-rev-mcq-cum-2", M7_7_1_REVIEW[2], M7_REVIEW_POOL),
    reviewMatchPairs("ja-m7-7-1-rev", M7_7_1_REVIEW),
    infoStep(
      "ja-m7-7-1-info-end",
      "You can now produce full sentences from English prompts",
      "Build from tiles: destinations, objects, compound patterns — all from an English cue. More listening + speaking next.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_7_1.steps);
assertNoConsecutiveSame(M7_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-7-2 — Production (listening_build + speaking, second half)
// ═══════════════════════════════════════════════════════════════════════

const M7_7_2_REVIEW = pickReviewAtoms("ja-m7-7-2-rev", M7_REVIEW_POOL_VISUAL, 5);

export const M7_7_2: LessonContent = {
  id: "ja-m7-7-2",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — actions (part 2)",
  description:
    "Hear-and-build + speaking. The hardest production mode.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    listeningBuildSentence({
      id: "ja-m7-7-2-lb-s1",
      target: "じてんしゃで がっこうに いきます",
      tiles: ["じてんしゃ", "で", "がっこう", "に", "いきます", "たべます"],
      correctOrder: ["じてんしゃ", "で", "がっこう", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to school by bicycle.'",
    }),
    speaking(
      "ja-m7-7-2-speak-s1",
      "じてんしゃで がっこうに いきます",
      "I go to school by bicycle.",
    ),
    listeningBuildSentence({
      id: "ja-m7-7-2-lb-s2",
      target: "レストランで ラーメンを たべます",
      tiles: ["レストラン", "で", "ラーメン", "を", "たべます", "に"],
      correctOrder: ["レストラン", "で", "ラーメン", "を", "たべます"],
      promptEn: "Hear it, build it: 'I eat ramen at a restaurant.'",
    }),
    speaking(
      "ja-m7-7-2-speak-s2",
      "レストランで ラーメンを たべます",
      "I eat ramen at a restaurant.",
    ),
    listeningCompSentence({
      id: "ja-m7-7-2-lc-yomu",
      audioText: "ともだちの ほんを よみます",
      correctMeaningEn: "I read my friend's book.",
      distractorsEn: [
        "I read a book to my friend.",
        "I write my friend's book.",
        "My friend reads a book.",
      ],
    }),
    build(
      "ja-m7-7-2-s3",
      "I read my friend's book.",
      "ともだちの ほんを よみます",
      ["ともだち", "の", "ほん", "を", "よみます", "かきます"],
      ["ともだち", "の", "ほん", "を", "よみます"],
    ),
    speaking(
      "ja-m7-7-2-speak-s3",
      "ともだちの ほんを よみます",
      "I read my friend's book.",
    ),
    listeningBuildSentence({
      id: "ja-m7-7-2-lb-s4",
      target: "うちで テレビを みます",
      tiles: ["うち", "で", "テレビ", "を", "みます", "に", "のみます"],
      correctOrder: ["うち", "で", "テレビ", "を", "みます"],
      promptEn: "Hear it, build it: 'I watch TV at home.'",
    }),
    speaking(
      "ja-m7-7-2-speak-s4",
      "うちで テレビを みます",
      "I watch TV at home.",
    ),
    build(
      "ja-m7-7-2-s5",
      "I go to the airport.",
      "くうこうに いきます",
      ["くうこう", "に", "いきます", "で", "たべます"],
      ["くうこう", "に", "いきます"],
    ),
    speaking(
      "ja-m7-7-2-speak-s5",
      "くうこうに いきます",
      "I go to the airport.",
    ),
    build(
      "ja-m7-7-2-s6",
      "I eat bread at home.",
      "うちで パンを たべます",
      ["うち", "で", "パン", "を", "たべます", "に"],
      ["うち", "で", "パン", "を", "たべます"],
    ),
    speaking(
      "ja-m7-7-2-speak-cap",
      "カフェで コーヒーを のみます",
      "I drink coffee at a cafe.",
    ),
    // ── Review tail (cumulative) ──
    speaking("ja-m7-7-2-rev-speak-cum", M7_7_2_REVIEW[0].kana, M7_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-7-2-rev-lc-cum",
      audioText: M7_7_2_REVIEW[1].kana,
      correctMeaningEn: M7_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_7_2_REVIEW[2].meaningEn,
        M7_7_2_REVIEW[3].meaningEn,
        M7_7_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-7-2-rev-mcq-cum-2", M7_7_2_REVIEW[2], M7_REVIEW_POOL),
    vocabMcq("ja-m7-7-2-rev-mcq-m6", M7_REVIEW_M6[2], M7_REVIEW_M6),
    reviewMatchPairs("ja-m7-7-2-rev", M7_7_2_REVIEW),
    infoStep(
      "ja-m7-7-2-info-end",
      "You can now hear, build, and speak M7 sentences",
      "Listening builds and speaking production across compound patterns — the hardest production mode. Next: a real dialogue at a ramen shop.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_7_2.steps);
assertNoConsecutiveSame(M7_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-8-1 — Mini-dialogue: ramen shop (warm-up + dialogue)
// ═══════════════════════════════════════════════════════════════════════

export const M7_8_1: LessonContent = {
  id: "ja-m7-8-1",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — ramen shop (part 1)",
  description:
    "Warm-up vocab for a restaurant scene, then the full dialogue with comprehension questions.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m7-8-1-info-open",
      "Drop into the scene",
      "You sit down at a Tokyo ramen shop with a friend. The staff greets you, you order, and you check the bill. Every grammar piece is something you've met.",
      "culture",
    ),
    // ── Warm-up: build calls for restaurant phrases. Each is figuroutable
    // because the English prompt makes the meaning obvious. ──
    // いらっしゃいませ — "Welcome (shop greeting)" is a single-tile pick.
    build(
      "ja-m7-8-1-build-irasshai",
      "Pick: 'Welcome!' (shop greeting you hear when entering)",
      "いらっしゃいませ",
      ["いらっしゃいませ", "ありがとうございます", "すみません"],
      ["いらっしゃいませ"],
    ),
    // なんめいさまですか — "How many people?" single-tile.
    build(
      "ja-m7-8-1-build-nanmei",
      "Pick: 'How many people?' (staff asking party size)",
      "なんめいさまですか",
      ["なんめいさまですか", "ごちゅうもんは", "いらっしゃいませ"],
      ["なんめいさまですか"],
    ),
    listeningCompSentence({
      id: "ja-m7-8-1-lc-nanmei",
      audioText: "なんめいさまですか",
      correctMeaningEn: "How many people?",
      distractorsEn: [
        "What would you like to order?",
        "Welcome to the shop.",
        "Where would you like to sit?",
      ],
    }),
    // ごちゅうもんは — "Your order?" single-tile.
    build(
      "ja-m7-8-1-build-gochuumon",
      "Pick: 'Your order?' (staff asking what you'd like)",
      "ごちゅうもんは",
      ["ごちゅうもんは", "なんめいさまですか", "かしこまりました"],
      ["ごちゅうもんは"],
    ),
    // ひとつ — "one (counter)" single-tile.
    build(
      "ja-m7-8-1-build-hitotsu",
      "Pick: 'one' (generic counter for one of anything)",
      "ひとつ",
      ["ひとつ", "ふたつ", "みっつ"],
      ["ひとつ"],
    ),
    listeningCompSentence({
      id: "ja-m7-8-1-lc-gochuumon",
      audioText: "ごちゅうもんは",
      correctMeaningEn: "Your order? (polite)",
      distractorsEn: [
        "How many people?",
        "Please come again.",
        "Is this for here or to go?",
      ],
    }),
    // かしこまりました — "Understood (formal)" single-tile.
    build(
      "ja-m7-8-1-build-kashikomari",
      "Pick: 'Understood.' (formal staff acknowledgement after your order)",
      "かしこまりました",
      ["かしこまりました", "いらっしゃいませ", "ごちゅうもんは"],
      ["かしこまりました"],
    ),
    // ── Dialogue Listen — audio-only; transcript reveals after first answer. ──
    dialogueListen({
      id: "ja-m7-8-1-dialogue",
      lines: [
        { speaker: "Staff", kana: "いらっしゃいませ。なんめいさまですか。" },
        { speaker: "You",   kana: "ふたりです。" },
        { speaker: "Staff", kana: "ごちゅうもんは。" },
        { speaker: "You",   kana: "ラーメンを ふたつ と ジュースを ひとつ ください。" },
      ],
      questions: [
        {
          id: "ja-m7-8-1-dq-1",
          prompt: "What did you order to eat?",
          correctText: "Two ramen",
          distractors: ["Two juices", "One ramen", "Two bowls of rice"],
          explanation:
            "ラーメンを ふたつ = two ramen. ふたつ is the counter '2 (things).'",
        },
        {
          id: "ja-m7-8-1-dq-2",
          prompt: "How many drinks did you order?",
          correctText: "One",
          distractors: ["Two", "Three", "None"],
          explanation:
            "ジュースを ひとつ = one juice. ひとつ is the counter for 1.",
        },
        {
          id: "ja-m7-8-1-dq-3",
          prompt: "If ramen is 800 yen each and juice is 300 yen, what's the total?",
          correctText: "1,900 yen",
          distractors: ["1,100 yen", "1,600 yen", "2,400 yen"],
          explanation:
            "Two ramen (800 x 2 = 1,600) + one juice (300) = 1,900 yen.",
        },
      ],
      transcriptRevealAfter: "first-answer",
    }),
    // Post-dialogue listening retrieval.
    listeningCompSentence({
      id: "ja-m7-8-1-lc-nanmei-post",
      audioText: "なんめいさまですか",
      correctMeaningEn: "How many people? (polite)",
      distractorsEn: [
        "What's your order?",
        "Welcome.",
        "Two people.",
      ],
    }),
    speaking(
      "ja-m7-8-1-speak-kashikomari",
      "かしこまりました",
      "Understood. (formal acknowledgement)",
    ),
    // ── Review tail (short — dialogue is heavy) ──
    sentenceMcq({
      id: "ja-m7-8-1-mcq-kashikomari",
      prompt: "Which is the formal shop-staff way of saying 'understood'?",
      correctKana: "かしこまりました。",
      distractorsKana: [
        "ありがとうございます。",
        "いらっしゃいませ。",
        "ごちゅうもんは。",
      ],
      explanation:
        "かしこまりました is the formal acknowledgement staff use after taking your order.",
    }),
    listeningCompSentence({
      id: "ja-m7-8-1-lc-order",
      audioText: "ラーメンを ふたつ ください",
      correctMeaningEn: "Two ramen, please.",
      distractorsEn: [
        "One ramen, please.",
        "Two juices, please.",
        "I eat ramen.",
      ],
    }),
    speaking(
      "ja-m7-8-1-speak-order",
      "ラーメンを ふたつ ください",
      "Two ramen, please.",
    ),
    infoStep(
      "ja-m7-8-1-info-end",
      "You can now order food at a Japanese restaurant",
      "いらっしゃいませ, ごちゅうもんは, ください — you navigated a ramen shop from greeting to order. Next: cumulative drills wrapping up Module 7.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_8_1.steps);
assertNoConsecutiveSame(M7_8_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M7-8-2 — Post-dialogue drills + cumulative review
// ═══════════════════════════════════════════════════════════════════════

const M7_8_2_REVIEW = pickReviewAtoms("ja-m7-8-2-rev", M7_REVIEW_POOL_VISUAL, 6);

export const M7_8_2: LessonContent = {
  id: "ja-m7-8-2",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Cumulative review — M7 wrap-up",
  description:
    "Cumulative drills wrapping up the module. Particle clozes + production + broad review.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    // ── Cumulative cloze — answers rotate (を → に → を → で → を). ──
    cloze(
      "ja-m7-8-2-cloze-1",
      "ジュース",
      " ください。",
      "を",
      ["を", "は", "が", "に"],
      "Juice, please.",
      "ジュースを ください。",
      "ください takes を for the requested item.",
    ),
    sentenceMcq({
      id: "ja-m7-8-2-mcq-direction",
      prompt: "Which sentence means 'I go to the convenience store.'?",
      correctKana: "コンビニに いきます。",
      distractorsKana: [
        "コンビニで いきます。",
        "コンビニを いきます。",
        "コンビニは いきます。",
      ],
      explanation:
        "コンビニ = destination → に.",
    }),
    cloze(
      "ja-m7-8-2-cloze-2",
      "レストラン",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to a restaurant.",
      "レストランに いきます。",
      "Destination → に.",
    ),
    build(
      "ja-m7-8-2-build-mizu",
      "I drink water.",
      "みずを のみます",
      ["みず", "を", "のみます", "たべます", "は"],
      ["みず", "を", "のみます"],
    ),
    cloze(
      "ja-m7-8-2-cloze-3",
      "コーヒー",
      " ひとつ ください。",
      "を",
      ["を", "は", "が", "に"],
      "One coffee, please.",
      "コーヒーを ひとつ ください。",
      "を marks the requested item before ください.",
    ),
    cloze(
      "ja-m7-8-2-cloze-4",
      "カフェ",
      " コーヒーを のみます。",
      "で",
      ["で", "に", "を", "は"],
      "I drink coffee at a cafe.",
      "カフェで コーヒーを のみます。",
      "Setting → で.",
    ),
    build(
      "ja-m7-8-2-build-order",
      "One juice, please.",
      "ジュースを ひとつ ください",
      ["ジュース", "を", "ひとつ", "ください", "たべます", "に"],
      ["ジュース", "を", "ひとつ", "ください"],
    ),
    cloze(
      "ja-m7-8-2-cloze-5",
      "パン",
      " たべます。",
      "を",
      ["を", "は", "が", "に"],
      "I eat bread.",
      "パンを たべます。",
    ),
    speaking(
      "ja-m7-8-2-speak-order",
      "ジュースを ひとつ ください",
      "One juice, please.",
    ),
    listeningBuildSentence({
      id: "ja-m7-8-2-lb-restaurant",
      target: "レストランで すしを たべます",
      tiles: ["レストラン", "で", "すし", "を", "たべます", "に"],
      correctOrder: ["レストラン", "で", "すし", "を", "たべます"],
      promptEn: "Hear it, build it: 'I eat sushi at a restaurant.'",
    }),
    speaking(
      "ja-m7-8-2-speak-restaurant",
      "レストランで すしを たべます",
      "I eat sushi at a restaurant.",
    ),
    // ── Cumulative review tail (broadest — M1-M6). ──
    speaking("ja-m7-8-2-rev-speak-cum-1", M7_8_2_REVIEW[0].kana, M7_8_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m7-8-2-rev-lc-cum",
      audioText: M7_8_2_REVIEW[1].kana,
      correctMeaningEn: M7_8_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_8_2_REVIEW[2].meaningEn,
        M7_8_2_REVIEW[3].meaningEn,
        M7_8_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m7-8-2-rev-mcq-cum-2", M7_8_2_REVIEW[5], M7_REVIEW_POOL),
    vocabMcq("ja-m7-8-2-rev-mcq-m3", M7_REVIEW_M3[4], M7_REVIEW_M3),
    reviewMatchPairs("ja-m7-8-2-rev", M7_8_2_REVIEW),
    infoStep(
      "ja-m7-8-2-info-end",
      "You can now describe actions in the world",
      "Who eats what, where you go, what you read, how you get there — verbs, を, and all four particles working together. That's real productive Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_8_2.steps);
assertAnswerRotation(M7_8_2.steps, 3);
assertNoConsecutiveSame(M7_8_2.steps);

// ---------------------------------------------------------------------------
// Passive-card lint (2026-05-22) — see _stepAssertions.ts for rules.
// ---------------------------------------------------------------------------
for (const lesson of [M7_1_1, M7_1_2, M7_2_1, M7_2_2, M7_3_1, M7_3_2, M7_4_1, M7_4_2, M7_5_1, M7_5_2, M7_6_1, M7_6_2, M7_STORY, M7_7_1, M7_7_2, M7_8_1, M7_8_2]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
