/**
 * M7 — Verbs in motion (density rebuild 2026-05-18).
 *
 * Spencer's spec: introduces dictionary form + ます-form, plus を (direct
 * object). Reuses M3-M6 — every drill leans on は + の + に + で + が. The
 * を/に/で interleave is the natural compounding moment of the course so
 * far: verbs of motion take object (を), destination (に), AND setting (で)
 * in the same sentence.
 *
 * 2026-05-18 rebuild (per docs/m3-m7-rebuild-spec-2026-05-18.md §7 + §12):
 *   - Densified to 14-20 steps per sub-lesson (was 5-12).
 *   - ≥1 generation step (translate / listening_build / speaking) per
 *     sub-lesson; ≥5 distinct step types; no two adjacent same-type.
 *   - Compounding review ≥0.25 ratio per sub-lesson drawing from
 *     M3_M7_REVIEW_POOL (M1 + M2 + M3 + M4 + M5 + M6 anchors).
 *   - Answer-rotation guarantor on all particle_cloze runs (kills the
 *     M7-5 "を を を を を を" same-answer cluster). Mixes を with M6
 *     particles に/で/が in the drill blocks.
 *   - self_explanation_mcq on the dictionary↔ます mapping AND on the
 *     を/に/で choice (spec §7 + §12.4).
 *   - build_sentence reserved for ≤4-tile cases; ≥5-mora sentences use
 *     translateStep + listeningBuildSentence + speaking (sunset set is
 *     cleared per spec §12.5 — content shape carries the burden now).
 *   - 9-lesson ID list preserved (mockCourse.ts + 2 test files reference
 *     ja-m7-1..ja-m7-9). Per spec §12.1 the §7 "8 sub-lessons" target
 *     collapses to 8 content lessons + 1 row test = 9 IDs.
 *
 * Lesson list (9 lessons):
 *   M7-1  Verbs vocab — dictionary form (6 verbs) + retrieval
 *   M7-2  Dictionary form ↔ ます stem (Grammar Rule + match_pairs)
 *   M7-3  を (Grammar Rule) + answer-rotating drills
 *   M7-4  Food + drink vocab + listening
 *   M7-5  Drill — を rotated with に/で/が (no same-answer clusters)
 *   M7-6  Interleaved — に + で + を + が across compound sentences
 *   M7-7  Production — translate + listening_build + speaking
 *   M7-8  Mini-dialogue — at a restaurant + cumulative review
 *   M7-9  Row test (mastery ★)
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
  phrase,
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
// Per-sub-lesson review-atom draws. Pool covers M1-M6 (M7 itself excluded
// — can't review the module being authored). Each sub-lesson gets a
// distinct seed so re-mounts get stable but different subsets.
// ───────────────────────────────────────────────────────────────────────
const M7_REVIEW_POOL = M3_M7_REVIEW_POOL.filter(
  (a) => a.fromModule !== "m7",
);
const M7_REVIEW_M1 = M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1");
const M7_REVIEW_M3 = M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m3");
const M7_REVIEW_M4 = M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m4");
const M7_REVIEW_M5 = M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m5");
const M7_REVIEW_M6 = M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m6");

// ----- M7-1 — Verbs vocab (dictionary form first) ------------------------

const M7_1_REVIEW = pickReviewAtoms("ja-m7-1-rev", M7_REVIEW_M3, 4);

export const M7_1: LessonContent = {
  id: "ja-m7-1",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Verbs — dictionary form",
  description:
    "Six high-frequency verbs in their dictionary (citation) form. Pattern: short, ends in -u sound.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m7-1-info-open",
      "The citation form",
      "Every Japanese verb has a dictionary form — the form you'd look up in a dictionary. It always ends in an -u sound (たべる, のむ, いく). This is what friends use and what writers write. Memorize it first; the polite ます-form comes next lesson.",
      "grammar",
    ),
    // ── Atom intros: 6 dictionary-form verbs, each followed by retrieval. ──
    vocab(
      "ja-m7-1-v-taberu",
      "to eat (dictionary)",
      "taberu",
      "たべる",
      "Used for eating any solid food. Don't use it for drinks — those take のむ.",
    ),
    // Production direction immediately after intro (encode + retrieve).
    speaking("ja-m7-1-say-taberu", "たべる", "to eat"),
    vocab(
      "ja-m7-1-v-nomu",
      "to drink (dictionary)",
      "nomu",
      "のむ",
      "Used for any liquid — water, coffee, tea, sake. Also used for taking medicine.",
    ),
    // Listening break interrupts the phrase_card run (R3).
    listeningCompSentence({
      id: "ja-m7-1-lc-nomu",
      audioText: "のむ",
      correctMeaningEn: "to drink",
      distractorsEn: ["to eat", "to read", "to go"],
    }),
    vocab(
      "ja-m7-1-v-iku",
      "to go (dictionary)",
      "iku",
      "いく",
      "You already met いきます (polite) in M6. This is the dictionary root.",
    ),
    // Review tap on a prior-module atom (M6 place — natural pair with いく).
    vocabMcq("ja-m7-1-rev-mcq-place", M7_REVIEW_M6[0], M7_REVIEW_M6),
    vocab(
      "ja-m7-1-v-miru",
      "to see / watch (dictionary)",
      "miru",
      "みる",
      "Used for watching TV (テレビをみる), seeing a film, looking at a picture — all 'visual perception'.",
    ),
    // sentenceMcq break — pattern discrimination on the -u ending shape.
    sentenceMcq({
      id: "ja-m7-1-mcq-pattern",
      prompt: "Which one is a verb (dictionary form)?",
      correctKana: "よむ",
      distractorsKana: ["ほん", "がくせい", "アメリカ"],
      explanation:
        "Dictionary-form verbs end in an -u sound (む, る, く, ぐ, す…). The other three are nouns.",
    }),
    vocab(
      "ja-m7-1-v-yomu",
      "to read (dictionary)",
      "yomu",
      "よむ",
      "Pair with ほん (book) and しんぶん (newspaper). Same ending family as のむ.",
    ),
    // Listening break before final phrase_card.
    listeningCompSentence({
      id: "ja-m7-1-lc-yomu",
      audioText: "よむ",
      correctMeaningEn: "to read",
      distractorsEn: ["to write", "to watch", "to eat"],
    }),
    vocab(
      "ja-m7-1-v-kaku",
      "to write (dictionary)",
      "kaku",
      "かく",
      "Pair with なまえ (name) and てがみ (letter). Used for any handwriting / drawing.",
    ),
    // ── Review tail (M3 anchors) — broadest prior-module surface. ──
    vocabMcq("ja-m7-1-rev-mcq-m3-1", M7_1_REVIEW[0], M7_REVIEW_M3),
    // Listening tap on a different M3 atom — different mode + broader surface.
    listeningCompSentence({
      id: "ja-m7-1-rev-lc-m3",
      audioText: M7_1_REVIEW[1].kana,
      correctMeaningEn: M7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_1_REVIEW[2].meaningEn,
        M7_1_REVIEW[3].meaningEn,
        M7_REVIEW_M1[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m7-1-rev", M7_1_REVIEW),
    infoStep(
      "ja-m7-1-info-end",
      "Six verbs in your pocket",
      "Six dictionary verbs that cover most of daily life: eat, drink, go, watch, read, write. Next: the rule that turns each one into its polite ます-form.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_1.steps);

// ----- M7-2 — Dictionary ↔ ます stem (Grammar Rule + match) ---------------

const RULE_DICT_MASU = grammarRule({
  id: "ja-m7-2-rule-dict-masu",
  title: "Dictionary form ↔ polite ます stem",
  rule:
    "Every Japanese verb has two faces: the dictionary form (たべる, のむ, いく) and the polite ます-form (たべます, のみます, いきます). The polite form is what you use with strangers, shop staff, teachers, and at work. -る verbs (たべる, みる) drop -る and add -ます. -u verbs (のむ, よむ, かく, いく) change the final -u to -i + ます (のむ→のみます, かく→かきます).",
  examples: [
    {
      ja: "わたしは すしを たべます。",
      romaji: "watashi wa sushi wo tabemasu.",
      en: "I eat sushi. (polite)",
    },
    {
      ja: "コーヒーを のみます。",
      romaji: "koohii wo nomimasu.",
      en: "I drink coffee. (polite)",
    },
  ],
  antiPattern: {
    ja: "わたしは すしを たべる です。",
    romaji: "watashi wa sushi wo taberu desu.",
    en: "(broken — dictionary form does NOT take です)",
    why: "Dictionary form is already a full verb. Adding です creates a double-verb error. Use either たべる (casual standalone) or たべます (polite standalone) — never both.",
  },
  cultureNote:
    "Tae Kim's framing: the dictionary form is the authentic verb; ます is a polite suffix layered on top. Default to ます-form as a traveler — it's never wrong with strangers.",
});

const M7_2_REVIEW = pickReviewAtoms("ja-m7-2-rev", M7_REVIEW_M4, 4);

export const M7_2: LessonContent = {
  id: "ja-m7-2",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Dictionary form ↔ ます stem",
  description:
    "The two forms of every verb. Match each dictionary form to its polite counterpart, then drill production.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m7-2-info-open",
      "Two forms, one verb",
      "Friends use dictionary form. Strangers, shopkeepers, and teachers get the polite ます-form. Same verb, two registers.",
    ),
    RULE_DICT_MASU,
    // ── Dictionary ↔ ます match (the high-leverage mapping). ──
    {
      id: "ja-m7-2-match-dict-masu",
      type: "match_pairs",
      prompt: "Match each dictionary form to its ます-form",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "たべる", target: "たべます", sourceAnnotation: [{ surface: "たべる", reading: "たべる" }] },
        { id: "p2", source: "のむ",   target: "のみます", sourceAnnotation: [{ surface: "のむ", reading: "のむ" }] },
        { id: "p3", source: "いく",   target: "いきます", sourceAnnotation: [{ surface: "いく", reading: "いく" }] },
        { id: "p4", source: "みる",   target: "みます",   sourceAnnotation: [{ surface: "みる", reading: "みる" }] },
        { id: "p5", source: "よむ",   target: "よみます", sourceAnnotation: [{ surface: "よむ", reading: "よむ" }] },
        { id: "p6", source: "かく",   target: "かきます", sourceAnnotation: [{ surface: "かく", reading: "かく" }] },
      ],
    } as MatchPairsStep,
    // ── Self-explanation on the mapping rule the learner just used. ──
    selfExplain({
      id: "ja-m7-2-self-masu-1",
      anchorLabel: "You matched たべる → たべます",
      anchorAudioText: "たべる、たべます",
      question: "Why does たべる become たべます (not たべます or たべるます)?",
      rule: {
        text: "-る verbs drop -る and add -ます; -u verbs change -u to -i + -ます.",
      },
      surface: { text: "all verbs add -ます to the end" },
      distractor: { text: "ます means 'I do'" },
      ruleExplanation:
        "たべる is a -る verb: drop -る → たべ, add -ます → たべます. のむ is a -u verb: -u → -i, add -ます → のみます. The pattern is mechanical once you spot the verb type.",
    }),
    // ── ます-form intro: 3 polite-form phrase_cards as exposure. ──
    phrase(
      "ja-m7-2-ex-1",
      "I eat sushi. (polite)",
      "watashi wa sushi wo tabemasu",
      "わたしは すしを たべます",
      "を marks すし as the direct object — what's being eaten. Full rule next lesson.",
    ),
    // Listening break between phrase_cards (R3 interleave).
    listeningCompSentence({
      id: "ja-m7-2-lc-mizu",
      audioText: "みずを のみます",
      correctMeaningEn: "I drink water.",
      distractorsEn: [
        "I eat water.",
        "I drink coffee.",
        "I read a book.",
      ],
    }),
    phrase(
      "ja-m7-2-ex-2",
      "I read a book. (polite)",
      "watashi wa hon wo yomimasu",
      "わたしは ほんを よみます",
    ),
    // Production: translate one polite-form sentence.
    translateStep({
      id: "ja-m7-2-translate-iku",
      promptEn: "I go to the park. (polite)",
      acceptedAnswers: [
        "こうえんに いきます",
        "こうえんに いきます。",
        "こうえんにいきます",
        "watashi wa kouen ni ikimasu",
        "kouen ni ikimasu",
      ],
      audioText: "こうえんに いきます",
    }),
    // Speaking — production on the most-canonical ます-form sentence.
    speaking(
      "ja-m7-2-speak-tabe",
      "すしを たべます",
      "I eat sushi.",
    ),
    // sentenceMcq — pick the polite-form sentence (R3 alternation).
    sentenceMcq({
      id: "ja-m7-2-mcq-polite",
      prompt: "Which sentence is the polite form of 'I eat ramen.'?",
      correctKana: "ラーメンを たべます。",
      distractorsKana: [
        "ラーメンを たべる。",
        "ラーメンを たべるです。",
        "ラーメンが たべます。",
      ],
      explanation:
        "Polite form ends in -ます. たべる is the casual dictionary form; たべるです is the double-verb error from the rule card.",
    }),
    // ── Review tail (M4 anchors — possession-objects natural with verbs) ──
    vocabMcq("ja-m7-2-rev-mcq-m4", M7_2_REVIEW[0], M7_REVIEW_M4),
    // Review listening tap on a different prior-module atom (M3).
    listeningCompSentence({
      id: "ja-m7-2-rev-lc-m3",
      audioText: M7_REVIEW_M3[0].kana,
      correctMeaningEn: M7_REVIEW_M3[0].meaningEn,
      distractorsEn: [
        M7_REVIEW_M3[1].meaningEn,
        M7_REVIEW_M3[2].meaningEn,
        M7_REVIEW_M3[3].meaningEn,
      ],
    }),
    // Second vocabMcq on M4 — pushes ratio over the 0.25 spec floor.
    vocabMcq("ja-m7-2-rev-mcq-m4-2", M7_2_REVIEW[1], M7_REVIEW_M4),
    reviewMatchPairs("ja-m7-2-rev", M7_2_REVIEW),
    infoStep(
      "ja-m7-2-info-end",
      "Two registers, anchored",
      "You can now toggle every verb between casual and polite. The を particle showed up three times — that's the next card.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_2.steps);

// ----- M7-3 — を (Grammar Rule + answer-rotating drills) ------------------

const RULE_WO = grammarRule({
  id: "ja-m7-3-rule-wo",
  title: "を — the direct-object particle",
  rule:
    "を marks the thing being acted on by a transitive verb. すしを たべます = 'eat sushi.' みずを のみます = 'drink water.' ほんを よみます = 'read a book.' The verb does something TO the を-marked noun.",
  examples: [
    {
      ja: "すしを たべます。",
      romaji: "sushi wo tabemasu.",
      en: "I eat sushi.",
    },
    {
      ja: "コーヒーを のみます。",
      romaji: "koohii wo nomimasu.",
      en: "I drink coffee.",
    },
  ],
  antiPattern: {
    ja: "すしは たべます。",
    romaji: "sushi wa tabemasu.",
    en: "(odd — 'as for sushi, [someone] eats it.' Grammatical but unusual for a beginner.)",
    why: "は marks the topic, not the direct object. 'I eat sushi' standardly is わたしは すしを たべます — topic = me, direct object = sushi. Swapping は for を misframes the sentence.",
  },
  cultureNote:
    "を is written like the kana for 'wo' but pronounced 'o' (same as お). It only appears as a particle — never inside a word.",
});

const M7_3_REVIEW = pickReviewAtoms("ja-m7-3-rev", M7_REVIEW_M1, 4);

export const M7_3: LessonContent = {
  id: "ja-m7-3",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "を — the direct-object particle",
  description:
    "What's being acted on. Eat WHAT, drink WHAT, read WHAT — that WHAT takes を. Answers rotate so you can't pattern-match.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m7-3-info-open",
      "The action-target",
      "Every transitive verb (eat, drink, read, watch, write) takes a direct object. In Japanese, that object gets marked by を. The drill below mixes を with the M6 particles (は, に, で) so you can't auto-pick.",
    ),
    RULE_WO,
    // ── Rotating-answer cloze block: を → に → を → で → を → は.
    // Mixes the new を with M6 particles per spec §7. No 3+ run of same
    // answer (assertNoSameAnswerCluster gates this at bottom). ──
    cloze(
      "ja-m7-3-cloze-1",
      "すし",
      " たべます。",
      "を",
      ["を", "は", "が", "に"],
      "I eat sushi.",
      "すしを たべます。",
      "すし is the thing being eaten — を.",
    ),
    // sentenceMcq break (R3 alternation).
    sentenceMcq({
      id: "ja-m7-3-mcq-wo-place",
      prompt: "Which sentence means 'I drink coffee.'?",
      correctKana: "コーヒーを のみます。",
      distractorsKana: [
        "コーヒーは のみます。",
        "コーヒーに のみます。",
        "コーヒーで のみます。",
      ],
      explanation:
        "Direct object → を. は = topic; に = destination; で = setting/means.",
    }),
    // Switch correct to に (M6 review — destination).
    cloze(
      "ja-m7-3-cloze-2",
      "こうえん",
      " いきます。",
      "に",
      ["を", "に", "で", "は"],
      "I go to the park. (M6 reminder)",
      "こうえんに いきます。",
      "Destination → に. を would be wrong — you don't 'eat' the park.",
    ),
    // Self-explanation: WHY を (not に, not は) on a transitive verb.
    selfExplain({
      id: "ja-m7-3-self-wo-1",
      anchorLabel: "You picked を in: すし＿ たべます",
      anchorAudioText: "すしを たべます",
      question: "Why is を correct here (and not に or は)?",
      rule: {
        text: "を marks the thing the verb acts on (sushi is being eaten).",
      },
      surface: { text: "を always comes after a food word" },
      distractor: { text: "を is the question marker" },
      ruleExplanation:
        "を is the direct-object particle — it tags the noun the verb acts on. に would mark a destination (you don't eat a place); は would shift the topic ('as for sushi…').",
    }),
    // Back to を.
    cloze(
      "ja-m7-3-cloze-3",
      "みず",
      " のみます。",
      "を",
      ["を", "は", "が", "に"],
      "I drink water.",
      "みずを のみます。",
    ),
    // Switch to で (M6 review — means/setting).
    cloze(
      "ja-m7-3-cloze-4",
      "じてんしゃ",
      " いきます。",
      "で",
      ["を", "に", "で", "は"],
      "I go by bicycle. (M6 reminder)",
      "じてんしゃで いきます。",
      "じてんしゃ = means → で. Watch out: you'd use を if the verb were 'see' (じてんしゃを みます).",
    ),
    // Listening break interrupts the cloze run (R3).
    listeningCompSentence({
      id: "ja-m7-3-lc-hon",
      audioText: "ほんを よみます",
      correctMeaningEn: "I read a book.",
      distractorsEn: [
        "I write a book.",
        "I eat a book.",
        "I see a book.",
      ],
    }),
    cloze(
      "ja-m7-3-cloze-5",
      "ほん",
      " よみます。",
      "を",
      ["を", "は", "が", "の"],
      "I read a book.",
      "ほんを よみます。",
    ),
    // Production tap (translate) — generation step required per spec §4.
    translateStep({
      id: "ja-m7-3-translate-name",
      promptEn: "I write [my] name.",
      acceptedAnswers: [
        "なまえを かきます",
        "なまえを かきます。",
        "なまえをかきます",
        "namae wo kakimasu",
      ],
      audioText: "なまえを かきます",
    }),
    // ── Review tail (M1 atoms) — different seed than M7-1's M3 draw. ──
    vocabMcq("ja-m7-3-rev-mcq-m1", M7_3_REVIEW[0], M7_REVIEW_M1),
    // Review listening tap on a different M1 atom (broadens surface).
    listeningCompSentence({
      id: "ja-m7-3-rev-lc-m1",
      audioText: M7_3_REVIEW[1].kana,
      correctMeaningEn: M7_3_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_3_REVIEW[2].meaningEn,
        M7_3_REVIEW[3].meaningEn,
        M7_REVIEW_M3[0].meaningEn,
      ],
    }),
    // Second vocabMcq tap on M2 g-row atom (different prior module).
    vocabMcq(
      "ja-m7-3-rev-mcq-m2",
      M3_M7_REVIEW_POOL.find((a) => a.fromModule === "m2" && Boolean(a.emoji))!,
      M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2"),
    ),
    reviewMatchPairs("ja-m7-3-rev", M7_3_REVIEW),
    infoStep(
      "ja-m7-3-info-end",
      "を locked in (without auto-pick)",
      "Five drills, but the correct answer rotated between を, に, で. You had to think, not pattern-match. Next: a food/drink vocab pool to drill it more.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_3.steps);

// ----- M7-4 — Food + drink vocab + listening ------------------------------

const M7_4_REVIEW = pickReviewAtoms("ja-m7-4-rev", M7_REVIEW_M5, 4);

export const M7_4: LessonContent = {
  id: "ja-m7-4",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Food + drink vocab",
  description:
    "Six common foods and drinks — direct-object material for the verb drills. Three katakana sprinkles.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m7-4-info-open",
      "Things you'll eat and drink",
      "Six foods and drinks. Each pairs naturally with たべる / のむ + を. Listen for the loanwords — ラーメン, パン, ジュース are all katakana.",
    ),
    // ── 6 vocab intros, each with retrieval interleave. ──
    vocab(
      "ja-m7-4-v-sushi",
      "Sushi",
      "sushi",
      "すし",
      "Often written 寿司 in restaurants. Polite version: おすし (the お is a politeness prefix).",
    ),
    // Visual MCQ on the just-introduced vocab — encode + retrieve.
    vocabMcq(
      "ja-m7-4-mcq-sushi",
      { kana: "すし", meaningEn: "sushi", emoji: "🍣", fromModule: "m7" },
      M7_REVIEW_POOL,
    ),
    vocab(
      "ja-m7-4-v-ramen",
      "Ramen",
      "raamen",
      "ラーメン",
      "Always katakana — even though it's a Japanese dish, the word came via Chinese.",
    ),
    // Listening break (loanword phonology — ラーメン is mora-tricky).
    listeningCompSentence({
      id: "ja-m7-4-lc-ramen",
      audioText: "ラーメンを たべます",
      correctMeaningEn: "I eat ramen.",
      distractorsEn: [
        "I drink ramen.",
        "I eat bread.",
        "I eat sushi.",
      ],
    }),
    vocab(
      "ja-m7-4-v-pan",
      "Bread",
      "pan",
      "パン",
      "Loanword from Portuguese (pão), not English. One of the oldest loanwords in Japanese.",
    ),
    // Speaking — production direction on the just-introduced loanword.
    speaking("ja-m7-4-speak-pan", "パンを たべます", "I eat bread."),
    vocab("ja-m7-4-v-gohan", "Rice / a meal", "gohan", "ごはん"),
    // sentenceMcq break — pick the kana sentence that matches.
    sentenceMcq({
      id: "ja-m7-4-mcq-juice",
      prompt: "Which sentence means 'I drink juice.'?",
      correctKana: "ジュースを のみます。",
      distractorsKana: [
        "ジュースを たべます。",
        "ジュースは のみます。",
        "ジュースに のみます。",
      ],
      explanation:
        "Juice is drunk (のむ), not eaten (たべる). Direct object → を.",
    }),
    vocab(
      "ja-m7-4-v-juusu",
      "Juice",
      "juusu",
      "ジュース",
      "Loanword. Generic term for any fruit drink.",
    ),
    // Review tap on a prior-module atom (M5 — counter for ordering).
    vocabMcq("ja-m7-4-rev-mcq-m5-mid", M7_4_REVIEW[0], M7_REVIEW_M5),
    vocab(
      "ja-m7-4-v-sake",
      "Sake (rice wine)",
      "sake",
      "さけ",
      "Use おさけ for politeness in formal/restaurant settings.",
    ),
    // Production cap: translate one sentence using a fresh food word.
    translateStep({
      id: "ja-m7-4-translate-gohan",
      promptEn: "I eat a meal.",
      acceptedAnswers: [
        "ごはんを たべます",
        "ごはんを たべます。",
        "ごはんをたべます",
        "gohan wo tabemasu",
      ],
      audioText: "ごはんを たべます",
    }),
    // ── Review tail (M5 anchors — numbers/money for restaurant prep). ──
    // Second vocabMcq on a different M5 atom.
    vocabMcq("ja-m7-4-rev-mcq-m5-end", M7_4_REVIEW[1], M7_REVIEW_M5),
    // Listening tap on yet another prior-module atom (M6 place).
    listeningCompSentence({
      id: "ja-m7-4-rev-lc-m6",
      audioText: M7_REVIEW_M6[0].kana,
      correctMeaningEn: M7_REVIEW_M6[0].meaningEn,
      distractorsEn: [
        M7_REVIEW_M6[1].meaningEn,
        M7_REVIEW_M6[2].meaningEn,
        M7_REVIEW_M6[3].meaningEn,
      ],
    }),
    // Third tap on M3 — broadens cumulative surface, pushes ratio ≥0.25.
    vocabMcq("ja-m7-4-rev-mcq-m3", M7_REVIEW_M3[0], M7_REVIEW_M3),
    reviewMatchPairs("ja-m7-4-rev", M7_4_REVIEW),
    infoStep(
      "ja-m7-4-info-end",
      "Object pool loaded",
      "Six foods and drinks. Next: drill verb + を + object across the new vocab, with M6 particles still in rotation.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_4.steps);

// ----- M7-5 — Drill: を rotated with に/で/が (the critical-fix lesson) ---

const M7_5_REVIEW = pickReviewAtoms("ja-m7-5-rev", M7_REVIEW_M6, 4);

export const M7_5: LessonContent = {
  id: "ja-m7-5",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Drill — verbs + を (rotated with に/で/が)",
  description:
    "The old M7-5 had six clozes all answering を. This rebuild rotates the answer across を/に/で/が so meaning-parsing is required.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m7-5-info-open",
      "Mix it up",
      "Each cloze picks between を (direct object), に (destination/existence), で (setting/means), and が (existence subject). The answer rotates every step — you can't guess.",
    ),
    // ── Rotating-answer cloze cluster: を → に → を → で → を → が.
    // Max-2 same-answer adjacency enforced by assertNoSameAnswerCluster. ──
    cloze(
      "ja-m7-5-cloze-1",
      "ラーメン",
      " たべます。",
      "を",
      ["を", "は", "が", "に"],
      "I eat ramen.",
      "ラーメンを たべます。",
      "Direct object → を.",
    ),
    // sentenceMcq break (R3 alternation).
    sentenceMcq({
      id: "ja-m7-5-mcq-bicycle",
      prompt: "Which sentence means 'I go to school by bicycle.'?",
      correctKana: "じてんしゃで がっこうに いきます。",
      distractorsKana: [
        "じてんしゃに がっこうで いきます。",
        "じてんしゃを がっこうに いきます。",
        "じてんしゃで がっこうを いきます。",
      ],
      explanation:
        "じてんしゃ = means → で. がっこう = destination → に. Two particles, two roles.",
    }),
    // Switch to に (destination).
    cloze(
      "ja-m7-5-cloze-2",
      "うち",
      " いきます。",
      "に",
      ["を", "に", "で", "は"],
      "I go home.",
      "うちに いきます。",
      "Destination → に. You're not 'eating' home.",
    ),
    // Self-explanation: a learner who just picked に gets challenged on WHY.
    selfExplain({
      id: "ja-m7-5-self-ni-wo",
      anchorLabel: "You picked に in: うち＿ いきます (I go home)",
      anchorAudioText: "うちに いきます",
      question: "Why is に correct (and not を)?",
      rule: {
        text: "に marks a destination. いく moves you toward the noun — it doesn't act on it.",
      },
      surface: { text: "に always comes after a place word" },
      distractor: { text: "に is the question marker" },
      ruleExplanation:
        "いく is a motion verb, not a transitive one — it doesn't have a 'thing being acted on'. The place you go TO is marked with に. を would be wrong: you don't 'do' home.",
    }),
    // Back to を on the same verb-form vocab.
    cloze(
      "ja-m7-5-cloze-3",
      "ともだちの ほん",
      " よみます。",
      "を",
      ["を", "は", "が", "の"],
      "I read my friend's book.",
      "ともだちの ほんを よみます。",
      "Combines の (possession) + を (direct object). Two M-blocks in one sentence.",
    ),
    // Listening break (R3) before next cloze.
    listeningCompSentence({
      id: "ja-m7-5-lc-uchi-tabe",
      audioText: "うちで ごはんを たべます",
      correctMeaningEn: "I eat a meal at home.",
      distractorsEn: [
        "I go to a meal at home.",
        "I drink a meal at home.",
        "I read a meal at home.",
      ],
    }),
    // Switch to で (setting).
    cloze(
      "ja-m7-5-cloze-4",
      "うち",
      " ごはんを たべます。",
      "で",
      ["を", "に", "で", "は"],
      "I eat a meal at home.",
      "うちで ごはんを たべます。",
      "うち = setting → で. ごはん = direct object → を. Two particles, two roles.",
    ),
    // Back to を.
    cloze(
      "ja-m7-5-cloze-5",
      "テレビ",
      " みます。",
      "を",
      ["を", "は", "が", "に"],
      "I watch TV.",
      "テレビを みます。",
      "テレビ is what's being watched → を. (Loanword sprinkle: テレビ = television.)",
    ),
    // Translate break (R3) — production direction.
    translateStep({
      id: "ja-m7-5-translate-kafe",
      promptEn: "I drink coffee at a café.",
      acceptedAnswers: [
        "カフェで コーヒーを のみます",
        "カフェで コーヒーを のみます。",
        "カフェでコーヒーをのみます",
        "kafe de koohii wo nomimasu",
      ],
      audioText: "カフェで コーヒーを のみます",
    }),
    // Switch to が (M6 existence pattern — natural compounding).
    cloze(
      "ja-m7-5-cloze-6",
      "えきに ともだち",
      " います。",
      "が",
      ["が", "を", "で", "は"],
      "My friend is at the station.",
      "えきに ともだちが います。",
      "Existence (います) + subject of existence → が. Reuse from M6.",
    ),
    // ── Review tail (M6 places + a second-module tap). ──
    vocabMcq("ja-m7-5-rev-mcq-m6", M7_5_REVIEW[0], M7_REVIEW_M6),
    // Second tap on a different prior module (M3 — broader cumulative surface).
    listeningCompSentence({
      id: "ja-m7-5-rev-lc-m3",
      audioText: M7_REVIEW_M3[1].kana,
      correctMeaningEn: M7_REVIEW_M3[1].meaningEn,
      distractorsEn: [
        M7_REVIEW_M3[2].meaningEn,
        M7_REVIEW_M3[3].meaningEn,
        M7_REVIEW_M3[4].meaningEn,
      ],
    }),
    // Third tap on M4 — keeps the cumulative-review ratio over 0.25.
    vocabMcq("ja-m7-5-rev-mcq-m4", M7_REVIEW_M4[0], M7_REVIEW_M4),
    reviewMatchPairs("ja-m7-5-rev", M7_5_REVIEW),
    infoStep(
      "ja-m7-5-info-end",
      "Four particles, one drill",
      "You sorted を vs に vs で vs が across six sentences and still got the right answer. That's the four-particle skeleton of beginner Japanese — every sentence from here uses some combination.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_5.steps);

// ----- M7-6 — Compound interleave (に + で + を + が in same sentences) ----

const M7_6_REVIEW = pickReviewAtoms("ja-m7-6-rev", M7_REVIEW_POOL, 5);

export const M7_6: LessonContent = {
  id: "ja-m7-6",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Compound sentences — multiple particles",
  description:
    "Two-particle sentences. Where + what + verb. The natural endpoint of M3-M7 grammar.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m7-6-info-open",
      "Two particles in one sentence",
      "Most real Japanese sentences use multiple particles. うちで ごはんを たべます (eat a meal at home) uses で AND を. The drill below puts BOTH blanks in each sentence — pick both correctly.",
    ),
    // ── Two-blank clozes (each tests one particle but the carrier sentence
    //    contains the other particle already filled — meaning-parsing is
    //    forced). Answer rotation: で → を → に → を → で → を. ──
    cloze(
      "ja-m7-6-cloze-1",
      "レストラン",
      " すしを たべます。",
      "で",
      ["を", "に", "で", "は"],
      "I eat sushi at a restaurant.",
      "レストランで すしを たべます。",
      "レストラン = setting → で. すし already has を.",
    ),
    // sentenceMcq break (R3 alternation).
    sentenceMcq({
      id: "ja-m7-6-mcq-watashi-pen",
      prompt: "Which sentence means 'I write my name with a pen.'?",
      correctKana: "ペンで なまえを かきます。",
      distractorsKana: [
        "ペンに なまえを かきます。",
        "ペンを なまえで かきます。",
        "ペンで なまえに かきます。",
      ],
      explanation:
        "ペン = means → で. なまえ = direct object → を. Same two-particle structure.",
    }),
    cloze(
      "ja-m7-6-cloze-2",
      "うちで ごはん",
      " たべます。",
      "を",
      ["を", "に", "で", "は"],
      "I eat a meal at home.",
      "うちで ごはんを たべます。",
      "ごはん is what's being eaten → を. うち already has で.",
    ),
    // Self-explanation: a learner who picked を gets a deeper rule check.
    selfExplain({
      id: "ja-m7-6-self-compound",
      anchorLabel: "You picked を + で in: うちで ごはんを たべます",
      anchorAudioText: "うちで ごはんを たべます",
      question: "Why does this sentence need BOTH で and を?",
      rule: {
        text: "で marks the setting (where the action happens); を marks the thing acted on. The verb たべる needs both — a place AND an object.",
      },
      surface: { text: "Japanese sentences always use two particles" },
      distractor: { text: "で and を mean the same thing" },
      ruleExplanation:
        "で and を play different roles: で = the SETTING of the action; を = the THING being acted on. Verbs like たべる, よむ, かく, のむ are transitive — they need an object (を) AND can have a setting (で). Both particles co-occur naturally.",
    }),
    cloze(
      "ja-m7-6-cloze-3",
      "じてんしゃで がっこう",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to school by bicycle.",
      "じてんしゃで がっこうに いきます。",
      "がっこう = destination → に. じてんしゃ already has で (means).",
    ),
    // Listening break (R3) before next cloze.
    listeningCompSentence({
      id: "ja-m7-6-lc-konbini",
      audioText: "コンビニで ジュースを のみます",
      correctMeaningEn: "I drink juice at the convenience store.",
      distractorsEn: [
        "I drink juice at home.",
        "I eat ramen at the convenience store.",
        "I go to the convenience store for juice.",
      ],
    }),
    cloze(
      "ja-m7-6-cloze-4",
      "カフェで コーヒー",
      " のみます。",
      "を",
      ["を", "に", "で", "は"],
      "I drink coffee at a café.",
      "カフェで コーヒーを のみます。",
      "コーヒー is what's being drunk → を.",
    ),
    // Production tap — translate the most-complex sentence.
    translateStep({
      id: "ja-m7-6-translate-friend-park",
      promptEn: "I eat a meal with my friend at the park.",
      acceptedAnswers: [
        "ともだちと こうえんで ごはんを たべます",
        "こうえんで ともだちと ごはんを たべます",
        "こうえんで ごはんを たべます",
        "tomodachi to kouen de gohan wo tabemasu",
      ],
      audioText: "こうえんで ごはんを たべます",
    }),
    // Switch back to で.
    cloze(
      "ja-m7-6-cloze-5",
      "こうえん",
      " ともだちが います。",
      "に",
      ["に", "で", "を", "は"],
      "My friend is at the park.",
      "こうえんに ともだちが います。",
      "Existence (います) + place point → に (not で). が marks the existence-subject.",
    ),
    // Speaking — production cap.
    speaking(
      "ja-m7-6-speak-compound",
      "うちで ごはんを たべます",
      "I eat a meal at home.",
    ),
    // ── Review tail (broadest — M1-M6 cumulative). ──
    vocabMcq("ja-m7-6-rev-mcq-cum", M7_6_REVIEW[0], M7_REVIEW_POOL),
    // Listening tap on a second cumulative atom (broadest surface).
    listeningCompSentence({
      id: "ja-m7-6-rev-lc-cum",
      audioText: M7_6_REVIEW[1].kana,
      correctMeaningEn: M7_6_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_6_REVIEW[2].meaningEn,
        M7_6_REVIEW[3].meaningEn,
        M7_6_REVIEW[4].meaningEn,
      ],
    }),
    // Second vocabMcq on a different cumulative atom — pushes ratio ≥0.25.
    vocabMcq("ja-m7-6-rev-mcq-cum-2", M7_6_REVIEW[2], M7_REVIEW_POOL),
    reviewMatchPairs("ja-m7-6-rev", M7_6_REVIEW),
    infoStep(
      "ja-m7-6-info-end",
      "Compound fluency",
      "Five compound sentences — each with two particles in distinct roles. This is the most expressive Japanese you've produced. Next: production-only with no multiple choice.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_6.steps);

// ----- M7-7 — Production heavy (translate + listening_build + speaking) ---

const M7_7_REVIEW = pickReviewAtoms("ja-m7-7-rev", M7_REVIEW_POOL, 5);

export const M7_7: LessonContent = {
  id: "ja-m7-7",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — actions in the world",
  description:
    "No multiple choice. Translate, hear-and-build, and speak. Five sentences across three production modes.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m7-7-info-open",
      "Show your work",
      "Five sentences, no MCQ. Type the answer, assemble from audio, or say it out loud. This is the production endpoint of M3-M7.",
    ),
    // ── Sentence 1: build_sentence (4-tile — within the spec §4 ≤4-mora
    //    carve-out for build_sentence; "こうえんに いきます" is 2 tiles +
    //    2 distractors, total 4 tile pool). ──
    build(
      "ja-m7-7-s1",
      "Say: I go to the park.",
      "こうえんに いきます",
      ["こうえんに", "いきます", "うちに", "がっこうで"],
      ["こうえんに", "いきます"],
    ),
    // Speaking on the just-built sentence (Bjork retrieval difficulty).
    speaking(
      "ja-m7-7-speak-s1",
      "こうえんに いきます",
      "I go to the park.",
    ),
    // ── Sentence 2: translateStep — 5-mora compound (was build_sentence
    //    before; spec §4 + §12.5 says use translate for ≥5-tile sentences). ──
    translateStep({
      id: "ja-m7-7-translate-s2",
      promptEn: "I eat sushi.",
      acceptedAnswers: [
        "わたしは すしを たべます",
        "わたしは すしを たべます。",
        "すしを たべます",
        "watashi wa sushi wo tabemasu",
        "sushi wo tabemasu",
      ],
      audioText: "わたしは すしを たべます",
    }),
    // ── Sentence 3: listeningBuildSentence — hear it, assemble it. ──
    listeningBuildSentence({
      id: "ja-m7-7-lb-s3",
      target: "うちで ごはんを たべます",
      tiles: ["うちで", "ごはんを", "たべます", "うちに", "のみます"],
      correctOrder: ["うちで", "ごはんを", "たべます"],
      promptEn: "Hear it, build it: 'I eat a meal at home.'",
    }),
    // sentenceMcq retrieval check on a fourth sentence (variety break).
    sentenceMcq({
      id: "ja-m7-7-mcq-friend",
      prompt: "Which sentence means 'I read my friend's book.'?",
      correctKana: "ともだちの ほんを よみます。",
      distractorsKana: [
        "ともだちは ほんの よみます。",
        "ともだちに ほんを よみます。",
        "ともだちで ほんを よみます。",
      ],
      explanation:
        "の = possession (friend's book). を = direct object (the book is being read).",
    }),
    // ── Sentence 4: translate, longer. ──
    translateStep({
      id: "ja-m7-7-translate-s4",
      promptEn: "I drink coffee at a café.",
      acceptedAnswers: [
        "カフェで コーヒーを のみます",
        "カフェで コーヒーを のみます。",
        "カフェでコーヒーをのみます",
        "kafe de koohii wo nomimasu",
      ],
      audioText: "カフェで コーヒーを のみます",
    }),
    // Listening break (R3).
    listeningCompSentence({
      id: "ja-m7-7-lc-yomu",
      audioText: "ともだちの ほんを よみます",
      correctMeaningEn: "I read my friend's book.",
      distractorsEn: [
        "I read a book to my friend.",
        "I write my friend's book.",
        "My friend reads a book.",
      ],
    }),
    // ── Sentence 5: listeningBuildSentence + speaking, the hardest pair. ──
    listeningBuildSentence({
      id: "ja-m7-7-lb-s5",
      target: "じてんしゃで がっこうに いきます",
      tiles: ["じてんしゃで", "がっこうに", "いきます", "じてんしゃに", "がっこうで", "たべます"],
      correctOrder: ["じてんしゃで", "がっこうに", "いきます"],
      promptEn: "Hear it, build it: 'I go to school by bicycle.'",
    }),
    speaking(
      "ja-m7-7-speak-s5",
      "じてんしゃで がっこうに いきます",
      "I go to school by bicycle.",
    ),
    // ── Review tail (cumulative — broadest set). ──
    vocabMcq("ja-m7-7-rev-mcq-cum", M7_7_REVIEW[0], M7_REVIEW_POOL),
    // Review listening tap on a different cumulative atom.
    listeningCompSentence({
      id: "ja-m7-7-rev-lc-cum",
      audioText: M7_7_REVIEW[1].kana,
      correctMeaningEn: M7_7_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_7_REVIEW[2].meaningEn,
        M7_7_REVIEW[3].meaningEn,
        M7_7_REVIEW[4].meaningEn,
      ],
    }),
    // Second vocabMcq on a different cumulative atom (broader review).
    vocabMcq("ja-m7-7-rev-mcq-cum-2", M7_7_REVIEW[2], M7_REVIEW_POOL),
    reviewMatchPairs("ja-m7-7-rev", M7_7_REVIEW),
    infoStep(
      "ja-m7-7-info-end",
      "Five real actions, produced",
      "Five sentences, three production modes — typed, audio-assembled, spoken. You can now describe motion, setting, and direct objects across the M3-M7 toolkit.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_7.steps);

// ----- M7-8 — Mini-dialogue at a restaurant + cumulative review -----------

const M7_8_REVIEW = pickReviewAtoms("ja-m7-8-rev", M7_REVIEW_POOL, 6);

export const M7_8: LessonContent = {
  id: "ja-m7-8",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — at a restaurant",
  description:
    "Order food and drinks. Verbs + を + numbers + ください all in play. Closes with cumulative M1-M6 review.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m7-8-info-open",
      "Drop into the scene",
      "You sit down at a Tokyo ramen shop with a friend. Staff brings water; you order; you confirm the bill. Every grammar piece is something you've met.",
      "culture",
    ),
    ...dialogueLesson({
      idPrefix: "ja-m7-8",
      representative: {
        phrase: "ラーメンを ふたつ ください",
        translation: "Two ramen, please.",
      },
      lines: [
        {
          speaker: "Staff",
          meaningEn: "Welcome. How many?",
          romaji: "irasshaimase. nan-mei sama desu ka",
          kana: "いらっしゃいませ。なんめいさまですか",
          cultureNote: "なんめいさま = polite form of 'how many people.' Standard restaurant greeting.",
        },
        {
          speaker: "You",
          meaningEn: "Two people, please.",
          romaji: "futari desu",
          kana: "ふたりです",
          speakingPhrase: "ふたりです",
        },
        {
          speaker: "Staff",
          meaningEn: "What would you like?",
          romaji: "go-chuumon wa",
          kana: "ごちゅうもんは？",
          cultureNote: "ちゅうもん = order. ご- prefix is the respectful version.",
        },
        {
          speaker: "You",
          meaningEn: "Two ramen and one juice, please.",
          romaji: "raamen wo futatsu to juusu wo hitotsu kudasai",
          kana: "ラーメンを ふたつ と ジュースを ひとつ ください",
          cultureNote: "と (to) connects two items in a list — 'ramen AND juice.'",
          speakingPhrase: "ラーメンを ふたつ ください",
        },
        {
          speaker: "Staff",
          meaningEn: "Understood.",
          romaji: "kashikomarimashita",
          kana: "かしこまりました",
          cultureNote: "Restaurant/shop-service way of saying 'understood.' Don't reply — just nod.",
        },
      ],
    }),
    // ── Post-dialogue comprehension check on a dialogue line. ──
    listeningCompSentence({
      id: "ja-m7-8-lc-order",
      audioText: "ラーメンを ふたつ ください",
      correctMeaningEn: "Two ramen, please.",
      distractorsEn: [
        "One ramen, please.",
        "Two juices, please.",
        "I eat ramen.",
      ],
    }),
    // ── Cumulative cloze — answers rotate (を → に → を). ──
    cloze(
      "ja-m7-8-cloze-1",
      "ジュース",
      " ください。",
      "を",
      ["を", "は", "が", "に"],
      "Juice, please.",
      "ジュースを ください。",
      "ください takes を for the requested item.",
    ),
    // sentenceMcq break (R3).
    sentenceMcq({
      id: "ja-m7-8-mcq-direction",
      prompt: "Which sentence means 'I go to the convenience store.'?",
      correctKana: "コンビニに いきます。",
      distractorsKana: [
        "コンビニで いきます。",
        "コンビニを いきます。",
        "コンビニは いきます。",
      ],
      explanation:
        "コンビニ = destination → に (M6 carry-through).",
    }),
    cloze(
      "ja-m7-8-cloze-2",
      "レストラン",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to a restaurant.",
      "レストランに いきます。",
      "Destination → に. Not で (you're not eating yet) and not を.",
    ),
    // Production tap — translate one cumulative sentence.
    translateStep({
      id: "ja-m7-8-translate-final",
      promptEn: "I drink water.",
      acceptedAnswers: [
        "みずを のみます",
        "みずを のみます。",
        "みずをのみます",
        "mizu wo nomimasu",
      ],
      audioText: "みずを のみます",
    }),
    cloze(
      "ja-m7-8-cloze-3",
      "コーヒー",
      " ください。",
      "を",
      ["を", "は", "が", "に"],
      "Coffee, please.",
      "コーヒーを ください。",
    ),
    // ── Cumulative review tail (broadest — M1-M6). ──
    vocabMcq("ja-m7-8-rev-mcq-cum-1", M7_8_REVIEW[0], M7_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m7-8-rev-lc-cum",
      audioText: M7_8_REVIEW[1].kana,
      correctMeaningEn: M7_8_REVIEW[1].meaningEn,
      distractorsEn: [
        M7_8_REVIEW[2].meaningEn,
        M7_8_REVIEW[3].meaningEn,
        M7_8_REVIEW[4].meaningEn,
      ],
    }),
    // Second vocabMcq on a different cumulative atom.
    vocabMcq("ja-m7-8-rev-mcq-cum-2", M7_8_REVIEW[5], M7_REVIEW_POOL),
    // Third tap on M2 g-row — broadens cumulative surface, pushes ratio ≥0.25.
    listeningCompSentence({
      id: "ja-m7-8-rev-lc-m2",
      audioText: M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2")[0].kana,
      correctMeaningEn: M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2")[0].meaningEn,
      distractorsEn: [
        M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2")[1].meaningEn,
        M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2")[2].meaningEn,
        M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2")[3].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m7-8-rev", M7_8_REVIEW),
    infoStep(
      "ja-m7-8-info-end",
      "Restaurant Japanese — handled",
      "Full transaction in Japanese — greet, order, confirm. M3-M7 grammar synthesized into a real exchange. Next: the mastery test.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_8.steps);

// ----- M7-9 — Row test (mastery ★) ----------------------------------------
// PRESERVED. The row test gates module completion; ja-m3-m7-coverage +
// grammar-rule + mockCourse tests reference ja-m7-9 by id. Items expanded
// for cumulative coverage of the dense sub-lessons.

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

const M7_TEST_ITEMS: RowTestItem[] = [
  {
    kind: "mc",
    payload: particleMc(
      "ja-m7-9-mc-1",
      "すし___ たべます。 (I eat sushi.)",
      "すしを たべます",
      "を",
      ["は", "が", "に"],
      "Direct object — を marks what's being acted on.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m7-9-mc-2",
      "みず___ のみます。 (I drink water.)",
      "みずを のみます",
      "を",
      ["は", "が", "に"],
      "Direct object → を.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m7-9-mc-3",
      "うち___ ごはんを たべます。 (I eat a meal at home.)",
      "うちで ごはんを たべます",
      "で",
      ["に", "は", "を"],
      "Action setting → で.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m7-9-mc-4",
      "こうえん___ いきます。 (I go to the park.)",
      "こうえんに いきます",
      "に",
      ["で", "は", "を"],
      "Destination → に. Reuse from M6.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m7-9-mc-5",
      "ほん___ よみます。 (I read a book.)",
      "ほんを よみます",
      "を",
      ["は", "が", "に"],
      "Direct object → を.",
    ),
  },
  {
    kind: "match",
    payload: {
      id: "ja-m7-9-match-verbs",
      type: "match_pairs",
      prompt: "Match each verb to its meaning",
      pairs: [
        { id: "p1", source: "たべます", target: "eat", sourceAnnotation: [{ surface: "たべます", reading: "たべます" }] },
        { id: "p2", source: "のみます", target: "drink", sourceAnnotation: [{ surface: "のみます", reading: "のみます" }] },
        { id: "p3", source: "いきます", target: "go", sourceAnnotation: [{ surface: "いきます", reading: "いきます" }] },
        { id: "p4", source: "みます", target: "see / watch", sourceAnnotation: [{ surface: "みます", reading: "みます" }] },
        { id: "p5", source: "よみます", target: "read", sourceAnnotation: [{ surface: "よみます", reading: "よみます" }] },
        { id: "p6", source: "かきます", target: "write", sourceAnnotation: [{ surface: "かきます", reading: "かきます" }] },
      ],
    } as MatchPairsStep,
  },
  {
    kind: "build",
    payload: {
      id: "ja-m7-9-build",
      type: "build_sentence",
      prompt: "Say: I eat a meal at home.",
      targetSentence: "うちで ごはんを たべます",
      tiles: ["うちで", "ごはんを", "たべます", "うちに", "のみます"],
      correctOrder: ["うちで", "ごはんを", "たべます"],
      granularity: "word",
      audioKey: "うちで ごはんを たべます",
      targetAnnotation: [{ surface: "うちで ごはんを たべます", reading: "うちで ごはんを たべます" }],
    } as BuildSentenceStep,
  },
];

const M7_ROW_TEST: RowTestStep = {
  id: "ja-m7-9-test",
  type: "row_test",
  rowId: "m7",
  items: M7_TEST_ITEMS,
  passThreshold: 0.7,
  maxRetries: 3,
};

export const M7_9: LessonContent = {
  id: "ja-m7-9",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "M7 Mastery Test",
  description:
    "Cumulative test on verbs + を + interleaving with all prior particles.",
  estimatedMinutes: 8,
  xpReward: 35,
  steps: [
    infoStep(
      "ja-m7-9-info-open",
      "Module 7 mastery",
      "Cumulative items across verbs, the を particle, and all prior-module particles. Wrong answers re-queue. Pass once and Module 7 is mastered.",
    ),
    M7_ROW_TEST,
    infoStep(
      "ja-m7-9-info-end",
      "Module 7 complete",
      "You can now describe actions in the world: who eats what, where you go, what you read, how you got there. That's real productive Japanese.",
      "win",
    ),
  ],
};
