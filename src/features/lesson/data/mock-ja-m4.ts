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
  dialogueLesson,
  grammarRule,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  M3_M7_REVIEW_POOL,
  pickReviewAtoms,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  translateStep,
  vocab,
  vocabMcq,
  assertNoSameAnswerCluster,
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
const M4_REVIEW_POOL = M3_M7_REVIEW_POOL.filter(
  (a) => a.fromModule === "m1" || a.fromModule === "m2" || a.fromModule === "m3",
);
const M4_REVIEW_M1_POOL = M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1");
const M4_REVIEW_M2_POOL = M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2");
const M4_REVIEW_M3_POOL = M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m3");

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
  estimatedMinutes: 8,
  xpReward: 18,
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
      "ja-m4-1-cloze-preview",
      "これ",
      " ペンです。",
      "は",
      ["は", "が", "を", "に"],
      "This is a pen.",
      "これは ペンです。",
      "Pure M3 reinforcement on a new M4 noun — は marks the topic (this), です asserts.",
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
    reviewMatchPairs("ja-m4-1-rev", M4_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m4-1-info-end",
      "Five objects loaded",
      "Five objects + retrieval on each + an M3 review tap. Next: の, the particle that glues two nouns together — owner ↔ thing owned.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_1.steps);

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
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m4-2-info-open",
      "One particle, two flavors",
      "の glues nouns. Most of the time it means possessive 's. But it also means 'the X kind of Y' — same particle, broader pattern. You'll drill the possessive reading first; the 'kind-of' reading lands at the end.",
    ),
    RULE_NO,
    // ── Drill cluster: clozes rotated with breaks (R3 interleave). ──
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
    // self-explanation right after the first commit — Dunlosky 2013.
    selfExplain({
      id: "ja-m4-2-self-no-1",
      anchorLabel: "You picked の in: わたし＿ かばん",
      anchorAudioText: "わたしの かばん",
      question: "Why is の correct here?",
      rule: { text: "の attaches the owner to what they own." },
      surface: { text: "の always comes between two katakana words." },
      distractor: { text: "の is the question marker." },
      ruleExplanation:
        "の is the possession particle — it links owner (わたし) to thing owned (かばん). か (question marker) goes at the end of a sentence; surface-shape rules (like 'between katakana') are false patterns.",
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
    // listening break — meaning recall on a possession sentence.
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
    // Production: build_sentence with possession structure.
    build(
      "ja-m4-2-build-watashi-pen",
      "Say: It's my pen.",
      "わたしの ペンです",
      ["わたしの", "ペンです", "せんせいの", "ともだちの"],
      ["わたしの", "ペンです"],
    ),
    // Translate (typed-bank) production check — harder direction.
    translateStep({
      id: "ja-m4-2-translate-teacher-book",
      promptEn: "It's the teacher's book.",
      acceptedAnswers: [
        "せんせいの ほんです",
        "せんせいの ほんです。",
        "せんせいのほんです",
        "sensei no hon desu",
      ],
      audioText: "せんせいの ほんです",
    }),
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
    reviewMatchPairs("ja-m4-2-rev", M4_2_REVIEW),
    infoStep(
      "ja-m4-2-info-end",
      "の internalized",
      "Four drills + self-explanation + production: noun + の + noun = the L-kind of R. Next: more vocab + interleaving with M3's は.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_2.steps);

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
      ["ともだちの", "じてんしゃですか", "わたしの", "じしょですか"],
      ["ともだちの", "じてんしゃですか"],
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
    reviewMatchPairs("ja-m4-3-rev", M4_3_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m4-3-info-end",
      "Possession unlocked",
      "Five more nouns, three more の sentences, production + retrieval on each. Next: the four pointer words これ/それ/あれ/どれ.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_3.steps);

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
    // self-explanation on pointer selection — why は (not the pointer itself)
    // is the answer here.
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
    // Production: build_sentence with pointer + possessive.
    build(
      "ja-m4-4-build-this-mybag",
      "Say: This is my bag.",
      "これは わたしの かばんです",
      ["これは", "わたしの", "かばんです", "それは", "ともだちの"],
      ["これは", "わたしの", "かばんです"],
    ),
    // Translate (typed) production check.
    translateStep({
      id: "ja-m4-4-translate-sore-pen",
      promptEn: "Is that (near you) my friend's pen?",
      acceptedAnswers: [
        "それは ともだちの ペンですか",
        "それは ともだちの ペンですか。",
        "それはともだちのペンですか",
        "sore wa tomodachi no pen desu ka",
      ],
      audioText: "それは ともだちの ペンですか",
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
    reviewMatchPairs("ja-m4-4-rev", M4_4_REVIEW),
    infoStep(
      "ja-m4-4-info-end",
      "Four pointers, one system",
      "これ near me, それ near you, あれ far from both, どれ which. Plus the question-word-takes-が pairing. Next: mixed drill across の + pointers + は.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_4.steps);

// ----- M4-5 — Interleaved drill — の + pointers + は (rotating answers) --

const M4_5_REVIEW = pickReviewAtoms("ja-m4-5-rev", M4_REVIEW_M2_POOL, 4);

export const M4_5: LessonContent = {
  id: "ja-m4-5",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved drill — の + pointers + は",
  description:
    "Mixed practice across の (possession), the four pointers, and M3's は. Rotating answers + self-explanation + production.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m4-5-info-open",
      "Mix and match",
      "Each drill picks between particles you've now seen. No new rules — just sorting which pattern fits. Watch the answer rotate so you can't fish for a streak.",
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
    // self-explanation right after the first commit — productive failure pattern.
    selfExplain({
      id: "ja-m4-5-self-no-vs-ha",
      anchorLabel: "You picked の in: わたし＿ かばんです。",
      anchorAudioText: "わたしの かばんです",
      question: "Why is の correct and not は?",
      rule: {
        text: "の links owner (わたし) to thing owned (かばん) — possession.",
      },
      surface: { text: "の always comes after a pronoun like わたし." },
      distractor: { text: "は could also work and mean the same thing." },
      ruleExplanation:
        "の glues two nouns into a possessive (my bag). は would mark わたし as the TOPIC ('as for me, [it's a] bag') — grammatical but means a different thing. Surface rules like 'after a pronoun' miss the point: pick の when there's an owner→owned relationship.",
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
    // listening break.
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
    // Production: translate one of the harder mixed-particle sentences.
    translateStep({
      id: "ja-m4-5-translate-japanese-car",
      promptEn: "This is a Japanese car.",
      acceptedAnswers: [
        "これは にほんの くるまです",
        "これは にほんの くるまです。",
        "これはにほんのくるまです",
        "kore wa nihon no kuruma desu",
      ],
      audioText: "これは にほんの くるまです",
    }),
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
    vocabMcq("ja-m4-5-rev-mcq-m1", M4_REVIEW_M1_POOL[1], M4_REVIEW_M1_POOL),
    reviewMatchPairs("ja-m4-5-rev", M4_5_REVIEW),
    infoStep(
      "ja-m4-5-info-end",
      "Mixed and sorted",
      "Six drills + self-explanation + production sorted across two particles. Your brain now has explicit slots for は (topic) and の (glue) — they don't get confused.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_5.steps);

// ----- M4-6 — Sentence Build — production across modes --------------------

const M4_6_REVIEW = pickReviewAtoms("ja-m4-6-rev", M4_REVIEW_M3_POOL, 4);

export const M4_6: LessonContent = {
  id: "ja-m4-6",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build — pointers + possessives",
  description:
    "Production-heavy. Five sentences across build, translate, listening_build, and your voice. Cumulative across M3 + M4.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m4-6-info-open",
      "Production time",
      "Five sentences, four modes (build, translate, listening_build, speak). Each one combines M4 pieces with M3 baseline.",
    ),
    // ── 5-sentence production cluster — interleaved across modes. ──
    build(
      "ja-m4-6-s1",
      "Say: This is my umbrella.",
      "これは わたしの かさです",
      ["これは", "わたしの", "かさです", "それは", "ともだちの"],
      ["これは", "わたしの", "かさです"],
    ),
    // Speaking on the just-built sentence — hard direction immediately.
    speaking(
      "ja-m4-6-speak-s1",
      "これは わたしの かさです",
      "This is my umbrella.",
    ),
    translateStep({
      id: "ja-m4-6-translate-s2",
      promptEn: "Is that your bag?",
      acceptedAnswers: [
        "それは あなたの かばんですか",
        "それは あなたの かばんですか。",
        "それはあなたのかばんですか",
        "sore wa anata no kaban desu ka",
      ],
      audioText: "それは あなたの かばんですか",
    }),
    build(
      "ja-m4-6-s3",
      "Say: That over there is the teacher's car.",
      "あれは せんせいの くるまです",
      ["あれは", "せんせいの", "くるまです", "ともだちの", "これは"],
      ["あれは", "せんせいの", "くるまです"],
    ),
    listeningBuildSentence({
      id: "ja-m4-6-lb-s4",
      target: "にほんの カメラです",
      tiles: ["にほんの", "カメラです", "わたしの", "ペンです"],
      correctOrder: ["にほんの", "カメラです"],
      promptEn: "Hear it, build it: 'It's a Japanese camera.'",
    }),
    speaking(
      "ja-m4-6-speak-s4",
      "にほんの カメラです",
      "It's a Japanese camera.",
    ),
    build(
      "ja-m4-6-s5",
      "Ask: Which is your dictionary?",
      "どれが あなたの じしょですか",
      ["どれが", "あなたの", "じしょですか", "どれは", "わたしの"],
      ["どれが", "あなたの", "じしょですか"],
    ),
    // Translate (typed) production — additional generation step on a
    // pointer + possessive composite. Bumps the production density above
    // the 5-sentence floor.
    translateStep({
      id: "ja-m4-6-translate-s6",
      promptEn: "That over there is the teacher's bag.",
      acceptedAnswers: [
        "あれは せんせいの かばんです",
        "あれは せんせいの かばんです。",
        "あれはせんせいのかばんです",
        "are wa sensei no kaban desu",
      ],
      audioText: "あれは せんせいの かばんです",
    }),
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
    reviewMatchPairs("ja-m4-6-rev", M4_6_REVIEW),
    infoStep(
      "ja-m4-6-info-end",
      "Production locked",
      "Five sentences combining M3 + M4 grammar across four modes. Two new pieces, full flexibility.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_6.steps);

// ----- M4-7 — Mini-dialogue — at a friend's place + cumulative review -----

const M4_7_REVIEW = pickReviewAtoms("ja-m4-7-rev", M4_REVIEW_POOL, 6);

export const M4_7: LessonContent = {
  id: "ja-m4-7",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — at a friend's place",
  description:
    "Identifying objects. 'Whose is this?' / 'Which one?' — natural use of の and the pointer system. Cumulative review across M1 + M2 + M3.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m4-7-info-open",
      "Drop into the scene",
      "You're at a friend's apartment. There are a few objects on the table — who do they belong to? Every word and grammar piece is something you've met across M3 + M4.",
      "culture",
    ),
    ...dialogueLesson({
      idPrefix: "ja-m4-7",
      representative: {
        phrase: "それは ともだちの ペンです",
        translation: "That's my friend's pen.",
      },
      lines: [
        {
          speaker: "Friend",
          meaningEn: "Is that your bag?",
          romaji: "sore wa anata no kaban desu ka",
          kana: "それは あなたの かばんですか",
          speakingPhrase: "それは あなたの かばんですか",
        },
        {
          speaker: "You",
          meaningEn: "Yes, it's mine.",
          romaji: "hai, watashi no desu",
          kana: "はい、わたしのです",
          cultureNote:
            "When the noun is obvious from context (the bag we're looking at), you can drop it and just say 'わたしの' = 'mine.'",
        },
        {
          speaker: "Friend",
          meaningEn: "And this pen?",
          romaji: "kono pen wa",
          kana: "このペンは？",
          cultureNote:
            "この + noun is a shorter way to say 'this [noun]' — preview of next module.",
        },
        {
          speaker: "You",
          meaningEn: "That's my friend's pen.",
          romaji: "sore wa tomodachi no pen desu",
          kana: "それは ともだちの ペンです",
          speakingPhrase: "それは ともだちの ペンです",
        },
      ],
    }),
    // ── Post-dialogue comprehension check on a dialogue line. ──
    listeningCompSentence({
      id: "ja-m4-7-lc-dialogue",
      audioText: "それは あなたの かばんですか",
      correctMeaningEn: "Is that your bag?",
      distractorsEn: [
        "Is that my bag?",
        "This is my bag.",
        "Is that the teacher's bag?",
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
    // Production tap — translate one cumulative sentence.
    translateStep({
      id: "ja-m4-7-translate-final",
      promptEn: "This is my friend's pen.",
      acceptedAnswers: [
        "これは ともだちの ペンです",
        "これは ともだちの ペンです。",
        "これはともだちのペンです",
        "kore wa tomodachi no pen desu",
      ],
      audioText: "これは ともだちの ペンです",
    }),
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
    reviewMatchPairs("ja-m4-7-rev", M4_7_REVIEW.slice(0, 6)),
    infoStep(
      "ja-m4-7-info-end",
      "Object talk",
      "Four dialogue lines + cumulative review across M1 + M2 + M3 atoms. You can now identify and possess objects across four spatial distances — half of small-talk Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_7.steps);

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
  return {
    id,
    type: "multiple_choice",
    prompt,
    promptAudioText: audioText,
    options: [
      { id: "correct", text: correct },
      { id: "opt-1", text: distractors[0] },
      { id: "opt-2", text: distractors[1] },
      { id: "opt-3", text: distractors[2] },
    ],
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
      tiles: ["これは", "ともだちの", "ペンです", "それは", "わたしの"],
      correctOrder: ["これは", "ともだちの", "ペンです"],
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
