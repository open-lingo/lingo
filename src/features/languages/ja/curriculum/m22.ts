/**
 * M22 — Comparison (2026-05-25).
 *
 * M22 introduces:
 *   - 〜のほうが〜より (A is more than B): "Coffee is more expensive than tea."
 *   - 〜のなかで〜がいちばん (most among): "Among the three, ramen is the best."
 *   - どちら/どっち (which of two): "Which is cheaper, A or B?"
 *
 * Vocab (~28): おなじ (same), ちがう (different), もっと (more), いちばん (most/best),
 *   ほう (direction/side), まち (town), レストラン, ラーメン, カレー, パスタ,
 *   りょうり (cooking/cuisine), にく (meat), さかな (fish), やさい (vegetables),
 *   くだもの (fruit), おおさか, とうきょう, きょうと, ひろしま,
 *   ゆうめい (famous), しずか (quiet), にぎやか (lively), べんり (convenient),
 *   ふべん (inconvenient), きれい (beautiful/clean),
 *   おおい (many — backlog weave, M22-2-2), すくない (few — backlog weave, M22-3-2),
 *   いろいろ (various — backlog weave, M22-4-2)
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps.
 *
 * 2026-06-12 sentence-variety reauthor: no sentence repeated >3x module-wide
 * (fresh comparison pairs / superlative domains per slot), review-particle
 * cloze ≤25%, build tile banks scrambled (no answer-first / answer-order
 * leaks), review tails widened to 6-pair match.
 *
 * ID scheme: ja-m22-{n}-{sub} e.g. ja-m22-1-1, ja-m22-1-2
 * Export names: M22_1_1, M22_1_2, M22_2_1, M22_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m22-1, etc.
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
const M22_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_HOU_GA_YORI = grammarRule({
  id: "ja-m22-rule-hou-ga-yori",
  grammarPointId: "yori-comparison",
  title: "〜のほうが〜より — A is more than B",
  rule:
    "To compare two things, use: Aのほうが Bより [adjective]です. A is the 'winner' — the one that IS more [adj]. B is the baseline. Literally: 'the side of A, compared to B, is [adj].'",
  examples: [
    {
      ja: "コーヒーのほうが おちゃより たかいです。",
      romaji: "koohii no hou ga ocha yori takai desu.",
      en: "Coffee is more expensive than tea.",
    },
    {
      ja: "とうきょうのほうが おおさかより おおきいです。",
      romaji: "toukyou no hou ga oosaka yori ookii desu.",
      en: "Tokyo is bigger than Osaka.",
    },
    {
      ja: "にくのほうが やさいより たかいです。",
      romaji: "niku no hou ga yasai yori takai desu.",
      en: "Meat is more expensive than vegetables.",
    },
  ],
  antiPattern: {
    ja: "コーヒーより おちゃのほうが たかいです。",
    romaji: "koohii yori ocha no hou ga takai desu.",
    en: "(reversed meaning — this says 'tea is more expensive than coffee')",
    why: "のほうが marks the winner (the more [adj] one). より marks the baseline. Swapping them reverses the comparison.",
  },
  cultureNote:
    "You can drop より + B entirely when the baseline is obvious from context: コーヒーのほうが たかいです ('Coffee is the more expensive one').",
});

const RULE_NAKA_DE_ICHIBAN = grammarRule({
  id: "ja-m22-rule-naka-de-ichiban",
  grammarPointId: "ichiban-superlative",
  title: "〜のなかで〜がいちばん — most among",
  rule:
    "To express the superlative ('most/best among a group'), use: [group]のなかで [item]がいちばん [adjective]です. The group is the comparison set; いちばん means 'number one / most.'",
  examples: [
    {
      ja: "このみせのなかで ラーメンが いちばん おいしいです。",
      romaji: "kono mise no naka de raamen ga ichiban oishii desu.",
      en: "Among this shop's items, the ramen is the most delicious.",
    },
    {
      ja: "にほんのなかで とうきょうが いちばん おおきいです。",
      romaji: "nihon no naka de toukyou ga ichiban ookii desu.",
      en: "In Japan, Tokyo is the biggest.",
    },
    {
      ja: "くだもののなかで りんごが いちばん すきです。",
      romaji: "kudamono no naka de ringo ga ichiban suki desu.",
      en: "Among fruits, I like apples the most.",
    },
  ],
  antiPattern: {
    ja: "にほんで いちばん とうきょうが おおきいです。",
    romaji: "nihon de ichiban toukyou ga ookii desu.",
    en: "(broken — のなかで is needed to define the comparison group)",
    why: "Without のなかで, the comparison group isn't properly established. にほんのなかで defines 'among Japan's [cities].'",
  },
  cultureNote:
    "いちばん literally means 'number one' (一番). It's used just like English 'most' before adjectives.",
});

const RULE_DOCHIRA = grammarRule({
  id: "ja-m22-rule-dochira",
  title: "どちら / どっち — which of two",
  rule:
    "To ask 'which (of two)?' use: AとBと どちらが [adjective]ですか. どちら is formal; どっち is casual. To answer: Aのほうが [adjective]です.",
  examples: [
    {
      ja: "コーヒーと おちゃと どちらが すきですか。",
      romaji: "koohii to ocha to dochira ga suki desu ka.",
      en: "Which do you like more, coffee or tea?",
    },
    {
      ja: "ラーメンと カレーと どっちが おいしいですか。",
      romaji: "raamen to karee to docchi ga oishii desu ka.",
      en: "Which is more delicious, ramen or curry?",
    },
    {
      ja: "ラーメンのほうが おいしいです。",
      romaji: "raamen no hou ga oishii desu.",
      en: "Ramen is more delicious (answer).",
    },
  ],
  antiPattern: {
    ja: "コーヒーと おちゃの どれが すきですか。",
    romaji: "koohii to ocha no dore ga suki desu ka.",
    en: "(broken — どれ is for 3+ choices; どちら is for exactly two)",
    why: "どれ selects from 3 or more. For two choices, use どちら or どっち.",
  },
  cultureNote:
    "どちらも + [adj]です means 'both are [adj]' — a diplomatic answer when you can't choose.",
});

// ═══════════════════════════════════════════════════════════════════════
// M22-1-1 — Comparison vocab intro
//   (おなじ, ちがう, もっと, いちばん, ほう + comparison sentences)
// ═══════════════════════════════════════════════════════════════════════

const M22_1_1_REVIEW = pickReviewAtoms("ja-m22-1-1-rev", M22_REVIEW_POOL, 6);

export const M22_1_1: LessonContent = {
  id: "ja-m22-1-1",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "Comparison words I",
  description:
    "Five comparison words — same, different, more, most, direction — to build the comparison toolkit.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-1-1-info-open",
      "Comparing things",
      "Five words that let you compare anything: same, different, more, most, and direction. These are your comparison building blocks.",
    ),
    // ── おなじ (same) ──
    build(
      "ja-m22-1-1-build-onaji",
      "Pick the Japanese word for: Same",
      "おなじ",
      ["ちがう", "おなじ", "もっと", "いちばん"],
      ["おなじ"],
    ),
    listeningCompSentence({
      id: "ja-m22-1-1-lc-onaji",
      audioText: "おなじ",
      correctMeaningEn: "same",
      distractorsEn: ["different", "more", "most"],
    }),
    // ── ちがう (different) ──
    build(
      "ja-m22-1-1-build-chigau",
      "Pick the Japanese word for: Different",
      "ちがう",
      ["おなじ", "もっと", "ちがう", "ほう"],
      ["ちがう"],
    ),
    speaking("ja-m22-1-1-speak-chigau", "ちがう", "Different"),
    // ── もっと (more) ──
    build(
      "ja-m22-1-1-build-motto",
      "Pick the Japanese word for: More",
      "もっと",
      ["いちばん", "おなじ", "もっと", "ちがう"],
      ["もっと"],
    ),
    listeningCompSentence({
      id: "ja-m22-1-1-lc-motto",
      audioText: "もっと",
      correctMeaningEn: "more",
      distractorsEn: ["most", "same", "different"],
    }),
    // ── いちばん (most/best) ──
    build(
      "ja-m22-1-1-build-ichiban",
      "Pick the Japanese word for: Most / Best",
      "いちばん",
      ["もっと", "ちがう", "おなじ", "いちばん"],
      ["いちばん"],
    ),
    vocabMcq(
      "ja-m22-1-1-mcq-ichiban",
      { kana: "いちばん", meaningEn: "most / best", emoji: "🥇", fromModule: "m22" },
      M22_REVIEW_POOL,
    ),
    // ── ほう (direction/side) ──
    build(
      "ja-m22-1-1-build-hou",
      "Pick the Japanese word for: Direction / Side",
      "ほう",
      ["おなじ", "ほう", "いちばん", "もっと"],
      ["ほう"],
    ),
    // ── Sentence context drills ──
    sentenceMcq({
      id: "ja-m22-1-1-mcq-onaji",
      prompt: "Which sentence means 'They are the same.'?",
      correctKana: "おなじです。",
      distractorsKana: [
        "ちがいます。",
        "もっと たかいです。",
        "いちばんです。",
      ],
      explanation: "おなじ = same. おなじです = they are the same.",
    }),
    build(
      "ja-m22-1-1-build-motto-ookii",
      "Say: It's bigger (more big).",
      "もっと おおきいです",
      ["おおきい", "いちばん", "もっと", "ちいさい", "です"],
      ["もっと", "おおきい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m22-1-1-lb-ichiban",
      target: "いちばん おいしいです",
      tiles: ["おいしい", "もっと", "いちばん", "たかい", "です"],
      correctOrder: ["いちばん", "おいしい", "です"],
      promptEn: "Hear it, build it: 'It's the most delicious.'",
    }),
    build(
      "ja-m22-1-1-build-onaji-sentence",
      "Say: This and that are the same.",
      "これと それは おなじです",
      ["それ", "おなじ", "と", "です", "これ", "は", "ちがう"],
      ["これ", "と", "それ", "は", "おなじ", "です"],
    ),
    selfExplain({
      id: "ja-m22-1-1-self-explain",
      anchorLabel: "もっと おおきいです",
      anchorAudioText: "もっと おおきいです",
      question: "What does もっと do to an adjective?",
      rule: { text: "もっと intensifies the adjective — it means 'more [adj].' もっと おおきい = bigger (more big)." },
      surface: { text: "もっと changes the adjective to its past tense." },
      distractor: { text: "もっと makes the adjective negative — 'not big.'" },
      ruleExplanation:
        "もっと + adjective = comparative: 'more [adj].' Unlike English, Japanese doesn't change the adjective form.",
    }),
    speaking(
      "ja-m22-1-1-speak-ichiban",
      "いちばん おいしいです",
      "It's the most delicious.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m22-1-1-rev-mcq-1", M22_1_1_REVIEW[0], M22_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m22-1-1-rev-lc-1",
      audioText: M22_1_1_REVIEW[1].kana,
      correctMeaningEn: M22_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_1_1_REVIEW[2].meaningEn,
        M22_1_1_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m22-1-1-rev-speak-1", M22_1_1_REVIEW[2].kana, M22_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m22-1-1-rev", M22_1_1_REVIEW),
    infoStep(
      "ja-m22-1-1-info-end",
      "You can now say things are the same, different, more, or the most",
      "Five comparison words: おなじ, ちがう, もっと, いちばん, ほう — the foundation for everything that follows.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_1_1.steps);
assertAnswerRotation(M22_1_1.steps, 1);
assertNoConsecutiveSame(M22_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-1-2 — Comparison vocab practice
//   (drill おなじ, ちがう, もっと, いちばん + food vocab)
// ═══════════════════════════════════════════════════════════════════════

const M22_1_2_REVIEW = pickReviewAtoms("ja-m22-1-2-rev", M22_REVIEW_POOL, 6);

export const M22_1_2: LessonContent = {
  id: "ja-m22-1-2",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "Comparison words II",
  description:
    "Practice comparison words in food and city contexts. Introduce レストラン, ラーメン, カレー.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-1-2-info-open",
      "Comparing food and places",
      "Time to use those comparison words with food and cities. Three new food words to work with.",
    ),
    // ── レストラン (restaurant) ──
    build(
      "ja-m22-1-2-build-resutoran",
      "Pick the Japanese word for: Restaurant",
      "レストラン",
      ["ラーメン", "カレー", "レストラン", "パスタ"],
      ["レストラン"],
    ),
    vocabMcq(
      "ja-m22-1-2-mcq-resutoran",
      { kana: "レストラン", meaningEn: "restaurant", emoji: "🍽️", fromModule: "m22" },
      M22_REVIEW_POOL,
    ),
    // ── ラーメン (ramen) ──
    build(
      "ja-m22-1-2-build-raamen",
      "Pick the Japanese word for: Ramen",
      "ラーメン",
      ["レストラン", "ラーメン", "カレー", "パスタ"],
      ["ラーメン"],
    ),
    listeningCompSentence({
      id: "ja-m22-1-2-lc-raamen",
      audioText: "ラーメン",
      correctMeaningEn: "ramen",
      distractorsEn: ["restaurant", "curry", "pasta"],
    }),
    // ── カレー (curry) ──
    build(
      "ja-m22-1-2-build-karee",
      "Pick the Japanese word for: Curry",
      "カレー",
      ["ラーメン", "レストラン", "パスタ", "カレー"],
      ["カレー"],
    ),
    speaking("ja-m22-1-2-speak-karee", "カレー", "Curry"),
    // ── Context drills ──
    sentenceMcq({
      id: "ja-m22-1-2-mcq-motto-oishii",
      prompt: "Which sentence means 'Ramen is more delicious.'?",
      correctKana: "ラーメンは もっと おいしいです。",
      distractorsKana: [
        "ラーメンは いちばん おいしいです。",
        "カレーは もっと おいしいです。",
        "ラーメンは おなじです。",
      ],
      explanation: "もっと = more. もっと おいしい = more delicious.",
    }),
    build(
      "ja-m22-1-2-build-ichiban-oishii",
      "Say: This restaurant is the best.",
      "この レストランが いちばんです",
      ["いちばん", "この", "が", "レストラン", "あの", "です", "もっと"],
      ["この", "レストラン", "が", "いちばん", "です"],
    ),
    cloze(
      "ja-m22-1-2-cloze-ga",
      "ラーメン",
      " いちばん おいしいです。",
      "が",
      ["が", "は", "を", "の"],
      "Ramen is the most delicious.",
      "ラーメンが いちばん おいしいです。",
      "が marks ramen as the 'number one' — it IS the most delicious.",
    ),
    listeningBuildSentence({
      id: "ja-m22-1-2-lb-chigau",
      target: "カレーと ラーメンは ちがいます",
      tiles: ["ラーメン", "ちがいます", "と", "カレー", "は", "おなじ", "です"],
      correctOrder: ["カレー", "と", "ラーメン", "は", "ちがいます"],
      promptEn: "Hear it, build it: 'Curry and ramen are different.'",
    }),
    listeningCompSentence({
      id: "ja-m22-1-2-lc-onaji",
      audioText: "この レストランと あの レストランは おなじです",
      correctMeaningEn: "This restaurant and that restaurant are the same.",
      distractorsEn: [
        "This restaurant is different.",
        "That restaurant is the best.",
        "This restaurant is more delicious.",
      ],
    }),
    cloze(
      "ja-m22-1-2-cloze-to",
      "ラーメン",
      " カレーは おなじです。",
      "と",
      ["と", "は", "が", "の"],
      "Ramen and curry are the same.",
      "ラーメンと カレーは おなじです。",
      "と connects ramen AND curry for comparison.",
    ),
    selfExplain({
      id: "ja-m22-1-2-self-explain",
      anchorLabel: "ラーメンが いちばん おいしいです",
      anchorAudioText: "ラーメンが いちばん おいしいです",
      question: "Why が instead of は with いちばん?",
      rule: { text: "が highlights the new-information pick — 'ramen is THE ONE that's most delicious.' With いちばん, が marks the winner." },
      surface: { text: "が is always used with food words." },
      distractor: { text: "が means 'more than' — it replaces もっと here." },
      ruleExplanation:
        "In superlative statements, が marks the item being singled out. は would mark a known topic, but いちばん identifies a new fact.",
    }),
    speaking(
      "ja-m22-1-2-speak-motto",
      "もっと おいしいです",
      "It's more delicious.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m22-1-2-rev-mcq-1", M22_1_2_REVIEW[0], M22_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m22-1-2-rev-lc-1",
      audioText: M22_1_2_REVIEW[1].kana,
      correctMeaningEn: M22_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_1_2_REVIEW[2].meaningEn,
        M22_1_2_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[1].meaningEn,
      ],
    }),
    speaking("ja-m22-1-2-rev-speak-1", M22_1_2_REVIEW[2].kana, M22_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m22-1-2-rev", M22_1_2_REVIEW),
    infoStep(
      "ja-m22-1-2-info-end",
      "You can now compare foods and restaurants using もっと and いちばん",
      "Comparison vocab in context — レストラン, ラーメン, カレー with おなじ, ちがう, もっと, いちばん.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_1_2.steps);
assertAnswerRotation(M22_1_2.steps, 1);
assertNoConsecutiveSame(M22_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-2-1 — "A is more than B" intro
//   (〜のほうが〜より pattern + food vocab)
// ═══════════════════════════════════════════════════════════════════════

const M22_2_1_REVIEW = pickReviewAtoms("ja-m22-2-1-rev", M22_REVIEW_POOL, 6);

export const M22_2_1: LessonContent = {
  id: "ja-m22-2-1",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "A is more than B (intro)",
  description:
    "The のほうが〜より comparison pattern + にく, さかな, やさい.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-2-1-info-open",
      "Comparing two things",
      "The core comparison: 'A is more [adj] than B.' Three food words to compare.",
    ),
    RULE_HOU_GA_YORI,
    // ── にく (meat) ──
    build(
      "ja-m22-2-1-build-niku",
      "Pick the Japanese word for: Meat",
      "にく",
      ["さかな", "にく", "やさい", "くだもの"],
      ["にく"],
    ),
    vocabMcq(
      "ja-m22-2-1-mcq-niku",
      { kana: "にく", meaningEn: "meat", emoji: "🥩", fromModule: "m22" },
      M22_REVIEW_POOL,
    ),
    // ── さかな (fish) ──
    build(
      "ja-m22-2-1-build-sakana",
      "Pick the Japanese word for: Fish",
      "さかな",
      ["にく", "やさい", "さかな", "くだもの"],
      ["さかな"],
    ),
    vocabMcq(
      "ja-m22-2-1-mcq-sakana",
      { kana: "さかな", meaningEn: "fish", emoji: "🐟", fromModule: "m22" },
      M22_REVIEW_POOL,
    ),
    // ── やさい (vegetables) ──
    build(
      "ja-m22-2-1-build-yasai",
      "Pick the Japanese word for: Vegetables",
      "やさい",
      ["にく", "さかな", "くだもの", "やさい"],
      ["やさい"],
    ),
    speaking("ja-m22-2-1-speak-yasai", "やさい", "Vegetables"),
    // ── のほうが〜より drills ──
    build(
      "ja-m22-2-1-build-hou-niku",
      "Say: Meat is more expensive than fish.",
      "にくのほうが さかなより たかいです",
      ["さかな", "たかい", "にく", "より", "のほうが", "やすい", "です"],
      ["にく", "のほうが", "さかな", "より", "たかい", "です"],
    ),
    sentenceMcq({
      id: "ja-m22-2-1-mcq-comparison",
      prompt: "Which sentence means 'Fish is more delicious than meat.'?",
      correctKana: "さかなのほうが にくより おいしいです。",
      distractorsKana: [
        "にくのほうが さかなより おいしいです。",
        "さかなと にくは おなじです。",
        "にくが いちばん おいしいです。",
      ],
      explanation: "さかなのほうが = the side of fish (the winner). にくより = compared to meat.",
    }),
    cloze(
      "ja-m22-2-1-cloze-yori",
      "にくのほうが やさい",
      " たかいです。",
      "より",
      ["より", "のほうが", "は", "が"],
      "Meat is more expensive than vegetables.",
      "にくのほうが やさいより たかいです。",
      "より marks the baseline — vegetables are what meat is compared to.",
    ),
    listeningCompSentence({
      id: "ja-m22-2-1-lc-hou",
      audioText: "さかなのほうが やさいより たかいです",
      correctMeaningEn: "Fish is more expensive than vegetables.",
      distractorsEn: [
        "Vegetables are more expensive than fish.",
        "Fish and vegetables are the same price.",
        "Fish is the most expensive.",
      ],
    }),
    cloze(
      "ja-m22-2-1-cloze-nohouga",
      "さかな",
      " にくより おいしいです。",
      "のほうが",
      ["のほうが", "より", "は", "が"],
      "Fish is more delicious than meat.",
      "さかなのほうが にくより おいしいです。",
      "のほうが marks the winner — fish is THE more delicious one.",
    ),
    selfExplain({
      id: "ja-m22-2-1-self-explain",
      anchorLabel: "にくのほうが さかなより たかいです",
      anchorAudioText: "にくのほうが さかなより たかいです",
      question: "In this sentence, which food is more expensive?",
      rule: { text: "にく (meat) is more expensive. のほうが marks the winner — the one that IS more [adj]." },
      surface: { text: "さかな (fish) is more expensive because より marks the expensive one." },
      distractor: { text: "They're the same price — のほうが and より cancel out." },
      ruleExplanation:
        "のほうが = 'the side of (winner).' より = 'compared to (baseline).' The のほうが item is always 'more [adj].'",
    }),
    speaking(
      "ja-m22-2-1-speak-hou",
      "りんごのほうが バナナより おおきいです",
      "Apples are bigger than bananas.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m22-2-1-rev-mcq-1", M22_2_1_REVIEW[0], M22_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m22-2-1-rev-lc-1",
      audioText: M22_2_1_REVIEW[1].kana,
      correctMeaningEn: M22_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_2_1_REVIEW[2].meaningEn,
        M22_2_1_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[2].meaningEn,
      ],
    }),
    speaking("ja-m22-2-1-rev-speak-1", M22_2_1_REVIEW[2].kana, M22_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m22-2-1-rev", M22_2_1_REVIEW),
    infoStep(
      "ja-m22-2-1-info-end",
      "You can now say which of two foods is more expensive or delicious",
      "のほうが〜より comparison with にく, さかな, やさい — production-ready.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_2_1.steps);
assertAnswerRotation(M22_2_1.steps, 1);
assertNoConsecutiveSame(M22_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-2-2 — "A is more than B" practice
//   (drill のほうが〜より with broader adjectives)
// ═══════════════════════════════════════════════════════════════════════

const M22_2_2_REVIEW = pickReviewAtoms("ja-m22-2-2-rev", M22_REVIEW_POOL, 6);

export const M22_2_2: LessonContent = {
  id: "ja-m22-2-2",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "A is more than B (practice)",
  description:
    "Drill のほうが〜より with city and food comparisons. Introduce くだもの, りょうり.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-2-2-info-open",
      "More comparisons",
      "Comparing cities, foods, and sizes — eight drills to make のほうが〜より automatic.",
    ),
    // ── くだもの (fruit) ──
    build(
      "ja-m22-2-2-build-kudamono",
      "Pick the Japanese word for: Fruit",
      "くだもの",
      ["やさい", "くだもの", "にく", "さかな"],
      ["くだもの"],
    ),
    vocabMcq(
      "ja-m22-2-2-mcq-kudamono",
      { kana: "くだもの", meaningEn: "fruit", emoji: "🍎", fromModule: "m22" },
      M22_REVIEW_POOL,
    ),
    // ── りょうり (cooking/cuisine) ──
    build(
      "ja-m22-2-2-build-ryouri",
      "Pick the Japanese word for: Cooking / Cuisine",
      "りょうり",
      ["くだもの", "やさい", "りょうり", "レストラン"],
      ["りょうり"],
    ),
    listeningCompSentence({
      id: "ja-m22-2-2-lc-ryouri",
      audioText: "りょうり",
      correctMeaningEn: "cooking / cuisine",
      distractorsEn: ["fruit", "vegetables", "restaurant"],
    }),
    // ── おおい (many) — backlog weave ──
    build(
      "ja-m22-2-2-build-ooi",
      "Pick the Japanese word for: Many / Numerous",
      "おおい",
      ["すくない", "おなじ", "おおい", "ちがう"],
      ["おおい"],
    ),
    build(
      "ja-m22-2-2-build-ooi-context",
      "Say: This restaurant has many dishes.",
      "この レストランは りょうりが おおいです",
      ["りょうり", "この", "おおい", "レストラン", "は", "が", "です", "すくない"],
      ["この", "レストラン", "は", "りょうり", "が", "おおい", "です"],
    ),
    // ── Comparison drills ──
    build(
      "ja-m22-2-2-build-kudamono-comp",
      "Say: Fruit is cheaper than meat.",
      "くだもののほうが にくより やすいです",
      ["にく", "やすい", "くだもの", "より", "のほうが", "たかい", "です"],
      ["くだもの", "のほうが", "にく", "より", "やすい", "です"],
    ),
    sentenceMcq({
      id: "ja-m22-2-2-mcq-city",
      prompt: "Which sentence means 'Tokyo is bigger than Osaka.'?",
      correctKana: "とうきょうのほうが おおさかより おおきいです。",
      distractorsKana: [
        "おおさかのほうが とうきょうより おおきいです。",
        "とうきょうと おおさかは おなじです。",
        "とうきょうが いちばん おおきいです。",
      ],
      explanation: "とうきょうのほうが = Tokyo's side (the bigger one). おおさかより = compared to Osaka.",
    }),
    cloze(
      "ja-m22-2-2-cloze-yori",
      "くだもののほうが やさい",
      " おいしいです。",
      "より",
      ["より", "のほうが", "は", "と"],
      "Fruit is more delicious than vegetables.",
      "くだもののほうが やさいより おいしいです。",
      "より marks the baseline for comparison.",
    ),
    listeningCompSentence({
      id: "ja-m22-2-2-lc-comp",
      audioText: "にほんりょうりのほうが おいしいです",
      correctMeaningEn: "Japanese cuisine is more delicious.",
      distractorsEn: [
        "Japanese cuisine is the same.",
        "Japanese cuisine is the most expensive.",
        "Japanese cuisine is different.",
      ],
    }),
    build(
      "ja-m22-2-2-build-sakana-oishii",
      "Say: Fish is more delicious than vegetables.",
      "さかなのほうが やさいより おいしいです",
      ["やさい", "おいしい", "さかな", "より", "のほうが", "にく", "です"],
      ["さかな", "のほうが", "やさい", "より", "おいしい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m22-2-2-lb-niku",
      target: "バナナのほうが りんごより やすいです",
      tiles: ["りんご", "やすい", "バナナ", "より", "のほうが", "たかい", "です"],
      correctOrder: ["バナナ", "のほうが", "りんご", "より", "やすい", "です"],
      promptEn: "Hear it, build it: 'Bananas are cheaper than apples.'",
    }),
    cloze(
      "ja-m22-2-2-cloze-nohouga",
      "りんご",
      " バナナより おいしいです。",
      "のほうが",
      ["のほうが", "より", "は", "が"],
      "Apples are more delicious than bananas.",
      "りんごのほうが バナナより おいしいです。",
      "のほうが marks the winner — apples are THE more delicious one.",
    ),
    translateStep({
      id: "ja-m22-2-2-translate",
      promptEn: "Vegetables are cheaper than meat.",
      acceptedAnswers: [
        "やさいのほうが にくより やすいです",
        "やさいのほうが にくより やすいです。",
      ],
      audioText: "やさいのほうが にくより やすいです",
    }),
    selfExplain({
      id: "ja-m22-2-2-self-explain",
      anchorLabel: "くだもののほうが やさいより おいしいです",
      anchorAudioText: "くだもののほうが やさいより おいしいです",
      question: "Can you drop the より part?",
      rule: { text: "Yes — when the baseline is obvious from context, you can say just Aのほうが [adj]です. The listener infers what A is compared to." },
      surface: { text: "No — より is always required; without it the comparison is broken." },
      distractor: { text: "You can drop のほうが but not より." },
      ruleExplanation:
        "In casual speech, より + B is often dropped when the comparison target is clear from context. のほうが is the essential part.",
    }),
    speaking(
      "ja-m22-2-2-speak-comp",
      "さかなのほうが やさいより おいしいです",
      "Fish is more delicious than vegetables.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m22-2-2-rev-mcq-1", M22_2_2_REVIEW[0], M22_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m22-2-2-rev-lc-1",
      audioText: M22_2_2_REVIEW[1].kana,
      correctMeaningEn: M22_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_2_2_REVIEW[2].meaningEn,
        M22_2_2_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[3].meaningEn,
      ],
    }),
    speaking("ja-m22-2-2-rev-speak-1", M22_2_2_REVIEW[2].kana, M22_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m22-2-2-rev", M22_2_2_REVIEW),
    infoStep(
      "ja-m22-2-2-info-end",
      "You can now compare any two things using のほうが〜より",
      "Comparative pattern drilled with foods and cities — you own this structure.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_2_2.steps);
assertAnswerRotation(M22_2_2.steps, 1);
assertNoConsecutiveSame(M22_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-3-1 — "The most among" intro
//   (〜のなかで〜がいちばん + city vocab)
// ═══════════════════════════════════════════════════════════════════════

const M22_3_1_REVIEW = pickReviewAtoms("ja-m22-3-1-rev", M22_REVIEW_POOL, 6);

export const M22_3_1: LessonContent = {
  id: "ja-m22-3-1",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "The most among (intro)",
  description:
    "Superlative with のなかで〜がいちばん + city names: とうきょう, おおさか, きょうと, ひろしま.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-3-1-info-open",
      "The best among a group",
      "You know いちばん already. Now the full superlative pattern: 'among X, Y is the most [adj].' Four cities to compare.",
    ),
    RULE_NAKA_DE_ICHIBAN,
    // ── おおさか (Osaka) ──
    build(
      "ja-m22-3-1-build-oosaka",
      "Pick the Japanese word for: Osaka",
      "おおさか",
      ["とうきょう", "おおさか", "きょうと", "ひろしま"],
      ["おおさか"],
    ),
    listeningCompSentence({
      id: "ja-m22-3-1-lc-oosaka",
      audioText: "おおさか",
      correctMeaningEn: "Osaka",
      distractorsEn: ["Tokyo", "Kyoto", "Hiroshima"],
    }),
    // ── きょうと (Kyoto) ──
    build(
      "ja-m22-3-1-build-kyouto",
      "Pick the Japanese word for: Kyoto",
      "きょうと",
      ["おおさか", "とうきょう", "きょうと", "ひろしま"],
      ["きょうと"],
    ),
    speaking("ja-m22-3-1-speak-kyouto", "きょうと", "Kyoto"),
    // ── ひろしま (Hiroshima) ──
    build(
      "ja-m22-3-1-build-hiroshima",
      "Pick the Japanese word for: Hiroshima",
      "ひろしま",
      ["きょうと", "おおさか", "とうきょう", "ひろしま"],
      ["ひろしま"],
    ),
    listeningCompSentence({
      id: "ja-m22-3-1-lc-hiroshima",
      audioText: "ひろしま",
      correctMeaningEn: "Hiroshima",
      distractorsEn: ["Kyoto", "Osaka", "Tokyo"],
    }),
    // ── のなかで〜がいちばん drills ──
    build(
      "ja-m22-3-1-build-ichiban-ookii",
      "Say: Among Japan, Tokyo is the biggest.",
      "にほんのなかで とうきょうが いちばん おおきいです",
      ["とうきょう", "いちばん", "にほん", "が", "のなかで", "おおさか", "おおきい", "です"],
      ["にほん", "のなかで", "とうきょう", "が", "いちばん", "おおきい", "です"],
    ),
    sentenceMcq({
      id: "ja-m22-3-1-mcq-ichiban",
      prompt: "Which sentence means 'Among Japanese cities, Kyoto is the most beautiful.'?",
      correctKana: "にほんのまちのなかで きょうとが いちばん きれいです。",
      distractorsKana: [
        "きょうとのなかで にほんが いちばん きれいです。",
        "にほんのまちのなかで おおさかが いちばん きれいです。",
        "きょうとのほうが にほんより きれいです。",
      ],
      explanation: "のなかで defines the group. が marks the winner. いちばん = most.",
    }),
    cloze(
      "ja-m22-3-1-cloze-nakade",
      "にほんのまち",
      " おおさかが いちばん にぎやかです。",
      "のなかで",
      ["のなかで", "のほうが", "より", "は"],
      "Among Japanese cities, Osaka is the liveliest.",
      "にほんのまちのなかで おおさかが いちばん にぎやかです。",
      "のなかで defines the comparison group — Japanese cities.",
    ),
    listeningCompSentence({
      id: "ja-m22-3-1-lc-ichiban",
      audioText: "くだもののなかで りんごが いちばん すきです",
      correctMeaningEn: "Among fruits, I like apples the most.",
      distractorsEn: [
        "I like apples more than fruit.",
        "Apples and fruit are the same.",
        "Apples are the most expensive fruit.",
      ],
    }),
    cloze(
      "ja-m22-3-1-cloze-ga",
      "くだもののなかで りんご",
      " いちばん おおきいです。",
      "が",
      ["が", "は", "の", "を"],
      "Among fruits, apples are the biggest.",
      "くだもののなかで りんごが いちばん おおきいです。",
      "が marks the winner — apples ARE the biggest.",
    ),
    selfExplain({
      id: "ja-m22-3-1-self-explain",
      anchorLabel: "くだもののなかで りんごが いちばん おおきいです",
      anchorAudioText: "くだもののなかで りんごが いちばん おおきいです",
      question: "What does のなかで do in this sentence?",
      rule: { text: "のなかで establishes the comparison group — 'among [fruits].' Without it, there's no defined set to be 'the most' within." },
      surface: { text: "のなかで means 'inside' — the apple is physically inside the fruit." },
      distractor: { text: "のなかで is optional — いちばん alone creates the superlative." },
      ruleExplanation:
        "のなかで = 'among / within [group].' It defines what the superlative is relative to. いちばん = 'number one.'",
    }),
    speaking(
      "ja-m22-3-1-speak-ichiban",
      "にほんのなかで とうきょうが いちばん おおきいです",
      "Among Japan, Tokyo is the biggest.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m22-3-1-rev-mcq-1", M22_3_1_REVIEW[0], M22_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m22-3-1-rev-lc-1",
      audioText: M22_3_1_REVIEW[1].kana,
      correctMeaningEn: M22_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_3_1_REVIEW[2].meaningEn,
        M22_3_1_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[4].meaningEn,
      ],
    }),
    speaking("ja-m22-3-1-rev-speak-1", M22_3_1_REVIEW[2].kana, M22_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m22-3-1-rev", M22_3_1_REVIEW),
    infoStep(
      "ja-m22-3-1-info-end",
      "You can now say which city or food is the most anything in a group",
      "のなかで〜がいちばん — the superlative pattern. Four Japanese cities learned.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_3_1.steps);
assertAnswerRotation(M22_3_1.steps, 1);
assertNoConsecutiveSame(M22_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-3-2 — "The most among" practice
//   (drill のなかで〜がいちばん with mixed categories)
// ═══════════════════════════════════════════════════════════════════════

const M22_3_2_REVIEW = pickReviewAtoms("ja-m22-3-2-rev", M22_REVIEW_POOL, 6);

export const M22_3_2: LessonContent = {
  id: "ja-m22-3-2",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "The most among (practice)",
  description:
    "Drill superlatives with food, cities, and adjective variety. Introduce ゆうめい, しずか, にぎやか.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-3-2-info-open",
      "Superlative drill",
      "More practice with 'the most among.' Three new adjectives — famous, quiet, lively — for richer comparisons.",
    ),
    // ── ゆうめい (famous) ──
    build(
      "ja-m22-3-2-build-yuumei",
      "Pick the Japanese word for: Famous",
      "ゆうめい",
      ["しずか", "ゆうめい", "にぎやか", "べんり"],
      ["ゆうめい"],
    ),
    listeningCompSentence({
      id: "ja-m22-3-2-lc-yuumei",
      audioText: "ゆうめい",
      correctMeaningEn: "famous",
      distractorsEn: ["quiet", "lively", "convenient"],
    }),
    // ── しずか (quiet) ──
    build(
      "ja-m22-3-2-build-shizuka",
      "Pick the Japanese word for: Quiet",
      "しずか",
      ["ゆうめい", "にぎやか", "しずか", "きれい"],
      ["しずか"],
    ),
    speaking("ja-m22-3-2-speak-shizuka", "しずか", "Quiet"),
    // ── にぎやか (lively) ──
    build(
      "ja-m22-3-2-build-nigiyaka",
      "Pick the Japanese word for: Lively / Bustling",
      "にぎやか",
      ["しずか", "ゆうめい", "べんり", "にぎやか"],
      ["にぎやか"],
    ),
    listeningCompSentence({
      id: "ja-m22-3-2-lc-nigiyaka",
      audioText: "にぎやか",
      correctMeaningEn: "lively / bustling",
      distractorsEn: ["quiet", "famous", "convenient"],
    }),
    // ── すくない (few) — backlog weave ──
    build(
      "ja-m22-3-2-build-sukunai",
      "Pick the Japanese word for: Few / Not many",
      "すくない",
      ["おおい", "すくない", "しずか", "にぎやか"],
      ["すくない"],
    ),
    build(
      "ja-m22-3-2-build-sukunai-context",
      "Say: There are few vegetables.",
      "やさいが すくないです",
      ["すくない", "やさい", "おおい", "が", "です"],
      ["やさい", "が", "すくない", "です"],
    ),
    // ── Mixed superlative drills ──
    build(
      "ja-m22-3-2-build-yuumei-kyouto",
      "Say: Among Japanese cities, Kyoto is the most famous.",
      "にほんのまちのなかで きょうとが いちばん ゆうめいです",
      ["きょうと", "ゆうめい", "にほんのまち", "が", "のなかで", "いちばん", "おおさか", "です"],
      ["にほんのまち", "のなかで", "きょうと", "が", "いちばん", "ゆうめい", "です"],
    ),
    sentenceMcq({
      id: "ja-m22-3-2-mcq-shizuka",
      prompt: "Which means 'Among these restaurants, this one is the quietest.'?",
      correctKana: "この レストランのなかで これが いちばん しずかです。",
      distractorsKana: [
        "この レストランが いちばん にぎやかです。",
        "この レストランのほうが しずかです。",
        "この レストランは しずかです。",
      ],
      explanation: "のなかで + がいちばん = the most within the group.",
    }),
    cloze(
      "ja-m22-3-2-cloze-ichiban",
      "おおさかが ",
      " にぎやかです。",
      "いちばん",
      ["いちばん", "もっと", "より", "おなじ"],
      "Osaka is the liveliest.",
      "おおさかが いちばん にぎやかです。",
      "いちばん = most / number one — creates the superlative.",
    ),
    listeningBuildSentence({
      id: "ja-m22-3-2-lb-yuumei",
      target: "きょうとが いちばん ゆうめいです",
      tiles: ["いちばん", "きょうと", "ゆうめい", "が", "もっと", "おおさか", "です"],
      correctOrder: ["きょうと", "が", "いちばん", "ゆうめい", "です"],
      promptEn: "Hear it, build it: 'Kyoto is the most famous.'",
    }),
    cloze(
      "ja-m22-3-2-cloze-nakade",
      "くだもの",
      " りんごが いちばん おいしいです。",
      "のなかで",
      ["のなかで", "のほうが", "より", "と"],
      "Among fruits, apples are the most delicious.",
      "くだもののなかで りんごが いちばん おいしいです。",
      "のなかで sets the comparison group.",
    ),
    translateStep({
      id: "ja-m22-3-2-translate",
      promptEn: "Among Japanese cities, Tokyo is the liveliest.",
      acceptedAnswers: [
        "にほんのまちのなかで とうきょうが いちばん にぎやかです",
        "にほんのまちのなかで とうきょうが いちばん にぎやかです。",
      ],
      audioText: "にほんのまちのなかで とうきょうが いちばん にぎやかです",
    }),
    selfExplain({
      id: "ja-m22-3-2-self-explain",
      anchorLabel: "きょうとが いちばん ゆうめいです",
      anchorAudioText: "きょうとが いちばん ゆうめいです",
      question: "How is のなかで〜がいちばん different from のほうが〜より?",
      rule: { text: "のなかで〜がいちばん picks the TOP ONE from a group of 3+. のほうが〜より compares exactly TWO things." },
      surface: { text: "They mean the same thing — both compare two items." },
      distractor: { text: "のなかで is informal; のほうが is formal. Same meaning." },
      ruleExplanation:
        "のほうが〜より = 'A is more than B' (2 items). のなかで〜がいちばん = 'among the group, X is the most' (3+ items).",
    }),
    speaking(
      "ja-m22-3-2-speak-ichiban",
      "おおさかが いちばん にぎやかです",
      "Osaka is the liveliest.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m22-3-2-rev-mcq-1", M22_3_2_REVIEW[0], M22_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m22-3-2-rev-lc-1",
      audioText: M22_3_2_REVIEW[1].kana,
      correctMeaningEn: M22_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_3_2_REVIEW[2].meaningEn,
        M22_3_2_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[5].meaningEn,
      ],
    }),
    speaking("ja-m22-3-2-rev-speak-1", M22_3_2_REVIEW[2].kana, M22_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m22-3-2-rev", M22_3_2_REVIEW),
    infoStep(
      "ja-m22-3-2-info-end",
      "You can now pick the most famous, quiet, or lively from any group",
      "Superlative with ゆうめい, しずか, にぎやか — the pattern is automatic now.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_3_2.steps);
assertAnswerRotation(M22_3_2.steps, 1);
assertNoConsecutiveSame(M22_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-4-1 — "Which of two?" intro
//   (どちら/どっち + city/food comparisons)
// ═══════════════════════════════════════════════════════════════════════

const M22_4_1_REVIEW = pickReviewAtoms("ja-m22-4-1-rev", M22_REVIEW_POOL, 6);

export const M22_4_1: LessonContent = {
  id: "ja-m22-4-1",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "Which of two? (intro)",
  description:
    "Asking 'which of two?' with どちら/どっち + べんり, ふべん, きれい.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-4-1-info-open",
      "Choosing between two",
      "You can compare A and B. Now ask: 'which one is more [adj]?' Plus three useful adjectives — convenient, inconvenient, beautiful.",
    ),
    RULE_DOCHIRA,
    // ── べんり (convenient) ──
    build(
      "ja-m22-4-1-build-benri",
      "Pick the Japanese word for: Convenient",
      "べんり",
      ["ふべん", "きれい", "べんり", "ゆうめい"],
      ["べんり"],
    ),
    listeningCompSentence({
      id: "ja-m22-4-1-lc-benri",
      audioText: "べんり",
      correctMeaningEn: "convenient",
      distractorsEn: ["inconvenient", "beautiful", "famous"],
    }),
    // ── ふべん (inconvenient) ──
    build(
      "ja-m22-4-1-build-fuben",
      "Pick the Japanese word for: Inconvenient",
      "ふべん",
      ["べんり", "ふべん", "しずか", "にぎやか"],
      ["ふべん"],
    ),
    speaking("ja-m22-4-1-speak-fuben", "ふべん", "Inconvenient"),
    // ── きれい (beautiful/clean) ──
    build(
      "ja-m22-4-1-build-kirei",
      "Pick the Japanese word for: Beautiful / Clean",
      "きれい",
      ["ゆうめい", "しずか", "にぎやか", "きれい"],
      ["きれい"],
    ),
    listeningCompSentence({
      id: "ja-m22-4-1-lc-kirei",
      audioText: "きれい",
      correctMeaningEn: "beautiful / clean",
      distractorsEn: ["famous", "quiet", "lively"],
    }),
    // ── どちら drills ──
    build(
      "ja-m22-4-1-build-dochira",
      "Ask: Which is more convenient, the train or the bus?",
      "でんしゃと バスと どちらが べんりですか",
      ["バス", "どちら", "でんしゃ", "と", "が", "と", "べんり", "か", "です"],
      ["でんしゃ", "と", "バス", "と", "どちら", "が", "べんり", "です", "か"],
    ),
    sentenceMcq({
      id: "ja-m22-4-1-mcq-dochira",
      prompt: "Which sentence asks 'Which do you like more, ramen or curry?'",
      correctKana: "ラーメンと カレーと どちらが すきですか。",
      distractorsKana: [
        "ラーメンのほうが カレーより すきです。",
        "ラーメンと カレーの どれが すきですか。",
        "ラーメンが いちばん すきですか。",
      ],
      explanation: "AとBと どちらが = which of two. どちら for exactly two choices.",
    }),
    cloze(
      "ja-m22-4-1-cloze-dochira",
      "とうきょうと おおさかと ",
      "が おおきいですか。",
      "どちら",
      ["どちら", "どれ", "なに", "だれ"],
      "Which is bigger, Tokyo or Osaka?",
      "とうきょうと おおさかと どちらが おおきいですか。",
      "どちら asks 'which of two' — perfect for a pair comparison.",
    ),
    listeningCompSentence({
      id: "ja-m22-4-1-lc-dochira",
      audioText: "コーヒーと おちゃと どちらが すきですか",
      correctMeaningEn: "Which do you like more, coffee or tea?",
      distractorsEn: [
        "Do you like coffee and tea?",
        "Coffee is more delicious than tea.",
        "Which is the most delicious?",
      ],
    }),
    build(
      "ja-m22-4-1-build-answer",
      "Answer: The train is more convenient.",
      "でんしゃのほうが べんりです",
      ["べんり", "でんしゃ", "バス", "のほうが", "ふべん", "です"],
      ["でんしゃ", "のほうが", "べんり", "です"],
    ),
    selfExplain({
      id: "ja-m22-4-1-self-explain",
      anchorLabel: "AとBと どちらが〜ですか",
      anchorAudioText: "コーヒーと おちゃと どちらが すきですか",
      question: "Why どちら and not どれ?",
      rule: { text: "どちら is for choosing between exactly two options. どれ is for three or more." },
      surface: { text: "どちら is formal Japanese; どれ is casual. They mean the same." },
      distractor: { text: "どちら is for people; どれ is for things." },
      ruleExplanation:
        "Two choices = どちら. Three+ choices = どれ. This parallels the こそあど system.",
    }),
    speaking(
      "ja-m22-4-1-speak-dochira",
      "ラーメンと カレーと どちらが おいしいですか",
      "Which is more delicious, ramen or curry?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m22-4-1-rev-mcq-1", M22_4_1_REVIEW[0], M22_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m22-4-1-rev-lc-1",
      audioText: M22_4_1_REVIEW[1].kana,
      correctMeaningEn: M22_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_4_1_REVIEW[2].meaningEn,
        M22_4_1_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[6].meaningEn,
      ],
    }),
    speaking("ja-m22-4-1-rev-speak-1", M22_4_1_REVIEW[2].kana, M22_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m22-4-1-rev", M22_4_1_REVIEW),
    infoStep(
      "ja-m22-4-1-info-end",
      "You can now ask which of two things someone prefers",
      "どちらが + adjective — the question pattern for pair comparisons.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_4_1.steps);
assertAnswerRotation(M22_4_1.steps, 1);
assertNoConsecutiveSame(M22_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-4-2 — "Which of two?" practice
//   (drill どちら/どっち with answer patterns)
// ═══════════════════════════════════════════════════════════════════════

const M22_4_2_REVIEW = pickReviewAtoms("ja-m22-4-2-rev", M22_REVIEW_POOL, 6);

export const M22_4_2: LessonContent = {
  id: "ja-m22-4-2",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "Which of two? (practice)",
  description:
    "Drill どちら/どっち questions + のほうが answers with パスタ, まち vocab.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-4-2-info-open",
      "Asking and answering",
      "Full Q&A drills: ask with どちら, answer with のほうが. Plus パスタ and まち.",
    ),
    // ── パスタ (pasta) ──
    build(
      "ja-m22-4-2-build-pasuta",
      "Pick the Japanese word for: Pasta",
      "パスタ",
      ["ラーメン", "パスタ", "カレー", "レストラン"],
      ["パスタ"],
    ),
    listeningCompSentence({
      id: "ja-m22-4-2-lc-pasuta",
      audioText: "パスタ",
      correctMeaningEn: "pasta",
      distractorsEn: ["ramen", "curry", "restaurant"],
    }),
    // ── まち (town) ──
    build(
      "ja-m22-4-2-build-machi",
      "Pick the Japanese word for: Town / City",
      "まち",
      ["パスタ", "レストラン", "まち", "りょうり"],
      ["まち"],
    ),
    speaking("ja-m22-4-2-speak-machi", "まち", "Town / City"),
    // ── いろいろ (various) — backlog weave ──
    build(
      "ja-m22-4-2-build-iroiro",
      "Pick the Japanese word for: Various / All kinds of",
      "いろいろ",
      ["いちばん", "おなじ", "いろいろ", "ちがう"],
      ["いろいろ"],
    ),
    build(
      "ja-m22-4-2-build-iroiro-context",
      "Say: There are various restaurants in this town.",
      "この まちに いろいろな レストランが あります",
      ["レストラン", "この", "いろいろな", "まち", "に", "が", "あります", "おなじ"],
      ["この", "まち", "に", "いろいろな", "レストラン", "が", "あります"],
    ),
    // ── Q&A drills ──
    build(
      "ja-m22-4-2-build-docchi",
      "Ask (casually): Which is cheaper, pasta or curry?",
      "パスタと カレーと どっちが やすいですか",
      ["カレー", "どっち", "パスタ", "と", "が", "と", "やすい", "か", "です"],
      ["パスタ", "と", "カレー", "と", "どっち", "が", "やすい", "です", "か"],
    ),
    sentenceMcq({
      id: "ja-m22-4-2-mcq-docchi",
      prompt: "Which is the casual version of 'Which of two?'",
      correctKana: "どっち",
      distractorsKana: ["どちら", "どれ", "どの"],
      explanation: "どっち is casual; どちら is formal. Both mean 'which of two.'",
    }),
    cloze(
      "ja-m22-4-2-cloze-nohouga",
      "パスタ",
      " やすいです。",
      "のほうが",
      ["のほうが", "より", "は", "が"],
      "Pasta is cheaper.",
      "パスタのほうが やすいです。",
      "のほうが answers the どちら question — pasta is the cheaper one.",
    ),
    listeningBuildSentence({
      id: "ja-m22-4-2-lb-dochira",
      target: "にくと さかなと どちらが すきですか",
      tiles: ["さかな", "どちら", "にく", "と", "が", "と", "すき", "か", "です"],
      correctOrder: ["にく", "と", "さかな", "と", "どちら", "が", "すき", "です", "か"],
      promptEn: "Hear it, build it: 'Which do you like more, meat or fish?'",
    }),
    sentenceMcq({
      id: "ja-m22-4-2-mcq-answer",
      prompt: "How do you answer 'Fish is more delicious.'?",
      correctKana: "さかなのほうが おいしいです。",
      distractorsKana: [
        "さかなより おいしいです。",
        "さかなが いちばん おいしいです。",
        "さかなは おなじです。",
      ],
      explanation: "Xのほうが answers a どちら question — X is the more [adj] one.",
    }),
    cloze(
      "ja-m22-4-2-cloze-dochira",
      "きょうとと おおさかと ",
      "が きれいですか。",
      "どちら",
      ["どちら", "どれ", "なに", "だれ"],
      "Which is more beautiful, Kyoto or Osaka?",
      "きょうとと おおさかと どちらが きれいですか。",
      "どちら for choosing between exactly two.",
    ),
    listeningCompSentence({
      id: "ja-m22-4-2-lc-answer",
      audioText: "きょうとのほうが きれいです",
      correctMeaningEn: "Kyoto is more beautiful.",
      distractorsEn: [
        "Osaka is more beautiful.",
        "They are the same.",
        "Kyoto is the most beautiful.",
      ],
    }),
    build(
      "ja-m22-4-2-build-dochiramo",
      "Say: Both are delicious.",
      "どちらも おいしいです",
      ["おいしい", "どちら", "のほうが", "も", "より", "です"],
      ["どちら", "も", "おいしい", "です"],
    ),
    translateStep({
      id: "ja-m22-4-2-translate",
      promptEn: "Which do you like more, sushi or ramen?",
      acceptedAnswers: [
        "すしと ラーメンと どちらが すきですか",
        "すしと ラーメンと どちらが すきですか。",
        "すしと ラーメンと どっちが すきですか",
        "すしと ラーメンと どっちが すきですか。",
      ],
      audioText: "すしと ラーメンと どちらが すきですか",
    }),
    selfExplain({
      id: "ja-m22-4-2-self-explain",
      anchorLabel: "どちらも おいしいです",
      anchorAudioText: "どちらも おいしいです",
      question: "What does どちらも mean?",
      rule: { text: "どちらも = both. も replaces が to mean 'both options equally.' It's the diplomatic answer to a どちら question." },
      surface: { text: "どちらも asks 'which of all?' — it's a broader question." },
      distractor: { text: "どちらも means 'neither' — both are rejected." },
      ruleExplanation:
        "どちらも + [adj] = 'both are [adj].' It's the polite way to avoid choosing between two.",
    }),
    speaking(
      "ja-m22-4-2-speak-dochira",
      "でんしゃと バスと どちらが べんりですか",
      "Which is more convenient, the train or the bus?",
    ),
    // ── Review tail ──
    speaking("ja-m22-4-2-rev-speak-1", M22_4_2_REVIEW[0].kana, M22_4_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m22-4-2-rev-lc-1",
      audioText: M22_4_2_REVIEW[1].kana,
      correctMeaningEn: M22_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_4_2_REVIEW[2].meaningEn,
        M22_4_2_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[7].meaningEn,
      ],
    }),
    vocabMcq("ja-m22-4-2-rev-mcq-1", M22_4_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M22_REVIEW_POOL),
    reviewMatchPairs("ja-m22-4-2-rev", M22_4_2_REVIEW),
    infoStep(
      "ja-m22-4-2-info-end",
      "You can now ask and answer 'which of two' for any comparison",
      "どちら/どっち questions + のほうが answers — full Q&A loop.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_4_2.steps);
assertAnswerRotation(M22_4_2.steps, 1);
assertNoConsecutiveSame(M22_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-5-1 — Interleaved drill (comparative + superlative)
// ═══════════════════════════════════════════════════════════════════════

const M22_5_1_REVIEW = pickReviewAtoms("ja-m22-5-1-rev", M22_REVIEW_POOL, 6);

export const M22_5_1: LessonContent = {
  id: "ja-m22-5-1",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "Comparison interleave I",
  description:
    "Mix comparative (のほうが〜より) and superlative (のなかで〜がいちばん) patterns.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-5-1-info-open",
      "Mixing comparisons",
      "Comparative (two things) and superlative (three+) back-to-back. Can you switch between them smoothly?",
    ),
    // ── Interleaved drills ──
    cloze(
      "ja-m22-5-1-cloze-yori",
      "おおさかのほうが ひろしま",
      " おおきいです。",
      "より",
      ["より", "のほうが", "のなかで", "が"],
      "Osaka is bigger than Hiroshima.",
      "おおさかのほうが ひろしまより おおきいです。",
      "より marks the baseline — Hiroshima is what Osaka is compared to.",
    ),
    build(
      "ja-m22-5-1-build-ichiban-shizuka",
      "Say: Among these cities, Kyoto is the quietest.",
      "この まちのなかで きょうとが いちばん しずかです",
      ["きょうと", "しずか", "この", "まち", "が", "のなかで", "いちばん", "おおさか", "です"],
      ["この", "まち", "のなかで", "きょうと", "が", "いちばん", "しずか", "です"],
    ),
    sentenceMcq({
      id: "ja-m22-5-1-mcq-yori",
      prompt: "Which means 'Curry is more expensive than pasta.'?",
      correctKana: "カレーのほうが パスタより たかいです。",
      distractorsKana: [
        "パスタのほうが カレーより たかいです。",
        "カレーが いちばん たかいです。",
        "カレーと パスタは おなじです。",
      ],
      explanation: "カレーのほうが = curry is the more expensive one.",
    }),
    listeningCompSentence({
      id: "ja-m22-5-1-lc-nakade",
      audioText: "りょうりのなかで ラーメンが いちばん すきです",
      correctMeaningEn: "Among foods, I like ramen the most.",
      distractorsEn: [
        "Ramen is more delicious than other foods.",
        "I like ramen and food the same.",
        "Ramen is the most expensive food.",
      ],
    }),
    cloze(
      "ja-m22-5-1-cloze-nakade",
      "くだもの",
      " バナナが いちばん やすいです。",
      "のなかで",
      ["のなかで", "のほうが", "より", "と"],
      "Among fruits, bananas are the cheapest.",
      "くだもののなかで バナナが いちばん やすいです。",
      "のなかで defines the comparison group.",
    ),
    build(
      "ja-m22-5-1-build-hou-benri",
      "Say: The train is more convenient than the bus.",
      "でんしゃのほうが バスより べんりです",
      ["バス", "べんり", "でんしゃ", "より", "のほうが", "ふべん", "です"],
      ["でんしゃ", "のほうが", "バス", "より", "べんり", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m22-5-1-lb-dochira",
      target: "にくと さかなと どちらが たかいですか",
      tiles: ["さかな", "どちら", "にく", "と", "が", "と", "たかい", "か", "です"],
      correctOrder: ["にく", "と", "さかな", "と", "どちら", "が", "たかい", "です", "か"],
      promptEn: "Hear it, build it: 'Which is more expensive, meat or fish?'",
    }),
    sentenceMcq({
      id: "ja-m22-5-1-mcq-ichiban",
      prompt: "Which means 'Among these restaurants, that one is the best.'?",
      correctKana: "この レストランのなかで あれが いちばん いいです。",
      distractorsKana: [
        "あの レストランのほうが いいです。",
        "あの レストランより いいです。",
        "この レストランが おなじです。",
      ],
      explanation: "のなかで + がいちばん = superlative (best among the group).",
    }),
    cloze(
      "ja-m22-5-1-cloze-nohouga",
      "きょうと",
      " おおさかより しずかです。",
      "のほうが",
      ["のほうが", "より", "のなかで", "が"],
      "Kyoto is quieter than Osaka.",
      "きょうとのほうが おおさかより しずかです。",
      "のほうが marks the winner in a pair comparison.",
    ),
    translateStep({
      id: "ja-m22-5-1-translate",
      promptEn: "Among Japanese dishes, sushi is the most famous.",
      acceptedAnswers: [
        "にほんりょうりのなかで すしが いちばん ゆうめいです",
        "にほんりょうりのなかで すしが いちばん ゆうめいです。",
      ],
      audioText: "にほんりょうりのなかで すしが いちばん ゆうめいです",
    }),
    listeningCompSentence({
      id: "ja-m22-5-1-lc-hou",
      audioText: "ラーメンのほうが パスタより やすいです",
      correctMeaningEn: "Ramen is cheaper than pasta.",
      distractorsEn: [
        "Pasta is cheaper than ramen.",
        "Ramen is the cheapest.",
        "Ramen and pasta are the same price.",
      ],
    }),
    selfExplain({
      id: "ja-m22-5-1-self-explain",
      anchorLabel: "のほうが vs のなかで — two patterns",
      anchorAudioText: "きょうとのほうが しずかです",
      question: "When do you use のなかで instead of のほうが?",
      rule: { text: "Use のなかで when comparing 3+ items to find the best. Use のほうが when comparing exactly 2 items." },
      surface: { text: "Use のなかで for adjectives and のほうが for nouns." },
      distractor: { text: "のなかで is for questions; のほうが is for answers." },
      ruleExplanation:
        "Group of 3+ = のなかで〜がいちばん. Pair of 2 = のほうが〜より.",
    }),
    speaking(
      "ja-m22-5-1-speak-mixed",
      "カレーのほうが パスタより おいしいです",
      "Curry is more delicious than pasta.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m22-5-1-rev-mcq-1", M22_5_1_REVIEW[0], M22_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m22-5-1-rev-lc-1",
      audioText: M22_5_1_REVIEW[1].kana,
      correctMeaningEn: M22_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_5_1_REVIEW[2].meaningEn,
        M22_5_1_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[8].meaningEn,
      ],
    }),
    speaking("ja-m22-5-1-rev-speak-1", M22_5_1_REVIEW[2].kana, M22_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m22-5-1-rev", M22_5_1_REVIEW),
    infoStep(
      "ja-m22-5-1-info-end",
      "You can now switch between pair comparisons and group superlatives",
      "のほうが〜より and のなかで〜がいちばん — interleaved and production-ready.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_5_1.steps);
assertAnswerRotation(M22_5_1.steps, 1);
assertNoConsecutiveSame(M22_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-5-2 — Interleaved drill II (all three patterns)
// ═══════════════════════════════════════════════════════════════════════

const M22_5_2_REVIEW = pickReviewAtoms("ja-m22-5-2-rev", M22_REVIEW_POOL, 6);

export const M22_5_2: LessonContent = {
  id: "ja-m22-5-2",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "Comparison interleave II",
  description:
    "Full rotation: comparative + superlative + どちら questions in production.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-5-2-info-open",
      "Full comparison rotation",
      "All three patterns at once: comparative, superlative, and どちら questions. Production-heavy.",
    ),
    build(
      "ja-m22-5-2-build-dochira",
      "Ask: Which is more famous, Osaka or Kyoto?",
      "おおさかと きょうとと どちらが ゆうめいですか",
      ["きょうと", "どちら", "おおさか", "と", "が", "と", "ゆうめい", "か", "です"],
      ["おおさか", "と", "きょうと", "と", "どちら", "が", "ゆうめい", "です", "か"],
    ),
    cloze(
      "ja-m22-5-2-cloze-yori",
      "カレーのほうが ラーメン",
      " やすいです。",
      "より",
      ["より", "のほうが", "のなかで", "と"],
      "Curry is cheaper than ramen.",
      "カレーのほうが ラーメンより やすいです。",
      "より marks the baseline.",
    ),
    sentenceMcq({
      id: "ja-m22-5-2-mcq-ichiban",
      prompt: "Which means 'Among the three, ramen is the most delicious.'?",
      correctKana: "みっつのなかで ラーメンが いちばん おいしいです。",
      distractorsKana: [
        "ラーメンのほうが おいしいです。",
        "ラーメンと どちらが おいしいですか。",
        "ラーメンは もっと おいしいです。",
      ],
      explanation: "みっつのなかで = among the three. がいちばん = is the most.",
    }),
    listeningCompSentence({
      id: "ja-m22-5-2-lc-dochira",
      audioText: "にくと やさいと どちらが すきですか",
      correctMeaningEn: "Which do you like more, meat or vegetables?",
      distractorsEn: [
        "Do you like meat and vegetables?",
        "Meat is more delicious than vegetables.",
        "Which of these three foods is best?",
      ],
    }),
    build(
      "ja-m22-5-2-build-nakade",
      "Say: Among this food, curry is the cheapest.",
      "この りょうりのなかで カレーが いちばん やすいです",
      ["カレー", "やすい", "この", "りょうり", "が", "のなかで", "いちばん", "ラーメン", "です"],
      ["この", "りょうり", "のなかで", "カレー", "が", "いちばん", "やすい", "です"],
    ),
    cloze(
      "ja-m22-5-2-cloze-nohouga",
      "おおさか",
      " とうきょうより にぎやかです。",
      "のほうが",
      ["のほうが", "より", "のなかで", "が"],
      "Osaka is livelier than Tokyo.",
      "おおさかのほうが とうきょうより にぎやかです。",
      "のほうが marks Osaka as the livelier one.",
    ),
    listeningBuildSentence({
      id: "ja-m22-5-2-lb-ichiban",
      target: "この レストランのなかで カレーが いちばん たかいです",
      tiles: ["カレー", "たかい", "この", "レストラン", "が", "のなかで", "いちばん", "やすい", "です"],
      correctOrder: ["この", "レストラン", "のなかで", "カレー", "が", "いちばん", "たかい", "です"],
      promptEn: "Hear it, build it: 'Among this restaurant's dishes, the curry is the most expensive.'",
    }),
    sentenceMcq({
      id: "ja-m22-5-2-mcq-docchi",
      prompt: "Which casually asks 'Which is more convenient?'",
      correctKana: "どっちが べんりですか。",
      distractorsKana: [
        "どちらが べんりですか。",
        "どれが べんりですか。",
        "なにが べんりですか。",
      ],
      explanation: "どっち is the casual form of どちら.",
    }),
    build(
      "ja-m22-5-2-build-hou-kirei",
      "Say: Kyoto is more beautiful than Hiroshima.",
      "きょうとのほうが ひろしまより きれいです",
      ["ひろしま", "きれい", "きょうと", "より", "のほうが", "しずか", "です"],
      ["きょうと", "のほうが", "ひろしま", "より", "きれい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m22-5-2-lc-ichiban-shizuka",
      audioText: "この まちのなかで きょうとが いちばん しずかです",
      correctMeaningEn: "Among these cities, Kyoto is the quietest.",
      distractorsEn: [
        "Kyoto is quieter than this city.",
        "This city and Kyoto are the same.",
        "Among these cities, Kyoto is the liveliest.",
      ],
    }),
    cloze(
      "ja-m22-5-2-cloze-nakade",
      "レストラン",
      " これが いちばん おいしいです。",
      "のなかで",
      ["のなかで", "のほうが", "より", "は"],
      "Among the restaurants, this one is the most delicious.",
      "レストランのなかで これが いちばん おいしいです。",
      "のなかで defines the group being compared.",
    ),
    translateStep({
      id: "ja-m22-5-2-translate",
      promptEn: "Which is more delicious, pasta or curry?",
      acceptedAnswers: [
        "パスタと カレーと どちらが おいしいですか",
        "パスタと カレーと どちらが おいしいですか。",
        "パスタと カレーと どっちが おいしいですか",
        "パスタと カレーと どっちが おいしいですか。",
      ],
      audioText: "パスタと カレーと どちらが おいしいですか",
    }),
    selfExplain({
      id: "ja-m22-5-2-self-explain",
      anchorLabel: "Three comparison patterns mastered",
      anchorAudioText: "おおさかのほうが にぎやかです",
      question: "To ask about the best among 5 cities, which pattern do you use?",
      rule: { text: "のなかで〜がいちばん — because you're selecting from 3+ items. どちら only works for exactly two." },
      surface: { text: "どちらが — it works for any number of choices." },
      distractor: { text: "のほうが〜より — list all five after より." },
      ruleExplanation:
        "2 items = どちら or のほうが〜より. 3+ items = のなかで〜がいちばん.",
    }),
    speaking(
      "ja-m22-5-2-speak-full",
      "この りょうりのなかで カレーが いちばん やすいです",
      "Among this food, curry is the cheapest.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m22-5-2-rev-mcq-1", M22_5_2_REVIEW[0], M22_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m22-5-2-rev-lc-1",
      audioText: M22_5_2_REVIEW[1].kana,
      correctMeaningEn: M22_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_5_2_REVIEW[2].meaningEn,
        M22_5_2_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[9].meaningEn,
      ],
    }),
    speaking("ja-m22-5-2-rev-speak-1", M22_5_2_REVIEW[2].kana, M22_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m22-5-2-rev", M22_5_2_REVIEW),
    infoStep(
      "ja-m22-5-2-info-end",
      "You own all three comparison patterns in production",
      "Comparative, superlative, and which-of-two — all interleaved and automatic.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_5_2.steps);
assertAnswerRotation(M22_5_2.steps, 1);
assertNoConsecutiveSame(M22_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-6-1 — Production (build + speaking heavy)
// ═══════════════════════════════════════════════════════════════════════

const M22_6_1_REVIEW = pickReviewAtoms("ja-m22-6-1-rev", M22_REVIEW_POOL, 6);

export const M22_6_1: LessonContent = {
  id: "ja-m22-6-1",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "Comparison production I",
  description:
    "Production-heavy: build and speak comparisons with all M22 grammar and vocab.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-6-1-info-open",
      "Full production",
      "Time to produce comparisons from scratch. Build, speak, translate — no recognition crutches.",
    ),
    build(
      "ja-m22-6-1-build-1",
      "Say: Meat is more expensive than vegetables.",
      "にくのほうが やさいより たかいです",
      ["やさい", "たかい", "にく", "より", "のほうが", "やすい", "です"],
      ["にく", "のほうが", "やさい", "より", "たかい", "です"],
    ),
    speaking(
      "ja-m22-6-1-speak-1",
      "コーヒーのほうが おちゃより たかいです",
      "Coffee is more expensive than tea.",
    ),
    build(
      "ja-m22-6-1-build-2",
      "Ask: Which do you like more, meat or fish?",
      "にくと さかなと どちらが すきですか",
      ["さかな", "どちら", "にく", "と", "が", "と", "すき", "か", "です"],
      ["にく", "と", "さかな", "と", "どちら", "が", "すき", "です", "か"],
    ),
    listeningBuildSentence({
      id: "ja-m22-6-1-lb-1",
      target: "りょうりのなかで カレーが いちばん すきです",
      tiles: ["カレー", "すき", "りょうり", "が", "のなかで", "いちばん", "ラーメン", "です"],
      correctOrder: ["りょうり", "のなかで", "カレー", "が", "いちばん", "すき", "です"],
      promptEn: "Hear it, build it: 'Among foods, I like curry the most.'",
    }),
    speaking(
      "ja-m22-6-1-speak-2",
      "やさいと くだものと どちらが すきですか",
      "Which do you like more, vegetables or fruit?",
    ),
    build(
      "ja-m22-6-1-build-3",
      "Answer: I like fruit more.",
      "くだもののほうが すきです",
      ["すき", "くだもの", "やさい", "のほうが", "より", "です"],
      ["くだもの", "のほうが", "すき", "です"],
    ),
    sentenceMcq({
      id: "ja-m22-6-1-mcq-1",
      prompt: "How do you say 'Both are good.'?",
      correctKana: "どちらも いいです。",
      distractorsKana: [
        "どちらが いいですか。",
        "どちらも わるいです。",
        "どれも いいです。",
      ],
      explanation: "どちらも = both. も replaces が for 'both equally.'",
    }),
    build(
      "ja-m22-6-1-build-4",
      "Say: Among Japanese cities, Osaka is the liveliest.",
      "にほんのまちのなかで おおさかが いちばん にぎやかです",
      ["おおさか", "にぎやか", "にほんのまち", "が", "のなかで", "いちばん", "とうきょう", "です"],
      ["にほんのまち", "のなかで", "おおさか", "が", "いちばん", "にぎやか", "です"],
    ),
    speaking(
      "ja-m22-6-1-speak-3",
      "にほんのまちのなかで おおさかが いちばん にぎやかです",
      "Among Japanese cities, Osaka is the liveliest.",
    ),
    translateStep({
      id: "ja-m22-6-1-translate-1",
      promptEn: "Ramen is more delicious than pasta.",
      acceptedAnswers: [
        "ラーメンのほうが パスタより おいしいです",
        "ラーメンのほうが パスタより おいしいです。",
      ],
      audioText: "ラーメンのほうが パスタより おいしいです",
    }),
    build(
      "ja-m22-6-1-build-5",
      "Say: This restaurant is more convenient.",
      "この レストランのほうが べんりです",
      ["べんり", "この", "レストラン", "あの", "のほうが", "ふべん", "です"],
      ["この", "レストラン", "のほうが", "べんり", "です"],
    ),
    listeningCompSentence({
      id: "ja-m22-6-1-lc-1",
      audioText: "どちらも きれいです",
      correctMeaningEn: "Both are beautiful.",
      distractorsEn: [
        "Which is beautiful?",
        "Neither is beautiful.",
        "One is more beautiful.",
      ],
    }),
    selfExplain({
      id: "ja-m22-6-1-self-explain",
      anchorLabel: "Full comparison production",
      anchorAudioText: "ラーメンのほうが おいしいです",
      question: "If someone asks どちらが すきですか, how do you structure your answer?",
      rule: { text: "Use Xのほうが すきです — のほうが marks your choice as the preferred one." },
      surface: { text: "Repeat the question back: どちらが すきです." },
      distractor: { text: "Use Xのなかで すきです to name your pick." },
      ruleExplanation:
        "Answer pattern: [chosen item]のほうが [adj]です. Or どちらも if you like both equally.",
    }),
    speaking(
      "ja-m22-6-1-speak-4",
      "この レストランのほうが べんりです",
      "This restaurant is more convenient.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m22-6-1-rev-mcq-1", M22_6_1_REVIEW[0], M22_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m22-6-1-rev-lc-1",
      audioText: M22_6_1_REVIEW[1].kana,
      correctMeaningEn: M22_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_6_1_REVIEW[2].meaningEn,
        M22_6_1_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[10].meaningEn,
      ],
    }),
    speaking("ja-m22-6-1-rev-speak-1", M22_6_1_REVIEW[2].kana, M22_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m22-6-1-rev", M22_6_1_REVIEW),
    infoStep(
      "ja-m22-6-1-info-end",
      "You can now produce full comparisons from English prompts",
      "Build, speak, and translate — all three comparison patterns in production.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_6_1.steps);
assertAnswerRotation(M22_6_1.steps, 1);
assertNoConsecutiveSame(M22_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-6-2 — Production II (more build + speaking)
// ═══════════════════════════════════════════════════════════════════════

const M22_6_2_REVIEW = pickReviewAtoms("ja-m22-6-2-rev", M22_REVIEW_POOL, 6);

export const M22_6_2: LessonContent = {
  id: "ja-m22-6-2",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "Comparison production II",
  description:
    "Final production drill — all comparison patterns combined with full M22 vocab.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-6-2-info-open",
      "Production round two",
      "More building and speaking. Every comparison structure at production level.",
    ),
    build(
      "ja-m22-6-2-build-1",
      "Ask: Which city is more beautiful, Kyoto or Hiroshima?",
      "きょうとと ひろしまと どちらが きれいですか",
      ["ひろしま", "どちら", "きょうと", "と", "が", "と", "きれい", "か", "です"],
      ["きょうと", "と", "ひろしま", "と", "どちら", "が", "きれい", "です", "か"],
    ),
    speaking(
      "ja-m22-6-2-speak-1",
      "きょうとのほうが きれいです",
      "Kyoto is more beautiful.",
    ),
    listeningBuildSentence({
      id: "ja-m22-6-2-lb-1",
      target: "さかなのほうが にくより やすいです",
      tiles: ["にく", "やすい", "さかな", "より", "のほうが", "たかい", "です"],
      correctOrder: ["さかな", "のほうが", "にく", "より", "やすい", "です"],
      promptEn: "Hear it, build it: 'Fish is cheaper than meat.'",
    }),
    build(
      "ja-m22-6-2-build-2",
      "Say: Among this food, ramen is the most delicious.",
      "この りょうりのなかで ラーメンが いちばん おいしいです",
      ["ラーメン", "おいしい", "この", "りょうり", "が", "のなかで", "いちばん", "カレー", "です"],
      ["この", "りょうり", "のなかで", "ラーメン", "が", "いちばん", "おいしい", "です"],
    ),
    sentenceMcq({
      id: "ja-m22-6-2-mcq-1",
      prompt: "Which means 'This town is more inconvenient.'?",
      correctKana: "この まちのほうが ふべんです。",
      distractorsKana: [
        "この まちは べんりです。",
        "この まちが いちばんです。",
        "この まちより ふべんです。",
      ],
      explanation: "のほうが marks this town as the more inconvenient one.",
    }),
    speaking(
      "ja-m22-6-2-speak-2",
      "この りょうりのなかで ラーメンが いちばん おいしいです",
      "Among this food, ramen is the most delicious.",
    ),
    build(
      "ja-m22-6-2-build-3",
      "Say: Vegetables and fruit are the same price.",
      "やさいと くだものは おなじ ねだんです",
      ["くだもの", "おなじ", "やさい", "と", "は", "ねだん", "ちがう", "です"],
      ["やさい", "と", "くだもの", "は", "おなじ", "ねだん", "です"],
    ),
    cloze(
      "ja-m22-6-2-cloze-yori",
      "パスタのほうが カレー",
      " やすいです。",
      "より",
      ["より", "のほうが", "のなかで", "は"],
      "Pasta is cheaper than curry.",
      "パスタのほうが カレーより やすいです。",
      "より marks the baseline.",
    ),
    listeningCompSentence({
      id: "ja-m22-6-2-lc-1",
      audioText: "この まちのなかで あの レストランが いちばん ゆうめいです",
      correctMeaningEn: "Among this town, that restaurant is the most famous.",
      distractorsEn: [
        "That restaurant is more famous than this town.",
        "This town and that restaurant are the same.",
        "That restaurant is the most inconvenient.",
      ],
    }),
    build(
      "ja-m22-6-2-build-4",
      "Ask casually: Which is quieter?",
      "どっちが しずかですか",
      ["しずか", "どっち", "どちら", "が", "にぎやか", "か", "です"],
      ["どっち", "が", "しずか", "です", "か"],
    ),
    translateStep({
      id: "ja-m22-6-2-translate",
      promptEn: "Osaka is livelier than Kyoto.",
      acceptedAnswers: [
        "おおさかのほうが きょうとより にぎやかです",
        "おおさかのほうが きょうとより にぎやかです。",
      ],
      audioText: "おおさかのほうが きょうとより にぎやかです",
    }),
    speaking(
      "ja-m22-6-2-speak-3",
      "とうきょうのほうが ひろしまより おおきいです",
      "Tokyo is bigger than Hiroshima.",
    ),
    cloze(
      "ja-m22-6-2-cloze-nakade",
      "この レストラン",
      " ラーメンが いちばんです。",
      "のなかで",
      ["のなかで", "のほうが", "より", "と"],
      "Among this restaurant's options, ramen is the best.",
      "この レストランのなかで ラーメンが いちばんです。",
      "のなかで defines the group.",
    ),
    selfExplain({
      id: "ja-m22-6-2-self-explain",
      anchorLabel: "Full comparison production mastered",
      anchorAudioText: "パスタのほうが カレーより やすいです",
      question: "Can you use もっと with のほうが〜より?",
      rule: { text: "No — のほうが already implies 'more.' Adding もっと is redundant. もっと is for standalone intensification: もっと おおきいです (bigger)." },
      surface: { text: "Yes — もっとのほうが means 'even more than.' Always combine them." },
      distractor: { text: "もっと replaces のほうが — they're the same word." },
      ruleExplanation:
        "のほうが〜より already expresses comparison. もっと is standalone: 'more [adj].' Don't double up.",
    }),
    speaking(
      "ja-m22-6-2-speak-4",
      "どちらも すきです",
      "I like both.",
    ),
    // ── Review tail ──
    speaking("ja-m22-6-2-rev-speak-1", M22_6_2_REVIEW[0].kana, M22_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m22-6-2-rev-lc-1",
      audioText: M22_6_2_REVIEW[1].kana,
      correctMeaningEn: M22_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_6_2_REVIEW[2].meaningEn,
        M22_6_2_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[11].meaningEn,
      ],
    }),
    vocabMcq("ja-m22-6-2-rev-mcq-1", M22_6_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M22_REVIEW_POOL),
    reviewMatchPairs("ja-m22-6-2-rev", M22_6_2_REVIEW),
    infoStep(
      "ja-m22-6-2-info-end",
      "You can now produce every comparison pattern from memory",
      "All three structures — comparative, superlative, which-of-two — in full production. Comparison module conquered.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_6_2.steps);
assertAnswerRotation(M22_6_2.steps, 1);
assertNoConsecutiveSame(M22_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-STORY — Comparing restaurants/cities
// ═══════════════════════════════════════════════════════════════════════

export const M22_STORY: LessonContent = {
  id: "ja-m22-story",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Yuki's town",
  description:
    "Listen to Yuki describe her town and its restaurants. Answer comprehension questions and build your replies with comparison patterns.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m22-story-info-open",
      "Story time — Yuki's town",
      "ゆき tells you about her town, its restaurants, and her favorite food. Listen and reply.",
    ),
    ...storyComprehension({
      idPrefix: "ja-m22-story-scene-1",
      narrative: [
        { kana: "わたしの まちは レストランが すくないです。" },
        { kana: "でも、いろいろな りょうりが あります。" },
        { kana: "この レストランのほうが あの レストランより やすいです。" },
        { kana: "この レストランの カレーは おいしいですよ。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "Does Yuki's town have many restaurants?",
          correctText: "No — it has few restaurants.",
          distractors: [
            "Yes — it has many restaurants.",
            "It has no restaurants.",
            "She doesn't say.",
          ],
          explanation: "レストランが すくないです = there are few restaurants.",
        },
        {
          id: "s1-q2",
          prompt: "Which restaurant is cheaper?",
          correctText: "This restaurant.",
          distractors: ["That restaurant.", "They're the same price.", "It's not mentioned."],
          explanation: "この レストランのほうが あの レストランより やすいです = this one is cheaper.",
        },
      ],
      responseBuild: {
        target: "わたしの まちも レストランが すくないです",
        tiles: ["まち", "わたしの", "すくない", "レストラン", "も", "が", "です", "おおい"],
        correctOrder: ["わたしの", "まち", "も", "レストラン", "が", "すくない", "です"],
        promptEn: "Reply: 'My town also has few restaurants.'",
      },
    }),
    sentenceMcq({
      id: "ja-m22-story-mcq-1",
      prompt: "Which sentence did Yuki say about the two restaurants?",
      correctKana: "この レストランのほうが あの レストランより やすいです。",
      distractorsKana: [
        "あの レストランのほうが この レストランより やすいです。",
        "この レストランと あの レストランは おなじです。",
        "あの レストランが いちばん やすいです。",
      ],
      explanation: "のほうが marks the winner — THIS restaurant is the cheaper one.",
    }),
    ...storyComprehension({
      idPrefix: "ja-m22-story-scene-2",
      narrative: [
        { kana: "まちのなかで この レストランが いちばん ゆうめいです。" },
        { kana: "ラーメンも カレーも おいしいです。" },
        { kana: "でも、わたしは カレーのほうが すきです。" },
        { kana: "あなたは どちらが すきですか。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "Which restaurant is the most famous in town?",
          correctText: "This restaurant — the cheap one.",
          distractors: ["That restaurant.", "A restaurant in Tokyo.", "None of them."],
          explanation: "まちのなかで この レストランが いちばん ゆうめいです = this one is the most famous in town.",
        },
        {
          id: "s2-q2",
          prompt: "Which food does Yuki prefer?",
          correctText: "Curry.",
          distractors: ["Ramen.", "Both equally.", "Neither."],
          explanation: "カレーのほうが すきです = I like curry more.",
        },
      ],
      responseBuild: {
        target: "わたしは ラーメンのほうが すきです",
        tiles: ["ラーメン", "すき", "わたし", "は", "のほうが", "より", "カレー", "です"],
        correctOrder: ["わたし", "は", "ラーメン", "のほうが", "すき", "です"],
        promptEn: "Answer her question: 'I like ramen more.'",
      },
    }),
    cloze(
      "ja-m22-story-cloze-1",
      "カレー",
      " ラーメンより すきです。",
      "のほうが",
      ["のほうが", "より", "のなかで", "は"],
      "I like curry more than ramen.",
      "カレーのほうが ラーメンより すきです。",
      "のほうが marks the preferred one.",
    ),
    listeningBuildSentence({
      id: "ja-m22-story-lb-1",
      target: "まちのなかで この レストランが いちばん ゆうめいです",
      tiles: ["この", "ゆうめい", "まち", "レストラン", "が", "のなかで", "いちばん", "です"],
      correctOrder: ["まち", "のなかで", "この", "レストラン", "が", "いちばん", "ゆうめい", "です"],
      promptEn: "Hear it, build it: 'In town, this restaurant is the most famous.'",
    }),
    listeningCompSentence({
      id: "ja-m22-story-lc-1",
      audioText: "いろいろな りょうりが あります",
      correctMeaningEn: "There are various dishes.",
      distractorsEn: [
        "There are few dishes.",
        "The dishes are all the same.",
        "The dishes are expensive.",
      ],
    }),
    speaking(
      "ja-m22-story-speak-1",
      "わたしは カレーのほうが すきです",
      "I like curry more.",
    ),
    sentenceMcq({
      id: "ja-m22-story-mcq-summary",
      prompt: "What do we know about Yuki's town?",
      correctKana: "It has few restaurants, but this one is famous and has various dishes.",
      distractorsKana: [
        "It has many restaurants, all the same.",
        "It has no famous restaurants.",
        "It only serves ramen.",
      ],
      explanation: "レストランが すくない + いろいろな りょうり + いちばん ゆうめい — few restaurants, varied food, one famous spot.",
    }),
    speaking(
      "ja-m22-story-speak-2",
      "この レストランのほうが やすいです",
      "This restaurant is cheaper.",
    ),
    infoStep(
      "ja-m22-story-info-end",
      "You can follow a story comparing restaurants and food",
      "You understood comparative, superlative, and which-of-two patterns in a real narrative — and replied in Japanese.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M22_STORY.steps);
assertPassiveCardsHaveFollowup(M22_STORY.steps);
assertNoExplanationOnPassive(M22_STORY.steps);
assertExplanationDoesntLeakAnswer(M22_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-7-1 — Comprehension closer (dialogue)
// ═══════════════════════════════════════════════════════════════════════

const M22_7_1_REVIEW = pickReviewAtoms("ja-m22-7-1-rev", M22_REVIEW_POOL, 6);

export const M22_7_1: LessonContent = {
  id: "ja-m22-7-1",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "Comparison closer I",
  description:
    "Dialogue closer — follow a comparison conversation and produce key sentences.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-7-1-info-open",
      "Comparing cities",
      "A longer conversation about comparing Japanese cities. Listen, answer, and produce.",
    ),
    dialogueListen({
      id: "ja-m22-7-1-dialogue",
      lines: [
        { speaker: "ゆき", kana: "とうきょうと おおさかと どちらが にぎやかですか。" },
        { speaker: "たけし", kana: "おおさかのほうが にぎやかです。でも、とうきょうのほうが おおきいです。" },
        { speaker: "ゆき", kana: "にほんのまちのなかで どこが いちばん しずかですか。" },
        { speaker: "たけし", kana: "きょうとが いちばん しずかです。きれいですよ。" },
      ],
      questions: [
        {
          id: "d-q1",
          prompt: "Which city is livelier according to たけし?",
          correctText: "Osaka.",
          distractors: ["Tokyo.", "Kyoto.", "They're the same."],
          explanation: "おおさかのほうが にぎやかです = Osaka is livelier.",
        },
        {
          id: "d-q2",
          prompt: "Which city is the quietest?",
          correctText: "Kyoto.",
          distractors: ["Tokyo.", "Osaka.", "Hiroshima."],
          explanation: "きょうとが いちばん しずかです = Kyoto is the quietest.",
        },
      ],
    }),
    build(
      "ja-m22-7-1-build-1",
      "Say: Osaka is livelier than Tokyo.",
      "おおさかのほうが とうきょうより にぎやかです",
      ["とうきょう", "にぎやか", "おおさか", "より", "のほうが", "しずか", "です"],
      ["おおさか", "のほうが", "とうきょう", "より", "にぎやか", "です"],
    ),
    sentenceMcq({
      id: "ja-m22-7-1-mcq-1",
      prompt: "Which is bigger according to the dialogue?",
      correctKana: "Tokyo is bigger.",
      distractorsKana: ["Osaka is bigger.", "They're the same size.", "It's not mentioned."],
      explanation: "とうきょうのほうが おおきいです = Tokyo is bigger.",
    }),
    listeningCompSentence({
      id: "ja-m22-7-1-lc-1",
      audioText: "きょうとが いちばん しずかです",
      correctMeaningEn: "Kyoto is the quietest.",
      distractorsEn: [
        "Kyoto is livelier.",
        "Kyoto is the biggest.",
        "Kyoto is the most famous.",
      ],
    }),
    cloze(
      "ja-m22-7-1-cloze-1",
      "とうきょう",
      " おおさかより おおきいです。",
      "のほうが",
      ["のほうが", "より", "のなかで", "は"],
      "Tokyo is bigger than Osaka.",
      "とうきょうのほうが おおさかより おおきいです。",
      "のほうが marks Tokyo as the winner.",
    ),
    build(
      "ja-m22-7-1-build-2",
      "Say: Kyoto is the most beautiful.",
      "きょうとが いちばん きれいです",
      ["きれい", "きょうと", "いちばん", "が", "しずか", "おおさか", "です"],
      ["きょうと", "が", "いちばん", "きれい", "です"],
    ),
    speaking(
      "ja-m22-7-1-speak-1",
      "ひろしまのほうが とうきょうより しずかです",
      "Hiroshima is quieter than Tokyo.",
    ),
    listeningBuildSentence({
      id: "ja-m22-7-1-lb-1",
      target: "おおさかが いちばん べんりです",
      tiles: ["べんり", "おおさか", "いちばん", "が", "きょうと", "ふべん", "です"],
      correctOrder: ["おおさか", "が", "いちばん", "べんり", "です"],
      promptEn: "Hear it, build it: 'Osaka is the most convenient.'",
    }),
    cloze(
      "ja-m22-7-1-cloze-2",
      "にほんのまち",
      " きょうとが いちばん しずかです。",
      "のなかで",
      ["のなかで", "のほうが", "より", "は"],
      "Among Japanese cities, Kyoto is the quietest.",
      "にほんのまちのなかで きょうとが いちばん しずかです。",
      "のなかで defines the comparison group.",
    ),
    translateStep({
      id: "ja-m22-7-1-translate",
      promptEn: "Which is quieter, Hiroshima or Kyoto?",
      acceptedAnswers: [
        "ひろしまと きょうとと どちらが しずかですか",
        "ひろしまと きょうとと どちらが しずかですか。",
        "ひろしまと きょうとと どっちが しずかですか",
        "ひろしまと きょうとと どっちが しずかですか。",
      ],
      audioText: "ひろしまと きょうとと どちらが しずかですか",
    }),
    selfExplain({
      id: "ja-m22-7-1-self-explain",
      anchorLabel: "にほんのまちのなかで きょうとが いちばん しずかです",
      anchorAudioText: "きょうとが いちばん しずかです",
      question: "Could you use のほうが instead of のなかで〜がいちばん here?",
      rule: { text: "Only if you're comparing exactly two cities. のなかで〜がいちばん is needed when selecting from a group of 3+." },
      surface: { text: "Yes — のほうが and のなかで are interchangeable in all contexts." },
      distractor: { text: "No — のほうが is for adjectives; のなかで is for nouns." },
      ruleExplanation:
        "のほうが〜より = 2 items. のなかで〜がいちばん = 3+ items. Pick based on group size.",
    }),
    speaking(
      "ja-m22-7-1-speak-2",
      "にほんのまちのなかで きょうとが いちばん きれいです",
      "Among Japanese cities, Kyoto is the most beautiful.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m22-7-1-rev-mcq-1", M22_7_1_REVIEW[0], M22_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m22-7-1-rev-lc-1",
      audioText: M22_7_1_REVIEW[1].kana,
      correctMeaningEn: M22_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_7_1_REVIEW[2].meaningEn,
        M22_7_1_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[12].meaningEn,
      ],
    }),
    speaking("ja-m22-7-1-rev-speak-1", M22_7_1_REVIEW[2].kana, M22_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m22-7-1-rev", M22_7_1_REVIEW),
    infoStep(
      "ja-m22-7-1-info-end",
      "You can now follow and join a conversation comparing Japanese cities",
      "Comparative and superlative in a real dialogue — listening, answering, and producing.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_7_1.steps);
assertAnswerRotation(M22_7_1.steps, 1);
assertNoConsecutiveSame(M22_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M22-7-2 — Final mixed drill
// ═══════════════════════════════════════════════════════════════════════

const M22_7_2_REVIEW = pickReviewAtoms("ja-m22-7-2-rev", M22_REVIEW_POOL, 6);

export const M22_7_2: LessonContent = {
  id: "ja-m22-7-2",
  moduleId: "m22",
  courseId: COURSE,
  languageId: LANG,
  title: "Comparison closer II",
  description:
    "Final mixed drill — all comparison grammar + vocab in full production.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m22-7-2-info-open",
      "Final comparison drill",
      "Everything from M22 mixed together. Prove you own every comparison pattern.",
    ),
    build(
      "ja-m22-7-2-build-1",
      "Say: This curry is more delicious than that ramen.",
      "この カレーのほうが あの ラーメンより おいしいです",
      ["あの", "おいしい", "この", "ラーメン", "カレー", "より", "のほうが", "です"],
      ["この", "カレー", "のほうが", "あの", "ラーメン", "より", "おいしい", "です"],
    ),
    sentenceMcq({
      id: "ja-m22-7-2-mcq-1",
      prompt: "Which means 'Among these, pasta is the cheapest.'?",
      correctKana: "このなかで パスタが いちばん やすいです。",
      distractorsKana: [
        "パスタのほうが やすいです。",
        "パスタと どちらが やすいですか。",
        "パスタは もっと やすいです。",
      ],
      explanation: "このなかで + がいちばん = among these, pasta is the most [cheap].",
    }),
    speaking(
      "ja-m22-7-2-speak-1",
      "この カレーのほうが おいしいです",
      "This curry is more delicious.",
    ),
    cloze(
      "ja-m22-7-2-cloze-1",
      "おおさかと とうきょうと ",
      "が べんりですか。",
      "どちら",
      ["どちら", "どれ", "なに", "だれ"],
      "Which is more convenient, Osaka or Tokyo?",
      "おおさかと とうきょうと どちらが べんりですか。",
      "どちら for choosing between two cities.",
    ),
    build(
      "ja-m22-7-2-build-2",
      "Say: Tokyo is the most convenient.",
      "とうきょうが いちばん べんりです",
      ["べんり", "とうきょう", "いちばん", "が", "のほうが", "おおさか", "です"],
      ["とうきょう", "が", "いちばん", "べんり", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m22-7-2-lb-1",
      target: "どちらも ゆうめいです",
      tiles: ["ゆうめい", "どちら", "のほうが", "も", "が", "です"],
      correctOrder: ["どちら", "も", "ゆうめい", "です"],
      promptEn: "Hear it, build it: 'Both are famous.'",
    }),
    listeningCompSentence({
      id: "ja-m22-7-2-lc-1",
      audioText: "この まちのなかで ひろしまが いちばん しずかです",
      correctMeaningEn: "Among these cities, Hiroshima is the quietest.",
      distractorsEn: [
        "Hiroshima is livelier than other cities.",
        "Hiroshima and the city are the same.",
        "Hiroshima is the most famous.",
      ],
    }),
    cloze(
      "ja-m22-7-2-cloze-2",
      "さかな",
      " にくより やすいです。",
      "のほうが",
      ["のほうが", "より", "のなかで", "は"],
      "Fish is cheaper than meat.",
      "さかなのほうが にくより やすいです。",
      "のほうが marks fish as the cheaper one.",
    ),
    speaking(
      "ja-m22-7-2-speak-2",
      "この まちは レストランが おおいです",
      "This town has many restaurants.",
    ),
    build(
      "ja-m22-7-2-build-3",
      "Say: These two are different.",
      "この ふたつは ちがいます",
      ["ふたつ", "この", "ちがいます", "は", "おなじ", "です"],
      ["この", "ふたつ", "は", "ちがいます"],
    ),
    sentenceMcq({
      id: "ja-m22-7-2-mcq-2",
      prompt: "Which means 'Kyoto is more beautiful than Osaka.'?",
      correctKana: "きょうとのほうが おおさかより きれいです。",
      distractorsKana: [
        "おおさかのほうが きょうとより きれいです。",
        "きょうとと おおさかは おなじです。",
        "きょうとが いちばん きれいです。",
      ],
      explanation: "きょうとのほうが = Kyoto is the more beautiful one.",
    }),
    translateStep({
      id: "ja-m22-7-2-translate",
      promptEn: "Among this restaurant's dishes, the pasta is the cheapest.",
      acceptedAnswers: [
        "この レストランのなかで パスタが いちばん やすいです",
        "この レストランのなかで パスタが いちばん やすいです。",
      ],
      audioText: "この レストランのなかで パスタが いちばん やすいです",
    }),
    selfExplain({
      id: "ja-m22-7-2-self-explain",
      anchorLabel: "All comparison patterns mastered",
      anchorAudioText: "どちらも いいです",
      question: "You've learned three comparison tools. Name them.",
      rule: { text: "1) のほうが〜より (A is more than B). 2) のなかで〜がいちばん (most among group). 3) どちら (which of two)." },
      surface: { text: "もっと, いちばん, and おなじ — three comparison adjectives." },
      distractor: { text: "のほうが, のなかで, and もっと — three ways to say 'more.'" },
      ruleExplanation:
        "のほうが〜より for pairs, のなかで〜がいちばん for groups of 3+, どちら for asking 'which of two.'",
    }),
    speaking(
      "ja-m22-7-2-speak-3",
      "やまと うみと どちらが すきですか",
      "Which do you like more, the mountains or the sea?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m22-7-2-rev-mcq-1", M22_7_2_REVIEW[0], M22_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m22-7-2-rev-lc-1",
      audioText: M22_7_2_REVIEW[1].kana,
      correctMeaningEn: M22_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M22_7_2_REVIEW[2].meaningEn,
        M22_7_2_REVIEW[3].meaningEn,
        M22_REVIEW_POOL[13].meaningEn,
      ],
    }),
    speaking("ja-m22-7-2-rev-speak-1", M22_7_2_REVIEW[2].kana, M22_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m22-7-2-rev", M22_7_2_REVIEW),
    infoStep(
      "ja-m22-7-2-info-end",
      "You can now compare, rank, and choose between anything in Japanese",
      "All M22 grammar mastered: のほうが〜より, のなかで〜がいちばん, and どちら — in full production.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M22_7_2.steps);
assertAnswerRotation(M22_7_2.steps, 1);
assertNoConsecutiveSame(M22_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

const ALL_M22 = [
  M22_1_1, M22_1_2, M22_2_1, M22_2_2, M22_3_1, M22_3_2,
  M22_4_1, M22_4_2, M22_5_1, M22_5_2, M22_6_1, M22_6_2,
  M22_STORY, M22_7_1, M22_7_2,
];

assertNoSameAnswerCluster(ALL_M22.flatMap((l) => l.steps));

// Passive-card lint
for (const lesson of ALL_M22) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
