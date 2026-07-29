/**
 * M4-NEO (first half, L1-L6) — dict-form-first course rewrite, spine s04
 * (docs/m4-neo-authoring-spec-2026-07-20.md).
 *
 * "Possession & pointing — の, これ/それ/あれ/どれ, だれ, 何": the pointer
 * system and the owner particle over concrete, point-at-able objects.
 * Plain-form register (だ) throughout — です appears only as flagged
 * recognition previews, and none are scheduled in this half (Tanaka's
 * preview lines live in L11, file -b). Register-explicit: every production
 * prompt names its audience ("Tell a friend: …").
 *
 * This file: lessons 1-6. Lessons 7-12 live in m4-neo-b.ts (authored
 * separately; local helpers are deliberately DUPLICATED there rather than
 * cross-imported, per the spec's file-layout note). Registration, barrel,
 * tests and TTS are wired after both halves land — nothing here touches
 * mockLessons/mockCourse/manifest.
 *
 * Constraints honored (pinned invariants + concept-type guide):
 *  - L1 これ: exposure-first (だ-class — pointing is inferable), m3-neo L1
 *    shape: LCs interleaved with builds/speaking, rule as the answer to
 *    the noticing. Wave-1 objects かばん/けいたい/くるま enter on
 *    vocabMcq intro steps (intro-capable, provenance-safe).
 *  - L2 それ/あれ: SUBSTITUTION class — compact three-way rule card
 *    BEFORE first exposure (invariant 24), then choice-under-contrast
 *    (situation cue → pick/build the right pointer). No どれ yet.
 *  - L3 これ、なに？: rides the m3 casual-contour question. Surfaces use
 *    なに (the standalone reading — an existing m1 atom, id "nani");
 *    なん stays reserved for fused forms (なんだ/なんですか, later
 *    modules) and is explained on the card, never produced bare.
 *  - L4 objects II (いす/かさ/てがみ): vocab-lesson variation — no new
 *    grammar, heavier image intros/builds/listening builds.
 *  - L5 の: rule card first (new structural particle). Anti-pattern is
 *    the genuine の-order error (ほんの わたし for "my book") as a
 *    full-sentence minimal pair (invariant 12 semantic contract).
 *  - L6 だれ/だれの: card teaches the short-answer chunk ケンのだ
 *    ("it's Ken's" — の carrying the noun silently); recognition + use.
 *    Dialogue closer.
 *  - Every lesson: 18-24 steps, no two adjacent same-type steps, ≤2
 *    selection taps in a row, ≥5 step types, ≤3 uses of any primary
 *    sentence, house review tail (reviewMatchPairs over the seeded pool +
 *    vocabMcq + a listening_build), closes on the match grid. だ-drop
 *    accepted in translate steps (m3-neo acceptedAnswers pattern).
 *
 * Course atoms: the ENTIRE m4 allocation already exists in courseAtoms.ts
 * (これ/それ/あれ/どれ/だれ/なん as rubric-blocked demonstrative/
 * interrogative entries, の as p-no, all object nouns) — NOTHING added.
 * なに also pre-exists as an m1 atom ("nani", blocked) and is the kana
 * surface this module actually voices; steps exercise it directly.
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
 * shape as m3-neo's local helper, duplicated per the spec's no-cross-import
 * rule for the two m4 halves).
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

// Review pools: M1 + M2 + M3 — m3 atoms now count as prior vocab (spec:
// "review tails draw prior modules"). Katakana entries are excluded, same
// ruling as m3-neo: the pool's katakana loanwords (コーヒー/タクシー/…)
// are never base-readable before the M17 katakana ladder, so a draw would
// show a word the learner cannot read.
const noKatakana = (a: { kana: string }) =>
  !/\p{Script=Katakana}/u.test(a.kana);
const NEO_M1_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1"),
).filter(noKatakana);
const NEO_M2_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2"),
).filter(noKatakana);
const NEO_M3_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m3"),
).filter(noKatakana);
const NEO_PRIOR_POOL = [...NEO_M1_POOL, ...NEO_M2_POOL, ...NEO_M3_POOL];

/* ════════════════════════════════════════════════════════════════════════
 * L1 — "これ — point and name" (SENTENCE-PATTERN template, m3-neo L1 shape)
 * Exposure-first: これ is だ-class — pointing is inferable from hearing.
 * Wave-1 objects かばん/けいたい/くるま debut on vocabMcq intro steps.
 * ════════════════════════════════════════════════════════════════════════ */

const L1_REVIEW = pickReviewAtoms("ja-m4-neo-1-rev", NEO_M1_POOL, 6);

