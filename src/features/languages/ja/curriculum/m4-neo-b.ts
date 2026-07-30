/**
 * M4-NEO (part B, lessons 7-12) — module 4 of the dict-form-first rewrite
 * (spine tile s04, docs/m4-neo-authoring-spec-2026-07-20.md).
 *
 * "Possession & pointing — の, これ/それ/あれ/どれ, だれ, 何", second half:
 *  - L7  story: whose bag? (integration dialogue, m3-neo L6 shape)
 *  - L8  の attributive (origin/category — spiral on L5's possession card)
 *  - L9  どれ — which one (rule card FIRST: substitution class, joins こ/そ/あ)
 *  - L10 objects III (じてんしゃ, じしょ) + こ/そ/あ/ど consolidation
 *  - L11 story: in Tanaka's classroom (two flagged です recognition lines)
 *  - L12 mixed review: ALL-NEW sentences on m1-m3 carrier nouns, ≥60%
 *        sentence-context, every concept + chunk callbacks, match-grid close.
 *
 * Plain-form register (だ) throughout; です appears ONLY as flagged
 * recognition previews spoken by Tanaka (L11) + one flagged review LC.
 * Register cues on every register-dependent production prompt (invariant 8);
 * だ-drop accepted in translate steps (m3-neo acceptedAnswers pattern).
 *
 * Lessons 1-6 live in m4-neo-a.ts (separate authoring dispatch). This file
 * freely USES what those lessons teach (これ/それ/あれ intro, 何 questions,
 * の possession, だれ/だれの + the short-answer のだ chunk) but imports
 * nothing from -a: the tiny local helpers are duplicated per the spec's
 * file-layout rule. Registration, barrel, tests, and TTS are wired after
 * both halves land — do NOT add this file to mockLessons/mockCourse here.
 *
 * Constraints honored (authoring-invariants-pinned + moduleBarGuards):
 * density 18-24; no adjacent same-type steps; ≤2 selection taps in a row;
 * ≥5 step types; every lesson closes on the house review tail
 * (reviewMatchPairs over its seeded pool + vocabMcq + a listening_build);
 * ≤3 uses of any primary sentence surface; every new word debuts on an
 * intro-capable step before appearing in any option set; no
 * production-framed MCQs; persona canon (Tom=student/American/Mika's
 * friend; Mika=student/Japanese; Tanaka=the teacher; Ken=student/Japanese);
 * dialogue speaker labels ROMANIZED (male speakers get Keita automatically).
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
 * prior-module TTS clip — the kana-decode beat of the house review tails.
 * Duplicated from m3-neo.ts per the spec's no-cross-import rule.
 *
 * FIXED words only: the mora arrays are hand-tokenized, so targets must
 * never come from a seeded `pickReviewAtoms` draw (the struggle-weighted
 * path re-picks per learner and the hand mora would drift out of sync).
 * Every `word` here must already be clipped — see src/shared/tts/manifests/ja.json
 * (keyed `ja:<word>`) — all m1/m2 pool atoms are.
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

// Review pools: M1 + M2 + M3 — m3 atoms now count as prior vocab (spec
// ruling for m4). Katakana entries excluded (コーヒー/タクシー class is
// not base-readable before the katakana ladder), image-blocked atoms
// filtered so the pools can feed vocabMcq directly.
const noKatakana = (a: { kana: string }) =>
  !/\p{Script=Katakana}/u.test(a.kana);
const NEO_PRIOR_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter(
    (a) => a.fromModule === "m1" || a.fromModule === "m2" || a.fromModule === "m3",
  ),
).filter(noKatakana);

/* ════════════════════════════════════════════════════════════════════════
 * L7 — "Story: whose bag?" (integration dialogue, m3-neo L6 shape)
 * Found bag → だれの かばん？ → ケンのだ → handing back; chunk callbacks
 * (ありがとう / ごめんなさい / だいじょうぶ). No grammar_rule steps —
 * story lessons integrate, they don't introduce.
 * ════════════════════════════════════════════════════════════════════════ */

const L7_REVIEW = pickReviewAtoms("ja-m4-neo-7-rev", NEO_PRIOR_POOL, 6);

