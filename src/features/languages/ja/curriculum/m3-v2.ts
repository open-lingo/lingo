/**
 * M3 v2 — First sentences (Wave 4B re-author 2026-05-18).
 *
 * Spencer's spec: ≤2 new grammar concepts per module. M3 introduces:
 *   - です + か (combined card — the polite copula + question particle)
 *   - は as topic marker (no が contrast — が deferred to M6 via existence)
 *
 * Adjective EXPOSURE in example sentences (これは あおいです, それは
 * あかいです, あれは おおきいです) — no formal adjective lesson.
 * Pattern-match only.
 *
 * 2026-05-18 Wave-4B re-author (per docs/wave-4b-dispatch-briefs.md
 * Agent B-3 + docs/wave-4-m3-m7-reauthor-2026-05-18.md §2 17-item
 * standards checklist):
 *   - Re-densified ALL 7 content sub-lessons to 20-22 steps (aim 21).
 *   - M3-1: katakana load de-scoped to 2 inline loanwords (コーヒー,
 *     タクシー) per tester T10; balance is review + sentence-pattern
 *     sprinkle (`コーヒー です` / `タクシー です`).
 *   - M3-4: `assertAnswerRotation(steps, minDistinct=2)` — cloze block
 *     rotates between は / か. The earlier minDistinct=3 attempt drilled
 *     です in a particle-cloze slot (negative-testing risk per Roediger
 *     & Marsh 2005); cloze-6-desu was replaced with a forced sentence_build
 *     in the 2026-05-21 rewrite. See `docs/lesson-authoring-guide.md`
 *     §13.4 for the pattern.
 *   - M3-7 dialogue closer: rewritten with the new `dialogueListen()`
 *     factory (3 turns + 3 comprehension MCQs). Hardcoded "Spencer"
 *     replaced with generic "ケン" (Ken) so the lesson is learner-
 *     name agnostic.
 *   - Every `selfExplain` placed at position N-1 of its drill cluster
 *     (CLT expertise-reversal — after 2-3 commits, not immediately).
 *   - `selfExplain` distractors = rule-citing-but-wrong (no "X and Y
 *     mean exactly the same thing" dismiss-on-sight bait).
 *   - Atoms previously at n=1 (`にほんじん`, `アメリカじん`, `あに`,
 *     `なまえです`) re-exposed across M3-5 / M3-6 / M3-7 carriers +
 *     row-test for compounding-review ≥3 occurrences.
 *   - Identity-anchored win cards (Cialdini Unity — "you can now…").
 *   - Canonical emoji from docs/n5-vocab-emoji-reference-2026-05-18.md
 *     for every emoji-bearing atom.
 *   - 8-lesson id list preserved (mockLessons.ts + 3 test files
 *     reference ja-m3-1..ja-m3-8 by id).
 *
 * Lesson list (8 lessons):
 *   M3-1  Katakana intro + 2 loanwords + sentence-pattern sprinkle + review
 *   M3-2  です + か (Grammar Rule) + people vocab + drills + selfExplain
 *   M3-3  More vocab + adjective EXPOSURE + listening
 *   M3-4  は as topic marker (Grammar Rule) + rotated-particle drills
 *   M3-5  Interleaved drill — は + です + か (n=1 atom re-exposure)
 *   M3-6  Production — sentence build + speaking + translate
 *   M3-7  Dialogue closer with dialogue_listen + cumulative review
 *   M3-8  Row test (mastery ★)
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
  vocabMcq,
  assertNoSameAnswerCluster,
  assertAnswerRotation,
  assertNoConsecutiveSame,
  slotFor,
} from "@/features/languages/ja/grammarHelpers";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  assertPassiveCardsHaveFollowup,
} from "@/features/lesson/data/_stepAssertions";
import type {
  BuildSentenceStep,
  MatchPairsStep,
  MultipleChoiceStep,
  RowTestItem,
  RowTestStep,
} from "@/features/lesson/types";

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

// ----- M3-1 — Katakana SYSTEM intro + 2 loanwords + sprinkle + review ----

const M3_1_REVIEW = pickReviewAtoms("ja-m3-1-rev", M3_REVIEW_M1_POOL, 8);
// M3-1 has no prior-module-grammar to drill, so the review tail is pure
// vocab MCQ + match_pairs on M1 atoms. Per Wave-4B brief (T10): the
// previous 5-loanword load was demoted — only コーヒー + タクシー stay
// inline; the rest of the density target is hit via prior-pool review +
// a brief sentence-pattern sprinkle (X です) that re-uses the loanwords
// without re-introducing them.

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 1/2 — Meet katakana + two loanwords + first です pattern
 * ──────────────────────────────────────────────────────────────────────── */

