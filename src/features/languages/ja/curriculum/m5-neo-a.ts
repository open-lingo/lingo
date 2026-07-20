/**
 * M5-NEO (first half, L1-L6) — dict-form-first course rewrite, spine s05
 * (docs/m5-neo-authoring-spec-2026-07-20.md).
 *
 * "VERBS I — dictionary form as THE verb": the rewrite's thesis module. A
 * bare dictionary-form verb is a COMPLETE casual sentence (たべる。 "I'll
 * eat" / たべる？ + rising tone / うん、たべる。), composing directly with
 * m3's contour questions and うん・そう replies. を + SOV order enter in
 * L2. Plain register throughout; です appears only as flagged recognition
 * previews from shop staff (L6). Register-explicit: every production
 * prompt names its audience ("Tell a friend: …", "Ask casually: …").
 *
 * This file: lessons 1-6. Lessons 7-12 live in m5-neo-b.ts (authored
 * separately; local helpers are deliberately DUPLICATED there rather than
 * cross-imported, per the spec's file-layout note). Registration, barrel,
 * tests and TTS are wired after both halves land — nothing here touches
 * mockLessons/mockCourse/manifest.
 *
 * Constraints honored (pinned invariants + concept-type guide):
 *  - Image-MCQ-first (invariant 30, guide §13.2): the imageable verbs
 *    たべる🍽️ みる👁️ のむ🥤 かう🛒 いく🚶 and the food noun ごはん🍚 each
 *    make their FIRST appearance on a vocabMcq (word → image), then a
 *    speaking beat, THEN sentence use. Rubric-blocked する/やる/くる (no
 *    honest emoji — invariant 4/6) keep the build/LC/rule-card intro. No
 *    teaching lesson opens on a dialogue (invariant 30): dialogues are
 *    closers, after the word + concept + builds are established.
 *  - L1 たべる/みる: image-MCQ intro → speaking → the rule card, which now
 *    teaches verbs-take-no-だ explicitly (invariant 31): a verb is ALREADY
 *    a whole sentence (たべる, never たべるだ); だ finishes NOUNS (ねこだ).
 *    The antiPattern (たべるだ。) is a genuine learner error against
 *    examples[0] (たべる。). Verb-class flag is one line on the card
 *    ("たべる is a る-verb"), no classification drills.
 *  - L2 を: ごはん🍚 image-MCQ opens (word first), THEN the を rule card
 *    (new structural particle, invariant 24 — を's own first exposure is
 *    still the card). Anti-pattern is the genuine order error
 *    (たべるを ごはん) as a full-sentence minimal pair (invariant 12
 *    semantic contract). particle_cloze is legal for を from this lesson
 *    (invariant 5). Full-sentence recognition MCQs are converted to builds
 *    (invariant 28); production prompts are plain "Build/Translate: <En>"
 *    with no scenario wrappers (invariant 29).
 *  - L3 のむ/かう, L4 いく/くる (bare motion, NO destinations — に is
 *    later; くる flagged irregular), L5 する/やる (する flagged irregular;
 *    やる = casual する, CEJC #36; both rubric-blocked → intro via
 *    dialogue + rule card + builds, never image MCQs — invariant 4/6).
 *    やる is never a tile-bank distractor for a する target (both would
 *    grade as correct Japanese — genuine-error discipline).
 *  - L6 story: integrates, doesn't introduce grammar (no rule cards).
 *    これ、いくら？ rides the m3 contour; clerk です lines
 *    (ひゃくえんです — ひゃく is an m2 atom, so the price is parseable)
 *    are flagged-recognition register previews via LC explanations.
 *    いらっしゃいませ/ありがとうございます enter as situated chunks
 *    (guide type 5) on dialogue exposure.
 *  - Invariant 26: every teaching lesson carries exactly ONE `-capstone`
 *    step (build/translate/listening_build) right before the review tail,
 *    combining the lesson's new verb with ≥2 earlier-module concepts
 *    (の, これ/それ/あれ, だれ/なに, は/も).
 *  - Invariant 27 (exposure audit): ごはん is THE food carrier (L2 core
 *    sentence + L1 decode-build); うん/そう recur in dialogue replies;
 *    ありがとう callback in L5; ありがとうございます register pair in the
 *    L6 story. がくせい/せんせい/ともだち are NOT used as authored
 *    carriers (over-exposed) — object/food nouns carry instead.
 *  - Glosses (invariant 17): plain non-past activity verbs gloss
 *    habitual/intent ("Gonna eat?", "I'll drink the water."), never
 *    progressive; motion futurates いく/くる keep "-ing"/"off" glosses.
 *  - Casual bare-verb answers are graded correct wherever a fuller SOV
 *    answer exists: translate acceptedAnswers include the を-ful form,
 *    the bare verb, and spacing variants (m3's だ-drop discipline).
 *  - Every lesson: 18-24 steps, no two adjacent same-type steps, ≤2
 *    selection taps in a row, ≥5 step types, ≤3 uses of any primary
 *    sentence, house review tail, closes on the match grid.
 *
 * Course atoms: the verb allocation already exists under old-course
 * module tags (たべる/のむ/いく/みる m7; する/くる m11; やる m15; かう
 * m25; きく/かいもの m15/24; わかる/いう future; たべもの/のみもの m21;
 * もの m24; いくら m5; を as p-wo m7) — used AS-IS, nothing re-tagged.
 * The single missing atom, おもう (L8's chunk verb, file -b), was ADDED to
 * courseAtoms.ts by this half per the spec's ownership rule.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  assertAnswerRotation,
  assertNoConsecutiveSame,
  assertNoSameAnswerCluster,
  build,
  cloze,
  dialogueListen,
  grammarRule,
  listeningBuildSentence,
  listeningCompSentence,
  M3_M7_REVIEW_POOL,
  pickReviewAtoms,
  reviewMatchPairs,
  sentenceMcq,
  speaking,
  translateStep,
  vocabMcq,
  withoutMcqBlocked,
} from "@/features/languages/ja/grammarHelpers";
import type { ListeningBuildStep } from "@/features/lesson/types";

const COURSE = "mock-1";
const LANG = "ja";

/**
 * Char-granularity `listening_build` of a single REVIEW word from its
 * m1/m2 TTS clip — the kana-decode beat of the house review tails (same
 * shape as m4-neo's local helper, duplicated per the spec's
 * no-cross-import rule for the two m5 halves).
 *
 * FIXED words only: the mora arrays are hand-tokenized, so targets must
 * never come from a seeded `pickReviewAtoms` draw (the struggle-weighted
 * path re-picks per learner and the hand mora would drift out of sync).
 * Every `word` here must already be clipped in src/pub/tts/manifest.json
 * (keyed `ja:<word>`) — all m1/m2 pool atoms are. Words rotated away from
 * m4-neo's picks (はな/ぼうし/すし/えんぴつ/まど/かお) for variety.
 */
function listeningBuildWord(
  id: string,
  word: string,
  meaningEn: string,
  mora: string[],
  distractorKana: string[],
): ListeningBuildStep {
  return {
    id,
    type: "listening_build",
    audioKey: word,
    prompt: `Listen and build the word for '${meaningEn}'`,
    targetSentence: word,
    tiles: [...mora, ...distractorKana],
    correctOrder: mora,
    granularity: "character",
    targetAnnotation: [{ surface: word, reading: word }],
  };
}

// Review pools: M1-M4 — m4 atoms now count as prior vocab. Katakana
// entries are excluded (コーヒー/ペン/カメラ-class loanwords are never
// base-readable before the M17 katakana ladder), image-blocked atoms
// filtered so the pools can feed vocabMcq directly.
const noKatakana = (a: { kana: string }) =>
  !/\p{Script=Katakana}/u.test(a.kana);
