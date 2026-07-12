/**
 * M17 — Transportation & Directions (2026-05-25).
 *
 * M17 introduces:
 *   - で (means of transport): でんしゃで いきます
 *   - に (destination, full scope): えきに いきます
 *   - へ (direction — softer/vaguer than に): がっこうへ いきます
 *   - 〜までに (by deadline): ごじまでに かえります
 *   - まえに (before): ごはんの まえに てを あらいます
 *
 * Prereqs: M1-M16 grammar (に/で from M6, verb ます-form from M9+).
 *
 * Split into 14 registered sub-lessons + 1 story = 15 registered exports,
 * plus 2 NOT-YET-REGISTERED expansion sub-lessons (M17_8_1, M17_8_2 —
 * position words + asking a police officer; suggested registration slot is
 * between ja-m17-4-2 and ja-m17-5-1).
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * Vocab (~30): ふね, タクシー, バスてい, くうこう, きっぷ, のりもの,
 *   まっすぐ, みぎ, ひだり, むこう, そば, ちかく, となり, あいだ,
 *   のる, おりる, わたる, まがる, とまる
 * Expansion vocab (M17_8_x, unregistered): まえ (front), うしろ, なか,
 *   した, よこ, けいかん, ポスト
 *
 * ID scheme: ja-m17-{n}-{sub} e.g. ja-m17-1-1, ja-m17-1-2
 * Export names: M17_1_1, M17_1_2, M17_2_1, M17_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m17-1, etc.
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
const M17_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_DE_TRANSPORT = grammarRule({
  id: "ja-m17-rule-de-transport",
  title: "で — means of transport",
  rule:
    "Use で after the vehicle/method to say 'by [transport]': でんしゃで = by train, バスで = by bus. This extends the tool-use で you learned in M6 — a train is the 'tool' you use to go somewhere.",
  examples: [
    {
      ja: "でんしゃで がっこうに いきます。",
      romaji: "densha de gakkou ni ikimasu.",
      en: "I go to school by train.",
    },
    {
      ja: "タクシーで くうこうに いきます。",
      romaji: "takushii de kuukou ni ikimasu.",
      en: "I go to the airport by taxi.",
    },
    {
      ja: "あるいて いきます。",
      romaji: "aruite ikimasu.",
      en: "I go on foot. (walking — no で needed)",
    },
  ],
  antiPattern: {
    ja: "でんしゃを がっこうに いきます。",
    romaji: "densha o gakkou ni ikimasu.",
    en: "(broken — を marks something you act ON; で marks the means)",
    why: "You're not acting on the train — you're using it as transport. Use で for the vehicle.",
  },
  cultureNote:
    "あるいて (on foot) uses the て-form of あるく. No で particle is needed because walking is an action, not a vehicle.",
});

const RULE_NI_DESTINATION = grammarRule({
  id: "ja-m17-rule-ni-destination",
  grammarPointId: "ni-location",
  title: "に — destination (arriving at a specific place)",
  rule:
    "に marks the exact destination you arrive at: えきに いきます = 'I go to the station.' You already know に for location (いすに すわる) and time (さんじに). Now に also marks the point you reach.",
  examples: [
    {
      ja: "くうこうに いきます。",
      romaji: "kuukou ni ikimasu.",
      en: "I go to the airport.",
    },
    {
      ja: "とうきょうに つきます。",
      romaji: "toukyou ni tsukimasu.",
      en: "I arrive in Tokyo.",
    },
    {
      ja: "バスていに とまります。",
      romaji: "basutei ni tomarimasu.",
      en: "It stops at the bus stop.",
    },
  ],
  antiPattern: {
    ja: "くうこうで いきます。",
    romaji: "kuukou de ikimasu.",
    en: "(broken — で marks where an action takes place, not the destination)",
    why: "で is for locations where you DO something. に is for the point you GO TO / arrive at.",
  },
  cultureNote:
    "In practice, に and へ are interchangeable for 'going to,' but に emphasizes the arrival point while へ emphasizes the direction.",
});

const RULE_E_DIRECTION = grammarRule({
  id: "ja-m17-rule-e-direction",
  grammarPointId: "e-direction",
  title: "へ — direction (toward a place)",
  rule:
    "へ (pronounced え) marks the direction of movement — softer and vaguer than に. くうこうへ いきます = 'I head toward the airport.' に and へ are often interchangeable with motion verbs, but へ emphasizes the journey, に the arrival.",
  examples: [
    {
      ja: "みぎへ まがってください。",
      romaji: "migi e magatte kudasai.",
      en: "Please turn to the right.",
    },
    {
      ja: "えきへ いきます。",
      romaji: "eki e ikimasu.",
      en: "I head toward the station.",
    },
    {
      ja: "こっちへ どうぞ。",
      romaji: "kocchi e douzo.",
      en: "This way, please.",
    },
  ],
  antiPattern: {
    ja: "みぎを まがってください。",
    romaji: "migi o magatte kudasai.",
    en: "(unnatural — use へ or に for the direction you turn)",
    why: "を can work with まがる in some contexts (turning a corner), but for giving directions へ or に is standard.",
  },
  cultureNote:
    "へ is always pronounced え when used as a particle. Don't confuse it with the hiragana へ in words like へや (room).",
});

const RULE_MADE_NI = grammarRule({
  id: "ja-m17-rule-made-ni",
  grammarPointId: "made-ni",
  title: "〜までに — by (deadline)",
  rule:
    "までに means 'by (a deadline)' — the action must be completed before that time. ごじまでに = 'by 5 o'clock.' Compare: まで = 'until' (duration), までに = 'by' (deadline).",
  examples: [
    {
      ja: "ごじまでに かえります。",
      romaji: "goji made ni kaerimasu.",
      en: "I'll be back by 5 o'clock.",
    },
    {
      ja: "あしたまでに しゅくだいを だしてください。",
      romaji: "ashita made ni shukudai o dashite kudasai.",
      en: "Please submit your homework by tomorrow.",
    },
    {
      ja: "くじまでに くうこうに いきます。",
      romaji: "kuji made ni kuukou ni ikimasu.",
      en: "I'll go to the airport by 9 o'clock.",
    },
  ],
  antiPattern: {
    ja: "ごじまで かえります。",
    romaji: "goji made kaerimasu.",
    en: "(different meaning — 'I go home until 5' = I keep going home until 5)",
    why: "まで = 'until' (the action continues). までに = 'by' (the action must happen before the deadline).",
  },
});

const RULE_MAE_NI = grammarRule({
  id: "ja-m17-rule-mae-ni",
  grammarPointId: "mae-ni",
  title: "まえに — before",
  rule:
    "noun + の + まえに = 'before [noun].' Verb dictionary form + まえに = 'before doing.' Place まえに right before the main clause.",
  examples: [
    {
      ja: "ごはんの まえに てを あらいます。",
      romaji: "gohan no mae ni te o araimasu.",
      en: "I wash my hands before the meal.",
    },
    {
      ja: "ねる まえに ほんを よみます。",
      romaji: "neru mae ni hon o yomimasu.",
      en: "I read a book before sleeping.",
    },
    {
      ja: "でかける まえに きっぷを かいます。",
      romaji: "dekakeru mae ni kippu o kaimasu.",
      en: "I buy a ticket before going out.",
    },
  ],
  antiPattern: {
    ja: "ごはんまえに てを あらいます。",
    romaji: "gohan mae ni te o araimasu.",
    en: "(broken — nouns need の before まえに)",
    why: "With nouns, you need の to connect: ごはんの まえに. Verbs connect directly: ねる まえに.",
  },
});

// ═══════════════════════════════════════════════════════════════════════
// M17-1-1 — "Getting around" vocab intro
//   (ふね, タクシー, バスてい, くうこう, きっぷ, のりもの + で transport)
// ═══════════════════════════════════════════════════════════════════════

const M17_1_1_REVIEW = pickReviewAtoms("ja-m17-1-1-rev", M17_REVIEW_POOL, 6);

export const M17_1_1: LessonContent = {
  id: "ja-m17-1-1",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Getting around I",
  description:
    "Six transport words + で for means of transport.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m17-1-1-info-open",
      "Getting around",
      "Boats, taxis, bus stops, airports — six transport words and the particle that says HOW you travel.",
    ),
    RULE_DE_TRANSPORT,
    // ── ふね (boat/ship) ──
    build(
      "ja-m17-1-1-build-fune",
      "Pick the Japanese word for: Boat / Ship",
      "ふね",
      ["バス", "タクシー", "ふね", "くるま"],
      ["ふね"],
    ),
    vocabMcq(
      "ja-m17-1-1-mcq-fune",
      { kana: "ふね", meaningEn: "boat / ship", emoji: "🚢", fromModule: "m17" },
      M17_REVIEW_POOL,
    ),
    // ── タクシー (taxi) ──
    build(
      "ja-m17-1-1-build-takushii",
      "Pick the Japanese word for: Taxi",
      "タクシー",
      ["ふね", "でんしゃ", "タクシー", "バス"],
      ["タクシー"],
    ),
    listeningCompSentence({
      id: "ja-m17-1-1-lc-takushii",
      audioText: "タクシーで くうこうに いきます",
      correctMeaningEn: "I go to the airport by taxi.",
      distractorsEn: [
        "I go to the airport by bus.",
        "I go to the station by taxi.",
        "I get in a taxi at the airport.",
      ],
    }),
    // ── バスてい (bus stop) ──
    build(
      "ja-m17-1-1-build-basutei",
      "Pick the Japanese word for: Bus stop",
      "バスてい",
      ["えき", "タクシー", "バスてい", "くうこう"],
      ["バスてい"],
    ),
    speaking("ja-m17-1-1-speak-basutei", "バスてい", "Bus stop"),
    // ── くうこう (airport) ──
    build(
      "ja-m17-1-1-build-kuukou",
      "Pick the Japanese word for: Airport",
      "くうこう",
      ["えき", "びょういん", "バスてい", "くうこう"],
      ["くうこう"],
    ),
    vocabMcq(
      "ja-m17-1-1-mcq-kuukou",
      { kana: "くうこう", meaningEn: "airport", emoji: "✈️", fromModule: "m17" },
      M17_REVIEW_POOL,
    ),
    // ── きっぷ (ticket) ──
    build(
      "ja-m17-1-1-build-kippu",
      "Pick the Japanese word for: Ticket",
      "きっぷ",
      ["きって", "おかね", "きっぷ", "かばん"],
      ["きっぷ"],
    ),
    listeningCompSentence({
      id: "ja-m17-1-1-lc-kippu",
      audioText: "きっぷを にまい ください",
      correctMeaningEn: "Two tickets, please.",
      distractorsEn: [
        "One ticket, please.",
        "Two stamps, please.",
        "Two photos, please.",
      ],
    }),
    // ── のりもの (vehicle/ride) ──
    build(
      "ja-m17-1-1-build-norimono",
      "Pick the Japanese word for: Vehicle / Ride",
      "のりもの",
      ["たてもの", "のみもの", "のりもの", "たべもの"],
      ["のりもの"],
    ),
    speaking("ja-m17-1-1-speak-norimono", "のりもの", "Vehicle"),
    // ── で transport drills ──
    listeningBuildSentence({
      id: "ja-m17-1-1-lb-de",
      target: "でんしゃで がっこうに いきます",
      tiles: ["がっこう", "でんしゃ", "いきます", "で", "に", "タクシー"],
      correctOrder: ["でんしゃ", "で", "がっこう", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to school by train.'",
    }),
    sentenceMcq({
      id: "ja-m17-1-1-mcq-fune-de",
      prompt: "Which sentence means 'I go by boat.'?",
      correctKana: "ふねで いきます。",
      distractorsKana: [
        "ふねに いきます。",
        "ふねを いきます。",
        "ふねは いきます。",
      ],
      explanation: "で marks the means of transport.",
    }),
    selfExplain({
      id: "ja-m17-1-1-self-explain",
      anchorLabel: "タクシーで くうこうに いきます",
      anchorAudioText: "タクシーで くうこうに いきます",
      question: "Why で after タクシー but に after くうこう?",
      rule: { text: "で marks the means (taxi = transport tool). に marks the destination (airport = where you arrive)." },
      surface: { text: "で and に mean the same thing here — either particle works in both positions." },
      distractor: { text: "で is for katakana words; に is for hiragana words." },
      ruleExplanation:
        "Two different roles: で = means/tool, に = destination/arrival point. They work together in transport sentences.",
    }),
    speaking(
      "ja-m17-1-1-speak-densha-de",
      "でんしゃで えきに いきます",
      "I go to the station by train.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-1-1-rev-mcq-1", M17_1_1_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-1-1-rev-lc-1",
      // Sentence-level review of いくら (M5) — 2026-07-12 listening backfill.
      audioText: "きっぷは いくらですか",
      correctMeaningEn: "How much is a ticket?",
      distractorsEn: [
        "How much is a stamp?",
        "Where is the ticket?",
        "The ticket is 200 yen.",
      ],
    }),
    reviewMatchPairs("ja-m17-1-1-rev", M17_1_1_REVIEW),
    infoStep(
      "ja-m17-1-1-info-end",
      "You can now name six ways to get around and say how you travel",
      "ふね, タクシー, バスてい, くうこう, きっぷ, のりもの — plus で for the vehicle you use.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_1_1.steps);
assertAnswerRotation(M17_1_1.steps, 1);
assertNoConsecutiveSame(M17_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-1-2 — "Getting around" practice
//   (drill で transport + vocab, review tail from M3-M7)
// ═══════════════════════════════════════════════════════════════════════

const M17_1_2_REVIEW = pickReviewAtoms("ja-m17-1-2-rev", M17_REVIEW_POOL, 6);

export const M17_1_2: LessonContent = {
  id: "ja-m17-1-2",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Getting around II",
  description:
    "Drill transport vocab + で particle in full sentences. Interleaved M3-M7 review.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m17-1-2-info-open",
      "Transport drill",
      "Time to lock in the transport words. Build sentences about how you get to places.",
    ),
    // ── Drills ──
    build(
      "ja-m17-1-2-build-fune-de",
      "Say: I go to the island by boat.",
      "ふねで しまに いきます",
      ["しま", "で", "を", "ふね", "タクシー", "いきます", "に"],
      ["ふね", "で", "しま", "に", "いきます"],
    ),
    listeningCompSentence({
      id: "ja-m17-1-2-lc-takushii-de",
      audioText: "タクシーで びょういんに いきます",
      correctMeaningEn: "I go to the hospital by taxi.",
      distractorsEn: [
        "I go to the hospital by bus.",
        "I go to the airport by taxi.",
        "I go to the hospital by train.",
      ],
    }),
    listeningBuildSentence({
      id: "ja-m17-1-2-lb-de-1",
      target: "バスで がっこうに いきます",
      tiles: ["いきます", "バス", "がっこう", "で", "に", "を"],
      correctOrder: ["バス", "で", "がっこう", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to school by bus.'",
    }),
    sentenceMcq({
      id: "ja-m17-1-2-mcq-kuukou",
      prompt: "Which sentence means 'I go to the airport by train.'?",
      correctKana: "でんしゃで くうこうに いきます。",
      distractorsKana: [
        "でんしゃに くうこうで いきます。",
        "タクシーで くうこうに いきます。",
        "でんしゃで えきに いきます。",
      ],
      explanation: "でんしゃで = by train. くうこうに = to the airport.",
    }),
    build(
      "ja-m17-1-2-build-kippu",
      "Say: I buy a ticket at the station.",
      "えきで きっぷを かいます",
      ["で", "きっぷ", "えき", "バスてい", "に", "かいます", "を"],
      ["えき", "で", "きっぷ", "を", "かいます"],
    ),
    sentenceMcq({
      id: "ja-m17-1-2-mcq-byouin",
      prompt: "Which sentence means 'I go to the hospital by bus.'?",
      correctKana: "バスで びょういんに いきます。",
      distractorsKana: [
        "バスに びょういんで いきます。",
        "バスを びょういんに いきます。",
        "バスは びょういんを いきます。",
      ],
      explanation: "で marks the vehicle (bus); に marks the destination (hospital).",
    }),
    listeningBuildSentence({
      id: "ja-m17-1-2-lb-fune",
      target: "ふねで いきます",
      tiles: ["で", "に", "かえります", "いきます", "タクシー", "ふね"],
      correctOrder: ["ふね", "で", "いきます"],
      promptEn: "Hear it, build it: 'I go by boat.'",
    }),
    speaking(
      "ja-m17-1-2-speak-takushii",
      "タクシーで えきに いきます",
      "I go to the station by taxi.",
    ),
    build(
      "ja-m17-1-2-build-basutei",
      "Say: I wait at the bus stop.",
      "バスていで まちます",
      ["いきます", "まちます", "えき", "バスてい", "で", "に"],
      ["バスてい", "で", "まちます"],
    ),
    translateStep({
      id: "ja-m17-1-2-translate-1",
      promptEn: "I go by boat.",
      acceptedAnswers: [
        "ふねで いきます",
        "ふねで いきます。",
        "ふねでいきます",
        "ふねでいきます。",
      ],
      audioText: "ふねで いきます",
    }),
    listeningCompSentence({
      id: "ja-m17-1-2-lc-basutei",
      audioText: "バスていで バスを まちます",
      correctMeaningEn: "I wait for the bus at the bus stop.",
      distractorsEn: [
        "I go to the bus stop.",
        "I ride the bus at the station.",
        "I buy a bus ticket.",
      ],
    }),
    sentenceMcq({
      id: "ja-m17-1-2-mcq-norimono",
      prompt: "Which sentence means 'What vehicle do you use?'",
      correctKana: "どの のりもので いきますか。",
      distractorsKana: [
        "どの のりものに いきますか。",
        "どの のりものを いきますか。",
        "この のりもので いきますか。",
      ],
      explanation: "で marks the vehicle; どの = which.",
    }),
    selfExplain({
      id: "ja-m17-1-2-self-explain",
      anchorLabel: "えきで きっぷを かいます",
      anchorAudioText: "えきで きっぷを かいます",
      question: "Is で after えき the same as で after タクシー?",
      rule: { text: "Yes — same particle で, but different use. えきで = at the station (location of action). タクシーで = by taxi (means). Context determines meaning." },
      surface: { text: "No — で after えき is a location particle, but で after タクシー is a completely different particle." },
      distractor: { text: "No — you should use に after えき, not で." },
      ruleExplanation:
        "で has two faces: location-of-action (えきで かいます = buy at the station) and means/tool (タクシーで いきます = go by taxi). Same particle, context-driven.",
    }),
    speaking(
      "ja-m17-1-2-speak-kippu",
      "えきで ともだちを まちます",
      "I wait for a friend at the station.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-1-2-rev-mcq-1", M17_1_2_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-1-2-rev-lc-1",
      audioText: M17_1_2_REVIEW[1].kana,
      correctMeaningEn: M17_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_1_2_REVIEW[2].meaningEn,
        M17_1_2_REVIEW[3].meaningEn,
        M17_REVIEW_POOL[1].meaningEn,
      ],
    }),
    speaking("ja-m17-1-2-rev-speak-1", M17_1_2_REVIEW[2].kana, M17_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-1-2-rev", M17_1_2_REVIEW),
    infoStep(
      "ja-m17-1-2-info-end",
      "You can now say how you travel and where you buy tickets",
      "Transport vocab drilled — で for the vehicle, に for the destination. Solid foundation.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_1_2.steps);
assertAnswerRotation(M17_1_2.steps, 1);
assertNoConsecutiveSame(M17_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-2-1 — "Where are you going?" (に destination + へ direction)
// ═══════════════════════════════════════════════════════════════════════

const M17_2_1_REVIEW = pickReviewAtoms("ja-m17-2-1-rev", M17_REVIEW_POOL, 6);

export const M17_2_1: LessonContent = {
  id: "ja-m17-2-1",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Where are you going?",
  description:
    "に for destination vs へ for direction. Motion verbs のる, おりる.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m17-2-1-info-open",
      "Destinations and directions",
      "Two particles that get you moving — に for the arrival point, へ for the general direction. Plus two verbs: get on and get off.",
    ),
    RULE_NI_DESTINATION,
    RULE_E_DIRECTION,
    // ── のる (ride / get on) ──
    build(
      "ja-m17-2-1-build-noru",
      "Pick the Japanese word for: Get on / Ride",
      "のる",
      ["くる", "のる", "いく", "おりる"],
      ["のる"],
    ),
    listeningCompSentence({
      id: "ja-m17-2-1-lc-noru",
      audioText: "バスに のります",
      correctMeaningEn: "I get on the bus.",
      distractorsEn: [
        "I get off the bus.",
        "I get on the train.",
        "I wait for the bus.",
      ],
    }),
    // ── おりる (get off) ──
    build(
      "ja-m17-2-1-build-oriru",
      "Pick the Japanese word for: Get off",
      "おりる",
      ["とまる", "わたる", "のる", "おりる"],
      ["おりる"],
    ),
    speaking("ja-m17-2-1-speak-oriru", "おりる", "Get off"),
    // ── に destination drills ──
    build(
      "ja-m17-2-1-build-eki-ni",
      "Say: I go to the station.",
      "えきに いきます",
      ["に", "いきます", "かえります", "へ", "えき", "で"],
      ["えき", "に", "いきます"],
    ),
    translateStep({
      id: "ja-m17-2-1-translate-ni",
      promptEn: "I go to the hospital.",
      acceptedAnswers: [
        "びょういんに いきます",
        "びょういんに いきます。",
        "びょういんへ いきます",
        "びょういんへ いきます。",
      ],
      audioText: "びょういんに いきます",
    }),
    // ── へ direction drills ──
    cloze(
      "ja-m17-2-1-cloze-e",
      "えき",
      " いきます。",
      "へ",
      ["へ", "で", "を", "が"],
      "I head toward the station.",
      "えきへ いきます。",
      "へ marks the direction — heading toward the station.",
    ),
    sentenceMcq({
      id: "ja-m17-2-1-mcq-ni-e",
      prompt: "Which sentence emphasizes arriving AT the airport?",
      correctKana: "くうこうに いきます。",
      distractorsKana: [
        "くうこうへ いきます。",
        "くうこうで いきます。",
        "くうこうを いきます。",
      ],
      explanation: "に emphasizes the arrival point. へ is also acceptable but emphasizes direction.",
    }),
    build(
      "ja-m17-2-1-build-noru-densha",
      "Say: I get on the train.",
      "でんしゃに のります",
      ["で", "に", "のります", "おります", "でんしゃ", "を"],
      ["でんしゃ", "に", "のります"],
    ),
    listeningBuildSentence({
      id: "ja-m17-2-1-lb-oriru",
      target: "バスを おります",
      tiles: ["のります", "おります", "で", "に", "を", "バス"],
      correctOrder: ["バス", "を", "おります"],
      promptEn: "Hear it, build it: 'I get off the bus.'",
    }),
    listeningCompSentence({
      id: "ja-m17-2-1-lc-noru-densha",
      audioText: "タクシーに のります",
      correctMeaningEn: "I get in a taxi.",
      distractorsEn: [
        "I get out of a taxi.",
        "I go by taxi.",
        "I wait for a taxi.",
      ],
    }),
    selfExplain({
      id: "ja-m17-2-1-self-explain",
      anchorLabel: "でんしゃに のります / バスを おります",
      anchorAudioText: "でんしゃに のります",
      question: "Why に with のる but を with おりる?",
      rule: { text: "のる takes に (you get ON to/into the vehicle). おりる takes を (you get OFF out of the vehicle). Different verbs demand different particles." },
      surface: { text: "Both verbs use に — you should say バスに おります." },
      distractor: { text: "のる uses で because the train is a vehicle." },
      ruleExplanation:
        "のる = board (に marks what you board onto). おりる = alight (を marks what you exit from). Pair them: でんしゃに のる / でんしゃを おりる.",
    }),
    speaking(
      "ja-m17-2-1-speak-eki",
      "えきに いきます",
      "I go to the station.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-2-1-rev-mcq-1", M17_2_1_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-2-1-rev-lc-1",
      // Sentence-level review of なな (M5) — 2026-07-12 listening backfill.
      audioText: "きっぷは ななひゃくえんです",
      correctMeaningEn: "The ticket is 700 yen.",
      distractorsEn: [
        "The ticket is 100 yen.",
        "The ticket is 7,000 yen.",
        "The ticket is 70 yen.",
      ],
    }),
    speaking("ja-m17-2-1-rev-speak-1", M17_2_1_REVIEW[2].kana, M17_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-2-1-rev", M17_2_1_REVIEW),
    infoStep(
      "ja-m17-2-1-info-end",
      "You can now say where you're going and how you get on and off",
      "に for destinations, へ for direction, のる to board, おりる to alight — motion in Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_2_1.steps);
assertAnswerRotation(M17_2_1.steps, 1);
assertNoConsecutiveSame(M17_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-2-2 — "Getting on and off" practice
// ═══════════════════════════════════════════════════════════════════════

const M17_2_2_REVIEW = pickReviewAtoms("ja-m17-2-2-rev", M17_REVIEW_POOL, 6);

export const M17_2_2: LessonContent = {
  id: "ja-m17-2-2",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Getting on and off",
  description:
    "Drill に/へ with motion verbs のる/おりる. Interleaved M3-M7 review.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m17-2-2-info-open",
      "Board and alight",
      "Practice getting on and off vehicles. Mix に, へ, and で in the same sentences.",
    ),
    build(
      "ja-m17-2-2-build-1",
      "Say: I get on the bus at the bus stop.",
      "バスていで バスに のります",
      ["を", "おります", "バス", "のります", "バスてい", "に", "で"],
      ["バスてい", "で", "バス", "に", "のります"],
    ),
    listeningCompSentence({
      id: "ja-m17-2-2-lc-1",
      audioText: "えきで でんしゃを おります",
      correctMeaningEn: "I get off the train at the station.",
      distractorsEn: [
        "I get on the train at the station.",
        "I go to the station by train.",
        "I wait for the train at the station.",
      ],
    }),
    listeningBuildSentence({
      id: "ja-m17-2-2-lb-noru",
      target: "ふねに のります",
      tiles: ["のります", "ふね", "に", "おります", "を"],
      correctOrder: ["ふね", "に", "のります"],
      promptEn: "Hear it, build it: 'I get on the boat.'",
    }),
    sentenceMcq({
      id: "ja-m17-2-2-mcq-oriru",
      prompt: "Which sentence means 'I get off the train.'?",
      correctKana: "でんしゃを おります。",
      distractorsKana: [
        "でんしゃに のります。",
        "でんしゃで いきます。",
        "でんしゃに おります。",
      ],
      explanation: "おりる takes を — you exit FROM the train.",
    }),
    build(
      "ja-m17-2-2-build-2",
      "Say: I head toward the airport by taxi.",
      "タクシーで くうこうへ いきます",
      ["いきます", "で", "へ", "を", "に", "くうこう", "タクシー"],
      ["タクシー", "で", "くうこう", "へ", "いきます"],
    ),
    listeningCompSentence({
      id: "ja-m17-2-2-lc-oriru-fune",
      audioText: "ふねを おります",
      correctMeaningEn: "I get off the boat.",
      distractorsEn: [
        "I get on the boat.",
        "I go by boat.",
        "I stop the boat.",
      ],
    }),
    listeningBuildSentence({
      id: "ja-m17-2-2-lb-1",
      target: "えきで でんしゃに のります",
      tiles: ["のります", "でんしゃ", "に", "おります", "えき", "を", "で"],
      correctOrder: ["えき", "で", "でんしゃ", "に", "のります"],
      promptEn: "Hear it, build it: 'I get on the train at the station.'",
    }),
    speaking(
      "ja-m17-2-2-speak-1",
      "バスていで バスに のります",
      "I get on the bus at the bus stop.",
    ),
    translateStep({
      id: "ja-m17-2-2-translate-1",
      promptEn: "I get off the bus.",
      acceptedAnswers: [
        "バスを おります",
        "バスを おります。",
        "バスをおります",
        "バスをおります。",
      ],
      audioText: "バスを おります",
    }),
    build(
      "ja-m17-2-2-build-3",
      "Say: I buy a ticket and get on the train.",
      "きっぷを かってから でんしゃに のります",
      ["を", "かって", "のります", "でんしゃ", "から", "きっぷ", "おります", "に"],
      ["きっぷ", "を", "かって", "から", "でんしゃ", "に", "のります"],
    ),
    listeningCompSentence({
      id: "ja-m17-2-2-lc-2",
      audioText: "タクシーで くうこうへ いきます",
      correctMeaningEn: "I head toward the airport by taxi.",
      distractorsEn: [
        "I go to the airport by bus.",
        "I head toward the station by taxi.",
        "I get on a taxi at the airport.",
      ],
    }),
    cloze(
      "ja-m17-2-2-cloze-e",
      "がっこう",
      " いきます。",
      "へ",
      ["へ", "は", "で", "を"],
      "I head toward school.",
      "がっこうへ いきます。",
      "へ marks the direction of travel.",
    ),
    selfExplain({
      id: "ja-m17-2-2-self-explain",
      anchorLabel: "でんしゃに のります / バスを おります",
      anchorAudioText: "バスを おります",
      question: "You learned のる takes に and おりる takes を. Why the difference?",
      rule: { text: "のる (board) uses に because you're entering INTO something. おりる (alight) uses を because you're exiting FROM something. The particle reflects the direction of the action." },
      surface: { text: "There's no real reason — you just have to memorize which verb takes which particle." },
      distractor: { text: "のる actually takes を too — both are correct with を." },
      ruleExplanation:
        "に = toward/into (boarding). を = away/out of (alighting). The particle matches the motion direction.",
    }),
    speaking(
      "ja-m17-2-2-speak-2",
      "タクシーで くうこうへ いきます",
      "I head toward the airport by taxi.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-2-2-rev-mcq-1", M17_2_2_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-2-2-rev-lc-1",
      audioText: M17_2_2_REVIEW[1].kana,
      correctMeaningEn: M17_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_2_2_REVIEW[2].meaningEn,
        M17_2_2_REVIEW[3].meaningEn,
        M17_REVIEW_POOL[3].meaningEn,
      ],
    }),
    speaking("ja-m17-2-2-rev-speak-1", M17_2_2_REVIEW[2].kana, M17_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-2-2-rev", M17_2_2_REVIEW),
    infoStep(
      "ja-m17-2-2-info-end",
      "You can now board, ride, and alight in Japanese",
      "のる (に), おりる (を), で for vehicles, へ for direction — the full transit toolkit.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_2_2.steps);
assertAnswerRotation(M17_2_2.steps, 1);
assertNoConsecutiveSame(M17_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-3-1 — "Asking for directions" vocab
//   (まっすぐ, みぎ, ひだり, わたる, まがる, とまる)
// ═══════════════════════════════════════════════════════════════════════

const M17_3_1_REVIEW = pickReviewAtoms("ja-m17-3-1-rev", M17_REVIEW_POOL, 6);

export const M17_3_1: LessonContent = {
  id: "ja-m17-3-1",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Asking for directions I",
  description:
    "Direction words + three motion verbs: straight, right, left, cross, turn, stop.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m17-3-1-info-open",
      "Finding your way",
      "Straight, right, left — three direction words and three verbs to get you wherever you need to go.",
    ),
    // ── まっすぐ (straight) ──
    build(
      "ja-m17-3-1-build-massugu",
      "Pick the Japanese word for: Straight ahead",
      "まっすぐ",
      ["ひだり", "まっすぐ", "みぎ", "うしろ"],
      ["まっすぐ"],
    ),
    listeningCompSentence({
      id: "ja-m17-3-1-lc-massugu",
      audioText: "まっすぐ いってください",
      correctMeaningEn: "Please go straight.",
      distractorsEn: [
        "Please turn right.",
        "Please stop here.",
        "Please come here.",
      ],
    }),
    // ── みぎ (right) ──
    build(
      "ja-m17-3-1-build-migi",
      "Pick the Japanese word for: Right",
      "みぎ",
      ["まっすぐ", "まえ", "ひだり", "みぎ"],
      ["みぎ"],
    ),
    vocabMcq(
      "ja-m17-3-1-mcq-migi",
      { kana: "みぎ", meaningEn: "right", emoji: "👉", fromModule: "m17" },
      M17_REVIEW_POOL,
    ),
    // ── ひだり (left) ──
    build(
      "ja-m17-3-1-build-hidari",
      "Pick the Japanese word for: Left",
      "ひだり",
      ["まっすぐ", "みぎ", "ひだり", "した"],
      ["ひだり"],
    ),
    vocabMcq(
      "ja-m17-3-1-mcq-hidari",
      { kana: "ひだり", meaningEn: "left", emoji: "👈", fromModule: "m17" },
      M17_REVIEW_POOL,
    ),
    // ── わたる (cross) ──
    build(
      "ja-m17-3-1-build-wataru",
      "Pick the Japanese word for: Cross (a street)",
      "わたる",
      ["あるく", "とまる", "わたる", "まがる"],
      ["わたる"],
    ),
    speaking("ja-m17-3-1-speak-wataru", "わたる", "Cross"),
    // ── まがる (turn) ──
    build(
      "ja-m17-3-1-build-magaru",
      "Pick the Japanese word for: Turn",
      "まがる",
      ["とまる", "まがる", "わたる", "はしる"],
      ["まがる"],
    ),
    listeningCompSentence({
      id: "ja-m17-3-1-lc-magaru",
      audioText: "まがる",
      correctMeaningEn: "turn",
      distractorsEn: ["cross", "stop", "walk"],
    }),
    // ── とまる (stop) ──
    build(
      "ja-m17-3-1-build-tomaru",
      "Pick the Japanese word for: Stop",
      "とまる",
      ["わたる", "とまる", "のる", "まがる"],
      ["とまる"],
    ),
    speaking("ja-m17-3-1-speak-tomaru", "とまる", "Stop"),
    // ── Direction sentence drills ──
    build(
      "ja-m17-3-1-build-migi-magaru",
      "Say: Please turn right.",
      "みぎへ まがってください",
      ["ひだり", "まがって", "ください", "へ", "みぎ", "わたって"],
      ["みぎ", "へ", "まがって", "ください"],
    ),
    cloze(
      "ja-m17-3-1-cloze-e",
      "ひだり",
      " まがってください。",
      "へ",
      ["へ", "が", "で", "を"],
      "Please turn left.",
      "ひだりへ まがってください。",
      "へ marks the direction you turn toward.",
    ),
    sentenceMcq({
      id: "ja-m17-3-1-mcq-massugu",
      prompt: "Which sentence means 'Please go straight.'?",
      correctKana: "まっすぐ いってください。",
      distractorsKana: [
        "みぎへ いってください。",
        "ひだりへ まがってください。",
        "まっすぐ かえってください。",
      ],
      explanation: "まっすぐ = straight. いってください = please go.",
    }),
    selfExplain({
      id: "ja-m17-3-1-self-explain",
      anchorLabel: "みぎへ まがってください",
      anchorAudioText: "みぎへ まがってください",
      question: "Why へ instead of に here?",
      rule: { text: "へ marks the DIRECTION you turn toward. に would also work (meaning you arrive at the right), but へ is more natural for giving directional instructions." },
      surface: { text: "へ is only for directions on a map — に is for all other movement." },
      distractor: { text: "へ is used because まがる is a special verb that only takes へ." },
      ruleExplanation:
        "へ emphasizes the direction of movement. Both に and へ work with motion verbs, but directions (turn right, go straight) favor へ.",
    }),
    speaking(
      "ja-m17-3-1-speak-massugu",
      "まっすぐ いってください",
      "Please go straight.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-3-1-rev-mcq-1", M17_3_1_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-3-1-rev-lc-1",
      // Sentence-level review of けいたい (M4) — 2026-07-12 listening backfill.
      audioText: "けいたいを みせてください",
      correctMeaningEn: "Please show me your mobile phone.",
      distractorsEn: [
        "Please show me your camera.",
        "Please buy a mobile phone.",
        "I am looking at my mobile phone.",
      ],
    }),
    reviewMatchPairs("ja-m17-3-1-rev", M17_3_1_REVIEW),
    infoStep(
      "ja-m17-3-1-info-end",
      "You can now give basic directions in Japanese",
      "まっすぐ, みぎ, ひだり + わたる, まがる, とまる — navigate any street.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_3_1.steps);
assertAnswerRotation(M17_3_1.steps, 1);
assertNoConsecutiveSame(M17_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-3-2 — "Asking for directions" drill
// ═══════════════════════════════════════════════════════════════════════

const M17_3_2_REVIEW = pickReviewAtoms("ja-m17-3-2-rev", M17_REVIEW_POOL, 6);

export const M17_3_2: LessonContent = {
  id: "ja-m17-3-2",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Asking for directions II",
  description:
    "Drill direction instructions: turn, cross, go straight. Full sentences with へ.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m17-3-2-info-open",
      "Direction drill",
      "Give directions like a local — straight, turn left, cross the street. Put your direction vocab to work.",
    ),
    build(
      "ja-m17-3-2-build-1",
      "Say: Please cross the street.",
      "みちを わたってください",
      ["わたって", "へ", "ください", "を", "みち", "まがって"],
      ["みち", "を", "わたって", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m17-3-2-lc-1",
      audioText: "ひだりへ まがってから、はしを わたってください",
      correctMeaningEn: "Turn left, then cross the bridge.",
      distractorsEn: [
        "Cross the bridge, then turn left.",
        "Turn right, then cross the bridge.",
        "Turn left, then cross the street.",
      ],
    }),
    cloze(
      "ja-m17-3-2-cloze-e-1",
      "ゆうびんきょく",
      " いきます。",
      "へ",
      ["へ", "は", "で", "を"],
      "I head toward the post office.",
      "ゆうびんきょくへ いきます。",
      "へ marks the direction of travel.",
    ),
    sentenceMcq({
      id: "ja-m17-3-2-mcq-wataru",
      prompt: "Which sentence means 'Please cross the bridge.'?",
      correctKana: "はしを わたってください。",
      distractorsKana: [
        "はしへ まがってください。",
        "はしで とまってください。",
        "はしを まがってください。",
      ],
      explanation: "わたる = cross. はし = bridge. を marks what you cross.",
    }),
    build(
      "ja-m17-3-2-build-2",
      "Say: Go straight, then turn left.",
      "まっすぐ いってから ひだりへ まがってください",
      ["へ", "まがって", "ください", "まっすぐ", "ひだり", "みぎ", "いって", "から"],
      ["まっすぐ", "いって", "から", "ひだり", "へ", "まがって", "ください"],
    ),
    build(
      "ja-m17-3-2-build-wataru-magaru",
      "Say: Cross the street, then turn right.",
      "みちを わたってから、みぎへ まがってください",
      ["みぎ", "わたって", "みち", "を", "から", "へ", "まがって", "ください", "ひだり"],
      ["みち", "を", "わたって", "から", "みぎ", "へ", "まがって", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m17-3-2-lb-1",
      target: "ここで とまってください",
      tiles: ["とまって", "ここ", "で", "ください", "まがって", "わたって"],
      correctOrder: ["ここ", "で", "とまって", "ください"],
      promptEn: "Hear it, build it: 'Please stop here.'",
    }),
    speaking(
      "ja-m17-3-2-speak-1",
      "まっすぐ いってください",
      "Please go straight.",
    ),
    translateStep({
      id: "ja-m17-3-2-translate-1",
      promptEn: "Please turn left.",
      acceptedAnswers: [
        "ひだりへ まがってください",
        "ひだりへ まがってください。",
        "ひだりに まがってください",
        "ひだりに まがってください。",
      ],
      audioText: "ひだりへ まがってください",
    }),
    build(
      "ja-m17-3-2-build-3",
      "Say: The bus stops here.",
      "バスは ここで とまります",
      ["に", "バス", "とまります", "は", "いきます", "で", "ここ"],
      ["バス", "は", "ここ", "で", "とまります"],
    ),
    listeningCompSentence({
      id: "ja-m17-3-2-lc-2",
      audioText: "まっすぐ いってから みぎへ まがってください",
      correctMeaningEn: "Go straight, then turn right.",
      distractorsEn: [
        "Turn right, then go straight.",
        "Go straight, then turn left.",
        "Go straight and stop.",
      ],
    }),
    sentenceMcq({
      id: "ja-m17-3-2-mcq-massugu",
      prompt: "Which sentence means 'Go straight, then cross the street.'?",
      correctKana: "まっすぐ いってから みちを わたってください。",
      distractorsKana: [
        "まっすぐ いってから みぎへ まがってください。",
        "みちを わたってから まっすぐ いってください。",
        "ひだりへ まがってから みちを わたってください。",
      ],
      explanation: "まっすぐ いってから = after going straight. みちを わたって = cross the street.",
    }),
    selfExplain({
      id: "ja-m17-3-2-self-explain",
      anchorLabel: "まっすぐ いってから ひだりへ まがってください",
      anchorAudioText: "まっすぐ いってから ひだりへ まがってください",
      question: "What does てから do in this direction sentence?",
      rule: { text: "てから establishes time sequence — first go straight, THEN turn left. The first action must finish before the second begins." },
      surface: { text: "てから means 'because' — because you go straight, turn left." },
      distractor: { text: "てから is just a polite way to connect two commands — it has no time meaning." },
      ruleExplanation:
        "て-form + から = 'after doing A, do B.' Strict sequence. Not to be confused with dictionary-form + から = 'because.'",
    }),
    speaking(
      "ja-m17-3-2-speak-2",
      "バスていで とまってください",
      "Please stop at the bus stop.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-3-2-rev-mcq-1", M17_3_2_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-3-2-rev-lc-1",
      // Sentence-level review of ペン (M12) — 2026-07-12 listening backfill.
      audioText: "ペンを かしてください",
      correctMeaningEn: "Please lend me a pen.",
      distractorsEn: [
        "Please lend me a book.",
        "Please buy a pen.",
        "I lent a pen.",
      ],
    }),
    speaking("ja-m17-3-2-rev-speak-1", M17_3_2_REVIEW[2].kana, M17_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-3-2-rev", M17_3_2_REVIEW),
    infoStep(
      "ja-m17-3-2-info-end",
      "You can now give multi-step directions in Japanese",
      "Straight, turn, cross, stop — chained with てから for step-by-step navigation.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_3_2.steps);
assertAnswerRotation(M17_3_2.steps, 1);
assertNoConsecutiveSame(M17_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-4-1 — "Nearby places" vocab
//   (むこう, そば, ちかく, となり, あいだ)
// ═══════════════════════════════════════════════════════════════════════

const M17_4_1_REVIEW = pickReviewAtoms("ja-m17-4-1-rev", M17_REVIEW_POOL, 6);

export const M17_4_1: LessonContent = {
  id: "ja-m17-4-1",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Nearby places I",
  description:
    "Five relative-location words: across, nearby, close, next to, between.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m17-4-1-info-open",
      "Where is it?",
      "Five words that place things in relation to each other — across, nearby, close, next to, and between.",
    ),
    // ── むこう (other side / across) ──
    build(
      "ja-m17-4-1-build-mukou",
      "Pick the Japanese word for: The other side / Across",
      "むこう",
      ["となり", "むこう", "ちかく", "そば"],
      ["むこう"],
    ),
    listeningCompSentence({
      id: "ja-m17-4-1-lc-mukou",
      audioText: "としょかんは えきの むこうです",
      correctMeaningEn: "The library is on the other side of the station.",
      distractorsEn: [
        "The library is next to the station.",
        "The library is near the station.",
        "The station is on the other side of the library.",
      ],
    }),
    // ── そば (beside / near) ──
    build(
      "ja-m17-4-1-build-soba",
      "Pick the Japanese word for: Beside / Near",
      "そば",
      ["ちかく", "そば", "むこう", "あいだ"],
      ["そば"],
    ),
    speaking("ja-m17-4-1-speak-soba", "そば", "Beside / Near"),
    // ── ちかく (close / nearby area) ──
    build(
      "ja-m17-4-1-build-chikaku",
      "Pick the Japanese word for: Close / Nearby",
      "ちかく",
      ["そば", "むこう", "となり", "ちかく"],
      ["ちかく"],
    ),
    listeningCompSentence({
      id: "ja-m17-4-1-lc-chikaku",
      audioText: "こうえんは うちの ちかくです",
      correctMeaningEn: "The park is near my house.",
      distractorsEn: [
        "The park is far from my house.",
        "The bank is near my house.",
        "The park is behind my house.",
      ],
    }),
    // ── となり (next to) ──
    build(
      "ja-m17-4-1-build-tonari",
      "Pick the Japanese word for: Next to",
      "となり",
      ["そば", "あいだ", "ちかく", "となり"],
      ["となり"],
    ),
    speaking("ja-m17-4-1-speak-tonari", "となり", "Next to"),
    // ── あいだ (between) ──
    build(
      "ja-m17-4-1-build-aida",
      "Pick the Japanese word for: Between",
      "あいだ",
      ["そば", "となり", "あいだ", "むこう"],
      ["あいだ"],
    ),
    listeningCompSentence({
      id: "ja-m17-4-1-lc-aida",
      audioText: "ホテルは えきと ぎんこうの あいだです",
      correctMeaningEn: "The hotel is between the station and the bank.",
      distractorsEn: [
        "The hotel is next to the station.",
        "The bank is between the station and the hotel.",
        "The hotel is in front of the bank.",
      ],
    }),
    // ── Location sentence drills ──
    build(
      "ja-m17-4-1-build-tonari-eki",
      "Say: The post office is next to the station.",
      "ゆうびんきょくは えきの となりです",
      ["そば", "は", "です", "となり", "ゆうびんきょく", "ちかく", "の", "えき"],
      ["ゆうびんきょく", "は", "えき", "の", "となり", "です"],
    ),
    cloze(
      "ja-m17-4-1-cloze-no-1",
      "えき",
      " ちかくに コンビニが あります。",
      "の",
      ["の", "に", "で", "は"],
      "There's a convenience store near the station.",
      "えきの ちかくに コンビニが あります。",
      "の connects えき to ちかく — 'the station's nearby area.'",
    ),
    sentenceMcq({
      id: "ja-m17-4-1-mcq-aida",
      prompt: "Which sentence means 'The bank is between the station and the post office.'?",
      correctKana: "ぎんこうは えきと ゆうびんきょくの あいだです。",
      distractorsKana: [
        "ぎんこうは えきの となりです。",
        "ぎんこうは えきの ちかくです。",
        "ぎんこうは えきの むこうです。",
      ],
      explanation: "Aと Bの あいだ = between A and B.",
    }),
    listeningBuildSentence({
      id: "ja-m17-4-1-lb-mukou",
      target: "みせは みちの むこうです",
      tiles: ["です", "ちかく", "となり", "は", "みせ", "みち", "むこう", "の"],
      correctOrder: ["みせ", "は", "みち", "の", "むこう", "です"],
      promptEn: "Hear it, build it: 'The shop is across the street.'",
    }),
    selfExplain({
      id: "ja-m17-4-1-self-explain",
      anchorLabel: "えきの ちかくに コンビニが あります",
      anchorAudioText: "えきの ちかくに コンビニが あります",
      question: "Why の between えき and ちかく?",
      rule: { text: "の connects the noun (えき) to the relative location word (ちかく) — 'the station's nearby area.' All location words (ちかく, そば, となり, あいだ, むこう) connect to their reference noun with の." },
      surface: { text: "の means 'of' — えきの ちかく literally means 'close of station,' which doesn't need の." },
      distractor: { text: "の is only needed for ちかく — other location words attach directly." },
      ruleExplanation:
        "All relative-location words use the pattern: Reference Noun + の + Location Word. えきの となり, えきの そば, えきの ちかく — consistent structure.",
    }),
    speaking(
      "ja-m17-4-1-speak-tonari-eki",
      "ゆうびんきょくは えきの となりです",
      "The post office is next to the station.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-4-1-rev-mcq-1", M17_4_1_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-4-1-rev-lc-1",
      // Sentence-level review of ほん (M3) — 2026-07-12 listening backfill.
      audioText: "としょかんで ほんを よみます",
      correctMeaningEn: "I read books at the library.",
      distractorsEn: [
        "I read books at school.",
        "I buy books at the library.",
        "I read newspapers at the library.",
      ],
    }),
    speaking("ja-m17-4-1-rev-speak-1", M17_4_1_REVIEW[2].kana, M17_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-4-1-rev", M17_4_1_REVIEW),
    infoStep(
      "ja-m17-4-1-info-end",
      "You can now describe where things are in relation to each other",
      "むこう, そば, ちかく, となり, あいだ — five ways to pinpoint a location.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_4_1.steps);
assertAnswerRotation(M17_4_1.steps, 1);
assertNoConsecutiveSame(M17_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-4-2 — "Nearby places" drill
// ═══════════════════════════════════════════════════════════════════════

const M17_4_2_REVIEW = pickReviewAtoms("ja-m17-4-2-rev", M17_REVIEW_POOL, 6);

export const M17_4_2: LessonContent = {
  id: "ja-m17-4-2",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Nearby places II",
  description:
    "Drill relative-location words in full sentences with の + location pattern.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m17-4-2-info-open",
      "Location drill",
      "Put location words into real sentences — describe where buildings and shops are relative to each other.",
    ),
    build(
      "ja-m17-4-2-build-1",
      "Say: The hospital is near the station.",
      "びょういんは えきの そばです",
      ["ちかく", "そば", "は", "えき", "びょういん", "です", "の", "となり"],
      ["びょういん", "は", "えき", "の", "そば", "です"],
    ),
    listeningCompSentence({
      id: "ja-m17-4-2-lc-1",
      audioText: "コンビニは ぎんこうの となりです",
      correctMeaningEn: "The convenience store is next to the bank.",
      distractorsEn: [
        "The convenience store is near the bank.",
        "The bank is next to the convenience store.",
        "The convenience store is across from the bank.",
      ],
    }),
    build(
      "ja-m17-4-2-build-chikaku",
      "Say: There's a post office near the bank.",
      "ぎんこうの ちかくに ゆうびんきょくが あります",
      ["ゆうびんきょく", "ちかく", "ぎんこう", "の", "に", "が", "あります", "となり"],
      ["ぎんこう", "の", "ちかく", "に", "ゆうびんきょく", "が", "あります"],
    ),
    sentenceMcq({
      id: "ja-m17-4-2-mcq-mukou",
      prompt: "Which sentence means 'The shop is across the street.'?",
      correctKana: "みせは みちの むこうです。",
      distractorsKana: [
        "みせは みちの ちかくです。",
        "みせは みちの となりです。",
        "みせは みちの そばです。",
      ],
      explanation: "むこう = the other side / across.",
    }),
    build(
      "ja-m17-4-2-build-2",
      "Say: The park is between the school and the hospital.",
      "こうえんは がっこうと びょういんの あいだです",
      ["がっこう", "びょういん", "は", "こうえん", "そば", "あいだ", "です", "の", "と"],
      ["こうえん", "は", "がっこう", "と", "びょういん", "の", "あいだ", "です"],
    ),
    listeningCompSentence({
      id: "ja-m17-4-2-lc-aida",
      audioText: "えきと ゆうびんきょくの あいだに ぎんこうが あります",
      correctMeaningEn: "There's a bank between the station and the post office.",
      distractorsEn: [
        "There's a bank next to the station.",
        "There's a post office between the station and the bank.",
        "There's a bank across from the post office.",
      ],
    }),
    listeningBuildSentence({
      id: "ja-m17-4-2-lb-1",
      target: "びょういんは えきの ちかくです",
      tiles: ["の", "むこう", "です", "えき", "びょういん", "ちかく", "は", "となり"],
      correctOrder: ["びょういん", "は", "えき", "の", "ちかく", "です"],
      promptEn: "Hear it, build it: 'The hospital is near the station.'",
    }),
    speaking(
      "ja-m17-4-2-speak-1",
      "コンビニは えきの となりです",
      "The convenience store is next to the station.",
    ),
    translateStep({
      id: "ja-m17-4-2-translate-1",
      promptEn: "The shop is across the street.",
      acceptedAnswers: [
        "みせは みちの むこうです",
        "みせは みちの むこうです。",
      ],
      audioText: "みせは みちの むこうです",
    }),
    build(
      "ja-m17-4-2-build-3",
      "Say: There's a convenience store near the hospital.",
      "びょういんの ちかくに コンビニが あります",
      ["の", "ちかく", "が", "は", "に", "あります", "コンビニ", "びょういん"],
      ["びょういん", "の", "ちかく", "に", "コンビニ", "が", "あります"],
    ),
    listeningCompSentence({
      id: "ja-m17-4-2-lc-2",
      audioText: "こうえんは がっこうと びょういんの あいだです",
      correctMeaningEn: "The park is between the school and the hospital.",
      distractorsEn: [
        "The park is next to the school.",
        "The park is near the hospital.",
        "The school is between the park and the hospital.",
      ],
    }),
    build(
      "ja-m17-4-2-build-soba",
      "Say: There's a restaurant near the station.",
      "えきの そばに レストランが あります",
      ["レストラン", "そば", "えき", "の", "に", "が", "あります", "むこう"],
      ["えき", "の", "そば", "に", "レストラン", "が", "あります"],
    ),
    selfExplain({
      id: "ja-m17-4-2-self-explain",
      anchorLabel: "All location words use Noun + の + Location",
      anchorAudioText: "えきの となりです",
      question: "What's the pattern for placing things relative to a reference point?",
      rule: { text: "[Reference noun] + の + [location word] + に/です. えきの となり = next to the station. The の always connects the reference to the location word." },
      surface: { text: "You put the location word first, then の, then the reference noun." },
      distractor: { text: "Only となり and そば use の. ちかく and あいだ connect directly." },
      ruleExplanation:
        "Consistent pattern: Noun の {となり/そば/ちかく/あいだ/むこう}. All relative-location words follow this structure.",
    }),
    speaking(
      "ja-m17-4-2-speak-2",
      "びょういんの ちかくに コンビニが あります",
      "There's a convenience store near the hospital.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-4-2-rev-mcq-1", M17_4_2_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-4-2-rev-lc-1",
      // Sentence-level review of カメラ (M11) — 2026-07-12 listening backfill.
      audioText: "カメラを かいたいです",
      correctMeaningEn: "I want to buy a camera.",
      distractorsEn: [
        "I want to buy a mobile phone.",
        "I bought a camera.",
        "I want to sell a camera.",
      ],
    }),
    speaking("ja-m17-4-2-rev-speak-1", M17_4_2_REVIEW[2].kana, M17_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-4-2-rev", M17_4_2_REVIEW),
    infoStep(
      "ja-m17-4-2-info-end",
      "You can now describe exactly where things are around you",
      "Next to, near, between, across — five location words locked in with the Noun の pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_4_2.steps);
assertAnswerRotation(M17_4_2.steps, 1);
assertNoConsecutiveSame(M17_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-8-1 — "Positions" (NOT YET REGISTERED — expansion pair 1/2)
//   Backlog N5 position words: まえ (front), うしろ, なか, した, よこ.
//   Suggested registration slot: between ja-m17-4-2 and ja-m17-5-1.
// ═══════════════════════════════════════════════════════════════════════

const M17_8_1_REVIEW = pickReviewAtoms("ja-m17-8-1-rev", M17_REVIEW_POOL, 6);

export const M17_8_1: LessonContent = {
  id: "ja-m17-8-1",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Positions (intro)",
  description:
    "Five position words: まえ (front), うしろ (behind), なか (inside), した (under), よこ (beside).",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m17-8-1-info-open",
      "In front, behind, inside",
      "You can say near and next to. Now pinpoint things exactly — in front, behind, inside, under, and beside.",
    ),
    // ── まえ (front) ──
    build(
      "ja-m17-8-1-build-mae",
      "Pick the Japanese word for: Front / In front",
      "まえ",
      ["うしろ", "まえ", "なか", "よこ"],
      ["まえ"],
    ),
    listeningCompSentence({
      id: "ja-m17-8-1-lc-mae",
      audioText: "ぎんこうは えきの まえに あります",
      correctMeaningEn: "The bank is in front of the station.",
      distractorsEn: [
        "The bank is behind the station.",
        "The bank is next to the station.",
        "The post office is in front of the station.",
      ],
    }),
    // ── うしろ (behind) ──
    build(
      "ja-m17-8-1-build-ushiro",
      "Pick the Japanese word for: Behind",
      "うしろ",
      ["した", "なか", "うしろ", "まえ"],
      ["うしろ"],
    ),
    speaking("ja-m17-8-1-speak-ushiro", "うしろ", "Behind"),
    // ── なか (inside) ──
    build(
      "ja-m17-8-1-build-naka",
      "Pick the Japanese word for: Inside",
      "なか",
      ["うしろ", "よこ", "した", "なか"],
      ["なか"],
    ),
    listeningCompSentence({
      id: "ja-m17-8-1-lc-naka",
      audioText: "かばんの なかに さいふが あります",
      correctMeaningEn: "There's a wallet inside the bag.",
      distractorsEn: [
        "There's a wallet under the bag.",
        "There's a ticket inside the bag.",
        "There's a wallet inside the room.",
      ],
    }),
    // ── した (under) ──
    build(
      "ja-m17-8-1-build-shita",
      "Pick the Japanese word for: Under / Below",
      "した",
      ["よこ", "した", "まえ", "なか"],
      ["した"],
    ),
    speaking("ja-m17-8-1-speak-shita", "した", "Under / Below"),
    // ── よこ (beside) ──
    build(
      "ja-m17-8-1-build-yoko",
      "Pick the Japanese word for: Beside / Side",
      "よこ",
      ["まえ", "よこ", "うしろ", "した"],
      ["よこ"],
    ),
    listeningCompSentence({
      id: "ja-m17-8-1-lc-yoko",
      audioText: "ドアの よこに いすが あります",
      correctMeaningEn: "There's a chair beside the door.",
      distractorsEn: [
        "There's a chair in front of the door.",
        "There's a bag beside the door.",
        "There's a chair behind the door.",
      ],
    }),
    // ── Position sentence drills ──
    build(
      "ja-m17-8-1-build-mae-eki",
      "Say: The bus stop is in front of the station.",
      "バスていは えきの まえに あります",
      ["えき", "バスてい", "は", "の", "まえ", "に", "あります", "うしろ"],
      ["バスてい", "は", "えき", "の", "まえ", "に", "あります"],
    ),
    sentenceMcq({
      id: "ja-m17-8-1-mcq-naka",
      prompt: "Which sentence means 'There's a ticket inside the bag.'?",
      correctKana: "かばんの なかに きっぷが あります。",
      distractorsKana: [
        "かばんの したに きっぷが あります。",
        "かばんの よこに きっぷが あります。",
        "きっぷの なかに かばんが あります。",
      ],
      explanation: "かばんの なか = inside the bag. Same Noun + の + position pattern.",
    }),
    listeningBuildSentence({
      id: "ja-m17-8-1-lb-shita",
      target: "いすの したに ねこが います",
      tiles: ["ねこ", "いす", "の", "した", "に", "が", "います", "よこ"],
      correctOrder: ["いす", "の", "した", "に", "ねこ", "が", "います"],
      promptEn: "Hear it, build it: 'The cat is under the chair.'",
    }),
    selfExplain({
      id: "ja-m17-8-1-self-explain",
      anchorLabel: "えきの まえに あります",
      anchorAudioText: "バスていは えきの まえに あります",
      question: "Do the new position words use the same pattern as となり and ちかく?",
      rule: { text: "Yes — Reference Noun + の + position word + に. えきの まえ, かばんの なか, いすの した all follow the pattern you learned with となり and ちかく." },
      surface: { text: "No — まえ and うしろ attach directly to the noun without の." },
      distractor: { text: "Position words come BEFORE the reference noun: まえの えき." },
      ruleExplanation:
        "All relative-position words share one structure: Noun + の + {まえ/うしろ/なか/した/よこ/となり/そば/ちかく/あいだ/むこう} + に.",
    }),
    speaking(
      "ja-m17-8-1-speak-ushiro-ginkou",
      "ぎんこうの うしろに こうえんが あります",
      "There's a park behind the bank.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-8-1-rev-mcq-1", M17_8_1_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-8-1-rev-lc-1",
      // Sentence-level review of バス (M8) — 2026-07-12 listening backfill.
      audioText: "バスで びょういんに いきます",
      correctMeaningEn: "I go to the hospital by bus.",
      distractorsEn: [
        "I go to the hospital by taxi.",
        "I go to the bank by bus.",
        "I get off the bus at the hospital.",
      ],
    }),
    speaking("ja-m17-8-1-rev-speak-1", M17_8_1_REVIEW[2].kana, M17_8_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-8-1-rev", M17_8_1_REVIEW),
    infoStep(
      "ja-m17-8-1-info-end",
      "You can now pinpoint exactly where things are",
      "まえ, うしろ, なか, した, よこ — five position words on the familiar Noun + の pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_8_1.steps);
assertAnswerRotation(M17_8_1.steps, 1);
assertNoConsecutiveSame(M17_8_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-8-2 — "Asking a police officer" (NOT YET REGISTERED — expansion 2/2)
//   Backlog N5 words: けいかん (police officer), ポスト (postbox).
//   Practices the 8-1 position words with fresh sentences.
// ═══════════════════════════════════════════════════════════════════════

const M17_8_2_REVIEW = pickReviewAtoms("ja-m17-8-2-rev", M17_REVIEW_POOL, 6);

export const M17_8_2: LessonContent = {
  id: "ja-m17-8-2",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Asking a police officer",
  description:
    "けいかん (police officer) + ポスト (postbox) — ask where things are and use position words in fresh sentences.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m17-8-2-info-open",
      "Lost? Ask the police officer",
      "The classic move in Japan: ask the けいかん at the police box. Two new words, then position practice.",
    ),
    // ── けいかん (police officer) ──
    build(
      "ja-m17-8-2-build-keikan",
      "Pick the Japanese word for: Police officer",
      "けいかん",
      ["せんせい", "けいかん", "がくせい", "ともだち"],
      ["けいかん"],
    ),
    vocabMcq(
      "ja-m17-8-2-mcq-keikan",
      { kana: "けいかん", meaningEn: "police officer", emoji: "👮", fromModule: "m17" },
      M17_REVIEW_POOL,
    ),
    // ── ポスト (postbox) ──
    build(
      "ja-m17-8-2-build-posuto",
      "Pick the Japanese word for: Postbox",
      "ポスト",
      ["バスてい", "ポスト", "きっぷ", "ゆうびんきょく"],
      ["ポスト"],
    ),
    vocabMcq(
      "ja-m17-8-2-mcq-posuto",
      { kana: "ポスト", meaningEn: "postbox", emoji: "📮", fromModule: "m17" },
      M17_REVIEW_POOL,
    ),
    // ── Asking + position drills ──
    build(
      "ja-m17-8-2-build-doko",
      "Say: Excuse me, where is the postbox?",
      "すみません、ポストは どこですか",
      ["どこですか", "すみません", "ポスト", "は", "ここですか", "けいかん"],
      ["すみません", "ポスト", "は", "どこですか"],
    ),
    listeningCompSentence({
      id: "ja-m17-8-2-lc-posuto-mae",
      audioText: "ポストは ぎんこうの まえに あります",
      correctMeaningEn: "The postbox is in front of the bank.",
      distractorsEn: [
        "The postbox is behind the bank.",
        "The postbox is inside the bank.",
        "The postbox is beside the bank.",
      ],
    }),
    build(
      "ja-m17-8-2-build-kikimasu",
      "Say: I ask the police officer.",
      "けいかんに ききます",
      ["ききます", "けいかん", "に", "を", "いきます"],
      ["けいかん", "に", "ききます"],
    ),
    sentenceMcq({
      id: "ja-m17-8-2-mcq-ushiro",
      prompt: "Which sentence means 'The police officer is behind the post office.'?",
      correctKana: "けいかんは ゆうびんきょくの うしろに います。",
      distractorsKana: [
        "けいかんは ゆうびんきょくの まえに います。",
        "けいかんは ゆうびんきょくの なかに います。",
        "ゆうびんきょくは けいかんの うしろに あります。",
      ],
      explanation: "うしろ = behind. People take います, not あります.",
    }),
    listeningBuildSentence({
      id: "ja-m17-8-2-lb-naka",
      target: "でんしゃの なかで ほんを よみます",
      tiles: ["ほん", "でんしゃ", "の", "なか", "で", "を", "よみます", "した"],
      correctOrder: ["でんしゃ", "の", "なか", "で", "ほん", "を", "よみます"],
      promptEn: "Hear it, build it: 'I read a book inside the train.'",
    }),
    translateStep({
      id: "ja-m17-8-2-translate-1",
      promptEn: "The postbox is beside the station.",
      acceptedAnswers: [
        "ポストは えきの よこに あります",
        "ポストは えきの よこに あります。",
        "ポストは えきの よこです",
        "ポストは えきの よこです。",
      ],
      audioText: "ポストは えきの よこに あります",
    }),
    listeningCompSentence({
      id: "ja-m17-8-2-lc-keikan",
      audioText: "えきの まえで けいかんに ききます",
      correctMeaningEn: "I ask the police officer in front of the station.",
      distractorsEn: [
        "I ask the police officer behind the station.",
        "The police officer asks me at the station.",
        "I listen to music in front of the station.",
      ],
    }),
    selfExplain({
      id: "ja-m17-8-2-self-explain",
      anchorLabel: "けいかんに ききます",
      anchorAudioText: "けいかんに ききます",
      question: "Why に after けいかん with ききます?",
      rule: { text: "きく here means 'to ask.' The person you ask is marked with に — けいかんに ききます = 'I ask the police officer.'" },
      surface: { text: "に marks the place, so this means 'I listen at the police officer.'" },
      distractor: { text: "ききます always means 'listen,' so you need を: けいかんを ききます." },
      ruleExplanation:
        "きく covers both 'listen' (おんがくを きく) and 'ask' (けいかんに きく). The particle tells you which: を = listen to, に = ask someone.",
    }),
    speaking(
      "ja-m17-8-2-speak-1",
      "すみません、ポストは どこですか",
      "Excuse me, where is the postbox?",
    ),
    // ── おまわりさん (police officer, friendly) — everyday synonym of けいかん ──
    build(
      "ja-m17-8-2-build-omawarisan",
      "Pick the friendly, everyday word for: police officer",
      "おまわりさん",
      ["せんせい", "おまわりさん", "けいかん", "ともだち"],
      ["おまわりさん"],
    ),
    listeningCompSentence({
      id: "ja-m17-8-2-lc-omawarisan",
      audioText: "おまわりさん、ぎんこうは どこですか",
      correctMeaningEn: "Officer, where is the bank?",
      distractorsEn: [
        "Officer, where is the station?",
        "Teacher, where is the bank?",
        "Officer, what time is it?",
      ],
    }),
    // ── すぐに (right away) — new word ──
    build(
      "ja-m17-8-2-build-suguni",
      "Pick the Japanese for: right away / immediately",
      "すぐに",
      ["あとで", "すぐに", "ゆっくり", "いつも"],
      ["すぐに"],
    ),
    listeningBuildSentence({
      id: "ja-m17-8-2-lb-suguni",
      target: "すぐに みぎへ まがってください",
      tiles: ["まがってください", "すぐに", "ひだりへ", "みぎへ", "あとで"],
      correctOrder: ["すぐに", "みぎへ", "まがってください"],
      promptEn: "Hear it, build it: 'Turn right immediately.'",
    }),
    // ── なくす (to lose) — new word; travel mishap ──
    build(
      "ja-m17-8-2-build-nakusu",
      "Pick the Japanese for: to lose (something)",
      "なくす",
      ["かう", "なくす", "まつ", "とる"],
      ["なくす"],
    ),
    listeningCompSentence({
      id: "ja-m17-8-2-lc-nakusu",
      audioText: "きっぷを なくしました",
      correctMeaningEn: "I lost my ticket.",
      distractorsEn: [
        "I bought a ticket.",
        "I found my ticket.",
        "I forgot my ticket.",
      ],
    }),
    // ── Review tail ──
    vocabMcq("ja-m17-8-2-rev-mcq-1", M17_8_2_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-8-2-rev-lc-1",
      // Sentence-level review of うち (M6) — 2026-07-12 listening backfill.
      audioText: "うちは ぎんこうの よこに あります",
      correctMeaningEn: "My house is beside the bank.",
      distractorsEn: [
        "My house is behind the bank.",
        "My house is beside the park.",
        "The school is beside the bank.",
      ],
    }),
    speaking("ja-m17-8-2-rev-speak-1", M17_8_2_REVIEW[2].kana, M17_8_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-8-2-rev", M17_8_2_REVIEW),
    infoStep(
      "ja-m17-8-2-info-end",
      "You can now ask for directions like a traveler in Japan",
      "すみません、ポストは どこですか — and you'll understand the answer, wherever it points you.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_8_2.steps);
assertAnswerRotation(M17_8_2.steps, 1);
assertNoConsecutiveSame(M17_8_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-5-1 — "By when?" (までに deadline)
// ═══════════════════════════════════════════════════════════════════════

const M17_5_1_REVIEW = pickReviewAtoms("ja-m17-5-1-rev", M17_REVIEW_POOL, 6);

export const M17_5_1: LessonContent = {
  id: "ja-m17-5-1",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "By when?",
  description:
    "までに for deadlines vs まで for duration. Time-bound transport sentences.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m17-5-1-info-open",
      "Deadlines",
      "You know まで (until). Now までに — by a deadline. One particle changes the whole meaning.",
    ),
    RULE_MADE_NI,
    // ── までに drills ──
    build(
      "ja-m17-5-1-build-goji",
      "Say: I'll be back by 5 o'clock.",
      "ごじまでに かえります",
      ["かえります", "いきます", "までに", "まで", "ごじ"],
      ["ごじ", "までに", "かえります"],
    ),
    listeningCompSentence({
      id: "ja-m17-5-1-lc-goji",
      audioText: "よじまでに ぎんこうに いきます",
      correctMeaningEn: "I'll go to the bank by 4 o'clock.",
      distractorsEn: [
        "I'm at the bank until 4 o'clock.",
        "I'll go to the bank at 4 o'clock.",
        "I'll go to the bank after 4 o'clock.",
      ],
    }),
    cloze(
      "ja-m17-5-1-cloze-madeni-1",
      "しちじ",
      " えきに いきます。",
      "までに",
      ["までに", "まで", "に", "から"],
      "I'll go to the station by 7 o'clock.",
      "しちじまでに えきに いきます。",
      "までに = by (deadline). The action must happen before 7.",
    ),
    sentenceMcq({
      id: "ja-m17-5-1-mcq-madeni",
      prompt: "Which sentence means 'Please submit homework by tomorrow.'?",
      correctKana: "あしたまでに しゅくだいを だしてください。",
      distractorsKana: [
        "あしたまで しゅくだいを だしてください。",
        "あしたに しゅくだいを だしてください。",
        "あしたから しゅくだいを だしてください。",
      ],
      explanation: "までに = by (deadline). まで = until (different meaning).",
    }),
    build(
      "ja-m17-5-1-build-ashita",
      "Say: Please submit by tomorrow.",
      "あしたまでに だしてください",
      ["ください", "まで", "だして", "から", "あした", "までに"],
      ["あした", "までに", "だして", "ください"],
    ),
    cloze(
      "ja-m17-5-1-cloze-made",
      "さんじ",
      " べんきょうします。",
      "まで",
      ["まで", "までに", "に", "から"],
      "I study until 3 o'clock.",
      "さんじまで べんきょうします。",
      "まで = until (duration). The action continues until 3.",
    ),
    listeningBuildSentence({
      id: "ja-m17-5-1-lb-madeni",
      target: "くじまでに がっこうに いきます",
      tiles: ["がっこう", "くじ", "までに", "に", "いきます", "まで"],
      correctOrder: ["くじ", "までに", "がっこう", "に", "いきます"],
      promptEn: "Hear it, build it: 'I'll go to school by 9 o'clock.'",
    }),
    speaking(
      "ja-m17-5-1-speak-kuji",
      "ろくじまでに うちに かえります",
      "I'll get home by 6 o'clock.",
    ),
    translateStep({
      id: "ja-m17-5-1-translate-1",
      promptEn: "I'll go home by 3 o'clock.",
      acceptedAnswers: [
        "さんじまでに うちに かえります",
        "さんじまでに うちに かえります。",
        "さんじまでに かえります",
        "さんじまでに かえります。",
      ],
      audioText: "さんじまでに うちに かえります",
    }),
    build(
      "ja-m17-5-1-build-kuji",
      "Say: I'll go to the airport by 9 by taxi.",
      "くじまでに タクシーで くうこうに いきます",
      ["に", "までに", "タクシー", "いきます", "くじ", "くうこう", "で", "まで"],
      ["くじ", "までに", "タクシー", "で", "くうこう", "に", "いきます"],
    ),
    listeningCompSentence({
      id: "ja-m17-5-1-lc-made-vs-madeni",
      audioText: "あさまで ねます",
      correctMeaningEn: "I sleep until morning.",
      distractorsEn: [
        "I sleep by morning.",
        "I sleep in the morning.",
        "I wake up before morning.",
      ],
    }),
    selfExplain({
      id: "ja-m17-5-1-self-explain",
      anchorLabel: "ごじまでに かえります vs さんじまで べんきょうします",
      anchorAudioText: "ごじまでに かえります",
      question: "What's the difference between まで and までに?",
      rule: { text: "まで = until (the action continues up to that time). までに = by (the action must be completed before that time). Duration vs deadline." },
      surface: { text: "They mean the same thing — までに is just a more polite version of まで." },
      distractor: { text: "まで is for past events; までに is for future events." },
      ruleExplanation:
        "まで = duration (the action lasts until X). までに = deadline (the action must happen before X). Key distinction in scheduling.",
    }),
    speaking(
      "ja-m17-5-1-speak-ashita",
      "あしたまでに しゅくだいを だします",
      "I'll submit my homework by tomorrow.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-5-1-rev-mcq-1", M17_5_1_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-5-1-rev-lc-1",
      // Sentence-level review of じてんしゃ (M4) — 2026-07-12 listening backfill.
      audioText: "じてんしゃで えきに いきます",
      correctMeaningEn: "I go to the station by bicycle.",
      distractorsEn: [
        "I go to the station by bus.",
        "I go to school by bicycle.",
        "I walk to the station.",
      ],
    }),
    speaking("ja-m17-5-1-rev-speak-1", M17_5_1_REVIEW[2].kana, M17_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-5-1-rev", M17_5_1_REVIEW),
    infoStep(
      "ja-m17-5-1-info-end",
      "You can now set deadlines and durations in Japanese",
      "までに = by (deadline), まで = until (duration). Time-bound transport sentences mastered.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_5_1.steps);
assertAnswerRotation(M17_5_1.steps, 1);
assertNoConsecutiveSame(M17_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-5-2 — "Before doing" (まえに)
// ═══════════════════════════════════════════════════════════════════════

const M17_5_2_REVIEW = pickReviewAtoms("ja-m17-5-2-rev", M17_REVIEW_POOL, 6);

export const M17_5_2: LessonContent = {
  id: "ja-m17-5-2",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Before doing",
  description:
    "まえに — noun の まえに vs verb まえに. Time-sequence practice with transport context.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m17-5-2-info-open",
      "Before…",
      "You know てから (after doing). Now まえに — before. One comes first, one comes second. Simple.",
    ),
    RULE_MAE_NI,
    // ── まえに drills ──
    build(
      "ja-m17-5-2-build-gohan",
      "Say: I wash my hands before the meal.",
      "ごはんの まえに てを あらいます",
      ["て", "の", "ごはん", "から", "あとで", "を", "まえに", "あらいます"],
      ["ごはん", "の", "まえに", "て", "を", "あらいます"],
    ),
    listeningCompSentence({
      id: "ja-m17-5-2-lc-gohan",
      audioText: "かいものの まえに ぎんこうに いきます",
      correctMeaningEn: "I go to the bank before shopping.",
      distractorsEn: [
        "After shopping, I go to the bank.",
        "Before going to the bank, I go shopping.",
        "I buy things at the bank.",
      ],
    }),
    cloze(
      "ja-m17-5-2-cloze-maeni-1",
      "テレビを みる",
      " しゅくだいを します。",
      "まえに",
      ["まえに", "あとで", "から", "ので"],
      "I do my homework before watching TV.",
      "テレビを みる まえに しゅくだいを します。",
      "Verb (dictionary form) + まえに = before doing.",
    ),
    sentenceMcq({
      id: "ja-m17-5-2-mcq-maeni",
      prompt: "Which sentence means 'I drink tea before studying.'?",
      correctKana: "べんきょうする まえに おちゃを のみます。",
      distractorsKana: [
        "べんきょうしてから おちゃを のみます。",
        "べんきょうする あとで おちゃを のみます。",
        "おちゃを のんでから べんきょうします。",
      ],
      explanation: "べんきょうする まえに = before studying. Dictionary form + まえに.",
    }),
    build(
      "ja-m17-5-2-build-neru",
      "Say: I read before sleeping.",
      "ねる まえに ほんを よみます",
      ["を", "から", "よみます", "ねる", "ほん", "まえに", "あとで"],
      ["ねる", "まえに", "ほん", "を", "よみます"],
    ),
    cloze(
      "ja-m17-5-2-cloze-maeni-2",
      "えいがの",
      " ひるごはんを たべます。",
      "まえに",
      ["まえに", "あとで", "までに", "から"],
      "I eat lunch before the movie.",
      "えいがの まえに ひるごはんを たべます。",
      "Noun + の + まえに = before [noun]. Verbs connect directly.",
    ),
    listeningBuildSentence({
      id: "ja-m17-5-2-lb-1",
      target: "ねる まえに シャワーを あびます",
      tiles: ["シャワー", "ねる", "まえに", "を", "あびます", "あとで"],
      correctOrder: ["ねる", "まえに", "シャワー", "を", "あびます"],
      promptEn: "Hear it, build it: 'I take a shower before sleeping.'",
    }),
    speaking(
      "ja-m17-5-2-speak-gohan",
      "しごとの まえに コーヒーを のみます",
      "I drink coffee before work.",
    ),
    build(
      "ja-m17-5-2-build-dekakeru",
      "Say: I buy a ticket before going out.",
      "でかける まえに きっぷを かいます",
      ["まえに", "の", "きっぷ", "かいます", "でかける", "から", "を"],
      ["でかける", "まえに", "きっぷ", "を", "かいます"],
    ),
    translateStep({
      id: "ja-m17-5-2-translate-1",
      promptEn: "I study before the test.",
      acceptedAnswers: [
        "テストの まえに べんきょうします",
        "テストの まえに べんきょうします。",
        "テストのまえに べんきょうします",
        "テストのまえに べんきょうします。",
      ],
      audioText: "テストの まえに べんきょうします",
    }),
    listeningCompSentence({
      id: "ja-m17-5-2-lc-dekakeru",
      audioText: "がっこうに いく まえに あさごはんを たべます",
      correctMeaningEn: "I eat breakfast before going to school.",
      distractorsEn: [
        "After going to school, I eat breakfast.",
        "I go to school before eating breakfast.",
        "I eat lunch before going to school.",
      ],
    }),
    sentenceMcq({
      id: "ja-m17-5-2-mcq-noun-vs-verb",
      prompt: "What's the difference between 'ごはんの まえに' and 'ねる まえに'?",
      correctKana: "Nouns need の before まえに; verbs connect directly.",
      distractorsKana: [
        "There's no difference — both use の.",
        "Verbs need の; nouns connect directly.",
        "Both need の after them.",
      ],
      explanation: "Noun + の + まえに. Verb (dictionary form) + まえに. Different connection rules.",
    }),
    selfExplain({
      id: "ja-m17-5-2-self-explain",
      anchorLabel: "ごはんの まえに vs ねる まえに",
      anchorAudioText: "ごはんの まえに てを あらいます",
      question: "Why does ごはん need の but ねる doesn't?",
      rule: { text: "Nouns connect to まえに with の (ごはんの まえに). Verbs in dictionary form connect directly (ねる まえに). The verb already functions as a modifier." },
      surface: { text: "Both need の — ねるの まえに is the correct form." },
      distractor: { text: "ごはん is formal, so it needs の. ねる is casual, so it doesn't." },
      ruleExplanation:
        "Noun + の + まえに. Verb (dict. form) + まえに. This is the same pattern as あとで — verbs modify directly, nouns use の.",
    }),
    speaking(
      "ja-m17-5-2-speak-dekakeru",
      "ねる まえに にほんごを べんきょうします",
      "I study Japanese before sleeping.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-5-2-rev-mcq-1", M17_5_2_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-5-2-rev-lc-1",
      // Sentence-level review of せんせい (M3) — 2026-07-12 listening backfill.
      audioText: "テストの まえに せんせいと はなします",
      correctMeaningEn: "Before the test, I talk with the teacher.",
      distractorsEn: [
        "After the test, I talk with the teacher.",
        "Before the test, I talk with a friend.",
        "Before the test, I study.",
      ],
    }),
    speaking("ja-m17-5-2-rev-speak-1", M17_5_2_REVIEW[2].kana, M17_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-5-2-rev", M17_5_2_REVIEW),
    infoStep(
      "ja-m17-5-2-info-end",
      "You can now say what happens before something else",
      "まえに for 'before' — noun の まえに and verb まえに. Combined with てから, you own time-sequence grammar.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_5_2.steps);
assertAnswerRotation(M17_5_2.steps, 1);
assertNoConsecutiveSame(M17_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-6-1 — Interleaved drill (all M17 grammar)
// ═══════════════════════════════════════════════════════════════════════

const M17_6_1_REVIEW = pickReviewAtoms("ja-m17-6-1-rev", M17_REVIEW_POOL, 6);

export const M17_6_1: LessonContent = {
  id: "ja-m17-6-1",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "All together I",
  description:
    "Interleaved drill: で, に, へ, までに, まえに — all M17 grammar mixed.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m17-6-1-info-open",
      "Mixed drill",
      "Every M17 particle in one drill — で, に, へ, までに, まえに. Can you pick the right one every time?",
    ),
    cloze(
      "ja-m17-6-1-cloze-de",
      "タクシー",
      " えきに いきます。",
      "で",
      ["で", "に", "へ", "を"],
      "I go to the station by taxi.",
      "タクシーで えきに いきます。",
      "で marks the means of transport.",
    ),
    cloze(
      "ja-m17-6-1-cloze-ni",
      "くうこう",
      " いきます。",
      "に",
      ["に", "で", "が", "を"],
      "I go to the airport.",
      "くうこうに いきます。",
      "に marks the destination you arrive at.",
    ),
    cloze(
      "ja-m17-6-1-cloze-e",
      "バスていで みぎ",
      " まがってください。",
      "へ",
      ["へ", "を", "が", "は"],
      "Please turn right at the bus stop.",
      "バスていで みぎへ まがってください。",
      "へ marks the direction you turn toward.",
    ),
    build(
      "ja-m17-6-1-build-1",
      "Say: I'll go to the airport by 9 by taxi.",
      "くじまでに タクシーで くうこうに いきます",
      ["くうこう", "タクシー", "くじ", "で", "に", "までに", "へ", "いきます"],
      ["くじ", "までに", "タクシー", "で", "くうこう", "に", "いきます"],
    ),
    listeningCompSentence({
      id: "ja-m17-6-1-lc-1",
      audioText: "でんしゃに のる まえに きっぷを かいます",
      correctMeaningEn: "I buy a ticket before getting on the train.",
      distractorsEn: [
        "After getting on the train, I buy a ticket.",
        "I buy a ticket before getting off the train.",
        "I get on the train before buying a ticket.",
      ],
    }),
    cloze(
      "ja-m17-6-1-cloze-madeni",
      "じゅうじ",
      " ねます。",
      "までに",
      ["までに", "まで", "に", "で"],
      "I go to bed by 10.",
      "じゅうじまでに ねます。",
      "までに = by (deadline) — the going-to-bed happens before 10.",
    ),
    sentenceMcq({
      id: "ja-m17-6-1-mcq-maeni",
      prompt: "Which sentence means 'Before shopping, I go to the bank.'?",
      correctKana: "かいものの まえに ぎんこうに いきます。",
      distractorsKana: [
        "かいものの あとで ぎんこうに いきます。",
        "かいものまでに ぎんこうに いきます。",
        "ぎんこうに いく まえに かいものを します。",
      ],
      explanation: "noun の まえに = before the [noun]. かいものの まえに = before shopping.",
    }),
    build(
      "ja-m17-6-1-build-2",
      "Say: Before sleeping, I read a book.",
      "ねる まえに ほんを よみます",
      ["から", "よみます", "あとで", "を", "まえに", "ねる", "ほん"],
      ["ねる", "まえに", "ほん", "を", "よみます"],
    ),
    cloze(
      "ja-m17-6-1-cloze-maeni",
      "あさごはんの",
      " シャワーを あびます。",
      "まえに",
      ["まえに", "までに", "あとで", "から"],
      "I take a shower before breakfast.",
      "あさごはんの まえに シャワーを あびます。",
      "Noun + の + まえに = before [noun].",
    ),
    listeningBuildSentence({
      id: "ja-m17-6-1-lb-1",
      target: "ふねで しまに いきます",
      tiles: ["へ", "ふね", "しま", "で", "まで", "に", "いきます"],
      correctOrder: ["ふね", "で", "しま", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to the island by boat.'",
    }),
    speaking(
      "ja-m17-6-1-speak-1",
      "はちじまでに バスで がっこうに いきます",
      "I'll go to school by bus by 8.",
    ),
    build(
      "ja-m17-6-1-build-3",
      "Say: Go straight, then turn left.",
      "まっすぐ いってから ひだりへ まがってください",
      ["いって", "から", "へ", "まがって", "ひだり", "ください", "まっすぐ", "みぎ"],
      ["まっすぐ", "いって", "から", "ひだり", "へ", "まがって", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m17-6-1-lc-2",
      audioText: "でんしゃに のります",
      correctMeaningEn: "I get on the train.",
      distractorsEn: [
        "I get off the train.",
        "I go by train.",
        "I stop the train.",
      ],
    }),
    selfExplain({
      id: "ja-m17-6-1-self-explain",
      anchorLabel: "Five particle patterns in one module",
      anchorAudioText: "タクシーで くうこうに いきます",
      question: "Match each particle to its role: で, に, へ, までに, まえに",
      rule: { text: "で = means/tool. に = destination (arrival). へ = direction. までに = by (deadline). まえに = before. Each has a distinct job in transport/time sentences." },
      surface: { text: "に, へ, and で all mean 'to' — they're interchangeable in most sentences." },
      distractor: { text: "までに and まえに mean the same thing — both mean 'before.'" },
      ruleExplanation:
        "Five particles, five roles: で (means), に (destination), へ (direction), までに (deadline), まえに (before). Distinct meanings, often co-occurring.",
    }),
    speaking(
      "ja-m17-6-1-speak-2",
      "ひるごはんの まえに てを あらいます",
      "I wash my hands before lunch.",
    ),
    // ── Review tail ──
    speaking("ja-m17-6-1-rev-speak-1", M17_6_1_REVIEW[0].kana, M17_6_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m17-6-1-rev-lc-1",
      // Sentence-level review of アメリカ (M4) — 2026-07-12 listening backfill.
      audioText: "アメリカから きました",
      correctMeaningEn: "I came from America.",
      distractorsEn: [
        "I came from Japan.",
        "I'm going to America.",
        "I live in America.",
      ],
    }),
    vocabMcq("ja-m17-6-1-rev-mcq-1", M17_6_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M17_REVIEW_POOL),
    reviewMatchPairs("ja-m17-6-1-rev", M17_6_1_REVIEW),
    infoStep(
      "ja-m17-6-1-info-end",
      "You can now mix all M17 particles in complex sentences",
      "で, に, へ, までに, まえに — five particle patterns interleaved. Getting closer to real navigation.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_6_1.steps);
assertAnswerRotation(M17_6_1.steps, 1);
assertNoConsecutiveSame(M17_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-6-2 — Interleaved drill II (production-heavy)
// ═══════════════════════════════════════════════════════════════════════

const M17_6_2_REVIEW = pickReviewAtoms("ja-m17-6-2-rev", M17_REVIEW_POOL, 6);

export const M17_6_2: LessonContent = {
  id: "ja-m17-6-2",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "All together II",
  description:
    "Production-heavy interleave: translate, build, speak with all M17 grammar.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m17-6-2-info-open",
      "Production round",
      "Build, translate, and speak — every M17 pattern in production direction.",
    ),
    build(
      "ja-m17-6-2-build-1",
      "Say: I go to school by bus.",
      "バスで がっこうに いきます",
      ["タクシー", "へ", "がっこう", "いきます", "バス", "に", "で"],
      ["バス", "で", "がっこう", "に", "いきます"],
    ),
    speaking(
      "ja-m17-6-2-speak-1",
      "タクシーで うちに かえります",
      "I go home by taxi.",
    ),
    translateStep({
      id: "ja-m17-6-2-translate-1",
      promptEn: "Turn left at the bus stop.",
      acceptedAnswers: [
        "バスていで ひだりへ まがってください",
        "バスていで ひだりへ まがってください。",
        "バスていで ひだりに まがってください",
        "バスていで ひだりに まがってください。",
      ],
      audioText: "バスていで ひだりへ まがってください",
    }),
    build(
      "ja-m17-6-2-build-2",
      "Say: I'll be back by 5 by taxi.",
      "ごじまでに タクシーで かえります",
      ["かえります", "ごじ", "までに", "タクシー", "まで", "で", "に"],
      ["ごじ", "までに", "タクシー", "で", "かえります"],
    ),
    listeningCompSentence({
      id: "ja-m17-6-2-lc-1",
      audioText: "ひだりへ まがってから まっすぐ いってください",
      correctMeaningEn: "Turn left, then go straight.",
      distractorsEn: [
        "Go straight, then turn left.",
        "Turn right, then go straight.",
        "Turn left and stop.",
      ],
    }),
    speaking(
      "ja-m17-6-2-speak-2",
      "しちじまでに うちに かえります",
      "I'll get home by 7.",
    ),
    build(
      "ja-m17-6-2-build-3",
      "Say: Before breakfast, I wash my face.",
      "あさごはんの まえに かおを あらいます",
      ["かお", "あさごはん", "の", "まえに", "を", "あらいます", "から"],
      ["あさごはん", "の", "まえに", "かお", "を", "あらいます"],
    ),
    translateStep({
      id: "ja-m17-6-2-translate-2",
      promptEn: "I get on the train at the station.",
      acceptedAnswers: [
        "えきで でんしゃに のります",
        "えきで でんしゃに のります。",
        "えきででんしゃに のります",
      ],
      audioText: "えきで でんしゃに のります",
    }),
    sentenceMcq({
      id: "ja-m17-6-2-mcq-1",
      prompt: "Which sentence means 'The bank is next to the station.'?",
      correctKana: "ぎんこうは えきの となりです。",
      distractorsKana: [
        "ぎんこうは えきの ちかくです。",
        "ぎんこうは えきの むこうです。",
        "えきは ぎんこうの となりです。",
      ],
      explanation: "えきの となり = next to the station.",
    }),
    build(
      "ja-m17-6-2-build-4",
      "Say: I get off the bus and cross the street.",
      "バスを おりてから みちを わたります",
      ["わたります", "から", "バス", "を", "に", "おりて", "を", "みち"],
      ["バス", "を", "おりて", "から", "みち", "を", "わたります"],
    ),
    listeningBuildSentence({
      id: "ja-m17-6-2-lb-1",
      target: "でかける まえに きっぷを かいます",
      tiles: ["きっぷ", "を", "あとで", "かいます", "から", "でかける", "まえに"],
      correctOrder: ["でかける", "まえに", "きっぷ", "を", "かいます"],
      promptEn: "Hear it, build it: 'I buy a ticket before going out.'",
    }),
    speaking(
      "ja-m17-6-2-speak-3",
      "まっすぐ いってから みぎへ まがってください",
      "Go straight, then turn right.",
    ),
    sentenceMcq({
      id: "ja-m17-6-2-mcq-umi",
      prompt: "Which sentence means 'I go to the sea by boat.'?",
      correctKana: "ふねで うみに いきます。",
      distractorsKana: [
        "ふねに うみで いきます。",
        "ふねを うみに いきます。",
        "ふねへ うみに いきます。",
      ],
      explanation: "で marks the vehicle (boat); に marks the destination (sea).",
    }),
    selfExplain({
      id: "ja-m17-6-2-self-explain",
      anchorLabel: "M17 particle mastery",
      anchorAudioText: "くじまでに タクシーで くうこうに いきます",
      question: "In one sentence with three particles (までに, で, に) — what does each do?",
      rule: { text: "くじまでに = by 9 (deadline). タクシーで = by taxi (means). くうこうに = to the airport (destination). Three particles, three distinct roles." },
      surface: { text: "All three particles mark the destination in different ways." },
      distractor: { text: "までに is just まで + に combined — it means 'until to.'" },
      ruleExplanation:
        "Each particle in the sentence has a unique role: time deadline (までに), means of transport (で), and destination (に).",
    }),
    speaking(
      "ja-m17-6-2-speak-4",
      "でんしゃを おりてから ぎんこうに いきます",
      "After getting off the train, I go to the bank.",
    ),
    // ── Review tail ──
    speaking("ja-m17-6-2-rev-speak-1", M17_6_2_REVIEW[0].kana, M17_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m17-6-2-rev-lc-1",
      // Sentence-level review of さん (M5) — 2026-07-12 listening backfill.
      audioText: "きっぷを さんまい ください",
      correctMeaningEn: "Three tickets, please.",
      distractorsEn: [
        "Two tickets, please.",
        "Three stamps, please.",
        "Three postcards, please.",
      ],
    }),
    vocabMcq("ja-m17-6-2-rev-mcq-1", M17_6_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M17_REVIEW_POOL),
    speaking("ja-m17-6-2-rev-speak-2", M17_6_2_REVIEW[2].kana, M17_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-6-2-rev", M17_6_2_REVIEW),
    infoStep(
      "ja-m17-6-2-info-end",
      "You can produce every M17 pattern from memory",
      "Transport, directions, locations, deadlines, and time sequence — all in production. Navigation mastered.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_6_2.steps);
assertAnswerRotation(M17_6_2.steps, 1);
assertNoConsecutiveSame(M17_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17_STORY — Getting to the airport dialogue
// ═══════════════════════════════════════════════════════════════════════

export const M17_STORY: LessonContent = {
  id: "ja-m17-story",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Getting to the airport",
  description:
    "Follow ゆき's narrated plan to get to the airport on time. Answer questions and build your replies.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m17-story-info-open",
      "Story time — Airport rush",
      "ゆき tells you her plan for getting to the airport by 9. Listen closely — you'll reply in Japanese.",
    ),
    ...storyComprehension({
      idPrefix: "ja-m17-story-scene-1",
      narrative: [
        { kana: "きょう、ともだちと くうこうに いきます。" },
        { kana: "くじまでに くうこうに いきます。" },
        { kana: "でんしゃは おそいですから、タクシーで いきます。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "By what time does ゆき need to reach the airport?",
          correctText: "By 9 o'clock.",
          distractors: ["By 5 o'clock.", "By 10 o'clock.", "No deadline mentioned."],
          explanation: "くじまでに = by 9 o'clock.",
        },
        {
          id: "s1-q2",
          prompt: "How will she go?",
          correctText: "By taxi, because the train is slow.",
          distractors: ["By train.", "By bus.", "On foot."],
          explanation: "でんしゃは おそいですから、タクシーで いきます = the train is slow, so she goes by taxi.",
        },
      ],
      responseBuild: {
        target: "タクシーで いきましょう",
        tiles: ["いきましょう", "タクシー", "で", "に", "でんしゃ"],
        correctOrder: ["タクシー", "で", "いきましょう"],
        promptEn: "Reply to ゆき: 'Let's go by taxi.'",
      },
    }),
    sentenceMcq({
      id: "ja-m17-story-mcq-1",
      prompt: "Why did ゆき choose a taxi?",
      correctKana: "The train is slow.",
      distractorsKana: [
        "The taxi is cheaper.",
        "There's no train station nearby.",
        "She likes taxis.",
      ],
      explanation: "でんしゃは おそいです = the train is slow.",
    }),
    ...storyComprehension({
      idPrefix: "ja-m17-story-scene-2",
      narrative: [
        { kana: "くうこうの ちかくで タクシーを おります。" },
        { kana: "くうこうの となりに みせが あります。" },
        { kana: "みせで みずを かってから、ともだちを まちます。" },
        { kana: "ごじまでに うちに かえります。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "Where does ゆき get out of the taxi?",
          correctText: "Near the airport.",
          distractors: ["Next to the shop.", "At the station.", "In front of her house."],
          explanation: "くうこうの ちかくで タクシーを おります = she gets out near the airport.",
        },
        {
          id: "s2-q2",
          prompt: "What does she do before waiting for her friend?",
          correctText: "Buys water at the shop.",
          distractors: ["Buys a ticket.", "Eats lunch.", "Calls her friend."],
          explanation: "みずを かってから、ともだちを まちます = after buying water, she waits.",
        },
        {
          id: "s2-q3",
          prompt: "By when will she be home?",
          correctText: "By 5 o'clock.",
          distractors: ["By 9 o'clock.", "By noon.", "She stays overnight."],
          explanation: "ごじまでに うちに かえります = home by 5.",
        },
      ],
      responseBuild: {
        target: "みせで みずを かいましょう",
        tiles: ["みず", "みせ", "で", "を", "かいましょう", "まちましょう"],
        correctOrder: ["みせ", "で", "みず", "を", "かいましょう"],
        promptEn: "Reply to ゆき: 'Let's buy water at the shop.'",
      },
    }),
    cloze(
      "ja-m17-story-cloze-1",
      "ごじ",
      " うちに かえります。",
      "までに",
      ["までに", "まで", "から", "に"],
      "I'll be home by 5.",
      "ごじまでに うちに かえります。",
      "までに = by (deadline) — she must be home before 5.",
    ),
    listeningBuildSentence({
      id: "ja-m17-story-lb-1",
      target: "くうこうの となりに みせが あります",
      tiles: ["みせ", "くうこう", "の", "となり", "に", "が", "あります", "ちかく"],
      correctOrder: ["くうこう", "の", "となり", "に", "みせ", "が", "あります"],
      promptEn: "Hear it, build it: 'There's a shop next to the airport.'",
    }),
    speaking(
      "ja-m17-story-speak-1",
      "くじまでに くうこうに いきます",
      "I'll go to the airport by 9.",
    ),
    sentenceMcq({
      id: "ja-m17-story-mcq-summary",
      prompt: "What's ゆき's full plan?",
      correctKana: "Taxi to the airport by 9, buy water at the shop next door, wait for her friend, home by 5.",
      distractorsKana: [
        "Train to the airport, buy a ticket, then shop until 5.",
        "Walk to the airport before 9 and stay until night.",
        "Bus to the station, then taxi home by 9.",
      ],
      explanation: "Taxi by 9 → water at the みせ next to the airport → wait → home by 5.",
    }),
    speaking(
      "ja-m17-story-speak-2",
      "くうこうの ちかくで タクシーを おります",
      "I get out of the taxi near the airport.",
    ),
    infoStep(
      "ja-m17-story-info-end",
      "You followed a real travel plan — and answered back",
      "Deadlines, transport, locations, and sequence — you tracked a full plan in Japanese and replied like a travel partner.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M17_STORY.steps);
assertPassiveCardsHaveFollowup(M17_STORY.steps);
assertNoExplanationOnPassive(M17_STORY.steps);
assertExplanationDoesntLeakAnswer(M17_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-7-1 — Comprehension closer (dialogue)
// ═══════════════════════════════════════════════════════════════════════

const M17_7_1_REVIEW = pickReviewAtoms("ja-m17-7-1-rev", M17_REVIEW_POOL, 6);

export const M17_7_1: LessonContent = {
  id: "ja-m17-7-1",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Navigation mix",
  description:
    "Mixed drill: all M17 particles with transport, direction, and location vocab.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m17-7-1-info-open",
      "Full navigation",
      "Everything from M17 — transport, directions, locations, deadlines, and time markers. One big drill.",
    ),
    build(
      "ja-m17-7-1-build-1",
      "Say: I get on the boat.",
      "ふねに のります",
      ["のります", "で", "を", "ふね", "おります", "に"],
      ["ふね", "に", "のります"],
    ),
    cloze(
      "ja-m17-7-1-cloze-madeni-2",
      "あした",
      " きっぷを かってください。",
      "までに",
      ["までに", "まで", "から", "に"],
      "Please buy the ticket by tomorrow.",
      "あしたまでに きっぷを かってください。",
      "までに = by (deadline) — the buying must happen before tomorrow.",
    ),
    listeningCompSentence({
      id: "ja-m17-7-1-lc-1",
      audioText: "バスていは えきの むこうです",
      correctMeaningEn: "The bus stop is across from the station.",
      distractorsEn: [
        "The bus stop is next to the station.",
        "The bus stop is near the station.",
        "The station is across from the bus stop.",
      ],
    }),
    sentenceMcq({
      id: "ja-m17-7-1-mcq-1",
      prompt: "Which sentence means 'Please cross the bridge.'?",
      correctKana: "はしを わたってください。",
      distractorsKana: [
        "はしへ まがってください。",
        "はしに とまってください。",
        "はしで いってください。",
      ],
      explanation: "わたる = cross. を marks what you cross.",
    }),
    build(
      "ja-m17-7-1-build-2",
      "Say: The hospital is between the station and the post office.",
      "びょういんは えきと ゆうびんきょくの あいだです",
      ["そば", "ゆうびんきょく", "の", "えき", "びょういん", "あいだ", "と", "です", "は"],
      ["びょういん", "は", "えき", "と", "ゆうびんきょく", "の", "あいだ", "です"],
    ),
    cloze(
      "ja-m17-7-1-cloze-e",
      "ひだり",
      " まがってください。",
      "へ",
      ["へ", "が", "で", "を"],
      "Please turn left.",
      "ひだりへ まがってください。",
      "へ marks the direction.",
    ),
    listeningBuildSentence({
      id: "ja-m17-7-1-lb-1",
      target: "はちじまでに えきに いきます",
      tiles: ["えき", "はちじ", "までに", "に", "いきます", "まで"],
      correctOrder: ["はちじ", "までに", "えき", "に", "いきます"],
      promptEn: "Hear it, build it: 'I'll go to the station by 8.'",
    }),
    speaking(
      "ja-m17-7-1-speak-1",
      "みぎへ まがってから みちを わたってください",
      "Turn right, then cross the street.",
    ),
    cloze(
      "ja-m17-7-1-cloze-maeni",
      "バスに のる",
      " きっぷを かいます。",
      "まえに",
      ["まえに", "までに", "あとで", "から"],
      "I buy a ticket before getting on the bus.",
      "バスに のる まえに きっぷを かいます。",
      "Verb dict. form + まえに = before doing.",
    ),
    build(
      "ja-m17-7-1-build-3",
      "Say: I get off the train at the station.",
      "えきで でんしゃを おります",
      ["でんしゃ", "を", "に", "のります", "えき", "で", "おります"],
      ["えき", "で", "でんしゃ", "を", "おります"],
    ),
    translateStep({
      id: "ja-m17-7-1-translate-1",
      promptEn: "I go to the airport by boat.",
      acceptedAnswers: [
        "ふねで くうこうに いきます",
        "ふねで くうこうに いきます。",
        "ふねで くうこうへ いきます",
        "ふねで くうこうへ いきます。",
      ],
      audioText: "ふねで くうこうに いきます",
    }),
    listeningCompSentence({
      id: "ja-m17-7-1-lc-2",
      audioText: "うちに かえる まえに ぎんこうに いきます",
      correctMeaningEn: "I go to the bank before going home.",
      distractorsEn: [
        "After going home, I go to the bank.",
        "I go home before going to the bank.",
        "I go to the bank by 5.",
      ],
    }),
    selfExplain({
      id: "ja-m17-7-1-self-explain",
      anchorLabel: "M17 particle mastery — five particles, five roles",
      anchorAudioText: "ふねで しまに いきます",
      question: "If someone says えきで きっぷを かいます, what does で mean?",
      rule: { text: "Location of action — 'at the station.' で has multiple uses: location-of-action (えきで) and means-of-transport (でんしゃで). Context tells you which." },
      surface: { text: "で always means 'by means of' — so えきで means 'by means of the station.'" },
      distractor: { text: "で after えき is a different particle from で after でんしゃ — they're homonyms." },
      ruleExplanation:
        "Same particle で, two uses: location-of-action (えきで かう = buy at the station) and means (でんしゃで いく = go by train).",
    }),
    speaking(
      "ja-m17-7-1-speak-2",
      "バスていで バスを おります",
      "I get off the bus at the bus stop.",
    ),
    // ── Review tail ──
    speaking("ja-m17-7-1-rev-speak-1", M17_7_1_REVIEW[0].kana, M17_7_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m17-7-1-rev-lc-1",
      // Sentence-level review of ろく (M5) — 2026-07-12 listening backfill.
      audioText: "ろくじに うちに かえります",
      correctMeaningEn: "I go home at 6.",
      distractorsEn: [
        "I go home at 9.",
        "I leave home at 6.",
        "I went home at 6.",
      ],
    }),
    vocabMcq("ja-m17-7-1-rev-mcq-1", M17_7_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M17_REVIEW_POOL),
    speaking("ja-m17-7-1-rev-speak-2", M17_7_1_REVIEW[2].kana, M17_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-7-1-rev", M17_7_1_REVIEW),
    infoStep(
      "ja-m17-7-1-info-end",
      "You can navigate Japan using five particle patterns",
      "Transport, directions, relative locations, deadlines, and time sequence — the full navigation toolkit.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_7_1.steps);
assertAnswerRotation(M17_7_1.steps, 1);
assertNoConsecutiveSame(M17_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M17-7-2 — Production
// ═══════════════════════════════════════════════════════════════════════

const M17_7_2_REVIEW = pickReviewAtoms("ja-m17-7-2-rev", M17_REVIEW_POOL, 6);

export const M17_7_2: LessonContent = {
  id: "ja-m17-7-2",
  moduleId: "m17",
  courseId: COURSE,
  languageId: LANG,
  title: "Transport production",
  description:
    "Production-heavy: translate, build, and speak all M17 patterns.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m17-7-2-info-open",
      "Full production wrap-up",
      "Build, translate, and speak: every M17 pattern in production direction.",
    ),
    build(
      "ja-m17-7-2-build-1",
      "Say: I'll get home by train by 6.",
      "ろくじまでに でんしゃで うちに かえります",
      ["うち", "ろくじ", "でんしゃ", "までに", "で", "に", "かえります", "まで"],
      ["ろくじ", "までに", "でんしゃ", "で", "うち", "に", "かえります"],
    ),
    speaking(
      "ja-m17-7-2-speak-1",
      "よじまでに ぎんこうに いきます",
      "I'll go to the bank by 4.",
    ),
    translateStep({
      id: "ja-m17-7-2-translate-1",
      promptEn: "Please cross the street.",
      acceptedAnswers: [
        "みちを わたってください",
        "みちを わたってください。",
      ],
      audioText: "みちを わたってください",
    }),
    build(
      "ja-m17-7-2-build-2",
      "Say: Turn left, then go straight.",
      "ひだりへ まがってから まっすぐ いってください",
      ["へ", "いって", "まっすぐ", "まがって", "ください", "ひだり", "から", "みぎ"],
      ["ひだり", "へ", "まがって", "から", "まっすぐ", "いって", "ください"],
    ),
    speaking(
      "ja-m17-7-2-speak-2",
      "まっすぐ いってから はしを わたってください",
      "Go straight, then cross the bridge.",
    ),
    listeningCompSentence({
      id: "ja-m17-7-2-lc-1",
      audioText: "びょういんは えきの そばです",
      correctMeaningEn: "The hospital is near the station.",
      distractorsEn: [
        "The hospital is next to the station.",
        "The hospital is across from the station.",
        "The station is near the hospital.",
      ],
    }),
    build(
      "ja-m17-7-2-build-3",
      "Say: I turn off the light before going out.",
      "でかける まえに でんきを けします",
      ["でんき", "けします", "でかける", "を", "つけます", "まえに", "あとで"],
      ["でかける", "まえに", "でんき", "を", "けします"],
    ),
    sentenceMcq({
      id: "ja-m17-7-2-mcq-1",
      prompt: "Which sentence means 'I get on the boat.'?",
      correctKana: "ふねに のります。",
      distractorsKana: [
        "ふねを おります。",
        "ふねで いきます。",
        "ふねは のります。",
      ],
      explanation: "のる takes に — you board onto the boat.",
    }),
    speaking(
      "ja-m17-7-2-speak-3",
      "たべる まえに てを あらいます",
      "I wash my hands before eating.",
    ),
    build(
      "ja-m17-7-2-build-4",
      "Say: The convenience store is between the station and the bank.",
      "コンビニは えきと ぎんこうの あいだです",
      ["の", "えき", "と", "あいだ", "となり", "ぎんこう", "は", "コンビニ", "です"],
      ["コンビニ", "は", "えき", "と", "ぎんこう", "の", "あいだ", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m17-7-2-lb-1",
      target: "バスを おりてから みちを わたります",
      tiles: ["を", "わたります", "おりて", "から", "みち", "バス", "を", "に"],
      correctOrder: ["バス", "を", "おりて", "から", "みち", "を", "わたります"],
      promptEn: "Hear it, build it: 'After getting off the bus, I cross the street.'",
    }),
    translateStep({
      id: "ja-m17-7-2-translate-2",
      promptEn: "I'll be back by 10 o'clock.",
      acceptedAnswers: [
        "じゅうじまでに かえります",
        "じゅうじまでに かえります。",
      ],
      audioText: "じゅうじまでに かえります",
    }),
    listeningCompSentence({
      id: "ja-m17-7-2-lc-chikaku",
      audioText: "えきの ちかくに レストランが あります",
      correctMeaningEn: "There's a restaurant near the station.",
      distractorsEn: [
        "There's a restaurant next to the station.",
        "There's a station near the restaurant.",
        "There's a restaurant across from the station.",
      ],
    }),
    selfExplain({
      id: "ja-m17-7-2-self-explain",
      anchorLabel: "Full M17 production",
      anchorAudioText: "バスを おりてから みちを わたります",
      question: "In this sentence, why を twice?",
      rule: { text: "First を marks the bus you exit from (おりる takes を). Second を marks the street you cross (わたる takes を). Two different verbs, each with their own を-marked object." },
      surface: { text: "You can only use を once per sentence — the second を is wrong." },
      distractor: { text: "The first を means 'from' and the second を means 'through' — different particles with the same shape." },
      ruleExplanation:
        "Japanese sentences can have multiple を when they contain multiple verbs (via てから chaining). Each verb gets its own object particle.",
    }),
    speaking(
      "ja-m17-7-2-speak-4",
      "バスに のる まえに きっぷを かいます",
      "I buy a ticket before getting on the bus.",
    ),
    // ── Review tail ──
    speaking("ja-m17-7-2-rev-speak-1", M17_7_2_REVIEW[0].kana, M17_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m17-7-2-rev-lc-1",
      // Sentence-level review of こうえん (M6) — 2026-07-12 listening backfill.
      audioText: "バスで こうえんに いきます",
      correctMeaningEn: "I go to the park by bus.",
      distractorsEn: [
        "I go to the park by train.",
        "I go to school by bus.",
        "I walk to the park.",
      ],
    }),
    vocabMcq("ja-m17-7-2-rev-mcq-1", M17_7_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M17_REVIEW_POOL),
    speaking("ja-m17-7-2-rev-speak-2", M17_7_2_REVIEW[2].kana, M17_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-7-2-rev", M17_7_2_REVIEW),
    infoStep(
      "ja-m17-7-2-info-end",
      "You can produce every M17 transport and direction pattern from memory",
      "Transport, directions, locations, deadlines, before/after — all in full production. M17 complete.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M17_7_2.steps);
assertAnswerRotation(M17_7_2.steps, 1);
assertNoConsecutiveSame(M17_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M17_1_1.steps,
  ...M17_1_2.steps,
  ...M17_2_1.steps,
  ...M17_2_2.steps,
  ...M17_3_1.steps,
  ...M17_3_2.steps,
  ...M17_4_1.steps,
  ...M17_4_2.steps,
  ...M17_5_1.steps,
  ...M17_5_2.steps,
  ...M17_6_1.steps,
  ...M17_6_2.steps,
  ...M17_7_1.steps,
  ...M17_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M17_1_1, M17_1_2, M17_2_1, M17_2_2, M17_3_1, M17_3_2,
  M17_4_1, M17_4_2, M17_5_1, M17_5_2, M17_6_1, M17_6_2,
  M17_STORY, M17_7_1, M17_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
