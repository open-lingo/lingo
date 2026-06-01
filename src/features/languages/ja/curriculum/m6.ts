/**
 * M6 — Where things are (sub-lesson split 2026-05-24).
 *
 * Spine: に (destination/existence) / で (action setting/means) / が (existence).
 *
 * Each original lesson is split into 2 sub-lessons of ~18 steps each.
 * All `vocab()` / `phrase()` calls that introduce new words are replaced
 * with `build()` calls where the learner assembles the word/sentence from
 * tiles. Each build is FIGUROUTABLE — either a single-tile pick where the
 * English prompt makes it obvious, or a sentence where only one tile is
 * unknown.
 *
 * Module context (learner already knows): です, か, は, の, これ/それ/あれ/どれ,
 * numbers 1-10, ください, common nouns from M1-M5.
 *
 * ID scheme: ja-m6-1-1, ja-m6-1-2, ja-m6-2-1, ja-m6-2-2, etc.
 * Export names: M6_1_1, M6_1_2, M6_2_1, M6_2_2, etc.
 *
 * Lesson list (16 sub-lessons):
 *   M6-1-1  Places — first 4 location atoms (build intro)
 *   M6-1-2  Places — last 4 location atoms + cumulative retrieval
 *   M6-2-1  に — destination (rule + first drills)
 *   M6-2-2  に — existence + production
 *   M6-3-1  で — action setting (rule + first drills)
 *   M6-3-2  で — means + production
 *   M6-4-1  が — existence intro (rule + inanimate)
 *   M6-4-2  が — animacy split + production
 *   M6-5-1  Interleaved に + で (first rotation block)
 *   M6-5-2  Interleaved に + で (は/が peek + production)
 *   M6-6-1  Interleaved existence + locations (first 3-particle block)
 *   M6-6-2  Interleaved existence + locations (compound sentences)
 *   M6-7-1  Production — build + listening_build
 *   M6-7-2  Production — speaking + cumulative patterns
 *   M6-8-1  Mini-dialogue — warm-up + dialogue
 *   M6-8-2  Mini-dialogue — post-dialogue drills + review
 */
import type {
  LessonContent,
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
  pickReviewAtoms,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  vocabMcq,
  assertNoSameAnswerCluster,
  assertNoConsecutiveSame,
  WORD_IMAGE_MCQ_BLOCKLIST,
} from "@/features/languages/ja/grammarHelpers";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  assertPassiveCardsHaveFollowup,
} from "@/features/lesson/data/_stepAssertions";

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// Per-sub-lesson review-atom draws. Seeded by lesson id so each gets a
// stable but distinct subset across re-runs. Pool is M1+M2+M3+M4+M5.
// (Not M6 — M6 is the module being authored; can't review itself.)
// ───────────────────────────────────────────────────────────────────────
const PRIOR_POOL = M3_M7_REVIEW_POOL.filter(
  (a) =>
    (a.fromModule === "m1" ||
      a.fromModule === "m2" ||
      a.fromModule === "m3" ||
      a.fromModule === "m4" ||
      a.fromModule === "m5") &&
    !WORD_IMAGE_MCQ_BLOCKLIST.has(a.kana),
);
// Subset draws for visual MCQ distractor pools (use M1 / M4 — both have
// many emoji-bearing concrete-noun atoms). M2 / M3 / M5 contribute through
// the main PRIOR_POOL draws for review-tail MCQ / match / listening.
const POOL_M1 = PRIOR_POOL.filter((a) => a.fromModule === "m1");
const POOL_M4 = PRIOR_POOL.filter((a) => a.fromModule === "m4");

// ═══════════════════════════════════════════════════════════════════════════
// M6-1-1 — Places vocab (first 4 locations)
// ═══════════════════════════════════════════════════════════════════════════

const M6_1_1_REVIEW = pickReviewAtoms("ja-m6-1-1-rev", PRIOR_POOL, 6);