export const M3_1_1: LessonContent = {
  id: "ja-m3-1-1",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Katakana — Intro",
  description:
    "Meet katakana. Two loanwords (coffee, taxi) introduced via context, then your first X です sentence.",
  estimatedMinutes: 5,
  xpReward: 10,
  steps: [
    infoStep(
      "ja-m3-1-info-system",
      "Katakana — hiragana's twin",
      "Katakana (カタカナ) has the same 46 sounds as hiragana — just different, more angular shapes. It's used for loanwords (コーヒー = coffee), foreign names, and emphasis. Romaji appears above new katakana so you can read by sound while the shapes sink in.",
      "culture",
    ),
    infoStep(
      "ja-m3-1-info-chouon",
      "The long-vowel mark: ー",
      "In katakana, ー stretches the vowel before it. コーヒー is 'koo-hii' (long o, long i) — not 'ko-hi.' You'll see ー constantly in loanwords. Think of it as 'hold that note.'",
      "grammar",
    ),
    // First encounter: learner sees "Coffee" and picks the katakana from
    // tiles. Only one tile makes sense — figuroutable from the English.
    build(
      "ja-m3-1-intro-coffee",
      "Coffee",
      "コーヒー",
      ["コーヒー", "タクシー", "ビール"],
      ["コーヒー"],
    ),
    listeningCompSentence({
      id: "ja-m3-1-lc-coffee",
      audioText: "コーヒー",
      correctMeaningEn: "coffee",
      distractorsEn: ["tea", "milk", "water"],
    }),
    vocabMcq(
      "ja-m3-1-mcq-coffee",
      { kana: "コーヒー", meaningEn: "coffee", emoji: "☕", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    speaking("ja-m3-1-speak-coffee-mid", "コーヒー", "Coffee"),
    // First です sentence — learner already knows コーヒー, です is the
    // only unknown tile. Prompt makes it figuroutable.
    build(
      "ja-m3-1-intro-coffee-desu",
      "It's coffee. (noun + です = polite 'is')",
      "コーヒー です",
      ["コーヒー", "です", "タクシー", "か"],
      ["コーヒー", "です"],
    ),
    // Second loanword — same pattern.
    build(
      "ja-m3-1-intro-taxi",
      "Taxi",
      "タクシー",
      ["タクシー", "コーヒー", "ホテル"],
      ["タクシー"],
    ),
    listeningCompSentence({
      id: "ja-m3-1-lc-taxi",
      audioText: "タクシー",
      correctMeaningEn: "taxi",
      distractorsEn: ["coffee", "hotel", "beer"],
    }),
    vocabMcq(
      "ja-m3-1-mcq-taxi",
      { kana: "タクシー", meaningEn: "taxi", emoji: "🚕", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    speaking("ja-m3-1-speak-taxi", "タクシー", "Taxi"),
    // Second です sentence — same skeleton, different noun.
    build(
      "ja-m3-1-intro-taxi-desu",
      "It's a taxi.",
      "タクシー です",
      ["タクシー", "です", "コーヒー", "か"],
      ["タクシー", "です"],
    ),
    sentenceMcq({
      id: "ja-m3-1-mcq-taxi-desu",
      prompt: "Which sentence means 'It's a taxi.'?",
      correctKana: "タクシー です。",
      distractorsKana: [
        "コーヒー です。",
        "タクシー ですか。",
        "これは タクシー です。",
      ],
      explanation:
        "タクシー = taxi; です asserts politely. No か = statement, not question.",
    }),
    build(
      "ja-m3-1-translate-coffee",
      "It's coffee.",
      "コーヒー です",
      ["コーヒー", "です", "タクシー"],
      ["コーヒー", "です"],
    ),
    // Review tail — M1 atoms
    speaking("ja-m3-1-rev-speak-a", M3_1_REVIEW[0].kana, M3_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-1-rev-lc-a",
      audioText: M3_1_REVIEW[1].kana,
      correctMeaningEn: M3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_1_REVIEW[2].meaningEn,
        M3_1_REVIEW[3].meaningEn,
        M3_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-1-rev-mcq-b", M3_1_REVIEW[5], M3_REVIEW_M1_POOL),
    infoStep(
      "ja-m3-1-1-info-end",
      "You can now read two katakana loanwords",
      "Katakana コーヒー (coffee) and タクシー (taxi), the long-vowel mark ー, and your first X です polite statement pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_1_1.steps);
assertNoConsecutiveSame(M3_1_1.steps);

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 2/2 — Practice katakana loanwords in varied contexts + review
 * ──────────────────────────────────────────────────────────────────────── */

export const M3_1_2: LessonContent = {
  id: "ja-m3-1-2",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Katakana — Practice",
  description:
    "Practice coffee + taxi in varied retrieval modes. Build です sentences from hearing. Review M1 kana.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    listeningBuildSentence({
      id: "ja-m3-1-lbs-coffee-desu",
      target: "コーヒー です",
      tiles: ["コーヒー", "です", "タクシー", "か"],
      correctOrder: ["コーヒー", "です"],
      promptEn: "It's coffee.",
    }),
    vocabMcq("ja-m3-1-rev-mcq-1", M3_1_REVIEW[0], M3_REVIEW_M1_POOL),
    speaking("ja-m3-1-speak-taxi-desu", "タクシー です", "It's a taxi."),
    listeningCompSentence({
      id: "ja-m3-1-lc-coffee-desu",
      audioText: "コーヒー です",
      correctMeaningEn: "It's coffee.",
      distractorsEn: ["It's a taxi.", "Is it coffee?", "Coffee, please."],
    }),
    sentenceMcq({
      id: "ja-m3-1-mcq-coffee-desu",
      prompt: "Which sentence means 'It's coffee.'?",
      correctKana: "コーヒー です。",
      distractorsKana: [
        "タクシー です。",
        "コーヒー ですか。",
        "これは コーヒー です。",
      ],
      explanation:
        "コーヒー = coffee; です makes it a polite statement. No か = not a question.",
    }),
    speaking("ja-m3-1-speak-coffee-desu", "コーヒー です", "It's coffee."),
    build(
      "ja-m3-1-translate-taxi",
      "It's a taxi.",
      "タクシー です",
      ["タクシー", "です", "コーヒー"],
      ["タクシー", "です"],
    ),
    listeningCompSentence({
      id: "ja-m3-1-lc-taxi-desu",
      audioText: "タクシー です",
      correctMeaningEn: "It's a taxi.",
      distractorsEn: ["It's coffee.", "Is it a taxi?", "Taxi, please."],
    }),
    listeningBuildSentence({
      id: "ja-m3-1-lbs-taxi-desu",
      target: "タクシー です",
      tiles: ["タクシー", "です", "コーヒー", "か"],
      correctOrder: ["タクシー", "です"],
      promptEn: "It's a taxi.",
    }),
    speaking("ja-m3-1-speak-taxi", "タクシー", "Taxi"),
    sentenceMcq({
      id: "ja-m3-1-mcq-which-taxi",
      prompt: "Which one means 'taxi'?",
      correctKana: "タクシー",
      distractorsKana: [
        "コーヒー",
        "ビール",
        "ホテル",
      ],
      explanation: "タクシー = taxi. コーヒー = coffee.",
    }),
    // Review tail — M1 atoms
    speaking("ja-m3-1-rev-speak-2", M3_1_REVIEW[2].kana, M3_1_REVIEW[2].meaningEn),
    listeningCompSentence({
      id: "ja-m3-1-rev-lc-1",
      audioText: M3_1_REVIEW[3].kana,
      correctMeaningEn: M3_1_REVIEW[3].meaningEn,
      distractorsEn: [
        M3_1_REVIEW[4].meaningEn,
        M3_1_REVIEW[5].meaningEn,
        M3_1_REVIEW[6].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-1-rev-mcq-3", M3_1_REVIEW[6], M3_REVIEW_M1_POOL),
    vocabMcq("ja-m3-1-rev-mcq-4", M3_1_REVIEW[4], M3_REVIEW_M1_POOL),
    reviewMatchPairs("ja-m3-1-rev", M3_1_REVIEW.slice(0, 5)),
    build(
      "ja-m3-1-final-coffee",
      "It's coffee.",
      "コーヒー です",
      ["コーヒー", "です", "タクシー", "か"],
      ["コーヒー", "です"],
    ),
    infoStep(
      "ja-m3-1-2-info-end",
      "You can now order a coffee in katakana",
      "Two katakana loanwords — コーヒー and タクシー — plus the X です pattern for polite statements.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_1_2.steps);
assertNoConsecutiveSame(M3_1_2.steps);


// ----- M3-2 — です + か (combined Grammar Rule Card + drills) ------------

const RULE_DESU_KA = grammarRule({
  id: "ja-m3-2-rule-desu-ka",
  title: "です + か — the polite ender and the question flip",
  rule:
    "です is a polite sentence-ender. Attach it to a noun or adjective to mark the sentence as formal — it doesn't carry meaning on its own, it carries register. Then add か right after です to turn that polite statement into a yes/no question. No tone-rise needed (unlike English questions).",
  examples: [
    {
      ja: "わたしは がくせいです。",
      romaji: "watashi wa gakusei desu.",
      en: "I am a student. (polite statement — です marks the formal register)",
    },
    {
      ja: "がくせいですか。",
      romaji: "gakusei desu ka.",
      en: "Are you a student? (same polite statement + か = question)",
    },
  ],
  antiPattern: {
    ja: "わたしは がくせい。",
    romaji: "watashi wa gakusei.",
    en: "(grammatical, but casual — fine with friends, abrupt with a stranger)",
    why: "Dropping です doesn't break the sentence — it just drops the politeness register. Fine with close friends, abrupt with the shop staff who asked your name. Polite-form is the default register for travelers and learners until you know someone well.",
  },
  cultureNote:
    "The 'u' in です is almost silent — 'des' more than 'desu.' Both pronunciations are accepted; the dropped-u version is standard in Tokyo. Japanese questions are said with a flat tone — a rising tone sounds aggressive or surprised.",
});

const M3_2_REVIEW = pickReviewAtoms("ja-m3-2-rev", M3_REVIEW_M2_POOL, 4);

/* ────────────────────────────────────────────────────────────────────────
 * M3-2 Sub-lesson 1/2 — Grammar rule + people vocab via figuroutable builds
 * ──────────────────────────────────────────────────────────────────────── */

export const M3_2_1: LessonContent = {
  id: "ja-m3-2-1",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "です + か — your first sentences",
  description:
    "Polite 'is/are' (です) and the question particle か. Five people-words introduced via context.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    RULE_DESU_KA,
    // がくせい — figuroutable from rule card example "わたしは がくせいです"
    build(
      "ja-m3-2-1-intro-gakusei",
      "I am a student.",
      "わたしは がくせいです",
      ["わたし", "は", "がくせい", "です", "せんせい"],
      ["わたし", "は", "がくせい", "です"],
    ),
    vocabMcq(
      "ja-m3-2-1-mcq-gakusei",
      { kana: "がくせい", meaningEn: "student", emoji: "🎓", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    // せんせい — single-tile pick, contrast with がくせい
    build(
      "ja-m3-2-1-intro-sensei",
      "Teacher",
      "せんせい",
      ["せんせい", "がくせい", "ともだち"],
      ["せんせい"],
    ),
    speaking("ja-m3-2-1-speak-sensei", "せんせい", "Teacher"),
    // にほんじん — sentence with one unknown
    build(
      "ja-m3-2-1-intro-nihonjin",
      "I am Japanese.",
      "わたしは にほんじんです",
      ["わたし", "は", "にほんじん", "です", "アメリカじん"],
      ["わたし", "は", "にほんじん", "です"],
    ),
    listeningCompSentence({
      id: "ja-m3-2-1-lc-nihonjin",
      audioText: "にほんじん",
      correctMeaningEn: "Japanese (person)",
      distractorsEn: ["American (person)", "student", "teacher"],
    }),
    // アメリカじん — single-tile pick, contrast with にほんじん
    build(
      "ja-m3-2-1-intro-amerikajin",
      "American (person)",
      "アメリカじん",
      ["アメリカじん", "にほんじん", "がくせい"],
      ["アメリカじん"],
    ),
    speaking("ja-m3-2-1-speak-amerikajin", "アメリカじん", "American (person)"),
    // なまえ — single-tile pick
    build(
      "ja-m3-2-1-intro-namae",
      "Name",
      "なまえ",
      ["なまえ", "せんせい", "がくせい"],
      ["なまえ"],
    ),
    vocabMcq(
      "ja-m3-2-1-mcq-namae",
      { kana: "なまえ", meaningEn: "name", emoji: "🪪", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    // First か drill — figuroutable from rule card
    cloze(
      "ja-m3-2-1-cloze-ka",
      "がくせいです",
      "。",
      "か",
      ["か", "は", "が", "を"],
      "Are you a student?",
      "がくせいですか。",
      "か at the end turns the statement into a question.",
    ),
    sentenceMcq({
      id: "ja-m3-2-1-mcq-question",
      prompt: "Which one ASKS 'Are you a teacher?'",
      correctKana: "せんせいですか。",
      distractorsKana: [
        "せんせいです。",
        "せんせいかです。",
        "せんせいの ですか。",
      ],
      explanation:
        "か goes at the very end, after です. 'せんせいです' is a statement; 'せんせいかです' puts か in the wrong slot.",
    }),
    build(
      "ja-m3-2-1-build-nihonjin-q",
      "Are you Japanese?",
      "にほんじんですか",
      ["にほんじん", "です", "か", "は", "アメリカじん"],
      ["にほんじん", "です", "か"],
    ),
    speaking(
      "ja-m3-2-1-speak-gakusei-desu",
      "わたしは がくせいです",
      "I am a student.",
    ),
    // Review tail
    speaking("ja-m3-2-1-rev-speak-a", M3_2_REVIEW[0].kana, M3_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-2-1-rev-lc-a",
      audioText: M3_2_REVIEW[1].kana,
      correctMeaningEn: M3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_2_REVIEW[2].meaningEn,
        M3_2_REVIEW[3].meaningEn,
        M3_REVIEW_M1_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m3-2-1-rev", M3_2_REVIEW),
    infoStep(
      "ja-m3-2-1-info-end",
      "You can now make polite statements and questions",
      "です (polite copula) and か (question particle), plus five people-words: がくせい, せんせい, にほんじん, アメリカじん, and なまえ.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_2_1.steps);
assertNoConsecutiveSame(M3_2_1.steps);

/* ────────────────────────────────────────────────────────────────────────
 * M3-2 Sub-lesson 2/2 — Varied retrieval on people vocab + です/か drills
 * ──────────────────────────────────────────────────────────────────────── */

const M3_2_2_REVIEW = pickReviewAtoms("ja-m3-2-2-rev", M3_REVIEW_M1_POOL, 5);

export const M3_2_2: LessonContent = {
  id: "ja-m3-2-2",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "です + か — drill & produce",
  description:
    "Varied retrieval on people vocab. Cloze drills rotate は and か. Production ramps up.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    listeningBuildSentence({
      id: "ja-m3-2-2-lbs-gakusei",
      target: "わたしは がくせいです",
      tiles: ["わたし", "は", "がくせい", "です", "せんせい", "か"],
      correctOrder: ["わたし", "は", "がくせい", "です"],
      promptEn: "I am a student.",
    }),
    cloze(
      "ja-m3-2-2-cloze-ha",
      "わたし",
      " せんせいです。",
      "は",
      ["は", "が", "を", "の"],
      "I am a teacher.",
      "わたしは せんせいです。",
      "は marks the topic. 'わたしは X です' = 'I am X.'",
    ),
    vocabMcq(
      "ja-m3-2-2-mcq-sensei",
      { kana: "せんせい", meaningEn: "teacher", emoji: "🧑‍🏫", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    listeningCompSentence({
      id: "ja-m3-2-2-lc-nihonjin",
      audioText: "にほんじんですか",
      correctMeaningEn: "Are you Japanese?",
      distractorsEn: [
        "I am Japanese.",
        "Are you American?",
        "What is your name?",
      ],
    }),
    cloze(
      "ja-m3-2-2-cloze-ka",
      "なまえは なんです",
      "。",
      "か",
      ["か", "は", "が", "の"],
      "What is your name?",
      "なまえは なんですか。",
      "なん = 'what.' Statement ends in か to ask.",
    ),
    sentenceMcq({
      id: "ja-m3-2-2-mcq-statement-vs-q",
      prompt: "Which is a STATEMENT (not a question)?",
      correctKana: "わたしは アメリカじんです。",
      distractorsKana: [
        "アメリカじんですか。",
        "にほんじんですか。",
        "せんせいですか。",
      ],
      explanation:
        "Statements end with です (no か). All other options end with か = question.",
    }),
    speaking(
      "ja-m3-2-2-speak-watashi-sensei",
      "わたしは せんせいです",
      "I am a teacher.",
    ),
    build(
      "ja-m3-2-2-build-amerikajin",
      "I am American.",
      "わたしは アメリカじんです",
      ["わたし", "は", "アメリカじん", "です", "にほんじん"],
      ["わたし", "は", "アメリカじん", "です"],
    ),
    selfExplain({
      id: "ja-m3-2-2-self-ka",
      anchorLabel: "You picked か in: がくせいです＿",
      anchorAudioText: "がくせいですか",
      question: "Why is か correct at the end of this sentence?",
      rule: { text: "か turns the statement into a yes/no question." },
      surface: { text: "か always follows です in any sentence." },
      distractor: {
        text: "か marks the speaker as the subject of the sentence.",
      },
      ruleExplanation:
        "か is the question particle — it lives at the very end and converts statement to question. It is NOT a subject marker (that's が, coming in M6).",
    }),
    listeningCompSentence({
      id: "ja-m3-2-2-lc-namae",
      audioText: "なまえは なんですか",
      correctMeaningEn: "What is your name?",
      distractorsEn: [
        "I am a student.",
        "Are you a teacher?",
        "This is a name.",
      ],
    }),
    build(
      "ja-m3-2-2-build-nihonjin",
      "I am Japanese.",
      "わたしは にほんじんです",
      ["わたし", "は", "にほんじん", "です", "がくせい"],
      ["わたし", "は", "にほんじん", "です"],
    ),
    speaking(
      "ja-m3-2-2-speak-amerikajin-q",
      "アメリカじんですか",
      "Are you American?",
    ),
    cloze(
      "ja-m3-2-2-cloze-ha-2",
      "ともだち",
      " がくせいです。",
      "は",
      ["は", "が", "を", "に"],
      "My friend is a student.",
      "ともだちは がくせいです。",
      "Topic = friend. Statement = student.",
    ),
    // Review tail
    speaking("ja-m3-2-2-rev-speak-1", M3_2_2_REVIEW[0].kana, M3_2_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-2-2-rev-lc-1",
      audioText: M3_2_2_REVIEW[1].kana,
      correctMeaningEn: M3_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_2_2_REVIEW[2].meaningEn,
        M3_2_2_REVIEW[3].meaningEn,
        M3_2_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-2-2-rev-mcq-2", M3_2_2_REVIEW[3], M3_REVIEW_M1_POOL),
    reviewMatchPairs("ja-m3-2-2-rev", M3_2_2_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m3-2-2-info-end",
      "You can now introduce yourself and ask someone's name",
      "Cloze-drilling は and か in rotation, self-explaining why か makes a question, and building sentences like わたしは アメリカじんです.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_2_2.steps);
assertAnswerRotation(M3_2_2.steps, 2);
assertNoConsecutiveSame(M3_2_2.steps);

// ----- M3-3 — More vocab + adjective EXPOSURE + listening -----------------

const M3_3_REVIEW = pickReviewAtoms("ja-m3-3-rev", M3_REVIEW_M1_POOL, 6);

/* ────────────────────────────────────────────────────────────────────────
 * M3-3 Sub-lesson 1/2 — Five concrete nouns via figuroutable builds
 * ──────────────────────────────────────────────────────────────────────── */

export const M3_3_1: LessonContent = {
  id: "ja-m3-3-1",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Things — book, water, cat, dog, friend",
  description:
    "Five concrete nouns introduced in context via single-tile picks and one-unknown sentences.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    build(
      "ja-m3-3-1-intro-hon",
      "Book",
      "ほん",
      ["ほん", "みず", "ねこ"],
      ["ほん"],
    ),
    vocabMcq(
      "ja-m3-3-1-mcq-hon",
      { kana: "ほん", meaningEn: "book", emoji: "📖", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    build(
      "ja-m3-3-1-intro-mizu",
      "Water",
      "みず",
      ["みず", "ほん", "いぬ"],
      ["みず"],
    ),
    vocabMcq(
      "ja-m3-3-1-mcq-mizu",
      { kana: "みず", meaningEn: "water", emoji: "💧", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    speaking("ja-m3-3-1-speak-mizu", "みず", "Water"),
    build(
      "ja-m3-3-1-intro-neko",
      "Cat",
      "ねこ",
      ["ねこ", "いぬ", "ほん"],
      ["ねこ"],
    ),
    vocabMcq(
      "ja-m3-3-1-mcq-neko",
      { kana: "ねこ", meaningEn: "cat", emoji: "🐱", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    build(
      "ja-m3-3-1-intro-inu",
      "Dog",
      "いぬ",
      ["いぬ", "ねこ", "みず"],
      ["いぬ"],
    ),
    vocabMcq(
      "ja-m3-3-1-mcq-inu",
      { kana: "いぬ", meaningEn: "dog", emoji: "🐕", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    speaking("ja-m3-3-1-speak-neko", "ねこ", "Cat"),
    build(
      "ja-m3-3-1-intro-tomodachi",
      "Friend",
      "ともだち",
      ["ともだち", "がくせい", "せんせい"],
      ["ともだち"],
    ),
    vocabMcq(
      "ja-m3-3-1-mcq-tomodachi",
      { kana: "ともだち", meaningEn: "friend", emoji: "👫", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    build(
      "ja-m3-3-1-build-hon-desu",
      "This is a book.",
      "これは ほんです",
      ["これ", "は", "ほん", "です", "みず"],
      ["これ", "は", "ほん", "です"],
    ),
    listeningCompSentence({
      id: "ja-m3-3-1-lc-neko-desu",
      audioText: "これは ねこです",
      correctMeaningEn: "This is a cat.",
      distractorsEn: ["This is a dog.", "This is water.", "This is a book."],
    }),
    speaking("ja-m3-3-1-speak-tomodachi", "ともだち", "Friend"),
    // Review tail
    speaking("ja-m3-3-1-rev-speak-1", M3_3_REVIEW[0].kana, M3_3_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-3-1-rev-lc-1",
      audioText: M3_3_REVIEW[1].kana,
      correctMeaningEn: M3_3_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_3_REVIEW[2].meaningEn,
        M3_3_REVIEW[3].meaningEn,
        M3_3_REVIEW[4].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m3-3-1-rev", M3_3_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m3-3-1-info-end",
      "You can now name five everyday things",
      "Five concrete nouns — ほん (book), みず (water), ねこ (cat), いぬ (dog), and ともだち (friend) — used in これは X です sentences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_3_1.steps);
assertNoConsecutiveSame(M3_3_1.steps);

/* ────────────────────────────────────────────────────────────────────────
 * M3-3 Sub-lesson 2/2 — Adjective exposure + varied retrieval on nouns
 * ──────────────────────────────────────────────────────────────────────── */

const M3_3_2_REVIEW = pickReviewAtoms("ja-m3-3-2-rev", M3_REVIEW_M2_POOL, 4);

export const M3_3_2: LessonContent = {
  id: "ja-m3-3-2",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Things + colors in context",
  description:
    "Practice nouns in sentences. Adjective exposure via pattern-matching.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    infoStep(
      "ja-m3-3-2-info-adj",
      "Adjective preview — just spot the shape",
      "Same skeleton: [topic] は [word] です. Colors fit the same slot as nouns. No new rule — pattern-match only: これは あおいです = 'This is blue.'",
      "grammar",
    ),
    build(
      "ja-m3-3-2-build-mizu-desu",
      "This is water.",
      "これは みずです",
      ["これ", "は", "みず", "です", "ほん", "ねこ"],
      ["これ", "は", "みず", "です"],
    ),
    sentenceMcq({
      id: "ja-m3-3-2-mcq-adj-red",
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
    speaking("ja-m3-3-2-speak-inu", "いぬ", "Dog"),
    build(
      "ja-m3-3-2-build-blue",
      "This is blue.",
      "これは あおいです",
      ["これ", "は", "あおい", "です", "あかい"],
      ["これ", "は", "あおい", "です"],
    ),
    cloze(
      "ja-m3-3-2-cloze-ha",
      "これ",
      " ほんです。",
      "は",
      ["は", "が", "を", "に"],
      "This is a book.",
      "これは ほんです。",
      "Standard 'X is Y' statement. は marks the topic.",
    ),
    listeningCompSentence({
      id: "ja-m3-3-2-lc-water",
      audioText: "これは みずです",
      correctMeaningEn: "This is water.",
      distractorsEn: [
        "That is water.",
        "This is a book.",
        "This is red.",
      ],
    }),
    cloze(
      "ja-m3-3-2-cloze-ka",
      "それは あかいです",
      "。",
      "か",
      ["か", "は", "が", "の"],
      "Is that red?",
      "それは あかいですか。",
      "Adjective sentence + か = question.",
    ),
    vocabMcq(
      "ja-m3-3-2-mcq-neko",
      { kana: "ねこ", meaningEn: "cat", emoji: "🐱", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    build(
      "ja-m3-3-2-build-tomodachi",
      "My friend is a cat.",
      "ともだちは ねこです",
      ["ともだち", "は", "ねこ", "です", "いぬ"],
      ["ともだち", "は", "ねこ", "です"],
    ),
    speaking(
      "ja-m3-3-2-speak-tomodachi-neko",
      "ともだちは ねこです",
      "My friend is a cat.",
    ),
    listeningBuildSentence({
      id: "ja-m3-3-2-lbs-inu",
      target: "これは いぬです",
      tiles: ["これ", "は", "いぬ", "です", "ねこ", "か"],
      correctOrder: ["これ", "は", "いぬ", "です"],
      promptEn: "This is a dog.",
    }),
    sentenceMcq({
      id: "ja-m3-3-2-mcq-big",
      prompt: "Which sentence means 'That (over there) is big.'?",
      correctKana: "あれは おおきいです。",
      distractorsKana: [
        "これは おおきいです。",
        "あれは あおいです。",
        "それは おおきいです。",
      ],
      explanation: "あれ = that over there. おおきい = big.",
    }),
    // Review tail
    speaking("ja-m3-3-2-rev-speak-1", M3_3_2_REVIEW[0].kana, M3_3_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-3-2-rev-lc-1",
      audioText: M3_3_2_REVIEW[1].kana,
      correctMeaningEn: M3_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_3_2_REVIEW[2].meaningEn,
        M3_3_2_REVIEW[3].meaningEn,
        M3_REVIEW_M1_POOL[1].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-3-2-rev-mcq-2", M3_3_2_REVIEW[2], M3_REVIEW_M2_POOL),
    reviewMatchPairs("ja-m3-3-2-rev", M3_3_2_REVIEW),
    infoStep(
      "ja-m3-3-2-info-end",
      "You can now spot adjectives in sentences",
      "Adjective exposure via pattern-matching: あおい (blue), あかい (red), おおきい (big) dropped into the familiar これは X です skeleton.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_3_2.steps);
assertAnswerRotation(M3_3_2.steps, 2);
assertNoConsecutiveSame(M3_3_2.steps);

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

/* ────────────────────────────────────────────────────────────────────────
 * M3-4 Sub-lesson 1/2 — は grammar rule + initial cloze drilling
 * ──────────────────────────────────────────────────────────────────────── */

export const M3_4_1: LessonContent = {
  id: "ja-m3-4-1",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "は — the topic marker",
  description:
    "The single most-used particle. Frame the topic, then say what's true of it.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    RULE_HA,
    cloze(
      "ja-m3-4-1-cloze-1",
      "わたし",
      " がくせいです。",
      "は",
      ["は", "が", "を", "に"],
      "I am a student.",
      "わたしは がくせいです。",
      "Self-introduction. わたしは = 'as for me.'",
    ),
    sentenceMcq({
      id: "ja-m3-4-1-mcq-topic",
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
      "ja-m3-4-1-cloze-2",
      "ねこは あおいです",
      "。",
      "か",
      ["か", "は", "が", "の"],
      "Is the cat blue?",
      "ねこは あおいですか。",
      "Statement + か = question.",
    ),
    listeningCompSentence({
      id: "ja-m3-4-1-lc-water",
      audioText: "これは みずです",
      correctMeaningEn: "This is water.",
      distractorsEn: [
        "That is water.",
        "This is a book.",
        "This is red.",
      ],
    }),
    cloze(
      "ja-m3-4-1-cloze-3",
      "これ",
      " みずです。",
      "は",
      ["は", "が", "を", "に"],
      "This is water.",
      "これは みずです。",
      "Topic = this. Statement = is water.",
    ),
    speaking(
      "ja-m3-4-1-speak-amerikajin",
      "わたしは アメリカじんです",
      "I am American.",
    ),
    build(
      "ja-m3-4-1-build-friend",
      "My friend is a teacher.",
      "ともだちは せんせいです",
      ["ともだち", "は", "せんせい", "です", "がくせい"],
      ["ともだち", "は", "せんせい", "です"],
    ),
    cloze(
      "ja-m3-4-1-cloze-4",
      "なまえは なんです",
      "。",
      "か",
      ["か", "は", "が", "の"],
      "What is your name?",
      "なまえは なんですか。",
      "Statement structure + final か to ask.",
    ),
    sentenceMcq({
      id: "ja-m3-4-1-mcq-name",
      prompt: "Which sentence means 'What is your name?'",
      correctKana: "なまえは なんですか。",
      distractorsKana: [
        "なまえは ですか。",
        "なまえか なんです。",
        "なまえは なんです。",
      ],
      explanation:
        "Topic は + question marker か at the end.",
    }),
    cloze(
      "ja-m3-4-1-cloze-5",
      "ともだち",
      " せんせいです。",
      "は",
      ["は", "が", "を", "の"],
      "My friend is a teacher.",
      "ともだちは せんせいです。",
      "Topic = friend. Statement = teacher.",
    ),
    listeningCompSentence({
      id: "ja-m3-4-1-lc-tomodachi",
      audioText: "ともだちは アメリカじんです",
      correctMeaningEn: "My friend is American.",
      distractorsEn: [
        "I am American.",
        "My older brother is American.",
        "Are you American?",
      ],
    }),
    build(
      "ja-m3-4-1-build-dog",
      "That over there is a dog.",
      "あれは いぬです",
      ["あれ", "は", "いぬ", "です", "これ", "ねこ"],
      ["あれ", "は", "いぬ", "です"],
    ),
    speaking(
      "ja-m3-4-1-speak-kore-hon",
      "これは ほんです",
      "This is a book.",
    ),
    // Review tail
    speaking("ja-m3-4-1-rev-speak-1", M3_4_REVIEW[0].kana, M3_4_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-4-1-rev-lc-1",
      audioText: M3_4_REVIEW[1].kana,
      correctMeaningEn: M3_4_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_4_REVIEW[2].meaningEn,
        M3_4_REVIEW[3].meaningEn,
        M3_REVIEW_M1_POOL[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-4-1-rev-mcq-2", M3_4_REVIEW[2], M3_REVIEW_M2_POOL),
    reviewMatchPairs("ja-m3-4-1-rev", M3_4_REVIEW),
    infoStep(
      "ja-m3-4-1-info-end",
      "You can now frame any topic with は",
      "The topic marker は — 'as for X, ...' — drilled in cloze slots across people, things, and question sentences like なまえは なんですか.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_4_1.steps);
assertAnswerRotation(M3_4_1.steps, 2);
assertNoConsecutiveSame(M3_4_1.steps);

/* ────────────────────────────────────────────────────────────────────────
 * M3-4 Sub-lesson 2/2 — Production + selfExplain on は
 * ──────────────────────────────────────────────────────────────────────── */

const M3_4_2_REVIEW = pickReviewAtoms("ja-m3-4-2-rev", M3_REVIEW_M1_POOL, 5);

export const M3_4_2: LessonContent = {
  id: "ja-m3-4-2",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "は — produce & explain",
  description:
    "Production-heavy practice on は sentences. Build, speak, then explain why は is correct.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    build(
      "ja-m3-4-2-build-nihonjin",
      "I am Japanese.",
      "わたしは にほんじんです",
      ["わたし", "は", "にほんじん", "です", "アメリカじん"],
      ["わたし", "は", "にほんじん", "です"],
    ),
    speaking(
      "ja-m3-4-2-speak-nihonjin",
      "わたしは にほんじんです",
      "I am Japanese.",
    ),
    cloze(
      "ja-m3-4-2-cloze-1",
      "ねこ",
      " いぬです。",
      "は",
      ["は", "が", "を", "に"],
      "The cat is a dog. (silly but grammatical!)",
      "ねこは いぬです。",
      "Topic = cat. The grammar works even if the meaning is absurd.",
    ),
    listeningBuildSentence({
      id: "ja-m3-4-2-lbs-tomodachi",
      target: "ともだちは にほんじんです",
      tiles: ["ともだち", "は", "にほんじん", "です", "アメリカじん", "か"],
      correctOrder: ["ともだち", "は", "にほんじん", "です"],
      promptEn: "My friend is Japanese.",
    }),
    sentenceMcq({
      id: "ja-m3-4-2-mcq-recap",
      prompt: "Which sentence asks 'Is that your friend?'",
      correctKana: "あれは ともだちですか。",
      distractorsKana: [
        "あれは ともだちです。",
        "あれが ともだちですか。",
        "それは ともだちですか。",
      ],
      explanation: "Topic は + statement + か = polite yes/no question.",
    }),
    cloze(
      "ja-m3-4-2-cloze-2",
      "いぬです",
      "。",
      "か",
      ["か", "は", "が", "を"],
      "Is it a dog?",
      "いぬですか。",
      "Statement → question via か.",
    ),
    build(
      "ja-m3-4-2-build-namae",
      "What is your name?",
      "なまえは なんですか",
      ["なまえ", "は", "なん", "です", "か", "わたし"],
      ["なまえ", "は", "なん", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m3-4-2-lc-gakusei-q",
      audioText: "がくせいですか",
      correctMeaningEn: "Are you a student?",
      distractorsEn: [
        "I am a student.",
        "Is it a teacher?",
        "What is your name?",
      ],
    }),
    speaking(
      "ja-m3-4-2-speak-kore-mizu",
      "これは みずです",
      "This is water.",
    ),
    selfExplain({
      id: "ja-m3-4-2-self-ha",
      anchorLabel: "You picked は in: わたし＿ がくせいです",
      anchorAudioText: "わたしは がくせいです",
      question: "Why is は correct here?",
      rule: { text: "は marks the TOPIC — 'as for X, …'." },
      surface: { text: "は always attaches to the first noun of a sentence." },
      distractor: {
        text: "は is the subject marker showing who performs the action.",
      },
      ruleExplanation:
        "は marks the TOPIC (what the sentence is about), not the grammatical subject. The distractor describes が (subject marker, coming in M6).",
    }),
    build(
      "ja-m3-4-2-build-sensei-q",
      "Is my friend a teacher?",
      "ともだちは せんせいですか",
      ["ともだち", "は", "せんせい", "です", "か", "がくせい"],
      ["ともだち", "は", "せんせい", "です", "か"],
    ),
    speaking(
      "ja-m3-4-2-speak-tomodachi-sensei",
      "ともだちは せんせいです",
      "My friend is a teacher.",
    ),
    listeningCompSentence({
      id: "ja-m3-4-2-lc-inu",
      audioText: "あれは いぬですか",
      correctMeaningEn: "Is that a dog?",
      distractorsEn: [
        "Is that a cat?",
        "That is a dog.",
        "This is a dog.",
      ],
    }),
    // Review tail
    speaking("ja-m3-4-2-rev-speak-1", M3_4_2_REVIEW[0].kana, M3_4_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-4-2-rev-lc-1",
      audioText: M3_4_2_REVIEW[1].kana,
      correctMeaningEn: M3_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_4_2_REVIEW[2].meaningEn,
        M3_4_2_REVIEW[3].meaningEn,
        M3_4_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-4-2-rev-mcq-2", M3_4_2_REVIEW[3], M3_REVIEW_M1_POOL),
    reviewMatchPairs("ja-m3-4-2-rev", M3_4_2_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m3-4-2-info-end",
      "You can now explain why は is correct",
      "Production + self-explanation on は — you built sentences, spoke them aloud, and explained the topic-marker rule in your own reasoning.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_4_2.steps);
assertAnswerRotation(M3_4_2.steps, 2);
assertNoConsecutiveSame(M3_4_2.steps);

// ----- M3-5 — Interleaved drill — は + です + か -------

const M3_5_REVIEW = pickReviewAtoms("ja-m3-5-rev", M3_REVIEW_M1_POOL, 5);

/* ────────────────────────────────────────────────────────────────────────
 * M3-5 Sub-lesson 1/2 — Introduce あに + interleaved cloze drilling
 * ──────────────────────────────────────────────────────────────────────── */

export const M3_5_1: LessonContent = {
  id: "ja-m3-5-1",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved drill — は + か (part 1)",
  description:
    "Introduce older brother (あに). Mixed cloze practice — the correct particle rotates.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // あに — figuroutable: learner knows all tiles except あに
    build(
      "ja-m3-5-1-intro-ani",
      "My older brother is American.",
      "あには アメリカじんです",
      ["あに", "は", "アメリカじん", "です", "わたし"],
      ["あに", "は", "アメリカじん", "です"],
      ["あに", "アメリカじん"],
    ),
    listeningCompSentence({
      id: "ja-m3-5-1-lc-ani",
      audioText: "あに",
      correctMeaningEn: "(my) older brother",
      distractorsEn: ["friend", "teacher", "student"],
    }),
    cloze(
      "ja-m3-5-1-cloze-1",
      "ともだち",
      " せんせいですか。",
      "は",
      ["は", "が", "を", "に"],
      "Is my friend a teacher?",
      "ともだちは せんせいですか。",
      "Topic = my friend. か is already there — you need は.",
    ),
    speaking("ja-m3-5-1-speak-ani", "あに", "(my) older brother"),
    cloze(
      "ja-m3-5-1-cloze-2",
      "がくせいです",
      "。",
      "か",
      ["は", "が", "か", "を"],
      "Are you a student?",
      "がくせいですか。",
      "Statement → question via か.",
    ),
    build(
      "ja-m3-5-1-build-ani-nihonjin",
      "My older brother is Japanese.",
      "あには にほんじんです",
      ["あに", "は", "にほんじん", "です", "アメリカじん"],
      ["あに", "は", "にほんじん", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m3-5-1-lb-name",
      target: "なまえは なんですか",
      tiles: ["なまえ", "は", "なん", "です", "か", "わたし", "ともだち"],
      correctOrder: ["なまえ", "は", "なん", "です", "か"],
      promptEn: "What is your name?",
    }),
    cloze(
      "ja-m3-5-1-cloze-3",
      "せんせい",
      " にほんじんです。",
      "は",
      ["は", "が", "を", "に"],
      "The teacher is Japanese.",
      "せんせいは にほんじんです。",
      "Topic = the teacher.",
    ),
    sentenceMcq({
      id: "ja-m3-5-1-mcq-discriminate",
      prompt: "Which sentence asks 'Am I a teacher?'",
      correctKana: "わたしは せんせいですか。",
      distractorsKana: [
        "わたしは せんせいです。",
        "わたしか せんせいです。",
        "わたしは ですか せんせい。",
      ],
      explanation: "Topic は first, statement, then か to question. Word order is fixed.",
    }),
    speaking(
      "ja-m3-5-1-speak-watashi",
      "わたしは アメリカじんです",
      "I am American.",
    ),
    cloze(
      "ja-m3-5-1-cloze-4",
      "なまえは なんです",
      "。",
      "か",
      ["か", "は", "が", "の"],
      "What is your name?",
      "なまえは なんですか。",
      "Already has は; need か at the end to ask.",
    ),
    listeningCompSentence({
      id: "ja-m3-5-1-lc-are",
      audioText: "あれは いぬですか",
      correctMeaningEn: "Is that a dog?",
      distractorsEn: [
        "Is that a cat?",
        "That is a dog.",
        "This is a dog.",
      ],
    }),
    cloze(
      "ja-m3-5-1-cloze-5",
      "ともだち",
      " アメリカじんです。",
      "は",
      ["は", "が", "を", "に"],
      "My friend is American.",
      "ともだちは アメリカじんです。",
      "Topic = friend.",
    ),
    // Review tail
    speaking("ja-m3-5-1-rev-speak-1", M3_5_REVIEW[0].kana, M3_5_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-5-1-rev-lc-1",
      audioText: M3_5_REVIEW[1].kana,
      correctMeaningEn: M3_5_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_5_REVIEW[2].meaningEn,
        M3_5_REVIEW[3].meaningEn,
        M3_5_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-5-1-rev-mcq-2", M3_5_REVIEW[3], M3_REVIEW_M1_POOL),
    reviewMatchPairs("ja-m3-5-1-rev", M3_5_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m3-5-1-info-end",
      "You can now say 'my older brother is...'",
      "New word あに (older brother) plus interleaved は and か cloze drilling — the correct particle rotates so you must read the sentence each time.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_5_1.steps);
assertAnswerRotation(M3_5_1.steps, 2);
assertNoConsecutiveSame(M3_5_1.steps);

/* ────────────────────────────────────────────────────────────────────────
 * M3-5 Sub-lesson 2/2 — More interleaved drills + selfExplain
 * ──────────────────────────────────────────────────────────────────────── */

const M3_5_2_REVIEW = pickReviewAtoms("ja-m3-5-2-rev", M3_REVIEW_M2_POOL, 4);

export const M3_5_2: LessonContent = {
  id: "ja-m3-5-2",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved drill — は + か (part 2)",
  description:
    "Continued mixed practice. Production ramps up. SelfExplain probes か.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    build(
      "ja-m3-5-2-build-ani-amerikajin",
      "My older brother is American.",
      "あには アメリカじんです",
      ["あに", "は", "アメリカじん", "です", "にほんじん"],
      ["あに", "は", "アメリカじん", "です"],
      ["あに", "アメリカじん"],
    ),
    cloze(
      "ja-m3-5-2-cloze-1",
      "あれは いぬです",
      "。",
      "か",
      ["か", "は", "が", "を"],
      "Is that a dog?",
      "あれは いぬですか。",
      "Statement + か = question.",
    ),
    sentenceMcq({
      id: "ja-m3-5-2-mcq-namae",
      prompt: "Which sentence says 'It's a name.'?",
      correctKana: "なまえです。",
      distractorsKana: [
        "なまえですか。",
        "なまえは なんですか。",
        "なまえの ですか。",
      ],
      explanation: "なまえ + です = 'is a name.' No か = statement.",
    }),
    speaking(
      "ja-m3-5-2-speak-ani-nihonjin",
      "あには にほんじんです",
      "My older brother is Japanese.",
    ),
    cloze(
      "ja-m3-5-2-cloze-2",
      "あに",
      " がくせいです。",
      "は",
      ["は", "が", "を", "に"],
      "My older brother is a student.",
      "あには がくせいです。",
      "Topic = older brother.",
    ),
    listeningCompSentence({
      id: "ja-m3-5-2-lc-sensei-q",
      audioText: "せんせいですか",
      correctMeaningEn: "Are you a teacher?",
      distractorsEn: [
        "I am a teacher.",
        "Is it a student?",
        "My friend is a teacher.",
      ],
    }),
    build(
      "ja-m3-5-2-build-nihonjin-q",
      "Is the teacher Japanese?",
      "せんせいは にほんじんですか",
      ["せんせい", "は", "にほんじん", "です", "か", "アメリカじん"],
      ["せんせい", "は", "にほんじん", "です", "か"],
    ),
    cloze(
      "ja-m3-5-2-cloze-3",
      "にほんじんです",
      "。",
      "か",
      ["か", "は", "が", "の"],
      "Are you Japanese?",
      "にほんじんですか。",
      "Statement + か.",
    ),
    selfExplain({
      id: "ja-m3-5-2-self-particle",
      anchorLabel: "Compare: あれは いぬです vs あれは いぬですか",
      anchorAudioText: "あれは いぬですか",
      question:
        "What's the ONLY difference between these two sentences in meaning?",
      rule: { text: "か at the end converts the statement into a yes/no question." },
      surface: { text: "Sentences ending in か are always about animals." },
      distractor: {
        text: "か at the end emphasizes the topic for the listener.",
      },
      ruleExplanation:
        "か is the question particle. It doesn't depend on what the noun is. Question marker, full stop.",
    }),
    listeningBuildSentence({
      id: "ja-m3-5-2-lbs-tomodachi",
      target: "ともだちは せんせいですか",
      tiles: ["ともだち", "は", "せんせい", "です", "か", "がくせい"],
      correctOrder: ["ともだち", "は", "せんせい", "です", "か"],
      promptEn: "Is my friend a teacher?",
    }),
    speaking(
      "ja-m3-5-2-speak-namae-q",
      "なまえは なんですか",
      "What is your name?",
    ),
    build(
      "ja-m3-5-2-build-kore-neko",
      "This is a cat.",
      "これは ねこです",
      ["これ", "は", "ねこ", "です", "いぬ"],
      ["これ", "は", "ねこ", "です"],
    ),
    sentenceMcq({
      id: "ja-m3-5-2-mcq-ani-q",
      prompt: "Which sentence asks 'Is your older brother a student?'",
      correctKana: "あには がくせいですか。",
      distractorsKana: [
        "あには がくせいです。",
        "あにが がくせいですか。",
        "あには せんせいですか。",
      ],
      explanation: "Topic は + statement + か = question.",
    }),
    // Review tail
    speaking("ja-m3-5-2-rev-speak-1", M3_5_2_REVIEW[0].kana, M3_5_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-5-2-rev-lc-1",
      audioText: M3_5_2_REVIEW[1].kana,
      correctMeaningEn: M3_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_5_2_REVIEW[2].meaningEn,
        M3_5_2_REVIEW[3].meaningEn,
        M3_REVIEW_M1_POOL[2].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-5-2-rev-mcq-2", M3_5_2_REVIEW[2], M3_REVIEW_M2_POOL),
    reviewMatchPairs("ja-m3-5-2-rev", M3_5_2_REVIEW),
    infoStep(
      "ja-m3-5-2-info-end",
      "You can now tell は and か apart under pressure",
      "Mixed drilling with self-explanation: you know か converts statements to questions and は marks the topic — and you can articulate why.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_5_2.steps);
assertAnswerRotation(M3_5_2.steps, 2);
assertNoConsecutiveSame(M3_5_2.steps);

// ----- M3-6 — Production — sentence build + speaking + translate ---------

const M3_6_REVIEW = pickReviewAtoms("ja-m3-6-rev", M3_REVIEW_M2_POOL, 4);

/* ────────────────────────────────────────────────────────────────────────
 * M3-6 Sub-lesson 1/2 — Production-heavy builds + speaking
 * ──────────────────────────────────────────────────────────────────────── */

export const M3_6_1: LessonContent = {
  id: "ja-m3-6-1",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build — putting it together (part 1)",
  description:
    "Production-heavy. Build sentences from tiles, then speak them aloud.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    build(
      "ja-m3-6-1-s1",
      "I am American.",
      "わたしは アメリカじんです",
      ["わたし", "は", "アメリカじん", "です", "がくせい", "にほんじん"],
      ["わたし", "は", "アメリカじん", "です"],
    ),
    speaking(
      "ja-m3-6-1-speak-s1",
      "わたしは アメリカじんです",
      "I am American.",
    ),
    build(
      "ja-m3-6-1-s2",
      "What is your name?",
      "なまえは なんですか",
      ["なまえ", "は", "なん", "です", "か", "わたし"],
      ["なまえ", "は", "なん", "です", "か"],
    ),
    vocabMcq(
      "ja-m3-6-1-mcq-mizu",
      { kana: "みず", meaningEn: "water", emoji: "💧", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    build(
      "ja-m3-6-1-s3",
      "This is water.",
      "これは みずです",
      ["これ", "は", "みず", "です", "ほん", "それ"],
      ["これ", "は", "みず", "です"],
    ),
    listeningCompSentence({
      id: "ja-m3-6-1-lc-ani",
      audioText: "あには がくせいです",
      correctMeaningEn: "My older brother is a student.",
      distractorsEn: [
        "I am a student.",
        "My friend is a teacher.",
        "Is your older brother a student?",
      ],
    }),
    build(
      "ja-m3-6-1-s4",
      "My older brother is a teacher.",
      "あには せんせいです",
      ["あに", "は", "せんせい", "です", "わたし", "がくせい"],
      ["あに", "は", "せんせい", "です"],
    ),
    speaking(
      "ja-m3-6-1-speak-s4",
      "あには せんせいです",
      "My older brother is a teacher.",
    ),
    listeningBuildSentence({
      id: "ja-m3-6-1-lb-tomodachi",
      target: "ともだちは せんせいです",
      tiles: ["ともだち", "は", "せんせい", "です", "わたし", "がくせい"],
      correctOrder: ["ともだち", "は", "せんせい", "です"],
      promptEn: "My friend is a teacher.",
    }),
    sentenceMcq({
      id: "ja-m3-6-1-mcq-recall",
      prompt: "Which sentence asks 'Is that a dog?'",
      correctKana: "あれは いぬですか。",
      distractorsKana: [
        "あれは いぬです。",
        "あれは ねこですか。",
        "これは いぬですか。",
      ],
      explanation: "あれ = 'that over there'; いぬ = dog; か = question.",
    }),
    build(
      "ja-m3-6-1-s5",
      "My friend is Japanese.",
      "ともだちは にほんじんです",
      ["ともだち", "は", "にほんじん", "です", "アメリカじん"],
      ["ともだち", "は", "にほんじん", "です"],
    ),
    speaking(
      "ja-m3-6-1-speak-namae",
      "なまえは なんですか",
      "What is your name?",
    ),
    listeningCompSentence({
      id: "ja-m3-6-1-lc-neko",
      audioText: "それは ねこですか",
      correctMeaningEn: "Is that a cat?",
      distractorsEn: [
        "Is this a cat?",
        "That is a cat.",
        "Is that a dog?",
      ],
    }),
    // Review tail
    speaking("ja-m3-6-1-rev-speak-1", M3_6_REVIEW[0].kana, M3_6_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-6-1-rev-lc-1",
      audioText: M3_6_REVIEW[1].kana,
      correctMeaningEn: M3_6_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_6_REVIEW[2].meaningEn,
        M3_6_REVIEW[3].meaningEn,
        M3_REVIEW_M1_POOL[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-6-1-rev-mcq-2", M3_6_REVIEW[2], M3_REVIEW_M2_POOL),
    reviewMatchPairs("ja-m3-6-1-rev", M3_6_REVIEW),
    infoStep(
      "ja-m3-6-1-info-end",
      "You can now build full sentences from scratch",
      "Production-mode practice: building and speaking sentences like わたしは アメリカじんです, なまえは なんですか, and これは みずです.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_6_1.steps);
assertNoConsecutiveSame(M3_6_1.steps);

/* ────────────────────────────────────────────────────────────────────────
 * M3-6 Sub-lesson 2/2 — More production + cumulative review
 * ──────────────────────────────────────────────────────────────────────── */

const M3_6_2_REVIEW = pickReviewAtoms("ja-m3-6-2-rev", M3_REVIEW_M1_POOL, 5);

export const M3_6_2: LessonContent = {
  id: "ja-m3-6-2",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build — putting it together (part 2)",
  description:
    "Continue producing full sentences. Listening + speaking interleaved.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    build(
      "ja-m3-6-2-s1",
      "Is my friend a teacher?",
      "ともだちは せんせいですか",
      ["ともだち", "は", "せんせい", "です", "か", "がくせい"],
      ["ともだち", "は", "せんせい", "です", "か"],
    ),
    speaking(
      "ja-m3-6-2-speak-s1",
      "ともだちは せんせいですか",
      "Is my friend a teacher?",
    ),
    listeningCompSentence({
      id: "ja-m3-6-2-lc-ani-amerikajin",
      audioText: "あには アメリカじんです",
      correctMeaningEn: "My older brother is American.",
      distractorsEn: [
        "I am American.",
        "Are you American?",
        "My friend is American.",
      ],
    }),
    build(
      "ja-m3-6-2-s2",
      "My older brother is American.",
      "あには アメリカじんです",
      ["あに", "は", "アメリカじん", "です", "にほんじん", "わたし"],
      ["あに", "は", "アメリカじん", "です"],
    ),
    vocabMcq(
      "ja-m3-6-2-mcq-hon",
      { kana: "ほん", meaningEn: "book", emoji: "📖", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    build(
      "ja-m3-6-2-s3",
      "This is a book.",
      "これは ほんです",
      ["これ", "は", "ほん", "です", "みず", "ねこ"],
      ["これ", "は", "ほん", "です"],
    ),
    speaking(
      "ja-m3-6-2-speak-namae-desu",
      "なまえです",
      "It's a name.",
    ),
    sentenceMcq({
      id: "ja-m3-6-2-mcq-tomodachi-q",
      prompt: "Which sentence asks 'Is your friend Japanese?'",
      correctKana: "ともだちは にほんじんですか。",
      distractorsKana: [
        "ともだちは にほんじんです。",
        "ともだちが にほんじんですか。",
        "ともだちは アメリカじんですか。",
      ],
      explanation: "Topic は + statement + か = polite question.",
    }),
    listeningBuildSentence({
      id: "ja-m3-6-2-lbs-gakusei-q",
      target: "がくせいですか",
      tiles: ["がくせい", "です", "か", "は", "わたし"],
      correctOrder: ["がくせい", "です", "か"],
      promptEn: "Are you a student?",
    }),
    build(
      "ja-m3-6-2-s4",
      "Is that a cat?",
      "あれは ねこですか",
      ["あれ", "は", "ねこ", "です", "か", "いぬ"],
      ["あれ", "は", "ねこ", "です", "か"],
    ),
    speaking(
      "ja-m3-6-2-speak-watashi-nihonjin",
      "わたしは にほんじんです",
      "I am Japanese.",
    ),
    listeningCompSentence({
      id: "ja-m3-6-2-lc-kore-mizu",
      audioText: "これは みずです",
      correctMeaningEn: "This is water.",
      distractorsEn: [
        "This is a book.",
        "That is water.",
        "Is this water?",
      ],
    }),
    build(
      "ja-m3-6-2-s5",
      "I am a student.",
      "わたしは がくせいです",
      ["わたし", "は", "がくせい", "です", "せんせい"],
      ["わたし", "は", "がくせい", "です"],
    ),
    // Review tail
    speaking("ja-m3-6-2-rev-speak-1", M3_6_2_REVIEW[0].kana, M3_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-6-2-rev-lc-1",
      audioText: M3_6_2_REVIEW[1].kana,
      correctMeaningEn: M3_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_6_2_REVIEW[2].meaningEn,
        M3_6_2_REVIEW[3].meaningEn,
        M3_6_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-6-2-rev-mcq-2", M3_6_2_REVIEW[3], M3_REVIEW_M1_POOL),
    reviewMatchPairs("ja-m3-6-2-rev", M3_6_2_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m3-6-2-info-end",
      "You can now produce questions and statements fluently",
      "Sentence builds, listening comprehension, and speaking across statements (です) and questions (ですか) — all from tiles to voice.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_6_2.steps);
assertNoConsecutiveSame(M3_6_2.steps);

// ----- M3-7 — Dialogue closer + cumulative review (dialogueListen) -------

const M3_7_REVIEW = pickReviewAtoms("ja-m3-7-rev", M3_M7_REVIEW_POOL, 6);

const RULE_MO = grammarRule({
  id: "ja-m3-7-rule-mo",
  title: "も — 'X too' / 'X also'",
  rule:
    "も swaps in for は to mean 'X too' / 'X also'. Same sentence skeleton — just replace the topic particle. If Ken says 'I'm a student' (わたしは がくせいです) and you're also a student, you reply 'わたしも がくせいです.' Reach for も whenever you're agreeing-by-extension with what was just said.",
  examples: [
    {
      ja: "わたしも アメリカじんです。",
      romaji: "watashi mo amerikajin desu.",
      en: "I'm American too. (also — agreeing with someone)",
    },
    {
      ja: "ともだちも せんせいです。",
      romaji: "tomodachi mo sensei desu.",
      en: "My friend is also a teacher.",
    },
  ],
  antiPattern: {
    ja: "わたしは と アメリカじんです。",
    romaji: "watashi wa to amerikajin desu.",
    en: "(broken — と is the wrong particle here)",
    why: "Japanese has several 'and / also'-flavored particles. も is the one that means 'X too' attached to the topic. と (and / with — for joining things) and や (a partial list) are different jobs that come later.",
  },
  cultureNote:
    "わたしも is one of the most useful two-syllable phrases in conversational Japanese — anywhere someone says where they're from, what they do, what they like, 'me too' is your in.",
});

/* ────────────────────────────────────────────────────────────────────────
 * M3-7 Sub-lesson 1/2 — Introduce すみません + teach も + pre-dialogue drills
 * ──────────────────────────────────────────────────────────────────────── */

export const M3_7_1: LessonContent = {
  id: "ja-m3-7-1",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — meeting someone (part 1)",
  description:
    "Learn すみません (excuse me) and も (also). Build up to a dialogue scene.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    infoStep(
      "ja-m3-7-1-info-open",
      "Drop into the scene",
      "You're at a guesthouse common room. A new arrival named ケン (Ken) sits down. First: a polite opener + one new particle.",
      "culture",
    ),
    // すみません — single-tile pick
    build(
      "ja-m3-7-1-intro-sumimasen",
      "Excuse me",
      "すみません",
      ["すみません", "がくせい", "ともだち"],
      ["すみません"],
    ),
    listeningCompSentence({
      id: "ja-m3-7-1-lc-sumimasen",
      audioText: "すみません",
      correctMeaningEn: "Excuse me",
      distractorsEn: ["Thank you", "Hello", "Goodbye"],
    }),
    speaking("ja-m3-7-1-speak-sumimasen", "すみません", "Excuse me"),
    // Teach も
    RULE_MO,
    // First も sentence — figuroutable from rule card example
    build(
      "ja-m3-7-1-build-mo",
      "I am American too.",
      "わたしも アメリカじんです",
      ["わたし", "も", "アメリカじん", "です", "は"],
      ["わたし", "も", "アメリカじん", "です"],
    ),
    sentenceMcq({
      id: "ja-m3-7-1-mcq-mo-vs-ha",
      prompt: "Which says 'My friend is ALSO a teacher'?",
      correctKana: "ともだちも せんせいです。",
      distractorsKana: [
        "ともだちは せんせいです。",
        "ともだちも がくせいです。",
        "わたしも せんせいです。",
      ],
      explanation:
        "も = 'also'. は = plain topic. がくせい = student, not teacher. わたし = I, not friend.",
    }),
    cloze(
      "ja-m3-7-1-cloze-ha",
      "あに",
      " アメリカじんです。",
      "は",
      ["は", "が", "を", "に"],
      "My older brother is American.",
      "あには アメリカじんです。",
      "Plain は — no 'also' sense here.",
    ),
    build(
      "ja-m3-7-1-build-gakusei",
      "I am a student.",
      "わたしは がくせいです",
      ["わたし", "は", "がくせい", "です", "せんせい"],
      ["わたし", "は", "がくせい", "です"],
    ),
    cloze(
      "ja-m3-7-1-cloze-ka",
      "せんせいです",
      "。",
      "か",
      ["か", "は", "が", "を"],
      "Are you the teacher?",
      "せんせいですか。",
      "Statement → question via か.",
    ),
    listeningCompSentence({
      id: "ja-m3-7-1-lc-namae-q",
      audioText: "なまえは なんですか",
      correctMeaningEn: "What is your name?",
      distractorsEn: [
        "I am a student.",
        "Are you a teacher?",
        "Excuse me.",
      ],
    }),
    build(
      "ja-m3-7-1-build-namae-q",
      "What is your name?",
      "なまえは なんですか",
      ["なまえ", "は", "なん", "です", "か", "わたし"],
      ["なまえ", "は", "なん", "です", "か"],
    ),
    speaking(
      "ja-m3-7-1-speak-mo",
      "わたしも がくせいです",
      "I am also a student.",
    ),
    // Review tail
    speaking("ja-m3-7-1-rev-speak-1", M3_7_REVIEW[0].kana, M3_7_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-7-1-rev-lc-1",
      audioText: M3_7_REVIEW[1].kana,
      correctMeaningEn: M3_7_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_7_REVIEW[2].meaningEn,
        M3_7_REVIEW[3].meaningEn,
        M3_7_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq(
      "ja-m3-7-1-rev-mcq-2",
      M3_7_REVIEW.filter((a) => Boolean(a.emoji))[1]!,
      M3_M7_REVIEW_POOL,
    ),
    reviewMatchPairs("ja-m3-7-1-rev", M3_7_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m3-7-1-info-end",
      "You can now say 'excuse me' and 'me too'",
      "すみません (excuse me) for polite openers, plus も — the 'also' particle that swaps in for は when agreeing: わたしも がくせいです.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_7_1.steps);
assertAnswerRotation(M3_7_1.steps, 2);
assertNoConsecutiveSame(M3_7_1.steps);

/* ────────────────────────────────────────────────────────────────────────
 * M3-7 Sub-lesson 2/2 — The dialogue + post-dialogue retrieval + review
 * ──────────────────────────────────────────────────────────────────────── */

const M3_7_2_REVIEW = pickReviewAtoms("ja-m3-7-2-rev", M3_M7_REVIEW_POOL, 5);

export const M3_7_2: LessonContent = {
  id: "ja-m3-7-2",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — meeting someone (part 2)",
  description:
    "Listen to the full dialogue, answer comprehension questions, then produce key lines.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    dialogueListen({
      id: "ja-m3-7-2-dialogue",
      lines: [
        { speaker: "Ken", kana: "すみません、なまえは なんですか。" },
        { speaker: "You", kana: "わたしは ケン です。", audioText: "わたしは ケン です。" },
        { speaker: "Ken", kana: "わたしも ケンです。アメリカじんですか。" },
        { speaker: "You", kana: "はい。わたしは アメリカじんです。" },
      ],
      questions: [
        {
          id: "q1-name",
          prompt: "What does Ken ask first?",
          correctText: "What is your name?",
          distractors: ["Are you American?", "Where are you from?", "Are you a student?"],
          explanation: "なまえは なんですか = 'What is your name?'",
        },
        {
          id: "q2-nationality",
          prompt: "What is the second speaker's nationality?",
          correctText: "American",
          distractors: ["Japanese", "Both Japanese and American", "It isn't said"],
          explanation: "The second speaker confirms はい to アメリカじんですか.",
        },
        {
          id: "q3-shared-name",
          prompt: "What name do BOTH speakers share?",
          correctText: "Ken",
          distractors: ["They have different names", "Sensei", "Tomodachi"],
          explanation: "わたしも ケンです = 'I am also Ken.' も signals 'me too.'",
        },
      ],
    }),
    sentenceMcq({
      id: "ja-m3-7-2-mcq-also",
      prompt: "Which sentence says 'I am ALSO Ken.'?",
      correctKana: "わたしも ケンです。",
      distractorsKana: [
        "わたしは ケンです。",
        "ともだちも ケンです。",
        "わたしも ケンですか。",
      ],
      explanation:
        "も replaces は when you mean 'X too.' は alone = no 'also'. ともだちも = wrong subject. ですか = question.",
    }),
    speaking(
      "ja-m3-7-2-speak-watashi-ken",
      "わたしは ケン です",
      "I am Ken.",
    ),
    build(
      "ja-m3-7-2-build-mo-gakusei",
      "I am also a student.",
      "わたしも がくせいです",
      ["わたし", "も", "がくせい", "です", "は", "せんせい"],
      ["わたし", "も", "がくせい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m3-7-2-lc-sumimasen",
      audioText: "すみません",
      correctMeaningEn: "Excuse me",
      distractorsEn: ["Thank you", "Hello", "Goodbye"],
    }),
    cloze(
      "ja-m3-7-2-cloze-mo",
      "わたし",
      " にほんじんです。",
      "も",
      ["も", "は", "が", "を"],
      "I am also Japanese.",
      "わたしも にほんじんです。",
      "も = 'also'. Swaps in for は when agreeing.",
    ),
    speaking(
      "ja-m3-7-2-speak-sumimasen",
      "すみません",
      "Excuse me",
    ),
    build(
      "ja-m3-7-2-build-namae-q",
      "What is your name?",
      "なまえは なんですか",
      ["なまえ", "は", "なん", "です", "か", "も"],
      ["なまえ", "は", "なん", "です", "か"],
    ),
    sentenceMcq({
      id: "ja-m3-7-2-mcq-mo-friend",
      prompt: "Which says 'My friend is also a student.'?",
      correctKana: "ともだちも がくせいです。",
      distractorsKana: [
        "ともだちは がくせいです。",
        "ともだちも せんせいです。",
        "わたしも がくせいです。",
      ],
      explanation: "ともだち = friend; も = also; がくせい = student.",
    }),
    listeningBuildSentence({
      id: "ja-m3-7-2-lbs-mo-amerikajin",
      target: "わたしも アメリカじんです",
      tiles: ["わたし", "も", "アメリカじん", "です", "は", "にほんじん"],
      correctOrder: ["わたし", "も", "アメリカじん", "です"],
      promptEn: "I am American too.",
    }),
    speaking(
      "ja-m3-7-2-speak-mo-amerikajin",
      "わたしも アメリカじんです",
      "I am American too.",
    ),
    cloze(
      "ja-m3-7-2-cloze-ani-ha",
      "あに",
      " にほんじんです。",
      "は",
      ["は", "も", "が", "を"],
      "My older brother is Japanese.",
      "あには にほんじんです。",
      "Plain topic — no 'also' sense. は is correct.",
    ),
    // Review tail
    speaking("ja-m3-7-2-rev-speak-1", M3_7_2_REVIEW[0].kana, M3_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m3-7-2-rev-lc-1",
      audioText: M3_7_2_REVIEW[1].kana,
      correctMeaningEn: M3_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M3_7_2_REVIEW[2].meaningEn,
        M3_7_2_REVIEW[3].meaningEn,
        M3_7_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m3-7-2-rev-mcq-2", M3_7_2_REVIEW[3], M3_M7_REVIEW_POOL),
    reviewMatchPairs("ja-m3-7-2-rev", M3_7_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m3-7-2-info-end",
      "You can now follow a real self-introduction dialogue",
      "A full dialogue scene: names, nationalities, and も (also) — you listened, answered comprehension questions, and produced key lines.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_7_2.steps);
assertAnswerRotation(M3_7_2.steps, 2);
assertNoConsecutiveSame(M3_7_2.steps);

// ----- M3-9 — Story comprehension — Meeting someone new --------------------

export const M3_9: LessonContent = {
  id: "ja-m3-9",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Meeting someone new",
  description:
    "Listen to a short conversation between two people meeting for the first time. Answer questions and practice key lines.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m3-9-info-open",
      "Story time — Meeting someone new",
      "Listen to a short conversation between ゆき and たけし. They are meeting for the first time at school. Answer questions as you go.",
    ),
    dialogueListen({
      id: "ja-m3-9-scene-1",
      lines: [
        { speaker: "ゆき", kana: "すみません。なまえは なんですか。" },
        { speaker: "たけし", kana: "わたしは たけしです。アメリカじんです。" },
        { speaker: "ゆき", kana: "わたしは ゆきです。にほんじんです。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "What is たけし's nationality?",
          correctText: "American",
          distractors: ["Japanese", "Both American and Japanese", "It isn't said"],
          explanation: "たけし says アメリカじんです = 'I am American.'",
        },
        {
          id: "s1-q2",
          prompt: "Who asks for the other person's name?",
          correctText: "ゆき",
          distractors: ["たけし", "Both of them", "Neither"],
          explanation: "ゆき opens with なまえは なんですか = 'What is your name?'",
        },
      ],
    }),
    build(
      "ja-m3-9-build-intro",
      "Introduce yourself: I am a student.",
      "わたしは がくせいです",
      ["わたし", "は", "がくせい", "です", "せんせい", "も"],
      ["わたし", "は", "がくせい", "です"],
    ),
    sentenceMcq({
      id: "ja-m3-9-mcq-yuki-intro",
      prompt: "How does ゆき introduce herself?",
      correctKana: "わたしは ゆきです。にほんじんです。",
      distractorsKana: [
        "わたしは ゆきです。アメリカじんです。",
        "わたしは たけしです。にほんじんです。",
        "なまえは ゆきですか。",
      ],
      explanation: "ゆき gives her name then nationality: にほんじん = Japanese.",
    }),
    dialogueListen({
      id: "ja-m3-9-scene-2",
      lines: [
        { speaker: "ゆき", kana: "がくせいですか。" },
        { speaker: "たけし", kana: "はい、がくせいです。" },
        { speaker: "たけし", kana: "ゆきも がくせいですか。" },
        { speaker: "ゆき", kana: "はい、わたしも がくせいです。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "Are both ゆき and たけし students?",
          correctText: "Yes, both are students",
          distractors: ["Only ゆき is", "Only たけし is", "Neither is"],
          explanation: "Both confirm がくせいです. ゆき adds わたしも = 'me too.'",
        },
        {
          id: "s2-q2",
          prompt: "What particle shows たけし is asking 'you TOO?'",
          correctText: "も",
          distractors: ["は", "か", "です"],
          explanation: "ゆきも がくせいですか — も replaces は to mean 'also.'",
        },
      ],
    }),
    cloze(
      "ja-m3-9-cloze-mo",
      "わたし",
      " がくせいです。 (I am ALSO a student.)",
      "も",
      ["も", "は", "が", "を"],
      "I am also a student.",
      "わたしも がくせいです。",
      "も = 'also'. Swaps in for は when agreeing.",
    ),
    build(
      "ja-m3-9-build-question",
      "Ask: Are you American?",
      "アメリカじんですか",
      ["アメリカじん", "です", "か", "にほんじん", "は"],
      ["アメリカじん", "です", "か"],
    ),
    listeningBuildSentence({
      id: "ja-m3-9-lb-gakusei-q",
      target: "がくせいですか",
      tiles: ["がくせい", "です", "か", "は", "も"],
      correctOrder: ["がくせい", "です", "か"],
      promptEn: "Hear it, build it: 'Are you a student?'",
    }),
    speaking(
      "ja-m3-9-speak-intro",
      "わたしは たけしです",
      "I am Takeshi.",
    ),
    sentenceMcq({
      id: "ja-m3-9-mcq-story-end",
      prompt: "What do ゆき and たけし have in common?",
      correctKana: "がくせいです",
      distractorsKana: [
        "にほんじんです",
        "アメリカじんです",
        "せんせいです",
      ],
      explanation: "Both are students — がくせい. They have different nationalities.",
    }),
    speaking(
      "ja-m3-9-speak-mo",
      "わたしも がくせいです",
      "I am also a student.",
    ),
    infoStep(
      "ja-m3-9-info-end",
      "You can now follow a conversation between strangers meeting",
      "You listened to ゆき and たけし introduce themselves, share nationalities, and discover they're both students — using も to say 'me too.'",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M3_9.steps);
assertPassiveCardsHaveFollowup(M3_9.steps);
assertNoExplanationOnPassive(M3_9.steps);
assertExplanationDoesntLeakAnswer(M3_9.steps);

// ----- M3-8 — Row test (mastery ★) ----------------------------------------

function particleMc(
  id: string,
  prompt: string,
  audioText: string,
  correct: string,
  distractors: [string, string, string],
  explanation: string,
): MultipleChoiceStep {
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

const M3_TEST_ITEMS: RowTestItem[] = [
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-8-mc-1",
      "わたし___ にほんじんです。 (I am Japanese.)",
      "わたしは にほんじんです",
      "は",
      ["が", "の", "を"],
      "Self-introduction. は marks the topic — 'as for me, Japanese.'",
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
      "わたし___ ケンです。 (I am ALSO Ken.)",
      "わたしも ケンです",
      "も",
      ["は", "が", "の"],
      "も = 'X too / X also'. Replaces は when agreeing-by-extension.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-8-mc-4",
      "あに___ アメリカじんです。 (My older brother is American.)",
      "あには アメリカじんです",
      "は",
      ["が", "を", "に"],
      "あに = older brother (topic).",
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
        { id: "p4", source: "にほんじん", target: "Japanese (person)", sourceAnnotation: [{ surface: "にほんじん", reading: "にほんじん" }] },
        { id: "p5", source: "アメリカじん", target: "American (person)", sourceAnnotation: [{ surface: "アメリカじん", reading: "アメリカじん" }] },
        { id: "p6", source: "あに", target: "older brother", sourceAnnotation: [{ surface: "あに", reading: "あに" }] },
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
      tiles: ["なまえ", "は", "なん", "です", "か", "どこ", "わたし"],
      correctOrder: ["なまえ", "は", "なん", "です", "か"],
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
      "You can now meet someone, introduce yourself, and ask back",
      "Polite copula です, the question particle か, and the topic marker は — three pieces, one fluent first-conversation shape. M4 deepens this with possessive の and the four-way pointer system これ/それ/あれ/どれ.",
      "win",
    ),
  ],
};

// ---------------------------------------------------------------------------
// Passive-card lint
// ---------------------------------------------------------------------------
for (const lesson of [M3_1_1, M3_1_2, M3_2_1, M3_2_2, M3_3_1, M3_3_2, M3_4_1, M3_4_2, M3_5_1, M3_5_2, M3_6_1, M3_6_2, M3_7_1, M3_7_2, M3_9, M3_8]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
