/**
 * M3-NEO — PILOT MODULE of the dict-form-first course rewrite
 * (spine tile s03, docs spine draft-3 2026-07-19).
 *
 * "Plain sentences — だ, は, も": the plain copula sentence as the atom,
 * taught teach-by-showing (Irodori noticing order: hear it FIRST, then the
 * rule as the answer to what was noticed). Register-explicit ruling: every
 * production prompt names its audience — at m3 that is always casual /
 * "to a friend". です appears ONLY as flagged recognition previews
 * (invariant 7 [polite-everywhere] is REPEALED for this module — plain
 * form IS the register).
 *
 * Deep-link-only pilot lessons: registered in mockLessons.ts's explicit
 * map, NOT in mockCourse.ts. moduleId stays "m3" so the romaji ladder is
 * correct (romaji SHOWS at m3; no kanji — below the m8 floor).
 *
 * Constraints honored (concept-type-authoring-guide-2026-07-19 + pinned
 * invariants 10/11/12/15/17/18; invariant 4 in force — chunks taught via
 * listening/MCQ/match/speaking, never phrase_card):
 *  - L1 SENTENCE-PATTERN template: listening exposure → grammar_rule
 *    (invariant-12 minimal pair) → builds → MCQs → translate/speaking →
 *    だ-drop note (acceptedAnswers include both ねこだ and ねこ) → ONE
 *    flagged です recognition preview.
 *  - L2 DISCOURSE-PARTICLE template (1b): は in MULTI-SENTENCE context
 *    only, spotlight framing, NEVER glossed "as for".
 *  - L3 PARTICLE substitution: は↔も choice-under-contrast drills (2-line
 *    context forces the answer), never transformation.
 *  - L4 PATTERN + PROSODY: statement vs question by intonation (。/？ TTS
 *    contour pairs, both strings authored); うん/そう RECOGNITION only.
 *  - L5 CHUNK template (type 5): ZERO grammar_rule steps, function
 *    glosses, situation-matching, one register-noticing MCQ.
 *  - L6 integration story; one older character speaks TWO flagged です
 *    lines (Irodori register-preview device).
 *  - L7 mixed review: all-new sentences, ≥60% sentence-context.
 *
 * New course atoms (courseAtoms.ts): うん / そう (blocked, recognition
 * only) + はじめまして (phrase). Everything else reuses existing atoms.
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
import type { ListeningBuildStep, MatchPairsStep } from "@/features/lesson/types";

const COURSE = "mock-1";
const LANG = "ja";

/**
 * Char-granularity `listening_build` of a single REVIEW word from its
 * m1/m2 TTS clip — the kana-decode beat of the house review tails (same
 * shape as `_consonantRowHelpers.listeningBuild`, sans RowContext).
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

// Review pools: M1 + M2 only — the learner arriving at m3-neo owns kana +
// the concrete-noun anchors, nothing else. Katakana entries are excluded:
// the pool's m2 tag predates the katakana-rollout spec (ティーシャツ /
// パーティー carry extension ティ, never base-readable before M17), so a
// draw would show a word the learner cannot read (2026-07-20 audit).
const noKatakana = (a: { kana: string }) =>
  !/\p{Script=Katakana}/u.test(a.kana);
const NEO_M1_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1"),
).filter(noKatakana);
const NEO_M2_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2"),
).filter(noKatakana);
const NEO_M1_M2_POOL = [...NEO_M1_POOL, ...NEO_M2_POOL];

/* ════════════════════════════════════════════════════════════════════════
 * L1 — "It's a cat — だ" (SENTENCE-PATTERN template)
 * Teach-by-showing: listening FIRST, rule as the answer to the noticing.
 * ════════════════════════════════════════════════════════════════════════ */

const L1_REVIEW = pickReviewAtoms("ja-m3-neo-1-rev", NEO_M1_POOL, 6);

