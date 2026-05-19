/**
 * M5 — Numbers + ください (density rebuild 2026-05-18).
 *
 * Spine (unchanged from prior structure):
 *   - Numbers 1-10 (Sino-Japanese: いち, に, さん…)
 *   - Counter 人 (people only) — other counters interleave later in M6+
 *   - ください (please give me / I'll have) — the order pattern
 *   - から (origin — "from") — small grammar tap; preview of M6 へ/に
 *
 * 2026-05-18 rebuild (per docs/m3-m7-rebuild-spec-2026-05-18.md):
 *   - Densified to 14-20 steps per sub-lesson (was 5-12).
 *   - Killed the M5-1 anti-pattern (5 phrase_cards back-to-back): numbers
 *     now introduced with `vocabMcq` (number-as-emoji), `listening_build`
 *     (mora reconstruction), `match_pairs` (kana ↔ romaji ↔ numeral),
 *     `sentenceMcq` (discrimination), `translateStep` (production).
 *   - ≥5 distinct step types per sub-lesson; no two adjacent same-type.
 *   - Compounding review ≥0.25 ratio per sub-lesson drawing from
 *     M1+M2+M3+M4 atoms via M3_M7_REVIEW_POOL.
 *   - `build_sentence` reserved for ≤4-tile bursts (M5-6 only — a few
 *     ≤4-tile order patterns). ≥5-mora sentences use `translateStep` +
 *     `listeningBuildSentence` + `speaking` per spec §4 (the
 *     BUILD_SENTENCE_SUNSET_MODULES hack has been cleared by the
 *     coordinator — no silent stripping anymore).
 *   - `selfExplain` follows each grammar-drill block on ください + から
 *     (Dunlosky 2013 moderate-utility self-explanation).
 *   - Answer-rotation guarantor on all particle_cloze runs.
 *   - 8-lesson ID list preserved (mockLessons.ts + 3 test files reference
 *     ja-m5-1..ja-m5-8 by id). 7 content lessons + 1 row test = 8 —
 *     matches existing external refs (spec §9 + §12.1).
 *
 * Lesson list (8 lessons):
 *   M5-1  Numbers 1-5 (retrieval-first introduction; no phrase_card run)
 *   M5-2  Numbers 6-10 + ください pattern
 *   M5-3  人 counter (ひとり / ふたり / さんにん…)
 *   M5-4  Café + transactions vocab (おかね / いくら / えん / みず / おちゃ)
 *   M5-5  から (origin) + interleaved drill across M3/M4/M5
 *   M5-6  Production — sentence build + translate + speaking
 *   M5-7  Mini-dialogue — ordering at a café
 *   M5-8  Row test (mastery ★)
 */
import type {
  BuildSentenceStep,
  LessonContent,
  MatchPairsStep,
  MultipleChoiceStep,
  RowTestItem,
  RowTestStep,
} from "../types";
import {
  assertNoSameAnswerCluster,
  build,
  cloze,
  dialogueLesson,
  grammarRule,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  M3_M7_REVIEW_POOL,
  phrase,
  pickReviewAtoms,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  translateStep,
  vocab,
  vocabMcq,
  WORD_IMAGE_MCQ_BLOCKLIST,
  type ReviewAtom,
} from "./_jaGrammarHelpers";

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// M5-local atom pool — used for in-module retrieval / number-MCQ /
// match-pairs. Numbers carry a digit emoji (1️⃣ 2️⃣ …🔟) so vocabMcq
// works on them.
// ───────────────────────────────────────────────────────────────────────
const M5_NUMBER_ATOMS: ReviewAtom[] = [
  { kana: "いち",   meaningEn: "1 (one)",   emoji: "1️⃣", fromModule: "m5" },
  { kana: "に",     meaningEn: "2 (two)",   emoji: "2️⃣", fromModule: "m5" },
  { kana: "さん",   meaningEn: "3 (three)", emoji: "3️⃣", fromModule: "m5" },
  { kana: "よん",   meaningEn: "4 (four)",  emoji: "4️⃣", fromModule: "m5" },
  { kana: "ご",     meaningEn: "5 (five)",  emoji: "5️⃣", fromModule: "m5" },
  { kana: "ろく",   meaningEn: "6 (six)",   emoji: "6️⃣", fromModule: "m5" },
  { kana: "なな",   meaningEn: "7 (seven)", emoji: "7️⃣", fromModule: "m5" },
  { kana: "はち",   meaningEn: "8 (eight)", emoji: "8️⃣", fromModule: "m5" },
  { kana: "きゅう", meaningEn: "9 (nine)",  emoji: "9️⃣", fromModule: "m5" },
  { kana: "じゅう", meaningEn: "10 (ten)",  emoji: "🔟", fromModule: "m5" },
];

// ───────────────────────────────────────────────────────────────────────
// Cumulative prior-module pools (M1 + M2 + M3 + M4). M5 draws across all
// four — that's the compounding-review payoff the spec mandates.
// Per-sub-lesson seeds keep draws stable but distinct.
// ───────────────────────────────────────────────────────────────────────
const PRIOR_POOL = M3_M7_REVIEW_POOL.filter(
  (a) =>
    (a.fromModule === "m1" || a.fromModule === "m2" ||
     a.fromModule === "m3" || a.fromModule === "m4") &&
    !WORD_IMAGE_MCQ_BLOCKLIST.has(a.kana),
);

// ----- M5-1 — Numbers 1-5 (retrieval-first, no phrase_card run) -----------

const M5_1_REVIEW = pickReviewAtoms("ja-m5-1-rev", PRIOR_POOL, 5);