export const M6_1_1: LessonContent = {
  id: "ja-m6-1-1",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Places (part 1)",
  description:
    "Four locations every Japanese map cares about. Build each word from tiles, then retrieve.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m6-1-1-info-open",
      "Map vocab",
      "Eight locations across two lessons. Every Japanese address starts with 'X minutes from Y えき' — names of places are the spine of getting around.",
    ),
    // ── Atom 1: こうえん (park) — single-tile build, English makes it obvious
    build(
      "ja-m6-1-1-build-koen",
      "Park",
      "こうえん",
      ["こうえん", "がっこう", "うち", "えき"],
      ["こうえん"],
    ),
    // immediate retrieval on the new atom
    vocabMcq(
      "ja-m6-1-1-mcq-koen",
      { kana: "こうえん", meaningEn: "park", emoji: "🌲", fromModule: "m6" },
      POOL_M1,
    ),
    // ── Atom 2: がっこう (school) — single-tile build
    build(
      "ja-m6-1-1-build-gakkou",
      "School",
      "がっこう",
      ["がっこう", "こうえん", "えき", "うち"],
      ["がっこう"],
    ),
    // listening retrieval
    listeningCompSentence({
      id: "ja-m6-1-1-lc-gakkou",
      audioText: "がっこう",
      correctMeaningEn: "school",
      distractorsEn: ["park", "home", "station"],
    }),
    // ── Atom 3: うち (home) — single-tile build
    build(
      "ja-m6-1-1-build-uchi",
      "Home / my place",
      "うち",
      ["うち", "がっこう", "こうえん", "みせ"],
      ["うち"],
    ),
    // visual MCQ on うち
    vocabMcq(
      "ja-m6-1-1-mcq-uchi",
      { kana: "うち", meaningEn: "home", emoji: "🏡", fromModule: "m6" },
      POOL_M4,
    ),
    // ── Atom 4: えき (train station) — single-tile build
    build(
      "ja-m6-1-1-build-eki",
      "Train station",
      "えき",
      ["えき", "うち", "がっこう", "こうえん"],
      ["えき"],
    ),
    // listening retrieval on えき
    listeningCompSentence({
      id: "ja-m6-1-1-lc-eki",
      audioText: "えき",
      correctMeaningEn: "train station",
      distractorsEn: ["school", "park", "home"],
    }),
    // prior-module review break — bumps ratio
    vocabMcq("ja-m6-1-1-rev-mcq-mid", M6_1_1_REVIEW[0], PRIOR_POOL),
    // speaking — production on a just-learned atom
    speaking("ja-m6-1-1-speak-eki", "えき", "Train station"),
    // sentence MCQ — early pattern: assemble a known sentence with new vocab
    sentenceMcq({
      id: "ja-m6-1-1-mcq-which-park",
      prompt: "Which word means 'park'?",
      correctKana: "こうえん",
      distractorsKana: ["がっこう", "えき", "うち"],
    }),
    // speaking — production on another atom
    speaking("ja-m6-1-1-speak-gakkou", "がっこう", "School"),
    // listening on こうえん
    listeningCompSentence({
      id: "ja-m6-1-1-lc-koen",
      audioText: "こうえん",
      correctMeaningEn: "park",
      distractorsEn: ["home", "train station", "school"],
    }),
    // ── Review tail ──
    speaking("ja-m6-1-1-rev-speak-1", M6_1_1_REVIEW[1].kana, M6_1_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m6-1-1-rev-lc",
      audioText: M6_1_1_REVIEW[2].kana,
      correctMeaningEn: M6_1_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_1_1_REVIEW[3].meaningEn,
        M6_1_1_REVIEW[4].meaningEn,
        M6_1_1_REVIEW[5].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-1-1-rev", M6_1_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-1-1-info-end",
      "You can now name four places around town",
      "Park, school, home, station. Next: four more places to complete your map vocabulary.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_1_1.steps);
assertNoConsecutiveSame(M6_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-1-2 — Places vocab (last 4 locations + cumulative retrieval)
// ═══════════════════════════════════════════════════════════════════════════

const M6_1_2_REVIEW = pickReviewAtoms("ja-m6-1-2-rev", PRIOR_POOL, 6);

export const M6_1_2: LessonContent = {
  id: "ja-m6-1-2",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Places (part 2)",
  description:
    "Four more locations + cumulative retrieval across all eight.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m6-1-2-info-open",
      "Four more places",
      "Toilet, convenience store, room, shop. After this you can name every location on a Japanese city block.",
    ),
    // ── Atom 5: トイレ (toilet) — single-tile build
    build(
      "ja-m6-1-2-build-toire",
      "Toilet",
      "トイレ",
      ["トイレ", "コンビニ", "へや", "みせ"],
      ["トイレ"],
    ),
    // listening retrieval
    listeningCompSentence({
      id: "ja-m6-1-2-lc-toire",
      audioText: "トイレ",
      correctMeaningEn: "toilet",
      distractorsEn: ["convenience store", "park", "shop"],
    }),
    // ── Atom 6: コンビニ (convenience store) — single-tile build
    build(
      "ja-m6-1-2-build-konbini",
      "Convenience store",
      "コンビニ",
      ["コンビニ", "トイレ", "へや", "みせ"],
      ["コンビニ"],
    ),
    // speaking break
    speaking("ja-m6-1-2-speak-konbini", "コンビニ", "Convenience store"),
    // ── Atom 7: へや (room) — single-tile build
    build(
      "ja-m6-1-2-build-heya",
      "Room",
      "へや",
      ["へや", "コンビニ", "トイレ", "みせ"],
      ["へや"],
    ),
    // visual MCQ on へや
    vocabMcq(
      "ja-m6-1-2-mcq-heya",
      { kana: "へや", meaningEn: "room", emoji: "🛋️", fromModule: "m6" },
      POOL_M4,
    ),
    // ── Atom 8: みせ (shop) — single-tile build
    build(
      "ja-m6-1-2-build-mise",
      "Shop",
      "みせ",
      ["みせ", "へや", "コンビニ", "トイレ"],
      ["みせ"],
    ),
    // visual MCQ on みせ
    vocabMcq(
      "ja-m6-1-2-mcq-mise",
      { kana: "みせ", meaningEn: "shop", emoji: "🏬", fromModule: "m6" },
      POOL_M4,
    ),
    // prior-module review break
    vocabMcq("ja-m6-1-2-rev-mcq-mid", M6_1_2_REVIEW[0], PRIOR_POOL),
    // cumulative retrieval — mix old and new atoms
    listeningCompSentence({
      id: "ja-m6-1-2-lc-heya",
      audioText: "へや",
      correctMeaningEn: "room",
      distractorsEn: ["shop", "toilet", "park"],
    }),
    // speaking on an earlier atom (cumulative)
    speaking("ja-m6-1-2-speak-eki", "えき", "Train station"),
    // sentence MCQ — cumulative across all 8
    sentenceMcq({
      id: "ja-m6-1-2-mcq-which-konbini",
      prompt: "Which word means 'convenience store'?",
      correctKana: "コンビニ",
      distractorsKana: ["トイレ", "みせ", "えき"],
    }),
    // ── ここ / そこ / あそこ — location pointers ──
    grammarRule({
      id: "ja-m6-1-2-rule-koko",
      title: "ここ / そこ / あそこ — here / there / over there",
      rule: "Just like これ/それ/あれ for things, ここ/そこ/あそこ mark places. ここ = near you, そこ = near the listener, あそこ = far from both. You already know どこ (where) from Module 5.",
      examples: [
        { ja: "ここは こうえんです", romaji: "koko wa kouen desu", en: "Here is a park" },
        { ja: "そこに トイレが あります", romaji: "soko ni toire ga arimasu", en: "There is a toilet there" },
        { ja: "あそこに えきが あります", romaji: "asoko ni eki ga arimasu", en: "There is a station over there" },
      ],
      antiPattern: {
        ja: "これは こうえんです",
        romaji: "kore wa kouen desu",
        en: "(Using これ for a place instead of ここ)",
        why: "これ points at a THING; ここ points at a PLACE. 'Here is a park' needs ここ, not これ.",
      },
    }),
    cloze(
      "ja-m6-1-2-cloze-koko",
      "",
      "は こうえんです。",
      "ここ",
      ["ここ", "そこ", "あそこ", "どこ"],
      "Here is a park.",
      "ここは こうえんです。",
      "ここ = here (near the speaker), like これ but for places.",
    ),
    cloze(
      "ja-m6-1-2-cloze-asoko",
      "",
      "に えきが あります。",
      "あそこ",
      ["ここ", "そこ", "あそこ", "どこ"],
      "There is a station over there.",
      "あそこに えきが あります。",
      "あそこ = over there (far from both), like あれ but for places.",
    ),
    // ── Review tail ──
    speaking("ja-m6-1-2-rev-speak-1", M6_1_2_REVIEW[1].kana, M6_1_2_REVIEW[1].meaningEn),
    reviewMatchPairs("ja-m6-1-2-rev", M6_1_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-1-2-info-end",
      "You can now name every place on a Japanese map",
      "Eight places, retrieval-checked. Next: three particles that put things AT, BY, and IN them.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_1_2.steps);
assertNoConsecutiveSame(M6_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-2-1 — に (destination — rule + first drills)
// ═══════════════════════════════════════════════════════════════════════════

const RULE_NI = grammarRule({
  id: "ja-m6-2-1-rule-ni",
  title: "に — destination point + existence",
  rule:
    "に marks a POINT — either a destination you're moving TOWARD (がっこうに いく = go TO school) or a point of existence (えきに います = I AM AT the station). Verbs of motion (いく/くる/かえる) and existence verbs (います/あります) both take に.",
  examples: [
    {
      ja: "がっこうに いきます。",
      romaji: "gakkou ni ikimasu.",
      en: "I go to school. (destination)",
    },
    {
      ja: "えきに います。",
      romaji: "eki ni imasu.",
      en: "I'm at the station. (existence)",
    },
  ],
  antiPattern: {
    ja: "がっこうで いきます。",
    romaji: "gakkou de ikimasu.",
    en: "(broken — 'I go school-as-setting')",
    why: "Going TO a place is movement toward a destination point — に, never で. で is for the place an action happens (next lesson).",
  },
  cultureNote:
    "に is the 'pinpoint' particle. Whenever the question is 'WHERE TO?' or 'WHERE EXACTLY?', に is your particle.",
});

const M6_2_1_REVIEW = pickReviewAtoms("ja-m6-2-1-rev", PRIOR_POOL, 6);

export const M6_2_1: LessonContent = {
  id: "ja-m6-2-1",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "に — destination (part 1)",
  description:
    "The pinpoint particle. Direction toward a place.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m6-2-1-info-open",
      "The pinpoint particle",
      "に marks a single point — where you're going or where you are. It pairs with movement verbs (いく/くる/かえる) and existence verbs (います/あります).",
    ),
    RULE_NI,
    // ── New verb: いきます (go) — build intro. Figuroutable: prompt says "I go to school" and only いきます is unknown ──
    build(
      "ja-m6-2-1-build-ikimasu",
      "I go to school.",
      "がっこうに いきます",
      ["がっこう", "に", "いきます", "います"],
      ["がっこう", "に", "いきます"],
    ),
    // First cloze — に dominates
    cloze(
      "ja-m6-2-1-cloze-1",
      "がっこう",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to school.",
      "がっこうに いきます。",
      "Movement verb (いく) + destination point. に.",
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-2-1-mcq-discriminate",
      prompt: "Which sentence means 'I'm at the park.'?",
      correctKana: "こうえんに います。",
      distractorsKana: [
        "こうえんで います。",
        "こうえんに いきます。",
        "こうえんは います。",
      ],
      explanation:
        "Existence (います) takes に, never で. With いきます the meaning shifts to 'I go to the park.'",
    }),
    cloze(
      "ja-m6-2-1-cloze-2",
      "えき",
      " います。",
      "に",
      ["に", "で", "を", "は"],
      "I'm at the station.",
      "えきに います。",
      "Existence verb (いる/います) + location point. に.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-2-1-lc-koen",
      audioText: "こうえんに います",
      correctMeaningEn: "I'm at the park.",
      distractorsEn: [
        "I go to the park.",
        "There's a park.",
        "The park is here.",
      ],
    }),
    // New verb: かえります (return) — build intro. Only かえります is unknown.
    build(
      "ja-m6-2-1-build-kaerimasu",
      "I'm going home.",
      "うちに かえります",
      ["うち", "に", "かえります", "いきます"],
      ["うち", "に", "かえります"],
    ),
    cloze(
      "ja-m6-2-1-cloze-3",
      "うち",
      " かえります。",
      "に",
      ["に", "で", "を", "が"],
      "I'm going home.",
      "うちに かえります。",
      "Movement verb (かえる/return) + destination. に.",
    ),
    // vocabMcq break — prior-module
    vocabMcq("ja-m6-2-1-rev-mcq-mid", M6_2_1_REVIEW[0], PRIOR_POOL),
    // listening break
    listeningCompSentence({
      id: "ja-m6-2-1-lc-konbini",
      audioText: "コンビニに いきます",
      correctMeaningEn: "I go to the convenience store.",
      distractorsEn: [
        "I'm at the convenience store.",
        "There's a convenience store.",
        "I work at the convenience store.",
      ],
    }),
    cloze(
      "ja-m6-2-1-cloze-4",
      "コンビニ",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to the convenience store.",
      "コンビニに いきます。",
      "Destination + motion verb. に.",
    ),
    // speaking — production on a learned pattern
    speaking(
      "ja-m6-2-1-speak-gakkou",
      "がっこうに いきます",
      "I go to school.",
    ),
    // ── Review tail ──
    speaking("ja-m6-2-1-rev-speak-1", M6_2_1_REVIEW[1].kana, M6_2_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m6-2-1-rev-lc",
      audioText: M6_2_1_REVIEW[2].kana,
      correctMeaningEn: M6_2_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_2_1_REVIEW[3].meaningEn,
        M6_2_1_REVIEW[4].meaningEn,
        M6_2_1_REVIEW[5].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-2-1-rev", M6_2_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-2-1-info-end",
      "You can now say where you're going",
      "Location + に + motion verb. Next: に for existence + production practice.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_2_1.steps);
assertNoConsecutiveSame(M6_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-2-2 — に (existence + production)
// ═══════════════════════════════════════════════════════════════════════════

const M6_2_2_REVIEW = pickReviewAtoms("ja-m6-2-2-rev", PRIOR_POOL, 6);

export const M6_2_2: LessonContent = {
  id: "ja-m6-2-2",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "に — existence + production (part 2)",
  description:
    "に with existence verbs + cumulative production across destinations and locations.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m6-2-2-info-open",
      "に for existence",
      "に marks where you ARE (existence) just like where you're GOING (destination). Both verbs of motion and existence verbs take に.",
    ),
    // pivot cloze — answer is で (foreshadow, single rotation)
    cloze(
      "ja-m6-2-2-cloze-de-foil",
      "バス",
      " いきます。",
      "で",
      ["に", "で", "を", "は"],
      "I go by bus.",
      "バスで いきます。",
      "Foreshadow — bus is the MEANS (で), not a destination.",
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-2-2-mcq-uchi",
      prompt: "Which sentence means 'I'm at home.'?",
      correctKana: "うちに います。",
      distractorsKana: [
        "うちで います。",
        "うちは います。",
        "うちに いきます。",
      ],
      explanation:
        "Pure existence (います) → location point → に.",
    }),
    cloze(
      "ja-m6-2-2-cloze-1",
      "こうえん",
      " います。",
      "に",
      ["に", "で", "を", "は"],
      "I'm at the park.",
      "こうえんに います。",
      "Existence verb (います) + location → に.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-2-2-lc-eki",
      audioText: "えきに います",
      correctMeaningEn: "I'm at the station.",
      distractorsEn: [
        "I go to the station.",
        "There's a station.",
        "The station is here.",
      ],
    }),
    cloze(
      "ja-m6-2-2-cloze-2",
      "えき",
      " います。",
      "に",
      ["に", "で", "が", "は"],
      "I'm at the station.",
      "えきに います。",
      "Existence at a location → に.",
    ),
    // selfExplain — after multiple に commits
    selfExplain({
      id: "ja-m6-2-2-self-ni",
      anchorLabel: "You picked に in: えき＿ います (I'm at the station)",
      anchorAudioText: "えきに います",
      question: "Why is に correct in 'えきに います'?",
      rule: {
        text: "に marks WHERE something exists — the existence verb います always takes に, not で.",
      },
      surface: {
        text: "に always comes right after a place noun in any sentence.",
      },
      distractor: {
        text: "に marks the time at which something happens, like 'at 3pm.'",
      },
      ruleExplanation:
        "Existence (いる/ある → います/あります) takes に — the location is treated as a single point where the thing IS.",
    }),
    // production — tile-bank build
    build(
      "ja-m6-2-2-translate-eki",
      "I'm at the station.",
      "えきに います",
      ["えき", "に", "います", "で"],
      ["えき", "に", "います"],
    ),
    // speaking
    speaking(
      "ja-m6-2-2-speak-eki",
      "えきに います",
      "I'm at the station.",
    ),
    // listening_build
    listeningBuildSentence({
      id: "ja-m6-2-2-lb-koen",
      target: "こうえんに いきます",
      tiles: ["こうえん", "に", "いきます", "うち", "で", "えき", "います"],
      correctOrder: ["こうえん", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to the park.'",
    }),
    // sentenceMcq — cumulative pattern
    sentenceMcq({
      id: "ja-m6-2-2-mcq-cumulative",
      prompt: "Which sentence means 'I'm going home.'?",
      correctKana: "うちに かえります。",
      distractorsKana: [
        "うちで かえります。",
        "うちに います。",
        "うちが かえります。",
      ],
      explanation:
        "Movement verb (かえる) + destination → に. うちに います means 'I'm at home' (different meaning).",
    }),
    // production — compound
    build(
      "ja-m6-2-2-translate-uchi",
      "I'm going home.",
      "うちに かえります",
      ["うち", "に", "かえります", "で", "いきます"],
      ["うち", "に", "かえります"],
    ),
    // speaking
    speaking(
      "ja-m6-2-2-speak-uchi",
      "うちに かえります",
      "I'm going home.",
    ),
    // ── Review tail ──
    speaking("ja-m6-2-2-rev-speak-1", M6_2_2_REVIEW[0].kana, M6_2_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m6-2-2-rev-lc",
      audioText: M6_2_2_REVIEW[1].kana,
      correctMeaningEn: M6_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_2_2_REVIEW[2].meaningEn,
        M6_2_2_REVIEW[3].meaningEn,
        M6_2_2_REVIEW[4].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-2-2-rev", M6_2_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-2-2-info-end",
      "You can now say where you are and where you're going",
      "Location + に + (motion or existence verb). Next: で, the setting particle — the place an ACTION happens.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_2_2.steps);
assertNoConsecutiveSame(M6_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-3-1 — で (action setting — rule + first drills)
// ═══════════════════════════════════════════════════════════════════════════

const RULE_DE = grammarRule({
  id: "ja-m6-3-1-rule-de",
  title: "で — action setting + means",
  rule:
    "で marks the SETTING of an action — the place an action happens (がっこうで べんきょう = study AT school), or the MEANS you use to do it (でんしゃで いく = go BY train). The English 'at' collapses both with に; Japanese keeps them separate.",
  examples: [
    {
      ja: "がっこうで べんきょうします。",
      romaji: "gakkou de benkyou shimasu.",
      en: "I study at school. (where the action happens)",
    },
    {
      ja: "でんしゃで いきます。",
      romaji: "densha de ikimasu.",
      en: "I go by train. (means of motion)",
    },
  ],
  antiPattern: {
    ja: "えきで います。",
    romaji: "eki de imasu.",
    en: "(broken — 'I exist at-station-as-setting')",
    why: "Existence (いる/ある) takes に, not で. で is for ACTIONS happening at a setting. Just being somewhere isn't an action.",
  },
  cultureNote:
    "Filter: am I pointing at the destination/location (に), or describing the place an action happens / the means I'm using (で)? Most learners over-use に because it shows up first in beginner lessons.",
});

const M6_3_1_REVIEW = pickReviewAtoms("ja-m6-3-1-rev", PRIOR_POOL, 6);

export const M6_3_1: LessonContent = {
  id: "ja-m6-3-1",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "で — action setting (part 1)",
  description:
    "The 'where it happens' particle. で marks the place an action takes place.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m6-3-1-info-open",
      "Setting + means",
      "に was the point. で is the stage. Whenever an ACTION happens somewhere, the place takes で. The means (transport, tools) also takes で.",
    ),
    RULE_DE,
    // New verb: べんきょうします (study) — build intro. Only べんきょうします unknown.
    build(
      "ja-m6-3-1-build-benkyou",
      "I study at home.",
      "うちで べんきょうします",
      ["うち", "で", "べんきょうします", "に", "います"],
      ["うち", "で", "べんきょうします"],
    ),
    cloze(
      "ja-m6-3-1-cloze-1",
      "うち",
      " べんきょうします。",
      "で",
      ["に", "で", "を", "の"],
      "I study at home.",
      "うちで べんきょうします。",
      "The action (studying) HAPPENS at home — で marks the setting.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-3-1-lc-densha",
      audioText: "でんしゃで いきます",
      correctMeaningEn: "I go by train.",
      distractorsEn: [
        "I'm on the train.",
        "There's a train.",
        "The train station is here.",
      ],
    }),
    // New verb: はたらきます (work) — build intro. Only はたらきます unknown.
    build(
      "ja-m6-3-1-build-hataraki",
      "I work at a convenience store.",
      "コンビニで はたらきます",
      ["コンビニ", "で", "はたらきます", "べんきょうします"],
      ["コンビニ", "で", "はたらきます"],
    ),
    cloze(
      "ja-m6-3-1-cloze-2",
      "コンビニ",
      " はたらきます。",
      "で",
      ["に", "で", "を", "の"],
      "I work at a convenience store.",
      "コンビニで はたらきます。",
      "Working is an action happening at a setting — で.",
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-3-1-mcq-de-vs-ni",
      prompt: "Which sentence means 'I study at the library.'?",
      correctKana: "としょかんで べんきょうします。",
      distractorsKana: [
        "としょかんに べんきょうします。",
        "としょかんで います。",
        "としょかんに います。",
      ],
      explanation:
        "Studying is an ACTION → で. The other options either swap で↔に or replace the verb with 'exist.'",
    }),
    // contrast cloze — に (rotation)
    cloze(
      "ja-m6-3-1-cloze-3-contrast",
      "がっこう",
      " います。",
      "に",
      ["に", "で", "を", "は"],
      "I'm at school. (pure existence)",
      "がっこうに います。",
      "Pure existence — に, not で. Even at school, 'just being there' takes に.",
    ),
    // vocabMcq break — prior-module
    vocabMcq("ja-m6-3-1-rev-mcq-mid", M6_3_1_REVIEW[0], PRIOR_POOL),
    // listening break
    listeningCompSentence({
      id: "ja-m6-3-1-lc-konbini",
      audioText: "コンビニで はたらきます",
      correctMeaningEn: "I work at a convenience store.",
      distractorsEn: [
        "I go to the convenience store.",
        "I'm at the convenience store.",
        "There's a convenience store.",
      ],
    }),
    cloze(
      "ja-m6-3-1-cloze-4",
      "がっこう",
      " べんきょうします。",
      "で",
      ["に", "で", "を", "の"],
      "I study at school.",
      "がっこうで べんきょうします。",
      "Study is an action → setting → で.",
    ),
    // speaking
    speaking(
      "ja-m6-3-1-speak-uchi",
      "うちで べんきょうします",
      "I study at home.",
    ),
    // ── Review tail ──
    speaking("ja-m6-3-1-rev-speak-1", M6_3_1_REVIEW[1].kana, M6_3_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m6-3-1-rev-lc",
      audioText: M6_3_1_REVIEW[2].kana,
      correctMeaningEn: M6_3_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_3_1_REVIEW[3].meaningEn,
        M6_3_1_REVIEW[4].meaningEn,
        M6_3_1_REVIEW[5].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-3-1-rev", M6_3_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-3-1-info-end",
      "You can now say where actions happen",
      "Place + で + action verb. Next: で for means (how you get there) + production.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_3_1.steps);
assertNoConsecutiveSame(M6_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-3-2 — で (means + production)
// ═══════════════════════════════════════════════════════════════════════════

const M6_3_2_REVIEW = pickReviewAtoms("ja-m6-3-2-rev", PRIOR_POOL, 6);

export const M6_3_2: LessonContent = {
  id: "ja-m6-3-2",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "で — means + production (part 2)",
  description:
    "で also marks means of transport/tools. Cumulative production across settings and means.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m6-3-2-info-open",
      "Means of motion",
      "で marks HOW you do something, not just WHERE. 'でんしゃで' = by train. 'じてんしゃで' = by bicycle. Same particle, different role.",
    ),
    // New noun: でんしゃ (train) — build intro. Single-tile, English makes it obvious.
    build(
      "ja-m6-3-2-build-densha",
      "I go by train.",
      "でんしゃで いきます",
      ["でんしゃ", "で", "いきます", "バス", "に"],
      ["でんしゃ", "で", "いきます"],
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-3-2-lc-jitensha",
      audioText: "じてんしゃで いきます",
      correctMeaningEn: "I go by bicycle.",
      distractorsEn: [
        "I'm on a bicycle.",
        "There's a bicycle.",
        "I bought a bicycle.",
      ],
    }),
    // New noun: じてんしゃ (bicycle) — build intro. Only じてんしゃ unknown.
    build(
      "ja-m6-3-2-build-jitensha",
      "I go by bicycle.",
      "じてんしゃで いきます",
      ["じてんしゃ", "で", "いきます", "でんしゃ", "に"],
      ["じてんしゃ", "で", "いきます"],
    ),
    cloze(
      "ja-m6-3-2-cloze-1",
      "じてんしゃ",
      " いきます。",
      "で",
      ["に", "で", "を", "の"],
      "I go by bicycle.",
      "じてんしゃで いきます。",
      "で marks the MEANS — how you do something.",
    ),
    // New verb: ねます (sleep) — build intro. Only ねます unknown.
    build(
      "ja-m6-3-2-build-nemasu",
      "I sleep in (my) room.",
      "へやで ねます",
      ["へや", "で", "ねます", "べんきょうします", "に"],
      ["へや", "で", "ねます"],
    ),
    cloze(
      "ja-m6-3-2-cloze-2",
      "へや",
      " ねます。",
      "で",
      ["に", "で", "を", "の"],
      "I sleep in (my) room.",
      "へやで ねます。",
      "Sleeping is an action → setting → で.",
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-3-2-mcq-means",
      prompt: "Which sentence means 'I go to school by bus.'?",
      correctKana: "バスで がっこうに いきます。",
      distractorsKana: [
        "バスに がっこうで いきます。",
        "バスで がっこうで いきます。",
        "バスに がっこうに いきます。",
      ],
      explanation:
        "Means (bus) → で. Destination (school) → に. Roles aren't interchangeable.",
    }),
    // selfExplain — after multiple で commits
    selfExplain({
      id: "ja-m6-3-2-self-de",
      anchorLabel:
        "You picked で in: コンビニ＿ はたらきます (I work at a convenience store)",
      anchorAudioText: "コンビニで はたらきます",
      question: "Why is で correct here, not に?",
      rule: {
        text: "Working is an ACTION; で marks the place an action happens. に is for existence or destination, not action settings.",
      },
      surface: {
        text: "で always comes after work/study words, regardless of meaning.",
      },
      distractor: {
        text: "で marks the agent doing the action — 'by/by means of someone.'",
      },
      ruleExplanation:
        "に and で can both translate to English 'at,' but Japanese splits them by role: に for existence / destination, で for the place an ACTION happens.",
    }),
    // production — tile-bank build
    build(
      "ja-m6-3-2-translate-bus",
      "I go by bus.",
      "バスで いきます",
      ["バス", "で", "いきます", "に"],
      ["バス", "で", "いきます"],
    ),
    // speaking
    speaking(
      "ja-m6-3-2-speak-uchi",
      "うちで べんきょうします",
      "I study at home.",
    ),
    // listening_build
    listeningBuildSentence({
      id: "ja-m6-3-2-lb-densha",
      target: "でんしゃで がっこうに いきます",
      tiles: ["でんしゃ", "で", "がっこう", "に", "いきます", "うち", "あります"],
      correctOrder: ["でんしゃ", "で", "がっこう", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to school by train.'",
    }),
    // speaking — compound
    speaking(
      "ja-m6-3-2-speak-densha",
      "でんしゃで がっこうに いきます",
      "I go to school by train.",
    ),
    // ── Review tail ──
    speaking("ja-m6-3-2-rev-speak-1", M6_3_2_REVIEW[0].kana, M6_3_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m6-3-2-rev-lc",
      audioText: M6_3_2_REVIEW[1].kana,
      correctMeaningEn: M6_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_3_2_REVIEW[2].meaningEn,
        M6_3_2_REVIEW[3].meaningEn,
        M6_3_2_REVIEW[4].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-3-2-rev", M6_3_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-3-2-info-end",
      "You can now say where you do things and how you get there",
      "Action-setting (うちで) and means (でんしゃで) both take で. Next: が — but in its friendliest use.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_3_2.steps);
assertNoConsecutiveSame(M6_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-4-1 — が (existence intro — rule + inanimate)
// ═══════════════════════════════════════════════════════════════════════════

const RULE_GA_EXISTENCE = grammarRule({
  id: "ja-m6-4-1-rule-ga",
  title: "が — the existence particle (___が あります / います)",
  rule:
    "が marks the subject — most commonly the thing being introduced as NEW information. The friendliest use: existence sentences. 'こうえんが あります' = 'there's a park.' あります for inanimate things, います for living things. Don't worry about は vs が contrast yet — that's a much later lesson.",
  examples: [
    {
      ja: "こうえんが あります。",
      romaji: "kouen ga arimasu.",
      en: "There's a park.",
    },
    {
      ja: "ねこが います。",
      romaji: "neko ga imasu.",
      en: "There's a cat. (a living thing — います, not あります)",
    },
  ],
  antiPattern: {
    ja: "ねこが あります。",
    romaji: "neko ga arimasu.",
    en: "(broken — treats the cat as inanimate)",
    why: "Living things (people, animals) take います, not あります. Inanimate things (parks, books, convenience stores) take あります. The が is correct in both — only the existence verb changes.",
  },
  cultureNote:
    "Living things (people, animals) take います. Inanimate things take あります. Plants and cars are あります (no will/agency in the Japanese reckoning).",
});

const M6_4_1_REVIEW = pickReviewAtoms("ja-m6-4-1-rev", PRIOR_POOL, 6);

export const M6_4_1: LessonContent = {
  id: "ja-m6-4-1",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "が — existence intro (part 1)",
  description:
    "The existence pattern. ___が あります (inanimate) — introducing new information.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m6-4-1-info-open",
      "Finally — が",
      "が is famous as 'the other particle' that confuses beginners. We're introducing it in its friendliest form: the existence pattern. 'X が あります/います' = 'there's an X.'",
    ),
    RULE_GA_EXISTENCE,
    // New verb: あります (exists, inanimate) — build intro. Only あります unknown.
    build(
      "ja-m6-4-1-build-arimasu",
      "There's a park.",
      "こうえんが あります",
      ["こうえん", "が", "あります", "います", "に"],
      ["こうえん", "が", "あります"],
    ),
    cloze(
      "ja-m6-4-1-cloze-1",
      "こうえん",
      " あります。",
      "が",
      ["が", "は", "の", "を"],
      "There's a park.",
      "こうえんが あります。",
      "Existence sentence — inanimate thing + が + あります.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-4-1-lc-konbini",
      audioText: "コンビニが あります",
      correctMeaningEn: "There's a convenience store.",
      distractorsEn: [
        "I'm at the convenience store.",
        "Is there a convenience store?",
        "I go to the convenience store.",
      ],
    }),
    cloze(
      "ja-m6-4-1-cloze-2",
      "コンビニ",
      " あります。",
      "が",
      ["が", "は", "の", "に"],
      "There's a convenience store.",
      "コンビニが あります。",
      "Inanimate → あります.",
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-4-1-mcq-toire",
      prompt: "Which sentence means 'Is there a toilet?'",
      correctKana: "トイレが ありますか。",
      distractorsKana: [
        "トイレは ありますか。",
        "トイレに あります。",
        "トイレが います。",
      ],
      explanation:
        "Existence question: new info (toilet) → が + あります + か. トイレが います is wrong — toilets are inanimate.",
    }),
    cloze(
      "ja-m6-4-1-cloze-3",
      "トイレ",
      " ありますか。",
      "が",
      ["が", "は", "の", "を"],
      "Is there a toilet?",
      "トイレが ありますか。",
      "Existence + か question. The most useful sentence in tourist Japan.",
    ),
    // contrast cloze — に (not 100% が)
    cloze(
      "ja-m6-4-1-cloze-ni-foil",
      "がっこう",
      " います。",
      "に",
      ["に", "が", "で", "は"],
      "I'm at school. (pure existence of speaker, not announcing 'there's a school')",
      "がっこうに います。",
      "Location of speaker → に. Compare to がっこうが あります = 'there's a school' (announcing it).",
    ),
    // vocabMcq break — prior module
    vocabMcq("ja-m6-4-1-rev-mcq-mid", M6_4_1_REVIEW[0], PRIOR_POOL),
    // listening break
    listeningCompSentence({
      id: "ja-m6-4-1-lc-mise",
      audioText: "みせが あります",
      correctMeaningEn: "There's a shop.",
      distractorsEn: [
        "I'm at the shop.",
        "I work at the shop.",
        "Is there a shop?",
      ],
    }),
    // production — tile-bank build
    build(
      "ja-m6-4-1-translate-toire",
      "Is there a toilet?",
      "トイレが ありますか",
      ["トイレ", "が", "あります", "か", "います"],
      ["トイレ", "が", "あります", "か"],
    ),
    // speaking
    speaking(
      "ja-m6-4-1-speak-toire",
      "トイレが ありますか",
      "Is there a toilet?",
    ),
    // ── Review tail ──
    speaking("ja-m6-4-1-rev-speak-1", M6_4_1_REVIEW[1].kana, M6_4_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m6-4-1-rev-lc",
      audioText: M6_4_1_REVIEW[2].kana,
      correctMeaningEn: M6_4_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_4_1_REVIEW[3].meaningEn,
        M6_4_1_REVIEW[4].meaningEn,
        M6_4_1_REVIEW[5].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-4-1-rev", M6_4_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-4-1-info-end",
      "You can now announce what's around you",
      "X が あります = 'there's an X.' Next: living things (います) and the animacy split.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_4_1.steps);
assertNoConsecutiveSame(M6_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-4-2 — が (animacy split + production)
// ═══════════════════════════════════════════════════════════════════════════

const M6_4_2_REVIEW = pickReviewAtoms("ja-m6-4-2-rev", PRIOR_POOL, 6);

export const M6_4_2: LessonContent = {
  id: "ja-m6-4-2",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "が — animacy split (part 2)",
  description:
    "います for living things, あります for inanimate. Animacy discrimination + production.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m6-4-2-info-open",
      "Living vs inanimate",
      "が marks what exists, but the VERB changes: います for living things (people, animals), あります for everything else (places, objects, plants).",
    ),
    // New noun: ねこ (cat) — build intro. Single-tile, English obvious.
    build(
      "ja-m6-4-2-build-neko",
      "There's a cat.",
      "ねこが います",
      ["ねこ", "が", "います", "あります"],
      ["ねこ", "が", "います"],
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-4-2-lc-neko",
      audioText: "ねこが います",
      correctMeaningEn: "There's a cat.",
      distractorsEn: [
        "I have a cat.",
        "I like cats.",
        "I'm with a cat.",
      ],
    }),
    cloze(
      "ja-m6-4-2-cloze-1",
      "ねこ",
      " います。",
      "が",
      ["が", "は", "の", "を"],
      "There's a cat.",
      "ねこが います。",
      "Living thing + が + います.",
    ),
    // sentenceMcq — animacy discrimination
    sentenceMcq({
      id: "ja-m6-4-2-mcq-ari-vs-i",
      prompt: "Which sentence means 'There's a dog.'?",
      correctKana: "いぬが います。",
      distractorsKana: [
        "いぬが あります。",
        "いぬは います。",
        "いぬで います。",
      ],
      explanation:
        "Dogs are alive → います, not あります.",
    }),
    // New noun: ともだち (friend) — build intro. Only ともだち unknown.
    build(
      "ja-m6-4-2-build-tomodachi",
      "There's a friend (here).",
      "ともだちが います",
      ["ともだち", "が", "います", "あります", "ねこ"],
      ["ともだち", "が", "います"],
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-4-2-lc-tomodachi",
      audioText: "ともだちが います",
      correctMeaningEn: "There's a friend (here).",
      distractorsEn: [
        "I am a friend.",
        "There's a teacher.",
        "I go with a friend.",
      ],
    }),
    // sentenceMcq — animacy + が pattern
    sentenceMcq({
      id: "ja-m6-4-2-mcq-tomodachi",
      prompt: "Which sentence means 'There's a friend (here).'?",
      correctKana: "ともだちが います。",
      distractorsKana: [
        "ともだちが あります。",
        "ともだちに います。",
        "ともだちで います。",
      ],
      explanation:
        "Friends are alive → います. に / で don't appear in pure existence sentences (those need が).",
    }),
    // selfExplain — animacy split
    selfExplain({
      id: "ja-m6-4-2-self-animacy",
      anchorLabel:
        "You picked います in: ねこ＿ います / あります 'There's a cat'",
      anchorAudioText: "ねこが います",
      question: "Why does ねこ take います, but こうえん takes あります?",
      rule: {
        text: "います is for living things (people, animals); あります is for inanimate things (places, objects). Cats are alive; parks aren't.",
      },
      surface: {
        text: "い-something verbs go with small words, あ-something verbs go with long words.",
      },
      distractor: {
        text: "います is for things you can see; あります is for things you can't see.",
      },
      ruleExplanation:
        "Animacy in Japanese: anything that moves of its own will (people, animals) → います. Anything else (plants, cars, buildings) → あります.",
    }),
    // production — tile-bank build
    build(
      "ja-m6-4-2-translate-cat",
      "There's a cat.",
      "ねこが います",
      ["ねこ", "が", "います", "あります"],
      ["ねこ", "が", "います"],
    ),
    // speaking
    speaking(
      "ja-m6-4-2-speak-toire",
      "トイレが ありますか",
      "Is there a toilet?",
    ),
    // listening_build
    listeningBuildSentence({
      id: "ja-m6-4-2-lb-koen",
      target: "こうえんが あります",
      tiles: ["こうえん", "が", "あります", "ねこ", "います", "うち", "で"],
      correctOrder: ["こうえん", "が", "あります"],
      promptEn: "Hear it, build it: 'There's a park.'",
    }),
    // speaking — the most useful sentence
    speaking(
      "ja-m6-4-2-speak-neko",
      "ねこが います",
      "There's a cat.",
    ),
    // ── Review tail ──
    speaking("ja-m6-4-2-rev-speak-1", M6_4_2_REVIEW[0].kana, M6_4_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m6-4-2-rev-lc",
      audioText: M6_4_2_REVIEW[1].kana,
      correctMeaningEn: M6_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_4_2_REVIEW[2].meaningEn,
        M6_4_2_REVIEW[3].meaningEn,
        M6_4_2_REVIEW[4].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-4-2-rev", M6_4_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-4-2-info-end",
      "You can now point at anything and say 'there's an X'",
      "X が あります/います = 'there's an X.' 90% of beginner が encounters in the wild are this pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_4_2.steps);
assertNoConsecutiveSame(M6_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-5-1 — Interleaved に + で (first rotation block)
// ═══════════════════════════════════════════════════════════════════════════

const M6_5_1_REVIEW = pickReviewAtoms("ja-m6-5-1-rev", PRIOR_POOL, 6);

export const M6_5_1: LessonContent = {
  id: "ja-m6-5-1",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved — に + で (part 1)",
  description:
    "Mixed practice. Each cloze asks: destination (に) or setting/means (で)?",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m6-5-1-info-open",
      "Sort by role",
      "Two-question filter: am I pointing at a destination/location (に), or naming where the action happens / how I'm doing it (で)? Answers rotate.",
    ),
    // Rotating clozes: に → で → に → で
    cloze(
      "ja-m6-5-1-cloze-1",
      "がっこう",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to school.",
      "がっこうに いきます。",
      "Movement → destination → に.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-5-1-lc-uchi",
      audioText: "うちで べんきょうします",
      correctMeaningEn: "I study at home.",
      distractorsEn: [
        "I go home.",
        "I'm at home.",
        "Home is here.",
      ],
    }),
    cloze(
      "ja-m6-5-1-cloze-2",
      "うち",
      " べんきょうします。",
      "で",
      ["に", "で", "を", "の"],
      "I study at home.",
      "うちで べんきょうします。",
      "Action (study) → setting → で.",
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-5-1-mcq-jitensha",
      prompt: "Which sentence means 'I go to the park by bicycle.'?",
      correctKana: "じてんしゃで こうえんに いきます。",
      distractorsKana: [
        "じてんしゃに こうえんで いきます。",
        "じてんしゃで こうえんで いきます。",
        "じてんしゃに こうえんに いきます。",
      ],
      explanation:
        "Means (bicycle) → で. Destination (park) → に.",
    }),
    cloze(
      "ja-m6-5-1-cloze-3",
      "じてんしゃ",
      " いきます。",
      "で",
      ["に", "で", "を", "の"],
      "I go by bicycle.",
      "じてんしゃで いきます。",
      "Means of motion → で.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-5-1-lc-kaerimasu",
      audioText: "うちに かえります",
      correctMeaningEn: "I'm going home.",
      distractorsEn: [
        "I'm at home.",
        "I study at home.",
        "There's a home.",
      ],
    }),
    cloze(
      "ja-m6-5-1-cloze-4",
      "うち",
      " かえります。",
      "に",
      ["に", "で", "を", "が"],
      "I'm going home.",
      "うちに かえります。",
      "Destination + motion verb (かえる) → に.",
    ),
    // vocabMcq break — prior-module review
    vocabMcq("ja-m6-5-1-rev-mcq-mid", M6_5_1_REVIEW[0], PRIOR_POOL),
    // production — tile-bank build
    build(
      "ja-m6-5-1-translate-densha",
      "I go to school by train.",
      "でんしゃで がっこうに いきます",
      ["でんしゃ", "で", "がっこう", "に", "いきます", "うち"],
      ["でんしゃ", "で", "がっこう", "に", "いきます"],
    ),
    cloze(
      "ja-m6-5-1-cloze-5",
      "コンビニ",
      " はたらきます。",
      "で",
      ["に", "で", "を", "は"],
      "I work at a convenience store.",
      "コンビニで はたらきます。",
      "Work = action → setting → で.",
    ),
    // speaking
    speaking(
      "ja-m6-5-1-speak-densha",
      "でんしゃで がっこうに いきます",
      "I go to school by train.",
    ),
    // listening_build
    listeningBuildSentence({
      id: "ja-m6-5-1-lb-eki",
      target: "バスで えきに いきます",
      tiles: ["バス", "で", "えき", "に", "いきます", "がっこう", "うち"],
      correctOrder: ["バス", "で", "えき", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to the station by bus.'",
    }),
    // ── Review tail ──
    speaking("ja-m6-5-1-rev-speak-1", M6_5_1_REVIEW[1].kana, M6_5_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m6-5-1-rev-lc",
      audioText: M6_5_1_REVIEW[2].kana,
      correctMeaningEn: M6_5_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_5_1_REVIEW[3].meaningEn,
        M6_5_1_REVIEW[4].meaningEn,
        M6_5_1_REVIEW[5].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-5-1-rev", M6_5_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-5-1-info-end",
      "You can now sort destinations from settings by meaning",
      "に for destinations, で for action settings and means — parsed from context, not position. Next: more rotation + the は/が peek.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_5_1.steps);
assertNoConsecutiveSame(M6_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-5-2 — Interleaved に + で (は/が peek + production)
// ═══════════════════════════════════════════════════════════════════════════

const M6_5_2_REVIEW = pickReviewAtoms("ja-m6-5-2-rev", PRIOR_POOL, 6);

export const M6_5_2: LessonContent = {
  id: "ja-m6-5-2",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved — に + で + は/が peek (part 2)",
  description:
    "Continued rotation + the deferred は/が discrimination + cumulative production.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m6-5-2-info-open",
      "は vs が — a first peek",
      "You've now used が in existence sentences many times. Time for the first glimpse of how は and が differ. Short version: が introduces NEW info; は is for a KNOWN topic.",
    ),
    cloze(
      "ja-m6-5-2-cloze-1",
      "えき",
      " います。",
      "に",
      ["に", "で", "を", "は"],
      "I'm at the station.",
      "えきに います。",
      "Existence → location point → に.",
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-5-2-mcq-bus-park",
      prompt: "Which sentence means 'I go to the park by bus.'?",
      correctKana: "バスで こうえんに いきます。",
      distractorsKana: [
        "バスに こうえんで いきます。",
        "バスで こうえんで いきます。",
        "バスに こうえんに いきます。",
      ],
      explanation:
        "Means → で. Destination → に.",
    }),
    cloze(
      "ja-m6-5-2-cloze-2",
      "へや",
      " ねます。",
      "で",
      ["に", "で", "を", "は"],
      "I sleep in (my) room.",
      "へやで ねます。",
      "Action (sleeping) → setting → で.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-5-2-lc-konbini",
      audioText: "コンビニに います",
      correctMeaningEn: "I'm at the convenience store.",
      distractorsEn: [
        "There's a convenience store.",
        "I work at the convenience store.",
        "I go to the convenience store.",
      ],
    }),
    cloze(
      "ja-m6-5-2-cloze-3",
      "コンビニ",
      " います。",
      "に",
      ["に", "で", "が", "は"],
      "I'm at the convenience store.",
      "コンビニに います。",
      "Existence → location point → に.",
    ),
    // selfExplain — は/が discrimination
    selfExplain({
      id: "ja-m6-5-2-self-ha-vs-ga",
      anchorLabel:
        "Compare: こうえん＿ あります vs こうえん＿ どこですか",
      anchorAudioText: "こうえんが あります",
      question:
        "Why does 'There's a park' take が, but 'Where IS the park?' takes は?",
      rule: {
        text: "が introduces NEW information (announcing the park exists). は frames a known TOPIC the speaker is asking ABOUT.",
      },
      surface: {
        text: "が is used in statements; は is used in questions.",
      },
      distractor: {
        text: "が introduces the answer to an implied wh-question; は doesn't.",
      },
      ruleExplanation:
        "The underlying split is information status: が = new info, は = known topic. 'こうえんが あります' announces a park you didn't know about; 'こうえんは どこですか' takes the park as known and asks WHERE.",
    }),
    // production — tile-bank build
    build(
      "ja-m6-5-2-translate-cumulative",
      "I go home by bicycle.",
      "じてんしゃで うちに かえります",
      ["じてんしゃ", "で", "うち", "に", "かえります", "います"],
      ["じてんしゃ", "で", "うち", "に", "かえります"],
    ),
    // speaking
    speaking(
      "ja-m6-5-2-speak-densha",
      "でんしゃで がっこうに いきます",
      "I go to school by train.",
    ),
    // listening_build
    listeningBuildSentence({
      id: "ja-m6-5-2-lb-bus",
      target: "バスで うちに かえります",
      tiles: ["バス", "で", "うち", "に", "かえります", "えき", "いきます"],
      correctOrder: ["バス", "で", "うち", "に", "かえります"],
      promptEn: "Hear it, build it: 'I go home by bus.'",
    }),
    // sentenceMcq — cumulative
    sentenceMcq({
      id: "ja-m6-5-2-mcq-cumulative",
      prompt: "Which sentence means 'I'm at the park.'?",
      correctKana: "こうえんに います。",
      distractorsKana: [
        "こうえんで います。",
        "こうえんが あります。",
        "こうえんに いきます。",
      ],
      explanation:
        "Pure existence of speaker → に. が あります would mean 'there's a park' (announcing it). いきます means 'go.'",
    }),
    // production — compound sentence
    build(
      "ja-m6-5-2-translate-eki",
      "I'm at the station.",
      "えきに います",
      ["えき", "に", "います", "で", "あります"],
      ["えき", "に", "います"],
    ),
    // speaking
    speaking(
      "ja-m6-5-2-speak-uchi",
      "うちに かえります",
      "I'm going home.",
    ),
    // ── Review tail ──
    speaking("ja-m6-5-2-rev-speak-1", M6_5_2_REVIEW[0].kana, M6_5_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m6-5-2-rev-lc",
      audioText: M6_5_2_REVIEW[1].kana,
      correctMeaningEn: M6_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_5_2_REVIEW[2].meaningEn,
        M6_5_2_REVIEW[3].meaningEn,
        M6_5_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m6-5-2-rev-mcq-2", M6_5_2_REVIEW[3], PRIOR_POOL),
    reviewMatchPairs("ja-m6-5-2-rev", M6_5_2_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m6-5-2-info-end",
      "You can sort destinations from settings without shortcuts",
      "Mixed drills, no screen-pattern shortcut. You're parsing meaning — and you've had a first peek at は vs が.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_5_2.steps);
assertNoConsecutiveSame(M6_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-6-1 — Interleaved existence + locations (first 3-particle block)
// ═══════════════════════════════════════════════════════════════════════════

const M6_6_1_REVIEW = pickReviewAtoms("ja-m6-6-1-rev", PRIOR_POOL, 6);

export const M6_6_1: LessonContent = {
  id: "ja-m6-6-1",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved — all three particles (part 1)",
  description:
    "Clozes rotate across が (existence) + に (location) + で (setting). No screen-position shortcut.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m6-6-1-info-open",
      "All three particles in play",
      "The answer rotates across が / に / で. Each carrier asks for actual parsing — no screen-position shortcut.",
    ),
    // rotating: が → に → で → が
    cloze(
      "ja-m6-6-1-cloze-1",
      "ともだち",
      " います。",
      "が",
      ["が", "は", "の", "を"],
      "There's a friend (here).",
      "ともだちが います。",
      "Living thing + existence → が + います.",
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-6-1-mcq-existence-vs-location",
      prompt: "Which sentence means 'I'm at the convenience store.'?",
      correctKana: "コンビニに います。",
      distractorsKana: [
        "コンビニが います。",
        "コンビニで います。",
        "コンビニは あります。",
      ],
      explanation:
        "'I am at X' = pure existence → location takes に.",
    }),
    cloze(
      "ja-m6-6-1-cloze-2",
      "がっこう",
      " います。",
      "に",
      ["に", "で", "が", "を"],
      "I'm at school.",
      "がっこうに います。",
      "Pure existence → location point → に.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-6-1-lc-konbini",
      audioText: "コンビニが ありますか",
      correctMeaningEn: "Is there a convenience store?",
      distractorsEn: [
        "I'm at the convenience store.",
        "Is the convenience store far?",
        "I go to the convenience store.",
      ],
    }),
    cloze(
      "ja-m6-6-1-cloze-3",
      "うち",
      " べんきょうします。",
      "で",
      ["で", "に", "が", "を"],
      "I study at home.",
      "うちで べんきょうします。",
      "Action setting → で.",
    ),
    // tile-bank build break
    build(
      "ja-m6-6-1-translate-park-cat",
      "There's a cat at the park.",
      "こうえんに ねこが います",
      ["こうえん", "に", "ねこ", "が", "います", "で"],
      ["こうえん", "に", "ねこ", "が", "います"],
    ),
    cloze(
      "ja-m6-6-1-cloze-4",
      "コンビニ",
      " ありますか。",
      "が",
      ["が", "は", "を", "に"],
      "Is there a convenience store?",
      "コンビニが ありますか。",
      "Existence question → が + あります + か.",
    ),
    // vocabMcq break — prior-module review
    vocabMcq("ja-m6-6-1-rev-mcq-mid", M6_6_1_REVIEW[0], PRIOR_POOL),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-6-1-mcq-cat-park",
      prompt: "Which sentence means 'There's a cat in the park.'?",
      correctKana: "こうえんに ねこが います。",
      distractorsKana: [
        "こうえんが ねこに います。",
        "こうえんで ねこは います。",
        "こうえんに ねこは いますか。",
      ],
      explanation:
        "Location (park) → に. Subject (cat, new info) → が.",
    }),
    cloze(
      "ja-m6-6-1-cloze-5",
      "ホテル",
      " かえります。",
      "に",
      ["に", "で", "を", "が"],
      "I'm going back to the hotel.",
      "ホテルに かえります。",
      "Destination + motion verb (かえる) → に.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-6-1-lc-neko",
      audioText: "ねこが います",
      correctMeaningEn: "There's a cat.",
      distractorsEn: [
        "I like cats.",
        "The cat is far.",
        "I go to the cat.",
      ],
    }),
    // speaking
    speaking(
      "ja-m6-6-1-speak-toire",
      "トイレが ありますか",
      "Is there a toilet?",
    ),
    // ── Review tail ──
    speaking("ja-m6-6-1-rev-speak-1", M6_6_1_REVIEW[1].kana, M6_6_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m6-6-1-rev-lc",
      audioText: M6_6_1_REVIEW[2].kana,
      correctMeaningEn: M6_6_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_6_1_REVIEW[3].meaningEn,
        M6_6_1_REVIEW[4].meaningEn,
        M6_6_1_REVIEW[5].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-6-1-rev", M6_6_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-6-1-info-end",
      "You can now pick the right particle across が, に, and で",
      "Existence (が), location (に), and action setting (で) — rotating with no shortcut. Next: compound sentences with multiple particles.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_6_1.steps);
assertNoConsecutiveSame(M6_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-6-2 — Interleaved existence + locations (compound sentences)
// ═══════════════════════════════════════════════════════════════════════════

const M6_6_2_REVIEW = pickReviewAtoms("ja-m6-6-2-rev", PRIOR_POOL, 6);

export const M6_6_2: LessonContent = {
  id: "ja-m6-6-2",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved — compound sentences (part 2)",
  description:
    "Compound existence + location sentences using multiple particles at once.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m6-6-2-info-open",
      "Compound patterns",
      "Real Japanese combines particles: 'えきに トイレが あります' = 'There's a toilet at the station.' Location (に) + new-info subject (が) in one sentence.",
    ),
    cloze(
      "ja-m6-6-2-cloze-1",
      "ねこ",
      " います。",
      "が",
      ["が", "は", "の", "を"],
      "There's a cat.",
      "ねこが います。",
      "Living thing + existence → が + います.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-6-2-lc-cumulative",
      audioText: "うちに ねこが います",
      correctMeaningEn: "There's a cat at my house.",
      distractorsEn: [
        "I'm at my house with a cat.",
        "I'm going home to the cat.",
        "Is there a cat at home?",
      ],
    }),
    // production — compound build
    build(
      "ja-m6-6-2-translate-eki-toire",
      "There's a toilet at the station.",
      "えきに トイレが あります",
      ["えき", "に", "トイレ", "が", "あります", "で", "います"],
      ["えき", "に", "トイレ", "が", "あります"],
    ),
    // sentenceMcq
    sentenceMcq({
      id: "ja-m6-6-2-mcq-compound",
      prompt: "Which sentence means 'There's a friend at school.'?",
      correctKana: "がっこうに ともだちが います。",
      distractorsKana: [
        "がっこうが ともだちに います。",
        "がっこうで ともだちは います。",
        "がっこうに ともだちは いますか。",
      ],
      explanation:
        "Location → に. New-info subject (friend, living) → が + います.",
    }),
    cloze(
      "ja-m6-6-2-cloze-2",
      "えき",
      " コンビニが あります。",
      "に",
      ["に", "で", "が", "は"],
      "There's a convenience store at the station.",
      "えきに コンビニが あります。",
      "Location for existence → に.",
    ),
    // listening_build
    listeningBuildSentence({
      id: "ja-m6-6-2-lb-toire",
      target: "えきに トイレが あります",
      tiles: ["えき", "に", "トイレ", "が", "あります", "コンビニ", "で"],
      correctOrder: ["えき", "に", "トイレ", "が", "あります"],
      promptEn: "Hear it, build it: 'There's a toilet at the station.'",
    }),
    cloze(
      "ja-m6-6-2-cloze-3",
      "へや",
      " ねます。",
      "で",
      ["で", "に", "が", "は"],
      "I sleep in (my) room.",
      "へやで ねます。",
      "Action (sleeping) → setting → で.",
    ),
    // speaking
    speaking(
      "ja-m6-6-2-speak-toire",
      "えきに トイレが あります",
      "There's a toilet at the station.",
    ),
    // production — compound build
    build(
      "ja-m6-6-2-translate-cumulative",
      "There's a friend at school.",
      "がっこうに ともだちが います",
      ["がっこう", "に", "ともだち", "が", "います", "で"],
      ["がっこう", "に", "ともだち", "が", "います"],
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-6-2-lc-eki-konbini",
      audioText: "えきに コンビニが あります",
      correctMeaningEn: "There's a convenience store at the station.",
      distractorsEn: [
        "I'm at the convenience store by the station.",
        "I go to the convenience store.",
        "The station is at the convenience store.",
      ],
    }),
    // sentenceMcq — final discrimination
    sentenceMcq({
      id: "ja-m6-6-2-mcq-hotel",
      prompt: "Which sentence means 'I'm going back to the hotel.'?",
      correctKana: "ホテルに かえります。",
      distractorsKana: [
        "ホテルで かえります。",
        "ホテルが かえります。",
        "ホテルに います。",
      ],
      explanation:
        "Destination + motion verb → に. ホテルに います would mean 'I'm at the hotel' (different meaning).",
    }),
    // speaking — compound
    speaking(
      "ja-m6-6-2-speak-cumulative",
      "がっこうに ともだちが います",
      "There's a friend at school.",
    ),
    // ── Review tail ──
    speaking("ja-m6-6-2-rev-speak-1", M6_6_2_REVIEW[0].kana, M6_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m6-6-2-rev-lc",
      audioText: M6_6_2_REVIEW[1].kana,
      correctMeaningEn: M6_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_6_2_REVIEW[2].meaningEn,
        M6_6_2_REVIEW[3].meaningEn,
        M6_6_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m6-6-2-rev-mcq-2", M6_6_2_REVIEW[3], PRIOR_POOL),
    reviewMatchPairs("ja-m6-6-2-rev", M6_6_2_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m6-6-2-info-end",
      "You can now juggle が, に, AND で in the same sentence",
      "Compound sentences with multiple particles working together. You now have 'X が あります/います' + the location filter from earlier lessons.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_6_2.steps);
assertNoConsecutiveSame(M6_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-STORY — Story comprehension: After school
// ═══════════════════════════════════════════════════════════════════════════

export const M6_STORY: LessonContent = {
  id: "ja-m6-story",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — After school",
  description:
    "Listen to two friends talk about where they go after school and how they get there.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m6-story-info-open",
      "Story time — After school",
      "ゆき and たけし are leaving school. Listen as they talk about where they are going and how.",
    ),
    dialogueListen({
      id: "ja-m6-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "たけしは がっこうに いきますか。" },
        { speaker: "たけし", kana: "いいえ、うちに かえります。" },
        { speaker: "ゆき", kana: "でんしゃで かえりますか。" },
        { speaker: "たけし", kana: "はい、えきに いきます。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "Where is たけし going?",
          correctText: "Home",
          distractors: ["School", "The park", "A shop"],
          explanation: "うちに かえります = 'I go home (return).' うち = home.",
        },
        {
          id: "s1-q2",
          prompt: "How does たけし get home?",
          correctText: "By train",
          distractors: ["By bus", "By bicycle", "On foot"],
          explanation: "でんしゃで かえりますか → はい、えきに いきます. He goes to the station — by train.",
        },
      ],
    }),
    build(
      "ja-m6-story-build-ni",
      "Say: I go to school.",
      "がっこうに いきます",
      ["がっこう", "に", "いきます", "で", "かえります"],
      ["がっこう", "に", "いきます"],
    ),
    sentenceMcq({
      id: "ja-m6-story-mcq-de",
      prompt: "Which sentence means 'I return by train'?",
      correctKana: "でんしゃで かえります",
      distractorsKana: [
        "でんしゃに かえります",
        "えきで かえります",
        "でんしゃで いきます",
      ],
      explanation: "で marks the means — でんしゃで = 'by train.' かえります = return.",
    }),
    dialogueListen({
      id: "ja-m6-story-scene-2",
      lines: [
        { speaker: "たけし", kana: "ゆきは うちで べんきょうしますか。" },
        { speaker: "ゆき", kana: "いいえ、がっこうで べんきょうします。" },
        { speaker: "たけし", kana: "こうえんに ねこが いますか。" },
        { speaker: "ゆき", kana: "はい、こうえんに ねこが います。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "Where does ゆき study?",
          correctText: "At school",
          distractors: ["At home", "At the park", "At a shop"],
          explanation: "がっこうで べんきょうします = 'I study at school.' で marks the location of an action.",
        },
        {
          id: "s2-q2",
          prompt: "What is at the park?",
          correctText: "A cat",
          distractors: ["A dog", "A friend", "Nothing"],
          explanation: "こうえんに ねこが います = 'There is a cat at the park.' が marks what exists.",
        },
      ],
    }),
    cloze(
      "ja-m6-story-cloze-de",
      "がっこう",
      " べんきょうします。 (I study AT school.)",
      "で",
      ["で", "に", "は", "が"],
      "I study at school.",
      "がっこうで べんきょうします。",
      "で marks where an action happens. に marks destination or existence location.",
    ),
    listeningBuildSentence({
      id: "ja-m6-story-lb-neko",
      target: "こうえんに ねこが います",
      tiles: ["こうえん", "に", "ねこ", "が", "います", "で", "あります"],
      correctOrder: ["こうえん", "に", "ねこ", "が", "います"],
      promptEn: "Hear it, build it: 'There is a cat at the park.'",
    }),
    listeningCompSentence({
      id: "ja-m6-story-lc-kaeri",
      audioText: "うちに かえります",
      correctMeaningEn: "I go home (return).",
      distractorsEn: [
        "I go to school.",
        "I study at home.",
        "I work at home.",
      ],
    }),
    speaking(
      "ja-m6-story-speak-ni",
      "がっこうに いきます",
      "I go to school.",
    ),
    sentenceMcq({
      id: "ja-m6-story-mcq-summary",
      prompt: "In the story, which particle marks WHERE an action happens?",
      correctKana: "で",
      distractorsKana: ["に", "が", "は"],
      explanation: "で = where you DO something (がっこうで). に = destination or existence point.",
    }),
    speaking(
      "ja-m6-story-speak-de",
      "がっこうで べんきょうします",
      "I study at school.",
    ),
    infoStep(
      "ja-m6-story-info-end",
      "You followed a conversation about daily life",
      "You heard に (destination), で (where actions happen), and が (what exists) — the three particles that describe where things are and where you go.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M6_STORY.steps);
assertPassiveCardsHaveFollowup(M6_STORY.steps);
assertNoExplanationOnPassive(M6_STORY.steps);
assertExplanationDoesntLeakAnswer(M6_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-7-1 — Production (build + listening_build)
// ═══════════════════════════════════════════════════════════════════════════

const M6_7_1_REVIEW = pickReviewAtoms("ja-m6-7-1-rev", PRIOR_POOL, 6);

export const M6_7_1: LessonContent = {
  id: "ja-m6-7-1",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — build + listen (part 1)",
  description:
    "Cumulative production: tile-bank build and listening_build across all M6 patterns.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m6-7-1-info-open",
      "Production time",
      "Six sentences across build and listening_build modes. Assemble from tiles what you've been parsing.",
    ),
    // Sentence 1: build
    build(
      "ja-m6-7-1-s1",
      "I go to school by bicycle.",
      "じてんしゃで がっこうに いきます",
      ["じてんしゃ", "で", "がっこう", "に", "いきます", "うち", "あります"],
      ["じてんしゃ", "で", "がっこう", "に", "いきます"],
    ),
    // Sentence 2: build (short, existence question)
    build(
      "ja-m6-7-1-s2",
      "Is there a toilet?",
      "トイレが ありますか",
      ["トイレ", "が", "あります", "か", "ねこ", "います"],
      ["トイレ", "が", "あります", "か"],
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-7-1-mcq-recall",
      prompt: "Which sentence means 'There's a park near the station.'?",
      correctKana: "えきに こうえんが あります。",
      distractorsKana: [
        "えきで こうえんが あります。",
        "えきに こうえんは あります。",
        "えきが こうえんに います。",
      ],
      explanation:
        "Location (station) → に. New-info subject (park, inanimate) → が + あります.",
    }),
    // Sentence 3: listening_build
    listeningBuildSentence({
      id: "ja-m6-7-1-s3",
      target: "コンビニで はたらきます",
      tiles: ["コンビニ", "で", "はたらきます", "うち", "べんきょうします"],
      correctOrder: ["コンビニ", "で", "はたらきます"],
      promptEn: "Hear it, build it: 'I work at a convenience store.'",
    }),
    // vocabMcq break — prior-module review
    vocabMcq("ja-m6-7-1-rev-mcq-early", M6_7_1_REVIEW[0], PRIOR_POOL),
    // Sentence 4: build
    build(
      "ja-m6-7-1-s4",
      "I'm at the station.",
      "えきに います",
      ["えき", "に", "います", "で", "あります"],
      ["えき", "に", "います"],
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-7-1-lc-bus",
      audioText: "バスで うちに かえります",
      correctMeaningEn: "I'm going home by bus.",
      distractorsEn: [
        "I go to the bus stop.",
        "I'm at home with the bus.",
        "The bus is at my home.",
      ],
    }),
    // Sentence 5: listening_build (longer)
    listeningBuildSentence({
      id: "ja-m6-7-1-s5",
      target: "うちに ねこが います",
      tiles: ["うち", "に", "ねこ", "が", "います", "コンビニ", "で", "あります"],
      correctOrder: ["うち", "に", "ねこ", "が", "います"],
      promptEn: "Hear it, build it: 'There's a cat at my house.'",
    }),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-7-1-mcq-three-particles",
      prompt: "Which sentence means 'I go to the park by bus.'?",
      correctKana: "バスで こうえんに いきます。",
      distractorsKana: [
        "バスに こうえんで いきます。",
        "バスで こうえんで いきます。",
        "バスが こうえんに います。",
      ],
      explanation:
        "Means (bus) → で. Destination (park) → に.",
    }),
    // Sentence 6: build (compound existence)
    build(
      "ja-m6-7-1-s6",
      "There's a convenience store at the station.",
      "えきに コンビニが あります",
      ["えき", "に", "コンビニ", "が", "あります", "います", "で"],
      ["えき", "に", "コンビニ", "が", "あります"],
    ),
    // speaking
    speaking(
      "ja-m6-7-1-speak-s2",
      "トイレが ありますか",
      "Is there a toilet?",
    ),
    // ── Review tail ──
    speaking("ja-m6-7-1-rev-speak-1", M6_7_1_REVIEW[1].kana, M6_7_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m6-7-1-rev-lc",
      audioText: M6_7_1_REVIEW[2].kana,
      correctMeaningEn: M6_7_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_7_1_REVIEW[3].meaningEn,
        M6_7_1_REVIEW[4].meaningEn,
        M6_7_1_REVIEW[5].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-7-1-rev", M6_7_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-7-1-info-end",
      "You can now build M6 sentences from tiles",
      "Tile-bank builds and listening builds across all three particles. Next: speaking production and more cumulative patterns.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_7_1.steps);
assertNoConsecutiveSame(M6_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-7-2 — Production (speaking + cumulative patterns)
// ═══════════════════════════════════════════════════════════════════════════

const M6_7_2_REVIEW = pickReviewAtoms("ja-m6-7-2-rev", PRIOR_POOL, 6);

export const M6_7_2: LessonContent = {
  id: "ja-m6-7-2",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — speaking + cumulative (part 2)",
  description:
    "Speaking production + final cumulative patterns. Every M6 pattern on your lips.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m6-7-2-info-open",
      "Say it yourself",
      "Speaking production across all M6 patterns. Your voice completes the learning cycle.",
    ),
    // speaking — existence
    speaking(
      "ja-m6-7-2-speak-neko",
      "ねこが います",
      "There's a cat.",
    ),
    // build break
    build(
      "ja-m6-7-2-s1",
      "Is there a convenience store?",
      "コンビニが ありますか",
      ["コンビニ", "が", "あります", "か", "います"],
      ["コンビニ", "が", "あります", "か"],
    ),
    // speaking — means + destination
    speaking(
      "ja-m6-7-2-speak-bus",
      "バスで えきに いきます",
      "I go to the station by bus.",
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-7-2-mcq-compound",
      prompt: "Which sentence means 'There's a cat at my house.'?",
      correctKana: "うちに ねこが います。",
      distractorsKana: [
        "うちが ねこに います。",
        "うちで ねこが います。",
        "うちに ねこは いますか。",
      ],
      explanation:
        "Location → に. New-info subject (cat, living) → が + います.",
    }),
    // speaking — compound existence
    speaking(
      "ja-m6-7-2-speak-park-cat",
      "こうえんに ねこが います",
      "There's a cat at the park.",
    ),
    // listening_build
    listeningBuildSentence({
      id: "ja-m6-7-2-lb-bus",
      target: "バスで がっこうに いきます",
      tiles: ["バス", "で", "がっこう", "に", "いきます", "えき", "います"],
      correctOrder: ["バス", "で", "がっこう", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to school by bus.'",
    }),
    // speaking — action setting
    speaking(
      "ja-m6-7-2-speak-uchi",
      "うちで べんきょうします",
      "I study at home.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-7-2-lc-jitensha",
      audioText: "じてんしゃで こうえんに いきます",
      correctMeaningEn: "I go to the park by bicycle.",
      distractorsEn: [
        "I'm at the park with a bicycle.",
        "There's a bicycle at the park.",
        "I bicycle home from the park.",
      ],
    }),
    // build — cumulative
    build(
      "ja-m6-7-2-s2",
      "I'm going home by bus.",
      "バスで うちに かえります",
      ["バス", "で", "うち", "に", "かえります", "います"],
      ["バス", "で", "うち", "に", "かえります"],
    ),
    // speaking — the most-useful pattern
    speaking(
      "ja-m6-7-2-speak-toire",
      "トイレが ありますか",
      "Is there a toilet?",
    ),
    // sentenceMcq — final cumulative
    sentenceMcq({
      id: "ja-m6-7-2-mcq-final",
      prompt: "Which sentence means 'I work at a convenience store.'?",
      correctKana: "コンビニで はたらきます。",
      distractorsKana: [
        "コンビニに はたらきます。",
        "コンビニが はたらきます。",
        "コンビニで います。",
      ],
      explanation:
        "Work = action → setting → で.",
    }),
    // speaking — final compound
    speaking(
      "ja-m6-7-2-speak-final",
      "えきに トイレが あります",
      "There's a toilet at the station.",
    ),
    // ── Review tail ──
    speaking("ja-m6-7-2-rev-speak-1", M6_7_2_REVIEW[0].kana, M6_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m6-7-2-rev-lc",
      audioText: M6_7_2_REVIEW[1].kana,
      correctMeaningEn: M6_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_7_2_REVIEW[2].meaningEn,
        M6_7_2_REVIEW[3].meaningEn,
        M6_7_2_REVIEW[4].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-7-2-rev", M6_7_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-7-2-info-end",
      "You can now speak every M6 pattern aloud",
      "Existence, destination, action setting, and means — all produced with your voice. From here, you can describe where you are, where you're going, and what's around you.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_7_2.steps);
assertNoConsecutiveSame(M6_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-8-1 — Mini-dialogue (warm-up + dialogue)
// ═══════════════════════════════════════════════════════════════════════════

const M6_8_1_REVIEW = pickReviewAtoms("ja-m6-8-1-rev", PRIOR_POOL, 6);

export const M6_8_1: LessonContent = {
  id: "ja-m6-8-1",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — asking directions (part 1)",
  description:
    "Warm-up vocab for a Shibuya directions dialogue + the dialogue itself.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m6-8-1-info-open",
      "Drop into the scene",
      "You're walking through Shibuya looking for the station. You'll learn three new words, then use them in a live dialogue.",
      "culture",
    ),
    // New word: ちかい (close) — build intro. Single-tile, English obvious.
    build(
      "ja-m6-8-1-build-chikai",
      "It's close.",
      "ちかいです",
      ["ちかい", "です", "とおい", "か"],
      ["ちかい", "です"],
    ),
    // listening retrieval
    listeningCompSentence({
      id: "ja-m6-8-1-lc-chikai",
      audioText: "ちかいです",
      correctMeaningEn: "It's close.",
      distractorsEn: ["It's far.", "It's loud.", "It's expensive."],
    }),
    // New word: とおい (far) — build intro. Single-tile, contrasts with ちかい.
    build(
      "ja-m6-8-1-build-tooi",
      "It's far.",
      "とおいです",
      ["とおい", "です", "ちかい", "か"],
      ["とおい", "です"],
    ),
    // listening comprehension — discrimination
    listeningCompSentence({
      id: "ja-m6-8-1-lc-tooi",
      audioText: "とおいです",
      correctMeaningEn: "It's far.",
      distractorsEn: ["It's close.", "It's here.", "It's there."],
    }),
    // New word: どこ (where) — build intro. Single-tile, English obvious.
    build(
      "ja-m6-8-1-build-doko",
      "Where is the station?",
      "えきは どこですか",
      ["えき", "は", "どこ", "です", "か", "に"],
      ["えき", "は", "どこ", "です", "か"],
    ),
    // speaking — the key opener
    speaking(
      "ja-m6-8-1-speak-doko",
      "えきは どこですか",
      "Where is the station?",
    ),
    // ── THE DIALOGUE ──
    dialogueListen({
      id: "ja-m6-8-1-dialogue",
      lines: [
        {
          speaker: "You",
          kana: "すみません。えきは どこですか。",
          audioText: "すみません。えきは どこですか",
        },
        {
          speaker: "Stranger",
          kana: "えきは あちらです。みぎへ いって ください。",
          audioText: "えきは あちらです。みぎへ いって ください",
        },
        {
          speaker: "You",
          kana: "ありがとうございます。とおいですか。",
          audioText: "ありがとうございます。とおいですか",
        },
        {
          speaker: "Stranger",
          kana: "いいえ、ごふんです。",
          audioText: "いいえ、ごふんです",
        },
      ],
      questions: [
        {
          id: "q-where",
          prompt: "Where is the station, according to the stranger?",
          correctText: "Over there (あちら)",
          distractors: [
            "Right here",
            "Back the way you came",
            "Inside the shop",
          ],
          explanation:
            "あちら = 'over there (away from both of us).' The stranger then specifies 'go right.'",
        },
        {
          id: "q-direction",
          prompt: "Which direction does the stranger tell you to go?",
          correctText: "Right (みぎ)",
          distractors: [
            "Left (ひだり)",
            "Straight ahead",
            "Back the way you came",
          ],
          explanation:
            "みぎへ いって ください = 'please go to the right.'",
        },
        {
          id: "q-howlong",
          prompt: "How long will it take to get there?",
          correctText: "5 minutes (ごふん)",
          distractors: ["1 minute", "10 minutes", "30 minutes"],
          explanation:
            "ごふん = 5 minutes (ご = 5, ふん = minute counter).",
        },
      ],
    }),
    // post-dialogue listening comprehension
    listeningCompSentence({
      id: "ja-m6-8-1-lc-dialogue-line",
      audioText: "えきは あちらです",
      correctMeaningEn: "The station is over there.",
      distractorsEn: [
        "The station is here.",
        "Is there a station?",
        "I go to the station.",
      ],
    }),
    // speaking — gratitude phrase
    speaking(
      "ja-m6-8-1-speak-thanks",
      "ありがとうございます",
      "Thank you.",
    ),
    // ── Review tail ──
    speaking("ja-m6-8-1-rev-speak-1", M6_8_1_REVIEW[0].kana, M6_8_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m6-8-1-rev-lc",
      audioText: M6_8_1_REVIEW[1].kana,
      correctMeaningEn: M6_8_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_8_1_REVIEW[2].meaningEn,
        M6_8_1_REVIEW[3].meaningEn,
        M6_8_1_REVIEW[4].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-8-1-rev", M6_8_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-8-1-info-end",
      "You survived the Shibuya dialogue",
      "You asked where, understood the answer, and said thank you. Next: post-dialogue grammar drills + review.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_8_1.steps);
assertNoConsecutiveSame(M6_8_1.steps);

// ═══════════════════════════════════════════════════════════════════════════
// M6-8-2 — Mini-dialogue (post-dialogue drills + review)
// ═══════════════════════════════════════════════════════════════════════════

const M6_8_2_REVIEW = pickReviewAtoms("ja-m6-8-2-rev", PRIOR_POOL, 6);

export const M6_8_2: LessonContent = {
  id: "ja-m6-8-2",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — post-dialogue drills (part 2)",
  description:
    "Cumulative grammar drills after the dialogue + broad review across M1-M5.",
  estimatedMinutes: 9,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m6-8-2-info-open",
      "Cumulative check",
      "Post-dialogue grammar check. All three particles rotate + cumulative production.",
    ),
    // Cumulative clozes — rotating (が, に, で)
    cloze(
      "ja-m6-8-2-cloze-1",
      "コンビニ",
      " ありますか。",
      "が",
      ["が", "は", "を", "に"],
      "Is there a convenience store?",
      "コンビニが ありますか。",
      "Existence question → が.",
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-8-2-mcq-eki",
      prompt: "Which sentence means 'The bank is at the station.'?",
      correctKana: "えきに ぎんこうが あります。",
      distractorsKana: [
        "えきで ぎんこうが あります。",
        "えきに ぎんこうは あります。",
        "えきが ぎんこうに あります。",
      ],
      explanation:
        "Location (station) → に. New-info subject (bank) → が + あります.",
    }),
    cloze(
      "ja-m6-8-2-cloze-2",
      "えき",
      " います。",
      "に",
      ["に", "で", "を", "が"],
      "I'm at the station.",
      "えきに います。",
      "Pure existence → location point → に.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-8-2-lc-bus",
      audioText: "バスで うちに かえります",
      correctMeaningEn: "I'm going home by bus.",
      distractorsEn: [
        "I go to the bus stop.",
        "I'm at home.",
        "The bus is at home.",
      ],
    }),
    cloze(
      "ja-m6-8-2-cloze-3",
      "コンビニ",
      " はたらきます。",
      "で",
      ["で", "に", "が", "は"],
      "I work at a convenience store.",
      "コンビニで はたらきます。",
      "Action → setting → で.",
    ),
    // production — tile-bank build
    build(
      "ja-m6-8-2-translate-final",
      "I'm going home by bus.",
      "バスで うちに かえります",
      ["バス", "で", "うち", "に", "かえります", "います"],
      ["バス", "で", "うち", "に", "かえります"],
    ),
    // speaking — the opener
    speaking(
      "ja-m6-8-2-speak-doko",
      "えきは どこですか",
      "Where is the station?",
    ),
    // listening_build
    listeningBuildSentence({
      id: "ja-m6-8-2-lb-cumulative",
      target: "えきに コンビニが あります",
      tiles: ["えき", "に", "コンビニ", "が", "あります", "うち", "で", "います"],
      correctOrder: ["えき", "に", "コンビニ", "が", "あります"],
      promptEn: "Hear it, build it: 'There's a convenience store at the station.'",
    }),
    // sentenceMcq — final pattern
    sentenceMcq({
      id: "ja-m6-8-2-mcq-final",
      prompt: "Which sentence means 'I study at home.'?",
      correctKana: "うちで べんきょうします。",
      distractorsKana: [
        "うちに べんきょうします。",
        "うちが べんきょうします。",
        "うちで います。",
      ],
      explanation:
        "Study = action → setting → で.",
    }),
    // speaking — compound
    speaking(
      "ja-m6-8-2-speak-final",
      "えきに トイレが あります",
      "There's a toilet at the station.",
    ),
    // production — build
    build(
      "ja-m6-8-2-translate-doko",
      "Where is the station?",
      "えきは どこですか",
      ["えき", "は", "どこ", "です", "か", "に", "が"],
      ["えき", "は", "どこ", "です", "か"],
    ),
    // ── Review tail ──
    speaking("ja-m6-8-2-rev-speak-1", M6_8_2_REVIEW[0].kana, M6_8_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m6-8-2-rev-lc",
      audioText: M6_8_2_REVIEW[1].kana,
      correctMeaningEn: M6_8_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_8_2_REVIEW[2].meaningEn,
        M6_8_2_REVIEW[3].meaningEn,
        M6_8_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m6-8-2-rev-mcq-2", M6_8_2_REVIEW[3], PRIOR_POOL),
    reviewMatchPairs("ja-m6-8-2-rev", M6_8_2_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m6-8-2-info-end",
      "You can now ask a stranger for directions in Shibuya",
      "Opener (えきは どこですか) + comprehension + all three particles mastered. You can find anything in Japan.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_8_2.steps);
assertNoConsecutiveSame(M6_8_2.steps);

// ---------------------------------------------------------------------------
// Passive-card lint (2026-05-22) — see _stepAssertions.ts for rules.
// ---------------------------------------------------------------------------
for (const lesson of [M6_1_1, M6_1_2, M6_2_1, M6_2_2, M6_3_1, M6_3_2, M6_4_1, M6_4_2, M6_5_1, M6_5_2, M6_6_1, M6_6_2, M6_STORY, M6_7_1, M6_7_2, M6_8_1, M6_8_2]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
