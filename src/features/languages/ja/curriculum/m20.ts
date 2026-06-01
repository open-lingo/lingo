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

const M20_1_1_REVIEW = pickReviewAtoms("ja-m20-1-1-rev", M20_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m20-1-1-info-open",
      "Your head and face — six words",
      "あたま (head), かお (face), め (eyes), みみ (ears), はな (nose), くち (mouth). Name every part of your face in Japanese.",
    ),
    // ── あたま (head) ──
    build(
      "ja-m20-1-1-build-atama",
      "Pick the Japanese word for: head",
      "あたま",
      ["あたま", "かお", "め", "みみ"],
      ["あたま"],
    ),
    listeningCompSentence({
      id: "ja-m20-1-1-lc-atama",
      audioText: "あたま",
      correctMeaningEn: "head",
      distractorsEn: ["face", "eyes", "nose"],
    }),
    // ── かお (face) ──
    build(
      "ja-m20-1-1-build-kao",
      "Pick the Japanese word for: face",
      "かお",
      ["かお", "あたま", "くち", "みみ"],
      ["かお"],
    ),
    speaking("ja-m20-1-1-speak-kao", "かお", "Face"),
    // ── め (eyes) ──
    build(
      "ja-m20-1-1-build-me",
      "Pick the Japanese word for: eyes",
      "め",
      ["め", "みみ", "はな", "くち"],
      ["め"],
    ),
    listeningCompSentence({
      id: "ja-m20-1-1-lc-me",
      audioText: "め",
      correctMeaningEn: "eyes",
      distractorsEn: ["ears", "nose", "mouth"],
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
      ["め", "が", "おおきい", "です", "ちいさい", "みみ"],
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
      "め",
      " おおきいです。",
      "が",
      ["が", "は", "を", "の"],
      "My eyes are big.",
      "めが おおきいです。",
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
      "かおを あらいました",
      "I washed my face.",
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
    infoStep(
      "ja-m20-1-1-info-end",
      "You can name every part of your head and face in Japanese",
      "あたま, かお, め, みみ, はな, くち — six words for describing what you see in the mirror.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_1_1.steps);
assertAnswerRotation(M20_1_1.steps, 1);
assertNoConsecutiveSame(M20_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-1-2 — "Body" vocab (は teeth, て, あし, おなか, せなか, ゆび, かみ hair)
// ═══════════════════════════════════════════════════════════════════════

const M20_1_2_REVIEW = pickReviewAtoms("ja-m20-1-2-rev", M20_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m20-1-2-info-open",
      "Head to toe — seven more",
      "は (teeth), て (hands), あし (feet/legs), おなか (stomach), せなか (back), ゆび (fingers), かみ (hair).",
    ),
    // ── は (teeth) ──
    build(
      "ja-m20-1-2-build-ha",
      "Pick the Japanese word for: teeth",
      "は",
      ["は", "て", "め", "くち"],
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
      ["て", "あし", "ゆび", "は"],
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
      audioText: "あし",
      correctMeaningEn: "foot / leg",
      distractorsEn: ["hand", "finger", "back"],
    }),
    // ── おなか (stomach) ──
    build(
      "ja-m20-1-2-build-onaka",
      "Pick the Japanese word for: stomach",
      "おなか",
      ["おなか", "せなか", "あたま", "かお"],
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
      ["せなか", "おなか", "あし", "あたま"],
      ["せなか"],
    ),
    speaking("ja-m20-1-2-speak-senaka", "せなか", "Back"),
    // ── ゆび (fingers) ──
    build(
      "ja-m20-1-2-build-yubi",
      "Pick the Japanese word for: finger(s)",
      "ゆび",
      ["ゆび", "て", "あし", "は"],
      ["ゆび"],
    ),
    listeningCompSentence({
      id: "ja-m20-1-2-lc-yubi",
      audioText: "ゆび",
      correctMeaningEn: "finger",
      distractorsEn: ["hand", "toe", "teeth"],
    }),
    // ── かみ (hair) ──
    build(
      "ja-m20-1-2-build-kami",
      "Pick the Japanese word for: hair",
      "かみ",
      ["かみ", "かお", "あたま", "め"],
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
      ["まいあさ", "は", "を", "みがきます", "あし", "あらいます"],
      ["まいあさ", "は", "を", "みがきます"],
    ),
    selfExplain({
      id: "ja-m20-1-2-self-explain",
      anchorLabel: "は as 'teeth' vs は as topic marker",
      anchorAudioText: "はを みがきます",
      question: "How do you tell apart は (teeth) from は (topic marker)?",
      rule: { text: "Context and position: は (teeth/歯) appears as a noun (はを みがく = brush teeth). は (topic marker) appears after a noun as a particle. In writing, kanji disambiguates: 歯 = teeth." },
      surface: { text: "They are pronounced differently — teeth は is 'ha' and the particle is 'wa.'" },
      distractor: { text: "は always means teeth; the topic marker is spelled differently." },
      ruleExplanation:
        "Good catch! The particle は is pronounced 'wa' but written は. The noun は (teeth) is pronounced 'ha.' So they differ in pronunciation, not spelling.",
    }),
    speaking(
      "ja-m20-1-2-speak-sentence",
      "てを あらいます",
      "I wash my hands.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m20-1-2-rev-mcq-1", M20_1_2_REVIEW[0], M20_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m20-1-2-rev-lc-1",
      audioText: M20_1_2_REVIEW[1].kana,
      correctMeaningEn: M20_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_1_2_REVIEW[2].meaningEn,
        M20_1_2_REVIEW[3].meaningEn,
        M20_REVIEW_POOL[1].meaningEn,
      ],
    }),
    speaking("ja-m20-1-2-rev-speak-1", M20_1_2_REVIEW[2].kana, M20_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-1-2-rev", M20_1_2_REVIEW),
    infoStep(
      "ja-m20-1-2-info-end",
      "You can name body parts from head to toe",
      "は, て, あし, おなか, せなか, ゆび, かみ. Thirteen body words total across two lessons.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_1_2.steps);
assertAnswerRotation(M20_1_2.steps, 1);
assertNoConsecutiveSame(M20_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-2-1 — "It hurts" (〜がいたい) intro
// ═══════════════════════════════════════════════════════════════════════

const M20_2_1_REVIEW = pickReviewAtoms("ja-m20-2-1-rev", M20_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m20-2-1-info-open",
      "Ouch — saying what hurts",
      "[Body part] + がいたいです = 'My [body part] hurts.' The single most useful pattern at a Japanese clinic.",
    ),
    RULE_GA_ITAI,
    // ── あたまがいたい (headache) ──
    build(
      "ja-m20-2-1-build-atama-itai",
      "Say: My head hurts.",
      "あたまが いたいです",
      ["あたま", "が", "いたい", "です", "は", "おなか"],
      ["あたま", "が", "いたい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m20-2-1-lc-atama-itai",
      audioText: "あたまが いたいです",
      correctMeaningEn: "My head hurts.",
      distractorsEn: [
        "My stomach hurts.",
        "My head is big.",
        "My head is fine.",
      ],
    }),
    // ── おなかがいたい (stomachache) ──
    build(
      "ja-m20-2-1-build-onaka-itai",
      "Say: My stomach hurts.",
      "おなかが いたいです",
      ["おなか", "が", "いたい", "です", "あたま", "せなか"],
      ["おなか", "が", "いたい", "です"],
    ),
    speaking("ja-m20-2-1-speak-onaka", "おなかが いたいです", "My stomach hurts."),
    // ── はがいたい (toothache) ──
    build(
      "ja-m20-2-1-build-ha-itai",
      "Say: My teeth hurt.",
      "はが いたいです",
      ["は", "が", "いたい", "です", "くち", "め"],
      ["は", "が", "いたい", "です"],
    ),
    sentenceMcq({
      id: "ja-m20-2-1-mcq-ha-itai",
      prompt: "Which means 'I have a toothache'?",
      correctKana: "はが いたいです。",
      distractorsKana: [
        "はを いたいです。",
        "くちが いたいです。",
        "はが おおきいです。",
      ],
      explanation: "は = teeth. が marks the body part. いたい = hurts.",
    }),
    // ── More body pain patterns ──
    cloze(
      "ja-m20-2-1-cloze-ga-1",
      "あし",
      " いたいです。",
      "が",
      ["が", "は", "を", "の"],
      "My feet hurt.",
      "あしが いたいです。",
      "が marks the body part that hurts.",
    ),
    listeningBuildSentence({
      id: "ja-m20-2-1-lb-atama",
      target: "あたまが いたいです",
      tiles: ["あたま", "が", "いたい", "です", "おなか", "は"],
      correctOrder: ["あたま", "が", "いたい", "です"],
      promptEn: "Hear it, build it: 'My head hurts.'",
    }),
    sentenceMcq({
      id: "ja-m20-2-1-mcq-senaka",
      prompt: "Which means 'My back hurts.'?",
      correctKana: "せなかが いたいです。",
      distractorsKana: [
        "おなかが いたいです。",
        "せなかは いたいです。",
        "せなかを いたいです。",
      ],
      explanation: "せなか = back. が + いたい is the standard pain pattern.",
    }),
    build(
      "ja-m20-2-1-build-me-itai",
      "Say: My eyes hurt.",
      "めが いたいです",
      ["め", "が", "いたい", "です", "みみ", "あたま"],
      ["め", "が", "いたい", "です"],
    ),
    cloze(
      "ja-m20-2-1-cloze-ga-2",
      "ゆび",
      " いたいです。",
      "が",
      ["が", "は", "を", "に"],
      "My finger hurts.",
      "ゆびが いたいです。",
      "が marks the hurting body part.",
    ),
    listeningCompSentence({
      id: "ja-m20-2-1-lc-onaka-itai",
      audioText: "おなかが いたいです",
      correctMeaningEn: "My stomach hurts.",
      distractorsEn: [
        "I'm hungry.",
        "My back hurts.",
        "My stomach is full.",
      ],
    }),
    selfExplain({
      id: "ja-m20-2-1-self-explain",
      anchorLabel: "が in pain expressions",
      anchorAudioText: "あたまが いたいです",
      question: "Why が instead of は for 'my head hurts'?",
      rule: { text: "When reporting a symptom (new information), が identifies WHAT hurts. は would imply contrast ('my head, unlike other parts'). が is the default for pain reports." },
      surface: { text: "が sounds more polite than は when talking to a doctor." },
      distractor: { text: "が is used for pain but は is used for other sensations like cold or hot." },
      ruleExplanation:
        "This is the new-information use of が. When someone asks 'what's wrong?' and you answer 'my head hurts,' the head is new information → が.",
    }),
    speaking(
      "ja-m20-2-1-speak-sentence",
      "はが いたいです",
      "My teeth hurt.",
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
    infoStep(
      "ja-m20-2-1-info-end",
      "You can tell a doctor exactly what hurts",
      "[Body part]がいたいです — head, stomach, teeth, back, eyes, fingers. The clinic phrase you'll actually use.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_2_1.steps);
assertAnswerRotation(M20_2_1.steps, 1);
assertNoConsecutiveSame(M20_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-2-2 — Pain drill + medical context
// ═══════════════════════════════════════════════════════════════════════

const M20_2_2_REVIEW = pickReviewAtoms("ja-m20-2-2-rev", M20_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m20-2-2-info-open",
      "At the clinic",
      "Pain patterns plus four medical words: sick, medicine, doctor, fever. Essential health vocabulary.",
    ),
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
      ["びょうき", "です", "げんき", "いたい"],
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
      ["いしゃ", "せんせい", "びょうき", "くすり"],
      ["いしゃ"],
    ),
    speaking("ja-m20-2-2-speak-isha", "いしゃ", "Doctor"),
    // ── ねつ (fever) ──
    build(
      "ja-m20-2-2-build-netsu",
      "Pick the Japanese word for: fever",
      "ねつ",
      ["ねつ", "かぜ", "びょうき", "くすり"],
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
    // ── Medical context drills ──
    cloze(
      "ja-m20-2-2-cloze-wo",
      "くすり",
      " のみます。",
      "を",
      ["を", "が", "は", "に"],
      "I take medicine.",
      "くすりを のみます。",
      "を marks the direct object — medicine is what you take.",
    ),
    build(
      "ja-m20-2-2-build-isha-ni",
      "Say: I go to the doctor.",
      "いしゃに いきます",
      ["いしゃ", "に", "いきます", "を", "びょういん", "で"],
      ["いしゃ", "に", "いきます"],
    ),
    listeningBuildSentence({
      id: "ja-m20-2-2-lb-kusuri",
      target: "くすりを のみます",
      tiles: ["くすり", "を", "のみます", "が", "あります", "いしゃ"],
      correctOrder: ["くすり", "を", "のみます"],
      promptEn: "Hear it, build it: 'I take medicine.'",
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
    cloze(
      "ja-m20-2-2-cloze-ga",
      "ねつ",
      " あります。",
      "が",
      ["が", "は", "を", "に"],
      "I have a fever.",
      "ねつが あります。",
      "が marks the subject with あります — 'a fever exists.'",
    ),
    translateStep({
      id: "ja-m20-2-2-translate",
      promptEn: "My head hurts.",
      acceptedAnswers: [
        "あたまが いたいです",
        "あたまが いたいです。",
        "あたまがいたいです",
        "あたまがいたいです。",
      ],
      audioText: "あたまが いたいです",
    }),
    selfExplain({
      id: "ja-m20-2-2-self-explain",
      anchorLabel: "Medical vocabulary patterns",
      anchorAudioText: "くすりを のみます",
      question: "Why を for くすり but が for ねつ?",
      rule: { text: "くすりを のみます: medicine is what you actively take (direct object → を). ねつが あります: a fever exists/is present (subject of existence → が). Different verbs call for different particles." },
      surface: { text: "を is used for medicine because medicine is liquid (you 'drink' it)." },
      distractor: { text: "が is only for pain expressions; ねつ uses が because fever hurts." },
      ruleExplanation:
        "The particle depends on the verb: のむ (take/drink) takes an object (を), あります (exists) takes a subject (が). This is a general Japanese grammar rule, not specific to medical vocab.",
    }),
    speaking(
      "ja-m20-2-2-speak-sentence",
      "ねつが あります",
      "I have a fever.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m20-2-2-rev-mcq-1", M20_2_2_REVIEW[0], M20_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m20-2-2-rev-lc-1",
      audioText: M20_2_2_REVIEW[1].kana,
      correctMeaningEn: M20_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_2_2_REVIEW[2].meaningEn,
        M20_2_2_REVIEW[3].meaningEn,
        M20_REVIEW_POOL[3].meaningEn,
      ],
    }),
    speaking("ja-m20-2-2-rev-speak-1", M20_2_2_REVIEW[2].kana, M20_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-2-2-rev", M20_2_2_REVIEW),
    infoStep(
      "ja-m20-2-2-info-end",
      "You can describe symptoms and talk to a doctor",
      "[Body part]がいたい + びょうき, くすり, いしゃ, ねつ. Real clinic vocabulary.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_2_2.steps);
assertAnswerRotation(M20_2_2.steps, 1);
assertNoConsecutiveSame(M20_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-3-1 — More health vocab (かぜ, せっけん, タオル, めがね)
// ═══════════════════════════════════════════════════════════════════════

const M20_3_1_REVIEW = pickReviewAtoms("ja-m20-3-1-rev", M20_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m20-3-1-info-open",
      "Colds, soap, towels, and glasses",
      "Four everyday health and hygiene words. かぜ (a cold), せっけん (soap), タオル (towel), めがね (glasses).",
    ),
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
      ["かぜ", "を", "ひきました", "が", "あります", "びょうき"],
      ["かぜ", "を", "ひきました"],
    ),
    listeningCompSentence({
      id: "ja-m20-3-1-lc-kaze",
      audioText: "かぜを ひきました",
      correctMeaningEn: "I caught a cold.",
      distractorsEn: [
        "I have a fever.",
        "I'm sick.",
        "The wind is blowing.",
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
      ["タオル", "せっけん", "くすり", "めがね"],
      ["タオル"],
    ),
    listeningCompSentence({
      id: "ja-m20-3-1-lc-taoru",
      audioText: "タオル",
      correctMeaningEn: "towel",
      distractorsEn: ["soap", "medicine", "glasses"],
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
      ["タオル", "で", "て", "を", "ふきます", "あらいます", "せっけん"],
      ["タオル", "で", "て", "を", "ふきます"],
    ),
    listeningBuildSentence({
      id: "ja-m20-3-1-lb-kaze",
      target: "かぜを ひきました",
      tiles: ["かぜ", "を", "ひきました", "が", "あります", "ねつ"],
      correctOrder: ["かぜ", "を", "ひきました"],
      promptEn: "Hear it, build it: 'I caught a cold.'",
    }),
    cloze(
      "ja-m20-3-1-cloze-wo",
      "めがね",
      " かけています。",
      "を",
      ["を", "が", "は", "で"],
      "I wear glasses.",
      "めがねを かけています。",
      "を marks the direct object — glasses are what you put on.",
    ),
    selfExplain({
      id: "ja-m20-3-1-self-explain",
      anchorLabel: "かぜをひく — a fixed phrase",
      anchorAudioText: "かぜを ひきました",
      question: "Why を with かぜ (a cold)?",
      rule: { text: "かぜをひく is a set phrase — 'to catch a cold.' Even though a cold isn't something you physically grab, Japanese treats it as a direct object with を. You must memorize this as a fixed expression." },
      surface: { text: "を is used because かぜ is a thing you can touch." },
      distractor: { text: "が would also be correct — かぜがひく means the same thing." },
      ruleExplanation:
        "Many languages have set phrases for illness that don't follow literal logic. English 'catch a cold,' Japanese かぜをひく. Just memorize the pattern.",
    }),
    speaking(
      "ja-m20-3-1-speak-sentence",
      "せっけんで てを あらいます",
      "I wash my hands with soap.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m20-3-1-rev-mcq-1", M20_3_1_REVIEW[0], M20_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m20-3-1-rev-lc-1",
      audioText: M20_3_1_REVIEW[1].kana,
      correctMeaningEn: M20_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_3_1_REVIEW[2].meaningEn,
        M20_3_1_REVIEW[3].meaningEn,
        M20_REVIEW_POOL[4].meaningEn,
      ],
    }),
    speaking("ja-m20-3-1-rev-speak-1", M20_3_1_REVIEW[2].kana, M20_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-3-1-rev", M20_3_1_REVIEW),
    infoStep(
      "ja-m20-3-1-info-end",
      "You can talk about colds, hygiene, and everyday health items",
      "かぜ, せっけん, タオル, めがね. The practical vocabulary of daily health care.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_3_1.steps);
assertAnswerRotation(M20_3_1.steps, 1);
assertNoConsecutiveSame(M20_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-3-2 — Body & health mixed drill
// ═══════════════════════════════════════════════════════════════════════

const M20_3_2_REVIEW = pickReviewAtoms("ja-m20-3-2-rev", M20_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m20-3-2-info-open",
      "Everything so far — body meets health",
      "Body parts + pain + medical words + hygiene. Can you combine them all?",
    ),
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
    cloze(
      "ja-m20-3-2-cloze-ga-1",
      "あし",
      " いたいです。",
      "が",
      ["が", "は", "を", "に"],
      "My feet hurt.",
      "あしが いたいです。",
      "が marks the body part that hurts.",
    ),
    build(
      "ja-m20-3-2-build-1",
      "Say: I wash my face with soap.",
      "せっけんで かおを あらいます",
      ["せっけん", "で", "かお", "を", "あらいます", "て", "に"],
      ["せっけん", "で", "かお", "を", "あらいます"],
    ),
    listeningCompSentence({
      id: "ja-m20-3-2-lc-1",
      audioText: "みみが いたいです",
      correctMeaningEn: "My ear hurts.",
      distractorsEn: [
        "My eye hurts.",
        "My ear is big.",
        "I can't hear.",
      ],
    }),
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
    cloze(
      "ja-m20-3-2-cloze-de",
      "タオル",
      " かおを ふきます。",
      "で",
      ["で", "を", "が", "に"],
      "I dry my face with a towel.",
      "タオルで かおを ふきます。",
      "で marks the tool/means.",
    ),
    build(
      "ja-m20-3-2-build-2",
      "Say: I brush my teeth every night.",
      "まいばん はを みがきます",
      ["まいばん", "は", "を", "みがきます", "まいあさ", "あらいます"],
      ["まいばん", "は", "を", "みがきます"],
    ),
    listeningBuildSentence({
      id: "ja-m20-3-2-lb-1",
      target: "いしゃに いきます",
      tiles: ["いしゃ", "に", "いきます", "を", "で", "びょうき"],
      correctOrder: ["いしゃ", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to the doctor.'",
    }),
    cloze(
      "ja-m20-3-2-cloze-wo",
      "くすり",
      " のみました。",
      "を",
      ["を", "が", "は", "で"],
      "I took medicine.",
      "くすりを のみました。",
      "を marks the direct object.",
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
      ["かぜ", "を", "ひきました", "ねつ", "が", "あります", "びょうき"],
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
      anchorAudioText: "かぜを ひきました",
      question: "What particle goes with かぜ when saying 'caught a cold'?",
      rule: { text: "かぜをひく is a set phrase — を marks かぜ as the object of ひく (to catch/pull). This is fixed; don't substitute が or は." },
      surface: { text: "Any particle works — かぜがひく and かぜをひく are both correct." },
      distractor: { text: "が is correct because the cold is what hurts you." },
      ruleExplanation:
        "Set phrases have fixed particle assignments. かぜをひく = catch a cold. ねつがある = have a fever. Memorize them as units.",
    }),
    speaking(
      "ja-m20-3-2-speak",
      "ねつが あります",
      "I have a fever.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m20-3-2-rev-mcq-1", M20_3_2_REVIEW[0], M20_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m20-3-2-rev-lc-1",
      audioText: M20_3_2_REVIEW[1].kana,
      correctMeaningEn: M20_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_3_2_REVIEW[2].meaningEn,
        M20_3_2_REVIEW[3].meaningEn,
        M20_REVIEW_POOL[5].meaningEn,
      ],
    }),
    speaking("ja-m20-3-2-rev-speak-1", M20_3_2_REVIEW[2].kana, M20_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-3-2-rev", M20_3_2_REVIEW),
    infoStep(
      "ja-m20-3-2-info-end",
      "You can describe symptoms, talk about hygiene, and navigate basic health situations",
      "Body parts, pain patterns, medical vocabulary, and hygiene — all combined.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_3_2.steps);
assertAnswerRotation(M20_3_2.steps, 1);
assertNoConsecutiveSame(M20_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-4-1 — ので intro (because, softer than から)
// ═══════════════════════════════════════════════════════════════════════

const M20_4_1_REVIEW = pickReviewAtoms("ja-m20-4-1-rev", M20_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m20-4-1-info-open",
      "A softer way to say 'because'",
      "You already know から (M13). Now meet ので — same meaning, but softer and more formal. Perfect for explaining symptoms to a doctor.",
    ),
    RULE_NODE,
    // ── い-adjective + ので ──
    build(
      "ja-m20-4-1-build-itai-node",
      "Say: Because my head hurts, I'll take medicine.",
      "あたまが いたいので くすりを のみます",
      ["あたま", "が", "いたい", "ので", "くすり", "を", "のみます", "から"],
      ["あたま", "が", "いたい", "ので", "くすり", "を", "のみます"],
    ),
    listeningCompSentence({
      id: "ja-m20-4-1-lc-itai-node",
      audioText: "あたまが いたいので くすりを のみます",
      correctMeaningEn: "Because my head hurts, I'll take medicine.",
      distractorsEn: [
        "My head hurts and I have medicine.",
        "I take medicine, so my head hurts.",
        "Because I take medicine, my head hurts.",
      ],
    }),
    // ── Noun + なので ──
    build(
      "ja-m20-4-1-build-byouki-nanode",
      "Say: Because I'm sick, I won't go to school.",
      "びょうきなので がっこうに いきません",
      ["びょうき", "なので", "がっこう", "に", "いきません", "から", "います"],
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
      ["ねつ", "が", "ある", "ので", "きょう", "は", "やすみます", "から"],
      ["ねつ", "が", "ある", "ので", "きょう", "は", "やすみます"],
    ),
    speaking(
      "ja-m20-4-1-speak-aru-node",
      "ねつが あるので きょうは やすみます",
      "Because I have a fever, I'll rest today.",
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
      target: "あたまが いたいので くすりを のみます",
      tiles: ["あたま", "が", "いたい", "ので", "くすり", "を", "のみます", "から"],
      correctOrder: ["あたま", "が", "いたい", "ので", "くすり", "を", "のみます"],
      promptEn: "Hear it, build it: 'Because my head hurts, I'll take medicine.'",
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
      "、がっこうに いきません。",
      "なので",
      ["なので", "ので", "から", "だから"],
      "Because I'm sick, I won't go to school.",
      "びょうきなので、がっこうに いきません。",
      "Nouns need な before ので.",
    ),
    build(
      "ja-m20-4-1-build-kaze-node",
      "Say: Because I caught a cold, I'll go to the doctor.",
      "かぜを ひいたので いしゃに いきます",
      ["かぜ", "を", "ひいた", "ので", "いしゃ", "に", "いきます", "から"],
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
      "びょうきなので がっこうに いきません",
      "Because I'm sick, I won't go to school.",
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
    infoStep(
      "ja-m20-4-1-info-end",
      "You can explain medical reasons softly with ので",
      "あたまがいたいので… びょうきなので… ねつがあるので… The polite 'because' for real situations.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_4_1.steps);
assertAnswerRotation(M20_4_1.steps, 1);
assertNoConsecutiveSame(M20_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-4-2 — ので vs から contrast drill
// ═══════════════════════════════════════════════════════════════════════

const M20_4_2_REVIEW = pickReviewAtoms("ja-m20-4-2-rev", M20_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m20-4-2-info-open",
      "Two ways to say 'because' — when each fits best",
      "ので and から both mean 'because.' ので = natural consequence (softer). から = personal reason (more direct). Let's drill the difference.",
    ),
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
      ["つかれた", "から", "やすみます", "ので", "です"],
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
      ["おなか", "が", "いたい", "ので", "たべません", "から", "のみません"],
      ["おなか", "が", "いたい", "ので", "たべません"],
    ),
    listeningBuildSentence({
      id: "ja-m20-4-2-lb-kara",
      target: "つかれたから やすみます",
      tiles: ["つかれた", "から", "やすみます", "ので", "です", "ません"],
      correctOrder: ["つかれた", "から", "やすみます"],
      promptEn: "Hear it, build it: 'I'll rest because I'm tired.'",
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
      rule: { text: "Use ので in polite/formal situations (with bosses, doctors, strangers) and when the reason is an objective fact. Use から in casual speech and when stating personal desires or opinions." },
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
      audioText: M20_4_2_REVIEW[1].kana,
      correctMeaningEn: M20_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_4_2_REVIEW[2].meaningEn,
        M20_4_2_REVIEW[3].meaningEn,
        M20_REVIEW_POOL[7].meaningEn,
      ],
    }),
    speaking("ja-m20-4-2-rev-speak-1", M20_4_2_REVIEW[2].kana, M20_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-4-2-rev", M20_4_2_REVIEW),
    infoStep(
      "ja-m20-4-2-info-end",
      "You can choose between ので and から depending on the situation",
      "ので for polite/objective reasons. から for casual/personal reasons. Both mean 'because' — the nuance is in tone.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_4_2.steps);
assertAnswerRotation(M20_4_2.steps, 1);
assertNoConsecutiveSame(M20_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-5-1 — Interleaved drill (body + がいたい + ので)
// ═══════════════════════════════════════════════════════════════════════

const M20_5_1_REVIEW = pickReviewAtoms("ja-m20-5-1-rev", M20_REVIEW_POOL, 5);

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
    infoStep(
      "ja-m20-5-1-info-open",
      "Everything combined",
      "Body parts + pain + ので — every sentence requires combining what you've learned. Describe symptoms and give reasons.",
    ),
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
      ["ねつ", "が", "ある", "ので", "いしゃ", "に", "いきます", "から"],
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
    cloze(
      "ja-m20-5-1-cloze-ga",
      "みみ",
      " いたいです。",
      "が",
      ["が", "は", "を", "に"],
      "My ear hurts.",
      "みみが いたいです。",
      "が marks the body part that hurts.",
    ),
    build(
      "ja-m20-5-1-build-2",
      "Say: I wash my hands with soap because of my cold.",
      "かぜなので せっけんで てを あらいます",
      ["かぜ", "なので", "せっけん", "で", "て", "を", "あらいます", "から"],
      ["かぜ", "なので", "せっけん", "で", "て", "を", "あらいます"],
    ),
    listeningBuildSentence({
      id: "ja-m20-5-1-lb-1",
      target: "おなかが いたいので なにも たべません",
      tiles: ["おなか", "が", "いたい", "ので", "なにも", "たべません", "から", "のみません"],
      correctOrder: ["おなか", "が", "いたい", "ので", "なにも", "たべません"],
      promptEn: "Hear it, build it: 'Because my stomach hurts, I won't eat anything.'",
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
      "びょうき",
      "、きょうは やすみます。",
      "なので",
      ["なので", "ので", "から", "だから"],
      "Because I'm sick, I'll rest today.",
      "びょうきなので、きょうは やすみます。",
      "Noun + なので.",
    ),
    build(
      "ja-m20-5-1-build-3",
      "Say: I dry my face with a towel.",
      "タオルで かおを ふきます",
      ["タオル", "で", "かお", "を", "ふきます", "あらいます", "せっけん"],
      ["タオル", "で", "かお", "を", "ふきます"],
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
      rule: { text: "かぜ is a noun → needs な before ので. いたい is an い-adjective → connects directly to ので. The な bridges nouns and な-adjectives to ので." },
      surface: { text: "It depends on the length of the word — short words use なので." },
      distractor: { text: "なので is for medical nouns; ので is for everything else." },
      ruleExplanation:
        "The rule is grammatical category: nouns/な-adj + なので, い-adj/verbs + ので. Nothing to do with the word's meaning or length.",
    }),
    speaking(
      "ja-m20-5-1-speak",
      "ねつが あるので いしゃに いきます",
      "Because I have a fever, I'll go to the doctor.",
    ),
    // ── Review tail ──
    speaking("ja-m20-5-1-rev-speak-1", M20_5_1_REVIEW[0].kana, M20_5_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m20-5-1-rev-lc-1",
      audioText: M20_5_1_REVIEW[1].kana,
      correctMeaningEn: M20_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_5_1_REVIEW[2].meaningEn,
        M20_5_1_REVIEW[3].meaningEn,
        M20_5_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m20-5-1-rev-mcq-1", M20_5_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M20_REVIEW_POOL),
    speaking("ja-m20-5-1-rev-speak-2", M20_5_1_REVIEW[2].kana, M20_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-5-1-rev", M20_5_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m20-5-1-info-end",
      "You can describe symptoms, give reasons, and navigate a medical situation",
      "Body parts + がいたい + ので — the three systems working together for real health communication.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_5_1.steps);
assertAnswerRotation(M20_5_1.steps, 1);
assertNoConsecutiveSame(M20_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-5-2 — Production (translate + speaking health scenarios)
// ═══════════════════════════════════════════════════════════════════════

const M20_5_2_REVIEW = pickReviewAtoms("ja-m20-5-2-rev", M20_REVIEW_POOL, 5);

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
    infoStep(
      "ja-m20-5-2-info-open",
      "Describe your health — from memory",
      "Build, translate, and speak: symptoms, reasons, medical requests. All from production.",
    ),
    // ── Production drills ──
    build(
      "ja-m20-5-2-build-1",
      "Say: Because my head hurts, I'll take medicine.",
      "あたまが いたいので くすりを のみます",
      ["あたま", "が", "いたい", "ので", "くすり", "を", "のみます", "から"],
      ["あたま", "が", "いたい", "ので", "くすり", "を", "のみます"],
    ),
    speaking(
      "ja-m20-5-2-speak-1",
      "あたまが いたいので くすりを のみます",
      "Because my head hurts, I'll take medicine.",
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
      ["まいにち", "せっけん", "で", "て", "を", "あらいます", "かお", "まいあさ"],
      ["まいにち", "せっけん", "で", "て", "を", "あらいます"],
    ),
    speaking(
      "ja-m20-5-2-speak-2",
      "まいにち せっけんで てを あらいます",
      "I wash my hands with soap every day.",
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
      ["は", "が", "いたい", "ので", "いしゃ", "に", "いきました", "から"],
      ["は", "が", "いたい", "ので", "いしゃ", "に", "いきました"],
    ),
    listeningBuildSentence({
      id: "ja-m20-5-2-lb-1",
      target: "びょうきなので やすみます",
      tiles: ["びょうき", "なので", "やすみます", "から", "いきます"],
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
      ["びょうき", "なので", "しごと", "に", "いきません", "から", "がっこう"],
      ["びょうき", "なので", "しごと", "に", "いきません"],
    ),
    speaking(
      "ja-m20-5-2-speak-3",
      "びょうきなので しごとに いきません",
      "Because I'm sick, I won't go to work.",
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
      ["かぜ", "を", "ひいた", "ので", "くすり", "を", "のんで", "やすみます", "から"],
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
      "かぜを ひいたので くすりを のんで やすみます",
      "Because I caught a cold, I take medicine and rest.",
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
    reviewMatchPairs("ja-m20-5-2-rev", M20_5_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m20-5-2-info-end",
      "You can produce complete health sentences from memory",
      "Symptoms + ので + actions. Real clinic communication in production.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_5_2.steps);
assertAnswerRotation(M20_5_2.steps, 1);
assertNoConsecutiveSame(M20_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-6-1 — Adjective review with body context
// ═══════════════════════════════════════════════════════════════════════

const M20_6_1_REVIEW = pickReviewAtoms("ja-m20-6-1-rev", M20_REVIEW_POOL, 5);

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
    infoStep(
      "ja-m20-6-1-info-open",
      "Adjectives meet body parts",
      "You already know い-adjectives (M8). Now use them with body parts: big hands, small eyes, hot forehead.",
    ),
    // ── Adjective + body drills ──
    build(
      "ja-m20-6-1-build-1",
      "Say: My hands are big.",
      "てが おおきいです",
      ["て", "が", "おおきい", "です", "ちいさい", "あし"],
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
    cloze(
      "ja-m20-6-1-cloze-ga-1",
      "はな",
      " たかいです。",
      "が",
      ["が", "は", "を", "の"],
      "My nose is tall/high (prominent).",
      "はなが たかいです。",
      "が marks the body part as the subject.",
    ),
    build(
      "ja-m20-6-1-build-2",
      "Say: My ears are small.",
      "みみが ちいさいです",
      ["みみ", "が", "ちいさい", "です", "おおきい", "め"],
      ["みみ", "が", "ちいさい", "です"],
    ),
    speaking(
      "ja-m20-6-1-speak-1",
      "てが おおきいです",
      "My hands are big.",
    ),
    sentenceMcq({
      id: "ja-m20-6-1-mcq-2",
      prompt: "Which means 'My forehead is hot' (as in fever)?",
      correctKana: "おでこが あついです。",
      distractorsKana: [
        "あたまが あついです。",
        "おでこが つめたいです。",
        "おでこが いたいです。",
      ],
      explanation: "おでこ = forehead. あつい = hot.",
    }),
    cloze(
      "ja-m20-6-1-cloze-ga-2",
      "あし",
      " ながいです。",
      "が",
      ["が", "は", "を", "に"],
      "My legs are long.",
      "あしが ながいです。",
      "が marks the body part.",
    ),
    build(
      "ja-m20-6-1-build-3",
      "Say: Because my eyes hurt, I can't read.",
      "めが いたいので ほんを よめません",
      ["め", "が", "いたい", "ので", "ほん", "を", "よめません", "から"],
      ["め", "が", "いたい", "ので", "ほん", "を", "よめません"],
    ),
    listeningBuildSentence({
      id: "ja-m20-6-1-lb-1",
      target: "かみが ながいです",
      tiles: ["かみ", "が", "ながい", "です", "みじかい", "は"],
      correctOrder: ["かみ", "が", "ながい", "です"],
      promptEn: "Hear it, build it: 'My hair is long.'",
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
      promptEn: "My hands are big.",
      acceptedAnswers: [
        "てが おおきいです",
        "てが おおきいです。",
        "てがおおきいです",
        "てがおおきいです。",
      ],
      audioText: "てが おおきいです",
    }),
    selfExplain({
      id: "ja-m20-6-1-self-explain",
      anchorLabel: "Adjectives + body parts",
      anchorAudioText: "めが ちいさいです",
      question: "When describing body parts, why が and not は?",
      rule: { text: "When describing a feature for the first time (new information), が identifies what has the quality. は would imply contrast or established topic. For simple descriptions, が is the neutral choice." },
      surface: { text: "が is only for pain — for size/shape you should use は." },
      distractor: { text: "が is used because body parts are small words." },
      ruleExplanation:
        "Same が-for-new-information principle as pain expressions. めがちいさい = 'it's the eyes that are small' (identifying the subject).",
    }),
    speaking(
      "ja-m20-6-1-speak-2",
      "めが いたいので ほんを よめません",
      "Because my eyes hurt, I can't read.",
    ),
    // ── Review tail ──
    speaking("ja-m20-6-1-rev-speak-1", M20_6_1_REVIEW[0].kana, M20_6_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m20-6-1-rev-lc-1",
      audioText: M20_6_1_REVIEW[1].kana,
      correctMeaningEn: M20_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_6_1_REVIEW[2].meaningEn,
        M20_6_1_REVIEW[3].meaningEn,
        M20_6_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m20-6-1-rev-mcq-1", M20_6_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M20_REVIEW_POOL),
    speaking("ja-m20-6-1-rev-speak-2", M20_6_1_REVIEW[2].kana, M20_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-6-1-rev", M20_6_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m20-6-1-info-end",
      "You can describe body parts with adjectives and explain health reasons",
      "Big hands, small eyes, long hair + pain patterns + ので reasons. Your descriptive range just doubled.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_6_1.steps);
assertAnswerRotation(M20_6_1.steps, 1);
assertNoConsecutiveSame(M20_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-6-2 — Full production (body + health + ので)
// ═══════════════════════════════════════════════════════════════════════

const M20_6_2_REVIEW = pickReviewAtoms("ja-m20-6-2-rev", M20_REVIEW_POOL, 5);

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
    infoStep(
      "ja-m20-6-2-info-open",
      "Production sprint — everything from M20",
      "Every M20 pattern in production direction. Body parts, pain, reasons, health vocab, adjectives.",
    ),
    // ── Production drills ──
    build(
      "ja-m20-6-2-build-1",
      "Say: Because I caught a cold, I have a fever.",
      "かぜを ひいたので ねつが あります",
      ["かぜ", "を", "ひいた", "ので", "ねつ", "が", "あります", "から"],
      ["かぜ", "を", "ひいた", "ので", "ねつ", "が", "あります"],
    ),
    speaking(
      "ja-m20-6-2-speak-1",
      "かぜを ひいたので ねつが あります",
      "Because I caught a cold, I have a fever.",
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
      ["まいあさ", "かお", "を", "あらって", "は", "を", "みがきます", "て"],
      ["まいあさ", "かお", "を", "あらって", "は", "を", "みがきます"],
    ),
    speaking(
      "ja-m20-6-2-speak-2",
      "まいあさ かおを あらって はを みがきます",
      "Every morning I wash my face and brush my teeth.",
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
      ["せなか", "が", "いたい", "です", "くすり", "を", "ください", "おなか"],
      ["せなか", "が", "いたい", "です", "くすり", "を", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m20-6-2-lb-1",
      target: "めが いたいので めがねを かけません",
      tiles: ["め", "が", "いたい", "ので", "めがね", "を", "かけません", "から"],
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
      ["タオル", "で", "て", "を", "ふきます", "せっけん", "あらいます"],
      ["タオル", "で", "て", "を", "ふきます"],
    ),
    speaking(
      "ja-m20-6-2-speak-3",
      "せなかが いたいです",
      "My back hurts.",
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
      "Say: Because my teeth hurt, I went to the doctor.",
      "はが いたいので いしゃに いきました",
      ["は", "が", "いたい", "ので", "いしゃ", "に", "いきました", "から"],
      ["は", "が", "いたい", "ので", "いしゃ", "に", "いきました"],
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
      rule: { text: "1) Body part vocabulary (13+ words). 2) 〜がいたい for pain. 3) ので for giving softer reasons. 4) Health/medical vocab. 5) Adjective review with body context. All combine into clinic-ready sentences." },
      surface: { text: "M20 only taught body vocabulary — no grammar." },
      distractor: { text: "M20 taught ので as a replacement for から — never use から again." },
      ruleExplanation:
        "M20 weaves body vocabulary with the がいたい pain pattern and the ので reason connector. から is still valid — ので is an addition, not a replacement.",
    }),
    speaking(
      "ja-m20-6-2-speak-4",
      "はが いたいので いしゃに いきました",
      "Because my teeth hurt, I went to the doctor.",
    ),
    // ── Review tail ──
    speaking("ja-m20-6-2-rev-speak-1", M20_6_2_REVIEW[0].kana, M20_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m20-6-2-rev-lc-1",
      audioText: M20_6_2_REVIEW[1].kana,
      correctMeaningEn: M20_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_6_2_REVIEW[2].meaningEn,
        M20_6_2_REVIEW[3].meaningEn,
        M20_6_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m20-6-2-rev-mcq-1", M20_6_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M20_REVIEW_POOL),
    speaking("ja-m20-6-2-rev-speak-2", M20_6_2_REVIEW[2].kana, M20_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-6-2-rev", M20_6_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m20-6-2-info-end",
      "You can produce every M20 pattern from memory",
      "Body parts, pain, reasons, medical vocab, adjectives — all in production. A complete health communication toolkit.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_6_2.steps);
assertAnswerRotation(M20_6_2.steps, 1);
assertNoConsecutiveSame(M20_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-STORY — Visiting a doctor, describing symptoms
// ═══════════════════════════════════════════════════════════════════════

export const M20_STORY: LessonContent = {
  id: "ja-m20-story",
  moduleId: "m20",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Visiting the doctor",
  description:
    "Listen to a patient visit a doctor, describe symptoms, and receive advice. Answer questions and practice key patterns.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m20-story-info-open",
      "Story time — At the clinic",
      "たけし isn't feeling well. He visits a clinic and describes his symptoms to the doctor.",
    ),
    dialogueListen({
      id: "ja-m20-story-scene-1",
      lines: [
        { speaker: "いしゃ", kana: "どうしましたか。" },
        { speaker: "たけし", kana: "あたまが いたいです。ねつも あります。" },
        { speaker: "いしゃ", kana: "いつからですか。" },
        { speaker: "たけし", kana: "きのうからです。かぜを ひいたと おもいます。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "What are たけし's symptoms?",
          correctText: "Headache and fever.",
          distractors: ["Stomachache and fever.", "Headache only.", "Toothache and cold."],
          explanation: "あたまがいたい = headache. ねつもあります = also has a fever.",
        },
        {
          id: "s1-q2",
          prompt: "When did the symptoms start?",
          correctText: "Yesterday.",
          distractors: ["Today.", "Two days ago.", "Last week."],
          explanation: "きのうから = since yesterday.",
        },
      ],
    }),
    build(
      "ja-m20-story-build-1",
      "Say: My head hurts. I also have a fever.",
      "あたまが いたいです ねつも あります",
      ["あたま", "が", "いたい", "です", "ねつ", "も", "あります", "おなか"],
      ["あたま", "が", "いたい", "です", "ねつ", "も", "あります"],
    ),
    sentenceMcq({
      id: "ja-m20-story-mcq-1",
      prompt: "The doctor asked どうしましたか. What does this mean?",
      correctKana: "What happened? / What's wrong?",
      distractorsKana: [
        "What's your name?",
        "How old are you?",
        "Where does it hurt?",
      ],
      explanation: "どうしましたか = What happened? The standard doctor opening question.",
    }),
    dialogueListen({
      id: "ja-m20-story-scene-2",
      lines: [
        { speaker: "いしゃ", kana: "のどは いたいですか。" },
        { speaker: "たけし", kana: "はい、すこし いたいです。" },
        { speaker: "いしゃ", kana: "かぜですね。くすりを だしますので、のんでください。" },
        { speaker: "たけし", kana: "わかりました。ありがとうございます。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "What is the doctor's diagnosis?",
          correctText: "It's a cold.",
          distractors: ["It's the flu.", "It's a stomachache.", "He needs surgery."],
          explanation: "かぜですね = It's a cold.",
        },
        {
          id: "s2-q2",
          prompt: "What does the doctor tell たけし to do?",
          correctText: "Take the prescribed medicine.",
          distractors: ["Go home and sleep.", "Come back tomorrow.", "Drink lots of water."],
          explanation: "くすりをだしますので、のんでください = I'll prescribe medicine, so please take it.",
        },
      ],
    }),
    cloze(
      "ja-m20-story-cloze-1",
      "くすりを だします",
      "、のんでください。",
      "ので",
      ["ので", "から", "が", "は"],
      "I'll prescribe medicine, so please take it.",
      "くすりを だしますので、のんでください。",
      "ので connects the doctor's action (prescribing) to the instruction (take it).",
    ),
    listeningBuildSentence({
      id: "ja-m20-story-lb-1",
      target: "あたまが いたいです",
      tiles: ["あたま", "が", "いたい", "です", "おなか", "は"],
      correctOrder: ["あたま", "が", "いたい", "です"],
      promptEn: "Hear it, build it: 'My head hurts.'",
    }),
    listeningCompSentence({
      id: "ja-m20-story-lc-1",
      audioText: "くすりを のんでください",
      correctMeaningEn: "Please take medicine.",
      distractorsEn: [
        "Please buy medicine.",
        "I took medicine.",
        "I have medicine.",
      ],
    }),
    speaking(
      "ja-m20-story-speak-1",
      "あたまが いたいです ねつも あります",
      "My head hurts. I also have a fever.",
    ),
    sentenceMcq({
      id: "ja-m20-story-mcq-summary",
      prompt: "Which M20 patterns appeared in the story?",
      correctKana: "がいたい (pain), ので (reason), medical vocab (くすり, ねつ, かぜ)",
      distractorsKana: [
        "Only body parts vocabulary.",
        "Only ので grammar.",
        "Only adjective descriptions.",
      ],
      explanation: "The story combined pain expressions, ので reasons, and medical vocabulary — a complete clinic visit.",
    }),
    speaking(
      "ja-m20-story-speak-2",
      "かぜを ひきました",
      "I caught a cold.",
    ),
    infoStep(
      "ja-m20-story-info-end",
      "You followed a real doctor visit — in Japanese",
      "Symptoms, diagnosis, prescription — all in context. You can navigate a Japanese clinic.",
      "win",
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

const M20_7_1_REVIEW = pickReviewAtoms("ja-m20-7-1-rev", M20_REVIEW_POOL, 5);

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
    infoStep(
      "ja-m20-7-1-info-open",
      "At the pharmacy",
      "After the doctor, たけし goes to a pharmacy. Listen to him buy medicine and describe his symptoms.",
    ),
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
      ["かぜ", "の", "くすり", "は", "あります", "か", "が", "ください"],
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
    cloze(
      "ja-m20-7-1-cloze-no",
      "かぜ",
      " くすりは ありますか。",
      "の",
      ["の", "は", "が", "を"],
      "Do you have cold medicine?",
      "かぜの くすりは ありますか。",
      "の connects かぜ (cold) to くすり (medicine) — medicine FOR colds.",
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
      ["ねつ", "が", "ある", "ので", "くすり", "を", "のみます", "から"],
      ["ねつ", "が", "ある", "ので", "くすり", "を", "のみます"],
    ),
    speaking(
      "ja-m20-7-1-speak-1",
      "かぜの くすりは ありますか",
      "Do you have cold medicine?",
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
      tiles: ["ねつ", "が", "ある", "ので", "きょう", "は", "やすみます", "から"],
      correctOrder: ["ねつ", "が", "ある", "ので", "きょう", "は", "やすみます"],
      promptEn: "Hear it, build it: 'Because I have a fever, I'll rest today.'",
    }),
    cloze(
      "ja-m20-7-1-cloze-ga",
      "おなか",
      " いたいです。",
      "が",
      ["が", "は", "を", "に"],
      "My stomach hurts.",
      "おなかが いたいです。",
      "が marks the body part that hurts.",
    ),
    translateStep({
      id: "ja-m20-7-1-translate",
      promptEn: "Do you have cold medicine?",
      acceptedAnswers: [
        "かぜの くすりは ありますか",
        "かぜの くすりは ありますか。",
        "かぜのくすりはありますか",
        "かぜのくすりはありますか。",
      ],
      audioText: "かぜの くすりは ありますか",
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
      "ねつが あるので くすりを のみます",
      "Because I have a fever, I take medicine.",
    ),
    // ── Review tail ──
    speaking("ja-m20-7-1-rev-speak-1", M20_7_1_REVIEW[0].kana, M20_7_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m20-7-1-rev-lc-1",
      audioText: M20_7_1_REVIEW[1].kana,
      correctMeaningEn: M20_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_7_1_REVIEW[2].meaningEn,
        M20_7_1_REVIEW[3].meaningEn,
        M20_7_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m20-7-1-rev-mcq-1", M20_7_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M20_REVIEW_POOL),
    speaking("ja-m20-7-1-rev-speak-2", M20_7_1_REVIEW[2].kana, M20_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-7-1-rev", M20_7_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m20-7-1-info-end",
      "You can visit a pharmacy and ask for what you need in Japanese",
      "Describe symptoms, ask for medicine, understand dosage instructions. Real-world health communication.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M20_7_1.steps);
assertAnswerRotation(M20_7_1.steps, 1);
assertNoConsecutiveSame(M20_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M20-7-2 — Module wrap-up (all M20 patterns)
// ═══════════════════════════════════════════════════════════════════════

const M20_7_2_REVIEW = pickReviewAtoms("ja-m20-7-2-rev", M20_REVIEW_POOL, 5);

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
    infoStep(
      "ja-m20-7-2-info-open",
      "Final round — everything",
      "Every M20 pattern in one lesson. Body, pain, reasons, health, hygiene, adjectives.",
    ),
    // ── Production drills ──
    build(
      "ja-m20-7-2-build-1",
      "Say: Because my head hurts, I'll take medicine and rest.",
      "あたまが いたいので くすりを のんで やすみます",
      ["あたま", "が", "いたい", "ので", "くすり", "を", "のんで", "やすみます", "から"],
      ["あたま", "が", "いたい", "ので", "くすり", "を", "のんで", "やすみます"],
    ),
    speaking(
      "ja-m20-7-2-speak-1",
      "あたまが いたいので くすりを のんで やすみます",
      "Because my head hurts, I'll take medicine and rest.",
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
      "Say: I wash my hands with soap because of the cold.",
      "かぜなので せっけんで てを あらいます",
      ["かぜ", "なので", "せっけん", "で", "て", "を", "あらいます", "から"],
      ["かぜ", "なので", "せっけん", "で", "て", "を", "あらいます"],
    ),
    listeningCompSentence({
      id: "ja-m20-7-2-lc-1",
      audioText: "おなかが いたいので なにも たべません",
      correctMeaningEn: "Because my stomach hurts, I won't eat anything.",
      distractorsEn: [
        "My stomach is empty, so I'll eat.",
        "Because I ate, my stomach hurts.",
        "Because I'm not hungry, I won't eat.",
      ],
    }),
    build(
      "ja-m20-7-2-build-3",
      "Say: My hair is long and my eyes are big.",
      "かみが ながくて めが おおきいです",
      ["かみ", "が", "ながくて", "め", "が", "おおきい", "です", "ちいさい"],
      ["かみ", "が", "ながくて", "め", "が", "おおきい", "です"],
    ),
    speaking(
      "ja-m20-7-2-speak-2",
      "かぜなので せっけんで てを あらいます",
      "Because of the cold, I wash my hands with soap.",
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
      tiles: ["せっけん", "で", "て", "を", "あらいます", "タオル", "ふきます"],
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
      ["は", "を", "みがいて", "ください", "あらって", "のんで"],
      ["は", "を", "みがいて", "ください"],
    ),
    selfExplain({
      id: "ja-m20-7-2-self-explain",
      anchorLabel: "M20 — the complete health toolkit",
      anchorAudioText: "あたまが いたいので くすりを のんで やすみます",
      question: "What can you do with M20's three core patterns?",
      rule: { text: "1) Name any body part. 2) Report pain with がいたい. 3) Give soft reasons with ので. Combined: [body part]がいたいので、[action]. A complete pattern for clinic visits, calling in sick, and describing health." },
      surface: { text: "M20 only covers vocabulary — you need separate grammar modules for sentences." },
      distractor: { text: "ので replaces から completely — never use から again." },
      ruleExplanation:
        "M20's three systems stack: vocabulary (body parts/health) + がいたい (describing symptoms) + ので (giving reasons). から is still valid for casual/personal reasons.",
    }),
    speaking(
      "ja-m20-7-2-speak-3",
      "びょうきなので きょうは やすみます",
      "Because I'm sick, I'll rest today.",
    ),
    // ── Review tail ──
    speaking("ja-m20-7-2-rev-speak-1", M20_7_2_REVIEW[0].kana, M20_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m20-7-2-rev-lc-1",
      audioText: M20_7_2_REVIEW[1].kana,
      correctMeaningEn: M20_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M20_7_2_REVIEW[2].meaningEn,
        M20_7_2_REVIEW[3].meaningEn,
        M20_7_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m20-7-2-rev-mcq-1", M20_7_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M20_REVIEW_POOL),
    speaking("ja-m20-7-2-rev-speak-2", M20_7_2_REVIEW[2].kana, M20_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m20-7-2-rev", M20_7_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m20-7-2-info-end",
      "You own the complete body, health, and reason toolkit",
      "Body parts, pain patterns, ので reasons, medical vocab, hygiene words, adjective descriptions. Module 20 complete.",
      "win",
    ),
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