export const M4_NEO_7: LessonContent = {
  id: "ja-m4-neo-7",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Story: whose bag?",
  description:
    "Tom finds a bag left on a bench. だれの？ Pointing, owning, and handing it back — everything so far in one scene.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // Scene 1 — the find.
    dialogueListen({
      id: "ja-m4-neo-7-dlg-scene1",
      lines: [
        { speaker: "Tom", kana: "かばんだ。" },
        { speaker: "Tom", kana: "これ、だれの かばん？" },
        { speaker: "Mika", kana: "ケンのだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What did Tom find?",
          correctText: "A bag",
          distractors: ["An umbrella", "A phone", "A book"],
        },
        {
          id: "q2",
          prompt: "Whose is it, according to Mika?",
          correctText: "Ken's",
          distractors: ["Mika's", "Tom's", "Tanaka's"],
        },
      ],
      exercisedAtomKanas: ["かばん", "だれ", "の", "これ"],
    }),
    build(
      "ja-m4-neo-7-build-kenno",
      "Build this sentence: It's Ken's.",
      "ケンのだ",
      ["ケン", "の", "だ", "は"],
      ["ケン", "の", "だ"],
      ["の"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-7-lc-dareno",
      audioText: "だれの かばん？",
      question: "What does this mean?",
      correctMeaningEn: "Whose bag is it?",
      distractorsEn: [
        "Which bag is it?",
        "Whose umbrella is it?",
        "Is it a bag?",
      ],
      exercisedAtomKanas: ["だれ", "の", "かばん"],
    }),
    speaking(
      "ja-m4-neo-7-speak-kenno-kaban",
      "ケンの かばんだ",
      "It's Ken's bag.",
      ["かばん", "の"],
    ),
    cloze(
      "ja-m4-neo-7-cloze-no",
      "これは ケン",
      " かばんだ。",
      "の",
      ["の", "は", "も", "か"],
      "This is Ken's bag.",
      "これは ケンの かばんだ。",
      "の clips the owner onto the thing: ケンの かばん — Ken's bag.",
    ),
    // Scene 2 — handing it back.
    dialogueListen({
      id: "ja-m4-neo-7-dlg-scene2",
      lines: [
        { speaker: "Tom", kana: "これ、ケンの かばん？" },
        { speaker: "Ken", kana: "うん、わたしのだ。" },
        { speaker: "Ken", kana: "ありがとう！" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Tom want to know?",
          correctText: "Whether the bag is Ken's",
          distractors: [
            "Whether Ken has an umbrella",
            "Whose phone it is",
            "Where Ken's bag is",
          ],
        },
        {
          id: "q2",
          prompt: "How does Ken thank Tom?",
          correctText: "Casually — ありがとう",
          distractors: [
            "Politely, as to a stranger",
            "He apologizes instead",
            "He says it's okay",
          ],
        },
      ],
      exercisedAtomKanas: ["かばん", "の", "わたし", "ありがとう"],
    }),
    build(
      "ja-m4-neo-7-build-kore-kenno",
      "Build this sentence: This is Ken's bag.",
      "これは ケンの かばんだ",
      ["これ", "は", "ケン", "の", "かばん", "だ"],
      ["これ", "は", "ケン", "の", "かばん", "だ"],
      ["これ", "かばん", "の"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-7-lc-watashino",
      audioText: "わたしのだ。",
      question: "What does this mean?",
      correctMeaningEn: "It's mine.",
      distractorsEn: ["It's yours.", "Whose is it?", "It's not mine."],
      exercisedAtomKanas: ["わたし", "の"],
    }),
    translateStep({
      id: "ja-m4-neo-7-tr-watashino",
      promptEn: "Translate: It's mine.",
      acceptedAnswers: ["わたしのだ", "わたしの", "わたしのだ。", "わたしの。"],
      audioText: "わたしのだ",
      exercisedAtomKanas: ["わたし", "の"],
    }),
    sentenceMcq({
      id: "ja-m4-neo-7-mcq-mikano",
      prompt: "Your friend asks whose bag it is. It's Mika's — the short answer:",
      correctKana: "ミカのだ。",
      distractorsKana: ["ケンのだ。", "わたしのだ。", "ミカだ。"],
      explanation:
        "Xのだ answers 'whose?' in one beat: it's X's. ミカだ alone would say the BAG is Mika.",
      exercisedAtomKanas: ["の"],
    }),
    listeningBuildSentence({
      id: "ja-m4-neo-7-lbs-kenno-kaban",
      target: "ケンの かばんだ",
      tiles: ["ケン", "の", "かばん", "だ", "ミカ"],
      correctOrder: ["ケン", "の", "かばん", "だ"],
      promptEn: "It's Ken's bag.",
      exercisedAtomKanas: ["かばん", "の"],
    }),
    // Scene 3 — the bag swings; chunk callbacks in the wild.
    dialogueListen({
      id: "ja-m4-neo-7-dlg-scene3",
      lines: [
        { speaker: "Ken", kana: "ごめんなさい！" },
        { speaker: "Mika", kana: "だいじょうぶ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What just happened?",
          correctText: "Ken apologized and Mika said it was fine",
          distractors: [
            "Mika thanked Ken",
            "Ken introduced himself",
            "Mika apologized to Ken",
          ],
        },
      ],
      exercisedAtomKanas: ["ごめんなさい", "だいじょうぶ"],
    }),
    sentenceMcq({
      id: "ja-m4-neo-7-mcq-daijoubu",
      prompt: "Ken bumps you with the bag and says ごめんなさい. Your answer:",
      correctKana: "だいじょうぶ",
      distractorsKana: ["ありがとう", "うん", "そう"],
      exercisedAtomKanas: ["だいじょうぶ"],
    }),
    speaking(
      "ja-m4-neo-7-speak-dareno",
      "だれの かばん？",
      "Whose bag is it? (voice rises)",
      ["だれ", "の", "かばん"],
    ),
    // CAPSTONE (invariant 26) — the story's stretch beat before the tail:
    // それ (m4 L2) + possessive の (m4 L5) + a recycled object in one build.
    build(
      "ja-m4-neo-7-capstone",
      "Build this sentence: That (near you) is Ken's bag.",
      "それは ケンの かばんだ",
      ["それ", "は", "ケン", "の", "かばん", "だ", "これ"],
      ["それ", "は", "ケン", "の", "かばん", "だ"],
      ["それ", "の", "かばん"],
    ),
    // Review tail — prior atoms (house idiom: vocabMcq → decode-build →
    // LC → vocabMcq → match grid).
    vocabMcq("ja-m4-neo-7-rev-mcq", L7_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildWord(
      "ja-m4-neo-7-rev-lb-boushi",
      "ぼうし",
      "hat",
      ["ぼ", "う", "し"],
      ["ほ", "ば", "つ"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-7-rev-lc",
      audioText: L7_REVIEW[2].kana,
      question: "What did you hear?",
      correctMeaningEn: L7_REVIEW[2].meaningEn,
      distractorsEn: [
        L7_REVIEW[3].meaningEn,
        L7_REVIEW[4].meaningEn,
        L7_REVIEW[5].meaningEn,
      ],
      exercisedAtomKanas: [L7_REVIEW[2].kana],
    }),
    vocabMcq("ja-m4-neo-7-rev-mcq-2", L7_REVIEW[1], NEO_PRIOR_POOL),
    reviewMatchPairs("ja-m4-neo-7-rev", L7_REVIEW),
  ],
};

