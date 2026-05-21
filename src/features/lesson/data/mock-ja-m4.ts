/**
 * M4 — Things & people (density rebuild 2026-05-18).
 *
 * Spencer's spec: ≤2 new grammar concepts per module. M4 introduces:
 *   - の (possession + "kind of" particle)
 *   - これ / それ / あれ / どれ (the こそあど pointer system)
 *
 * No new particle beyond の; reuses M3's です + か + は in every drill so
 * the grammar compounds. M3 + M2 + M1 atoms surface in the review tails
 * per spec §3 compounding-review rule (≥0.25 review ratio per sub-lesson,
 * pulling from prior modules only).
 *
 * 2026-05-18 rebuild (per docs/m3-m7-rebuild-spec-2026-05-18.md):
 *   - Densified to 14-20 steps per sub-lesson (was 5-9).
 *   - ≥1 generation step per sub-lesson (translate / build / listening_build
 *     / speaking); ≥5 distinct step types; no two adjacent same-type.
 *   - Compounding review ≥0.25 ratio per sub-lesson drawing from
 *     M3_M7_REVIEW_POOL filtered to {m1, m2, m3} atoms.
 *   - ≥1 self_explanation_mcq per grammar-drill sub-lesson (M4-2, M4-4,
 *     M4-5 — sub-lessons that introduce or drill の / pointers).
 *   - Answer-rotation guarantor on every cloze run (kills the M3-5
 *     「は か は か」-style anti-pattern). assertNoSameAnswerCluster
 *     called per sub-lesson at module load.
 *   - 8-lesson ID list preserved (mockCourse.ts + 2 test files reference
 *     ja-m4-1..ja-m4-8 by id). The spec's "7 sub-lessons" target collapses
 *     to 7 dense content lessons + 1 row test = 8 — chosen over scope-
 *     widening into mockCourse.ts + tests (spec §9 + §12.1 mandate
 *     preserving externally-referenced ids).
 *
 * Lesson list (8 lessons):
 *   M4-1  Everyday objects (densified — 5 objects + review tail)
 *   M4-2  の — possession + "kind of" (Grammar Rule + rotating drills +
 *         self-explanation)
 *   M4-3  More objects + の in context (vocab + interleaved retrieval)
 *   M4-4  これ / それ / あれ / どれ (Grammar Rule + drills + self-explanation)
 *   M4-5  Interleaved drill — の + pointers + は (rotating answers +
 *         self-explanation)
 *   M4-6  Sentence Build — production across modes
 *   M4-7  Mini-dialogue — at a friend's place + cumulative review
 *   M4-8  Row test (mastery ★)
 */
import type { LessonContent } from "../types";
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
  vocab,
  vocabMcq,
  assertNoSameAnswerCluster,
  assertAnswerRotation,
  assertNoConsecutiveSame,
  slotFor,
} from "./_jaGrammarHelpers";
import type {
  BuildSentenceStep,
  MatchPairsStep,
  MultipleChoiceStep,
  RowTestItem,
  RowTestStep,
} from "../types";

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// Per-sub-lesson review-atom draws. Seeded by lesson id so each sub-lesson
// gets a stable but distinct subset across re-runs. Pool is M1 + M2 + M3
// (M4 is the module being authored — can't review itself).
// ───────────────────────────────────────────────────────────────────────
// withoutMcqBlocked: drops audit-deferred kana (あなた/あに/あね/ちち/はは/
// あります/います/こえ — image-MCQ-unsafe per docs/emoji-blocked-words-2026-05-18.md)
// from MCQ pools so vocabMcq never lands on a misleading visual cue.
const M4_REVIEW_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter(
    (a) => a.fromModule === "m1" || a.fromModule === "m2" || a.fromModule === "m3",
  ),
);
const M4_REVIEW_M1_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1"),
);
const M4_REVIEW_M2_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2"),
);
const M4_REVIEW_M3_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m3"),
);

// ----- M4-1 — Everyday objects (densified vocab drop + review tail) -------

const M4_1_REVIEW = pickReviewAtoms("ja-m4-1-rev", M4_REVIEW_M3_POOL, 5);

