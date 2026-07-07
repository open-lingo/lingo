/**
 * M15 — Te-form applications + Wants & Desires (2026-05-25).
 *
 * M15 introduces:
 *   - 〜ている (progressive: is eating, is studying) — progressive first, resultative later
 *   - 〜てもいいです (permission: "may I...?") — question form + いいですよ / ちょっと...
 *   - V-stem + たい (want to do) — conjugates like い-adjective
 *   - がほしい (want a thing) — also い-adj conjugation
 *   - けど/けれども (but) — contrastive conjunction
 *
 * Prereqs: て-form from M14.
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * ID scheme: ja-m15-{n}-{sub} e.g. ja-m15-1-1, ja-m15-1-2
 * Export names: M15_1_1, M15_1_2, M15_2_1, M15_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m15-1, etc.
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
const M15_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_TEIRU = grammarRule({
  id: "ja-m15-rule-teiru",
  grammarPointId: "te-iru",
  title: "〜ている — progressive (is ~ing)",
  rule:
    "て-form + いる/います expresses an ongoing action: 'is doing [verb].' Use the て-form you already know, then add いる (casual) or います (polite). たべて + います = 'is eating.' べんきょうして + います = 'is studying.' The ている form also has a resultative meaning (e.g. しっている = knows), but start with the progressive.",
  examples: [
    {
      ja: "いま たべています。",
      romaji: "ima tabete imasu.",
      en: "I'm eating right now.",
    },
    {
      ja: "べんきょうしています。",
      romaji: "benkyou shite imasu.",
      en: "I'm studying.",
    },
    {
      ja: "おんがくを きいています。",
      romaji: "ongaku o kiite imasu.",
      en: "I'm listening to music.",
    },
  ],
  antiPattern: {
    ja: "いま たべます。",
    romaji: "ima tabemasu.",
    en: "(unnatural — ます alone is habitual, not progressive)",
    why: "たべます means 'I eat (in general).' To say 'I AM eating right now,' you need たべています — the ている progressive form.",
  },
  cultureNote:
    "ている has two core meanings: progressive ('is doing') and resultative state ('is in the state of having done'). We'll cover the progressive first.",
});

const RULE_TEIRU_RESULTATIVE = grammarRule({
  id: "ja-m15-rule-teiru-result",
  grammarPointId: "te-iru",
  title: "〜ている — resultative state (knows, lives, is married)",
  rule:
    "Some verbs use ている to describe a continuing state, not an ongoing action. しっている = 'knows' (the state of having learned). すんでいる = 'lives (in a place).' けっこんしている = 'is married.' These look the same as progressive but describe a result that persists.",
  examples: [
    {
      ja: "とうきょうに すんでいます。",
      romaji: "toukyou ni sunde imasu.",
      en: "I live in Tokyo.",
    },
    {
      ja: "しっています。",
      romaji: "shitte imasu.",
      en: "I know (it).",
    },
    {
      ja: "かさを もっています。",
      romaji: "kasa o motte imasu.",
      en: "I have an umbrella (am holding one).",
    },
  ],
  antiPattern: {
    ja: "とうきょうに すみます。",
    romaji: "toukyou ni sumimasu.",
    en: "(unnatural — すみます means 'will move to live,' not 'lives there')",
    why: "すむ (to take up residence) is a change-of-state verb. The plain ます form implies you will move there. For 'currently lives,' use すんでいます.",
  },
  cultureNote:
    "The negative of しっている is しりません (not しっていません). This is an important irregularity: 'I don't know' = しりません.",
});

const RULE_TEMOII = grammarRule({
  id: "ja-m15-rule-temoii",
  grammarPointId: "te-mo-ii",
  title: "〜てもいいですか — asking permission (May I?)",
  rule:
    "て-form + も + いいですか = 'Is it okay if I [verb]?' = 'May I [verb]?' Answer yes: いいですよ (Sure!). Soft no: ちょっと... (Hmm, that's a bit...). The も means 'even if' — literally 'even if I do X, is it okay?'",
  examples: [
    {
      ja: "ここに すわってもいいですか。",
      romaji: "koko ni suwatte mo ii desu ka.",
      en: "May I sit here?",
    },
    {
      ja: "しゃしんを とってもいいですか。",
      romaji: "shashin o totte mo ii desu ka.",
      en: "May I take a photo?",
    },
    {
      ja: "いいですよ。",
      romaji: "ii desu yo.",
      en: "Sure, go ahead!",
    },
  ],
  antiPattern: {
    ja: "すわりますもいいですか。",
    romaji: "suwarimasu mo ii desu ka.",
    en: "(broken — use て-form, not ます-form before もいい)",
    why: "The pattern requires the て-form: すわって + もいいですか. The ます-form doesn't connect to もいい.",
  },
  cultureNote:
    "ちょっと... (trailing off) is a characteristically Japanese soft refusal. Rather than a direct 'no,' you hint that something is slightly problematic. The listener understands.",
});

const RULE_TAI = grammarRule({
  id: "ja-m15-rule-tai",
  grammarPointId: "v-tai",
  title: "V-stem + たい — I want to...",
  rule:
    "To say 'I want to [verb],' drop ます from the polite form and add たい. たべます → たべたい (want to eat). のみます → のみたい (want to drink). たい conjugates like an い-adjective: negative = たべたくない (don't want to eat). Past = たべたかった (wanted to eat).",
  examples: [
    {
      ja: "すしを たべたいです。",
      romaji: "sushi o tabetai desu.",
      en: "I want to eat sushi.",
    },
    {
      ja: "にほんに いきたいです。",
      romaji: "nihon ni ikitai desu.",
      en: "I want to go to Japan.",
    },
    {
      ja: "のみたくないです。",
      romaji: "nomitaku nai desu.",
      en: "I don't want to drink.",
    },
  ],
  antiPattern: {
    ja: "たべますたい。",
    romaji: "tabemasu tai.",
    en: "(broken — don't keep ます before たい)",
    why: "Drop ます entirely and add たい to the stem: たべます → たべ + たい = たべたい.",
  },
  cultureNote:
    "たい expresses YOUR desires. For asking about someone else's desires in polite speech, use たいですか. But be careful — directly asking 'what do you want?' can sound blunt in Japanese.",
});

const RULE_HOSHII = grammarRule({
  id: "ja-m15-rule-hoshii",
  grammarPointId: "ga-hoshii",
  title: "がほしい — I want (a thing)",
  rule:
    "ほしい = 'want' for THINGS (not actions). The wanted thing takes が, not を: みずが ほしい (I want water). ほしい conjugates like an い-adjective: negative = ほしくない (don't want). Note: たい = want to DO. ほしい = want to HAVE.",
  examples: [
    {
      ja: "みずが ほしいです。",
      romaji: "mizu ga hoshii desu.",
      en: "I want water.",
    },
    {
      ja: "あたらしい くつが ほしいです。",
      romaji: "atarashii kutsu ga hoshii desu.",
      en: "I want new shoes.",
    },
    {
      ja: "なにも ほしくないです。",
      romaji: "nani mo hoshiku nai desu.",
      en: "I don't want anything.",
    },
  ],
  antiPattern: {
    ja: "みずを ほしいです。",
    romaji: "mizu o hoshii desu.",
    en: "(unnatural — ほしい takes が, not を)",
    why: "ほしい is an adjective describing a feeling. The object of desire takes が (the 'subject of desire' marker), not を (the 'direct object' marker).",
  },
  cultureNote:
    "Directly saying ほしい about yourself is fine. But don't use ほしい to describe what someone else wants — use ほしがっている instead (beyond N5).",
});

const RULE_KEDO = grammarRule({
  id: "ja-m15-rule-kedo",
  grammarPointId: "kedo",
  title: "けど — but (contrastive conjunction)",
  rule:
    "けど connects two clauses with a 'but' meaning: A けど B = 'A, but B.' Attach けど to the end of the first clause (after です/ます). More formal versions: けれど, けれども. Same meaning, increasing formality.",
  examples: [
    {
      ja: "たべたいですけど、じかんが ないです。",
      romaji: "tabetai desu kedo, jikan ga nai desu.",
      en: "I want to eat, but I don't have time.",
    },
    {
      ja: "にほんごは たのしいですけど、むずかしいです。",
      romaji: "nihongo wa tanoshii desu kedo, muzukashii desu.",
      en: "Japanese is fun, but difficult.",
    },
  ],
  antiPattern: {
    ja: "たべたい、けど じかんが ないです。",
    romaji: "tabetai, kedo jikan ga nai desu.",
    en: "(broken — けど attaches directly to the predicate of the first clause)",
    why: "けど connects directly after です/ます/plain forms — no comma break before けど. It's a conjunction particle, not a standalone word.",
  },
  cultureNote:
    "けど at the end of a sentence (without a second clause) is extremely common: たべたいですけど… (I want to eat, but… [trailing off]). It's a soft, indirect way to imply a problem.",
});

// ═══════════════════════════════════════════════════════════════════════
// M15-1-1 — "Right now" (ている progressive intro)
//   Vocab: すむ, もつ, しる + progressive ている pattern
// ═══════════════════════════════════════════════════════════════════════

const M15_1_1_REVIEW = pickReviewAtoms("ja-m15-1-1-rev", M15_REVIEW_POOL, 4);

export const M15_1_1: LessonContent = {
  id: "ja-m15-1-1",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "Right now (intro)",
  description:
    "The ている progressive form — say what's happening right now. Plus three new verbs: すむ, もつ, しる.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m15-1-1-info-open",
      "What's happening right now?",
      "You know the て-form. Now add います after it — and you can describe what's happening this very moment.",
    ),
    // ── ている intro ──
    RULE_TEIRU,
    // ── Vocab: すむ (to live) ──
    build(
      "ja-m15-1-1-build-sumu",
      "Pick the Japanese word for: To live (reside)",
      "すむ",
      ["しる", "みる", "すむ", "もつ"],
      ["すむ"],
    ),
    listeningCompSentence({
      id: "ja-m15-1-1-lc-sumu",
      audioText: "とうきょうに すんでいます",
      correctMeaningEn: "I live in Tokyo.",
      distractorsEn: [
        "I'm going to Tokyo.",
        "I moved to Tokyo.",
        "I want to live in Tokyo.",
      ],
    }),
    // ── Vocab: もつ (to hold/have) ──
    build(
      "ja-m15-1-1-build-motsu",
      "Pick the Japanese word for: To hold / have",
      "もつ",
      ["のむ", "しる", "すむ", "もつ"],
      ["もつ"],
    ),
    vocabMcq(
      "ja-m15-1-1-mcq-motsu",
      { kana: "もつ", meaningEn: "to hold / have", emoji: "🤲", fromModule: "m15" },
      M15_REVIEW_POOL,
    ),
    // ── Vocab: しる (to know) ──
    build(
      "ja-m15-1-1-build-shiru",
      "Pick the Japanese word for: To know",
      "しる",
      ["みる", "もつ", "しる", "すむ"],
      ["しる"],
    ),
    speaking("ja-m15-1-1-speak-shiru", "しっています", "I know (it)."),
    // ── ている progressive drills ──
    build(
      "ja-m15-1-1-build-tabeteiru",
      "Say: I'm eating right now.",
      "いま たべています",
      ["たべます", "たべて", "います", "いません", "いま", "たべたい"],
      ["いま", "たべて", "います"],
    ),
    cloze(
      "ja-m15-1-1-cloze-teiru-1",
      "いま コーヒーを のんで",
      "。",
      "います",
      ["います", "ます", "いません", "ました"],
      "I'm drinking coffee right now.",
      "いま コーヒーを のんでいます。",
      "て-form + います = progressive. のんで + います = 'is drinking.'",
    ),
    sentenceMcq({
      id: "ja-m15-1-1-mcq-teiru",
      prompt: "Which sentence means 'She is studying'?",
      correctKana: "べんきょうしています。",
      distractorsKana: [
        "べんきょうします。",
        "べんきょうしました。",
        "べんきょうしたいです。",
      ],
      explanation: "して + います = progressive. 'Is studying.'",
    }),
    listeningCompSentence({
      id: "ja-m15-1-1-lc-teiru",
      audioText: "ほんを よんでいます",
      correctMeaningEn: "I'm reading a book.",
      distractorsEn: [
        "I read a book.",
        "I want to read a book.",
        "I don't read books.",
      ],
    }),
    cloze(
      "ja-m15-1-1-cloze-teiru-2",
      "ともだちは テレビを ",
      "います。",
      "みて",
      ["みて", "みます", "みた", "みたい"],
      "My friend is watching TV.",
      "ともだちは テレビを みています。",
      "て-form of みる = みて. みて + います = 'is watching.'",
    ),
    listeningBuildSentence({
      id: "ja-m15-1-1-lb-teiru",
      target: "いま べんきょうしています",
      tiles: ["べんきょう", "して", "います", "しました", "します", "いま"],
      correctOrder: ["いま", "べんきょう", "して", "います"],
      promptEn: "Hear it, build it: 'I'm studying right now.'",
    }),
    selfExplain({
      id: "ja-m15-1-1-self-teiru",
      anchorLabel: "You used ています in: たべています",
      anchorAudioText: "たべています",
      question: "Why ています instead of ます for 'is eating right now'?",
      rule: { text: "ます alone is habitual ('eats in general'). ています is the progressive — it describes what's happening at this moment." },
      surface: { text: "ています is the past tense of たべます." },
      distractor: { text: "ています is more polite than ます — both mean the same thing." },
      ruleExplanation: "て-form + います = progressive ('is doing right now'). ます alone = habitual or future.",
    }),
    speaking(
      "ja-m15-1-1-speak-teiru",
      "いま たべています",
      "I'm eating right now.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m15-1-1-rev-mcq-1", M15_1_1_REVIEW[0], M15_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m15-1-1-rev-lc-1",
      audioText: M15_1_1_REVIEW[1].kana,
      correctMeaningEn: M15_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M15_1_1_REVIEW[2].meaningEn,
        M15_1_1_REVIEW[3].meaningEn,
        M15_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m15-1-1-rev-speak-1", M15_1_1_REVIEW[2].kana, M15_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m15-1-1-rev", M15_1_1_REVIEW),
    infoStep(
      "ja-m15-1-1-info-end",
      "You can now describe what's happening right now",
      "て-form + います turns any verb into a progressive: たべています, のんでいます, べんきょうしています. You're narrating the present.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_1_1.steps);
assertAnswerRotation(M15_1_1.steps, 1);
assertNoConsecutiveSame(M15_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-1-2 — "What are they doing?" (ている practice — various verbs)
// ═══════════════════════════════════════════════════════════════════════

const M15_1_2_REVIEW = pickReviewAtoms("ja-m15-1-2-rev", M15_REVIEW_POOL, 4);

export const M15_1_2: LessonContent = {
  id: "ja-m15-1-2",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "What are they doing?",
  description:
    "Practice ている with different verbs — eating, drinking, reading, listening. Resultative state intro: しっている, すんでいる.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m15-1-2-info-open",
      "What's everyone doing?",
      "More ている practice with different verbs. Plus two special ones — しっている (knows) and すんでいる (lives) — where ている describes a state, not an action in progress.",
    ),
    RULE_TEIRU_RESULTATIVE,
    // ── しっている (knows — resultative) ──
    build(
      "ja-m15-1-2-build-shitteiru",
      "Say: I know.",
      "しっています",
      ["いません", "しって", "います", "しりません", "しります"],
      ["しって", "います"],
    ),
    listeningCompSentence({
      id: "ja-m15-1-2-lc-shitteiru",
      audioText: "しっています",
      correctMeaningEn: "I know (it).",
      distractorsEn: [
        "I'm learning.",
        "I don't know.",
        "I knew (it).",
      ],
    }),
    // ── すんでいる (lives — resultative) ──
    build(
      "ja-m15-1-2-build-sundeiru",
      "Say: I live in Osaka.",
      "おおさかに すんでいます",
      ["います", "すみます", "に", "おおさか", "いきます", "すんで"],
      ["おおさか", "に", "すんで", "います"],
    ),
    sentenceMcq({
      id: "ja-m15-1-2-mcq-sundeiru",
      prompt: "Which sentence means 'My friend lives in Tokyo'?",
      correctKana: "ともだちは とうきょうに すんでいます。",
      distractorsKana: [
        "ともだちは とうきょうに すみます。",
        "ともだちは とうきょうに いきます。",
        "ともだちは とうきょうに いました。",
      ],
      explanation: "すんでいます = 'lives in' (resultative ている). すみます would mean 'will move to.'",
    }),
    // ── もっている (have — resultative) ──
    cloze(
      "ja-m15-1-2-cloze-motteiru",
      "かさを もって",
      "。",
      "います",
      ["います", "ます", "いません", "ました"],
      "I have an umbrella.",
      "かさを もっています。",
      "もっている = 'have/hold' (resultative). The state of holding continues.",
    ),
    speaking("ja-m15-1-2-speak-motteiru", "かさを もっています", "I have an umbrella."),
    // ── Progressive variety drills ──
    cloze(
      "ja-m15-1-2-cloze-prog-1",
      "ともだちは いま おんがくを きいて",
      "。",
      "います",
      ["います", "ます", "いません", "いました"],
      "My friend is listening to music right now.",
      "ともだちは いま おんがくを きいています。",
      "きいて + います = progressive. 'Is listening.'",
    ),
    listeningBuildSentence({
      id: "ja-m15-1-2-lb-sundeiru",
      target: "にほんに すんでいます",
      tiles: ["いません", "いきます", "に", "います", "にほん", "すんで"],
      correctOrder: ["にほん", "に", "すんで", "います"],
      promptEn: "Hear it, build it: 'I live in Japan.'",
    }),
    sentenceMcq({
      id: "ja-m15-1-2-mcq-prog",
      prompt: "What does いま なにを していますか mean?",
      correctKana: "What are you doing right now?",
      distractorsKana: [
        "What did you do?",
        "What do you want to do?",
        "What will you do?",
      ],
      explanation: "して + いますか = progressive question. 'What are you doing?'",
    }),
    build(
      "ja-m15-1-2-build-nani",
      "Ask: What are you doing right now?",
      "いま なにを していますか",
      ["しますか", "いま", "なに", "いますか", "して", "しましたか", "を"],
      ["いま", "なに", "を", "して", "いますか"],
    ),
    cloze(
      "ja-m15-1-2-cloze-shirimasen",
      "",
      "。",
      "しりません",
      ["しりません", "しっていません", "しりました", "しっています"],
      "I don't know.",
      "しりません。",
      "The negative of しっている is しりません (not しっていません). This is an important irregularity.",
    ),
    translateStep({
      id: "ja-m15-1-2-translate",
      promptEn: "I'm reading a book right now.",
      acceptedAnswers: [
        "いま ほんを よんでいます",
        "いまほんをよんでいます",
        "ほんを よんでいます",
        "ほんをよんでいます",
      ],
    }),
    selfExplain({
      id: "ja-m15-1-2-self-result",
      anchorLabel: "しっています means 'I know' — not 'I am knowing'",
      anchorAudioText: "しっています",
      question: "Why does しっています mean 'I know' rather than 'I am currently knowing'?",
      rule: { text: "Some verbs use ている for a resultative state — the result of having learned persists. しっている = 'am in the state of knowing.'" },
      surface: { text: "しっている is just a more polite way of saying しる." },
      distractor: { text: "しる is only used in questions — しっている is the statement form." },
      ruleExplanation: "Resultative ている: the action completed and the state continues. しる (come to know) → しっている (knows — the state persists).",
    }),
    speaking(
      "ja-m15-1-2-speak-shirimasen",
      "しりません",
      "I don't know.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m15-1-2-rev-mcq-1", M15_1_2_REVIEW[0], M15_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m15-1-2-rev-lc-1",
      audioText: M15_1_2_REVIEW[1].kana,
      correctMeaningEn: M15_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M15_1_2_REVIEW[2].meaningEn,
        M15_1_2_REVIEW[3].meaningEn,
        M15_REVIEW_POOL[1].meaningEn,
      ],
    }),
    speaking("ja-m15-1-2-rev-speak-1", M15_1_2_REVIEW[2].kana, M15_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m15-1-2-rev", M15_1_2_REVIEW),
    infoStep(
      "ja-m15-1-2-info-end",
      "You can describe ongoing actions and ongoing states",
      "Progressive ている (たべています = eating now) and resultative ている (しっています = knows, すんでいます = lives). Two uses, one powerful pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_1_2.steps);
assertAnswerRotation(M15_1_2.steps, 1);
assertNoConsecutiveSame(M15_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-2-1 — "What are they doing?" continued (ている drill with more verbs)
//   Vocab: さんぽ (walk), かいもの (shopping), りょうり (cooking)
// ═══════════════════════════════════════════════════════════════════════

const M15_2_1_REVIEW = pickReviewAtoms("ja-m15-2-1-rev", M15_REVIEW_POOL, 4);

export const M15_2_1: LessonContent = {
  id: "ja-m15-2-1",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "What are they doing? I",
  description:
    "Practice ている with new activity vocab: さんぽ, かいもの, りょうり. Describing what people are doing right now.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m15-2-1-info-open",
      "Everyone's busy doing something",
      "Three new activities — walking, shopping, cooking — and you'll describe them all in progress with ている.",
    ),
    // ── さんぽ (walk) ──
    build(
      "ja-m15-2-1-build-sanpo",
      "Pick the Japanese word for: Walk / stroll",
      "さんぽ",
      ["りょうり", "さんぽ", "かいもの", "りょこう"],
      ["さんぽ"],
    ),
    vocabMcq(
      "ja-m15-2-1-mcq-sanpo",
      { kana: "さんぽ", meaningEn: "walk / stroll", emoji: "🚶", fromModule: "m15" },
      M15_REVIEW_POOL,
    ),
    // ── かいもの (shopping) ──
    build(
      "ja-m15-2-1-build-kaimono",
      "Pick the Japanese word for: Shopping",
      "かいもの",
      ["べんきょう", "りょうり", "さんぽ", "かいもの"],
      ["かいもの"],
    ),
    listeningCompSentence({
      id: "ja-m15-2-1-lc-kaimono",
      audioText: "かいものを しています",
      correctMeaningEn: "I'm shopping.",
      distractorsEn: [
        "I went shopping.",
        "I want to shop.",
        "I don't shop.",
      ],
    }),
    // ── りょうり (cooking) ──
    build(
      "ja-m15-2-1-build-ryouri",
      "Pick the Japanese word for: Cooking",
      "りょうり",
      ["しごと", "りょうり", "さんぽ", "かいもの"],
      ["りょうり"],
    ),
    speaking("ja-m15-2-1-speak-ryouri", "りょうりを しています", "I'm cooking."),
    // ── ている activity drills ──
    build(
      "ja-m15-2-1-build-sanpo-teiru",
      "Say: I'm taking a walk.",
      "さんぽを しています",
      ["います", "さんぽ", "しました", "して", "します", "を"],
      ["さんぽ", "を", "して", "います"],
    ),
    cloze(
      "ja-m15-2-1-cloze-kaimono",
      "はは は かいものを ",
      "います。",
      "して",
      ["して", "します", "した", "したい"],
      "Mom is shopping.",
      "ははは かいものを しています。",
      "して + います = progressive. かいものを しています = 'is shopping.'",
    ),
    sentenceMcq({
      id: "ja-m15-2-1-mcq-ryouri",
      prompt: "Which sentence means 'Dad is cooking'?",
      correctKana: "ちちは りょうりを しています。",
      distractorsKana: [
        "ちちは りょうりを します。",
        "ちちは りょうりを しました。",
        "ちちは りょうりを したいです。",
      ],
      explanation: "して + います = progressive. 'Is cooking right now.'",
    }),
    listeningCompSentence({
      id: "ja-m15-2-1-lc-sanpo",
      audioText: "こうえんで さんぽを しています",
      correctMeaningEn: "I'm taking a walk in the park.",
      distractorsEn: [
        "I walked in the park.",
        "I want to walk in the park.",
        "I always walk in the park.",
      ],
    }),
    cloze(
      "ja-m15-2-1-cloze-ryouri-2",
      "いま りょうりを して",
      "か。",
      "います",
      ["います", "ます", "いません", "ました"],
      "Are you cooking right now?",
      "いま りょうりを していますか。",
      "していますか = progressive question. 'Are you doing [activity]?'",
    ),
    listeningBuildSentence({
      id: "ja-m15-2-1-lb-kaimono",
      target: "いま かいものを しています",
      tiles: ["しました", "を", "かいもの", "いま", "います", "して", "します"],
      correctOrder: ["いま", "かいもの", "を", "して", "います"],
      promptEn: "Hear it, build it: 'I'm shopping right now.'",
    }),
    selfExplain({
      id: "ja-m15-2-1-self-suru",
      anchorLabel: "You keep seeing しています for activities",
      anchorAudioText: "かいものを しています",
      question: "Why do activities like かいもの and さんぽ use を しています?",
      rule: { text: "These are する-nouns — nouns that become verbs with する. かいもの + する = 'to shop.' The ている form is かいものを しています = 'is shopping.'" },
      surface: { text: "を しています is a polite way of saying を します." },
      distractor: { text: "All nouns can take を しています — it's a universal verb-making pattern." },
      ruleExplanation: "する-nouns (activity nouns) combine with する to form verbs. In ている progressive: noun + を + して + います.",
    }),
    speaking(
      "ja-m15-2-1-speak-sanpo",
      "こうえんで さんぽを しています",
      "I'm taking a walk in the park.",
    ),
    translateStep({
      id: "ja-m15-2-1-translate",
      promptEn: "Mom is shopping right now.",
      acceptedAnswers: [
        "いま ははは かいものを しています",
        "ははは いま かいものを しています",
        "ははは かいものを しています",
      ],
    }),
    // ── Review tail ──
    vocabMcq("ja-m15-2-1-rev-mcq-1", M15_2_1_REVIEW[0], M15_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m15-2-1-rev-lc-1",
      audioText: M15_2_1_REVIEW[1].kana,
      correctMeaningEn: M15_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M15_2_1_REVIEW[2].meaningEn,
        M15_2_1_REVIEW[3].meaningEn,
        M15_REVIEW_POOL[2].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m15-2-1-rev", M15_2_1_REVIEW),
    infoStep(
      "ja-m15-2-1-info-end",
      "You can narrate what everyone's busy doing",
      "さんぽを しています, かいものを しています, りょうりを しています — activity nouns + しています for the progressive.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_2_1.steps);
assertAnswerRotation(M15_2_1.steps, 1);
assertNoConsecutiveSame(M15_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-2-2 — "What are they doing?" practice (ている mixed drill)
//   Vocab: おんがく (music), えいが (movie), スポーツ (sports), ゲーム (game)
// ═══════════════════════════════════════════════════════════════════════

const M15_2_2_REVIEW = pickReviewAtoms("ja-m15-2-2-rev", M15_REVIEW_POOL, 4);

export const M15_2_2: LessonContent = {
  id: "ja-m15-2-2",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "What are they doing? II",
  description:
    "Hobby and entertainment vocab + ている drill: おんがく, えいが, スポーツ, ゲーム.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m15-2-2-info-open",
      "Hobbies in progress",
      "Four fun words — music, movies, sports, games — and you'll describe people enjoying them right now.",
    ),
    // ── おんがく (music) ──
    build(
      "ja-m15-2-2-build-ongaku",
      "Pick the Japanese word for: Music",
      "おんがく",
      ["スポーツ", "ゲーム", "おんがく", "えいが"],
      ["おんがく"],
    ),
    vocabMcq(
      "ja-m15-2-2-mcq-ongaku",
      { kana: "おんがく", meaningEn: "music", emoji: "🎵", fromModule: "m15" },
      M15_REVIEW_POOL,
    ),
    // ── えいが (movie) ──
    build(
      "ja-m15-2-2-build-eiga",
      "Pick the Japanese word for: Movie",
      "えいが",
      ["スポーツ", "ゲーム", "おんがく", "えいが"],
      ["えいが"],
    ),
    listeningCompSentence({
      id: "ja-m15-2-2-lc-eiga",
      audioText: "えいがを みています",
      correctMeaningEn: "I'm watching a movie.",
      distractorsEn: [
        "I watched a movie.",
        "I want to see a movie.",
        "I like movies.",
      ],
    }),
    // ── スポーツ (sports) ──
    build(
      "ja-m15-2-2-build-supootsu",
      "Pick the Japanese word for: Sports",
      "スポーツ",
      ["えいが", "ゲーム", "おんがく", "スポーツ"],
      ["スポーツ"],
    ),
    speaking("ja-m15-2-2-speak-supootsu", "スポーツを しています", "I'm playing sports."),
    // ── ゲーム (game) ──
    build(
      "ja-m15-2-2-build-geemu",
      "Pick the Japanese word for: Game",
      "ゲーム",
      ["おんがく", "スポーツ", "えいが", "ゲーム"],
      ["ゲーム"],
    ),
    vocabMcq(
      "ja-m15-2-2-mcq-geemu",
      { kana: "ゲーム", meaningEn: "game", emoji: "🎮", fromModule: "m15" },
      M15_REVIEW_POOL,
    ),
    // ── やる (to do — casual する) — new verb ──
    build(
      "ja-m15-2-2-build-yaru",
      "Pick the Japanese word for: To do (casual version of する)",
      "やる",
      ["くる", "やる", "みる", "する"],
      ["やる"],
    ),
    build(
      "ja-m15-2-2-build-yatteiru",
      "Say: My older sister is playing a game. (use やる)",
      "あねは ゲームを やっています",
      ["ゲーム", "して", "を", "あね", "います", "やって", "は"],
      ["あね", "は", "ゲーム", "を", "やって", "います"],
    ),
    // ── ている hobby drills ──
    cloze(
      "ja-m15-2-2-cloze-ongaku",
      "おんがくを きいて",
      "。",
      "います",
      ["います", "ます", "いません", "ました"],
      "I'm listening to music.",
      "おんがくを きいています。",
      "きいて + います = progressive. 'Is listening to music.'",
    ),
    build(
      "ja-m15-2-2-build-eiga-teiru",
      "Say: My older brother is watching a movie.",
      "あにが えいがを みています",
      ["みました", "えいが", "を", "みて", "あに", "が", "みます", "います"],
      ["あに", "が", "えいが", "を", "みて", "います"],
    ),
    sentenceMcq({
      id: "ja-m15-2-2-mcq-geemu-teiru",
      prompt: "Which sentence means 'The children are playing a game'?",
      correctKana: "こどもたちは ゲームを しています。",
      distractorsKana: [
        "こどもたちは ゲームを します。",
        "こどもたちは ゲームを しました。",
        "こどもたちは スポーツを しています。",
      ],
      explanation: "して + います = progressive. ゲームを しています = 'are playing a game.'",
    }),
    listeningCompSentence({
      id: "ja-m15-2-2-lc-supootsu",
      audioText: "まいにち スポーツを しています",
      correctMeaningEn: "I play sports every day.",
      distractorsEn: [
        "I played sports today.",
        "I want to play sports.",
        "I don't play sports.",
      ],
    }),
    cloze(
      "ja-m15-2-2-cloze-eiga",
      "いま えいがを ",
      "います。",
      "みて",
      ["みて", "みます", "みた", "みたい"],
      "I'm watching a movie right now.",
      "いま えいがを みています。",
      "みて + います = 'is watching.' て-form of みる is みて.",
    ),
    listeningBuildSentence({
      id: "ja-m15-2-2-lb-geemu",
      target: "ゲームを しています",
      tiles: ["します", "います", "して", "ゲーム", "しました", "を"],
      correctOrder: ["ゲーム", "を", "して", "います"],
      promptEn: "Hear it, build it: 'I'm playing a game.'",
    }),
    selfExplain({
      id: "ja-m15-2-2-self-prog",
      anchorLabel: "ています keeps appearing with hobby verbs",
      anchorAudioText: "おんがくを きいています",
      question: "What's the difference between おんがくを ききます and おんがくを きいています?",
      rule: { text: "ききます = 'listen (habitually/will listen).' きいています = 'is listening (right now).' The ている form marks an ongoing action at this moment." },
      surface: { text: "きいています is the polite version; ききます is casual." },
      distractor: { text: "ききます is for music; きいています is for conversations. Different contexts." },
      ruleExplanation: "ます = habitual/future. ています = progressive (right now). Same verb, different temporal framing.",
    }),
    speaking(
      "ja-m15-2-2-speak-eiga",
      "えいがを みています",
      "I'm watching a movie.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m15-2-2-rev-mcq-1", M15_2_2_REVIEW[0], M15_REVIEW_POOL),
    speaking("ja-m15-2-2-rev-speak-1", M15_2_2_REVIEW[1].kana, M15_2_2_REVIEW[1].meaningEn),
    reviewMatchPairs("ja-m15-2-2-rev", M15_2_2_REVIEW),
    infoStep(
      "ja-m15-2-2-info-end",
      "You can describe anyone enjoying hobbies right now",
      "おんがくを きいています, えいがを みています, ゲームを しています — hobbies + progressive = vivid narration.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_2_2.steps);
assertAnswerRotation(M15_2_2.steps, 1);
assertNoConsecutiveSame(M15_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-3-1 — "May I?" (てもいいです + permission patterns)
// ═══════════════════════════════════════════════════════════════════════

const M15_3_1_REVIEW = pickReviewAtoms("ja-m15-3-1-rev", M15_REVIEW_POOL, 4);

export const M15_3_1: LessonContent = {
  id: "ja-m15-3-1",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "May I? (intro)",
  description:
    "て-form + もいいですか = 'May I?' Permission requests, accepting with いいですよ, and soft refusals with ちょっと...",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m15-3-1-info-open",
      "Asking permission politely",
      "One powerful pattern: て-form + もいいですか = 'May I?' You'll be asking permission like a native speaker.",
    ),
    RULE_TEMOII,
    // ── Permission drills ──
    build(
      "ja-m15-3-1-build-suwatte",
      "Ask: May I sit here?",
      "ここに すわってもいいですか",
      ["すわります", "すわって", "いいです", "も", "いいですか", "ここ", "に"],
      ["ここ", "に", "すわって", "も", "いいですか"],
    ),
    listeningCompSentence({
      id: "ja-m15-3-1-lc-shitemoii",
      audioText: "ゲームを してもいいですか",
      correctMeaningEn: "May I play a game?",
      distractorsEn: [
        "I'm playing a game.",
        "Please play a game.",
        "I want to play a game.",
      ],
    }),
    build(
      "ja-m15-3-1-build-tabete",
      "Ask: May I eat this?",
      "これを たべてもいいですか",
      ["いいですか", "たべました", "たべて", "たべます", "これ", "も", "を"],
      ["これ", "を", "たべて", "も", "いいですか"],
    ),
    sentenceMcq({
      id: "ja-m15-3-1-mcq-temoii",
      prompt: "Which sentence asks 'May I take a photo?'",
      correctKana: "しゃしんを とってもいいですか。",
      distractorsKana: [
        "しゃしんを とります。",
        "しゃしんを とりました。",
        "しゃしんを とっています。",
      ],
      explanation: "とって + もいいですか = 'may I take?'",
    }),
    // ── いいですよ / ちょっと... ──
    build(
      "ja-m15-3-1-build-iidesuyo",
      "Say: Sure, go ahead!",
      "いいですよ",
      ["ちょっと", "いいですよ", "だめです", "いいえ"],
      ["いいですよ"],
    ),
    listeningCompSentence({
      id: "ja-m15-3-1-lc-chotto",
      audioText: "ちょっと",
      correctMeaningEn: "Hmm, that's a bit... (soft no)",
      distractorsEn: [
        "Sure, go ahead!",
        "A little bit.",
        "Please wait.",
      ],
    }),
    cloze(
      "ja-m15-3-1-cloze-temoii-1",
      "ここで たべて",
      "いいですか。",
      "も",
      ["も", "は", "が", "を"],
      "May I eat here?",
      "ここで たべてもいいですか。",
      "て-form + も + いいですか = 'May I?' も means 'even if.'",
    ),
    build(
      "ja-m15-3-1-build-mitte",
      "Ask: May I see (it)?",
      "みてもいいですか",
      ["も", "みました", "いいですか", "いいです", "みます", "みて"],
      ["みて", "も", "いいですか"],
    ),
    cloze(
      "ja-m15-3-1-cloze-temoii-2",
      "この ほんを よんで",
      "いいですか。",
      "も",
      ["も", "は", "が", "を"],
      "May I read this book?",
      "この ほんを よんでもいいですか。",
      "よんで + もいいですか = 'May I read?'",
    ),
    listeningBuildSentence({
      id: "ja-m15-3-1-lb-temoii",
      target: "テレビを みてもいいですか",
      tiles: ["みます", "テレビ", "いいですか", "いいです", "を", "も", "みて"],
      correctOrder: ["テレビ", "を", "みて", "も", "いいですか"],
      promptEn: "Hear it, build it: 'May I watch TV?'",
    }),
    sentenceMcq({
      id: "ja-m15-3-1-mcq-chotto",
      prompt: "Someone asks: ここに すわってもいいですか. The reply is ちょっと... What does it mean?",
      correctKana: "Soft refusal — 'that's a bit difficult...'",
      distractorsKana: [
        "Sure, go ahead!",
        "Please wait a moment.",
        "I don't understand the question.",
      ],
      explanation: "ちょっと... (trailing off) is a characteristically Japanese soft 'no.'",
    }),
    selfExplain({
      id: "ja-m15-3-1-self-temoii",
      anchorLabel: "You built: たべてもいいですか",
      anchorAudioText: "たべてもいいですか",
      question: "Why do we use the て-form before もいいですか?",
      rule: { text: "The てもいい pattern requires the て-form as its base. It literally means 'even if I do X, is it good?' — て-form + も (even if) + いい (good)." },
      surface: { text: "The て-form is used because it sounds more polite than the ます-form." },
      distractor: { text: "The て-form is needed because もいい is a separate verb that requires a て-form connection." },
      ruleExplanation: "て-form + も + いいですか decomposes to: [action in て-form] + even if + is it okay? This is a fixed grammatical pattern.",
    }),
    speaking(
      "ja-m15-3-1-speak-temoii",
      "ここに すわってもいいですか",
      "May I sit here?",
    ),
    translateStep({
      id: "ja-m15-3-1-translate",
      promptEn: "May I take a photo?",
      acceptedAnswers: [
        "しゃしんを とってもいいですか",
        "しゃしんをとってもいいですか",
      ],
    }),
    // ── Review tail ──
    vocabMcq("ja-m15-3-1-rev-mcq-1", M15_3_1_REVIEW[0], M15_REVIEW_POOL),
    speaking("ja-m15-3-1-rev-speak-1", M15_3_1_REVIEW[1].kana, M15_3_1_REVIEW[1].meaningEn),
    reviewMatchPairs("ja-m15-3-1-rev", M15_3_1_REVIEW),
    infoStep(
      "ja-m15-3-1-info-end",
      "You can now ask permission and understand the answer",
      "て-form + もいいですか to ask, いいですよ to accept, ちょっと... to softly decline. Polite, natural, and very Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_3_1.steps);
assertAnswerRotation(M15_3_1.steps, 1);
assertNoConsecutiveSame(M15_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-3-2 — "May I?" practice (てもいいです permission drill)
// ═══════════════════════════════════════════════════════════════════════

const M15_3_2_REVIEW = pickReviewAtoms("ja-m15-3-2-rev", M15_REVIEW_POOL, 4);

export const M15_3_2: LessonContent = {
  id: "ja-m15-3-2",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "May I? (practice)",
  description:
    "More てもいいですか drills — using various verbs in permission contexts. Classroom, home, and travel situations.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m15-3-2-info-open",
      "Permission in action",
      "You know the pattern: て-form + もいいですか. Now drill it with more verbs in real-life situations.",
    ),
    // ── Varied permission requests ──
    build(
      "ja-m15-3-2-build-kaette",
      "Ask: May I go home?",
      "かえってもいいですか",
      ["かえりました", "も", "かえります", "いいですか", "いいです", "かえって"],
      ["かえって", "も", "いいですか"],
    ),
    listeningCompSentence({
      id: "ja-m15-3-2-lc-haitte",
      audioText: "はいってもいいですか",
      correctMeaningEn: "May I come in?",
      distractorsEn: [
        "May I go home?",
        "Please come in.",
        "I'm coming in.",
      ],
    }),
    cloze(
      "ja-m15-3-2-cloze-tsukatte",
      "この ペンを つかって",
      "いいですか。",
      "も",
      ["も", "は", "が", "を"],
      "May I use this pen?",
      "この ペンを つかってもいいですか。",
      "つかって + もいいですか = 'May I use?'",
    ),
    build(
      "ja-m15-3-2-build-haitte",
      "Ask: May I come in?",
      "はいってもいいですか",
      ["はいります", "も", "はいって", "いいですか", "いいです"],
      ["はいって", "も", "いいですか"],
    ),
    sentenceMcq({
      id: "ja-m15-3-2-mcq-nonde",
      prompt: "Which sentence asks 'May I drink water?'",
      correctKana: "みずを のんでもいいですか。",
      distractorsKana: [
        "みずを のみます。",
        "みずを のみたいです。",
        "みずが ほしいです。",
      ],
      explanation: "のんで + もいいですか = 'May I drink?'",
    }),
    cloze(
      "ja-m15-3-2-cloze-akete",
      "まどを あけて",
      "いいですか。",
      "も",
      ["も", "は", "が", "で"],
      "May I open the window?",
      "まどを あけてもいいですか。",
      "あけて + もいいですか = 'May I open?'",
    ),
    listeningCompSentence({
      id: "ja-m15-3-2-lc-tsukatte",
      audioText: "この パソコンを つかってもいいですか",
      correctMeaningEn: "May I use this computer?",
      distractorsEn: [
        "This computer is being used.",
        "I use this computer.",
        "This computer is broken.",
      ],
    }),
    build(
      "ja-m15-3-2-build-nonde",
      "Ask: May I drink this?",
      "これを のんでもいいですか",
      ["のみます", "これ", "のんで", "も", "いいですか", "を"],
      ["これ", "を", "のんで", "も", "いいですか"],
    ),
    // ── Permission question-answer drill ──
    sentenceMcq({
      id: "ja-m15-3-2-mcq-answer",
      prompt: "Someone asks でんわを つかってもいいですか. You want to say yes. You reply:",
      correctKana: "いいですよ。",
      distractorsKana: [
        "ちょっと…",
        "すみません。",
        "しりません。",
      ],
      explanation: "いいですよ = 'Sure, go ahead!' The positive reply to a permission request.",
    }),
    listeningBuildSentence({
      id: "ja-m15-3-2-lb-benkyou",
      target: "としょかんで べんきょうしてもいいですか",
      tiles: ["いいですか", "べんきょう", "としょかん", "も", "して", "に", "で"],
      correctOrder: ["としょかん", "で", "べんきょう", "して", "も", "いいですか"],
      promptEn: "Hear it, build it: 'May I study in the library?'",
    }),
    cloze(
      "ja-m15-3-2-cloze-hanashite",
      "ともだちと はなして",
      "いいですか。",
      "も",
      ["も", "は", "を", "が"],
      "May I talk with my friend?",
      "ともだちと はなしてもいいですか。",
      "て-form + もいいですか. も = 'even if.'",
    ),
    selfExplain({
      id: "ja-m15-3-2-self-chotto",
      anchorLabel: "ちょっと... as a soft refusal",
      anchorAudioText: "ちょっと",
      question: "Why is ちょっと... considered a refusal when it literally means 'a little'?",
      rule: { text: "In Japanese, trailing off with ちょっと... implies 'that's a bit difficult/problematic.' The listener fills in the negative — it's an indirect refusal that avoids saying 'no' directly." },
      surface: { text: "ちょっと means 'please wait a moment' — it's not a refusal at all." },
      distractor: { text: "ちょっと is rude — it means 'absolutely not' and should be avoided." },
      ruleExplanation: "Japanese communication often relies on indirectness. ちょっと... trails off, letting the listener infer the refusal without a direct 'no.'",
    }),
    speaking(
      "ja-m15-3-2-speak-temoii",
      "まどを あけてもいいですか",
      "May I open the window?",
    ),
    translateStep({
      id: "ja-m15-3-2-translate",
      promptEn: "May I go home?",
      acceptedAnswers: [
        "かえってもいいですか",
        "かえっても いいですか",
      ],
    }),
    // ── Review tail ──
    speaking("ja-m15-3-2-rev-speak-1", M15_3_2_REVIEW[0].kana, M15_3_2_REVIEW[0].meaningEn),
    vocabMcq("ja-m15-3-2-rev-mcq-1", M15_3_2_REVIEW[1], M15_REVIEW_POOL),
    reviewMatchPairs("ja-m15-3-2-rev", M15_3_2_REVIEW),
    infoStep(
      "ja-m15-3-2-info-end",
      "You can ask for permission in any situation",
      "て-form + もいいですか works with any verb. Classroom, restaurant, friend's house — you know how to ask and how to respond.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_3_2.steps);
assertAnswerRotation(M15_3_2.steps, 1);
assertNoConsecutiveSame(M15_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-4-1 — "I want to..." (たい intro + adj-like conjugation)
//   Vocab: りょこう (travel)
// ═══════════════════════════════════════════════════════════════════════

const M15_4_1_REVIEW = pickReviewAtoms("ja-m15-4-1-rev", M15_REVIEW_POOL, 4);

export const M15_4_1: LessonContent = {
  id: "ja-m15-4-1",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "I want to... (intro)",
  description:
    "V-stem + たい = 'want to do.' Conjugates like an い-adjective. Plus りょこう (travel).",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m15-4-1-info-open",
      "Expressing what you want to do",
      "Drop ます, add たい. That's it. たべます → たべたい. You'll express desires for the first time.",
    ),
    RULE_TAI,
    // ── りょこう (travel) ──
    build(
      "ja-m15-4-1-build-ryokou",
      "Pick the Japanese word for: Travel",
      "りょこう",
      ["りょうり", "さんぽ", "りょこう", "かいもの"],
      ["りょこう"],
    ),
    vocabMcq(
      "ja-m15-4-1-mcq-ryokou",
      { kana: "りょこう", meaningEn: "travel", emoji: "✈️", fromModule: "m15" },
      M15_REVIEW_POOL,
    ),
    // ── はじめて (for the first time) — new adverb ──
    build(
      "ja-m15-4-1-build-hajimete",
      "Pick the Japanese word for: For the first time",
      "はじめて",
      ["まいにち", "はじめて", "いつも", "ときどき"],
      ["はじめて"],
    ),
    build(
      "ja-m15-4-1-build-hajimete-sentence",
      "Say: I'll go to Japan for the first time.",
      "はじめて にほんに いきます",
      ["にほん", "はじめて", "に", "いつも", "いきます", "いきました"],
      ["はじめて", "にほん", "に", "いきます"],
    ),
    // ── たい drills ──
    build(
      "ja-m15-4-1-build-tabetai",
      "Say: I want to eat sushi.",
      "すしを たべたいです",
      ["を", "たべたい", "たべます", "たべて", "です", "すし"],
      ["すし", "を", "たべたい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m15-4-1-lc-tabetai",
      audioText: "りんごを たべたいです",
      correctMeaningEn: "I want to eat an apple.",
      distractorsEn: [
        "I'm eating an apple.",
        "I ate an apple.",
        "I don't eat apples.",
      ],
    }),
    cloze(
      "ja-m15-4-1-cloze-tai-1",
      "にほんに ",
      "です。",
      "いきたい",
      ["いきたい", "いきます", "いって", "いきました"],
      "I want to go to Japan.",
      "にほんに いきたいです。",
      "いきます → いき + たい = いきたい. 'Want to go.'",
    ),
    sentenceMcq({
      id: "ja-m15-4-1-mcq-nomitai",
      prompt: "Which sentence means 'I want to drink coffee'?",
      correctKana: "コーヒーを のみたいです。",
      distractorsKana: [
        "コーヒーを のんでいます。",
        "コーヒーを のみます。",
        "コーヒーが ほしいです。",
      ],
      explanation: "のみます → のみたい = 'want to drink.'",
    }),
    build(
      "ja-m15-4-1-build-ikitai",
      "Say: I want to travel.",
      "りょこうしたいです",
      ["しました", "します", "して", "です", "りょこう", "したい"],
      ["りょこう", "したい", "です"],
    ),
    // ── たくない (negative) ──
    cloze(
      "ja-m15-4-1-cloze-tai-neg",
      "いま ",
      "です。",
      "たべたくない",
      ["たべたくない", "たべたい", "たべません", "たべない"],
      "I don't want to eat right now.",
      "いま たべたくないです。",
      "たい → たくない. Like い-adjective: drop い, add くない.",
    ),
    listeningCompSentence({
      id: "ja-m15-4-1-lc-takunai",
      audioText: "のみたくないです",
      correctMeaningEn: "I don't want to drink.",
      distractorsEn: [
        "I want to drink.",
        "I didn't drink.",
        "I'm not drinking.",
      ],
    }),
    build(
      "ja-m15-4-1-build-takunai",
      "Say: I don't want to go.",
      "いきたくないです",
      ["いきたい", "です", "いきません", "いきたくない"],
      ["いきたくない", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m15-4-1-lb-tai",
      target: "とうきょうに いきたいです",
      tiles: ["です", "いきます", "いきたい", "いきたくない", "とうきょう", "に"],
      correctOrder: ["とうきょう", "に", "いきたい", "です"],
      promptEn: "Hear it, build it: 'I want to go to Tokyo.'",
    }),
    selfExplain({
      id: "ja-m15-4-1-self-tai",
      anchorLabel: "たべたい → たべたくない",
      anchorAudioText: "たべたくないです",
      question: "Why does たい become たくない in the negative?",
      rule: { text: "たい conjugates like an い-adjective. い-adjective negative: drop い, add くない. So たべたい → たべたくない." },
      surface: { text: "たくない is a separate word meaning 'refuse to' — it's not a conjugation of たい." },
      distractor: { text: "You add ません after たい for the negative: たべたいません." },
      ruleExplanation: "たい is grammatically an い-adjective suffix. It follows い-adjective rules: たい → たくない (negative), たかった (past).",
    }),
    speaking(
      "ja-m15-4-1-speak-tai",
      "すしを たべたいです",
      "I want to eat sushi.",
    ),
    translateStep({
      id: "ja-m15-4-1-translate",
      promptEn: "I want to go to Japan.",
      acceptedAnswers: [
        "にほんに いきたいです",
        "にほんにいきたいです",
      ],
    }),
    // ── Review tail ──
    vocabMcq("ja-m15-4-1-rev-mcq-1", M15_4_1_REVIEW[0], M15_REVIEW_POOL),
    speaking("ja-m15-4-1-rev-speak-1", M15_4_1_REVIEW[1].kana, M15_4_1_REVIEW[1].meaningEn),
    reviewMatchPairs("ja-m15-4-1-rev", M15_4_1_REVIEW),
    infoStep(
      "ja-m15-4-1-info-end",
      "You can express what you want to do — and what you don't",
      "ます-stem + たい = 'want to do.' たい → たくない for the negative. You're expressing desires.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_4_1.steps);
assertAnswerRotation(M15_4_1.steps, 1);
assertNoConsecutiveSame(M15_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-4-2 — "I want to..." practice (たい drill + feelings vocab)
//   Vocab: うれしい, かなしい, さびしい, たのしい
// ═══════════════════════════════════════════════════════════════════════

const M15_4_2_REVIEW = pickReviewAtoms("ja-m15-4-2-rev", M15_REVIEW_POOL, 4);

export const M15_4_2: LessonContent = {
  id: "ja-m15-4-2",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "I want to... (practice)",
  description:
    "More たい practice + four feelings adjectives: うれしい, かなしい, さびしい, たのしい.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m15-4-2-info-open",
      "Feelings and desires",
      "Four い-adjectives for emotions — happy, sad, lonely, fun — plus more たい practice. Express what you feel and what you want.",
    ),
    // ── うれしい (happy) ──
    build(
      "ja-m15-4-2-build-ureshii",
      "Pick the Japanese word for: Happy",
      "うれしい",
      ["さびしい", "かなしい", "うれしい", "たのしい"],
      ["うれしい"],
    ),
    vocabMcq(
      "ja-m15-4-2-mcq-ureshii",
      { kana: "うれしい", meaningEn: "happy", emoji: "😊", fromModule: "m15" },
      M15_REVIEW_POOL,
    ),
    // ── かなしい (sad) ──
    build(
      "ja-m15-4-2-build-kanashii",
      "Pick the Japanese word for: Sad",
      "かなしい",
      ["さびしい", "たのしい", "うれしい", "かなしい"],
      ["かなしい"],
    ),
    listeningCompSentence({
      id: "ja-m15-4-2-lc-kanashii",
      audioText: "かなしいです",
      correctMeaningEn: "I'm sad.",
      distractorsEn: [
        "I'm happy.",
        "I'm lonely.",
        "I'm having fun.",
      ],
    }),
    // ── さびしい (lonely) ──
    build(
      "ja-m15-4-2-build-sabishii",
      "Pick the Japanese word for: Lonely",
      "さびしい",
      ["たのしい", "うれしい", "かなしい", "さびしい"],
      ["さびしい"],
    ),
    speaking("ja-m15-4-2-speak-sabishii", "さびしいです", "I'm lonely."),
    // ── たのしい (fun) ──
    build(
      "ja-m15-4-2-build-tanoshii",
      "Pick the Japanese word for: Fun",
      "たのしい",
      ["うれしい", "かなしい", "たのしい", "さびしい"],
      ["たのしい"],
    ),
    vocabMcq(
      "ja-m15-4-2-mcq-tanoshii",
      { kana: "たのしい", meaningEn: "fun", emoji: "🎉", fromModule: "m15" },
      M15_REVIEW_POOL,
    ),
    // ── たい + feelings drills ──
    cloze(
      "ja-m15-4-2-cloze-mitai",
      "えいがを ",
      "です。",
      "みたい",
      ["みたい", "みます", "みて", "みています"],
      "I want to watch a movie.",
      "えいがを みたいです。",
      "みます → み + たい = みたい. 'Want to watch.'",
    ),
    sentenceMcq({
      id: "ja-m15-4-2-mcq-shitai",
      prompt: "Which sentence means 'I want to play sports'?",
      correctKana: "スポーツを したいです。",
      distractorsKana: [
        "スポーツを しています。",
        "スポーツを しました。",
        "スポーツを します。",
      ],
      explanation: "します → し + たい = したい. 'Want to do.'",
    }),
    build(
      "ja-m15-4-2-build-ongaku-tai",
      "Say: I want to listen to music.",
      "おんがくを ききたいです",
      ["です", "きいて", "ききます", "ききたい", "おんがく", "を"],
      ["おんがく", "を", "ききたい", "です"],
    ),
    cloze(
      "ja-m15-4-2-cloze-takunai",
      "いま スポーツを ",
      "です。",
      "したくない",
      ["したくない", "したい", "しません", "しない"],
      "I don't want to play sports right now.",
      "いま スポーツを したくないです。",
      "したい → したくない (don't want to do). い-adjective negative pattern.",
    ),
    build(
      "ja-m15-4-2-build-yaritai",
      "Say: I want to play a game. (use やる)",
      "ゲームを やりたいです",
      ["やりたい", "ゲーム", "したい", "を", "やって", "です"],
      ["ゲーム", "を", "やりたい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m15-4-2-lb-tai",
      target: "おんがくを ききたいです",
      tiles: ["ききます", "きいて", "を", "ききたい", "です", "おんがく"],
      correctOrder: ["おんがく", "を", "ききたい", "です"],
      promptEn: "Hear it, build it: 'I want to listen to music.'",
    }),
    listeningCompSentence({
      id: "ja-m15-4-2-lc-tanoshii",
      audioText: "にほんごは たのしいです",
      correctMeaningEn: "Japanese is fun.",
      distractorsEn: [
        "Japanese is sad.",
        "Japanese is difficult.",
        "Japanese is easy.",
      ],
    }),
    selfExplain({
      id: "ja-m15-4-2-self-tai",
      anchorLabel: "たい works like an い-adjective",
      anchorAudioText: "たべたくないです",
      question: "Why does したい become したくない (not したいません)?",
      rule: { text: "たい is grammatically an い-adjective ending. Negate it the same way: drop い, add くない. したい → したくない." },
      surface: { text: "したくない is a different word from したい — they're not related conjugations." },
      distractor: { text: "ません only works with ます-form verbs; たい uses a different negative system called the たく-negative." },
      ruleExplanation: "たい = い-adjective ending. Negative: drop い → くない. This matches every other い-adjective (たかい → たかくない).",
    }),
    speaking(
      "ja-m15-4-2-speak-tai",
      "りょこうしたいです",
      "I want to travel.",
    ),
    // ── Review tail ──
    speaking("ja-m15-4-2-rev-speak-1", M15_4_2_REVIEW[0].kana, M15_4_2_REVIEW[0].meaningEn),
    vocabMcq("ja-m15-4-2-rev-mcq-1", M15_4_2_REVIEW[1], M15_REVIEW_POOL),
    reviewMatchPairs("ja-m15-4-2-rev", M15_4_2_REVIEW),
    infoStep(
      "ja-m15-4-2-info-end",
      "You can express desires and describe your feelings",
      "たい for want-to-do, four new emotion words — うれしい, かなしい, さびしい, たのしい. You're building an emotional vocabulary.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_4_2.steps);
assertAnswerRotation(M15_4_2.steps, 1);
assertNoConsecutiveSame(M15_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-5-1 — "I want..." (ほしい + が particle pattern)
// ═══════════════════════════════════════════════════════════════════════

const M15_5_1_REVIEW = pickReviewAtoms("ja-m15-5-1-rev", M15_REVIEW_POOL, 4);

export const M15_5_1: LessonContent = {
  id: "ja-m15-5-1",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "I want... (intro)",
  description:
    "ほしい = 'want a thing.' The wanted thing takes が, not を. Also conjugates like an い-adjective.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m15-5-1-info-open",
      "Wanting things",
      "たい = want to DO. ほしい = want to HAVE. The thing you want takes が. Two complementary patterns for expressing desire.",
    ),
    RULE_HOSHII,
    // ── ほしい drills ──
    build(
      "ja-m15-5-1-build-mizu",
      "Say: I want water.",
      "みずが ほしいです",
      ["が", "みず", "です", "を", "ほしくない", "ほしい"],
      ["みず", "が", "ほしい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m15-5-1-lc-ocha",
      audioText: "おちゃが ほしいです",
      correctMeaningEn: "I want tea.",
      distractorsEn: [
        "I'm drinking tea.",
        "I want to drink tea.",
        "I don't want tea.",
      ],
    }),
    cloze(
      "ja-m15-5-1-cloze-hoshii-1",
      "あたらしい くつ",
      " ほしいです。",
      "が",
      ["が", "を", "は", "の"],
      "I want new shoes.",
      "あたらしい くつが ほしいです。",
      "The thing you want takes が with ほしい. Not を.",
    ),
    sentenceMcq({
      id: "ja-m15-5-1-mcq-hoshii",
      prompt: "Which sentence correctly says 'I want a new bag'?",
      correctKana: "あたらしい かばんが ほしいです。",
      distractorsKana: [
        "あたらしい かばんを ほしいです。",
        "あたらしい かばんは ほしいです。",
        "あたらしい かばんを ほしいます。",
      ],
      explanation: "ほしい takes が (not を) for the wanted thing.",
    }),
    build(
      "ja-m15-5-1-build-jikan",
      "Say: I want time.",
      "じかんが ほしいです",
      ["ほしい", "が", "じかん", "を", "ほしくない", "です"],
      ["じかん", "が", "ほしい", "です"],
    ),
    speaking("ja-m15-5-1-speak-hoshii", "コーヒーが ほしいです", "I want coffee."),
    // ── ほしくない (negative) ──
    cloze(
      "ja-m15-5-1-cloze-hoshikunai",
      "なにも ",
      "です。",
      "ほしくない",
      ["ほしくない", "ほしい", "ほしかった", "ほしいません"],
      "I don't want anything.",
      "なにも ほしくないです。",
      "ほしい → ほしくない. Same pattern as any い-adjective negative.",
    ),
    listeningCompSentence({
      id: "ja-m15-5-1-lc-hoshikunai",
      audioText: "いま なにも ほしくないです",
      correctMeaningEn: "I don't want anything right now.",
      distractorsEn: [
        "I want everything.",
        "I don't have anything.",
        "I need something.",
      ],
    }),
    build(
      "ja-m15-5-1-build-hoshikunai",
      "Say: I don't want coffee.",
      "コーヒーは ほしくないです",
      ["は", "が", "です", "コーヒー", "ほしい", "ほしくない"],
      ["コーヒー", "は", "ほしくない", "です"],
    ),
    // ── たい vs ほしい contrast ──
    sentenceMcq({
      id: "ja-m15-5-1-mcq-contrast",
      prompt: "I want TO DRINK coffee. Which is correct?",
      correctKana: "コーヒーを のみたいです。",
      distractorsKana: [
        "コーヒーが ほしいです。",
        "コーヒーを ほしいです。",
        "コーヒーが のみたいです。",
      ],
      explanation: "Want to DO = たい (のみたい). Want to HAVE = ほしい. Here we want to DO (drink).",
    }),
    listeningBuildSentence({
      id: "ja-m15-5-1-lb-hoshii",
      target: "あたらしい くるまが ほしいです",
      tiles: ["ほしい", "が", "です", "を", "あたらしい", "くるま", "ほしくない"],
      correctOrder: ["あたらしい", "くるま", "が", "ほしい", "です"],
      promptEn: "Hear it, build it: 'I want a new car.'",
    }),
    cloze(
      "ja-m15-5-1-cloze-hoshii-ga",
      "おかね",
      " ほしいです。",
      "が",
      ["が", "を", "は", "の"],
      "I want money.",
      "おかねが ほしいです。",
      "ほしい = wanting a thing. The thing takes が.",
    ),
    selfExplain({
      id: "ja-m15-5-1-self-hoshii",
      anchorLabel: "みずが ほしいです — not みずを",
      anchorAudioText: "みずが ほしいです",
      question: "Why does ほしい use が instead of を for the wanted thing?",
      rule: { text: "ほしい is an adjective describing a feeling ('I am desirous of X'). The object of desire takes が because it's the subject of the adjective, not the direct object of a verb." },
      surface: { text: "が and を are interchangeable with ほしい — both are correct." },
      distractor: { text: "を is only for verbs. Since ほしい ends in い, it must be a noun and nouns always take が." },
      ruleExplanation: "ほしい = adjective ('desirous'). X が ほしい = 'X is desirable (to me).' The wanted thing is the grammatical subject (が), not the object (を).",
    }),
    speaking(
      "ja-m15-5-1-speak-kutsu",
      "あたらしい くつが ほしいです",
      "I want new shoes.",
    ),
    translateStep({
      id: "ja-m15-5-1-translate",
      promptEn: "I want water.",
      acceptedAnswers: [
        "みずが ほしいです",
        "みずがほしいです",
      ],
    }),
    // ── Review tail ──
    vocabMcq("ja-m15-5-1-rev-mcq-1", M15_5_1_REVIEW[0], M15_REVIEW_POOL),
    speaking("ja-m15-5-1-rev-speak-1", M15_5_1_REVIEW[1].kana, M15_5_1_REVIEW[1].meaningEn),
    reviewMatchPairs("ja-m15-5-1-rev", M15_5_1_REVIEW),
    infoStep(
      "ja-m15-5-1-info-end",
      "You can say what you want — things and actions",
      "ほしい for things (が ほしい), たい for actions (verb + たい). Two sides of desire, both in your toolkit.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_5_1.steps);
assertAnswerRotation(M15_5_1.steps, 1);
assertNoConsecutiveSame(M15_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-5-2 — "I want..." practice (ほしい + たい mixed drill)
// ═══════════════════════════════════════════════════════════════════════

const M15_5_2_REVIEW = pickReviewAtoms("ja-m15-5-2-rev", M15_REVIEW_POOL, 4);

export const M15_5_2: LessonContent = {
  id: "ja-m15-5-2",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "I want... (practice)",
  description:
    "Mixed ほしい + たい drill. Want things vs. want to do things. Negative forms of both.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m15-5-2-info-open",
      "Wants, desires, and negatives",
      "ほしい for things, たい for actions. Now mix them, negate them, and make them your own.",
    ),
    // ── Mixed drills ──
    cloze(
      "ja-m15-5-2-cloze-tai-1",
      "こうえんに ",
      "です。",
      "いきたい",
      ["いきたい", "いきます", "ほしい", "いきたくない"],
      "I want to go to the park.",
      "こうえんに いきたいです。",
      "Want to DO = verb stem + たい. いきます → いきたい.",
    ),
    sentenceMcq({
      id: "ja-m15-5-2-mcq-hoshii",
      prompt: "Which sentence means 'I want a car'?",
      correctKana: "くるまが ほしいです。",
      distractorsKana: [
        "くるまを のりたいです。",
        "くるまを ほしいです。",
        "くるまが ほしくないです。",
      ],
      explanation: "Want a THING = thing + が + ほしい.",
    }),
    build(
      "ja-m15-5-2-build-kaitai",
      "Say: I want to buy a new phone.",
      "あたらしい でんわを かいたいです",
      ["です", "でんわ", "かいたい", "かいます", "が", "を", "あたらしい"],
      ["あたらしい", "でんわ", "を", "かいたい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m15-5-2-lc-hoshii",
      audioText: "ともだちが ほしいです",
      correctMeaningEn: "I want a friend.",
      distractorsEn: [
        "I have a friend.",
        "My friend wants it.",
        "I want to meet a friend.",
      ],
    }),
    cloze(
      "ja-m15-5-2-cloze-hoshii-1",
      "やすみ",
      " ほしいです。",
      "が",
      ["が", "を", "は", "も"],
      "I want a vacation.",
      "やすみが ほしいです。",
      "ほしい takes が for the desired thing.",
    ),
    build(
      "ja-m15-5-2-build-takunai",
      "Say: I don't want to study.",
      "べんきょうしたくないです",
      ["です", "べんきょう", "して", "しません", "したい", "したくない"],
      ["べんきょう", "したくない", "です"],
    ),
    listeningCompSentence({
      id: "ja-m15-5-2-lc-takunai",
      audioText: "いま べんきょうしたくないです",
      correctMeaningEn: "I don't want to study right now.",
      distractorsEn: [
        "I want to study now.",
        "I'm not studying now.",
        "I didn't study.",
      ],
    }),
    sentenceMcq({
      id: "ja-m15-5-2-mcq-contrast",
      prompt: "'I want coffee' (the thing itself). Which is correct?",
      correctKana: "コーヒーが ほしいです。",
      distractorsKana: [
        "コーヒーを のみたいです。",
        "コーヒーを ほしいです。",
        "コーヒーが のみたいです。",
      ],
      explanation: "Want a THING = が ほしい. のみたい = 'want to drink' (an action, not the thing itself).",
    }),
    cloze(
      "ja-m15-5-2-cloze-takunai",
      "あした はたらき",
      "です。",
      "たくない",
      ["たくない", "たい", "ます", "ません"],
      "I don't want to work tomorrow.",
      "あした はたらきたくないです。",
      "はたらきます → はたらき + たくない = don't want to work.",
    ),
    build(
      "ja-m15-5-2-build-takunai-nanimo",
      "Say: I don't want to eat anything.",
      "なにも たべたくないです",
      ["たべたくない", "たべたい", "ほしくない", "です", "なにも"],
      ["なにも", "たべたくない", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m15-5-2-lb-contrast",
      target: "くるまが ほしいです",
      tiles: ["ほしい", "を", "です", "ほしくない", "くるま", "が"],
      correctOrder: ["くるま", "が", "ほしい", "です"],
      promptEn: "Hear it, build it: 'I want a car.'",
    }),
    // ── もの (thing) — new noun ──
    build(
      "ja-m15-5-2-build-mono",
      "Pick the Japanese word for: Thing",
      "もの",
      ["みず", "くるま", "もの", "かばん"],
      ["もの"],
    ),
    build(
      "ja-m15-5-2-build-mono-sentence",
      "Ask: What do you want? (literally: the thing you want is what?)",
      "ほしいものは なんですか",
      ["は", "もの", "です", "なんですか", "が", "ほしい"],
      ["ほしい", "もの", "は", "なんですか"],
    ),
    selfExplain({
      id: "ja-m15-5-2-self-contrast",
      anchorLabel: "たい vs ほしい — two kinds of wanting",
      anchorAudioText: "コーヒーが ほしいです",
      question: "When do you use ほしい vs たい?",
      rule: { text: "ほしい = want a THING (noun + が ほしい). たい = want to DO something (verb stem + たい). They're complementary patterns for different types of desires." },
      surface: { text: "ほしい is for expensive things; たい is for cheap things." },
      distractor: { text: "ほしい is polite and たい is casual — they both mean the same thing." },
      ruleExplanation: "Two patterns: (1) thing + が ほしい = want to have. (2) verb stem + たい = want to do. Choose based on whether the desire is for an object or an action.",
    }),
    speaking(
      "ja-m15-5-2-speak-hoshii",
      "やすみが ほしいです",
      "I want a vacation.",
    ),
    translateStep({
      id: "ja-m15-5-2-translate",
      promptEn: "I don't want to work tomorrow.",
      acceptedAnswers: [
        "あした はたらきたくないです",
        "あしたはたらきたくないです",
      ],
    }),
    // ── Review tail ──
    vocabMcq("ja-m15-5-2-rev-mcq-1", M15_5_2_REVIEW[0], M15_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m15-5-2-rev-lc-1",
      audioText: M15_5_2_REVIEW[1].kana,
      correctMeaningEn: M15_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M15_5_2_REVIEW[2].meaningEn,
        M15_5_2_REVIEW[3].meaningEn,
        M15_REVIEW_POOL[3].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m15-5-2-rev", M15_5_2_REVIEW),
    infoStep(
      "ja-m15-5-2-info-end",
      "You can express any desire — things and actions, positive and negative",
      "ほしい + たい + their くない negatives. A full toolkit for saying what you want and don't want.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_5_2.steps);
assertAnswerRotation(M15_5_2.steps, 1);
assertNoConsecutiveSame(M15_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-6-1 — "But..." (けど contrastive + combined wants)
// ═══════════════════════════════════════════════════════════════════════

const M15_6_1_REVIEW = pickReviewAtoms("ja-m15-6-1-rev", M15_REVIEW_POOL, 4);

export const M15_6_1: LessonContent = {
  id: "ja-m15-6-1",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "But... (intro)",
  description:
    "けど connects contrasting clauses — 'I want to, but...' Combine with たい and ほしい for real-world expressions.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m15-6-1-info-open",
      "The power of 'but'",
      "けど = 'but.' Attach it after です/ます at the end of a clause. たべたいですけど、じかんが ないです — 'I want to eat, but I have no time.'",
    ),
    RULE_KEDO,
    // ── けど drills ──
    build(
      "ja-m15-6-1-build-kedo-1",
      "Say: I want to eat, but I have no time.",
      "たべたいですけど じかんが ないです",
      ["じかん", "あります", "けど", "たべたい", "が", "ないです", "です"],
      ["たべたい", "です", "けど", "じかん", "が", "ないです"],
    ),
    listeningCompSentence({
      id: "ja-m15-6-1-lc-kedo-1",
      audioText: "ゲームを したいですけど じかんが ないです",
      correctMeaningEn: "I want to play a game, but I have no time.",
      distractorsEn: [
        "I played a game, but it was boring.",
        "I don't want to play because I have no time.",
        "I want to play a game and I have time.",
      ],
    }),
    cloze(
      "ja-m15-6-1-cloze-kedo-1",
      "いきたいです",
      " おかねが ないです。",
      "けど",
      ["けど", "から", "が", "も"],
      "I want to go, but I have no money.",
      "いきたいですけど おかねが ないです。",
      "けど connects the two clauses with a 'but' meaning.",
    ),
    sentenceMcq({
      id: "ja-m15-6-1-mcq-kedo",
      prompt: "Which sentence means 'Japanese is fun, but difficult'?",
      correctKana: "にほんごは たのしいですけど、むずかしいです。",
      distractorsKana: [
        "にほんごは たのしいです。むずかしいです。",
        "にほんごは むずかしいですけど、つまらないです。",
        "にほんごは たのしくないですけど、かんたんです。",
      ],
      explanation: "たのしいですけど、むずかしいです = 'fun but difficult.' けど links the contrast.",
    }),
    build(
      "ja-m15-6-1-build-kedo-2",
      "Say: I want a car, but I have no money.",
      "くるまが ほしいですけど おかねが ないです",
      ["おかね", "が", "あります", "ないです", "けど", "です", "ほしい", "が", "くるま"],
      ["くるま", "が", "ほしい", "です", "けど", "おかね", "が", "ないです"],
    ),
    listeningCompSentence({
      id: "ja-m15-6-1-lc-kedo-2",
      audioText: "にほんに いきたいですけど いそがしいです",
      correctMeaningEn: "I want to go to Japan, but I'm busy.",
      distractorsEn: [
        "I went to Japan and was busy.",
        "I'm going to Japan because I'm free.",
        "I don't want to go to Japan.",
      ],
    }),
    cloze(
      "ja-m15-6-1-cloze-kedo-2",
      "りょこうしたいです",
      " やすみが ないです。",
      "けど",
      ["けど", "から", "も", "が"],
      "I want to travel, but I have no vacation.",
      "りょこうしたいですけど やすみが ないです。",
      "けど after です links the two contrasting clauses.",
    ),
    build(
      "ja-m15-6-1-build-kedo-3",
      "Say: It's expensive, but I want it.",
      "たかいですけど ほしいです",
      ["けど", "やすい", "ほしくない", "たかい", "です", "ほしい", "です"],
      ["たかい", "です", "けど", "ほしい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m15-6-1-lb-kedo",
      target: "ほんを よみたいですけど じかんが ないです",
      tiles: ["よみたい", "けど", "を", "じかん", "が", "ほん", "です", "ないです"],
      correctOrder: ["ほん", "を", "よみたい", "です", "けど", "じかん", "が", "ないです"],
      promptEn: "Hear it, build it: 'I want to read a book, but I have no time.'",
    }),
    sentenceMcq({
      id: "ja-m15-6-1-mcq-kedo-2",
      prompt: "What does このえいがは おもしろいですけど、ながいです mean?",
      correctKana: "This movie is interesting, but long.",
      distractorsKana: [
        "This movie is boring and short.",
        "This movie is interesting and short.",
        "This long movie is interesting.",
      ],
      explanation: "おもしろいですけど、ながいです = 'interesting but long.'",
    }),
    selfExplain({
      id: "ja-m15-6-1-self-kedo",
      anchorLabel: "けど connects contrasting ideas",
      anchorAudioText: "たべたいですけど じかんが ないです",
      question: "Where does けど attach in the sentence?",
      rule: { text: "けど attaches directly after the predicate (です/ます/adjective) of the first clause. It connects to whatever comes before it — いきたいですけど, たのしいですけど." },
      surface: { text: "けど goes at the beginning of the second clause, like English 'but.'" },
      distractor: { text: "けど can go anywhere in the sentence — before or after the verb." },
      ruleExplanation: "けど is a clause-final conjunction. It attaches to the end of clause A: [clause A + けど] [clause B].",
    }),
    speaking(
      "ja-m15-6-1-speak-kedo",
      "にほんに いきたいですけど おかねが ないです",
      "I want to go to Japan, but I have no money.",
    ),
    translateStep({
      id: "ja-m15-6-1-translate",
      promptEn: "I want to eat, but I have no time.",
      acceptedAnswers: [
        "たべたいですけど じかんが ないです",
        "たべたいですけど、じかんがないです",
        "たべたいですけどじかんがないです",
      ],
    }),
    // ── Review tail ──
    vocabMcq("ja-m15-6-1-rev-mcq-1", M15_6_1_REVIEW[0], M15_REVIEW_POOL),
    speaking("ja-m15-6-1-rev-speak-1", M15_6_1_REVIEW[1].kana, M15_6_1_REVIEW[1].meaningEn),
    reviewMatchPairs("ja-m15-6-1-rev", M15_6_1_REVIEW),
    infoStep(
      "ja-m15-6-1-info-end",
      "You can express contrasts and conflicting desires",
      "けど turns two simple sentences into one nuanced thought. 'I want to, but...' — the start of real conversational Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_6_1.steps);
assertAnswerRotation(M15_6_1.steps, 1); // TODO(wave-N): tighten — single-particle intro (けど only)
assertNoConsecutiveSame(M15_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-6-2 — "But..." practice (けど + ている + たい + ほしい mixed)
// ═══════════════════════════════════════════════════════════════════════

const M15_6_2_REVIEW = pickReviewAtoms("ja-m15-6-2-rev", M15_REVIEW_POOL, 4);

export const M15_6_2: LessonContent = {
  id: "ja-m15-6-2",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "But... (practice)",
  description:
    "Mixed drill combining けど with ている, たい, and ほしい. Real conversational patterns.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m15-6-2-info-open",
      "Putting it all together",
      "ている + たい + ほしい + けど — mix all four M15 patterns in natural sentences.",
    ),
    // ── Combined pattern drills ──
    cloze(
      "ja-m15-6-2-cloze-combo-1",
      "えいがを みたいです",
      " いそがしいです。",
      "けど",
      ["けど", "から", "も", "が"],
      "I want to watch a movie, but I'm busy.",
      "えいがを みたいですけど いそがしいです。",
      "けど links the desire (みたい) with the obstacle (いそがしい).",
    ),
    build(
      "ja-m15-6-2-build-combo-1",
      "Say: I'm studying, but I want to play a game.",
      "べんきょうしていますけど ゲームを したいです",
      ["います", "を", "したい", "して", "けど", "べんきょう", "ゲーム", "です"],
      ["べんきょう", "して", "います", "けど", "ゲーム", "を", "したい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m15-6-2-lc-combo-1",
      audioText: "おかねが ほしいですけど はたらきたくないです",
      correctMeaningEn: "I want money, but I don't want to work.",
      distractorsEn: [
        "I have money and I work.",
        "I want to work for money.",
        "I don't want money or work.",
      ],
    }),
    sentenceMcq({
      id: "ja-m15-6-2-mcq-combo-1",
      prompt: "Which sentence means 'I'm watching TV, but I'm bored'?",
      correctKana: "テレビを みていますけど、つまらないです。",
      distractorsKana: [
        "テレビを みたいですけど、たのしいです。",
        "テレビを みましたけど、つまらないです。",
        "テレビは おもしろいですけど、みません。",
      ],
      explanation: "みています = am watching (progressive); けど = but; つまらない = boring.",
    }),
    cloze(
      "ja-m15-6-2-cloze-combo-2",
      "さんぽを したいです",
      " あめです。",
      "けど",
      ["けど", "から", "も", "は"],
      "I want to take a walk, but it's raining.",
      "さんぽを したいですけど あめです。",
      "けど connects the desire with the obstacle.",
    ),
    build(
      "ja-m15-6-2-build-combo-2",
      "Say: Japanese is difficult, but fun.",
      "にほんごは むずかしいですけど たのしいです",
      ["です", "にほんご", "たのしい", "は", "です", "けど", "むずかしい"],
      ["にほんご", "は", "むずかしい", "です", "けど", "たのしい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m15-6-2-lc-combo-2",
      audioText: "ゲームを かいたいですけど おかねが ないです",
      correctMeaningEn: "I want to buy a game, but I have no money.",
      distractorsEn: [
        "I bought a game with my money.",
        "I don't want to buy a game.",
        "I have money but no game.",
      ],
    }),
    // ── ている + question patterns ──
    build(
      "ja-m15-6-2-build-question",
      "Ask: What do you want to eat?",
      "なにを たべたいですか",
      ["たべて", "なに", "を", "たべます", "たべたい", "ですか"],
      ["なに", "を", "たべたい", "ですか"],
    ),
    cloze(
      "ja-m15-6-2-cloze-doko",
      "どこで ",
      "ですか。",
      "たべたい",
      ["たべたい", "たべます", "たべて", "たべました"],
      "Where do you want to eat?",
      "どこで たべたいですか。",
      "どこで = where (an action happens). たべたいですか = do you want to eat?",
    ),
    sentenceMcq({
      id: "ja-m15-6-2-mcq-nani",
      prompt: "What does なにが ほしいですか mean?",
      correctKana: "What do you want? (a thing)",
      distractorsKana: [
        "What are you doing?",
        "What did you buy?",
        "What do you want to do?",
      ],
      explanation: "なにが ほしいですか = 'What (thing) do you want?' が + ほしい for things.",
    }),
    listeningBuildSentence({
      id: "ja-m15-6-2-lb-combo",
      target: "なにを たべたいですか",
      tiles: ["たべたい", "なに", "たべました", "を", "ですか", "たべます"],
      correctOrder: ["なに", "を", "たべたい", "ですか"],
      promptEn: "Hear it, build it: 'What do you want to eat?'",
    }),
    selfExplain({
      id: "ja-m15-6-2-self-combo",
      anchorLabel: "たべたいですけど、じかんがないです combines two patterns",
      anchorAudioText: "たべたいですけど じかんがないです",
      question: "How does けど interact with たい?",
      rule: { text: "けど attaches after ですin the first clause. たべたいです + けど = 'I want to eat, but...' The たい remains unchanged; けど just connects the clauses." },
      surface: { text: "たい changes to a different form when けど is added after it." },
      distractor: { text: "けど replaces です when used with たい — you say たべたいけど, not たべたいですけど." },
      ruleExplanation: "In polite speech: verb + たいです + けど. けど attaches to the predicate ending. The たい conjugation is unaffected.",
    }),
    speaking(
      "ja-m15-6-2-speak-combo",
      "りょこうしたいですけど おかねが ないです",
      "I want to travel, but I have no money.",
    ),
    translateStep({
      id: "ja-m15-6-2-translate",
      promptEn: "Where do you want to go?",
      acceptedAnswers: [
        "どこに いきたいですか",
        "どこにいきたいですか",
      ],
    }),
    // ── Review tail ──
    speaking("ja-m15-6-2-rev-speak-1", M15_6_2_REVIEW[0].kana, M15_6_2_REVIEW[0].meaningEn),
    vocabMcq("ja-m15-6-2-rev-mcq-1", M15_6_2_REVIEW[1], M15_REVIEW_POOL),
    reviewMatchPairs("ja-m15-6-2-rev", M15_6_2_REVIEW),
    infoStep(
      "ja-m15-6-2-info-end",
      "You can combine desires, observations, and contrasts in one sentence",
      "ている + たい + ほしい + けど — four patterns woven together. You're building complex, natural Japanese sentences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_6_2.steps);
assertAnswerRotation(M15_6_2.steps, 1);
assertNoConsecutiveSame(M15_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-STORY — Narrative: dreaming of a Kyoto trip
//   (storyComprehension closer — たい + ほしい + けど + ている in one story)
// ═══════════════════════════════════════════════════════════════════════

export const M15_STORY: LessonContent = {
  id: "ja-m15-story",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Dreaming of Kyoto",
  description:
    "Follow ゆき as she plans her first trip to Kyoto — desires, obstacles, and what everyone's doing right now.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m15-story-info-open",
      "Story time — Dreaming of Kyoto",
      "ゆき is planning her first trip to Kyoto. Listen for what she wants to do (たい), what's in the way (けど), and what's happening right now (ている).",
    ),
    vocabMcq(
      "ja-m15-story-warmup-ryokou",
      { kana: "りょこう", meaningEn: "travel", emoji: "✈️", fromModule: "m15" },
      M15_REVIEW_POOL,
    ),
    ...storyComprehension({
      idPrefix: "ja-m15-story-scene-1",
      narrative: [
        { kana: "つぎの やすみに きょうとに いきたいです。" },
        { kana: "はじめて きょうとに いきます。" },
        { kana: "おてらを みたいです。" },
        { kana: "ともだちの たけしも いきたいですけど、おかねが ないです。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "Where does ゆき want to go on her next vacation?",
          correctText: "Kyoto.",
          distractors: ["Tokyo.", "Osaka.", "The sea."],
          explanation: "きょうとに いきたいです = 'I want to go to Kyoto.'",
        },
        {
          id: "s1-q2",
          prompt: "Has ゆき been to Kyoto before?",
          correctText: "No — it's her first time.",
          distractors: ["Yes, many times.", "Yes, once.", "The story doesn't say."],
          explanation: "はじめて きょうとに いきます = 'I'm going to Kyoto for the first time.'",
        },
        {
          id: "s1-q3",
          prompt: "What's たけし's problem?",
          correctText: "He has no money.",
          distractors: ["He has no time.", "He doesn't like Kyoto.", "He's sick."],
          explanation: "おかねが ないです = 'He has no money.'",
        },
      ],
      responseBuild: {
        target: "きょうとに いきたいです",
        tiles: ["いきたくない", "に", "きょうと", "いきたい", "いきます", "です"],
        correctOrder: ["きょうと", "に", "いきたい", "です"],
        promptEn: "Say it like ゆき: 'I want to go to Kyoto.'",
      },
    }),
    cloze(
      "ja-m15-story-cloze-mitai",
      "おてらを ",
      "です。",
      "みたい",
      ["みたい", "みます", "みて", "みたくない"],
      "I want to see temples.",
      "おてらを みたいです。",
      "みます → み + たい = 'want to see.'",
    ),
    listeningCompSentence({
      id: "ja-m15-story-lc-hajimete",
      audioText: "はじめて きょうとに いきます",
      correctMeaningEn: "I'm going to Kyoto for the first time.",
      distractorsEn: [
        "I always go to Kyoto.",
        "I went to Kyoto last year.",
        "I want to go to Kyoto again.",
      ],
    }),
    ...storyComprehension({
      idPrefix: "ja-m15-story-scene-2",
      narrative: [
        { kana: "わたしは いま りょこうの ほんを よんでいます。" },
        { kana: "きょうとで おいしい りょうりを たべたいです。" },
        { kana: "たけしも たべたいです。" },
        { kana: "たけしは いま はたらいています。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "What is ゆき doing right now?",
          correctText: "Reading a travel book.",
          distractors: ["Working.", "Cooking.", "Watching a movie."],
          explanation: "りょこうの ほんを よんでいます = 'I'm reading a travel book.'",
        },
        {
          id: "s2-q2",
          prompt: "What does ゆき want to do in Kyoto?",
          correctText: "Eat delicious food.",
          distractors: ["Go shopping.", "Play games.", "Take a walk."],
          explanation: "おいしい りょうりを たべたいです = 'I want to eat delicious food.'",
        },
        {
          id: "s2-q3",
          prompt: "What is たけし doing right now?",
          correctText: "Working.",
          distractors: ["Reading.", "Traveling.", "Sleeping."],
          explanation: "はたらいています = 'is working' (progressive ている).",
        },
      ],
      responseBuild: {
        target: "おいしい りょうりを たべたいです",
        tiles: ["たべたい", "おいしい", "たべて", "を", "りょうり", "です"],
        correctOrder: ["おいしい", "りょうり", "を", "たべたい", "です"],
        promptEn: "Say it like ゆき: 'I want to eat delicious food.'",
      },
    }),
    listeningBuildSentence({
      id: "ja-m15-story-lb-yondeimasu",
      target: "りょこうの ほんを よんでいます",
      tiles: ["を", "の", "ほん", "います", "よんで", "よみます", "りょこう"],
      correctOrder: ["りょこう", "の", "ほん", "を", "よんで", "います"],
      promptEn: "Hear it, build it: 'I'm reading a travel book.'",
    }),
    speaking(
      "ja-m15-story-speak-1",
      "きょうとに いきたいです",
      "I want to go to Kyoto.",
    ),
    sentenceMcq({
      id: "ja-m15-story-mcq-summary",
      prompt: "What do both ゆき and たけし want?",
      correctKana: "To go to Kyoto and eat delicious food.",
      distractorsKana: [
        "To stay home and work.",
        "To read travel books together.",
        "To move to Kyoto.",
      ],
      explanation: "Both want to go (いきたい) and both want to eat delicious food (たべたい).",
    }),
    speaking(
      "ja-m15-story-speak-2",
      "おいしい りょうりを たべたいです",
      "I want to eat delicious food.",
    ),
    infoStep(
      "ja-m15-story-info-end",
      "You followed a real plan — desires, obstacles, and all",
      "いきたいです, たべたいです, いきたいですけど おかねが ないです, よんでいます — one story wove together every M15 pattern.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M15_STORY.steps);
assertPassiveCardsHaveFollowup(M15_STORY.steps);
assertNoExplanationOnPassive(M15_STORY.steps);
assertExplanationDoesntLeakAnswer(M15_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-7-1 — Mixed drill (ている + てもいい + たい + ほしい + けど)
// ═══════════════════════════════════════════════════════════════════════

const M15_7_1_REVIEW = pickReviewAtoms("ja-m15-7-1-rev", M15_REVIEW_POOL, 5);

export const M15_7_1: LessonContent = {
  id: "ja-m15-7-1",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed drill",
  description:
    "All five M15 patterns in rotation: ている, てもいいですか, たい, ほしい, けど. Comprehensive practice.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m15-7-1-info-open",
      "Everything you've learned in M15",
      "Five patterns, one drill. ている, てもいいですか, たい, ほしい, けど — let's see how well they stick.",
    ),
    // ── ている review ──
    cloze(
      "ja-m15-7-1-cloze-teiru",
      "いま ほんを よんで",
      "。",
      "います",
      ["います", "ます", "いません", "ました"],
      "I'm reading a book right now.",
      "いま ほんを よんでいます。",
      "て-form + います = progressive.",
    ),
    sentenceMcq({
      id: "ja-m15-7-1-mcq-teiru",
      prompt: "Which sentence means 'She lives in Osaka'?",
      correctKana: "おおさかに すんでいます。",
      distractorsKana: [
        "おおさかに すみます。",
        "おおさかに いきます。",
        "おおさかに いきたいです。",
      ],
      explanation: "すんでいます = 'lives (in)' — resultative ている.",
    }),
    // ── てもいい review ──
    build(
      "ja-m15-7-1-build-temoii",
      "Ask: May I use this?",
      "これを つかってもいいですか",
      ["も", "つかって", "いいですか", "を", "これ", "つかいます"],
      ["これ", "を", "つかって", "も", "いいですか"],
    ),
    listeningCompSentence({
      id: "ja-m15-7-1-lc-temoii",
      audioText: "ここで たべてもいいですか",
      correctMeaningEn: "May I eat here?",
      distractorsEn: [
        "I'm eating here.",
        "I ate here.",
        "I want to eat here.",
      ],
    }),
    // ── たい review ──
    cloze(
      "ja-m15-7-1-cloze-tai",
      "コーヒーを ",
      "です。",
      "のみたい",
      ["のみたい", "のみます", "のんで", "のみたくない"],
      "I want to drink coffee.",
      "コーヒーを のみたいです。",
      "のみます → のみたい. Want to do.",
    ),
    build(
      "ja-m15-7-1-build-tai",
      "Say: I don't want to go home.",
      "かえりたくないです",
      ["です", "かえります", "かえりたい", "かえって", "かえりたくない"],
      ["かえりたくない", "です"],
    ),
    // ── ほしい review ──
    sentenceMcq({
      id: "ja-m15-7-1-mcq-hoshii",
      prompt: "Which sentence correctly says 'I want a new computer'?",
      correctKana: "あたらしい パソコンが ほしいです。",
      distractorsKana: [
        "あたらしい パソコンを ほしいです。",
        "あたらしい パソコンが ほしいます。",
        "あたらしい パソコンを かいたいです。",
      ],
      explanation: "Want a THING = thing + が ほしい.",
    }),
    cloze(
      "ja-m15-7-1-cloze-hoshii",
      "あたらしい かばん",
      " ほしいです。",
      "が",
      ["が", "を", "は", "の"],
      "I want a new bag.",
      "あたらしい かばんが ほしいです。",
      "ほしい takes が for the wanted thing.",
    ),
    listeningCompSentence({
      id: "ja-m15-7-1-lc-mono",
      audioText: "ほしいものは なんですか",
      correctMeaningEn: "What (thing) do you want?",
      distractorsEn: [
        "What do you want to do?",
        "Where do you want to go?",
        "What are you doing?",
      ],
    }),
    // ── けど review ──
    build(
      "ja-m15-7-1-build-kedo",
      "Say: I want to travel, but I'm busy.",
      "りょこうしたいですけど いそがしいです",
      ["けど", "ひま", "いそがしい", "りょこう", "したい", "です", "です"],
      ["りょこう", "したい", "です", "けど", "いそがしい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m15-7-1-lc-kedo",
      audioText: "かいものを したいですけど おかねが ないです",
      correctMeaningEn: "I want to go shopping, but I have no money.",
      distractorsEn: [
        "I went shopping and spent all my money.",
        "I don't want to go shopping.",
        "I have money for shopping.",
      ],
    }),
    // ── Mixed production ──
    listeningBuildSentence({
      id: "ja-m15-7-1-lb-mixed",
      target: "なにを したいですか",
      tiles: ["ですか", "します", "を", "したい", "なに", "しました"],
      correctOrder: ["なに", "を", "したい", "ですか"],
      promptEn: "Hear it, build it: 'What do you want to do?'",
    }),
    translateStep({
      id: "ja-m15-7-1-translate",
      promptEn: "I'm listening to music right now.",
      acceptedAnswers: [
        "いま おんがくを きいています",
        "いまおんがくをきいています",
        "おんがくを きいています",
      ],
    }),
    selfExplain({
      id: "ja-m15-7-1-self-mixed",
      anchorLabel: "Five M15 patterns working together",
      anchorAudioText: "いきたいですけど おかねがないです",
      question: "What's the difference between いきたい and いっています?",
      rule: { text: "いきたい = 'want to go' (desire, using たい). いっています would mean 'is going' (ongoing action, using ている progressive). Desire vs. current action." },
      surface: { text: "いきたい is polite; いっています is casual. They mean the same thing." },
      distractor: { text: "いきたい is future tense; いっています is past tense." },
      ruleExplanation: "たい = desire ('want to X'). ている = progressive ('is X-ing'). Completely different grammatical meanings.",
    }),
    speaking(
      "ja-m15-7-1-speak-mixed",
      "どこに いきたいですか",
      "Where do you want to go?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m15-7-1-rev-mcq-1", M15_7_1_REVIEW[0], M15_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m15-7-1-rev-lc-1",
      audioText: M15_7_1_REVIEW[1].kana,
      correctMeaningEn: M15_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M15_7_1_REVIEW[2].meaningEn,
        M15_7_1_REVIEW[3].meaningEn,
        M15_7_1_REVIEW[4].meaningEn,
      ],
    }),
    speaking("ja-m15-7-1-rev-speak-1", M15_7_1_REVIEW[2].kana, M15_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m15-7-1-rev", M15_7_1_REVIEW),
    infoStep(
      "ja-m15-7-1-info-end",
      "You can use all five M15 patterns together",
      "ている, てもいいですか, たい, ほしい, けど — woven together, these unlock real conversational Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_7_1.steps);
assertAnswerRotation(M15_7_1.steps, 1);
assertNoConsecutiveSame(M15_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M15-7-2 — Production (heavy build + speaking + translate)
// ═══════════════════════════════════════════════════════════════════════

const M15_7_2_REVIEW = pickReviewAtoms("ja-m15-7-2-rev", M15_REVIEW_POOL, 5);

export const M15_7_2: LessonContent = {
  id: "ja-m15-7-2",
  moduleId: "m15",
  courseId: COURSE,
  languageId: LANG,
  title: "Production",
  description:
    "Production-heavy lesson — build, speak, and translate sentences using all M15 grammar. Final module drill.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m15-7-2-info-open",
      "Show what you know",
      "No more hand-holding. Build sentences, speak them, write them. All five M15 patterns — from memory.",
    ),
    // ── Production: ている ──
    build(
      "ja-m15-7-2-build-teiru-1",
      "Say: My friend is studying.",
      "ともだちは べんきょうしています",
      ["います", "して", "しました", "します", "べんきょう", "は", "ともだち"],
      ["ともだち", "は", "べんきょう", "して", "います"],
    ),
    speaking(
      "ja-m15-7-2-speak-teiru",
      "いま ごはんを たべています",
      "I'm eating a meal right now.",
    ),
    // ── Production: てもいい ──
    build(
      "ja-m15-7-2-build-temoii-1",
      "Ask: May I drink water?",
      "みずを のんでもいいですか",
      ["を", "いいですか", "いいです", "みず", "のみます", "も", "のんで"],
      ["みず", "を", "のんで", "も", "いいですか"],
    ),
    speaking(
      "ja-m15-7-2-speak-temoii",
      "しゃしんを とってもいいですか",
      "May I take a photo?",
    ),
    // ── Production: たい ──
    build(
      "ja-m15-7-2-build-tai-1",
      "Say: I want to go to Osaka.",
      "おおさかに いきたいです",
      ["に", "です", "いきたい", "いきます", "いきたくない", "おおさか"],
      ["おおさか", "に", "いきたい", "です"],
    ),
    speaking(
      "ja-m15-7-2-speak-tai",
      "やまに いきたいです",
      "I want to go to the mountains.",
    ),
    translateStep({
      id: "ja-m15-7-2-translate-1",
      promptEn: "I don't want to eat right now.",
      acceptedAnswers: [
        "いま たべたくないです",
        "いまたべたくないです",
      ],
    }),
    // ── Production: ほしい ──
    build(
      "ja-m15-7-2-build-hoshii-1",
      "Say: I want a new book.",
      "あたらしい ほんが ほしいです",
      ["です", "ほしい", "あたらしい", "を", "が", "ほしくない", "ほん"],
      ["あたらしい", "ほん", "が", "ほしい", "です"],
    ),
    speaking(
      "ja-m15-7-2-speak-hoshii",
      "おかねが ほしいです",
      "I want money.",
    ),
    // ── Production: けど ──
    build(
      "ja-m15-7-2-build-kedo-1",
      "Say: I want to buy it, but it's expensive.",
      "かいたいですけど たかいです",
      ["です", "たかい", "です", "やすい", "かいます", "かいたい", "けど"],
      ["かいたい", "です", "けど", "たかい", "です"],
    ),
    translateStep({
      id: "ja-m15-7-2-translate-2",
      promptEn: "I want to go, but I'm busy.",
      acceptedAnswers: [
        "いきたいですけど いそがしいです",
        "いきたいですけどいそがしいです",
        "いきたいですけど、いそがしいです",
      ],
    }),
    // ── Combined production ──
    listeningBuildSentence({
      id: "ja-m15-7-2-lb-combo",
      target: "えいがを みたいですけど じかんが ないです",
      tiles: ["が", "を", "みたい", "ないです", "じかん", "えいが", "けど", "です"],
      correctOrder: ["えいが", "を", "みたい", "です", "けど", "じかん", "が", "ないです"],
      promptEn: "Hear it, build it: 'I want to watch a movie, but I have no time.'",
    }),
    speaking(
      "ja-m15-7-2-speak-combo",
      "りょこうしたいですけど やすみが ないです",
      "I want to travel, but I have no vacation.",
    ),
    selfExplain({
      id: "ja-m15-7-2-self-final",
      anchorLabel: "ている, てもいい, たい, ほしい, けど — five patterns",
      anchorAudioText: "にほんに いきたいです",
      question: "If someone says にほんに すんでいます, are they expressing a desire?",
      rule: { text: "No — すんでいます is the resultative ている form meaning 'lives (in Japan).' It describes a current state, not a desire. The desire form would be にほんに すみたいです." },
      surface: { text: "Yes — すんでいます means they want to live in Japan." },
      distractor: { text: "すんでいます is a polite way of saying すみたい — they're the same meaning." },
      ruleExplanation: "すんでいます = resultative state ('lives in'). すみたいです = desire ('wants to live in'). Different grammar, different meaning.",
    }),
    // ── Review tail ──
    speaking("ja-m15-7-2-rev-speak-1", M15_7_2_REVIEW[0].kana, M15_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m15-7-2-rev-lc-1",
      audioText: M15_7_2_REVIEW[1].kana,
      correctMeaningEn: M15_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M15_7_2_REVIEW[2].meaningEn,
        M15_7_2_REVIEW[3].meaningEn,
        M15_7_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m15-7-2-rev-mcq-1", M15_7_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M15_REVIEW_POOL),
    speaking("ja-m15-7-2-rev-speak-2", M15_7_2_REVIEW[2].kana, M15_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m15-7-2-rev", M15_7_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m15-7-2-info-end",
      "You can express what's happening, ask permission, and voice your desires",
      "Progressive ている, permission てもいいですか, desires たい and ほしい, and contrast けど — five patterns that unlock real conversation. Module 15 complete.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M15_7_2.steps);
assertAnswerRotation(M15_7_2.steps, 1);
assertNoConsecutiveSame(M15_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M15_1_1.steps,
  ...M15_1_2.steps,
  ...M15_2_1.steps,
  ...M15_2_2.steps,
  ...M15_3_1.steps,
  ...M15_3_2.steps,
  ...M15_4_1.steps,
  ...M15_4_2.steps,
  ...M15_5_1.steps,
  ...M15_5_2.steps,
  ...M15_6_1.steps,
  ...M15_6_2.steps,
  ...M15_7_1.steps,
  ...M15_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M15_1_1, M15_1_2, M15_2_1, M15_2_2, M15_3_1, M15_3_2,
  M15_4_1, M15_4_2, M15_5_1, M15_5_2, M15_6_1, M15_6_2,
  M15_STORY, M15_7_1, M15_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
