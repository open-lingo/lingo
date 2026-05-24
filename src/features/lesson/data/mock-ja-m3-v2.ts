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
  phrase,
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
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  assertPassiveCardsHaveFollowup,
} from "./_stepAssertions";
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

// ----- M3-1 — Katakana SYSTEM intro + 2 loanwords + sprinkle + review ----

const M3_1_REVIEW = pickReviewAtoms("ja-m3-1-rev", M3_REVIEW_M1_POOL, 8);
// M3-1 has no prior-module-grammar to drill, so the review tail is pure
// vocab MCQ + match_pairs on M1 atoms. Per Wave-4B brief (T10): the
// previous 5-loanword load was demoted — only コーヒー + タクシー stay
// inline; the rest of the density target is hit via prior-pool review +
// a brief sentence-pattern sprinkle (X です) that re-uses the loanwords
// without re-introducing them.

export const M3_1: LessonContent = {
  id: "ja-m3-1",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Katakana — the second alphabet",
  description:
    "Meet katakana as a system. Two high-frequency loanwords (coffee, taxi), then we put them in your first X です sentence.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m3-1-info-system",
      "Katakana — hiragana's twin",
      "Katakana (カタカナ) has the same 46 sounds as hiragana — just different, more angular shapes. It's used for: (1) loanwords from English and other languages (コーヒー = coffee), (2) foreign names, (3) onomatopoeia and emphasis (like italics in English). You'll meet 1–2 katakana words per M3+ lesson with romaji ruby on top, so you can read by sound while the shapes sink in. Want deliberate practice? The katakana drill lives in the Practice tab.",
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
    // Visual MCQ on the just-introduced loanword — image_mcq is the
    // dominant retrieval modality for concrete imageable nouns. ☕ is the
    // canonical N5 emoji for コーヒー; distractors drawn from M1 pool.
    vocabMcq(
      "ja-m3-1-mcq-coffee",
      { kana: "コーヒー", meaningEn: "coffee", emoji: "☕", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    // Sentence-pattern SPRINKLE — re-use the loanword in an X です carrier
    // (no formal rule explanation yet; M3-2 ships RULE_DESU_KA). Light
    // exposure to the polite copula in context.
    phrase(
      "ja-m3-1-coffee-desu",
      "It's coffee.",
      "koohii desu",
      "コーヒー です",
      "Sneak preview: です is the polite 'is/are.' Full rule next lesson — for now, just notice the shape.",
    ),
    // Speaking break interleaved between phrase_cards (R3).
    speaking("ja-m3-1-speak-coffee-mid", "コーヒー", "Coffee"),
    phrase(
      "ja-m3-1-taxi",
      "Taxi",
      "takushii",
      "タクシー",
      "Japanese taxis have automatic doors — don't grab the handle, the driver opens it for you.",
    ),
    // Listening break interleaved between phrase cards (R3).
    listeningCompSentence({
      id: "ja-m3-1-lc-taxi",
      audioText: "タクシー",
      correctMeaningEn: "taxi",
      distractorsEn: ["coffee", "hotel", "beer"],
    }),
    // Visual MCQ on タクシー — pairs with the LC above for audio+visual
    // recognition on the same atom before it heads into the X です sprinkle.
    vocabMcq(
      "ja-m3-1-mcq-taxi",
      { kana: "タクシー", meaningEn: "taxi", emoji: "🚕", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    phrase(
      "ja-m3-1-taxi-desu",
      "It's a taxi.",
      "takushii desu",
      "タクシー です",
      "Same skeleton: noun + です. Easy substitution drills upcoming.",
    ),
    // Production break (speaking).
    speaking("ja-m3-1-speak-coffee", "コーヒー", "Coffee"),
    // Production step (build_sentence) — Coffee + です tile-bank assembly,
    // the simplest stem the learner can produce at this point.
    build(
      "ja-m3-1-translate-coffee",
      "It's coffee.",
      "コーヒー です",
      ["コーヒー", "です", "タクシー"],
      ["コーヒー", "です"],
    ),
    // sentenceMcq — pattern discrimination between the two loanwords' です forms.
    // Distractors are all near-misses: wrong noun, wrong sentence-type, wrong word-order.
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
        "タクシー = taxi; です asserts politely. No か = statement, not question. The 'これは タクシーです' option says 'this is a taxi' — close, but the prompt is the bare 'It's a taxi.'",
    }),
    // ─── Review tail (M1 atoms — kana the learner has fully read) ───
    // Compounding-review loop on prior-module atoms. Earlier tail had
    // 4 review steps; with the 3 fewer katakana phrase_cards we add
    // 2 more here so the review ratio stays high.
    // Review tail (M1 compounding review). Trimmed from 4 LCs to 1 LC
    // because the two new inline vocabMcqs (coffee/taxi) already give the
    // visual-recognition channel + the M1 audio channel was over-weighted
    // (BETA flagged 4× LCs as monotony). Net step count parity with prior
    // shipped version, but stronger M3-atom retrieval and lighter M1-only
    // drilling.
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
    speaking("ja-m3-1-speak-taxi", "タクシー", "Taxi"),
    vocabMcq("ja-m3-1-rev-mcq-3", M3_1_REVIEW[6], M3_REVIEW_M1_POOL),
    // Final retrieval beat — re-use the loanword in a translate (typed)
    // direction the OTHER way (taxi instead of coffee), so the X です
    // pattern is exercised twice with different X-substitution.
    build(
      "ja-m3-1-translate-taxi",
      "It's a taxi.",
      "タクシー です",
      ["タクシー", "です", "コーヒー"],
      ["タクシー", "です"],
    ),
    reviewMatchPairs("ja-m3-1-rev", M3_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m3-1-info-end",
      "Two loanwords + your first X です",
      "You can now order a coffee, hail a taxi, AND drop them into a polite 'it's X' sentence. The other katakana shapes will come — slowly, in context — across M3 and beyond. Next: the formal です + か rule.",
      "win",
    ),
  ],
};

// Validate no same-answer cluster (no clozes in M3-1, but keep the gate
// uniform across the module for future edits).
assertNoSameAnswerCluster(M3_1.steps);
assertAnswerRotation(M3_1.steps, 2);
assertNoConsecutiveSame(M3_1.steps);

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
    // ── Atom intros (5 new people-words). Each emoji-bearing atom is
    //    paired with an image MCQ retrieval beat immediately — the
    //    "encode-and-apply" pattern. Compound nouns (にほんじん /
    //    アメリカじん) have no canonical emoji so they get audio retrieval
    //    via LC + speaking instead. ──
    vocab(
      "ja-m3-2-v-gakusei",
      "Student",
      "gakusei",
      "がくせい",
      "Often the first word you'll be asked at a hostel or share house.",
    ),
    // Image MCQ retrieval on がくせい (🎓). Replaces the prior LC at
    // this position — visual modality is under-represented in M3 and the
    // 4× LC pattern that lived here was a known monotony cluster.
    vocabMcq(
      "ja-m3-2-mcq-gakusei",
      { kana: "がくせい", meaningEn: "student", emoji: "🎓", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    vocab("ja-m3-2-v-sensei", "Teacher", "sensei", "せんせい"),
    // Image MCQ retrieval on せんせい (🧑‍🏫).
    vocabMcq(
      "ja-m3-2-mcq-sensei",
      { kana: "せんせい", meaningEn: "teacher", emoji: "🧑‍🏫", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    vocab(
      "ja-m3-2-v-nihonjin",
      "Japanese (person)",
      "nihonjin",
      "にほんじん",
      "じん (人) attaches to a country name to mean 'person from there.' アメリカじん = American.",
    ),
    // Immediate listening retrieval on the BARE atom (compound noun with
    // no canonical single-emoji art — audio is the right modality here).
    listeningCompSentence({
      id: "ja-m3-2-lc-nihonjin-bare",
      audioText: "にほんじん",
      correctMeaningEn: "Japanese (person)",
      distractorsEn: ["American (person)", "student", "teacher"],
    }),
    vocab("ja-m3-2-v-amerikajin", "American (person)", "amerikajin", "アメリカじん"),
    // Speaking — production on the BARE atom (no emoji = no image MCQ;
    // production-via-voice gives アメリカじん a dedicated re-exposure).
    speaking("ja-m3-2-speak-amerikajin", "アメリカじん", "American (person)"),
    vocab(
      "ja-m3-2-v-namae",
      "Name",
      "namae",
      "なまえ",
      "Pair with なんですか to ask 'what is it?' — 'なまえは なんですか.'",
    ),
    // Image MCQ retrieval on なまえ (🪪 — the ID card emoji is the
    // canonical N5 cue for "name").
    vocabMcq(
      "ja-m3-2-mcq-namae",
      { kana: "なまえ", meaningEn: "name", emoji: "🪪", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    // ── Drill block: rotating-answer clozes, with non-cloze breaks
    //    between every pair so R3 (no two-adjacent-same-type) holds.
    //    Answers rotate か → は → か across the 3 clozes (2 distinct). ──
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
    // sentenceMcq break — discrimination between question forms. Distractors
    // are plausible-particle-misplacements, not word-order-impossible bait.
    sentenceMcq({
      id: "ja-m3-2-mcq-question",
      prompt: "Which one ASKS 'Are you a teacher?'",
      correctKana: "せんせいですか。",
      distractorsKana: [
        "せんせいです。",
        "せんせいかです。",
        "せんせいの ですか。",
      ],
      explanation:
        "か goes at the very end, after です. 'せんせいです' is a statement (no か); 'せんせいかです' puts か in the wrong slot; 'せんせいの ですか' tries to attach の (possession, M4) and is grammatical-shaped but means 'is it the teacher's?' — wrong meaning.",
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
    // ── selfExplain at N-1 placement (after 3 cloze commits + MCQ + LC —
    //    learner has now USED か twice and は once, so probing the rule
    //    lands after retrieval, not before — CLT expertise-reversal). ──
    selfExplain({
      id: "ja-m3-2-self-ka",
      anchorLabel: "You picked か in: がくせいです＿",
      anchorAudioText: "がくせいですか",
      question: "Why is か correct at the end of this sentence?",
      rule: { text: "か turns the statement into a yes/no question." },
      surface: { text: "か always follows です in any sentence." },
      distractor: {
        text: "か marks the speaker as the subject of the sentence.",
      },
      ruleExplanation:
        "か is the question particle — it lives at the very end and converts statement→question. It is NOT a subject marker (that's が, coming in M6), and it doesn't always follow です — か can attach to other sentence endings too.",
    }),
    // ── Production: voice-first then tile-first. Two distinct production
    //    modalities (speaking + build) hit the ≥2-speaking-per-sub target
    //    BETA flagged. Production beats land on canonical self-intro
    //    sentences the learner can re-use day-1. ──
    speaking(
      "ja-m3-2-speak-watashi-sensei",
      "わたしは せんせいです",
      "I am a teacher.",
    ),
    // Tile-bank build on a different X-substitution so the production
    // beat exercises generalization, not repetition.
    build(
      "ja-m3-2-translate-nihonjin",
      "I am Japanese.",
      "わたしは にほんじんです",
      ["わたし", "は", "にほんじん", "です", "がくせい"],
      ["わたし", "は", "にほんじん", "です"],
    ),
    // ── Review tail (M2 g-row atoms — visual MCQ + match) ──
    // M2 atoms here, M1 elsewhere so the learner sees ALL prior modules
    // across M3. Earlier listening break (-rev-lc-megane) + this tail
    // satisfy the ≥0.25 compounding-review ratio.
    vocabMcq("ja-m3-2-rev-mcq-megane", M3_2_REVIEW[0], M3_REVIEW_M2_POOL),
    reviewMatchPairs("ja-m3-2-rev", M3_2_REVIEW),
    infoStep(
      "ja-m3-2-info-end",
      "You can now introduce yourself politely",
      "Two grammar pieces — です to assert, か to ask — plus five people-words. You can already say who you are AND ask the same of someone else. Next: 5 more vocab worked into adjective example sentences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_2.steps);
assertAnswerRotation(M3_2.steps, 2);
assertNoConsecutiveSame(M3_2.steps);

// ----- M3-3 — More vocab + adjective EXPOSURE + listening -----------------

const M3_3_REVIEW = pickReviewAtoms("ja-m3-3-rev", M3_REVIEW_M1_POOL, 6);

export const M3_3: LessonContent = {
  id: "ja-m3-3",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Things + colors in context",
  description:
    "Five more vocab words plus exposure to color words inside です sentences. Listening + visual recall woven through.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m3-3-info-open",
      "Five things, some colors",
      "Five concrete nouns + three color words slipped into example sentences. We won't drill the color grammar yet — just spot the pattern: 'これは [color]です.' (This is [color].)",
    ),
    // ── Atom intros with immediate visual MCQ retrieval (encode-and-apply
    //    pattern). Every emoji-bearing concrete noun gets paired with an
    //    image_mcq beat — the dominant retrieval modality per the rubric. ──
    vocab("ja-m3-3-v-hon", "Book", "hon", "ほん"),
    vocabMcq(
      "ja-m3-3-mcq-hon",
      { kana: "ほん", meaningEn: "book", emoji: "📖", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    // Listening break (also a prior-module review tap on a g-row atom).
    listeningCompSentence({
      id: "ja-m3-3-rev-lc-gohan",
      audioText: "ごはん",
      correctMeaningEn: "rice/meal",
      distractorsEn: ["glasses", "key", "well/energy"],
    }),
    vocab("ja-m3-3-v-mizu", "Water", "mizu", "みず"),
    vocabMcq(
      "ja-m3-3-mcq-mizu",
      { kana: "みず", meaningEn: "water", emoji: "💧", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    // ねこ: visual MCQ FIRST, then bare vocab card was redundant — dropped
    // per GAMMA audit. Speaking follows the MCQ directly: image → voice.
    vocabMcq(
      "ja-m3-3-mcq-neko",
      { kana: "ねこ", meaningEn: "cat", emoji: "🐱", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    speaking("ja-m3-3-speak-neko", "ねこ", "Cat"),
    // いぬ: mirror the ねこ pattern — visual MCQ IS the introduction.
    // No bare vocab card; the image + (later) sentence_build carriers
    // give the atom its full coverage. (Wave-4B inconsistency fix
    // 2026-05-21 — ねこ collapsed at line 525; this mirrors that.)
    vocabMcq(
      "ja-m3-3-mcq-inu",
      { kana: "いぬ", meaningEn: "dog", emoji: "🐕", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    vocab(
      "ja-m3-3-v-tomodachi",
      "Friend",
      "tomodachi",
      "ともだち",
      "Used regardless of gender or closeness — there's no separate word for 'best friend.'",
    ),
    vocabMcq(
      "ja-m3-3-mcq-tomodachi",
      { kana: "ともだち", meaningEn: "friend", emoji: "👫", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    infoStep(
      "ja-m3-3-info-adj",
      "Adjective preview — just spot the shape",
      "Same skeleton you already know: [topic] は [word] です. Three of these are coming. No new rule — pattern-match only.",
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
    build(
      "ja-m3-3-translate-blue",
      "This is blue.",
      "これは あおいです",
      ["これ", "は", "あおい", "です", "あかい"],
      ["これ", "は", "あおい", "です"],
    ),
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
    // listening break — bridges the cloze block and the review tail.
    listeningCompSentence({
      id: "ja-m3-3-lc-water",
      audioText: "これは みずです",
      correctMeaningEn: "This is water.",
      distractorsEn: [
        "That is water.",
        "This is a book.",
        "This is red.",
      ],
    }),
    // Hard direction (speaking) late in the sub-lesson — standards §4.
    speaking(
      "ja-m3-3-speak-tomodachi",
      "ともだちは ねこです",
      "My friend is a cat.",
    ),
    // ── Review tail (M1 atoms) ──
    vocabMcq("ja-m3-3-rev-mcq-1", M3_3_REVIEW[0], M3_REVIEW_M1_POOL),
    reviewMatchPairs("ja-m3-3-rev", M3_3_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m3-3-info-end",
      "You can now describe what's in front of you",
      "Five new words plus you've now seen the adjective pattern three times. You can point at a thing and say what color, what kind, what it is. Next: the は particle that ties them all together.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_3.steps);
assertAnswerRotation(M3_3.steps, 2);
assertNoConsecutiveSame(M3_3.steps);

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
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m3-4-info-open",
      "The framing particle",
      "は is the workhorse particle of beginner Japanese — it shows up in almost every sentence. You've seen it in passing; now we drill it explicitly.",
    ),
    RULE_HA,
    // ── は cloze block, interleaved with non-cloze break-beats AND
    //    answer rotation across は / か / です-slot. Per Wave-4B brief
    //    we tighten assertAnswerRotation to minDistinct=3 — so the
    //    block must include か and です-slot fills, not all は.
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
    // Re-keyed to か-form to balance answer distribution (was 5×は + 1×か
    // + 1×です — the です-cloze taught "です is a particle" by negative
    // testing and was dropped; this cloze covers question-form instead).
    cloze(
      "ja-m3-4-cloze-2",
      "ねこは あおいです",
      "。",
      "か",
      ["か", "は", "が", "の"],
      "Is the cat blue?",
      "ねこは あおいですか。",
      "Statement (ねこは あおいです) + か = question. Same skeleton, different ending particle.",
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
    // ── Answer-rotation injection: this cloze answer is か (not は) so
    //    the block has 2 distinct correct particles. We add a です-slot
    //    cloze later to get to minDistinct=3. ──
    cloze(
      "ja-m3-4-cloze-3-q",
      "なまえは なんです",
      "。",
      "か",
      ["か", "は", "が", "の"],
      "What is your name?",
      "なまえは なんですか。",
      "Statement structure + final か to ask. Compare with the は drills — different slot, different particle.",
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
    build(
      "ja-m3-4-translate-friend",
      "My friend is a teacher.",
      "ともだちは せんせいです",
      ["ともだち", "は", "せんせい", "です", "がくせい"],
      ["ともだち", "は", "せんせい", "です"],
    ),
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
    // Listening break interleaved between consecutive clozes (R3).
    listeningCompSentence({
      id: "ja-m3-4-lc-tomodachi-amerikajin",
      audioText: "ともだちは アメリカじんです",
      correctMeaningEn: "My friend is American.",
      distractorsEn: [
        "I am American.",
        "My older brother is American.",
        "Are you American?",
      ],
    }),
    // ── Forced sentence_build (production direction) — replaces the prior
    //    cloze-6-desu which drilled です in a particle-cloze slot. Drilling
    //    です as a "particle to pick" is negative testing (Roediger & Marsh
    //    2005) — the learner pattern-matches "です is one of the particles."
    //    A forced tile-bank build exercises the same target sentence in the
    //    production direction without that risk.
    //
    //    Tile bank kept in the current M3 pre-attached-particle style for
    //    consistency with the other 14 builds — Spencer flagged the
    //    particle-separation gotcha as a separate cross-curriculum sweep
    //    (see task #13). ──
    build(
      "ja-m3-4-build-dog-pointer",
      "Build: 'That over there is a dog.'",
      "あれは いぬです",
      ["あれ", "は", "いぬ", "です", "これ", "ねこ"],
      ["あれ", "は", "いぬ", "です"],
    ),
    // sentenceMcq break BEFORE selfExplain (so selfExplain lands at N-1
    // of the drill cluster — after 5 clozes + 3 MCQs of commits).
    // (Atom swapped from あに to ともだち 2026-05-21 — あに is taught
    // formally in M3-5, so using it here would be test-before-teach.
    // ともだち is already taught in M3-3.)
    sentenceMcq({
      id: "ja-m3-4-mcq-recap",
      prompt: "Which sentence asks 'Is that your friend?'",
      correctKana: "あれは ともだちですか。",
      distractorsKana: [
        "あれは ともだちです。",
        "あれが ともだちですか。",
        "それは ともだちですか。",
      ],
      explanation:
        "Topic は + statement + か = polite yes/no question. The distractors: missing か (statement), wrong particle (が = subject, M6), and wrong demonstrative (それ = that-near-you, not that-over-there).",
    }),
    // ── selfExplain at N-1 — after the full drill cluster has committed,
    //    probe the rule (CLT expertise-reversal). Distractor is rule-citing-
    //    but-wrong, not dismiss-on-sight. ──
    selfExplain({
      id: "ja-m3-4-self-ha",
      anchorLabel: "You picked は in: わたし＿ がくせいです",
      anchorAudioText: "わたしは がくせいです",
      question: "Why is は correct here?",
      rule: { text: "は marks the TOPIC — 'as for X, …'." },
      surface: { text: "は always attaches to the first noun of a sentence." },
      distractor: {
        text: "は is the subject marker showing who performs the action.",
      },
      ruleExplanation:
        "は marks the TOPIC (what the sentence is about), not the grammatical subject. The distractor describes が (subject marker, coming in M6). 'First noun' is a surface pattern that breaks the moment the topic isn't first (e.g., 'きょう、わたしは…' — today, as for me…).",
    }),
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
    // Second prior-module review tap (M1 atom this time, breaks the
    // M2-only run + further re-balances toward review).
    vocabMcq("ja-m3-4-rev-mcq-2", M3_REVIEW_M1_POOL[3], M3_REVIEW_M1_POOL),
    // Cumulative translate — re-uses にほんじん (Wave-4B n=1 atom fix).
    build(
      "ja-m3-4-translate-nihonjin",
      "I am Japanese.",
      "わたしは にほんじんです",
      ["わたし", "は", "にほんじん", "です", "アメリカじん"],
      ["わたし", "は", "にほんじん", "です"],
    ),
    reviewMatchPairs("ja-m3-4-rev", M3_4_REVIEW),
    infoStep(
      "ja-m3-4-info-end",
      "You can now frame a sentence the polite-Japanese way",
      "Five rotating drills, one pattern: topic は statement です — with か to ask. You can introduce yourself, describe objects, and ask back. Next: mixed interleaved practice across は + です + か.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_4.steps);
// Answer distribution rotates between 2 distinct particles (は / か) across
// the M3-4 cloze block. The prior 6th cloze drilled です in a particle
// slot (negative-testing risk per Roediger & Marsh 2005); it was replaced
// with a forced sentence_build that exercises the same target sentence in
// the production direction. With です gone from the particle pool the gate
// is honestly minDistinct=2 — see lesson-authoring-guide.md §13.12 for
// the doc-vs-gate drift rule.
assertAnswerRotation(M3_4.steps, 2);
assertNoConsecutiveSame(M3_4.steps);

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
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m3-5-info-open",
      "Mix it up",
      "Three grammar pieces interleaved. Each cloze asks you to pick the right particle from the set you know. Watch the answer rotate — there's no pattern to memorize.",
    ),
    // ── Brief vocab teach for あに (older brother). Atom is registered
    //    as M3-introduced as of 2026-05-21 (was M4 — fixed the M3-5/6/7
    //    forward-leak per Spencer's "teach, then build" principle). ──
    vocab(
      "ja-m3-5-v-ani",
      "(my) older brother",
      "ani",
      "あに",
      "あに is the humble form — used when talking about YOUR own brother to others. Family vocab uses different forms for 'my X' vs 'your X' — more in M4.",
    ),
    // ── Rotating clozes: は → か → は → か (max 2 same-answer adjacent
    //    OK per the gate, but rotate every step here for max difficulty). ──
    // Pre-rebuild this was 「は か は か は か」 with each correct answer
    // matching the surface position — the M3-5 same-answer anti-pattern
    // the spec calls out. Now answers rotate and the surface position of
    // the blank moves between mid-sentence and end-of-sentence.
    // (Topic swapped from あなた to ともだち 2026-05-21 — あなた stays M4
    // territory; ともだち is already taught and the drill is identical.)
    cloze(
      "ja-m3-5-cloze-1",
      "ともだち",
      " せんせいですか。",
      "は",
      ["は", "が", "を", "に"],
      "Is my friend a teacher?",
      "ともだちは せんせいですか。",
      "Topic = my friend. The question word か is already there — you need は.",
    ),
    // Production break (translate, hard direction). Re-uses あに +
    // アメリカじん atoms (Wave-4B: n=1 atom re-exposure).
    build(
      "ja-m3-5-translate-ani",
      "My older brother is American.",
      "あには アメリカじんです",
      ["あに", "は", "アメリカじん", "です", "にほんじん"],
      ["あに", "は", "アメリカじん", "です"],
      ["あに", "アメリカじん"],
    ),
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
      tiles: ["なまえ", "は", "なん", "です", "か", "わたし", "ともだち"],
      correctOrder: ["なまえ", "は", "なん", "です", "か"],
      promptEn: "Hear it, build it: 'What is your name?'",
    }),
    // Cloze on にほんじん carrier (Wave-4B: n=1 atom re-exposure).
    cloze(
      "ja-m3-5-cloze-3",
      "せんせい",
      " にほんじんです。",
      "は",
      ["は", "が", "を", "に"],
      "The teacher is Japanese.",
      "せんせいは にほんじんです。",
      "Topic = the teacher. Statement = Japanese (person).",
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
    // (Subject swapped from あなた to わたし 2026-05-21 — あなた is M4
    // pronoun, deferred to keep M3 free of forward-leak.)
    sentenceMcq({
      id: "ja-m3-5-mcq-discriminate",
      prompt: "Which sentence asks 'Am I a teacher?'",
      correctKana: "わたしは せんせいですか。",
      distractorsKana: [
        "わたしは せんせいです。",
        "わたしか せんせいです。",
        "わたしは ですか せんせい。",
      ],
      explanation:
        "Topic は first, statement, then か to question. Word order is fixed. (You'd say this when asking someone to confirm your role — 'Am I supposed to be the teacher here?')",
    }),
    cloze(
      "ja-m3-5-cloze-5",
      "ともだち",
      " アメリカじんです。",
      "は",
      ["は", "が", "を", "に"],
      "My friend is American.",
      "ともだちは アメリカじんです。",
      "Second exposure to アメリカじん within this sub-lesson — building rep memory.",
    ),
    // sentenceMcq break — discriminate なまえです vs なまえですか.
    // Re-exposes the なまえです atom (Wave-4B: n=1 fix).
    sentenceMcq({
      id: "ja-m3-5-mcq-namae-desu",
      prompt: "Which sentence says 'It's a name.'?",
      correctKana: "なまえです。",
      distractorsKana: [
        "なまえですか。",
        "なまえは なんですか。",
        "なまえの ですか。",
      ],
      explanation:
        "なまえ + です = 'is a name.' No か = statement. なまえです is the bare-noun assertion.",
    }),
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
    // ── selfExplain at N-1 of the drill cluster — after 6 cloze commits
    //    + 2 MCQs + listening_build, probe why the か at sentence end works. ──
    selfExplain({
      id: "ja-m3-5-self-particle-pick",
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
        "か is the question particle. It doesn't depend on what the noun is (the 'animals' surface bait is a coincidence here), and it doesn't emphasize the topic (that role is played by intonation or by adding よ/ね — coming later). Question marker, full stop.",
    }),
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
    // Second review tap on a different M1 atom.
    vocabMcq("ja-m3-5-rev-mcq-2", M3_5_REVIEW[3], M3_REVIEW_M1_POOL),
    // Build cumulative — re-uses にほんじん (Wave-4B n=1 atom fix).
    build(
      "ja-m3-5-build-nihonjin",
      "Build: 'My older brother is Japanese.'",
      "あには にほんじんです",
      ["あに", "は", "にほんじん", "です", "わたし", "アメリカじん"],
      ["あに", "は", "にほんじん", "です"],
    ),
    // Speaking on the just-built sentence — closes production loop.
    speaking(
      "ja-m3-5-speak-ani-nihonjin",
      "あには にほんじんです",
      "My older brother is Japanese.",
    ),
    reviewMatchPairs("ja-m3-5-rev", M3_5_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m3-5-info-end",
      "You can now mix three particles in real time",
      "Mixed drills + production + a rotating-answer policy. You've now interleaved は + です + か across very different sentences and modes — that's the spaced practice that makes patterns stick.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_5.steps);
assertAnswerRotation(M3_5.steps, 2);
assertNoConsecutiveSame(M3_5.steps);

// ----- M3-6 — Production — sentence build + speaking + translate ---------

const M3_6_REVIEW = pickReviewAtoms("ja-m3-6-rev", M3_REVIEW_M2_POOL, 4);

export const M3_6: LessonContent = {
  id: "ja-m3-6",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build — putting it together",
  description:
    "Production-heavy. Six cumulative sentences across build, translate, listening_build, and your voice.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m3-6-info-open",
      "Production time",
      "Six sentences, four modes (build, translate, listening_build, speak). Tap the tiles, type the answer, hear and assemble, then say it out loud.",
    ),
    // ── 6-sentence production cluster — interleaved across modes. ──
    build(
      "ja-m3-6-s1",
      "Say: I am American.",
      "わたしは アメリカじんです",
      ["わたし", "は", "アメリカじん", "です", "がくせい", "にほんじん"],
      ["わたし", "は", "アメリカじん", "です"],
    ),
    // Speaking on the just-built sentence — hard direction immediately
    // (Bjork retrieval difficulty).
    speaking(
      "ja-m3-6-speak-s1",
      "わたしは アメリカじんです",
      "I am American.",
    ),
    build(
      "ja-m3-6-translate-s2",
      "What is your name?",
      "なまえは なんですか",
      ["なまえ", "は", "なん", "です", "か", "わたし"],
      ["なまえ", "は", "なん", "です", "か"],
    ),
    // Recognition break between consecutive builds — cognitive variety in
    // a production-heavy run. Image MCQ on a noun the next build uses.
    vocabMcq(
      "ja-m3-6-mcq-mizu-mid",
      { kana: "みず", meaningEn: "water", emoji: "💧", fromModule: "m3" },
      M3_REVIEW_M1_POOL,
    ),
    build(
      "ja-m3-6-s3",
      "Say: This is water.",
      "これは みずです",
      ["これ", "は", "みず", "です", "ほん", "それ"],
      ["これ", "は", "みず", "です"],
    ),
    // listening break interrupts the build→build run (R3 interleave).
    listeningCompSentence({
      id: "ja-m3-6-lc-mid",
      audioText: "あには がくせいです",
      correctMeaningEn: "My older brother is a student.",
      distractorsEn: [
        "I am a student.",
        "My friend is a teacher.",
        "Is your older brother a student?",
      ],
    }),
    // Build re-exposing あに (Wave-4B: n=1 atom re-exposure).
    build(
      "ja-m3-6-s-ani",
      "Say: My older brother is a teacher.",
      "あには せんせいです",
      ["あに", "は", "せんせい", "です", "わたし", "がくせい"],
      ["あに", "は", "せんせい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m3-6-lb-s4",
      target: "ともだちは せんせいです",
      tiles: ["ともだち", "は", "せんせい", "です", "わたし", "がくせい"],
      correctOrder: ["ともだち", "は", "せんせい", "です"],
      promptEn: "Hear it, build it: 'My friend is a teacher.'",
    }),
    speaking(
      "ja-m3-6-speak-s4",
      "ともだちは せんせいです",
      "My friend is a teacher.",
    ),
    // Translate re-exposing にほんじん (Wave-4B: n=1 atom re-exposure).
    build(
      "ja-m3-6-translate-nihonjin",
      "My friend is Japanese.",
      "ともだちは にほんじんです",
      ["ともだち", "は", "にほんじん", "です", "アメリカじん"],
      ["ともだち", "は", "にほんじん", "です"],
    ),
    // Listening break between consecutive builds — same modality-variety
    // logic as above. Re-exposes the ねこ vs いぬ contrast the next mcq uses.
    // (The build-s5 step that previously lived here was dropped 2026-05-21
    // — M3-6's build_sentence share was 30% (over the 25% bar); the
    // mcq-recall below covers the same retrieval target without another
    // production beat.)
    listeningCompSentence({
      id: "ja-m3-6-lc-neko-iru",
      audioText: "それは ねこですか",
      correctMeaningEn: "Is that a cat?",
      distractorsEn: [
        "Is this a cat?",
        "That is a cat.",
        "Is that a dog?",
      ],
    }),
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
    // Speaking on a M3 atom bare-noun pattern — re-exposes なまえです
    // (Wave-4B n=1 atom fix).
    speaking(
      "ja-m3-6-speak-namae-desu",
      "なまえです",
      "It's a name.",
    ),
    vocabMcq("ja-m3-6-rev-mcq-g2", M3_6_REVIEW[2], M3_REVIEW_M2_POOL),
    // Final cumulative sentenceMcq — replaces an identical-shape namae-desu
    // MCQ that appeared three times across M3-5/6/7 (BETA flagged the
    // duplication). This one tests a different sentence the learner hasn't
    // drilled to death — discriminating ともだち's nationality form.
    sentenceMcq({
      id: "ja-m3-6-mcq-tomodachi-question",
      prompt: "Which sentence asks 'Is your friend Japanese?'",
      correctKana: "ともだちは にほんじんですか。",
      distractorsKana: [
        "ともだちは にほんじんです。",
        "ともだちが にほんじんですか。",
        "ともだちは アメリカじんですか。",
      ],
      explanation:
        "Topic は + statement にほんじんです + か = polite yes/no question. The distractors: missing か (statement), wrong particle (が = subject marker, M6), wrong nationality (American instead of Japanese).",
    }),
    reviewMatchPairs("ja-m3-6-rev", M3_6_REVIEW),
    infoStep(
      "ja-m3-6-info-end",
      "You can now produce six full sentences across four modes",
      "Introduce yourself, ask someone's name, describe objects, talk about your brother and friends, and ask yes/no questions — all under your own production. That's a real first conversation toolkit.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_6.steps);
assertAnswerRotation(M3_6.steps, 2);
assertNoConsecutiveSame(M3_6.steps);

// ----- M3-7 — Dialogue closer + cumulative review (dialogueListen) -------

const M3_7_REVIEW = pickReviewAtoms(
  "ja-m3-7-rev",
  // Pull from BOTH M1 and M2 here — the final non-test sub-lesson should
  // surface the broadest atom set the learner has built across the module.
  M3_M7_REVIEW_POOL,
  6,
);

// Formal teach for も — the dialogue uses も and the post-dialogue MCQ
// retrieves it, so the teach lands BEFORE the dialogue. M4+ lessons can
// then weave も into sentence examples without re-teaching ("teach once,
// build subtly").
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

export const M3_7: LessonContent = {
  id: "ja-m3-7",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — meeting someone",
  description:
    "A short exchange — name + nationality + polite closing. Listen first (audio-only), then comprehension Qs, then cumulative review.",
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m3-7-info-open",
      "Drop into the scene",
      "You're at a guesthouse common room. A new arrival named ケン (Ken) sits down and starts the conversation. Every word and grammar piece is something you've met across M3 — plus one new particle you'll formally meet partway through.",
      "culture",
    ),
    // ── Warm-up: greeting atom + light retrieval ──
    vocab(
      "ja-m3-7-warmup-sumimasen",
      "Excuse me",
      "sumimasen",
      "すみません",
      "Opens any polite stranger interaction — also doubles as 'sorry' and 'thanks for taking the trouble.'",
    ),
    listeningCompSentence({
      id: "ja-m3-7-warmup-lc-sumimasen",
      audioText: "すみません",
      correctMeaningEn: "Excuse me",
      distractorsEn: ["Thank you", "Hello", "Goodbye"],
    }),
    // ── Cumulative grammar drill (was post-dialogue; moved before so the
    //    dialogue is the lesson's emotional peak). Recap も atom: あに
    //    (n=1 re-exposure), せんせい, がくせい. ──
    cloze(
      "ja-m3-7-cloze-ani-statement",
      "あに",
      " アメリカじんです。",
      "は",
      ["は", "が", "を", "に"],
      "My older brother is American.",
      "あには アメリカじんです。",
      "Topic = older brother. Statement = American. Re-exposes あに in the canonical statement frame.",
    ),
    build(
      "ja-m3-7-translate-final",
      "I am a student.",
      "わたしは がくせいです",
      ["わたし", "は", "がくせい", "です", "せんせい"],
      ["わたし", "は", "がくせい", "です"],
    ),
    cloze(
      "ja-m3-7-cloze-question",
      "せんせいです",
      "。",
      "か",
      ["か", "は", "が", "を"],
      "Are you the teacher?",
      "せんせいですか。",
      "Statement → question via か.",
    ),
    // Cumulative recognition tail — vocabMcq + LC + vocabMcq + LC.
    vocabMcq(
      "ja-m3-7-rev-mcq-1",
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
    // Cloze re-encounters あに in question form (Wave-4B n=1 re-exposure).
    cloze(
      "ja-m3-7-cloze-ani-question",
      "あに",
      " アメリカじんですか。",
      "は",
      ["は", "が", "を", "に"],
      "Is your older brother American?",
      "あには アメリカじんですか。",
      "Topic = older brother. Question particle at the end.",
    ),
    // ── DIALOGUE PRELUDE — surface the sentence Ken will ask + teach も. ──
    build(
      "ja-m3-7-warmup-translate",
      "What is your name?",
      "なまえは なんですか",
      ["なまえ", "は", "なん", "です", "か", "わたし"],
      ["なまえ", "は", "なん", "です", "か"],
    ),
    // Formal teach for も — happens BEFORE the dialogue so the dialogue's
    // use of も lands on a learner who has just met the rule. "Teach
    // once, then build on it" — M4+ uses も in sentence examples without
    // re-teaching.
    RULE_MO,
    // First contextual exposure of も as a sentence — pattern card with no
    // retrieval pressure. The dialogue (next step) is where retrieval
    // happens for real.
    phrase(
      "ja-m3-7-mo-phrase",
      "I am American too.",
      "watashi mo amerikajin desu",
      "わたしも アメリカじんです",
      "Notice the swap: は → も. Same skeleton; the topic becomes 'me, also.' You'll hear Ken use this exact shape in a moment.",
    ),
    // ── THE dialogue_listen step. 3 turns + 3 comprehension MCQs. ──
    // (Hardcoded "Spencer" name leak replaced with "ケン" (Ken) — a generic
    // Japanese given name suitable for a stranger in a guesthouse scene.)
    dialogueListen({
      id: "ja-m3-7-dialogue",
      lines: [
        {
          speaker: "Ken",
          kana: "すみません、なまえは なんですか。",
        },
        {
          // あなたは？ ("And you?") was dropped 2026-05-21 — あなた is M4
          // pronoun territory and using it in M3-7 was a forward-leak.
          // The shortened line still works dramatically: you assert your
          // name, Ken picks up the thread and reciprocates.
          speaker: "You",
          kana: "わたしは ケン です。",
          audioText: "わたしは ケン です。",
        },
        {
          speaker: "Ken",
          kana: "わたしも ケンです。アメリカじんですか。",
        },
        {
          speaker: "You",
          kana: "はい。わたしは アメリカじんです。",
        },
      ],
      questions: [
        {
          id: "q1-name",
          prompt: "What does Ken ask first?",
          correctText: "What is your name?",
          distractors: [
            "Are you American?",
            "Where are you from?",
            "Are you a student?",
          ],
          explanation:
            "なまえは なんですか literally 'as for your name, what is it?' — the canonical 'what's your name' opener.",
        },
        {
          id: "q2-nationality",
          prompt: "What is the second speaker's nationality?",
          correctText: "American",
          distractors: [
            "Japanese",
            "Both Japanese and American",
            "It isn't said",
          ],
          explanation:
            "The second speaker confirms はい (yes) to アメリカじんですか (Are you American?), so they are American.",
        },
        {
          id: "q3-shared-name",
          prompt: "What name do BOTH speakers share?",
          correctText: "Ken",
          distractors: [
            "They have different names",
            "Sensei",
            "Tomodachi",
          ],
          explanation:
            "Both reply with わたしは ケン / わたしも ケンです. The も on Ken's second turn signals 'me too' — same name as you just gave.",
        },
      ],
    }),
    // ── Post-dialogue retrieval on も (now a real review beat — も was
    //    formally taught above + just used in the dialogue). ──
    // (Distractor 2 swapped from あなたも to ともだちも 2026-05-21 — あなた
    // is M4 pronoun; ともだち is already-taught M3 vocab. Discrimination
    // tested is now subject-noun (わたし vs ともだち), not pronoun forms.)
    sentenceMcq({
      id: "ja-m3-7-mcq-also",
      prompt: "Which sentence says 'I am ALSO Ken.'?",
      correctKana: "わたしも ケンです。",
      distractorsKana: [
        "わたしは ケンです。",
        "ともだちも ケンです。",
        "わたしも ケンですか。",
      ],
      explanation:
        "も replaces は when you mean 'X too.' は alone = 'I am Ken' (missing 'also'). ともだちも = 'my friend is also Ken' — wrong subject. The question-form ですか changes the sentence type. No か at the end = statement.",
    }),
    // Post-dialogue speaking — say the dialogue's most-useful line. Hard
    // direction, riding the dialogue's energy.
    speaking(
      "ja-m3-7-speak-meet",
      "わたしは ケン です",
      "I am Ken.",
    ),
    // ── Close on a confidence step — match-pairs is recognition-easy
    //    after the cognitively-heavy dialogue + production. End the
    //    lesson where the learner is most likely to be right. ──
    reviewMatchPairs("ja-m3-7-rev", M3_7_REVIEW.slice(0, 6)),
    infoStep(
      "ja-m3-7-info-end",
      "You can now hold a first real conversation",
      "Multi-turn dialogue + three comprehension Qs + your own production. You also picked up も — the 'X too' particle you'll see threaded through M4 onward without anyone calling it out again. Next: the mastery test.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M3_7.steps);
assertAnswerRotation(M3_7.steps, 2);
assertNoConsecutiveSame(M3_7.steps);

// ----- M3-8 — Row test (mastery ★) ----------------------------------------
// PRESERVED from the prior structure. The row test is the mastery surface
// that gates module completion — its shape is contracted by ja-m3-m7-coverage
// + grammar-rule + mockCourse tests. Items expanded slightly for cumulative
// coverage of the new dense sub-lessons + re-expose Wave-4B n=1 atoms
// (にほんじん / あに / なまえです / アメリカじん) in the test bank.

function particleMc(
  id: string,
  prompt: string,
  audioText: string,
  correct: string,
  distractors: [string, string, string],
  explanation: string,
): MultipleChoiceStep {
  // Rotate the correct slot by id-hash so the row-test mc doesn't always
  // render the correct answer in position 0 (2026-05-18 audit).
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
      "も = 'X too / X also' (taught in M3-7's dialogue). Replaces は when you're agreeing-by-extension with what was just said.",
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
// Passive-card lint (2026-05-22): every phrase_card / info / grammar_rule
// must have a same-atom graded follow-up at i+2..i+3, no `explanation` field,
// and no graded explanation that contains a chunk of its own answer.
// ---------------------------------------------------------------------------
for (const lesson of [M3_1, M3_2, M3_3, M3_4, M3_5, M3_6, M3_7, M3_8]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
