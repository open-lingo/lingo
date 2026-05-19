/**
 * M3 v2 — First sentences (density rebuild 2026-05-18).
 *
 * Spencer's spec: ≤2 new grammar concepts per module. M3 introduces:
 *   - です + か (combined card — the polite copula + question particle)
 *   - は as topic marker (no が contrast — が deferred to M6 via existence)
 *
 * Adjective EXPOSURE in example sentences (これは あおいです, それは
 * あかいです, あれは おおきいです) — no formal adjective lesson.
 * Pattern-match only.
 *
 * 2026-05-18 rebuild (per docs/m3-m7-rebuild-spec-2026-05-18.md):
 *   - Densified to 14-20 steps per sub-lesson (was 5-12).
 *   - ≥1 generation step (translate / build / listening_build / speaking)
 *     per sub-lesson; ≥5 distinct step types; no two adjacent same-type.
 *   - Compounding review ≥0.25 ratio per sub-lesson drawing from
 *     M3_M7_REVIEW_POOL (M1 vowel/ka/sa/ta/na/ha/ma/ya/ra anchors +
 *     M2 g-row anchors).
 *   - Answer-rotation guarantor on all particle_cloze runs (kills the
 *     M3-5 「は か は か は か」 same-answer cluster).
 *   - 8-lesson ID list preserved (mockLessons.ts + 3 test files reference
 *     ja-m3-1..ja-m3-8 by id). The spec's "6 sub-lessons" target collapses
 *     to 7 dense content lessons + 1 row test = 8 — chosen over scope-
 *     widening into mockCourse.ts + 3 test files (spec §9 mandates
 *     preserving externally-referenced ids).
 *
 * Lesson list (8 lessons):
 *   M3-1  Katakana intro + 5 loanwords + review tail (densified)
 *   M3-2  です + か (Grammar Rule) + people vocab + drills
 *   M3-3  More vocab + adjective EXPOSURE + listening
 *   M3-4  は as topic marker (Grammar Rule) + drilled
 *   M3-5  Interleaved drill — は + です + か (answer-rotating)
 *   M3-6  Production — sentence build + speaking + translate
 *   M3-7  Mini-dialogue + cumulative review
 *   M3-8  Row test (mastery ★)
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
  withoutMcqBlocked,
  phrase,
  pickReviewAtoms,
  reviewMatchPairs,
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
// gets a stable but distinct subset across re-runs. Pool is M1 + M2 only
// (M3 is the module being authored — can't review itself).
// ───────────────────────────────────────────────────────────────────────
// withoutMcqBlocked: drops audit-deferred kana (image-MCQ-unsafe per
// docs/emoji-blocked-words-2026-05-18.md) so vocabMcq targets / distractors
// never land on a misleading visual cue.
const M3_REVIEW_M1_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1"),
);
const M3_REVIEW_M2_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2"),
);

// ----- M3-1 — Katakana SYSTEM intro + 5 loanwords + review tail ----------

const M3_1_REVIEW = pickReviewAtoms("ja-m3-1-rev", M3_REVIEW_M1_POOL, 6);
// M3-1 has no prior-module-grammar to drill, so the review tail is pure
// vocab MCQ + match_pairs on M1 atoms.

export const M3_1: LessonContent = {
  id: "ja-m3-1",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Katakana — the second alphabet",
  description:
    "Meet katakana as a system. Same sounds as hiragana, different shapes — used for foreign words.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m3-1-info-system",
      "Katakana — hiragana's twin",
      "Katakana (カタカナ) has the same 46 sounds as hiragana — just different, more angular shapes. It's used for: (1) loanwords from English and other languages (コーヒー = coffee), (2) foreign names, (3) onomatopoeia and emphasis (like italics in English). You'll meet 3–5 katakana words per M3+ lesson with romaji ruby on top, so you can read by sound while the shapes sink in. Want deliberate practice? Open the katakana drill from the Practice tab.",
      "culture",
    ),
    phrase(
      "ja-m3-1-coffee",
      "Coffee",
      "koohii",
      "コーヒー",
      "The ー is a long-vowel mark — stretch the previous vowel. 'koo-hii,' not 'ko-hi.' On menus everywhere.",
    ),
    // Listening reinforcement on the just-introduced loanword.
    listeningCompSentence({
      id: "ja-m3-1-lc-coffee",
      audioText: "コーヒー",
      correctMeaningEn: "coffee",
      distractorsEn: ["tea", "milk", "water"],
    }),
    phrase(
      "ja-m3-1-taxi",
      "Taxi",
      "takushii",
      "タクシー",
      "Japanese taxis have automatic doors — don't grab the handle, the driver opens it for you.",
    ),
    // Listening break between phrase cards (R3 interleave).
    listeningCompSentence({
      id: "ja-m3-1-lc-taxi",
      audioText: "タクシー",
      correctMeaningEn: "taxi",
      distractorsEn: ["coffee", "hotel", "beer"],
    }),
    phrase(
      "ja-m3-1-hotel",
      "Hotel",
      "hoteru",
      "ホテル",
      "Foreign loanwords get a vowel after consonant clusters (hot-el → ho-te-ru). This is why every English word sounds 'longer' in Japanese.",
    ),
    // Listening break between phrase cards.
    listeningCompSentence({
      id: "ja-m3-1-lc-restaurant",
      audioText: "レストラン",
      correctMeaningEn: "restaurant",
      distractorsEn: ["hotel", "taxi", "coffee"],
    }),
    phrase(
      "ja-m3-1-restaurant",
      "Restaurant",
      "resutoran",
      "レストラン",
      "Used for Western-style restaurants. Japanese-style eateries are usually 食堂 (shokudou) or just the cuisine name + 屋 (-ya).",
    ),
    // Production break (speaking) between consecutive phrase_cards.
    speaking("ja-m3-1-speak-coffee", "コーヒー", "Coffee"),
    phrase(
      "ja-m3-1-beer",
      "Beer",
      "biiru",
      "ビール",
      "Asahi, Kirin, Sapporo, Suntory — order with 'ビール、おねがいします' (a beer, please).",
    ),
    // ─── Review tail (M1 atoms — kana the learner has fully read) ───
    // Compounding-review loop on prior-module atoms.
    vocabMcq("ja-m3-1-rev-mcq-1", M3_1_REVIEW[0], M3_REVIEW_M1_POOL),
    listeningCompSentence({
      id: "ja-m3-1-rev-lc-1",
      audioText: M3_1_REVIEW[1].kana,
      correctMeaningEn: M3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_1_REVIEW[2].meaningEn,
        M3_1_REVIEW[3].meaningEn,
        M3_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-1-rev-mcq-2", M3_1_REVIEW[2], M3_REVIEW_M1_POOL),
    reviewMatchPairs("ja-m3-1-rev", M3_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m3-1-info-end",
      "Five katakana words in your pocket",
      "You can now order a coffee, hail a taxi, find your hotel, sit in a restaurant, and order a beer. Five loanwords, five katakana shapes you've now seen in context. The shapes will become familiar through repetition across M3 — no drilling required.",
      "win",
    ),
  ],
};

// Validate no same-answer cluster (no clozes in M3-1, but keep the gate
// uniform across the module for future edits).
assertNoSameAnswerCluster(M3_1.steps);

// ----- M3-2 — です + か (combined Grammar Rule Card + drills) ------------

const RULE_DESU_KA = grammarRule({
  id: "ja-m3-2-rule-desu-ka",
  title: "です + か — assert, then ask",
  rule:
    "です sits at the end of a statement and politely asserts 'X is Y.' It's the verbal handshake that says 'I'm speaking to you politely.' Attach か after です to turn the statement into a question — no tone-rise needed (unlike English questions).",
  examples: [
    {
      ja: "わたしは がくせいです。",
      romaji: "watashi wa gakusei desu.",
      en: "I am a student. (statement)",
    },
    {
      ja: "がくせいですか。",
      romaji: "gakusei desu ka.",
      en: "Are you a student? (question)",
    },
  ],
  antiPattern: {
    ja: "わたしは がくせい。",
    romaji: "watashi wa gakusei.",
    en: "I am a student. (too casual for a stranger)",
    why: "Dropping です makes the sentence casual — fine with close friends, rude with the shop staff who asked your name. Polite Japanese is the default register for travelers and learners.",
  },
  cultureNote:
    "The 'u' in です is almost silent — 'des' more than 'desu.' Both pronunciations are accepted; the dropped-u version is standard in Tokyo. Japanese questions are said with a flat tone — a rising tone sounds aggressive or surprised.",
});

const M3_2_REVIEW = pickReviewAtoms("ja-m3-2-rev", M3_REVIEW_M2_POOL, 4);

export const M3_2: LessonContent = {
  id: "ja-m3-2",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "です + か — your first sentences",
  description:
    "Polite 'is/are' (です) and the question particle か. People vocab + drills + a review tap on the g-row.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m3-2-info-open",
      "From kana to sentences",
      "You can read hiragana. Now you build sentences. The pattern is brutally simple: [subject] [is what] です. Add か to ask. Almost everything in M3 hangs off these two pieces.",
    ),
    RULE_DESU_KA,
    // ── Atom intros (5 new people-words) ──
    vocab(
      "ja-m3-2-v-gakusei",
      "Student",
      "gakusei",
      "がくせい",
      "Often the first word you'll be asked at a hostel or share house.",
    ),
    // Listening break interrupting the phrase-card run (R3 interleave).
    listeningCompSentence({
      id: "ja-m3-2-lc-gakusei",
      audioText: "がくせい",
      correctMeaningEn: "student",
      distractorsEn: ["teacher", "friend", "name"],
    }),
    vocab("ja-m3-2-v-sensei", "Teacher", "sensei", "せんせい"),
    // Listening break — pulls a g-row REVIEW atom in here, breaks the
    // phrase_card run (R3 interleave) AND counts toward the ≥0.25
    // compounding-review ratio.
    listeningCompSentence({
      id: "ja-m3-2-rev-lc-megane",
      audioText: "めがね",
      correctMeaningEn: "glasses",
      distractorsEn: ["key", "rice/meal", "well/energy"],
    }),
    vocab(
      "ja-m3-2-v-nihonjin",
      "Japanese (person)",
      "nihonjin",
      "にほんじん",
      "じん (人) attaches to a country name to mean 'person from there.' アメリカじん = American.",
    ),
    // Prior-module review tap (M2 g-row) — breaks the phrase_card run
    // AND counts toward the ≥0.25 compounding-review ratio.
    vocabMcq("ja-m3-2-rev-mcq-kagi-mid", M3_2_REVIEW[1], M3_REVIEW_M2_POOL),
    vocab("ja-m3-2-v-amerikajin", "American (person)", "amerikajin", "アメリカじん"),
    // Speaking break — production direction on the just-introduced atom.
    speaking("ja-m3-2-speak-sensei", "せんせい", "Teacher"),
    vocab(
      "ja-m3-2-v-namae",
      "Name",
      "namae",
      "なまえ",
      "Pair with なんですか to ask 'what is it?' — 'なまえは なんですか.'",
    ),
    // ── Drill block: rotating-answer clozes, with non-cloze breaks
    //    between every pair so R3 (no two-adjacent-same-type) holds. ──
    cloze(
      "ja-m3-2-cloze-1",
      "がくせいです",
      "。",
      "か",
      ["か", "は", "が", "を"],
      "Are you a student?",
      "がくせいですか。",
      "か at the end turns the statement 'I am a student' into the question 'Are you a student?'",
    ),
    // sentenceMcq break — discrimination between question forms.
    sentenceMcq({
      id: "ja-m3-2-mcq-question",
      prompt: "Which one ASKS 'Are you a teacher?'",
      correctKana: "せんせいですか。",
      distractorsKana: [
        "せんせいです。",
        "せんせいかです。",
        "ですか せんせい。",
      ],
      explanation:
        "か goes at the very end, after です. The other options either drop か or place it wrong.",
    }),
    cloze(
      "ja-m3-2-cloze-2",
      "わたし",
      " せんせいです。",
      "は",
      ["は", "が", "を", "の"],
      "I am a teacher.",
      "わたしは せんせいです。",
      "は marks the topic (you'll get the formal rule in M3-4). For now: 'わたしは X です' = 'I am X.'",
    ),
    // listening break between clozes (R3 interleave).
    listeningCompSentence({
      id: "ja-m3-2-lc-nihonjin",
      audioText: "にほんじんですか",
      correctMeaningEn: "Are you Japanese?",
      distractorsEn: [
        "I am Japanese.",
        "Are you American?",
        "What is your name?",
      ],
    }),
    cloze(
      "ja-m3-2-cloze-3",
      "なまえは なんです",
      "。",
      "か",
      ["か", "は", "が", "の"],
      "What is your name?",
      "なまえは なんですか。",
      "なん = 'what.' Statement ends in か to ask.",
    ),
    // ── Production: build_sentence (translate moved to M3-5/6/7 — keeps
    //    M3-2 closer to the 18-step target without dropping a generation
    //    step entirely; build_sentence is the right fit for the first
    //    sentences a learner assembles). ──
    build(
      "ja-m3-2-build-sensei",
      "Build: 'I am a teacher.'",
      "わたしは せんせいです",
      ["わたしは", "せんせいです", "がくせいです", "ですか"],
      ["わたしは", "せんせいです"],
    ),
    // ── Review tail (M2 g-row atoms — visual MCQ + match) ──
    // M2 atoms here, M1 elsewhere so the learner sees ALL prior modules
    // across M3. Earlier listening break (-rev-lc-megane) + this tail
    // satisfy the ≥0.25 compounding-review ratio.
    vocabMcq("ja-m3-2-rev-mcq-megane", M3_2_REVIEW[0], M3_REVIEW_M2_POOL),
    reviewMatchPairs("ja-m3-2-rev", M3_2_REVIEW),
    infoStep(
      "ja-m3-2-info-end",
      "Assert + ask, unlocked",
      "Two grammar pieces — です to assert, か to ask — and five high-frequency people-words. Next: 5 more vocab worked into adjective example sentences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_2.steps);

// ----- M3-3 — More vocab + adjective EXPOSURE + listening -----------------

const M3_3_REVIEW = pickReviewAtoms("ja-m3-3-rev", M3_REVIEW_M1_POOL, 5);

export const M3_3: LessonContent = {
  id: "ja-m3-3",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Things + colors in context",
  description:
    "Five more vocab words plus exposure to color words inside です sentences. Listening + visual recall woven through.",
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m3-3-info-open",
      "Five things, some colors",
      "Five concrete nouns + three color words slipped into example sentences. We won't drill the color grammar yet — just spot the pattern: 'これは [color]です.' (This is [color].)",
    ),
    // ── Atom intros with immediate retrieval interleave ──
    vocab("ja-m3-3-v-hon", "Book", "hon", "ほん"),
    // Listening break (also a prior-module review tap on a g-row atom).
    listeningCompSentence({
      id: "ja-m3-3-rev-lc-gohan",
      audioText: "ごはん",
      correctMeaningEn: "rice/meal",
      distractorsEn: ["glasses", "key", "well/energy"],
    }),
    vocab("ja-m3-3-v-mizu", "Water", "mizu", "みず"),
    // Visual MCQ on a NEW M3 atom (ねこ is in M3 vocab AND M1 review pool —
    // emoji-bearing, fits visual MCQ; distractors from M1 pool). Pairs the
    // intro with immediate retrieval (the "encode AND apply" pattern).
    vocabMcq(
      "ja-m3-3-mcq-neko",
      { kana: "ねこ", meaningEn: "cat", emoji: "🐱", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    vocab("ja-m3-3-v-neko", "Cat", "neko", "ねこ"),
    // Production break (speaking) before the next phrase_card cluster.
    speaking("ja-m3-3-speak-neko", "ねこ", "Cat"),
    vocab("ja-m3-3-v-inu", "Dog", "inu", "いぬ"),
    // Prior-module review tap (M1 atom) — interleaved here, breaks the
    // phrase_card run AND bumps the ≥0.25 compounding-review ratio.
    vocabMcq("ja-m3-3-rev-mcq-m1-mid", M3_3_REVIEW[1], M3_REVIEW_M1_POOL),
    vocab(
      "ja-m3-3-v-tomodachi",
      "Friend",
      "tomodachi",
      "ともだち",
      "Used regardless of gender or closeness — there's no separate word for 'best friend.'",
    ),
    infoStep(
      "ja-m3-3-info-adj",
      "Adjective preview",
      "These three sentences all follow the same pattern: noun + は + adjective + です. You don't need to memorize the grammar — just notice the shape. You'll see this exact pattern hundreds of times before we formally teach adjective conjugation.",
      "grammar",
    ),
    phrase(
      "ja-m3-3-adj-blue",
      "This is blue.",
      "kore wa aoi desu",
      "これは あおいです",
      "あおい = blue. Notice the adjective sits in front of です — same slot as a noun.",
    ),
    // sentenceMcq break — pattern discrimination on the adjective skeleton.
    // Replaces the second adjective phrase_card (red) so the pointer-word
    // contrast (これ/それ/あれ) becomes a retrieval moment, not just exposure.
    sentenceMcq({
      id: "ja-m3-3-mcq-adj-red",
      prompt: "Which sentence means 'That is red.'?",
      correctKana: "それは あかいです",
      distractorsKana: [
        "これは あかいです",
        "それは あおいです",
        "あれは あかいです",
      ],
      explanation:
        "それ = 'that' (near you), これ = 'this', あれ = 'that over there'. あかい = red, あおい = blue.",
    }),
    phrase(
      "ja-m3-3-adj-big",
      "That (over there) is big.",
      "are wa ookii desu",
      "あれは おおきいです",
      "おおきい = big. Three pointer words preview: これ/それ/あれ — formal lesson next module.",
    ),
    // ── Drill block: 2 clozes split by a listening break (R3). ──
    cloze(
      "ja-m3-3-cloze-1",
      "これ",
      " ほんです。",
      "は",
      ["は", "が", "を", "に"],
      "This is a book.",
      "これは ほんです。",
      "Standard 'X is Y' statement. は as topic — formal rule next lesson.",
    ),
    // Production break — translate the adjective skeleton.
    translateStep({
      id: "ja-m3-3-translate-blue",
      promptEn: "This is blue.",
      acceptedAnswers: [
        "これは あおいです",
        "これは あおいです。",
        "これはあおいです",
        "kore wa aoi desu",
      ],
      audioText: "これは あおいです",
    }),
    cloze(
      "ja-m3-3-cloze-2",
      "それは あかいです",
      "。",
      "か",
      ["か", "は", "が", "の"],
      "Is that red?",
      "それは あかいですか。",
      "Adjective sentence + か = question. Same skeleton as a noun sentence.",
    ),
    // ── Review tail (M1 atoms) ──
    vocabMcq("ja-m3-3-rev-mcq-1", M3_3_REVIEW[0], M3_REVIEW_M1_POOL),
    reviewMatchPairs("ja-m3-3-rev", M3_3_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m3-3-info-end",
      "Vocab loaded, pattern spotted",
      "Five new words plus you've now seen the adjective pattern three times. The は you saw in the cloze? Next lesson — its own dedicated card.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_3.steps);

// ----- M3-4 — は as topic marker (Grammar Rule Card + drilled) -----------

const RULE_HA = grammarRule({
  id: "ja-m3-4-rule-ha",
  title: "は — the topic marker",
  rule:
    "は marks the TOPIC of a sentence — 'as for X, …'. It frames what the rest of the sentence is about. In introductions, descriptions, and most early sentences, は attaches to the subject (me, this, the cat).",
  examples: [
    {
      ja: "わたしは アメリカじんです。",
      romaji: "watashi wa amerikajin desu.",
      en: "I am American. ('As for me, American.')",
    },
    {
      ja: "これは ほんです。",
      romaji: "kore wa hon desu.",
      en: "This is a book.",
    },
  ],
  antiPattern: {
    ja: "わたし アメリカじんです。",
    romaji: "watashi amerikajin desu.",
    en: "(broken — missing は makes the sentence incomplete)",
    why: "Dropping は in a full sentence sounds like an unfinished thought. Spoken Japanese sometimes drops particles in fast casual speech, but in writing or careful conversation は is required to mark the topic.",
  },
  cultureNote:
    "は is written with the hiragana for 'ha' but pronounced 'wa' when used as a particle. This is a historical spelling quirk you'll see all over Japanese.",
});

const M3_4_REVIEW = pickReviewAtoms("ja-m3-4-rev", M3_REVIEW_M2_POOL, 4);

export const M3_4: LessonContent = {
  id: "ja-m3-4",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "は — the topic marker",
  description:
    "The single most-used particle in Japanese. Frame the topic, then say what's true of it.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m3-4-info-open",
      "The framing particle",
      "は is the workhorse particle of beginner Japanese — it shows up in almost every sentence. You've seen it in passing; now we drill it explicitly.",
    ),
    RULE_HA,
    // ── は cloze block, interleaved with non-cloze break-beats so it
    //    doesn't read as 5-in-a-row. R3 alternation: cloze → cloze → MCQ
    //    → cloze → listening → cloze. ──
    cloze(
      "ja-m3-4-cloze-1",
      "わたし",
      " がくせいです。",
      "は",
      ["は", "が", "を", "に"],
      "I am a student.",
      "わたしは がくせいです。",
      "Self-introduction. わたしは = 'as for me.' Then がくせいです = 'student.'",
    ),
    // sentenceMcq break — pattern discrimination between は drills.
    sentenceMcq({
      id: "ja-m3-4-mcq-topic",
      prompt: "Which sentence means 'I am a student.'?",
      correctKana: "わたしは がくせいです。",
      distractorsKana: [
        "わたしが がくせいです。",
        "わたしは がくせいですか。",
        "わたしの がくせいです。",
      ],
      explanation: "は = topic marker. が is the subject marker (later); の is possession.",
    }),
    cloze(
      "ja-m3-4-cloze-2",
      "ねこ",
      " あおいです。",
      "は",
      ["は", "が", "の", "を"],
      "The cat is blue. (a strange but grammatical statement)",
      "ねこは あおいです。",
      "Topic = the cat. Statement = is blue. Adjective pattern from last lesson.",
    ),
    // MCQ break — pick the kana sentence that matches the English meaning.
    sentenceMcq({
      id: "ja-m3-4-mcq-name",
      prompt: "Which sentence means 'What is your name?'",
      correctKana: "なまえは なんですか。",
      distractorsKana: [
        "なまえは ですか。",
        "なまえか なんです。",
        "なまえは なんです。",
      ],
      explanation:
        "Topic は 'name'; question marker か at the end. The other options drop one or the other.",
    }),
    cloze(
      "ja-m3-4-cloze-3",
      "なまえ",
      " なんですか。",
      "は",
      ["は", "が", "の", "を"],
      "What is your name?",
      "なまえは なんですか。",
      "なまえ = name. Topic = name. なんですか = what is it. Together: 'as for [your] name, what is it?'",
    ),
    // Listening break.
    listeningCompSentence({
      id: "ja-m3-4-lc-water",
      audioText: "これは みずです",
      correctMeaningEn: "This is water.",
      distractorsEn: [
        "That is water.",
        "This is a book.",
        "This is red.",
      ],
    }),
    cloze(
      "ja-m3-4-cloze-4",
      "これ",
      " みずです。",
      "は",
      ["は", "が", "を", "に"],
      "This is water.",
      "これは みずです。",
      "Topic = this. Statement = is water.",
    ),
    // Translate break between clozes (R3 interleave + production direction).
    translateStep({
      id: "ja-m3-4-translate-friend",
      promptEn: "My friend is a teacher.",
      acceptedAnswers: [
        "ともだちは せんせいです",
        "ともだちは せんせいです。",
        "ともだちはせんせいです",
        "tomodachi wa sensei desu",
      ],
      audioText: "ともだちは せんせいです",
    }),
    cloze(
      "ja-m3-4-cloze-5",
      "ともだち",
      " せんせいです。",
      "は",
      ["は", "が", "を", "の"],
      "My friend is a teacher.",
      "ともだちは せんせいです。",
      "Topic = friend. Statement = teacher.",
    ),
    // Production: speaking on the canonical self-introduction. The
    // translate step above already covered word-tile production;
    // speaking closes the production loop on a different sentence.
    speaking(
      "ja-m3-4-speak-watashi",
      "わたしは アメリカじんです",
      "I am American.",
    ),
    // ── Review tail (M2 g-row + match) ──
    vocabMcq("ja-m3-4-rev-mcq-1", M3_4_REVIEW[0], M3_REVIEW_M2_POOL),
    listeningCompSentence({
      id: "ja-m3-4-rev-lc-kagi",
      audioText: M3_4_REVIEW[1].kana,
      correctMeaningEn: M3_4_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_4_REVIEW[2].meaningEn,
        M3_4_REVIEW[3].meaningEn,
        M3_REVIEW_M1_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m3-4-rev", M3_4_REVIEW),
    infoStep(
      "ja-m3-4-info-end",
      "は internalized",
      "Five drills, one pattern: topic は statement です. You'll see this skeleton thousands of times. Next: iteration with です and か mixed in.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_4.steps);

// ----- M3-5 — Interleaved drill — は + です + か (answer-rotating) -------

const M3_5_REVIEW = pickReviewAtoms("ja-m3-5-rev", M3_REVIEW_M1_POOL, 5);

export const M3_5: LessonContent = {
  id: "ja-m3-5",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved drill — は + です + か",
  description:
    "Mixed practice. The correct particle ROTATES across clozes — no two same-answer in a row. Production sprinkled in.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m3-5-info-open",
      "Mix it up",
      "Three grammar pieces interleaved. Each cloze asks you to pick the right particle from the set you know. Watch the answer rotate — there's no pattern to memorize.",
    ),
    // ── Rotating clozes: は → か → は → か (max 2 same-answer adjacent
    //    OK per the gate, but rotate every step here for max difficulty). ──
    // Pre-rebuild this was 「は か は か は か」 with each correct answer
    // matching the surface position — the M3-5 same-answer anti-pattern
    // the spec calls out. Now answers rotate and the surface position of
    // the blank moves between mid-sentence and end-of-sentence.
    cloze(
      "ja-m3-5-cloze-1",
      "あなた",
      " せんせいですか。",
      "は",
      ["は", "が", "を", "に"],
      "Are you a teacher?",
      "あなたは せんせいですか。",
      "Topic = you. The question word か is already there — you need は.",
    ),
    // Production break (translate, hard direction).
    translateStep({
      id: "ja-m3-5-translate-friend",
      promptEn: "My friend is American.",
      acceptedAnswers: [
        "ともだちは アメリカじんです",
        "ともだちは アメリカじんです。",
        "ともだちはアメリカじんです",
        "tomodachi wa amerikajin desu",
      ],
      audioText: "ともだちは アメリカじんです",
    }),
    cloze(
      "ja-m3-5-cloze-2",
      "がくせいです",
      "。",
      "か",
      ["は", "が", "か", "を"],
      "Are you a student?",
      "がくせいですか。",
      "Statement → question via か.",
    ),
    // listening_build BREAK — assemble a sentence from word-tiles.
    listeningBuildSentence({
      id: "ja-m3-5-lb-name",
      target: "なまえは なんですか",
      tiles: ["なまえは", "なんですか", "わたしは", "ともだちは"],
      correctOrder: ["なまえは", "なんですか"],
      promptEn: "Hear it, build it: 'What is your name?'",
    }),
    cloze(
      "ja-m3-5-cloze-3",
      "ねこ",
      " ほんです。",
      "は",
      ["は", "が", "を", "に"],
      "The cat is a book. (silly but grammatical)",
      "ねこは ほんです。",
      "Topic = cat. Statement = book. Yes, the sentence is nonsense — the grammar is correct.",
    ),
    // Speaking break — production direction on the most-canonical sentence.
    speaking(
      "ja-m3-5-speak-watashi",
      "わたしは アメリカじんです",
      "I am American.",
    ),
    cloze(
      "ja-m3-5-cloze-4",
      "なまえは なんです",
      "。",
      "か",
      ["か", "は", "が", "の"],
      "What is your name?",
      "なまえは なんですか。",
      "Already has は; need か at the end to ask the question.",
    ),
    // sentenceMcq break — discrimination between は/か placements.
    sentenceMcq({
      id: "ja-m3-5-mcq-discriminate",
      prompt: "Which sentence asks 'Are you a teacher?'",
      correctKana: "あなたは せんせいですか。",
      distractorsKana: [
        "あなたは せんせいです。",
        "あなたか せんせいです。",
        "あなたは ですか せんせい。",
      ],
      explanation:
        "Topic は first, statement, then か to question. Word order is fixed.",
    }),
    cloze(
      "ja-m3-5-cloze-5",
      "ともだち",
      " アメリカじんです。",
      "は",
      ["は", "が", "を", "に"],
      "My friend is American.",
      "ともだちは アメリカじんです。",
    ),
    // listening break before final cloze.
    listeningCompSentence({
      id: "ja-m3-5-lc-are",
      audioText: "あれは いぬですか",
      correctMeaningEn: "Is that a dog?",
      distractorsEn: [
        "Is that a cat?",
        "That is a dog.",
        "This is a dog.",
      ],
    }),
    cloze(
      "ja-m3-5-cloze-6",
      "あれは いぬです",
      "。",
      "か",
      ["か", "は", "が", "を"],
      "Is that a dog?",
      "あれは いぬですか。",
      "あれ = that-over-there (preview of next module). Statement + か.",
    ),
    // ── Review tail (M1 atoms — fresh subset, different seed than M3-3) ──
    vocabMcq("ja-m3-5-rev-mcq-1", M3_5_REVIEW[0], M3_REVIEW_M1_POOL),
    listeningCompSentence({
      id: "ja-m3-5-rev-lc-1",
      audioText: M3_5_REVIEW[1].kana,
      correctMeaningEn: M3_5_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_5_REVIEW[2].meaningEn,
        M3_5_REVIEW[3].meaningEn,
        M3_5_REVIEW[4].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m3-5-rev", M3_5_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m3-5-info-end",
      "Patterns locked",
      "Mixed drills + production + a rotating-answer policy. You've now interleaved は + です + か across very different sentences and modes — that's the spaced practice that makes patterns stick.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_5.steps);

// ----- M3-6 — Production — sentence build + speaking + translate ---------

const M3_6_REVIEW = pickReviewAtoms("ja-m3-6-rev", M3_REVIEW_M2_POOL, 4);

export const M3_6: LessonContent = {
  id: "ja-m3-6",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build — putting it together",
  description:
    "Production-heavy. Five cumulative sentences across build, translate, listening_build, and your voice.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m3-6-info-open",
      "Production time",
      "Five sentences, four modes (build, translate, listening_build, speak). Tap the tiles, type the answer, hear and assemble, then say it out loud.",
    ),
    // ── 5-sentence production cluster — interleaved across modes. ──
    build(
      "ja-m3-6-s1",
      "Say: I am American.",
      "わたしは アメリカじんです",
      ["わたしは", "アメリカじんです", "がくせいです", "にほんじんです"],
      ["わたしは", "アメリカじんです"],
    ),
    // Speaking on the just-built sentence — hard direction immediately
    // (Bjork retrieval difficulty).
    speaking(
      "ja-m3-6-speak-s1",
      "わたしは アメリカじんです",
      "I am American.",
    ),
    translateStep({
      id: "ja-m3-6-translate-s2",
      promptEn: "What is your name?",
      acceptedAnswers: [
        "なまえは なんですか",
        "なまえは なんですか。",
        "なまえはなんですか",
        "namae wa nan desu ka",
      ],
      audioText: "なまえは なんですか",
    }),
    build(
      "ja-m3-6-s3",
      "Say: This is water.",
      "これは みずです",
      ["これは", "みずです", "ほんです", "それは"],
      ["これは", "みずです"],
    ),
    listeningBuildSentence({
      id: "ja-m3-6-lb-s4",
      target: "ともだちは せんせいです",
      tiles: ["ともだちは", "せんせいです", "わたしは", "がくせいです"],
      correctOrder: ["ともだちは", "せんせいです"],
      promptEn: "Hear it, build it: 'My friend is a teacher.'",
    }),
    speaking(
      "ja-m3-6-speak-s4",
      "ともだちは せんせいです",
      "My friend is a teacher.",
    ),
    build(
      "ja-m3-6-s5",
      "Say: Is that a cat?",
      "それは ねこですか",
      ["それは", "ねこですか", "これは", "いぬですか"],
      ["それは", "ねこですか"],
    ),
    // sentenceMcq retrieval check after the production block.
    sentenceMcq({
      id: "ja-m3-6-mcq-recall",
      prompt: "Which sentence asks 'Is that a dog?'",
      correctKana: "あれは いぬですか。",
      distractorsKana: [
        "あれは いぬです。",
        "あれは ねこですか。",
        "これは いぬですか。",
      ],
      explanation: "あれ = 'that over there'; いぬ = dog; か = question.",
    }),
    // ── Review tail (M2 g-row + an M1 anchor, fresh subset) ──
    listeningCompSentence({
      id: "ja-m3-6-rev-lc-g",
      audioText: M3_6_REVIEW[0].kana,
      correctMeaningEn: M3_6_REVIEW[0].meaningEn,
      distractorsEn: [
        M3_6_REVIEW[1].meaningEn,
        M3_6_REVIEW[2].meaningEn,
        M3_6_REVIEW[3].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-6-rev-mcq-g", M3_6_REVIEW[1], M3_REVIEW_M2_POOL),
    // listening break between the two vocabMcq review steps (R3 interleave).
    listeningCompSentence({
      id: "ja-m3-6-rev-lc-m1",
      audioText: M3_REVIEW_M1_POOL[5].kana,
      correctMeaningEn: M3_REVIEW_M1_POOL[5].meaningEn,
      distractorsEn: [
        M3_REVIEW_M1_POOL[7].meaningEn,
        M3_REVIEW_M1_POOL[8].meaningEn,
        M3_REVIEW_M1_POOL[9].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-6-rev-mcq-m1", M3_REVIEW_M1_POOL[6], M3_REVIEW_M1_POOL),
    reviewMatchPairs("ja-m3-6-rev", M3_6_REVIEW),
    infoStep(
      "ja-m3-6-info-end",
      "Five sentences, your voice",
      "You can introduce yourself, ask someone's name, describe objects, talk about friends, and ask yes/no questions across four production modes. That's a real first conversation toolkit.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_6.steps);

// ----- M3-7 — Mini-dialogue + cumulative review ---------------------------

const M3_7_REVIEW = pickReviewAtoms(
  "ja-m3-7-rev",
  // Pull from BOTH M1 and M2 here — the final non-test sub-lesson should
  // surface the broadest atom set the learner has built across the module.
  M3_M7_REVIEW_POOL,
  6,
);

export const M3_7: LessonContent = {
  id: "ja-m3-7",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — meeting someone",
  description:
    "A short exchange — name + nationality + polite closing. Listen, read, then say one line. Closes with a cumulative review across M1 + M2 atoms.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m3-7-info-open",
      "Drop into the scene",
      "You're at a guesthouse common room. A new arrival sits down and starts the conversation. Every word and grammar piece is something you've met across M3.",
      "culture",
    ),
    ...dialogueLesson({
      idPrefix: "ja-m3-7",
      representative: {
        phrase: "わたしは アメリカじんです",
        translation: "I am American.",
      },
      lines: [
        {
          speaker: "Stranger",
          meaningEn: "Excuse me — what's your name?",
          romaji: "sumimasen, namae wa nan desu ka",
          kana: "すみません、なまえは なんですか",
          cultureNote: "すみません opens any polite stranger interaction.",
          speakingPhrase: "なまえは なんですか",
        },
        {
          speaker: "You",
          meaningEn: "I am Spencer.",
          romaji: "watashi wa Spencer desu",
          kana: "わたしは Spencer です",
          cultureNote:
            "Foreign names are usually written in katakana — Spencer = スペンサー. For now, plain text is fine.",
          speakingPhrase: "わたしは Spencer です",
        },
        {
          speaker: "Stranger",
          meaningEn: "Are you American?",
          romaji: "amerikajin desu ka",
          kana: "アメリカじんですか",
          speakingPhrase: "アメリカじんですか",
        },
        {
          speaker: "You",
          meaningEn: "Yes. I am American.",
          romaji: "hai. watashi wa amerikajin desu",
          kana: "はい。わたしは amerikajin です",
          speakingPhrase: "わたしは アメリカじんです",
        },
      ],
      // Default representative — Spencer's note: flip to "per-line" later
      // once Whisper sentence-level accuracy is validated.
    }),
    // ── Post-dialogue comprehension check on a dialogue line. ──
    listeningCompSentence({
      id: "ja-m3-7-lc-dialogue",
      audioText: "なまえは なんですか",
      correctMeaningEn: "What is your name?",
      distractorsEn: [
        "Are you American?",
        "I am a student.",
        "Are you a teacher?",
      ],
    }),
    // ── Cumulative grammar check — answers rotate (は / か / は). ──
    cloze(
      "ja-m3-7-cloze-1",
      "あなた",
      " なまえですか。",
      "の",
      ["の", "は", "が", "を"],
      "Is it your name? (の preview — possession lands in M4)",
      "あなたの なまえですか。",
      "の is the possession particle (formal lesson in M4). Here: 'as for your name.' Notice you can still parse it by feel.",
    ),
    // sentenceMcq break — keeps R3 alternation between the two clozes.
    sentenceMcq({
      id: "ja-m3-7-mcq-recap",
      prompt: "Which sentence says 'I am a teacher.'?",
      correctKana: "わたしは せんせいです。",
      distractorsKana: [
        "わたしは せんせいですか。",
        "わたしは がくせいです。",
        "あなたは せんせいです。",
      ],
      explanation:
        "Statement (no か); せんせい = teacher. わたしは = 'I am'; あなたは = 'you are'.",
    }),
    cloze(
      "ja-m3-7-cloze-2",
      "せんせいです",
      "。",
      "か",
      ["か", "は", "が", "を"],
      "Are you the teacher?",
      "せんせいですか。",
    ),
    // Production tap — translate one cumulative sentence.
    translateStep({
      id: "ja-m3-7-translate-final",
      promptEn: "I am a student.",
      acceptedAnswers: [
        "わたしは がくせいです",
        "わたしは がくせいです。",
        "わたしはがくせいです",
        "watashi wa gakusei desu",
      ],
      audioText: "わたしは がくせいです",
    }),
    // ── Cumulative review tail — broadest set (M1 + M2). ──
    vocabMcq(
      "ja-m3-7-rev-mcq-1",
      // First emoji-bearing atom from the cumulative draw.
      M3_7_REVIEW.find((a) => Boolean(a.emoji))!,
      M3_M7_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m3-7-rev-lc-cumulative",
      audioText: M3_7_REVIEW[1].kana,
      correctMeaningEn: M3_7_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_7_REVIEW[2].meaningEn,
        M3_7_REVIEW[3].meaningEn,
        M3_7_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq(
      "ja-m3-7-rev-mcq-2",
      M3_7_REVIEW.filter((a) => Boolean(a.emoji))[1]!,
      M3_M7_REVIEW_POOL,
    ),
    reviewMatchPairs("ja-m3-7-rev", M3_7_REVIEW.slice(0, 6)),
    infoStep(
      "ja-m3-7-info-end",
      "First real conversation",
      "Four lines, real flow, plus a cumulative review across M1 + M2 atoms. You can now handle introductions in the wild. Next: the mastery test.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_7.steps);

// ----- M3-8 — Row test (mastery ★) ----------------------------------------
// PRESERVED from the prior structure. The row test is the mastery surface
// that gates module completion — its shape is contracted by ja-m3-m7-coverage
// + grammar-rule + mockCourse tests. Items expanded slightly for cumulative
// coverage of the new dense sub-lessons.

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

const M3_TEST_ITEMS: RowTestItem[] = [
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-8-mc-1",
      "わたし___ がくせいです。 (I am a student.)",
      "わたしは がくせいです",
      "は",
      ["が", "の", "を"],
      "Self-introduction. は marks the topic — 'as for me, student.'",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-8-mc-2",
      "がくせいです___。 (Are you a student?)",
      "がくせいですか",
      "か",
      ["は", "が", "の"],
      "か at the end of a statement turns it into a question.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-8-mc-3",
      "なまえ___ なんですか。 (What is your name?)",
      "なまえは なんですか",
      "は",
      ["が", "を", "の"],
      "なまえ is the topic — 'as for your name, what is it?'",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-8-mc-4",
      "ともだち___ せんせいです。 (My friend is a teacher.)",
      "ともだちは せんせいです",
      "は",
      ["が", "を", "に"],
      "ともだち = topic.",
    ),
  },
  {
    kind: "match",
    payload: {
      id: "ja-m3-8-match",
      type: "match_pairs",
      prompt: "Match each Japanese word to its meaning",
      pairs: [
        { id: "p1", source: "コーヒー", target: "coffee", sourceAnnotation: [{ surface: "コーヒー", reading: "コーヒー" }] },
        { id: "p2", source: "がくせい", target: "student", sourceAnnotation: [{ surface: "がくせい", reading: "がくせい" }] },
        { id: "p3", source: "ともだち", target: "friend", sourceAnnotation: [{ surface: "ともだち", reading: "ともだち" }] },
        { id: "p4", source: "ねこ", target: "cat", sourceAnnotation: [{ surface: "ねこ", reading: "ねこ" }] },
        { id: "p5", source: "ホテル", target: "hotel", sourceAnnotation: [{ surface: "ホテル", reading: "ホテル" }] },
        { id: "p6", source: "なまえ", target: "name", sourceAnnotation: [{ surface: "なまえ", reading: "なまえ" }] },
      ],
    } as MatchPairsStep,
  },
  {
    kind: "build",
    payload: {
      id: "ja-m3-8-build",
      type: "build_sentence",
      prompt: "Ask: What is your name?",
      targetSentence: "なまえは なんですか",
      tiles: ["なまえは", "なんですか", "どこですか", "わたしは"],
      correctOrder: ["なまえは", "なんですか"],
      granularity: "word",
      audioKey: "なまえは なんですか",
      targetAnnotation: [{ surface: "なまえは なんですか", reading: "なまえは なんですか" }],
    } as BuildSentenceStep,
  },
];

const M3_ROW_TEST: RowTestStep = {
  id: "ja-m3-8-test",
  type: "row_test",
  rowId: "m3",
  items: M3_TEST_ITEMS,
  passThreshold: 0.7,
  maxRetries: 3,
};

export const M3_8: LessonContent = {
  id: "ja-m3-8",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "M3 Mastery Test",
  description: "Cumulative test of M3 grammar + vocab. Wrong answers re-queue — no fail.",
  estimatedMinutes: 6,
  xpReward: 30,
  steps: [
    infoStep(
      "ja-m3-8-info-open",
      "Module 3 mastery",
      "Cumulative items across particles, vocab, and sentence-building. Missed items re-queue at the back. Pass once and Module 3 is mastered.",
    ),
    M3_ROW_TEST,
    infoStep(
      "ja-m3-8-info-end",
      "Module 3 complete",
      "You can introduce yourself, ask basic questions, describe things, and have a short polite exchange. M4 deepens this with possessive の and the four-way pointer system これ/それ/あれ/どれ.",
      "win",
    ),
  ],
};
