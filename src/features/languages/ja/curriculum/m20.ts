/**
 * M20 — Body & Health + ので (2026-05-25).
 *
 * M20 introduces:
 *   - Body part vocabulary (~25 words): あたま, かお, め, みみ, はな (nose),
 *     くち, は (teeth), て, あし, おなか, せなか, ゆび, かみ (hair)
 *   - Health/medical vocab: びょうき, くすり, いしゃ, ねつ, かぜ (cold),
 *     せっけん, タオル, めがね
 *   - 〜がいたい (hurts): あたまがいたい, おなかがいたい
 *   - ので (because — softer/more formal than から, taught in M13)
 *     Natural context: あたまがいたいので、くすりをのみます
 *   - Adjective review with body context
 *   - Backlog adverbs woven in (2026-06-12 sentence-variety pass):
 *     ゆっくり / ゆっくりと (rest/take it easy; slowly — intro M20-2-2)
 *     and たくさん (a lot — intro M20-3-1), in health-advice carriers.
 *
 * ので vs から contrast:
 *   - から (M13) = direct/explanatory, slightly casual
 *   - ので = softer, implying natural consequence, slightly more formal
 *   - Both mean "because" but ので is preferred in polite speech
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps.
 *
 * ID scheme: ja-m20-{n}-{sub} e.g. ja-m20-1-1, ja-m20-1-2
 * Export names: M20_1_1, M20_1_2, M20_2_1, M20_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m20-1, etc.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  cloze,
  dialogueListen,
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
const M20_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_GA_ITAI = grammarRule({
  id: "ja-m20-rule-ga-itai",
  grammarPointId: "ga-itai",
  title: "〜がいたい — it hurts",
  rule:
    "To say a body part hurts, use [body part] + が + いたい(です). いたい is an い-adjective meaning 'painful/hurts.' が marks the body part as the subject of the pain. Example: あたまがいたいです = 'My head hurts.'",
  examples: [
    {
      ja: "あたまが いたいです。",
      romaji: "atama ga itai desu.",
      en: "My head hurts. / I have a headache.",
    },
    {
      ja: "おなかが いたいです。",
      romaji: "onaka ga itai desu.",
      en: "My stomach hurts.",
    },
    {
      ja: "はが いたいです。",
      romaji: "ha ga itai desu.",
      en: "My teeth hurt. / I have a toothache.",
    },
  ],
  antiPattern: {
    ja: "あたまは いたいです。",
    romaji: "atama wa itai desu.",
    en: "(unnatural — は implies contrast; が is the natural choice for reporting pain)",
    why: "When reporting a symptom for the first time, が is used to identify what hurts. は would imply 'as for my head (unlike other parts), it hurts' — unnatural as a simple symptom report.",
  },
  cultureNote:
    "At a Japanese clinic, you'll be asked どうしましたか ('What happened?'). Answer with [body part]がいたいです. The doctor will understand immediately.",
});

const RULE_NODE = grammarRule({
  id: "ja-m20-rule-node",
  grammarPointId: "node-because",
  title: "ので — because (softer than から)",
  rule:
    "ので means 'because,' like から (M13), but softer and more formal. It implies a natural consequence rather than a personal reason. Before ので: い-adjective stays plain (いたいので), な-adjective adds な (しずかなので), noun adds な (びょうきなので), verb stays plain (のむので).",
  examples: [
    {
      ja: "あたまが いたいので、くすりを のみます。",
      romaji: "atama ga itai node, kusuri o nomimasu.",
      en: "Because my head hurts, I'll take medicine.",
    },
    {
      ja: "ねつが あるので、きょうは やすみます。",
      romaji: "netsu ga aru node, kyou wa yasumimasu.",
      en: "Because I have a fever, I'll rest today.",
    },
    {
      ja: "びょうきなので、がっこうに いきません。",
      romaji: "byouki na node, gakkou ni ikimasen.",
      en: "Because I'm sick, I won't go to school.",
    },
  ],
  antiPattern: {
    ja: "びょうきので、がっこうに いきません。",
    romaji: "byouki node, gakkou ni ikimasen.",
    en: "(broken — nouns and な-adjectives need な before ので)",
    why: "Before ので, nouns and な-adjectives require な: びょうき + な + ので. い-adjectives connect directly: いたい + ので.",
  },
  cultureNote:
    "ので sounds softer because it presents the reason as an objective fact leading to a natural conclusion. から sounds more like a personal explanation. In polite speech (especially at work or with strangers), ので is preferred.",
});

const RULE_NODE_VS_KARA = grammarRule({
  id: "ja-m20-rule-node-vs-kara",
  title: "ので vs から — choosing the right 'because'",
  rule:
    "Both mean 'because,' but differ in nuance. から (M13) = direct/personal reason, slightly casual: 'I'll rest because I'M tired.' ので = objective/natural consequence, slightly formal: 'Because there's a fever, I'll rest.' In polite speech, ので is safer. In casual speech or when stating your opinion, から is fine.",
  examples: [
    {
      ja: "あめが ふっているので、かさを もっていきます。",
      romaji: "ame ga futteiru node, kasa o motte ikimasu.",
      en: "Because it's raining, I'll bring an umbrella. (natural consequence)",
    },
    {
      ja: "つかれたから、やすみます。",
      romaji: "tsukareta kara, yasumimasu.",
      en: "I'll rest because I'm tired. (personal reason)",
    },
  ],
  antiPattern: {
    ja: "びょうきですから、やすみます。",
    romaji: "byouki desu kara, yasumimasu.",
    en: "(grammatically correct but から after です sounds a bit blunt in formal settings — ので would be softer)",
    why: "When speaking politely, ので is preferred because it sounds less like making excuses and more like stating facts.",
  },
  cultureNote:
    "Japanese speakers often avoid sounding too direct about reasons. ので provides a gentle buffer — 'it naturally follows that…' — which aligns with the cultural preference for indirectness.",
});

// ═══════════════════════════════════════════════════════════════════════
// M20-1-1 — "Head & face" vocab intro
//   (あたま, かお, め, みみ, はな (nose), くち)
// ═══════════════════════════════════════════════════════════════════════

const M20_1_1_REVIEW = pickReviewAtoms("ja-m20-1-1-rev", M20_REVIEW_POOL, 6);

export const M20_1_1: LessonContent = {
  id: "ja-m20-1-1",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Head & face",
  description:
    "Six body part words for the head and face: head, face, eyes, ears, nose, mouth.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── あたま (head) ──
    build(
      "ja-m20-1-1-build-atama",
      "Pick the Japanese word for: head",
      "あたま",
      ["め", "あたま", "みみ", "かお"],
      ["あたま"],
    ),
    listeningCompSentence({
      id: "ja-m20-1-1-lc-atama",
      audioText: "ねこの あたまは ちいさいです",
      correctMeaningEn: "The cat's head is small.",
      distractorsEn: [
        "The cat's face is small.",
        "The dog's head is big.",
        "The cat is small.",
      ],
    }),
    // ── かお (face) ──
    build(
      "ja-m20-1-1-build-kao",
      "Pick the Japanese word for: face",
      "かお",
      ["くち", "かお", "あたま", "みみ"],
      ["かお"],
    ),
    speaking("ja-m20-1-1-speak-kao", "かお", "Face"),
    // ── め (eyes) ──
    build(
      "ja-m20-1-1-build-me",
      "Pick the Japanese word for: eyes",
      "め",
      ["はな", "くち", "め", "みみ"],
      ["め"],
    ),
    listeningCompSentence({
      id: "ja-m20-1-1-lc-me",
      audioText: "めが あおいです",
      correctMeaningEn: "Their eyes are blue.",
      distractorsEn: [
        "Their eyes are big.",
        "The sky is blue.",
        "Their ears are small.",
      ],
    }),
    // ── みみ (ears) ──
    vocabMcq(
      "ja-m20-1-1-mcq-mimi",
      { kana: "みみ", meaningEn: "ear", emoji: "👂", fromModule: "m20" },
      M20_REVIEW_POOL,
    ),
    speaking("ja-m20-1-1-speak-mimi", "みみ", "Ears"),
    // ── はな (nose) ──
    vocabMcq(
      "ja-m20-1-1-mcq-hana",
      { kana: "はな", meaningEn: "nose", emoji: "👃", fromModule: "m20" },
      M20_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m20-1-1-lc-hana",
      audioText: "はな",
      correctMeaningEn: "nose",
      distractorsEn: ["flower", "mouth", "ears"],
    }),
    // ── くち (mouth) ──
    vocabMcq(
      "ja-m20-1-1-mcq-kuchi",
      { kana: "くち", meaningEn: "mouth", emoji: "👄", fromModule: "m20" },
      M20_REVIEW_POOL,
    ),
    // ── Body sentence drills ──
    build(
      "ja-m20-1-1-build-me-sentence",
      "Say: My eyes are big.",
      "めが おおきいです",
      ["ちいさい", "です", "おおきい", "め", "が", "みみ"],
      ["め", "が", "おおきい", "です"],
    ),
    sentenceMcq({
      id: "ja-m20-1-1-mcq-sentence",
      prompt: "Which means 'I washed my face.'?",
      correctKana: "かおを あらいました。",
      distractorsKana: [
        "あたまを あらいました。",
        "かおが あらいました。",
        "てを あらいました。",
      ],
      explanation: "かお = face. を marks the direct object. あらいました = washed.",
    }),
    cloze(
      "ja-m20-1-1-cloze-ga",
      "くち",
      " ちいさいです。",
      "が",
      ["が", "は", "を", "の"],
      "My mouth is small.",
      "くちが ちいさいです。",
      "が marks the subject in a descriptive statement about a body part.",
    ),
    selfExplain({
      id: "ja-m20-1-1-self-explain",
      anchorLabel: "はな has two meanings",
      anchorAudioText: "はな",
      question: "はな means 'nose' — but what else can it mean?",
      rule: { text: "はな can mean 'nose' (鼻) or 'flower' (花). Context disambiguates: はながいたい = nose hurts, はなをかう = buy flowers. In M20 (body/health context), はな = nose." },
      surface: { text: "はな only means 'nose.' The word for flower is different." },
      distractor: { text: "はな means 'nose' in polite speech and 'flower' in casual speech." },
      ruleExplanation:
        "Japanese has many homophones. はな (鼻) = nose and はな (花) = flower are written with different kanji. Context + kanji disambiguate.",
    }),
    speaking(
      "ja-m20-1-1-speak-sentence",
      "みみが おおきいです",
      "My ears are big.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m20-1-1-rev-mcq-1", M20_1_1_REVIEW[0], M20_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m20-1-1-rev-lc-1",
      audioText: M20_1_1_REVIEW[1].kana,
      correctMeaningEn: M20_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_1_1_REVIEW[2].meaningEn,
        M20_1_1_REVIEW[3].meaningEn,
        M20_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m20-1-1-rev-speak-1", M20_1_1_REVIEW[2].kana, M20_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-1-1-rev", M20_1_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_1_1.steps);
assertAnswerRotation(M20_1_1.steps, 1);
assertNoConsecutiveSame(M20_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-1-2 — "Body" vocab (は teeth, て, あし, おなか, せなか, ゆび, かみ hair)
// ═══════════════════════════════════════════════════════════════════════

const M20_1_2_REVIEW = pickReviewAtoms("ja-m20-1-2-rev", M20_REVIEW_POOL, 6);

export const M20_1_2: LessonContent = {
  id: "ja-m20-1-2",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Body parts",
  description:
    "Seven more body words: teeth, hands, feet, stomach, back, fingers, hair.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── は (teeth) ──
    build(
      "ja-m20-1-2-build-ha",
      "Pick the Japanese word for: teeth",
      "は",
      ["くち", "て", "め", "は"],
      ["は"],
    ),
    listeningCompSentence({
      id: "ja-m20-1-2-lc-ha",
      audioText: "はを みがきます",
      correctMeaningEn: "I brush my teeth.",
      distractorsEn: [
        "I wash my hands.",
        "I comb my hair.",
        "I open my mouth.",
      ],
    }),
    // ── て (hands) ──
    build(
      "ja-m20-1-2-build-te",
      "Pick the Japanese word for: hand(s)",
      "て",
      ["は", "あし", "て", "ゆび"],
      ["て"],
    ),
    speaking("ja-m20-1-2-speak-te", "て", "Hand"),
    // ── あし (feet/legs) ──
    vocabMcq(
      "ja-m20-1-2-mcq-ashi",
      { kana: "あし", meaningEn: "foot, leg", emoji: "🦶", fromModule: "m20" },
      M20_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m20-1-2-lc-ashi",
      audioText: "いぬの あしは みじかいです",
      correctMeaningEn: "The dog's legs are short.",
      distractorsEn: [
        "The dog's legs are long.",
        "The dog's head is small.",
        "The dog is small.",
      ],
    }),
    // ── おなか (stomach) ──
    build(
      "ja-m20-1-2-build-onaka",
      "Pick the Japanese word for: stomach",
      "おなか",
      ["せなか", "かお", "おなか", "あたま"],
      ["おなか"],
    ),
    sentenceMcq({
      id: "ja-m20-1-2-mcq-onaka",
      prompt: "Which means 'I'm hungry' (lit. 'stomach is empty')?",
      correctKana: "おなかが すいています。",
      distractorsKana: [
        "おなかが いたいです。",
        "せなかが すいています。",
        "おなかが おおきいです。",
      ],
      explanation: "おなかがすいています = stomach is empty = I'm hungry.",
    }),
    // ── せなか (back) ──
    build(
      "ja-m20-1-2-build-senaka",
      "Pick the Japanese word for: back (body)",
      "せなか",
      ["あたま", "あし", "おなか", "せなか"],
      ["せなか"],
    ),
    speaking("ja-m20-1-2-speak-senaka", "せなか", "Back"),
    // ── ゆび (fingers) ──
    build(
      "ja-m20-1-2-build-yubi",
      "Pick the Japanese word for: finger(s)",
      "ゆび",
      ["て", "ゆび", "は", "あし"],
      ["ゆび"],
    ),
    listeningCompSentence({
      id: "ja-m20-1-2-lc-yubi",
      audioText: "ゆびが みじかいです",
      correctMeaningEn: "My fingers are short.",
      distractorsEn: [
        "My fingers are long.",
        "My legs are short.",
        "My hands are small.",
      ],
    }),
    // ── かみ (hair) ──
    build(
      "ja-m20-1-2-build-kami",
      "Pick the Japanese word for: hair",
      "かみ",
      ["かお", "あたま", "め", "かみ"],
      ["かみ"],
    ),
    sentenceMcq({
      id: "ja-m20-1-2-mcq-kami",
      prompt: "Which means 'I cut my hair.'?",
      correctKana: "かみを きりました。",
      distractorsKana: [
        "かみを あらいました。",
        "はを みがきました。",
        "かおを あらいました。",
      ],
      explanation: "かみ = hair. きりました = cut (past).",
    }),
    // ── Body drills ──
    cloze(
      "ja-m20-1-2-cloze-wo",
      "て",
      " あらいます。",
      "を",
      ["を", "が", "は", "に"],
      "I wash my hands.",
      "てを あらいます。",
      "を marks the direct object — hands are what you wash.",
    ),
    build(
      "ja-m20-1-2-build-ha-sentence",
      "Say: I brush my teeth every morning.",
      "まいあさ はを みがきます",
      ["みがきます", "あし", "は", "まいあさ", "を", "あらいます"],
      ["まいあさ", "は", "を", "みがきます"],
    ),
    selfExplain({
      id: "ja-m20-1-2-self-explain",
      anchorLabel: "は as 'teeth' vs は as topic marker",
      anchorAudioText: "はを みがきます",
      question: "How do you tell apart は (teeth) from は (topic marker)?",
      rule: { text: "Context and position: teeth-は (歯) is the noun being acted on (はを みがく). Topic は follows a noun as a particle. Kanji disambiguates: 歯 = teeth." },
      surface: { text: "They are pronounced differently — teeth は is 'ha' and the particle is 'wa.'" },
      distractor: { text: "は always means teeth; the topic marker is spelled differently." },
      ruleExplanation:
        "Good catch! The particle は is pronounced 'wa' but written は. The noun は (teeth) is pronounced 'ha.' So they differ in pronunciation, not spelling.",
    }),
    speaking(
      "ja-m20-1-2-speak-sentence",
      "かみを あらいます",
      "I wash my hair.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m20-1-2-rev-mcq-1", M20_1_2_REVIEW[0], M20_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m20-1-2-rev-lc-1",
      audioText: "きょうは さんじに かえります",
      correctMeaningEn: "Today I go home at three o'clock.",
      distractorsEn: [
        "Today I go home at ten o'clock.",
        "I get up at three o'clock.",
        "I came home at three o'clock yesterday.",
      ],
      exercisedAtomKanas: ["さん"],
    }),
    speaking("ja-m20-1-2-rev-speak-1", M20_1_2_REVIEW[2].kana, M20_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-1-2-rev", M20_1_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_1_2.steps);
assertAnswerRotation(M20_1_2.steps, 1);
assertNoConsecutiveSame(M20_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-2-1 — "It hurts" (〜がいたい) intro
// ═══════════════════════════════════════════════════════════════════════

const M20_2_1_REVIEW = pickReviewAtoms("ja-m20-2-1-rev", M20_REVIEW_POOL, 6);

export const M20_2_1: LessonContent = {
  id: "ja-m20-2-1",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "It hurts — がいたい",
  description:
    "The 〜がいたい pattern for describing pain. Head hurts, stomach hurts, teeth hurt.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_GA_ITAI,
    // ── あたまがいたい (headache) ──
    build(
      "ja-m20-2-1-build-atama-itai",
      "Say: My head hurts.",
      "あたまが いたいです",
      ["いたい", "あたま", "です", "が", "は", "おなか"],
      ["あたま", "が", "いたい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m20-2-1-lc-onaka-itai",
      audioText: "おなかが いたいです",
      correctMeaningEn: "My stomach hurts.",
      distractorsEn: [
        "My head hurts.",
        "I'm hungry.",
        "My stomach is full.",
      ],
    }),
    // ── はがいたい (toothache) ──
    build(
      "ja-m20-2-1-build-ha-itai",
      "Say: My teeth hurt.",
      "はが いたいです",
      ["です", "は", "いたい", "が", "くち", "め"],
      ["は", "が", "いたい", "です"],
    ),
    speaking("ja-m20-2-1-speak-senaka-itai", "せなかが いたいです", "My back hurts."),
    sentenceMcq({
      id: "ja-m20-2-1-mcq-me-itai",
      prompt: "Which means 'My eyes hurt.'?",
      correctKana: "めが いたいです。",
      distractorsKana: [
        "めを いたいです。",
        "みみが いたいです。",
        "めは いたいです。",
      ],
      explanation: "め = eyes. が marks the body part. いたい = hurts.",
    }),
    // ── More body pain patterns ──
    listeningBuildSentence({
      id: "ja-m20-2-1-lb-te-itai",
      target: "てが いたいです",
      tiles: ["いたい", "て", "です", "が", "ゆび", "は"],
      correctOrder: ["て", "が", "いたい", "です"],
      promptEn: "Hear it, build it: 'My hand hurts.'",
    }),
    sentenceMcq({
      id: "ja-m20-2-1-mcq-yubi-itai",
      prompt: "Which means 'My finger hurts.'?",
      correctKana: "ゆびが いたいです。",
      distractorsKana: [
        "ては いたいです。",
        "ゆびを いたいです。",
        "あしは いたいです。",
      ],
      explanation: "ゆび = finger. が + いたい is the standard pain pattern.",
    }),
    build(
      "ja-m20-2-1-build-ashi-itai",
      "Say: My feet hurt.",
      "あしが いたいです",
      ["が", "あし", "いたい", "です", "て", "せなか"],
      ["あし", "が", "いたい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m20-2-1-lc-atama-onaka",
      audioText: "あたまと おなかが いたいです",
      correctMeaningEn: "My head and stomach hurt.",
      distractorsEn: [
        "My head and back hurt.",
        "Only my stomach hurts.",
        "My head is big.",
      ],
    }),
    selfExplain({
      id: "ja-m20-2-1-self-explain",
      anchorLabel: "が in pain expressions",
      anchorAudioText: "あたまが いたいです",
      question: "Why が instead of は for 'my head hurts'?",
      rule: { text: "Reporting a symptom is new information, so が identifies WHAT hurts. は would imply contrast ('unlike other parts'). が is the default." },
      surface: { text: "が sounds more polite than は when talking to a doctor." },
      distractor: { text: "が is used for pain but は is used for other sensations like cold or hot." },
      ruleExplanation:
        "This is the new-information use of が. When someone asks 'what's wrong?' and you answer 'my head hurts,' the head is new information → が.",
    }),
    speaking(
      "ja-m20-2-1-speak-sentence",
      "みみが いたいです",
      "My ear hurts.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m20-2-1-rev-mcq-1", M20_2_1_REVIEW[0], M20_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m20-2-1-rev-lc-1",
      audioText: M20_2_1_REVIEW[1].kana,
      correctMeaningEn: M20_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_2_1_REVIEW[2].meaningEn,
        M20_2_1_REVIEW[3].meaningEn,
        M20_REVIEW_POOL[2].meaningEn,
      ],
    }),
    speaking("ja-m20-2-1-rev-speak-1", M20_2_1_REVIEW[2].kana, M20_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-2-1-rev", M20_2_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_2_1.steps);
assertAnswerRotation(M20_2_1.steps, 1);
assertNoConsecutiveSame(M20_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-2-2 — Pain drill + medical context
// ═══════════════════════════════════════════════════════════════════════

const M20_2_2_REVIEW = pickReviewAtoms("ja-m20-2-2-rev", M20_REVIEW_POOL, 6);

export const M20_2_2: LessonContent = {
  id: "ja-m20-2-2",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Pain drill + medical vocab",
  description:
    "More pain patterns plus medical vocabulary: びょうき, くすり, いしゃ, ねつ.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── びょうき (illness) ──
    vocabMcq(
      "ja-m20-2-2-mcq-byouki",
      { kana: "びょうき", meaningEn: "illness", emoji: "🤒", fromModule: "m20" },
      M20_REVIEW_POOL,
    ),
    build(
      "ja-m20-2-2-build-byouki",
      "Say: I am sick.",
      "びょうきです",
      ["げんき", "です", "びょうき", "いたい"],
      ["びょうき", "です"],
    ),
    // ── くすり (medicine) ──
    vocabMcq(
      "ja-m20-2-2-mcq-kusuri",
      { kana: "くすり", meaningEn: "medicine", emoji: "💊", fromModule: "m20" },
      M20_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m20-2-2-lc-kusuri",
      audioText: "くすりを のみます",
      correctMeaningEn: "I take medicine.",
      distractorsEn: [
        "I drink water.",
        "I buy medicine.",
        "I have medicine.",
      ],
    }),
    // ── いしゃ (doctor) ──
    build(
      "ja-m20-2-2-build-isha",
      "Pick the Japanese word for: doctor",
      "いしゃ",
      ["びょうき", "せんせい", "くすり", "いしゃ"],
      ["いしゃ"],
    ),
    speaking("ja-m20-2-2-speak-isha", "いしゃ", "Doctor"),
    // ── ねつ (fever) ──
    build(
      "ja-m20-2-2-build-netsu",
      "Pick the Japanese word for: fever",
      "ねつ",
      ["くすり", "かぜ", "びょうき", "ねつ"],
      ["ねつ"],
    ),
    sentenceMcq({
      id: "ja-m20-2-2-mcq-netsu",
      prompt: "Which means 'I have a fever.'?",
      correctKana: "ねつが あります。",
      distractorsKana: [
        "ねつを あります。",
        "ねつが います。",
        "かぜが あります。",
      ],
      explanation: "ねつがあります = 'there is a fever' = 'I have a fever.' あります for non-living things.",
    }),
    // ── Medical context drills + ゆっくり (take it easy) ──
    build(
      "ja-m20-2-2-build-yukkuri",
      "Pick the Japanese word for: slowly / restfully (take it easy)",
      "ゆっくり",
      ["はやく", "ゆっくり", "すこし", "とても"],
      ["ゆっくり"],
    ),
    build(
      "ja-m20-2-2-build-isha-ni",
      "Say: I go to the doctor.",
      "いしゃに いきます",
      ["いきます", "いしゃ", "に", "を", "びょういん", "で"],
      ["いしゃ", "に", "いきます"],
    ),
    listeningBuildSentence({
      id: "ja-m20-2-2-lb-kusuri",
      target: "くすりを かいます",
      tiles: ["かいます", "くすり", "を", "が", "のみます", "いしゃ"],
      correctOrder: ["くすり", "を", "かいます"],
      promptEn: "Hear it, build it: 'I buy medicine.'",
    }),
    sentenceMcq({
      id: "ja-m20-2-2-mcq-isha",
      prompt: "Which means 'I went to the doctor.'?",
      correctKana: "いしゃに いきました。",
      distractorsKana: [
        "いしゃを いきました。",
        "いしゃに きました。",
        "びょうきに いきました。",
      ],
      explanation: "いしゃに = to the doctor. いきました = went.",
    }),
    listeningCompSentence({
      id: "ja-m20-2-2-lc-yukkuri",
      audioText: "ゆっくり やすんでください",
      correctMeaningEn: "Please rest well (take it easy).",
      distractorsEn: [
        "Please hurry and rest.",
        "Please take medicine.",
        "Please speak slowly.",
      ],
    }),
    // ── ゆっくりと (slowly, adverb) — backlog weave ──
    build(
      "ja-m20-2-2-build-yukkurito",
      "Say: I walk slowly.",
      "ゆっくりと あるきます",
      ["はやく", "あるきます", "ゆっくりと", "たべます"],
      ["ゆっくりと", "あるきます"],
    ),
    translateStep({
      id: "ja-m20-2-2-translate",
      promptEn: "My eyes hurt.",
      acceptedAnswers: [
        "めが いたいです",
        "めが いたいです。",
        "めがいたいです",
        "めがいたいです。",
      ],
      audioText: "めが いたいです",
    }),
    selfExplain({
      id: "ja-m20-2-2-self-explain",
      anchorLabel: "Medical vocabulary patterns",
      anchorAudioText: "くすりを のみます",
      question: "Why を for くすり but が for ねつ?",
      rule: { text: "くすりを のみます: medicine is taken (direct object → を). ねつが あります: a fever exists (subject → が). Different verbs, different particles." },
      surface: { text: "を is used for medicine because medicine is liquid (you 'drink' it)." },
      distractor: { text: "が is only for pain expressions; ねつ uses が because fever hurts." },
      ruleExplanation:
        "The particle depends on the verb: のむ (take/drink) takes an object (を); あります (exists) takes a subject (が). A general rule, not medical-specific.",
    }),
    speaking(
      "ja-m20-2-2-speak-sentence",
      "くすりを ください",
      "Medicine, please.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m20-2-2-rev-mcq-1", M20_2_2_REVIEW[0], M20_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m20-2-2-rev-lc-1",
      audioText: "まいにち ろくじに おきます",
      correctMeaningEn: "I get up at six o'clock every day.",
      distractorsEn: [
        "I get up at nine o'clock every day.",
        "I go to bed at six o'clock.",
        "I eat breakfast at six o'clock.",
      ],
      exercisedAtomKanas: ["ろく"],
    }),
    speaking("ja-m20-2-2-rev-speak-1", M20_2_2_REVIEW[2].kana, M20_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-2-2-rev", M20_2_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_2_2.steps);
assertAnswerRotation(M20_2_2.steps, 1);
assertNoConsecutiveSame(M20_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-3-1 — More health vocab (かぜ, せっけん, タオル, めがね)
// ═══════════════════════════════════════════════════════════════════════

const M20_3_1_REVIEW = pickReviewAtoms("ja-m20-3-1-rev", M20_REVIEW_POOL, 6);

export const M20_3_1: LessonContent = {
  id: "ja-m20-3-1",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Health & hygiene vocab",
  description:
    "Four more health/hygiene words: cold (illness), soap, towel, glasses.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── かぜ (a cold) ──
    vocabMcq(
      "ja-m20-3-1-mcq-kaze",
      { kana: "かぜ", meaningEn: "a cold", emoji: "🤧", fromModule: "m20" },
      M20_REVIEW_POOL,
    ),
    build(
      "ja-m20-3-1-build-kaze",
      "Say: I caught a cold.",
      "かぜを ひきました",
      ["が", "を", "びょうき", "かぜ", "ひきました", "あります"],
      ["かぜ", "を", "ひきました"],
    ),
    listeningCompSentence({
      id: "ja-m20-3-1-lc-kaze",
      audioText: "おとうとは かぜを ひきました",
      correctMeaningEn: "My little brother caught a cold.",
      distractorsEn: [
        "My little brother has a fever.",
        "I caught a cold.",
        "My little brother is fine.",
      ],
    }),
    // ── せっけん (soap) ──
    vocabMcq(
      "ja-m20-3-1-mcq-sekken",
      { kana: "せっけん", meaningEn: "soap", emoji: "🧼", fromModule: "m20" },
      M20_REVIEW_POOL,
    ),
    speaking("ja-m20-3-1-speak-sekken", "せっけん", "Soap"),
    // ── タオル (towel) ──
    build(
      "ja-m20-3-1-build-taoru",
      "Pick the Japanese word for: towel",
      "タオル",
      ["くすり", "せっけん", "タオル", "めがね"],
      ["タオル"],
    ),
    listeningCompSentence({
      id: "ja-m20-3-1-lc-taoru",
      audioText: "タオルが ありますか",
      correctMeaningEn: "Do you have a towel?",
      distractorsEn: [
        "Do you have soap?",
        "Where is the towel?",
        "This towel is clean.",
      ],
    }),
    // ── めがね (glasses) ──
    vocabMcq(
      "ja-m20-3-1-mcq-megane",
      { kana: "めがね", meaningEn: "glasses", emoji: "👓", fromModule: "m20" },
      M20_REVIEW_POOL,
    ),
    sentenceMcq({
      id: "ja-m20-3-1-mcq-megane-sentence",
      prompt: "Which means 'I wear glasses.'?",
      correctKana: "めがねを かけています。",
      distractorsKana: [
        "めがねが あります。",
        "めがねを みています。",
        "めがねを きています。",
      ],
      explanation: "めがねをかけています = wearing glasses. かけて is the specific verb for glasses.",
    }),
    // ── Hygiene sentence drills ──
    cloze(
      "ja-m20-3-1-cloze-de",
      "せっけん",
      " てを あらいます。",
      "で",
      ["で", "を", "が", "に"],
      "I wash my hands with soap.",
      "せっけんで てを あらいます。",
      "で marks the means/tool — 'with soap.'",
    ),
    build(
      "ja-m20-3-1-build-taoru-sentence",
      "Say: I dry my hands with a towel.",
      "タオルで てを ふきます",
      ["ふきます", "を", "て", "で", "せっけん", "タオル", "あらいます"],
      ["タオル", "で", "て", "を", "ふきます"],
    ),
    listeningBuildSentence({
      id: "ja-m20-3-1-lb-kaze",
      target: "かぜを ひきましたか",
      tiles: ["ひきました", "かぜ", "か", "を", "ねつ", "が"],
      correctOrder: ["かぜ", "を", "ひきました", "か"],
      promptEn: "Hear it, build it: 'Did you catch a cold?'",
    }),
    // ── たくさん (a lot) — health-advice adverb ──
    build(
      "ja-m20-3-1-build-takusan",
      "Pick the Japanese word for: a lot / many",
      "たくさん",
      ["すこし", "ちょっと", "たくさん", "とても"],
      ["たくさん"],
    ),
    listeningCompSentence({
      id: "ja-m20-3-1-lc-takusan",
      audioText: "みずを たくさん のんでください",
      correctMeaningEn: "Please drink lots of water.",
      distractorsEn: [
        "Please drink a little water.",
        "Please buy lots of water.",
        "Please drink lots of tea.",
      ],
    }),
    selfExplain({
      id: "ja-m20-3-1-self-explain",
      anchorLabel: "かぜをひく — a fixed phrase",
      anchorAudioText: "かぜを ひきました",
      question: "Why を with かぜ (a cold)?",
      rule: { text: "かぜをひく is a set phrase — 'to catch a cold.' You don't physically grab a cold, but Japanese treats it as を's direct object. Memorize it." },
      surface: { text: "を is used because かぜ is a thing you can touch." },
      distractor: { text: "が would also be correct — かぜがひく means the same thing." },
      ruleExplanation:
        "Many languages have set phrases for illness that don't follow literal logic. English 'catch a cold,' Japanese かぜをひく. Just memorize the pattern.",
    }),
    speaking(
      "ja-m20-3-1-speak-sentence",
      "まいばん かみを あらいます",
      "I wash my hair every night.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m20-3-1-rev-mcq-1", M20_3_1_REVIEW[0], M20_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m20-3-1-rev-lc-1",
      audioText: "いちがつは さむいです",
      correctMeaningEn: "January is cold.",
      distractorsEn: [
        "August is hot.",
        "January is warm.",
        "It is one o'clock.",
      ],
      exercisedAtomKanas: ["いち"],
    }),
    speaking("ja-m20-3-1-rev-speak-1", M20_3_1_REVIEW[2].kana, M20_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-3-1-rev", M20_3_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_3_1.steps);
assertAnswerRotation(M20_3_1.steps, 1);
assertNoConsecutiveSame(M20_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-3-2 — Body & health mixed drill
// ═══════════════════════════════════════════════════════════════════════

const M20_3_2_REVIEW = pickReviewAtoms("ja-m20-3-2-rev", M20_REVIEW_POOL, 6);

export const M20_3_2: LessonContent = {
  id: "ja-m20-3-2",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Body & health — mixed drill",
  description:
    "Mix all body parts + health vocab. Pain, illness, hygiene — interleaved retrieval.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── Mixed drills ──
    sentenceMcq({
      id: "ja-m20-3-2-mcq-1",
      prompt: "Which means 'I have a fever and a headache.'?",
      correctKana: "ねつが あって、あたまが いたいです。",
      distractorsKana: [
        "ねつを あって、あたまが いたいです。",
        "ねつが あります。あたまは いたいです。",
        "かぜが あって、おなかが いたいです。",
      ],
      explanation: "ねつがあって (te-form of ある + connection) + あたまがいたい. Combined symptoms.",
    }),
    listeningCompSentence({
      id: "ja-m20-3-2-lc-hana-itai",
      audioText: "はなが いたいです",
      correctMeaningEn: "My nose hurts.",
      distractorsEn: [
        "My nose is tall.",
        "My ear hurts.",
        "I caught a cold.",
      ],
    }),
    build(
      "ja-m20-3-2-build-1",
      "Say: I wash my face with soap.",
      "せっけんで かおを あらいます",
      ["かお", "せっけん", "あらいます", "で", "を", "て", "に"],
      ["せっけん", "で", "かお", "を", "あらいます"],
    ),
    sentenceMcq({
      id: "ja-m20-3-2-mcq-2",
      prompt: "Which means 'I'll take medicine and rest.'?",
      correctKana: "くすりを のんで、やすみます。",
      distractorsKana: [
        "くすりを のみます。やすみました。",
        "くすりが のんで、やすみます。",
        "いしゃを のんで、やすみます。",
      ],
      explanation: "くすりをのんで (te-form: take medicine) + やすみます (rest).",
    }),
    build(
      "ja-m20-3-2-build-taoru",
      "Say: I dry my face with a towel.",
      "タオルで かおを ふきます",
      ["ふきます", "タオル", "かお", "で", "を", "あらいます", "て"],
      ["タオル", "で", "かお", "を", "ふきます"],
    ),
    build(
      "ja-m20-3-2-build-2",
      "Say: I brush my teeth every night.",
      "まいばん はを みがきます",
      ["みがきます", "は", "あらいます", "まいあさ", "を", "まいばん"],
      ["まいばん", "は", "を", "みがきます"],
    ),
    listeningBuildSentence({
      id: "ja-m20-3-2-lb-1",
      target: "びょういんに いきます",
      tiles: ["いきます", "びょういん", "に", "を", "で", "いしゃ"],
      correctOrder: ["びょういん", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to the hospital.'",
    }),
    speaking(
      "ja-m20-3-2-speak-kusuri",
      "くすりを のみました",
      "I took medicine.",
    ),
    sentenceMcq({
      id: "ja-m20-3-2-mcq-3",
      prompt: "Which means 'My back hurts.'?",
      correctKana: "せなかが いたいです。",
      distractorsKana: [
        "おなかが いたいです。",
        "せなかは いたいです。",
        "あしが いたいです。",
      ],
      explanation: "せなか = back. が + いたい = standard pain pattern.",
    }),
    build(
      "ja-m20-3-2-build-3",
      "Say: I caught a cold. I have a fever.",
      "かぜを ひきました ねつが あります",
      ["が", "を", "あります", "びょうき", "ひきました", "かぜ", "ねつ"],
      ["かぜ", "を", "ひきました", "ねつ", "が", "あります"],
    ),
    listeningCompSentence({
      id: "ja-m20-3-2-lc-2",
      audioText: "めがねを かけています",
      correctMeaningEn: "I wear glasses.",
      distractorsEn: [
        "I have glasses.",
        "I took off glasses.",
        "I see glasses.",
      ],
    }),
    translateStep({
      id: "ja-m20-3-2-translate",
      promptEn: "My stomach hurts.",
      acceptedAnswers: [
        "おなかが いたいです",
        "おなかが いたいです。",
        "おなかがいたいです",
        "おなかがいたいです。",
      ],
      audioText: "おなかが いたいです",
    }),
    selfExplain({
      id: "ja-m20-3-2-self-explain",
      anchorLabel: "Body + health vocabulary review",
      anchorAudioText: "かぜを ひきました ねつが あります",
      question: "What particle goes with かぜ when saying 'caught a cold'?",
      rule: { text: "かぜをひく is a set phrase — を marks かぜ as the object of ひく (to catch/pull). This is fixed; don't substitute が or は." },
      surface: { text: "Any particle works — かぜがひく and かぜをひく are both correct." },
      distractor: { text: "が is correct because the cold is what hurts you." },
      ruleExplanation:
        "Set phrases have fixed particle assignments. かぜをひく = catch a cold. ねつがある = have a fever. Memorize them as units.",
    }),
    speaking(
      "ja-m20-3-2-speak",
      "せっけんを かいます",
      "I buy soap.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m20-3-2-rev-mcq-1", M20_3_2_REVIEW[0], M20_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m20-3-2-rev-lc-1",
      audioText: "かさは どこですか",
      correctMeaningEn: "Where is the umbrella?",
      distractorsEn: [
        "Where is the bag?",
        "Whose umbrella is this?",
        "There are two umbrellas.",
      ],
      exercisedAtomKanas: ["かさ"],
    }),
    speaking("ja-m20-3-2-rev-speak-1", M20_3_2_REVIEW[2].kana, M20_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-3-2-rev", M20_3_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_3_2.steps);
assertAnswerRotation(M20_3_2.steps, 1);
assertNoConsecutiveSame(M20_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-4-1 — ので intro (because, softer than から)
// ═══════════════════════════════════════════════════════════════════════

const M20_4_1_REVIEW = pickReviewAtoms("ja-m20-4-1-rev", M20_REVIEW_POOL, 6);

export const M20_4_1: LessonContent = {
  id: "ja-m20-4-1",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Because (ので) — intro",
  description:
    "ので = 'because' (softer than から). Natural in medical context: あたまがいたいので、くすりをのみます.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_NODE,
    // ── い-adjective + ので ──
    build(
      "ja-m20-4-1-build-itai-node",
      "Say: Because my head hurts, I'll take medicine.",
      "あたまが いたいので くすりを のみます",
      ["のみます", "いたい", "あたま", "ので", "から", "くすり", "が", "を"],
      ["あたま", "が", "いたい", "ので", "くすり", "を", "のみます"],
    ),
    listeningCompSentence({
      id: "ja-m20-4-1-lc-itai-node",
      audioText: "あしが いたいので こうえんに いきません",
      correctMeaningEn: "Because my feet hurt, I won't go to the park.",
      distractorsEn: [
        "My feet hurt because I went to the park.",
        "Because my feet hurt, I'll go to the hospital.",
        "I won't go to the park, so my feet hurt.",
      ],
    }),
    // ── Noun + なので ──
    build(
      "ja-m20-4-1-build-byouki-nanode",
      "Say: Because I'm sick, I won't go to school.",
      "びょうきなので がっこうに いきません",
      ["から", "なので", "がっこう", "います", "に", "びょうき", "いきません"],
      ["びょうき", "なので", "がっこう", "に", "いきません"],
    ),
    sentenceMcq({
      id: "ja-m20-4-1-mcq-nanode",
      prompt: "Which correctly uses ので with a noun?",
      correctKana: "びょうきなので、やすみます。",
      distractorsKana: [
        "びょうきので、やすみます。",
        "びょうきだので、やすみます。",
        "びょうきのなので、やすみます。",
      ],
      explanation: "Nouns need な before ので: びょうき + な + ので.",
    }),
    // ── Verb + ので ──
    build(
      "ja-m20-4-1-build-aru-node",
      "Say: Because I have a fever, I'll rest today.",
      "ねつが あるので きょうは やすみます",
      ["ので", "は", "ねつ", "やすみます", "ある", "きょう", "から", "が"],
      ["ねつ", "が", "ある", "ので", "きょう", "は", "やすみます"],
    ),
    speaking(
      "ja-m20-4-1-speak-aru-node",
      "かぜを ひいたので うちに います",
      "Because I caught a cold, I'm staying home.",
    ),
    // ── ので drill ──
    cloze(
      "ja-m20-4-1-cloze-node-1",
      "おなかが いたい",
      "、なにも たべません。",
      "ので",
      ["ので", "から", "が", "は"],
      "Because my stomach hurts, I won't eat anything.",
      "おなかが いたいので、なにも たべません。",
      "い-adjective connects directly to ので.",
    ),
    listeningBuildSentence({
      id: "ja-m20-4-1-lb-node",
      target: "おなかが いたいので くすりを のみます",
      tiles: ["くすり", "おなか", "いたい", "が", "ので", "を", "のみます", "から"],
      correctOrder: ["おなか", "が", "いたい", "ので", "くすり", "を", "のみます"],
      promptEn: "Hear it, build it: 'Because my stomach hurts, I'll take medicine.'",
    }),
    sentenceMcq({
      id: "ja-m20-4-1-mcq-node-vs-kara",
      prompt: "Which sounds more polite when calling in sick?",
      correctKana: "ねつが あるので、やすみます。",
      distractorsKana: [
        "ねつが あるから、やすみます。",
        "ねつが あります。やすみます。",
        "ねつだので、やすみます。",
      ],
      explanation: "ので is softer/more formal than から — preferred when speaking to a boss or doctor.",
    }),
    cloze(
      "ja-m20-4-1-cloze-nanode",
      "びょうき",
      "、きょうは やすみます。",
      "なので",
      ["なので", "ので", "から", "だから"],
      "Because I'm sick, I'll rest today.",
      "びょうきなので、きょうは やすみます。",
      "Nouns need な before ので.",
    ),
    build(
      "ja-m20-4-1-build-kaze-node",
      "Say: Because I caught a cold, I'll go to the doctor.",
      "かぜを ひいたので いしゃに いきます",
      ["に", "ので", "から", "いきます", "いしゃ", "を", "かぜ", "ひいた"],
      ["かぜ", "を", "ひいた", "ので", "いしゃ", "に", "いきます"],
    ),
    selfExplain({
      id: "ja-m20-4-1-self-explain",
      anchorLabel: "ので connection rules",
      anchorAudioText: "びょうきなので やすみます",
      question: "What comes before ので for nouns vs い-adjectives?",
      rule: { text: "い-adjectives connect directly: いたいので. Nouns and な-adjectives add な: びょうきなので. Verbs connect directly (plain form): あるので." },
      surface: { text: "Everything connects directly to ので — no な needed." },
      distractor: { text: "い-adjectives need い removed before ので: いたので (not いたいので)." },
      ruleExplanation:
        "ので connects like a な-adjective modifier. That's why nouns need な (the same な that な-adjectives already carry). い-adjectives and verbs connect directly.",
    }),
    speaking(
      "ja-m20-4-1-speak-sentence",
      "かぜなので はやく ねます",
      "Because of my cold, I'll go to bed early.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m20-4-1-rev-mcq-1", M20_4_1_REVIEW[0], M20_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m20-4-1-rev-lc-1",
      audioText: M20_4_1_REVIEW[1].kana,
      correctMeaningEn: M20_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_4_1_REVIEW[2].meaningEn,
        M20_4_1_REVIEW[3].meaningEn,
        M20_REVIEW_POOL[6].meaningEn,
      ],
    }),
    speaking("ja-m20-4-1-rev-speak-1", M20_4_1_REVIEW[2].kana, M20_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-4-1-rev", M20_4_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_4_1.steps);
assertAnswerRotation(M20_4_1.steps, 1);
assertNoConsecutiveSame(M20_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-4-2 — ので vs から contrast drill
// ═══════════════════════════════════════════════════════════════════════

const M20_4_2_REVIEW = pickReviewAtoms("ja-m20-4-2-rev", M20_REVIEW_POOL, 6);

export const M20_4_2: LessonContent = {
  id: "ja-m20-4-2",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "ので vs から — contrast",
  description:
    "When to use ので vs から. Nuance drill: objective consequence vs personal reason.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_NODE_VS_KARA,
    // ── Discrimination drills ──
    sentenceMcq({
      id: "ja-m20-4-2-mcq-1",
      prompt: "Calling in sick to your boss. Which sounds better?",
      correctKana: "ねつが あるので、おやすみを いただきます。",
      distractorsKana: [
        "ねつが あるから、やすみます。",
        "ねつなので、おやすみを いただきます。",
        "ねつが あるので、がんばります。",
      ],
      explanation: "ので sounds softer/more formal — appropriate for a boss. から would sound too casual.",
    }),
    cloze(
      "ja-m20-4-2-cloze-node",
      "あめが ふっている",
      "、かさを もっていきます。",
      "ので",
      ["ので", "から", "が", "けど"],
      "Because it's raining, I'll bring an umbrella.",
      "あめが ふっているので、かさを もっていきます。",
      "Natural consequence → ので is the better fit.",
    ),
    build(
      "ja-m20-4-2-build-kara",
      "Say: I'll rest because I'm tired. (direct/casual)",
      "つかれたから やすみます",
      ["ので", "やすみます", "から", "つかれた", "です"],
      ["つかれた", "から", "やすみます"],
    ),
    listeningCompSentence({
      id: "ja-m20-4-2-lc-node",
      audioText: "かぜを ひいたので きょうは やすみます",
      correctMeaningEn: "Because I caught a cold, I'll rest today.",
      distractorsEn: [
        "I caught a cold, so I'll go to the doctor.",
        "Because I rested, I caught a cold.",
        "I'll catch a cold because I rested.",
      ],
    }),
    sentenceMcq({
      id: "ja-m20-4-2-mcq-2",
      prompt: "Telling a close friend: 'I'm going because I want to.' Which fits?",
      correctKana: "いきたいから、いきます。",
      distractorsKana: [
        "いきたいので、いきます。",
        "いきたいなので、いきます。",
        "いきたいけど、いきます。",
      ],
      explanation: "Personal desire/reason = から feels natural. ので would be overly formal with a close friend.",
    }),
    cloze(
      "ja-m20-4-2-cloze-nanode",
      "しずか",
      "、よく ねむれます。",
      "なので",
      ["なので", "ので", "だから", "から"],
      "Because it's quiet, I can sleep well.",
      "しずかなので、よく ねむれます。",
      "な-adjective + なので (natural consequence).",
    ),
    build(
      "ja-m20-4-2-build-node-itai",
      "Say: Because my stomach hurts, I won't eat.",
      "おなかが いたいので たべません",
      ["から", "ので", "のみません", "たべません", "いたい", "が", "おなか"],
      ["おなか", "が", "いたい", "ので", "たべません"],
    ),
    listeningBuildSentence({
      id: "ja-m20-4-2-lb-kara",
      target: "つかれたから コーヒーを のみます",
      tiles: ["コーヒー", "つかれた", "のみます", "から", "を", "ので", "やすみます"],
      correctOrder: ["つかれた", "から", "コーヒー", "を", "のみます"],
      promptEn: "Hear it, build it: 'I'm tired, so I'll drink coffee.'",
    }),
    sentenceMcq({
      id: "ja-m20-4-2-mcq-3",
      prompt: "Which is MORE polite for 'Because I'm sick, I can't go'?",
      correctKana: "びょうきなので、いけません。",
      distractorsKana: [
        "びょうきだから、いけません。",
        "びょうきので、いけません。",
        "びょうきですから、いきません。",
      ],
      explanation: "びょうきなので is softer/more polite. だから is more casual.",
    }),
    cloze(
      "ja-m20-4-2-cloze-node-2",
      "はが いたい",
      "、いしゃに いきます。",
      "ので",
      ["ので", "から", "けど", "が"],
      "Because my teeth hurt, I'll go to the doctor.",
      "はが いたいので、いしゃに いきます。",
      "い-adjective connects directly to ので.",
    ),
    translateStep({
      id: "ja-m20-4-2-translate",
      promptEn: "Because my head hurts, I'll take medicine.",
      acceptedAnswers: [
        "あたまが いたいので くすりを のみます",
        "あたまが いたいので くすりを のみます。",
        "あたまが いたいので、くすりを のみます",
        "あたまが いたいので、くすりを のみます。",
        "あたまがいたいので くすりをのみます",
        "あたまがいたいのでくすりをのみます",
      ],
      audioText: "あたまが いたいので くすりを のみます",
    }),
    selfExplain({
      id: "ja-m20-4-2-self-explain",
      anchorLabel: "ので vs から in daily life",
      anchorAudioText: "ねつが あるので やすみます",
      question: "When should you choose ので over から?",
      rule: { text: "Use ので in polite/formal situations (bosses, doctors, strangers) or for objective facts. Use から in casual speech or personal desires/opinions." },
      surface: { text: "ので and から are completely interchangeable — just pick your favorite." },
      distractor: { text: "ので is only for illness-related reasons; から is for everything else." },
      ruleExplanation:
        "The core difference: ので presents reason as natural/objective, から as personal/explanatory. In practice, ので = safer choice in polite speech.",
    }),
    speaking(
      "ja-m20-4-2-speak",
      "おなかが いたいので たべません",
      "Because my stomach hurts, I won't eat.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m20-4-2-rev-mcq-1", M20_4_2_REVIEW[0], M20_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m20-4-2-rev-lc-1",
      audioText: "あの ひとは だれですか",
      correctMeaningEn: "Who is that person?",
      distractorsEn: [
        "What is that?",
        "Where is that person?",
        "That person is my teacher.",
      ],
      exercisedAtomKanas: ["だれ"],
    }),
    speaking("ja-m20-4-2-rev-speak-1", M20_4_2_REVIEW[2].kana, M20_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-4-2-rev", M20_4_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_4_2.steps);
assertAnswerRotation(M20_4_2.steps, 1);
assertNoConsecutiveSame(M20_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-5-1 — Interleaved drill (body + がいたい + ので)
// ═══════════════════════════════════════════════════════════════════════

const M20_5_1_REVIEW = pickReviewAtoms("ja-m20-5-1-rev", M20_REVIEW_POOL, 6);

export const M20_5_1: LessonContent = {
  id: "ja-m20-5-1",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Body + pain + ので — interleaved",
  description:
    "Mix all M20 patterns: body parts, がいたい, ので sentences. Full interleaving.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    // ── Mixed drills ──
    sentenceMcq({
      id: "ja-m20-5-1-mcq-1",
      prompt: "Which means 'Because my back hurts, I can't exercise.'?",
      correctKana: "せなかが いたいので、うんどうできません。",
      distractorsKana: [
        "せなかが いたいから、うんどうできません。",
        "せなかは いたいので、うんどうしません。",
        "おなかが いたいので、うんどうできません。",
      ],
      explanation: "せなかがいたいので = because my back hurts (polite). うんどうできません = can't exercise.",
    }),
    cloze(
      "ja-m20-5-1-cloze-node",
      "めが いたい",
      "、テレビを みません。",
      "ので",
      ["ので", "から", "が", "は"],
      "Because my eyes hurt, I won't watch TV.",
      "めが いたいので、テレビを みません。",
      "い-adjective + ので directly.",
    ),
    build(
      "ja-m20-5-1-build-1",
      "Say: Because I have a fever, I'll go to the doctor.",
      "ねつが あるので いしゃに いきます",
      ["ある", "に", "ねつ", "が", "から", "ので", "いきます", "いしゃ"],
      ["ねつ", "が", "ある", "ので", "いしゃ", "に", "いきます"],
    ),
    listeningCompSentence({
      id: "ja-m20-5-1-lc-1",
      audioText: "はが いたいので いしゃに いきます",
      correctMeaningEn: "Because my teeth hurt, I'll go to the doctor.",
      distractorsEn: [
        "My teeth hurt after going to the doctor.",
        "Because I went to the doctor, my teeth hurt.",
        "Because I'm sick, my teeth hurt.",
      ],
    }),
    sentenceMcq({
      id: "ja-m20-5-1-mcq-2",
      prompt: "Which correctly uses なので?",
      correctKana: "かぜなので、がっこうを やすみます。",
      distractorsKana: [
        "かぜので、がっこうを やすみます。",
        "かぜだなので、がっこうを やすみます。",
        "かぜのなので、がっこうを やすみます。",
      ],
      explanation: "Noun (かぜ) + なので. No だ before なので.",
    }),
    build(
      "ja-m20-5-1-build-takusan",
      "Say: I drink lots of water.",
      "みずを たくさん のみます",
      ["たくさん", "みず", "のみます", "を", "すこし", "たべます"],
      ["みず", "を", "たくさん", "のみます"],
    ),
    build(
      "ja-m20-5-1-build-2",
      "Say: I wash my hands with soap because of my cold.",
      "かぜなので せっけんで てを あらいます",
      ["なので", "で", "せっけん", "を", "あらいます", "から", "かぜ", "て"],
      ["かぜ", "なので", "せっけん", "で", "て", "を", "あらいます"],
    ),
    listeningBuildSentence({
      id: "ja-m20-5-1-lb-1",
      target: "あしが いたいので でんしゃで いきます",
      tiles: ["でんしゃ", "あし", "いたい", "が", "ので", "で", "いきます", "から"],
      correctOrder: ["あし", "が", "いたい", "ので", "でんしゃ", "で", "いきます"],
      promptEn: "Hear it, build it: 'Because my feet hurt, I'll go by train.'",
    }),
    sentenceMcq({
      id: "ja-m20-5-1-mcq-3",
      prompt: "Which means 'Please take medicine because you have a fever.'?",
      correctKana: "ねつが あるので、くすりを のんでください。",
      distractorsKana: [
        "ねつなので、くすりを のんでください。",
        "ねつが あるので、くすりを のみます。",
        "ねつが あるから、くすりが あります。",
      ],
      explanation: "ねつがあるので (verb + ので) + くすりをのんでください (please take medicine).",
    }),
    cloze(
      "ja-m20-5-1-cloze-nanode",
      "あめ",
      "、こうえんに いきません。",
      "なので",
      ["なので", "ので", "から", "だから"],
      "Because of the rain, I won't go to the park.",
      "あめなので、こうえんに いきません。",
      "Noun + なので.",
    ),
    build(
      "ja-m20-5-1-build-3",
      "Say: I buy a towel and soap.",
      "タオルと せっけんを かいます",
      ["せっけん", "タオル", "かいます", "と", "を", "ふきます", "で"],
      ["タオル", "と", "せっけん", "を", "かいます"],
    ),
    translateStep({
      id: "ja-m20-5-1-translate",
      promptEn: "Because I'm sick, I won't go to school.",
      acceptedAnswers: [
        "びょうきなので がっこうに いきません",
        "びょうきなので がっこうに いきません。",
        "びょうきなので、がっこうに いきません",
        "びょうきなので、がっこうに いきません。",
      ],
      audioText: "びょうきなので がっこうに いきません",
    }),
    selfExplain({
      id: "ja-m20-5-1-self-explain",
      anchorLabel: "ので connection review",
      anchorAudioText: "かぜなので せっけんで てを あらいます",
      question: "Why なので for かぜ but just ので for いたい?",
      rule: { text: "かぜ is a noun → needs な before ので. いたい is an い-adjective → connects directly. な bridges nouns/な-adjectives to ので." },
      surface: { text: "It depends on the length of the word — short words use なので." },
      distractor: { text: "なので is for medical nouns; ので is for everything else." },
      ruleExplanation:
        "The rule is grammatical category: nouns/な-adj + なので, い-adj/verbs + ので. Nothing to do with the word's meaning or length.",
    }),
    speaking(
      "ja-m20-5-1-speak",
      "あたまが いたいので はやく ねます",
      "Because my head hurts, I'll go to bed early.",
    ),
    // ── Review tail ──
    speaking("ja-m20-5-1-rev-speak-1", M20_5_1_REVIEW[0].kana, M20_5_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m20-5-1-rev-lc-1",
      audioText: "これは ごひゃくえんです",
      correctMeaningEn: "This is 500 yen.",
      distractorsEn: [
        "This is 300 yen.",
        "This is 5,000 yen.",
        "How much is this?",
      ],
      exercisedAtomKanas: ["えん"],
    }),
    vocabMcq("ja-m20-5-1-rev-mcq-1", M20_5_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M20_REVIEW_POOL),
    speaking("ja-m20-5-1-rev-speak-2", M20_5_1_REVIEW[2].kana, M20_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-5-1-rev", M20_5_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_5_1.steps);
assertAnswerRotation(M20_5_1.steps, 1);
assertNoConsecutiveSame(M20_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-5-2 — Production (translate + speaking health scenarios)
// ═══════════════════════════════════════════════════════════════════════

const M20_5_2_REVIEW = pickReviewAtoms("ja-m20-5-2-rev", M20_REVIEW_POOL, 6);

export const M20_5_2: LessonContent = {
  id: "ja-m20-5-2",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Health — production",
  description:
    "Production-heavy: translate, build, and speak health scenarios.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    // ── Production drills ──
    build(
      "ja-m20-5-2-build-1",
      "Say: Because my head hurts, I'll rest well.",
      "あたまが いたいので ゆっくり やすみます",
      ["ゆっくり", "あたま", "いたい", "が", "ので", "やすみます", "から", "はやく"],
      ["あたま", "が", "いたい", "ので", "ゆっくり", "やすみます"],
    ),
    speaking(
      "ja-m20-5-2-speak-1",
      "ねつが あるので みずを たくさん のみます",
      "Because I have a fever, I drink lots of water.",
    ),
    translateStep({
      id: "ja-m20-5-2-translate-1",
      promptEn: "I have a fever.",
      acceptedAnswers: [
        "ねつが あります",
        "ねつが あります。",
        "ねつがあります",
        "ねつがあります。",
      ],
      audioText: "ねつが あります",
    }),
    build(
      "ja-m20-5-2-build-2",
      "Say: I wash my hands with soap every day.",
      "まいにち せっけんで てを あらいます",
      ["せっけん", "で", "を", "まいにち", "まいあさ", "かお", "あらいます", "て"],
      ["まいにち", "せっけん", "で", "て", "を", "あらいます"],
    ),
    speaking(
      "ja-m20-5-2-speak-2",
      "まいばん タオルで かおを ふきます",
      "I dry my face with a towel every night.",
    ),
    sentenceMcq({
      id: "ja-m20-5-2-mcq-1",
      prompt: "Which correctly says 'Because I caught a cold, I'll rest'?",
      correctKana: "かぜを ひいたので、やすみます。",
      distractorsKana: [
        "かぜなので、やすみます。",
        "かぜを ひいたから、やすみます。",
        "かぜを ひくので、やすみます。",
      ],
      explanation: "かぜをひいた (past: caught a cold) + ので. ので is softer than から.",
    }),
    build(
      "ja-m20-5-2-build-3",
      "Say: My teeth hurt, so I went to the doctor.",
      "はが いたいので いしゃに いきました",
      ["から", "いたい", "が", "は", "いしゃ", "ので", "に", "いきました"],
      ["は", "が", "いたい", "ので", "いしゃ", "に", "いきました"],
    ),
    listeningBuildSentence({
      id: "ja-m20-5-2-lb-1",
      target: "びょうきなので やすみます",
      tiles: ["いきます", "から", "なので", "やすみます", "びょうき"],
      correctOrder: ["びょうき", "なので", "やすみます"],
      promptEn: "Hear it, build it: 'Because I'm sick, I'll rest.'",
    }),
    translateStep({
      id: "ja-m20-5-2-translate-2",
      promptEn: "I brush my teeth every morning.",
      acceptedAnswers: [
        "まいあさ はを みがきます",
        "まいあさ はを みがきます。",
        "まいあさ はをみがきます",
        "まいあさ はをみがきます。",
      ],
      audioText: "まいあさ はを みがきます",
    }),
    build(
      "ja-m20-5-2-build-4",
      "Say: Because I'm sick, I won't go to work.",
      "びょうきなので しごとに いきません",
      ["しごと", "なので", "に", "いきません", "がっこう", "びょうき", "から"],
      ["びょうき", "なので", "しごと", "に", "いきません"],
    ),
    speaking(
      "ja-m20-5-2-speak-3",
      "あしが いたいので ゆっくりと あるきます",
      "Because my feet hurt, I walk slowly.",
    ),
    listeningCompSentence({
      id: "ja-m20-5-2-lc-1",
      audioText: "あしが いたいので あるけません",
      correctMeaningEn: "Because my feet hurt, I can't walk.",
      distractorsEn: [
        "My feet hurt after walking.",
        "Because I walked, my feet hurt.",
        "I'll walk because my feet are fine.",
      ],
    }),
    build(
      "ja-m20-5-2-build-5",
      "Say: Because I caught a cold, I take medicine and rest.",
      "かぜを ひいたので くすりを のんで やすみます",
      ["を", "のんで", "から", "ので", "くすり", "ひいた", "を", "やすみます", "かぜ"],
      ["かぜ", "を", "ひいた", "ので", "くすり", "を", "のんで", "やすみます"],
    ),
    cloze(
      "ja-m20-5-2-cloze-node",
      "ゆびが いたい",
      "、ピアノを ひけません。",
      "ので",
      ["ので", "から", "が", "けど"],
      "Because my finger hurts, I can't play piano.",
      "ゆびが いたいので、ピアノを ひけません。",
      "い-adjective + ので directly.",
    ),
    selfExplain({
      id: "ja-m20-5-2-self-explain",
      anchorLabel: "M20 grammar in production",
      anchorAudioText: "はが いたいので いしゃに いきました",
      question: "Build a full clinic sentence: 'What hurts' + 'what I'll do about it.'",
      rule: { text: "[Body part]がいたいので + [action]. The ので connects the symptom (reason) to the response (action). Example: はがいたいので、いしゃにいきます." },
      surface: { text: "You don't need ので — just say two separate sentences." },
      distractor: { text: "Use から instead of ので at clinics because doctors prefer directness." },
      ruleExplanation:
        "ので creates a single sentence: reason → consequence. This is the standard medical-context pattern and sounds natural to a doctor.",
    }),
    speaking(
      "ja-m20-5-2-speak-4",
      "ゆっくり やすんでください",
      "Please rest well (take it easy).",
    ),
    // ── Review tail ──
    speaking("ja-m20-5-2-rev-speak-1", M20_5_2_REVIEW[0].kana, M20_5_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m20-5-2-rev-lc-1",
      audioText: M20_5_2_REVIEW[1].kana,
      correctMeaningEn: M20_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_5_2_REVIEW[2].meaningEn,
        M20_5_2_REVIEW[3].meaningEn,
        M20_5_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m20-5-2-rev-mcq-1", M20_5_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M20_REVIEW_POOL),
    speaking("ja-m20-5-2-rev-speak-2", M20_5_2_REVIEW[2].kana, M20_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-5-2-rev", M20_5_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_5_2.steps);
assertAnswerRotation(M20_5_2.steps, 1);
assertNoConsecutiveSame(M20_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-6-1 — Adjective review with body context
// ═══════════════════════════════════════════════════════════════════════

const M20_6_1_REVIEW = pickReviewAtoms("ja-m20-6-1-rev", M20_REVIEW_POOL, 6);

export const M20_6_1: LessonContent = {
  id: "ja-m20-6-1",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Body + adjectives review",
  description:
    "Reviewing い-adjectives (M8) in body/health context. Big, small, hot, cold + body parts.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    // ── Adjective + body drills ──
    build(
      "ja-m20-6-1-build-1",
      "Say: My hands are big.",
      "てが おおきいです",
      ["ちいさい", "が", "です", "おおきい", "あし", "て"],
      ["て", "が", "おおきい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m20-6-1-lc-1",
      audioText: "めが ちいさいです",
      correctMeaningEn: "My eyes are small.",
      distractorsEn: [
        "My ears are small.",
        "My eyes are big.",
        "My eyes hurt.",
      ],
    }),
    sentenceMcq({
      id: "ja-m20-6-1-mcq-1",
      prompt: "Which means 'My hair is long.'?",
      correctKana: "かみが ながいです。",
      distractorsKana: [
        "かみが みじかいです。",
        "かみが おおきいです。",
        "あたまが ながいです。",
      ],
      explanation: "かみ = hair. ながい = long.",
    }),
    build(
      "ja-m20-6-1-build-hana",
      "Say: My nose is tall (prominent).",
      "はなが たかいです",
      ["たかい", "はな", "です", "が", "は", "ひくい"],
      ["はな", "が", "たかい", "です"],
    ),
    build(
      "ja-m20-6-1-build-2",
      "Say: My ears are small.",
      "みみが ちいさいです",
      ["おおきい", "ちいさい", "め", "です", "が", "みみ"],
      ["みみ", "が", "ちいさい", "です"],
    ),
    speaking(
      "ja-m20-6-1-speak-1",
      "かみが みじかいです",
      "My hair is short.",
    ),
    sentenceMcq({
      id: "ja-m20-6-1-mcq-2",
      prompt: "Which means 'My face is hot' (as in fever)?",
      correctKana: "かおが あついです。",
      distractorsKana: [
        "かおが つめたいです。",
        "あたまが おおきいです。",
        "かおが いたいです。",
      ],
      explanation: "かお = face. あつい = hot — a hot face often means a fever.",
    }),
    listeningCompSentence({
      id: "ja-m20-6-1-lc-te",
      audioText: "てが ちいさいです",
      correctMeaningEn: "My hands are small.",
      distractorsEn: [
        "My hands are big.",
        "My feet are small.",
        "My hands hurt.",
      ],
    }),
    build(
      "ja-m20-6-1-build-3",
      "Say: Because my eyes hurt, I can't read.",
      "めが いたいので ほんを よめません",
      ["を", "ので", "よめません", "から", "が", "め", "ほん", "いたい"],
      ["め", "が", "いたい", "ので", "ほん", "を", "よめません"],
    ),
    listeningBuildSentence({
      id: "ja-m20-6-1-lb-1",
      target: "あしが ながいです",
      tiles: ["ながい", "あし", "です", "が", "みじかい", "は"],
      correctOrder: ["あし", "が", "ながい", "です"],
      promptEn: "Hear it, build it: 'My legs are long.'",
    }),
    listeningCompSentence({
      id: "ja-m20-6-1-lc-2",
      audioText: "ゆびが ながいです",
      correctMeaningEn: "My fingers are long.",
      distractorsEn: [
        "My fingers hurt.",
        "My toes are long.",
        "My fingers are short.",
      ],
    }),
    translateStep({
      id: "ja-m20-6-1-translate",
      promptEn: "My eyes are big.",
      acceptedAnswers: [
        "めが おおきいです",
        "めが おおきいです。",
        "めがおおきいです",
        "めがおおきいです。",
      ],
      audioText: "めが おおきいです",
    }),
    selfExplain({
      id: "ja-m20-6-1-self-explain",
      anchorLabel: "Adjectives + body parts",
      anchorAudioText: "めが ちいさいです",
      question: "When describing body parts, why が and not は?",
      rule: { text: "A feature described for the first time is new info, so が identifies what has it. は would imply contrast or an established topic." },
      surface: { text: "が is only for pain — for size/shape you should use は." },
      distractor: { text: "が is used because body parts are small words." },
      ruleExplanation:
        "Same が-for-new-information principle as pain expressions. めがちいさい = 'it's the eyes that are small' (identifying the subject).",
    }),
    speaking(
      "ja-m20-6-1-speak-2",
      "かみが ながいので きります",
      "My hair is long, so I'll cut it.",
    ),
    // ── Review tail ──
    speaking("ja-m20-6-1-rev-speak-1", M20_6_1_REVIEW[0].kana, M20_6_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m20-6-1-rev-lc-1",
      audioText: "あたらしい カメラが ほしいです",
      correctMeaningEn: "I want a new camera.",
      distractorsEn: [
        "I want a new phone.",
        "I bought a new camera.",
        "This camera is old.",
      ],
      exercisedAtomKanas: ["カメラ"],
    }),
    vocabMcq("ja-m20-6-1-rev-mcq-1", M20_6_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M20_REVIEW_POOL),
    speaking("ja-m20-6-1-rev-speak-2", M20_6_1_REVIEW[2].kana, M20_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-6-1-rev", M20_6_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_6_1.steps);
assertAnswerRotation(M20_6_1.steps, 1);
assertNoConsecutiveSame(M20_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-6-2 — Full production (body + health + ので)
// ═══════════════════════════════════════════════════════════════════════

const M20_6_2_REVIEW = pickReviewAtoms("ja-m20-6-2-rev", M20_REVIEW_POOL, 6);

export const M20_6_2: LessonContent = {
  id: "ja-m20-6-2",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Body & health — full production",
  description:
    "Final production: all body vocabulary, がいたい, ので, adjectives. Everything in production.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    // ── Production drills ──
    build(
      "ja-m20-6-2-build-1",
      "Say: Because I caught a cold, I have a fever.",
      "かぜを ひいたので ねつが あります",
      ["を", "が", "あります", "ひいた", "かぜ", "ので", "から", "ねつ"],
      ["かぜ", "を", "ひいた", "ので", "ねつ", "が", "あります"],
    ),
    speaking(
      "ja-m20-6-2-speak-1",
      "かぜを ひいたので ゆっくり やすみます",
      "Because I caught a cold, I'll rest well.",
    ),
    translateStep({
      id: "ja-m20-6-2-translate-1",
      promptEn: "My stomach hurts, so I won't eat anything.",
      acceptedAnswers: [
        "おなかが いたいので なにも たべません",
        "おなかが いたいので なにも たべません。",
        "おなかが いたいので、なにも たべません",
        "おなかが いたいので、なにも たべません。",
      ],
      audioText: "おなかが いたいので なにも たべません",
    }),
    build(
      "ja-m20-6-2-build-2",
      "Say: I wash my face and brush my teeth every morning.",
      "まいあさ かおを あらって はを みがきます",
      ["あらって", "を", "みがきます", "かお", "は", "て", "を", "まいあさ"],
      ["まいあさ", "かお", "を", "あらって", "は", "を", "みがきます"],
    ),
    speaking(
      "ja-m20-6-2-speak-2",
      "まいばん はを みがいて ねます",
      "Every night I brush my teeth and go to bed.",
    ),
    sentenceMcq({
      id: "ja-m20-6-2-mcq-1",
      prompt: "Which means 'Because I'm sick, I'll go to the doctor.'?",
      correctKana: "びょうきなので、いしゃに いきます。",
      distractorsKana: [
        "びょうきだから、いしゃに いきます。",
        "びょうきので、いしゃに いきます。",
        "びょうきなので、いしゃを いきます。",
      ],
      explanation: "Noun + なので. いしゃに (direction/destination).",
    }),
    build(
      "ja-m20-6-2-build-3",
      "Say: My back hurts. Please give me medicine.",
      "せなかが いたいです くすりを ください",
      ["ください", "が", "です", "くすり", "おなか", "を", "いたい", "せなか"],
      ["せなか", "が", "いたい", "です", "くすり", "を", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m20-6-2-lb-1",
      target: "めが いたいので めがねを かけません",
      tiles: ["を", "め", "ので", "めがね", "いたい", "から", "かけません", "が"],
      correctOrder: ["め", "が", "いたい", "ので", "めがね", "を", "かけません"],
      promptEn: "Hear it, build it: 'Because my eyes hurt, I won't wear glasses.'",
    }),
    translateStep({
      id: "ja-m20-6-2-translate-2",
      promptEn: "I caught a cold.",
      acceptedAnswers: [
        "かぜを ひきました",
        "かぜを ひきました。",
        "かぜをひきました",
        "かぜをひきました。",
      ],
      audioText: "かぜを ひきました",
    }),
    build(
      "ja-m20-6-2-build-4",
      "Say: I dry my hands with a towel.",
      "タオルで てを ふきます",
      ["せっけん", "あらいます", "ふきます", "タオル", "て", "で", "を"],
      ["タオル", "で", "て", "を", "ふきます"],
    ),
    speaking(
      "ja-m20-6-2-speak-3",
      "ゆびが いたいので てがみを かきません",
      "Because my finger hurts, I won't write a letter.",
    ),
    listeningCompSentence({
      id: "ja-m20-6-2-lc-1",
      audioText: "かみが ながいです",
      correctMeaningEn: "My hair is long.",
      distractorsEn: [
        "My hair is short.",
        "My hair hurts.",
        "My head is big.",
      ],
    }),
    build(
      "ja-m20-6-2-build-5",
      "Say: Because my ear hurt, I went to the hospital.",
      "みみが いたいので びょういんに いきました",
      ["びょういん", "みみ", "いたい", "が", "ので", "に", "いきました", "から"],
      ["みみ", "が", "いたい", "ので", "びょういん", "に", "いきました"],
    ),
    cloze(
      "ja-m20-6-2-cloze-node",
      "ねつが ある",
      "、はやく ねます。",
      "ので",
      ["ので", "から", "が", "は"],
      "Because I have a fever, I'll go to bed early.",
      "ねつが あるので、はやく ねます。",
      "Verb (ある) + ので directly.",
    ),
    selfExplain({
      id: "ja-m20-6-2-self-explain",
      anchorLabel: "M20 complete system",
      anchorAudioText: "あたまが いたいので くすりを のみます",
      question: "What does M20 teach?",
      rule: { text: "1) Body part vocabulary. 2) 〜がいたい for pain. 3) ので for softer reasons. 4) Medical vocab. 5) Adjective review. All combine into clinic-ready sentences." },
      surface: { text: "M20 only taught body vocabulary — no grammar." },
      distractor: { text: "M20 taught ので as a replacement for から — never use から again." },
      ruleExplanation:
        "M20 weaves body vocabulary with the がいたい pain pattern and the ので reason connector. から is still valid — ので is an addition, not a replacement.",
    }),
    speaking(
      "ja-m20-6-2-speak-4",
      "おなかが いたいので いしゃに いきます",
      "Because my stomach hurts, I'll go to the doctor.",
    ),
    // ── Review tail ──
    speaking("ja-m20-6-2-rev-speak-1", M20_6_2_REVIEW[0].kana, M20_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m20-6-2-rev-lc-1",
      audioText: "あさ パンを たべます",
      correctMeaningEn: "I eat bread in the morning.",
      distractorsEn: [
        "I eat rice in the morning.",
        "I drink coffee in the morning.",
        "I eat bread at night.",
      ],
      exercisedAtomKanas: ["たべます"],
    }),
    vocabMcq("ja-m20-6-2-rev-mcq-1", M20_6_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M20_REVIEW_POOL),
    speaking("ja-m20-6-2-rev-speak-2", M20_6_2_REVIEW[2].kana, M20_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-6-2-rev", M20_6_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_6_2.steps);
assertAnswerRotation(M20_6_2.steps, 1);
assertNoConsecutiveSame(M20_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-STORY — たけし's sick week (storyComprehension factory, §13.13)
//   Module closer: single-voice narrative + comprehension MCQs + response
//   build. Only previously-taught material (M20 + earlier modules).
// ═══════════════════════════════════════════════════════════════════════

export const M20_STORY: LessonContent = {
  id: "ja-m20-story",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — たけし got sick",
  description:
    "Listen to たけし tell the story of his cold — symptoms, the doctor, the medicine, and getting better. Answer questions and reply to him.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    ...storyComprehension({
      idPrefix: "ja-m20-story",
      narrative: [
        { kana: "きのう、かぜを ひきました。" },
        { kana: "ねつが ありました。" },
        { kana: "あたまも いたくて、なにも たべませんでした。" },
        { kana: "いしゃに いきました。" },
        { kana: "びょういんで くすりを かいました。" },
        { kana: "くすりを のんで、ゆっくり やすみました。" },
        { kana: "きょうは げんきです。" },
      ],
      comprehensionQuestions: [
        {
          id: "q1",
          prompt: "What were たけし's symptoms?",
          correctText: "A fever and a headache.",
          distractors: [
            "A stomachache and a toothache.",
            "A fever only.",
            "Sore feet.",
          ],
          explanation:
            "ねつが ありました = had a fever. あたまも いたくて = his head also hurt.",
        },
        {
          id: "q2",
          prompt: "What did he buy at the hospital?",
          correctText: "Medicine.",
          distractors: ["Soap.", "A towel.", "Glasses."],
          explanation: "びょういんで くすりを かいました = bought medicine at the hospital.",
        },
        {
          id: "q3",
          prompt: "How is たけし today?",
          correctText: "He's well again.",
          distractors: [
            "Still sick.",
            "His fever got worse.",
            "He's at the hospital.",
          ],
          explanation: "きょうは げんきです = today I'm well.",
        },
      ],
      responseBuild: {
        target: "ゆっくり やすんでください",
        tiles: ["やすんで", "ゆっくり", "ください", "はやく", "のんで"],
        correctOrder: ["ゆっくり", "やすんで", "ください"],
        promptEn: "Reply to たけし: 'Please rest well (take it easy).'",
      },
      exercisedAtomKanas: ["かぜ", "ねつ", "あたま", "いしゃ", "くすり", "ゆっくりと"],
    }),
    sentenceMcq({
      id: "ja-m20-story-mcq-summary",
      prompt: "Why didn't たけし eat anything?",
      correctKana: "Because his head hurt too (he felt awful).",
      distractorsKana: [
        "Because the food was expensive.",
        "Because the hospital was closed.",
        "Because he wasn't home.",
      ],
      explanation:
        "あたまも いたくて、なにも たべませんでした — his head also hurt, so he didn't eat anything.",
    }),
    listeningCompSentence({
      id: "ja-m20-story-lc-1",
      audioText: "きょうは げんきです",
      correctMeaningEn: "Today I'm well.",
      distractorsEn: [
        "Today I'm sick.",
        "Today I'll rest.",
        "Today I have a fever.",
      ],
    }),
    speaking(
      "ja-m20-story-speak-1",
      "かぜを ひいて いしゃに いきました",
      "I caught a cold and went to the doctor.",
    ),
  ],
};

assertNoConsecutiveSame(M20_STORY.steps);
assertPassiveCardsHaveFollowup(M20_STORY.steps);
assertNoExplanationOnPassive(M20_STORY.steps);
assertExplanationDoesntLeakAnswer(M20_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-7-1 — Comprehension closer (dialogue at the pharmacy)
// ═══════════════════════════════════════════════════════════════════════

const M20_7_1_REVIEW = pickReviewAtoms("ja-m20-7-1-rev", M20_REVIEW_POOL, 6);

export const M20_7_1: LessonContent = {
  id: "ja-m20-7-1",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "At the pharmacy — dialogue",
  description:
    "Comprehension dialogue: buying medicine at a pharmacy. All M20 patterns combined.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    dialogueListen({
      id: "ja-m20-7-1-scene-1",
      lines: [
        { speaker: "たけし", kana: "すみません。かぜの くすりは ありますか。" },
        { speaker: "やくざいし", kana: "はい、あります。どんな しょうじょうですか。" },
        { speaker: "たけし", kana: "あたまが いたいです。ねつも あります。" },
        { speaker: "やくざいし", kana: "この くすりが いいです。いちにち さんかい のんでください。" },
      ],
      questions: [
        {
          id: "d1-q1",
          prompt: "What is たけし looking for?",
          correctText: "Cold medicine.",
          distractors: ["Stomach medicine.", "A towel.", "A doctor."],
          explanation: "かぜのくすり = cold medicine.",
        },
        {
          id: "d1-q2",
          prompt: "How often should he take the medicine?",
          correctText: "Three times a day.",
          distractors: ["Twice a day.", "Once a day.", "Every morning."],
          explanation: "いちにちさんかい = three times a day.",
        },
      ],
    }),
    build(
      "ja-m20-7-1-build-1",
      "Ask: Do you have cold medicine?",
      "かぜの くすりは ありますか",
      ["くすり", "が", "か", "ください", "の", "かぜ", "は", "あります"],
      ["かぜ", "の", "くすり", "は", "あります", "か"],
    ),
    sentenceMcq({
      id: "ja-m20-7-1-mcq-1",
      prompt: "The pharmacist said この くすりが いいです. What does this mean?",
      correctKana: "This medicine is good.",
      distractorsKana: [
        "This medicine is expensive.",
        "This medicine is mine.",
        "Take this medicine.",
      ],
      explanation: "この くすりが いいです = this medicine is good (recommendation).",
    }),
    speaking(
      "ja-m20-7-1-speak-mizu",
      "みずを たくさん のんでください",
      "Please drink lots of water.",
    ),
    listeningCompSentence({
      id: "ja-m20-7-1-lc-1",
      audioText: "いちにち さんかい のんでください",
      correctMeaningEn: "Please take it three times a day.",
      distractorsEn: [
        "Please take it once a day.",
        "Take three pills.",
        "Drink it for three days.",
      ],
    }),
    build(
      "ja-m20-7-1-build-2",
      "Say: Because I have a fever, I take medicine.",
      "ねつが あるので くすりを のみます",
      ["が", "から", "を", "くすり", "ねつ", "ので", "ある", "のみます"],
      ["ねつ", "が", "ある", "ので", "くすり", "を", "のみます"],
    ),
    speaking(
      "ja-m20-7-1-speak-1",
      "おなかの くすりは ありますか",
      "Do you have stomach medicine?",
    ),
    sentenceMcq({
      id: "ja-m20-7-1-mcq-2",
      prompt: "Which means 'Because my feet hurt, I can't walk.'?",
      correctKana: "あしが いたいので、あるけません。",
      distractorsKana: [
        "あしが いたいから、あるけません。",
        "あしは いたいので、あるけません。",
        "てが いたいので、あるけません。",
      ],
      explanation: "あしがいたいので (feet hurt, softer reason) + あるけません (can't walk).",
    }),
    listeningBuildSentence({
      id: "ja-m20-7-1-lb-1",
      target: "ねつが あるので きょうは やすみます",
      tiles: ["ので", "は", "ねつ", "やすみます", "ある", "きょう", "から", "が"],
      correctOrder: ["ねつ", "が", "ある", "ので", "きょう", "は", "やすみます"],
      promptEn: "Hear it, build it: 'Because I have a fever, I'll rest today.'",
    }),
    build(
      "ja-m20-7-1-build-mimi-node",
      "Say: Because my ear hurts, I won't listen to music.",
      "みみが いたいので おんがくを ききません",
      ["おんがく", "みみ", "いたい", "が", "ので", "を", "ききません", "から"],
      ["みみ", "が", "いたい", "ので", "おんがく", "を", "ききません"],
    ),
    translateStep({
      id: "ja-m20-7-1-translate",
      promptEn: "My ear hurts.",
      acceptedAnswers: [
        "みみが いたいです",
        "みみが いたいです。",
        "みみがいたいです",
        "みみがいたいです。",
      ],
      audioText: "みみが いたいです",
    }),
    selfExplain({
      id: "ja-m20-7-1-self-explain",
      anchorLabel: "Clinic/pharmacy pattern",
      anchorAudioText: "かぜの くすりは ありますか",
      question: "What's the pattern for asking about specific medicine?",
      rule: { text: "[illness/symptom]の くすり = medicine for [X]. Ask with は ありますか. Examples: かぜのくすり (cold medicine), はいたのくすり (toothache medicine)." },
      surface: { text: "You must say the brand name of the medicine in Japanese." },
      distractor: { text: "Use が instead of は when asking a pharmacist." },
      ruleExplanation:
        "の links the condition to the medicine (medicine OF/FOR that condition). は + ありますか is the standard 'do you have?' pattern.",
    }),
    speaking(
      "ja-m20-7-1-speak-2",
      "かぜを ひいたので くすりを かいました",
      "Because I caught a cold, I bought medicine.",
    ),
    // ── Review tail ──
    speaking("ja-m20-7-1-rev-speak-1", M20_7_1_REVIEW[0].kana, M20_7_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m20-7-1-rev-lc-1",
      audioText: "きょうは おかねが ありません",
      correctMeaningEn: "I don't have money today.",
      distractorsEn: [
        "I have money today.",
        "I don't have time today.",
        "I have a lot of money.",
      ],
      exercisedAtomKanas: ["おかね"],
    }),
    vocabMcq("ja-m20-7-1-rev-mcq-1", M20_7_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M20_REVIEW_POOL),
    speaking("ja-m20-7-1-rev-speak-2", M20_7_1_REVIEW[2].kana, M20_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-7-1-rev", M20_7_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_7_1.steps);
assertAnswerRotation(M20_7_1.steps, 1);
assertNoConsecutiveSame(M20_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-7-2 — Module wrap-up (all M20 patterns)
// ═══════════════════════════════════════════════════════════════════════

const M20_7_2_REVIEW = pickReviewAtoms("ja-m20-7-2-rev", M20_REVIEW_POOL, 6);

export const M20_7_2: LessonContent = {
  id: "ja-m20-7-2",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Body & health — wrap-up",
  description:
    "Final round: all body parts, pain, ので, health vocab, adjectives. Module 20 complete.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    // ── Production drills ──
    build(
      "ja-m20-7-2-build-1",
      "Say: Because my head hurts, I'll take medicine and rest.",
      "あたまが いたいので くすりを のんで やすみます",
      ["ので", "を", "くすり", "から", "のんで", "が", "いたい", "やすみます", "あたま"],
      ["あたま", "が", "いたい", "ので", "くすり", "を", "のんで", "やすみます"],
    ),
    speaking(
      "ja-m20-7-2-speak-1",
      "びょうきなので みずを たくさん のみます",
      "Because I'm sick, I drink lots of water.",
    ),
    translateStep({
      id: "ja-m20-7-2-translate-1",
      promptEn: "I caught a cold. I have a fever.",
      acceptedAnswers: [
        "かぜを ひきました ねつが あります",
        "かぜを ひきました。ねつが あります",
        "かぜを ひきました。ねつが あります。",
        "かぜをひきました。ねつがあります。",
      ],
      audioText: "かぜを ひきました ねつが あります",
    }),
    sentenceMcq({
      id: "ja-m20-7-2-mcq-1",
      prompt: "Which is the correct way to tell the doctor 'My teeth hurt'?",
      correctKana: "はが いたいです。",
      distractorsKana: [
        "はを いたいです。",
        "はは いたいです。",
        "はに いたいです。",
      ],
      explanation: "は (teeth) + が (subject) + いたい (hurt). が is mandatory in pain reports.",
    }),
    build(
      "ja-m20-7-2-build-2",
      "Say: Because of my cold, I drink lots of tea.",
      "かぜなので おちゃを たくさん のみます",
      ["おちゃ", "かぜ", "たくさん", "なので", "を", "のみます", "から", "すこし"],
      ["かぜ", "なので", "おちゃ", "を", "たくさん", "のみます"],
    ),
    listeningCompSentence({
      id: "ja-m20-7-2-lc-1",
      audioText: "あたまが いたいので しごとを やすみます",
      correctMeaningEn: "Because my head hurts, I'm taking the day off work.",
      distractorsEn: [
        "Because of work, my head hurts.",
        "Because my head hurts, I'll go to work.",
        "Because I'm sick, I'm taking the day off school.",
      ],
    }),
    build(
      "ja-m20-7-2-build-3",
      "Say: My hair is long and my eyes are big.",
      "かみが ながくて めが おおきいです",
      ["が", "ちいさい", "かみ", "です", "おおきい", "ながくて", "が", "め"],
      ["かみ", "が", "ながくて", "め", "が", "おおきい", "です"],
    ),
    speaking(
      "ja-m20-7-2-speak-2",
      "せっけんと タオルを かいました",
      "I bought soap and a towel.",
    ),
    cloze(
      "ja-m20-7-2-cloze-node",
      "みみが いたい",
      "、いしゃに いきます。",
      "ので",
      ["ので", "から", "が", "けど"],
      "Because my ear hurts, I'll go to the doctor.",
      "みみが いたいので、いしゃに いきます。",
      "い-adjective + ので directly.",
    ),
    listeningBuildSentence({
      id: "ja-m20-7-2-lb-1",
      target: "せっけんで てを あらいます",
      tiles: ["を", "で", "せっけん", "タオル", "て", "ふきます", "あらいます"],
      correctOrder: ["せっけん", "で", "て", "を", "あらいます"],
      promptEn: "Hear it, build it: 'I wash my hands with soap.'",
    }),
    translateStep({
      id: "ja-m20-7-2-translate-2",
      promptEn: "Because I'm sick, I'll rest today.",
      acceptedAnswers: [
        "びょうきなので きょうは やすみます",
        "びょうきなので きょうは やすみます。",
        "びょうきなので、きょうは やすみます",
        "びょうきなので、きょうは やすみます。",
      ],
      audioText: "びょうきなので きょうは やすみます",
    }),
    sentenceMcq({
      id: "ja-m20-7-2-mcq-2",
      prompt: "Which means 'I wear glasses because my eyes are bad.'?",
      correctKana: "めが わるいので、めがねを かけています。",
      distractorsKana: [
        "めが いたいので、めがねを かけています。",
        "めが わるいから、めがねを かけています。",
        "めが わるいので、めがねが あります。",
      ],
      explanation: "めがわるい (bad eyes) + ので (because) + めがねをかけている (wearing glasses). ので for objective reason.",
    }),
    build(
      "ja-m20-7-2-build-4",
      "Say: Please brush your teeth.",
      "はを みがいてください",
      ["あらって", "のんで", "は", "を", "ください", "みがいて"],
      ["は", "を", "みがいて", "ください"],
    ),
    selfExplain({
      id: "ja-m20-7-2-self-explain",
      anchorLabel: "M20 — the complete health toolkit",
      anchorAudioText: "あたまが いたいので くすりを のんで やすみます",
      question: "What can you do with M20's three core patterns?",
      rule: { text: "1) Name a body part. 2) Report pain with がいたい. 3) Give reasons with ので. Combined: [part]がいたいので、[action] — for clinics, calling in sick, describing health." },
      surface: { text: "M20 only covers vocabulary — you need separate grammar modules for sentences." },
      distractor: { text: "ので replaces から completely — never use から again." },
      ruleExplanation:
        "M20's three systems stack: vocabulary (body parts/health) + がいたい (describing symptoms) + ので (giving reasons). から is still valid for casual/personal reasons.",
    }),
    speaking(
      "ja-m20-7-2-speak-3",
      "びょうきなので ゆっくり ねます",
      "Because I'm sick, I'll sleep in (rest well).",
    ),
    // ── Review tail ──
    speaking("ja-m20-7-2-rev-speak-1", M20_7_2_REVIEW[0].kana, M20_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m20-7-2-rev-lc-1",
      audioText: "よる ほんを よみます",
      correctMeaningEn: "I read books at night.",
      distractorsEn: [
        "I read books in the morning.",
        "I write letters at night.",
        "I watch TV at night.",
      ],
      exercisedAtomKanas: ["よみます"],
    }),
    vocabMcq("ja-m20-7-2-rev-mcq-1", M20_7_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M20_REVIEW_POOL),
    speaking("ja-m20-7-2-rev-speak-2", M20_7_2_REVIEW[2].kana, M20_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-7-2-rev", M20_7_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M20_7_2.steps);
assertAnswerRotation(M20_7_2.steps, 1);
assertNoConsecutiveSame(M20_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M20_1_1.steps,
  ...M20_1_2.steps,
  ...M20_2_1.steps,
  ...M20_2_2.steps,
  ...M20_3_1.steps,
  ...M20_3_2.steps,
  ...M20_4_1.steps,
  ...M20_4_2.steps,
  ...M20_5_1.steps,
  ...M20_5_2.steps,
  ...M20_6_1.steps,
  ...M20_6_2.steps,
  ...M20_7_1.steps,
  ...M20_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M20_1_1, M20_1_2, M20_2_1, M20_2_2, M20_3_1, M20_3_2,
  M20_4_1, M20_4_2, M20_5_1, M20_5_2, M20_6_1, M20_6_2,
  M20_STORY, M20_7_1, M20_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
