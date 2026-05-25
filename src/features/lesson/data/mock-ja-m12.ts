/**
 * M12 — Time & Calendar (clock + days only — months deferred to M13).
 *
 * M12 introduces:
 *   - Clock time: 〜じ (hours), 〜ふん/ぷん (minutes)
 *   - Irregular hour readings: よじ (not よんじ), くじ (not きゅうじ), etc.
 *   - Days of the week: げつようび through にちようび
 *   - に (time marker): さんじに あいます (meet at 3:00)
 *   - Numbers 11-99: じゅういち, にじゅう, etc.
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * Key teaching points:
 *   - よじ (not よんじ), くじ (not きゅうじ) — irregular hour readings
 *   - ふん vs ぷん — voicing changes (いっぷん, さんぷん, ろっぷん, はっぷん, じゅっぷん)
 *   - に as time marker vs に as location marker (discrimination)
 *
 * ID scheme: ja-m12-{n}-{sub} e.g. ja-m12-1-1, ja-m12-1-2
 * Export names: M12_1_1, M12_1_2, M12_2_1, M12_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m12-1, etc.
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
const M12_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_CLOCK_HOURS = grammarRule({
  id: "ja-m12-rule-clock-hours",
  title: "〜じ — telling the hour",
  rule:
    "Attach じ to a number to say the hour. いちじ = 1 o'clock, にじ = 2 o'clock, etc. Watch out for irregulars: よじ (4:00, not よんじ), しちじ (7:00, not ななじ), くじ (9:00, not きゅうじ).",
  examples: [
    {
      ja: "いま いちじです。",
      romaji: "ima ichiji desu.",
      en: "It's 1 o'clock now.",
    },
    {
      ja: "よじに おきます。",
      romaji: "yoji ni okimasu.",
      en: "I wake up at 4 o'clock.",
    },
    {
      ja: "くじに がっこうに いきます。",
      romaji: "kuji ni gakkou ni ikimasu.",
      en: "I go to school at 9 o'clock.",
    },
  ],
  antiPattern: {
    ja: "よんじに おきます。",
    romaji: "yonji ni okimasu.",
    en: "(broken — 4 o'clock is よじ, not よんじ)",
    why: "Three hours have irregular readings: よじ (4), しちじ (7), くじ (9). These are sound changes inherited from native Japanese counting.",
  },
  cultureNote:
    "Japanese uses a 12-hour clock in conversation (with ごぜん/ごご for AM/PM) but 24-hour clock in timetables and schedules.",
});

const RULE_MINUTES = grammarRule({
  id: "ja-m12-rule-minutes",
  title: "〜ふん / 〜ぷん — telling minutes",
  rule:
    "Attach ふん or ぷん to a number for minutes. The consonant changes based on the preceding number: いっぷん (1), にふん (2), さんぷん (3), よんぷん (4), ごふん (5), ろっぷん (6), ななふん (7), はっぷん (8), きゅうふん (9), じゅっぷん (10). はん = half past (30 minutes).",
  examples: [
    {
      ja: "いま さんじ じゅっぷんです。",
      romaji: "ima sanji juppun desu.",
      en: "It's 3:10 now.",
    },
    {
      ja: "ごじはんに かえります。",
      romaji: "goji han ni kaerimasu.",
      en: "I go home at 5:30.",
    },
  ],
  antiPattern: {
    ja: "いちふんです。",
    romaji: "ichifun desu.",
    en: "(broken — 1 minute is いっぷん, not いちふん)",
    why: "Numbers 1, 3, 4, 6, 8, 10 trigger ぷん (with consonant doubling for 1, 6, 8, 10). The others use ふん.",
  },
});

const RULE_DAYS_OF_WEEK = grammarRule({
  id: "ja-m12-rule-days",
  title: "Days of the week — ようび",
  rule:
    "Each day ends in ようび. The first character comes from the classical elements: げつ (moon/Monday), か (fire/Tuesday), すい (water/Wednesday), もく (wood/Thursday), きん (gold/Friday), ど (earth/Saturday), にち (sun/Sunday).",
  examples: [
    {
      ja: "きょうは きんようびです。",
      romaji: "kyou wa kinyoubi desu.",
      en: "Today is Friday.",
    },
    {
      ja: "にちようびに やすみます。",
      romaji: "nichiyoubi ni yasumimasu.",
      en: "I rest on Sunday.",
    },
  ],
  antiPattern: {
    ja: "きょうは きんです。",
    romaji: "kyou wa kin desu.",
    en: "(broken — drop ようび and the meaning is lost)",
    why: "ようび is required — without it, きん just means 'gold/money.' Always use the full form: きんようび.",
  },
  cultureNote:
    "The seven elements map to celestial bodies: 月 (Moon), 火 (Mars), 水 (Mercury), 木 (Jupiter), 金 (Venus), 土 (Saturn), 日 (Sun) — same as many European languages.",
});

const RULE_NI_TIME = grammarRule({
  id: "ja-m12-rule-ni-time",
  title: "に — time marker particle",
  rule:
    "に marks a specific point in time: Xじに = 'at X o'clock,' Xようびに = 'on [day].' You already know に as a location/direction particle (がっこうに いきます). With time words, に works the same way — it pins the action to a specific moment.",
  examples: [
    {
      ja: "さんじに あいます。",
      romaji: "sanji ni aimasu.",
      en: "I'll meet (you) at 3 o'clock.",
    },
    {
      ja: "げつようびに にほんごを べんきょうします。",
      romaji: "getsuyoubi ni nihongo o benkyou shimasu.",
      en: "I study Japanese on Monday.",
    },
    {
      ja: "あした ろくじに おきます。",
      romaji: "ashita rokuji ni okimasu.",
      en: "Tomorrow I wake up at 6 o'clock.",
    },
  ],
  antiPattern: {
    ja: "さんじ あいます。",
    romaji: "sanji aimasu.",
    en: "(missing に — the time point isn't marked)",
    why: "Specific clock times and days of the week require に to connect them to the verb. Without に, the time word is floating.",
  },
  cultureNote:
    "Relative time words like あした (tomorrow), きょう (today), まいにち (every day) do NOT take に — they're already adverbial. Only specific points (clock + weekday) require it.",
});

const RULE_NUMBERS_11_99 = grammarRule({
  id: "ja-m12-rule-numbers-11-99",
  title: "Numbers 11-99 — compound counting",
  rule:
    "Numbers 11-99 combine the tens digit + ones digit: じゅういち (11), にじゅう (20), にじゅうさん (23), さんじゅう (30), etc. The tens multiplier uses the same number + じゅう: にじゅう = 2×10 = 20, さんじゅう = 3×10 = 30.",
  examples: [
    {
      ja: "じゅうごふんです。",
      romaji: "juugofun desu.",
      en: "It's 15 minutes.",
    },
    {
      ja: "にじゅっぷんまえに つきました。",
      romaji: "nijuppun mae ni tsukimashita.",
      en: "I arrived 20 minutes ago.",
    },
    {
      ja: "さんじ よんじゅうごふんです。",
      romaji: "sanji yonjuugofun desu.",
      en: "It's 3:45.",
    },
  ],
  antiPattern: {
    ja: "じゅうよんじです。",
    romaji: "juuyonji desu.",
    en: "(mixed up — 14 o'clock needs ごご にじ, not じゅうよんじ in conversation)",
    why: "In everyday conversation, use 12-hour + ごぜん/ごご. 24-hour notation (じゅうよんじ) is for train schedules and formal announcements.",
  },
});

// ═══════════════════════════════════════════════════════════════════════
// M12-1-1 — "What time?" (clock hours 1-6 + じ counter)
// ═══════════════════════════════════════════════════════════════════════

const M12_1_1_REVIEW = pickReviewAtoms("ja-m12-1-1-rev", M12_REVIEW_POOL, 4);

export const M12_1_1: LessonContent = {
  id: "ja-m12-1-1",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "What time? I",
  description:
    "Clock hours 1-6 with the じ counter. Learn to say and recognize basic clock times.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-1-1-info-open",
      "Telling time",
      "Numbers you already know + じ = clock time. いちじ, にじ, さんじ — you'll be reading clocks in Japanese by the end of this lesson.",
    ),
    RULE_CLOCK_HOURS,
    // ── いちじ (1 o'clock) ──
    build(
      "ja-m12-1-1-build-ichiji",
      "Pick the Japanese for: 1 o'clock",
      "いちじ",
      ["いちじ", "にじ", "さんじ", "ろくじ"],
      ["いちじ"],
    ),
    listeningCompSentence({
      id: "ja-m12-1-1-lc-ichiji",
      audioText: "いま いちじです",
      correctMeaningEn: "It's 1 o'clock now.",
      distractorsEn: [
        "It's 2 o'clock now.",
        "It's 6 o'clock now.",
        "It's 3 o'clock now.",
      ],
    }),
    // ── にじ (2 o'clock) ──
    build(
      "ja-m12-1-1-build-niji",
      "Pick the Japanese for: 2 o'clock",
      "にじ",
      ["にじ", "いちじ", "さんじ", "ごじ"],
      ["にじ"],
    ),
    vocabMcq(
      "ja-m12-1-1-mcq-niji",
      { kana: "にじ", meaningEn: "2 o'clock", emoji: "🕑", fromModule: "m12" },
      M12_REVIEW_POOL,
    ),
    // ── さんじ (3 o'clock) ──
    build(
      "ja-m12-1-1-build-sanji",
      "Pick the Japanese for: 3 o'clock",
      "さんじ",
      ["さんじ", "にじ", "よじ", "ごじ"],
      ["さんじ"],
    ),
    speaking("ja-m12-1-1-speak-sanji", "さんじ", "3 o'clock"),
    // ── よじ (4 o'clock — IRREGULAR) ──
    build(
      "ja-m12-1-1-build-yoji",
      "Pick the Japanese for: 4 o'clock (careful — irregular!)",
      "よじ",
      ["よじ", "よんじ", "しじ", "さんじ"],
      ["よじ"],
    ),
    listeningCompSentence({
      id: "ja-m12-1-1-lc-yoji",
      audioText: "よじです",
      correctMeaningEn: "It's 4 o'clock.",
      distractorsEn: [
        "It's 2 o'clock.",
        "It's 5 o'clock.",
        "It's 8 o'clock.",
      ],
    }),
    // ── ごじ (5 o'clock) ──
    build(
      "ja-m12-1-1-build-goji",
      "Pick the Japanese for: 5 o'clock",
      "ごじ",
      ["ごじ", "ろくじ", "にじ", "よじ"],
      ["ごじ"],
    ),
    // ── ろくじ (6 o'clock) ──
    build(
      "ja-m12-1-1-build-rokuji",
      "Pick the Japanese for: 6 o'clock",
      "ろくじ",
      ["ろくじ", "ごじ", "いちじ", "さんじ"],
      ["ろくじ"],
    ),
    sentenceMcq({
      id: "ja-m12-1-1-mcq-ima",
      prompt: "Which sentence means 'It's 5 o'clock now.'?",
      correctKana: "いま ごじです。",
      distractorsKana: [
        "いま ろくじです。",
        "いま よじです。",
        "いま にじです。",
      ],
      explanation: "ご = 5, じ = o'clock. いま = now.",
    }),
    listeningBuildSentence({
      id: "ja-m12-1-1-lb-sanji",
      target: "いま さんじです",
      tiles: ["いま", "さんじ", "です", "にじ", "よじ"],
      correctOrder: ["いま", "さんじ", "です"],
      promptEn: "Hear it, build it: 'It's 3 o'clock now.'",
    }),
    selfExplain({
      id: "ja-m12-1-1-self-explain",
      anchorLabel: "You built: よじ (4 o'clock)",
      anchorAudioText: "よじです",
      question: "Why よじ instead of よんじ?",
      rule: { text: "4 o'clock has an irregular reading: よじ. The regular よん changes to よ before じ." },
      surface: { text: "よんじ sounds more polite than よじ." },
      distractor: { text: "よじ is only used in the morning; よんじ is for afternoon." },
      ruleExplanation:
        "Three hours have irregular readings: よじ (4), しちじ (7), くじ (9). These are fixed — there's no polite/casual distinction.",
    }),
    speaking(
      "ja-m12-1-1-speak-goji",
      "いま ごじです",
      "It's 5 o'clock now.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-1-1-rev-mcq-1", M12_1_1_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-1-1-rev-lc-1",
      audioText: M12_1_1_REVIEW[1].kana,
      correctMeaningEn: M12_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_1_1_REVIEW[2].meaningEn,
        M12_1_1_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m12-1-1-rev-speak-1", M12_1_1_REVIEW[2].kana, M12_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-1-1-rev", M12_1_1_REVIEW),
    infoStep(
      "ja-m12-1-1-info-end",
      "You can now tell time for hours 1-6 in Japanese",
      "いちじ through ろくじ — plus the important irregular よじ (not よんじ).",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_1_1.steps);
assertAnswerRotation(M12_1_1.steps, 1);
assertNoConsecutiveSame(M12_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-1-2 — "What time?" practice (drill hours 1-6)
// ═══════════════════════════════════════════════════════════════════════

const M12_1_2_REVIEW = pickReviewAtoms("ja-m12-1-2-rev", M12_REVIEW_POOL, 4);

export const M12_1_2: LessonContent = {
  id: "ja-m12-1-2",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "What time? II",
  description:
    "Drill clock hours 1-6 with sentence production and listening comprehension.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-1-2-info-open",
      "Clock practice",
      "Quick-fire drills on hours 1-6. Can you hear the difference between にじ, さんじ, and よじ?",
    ),
    // ── Mixed hour drills ──
    build(
      "ja-m12-1-2-build-rokuji-desu",
      "Say: It's 6 o'clock.",
      "ろくじです",
      ["ろくじ", "です", "ごじ", "いちじ"],
      ["ろくじ", "です"],
    ),
    listeningCompSentence({
      id: "ja-m12-1-2-lc-yoji",
      audioText: "いま よじです",
      correctMeaningEn: "It's 4 o'clock now.",
      distractorsEn: [
        "It's 2 o'clock now.",
        "It's 6 o'clock now.",
        "It's 5 o'clock now.",
      ],
    }),
    sentenceMcq({
      id: "ja-m12-1-2-mcq-niji",
      prompt: "Which sentence means 'It's 2 o'clock now.'?",
      correctKana: "いま にじです。",
      distractorsKana: [
        "いま さんじです。",
        "いま よじです。",
        "いま ごじです。",
      ],
      explanation: "にじ = 2 o'clock.",
    }),
    build(
      "ja-m12-1-2-build-ima-ichiji",
      "Say: It's 1 o'clock now.",
      "いま いちじです",
      ["いま", "いちじ", "です", "にじ", "さんじ"],
      ["いま", "いちじ", "です"],
    ),
    listeningCompSentence({
      id: "ja-m12-1-2-lc-goji",
      audioText: "ごじです",
      correctMeaningEn: "It's 5 o'clock.",
      distractorsEn: [
        "It's 6 o'clock.",
        "It's 3 o'clock.",
        "It's 1 o'clock.",
      ],
    }),
    speaking("ja-m12-1-2-speak-yoji", "よじです", "It's 4 o'clock."),
    build(
      "ja-m12-1-2-build-sanji-desu",
      "Say: It's 3 o'clock now.",
      "いま さんじです",
      ["いま", "さんじ", "です", "よじ", "ろくじ"],
      ["いま", "さんじ", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m12-1-2-lb-rokuji",
      target: "いま ろくじです",
      tiles: ["いま", "ろくじ", "です", "ごじ", "さんじ"],
      correctOrder: ["いま", "ろくじ", "です"],
      promptEn: "Hear it, build it: 'It's 6 o'clock now.'",
    }),
    sentenceMcq({
      id: "ja-m12-1-2-mcq-yoji",
      prompt: "Which is the CORRECT way to say 4 o'clock?",
      correctKana: "よじ",
      distractorsKana: ["よんじ", "しじ", "しちじ"],
      explanation: "4 o'clock is よじ — an irregular reading. しちじ is 7 o'clock.",
    }),
    translateStep({
      id: "ja-m12-1-2-translate",
      promptEn: "It's 5 o'clock now.",
      acceptedAnswers: ["いま ごじです", "いまごじです"],
      audioText: "いま ごじです",
    }),
    listeningCompSentence({
      id: "ja-m12-1-2-lc-sanji",
      audioText: "いま さんじです",
      correctMeaningEn: "It's 3 o'clock now.",
      distractorsEn: [
        "It's 4 o'clock now.",
        "It's 1 o'clock now.",
        "It's 6 o'clock now.",
      ],
    }),
    selfExplain({
      id: "ja-m12-1-2-self-explain",
      anchorLabel: "You've been telling time: いちじ, にじ, さんじ...",
      anchorAudioText: "いま さんじです",
      question: "To say the hour in Japanese, you add...?",
      rule: { text: "じ after the number — number + じ = o'clock." },
      surface: { text: "じかん after the number — number + じかん = o'clock." },
      distractor: { text: "とき after the number — number + とき = o'clock." },
      ruleExplanation:
        "じ is the counter for clock hours. じかん means 'hour(s) of duration' — different concept. とき means 'time/when' (abstract).",
    }),
    speaking(
      "ja-m12-1-2-speak-rokuji",
      "いま ろくじです",
      "It's 6 o'clock now.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-1-2-rev-mcq-1", M12_1_2_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-1-2-rev-lc-1",
      audioText: M12_1_2_REVIEW[1].kana,
      correctMeaningEn: M12_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_1_2_REVIEW[2].meaningEn,
        M12_1_2_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[1].meaningEn,
      ],
    }),
    speaking("ja-m12-1-2-rev-speak-1", M12_1_2_REVIEW[2].kana, M12_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-1-2-rev", M12_1_2_REVIEW),
    infoStep(
      "ja-m12-1-2-info-end",
      "You can now say any hour from 1-6 on the clock",
      "Hours 1-6 drilled — いちじ through ろくじ, with the irregular よじ locked in.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_1_2.steps);
assertAnswerRotation(M12_1_2.steps, 1);
assertNoConsecutiveSame(M12_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-2-1 — "Hours 7-12" (clock hours 7-12 + irregular readings)
// ═══════════════════════════════════════════════════════════════════════

const M12_2_1_REVIEW = pickReviewAtoms("ja-m12-2-1-rev", M12_REVIEW_POOL, 4);

export const M12_2_1: LessonContent = {
  id: "ja-m12-2-1",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Hours 7-12 I",
  description:
    "Clock hours 7-12 with two more irregulars: しちじ (7) and くじ (9).",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-2-1-info-open",
      "The rest of the clock",
      "Hours 7-12 complete the clock face. Two more irregulars to watch: しちじ (7) and くじ (9).",
    ),
    // ── しちじ (7 o'clock — IRREGULAR) ──
    build(
      "ja-m12-2-1-build-shichiji",
      "Pick the Japanese for: 7 o'clock (irregular!)",
      "しちじ",
      ["しちじ", "ななじ", "ろくじ", "はちじ"],
      ["しちじ"],
    ),
    listeningCompSentence({
      id: "ja-m12-2-1-lc-shichiji",
      audioText: "しちじです",
      correctMeaningEn: "It's 7 o'clock.",
      distractorsEn: [
        "It's 1 o'clock.",
        "It's 4 o'clock.",
        "It's 8 o'clock.",
      ],
    }),
    // ── はちじ (8 o'clock) ──
    build(
      "ja-m12-2-1-build-hachiji",
      "Pick the Japanese for: 8 o'clock",
      "はちじ",
      ["はちじ", "しちじ", "ろくじ", "くじ"],
      ["はちじ"],
    ),
    speaking("ja-m12-2-1-speak-hachiji", "はちじ", "8 o'clock"),
    // ── くじ (9 o'clock — IRREGULAR) ──
    build(
      "ja-m12-2-1-build-kuji",
      "Pick the Japanese for: 9 o'clock (irregular!)",
      "くじ",
      ["くじ", "きゅうじ", "はちじ", "じゅうじ"],
      ["くじ"],
    ),
    listeningCompSentence({
      id: "ja-m12-2-1-lc-kuji",
      audioText: "いま くじです",
      correctMeaningEn: "It's 9 o'clock now.",
      distractorsEn: [
        "It's 8 o'clock now.",
        "It's 10 o'clock now.",
        "It's 7 o'clock now.",
      ],
    }),
    // ── じゅうじ (10 o'clock) ──
    build(
      "ja-m12-2-1-build-juuji",
      "Pick the Japanese for: 10 o'clock",
      "じゅうじ",
      ["じゅうじ", "くじ", "じゅういちじ", "はちじ"],
      ["じゅうじ"],
    ),
    vocabMcq(
      "ja-m12-2-1-mcq-juuji",
      { kana: "じゅうじ", meaningEn: "10 o'clock", emoji: "🕙", fromModule: "m12" },
      M12_REVIEW_POOL,
    ),
    // ── じゅういちじ (11 o'clock) ──
    build(
      "ja-m12-2-1-build-juuichiji",
      "Pick the Japanese for: 11 o'clock",
      "じゅういちじ",
      ["じゅういちじ", "じゅうにじ", "じゅうじ", "いちじ"],
      ["じゅういちじ"],
    ),
    // ── じゅうにじ (12 o'clock) ──
    build(
      "ja-m12-2-1-build-juuniji",
      "Pick the Japanese for: 12 o'clock",
      "じゅうにじ",
      ["じゅうにじ", "じゅういちじ", "にじ", "じゅうじ"],
      ["じゅうにじ"],
    ),
    sentenceMcq({
      id: "ja-m12-2-1-mcq-kuji",
      prompt: "Which is the CORRECT way to say 9 o'clock?",
      correctKana: "くじ",
      distractorsKana: ["きゅうじ", "ここのじ", "しちじ"],
      explanation: "9 o'clock is くじ — an irregular reading, not きゅうじ.",
    }),
    listeningBuildSentence({
      id: "ja-m12-2-1-lb-juuji",
      target: "いま じゅうじです",
      tiles: ["いま", "じゅうじ", "です", "くじ", "はちじ"],
      correctOrder: ["いま", "じゅうじ", "です"],
      promptEn: "Hear it, build it: 'It's 10 o'clock now.'",
    }),
    selfExplain({
      id: "ja-m12-2-1-self-explain",
      anchorLabel: "You learned: しちじ (7) and くじ (9)",
      anchorAudioText: "くじです",
      question: "Why くじ instead of きゅうじ for 9 o'clock?",
      rule: { text: "9 o'clock has an irregular reading: くじ. きゅう changes to く before じ." },
      surface: { text: "きゅうじ is used in formal situations; くじ is casual." },
      distractor: { text: "くじ is 9 AM; きゅうじ is 9 PM." },
      ruleExplanation:
        "The three irregular hours (よじ, しちじ, くじ) have fixed readings regardless of context or formality.",
    }),
    speaking(
      "ja-m12-2-1-speak-juuniji",
      "いま じゅうにじです",
      "It's 12 o'clock now.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-2-1-rev-mcq-1", M12_2_1_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-2-1-rev-lc-1",
      audioText: M12_2_1_REVIEW[1].kana,
      correctMeaningEn: M12_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_2_1_REVIEW[2].meaningEn,
        M12_2_1_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[2].meaningEn,
      ],
    }),
    speaking("ja-m12-2-1-rev-speak-1", M12_2_1_REVIEW[2].kana, M12_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-2-1-rev", M12_2_1_REVIEW),
    infoStep(
      "ja-m12-2-1-info-end",
      "You can now say every hour on the clock",
      "しちじ (7), はちじ (8), くじ (9), じゅうじ (10), じゅういちじ (11), じゅうにじ (12) — the full clock face.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_2_1.steps);
assertAnswerRotation(M12_2_1.steps, 1);
assertNoConsecutiveSame(M12_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-2-2 — "Hours 7-12" practice
// ═══════════════════════════════════════════════════════════════════════

const M12_2_2_REVIEW = pickReviewAtoms("ja-m12-2-2-rev", M12_REVIEW_POOL, 4);

export const M12_2_2: LessonContent = {
  id: "ja-m12-2-2",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Hours 7-12 II",
  description:
    "Drill all 12 hours with mixed recognition and production. Focus on the three irregulars.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-2-2-info-open",
      "Full clock drill",
      "All 12 hours, mixed up. Pay special attention to よじ, しちじ, and くじ — the three irregulars.",
    ),
    // ── Mixed drills across all 12 hours ──
    listeningCompSentence({
      id: "ja-m12-2-2-lc-shichiji",
      audioText: "いま しちじです",
      correctMeaningEn: "It's 7 o'clock now.",
      distractorsEn: [
        "It's 1 o'clock now.",
        "It's 4 o'clock now.",
        "It's 11 o'clock now.",
      ],
    }),
    build(
      "ja-m12-2-2-build-kuji",
      "Say: It's 9 o'clock now.",
      "いま くじです",
      ["いま", "くじ", "です", "きゅうじ", "はちじ"],
      ["いま", "くじ", "です"],
    ),
    sentenceMcq({
      id: "ja-m12-2-2-mcq-juuichiji",
      prompt: "Which sentence means 'It's 11 o'clock.'?",
      correctKana: "じゅういちじです。",
      distractorsKana: [
        "じゅうにじです。",
        "いちじです。",
        "じゅうじです。",
      ],
      explanation: "じゅういち = 11, じ = o'clock.",
    }),
    listeningCompSentence({
      id: "ja-m12-2-2-lc-yoji",
      audioText: "よじです",
      correctMeaningEn: "It's 4 o'clock.",
      distractorsEn: [
        "It's 9 o'clock.",
        "It's 7 o'clock.",
        "It's 2 o'clock.",
      ],
    }),
    build(
      "ja-m12-2-2-build-juuniji",
      "Say: It's 12 o'clock now.",
      "いま じゅうにじです",
      ["いま", "じゅうにじ", "です", "じゅうじ", "にじ"],
      ["いま", "じゅうにじ", "です"],
    ),
    speaking("ja-m12-2-2-speak-shichiji", "いま しちじです", "It's 7 o'clock now."),
    listeningBuildSentence({
      id: "ja-m12-2-2-lb-hachiji",
      target: "いま はちじです",
      tiles: ["いま", "はちじ", "です", "しちじ", "くじ"],
      correctOrder: ["いま", "はちじ", "です"],
      promptEn: "Hear it, build it: 'It's 8 o'clock now.'",
    }),
    sentenceMcq({
      id: "ja-m12-2-2-mcq-irregulars",
      prompt: "Which set contains ALL THREE irregular hour readings?",
      correctKana: "よじ、しちじ、くじ",
      distractorsKana: [
        "よんじ、しちじ、くじ",
        "よじ、ななじ、くじ",
        "よじ、しちじ、きゅうじ",
      ],
      explanation: "よじ (4), しちじ (7), くじ (9) — all three use irregular readings.",
    }),
    build(
      "ja-m12-2-2-build-goji",
      "Say: It's 5 o'clock.",
      "ごじです",
      ["ごじ", "です", "ろくじ", "さんじ"],
      ["ごじ", "です"],
    ),
    translateStep({
      id: "ja-m12-2-2-translate",
      promptEn: "It's 9 o'clock now.",
      acceptedAnswers: ["いま くじです", "いまくじです"],
      audioText: "いま くじです",
    }),
    listeningCompSentence({
      id: "ja-m12-2-2-lc-juuji",
      audioText: "じゅうじです",
      correctMeaningEn: "It's 10 o'clock.",
      distractorsEn: [
        "It's 12 o'clock.",
        "It's 2 o'clock.",
        "It's 11 o'clock.",
      ],
    }),
    selfExplain({
      id: "ja-m12-2-2-self-explain",
      anchorLabel: "You've drilled all 12 hours on the clock",
      anchorAudioText: "しちじです",
      question: "What are the three irregular hour readings?",
      rule: { text: "よじ (4), しちじ (7), くじ (9) — these don't follow the regular number + じ pattern." },
      surface: { text: "いちじ (1), よじ (4), じゅうじ (10) — the first, middle, and last hours." },
      distractor: { text: "にじ (2), ごじ (5), はちじ (8) — the even-numbered hours." },
      ruleExplanation:
        "Only 4, 7, and 9 change their number reading before じ. All other hours use the standard number.",
    }),
    speaking(
      "ja-m12-2-2-speak-juuichiji",
      "いま じゅういちじです",
      "It's 11 o'clock now.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-2-2-rev-mcq-1", M12_2_2_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-2-2-rev-lc-1",
      audioText: M12_2_2_REVIEW[1].kana,
      correctMeaningEn: M12_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_2_2_REVIEW[2].meaningEn,
        M12_2_2_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[3].meaningEn,
      ],
    }),
    speaking("ja-m12-2-2-rev-speak-1", M12_2_2_REVIEW[2].kana, M12_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-2-2-rev", M12_2_2_REVIEW),
    infoStep(
      "ja-m12-2-2-info-end",
      "You can now read any hour on a Japanese clock",
      "All 12 hours mastered — including the three irregulars: よじ (4), しちじ (7), くじ (9).",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_2_2.steps);
assertAnswerRotation(M12_2_2.steps, 1);
assertNoConsecutiveSame(M12_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-3-1 — "Minutes" intro (ふん/ぷん + はん + ごぜん/ごご)
// ═══════════════════════════════════════════════════════════════════════

const M12_3_1_REVIEW = pickReviewAtoms("ja-m12-3-1-rev", M12_REVIEW_POOL, 4);

export const M12_3_1: LessonContent = {
  id: "ja-m12-3-1",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Minutes I",
  description:
    "Minutes (ふん/ぷん), half past (はん), AM/PM (ごぜん/ごご).",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-3-1-info-open",
      "Adding minutes to the clock",
      "Hours alone are rough. Add ふん/ぷん for minutes, はん for :30, and ごぜん/ごご for AM/PM — now you can give exact times.",
    ),
    RULE_MINUTES,
    // ── はん (half past / :30) ──
    build(
      "ja-m12-3-1-build-han",
      "Pick the Japanese for: Half past (30 minutes)",
      "はん",
      ["はん", "ふん", "ぷん", "じ"],
      ["はん"],
    ),
    listeningCompSentence({
      id: "ja-m12-3-1-lc-sanjihan",
      audioText: "さんじはんです",
      correctMeaningEn: "It's 3:30.",
      distractorsEn: [
        "It's 3 o'clock.",
        "It's 30 minutes.",
        "It's 3:03.",
      ],
    }),
    // ── ごぜん (AM) ──
    build(
      "ja-m12-3-1-build-gozen",
      "Pick the Japanese for: AM (morning hours)",
      "ごぜん",
      ["ごぜん", "ごご", "あさ", "ひる"],
      ["ごぜん"],
    ),
    speaking("ja-m12-3-1-speak-gozen", "ごぜん くじ", "9 AM"),
    // ── ごご (PM) ──
    build(
      "ja-m12-3-1-build-gogo",
      "Pick the Japanese for: PM (afternoon hours)",
      "ごご",
      ["ごご", "ごぜん", "よる", "ばん"],
      ["ごご"],
    ),
    listeningCompSentence({
      id: "ja-m12-3-1-lc-gogo-sanji",
      audioText: "ごご さんじです",
      correctMeaningEn: "It's 3 PM.",
      distractorsEn: [
        "It's 3 AM.",
        "It's 3:30.",
        "It's the afternoon.",
      ],
    }),
    // ── ごふん (5 minutes — regular ふん) ──
    build(
      "ja-m12-3-1-build-gofun",
      "Say: 5 minutes",
      "ごふん",
      ["ごふん", "ごぷん", "さんぷん", "いっぷん"],
      ["ごふん"],
    ),
    // ── じゅっぷん (10 minutes — irregular ぷん) ──
    build(
      "ja-m12-3-1-build-juppun",
      "Say: 10 minutes",
      "じゅっぷん",
      ["じゅっぷん", "じゅうふん", "ごふん", "にふん"],
      ["じゅっぷん"],
    ),
    sentenceMcq({
      id: "ja-m12-3-1-mcq-gojihan",
      prompt: "Which sentence means 'It's 5:30 PM.'?",
      correctKana: "ごご ごじはんです。",
      distractorsKana: [
        "ごぜん ごじはんです。",
        "ごご ごじです。",
        "ごご ごじごふんです。",
      ],
      explanation: "ごご = PM, ごじ = 5 o'clock, はん = :30.",
    }),
    build(
      "ja-m12-3-1-build-gozen-shichiji",
      "Say: 7 AM.",
      "ごぜん しちじ",
      ["ごぜん", "しちじ", "ごご", "ななじ", "くじ"],
      ["ごぜん", "しちじ"],
    ),
    listeningBuildSentence({
      id: "ja-m12-3-1-lb-gogo-kuji",
      target: "ごご くじです",
      tiles: ["ごご", "くじ", "です", "ごぜん", "はちじ"],
      correctOrder: ["ごご", "くじ", "です"],
      promptEn: "Hear it, build it: 'It's 9 PM.'",
    }),
    selfExplain({
      id: "ja-m12-3-1-self-explain",
      anchorLabel: "You used: ごぜん / ごご for AM/PM",
      anchorAudioText: "ごご さんじです",
      question: "Where does ごぜん/ごご go relative to the hour?",
      rule: { text: "BEFORE the hour: ごご さんじ = '3 PM.' The AM/PM marker comes first." },
      surface: { text: "AFTER the hour: さんじ ごご = '3 PM.' The hour comes first like in English." },
      distractor: { text: "Either position works — ごご さんじ and さんじ ごご mean the same thing." },
      ruleExplanation:
        "Japanese puts the AM/PM marker before the time: ごぜん くじ = '9 AM.' This is the opposite of English word order.",
    }),
    speaking(
      "ja-m12-3-1-speak-gogo-goji-han",
      "ごご ごじはんです",
      "It's 5:30 PM.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-3-1-rev-mcq-1", M12_3_1_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-3-1-rev-lc-1",
      audioText: M12_3_1_REVIEW[1].kana,
      correctMeaningEn: M12_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_3_1_REVIEW[2].meaningEn,
        M12_3_1_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[4].meaningEn,
      ],
    }),
    speaking("ja-m12-3-1-rev-speak-1", M12_3_1_REVIEW[2].kana, M12_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-3-1-rev", M12_3_1_REVIEW),
    infoStep(
      "ja-m12-3-1-info-end",
      "You can now give exact times with minutes, AM, and PM",
      "はん for :30, ふん/ぷん for minutes, ごぜん/ごご for AM/PM — the full time-telling toolkit.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_3_1.steps);
assertAnswerRotation(M12_3_1.steps, 1);
assertNoConsecutiveSame(M12_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-3-2 — "Minutes" practice
// ═══════════════════════════════════════════════════════════════════════

const M12_3_2_REVIEW = pickReviewAtoms("ja-m12-3-2-rev", M12_REVIEW_POOL, 4);

export const M12_3_2: LessonContent = {
  id: "ja-m12-3-2",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Minutes II",
  description:
    "Drill ふん vs ぷん voicing, はん, and ごぜん/ごご in complete time expressions.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-3-2-info-open",
      "Minute drills",
      "ふん or ぷん? The voicing change trips up everyone at first. Drill it until it's automatic.",
    ),
    // ── ふん vs ぷん discrimination ──
    sentenceMcq({
      id: "ja-m12-3-2-mcq-ippun",
      prompt: "Which is the correct way to say '1 minute'?",
      correctKana: "いっぷん",
      distractorsKana: ["いちふん", "いちぷん", "いっふん"],
      explanation: "1 minute = いっぷん. The いち doubles to いっ and triggers ぷん.",
    }),
    build(
      "ja-m12-3-2-build-sanpun",
      "Say: 3 minutes",
      "さんぷん",
      ["さんぷん", "さんふん", "ごふん", "にふん"],
      ["さんぷん"],
    ),
    listeningCompSentence({
      id: "ja-m12-3-2-lc-roppun",
      audioText: "ろっぷん",
      correctMeaningEn: "6 minutes",
      distractorsEn: [
        "6 o'clock",
        "3 minutes",
        "10 minutes",
      ],
    }),
    build(
      "ja-m12-3-2-build-happun",
      "Say: 8 minutes",
      "はっぷん",
      ["はっぷん", "はちふん", "ろっぷん", "じゅっぷん"],
      ["はっぷん"],
    ),
    speaking("ja-m12-3-2-speak-juppun", "じゅっぷん", "10 minutes"),
    // ── Full time expressions ──
    build(
      "ja-m12-3-2-build-sanji-juppun",
      "Say: It's 3:10.",
      "さんじ じゅっぷんです",
      ["さんじ", "じゅっぷん", "です", "ごふん", "にじ"],
      ["さんじ", "じゅっぷん", "です"],
    ),
    listeningCompSentence({
      id: "ja-m12-3-2-lc-gogo-yoji-han",
      audioText: "ごご よじはんです",
      correctMeaningEn: "It's 4:30 PM.",
      distractorsEn: [
        "It's 4:30 AM.",
        "It's 4 PM.",
        "It's 9:30 PM.",
      ],
    }),
    sentenceMcq({
      id: "ja-m12-3-2-mcq-gozen-hachiji",
      prompt: "Which sentence means 'It's 8:05 AM.'?",
      correctKana: "ごぜん はちじ ごふんです。",
      distractorsKana: [
        "ごご はちじ ごふんです。",
        "ごぜん はちじはんです。",
        "ごぜん はちじ ごぷんです。",
      ],
      explanation: "ごぜん = AM, はちじ = 8 o'clock, ごふん = 5 minutes (ふん, not ぷん after ご).",
    }),
    build(
      "ja-m12-3-2-build-gozen-rokuji-han",
      "Say: 6:30 AM.",
      "ごぜん ろくじはん",
      ["ごぜん", "ろくじ", "はん", "ごご", "はちじ"],
      ["ごぜん", "ろくじ", "はん"],
    ),
    listeningBuildSentence({
      id: "ja-m12-3-2-lb-gogo-niji-juppun",
      target: "ごご にじ じゅっぷんです",
      tiles: ["ごご", "にじ", "じゅっぷん", "です", "ごぜん", "さんじ"],
      correctOrder: ["ごご", "にじ", "じゅっぷん", "です"],
      promptEn: "Hear it, build it: 'It's 2:10 PM.'",
    }),
    translateStep({
      id: "ja-m12-3-2-translate",
      promptEn: "It's 3:30 PM.",
      acceptedAnswers: ["ごご さんじはんです", "ごごさんじはんです"],
      audioText: "ごご さんじはんです",
    }),
    listeningCompSentence({
      id: "ja-m12-3-2-lc-gozen-kuji-han",
      audioText: "ごぜん くじはんです",
      correctMeaningEn: "It's 9:30 AM.",
      distractorsEn: [
        "It's 9:30 PM.",
        "It's 9 AM.",
        "It's 4:30 AM.",
      ],
    }),
    selfExplain({
      id: "ja-m12-3-2-self-explain",
      anchorLabel: "You drilled: いっぷん, さんぷん, ろっぷん, はっぷん, じゅっぷん",
      anchorAudioText: "ろっぷん",
      question: "Which numbers trigger ぷん instead of ふん?",
      rule: { text: "1, 3, 4, 6, 8, 10 → ぷん. Numbers 2, 5, 7, 9 → ふん." },
      surface: { text: "Even numbers use ぷん; odd numbers use ふん." },
      distractor: { text: "All numbers above 5 use ぷん; 1-5 use ふん." },
      ruleExplanation:
        "The split isn't even/odd — it's about the final sound of the number. Numbers ending in certain consonants trigger the voicing change to ぷん.",
    }),
    speaking(
      "ja-m12-3-2-speak-gozen",
      "ごぜん しちじ ごふんです",
      "It's 7:05 AM.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-3-2-rev-mcq-1", M12_3_2_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-3-2-rev-lc-1",
      audioText: M12_3_2_REVIEW[1].kana,
      correctMeaningEn: M12_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_3_2_REVIEW[2].meaningEn,
        M12_3_2_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[5].meaningEn,
      ],
    }),
    speaking("ja-m12-3-2-rev-speak-1", M12_3_2_REVIEW[2].kana, M12_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-3-2-rev", M12_3_2_REVIEW),
    infoStep(
      "ja-m12-3-2-info-end",
      "You can now express exact times with minutes and AM/PM",
      "ふん vs ぷん locked in. ごぜん/ごご + hours + minutes — full time expressions.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_3_2.steps);
assertAnswerRotation(M12_3_2.steps, 1);
assertNoConsecutiveSame(M12_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-4-1 — "Days of the week" intro (7 days)
// ═══════════════════════════════════════════════════════════════════════

const M12_4_1_REVIEW = pickReviewAtoms("ja-m12-4-1-rev", M12_REVIEW_POOL, 4);

export const M12_4_1: LessonContent = {
  id: "ja-m12-4-1",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Days of the week I",
  description:
    "All seven days of the week, from げつようび (Monday) to にちようび (Sunday).",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-4-1-info-open",
      "Seven days",
      "Moon, fire, water, wood, gold, earth, sun — each element names a day. Seven words, one pattern: [element] + ようび.",
    ),
    RULE_DAYS_OF_WEEK,
    // ── げつようび (Monday) ──
    build(
      "ja-m12-4-1-build-getsu",
      "Pick the Japanese for: Monday",
      "げつようび",
      ["げつようび", "かようび", "すいようび", "にちようび"],
      ["げつようび"],
    ),
    listeningCompSentence({
      id: "ja-m12-4-1-lc-getsu",
      audioText: "げつようび",
      correctMeaningEn: "Monday",
      distractorsEn: ["Tuesday", "Sunday", "Friday"],
    }),
    // ── かようび (Tuesday) ──
    build(
      "ja-m12-4-1-build-ka",
      "Pick the Japanese for: Tuesday",
      "かようび",
      ["かようび", "げつようび", "もくようび", "きんようび"],
      ["かようび"],
    ),
    speaking("ja-m12-4-1-speak-ka", "かようび", "Tuesday"),
    // ── すいようび (Wednesday) ──
    build(
      "ja-m12-4-1-build-sui",
      "Pick the Japanese for: Wednesday",
      "すいようび",
      ["すいようび", "かようび", "もくようび", "げつようび"],
      ["すいようび"],
    ),
    listeningCompSentence({
      id: "ja-m12-4-1-lc-sui",
      audioText: "すいようび",
      correctMeaningEn: "Wednesday",
      distractorsEn: ["Thursday", "Tuesday", "Saturday"],
    }),
    // ── もくようび (Thursday) ──
    build(
      "ja-m12-4-1-build-moku",
      "Pick the Japanese for: Thursday",
      "もくようび",
      ["もくようび", "すいようび", "きんようび", "どようび"],
      ["もくようび"],
    ),
    // ── きんようび (Friday) ──
    build(
      "ja-m12-4-1-build-kin",
      "Pick the Japanese for: Friday",
      "きんようび",
      ["きんようび", "もくようび", "げつようび", "どようび"],
      ["きんようび"],
    ),
    vocabMcq(
      "ja-m12-4-1-mcq-kin",
      { kana: "きんようび", meaningEn: "Friday", emoji: "📅", fromModule: "m12" },
      M12_REVIEW_POOL,
    ),
    // ── どようび (Saturday) ──
    build(
      "ja-m12-4-1-build-do",
      "Pick the Japanese for: Saturday",
      "どようび",
      ["どようび", "にちようび", "きんようび", "かようび"],
      ["どようび"],
    ),
    // ── にちようび (Sunday) ──
    build(
      "ja-m12-4-1-build-nichi",
      "Pick the Japanese for: Sunday",
      "にちようび",
      ["にちようび", "どようび", "げつようび", "すいようび"],
      ["にちようび"],
    ),
    sentenceMcq({
      id: "ja-m12-4-1-mcq-kyou",
      prompt: "Which sentence means 'Today is Wednesday.'?",
      correctKana: "きょうは すいようびです。",
      distractorsKana: [
        "きょうは もくようびです。",
        "きょうは かようびです。",
        "あしたは すいようびです。",
      ],
      explanation: "きょう = today, すいようび = Wednesday.",
    }),
    listeningBuildSentence({
      id: "ja-m12-4-1-lb-kinyoubi",
      target: "きょうは きんようびです",
      tiles: ["きょう", "は", "きんようび", "です", "もくようび", "どようび"],
      correctOrder: ["きょう", "は", "きんようび", "です"],
      promptEn: "Hear it, build it: 'Today is Friday.'",
    }),
    selfExplain({
      id: "ja-m12-4-1-self-explain",
      anchorLabel: "You learned all 7 days: げつ/か/すい/もく/きん/ど/にち + ようび",
      anchorAudioText: "きょうは きんようびです",
      question: "What does every day of the week end with?",
      rule: { text: "ようび — each day is [element] + ようび." },
      surface: { text: "にち — each day ends with にち because にち means 'day.'" },
      distractor: { text: "び — each day ends with び, a shortened form of 'day.'" },
      ruleExplanation:
        "ようび is the full suffix. にち means 'sun/day' (にちようび = Sunday), but it's not the shared ending — ようび is.",
    }),
    speaking(
      "ja-m12-4-1-speak-nichiyoubi",
      "きょうは にちようびです",
      "Today is Sunday.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-4-1-rev-mcq-1", M12_4_1_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-4-1-rev-lc-1",
      audioText: M12_4_1_REVIEW[1].kana,
      correctMeaningEn: M12_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_4_1_REVIEW[2].meaningEn,
        M12_4_1_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[6].meaningEn,
      ],
    }),
    speaking("ja-m12-4-1-rev-speak-1", M12_4_1_REVIEW[2].kana, M12_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-4-1-rev", M12_4_1_REVIEW),
    infoStep(
      "ja-m12-4-1-info-end",
      "You can now name every day of the week in Japanese",
      "げつようび through にちようび — seven days, seven elements, one pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_4_1.steps);
assertAnswerRotation(M12_4_1.steps, 1);
assertNoConsecutiveSame(M12_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-4-2 — "Days of the week" practice
// ═══════════════════════════════════════════════════════════════════════

const M12_4_2_REVIEW = pickReviewAtoms("ja-m12-4-2-rev", M12_REVIEW_POOL, 4);

export const M12_4_2: LessonContent = {
  id: "ja-m12-4-2",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Days of the week II",
  description:
    "Drill all seven days with sentences about daily life and scheduling.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-4-2-info-open",
      "Day drill",
      "Can you hear the difference between もくようび and きんようび? Drill all seven days in context.",
    ),
    // ── Mixed day drills ──
    listeningCompSentence({
      id: "ja-m12-4-2-lc-getsu",
      audioText: "あしたは げつようびです",
      correctMeaningEn: "Tomorrow is Monday.",
      distractorsEn: [
        "Today is Monday.",
        "Tomorrow is Tuesday.",
        "Tomorrow is Sunday.",
      ],
    }),
    build(
      "ja-m12-4-2-build-ashita-ka",
      "Say: Tomorrow is Tuesday.",
      "あしたは かようびです",
      ["あした", "は", "かようび", "です", "すいようび", "きょう"],
      ["あした", "は", "かようび", "です"],
    ),
    sentenceMcq({
      id: "ja-m12-4-2-mcq-doyoubi",
      prompt: "Which sentence means 'Today is Saturday.'?",
      correctKana: "きょうは どようびです。",
      distractorsKana: [
        "きょうは にちようびです。",
        "きょうは きんようびです。",
        "あしたは どようびです。",
      ],
      explanation: "どようび = Saturday.",
    }),
    build(
      "ja-m12-4-2-build-kyou-moku",
      "Say: Today is Thursday.",
      "きょうは もくようびです",
      ["きょう", "は", "もくようび", "です", "きんようび", "すいようび"],
      ["きょう", "は", "もくようび", "です"],
    ),
    listeningCompSentence({
      id: "ja-m12-4-2-lc-nichiyoubi",
      audioText: "にちようびに やすみます",
      correctMeaningEn: "I rest on Sunday.",
      distractorsEn: [
        "I rest on Saturday.",
        "I go on Sunday.",
        "Sunday is a holiday.",
      ],
    }),
    speaking("ja-m12-4-2-speak-suiyoubi", "きょうは すいようびです", "Today is Wednesday."),
    build(
      "ja-m12-4-2-build-kin-gakkou",
      "Say: I go to school on Friday.",
      "きんようびに がっこうに いきます",
      ["きんようび", "に", "がっこう", "に", "いきます", "どようび", "かえります"],
      ["きんようび", "に", "がっこう", "に", "いきます"],
    ),
    listeningBuildSentence({
      id: "ja-m12-4-2-lb-getsu",
      target: "あしたは げつようびです",
      tiles: ["あした", "は", "げつようび", "です", "かようび", "きょう"],
      correctOrder: ["あした", "は", "げつようび", "です"],
      promptEn: "Hear it, build it: 'Tomorrow is Monday.'",
    }),
    sentenceMcq({
      id: "ja-m12-4-2-mcq-suiyoubi",
      prompt: "Which day comes AFTER かようび (Tuesday)?",
      correctKana: "すいようび",
      distractorsKana: ["もくようび", "げつようび", "きんようび"],
      explanation: "The order is: げつ → か → すい → もく → きん → ど → にち.",
    }),
    translateStep({
      id: "ja-m12-4-2-translate",
      promptEn: "Today is Saturday.",
      acceptedAnswers: ["きょうは どようびです", "きょうはどようびです"],
      audioText: "きょうは どようびです",
    }),
    listeningCompSentence({
      id: "ja-m12-4-2-lc-kayoubi",
      audioText: "かようび",
      correctMeaningEn: "Tuesday",
      distractorsEn: ["Thursday", "Friday", "Monday"],
    }),
    cloze(
      "ja-m12-4-2-cloze-ha",
      "きょう",
      " きんようびです。",
      "は",
      ["は", "が", "を", "に"],
      "Today is Friday.",
      "きょうは きんようびです。",
      "は marks the topic — 'today' is what we're talking about.",
    ),
    selfExplain({
      id: "ja-m12-4-2-self-explain",
      anchorLabel: "You've drilled all 7 days in sentence context",
      anchorAudioText: "きょうは どようびです",
      question: "What element does どようび represent?",
      rule: { text: "ど = earth (土). Saturday = earth day." },
      surface: { text: "ど = door. Saturday is 'door day' because shops open." },
      distractor: { text: "ど = degree. Saturday is named after temperature." },
      ruleExplanation:
        "Each day maps to a celestial element: 月 Moon, 火 Mars, 水 Mercury, 木 Jupiter, 金 Venus, 土 Saturn, 日 Sun.",
    }),
    speaking(
      "ja-m12-4-2-speak-mokuyoubi",
      "きょうは もくようびです",
      "Today is Thursday.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-4-2-rev-mcq-1", M12_4_2_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-4-2-rev-lc-1",
      audioText: M12_4_2_REVIEW[1].kana,
      correctMeaningEn: M12_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_4_2_REVIEW[2].meaningEn,
        M12_4_2_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[7].meaningEn,
      ],
    }),
    speaking("ja-m12-4-2-rev-speak-1", M12_4_2_REVIEW[2].kana, M12_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-4-2-rev", M12_4_2_REVIEW),
    infoStep(
      "ja-m12-4-2-info-end",
      "You can now talk about any day of the week in real sentences",
      "All seven days drilled in context — きょうは / あしたは + day + です.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_4_2.steps);
assertAnswerRotation(M12_4_2.steps, 1);
assertNoConsecutiveSame(M12_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-5-1 — "Time に" intro (time particle + scheduling)
// ═══════════════════════════════════════════════════════════════════════

const M12_5_1_REVIEW = pickReviewAtoms("ja-m12-5-1-rev", M12_REVIEW_POOL, 4);

export const M12_5_1: LessonContent = {
  id: "ja-m12-5-1",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Time に I",
  description:
    "The に particle marks specific times: さんじに あいます = 'I meet at 3.' Time expressions: あさ, ひる, よる, ばん.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-5-1-info-open",
      "Scheduling with に",
      "You already know に for locations. Now it marks TIME too: さんじに = 'at 3 o'clock.' Plus three time-of-day words: あさ, ひる, よる.",
    ),
    RULE_NI_TIME,
    // ── あさ (morning) ──
    build(
      "ja-m12-5-1-build-asa",
      "Pick the Japanese for: Morning",
      "あさ",
      ["あさ", "ひる", "よる", "ばん"],
      ["あさ"],
    ),
    listeningCompSentence({
      id: "ja-m12-5-1-lc-asa",
      audioText: "あさ ろくじに おきます",
      correctMeaningEn: "I wake up at 6 in the morning.",
      distractorsEn: [
        "I wake up at 6 in the evening.",
        "I go at 6 in the morning.",
        "I sleep at 6 in the morning.",
      ],
    }),
    // ── ひる (noon/daytime) ──
    build(
      "ja-m12-5-1-build-hiru",
      "Pick the Japanese for: Noon / daytime",
      "ひる",
      ["ひる", "あさ", "よる", "ゆうがた"],
      ["ひる"],
    ),
    speaking("ja-m12-5-1-speak-hiru", "ひる", "Noon"),
    // ── よる (night) ──
    build(
      "ja-m12-5-1-build-yoru",
      "Pick the Japanese for: Night",
      "よる",
      ["よる", "ひる", "あさ", "ばん"],
      ["よる"],
    ),
    listeningCompSentence({
      id: "ja-m12-5-1-lc-yoru",
      audioText: "よる くじに ねます",
      correctMeaningEn: "I go to sleep at 9 at night.",
      distractorsEn: [
        "I wake up at 9 at night.",
        "I eat at 9 at night.",
        "I go to sleep at 9 in the morning.",
      ],
    }),
    // ── に for time ──
    cloze(
      "ja-m12-5-1-cloze-ni-1",
      "さんじ",
      " あいます。",
      "に",
      ["に", "は", "で", "を"],
      "I'll meet (you) at 3 o'clock.",
      "さんじに あいます。",
      "に marks the specific time point — 'at 3 o'clock.'",
    ),
    build(
      "ja-m12-5-1-build-shichiji-ni",
      "Say: I wake up at 7.",
      "しちじに おきます",
      ["しちじ", "に", "おきます", "は", "で", "くじ"],
      ["しちじ", "に", "おきます"],
    ),
    sentenceMcq({
      id: "ja-m12-5-1-mcq-goji-ni",
      prompt: "Which sentence means 'I go home at 5 o'clock.'?",
      correctKana: "ごじに かえります。",
      distractorsKana: [
        "ごじは かえります。",
        "ごじで かえります。",
        "ごじを かえります。",
      ],
      explanation: "に marks the time — 'at 5 o'clock.' は, で, and を don't work for specific times.",
    }),
    cloze(
      "ja-m12-5-1-cloze-ni-2",
      "はちじ",
      " がっこうに いきます。",
      "に",
      ["に", "で", "は", "が"],
      "I go to school at 8 o'clock.",
      "はちじに がっこうに いきます。",
      "に marks the time (at 8). The second に marks the destination (school).",
    ),
    listeningBuildSentence({
      id: "ja-m12-5-1-lb-rokuji-ni",
      target: "ろくじに おきます",
      tiles: ["ろくじ", "に", "おきます", "は", "くじ", "ねます"],
      correctOrder: ["ろくじ", "に", "おきます"],
      promptEn: "Hear it, build it: 'I wake up at 6.'",
    }),
    selfExplain({
      id: "ja-m12-5-1-self-explain",
      anchorLabel: "You used に twice: はちじに がっこうに いきます",
      anchorAudioText: "はちじに がっこうに いきます",
      question: "This sentence has two に — what does each one mark?",
      rule: { text: "First に = time (at 8 o'clock). Second に = destination (to school). Same particle, different roles." },
      surface: { text: "Both に mark the same thing — they're just separating the words." },
      distractor: { text: "First に = the subject. Second に = the destination." },
      ruleExplanation:
        "に is versatile: it marks time points AND destinations. Context makes the role clear — numbers/clocks = time, places = destination.",
    }),
    speaking(
      "ja-m12-5-1-speak-kuji-ni",
      "よる くじに ねます",
      "I go to sleep at 9 at night.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-5-1-rev-mcq-1", M12_5_1_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-5-1-rev-lc-1",
      audioText: M12_5_1_REVIEW[1].kana,
      correctMeaningEn: M12_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_5_1_REVIEW[2].meaningEn,
        M12_5_1_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[8].meaningEn,
      ],
    }),
    speaking("ja-m12-5-1-rev-speak-1", M12_5_1_REVIEW[2].kana, M12_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-5-1-rev", M12_5_1_REVIEW),
    infoStep(
      "ja-m12-5-1-info-end",
      "You can now pin actions to specific times with に",
      "さんじに あいます, ろくじに おきます — the time + に + verb pattern for scheduling.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_5_1.steps);
assertAnswerRotation(M12_5_1.steps, 1);
assertNoConsecutiveSame(M12_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-5-2 — "Time に" practice (+ ばん, ゆうがた, あした, あさって)
// ═══════════════════════════════════════════════════════════════════════

const M12_5_2_REVIEW = pickReviewAtoms("ja-m12-5-2-rev", M12_REVIEW_POOL, 4);

export const M12_5_2: LessonContent = {
  id: "ja-m12-5-2",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Time に II",
  description:
    "More time expressions: ばん, ゆうがた, あした, あさって. Drill に for scheduling.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-5-2-info-open",
      "More time words",
      "ばん (evening), ゆうがた (late afternoon), あした (tomorrow), あさって (day after tomorrow). Schedule your whole week.",
    ),
    // ── ばん (evening) ──
    build(
      "ja-m12-5-2-build-ban",
      "Pick the Japanese for: Evening",
      "ばん",
      ["ばん", "あさ", "ひる", "よる"],
      ["ばん"],
    ),
    listeningCompSentence({
      id: "ja-m12-5-2-lc-ban",
      audioText: "ばん ごはんを たべます",
      correctMeaningEn: "I eat dinner in the evening.",
      distractorsEn: [
        "I eat lunch.",
        "I eat breakfast.",
        "I drink in the evening.",
      ],
    }),
    // ── ゆうがた (late afternoon) ──
    build(
      "ja-m12-5-2-build-yuugata",
      "Pick the Japanese for: Late afternoon",
      "ゆうがた",
      ["ゆうがた", "ばん", "ひる", "あさ"],
      ["ゆうがた"],
    ),
    speaking("ja-m12-5-2-speak-yuugata", "ゆうがた", "Late afternoon"),
    // ── あした (tomorrow) ──
    build(
      "ja-m12-5-2-build-ashita",
      "Pick the Japanese for: Tomorrow",
      "あした",
      ["あした", "あさって", "きょう", "きのう"],
      ["あした"],
    ),
    listeningCompSentence({
      id: "ja-m12-5-2-lc-ashita",
      audioText: "あした がっこうに いきます",
      correctMeaningEn: "I go to school tomorrow.",
      distractorsEn: [
        "I went to school yesterday.",
        "I go to school today.",
        "I go to the park tomorrow.",
      ],
    }),
    // ── あさって (day after tomorrow) ──
    build(
      "ja-m12-5-2-build-asatte",
      "Pick the Japanese for: Day after tomorrow",
      "あさって",
      ["あさって", "あした", "きょう", "あさ"],
      ["あさって"],
    ),
    // ── Scheduling with に + new time words ──
    cloze(
      "ja-m12-5-2-cloze-ni-1",
      "あした さんじ",
      " あいます。",
      "に",
      ["に", "は", "で", "を"],
      "I'll meet (you) at 3 tomorrow.",
      "あした さんじに あいます。",
      "に marks the specific clock time. あした (tomorrow) doesn't take に — it's already adverbial.",
    ),
    build(
      "ja-m12-5-2-build-ashita-goji",
      "Say: I'll go home at 5 tomorrow.",
      "あした ごじに かえります",
      ["あした", "ごじ", "に", "かえります", "は", "いきます", "くじ"],
      ["あした", "ごじ", "に", "かえります"],
    ),
    sentenceMcq({
      id: "ja-m12-5-2-mcq-asatte",
      prompt: "Which sentence means 'I'll eat at 7 the day after tomorrow.'?",
      correctKana: "あさって しちじに たべます。",
      distractorsKana: [
        "あした しちじに たべます。",
        "あさって しちじは たべます。",
        "あさって ななじに たべます。",
      ],
      explanation: "あさって = day after tomorrow. しちじ (not ななじ) = 7 o'clock. に for time.",
    }),
    listeningBuildSentence({
      id: "ja-m12-5-2-lb-ashita-hachiji",
      target: "あした はちじに おきます",
      tiles: ["あした", "はちじ", "に", "おきます", "ねます", "くじ"],
      correctOrder: ["あした", "はちじ", "に", "おきます"],
      promptEn: "Hear it, build it: 'I'll wake up at 8 tomorrow.'",
    }),
    cloze(
      "ja-m12-5-2-cloze-ni-2",
      "げつようび",
      " にほんごを べんきょうします。",
      "に",
      ["に", "は", "で", "が"],
      "I study Japanese on Monday.",
      "げつようびに にほんごを べんきょうします。",
      "に marks the specific day — 'on Monday.'",
    ),
    translateStep({
      id: "ja-m12-5-2-translate",
      promptEn: "I wake up at 6 tomorrow.",
      acceptedAnswers: ["あした ろくじに おきます", "あしたろくじにおきます"],
      audioText: "あした ろくじに おきます",
    }),
    selfExplain({
      id: "ja-m12-5-2-self-explain",
      anchorLabel: "You wrote: あした さんじに あいます",
      anchorAudioText: "あした さんじに あいます",
      question: "Why does さんじ take に but あした doesn't?",
      rule: { text: "Specific clock times and days of the week require に. Relative words like あした, きょう, まいにち are already adverbial — no に needed." },
      surface: { text: "あした is too short to take に." },
      distractor: { text: "に is only for clock times, never for days or dates." },
      ruleExplanation:
        "The rule: specific named times (3 o'clock, Monday) → に. Relative/general times (tomorrow, today, every day) → no に.",
    }),
    speaking(
      "ja-m12-5-2-speak-asatte",
      "あさって くじに あいます",
      "I'll meet (you) at 9 the day after tomorrow.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-5-2-rev-mcq-1", M12_5_2_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-5-2-rev-lc-1",
      audioText: M12_5_2_REVIEW[1].kana,
      correctMeaningEn: M12_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_5_2_REVIEW[2].meaningEn,
        M12_5_2_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[9].meaningEn,
      ],
    }),
    speaking("ja-m12-5-2-rev-speak-1", M12_5_2_REVIEW[2].kana, M12_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-5-2-rev", M12_5_2_REVIEW),
    infoStep(
      "ja-m12-5-2-info-end",
      "You can now schedule events across days and times",
      "あした, あさって, ばん, ゆうがた — combined with じに for full scheduling sentences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_5_2.steps);
assertAnswerRotation(M12_5_2.steps, 1);
assertNoConsecutiveSame(M12_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-6-1 — "Numbers 11-99" intro (compound numbers)
// ═══════════════════════════════════════════════════════════════════════

const M12_6_1_REVIEW = pickReviewAtoms("ja-m12-6-1-rev", M12_REVIEW_POOL, 4);

export const M12_6_1: LessonContent = {
  id: "ja-m12-6-1",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Numbers 11-99 I",
  description:
    "Compound numbers: じゅういち (11), にじゅう (20), さんじゅうご (35), etc.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-6-1-info-open",
      "Counting past 10",
      "You know 1-10. Now stack them: じゅういち = 10+1 = 11, にじゅう = 2×10 = 20. Simple math, big range.",
    ),
    RULE_NUMBERS_11_99,
    // ── じゅういち (11) ──
    build(
      "ja-m12-6-1-build-juuichi",
      "Pick the Japanese for: 11",
      "じゅういち",
      ["じゅういち", "じゅうに", "いちじゅう", "にじゅう"],
      ["じゅういち"],
    ),
    listeningCompSentence({
      id: "ja-m12-6-1-lc-juuichi",
      audioText: "じゅういち",
      correctMeaningEn: "11 (eleven)",
      distractorsEn: ["12 (twelve)", "21 (twenty-one)", "10 (ten)"],
    }),
    // ── にじゅう (20) ──
    build(
      "ja-m12-6-1-build-nijuu",
      "Pick the Japanese for: 20",
      "にじゅう",
      ["にじゅう", "じゅうに", "にひゃく", "さんじゅう"],
      ["にじゅう"],
    ),
    speaking("ja-m12-6-1-speak-nijuu", "にじゅう", "20 (twenty)"),
    // ── さんじゅう (30) ──
    build(
      "ja-m12-6-1-build-sanjuu",
      "Pick the Japanese for: 30",
      "さんじゅう",
      ["さんじゅう", "にじゅう", "よんじゅう", "じゅうさん"],
      ["さんじゅう"],
    ),
    listeningCompSentence({
      id: "ja-m12-6-1-lc-sanjuu",
      audioText: "さんじゅう",
      correctMeaningEn: "30 (thirty)",
      distractorsEn: ["13 (thirteen)", "3 (three)", "40 (forty)"],
    }),
    // ── よんじゅう (40) ──
    build(
      "ja-m12-6-1-build-yonjuu",
      "Pick the Japanese for: 40",
      "よんじゅう",
      ["よんじゅう", "さんじゅう", "ごじゅう", "じゅうよん"],
      ["よんじゅう"],
    ),
    // ── ごじゅう (50) ──
    build(
      "ja-m12-6-1-build-gojuu",
      "Pick the Japanese for: 50",
      "ごじゅう",
      ["ごじゅう", "よんじゅう", "ろくじゅう", "じゅうご"],
      ["ごじゅう"],
    ),
    sentenceMcq({
      id: "ja-m12-6-1-mcq-nijuugo",
      prompt: "Which is the Japanese for 25?",
      correctKana: "にじゅうご",
      distractorsKana: ["じゅうにご", "ごにじゅう", "にごじゅう"],
      explanation: "にじゅう (20) + ご (5) = にじゅうご (25). Tens first, then ones.",
    }),
    // ── Bigger compounds ──
    build(
      "ja-m12-6-1-build-rokujuu",
      "Pick the Japanese for: 60",
      "ろくじゅう",
      ["ろくじゅう", "ごじゅう", "ななじゅう", "じゅうろく"],
      ["ろくじゅう"],
    ),
    listeningBuildSentence({
      id: "ja-m12-6-1-lb-sanjuugo",
      target: "さんじゅうご",
      tiles: ["さんじゅう", "ご", "にじゅう", "さん", "ろく"],
      correctOrder: ["さんじゅう", "ご"],
      promptEn: "Hear it, build it: '35'",
    }),
    selfExplain({
      id: "ja-m12-6-1-self-explain",
      anchorLabel: "You built: にじゅう (20), さんじゅう (30), よんじゅう (40)...",
      anchorAudioText: "さんじゅうご",
      question: "How do you form numbers 20, 30, 40... in Japanese?",
      rule: { text: "Multiplier + じゅう: に + じゅう = 20, さん + じゅう = 30. Then add the ones digit." },
      surface: { text: "Say じゅう first, then the multiplier: じゅうに = 20." },
      distractor: { text: "Use a special word for each decade — にじゅう, さんぜん, etc." },
      ruleExplanation:
        "Japanese stacks numbers logically: [tens multiplier] + じゅう + [ones]. にじゅうさん = 2×10 + 3 = 23.",
    }),
    speaking(
      "ja-m12-6-1-speak-yonjuuhachi",
      "よんじゅうはち",
      "48 (forty-eight)",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-6-1-rev-mcq-1", M12_6_1_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-6-1-rev-lc-1",
      audioText: M12_6_1_REVIEW[1].kana,
      correctMeaningEn: M12_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_6_1_REVIEW[2].meaningEn,
        M12_6_1_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[10].meaningEn,
      ],
    }),
    speaking("ja-m12-6-1-rev-speak-1", M12_6_1_REVIEW[2].kana, M12_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-6-1-rev", M12_6_1_REVIEW),
    infoStep(
      "ja-m12-6-1-info-end",
      "You can now count from 11 to 99 in Japanese",
      "Compound numbers: tens multiplier + じゅう + ones digit. Simple stacking, unlimited range.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_6_1.steps);
assertAnswerRotation(M12_6_1.steps, 1);
assertNoConsecutiveSame(M12_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-6-2 — "Numbers 11-99" practice (in time context)
// ═══════════════════════════════════════════════════════════════════════

const M12_6_2_REVIEW = pickReviewAtoms("ja-m12-6-2-rev", M12_REVIEW_POOL, 4);

export const M12_6_2: LessonContent = {
  id: "ja-m12-6-2",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Numbers 11-99 II",
  description:
    "Drill compound numbers in time contexts: minutes past the hour, ages, quantities.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-6-2-info-open",
      "Numbers in action",
      "Compound numbers meet clock time. じゅうごふん (15 min), にじゅっぷん (20 min), さんじ よんじゅうごふん (3:45).",
    ),
    // ── Numbers in time context ──
    build(
      "ja-m12-6-2-build-juugofun",
      "Say: 15 minutes",
      "じゅうごふん",
      ["じゅうご", "ふん", "ぷん", "じゅう", "ご"],
      ["じゅうご", "ふん"],
    ),
    listeningCompSentence({
      id: "ja-m12-6-2-lc-juugofun",
      audioText: "じゅうごふん",
      correctMeaningEn: "15 minutes",
      distractorsEn: ["5 minutes", "50 minutes", "15 o'clock"],
    }),
    build(
      "ja-m12-6-2-build-nijuppun",
      "Say: 20 minutes",
      "にじゅっぷん",
      ["にじゅっ", "ぷん", "にじゅう", "ふん", "さんじゅう"],
      ["にじゅっ", "ぷん"],
    ),
    sentenceMcq({
      id: "ja-m12-6-2-mcq-sanji-yonjuugo",
      prompt: "Which sentence means 'It's 3:45.'?",
      correctKana: "さんじ よんじゅうごふんです。",
      distractorsKana: [
        "さんじ じゅうごふんです。",
        "よじ よんじゅうごふんです。",
        "さんじはんです。",
      ],
      explanation: "さんじ = 3 o'clock, よんじゅうごふん = 45 minutes.",
    }),
    speaking("ja-m12-6-2-speak-nijuppun", "にじゅっぷん", "20 minutes"),
    // ── ななじゅう (70), はちじゅう (80), きゅうじゅう (90) ──
    build(
      "ja-m12-6-2-build-nanajuu",
      "Pick the Japanese for: 70",
      "ななじゅう",
      ["ななじゅう", "ろくじゅう", "はちじゅう", "じゅうなな"],
      ["ななじゅう"],
    ),
    listeningCompSentence({
      id: "ja-m12-6-2-lc-hachijuu",
      audioText: "はちじゅう",
      correctMeaningEn: "80 (eighty)",
      distractorsEn: ["18 (eighteen)", "8 (eight)", "88 (eighty-eight)"],
    }),
    build(
      "ja-m12-6-2-build-kyuujuu",
      "Pick the Japanese for: 90",
      "きゅうじゅう",
      ["きゅうじゅう", "ななじゅう", "はちじゅう", "じゅうきゅう"],
      ["きゅうじゅう"],
    ),
    // ── Full time with compound minutes ──
    build(
      "ja-m12-6-2-build-niji-sanjuppun",
      "Say: It's 2:30.",
      "にじ さんじゅっぷんです",
      ["にじ", "さんじゅっぷん", "です", "にじゅっぷん", "さんじ"],
      ["にじ", "さんじゅっぷん", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m12-6-2-lb-yoji-juugofun",
      target: "よじ じゅうごふんです",
      tiles: ["よじ", "じゅうごふん", "です", "よんじ", "ごふん"],
      correctOrder: ["よじ", "じゅうごふん", "です"],
      promptEn: "Hear it, build it: 'It's 4:15.'",
    }),
    translateStep({
      id: "ja-m12-6-2-translate",
      promptEn: "It's 3:45.",
      acceptedAnswers: [
        "さんじ よんじゅうごふんです",
        "さんじよんじゅうごふんです",
      ],
      audioText: "さんじ よんじゅうごふんです",
    }),
    listeningCompSentence({
      id: "ja-m12-6-2-lc-kyuujuukyuu",
      audioText: "きゅうじゅうきゅう",
      correctMeaningEn: "99 (ninety-nine)",
      distractorsEn: ["9 (nine)", "19 (nineteen)", "90 (ninety)"],
    }),
    selfExplain({
      id: "ja-m12-6-2-self-explain",
      anchorLabel: "You built: さんじ よんじゅうごふんです (3:45)",
      anchorAudioText: "さんじ よんじゅうごふんです",
      question: "How do you read 45 in Japanese?",
      rule: { text: "よんじゅうご — よんじゅう (40) + ご (5) = 45." },
      surface: { text: "しじゅうご — し (4) + じゅうご (15) = 45." },
      distractor: { text: "よんごじゅう — よん (4) + ごじゅう (50) = 45." },
      ruleExplanation:
        "Tens come first: [multiplier] + じゅう + [ones]. よんじゅう (4×10=40) + ご (5) = よんじゅうご (45).",
    }),
    speaking(
      "ja-m12-6-2-speak-hachijuuni",
      "はちじゅうに",
      "82 (eighty-two)",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-6-2-rev-mcq-1", M12_6_2_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-6-2-rev-lc-1",
      audioText: M12_6_2_REVIEW[1].kana,
      correctMeaningEn: M12_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_6_2_REVIEW[2].meaningEn,
        M12_6_2_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[11].meaningEn,
      ],
    }),
    speaking("ja-m12-6-2-rev-speak-1", M12_6_2_REVIEW[2].kana, M12_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-6-2-rev", M12_6_2_REVIEW),
    infoStep(
      "ja-m12-6-2-info-end",
      "You can now use compound numbers for minutes, ages, and quantities",
      "11-99 mastered. Combined with ふん/ぷん for precise clock times: さんじ よんじゅうごふん = 3:45.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_6_2.steps);
assertAnswerRotation(M12_6_2.steps, 1);
assertNoConsecutiveSame(M12_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-STORY — Making plans to meet
//   "なんじに あいましょうか" — preview of ましょう as set phrase
// ═══════════════════════════════════════════════════════════════════════

export const M12_STORY: LessonContent = {
  id: "ja-m12-story",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Making plans",
  description:
    "Listen to two friends plan a weekend meetup using clock times, days of the week, and the に particle.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m12-story-info-open",
      "Story time — Weekend plans",
      "ゆき and たけし are making plans to meet this weekend. Listen as they negotiate the day and time.",
    ),
    dialogueListen({
      id: "ja-m12-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "たけしさん、こんしゅう どようびに あいましょうか。" },
        { speaker: "たけし", kana: "どようびですか。なんじに あいますか。" },
        { speaker: "ゆき", kana: "ごご さんじは どうですか。" },
        { speaker: "たけし", kana: "さんじは ちょっと... よじは どうですか。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "What day does ゆき suggest?",
          correctText: "Saturday",
          distractors: ["Sunday", "Friday", "Monday"],
          explanation: "ゆき says どようびに あいましょうか = 'Shall we meet on Saturday?'",
        },
        {
          id: "s1-q2",
          prompt: "What time does たけし counter-propose?",
          correctText: "4 o'clock",
          distractors: ["3 o'clock", "5 o'clock", "2 o'clock"],
          explanation: "たけし says さんじは ちょっと (3 is a bit...) and suggests よじ (4 o'clock).",
        },
      ],
    }),
    build(
      "ja-m12-story-build-nanji",
      "Ask: What time shall we meet?",
      "なんじに あいますか",
      ["なんじ", "に", "あいます", "か", "は", "いきます"],
      ["なんじ", "に", "あいます", "か"],
    ),
    sentenceMcq({
      id: "ja-m12-story-mcq-doyoubi",
      prompt: "Which sentence means 'Shall we meet on Saturday?'",
      correctKana: "どようびに あいましょうか。",
      distractorsKana: [
        "にちようびに あいましょうか。",
        "どようびは あいますか。",
        "どようびに いきましょうか。",
      ],
      explanation: "どようびに = on Saturday. あいましょうか = shall we meet?",
    }),
    dialogueListen({
      id: "ja-m12-story-scene-2",
      lines: [
        { speaker: "ゆき", kana: "よじですね。どこで あいますか。" },
        { speaker: "たけし", kana: "えきは どうですか。" },
        { speaker: "ゆき", kana: "いいですね。どようび ごご よじに えきで あいましょう。" },
        { speaker: "たけし", kana: "はい、たのしみです！" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "Where do they agree to meet?",
          correctText: "At the station.",
          distractors: ["At school.", "At the park.", "At a restaurant."],
          explanation: "たけし suggests えき (station) and ゆき agrees.",
        },
        {
          id: "s2-q2",
          prompt: "What is the final plan?",
          correctText: "Saturday 4 PM at the station.",
          distractors: ["Saturday 3 PM at the station.", "Sunday 4 PM at the park.", "Saturday 4 PM at school."],
          explanation: "ゆき confirms: どようび ごご よじに えきで あいましょう = Saturday 4 PM at the station.",
        },
      ],
    }),
    cloze(
      "ja-m12-story-cloze-ni",
      "ごご よじ",
      " あいます。",
      "に",
      ["に", "は", "で", "を"],
      "We'll meet at 4 PM.",
      "ごご よじに あいます。",
      "に marks the specific time — 'at 4 PM.'",
    ),
    listeningBuildSentence({
      id: "ja-m12-story-lb-doyoubi",
      target: "どようびに あいましょう",
      tiles: ["どようび", "に", "あいましょう", "は", "にちようび", "いきましょう"],
      correctOrder: ["どようび", "に", "あいましょう"],
      promptEn: "Hear it, build it: 'Let's meet on Saturday.'",
    }),
    listeningCompSentence({
      id: "ja-m12-story-lc-tanoshimi",
      audioText: "たのしみです",
      correctMeaningEn: "I'm looking forward to it!",
      distractorsEn: [
        "That's fun.",
        "Let's go.",
        "I understand.",
      ],
    }),
    speaking(
      "ja-m12-story-speak-nanji",
      "なんじに あいますか",
      "What time shall we meet?",
    ),
    sentenceMcq({
      id: "ja-m12-story-mcq-summary",
      prompt: "In the story, why did たけし decline 3 o'clock?",
      correctKana: "さんじは ちょっと... (3 is a bit inconvenient)",
      distractorsKana: [
        "さんじは はやいです (3 is early)",
        "さんじに しごとがあります (he has work at 3)",
        "He preferred Sunday",
      ],
      explanation: "たけし said さんじは ちょっと — a polite way to decline without giving a reason.",
    }),
    speaking(
      "ja-m12-story-speak-doyoubi",
      "どようび ごご よじに えきで あいましょう",
      "Let's meet at the station at 4 PM on Saturday.",
    ),
    infoStep(
      "ja-m12-story-info-end",
      "You can now follow and make plans in Japanese",
      "You negotiated a day, time, and place — なんじに あいますか, Xは ちょっと, Xに あいましょう. Real scheduling conversation.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M12_STORY.steps);
assertPassiveCardsHaveFollowup(M12_STORY.steps);
assertNoExplanationOnPassive(M12_STORY.steps);
assertExplanationDoesntLeakAnswer(M12_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-7-1 — Mixed time drill
// ═══════════════════════════════════════════════════════════════════════

const M12_7_1_REVIEW = pickReviewAtoms("ja-m12-7-1-rev", M12_REVIEW_POOL, 4);

export const M12_7_1: LessonContent = {
  id: "ja-m12-7-1",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed time drill",
  description:
    "Interleave hours, minutes, days, and に in full scheduling sentences.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-7-1-info-open",
      "Everything together",
      "Hours, minutes, days, AM/PM, and に — all in one lesson. Build full schedules in Japanese.",
    ),
    // ── Mixed drills ──
    cloze(
      "ja-m12-7-1-cloze-ni-1",
      "げつようび",
      " がっこうに いきます。",
      "に",
      ["に", "は", "で", "を"],
      "I go to school on Monday.",
      "げつようびに がっこうに いきます。",
      "に marks the specific day — 'on Monday.'",
    ),
    build(
      "ja-m12-7-1-build-asa-rokuji",
      "Say: I wake up at 6 in the morning.",
      "あさ ろくじに おきます",
      ["あさ", "ろくじ", "に", "おきます", "ねます", "よる", "くじ"],
      ["あさ", "ろくじ", "に", "おきます"],
    ),
    listeningCompSentence({
      id: "ja-m12-7-1-lc-gogo-sanji-han",
      audioText: "ごご さんじはんに かえります",
      correctMeaningEn: "I go home at 3:30 PM.",
      distractorsEn: [
        "I go home at 3:30 AM.",
        "I go to school at 3:30 PM.",
        "I go home at 3 PM.",
      ],
    }),
    sentenceMcq({
      id: "ja-m12-7-1-mcq-kayoubi-kuji",
      prompt: "Which sentence means 'I study Japanese at 9 on Tuesday.'?",
      correctKana: "かようびに くじに にほんごを べんきょうします。",
      distractorsKana: [
        "かようびは くじに にほんごを べんきょうします。",
        "かようびに きゅうじに にほんごを べんきょうします。",
        "げつようびに くじに にほんごを べんきょうします。",
      ],
      explanation: "かようび = Tuesday (に for day), くじ = 9 (に for time, irregular reading).",
    }),
    cloze(
      "ja-m12-7-1-cloze-ha",
      "きょう",
      " すいようびです。",
      "は",
      ["は", "に", "で", "が"],
      "Today is Wednesday.",
      "きょうは すいようびです。",
      "は marks the topic. きょう (today) doesn't take に as a time marker — it takes は as a topic.",
    ),
    build(
      "ja-m12-7-1-build-kinyoubi-goji",
      "Say: I go home at 5 on Friday.",
      "きんようびに ごじに かえります",
      ["きんようび", "に", "ごじ", "に", "かえります", "いきます", "は"],
      ["きんようび", "に", "ごじ", "に", "かえります"],
    ),
    listeningBuildSentence({
      id: "ja-m12-7-1-lb-gozen-hachiji",
      target: "ごぜん はちじに おきます",
      tiles: ["ごぜん", "はちじ", "に", "おきます", "ごご", "ねます"],
      correctOrder: ["ごぜん", "はちじ", "に", "おきます"],
      promptEn: "Hear it, build it: 'I wake up at 8 AM.'",
    }),
    listeningCompSentence({
      id: "ja-m12-7-1-lc-doyoubi-juuji",
      audioText: "どようびに じゅうじに あいます",
      correctMeaningEn: "I'll meet (you) at 10 on Saturday.",
      distractorsEn: [
        "I'll meet at 10 on Sunday.",
        "I'll go at 10 on Saturday.",
        "I'll meet at 12 on Saturday.",
      ],
    }),
    cloze(
      "ja-m12-7-1-cloze-ni-2",
      "あさって しちじ",
      " おきます。",
      "に",
      ["に", "は", "で", "を"],
      "I'll wake up at 7 the day after tomorrow.",
      "あさって しちじに おきます。",
      "に marks the specific clock time. あさって doesn't take に.",
    ),
    build(
      "ja-m12-7-1-build-nichiyoubi-yasumi",
      "Say: I rest on Sunday.",
      "にちようびに やすみます",
      ["にちようび", "に", "やすみます", "は", "どようび", "いきます"],
      ["にちようび", "に", "やすみます"],
    ),
    sentenceMcq({
      id: "ja-m12-7-1-mcq-ashita-no-ni",
      prompt: "Which is correct: 'I go to school tomorrow at 8.'?",
      correctKana: "あした はちじに がっこうに いきます。",
      distractorsKana: [
        "あしたに はちじに がっこうに いきます。",
        "あした はちじは がっこうに いきます。",
        "あした はちじで がっこうに いきます。",
      ],
      explanation: "あした doesn't take に (relative time word). はちじ takes に (specific clock time).",
    }),
    selfExplain({
      id: "ja-m12-7-1-self-explain",
      anchorLabel: "You used: きんようびに ごじに かえります",
      anchorAudioText: "きんようびに ごじに かえります",
      question: "Can a sentence have two に particles for time?",
      rule: { text: "Yes — one に for the day (きんようびに) and one に for the clock time (ごじに). Both mark specific time points." },
      surface: { text: "No — you can only use に once per sentence. The second should be は." },
      distractor: { text: "Yes, but only if the first に is for a place, not a day." },
      ruleExplanation:
        "Multiple にs are normal. Each に marks its own word — day, time, destination. Japanese doesn't limit the count.",
    }),
    speaking(
      "ja-m12-7-1-speak-schedule",
      "かようびに くじに がっこうに いきます",
      "I go to school at 9 on Tuesday.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-7-1-rev-mcq-1", M12_7_1_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-7-1-rev-lc-1",
      audioText: M12_7_1_REVIEW[1].kana,
      correctMeaningEn: M12_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_7_1_REVIEW[2].meaningEn,
        M12_7_1_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[12].meaningEn,
      ],
    }),
    speaking("ja-m12-7-1-rev-speak-1", M12_7_1_REVIEW[2].kana, M12_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-7-1-rev", M12_7_1_REVIEW),
    infoStep(
      "ja-m12-7-1-info-end",
      "You can now build full schedule sentences with day, time, and place",
      "Day + clock time + に + verb — the complete scheduling pattern in Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_7_1.steps);
assertAnswerRotation(M12_7_1.steps, 1);
assertNoConsecutiveSame(M12_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M12-7-2 — Time production (translate + speaking)
// ═══════════════════════════════════════════════════════════════════════

const M12_7_2_REVIEW = pickReviewAtoms("ja-m12-7-2-rev", M12_REVIEW_POOL, 5);

export const M12_7_2: LessonContent = {
  id: "ja-m12-7-2",
  moduleId: "m12",
  courseId: COURSE,
  languageId: LANG,
  title: "Time production",
  description:
    "Translate and speak full time-scheduling sentences. The final production test for M12.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m12-7-2-info-open",
      "Production challenge",
      "No more multiple choice — translate and speak full scheduling sentences from English to Japanese.",
    ),
    // ── Production-heavy drills ──
    translateStep({
      id: "ja-m12-7-2-translate-1",
      promptEn: "It's 7 o'clock now.",
      acceptedAnswers: ["いま しちじです", "いましちじです"],
      audioText: "いま しちじです",
    }),
    speaking(
      "ja-m12-7-2-speak-1",
      "いま しちじです",
      "It's 7 o'clock now.",
    ),
    build(
      "ja-m12-7-2-build-gozen-kuji-han",
      "Say: It's 9:30 AM.",
      "ごぜん くじはんです",
      ["ごぜん", "くじ", "はん", "です", "ごご", "きゅうじ"],
      ["ごぜん", "くじ", "はん", "です"],
    ),
    listeningCompSentence({
      id: "ja-m12-7-2-lc-kayoubi",
      audioText: "かようびに ごじに かえります",
      correctMeaningEn: "I go home at 5 on Tuesday.",
      distractorsEn: [
        "I go home at 5 on Thursday.",
        "I go to school at 5 on Tuesday.",
        "I go home at 9 on Tuesday.",
      ],
    }),
    translateStep({
      id: "ja-m12-7-2-translate-2",
      promptEn: "I wake up at 6 in the morning.",
      acceptedAnswers: [
        "あさ ろくじに おきます",
        "あさろくじにおきます",
        "ごぜん ろくじに おきます",
      ],
      audioText: "あさ ろくじに おきます",
    }),
    speaking(
      "ja-m12-7-2-speak-2",
      "あさ ろくじに おきます",
      "I wake up at 6 in the morning.",
    ),
    cloze(
      "ja-m12-7-2-cloze-ni",
      "もくようび",
      " じゅうじに あいます。",
      "に",
      ["に", "は", "で", "を"],
      "I'll meet (you) at 10 on Thursday.",
      "もくようびに じゅうじに あいます。",
      "に marks the day (on Thursday).",
    ),
    build(
      "ja-m12-7-2-build-ashita-gogo",
      "Say: Tomorrow at 3 PM, I go to the park.",
      "あした ごご さんじに こうえんに いきます",
      ["あした", "ごご", "さんじ", "に", "こうえん", "に", "いきます", "ごぜん", "がっこう"],
      ["あした", "ごご", "さんじ", "に", "こうえん", "に", "いきます"],
    ),
    listeningBuildSentence({
      id: "ja-m12-7-2-lb-nichiyoubi",
      target: "にちようびに やすみます",
      tiles: ["にちようび", "に", "やすみます", "は", "どようび", "いきます"],
      correctOrder: ["にちようび", "に", "やすみます"],
      promptEn: "Hear it, build it: 'I rest on Sunday.'",
    }),
    translateStep({
      id: "ja-m12-7-2-translate-3",
      promptEn: "Today is Friday.",
      acceptedAnswers: ["きょうは きんようびです", "きょうはきんようびです"],
      audioText: "きょうは きんようびです",
    }),
    speaking(
      "ja-m12-7-2-speak-3",
      "きょうは きんようびです",
      "Today is Friday.",
    ),
    sentenceMcq({
      id: "ja-m12-7-2-mcq-gogo-yoji",
      prompt: "Which sentence means 'I'll meet (you) at 4 PM on Saturday.'?",
      correctKana: "どようびに ごご よじに あいます。",
      distractorsKana: [
        "どようびに ごぜん よじに あいます。",
        "にちようびに ごご よじに あいます。",
        "どようびに ごご よんじに あいます。",
      ],
      explanation: "どようび = Saturday, ごご = PM, よじ (not よんじ) = 4 o'clock.",
    }),
    cloze(
      "ja-m12-7-2-cloze-ha",
      "きょう",
      " すいようびです。",
      "は",
      ["は", "に", "で", "が"],
      "Today is Wednesday.",
      "きょうは すいようびです。",
      "は marks the topic. きょう uses は, not に.",
    ),
    selfExplain({
      id: "ja-m12-7-2-self-explain",
      anchorLabel: "You've produced full scheduling sentences across the module",
      anchorAudioText: "あした ごご さんじに こうえんに いきます",
      question: "In あした ごご さんじに こうえんに いきます, which words take に?",
      rule: { text: "さんじ (specific time) and こうえん (destination) take に. あした (relative time) and ごご (AM/PM label) don't." },
      surface: { text: "All nouns before いきます take に." },
      distractor: { text: "Only the last noun before いきます takes に." },
      ruleExplanation:
        "に marks specific time points and destinations. ごご/ごぜん are modifiers (like AM/PM labels), not time points — they don't take に.",
    }),
    speaking(
      "ja-m12-7-2-speak-4",
      "あした ごご さんじに こうえんに いきます",
      "Tomorrow at 3 PM, I go to the park.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m12-7-2-rev-mcq-1", M12_7_2_REVIEW[0], M12_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m12-7-2-rev-lc-1",
      audioText: M12_7_2_REVIEW[1].kana,
      correctMeaningEn: M12_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M12_7_2_REVIEW[2].meaningEn,
        M12_7_2_REVIEW[3].meaningEn,
        M12_REVIEW_POOL[13].meaningEn,
      ],
    }),
    speaking("ja-m12-7-2-rev-speak-1", M12_7_2_REVIEW[2].kana, M12_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m12-7-2-rev", M12_7_2_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m12-7-2-info-end",
      "You can now tell time, name days, and schedule events in Japanese",
      "All M12 grammar mastered: hours (including irregulars), minutes (ふん/ぷん), days of the week, に for time, and numbers 11-99.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M12_7_2.steps);
assertAnswerRotation(M12_7_2.steps, 1);
assertNoConsecutiveSame(M12_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

const ALL_M12 = [
  M12_1_1, M12_1_2, M12_2_1, M12_2_2, M12_3_1, M12_3_2,
  M12_4_1, M12_4_2, M12_5_1, M12_5_2, M12_6_1, M12_6_2,
  M12_STORY, M12_7_1, M12_7_2,
];

assertNoSameAnswerCluster(ALL_M12.flatMap((l) => l.steps));

// Passive-card lint
for (const lesson of ALL_M12) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