export const M4_NEO_1: LessonContent = {
  id: "ja-m4-neo-1",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "これ — point and name",
  description:
    "Point at the thing in front of you and name it: これは ほんだ. New things to point at: a bag, a phone, a car.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Noticing exposure — これは Xだ heard before any rule, interleaved
    // with echo-production (no two adjacent same-type steps).
    listeningCompSentence({
      id: "ja-m4-neo-1-lc-hon",
      audioText: "これは ほんだ。",
      question: "What does this mean?",
      correctMeaningEn: "This is a book.",
      distractorsEn: ["This is a cat.", "This is water.", "Is this a book?"],
      exercisedAtomKanas: ["これ", "ほん"],
    }),
    build(
      "ja-m4-neo-1-build-neko",
      "Build this sentence: This is a cat.",
      "これは ねこだ",
      ["これ", "は", "ねこ", "だ", "いぬ"],
      ["これ", "は", "ねこ", "だ"],
      ["これ", "ねこ"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-1-lc-mizu",
      audioText: "これは みずだ。",
      question: "What does this mean?",
      correctMeaningEn: "This is water.",
      distractorsEn: ["This is the sea.", "This is a book.", "Is this water?"],
      exercisedAtomKanas: ["これ", "みず"],
    }),
    speaking("ja-m4-neo-1-speak-hon", "これは ほんだ", "This is a book.", [
      "これ",
      "ほん",
    ]),
    // ② The rule — the answer to what they just noticed.
    grammarRule({
      id: "ja-m4-neo-1-rule-kore",
      title: "これ — this one, right here",
      rule:
        "これ points at whatever is close to YOU, the speaker — in your hand, at your feet. これは ほんだ = 'this is a book.' Point, name it, done.",
      examples: [
        { ja: "これは ねこだ。", romaji: "kore wa neko da.", en: "This is a cat." },
        { ja: "これは みずだ。", romaji: "kore wa mizu da.", en: "This is water." },
      ],
      // No antiPattern on purpose: これ has no natural single-sentence
      // learner error — wrong-distance pointing needs a second position
      // in space, which L2's three-way card owns. A fabricated ✗ here
      // would grade correct Japanese as wrong (invariant 12 contract).
      cultureNote:
        "これ stands alone — it IS the thing ('this one'). It never glues onto a noun; that job belongs to a different word you'll meet later.",
    }),
    // ③ Builds — pattern assembled, not read.
    build(
      "ja-m4-neo-1-build-inu",
      "Build this sentence: This is a dog.",
      "これは いぬだ",
      ["これ", "は", "いぬ", "だ", "ねこ"],
      ["これ", "は", "いぬ", "だ"],
      ["これ", "いぬ"],
    ),
    // ④ Wave-1 objects — image intro, then hear it, then produce it.
    vocabMcq(
      "ja-m4-neo-1-vmcq-kaban",
      { kana: "かばん", meaningEn: "bag", emoji: "👜", fromModule: "m4" },
      NEO_PRIOR_POOL,
    ),
    listeningCompSentence({
      id: "ja-m4-neo-1-lc-kaban",
      audioText: "これは かばんだ。",
      question: "What does this mean?",
      correctMeaningEn: "This is a bag.",
      distractorsEn: ["This is a hat.", "This is a key.", "Is this a bag?"],
      exercisedAtomKanas: ["これ", "かばん"],
    }),
    build(
      "ja-m4-neo-1-build-kaban",
      "Build this sentence: This is a bag.",
      "これは かばんだ",
      ["これ", "は", "かばん", "だ", "ぼうし"],
      ["これ", "は", "かばん", "だ"],
      ["これ", "かばん"],
    ),
    vocabMcq(
      "ja-m4-neo-1-vmcq-keitai",
      { kana: "けいたい", meaningEn: "mobile phone", emoji: "📱", fromModule: "m4" },
      NEO_PRIOR_POOL,
    ),
    listeningCompSentence({
      id: "ja-m4-neo-1-lc-keitai",
      audioText: "これは けいたいだ。",
      question: "What does this mean?",
      correctMeaningEn: "This is a phone.",
      distractorsEn: [
        "This is a bag.",
        "This is a camera.",
        "This is a key.",
      ],
      exercisedAtomKanas: ["これ", "けいたい"],
    }),
    translateStep({
      id: "ja-m4-neo-1-tr-keitai",
      promptEn: "Translate: This is a phone.",
      acceptedAnswers: [
        "これは けいたいだ",
        "これはけいたいだ",
        "これは けいたい",
        "これはけいたい",
      ],
      audioText: "これは けいたいだ",
      exercisedAtomKanas: ["これ", "けいたい"],
    }),
    vocabMcq(
      "ja-m4-neo-1-vmcq-kuruma",
      { kana: "くるま", meaningEn: "car", emoji: "🚗", fromModule: "m4" },
      NEO_PRIOR_POOL,
    ),
    listeningCompSentence({
      id: "ja-m4-neo-1-lc-kuruma",
      audioText: "これは くるまだ。",
      question: "What does this mean?",
      correctMeaningEn: "This is a car.",
      distractorsEn: [
        "This is a boat.",
        "This is a bicycle.",
        "Is this a car?",
      ],
      exercisedAtomKanas: ["これ", "くるま"],
    }),
    build(
      "ja-m4-neo-1-build-kuruma",
      "Build this sentence: This is a car.",
      "これは くるまだ",
      ["これ", "は", "くるま", "だ", "ふね"],
      ["これ", "は", "くるま", "だ"],
      ["これ", "くるま"],
    ),
    speaking("ja-m4-neo-1-speak-kaban", "これは かばんだ", "This is a bag.", [
      "これ",
      "かばん",
    ]),
    // Hear-and-assemble beat on a taught sentence.
    listeningBuildSentence({
      id: "ja-m4-neo-1-capstone",
      target: "これは けいたいだ",
      tiles: ["これ", "は", "けいたい", "だ", "くるま"],
      correctOrder: ["これ", "は", "けいたい", "だ"],
      promptEn: "This is a phone.",
      exercisedAtomKanas: ["これ", "けいたい"],
    }),
    // Review tail — M1 atoms (house idiom: LC → vocabMcq → decode-build →
    // match grid).
    listeningCompSentence({
      id: "ja-m4-neo-1-rev-lc",
      audioText: L1_REVIEW[1].kana,
      question: "What did you hear?",
      correctMeaningEn: L1_REVIEW[1].meaningEn,
      distractorsEn: [
        L1_REVIEW[2].meaningEn,
        L1_REVIEW[3].meaningEn,
        L1_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L1_REVIEW[1].kana],
    }),
    vocabMcq("ja-m4-neo-1-rev-mcq", L1_REVIEW[0], NEO_M1_POOL),
    listeningBuildWord(
      "ja-m4-neo-1-rev-lb-hana",
      "はな",
      "flower",
      ["は", "な"],
      ["ば", "ま", "そ"],
    ),
    reviewMatchPairs("ja-m4-neo-1-rev", L1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M4_NEO_1.steps);
assertNoConsecutiveSame(M4_NEO_1.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L2 — "それ・あれ — the distance system" (SUBSTITUTION class)
 * Compact three-way rule card BEFORE first exposure (invariant 24 — the
 * meaning of それ vs あれ is not inferable from one hearing), then
 * choice-under-contrast: the situation cue forces the pointer.
 * ════════════════════════════════════════════════════════════════════════ */

const L2_REVIEW = pickReviewAtoms("ja-m4-neo-2-rev", NEO_M2_POOL, 6);

export const M4_NEO_2: LessonContent = {
  id: "ja-m4-neo-2",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "それ・あれ — the distance system",
  description:
    "これ near me, それ near you, あれ far from us both. Three pointers, one system — the situation picks the word.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① The card FIRST — substitution class (invariant 24).
    grammarRule({
      id: "ja-m4-neo-2-rule-kosoa",
      title: "これ・それ・あれ — near me, near you, over there",
      rule:
        "Three pointers, one system: これ = near ME, それ = near YOU, あれ = far from us BOTH. Swap the pointer, keep the sentence — everything else stays the same.",
      examples: [
        {
          ja: "これは ほんだ。",
          romaji: "kore wa hon da.",
          en: "This is a book. (in my hand)",
        },
        {
          ja: "それは ほんだ。",
          romaji: "sore wa hon da.",
          en: "That's a book. (near you)",
        },
        {
          ja: "あれは ほんだ。",
          romaji: "are wa hon da.",
          en: "That's a book. (way over there)",
        },
      ],
      // No antiPattern on purpose: a "wrong-distance" sentence is correct
      // Japanese in a different seating chart — contrast material, never
      // ✗ material (invariant 12 semantic contract).
      cultureNote:
        "こ・そ・あ is a distance ladder you'll meet again and again (me → you → yonder). A fourth rung, the question 'which one?', joins later this module.",
    }),
    // ② Choice-under-contrast: recognition with deixis-testing distractors.
    listeningCompSentence({
      id: "ja-m4-neo-2-lc-sore-kaban",
      audioText: "それは かばんだ。",
      question: "What does this mean?",
      correctMeaningEn: "That (near you) is a bag.",
      distractorsEn: [
        "This (in my hand) is a bag.",
        "That (way over there) is a bag.",
        "Is that a bag?",
      ],
      exercisedAtomKanas: ["それ", "かばん"],
    }),
    build(
      "ja-m4-neo-2-build-sore-neko",
      "Build this sentence: That (near you) is a cat.",
      "それは ねこだ",
      ["それ", "これ", "は", "ねこ", "だ"],
      ["それ", "は", "ねこ", "だ"],
      ["それ", "ねこ"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-2-lc-are-kuruma",
      audioText: "あれは くるまだ。",
      question: "What does this mean?",
      correctMeaningEn: "That (over there) is a car.",
      distractorsEn: [
        "This (near me) is a car.",
        "That (near you) is a car.",
        "Is that a car?",
      ],
      exercisedAtomKanas: ["あれ", "くるま"],
    }),
    speaking(
      "ja-m4-neo-2-speak-sore-hon",
      "それは ほんだ",
      "That (near you) is a book.",
      ["それ", "ほん"],
    ),
    // Invariant 28: full-sentence pick → build (production, not recognition).
    build(
      "ja-m4-neo-2-build-kore-kaban",
      "Build this sentence: This is a bag.",
      "これは かばんだ",
      ["これ", "は", "かばん", "だ", "それ"],
      ["これ", "は", "かばん", "だ"],
      ["これ", "かばん"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-2-lc-kore-keitai",
      audioText: "これは けいたいだ。",
      question: "What does this mean?",
      correctMeaningEn: "This is a phone.",
      distractorsEn: [
        "That (near you) is a phone.",
        "That (over there) is a phone.",
        "This is a bag.",
      ],
      exercisedAtomKanas: ["これ", "けいたい"],
    }),
    build(
      "ja-m4-neo-2-build-are-kuruma",
      "Build this sentence: That (over there) is a car.",
      "あれは くるまだ",
      ["あれ", "それ", "は", "くるま", "だ"],
      ["あれ", "は", "くるま", "だ"],
      ["あれ", "くるま"],
    ),
    translateStep({
      id: "ja-m4-neo-2-tr-sore-keitai",
      promptEn: "Translate: That (near you) is a phone.",
      acceptedAnswers: [
        "それは けいたいだ",
        "それはけいたいだ",
        "それは けいたい",
        "それはけいたい",
      ],
      audioText: "それは けいたいだ",
      exercisedAtomKanas: ["それ", "けいたい"],
    }),
    // Invariant 28: full-sentence pick → build.
    build(
      "ja-m4-neo-2-build-are-inu",
      "Build this sentence: That (over there) is a dog.",
      "あれは いぬだ",
      ["あれ", "は", "いぬ", "だ", "それ"],
      ["あれ", "は", "いぬ", "だ"],
      ["あれ", "いぬ"],
    ),
    // Quick gamified breather — emoji word check over an M2 salvage atom.
    vocabMcq("ja-m4-neo-2-vmcq-mid", L2_REVIEW[3], NEO_M2_POOL),
    listeningCompSentence({
      id: "ja-m4-neo-2-lc-are-yama",
      audioText: "あれは やまだ。",
      question: "What does this mean?",
      correctMeaningEn: "That (over there) is a mountain.",
      distractorsEn: [
        "That (over there) is a river.",
        "This is a mountain.",
        "That (near you) is a mountain.",
      ],
      exercisedAtomKanas: ["あれ", "やま"],
    }),
    build(
      "ja-m4-neo-2-build-kore-kagi",
      "Build this sentence: This is a key.",
      "これは かぎだ",
      ["これ", "あれ", "は", "かぎ", "だ"],
      ["これ", "は", "かぎ", "だ"],
      ["これ", "かぎ"],
    ),
    listeningBuildSentence({
      id: "ja-m4-neo-2-capstone",
      target: "あれは ふねだ",
      tiles: ["あれ", "は", "ふね", "だ", "それ"],
      correctOrder: ["あれ", "は", "ふね", "だ"],
      promptEn: "That (over there) is a boat.",
      exercisedAtomKanas: ["あれ", "ふね"],
    }),
    speaking(
      "ja-m4-neo-2-speak-are-yama",
      "あれは やまだ",
      "That (over there) is a mountain.",
      ["あれ", "やま"],
    ),
    // Closer — あれ in the wild: both speakers looking at the same far
    // thing, every question graded on stated facts (invariant 22).
    dialogueListen({
      id: "ja-m4-neo-2-dlg-close",
      lines: [
        { speaker: "Tom", kana: "あれは えきだ。" },
        { speaker: "Mika", kana: "うん、えきだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Where is the station?",
          correctText: "Far from both of them",
          distractors: [
            "In Tom's hand",
            "Right next to Mika",
            "They never say what it is",
          ],
        },
        {
          id: "q2",
          prompt: "What does Mika say?",
          correctText: "Yeah — it's the station.",
          distractors: [
            "No, it's a hotel.",
            "Is it the station?",
            "It's far away.",
          ],
        },
      ],
      exercisedAtomKanas: ["あれ", "えき", "うん"],
    }),
    // Review tail — M2 atoms (house idiom: speak → decode-build → LC →
    // vocabMcq → match grid).
    speaking(
      "ja-m4-neo-2-rev-speak",
      L2_REVIEW[0].kana,
      L2_REVIEW[0].meaningEn,
      [L2_REVIEW[0].kana],
    ),
    listeningBuildWord(
      "ja-m4-neo-2-rev-lb-boushi",
      "ぼうし",
      "hat",
      ["ぼ", "う", "し"],
      ["ほ", "じ", "つ"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-2-rev-lc",
      audioText: L2_REVIEW[1].kana,
      question: "What did you hear?",
      correctMeaningEn: L2_REVIEW[1].meaningEn,
      distractorsEn: [
        L2_REVIEW[2].meaningEn,
        L2_REVIEW[3].meaningEn,
        L2_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L2_REVIEW[1].kana],
    }),
    vocabMcq("ja-m4-neo-2-rev-mcq", L2_REVIEW[2], NEO_M2_POOL),
    reviewMatchPairs("ja-m4-neo-2-rev", L2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M4_NEO_2.steps);
assertNoConsecutiveSame(M4_NEO_2.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L3 — "これ、なに？ — the pointer question" (m3 casual-contour ride)
 * The rising-tone question over the pointer system, plus the deixis FLIP
 * in answers (your これ is their それ). Surfaces use なに (standalone
 * reading, existing m1 atom); なん is card-explained only — no bare
 * production of "what" alone, no image MCQs (blocked atom family).
 * ════════════════════════════════════════════════════════════════════════ */

const L3_REVIEW = pickReviewAtoms("ja-m4-neo-3-rev", NEO_M3_POOL, 6);

export const M4_NEO_3: LessonContent = {
  id: "ja-m4-neo-3",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "これ、なに？ — the pointer question",
  description:
    "Pick something up and ask what it is — これ、なに？ The answer flips the pointer back at you: それは ほんだ.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Exposure first — the Q→A pair in a two-line exchange; the answer
    // in context makes the question word inferable before the card.
    dialogueListen({
      id: "ja-m4-neo-3-dlg-intro",
      lines: [
        { speaker: "Tom", kana: "これ、なに？" },
        { speaker: "Mika", kana: "それは ほんだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Tom want to know?",
          correctText: "What the thing he's holding is",
          distractors: [
            "Whether the book is Mika's",
            "Where his book went",
            "Whether Mika can read it",
          ],
        },
        {
          id: "q2",
          prompt: "What does Mika answer?",
          correctText: "That's a book.",
          distractors: [
            "This is a book.",
            "It's not a book.",
            "Is that a book?",
          ],
        },
      ],
      exercisedAtomKanas: ["これ", "なに", "それ", "ほん"],
    }),
    // ② The rule — question shape + the pointer flip.
    grammarRule({
      id: "ja-m4-neo-3-rule-nani",
      title: "なに — what?",
      rule:
        "Point and ask: これ、なに？ = 'this — what is it?' The rising tone does the asking, m3-style. The answer flips the pointer: your これ is their それ.",
      examples: [
        { ja: "これ、なに？", romaji: "kore, nani?", en: "What's this? (voice rises)" },
        {
          ja: "それは ほんだ。",
          romaji: "sore wa hon da.",
          en: "That's a book. (the answer flips これ to それ)",
        },
        {
          ja: "あれ、なに？",
          romaji: "are, nani?",
          en: "What's that over there?",
        },
      ],
      antiPattern: {
        ja: "これ、なにだ？",
        romaji: "kore, nani da?",
        en: "(broken: なに + だ)",
        why:
          "なに never takes だ straight — the plain question is just なに？ with a rise. When 'what' fuses with an ending it changes shape (you'll meet that form later).",
      },
      cultureNote:
        "'What' has two sounds in Japanese: なに on its own, なん when fused to what follows. This module only needs なに — the fused shapes arrive with their own patterns.",
    }),
    listeningCompSentence({
      id: "ja-m4-neo-3-lc-kore-nani",
      audioText: "これ、なに？",
      question: "What does this mean?",
      correctMeaningEn: "What's this?",
      distractorsEn: ["This is a book.", "Whose is this?", "What's that over there?"],
      exercisedAtomKanas: ["これ", "なに"],
    }),
    speaking(
      "ja-m4-neo-3-speak-kore-nani",
      "これ、なに？",
      "What's this? (voice rises)",
      ["これ", "なに"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-3-lc-sore-nani",
      audioText: "それ、なに？",
      question: "What does this mean?",
      correctMeaningEn: "What's that (you've got)?",
      distractorsEn: [
        "What's this (I've got)?",
        "What's that over there?",
        "Is that a bag?",
      ],
      exercisedAtomKanas: ["それ", "なに"],
    }),
    // ③ Answer side — the flip in production.
    build(
      "ja-m4-neo-3-build-shashin",
      "Build this sentence: That (near you) is a photo.",
      "それは しゃしんだ",
      ["それ", "これ", "は", "しゃしん", "だ"],
      ["それ", "は", "しゃしん", "だ"],
      ["それ", "しゃしん"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-3-lc-are-nani",
      audioText: "あれ、なに？",
      question: "What does this mean?",
      correctMeaningEn: "What's that over there?",
      distractorsEn: [
        "What's this?",
        "What's that (near you)?",
        "That's a car.",
      ],
      exercisedAtomKanas: ["あれ", "なに"],
    }),
    translateStep({
      id: "ja-m4-neo-3-tr-kore-nani",
      promptEn: "Translate: What's this?",
      acceptedAnswers: ["これ、なに？", "これ、なに", "これなに？", "これなに"],
      audioText: "これ、なに？",
      exercisedAtomKanas: ["これ", "なに"],
    }),
    sentenceMcq({
      id: "ja-m4-neo-3-mcq-sore-nani",
      prompt: "Ask about the thing your friend is holding.",
      correctKana: "それ、なに？",
      distractorsKana: ["これ、なに？", "あれ、なに？", "それは ほんだ。"],
      explanation:
        "In their hands means それ — これ would point at your own hands.",
      exercisedAtomKanas: ["それ", "なに"],
    }),
    // Quick gamified breather — emoji word check over an M3 atom. Pinned to
    // the atom the review tail SPEAKS (L3_REVIEW[0], 2026-07-27
    // gloss-before-production): the tail asks for it bare, and for なまえ the
    // m3 rewrite never glossed it — the grid two steps later was its first
    // stated meaning, one step too late.
    vocabMcq("ja-m4-neo-3-vmcq-mid", L3_REVIEW[0], NEO_M3_POOL),
    build(
      "ja-m4-neo-3-build-keitai",
      "Build this sentence: This is a phone.",
      "これは けいたいだ",
      ["これ", "それ", "は", "けいたい", "だ"],
      ["これ", "は", "けいたい", "だ"],
      ["これ", "けいたい"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-3-lc-kagi",
      audioText: "それは かぎだ。",
      question: "What does this mean?",
      correctMeaningEn: "That's a key.",
      distractorsEn: ["That's a phone.", "This is a key.", "That's a shell."],
      exercisedAtomKanas: ["それ", "かぎ"],
    }),
    speaking(
      "ja-m4-neo-3-speak-sore-kaban",
      "それは かばんだ",
      "That's a bag.",
      ["それ", "かばん"],
    ),
    listeningBuildSentence({
      id: "ja-m4-neo-3-capstone",
      target: "それは くるまだ",
      tiles: ["それ", "は", "くるま", "だ", "これ"],
      correctOrder: ["それ", "は", "くるま", "だ"],
      promptEn: "That's a car.",
      exercisedAtomKanas: ["それ", "くるま"],
    }),
    // ④ Dialogue closer — question + short bare answer in the wild.
    dialogueListen({
      id: "ja-m4-neo-3-dlg-close",
      lines: [
        { speaker: "Mika", kana: "あれ、なに？" },
        { speaker: "Tom", kana: "くるまだ。" },
        { speaker: "Mika", kana: "そう。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Mika ask about?",
          correctText: "Something far from both of them",
          distractors: [
            "The thing in her own hand",
            "The thing Tom is holding",
            "Tom's name",
          ],
        },
        {
          id: "q2",
          prompt: "What is it?",
          correctText: "A car",
          distractors: ["A boat", "A station", "A key"],
        },
      ],
      exercisedAtomKanas: ["あれ", "なに", "くるま", "そう"],
    }),
    // Review tail — M3 atoms now count as prior vocab (house idiom:
    // speak → decode-build → LC → vocabMcq → match grid).
    speaking(
      "ja-m4-neo-3-rev-speak",
      L3_REVIEW[0].kana,
      L3_REVIEW[0].meaningEn,
      [L3_REVIEW[0].kana],
    ),
    listeningBuildWord(
      "ja-m4-neo-3-rev-lb-sushi",
      "すし",
      "sushi",
      ["す", "し"],
      ["ず", "さ", "つ"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-3-rev-lc",
      audioText: L3_REVIEW[1].kana,
      question: "What did you hear?",
      correctMeaningEn: L3_REVIEW[1].meaningEn,
      distractorsEn: [
        L3_REVIEW[2].meaningEn,
        L3_REVIEW[3].meaningEn,
        L3_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L3_REVIEW[1].kana],
    }),
    vocabMcq("ja-m4-neo-3-rev-mcq", L3_REVIEW[2], NEO_M3_POOL),
    reviewMatchPairs("ja-m4-neo-3-rev", L3_REVIEW),
  ],
};

assertNoSameAnswerCluster(M4_NEO_3.steps);
assertNoConsecutiveSame(M4_NEO_3.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L4 — "Objects II — point at everything" (vocab-lesson variation)
 * いす/かさ/てがみ over the full これ/それ/あれ frame set. No new
 * grammar: heavier image intros, builds and listening builds instead.
 * ════════════════════════════════════════════════════════════════════════ */

// 11 atoms: [0..5] feed the tail (vocabMcq + closing match grid), [6..10]
// feed the mid-lesson breather grid (m3-neo L4 pattern).
const L4_REVIEW = pickReviewAtoms("ja-m4-neo-4-rev", NEO_PRIOR_POOL, 11);

export const M4_NEO_4: LessonContent = {
  id: "ja-m4-neo-4",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Objects II — point at everything",
  description:
    "Three more things to point at — a chair, an umbrella, a letter — drilled through every distance: これ, それ, あれ.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① いす — image intro → hear → build.
    vocabMcq(
      "ja-m4-neo-4-vmcq-isu",
      { kana: "いす", meaningEn: "chair", emoji: "🪑", fromModule: "m4" },
      NEO_PRIOR_POOL,
    ),
    listeningCompSentence({
      id: "ja-m4-neo-4-lc-isu",
      audioText: "これは いすだ。",
      question: "What does this mean?",
      correctMeaningEn: "This is a chair.",
      distractorsEn: [
        "This is a window.",
        "That (near you) is a chair.",
        "Is this a chair?",
      ],
      exercisedAtomKanas: ["これ", "いす"],
    }),
    build(
      "ja-m4-neo-4-build-sore-isu",
      "Build this sentence: That (near you) is a chair.",
      "それは いすだ",
      ["それ", "あれ", "は", "いす", "だ"],
      ["それ", "は", "いす", "だ"],
      ["それ", "いす"],
    ),
    // ② かさ.
    vocabMcq(
      "ja-m4-neo-4-vmcq-kasa",
      { kana: "かさ", meaningEn: "umbrella", emoji: "☂️", fromModule: "m4" },
      NEO_PRIOR_POOL,
    ),
    listeningCompSentence({
      id: "ja-m4-neo-4-lc-sore-kasa",
      audioText: "それは かさだ。",
      question: "What does this mean?",
      correctMeaningEn: "That (near you) is an umbrella.",
      distractorsEn: [
        "This is an umbrella.",
        "That (near you) is a pencil.",
        "That (over there) is an umbrella.",
      ],
      exercisedAtomKanas: ["それ", "かさ"],
    }),
    build(
      "ja-m4-neo-4-build-kore-kasa",
      "Build this sentence: This is an umbrella.",
      "これは かさだ",
      ["これ", "それ", "は", "かさ", "だ"],
      ["これ", "は", "かさ", "だ"],
      ["これ", "かさ"],
    ),
    speaking("ja-m4-neo-4-speak-isu", "これは いすだ", "This is a chair.", [
      "これ",
      "いす",
    ]),
    // ③ てがみ.
    vocabMcq(
      "ja-m4-neo-4-vmcq-tegami",
      { kana: "てがみ", meaningEn: "letter (postal)", emoji: "✉️", fromModule: "m4" },
      NEO_PRIOR_POOL,
    ),
    listeningCompSentence({
      id: "ja-m4-neo-4-lc-tegami",
      audioText: "これは てがみだ。",
      question: "What does this mean?",
      correctMeaningEn: "This is a letter.",
      distractorsEn: [
        "This is a photo.",
        "This is a ticket.",
        "That's a letter (over there).",
      ],
      exercisedAtomKanas: ["これ", "てがみ"],
    }),
    build(
      "ja-m4-neo-4-build-are-tegami",
      "Build this sentence: That (over there) is a letter.",
      "あれは てがみだ",
      ["あれ", "これ", "は", "てがみ", "だ"],
      ["あれ", "は", "てがみ", "だ"],
      ["あれ", "てがみ"],
    ),
    translateStep({
      id: "ja-m4-neo-4-tr-tegami",
      promptEn: "Translate: This is a letter.",
      acceptedAnswers: [
        "これは てがみだ",
        "これはてがみだ",
        "これは てがみ",
        "これはてがみ",
      ],
      audioText: "これは てがみだ",
      exercisedAtomKanas: ["これ", "てがみ"],
    }),
    // Mid-lesson breather — review match grid between the two drill
    // blocks (step-type variety, m3-neo L4 pattern).
    reviewMatchPairs("ja-m4-neo-4-mid", L4_REVIEW.slice(6, 11)),
    // Invariant 28: full-sentence pick → build.
    build(
      "ja-m4-neo-4-build-are-isu",
      "Build this sentence: That (over there) is a chair.",
      "あれは いすだ",
      ["あれ", "は", "いす", "だ", "これ"],
      ["あれ", "は", "いす", "だ"],
      ["あれ", "いす"],
    ),
    listeningBuildSentence({
      id: "ja-m4-neo-4-lbs-sore-tegami",
      target: "それは てがみだ",
      tiles: ["それ", "は", "てがみ", "だ", "かさ"],
      correctOrder: ["それ", "は", "てがみ", "だ"],
      promptEn: "That's a letter.",
      exercisedAtomKanas: ["それ", "てがみ"],
    }),
    // The pointer question over a new object — L3's flip, recombined.
    dialogueListen({
      id: "ja-m4-neo-4-dlg-tegami",
      lines: [
        { speaker: "Ken", kana: "それ、なに？" },
        { speaker: "Tom", kana: "これは てがみだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Ken ask about?",
          correctText: "The thing Tom is holding",
          distractors: [
            "The thing on the far table",
            "The thing in Ken's own hand",
            "Tom's name",
          ],
        },
        {
          id: "q2",
          prompt: "What is Tom holding?",
          correctText: "A letter",
          distractors: ["An umbrella", "A chair", "A photo"],
        },
      ],
      exercisedAtomKanas: ["それ", "なに", "これ", "てがみ"],
    }),
    speaking("ja-m4-neo-4-speak-kasa", "これは かさだ", "This is an umbrella.", [
      "これ",
      "かさ",
    ]),
    build(
      "ja-m4-neo-4-capstone",
      "Build this sentence: This is a bag.",
      "これは かばんだ",
      ["これ", "あれ", "は", "かばん", "だ"],
      ["これ", "は", "かばん", "だ"],
      ["これ", "かばん"],
    ),
    // Review tail (house idiom: vocabMcq → decode-build → LC → match grid).
    vocabMcq("ja-m4-neo-4-rev-mcq", L4_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildWord(
      "ja-m4-neo-4-rev-lb-enpitsu",
      "えんぴつ",
      "pencil",
      ["え", "ん", "ぴ", "つ"],
      ["ぺ", "び", "そ"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-4-rev-lc",
      audioText: L4_REVIEW[1].kana,
      question: "What did you hear?",
      correctMeaningEn: L4_REVIEW[1].meaningEn,
      distractorsEn: [
        L4_REVIEW[2].meaningEn,
        L4_REVIEW[3].meaningEn,
        L4_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L4_REVIEW[1].kana],
    }),
    reviewMatchPairs("ja-m4-neo-4-rev", L4_REVIEW.slice(0, 6)),
  ],
};

assertNoSameAnswerCluster(M4_NEO_4.steps);
assertNoConsecutiveSame(M4_NEO_4.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L5 — "の — possession" (new structural particle: card FIRST)
 * Xの Y = X's Y. Anti-pattern is the genuine の-order error
 * (ほんの わたし for "my book") as a full-sentence minimal pair.
 * ════════════════════════════════════════════════════════════════════════ */

const L5_REVIEW = pickReviewAtoms("ja-m4-neo-5-rev", NEO_PRIOR_POOL, 6);

export const M4_NEO_5: LessonContent = {
  id: "ja-m4-neo-5",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "の — possession",
  description:
    "One tiny particle turns any name into an owner: わたしの ほん, トムの ねこ, ミカの かばん. Owner first, thing after.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① The card FIRST — new structural particle (invariant 24).
    grammarRule({
      id: "ja-m4-neo-5-rule-no",
      title: "の — the owner's mark",
      rule:
        "の links owner to thing: わたしの ほん = my book. Owner FIRST, の in the middle, thing last — exactly English's 's: Tom's cat = トムの ねこ.",
      examples: [
        {
          ja: "これは わたしの ほんだ。",
          romaji: "kore wa watashi no hon da.",
          en: "This is my book.",
        },
        {
          ja: "それは トムの ねこだ。",
          romaji: "sore wa tomu no neko da.",
          en: "That's Tom's cat.",
        },
        {
          ja: "ミカの かばんだ。",
          romaji: "mika no kaban da.",
          en: "(It's) Mika's bag.",
        },
      ],
      antiPattern: {
        ja: "これは ほんの わたしだ。",
        romaji: "kore wa hon no watashi da.",
        en: "(broken: 'the book's me')",
        why:
          "Order is everything: owner before の, thing after. わたしの ほん = my book; flipping it makes the book the owner — of you.",
      },
      cultureNote:
        "の never translates as a separate word — it IS the apostrophe-s. Read Xの Y right to left if it helps: 'the Y of X.'",
    }),
    listeningCompSentence({
      id: "ja-m4-neo-5-lc-watashi-hon",
      audioText: "これは わたしの ほんだ。",
      question: "What does this mean?",
      correctMeaningEn: "This is my book.",
      distractorsEn: [
        "This is Tom's book.",
        "This is my bag.",
        "That's my book.",
      ],
      exercisedAtomKanas: ["これ", "わたし", "の", "ほん"],
    }),
    build(
      "ja-m4-neo-5-build-watashi-kaban",
      "Build this sentence: This is my bag.",
      "これは わたしの かばんだ",
      ["これ", "は", "わたし", "の", "かばん", "だ", "トム"],
      ["これ", "は", "わたし", "の", "かばん", "だ"],
      ["これ", "わたし", "の", "かばん"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-5-lc-mika-keitai",
      audioText: "それは ミカの けいたいだ。",
      question: "What does this mean?",
      correctMeaningEn: "That's Mika's phone.",
      distractorsEn: [
        "That's Ken's phone.",
        "That's Mika's bag.",
        "This is my phone.",
      ],
      exercisedAtomKanas: ["それ", "の", "けいたい"],
    }),
    cloze(
      "ja-m4-neo-5-cloze-tomu-neko",
      "これは トム",
      " ねこだ。",
      "の",
      ["の", "は", "も", "か"],
      "This is Tom's cat.",
      "これは トムの ねこだ。",
      "Owner first, thing after: トムの ねこ = Tom's cat.",
    ),
    speaking(
      "ja-m4-neo-5-speak-watashi-kaban",
      "わたしの かばんだ",
      "It's my bag.",
      ["わたし", "の", "かばん"],
    ),
    build(
      "ja-m4-neo-5-build-ken-isu",
      "Build this sentence: That (near you) is Ken's chair.",
      "それは ケンの いすだ",
      ["それ", "は", "ケン", "の", "いす", "だ", "ミカ"],
      ["それ", "は", "ケン", "の", "いす", "だ"],
      ["それ", "の", "いす"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-5-lc-tanaka-kuruma",
      audioText: "あれは たなかの くるまだ。",
      question: "What does this mean?",
      correctMeaningEn: "That (over there) is Tanaka's car.",
      distractorsEn: [
        "That's Ken's car.",
        "Tanaka is over there.",
        "That (over there) is Tanaka's chair.",
      ],
      exercisedAtomKanas: ["あれ", "の", "くるま"],
    }),
    // Invariant 28: full-sentence pick → build.
    build(
      "ja-m4-neo-5-build-mika-kaban",
      "Build this sentence: That (near you) is Mika's bag.",
      "それは ミカの かばんだ",
      ["それ", "は", "ミカ", "の", "かばん", "だ", "これ"],
      ["それ", "は", "ミカ", "の", "かばん", "だ"],
      ["それ", "の", "かばん"],
    ),
    translateStep({
      id: "ja-m4-neo-5-tr-watashi-keitai",
      promptEn: "Translate: This is my phone.",
      acceptedAnswers: [
        "これは わたしの けいたいだ",
        "これはわたしのけいたいだ",
        "わたしの けいたいだ",
        "わたしのけいたいだ",
      ],
      audioText: "これは わたしの けいたいだ",
      exercisedAtomKanas: ["これ", "わたし", "の", "けいたい"],
    }),
    cloze(
      "ja-m4-neo-5-cloze-mika-kasa",
      "あれは ミカ",
      " かさだ。",
      "の",
      ["の", "も", "は", "か"],
      "That (over there) is Mika's umbrella.",
      "あれは ミカの かさだ。",
      "Same pattern at any distance — owner + の + thing.",
    ),
    // Quick gamified breather — emoji word check over a prior atom.
    vocabMcq("ja-m4-neo-5-vmcq-mid", L5_REVIEW[3], NEO_PRIOR_POOL),
    build(
      "ja-m4-neo-5-build-watashi-kasa",
      "Build this sentence: That (near you) is my umbrella.",
      "それは わたしの かさだ",
      ["それ", "は", "わたし", "の", "かさ", "だ", "ミカ"],
      ["それ", "は", "わたし", "の", "かさ", "だ"],
      ["それ", "わたし", "の", "かさ"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-5-lc-ken-neko",
      audioText: "ケンの ねこだ。",
      question: "What does this mean?",
      correctMeaningEn: "(It's) Ken's cat.",
      distractorsEn: [
        "(It's) Ken's dog.",
        "(It's) Tom's cat.",
        "(It's) my cat.",
      ],
      exercisedAtomKanas: ["の", "ねこ"],
    }),
    listeningBuildSentence({
      id: "ja-m4-neo-5-capstone",
      target: "トムの けいたいだ",
      tiles: ["トム", "の", "けいたい", "だ", "わたし"],
      correctOrder: ["トム", "の", "けいたい", "だ"],
      promptEn: "(It's) Tom's phone.",
      exercisedAtomKanas: ["の", "けいたい"],
    }),
    speaking(
      "ja-m4-neo-5-speak-tanaka-hon",
      "それは たなかの ほんだ",
      "That's Tanaka's book.",
      ["それ", "の", "ほん"],
    ),
    // Closer — の in a live exchange, recombining L3's question.
    dialogueListen({
      id: "ja-m4-neo-5-dlg-tegami",
      lines: [
        { speaker: "Mika", kana: "それ、なに？" },
        { speaker: "Tom", kana: "ケンの てがみだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What is Tom holding?",
          correctText: "A letter",
          distractors: ["A photo", "A bag", "A key"],
        },
        {
          id: "q2",
          prompt: "Whose is it?",
          correctText: "Ken's",
          distractors: ["Tom's", "Mika's", "Tanaka's"],
        },
      ],
      exercisedAtomKanas: ["それ", "なに", "の", "てがみ"],
    }),
    // Review tail (house idiom: LC → vocabMcq → decode-build → match grid).
    listeningCompSentence({
      id: "ja-m4-neo-5-rev-lc",
      audioText: L5_REVIEW[1].kana,
      question: "What did you hear?",
      correctMeaningEn: L5_REVIEW[1].meaningEn,
      distractorsEn: [
        L5_REVIEW[2].meaningEn,
        L5_REVIEW[3].meaningEn,
        L5_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L5_REVIEW[1].kana],
    }),
    vocabMcq("ja-m4-neo-5-rev-mcq", L5_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildWord(
      "ja-m4-neo-5-rev-lb-mado",
      "まど",
      "window",
      ["ま", "ど"],
      ["も", "と", "ぬ"],
    ),
    reviewMatchPairs("ja-m4-neo-5-rev", L5_REVIEW),
  ],
};

assertNoSameAnswerCluster(M4_NEO_5.steps);
// Both clozes target の by design — single-new-particle intro lesson
// (same ruling as m3-neo L2's は intro).
assertAnswerRotation(M4_NEO_5.steps, 1);
assertNoConsecutiveSame(M4_NEO_5.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L6 — "だれ — who? whose?" (だれ + だれの + the short-answer chunk)
 * だれ？ / だれの かばん？ → ケンのだ。 — のだ short answers taught as a
 * chunk on the card, then recognition + use. Dialogue closer.
 * ════════════════════════════════════════════════════════════════════════ */

const L6_REVIEW = pickReviewAtoms("ja-m4-neo-6-rev", NEO_PRIOR_POOL, 6);

export const M4_NEO_6: LessonContent = {
  id: "ja-m4-neo-6",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "だれ — who? whose?",
  description:
    "だれ asks who; だれの asks whose. And the answer drops the noun entirely: ケンのだ — it's Ken's.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Exposure first — だれ in a two-line exchange (m3 contour ride).
    dialogueListen({
      id: "ja-m4-neo-6-dlg-intro",
      lines: [
        { speaker: "Ken", kana: "これ、だれ？" },
        { speaker: "Mika", kana: "トムだ。ともだちだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Ken ask?",
          correctText: "Who someone is",
          distractors: [
            "What something is",
            "Whose bag it is",
            "Where Mika is",
          ],
        },
        {
          id: "q2",
          prompt: "Who is it?",
          correctText: "Tom — a friend",
          distractors: ["Ken's teacher", "A stranger", "Tanaka"],
        },
      ],
      exercisedAtomKanas: ["これ", "だれ", "ともだち"],
    }),
    // ② The rule — だれ, だれの, and the short-answer chunk.
    grammarRule({
      id: "ja-m4-neo-6-rule-dare",
      title: "だれ — who? and だれの — whose?",
      rule:
        "だれ asks 'who?': これ、だれ？ = who's this? Add の and you're asking about an owner: だれの かばん？ = whose bag? The answer can drop the thing itself: ケンのだ = it's Ken's.",
      examples: [
        {
          ja: "だれの かばん？",
          romaji: "dare no kaban?",
          en: "Whose bag is this?",
        },
        {
          ja: "ケンのだ。",
          romaji: "ken no da.",
          en: "It's Ken's. (の stands in for the bag itself)",
        },
        { ja: "これ、だれ？", romaji: "kore, dare?", en: "Who's this?" },
      ],
      antiPattern: {
        ja: "だれ かばん？",
        romaji: "dare kaban?",
        en: "(broken: 'who bag?')",
        why:
          "'Whose' is always だれ+の — without の the two nouns just collide. だれの かばん？, never だれ かばん？.",
      },
      cultureNote:
        "ケンのだ works because の can carry the noun silently: ケンの = 'Ken's one.' You'll lean on this constantly — Japanese hates repeating a noun both sides already know.",
    }),
    listeningCompSentence({
      id: "ja-m4-neo-6-lc-kore-dare",
      audioText: "これ、だれ？",
      question: "What does this mean?",
      correctMeaningEn: "Who's this?",
      distractorsEn: ["Whose is this?", "What's this?", "Who are you?"],
      exercisedAtomKanas: ["これ", "だれ"],
    }),
    speaking(
      "ja-m4-neo-6-speak-kore-dare",
      "これ、だれ？",
      "Who's this? (voice rises)",
      ["これ", "だれ"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-6-lc-dareno-kaban",
      audioText: "だれの かばん？",
      question: "What does this mean?",
      correctMeaningEn: "Whose bag is this?",
      distractorsEn: [
        "Who's this?",
        "Whose phone is this?",
        "It's Ken's bag.",
      ],
      exercisedAtomKanas: ["だれ", "の", "かばん"],
    }),
    build(
      "ja-m4-neo-6-build-ken-no-da",
      "Build this sentence: It's Ken's.",
      "ケンのだ",
      ["ケン", "の", "だ", "わたし"],
      ["ケン", "の", "だ"],
      ["の"],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-6-lc-mika-no-da",
      audioText: "ミカのだ。",
      question: "What does this mean?",
      correctMeaningEn: "It's Mika's.",
      distractorsEn: ["It's Ken's.", "It's mine.", "Mika is here."],
      exercisedAtomKanas: ["の"],
    }),
    translateStep({
      id: "ja-m4-neo-6-tr-dareno-keitai",
      promptEn: "Translate: Whose phone is it?",
      acceptedAnswers: [
        "だれの けいたい？",
        "だれのけいたい？",
        "だれの けいたい",
        "だれのけいたい",
      ],
      audioText: "だれの けいたい？",
      exercisedAtomKanas: ["だれ", "の", "けいたい"],
    }),
    sentenceMcq({
      id: "ja-m4-neo-6-mcq-kore-dare",
      prompt: "A face you don't recognize. Ask who it is.",
      correctKana: "これ、だれ？",
      distractorsKana: ["これ、なに？", "だれの しゃしん？", "トムだ。"],
      explanation:
        "People take だれ; things take なに. だれの would ask who OWNS it.",
      exercisedAtomKanas: ["これ", "だれ"],
    }),
    // Quick gamified breather — emoji word check over a prior atom.
    vocabMcq("ja-m4-neo-6-vmcq-mid", L6_REVIEW[3], NEO_PRIOR_POOL),
    build(
      "ja-m4-neo-6-build-tanaka-no-da",
      "Build this sentence: It's Tanaka's.",
      "たなかのだ",
      ["たなか", "の", "だ", "ミカ"],
      ["たなか", "の", "だ"],
      ["の"],
    ),
    cloze(
      "ja-m4-neo-6-cloze-dareno",
      "だれ",
      " かばん？",
      "の",
      ["の", "は", "も", "か"],
      "Whose bag?",
      "だれの かばん？",
      "'Whose' is always だれ+の — the owner slot right before the thing.",
    ),
    speaking("ja-m4-neo-6-speak-ken-no-da", "ケンのだ", "It's Ken's.", ["の"]),
    listeningCompSentence({
      id: "ja-m4-neo-6-lc-are-dareno",
      audioText: "あれは だれの くるま？",
      question: "What does this mean?",
      correctMeaningEn: "Whose car is that (over there)?",
      distractorsEn: [
        "Whose car is this?",
        "That's Tanaka's car.",
        "Where is the car?",
      ],
      exercisedAtomKanas: ["あれ", "だれ", "の", "くるま"],
    }),
    build(
      "ja-m4-neo-6-capstone",
      "Build this sentence: That (near you) is mine.",
      "それは わたしのだ",
      ["それ", "は", "わたし", "の", "だ", "ケン"],
      ["それ", "は", "わたし", "の", "だ"],
      ["それ", "わたし", "の"],
    ),
    // ③ Dialogue closer — だれの Q→short answer in the wild. (The lost-bag
    // STORY is L7's scene — different object here on purpose.)
    dialogueListen({
      id: "ja-m4-neo-6-dlg-close",
      lines: [
        { speaker: "Ken", kana: "だれの けいたい？" },
        { speaker: "Mika", kana: "トムのだ。" },
        { speaker: "Ken", kana: "そう。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Ken want to know?",
          correctText: "Whose phone it is",
          distractors: [
            "Whose bag it is",
            "Where his phone went",
            "Who Tom is",
          ],
        },
        {
          id: "q2",
          prompt: "Whose is it?",
          correctText: "Tom's",
          distractors: ["Ken's", "Mika's", "Nobody knows"],
        },
      ],
      exercisedAtomKanas: ["だれ", "の", "けいたい", "そう"],
    }),
    // Review tail (house idiom: speak → LC → vocabMcq → decode-build →
    // match grid).
    speaking(
      "ja-m4-neo-6-rev-speak",
      L6_REVIEW[0].kana,
      L6_REVIEW[0].meaningEn,
      [L6_REVIEW[0].kana],
    ),
    listeningCompSentence({
      id: "ja-m4-neo-6-rev-lc",
      audioText: L6_REVIEW[1].kana,
      question: "What did you hear?",
      correctMeaningEn: L6_REVIEW[1].meaningEn,
      distractorsEn: [
        L6_REVIEW[2].meaningEn,
        L6_REVIEW[3].meaningEn,
        L6_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L6_REVIEW[1].kana],
    }),
    vocabMcq("ja-m4-neo-6-rev-mcq", L6_REVIEW[2], NEO_PRIOR_POOL),
    listeningBuildWord(
      "ja-m4-neo-6-rev-lb-kao",
      "かお",
      "face",
      ["か", "お"],
      ["が", "あ", "む"],
    ),
    reviewMatchPairs("ja-m4-neo-6-rev", L6_REVIEW),
  ],
};

assertNoSameAnswerCluster(M4_NEO_6.steps);
// Single cloze (だれの) — trivially rotated; documents intent.
assertAnswerRotation(M4_NEO_6.steps, 1);
assertNoConsecutiveSame(M4_NEO_6.steps);

/** Lessons 1-6 of m4-neo (first half; L7-12 live in m4-neo-b.ts). */
export const M4_NEO_A_LESSONS: LessonContent[] = [
  M4_NEO_1,
  M4_NEO_2,
  M4_NEO_3,
  M4_NEO_4,
  M4_NEO_5,
  M4_NEO_6,
];