export const M3_NEO_1: LessonContent = {
  id: "ja-m3-neo-1",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "It's a cat — だ",
  description:
    "Your first real sentences: noun + だ. Hear it, notice it, then say it — casually, the way friends talk.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Noticing exposure — hear ~だ sentences BEFORE any rule, but
    // interleaved with echo-production (guide density bar: no two
    // adjacent same-type steps; the old open ran THREE LCs in a row).
    listeningCompSentence({
      id: "ja-m3-neo-1-lc-neko",
      audioText: "ねこだ。",
      question: "What does this mean?",
      correctMeaningEn: "It's a cat.",
      distractorsEn: ["It's a dog.", "It's water.", "It's a book."],
      exercisedAtomKanas: ["ねこ"],
    }),
    build(
      "ja-m3-neo-1-build-neko",
      "Build this sentence: It's a cat.",
      "ねこだ",
      ["だ", "ねこ", "いぬ"],
      ["ねこ", "だ"],
      ["ねこ"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-1-lc-mizu",
      audioText: "みずだ。",
      question: "What does this mean?",
      correctMeaningEn: "It's water.",
      distractorsEn: ["It's a cat.", "It's the sea.", "It's a key."],
      exercisedAtomKanas: ["みず"],
    }),
    speaking("ja-m3-neo-1-speak-neko", "ねこだ", "It's a cat.", ["ねこ"]),
    listeningCompSentence({
      id: "ja-m3-neo-1-lc-hon",
      audioText: "ほんだ。",
      question: "What does this mean?",
      correctMeaningEn: "It's a book.",
      distractorsEn: [
        "It's a pencil.",
        "It's a photo.",
        "It's a hat.",
      ],
      exercisedAtomKanas: ["ほん"],
    }),
    // ② The rule — the answer to what they just noticed.
    grammarRule({
      id: "ja-m3-neo-1-rule-da",
      title: "だ — 'it's X', plain and simple",
      rule:
        "You just heard it three times: noun + だ = 'it's X / X is the case.' だ closes a plain statement — the everyday register friends use with each other. One noun, one だ: a whole sentence.",
      examples: [
        { ja: "ねこだ。", romaji: "neko da.", en: "It's a cat." },
        { ja: "みずだ。", romaji: "mizu da.", en: "It's water." },
      ],
      // antiPattern must be GENUINELY WRONG Japanese — the derived
      // spot-the-mistake step labels it ✗. The statement/question
      // contrast (ねこだ。/ねこ？) is CORRECT-vs-CORRECT and lives in
      // L4's teaching, not here (Spencer walk 2026-07-19: both prior
      // "wrong" options were real sentences).
      antiPattern: {
        ja: "だねこ。",
        romaji: "da neko.",
        en: "(broken: だ before the noun)",
        why:
          "だ closes the sentence — it never leads. Noun first, だ last: ねこだ。",
      },
      cultureNote:
        "だ isn't literally the word 'it is' — Japanese doesn't need an 'it' at all. ねこだ is simply how Japanese says what English says with 'It's a cat.' Treat them as equivalents, not word-for-word translations.",
    }),
    // ③ Builds — tiles keep だ separate so the pattern is assembled, not read.
    build(
      "ja-m3-neo-1-build-inu",
      "Build this sentence: It's a dog.",
      "いぬだ",
      ["ねこ", "いぬ", "だ", "みず"],
      ["いぬ", "だ"],
      ["いぬ"],
    ),
    // ④ Meaning MCQs.
    sentenceMcq({
      id: "ja-m3-neo-1-mcq-hon",
      prompt: "Pick: 'It's a book.'",
      correctKana: "ほんだ。",
      distractorsKana: ["みずだ。", "ねこだ。", "いぬだ。"],
      exercisedAtomKanas: ["ほん"],
    }),
    // Generation beat, then the gamified breather over an M1 salvage atom.
    // (An extra うみ LC sat here — trimmed to make room for the です
    // preview card while staying inside the 24-step spot budget.)
    build(
      "ja-m3-neo-1-build-mizu",
      "Build this sentence: It's water.",
      "みずだ",
      ["みず", "ほん", "だ"],
      ["みず", "だ"],
      ["みず"],
    ),
    // Breather pinned to うみ, not a seeded draw (2026-07-27
    // gloss-before-production): the learner says うみだ and builds it a few
    // steps below, and うみ was an m1 pool word the course never actually
    // glossed — its first stated meaning sat two lessons later.
    vocabMcq(
      "ja-m3-neo-1-vmcq-mid",
      { kana: "うみ", meaningEn: "sea", emoji: "🌊", fromModule: "m1" },
      NEO_M1_POOL,
    ),
    // ⑥ だ-drop note — casual speech often drops だ entirely.
    grammarRule({
      id: "ja-m3-neo-1-rule-da-drop",
      title: "Dropping だ — even more casual",
      rule:
        "Friends often drop だ altogether: point and say ねこ。 — done. Both ねこだ and plain ねこ are natural casual statements; だ just makes it a touch more emphatic. Answers with or without だ count everywhere in this course.",
      examples: [
        { ja: "そらだ。", romaji: "sora da.", en: "It's the sky. (with だ)" },
        { ja: "そら。", romaji: "sora.", en: "The sky. (だ dropped — very common)" },
      ],
      // です moved OFF this card (Spencer walk 2026-07-19: two contrasting
      // ideas on one card — drop だ AND here's です — read as confusing).
      // It gets its own preview card right before the です listening step.
      // No antiPattern on purpose: there is no wrong way to optionally
      // drop だ, and です is correct-but-formal — a register CONTRAST,
      // which belongs above in examples, never in the ✗ slot (the
      // derived spot step would call polite Japanese "wrong").
    }),
    // ⑤ Production: translate + speaking (だ-dropped answers accepted).
    translateStep({
      id: "ja-m3-neo-1-tr-inu",
      promptEn: "Translate: It's a dog.",
      acceptedAnswers: ["いぬだ", "いぬ", "いぬだ。", "いぬ。"],
      audioText: "いぬだ",
      exercisedAtomKanas: ["いぬ"],
    }),
    // Hear-and-assemble on a fresh noun — the mora-tile listening build
    // the guide template expects (was a 7th plain LC on そらだ).
    listeningBuildSentence({
      id: "ja-m3-neo-1-lbs-sora",
      target: "そらだ",
      tiles: ["そら", "だ", "うみ"],
      correctOrder: ["そら", "だ"],
      promptEn: "It's the sky.",
      exercisedAtomKanas: ["そら"],
    }),
    translateStep({
      id: "ja-m3-neo-1-tr-mizu",
      promptEn: "Translate: It's water.",
      acceptedAnswers: ["みずだ", "みず", "みずだ。", "みず。"],
      audioText: "みずだ",
      exercisedAtomKanas: ["みず"],
    }),
    speaking("ja-m3-neo-1-speak-umi", "うみだ", "It's the sea.", ["うみ"]),
    // だ-drop recognition.
    listeningCompSentence({
      id: "ja-m3-neo-1-lc-neko-drop",
      audioText: "ねこ。",
      question:
        "One word, falling tone — what does it mean?",
      correctMeaningEn: "It's a cat.",
      distractorsEn: ["It's a dog.", "It's a flower.", "It's a peach."],
      exercisedAtomKanas: ["ねこ"],
    }),
    // Build between the two recognition LCs (adjacent same-type ban).
    build(
      "ja-m3-neo-1-build-umi",
      "Build this sentence: It's the sea.",
      "うみだ",
      ["うみ", "そら", "だ"],
      ["うみ", "だ"],
      ["うみ"],
    ),
    // ⑦ です preview — teach card FIRST, then the recognition question.
    // (Spencer walk 2026-07-19: the graded です step hit cold; the card
    // sets up the register contrast so the question confirms, not
    // ambushes.) No antiPattern: です is correct Japanese.
    grammarRule({
      id: "ja-m3-neo-1-rule-desu-preview",
      title: "Preview: です — the polite だ",
      rule:
        "One more ending you'll hear everywhere: です. Same job as だ, wrapped in politeness — ねこだ to a friend, ねこです to a stranger or staff. Your own sentences stay plain for now; just recognize it.",
      examples: [
        { ja: "そらだ。", romaji: "sora da.", en: "It's the sky. (plain — friends)" },
        {
          ja: "そらです。",
          romaji: "sora desu.",
          en: "It's the sky. (polite — its own module comes soon)",
        },
      ],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-1-lc-desu-preview",
      audioText: "ねこです。",
      correctMeaningEn: "It's a cat.",
      distractorsEn: ["It's a dog.", "Is it a cat?", "It's water."],
      explanation:
        "That's the polite です from the card — same meaning as ねこだ, more distance. It gets its own module soon; for now, just recognize it.",
      exercisedAtomKanas: ["ねこ"],
    }),
    speaking("ja-m3-neo-1-speak-hon", "ほんだ", "It's a book.", ["ほん"]),
    // Review tail — M1 atoms (house idiom: LC → decode-build → vocabMcq →
    // sentence pick → match grid; ratio boosted toward the guide's 0.25
    // floor, within M3's M1+M2-only draw pool).
    listeningCompSentence({
      id: "ja-m3-neo-1-rev-lc",
      audioText: L1_REVIEW[2].kana,
      question: "What did you hear?",
      correctMeaningEn: L1_REVIEW[2].meaningEn,
      distractorsEn: [
        L1_REVIEW[3].meaningEn,
        L1_REVIEW[4].meaningEn,
        L1_REVIEW[5].meaningEn,
      ],
      exercisedAtomKanas: [L1_REVIEW[2].kana],
    }),
    listeningBuildWord(
      "ja-m3-neo-1-rev-lb-hoshi",
      "ほし",
      "star",
      ["ほ", "し"],
      ["は", "ま", "つ"],
    ),
    vocabMcq("ja-m3-neo-1-rev-mcq", L1_REVIEW[0], NEO_M1_POOL),
    reviewMatchPairs("ja-m3-neo-1-rev", L1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M3_NEO_1.steps);
assertNoConsecutiveSame(M3_NEO_1.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L2 — "は — the spotlight" (DISCOURSE-PARTICLE template 1b)
 * は only ever appears in multi-sentence / dialogue context. Never "as for".
 * ════════════════════════════════════════════════════════════════════════ */

const L2_REVIEW = pickReviewAtoms("ja-m3-neo-2-rev", NEO_M2_POOL, 6);

export const M3_NEO_2: LessonContent = {
  id: "ja-m3-neo-2",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "は — the spotlight",
  description:
    "は puts a spotlight on the topic; the rest of the sentence comments on it. Introduce yourself and your friends — casually.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Mini-dialogue exposure first.
    dialogueListen({
      id: "ja-m3-neo-2-dlg-intro",
      lines: [
        { speaker: "Tom", kana: "わたしは トムだ。がくせいだ。" },
        { speaker: "Mika", kana: "わたしは ミカだ。がくせいだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Tom say he is?",
          correctText: "A student",
          distractors: ["A teacher", "A doctor", "A tourist"],
        },
        {
          id: "q2",
          prompt: "Who is the teacher?",
          correctText: "Neither — they're both students",
          distractors: ["Tom", "Mika", "Both of them"],
        },
      ],
      exercisedAtomKanas: ["わたし", "がくせい"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-2-lc-mika-gakusei",
      audioText: "ミカは がくせいだ。",
      question: "What does this mean?",
      correctMeaningEn: "Mika is a student.",
      distractorsEn: ["Mika is a teacher.", "Tom is a student.", "I'm a student."],
      exercisedAtomKanas: ["がくせい", "は"],
    }),
    // ② The rule — spotlight framing (never "as for").
    grammarRule({
      id: "ja-m3-neo-2-rule-wa",
      title: "は — the spotlight",
      rule:
        "は shines a spotlight on the topic — the thing the sentence is about. Everything after は is a comment on it: わたしは がくせいだ = spotlight on me → comment: student. Written は, said 'wa'.",
      examples: [
        {
          ja: "わたしは がくせいだ。",
          romaji: "watashi wa gakusei da.",
          en: "I'm a student. (spotlight: me → comment: student)",
        },
        {
          ja: "たなかは せんせいだ。",
          romaji: "tanaka wa sensei da.",
          en: "Tanaka is a teacher. (the spotlight moves to Tanaka)",
        },
        {
          ja: "がくせいだ。",
          romaji: "gakusei da.",
          en: "(I'm) a student. (no spotlight — natural when it's already obvious who you mean)",
        },
        // Carries にほんじん's English (2026-07-27 gloss-before-production):
        // the lesson closes by asking the learner to BUILD わたしは
        // にほんじんだ, and nothing before this card ever said what the
        // word means — the dialogue only shows it.
        {
          ja: "ミカは にほんじんだ。",
          romaji: "mika wa nihonjin da.",
          en: "Mika is Japanese. (にほんじん = a Japanese person)",
        },
      ],
      // The with/without-topic contrast (がくせいだ。 is CORRECT when the
      // topic is obvious) moved to examples — invariant 12 semantic
      // contract. The antiPattern is the genuine beginner error: putting
      // the particle BEFORE its noun, English-preposition style.
      antiPattern: {
        ja: "はわたし がくせいだ。",
        romaji: "wa watashi gakusei da.",
        en: "(broken: は before its noun)",
        why:
          "は clips onto the END of the word it spotlights: わたしは, never はわたし. Japanese particles always follow their word.",
      },
    }),
    // ③ Builds — AはBだ.
    build(
      "ja-m3-neo-2-build-watashi",
      "Build this sentence: I'm a student.",
      "わたしは がくせいだ",
      ["がくせい", "は", "わたし", "だ", "せんせい"],
      ["わたし", "は", "がくせい", "だ"],
      ["わたし", "がくせい", "は"],
    ),
    vocabMcq(
      "ja-m3-neo-2-mcq-gakusei",
      { kana: "がくせい", meaningEn: "student", emoji: "🎓", fromModule: "m3" },
      NEO_M1_POOL,
    ),
    build(
      "ja-m3-neo-2-build-tanaka",
      "Build this sentence: Tanaka is a teacher.",
      "たなかは せんせいだ",
      ["たなか", "は", "せんせい", "だ", "がくせい"],
      ["たなか", "は", "せんせい", "だ"],
      ["せんせい", "は"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-2-lc-kawa",
      audioText: "かわは みずだ。",
      question: "What does this mean?",
      correctMeaningEn: "The river is water.",
      distractorsEn: [
        "The sea is water.",
        "The river is big.",
        "It's water.",
      ],
      exercisedAtomKanas: ["みず", "は"],
    }),
    // Was an M2 salvage-atom breather; now ともだち's debut (2026-07-27
    // gloss-before-production). ともだち is content vocabulary from the
    // spotlight LC two steps below and gets BUILT right after it — its
    // meaning was first stated in m4, a whole module too late.
    vocabMcq(
      "ja-m3-neo-2-vmcq-mid",
      { kana: "ともだち", meaningEn: "friend", emoji: "👫", fromModule: "m3" },
      NEO_M2_POOL,
    ),
    // Hear-and-assemble on a taught sentence — the template's
    // listening_build beat (L2 previously only had a word-level decode).
    listeningBuildSentence({
      id: "ja-m3-neo-2-lbs-tomu",
      target: "トムは がくせいだ",
      tiles: ["トム", "は", "も", "がくせい", "だ"],
      correctOrder: ["トム", "は", "がくせい", "だ"],
      promptEn: "Tom is a student.",
      exercisedAtomKanas: ["がくせい", "は"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-2-lc-spotlight-2",
      audioText: "ともだちは がくせいだ。",
      correctMeaningEn: "My friend is a student.",
      distractorsEn: [
        "I'm a student.",
        "Tom is a student.",
        "My friend is a teacher.",
      ],
      exercisedAtomKanas: ["ともだち", "がくせい", "は"],
    }),
    build(
      "ja-m3-neo-2-build-tomodachi",
      "Build this sentence: My friend is a student.",
      "ともだちは がくせいだ",
      ["ともだち", "は", "がくせい", "だ", "トム"],
      ["ともだち", "は", "がくせい", "だ"],
      ["ともだち", "がくせい", "は"],
    ),
    // ④ Context MCQs — what does は spotlight?
    listeningCompSentence({
      // Topic-tracking tested through plain translation — the "which part
      // is the topic?" metalanguage quiz displayed は on the answer and
      // explained itself in the options (Spencer walk).
      id: "ja-m3-neo-2-lc-spotlight-1",
      audioText: "トムは がくせいだ。",
      correctMeaningEn: "Tom is a student.",
      distractorsEn: [
        "My friend is a student.",
        "I'm a student.",
        "Tom is a teacher.",
      ],
      exercisedAtomKanas: ["がくせい", "は"],
    }),
    cloze(
      "ja-m3-neo-2-cloze-wa",
      "すし",
      " ごはんだ。",
      "は",
      ["は", "か", "の", "が"],
      "Sushi is rice.",
      "すしは ごはんだ。",
      "The spotlight lands on sushi; the comment says what it is.",
    ),
    // ⑤ Production with audience cue.
    speaking(
      "ja-m3-neo-2-speak-tomodachi",
      "ともだちは がくせいだ",
      "My friend is a student.",
      ["ともだち", "がくせい"],
    ),
    translateStep({
      id: "ja-m3-neo-2-tr-watashi",
      promptEn: "Translate: I'm a student.",
      acceptedAnswers: [
        "わたしは がくせいだ",
        "わたしはがくせいだ",
        "わたしは がくせい",
        "わたしはがくせい",
        "がくせいだ",
      ],
      audioText: "わたしは がくせいだ",
      exercisedAtomKanas: ["わたし", "がくせい"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-2-lc-tomu-tomodachi",
      audioText: "トムは ともだちだ。",
      question: "What does this mean?",
      correctMeaningEn: "Tom is my friend.",
      distractorsEn: [
        "Tom is a student.",
        "Tom is my teacher.",
        "I'm a friend.",
      ],
      exercisedAtomKanas: ["ともだち", "は"],
    }),
    speaking(
      "ja-m3-neo-2-speak-tanaka",
      "たなかは せんせいだ",
      "Tanaka is a teacher.",
      ["せんせい"],
    ),
    // Closer dialogue — nationality words in the wild. Speakers state
    // their OWN nationality so every question grades on a stated fact:
    // the old version had ミカ describe an unnamed ともだち, and since
    // this same lesson teaches トムは ともだちだ, "Tom" and "Mika's
    // friend" collapsed into one person — two defensible answers, one
    // graded wrong (Spencer walk 2026-07-19).
    dialogueListen({
      id: "ja-m3-neo-2-dlg-close",
      lines: [
        { speaker: "Tom", kana: "わたしは アメリカじんだ。" },
        { speaker: "Mika", kana: "わたしは にほんじんだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Who is American?",
          correctText: "Tom",
          distractors: ["Mika", "Both of them", "Neither of them"],
        },
        {
          id: "q2",
          prompt: "What does Mika say?",
          correctText: "I'm Japanese.",
          distractors: [
            "I'm American.",
            "Tom is Japanese.",
            "I'm a student.",
          ],
        },
      ],
      exercisedAtomKanas: ["わたし", "は", "にほんじん", "アメリカじん"],
    }),
    build(
      "ja-m3-neo-2-build-nihonjin",
      "Build this sentence: I'm Japanese.",
      "わたしは にほんじんだ",
      ["わたし", "は", "にほんじん", "だ", "アメリカじん"],
      ["わたし", "は", "にほんじん", "だ"],
      ["わたし", "にほんじん", "は"],
    ),
    // Review tail — M2 atoms (house idiom: speak → decode-build → LC →
    // vocabMcq → match grid).
    speaking(
      "ja-m3-neo-2-rev-speak",
      L2_REVIEW[0].kana,
      L2_REVIEW[0].meaningEn,
      [L2_REVIEW[0].kana],
    ),
    listeningBuildWord(
      "ja-m3-neo-2-rev-lb-megane",
      "めがね",
      "glasses",
      ["め", "が", "ね"],
      ["ぬ", "か", "れ"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-2-rev-lc",
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
    vocabMcq("ja-m3-neo-2-rev-mcq", L2_REVIEW[2], NEO_M2_POOL),
    reviewMatchPairs("ja-m3-neo-2-rev", L2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M3_NEO_2.steps);
assertAnswerRotation(M3_NEO_2.steps, 1); // は intro lesson — single new particle
assertNoConsecutiveSame(M3_NEO_2.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L3 — "も — me too" (PARTICLE substitution template)
 * は→も slot swap = meaning change; choice-under-contrast, never transform.
 * ════════════════════════════════════════════════════════════════════════ */

const L3_REVIEW = pickReviewAtoms("ja-m3-neo-3-rev", NEO_M1_POOL, 6);

export const M3_NEO_3: LessonContent = {
  id: "ja-m3-neo-3",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "も — me too",
  description:
    "Swap the spotlight は for も and the sentence gains 'too.' Two-line contexts force the choice.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ② The rule — minimal pair per invariant 12.
    grammarRule({
      id: "ja-m3-neo-3-rule-mo",
      title: "Too",
      rule:
        "Swap は for も and the sentence gains 'too / also': トムも がくせいだ = Tom is a student TOO. も REPLACES は in that slot — the two never stack. Everything else stays the same.",
      examples: [
        {
          ja: "トムも がくせいだ。",
          romaji: "tomu mo gakusei da.",
          en: "Tom is a student too.",
        },
        {
          ja: "わたしも がくせいだ。",
          romaji: "watashi mo gakusei da.",
          en: "I'm a student too.",
        },
      ],
      antiPattern: {
        ja: "トムはも がくせいだ。",
        romaji: "tomu wa mo gakusei da.",
        en: "(Tom is a student too — broken)",
        why:
          "も replaces は; they never stack. トムも already carries both jobs: topic AND 'too.'",
      },
    }),
    // ① Contrast exposure.
    dialogueListen({
      id: "ja-m3-neo-3-dlg-intro",
      lines: [
        { speaker: "Tom", kana: "わたしは がくせいだ。" },
        { speaker: "Mika", kana: "わたしも がくせいだ。" },
      ],
      questions: [
        {
          // The too-less translation as a distractor IS the も test —
          // no metalanguage, and the answer isn't printed anywhere
          // (the old q1 quoted わたしも in its own prompt, then q2
          // asked which word she used).
          id: "q1",
          prompt: "What does Mika's reply mean?",
          correctText: "I'm a student too.",
          distractors: [
            "I'm a student.",
            "I'm not a student.",
            "Are you a student?",
          ],
        },
        {
          id: "q2",
          prompt: "Who is a student?",
          correctText: "Both Tom and Mika",
          distractors: ["Only Tom", "Only Mika", "Neither of them"],
        },
      ],
      exercisedAtomKanas: ["わたし", "がくせい", "も"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-3-lc-tomu",
      audioText: "トムも がくせいだ。",
      question: "Said right after a sentence about Mika — what does it mean?",
      correctMeaningEn: "Tom is a student too.",
      distractorsEn: [
        "Tom is NOT a student.",
        "Is Tom a student?",
        "Tom is a teacher too.",
      ],
      exercisedAtomKanas: ["がくせい", "も"],
    }),
    // ③ Choice-under-contrast drills — 2-line context, blank particle.
    cloze(
      "ja-m3-neo-3-cloze-mo-1",
      "わたしは がくせいだ。トム",
      " がくせいだ。",
      "も",
      ["も", "は", "か", "の"],
      "I'm a student. Tom is a student too.",
      "わたしは がくせいだ。トムも がくせいだ。",
      "Tom joins something already said about the speaker — the context forces 'too.'",
    ),
    // (A "why is も correct?" selfExplain sat here — removed: textbook
    // metalanguage with a self-announcing rule option, per the Spencer
    // walk ruling. Understanding is tested by USE — the four
    // choice-under-contrast clozes above carry it.)
    // ④ Builds — both particles in the bank so the choice is real.
    build(
      "ja-m3-neo-3-build-watashi-mo",
      "Build this sentence: I'm a student too.",
      "わたしも がくせいだ",
      ["わたし", "も", "は", "がくせい", "だ"],
      ["わたし", "も", "がくせい", "だ"],
      ["わたし", "がくせい", "も"],
    ),
    cloze(
      "ja-m3-neo-3-cloze-wa-1",
      "トムは アメリカじんだ。ミカ",
      " にほんじんだ。",
      "は",
      ["は", "も", "か", "の"],
      "Tom is American. Mika is Japanese.",
      "トムは アメリカじんだ。ミカは にほんじんだ。",
      "Mika does NOT join Tom's group — a new spotlight, not 'too.'",
    ),
    speaking(
      "ja-m3-neo-3-speak-watashi-mo",
      "わたしも がくせいだ",
      "I'm a student too.",
      ["わたし", "がくせい"],
    ),
    cloze(
      "ja-m3-neo-3-cloze-mo-2",
      "いぬは ともだちだ。ねこ",
      " ともだちだ。",
      "も",
      ["も", "は", "の", "か"],
      "Dogs are friends. Cats are friends too.",
      "いぬは ともだちだ。ねこも ともだちだ。",
      "Cats join the same club as dogs — same comment, so 'too.'",
    ),
    translateStep({
      id: "ja-m3-neo-3-tr-inu-mo",
      promptEn: "Translate: The dog is a friend too.",
      acceptedAnswers: [
        "いぬも ともだちだ",
        "いぬもともだちだ",
        "いぬも ともだち",
        "いぬもともだち",
      ],
      audioText: "いぬも ともだちだ",
      exercisedAtomKanas: ["いぬ", "ともだち", "も"],
    }),
    cloze(
      "ja-m3-neo-3-cloze-wa-2",
      "たなかは せんせいだ。トム",
      " がくせいだ。",
      "は",
      ["は", "も", "が", "の"],
      "Tanaka is a teacher. Tom is a student.",
      "たなかは せんせいだ。トムは がくせいだ。",
      "Different comments — Tom isn't joining Tanaka's group, so a fresh spotlight.",
    ),
    listeningCompSentence({
      id: "ja-m3-neo-3-lc-mika",
      audioText: "ミカも ともだちだ。",
      question: "The answer to a question about Mika — what does it mean?",
      correctMeaningEn: "Mika is a friend too.",
      distractorsEn: [
        "Mika is my only friend.",
        "Mika is a teacher too.",
        "Is Mika a friend?",
      ],
      exercisedAtomKanas: ["ともだち", "も"],
    }),
    build(
      "ja-m3-neo-3-build-ken-mo",
      "Build this sentence: Ken is Japanese too.",
      "ケンも にほんじんだ",
      ["ケン", "も", "は", "にほんじん", "だ"],
      ["ケン", "も", "にほんじん", "だ"],
      ["にほんじん", "も"],
    ),
    // Quick gamified breather — emoji word check over an M1 salvage atom.
    vocabMcq("ja-m3-neo-3-vmcq-mid", L3_REVIEW[5], NEO_M1_POOL),
    // ⑤ Production both directions.
    // (Was a "pick your reply" sentence MCQ — production-framed prompts
    // are GENERATION steps, never MCQs; the options printed the answer
    // (Spencer walk 2026-07-20). Reply scenario rebuilt as a build.)
    build(
      "ja-m3-neo-3-build-reply-inu",
      "Build this sentence: Dogs are friends too.",
      "いぬも ともだちだ",
      ["いぬ", "も", "は", "ともだち", "だ"],
      ["いぬ", "も", "ともだち", "だ"],
      ["いぬ", "ともだち", "も"],
    ),
    speaking(
      "ja-m3-neo-3-speak-neko-mo",
      "ねこも ともだちだ",
      "Cats are friends too.",
      ["ねこ", "ともだち"],
    ),
    build(
      "ja-m3-neo-3-build-mika-mo",
      "Build this sentence: Mika is a friend too.",
      "ミカも ともだちだ",
      ["ミカ", "も", "は", "ともだち", "だ"],
      ["ミカ", "も", "ともだち", "だ"],
      ["ともだち", "も"],
    ),
    listeningBuildSentence({
      id: "ja-m3-neo-3-lbs-tomu-mo",
      target: "トムも ともだちだ",
      tiles: ["トム", "も", "は", "ともだち", "だ"],
      correctOrder: ["トム", "も", "ともだち", "だ"],
      promptEn: "Tom is a friend too.",
      exercisedAtomKanas: ["ともだち", "も"],
    }),
    // Review tail — M1 atoms (house idiom: speak → decode-build → LC →
    // vocabMcq → match grid).
    speaking(
      "ja-m3-neo-3-rev-speak",
      L3_REVIEW[0].kana,
      L3_REVIEW[0].meaningEn,
      [L3_REVIEW[0].kana],
    ),
    listeningBuildWord(
      "ja-m3-neo-3-rev-lb-kawa",
      "かわ",
      "river",
      ["か", "わ"],
      ["が", "ね", "れ"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-3-rev-lc",
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
    vocabMcq("ja-m3-neo-3-rev-mcq", L3_REVIEW[3], NEO_M1_POOL),
    reviewMatchPairs("ja-m3-neo-3-rev", L3_REVIEW),
  ],
};

assertNoSameAnswerCluster(M3_NEO_3.steps);
assertAnswerRotation(M3_NEO_3.steps, 2); // rotates は / も by design
assertNoConsecutiveSame(M3_NEO_3.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L4 — "Asking without か" (PATTERN + PROSODY)
 * Statement vs question carried by intonation alone (。/？ TTS contour).
 * うん / そう enter as RECOGNITION-only atoms (blocked, no production).
 * ════════════════════════════════════════════════════════════════════════ */

// 11 atoms: [0..5] feed the tail (vocabMcq + closing match grid), [6..10]
// feed the mid-lesson breather grid.
const L4_REVIEW = pickReviewAtoms("ja-m3-neo-4-rev", NEO_M1_M2_POOL, 11);

export const M3_NEO_4: LessonContent = {
  id: "ja-m3-neo-4",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Asking without か",
  description:
    "Casual questions are made with your voice: ねこ？ Rising tone asks; falling tone tells. Hear うん and そう — the answers you'll get.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Listening discrimination pairs — 。 vs ？ contour.
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-neko-stmt",
      audioText: "ねこだ。",
      question: "Telling or asking?",
      correctMeaningEn: "It's a cat.",
      distractorsEn: [
        "Is it a cat?",
        "It's a dog.",
        "Is it a dog?",
      ],
      exercisedAtomKanas: ["ねこ"],
    }),
    // (Was a third うん/そう LC — redundant with lc-un/lc-sou. Converted to
    // a kana-decode build of the lesson's own contour word.)
    listeningBuildWord(
      "ja-m3-neo-4-lb-neko",
      "ねこ",
      "cat",
      ["ね", "こ"],
      ["ぬ", "に", "て"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-neko-q",
      audioText: "ねこ？",
      question: "Telling or asking?",
      correctMeaningEn: "Is it a cat?",
      distractorsEn: [
        "It's a cat.",
        "Is it a dog?",
        "It's a dog.",
      ],
      exercisedAtomKanas: ["ねこ"],
    }),
    // ② The rule.
    grammarRule({
      id: "ja-m3-neo-4-rule-rise",
      title: "Asking with your voice — ねこ？",
      rule:
        "Casual questions need no question word: say the noun with a rising tone and it becomes a question. ねこ。 (falling) = 'It's a cat.' ねこ？ (rising) = 'Is it a cat?' Works with は-sentences too: たなかは せんせい？",
      examples: [
        { ja: "ねこ？", romaji: "neko?", en: "Is it a cat? (rising tone)" },
        { ja: "がくせい？", romaji: "gakusei?", en: "Are you a student?" },
        {
          ja: "ねこだ？",
          romaji: "neko da?",
          en: "It's a CAT?! (keeping だ adds surprised disbelief — real, but not a neutral question)",
        },
      ],
      // No antiPattern: ねこだ？ is real Japanese with a different flavor
      // (moved to examples per invariant 12's semantic contract), and a
      // falling-tone "wrong question" can't be written in text.
      cultureNote:
        "The answers you'll hear (recognition only for now): うん — the casual 'yeah,' the most common word in spoken Japanese; そう / そうだ — 'that's right.' Just understand them; producing them comes later.",
    }),
    // ③ Recognition listening — うん / そう answers.
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-un",
      audioText: "うん、ねこだ。",
      question: "The reply to ねこ？ — what does it mean?",
      correctMeaningEn: "Yeah, it's a cat.",
      distractorsEn: [
        "No, it's a dog.",
        "Is it a cat?",
        "It's a cat, right?",
      ],
      exercisedAtomKanas: ["うん", "ねこ"],
    }),
    speaking("ja-m3-neo-4-speak-neko-q", "ねこ？", "Is it a cat? (voice rises)", [
      "ねこ",
    ]),
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-sou",
      audioText: "そう、ねこだ。",
      question: "Another reply to ねこ？ — what does it mean?",
      correctMeaningEn: "That's right — it's a cat.",
      distractorsEn: [
        "No — wrong.",
        "They're asking a question back.",
        "They don't know.",
      ],
      exercisedAtomKanas: ["そう", "ねこ"],
    }),
    // ④ Build/choose short exchanges.
    sentenceMcq({
      id: "ja-m3-neo-4-mcq-ask-neko",
      prompt: "Ask your friend if it's a cat — voice rising.",
      correctKana: "ねこ？",
      distractorsKana: ["ねこだ。", "ねこも。", "いぬ？"],
      exercisedAtomKanas: ["ねこ"],
    }),
    translateStep({
      id: "ja-m3-neo-4-tr-hon-q",
      promptEn: "Translate: Is it a book?",
      acceptedAnswers: ["ほん？", "ほん"],
      audioText: "ほん？",
      exercisedAtomKanas: ["ほん"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-gakusei-q",
      audioText: "がくせい？",
      question: "Telling or asking?",
      correctMeaningEn: "Are you a student?",
      distractorsEn: [
        "I'm a student.",
        "Are you a teacher?",
        "I'm a teacher.",
      ],
      exercisedAtomKanas: ["がくせい"],
    }),
    // Ask-a-question build (was a pick-the-sentence MCQ — invariant 28:
    // full-sentence recognition is test-out only; produce it, don't pick it).
    build(
      "ja-m3-neo-4-build-ask-tanaka",
      "Build this sentence: Is Tanaka a teacher?",
      "たなかは せんせい？",
      ["たなか", "は", "せんせい", "？", "だ", "も"],
      ["たなか", "は", "せんせい", "？"],
      ["せんせい", "は"],
    ),
    // (Was an は-question LC — mcq-ask-tomu already drills that shape.
    // Converted to a kana-decode build of the lesson's other contour word.)
    listeningBuildWord(
      "ja-m3-neo-4-lb-gakusei",
      "がくせい",
      "student",
      ["が", "く", "せ", "い"],
      ["か", "さ", "り"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-gakusei-stmt",
      audioText: "がくせいだ。",
      question: "Telling or asking?",
      correctMeaningEn: "(I'm) a student.",
      distractorsEn: [
        "Are you a student?",
        "(I'm) a teacher.",
        "Are you a teacher?",
      ],
      exercisedAtomKanas: ["がくせい"],
    }),
    speaking("ja-m3-neo-4-speak-inu-q", "いぬ？", "Is it a dog? (voice rises)", [
      "いぬ",
    ]),
    // Dialogue: question + うん answer in the wild.
    dialogueListen({
      id: "ja-m3-neo-4-dlg-un",
      lines: [
        { speaker: "Ken", kana: "トムは がくせい？" },
        { speaker: "Mika", kana: "うん、がくせいだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What did Ken want to know?",
          correctText: "Whether Tom is a student",
          distractors: [
            "Whether Tom is a teacher",
            "Whether Mika is a student",
            "Where Tom is",
          ],
        },
        {
          id: "q2",
          prompt: "How did Mika answer?",
          correctText: "Yes — casually (うん)",
          distractors: [
            "No",
            "She asked a question back",
            "She didn't know",
          ],
        },
      ],
      exercisedAtomKanas: ["がくせい", "うん"],
    }),
    sentenceMcq({
      id: "ja-m3-neo-4-mcq-yes-reply",
      prompt:
        "Your friend asks: いぬ？ It IS a dog — pick the casual 'yeah, it's a dog.'",
      correctKana: "うん、いぬだ。",
      distractorsKana: ["うん、ねこだ。", "ねこ？", "そらだ。"],
      exercisedAtomKanas: ["うん", "いぬ"],
    }),
    // Mid-lesson breather — review match grid between the two MCQ/speaking
    // blocks (step-type variety per the 2026-07 audit; contour LCs stay).
    // そう rides on the mid grid (2026-07-27 gloss-before-production): it is
    // recognition-only here — image-blocked, no production step targets it —
    // but m5 asks the learner to SAY そう おもう, and until now its meaning
    // was never stated on a teaching surface, only heard in the two LCs
    // above. A word↔meaning grid is the recognition-safe way to say it.
    reviewMatchPairs("ja-m3-neo-4-mid", [
      ...L4_REVIEW.slice(6, 11),
      { kana: "そう", meaningEn: "that's right", fromModule: "m3" },
    ]),
    speaking(
      "ja-m3-neo-4-speak-tomu-q",
      "トムは せんせい？",
      "Is Tom a teacher? (voice rises)",
      ["せんせい"],
    ),
    // Review tail (house idiom: vocabMcq → decode-build → match grid).
    vocabMcq("ja-m3-neo-4-rev-mcq", L4_REVIEW[0], NEO_M1_M2_POOL),
    listeningBuildWord(
      "ja-m3-neo-4-rev-lb-gohan",
      "ごはん",
      "rice/meal",
      ["ご", "は", "ん"],
      ["こ", "ば", "そ"],
    ),
    reviewMatchPairs("ja-m3-neo-4-rev", L4_REVIEW.slice(0, 6)),
  ],
};

assertNoSameAnswerCluster(M3_NEO_4.steps);
assertNoConsecutiveSame(M3_NEO_4.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L5 — "Survival sounds" (CHUNK template, type 5 — NO grammar stage)
 * Unanalyzed wholes with function glosses: situated listening →
 * situation-matching → ONE register-noticing MCQ → listen-and-repeat →
 * act-out MCQs. Zero grammar_rule steps. No decomposition.
 * ════════════════════════════════════════════════════════════════════════ */

const L5_REVIEW = pickReviewAtoms("ja-m3-neo-5-rev", NEO_M1_M2_POOL, 6);

export const M3_NEO_5: LessonContent = {
  id: "ja-m3-neo-5",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Survival sounds",
  description:
    "Five whole phrases you'll use from day one: すみません, ごめんなさい, ありがとうございます, だいじょうぶ, はじめまして. No grammar — just the moments they belong to.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ⓪ すみません's picture debut (2026-07-27 gloss-before-production).
    // The lesson used to open on its listening comp and ask the learner to
    // SAY it one step later — audio→meaning is teaching, but nothing had
    // yet stated the pair outright, and すみません is the one chunk here
    // with an unambiguous gesture (the bow) to hang it on.
    vocabMcq(
      "ja-m3-neo-5-vmcq-sumimasen",
      {
        kana: "すみません",
        meaningEn: "Excuse me / sorry",
        emoji: "🙇",
        fromModule: "m3",
      },
      NEO_M1_M2_POOL,
    ),
    // ① Situated listening + listen-and-repeat, chunk by chunk.
    listeningCompSentence({
      id: "ja-m3-neo-5-lc-sumimasen",
      audioText: "すみません",
      question: "What does this mean?",
      correctMeaningEn: "Sorry / excuse me",
      distractorsEn: ["Thank you", "Nice to meet you", "It's okay"],
      exercisedAtomKanas: ["すみません"],
    }),
    speaking(
      "ja-m3-neo-5-speak-sumimasen",
      "すみません",
      "Excuse me / sorry.",
      ["すみません"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-5-lc-gomen",
      audioText: "ごめんなさい",
      question: "What does this mean?",
      correctMeaningEn: "I'm sorry!",
      distractorsEn: ["Thank you", "Nice to meet you", "It's all right"],
      exercisedAtomKanas: ["ごめんなさい"],
    }),
    speaking("ja-m3-neo-5-speak-gomen", "ごめんなさい", "I'm sorry.", [
      "ごめんなさい",
    ]),
    listeningCompSentence({
      id: "ja-m3-neo-5-lc-daijoubu",
      audioText: "だいじょうぶ",
      question: "What does this mean?",
      correctMeaningEn: "It's okay — no problem",
      distractorsEn: ["I'm sorry", "Thank you", "Watch out"],
      exercisedAtomKanas: ["だいじょうぶ"],
    }),
    // Act-out MCQ pulled up from the lesson's back half (2026-07-27
    // gloss-before-production): choosing WHEN a chunk belongs is where its
    // meaning gets stated, and that has to precede the speaking beat, not
    // follow it eight steps later. Distractors are the chunks already
    // introduced above plus m3-neo-4's うん — the old set previewed
    // はじめまして and ありがとうございます before either had been taught.
    sentenceMcq({
      id: "ja-m3-neo-5-mcq-actout-daijoubu",
      prompt: "Reply to ごめんなさい:",
      correctKana: "だいじょうぶ",
      distractorsKana: ["すみません", "うん", "そう"],
      exercisedAtomKanas: ["だいじょうぶ"],
    }),
    speaking(
      "ja-m3-neo-5-speak-daijoubu",
      "だいじょうぶ",
      "It's okay — no problem.",
      ["だいじょうぶ"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-5-lc-arigatou",
      audioText: "ありがとうございます",
      question: "What does this mean?",
      correctMeaningEn: "Thank you very much",
      distractorsEn: ["Excuse me", "I'm sorry", "Good morning"],
      exercisedAtomKanas: ["ありがとうございます"],
    }),
    speaking(
      "ja-m3-neo-5-speak-arigatou",
      "ありがとうございます",
      "Thank you very much.",
      ["ありがとうございます"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-5-lc-arigatou-casual",
      audioText: "ありがとう",
      question: "What does this mean?",
      correctMeaningEn: "Thanks! (casual)",
      distractorsEn: ["Sorry!", "No thanks.", "Nice to meet you."],
      exercisedAtomKanas: ["ありがとう"],
    }),
    // (Was the sixth sentenceMcq — converted to a speaking beat.)
    speaking(
      "ja-m3-neo-5-speak-arigatou-casual",
      "ありがとう",
      "Thanks! (casual — to a close friend)",
      ["ありがとう"],
    ),
    // ③ ONE register-noticing MCQ.
    sentenceMcq({
      id: "ja-m3-neo-5-mcq-register",
      prompt:
        "Which thanks fits a stranger?",
      correctKana: "ありがとうございます",
      distractorsKana: ["ありがとう", "うん", "だいじょうぶ"],
      explanation:
        "Long form for strangers and staff; short ありがとう is for people close to you. Same thanks, different distance.",
      exercisedAtomKanas: ["ありがとうございます"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-5-lc-hajimemashite",
      audioText: "はじめまして",
      question: "What does this mean?",
      correctMeaningEn: "Nice to meet you",
      distractorsEn: ["Goodbye", "Good evening", "Congratulations"],
      exercisedAtomKanas: ["はじめまして"],
    }),
    speaking(
      "ja-m3-neo-5-speak-hajimemashite",
      "はじめまして",
      "Nice to meet you.",
      ["はじめまして"],
    ),
    // ② Situation-matching — scene ↔ chunk (6 pairs, floor-proof).
    {
      id: "ja-m3-neo-5-match-scenes",
      type: "match_pairs",
      prompt: "Match each phrase to its moment",
      playAudioOnSelect: true,
      pairs: [
        { id: "p-0", source: "すみません", target: "Squeezing past someone" },
        { id: "p-1", source: "ごめんなさい", target: "Apologizing to a friend" },
        { id: "p-2", source: "ありがとうございます", target: "Thanking a stranger" },
        { id: "p-3", source: "ありがとう", target: "Thanking a close friend" },
        { id: "p-4", source: "だいじょうぶ", target: "Reassuring: 'it's fine'" },
        { id: "p-5", source: "はじめまして", target: "Meeting someone new" },
      ],
      exercisedAtoms: [],
      modality: "recognition",
    } satisfies MatchPairsStep,
    // ⑤ Act-out MCQs. だいじょうぶ's moved up beside its own listening beat
    // (see above) — this one keeps the every-chunk-in-a-situation sweep.
    sentenceMcq({
      id: "ja-m3-neo-5-mcq-actout-sumimasen",
      prompt:
        "To squeeze past someone:",
      correctKana: "すみません",
      distractorsKana: ["だいじょうぶ", "はじめまして", "ごめんなさい"],
      explanation:
        "すみません is the all-purpose 'excuse me' for strangers — getting attention, getting past, small apologies.",
      exercisedAtomKanas: ["すみません"],
    }),
    // (Was an act-out MCQ — the third MCQ in a row of MCQ-heavy beats.
    // Converted to a listening decode-build of the same chunk.)
    listeningBuildWord(
      "ja-m3-neo-5-lb-hajimemashite",
      "はじめまして",
      "nice to meet you",
      ["は", "じ", "め", "ま", "し", "て"],
      ["ば", "ぬ"],
    ),
    // Overheard exchange — two chunks in the wild.
    dialogueListen({
      id: "ja-m3-neo-5-dlg-overheard",
      lines: [
        { speaker: "Stranger", kana: "すみません。" },
        { speaker: "Ken", kana: "だいじょうぶ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What just happened?",
          correctText: "Someone apologized and Ken said it was fine",
          distractors: [
            "Someone said thanks and Ken said you're welcome",
            "They introduced themselves to each other",
            "Ken apologized to a stranger",
          ],
        },
      ],
      exercisedAtomKanas: ["すみません", "だいじょうぶ"],
    }),
    sentenceMcq({
      id: "ja-m3-neo-5-mcq-actout-gomen",
      prompt: "You knock over your friend's cup. Apologize — casually:",
      correctKana: "ごめんなさい",
      distractorsKana: ["だいじょうぶ", "ありがとう", "はじめまして"],
      explanation:
        "ごめんなさい is the direct, personal sorry — right for friends. だいじょうぶ is what THEY might answer.",
      exercisedAtomKanas: ["ごめんなさい"],
    }),
    listeningBuildWord(
      "ja-m3-neo-5-rev-lb-tokei",
      "とけい",
      "watch/clock",
      ["と", "け", "い"],
      ["ど", "は", "り"],
    ),
    // Review tail — M1/M2 atoms (house idiom: LC → vocabMcq → decode-
    // build); the chunk-meaning grid then closes on confidence.
    listeningCompSentence({
      id: "ja-m3-neo-5-rev-lc",
      audioText: L5_REVIEW[0].kana,
      question: "What did you hear?",
      correctMeaningEn: L5_REVIEW[0].meaningEn,
      distractorsEn: [
        L5_REVIEW[1].meaningEn,
        L5_REVIEW[2].meaningEn,
        L5_REVIEW[3].meaningEn,
      ],
      exercisedAtomKanas: [L5_REVIEW[0].kana],
    }),
    vocabMcq("ja-m3-neo-5-rev-mcq", L5_REVIEW[4], NEO_M1_M2_POOL),
    // ⑥ Second match variant — phrase ↔ MEANING (the first grid pairs
    // phrase ↔ situation; a different pairing closes the lesson).
    {
      id: "ja-m3-neo-5-match-meanings",
      type: "match_pairs",
      prompt: "Match each phrase to its meaning",
      playAudioOnSelect: true,
      pairs: [
        { id: "p-0", source: "すみません", target: "excuse me / sorry (to a stranger)" },
        { id: "p-1", source: "ごめんなさい", target: "I'm sorry" },
        { id: "p-2", source: "ありがとうございます", target: "thank you very much" },
        { id: "p-3", source: "ありがとう", target: "thanks (casual)" },
        { id: "p-4", source: "だいじょうぶ", target: "it's okay / no problem" },
        { id: "p-5", source: "はじめまして", target: "nice to meet you" },
      ],
      exercisedAtoms: [],
      modality: "recognition",
    } satisfies MatchPairsStep,
  ],
};

assertNoSameAnswerCluster(M3_NEO_5.steps);
assertNoConsecutiveSame(M3_NEO_5.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L6 — "Story: meeting someone" (integration dialogue)
 * Casual meet-a-friend's-friend story from taught material only.
 * One older character (Tanaka, the teacher) speaks TWO flagged です lines —
 * the Irodori register-preview device.
 * ════════════════════════════════════════════════════════════════════════ */

const L6_REVIEW = pickReviewAtoms("ja-m3-neo-6-rev", NEO_M2_POOL, 6);

export const M3_NEO_6: LessonContent = {
  id: "ja-m3-neo-6",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Story: meeting someone",
  description:
    "Mika introduces Ken to her friend Tom — and her teacher walks by. Everything you've learned, in one scene.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // Scene 1 — the introduction.
    dialogueListen({
      id: "ja-m3-neo-6-dlg-scene1",
      lines: [
        { speaker: "Mika", kana: "ケン、トムだ。ともだちだ。" },
        { speaker: "Tom", kana: "はじめまして。トムだ。" },
        { speaker: "Ken", kana: "はじめまして。ケンだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Who is Tom?",
          correctText: "Mika's friend",
          distractors: [
            "Mika's teacher",
            "Ken's teacher",
            "A stranger nobody knows",
          ],
        },
        {
          id: "q2",
          prompt: "What do Tom and Ken say to each other?",
          correctText: "Nice to meet you",
          distractors: ["Thank you", "Sorry", "It's okay"],
        },
      ],
      exercisedAtomKanas: ["ともだち", "はじめまして"],
    }),
    sentenceMcq({
      id: "ja-m3-neo-6-mcq-first-words",
      prompt: "Ken meets Tom for the first time. What does he say first?",
      correctKana: "はじめまして",
      distractorsKana: ["だいじょうぶ", "すみません", "そうだ。"],
      exercisedAtomKanas: ["はじめまして"],
    }),
    speaking(
      "ja-m3-neo-6-speak-hajimemashite",
      "はじめまして。ケンだ",
      "Nice to meet you. I'm Ken.",
      ["はじめまして"],
    ),
    // Scene 2 — asking about Tom.
    dialogueListen({
      id: "ja-m3-neo-6-dlg-scene2",
      lines: [
        { speaker: "Ken", kana: "トムは がくせい？" },
        { speaker: "Mika", kana: "うん、がくせいだ。わたしも がくせいだ。" },
        { speaker: "Ken", kana: "そう？" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Is Tom a student?",
          correctText: "Yes — and Mika is too",
          distractors: [
            "Yes — but Mika isn't",
            "No — he's a teacher",
            "Nobody knows",
          ],
        },
        {
          id: "q2",
          prompt: "Ken replies そう？ — what is he doing?",
          correctText: "Reacting: 'oh, really?'",
          distractors: [
            "Saying no",
            "Asking Tom's name",
            "Apologizing",
          ],
        },
      ],
      exercisedAtomKanas: ["がくせい", "うん", "そう", "も"],
    }),
    build(
      "ja-m3-neo-6-build-tomu",
      "Build this sentence: Tom is a student.",
      "トムは がくせいだ",
      ["トム", "は", "がくせい", "だ", "せんせい"],
      ["トム", "は", "がくせい", "だ"],
      ["がくせい", "は"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-6-lc-un-gakusei",
      audioText: "うん、がくせいだ。",
      question: "Mika's reply to Ken — what is she saying?",
      correctMeaningEn: "Yeah, he's a student.",
      distractorsEn: [
        "No, he's a teacher.",
        "Is he a student?",
        "He's a student too.",
      ],
      exercisedAtomKanas: ["うん", "がくせい"],
    }),
    build(
      "ja-m3-neo-6-build-mika-mo",
      "Build this sentence: I'm a student too.",
      "わたしも がくせいだ",
      ["わたし", "も", "は", "がくせい", "だ"],
      ["わたし", "も", "がくせい", "だ"],
      ["わたし", "がくせい", "も"],
    ),
    // Scene 3 — the teacher walks by: TWO flagged です lines.
    dialogueListen({
      id: "ja-m3-neo-6-dlg-scene3",
      lines: [
        { speaker: "Mika", kana: "せんせいだ。" },
        { speaker: "Tanaka", kana: "はじめまして。たなかです。" },
        { speaker: "Tanaka", kana: "せんせいです。" },
      ],
      questions: [
        {
          id: "q1",
          prompt:
            "Tanaka says たなかです — with です, not だ. Why the different ending?",
          correctText:
            "です is the polite layer — same meaning as だ, more formal (you'll learn it soon)",
          distractors: [
            "です makes it a question",
            "です means 'teacher'",
            "です makes it past tense",
          ],
          explanation:
            "Polite layer, coming soon: older people and staff wrap statements in です. Just recognize it for now — your own sentences stay plain.",
        },
        {
          id: "q2",
          prompt: "What did Tanaka tell them?",
          correctText: "His name — he's Tanaka, the teacher",
          distractors: [
            "He's a student",
            "He's Tom's friend",
            "He's leaving",
          ],
        },
      ],
      exercisedAtomKanas: ["せんせい", "はじめまして"],
    }),
    // Ask-a-question build (was a pick-the-sentence MCQ — invariant 28:
    // full-sentence recognition is test-out only). Placed after Scene 3 so
    // it doesn't sit adjacent to the two builds above.
    build(
      "ja-m3-neo-6-build-ask-like-ken",
      "Build this sentence: Is Tom a student?",
      "トムは がくせい？",
      ["トム", "は", "がくせい", "？", "だ", "も"],
      ["トム", "は", "がくせい", "？"],
      ["がくせい", "は"],
    ),
    // です second exposure — flagged recognition.
    listeningCompSentence({
      id: "ja-m3-neo-6-lc-desu-recognition",
      audioText: "せんせいです。",
      correctMeaningEn: "(I) am a teacher.",
      distractorsEn: [
        "(I) am a student.",
        "Is (he) a teacher?",
        "(He) is a friend.",
      ],
      explanation:
        "That's たなか's polite です again — same meaning as せんせいだ, more distance. Recognition only for now.",
      exercisedAtomKanas: ["せんせい"],
    }),
    speaking(
      "ja-m3-neo-6-speak-tomu-tomodachi",
      "トムは ともだちだ",
      "Tom is a friend.",
      ["ともだち"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-6-lc-mika-mo",
      audioText: "ミカも がくせいだ。",
      question: "Retell the story: what do we know about Mika?",
      correctMeaningEn: "Mika is a student too.",
      distractorsEn: [
        "Mika is the teacher.",
        "Mika is Tom's sister.",
        "Only Mika is a student.",
      ],
      exercisedAtomKanas: ["がくせい", "も"],
    }),
    translateStep({
      id: "ja-m3-neo-6-tr-mika",
      promptEn: "Translate: Mika is a friend.",
      acceptedAnswers: [
        "ミカは ともだちだ",
        "ミカはともだちだ",
        "ミカは ともだち",
        "ミカはともだち",
      ],
      audioText: "ミカは ともだちだ",
      exercisedAtomKanas: ["ともだち"],
    }),
    speaking(
      "ja-m3-neo-6-speak-mika-mo",
      "ミカも がくせいだ",
      "Mika is a student too.",
      ["がくせい"],
    ),
    listeningBuildSentence({
      id: "ja-m3-neo-6-lbs-sensei",
      target: "せんせいは にほんじんだ",
      tiles: ["せんせい", "は", "も", "にほんじん", "だ"],
      correctOrder: ["せんせい", "は", "にほんじん", "だ"],
      promptEn: "The teacher is Japanese.",
      exercisedAtomKanas: ["せんせい", "は"],
    }),
    // Review tail — M2 atoms.
    speaking(
      "ja-m3-neo-6-rev-speak",
      L6_REVIEW[0].kana,
      L6_REVIEW[0].meaningEn,
      [L6_REVIEW[0].kana],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-6-rev-lc",
      audioText: L6_REVIEW[1].kana,
      question: "What did you hear?",
      correctMeaningEn: L6_REVIEW[1].meaningEn,
      distractorsEn: [
        L6_REVIEW[2].meaningEn,
        L6_REVIEW[3].meaningEn,
        NEO_M1_POOL[0].meaningEn,
      ],
      exercisedAtomKanas: [L6_REVIEW[1].kana],
    }),
    vocabMcq("ja-m3-neo-6-rev-mcq", L6_REVIEW[2], NEO_M2_POOL),
    listeningBuildWord(
      "ja-m3-neo-6-rev-lb-denwa",
      "でんわ",
      "telephone",
      ["で", "ん", "わ"],
      ["て", "れ", "ね"],
    ),
    vocabMcq("ja-m3-neo-6-rev-mcq-2", L6_REVIEW[4], NEO_M2_POOL),
    reviewMatchPairs("ja-m3-neo-6-rev", L6_REVIEW),
  ],
};

assertNoSameAnswerCluster(M3_NEO_6.steps);
assertNoConsecutiveSame(M3_NEO_6.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L7 — mixed review
 * All concepts, ALL-NEW sentences (no earlier audioText reused verbatim),
 * ≥60% sentence-context steps.
 * ════════════════════════════════════════════════════════════════════════ */

const L7_REVIEW = pickReviewAtoms("ja-m3-neo-review-rev", NEO_M1_M2_POOL, 6);

export const M3_NEO_REVIEW: LessonContent = {
  id: "ja-m3-neo-review",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Plain sentences — review",
  description:
    "Everything from だ to だいじょうぶ, with all-new sentences: statements, spotlights, 'too', voice-questions, and the survival phrases.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    listeningCompSentence({
      id: "ja-m3-neo-rev-lc-hoshi",
      audioText: "ほしだ。",
      question: "What does this mean?",
      correctMeaningEn: "It's a star.",
      distractorsEn: ["It's the moon.", "It's the sky.", "It's snow."],
      exercisedAtomKanas: ["ほし"],
    }),
    build(
      "ja-m3-neo-rev-build-tsuki",
      "Build this sentence: It's the moon.",
      "つきだ",
      ["つき", "ほし", "だ"],
      ["つき", "だ"],
      ["つき"],
    ),
    cloze(
      "ja-m3-neo-rev-cloze-wa",
      "ゆき",
      " みずだ。",
      "は",
      ["は", "も", "か", "の"],
      "Snow is water.",
      "ゆきは みずだ。",
      "One spotlight, one comment — a plain statement about snow.",
    ),
    speaking(
      "ja-m3-neo-rev-speak-hoshi",
      "ほしだ",
      "It's a star.",
      ["ほし"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-rev-lc-yama",
      audioText: "やまだ。",
      question: "What does this mean?",
      correctMeaningEn: "It's a mountain.",
      distractorsEn: ["It's a river.", "It's the sea.", "It's a boat."],
      exercisedAtomKanas: ["やま"],
    }),
    cloze(
      "ja-m3-neo-rev-cloze-mo",
      "ねこは かぞくだ。いぬ",
      " かぞくだ。",
      "も",
      ["も", "は", "の", "か"],
      "Cats are family. Dogs are family too.",
      "ねこは かぞくだ。いぬも かぞくだ。",
      "Dogs join the same club as cats — same comment, so 'too.'",
    ),
    build(
      "ja-m3-neo-rev-build-mika",
      "Build this sentence: Mika is Japanese too.",
      "ミカも にほんじんだ",
      ["ミカ", "も", "は", "にほんじん", "だ"],
      ["ミカ", "も", "にほんじん", "だ"],
      ["にほんじん", "も"],
    ),
    sentenceMcq({
      id: "ja-m3-neo-rev-mcq-ask-yuki",
      prompt: "Ask your friend if it's snow — voice rising.",
      correctKana: "ゆき？",
      distractorsKana: ["ゆきだ。", "ゆきも。", "ほし？"],
      exercisedAtomKanas: ["ゆき"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-rev-lc-tone",
      audioText: "ともだち？",
      question: "Telling or asking?",
      correctMeaningEn: "A friend (of yours)?",
      distractorsEn: [
        "(he's) a friend.",
        "A teacher?",
        "(he's) a teacher.",
      ],
      exercisedAtomKanas: ["ともだち"],
    }),
    build(
      "ja-m3-neo-rev-build-ken",
      "Build this sentence: Ken is a friend.",
      "ケンは ともだちだ",
      ["ケン", "は", "も", "ともだち", "だ"],
      ["ケン", "は", "ともだち", "だ"],
      ["ともだち", "は"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-rev-lc-un",
      audioText: "うん、ともだちだ。",
      question: "What does this mean?",
      correctMeaningEn: "Yeah, (he's) a friend.",
      distractorsEn: [
        "No, (he's) a stranger.",
        "Is he a friend?",
        "That's my teacher.",
      ],
      exercisedAtomKanas: ["うん", "ともだち"],
    }),
    cloze(
      "ja-m3-neo-rev-cloze-wa-2",
      "たなかは せんせいだ。ケン",
      " がくせいだ。",
      "は",
      ["は", "も", "が", "の"],
      "Tanaka is a teacher. Ken is a student.",
      "たなかは せんせいだ。ケンは がくせいだ。",
      "Different comments — Ken isn't joining Tanaka's group, so a fresh spotlight.",
    ),
    speaking(
      "ja-m3-neo-rev-speak-ken",
      "ケンも がくせいだ",
      "Ken is a student too.",
      ["がくせい"],
    ),
    sentenceMcq({
      id: "ja-m3-neo-rev-mcq-bump",
      prompt: "You step on a stranger's foot on the bus. What do you say?",
      correctKana: "すみません",
      distractorsKana: ["だいじょうぶ", "はじめまして", "ありがとう"],
      exercisedAtomKanas: ["すみません"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-rev-lc-sou",
      audioText: "そう、せんせいだ。",
      question: "What does this mean?",
      correctMeaningEn: "Right — (she's) the teacher.",
      distractorsEn: [
        "No — (she's) a student.",
        "Who is the teacher?",
        "(She's) a teacher too.",
      ],
      exercisedAtomKanas: ["そう", "せんせい"],
    }),
    translateStep({
      id: "ja-m3-neo-rev-tr-shashin",
      promptEn: "Translate: It's a photo.",
      acceptedAnswers: ["しゃしんだ", "しゃしん", "しゃしんだ。", "しゃしん。"],
      audioText: "しゃしんだ",
      exercisedAtomKanas: ["しゃしん"],
    }),
    sentenceMcq({
      id: "ja-m3-neo-rev-mcq-thanks",
      prompt: "Your close friend hands you their umbrella. Casual thanks?",
      correctKana: "ありがとう",
      distractorsKana: ["ありがとうございます", "ごめんなさい", "うん"],
      explanation:
        "Short form for people close to you; the long form keeps polite distance with strangers.",
    }),
    listeningCompSentence({
      id: "ja-m3-neo-rev-lc-desu",
      audioText: "がくせいです。",
      correctMeaningEn: "(I'm) a student.",
      distractorsEn: [
        "(I'm) a teacher.",
        "Are you a student?",
        "(I'm) a friend.",
      ],
      explanation:
        "The polite です again — same meaning as がくせいだ, more distance. Still recognition-only; production comes with its own module.",
      exercisedAtomKanas: ["がくせい"],
    }),
    listeningBuildSentence({
      id: "ja-m3-neo-rev-lbs-umi",
      target: "うみは みずだ",
      tiles: ["うみ", "は", "みず", "だ", "も"],
      correctOrder: ["うみ", "は", "みず", "だ"],
      promptEn: "The sea is water.",
      exercisedAtomKanas: ["うみ", "みず"],
    }),
    reviewMatchPairs("ja-m3-neo-review", L7_REVIEW),
  ],
};

assertNoSameAnswerCluster(M3_NEO_REVIEW.steps);
assertAnswerRotation(M3_NEO_REVIEW.steps, 2);
assertNoConsecutiveSame(M3_NEO_REVIEW.steps);

/** All seven pilot lessons, deep-link order. */
export const M3_NEO_LESSONS: LessonContent[] = [
  M3_NEO_1,
  M3_NEO_2,
  M3_NEO_3,
  M3_NEO_4,
  M3_NEO_5,
  M3_NEO_6,
  M3_NEO_REVIEW,
];
