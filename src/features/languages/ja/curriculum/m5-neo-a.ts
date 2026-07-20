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
 *  - L1 たべる/みる: exposure-first (bare verb is inferable from context +
 *    the m3 contour pattern) — dialogue + LC noticing, THEN the rule card.
 *    Verb-class flag is one line on the card ("たべる is a る-verb"), no
 *    classification drills (class knowledge is functional at negation, m6).
 *  - L2 を: rule card FIRST (new structural particle, invariant 24).
 *    Anti-pattern is the genuine order error (たべるを ごはん) as a
 *    full-sentence minimal pair (invariant 12 semantic contract).
 *    particle_cloze is legal for を from this lesson (invariant 5).
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
    // ① Noticing exposure — the complete Q→A exchange on one bare verb,
    // heard before any rule (contour + うん are m3 property).
    dialogueListen({
      id: "ja-m5-neo-1-dlg-intro",
      lines: [
        { speaker: "Mika", kana: "たべる？" },
        { speaker: "Tom", kana: "うん、たべる。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Mika ask Tom?",
          correctText: "Whether he's gonna eat",
          distractors: [
            "What he's eating",
            "Whether he's leaving",
            "What this thing is",
          ],
        },
        {
          id: "q2",
          prompt: "Tom's reply?",
          correctText: "Yeah — he'll eat.",
          distractors: ["No thanks.", "He already ate.", "He's not hungry."],
        },
      ],
      exercisedAtomKanas: ["たべる", "うん"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-1-lc-taberu",
      audioText: "たべる。",
      question: "Mika sits down to dinner and says this. Meaning?",
      correctMeaningEn: "I'll eat.",
      distractorsEn: ["I'm off.", "It's food.", "I'll buy it."],
      exercisedAtomKanas: ["たべる"],
    }),
    speaking(
      "ja-m5-neo-1-speak-taberu-q",
      "たべる？",
      "Gonna eat? (voice rises)",
      ["たべる"],
    ),
    // ② The rule — the answer to what they just noticed.
    grammarRule({
      id: "ja-m5-neo-1-rule-dict",
      title: "The dictionary form IS the verb",
      rule:
        "たべる = eat. みる = watch. Say one and you've spoken a complete casual sentence: たべる。 'I'll eat.' Raise the tone — たべる？ — and it's a question, m3-style. (たべる and みる are る-verbs — that'll matter when we start bending verbs soon.)",
      examples: [
        { ja: "たべる。", romaji: "taberu.", en: "I'll eat." },
        { ja: "たべる？", romaji: "taberu?", en: "Gonna eat? (voice rises)" },
        { ja: "うん、たべる。", romaji: "un, taberu.", en: "Yeah — I'll eat." },
      ],
      antiPattern: {
        ja: "たべるだ。",
        romaji: "taberu da.",
        en: "(broken: verb + だ)",
        why:
          "だ glues to NOUNS — ねこだ, ほんだ. A verb never takes it: たべる is already a finished sentence all by itself.",
      },
      cultureNote:
        "Who eats? Whoever the moment points at — say it flat and it's usually you; aim it at a friend with a rise and it's them. Japanese trusts the room; no 'I' or 'you' needed.",
    }),
    // ③ も gives the bare verb its first combos (を doesn't exist yet).
    build(
      "ja-m5-neo-1-build-watashi-mo",
      "Everyone's digging in. Tell a friend: I'll eat too.",
      "わたしも たべる",
      ["わたし", "も", "たべる", "だ"],
      ["わたし", "も", "たべる"],
      ["わたし", "も", "たべる"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-1-lc-miru-q",
      audioText: "みる？",
      question: "Mika turns on a movie and asks this. Meaning?",
      correctMeaningEn: "Gonna watch?",
      distractorsEn: ["Gonna eat?", "What's that?", "Did you see it?"],
      exercisedAtomKanas: ["みる"],
    }),
    speaking("ja-m5-neo-1-speak-miru", "みる", "I'll watch.", ["みる"]),
    build(
      "ja-m5-neo-1-build-mika-mo",
      "Movie night is filling up. Tell Tom: Mika will watch too.",
      "ミカも みる",
      ["ミカ", "も", "みる", "だ"],
      ["ミカ", "も", "みる"],
      ["も", "みる"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-1-lc-un-miru",
      audioText: "うん、みる。",
      question: "You asked Ken if he wants to watch. His reply means:",
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
      promptEn: "Dinner's ready. Ask your friend casually: Gonna eat?",
      acceptedAnswers: ["たべる？", "たべる"],
      audioText: "たべる？",
      exercisedAtomKanas: ["たべる"],
    }),
    // Quick gamified breather — emoji word check over an M1 atom.
    vocabMcq("ja-m5-neo-1-vmcq-mid", L1_REVIEW[3], NEO_M1_POOL),
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
      prompt: "Pick: 'Gonna watch?' — offering a friend the couch spot.",
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
      promptEn:
        "Mika slides one more plate your way. Ask casually: This too — gonna eat it?",
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
      audioText: "そらを みる。",
      correctMeaningEn: "Gonna watch the sky.",
      distractorsEn: [
        "Gonna watch the sea.",
        "Gonna buy the sky.",
        "Gonna watch a star.",
      ],
      exercisedAtomKanas: ["そら", "みる"],
    }),
    vocabMcq("ja-m5-neo-1-rev-mcq", L1_REVIEW[0], NEO_M1_POOL),
    // ごはん decode — invariant 27: under-reinforced CEJC-frequent item
    // worked into the tail (it is also L2's headline carrier).
    listeningBuildWord(
      "ja-m5-neo-1-rev-lb-gohan",
      "ごはん",
      "rice/meal",
      ["ご", "は", "ん"],
      ["こ", "ば", "ぱ"],
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
    // ① The card FIRST — new structural particle (invariant 24).
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
      "Tell a friend what you're having: I'll eat the rice.",
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
      question: "Mika eyes the last piece and says this. Meaning?",
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
      "At the shore with a friend. Tell them: I'll look at the sea.",
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
    sentenceMcq({
      id: "ja-m5-neo-2-mcq-gohan",
      prompt: "Pick: 'I'll eat the rice.'",
      correctKana: "ごはんを たべる。",
      distractorsKana: [
        "たべるを ごはん。",
        "ごはんを みる。",
        "すしを たべる。",
      ],
      explanation:
        "Thing + を + verb — the verb-first version is the one order Japanese never allows.",
      exercisedAtomKanas: ["ごはん", "を", "たべる"],
    }),
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
      promptEn: "A boat is coming in. Tell your friend: I'll watch the boat.",
      acceptedAnswers: ["ふねを みる", "ふねをみる", "みる"],
      audioText: "ふねを みる",
      exercisedAtomKanas: ["ふね", "を", "みる"],
    }),
    speaking(
      "ja-m5-neo-2-speak-sushi",
      "すしを たべる",
      "I'll eat the sushi.",
      ["すし", "を", "たべる"],
    ),
    // CAPSTONE (invariant 26) — spec's own L2 example: の possession (m4)
    // + an m4 object noun + the new を+verb skeleton in one build.
    build(
      "ja-m5-neo-2-capstone",
      "Tanaka pulls up in a new car. Tell a friend: I'll check out Tanaka's car.",
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
      audioText: "ぼうしを かう？",
      correctMeaningEn: "Gonna buy the hat?",
      distractorsEn: [
        "Gonna buy the bag?",
        "Gonna look at the hat?",
        "Wearing the hat?",
      ],
      exercisedAtomKanas: ["ぼうし", "かう"],
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
    // ① のむ exposure-first — the を skeleton makes it inferable.
    listeningCompSentence({
      id: "ja-m5-neo-3-lc-nomu",
      audioText: "みずを のむ。",
      question: "Mika comes in from a run, glass in hand. Meaning?",
      correctMeaningEn: "I'll drink the water.",
      distractorsEn: [
        "I'll eat the rice.",
        "This is water.",
        "I'll buy the water.",
      ],
      exercisedAtomKanas: ["みず", "を", "のむ"],
    }),
    speaking(
      "ja-m5-neo-3-speak-mizu",
      "みずを のむ",
      "I'll drink the water.",
      ["みず", "を", "のむ"],
    ),
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
    build(
      "ja-m5-neo-3-build-hon",
      "Decision made at the bookshop. Tell your friend: I'll buy the book.",
      "ほんを かう",
      ["ほん", "を", "かう", "のむ"],
      ["ほん", "を", "かう"],
      ["ほん", "を", "かう"],
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
      promptEn: "Tell a friend: I'll drink the water.",
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
      "Tom asks which one you're getting. Point and tell him: I'll buy this one.",
      "これを かう",
      ["これ", "を", "かう", "は"],
      ["これ", "を", "かう"],
      ["これ", "を", "かう"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-3-lc-kore-kau-q",
      audioText: "これを かう？",
      question: "Mika holds up a cup and asks. Meaning?",
      correctMeaningEn: "You gonna buy this?",
      distractorsEn: [
        "I'll buy this.",
        "Gonna drink this?",
        "Is this yours?",
      ],
      exercisedAtomKanas: ["これ", "を", "かう"],
    }),
    // Quick gamified breather — emoji word check over an M3 atom.
    vocabMcq("ja-m5-neo-3-vmcq-mid", L3_REVIEW[3], NEO_M3_POOL),
    speaking(
      "ja-m5-neo-3-speak-gyuunyuu",
      "ぎゅうにゅうを のむ",
      "I'll drink the milk.",
      ["ぎゅうにゅう", "を", "のむ"],
    ),
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
    sentenceMcq({
      id: "ja-m5-neo-3-mcq-kaban",
      prompt: "Pick: 'I'll buy the bag.'",
      correctKana: "かばんを かう。",
      distractorsKana: [
        "かばんを みる。",
        "かうを かばん。",
        "ほんを かう。",
      ],
      exercisedAtomKanas: ["かばん", "を", "かう"],
    }),
    listeningBuildSentence({
      id: "ja-m5-neo-3-lbs-hon",
      target: "ほんを かう",
      tiles: ["ほん", "を", "かう", "みる"],
      correctOrder: ["ほん", "を", "かう"],
      promptEn: "I'll buy the book.",
      exercisedAtomKanas: ["ほん", "を", "かう"],
    }),
    // CAPSTONE (invariant 26) — the spec's だれの…-answer build: だれ+の
    // (m4) framing in the prompt, の possession inside the answer, new
    // を+かう closing it.
    build(
      "ja-m5-neo-3-capstone",
      "Ken asks: だれの ほんを かう？ Answer him: I'll buy Mika's book.",
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
    // ① Noticing exposure — the Q→A pair at the door.
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
      id: "ja-m5-neo-4-lc-iku",
      audioText: "いく。",
      question: "Mika grabs her bag at the door and says this. Meaning?",
      correctMeaningEn: "I'm off.",
      distractorsEn: ["I'm here.", "Come in.", "I'll buy it."],
      exercisedAtomKanas: ["いく"],
    }),
    speaking(
      "ja-m5-neo-4-speak-iku-q",
      "いく？",
      "You going? (voice rises)",
      ["いく"],
    ),
    // ② The card — direction anchored to HERE; くる flagged irregular.
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
    build(
      "ja-m5-neo-4-build-tomu-mo",
      "Mika's going. Tell Ken: Tom's going too.",
      "トムも いく",
      ["トム", "も", "いく", "くる"],
      ["トム", "も", "いく"],
      ["も", "いく"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-4-lc-kuru-q",
      audioText: "くる？",
      question:
        "You're at Mika's place; she's on the phone with Ken and asks this. Meaning?",
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
      "Good news for Tom: Mika's coming too.",
      "ミカも くる",
      ["ミカ", "も", "くる", "いく"],
      ["ミカ", "も", "くる"],
      ["も", "くる"],
    ),
    sentenceMcq({
      id: "ja-m5-neo-4-mcq-kuru-q",
      prompt: "Pick: 'You coming?' — calling a friend over to your place.",
      correctKana: "くる？",
      distractorsKana: ["いく？", "くる。", "だれ？"],
      explanation:
        "Toward you means くる — いく would send them somewhere else.",
      exercisedAtomKanas: ["くる"],
    }),
    translateStep({
      id: "ja-m5-neo-4-tr-iku",
      promptEn: "You're heading out the door. Tell your friend: I'm off.",
      acceptedAnswers: ["いく"],
      audioText: "いく",
      exercisedAtomKanas: ["いく"],
    }),
    // Quick gamified breather — emoji word check over an M4 atom.
    vocabMcq("ja-m5-neo-4-vmcq-mid", L4_REVIEW[3], NEO_M4_POOL),
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
    listeningBuildSentence({
      id: "ja-m5-neo-4-lbs-tomu-mo",
      target: "トムも いく",
      tiles: ["トム", "も", "いく", "だ"],
      correctOrder: ["トム", "も", "いく"],
      promptEn: "Tom's going too.",
      exercisedAtomKanas: ["も", "いく"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-4-lc-un-iku",
      audioText: "うん、いく。",
      question: "You asked Ken if he's going. His reply means:",
      correctMeaningEn: "Yeah — I'm going.",
      distractorsEn: [
        "No — I'm staying.",
        "I already went.",
        "Yeah — I'm coming to you.",
      ],
      exercisedAtomKanas: ["うん", "いく"],
    }),
    // CAPSTONE (invariant 26) — new verb + も (m3) + the m3 rising
    // contour: the "is she in too?" question in one breath.
    translateStep({
      id: "ja-m5-neo-4-capstone",
      promptEn: "Tom's already in. Ask Ken casually: Is Mika coming too?",
      acceptedAnswers: [
        "ミカも くる？",
        "ミカもくる？",
        "ミカも くる",
        "ミカもくる",
      ],
      audioText: "ミカも くる？",
      exercisedAtomKanas: ["も", "くる"],
    }),
    // Review tail — M4 atoms (house idiom: speak → LC → vocabMcq →
    // decode-build → match grid).
    speaking(
      "ja-m5-neo-4-rev-speak",
      L4_REVIEW[0].kana,
      L4_REVIEW[0].meaningEn,
      [L4_REVIEW[0].kana],
    ),
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
    // ① Noticing exposure — the Q→A pair over chores.
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
    // ② The card — irregular flag + the casual twin.
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
      "The chore list is out. Tell Mika which you'll take: I'll do this one.",
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
      question: "Mika points at the full sink; Ken sighs and says this. Meaning?",
      correctMeaningEn: "I'll do that one.",
      distractorsEn: [
        "I'll do this one.",
        "What'll you do?",
        "That one's done.",
      ],
      exercisedAtomKanas: ["それ", "を", "やる"],
    }),
    translateStep({
      id: "ja-m5-neo-5-tr-nani",
      promptEn: "Ask a friend casually: What are you gonna do?",
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
      "Ken can't face the dishes. Take over — tell him: I'll do that.",
      "それを やる",
      ["それ", "を", "やる", "くる"],
      ["それ", "を", "やる"],
      ["それ", "を", "やる"],
    ),
    // Quick gamified breather — emoji word check over a prior atom.
    vocabMcq("ja-m5-neo-5-vmcq-mid", L5_REVIEW[3], NEO_PRIOR_POOL),
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
    sentenceMcq({
      id: "ja-m5-neo-5-mcq-nani-suru",
      prompt: "Pick: 'What are you gonna do?' — asking a friend.",
      correctKana: "なにを する？",
      distractorsKana: ["なにを かう？", "これを する？", "だれ？"],
      exercisedAtomKanas: ["なに", "を", "する"],
    }),
    listeningBuildSentence({
      id: "ja-m5-neo-5-lbs-kore-yaru",
      target: "これを やる",
      tiles: ["これ", "を", "やる", "みる"],
      correctOrder: ["これ", "を", "やる"],
      promptEn: "I'll do this one. (casual)",
      exercisedAtomKanas: ["これ", "を", "やる"],
    }),
    speaking("ja-m5-neo-5-speak-un-yaru", "うん、やる", "Yeah — I'm on it.", [
      "うん",
      "やる",
    ]),
    // CAPSTONE (invariant 26) — new verb + あれ (m4) + も (m3); the を
    // tile is the genuine trap (も REPLACES を, never stacks on it here).
    build(
      "ja-m5-neo-5-capstone",
      "The far table needs clearing as well. Tell Mika: I'll do that one too.",
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
    // Scene 1 — the ask. いらっしゃいませ + いくら debut on exposure.
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
      question: "Holding something up at the counter. Meaning?",
      correctMeaningEn: "How much is this?",
      distractorsEn: ["What is this?", "Whose is this?", "I'll buy this."],
      explanation:
        "いくら asks the price — ride the rising tone, これ、なに？-style.",
      exercisedAtomKanas: ["これ", "いくら"],
    }),
    speaking(
      "ja-m5-neo-6-speak-ikura",
      "これ、いくら？",
      "How much is this? (voice rises)",
      ["これ", "いくら"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-6-lc-irasshai",
      audioText: "いらっしゃいませ。",
      question: "You push open the shop door and hear this. Meaning?",
      correctMeaningEn: "Welcome in!",
      distractorsEn: ["Thank you!", "See you!", "Excuse me!"],
      explanation:
        "The shop-staff greeting — it washes over every customer, and you never say it back. A nod is plenty.",
      exercisedAtomKanas: ["いらっしゃいませ"],
    }),
    build(
      "ja-m5-neo-6-build-kore-kau",
      "Decision made. Tell Mika: I'm buying this one.",
      "これを かう",
      ["これ", "を", "かう", "いくら"],
      ["これ", "を", "かう"],
      ["これ", "を", "かう"],
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
      promptEn: "Ask the clerk the price of the thing in your hand.",
      acceptedAnswers: [
        "これ、いくら？",
        "これいくら？",
        "これ、いくら",
        "これいくら",
      ],
      audioText: "これ、いくら？",
      exercisedAtomKanas: ["これ", "いくら"],
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
      question: "The clerk hands you the bag and says this. Meaning?",
      correctMeaningEn: "Thank you (polite).",
      distractorsEn: ["Welcome in!", "Here you go.", "Come again."],
      exercisedAtomKanas: ["ありがとうございます"],
    }),
    build(
      "ja-m5-neo-6-build-watashi-mo",
      "Mika's getting one — turns out you want one as well. Tell her: I'll buy this too.",
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
      question: "You asked the price. The clerk answers:",
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