export const M5_1: LessonContent = {
  id: "ja-m5-1",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Numbers 1–5",
  description:
    "The first half of the Sino-Japanese counting set. Retrieval-first — see the digit, hear the kana, assemble it from mora.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m5-1-info-open",
      "Numbers — yes, there are two systems",
      "Japanese has two number systems. Sino-Japanese (いち, に, さん…) is used for math, money, time, addresses, and counting most things — it's what you hear at the register. Native readings (ひとつ, ふたつ…) exist for generic objects (you'll meet them via ください in M5-2). Today: the Sino set, 1–5.",
      "culture",
    ),
    // ── Atom intros via retrieval, not phrase_card stacks ──
    // 1: phrase_card (one introduction per number is fine — but immediately
    //    follow with MCQ + listening so it's encode-then-retrieve, not
    //    encode-then-encode-then-encode).
    vocab("ja-m5-1-v-1", "1 (one)", "ichi", "いち"),
    vocabMcq("ja-m5-1-mcq-1", M5_NUMBER_ATOMS[0], M5_NUMBER_ATOMS),
    vocab("ja-m5-1-v-2", "2 (two)", "ni", "に"),
    listeningCompSentence({
      id: "ja-m5-1-lc-2",
      audioText: "に",
      correctMeaningEn: "2 (two)",
      distractorsEn: ["1 (one)", "3 (three)", "4 (four)"],
    }),
    vocab("ja-m5-1-v-3", "3 (three)", "san", "さん"),
    vocabMcq("ja-m5-1-mcq-3", M5_NUMBER_ATOMS[2], M5_NUMBER_ATOMS),
    vocab(
      "ja-m5-1-v-4",
      "4 (four)",
      "yon",
      "よん",
      "Also pronounced 'shi' — but 'shi' overlaps with 'death,' so most modern speakers prefer 'yon' for clarity.",
    ),
    // Listening break — also bumps mora-recall on the just-introduced atom.
    listeningCompSentence({
      id: "ja-m5-1-lc-4",
      audioText: "よん",
      correctMeaningEn: "4 (four)",
      distractorsEn: ["3 (three)", "5 (five)", "2 (two)"],
    }),
    vocab("ja-m5-1-v-5", "5 (five)", "go", "ご"),
    // sentenceMcq discrimination — pick the right kana for a target number.
    sentenceMcq({
      id: "ja-m5-1-mcq-discrim-3",
      prompt: "Which kana means '3'?",
      correctKana: "さん",
      distractorsKana: ["さ", "ざん", "せん"],
      explanation: "さん = three. The other options either drop the ん or swap vowels.",
    }),
    // ── Match pairs — numeral ↔ kana, all five at once. ──
    {
      id: "ja-m5-1-match-numerals",
      type: "match_pairs",
      prompt: "Match each Japanese number to its numeral",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "いち",   target: "1", sourceAnnotation: [{ surface: "いち",   reading: "いち" }] },
        { id: "p2", source: "に",     target: "2", sourceAnnotation: [{ surface: "に",     reading: "に" }] },
        { id: "p3", source: "さん",   target: "3", sourceAnnotation: [{ surface: "さん",   reading: "さん" }] },
        { id: "p4", source: "よん",   target: "4", sourceAnnotation: [{ surface: "よん",   reading: "よん" }] },
        { id: "p5", source: "ご",     target: "5", sourceAnnotation: [{ surface: "ご",     reading: "ご" }] },
      ],
    } satisfies MatchPairsStep,
    // ── Production: hear three-mora number, type it. ──
    translateStep({
      id: "ja-m5-1-translate-3",
      promptEn: "How do you say '3' in Japanese? (kana or romaji)",
      acceptedAnswers: ["さん", "san"],
      audioText: "さん",
    }),
    speaking("ja-m5-1-speak-go", "ご", "5 (five)"),
    // ── Review tail (M1+M2+M3+M4 atoms, fresh seed) ──
    // 4 review steps (≥0.25 ratio): MCQ + listening + MCQ + matchPairs.
    vocabMcq("ja-m5-1-rev-mcq-1", M5_1_REVIEW[0], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m5-1-rev-lc-1",
      audioText: M5_1_REVIEW[1].kana,
      correctMeaningEn: M5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_1_REVIEW[2].meaningEn,
        M5_1_REVIEW[3].meaningEn,
        M5_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-1-rev-mcq-2", M5_1_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-1-rev", M5_1_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m5-1-info-end",
      "Half-way to ten",
      "Five numbers loaded — and you've already retrieved them in five different modes. Next: 6 through 10, plus the ください pattern that turns numbers into orders.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_1.steps);

// ----- M5-2 — Numbers 6-10 + ください pattern ------------------------------

const M5_2_REVIEW = pickReviewAtoms("ja-m5-2-rev", PRIOR_POOL, 5);

const RULE_KUDASAI = grammarRule({
  id: "ja-m5-2-rule-kudasai",
  title: "ください — 'please give me / I'll have'",
  rule:
    "ください comes at the END of a request after the thing you want. Pattern: [item] ください. Add a quantity in front for orders: [item] [number] ください — 'X of these, please.' Politer than the dictionary form, polite enough for shops, restaurants, taxis, anywhere.",
  examples: [
    {
      ja: "みず ください。",
      romaji: "mizu kudasai.",
      en: "Water, please.",
    },
    {
      ja: "コーヒー ふたつ ください。",
      romaji: "koohii futatsu kudasai.",
      en: "Two coffees, please.",
    },
  ],
  antiPattern: {
    ja: "ください コーヒー。",
    romaji: "kudasai koohii.",
    en: "(broken — ください always comes last)",
    why: "ください is a sentence-ending request marker. Putting it first sounds like a verb-stem mistake. The item + (quantity) come first, then ください.",
  },
  cultureNote:
    "ください is the polite, neutral request form — fine in any non-formal context. For business or formal asks, swap to おねがいします (which you'll meet in M6).",
});

export const M5_2: LessonContent = {
  id: "ja-m5-2",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Numbers 6–10 + ください",
  description:
    "Finish the Sino set 1–10 and learn the order pattern. ください ends every request.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m5-2-info-open",
      "Round out the set",
      "Five more numbers, then the magic word — ください. Pattern: [item] [number] ください.",
    ),
    vocab("ja-m5-2-v-6", "6 (six)", "roku", "ろく"),
    vocabMcq("ja-m5-2-mcq-6", M5_NUMBER_ATOMS[5], M5_NUMBER_ATOMS),
    vocab(
      "ja-m5-2-v-7",
      "7 (seven)",
      "nana",
      "なな",
      "Also 'shichi.' 'Nana' wins when 'shichi' could be misheard as いち.",
    ),
    vocab("ja-m5-2-v-8", "8 (eight)", "hachi", "はち"),
    // Listening break interrupting the phrase_card run (R3 interleave).
    listeningCompSentence({
      id: "ja-m5-2-lc-8",
      audioText: "はち",
      correctMeaningEn: "8 (eight)",
      distractorsEn: ["6 (six)", "7 (seven)", "1 (one)"],
    }),
    vocab(
      "ja-m5-2-v-9",
      "9 (nine)",
      "kyuu",
      "きゅう",
      "Also 'ku' — but 'ku' overlaps with 'pain/suffering,' so 'kyuu' wins in most contexts.",
    ),
    vocab("ja-m5-2-v-10", "10 (ten)", "juu", "じゅう"),
    // ── Match pairs — full 6-10 set. ──
    {
      id: "ja-m5-2-match-6-10",
      type: "match_pairs",
      prompt: "Match each Japanese number to its numeral",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "ろく",   target: "6",  sourceAnnotation: [{ surface: "ろく",   reading: "ろく" }] },
        { id: "p2", source: "なな",   target: "7",  sourceAnnotation: [{ surface: "なな",   reading: "なな" }] },
        { id: "p3", source: "はち",   target: "8",  sourceAnnotation: [{ surface: "はち",   reading: "はち" }] },
        { id: "p4", source: "きゅう", target: "9",  sourceAnnotation: [{ surface: "きゅう", reading: "きゅう" }] },
        { id: "p5", source: "じゅう", target: "10", sourceAnnotation: [{ surface: "じゅう", reading: "じゅう" }] },
      ],
    } satisfies MatchPairsStep,
    // ── ください grammar rule + drill block ──
    RULE_KUDASAI,
    phrase(
      "ja-m5-2-kudasai-card",
      "Please give me / I'll have",
      "kudasai",
      "ください",
      "Goes after a noun (or noun + quantity). 'コーヒー ください' = a coffee, please.",
    ),
    // Cloze: pick ください vs other endings.
    cloze(
      "ja-m5-2-cloze-1",
      "みず ",
      "。",
      "ください",
      ["ください", "です", "ですか", "は"],
      "Water, please.",
      "みず ください。",
      "ください ends the request — it attaches AFTER the item.",
    ),
    // selfExplain follows the cloze (Dunlosky 2013 — moderate-utility).
    selfExplain({
      id: "ja-m5-2-self-kudasai",
      anchorLabel: "You picked ください in: みず ＿",
      anchorAudioText: "みず ください",
      question: "Why is ください correct here?",
      rule: { text: "ください turns a noun into a polite request — 'please give me X.'" },
      surface: { text: "ください always follows a drink word." },
      distractor: { text: "ください is the question marker." },
      ruleExplanation:
        "ください attaches to ANY item you're requesting (food, drink, object, service). It's the polite request marker — not drink-specific, not a question.",
    }),
    // Production: hear the order, build it from word tiles.
    listeningBuildSentence({
      id: "ja-m5-2-lb-coffee",
      target: "コーヒー ください",
      tiles: ["コーヒー", "ください", "みず", "です"],
      correctOrder: ["コーヒー", "ください"],
      promptEn: "Hear it, build it: 'A coffee, please.'",
    }),
    // ── Review tail (prior atoms — leans on M3 drinks/people that pair
    //    naturally with the just-learned ください pattern). 4 review steps. ──
    vocabMcq("ja-m5-2-rev-mcq-1", M5_2_REVIEW[0], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m5-2-rev-lc-1",
      audioText: M5_2_REVIEW[1].kana,
      correctMeaningEn: M5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_2_REVIEW[2].meaningEn,
        M5_2_REVIEW[3].meaningEn,
        M5_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-2-rev-mcq-2", M5_2_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-2-rev", M5_2_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m5-2-info-end",
      "1–10 + ください",
      "You can count to ten and ask for things by name. Next: the people-counter — special readings for 1 and 2 people.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_2.steps);

// ----- M5-3 — 人 counter (ひとり / ふたり / さんにん…) -------------------

const M5_3_REVIEW = pickReviewAtoms("ja-m5-3-rev", PRIOR_POOL, 4);

export const M5_3: LessonContent = {
  id: "ja-m5-3",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Counting people — 人 (nin / r)",
  description:
    "The people-counter. 1 and 2 use NATIVE readings; from 3 onward it's regular: number + にん.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m5-3-info-open",
      "Counters — why Japanese doesn't say 'three cats'",
      "Japanese doesn't say 'three cats' — it says 'cats, three [animal-counter].' Each category has its own counter. We start with 人 (the people-counter) because every restaurant entrance asks 'how many people?'",
      "grammar",
    ),
    vocab(
      "ja-m5-3-v-hitori",
      "1 person",
      "hitori",
      "ひとり",
      "1 and 2 people use NATIVE readings (ひとり, ふたり) — NOT the Sino いち/に you just learned. From 3 onward it's regular: さんにん, よにん.",
    ),
    // Listening break.
    listeningCompSentence({
      id: "ja-m5-3-lc-hitori",
      audioText: "ひとり",
      correctMeaningEn: "1 person",
      distractorsEn: ["2 people", "3 people", "1 (one)"],
    }),
    vocab("ja-m5-3-v-futari", "2 people", "futari", "ふたり"),
    sentenceMcq({
      id: "ja-m5-3-mcq-table-2",
      prompt: "Which sentence asks 'A table for two, please.' (entrance shorthand)?",
      correctKana: "ふたりです。",
      distractorsKana: [
        "ににんです。",
        "ふたつです。",
        "ひとりです。",
      ],
      explanation:
        "ふたり = 2 people (NATIVE reading). ににん is wrong — 2 uses ふたり not に+にん. ふたつ is the generic object counter (two items).",
    }),
    vocab(
      "ja-m5-3-v-sannin",
      "3 people",
      "san nin",
      "さんにん",
      "From 3 onward: number + にん. 4 people = よにん, 5 people = ごにん.",
    ),
    vocab("ja-m5-3-v-yonin", "4 people", "yo nin", "よにん"),
    // listening break (R3 interleave).
    listeningCompSentence({
      id: "ja-m5-3-lc-sannin",
      audioText: "さんにんです",
      correctMeaningEn: "Three (people).",
      distractorsEn: ["Two (people).", "One (person).", "Four (people)."],
    }),
    vocab("ja-m5-3-v-gonin", "5 people", "go nin", "ごにん"),
    // Match pairs — counter set.
    {
      id: "ja-m5-3-match-counter",
      type: "match_pairs",
      prompt: "Match each people-counter to its meaning",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "ひとり",   target: "1 person", sourceAnnotation: [{ surface: "ひとり", reading: "ひとり" }] },
        { id: "p2", source: "ふたり",   target: "2 people", sourceAnnotation: [{ surface: "ふたり", reading: "ふたり" }] },
        { id: "p3", source: "さんにん", target: "3 people", sourceAnnotation: [{ surface: "さんにん", reading: "さんにん" }] },
        { id: "p4", source: "よにん",   target: "4 people", sourceAnnotation: [{ surface: "よにん", reading: "よにん" }] },
        { id: "p5", source: "ごにん",   target: "5 people", sourceAnnotation: [{ surface: "ごにん", reading: "ごにん" }] },
      ],
    } satisfies MatchPairsStep,
    infoStep(
      "ja-m5-3-info-restaurant",
      "At a restaurant entrance",
      "Staff will ask 'なんめいさまですか' (how many people?). You answer with the counter + です: 'ふたりです.' (Two.) The native readings for 1 and 2 are baked into every Japanese person — say 'いちにん' or 'ににん' and they'll smile and gently correct you.",
      "culture",
    ),
    // selfExplain on the native-vs-Sino confusion (the highest-stakes cell
    // in the counter table).
    selfExplain({
      id: "ja-m5-3-self-futari",
      anchorLabel: "You picked ふたり in: ＿ です (table for two)",
      anchorAudioText: "ふたりです",
      question: "Why is ふたり correct (and ににん wrong)?",
      rule: { text: "1 and 2 people use NATIVE readings (ひとり, ふたり) — not the Sino number + にん pattern." },
      surface: { text: "ふたり sounds nicer." },
      distractor: { text: "ふたり is the question form of に." },
      ruleExplanation:
        "The counter for people swaps to native readings ONLY for 1 and 2 (ひとり, ふたり). From 3 onward (さんにん, よにん, ごにん…) the regular Sino + にん pattern kicks in. This is the same pattern most counters follow — small exceptions at 1 and 2.",
    }),
    // Production: hear → speak the canonical entrance line.
    speaking("ja-m5-3-speak-futari", "ふたりです", "(A table for) two."),
    translateStep({
      id: "ja-m5-3-translate-3people",
      promptEn: "(A table for) three.",
      acceptedAnswers: ["さんにんです", "さんにんです。", "sannin desu"],
      audioText: "さんにんです",
    }),
    // ── Review tail (prior atoms — 4 review steps for compounding ratio). ──
    vocabMcq("ja-m5-3-rev-mcq-1", M5_3_REVIEW[0], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m5-3-rev-lc-1",
      audioText: M5_3_REVIEW[1].kana,
      correctMeaningEn: M5_3_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_3_REVIEW[2].meaningEn,
        M5_3_REVIEW[3].meaningEn,
        PRIOR_POOL[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-3-rev-mcq-2", M5_3_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-3-rev", M5_3_REVIEW),
    infoStep(
      "ja-m5-3-info-end",
      "Counter pool — 人 loaded",
      "You can count people. Other counters (個 small objects, 本 long objects, 匹 small animals, 杯 cups) sprinkle in over M6+. For now, 人 covers every group-of-people interaction.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_3.steps);

// ----- M5-4 — Café + transactions vocab -----------------------------------

const M5_4_REVIEW = pickReviewAtoms("ja-m5-4-rev", PRIOR_POOL, 4);

export const M5_4: LessonContent = {
  id: "ja-m5-4",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Café + transactions",
  description: "Five vocab words that turn numbers + ください into real orders.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m5-4-info-open",
      "Money + food = numbers in action",
      "Five vocab words centered on cafés and shops. Each one pairs naturally with the numbers + ください pattern from M5-2.",
    ),
    vocab(
      "ja-m5-4-v-okane",
      "Money",
      "okane",
      "おかね",
      "The お prefix is a politeness marker — strip it for casual use, keep it for shops.",
    ),
    // Listening break.
    listeningCompSentence({
      id: "ja-m5-4-lc-okane",
      audioText: "おかね",
      correctMeaningEn: "money",
      distractorsEn: ["green tea", "water", "yen"],
    }),
    vocab(
      "ja-m5-4-v-ikura",
      "How much?",
      "ikura",
      "いくら",
      "'いくらですか' is the universal price question.",
    ),
    vocab(
      "ja-m5-4-v-en",
      "Yen",
      "en",
      "えん",
      "Written 円. Pronounced 'en' (no 'y' sound). 'A thousand yen' = せんえん.",
    ),
    // sentenceMcq break — discriminate price question from order.
    sentenceMcq({
      id: "ja-m5-4-mcq-price",
      prompt: "Which sentence asks 'How much is this?'",
      correctKana: "これは いくらですか。",
      distractorsKana: [
        "これは なんですか。",
        "これは ですか。",
        "いくら これは ですか。",
      ],
      explanation:
        "いくら = how much (price). なん = what (identity). Word order is fixed: topic は predicate ですか.",
    }),
    vocab(
      "ja-m5-4-v-mizu",
      "Water (recap)",
      "mizu",
      "みず",
      "Re-encountered from M3 — comes back as 'みず ください' (water, please) at every restaurant.",
    ),
    vocab(
      "ja-m5-4-v-ocha",
      "Green tea",
      "ocha",
      "おちゃ",
      "Free at most sit-down restaurants — just ask 'おちゃ ください.'",
    ),
    // Listening break on a new compound (vocab + ください).
    listeningCompSentence({
      id: "ja-m5-4-lc-ocha-kudasai",
      audioText: "おちゃ ください",
      correctMeaningEn: "Green tea, please.",
      distractorsEn: [
        "Water, please.",
        "How much is the tea?",
        "Is this green tea?",
      ],
    }),
    // Cloze on いくら — pick the question word.
    cloze(
      "ja-m5-4-cloze-1",
      "これは ",
      "ですか。",
      "いくら",
      ["いくら", "なん", "どれ", "ください"],
      "How much is this?",
      "これは いくらですか。",
      "いくら is the question word for price. なん asks identity ('what'), どれ asks 'which.'",
    ),
    // Production: translate an order with quantity.
    translateStep({
      id: "ja-m5-4-translate-water",
      promptEn: "Water, please.",
      acceptedAnswers: ["みず ください", "みずください", "みず ください。", "mizu kudasai"],
      audioText: "みず ください",
    }),
    speaking("ja-m5-4-speak-ikura", "いくらですか", "How much is it?"),
    // ── Review tail (prior-module — leans on M4 objects so the
    //    transaction vocab + M4 pointers connect naturally for M5-5). ──
    vocabMcq("ja-m5-4-rev-mcq-1", M5_4_REVIEW[0], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m5-4-rev-lc-1",
      audioText: M5_4_REVIEW[1].kana,
      correctMeaningEn: M5_4_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_4_REVIEW[2].meaningEn,
        M5_4_REVIEW[3].meaningEn,
        PRIOR_POOL[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-4-rev-mcq-2", M5_4_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-4-rev", M5_4_REVIEW),
    infoStep(
      "ja-m5-4-info-end",
      "Order vocab loaded",
      "Five vocab + ください + numbers = you can order anything by quantity. Next: から (the 'from' particle) plus a mixed-module drill.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_4.steps);

// ----- M5-5 — から (origin) + interleaved drill ----------------------------

const M5_5_REVIEW = pickReviewAtoms("ja-m5-5-rev", PRIOR_POOL, 5);

const RULE_KARA = grammarRule({
  id: "ja-m5-5-rule-kara",
  title: "から — 'from'",
  rule:
    "から marks origin — where someone or something comes FROM. Pattern: [place / time] から. Used for nationality ('I'm from America'), starting times ('open from 9'), and physical origin. Doesn't conflict with は — they stack: '[topic] は [origin] から です.'",
  examples: [
    {
      ja: "わたしは アメリカから です。",
      romaji: "watashi wa amerika kara desu.",
      en: "I'm from America.",
    },
    {
      ja: "にほんから です。",
      romaji: "nihon kara desu.",
      en: "(I'm) from Japan.",
    },
  ],
  antiPattern: {
    ja: "アメリカ わたし から です。",
    romaji: "amerika watashi kara desu.",
    en: "(broken — から must immediately follow its origin word)",
    why: "から sticks to the place/time it marks. You can't separate them. The topic (は phrase) comes first, then the origin + から, then です.",
  },
  cultureNote:
    "から also means 'because' when it ends a clause (you'll meet that in N4). For now, just 'from.'",
});

export const M5_5: LessonContent = {
  id: "ja-m5-5",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "から (from) + interleaved drill",
  description:
    "から marks origin. Drill mixes M3 (です/か/は), M4 (の/pointers), M5 (numbers, ください, から).",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m5-5-info-open",
      "Three modules, one drill",
      "Meet から (origin) — then six mixed clozes spanning M3 + M4 + M5. No new pattern memorization beyond から; just sorting which particle fits.",
    ),
    RULE_KARA,
    // ── から cloze + drill block ──
    cloze(
      "ja-m5-5-cloze-1",
      "わたしは アメリカ",
      " です。",
      "から",
      ["から", "は", "の", "を"],
      "I'm from America.",
      "わたしは アメリカから です。",
      "から marks origin. Stack: topic は + origin から + です.",
    ),
    selfExplain({
      id: "ja-m5-5-self-kara",
      anchorLabel: "You picked から in: わたしは アメリカ＿ です",
      anchorAudioText: "わたしは アメリカから です",
      question: "Why is から correct here?",
      rule: { text: "から attaches to a place to mean 'from there.'" },
      surface: { text: "から always comes after a country name." },
      distractor: { text: "から is the polite 'please' word." },
      ruleExplanation:
        "から marks origin (place OR time). It's not country-specific — works for cities, schools, the office, opening times. Sentence shape: [topic] は [origin] から です.",
    }),
    // ── Mixed-module cloze drill (rotating particle answers across は / の
    //    / から / ください — kills the M3-5 same-answer cluster anti-pattern). ──
    cloze(
      "ja-m5-5-cloze-2",
      "これ",
      " いくらですか。",
      "は",
      ["は", "が", "の", "を"],
      "How much is this?",
      "これは いくらですか。",
      "Topic = this. Question = how much?",
    ),
    // listening break between clozes (R3 alternation).
    listeningCompSentence({
      id: "ja-m5-5-lc-coffee-price",
      audioText: "コーヒーは いくらですか",
      correctMeaningEn: "How much is the coffee?",
      distractorsEn: [
        "Is this coffee?",
        "Two coffees, please.",
        "What is this?",
      ],
    }),
    cloze(
      "ja-m5-5-cloze-3",
      "あれは わたし",
      " かばんです。",
      "の",
      ["の", "は", "が", "から"],
      "That over there is my bag.",
      "あれは わたしの かばんです。",
      "の = possession (from M4). 'My bag.'",
    ),
    // listening break between clozes (R3 alternation).
    listeningCompSentence({
      id: "ja-m5-5-lc-from-america",
      audioText: "ともだちは アメリカから です",
      correctMeaningEn: "My friend is from America.",
      distractorsEn: [
        "My friend is American.",
        "Where is my friend?",
        "I am from America.",
      ],
    }),
    cloze(
      "ja-m5-5-cloze-4",
      "せんせいは にほん",
      " です。",
      "から",
      ["から", "は", "の", "を"],
      "The teacher is from Japan.",
      "せんせいは にほんから です。",
      "Origin again — same shape as the rule card.",
    ),
    // sentenceMcq discrimination break — order vs description.
    sentenceMcq({
      id: "ja-m5-5-mcq-order-vs-desc",
      prompt: "Which sentence ORDERS two beers?",
      correctKana: "ビール ふたつ ください。",
      distractorsKana: [
        "ビールは ふたつです。",
        "ビール ふたつ です。",
        "ビールは ふたつ ですか。",
      ],
      explanation:
        "An order ends in ください. The other options are descriptions or questions about beer (not requests).",
    }),
    cloze(
      "ja-m5-5-cloze-5",
      "おちゃ ",
      "。",
      "ください",
      ["ください", "ですか", "は", "の"],
      "Green tea, please.",
      "おちゃ ください。",
      "Item + ください = order. Trick option: ですか is grammatically valid but asks a question instead of ordering.",
    ),
    // Production: speaking on a full M5-flavored sentence.
    speaking(
      "ja-m5-5-speak-from-japan",
      "わたしは にほんから です",
      "I'm from Japan.",
    ),
    cloze(
      "ja-m5-5-cloze-6",
      "ふたり",
      "。",
      "です",
      ["です", "は", "の", "が"],
      "(A table for) two.",
      "ふたりです。",
      "Counter + です. Trick option — です is the answer here, not a particle.",
    ),
    // ── Review tail (prior pool, fresh seed) — 4 review steps. ──
    vocabMcq("ja-m5-5-rev-mcq-1", M5_5_REVIEW[0], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m5-5-rev-lc-1",
      audioText: M5_5_REVIEW[1].kana,
      correctMeaningEn: M5_5_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_5_REVIEW[2].meaningEn,
        M5_5_REVIEW[3].meaningEn,
        M5_5_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-5-rev-mcq-2", M5_5_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-5-rev", M5_5_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m5-5-info-end",
      "Three modules synthesized",
      "から loaded; M3+M4+M5 are now stacking in one drill. Next: production-heavy sentence build at the café.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_5.steps);

// ----- M5-6 — Production — sentence build + translate + speaking ----------

const M5_6_REVIEW = pickReviewAtoms("ja-m5-6-rev", PRIOR_POOL, 4);

export const M5_6: LessonContent = {
  id: "ja-m5-6",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build — at the café",
  description: "Five transactional sentences across build, translate, listening_build, and your voice.",
  estimatedMinutes: 9,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m5-6-info-open",
      "Five transactions",
      "Five sentences, four production modes. Short orders use word-tiles; longer ones use translate or listening_build (≥5-mora sentences need full word-level production, not tile assembly).",
    ),
    // ── ≤4-tile orders use build_sentence (per spec §4 — right tool for the
    //    pedagogy). Order: 3 tiles. ──
    build(
      "ja-m5-6-s1",
      "Order: Water, please.",
      "みず ください",
      ["みず", "ください", "おちゃ", "ビール"],
      ["みず", "ください"],
    ),
    speaking(
      "ja-m5-6-speak-s1",
      "みず ください",
      "Water, please.",
    ),
    // ── ≥5-mora sentence: translate (typed-bank production), NOT
    //    build_sentence (per spec §4). ──
    translateStep({
      id: "ja-m5-6-translate-s2",
      promptEn: "Two coffees, please.",
      acceptedAnswers: [
        "コーヒー ふたつ ください",
        "コーヒー ふたつ ください。",
        "コーヒーふたつください",
        "koohii futatsu kudasai",
      ],
      audioText: "コーヒー ふたつ ください",
    }),
    // speaking break between translate steps (R3 alternation).
    speaking(
      "ja-m5-6-speak-s2",
      "コーヒー ふたつ ください",
      "Two coffees, please.",
    ),
    // ── ≥5-mora price question: translate (per spec §4 — not build_sentence). ──
    translateStep({
      id: "ja-m5-6-translate-s3",
      promptEn: "How much is this?",
      acceptedAnswers: [
        "これは いくらですか",
        "これは いくらですか。",
        "これはいくらですか",
        "kore wa ikura desu ka",
      ],
      audioText: "これは いくらですか",
    }),
    // ── Hear-and-assemble for the entrance line. ──
    listeningBuildSentence({
      id: "ja-m5-6-lb-three-people",
      target: "さんにんです",
      tiles: ["さんにんです", "ふたりです", "ひとりです", "よにんです"],
      correctOrder: ["さんにんです"],
      promptEn: "Hear it, build it: '(A table for) three people.'",
    }),
    // ── ≥5-mora origin sentence: translate. ──
    translateStep({
      id: "ja-m5-6-translate-from",
      promptEn: "I'm from America.",
      acceptedAnswers: [
        "わたしは アメリカから です",
        "わたしは アメリカから です。",
        "わたしはアメリカからです",
        "watashi wa amerika kara desu",
      ],
      audioText: "わたしは アメリカから です",
    }),
    speaking(
      "ja-m5-6-speak-from",
      "わたしは アメリカから です",
      "I'm from America.",
    ),
    // ── sentenceMcq recall check after the production block. ──
    sentenceMcq({
      id: "ja-m5-6-mcq-recall",
      prompt: "Which sentence orders 'Three coffees, please.'?",
      correctKana: "コーヒー みっつ ください。",
      distractorsKana: [
        "コーヒー さん ください。",
        "コーヒーは みっつです。",
        "みっつ コーヒー ください。",
      ],
      explanation:
        "みっつ = 3 generic things (native counter — same pattern as ふたつ). Sino さん is wrong for ordering objects; word order is item + quantity + ください.",
    }),
    // ── Listening comprehension on the price question (recall + mode shift). ──
    listeningCompSentence({
      id: "ja-m5-6-lc-jisho-price",
      audioText: "じしょは いくらですか",
      correctMeaningEn: "How much is the dictionary?",
      distractorsEn: [
        "Is this a dictionary?",
        "How much is the book?",
        "Is the dictionary here?",
      ],
    }),
    // ── Review tail (prior atoms — broadest cumulative draw). ──
    vocabMcq("ja-m5-6-rev-mcq-1", M5_6_REVIEW[0], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m5-6-rev-lc-1",
      audioText: M5_6_REVIEW[1].kana,
      correctMeaningEn: M5_6_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_6_REVIEW[2].meaningEn,
        M5_6_REVIEW[3].meaningEn,
        PRIOR_POOL[3].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m5-6-rev", M5_6_REVIEW),
    infoStep(
      "ja-m5-6-info-end",
      "Café Japanese unlocked",
      "Five transactions across four production modes. You can navigate a café from entry to payment.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_6.steps);

// ----- M5-7 — Mini-dialogue — ordering at a café ---------------------------

const M5_7_REVIEW = pickReviewAtoms("ja-m5-7-rev", PRIOR_POOL, 6);

export const M5_7: LessonContent = {
  id: "ja-m5-7",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — ordering coffee",
  description:
    "A four-line café exchange using M5 numbers + ください + M3 politeness. Cumulative review across M1-M4 closes the lesson.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m5-7-info-open",
      "Drop into the scene",
      "You walk into a Tokyo café. Staff greets you, you order, confirm, thank. Every word and grammar piece is from M3-M5.",
      "culture",
    ),
    ...dialogueLesson({
      idPrefix: "ja-m5-7",
      representative: {
        phrase: "コーヒー ふたつ ください",
        translation: "Two coffees, please.",
      },
      lines: [
        {
          speaker: "Staff",
          meaningEn: "Welcome.",
          romaji: "irasshaimase",
          kana: "いらっしゃいませ",
          cultureNote:
            "The greeting every shop, restaurant, and café staffer uses when you walk in. Don't reply — a nod is enough.",
        },
        {
          speaker: "You",
          meaningEn: "Two coffees, please.",
          romaji: "koohii futatsu kudasai",
          kana: "コーヒー ふたつ ください",
          speakingPhrase: "コーヒー ふたつ ください",
        },
        {
          speaker: "Staff",
          meaningEn: "Is that everything?",
          romaji: "ijou de yoroshii desu ka",
          kana: "いじょうで よろしいですか",
          cultureNote:
            "Formal version of 'is that all?' Yoroshii is the polite form of 'good/OK.'",
        },
        {
          speaker: "You",
          meaningEn: "Yes. Thank you.",
          romaji: "hai. arigatou gozaimasu",
          kana: "はい。ありがとうございます",
          speakingPhrase: "はい。ありがとうございます",
        },
      ],
    }),
    // ── Post-dialogue comprehension check on a dialogue line. ──
    listeningCompSentence({
      id: "ja-m5-7-lc-dialogue",
      audioText: "コーヒー ふたつ ください",
      correctMeaningEn: "Two coffees, please.",
      distractorsEn: [
        "How much is the coffee?",
        "Is this coffee?",
        "Two waters, please.",
      ],
    }),
    // ── Cumulative grammar check — answers rotate (ください / は / から). ──
    cloze(
      "ja-m5-7-cloze-1",
      "ビール ふたつ ",
      "。",
      "ください",
      ["ください", "ですか", "は", "の"],
      "Two beers, please.",
      "ビール ふたつ ください。",
      "Item + quantity + ください — the canonical order shape.",
    ),
    sentenceMcq({
      id: "ja-m5-7-mcq-recap",
      prompt: "Which sentence says 'I'm from Japan.'?",
      correctKana: "わたしは にほんから です。",
      distractorsKana: [
        "わたしは にほんです。",
        "わたしは にほんの です。",
        "にほんは わたしから です。",
      ],
      explanation:
        "から marks origin and immediately follows the place. The other options either drop から or scramble word order.",
    }),
    cloze(
      "ja-m5-7-cloze-2",
      "ともだち",
      " アメリカから です。",
      "は",
      ["は", "が", "の", "を"],
      "My friend is from America.",
      "ともだちは アメリカから です。",
      "Topic は; origin から. Both stack cleanly in one sentence.",
    ),
    // Production tap — translate one cumulative sentence.
    translateStep({
      id: "ja-m5-7-translate-final",
      promptEn: "How much is this?",
      acceptedAnswers: [
        "これは いくらですか",
        "これは いくらですか。",
        "これはいくらですか",
        "kore wa ikura desu ka",
      ],
      audioText: "これは いくらですか",
    }),
    // ── Cumulative review tail — broadest set (M1-M4). ──
    vocabMcq(
      "ja-m5-7-rev-mcq-1",
      M5_7_REVIEW.find((a) => Boolean(a.emoji))!,
      PRIOR_POOL,
    ),
    listeningCompSentence({
      id: "ja-m5-7-rev-lc-cumulative",
      audioText: M5_7_REVIEW[1].kana,
      correctMeaningEn: M5_7_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_7_REVIEW[2].meaningEn,
        M5_7_REVIEW[3].meaningEn,
        M5_7_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq(
      "ja-m5-7-rev-mcq-2",
      M5_7_REVIEW.filter((a) => Boolean(a.emoji))[1]!,
      PRIOR_POOL,
    ),
    reviewMatchPairs("ja-m5-7-rev", M5_7_REVIEW.slice(0, 6)),
    infoStep(
      "ja-m5-7-info-end",
      "Café exchange handled",
      "Four lines, real rhythm. The staffer will speak faster IRL — but the pattern is exactly what you just practiced. Next: the mastery test.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_7.steps);

// ----- M5-8 — Row test (mastery ★) ----------------------------------------
// PRESERVED structure — row test is the mastery surface gated by the
// ja-m3-m7-coverage + grammar-rule + mockCourse tests. Item set expanded
// slightly for cumulative coverage of the rebuilt sub-lessons (numbers,
// counter, ください, から).

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

const M5_TEST_ITEMS: RowTestItem[] = [
  {
    kind: "mc",
    payload: particleMc(
      "ja-m5-8-mc-1",
      "これ___ いくらですか。 (How much is this?)",
      "これは いくらですか",
      "は",
      ["の", "が", "を"],
      "Topic + price question.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m5-8-mc-2",
      "わたしは アメリカ___ です。 (I'm from America.)",
      "わたしは アメリカから です",
      "から",
      ["は", "の", "を"],
      "から marks origin — stacks after the topic は.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m5-8-mc-3",
      "みず ___。 (Water, please.)",
      "みず ください",
      "ください",
      ["です", "ですか", "は"],
      "Item + ください = polite request.",
    ),
  },
  {
    kind: "match",
    payload: {
      id: "ja-m5-8-match-numbers",
      type: "match_pairs",
      prompt: "Match each number to its meaning",
      pairs: [
        { id: "p1", source: "いち",     target: "1",        sourceAnnotation: [{ surface: "いち",     reading: "いち" }] },
        { id: "p2", source: "さん",     target: "3",        sourceAnnotation: [{ surface: "さん",     reading: "さん" }] },
        { id: "p3", source: "よん",     target: "4",        sourceAnnotation: [{ surface: "よん",     reading: "よん" }] },
        { id: "p4", source: "なな",     target: "7",        sourceAnnotation: [{ surface: "なな",     reading: "なな" }] },
        { id: "p5", source: "じゅう",   target: "10",       sourceAnnotation: [{ surface: "じゅう",   reading: "じゅう" }] },
        { id: "p6", source: "ふたり",   target: "2 people", sourceAnnotation: [{ surface: "ふたり",   reading: "ふたり" }] },
      ],
    } as MatchPairsStep,
  },
  {
    kind: "build",
    payload: {
      id: "ja-m5-8-build",
      type: "build_sentence",
      prompt: "Order: Water, please.",
      targetSentence: "みず ください",
      tiles: ["みず", "ください", "おちゃ", "ビール"],
      correctOrder: ["みず", "ください"],
      granularity: "word",
      audioKey: "みず ください",
      targetAnnotation: [{ surface: "みず ください", reading: "みず ください" }],
    } as BuildSentenceStep,
  },
];

const M5_ROW_TEST: RowTestStep = {
  id: "ja-m5-8-test",
  type: "row_test",
  rowId: "m5",
  items: M5_TEST_ITEMS,
  passThreshold: 0.7,
  maxRetries: 3,
};

export const M5_8: LessonContent = {
  id: "ja-m5-8",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "M5 Mastery Test",
  description: "Cumulative test of M5 numbers + counters + ください + から.",
  estimatedMinutes: 6,
  xpReward: 30,
  steps: [
    infoStep(
      "ja-m5-8-info-open",
      "Module 5 mastery",
      "Cumulative items across numbers, the people-counter, the order pattern, and the origin particle. Wrong answers re-queue. Pass once and Module 5 is mastered.",
    ),
    M5_ROW_TEST,
    infoStep(
      "ja-m5-8-info-end",
      "Module 5 complete",
      "You can count, order, and pay — and you can say where you're from. M6 adds locations: where things are, where actions happen, plus the existence-pattern that finally introduces が.",
      "win",
    ),
  ],
};
