/**
 * M6 — Where things are (density rebuild 2026-05-18).
 *
 * Spine (unchanged): に (destination) / で (setting) / が (existence).
 *
 * 2026-05-18 rebuild (per docs/m3-m7-rebuild-spec-2026-05-18.md):
 *   - Densified to 14-20 steps per content sub-lesson (was 5-12).
 *   - ≥1 generation step (translate / build / listening_build / speaking)
 *     per sub-lesson; ≥5 distinct step types; no two adjacent same-type.
 *   - Compounding review ≥0.25 ratio per sub-lesson drawing from
 *     M3_M7_REVIEW_POOL (M1 + M2 + M3 + M4 + M5 atoms).
 *   - assertNoSameAnswerCluster guards every sub-lesson — kills the
 *     M6-6 "がががが" cluster the spec explicitly calls out.
 *   - Existence drill (M6-6) rotates clozes through に / で / が across
 *     six items so the learner has to parse meaning, not screen position.
 *   - selfExplain ≥1 per grammar sub-lesson (M6-2, M6-3, M6-4 each get
 *     one; M6-4's probes "why が, not は" — the gentlest opening of the
 *     は/が discrimination, deferred to a sidequest otherwise).
 *   - build_sentence used only for ≤4-tile sentence builds (M6-1 light
 *     warmup + row test build). ≥5-mora sentences use translateStep +
 *     listeningBuildSentence + speaking per spec §4.
 *   - 9-lesson ID list preserved (mockCourse.ts + 3 test files reference
 *     ja-m6-1..ja-m6-9; external IDs win over the spec's "8 sub-lessons"
 *     target — per spec §12.1).
 *
 * Lesson list (9 lessons):
 *   M6-1  Places — vocab (8 location atoms) + retrieval interleave
 *   M6-2  に — destination + existence (Grammar Rule + drills + selfExplain)
 *   M6-3  で — action setting + means (Grammar Rule + drills + selfExplain)
 *   M6-4  が — there is / there are (Grammar Rule + drills + selfExplain)
 *   M6-5  Interleaved — に + で (rotating-answer drills)
 *   M6-6  Interleaved — existence + locations (に / で / が ALL rotate)
 *   M6-7  Production — translate + listening_build + speaking
 *   M6-8  Mini-dialogue — asking directions
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

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// Per-sub-lesson review-atom draws. Seeded by lesson id so each gets a
// stable but distinct subset across re-runs. Pool is M1+M2+M3+M4+M5.
// (Not M6 — M6 is the module being authored; can't review itself.)
// ───────────────────────────────────────────────────────────────────────
const PRIOR_POOL = M3_M7_REVIEW_POOL.filter(
  (a) =>
    a.fromModule === "m1" ||
    a.fromModule === "m2" ||
    a.fromModule === "m3" ||
    a.fromModule === "m4" ||
    a.fromModule === "m5",
);
// Subset draws for visual MCQ distractor pools (use M1 / M4 — both have
// many emoji-bearing concrete-noun atoms). M2 / M3 / M5 contribute through
// the main PRIOR_POOL draws for review-tail MCQ / match / listening.
const POOL_M1 = PRIOR_POOL.filter((a) => a.fromModule === "m1");
const POOL_M4 = PRIOR_POOL.filter((a) => a.fromModule === "m4");

// ----- M6-1 — Places vocab + retrieval interleave -----------------------

const M6_1_REVIEW = pickReviewAtoms("ja-m6-1-rev", PRIOR_POOL, 6);

export const M6_1: LessonContent = {
  id: "ja-m6-1",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Places",
  description:
    "Eight locations every Japanese map cares about. Vocab + immediate retrieval interleave.",
  estimatedMinutes: 8,
  xpReward: 20,
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
      { kana: "こうえん", meaningEn: "park", emoji: "🏞️", fromModule: "m6" },
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
      "ja-m6-1-mise",
      "Shop",
      "mise",
      "みせ",
      "Generic 'store.' Often suffixed: ほんや → ほんやさん (bookstore + politeness).",
    ),
    vocab(
      "ja-m6-1-heya",
      "Room",
      "heya",
      "へや",
      "Any room in a house or hotel. 'へやに います' = I'm in my room.",
    ),
    // visual MCQ on the second-to-last atom (encode + apply)
    vocabMcq(
      "ja-m6-1-mcq-mise",
      { kana: "みせ", meaningEn: "shop", emoji: "🛍️", fromModule: "m6" },
      POOL_M4,
    ),
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
    reviewMatchPairs("ja-m6-1-rev", M6_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m6-1-info-end",
      "Map vocab loaded",
      "Eight places, retrieval-checked. Next: three particles that put things AT, BY, and IN them.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_1.steps);

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

const M6_2_REVIEW = pickReviewAtoms("ja-m6-2-rev", PRIOR_POOL, 5);

export const M6_2: LessonContent = {
  id: "ja-m6-2",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "に — destination + existence",
  description:
    "The pinpoint particle. Direction toward a place, or being AT a place.",
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m6-2-info-open",
      "The pinpoint particle",
      "に marks a single point — where you're going or where you are. It pairs with movement verbs (いく/くる/かえる) and existence verbs (います/あります).",
    ),
    RULE_NI,
    // ── Cloze block: rotating answers (に dominates but で / は break it) ──
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
    // selfExplain — gentle metacognition on the rule just used
    selfExplain({
      id: "ja-m6-2-self-ni",
      anchorLabel: "You picked に in: えき＿ います (I'm at the station)",
      anchorAudioText: "えきに います",
      question: "Why is に correct in 'えきに います'?",
      rule: {
        text: "に marks WHERE something exists — the existence verb います always takes に, not で.",
      },
      surface: {
        text: "に always comes after the noun えき.",
      },
      distractor: {
        text: "に is the same as English 'at.'",
      },
      ruleExplanation:
        "Existence (いる/ある → います/あります) takes に — the location is treated as a single point where the thing IS. で would mean 'as the setting of an action,' which doesn't fit 'just being somewhere.'",
    }),
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
    // production step — translate (≥5-mora carrier, hard direction)
    translateStep({
      id: "ja-m6-2-translate-eki",
      promptEn: "I'm at the station.",
      acceptedAnswers: [
        "えきに います",
        "えきに います。",
        "えきにいます",
        "eki ni imasu",
      ],
      audioText: "えきに います",
    }),
    // ── Review tail — prior-module compounding ──
    vocabMcq("ja-m6-2-rev-mcq-1", M6_2_REVIEW[0], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-2-rev-lc",
      audioText: M6_2_REVIEW[1].kana,
      correctMeaningEn: M6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_2_REVIEW[2].meaningEn,
        M6_2_REVIEW[3].meaningEn,
        M6_2_REVIEW[4].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-2-rev", M6_2_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m6-2-info-end",
      "Pinpoint locked",
      "Location point + に + (motion or existence verb). Next: で, the setting particle — the place an ACTION happens.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_2.steps);

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

const M6_3_REVIEW = pickReviewAtoms("ja-m6-3-rev", PRIOR_POOL, 5);

export const M6_3: LessonContent = {
  id: "ja-m6-3",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "で — action setting + means",
  description:
    "The 'where it happens' particle. Also the 'by what means.'",
  estimatedMinutes: 10,
  xpReward: 24,
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
    // selfExplain — focus on the action-vs-existence filter
    selfExplain({
      id: "ja-m6-3-self-de",
      anchorLabel: "You picked で in: コンビニ＿ はたらきます (I work at a convenience store)",
      anchorAudioText: "コンビニで はたらきます",
      question: "Why is で correct here, not に?",
      rule: {
        text: "Working is an ACTION; で marks the place an action happens. に is for existence or destination, not action settings.",
      },
      surface: {
        text: "で sounds like English 'do' so it goes with verbs.",
      },
      distractor: {
        text: "で is the same particle as に — both mean 'at.'",
      },
      ruleExplanation:
        "に and で can both translate to English 'at,' but Japanese splits them by role: に for existence / destination (just being or going), で for the place an ACTION happens.",
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
    // production — translate (≥5-mora carrier)
    translateStep({
      id: "ja-m6-3-translate-bus",
      promptEn: "I go by bus.",
      acceptedAnswers: [
        "バスで いきます",
        "バスで いきます。",
        "バスでいきます",
        "basu de ikimasu",
      ],
      audioText: "バスで いきます",
    }),
    // ── Review tail ──
    vocabMcq("ja-m6-3-rev-mcq-1", M6_3_REVIEW[0], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-3-rev-lc",
      audioText: M6_3_REVIEW[1].kana,
      correctMeaningEn: M6_3_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_3_REVIEW[2].meaningEn,
        M6_3_REVIEW[3].meaningEn,
        M6_3_REVIEW[4].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-3-rev", M6_3_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m6-3-info-end",
      "Setting locked",
      "Action-setting (うちで) and means (でんしゃで) both take で. Next: が, finally — but in its friendliest use.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_3.steps);

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
    ja: "こうえんは あります。",
    romaji: "kouen wa arimasu.",
    en: "(off — 'as for the park, it exists.' Grammatical but the wrong feel)",
    why: "In existence sentences (saying something is THERE), Japanese uses が because the thing IS the new information. は frames an existing topic; が introduces. The two ARE different, but you don't need to master the contrast — just learn the ___が あります / います pattern as a unit.",
  },
  cultureNote:
    "Living things (people, animals) take います. Inanimate things take あります. Plants and cars are あります (no will/agency in the Japanese reckoning).",
});

const M6_4_REVIEW = pickReviewAtoms("ja-m6-4-rev", PRIOR_POOL, 5);

export const M6_4: LessonContent = {
  id: "ja-m6-4",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "が — there is / there are",
  description:
    "The existence pattern. ___が あります (inanimate) / ___が います (living).",
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m6-4-info-open",
      "Finally — が",
      "が is famous as 'the other particle' that confuses beginners. We're introducing it in its friendliest form: the existence pattern. 'X が あります/います' = 'there's an X.' Memorize this as a unit and worry about は vs が later.",
    ),
    RULE_GA_EXISTENCE,
    // ── Cloze block: が dominates but rotated with は / の as foils ──
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
    // selfExplain on the は/が discrimination — gentle, single moment
    selfExplain({
      id: "ja-m6-4-self-ga",
      anchorLabel: "You picked が in: こうえん＿ あります (There's a park)",
      anchorAudioText: "こうえんが あります",
      question: "Why is が correct here, not は?",
      rule: {
        text: "Existence sentences introduce NEW information; が is the 'new info' marker. は would treat the park as already-known topic ('as for the park…'), which doesn't fit announcing it.",
      },
      surface: {
        text: "が sounds like 'ga' so it's used with anything that exists.",
      },
      distractor: {
        text: "は and が mean exactly the same thing — pick either one.",
      },
      ruleExplanation:
        "は frames a topic the listener already knows about; が introduces something new. 'こうえんが あります' = 'there's a park (you didn't know about).' Don't worry about every は/が edge case yet — the existence pattern is the cleanest が use.",
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
    // sentenceMcq break — discriminate あります vs います
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
    // production — translate
    translateStep({
      id: "ja-m6-4-translate-cat",
      promptEn: "There's a cat.",
      acceptedAnswers: [
        "ねこが います",
        "ねこが います。",
        "ねこがいます",
        "neko ga imasu",
      ],
      audioText: "ねこが います",
    }),
    // ── Review tail ──
    vocabMcq("ja-m6-4-rev-mcq-1", M6_4_REVIEW[0], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-4-rev-lc",
      audioText: M6_4_REVIEW[1].kana,
      correctMeaningEn: M6_4_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_4_REVIEW[2].meaningEn,
        M6_4_REVIEW[3].meaningEn,
        M6_4_REVIEW[4].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-4-rev", M6_4_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m6-4-info-end",
      "が, unlocked (gently)",
      "X が あります/います = 'there's an X.' 90% of beginner が encounters in the wild are this pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_4.steps);

// ----- M6-5 — Interleaved に + で (rotating-answer drills) ---------------

const M6_5_REVIEW = pickReviewAtoms("ja-m6-5-rev", PRIOR_POOL, 5);

export const M6_5: LessonContent = {
  id: "ja-m6-5",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved — に + で",
  description:
    "Mixed practice. Each cloze asks: am I pointing at a destination (に), or naming a setting / means (で)?",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m6-5-info-open",
      "Sort by role",
      "The two-question filter: am I pointing at a destination / location (に), or naming where the action happens / how I'm doing it (で)? Answers rotate — no screen-pattern shortcut.",
    ),
    // Rotating clozes: に → で → に → で (max 1-2 same-answer adjacent)
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
    // production — translate a compound sentence (≥5-mora)
    translateStep({
      id: "ja-m6-5-translate-densha",
      promptEn: "I go to school by train.",
      acceptedAnswers: [
        "でんしゃで がっこうに いきます",
        "でんしゃで がっこうに いきます。",
        "でんしゃでがっこうにいきます",
        "densha de gakkou ni ikimasu",
      ],
      audioText: "でんしゃで がっこうに いきます",
    }),
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
      tiles: ["バスで", "えきに", "いきます", "がっこうに", "うちで"],
      correctOrder: ["バスで", "えきに", "いきます"],
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
    // ── Review tail ──
    vocabMcq("ja-m6-5-rev-mcq-1", M6_5_REVIEW[0], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-5-rev-lc",
      audioText: M6_5_REVIEW[1].kana,
      correctMeaningEn: M6_5_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_5_REVIEW[2].meaningEn,
        M6_5_REVIEW[3].meaningEn,
        M6_5_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m6-5-rev-mcq-2", M6_5_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m6-5-rev", M6_5_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m6-5-info-end",
      "に / で sorted",
      "Six drills, no screen-pattern shortcut. You're now parsing meaning, not position.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_5.steps);

// ----- M6-6 — Interleaved existence + locations (に / で / が ALL rotate) -

const M6_6_REVIEW = pickReviewAtoms("ja-m6-6-rev", PRIOR_POOL, 5);

export const M6_6: LessonContent = {
  id: "ja-m6-6",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved — existence + locations",
  description:
    "Six clozes drawing across が (existence) + に (location) + で (setting). Rotating answers — no screen-position shortcut.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m6-6-info-open",
      "All three particles in play",
      "Pre-rebuild this lesson was 6 が in a row — recognition of screen position, not grammar. Now the answer rotates across が / に / で and each carrier asks for actual parsing.",
    ),
    // ── ROTATING-ANSWER CLUSTER. Critical: in any 3-window, ≥2 distinct
    //    answers. Verified by assertNoSameAnswerCluster at end of module. ──
    // Answer rotation: が → に → で → が → に → が
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
    // translate break — R3 interleave + production direction between clozes
    translateStep({
      id: "ja-m6-6-translate-park-cat",
      promptEn: "There's a cat at the park.",
      acceptedAnswers: [
        "こうえんに ねこが います",
        "こうえんに ねこが います。",
        "こうえんにねこがいます",
        "kouen ni neko ga imasu",
      ],
      audioText: "こうえんに ねこが います",
    }),
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
      tiles: ["えきに", "トイレが", "あります", "コンビニが", "うちで"],
      correctOrder: ["えきに", "トイレが", "あります"],
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
    // ── Review tail ──
    vocabMcq("ja-m6-6-rev-mcq-1", M6_6_REVIEW[0], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-6-rev-lc",
      audioText: M6_6_REVIEW[1].kana,
      correctMeaningEn: M6_6_REVIEW[1].meaningEn,
      distractorsEn: [
        M6_6_REVIEW[2].meaningEn,
        M6_6_REVIEW[3].meaningEn,
        M6_6_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m6-6-rev-mcq-2", M6_6_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m6-6-rev", M6_6_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m6-6-info-end",
      "が in its friendliest form",
      "Six existence + location drills, three rotating particles. You now have 'X が あります/います' = 'there's an X' AND the location-particle filter from M6-2/3 working together.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_6.steps);

// ----- M6-7 — Production (translate + listening_build + speaking) -------

const M6_7_REVIEW = pickReviewAtoms("ja-m6-7-rev", PRIOR_POOL, 6);

export const M6_7: LessonContent = {
  id: "ja-m6-7",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — say where + how + what's there",
  description:
    "Five cumulative sentences across translate, listening_build, build, and your voice. Sentences ≥5 mora use translate + listening_build (not sentence-tile build).",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m6-7-info-open",
      "Production time",
      "Five sentences across four modes. The longer ones (5+ mora) come in as translate or listening_build — sentence-tile build is reserved for shorter assemblies where the tiles really teach.",
    ),
    // Sentence 1 (5+ mora): translate
    translateStep({
      id: "ja-m6-7-s1",
      promptEn: "I go to school by bicycle.",
      acceptedAnswers: [
        "じてんしゃで がっこうに いきます",
        "じてんしゃで がっこうに いきます。",
        "じてんしゃでがっこうにいきます",
        "jitensha de gakkou ni ikimasu",
      ],
      audioText: "じてんしゃで がっこうに いきます",
    }),
    // Sentence 2 (short, 4 tiles): build_sentence is the right fit
    build(
      "ja-m6-7-s2",
      "Ask: Is there a toilet?",
      "トイレが ありますか",
      ["トイレが", "ありますか", "ねこが", "いますか"],
      ["トイレが", "ありますか"],
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
      tiles: ["コンビニで", "はたらきます", "うちで", "べんきょうします"],
      correctOrder: ["コンビニで", "はたらきます"],
      promptEn: "Hear it, build it: 'I work at a convenience store.'",
    }),
    // Sentence 4 (5+ mora): translate (hard direction)
    translateStep({
      id: "ja-m6-7-s4",
      promptEn: "I'm at the station.",
      acceptedAnswers: [
        "えきに います",
        "えきに います。",
        "えきにいます",
        "eki ni imasu",
      ],
      audioText: "えきに います",
    }),
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
      tiles: ["うちに", "ねこが", "います", "コンビニで", "あります"],
      correctOrder: ["うちに", "ねこが", "います"],
      promptEn: "Hear it, build it: 'There's a cat at my house.'",
    }),
    // speaking — production direction on a cumulative sentence
    speaking(
      "ja-m6-7-speak-final",
      "コンビニが ありますか",
      "Is there a convenience store?",
    ),
    // ── Review tail (broadest cumulative draw across all prior modules) ──
    listeningCompSentence({
      id: "ja-m6-7-rev-lc-1",
      audioText: M6_7_REVIEW[0].kana,
      correctMeaningEn: M6_7_REVIEW[0].meaningEn,
      distractorsEn: [
        M6_7_REVIEW[1].meaningEn,
        M6_7_REVIEW[2].meaningEn,
        M6_7_REVIEW[3].meaningEn,
      ],
    }),
    vocabMcq("ja-m6-7-rev-mcq-1", M6_7_REVIEW[1], PRIOR_POOL),
    listeningCompSentence({
      id: "ja-m6-7-rev-lc-2",
      audioText: M6_7_REVIEW[2].kana,
      correctMeaningEn: M6_7_REVIEW[2].meaningEn,
      distractorsEn: [
        M6_7_REVIEW[3].meaningEn,
        M6_7_REVIEW[4].meaningEn,
        M6_7_REVIEW[5].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m6-7-rev", M6_7_REVIEW.slice(0, 6)),
    infoStep(
      "ja-m6-7-info-end",
      "Five sentences, four modes",
      "You can say where you are, where you're going, what you do there, and what's around — all in your own voice.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_7.steps);

// ----- M6-8 — Mini-dialogue (asking directions) -------------------------

const M6_8_REVIEW = pickReviewAtoms("ja-m6-8-rev", PRIOR_POOL, 5);

export const M6_8: LessonContent = {
  id: "ja-m6-8",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — asking directions",
  description:
    "Four lines, classic 'is there a … around here?' exchange. Closes with cumulative review across M1-M5 atoms.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m6-8-info-open",
      "Drop into the scene",
      "You're walking through Shibuya looking for a convenience store. You stop a stranger.",
      "culture",
    ),
    ...dialogueLesson({
      idPrefix: "ja-m6-8",
      representative: {
        phrase: "コンビニが ありますか",
        translation: "Is there a convenience store?",
      },
      lines: [
        {
          speaker: "You",
          meaningEn: "Excuse me. Is there a convenience store around here?",
          romaji: "sumimasen. konbini ga arimasu ka",
          kana: "すみません。コンビニが ありますか",
          speakingPhrase: "コンビニが ありますか",
        },
        {
          speaker: "Stranger",
          meaningEn: "Yes. There's a FamilyMart at the station.",
          romaji: "hai. eki ni FamilyMart ga arimasu",
          kana: "はい。えきに FamilyMart が あります",
          cultureNote:
            "Note the existence verb あります + に for the location point.",
        },
        {
          speaker: "You",
          meaningEn: "Is the station far?",
          romaji: "eki wa tooi desu ka",
          kana: "えきは とおいですか",
          cultureNote:
            "とおい = far (adjective exposure — same pattern as M3's あおい/あかい).",
        },
        {
          speaker: "Stranger",
          meaningEn: "No, it's close. Thank you. (you reply)",
          romaji: "iie, chikai desu. arigatou gozaimasu",
          kana: "いいえ、ちかいです。ありがとうございます",
          speakingPhrase: "ありがとうございます",
        },
      ],
    }),
    // ── Post-dialogue comprehension on a dialogue line ──
    listeningCompSentence({
      id: "ja-m6-8-lc-dialogue",
      audioText: "えきに コンビニが あります",
      correctMeaningEn: "There's a convenience store at the station.",
      distractorsEn: [
        "Is there a convenience store?",
        "I go to the station.",
        "I'm at the convenience store.",
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
    // Production tap — translate one cumulative sentence
    translateStep({
      id: "ja-m6-8-translate-final",
      promptEn: "I'm going home by bus.",
      acceptedAnswers: [
        "バスで うちに かえります",
        "バスで うちに かえります。",
        "バスでうちにかえります",
        "basu de uchi ni kaerimasu",
      ],
      audioText: "バスで うちに かえります",
    }),
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
      "Directions handled",
      "'X が ありますか' opens the conversation, location + に/で fills in the answer. You can now find anything in Japan.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M6_8.steps);

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
      tiles: ["じてんしゃで", "がっこうに", "いきます", "うちで", "コンビニに"],
      correctOrder: ["じてんしゃで", "がっこうに", "いきます"],
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