assertNoSameAnswerCluster(M4_NEO_7.steps);
assertAnswerRotation(M4_NEO_7.steps, 1); // single の cloze — story lesson
assertNoConsecutiveSame(M4_NEO_7.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L8 — "の — where it's from" (attributive の; spiral on L5's possession
 * card: same particle, second job). Card FIRST — a new job for a structural
 * particle is not inferable from one hearing (invariant 24).
 * ════════════════════════════════════════════════════════════════════════ */

const L8_REVIEW = pickReviewAtoms("ja-m4-neo-8-rev", NEO_PRIOR_POOL, 6);

export const M4_NEO_8: LessonContent = {
  id: "ja-m4-neo-8",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "の — where it's from",
  description:
    "The same の that marks owners also marks origins: にほんの くるま is a Japanese car. One glue, wider job.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① The rule — extends the possession card (spiral: reference the
    // owner meaning, add the origin/category job).
    grammarRule({
      id: "ja-m4-neo-8-rule-no-attr",
      title: "の again — where it's from",
      rule:
        "You know の links an owner to a thing: ケンの かばん. The SAME の links an origin or category to a thing: にほんの くるま = a car of-Japan — a Japanese car. Xの Y always reads back-to-front in English: the Y of X.",
      examples: [
        {
          ja: "にほんの くるまだ。",
          romaji: "nihon no kuruma da.",
          en: "It's a Japanese car.",
        },
        {
          ja: "アメリカの けいたいだ。",
          romaji: "amerika no keitai da.",
          en: "It's an American phone.",
        },
      ],
      // Genuine learner error: reading Xの Y front-to-back like English
      // and flipping the link. Full-sentence minimal pair of examples[0]
      // (same words, one wrong move) — invariant 12.
      antiPattern: {
        ja: "くるまの にほんだ。",
        romaji: "kuruma no nihon da.",
        en: "(broken: the link points the wrong way)",
        why:
          "の points from origin to thing: にほんの くるま. Flipped, it says 'the car's Japan' — nonsense.",
      },
      cultureNote:
        "Owner or origin, Japanese doesn't care — の just ties two nouns so the second belongs to the first's world. English needs 's, 'of', or an adjective; Japanese needs one syllable.",
    }),
    listeningCompSentence({
      id: "ja-m4-neo-8-lc-nihon-kuruma",
      audioText: "にほんの くるまだ。",
      question: "What does this mean?",
      correctMeaningEn: "It's a Japanese car.",
      distractorsEn: [
        "It's an American car.",
        "It's a Japanese phone.",
        "The car is in Japan.",
      ],
      exercisedAtomKanas: ["にほん", "くるま", "の"],
    }),
    build(
      "ja-m4-neo-8-build-nihon-kuruma",
      "Build this sentence: It's a Japanese car.",
      "にほんの くるまだ",
      ["にほん", "の", "くるま", "だ", "アメリカ"],
      ["にほん", "の", "くるま", "だ"],
      ["にほん", "くるま", "の"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-8-lc-amerika-keitai",
      audioText: "アメリカの けいたいだ。",
      question: "What does this mean?",
      correctMeaningEn: "It's an American phone.",
      distractorsEn: [
        "It's an American car.",
        "It's a Japanese phone.",
        "My phone is in America.",
      ],
      exercisedAtomKanas: ["アメリカ", "けいたい", "の"],
    }),
    build(
      "ja-m4-neo-8-build-amerika-keitai",
      "Build this sentence: It's an American phone.",
      "アメリカの けいたいだ",
      ["アメリカ", "の", "けいたい", "だ", "にほん"],
      ["アメリカ", "の", "けいたい", "だ"],
      ["アメリカ", "けいたい", "の"],
    ),
    cloze(
      "ja-m4-neo-8-cloze-no",
      "にほん",
      " けいたいだ。",
      "の",
      ["の", "は", "も", "か"],
      "It's a Japanese phone.",
      "にほんの けいたいだ。",
      "の hangs the origin on the thing: a Japan-kind of phone.",
    ),
    speaking(
      "ja-m4-neo-8-speak-nihon-kuruma",
      "にほんの くるまだ",
      "It's a Japanese car.",
      ["にほん", "くるま"],
    ),
    // Same particle, first job — possession rides along so the two の
    // readings stay one system, not two rules.
    listeningCompSentence({
      id: "ja-m4-neo-8-lc-mika-keitai",
      audioText: "ミカの けいたいだ。",
      question: "What does this mean?",
      correctMeaningEn: "It's Mika's phone.",
      distractorsEn: [
        "It's an American phone.",
        "It's Mika's car.",
        "It's my phone.",
      ],
      exercisedAtomKanas: ["けいたい", "の"],
    }),
    cloze(
      "ja-m4-neo-8-cloze-wa",
      "くるま",
      " にほんのだ。",
      "は",
      ["は", "の", "も", "か"],
      "The car is a Japanese one.",
      "くるまは にほんのだ。",
      "Spotlight the car, then say what kind it is: にほんの(だ) — the short-answer の you know from owners.",
    ),
    build(
      "ja-m4-neo-8-build-keitai-mikano",
      "Build this sentence: The phone is Mika's.",
      "けいたいは ミカのだ",
      ["けいたい", "は", "ミカ", "の", "だ", "にほん"],
      ["けいたい", "は", "ミカ", "の", "だ"],
      ["けいたい", "の"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-8-lc-kuruma-amerikano",
      audioText: "くるまは アメリカのだ。",
      question: "What does this mean?",
      correctMeaningEn: "The car is an American one.",
      distractorsEn: [
        "The car is a Japanese one.",
        "The phone is an American one.",
        "The car is Mika's.",
      ],
      exercisedAtomKanas: ["くるま", "アメリカ", "の"],
    }),
    translateStep({
      id: "ja-m4-neo-8-tr-nihon-keitai",
      promptEn: "Translate: It's a Japanese phone.",
      acceptedAnswers: [
        "にほんの けいたいだ",
        "にほんのけいたいだ",
        "にほんの けいたい",
        "にほんのけいたい",
      ],
      audioText: "にほんの けいたいだ",
      exercisedAtomKanas: ["にほん", "けいたい", "の"],
    }),
    // Invariant 28: full-sentence pick → build.
    build(
      "ja-m4-neo-8-build-amerika-kuruma",
      "Build this sentence: It's an American car.",
      "アメリカの くるまだ",
      ["アメリカ", "の", "くるま", "だ", "にほん"],
      ["アメリカ", "の", "くるま", "だ"],
      ["アメリカ", "くるま", "の"],
    ),
    // Closer — the origin の in a two-voice exchange.
    dialogueListen({
      id: "ja-m4-neo-8-dlg-close",
      lines: [
        { speaker: "Tom", kana: "あれは にほんの くるまだ。" },
        { speaker: "Mika", kana: "わたしの くるまも にほんのだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Tom say about the car over there?",
          correctText: "It's a Japanese car",
          distractors: [
            "It's an American car",
            "It's Mika's car",
            "It's his car",
          ],
        },
        {
          id: "q2",
          prompt: "What does Mika add?",
          correctText: "Her own car is Japanese too",
          distractors: [
            "Her car is American",
            "She wants Tom's car",
            "Her phone is Japanese too",
          ],
        },
      ],
      exercisedAtomKanas: ["にほん", "くるま", "の", "も"],
    }),
    speaking(
      "ja-m4-neo-8-speak-amerika-kuruma",
      "アメリカの くるまだ",
      "It's an American car.",
      ["アメリカ", "くるま"],
    ),
    listeningBuildSentence({
      id: "ja-m4-neo-8-capstone",
      target: "くるまは にほんのだ",
      tiles: ["くるま", "は", "にほん", "の", "だ", "アメリカ"],
      correctOrder: ["くるま", "は", "にほん", "の", "だ"],
      promptEn: "The car is a Japanese one.",
      exercisedAtomKanas: ["くるま", "にほん", "の"],
    }),
    // Review tail — prior atoms (house idiom: vocabMcq → decode-build →
    // LC → match grid).
    vocabMcq("ja-m4-neo-8-rev-mcq", L8_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildWord(
      "ja-m4-neo-8-rev-lb-kagi",
      "かぎ",
      "key",
      ["か", "ぎ"],
      ["が", "き", "ね"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-8-rev-lc",
      audioText: L8_REVIEW[1].kana,
      question: "What did you hear?",
      correctMeaningEn: L8_REVIEW[1].meaningEn,
      distractorsEn: [
        L8_REVIEW[2].meaningEn,
        L8_REVIEW[3].meaningEn,
        L8_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L8_REVIEW[1].kana],
    }),
    reviewMatchPairs("ja-m4-neo-8-rev", L8_REVIEW),
  ],
};

assertNoSameAnswerCluster(M4_NEO_8.steps);
assertAnswerRotation(M4_NEO_8.steps, 2); // rotates の / は by design
assertNoConsecutiveSame(M4_NEO_8.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L9 — "どれ — which one?" (SUBSTITUTION class: rule card BEFORE first
 * exposure — invariant 24; どれ joins the こ/そ/あ pointing family.)
 * ════════════════════════════════════════════════════════════════════════ */

const L9_REVIEW = pickReviewAtoms("ja-m4-neo-9-rev", NEO_PRIOR_POOL, 6);

export const M4_NEO_9: LessonContent = {
  id: "ja-m4-neo-9",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "どれ — which one?",
  description:
    "Three umbrellas in the stand — which one is yours? どれ asks; これ/それ/あれ answer by pointing.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① The rule FIRST — a new member of a closed pointing system is not
    // inferable from one hearing.
    grammarRule({
      id: "ja-m4-neo-9-rule-dore",
      title: "どれ — which one?",
      rule:
        "これ・それ・あれ point at ONE thing. When there are three or more and you don't know WHICH, ask with どれ: かばんは どれ？ = 'Which one is the bag?' Answer by pointing: これだ。それだ。あれだ。",
      examples: [
        {
          ja: "かばんは どれ？",
          romaji: "kaban wa dore?",
          en: "Which one is the bag?",
        },
        { ja: "これだ。", romaji: "kore da.", en: "This one." },
      ],
      // Genuine learner error: giving the question word the spotlight.
      // Full-sentence minimal pair of examples[0] (same words, reordered).
      antiPattern: {
        ja: "どれは かばん？",
        romaji: "dore wa kaban?",
        en: "(broken: どれ never takes は)",
        why:
          "Question words don't take the spotlight は. Spotlight the thing you're hunting — かばんは — and let どれ stand alone.",
      },
      cultureNote:
        "The pointing family is one sound system: こ (near me), そ (near you), あ (far from us both) — and ど is its question member: which?",
    }),
    listeningCompSentence({
      id: "ja-m4-neo-9-lc-kasa-dore",
      audioText: "かさは どれ？",
      question: "What does this mean?",
      correctMeaningEn: "Which one is the umbrella?",
      distractorsEn: [
        "Where is the umbrella?",
        "Whose umbrella is it?",
        "Which one is the bag?",
      ],
      exercisedAtomKanas: ["かさ", "どれ"],
    }),
    build(
      "ja-m4-neo-9-build-kore",
      "Build this sentence: It's this one.",
      "これだ",
      ["これ", "だ", "どれ"],
      ["これ", "だ"],
      ["これ"],
    ),
    // ② The system in the wild — perspective flip included (Tom's これ is
    // Mika's それ).
    dialogueListen({
      id: "ja-m4-neo-9-dlg-umbrella",
      lines: [
        { speaker: "Mika", kana: "わたしの かさ、どれ？" },
        { speaker: "Tom", kana: "これ？" },
        { speaker: "Mika", kana: "それだ。ありがとう！" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What is Mika looking for?",
          correctText: "Her umbrella",
          distractors: ["Her bag", "Tom's umbrella", "Her phone"],
        },
        {
          id: "q2",
          prompt: "Did Tom find it?",
          correctText: "Yes — the one he held up is hers",
          distractors: [
            "No — it's someone else's",
            "No — he found her bag instead",
            "She isn't sure",
          ],
        },
      ],
      exercisedAtomKanas: ["かさ", "どれ", "それ", "ありがとう"],
    }),
    listeningCompSentence({
      id: "ja-m4-neo-9-lc-soreda",
      audioText: "それだ。",
      question:
        "What does this mean?",
      correctMeaningEn: "That's the one (you're holding).",
      distractorsEn: [
        "This one (near me).",
        "That one over there.",
        "Which one?",
      ],
      exercisedAtomKanas: ["それ"],
    }),
    build(
      "ja-m4-neo-9-build-are",
      "Build this sentence: It's that one over there.",
      "あれだ",
      ["あれ", "だ", "これ"],
      ["あれ", "だ"],
      ["あれ"],
    ),
    cloze(
      "ja-m4-neo-9-cloze-wa",
      "かばん",
      " どれ？",
      "は",
      ["は", "の", "も", "が"],
      "Which one is the bag?",
      "かばんは どれ？",
      "Spotlight what you're hunting for, then ask which.",
    ),
    speaking(
      "ja-m4-neo-9-speak-kaban-dore",
      "かばんは どれ？",
      "Which one is the bag? (voice rises)",
      ["かばん", "どれ"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-9-lc-megane-dore",
      audioText: "めがねは どれ？",
      question: "What does this mean?",
      correctMeaningEn: "Which ones are the glasses?",
      distractorsEn: [
        "Whose glasses are they?",
        "Where are the glasses?",
        "Which one is the umbrella?",
      ],
      exercisedAtomKanas: ["めがね", "どれ"],
    }),
    // Invariant 28: full-sentence pick → build (reordered so the two builds
    // don't sit adjacent — the LC now separates them).
    build(
      "ja-m4-neo-9-build-ask-kuruma",
      "Build this sentence: Which one is Ken's car?",
      "ケンの くるまは どれ",
      ["ケン", "の", "くるま", "は", "どれ", "これ"],
      ["ケン", "の", "くるま", "は", "どれ"],
      ["くるま", "どれ", "の"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-9-lc-areda",
      audioText: "あれだ。",
      question: "What does this mean?",
      correctMeaningEn: "That one over there.",
      distractorsEn: [
        "This one here.",
        "That one next to you.",
        "Which one?",
      ],
      exercisedAtomKanas: ["あれ"],
    }),
    build(
      "ja-m4-neo-9-build-kore-kenno",
      "Build this sentence: This is Ken's car.",
      "これは ケンの くるまだ",
      ["これ", "は", "ケン", "の", "くるま", "だ"],
      ["これ", "は", "ケン", "の", "くるま", "だ"],
      ["これ", "くるま", "の"],
    ),
    translateStep({
      id: "ja-m4-neo-9-tr-are",
      promptEn:
        "Translate: It's that one over there.",
      acceptedAnswers: ["あれだ", "あれ", "あれだ。", "あれ。"],
      audioText: "あれだ",
      exercisedAtomKanas: ["あれ"],
    }),
    listeningBuildSentence({
      id: "ja-m4-neo-9-capstone",
      target: "それは ミカの かさだ",
      tiles: ["それ", "は", "ミカ", "の", "かさ", "だ", "どれ"],
      correctOrder: ["それ", "は", "ミカ", "の", "かさ", "だ"],
      promptEn: "That's Mika's umbrella.",
      exercisedAtomKanas: ["それ", "かさ", "の"],
    }),
    speaking("ja-m4-neo-9-speak-soreda", "それだ", "That's the one.", ["それ"]),
    // Review tail — prior atoms (house idiom: vocabMcq → decode-build →
    // LC → vocabMcq → match grid).
    vocabMcq("ja-m4-neo-9-rev-mcq", L9_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildWord(
      "ja-m4-neo-9-rev-lb-enpitsu",
      "えんぴつ",
      "pencil",
      ["え", "ん", "ぴ", "つ"],
      ["お", "び", "す"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-9-rev-lc",
      audioText: L9_REVIEW[1].kana,
      question: "What did you hear?",
      correctMeaningEn: L9_REVIEW[1].meaningEn,
      distractorsEn: [
        L9_REVIEW[2].meaningEn,
        L9_REVIEW[3].meaningEn,
        L9_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L9_REVIEW[1].kana],
    }),
    vocabMcq("ja-m4-neo-9-rev-mcq-2", L9_REVIEW[5], NEO_PRIOR_POOL),
    reviewMatchPairs("ja-m4-neo-9-rev", L9_REVIEW),
  ],
};

assertNoSameAnswerCluster(M4_NEO_9.steps);
assertAnswerRotation(M4_NEO_9.steps, 1); // single は cloze — どれ intro lesson
assertNoConsecutiveSame(M4_NEO_9.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L10 — "Objects III + こ/そ/あ/ど consolidation" (vocab-lesson variation:
 * heavier vocabMcq/image intros, no new grammar). じてんしゃ + じしょ enter;
 * mixed drills across all four pointers + の recombinations.
 * ════════════════════════════════════════════════════════════════════════ */

const L10_REVIEW = pickReviewAtoms("ja-m4-neo-10-rev", NEO_PRIOR_POOL, 6);

export const M4_NEO_10: LessonContent = {
  id: "ja-m4-neo-10",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Bicycles and dictionaries",
  description:
    "Two more things to point at — じてんしゃ and じしょ — then the whole こ/そ/あ/ど family in mixed drills.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Vocab intros — image MCQ debut (vocab-lesson idiom), then the
    // word straight into pointer frames.
    vocabMcq(
      "ja-m4-neo-10-vmcq-jitensha",
      { kana: "じてんしゃ", meaningEn: "bicycle", emoji: "🚲", fromModule: "m4" },
      NEO_PRIOR_POOL,
    ),
    listeningCompSentence({
      id: "ja-m4-neo-10-lc-kore-jitensha",
      audioText: "これは じてんしゃだ。",
      question: "What does this mean?",
      correctMeaningEn: "This is a bicycle.",
      distractorsEn: [
        "That over there is a bicycle.",
        "This is a car.",
        "This is a bag.",
      ],
      exercisedAtomKanas: ["これ", "じてんしゃ"],
    }),
    build(
      "ja-m4-neo-10-build-kore-jitensha",
      "Build this sentence: This is a bicycle.",
      "これは じてんしゃだ",
      ["これ", "は", "じてんしゃ", "だ", "くるま"],
      ["これ", "は", "じてんしゃ", "だ"],
      ["これ", "じてんしゃ"],
    ),
    vocabMcq(
      "ja-m4-neo-10-vmcq-jisho",
      { kana: "じしょ", meaningEn: "dictionary", emoji: "📕", fromModule: "m4" },
      NEO_PRIOR_POOL,
    ),
    listeningCompSentence({
      id: "ja-m4-neo-10-lc-sore-jisho",
      audioText: "それは じしょだ。",
      question: "What does this mean?",
      correctMeaningEn: "That (near you) is a dictionary.",
      distractorsEn: [
        "This (near me) is a dictionary.",
        "That (near you) is a bicycle.",
        "That (over there) is a dictionary.",
      ],
      exercisedAtomKanas: ["それ", "じしょ"],
    }),
    build(
      "ja-m4-neo-10-build-are-jitensha",
      "Build this sentence: That (over there) is a bicycle.",
      "あれは じてんしゃだ",
      ["あれ", "は", "じてんしゃ", "だ", "これ"],
      ["あれ", "は", "じてんしゃ", "だ"],
      ["あれ", "じてんしゃ"],
    ),
    // ② の recombinations over the new nouns.
    cloze(
      "ja-m4-neo-10-cloze-dareno",
      "だれ",
      " じてんしゃ？",
      "の",
      ["の", "は", "も", "か"],
      "Whose bicycle is it?",
      "だれの じてんしゃ？",
      "の hangs the owner question on the thing: whose bicycle.",
    ),
    speaking(
      "ja-m4-neo-10-speak-dareno-jitensha",
      "だれの じてんしゃ？",
      "Whose bicycle is it? (voice rises)",
      ["だれ", "の", "じてんしゃ"],
    ),
    dialogueListen({
      id: "ja-m4-neo-10-dlg-rack",
      lines: [
        { speaker: "Ken", kana: "それ、だれの じてんしゃ？" },
        { speaker: "Mika", kana: "トムのだ。" },
        { speaker: "Ken", kana: "あれは？" },
        { speaker: "Mika", kana: "わたしのだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Whose bicycle is the one near Mika?",
          correctText: "Tom's",
          distractors: ["Mika's", "Ken's", "Tanaka's"],
        },
        {
          id: "q2",
          prompt: "And the one far away?",
          correctText: "Mika's — she says it's hers",
          distractors: ["Tom's", "Tanaka's", "Nobody knows"],
        },
      ],
      exercisedAtomKanas: ["じてんしゃ", "だれ", "の", "あれ"],
    }),
    // Invariant 28: full-sentence pick → build (reordered so the two builds
    // don't sit adjacent — the LC now separates them).
    build(
      "ja-m4-neo-10-build-dareno-jisho",
      "Build this sentence: Whose dictionary is it?",
      "だれの じしょ",
      ["だれ", "の", "じしょ", "じてんしゃ"],
      ["だれ", "の", "じしょ"],
      ["だれ", "の", "じしょ"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-10-lc-jisho-dore",
      audioText: "じしょは どれ？",
      question: "What does this mean?",
      correctMeaningEn: "Which one is the dictionary?",
      distractorsEn: [
        "Whose dictionary is it?",
        "Which one is the bicycle?",
        "Is that a dictionary?",
      ],
      exercisedAtomKanas: ["じしょ", "どれ"],
    }),
    build(
      "ja-m4-neo-10-build-tomuno",
      "Build this sentence: It's Tom's bicycle.",
      "トムの じてんしゃだ",
      ["トム", "の", "じてんしゃ", "だ", "わたし"],
      ["トム", "の", "じてんしゃ", "だ"],
      ["じてんしゃ", "の"],
    ),
    translateStep({
      id: "ja-m4-neo-10-tr-watashino-jitensha",
      promptEn: "Translate: It's my bicycle.",
      acceptedAnswers: [
        "わたしの じてんしゃだ",
        "わたしのじてんしゃだ",
        "わたしの じてんしゃ",
        "わたしのじてんしゃ",
      ],
      audioText: "わたしの じてんしゃだ",
      exercisedAtomKanas: ["わたし", "の", "じてんしゃ"],
    }),
    listeningBuildSentence({
      id: "ja-m4-neo-10-capstone",
      target: "これは トムの じしょだ",
      tiles: ["これ", "は", "トム", "の", "じしょ", "だ", "どれ"],
      correctOrder: ["これ", "は", "トム", "の", "じしょ", "だ"],
      promptEn: "This is Tom's dictionary.",
      exercisedAtomKanas: ["これ", "じしょ", "の"],
    }),
    speaking(
      "ja-m4-neo-10-speak-sore-tomuno",
      "それは トムのだ",
      "That one (near you) is Tom's.",
      ["それ", "の"],
    ),
    // ③ こ/そ/あ/ど consolidation pick.
    sentenceMcq({
      id: "ja-m4-neo-10-mcq-family",
      prompt: "Your friend asks どれ？ — pick 'that one over there.'",
      correctKana: "あれだ。",
      distractorsKana: ["これだ。", "それだ。", "かばんだ。"],
      exercisedAtomKanas: ["あれ"],
    }),
    // Review tail — prior atoms (house idiom: vocabMcq → decode-build →
    // LC → match grid).
    vocabMcq("ja-m4-neo-10-rev-mcq", L10_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildWord(
      "ja-m4-neo-10-rev-lb-kippu",
      "きっぷ",
      "ticket",
      ["き", "っ", "ぷ"],
      ["ぎ", "つ", "ぶ"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-10-rev-lc",
      audioText: L10_REVIEW[1].kana,
      question: "What did you hear?",
      correctMeaningEn: L10_REVIEW[1].meaningEn,
      distractorsEn: [
        L10_REVIEW[2].meaningEn,
        L10_REVIEW[3].meaningEn,
        L10_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L10_REVIEW[1].kana],
    }),
    reviewMatchPairs("ja-m4-neo-10-rev", L10_REVIEW),
  ],
};

assertNoSameAnswerCluster(M4_NEO_10.steps);
assertAnswerRotation(M4_NEO_10.steps, 1); // single の cloze — vocab lesson
assertNoConsecutiveSame(M4_NEO_10.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L11 — "Story: in Tanaka's classroom" (integration dialogue)
 * Pointing at things, whose-is-whose; Tanaka speaks TWO flagged です lines
 * (the Irodori register-preview device, same as m3-neo L6 scene 3).
 * ════════════════════════════════════════════════════════════════════════ */

const L11_REVIEW = pickReviewAtoms("ja-m4-neo-11-rev", NEO_PRIOR_POOL, 6);

export const M4_NEO_11: LessonContent = {
  id: "ja-m4-neo-11",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Story: in Tanaka's classroom",
  description:
    "Tom points at everything in the classroom — and the owner of the mystery dictionary walks in, speaking politely.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // Scene 1 — what's that? whose?
    dialogueListen({
      id: "ja-m4-neo-11-dlg-scene1",
      lines: [
        { speaker: "Tom", kana: "それ、なに？" },
        { speaker: "Mika", kana: "じしょだ。" },
        { speaker: "Tom", kana: "だれの じしょ？" },
        { speaker: "Mika", kana: "たなかのだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Tom ask about first?",
          correctText: "What the thing near Mika is",
          distractors: [
            "Where the teacher is",
            "Whose bag it is",
            "Which one is his",
          ],
        },
        {
          id: "q2",
          prompt: "Whose dictionary is it?",
          correctText: "Tanaka's",
          distractors: ["Mika's", "Tom's", "Ken's"],
        },
      ],
      exercisedAtomKanas: ["それ", "なに", "じしょ", "だれ", "の"],
    }),
    build(
      "ja-m4-neo-11-build-tanakano",
      "Build this sentence: It's Tanaka's dictionary.",
      "たなかの じしょだ",
      ["たなか", "の", "じしょ", "だ", "わたし"],
      ["たなか", "の", "じしょ", "だ"],
      ["じしょ", "の"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-11-lc-tanakanoda",
      audioText: "たなかのだ。",
      question: "What does this mean?",
      correctMeaningEn: "It's Tanaka's.",
      distractorsEn: [
        "It's mine.",
        "It's a dictionary.",
        "Tanaka is here.",
      ],
      exercisedAtomKanas: ["の"],
    }),
    speaking(
      "ja-m4-neo-11-speak-dareno-jisho",
      "だれの じしょ？",
      "Whose dictionary is it? (voice rises)",
      ["だれ", "の", "じしょ"],
    ),
    // Scene 2 — the owner walks in: TWO flagged です lines.
    dialogueListen({
      id: "ja-m4-neo-11-dlg-scene2",
      lines: [
        { speaker: "Ken", kana: "せんせいだ。" },
        { speaker: "Tanaka", kana: "それは わたしの じしょです。" },
        { speaker: "Tanaka", kana: "にほんの じしょです。" },
      ],
      questions: [
        {
          id: "q1",
          prompt:
            "Tanaka says じしょです — with です, not だ. Why the different ending?",
          correctText:
            "です is the polite layer — same meaning as だ, more formal (its module comes soon)",
          distractors: [
            "です makes it a question",
            "です means 'dictionary'",
            "です makes it past tense",
          ],
          explanation:
            "Teachers and staff wrap statements in です. Just recognize it — your own sentences stay plain for now.",
        },
        {
          id: "q2",
          prompt: "What kind of dictionary is it?",
          correctText: "A Japanese one — and it's Tanaka's",
          distractors: ["An American one", "Ken's", "A new one"],
        },
      ],
      exercisedAtomKanas: ["せんせい", "じしょ", "にほん", "の"],
    }),
    // です second exposure — flagged recognition.
    listeningCompSentence({
      id: "ja-m4-neo-11-lc-desu-preview",
      audioText: "せんせいの かばんです。",
      correctMeaningEn: "It's the teacher's bag.",
      distractorsEn: [
        "It's the teacher's umbrella.",
        "It's the student's bag.",
        "Is it the teacher's bag?",
      ],
      explanation:
        "The polite です again — same meaning as せんせいの かばんだ, more distance. Recognition only for now.",
      exercisedAtomKanas: ["せんせい", "かばん", "の"],
    }),
    build(
      "ja-m4-neo-11-build-senseino",
      "Build this sentence: It's the teacher's dictionary.",
      "せんせいの じしょだ",
      ["せんせい", "の", "じしょ", "だ", "がくせい"],
      ["せんせい", "の", "じしょ", "だ"],
      ["せんせい", "じしょ", "の"],
    ),
    cloze(
      "ja-m4-neo-11-cloze-no",
      "たなか",
      " かばんだ。",
      "の",
      ["の", "は", "も", "か"],
      "It's Tanaka's bag.",
      "たなかの かばんだ。",
      "の clips the owner on: Tanaka's bag.",
    ),
    // Scene 3 — whose-is-whose around the room (も recombination).
    dialogueListen({
      id: "ja-m4-neo-11-dlg-scene3",
      lines: [
        { speaker: "Tom", kana: "あれは だれの かさ？" },
        { speaker: "Ken", kana: "ミカのだ。" },
        { speaker: "Tom", kana: "これも ミカの？" },
        { speaker: "Ken", kana: "うん、ミカのだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Whose umbrella is the one over there?",
          correctText: "Mika's",
          distractors: ["Ken's", "Tanaka's", "Tom's"],
        },
        {
          id: "q2",
          prompt: "What does Tom's second question ask?",
          correctText: "Whether this one is also Mika's",
          distractors: [
            "Whether Mika is here",
            "Which one is Mika's",
            "Whose umbrella that one is",
          ],
        },
      ],
      exercisedAtomKanas: ["あれ", "だれ", "かさ", "の", "も", "うん"],
    }),
    // Invariant 28: full-sentence pick → build.
    build(
      "ja-m4-neo-11-build-mikano-kasa",
      "Build this sentence: It's Mika's umbrella.",
      "ミカの かさだ",
      ["ミカ", "の", "かさ", "だ", "ケン"],
      ["ミカ", "の", "かさ", "だ"],
      ["かさ", "の"],
    ),
    translateStep({
      id: "ja-m4-neo-11-tr-tanakano",
      promptEn: "Translate: It's Tanaka's bag.",
      acceptedAnswers: [
        "たなかの かばんだ",
        "たなかのかばんだ",
        "たなかの かばん",
        "たなかのかばん",
      ],
      audioText: "たなかの かばんだ",
      exercisedAtomKanas: ["かばん", "の"],
    }),
    listeningCompSentence({
      id: "ja-m4-neo-11-lc-sensei-keitai",
      audioText: "これは せんせいの けいたいだ。",
      question: "What does this mean?",
      correctMeaningEn: "This is the teacher's phone.",
      distractorsEn: [
        "This is the teacher's bag.",
        "That is the student's phone.",
        "This is my phone.",
      ],
      exercisedAtomKanas: ["これ", "せんせい", "けいたい", "の"],
    }),
    build(
      "ja-m4-neo-11-build-koremo",
      "Build this sentence: This one is the teacher's too.",
      "これも せんせいのだ",
      ["これ", "も", "は", "せんせい", "の", "だ"],
      ["これ", "も", "せんせい", "の", "だ"],
      ["これ", "せんせい", "の", "も"],
    ),
    speaking(
      "ja-m4-neo-11-speak-tanakano-jisho",
      "たなかの じしょだ",
      "It's Tanaka's dictionary.",
      ["じしょ", "の"],
    ),
    listeningBuildSentence({
      id: "ja-m4-neo-11-capstone",
      target: "あれは ミカの かさだ",
      tiles: ["あれ", "は", "ミカ", "の", "かさ", "だ"],
      correctOrder: ["あれ", "は", "ミカ", "の", "かさ", "だ"],
      promptEn: "That one over there is Mika's umbrella.",
      exercisedAtomKanas: ["あれ", "かさ", "の"],
    }),
    // Review tail — prior atoms (house idiom: vocabMcq → LC → decode-build
    // → vocabMcq → match grid).
    vocabMcq("ja-m4-neo-11-rev-mcq", L11_REVIEW[0], NEO_PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m4-neo-11-rev-lc",
      audioText: L11_REVIEW[1].kana,
      question: "What did you hear?",
      correctMeaningEn: L11_REVIEW[1].meaningEn,
      distractorsEn: [
        L11_REVIEW[2].meaningEn,
        L11_REVIEW[3].meaningEn,
        L11_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L11_REVIEW[1].kana],
    }),
    listeningBuildWord(
      "ja-m4-neo-11-rev-lb-fune",
      "ふね",
      "boat",
      ["ふ", "ね"],
      ["ほ", "れ", "ぬ"],
    ),
    vocabMcq("ja-m4-neo-11-rev-mcq-2", L11_REVIEW[5], NEO_PRIOR_POOL),
    reviewMatchPairs("ja-m4-neo-11-rev", L11_REVIEW),
  ],
};

assertNoSameAnswerCluster(M4_NEO_11.steps);
assertAnswerRotation(M4_NEO_11.steps, 1); // single の cloze — story lesson
assertNoConsecutiveSame(M4_NEO_11.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L12 — mixed review (ja-m4-neo-review)
 * ALL-NEW sentences (no lesson-1-11 audioText verbatim — the m3-neo review
 * fresh-sentence discipline): every surface recombines m4 grammar with
 * m1-m3 CARRIER nouns (ぼうし/とけい/めがね/ふね/うた/かぎ class) that the
 * teaching lessons never ran. ≥60% sentence-context; every concept + the
 * chunk callbacks; closes on the match grid.
 * ════════════════════════════════════════════════════════════════════════ */

const L12_REVIEW = pickReviewAtoms("ja-m4-neo-review-rev", NEO_PRIOR_POOL, 6);

export const M4_NEO_REVIEW: LessonContent = {
  id: "ja-m4-neo-review",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Pointing and owning — review",
  description:
    "これ/それ/あれ/どれ, だれ, 何, and both jobs of の — recombined over everything you already own, in all-new sentences.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    listeningCompSentence({
      id: "ja-m4-neo-rev-lc-boushi",
      audioText: "それは ケンの ぼうしだ。",
      question: "What does this mean?",
      correctMeaningEn: "That (near you) is Ken's hat.",
      distractorsEn: [
        "This is Ken's hat.",
        "That is Mika's hat.",
        "That is Ken's bag.",
      ],
      exercisedAtomKanas: ["それ", "の"],
    }),
    build(
      "ja-m4-neo-rev-build-tokei",
      "Build this sentence: This is Mika's watch.",
      "これは ミカの とけいだ",
      ["これ", "は", "ミカ", "の", "とけい", "だ", "あれ"],
      ["これ", "は", "ミカ", "の", "とけい", "だ"],
      ["これ", "とけい", "の"],
    ),
    cloze(
      "ja-m4-neo-rev-cloze-no",
      "だれ",
      " めがね？",
      "の",
      ["の", "は", "も", "か"],
      "Whose glasses are they?",
      "だれの めがね？",
      "の hangs the owner question on the thing: whose glasses.",
    ),
    speaking(
      "ja-m4-neo-rev-speak-tomodachino",
      "ともだちのだ",
      "It's my friend's.",
      ["ともだち", "の"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-rev-lc-fune",
      audioText: "これは にほんの ふねだ。",
      question: "What does this mean?",
      correctMeaningEn: "This is a Japanese boat.",
      distractorsEn: [
        "This is an American boat.",
        "That is a Japanese car.",
        "This boat is mine.",
      ],
      exercisedAtomKanas: ["これ", "にほん", "の"],
    }),
    build(
      "ja-m4-neo-rev-build-uta",
      "Build this sentence: It's an American song.",
      "アメリカの うただ",
      ["アメリカ", "の", "うた", "だ", "にほん"],
      ["アメリカ", "の", "うた", "だ"],
      ["アメリカ", "うた", "の"],
    ),
    sentenceMcq({
      id: "ja-m4-neo-rev-mcq-nan",
      prompt: "A friend holds up something you can't make out. Ask what it is.",
      correctKana: "それ、なに？",
      distractorsKana: ["だれ？", "どれ？", "それだ。"],
      exercisedAtomKanas: ["それ", "なに"],
    }),
    listeningCompSentence({
      id: "ja-m4-neo-rev-lc-dareno-boushi",
      audioText: "あれは だれの ぼうし？",
      question: "What does this mean?",
      correctMeaningEn: "Whose hat is that (over there)?",
      distractorsEn: [
        "Whose hat is this?",
        "Is that your hat?",
        "Which one is the hat?",
      ],
      exercisedAtomKanas: ["あれ", "だれ", "の"],
    }),
    build(
      "ja-m4-neo-rev-build-senseino",
      "Build this sentence: That (over there) is the teacher's.",
      "あれは せんせいのだ",
      ["あれ", "は", "せんせい", "の", "だ", "これ"],
      ["あれ", "は", "せんせい", "の", "だ"],
      ["あれ", "せんせい", "の"],
    ),
    // です — flagged recognition preview, review beat.
    listeningCompSentence({
      id: "ja-m4-neo-rev-lc-desu",
      audioText: "たなかの とけいです。",
      correctMeaningEn: "It's Tanaka's watch.",
      distractorsEn: [
        "It's Tanaka's phone.",
        "Is it Tanaka's watch?",
        "It's my watch.",
      ],
      explanation:
        "The polite です again — same meaning as たなかの とけいだ, more distance. Still recognition-only; its own module comes soon.",
      exercisedAtomKanas: ["の"],
    }),
    translateStep({
      id: "ja-m4-neo-rev-tr-kagi",
      promptEn: "Translate: It's Ken's key.",
      acceptedAnswers: [
        "ケンの かぎだ",
        "ケンのかぎだ",
        "ケンの かぎ",
        "ケンのかぎ",
      ],
      audioText: "ケンの かぎだ",
      exercisedAtomKanas: ["の"],
    }),
    sentenceMcq({
      id: "ja-m4-neo-rev-mcq-gomen",
      prompt: "You knock your friend's key off the desk. What do you say first?",
      correctKana: "ごめんなさい",
      distractorsKana: ["だいじょうぶ", "ありがとう", "うん"],
      exercisedAtomKanas: ["ごめんなさい"],
    }),
    listeningCompSentence({
      id: "ja-m4-neo-rev-lc-boushi-dore",
      audioText: "ぼうしは どれ？",
      question: "What does this mean?",
      correctMeaningEn: "Which one is the hat?",
      distractorsEn: [
        "Whose hat is it?",
        "Where is the hat?",
        "Which one is the key?",
      ],
      exercisedAtomKanas: ["どれ"],
    }),
    listeningBuildSentence({
      id: "ja-m4-neo-rev-lbs-fune",
      target: "これは ともだちの ふねだ",
      tiles: ["これ", "は", "ともだち", "の", "ふね", "だ", "も"],
      correctOrder: ["これ", "は", "ともだち", "の", "ふね", "だ"],
      promptEn: "This is my friend's boat.",
      exercisedAtomKanas: ["これ", "ともだち", "の"],
    }),
    speaking(
      "ja-m4-neo-rev-speak-megane",
      "ミカの めがねだ",
      "They're Mika's glasses.",
      ["めがね", "の"],
    ),
    cloze(
      "ja-m4-neo-rev-cloze-mo",
      "これ",
      " ケンのだ。",
      "も",
      ["も", "は", "の", "か"],
      "This one is Ken's too.",
      "これも ケンのだ。",
      "Same owner as the last thing — 'too' replaces the spotlight.",
    ),
    // Review tail (house idiom: vocabMcq → decode-build → vocabMcq →
    // match grid; the pool-word LC beat is skipped here on purpose — a
    // seeded draw could coincide with an earlier tail's draw and trip the
    // fresh-sentence check).
    vocabMcq("ja-m4-neo-rev-mcq-vocab", L12_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildWord(
      "ja-m4-neo-rev-lb-eki",
      "えき",
      "station",
      ["え", "き"],
      ["お", "ぎ", "け"],
    ),
    vocabMcq("ja-m4-neo-rev-mcq-vocab-2", L12_REVIEW[3], NEO_PRIOR_POOL),
    reviewMatchPairs("ja-m4-neo-review", L12_REVIEW),
  ],
};

assertNoSameAnswerCluster(M4_NEO_REVIEW.steps);
assertAnswerRotation(M4_NEO_REVIEW.steps, 2); // rotates の / も
assertNoConsecutiveSame(M4_NEO_REVIEW.steps);

/** Lessons 7-12 (second half of m4-neo), deep-link order. */
export const M4_NEO_B_LESSONS: LessonContent[] = [
  M4_NEO_7,
  M4_NEO_8,
  M4_NEO_9,
  M4_NEO_10,
  M4_NEO_11,
  M4_NEO_REVIEW,
];