// これ/だれ/どれ/なん carry pool emoji but are rubric-blocked in
// courseAtoms (demonstratives/interrogatives — invariant 6): an image MCQ
// would hang a picture on a pointer word. Kept out of the m5 pools so a
// seeded draw can never surface them as vocabMcq targets or distractors.
const RUBRIC_BLOCKED_M4 = new Set(["これ", "だれ", "どれ", "なん"]);
const NEO_M1_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1"),
).filter(noKatakana);
const NEO_M2_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2"),
).filter(noKatakana);
const NEO_M3_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m3"),
).filter(noKatakana);
const NEO_M4_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m4"),
)
  .filter(noKatakana)
  .filter((a) => !RUBRIC_BLOCKED_M4.has(a.kana));
const NEO_PRIOR_POOL = [
  ...NEO_M1_POOL,
  ...NEO_M2_POOL,
  ...NEO_M3_POOL,
  ...NEO_M4_POOL,
];

/* ════════════════════════════════════════════════════════════════════════
 * L1 — "たべる・みる — your first verbs" (SENTENCE-PATTERN, exposure-first)
 * The thesis beat: a bare dictionary-form verb is a complete casual
 * sentence, and the m3 rising contour turns it into a question. Dialogue +
 * LC noticing first, rule card as the answer to the noticing. も-combos
 * (わたしも たべる) give builds real material before を exists.
 * ════════════════════════════════════════════════════════════════════════ */

const L1_REVIEW = pickReviewAtoms("ja-m5-neo-1-rev", NEO_M1_POOL, 6);

