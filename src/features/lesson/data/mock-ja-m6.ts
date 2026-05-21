/**
 * M6 — Where things are (Wave 4B re-density 2026-05-18).
 *
 * Spine (unchanged): に (destination) / で (setting) / が (existence).
 *
 * 2026-05-18 Wave 4B re-density (per docs/wave-4b-dispatch-briefs.md
 * Agent B-6) on top of the earlier 2026-05-18 rebuild:
 *   - Lifted every content sub-lesson to the 20-22 step band (was 14-18).
 *   - Moved EVERY `selfExplain` to N-1 placement (CLT expertise-reversal):
 *     it now fires AFTER 2-3 commits, not immediately.
 *   - Fixed M6-4 expertise-reversal contradiction: the rule card explicitly
 *     defers は/が contrast, so the M6-4 selfExplain no longer asks for it.
 *     It now probes the あります/います animacy split (the rule the learner
 *     just committed). The は/が discrimination selfExplain is moved to
 *     M6-5, by which point the learner has used が in 4+ existence sites.
 *   - Replaced the canonical dismiss-on-sight distractor `"は and が mean
 *     exactly the same thing"` with rule-citing-but-wrong alternatives
 *     (e.g., `"が introduces the answer to an implied wh-question"` — a
 *     real near-rule that's true in some contexts but wrong here).
 *   - Tightened M6-2 + M6-4 cloze rotation to assertAnswerRotation(2)
 *     (was 1 with a TODO).
 *   - Confirmed M6-6 hits assertAnswerRotation(3) — 6 cloze items rotate
 *     across が / に / で.
 *   - M6-8 dialogue closer rewritten with `dialogueListen()`: asking
 *     directions in Shibuya. 3 comprehension Q's (where is the station,
 *     which way, how long). Removes the rogue one-off atoms (FamilyMart,
 *     とおいです, ちかいです, いいえ) that were polluting the atom-coverage
 *     test as phrase_card.kana surface forms.
 *
 * Carry-forward standards (from the earlier rebuild — still hold):
 *   - ≥5 distinct step types per sub-lesson; no 2 adjacent same-type.
 *   - ≥0.25 review-to-new ratio per sub-lesson from M3_M7_REVIEW_POOL.
 *   - Hard direction (translate / speaking / listening_build) lands
 *     after step ~12.
 *   - Identity-anchored win cards ("You can now ask for a toilet in
 *     Shibuya" rather than "が unlocked").
 *
 * Cross-module compounding: M6 location atoms (こうえん, がっこう, うち,
 * えき, トイレ, コンビニ, ぎんこう, ホテル, へや) carry into M7 via
 * M3_M7_REVIEW_POOL (already populated in _jaGrammarHelpers.ts).
 *
 * Lesson list (9 lessons — IDs preserved; mockCourse + tests reference
 * ja-m6-1..ja-m6-9):
 *   M6-1  Places — vocab (8 location atoms) + retrieval interleave
 *   M6-2  に — destination + existence
 *   M6-3  で — action setting + means
 *   M6-4  が — there is / there are (animacy selfExplain — NOT は/が)
 *   M6-5  Interleaved に + で (+ the deferred は/が selfExplain)
 *   M6-6  Interleaved existence + locations (3-particle rotation)
 *   M6-7  Production — translate + listening_build + speaking
 *   M6-8  Mini-dialogue — asking directions (NEW dialogueListen)
 *   M6-9  Row test (mastery ★)
 */
import type {
  LessonContent,
  MatchPairsStep,
  MultipleChoiceStep,
  RowTestItem,
  RowTestStep,
  BuildSentenceStep,
} from "../types";
import {
  build,
  cloze,
  dialogueListen,
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
  vocab,
  vocabMcq,
  assertNoSameAnswerCluster,
  assertAnswerRotation,
  assertNoConsecutiveSame,
  WORD_IMAGE_MCQ_BLOCKLIST,
  slotFor,
} from "./_jaGrammarHelpers";

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// Per-sub-lesson review-atom draws. Seeded by lesson id so each gets a
// stable but distinct subset across re-runs. Pool is M1+M2+M3+M4+M5.
// (Not M6 — M6 is the module being authored; can't review itself.)
// ───────────────────────────────────────────────────────────────────────
const PRIOR_POOL = M3_M7_REVIEW_POOL.filter(
  (a) =>
    (a.fromModule === "m1" ||
      a.fromModule === "m2" ||
      a.fromModule === "m3" ||
      a.fromModule === "m4" ||
      a.fromModule === "m5") &&
    !WORD_IMAGE_MCQ_BLOCKLIST.has(a.kana),
);
// Subset draws for visual MCQ distractor pools (use M1 / M4 — both have
// many emoji-bearing concrete-noun atoms). M2 / M3 / M5 contribute through
// the main PRIOR_POOL draws for review-tail MCQ / match / listening.
const POOL_M1 = PRIOR_POOL.filter((a) => a.fromModule === "m1");
const POOL_M4 = PRIOR_POOL.filter((a) => a.fromModule === "m4");

// ----- M6-1 — Places vocab + retrieval interleave -----------------------

const M6_1_REVIEW = pickReviewAtoms("ja-m6-1-rev", PRIOR_POOL, 8);

