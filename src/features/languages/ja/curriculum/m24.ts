/**
 * M24 — Hobbies & Activities (2026-05-25).
 *
 * M24 introduces:
 *   - 〜のがすきです (like doing — review from M16, reinforced here)
 *   - 〜たり〜たりする (doing things like X and Y): non-exhaustive listing
 *   - counter 〜かい/回 (times): いっかい, にかい, さんかい...
 *
 * Vocab (~25): え (painting), しゃしん (photos), つり (fishing), ハイキング,
 *   キャンプ, ジョギング, テレビ, ラジオ, ざっし (magazine), まんが,
 *   アニメ, あつめる (collect), つくる (make/create),
 *   しゅみ (hobby), きく (listen), よむ (read), かく (write/draw),
 *   いっかい (1 time), にかい (2 times), さんかい (3 times),
 *   まいにち (every day), まいしゅう (every week), ときどき (sometimes),
 *   よく (often), あまり (not much)
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps.
 *
 * ID scheme: ja-m24-{n}-{sub} e.g. ja-m24-1-1, ja-m24-1-2
 * Export names: M24_1_1, M24_1_2, M24_2_1, M24_2_2, etc.
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
const M24_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_NO_GA_SUKI_REVIEW = grammarRule({
  id: "ja-m24-rule-noga-suki",
  title: "〜のがすきです — like doing (review)",
  rule:
    "You learned this in M16: to say you like DOING something, nominalize the verb with の and mark it with が: [verb dictionary form] + のが + すき + です. Quick review before we build on it.",
  examples: [
    {
      ja: "えを かくのが すきです。",
      romaji: "e o kaku no ga suki desu.",
      en: "I like drawing pictures.",
    },
    {
      ja: "しゃしんを とるのが すきです。",
      romaji: "shashin o toru no ga suki desu.",
      en: "I like taking photos.",
    },
    {
      ja: "まんがを よむのが すきです。",
      romaji: "manga o yomu no ga suki desu.",
      en: "I like reading manga.",
    },
  ],
  antiPattern: {
    ja: "えを かくが すきです。",
    romaji: "e o kaku ga suki desu.",
    en: "(broken — missing の nominalizer)",
    why: "Without の, the verb can't act as the subject of すき. の turns the verb phrase into 'the act of doing.'",
  },
  cultureNote:
    "しゅみは なんですか (What's your hobby?) is one of the most common getting-to-know-you questions in Japan. Answer with 〜のがすきです.",
});

const RULE_TARI_TARI = grammarRule({
  id: "ja-m24-rule-tari-tari",
  title: "〜たり〜たりする — doing things like X and Y",
  rule:
    "To list activities non-exhaustively ('I do things like X and Y'), use the た-form + り for each item, then close with する/します: [verb た-form]り [verb た-form]り + します. Unlike と (exhaustive list), たり〜たり implies 'among other things.'",
  examples: [
    {
      ja: "しゅうまつに えを かいたり、しゃしんを とったりします。",
      romaji: "shuumatsu ni e o kaitari, shashin o tottari shimasu.",
      en: "On weekends, I do things like drawing pictures and taking photos.",
    },
    {
      ja: "テレビを みたり、まんがを よんだりします。",
      romaji: "terebi o mitari, manga o yondari shimasu.",
      en: "I do things like watching TV and reading manga.",
    },
    {
      ja: "つりを したり、ハイキングを したりします。",
      romaji: "tsuri o shitari, haikingu o shitari shimasu.",
      en: "I do things like fishing and hiking.",
    },
  ],
  antiPattern: {
    ja: "えを かいて、しゃしんを とってします。",
    romaji: "e o kaite, shashin o totte shimasu.",
    en: "(broken — uses て-form, not た-form + り)",
    why: "The たり pattern uses た-form + り, not て-form. かいた + り → かいたり. かいて is the て-form — different pattern.",
  },
  cultureNote:
    "たり〜たり is essential for casual conversation. When someone asks しゅみは なんですか, you almost always answer with a たり list — it's natural to mention a few hobbies without implying they're the ONLY things you do.",
});

const RULE_KAI_COUNTER = grammarRule({
  id: "ja-m24-rule-kai-counter",
  title: "〜かい / 回 — times (counter)",
  rule:
    "To count how many times you do something, use the counter かい (回): いっかい (1 time), にかい (2 times), さんかい (3 times), etc. Place it before the verb or time expression.",
  examples: [
    {
      ja: "いっしゅうかんに にかい ジョギングします。",
      romaji: "isshuukan ni nikai jogingu shimasu.",
      en: "I jog twice a week.",
    },
    {
      ja: "にほんに さんかい いきました。",
      romaji: "nihon ni sankai ikimashita.",
      en: "I went to Japan three times.",
    },
    {
      ja: "まいにち いっかい さんぽします。",
      romaji: "mainichi ikkai sanpo shimasu.",
      en: "I take a walk once every day.",
    },
  ],
  antiPattern: {
    ja: "にほんに みっつ いきました。",
    romaji: "nihon ni mittsu ikimashita.",
    en: "(broken — みっつ counts objects, not occurrences)",
    why: "みっつ counts things (3 items). かい counts occurrences (3 times). For how many times, always use かい.",
  },
  cultureNote:
    "Common frequency expressions: いっかい (once), にかい (twice), さんかい (3x). Note いっかい has a double っ sound — いっ not いち.",
});

// ═══════════════════════════════════════════════════════════════════════
// M24-1-1 — Hobby vocab intro
//   (え, しゃしん, つり, ハイキング, キャンプ, ジョギング)
// ═══════════════════════════════════════════════════════════════════════

const M24_1_1_REVIEW = pickReviewAtoms("ja-m24-1-1-rev", M24_REVIEW_POOL, 4);

export const M24_1_1: LessonContent = {
  id: "ja-m24-1-1",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Hobby words I",
  description:
    "Six outdoor and creative hobbies — painting, photos, fishing, hiking, camping, jogging.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m24-1-1-info-open",
      "What do you do for fun?",
      "Six hobby words covering outdoor adventures and creative pursuits. You'll be talking about your free time in no time.",
    ),
    // ── え (painting/picture) ──
    build(
      "ja-m24-1-1-build-e",
      "Pick the Japanese word for: Painting / Picture",
      "え",
      ["え", "しゃしん", "つり", "ハイキング"],
      ["え"],
    ),
    vocabMcq(
      "ja-m24-1-1-mcq-e",
      { kana: "え", meaningEn: "painting / picture", emoji: "🎨", fromModule: "m24" },
      M24_REVIEW_POOL,
    ),
    // ── しゃしん (photos) ──
    build(
      "ja-m24-1-1-build-shashin",
      "Pick the Japanese word for: Photo",
      "しゃしん",
      ["しゃしん", "え", "つり", "キャンプ"],
      ["しゃしん"],
    ),
    vocabMcq(
      "ja-m24-1-1-mcq-shashin",
      { kana: "しゃしん", meaningEn: "photo", emoji: "📷", fromModule: "m24" },
      M24_REVIEW_POOL,
    ),
    // ── つり (fishing) ──
    build(
      "ja-m24-1-1-build-tsuri",
      "Pick the Japanese word for: Fishing",
      "つり",
      ["つり", "しゃしん", "え", "ジョギング"],
      ["つり"],
    ),
    speaking("ja-m24-1-1-speak-tsuri", "つり", "Fishing"),
    // ── ハイキング (hiking) ──
    build(
      "ja-m24-1-1-build-haikingu",
      "Pick the Japanese word for: Hiking",
      "ハイキング",
      ["ハイキング", "キャンプ", "ジョギング", "つり"],
      ["ハイキング"],
    ),
    listeningCompSentence({
      id: "ja-m24-1-1-lc-haikingu",
      audioText: "ハイキング",
      correctMeaningEn: "hiking",
      distractorsEn: ["camping", "jogging", "fishing"],
    }),
    // ── キャンプ (camping) ──
    build(
      "ja-m24-1-1-build-kyanpu",
      "Pick the Japanese word for: Camping",
      "キャンプ",
      ["キャンプ", "ハイキング", "ジョギング", "つり"],
      ["キャンプ"],
    ),
    listeningCompSentence({
      id: "ja-m24-1-1-lc-kyanpu",
      audioText: "キャンプ",
      correctMeaningEn: "camping",
      distractorsEn: ["hiking", "jogging", "fishing"],
    }),
    // ── ジョギング (jogging) ──
    build(
      "ja-m24-1-1-build-jogingu",
      "Pick the Japanese word for: Jogging",
      "ジョギング",
      ["ジョギング", "ハイキング", "キャンプ", "つり"],
      ["ジョギング"],
    ),
    speaking("ja-m24-1-1-speak-jogingu", "ジョギング", "Jogging"),
    // ── Context drill ──
    sentenceMcq({
      id: "ja-m24-1-1-mcq-hobby",
      prompt: "Which means 'I like fishing.'?",
      correctKana: "つりが すきです。",
      distractorsKana: [
        "つりが きらいです。",
        "つりを します。",
        "つりは しゃしんです。",
      ],
      explanation: "つりが すきです = I like fishing.",
    }),
    selfExplain({
      id: "ja-m24-1-1-self-explain",
      anchorLabel: "Six hobby words learned",
      anchorAudioText: "つり",
      question: "Which words are katakana (borrowed from English)?",
      rule: { text: "ハイキング, キャンプ, ジョギング — they come from English 'hiking,' 'camp,' 'jogging.' The katakana signals foreign origin." },
      surface: { text: "All six words are katakana — Japanese borrows all hobby words." },
      distractor: { text: "None are katakana — they're all native Japanese words written in hiragana." },
      ruleExplanation:
        "え, しゃしん, つり = native Japanese (hiragana). ハイキング, キャンプ, ジョギング = borrowed English (katakana).",
    }),
    speaking(
      "ja-m24-1-1-speak-haikingu",
      "ハイキングが すきです",
      "I like hiking.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m24-1-1-rev-mcq-1", M24_1_1_REVIEW[0], M24_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m24-1-1-rev-lc-1",
      audioText: M24_1_1_REVIEW[1].kana,
      correctMeaningEn: M24_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M24_1_1_REVIEW[2].meaningEn,
        M24_1_1_REVIEW[3].meaningEn,
        M24_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m24-1-1-rev-speak-1", M24_1_1_REVIEW[2].kana, M24_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m24-1-1-rev", M24_1_1_REVIEW),
    infoStep(
      "ja-m24-1-1-info-end",
      "You can now name six hobbies in Japanese",
      "え, しゃしん, つり, ハイキング, キャンプ, ジョギング — your hobby vocabulary is growing.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M24_1_1.steps);
assertAnswerRotation(M24_1_1.steps, 1);
assertNoConsecutiveSame(M24_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-1-2 — Hobby vocab II
//   (テレビ, ラジオ, ざっし, まんが, アニメ + しゅみ)
// ═══════════════════════════════════════════════════════════════════════

const M24_1_2_REVIEW = pickReviewAtoms("ja-m24-1-2-rev", M24_REVIEW_POOL, 4);

export const M24_1_2: LessonContent = {
  id: "ja-m24-1-2",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Hobby words II",
  description:
    "Media and entertainment vocab — TV, radio, magazine, manga, anime + しゅみ (hobby).",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m24-1-2-info-open",
      "Media hobbies",
      "Five media words + しゅみ (hobby). Now you can ask and answer the classic question: しゅみは なんですか。",
    ),
    // ── テレビ (TV) ──
    build(
      "ja-m24-1-2-build-terebi",
      "Pick the Japanese word for: TV",
      "テレビ",
      ["テレビ", "ラジオ", "まんが", "アニメ"],
      ["テレビ"],
    ),
    vocabMcq(
      "ja-m24-1-2-mcq-terebi",
      { kana: "テレビ", meaningEn: "TV", emoji: "📺", fromModule: "m24" },
      M24_REVIEW_POOL,
    ),
    // ── ラジオ (radio) ──
    build(
      "ja-m24-1-2-build-rajio",
      "Pick the Japanese word for: Radio",
      "ラジオ",
      ["ラジオ", "テレビ", "ざっし", "まんが"],
      ["ラジオ"],
    ),
    listeningCompSentence({
      id: "ja-m24-1-2-lc-rajio",
      audioText: "ラジオ",
      correctMeaningEn: "radio",
      distractorsEn: ["TV", "magazine", "manga"],
    }),
    // ── ざっし (magazine) ──
    build(
      "ja-m24-1-2-build-zasshi",
      "Pick the Japanese word for: Magazine",
      "ざっし",
      ["ざっし", "まんが", "ラジオ", "テレビ"],
      ["ざっし"],
    ),
    speaking("ja-m24-1-2-speak-zasshi", "ざっし", "Magazine"),
    // ── まんが (manga) ──
    build(
      "ja-m24-1-2-build-manga",
      "Pick the Japanese word for: Manga",
      "まんが",
      ["まんが", "ざっし", "アニメ", "テレビ"],
      ["まんが"],
    ),
    vocabMcq(
      "ja-m24-1-2-mcq-manga",
      { kana: "まんが", meaningEn: "manga", emoji: "📖", fromModule: "m24" },
      M24_REVIEW_POOL,
    ),
    // ── アニメ (anime) ──
    build(
      "ja-m24-1-2-build-anime",
      "Pick the Japanese word for: Anime",
      "アニメ",
      ["アニメ", "まんが", "テレビ", "ラジオ"],
      ["アニメ"],
    ),
    listeningCompSentence({
      id: "ja-m24-1-2-lc-anime",
      audioText: "アニメ",
      correctMeaningEn: "anime",
      distractorsEn: ["manga", "TV", "radio"],
    }),
    // ── しゅみ (hobby) ──
    build(
      "ja-m24-1-2-build-shumi",
      "Pick the Japanese word for: Hobby",
      "しゅみ",
      ["しゅみ", "ざっし", "まんが", "テレビ"],
      ["しゅみ"],
    ),
    sentenceMcq({
      id: "ja-m24-1-2-mcq-shumi",
      prompt: "Which means 'What is your hobby?'",
      correctKana: "しゅみは なんですか。",
      distractorsKana: [
        "しゅみが すきですか。",
        "しゅみを しますか。",
        "しゅみは だれですか。",
      ],
      explanation: "しゅみは なんですか = What is your hobby?",
    }),
    build(
      "ja-m24-1-2-build-shumi-answer",
      "Answer: My hobby is reading manga.",
      "しゅみは まんがを よむことです",
      ["しゅみ", "は", "まんが", "を", "よむこと", "です", "アニメ"],
      ["しゅみ", "は", "まんが", "を", "よむこと", "です"],
    ),
    selfExplain({
      id: "ja-m24-1-2-self-explain",
      anchorLabel: "しゅみは なんですか",
      anchorAudioText: "しゅみは なんですか",
      question: "How is しゅみ different from すき?",
      rule: { text: "しゅみ is a noun meaning 'hobby' — the activity itself. すき is an adjective meaning 'liked.' You can say しゅみは [activity]です or [activity]が すきです." },
      surface: { text: "しゅみ and すき mean the same thing — they're synonyms." },
      distractor: { text: "しゅみ is formal; すき is casual. Same meaning." },
      ruleExplanation:
        "しゅみは X です = my hobby is X. X が すきです = I like X. Different parts of speech, complementary uses.",
    }),
    speaking(
      "ja-m24-1-2-speak-shumi",
      "しゅみは なんですか",
      "What is your hobby?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m24-1-2-rev-mcq-1", M24_1_2_REVIEW[0], M24_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m24-1-2-rev-lc-1",
      audioText: M24_1_2_REVIEW[1].kana,
      correctMeaningEn: M24_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M24_1_2_REVIEW[2].meaningEn,
        M24_1_2_REVIEW[3].meaningEn,
        M24_REVIEW_POOL[1].meaningEn,
      ],
    }),
    speaking("ja-m24-1-2-rev-speak-1", M24_1_2_REVIEW[2].kana, M24_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m24-1-2-rev", M24_1_2_REVIEW),
    infoStep(
      "ja-m24-1-2-info-end",
      "You can now talk about media hobbies and ask about someone's interests",
      "テレビ, ラジオ, ざっし, まんが, アニメ + しゅみ — media vocabulary complete.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M24_1_2.steps);
assertAnswerRotation(M24_1_2.steps, 1);
assertNoConsecutiveSame(M24_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-2-1 — "Like doing" review + hobby verbs
//   (のがすき review + あつめる, つくる)
// ═══════════════════════════════════════════════════════════════════════

const M24_2_1_REVIEW = pickReviewAtoms("ja-m24-2-1-rev", M24_REVIEW_POOL, 4);

export const M24_2_1: LessonContent = {
  id: "ja-m24-2-1",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Like doing (review)",
  description:
    "Review のがすき with hobby vocab + new verbs: あつめる (collect), つくる (make).",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m24-2-1-info-open",
      "Talking about what you like doing",
      "You learned のがすき in M16. Quick review, then two new verbs: collect and make.",
    ),
    RULE_NO_GA_SUKI_REVIEW,
    // ── あつめる (collect) ──
    build(
      "ja-m24-2-1-build-atsumeru",
      "Pick the Japanese word for: Collect",
      "あつめる",
      ["あつめる", "つくる", "かく", "よむ"],
      ["あつめる"],
    ),
    listeningCompSentence({
      id: "ja-m24-2-1-lc-atsumeru",
      audioText: "あつめる",
      correctMeaningEn: "collect",
      distractorsEn: ["make", "draw", "read"],
    }),
    // ── つくる (make/create) ──
    build(
      "ja-m24-2-1-build-tsukuru",
      "Pick the Japanese word for: Make / Create",
      "つくる",
      ["つくる", "あつめる", "よむ", "きく"],
      ["つくる"],
    ),
    speaking("ja-m24-2-1-speak-tsukuru", "つくる", "Make / Create"),
    // ── のがすき drills ──
    build(
      "ja-m24-2-1-build-suki-e",
      "Say: I like drawing pictures.",
      "えを かくのが すきです",
      ["え", "を", "かくのが", "すき", "です", "きらい"],
      ["え", "を", "かくのが", "すき", "です"],
    ),
    sentenceMcq({
      id: "ja-m24-2-1-mcq-suki",
      prompt: "Which means 'I like collecting stamps.'?",
      correctKana: "きってを あつめるのが すきです。",
      distractorsKana: [
        "きってを あつめるのが きらいです。",
        "きってを あつめます。",
        "きっては すきです。",
      ],
      explanation: "あつめるのが すきです = like collecting.",
    }),
    cloze(
      "ja-m24-2-1-cloze-noga",
      "しゃしんを とる",
      " すきです。",
      "のが",
      ["のが", "が", "は", "を"],
      "I like taking photos.",
      "しゃしんを とるのが すきです。",
      "のが nominalizes — 'the act of taking photos.'",
    ),
    listeningCompSentence({
      id: "ja-m24-2-1-lc-suki-manga",
      audioText: "まんがを よむのが すきです",
      correctMeaningEn: "I like reading manga.",
      distractorsEn: [
        "I dislike reading manga.",
        "I read manga.",
        "Manga is good.",
      ],
    }),
    build(
      "ja-m24-2-1-build-suki-tsukuru",
      "Say: I like making things.",
      "ものを つくるのが すきです",
      ["もの", "を", "つくるのが", "すき", "です", "きらい"],
      ["もの", "を", "つくるのが", "すき", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m24-2-1-lb-suki",
      target: "えを かくのが すきです",
      tiles: ["え", "を", "かくのが", "すき", "です", "きらい", "しゃしん"],
      correctOrder: ["え", "を", "かくのが", "すき", "です"],
      promptEn: "Hear it, build it: 'I like drawing pictures.'",
    }),
    cloze(
      "ja-m24-2-1-cloze-ga",
      "つりをするの",
      " すきです。",
      "が",
      ["が", "は", "を", "の"],
      "I like fishing.",
      "つりをするのが すきです。",
      "が marks what is liked — the act of fishing.",
    ),
    selfExplain({
      id: "ja-m24-2-1-self-explain",
      anchorLabel: "えを かくのが すきです",
      anchorAudioText: "えを かくのが すきです",
      question: "This is the same pattern as M16's のがすき. What new verbs did you learn for it?",
      rule: { text: "あつめる (collect) and つくる (make). Both work with のがすき: あつめるのが すきです, つくるのが すきです." },
      surface: { text: "No new verbs — のがすき only works with old verbs." },
      distractor: { text: "かいたり and よんだり — new verb forms for のがすき." },
      ruleExplanation:
        "のがすき works with any verb dictionary form. あつめる and つくる extend the pattern to collecting and making.",
    }),
    speaking(
      "ja-m24-2-1-speak-suki",
      "しゃしんを とるのが すきです",
      "I like taking photos.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m24-2-1-rev-mcq-1", M24_2_1_REVIEW[0], M24_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m24-2-1-rev-lc-1",
      audioText: M24_2_1_REVIEW[1].kana,
      correctMeaningEn: M24_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M24_2_1_REVIEW[2].meaningEn,
        M24_2_1_REVIEW[3].meaningEn,
        M24_REVIEW_POOL[2].meaningEn,
      ],
    }),
    speaking("ja-m24-2-1-rev-speak-1", M24_2_1_REVIEW[2].kana, M24_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m24-2-1-rev", M24_2_1_REVIEW),
    infoStep(
      "ja-m24-2-1-info-end",
      "You can now talk about hobbies you like doing",
      "のがすき reviewed with hobby verbs: あつめる, つくる + all the hobby nouns.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M24_2_1.steps);
assertAnswerRotation(M24_2_1.steps, 1);
assertNoConsecutiveSame(M24_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-2-2 — "Like doing" practice
// ═══════════════════════════════════════════════════════════════════════

const M24_2_2_REVIEW = pickReviewAtoms("ja-m24-2-2-rev", M24_REVIEW_POOL, 4);

export const M24_2_2: LessonContent = {
  id: "ja-m24-2-2",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Like doing (practice)",
  description:
    "Drill のがすき/きらい with all hobby vocab in production.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m24-2-2-info-open",
      "Hobby preferences",
      "Like it? Dislike it? Eight drills on のがすき and のがきらい with your new hobby words.",
    ),
    build(
      "ja-m24-2-2-build-suki-anime",
      "Say: I like watching anime.",
      "アニメを みるのが すきです",
      ["アニメ", "を", "みるのが", "すき", "です", "きらい"],
      ["アニメ", "を", "みるのが", "すき", "です"],
    ),
    sentenceMcq({
      id: "ja-m24-2-2-mcq-kirai",
      prompt: "Which means 'I dislike jogging.'?",
      correctKana: "ジョギングのが きらいです。",
      distractorsKana: [
        "ジョギングのが すきです。",
        "ジョギングを します。",
        "ジョギングは たのしいです。",
      ],
      explanation: "のがきらい = dislike doing.",
    }),
    cloze(
      "ja-m24-2-2-cloze-suki",
      "キャンプをする",
      " すきです。",
      "のが",
      ["のが", "が", "は", "を"],
      "I like camping.",
      "キャンプをするのが すきです。",
      "のが nominalizes the verb phrase.",
    ),
    listeningCompSentence({
      id: "ja-m24-2-2-lc-suki-tsuri",
      audioText: "つりをするのが すきです",
      correctMeaningEn: "I like fishing.",
      distractorsEn: [
        "I dislike fishing.",
        "I go fishing.",
        "Fishing is fun.",
      ],
    }),
    build(
      "ja-m24-2-2-build-kirai-rajio",
      "Say: I dislike listening to the radio.",
      "ラジオを きくのが きらいです",
      ["ラジオ", "を", "きくのが", "きらい", "です", "すき"],
      ["ラジオ", "を", "きくのが", "きらい", "です"],
    ),
    speaking(
      "ja-m24-2-2-speak-suki-haikingu",
      "ハイキングが すきです",
      "I like hiking.",
    ),
    listeningBuildSentence({
      id: "ja-m24-2-2-lb-suki-manga",
      target: "まんがを よむのが すきです",
      tiles: ["まんが", "を", "よむのが", "すき", "です", "きらい", "テレビ"],
      correctOrder: ["まんが", "を", "よむのが", "すき", "です"],
      promptEn: "Hear it, build it: 'I like reading manga.'",
    }),
    sentenceMcq({
      id: "ja-m24-2-2-mcq-shumi",
      prompt: "Someone asks しゅみは なんですか. How do you answer 'Camping'?",
      correctKana: "しゅみは キャンプです。",
      distractorsKana: [
        "キャンプが しゅみですか。",
        "キャンプを します。",
        "しゅみは ハイキングですか。",
      ],
      explanation: "しゅみは [hobby]です = My hobby is [hobby].",
    }),
    cloze(
      "ja-m24-2-2-cloze-kirai",
      "テレビを みる",
      " きらいです。",
      "のが",
      ["のが", "が", "は", "を"],
      "I dislike watching TV.",
      "テレビを みるのが きらいです。",
      "のが + きらい = dislike doing.",
    ),
    build(
      "ja-m24-2-2-build-suki-atsumeru",
      "Say: I like collecting things.",
      "ものを あつめるのが すきです",
      ["もの", "を", "あつめるのが", "すき", "です", "きらい"],
      ["もの", "を", "あつめるのが", "すき", "です"],
    ),
    translateStep({
      id: "ja-m24-2-2-translate",
      promptEn: "I like taking photos.",
      acceptedAnswers: [
        "しゃしんを とるのが すきです",
        "しゃしんを とるのが すきです。",
      ],
      audioText: "しゃしんを とるのが すきです",
    }),
    selfExplain({
      id: "ja-m24-2-2-self-explain",
      anchorLabel: "アニメを みるのが すきです",
      anchorAudioText: "アニメを みるのが すきです",
      question: "Can you use のがすき with hobby NOUNS directly?",
      rule: { text: "For hobby nouns (キャンプ, つり), you can use が directly: キャンプが すきです. のが is needed when nominalizing a VERB phrase: みるのが すきです." },
      surface: { text: "No — you always need のが, even with simple nouns." },
      distractor: { text: "Nouns use はすき, not がすき." },
      ruleExplanation:
        "Noun + が + すき: キャンプが すきです. Verb phrase + のが + すき: みるのが すきです. の nominalizes verbs only.",
    }),
    speaking(
      "ja-m24-2-2-speak-anime",
      "アニメを みるのが すきです",
      "I like watching anime.",
    ),
    // ── Review tail ──
    speaking("ja-m24-2-2-rev-speak-1", M24_2_2_REVIEW[0].kana, M24_2_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m24-2-2-rev-lc-1",
      audioText: M24_2_2_REVIEW[1].kana,
      correctMeaningEn: M24_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M24_2_2_REVIEW[2].meaningEn,
        M24_2_2_REVIEW[3].meaningEn,
        M24_REVIEW_POOL[3].meaningEn,
      ],
    }),
    vocabMcq("ja-m24-2-2-rev-mcq-1", M24_2_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M24_REVIEW_POOL),
    reviewMatchPairs("ja-m24-2-2-rev", M24_2_2_REVIEW),
    infoStep(
      "ja-m24-2-2-info-end",
      "You can now express hobby preferences in Japanese",
      "のがすき and のがきらい — with all your hobby nouns and verbs.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M24_2_2.steps);
assertAnswerRotation(M24_2_2.steps, 1);
assertNoConsecutiveSame(M24_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-3-1 — "Doing things like X and Y" intro
//   (たり〜たりする)
// ═══════════════════════════════════════════════════════════════════════

const M24_3_1_REVIEW = pickReviewAtoms("ja-m24-3-1-rev", M24_REVIEW_POOL, 4);

export const M24_3_1: LessonContent = {
  id: "ja-m24-3-1",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Things like X and Y (intro)",
  description:
    "Non-exhaustive listing with たり〜たりする — 'I do things like X and Y.'",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m24-3-1-info-open",
      "Listing hobbies casually",
      "When someone asks about your weekend, you don't list everything. たり〜たりする says 'among other things, I do X and Y.'",
    ),
    RULE_TARI_TARI,
    // ── たり〜たりする drills ──
    build(
      "ja-m24-3-1-build-tari-1",
      "Say: I do things like watching TV and reading manga.",
      "テレビを みたり まんがを よんだりします",
      ["テレビ", "を", "みたり", "まんが", "を", "よんだり", "します", "みます"],
      ["テレビ", "を", "みたり", "まんが", "を", "よんだり", "します"],
    ),
    sentenceMcq({
      id: "ja-m24-3-1-mcq-tari",
      prompt: "Which means 'I do things like drawing and taking photos.'?",
      correctKana: "えを かいたり しゃしんを とったりします。",
      distractorsKana: [
        "えを かいて しゃしんを とります。",
        "えと しゃしんが すきです。",
        "えを かきます しゃしんを とります。",
      ],
      explanation: "かいたり…とったりします = do things like drawing and taking photos (among others).",
    }),
    cloze(
      "ja-m24-3-1-cloze-tari",
      "テレビを みたり まんがを よんだり",
      "。",
      "します",
      ["します", "する", "です", "ます"],
      "I do things like watching TV and reading manga.",
      "テレビを みたり まんがを よんだりします。",
      "します closes the たり〜たり list.",
    ),
    listeningCompSentence({
      id: "ja-m24-3-1-lc-tari",
      audioText: "つりを したり ハイキングを したりします",
      correctMeaningEn: "I do things like fishing and hiking.",
      distractorsEn: [
        "I go fishing and hiking.",
        "I like fishing and hiking.",
        "I fish or hike.",
      ],
    }),
    build(
      "ja-m24-3-1-build-tari-2",
      "Say: On weekends, I do things like camping and jogging.",
      "しゅうまつに キャンプを したり ジョギングを したりします",
      ["しゅうまつ", "に", "キャンプ", "を", "したり", "ジョギング", "を", "したり", "します"],
      ["しゅうまつ", "に", "キャンプ", "を", "したり", "ジョギング", "を", "したり", "します"],
    ),
    sentenceMcq({
      id: "ja-m24-3-1-mcq-exhaustive",
      prompt: "たり〜たり implies...?",
      correctKana: "The list is non-exhaustive — you do other things too.",
      distractorsKana: [
        "The list is complete — these are the only things.",
        "You do them in order.",
        "You only do one of them.",
      ],
      explanation: "たり〜たり = 'things like X and Y (among others).' Unlike と (exhaustive), it's open-ended.",
    }),
    listeningBuildSentence({
      id: "ja-m24-3-1-lb-tari",
      target: "えを かいたり しゃしんを とったりします",
      tiles: ["え", "を", "かいたり", "しゃしん", "を", "とったり", "します", "みたり"],
      correctOrder: ["え", "を", "かいたり", "しゃしん", "を", "とったり", "します"],
      promptEn: "Hear it, build it: 'I do things like drawing and taking photos.'",
    }),
    cloze(
      "ja-m24-3-1-cloze-tari-2",
      "アニメを み",
      " まんがを よんだりします。",
      "たり",
      ["たり", "て", "ます", "の"],
      "I do things like watching anime and reading manga.",
      "アニメを みたり まんがを よんだりします。",
      "たり after the た-form of みる: みた + り → みたり.",
    ),
    build(
      "ja-m24-3-1-build-tari-3",
      "Say: I do things like collecting and making.",
      "あつめたり つくったりします",
      ["あつめたり", "つくったり", "します", "あつめます", "つくります"],
      ["あつめたり", "つくったり", "します"],
    ),
    selfExplain({
      id: "ja-m24-3-1-self-explain",
      anchorLabel: "テレビを みたり まんがを よんだりします",
      anchorAudioText: "テレビを みたり まんがを よんだりします",
      question: "How is たり〜たり different from using て to chain actions?",
      rule: { text: "て-form chains actions in sequence (A, then B). たり〜たり lists non-exhaustively — 'things like A and B, among others.' No sequence implied." },
      surface: { text: "They mean exactly the same thing — both list actions." },
      distractor: { text: "たり is past tense; て is present tense." },
      ruleExplanation:
        "て = sequential (first A, then B). たり〜たり = non-exhaustive sample (things like A and B). Different meaning.",
    }),
    speaking(
      "ja-m24-3-1-speak-tari",
      "テレビを みたり まんがを よんだりします",
      "I do things like watching TV and reading manga.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m24-3-1-rev-mcq-1", M24_3_1_REVIEW[0], M24_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m24-3-1-rev-lc-1",
      audioText: M24_3_1_REVIEW[1].kana,
      correctMeaningEn: M24_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M24_3_1_REVIEW[2].meaningEn,
        M24_3_1_REVIEW[3].meaningEn,
        M24_REVIEW_POOL[4].meaningEn,
      ],
    }),
    speaking("ja-m24-3-1-rev-speak-1", M24_3_1_REVIEW[2].kana, M24_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m24-3-1-rev", M24_3_1_REVIEW),
    infoStep(
      "ja-m24-3-1-info-end",
      "You can now casually list your hobbies with たり〜たり",
      "たり〜たりする — non-exhaustive listing. Natural for talking about weekends and hobbies.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M24_3_1.steps);
assertAnswerRotation(M24_3_1.steps, 1);
assertNoConsecutiveSame(M24_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-3-2 — たり〜たり practice
// ═══════════════════════════════════════════════════════════════════════

const M24_3_2_REVIEW = pickReviewAtoms("ja-m24-3-2-rev", M24_REVIEW_POOL, 4);

export const M24_3_2: LessonContent = {
  id: "ja-m24-3-2",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Things like X and Y (practice)",
  description:
    "Drill たり〜たりする with broader hobby combinations and frequency words.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m24-3-2-info-open",
      "More casual listing",
      "More たり practice with different hobby combinations. Plus: ときどき (sometimes) and よく (often).",
    ),
    // ── ときどき (sometimes) + よく (often) ──
    build(
      "ja-m24-3-2-build-tokidoki",
      "Pick the Japanese word for: Sometimes",
      "ときどき",
      ["ときどき", "よく", "あまり", "まいにち"],
      ["ときどき"],
    ),
    listeningCompSentence({
      id: "ja-m24-3-2-lc-tokidoki",
      audioText: "ときどき",
      correctMeaningEn: "sometimes",
      distractorsEn: ["often", "not much", "every day"],
    }),
    build(
      "ja-m24-3-2-build-yoku",
      "Pick the Japanese word for: Often",
      "よく",
      ["よく", "ときどき", "あまり", "まいしゅう"],
      ["よく"],
    ),
    speaking("ja-m24-3-2-speak-yoku", "よく", "Often"),
    // ── たり drills with frequency ──
    build(
      "ja-m24-3-2-build-tari-tokidoki",
      "Say: Sometimes I do things like reading magazines and listening to the radio.",
      "ときどき ざっしを よんだり ラジオを きいたりします",
      ["ときどき", "ざっし", "を", "よんだり", "ラジオ", "を", "きいたり", "します"],
      ["ときどき", "ざっし", "を", "よんだり", "ラジオ", "を", "きいたり", "します"],
    ),
    sentenceMcq({
      id: "ja-m24-3-2-mcq-tari",
      prompt: "Which means 'I often do things like drawing and watching anime.'?",
      correctKana: "よく えを かいたり アニメを みたりします。",
      distractorsKana: [
        "よく えを かいて アニメを みます。",
        "えと アニメが すきです。",
        "よく えを かきます。",
      ],
      explanation: "よく + たり〜たりします = often do things like X and Y.",
    }),
    cloze(
      "ja-m24-3-2-cloze-tari",
      "ときどき つりを し",
      " キャンプを したりします。",
      "たり",
      ["たり", "て", "ます", "の"],
      "Sometimes I do things like fishing and camping.",
      "ときどき つりを したり キャンプを したりします。",
      "したり = た-form of する + り.",
    ),
    listeningCompSentence({
      id: "ja-m24-3-2-lc-tari-yoku",
      audioText: "よく ジョギングを したり ハイキングを したりします",
      correctMeaningEn: "I often do things like jogging and hiking.",
      distractorsEn: [
        "I jog and hike.",
        "I like jogging and hiking.",
        "I sometimes jog or hike.",
      ],
    }),
    build(
      "ja-m24-3-2-build-tari-anime",
      "Say: I do things like watching anime and collecting manga.",
      "アニメを みたり まんがを あつめたりします",
      ["アニメ", "を", "みたり", "まんが", "を", "あつめたり", "します"],
      ["アニメ", "を", "みたり", "まんが", "を", "あつめたり", "します"],
    ),
    listeningBuildSentence({
      id: "ja-m24-3-2-lb-tari",
      target: "ときどき えを かいたり しゃしんを とったりします",
      tiles: ["ときどき", "え", "を", "かいたり", "しゃしん", "を", "とったり", "します"],
      correctOrder: ["ときどき", "え", "を", "かいたり", "しゃしん", "を", "とったり", "します"],
      promptEn: "Hear it, build it: 'Sometimes I do things like drawing and taking photos.'",
    }),
    cloze(
      "ja-m24-3-2-cloze-shimasu",
      "テレビを みたり ラジオを きいたり",
      "。",
      "します",
      ["します", "する", "です", "ます"],
      "I do things like watching TV and listening to the radio.",
      "テレビを みたり ラジオを きいたりします。",
      "します closes the たり list.",
    ),
    translateStep({
      id: "ja-m24-3-2-translate",
      promptEn: "On weekends, I do things like fishing and camping.",
      acceptedAnswers: [
        "しゅうまつに つりを したり キャンプを したりします",
        "しゅうまつに つりを したり キャンプを したりします。",
      ],
      audioText: "しゅうまつに つりを したり キャンプを したりします",
    }),
    selfExplain({
      id: "ja-m24-3-2-self-explain",
      anchorLabel: "ときどき ざっしを よんだり ラジオを きいたりします",
      anchorAudioText: "ときどき ざっしを よんだりします",
      question: "How do you form the たり form of a verb?",
      rule: { text: "Take the た-form (past plain) and add り: かいた → かいたり, よんだ → よんだり, した → したり." },
      surface: { text: "Add たり to the dictionary form: かくたり, よむたり." },
      distractor: { text: "Add り to the ます-form: かきり, よみり." },
      ruleExplanation:
        "たり = past plain form (た/だ form) + り. The た-form rules apply: く→いた, む→んだ, する→した.",
    }),
    speaking(
      "ja-m24-3-2-speak-tari",
      "よく えを かいたり しゃしんを とったりします",
      "I often do things like drawing and taking photos.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m24-3-2-rev-mcq-1", M24_3_2_REVIEW[0], M24_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m24-3-2-rev-lc-1",
      audioText: M24_3_2_REVIEW[1].kana,
      correctMeaningEn: M24_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M24_3_2_REVIEW[2].meaningEn,
        M24_3_2_REVIEW[3].meaningEn,
        M24_REVIEW_POOL[5].meaningEn,
      ],
    }),
    speaking("ja-m24-3-2-rev-speak-1", M24_3_2_REVIEW[2].kana, M24_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m24-3-2-rev", M24_3_2_REVIEW),
    infoStep(
      "ja-m24-3-2-info-end",
      "You can now casually describe your hobby routine with frequency",
      "たり〜たり + ときどき/よく — natural weekend conversation.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M24_3_2.steps);
assertAnswerRotation(M24_3_2.steps, 1);
assertNoConsecutiveSame(M24_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-4-1 — Counter かい intro
//   (いっかい, にかい, さんかい + まいにち, まいしゅう)
// ═══════════════════════════════════════════════════════════════════════

const M24_4_1_REVIEW = pickReviewAtoms("ja-m24-4-1-rev", M24_REVIEW_POOL, 4);

export const M24_4_1: LessonContent = {
  id: "ja-m24-4-1",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Counting times (intro)",
  description:
    "Counter かい — once, twice, three times — plus まいにち and まいしゅう.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m24-4-1-info-open",
      "How many times?",
      "Once, twice, three times — a new counter for frequency. Plus 'every day' and 'every week.'",
    ),
    RULE_KAI_COUNTER,
    // ── いっかい (1 time) ──
    build(
      "ja-m24-4-1-build-ikkai",
      "Pick the Japanese word for: Once (1 time)",
      "いっかい",
      ["いっかい", "にかい", "さんかい", "ときどき"],
      ["いっかい"],
    ),
    listeningCompSentence({
      id: "ja-m24-4-1-lc-ikkai",
      audioText: "いっかい",
      correctMeaningEn: "once (1 time)",
      distractorsEn: ["twice", "three times", "sometimes"],
    }),
    // ── にかい (2 times) ──
    build(
      "ja-m24-4-1-build-nikai",
      "Pick the Japanese word for: Twice (2 times)",
      "にかい",
      ["にかい", "いっかい", "さんかい", "よく"],
      ["にかい"],
    ),
    speaking("ja-m24-4-1-speak-nikai", "にかい", "Twice"),
    // ── さんかい (3 times) ──
    build(
      "ja-m24-4-1-build-sankai",
      "Pick the Japanese word for: Three times",
      "さんかい",
      ["さんかい", "にかい", "いっかい", "まいにち"],
      ["さんかい"],
    ),
    listeningCompSentence({
      id: "ja-m24-4-1-lc-sankai",
      audioText: "さんかい",
      correctMeaningEn: "three times",
      distractorsEn: ["once", "twice", "every day"],
    }),
    // ── まいにち / まいしゅう ──
    build(
      "ja-m24-4-1-build-mainichi",
      "Pick the Japanese word for: Every day",
      "まいにち",
      ["まいにち", "まいしゅう", "ときどき", "よく"],
      ["まいにち"],
    ),
    build(
      "ja-m24-4-1-build-maishuu",
      "Pick the Japanese word for: Every week",
      "まいしゅう",
      ["まいしゅう", "まいにち", "いっかい", "にかい"],
      ["まいしゅう"],
    ),
    // ── Counter drills ──
    build(
      "ja-m24-4-1-build-nikai-jogingu",
      "Say: I jog twice a week.",
      "まいしゅう にかい ジョギングします",
      ["まいしゅう", "にかい", "ジョギング", "します", "いっかい", "さんかい"],
      ["まいしゅう", "にかい", "ジョギング", "します"],
    ),
    sentenceMcq({
      id: "ja-m24-4-1-mcq-counter",
      prompt: "Which means 'I take a walk once every day.'?",
      correctKana: "まいにち いっかい さんぽします。",
      distractorsKana: [
        "まいにち にかい さんぽします。",
        "まいしゅう いっかい さんぽします。",
        "ときどき さんぽします。",
      ],
      explanation: "まいにち いっかい = once every day.",
    }),
    cloze(
      "ja-m24-4-1-cloze-kai",
      "まいしゅう ",
      " ジョギングします。",
      "にかい",
      ["にかい", "いっかい", "さんかい", "ときどき"],
      "I jog twice a week.",
      "まいしゅう にかい ジョギングします。",
      "にかい = twice. Counts occurrences.",
    ),
    listeningCompSentence({
      id: "ja-m24-4-1-lc-mainichi",
      audioText: "まいにち いっかい さんぽします",
      correctMeaningEn: "I take a walk once every day.",
      distractorsEn: [
        "I take a walk every week.",
        "I sometimes take a walk.",
        "I take three walks a day.",
      ],
    }),
    selfExplain({
      id: "ja-m24-4-1-self-explain",
      anchorLabel: "まいしゅう にかい ジョギングします",
      anchorAudioText: "まいしゅう にかい ジョギングします",
      question: "Why いっかい and not いちかい?",
      rule: { text: "Sound change: いち + かい → いっかい. The ち becomes っ (double consonant) before か. This is a regular Japanese sound change called 促音 (gemination)." },
      surface: { text: "いち is the Chinese reading; いっ is the Japanese reading." },
      distractor: { text: "いっかい is completely unrelated to いち — it's a separate word." },
      ruleExplanation:
        "Sound change: いち + か → いっか (doubled consonant). Same pattern as いっぱい, いっぽん.",
    }),
    speaking(
      "ja-m24-4-1-speak-counter",
      "まいしゅう にかい ジョギングします",
      "I jog twice a week.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m24-4-1-rev-mcq-1", M24_4_1_REVIEW[0], M24_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m24-4-1-rev-lc-1",
      audioText: M24_4_1_REVIEW[1].kana,
      correctMeaningEn: M24_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M24_4_1_REVIEW[2].meaningEn,
        M24_4_1_REVIEW[3].meaningEn,
        M24_REVIEW_POOL[6].meaningEn,
      ],
    }),
    speaking("ja-m24-4-1-rev-speak-1", M24_4_1_REVIEW[2].kana, M24_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m24-4-1-rev", M24_4_1_REVIEW),
    infoStep(
      "ja-m24-4-1-info-end",
      "You can now say how many times you do something",
      "いっかい, にかい, さんかい + まいにち, まいしゅう — frequency counting.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M24_4_1.steps);
assertAnswerRotation(M24_4_1.steps, 1);
assertNoConsecutiveSame(M24_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-4-2 — Counter かい practice + あまり
// ═══════════════════════════════════════════════════════════════════════

const M24_4_2_REVIEW = pickReviewAtoms("ja-m24-4-2-rev", M24_REVIEW_POOL, 4);

export const M24_4_2: LessonContent = {
  id: "ja-m24-4-2",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Counting times (practice)",
  description:
    "Drill かい counter in hobby context + あまり (not much).",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m24-4-2-info-open",
      "Frequency practice",
      "How often do you do your hobbies? Count times, say 'not much,' and describe your routine.",
    ),
    // ── あまり (not much) ──
    build(
      "ja-m24-4-2-build-amari",
      "Pick the Japanese word for: Not much / Not often",
      "あまり",
      ["あまり", "よく", "ときどき", "まいにち"],
      ["あまり"],
    ),
    listeningCompSentence({
      id: "ja-m24-4-2-lc-amari",
      audioText: "あまり テレビを みません",
      correctMeaningEn: "I don't watch TV much.",
      distractorsEn: [
        "I often watch TV.",
        "I watch TV every day.",
        "I sometimes watch TV.",
      ],
    }),
    // ── Counter drills ──
    build(
      "ja-m24-4-2-build-sankai-tsuri",
      "Say: I went fishing three times.",
      "つりに さんかい いきました",
      ["つり", "に", "さんかい", "いきました", "にかい", "いっかい"],
      ["つり", "に", "さんかい", "いきました"],
    ),
    sentenceMcq({
      id: "ja-m24-4-2-mcq-amari",
      prompt: "Which means 'I don't read magazines much.'?",
      correctKana: "あまり ざっしを よみません。",
      distractorsKana: [
        "よく ざっしを よみます。",
        "ときどき ざっしを よみます。",
        "まいにち ざっしを よみます。",
      ],
      explanation: "あまり + negative = not much / not often.",
    }),
    cloze(
      "ja-m24-4-2-cloze-kai",
      "まいにち ",
      " さんぽします。",
      "いっかい",
      ["いっかい", "にかい", "さんかい", "よく"],
      "I take a walk once every day.",
      "まいにち いっかい さんぽします。",
      "いっかい = once.",
    ),
    listeningCompSentence({
      id: "ja-m24-4-2-lc-nikai",
      audioText: "まいしゅう にかい えを かきます",
      correctMeaningEn: "I draw pictures twice a week.",
      distractorsEn: [
        "I draw pictures every day.",
        "I draw pictures once a week.",
        "I draw pictures three times a week.",
      ],
    }),
    build(
      "ja-m24-4-2-build-amari-tsuri",
      "Say: I don't go fishing much.",
      "あまり つりに いきません",
      ["あまり", "つり", "に", "いきません", "いきます", "よく"],
      ["あまり", "つり", "に", "いきません"],
    ),
    listeningBuildSentence({
      id: "ja-m24-4-2-lb-counter",
      target: "まいしゅう さんかい ジョギングします",
      tiles: ["まいしゅう", "さんかい", "ジョギング", "します", "にかい", "いっかい"],
      correctOrder: ["まいしゅう", "さんかい", "ジョギング", "します"],
      promptEn: "Hear it, build it: 'I jog three times a week.'",
    }),
    sentenceMcq({
      id: "ja-m24-4-2-mcq-nikai",
      prompt: "How do you say 'I went to Japan twice'?",
      correctKana: "にほんに にかい いきました。",
      distractorsKana: [
        "にほんに ふたつ いきました。",
        "にほんに にかいめ いきました。",
        "にほんに にど いきます。",
      ],
      explanation: "にかい = twice. いきました = went.",
    }),
    cloze(
      "ja-m24-4-2-cloze-amari",
      " ",
      "アニメを みません。",
      "あまり",
      ["あまり", "よく", "ときどき", "まいにち"],
      "I don't watch anime much.",
      "あまり アニメを みません。",
      "あまり + negative verb = not much / not often.",
    ),
    translateStep({
      id: "ja-m24-4-2-translate",
      promptEn: "I jog three times a week.",
      acceptedAnswers: [
        "まいしゅう さんかい ジョギングします",
        "まいしゅう さんかい ジョギングします。",
      ],
      audioText: "まいしゅう さんかい ジョギングします",
    }),
    selfExplain({
      id: "ja-m24-4-2-self-explain",
      anchorLabel: "あまり テレビを みません",
      anchorAudioText: "あまり テレビを みません",
      question: "あまり always pairs with what verb form?",
      rule: { text: "あまり pairs with the NEGATIVE form: あまり〜ません / あまり〜ない. It means 'not much / not often.'" },
      surface: { text: "あまり pairs with the positive form: あまり〜ます." },
      distractor: { text: "あまり can pair with either positive or negative." },
      ruleExplanation:
        "あまり + negative = not much. Unlike よく or ときどき (which pair with positive verbs), あまり requires a negative.",
    }),
    speaking(
      "ja-m24-4-2-speak-amari",
      "あまり つりに いきません",
      "I don't go fishing much.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m24-4-2-rev-mcq-1", M24_4_2_REVIEW[0], M24_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m24-4-2-rev-lc-1",
      audioText: M24_4_2_REVIEW[1].kana,
      correctMeaningEn: M24_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M24_4_2_REVIEW[2].meaningEn,
        M24_4_2_REVIEW[3].meaningEn,
        M24_REVIEW_POOL[7].meaningEn,
      ],
    }),
    speaking("ja-m24-4-2-rev-speak-1", M24_4_2_REVIEW[2].kana, M24_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m24-4-2-rev", M24_4_2_REVIEW),
    infoStep(
      "ja-m24-4-2-info-end",
      "You can now say how many times and how often you do hobbies",
      "かい counter + あまり — frequency vocabulary complete.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M24_4_2.steps);
assertAnswerRotation(M24_4_2.steps, 1);
assertNoConsecutiveSame(M24_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-5-1 — Interleaved drill I (all patterns)
// ═══════════════════════════════════════════════════════════════════════

const M24_5_1_REVIEW = pickReviewAtoms("ja-m24-5-1-rev", M24_REVIEW_POOL, 4);

export const M24_5_1: LessonContent = {
  id: "ja-m24-5-1",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Hobby drill I",
  description:
    "Mix のがすき, たり〜たり, and かい counter in hobby conversations.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m24-5-1-info-open",
      "All hobby patterns",
      "のがすき + たり〜たり + かい counter — all three patterns mixed in production.",
    ),
    cloze(
      "ja-m24-5-1-cloze-noga",
      "しゃしんを とる",
      " すきです。",
      "のが",
      ["のが", "が", "は", "を"],
      "I like taking photos.",
      "しゃしんを とるのが すきです。",
      "のが nominalizes the verb phrase.",
    ),
    build(
      "ja-m24-5-1-build-tari",
      "Say: I do things like hiking and camping.",
      "ハイキングを したり キャンプを したりします",
      ["ハイキング", "を", "したり", "キャンプ", "を", "したり", "します"],
      ["ハイキング", "を", "したり", "キャンプ", "を", "したり", "します"],
    ),
    sentenceMcq({
      id: "ja-m24-5-1-mcq-kai",
      prompt: "Which means 'I draw pictures three times a week.'?",
      correctKana: "まいしゅう さんかい えを かきます。",
      distractorsKana: [
        "まいにち さんかい えを かきます。",
        "まいしゅう いっかい えを かきます。",
        "ときどき えを かきます。",
      ],
      explanation: "まいしゅう さんかい = three times a week.",
    }),
    listeningCompSentence({
      id: "ja-m24-5-1-lc-tari",
      audioText: "アニメを みたり まんがを よんだりします",
      correctMeaningEn: "I do things like watching anime and reading manga.",
      distractorsEn: [
        "I watch anime and read manga.",
        "I like anime and manga.",
        "I sometimes watch anime.",
      ],
    }),
    build(
      "ja-m24-5-1-build-suki-tsuri",
      "Say: I like fishing.",
      "つりが すきです",
      ["つり", "が", "すき", "です", "きらい", "は"],
      ["つり", "が", "すき", "です"],
    ),
    cloze(
      "ja-m24-5-1-cloze-tari",
      "テレビを みたり ラジオを きいたり",
      "。",
      "します",
      ["します", "する", "です", "ます"],
      "I do things like watching TV and listening to the radio.",
      "テレビを みたり ラジオを きいたりします。",
      "します closes the たり list.",
    ),
    speaking(
      "ja-m24-5-1-speak-counter",
      "まいにち いっかい さんぽします",
      "I take a walk once every day.",
    ),
    listeningBuildSentence({
      id: "ja-m24-5-1-lb-suki",
      target: "えを かくのが すきです",
      tiles: ["え", "を", "かくのが", "すき", "です", "きらい", "つくる"],
      correctOrder: ["え", "を", "かくのが", "すき", "です"],
      promptEn: "Hear it, build it: 'I like drawing pictures.'",
    }),
    sentenceMcq({
      id: "ja-m24-5-1-mcq-amari",
      prompt: "Which means 'I don't read magazines much.'?",
      correctKana: "あまり ざっしを よみません。",
      distractorsKana: [
        "よく ざっしを よみます。",
        "ときどき ざっしを よみます。",
        "まいにち ざっしを よみます。",
      ],
      explanation: "あまり + negative = not much.",
    }),
    build(
      "ja-m24-5-1-build-shumi",
      "Answer: My hobby is taking photos.",
      "しゅみは しゃしんです",
      ["しゅみ", "は", "しゃしん", "です", "つり", "が"],
      ["しゅみ", "は", "しゃしん", "です"],
    ),
    translateStep({
      id: "ja-m24-5-1-translate",
      promptEn: "I do things like watching TV and reading manga.",
      acceptedAnswers: [
        "テレビを みたり まんがを よんだりします",
        "テレビを みたり まんがを よんだりします。",
      ],
      audioText: "テレビを みたり まんがを よんだりします",
    }),
    selfExplain({
      id: "ja-m24-5-1-self-explain",
      anchorLabel: "Three hobby patterns mixed",
      anchorAudioText: "テレビを みたり まんがを よんだりします",
      question: "When would you use たり vs のがすき to talk about hobbies?",
      rule: { text: "のがすき describes PREFERENCE (I like doing X). たり〜たり describes BEHAVIOR (I do things like X and Y). Different purposes." },
      surface: { text: "They're interchangeable — both describe hobbies." },
      distractor: { text: "たり is for listing; のがすき is only for asking questions." },
      ruleExplanation:
        "のがすき = what you LIKE doing. たり〜たり = what you ACTUALLY DO (sampling). Both useful for hobby conversations.",
    }),
    speaking(
      "ja-m24-5-1-speak-tari",
      "つりを したり キャンプを したりします",
      "I do things like fishing and camping.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m24-5-1-rev-mcq-1", M24_5_1_REVIEW[0], M24_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m24-5-1-rev-lc-1",
      audioText: M24_5_1_REVIEW[1].kana,
      correctMeaningEn: M24_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M24_5_1_REVIEW[2].meaningEn,
        M24_5_1_REVIEW[3].meaningEn,
        M24_REVIEW_POOL[8].meaningEn,
      ],
    }),
    speaking("ja-m24-5-1-rev-speak-1", M24_5_1_REVIEW[2].kana, M24_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m24-5-1-rev", M24_5_1_REVIEW),
    infoStep(
      "ja-m24-5-1-info-end",
      "You can now describe hobbies using preferences, casual lists, and frequency",
      "のがすき, たり〜たり, かい counter — all interleaved.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M24_5_1.steps);
assertAnswerRotation(M24_5_1.steps, 1);
assertNoConsecutiveSame(M24_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-5-2 — Interleaved drill II
// ═══════════════════════════════════════════════════════════════════════

const M24_5_2_REVIEW = pickReviewAtoms("ja-m24-5-2-rev", M24_REVIEW_POOL, 4);

export const M24_5_2: LessonContent = {
  id: "ja-m24-5-2",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Hobby drill II",
  description:
    "Production-heavy rotation of all M24 grammar with full vocab.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m24-5-2-info-open",
      "Full hobby rotation",
      "All M24 patterns at production level — build, speak, translate.",
    ),
    build(
      "ja-m24-5-2-build-tari-weekend",
      "Say: On weekends, I do things like drawing and jogging.",
      "しゅうまつに えを かいたり ジョギングを したりします",
      ["しゅうまつ", "に", "え", "を", "かいたり", "ジョギング", "を", "したり", "します"],
      ["しゅうまつ", "に", "え", "を", "かいたり", "ジョギング", "を", "したり", "します"],
    ),
    cloze(
      "ja-m24-5-2-cloze-suki",
      "まんがを よむ",
      " すきです。",
      "のが",
      ["のが", "が", "は", "を"],
      "I like reading manga.",
      "まんがを よむのが すきです。",
      "のが nominalizes the verb.",
    ),
    speaking(
      "ja-m24-5-2-speak-counter",
      "まいしゅう にかい キャンプに いきます",
      "I go camping twice a week.",
    ),
    sentenceMcq({
      id: "ja-m24-5-2-mcq-tari",
      prompt: "Which uses the non-exhaustive listing pattern?",
      correctKana: "ざっしを よんだり アニメを みたりします。",
      distractorsKana: [
        "ざっしを よんで アニメを みます。",
        "ざっしと アニメが すきです。",
        "ざっしを よみます。アニメを みます。",
      ],
      explanation: "たり〜たりします = non-exhaustive list.",
    }),
    build(
      "ja-m24-5-2-build-suki-collect",
      "Say: I like collecting photos.",
      "しゃしんを あつめるのが すきです",
      ["しゃしん", "を", "あつめるのが", "すき", "です", "きらい"],
      ["しゃしん", "を", "あつめるのが", "すき", "です"],
    ),
    listeningCompSentence({
      id: "ja-m24-5-2-lc-amari",
      audioText: "あまり ラジオを ききません",
      correctMeaningEn: "I don't listen to the radio much.",
      distractorsEn: [
        "I often listen to the radio.",
        "I listen to the radio every day.",
        "I sometimes listen to the radio.",
      ],
    }),
    cloze(
      "ja-m24-5-2-cloze-tari",
      "つりを し",
      " キャンプを したりします。",
      "たり",
      ["たり", "て", "ます", "の"],
      "I do things like fishing and camping.",
      "つりを したり キャンプを したりします。",
      "したり = た-form of する + り.",
    ),
    build(
      "ja-m24-5-2-build-counter-daily",
      "Say: I read manga twice every day.",
      "まいにち にかい まんがを よみます",
      ["まいにち", "にかい", "まんが", "を", "よみます", "さんかい"],
      ["まいにち", "にかい", "まんが", "を", "よみます"],
    ),
    listeningBuildSentence({
      id: "ja-m24-5-2-lb-tari",
      target: "えを かいたり しゃしんを とったりします",
      tiles: ["え", "を", "かいたり", "しゃしん", "を", "とったり", "します", "みたり"],
      correctOrder: ["え", "を", "かいたり", "しゃしん", "を", "とったり", "します"],
      promptEn: "Hear it, build it: 'I do things like drawing and taking photos.'",
    }),
    speaking(
      "ja-m24-5-2-speak-suki",
      "アニメを みるのが すきです",
      "I like watching anime.",
    ),
    sentenceMcq({
      id: "ja-m24-5-2-mcq-shumi-answer",
      prompt: "How do you answer しゅみは なんですか with 'Photography'?",
      correctKana: "しゅみは しゃしんです。",
      distractorsKana: [
        "しゃしんが すきですか。",
        "しゃしんを とります。",
        "しゃしんは しゅみですか。",
      ],
      explanation: "しゅみは [hobby]です = My hobby is [hobby].",
    }),
    translateStep({
      id: "ja-m24-5-2-translate",
      promptEn: "On weekends, I do things like hiking and camping.",
      acceptedAnswers: [
        "しゅうまつに ハイキングを したり キャンプを したりします",
        "しゅうまつに ハイキングを したり キャンプを したりします。",
      ],
      audioText: "しゅうまつに ハイキングを したり キャンプを したりします",
    }),
    selfExplain({
      id: "ja-m24-5-2-self-explain",
      anchorLabel: "All M24 patterns in production",
      anchorAudioText: "しゅうまつに えを かいたりします",
      question: "What three patterns did you learn in M24?",
      rule: { text: "1) のがすき (like doing — review). 2) たり〜たりする (non-exhaustive listing). 3) かい counter (counting times)." },
      surface: { text: "え, しゃしん, and つり — three hobby nouns." },
      distractor: { text: "すき, きらい, and へた — three preference adjectives." },
      ruleExplanation:
        "M24 grammar: のがすき (preference), たり〜たり (casual listing), かい (times counter). Plus ~25 hobby vocab words.",
    }),
    speaking(
      "ja-m24-5-2-speak-tari",
      "テレビを みたり ざっしを よんだりします",
      "I do things like watching TV and reading magazines.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m24-5-2-rev-mcq-1", M24_5_2_REVIEW[0], M24_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m24-5-2-rev-lc-1",
      audioText: M24_5_2_REVIEW[1].kana,
      correctMeaningEn: M24_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M24_5_2_REVIEW[2].meaningEn,
        M24_5_2_REVIEW[3].meaningEn,
        M24_REVIEW_POOL[9].meaningEn,
      ],
    }),
    speaking("ja-m24-5-2-rev-speak-1", M24_5_2_REVIEW[2].kana, M24_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m24-5-2-rev", M24_5_2_REVIEW),
    infoStep(
      "ja-m24-5-2-info-end",
      "You own all M24 hobby patterns in production",
      "のがすき, たり〜たり, かい counter — rotated and production-ready.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M24_5_2.steps);
assertAnswerRotation(M24_5_2.steps, 1);
assertNoConsecutiveSame(M24_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-6-1 — Production I
// ═══════════════════════════════════════════════════════════════════════

const M24_6_1_REVIEW = pickReviewAtoms("ja-m24-6-1-rev", M24_REVIEW_POOL, 4);

export const M24_6_1: LessonContent = {
  id: "ja-m24-6-1",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Hobby production I",
  description:
    "Production-heavy: build and speak all M24 patterns from English prompts.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep("ja-m24-6-1-info-open", "Full production", "Build, speak, translate — no recognition crutches."),
    build("ja-m24-6-1-build-1", "Say: I like making things.", "ものを つくるのが すきです", ["もの", "を", "つくるのが", "すき", "です", "きらい"], ["もの", "を", "つくるのが", "すき", "です"]),
    speaking("ja-m24-6-1-speak-1", "しゅうまつに えを かいたり しゃしんを とったりします", "On weekends, I do things like drawing and taking photos."),
    build("ja-m24-6-1-build-2", "Say: I jog twice a week.", "まいしゅう にかい ジョギングします", ["まいしゅう", "にかい", "ジョギング", "します", "さんかい"], ["まいしゅう", "にかい", "ジョギング", "します"]),
    listeningBuildSentence({ id: "ja-m24-6-1-lb-1", target: "つりが すきです", tiles: ["つり", "が", "すき", "です", "きらい", "は"], correctOrder: ["つり", "が", "すき", "です"], promptEn: "Hear it, build it: 'I like fishing.'" }),
    speaking("ja-m24-6-1-speak-2", "あまり ラジオを ききません", "I don't listen to the radio much."),
    build("ja-m24-6-1-build-3", "Say: My hobby is photography.", "しゅみは しゃしんです", ["しゅみ", "は", "しゃしん", "です", "つり", "が"], ["しゅみ", "は", "しゃしん", "です"]),
    sentenceMcq({ id: "ja-m24-6-1-mcq-1", prompt: "Which uses たり correctly?", correctKana: "まんがを よんだり アニメを みたりします。", distractorsKana: ["まんがを よんで アニメを みます。", "まんがとアニメが すきです。", "まんがを よみたり アニメを みたりします。"], explanation: "よんだり (from よむ → よんだ + り) is correct. よみたり is wrong." }),
    build("ja-m24-6-1-build-4", "Say: I sometimes do things like collecting manga.", "ときどき まんがを あつめたりします", ["ときどき", "まんが", "を", "あつめたり", "します", "あつめます"], ["ときどき", "まんが", "を", "あつめたり", "します"]),
    translateStep({ id: "ja-m24-6-1-translate-1", promptEn: "I like collecting things.", acceptedAnswers: ["ものを あつめるのが すきです", "ものを あつめるのが すきです。"], audioText: "ものを あつめるのが すきです" }),
    speaking("ja-m24-6-1-speak-3", "まいにち いっかい さんぽします", "I take a walk once every day."),
    listeningCompSentence({ id: "ja-m24-6-1-lc-1", audioText: "ときどき キャンプを したり つりを したりします", correctMeaningEn: "I sometimes do things like camping and fishing.", distractorsEn: ["I camp and fish.", "I like camping and fishing.", "I camp every day."] }),
    build("ja-m24-6-1-build-5", "Ask: What is your hobby?", "しゅみは なんですか", ["しゅみ", "は", "なん", "です", "か", "だれ"], ["しゅみ", "は", "なん", "です", "か"]),
    selfExplain({ id: "ja-m24-6-1-self-explain", anchorLabel: "Production mastery", anchorAudioText: "しゅうまつに えを かいたりします", question: "How do you say what you like AND how often?", rule: { text: "Combine: えを かくのが すきです (I like drawing) + まいしゅう にかい かきます (I draw twice a week). Two separate sentences, each using its own pattern." }, surface: { text: "Use たり to say frequency — えを かいたり にかい します." }, distractor: { text: "Use のが + かい together: えを かくのが にかいです." }, ruleExplanation: "のがすき = preference (what you like). かい = frequency (how often). They're separate patterns used in separate sentences." }),
    speaking("ja-m24-6-1-speak-4", "しゅみは なんですか", "What is your hobby?"),
    // ── Review tail ──
    vocabMcq("ja-m24-6-1-rev-mcq-1", M24_6_1_REVIEW[0], M24_REVIEW_POOL),
    listeningCompSentence({ id: "ja-m24-6-1-rev-lc-1", audioText: M24_6_1_REVIEW[1].kana, correctMeaningEn: M24_6_1_REVIEW[1].meaningEn, distractorsEn: [M24_6_1_REVIEW[2].meaningEn, M24_6_1_REVIEW[3].meaningEn, M24_REVIEW_POOL[10].meaningEn] }),
    speaking("ja-m24-6-1-rev-speak-1", M24_6_1_REVIEW[2].kana, M24_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m24-6-1-rev", M24_6_1_REVIEW),
    infoStep("ja-m24-6-1-info-end", "You can produce all M24 patterns from English prompts", "Preferences, casual lists, and frequency — all in production.", "win"),
  ],
};

assertNoSameAnswerCluster(M24_6_1.steps);
assertAnswerRotation(M24_6_1.steps, 1);
assertNoConsecutiveSame(M24_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-6-2 — Production II
// ═══════════════════════════════════════════════════════════════════════

const M24_6_2_REVIEW = pickReviewAtoms("ja-m24-6-2-rev", M24_REVIEW_POOL, 4);

export const M24_6_2: LessonContent = {
  id: "ja-m24-6-2",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Hobby production II",
  description: "Final production drill — every M24 pattern in conversation context.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep("ja-m24-6-2-info-open", "Final production", "Last round. Every M24 pattern in flowing conversation."),
    build("ja-m24-6-2-build-1", "Say: I do things like fishing and hiking on weekends.", "しゅうまつに つりを したり ハイキングを したりします", ["しゅうまつ", "に", "つり", "を", "したり", "ハイキング", "を", "したり", "します"], ["しゅうまつ", "に", "つり", "を", "したり", "ハイキング", "を", "したり", "します"]),
    speaking("ja-m24-6-2-speak-1", "えを かくのが すきです", "I like drawing pictures."),
    cloze("ja-m24-6-2-cloze-kai", "まいしゅう ", " えを かきます。", "さんかい", ["さんかい", "にかい", "いっかい", "よく"], "I draw pictures three times a week.", "まいしゅう さんかい えを かきます。", "さんかい = three times."),
    build("ja-m24-6-2-build-2", "Answer the hobby question: I like watching anime.", "アニメを みるのが すきです", ["アニメ", "を", "みるのが", "すき", "です", "きらい"], ["アニメ", "を", "みるのが", "すき", "です"]),
    sentenceMcq({ id: "ja-m24-6-2-mcq-1", prompt: "Which means 'I don't go camping much.'?", correctKana: "あまり キャンプに いきません。", distractorsKana: ["よく キャンプに いきます。", "ときどき キャンプに いきます。", "まいしゅう キャンプに いきます。"], explanation: "あまり + negative = not much." }),
    listeningBuildSentence({ id: "ja-m24-6-2-lb-1", target: "まいしゅう にかい ジョギングします", tiles: ["まいしゅう", "にかい", "ジョギング", "します", "さんかい", "いっかい"], correctOrder: ["まいしゅう", "にかい", "ジョギング", "します"], promptEn: "Hear it, build it: 'I jog twice a week.'" }),
    speaking("ja-m24-6-2-speak-2", "ときどき つりを したり キャンプを したりします", "I sometimes do things like fishing and camping."),
    build("ja-m24-6-2-build-3", "Say: I don't watch anime much.", "あまり アニメを みません", ["あまり", "アニメ", "を", "みません", "みます", "よく"], ["あまり", "アニメ", "を", "みません"]),
    cloze("ja-m24-6-2-cloze-tari", "テレビを みたり まんがを よんだり", "。", "します", ["します", "する", "です", "ます"], "I do things like watching TV and reading manga.", "テレビを みたり まんがを よんだりします。", "します closes the たり list."),
    listeningCompSentence({ id: "ja-m24-6-2-lc-1", audioText: "しゅみは つりです", correctMeaningEn: "My hobby is fishing.", distractorsEn: ["I like fishing.", "I fish every day.", "Do you like fishing?"] }),
    translateStep({ id: "ja-m24-6-2-translate", promptEn: "I do things like watching anime and reading manga.", acceptedAnswers: ["アニメを みたり まんがを よんだりします", "アニメを みたり まんがを よんだりします。"], audioText: "アニメを みたり まんがを よんだりします" }),
    build("ja-m24-6-2-build-4", "Say: I like making things and collecting photos.", "ものを つくるのが すきです", ["もの", "を", "つくるのが", "すき", "です", "きらい"], ["もの", "を", "つくるのが", "すき", "です"]),
    selfExplain({ id: "ja-m24-6-2-self-explain", anchorLabel: "M24 production mastery", anchorAudioText: "テレビを みたり まんがを よんだりします", question: "If someone asks しゅみは なんですか, how can you answer using ALL three M24 patterns?", rule: { text: "Answer with しゅみは [hobby]です (naming it). Then add のがすきです (expressing preference) and まいしゅう [Nかい] します (frequency)." }, surface: { text: "Use たり to combine all three into one sentence." }, distractor: { text: "You can only use one pattern per answer — pick the best one." }, ruleExplanation: "Natural answer: しゅみは えです。えを かくのが すきです。まいしゅう にかい かきます。Three patterns, three sentences." }),
    speaking("ja-m24-6-2-speak-3", "しゅみは しゃしんです", "My hobby is photography."),
    // ── Review tail ──
    speaking("ja-m24-6-2-rev-speak-1", M24_6_2_REVIEW[0].kana, M24_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({ id: "ja-m24-6-2-rev-lc-1", audioText: M24_6_2_REVIEW[1].kana, correctMeaningEn: M24_6_2_REVIEW[1].meaningEn, distractorsEn: [M24_6_2_REVIEW[2].meaningEn, M24_6_2_REVIEW[3].meaningEn, M24_REVIEW_POOL[11].meaningEn] }),
    vocabMcq("ja-m24-6-2-rev-mcq-1", M24_6_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M24_REVIEW_POOL),
    reviewMatchPairs("ja-m24-6-2-rev", M24_6_2_REVIEW),
    infoStep("ja-m24-6-2-info-end", "You can describe your hobbies, how often, and in casual lists", "All M24 patterns in production — preferences, たり lists, and frequency counts.", "win"),
  ],
};

assertNoSameAnswerCluster(M24_6_2.steps);
assertAnswerRotation(M24_6_2.steps, 1);
assertNoConsecutiveSame(M24_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-STORY — Weekend hobbies conversation
// ═══════════════════════════════════════════════════════════════════════

export const M24_STORY: LessonContent = {
  id: "ja-m24-story",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Weekend hobbies",
  description:
    "Listen to friends discuss their weekend hobbies. Answer comprehension questions and practice key patterns.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep("ja-m24-story-info-open", "Story time — Weekend hobbies", "ゆき and たけし are talking about what they do on weekends. Listen for hobbies, preferences, and frequency."),
    dialogueListen({
      id: "ja-m24-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "しゅみは なんですか。" },
        { speaker: "たけし", kana: "えを かくのが すきです。まいしゅう にかい かきます。" },
        { speaker: "ゆき", kana: "いいですね。わたしは しゃしんを とるのが すきです。" },
        { speaker: "たけし", kana: "しゅうまつに なにを しますか。" },
      ],
      questions: [
        { id: "s1-q1", prompt: "What is Takeshi's hobby?", correctText: "Drawing pictures.", distractors: ["Taking photos.", "Fishing.", "Reading manga."], explanation: "えを かくのが すきです = I like drawing pictures." },
        { id: "s1-q2", prompt: "How often does Takeshi draw?", correctText: "Twice a week.", distractors: ["Once a day.", "Three times a week.", "Every day."], explanation: "まいしゅう にかい = twice a week." },
      ],
    }),
    build("ja-m24-story-build-1", "Say: I like drawing pictures.", "えを かくのが すきです", ["え", "を", "かくのが", "すき", "です", "きらい"], ["え", "を", "かくのが", "すき", "です"]),
    sentenceMcq({ id: "ja-m24-story-mcq-1", prompt: "What is Yuki's hobby?", correctKana: "Taking photos.", distractorsKana: ["Drawing.", "Fishing.", "Jogging."], explanation: "しゃしんを とるのが すきです = I like taking photos." }),
    dialogueListen({
      id: "ja-m24-story-scene-2",
      lines: [
        { speaker: "ゆき", kana: "しゅうまつに しゃしんを とったり ハイキングを したりします。" },
        { speaker: "たけし", kana: "いいですね! わたしも ときどき ハイキングを します。" },
        { speaker: "ゆき", kana: "アニメは みますか。" },
        { speaker: "たけし", kana: "あまり みません。でも、まんがは よく よみます。" },
      ],
      questions: [
        { id: "s2-q1", prompt: "What does Yuki do on weekends?", correctText: "Things like taking photos and hiking.", distractors: ["Only taking photos.", "Only hiking.", "Watching anime."], explanation: "しゃしんを とったり ハイキングを したりします = things like photos and hiking." },
        { id: "s2-q2", prompt: "Does Takeshi watch much anime?", correctText: "No, not much. But he reads manga often.", distractors: ["Yes, he watches a lot.", "He watches every day.", "He doesn't know what anime is."], explanation: "あまり みません = doesn't watch much. まんがは よく よみます = reads manga often." },
      ],
    }),
    cloze("ja-m24-story-cloze-1", "しゃしんを とったり ハイキングを したり", "。", "します", ["します", "する", "です", "ます"], "I do things like taking photos and hiking.", "しゃしんを とったり ハイキングを したりします。", "します closes the たり list."),
    listeningBuildSentence({ id: "ja-m24-story-lb-1", target: "えを かくのが すきです", tiles: ["え", "を", "かくのが", "すき", "です", "きらい", "しゃしん"], correctOrder: ["え", "を", "かくのが", "すき", "です"], promptEn: "Hear it, build it: 'I like drawing pictures.'" }),
    listeningCompSentence({ id: "ja-m24-story-lc-1", audioText: "あまり アニメを みません", correctMeaningEn: "I don't watch anime much.", distractorsEn: ["I watch anime often.", "I watch anime every day.", "I like anime."] }),
    speaking("ja-m24-story-speak-1", "しゃしんを とったり ハイキングを したりします", "I do things like taking photos and hiking."),
    sentenceMcq({ id: "ja-m24-story-mcq-summary", prompt: "What media does Takeshi consume?", correctKana: "He reads manga often but doesn't watch anime much.", distractorsKana: ["He watches anime every day.", "He reads magazines.", "He listens to the radio."], explanation: "まんがは よく よみます, but あまり アニメを みません." }),
    speaking("ja-m24-story-speak-2", "まんがは よく よみます", "I often read manga."),
    infoStep("ja-m24-story-info-end", "You can follow a natural hobby conversation", "You understood のがすき, たり〜たり, frequency words, and あまり in a real weekend chat.", "win"),
  ],
};

assertNoConsecutiveSame(M24_STORY.steps);
assertPassiveCardsHaveFollowup(M24_STORY.steps);
assertNoExplanationOnPassive(M24_STORY.steps);
assertExplanationDoesntLeakAnswer(M24_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-7-1 — Comprehension closer
// ═══════════════════════════════════════════════════════════════════════

const M24_7_1_REVIEW = pickReviewAtoms("ja-m24-7-1-rev", M24_REVIEW_POOL, 4);

export const M24_7_1: LessonContent = {
  id: "ja-m24-7-1",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Hobby closer I",
  description: "Dialogue closer — follow a hobby conversation and produce key sentences.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep("ja-m24-7-1-info-open", "Hobby conversation", "A longer conversation about hobbies. Listen, answer, and produce."),
    dialogueListen({
      id: "ja-m24-7-1-dialogue",
      lines: [
        { speaker: "ゆき", kana: "たけしさんの しゅみは なんですか。" },
        { speaker: "たけし", kana: "つりと キャンプが すきです。しゅうまつに よく つりを したり キャンプを したりします。" },
        { speaker: "ゆき", kana: "いいですね! まいしゅう なんかい いきますか。" },
        { speaker: "たけし", kana: "にかいぐらい いきます。ゆきさんは?" },
      ],
      questions: [
        { id: "d-q1", prompt: "What are Takeshi's hobbies?", correctText: "Fishing and camping.", distractors: ["Drawing and photos.", "Jogging and hiking.", "Anime and manga."], explanation: "つりと キャンプが すきです = likes fishing and camping." },
        { id: "d-q2", prompt: "How often does Takeshi go?", correctText: "About twice a week.", distractors: ["Once a day.", "Three times a week.", "Every day."], explanation: "にかいぐらい = about twice." },
      ],
    }),
    build("ja-m24-7-1-build-1", "Say: I often do things like fishing and camping on weekends.", "しゅうまつに よく つりを したり キャンプを したりします", ["しゅうまつ", "に", "よく", "つり", "を", "したり", "キャンプ", "を", "したり", "します"], ["しゅうまつ", "に", "よく", "つり", "を", "したり", "キャンプ", "を", "したり", "します"]),
    sentenceMcq({ id: "ja-m24-7-1-mcq-1", prompt: "How does ゆき ask about frequency?", correctKana: "まいしゅう なんかい いきますか。", distractorsKana: ["まいにち なにを しますか。", "しゅみは なんですか。", "どこに いきますか。"], explanation: "なんかい = how many times." }),
    listeningCompSentence({ id: "ja-m24-7-1-lc-1", audioText: "つりと キャンプが すきです", correctMeaningEn: "I like fishing and camping.", distractorsEn: ["I dislike fishing and camping.", "I go fishing and camping.", "I do fishing and camping."] }),
    cloze("ja-m24-7-1-cloze-1", "つりを し", " キャンプを したりします。", "たり", ["たり", "て", "ます", "の"], "I do things like fishing and camping.", "つりを したり キャンプを したりします。", "したり = た-form of する + り."),
    build("ja-m24-7-1-build-2", "Say: I go about twice a week.", "まいしゅう にかいぐらい いきます", ["まいしゅう", "にかいぐらい", "いきます", "さんかい", "いっかい"], ["まいしゅう", "にかいぐらい", "いきます"]),
    speaking("ja-m24-7-1-speak-1", "つりと キャンプが すきです", "I like fishing and camping."),
    listeningBuildSentence({ id: "ja-m24-7-1-lb-1", target: "まいしゅう にかい つりに いきます", tiles: ["まいしゅう", "にかい", "つり", "に", "いきます", "さんかい", "キャンプ"], correctOrder: ["まいしゅう", "にかい", "つり", "に", "いきます"], promptEn: "Hear it, build it: 'I go fishing twice a week.'" }),
    cloze("ja-m24-7-1-cloze-2", "えを かく", " すきです。", "のが", ["のが", "が", "は", "を"], "I like drawing.", "えを かくのが すきです。", "のが nominalizes the verb."),
    translateStep({ id: "ja-m24-7-1-translate", promptEn: "On weekends, I do things like fishing and camping.", acceptedAnswers: ["しゅうまつに つりを したり キャンプを したりします", "しゅうまつに つりを したり キャンプを したりします。"], audioText: "しゅうまつに つりを したり キャンプを したりします" }),
    selfExplain({ id: "ja-m24-7-1-self-explain", anchorLabel: "つりを したり キャンプを したりします", anchorAudioText: "つりを したり キャンプを したりします", question: "Does たり〜たり imply Takeshi ONLY does fishing and camping?", rule: { text: "No — たり〜たり is non-exhaustive. It means 'things like X and Y, among other activities.' He might do other things too." }, surface: { text: "Yes — たり lists everything exhaustively, like と." }, distractor: { text: "たり means he alternates between ONLY these two activities." }, ruleExplanation: "たり〜たり = 'things like... (among others).' Unlike と (exhaustive list), it leaves room for unmentioned activities." }),
    speaking("ja-m24-7-1-speak-2", "しゅうまつに つりを したり キャンプを したりします", "On weekends, I do things like fishing and camping."),
    // ── Review tail ──
    vocabMcq("ja-m24-7-1-rev-mcq-1", M24_7_1_REVIEW[0], M24_REVIEW_POOL),
    listeningCompSentence({ id: "ja-m24-7-1-rev-lc-1", audioText: M24_7_1_REVIEW[1].kana, correctMeaningEn: M24_7_1_REVIEW[1].meaningEn, distractorsEn: [M24_7_1_REVIEW[2].meaningEn, M24_7_1_REVIEW[3].meaningEn, M24_REVIEW_POOL[12].meaningEn] }),
    speaking("ja-m24-7-1-rev-speak-1", M24_7_1_REVIEW[2].kana, M24_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m24-7-1-rev", M24_7_1_REVIEW),
    infoStep("ja-m24-7-1-info-end", "You can now have a full hobby conversation in Japanese", "Hobbies, preferences, frequency, casual listing — all in natural dialogue.", "win"),
  ],
};

assertNoSameAnswerCluster(M24_7_1.steps);
assertAnswerRotation(M24_7_1.steps, 1);
assertNoConsecutiveSame(M24_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M24-7-2 — Final mixed drill
// ═══════════════════════════════════════════════════════════════════════

const M24_7_2_REVIEW = pickReviewAtoms("ja-m24-7-2-rev", M24_REVIEW_POOL, 5);

export const M24_7_2: LessonContent = {
  id: "ja-m24-7-2",
  moduleId: "m24",
  courseId: COURSE,
  languageId: LANG,
  title: "Hobby closer II",
  description: "Final mixed drill — all M24 grammar + vocab in full production.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep("ja-m24-7-2-info-open", "Final M24 drill", "Everything from M24 mixed together. Prove you own every pattern."),
    build("ja-m24-7-2-build-1", "Answer: My hobby is hiking.", "しゅみは ハイキングです", ["しゅみ", "は", "ハイキング", "です", "つり", "が"], ["しゅみ", "は", "ハイキング", "です"]),
    cloze("ja-m24-7-2-cloze-1", "アニメを みたり まんがを よんだり", "。", "します", ["します", "する", "です", "ます"], "I do things like watching anime and reading manga.", "アニメを みたり まんがを よんだりします。", "します closes the たり list."),
    speaking("ja-m24-7-2-speak-1", "まいしゅう さんかい ジョギングします", "I jog three times a week."),
    sentenceMcq({ id: "ja-m24-7-2-mcq-1", prompt: "Which means 'I like taking photos.'?", correctKana: "しゃしんを とるのが すきです。", distractorsKana: ["しゃしんを とるのが きらいです。", "しゃしんを とります。", "しゃしんが ほしいです。"], explanation: "とるのがすき = like taking." }),
    build("ja-m24-7-2-build-2", "Say: I don't read magazines much.", "あまり ざっしを よみません", ["あまり", "ざっし", "を", "よみません", "よみます", "よく"], ["あまり", "ざっし", "を", "よみません"]),
    listeningBuildSentence({ id: "ja-m24-7-2-lb-1", target: "ときどき えを かいたりします", tiles: ["ときどき", "え", "を", "かいたり", "します", "かきます", "よく"], correctOrder: ["ときどき", "え", "を", "かいたり", "します"], promptEn: "Hear it, build it: 'I sometimes do things like drawing.'" }),
    listeningCompSentence({ id: "ja-m24-7-2-lc-1", audioText: "まいにち いっかい さんぽします", correctMeaningEn: "I take a walk once every day.", distractorsEn: ["I take a walk every week.", "I take three walks a day.", "I sometimes walk."] }),
    build("ja-m24-7-2-build-3", "Say: I like making things.", "ものを つくるのが すきです", ["もの", "を", "つくるのが", "すき", "です", "きらい"], ["もの", "を", "つくるのが", "すき", "です"]),
    cloze("ja-m24-7-2-cloze-2", "しゃしんを とる", " すきです。", "のが", ["のが", "が", "は", "を"], "I like taking photos.", "しゃしんを とるのが すきです。", "のが nominalizes the verb."),
    speaking("ja-m24-7-2-speak-2", "しゅうまつに キャンプを したり つりを したりします", "On weekends, I do things like camping and fishing."),
    sentenceMcq({ id: "ja-m24-7-2-mcq-2", prompt: "Which correctly uses the かい counter?", correctKana: "にほんに さんかい いきました。", distractorsKana: ["にほんに みっつ いきました。", "にほんに さんにん いきました。", "にほんに さんぼん いきました。"], explanation: "さんかい = three times. かい counts occurrences." }),
    build("ja-m24-7-2-build-4", "Say: I often listen to the radio.", "よく ラジオを ききます", ["よく", "ラジオ", "を", "ききます", "ききません", "あまり"], ["よく", "ラジオ", "を", "ききます"]),
    translateStep({ id: "ja-m24-7-2-translate", promptEn: "I do things like watching anime and collecting manga.", acceptedAnswers: ["アニメを みたり まんがを あつめたりします", "アニメを みたり まんがを あつめたりします。"], audioText: "アニメを みたり まんがを あつめたりします" }),
    selfExplain({ id: "ja-m24-7-2-self-explain", anchorLabel: "All M24 patterns mastered", anchorAudioText: "しゅうまつに つりを したりします", question: "Name the three patterns you learned in M24.", rule: { text: "1) のがすき (like doing — review). 2) たり〜たりする (non-exhaustive listing). 3) かい counter (counting times)." }, surface: { text: "つり, キャンプ, and ジョギング — three hobby nouns." }, distractor: { text: "すき, きらい, and あまり — three frequency words." }, ruleExplanation: "M24 grammar: のがすき (preference), たり〜たり (casual listing), かい (times counter)." }),
    speaking("ja-m24-7-2-speak-3", "しゅみは つりです。まいしゅう にかい いきます", "My hobby is fishing. I go twice a week."),
    // ── Review tail ──
    vocabMcq("ja-m24-7-2-rev-mcq-1", M24_7_2_REVIEW[0], M24_REVIEW_POOL),
    listeningCompSentence({ id: "ja-m24-7-2-rev-lc-1", audioText: M24_7_2_REVIEW[1].kana, correctMeaningEn: M24_7_2_REVIEW[1].meaningEn, distractorsEn: [M24_7_2_REVIEW[2].meaningEn, M24_7_2_REVIEW[3].meaningEn, M24_REVIEW_POOL[13].meaningEn] }),
    speaking("ja-m24-7-2-rev-speak-1", M24_7_2_REVIEW[2].kana, M24_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m24-7-2-rev", M24_7_2_REVIEW.slice(0, 4)),
    infoStep("ja-m24-7-2-info-end", "You can now talk about hobbies like a natural Japanese speaker", "All M24 grammar mastered: のがすき, たり〜たりする, and かい counter — in full production.", "win"),
  ],
};

assertNoSameAnswerCluster(M24_7_2.steps);
assertAnswerRotation(M24_7_2.steps, 1);
assertNoConsecutiveSame(M24_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

const ALL_M24 = [
  M24_1_1, M24_1_2, M24_2_1, M24_2_2, M24_3_1, M24_3_2,
  M24_4_1, M24_4_2, M24_5_1, M24_5_2, M24_6_1, M24_6_2,
  M24_STORY, M24_7_1, M24_7_2,
];

assertNoSameAnswerCluster(ALL_M24.flatMap((l) => l.steps));

// Passive-card lint
for (const lesson of ALL_M24) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