export const M5_NEO_1: LessonContent = {
  id: "ja-m5-neo-1",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "たべる・みる — your first verbs",
  description:
    "Say a verb and you've spoken a whole sentence: たべる。 I'll eat. Raise the tone — たべる？ — and you've asked one.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Image-MCQ intro — the WORD first (invariant 30 / guide §13.2):
    // たべる🍽️ then みる👁️ established by recognition before any sentence.
    vocabMcq(
      "ja-m5-neo-1-vmcq-taberu",
      { kana: "たべる", meaningEn: "to eat", emoji: "🍽️", fromModule: "m5" },
      NEO_M1_POOL,
    ),
    speaking("ja-m5-neo-1-speak-taberu", "たべる", "I'll eat.", ["たべる"]),
    vocabMcq(
      "ja-m5-neo-1-vmcq-miru",
      { kana: "みる", meaningEn: "to watch", emoji: "👁️", fromModule: "m5" },
      NEO_M1_POOL,
    ),
    speaking("ja-m5-neo-1-speak-miru", "みる", "I'll watch.", ["みる"]),
    // ② The rule — the verb IS a whole sentence, and takes NO だ
    // (invariant 31): the contrast with m3's noun+だ, taught explicitly.
    grammarRule({
      id: "ja-m5-neo-1-rule-dict",
      title: "The dictionary form IS the verb",
      rule:
        "たべる = 'I'll eat' all on its own — a verb is already a whole sentence. Back in m3 a NOUN needed だ to finish (ねこだ, 'it's a cat'); a verb never does. It stays たべる, never たべるだ. Raise the tone — たべる？ — and it's a question, m3-style. (たべる and みる are る-verbs — that'll matter when we start bending verbs soon.)",
      examples: [
        { ja: "たべる。", romaji: "taberu.", en: "I'll eat." },
        { ja: "ねこだ。", romaji: "neko da.", en: "It's a cat. (a NOUN takes だ)" },
        { ja: "たべる？", romaji: "taberu?", en: "Gonna eat? (voice rises)" },
      ],
      antiPattern: {
        ja: "たべるだ。",
        romaji: "taberu da.",
        en: "(broken: verb + だ)",
        why:
          "だ finishes a NOUN — ねこだ, ほんだ. A verb is already finished, so たべるだ jams two endings together. Just たべる.",
      },
      cultureNote:
        "Who eats? Whoever the moment points at — say it flat and it's usually you; aim it at a friend with a rise and it's them. Japanese trusts the room; no 'I' or 'you' needed.",
    }),
    // ③ も gives the bare verb its first combos (を doesn't exist yet).
    build(
      "ja-m5-neo-1-build-watashi-mo",
      "Build this sentence: I'll eat too.",
      "わたしも たべる",
      ["わたし", "も", "たべる", "だ"],
      ["わたし", "も", "たべる"],
      ["わたし", "も", "たべる"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-1-lc-miru-q",
      audioText: "みる？",
      question: "Telling or asking?",
      correctMeaningEn: "Gonna watch?",
      distractorsEn: ["I'll watch.", "What's that?", "Did you see it?"],
      exercisedAtomKanas: ["みる"],
    }),
    build(
      "ja-m5-neo-1-build-mika-mo",
      "Build this sentence: Mika will watch too.",
      "ミカも みる",
      ["ミカ", "も", "みる", "だ"],
      ["ミカ", "も", "みる"],
      ["も", "みる"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-1-lc-un-miru",
      audioText: "うん、みる。",
      question: "What does the reply mean?",
      correctMeaningEn: "Yeah — I'll watch.",
      distractorsEn: [
        "No — I'll eat.",
        "I already watched it.",
        "Yeah — I'll eat.",
      ],
      exercisedAtomKanas: ["うん", "みる"],
    }),
    translateStep({
      id: "ja-m5-neo-1-tr-taberu-q",
      promptEn: "Translate: Gonna eat?",
      acceptedAnswers: ["たべる？", "たべる"],
      audioText: "たべる？",
      exercisedAtomKanas: ["たべる"],
    }),
    // Quick gamified breather — emoji word check over an M1 atom.
    vocabMcq("ja-m5-neo-1-vmcq-mid", L1_REVIEW[3], NEO_M1_POOL),
    // Dialogue is a CLOSER now (invariant 30) — the Q→A exchange lands
    // after the word + rule + builds have established the concept.
    dialogueListen({
      id: "ja-m5-neo-1-dlg-mid",
      lines: [
        { speaker: "Tom", kana: "みる？" },
        { speaker: "Ken", kana: "うん、みる。" },
        { speaker: "Mika", kana: "わたしも みる。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What is Tom asking?",
          correctText: "Whether they'll watch",
          distractors: [
            "Whether they'll eat",
            "What the thing is",
            "Who's at the door",
          ],
        },
        {
          id: "q2",
          prompt: "Who's in?",
          correctText: "Ken and Mika both",
          distractors: ["Only Ken", "Only Mika", "Nobody"],
        },
      ],
      exercisedAtomKanas: ["みる", "うん", "わたし", "も"],
    }),
    sentenceMcq({
      id: "ja-m5-neo-1-mcq-miru-q",
      prompt: "Which one asks 'Gonna watch?'",
      correctKana: "みる？",
      distractorsKana: ["みる。", "たべる？", "うん、みる。"],
      explanation:
        "Same word, different tune — the rise IS the question mark.",
      exercisedAtomKanas: ["みる"],
    }),
    listeningBuildSentence({
      id: "ja-m5-neo-1-lbs-watashi-mo",
      target: "わたしも たべる",
      tiles: ["わたし", "も", "たべる", "みる"],
      correctOrder: ["わたし", "も", "たべる"],
      promptEn: "I'll eat too.",
      exercisedAtomKanas: ["わたし", "も", "たべる"],
    }),
    // ④ CAPSTONE (invariant 26) — new verb + これ (m4) + も (m3) + the m3
    // rising contour, one stretch beat before the recognition-easy tail.
    translateStep({
      id: "ja-m5-neo-1-capstone",
      promptEn: "Translate: Gonna eat this one too?",
      acceptedAnswers: [
        "これも たべる？",
        "これもたべる？",
        "これも たべる",
        "これもたべる",
      ],
      audioText: "これも たべる？",
      exercisedAtomKanas: ["これ", "も", "たべる"],
    }),
    // Review tail — M1 atoms (house idiom: LC → vocabMcq → decode-build →
    // match grid).
    listeningCompSentence({
      // Sentence-level (2026-07-20): the pool-word LC tripped the M5+
      // sentence-first ratchet — the pool noun now rides an m5 verb.
      id: "ja-m5-neo-1-rev-lc",
      // NOT を here — を is Lesson 2's own target (continuity judge
      // caught the forward-reference); L1's tail stays on m3 grammar.
      audioText: "そらだ。",
      correctMeaningEn: "It's the sky.",
      distractorsEn: [
        "It's the sea.",
        "It's a star.",
        "It's the moon.",
      ],
      exercisedAtomKanas: ["そら"],
    }),
    vocabMcq("ja-m5-neo-1-rev-mcq", L1_REVIEW[0], NEO_M1_POOL),
    // Decode of an M1/M2 review word (ごはん moved to L2's image-MCQ intro
    // so the food noun debuts on a picture, not a mora-decode — invariant
    // 30; ぼうし keeps the tail's kana-decode beat).
    listeningBuildWord(
      "ja-m5-neo-1-rev-lb-boushi",
      "ぼうし",
      "hat",
      ["ぼ", "う", "し"],
      ["ぽ", "つ", "き"],
    ),
    reviewMatchPairs("ja-m5-neo-1-rev", L1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M5_NEO_1.steps);
assertNoConsecutiveSame(M5_NEO_1.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L2 — "を — marking what you act on" (new structural particle: card FIRST)
 * ごはんを たべる SOV order. Anti-pattern is the genuine order error
 * (たべるを ごはん) as a full-sentence minimal pair. particle_cloze is
 * invariant-5-legal for を from here. ごはん is THE food carrier
 * (invariant 27); other objects are m1/m2 nouns (つき/うみ/もも/すし/
 * しゃしん/ふね), NOT the over-exposed people words.
 * ════════════════════════════════════════════════════════════════════════ */

const L2_REVIEW = pickReviewAtoms("ja-m5-neo-2-rev", NEO_M2_POOL, 6);

export const M5_NEO_2: LessonContent = {
  id: "ja-m5-neo-2",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "を — marking what you act on",
  description:
    "One kana pins down what the verb touches: ごはんを たべる — eat the rice. Thing first, を after it, verb last.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Image-MCQ intro — the food noun ごはん🍚 debuts on a picture
    // (invariant 30), BEFORE the を card that uses it as its carrier.
    vocabMcq(
      "ja-m5-neo-2-vmcq-gohan",
      { kana: "ごはん", meaningEn: "rice / a meal", emoji: "🍚", fromModule: "m5" },
      NEO_M2_POOL,
    ),
    speaking("ja-m5-neo-2-speak-gohan", "ごはん", "rice / a meal", ["ごはん"]),
    // ② The card — new structural particle (invariant 24); を's own first
    // exposure is here, after the noun is already known.
    grammarRule({
      id: "ja-m5-neo-2-rule-wo",
      title: "を — the action's target",
      rule:
        "を marks the thing the verb acts on: ごはんを たべる = 'I'll eat the rice.' Order is the skeleton of Japanese — thing + を, verb LAST, always.",
      examples: [
        {
          ja: "ごはんを たべる。",
          romaji: "gohan o taberu.",
          en: "I'll eat the rice.",
        },
        {
          ja: "しゃしんを みる。",
          romaji: "shashin o miru.",
          en: "I'll look at the photo.",
        },
      ],
      antiPattern: {
        ja: "たべるを ごはん。",
        romaji: "taberu o gohan.",
        en: "(broken: verb first, を on the verb)",
        why:
          "を rides on the THING, never the verb — and the verb closes the sentence. Thing + を + verb: ごはんを たべる.",
      },
      cultureNote:
        "Written を, said 'o' — this kana has exactly one job in the whole language, and this is it (same deal as は saying 'wa').",
    }),
    listeningCompSentence({
      id: "ja-m5-neo-2-lc-gohan",
      audioText: "ごはんを たべる。",
      question: "What does this mean?",
      correctMeaningEn: "I'll eat the rice.",
      distractorsEn: [
        "I'll eat the sushi.",
        "This is rice.",
        "Gonna eat?",
      ],
      exercisedAtomKanas: ["ごはん", "を", "たべる"],
    }),
    build(
      "ja-m5-neo-2-build-gohan",
      "Build this sentence: I'll eat the rice.",
      "ごはんを たべる",
      ["ごはん", "を", "たべる", "は"],
      ["ごはん", "を", "たべる"],
      ["ごはん", "を", "たべる"],
    ),
    cloze(
      "ja-m5-neo-2-cloze-shashin",
      "しゃしん",
      " みる。",
      "を",
      ["を", "は", "も", "の"],
      "I'll look at the photo.",
      "しゃしんを みる。",
      "The photo is what gets looked at — を pins it to the verb.",
    ),
    speaking(
      "ja-m5-neo-2-speak-tsuki",
      "つきを みる",
      "I'll look at the moon.",
      ["つき", "を", "みる"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-2-lc-sushi",
      audioText: "すしを たべる。",
      question: "What does this mean?",
      correctMeaningEn: "I'll eat the sushi.",
      distractorsEn: [
        "I'll eat the rice.",
        "This is sushi.",
        "I'll eat the peach.",
      ],
      exercisedAtomKanas: ["すし", "を", "たべる"],
    }),
    build(
      "ja-m5-neo-2-build-umi",
      "Build this sentence: I'll look at the sea.",
      "うみを みる",
      ["うみ", "を", "みる", "たべる"],
      ["うみ", "を", "みる"],
      ["うみ", "を", "みる"],
    ),
    cloze(
      "ja-m5-neo-2-cloze-momo",
      "もも",
      " たべる。",
      "を",
      ["を", "の", "は", "か"],
      "I'll eat the peach.",
      "ももを たべる。",
      "Same skeleton at every meal — thing + を + verb.",
    ),
    // Converted from a full-sentence recognition MCQ (invariant 28): a
    // build makes the learner PRODUCE the thing+を+verb order.
    build(
      "ja-m5-neo-2-build-sushi",
      "Build this sentence: I'll eat the sushi.",
      "すしを たべる",
      ["すし", "を", "たべる", "みる"],
      ["すし", "を", "たべる"],
      ["すし", "を", "たべる"],
    ),
    listeningBuildSentence({
      id: "ja-m5-neo-2-lbs-shashin",
      target: "しゃしんを みる",
      tiles: ["しゃしん", "を", "みる", "も"],
      correctOrder: ["しゃしん", "を", "みる"],
      promptEn: "I'll look at the photo.",
      exercisedAtomKanas: ["しゃしん", "を", "みる"],
    }),
    // Quick gamified breather — emoji word check over an M2 atom.
    vocabMcq("ja-m5-neo-2-vmcq-mid", L2_REVIEW[3], NEO_M2_POOL),
    // Dialogue is a CLOSER (invariant 30).
    dialogueListen({
      id: "ja-m5-neo-2-dlg-momo",
      lines: [
        { speaker: "Mika", kana: "それ、たべる？" },
        { speaker: "Tom", kana: "うん、たべる。ももだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Mika want to know?",
          correctText: "Whether Tom's gonna eat what he's holding",
          distractors: [
            "What Tom is holding",
            "Whether Tom bought it",
            "Whether it's hers",
          ],
        },
        {
          id: "q2",
          prompt: "What is Tom holding?",
          correctText: "A peach",
          distractors: ["Rice", "Sushi", "A photo"],
        },
      ],
      exercisedAtomKanas: ["それ", "たべる", "うん", "もも"],
    }),
    translateStep({
      id: "ja-m5-neo-2-tr-fune",
      promptEn: "Translate: I'll watch the boat.",
      acceptedAnswers: ["ふねを みる", "ふねをみる", "みる"],
      audioText: "ふねを みる",
      exercisedAtomKanas: ["ふね", "を", "みる"],
    }),
    // CAPSTONE (invariant 26) — spec's own L2 example: の possession (m4)
    // + an m4 object noun + the new を+verb skeleton in one build.
    build(
      "ja-m5-neo-2-capstone",
      "Build this sentence: I'll look at Tanaka's car.",
      "たなかの くるまを みる",
      ["たなか", "の", "くるま", "を", "みる", "たべる"],
      ["たなか", "の", "くるま", "を", "みる"],
      ["の", "くるま", "を", "みる"],
    ),
    // Review tail — M2 atoms (house idiom: LC → vocabMcq → decode-build →
    // match grid).
    listeningCompSentence({
      // Sentence-level (2026-07-20): the pool-word LC tripped the M5+
      // sentence-first ratchet — the pool noun now rides an m5 verb.
      id: "ja-m5-neo-2-rev-lc",
      // NOT かう here — かう is Lesson 3's own target (continuity judge
      // caught the forward-reference); L1's みる carries the を drill.
      audioText: "ぼうしを みる？",
      correctMeaningEn: "Gonna look at the hat?",
      distractorsEn: [
        "Gonna look at the bag?",
        "Gonna eat the hat?",
        "Wearing the hat?",
      ],
      exercisedAtomKanas: ["ぼうし", "みる"],
    }),
    vocabMcq("ja-m5-neo-2-rev-mcq", L2_REVIEW[0], NEO_M2_POOL),
    listeningBuildWord(
      "ja-m5-neo-2-rev-lb-megane",
      "めがね",
      "glasses",
      ["め", "が", "ね"],
      ["ぬ", "か", "れ"],
    ),
    reviewMatchPairs("ja-m5-neo-2-rev", L2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M5_NEO_2.steps);
// Both clozes target を by design — single-new-particle intro lesson
// (same ruling as m4-neo L5's の intro and m3-neo L2's は intro).
assertAnswerRotation(M5_NEO_2.steps, 1);
assertNoConsecutiveSame(M5_NEO_2.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L3 — "のむ・かう — drink it, buy it" (verb wave on the L2 skeleton)
 * みずを のむ, ほんを かう; これを かう？ starts the m4-pointer + を
 * combo naturally. ぎゅうにゅう (m2, under-used) carries alongside みず.
 * ════════════════════════════════════════════════════════════════════════ */

const L3_REVIEW = pickReviewAtoms("ja-m5-neo-3-rev", NEO_M3_POOL, 6);

export const M5_NEO_3: LessonContent = {
  id: "ja-m5-neo-3",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "のむ・かう — drink it, buy it",
  description:
    "Two more verbs onto the same skeleton: みずを のむ — drink the water; ほんを かう — buy the book. And これを かう？ — buying this one?",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Image-MCQ intro — のむ🥤 then かう🛒 established by picture first
    // (invariant 30), before the rule card that pairs them.
    vocabMcq(
      "ja-m5-neo-3-vmcq-nomu",
      { kana: "のむ", meaningEn: "to drink", emoji: "🥤", fromModule: "m5" },
      NEO_M3_POOL,
    ),
    speaking("ja-m5-neo-3-speak-nomu", "のむ", "I'll drink.", ["のむ"]),
    vocabMcq(
      "ja-m5-neo-3-vmcq-kau",
      { kana: "かう", meaningEn: "to buy", emoji: "🛒", fromModule: "m5" },
      NEO_M3_POOL,
    ),
    speaking("ja-m5-neo-3-speak-kau", "かう", "I'll buy.", ["かう"]),
    // ② The card — both verbs, one-line class flags, no drills on class.
    grammarRule({
      id: "ja-m5-neo-3-rule-nomu-kau",
      title: "のむ — drink, かう — buy",
      rule:
        "Same skeleton, new verbs: みずを のむ = 'I'll drink the water', ほんを かう = 'I'll buy the book.' Swap the thing, swap the verb — the frame never moves. (のむ and かう are う-verbs — file that away for when verbs start bending.)",
      examples: [
        { ja: "みずを のむ。", romaji: "mizu o nomu.", en: "I'll drink the water." },
        { ja: "ほんを かう。", romaji: "hon o kau.", en: "I'll buy the book." },
      ],
      // No antiPattern on purpose: the genuine order error belongs to L2's
      // を card; a fabricated ✗ here would grade correct Japanese as wrong
      // (invariant 12 contract).
      cultureNote:
        "のむ covers more than English 'drink' — soup and even medicine get のむ. If it goes down in one go, Japanese drinks it.",
    }),
    listeningCompSentence({
      id: "ja-m5-neo-3-lc-nomu",
      audioText: "みずを のむ。",
      question: "What does this mean?",
      correctMeaningEn: "I'll drink the water.",
      distractorsEn: [
        "I'll eat the rice.",
        "This is water.",
        "I'll buy the water.",
      ],
      exercisedAtomKanas: ["みず", "を", "のむ"],
    }),
    build(
      "ja-m5-neo-3-build-hon",
      "Build this sentence: I'll buy the book.",
      "ほんを かう",
      ["ほん", "を", "かう", "のむ"],
      ["ほん", "を", "かう"],
      ["ほん", "を", "かう"],
    ),
    // ぎゅうにゅう🥛 debuts on a picture (invariant 30) — it also anchors
    // the に-carrying drink noun before なに appears in the closer.
    vocabMcq(
      "ja-m5-neo-3-vmcq-gyuunyuu",
      { kana: "ぎゅうにゅう", meaningEn: "milk", emoji: "🥛", fromModule: "m5" },
      NEO_M2_POOL,
    ),
    listeningCompSentence({
      id: "ja-m5-neo-3-lc-gyuunyuu",
      audioText: "ぎゅうにゅうを のむ。",
      question: "What does this mean?",
      correctMeaningEn: "I'll drink the milk.",
      distractorsEn: [
        "I'll drink the water.",
        "I'll buy the milk.",
        "This is milk.",
      ],
      exercisedAtomKanas: ["ぎゅうにゅう", "を", "のむ"],
    }),
    translateStep({
      id: "ja-m5-neo-3-tr-mizu",
      promptEn: "Translate: I'll drink the water.",
      acceptedAnswers: ["みずを のむ", "みずをのむ", "のむ"],
      audioText: "みずを のむ",
      exercisedAtomKanas: ["みず", "を", "のむ"],
    }),
    cloze(
      "ja-m5-neo-3-cloze-keitai",
      "けいたい",
      " かう。",
      "を",
      ["を", "の", "は", "も"],
      "I'll buy a phone.",
      "けいたいを かう。",
      "The phone is what gets bought — を marks it, verb closes.",
    ),
    // ③ The m4-pointer combo starts here: これを かう.
    build(
      "ja-m5-neo-3-build-kore",
      "Build this sentence: I'll buy this one.",
      "これを かう",
      ["これ", "を", "かう", "は"],
      ["これ", "を", "かう"],
      ["これ", "を", "かう"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-3-lc-kore-kau-q",
      audioText: "これを かう？",
      question: "What does this mean?",
      correctMeaningEn: "You gonna buy this?",
      distractorsEn: [
        "I'll buy this.",
        "Gonna drink this?",
        "Is this yours?",
      ],
      exercisedAtomKanas: ["これ", "を", "かう"],
    }),
    speaking(
      "ja-m5-neo-3-speak-gyuunyuu",
      "ぎゅうにゅうを のむ",
      "I'll drink the milk.",
      ["ぎゅうにゅう", "を", "のむ"],
    ),
    // Dialogue is a CLOSER (invariant 30) — なに rides here, well after
    // ぎゅうにゅう anchored the に-carrying vocabulary.
    dialogueListen({
      id: "ja-m5-neo-3-dlg-gyuunyuu",
      lines: [
        { speaker: "Ken", kana: "それ、なに？" },
        { speaker: "Tom", kana: "ぎゅうにゅうだ。のむ？" },
        { speaker: "Ken", kana: "うん、のむ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What is Tom holding?",
          correctText: "Milk",
          distractors: ["Water", "Tea", "Juice"],
        },
        {
          id: "q2",
          prompt: "What does Ken decide?",
          correctText: "Yeah — he'll have some.",
          distractors: [
            "He'll pass.",
            "He'll buy his own.",
            "He already drank it.",
          ],
        },
      ],
      exercisedAtomKanas: ["それ", "なに", "ぎゅうにゅう", "のむ", "うん"],
    }),
    // Converted from a full-sentence recognition MCQ (invariant 28) — a
    // build makes the learner produce thing+を+verb.
    build(
      "ja-m5-neo-3-build-kaban",
      "Build this sentence: I'll buy the bag.",
      "かばんを かう",
      ["かばん", "を", "かう", "みる"],
      ["かばん", "を", "かう"],
      ["かばん", "を", "かう"],
    ),
    listeningBuildSentence({
      id: "ja-m5-neo-3-lbs-hon",
      target: "ほんを かう",
      tiles: ["ほん", "を", "かう", "みる"],
      correctOrder: ["ほん", "を", "かう"],
      promptEn: "I'll buy the book.",
      exercisedAtomKanas: ["ほん", "を", "かう"],
    }),
    // CAPSTONE (invariant 26) — の possession (m4) + an m3 object noun +
    // the new を+かう skeleton in one build.
    build(
      "ja-m5-neo-3-capstone",
      "Build this sentence: I'll buy Mika's book.",
      "ミカの ほんを かう",
      ["ミカ", "の", "ほん", "を", "かう", "わたし"],
      ["ミカ", "の", "ほん", "を", "かう"],
      ["の", "ほん", "を", "かう"],
    ),
    // Review tail — M3 atoms (house idiom: LC → vocabMcq → decode-build →
    // match grid).
    listeningCompSentence({
      // Sentence-level (2026-07-20): the pool-word LC tripped the M5+
      // sentence-first ratchet — the pool noun now rides an m5 verb.
      id: "ja-m5-neo-3-rev-lc",
      audioText: "ほんを みる。",
      correctMeaningEn: "Gonna look at the book.",
      distractorsEn: [
        "Gonna buy the book.",
        "Gonna look at the photo.",
        "Gonna eat.",
      ],
      exercisedAtomKanas: ["ほん", "みる"],
    }),
    vocabMcq("ja-m5-neo-3-rev-mcq", L3_REVIEW[0], NEO_M3_POOL),
    listeningBuildWord(
      "ja-m5-neo-3-rev-lb-kippu",
      "きっぷ",
      "ticket",
      ["き", "っ", "ぷ"],
      ["ぎ", "つ", "ぶ"],
    ),
    reviewMatchPairs("ja-m5-neo-3-rev", L3_REVIEW),
  ],
};

assertNoSameAnswerCluster(M5_NEO_3.steps);
// Single cloze (を on かう) — trivially rotated; documents intent.
assertAnswerRotation(M5_NEO_3.steps, 1);
assertNoConsecutiveSame(M5_NEO_3.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L4 — "いく・くる — off and coming" (bare motion verbs, NO destinations)
 * いく。 "I'm off" / くる？ "coming?" as complete casual sentences; くる
 * flagged irregular on the card. に is a later module — nothing here
 * takes an object or a place. Motion futurates keep "-ing" glosses
 * (invariant 17's explicit exception).
 * ════════════════════════════════════════════════════════════════════════ */

const L4_REVIEW = pickReviewAtoms("ja-m5-neo-4-rev", NEO_M4_POOL, 6);

export const M5_NEO_4: LessonContent = {
  id: "ja-m5-neo-4",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "いく・くる — off and coming",
  description:
    "Two verbs of pure motion: いく。 — I'm off. くる？ — you coming? No destination needed; the doorway does the talking.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Image-MCQ intro — いく🚶 established by picture first (invariant
    // 30). くる has no honest emoji (blocked) — it enters on the card.
    vocabMcq(
      "ja-m5-neo-4-vmcq-iku",
      { kana: "いく", meaningEn: "to go", emoji: "🚶", fromModule: "m5" },
      NEO_M4_POOL,
    ),
    speaking("ja-m5-neo-4-speak-iku", "いく", "I'm off.", ["いく"]),
    // ② The card — direction anchored to HERE; くる flagged irregular and
    // introduced here (blocked atom, no image MCQ — invariant 4/6).
    grammarRule({
      id: "ja-m5-neo-4-rule-iku-kuru",
      title: "いく — away, くる — toward",
      rule:
        "いく = moving AWAY from here; くる = moving TOWARD here. Bare, they're complete: いく。 'I'm off.' くる？ 'you coming?' No place-word needed yet — that machinery arrives later. (いく is a う-verb. くる is one of Japanese's only TWO irregular verbs — remember its face; it bends strangely later.)",
      examples: [
        { ja: "いく。", romaji: "iku.", en: "I'm off." },
        { ja: "くる？", romaji: "kuru?", en: "You coming? (voice rises)" },
        { ja: "うん、くる。", romaji: "un, kuru.", en: "Yeah — I'm coming." },
      ],
      // No antiPattern on purpose: a "wrong-direction" verb is correct
      // Japanese from the other end of the trip — contrast material,
      // never ✗ material (invariant 12 semantic contract).
      cultureNote:
        "The anchor is wherever the SPEAKER stands: your いく is their くる. Phone a friend from home — くる？ — and you've pulled the anchor to your side.",
    }),
    listeningCompSentence({
      id: "ja-m5-neo-4-lc-iku",
      audioText: "いく。",
      question: "What does this mean?",
      correctMeaningEn: "I'm off.",
      distractorsEn: ["I'm here.", "Come in.", "I'll buy it."],
      exercisedAtomKanas: ["いく"],
    }),
    build(
      "ja-m5-neo-4-build-tomu-mo",
      "Build this sentence: Tom's going too.",
      "トムも いく",
      ["トム", "も", "いく", "くる"],
      ["トム", "も", "いく"],
      ["も", "いく"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-4-lc-kuru-q",
      audioText: "くる？",
      question: "Telling or asking?",
      correctMeaningEn: "You coming (over)?",
      distractorsEn: ["You going?", "Are you here?", "Who is it?"],
      exercisedAtomKanas: ["くる"],
    }),
    speaking("ja-m5-neo-4-speak-un-kuru", "うん、くる", "Yeah — I'm coming.", [
      "うん",
      "くる",
    ]),
    build(
      "ja-m5-neo-4-build-mika-mo",
      "Build this sentence: Mika's coming too.",
      "ミカも くる",
      ["ミカ", "も", "くる", "いく"],
      ["ミカ", "も", "くる"],
      ["も", "くる"],
    ),
    // Dialogue is a CLOSER beat (invariant 30).
    dialogueListen({
      id: "ja-m5-neo-4-dlg-intro",
      lines: [
        { speaker: "Mika", kana: "いく？" },
        { speaker: "Tom", kana: "うん、いく。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Mika ask?",
          correctText: "Whether Tom's going",
          distractors: [
            "Where Tom went",
            "Whether Tom's eating",
            "Who's at the door",
          ],
        },
        {
          id: "q2",
          prompt: "Tom's answer?",
          correctText: "Yeah — he's going.",
          distractors: [
            "He's staying.",
            "He just got back.",
            "He doesn't know.",
          ],
        },
      ],
      exercisedAtomKanas: ["いく", "うん"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-4-lc-un-iku",
      audioText: "うん、いく。",
      question: "What does the reply mean?",
      correctMeaningEn: "Yeah — I'm going.",
      distractorsEn: [
        "No — I'm staying.",
        "I already went.",
        "Yeah — I'm coming to you.",
      ],
      exercisedAtomKanas: ["うん", "いく"],
    }),
    speaking(
      "ja-m5-neo-4-speak-iku-q",
      "いく？",
      "You going? (voice rises)",
      ["いく"],
    ),
    // Quick gamified breather — emoji word check over an M4 atom.
    vocabMcq("ja-m5-neo-4-vmcq-mid", L4_REVIEW[3], NEO_M4_POOL),
    sentenceMcq({
      id: "ja-m5-neo-4-mcq-kuru-q",
      prompt: "Which one asks 'You coming?'",
      correctKana: "くる？",
      distractorsKana: ["いく？", "くる。", "だれ？"],
      explanation:
        "Toward you means くる — いく would send them somewhere else.",
      exercisedAtomKanas: ["くる"],
    }),
    listeningBuildSentence({
      id: "ja-m5-neo-4-lbs-tomu-mo",
      target: "トムも いく",
      tiles: ["トム", "も", "いく", "だ"],
      correctOrder: ["トム", "も", "いく"],
      promptEn: "Tom's going too.",
      exercisedAtomKanas: ["も", "いく"],
    }),
    dialogueListen({
      id: "ja-m5-neo-4-dlg-close",
      lines: [
        { speaker: "Ken", kana: "ミカ、くる？" },
        { speaker: "Mika", kana: "うん、くる。トムも くる。" },
        { speaker: "Ken", kana: "そう。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Who's coming?",
          correctText: "Mika and Tom both",
          distractors: ["Only Mika", "Only Ken", "Nobody"],
        },
        {
          id: "q2",
          prompt: "What does Ken say at the end?",
          correctText: "I see.",
          distractors: ["No way.", "Thanks.", "Who's Tom?"],
        },
      ],
      exercisedAtomKanas: ["くる", "うん", "も", "そう"],
    }),
    // CAPSTONE (invariant 26) — new verb + も (m3) + the m3 rising
    // contour: the "is she in too?" question in one breath.
    translateStep({
      id: "ja-m5-neo-4-capstone",
      promptEn: "Translate: Is Mika coming too?",
      acceptedAnswers: [
        "ミカも くる？",
        "ミカもくる？",
        "ミカも くる",
        "ミカもくる",
      ],
      audioText: "ミカも くる？",
      exercisedAtomKanas: ["も", "くる"],
    }),
    // Review tail — M4 atoms (house idiom: LC → vocabMcq → decode-build →
    // match grid).
    listeningCompSentence({
      // Sentence-level (2026-07-20): the pool-word LC tripped the M5+
      // sentence-first ratchet — the pool noun now rides an m5 verb.
      id: "ja-m5-neo-4-rev-lc",
      audioText: "いすを かう。",
      correctMeaningEn: "Gonna buy a chair.",
      distractorsEn: [
        "Gonna buy a desk.",
        "Gonna look at a chair.",
        "Gonna make a chair.",
      ],
      exercisedAtomKanas: ["いす", "かう"],
    }),
    vocabMcq("ja-m5-neo-4-rev-mcq", L4_REVIEW[2], NEO_M4_POOL),
    listeningBuildWord(
      "ja-m5-neo-4-rev-lb-denwa",
      "でんわ",
      "telephone",
      ["で", "ん", "わ"],
      ["て", "ね", "む"],
    ),
    reviewMatchPairs("ja-m5-neo-4-rev", L4_REVIEW),
  ],
};

assertNoSameAnswerCluster(M5_NEO_4.steps);
assertNoConsecutiveSame(M5_NEO_4.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L5 — "する・やる — do" (rubric-blocked atoms: dialogue + card + builds,
 * NO image MCQs — invariant 4/6). する flagged irregular; やる is the
 * casual doer (CEJC #36). なにを する？ rides m4's なに + the new を.
 * やる never appears as a tile-bank distractor for a する target (both
 * would be correct Japanese — genuine-error discipline).
 * ════════════════════════════════════════════════════════════════════════ */

const L5_REVIEW = pickReviewAtoms("ja-m5-neo-5-rev", NEO_PRIOR_POOL, 6);

export const M5_NEO_5: LessonContent = {
  id: "ja-m5-neo-5",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "する・やる — do",
  description:
    "The all-purpose verb and its street-clothes twin: なにを する？ — what are you gonna do? これを やる。 — I'm on it.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① The card FIRST — する/やる are rubric-blocked (no honest emoji, so
    // NO image MCQ — invariant 4/6); the card carries the meaning a
    // picture can't. Opening on the card also keeps step 0 off dialogue
    // (invariant 30).
    grammarRule({
      id: "ja-m5-neo-5-rule-suru-yaru",
      title: "する・やる — the all-purpose 'do'",
      rule:
        "する = do, the verb for everything that has no verb of its own: なにを する？ 'what are you gonna do?' やる is the same 'do' in street clothes — between friends it's everywhere. (する is the OTHER of Japanese's two irregular verbs — remember its face, like くる.)",
      examples: [
        { ja: "なにを する？", romaji: "nani o suru?", en: "What are you gonna do?" },
        { ja: "これを する。", romaji: "kore o suru.", en: "I'll do this one." },
        { ja: "これを やる。", romaji: "kore o yaru.", en: "I'll do this one. (casual)" },
      ],
      // No antiPattern on purpose: する and やる swap freely here, so any
      // fabricated ✗ would grade correct Japanese as wrong (invariant 12).
      cultureNote:
        "やる ranks among the most-spoken verbs in real Japanese conversation — casual talk reaches for it constantly. Both are fine between friends; する is the one that also wears a suit.",
    }),
    listeningCompSentence({
      id: "ja-m5-neo-5-lc-nani-suru",
      audioText: "なにを する？",
      question: "What does this mean?",
      correctMeaningEn: "What are you gonna do?",
      distractorsEn: [
        "What is this?",
        "What'll you buy?",
        "Who's doing it?",
      ],
      exercisedAtomKanas: ["なに", "を", "する"],
    }),
    build(
      "ja-m5-neo-5-build-kore-suru",
      "Build this sentence: I'll do this one.",
      "これを する",
      ["これ", "を", "する", "だ"],
      ["これ", "を", "する"],
      ["これ", "を", "する"],
    ),
    speaking(
      "ja-m5-neo-5-speak-nani-yaru",
      "なにを やる？",
      "Whatcha gonna do? (casual)",
      ["なに", "を", "やる"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-5-lc-sore-yaru",
      audioText: "それを やる。",
      question: "What does this mean?",
      correctMeaningEn: "I'll do that one.",
      distractorsEn: [
        "I'll do this one.",
        "What'll you do?",
        "That one's done.",
      ],
      exercisedAtomKanas: ["それ", "を", "やる"],
    }),
    cloze(
      "ja-m5-neo-5-cloze-kore",
      "これ",
      " する。",
      "を",
      ["を", "は", "の", "も"],
      "I'll do this one.",
      "これを する。",
      "を pins the task to the verb — これを する = do THIS one.",
    ),
    build(
      "ja-m5-neo-5-build-sore-yaru",
      "Build this sentence: I'll do that one.",
      "それを やる",
      ["それ", "を", "やる", "くる"],
      ["それ", "を", "やる"],
      ["それ", "を", "やる"],
    ),
    translateStep({
      id: "ja-m5-neo-5-tr-nani",
      promptEn: "Translate: What are you gonna do?",
      acceptedAnswers: [
        "なにを する？",
        "なにをする？",
        "なにを やる？",
        "なにをやる？",
        "なにを する",
        "なにをする",
        "なにを やる",
        "なにをやる",
      ],
      audioText: "なにを する？",
      exercisedAtomKanas: ["なに", "を", "する"],
    }),
    // Quick gamified breather — emoji word check over a prior atom.
    vocabMcq("ja-m5-neo-5-vmcq-mid", L5_REVIEW[3], NEO_PRIOR_POOL),
    // Dialogue closers (invariant 30) — the chore Q→A pair.
    dialogueListen({
      id: "ja-m5-neo-5-dlg-intro",
      lines: [
        { speaker: "Ken", kana: "なにを する？" },
        { speaker: "Tom", kana: "これを する。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Ken want to know?",
          correctText: "What Tom's going to do",
          distractors: [
            "What Tom is holding",
            "Where Tom's going",
            "What Tom bought",
          ],
        },
        {
          id: "q2",
          prompt: "Tom's answer?",
          correctText: "He'll do this one.",
          distractors: [
            "He'll do nothing.",
            "He'll do that one over there.",
            "He doesn't know.",
          ],
        },
      ],
      exercisedAtomKanas: ["なに", "を", "する", "これ"],
    }),
    speaking("ja-m5-neo-5-speak-un-yaru", "うん、やる", "Yeah — I'm on it.", [
      "うん",
      "やる",
    ]),
    dialogueListen({
      id: "ja-m5-neo-5-dlg-yaru",
      lines: [
        { speaker: "Mika", kana: "それ、やる？" },
        { speaker: "Tom", kana: "うん、やる。" },
        { speaker: "Mika", kana: "ありがとう。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Mika want to know?",
          correctText: "Whether Tom will take that task on",
          distractors: [
            "What the task is",
            "Who already did it",
            "Whether Tom bought it",
          ],
        },
        {
          id: "q2",
          prompt: "What does Mika say last?",
          correctText: "Thanks.",
          distractors: ["Sorry.", "Welcome.", "Nice to meet you."],
        },
      ],
      exercisedAtomKanas: ["それ", "やる", "うん", "ありがとう"],
    }),
    // Converted from a full-sentence recognition MCQ (invariant 28) — a
    // build makes the learner produce なに+を+する.
    build(
      "ja-m5-neo-5-build-nani-suru",
      "Build this sentence: What are you gonna do?",
      "なにを する",
      ["なに", "を", "する", "かう"],
      ["なに", "を", "する"],
      ["なに", "を", "する"],
    ),
    listeningBuildSentence({
      id: "ja-m5-neo-5-lbs-kore-yaru",
      target: "これを やる",
      tiles: ["これ", "を", "やる", "みる"],
      correctOrder: ["これ", "を", "やる"],
      promptEn: "I'll do this one. (casual)",
      exercisedAtomKanas: ["これ", "を", "やる"],
    }),
    // CAPSTONE (invariant 26) — new verb + あれ (m4) + も (m3); the を
    // tile is the genuine trap (も REPLACES を, never stacks on it here).
    build(
      "ja-m5-neo-5-capstone",
      "Build this sentence: I'll do that one too.",
      "あれも やる",
      ["あれ", "も", "やる", "を"],
      ["あれ", "も", "やる"],
      ["あれ", "も", "やる"],
    ),
    // Review tail — full prior pool (house idiom: LC → vocabMcq →
    // decode-build → match grid).
    listeningCompSentence({
      // Sentence-level (2026-07-20): the pool-word LC tripped the M5+
      // sentence-first ratchet — the pool noun now rides an m5 verb.
      id: "ja-m5-neo-5-rev-lc",
      audioText: "つきを みる？",
      correctMeaningEn: "Gonna look at the moon?",
      distractorsEn: [
        "Gonna look at a star?",
        "Gonna buy the moon?",
        "Is the moon out?",
      ],
      exercisedAtomKanas: ["つき", "みる"],
    }),
    vocabMcq("ja-m5-neo-5-rev-mcq", L5_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildWord(
      "ja-m5-neo-5-rev-lb-kazoku",
      "かぞく",
      "family",
      ["か", "ぞ", "く"],
      ["が", "そ", "き"],
    ),
    reviewMatchPairs("ja-m5-neo-5-rev", L5_REVIEW),
  ],
};

assertNoSameAnswerCluster(M5_NEO_5.steps);
// Single cloze (を on する) — trivially rotated; documents intent.
assertAnswerRotation(M5_NEO_5.steps, 1);
assertNoConsecutiveSame(M5_NEO_5.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L6 — "Story: at the shop" (integration scene — no rule cards)
 * これ、いくら？ rides the m3 contour; これを かう。 cashes in L3; clerk
 * です lines are flagged-recognition register previews (LC explanations
 * carry the flag). ひゃくえんです is fully parseable: ひゃく is an m2
 * atom, えん debuts on dialogue exposure. いらっしゃいませ and
 * ありがとうございます enter as situated chunks (guide type 5); the
 * clerk is an unnamed Latin-labeled speaker (Nanami voice — no
 * MALE_SPEAKERS change needed).
 * ════════════════════════════════════════════════════════════════════════ */

const L6_REVIEW = pickReviewAtoms("ja-m5-neo-6-rev", NEO_PRIOR_POOL, 6);

export const M5_NEO_6: LessonContent = {
  id: "ja-m5-neo-6",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Story: at the shop",
  description:
    "Tom and Mika hit a little shop. これ、いくら？ — how much is this? A price, a decision — これを かう — and a polite thank-you on the way out.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // Story lesson — integrates, no new grammar. It cannot OPEN on a
    // dialogue (invariant 30), so a known-material build sets the scene,
    // then the three shop scenes run as dialogue closers.
    build(
      "ja-m5-neo-6-build-kore-kau",
      "Build this sentence: I'll buy this one.",
      "これを かう",
      ["これ", "を", "かう", "みる"],
      ["これ", "を", "かう"],
      ["これ", "を", "かう"],
    ),
    // Scene 1 — the ask. いらっしゃいませ + いくら + えん debut on exposure.
    dialogueListen({
      id: "ja-m5-neo-6-dlg-scene1",
      lines: [
        { speaker: "Clerk", kana: "いらっしゃいませ。" },
        { speaker: "Tom", kana: "これ、いくら？" },
        { speaker: "Clerk", kana: "ひゃくえんです。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Where is this happening?",
          correctText: "In a shop",
          distractors: ["At Mika's place", "At the station", "At school"],
        },
        {
          id: "q2",
          prompt: "What does Tom want to know?",
          correctText: "The price of the thing he's holding",
          distractors: [
            "Whose it is",
            "What it's called",
            "Whether Mika wants it",
          ],
        },
        {
          id: "q3",
          prompt: "The price?",
          correctText: "100 yen",
          distractors: ["10 yen", "1,000 yen", "It's free"],
          explanation:
            "ひゃく = hundred (from your kana days) + えん = yen. The clerk's です is shop-polish — staff dress their sentences up for customers; you'll learn to wear it later.",
        },
      ],
      exercisedAtomKanas: ["いらっしゃいませ", "これ", "いくら", "ひゃく", "えん"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-6-lc-ikura",
      audioText: "これ、いくら？",
      question: "What does this mean?",
      correctMeaningEn: "How much is this?",
      distractorsEn: ["What is this?", "Whose is this?", "I'll buy this."],
      explanation:
        "いくら asks the price — ride the rising tone, これ、なに？-style.",
      exercisedAtomKanas: ["これ", "いくら"],
    }),
    speaking(
      "ja-m5-neo-6-speak-kore-kau",
      "これを かう",
      "I'll buy this one.",
      ["これ", "を", "かう"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-6-lc-irasshai",
      audioText: "いらっしゃいませ。",
      question: "What does this mean?",
      correctMeaningEn: "Welcome in!",
      distractorsEn: ["Thank you!", "See you!", "Excuse me!"],
      explanation:
        "The shop-staff greeting — it washes over every customer, and you never say it back. A nod is plenty.",
      exercisedAtomKanas: ["いらっしゃいませ"],
    }),
    cloze(
      "ja-m5-neo-6-cloze-are",
      "あれ",
      " かう。",
      "を",
      ["を", "の", "は", "か"],
      "I'll buy that one (over there).",
      "あれを かう。",
      "Pointer + を + verb — the shop runs on this skeleton.",
    ),
    // Scene 2 — the decision. は contrast + あれ callback.
    dialogueListen({
      id: "ja-m5-neo-6-dlg-scene2",
      lines: [
        { speaker: "Tom", kana: "ミカ、これを かう。" },
        { speaker: "Mika", kana: "そう？ わたしは あれを かう。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Tom tell Mika?",
          correctText: "He's buying the one he picked",
          distractors: [
            "He's out of money",
            "He wants the one she has",
            "He's heading out",
          ],
        },
        {
          id: "q2",
          prompt: "Which one does Mika want?",
          correctText: "The one over there",
          distractors: [
            "The same one Tom has",
            "The one in her hand",
            "Nothing today",
          ],
        },
      ],
      exercisedAtomKanas: ["これ", "を", "かう", "そう", "わたし", "あれ"],
    }),
    translateStep({
      id: "ja-m5-neo-6-tr-ikura",
      promptEn: "Translate: How much is this?",
      acceptedAnswers: [
        "これ、いくら？",
        "これいくら？",
        "これ、いくら",
        "これいくら",
      ],
      audioText: "これ、いくら？",
      exercisedAtomKanas: ["これ", "いくら"],
    }),
    sentenceMcq({
      id: "ja-m5-neo-6-mcq-irasshai",
      prompt: "Which greeting meets you at the shop door?",
      correctKana: "いらっしゃいませ。",
      distractorsKana: ["ありがとう。", "すみません。", "はじめまして。"],
      explanation:
        "いらっしゃいませ belongs to staff at the threshold — the other three are yours for thanking, flagging someone down and first meetings.",
      exercisedAtomKanas: ["いらっしゃいませ"],
    }),
    // Scene 3 — checkout and out the door. ありがとうございます debuts on
    // exposure; L4's いく walks them out.
    dialogueListen({
      id: "ja-m5-neo-6-dlg-scene3",
      lines: [
        { speaker: "Clerk", kana: "ありがとうございます。" },
        { speaker: "Tom", kana: "ミカ、いく？" },
        { speaker: "Mika", kana: "うん、いく。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does the clerk say?",
          correctText: "A polite thank-you",
          distractors: [
            "Welcome in",
            "How much is it?",
            "See you tomorrow",
          ],
          explanation:
            "ありがとうございます — the ありがとう you know, in its polite dress. Staff wear it all day; the です/ます polish reaches your own mouth in a later module.",
        },
        {
          id: "q2",
          prompt: "What do Tom and Mika do?",
          correctText: "Head out",
          distractors: [
            "Keep browsing",
            "Ask another price",
            "Split up",
          ],
        },
      ],
      exercisedAtomKanas: ["ありがとうございます", "いく", "うん"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-6-lc-arigatou",
      audioText: "ありがとうございます。",
      question: "What does this mean?",
      correctMeaningEn: "Thank you (polite).",
      distractorsEn: ["Welcome in!", "Here you go.", "Come again."],
      exercisedAtomKanas: ["ありがとうございます"],
    }),
    build(
      "ja-m5-neo-6-build-watashi-mo",
      "Build this sentence: I'll buy this one too.",
      "わたしも これを かう",
      ["わたし", "も", "これ", "を", "かう", "は"],
      ["わたし", "も", "これ", "を", "かう"],
      ["わたし", "も", "これ", "を", "かう"],
    ),
    // Quick gamified breather — emoji word check over a prior atom.
    vocabMcq("ja-m5-neo-6-vmcq-mid", L6_REVIEW[3], NEO_PRIOR_POOL),
    speaking(
      "ja-m5-neo-6-speak-are-kau",
      "あれを かう",
      "I'll buy that one (over there).",
      ["あれ", "を", "かう"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-6-lc-hyakuen",
      audioText: "ひゃくえんです。",
      question: "What does this mean?",
      correctMeaningEn: "It's 100 yen.",
      distractorsEn: ["It's 1,000 yen.", "It's free.", "That's everything."],
      explanation:
        "ひゃく hundred + えん yen + the staff-side です polish. Numbers get their own module soon — for now, recognize the shape.",
      exercisedAtomKanas: ["ひゃく", "えん"],
    }),
    // CAPSTONE (invariant 26) — the scene's verb + これ (m4) + も (m3);
    // the を tile is the genuine trap (も replaces を).
    listeningBuildSentence({
      id: "ja-m5-neo-6-capstone",
      target: "これも かう",
      tiles: ["これ", "も", "かう", "を"],
      correctOrder: ["これ", "も", "かう"],
      promptEn: "I'm buying this one too.",
      exercisedAtomKanas: ["これ", "も", "かう"],
    }),
    // Review tail — full prior pool (house idiom: LC → vocabMcq →
    // decode-build → match grid).
    listeningCompSentence({
      // Sentence-level (2026-07-20): the pool-word LC tripped the M5+
      // sentence-first ratchet — the pool noun now rides an m5 verb.
      id: "ja-m5-neo-6-rev-lc",
      audioText: "すしを たべる。",
      correctMeaningEn: "Gonna eat sushi.",
      distractorsEn: [
        "Gonna eat rice.",
        "Gonna buy sushi.",
        "Gonna make sushi.",
      ],
      exercisedAtomKanas: ["すし", "たべる"],
    }),
    vocabMcq("ja-m5-neo-6-rev-mcq", L6_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildSentence({
      // Sentence-level (2026-07-20): two-mora decode tripped the M5+
      // sentence-first ratchet — converted to a short verb sentence.
      id: "ja-m5-neo-6-rev-lbs-yuki",
      target: "ゆきを みる",
      tiles: ["ゆき", "を", "みる", "かう"],
      correctOrder: ["ゆき", "を", "みる"],
      promptEn: "Gonna watch the snow.",
      exercisedAtomKanas: ["ゆき", "みる"],
    }),
    reviewMatchPairs("ja-m5-neo-6-rev", L6_REVIEW),
  ],
};

assertNoSameAnswerCluster(M5_NEO_6.steps);
// Single cloze (を on かう) — trivially rotated; documents intent.
assertAnswerRotation(M5_NEO_6.steps, 1);
assertNoConsecutiveSame(M5_NEO_6.steps);

/** Lessons 1-6 of m5-neo (first half; L7-12 live in m5-neo-b.ts). */
export const M5_NEO_A_LESSONS: LessonContent[] = [
  M5_NEO_1,
  M5_NEO_2,
  M5_NEO_3,
  M5_NEO_4,
  M5_NEO_5,
  M5_NEO_6,
];
