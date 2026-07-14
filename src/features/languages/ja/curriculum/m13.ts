/**
 * M13 — Months + Frequency + から (because).
 *
 * M13 introduces:
 *   - Months: いちがつ through じゅうにがつ (compound number + がつ)
 *   - Frequency spectrum: いつも → よく → ときどき → あまり〜ない → ぜんぜん〜ない
 *   - から (time): "くじから ごじまで" (from 9 to 5)
 *   - から (because): "あめだから、いきません" (it's raining so I won't go)
 *   - まで (until): pairs with から for time ranges
 *
 * NOTE: から has TWO meanings now:
 *   - Already taught in M5 as "from" (origin: にほんから きました)
 *   - Taught here as both time-from ("くじから") AND reason ("あめだから").
 *   Lessons clearly differentiate the two uses.
 *
 * Vocab (~30 atoms):
 *   - Months: いちがつ through じゅうにがつ
 *   - Routine verbs: おふろにはいる, シャワーをあびる, はをみがく,
 *     かおをあらう, ふくをきる, でんきをつける/けす
 *   - Daily places: かいしゃ (company), きっさてん (cafe)
 *
 * しちがつ (not なながつ) — month 7 uses on-reading.
 * しがつ (not よんがつ) — month 4 uses on-reading.
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps.
 *
 * ID scheme: ja-m13-{n}-{sub} e.g. ja-m13-1-1, ja-m13-1-2
 * Export names: M13_1_1, M13_1_2, M13_2_1, M13_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m13-1, etc.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  cloze,
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
const M13_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_KARA_TIME = grammarRule({
  id: "ja-m13-rule-kara-time",
  grammarPointId: "kara-time",
  title: "から...まで — from...until (time ranges)",
  rule:
    "から after a time word means 'from (that time).' まで means 'until.' Together: Xから Yまで = 'from X to Y.' You already know から as origin (にほんから). Time-から works the same way — the starting point of a time span.",
  examples: [
    {
      ja: "くじから ごじまで はたらきます。",
      romaji: "kuji kara goji made hatarakimasu.",
      en: "I work from 9 to 5.",
    },
    {
      ja: "げつようびから きんようびまで がっこうに いきます。",
      romaji: "getsuyoubi kara kinyoubi made gakkou ni ikimasu.",
      en: "I go to school from Monday to Friday.",
    },
    {
      ja: "さんがつから ろくがつまで あついです。",
      romaji: "sangatsu kara rokugatsu made atsui desu.",
      en: "It's hot from March to June.",
    },
  ],
  antiPattern: {
    ja: "くじまで ごじから はたらきます。",
    romaji: "kuji made goji kara hatarakimasu.",
    en: "(broken — から comes first, まで second)",
    why: "The starting point (から) always comes before the ending point (まで). Think: 'FROM X UNTIL Y.'",
  },
  cultureNote:
    "Japanese schedules are often given as から...まで ranges. Train timetables, business hours, and school schedules all use this pattern.",
});

const RULE_KARA_BECAUSE = grammarRule({
  id: "ja-m13-rule-kara-because",
  grammarPointId: "kara-because",
  title: "から — because (reason connector)",
  rule:
    "から after a sentence or noun+だ means 'because / so.' The reason comes FIRST, then から, then the result. With nouns/な-adjectives: 〜だから. With verbs/い-adjectives: plain form + から. At N5 level, we mostly use noun + だから in polite speech.",
  examples: [
    {
      ja: "あめだから、いきません。",
      romaji: "ame da kara, ikimasen.",
      en: "Because it's raining, I won't go.",
    },
    {
      ja: "やすみだから、うちに います。",
      romaji: "yasumi da kara, uchi ni imasu.",
      en: "Because it's a day off, I'm at home.",
    },
    {
      ja: "さむいから、コーヒーを のみます。",
      romaji: "samui kara, koohii o nomimasu.",
      en: "Because it's cold, I'll drink coffee.",
    },
  ],
  antiPattern: {
    ja: "いきません、あめだから。",
    romaji: "ikimasen, ame da kara.",
    en: "(unnatural — reason goes BEFORE から, not after)",
    why: "In Japanese, the reason clause comes first: [reason]だから、[result]. English often puts the result first ('I won't go because...'), but Japanese reverses this.",
  },
  cultureNote:
    "から as 'because' is one of the most frequently used connectors in daily Japanese. Genki introduces it in Lesson 6. Don't confuse it with から = 'from' (origin/time) — context and だ before から signal the 'because' meaning.",
});

const RULE_FREQUENCY = grammarRule({
  id: "ja-m13-rule-frequency",
  grammarPointId: "frequency-adverbs",
  title: "Frequency spectrum — いつも → よく → ときどき → あまり → ぜんぜん",
  rule:
    "Five frequency adverbs from 'always' to 'never.' いつも (always, ~100%), よく (often, ~70%), ときどき (sometimes, ~40%). IMPORTANT: あまり and ぜんぜん REQUIRE a negative verb. あまり〜ません = not often. ぜんぜん〜ません = not at all.",
  examples: [
    {
      ja: "いつも コーヒーを のみます。",
      romaji: "itsumo koohii o nomimasu.",
      en: "I always drink coffee.",
    },
    {
      ja: "ときどき きっさてんに いきます。",
      romaji: "tokidoki kissaten ni ikimasu.",
      en: "I sometimes go to the cafe.",
    },
    {
      ja: "あまり テレビを みません。",
      romaji: "amari terebi o mimasen.",
      en: "I don't watch TV very often.",
    },
  ],
  antiPattern: {
    ja: "ぜんぜん たべます。",
    romaji: "zenzen tabemasu.",
    en: "(broken — ぜんぜん requires negative)",
    why: "ぜんぜん means 'not at all' — it must pair with a negative predicate like ません or ない. ぜんぜん + positive verb is ungrammatical in standard Japanese.",
  },
  cultureNote:
    "あまり and ぜんぜん are 'negative polarity items' — they cannot stand alone with a positive verb. This is one of the key grammar traps at N5.",
});

// ═══════════════════════════════════════════════════════════════════════
// M13_1_1 — "Months 1–6"
//   (いちがつ, にがつ, さんがつ, しがつ, ごがつ, ろくがつ)
// ═══════════════════════════════════════════════════════════════════════

const M13_1_1_REVIEW = pickReviewAtoms("ja-m13-1-1-rev", M13_REVIEW_POOL, 6);

export const M13_1_1: LessonContent = {
  id: "ja-m13-1-1",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "Months 1–6",
  description:
    "Learn the first six months of the year — いちがつ through ろくがつ. Watch for しがつ (not よんがつ)!",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-1-1-info-open",
      "January through June",
      "Month names are easy — just add がつ to the number. But two months break the pattern: しがつ (April) and しちがつ (July). Let's start with January to June.",
    ),
    // ── いちがつ (January) — build intro ──
    build(
      "ja-m13-1-1-build-ichigatsu",
      "Build: January",
      "いちがつ",
      ["さんがつ", "しがつ", "にがつ", "いちがつ"],
      ["いちがつ"],
    ),
    listeningCompSentence({
      id: "ja-m13-1-1-lc-ichigatsu",
      audioText: "いちがつ",
      correctMeaningEn: "January",
      distractorsEn: ["February", "March", "December"],
    }),
    // ── にがつ (February) ──
    build(
      "ja-m13-1-1-build-nigatsu",
      "Build: February",
      "にがつ",
      ["いちがつ", "ごがつ", "さんがつ", "にがつ"],
      ["にがつ"],
    ),
    speaking("ja-m13-1-1-speak-nigatsu", "にがつ", "February"),
    // ── さんがつ (March) ──
    build(
      "ja-m13-1-1-build-sangatsu",
      "Build: March",
      "さんがつ",
      ["にがつ", "いちがつ", "ろくがつ", "さんがつ"],
      ["さんがつ"],
    ),
    listeningCompSentence({
      id: "ja-m13-1-1-lc-sangatsu",
      audioText: "さんがつ",
      correctMeaningEn: "March",
      distractorsEn: ["January", "June", "September"],
    }),
    // ── しがつ (April — NOT よんがつ!) ──
    build(
      "ja-m13-1-1-build-shigatsu",
      "Build: April (careful — it's NOT よんがつ)",
      "しがつ",
      ["ごがつ", "しがつ", "よんがつ", "ろくがつ"],
      ["しがつ"],
    ),
    sentenceMcq({
      id: "ja-m13-1-1-mcq-shigatsu",
      prompt: "Which is the correct word for April?",
      correctKana: "しがつ",
      distractorsKana: ["よんがつ", "しちがつ", "よがつ"],
      explanation: "April uses the on-reading し, not the kun-reading よん. しがつ is the only correct form.",
    }),
    // ── ごがつ (May) ──
    build(
      "ja-m13-1-1-build-gogatsu",
      "Build: May",
      "ごがつ",
      ["にがつ", "ごがつ", "ろくがつ", "しがつ"],
      ["ごがつ"],
    ),
    speaking("ja-m13-1-1-speak-gogatsu", "ごがつ", "May"),
    // ── ろくがつ (June) ──
    build(
      "ja-m13-1-1-build-rokugatsu",
      "Build: June",
      "ろくがつ",
      ["しちがつ", "さんがつ", "ごがつ", "ろくがつ"],
      ["ろくがつ"],
    ),
    listeningCompSentence({
      id: "ja-m13-1-1-lc-rokugatsu",
      audioText: "ろくがつ",
      correctMeaningEn: "June",
      distractorsEn: ["March", "September", "December"],
    }),
    // ── Month ordering drill ──
    sentenceMcq({
      id: "ja-m13-1-1-mcq-order",
      prompt: "Which month comes right after さんがつ?",
      correctKana: "しがつ",
      distractorsKana: ["にがつ", "ごがつ", "ろくがつ"],
      explanation: "さんがつ is March. The next month is April = しがつ.",
    }),
    selfExplain({
      id: "ja-m13-1-1-self-explain",
      anchorLabel: "You learned しがつ for April",
      anchorAudioText: "しがつ",
      question: "Why is April しがつ and not よんがつ?",
      rule: { text: "Months use on-readings of numbers: し (4), not よん." },
      surface: { text: "よんがつ is the spoken form; しがつ is the written form." },
      distractor: { text: "しがつ is only used in formal situations; よんがつ is for casual speech." },
      ruleExplanation:
        "Month names always use on-readings of the numbers. 4 = し (on-reading), not よん (kun-reading). The same applies to 7 = しち and 9 = く in month names.",
    }),
    speaking(
      "ja-m13-1-1-speak-shigatsu",
      "しがつ",
      "April",
    ),
    // ── Review tail ──
    vocabMcq("ja-m13-1-1-rev-mcq-1", M13_1_1_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-1-1-rev-lc-1",
      // Sentence-level review of よん (M5) — 2026-07-12 listening backfill.
      audioText: "これは よんじゅうえんです",
      correctMeaningEn: "It's 40 yen.",
      distractorsEn: [
        "It's 14 yen.",
        "It's 20 yen.",
        "It's 100 yen.",
      ],
    }),
    speaking("ja-m13-1-1-rev-speak-1", M13_1_1_REVIEW[2].kana, M13_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-1-1-rev", M13_1_1_REVIEW),
    infoStep(
      "ja-m13-1-1-info-end",
      "You can now name January through June in Japanese",
      "Six months down — いちがつ, にがつ, さんがつ, しがつ, ごがつ, ろくがつ. Remember: April is しがつ, not よんがつ!",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_1_1.steps);
assertNoConsecutiveSame(M13_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_1_2 — "Months 1–6" drill
// ═══════════════════════════════════════════════════════════════════════

const M13_1_2_REVIEW = pickReviewAtoms("ja-m13-1-2-rev", M13_REVIEW_POOL, 6);

export const M13_1_2: LessonContent = {
  id: "ja-m13-1-2",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "Months 1–6 drill",
  description:
    "Drill all six months in sentences — when things happen, what month it is now.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-1-2-info-open",
      "Months in action",
      "Let's use those month names in real sentences — birthdays, travel plans, seasons.",
    ),
    // ── Month+particle drills ──
    build(
      "ja-m13-1-2-build-birthday",
      "Say: My birthday is in March.",
      "たんじょうびは さんがつです",
      ["は", "しがつ", "さんがつ", "たんじょうび", "ごがつ", "です"],
      ["たんじょうび", "は", "さんがつ", "です"],
    ),
    listeningCompSentence({
      id: "ja-m13-1-2-lc-ichigatsu-sent",
      audioText: "いちがつは さむいです",
      correctMeaningEn: "January is cold.",
      distractorsEn: [
        "February is cold.",
        "January is hot.",
        "June is cold.",
      ],
    }),
    build(
      "ja-m13-1-2-build-nigatsu-nihon",
      "Say: I'll go to Japan in February.",
      "にがつに にほんに いきます",
      ["にほん", "にがつ", "に", "に", "いきます", "は", "さんがつ"],
      ["にがつ", "に", "にほん", "に", "いきます"],
    ),
    sentenceMcq({
      id: "ja-m13-1-2-mcq-gogatsu",
      prompt: "Which sentence means 'May is warm.'?",
      correctKana: "ごがつは あたたかいです。",
      distractorsKana: [
        "ろくがつは あたたかいです。",
        "ごがつは さむいです。",
        "しがつは あついです。",
      ],
      explanation: "ごがつ = May. あたたかい = warm.",
    }),
    build(
      "ja-m13-1-2-build-rokugatsu-sent",
      "Say: It rains a lot in June.",
      "ろくがつは あめが おおいです",
      ["が", "です", "あめ", "さんがつ", "すくない", "は", "おおい", "ろくがつ"],
      ["ろくがつ", "は", "あめ", "が", "おおい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m13-1-2-lb-shigatsu-sent",
      target: "しがつに がっこうが はじまります",
      tiles: ["ろくがつ", "が", "がっこう", "に", "おわります", "しがつ", "はじまります"],
      correctOrder: ["しがつ", "に", "がっこう", "が", "はじまります"],
      promptEn: "Hear it, build it: 'School starts in April.'",
    }),
    build(
      "ja-m13-1-2-build-sangatsu-sakura",
      "Say: In March, cherry blossoms are beautiful.",
      "さんがつは さくらが きれいです",
      ["さくら", "さんがつ", "は", "が", "きれい", "です", "に"],
      ["さんがつ", "は", "さくら", "が", "きれい", "です"],
    ),
    speaking(
      "ja-m13-1-2-speak-gogatsu-sent",
      "ごがつは あたたかいです",
      "May is warm.",
    ),
    sentenceMcq({
      id: "ja-m13-1-2-mcq-shigatsu-school",
      prompt: "Which sentence means 'School starts in April.'?",
      correctKana: "しがつに がっこうが はじまります。",
      distractorsKana: [
        "さんがつに がっこうが はじまります。",
        "しがつに がっこうが おわります。",
        "ごがつに がっこうが はじまります。",
      ],
      explanation: "しがつ = April. はじまります = starts.",
    }),
    cloze(
      "ja-m13-1-2-cloze-ni-2",
      "いちがつ",
      " おしょうがつが あります。",
      "に",
      ["に", "は", "で", "を"],
      "New Year's is in January.",
      "いちがつに おしょうがつが あります。",
      "に marks the time point — 'in January.'",
    ),
    translateStep({
      id: "ja-m13-1-2-translate",
      promptEn: "My birthday is in June.",
      acceptedAnswers: [
        "たんじょうびは ろくがつです",
        "たんじょうびは ろくがつです。",
        "わたしの たんじょうびは ろくがつです",
        "わたしの たんじょうびは ろくがつです。",
      ],
      audioText: "たんじょうびは ろくがつです",
    }),
    selfExplain({
      id: "ja-m13-1-2-self-explain",
      anchorLabel: "You wrote: にがつに にほんに いきます",
      anchorAudioText: "にがつに にほんに いきます",
      question: "Why does に appear twice in this sentence?",
      rule: { text: "The first に marks the time ('in February'), the second marks the destination ('to Japan')." },
      surface: { text: "に is always doubled when talking about travel." },
      distractor: { text: "The first に is optional — you could drop it and the meaning would stay the same." },
      ruleExplanation:
        "に has multiple uses: time-に ('in February') and destination-に ('to Japan'). Both are needed here — they serve different grammatical roles.",
    }),
    speaking(
      "ja-m13-1-2-speak-birthday",
      "たんじょうびは さんがつです",
      "My birthday is in March.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m13-1-2-rev-mcq-1", M13_1_2_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-1-2-rev-lc-1",
      // Sentence-level review of どれ (M4) — 2026-07-12 listening backfill.
      audioText: "あなたの かばんは どれですか",
      correctMeaningEn: "Which one is your bag?",
      distractorsEn: [
        "Whose bag is this?",
        "Where is your bag?",
        "Which one is your umbrella?",
      ],
    }),
    speaking("ja-m13-1-2-rev-speak-1", M13_1_2_REVIEW[2].kana, M13_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-1-2-rev", M13_1_2_REVIEW),
    infoStep(
      "ja-m13-1-2-info-end",
      "You can now talk about events by month",
      "Birthdays, school schedules, weather — you're using months in real sentences with particles.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_1_2.steps);
assertAnswerRotation(M13_1_2.steps, 1);
assertNoConsecutiveSame(M13_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_2_1 — "Months 7–12"
//   (しちがつ, はちがつ, くがつ, じゅうがつ, じゅういちがつ, じゅうにがつ)
// ═══════════════════════════════════════════════════════════════════════

const M13_2_1_REVIEW = pickReviewAtoms("ja-m13-2-1-rev", M13_REVIEW_POOL, 6);

export const M13_2_1: LessonContent = {
  id: "ja-m13-2-1",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "Months 7–12",
  description:
    "The second half of the year — しちがつ through じゅうにがつ. Watch for しちがつ (not なながつ) and くがつ (not きゅうがつ)!",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-2-1-info-open",
      "July through December",
      "Six more months. Two more traps: July is しちがつ (not なながつ) and September is くがつ (not きゅうがつ). The on-readings strike again.",
    ),
    // ── しちがつ (July) — build intro ──
    build(
      "ja-m13-2-1-build-shichigatsu",
      "Build: July (careful — NOT なながつ)",
      "しちがつ",
      ["なながつ", "はちがつ", "ろくがつ", "しちがつ"],
      ["しちがつ"],
    ),
    listeningCompSentence({
      id: "ja-m13-2-1-lc-shichigatsu",
      audioText: "しちがつ",
      correctMeaningEn: "July",
      distractorsEn: ["June", "August", "January"],
    }),
    // ── はちがつ (August) ──
    build(
      "ja-m13-2-1-build-hachigatsu",
      "Build: August",
      "はちがつ",
      ["くがつ", "しちがつ", "ろくがつ", "はちがつ"],
      ["はちがつ"],
    ),
    speaking("ja-m13-2-1-speak-hachigatsu", "はちがつ", "August"),
    // ── くがつ (September — NOT きゅうがつ) ──
    build(
      "ja-m13-2-1-build-kugatsu",
      "Build: September (NOT きゅうがつ)",
      "くがつ",
      ["はちがつ", "くがつ", "じゅうがつ", "きゅうがつ"],
      ["くがつ"],
    ),
    sentenceMcq({
      id: "ja-m13-2-1-mcq-kugatsu",
      prompt: "Which is the correct word for September?",
      correctKana: "くがつ",
      distractorsKana: ["きゅうがつ", "くうがつ", "きゅがつ"],
      explanation: "September uses the on-reading く, not きゅう. くがつ is the only correct form.",
    }),
    // ── じゅうがつ (October) ──
    build(
      "ja-m13-2-1-build-juugatsu",
      "Build: October",
      "じゅうがつ",
      ["くがつ", "はちがつ", "じゅういちがつ", "じゅうがつ"],
      ["じゅうがつ"],
    ),
    listeningCompSentence({
      id: "ja-m13-2-1-lc-juugatsu",
      audioText: "じゅうがつ",
      correctMeaningEn: "October",
      distractorsEn: ["November", "September", "December"],
    }),
    // ── じゅういちがつ (November) ──
    build(
      "ja-m13-2-1-build-juuichigatsu",
      "Build: November",
      "じゅういちがつ",
      ["じゅうにがつ", "じゅうがつ", "じゅういちがつ", "いちがつ"],
      ["じゅういちがつ"],
    ),
    speaking("ja-m13-2-1-speak-juuichigatsu", "じゅういちがつ", "November"),
    // ── じゅうにがつ (December) ──
    build(
      "ja-m13-2-1-build-juunigatsu",
      "Build: December",
      "じゅうにがつ",
      ["じゅういちがつ", "じゅうがつ", "じゅうにがつ", "にがつ"],
      ["じゅうにがつ"],
    ),
    listeningCompSentence({
      id: "ja-m13-2-1-lc-juunigatsu",
      audioText: "じゅうにがつ",
      correctMeaningEn: "December",
      distractorsEn: ["February", "November", "October"],
    }),
    // ── Month ordering + discrimination ──
    sentenceMcq({
      id: "ja-m13-2-1-mcq-order",
      prompt: "Which month comes right before くがつ?",
      correctKana: "はちがつ",
      distractorsKana: ["しちがつ", "じゅうがつ", "ろくがつ"],
      explanation: "くがつ is September. The month before it is August = はちがつ.",
    }),
    selfExplain({
      id: "ja-m13-2-1-self-explain",
      anchorLabel: "You learned しちがつ for July",
      anchorAudioText: "しちがつ",
      question: "Why is July しちがつ and not なながつ?",
      rule: { text: "Month names use on-readings: しち (7), not なな. Same pattern as しがつ (4) and くがつ (9)." },
      surface: { text: "なながつ is the old-fashioned form that nobody uses anymore." },
      distractor: { text: "しちがつ is only for formal writing; なながつ is for spoken Japanese." },
      ruleExplanation:
        "All twelve months use the on-reading of the number + がつ. Three are tricky: し (4, not よん), しち (7, not なな), く (9, not きゅう).",
    }),
    speaking(
      "ja-m13-2-1-speak-kugatsu",
      "くがつ",
      "September",
    ),
    // ── Review tail ──
    vocabMcq("ja-m13-2-1-rev-mcq-1", M13_2_1_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-2-1-rev-lc-1",
      // Sentence-level review of だれ (M4) — 2026-07-12 listening backfill.
      audioText: "あれは だれの かさですか",
      correctMeaningEn: "Whose umbrella is that over there?",
      distractorsEn: [
        "Whose bag is that over there?",
        "Where is my umbrella?",
        "That is my umbrella.",
      ],
    }),
    speaking("ja-m13-2-1-rev-speak-1", M13_2_1_REVIEW[2].kana, M13_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-2-1-rev", M13_2_1_REVIEW),
    infoStep(
      "ja-m13-2-1-info-end",
      "You can now name all twelve months of the year",
      "しちがつ, はちがつ, くがつ, じゅうがつ, じゅういちがつ, じゅうにがつ — the full calendar is yours.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_2_1.steps);
assertNoConsecutiveSame(M13_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_2_2 — "Months 7–12" drill
// ═══════════════════════════════════════════════════════════════════════

const M13_2_2_REVIEW = pickReviewAtoms("ja-m13-2-2-rev", M13_REVIEW_POOL, 6);

export const M13_2_2: LessonContent = {
  id: "ja-m13-2-2",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "Months 7–12 drill",
  description:
    "Use the second half of the year in real sentences — seasons, holidays, travel plans.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-2-2-info-open",
      "Months in sentences",
      "Let's put July through December to work in sentences about seasons, vacations, and events.",
    ),
    // ── Month sentence drills ──
    build(
      "ja-m13-2-2-build-natsu",
      "Say: August is hot.",
      "はちがつは あついです",
      ["あつい", "です", "はちがつ", "しちがつ", "さむい", "は"],
      ["はちがつ", "は", "あつい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m13-2-2-lc-juunigatsu-sent",
      audioText: "じゅうにがつは さむいです",
      correctMeaningEn: "December is cold.",
      distractorsEn: [
        "November is cold.",
        "December is hot.",
        "February is cold.",
      ],
    }),
    build(
      "ja-m13-2-2-build-kugatsu-test",
      "Say: There's a test in September.",
      "くがつに テストが あります",
      ["テスト", "くがつ", "に", "が", "あります", "くじ", "は"],
      ["くがつ", "に", "テスト", "が", "あります"],
    ),
    sentenceMcq({
      id: "ja-m13-2-2-mcq-juuichigatsu",
      prompt: "Which sentence means 'November is cool.'?",
      correctKana: "じゅういちがつは すずしいです。",
      distractorsKana: [
        "じゅうがつは すずしいです。",
        "じゅういちがつは あたたかいです。",
        "くがつは すずしいです。",
      ],
      explanation: "じゅういちがつ = November. すずしい = cool.",
    }),
    build(
      "ja-m13-2-2-build-shichigatsu-sent",
      "Say: Summer vacation is in July.",
      "なつやすみは しちがつです",
      ["は", "しちがつ", "はちがつ", "なつやすみ", "ろくがつ", "です"],
      ["なつやすみ", "は", "しちがつ", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m13-2-2-lb-juugatsu",
      target: "じゅうがつは すずしいです",
      tiles: ["すずしい", "は", "じゅういちがつ", "じゅうがつ", "あつい", "です"],
      correctOrder: ["じゅうがつ", "は", "すずしい", "です"],
      promptEn: "Hear it, build it: 'October is cool.'",
    }),
    build(
      "ja-m13-2-2-build-nigatsu-samui",
      "Say: February is cold.",
      "にがつは さむいです",
      ["さむい", "にがつ", "は", "です", "あつい", "に"],
      ["にがつ", "は", "さむい", "です"],
    ),
    speaking(
      "ja-m13-2-2-speak-hachigatsu-sent",
      "はちがつは あついです",
      "August is hot.",
    ),
    sentenceMcq({
      id: "ja-m13-2-2-mcq-all-months",
      prompt: "Which month is correct for 'September'?",
      correctKana: "くがつ",
      distractorsKana: ["きゅうがつ", "しちがつ", "じゅうがつ"],
      explanation: "September = くがつ. The on-reading of 9 is く, not きゅう.",
    }),
    // ── ひとつき (one month, duration) — context intro ──
    build(
      "ja-m13-2-2-build-hitotsuki",
      "New word: ひとつき = one month (a length of time — not the month of January). Say: I'll be in Japan for one month.",
      "ひとつき にほんに います",
      ["にほん", "ひとつき", "に", "います", "いちがつ", "いきます"],
      ["ひとつき", "にほん", "に", "います"],
    ),
    sentenceMcq({
      id: "ja-m13-2-2-mcq-hitotsuki",
      prompt: "Which word means 'one month long' (a duration — not the calendar month of January)?",
      correctKana: "ひとつき",
      distractorsKana: ["いちがつ", "ひとつ", "いちじ"],
      explanation: "ひとつき = one month of time. いちがつ = January. ひとつ = one (thing). いちじ = 1 o'clock.",
    }),
    cloze(
      "ja-m13-2-2-cloze-ni-2",
      "じゅうにがつ",
      " クリスマスが あります。",
      "に",
      ["に", "は", "で", "を"],
      "Christmas is in December.",
      "じゅうにがつに クリスマスが あります。",
      "に marks the time point — 'in December.'",
    ),
    translateStep({
      id: "ja-m13-2-2-translate",
      promptEn: "Summer vacation is in August.",
      acceptedAnswers: [
        "なつやすみは はちがつです",
        "なつやすみは はちがつです。",
      ],
      audioText: "なつやすみは はちがつです",
    }),
    selfExplain({
      id: "ja-m13-2-2-self-explain",
      anchorLabel: "You used くがつ for September",
      anchorAudioText: "くがつ",
      question: "What is the pattern for the three 'irregular' month names?",
      rule: { text: "しがつ (4), しちがつ (7), くがつ (9) — all use on-readings instead of the common counting forms." },
      surface: { text: "They are irregular because they are unlucky numbers in Japanese culture." },
      distractor: { text: "Only しがつ is irregular — しちがつ and くがつ follow the normal pattern." },
      ruleExplanation:
        "Three months use on-readings that differ from counting: 4=し (not よん), 7=しち (not なな), 9=く (not きゅう). All other months use the same reading as counting.",
    }),
    speaking(
      "ja-m13-2-2-speak-kugatsu-sent",
      "くがつは すずしいです",
      "September is cool.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m13-2-2-rev-mcq-1", M13_2_2_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-2-2-rev-lc-1",
      // Sentence-level review of ホテル (M11) — 2026-07-12 listening backfill.
      audioText: "ホテルは えきから ちかいです",
      correctMeaningEn: "The hotel is near the station.",
      distractorsEn: [
        "The hotel is far from the station.",
        "The bank is near the station.",
        "The hotel is near the school.",
      ],
    }),
    speaking("ja-m13-2-2-rev-speak-1", M13_2_2_REVIEW[2].kana, M13_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-2-2-rev", M13_2_2_REVIEW),
    infoStep(
      "ja-m13-2-2-info-end",
      "You can now describe seasons and events using all twelve months",
      "Summer, winter, vacations, holidays — you're placing events on the calendar in Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_2_2.steps);
assertAnswerRotation(M13_2_2.steps, 1);
assertNoConsecutiveSame(M13_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_3_1 — "From...until" (から...まで time ranges)
// ═══════════════════════════════════════════════════════════════════════

const M13_3_1_REVIEW = pickReviewAtoms("ja-m13-3-1-rev", M13_REVIEW_POOL, 6);

export const M13_3_1: LessonContent = {
  id: "ja-m13-3-1",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "From...until",
  description:
    "Use から and まで to describe time ranges — work hours, school days, seasons.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-3-1-info-open",
      "Time ranges with から...まで",
      "You already know から means 'from' (にほんから). Now learn how it teams up with まで to mark time spans: 'from 9 until 5.'",
    ),
    RULE_KARA_TIME,
    // ── から/まで in time sentences ──
    cloze(
      "ja-m13-3-1-cloze-kara-1",
      "くじ",
      " ごじまで はたらきます。",
      "から",
      ["から", "まで", "に", "は"],
      "I work from 9 to 5.",
      "くじから ごじまで はたらきます。",
      "から marks the starting time — 'from 9.'",
    ),
    listeningCompSentence({
      id: "ja-m13-3-1-lc-kara-made",
      audioText: "はちじから よじまで はたらきます",
      correctMeaningEn: "I work from 8 to 4.",
      distractorsEn: [
        "I work from 4 to 8.",
        "I study from 8 to 4.",
        "I work until 8.",
      ],
    }),
    cloze(
      "ja-m13-3-1-cloze-made-1",
      "にじから よじ",
      " としょかんに います。",
      "まで",
      ["まで", "から", "に", "は"],
      "I'm at the library from 2 to 4.",
      "にじから よじまで としょかんに います。",
      "まで marks the ending time — 'until 4.'",
    ),
    build(
      "ja-m13-3-1-build-getsuyoubi",
      "Say: I go to school from Monday to Friday.",
      "げつようびから きんようびまで がっこうに いきます",
      ["に", "から", "いきます", "まで", "きんようび", "げつようび", "がっこう", "かいしゃ"],
      ["げつようび", "から", "きんようび", "まで", "がっこう", "に", "いきます"],
    ),
    sentenceMcq({
      id: "ja-m13-3-1-mcq-kara-made",
      prompt: "Which sentence means 'I study from 7 to 10.'?",
      correctKana: "しちじから じゅうじまで べんきょうします。",
      distractorsKana: [
        "じゅうじから しちじまで べんきょうします。",
        "しちじに じゅうじまで べんきょうします。",
        "しちじから じゅうじに べんきょうします。",
      ],
      explanation: "から marks the start (7), まで marks the end (10). Order matters!",
    }),
    cloze(
      "ja-m13-3-1-cloze-kara-2",
      "さんがつ",
      " ごがつまで あたたかいです。",
      "から",
      ["から", "まで", "に", "は"],
      "It's warm from March to May.",
      "さんがつから ごがつまで あたたかいです。",
      "から marks the starting month.",
    ),
    listeningBuildSentence({
      id: "ja-m13-3-1-lb-kara-made",
      target: "はちじから さんじまで べんきょうします",
      tiles: ["さんじ", "べんきょうします", "はちじ", "に", "から", "まで", "はたらきます"],
      correctOrder: ["はちじ", "から", "さんじ", "まで", "べんきょうします"],
      promptEn: "Hear it, build it: 'I study from 8 to 3.'",
    }),
    cloze(
      "ja-m13-3-1-cloze-made-2",
      "ろくがつから くがつ",
      " あついです。",
      "まで",
      ["まで", "から", "に", "は"],
      "It's hot from June to September.",
      "ろくがつから くがつまで あついです。",
      "まで marks the ending month.",
    ),
    speaking(
      "ja-m13-3-1-speak-kara-made",
      "くじから さんじまで がっこうに います",
      "I'm at school from 9 to 3.",
    ),
    sentenceMcq({
      id: "ja-m13-3-1-mcq-month-range",
      prompt: "Which sentence means 'It's warm from March to May.'?",
      correctKana: "さんがつから ごがつまで あたたかいです。",
      distractorsKana: [
        "さんがつまで ごがつから あたたかいです。",
        "さんがつに ごがつまで あたたかいです。",
        "さんがつから ごがつに あたたかいです。",
      ],
      explanation: "から = from (March), まで = until (May). Both needed, in that order.",
    }),
    selfExplain({
      id: "ja-m13-3-1-self-explain",
      anchorLabel: "You've used から...まで for time ranges",
      anchorAudioText: "くじから ごじまで はたらきます",
      question: "How is this から different from にほんから きました?",
      rule: { text: "Same word, similar meaning — 'from.' にほんから = from Japan (origin). くじから = from 9 o'clock (starting point). Both mark a starting point." },
      surface: { text: "They are completely different words that happen to sound the same." },
      distractor: { text: "Time-から is a different particle than origin-から — they just happen to have the same kana." },
      ruleExplanation:
        "から always means 'from' — the starting point. Whether it's a place (にほんから = from Japan) or a time (くじから = from 9), the core meaning is the same.",
    }),
    translateStep({
      id: "ja-m13-3-1-translate",
      promptEn: "I study from 8 to 3.",
      acceptedAnswers: [
        "はちじから さんじまで べんきょうします",
        "はちじから さんじまで べんきょうします。",
      ],
      audioText: "はちじから さんじまで べんきょうします",
    }),
    // ── Review tail ──
    vocabMcq("ja-m13-3-1-rev-mcq-1", M13_3_1_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-3-1-rev-lc-1",
      // Sentence-level review of じしょ (M4) — 2026-07-12 listening backfill.
      audioText: "これは わたしの じしょです",
      correctMeaningEn: "This is my dictionary.",
      distractorsEn: [
        "This is my notebook.",
        "This is your dictionary.",
        "Whose dictionary is this?",
      ],
    }),
    speaking("ja-m13-3-1-rev-speak-1", M13_3_1_REVIEW[2].kana, M13_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-3-1-rev", M13_3_1_REVIEW),
    infoStep(
      "ja-m13-3-1-info-end",
      "You can now describe time ranges — schedules, seasons, work hours",
      "から...まで gives you precise control over Japanese time expressions. From 9 to 5, from March to May — you've got it.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_3_1.steps);
assertAnswerRotation(M13_3_1.steps, 1);
assertNoConsecutiveSame(M13_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_3_2 — "From...until" drill
// ═══════════════════════════════════════════════════════════════════════

const M13_3_2_REVIEW = pickReviewAtoms("ja-m13-3-2-rev", M13_REVIEW_POOL, 6);

export const M13_3_2: LessonContent = {
  id: "ja-m13-3-2",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "From...until drill",
  description:
    "More practice with から...まで — mixing time-of-day and month ranges.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-3-2-info-open",
      "Mixing time ranges",
      "Let's combine から...まで with months, days, and hours — plus some new daily-life places.",
    ),
    // ── かいしゃ (company) intro ──
    build(
      "ja-m13-3-2-build-kaisha",
      "Pick the Japanese word for: Company / Office",
      "かいしゃ",
      ["きっさてん", "がっこう", "かいしゃ", "こうえん"],
      ["かいしゃ"],
    ),
    listeningCompSentence({
      id: "ja-m13-3-2-lc-kaisha",
      audioText: "ちちは かいしゃに います",
      correctMeaningEn: "My father is at the office.",
      distractorsEn: [
        "My father is at school.",
        "My mother is at the office.",
        "My father goes to the office.",
      ],
    }),
    // ── きっさてん (cafe) intro ──
    build(
      "ja-m13-3-2-build-kissaten",
      "Pick the Japanese word for: Cafe",
      "きっさてん",
      ["かいしゃ", "きっさてん", "こうえん", "みせ"],
      ["きっさてん"],
    ),
    speaking("ja-m13-3-2-speak-kissaten", "きっさてん", "Cafe"),
    // ── じゅぎょう (class / lesson) — context intro ──
    build(
      "ja-m13-3-2-build-jugyou",
      "New word: じゅぎょう = class / lesson. Say: Class is from 9 to 3.",
      "じゅぎょうは くじから さんじまでです",
      ["くじ", "じゅぎょう", "は", "から", "さんじ", "まで", "です", "かいしゃ"],
      ["じゅぎょう", "は", "くじ", "から", "さんじ", "まで", "です"],
    ),
    listeningCompSentence({
      id: "ja-m13-3-2-lc-jugyou",
      audioText: "じゅぎょうは じゅうじからです",
      correctMeaningEn: "Class is from 10 o'clock.",
      distractorsEn: [
        "Class is until 10 o'clock.",
        "Work is from 10 o'clock.",
        "Class is at the school.",
      ],
    }),
    // ── から...まで with new vocab ──
    cloze(
      "ja-m13-3-2-cloze-kara-1",
      "くじ",
      " ろくじまで かいしゃに います。",
      "から",
      ["から", "まで", "に", "で"],
      "I'm at the office from 9 to 6.",
      "くじから ろくじまで かいしゃに います。",
      "から marks the starting time.",
    ),
    build(
      "ja-m13-3-2-build-kissaten-sent",
      "Say: I'm at the cafe from 3 to 5.",
      "さんじから ごじまで きっさてんに います",
      ["かいしゃ", "きっさてん", "まで", "さんじ", "から", "います", "に", "ごじ"],
      ["さんじ", "から", "ごじ", "まで", "きっさてん", "に", "います"],
    ),
    cloze(
      "ja-m13-3-2-cloze-made-1",
      "げつようびから きんようび",
      " かいしゃに いきます。",
      "まで",
      ["まで", "から", "に", "は"],
      "I go to the office from Monday to Friday.",
      "げつようびから きんようびまで かいしゃに いきます。",
      "まで marks the ending day.",
    ),
    listeningBuildSentence({
      id: "ja-m13-3-2-lb-cafe",
      target: "じゅうじから にじまで きっさてんに います",
      tiles: ["に", "じゅうじ", "います", "まで", "きっさてん", "から", "にじ", "かいしゃ"],
      correctOrder: ["じゅうじ", "から", "にじ", "まで", "きっさてん", "に", "います"],
      promptEn: "Hear it, build it: 'I'm at the cafe from 10 to 2.'",
    }),
    sentenceMcq({
      id: "ja-m13-3-2-mcq-kaisha",
      prompt: "Which sentence means 'I'm at the office from 10 to 4.'?",
      correctKana: "じゅうじから よじまで かいしゃに います。",
      distractorsKana: [
        "よじから じゅうじまで かいしゃに います。",
        "じゅうじから よじまで がっこうに います。",
        "じゅうじに よじまで かいしゃに います。",
      ],
      explanation: "じゅうじから = from 10, よじまで = until 4, かいしゃ = office.",
    }),
    cloze(
      "ja-m13-3-2-cloze-kara-2",
      "しちがつ",
      " はちがつまで なつやすみです。",
      "から",
      ["から", "まで", "に", "は"],
      "Summer vacation is from July to August.",
      "しちがつから はちがつまで なつやすみです。",
      "から marks the starting month.",
    ),
    speaking(
      "ja-m13-3-2-speak-kaisha-sent",
      "くじから ごじまで かいしゃに います",
      "I'm at the office from 9 to 5.",
    ),
    cloze(
      "ja-m13-3-2-cloze-made-2",
      "さんがつから しがつ",
      " さくらが きれいです。",
      "まで",
      ["まで", "から", "に", "は"],
      "Cherry blossoms are beautiful from March to April.",
      "さんがつから しがつまで さくらが きれいです。",
      "まで marks the ending month.",
    ),
    selfExplain({
      id: "ja-m13-3-2-self-explain",
      anchorLabel: "You used から and まで in: くじから ごじまで",
      anchorAudioText: "くじから ごじまで かいしゃに います",
      question: "What role does から play in くじから?",
      rule: { text: "から marks the starting point of a time range — 'from 9 o'clock.'" },
      surface: { text: "から means 'because' — it explains why you're at the office." },
      distractor: { text: "から marks the destination — 'toward 9 o'clock.'" },
      ruleExplanation:
        "In time ranges, から = 'from' (start point). Here it's くじから = from 9 o'clock. Later you'll learn から also means 'because' — but not in this context.",
    }),
    translateStep({
      id: "ja-m13-3-2-translate",
      promptEn: "I go to the office from Monday to Friday.",
      acceptedAnswers: [
        "げつようびから きんようびまで かいしゃに いきます",
        "げつようびから きんようびまで かいしゃに いきます。",
      ],
      audioText: "げつようびから きんようびまで かいしゃに いきます",
    }),
    // ── Review tail ──
    vocabMcq("ja-m13-3-2-rev-mcq-1", M13_3_2_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-3-2-rev-lc-1",
      // Sentence-level review of なまえ (M3) — 2026-07-12 listening backfill.
      audioText: "あなたの なまえは なんですか",
      correctMeaningEn: "What is your name?",
      distractorsEn: [
        "Who is that person?",
        "What is your job?",
        "My name is Tanaka.",
      ],
    }),
    speaking("ja-m13-3-2-rev-speak-1", M13_3_2_REVIEW[2].kana, M13_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-3-2-rev", M13_3_2_REVIEW),
    infoStep(
      "ja-m13-3-2-info-end",
      "You can now say when you're at work, at the cafe, or on vacation",
      "から...まで with hours, days, and months — you're scheduling your life in Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_3_2.steps);
assertAnswerRotation(M13_3_2.steps, 1);
assertNoConsecutiveSame(M13_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_4_1 — "Because" (から as reason — the big grammar point)
// ═══════════════════════════════════════════════════════════════════════

const M13_4_1_REVIEW = pickReviewAtoms("ja-m13-4-1-rev", M13_REVIEW_POOL, 6);

export const M13_4_1: LessonContent = {
  id: "ja-m13-4-1",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "Because (から as reason)",
  description:
    "The second meaning of から — connecting a reason to a result. あめだから、いきません = 'Because it's raining, I won't go.'",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-4-1-info-open",
      "Giving reasons with から",
      "You know から as 'from.' Now meet its second life: 'because.' Reason + だから + result. This is one of the most useful connectors in Japanese.",
    ),
    RULE_KARA_BECAUSE,
    // ── だから sentence drills ──
    cloze(
      "ja-m13-4-1-cloze-dakara-1",
      "あめ",
      "、いきません。",
      "だから",
      ["だから", "から", "まで", "では"],
      "Because it's raining, I won't go.",
      "あめだから、いきません。",
      "だから after a noun gives the reason — 'because it's rain.'",
    ),
    listeningCompSentence({
      id: "ja-m13-4-1-lc-dakara-1",
      audioText: "やすみだから、がっこうに いきません",
      correctMeaningEn: "Because it's a day off, I won't go to school.",
      distractorsEn: [
        "Because it's a day off, I'll go to school.",
        "Until the day off, I won't go to school.",
        "Because it's raining, I won't go to school.",
      ],
    }),
    build(
      "ja-m13-4-1-build-yasumi",
      "Say: Because it's a day off, I'm at home.",
      "やすみだから、うちに います",
      ["いきます", "まで", "います", "に", "やすみ", "だから", "うち"],
      ["やすみ", "だから", "うち", "に", "います"],
    ),
    cloze(
      "ja-m13-4-1-cloze-dakara-2",
      "テスト",
      "、べんきょうします。",
      "だから",
      ["だから", "から", "に", "は"],
      "Because there's a test, I'll study.",
      "テストだから、べんきょうします。",
      "だから links the reason (a test) to the result (studying).",
    ),
    sentenceMcq({
      id: "ja-m13-4-1-mcq-dakara",
      prompt: "Which sentence means 'Because it's cold, I'll drink coffee.'?",
      correctKana: "さむいから、コーヒーを のみます。",
      distractorsKana: [
        "さむいまで、コーヒーを のみます。",
        "さむいから、コーヒーを のみません。",
        "コーヒーを のみます、さむいから。",
      ],
      explanation: "さむいから = because it's cold. With い-adjectives, use から directly (no だ).",
    }),
    build(
      "ja-m13-4-1-build-samui",
      "Say: Because it's cold, I'll drink tea.",
      "さむいから、おちゃを のみます",
      ["おちゃ", "さむい", "から", "を", "のみます", "だから", "たべます"],
      ["さむい", "から", "おちゃ", "を", "のみます"],
    ),
    listeningBuildSentence({
      id: "ja-m13-4-1-lb-ame-uchi",
      target: "あめだから、うちに います",
      tiles: ["うち", "から", "に", "いきます", "います", "だから", "あめ"],
      correctOrder: ["あめ", "だから", "うち", "に", "います"],
      promptEn: "Hear it, build it: 'Because it's raining, I'm at home.'",
    }),
    cloze(
      "ja-m13-4-1-cloze-kara-adj",
      "やすい",
      "、かいます。",
      "から",
      ["から", "だから", "まで", "に"],
      "Because it's cheap, I'll buy it.",
      "やすいから、かいます。",
      "With い-adjectives, use から directly — no だ needed.",
    ),
    speaking(
      "ja-m13-4-1-speak-dakara",
      "あめだから、こうえんに いきません",
      "Because it's raining, I won't go to the park.",
    ),
    sentenceMcq({
      id: "ja-m13-4-1-mcq-da-vs-no-da",
      prompt: "Which is correct: 'Because it's a day off, I'm at home.'?",
      correctKana: "やすみだから、うちに います。",
      distractorsKana: [
        "やすみから、うちに います。",
        "やすみだまで、うちに います。",
        "うちに います、やすみだから。",
      ],
      explanation: "Nouns need だ before から: やすみ + だから. い-adjectives attach から directly.",
    }),
    // ── なぜ (why?) — context intro ──
    build(
      "ja-m13-4-1-build-naze",
      "New word: なぜ = why? Ask: Why won't you go?",
      "なぜ いきませんか",
      ["いきません", "なぜ", "か", "だから", "いきます"],
      ["なぜ", "いきません", "か"],
    ),
    listeningCompSentence({
      id: "ja-m13-4-1-lc-naze",
      audioText: "なぜ のみませんか",
      correctMeaningEn: "Why won't you drink it?",
      distractorsEn: [
        "Why won't you eat it?",
        "Because I won't drink it.",
        "Won't you drink it?",
      ],
    }),
    selfExplain({
      id: "ja-m13-4-1-self-explain",
      anchorLabel: "You used から in two ways this module",
      anchorAudioText: "あめだから、いきません",
      question: "How do you tell apart から = 'from' and から = 'because'?",
      rule: { text: "だから (after noun+だ) or adjective+から means 'because.' Time/place+から means 'from.'" },
      surface: { text: "から always means 'because' — the 'from' meaning is a beginner misconception." },
      distractor: { text: "から = 'from' only works with places; から = 'because' only works with weather words." },
      ruleExplanation:
        "Context and what comes before から: time/place + から = from (くじから, にほんから). Noun+だから or predicate+から = because (あめだから, さむいから).",
    }),
    translateStep({
      id: "ja-m13-4-1-translate",
      promptEn: "Because there's a test, I'll study.",
      acceptedAnswers: [
        "テストだから、べんきょうします",
        "テストだから、べんきょうします。",
        "テストだから べんきょうします",
        "テストだから べんきょうします。",
      ],
      audioText: "テストだから、べんきょうします",
    }),
    // ── Review tail ──
    vocabMcq("ja-m13-4-1-rev-mcq-1", M13_4_1_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-4-1-rev-lc-1",
      audioText: M13_4_1_REVIEW[1].kana,
      correctMeaningEn: M13_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M13_4_1_REVIEW[2].meaningEn,
        M13_4_1_REVIEW[3].meaningEn,
        M13_REVIEW_POOL[6].meaningEn,
      ],
    }),
    speaking("ja-m13-4-1-rev-speak-1", M13_4_1_REVIEW[2].kana, M13_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-4-1-rev", M13_4_1_REVIEW),
    infoStep(
      "ja-m13-4-1-info-end",
      "You can now give reasons for what you do and don't do",
      "あめだから、いきません. やすみだから、うちに います. さむいから、コーヒーを のみます. Reason + から + result.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_4_1.steps);
assertAnswerRotation(M13_4_1.steps, 1);
assertNoConsecutiveSame(M13_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_4_2 — "Because" drill (more から as reason)
// ═══════════════════════════════════════════════════════════════════════

const M13_4_2_REVIEW = pickReviewAtoms("ja-m13-4-2-rev", M13_REVIEW_POOL, 6);

export const M13_4_2: LessonContent = {
  id: "ja-m13-4-2",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "Because drill",
  description:
    "More practice with だから/から — varied reasons and results, plus discrimination from time-から.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-4-2-info-open",
      "More reasons, more から",
      "Let's expand your だから toolkit — weather, feelings, plans. And keep time-から sharp alongside it.",
    ),
    // ── More だから sentences ──
    cloze(
      "ja-m13-4-2-cloze-dakara-1",
      "にちようび",
      "、がっこうに いきません。",
      "だから",
      ["だから", "から", "まで", "に"],
      "Because it's Sunday, I don't go to school.",
      "にちようびだから、がっこうに いきません。",
      "だから links the reason (Sunday) to the result (no school).",
    ),
    listeningCompSentence({
      id: "ja-m13-4-2-lc-nichiyoubi",
      audioText: "にちようびだから、がっこうに いきません",
      correctMeaningEn: "Because it's Sunday, I don't go to school.",
      distractorsEn: [
        "I go to school on Sunday.",
        "From Sunday, I go to school.",
        "Because it's Saturday, I don't go to school.",
      ],
    }),
    build(
      "ja-m13-4-2-build-atsui",
      "Say: Because it's hot, I'll drink juice.",
      "あついから、ジュースを のみます",
      ["コーヒー", "から", "ジュース", "あつい", "のみます", "を", "だから"],
      ["あつい", "から", "ジュース", "を", "のみます"],
    ),
    cloze(
      "ja-m13-4-2-cloze-kara-adj-1",
      "さむい",
      "、うちに います。",
      "から",
      ["から", "だから", "まで", "に"],
      "Because it's cold, I'm staying at home.",
      "さむいから、うちに います。",
      "い-adjective + から (no だ needed).",
    ),
    sentenceMcq({
      id: "ja-m13-4-2-mcq-discrimination-1",
      prompt: "In 'くじから ごじまで はたらきます', what does から mean?",
      correctKana: "from (starting time)",
      distractorsKana: ["because", "until", "toward"],
      explanation: "くじから = from 9 o'clock. Here から marks a time starting point, not a reason.",
    }),
    // ── Discrimination: time-から vs reason-から ──
    cloze(
      "ja-m13-4-2-cloze-dakara-2",
      "しけん",
      "、べんきょうします。",
      "だから",
      ["だから", "から", "まで", "に"],
      "Because there's an exam, I'll study.",
      "しけんだから、べんきょうします。",
      "しけん (exam) is a noun — use だから.",
    ),
    build(
      "ja-m13-4-2-build-time-kara",
      "Say: I work from 10 to 7.",
      "じゅうじから しちじまで はたらきます",
      ["はたらきます", "しちじ", "から", "まで", "だから", "じゅうじ", "べんきょうします"],
      ["じゅうじ", "から", "しちじ", "まで", "はたらきます"],
    ),
    listeningBuildSentence({
      id: "ja-m13-4-2-lb-nichiyoubi",
      target: "にちようびだから、うちに います",
      tiles: ["いきます", "に", "にちようび", "います", "うち", "だから", "から"],
      correctOrder: ["にちようび", "だから", "うち", "に", "います"],
      promptEn: "Hear it, build it: 'Because it's Sunday, I'm at home.'",
    }),
    cloze(
      "ja-m13-4-2-cloze-kara-adj-2",
      "たかい",
      "、かいません。",
      "から",
      ["から", "だから", "まで", "に"],
      "Because it's expensive, I won't buy it.",
      "たかいから、かいません。",
      "い-adjective + から directly.",
    ),
    sentenceMcq({
      id: "ja-m13-4-2-mcq-discrimination-2",
      prompt: "In 'あめだから、いきません', what does から mean?",
      correctKana: "because",
      distractorsKana: ["from", "until", "toward"],
      explanation: "あめだから = because it's rain. The だ before から signals a reason, not a starting point.",
    }),
    // ── どうして (why?) — context intro ──
    build(
      "ja-m13-4-2-build-doushite",
      "New word: どうして = why? (a softer, more conversational なぜ). Ask: Why do you study Japanese?",
      "どうして にほんごを べんきょうしますか",
      ["にほんご", "どうして", "を", "べんきょうします", "か", "から", "まで"],
      ["どうして", "にほんご", "を", "べんきょうします", "か"],
    ),
    listeningCompSentence({
      id: "ja-m13-4-2-lc-doushite",
      audioText: "どうして きっさてんに いきますか",
      correctMeaningEn: "Why do you go to the cafe?",
      distractorsEn: [
        "When do you go to the cafe?",
        "Why don't you go to the cafe?",
        "Do you go to the cafe?",
      ],
    }),
    speaking(
      "ja-m13-4-2-speak-atsui",
      "あついから、みずを のみます",
      "Because it's hot, I'll drink water.",
    ),
    selfExplain({
      id: "ja-m13-4-2-self-explain",
      anchorLabel: "You've seen から as 'from' and 'because'",
      anchorAudioText: "にちようびだから、がっこうに いきません",
      question: "When you see だから, you know から means...?",
      rule: { text: "'Because' — だ before から signals a reason clause with a noun." },
      surface: { text: "'From' — だ is just emphasis before the 'from' particle." },
      distractor: { text: "It depends on the verb that follows — から changes meaning based on the predicate." },
      ruleExplanation:
        "だから is the clear marker: noun + だから = because. Time/place + から (no だ) = from. い-adjective + から = because (no だ needed because adjectives don't take だ).",
    }),
    translateStep({
      id: "ja-m13-4-2-translate",
      promptEn: "Because it's Saturday, I don't go to school.",
      acceptedAnswers: [
        "どようびだから、がっこうに いきません",
        "どようびだから、がっこうに いきません。",
        "どようびだから がっこうに いきません",
        "どようびだから がっこうに いきません。",
      ],
      audioText: "どようびだから、がっこうに いきません",
    }),
    // ── Review tail ──
    vocabMcq("ja-m13-4-2-rev-mcq-1", M13_4_2_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-4-2-rev-lc-1",
      // Sentence-level review of ラーメン (M12) — 2026-07-12 listening backfill.
      audioText: "ラーメンが すきだから、よく たべます",
      correctMeaningEn: "Because I like ramen, I often eat it.",
      distractorsEn: [
        "Because I like sushi, I often eat it.",
        "Because I don't like ramen, I never eat it.",
        "I want to eat ramen tomorrow.",
      ],
    }),
    speaking("ja-m13-4-2-rev-speak-1", M13_4_2_REVIEW[2].kana, M13_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-4-2-rev", M13_4_2_REVIEW),
    infoStep(
      "ja-m13-4-2-info-end",
      "You can now explain your reasons in Japanese",
      "Weather, schedule, feelings — だから and から let you connect reasons to results naturally.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_4_2.steps);
assertAnswerRotation(M13_4_2.steps, 1);
assertNoConsecutiveSame(M13_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_5_1 — "Daily routine" (routine verbs + frequency adverbs)
// ═══════════════════════════════════════════════════════════════════════

const M13_5_1_REVIEW = pickReviewAtoms("ja-m13-5-1-rev", M13_REVIEW_POOL, 6);

export const M13_5_1: LessonContent = {
  id: "ja-m13-5-1",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "Daily routine",
  description:
    "Morning verbs — brushing teeth, washing your face, taking a shower — plus frequency adverbs to say how often.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-5-1-info-open",
      "Your morning routine",
      "Six everyday actions — brushing teeth, washing your face, getting dressed. Plus five frequency words from 'always' to 'never.'",
    ),
    RULE_FREQUENCY,
    // ── はをみがく (brush teeth) ──
    build(
      "ja-m13-5-1-build-ha-o-migaku",
      "Pick the phrase for: Brush teeth",
      "はを みがきます",
      ["ふくを きます", "はを みがきます", "かおを あらいます", "シャワーを あびます"],
      ["はを みがきます"],
    ),
    listeningCompSentence({
      id: "ja-m13-5-1-lc-migaku",
      audioText: "はを みがきます",
      correctMeaningEn: "brush teeth",
      distractorsEn: ["wash face", "take a shower", "get dressed"],
    }),
    // ── かおをあらう (wash face) ──
    build(
      "ja-m13-5-1-build-kao-arau",
      "Pick the phrase for: Wash face",
      "かおを あらいます",
      ["はを みがきます", "おふろに はいります", "ふくを きます", "かおを あらいます"],
      ["かおを あらいます"],
    ),
    speaking("ja-m13-5-1-speak-arau", "かおを あらいます", "Wash face"),
    // ── シャワーをあびる (take a shower) ──
    build(
      "ja-m13-5-1-build-shower",
      "Pick the phrase for: Take a shower",
      "シャワーを あびます",
      ["かおを あらいます", "シャワーを あびます", "はを みがきます", "おふろに はいります"],
      ["シャワーを あびます"],
    ),
    listeningCompSentence({
      id: "ja-m13-5-1-lc-shower",
      audioText: "シャワーを あびます",
      correctMeaningEn: "take a shower",
      distractorsEn: ["take a bath", "brush teeth", "get dressed"],
    }),
    // ── Frequency + routine verb drills ──
    cloze(
      "ja-m13-5-1-cloze-itsumo",
      "いつも あさ はを",
      "。",
      "みがきます",
      ["みがきます", "あらいます", "あびます", "きます"],
      "I always brush my teeth in the morning.",
      "いつも あさ はを みがきます。",
      "みがきます = brush/polish. はを みがきます = brush teeth.",
    ),
    sentenceMcq({
      id: "ja-m13-5-1-mcq-tokidoki",
      prompt: "Which sentence means 'I sometimes take a shower in the morning.'?",
      correctKana: "ときどき あさ シャワーを あびます。",
      distractorsKana: [
        "いつも あさ シャワーを あびます。",
        "ときどき あさ おふろに はいります。",
        "ときどき よる シャワーを あびます。",
      ],
      explanation: "ときどき = sometimes. あさ = morning. シャワーを あびます = take a shower.",
    }),
    build(
      "ja-m13-5-1-build-yoku",
      "Say: I often wash my face in the morning.",
      "よく あさ かおを あらいます",
      ["みがきます", "あらいます", "よく", "あさ", "かお", "を", "いつも"],
      ["よく", "あさ", "かお", "を", "あらいます"],
    ),
    listeningBuildSentence({
      id: "ja-m13-5-1-lb-kao",
      target: "いつも あさ かおを あらいます",
      // かお|を split like シャワー|を below — object + を are separate
      // tiles per the particle-separation policy (was glued かおを).
      tiles: ["あさ", "みがきます", "かお", "を", "いつも", "は", "あらいます"],
      correctOrder: ["いつも", "あさ", "かお", "を", "あらいます"],
      promptEn: "Hear it, build it: 'I always wash my face in the morning.'",
    }),
    build(
      "ja-m13-5-1-build-shower-yoru",
      "Say: I sometimes take a shower at night.",
      "ときどき よる シャワーを あびます",
      ["シャワー", "を", "ときどき", "よる", "あびます", "あさ", "あらいます"],
      ["ときどき", "よる", "シャワー", "を", "あびます"],
    ),
    selfExplain({
      id: "ja-m13-5-1-self-explain",
      anchorLabel: "You used いつも and ときどき in routine sentences",
      anchorAudioText: "ときどき あさ シャワーを あびます",
      question: "Where does a frequency adverb like ときどき go in a sentence?",
      rule: { text: "At or near the beginning — before the time/object/verb phrase." },
      surface: { text: "Right before です at the end of the sentence." },
      distractor: { text: "After the object particle を, before the verb." },
      ruleExplanation:
        "Frequency adverbs (いつも, よく, ときどき) typically come at the start of the sentence or just after the topic. They set the frequency for the whole clause.",
    }),
    speaking(
      "ja-m13-5-1-speak-routine",
      "いつも あさ はを みがきます",
      "I always brush my teeth in the morning.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m13-5-1-rev-mcq-1", M13_5_1_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-5-1-rev-lc-1",
      // Sentence-level review of ビール (M11) — 2026-07-12 listening backfill.
      audioText: "ときどき ビールを のみます",
      correctMeaningEn: "I sometimes drink beer.",
      distractorsEn: [
        "I always drink beer.",
        "I sometimes drink juice.",
        "I never drink beer.",
      ],
    }),
    speaking("ja-m13-5-1-rev-speak-1", M13_5_1_REVIEW[2].kana, M13_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-5-1-rev", M13_5_1_REVIEW),
    infoStep(
      "ja-m13-5-1-info-end",
      "You can now describe your morning routine in Japanese",
      "Brush teeth, wash face, take a shower — with いつも, よく, and ときどき to say how often.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_5_1.steps);
assertAnswerRotation(M13_5_1.steps, 1);
assertNoConsecutiveSame(M13_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_5_2 — "Daily routine" drill (more verbs + あまり/ぜんぜん)
// ═══════════════════════════════════════════════════════════════════════

const M13_5_2_REVIEW = pickReviewAtoms("ja-m13-5-2-rev", M13_REVIEW_POOL, 6);

export const M13_5_2: LessonContent = {
  id: "ja-m13-5-2",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "Daily routine drill",
  description:
    "More routine verbs — bath, getting dressed, lights — and the negative frequency adverbs あまり and ぜんぜん.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-5-2-info-open",
      "Negative frequency + more routines",
      "Three more daily verbs plus あまり (not often) and ぜんぜん (not at all). Remember: these TWO require a negative verb!",
    ),
    // ── おふろにはいる (take a bath) ──
    build(
      "ja-m13-5-2-build-ofuro",
      "Pick the phrase for: Take a bath",
      "おふろに はいります",
      ["かおを あらいます", "おふろに はいります", "でんきを つけます", "シャワーを あびます"],
      ["おふろに はいります"],
    ),
    listeningCompSentence({
      id: "ja-m13-5-2-lc-ofuro",
      audioText: "おふろに はいります",
      correctMeaningEn: "take a bath",
      distractorsEn: ["take a shower", "wash face", "turn on the light"],
    }),
    // ── ふくをきる (get dressed) ──
    build(
      "ja-m13-5-2-build-fuku",
      "Pick the phrase for: Get dressed / Put on clothes",
      "ふくを きます",
      ["はを みがきます", "でんきを けします", "おふろに はいります", "ふくを きます"],
      ["ふくを きます"],
    ),
    speaking("ja-m13-5-2-speak-fuku", "ふくを きます", "Get dressed"),
    // ── でんきをつける/けす (turn on/off light) ──
    build(
      "ja-m13-5-2-build-denki-tsukeru",
      "Pick the phrase for: Turn on the light",
      "でんきを つけます",
      ["でんきを けします", "でんきを つけます", "ふくを きます", "かおを あらいます"],
      ["でんきを つけます"],
    ),
    listeningCompSentence({
      id: "ja-m13-5-2-lc-denki-kesu",
      audioText: "でんきを けします",
      correctMeaningEn: "turn off the light",
      distractorsEn: ["turn on the light", "get dressed", "take a bath"],
    }),
    // ── あまり〜ない drill ──
    cloze(
      "ja-m13-5-2-cloze-amari",
      "あまり おふろに",
      "。",
      "はいりません",
      ["はいりません", "はいります", "あびます", "あびません"],
      "I don't take a bath very often.",
      "あまり おふろに はいりません。",
      "あまり REQUIRES a negative verb — はいりません, not はいります.",
    ),
    sentenceMcq({
      id: "ja-m13-5-2-mcq-amari",
      prompt: "Which sentence is grammatically correct?",
      correctKana: "あまり テレビを みません。",
      distractorsKana: [
        "あまり テレビを みます。",
        "ぜんぜん テレビを みます。",
        "あまり テレビを みる。",
      ],
      explanation: "あまり requires a negative predicate. あまり...みません = I don't watch TV very often.",
    }),
    // ── ぜんぜん〜ない drill ──
    build(
      "ja-m13-5-2-build-zenzen",
      "Say: I don't take a shower at all.",
      "ぜんぜん シャワーを あびません",
      ["シャワー", "あびます", "あまり", "を", "ぜんぜん", "あびません"],
      ["ぜんぜん", "シャワー", "を", "あびません"],
    ),
    cloze(
      "ja-m13-5-2-cloze-zenzen",
      "ぜんぜん でんきを",
      "。",
      "けしません",
      ["けしません", "けします", "つけます", "つけません"],
      "I don't turn off the light at all.",
      "ぜんぜん でんきを けしません。",
      "ぜんぜん REQUIRES a negative verb — けしません.",
    ),
    listeningBuildSentence({
      id: "ja-m13-5-2-lb-amari",
      target: "あまり コーヒーを のみません",
      tiles: ["ぜんぜん", "のみます", "を", "のみません", "あまり", "コーヒー"],
      correctOrder: ["あまり", "コーヒー", "を", "のみません"],
      promptEn: "Hear it, build it: 'I don't drink coffee very often.'",
    }),
    speaking(
      "ja-m13-5-2-speak-amari",
      "あまり おふろに はいりません",
      "I don't take a bath very often.",
    ),
    selfExplain({
      id: "ja-m13-5-2-self-explain",
      anchorLabel: "You used あまり and ぜんぜん with negative verbs",
      anchorAudioText: "ぜんぜん シャワーを あびません",
      question: "Why can't you say ぜんぜん たべます?",
      rule: { text: "ぜんぜん means 'not at all' — it requires a negative verb like ません or ない." },
      surface: { text: "You can say it — ぜんぜん たべます means 'I eat a lot.'" },
      distractor: { text: "ぜんぜん only works with food verbs — for other verbs, use あまり instead." },
      ruleExplanation:
        "ぜんぜん and あまり are negative polarity items — they MUST pair with a negative predicate. ぜんぜん + positive is grammatically incorrect in standard Japanese.",
    }),
    translateStep({
      id: "ja-m13-5-2-translate",
      promptEn: "I don't turn off the light at all.",
      acceptedAnswers: [
        "ぜんぜん でんきを けしません",
        "ぜんぜん でんきを けしません。",
      ],
      audioText: "ぜんぜん でんきを けしません",
    }),
    // ── Review tail ──
    vocabMcq("ja-m13-5-2-rev-mcq-1", M13_5_2_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-5-2-rev-lc-1",
      // Sentence-level review of ご (M5) — 2026-07-12 listening backfill.
      audioText: "ごじから ろくじまで べんきょうします",
      correctMeaningEn: "I study from 5 to 6.",
      distractorsEn: [
        "I work from 5 to 6.",
        "I study from 9 to 6.",
        "I study until 5 o'clock.",
      ],
    }),
    speaking("ja-m13-5-2-rev-speak-1", M13_5_2_REVIEW[2].kana, M13_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-5-2-rev", M13_5_2_REVIEW),
    infoStep(
      "ja-m13-5-2-info-end",
      "You can now describe what you do and don't do every day",
      "Bath, clothes, lights — with all five frequency adverbs from いつも (always) to ぜんぜん (never). The negative ones need negative verbs!",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_5_2.steps);
assertAnswerRotation(M13_5_2.steps, 1);
assertNoConsecutiveSame(M13_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_6_1 — "How often?" (frequency + time expressions)
// ═══════════════════════════════════════════════════════════════════════

const M13_6_1_REVIEW = pickReviewAtoms("ja-m13-6-1-rev", M13_REVIEW_POOL, 6);

export const M13_6_1: LessonContent = {
  id: "ja-m13-6-1",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "How often?",
  description:
    "Combine frequency adverbs with time expressions and から — talk about your weekly and monthly routines.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-6-1-info-open",
      "Frequency + time",
      "Let's combine everything — months, time ranges, frequency adverbs, and daily routine verbs into rich schedule sentences.",
    ),
    // ── Complex schedule sentences ──
    build(
      "ja-m13-6-1-build-itsumo-kara",
      "Say: I always work from 9 to 5.",
      "いつも くじから ごじまで はたらきます",
      ["まで", "はたらきます", "よく", "から", "くじ", "ごじ", "いつも", "べんきょうします"],
      ["いつも", "くじ", "から", "ごじ", "まで", "はたらきます"],
    ),
    listeningCompSentence({
      id: "ja-m13-6-1-lc-tokidoki",
      audioText: "ときどき きっさてんに いきます",
      correctMeaningEn: "I sometimes go to the cafe.",
      distractorsEn: [
        "I always go to the cafe.",
        "I sometimes go to the office.",
        "I never go to the cafe.",
      ],
    }),
    build(
      "ja-m13-6-1-build-yoku-kissaten",
      "Say: I often go to the cafe.",
      "よく きっさてんに いきます",
      ["きっさてん", "よく", "に", "いきます", "で", "あまり"],
      ["よく", "きっさてん", "に", "いきます"],
    ),
    sentenceMcq({
      id: "ja-m13-6-1-mcq-amari",
      prompt: "Which sentence means 'I don't often go to the office.'?",
      correctKana: "あまり かいしゃに いきません。",
      distractorsKana: [
        "あまり かいしゃに いきます。",
        "いつも かいしゃに いきません。",
        "ぜんぜん かいしゃに いきません。",
      ],
      explanation: "あまり + ません = not often. かいしゃ = office/company.",
    }),
    build(
      "ja-m13-6-1-build-yoku-month",
      "Say: I often go to Japan in March.",
      "よく さんがつに にほんに いきます",
      ["いきます", "よく", "に", "さんがつ", "に", "にほん", "しがつ", "いつも"],
      ["よく", "さんがつ", "に", "にほん", "に", "いきます"],
    ),
    build(
      "ja-m13-6-1-build-toshokan-de",
      "Say: I sometimes read books at the library.",
      "ときどき としょかんで ほんを よみます",
      ["としょかん", "ときどき", "で", "ほん", "を", "よみます", "に"],
      ["ときどき", "としょかん", "で", "ほん", "を", "よみます"],
    ),
    listeningBuildSentence({
      id: "ja-m13-6-1-lb-amari-kaisha",
      target: "あまり かいしゃに いきません",
      tiles: ["に", "ぜんぜん", "いきません", "あまり", "かいしゃ", "いきます"],
      correctOrder: ["あまり", "かいしゃ", "に", "いきません"],
      promptEn: "Hear it, build it: 'I don't often go to the office.'",
    }),
    // ── クラス (class) — context intro ──
    build(
      "ja-m13-6-1-build-kurasu",
      "New word: クラス = class (katakana, from English 'class'). Say: Class is from 1 o'clock.",
      "クラスは いちじからです",
      ["いちじ", "クラス", "は", "から", "です", "まで"],
      ["クラス", "は", "いちじ", "から", "です"],
    ),
    listeningCompSentence({
      id: "ja-m13-6-1-lc-kurasu",
      audioText: "クラスは いちじから さんじまでです",
      correctMeaningEn: "Class is from 1 to 3.",
      distractorsEn: [
        "Class is until 1.",
        "Work is from 1 to 3.",
        "Class is from 3.",
      ],
    }),
    sentenceMcq({
      id: "ja-m13-6-1-mcq-zenzen",
      prompt: "Which sentence is correct?",
      correctKana: "ぜんぜん おふろに はいりません。",
      distractorsKana: [
        "ぜんぜん おふろに はいります。",
        "あまり おふろに はいります。",
        "ぜんぜん おふろに はいる。",
      ],
      explanation: "ぜんぜん requires a polite negative: はいりません. ぜんぜん + positive = broken.",
    }),
    speaking(
      "ja-m13-6-1-speak-kissaten",
      "ときどき きっさてんで コーヒーを のみます",
      "I sometimes drink coffee at the cafe.",
    ),
    build(
      "ja-m13-6-1-build-dakara",
      "Say: Because it's hot, I always drink juice.",
      "あついから、いつも ジュースを のみます",
      ["コーヒー", "を", "いつも", "のみます", "あつい", "だから", "ジュース", "から"],
      ["あつい", "から", "いつも", "ジュース", "を", "のみます"],
    ),
    selfExplain({
      id: "ja-m13-6-1-self-explain",
      anchorLabel: "You combined frequency + から in sentences",
      anchorAudioText: "あついから、いつも ジュースを のみます",
      question: "In this sentence, what does から mean?",
      rule: { text: "'Because' — あついから = because it's hot. The adjective + から gives the reason." },
      surface: { text: "'From' — it marks where the juice comes from." },
      distractor: { text: "'Until' — it marks the endpoint of being hot." },
      ruleExplanation:
        "Adjective/predicate + から = because. Time/place + から = from. Here あつい (hot) is an adjective, so から = because.",
    }),
    translateStep({
      id: "ja-m13-6-1-translate",
      promptEn: "I sometimes drink coffee at the cafe.",
      acceptedAnswers: [
        "ときどき きっさてんで コーヒーを のみます",
        "ときどき きっさてんで コーヒーを のみます。",
      ],
      audioText: "ときどき きっさてんで コーヒーを のみます",
    }),
    // ── Review tail ──
    vocabMcq("ja-m13-6-1-rev-mcq-1", M13_6_1_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-6-1-rev-lc-1",
      // Sentence-level review of うち (M6) — 2026-07-12 listening backfill.
      audioText: "ろくじまで うちに います",
      correctMeaningEn: "I'm at home until 6.",
      distractorsEn: [
        "I'm at home from 6.",
        "I'm at school until 6.",
        "I go home at 6.",
      ],
    }),
    speaking("ja-m13-6-1-rev-speak-1", M13_6_1_REVIEW[2].kana, M13_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-6-1-rev", M13_6_1_REVIEW),
    infoStep(
      "ja-m13-6-1-info-end",
      "You can now talk about your weekly routines with frequency and reasons",
      "Frequency + time + から — scheduling your whole life in Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_6_1.steps);
assertAnswerRotation(M13_6_1.steps, 1);
assertNoConsecutiveSame(M13_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_6_2 — "How often?" drill (frequency + reasons)
// ═══════════════════════════════════════════════════════════════════════

const M13_6_2_REVIEW = pickReviewAtoms("ja-m13-6-2-rev", M13_REVIEW_POOL, 6);

export const M13_6_2: LessonContent = {
  id: "ja-m13-6-2",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "How often? drill",
  description:
    "Interleave frequency adverbs, time ranges, and だから reasons in complex daily-life sentences.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-6-2-info-open",
      "Compound schedule sentences",
      "Everything together — frequency, から...まで time ranges, だから reasons, and daily routine verbs.",
    ),
    // ── Compound drills ──
    cloze(
      "ja-m13-6-2-cloze-dakara-1",
      "さむい",
      "、いつも おふろに はいります。",
      "から",
      ["から", "だから", "まで", "は"],
      "Because it's cold, I always take a bath.",
      "さむいから、いつも おふろに はいります。",
      "い-adjective + から = because.",
    ),
    listeningCompSentence({
      id: "ja-m13-6-2-lc-compound",
      audioText: "にちようびだから、いつも ゆっくり おきます",
      correctMeaningEn: "Because it's Sunday, I always wake up slowly.",
      distractorsEn: [
        "From Sunday, I always wake up slowly.",
        "Because it's Sunday, I sometimes wake up slowly.",
        "Because it's Saturday, I always wake up slowly.",
      ],
    }),
    build(
      "ja-m13-6-2-build-compound-1",
      "Say: Because it's a day off, I don't often go to the office.",
      "やすみだから、あまり かいしゃに いきません",
      ["いきません", "かいしゃ", "に", "から", "だから", "やすみ", "あまり", "いきます"],
      ["やすみ", "だから", "あまり", "かいしゃ", "に", "いきません"],
    ),
    cloze(
      "ja-m13-6-2-cloze-ni-1",
      "よく ろくがつ",
      " にほんに いきます。",
      "に",
      ["に", "は", "で", "を"],
      "I often go to Japan in June.",
      "よく ろくがつに にほんに いきます。",
      "に marks the time point — 'in June.'",
    ),
    sentenceMcq({
      id: "ja-m13-6-2-mcq-kara-disc",
      prompt: "In 'やすみだから、うちにいます', what does から mean?",
      correctKana: "because",
      distractorsKana: ["from", "until", "and"],
      explanation: "やすみだから = because it's a day off. The だ + から = because.",
    }),
    cloze(
      "ja-m13-6-2-cloze-made",
      "いつも くじから ごじ",
      " べんきょうします。",
      "まで",
      ["まで", "から", "に", "で"],
      "I always study from 9 to 5.",
      "いつも くじから ごじまで べんきょうします。",
      "まで marks the ending time.",
    ),
    build(
      "ja-m13-6-2-build-zenzen-dakara",
      "Say: Because it's expensive, I don't buy it at all.",
      "たかいから、ぜんぜん かいません",
      ["あまり", "ぜんぜん", "かいます", "から", "かいません", "たかい", "だから"],
      ["たかい", "から", "ぜんぜん", "かいません"],
    ),
    listeningBuildSentence({
      id: "ja-m13-6-2-lb-compound",
      target: "やすみだから、こうえんに いきます",
      tiles: ["に", "やすみ", "だから", "こうえん", "いきます", "から", "いきません"],
      correctOrder: ["やすみ", "だから", "こうえん", "に", "いきます"],
      promptEn: "Hear it, build it: 'Because it's a day off, I'll go to the park.'",
    }),
    cloze(
      "ja-m13-6-2-cloze-dakara-2",
      "あめ",
      "、ぜんぜん そとに でません。",
      "だから",
      ["だから", "から", "まで", "に"],
      "Because it's raining, I don't go outside at all.",
      "あめだから、ぜんぜん そとに でません。",
      "Noun + だから = because. ぜんぜん requires negative でません.",
    ),
    speaking(
      "ja-m13-6-2-speak-compound",
      "やすみだから、あまり かいしゃに いきません",
      "Because it's a day off, I don't often go to the office.",
    ),
    sentenceMcq({
      id: "ja-m13-6-2-mcq-freq-negative",
      prompt: "Which sentence correctly uses あまり?",
      correctKana: "あまり きっさてんに いきません。",
      distractorsKana: [
        "あまり きっさてんに いきます。",
        "ぜんぜん きっさてんに いきます。",
        "あまり きっさてんに いく。",
      ],
      explanation: "あまり requires a polite negative: いきません.",
    }),
    // ── つぎ (next) — context intro ──
    build(
      "ja-m13-6-2-build-tsugi",
      "New word: つぎ = next. Say: The next class is from 2 o'clock.",
      "つぎの クラスは にじからです",
      ["クラス", "つぎ", "の", "は", "にじ", "から", "です", "まで"],
      ["つぎ", "の", "クラス", "は", "にじ", "から", "です"],
    ),
    listeningCompSentence({
      id: "ja-m13-6-2-lc-tsugi",
      audioText: "つぎの じゅぎょうは さんじからです",
      correctMeaningEn: "The next class is from 3 o'clock.",
      distractorsEn: [
        "The next class is until 3 o'clock.",
        "This class is from 3 o'clock.",
        "The next class is from 2 o'clock.",
      ],
    }),
    selfExplain({
      id: "ja-m13-6-2-self-explain",
      anchorLabel: "You combined だから + frequency adverbs",
      anchorAudioText: "やすみだから、あまり かいしゃに いきません",
      question: "Why does あまり pair with いきません (not いきます)?",
      rule: { text: "あまり is a negative polarity item — it requires a negative verb." },
      surface: { text: "あまり can go with either positive or negative — it just sounds better with negative." },
      distractor: { text: "あまり means 'a lot,' so it needs negative to reverse the meaning." },
      ruleExplanation:
        "あまり and ぜんぜん MUST pair with negative predicates (ません/ない). They are grammatically bound to negation. あまり = not often, ぜんぜん = not at all.",
    }),
    translateStep({
      id: "ja-m13-6-2-translate",
      promptEn: "Because it's cold, I always take a bath.",
      acceptedAnswers: [
        "さむいから、いつも おふろに はいります",
        "さむいから、いつも おふろに はいります。",
        "さむいから いつも おふろに はいります",
        "さむいから いつも おふろに はいります。",
      ],
      audioText: "さむいから、いつも おふろに はいります",
    }),
    // ── あと (later / afterwards) — new word ──
    build(
      "ja-m13-6-2-build-ato",
      "Pick the Japanese for: later / afterwards",
      "あと",
      ["いま", "あと", "つぎ", "きょう"],
      ["あと"],
    ),
    listeningCompSentence({
      id: "ja-m13-6-2-lc-ato",
      audioText: "あとで べんきょうします",
      correctMeaningEn: "I'll study later.",
      distractorsEn: [
        "I'm studying now.",
        "I'll study tomorrow.",
        "I won't study.",
      ],
    }),
    speaking("ja-m13-6-2-speak-ato", "あとで ごはんを たべます", "I'll eat later."),
    // ── Review tail ──
    vocabMcq("ja-m13-6-2-rev-mcq-1", M13_6_2_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-6-2-rev-lc-1",
      // Sentence-level review of よん (M5) — 2026-07-12 listening backfill.
      audioText: "クラスは よんじゅうにんです",
      correctMeaningEn: "The class has 40 people.",
      distractorsEn: [
        "The class has 14 people.",
        "The class has 4 people.",
        "The class has 20 people.",
      ],
    }),
    speaking("ja-m13-6-2-rev-speak-1", M13_6_2_REVIEW[2].kana, M13_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-6-2-rev", M13_6_2_REVIEW),
    infoStep(
      "ja-m13-6-2-info-end",
      "You can now explain your schedule with reasons and frequency",
      "から as 'because,' frequency adverbs, time ranges — your daily-life Japanese is getting real.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_6_2.steps);
assertAnswerRotation(M13_6_2.steps, 1);
assertNoConsecutiveSame(M13_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_STORY — Dialogue: discussing schedules
// ═══════════════════════════════════════════════════════════════════════

export const M13_STORY: LessonContent = {
  id: "ja-m13-story",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Planning a trip",
  description:
    "Follow たけし's plan to visit Japan — months, schedules (から...まで), and reasons (だから) in a connected story.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m13-story-info-open",
      "Story time — When to go to Japan",
      "たけし is telling you about his trip to Japan. Listen for the month he chose, his reason, and his schedule — then reply to him.",
    ),
    ...storyComprehension({
      idPrefix: "ja-m13-story-s1",
      narrative: [
        { kana: "さんがつに にほんに いきます。" },
        { kana: "さくらが きれいだから、さんがつが いいです。" },
        { kana: "さんがつは ときどき さむいです。" },
        { kana: "でも、ひとが おおいです。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "When does たけし go to Japan?",
          correctText: "March",
          distractors: ["April", "July", "September"],
          explanation: "さんがつに にほんに いきます = he goes to Japan in March.",
        },
        {
          id: "s1-q2",
          prompt: "Why did he choose March?",
          correctText: "Because cherry blossoms are beautiful.",
          distractors: ["Because it's warm.", "Because it's cheap.", "Because it's a day off."],
          explanation: "さくらが きれいだから = because the cherry blossoms are beautiful.",
        },
        {
          id: "s1-q3",
          prompt: "What is March weather like, according to たけし?",
          correctText: "Sometimes cold.",
          distractors: ["Always warm.", "Never cold.", "Always cold."],
          explanation: "ときどき さむいです = it's sometimes cold.",
        },
      ],
      responseBuild: {
        promptEn: "Reply with たけし's reason: 'Because cherry blossoms are beautiful.'",
        target: "さくらが きれいだから",
        tiles: ["きれい", "さくら", "が", "だから", "から", "おおきい"],
        correctOrder: ["さくら", "が", "きれい", "だから"],
      },
    }),
    sentenceMcq({
      id: "ja-m13-story-mcq-weather",
      prompt: "How did たけし describe March weather?",
      correctKana: "ときどき さむい",
      distractorsKana: ["いつも あたたかい", "ぜんぜん さむくない", "いつも さむい"],
      explanation: "たけし said ときどき さむいです = sometimes cold.",
    }),
    ...storyComprehension({
      idPrefix: "ja-m13-story-s2",
      narrative: [
        { kana: "わたしは げつようびから きんようびまで はたらきます。" },
        { kana: "くじから ろくじまで かいしゃに います。" },
        { kana: "でも、さんがつは やすみです。" },
        { kana: "ひとつき にほんに います。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "What are たけし's work hours?",
          correctText: "9 to 6.",
          distractors: ["8 to 5.", "10 to 7.", "9 to 5."],
          explanation: "くじから ろくじまで かいしゃに います = he's at the office from 9 to 6.",
        },
        {
          id: "s2-q2",
          prompt: "How long will たけし stay in Japan?",
          correctText: "One month.",
          distractors: ["One week.", "From January.", "Until Monday."],
          explanation: "ひとつき にほんに います = he'll be in Japan for one month.",
        },
      ],
      responseBuild: {
        promptEn: "Reply to たけし: 'I'll also go to Japan in March.'",
        target: "わたしも さんがつに にほんに いきます",
        tiles: ["さんがつ", "わたし", "も", "に", "にほん", "に", "いきます", "しがつ"],
        correctOrder: ["わたし", "も", "さんがつ", "に", "にほん", "に", "いきます"],
      },
    }),
    listeningCompSentence({
      id: "ja-m13-story-lc-hito",
      audioText: "さんがつは ひとが おおいです",
      correctMeaningEn: "In March, there are many people.",
      distractorsEn: [
        "In March, there are few people.",
        "In April, there are many people.",
        "In March, it's expensive.",
      ],
    }),
    speaking(
      "ja-m13-story-speak-sakura",
      "さくらが きれいだから",
      "Because cherry blossoms are beautiful.",
    ),
    sentenceMcq({
      id: "ja-m13-story-mcq-hitotsuki",
      prompt: "Which sentence means 'I'll be in Japan for one month.'?",
      correctKana: "ひとつき にほんに います。",
      distractorsKana: [
        "いちがつに にほんに います。",
        "ひとつき にほんに いきます。",
        "ひとつ にほんが あります。",
      ],
      explanation: "ひとつき = one month (duration) + います (stay). いちがつ = January. ひとつき + いきます mixes a duration with a motion verb.",
    }),
    speaking(
      "ja-m13-story-speak-schedule",
      "くじから ろくじまで しごとです",
      "I work from 9 to 6.",
    ),
    infoStep(
      "ja-m13-story-info-end",
      "You followed a real story about travel plans",
      "Months, reasons (だから), schedules (から...まで), frequency (ときどき), and ひとつき — all in one connected story about visiting Japan.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M13_STORY.steps);
assertPassiveCardsHaveFollowup(M13_STORY.steps);
assertNoExplanationOnPassive(M13_STORY.steps);
assertExplanationDoesntLeakAnswer(M13_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_7_1 — Mixed drill (time + frequency + から discrimination)
// ═══════════════════════════════════════════════════════════════════════

const M13_7_1_REVIEW = pickReviewAtoms("ja-m13-7-1-rev", M13_REVIEW_POOL, 6);

export const M13_7_1: LessonContent = {
  id: "ja-m13-7-1",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed drill — everything together",
  description:
    "Interleave all M13 grammar — months, から...まで, だから, frequency. Discriminate from/because uses of から.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-7-1-info-open",
      "All of M13 in one drill",
      "Months, time ranges, reasons, frequency — let's mix them all and make sure you can tell apart から = 'from' and から = 'because.'",
    ),
    // ── から discrimination drills ──
    cloze(
      "ja-m13-7-1-cloze-kara-time",
      "しがつ",
      " ろくがつまで あたたかいです。",
      "から",
      ["から", "だから", "まで", "に"],
      "It's warm from April to June.",
      "しがつから ろくがつまで あたたかいです。",
      "から = from (time range starting point).",
    ),
    sentenceMcq({
      id: "ja-m13-7-1-mcq-disc-1",
      prompt: "In 'あめだから、いきません', から means...?",
      correctKana: "because",
      distractorsKana: ["from", "until", "and"],
      explanation: "だから after a noun = because. あめだから = because it's rain.",
    }),
    cloze(
      "ja-m13-7-1-cloze-dakara",
      "にちようび",
      "、ゆっくり おきます。",
      "だから",
      ["だから", "から", "まで", "に"],
      "Because it's Sunday, I wake up slowly.",
      "にちようびだから、ゆっくり おきます。",
      "Noun + だから = because.",
    ),
    build(
      "ja-m13-7-1-build-month-range",
      "Say: It's cold from November to February.",
      "じゅういちがつから にがつまで さむいです",
      ["さむい", "あつい", "じゅういちがつ", "にがつ", "だから", "から", "まで", "です"],
      ["じゅういちがつ", "から", "にがつ", "まで", "さむい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m13-7-1-lc-discrimination",
      audioText: "たかいから、かいません",
      correctMeaningEn: "Because it's expensive, I won't buy it.",
      distractorsEn: [
        "From the expensive one, I'll buy it.",
        "It's expensive until I buy it.",
        "It's expensive, so I'll buy it.",
      ],
    }),
    cloze(
      "ja-m13-7-1-cloze-made",
      "くじから ろくじ",
      " かいしゃに います。",
      "まで",
      ["まで", "から", "に", "だから"],
      "I'm at the office from 9 to 6.",
      "くじから ろくじまで かいしゃに います。",
      "まで marks the ending time.",
    ),
    sentenceMcq({
      id: "ja-m13-7-1-mcq-month",
      prompt: "Which month name is WRONG?",
      correctKana: "なながつ",
      distractorsKana: ["しちがつ", "はちがつ", "くがつ"],
      explanation: "なながつ is wrong — July is しちがつ (on-reading しち, not なな).",
    }),
    build(
      "ja-m13-7-1-build-reason-freq",
      "Say: Because it's a day off, I don't go to the office at all.",
      "やすみだから、ぜんぜん かいしゃに いきません",
      ["だから", "あまり", "やすみ", "いきません", "に", "かいしゃ", "から", "ぜんぜん"],
      ["やすみ", "だから", "ぜんぜん", "かいしゃ", "に", "いきません"],
    ),
    cloze(
      "ja-m13-7-1-cloze-kara-because",
      "あつい",
      "、いつも ジュースを のみます。",
      "から",
      ["から", "だから", "まで", "に"],
      "Because it's hot, I always drink juice.",
      "あついから、いつも ジュースを のみます。",
      "い-adjective + から = because (no だ).",
    ),
    listeningBuildSentence({
      id: "ja-m13-7-1-lb-mixed",
      target: "くがつから じゅういちがつまで すずしいです",
      tiles: ["だから", "から", "あつい", "じゅういちがつ", "くがつ", "です", "まで", "すずしい"],
      correctOrder: ["くがつ", "から", "じゅういちがつ", "まで", "すずしい", "です"],
      promptEn: "Hear it, build it: 'It's cool from September to November.'",
    }),
    speaking(
      "ja-m13-7-1-speak-discrimination",
      "やすみだから、ぜんぜん かいしゃに いきません",
      "Because it's a day off, I don't go to the office at all.",
    ),
    selfExplain({
      id: "ja-m13-7-1-self-explain",
      anchorLabel: "You've used から two different ways in this lesson",
      anchorAudioText: "しちがつから はちがつまで",
      question: "What is the single easiest way to tell if から means 'from' or 'because'?",
      rule: { text: "If だ comes before から (noun+だから) or an adjective/verb precedes it, it means 'because.' Time/place + から = from." },
      surface: { text: "You can always tell by the comma — a comma after から means 'because.'" },
      distractor: { text: "から only means 'because' in questions — in statements it always means 'from.'" },
      ruleExplanation:
        "The key signal is what attaches before から. だから (noun+だ) or predicate+から = because. Time-word+から (especially with まで nearby) = from. Both are common and natural.",
    }),
    translateStep({
      id: "ja-m13-7-1-translate",
      promptEn: "It's hot from July to September.",
      acceptedAnswers: [
        "しちがつから くがつまで あついです",
        "しちがつから くがつまで あついです。",
      ],
      audioText: "しちがつから くがつまで あついです",
    }),
    // ── Review tail ──
    vocabMcq("ja-m13-7-1-rev-mcq-1", M13_7_1_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-7-1-rev-lc-1",
      // Sentence-level review of よみます (M7) — 2026-07-12 listening backfill.
      audioText: "まいにち しんぶんを よみます",
      correctMeaningEn: "I read the newspaper every day.",
      distractorsEn: [
        "I read the newspaper every week.",
        "I watch the news every day.",
        "I write a letter every day.",
      ],
    }),
    speaking("ja-m13-7-1-rev-speak-1", M13_7_1_REVIEW[2].kana, M13_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-7-1-rev", M13_7_1_REVIEW),
    infoStep(
      "ja-m13-7-1-info-end",
      "You can now discriminate between から = 'from' and から = 'because'",
      "The two からs — time-from and reason-because — are no longer confusing. Context is king.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_7_1.steps);
assertAnswerRotation(M13_7_1.steps, 1);
assertNoConsecutiveSame(M13_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M13_7_2 — Production (full-sentence production + speaking)
// ═══════════════════════════════════════════════════════════════════════

const M13_7_2_REVIEW = pickReviewAtoms("ja-m13-7-2-rev", M13_REVIEW_POOL, 6);

export const M13_7_2: LessonContent = {
  id: "ja-m13-7-2",
  moduleId: "m13",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — full sentences",
  description:
    "Produce complex sentences from scratch — months, schedules, reasons, and daily routines. The final challenge.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m13-7-2-info-open",
      "Show what you know",
      "Build and speak full sentences using everything from M13 — months, time ranges, reasons, frequency, and daily routines.",
    ),
    // ── Production-heavy drills ──
    build(
      "ja-m13-7-2-build-1",
      "Say: I go to Japan in April.",
      "しがつに にほんに いきます",
      ["に", "にほん", "いきます", "から", "に", "しがつ", "よんがつ"],
      ["しがつ", "に", "にほん", "に", "いきます"],
    ),
    speaking(
      "ja-m13-7-2-speak-1",
      "しがつに にほんに いきます",
      "I go to Japan in April.",
    ),
    build(
      "ja-m13-7-2-build-2",
      "Say: Because it's hot, I take a shower.",
      "あついから、シャワーを あびます",
      ["を", "だから", "あつい", "から", "あびます", "はいります", "シャワー"],
      ["あつい", "から", "シャワー", "を", "あびます"],
    ),
    build(
      "ja-m13-7-2-build-yasumi-terebi",
      "Say: Because it's a day off, I watch TV at home.",
      "やすみだから、うちで テレビを みます",
      ["うち", "やすみ", "だから", "で", "テレビ", "を", "みます", "から"],
      ["やすみ", "だから", "うち", "で", "テレビ", "を", "みます"],
    ),
    speaking(
      "ja-m13-7-2-speak-2",
      "あついから、シャワーを あびます",
      "Because it's hot, I take a shower.",
    ),
    build(
      "ja-m13-7-2-build-3",
      "Say: I sometimes wash my face at night.",
      "ときどき よる かおを あらいます",
      ["かおを", "ときどき", "よる", "あらいます", "いつも", "みがきます"],
      ["ときどき", "よる", "かおを", "あらいます"],
    ),
    listeningBuildSentence({
      id: "ja-m13-7-2-lb-1",
      target: "ろくがつから しちがつまで あめが おおいです",
      tiles: ["あめ", "です", "おおい", "だから", "ろくがつ", "が", "から", "まで", "しちがつ"],
      correctOrder: ["ろくがつ", "から", "しちがつ", "まで", "あめ", "が", "おおい", "です"],
      promptEn: "Hear it, build it: 'There's a lot of rain from June to July.'",
    }),
    build(
      "ja-m13-7-2-build-work-hours",
      "Say: I work from 10 to 4.",
      "じゅうじから よじまで はたらきます",
      ["よじ", "じゅうじ", "から", "まで", "はたらきます", "だから", "に"],
      ["じゅうじ", "から", "よじ", "まで", "はたらきます"],
    ),
    sentenceMcq({
      id: "ja-m13-7-2-mcq-month",
      prompt: "What is September in Japanese?",
      correctKana: "くがつ",
      distractorsKana: ["きゅうがつ", "しちがつ", "ろくがつ"],
      explanation: "September = くがつ. Uses the on-reading く (not きゅう).",
    }),
    speaking(
      "ja-m13-7-2-speak-3",
      "しちがつから はちがつまで なつやすみです",
      "Summer vacation is from July to August.",
    ),
    build(
      "ja-m13-7-2-build-4",
      "Say: I don't read books very often.",
      "あまり ほんを よみません",
      ["ほん", "あまり", "を", "よみません", "ぜんぜん", "よみます"],
      ["あまり", "ほん", "を", "よみません"],
    ),
    selfExplain({
      id: "ja-m13-7-2-self-explain",
      anchorLabel: "You've produced sentences with both meanings of から",
      anchorAudioText: "あついから、シャワーを あびます",
      question: "In 'あついから', why is there no だ before から?",
      rule: { text: "い-adjectives attach から directly — だ is only used after nouns and な-adjectives." },
      surface: { text: "だ is optional with all words before から — you can always drop it." },
      distractor: { text: "だ is only used in formal speech — casual から never uses だ." },
      ruleExplanation:
        "The rule: nouns + だから (あめだから), な-adjectives + だから (きれいだから), い-adjectives + から (さむいから), verbs + から (いくから). い-adjectives never take だ.",
    }),
    translateStep({
      id: "ja-m13-7-2-translate-1",
      promptEn: "Because it's a day off, I always take a bath.",
      acceptedAnswers: [
        "やすみだから、いつも おふろに はいります",
        "やすみだから、いつも おふろに はいります。",
        "やすみだから いつも おふろに はいります",
        "やすみだから いつも おふろに はいります。",
      ],
      audioText: "やすみだから、いつも おふろに はいります",
    }),
    translateStep({
      id: "ja-m13-7-2-translate-2",
      promptEn: "I work from 9 to 6 from Monday to Friday.",
      acceptedAnswers: [
        "げつようびから きんようびまで くじから ろくじまで はたらきます",
        "げつようびから きんようびまで くじから ろくじまで はたらきます。",
      ],
      audioText: "げつようびから きんようびまで くじから ろくじまで はたらきます",
    }),
    speaking(
      "ja-m13-7-2-speak-4",
      "やすみだから、いつも おふろに はいります",
      "Because it's a day off, I always take a bath.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m13-7-2-rev-mcq-1", M13_7_2_REVIEW[0], M13_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m13-7-2-rev-lc-1",
      // Sentence-level review of みせ (M6) — 2026-07-12 listening backfill.
      audioText: "みせは じゅうじからです",
      correctMeaningEn: "The shop opens at 10.",
      distractorsEn: [
        "The shop closes at 10.",
        "The shop opens at 9.",
        "The school opens at 10.",
      ],
    }),
    speaking("ja-m13-7-2-rev-speak-1", M13_7_2_REVIEW[2].kana, M13_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m13-7-2-rev", M13_7_2_REVIEW),
    infoStep(
      "ja-m13-7-2-info-end",
      "You can now describe schedules, give reasons, and talk about your daily life in Japanese",
      "All of M13 mastered: twelve months, から...まで, だから, and five frequency adverbs — in full production.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M13_7_2.steps);
assertAnswerRotation(M13_7_2.steps, 1);
assertNoConsecutiveSame(M13_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

const ALL_M13 = [
  M13_1_1, M13_1_2, M13_2_1, M13_2_2, M13_3_1, M13_3_2,
  M13_4_1, M13_4_2, M13_5_1, M13_5_2, M13_6_1, M13_6_2,
  M13_STORY, M13_7_1, M13_7_2,
];

assertNoSameAnswerCluster(ALL_M13.flatMap((l) => l.steps));

// Passive-card lint
for (const lesson of ALL_M13) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
