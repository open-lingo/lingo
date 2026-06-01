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
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * Vocab (~30): ふね, タクシー, バスてい, くうこう, きっぷ, のりもの,
 *   まっすぐ, みぎ, ひだり, むこう, そば, ちかく, となり, あいだ,
 *   のる, おりる, わたる, まがる, とまる
 *
 * ID scheme: ja-m17-{n}-{sub} e.g. ja-m17-1-1, ja-m17-1-2
 * Export names: M17_1_1, M17_1_2, M17_2_1, M17_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m17-1, etc.
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

const M17_1_1_REVIEW = pickReviewAtoms("ja-m17-1-1-rev", M17_REVIEW_POOL, 4);

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
      ["ふね", "タクシー", "バス", "くるま"],
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
      ["タクシー", "バス", "ふね", "でんしゃ"],
      ["タクシー"],
    ),
    listeningCompSentence({
      id: "ja-m17-1-1-lc-takushii",
      audioText: "タクシー",
      correctMeaningEn: "taxi",
      distractorsEn: ["bus", "boat", "train"],
    }),
    // ── バスてい (bus stop) ──
    build(
      "ja-m17-1-1-build-basutei",
      "Pick the Japanese word for: Bus stop",
      "バスてい",
      ["バスてい", "えき", "くうこう", "タクシー"],
      ["バスてい"],
    ),
    speaking("ja-m17-1-1-speak-basutei", "バスてい", "Bus stop"),
    // ── くうこう (airport) ──
    build(
      "ja-m17-1-1-build-kuukou",
      "Pick the Japanese word for: Airport",
      "くうこう",
      ["くうこう", "えき", "バスてい", "びょういん"],
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
      ["きっぷ", "きって", "かばん", "おかね"],
      ["きっぷ"],
    ),
    listeningCompSentence({
      id: "ja-m17-1-1-lc-kippu",
      audioText: "きっぷ",
      correctMeaningEn: "ticket",
      distractorsEn: ["stamp", "money", "bag"],
    }),
    // ── のりもの (vehicle/ride) ──
    build(
      "ja-m17-1-1-build-norimono",
      "Pick the Japanese word for: Vehicle / Ride",
      "のりもの",
      ["のりもの", "たてもの", "のみもの", "たべもの"],
      ["のりもの"],
    ),
    speaking("ja-m17-1-1-speak-norimono", "のりもの", "Vehicle"),
    // ── で transport drills ──
    cloze(
      "ja-m17-1-1-cloze-de",
      "タクシー",
      " くうこうに いきます。",
      "で",
      ["で", "に", "を", "は"],
      "I go to the airport by taxi.",
      "タクシーで くうこうに いきます。",
      "で marks the means of transport — the taxi is the 'tool' for going.",
    ),
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
      audioText: M17_1_1_REVIEW[1].kana,
      correctMeaningEn: M17_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_1_1_REVIEW[2].meaningEn,
        M17_1_1_REVIEW[3].meaningEn,
        M17_REVIEW_POOL[0].meaningEn,
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

