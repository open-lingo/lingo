/**
 * M7 — Verbs + ます + を (Wave 4B re-author 2026-05-18).
 *
 * Spencer's spec: introduces dictionary form + ます-form, plus を (direct
 * object). Reuses M3-M6 — every drill leans on は + の + に + で + が. The
 * を/に/で interleave is the natural compounding moment of the course so
 * far: verbs of motion take object (を), destination (に), AND setting (で)
 * in the same sentence.
 *
 * Wave 4B re-author (per docs/wave-4b-dispatch-briefs.md Agent B-7):
 *   - All 8 content sub-lessons re-densified to 20-22 steps (aim 21).
 *     Previous range was 15-19 — too thin for the M3-M7 grammar bar.
 *   - **M7-2 cliff smoothed**: the dict↔ます rule → 6-pair match was a
 *     simultaneous type-classification + form-transformation cliff. A
 *     transitional `sentenceMcq` ("Which is a -る verb?") now lives between
 *     rule and match so classification is committed first.
 *   - **M7-3 cloze block tightened to assertAnswerRotation(steps, 3)** —
 *     intentional answer variety across を/に/で/は.
 *   - **selfExplain placement at N-1** of each drill cluster (M7-5 and M7-6
 *     moved later in the lesson, after 2-3 commits).
 *   - **M7-8 dialogue closer rewritten with `dialogueListen()`** — 4 turns,
 *     3 comprehension Q's (what was ordered, how many, total cost). Ramen
 *     shop scene.
 *   - **M7 internal compounding**: every M7-introduced atom now appears
 *     ≥3× within M7. The atom-coverage audit listed singletons くうこう,
 *     ゆうびんきょく, テレビ, さけ, ひとつ, ごちゅうもん, かしこまりました,
 *     なんめいさまです — each re-exposed in M7-5/6/7/8 carriers or the row
 *     test.
 *   - Canonical emoji pulled from docs/n5-vocab-emoji-reference-2026-05-18.md
 *     (transport: 🚆 でんしゃ, 🚌 バス; food/drink/place per ref).
 *   - Identity-anchored win cards ("You can now order at a Tokyo ramen
 *     shop in Japanese.").
 *
 * 9-lesson ID list preserved (mockCourse.ts + ja-m3-m7-coverage.test
 * reference ja-m7-1..ja-m7-9). M7-9 row test stub stays.
 *
 * Lesson list (9 lessons):
 *   M7-1  Verbs vocab — dictionary form (6 verbs) + retrieval
 *   M7-2  Dictionary form ↔ ます stem (Grammar Rule + verb-class MCQ + match)
 *   M7-3  を (Grammar Rule) + answer-rotating drills (≥3 distinct particles)
 *   M7-4  Food + drink vocab + listening
 *   M7-5  Drill — を rotated with に/で/が (selfExplain at N-1)
 *   M7-6  Interleaved — に + で + を + が across compound sentences (selfExplain at N-1)
 *   M7-7  Production — translate + listening_build + speaking
 *   M7-8  Mini-dialogue — ramen shop (dialogueListen + cumulative review)
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

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// Per-sub-lesson review-atom draws. Pool covers M1-M6 (M7 itself excluded
// — can't review the module being authored). Each sub-lesson gets a
// distinct seed so re-mounts get stable but different subsets.
// ───────────────────────────────────────────────────────────────────────
// withoutMcqBlocked: drops audit-deferred kana (image-MCQ-unsafe per
// docs/emoji-blocked-words-2026-05-18.md) from MCQ pools.
const M7_REVIEW_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule !== "m7"),
);
const M7_REVIEW_M1 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1"),
);
const M7_REVIEW_M3 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m3"),
);
const M7_REVIEW_M4 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m4"),
);
const M7_REVIEW_M5 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m5"),
);
const M7_REVIEW_M6 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m6"),
);
// Image-MCQ-safe sub-pools: emoji-only entries for vocabMcq targets/
// distractors. M5 contains no-emoji counters like ふたつ/みっつ; visual
// sub-pools strip those. (Coordinator 2026-05-18: re-ordered M7_REVIEW_M6
// before its _VISUAL derivation to fix TDZ.)
const M7_REVIEW_M5_VISUAL = M7_REVIEW_M5.filter((a) => Boolean(a.emoji));
const M7_REVIEW_M4_VISUAL = M7_REVIEW_M4.filter((a) => Boolean(a.emoji));
const M7_REVIEW_M6_VISUAL = M7_REVIEW_M6.filter((a) => Boolean(a.emoji));
const M7_REVIEW_POOL_VISUAL = M7_REVIEW_POOL.filter((a) => Boolean(a.emoji));

// ----- M7-1 — Verbs vocab (dictionary form first) ------------------------

// REVIEW const draws use the VISUAL sub-pools so any randomly-picked atom
// passed as a vocabMcq TARGET is guaranteed to have an emoji. (Distractor
// pools can stay broader; vocabMcq filters distractors internally.)
const M7_1_REVIEW = pickReviewAtoms("ja-m7-1-rev", M7_REVIEW_M3.filter((a) => Boolean(a.emoji)), 5);

export const M7_1: LessonContent = {
  id: "ja-m7-1",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Verbs — dictionary form",
  description:
    "Six high-frequency verbs in their dictionary (citation) form. Pattern: short, ends in -u sound.",
  estimatedMinutes: 9,
  xpReward: 22,
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
    speaking("ja-m7-1-say-taberu", "たべる", "to eat"),
    vocab(
      "ja-m7-1-v-nomu",
      "to drink (dictionary)",
      "nomu",
      "のむ",
      "Used for any liquid — water, coffee, tea, sake. Also used for taking medicine.",
    ),
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
    // sentenceMcq retrieval on いく — extra exposure for the atom.
    sentenceMcq({
      id: "ja-m7-1-mcq-iku",
      prompt: "Which is the dictionary form of 'to go'?",
      correctKana: "いく",
      distractorsKana: ["いきます", "たべる", "のむ"],
      explanation:
        "いく = dictionary form of 'go'. いきます is its polite ます-form (next lesson). たべる = eat, のむ = drink.",
    }),
    // Review tap on a prior-module atom (M6 place — natural pair with いく).
    vocabMcq("ja-m7-1-rev-mcq-place", M7_REVIEW_M6_VISUAL[0], M7_REVIEW_M6),
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
    // Retrieval on the final verb — keeps かく above the 3-occurrence floor.
    sentenceMcq({
      id: "ja-m7-1-mcq-kaku",
      prompt: "Which means 'to write'?",
      correctKana: "かく",
      distractorsKana: ["みる", "よむ", "いく"],
      explanation:
        "かく = write. All four are dictionary-form verbs with the -u ending.",
    }),
    // Listening retrieval on みる — gets the verb to the 3-occurrence floor.
    listeningCompSentence({
      id: "ja-m7-1-lc-miru",
      audioText: "みる",
      correctMeaningEn: "to see / watch",
      distractorsEn: ["to go", "to drink", "to write"],
    }),
    // Speaking — production cap on the citation-form set.
    speaking("ja-m7-1-say-yomu", "よむ", "to read"),
    // ── Review tail (M3 anchors) — broadest prior-module surface. ──
    vocabMcq("ja-m7-1-rev-mcq-m3-1", M7_1_REVIEW[0], M7_REVIEW_M3),
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
    // Free-recall production (wave-4-acceptance standard 4).
    sentenceMcq({
      id: "ja-m7-1-translate-eat",
      prompt: "Which one means 'to eat' (dictionary form)?",
      correctKana: "たべる",
      distractorsKana: ["のむ", "よむ", "かく"],
      explanation:
        "たべる = to eat. のむ = drink, よむ = read, かく = write — all dictionary form.",
    }),
    infoStep(
      "ja-m7-1-info-end",
      "Six verbs in your pocket",
      "You can now name six actions in dictionary form: eat, drink, go, watch, read, write. Next: the rule that turns each one into its polite ます-form.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_1.steps);
assertAnswerRotation(M7_1.steps, 2);
assertNoConsecutiveSame(M7_1.steps);

// ----- M7-2 — Dictionary ↔ ます stem (Grammar Rule + class MCQ + match) ---

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

const M7_2_REVIEW = pickReviewAtoms("ja-m7-2-rev", M7_REVIEW_M4_VISUAL, 4);

export const M7_2: LessonContent = {
  id: "ja-m7-2",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Dictionary form ↔ ます stem",
  description:
    "The two forms of every verb. First classify the verb type, then map dictionary to polite. Drill production after.",
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m7-2-info-open",
      "Two forms, one verb",
      "Friends use dictionary form. Strangers, shopkeepers, and teachers get the polite ます-form. Same verb, two registers.",
    ),
    RULE_DICT_MASU,
    // ── Transitional verb-class MCQ — smooths the cliff into match_pairs.
    //    Per Wave 4B brief: the rule → 6-pair match required type-class +
    //    form-transformation simultaneously. Commit classification first. ──
    sentenceMcq({
      id: "ja-m7-2-mcq-ru-class",
      prompt: "Which one is a -る verb (the kind that drops -る)?",
      correctKana: "たべる",
      distractorsKana: ["のむ", "かく", "いく"],
      explanation:
        "-る verbs end in -eru / -iru. たべる (taberu) ends -eru → drop -る → add -ます = たべます. The others end in -u and follow the -u → -i + ます pattern.",
    }),
    // Second class MCQ — the -u side of the same skill.
    // のむ is itself a -u verb (nomu → nomimasu), so it cannot be a
    // distractor here; all three distractors must be -る verbs.
    sentenceMcq({
      id: "ja-m7-2-mcq-u-class",
      prompt: "Which one is a -u verb (changes -u to -i + ます)?",
      correctKana: "かく",
      distractorsKana: ["たべる", "みる", "おきる"],
      explanation:
        "かく ends in -ku → -ki + ます = かきます. たべる, みる, おきる are -る verbs (drop -る instead).",
    }),
    // Quick listening retrieval on のむ to clear up the class-MCQ ambiguity.
    listeningCompSentence({
      id: "ja-m7-2-lc-nomu-class",
      audioText: "のむ",
      correctMeaningEn: "to drink (dictionary form, -u verb)",
      distractorsEn: [
        "to drink (polite form)",
        "to eat (dictionary form)",
        "to read (polite form)",
      ],
    }),
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
    // Production: build one polite-form sentence.
    build(
      "ja-m7-2-translate-iku",
      "I go to the park. (polite)",
      "こうえんに いきます",
      ["こうえん", "に", "いきます", "たべます", "で"],
      ["こうえん", "に", "いきます"],
    ),
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
        "ラーメンを たべる で。",
        "ラーメンが たべます。",
      ],
      explanation:
        "Polite form ends in -ます. たべる is the casual dictionary form; pairing it with です/で is the double-verb error from the rule card.",
    }),
    // ── Self-explanation at N-1 placement — fires AFTER 2 class MCQs +
    //    the match + multiple ます-form exposures (5+ commits already). ──
    selfExplain({
      id: "ja-m7-2-self-masu-1",
      anchorLabel: "You matched たべる → たべます",
      anchorAudioText: "たべる、たべます",
      question: "Why does たべる become たべます (not たべるます)?",
      rule: {
        text: "-る verbs drop -る and add -ます; -u verbs change -u to -i + -ます.",
      },
      surface: { text: "all verbs add -ます to the end" },
      distractor: { text: "ます means 'I do' on its own" },
      ruleExplanation:
        "たべる is a -る verb: drop -る → たべ, add -ます → たべます. のむ is a -u verb: -u → -i, add -ます → のみます. The pattern is mechanical once you spot the verb type.",
    }),
    // ── Review tail (M4 anchors — possession-objects natural with verbs) ──
    vocabMcq("ja-m7-2-rev-mcq-m4", M7_2_REVIEW[0], M7_REVIEW_M4),
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
    vocabMcq("ja-m7-2-rev-mcq-m4-2", M7_2_REVIEW[1], M7_REVIEW_M4),
    // Third review tap — M6 place-atom (broadens cumulative surface).
    vocabMcq("ja-m7-2-rev-mcq-m6", M7_REVIEW_M6[1], M7_REVIEW_M6),
    // Speaking cap — say one polite-form sentence (production direction last).
    speaking("ja-m7-2-speak-yomu", "ほんを よみます", "I read a book."),
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
assertAnswerRotation(M7_2.steps, 2);
assertNoConsecutiveSame(M7_2.steps);

// ----- M7-3 — を (Grammar Rule + answer-rotating drills, minDistinct=3) ---

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

const M7_3_REVIEW = pickReviewAtoms("ja-m7-3-rev", M7_REVIEW_M1.filter((a) => Boolean(a.emoji)), 4);

export const M7_3: LessonContent = {
  id: "ja-m7-3",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "を — the direct-object particle",
  description:
    "What's being acted on. Eat WHAT, drink WHAT, read WHAT — that WHAT takes を. Answers rotate across を/に/で/は so you can't pattern-match.",
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m7-3-info-open",
      "The action-target",
      "Every transitive verb (eat, drink, read, watch, write) takes a direct object. In Japanese, that object gets marked by を. The drill below mixes を with the M6 particles (は, に, で) so you can't auto-pick.",
    ),
    RULE_WO,
    // ── Rotating-answer cloze block: を → に → を → で → を → は.
    // ≥3 distinct correct particles (assertAnswerRotation gates at bottom). ──
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
    // Listening break (R3) before next cloze.
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
    // Switch to は (topic — the canonical anti-pattern for the new particle).
    cloze(
      "ja-m7-3-cloze-5",
      "わたし",
      " すしを たべます。",
      "は",
      ["を", "は", "が", "に"],
      "I eat sushi. (topic-marked subject)",
      "わたしは すしを たべます。",
      "わたし = topic → は. The sushi (the direct object) takes を separately.",
    ),
    // Self-explanation: WHY を on a transitive verb (now at N-1 of cluster).
    selfExplain({
      id: "ja-m7-3-self-wo-1",
      anchorLabel: "You picked を in: すし＿ たべます",
      anchorAudioText: "すしを たべます",
      question: "Why is を correct here (and not に or は)?",
      rule: {
        text: "を marks the thing the verb acts on (sushi is being eaten).",
      },
      surface: { text: "を always comes after a food word" },
      distractor: { text: "を introduces the answer to a wh-question" },
      ruleExplanation:
        "を is the direct-object particle — it tags the noun the verb acts on. に would mark a destination (you don't eat a place); は would shift the topic ('as for sushi…').",
    }),
    // Back to を on a longer carrier — production direction next.
    cloze(
      "ja-m7-3-cloze-6",
      "ほん",
      " よみます。",
      "を",
      ["を", "は", "が", "の"],
      "I read a book.",
      "ほんを よみます。",
    ),
    // Production tap (build) — generation step required per spec §4.
    build(
      "ja-m7-3-translate-name",
      "I write [my] name.",
      "なまえを かきます",
      ["なまえ", "を", "かきます", "よみます", "は"],
      ["なまえ", "を", "かきます"],
    ),
    // Speaking — fold a kaku exposure in (extra atom-coverage for かきます).
    speaking("ja-m7-3-speak-kaku", "なまえを かきます", "I write my name."),
    // ── Review tail (M1 atoms) — different seed than M7-1's M3 draw. ──
    vocabMcq("ja-m7-3-rev-mcq-m1", M7_3_REVIEW[0], M7_REVIEW_M1),
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
    vocabMcq(
      "ja-m7-3-rev-mcq-m2",
      M3_M7_REVIEW_POOL.find((a) => a.fromModule === "m2" && Boolean(a.emoji))!,
      M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2"),
    ),
    // Extra cumulative tap — M5 number atom (broadens surface).
    vocabMcq("ja-m7-3-rev-mcq-m5", M7_REVIEW_M5[0], M7_REVIEW_M5),
    // Listening cap on a verb sentence we drilled (なまえを かきます).
    listeningCompSentence({
      id: "ja-m7-3-rev-lc-namae",
      audioText: "なまえを かきます",
      correctMeaningEn: "I write my name.",
      distractorsEn: [
        "I read my name.",
        "I say my name.",
        "I write a book.",
      ],
    }),
    reviewMatchPairs("ja-m7-3-rev", M7_3_REVIEW),
    infoStep(
      "ja-m7-3-info-end",
      "を locked in (without auto-pick)",
      "Six drills, but the correct answer rotated across を, に, で, は. You had to parse meaning, not pattern-match. Next: a food/drink vocab pool to drill it more.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_3.steps);
// Per Wave 4B brief: tighten M7-3 cloze block to ≥3 distinct correct particles.
assertAnswerRotation(M7_3.steps, 3);
assertNoConsecutiveSame(M7_3.steps);

// ----- M7-4 — Food + drink vocab + listening ------------------------------

const M7_4_REVIEW = pickReviewAtoms("ja-m7-4-rev", M7_REVIEW_M5_VISUAL, 4);

export const M7_4: LessonContent = {
  id: "ja-m7-4",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Food + drink vocab",
  description:
    "Six common foods and drinks — direct-object material for the verb drills. Three katakana sprinkles.",
  estimatedMinutes: 9,
  xpReward: 22,
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
    speaking("ja-m7-4-speak-pan", "パンを たべます", "I eat bread."),
    // sentenceMcq retrieval on パン — pushes the atom to ≥3 occurrences.
    sentenceMcq({
      id: "ja-m7-4-mcq-pan",
      prompt: "Which sentence means 'I eat bread.'?",
      correctKana: "パンを たべます。",
      distractorsKana: [
        "パンを のみます。",
        "パンは たべます。",
        "パンに たべます。",
      ],
      explanation:
        "Bread is eaten (たべる), not drunk. Direct object → を.",
    }),
    vocab("ja-m7-4-v-gohan", "Rice / a meal", "gohan", "ごはん"),
    // sentenceMcq break — pick the kana sentence that matches.
    sentenceMcq({
      id: "ja-m7-4-mcq-juice",
      prompt: "Which sentence means 'I drink juice.'?",
      correctKana: "ジュースを のみます。",
      distractorsKana: [
        "ジュースを たべます。",
        "みずを たべます。",
        "コーヒーを たべます。",
      ],
      explanation:
        "Juice is drunk (のむ), not eaten (たべる). Direct object → を. The other three pair the wrong verb with each drink.",
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
      "Use おさけ for politeness in formal/restaurant settings. The kanji 酒 also appears in restaurant signs.",
    ),
    // Retrieval on さけ — pushes atom to ≥3 within M7 (per coverage audit).
    sentenceMcq({
      id: "ja-m7-4-mcq-sake",
      prompt: "Which sentence means 'I drink sake.'?",
      correctKana: "さけを のみます。",
      distractorsKana: [
        "さけを たべます。",
        "さけは のみます。",
        "さけに のみます。",
      ],
      explanation:
        "さけ (sake) is drunk → のむ. Direct object → を. Polite variant: おさけを のみます.",
    }),
    // Production cap: build one sentence using a fresh food word.
    build(
      "ja-m7-4-translate-gohan",
      "I eat a meal.",
      "ごはんを たべます",
      ["ごはん", "を", "たべます", "のみます", "は"],
      ["ごはん", "を", "たべます"],
    ),
    // ── Review tail (M5 anchors — numbers/money for restaurant prep). ──
    vocabMcq("ja-m7-4-rev-mcq-m5-end", M7_4_REVIEW[1], M7_REVIEW_M5),
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
    vocabMcq("ja-m7-4-rev-mcq-m3", M7_REVIEW_M3[0], M7_REVIEW_M3),
    reviewMatchPairs("ja-m7-4-rev", M7_4_REVIEW),
    infoStep(
      "ja-m7-4-info-end",
      "Object pool loaded",
      "You can now name six foods and drinks and put each one in a verb sentence. Next: drill verb + を + object across new vocab, with M6 particles still in rotation.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_4.steps);
assertAnswerRotation(M7_4.steps, 2);
assertNoConsecutiveSame(M7_4.steps);

// ----- M7-5 — Drill: を rotated with に/で/が (selfExplain at N-1) --------

const M7_5_REVIEW = pickReviewAtoms("ja-m7-5-rev", M7_REVIEW_M6_VISUAL, 4);

export const M7_5: LessonContent = {
  id: "ja-m7-5",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Drill — verbs + を (rotated with に/で/が)",
  description:
    "The old M7-5 had six clozes all answering を. This rebuild rotates the answer across を/に/で/が so meaning-parsing is required.",
  estimatedMinutes: 10,
  xpReward: 24,
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
    // Back to を — テレビ exposure (M7 atom-coverage compounding).
    cloze(
      "ja-m7-5-cloze-5",
      "テレビ",
      " みます。",
      "を",
      ["を", "は", "が", "に"],
      "I watch TV.",
      "テレビを みます。",
      "テレビ is what's being watched → を. (Loanword: テレビ = television.)",
    ),
    // Build break (R3) — production direction.
    build(
      "ja-m7-5-translate-kafe",
      "I drink coffee at a café.",
      "カフェで コーヒーを のみます",
      ["カフェ", "で", "コーヒー", "を", "のみます", "に"],
      ["カフェ", "で", "コーヒー", "を", "のみます"],
    ),
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
    // ── selfExplain at N-1 placement (after 6 cloze commits + translate). ──
    selfExplain({
      id: "ja-m7-5-self-ni-wo",
      anchorLabel: "You picked に in: うち＿ いきます (I go home)",
      anchorAudioText: "うちに いきます",
      question: "Why is に correct (and not を)?",
      rule: {
        text: "に marks a destination. いく moves you toward the noun — it doesn't act on it.",
      },
      surface: { text: "に always comes after a place word" },
      distractor: { text: "に marks the subject of an existence sentence" },
      ruleExplanation:
        "いく is a motion verb, not a transitive one — it doesn't have a 'thing being acted on'. The place you go TO is marked with に. を would be wrong: you don't 'do' home. The 'subject of existence' distractor is が (えきに ともだちが います), not に.",
    }),
    // Listening cap — テレビ + みます exposure repeats (M7 compounding).
    listeningCompSentence({
      id: "ja-m7-5-lc-terebi",
      audioText: "テレビを みます",
      correctMeaningEn: "I watch TV.",
      distractorsEn: [
        "I read TV.",
        "I write TV.",
        "I eat TV.",
      ],
    }),
    // M6 atom re-exposure inside M7 (くうこう / ゆうびんきょく — verb-of-motion
    // sentences naturally take location particles; per Wave 4B brief
    // "M6 atoms must appear in M7 review tails").
    listeningCompSentence({
      id: "ja-m7-5-lc-kuukou",
      audioText: "くうこうに いきます",
      correctMeaningEn: "I go to the airport.",
      distractorsEn: [
        "I go to the post office.",
        "I go to the park.",
        "I go home.",
      ],
    }),
    cloze(
      "ja-m7-5-cloze-7",
      "ゆうびんきょく",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to the post office.",
      "ゆうびんきょくに いきます。",
      "Destination → に. ゆうびんきょく = post office (M6 reminder).",
    ),
    // One more re-exposure each — production direction (build).
    build(
      "ja-m7-5-translate-kuukou",
      "I go to the airport by bus.",
      "バスで くうこうに いきます",
      ["バス", "で", "くうこう", "に", "いきます", "あります"],
      ["バス", "で", "くうこう", "に", "いきます"],
    ),
    // Speaking — final production lock on テレビ (third occurrence within M7).
    speaking("ja-m7-5-speak-terebi", "テレビを みます", "I watch TV."),
    // ── Review tail (M6 places + a second-module tap). ──
    vocabMcq("ja-m7-5-rev-mcq-m6", M7_5_REVIEW[0], M7_REVIEW_M6),
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
    vocabMcq("ja-m7-5-rev-mcq-m4", M7_REVIEW_M4[0], M7_REVIEW_M4),
    reviewMatchPairs("ja-m7-5-rev", M7_5_REVIEW),
    infoStep(
      "ja-m7-5-info-end",
      "Four particles, one drill",
      "You can now sort を vs に vs で vs が across six sentences without auto-picking. That's the four-particle skeleton of beginner Japanese — every sentence from here uses some combination.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_5.steps);
assertAnswerRotation(M7_5.steps, 3);
assertNoConsecutiveSame(M7_5.steps);

// ----- M7-6 — Compound interleave (selfExplain at N-1) -------------------

const M7_6_REVIEW = pickReviewAtoms("ja-m7-6-rev", M7_REVIEW_POOL_VISUAL, 5);

export const M7_6: LessonContent = {
  id: "ja-m7-6",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Compound sentences — multiple particles",
  description:
    "Two-particle sentences. Where + what + verb. The natural endpoint of M3-M7 grammar.",
  estimatedMinutes: 10,
  xpReward: 24,
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
    // Production tap — build the most-complex sentence.
    // Prompt drops the "with my friend" leg because と (companion particle)
    // isn't taught in M3-M7; the canonical kana the original translateStep
    // graded against (audioText / acceptedAnswers[2]) was already the
    // 3-tile setting+object+verb sentence.
    build(
      "ja-m7-6-translate-friend-park",
      "I eat a meal at the park.",
      "こうえんで ごはんを たべます",
      ["こうえん", "で", "ごはん", "を", "たべます", "に"],
      ["こうえん", "で", "ごはん", "を", "たべます"],
    ),
    // Switch back to に (existence point).
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
    // sentenceMcq — picks a sentence with the M7 compounding atom テレビ.
    sentenceMcq({
      id: "ja-m7-6-mcq-uchi-terebi",
      prompt: "Which sentence means 'I watch TV at home.'?",
      correctKana: "うちで テレビを みます。",
      distractorsKana: [
        "うちに テレビを みます。",
        "うちで テレビに みます。",
        "うちを テレビで みます。",
      ],
      explanation:
        "うち = setting → で. テレビ = direct object → を. みます is what closes the sentence.",
    }),
    // ゆうびんきょく third exposure (M6 atom — verb-of-motion carrier).
    listeningCompSentence({
      id: "ja-m7-6-lc-yuubin",
      audioText: "ゆうびんきょくで てがみを かきます",
      correctMeaningEn: "I write a letter at the post office.",
      distractorsEn: [
        "I read a letter at the post office.",
        "I write a letter at home.",
        "I go to the post office.",
      ],
    }),
    // Speaking — production cap on the テレビ compound (3rd テレビ exposure).
    speaking(
      "ja-m7-6-speak-compound",
      "うちで テレビを みます",
      "I watch TV at home.",
    ),
    // ── selfExplain at N-1 placement (after 5 cloze commits + production). ──
    selfExplain({
      id: "ja-m7-6-self-compound",
      anchorLabel: "You picked を + で in: うちで ごはんを たべます",
      anchorAudioText: "うちで ごはんを たべます",
      question: "Why does this sentence need BOTH で and を?",
      rule: {
        text: "で marks the setting (where the action happens); を marks the thing acted on. The verb たべる needs both — a place AND an object.",
      },
      surface: { text: "Japanese sentences always use two particles" },
      distractor: { text: "で and を both mark the direct object" },
      ruleExplanation:
        "で and を play different roles: で = the SETTING of the action; を = the THING being acted on. Verbs like たべる, よむ, かく, のむ are transitive — they need an object (を) AND can have a setting (で). Both particles co-occur naturally.",
    }),
    // ── Review tail (broadest — M1-M6 cumulative). ──
    vocabMcq("ja-m7-6-rev-mcq-cum", M7_6_REVIEW[0], M7_REVIEW_POOL),
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
    vocabMcq("ja-m7-6-rev-mcq-cum-2", M7_6_REVIEW[2], M7_REVIEW_POOL),
    // Extra cumulative tap (M5 number atom) — broadens cumulative surface.
    vocabMcq("ja-m7-6-rev-mcq-m5", M7_REVIEW_M5[2], M7_REVIEW_M5),
    // Speaking cap — one more compound carrier (テレビ as direct object).
    speaking("ja-m7-6-speak-restaurant", "レストランで すしを たべます", "I eat sushi at a restaurant."),
    reviewMatchPairs("ja-m7-6-rev", M7_6_REVIEW),
    infoStep(
      "ja-m7-6-info-end",
      "Compound fluency",
      "You can now describe where you do what — five compound sentences, each with two particles in distinct roles. This is the most expressive Japanese you've produced. Next: production-only with no multiple choice.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_6.steps);
assertAnswerRotation(M7_6.steps, 3);
assertNoConsecutiveSame(M7_6.steps);

// ----- M7-7 — Production heavy (translate + listening_build + speaking) ---

const M7_7_REVIEW = pickReviewAtoms("ja-m7-7-rev", M7_REVIEW_POOL_VISUAL, 5);

export const M7_7: LessonContent = {
  id: "ja-m7-7",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — actions in the world",
  description:
    "No multiple choice. Translate, hear-and-build, and speak. Multiple sentences across three production modes.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m7-7-info-open",
      "Show your work",
      "Several sentences, mostly free-recall. Type the answer, assemble from audio, or say it out loud. This is the production endpoint of M3-M7.",
    ),
    // ── Sentence 1: build_sentence (4-tile — within the spec §4 ≤4-mora
    //    carve-out for build_sentence; "こうえんに いきます" is 2 tiles +
    //    2 distractors, total 4 tile pool). ──
    build(
      "ja-m7-7-s1",
      "Say: I go to the park.",
      "こうえんに いきます",
      ["こうえん", "に", "いきます", "うち", "がっこう", "で"],
      ["こうえん", "に", "いきます"],
    ),
    speaking(
      "ja-m7-7-speak-s1",
      "こうえんに いきます",
      "I go to the park.",
    ),
    // ── Sentence 2: build — full topic-marked polite sentence. ──
    build(
      "ja-m7-7-translate-s2",
      "I eat sushi.",
      "わたしは すしを たべます",
      ["わたし", "は", "すし", "を", "たべます", "のみます"],
      ["わたし", "は", "すし", "を", "たべます"],
    ),
    // ── Sentence 3: listeningBuildSentence — hear it, assemble it. ──
    listeningBuildSentence({
      id: "ja-m7-7-lb-s3",
      target: "うちで ごはんを たべます",
      tiles: ["うち", "で", "ごはん", "を", "たべます", "に", "のみます"],
      correctOrder: ["うち", "で", "ごはん", "を", "たべます"],
      promptEn: "Hear it, build it: 'I eat a meal at home.'",
    }),
    // sentenceMcq retrieval check on a sentence (variety break).
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
    // ── Sentence 4: build, longer (café compound). ──
    build(
      "ja-m7-7-translate-s4",
      "I drink coffee at a café.",
      "カフェで コーヒーを のみます",
      ["カフェ", "で", "コーヒー", "を", "のみます", "に"],
      ["カフェ", "で", "コーヒー", "を", "のみます"],
    ),
    // Listening break (R3) — sake exposure (M7 atom-coverage compounding).
    listeningCompSentence({
      id: "ja-m7-7-lc-sake",
      audioText: "さけを のみます",
      correctMeaningEn: "I drink sake.",
      distractorsEn: [
        "I eat sake.",
        "I drink water.",
        "I drink juice.",
      ],
    }),
    // ── Sentence 5: build — sake target (3rd さけ exposure within M7). ──
    build(
      "ja-m7-7-translate-sake",
      "I drink sake.",
      "さけを のみます",
      ["さけ", "を", "のみます", "たべます", "は"],
      ["さけ", "を", "のみます"],
    ),
    // Listening break before the last build.
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
    // ── Sentence 6: listeningBuildSentence + speaking, the hardest pair. ──
    listeningBuildSentence({
      id: "ja-m7-7-lb-s5",
      target: "じてんしゃで がっこうに いきます",
      tiles: ["じてんしゃ", "で", "がっこう", "に", "いきます", "たべます"],
      correctOrder: ["じてんしゃ", "で", "がっこう", "に", "いきます"],
      promptEn: "Hear it, build it: 'I go to school by bicycle.'",
    }),
    speaking(
      "ja-m7-7-speak-s5",
      "じてんしゃで がっこうに いきます",
      "I go to school by bicycle.",
    ),
    // ── Review tail (cumulative — broadest set). ──
    vocabMcq("ja-m7-7-rev-mcq-cum", M7_7_REVIEW[0], M7_REVIEW_POOL),
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
    vocabMcq("ja-m7-7-rev-mcq-cum-2", M7_7_REVIEW[2], M7_REVIEW_POOL),
    // Extra cumulative taps — M6 place + M3 anchor (more cross-module surface).
    vocabMcq("ja-m7-7-rev-mcq-m6", M7_REVIEW_M6[2], M7_REVIEW_M6),
    listeningCompSentence({
      id: "ja-m7-7-rev-lc-m3",
      audioText: M7_REVIEW_M3[2].kana,
      correctMeaningEn: M7_REVIEW_M3[2].meaningEn,
      distractorsEn: [
        M7_REVIEW_M3[3].meaningEn,
        M7_REVIEW_M3[4].meaningEn,
        M7_REVIEW_M3[5].meaningEn,
      ],
    }),
    // Speaking cap — say one of the harder compound sentences.
    speaking(
      "ja-m7-7-speak-cap",
      "カフェで コーヒーを のみます",
      "I drink coffee at a café.",
    ),
    reviewMatchPairs("ja-m7-7-rev", M7_7_REVIEW),
    infoStep(
      "ja-m7-7-info-end",
      "Six real actions, produced",
      "You can now produce six full sentences from English prompts — typed, audio-assembled, spoken. You can describe motion, setting, and direct objects across the M3-M7 toolkit.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_7.steps);
assertAnswerRotation(M7_7.steps, 2);
assertNoConsecutiveSame(M7_7.steps);

// ----- M7-8 — Mini-dialogue (dialogueListen) — ramen shop -----------------

const M7_8_REVIEW = pickReviewAtoms("ja-m7-8-rev", M7_REVIEW_POOL_VISUAL, 6);

export const M7_8: LessonContent = {
  id: "ja-m7-8",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — at a ramen shop",
  description:
    "Order food and drinks. Verbs + を + numbers + ください all in play. Closes with cumulative M1-M6 review.",
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m7-8-info-open",
      "Drop into the scene",
      "You sit down at a Tokyo ramen shop with a friend. The staff greets you, you order, and you check the bill. Every grammar piece is something you've met.",
      "culture",
    ),
    // ── Warm-up vocab: re-expose the dialogue's signature atoms BEFORE
    //    the listening retrieval. Each gets a second occurrence inside M7. ──
    phrase(
      "ja-m7-8-warm-irasshai",
      "Welcome (shop greeting)",
      "irasshaimase",
      "いらっしゃいませ",
      "Standard shop / restaurant greeting. Don't reply — just nod or step inside.",
    ),
    phrase(
      "ja-m7-8-warm-nanmei",
      "How many people?",
      "nan-mei sama desu ka",
      "なんめいさまですか",
      "なんめいさま = polite form of 'how many people.' Always the second thing the staff asks after greeting.",
    ),
    // Listening break splits the 5-phrase warmup run (max 2 adjacent same type).
    listeningCompSentence({
      id: "ja-m7-8-lc-nanmei",
      audioText: "なんめいさまですか",
      correctMeaningEn: "How many people?",
      distractorsEn: [
        "What would you like to order?",
        "Welcome to the shop.",
        "Where would you like to sit?",
      ],
    }),
    phrase(
      "ja-m7-8-warm-gochuumon",
      "Your order? (polite)",
      "go-chuumon wa",
      "ごちゅうもんは",
      "ちゅうもん = order; ご- prefix is the respectful version. Used in any ordering context.",
    ),
    phrase(
      "ja-m7-8-warm-hitotsu",
      "One (counter)",
      "hitotsu",
      "ひとつ",
      "Generic counter for one of anything. ふたつ = two, みっつ = three. Use when the staff asks how many.",
    ),
    // Second listening break before the final phrase + dialogue.
    listeningCompSentence({
      id: "ja-m7-8-lc-gochuumon",
      audioText: "ごちゅうもんは",
      correctMeaningEn: "Your order? (polite)",
      distractorsEn: [
        "How many people?",
        "Please come again.",
        "Is this for here or to go?",
      ],
    }),
    phrase(
      "ja-m7-8-warm-kashikomari",
      "Understood. (formal acknowledgement)",
      "kashikomarimashita",
      "かしこまりました",
      "Restaurant / shop service way of saying 'understood.' Don't reply — just nod.",
    ),
    // ── Dialogue Listen — the new factory. Audio-only first; transcript
    //    reveals after first question commits. ──
    dialogueListen({
      id: "ja-m7-8-dialogue",
      lines: [
        { speaker: "Staff", kana: "いらっしゃいませ。なんめいさまですか。" },
        { speaker: "You",   kana: "ふたりです。" },
        { speaker: "Staff", kana: "ごちゅうもんは。" },
        { speaker: "You",   kana: "ラーメンを ふたつ と ジュースを ひとつ ください。" },
      ],
      questions: [
        {
          id: "ja-m7-8-dq-1",
          prompt: "What did you order to eat?",
          correctText: "Two ramen",
          distractors: ["Two juices", "One ramen", "Two bowls of rice"],
          explanation:
            "ラーメンを ふたつ = two ramen. ふたつ is the counter '2 (things).' ジュースは ひとつ (one juice) is the second item.",
        },
        {
          id: "ja-m7-8-dq-2",
          prompt: "How many drinks did you order?",
          correctText: "One",
          distractors: ["Two", "Three", "None"],
          explanation:
            "ジュースを ひとつ = one juice. ひとつ is the counter for 1 (of a generic thing).",
        },
        {
          id: "ja-m7-8-dq-3",
          prompt: "If ramen is 800 yen each and juice is 300 yen, what's the total?",
          correctText: "1,900 yen",
          distractors: ["1,100 yen", "1,600 yen", "2,400 yen"],
          explanation:
            "Two ramen (800 × 2 = 1,600) + one juice (300) = 1,900 yen. Tests that you parsed the quantities — ふたつ ramen + ひとつ juice.",
        },
      ],
      transcriptRevealAfter: "first-answer",
    }),
    // ── Post-dialogue: re-expose the polite service lines so each M7
    //    atom from the dialogue hits the ≥3-occurrence floor. ──
    listeningCompSentence({
      id: "ja-m7-8-lc-nanmei",
      audioText: "なんめいさまですか",
      correctMeaningEn: "How many people? (polite)",
      distractorsEn: [
        "What's your order?",
        "Welcome.",
        "Two people.",
      ],
    }),
    // Speaking — say the polite shop-staff acknowledgement.
    speaking(
      "ja-m7-8-speak-kashikomari",
      "かしこまりました",
      "Understood. (formal acknowledgement)",
    ),
    // Confirm the canonical order phrase.
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
    // Speaking — say the order phrase yourself.
    speaking(
      "ja-m7-8-speak-order",
      "ラーメンを ふたつ ください",
      "Two ramen, please.",
    ),
    // sentenceMcq retrieval on `かしこまりました` — the polite ack atom.
    sentenceMcq({
      id: "ja-m7-8-mcq-kashikomari",
      prompt: "Which is the formal shop-staff way of saying 'understood'?",
      correctKana: "かしこまりました。",
      distractorsKana: [
        "ありがとうございます。",
        "いらっしゃいませ。",
        "ごちゅうもんは。",
      ],
      explanation:
        "かしこまりました is the formal acknowledgement staff use after taking your order. The others are: thank-you / welcome-greeting / your-order-please.",
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
    // Production tap — build one cumulative sentence.
    build(
      "ja-m7-8-translate-final",
      "I drink water.",
      "みずを のみます",
      ["みず", "を", "のみます", "たべます", "は"],
      ["みず", "を", "のみます"],
    ),
    cloze(
      "ja-m7-8-cloze-3",
      "コーヒー",
      " ひとつ ください。",
      "を",
      ["を", "は", "が", "に"],
      "One coffee, please.",
      "コーヒーを ひとつ ください。",
      "ひとつ = one (generic counter). を marks the requested item before ください.",
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
    vocabMcq("ja-m7-8-rev-mcq-cum-2", M7_8_REVIEW[5], M7_REVIEW_POOL),
    reviewMatchPairs("ja-m7-8-rev", M7_8_REVIEW),
    infoStep(
      "ja-m7-8-info-end",
      "Ramen shop — handled in Japanese",
      "You can now walk into a Tokyo ramen shop, give your party size, order two dishes with counters, and recognize the staff's polite responses. M3-M7 grammar, one real exchange. Next: the mastery test.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M7_8.steps);
assertAnswerRotation(M7_8.steps, 2);
assertNoConsecutiveSame(M7_8.steps);

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
      "テレビ___ みます。 (I watch TV.)",
      "テレビを みます",
      "を",
      ["は", "が", "に"],
      "TV is what's being watched (direct object) → を. Reuses the M7 テレビ atom.",
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
      "さけ___ のみます。 (I drink sake.)",
      "さけを のみます",
      "を",
      ["は", "が", "に"],
      "Direct object → を. Reuses the M7 さけ atom.",
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
      tiles: ["うち", "で", "ごはん", "を", "たべます", "に", "のみます"],
      correctOrder: ["うち", "で", "ごはん", "を", "たべます"],
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