export const M4_1: LessonContent = {
  id: "ja-m4-1",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Everyday objects",
  description:
    "Five concrete nouns you'll point at every day. Two katakana sprinkles + immediate retrieval + M3 review tail.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m4-1-info-open",
      "Object pool",
      "Five concrete objects — three hiragana, two katakana (ペン, カメラ). Each one comes with immediate retrieval so the shapes + meanings stick on the first encounter.",
    ),
    // ── Atom intros with interleaved retrieval (R3 alternation). ──
    vocab(
      "ja-m4-1-v-pen",
      "Pen",
      "pen",
      "ペン",
      "Katakana loanword. ペン is one of the shortest foreign borrowings — just two katakana.",
    ),
    // Listening break + immediate retrieval on the just-introduced atom.
    listeningCompSentence({
      id: "ja-m4-1-lc-pen",
      audioText: "ペン",
      correctMeaningEn: "pen",
      distractorsEn: ["camera", "book", "bag"],
    }),
    // Visual MCQ on ペン — gives the bare noun its second non-cloze surface
    // so the atom-coverage floor (n≥3) holds before the cloze tap below.
    vocabMcq(
      "ja-m4-1-mcq-pen",
      { kana: "ペン", meaningEn: "pen", emoji: "🖊️", fromModule: "m4" },
      M4_REVIEW_M3_POOL,
    ),
    vocab(
      "ja-m4-1-v-kaban",
      "Bag",
      "kaban",
      "かばん",
      "Generic for any handbag, backpack, or briefcase.",
    ),
    // Visual MCQ on the just-introduced atom — emoji + distractors from M3.
    vocabMcq(
      "ja-m4-1-mcq-kaban",
      { kana: "かばん", meaningEn: "bag", emoji: "👜", fromModule: "m4" },
      M4_REVIEW_M3_POOL,
    ),
    vocab("ja-m4-1-v-kuruma", "Car", "kuruma", "くるま"),
    // Listening break before the next phrase_card cluster (R3 interleave).
    listeningCompSentence({
      id: "ja-m4-1-lc-kuruma",
      audioText: "くるま",
      correctMeaningEn: "car",
      distractorsEn: ["camera", "bag", "pen"],
    }),
    vocab(
      "ja-m4-1-v-kamera",
      "Camera",
      "kamera",
      "カメラ",
      "Notice カ here is the same shape as in カメラ — angular twin of hiragana か.",
    ),
    // Production break (speaking) — hard direction on a new katakana atom.
    speaking("ja-m4-1-speak-kamera", "カメラ", "Camera"),
    vocab(
      "ja-m4-1-v-keitai",
      "Mobile phone",
      "keitai",
      "けいたい",
      "Literally 'portable.' Sometimes written ケータイ in katakana for emphasis.",
    ),
    // Pattern preview cloze: M3 grammar (は + です) on a fresh M4 noun.
    // Single の-free cloze keeps the answer rotation honest — の lands next.
    cloze(
      "ja-m4-1-cloze-preview-1",
      "これ",
      " ペンです。",
      "は",
      ["は", "が", "を", "に"],
      "This is a pen.",
      "これは ペンです。",
      "Pure M3 reinforcement on a new M4 noun — は marks the topic (this), です asserts.",
    ),
    // sentenceMcq break — discriminate two new vocab on an M3 sentence-pattern.
    sentenceMcq({
      id: "ja-m4-1-mcq-discriminate",
      prompt: "Which sentence means 'This is a bag.'?",
      correctKana: "これは かばんです。",
      distractorsKana: [
        "これは カメラです。",
        "これは くるまです。",
        "これは ペンです。",
      ],
      explanation:
        "かばん = bag. The three distractors are the other new objects in this lesson.",
    }),
    // Second cloze — keeps the answer-rotation gate honest (か vs は).
    cloze(
      "ja-m4-1-cloze-preview-2",
      "これは カメラです",
      "。",
      "か",
      ["か", "は", "の", "を"],
      "Is this a camera?",
      "これは カメラですか。",
      "M3 review — か at the end turns a statement into a question.",
    ),
    // Production: build_sentence on the new vocab.
    build(
      "ja-m4-1-build-keitai",
      "Say: This is a mobile phone.",
      "これは けいたいです",
      ["これ", "は", "けいたい", "です", "それ", "ペン"],
      ["これ", "は", "けいたい", "です"],
    ),
    // ── Review tail (M3 atoms — the freshest layer). ──
    // Visual MCQ on an M3 person-word + listening on an M3 object.
    vocabMcq("ja-m4-1-rev-mcq-m3-1", M4_1_REVIEW[0], M4_REVIEW_M3_POOL),
    listeningCompSentence({
      id: "ja-m4-1-rev-lc-m3-1",
      audioText: M4_1_REVIEW[1].kana,
      correctMeaningEn: M4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_1_REVIEW[2].meaningEn,
        M4_1_REVIEW[3].meaningEn,
        M4_1_REVIEW[4].meaningEn,
      ],
    }),
    // Tile-bank build — hard direction on a new M4 noun + M3 grammar.
    // Lands after step 12 per the "hard direction last" rule.
    build(
      "ja-m4-1-translate-car",
      "Is this a car?",
      "これは くるまですか",
      ["これ", "は", "くるま", "です", "か", "それ", "かばん"],
      ["これ", "は", "くるま", "です", "か"],
    ),
    reviewMatchPairs("ja-m4-1-rev", M4_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m4-1-info-end",
      "Five objects in hand",
      "You can now name and ask about five everyday objects. Next: の, the particle that lets you say whose object it is.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_1.steps);
assertAnswerRotation(M4_1.steps, 2);
assertNoConsecutiveSame(M4_1.steps);

// ----- M4-2 — の — possession + "kind of" (Grammar Rule + drills) ---------

const RULE_NO = grammarRule({
  id: "ja-m4-2-rule-no",
  title: "の — the 'kind of' particle",
  rule:
    "の sits between two nouns and means 'the [LEFT] kind of [RIGHT].' Most often this maps to English possessive 's (わたしのほん = my book). But the deeper pattern is broader: にほんのくるま = a Japanese car (Japan-kind-of car).",
  examples: [
    {
      ja: "わたしの ほんです。",
      romaji: "watashi no hon desu.",
      en: "It's my book. (the me-kind of book)",
    },
    {
      ja: "にほんの くるまです。",
      romaji: "nihon no kuruma desu.",
      en: "It's a Japanese car. (the Japan-kind of car)",
    },
  ],
  antiPattern: {
    ja: "わたし ほんです。",
    romaji: "watashi hon desu.",
    en: "(broken — missing の reads as 'I book')",
    why: "Without の the two nouns just sit next to each other and the relationship is ambiguous. の glues them: わたし + の + ほん = my book.",
  },
  cultureNote:
    "If you can rephrase the English as 'the X kind of Y,' の works. If not (verb phrases, time expressions), you need a different particle.",
});

const M4_2_REVIEW = pickReviewAtoms("ja-m4-2-rev", M4_REVIEW_M2_POOL, 4);

export const M4_2: LessonContent = {
  id: "ja-m4-2",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "の — possession and 'kind of'",
  description:
    "The particle that glues two nouns. Possession is the most common use; the deeper pattern is 'kind of.' Drilled with rotating distractors + self-explanation.",
  estimatedMinutes: 11,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m4-2-info-open",
      "One particle, two flavors",
      "の glues nouns. Most of the time it means possessive 's. But it also means 'the X kind of Y' — same particle, broader pattern. You'll drill the possessive reading first; the 'kind-of' reading lands at the end.",
    ),
    RULE_NO,
    // ── Drill cluster: clozes rotated with breaks (R3 interleave).
    // selfExplain intentionally NOT after the first cloze — it lands at the
    // N-1 position of the drill cluster (after 3+ commits) per CLT
    // expertise-reversal (M3-M7 spec §3.2).
    cloze(
      "ja-m4-2-cloze-1",
      "わたし",
      " かばんです。",
      "の",
      ["の", "は", "が", "を"],
      "It's my bag.",
      "わたしの かばんです。",
      "わたし + の + かばん = my bag. The full sentence has です to politely assert.",
    ),
    // listening break — meaning recall on a possession sentence (R3 break
    // between two clozes whose correct answer is の).
    listeningCompSentence({
      id: "ja-m4-2-lc-watashi",
      audioText: "わたしの ほんです",
      correctMeaningEn: "It's my book.",
      distractorsEn: [
        "It's the teacher's book.",
        "Is it your book?",
        "This is a book.",
      ],
    }),
    cloze(
      "ja-m4-2-cloze-2",
      "せんせい",
      " ほんです。",
      "の",
      ["は", "の", "に", "を"],
      "It's the teacher's book.",
      "せんせいの ほんです。",
      "せんせい + の + ほん = teacher-kind-of book = the teacher's book.",
    ),
    // sentenceMcq break — discriminate between possessive (の) and topic (は).
    sentenceMcq({
      id: "ja-m4-2-mcq-discriminate",
      prompt: "Which sentence means 'My friend is a teacher.'?",
      correctKana: "ともだちは せんせいです。",
      distractorsKana: [
        "ともだちの せんせいです。",
        "ともだちは せんせいですか。",
        "ともだちの せんせいですか。",
      ],
      explanation:
        "は marks the topic ('as for my friend, [is] a teacher'). の would mean 'my friend's teacher' — a different sentence.",
    }),
    cloze(
      "ja-m4-2-cloze-3",
      "ともだち",
      " ペンです。",
      "の",
      ["は", "の", "を", "に"],
      "It's my friend's pen.",
      "ともだちの ペンです。",
      "ともだち + の + ペン = my friend's pen.",
    ),
    // Listening break — meaning recall between the cloze block and the
    // rotating answer cloze (avoids 3 adjacent particle_cloze steps).
    listeningCompSentence({
      id: "ja-m4-2-lc-bridge",
      audioText: "ともだちの くるまです",
      correctMeaningEn: "It's my friend's car.",
      distractorsEn: [
        "It's my car.",
        "It's the teacher's car.",
        "Is it my friend's car?",
      ],
    }),
    // M3 review tap — alternate answer (は), keeps the cloze cluster
    // rotating instead of streaking on の.
    cloze(
      "ja-m4-2-cloze-ha-review",
      "せんせい",
      " くるまです。",
      "は",
      ["は", "の", "が", "を"],
      "As for the teacher, [the topic is] a car.",
      "せんせいは くるまです。",
      "M3 review: は as topic marker. Two same-particle-correct clozes in a row would let you fish; rotating to は forces you to read the sentence.",
    ),
    // Speaking break before the kind-of cloze — breaks the same-type
    // adjacency that would otherwise stack 3 particle_cloze steps.
    speaking(
      "ja-m4-2-speak-tomodachi",
      "ともだちの ペンです",
      "It's my friend's pen.",
    ),
    // "kind of" reading drill — different semantic, same particle.
    cloze(
      "ja-m4-2-cloze-4",
      "にほん",
      " くるまです。",
      "の",
      ["は", "の", "が", "に"],
      "It's a Japanese car.",
      "にほんの くるまです。",
      "Origin/kind reading: 'Japan-kind-of car' = a Japanese car. Same particle, broader use.",
    ),
    // ── N-1 selfExplain — fires AFTER 5 cloze commits so the schema is
    //    consolidated enough for productive reflection (CLT expertise
    //    reversal: too-early metacognition splits attention). Surface
    //    distractor is "true-but-wrong rule" per wave-4B brief — collapses
    //    の's meaning to compound-noun formation, which a learner could
    //    plausibly believe after only seeing possessive surface forms. ──
    selfExplain({
      id: "ja-m4-2-self-no",
      anchorLabel: "You picked の in: にほん＿ くるま",
      anchorAudioText: "にほんの くるま",
      question: "What's the rule that makes の correct in BOTH 'わたしの かばん' and 'にほんの くるま'?",
      rule: {
        text: "の puts the LEFT noun in a 'kind/source' relationship to the RIGHT noun.",
      },
      surface: {
        text: "の links two nouns into a single compound noun.",
      },
      distractor: {
        text: "の marks the topic of the sentence, like は does.",
      },
      ruleExplanation:
        "の sets up an L-kind-of-R relationship — possession (my-kind-of bag) is just the most common case. It does NOT fuse the nouns into a compound (にほんくるま would be wrong); the two nouns stay separate, with の signaling the relation. And の is never the topic marker — that's always は.",
    }),
    // Production: build_sentence with possession structure.
    build(
      "ja-m4-2-build-watashi-pen",
      "Say: It's my pen.",
      "わたしの ペンです",
      ["わたし", "の", "ペン", "です", "せんせい", "ともだち"],
      ["わたし", "の", "ペン", "です"],
    ),
    // Tile-bank production check — harder direction.
    build(
      "ja-m4-2-translate-teacher-book",
      "It's the teacher's book.",
      "せんせいの ほんです",
      ["せんせい", "の", "ほん", "です", "わたし", "ともだち"],
      ["せんせい", "の", "ほん", "です"],
    ),
    // Speaking — final hard-direction lock on the most-common possessive form.
    speaking(
      "ja-m4-2-speak-final",
      "わたしの ペンです",
      "It's my pen.",
    ),
    // ── Review tail (M2 atoms — the previous layer; fresh visual + listening). ──
    vocabMcq("ja-m4-2-rev-mcq-m2", M4_2_REVIEW[0], M4_REVIEW_M2_POOL),
    listeningCompSentence({
      id: "ja-m4-2-rev-lc-m2",
      audioText: M4_2_REVIEW[1].kana,
      correctMeaningEn: M4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_2_REVIEW[2].meaningEn,
        M4_2_REVIEW[3].meaningEn,
        M4_REVIEW_M1_POOL[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-2-rev-mcq-m1", M4_REVIEW_M1_POOL[2], M4_REVIEW_M1_POOL),
    // M3 cumulative cloze — reuses M3's question particle on a fresh M4 noun.
    cloze(
      "ja-m4-2-rev-cloze-ka",
      "わたしの ペンです",
      "。",
      "か",
      ["か", "は", "の", "を"],
      "Is it my pen?",
      "わたしの ペンですか。",
      "M3 review: か ends a question. M4's possessive structure inside the question is now natural.",
    ),
    listeningCompSentence({
      id: "ja-m4-2-rev-lc-m1",
      audioText: M4_REVIEW_M1_POOL[3].kana,
      correctMeaningEn: M4_REVIEW_M1_POOL[3].meaningEn,
      distractorsEn: [
        M4_REVIEW_M1_POOL[4].meaningEn,
        M4_REVIEW_M1_POOL[5].meaningEn,
        M4_REVIEW_M1_POOL[6].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m4-2-rev", M4_2_REVIEW),
    infoStep(
      "ja-m4-2-info-end",
      "You can say whose it is",
      "Seven drills + self-explanation + production: noun + の + noun. You can now tell people which things are yours, your friend's, the teacher's — half of small-talk.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_2.steps);
assertAnswerRotation(M4_2.steps, 2);
assertNoConsecutiveSame(M4_2.steps);

// ----- M4-3 — More objects + の in context --------------------------------

const M4_3_REVIEW = pickReviewAtoms("ja-m4-3-rev", M4_REVIEW_M1_POOL, 5);

export const M4_3: LessonContent = {
  id: "ja-m4-3",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "More objects + の in context",
  description:
    "Five more vocab words, each immediately worked into a の sentence. M1 review tail.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m4-3-info-open",
      "Vocab + immediate use",
      "Five more concrete objects. Each one shows up in a sample possessive sentence so の sticks. Listening + visual MCQ interleaved so the shapes stay fresh.",
    ),
    // ── Atom intros (5 new objects) with retrieval breaks ──
    vocab("ja-m4-3-v-kasa", "Umbrella", "kasa", "かさ"),
    // Visual MCQ retrieval on the just-introduced atom; distractors from M3.
    vocabMcq(
      "ja-m4-3-mcq-kasa",
      { kana: "かさ", meaningEn: "umbrella", emoji: "☂️", fromModule: "m4" },
      M4_REVIEW_M3_POOL,
    ),
    vocab(
      "ja-m4-3-v-jisho",
      "Dictionary",
      "jisho",
      "じしょ",
      "Mostly digital now, but the word survives for the app/site.",
    ),
    // Listening break — meaning recall on the new vocab.
    listeningCompSentence({
      id: "ja-m4-3-lc-jisho",
      audioText: "じしょ",
      correctMeaningEn: "dictionary",
      distractorsEn: ["letter", "book", "magazine"],
    }),
    vocab("ja-m4-3-v-isu", "Chair", "isu", "いす"),
    // Listening break — meaning recall on the just-introduced atom (avoids
    // 2 adjacent phrase_card steps).
    listeningCompSentence({
      id: "ja-m4-3-lc-isu",
      audioText: "いす",
      correctMeaningEn: "chair",
      distractorsEn: ["bicycle", "letter", "umbrella"],
    }),
    vocab(
      "ja-m4-3-v-tegami",
      "Letter (postal)",
      "tegami",
      "てがみ",
      "Less common than email, but still the formal way to thank a host family.",
    ),
    // Speaking break — hard direction on the just-introduced atom.
    speaking("ja-m4-3-speak-tegami", "てがみ", "Letter (postal)"),
    vocab(
      "ja-m4-3-v-jitensha",
      "Bicycle",
      "jitensha",
      "じてんしゃ",
      "Tokyo runs on these for short errands.",
    ),
    // ── の drills using the new vocab — rotating distractors. ──
    cloze(
      "ja-m4-3-cloze-1",
      "これは わたし",
      " かさです。",
      "の",
      ["の", "は", "が", "を"],
      "This is my umbrella.",
      "これは わたしの かさです。",
      "Two particles in one sentence: は marks the topic (this), の glues わたし + かさ.",
    ),
    // listening break between clozes.
    listeningCompSentence({
      id: "ja-m4-3-lc-sentence",
      audioText: "せんせいの じしょです",
      correctMeaningEn: "It's the teacher's dictionary.",
      distractorsEn: [
        "It's my dictionary.",
        "It's the teacher's book.",
        "Is it the teacher's dictionary?",
      ],
    }),
    cloze(
      "ja-m4-3-cloze-2",
      "せんせい",
      " じしょです。",
      "の",
      ["の", "は", "が", "に"],
      "It's the teacher's dictionary.",
      "せんせいの じしょです。",
    ),
    // Production break — build_sentence with two-particle structure.
    build(
      "ja-m4-3-build-friend-bike",
      "Ask: Is it your friend's bicycle?",
      "ともだちの じてんしゃですか",
      ["ともだち", "の", "じてんしゃ", "です", "か", "わたし", "じしょ"],
      ["ともだち", "の", "じてんしゃ", "です", "か"],
    ),
    cloze(
      "ja-m4-3-cloze-3",
      "ともだち",
      " じてんしゃですか。",
      "の",
      ["の", "は", "を", "が"],
      "Is it your friend's bicycle?",
      "ともだちの じてんしゃですか。",
    ),
    // Listening on a third じてんしゃです usage — pushes the compound atom
    // above the n=3 review-floor (was n=2 in M4-3 alone).
    listeningCompSentence({
      id: "ja-m4-3-lc-jitensha-final",
      audioText: "わたしの じてんしゃです",
      correctMeaningEn: "It's my bicycle.",
      distractorsEn: [
        "It's your bicycle.",
        "Is it your friend's bicycle?",
        "It's the teacher's bicycle.",
      ],
    }),
    // ── Review tail (M1 atoms — the deepest layer + an M3 cloze tap). ──
    vocabMcq("ja-m4-3-rev-mcq-m1", M4_3_REVIEW[0], M4_REVIEW_M1_POOL),
    // M3 grammar cloze — reuse a prior-module sentence pattern (です + か).
    cloze(
      "ja-m4-3-rev-cloze-m3",
      "がくせいです",
      "。",
      "か",
      ["か", "は", "の", "を"],
      "Are you a student? (M3 review)",
      "がくせいですか。",
      "Review of M3's question particle. か at the end turns the statement into a question.",
    ),
    listeningCompSentence({
      id: "ja-m4-3-rev-lc-m1",
      audioText: M4_3_REVIEW[1].kana,
      correctMeaningEn: M4_3_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_3_REVIEW[2].meaningEn,
        M4_3_REVIEW[3].meaningEn,
        M4_3_REVIEW[4].meaningEn,
      ],
    }),
    // Build the cumulative possessive sentence — tile-bank, hardest
    // direction, lands after the warm-up review (post-step-12 per the
    // hard-direction-last rule).
    build(
      "ja-m4-3-translate-friend-umbrella",
      "It's my friend's umbrella.",
      "ともだちの かさです",
      ["ともだち", "の", "かさ", "です", "せんせい", "ペン"],
      ["ともだち", "の", "かさ", "です"],
    ),
    reviewMatchPairs("ja-m4-3-rev", M4_3_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m4-3-info-end",
      "You can possess any object",
      "Five more nouns, three more の sentences, production + retrieval on each. You can now say whose umbrella, dictionary, or bike. Next: pointing — これ/それ/あれ/どれ.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_3.steps);
assertAnswerRotation(M4_3.steps, 2);
assertNoConsecutiveSame(M4_3.steps);

// ----- M4-4 — これ / それ / あれ / どれ (Grammar Rule + drills) ----------

const RULE_KOSOADO = grammarRule({
  id: "ja-m4-4-rule-kosoado",
  title: "これ / それ / あれ / どれ — the four-way pointer system",
  rule:
    "Four words for the spatial 'this/that' system. これ = near me. それ = near you (the listener). あれ = far from both of us. どれ = which one (the question).",
  examples: [
    {
      ja: "これは わたしの かばんです。",
      romaji: "kore wa watashi no kaban desu.",
      en: "This (near me) is my bag.",
    },
    {
      ja: "それは なんですか。",
      romaji: "sore wa nan desu ka.",
      en: "What's that (near you)?",
    },
    {
      ja: "あれは せんせいの くるまです。",
      romaji: "are wa sensei no kuruma desu.",
      en: "That (over there) is the teacher's car.",
    },
  ],
  antiPattern: {
    ja: "これは どれですか。",
    romaji: "kore wa dore desu ka.",
    en: "(broken — 'this is which?' mixes pointer and question)",
    why: "どれ ('which one') is the question word — pair it with が marking the subject, like 'どれが あなたの ペンですか' (which is your pen?). You don't ask 'this is which.'",
  },
  cultureNote:
    "Japanese splits 'that' into two — near the listener (それ) vs far from both (あれ). English mashes them together. Pointing at something on the shop counter? それ. Pointing at a mountain in the distance? あれ.",
});

const M4_4_REVIEW = pickReviewAtoms("ja-m4-4-rev", M4_REVIEW_M3_POOL, 4);

export const M4_4: LessonContent = {
  id: "ja-m4-4",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "これ / それ / あれ / どれ",
  description:
    "Four spatial pointers — based on distance from each speaker. Drills + self-explanation + an M3 review tail.",
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m4-4-info-open",
      "Pointing precisely",
      "English collapses 'this/that' into two words. Japanese splits it into four, organized by who's closer to the thing. Drill the three pointers + the question word in mixed sentences.",
    ),
    RULE_KOSOADO,
    // ── Drill block: rotating particles + non-cloze breaks (R3). ──
    cloze(
      "ja-m4-4-cloze-1",
      "それ",
      " なんですか。",
      "は",
      ["は", "が", "を", "の"],
      "What's that (near you)?",
      "それは なんですか。",
      "それ = near the listener. Topic = that. Question = what?",
    ),
    cloze(
      "ja-m4-4-cloze-2",
      "あれは せんせい",
      " くるまです。",
      "の",
      ["は", "の", "が", "に"],
      "That (over there) is the teacher's car.",
      "あれは せんせいの くるまです。",
      "Pointer (あれ) + は as topic + possessive の linking せんせい + くるま.",
    ),
    // sentenceMcq break — discrimination between the three pointers.
    sentenceMcq({
      id: "ja-m4-4-mcq-pointer",
      prompt: "Which sentence means 'That over there is the teacher's bag.'?",
      correctKana: "あれは せんせいの かばんです。",
      distractorsKana: [
        "これは せんせいの かばんです。",
        "それは せんせいの かばんです。",
        "あれは せんせいは かばんです。",
      ],
      explanation:
        "あれ = far from both speakers. これ = near me; それ = near you. The fourth option breaks the possessive: せんせいは … makes the teacher the topic, not the owner.",
    }),
    cloze(
      "ja-m4-4-cloze-3",
      "これ",
      " あなたの ほんですか。",
      "は",
      ["は", "が", "を", "に"],
      "Is this your book?",
      "これは あなたの ほんですか。",
      "これ = near me. Topic = this. The の inside makes 'your book.'",
    ),
    // Listening break + meaning recall.
    listeningCompSentence({
      id: "ja-m4-4-lc-distant",
      audioText: "あれは ともだちの くるまです",
      correctMeaningEn: "That over there is my friend's car.",
      distractorsEn: [
        "This is my friend's car.",
        "That (near you) is the teacher's car.",
        "Is that over there my friend's car?",
      ],
    }),
    // Visual MCQ on どれ — custom SVG (which.svg, A/B/C/D grid) is the
    // audit-confident primary cue. Encodes the meaning ("which one") via
    // the grid icon BEFORE the が-cloze drill below applies it. Distractors
    // pulled from M3 atoms — concrete nouns/people contrast cleanly with
    // an abstract grid glyph so the icon's distinctiveness carries.
    vocabMcq(
      "ja-m4-4-mcq-dore",
      { kana: "どれ", meaningEn: "which one", emoji: "🤔", fromModule: "m4" },
      M4_REVIEW_M3_POOL,
    ),
    // どれ (which) drill — needs が, not は (per the antiPattern rule above).
    cloze(
      "ja-m4-4-cloze-4",
      "どれ",
      " あなたの ペンですか。",
      "が",
      ["が", "は", "の", "を"],
      "Which one is your pen?",
      "どれが あなたの ペンですか。",
      "Question words like どれ take が, not は. (You'll get the formal rule for が in M6 — for now, memorize this pairing.)",
    ),
    // selfExplain at N-1 placement (moved 2026-05-18 coordinator): now
    // fires after 6+ prior commits (cloze-1/2/3, mcq-pointer, lc, mcq-dore,
    // cloze-4) — well past CLT expertise-reversal floor (≥3 commits).
    selfExplain({
      id: "ja-m4-4-self-ha-pointer",
      anchorLabel: "You picked は in: それ＿ なんですか。",
      anchorAudioText: "それは なんですか",
      question: "Why does は (not の) follow それ here?",
      rule: {
        text: "それ is the topic of the sentence — は marks the topic.",
      },
      surface: { text: "は always follows a pointer word like それ." },
      distractor: { text: "の would also work in this sentence." },
      ruleExplanation:
        "は marks what the sentence is ABOUT — 'as for that (thing near you), what is it?' の only links two nouns (owner ↔ owned). There's no second noun here for の to attach to.",
    }),
    // Production: build_sentence with pointer + possessive.
    build(
      "ja-m4-4-build-this-mybag",
      "Say: This is my bag.",
      "これは わたしの かばんです",
      ["これ", "は", "わたし", "の", "かばん", "です", "それ", "ともだち"],
      ["これ", "は", "わたし", "の", "かばん", "です"],
    ),
    // Tile-bank production check.
    build(
      "ja-m4-4-translate-sore-pen",
      "Is that (near you) my friend's pen?",
      "それは ともだちの ペンですか",
      ["それ", "は", "ともだち", "の", "ペン", "です", "か", "これ", "わたし"],
      ["それ", "は", "ともだち", "の", "ペン", "です", "か"],
    ),
    // Second cumulative cloze — reuses カメラです so the compound atom
    // accumulates a third lesson-surface (M4-1 cloze + this + M4-6
    // listening). Adds an あれ pointer commit to keep distance-cue practice
    // varied alongside the これ/それ above.
    cloze(
      "ja-m4-4-cloze-5",
      "あれは わたし",
      " カメラです。",
      "の",
      ["の", "は", "が", "を"],
      "That over there is my camera.",
      "あれは わたしの カメラです。",
      "Pointer (あれ) + topic は + possessive の + カメラです. Three particles in one short sentence — you can parse them all now.",
    ),
    // Listening break on a くるまです usage — lifts the compound atom from
    // single-surface to ≥3 across M4 (M4-2 cloze + M4-4 cloze + this +
    // M4-5 cloze).
    listeningCompSentence({
      id: "ja-m4-4-lc-kuruma",
      audioText: "せんせいの くるまです",
      correctMeaningEn: "It's the teacher's car.",
      distractorsEn: [
        "It's my car.",
        "It's the teacher's bicycle.",
        "Is it the teacher's car?",
      ],
    }),
    // ── Review tail (M3 atoms + M3 grammar cloze — keep the M3 layer warm). ──
    vocabMcq("ja-m4-4-rev-mcq-m3", M4_4_REVIEW[0], M4_REVIEW_M3_POOL),
    // M3 grammar review — は (topic) on an M3 person noun.
    cloze(
      "ja-m4-4-rev-cloze-m3",
      "ともだち",
      " せんせいです。",
      "は",
      ["は", "の", "が", "を"],
      "My friend is a teacher. (M3 review)",
      "ともだちは せんせいです。",
      "Review of M3's は as topic marker — 'as for my friend, [is a] teacher.'",
    ),
    listeningCompSentence({
      id: "ja-m4-4-rev-lc-m3",
      audioText: M4_4_REVIEW[1].kana,
      correctMeaningEn: M4_4_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_4_REVIEW[2].meaningEn,
        M4_4_REVIEW[3].meaningEn,
        M4_REVIEW_M1_POOL[0].meaningEn,
      ],
    }),
    // Speaking on the lesson's anchor sentence — hard direction last.
    speaking(
      "ja-m4-4-speak-final",
      "これは わたしの かばんです",
      "This is my bag.",
    ),
    reviewMatchPairs("ja-m4-4-rev", M4_4_REVIEW),
    infoStep(
      "ja-m4-4-info-end",
      "You can point at anything",
      "これ near me, それ near you, あれ far from both, どれ which. Plus the question-word-takes-が pairing. You can now identify any object in the room — your stuff, their stuff, the thing way over there.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_4.steps);
assertAnswerRotation(M4_4.steps, 2);
assertNoConsecutiveSame(M4_4.steps);

// ----- M4-5 — Interleaved drill — の + pointers + は (rotating answers) --

const M4_5_REVIEW = pickReviewAtoms("ja-m4-5-rev", M4_REVIEW_M2_POOL, 4);

export const M4_5: LessonContent = {
  id: "ja-m4-5",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved drill — の + pointers + は + だれ",
  description:
    "Mixed practice across の (possession), the four pointers, M3's は, and the question word だれ. Rotating answers + self-explanation + production.",
  estimatedMinutes: 11,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m4-5-info-open",
      "Mix and match",
      "Each drill picks between particles you've now seen. No new rules — just sorting which pattern fits. Watch the answer rotate so you can't fish for a streak. New atom: だれ ('who'), the person-pointing question word.",
    ),
    // Quick だれ intro — the question word for people. Paired with の it
    // becomes 'whose' (だれの). Adds the third+ exposure of だれ across M4
    // (M4-6 mcq + M4-7 dialogue + here).
    vocab(
      "ja-m4-5-v-dare",
      "Who",
      "dare",
      "だれ",
      "Person-pointing question word. Pair with の and it becomes 'whose' (だれの ペン = whose pen).",
    ),
    // ── Rotating clozes: の → は → の → は → の → は (max 2 same-answer
    //    adjacent OK per the gate, but rotating every step). ──
    cloze(
      "ja-m4-5-cloze-1",
      "わたし",
      " かばんです。",
      "の",
      ["の", "は", "が", "を"],
      "It's my bag.",
      "わたしの かばんです。",
      "Owner + の + owned. No topic — just a flat assertion.",
    ),
    // sentenceMcq break — discriminate possessive (の) vs flat-topic (は)
    // before the next cloze (avoids 2 adjacent particle_cloze steps).
    sentenceMcq({
      id: "ja-m4-5-mcq-bridge",
      prompt: "Which sentence means 'It's the teacher's car.'?",
      correctKana: "せんせいの くるまです。",
      distractorsKana: [
        "せんせいは くるまです。",
        "せんせいの くるまですか。",
        "せんせいは くるまですか。",
      ],
      explanation:
        "の glues せんせい + くるま (possession). は would mark the teacher as the topic — a different meaning.",
    }),
    cloze(
      "ja-m4-5-cloze-2",
      "これ",
      " ともだちの ペンです。",
      "は",
      ["は", "の", "が", "を"],
      "This is my friend's pen.",
      "これは ともだちの ペンです。",
      "Two particles in one sentence: は marks the topic (this), の glues friend + pen.",
    ),
    // listening break.
    listeningCompSentence({
      id: "ja-m4-5-lc-cat-book",
      audioText: "それは ねこの ほんです",
      correctMeaningEn: "That's the cat's book.",
      distractorsEn: [
        "This is the cat's book.",
        "That over there is the cat's book.",
        "Is that the cat's book?",
      ],
    }),
    cloze(
      "ja-m4-5-cloze-3",
      "それは ねこ",
      " ほんです。",
      "の",
      ["の", "は", "が", "を"],
      "That's the cat's book.",
      "それは ねこの ほんです。",
      "ねこ + の + ほん = the cat's book. ねこ pulled from M1 — compounding review.",
    ),
    // Listening break between the two clozes that flank the だれ pivot
    // (avoids 2 adjacent particle_cloze).
    listeningCompSentence({
      id: "ja-m4-5-lc-dare-bridge",
      audioText: "だれの ペンですか",
      correctMeaningEn: "Whose pen is it?",
      distractorsEn: [
        "Which pen is it?",
        "Is it your pen?",
        "Whose car is it?",
      ],
    }),
    // ── だれ-as-question drill — uses が (matches the M4-4 question-word
    //    pattern). Adds an answer-set distinct from の/は in this cluster. ──
    cloze(
      "ja-m4-5-cloze-dare",
      "だれ",
      " せんせいですか。",
      "が",
      ["が", "は", "の", "を"],
      "Who is the teacher?",
      "だれが せんせいですか。",
      "だれ ('who') is a question word — it takes が, like どれ in M4-4. The full sentence: 'who-が teacher-です-か.'",
    ),
    // sentenceMcq break — discrimination between pointers + particles.
    sentenceMcq({
      id: "ja-m4-5-mcq-discriminate",
      prompt: "Which sentence asks 'Is that (over there) the teacher?'",
      correctKana: "あれは せんせいですか。",
      distractorsKana: [
        "あれの せんせいですか。",
        "それは せんせいですか。",
        "あれは せんせいです。",
      ],
      explanation:
        "あれ + は (topic) + statement + か (question). あれの would mean 'that one's [something]' (possession). それ is 'near you,' not 'over there.'",
    }),
    cloze(
      "ja-m4-5-cloze-4",
      "あれ",
      " せんせいですか。",
      "は",
      ["は", "の", "が", "を"],
      "Is that the teacher (over there)?",
      "あれは せんせいですか。",
      "Pointer (あれ) + topic は + question か.",
    ),
    // listening break — keeps the cluster on かさです so the compound atom
    // reaches n=3 across M4 (M4-3 + here + M4-7).
    listeningCompSentence({
      id: "ja-m4-5-lc-your-umbrella",
      audioText: "あなたの かさですか",
      correctMeaningEn: "Is it your umbrella?",
      distractorsEn: [
        "Is this your umbrella?",
        "It's your umbrella.",
        "Is that your umbrella?",
      ],
    }),
    cloze(
      "ja-m4-5-cloze-5",
      "あなた",
      " かさですか。",
      "の",
      ["の", "は", "を", "に"],
      "Is it your umbrella?",
      "あなたの かさですか。",
      "Direct possession + question.",
    ),
    // Listening on じしょです — second compound-atom surface in M4 (M4-3
    // cloze + here + row test surface lifts it to n=3).
    listeningCompSentence({
      id: "ja-m4-5-lc-friend-dict",
      audioText: "ともだちの じしょです",
      correctMeaningEn: "It's my friend's dictionary.",
      distractorsEn: [
        "It's the teacher's dictionary.",
        "It's my dictionary.",
        "Is it my friend's dictionary?",
      ],
    }),
    // ── N-1 selfExplain — moved to AFTER 6 cloze commits. Earlier sites
    //    have the learner reflecting before they have a sturdy schema; this
    //    placement is the CLT-correct one (per M3-M7 spec §3.2). The
    //    distractor "は could also work" is the most plausible wrong-rule
    //    a learner could believe after only seeing simple sentences. ──
    selfExplain({
      id: "ja-m4-5-self-no-vs-ha",
      anchorLabel: "You picked の in: わたし＿ かばんです。",
      anchorAudioText: "わたしの かばんです",
      question: "Why is の correct here and not は?",
      rule: {
        text: "の links owner (わたし) to thing owned (かばん) — possession.",
      },
      surface: { text: "の always comes after a pronoun like わたし." },
      distractor: { text: "は could also work and mean the same thing." },
      ruleExplanation:
        "の glues two nouns into a possessive (my bag). は would mark わたし as the TOPIC ('as for me, [it's a] bag') — grammatical but means a different thing. Surface rules like 'after a pronoun' miss the point: pick の when there's an owner→owned relationship.",
    }),
    // Production: build one of the harder mixed-particle sentences.
    build(
      "ja-m4-5-translate-japanese-car",
      "This is a Japanese car.",
      "これは にほんの くるまです",
      ["これ", "は", "にほん", "の", "くるま", "です", "わたし", "それ"],
      ["これ", "は", "にほん", "の", "くるま", "です"],
    ),
    cloze(
      "ja-m4-5-cloze-6",
      "これは にほん",
      " くるまです。",
      "の",
      ["の", "は", "が", "を"],
      "This is a Japanese car.",
      "これは にほんの くるまです。",
      "'Kind-of' reading: にほん-kind-of car = Japanese car.",
    ),
    // ── Review tail (M2 g-row atoms + an M1 listening tap + match). ──
    vocabMcq("ja-m4-5-rev-mcq-m2", M4_5_REVIEW[0], M4_REVIEW_M2_POOL),
    listeningCompSentence({
      id: "ja-m4-5-rev-lc-m2",
      audioText: M4_5_REVIEW[1].kana,
      correctMeaningEn: M4_5_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_5_REVIEW[2].meaningEn,
        M4_5_REVIEW[3].meaningEn,
        M4_REVIEW_M1_POOL[0].meaningEn,
      ],
    }),
    // Extra M1 vocab MCQ — keeps the cumulative review tail dense enough
    // to clear the 20-step floor.
    vocabMcq("ja-m4-5-rev-mcq-m1", M4_REVIEW_M1_POOL[3], M4_REVIEW_M1_POOL),
    reviewMatchPairs("ja-m4-5-rev", M4_5_REVIEW),
    infoStep(
      "ja-m4-5-info-end",
      "You can sort the particles",
      "Six drills + self-explanation + production sorted across は (topic), の (glue), and が (question-word). Plus a new question word: だれ. Next: cumulative production.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_5.steps);
assertAnswerRotation(M4_5.steps, 3);
assertNoConsecutiveSame(M4_5.steps);

// ----- M4-6 — Sentence Build — production across modes --------------------

const M4_6_REVIEW = pickReviewAtoms("ja-m4-6-rev", M4_REVIEW_M3_POOL, 4);

export const M4_6: LessonContent = {
  id: "ja-m4-6",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build — pointers + possessives",
  description:
    "Production-heavy. Six+ sentences across build, translate, listening_build, and your voice. Cumulative across M3 + M4.",
  estimatedMinutes: 12,
  xpReward: 30,
  steps: [
    infoStep(
      "ja-m4-6-info-open",
      "Production time",
      "Six sentences, four modes (build, translate, listening_build, speak). Each one combines M4 pieces with M3 baseline.",
    ),
    // Warm-up cloze before the production cluster — uses は (topic) on a
    // pointer + possessive + noun stem so the cluster rotates against the
    // のno-cloze below (assertAnswerRotation gate needs ≥2 distinct
    // correct particles).
    cloze(
      "ja-m4-6-warmup-cloze",
      "これ",
      " ともだちの カメラです。",
      "は",
      ["は", "の", "が", "を"],
      "This is my friend's camera.",
      "これは ともだちの カメラです。",
      "Three particles, one sentence: pointer (これ) → topic (は) → possessive (の) → assertion (です). Topic は marks 'this' — の glues friend + camera.",
    ),
    // ── 6-sentence production cluster — interleaved across modes. ──
    build(
      "ja-m4-6-s1",
      "Say: This is my umbrella.",
      "これは わたしの かさです",
      ["これ", "は", "わたし", "の", "かさ", "です", "それ", "ともだち"],
      ["これ", "は", "わたし", "の", "かさ", "です"],
    ),
    // Speaking on the just-built sentence — hard direction immediately.
    speaking(
      "ja-m4-6-speak-s1",
      "これは わたしの かさです",
      "This is my umbrella.",
    ),
    build(
      "ja-m4-6-translate-s2",
      "Is that your bag?",
      "それは あなたの かばんですか",
      ["それ", "は", "あなた", "の", "かばん", "です", "か", "これ", "わたし"],
      ["それ", "は", "あなた", "の", "かばん", "です", "か"],
    ),
    build(
      "ja-m4-6-s3",
      "Say: That over there is the teacher's car.",
      "あれは せんせいの くるまです",
      ["あれ", "は", "せんせい", "の", "くるま", "です", "ともだち", "これ"],
      ["あれ", "は", "せんせい", "の", "くるま", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m4-6-lb-s4",
      target: "にほんの カメラです",
      tiles: ["にほん", "の", "カメラ", "です", "わたし", "ペン"],
      correctOrder: ["にほん", "の", "カメラ", "です"],
      promptEn: "Hear it, build it: 'It's a Japanese camera.'",
    }),
    speaking(
      "ja-m4-6-speak-s4",
      "にほんの カメラです",
      "It's a Japanese camera.",
    ),
    // Listening on じてんしゃです — third surface (M4-3 build + M4-3 cloze
    // + here) so the compound atom clears n=3.
    listeningCompSentence({
      id: "ja-m4-6-lc-friend-bike",
      audioText: "ともだちの じてんしゃです",
      correctMeaningEn: "It's my friend's bicycle.",
      distractorsEn: [
        "It's my bicycle.",
        "It's the teacher's bicycle.",
        "Is it my friend's bicycle?",
      ],
    }),
    build(
      "ja-m4-6-s5",
      "Ask: Which is your dictionary?",
      "どれが あなたの じしょですか",
      ["どれ", "が", "あなた", "の", "じしょ", "です", "か", "は", "わたし"],
      ["どれ", "が", "あなた", "の", "じしょ", "です", "か"],
    ),
    // だれ cloze — third+ surface across M4 (M4-5 vocab + M4-5 cloze + here
    // + M4-7 dialogue). Uses の (whose) — most common だれ pairing.
    cloze(
      "ja-m4-6-cloze-dare",
      "これは だれ",
      " ペンですか。",
      "の",
      ["の", "は", "が", "を"],
      "Whose pen is this?",
      "これは だれの ペンですか。",
      "だれの = 'whose.' Combines the question word だれ ('who') with the possession particle の.",
    ),
    // Tile-bank production — additional generation step on a pointer +
    // possessive composite. Bumps the production density above the
    // 5-sentence floor.
    build(
      "ja-m4-6-translate-s6",
      "That over there is the teacher's bag.",
      "あれは せんせいの かばんです",
      ["あれ", "は", "せんせい", "の", "かばん", "です", "それ", "ともだち"],
      ["あれ", "は", "せんせい", "の", "かばん", "です"],
    ),
    // sentenceMcq retrieval check after the production block.
    sentenceMcq({
      id: "ja-m4-6-mcq-recall",
      prompt: "Which sentence asks 'Whose pen is this?'",
      correctKana: "これは だれの ペンですか。",
      distractorsKana: [
        "これは どれの ペンですか。",
        "これは なんの ペンですか。",
        "これは だれは ペンですか。",
      ],
      explanation:
        "だれ = who; だれの = whose. どれ = which one; なん = what — they don't ask about a person. The fourth option breaks the possessive (は instead of の).",
    }),
    // Extra speaking — hard-direction lock on the だれの question form just
    // before the review tail (post-step-12 per the hard-direction-last rule).
    speaking(
      "ja-m4-6-speak-dare",
      "これは だれの ペンですか",
      "Whose pen is this?",
    ),
    // ── Review tail (M3 atoms — fresh subset). ──
    listeningCompSentence({
      id: "ja-m4-6-rev-lc-m3",
      audioText: M4_6_REVIEW[0].kana,
      correctMeaningEn: M4_6_REVIEW[0].meaningEn,
      distractorsEn: [
        M4_6_REVIEW[1].meaningEn,
        M4_6_REVIEW[2].meaningEn,
        M4_6_REVIEW[3].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-6-rev-mcq-m3", M4_6_REVIEW[1], M4_REVIEW_M3_POOL),
    // Cumulative M2 listening tap between the two visual MCQs (avoids 2
    // adjacent word_image_mcq steps).
    listeningCompSentence({
      id: "ja-m4-6-rev-lc-m2",
      audioText: M4_REVIEW_M2_POOL[1].kana,
      correctMeaningEn: M4_REVIEW_M2_POOL[1].meaningEn,
      distractorsEn: [
        M4_REVIEW_M2_POOL[2].meaningEn,
        M4_REVIEW_M2_POOL[0].meaningEn,
        M4_REVIEW_M1_POOL[5].meaningEn,
      ],
    }),
    vocabMcq(
      "ja-m4-6-rev-mcq-m1",
      M4_REVIEW_M1_POOL[4],
      M4_REVIEW_M1_POOL,
    ),
    reviewMatchPairs("ja-m4-6-rev", M4_6_REVIEW),
    infoStep(
      "ja-m4-6-info-end",
      "You can build any object sentence",
      "Six sentences across four production modes + question-word drills + cumulative review. You can now describe, ask about, or identify any object across four spatial distances.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_6.steps);
// Two clozes (warmup→は, dare→の) — 2 distinct correct particles in the
// M4-6 production sub-lesson.
assertAnswerRotation(M4_6.steps, 2);
assertNoConsecutiveSame(M4_6.steps);

// ----- M4-7 — Mini-dialogue — at a friend's place + cumulative review -----

const M4_7_REVIEW = pickReviewAtoms("ja-m4-7-rev", M4_REVIEW_POOL, 6);

export const M4_7: LessonContent = {
  id: "ja-m4-7",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — at a friend's apartment",
  description:
    "A short visit to a friend's place — sorting whose things are whose, with a photo on the wall as the conversation hook. Uses the new dialogue_listen step (listen → answer comprehension Qs). Cumulative review across M1 + M2 + M3.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m4-7-info-open",
      "Drop into the scene",
      "You're at a friend's apartment. There's a photo on the wall and a few objects on the table — who do they belong to, and who's in the picture? Every word and grammar piece is something you've met across M3 + M4.",
      "culture",
    ),
    // ── Warm-up: re-tap だれ ('who'), the key question word for the
    //    dialogue's "whose X" comprehension question. ──
    listeningCompSentence({
      id: "ja-m4-7-lc-warmup-dare",
      audioText: "だれの ペンですか",
      correctMeaningEn: "Whose pen is it?",
      distractorsEn: [
        "Which pen is it?",
        "What kind of pen is it?",
        "Is it your pen?",
      ],
    }),
    // Warm-up vocab refresh — review tap on かばん (the dialogue's first
    // object) and カメラ (the photo prop) before the live audio lands.
    vocabMcq(
      "ja-m4-7-warmup-mcq-kaban",
      { kana: "かばん", meaningEn: "bag", emoji: "👜", fromModule: "m4" },
      M4_REVIEW_M3_POOL,
    ),
    // Warm-up cloze before the dialogue — locks the だれ + の = whose
    // pattern the dialogue uses.
    cloze(
      "ja-m4-7-warmup-cloze",
      "これは だれ",
      " カメラですか。",
      "の",
      ["の", "は", "が", "を"],
      "Whose camera is this?",
      "これは だれの カメラですか。",
      "だれの = whose. の after a question word turns it into 'whose ___'.",
    ),
    // Build warm-up — production direction on a pointer + possessive
    // before the listening-heavy dialogue. Anchors what the learner will
    // hear in the dialogue's own Friend turn.
    build(
      "ja-m4-7-translate-warmup",
      "Is that (near you) your bag?",
      "それは あなたの かばんですか",
      ["それ", "は", "あなた", "の", "かばん", "です", "か", "あれ", "せんせい"],
      ["それ", "は", "あなた", "の", "かばん", "です", "か"],
    ),
    // ── NEW dialogue_listen step — replaces the legacy dialogueLesson
    //    phrase-card chain. 4 dialogue lines, 3 comprehension Qs probing
    //    'whose X' + 'what's in the photo' (the photo on the wall holds
    //    a camera + an older brother — both referenced by atoms that
    //    already have n≥3 elsewhere in M4) per wave-4B brief.
    //
    //    `audioText` overrides the natural kana for tokenization so the
    //    atom-coverage walker sees compound forms (e.g. かばんですか) that
    //    appear ≥3× elsewhere in M4. The user-facing kana stays natural. ──
    dialogueListen({
      id: "ja-m4-7-dialogue",
      lines: [
        {
          speaker: "Friend",
          kana: "それは あなたの かばんですか。",
          audioText: "それは あなたの かばんですか",
        },
        {
          speaker: "You",
          kana: "それは ともだちの かばんです。",
          audioText: "それは ともだちの かばんです",
        },
        {
          speaker: "Friend",
          kana: "あれは あにの カメラです。",
          audioText: "あれは あにの カメラです",
        },
        {
          speaker: "You",
          kana: "あれは にほんの カメラですか。",
          audioText: "あれは にほんの カメラですか",
        },
      ],
      questions: [
        {
          id: "ja-m4-7-q1",
          prompt: "Whose bag is near the listener?",
          correctText: "Their friend's bag",
          distractors: [
            "The speaker's own bag",
            "Their host friend's bag",
            "The teacher's bag",
          ],
          explanation:
            "First two lines: friend asks 'is that (near you) your bag?' and the speaker answers 'that is my friend's bag' (ともだちの かばんです). それ = near the listener.",
        },
        {
          id: "ja-m4-7-q2",
          prompt: "Whose camera is on display far across the room?",
          correctText: "The friend's older brother's camera",
          distractors: [
            "The friend's own camera",
            "The speaker's camera",
            "The teacher's camera",
          ],
          explanation:
            "あにの カメラ = 'older brother's camera' — あに = older brother. The friend is pointing out a camera that belongs to their あに. あれ = far from both speakers.",
        },
        {
          id: "ja-m4-7-q3",
          prompt: "What does the speaker ask at the very end?",
          correctText: "Whether the far-away camera is Japanese",
          distractors: [
            "Whether the bag is Japanese",
            "Whose bag it is",
            "Whether the friend has a camera",
          ],
          explanation:
            "あれは にほんの カメラですか = 'is that over there a Japanese camera?' にほんの カメラ uses the 'kind-of' reading of の (a Japanese-kind-of camera), not possession.",
        },
      ],
    }),
    // ── Cumulative grammar check — answers rotate (の / は). ──
    cloze(
      "ja-m4-7-cloze-1",
      "あなた",
      " なまえは なんですか。",
      "の",
      ["の", "は", "が", "を"],
      "What is your name? (literally 'as for your name, what is it?')",
      "あなたの なまえは なんですか。",
      "の links あなた + なまえ ('your name'); は marks the whole topic; か asks.",
    ),
    // sentenceMcq break — keeps R3 alternation between the two clozes.
    sentenceMcq({
      id: "ja-m4-7-mcq-recap",
      prompt: "Which sentence says 'That's my friend's camera.'?",
      correctKana: "それは ともだちの カメラです。",
      distractorsKana: [
        "これは ともだちの カメラです。",
        "それは ともだちは カメラです。",
        "それは ともだちの カメラですか。",
      ],
      explanation:
        "それ = 'that (near you)'; の glues ともだち + カメラ. The other options swap the pointer, break the possessive, or turn it into a question.",
    }),
    cloze(
      "ja-m4-7-cloze-2",
      "あれは せんせい",
      " くるまですか。",
      "の",
      ["の", "は", "が", "を"],
      "Is that over there the teacher's car?",
      "あれは せんせいの くるまですか。",
    ),
    // Listening break between the two cumulative clozes (avoids 2 adjacent
    // particle_cloze; also keeps カメラです warm at module close).
    listeningCompSentence({
      id: "ja-m4-7-lc-cumulative",
      audioText: "にほんの カメラです",
      correctMeaningEn: "It's a Japanese camera.",
      distractorsEn: [
        "It's my camera.",
        "It's a Japanese car.",
        "Is it a Japanese camera?",
      ],
    }),
    // Rotating-answer cloze — か (M3 review) breaks the の streak so the
    // assertAnswerRotation(2+) gate stays green and the learner doesn't
    // pattern-match the cluster to "always の".
    cloze(
      "ja-m4-7-cloze-3-ka",
      "これは あなたの かさです",
      "。",
      "か",
      ["か", "は", "の", "を"],
      "Is this your umbrella?",
      "これは あなたの かさですか。",
      "M3 review: か at the end turns a statement into a question. Same M4 surface (pointer + possessive + noun) — just the closer changes.",
    ),
    // Production tap — build one cumulative sentence.
    build(
      "ja-m4-7-translate-final",
      "This is my friend's pen.",
      "これは ともだちの ペンです",
      ["これ", "は", "ともだち", "の", "ペン", "です", "それ", "わたし"],
      ["これ", "は", "ともだち", "の", "ペン", "です"],
    ),
    // Speaking — hard direction on the dialogue's anchor sentence so the
    // learner leaves the lesson with a fluent production hook.
    speaking(
      "ja-m4-7-speak-final",
      "それは ともだちの ペンです",
      "That's my friend's pen.",
    ),
    // ── Cumulative review tail — broadest set (M1 + M2 + M3). ──
    vocabMcq(
      "ja-m4-7-rev-mcq-1",
      // First emoji-bearing atom from the cumulative draw.
      M4_7_REVIEW.find((a) => Boolean(a.emoji))!,
      M4_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m4-7-rev-lc-cumulative",
      audioText: M4_7_REVIEW[1].kana,
      correctMeaningEn: M4_7_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_7_REVIEW[2].meaningEn,
        M4_7_REVIEW[3].meaningEn,
        M4_7_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq(
      "ja-m4-7-rev-mcq-2",
      M4_7_REVIEW.filter((a) => Boolean(a.emoji))[1]!,
      M4_REVIEW_POOL,
    ),
    // Cumulative cloze tap — M3 sentence pattern (は + です + か) on a
    // cumulative noun. Adds a second answer (か) so the M4-7 cloze cluster
    // already rotates の/の/か → 2 distinct correct particles.
    cloze(
      "ja-m4-7-rev-cloze-final",
      "あれは ともだちの ペンです",
      "。",
      "か",
      ["か", "は", "の", "を"],
      "Is that over there your friend's pen?",
      "あれは ともだちの ペンですか。",
      "Final M3+M4 composite: pointer (あれ) + topic (は) + possessive (の) + question closer (か). The full toolkit.",
    ),
    // Extra deep-pool listening tap — keeps M1 atoms alive at module close.
    listeningCompSentence({
      id: "ja-m4-7-rev-lc-deep",
      audioText: M4_REVIEW_M1_POOL[6].kana,
      correctMeaningEn: M4_REVIEW_M1_POOL[6].meaningEn,
      distractorsEn: [
        M4_REVIEW_M1_POOL[7].meaningEn,
        M4_REVIEW_M1_POOL[8].meaningEn,
        M4_REVIEW_M1_POOL[9].meaningEn,
      ],
    }),
    // Final cumulative build_sentence — production direction across the
    // dialogue's anchor pattern (pointer + possessive + noun). Lifts the
    // distinct-step-types count and lands the module on a high-leverage
    // hard-direction step.
    build(
      "ja-m4-7-build-final",
      "Say: That's my friend's bag.",
      "それは ともだちの かばんです",
      ["それ", "は", "ともだち", "の", "かばん", "です", "これ", "わたし"],
      ["それ", "は", "ともだち", "の", "かばん", "です"],
    ),
    reviewMatchPairs("ja-m4-7-rev", M4_7_REVIEW.slice(0, 6)),
    infoStep(
      "ja-m4-7-info-end",
      "You can navigate a friend's apartment",
      "Live dialogue + comprehension Qs + cumulative review across M1 + M2 + M3. You can now ask whose anything is, point at objects across four spatial distances, and parse a friend's casual chatter about who's in the photo.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_7.steps);
assertAnswerRotation(M4_7.steps, 2);
assertNoConsecutiveSame(M4_7.steps);

// ----- M4-8 — Row test (mastery ★) ----------------------------------------
// PRESERVED from the prior structure. The row test is the mastery surface
// that gates module completion — its shape is contracted by
// ja-m3-m7-coverage + grammar-rule + mockCourse tests.

function particleMc(
  id: string,
  prompt: string,
  audioText: string,
  correct: string,
  distractors: [string, string, string],
  explanation: string,
): MultipleChoiceStep {
  // Rotate correct slot by id-hash (2026-05-18 audit).
  const items = [
    { id: "correct", text: correct },
    { id: "opt-1", text: distractors[0] },
    { id: "opt-2", text: distractors[1] },
    { id: "opt-3", text: distractors[2] },
  ];
  const slot = slotFor(id, 4);
  const correctItem = items.shift()!;
  items.splice(slot, 0, correctItem);
  return {
    id,
    type: "multiple_choice",
    prompt,
    promptAudioText: audioText,
    options: items,
    correctOptionId: "correct",
    explanation,
    optionsHideRomaji: true,
  };
}

const M4_TEST_ITEMS: RowTestItem[] = [
  {
    kind: "mc",
    payload: particleMc(
      "ja-m4-8-mc-1",
      "わたし___ かばんです。 (It's my bag.)",
      "わたしの かばんです",
      "の",
      ["は", "が", "を"],
      "わたし + の + かばん = my bag.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m4-8-mc-2",
      "これは せんせい___ ほんです。 (This is the teacher's book.)",
      "これは せんせいの ほんです",
      "の",
      ["は", "が", "を"],
      "せんせい + の + ほん = teacher's book.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m4-8-mc-3",
      "それ___ なんですか。 (What's that?)",
      "それは なんですか",
      "は",
      ["の", "が", "を"],
      "それ as topic — 'as for that thing near you, what is it?'",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m4-8-mc-4",
      "あれは ともだち___ くるまです。 (That over there is my friend's car.)",
      "あれは ともだちの くるまです",
      "の",
      ["は", "が", "を"],
      "ともだち + の + くるま = friend's car.",
    ),
  },
  {
    kind: "match",
    payload: {
      id: "ja-m4-8-match",
      type: "match_pairs",
      prompt: "Match each Japanese word to its meaning",
      pairs: [
        { id: "p1", source: "ペン", target: "pen", sourceAnnotation: [{ surface: "ペン", reading: "ペン" }] },
        { id: "p2", source: "かばん", target: "bag", sourceAnnotation: [{ surface: "かばん", reading: "かばん" }] },
        { id: "p3", source: "くるま", target: "car", sourceAnnotation: [{ surface: "くるま", reading: "くるま" }] },
        { id: "p4", source: "かさ", target: "umbrella", sourceAnnotation: [{ surface: "かさ", reading: "かさ" }] },
        { id: "p5", source: "じしょ", target: "dictionary", sourceAnnotation: [{ surface: "じしょ", reading: "じしょ" }] },
        { id: "p6", source: "カメラ", target: "camera", sourceAnnotation: [{ surface: "カメラ", reading: "カメラ" }] },
      ],
    } as MatchPairsStep,
  },
  {
    kind: "build",
    payload: {
      id: "ja-m4-8-build",
      type: "build_sentence",
      prompt: "Say: This is my friend's pen.",
      targetSentence: "これは ともだちの ペンです",
      tiles: ["これ", "は", "ともだち", "の", "ペン", "です", "それ", "わたし"],
      correctOrder: ["これ", "は", "ともだち", "の", "ペン", "です"],
      granularity: "word",
      audioKey: "これは ともだちの ペンです",
      targetAnnotation: [{ surface: "これは ともだちの ペンです", reading: "これは ともだちの ペンです" }],
    } as BuildSentenceStep,
  },
];

const M4_ROW_TEST: RowTestStep = {
  id: "ja-m4-8-test",
  type: "row_test",
  rowId: "m4",
  items: M4_TEST_ITEMS,
  passThreshold: 0.7,
  maxRetries: 3,
};

export const M4_8: LessonContent = {
  id: "ja-m4-8",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "M4 Mastery Test",
  description:
    "Cumulative test of M4 grammar + vocab. Wrong answers re-queue — no fail.",
  estimatedMinutes: 6,
  xpReward: 30,
  steps: [
    infoStep(
      "ja-m4-8-info-open",
      "Module 4 mastery",
      "Cumulative items across の, pointers, and vocab. Missed items re-queue at the back. Pass once and Module 4 is mastered.",
    ),
    M4_ROW_TEST,
    infoStep(
      "ja-m4-8-info-end",
      "Module 4 complete",
      "You can identify and possess objects across four spatial distances. M5 adds numbers and the people-counter — counting comes next.",
      "win",
    ),
  ],
};

// Module-level guard — every authored sub-lesson is also checked at its
// own assertNoSameAnswerCluster call above; this one is a belt-and-suspenders
// sweep over the combined steps array per spec §12.2 / §9.5.
assertNoSameAnswerCluster([
  ...M4_1.steps,
  ...M4_2.steps,
  ...M4_3.steps,
  ...M4_4.steps,
  ...M4_5.steps,
  ...M4_6.steps,
  ...M4_7.steps,
]);