export const M6_1: LessonContent = {
  id: "ja-m6-1",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Places",
  description:
    "Eight locations every Japanese map cares about. Vocab + immediate retrieval interleave.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m6-1-info-open",
      "Map vocab",
      "Eight locations. Every Japanese address starts with 'X minutes from Y えき' (train station) — names of places are the spine of getting around.",
    ),
    // ── Atom intros, interleaved with retrieval per spec §6 anti-pattern 2 ──
    vocab(
      "ja-m6-1-koen",
      "Park",
      "kouen",
      "こうえん",
      "Pronounced 'koh-en' (long o). Every neighborhood has at least one.",
    ),
    // visual MCQ on the new atom — encode + apply immediately
    vocabMcq(
      "ja-m6-1-mcq-koen",
      { kana: "こうえん", meaningEn: "park", emoji: "🌲", fromModule: "m6" },
      POOL_M1,
    ),
    vocab(
      "ja-m6-1-gakkou",
      "School",
      "gakkou",
      "がっこう",
      "Generic for any educational institution from elementary up to university.",
    ),
    // listening break (R3 interleave)
    listeningCompSentence({
      id: "ja-m6-1-lc-gakkou",
      audioText: "がっこう",
      correctMeaningEn: "school",
      distractorsEn: ["home", "park", "station"],
    }),
    vocab(
      "ja-m6-1-uchi",
      "Home / my place",
      "uchi",
      "うち",
      "Used both for 'my house' and 'my family/in-group.' Context decides.",
    ),
    // visual MCQ on うち (encode + apply) — breaks adjacency w/ next vocab
    vocabMcq(
      "ja-m6-1-mcq-uchi",
      { kana: "うち", meaningEn: "home", emoji: "🏡", fromModule: "m6" },
      POOL_M4,
    ),
    vocab(
      "ja-m6-1-eki",
      "Train station",
      "eki",
      "えき",
      "Every Japanese address starts with 'X minutes from Y えき.'",
    ),
    // prior-module review interrupting the phrase_card run — bumps ratio
    vocabMcq("ja-m6-1-rev-mcq-mid", M6_1_REVIEW[0], PRIOR_POOL),
    vocab(
      "ja-m6-1-toire",
      "Toilet",
      "toire",
      "トイレ",
      "Katakana loanword. 'トイレは どこですか' — the universal travel question.",
    ),
    // listening break between back-to-back vocab cards
    listeningCompSentence({
      id: "ja-m6-1-lc-toire",
      audioText: "トイレ",
      correctMeaningEn: "toilet",
      distractorsEn: ["train station", "park", "shop"],
    }),
    vocab(
      "ja-m6-1-konbini",
      "Convenience store",
      "konbini",
      "コンビニ",
      "7-Eleven, FamilyMart, Lawson — the holy trinity of late-night Japan.",
    ),
    // speaking break — production direction on a just-introduced atom
    speaking("ja-m6-1-speak-konbini", "コンビニ", "Convenience store"),
    vocab(
      "ja-m6-1-heya",
      "Room",
      "heya",
      "へや",
      "Any room in a house or hotel. 'へやに います' = I'm in my room.",
    ),
    // visual MCQ on へや (custom SVG)
    vocabMcq(
      "ja-m6-1-mcq-heya",
      { kana: "へや", meaningEn: "room", emoji: "🛋️", fromModule: "m6" },
      POOL_M4,
    ),
    vocab(
      "ja-m6-1-mise",
      "Shop",
      "mise",
      "みせ",
      "Generic 'store.' Often suffixed: ほんや → ほんやさん (bookstore + politeness).",
    ),
    // visual MCQ on the second-to-last atom (encode + apply) — re-exposes みせ
    vocabMcq(
      "ja-m6-1-mcq-mise",
      { kana: "みせ", meaningEn: "shop", emoji: "🏬", fromModule: "m6" },
      POOL_M4,
    ),
    // speaking break before review tail — production direction on a new atom
    speaking("ja-m6-1-speak-eki", "えき", "Train station"),
    // ── Review tail (prior-module atoms) ──
    listeningCompSentence({
      id: "ja-m6-1-rev-lc-1",
      audioText: M6_1_REVIEW[1].kana,
      correctMeaningEn: M6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_1_REVIEW[2].meaningEn,
        M6_1_REVIEW[3].meaningEn,
        M6_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m6-1-rev-mcq-2", M6_1_REVIEW[2], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-1-rev-lc-2",
      audioText: M6_1_REVIEW[5].kana,
      correctMeaningEn: M6_1_REVIEW[5].meaningEn,
      distractorsEn: [
        M6_1_REVIEW[6].meaningEn,
        M6_1_REVIEW[7].meaningEn,
        M6_1_REVIEW[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m6-1-rev-mcq-3", M6_1_REVIEW[5], PRIOR_POOL),
    // Free-recall production step (wave-4-acceptance standard 4) —
    // kana-MCQ of one of the new place atoms (migrated from translate
    // 2026-05-18 — typed romaji bypassed the kana-retrieval goal).
    sentenceMcq({
      id: "ja-m6-1-translate-eki",
      prompt: "train station",
      promptAudioText: "えき",
      correctKana: "えき",
      distractorsKana: ["がっこう", "うち", "こうえん"],
    }),
    reviewMatchPairs("ja-m6-1-rev", M6_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-1-info-end",
      "You can now name every place on a Japanese map",
      "Eight places, retrieval-checked. Next: three particles that put things AT, BY, and IN them.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_1.steps);
assertAnswerRotation(M6_1.steps, 2);
assertNoConsecutiveSame(M6_1.steps);

// ----- M6-2 — に (destination + existence) -------------------------------

const RULE_NI = grammarRule({
  id: "ja-m6-2-rule-ni",
  title: "に — destination point + existence",
  rule:
    "に marks a POINT — either a destination you're moving TOWARD (がっこうに いく = go TO school) or a point of existence (えきに います = I AM AT the station). Verbs of motion (いく/くる/かえる) and existence verbs (います/あります) both take に.",
  examples: [
    {
      ja: "がっこうに いきます。",
      romaji: "gakkou ni ikimasu.",
      en: "I go to school. (destination)",
    },
    {
      ja: "えきに います。",
      romaji: "eki ni imasu.",
      en: "I'm at the station. (existence)",
    },
  ],
  antiPattern: {
    ja: "がっこうで いきます。",
    romaji: "gakkou de ikimasu.",
    en: "(broken — 'I go school-as-setting')",
    why: "Going TO a place is movement toward a destination point — に, never で. で is for the place an action happens (next lesson).",
  },
  cultureNote:
    "に is the 'pinpoint' particle. Whenever the question is 'WHERE TO?' or 'WHERE EXACTLY?', に is your particle.",
});

const M6_2_REVIEW = pickReviewAtoms("ja-m6-2-rev", PRIOR_POOL, 6);

export const M6_2: LessonContent = {
  id: "ja-m6-2",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "に — destination + existence",
  description:
    "The pinpoint particle. Direction toward a place, or being AT a place.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m6-2-info-open",
      "The pinpoint particle",
      "に marks a single point — where you're going or where you are. It pairs with movement verbs (いく/くる/かえる) and existence verbs (います/あります).",
    ),
    RULE_NI,
    // ── First cloze cluster: に dominates, with rotation breaks ──
    cloze(
      "ja-m6-2-cloze-1",
      "がっこう",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to school.",
      "がっこうに いきます。",
      "Movement verb (いく) + destination point. に.",
    ),
    // sentenceMcq break — pattern discrimination interrupts cloze run
    sentenceMcq({
      id: "ja-m6-2-mcq-discriminate",
      prompt: "Which sentence means 'I'm at the park.'?",
      correctKana: "こうえんに います。",
      distractorsKana: [
        "こうえんで います。",
        "こうえんに いきます。",
        "こうえんは います。",
      ],
      explanation:
        "Existence (います) takes に, never で. With いきます the meaning shifts to 'I go to the park' (also valid grammatically but different meaning).",
    }),
    cloze(
      "ja-m6-2-cloze-2",
      "えき",
      " います。",
      "に",
      ["に", "で", "を", "は"],
      "I'm at the station.",
      "えきに います。",
      "Existence verb (いる/います) + location point. に.",
    ),
    // listening break — comprehension before the next cloze
    listeningCompSentence({
      id: "ja-m6-2-lc-koen",
      audioText: "こうえんに います",
      correctMeaningEn: "I'm at the park.",
      distractorsEn: [
        "I go to the park.",
        "There's a park.",
        "The park is here.",
      ],
    }),
    // contrast cloze — break the に run with a を foil that the learner
    // can rule out from M3 knowledge, so the answer pool isn't 100% に
    cloze(
      "ja-m6-2-cloze-3",
      "うち",
      " かえります。",
      "に",
      ["に", "で", "を", "が"],
      "I'm going home.",
      "うちに かえります。",
      "Movement verb (かえる/return) + destination. に.",
    ),
    // vocabMcq break — prior-module atom (review-ratio bump)
    vocabMcq("ja-m6-2-rev-mcq-mid", M6_2_REVIEW[0], PRIOR_POOL),
    // pivot cloze — answer is で (means of motion), single rotation site
    // so the answer set stops being 100% に. Sets up the M6-3 lesson.
    cloze(
      "ja-m6-2-cloze-de-foil",
      "バス",
      " いきます。",
      "で",
      ["に", "で", "を", "は"],
      "I go by bus.",
      "バスで いきます。",
      "Foreshadow — bus is the MEANS (で), not a destination. Most clozes in this lesson are に, but particle-by-role still applies.",
    ),
    // listening break before final に cloze
    listeningCompSentence({
      id: "ja-m6-2-lc-konbini",
      audioText: "コンビニに いきます",
      correctMeaningEn: "I go to the convenience store.",
      distractorsEn: [
        "I'm at the convenience store.",
        "There's a convenience store.",
        "I work at the convenience store.",
      ],
    }),
    cloze(
      "ja-m6-2-cloze-4",
      "コンビニ",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to the convenience store.",
      "コンビニに いきます。",
      "Destination + motion verb. に.",
    ),
    // sentenceMcq break — extra pattern discrimination
    sentenceMcq({
      id: "ja-m6-2-mcq-uchi",
      prompt: "Which sentence means 'I'm at home.'?",
      correctKana: "うちに います。",
      distractorsKana: [
        "うちで います。",
        "うちは います。",
        "うちに いきます。",
      ],
      explanation:
        "Pure existence (います) → location point → に. うちに いきます would mean 'I'm going home' (movement).",
    }),
    // selfExplain — NOW at the N-1 placement, after the learner has committed
    // 4 cloze answers using に. Asks why the just-used rule held.
    selfExplain({
      id: "ja-m6-2-self-ni",
      anchorLabel: "You picked に in: えき＿ います (I'm at the station)",
      anchorAudioText: "えきに います",
      question: "Why is に correct in 'えきに います'?",
      rule: {
        text: "に marks WHERE something exists — the existence verb います always takes に, not で.",
      },
      surface: {
        text: "に always comes right after a place noun in any sentence.",
      },
      distractor: {
        text: "に marks the time at which something happens, like 'at 3pm.'",
      },
      ruleExplanation:
        "Existence (いる/ある → います/あります) takes に — the location is treated as a single point where the thing IS. に DOES mark times too (じゅうじに = at 10), but here the noun is a location, so the existence rule is what's firing.",
    }),
    // production step — tile-bank build (≥5-mora carrier, hard direction).
    // Migrated from translateStep 2026-05-18 (typed romaji bypassed kana
    // retrieval). Distractor えきで forces the に-vs-で existence call.
    build(
      "ja-m6-2-translate-eki",
      "I'm at the station.",
      "えきに います",
      ["えき", "に", "います", "で"],
      ["えき", "に", "います"],
    ),
    // speaking — production direction on the just-translated sentence
    speaking(
      "ja-m6-2-speak-eki",
      "えきに います",
      "I'm at the station.",
    ),
    // listening_build — assemble a に sentence from word tiles (hard direction)
    listeningBuildSentence({
      id: "ja-m6-2-lb-koen",
      target: "こうえんに いきます",
      tiles: ["こうえん", "に", "いきます", "うち", "で", "えき", "います"],
      correctOrder: ["こうえん", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to the park.'",
    }),
    // ── Review tail — prior-module compounding ──
    vocabMcq("ja-m6-2-rev-mcq-1", M6_2_REVIEW[1], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-2-rev-lc",
      audioText: M6_2_REVIEW[2].kana,
      correctMeaningEn: M6_2_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_2_REVIEW[3].meaningEn,
        M6_2_REVIEW[4].meaningEn,
        M6_2_REVIEW[5].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-2-rev", M6_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-2-info-end",
      "You can now say where you are and where you're going",
      "Location point + に + (motion or existence verb). Next: で, the setting particle — the place an ACTION happens.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_2.steps);
assertAnswerRotation(M6_2.steps, 2);
assertNoConsecutiveSame(M6_2.steps);

// ----- M6-3 — で (action setting + means) --------------------------------

const RULE_DE = grammarRule({
  id: "ja-m6-3-rule-de",
  title: "で — action setting + means",
  rule:
    "で marks the SETTING of an action — the place an action happens (がっこうで べんきょう = study AT school), or the MEANS you use to do it (でんしゃで いく = go BY train). The English 'at' collapses both with に; Japanese keeps them separate.",
  examples: [
    {
      ja: "がっこうで べんきょうします。",
      romaji: "gakkou de benkyou shimasu.",
      en: "I study at school. (where the action happens)",
    },
    {
      ja: "でんしゃで いきます。",
      romaji: "densha de ikimasu.",
      en: "I go by train. (means of motion)",
    },
  ],
  antiPattern: {
    ja: "えきで います。",
    romaji: "eki de imasu.",
    en: "(broken — 'I exist at-station-as-setting')",
    why: "Existence (いる/ある) takes に, not で. で is for ACTIONS happening at a setting. Just being somewhere isn't an action.",
  },
  cultureNote:
    "Filter: am I pointing at the destination/location (に), or describing the place an action happens / the means I'm using (で)? Most learners over-use に because it shows up first in beginner lessons.",
});

const M6_3_REVIEW = pickReviewAtoms("ja-m6-3-rev", PRIOR_POOL, 6);

export const M6_3: LessonContent = {
  id: "ja-m6-3",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "で — action setting + means",
  description:
    "The 'where it happens' particle. Also the 'by what means.'",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m6-3-info-open",
      "Setting + means",
      "に was the point. で is the stage. Whenever an ACTION happens somewhere, the place takes で. The means (transport, tools) also takes で.",
    ),
    RULE_DE,
    // ── Drill block: で dominates but rotated with に / は to break runs ──
    cloze(
      "ja-m6-3-cloze-1",
      "うち",
      " べんきょうします。",
      "で",
      ["に", "で", "を", "の"],
      "I study at home.",
      "うちで べんきょうします。",
      "The action (studying) HAPPENS at home — で marks the setting.",
    ),
    // listening break breaks the cloze run
    listeningCompSentence({
      id: "ja-m6-3-lc-densha",
      audioText: "でんしゃで いきます",
      correctMeaningEn: "I go by train.",
      distractorsEn: [
        "I'm on the train.",
        "There's a train.",
        "The train station is here.",
      ],
    }),
    cloze(
      "ja-m6-3-cloze-2",
      "コンビニ",
      " はたらきます。",
      "で",
      ["に", "で", "を", "の"],
      "I work at a convenience store.",
      "コンビニで はたらきます。",
      "Working is an action happening at a setting — で.",
    ),
    // sentenceMcq break — pattern discrimination on で vs に
    sentenceMcq({
      id: "ja-m6-3-mcq-de-vs-ni",
      prompt: "Which sentence means 'I study at the library.'?",
      correctKana: "としょかんで べんきょうします。",
      distractorsKana: [
        "としょかんに べんきょうします。",
        "としょかんで います。",
        "としょかんに います。",
      ],
      explanation:
        "Studying is an ACTION → で. The other options either swap で↔に (broken) or replace the verb with 'exist' (means 'I'm at the library,' a different sentence).",
    }),
    // contrast cloze — に again (rotation, not a で run)
    cloze(
      "ja-m6-3-cloze-3-contrast",
      "がっこう",
      " います。",
      "に",
      ["に", "で", "を", "は"],
      "I'm at school. (NOT 'I study at school' — pure existence)",
      "がっこうに います。",
      "Pure existence — に, not で. Even though it's a school (a place where actions happen), 'just being there' takes に.",
    ),
    // listening break between back-to-back clozes
    listeningCompSentence({
      id: "ja-m6-3-lc-jitensha",
      audioText: "じてんしゃで いきます",
      correctMeaningEn: "I go by bicycle.",
      distractorsEn: [
        "I'm on a bicycle.",
        "There's a bicycle.",
        "I bought a bicycle.",
      ],
    }),
    cloze(
      "ja-m6-3-cloze-4",
      "じてんしゃ",
      " いきます。",
      "で",
      ["に", "で", "を", "の"],
      "I go by bicycle.",
      "じてんしゃで いきます。",
      "で also marks the MEANS — how you do something.",
    ),
    // vocabMcq break — prior-module atom (review-ratio bump)
    vocabMcq("ja-m6-3-rev-mcq-mid", M6_3_REVIEW[0], PRIOR_POOL),
    // listening break — sets up the next で cloze contextually
    listeningCompSentence({
      id: "ja-m6-3-lc-konbini",
      audioText: "コンビニで はたらきます",
      correctMeaningEn: "I work at a convenience store.",
      distractorsEn: [
        "I go to the convenience store.",
        "I'm at the convenience store.",
        "There's a convenience store.",
      ],
    }),
    cloze(
      "ja-m6-3-cloze-5",
      "へや",
      " ねます。",
      "で",
      ["に", "で", "を", "の"],
      "I sleep in (my) room.",
      "へやで ねます。",
      "Sleeping is an action → setting → で.",
    ),
    // sentenceMcq break — means-of-motion discrimination
    sentenceMcq({
      id: "ja-m6-3-mcq-means",
      prompt: "Which sentence means 'I go to school by bus.'?",
      correctKana: "バスで がっこうに いきます。",
      distractorsKana: [
        "バスに がっこうで いきます。",
        "バスで がっこうで いきます。",
        "バスに がっこうに いきます。",
      ],
      explanation:
        "Means (bus) → で. Destination (school) → に. Roles aren't interchangeable.",
    }),
    // selfExplain — NOW at N-1 placement, after 5+ で commits
    selfExplain({
      id: "ja-m6-3-self-de",
      anchorLabel:
        "You picked で in: コンビニ＿ はたらきます (I work at a convenience store)",
      anchorAudioText: "コンビニで はたらきます",
      question: "Why is で correct here, not に?",
      rule: {
        text: "Working is an ACTION; で marks the place an action happens. に is for existence or destination, not action settings.",
      },
      surface: {
        text: "で always comes after work/study words, regardless of meaning.",
      },
      distractor: {
        text: "で marks the agent doing the action — 'by/by means of someone.'",
      },
      ruleExplanation:
        "に and で can both translate to English 'at,' but Japanese splits them by role: に for existence / destination (just being or going), で for the place an ACTION happens. (で does mean 'by' for instruments, but the AGENT is unmarked or marked with は/が — not で.)",
    }),
    // production — tile-bank build (≥5-mora carrier). Migrated from
    // translateStep 2026-05-18. Distractor バスに forces the means-vs-
    // destination call (で for means of motion, not に).
    build(
      "ja-m6-3-translate-bus",
      "I go by bus.",
      "バスで いきます",
      ["バス", "で", "いきます", "に"],
      ["バス", "で", "いきます"],
    ),
    // speaking — production direction on a cumulative で sentence
    speaking(
      "ja-m6-3-speak-uchi",
      "うちで べんきょうします",
      "I study at home.",
    ),
    // listening_build — assemble a で sentence (hard direction)
    listeningBuildSentence({
      id: "ja-m6-3-lb-densha",
      target: "でんしゃで がっこうに いきます",
      tiles: ["でんしゃ", "で", "がっこう", "に", "いきます", "うち", "あります"],
      correctOrder: ["でんしゃ", "で", "がっこう", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to school by train.'",
    }),
    // ── Review tail ──
    vocabMcq("ja-m6-3-rev-mcq-1", M6_3_REVIEW[1], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-3-rev-lc",
      audioText: M6_3_REVIEW[2].kana,
      correctMeaningEn: M6_3_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_3_REVIEW[3].meaningEn,
        M6_3_REVIEW[4].meaningEn,
        M6_3_REVIEW[5].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-3-rev", M6_3_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-3-info-end",
      "You can now say where you do things and how you get there",
      "Action-setting (うちで) and means (でんしゃで) both take で. Next: が, finally — but in its friendliest use.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_3.steps);
assertAnswerRotation(M6_3.steps, 2);
assertNoConsecutiveSame(M6_3.steps);

// ----- M6-4 — が (existence pattern) -------------------------------------

const RULE_GA_EXISTENCE = grammarRule({
  id: "ja-m6-4-rule-ga",
  title: "が — the existence particle (___が あります / います)",
  rule:
    "が marks the subject — most commonly the thing being introduced as NEW information. The friendliest use: existence sentences. 'こうえんが あります' = 'there's a park.' あります for inanimate things, います for living things. Don't worry about は vs が contrast yet — that's a much later lesson.",
  examples: [
    {
      ja: "こうえんが あります。",
      romaji: "kouen ga arimasu.",
      en: "There's a park.",
    },
    {
      ja: "ねこが います。",
      romaji: "neko ga imasu.",
      en: "There's a cat. (a living thing — います, not あります)",
    },
  ],
  antiPattern: {
    ja: "ねこが あります。",
    romaji: "neko ga arimasu.",
    en: "(broken — treats the cat as inanimate)",
    why: "Living things (people, animals) take います, not あります. Inanimate things (parks, books, convenience stores) take あります. The が is correct in both — only the existence verb changes.",
  },
  cultureNote:
    "Living things (people, animals) take います. Inanimate things take あります. Plants and cars are あります (no will/agency in the Japanese reckoning).",
});

const M6_4_REVIEW = pickReviewAtoms("ja-m6-4-rev", PRIOR_POOL, 6);

export const M6_4: LessonContent = {
  id: "ja-m6-4",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "が — there is / there are",
  description:
    "The existence pattern. ___が あります (inanimate) / ___が います (living).",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m6-4-info-open",
      "Finally — が",
      "が is famous as 'the other particle' that confuses beginners. We're introducing it in its friendliest form: the existence pattern. 'X が あります/います' = 'there's an X.' Memorize this as a unit and worry about は vs が later.",
    ),
    RULE_GA_EXISTENCE,
    // ── Cloze block: が dominates but rotated with は / の / に as foils ──
    cloze(
      "ja-m6-4-cloze-1",
      "こうえん",
      " あります。",
      "が",
      ["が", "は", "の", "を"],
      "There's a park.",
      "こうえんが あります。",
      "Existence sentence — inanimate thing + が + あります.",
    ),
    // listening break before next cloze
    listeningCompSentence({
      id: "ja-m6-4-lc-neko",
      audioText: "ねこが います",
      correctMeaningEn: "There's a cat.",
      distractorsEn: [
        "I have a cat.",
        "I like cats.",
        "I'm with a cat.",
      ],
    }),
    cloze(
      "ja-m6-4-cloze-2",
      "ねこ",
      " います。",
      "が",
      ["が", "は", "の", "を"],
      "There's a cat.",
      "ねこが います。",
      "Living thing + が + います.",
    ),
    // sentenceMcq break — discriminate あります vs います (the rule
    // the learner JUST committed)
    sentenceMcq({
      id: "ja-m6-4-mcq-ari-vs-i",
      prompt: "Which sentence means 'There's a dog.'?",
      correctKana: "いぬが います。",
      distractorsKana: [
        "いぬが あります。",
        "いぬは います。",
        "いぬで います。",
      ],
      explanation:
        "Dogs are alive → います, not あります. は would frame the dog as topic ('as for the dog, it exists'), which is the wrong feel for announcing.",
    }),
    cloze(
      "ja-m6-4-cloze-3",
      "コンビニ",
      " あります。",
      "が",
      ["が", "は", "の", "に"],
      "There's a convenience store.",
      "コンビニが あります。",
      "Inanimate → あります.",
    ),
    // listening break before contrast cloze (kills adjacency)
    listeningCompSentence({
      id: "ja-m6-4-lc-konbini-ari",
      audioText: "コンビニが あります",
      correctMeaningEn: "There's a convenience store.",
      distractorsEn: [
        "I'm at the convenience store.",
        "Is there a convenience store?",
        "I go to the convenience store.",
      ],
    }),
    // contrast cloze — に as a foil so the answer set isn't 100% が
    cloze(
      "ja-m6-4-cloze-ni-foil",
      "がっこう",
      " います。",
      "に",
      ["に", "が", "で", "は"],
      "I'm at school. (NOT 'there's a school' — pure existence of speaker)",
      "がっこうに います。",
      "Pure existence of an implied 'I' → location particle に. Compare to がっこうが あります = 'there's a school' (announcing it).",
    ),
    // listening break before final cloze
    listeningCompSentence({
      id: "ja-m6-4-lc-tomodachi",
      audioText: "ともだちが います",
      correctMeaningEn: "There's a friend (here).",
      distractorsEn: [
        "I am a friend.",
        "There's a teacher.",
        "I go with a friend.",
      ],
    }),
    cloze(
      "ja-m6-4-cloze-4",
      "トイレ",
      " ありますか。",
      "が",
      ["が", "は", "の", "を"],
      "Is there a toilet?",
      "トイレが ありますか。",
      "Existence + か question. The most useful sentence in tourist Japan.",
    ),
    // vocabMcq break — prior-module review (ratio bump)
    vocabMcq("ja-m6-4-rev-mcq-mid", M6_4_REVIEW[0], PRIOR_POOL),
    // sentenceMcq — animacy + が pattern under near-distractors
    sentenceMcq({
      id: "ja-m6-4-mcq-tomodachi",
      prompt: "Which sentence means 'There's a friend (here).'?",
      correctKana: "ともだちが います。",
      distractorsKana: [
        "ともだちが あります。",
        "ともだちに います。",
        "ともだちで います。",
      ],
      explanation:
        "Friends are alive → います. に / で don't appear in pure existence sentences (those need が).",
    }),
    // selfExplain — N-1 placement, AFTER 4 cloze commits + 2 sentenceMcq.
    // Probes the あります/います animacy split (the rule the learner just
    // committed). The は/が discrimination is DEFERRED to M6-5, where the
    // learner will have used が in 4+ more existence sites.
    selfExplain({
      id: "ja-m6-4-self-animacy",
      anchorLabel:
        "You picked います in: ねこ＿ います / あります 'There's a cat'",
      anchorAudioText: "ねこが います",
      question: "Why does ねこ take います, but こうえん takes あります?",
      rule: {
        text: "います is for living things (people, animals); あります is for inanimate things (places, objects). Cats are alive; parks aren't.",
      },
      surface: {
        text: "い-something verbs go with small words, あ-something verbs go with long words.",
      },
      distractor: {
        text: "います is for things you can see; あります is for things you can't see.",
      },
      ruleExplanation:
        "Animacy in Japanese: anything that moves of its own will (people, animals, even insects) → います. Anything else (plants, cars, buildings) → あります. Counterintuitively, plants and vehicles are あります because they don't have will/agency in the Japanese reckoning.",
    }),
    // production — tile-bank build. Migrated from translateStep 2026-05-18.
    // Distractor あります forces the animacy call (cats → います, not あります).
    build(
      "ja-m6-4-translate-cat",
      "There's a cat.",
      "ねこが います",
      ["ねこ", "が", "います", "あります"],
      ["ねこ", "が", "います"],
    ),
    // speaking — the most useful X が ありますか sentence
    speaking(
      "ja-m6-4-speak-toire",
      "トイレが ありますか",
      "Is there a toilet?",
    ),
    // listening_build — assemble an existence sentence (hard direction)
    listeningBuildSentence({
      id: "ja-m6-4-lb-koen",
      target: "こうえんが あります",
      tiles: ["こうえん", "が", "あります", "ねこ", "います", "うち", "で"],
      correctOrder: ["こうえん", "が", "あります"],
      promptEn: "Hear it, build it: 'There's a park.'",
    }),
    // ── Review tail ──
    vocabMcq("ja-m6-4-rev-mcq-1", M6_4_REVIEW[1], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-4-rev-lc",
      audioText: M6_4_REVIEW[2].kana,
      correctMeaningEn: M6_4_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_4_REVIEW[3].meaningEn,
        M6_4_REVIEW[4].meaningEn,
        M6_4_REVIEW[5].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-4-rev", M6_4_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-4-info-end",
      "You can now point at anything and say 'there's an X'",
      "X が あります/います = 'there's an X.' 90% of beginner が encounters in the wild are this pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_4.steps);
assertAnswerRotation(M6_4.steps, 2);
assertNoConsecutiveSame(M6_4.steps);

// ----- M6-5 — Interleaved に + で (rotating-answer drills) ---------------

const M6_5_REVIEW = pickReviewAtoms("ja-m6-5-rev", PRIOR_POOL, 6);

export const M6_5: LessonContent = {
  id: "ja-m6-5",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved — に + で (+ a peek at は/が)",
  description:
    "Mixed practice. Each cloze asks: am I pointing at a destination (に), or naming a setting / means (で)? Plus the deferred は/が check-in now that you've used が.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m6-5-info-open",
      "Sort by role",
      "The two-question filter: am I pointing at a destination / location (に), or naming where the action happens / how I'm doing it (で)? Answers rotate — no screen-pattern shortcut.",
    ),
    // Rotating clozes: に → で → に → で (no run > 2)
    cloze(
      "ja-m6-5-cloze-1",
      "がっこう",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to school.",
      "がっこうに いきます。",
      "Movement → destination → に.",
    ),
    // listening break
    listeningCompSentence({
      id: "ja-m6-5-lc-uchi",
      audioText: "うちで べんきょうします",
      correctMeaningEn: "I study at home.",
      distractorsEn: [
        "I go home.",
        "I'm at home.",
        "Home is here.",
      ],
    }),
    cloze(
      "ja-m6-5-cloze-2",
      "うち",
      " べんきょうします。",
      "で",
      ["に", "で", "を", "の"],
      "I study at home.",
      "うちで べんきょうします。",
      "Action (study) → setting → で.",
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-5-mcq-jitensha",
      prompt: "Which sentence means 'I go to the park by bicycle.'?",
      correctKana: "じてんしゃで こうえんに いきます。",
      distractorsKana: [
        "じてんしゃに こうえんで いきます。",
        "じてんしゃで こうえんで いきます。",
        "じてんしゃに こうえんに いきます。",
      ],
      explanation:
        "Means (bicycle) → で. Destination (park) → に. Each role gets its own particle; swapping them breaks the sentence.",
    }),
    cloze(
      "ja-m6-5-cloze-3",
      "じてんしゃ",
      " いきます。",
      "で",
      ["に", "で", "を", "の"],
      "I go by bicycle.",
      "じてんしゃで いきます。",
      "Means of motion → で.",
    ),
    // listening break (R3 interleave) between back-to-back clozes
    listeningCompSentence({
      id: "ja-m6-5-lc-kaerimasu",
      audioText: "うちに かえります",
      correctMeaningEn: "I'm going home.",
      distractorsEn: [
        "I'm at home.",
        "I study at home.",
        "There's a home.",
      ],
    }),
    cloze(
      "ja-m6-5-cloze-4",
      "うち",
      " かえります。",
      "に",
      ["に", "で", "を", "が"],
      "I'm going home.",
      "うちに かえります。",
      "Destination (home) + motion verb (かえる) → に.",
    ),
    // vocabMcq break — prior-module review (ratio bump)
    vocabMcq("ja-m6-5-rev-mcq-mid", M6_5_REVIEW[0], PRIOR_POOL),
    // production — tile-bank build of a compound sentence (≥5-mora).
    // Migrated from translateStep 2026-05-18. Distractor がっこうで forces
    // the destination-vs-setting call (motion verb → に, not で).
    build(
      "ja-m6-5-translate-densha",
      "I go to school by train.",
      "でんしゃで がっこうに いきます",
      ["でんしゃ", "で", "がっこう", "に", "いきます", "うち"],
      ["でんしゃ", "で", "がっこう", "に", "いきます"],
    ),
    cloze(
      "ja-m6-5-cloze-5",
      "コンビニ",
      " はたらきます。",
      "で",
      ["に", "で", "を", "は"],
      "I work at a convenience store.",
      "コンビニで はたらきます。",
      "Work = action → setting → で.",
    ),
    // listening_build — assemble a に+で combo sentence from word tiles
    listeningBuildSentence({
      id: "ja-m6-5-lb-eki",
      target: "バスで えきに いきます",
      tiles: ["バス", "で", "えき", "に", "いきます", "がっこう", "うち"],
      correctOrder: ["バス", "で", "えき", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to the station by bus.'",
    }),
    cloze(
      "ja-m6-5-cloze-6",
      "えき",
      " います。",
      "に",
      ["に", "で", "を", "は"],
      "I'm at the station.",
      "えきに います。",
      "Existence → location point → に.",
    ),
    // selfExplain — NOW the deferred は/が discrimination, AFTER 4
    // cloze commits in this lesson + 4+ が commits in M6-4. The learner
    // has the が pattern in muscle memory and is ready for the contrast.
    selfExplain({
      id: "ja-m6-5-self-ha-vs-ga",
      anchorLabel:
        "Compare: こうえん＿ あります vs こうえん＿ どこですか",
      anchorAudioText: "こうえんが あります",
      question:
        "Why does 'There's a park' take が, but 'Where IS the park?' takes は?",
      rule: {
        text: "が introduces NEW information (announcing the park exists). は frames a known TOPIC the speaker is asking ABOUT (you both know what 'the park' is; the question is just where).",
      },
      surface: {
        text: "が is used in statements; は is used in questions.",
      },
      distractor: {
        text: "が introduces the answer to an implied wh-question; は doesn't.",
      },
      ruleExplanation:
        "The distractor is a real near-rule that's true SOMETIMES (が often answers 'who/what?'), but the underlying split is information status: が = new info, は = known topic. 'こうえんが あります' announces a park you didn't know about; 'こうえんは どこですか' takes the park as already-known and asks WHERE it is.",
    }),
    // production — tile-bank build of a compound cumulative sentence.
    // Migrated from translateStep 2026-05-18. Distractor うちで forces the
    // destination-vs-setting call (かえる is motion → に, not で).
    build(
      "ja-m6-5-translate-cumulative",
      "I go home by bicycle.",
      "じてんしゃで うちに かえります",
      ["じてんしゃ", "で", "うち", "に", "かえります", "います"],
      ["じてんしゃ", "で", "うち", "に", "かえります"],
    ),
    // speaking — production direction on the cumulative pattern
    speaking(
      "ja-m6-5-speak-densha",
      "でんしゃで がっこうに いきます",
      "I go to school by train.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m6-5-rev-mcq-1", M6_5_REVIEW[1], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-5-rev-lc",
      audioText: M6_5_REVIEW[2].kana,
      correctMeaningEn: M6_5_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_5_REVIEW[3].meaningEn,
        M6_5_REVIEW[4].meaningEn,
        M6_5_REVIEW[5].meaningEn,
      ],
    }),
    vocabMcq("ja-m6-5-rev-mcq-2", M6_5_REVIEW[3], PRIOR_POOL),
    reviewMatchPairs("ja-m6-5-rev", M6_5_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m6-5-info-end",
      "You can now sort destinations from settings without screen tricks",
      "Six drills, no screen-pattern shortcut. You're now parsing meaning, not position — and you've had a first peek at は vs が.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_5.steps);
assertAnswerRotation(M6_5.steps, 2);
assertNoConsecutiveSame(M6_5.steps);

// ----- M6-6 — Interleaved existence + locations (に / で / が ALL rotate) -

const M6_6_REVIEW = pickReviewAtoms("ja-m6-6-rev", PRIOR_POOL, 6);

export const M6_6: LessonContent = {
  id: "ja-m6-6",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved — existence + locations",
  description:
    "Six clozes drawing across が (existence) + に (location) + で (setting). Rotating answers — no screen-position shortcut.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m6-6-info-open",
      "All three particles in play",
      "Pre-rebuild this lesson was 6 が in a row — recognition of screen position, not grammar. Now the answer rotates across が / に / で and each carrier asks for actual parsing.",
    ),
    // ── ROTATING-ANSWER CLUSTER. Six clozes rotate across 3 distinct
    //    particles (が → に → で → が → に → が). assertAnswerRotation(3)
    //    at end of module verifies. ──
    cloze(
      "ja-m6-6-cloze-1",
      "ともだち",
      " います。",
      "が",
      ["が", "は", "の", "を"],
      "There's a friend (here).",
      "ともだちが います。",
      "Living thing + existence → が + います.",
    ),
    // sentenceMcq break — semantic discrimination
    sentenceMcq({
      id: "ja-m6-6-mcq-existence-vs-location",
      prompt: "Which sentence means 'I'm at the convenience store.'?",
      correctKana: "コンビニに います。",
      distractorsKana: [
        "コンビニが います。",
        "コンビニで います。",
        "コンビニは あります。",
      ],
      explanation:
        "'I am at X' = pure existence → location takes に. が would announce 'there's a convenience store'; で would mean an action happens there.",
    }),
    cloze(
      "ja-m6-6-cloze-2",
      "がっこう",
      " います。",
      "に",
      ["に", "で", "が", "を"],
      "I'm at school.",
      "がっこうに います。",
      "Pure existence → location point → に. (NOT が — the subject 'I' is implied; the place is the location, not the new info.)",
    ),
    // tile-bank build break — R3 interleave + production direction between
    // clozes. Migrated from translateStep 2026-05-18. Distractor こうえんで
    // forces the location-of-existence call (に for existence sites, not で).
    build(
      "ja-m6-6-translate-park-cat",
      "There's a cat at the park.",
      "こうえんに ねこが います",
      ["こうえん", "に", "ねこ", "が", "います", "で"],
      ["こうえん", "に", "ねこ", "が", "います"],
    ),
    cloze(
      "ja-m6-6-cloze-3",
      "うち",
      " べんきょうします。",
      "で",
      ["で", "に", "が", "を"],
      "I study at home.",
      "うちで べんきょうします。",
      "Action setting → で.",
    ),
    // listening break before the next cloze
    listeningCompSentence({
      id: "ja-m6-6-lc-konbini",
      audioText: "コンビニが ありますか",
      correctMeaningEn: "Is there a convenience store?",
      distractorsEn: [
        "I'm at the convenience store.",
        "Is the convenience store far?",
        "I go to the convenience store.",
      ],
    }),
    cloze(
      "ja-m6-6-cloze-4",
      "コンビニ",
      " ありますか。",
      "が",
      ["が", "は", "を", "に"],
      "Is there a convenience store?",
      "コンビニが ありますか。",
      "Existence question → が + あります + か.",
    ),
    // vocabMcq break — prior-module review (ratio bump)
    vocabMcq("ja-m6-6-rev-mcq-mid", M6_6_REVIEW[0], PRIOR_POOL),
    // sentenceMcq break — final discrimination
    sentenceMcq({
      id: "ja-m6-6-mcq-cat-park",
      prompt: "Which sentence means 'There's a cat in the park.'?",
      correctKana: "こうえんに ねこが います。",
      distractorsKana: [
        "こうえんが ねこに います。",
        "こうえんで ねこは います。",
        "こうえんに ねこは いますか。",
      ],
      explanation:
        "Location (park) → に. Subject being introduced (cat, new info) → が. The other options swap roles or add は/か wrongly.",
    }),
    cloze(
      "ja-m6-6-cloze-5",
      "ホテル",
      " かえります。",
      "に",
      ["に", "で", "を", "が"],
      "I'm going back to the hotel.",
      "ホテルに かえります。",
      "Destination + motion verb (かえる) → に.",
    ),
    // production — listening_build on a compound (が + location)
    listeningBuildSentence({
      id: "ja-m6-6-lb-toire",
      target: "えきに トイレが あります",
      tiles: ["えき", "に", "トイレ", "が", "あります", "コンビニ", "で"],
      correctOrder: ["えき", "に", "トイレ", "が", "あります"],
      promptEn: "Hear it, build it: 'There's a toilet at the station.'",
    }),
    cloze(
      "ja-m6-6-cloze-6",
      "ねこ",
      " います。",
      "が",
      ["が", "は", "の", "を"],
      "There's a cat.",
      "ねこが います。",
      "Living thing + existence → が + います.",
    ),
    // speaking — production direction on the most-useful pattern
    speaking(
      "ja-m6-6-speak-toire",
      "トイレが ありますか",
      "Is there a toilet?",
    ),
    // production — tile-bank build of a 3-particle compound sentence.
    // Migrated from translateStep 2026-05-18. Distractor がっこうで forces
    // the existence-location call (に, not で, for います-sites).
    build(
      "ja-m6-6-translate-cumulative",
      "There's a friend at school.",
      "がっこうに ともだちが います",
      ["がっこう", "に", "ともだち", "が", "います", "で"],
      ["がっこう", "に", "ともだち", "が", "います"],
    ),
    // listening break before review tail — cumulative pattern recall
    listeningCompSentence({
      id: "ja-m6-6-lc-cumulative",
      audioText: "うちに ねこが います",
      correctMeaningEn: "There's a cat at my house.",
      distractorsEn: [
        "I'm at my house with a cat.",
        "I'm going home to the cat.",
        "Is there a cat at home?",
      ],
    }),
    // ── Review tail ──
    vocabMcq("ja-m6-6-rev-mcq-1", M6_6_REVIEW[1], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-6-rev-lc",
      audioText: M6_6_REVIEW[2].kana,
      correctMeaningEn: M6_6_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_6_REVIEW[3].meaningEn,
        M6_6_REVIEW[4].meaningEn,
        M6_6_REVIEW[5].meaningEn,
      ],
    }),
    vocabMcq("ja-m6-6-rev-mcq-2", M6_6_REVIEW[3], PRIOR_POOL),
    reviewMatchPairs("ja-m6-6-rev", M6_6_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m6-6-info-end",
      "You can now juggle が, に, AND で in the same sentence",
      "Six existence + location drills, three rotating particles. You now have 'X が あります/います' = 'there's an X' AND the location-particle filter from M6-2/3 working together.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_6.steps);
// 6 clozes rotate が→に→で→が→に→が = 3 distinct → minDistinct=3 passes.
assertAnswerRotation(M6_6.steps, 3);
assertNoConsecutiveSame(M6_6.steps);

// ----- M6-7 — Production (translate + listening_build + speaking) -------

const M6_7_REVIEW = pickReviewAtoms("ja-m6-7-rev", PRIOR_POOL, 8);

export const M6_7: LessonContent = {
  id: "ja-m6-7",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — say where + how + what's there",
  description:
    "Cumulative production across translate, listening_build, build, and your voice. Sentences ≥5 mora use translate + listening_build (not sentence-tile build).",
  estimatedMinutes: 11,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m6-7-info-open",
      "Production time",
      "Six sentences across four modes. The longer ones (5+ mora) come in as translate or listening_build — sentence-tile build is reserved for shorter assemblies where the tiles really teach.",
    ),
    // Sentence 1 (5+ mora): tile-bank build. Migrated from translateStep
    // 2026-05-18. Distractor がっこうで forces the destination-vs-setting
    // call (motion verb いく → に, not で).
    build(
      "ja-m6-7-s1",
      "I go to school by bicycle.",
      "じてんしゃで がっこうに いきます",
      ["じてんしゃ", "で", "がっこう", "に", "いきます", "うち", "あります"],
      ["じてんしゃ", "で", "がっこう", "に", "いきます"],
    ),
    // Sentence 2 (short, 4 tiles): build_sentence is the right fit
    build(
      "ja-m6-7-s2",
      "Ask: Is there a toilet?",
      "トイレが ありますか",
      ["トイレ", "が", "あります", "か", "ねこ", "います"],
      ["トイレ", "が", "あります", "か"],
    ),
    // speaking on the just-built sentence (Bjork — immediate hard direction)
    speaking(
      "ja-m6-7-speak-s2",
      "トイレが ありますか",
      "Is there a toilet?",
    ),
    // Sentence 3 (5+ mora): listening_build (hear → assemble)
    listeningBuildSentence({
      id: "ja-m6-7-s3",
      target: "コンビニで はたらきます",
      tiles: ["コンビニ", "で", "はたらきます", "うち", "べんきょうします"],
      correctOrder: ["コンビニ", "で", "はたらきます"],
      promptEn: "Hear it, build it: 'I work at a convenience store.'",
    }),
    // vocabMcq break — prior-module review (ratio bump, also breaks build run)
    vocabMcq("ja-m6-7-rev-mcq-early", M6_7_REVIEW[0], PRIOR_POOL),
    // Sentence 4 (5+ mora): tile-bank build (hard direction). Migrated
    // from translateStep 2026-05-18. Distractor えきで forces the
    // existence-location call (います → に, not で).
    build(
      "ja-m6-7-s4",
      "I'm at the station.",
      "えきに います",
      ["えき", "に", "います", "で", "あります"],
      ["えき", "に", "います"],
    ),
    // sentenceMcq break — pattern recall
    sentenceMcq({
      id: "ja-m6-7-mcq-recall",
      prompt: "Which sentence means 'There's a park near the station.'?",
      correctKana: "えきに こうえんが あります。",
      distractorsKana: [
        "えきで こうえんが あります。",
        "えきに こうえんは あります。",
        "えきが こうえんに います。",
      ],
      explanation:
        "Location (station) → に. New-info subject (park, inanimate) → が + あります. Other options misuse で / は / が swaps.",
    }),
    // Sentence 5 (5+ mora): listening_build with longer assembly
    listeningBuildSentence({
      id: "ja-m6-7-s5",
      target: "うちに ねこが います",
      tiles: ["うち", "に", "ねこ", "が", "います", "コンビニ", "で", "あります"],
      correctOrder: ["うち", "に", "ねこ", "が", "います"],
      promptEn: "Hear it, build it: 'There's a cat at my house.'",
    }),
    // speaking break — production direction on cumulative pattern
    speaking(
      "ja-m6-7-speak-uchi-neko",
      "うちに ねこが います",
      "There's a cat at my house.",
    ),
    // sentenceMcq break — final pattern discrimination across all 3 particles
    sentenceMcq({
      id: "ja-m6-7-mcq-three-particles",
      prompt: "Which sentence means 'I go to the park by bus.'?",
      correctKana: "バスで こうえんに いきます。",
      distractorsKana: [
        "バスに こうえんで いきます。",
        "バスで こうえんで いきます。",
        "バスが こうえんに います。",
      ],
      explanation:
        "Means (bus) → で. Destination (park) → に. The other options swap roles or replace the verb with 'exist.'",
    }),
    // listening comprehension break — semantic discrimination on cumulative pattern
    listeningCompSentence({
      id: "ja-m6-7-lc-bus",
      audioText: "バスで うちに かえります",
      correctMeaningEn: "I'm going home by bus.",
      distractorsEn: [
        "I go to the bus stop.",
        "I'm at home with the bus.",
        "The bus is at my home.",
      ],
    }),
    // Sentence 6 (5+ mora): tile-bank build (final hard direction).
    // Migrated from translateStep 2026-05-18. Distractor いますか forces
    // the animacy call (コンビニ is inanimate → あります, not います).
    build(
      "ja-m6-7-s6",
      "Is there a convenience store?",
      "コンビニが ありますか",
      ["コンビニ", "が", "あります", "か", "います"],
      ["コンビニ", "が", "あります", "か"],
    ),
    // speaking — production direction on a cumulative sentence
    speaking(
      "ja-m6-7-speak-final",
      "コンビニが ありますか",
      "Is there a convenience store?",
    ),
    // ── Review tail (broadest cumulative draw across all prior modules) ──
    listeningCompSentence({
      id: "ja-m6-7-rev-lc-1",
      audioText: M6_7_REVIEW[1].kana,
      correctMeaningEn: M6_7_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_7_REVIEW[2].meaningEn,
        M6_7_REVIEW[3].meaningEn,
        M6_7_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m6-7-rev-mcq-1", M6_7_REVIEW[2], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-7-rev-lc-2",
      audioText: M6_7_REVIEW[3].kana,
      correctMeaningEn: M6_7_REVIEW[3].meaningEn,
      distractorsEn: [
        M6_7_REVIEW[4].meaningEn,
        M6_7_REVIEW[5].meaningEn,
        M6_7_REVIEW[6].meaningEn,
      ],
    }),
    vocabMcq("ja-m6-7-rev-mcq-2", M6_7_REVIEW[5], PRIOR_POOL),
    reviewMatchPairs("ja-m6-7-rev", M6_7_REVIEW.slice(0, 6)),
    infoStep(
      "ja-m6-7-info-end",
      "You can now describe where you are, where you're going, and what's around — in your own voice",
      "Six sentences, four modes. From here on, every M6 pattern is on your lips.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_7.steps);
assertAnswerRotation(M6_7.steps, 2);
assertNoConsecutiveSame(M6_7.steps);

// ----- M6-8 — Mini-dialogue (asking directions in Shibuya) ---------------
// REWRITE: uses the new `dialogueListen()` factory (per Wave 4B spec).
// The legacy `dialogueLesson()` was emitting one-off phrase_card atoms
// (FamilyMart, とおいです, ちかいです, いいえ) that polluted the atom
// coverage test as n=1 surfaces. `dialogueListen()` collapses the dialogue
// into a single `dialogue_listen` step with 3 questions — no rogue atoms.

const M6_8_REVIEW = pickReviewAtoms("ja-m6-8-rev", PRIOR_POOL, 6);

export const M6_8: LessonContent = {
  id: "ja-m6-8",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — asking directions in Shibuya",
  description:
    "You're lost in Shibuya. A four-turn exchange with a stranger gets you to the station. Closes with cumulative review across M1-M5 atoms.",
  estimatedMinutes: 9,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m6-8-info-open",
      "Drop into the scene",
      "You're walking through Shibuya looking for the station. You stop a stranger to ask where it is, which way to go, and how long it takes.",
      "culture",
    ),
    // ── Warm-up vocab — the two new words the dialogue depends on ──
    // (ちかい / とおい — adjectives used in the responses). These are
    // taught as kana so the learner can decode the dialogue when it plays.
    vocab(
      "ja-m6-8-warm-chikai",
      "Close / nearby",
      "chikai",
      "ちかい",
      "Adjective. 'えきは ちかいです' = the station is close.",
    ),
    // listening break between back-to-back vocab cards
    listeningCompSentence({
      id: "ja-m6-8-lc-chikai-vs-tooi",
      audioText: "ちかいです",
      correctMeaningEn: "It's close.",
      distractorsEn: ["It's far.", "It's loud.", "It's expensive."],
    }),
    vocab(
      "ja-m6-8-warm-tooi",
      "Far",
      "tooi",
      "とおい",
      "Adjective. 'えきは とおいです' = the station is far. The 'oo' is held long.",
    ),
    // listening comprehension break on the warm-up words
    listeningCompSentence({
      id: "ja-m6-8-lc-chikai",
      audioText: "ちかいです",
      correctMeaningEn: "It's close.",
      distractorsEn: ["It's far.", "It's here.", "It's there."],
    }),
    // vocab — the question phrase the learner will use
    vocab(
      "ja-m6-8-warm-doko",
      "Where",
      "doko",
      "どこ",
      "Question word. 'えきは どこですか' = where is the station?",
    ),
    // pre-dialogue priming — tile-bank build of the key opener. Migrated
    // from translateStep 2026-05-18. Distractor えきに forces the topic-
    // vs-location call (a wh-question about a known topic takes は, not に).
    build(
      "ja-m6-8-translate-doko",
      "Where is the station?",
      "えきは どこですか",
      ["えき", "は", "どこ", "です", "か", "に"],
      ["えき", "は", "どこ", "です", "か"],
    ),
    // ── THE DIALOGUE — new `dialogueListen()` factory ──
    // 4 turns, 3 comprehension questions (where / which way / how long).
    // No phrase_card emissions → no rogue atom leakage.
    dialogueListen({
      id: "ja-m6-8-dialogue",
      lines: [
        {
          speaker: "You",
          kana: "すみません。えきは どこですか。",
          audioText: "すみません。えきは どこですか",
        },
        {
          speaker: "Stranger",
          kana: "えきは あちらです。みぎへ いって ください。",
          audioText: "えきは あちらです。みぎへ いって ください",
        },
        {
          speaker: "You",
          kana: "ありがとうございます。とおいですか。",
          audioText: "ありがとうございます。とおいですか",
        },
        {
          speaker: "Stranger",
          kana: "いいえ、ごふんです。",
          audioText: "いいえ、ごふんです",
        },
      ],
      questions: [
        {
          id: "q-where",
          prompt: "Where is the station, according to the stranger?",
          correctText: "Over there (あちら)",
          distractors: [
            "Right here",
            "Back the way you came",
            "Inside the shop",
          ],
          explanation:
            "あちら = 'over there (away from both of us).' The stranger then specifies 'go right.'",
        },
        {
          id: "q-direction",
          prompt: "Which direction does the stranger tell you to go?",
          correctText: "Right (みぎ)",
          distractors: [
            "Left (ひだり)",
            "Straight ahead",
            "Back the way you came",
          ],
          explanation:
            "みぎへ いって ください = 'please go to the right.' へ marks the direction of motion (similar to に for destinations).",
        },
        {
          id: "q-howlong",
          prompt: "How long will it take to get there?",
          correctText: "5 minutes (ごふん)",
          distractors: ["1 minute", "10 minutes", "30 minutes"],
          explanation:
            "ごふん = 5 minutes (ご = 5, ふん = minute counter). Not far at all.",
        },
      ],
    }),
    // ── Post-dialogue comprehension on a single line (audio recall) ──
    listeningCompSentence({
      id: "ja-m6-8-lc-dialogue-line",
      audioText: "えきは あちらです",
      correctMeaningEn: "The station is over there.",
      distractorsEn: [
        "The station is here.",
        "Is there a station?",
        "I go to the station.",
      ],
    }),
    // ── Cumulative grammar check — answers rotate (に, が, で) ──
    cloze(
      "ja-m6-8-cloze-1",
      "コンビニ",
      " ありますか。",
      "が",
      ["が", "は", "を", "に"],
      "Is there a convenience store?",
      "コンビニが ありますか。",
      "Existence question → が.",
    ),
    // sentenceMcq break
    sentenceMcq({
      id: "ja-m6-8-mcq-eki",
      prompt: "Which sentence means 'The bank is at the station.'?",
      correctKana: "えきに ぎんこうが あります。",
      distractorsKana: [
        "えきで ぎんこうが あります。",
        "えきに ぎんこうは あります。",
        "えきが ぎんこうに あります。",
      ],
      explanation:
        "Location (station) → に. New-info subject (bank) → が + あります.",
    }),
    cloze(
      "ja-m6-8-cloze-2",
      "えき",
      " います。",
      "に",
      ["に", "で", "を", "が"],
      "I'm at the station.",
      "えきに います。",
      "Pure existence → location point → に.",
    ),
    // Production tap — tile-bank build of one cumulative sentence.
    // Migrated from translateStep 2026-05-18. Distractor うちで forces the
    // destination-vs-setting call (かえる is motion → に, not で).
    build(
      "ja-m6-8-translate-final",
      "I'm going home by bus.",
      "バスで うちに かえります",
      ["バス", "で", "うち", "に", "かえります", "います"],
      ["バス", "で", "うち", "に", "かえります"],
    ),
    // speaking — the opener you'd actually use in Shibuya tomorrow
    speaking(
      "ja-m6-8-speak-doko",
      "えきは どこですか",
      "Where is the station?",
    ),
    // listening_build — assemble a directions-style cumulative sentence
    listeningBuildSentence({
      id: "ja-m6-8-lb-cumulative",
      target: "えきに コンビニが あります",
      tiles: ["えき", "に", "コンビニ", "が", "あります", "うち", "で", "います"],
      correctOrder: ["えき", "に", "コンビニ", "が", "あります"],
      promptEn: "Hear it, build it: 'There's a convenience store at the station.'",
    }),
    // speaking — second utterance, the gratitude close
    speaking(
      "ja-m6-8-speak-thanks",
      "ありがとうございます",
      "Thank you.",
    ),
    // ── Cumulative review tail (broadest set — M1-M5) ──
    vocabMcq("ja-m6-8-rev-mcq-1", M6_8_REVIEW[0], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-8-rev-lc",
      audioText: M6_8_REVIEW[1].kana,
      correctMeaningEn: M6_8_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_8_REVIEW[2].meaningEn,
        M6_8_REVIEW[3].meaningEn,
        M6_8_REVIEW[4].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-8-rev", M6_8_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m6-8-info-end",
      "You can now ask a stranger for directions in Shibuya",
      "Opener (えきは どこですか) + comprehension on the response (right/left, how many minutes). You can now find anything in Japan.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_8.steps);
assertAnswerRotation(M6_8.steps, 2);
assertNoConsecutiveSame(M6_8.steps);

// ----- M6-9 — Row test (mastery ★) --------------------------------------
// Preserved from prior structure (mockCourse.ts + ja-m3-m7-coverage +
// grammar-rule tests contract the id). Items expanded for cumulative
// coverage across the rebuilt M6 sub-lessons.

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

const M6_TEST_ITEMS: RowTestItem[] = [
  {
    kind: "mc",
    payload: particleMc(
      "ja-m6-9-mc-1",
      "がっこう___ いきます。 (I go to school.)",
      "がっこうに いきます",
      "に",
      ["で", "は", "を"],
      "Movement verb (いく) + destination point.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m6-9-mc-2",
      "うち___ べんきょうします。 (I study at home.)",
      "うちで べんきょうします",
      "で",
      ["に", "は", "を"],
      "Studying is an action happening at a setting — で.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m6-9-mc-3",
      "トイレ___ ありますか。 (Is there a toilet?)",
      "トイレが ありますか",
      "が",
      ["は", "を", "に"],
      "Existence pattern — X が あります.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m6-9-mc-4",
      "ねこ___ います。 (There's a cat.)",
      "ねこが います",
      "が",
      ["は", "を", "の"],
      "Living thing + が + います.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m6-9-mc-5",
      "でんしゃ___ いきます。 (I go by train.)",
      "でんしゃで いきます",
      "で",
      ["に", "は", "を"],
      "Means of motion = で.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m6-9-mc-6",
      "えき___ います。 (I'm at the station.)",
      "えきに います",
      "に",
      ["で", "が", "を"],
      "Pure existence (います) → location point → に.",
    ),
  },
  {
    kind: "match",
    payload: {
      id: "ja-m6-9-match-places",
      type: "match_pairs",
      prompt: "Match each place to its meaning",
      pairs: [
        { id: "p1", source: "こうえん", target: "park", sourceAnnotation: [{ surface: "こうえん", reading: "こうえん" }] },
        { id: "p2", source: "がっこう", target: "school", sourceAnnotation: [{ surface: "がっこう", reading: "がっこう" }] },
        { id: "p3", source: "うち", target: "home", sourceAnnotation: [{ surface: "うち", reading: "うち" }] },
        { id: "p4", source: "えき", target: "station", sourceAnnotation: [{ surface: "えき", reading: "えき" }] },
        { id: "p5", source: "トイレ", target: "toilet", sourceAnnotation: [{ surface: "トイレ", reading: "トイレ" }] },
        { id: "p6", source: "コンビニ", target: "convenience store", sourceAnnotation: [{ surface: "コンビニ", reading: "コンビニ" }] },
      ],
    } as MatchPairsStep,
  },
  {
    kind: "build",
    payload: {
      id: "ja-m6-9-build",
      type: "build_sentence",
      prompt: "Say: I go to school by bicycle.",
      targetSentence: "じてんしゃで がっこうに いきます",
      tiles: ["じてんしゃ", "で", "がっこう", "に", "いきます", "うち", "コンビニ"],
      correctOrder: ["じてんしゃ", "で", "がっこう", "に", "いきます"],
      granularity: "word",
      audioKey: "じてんしゃで がっこうに いきます",
      targetAnnotation: [{ surface: "じてんしゃで がっこうに いきます", reading: "じてんしゃで がっこうに いきます" }],
    } as BuildSentenceStep,
  },
];

const M6_ROW_TEST: RowTestStep = {
  id: "ja-m6-9-test",
  type: "row_test",
  rowId: "m6",
  items: M6_TEST_ITEMS,
  passThreshold: 0.7,
  maxRetries: 3,
};

export const M6_9: LessonContent = {
  id: "ja-m6-9",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "M6 Mastery Test",
  description:
    "Cumulative test on locations + に/で + the existence pattern.",
  estimatedMinutes: 6,
  xpReward: 30,
  steps: [
    infoStep(
      "ja-m6-9-info-open",
      "Module 6 mastery",
      "Cumulative items: location particles, existence verbs, and vocab. Wrong answers re-queue. Pass once and Module 6 is mastered.",
    ),
    M6_ROW_TEST,
    infoStep(
      "ja-m6-9-info-end",
      "Module 6 complete",
      "You can find things, describe where they are, where you are, and how you got there. M7 brings verbs in motion — full sentences with actions and direct objects (を).",
      "win",
    ),
  ],
};