const M17_1_2_REVIEW = pickReviewAtoms("ja-m17-1-2-rev", M17_REVIEW_POOL, 4);

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
      ["ふね", "で", "しま", "に", "いきます", "タクシー", "を"],
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
    cloze(
      "ja-m17-1-2-cloze-de-1",
      "バス",
      " がっこうに いきます。",
      "で",
      ["で", "に", "を", "は"],
      "I go to school by bus.",
      "バスで がっこうに いきます。",
      "で marks the vehicle (bus) as the means of transport.",
    ),
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
      ["えき", "で", "きっぷ", "を", "かいます", "に", "バスてい"],
      ["えき", "で", "きっぷ", "を", "かいます"],
    ),
    cloze(
      "ja-m17-1-2-cloze-ni-1",
      "タクシーで くうこう",
      " いきます。",
      "に",
      ["に", "で", "を", "が"],
      "I go to the airport by taxi.",
      "タクシーで くうこうに いきます。",
      "に marks the destination — the airport is where you arrive.",
    ),
    listeningBuildSentence({
      id: "ja-m17-1-2-lb-fune",
      target: "ふねで いきます",
      tiles: ["ふね", "で", "いきます", "に", "タクシー", "かえります"],
      correctOrder: ["ふね", "で", "いきます"],
      promptEn: "Hear it, build it: 'I go by boat.'",
    }),
    speaking(
      "ja-m17-1-2-speak-takushii",
      "タクシーで くうこうに いきます",
      "I go to the airport by taxi.",
    ),
    build(
      "ja-m17-1-2-build-basutei",
      "Say: I wait at the bus stop.",
      "バスていで まちます",
      ["バスてい", "で", "まちます", "に", "えき", "いきます"],
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
      "えきで きっぷを かいます",
      "I buy a ticket at the station.",
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

const M17_2_1_REVIEW = pickReviewAtoms("ja-m17-2-1-rev", M17_REVIEW_POOL, 4);

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
      ["のる", "おりる", "いく", "くる"],
      ["のる"],
    ),
    listeningCompSentence({
      id: "ja-m17-2-1-lc-noru",
      audioText: "のる",
      correctMeaningEn: "get on / ride",
      distractorsEn: ["get off", "go", "come"],
    }),
    // ── おりる (get off) ──
    build(
      "ja-m17-2-1-build-oriru",
      "Pick the Japanese word for: Get off",
      "おりる",
      ["おりる", "のる", "とまる", "わたる"],
      ["おりる"],
    ),
    speaking("ja-m17-2-1-speak-oriru", "おりる", "Get off"),
    // ── に destination drills ──
    build(
      "ja-m17-2-1-build-eki-ni",
      "Say: I go to the station.",
      "えきに いきます",
      ["えき", "に", "いきます", "で", "へ", "かえります"],
      ["えき", "に", "いきます"],
    ),
    cloze(
      "ja-m17-2-1-cloze-ni",
      "くうこう",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to the airport.",
      "くうこうに いきます。",
      "に marks the destination — the airport is where you arrive.",
    ),
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
      ["でんしゃ", "に", "のります", "おります", "で", "を"],
      ["でんしゃ", "に", "のります"],
    ),
    listeningBuildSentence({
      id: "ja-m17-2-1-lb-oriru",
      target: "バスを おります",
      tiles: ["バス", "を", "おります", "に", "のります", "で"],
      correctOrder: ["バス", "を", "おります"],
      promptEn: "Hear it, build it: 'I get off the bus.'",
    }),
    listeningCompSentence({
      id: "ja-m17-2-1-lc-noru-densha",
      audioText: "でんしゃに のります",
      correctMeaningEn: "I get on the train.",
      distractorsEn: [
        "I get off the train.",
        "I go by train.",
        "I wait for the train.",
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
      audioText: M17_2_1_REVIEW[1].kana,
      correctMeaningEn: M17_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_2_1_REVIEW[2].meaningEn,
        M17_2_1_REVIEW[3].meaningEn,
        M17_REVIEW_POOL[2].meaningEn,
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

const M17_2_2_REVIEW = pickReviewAtoms("ja-m17-2-2-rev", M17_REVIEW_POOL, 4);

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
      ["バスてい", "で", "バス", "に", "のります", "おります", "を"],
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
    cloze(
      "ja-m17-2-2-cloze-ni-1",
      "でんしゃ",
      " のります。",
      "に",
      ["に", "で", "を", "は"],
      "I get on the train.",
      "でんしゃに のります。",
      "に marks what you board — のる takes に.",
    ),
    sentenceMcq({
      id: "ja-m17-2-2-mcq-oriru",
      prompt: "Which sentence means 'I get off the bus.'?",
      correctKana: "バスを おります。",
      distractorsKana: [
        "バスに のります。",
        "バスで いきます。",
        "バスに おります。",
      ],
      explanation: "おりる takes を — you exit FROM the bus.",
    }),
    build(
      "ja-m17-2-2-build-2",
      "Say: I head toward the airport by taxi.",
      "タクシーで くうこうへ いきます",
      ["タクシー", "で", "くうこう", "へ", "いきます", "に", "を"],
      ["タクシー", "で", "くうこう", "へ", "いきます"],
    ),
    cloze(
      "ja-m17-2-2-cloze-wo",
      "バス",
      " おります。",
      "を",
      ["を", "に", "で", "へ"],
      "I get off the bus.",
      "バスを おります。",
      "おりる takes を — you exit FROM the bus.",
    ),
    listeningBuildSentence({
      id: "ja-m17-2-2-lb-1",
      target: "えきで でんしゃに のります",
      tiles: ["えき", "で", "でんしゃ", "に", "のります", "おります", "を"],
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
      ["きっぷ", "を", "かって", "から", "でんしゃ", "に", "のります", "おります"],
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
      ["へ", "に", "で", "を"],
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

const M17_3_1_REVIEW = pickReviewAtoms("ja-m17-3-1-rev", M17_REVIEW_POOL, 4);

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
      ["まっすぐ", "みぎ", "ひだり", "うしろ"],
      ["まっすぐ"],
    ),
    listeningCompSentence({
      id: "ja-m17-3-1-lc-massugu",
      audioText: "まっすぐ",
      correctMeaningEn: "straight ahead",
      distractorsEn: ["right", "left", "behind"],
    }),
    // ── みぎ (right) ──
    build(
      "ja-m17-3-1-build-migi",
      "Pick the Japanese word for: Right",
      "みぎ",
      ["みぎ", "ひだり", "まっすぐ", "まえ"],
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
      ["ひだり", "みぎ", "まっすぐ", "した"],
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
      ["わたる", "まがる", "とまる", "あるく"],
      ["わたる"],
    ),
    speaking("ja-m17-3-1-speak-wataru", "わたる", "Cross"),
    // ── まがる (turn) ──
    build(
      "ja-m17-3-1-build-magaru",
      "Pick the Japanese word for: Turn",
      "まがる",
      ["まがる", "わたる", "とまる", "はしる"],
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
      ["とまる", "まがる", "わたる", "のる"],
      ["とまる"],
    ),
    speaking("ja-m17-3-1-speak-tomaru", "とまる", "Stop"),
    // ── Direction sentence drills ──
    build(
      "ja-m17-3-1-build-migi-magaru",
      "Say: Please turn right.",
      "みぎへ まがってください",
      ["みぎ", "へ", "まがって", "ください", "ひだり", "わたって"],
      ["みぎ", "へ", "まがって", "ください"],
    ),
    cloze(
      "ja-m17-3-1-cloze-e",
      "ひだり",
      " まがってください。",
      "へ",
      ["へ", "に", "で", "を"],
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
      audioText: M17_3_1_REVIEW[1].kana,
      correctMeaningEn: M17_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_3_1_REVIEW[2].meaningEn,
        M17_3_1_REVIEW[3].meaningEn,
        M17_REVIEW_POOL[4].meaningEn,
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

const M17_3_2_REVIEW = pickReviewAtoms("ja-m17-3-2-rev", M17_REVIEW_POOL, 4);

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
      ["みち", "を", "わたって", "ください", "まがって", "へ"],
      ["みち", "を", "わたって", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m17-3-2-lc-1",
      audioText: "ひだりへ まがってください",
      correctMeaningEn: "Please turn left.",
      distractorsEn: [
        "Please turn right.",
        "Please go straight.",
        "Please stop here.",
      ],
    }),
    cloze(
      "ja-m17-3-2-cloze-e-1",
      "みぎ",
      " まがってください。",
      "へ",
      ["へ", "に", "で", "を"],
      "Please turn right.",
      "みぎへ まがってください。",
      "へ marks the direction you turn toward.",
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
      ["まっすぐ", "いって", "から", "ひだり", "へ", "まがって", "ください", "みぎ"],
      ["まっすぐ", "いって", "から", "ひだり", "へ", "まがって", "ください"],
    ),
    cloze(
      "ja-m17-3-2-cloze-wo",
      "みち",
      " わたってください。",
      "を",
      ["を", "へ", "に", "で"],
      "Please cross the street.",
      "みちを わたってください。",
      "を marks what you cross — the street.",
    ),
    listeningBuildSentence({
      id: "ja-m17-3-2-lb-1",
      target: "みぎへ まがってください",
      tiles: ["みぎ", "へ", "まがって", "ください", "ひだり", "わたって"],
      correctOrder: ["みぎ", "へ", "まがって", "ください"],
      promptEn: "Hear it, build it: 'Please turn right.'",
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
      ["バス", "は", "ここ", "で", "とまります", "に", "いきます"],
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
    cloze(
      "ja-m17-3-2-cloze-de",
      "ここ",
      " とまります。",
      "で",
      ["で", "に", "を", "へ"],
      "It stops here.",
      "ここで とまります。",
      "で marks the location where the action happens — stopping here.",
    ),
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
      "みちを わたってください",
      "Please cross the street.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-3-2-rev-mcq-1", M17_3_2_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-3-2-rev-lc-1",
      audioText: M17_3_2_REVIEW[1].kana,
      correctMeaningEn: M17_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_3_2_REVIEW[2].meaningEn,
        M17_3_2_REVIEW[3].meaningEn,
        M17_REVIEW_POOL[5].meaningEn,
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

const M17_4_1_REVIEW = pickReviewAtoms("ja-m17-4-1-rev", M17_REVIEW_POOL, 4);

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
      ["むこう", "そば", "ちかく", "となり"],
      ["むこう"],
    ),
    listeningCompSentence({
      id: "ja-m17-4-1-lc-mukou",
      audioText: "むこう",
      correctMeaningEn: "the other side / across",
      distractorsEn: ["nearby", "next to", "between"],
    }),
    // ── そば (beside / near) ──
    build(
      "ja-m17-4-1-build-soba",
      "Pick the Japanese word for: Beside / Near",
      "そば",
      ["そば", "むこう", "ちかく", "あいだ"],
      ["そば"],
    ),
    speaking("ja-m17-4-1-speak-soba", "そば", "Beside / Near"),
    // ── ちかく (close / nearby area) ──
    build(
      "ja-m17-4-1-build-chikaku",
      "Pick the Japanese word for: Close / Nearby",
      "ちかく",
      ["ちかく", "そば", "となり", "むこう"],
      ["ちかく"],
    ),
    listeningCompSentence({
      id: "ja-m17-4-1-lc-chikaku",
      audioText: "ちかく",
      correctMeaningEn: "close / nearby",
      distractorsEn: ["the other side", "beside", "between"],
    }),
    // ── となり (next to) ──
    build(
      "ja-m17-4-1-build-tonari",
      "Pick the Japanese word for: Next to",
      "となり",
      ["となり", "ちかく", "そば", "あいだ"],
      ["となり"],
    ),
    speaking("ja-m17-4-1-speak-tonari", "となり", "Next to"),
    // ── あいだ (between) ──
    build(
      "ja-m17-4-1-build-aida",
      "Pick the Japanese word for: Between",
      "あいだ",
      ["あいだ", "となり", "むこう", "そば"],
      ["あいだ"],
    ),
    listeningCompSentence({
      id: "ja-m17-4-1-lc-aida",
      audioText: "あいだ",
      correctMeaningEn: "between",
      distractorsEn: ["next to", "close", "the other side"],
    }),
    // ── Location sentence drills ──
    build(
      "ja-m17-4-1-build-tonari-eki",
      "Say: The post office is next to the station.",
      "ゆうびんきょくは えきの となりです",
      ["ゆうびんきょく", "は", "えき", "の", "となり", "です", "そば", "ちかく"],
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
      tiles: ["みせ", "は", "みち", "の", "むこう", "です", "となり", "ちかく"],
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
      audioText: M17_4_1_REVIEW[1].kana,
      correctMeaningEn: M17_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_4_1_REVIEW[2].meaningEn,
        M17_4_1_REVIEW[3].meaningEn,
        M17_REVIEW_POOL[6].meaningEn,
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

const M17_4_2_REVIEW = pickReviewAtoms("ja-m17-4-2-rev", M17_REVIEW_POOL, 4);

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
      ["びょういん", "は", "えき", "の", "そば", "です", "となり", "ちかく"],
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
    cloze(
      "ja-m17-4-2-cloze-no-1",
      "がっこう",
      " そばに こうえんが あります。",
      "の",
      ["の", "に", "で", "は"],
      "There's a park near the school.",
      "がっこうの そばに こうえんが あります。",
      "の connects the reference noun to the location word.",
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
      ["こうえん", "は", "がっこう", "と", "びょういん", "の", "あいだ", "です", "そば"],
      ["こうえん", "は", "がっこう", "と", "びょういん", "の", "あいだ", "です"],
    ),
    cloze(
      "ja-m17-4-2-cloze-no-2",
      "えきと ゆうびんきょく",
      " あいだに ぎんこうが あります。",
      "の",
      ["の", "に", "で", "が"],
      "There's a bank between the station and the post office.",
      "えきと ゆうびんきょくの あいだに ぎんこうが あります。",
      "の connects the 'A と B' pair to あいだ.",
    ),
    listeningBuildSentence({
      id: "ja-m17-4-2-lb-1",
      target: "びょういんは えきの ちかくです",
      tiles: ["びょういん", "は", "えき", "の", "ちかく", "です", "となり", "むこう"],
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
      ["びょういん", "の", "ちかく", "に", "コンビニ", "が", "あります", "は"],
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
    cloze(
      "ja-m17-4-2-cloze-ni",
      "えきの そば",
      " レストランが あります。",
      "に",
      ["に", "の", "で", "は"],
      "There's a restaurant near the station.",
      "えきの そばに レストランが あります。",
      "に marks the location where something exists.",
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
      audioText: M17_4_2_REVIEW[1].kana,
      correctMeaningEn: M17_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_4_2_REVIEW[2].meaningEn,
        M17_4_2_REVIEW[3].meaningEn,
        M17_REVIEW_POOL[7].meaningEn,
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
// M17-5-1 — "By when?" (までに deadline)
// ═══════════════════════════════════════════════════════════════════════

const M17_5_1_REVIEW = pickReviewAtoms("ja-m17-5-1-rev", M17_REVIEW_POOL, 4);

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
      ["ごじ", "までに", "かえります", "まで", "いきます"],
      ["ごじ", "までに", "かえります"],
    ),
    listeningCompSentence({
      id: "ja-m17-5-1-lc-goji",
      audioText: "ごじまでに かえります",
      correctMeaningEn: "I'll be back by 5 o'clock.",
      distractorsEn: [
        "I go home until 5 o'clock.",
        "I go home at 5 o'clock.",
        "I'm back after 5 o'clock.",
      ],
    }),
    cloze(
      "ja-m17-5-1-cloze-madeni-1",
      "くじ",
      " くうこうに いきます。",
      "までに",
      ["までに", "まで", "に", "から"],
      "I'll go to the airport by 9 o'clock.",
      "くじまでに くうこうに いきます。",
      "までに = by (deadline). The action must happen before 9.",
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
      ["あした", "までに", "だして", "ください", "まで", "から"],
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
      target: "ごじまでに かえります",
      tiles: ["ごじ", "までに", "かえります", "まで", "いきます", "に"],
      correctOrder: ["ごじ", "までに", "かえります"],
      promptEn: "Hear it, build it: 'I'll be back by 5 o'clock.'",
    }),
    speaking(
      "ja-m17-5-1-speak-kuji",
      "くじまでに くうこうに いきます",
      "I'll go to the airport by 9 o'clock.",
    ),
    translateStep({
      id: "ja-m17-5-1-translate-1",
      promptEn: "I'll be back by 5 o'clock.",
      acceptedAnswers: [
        "ごじまでに かえります",
        "ごじまでに かえります。",
        "ごじまでにかえります",
        "ごじまでにかえります。",
      ],
      audioText: "ごじまでに かえります",
    }),
    build(
      "ja-m17-5-1-build-kuji",
      "Say: I'll go to the airport by 9 by taxi.",
      "くじまでに タクシーで くうこうに いきます",
      ["くじ", "までに", "タクシー", "で", "くうこう", "に", "いきます", "まで"],
      ["くじ", "までに", "タクシー", "で", "くうこう", "に", "いきます"],
    ),
    listeningCompSentence({
      id: "ja-m17-5-1-lc-made-vs-madeni",
      audioText: "さんじまで べんきょうします",
      correctMeaningEn: "I study until 3 o'clock.",
      distractorsEn: [
        "I study by 3 o'clock.",
        "I study at 3 o'clock.",
        "I study after 3 o'clock.",
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
      "あしたまでに だしてください",
      "Please submit by tomorrow.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-5-1-rev-mcq-1", M17_5_1_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-5-1-rev-lc-1",
      audioText: M17_5_1_REVIEW[1].kana,
      correctMeaningEn: M17_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_5_1_REVIEW[2].meaningEn,
        M17_5_1_REVIEW[3].meaningEn,
        M17_REVIEW_POOL[8].meaningEn,
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

const M17_5_2_REVIEW = pickReviewAtoms("ja-m17-5-2-rev", M17_REVIEW_POOL, 4);

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
      ["ごはん", "の", "まえに", "て", "を", "あらいます", "あとで", "から"],
      ["ごはん", "の", "まえに", "て", "を", "あらいます"],
    ),
    listeningCompSentence({
      id: "ja-m17-5-2-lc-gohan",
      audioText: "ごはんの まえに てを あらいます",
      correctMeaningEn: "I wash my hands before the meal.",
      distractorsEn: [
        "I wash my hands after the meal.",
        "I eat before washing my hands.",
        "I wash my hands during the meal.",
      ],
    }),
    cloze(
      "ja-m17-5-2-cloze-maeni-1",
      "ねる",
      " ほんを よみます。",
      "まえに",
      ["まえに", "あとで", "から", "ので"],
      "I read a book before sleeping.",
      "ねる まえに ほんを よみます。",
      "Verb (dictionary form) + まえに = before doing.",
    ),
    sentenceMcq({
      id: "ja-m17-5-2-mcq-maeni",
      prompt: "Which sentence means 'I buy a ticket before leaving.'?",
      correctKana: "でかける まえに きっぷを かいます。",
      distractorsKana: [
        "でかけてから きっぷを かいます。",
        "でかける あとで きっぷを かいます。",
        "きっぷを かってから でかけます。",
      ],
      explanation: "でかける まえに = before leaving. Dictionary form + まえに.",
    }),
    build(
      "ja-m17-5-2-build-neru",
      "Say: I read before sleeping.",
      "ねる まえに ほんを よみます",
      ["ねる", "まえに", "ほん", "を", "よみます", "あとで", "から"],
      ["ねる", "まえに", "ほん", "を", "よみます"],
    ),
    cloze(
      "ja-m17-5-2-cloze-no",
      "ごはん",
      " まえに てを あらいます。",
      "の",
      ["の", "に", "で", "を"],
      "I wash my hands before the meal.",
      "ごはんの まえに てを あらいます。",
      "Nouns need の before まえに. Verbs connect directly.",
    ),
    listeningBuildSentence({
      id: "ja-m17-5-2-lb-1",
      target: "ねる まえに ほんを よみます",
      tiles: ["ねる", "まえに", "ほん", "を", "よみます", "あとで", "てを"],
      correctOrder: ["ねる", "まえに", "ほん", "を", "よみます"],
      promptEn: "Hear it, build it: 'I read a book before sleeping.'",
    }),
    speaking(
      "ja-m17-5-2-speak-gohan",
      "ごはんの まえに てを あらいます",
      "I wash my hands before the meal.",
    ),
    build(
      "ja-m17-5-2-build-dekakeru",
      "Say: I buy a ticket before going out.",
      "でかける まえに きっぷを かいます",
      ["でかける", "まえに", "きっぷ", "を", "かいます", "の", "から"],
      ["でかける", "まえに", "きっぷ", "を", "かいます"],
    ),
    translateStep({
      id: "ja-m17-5-2-translate-1",
      promptEn: "I read a book before sleeping.",
      acceptedAnswers: [
        "ねる まえに ほんを よみます",
        "ねる まえに ほんを よみます。",
        "ねるまえに ほんを よみます",
        "ねるまえに ほんを よみます。",
      ],
      audioText: "ねる まえに ほんを よみます",
    }),
    listeningCompSentence({
      id: "ja-m17-5-2-lc-dekakeru",
      audioText: "でかける まえに きっぷを かいます",
      correctMeaningEn: "I buy a ticket before going out.",
      distractorsEn: [
        "After going out, I buy a ticket.",
        "I buy a ticket and go out.",
        "I go out to buy a ticket.",
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
      "でかける まえに きっぷを かいます",
      "I buy a ticket before going out.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m17-5-2-rev-mcq-1", M17_5_2_REVIEW[0], M17_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m17-5-2-rev-lc-1",
      audioText: M17_5_2_REVIEW[1].kana,
      correctMeaningEn: M17_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_5_2_REVIEW[2].meaningEn,
        M17_5_2_REVIEW[3].meaningEn,
        M17_REVIEW_POOL[9].meaningEn,
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

const M17_6_1_REVIEW = pickReviewAtoms("ja-m17-6-1-rev", M17_REVIEW_POOL, 5);

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
      ["に", "で", "へ", "を"],
      "I go to the airport.",
      "くうこうに いきます。",
      "に marks the destination you arrive at.",
    ),
    cloze(
      "ja-m17-6-1-cloze-e",
      "みぎ",
      " まがってください。",
      "へ",
      ["へ", "に", "で", "を"],
      "Please turn right.",
      "みぎへ まがってください。",
      "へ marks the direction you turn toward.",
    ),
    build(
      "ja-m17-6-1-build-1",
      "Say: I'll go to the airport by 9 by taxi.",
      "くじまでに タクシーで くうこうに いきます",
      ["くじ", "までに", "タクシー", "で", "くうこう", "に", "いきます", "へ"],
      ["くじ", "までに", "タクシー", "で", "くうこう", "に", "いきます"],
    ),
    listeningCompSentence({
      id: "ja-m17-6-1-lc-1",
      audioText: "でかける まえに きっぷを かいます",
      correctMeaningEn: "I buy a ticket before going out.",
      distractorsEn: [
        "After going out, I buy a ticket.",
        "I buy a ticket by going out.",
        "I go out to buy a ticket.",
      ],
    }),
    cloze(
      "ja-m17-6-1-cloze-madeni",
      "ごじ",
      " かえります。",
      "までに",
      ["までに", "まで", "に", "で"],
      "I'll be back by 5.",
      "ごじまでに かえります。",
      "までに = by (deadline).",
    ),
    sentenceMcq({
      id: "ja-m17-6-1-mcq-maeni",
      prompt: "Which sentence means 'Before the meal, I wash my hands.'?",
      correctKana: "ごはんの まえに てを あらいます。",
      distractorsKana: [
        "ごはんの あとで てを あらいます。",
        "ごはんまでに てを あらいます。",
        "ごはんから てを あらいます。",
      ],
      explanation: "noun の まえに = before the [noun].",
    }),
    build(
      "ja-m17-6-1-build-2",
      "Say: Before sleeping, I read a book.",
      "ねる まえに ほんを よみます",
      ["ねる", "まえに", "ほん", "を", "よみます", "から", "あとで"],
      ["ねる", "まえに", "ほん", "を", "よみます"],
    ),
    cloze(
      "ja-m17-6-1-cloze-maeni",
      "ねる",
      " ほんを よみます。",
      "まえに",
      ["まえに", "までに", "あとで", "から"],
      "I read a book before sleeping.",
      "ねる まえに ほんを よみます。",
      "Verb dictionary form + まえに = before doing.",
    ),
    listeningBuildSentence({
      id: "ja-m17-6-1-lb-1",
      target: "ふねで しまに いきます",
      tiles: ["ふね", "で", "しま", "に", "いきます", "へ", "まで"],
      correctOrder: ["ふね", "で", "しま", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to the island by boat.'",
    }),
    speaking(
      "ja-m17-6-1-speak-1",
      "くじまでに タクシーで くうこうに いきます",
      "I'll go to the airport by 9 by taxi.",
    ),
    build(
      "ja-m17-6-1-build-3",
      "Say: Go straight, then turn left.",
      "まっすぐ いってから ひだりへ まがってください",
      ["まっすぐ", "いって", "から", "ひだり", "へ", "まがって", "ください", "みぎ"],
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
      "ごはんの まえに てを あらいます",
      "I wash my hands before the meal.",
    ),
    // ── Review tail ──
    speaking("ja-m17-6-1-rev-speak-1", M17_6_1_REVIEW[0].kana, M17_6_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m17-6-1-rev-lc-1",
      audioText: M17_6_1_REVIEW[1].kana,
      correctMeaningEn: M17_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_6_1_REVIEW[2].meaningEn,
        M17_6_1_REVIEW[3].meaningEn,
        M17_6_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m17-6-1-rev-mcq-1", M17_6_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M17_REVIEW_POOL),
    reviewMatchPairs("ja-m17-6-1-rev", M17_6_1_REVIEW.slice(0, 5)),
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

const M17_6_2_REVIEW = pickReviewAtoms("ja-m17-6-2-rev", M17_REVIEW_POOL, 5);

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
      ["バス", "で", "がっこう", "に", "いきます", "へ", "タクシー"],
      ["バス", "で", "がっこう", "に", "いきます"],
    ),
    speaking(
      "ja-m17-6-2-speak-1",
      "バスで がっこうに いきます",
      "I go to school by bus.",
    ),
    translateStep({
      id: "ja-m17-6-2-translate-1",
      promptEn: "Please turn right.",
      acceptedAnswers: [
        "みぎへ まがってください",
        "みぎへ まがってください。",
        "みぎに まがってください",
        "みぎに まがってください。",
      ],
      audioText: "みぎへ まがってください",
    }),
    build(
      "ja-m17-6-2-build-2",
      "Say: I'll be back by 5 by taxi.",
      "ごじまでに タクシーで かえります",
      ["ごじ", "までに", "タクシー", "で", "かえります", "まで", "に"],
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
      "ごじまでに かえります",
      "I'll be back by 5.",
    ),
    build(
      "ja-m17-6-2-build-3",
      "Say: Before the meal, I wash my hands.",
      "ごはんの まえに てを あらいます",
      ["ごはん", "の", "まえに", "て", "を", "あらいます", "から"],
      ["ごはん", "の", "まえに", "て", "を", "あらいます"],
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
      ["バス", "を", "おりて", "から", "みち", "を", "わたります", "に"],
      ["バス", "を", "おりて", "から", "みち", "を", "わたります"],
    ),
    listeningBuildSentence({
      id: "ja-m17-6-2-lb-1",
      target: "でかける まえに きっぷを かいます",
      tiles: ["でかける", "まえに", "きっぷ", "を", "かいます", "から", "あとで"],
      correctOrder: ["でかける", "まえに", "きっぷ", "を", "かいます"],
      promptEn: "Hear it, build it: 'I buy a ticket before going out.'",
    }),
    speaking(
      "ja-m17-6-2-speak-3",
      "まっすぐ いってから みぎへ まがってください",
      "Go straight, then turn right.",
    ),
    cloze(
      "ja-m17-6-2-cloze-de",
      "ふね",
      " しまに いきます。",
      "で",
      ["で", "に", "へ", "を"],
      "I go to the island by boat.",
      "ふねで しまに いきます。",
      "で marks the means of transport.",
    ),
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
      "バスを おりてから みちを わたります",
      "After getting off the bus, I cross the street.",
    ),
    // ── Review tail ──
    speaking("ja-m17-6-2-rev-speak-1", M17_6_2_REVIEW[0].kana, M17_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m17-6-2-rev-lc-1",
      audioText: M17_6_2_REVIEW[1].kana,
      correctMeaningEn: M17_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_6_2_REVIEW[2].meaningEn,
        M17_6_2_REVIEW[3].meaningEn,
        M17_6_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m17-6-2-rev-mcq-1", M17_6_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M17_REVIEW_POOL),
    speaking("ja-m17-6-2-rev-speak-2", M17_6_2_REVIEW[2].kana, M17_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-6-2-rev", M17_6_2_REVIEW.slice(0, 5)),
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
    "Listen to two friends figure out how to get to the airport on time. Answer questions and practice key patterns.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m17-story-info-open",
      "Story time — Airport rush",
      "ゆき and たけし need to get to the airport by 9. Listen to their plan.",
    ),
    dialogueListen({
      id: "ja-m17-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "くじまでに くうこうに いきます。" },
        { speaker: "たけし", kana: "でんしゃで いきますか。" },
        { speaker: "ゆき", kana: "いいえ、タクシーで いきます。でんしゃは おそいです。" },
        { speaker: "たけし", kana: "そうですね。でかける まえに きっぷを かいますか。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "By what time do they need to reach the airport?",
          correctText: "By 9 o'clock.",
          distractors: ["By 5 o'clock.", "By 10 o'clock.", "No deadline mentioned."],
          explanation: "くじまでに = by 9 o'clock.",
        },
        {
          id: "s1-q2",
          prompt: "How will they go?",
          correctText: "By taxi, because the train is slow.",
          distractors: ["By train.", "By bus.", "On foot."],
          explanation: "タクシーで いきます. でんしゃは おそいです = the train is slow.",
        },
      ],
    }),
    build(
      "ja-m17-story-build-1",
      "Say: I go to the airport by taxi.",
      "タクシーで くうこうに いきます",
      ["タクシー", "で", "くうこう", "に", "いきます", "へ", "でんしゃ"],
      ["タクシー", "で", "くうこう", "に", "いきます"],
    ),
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
    dialogueListen({
      id: "ja-m17-story-scene-2",
      lines: [
        { speaker: "ゆき", kana: "いいえ、タクシーだから きっぷは いりません。" },
        { speaker: "たけし", kana: "そうですか。くうこうの ちかくに コンビニが ありますか。" },
        { speaker: "ゆき", kana: "はい、くうこうの となりに あります。" },
        { speaker: "たけし", kana: "じゃあ、くうこうに ついてから コンビニに いきましょう。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "Do they need to buy a ticket?",
          correctText: "No, because they're taking a taxi.",
          distractors: ["Yes, at the station.", "Yes, at the airport.", "They already have one."],
          explanation: "タクシーだから きっぷは いりません = because it's a taxi, no ticket needed.",
        },
        {
          id: "s2-q2",
          prompt: "Where is the convenience store?",
          correctText: "Next to the airport.",
          distractors: ["Near the station.", "Across the street.", "Between the airport and the station."],
          explanation: "くうこうの となりに あります = it's next to the airport.",
        },
      ],
    }),
    cloze(
      "ja-m17-story-cloze-1",
      "くうこう",
      " となりに コンビニが あります。",
      "の",
      ["の", "に", "で", "は"],
      "There's a convenience store next to the airport.",
      "くうこうの となりに コンビニが あります。",
      "の connects the reference noun to the location word.",
    ),
    listeningBuildSentence({
      id: "ja-m17-story-lb-1",
      target: "タクシーで くうこうに いきます",
      tiles: ["タクシー", "で", "くうこう", "に", "いきます", "へ", "でんしゃ"],
      correctOrder: ["タクシー", "で", "くうこう", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to the airport by taxi.'",
    }),
    listeningCompSentence({
      id: "ja-m17-story-lc-1",
      audioText: "くじまでに くうこうに いきます",
      correctMeaningEn: "I'll go to the airport by 9.",
      distractorsEn: [
        "I go to the airport at 9.",
        "I go to the airport until 9.",
        "I go to the airport after 9.",
      ],
    }),
    speaking(
      "ja-m17-story-speak-1",
      "タクシーで くうこうに いきます",
      "I go to the airport by taxi.",
    ),
    sentenceMcq({
      id: "ja-m17-story-mcq-summary",
      prompt: "What's their full plan?",
      correctKana: "Take a taxi to the airport by 9, then go to the convenience store next door.",
      distractorsKana: [
        "Take a train to the airport, buy tickets, then go to a shop.",
        "Walk to the airport before 9.",
        "Take a bus and buy a ticket at the station.",
      ],
      explanation: "Taxi by 9, then コンビニ (next to the airport) after arriving.",
    }),
    speaking(
      "ja-m17-story-speak-2",
      "くじまでに くうこうに いきます",
      "I'll go to the airport by 9.",
    ),
    infoStep(
      "ja-m17-story-info-end",
      "You followed a real travel-planning conversation",
      "Taxis, deadlines, locations — you understood a natural plan to get to the airport. Real Japanese in action.",
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

const M17_7_1_REVIEW = pickReviewAtoms("ja-m17-7-1-rev", M17_REVIEW_POOL, 5);

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
      ["ふね", "に", "のります", "おります", "で", "を"],
      ["ふね", "に", "のります"],
    ),
    cloze(
      "ja-m17-7-1-cloze-de",
      "ふね",
      " しまに いきます。",
      "で",
      ["で", "に", "へ", "を"],
      "I go to the island by boat.",
      "ふねで しまに いきます。",
      "で marks the means of transport.",
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
      ["びょういん", "は", "えき", "と", "ゆうびんきょく", "の", "あいだ", "です", "そば"],
      ["びょういん", "は", "えき", "と", "ゆうびんきょく", "の", "あいだ", "です"],
    ),
    cloze(
      "ja-m17-7-1-cloze-e",
      "ひだり",
      " まがってください。",
      "へ",
      ["へ", "に", "で", "を"],
      "Please turn left.",
      "ひだりへ まがってください。",
      "へ marks the direction.",
    ),
    listeningBuildSentence({
      id: "ja-m17-7-1-lb-1",
      target: "ごじまでに かえります",
      tiles: ["ごじ", "までに", "かえります", "まで", "いきます", "に"],
      correctOrder: ["ごじ", "までに", "かえります"],
      promptEn: "Hear it, build it: 'I'll be back by 5.'",
    }),
    speaking(
      "ja-m17-7-1-speak-1",
      "ひだりへ まがってから まっすぐ いってください",
      "Turn left, then go straight.",
    ),
    cloze(
      "ja-m17-7-1-cloze-maeni",
      "でかける",
      " きっぷを かいます。",
      "まえに",
      ["まえに", "までに", "あとで", "から"],
      "I buy a ticket before going out.",
      "でかける まえに きっぷを かいます。",
      "Verb dict. form + まえに = before doing.",
    ),
    build(
      "ja-m17-7-1-build-3",
      "Say: I get off the train at the station.",
      "えきで でんしゃを おります",
      ["えき", "で", "でんしゃ", "を", "おります", "に", "のります"],
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
      audioText: "でかける まえに きっぷを かいます",
      correctMeaningEn: "I buy a ticket before going out.",
      distractorsEn: [
        "After going out, I buy a ticket.",
        "I buy a ticket by going out.",
        "I buy a ticket and go out.",
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
      "えきで でんしゃを おります",
      "I get off the train at the station.",
    ),
    // ── Review tail ──
    speaking("ja-m17-7-1-rev-speak-1", M17_7_1_REVIEW[0].kana, M17_7_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m17-7-1-rev-lc-1",
      audioText: M17_7_1_REVIEW[1].kana,
      correctMeaningEn: M17_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_7_1_REVIEW[2].meaningEn,
        M17_7_1_REVIEW[3].meaningEn,
        M17_7_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m17-7-1-rev-mcq-1", M17_7_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M17_REVIEW_POOL),
    speaking("ja-m17-7-1-rev-speak-2", M17_7_1_REVIEW[2].kana, M17_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-7-1-rev", M17_7_1_REVIEW.slice(0, 5)),
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

const M17_7_2_REVIEW = pickReviewAtoms("ja-m17-7-2-rev", M17_REVIEW_POOL, 5);

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
      "Say: I go to the airport by taxi by 9.",
      "くじまでに タクシーで くうこうに いきます",
      ["くじ", "までに", "タクシー", "で", "くうこう", "に", "いきます", "まで"],
      ["くじ", "までに", "タクシー", "で", "くうこう", "に", "いきます"],
    ),
    speaking(
      "ja-m17-7-2-speak-1",
      "くじまでに タクシーで くうこうに いきます",
      "I go to the airport by taxi by 9.",
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
      ["ひだり", "へ", "まがって", "から", "まっすぐ", "いって", "ください", "みぎ"],
      ["ひだり", "へ", "まがって", "から", "まっすぐ", "いって", "ください"],
    ),
    speaking(
      "ja-m17-7-2-speak-2",
      "ひだりへ まがってから まっすぐ いってください",
      "Turn left, then go straight.",
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
      "Say: I buy a ticket before going out.",
      "でかける まえに きっぷを かいます",
      ["でかける", "まえに", "きっぷ", "を", "かいます", "から", "あとで"],
      ["でかける", "まえに", "きっぷ", "を", "かいます"],
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
      "でかける まえに きっぷを かいます",
      "I buy a ticket before going out.",
    ),
    build(
      "ja-m17-7-2-build-4",
      "Say: The convenience store is between the station and the bank.",
      "コンビニは えきと ぎんこうの あいだです",
      ["コンビニ", "は", "えき", "と", "ぎんこう", "の", "あいだ", "です", "となり"],
      ["コンビニ", "は", "えき", "と", "ぎんこう", "の", "あいだ", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m17-7-2-lb-1",
      target: "バスを おりてから みちを わたります",
      tiles: ["バス", "を", "おりて", "から", "みち", "を", "わたります", "に"],
      correctOrder: ["バス", "を", "おりて", "から", "みち", "を", "わたります"],
      promptEn: "Hear it, build it: 'After getting off the bus, I cross the street.'",
    }),
    translateStep({
      id: "ja-m17-7-2-translate-2",
      promptEn: "I'll be back by 5 o'clock.",
      acceptedAnswers: [
        "ごじまでに かえります",
        "ごじまでに かえります。",
      ],
      audioText: "ごじまでに かえります",
    }),
    cloze(
      "ja-m17-7-2-cloze-no",
      "えき",
      " ちかくに レストランが あります。",
      "の",
      ["の", "に", "で", "は"],
      "There's a restaurant near the station.",
      "えきの ちかくに レストランが あります。",
      "の connects the reference noun to the location word.",
    ),
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
      "バスを おりてから みちを わたります",
      "After getting off the bus, I cross the street.",
    ),
    // ── Review tail ──
    speaking("ja-m17-7-2-rev-speak-1", M17_7_2_REVIEW[0].kana, M17_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m17-7-2-rev-lc-1",
      audioText: M17_7_2_REVIEW[1].kana,
      correctMeaningEn: M17_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M17_7_2_REVIEW[2].meaningEn,
        M17_7_2_REVIEW[3].meaningEn,
        M17_7_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m17-7-2-rev-mcq-1", M17_7_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M17_REVIEW_POOL),
    speaking("ja-m17-7-2-rev-speak-2", M17_7_2_REVIEW[2].kana, M17_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m17-7-2-rev", M17_7_2_REVIEW.slice(0, 5)),
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
