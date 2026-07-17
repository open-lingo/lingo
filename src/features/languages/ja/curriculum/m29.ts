/**
 * M29 — Plain form (N4 pilot #1, 2026-07-16).
 *
 * First module of the JLPT N4 tier. Exemplar module — every later N4
 * module copies this file's shape. Grammar anchor: plain form as a
 * PRODUCTIVE REGISTER (dictionary form, ない form, た form, plain て),
 * taught as the base ます is built from — NOT as "casual ます." The
 * learner already knows ます-form; plain form is not a decoration on it.
 *
 * Grammar sequencing (docs/n4-pilot-spine-2026-07-16.md):
 *   Pair 1 — Dictionary form, う-verbs (かう→かう, いく, のむ) + ru/u split
 *   Pair 2 — Dictionary form, る-verbs + irregulars (する, くる)
 *   Pair 3 — ない form (plain negative)
 *   Pair 4 — た form (plain past) — leverages the already-known て-form
 *   Pair 5 — なかった (plain past negative)
 *   Pair 6 — Mixed plain-form interleave — all four forms rotating
 *   Story  — Two friends talking casually (plain form in the wild)
 *   Pair 7 — Mixed drill + production
 *
 * VOCAB RECONCILIATION (important divergence from the spine doc — see the
 * top-level task report for full detail): the spine's 21-atom list mostly
 * turned out to be ALREADY CLAIMED by earlier modules when checked against
 * the real `courseAtoms.ts` registry:
 *   - あそぶ (m2), ともだち (m3), まつ / はなす / および / しめる / あける
 *     (m14), はしる / じぶん (m16), うたう (m23), わすれる (m26).
 * Per guide §13.8 (never re-teach an already-introduced atom — extend, don't
 * re-teach), these are used here as REVIEW/context vocabulary (exactly what
 * a plain-form module SHOULD do: conjugate verbs the learner already owns
 * in dictionary form — m7's QA note confirms M7+ verb atoms are stored in
 * DICTIONARY form already, not ます). They are NOT re-registered under
 * fromModule "m29".
 *
 * Genuinely new atoms (10, all fromModule "m29" in courseAtoms.ts):
 *   てつだう (help), いそぐ (hurry), つかう (use — upgraded from "future"),
 *   さがす (look for), なおす (fix), はこぶ (carry), えらぶ (choose),
 *   かたづける (tidy up), おぼえる (memorise — upgraded from "future"),
 *   ぜんぶ (all/everything — upgraded from "future", blocked: true).
 * じぶん stays m16-blocked (untouched) — used here as review context only.
 *
 * kanji_reading (3, per spine "sprinkle 2-3, never on a just-introduced
 * word"): all three land on M7 REVIEW-TIER dictionary-form verbs whose
 * kanji unlocked well before m29 (食べる m14, 読む m14, 行く m15) —
 * たべる in 4-1 (た-form pair), よむ in 6-1 (mixed interleave), いく in
 * 7-1 (final drill). Never on a new m29 atom.
 *
 * NO particle_cloze anywhere in this file (guide §4c — m29 is far past
 * every N5 particle's 2-module grandfather window; particleClozePlacement
 * .test.ts would hard-fail a new late usage). NO phrase_card / vocab() /
 * phrase() calls (guide §4b2 + 2026-07-16 correction — those factories
 * both emit the shelved phrase_card type). NO info steps. Every lesson
 * ends on a gradeable step (reviewMatchPairs).
 *
 * 15 hand-authored exports (12 pair lessons + story + 7-1/7-2); reviews
 * ja-m29-review-1/2 are DERIVED, not authored here.
 *
 * ID scheme: ja-m29-{n}-{sub}. Export names: M29_1_1, M29_1_2, etc.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  grammarRule,
  kanjiReading,
  listeningBuildSentence,
  listeningCompSentence,
  M3_M7_REVIEW_POOL,
  withoutMcqBlocked,
  pickReviewAtoms,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  storyComprehension,
  translateStep,
  vocabMcq,
  assertNoSameAnswerCluster,
  assertAnswerRotation,
  assertNoConsecutiveSame,
} from "@/features/languages/ja/grammarHelpers";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  assertPassiveCardsHaveFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// Per-sub-lesson review-atom draws. Pool is M3-M7 (historical name; every
// m8-m27 module draws from the same pool per guide §6).
// ───────────────────────────────────────────────────────────────────────
const M29_REVIEW_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter(
    (a) =>
      a.fromModule === "m3" ||
      a.fromModule === "m4" ||
      a.fromModule === "m5" ||
      a.fromModule === "m6" ||
      a.fromModule === "m7",
  ),
);

// ═══════════════════════════════════════════════════════════════════════
// Grammar rules (defined once, reused across sub-lessons)
// ═══════════════════════════════════════════════════════════════════════

const RULE_DICT_U = grammarRule({
  id: "ja-m29-rule-dict-u",
  grammarPointId: "dict-form-u-verbs",
  title: "Dictionary form — う-verbs (the base ます is built from)",
  rule:
    "Every ます-verb has a plain dictionary form underneath it — this ISN'T a casual shortcut, it's the base ます was built ON TOP OF. For う-verbs, ます attaches to the い-row stem (のみ-ます, はなし-ます); strip ます and swap that い-row sound back one row to its う-row partner: のみます → のむ, はなします → はなす, まちます → まつ. This is the exact form you'll meet in dictionaries, signs, novels, and every grammar point from here on.",
  examples: [
    { ja: "わたしは まいにち コーヒーを のむ。", romaji: "watashi wa mainichi koohii o nomu.", en: "I drink coffee every day. (plain)" },
    { ja: "ともだちと はなす。", romaji: "tomodachi to hanasu.", en: "I talk with my friend. (plain)" },
    { ja: "バスを まつ。", romaji: "basu o matsu.", en: "I wait for the bus. (plain)" },
  ],
  antiPattern: {
    ja: "のみる",
    romaji: "nomiru",
    en: "(broken — う-verbs don't just add る to the stem)",
    why: "のむ is a う-verb (godan); its ます-stem のみ- swaps back to the う-row のむ, not のみ + る. Stem-plus-る is the る-verb pattern, taught next.",
  },
  cultureNote:
    "ます isn't 'real Japanese with the politeness stripped off' when you go casual — plain form is the engine underneath, and ます is the polite dress it wears in formal contexts. You'll use plain form constantly: with friends, thinking to yourself, and as the base for nearly every grammar point downstream (relative clauses, conditionals, casual speech).",
});

const RULE_DICT_RU_IRREGULAR = grammarRule({
  id: "ja-m29-rule-dict-ru",
  grammarPointId: "dict-form-ru-irregular",
  title: "Dictionary form — る-verbs + irregulars する/くる",
  rule:
    "る-verbs are simpler: ます attaches straight onto the bare stem, so stripping ます and adding る gives the dictionary form: たべます → たべる, みます → みる, おぼえます → おぼえる. The two irregulars don't follow either pattern and are memorised as wholes: します → する, きます → くる.",
  examples: [
    { ja: "あさごはんを たべる。", romaji: "asagohan o taberu.", en: "I eat breakfast. (plain)" },
    { ja: "テレビを みる。", romaji: "terebi o miru.", en: "I watch TV. (plain)" },
    { ja: "にほんごを べんきょうする。", romaji: "nihongo o benkyou suru.", en: "I study Japanese. (plain)" },
  ],
  antiPattern: {
    ja: "きます → きる",
    romaji: "kimasu → kiru",
    en: "(broken — くる is irregular, not a る-verb)",
    why: "きる looks like a valid stem-plus-る dictionary form, but that's a coincidence — きる is an unrelated real word (to wear / to cut). くる's dictionary form is くる itself; it must be memorised, not derived.",
  },
  cultureNote:
    "You already use する constantly (べんきょうします, れんしゅうします) — every する-verb's dictionary form just becomes …する. くる is rarer alone but appears inside compounds you'll meet soon.",
});

const RULE_NAI = grammarRule({
  id: "ja-m29-rule-nai",
  grammarPointId: "nai-form",
  title: "ない form — plain negative",
  rule:
    "う-verbs shift the stem-final sound one row further back, from う-row to あ-row, then add ない: のむ → のまない, はなす → はなさない, まつ → またない. Verbs whose dictionary form ends in the kana う (not just 'う-row' — the literal character う) take わ instead of あ: てつだう → てつだわない. る-verbs simply drop る and add ない: たべる → たべない. する → しない, くる → こない. This ない is the same piece you'll see attach elsewhere later — one negator, many attachment points.",
  examples: [
    { ja: "きょうは はたらかない。", romaji: "kyou wa hatarakanai.", en: "I'm not working today. (plain)" },
    { ja: "ともだちを てつだわない。", romaji: "tomodachi o tetsudawanai.", en: "I'm not helping my friend. (plain)" },
    { ja: "テレビを みない。", romaji: "terebi o minai.", en: "I'm not watching TV. (plain)" },
  ],
  antiPattern: {
    ja: "てつだあない",
    romaji: "tetsudaanai",
    en: "(broken — う takes わ before ない, not あ)",
    why: "Verbs whose dictionary form ends in う (かう, てつだう, うたう) swap う → わ, not あ — あ alone would leave nothing to carry the sound. てつだう → てつだわない.",
  },
  cultureNote:
    "This exact ない attaches to almost everything downstream — you'll see it inside patterns for 'don't have to' and 'without doing.' Learn the attachment once here.",
});

const RULE_TA = grammarRule({
  id: "ja-m29-rule-ta",
  grammarPointId: "ta-form",
  title: "た form — plain past (built from the て-form you already know)",
  rule:
    "The plain past is a straight swap on the て-form you already use: て → た, で → だ. のんで → のんだ, たべて → たべた, いって → いった (いく keeps its irregular っ). する → した, くる → きた. If you can say the て-form, you already know this.",
  examples: [
    { ja: "きのう ともだちと はなした。", romaji: "kinou tomodachi to hanashita.", en: "I talked with my friend yesterday. (plain)" },
    { ja: "にほんごを べんきょうした。", romaji: "nihongo o benkyou shita.", en: "I studied Japanese. (plain)" },
    { ja: "がっこうに いった。", romaji: "gakkou ni itta.", en: "I went to school. (plain)" },
  ],
  antiPattern: {
    ja: "のみた",
    romaji: "nomita",
    en: "(broken — build from the て-form, not straight from the dictionary form)",
    why: "のむ's て-form is のんで (not のみて); swap で → だ to get のんだ. Skipping the て-form step produces the wrong sound change.",
  },
  cultureNote:
    "This た is the SAME た you already use inside patterns like 'have you ever…' — same building block, now unlocked as a stand-alone plain past.",
});

const RULE_NAKATTA = grammarRule({
  id: "ja-m29-rule-nakatta",
  grammarPointId: "nakatta-form",
  title: "なかった — plain past negative",
  rule:
    "Take the ない-form, drop the final い, add かった — the identical い→かった swap that turns any い-adjective into its past tense (たかい → たかかった). のまない → のまなかった. たべない → たべなかった. しない → しなかった. こない → こなかった.",
  examples: [
    { ja: "きのうは はたらかなかった。", romaji: "kinou wa hatarakanakatta.", en: "I didn't work yesterday. (plain)" },
    { ja: "にほんごを べんきょうしなかった。", romaji: "nihongo o benkyou shinakatta.", en: "I didn't study Japanese. (plain)" },
    { ja: "ともだちは こなかった。", romaji: "tomodachi wa konakatta.", en: "My friend didn't come. (plain)" },
  ],
  antiPattern: {
    ja: "のまないだった",
    romaji: "nomanai datta",
    en: "(broken — ない behaves like an い-adjective; don't add だった)",
    why: "ない is grammatically an い-type ending: drop い, add かった. だった is for nouns/な-adjectives, not for ない.",
  },
  cultureNote:
    "Once ない behaves like an い-adjective for tense, every い-adjective past-tense rule you already know (たのしい→たのしかった) transfers straight over — no new mechanism.",
});

// ═══════════════════════════════════════════════════════════════════════
// M29-1-1 — Dictionary form: う-verbs I (new: てつだう, いそぐ, つかう)
// ═══════════════════════════════════════════════════════════════════════

const M29_1_1_REVIEW = pickReviewAtoms("ja-m29-1-1-rev", M29_REVIEW_POOL, 4);

export const M29_1_1: LessonContent = {
  id: "ja-m29-1-1",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "Dictionary form — う-verbs I",
  description:
    "Meet the plain dictionary form for う-verbs — the base ます is built from. New verbs: てつだう, いそぐ, つかう.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_DICT_U,
    build(
      "ja-m29-1-1-build-tetsudau",
      "Pick the dictionary form of: to help",
      "てつだう",
      ["てつだいます", "てつだう", "てつだった", "てつだって"],
      ["てつだう"],
      ["てつだう"],
    ),
    listeningCompSentence({
      id: "ja-m29-1-1-lc-tetsudau",
      audioText: "ともだちを てつだう。",
      correctMeaningEn: "I help my friend. (plain)",
      distractorsEn: [
        "My friend helps me. (plain)",
        "I helped my friend. (plain)",
        "I don't help my friend. (plain)",
      ],
      exercisedAtomKanas: ["てつだう"],
    }),
    build(
      "ja-m29-1-1-build-isogu",
      "Pick the dictionary form of: to hurry",
      "いそぐ",
      ["いそぎます", "いそぐ", "いそいだ", "いそいで"],
      ["いそぐ"],
      ["いそぐ"],
    ),
    vocabMcq(
      "ja-m29-1-1-mcq-isogu",
      { kana: "いそぐ", meaningEn: "to hurry", emoji: "💨", fromModule: "m29" },
      M29_REVIEW_POOL,
    ),
    build(
      "ja-m29-1-1-build-tsukau",
      "Pick the dictionary form of: to use",
      "つかう",
      ["つかいます", "つかう", "つかった", "つかって"],
      ["つかう"],
      ["つかう"],
    ),
    speaking("ja-m29-1-1-speak-tsukau", "つかう", "to use", ["つかう"]),
    sentenceMcq({
      id: "ja-m29-1-1-mcq-recognition",
      prompt: "Which is the PLAIN dictionary form of のみます (to drink)?",
      correctKana: "のむ",
      distractorsKana: ["のみる", "のむます", "のみます"],
      explanation: "のむ is a う-verb: swap the い-row stem のみ- back to the う-row のむ.",
    }),
    build(
      "ja-m29-1-1-build-sentence-1",
      "Say: I use a pen.",
      "ペンを つかう",
      ["ペン", "を", "つかう", "つかいます", "は"],
      ["ペン", "を", "つかう"],
      ["つかう"],
    ),
    listeningBuildSentence({
      id: "ja-m29-1-1-lb-tetsudau",
      target: "ともだちを てつだう",
      tiles: ["ともだち", "を", "てつだう", "てつだいます", "は", "てつだった"],
      correctOrder: ["ともだち", "を", "てつだう"],
      promptEn: "Hear it, build it: 'I help my friend.' (plain)",
      exercisedAtomKanas: ["てつだう"],
    }),
    sentenceMcq({
      id: "ja-m29-1-1-mcq-2",
      prompt: "Which means 'I hurry.' (plain, not ます)?",
      correctKana: "いそぐ。",
      distractorsKana: ["いそぎます。", "いそいだ。", "いそいで。"],
      explanation: "いそぐ is already the dictionary form — no ます, no ending swap needed.",
      exercisedAtomKanas: ["いそぐ"],
    }),
    translateStep({
      id: "ja-m29-1-1-translate",
      promptEn: "I help my friend. (plain)",
      acceptedAnswers: ["ともだちを てつだう", "ともだちを てつだう。"],
      audioText: "ともだちを てつだう",
      exercisedAtomKanas: ["てつだう"],
    }),
    selfExplain({
      id: "ja-m29-1-1-self-explain",
      anchorLabel: "のみます → のむ",
      anchorAudioText: "コーヒーを のむ",
      question: "Why is のむ the dictionary form of のみます, not のみる?",
      rule: {
        text: "のむ is a う-verb: the ます-stem のみ- (い-row) swaps back to its う-row partner のむ. Stem-plus-る is a different verb class (る-verbs), not a universal rule.",
      },
      surface: {
        text: "のみる is also correct — both are accepted dictionary forms.",
      },
      distractor: {
        text: "You always add る to any ます-stem to get the dictionary form.",
      },
      ruleExplanation:
        "う-verb ます-stems end in an い-row sound; the dictionary form swaps that sound back one row to う-row (のみ→のむ, はなし→はなす). Adding る onto the stem is the る-verb pattern only — mixing the two produces a non-word.",
    }),
    speaking("ja-m29-1-1-speak-sentence", "ともだちを てつだう", "I help my friend. (plain)", ["てつだう"]),
    // ── Review tail ──
    vocabMcq("ja-m29-1-1-rev-mcq-1", M29_1_1_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-1-1-rev-lc-1",
      audioText: "がっこうで にほんごを べんきょうします",
      correctMeaningEn: "I study Japanese at school.",
      distractorsEn: [
        "I study English at school.",
        "I studied Japanese yesterday.",
        "I don't study at school.",
      ],
    }),
    speaking("ja-m29-1-1-rev-speak-1", M29_1_1_REVIEW[2].kana, M29_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-1-1-rev", M29_1_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M29_1_1.steps);
assertAnswerRotation(M29_1_1.steps, 1);
assertNoConsecutiveSame(M29_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-1-2 — Dictionary form: う-verbs II (new: さがす, なおす, はこぶ, えらぶ)
// ═══════════════════════════════════════════════════════════════════════

const M29_1_2_REVIEW = pickReviewAtoms("ja-m29-1-2-rev", M29_REVIEW_POOL, 4);

export const M29_1_2: LessonContent = {
  id: "ja-m29-1-2",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "Dictionary form — う-verbs II",
  description:
    "More う-verb dictionary forms in context: さがす, なおす, はこぶ, えらぶ.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m29-1-2-build-sagasu",
      "Pick the dictionary form of: to look for",
      "さがす",
      ["さがします", "さがす", "さがした", "さがして"],
      ["さがす"],
      ["さがす"],
    ),
    vocabMcq(
      "ja-m29-1-2-mcq-sagasu",
      { kana: "さがす", meaningEn: "to look for", emoji: "🔍", fromModule: "m29" },
      M29_REVIEW_POOL,
    ),
    build(
      "ja-m29-1-2-build-naosu",
      "Pick the dictionary form of: to fix, to repair",
      "なおす",
      ["なおします", "なおす", "なおした", "なおして"],
      ["なおす"],
      ["なおす"],
    ),
    listeningCompSentence({
      id: "ja-m29-1-2-lc-naosu",
      audioText: "くるまを なおす。",
      correctMeaningEn: "I fix the car. (plain)",
      distractorsEn: [
        "I bought the car. (plain)",
        "I drive the car. (plain)",
        "I fixed the car. (plain)",
      ],
      exercisedAtomKanas: ["なおす"],
    }),
    build(
      "ja-m29-1-2-build-hakobu",
      "Pick the dictionary form of: to carry",
      "はこぶ",
      ["はこびます", "はこぶ", "はこんだ", "はこんで"],
      ["はこぶ"],
      ["はこぶ"],
    ),
    speaking("ja-m29-1-2-speak-hakobu", "はこぶ", "to carry", ["はこぶ"]),
    build(
      "ja-m29-1-2-build-erabu",
      "Pick the dictionary form of: to choose",
      "えらぶ",
      ["えらびます", "えらぶ", "えらんだ", "えらんで"],
      ["えらぶ"],
      ["えらぶ"],
    ),
    sentenceMcq({
      id: "ja-m29-1-2-mcq-1",
      prompt: "Which means 'I choose a book.' (plain)?",
      correctKana: "ほんを えらぶ。",
      distractorsKana: ["ほんを えらびます。", "ほんを さがす。", "ほんを えらんだ。"],
      explanation: "えらぶ is already the dictionary form — no ます, no past.",
      exercisedAtomKanas: ["えらぶ"],
    }),
    build(
      "ja-m29-1-2-build-sentence-1",
      "Say: I look for my bag.",
      "かばんを さがす",
      ["かばん", "を", "さがす", "さがします", "は"],
      ["かばん", "を", "さがす"],
      ["さがす"],
    ),
    listeningBuildSentence({
      id: "ja-m29-1-2-lb-hakobu",
      target: "にもつを はこぶ",
      tiles: ["にもつ", "を", "はこぶ", "はこびます", "が"],
      correctOrder: ["にもつ", "を", "はこぶ"],
      promptEn: "Hear it, build it: 'I carry the luggage.' (plain)",
      exercisedAtomKanas: ["はこぶ"],
    }),
    sentenceMcq({
      id: "ja-m29-1-2-mcq-2",
      prompt: "Which means 'I fix my bicycle.' (plain)?",
      correctKana: "じてんしゃを なおす。",
      distractorsKana: ["じてんしゃを つかう。", "じてんしゃを えらぶ。", "じてんしゃを なおします。"],
      explanation: "なおす = to fix/repair (plain, dictionary form).",
      exercisedAtomKanas: ["なおす"],
    }),
    translateStep({
      id: "ja-m29-1-2-translate",
      promptEn: "I look for my pen.",
      acceptedAnswers: ["ペンを さがす", "ペンを さがす。"],
      audioText: "ペンを さがす",
      exercisedAtomKanas: ["さがす"],
    }),
    selfExplain({
      id: "ja-m29-1-2-self-explain",
      anchorLabel: "はこぶ vs はこびます",
      anchorAudioText: "にもつを はこぶ",
      question: "What changes between はこびます and はこぶ?",
      rule: {
        text: "Same word, same meaning — only the register changes. ます is the polite form built on the same stem; はこぶ is the plain dictionary form underneath it. Neither is 'more correct.'",
      },
      surface: {
        text: "はこぶ means 'carry' and はこびます means 'is carrying' — different tenses.",
      },
      distractor: {
        text: "はこぶ is only used for questions; はこびます is only used for statements.",
      },
      ruleExplanation:
        "はこびます (polite) and はこぶ (plain) are the SAME verb, same tense, same meaning — register only. Both mean 'carry / will carry,' said two different ways depending on who you're talking to.",
    }),
    speaking("ja-m29-1-2-speak-sentence", "くるまを なおす", "I fix the car. (plain)", ["なおす"]),
    // ── Review tail ──
    vocabMcq("ja-m29-1-2-rev-mcq-1", M29_1_2_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-1-2-rev-lc-1",
      audioText: "としょかんで ほんを よみます",
      correctMeaningEn: "I read a book at the library.",
      distractorsEn: [
        "I buy a book at the library.",
        "I read a book at school.",
        "I read a book every day.",
      ],
    }),
    speaking("ja-m29-1-2-rev-speak-1", M29_1_2_REVIEW[2].kana, M29_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-1-2-rev", M29_1_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M29_1_2.steps);
assertAnswerRotation(M29_1_2.steps, 1);
assertNoConsecutiveSame(M29_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-2-1 — Dictionary form: る-verbs + する (new: かたづける, おぼえる)
// ═══════════════════════════════════════════════════════════════════════

const M29_2_1_REVIEW = pickReviewAtoms("ja-m29-2-1-rev", M29_REVIEW_POOL, 4);

export const M29_2_1: LessonContent = {
  id: "ja-m29-2-1",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "Dictionary form — る-verbs + する",
  description:
    "る-verb dictionary forms + the irregular する. New verbs: かたづける, おぼえる.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_DICT_RU_IRREGULAR,
    build(
      "ja-m29-2-1-build-katazukeru",
      "Pick the dictionary form of: to tidy up",
      "かたづける",
      ["かたづけます", "かたづける", "かたづけた", "かたづけて"],
      ["かたづける"],
      ["かたづける"],
    ),
    listeningCompSentence({
      id: "ja-m29-2-1-lc-katazukeru",
      audioText: "へやを かたづける。",
      correctMeaningEn: "I tidy up my room. (plain)",
      distractorsEn: [
        "I clean my car. (plain)",
        "I tidied up my room. (plain)",
        "I don't tidy up my room. (plain)",
      ],
      exercisedAtomKanas: ["かたづける"],
    }),
    build(
      "ja-m29-2-1-build-oboeru",
      "Pick the dictionary form of: to memorise",
      "おぼえる",
      ["おぼえます", "おぼえる", "おぼえた", "おぼえて"],
      ["おぼえる"],
      ["おぼえる"],
    ),
    vocabMcq(
      "ja-m29-2-1-mcq-oboeru",
      { kana: "おぼえる", meaningEn: "to memorise, to learn", emoji: "🧠", fromModule: "m29" },
      M29_REVIEW_POOL,
    ),
    sentenceMcq({
      id: "ja-m29-2-1-mcq-1",
      prompt: "Which is the dictionary form of たべます (to eat)?",
      correctKana: "たべる",
      distractorsKana: ["たべう", "たべます", "たべた"],
      explanation: "る-verbs: bare stem (たべ-) + る = たべる.",
    }),
    build(
      "ja-m29-2-1-build-suru",
      "Say: I study Japanese. (plain)",
      "にほんごを べんきょうする",
      ["にほんご", "を", "べんきょうする", "べんきょうします", "は"],
      ["にほんご", "を", "べんきょうする"],
    ),
    listeningBuildSentence({
      id: "ja-m29-2-1-lb-oboeru",
      target: "かんじを おぼえる",
      tiles: ["かんじ", "を", "おぼえる", "おぼえます", "が"],
      correctOrder: ["かんじ", "を", "おぼえる"],
      promptEn: "Hear it, build it: 'I memorise kanji.' (plain)",
      exercisedAtomKanas: ["おぼえる"],
    }),
    sentenceMcq({
      id: "ja-m29-2-1-mcq-2",
      prompt: "Which means 'I tidy up my room.' (plain, not ます)?",
      correctKana: "へやを かたづける。",
      distractorsKana: ["へやを かたづけます。", "へやを かたづけた。", "へやを かたづけて。"],
      explanation: "かたづける is already the plain dictionary form.",
      exercisedAtomKanas: ["かたづける"],
    }),
    translateStep({
      id: "ja-m29-2-1-translate",
      promptEn: "I memorise kanji. (plain)",
      acceptedAnswers: ["かんじを おぼえる", "かんじを おぼえる。"],
      audioText: "かんじを おぼえる",
      exercisedAtomKanas: ["おぼえる"],
    }),
    selfExplain({
      id: "ja-m29-2-1-self-explain",
      anchorLabel: "くる is irregular",
      anchorAudioText: "がっこうに くる",
      question: "Why can't you derive くる the same way you derive たべる?",
      rule: {
        text: "くる is one of only two irregular verbs (with する). Its dictionary form doesn't follow the stem-plus-る pattern or any stem-swap rule — it's memorised as a whole word, exactly like する.",
      },
      surface: {
        text: "くる follows the る-verb rule: き- (stem) + る = くる.",
      },
      distractor: {
        text: "くる is a う-verb, so it follows the う-row swap like のむ → のまない.",
      },
      ruleExplanation:
        "する and くる are irregular — neither the う-verb stem-swap nor the る-verb stem-plus-る rule produces them. They're two words to memorise whole; everything else in Japanese verb conjugation is fully regular.",
    }),
    speaking("ja-m29-2-1-speak-sentence", "へやを かたづける", "I tidy up my room. (plain)", ["かたづける"]),
    // ── Review tail ──
    vocabMcq("ja-m29-2-1-rev-mcq-1", M29_2_1_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-2-1-rev-lc-1",
      audioText: "でんしゃで がっこうに いきます",
      correctMeaningEn: "I go to school by train.",
      distractorsEn: [
        "I go to school by bus.",
        "I came from school by train.",
        "I don't go to school by train.",
      ],
    }),
    speaking("ja-m29-2-1-rev-speak-1", M29_2_1_REVIEW[2].kana, M29_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-2-1-rev", M29_2_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M29_2_1.steps);
assertAnswerRotation(M29_2_1.steps, 1);
assertNoConsecutiveSame(M29_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-2-2 — くる irregular + mixed practice (new: ぜんぶ, blocked)
// ═══════════════════════════════════════════════════════════════════════

const M29_2_2_REVIEW = pickReviewAtoms("ja-m29-2-2-rev", M29_REVIEW_POOL, 4);

export const M29_2_2: LessonContent = {
  id: "ja-m29-2-2",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "くる + dictionary form mixed practice",
  description:
    "Drill する/くる against る-verbs and う-verbs together. New: ぜんぶ (all, everything).",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m29-2-2-build-kuru",
      "Say: My friend comes. (plain)",
      "ともだちが くる",
      ["ともだち", "が", "くる", "きます", "は"],
      ["ともだち", "が", "くる"],
    ),
    listeningCompSentence({
      id: "ja-m29-2-2-lc-zenbu",
      audioText: "ぜんぶ おぼえる。",
      correctMeaningEn: "I'll memorise all of it. (plain)",
      distractorsEn: [
        "I'll forget all of it. (plain)",
        "I memorised half of it. (plain)",
        "I'll tidy up all of it. (plain)",
      ],
      exercisedAtomKanas: ["ぜんぶ"],
    }),
    sentenceMcq({
      id: "ja-m29-2-2-mcq-1",
      prompt: "Which is the dictionary form of みます (to watch)?",
      correctKana: "みる",
      distractorsKana: ["みう", "みます", "みた"],
      explanation: "る-verb: bare stem み- + る = みる.",
    }),
    build(
      "ja-m29-2-2-build-2",
      "Say: I'll carry everything. (plain)",
      "ぜんぶ はこぶ",
      ["ぜんぶ", "はこぶ", "はこびます", "を"],
      ["ぜんぶ", "はこぶ"],
      ["ぜんぶ", "はこぶ"],
    ),
    speaking("ja-m29-2-2-speak-1", "ともだちが くる", "My friend comes. (plain)"),
    listeningBuildSentence({
      id: "ja-m29-2-2-lb-1",
      target: "せんせいが くる",
      tiles: ["せんせい", "が", "くる", "きます", "を"],
      correctOrder: ["せんせい", "が", "くる"],
      promptEn: "Hear it, build it: 'The teacher comes.' (plain)",
    }),
    sentenceMcq({
      id: "ja-m29-2-2-mcq-2",
      prompt: "Which means 'I choose everything.' (plain)?",
      correctKana: "ぜんぶ えらぶ。",
      distractorsKana: ["ぜんぶ さがす。", "ぜんぶ えらびます。", "ぜんぶ えらんだ。"],
      explanation: "ぜんぶ (all) + えらぶ (dictionary form of choose).",
      exercisedAtomKanas: ["ぜんぶ", "えらぶ"],
    }),
    translateStep({
      id: "ja-m29-2-2-translate",
      promptEn: "My friend comes. (plain)",
      acceptedAnswers: ["ともだちが くる", "ともだちが くる。"],
      audioText: "ともだちが くる",
    }),
    selfExplain({
      id: "ja-m29-2-2-self-explain",
      anchorLabel: "する/くる vs regular verbs",
      anchorAudioText: "にほんごを べんきょうする",
      question: "Why do する and くる get their own grammar rule instead of following the う/る patterns?",
      rule: {
        text: "They're irregular — their dictionary, ない, た, and なかった forms don't derive from any stem-swap rule. Every other Japanese verb is fully regular once you know if it's う-type or る-type; these two are memorised as exceptions.",
      },
      surface: {
        text: "する and くる are actually る-verbs, just spelled unusually.",
      },
      distractor: {
        text: "する and くる only exist in the plain form — they have no ます equivalent.",
      },
      ruleExplanation:
        "する/くる (irregular) are the ONLY two exceptions in the entire Japanese verb system. Both have full ます-forms (します/きます) and full plain conjugations (する/しない/した/しなかった, くる/こない/きた/こなかった) — just not derived by any stem rule.",
    }),
    speaking("ja-m29-2-2-speak-2", "ぜんぶ はこぶ", "I'll carry everything. (plain)", ["ぜんぶ", "はこぶ"]),
    // ── Review tail ──
    vocabMcq("ja-m29-2-2-rev-mcq-1", M29_2_2_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-2-2-rev-lc-1",
      audioText: "としょかんに ほんが あります",
      correctMeaningEn: "There are books in the library.",
      distractorsEn: [
        "There is no library.",
        "The library has a book store.",
        "There was a book in the library.",
      ],
    }),
    speaking("ja-m29-2-2-rev-speak-1", M29_2_2_REVIEW[2].kana, M29_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-2-2-rev", M29_2_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M29_2_2.steps);
assertAnswerRotation(M29_2_2.steps, 1);
assertNoConsecutiveSame(M29_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-3-1 — ない form (plain negative), う-verbs
// ═══════════════════════════════════════════════════════════════════════

const M29_3_1_REVIEW = pickReviewAtoms("ja-m29-3-1-rev", M29_REVIEW_POOL, 4);

export const M29_3_1: LessonContent = {
  id: "ja-m29-3-1",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "ない form — plain negative I",
  description:
    "Build the plain negative on う-verbs: のまない, はなさない, てつだわない.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_NAI,
    build(
      "ja-m29-3-1-build-1",
      "Say: I'm not drinking coffee. (plain)",
      "コーヒーを のまない",
      ["コーヒー", "を", "のまない", "のみます", "のむ"],
      ["コーヒー", "を", "のまない"],
      ["コーヒー"],
    ),
    listeningCompSentence({
      id: "ja-m29-3-1-lc-1",
      audioText: "きょうは はたらかない。",
      correctMeaningEn: "I'm not working today. (plain)",
      distractorsEn: [
        "I worked today. (plain)",
        "I'm working today. (plain)",
        "I didn't work today. (plain)",
      ],
    }),
    build(
      "ja-m29-3-1-build-2",
      "Say: I'm not helping my friend. (plain)",
      "ともだちを てつだわない",
      ["ともだち", "を", "てつだわない", "てつだいます", "てつだう"],
      ["ともだち", "を", "てつだわない"],
      ["てつだう"],
    ),
    sentenceMcq({
      id: "ja-m29-3-1-mcq-1",
      prompt: "Which is the ない-form of はなす (to speak)?",
      correctKana: "はなさない",
      distractorsKana: ["はなあない", "はなしない", "はなさなくて"],
      explanation: "はなす → stem-final す swaps to さ (う-row → あ-row) + ない.",
    }),
    build(
      "ja-m29-3-1-build-3",
      "Say: I don't use a pen. (plain)",
      "ペンを つかわない",
      ["ペン", "を", "つかわない", "つかいます", "つかう"],
      ["ペン", "を", "つかわない"],
      ["つかう"],
    ),
    speaking("ja-m29-3-1-speak-1", "きょうは はたらかない", "I'm not working today. (plain)"),
    listeningBuildSentence({
      id: "ja-m29-3-1-lb-1",
      target: "テレビを みない",
      tiles: ["テレビ", "を", "みない", "みます", "みる"],
      correctOrder: ["テレビ", "を", "みない"],
      promptEn: "Hear it, build it: 'I'm not watching TV.' (plain)",
    }),
    sentenceMcq({
      id: "ja-m29-3-1-mcq-2",
      prompt: "Which is the ない-form of かう (to buy)?",
      correctKana: "かわない",
      distractorsKana: ["かあない", "かいない", "かうない"],
      explanation: "Verbs ending in う (the literal kana) take わ before ない — う → わ, not あ.",
    }),
    translateStep({
      id: "ja-m29-3-1-translate",
      promptEn: "I'm not helping my friend. (plain)",
      acceptedAnswers: ["ともだちを てつだわない", "ともだちを てつだわない。"],
      audioText: "ともだちを てつだわない",
      exercisedAtomKanas: ["てつだう"],
    }),
    selfExplain({
      id: "ja-m29-3-1-self-explain",
      anchorLabel: "てつだわない — why わ, not あ",
      anchorAudioText: "ともだちを てつだわない",
      question: "Why does てつだう become てつだわない, not てつだあない?",
      rule: {
        text: "Verbs whose dictionary form ends in the literal kana う (かう, てつだう, うたう) take わ before ない — あ alone has no consonant to carry the sound, so the historical わ surfaces instead.",
      },
      surface: {
        text: "あ and わ are interchangeable before ない; either spelling is correct.",
      },
      distractor: {
        text: "てつだう is an exception verb that doesn't follow any ない-form rule.",
      },
      ruleExplanation:
        "This is fully regular: EVERY う-ending verb (かう→かわない, うたう→うたわない, てつだう→てつだわない) takes わ before ない. It's not an exception — it's the predictable outcome of う-row → あ-row shifting for this one specific final kana.",
    }),
    speaking("ja-m29-3-1-speak-2", "コーヒーを のまない", "I'm not drinking coffee. (plain)", ["コーヒー"]),
    // ── Review tail ──
    vocabMcq("ja-m29-3-1-rev-mcq-1", M29_3_1_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-3-1-rev-lc-1",
      audioText: "まいあさ しんぶんを よみます",
      correctMeaningEn: "I read the newspaper every morning.",
      distractorsEn: [
        "I read a book every morning.",
        "I read the newspaper every night.",
        "I don't read the newspaper.",
      ],
    }),
    speaking("ja-m29-3-1-rev-speak-1", M29_3_1_REVIEW[2].kana, M29_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-3-1-rev", M29_3_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M29_3_1.steps);
assertAnswerRotation(M29_3_1.steps, 1);
assertNoConsecutiveSame(M29_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-3-2 — ない form II: る-verbs + する/くる + mixed
// ═══════════════════════════════════════════════════════════════════════

const M29_3_2_REVIEW = pickReviewAtoms("ja-m29-3-2-rev", M29_REVIEW_POOL, 4);

export const M29_3_2: LessonContent = {
  id: "ja-m29-3-2",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "ない form — plain negative II",
  description:
    "ない form on る-verbs + irregulars, mixed with う-verbs from 3-1.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m29-3-2-build-1",
      "Say: I don't tidy up my room. (plain)",
      "へやを かたづけない",
      ["へや", "を", "かたづけない", "かたづけます", "かたづける"],
      ["へや", "を", "かたづけない"],
      ["かたづける"],
    ),
    listeningCompSentence({
      id: "ja-m29-3-2-lc-1",
      audioText: "にほんごを べんきょうしない。",
      correctMeaningEn: "I'm not studying Japanese. (plain)",
      distractorsEn: [
        "I studied Japanese. (plain)",
        "I'm studying Japanese. (plain)",
        "I didn't study Japanese. (plain)",
      ],
    }),
    build(
      "ja-m29-3-2-build-2",
      "Say: My friend doesn't come. (plain)",
      "ともだちが こない",
      ["ともだち", "が", "こない", "きます", "くる"],
      ["ともだち", "が", "こない"],
    ),
    sentenceMcq({
      id: "ja-m29-3-2-mcq-1",
      prompt: "Which is the ない-form of おぼえる (to memorise)?",
      correctKana: "おぼえない",
      distractorsKana: ["おぼわない", "おぼえらない", "おぼえるない"],
      explanation: "る-verb: drop る, add ない — おぼえる → おぼえない.",
      exercisedAtomKanas: ["おぼえる"],
    }),
    build(
      "ja-m29-3-2-build-3",
      "Say: I don't look for my bag. (plain)",
      "かばんを さがさない",
      ["かばん", "を", "さがさない", "さがします", "さがす"],
      ["かばん", "を", "さがさない"],
      ["さがす"],
    ),
    speaking("ja-m29-3-2-speak-1", "ともだちが こない", "My friend doesn't come. (plain)"),
    listeningBuildSentence({
      id: "ja-m29-3-2-lb-1",
      target: "しゅくだいを しない",
      tiles: ["しゅくだい", "を", "しない", "します", "する"],
      correctOrder: ["しゅくだい", "を", "しない"],
      promptEn: "Hear it, build it: 'I'm not doing homework.' (plain)",
    }),
    sentenceMcq({
      id: "ja-m29-3-2-mcq-2",
      prompt: "Which means 'I'm not carrying everything.' (plain)?",
      correctKana: "ぜんぶ はこばない。",
      distractorsKana: ["ぜんぶ はこびません。", "ぜんぶ はこんだ。", "ぜんぶ はこぶ。"],
      explanation: "はこぶ → はこば- (う-row → あ-row) + ない.",
      exercisedAtomKanas: ["ぜんぶ", "はこぶ"],
    }),
    translateStep({
      id: "ja-m29-3-2-translate",
      promptEn: "I'm not tidying up my room. (plain)",
      acceptedAnswers: ["へやを かたづけない", "へやを かたづけない。"],
      audioText: "へやを かたづけない",
      exercisedAtomKanas: ["かたづける"],
    }),
    selfExplain({
      id: "ja-m29-3-2-self-explain",
      anchorLabel: "かたづけない vs さがさない",
      anchorAudioText: "へやを かたづけない",
      question: "Why does かたづける just drop る, while さがす swaps a whole sound before adding ない?",
      rule: {
        text: "かたづける is a る-verb (bare stem + る); the negative just removes that る and adds ない. さがす is a う-verb; its negative needs the う-row→あ-row swap (さがす→さがさ-) before ない. Two different verb classes, two different attachment mechanics.",
      },
      surface: {
        text: "All negatives just add ない to the dictionary form, regardless of verb type.",
      },
      distractor: {
        text: "かたづける is irregular, which is why its negative looks simpler.",
      },
      ruleExplanation:
        "る-verb negatives: drop る, add ない (simplest case). う-verb negatives: swap the final う-row kana to あ-row, add ない (one extra step). かたづける is a regular る-verb, not an exception — its negative is just structurally simpler than a う-verb's.",
    }),
    speaking("ja-m29-3-2-speak-2", "にほんごを べんきょうしない", "I'm not studying Japanese. (plain)"),
    // ── Review tail ──
    vocabMcq("ja-m29-3-2-rev-mcq-1", M29_3_2_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-3-2-rev-lc-1",
      audioText: "こうえんで はしります",
      correctMeaningEn: "I run in the park.",
      distractorsEn: [
        "I walk in the park.",
        "I run at school.",
        "I ran in the park yesterday.",
      ],
    }),
    speaking("ja-m29-3-2-rev-speak-1", M29_3_2_REVIEW[2].kana, M29_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-3-2-rev", M29_3_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M29_3_2.steps);
assertAnswerRotation(M29_3_2.steps, 1);
assertNoConsecutiveSame(M29_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-4-1 — た form (plain past), leveraging て-form
// ═══════════════════════════════════════════════════════════════════════

const M29_4_1_REVIEW = pickReviewAtoms("ja-m29-4-1-rev", M29_REVIEW_POOL, 4);

export const M29_4_1: LessonContent = {
  id: "ja-m29-4-1",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "た form — plain past I",
  description:
    "Build the plain past from the て-form you already know: のんだ, たべた, いった.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_TA,
    build(
      "ja-m29-4-1-build-1",
      "Say: I drank coffee. (plain)",
      "コーヒーを のんだ",
      ["コーヒー", "を", "のんだ", "のみます", "のんで"],
      ["コーヒー", "を", "のんだ"],
    ),
    listeningCompSentence({
      id: "ja-m29-4-1-lc-1",
      audioText: "あさごはんを たべた。",
      correctMeaningEn: "I ate breakfast. (plain)",
      distractorsEn: [
        "I'm eating breakfast. (plain)",
        "I'm not eating breakfast. (plain)",
        "I ate dinner. (plain)",
      ],
    }),
    kanjiReading("ja-m29-4-1-kr-taberu", { kana: "たべる", meaningEn: "to eat", fromModule: "m7" }),
    build(
      "ja-m29-4-1-build-2",
      "Say: I went to school. (plain)",
      "がっこうに いった",
      ["がっこう", "に", "いった", "いきます", "いって"],
      ["がっこう", "に", "いった"],
    ),
    sentenceMcq({
      id: "ja-m29-4-1-mcq-1",
      prompt: "Which is the た-form of はなす (to speak)?",
      correctKana: "はなした",
      distractorsKana: ["はなんだ", "はないた", "はなした です"],
      explanation: "はなす's て-form is はなして; swap て→た gives はなした.",
    }),
    build(
      "ja-m29-4-1-build-3",
      "Say: I helped my friend. (plain)",
      "ともだちを てつだった",
      ["ともだち", "を", "てつだった", "てつだいます", "てつだって"],
      ["ともだち", "を", "てつだった"],
      ["てつだう"],
    ),
    speaking("ja-m29-4-1-speak-1", "がっこうに いった", "I went to school. (plain)"),
    listeningBuildSentence({
      id: "ja-m29-4-1-lb-1",
      target: "ほんを よんだ",
      tiles: ["ほん", "を", "よんだ", "よみます", "よんで"],
      correctOrder: ["ほん", "を", "よんだ"],
      promptEn: "Hear it, build it: 'I read the book.' (plain)",
    }),
    sentenceMcq({
      id: "ja-m29-4-1-mcq-2",
      prompt: "Which means 'I tidied up my room.' (plain)?",
      correctKana: "へやを かたづけた。",
      distractorsKana: ["へやを かたづけます。", "へやを かたづけない。", "へやを かたづけて。"],
      explanation: "かたづける's て-form is かたづけて; swap て→た gives かたづけた.",
      exercisedAtomKanas: ["かたづける"],
    }),
    translateStep({
      id: "ja-m29-4-1-translate",
      promptEn: "I helped my friend. (plain)",
      acceptedAnswers: ["ともだちを てつだった", "ともだちを てつだった。"],
      audioText: "ともだちを てつだった",
      exercisedAtomKanas: ["てつだう"],
    }),
    selfExplain({
      id: "ja-m29-4-1-self-explain",
      anchorLabel: "のんで → のんだ",
      anchorAudioText: "コーヒーを のんだ",
      question: "Why is のんだ the easiest new form to learn in this whole module?",
      rule: {
        text: "た-form is a one-letter swap on the て-form you already use for ています, てください, and more — て→た, で→だ. No new sound changes to learn: if のんで is already automatic, のんだ is free.",
      },
      surface: {
        text: "た-form has its own separate stem-change rules, unrelated to て-form.",
      },
      distractor: {
        text: "た-form only works for る-verbs; う-verbs use a different past pattern entirely.",
      },
      ruleExplanation:
        "た-form = て-form with て→た / で→だ, for EVERY verb class (う-verbs, る-verbs, irregulars) without exception. All the irregular sound changes (のむ→のんで, いく→いって) were already learned when you met て-form — this module just reuses them.",
    }),
    speaking("ja-m29-4-1-speak-2", "あさごはんを たべた", "I ate breakfast. (plain)"),
    // ── Review tail ──
    vocabMcq("ja-m29-4-1-rev-mcq-1", M29_4_1_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-4-1-rev-lc-1",
      audioText: "デパートで かばんを かいました",
      correctMeaningEn: "I bought a bag at the department store.",
      distractorsEn: [
        "I bought a bag at the convenience store.",
        "I'm buying a bag at the department store.",
        "I sold a bag at the department store.",
      ],
    }),
    speaking("ja-m29-4-1-rev-speak-1", M29_4_1_REVIEW[2].kana, M29_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-4-1-rev", M29_4_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M29_4_1.steps);
assertAnswerRotation(M29_4_1.steps, 1);
assertNoConsecutiveSame(M29_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-4-2 — た form II: irregulars + mixed practice
// ═══════════════════════════════════════════════════════════════════════

const M29_4_2_REVIEW = pickReviewAtoms("ja-m29-4-2-rev", M29_REVIEW_POOL, 4);

export const M29_4_2: LessonContent = {
  id: "ja-m29-4-2",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "た form — plain past II",
  description:
    "する/くる past tense + mixed う/る-verb た-form practice.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m29-4-2-build-1",
      "Say: I studied Japanese. (plain)",
      "にほんごを べんきょうした",
      ["にほんご", "を", "べんきょうした", "べんきょうします", "べんきょうして"],
      ["にほんご", "を", "べんきょうした"],
    ),
    listeningCompSentence({
      id: "ja-m29-4-2-lc-1",
      audioText: "ともだちが きた。",
      correctMeaningEn: "My friend came. (plain)",
      distractorsEn: [
        "My friend is coming. (plain)",
        "My friend didn't come. (plain)",
        "My friend went. (plain)",
      ],
    }),
    build(
      "ja-m29-4-2-build-2",
      "Say: I memorised kanji. (plain)",
      "かんじを おぼえた",
      ["かんじ", "を", "おぼえた", "おぼえます", "おぼえて"],
      ["かんじ", "を", "おぼえた"],
      ["おぼえる"],
    ),
    sentenceMcq({
      id: "ja-m29-4-2-mcq-1",
      prompt: "Which is the た-form of つかう (to use)?",
      correctKana: "つかった",
      distractorsKana: ["つかんだ", "つかいた", "つかあった"],
      explanation: "つかう's て-form is つかって; swap て→た gives つかった.",
      exercisedAtomKanas: ["つかう"],
    }),
    build(
      "ja-m29-4-2-build-3",
      "Say: I looked for my pen. (plain)",
      "ペンを さがした",
      ["ペン", "を", "さがした", "さがします", "さがして"],
      ["ペン", "を", "さがした"],
      ["さがす"],
    ),
    speaking("ja-m29-4-2-speak-1", "ともだちが きた", "My friend came. (plain)"),
    listeningBuildSentence({
      id: "ja-m29-4-2-lb-1",
      target: "にもつを はこんだ",
      tiles: ["にもつ", "を", "はこんだ", "はこびます", "はこんで"],
      correctOrder: ["にもつ", "を", "はこんだ"],
      promptEn: "Hear it, build it: 'I carried the luggage.' (plain)",
      exercisedAtomKanas: ["はこぶ"],
    }),
    sentenceMcq({
      id: "ja-m29-4-2-mcq-2",
      prompt: "Which means 'I chose everything.' (plain)?",
      correctKana: "ぜんぶ えらんだ。",
      distractorsKana: ["ぜんぶ えらびます。", "ぜんぶ えらばない。", "ぜんぶ えらぶ。"],
      explanation: "えらぶ's て-form is えらんで; swap て→た gives えらんだ.",
      exercisedAtomKanas: ["ぜんぶ", "えらぶ"],
    }),
    translateStep({
      id: "ja-m29-4-2-translate",
      promptEn: "I studied Japanese. (plain)",
      acceptedAnswers: ["にほんごを べんきょうした", "にほんごを べんきょうした。"],
      audioText: "にほんごを べんきょうした",
    }),
    selfExplain({
      id: "ja-m29-4-2-self-explain",
      anchorLabel: "きた vs いった",
      anchorAudioText: "ともだちが きた",
      question: "Why is くる's past きた, when its ない-form is こない?",
      rule: {
        text: "くる is irregular in every plain form, and each form uses a DIFFERENT stem sound: こ (ない), き (た), く (dictionary). This isn't one rule reapplied — it's a small memorised set, like English 'go/went/gone.'",
      },
      surface: {
        text: "きた follows the same こ-stem as こない, just with different endings.",
      },
      distractor: {
        text: "きた is a typo-prone irregularity that most speakers actually say こた.",
      },
      ruleExplanation:
        "くる's forms use three different vowel-stems (く-る, こ-ない, き-た) — genuinely irregular, not derivable from one pattern. Compare する: し-ない, し-た, する — also three stems. Both must simply be memorised as sets.",
    }),
    speaking("ja-m29-4-2-speak-2", "かんじを おぼえた", "I memorised kanji. (plain)", ["おぼえる"]),
    // ── Review tail ──
    vocabMcq("ja-m29-4-2-rev-mcq-1", M29_4_2_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-4-2-rev-lc-1",
      audioText: "きのう えいがを みました",
      correctMeaningEn: "I watched a movie yesterday.",
      distractorsEn: [
        "I'm watching a movie today.",
        "I watched TV yesterday.",
        "I didn't watch a movie yesterday.",
      ],
    }),
    speaking("ja-m29-4-2-rev-speak-1", M29_4_2_REVIEW[2].kana, M29_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-4-2-rev", M29_4_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M29_4_2.steps);
assertAnswerRotation(M29_4_2.steps, 1);
assertNoConsecutiveSame(M29_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-5-1 — なかった (plain past negative) I
// ═══════════════════════════════════════════════════════════════════════

const M29_5_1_REVIEW = pickReviewAtoms("ja-m29-5-1-rev", M29_REVIEW_POOL, 4);

export const M29_5_1: LessonContent = {
  id: "ja-m29-5-1",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "なかった — plain past negative I",
  description:
    "Build the plain past negative like an い-adjective past: のまなかった, たべなかった.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_NAKATTA,
    build(
      "ja-m29-5-1-build-1",
      "Say: I didn't drink coffee. (plain)",
      "コーヒーを のまなかった",
      ["コーヒー", "を", "のまなかった", "のみません", "のまない"],
      ["コーヒー", "を", "のまなかった"],
    ),
    listeningCompSentence({
      id: "ja-m29-5-1-lc-1",
      audioText: "きのうは はたらかなかった。",
      correctMeaningEn: "I didn't work yesterday. (plain)",
      distractorsEn: [
        "I'm not working yesterday. (plain)",
        "I worked yesterday. (plain)",
        "I'm not working today. (plain)",
      ],
    }),
    build(
      "ja-m29-5-1-build-2",
      "Say: I didn't eat breakfast. (plain)",
      "あさごはんを たべなかった",
      ["あさごはん", "を", "たべなかった", "たべません", "たべない"],
      ["あさごはん", "を", "たべなかった"],
    ),
    sentenceMcq({
      id: "ja-m29-5-1-mcq-1",
      prompt: "Which is the past negative of てつだう (to help)?",
      correctKana: "てつだわなかった",
      distractorsKana: ["てつだわないだった", "てつだあなかった", "てつだったかった"],
      explanation: "てつだわない → drop い, add かった → てつだわなかった.",
      exercisedAtomKanas: ["てつだう"],
    }),
    build(
      "ja-m29-5-1-build-3",
      "Say: My friend didn't come. (plain)",
      "ともだちは こなかった",
      ["ともだち", "は", "こなかった", "きません", "こない"],
      ["ともだち", "は", "こなかった"],
    ),
    speaking("ja-m29-5-1-speak-1", "きのうは はたらかなかった", "I didn't work yesterday. (plain)"),
    listeningBuildSentence({
      id: "ja-m29-5-1-lb-1",
      target: "しゅくだいを しなかった",
      tiles: ["しゅくだい", "を", "しなかった", "しません", "しない"],
      correctOrder: ["しゅくだい", "を", "しなかった"],
      promptEn: "Hear it, build it: 'I didn't do homework.' (plain)",
    }),
    sentenceMcq({
      id: "ja-m29-5-1-mcq-2",
      prompt: "Which means 'I didn't fix the car.' (plain)?",
      correctKana: "くるまを なおさなかった。",
      distractorsKana: ["くるまを なおしません。", "くるまを なおさない。", "くるまを なおした。"],
      explanation: "なおさない → drop い, add かった → なおさなかった.",
      exercisedAtomKanas: ["なおす"],
    }),
    translateStep({
      id: "ja-m29-5-1-translate",
      promptEn: "My friend didn't come. (plain)",
      acceptedAnswers: ["ともだちは こなかった", "ともだちは こなかった。"],
      audioText: "ともだちは こなかった",
    }),
    selfExplain({
      id: "ja-m29-5-1-self-explain",
      anchorLabel: "たかい → たかかった vs たべない → たべなかった",
      anchorAudioText: "あさごはんを たべなかった",
      question: "What do たかかった (was expensive) and たべなかった (didn't eat) have structurally in common?",
      rule: {
        text: "Both are い-type words in their past tense: drop the final い, add かった. ない behaves exactly like an い-adjective for tense purposes — that's why the past-negative rule is 'the い-adjective past rule,' not a brand-new mechanism.",
      },
      surface: {
        text: "They're unrelated — one is an adjective rule, the other is a verb rule.",
      },
      distractor: {
        text: "ない only takes かった when the verb is transitive.",
      },
      ruleExplanation:
        "ない is grammatically an い-adjective (it even conjugates like one elsewhere: ないです, なくて). So its past, なかった, is formed with the SAME い→かった swap as any other い-adjective. One past-tense rule, reused.",
    }),
    speaking("ja-m29-5-1-speak-2", "コーヒーを のまなかった", "I didn't drink coffee. (plain)"),
    // ── Review tail ──
    vocabMcq("ja-m29-5-1-rev-mcq-1", M29_5_1_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-5-1-rev-lc-1",
      audioText: "きょうは あめが ふりませんでした",
      correctMeaningEn: "It didn't rain today.",
      distractorsEn: [
        "It rained today.",
        "It didn't rain yesterday.",
        "It's raining today.",
      ],
    }),
    speaking("ja-m29-5-1-rev-speak-1", M29_5_1_REVIEW[2].kana, M29_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-5-1-rev", M29_5_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M29_5_1.steps);
assertAnswerRotation(M29_5_1.steps, 1);
assertNoConsecutiveSame(M29_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-5-2 — なかった II + じぶん/ともだち context (review vocab)
// ═══════════════════════════════════════════════════════════════════════

const M29_5_2_REVIEW = pickReviewAtoms("ja-m29-5-2-rev", M29_REVIEW_POOL, 4);

export const M29_5_2: LessonContent = {
  id: "ja-m29-5-2",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "なかった — plain past negative II",
  description:
    "All four plain forms so far, in context with ともだち and じぶん.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m29-5-2-build-1",
      "Say: My friend didn't help me. (plain)",
      "ともだちは てつだわなかった",
      ["ともだち", "は", "てつだわなかった", "てつだいません", "てつだわない"],
      ["ともだち", "は", "てつだわなかった"],
      ["ともだち", "てつだう"],
    ),
    listeningCompSentence({
      id: "ja-m29-5-2-lc-1",
      audioText: "じぶんで へやを かたづけなかった。",
      correctMeaningEn: "I didn't tidy up my own room. (plain)",
      distractorsEn: [
        "I tidied up my own room. (plain)",
        "My friend didn't tidy up the room. (plain)",
        "I'm not tidying up my own room. (plain)",
      ],
      exercisedAtomKanas: ["かたづける"],
    }),
    build(
      "ja-m29-5-2-build-2",
      "Say: I didn't hurry. (plain)",
      "いそがなかった",
      ["いそがなかった", "いそぎません", "いそがない", "いそいだ"],
      ["いそがなかった"],
      ["いそぐ"],
    ),
    sentenceMcq({
      id: "ja-m29-5-2-mcq-1",
      prompt: "Which means 'I didn't memorise everything.' (plain)?",
      correctKana: "ぜんぶ おぼえなかった。",
      distractorsKana: ["ぜんぶ おぼえません。", "ぜんぶ おぼえない。", "ぜんぶ おぼえた。"],
      explanation: "おぼえない → drop い, add かった → おぼえなかった.",
      exercisedAtomKanas: ["ぜんぶ", "おぼえる"],
    }),
    build(
      "ja-m29-5-2-build-3",
      "Say: I didn't choose a book by myself.",
      "じぶんで ほんを えらばなかった",
      ["じぶん", "で", "ほん", "を", "えらばなかった", "えらびません"],
      ["じぶん", "で", "ほん", "を", "えらばなかった"],
      ["えらぶ"],
    ),
    speaking("ja-m29-5-2-speak-1", "いそがなかった", "I didn't hurry. (plain)", ["いそぐ"]),
    listeningBuildSentence({
      id: "ja-m29-5-2-lb-1",
      target: "ともだちは こなかった",
      tiles: ["ともだち", "は", "こなかった", "きません", "こない"],
      correctOrder: ["ともだち", "は", "こなかった"],
      promptEn: "Hear it, build it: 'My friend didn't come.' (plain)",
    }),
    sentenceMcq({
      id: "ja-m29-5-2-mcq-2",
      prompt: "Which correctly negates the past of なおす (to fix)?",
      correctKana: "なおさなかった",
      distractorsKana: ["なおしませんでした です", "なおさないだった", "なおしなかった"],
      explanation: "なおさない → drop い, add かった → なおさなかった.",
      exercisedAtomKanas: ["なおす"],
    }),
    translateStep({
      id: "ja-m29-5-2-translate",
      promptEn: "My friend didn't help me. (plain)",
      acceptedAnswers: ["ともだちは てつだわなかった", "ともだちは てつだわなかった。"],
      audioText: "ともだちは てつだわなかった",
      exercisedAtomKanas: ["ともだち", "てつだう"],
    }),
    selfExplain({
      id: "ja-m29-5-2-self-explain",
      anchorLabel: "じぶんで — 'by myself'",
      anchorAudioText: "じぶんで へやを かたづけなかった",
      question: "What role does じぶんで play in じぶんで へやを かたづけなかった?",
      rule: {
        text: "じぶん (oneself) + で marks the means/manner — 'by one's own effort,' i.e. without help. It modifies HOW the action happened (or didn't), not who the subject is — が/Ø already carries that job.",
      },
      surface: {
        text: "じぶんで is the subject marker here, replacing が.",
      },
      distractor: {
        text: "じぶんで only appears in negative sentences.",
      },
      ruleExplanation:
        "じぶんで = 'by oneself, unaided' — で marks manner/means (the same で you know from どうやって/交通手段), not a subject. The clause's subject stays a silent Ø-subject filled from context, exactly per the が/は model.",
    }),
    speaking("ja-m29-5-2-speak-2", "じぶんで ほんを えらばなかった", "I didn't choose a book by myself.", ["えらぶ"]),
    // ── Review tail ──
    vocabMcq("ja-m29-5-2-rev-mcq-1", M29_5_2_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-5-2-rev-lc-1",
      audioText: "せんせいは にほんじんです",
      correctMeaningEn: "The teacher is Japanese.",
      distractorsEn: [
        "The teacher is American.",
        "The student is Japanese.",
        "The teacher was Japanese.",
      ],
    }),
    speaking("ja-m29-5-2-rev-speak-1", M29_5_2_REVIEW[2].kana, M29_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-5-2-rev", M29_5_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M29_5_2.steps);
assertAnswerRotation(M29_5_2.steps, 1);
assertNoConsecutiveSame(M29_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-6-1 — Mixed plain-form interleave I (all four forms rotating)
// ═══════════════════════════════════════════════════════════════════════

const M29_6_1_REVIEW = pickReviewAtoms("ja-m29-6-1-rev", M29_REVIEW_POOL, 4);

export const M29_6_1: LessonContent = {
  id: "ja-m29-6-1",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed plain-form interleave I",
  description:
    "Dictionary, ない, た, and なかった forms rotating on the same verbs.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m29-6-1-build-1",
      "Say: I use a bicycle. (plain, dictionary form)",
      "じてんしゃを つかう",
      ["じてんしゃ", "を", "つかう", "つかわない", "つかった"],
      ["じてんしゃ", "を", "つかう"],
      ["つかう"],
    ),
    listeningCompSentence({
      id: "ja-m29-6-1-lc-1",
      audioText: "きのう じてんしゃを つかわなかった。",
      correctMeaningEn: "I didn't use a bicycle yesterday. (plain)",
      distractorsEn: [
        "I don't use a bicycle. (plain)",
        "I used a bicycle yesterday. (plain)",
        "I didn't use a car yesterday. (plain)",
      ],
      exercisedAtomKanas: ["つかう"],
    }),
    kanjiReading(
      "ja-m29-6-1-kr-yomu",
      { kana: "よむ", meaningEn: "to read", fromModule: "m7" },
      { distractors: ["どくむ", "よんだ", "よみ"] },
    ),
    build(
      "ja-m29-6-1-build-2",
      "Say: I didn't hurry yesterday. (plain)",
      "きのう いそがなかった",
      ["きのう", "いそがなかった", "いそぎません", "いそいだ"],
      ["きのう", "いそがなかった"],
      ["いそぐ"],
    ),
    sentenceMcq({
      id: "ja-m29-6-1-mcq-1",
      prompt: "Which form is こない — dictionary, ない, た, or なかった?",
      correctKana: "ない-form (plain negative)",
      distractorsKana: ["dictionary form", "た-form (plain past)", "なかった-form (plain past negative)"],
      explanation: "こない = くる's negative (こ- stem + ない).",
    }),
    build(
      "ja-m29-6-1-build-3",
      "Say: I looked for my pen yesterday. (plain)",
      "きのう ペンを さがした",
      ["きのう", "ペン", "を", "さがした", "さがしません", "さがす"],
      ["きのう", "ペン", "を", "さがした"],
      ["さがす"],
    ),
    speaking("ja-m29-6-1-speak-1", "じてんしゃを つかう", "I use a bicycle. (plain)", ["つかう"]),
    listeningBuildSentence({
      id: "ja-m29-6-1-lb-1",
      target: "へやを かたづけた",
      tiles: ["へや", "を", "かたづけた", "かたづけません", "かたづける"],
      correctOrder: ["へや", "を", "かたづけた"],
      promptEn: "Hear it, build it: 'I tidied up my room.' (plain)",
      exercisedAtomKanas: ["かたづける"],
    }),
    sentenceMcq({
      id: "ja-m29-6-1-mcq-2",
      prompt: "Which is the ない-form of はこぶ (to carry)?",
      correctKana: "はこばない",
      distractorsKana: ["はこあない", "はこんない", "はこびない"],
      explanation: "はこぶ → う-row ぶ → あ-row ば + ない.",
      exercisedAtomKanas: ["はこぶ"],
    }),
    translateStep({
      id: "ja-m29-6-1-translate",
      promptEn: "I didn't use a bicycle yesterday. (plain)",
      acceptedAnswers: ["きのう じてんしゃを つかわなかった", "きのう じてんしゃを つかわなかった。"],
      audioText: "きのう じてんしゃを つかわなかった",
      exercisedAtomKanas: ["つかう"],
    }),
    selfExplain({
      id: "ja-m29-6-1-self-explain",
      anchorLabel: "Four forms, one verb: つかう family",
      anchorAudioText: "じてんしゃを つかう",
      question: "つかう, つかわない, つかった, つかわなかった — what's the fastest way to keep these straight?",
      rule: {
        text: "Build outward from the dictionary form: ない-form swaps the final sound + adds ない; た-form reuses the て-form's sound change with た; なかった takes the ない-form and applies the い-adjective past swap. Each form is ONE small step from a form you already have — never a fresh memorisation.",
      },
      surface: {
        text: "Each of the four forms must be memorised separately as a whole word.",
      },
      distractor: {
        text: "Only the ない-form and た-form are real; なかった is just spoken shorthand for ない + でした.",
      },
      ruleExplanation:
        "Dictionary form is the anchor. ない = swap + ない. た = て-form's sound change + た instead of て. なかった = ない-form's い→かった swap. Three small, predictable steps outward from one base — not four separate words to memorise.",
    }),
    speaking("ja-m29-6-1-speak-2", "きのう ペンを さがした", "I looked for my pen yesterday. (plain)", ["さがす"]),
    // ── Review tail ──
    vocabMcq("ja-m29-6-1-rev-mcq-1", M29_6_1_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-6-1-rev-lc-1",
      audioText: "コンビニで おにぎりを かいました",
      correctMeaningEn: "I bought a rice ball at the convenience store.",
      distractorsEn: [
        "I bought a rice ball at the supermarket.",
        "I ate a rice ball at the convenience store.",
        "I didn't buy a rice ball.",
      ],
    }),
    speaking("ja-m29-6-1-rev-speak-1", M29_6_1_REVIEW[2].kana, M29_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-6-1-rev", M29_6_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M29_6_1.steps);
assertAnswerRotation(M29_6_1.steps, 1);
assertNoConsecutiveSame(M29_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-6-2 — Mixed plain-form interleave II (heavier rotation)
// ═══════════════════════════════════════════════════════════════════════

const M29_6_2_REVIEW = pickReviewAtoms("ja-m29-6-2-rev", M29_REVIEW_POOL, 5);

export const M29_6_2: LessonContent = {
  id: "ja-m29-6-2",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed plain-form interleave II",
  description:
    "Faster rotation across all four plain forms and every m29 verb.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    build(
      "ja-m29-6-2-build-1",
      "Say: I choose a book. (plain, dictionary form)",
      "ほんを えらぶ",
      ["ほん", "を", "えらぶ", "えらばない", "えらんだ"],
      ["ほん", "を", "えらぶ"],
      ["えらぶ"],
    ),
    listeningCompSentence({
      id: "ja-m29-6-2-lc-1",
      audioText: "ともだちを てつだわなかった。",
      correctMeaningEn: "I didn't help my friend. (plain)",
      distractorsEn: [
        "I helped my friend. (plain)",
        "I don't help my friend. (plain)",
        "My friend didn't help me. (plain)",
      ],
      exercisedAtomKanas: ["てつだう"],
    }),
    build(
      "ja-m29-6-2-build-2",
      "Say: I carried the luggage. (plain, past)",
      "にもつを はこんだ",
      ["にもつ", "を", "はこんだ", "はこばない", "はこぶ"],
      ["にもつ", "を", "はこんだ"],
      ["はこぶ"],
    ),
    sentenceMcq({
      id: "ja-m29-6-2-mcq-1",
      prompt: "Which means 'I don't fix cars.' (plain, general habit)?",
      correctKana: "くるまを なおさない。",
      distractorsKana: ["くるまを なおさなかった。", "くるまを なおした。", "くるまを なおしません でした。"],
      explanation: "General non-past negative habit = plain ない-form.",
      exercisedAtomKanas: ["なおす"],
    }),
    build(
      "ja-m29-6-2-build-3",
      "Say: I memorised everything. (plain, past)",
      "ぜんぶ おぼえた",
      ["ぜんぶ", "おぼえた", "おぼえない", "おぼえる"],
      ["ぜんぶ", "おぼえた"],
      ["ぜんぶ", "おぼえる"],
    ),
    speaking("ja-m29-6-2-speak-1", "ほんを えらぶ", "I choose a book. (plain)", ["えらぶ"]),
    listeningBuildSentence({
      id: "ja-m29-6-2-lb-1",
      target: "きょうは いそがなかった",
      tiles: ["きょう", "は", "いそがなかった", "いそぎません", "いそぐ"],
      correctOrder: ["きょう", "は", "いそがなかった"],
      promptEn: "Hear it, build it: 'I didn't hurry today.' (plain)",
      exercisedAtomKanas: ["いそぐ"],
    }),
    sentenceMcq({
      id: "ja-m29-6-2-mcq-2",
      prompt: "Which is the correct past-negative of つかう (to use)?",
      correctKana: "つかわなかった",
      distractorsKana: ["つかあなかった", "つかったかった", "つかわないでした"],
      explanation: "つかわない → drop い, add かった → つかわなかった.",
      exercisedAtomKanas: ["つかう"],
    }),
    translateStep({
      id: "ja-m29-6-2-translate",
      promptEn: "I carried the luggage. (plain)",
      acceptedAnswers: ["にもつを はこんだ", "にもつを はこんだ。"],
      audioText: "にもつを はこんだ",
      exercisedAtomKanas: ["はこぶ"],
    }),
    selfExplain({
      id: "ja-m29-6-2-self-explain",
      anchorLabel: "Choosing the right plain form",
      anchorAudioText: "ともだちを てつだわなかった",
      question: "How do you decide which of the four plain forms fits a sentence?",
      rule: {
        text: "Ask two questions: (1) Is it happening/true, or negated? → dictionary/ない vs た/なかった. (2) Is it now/general, or already finished? → dictionary/た vs ない/なかった crossed with tense. Two independent yes/no switches produce exactly the four forms — no memorised list needed.",
      },
      surface: {
        text: "You just have to memorise which form 'sounds right' for each situation.",
      },
      distractor: {
        text: "The four forms are interchangeable in casual speech — native speakers pick whichever feels natural.",
      },
      ruleExplanation:
        "Tense × polarity is a 2×2 grid: dictionary (non-past, positive), ない (non-past, negative), た (past, positive), なかった (past, negative). Every plain verb slots into exactly one cell — that's the whole system.",
    }),
    speaking("ja-m29-6-2-speak-2", "ぜんぶ おぼえた", "I memorised everything. (plain)", ["ぜんぶ", "おぼえる"]),
    // ── Review tail ──
    vocabMcq("ja-m29-6-2-rev-mcq-1", M29_6_2_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-6-2-rev-lc-1",
      audioText: "たなかさんは にほんじんです",
      correctMeaningEn: "Mr. Tanaka is Japanese.",
      distractorsEn: [
        "Mr. Tanaka is American.",
        "Ms. Tanaka is a student.",
        "Mr. Tanaka was Japanese.",
      ],
    }),
    speaking("ja-m29-6-2-rev-speak-1", M29_6_2_REVIEW[2].kana, M29_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-6-2-rev", M29_6_2_REVIEW.slice(0, 4)),
  ],
};

assertNoSameAnswerCluster(M29_6_2.steps);
assertAnswerRotation(M29_6_2.steps, 1);
assertNoConsecutiveSame(M29_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-STORY — ゆき and けん talk casually (plain form in the wild)
// ═══════════════════════════════════════════════════════════════════════

export const M29_STORY: LessonContent = {
  id: "ja-m29-story",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — ゆき and けん make plans",
  description:
    "Two friends talk casually in plain form about the weekend — hear it, understand it, reply in plain form yourself.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    ...storyComprehension({
      idPrefix: "ja-m29-story-s1",
      narrative: [
        { kana: "きょう ひまだから、こうえんで あそぶ。" },
        { kana: "でも、しゅくだいを ぜんぶ おぼえなかった。" },
        { kana: "だから、さきに しゅくだいを する。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "Why does the speaker have to do homework first?",
          correctText: "They didn't memorise all of it yet.",
          distractors: [
            "The teacher told them to.",
            "They forgot to bring it.",
            "Their friend already finished it.",
          ],
          explanation: "しゅくだいを ぜんぶ おぼえなかった = didn't memorise all the homework.",
        },
        {
          id: "s1-q2",
          prompt: "What will the speaker do at the park?",
          correctText: "Play, because they're free today.",
          distractors: ["Study", "Wait for a friend", "Fix a bicycle"],
          explanation: "きょう ひまだから、こうえんで あそぶ = free today, so I'll play in the park.",
        },
      ],
      responseBuild: {
        target: "わたしも いっしょに あそぶ",
        tiles: ["わたし", "も", "いっしょに", "あそぶ", "あそばない"],
        correctOrder: ["わたし", "も", "いっしょに", "あそぶ"],
        promptEn: "Reply: 'I'll play together too.' (plain)",
      },
    }),
    sentenceMcq({
      id: "ja-m29-story-mcq-1",
      prompt: "Which line from the story is in the PLAIN た-form (past)?",
      correctKana: "しゅくだいを ぜんぶ おぼえなかった。",
      distractorsKana: [
        "こうえんで あそぶ。",
        "さきに しゅくだいを する。",
        "きょう ひまだから、こうえんで あそぶ。",
      ],
      explanation: "おぼえなかった is the plain past negative (なかった).",
    }),
    ...storyComprehension({
      idPrefix: "ja-m29-story-s2",
      narrative: [
        { kana: "けんは いそいで きた。" },
        { kana: "「ごめん、バスを まちすぎた。」" },
        { kana: "ゆきは わらって、「だいじょうぶ、まだ はじめない。」といった。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "Why was けん late?",
          correctText: "He waited too long for the bus.",
          distractors: [
            "He forgot his bag.",
            "He didn't want to come.",
            "He was fixing his bicycle.",
          ],
          explanation: "バスを まちすぎた = waited for the bus too long.",
        },
        {
          id: "s2-q2",
          prompt: "How does ゆき react?",
          correctText: "She laughs and says it's fine, they haven't started yet.",
          distractors: [
            "She's annoyed and leaves.",
            "She says they already started without him.",
            "She tells him to hurry up next time.",
          ],
          explanation: "わらって、「だいじょうぶ、まだ はじめない」= laughs, says 'it's fine, not started yet.'",
        },
      ],
      responseBuild: {
        target: "つぎは いそがない",
        tiles: ["つぎ", "は", "いそがない", "いそいだ", "いそぐ"],
        correctOrder: ["つぎ", "は", "いそがない"],
        promptEn: "Reply as けん: 'Next time I won't rush.' (plain)",
      },
    }),
    listeningBuildSentence({
      id: "ja-m29-story-lb-1",
      target: "けんは いそいで きた",
      tiles: ["けん", "は", "いそいで", "きた", "こない"],
      correctOrder: ["けん", "は", "いそいで", "きた"],
      promptEn: "Hear it, build it: 'けん came in a hurry.'",
    }),
    speaking(
      "ja-m29-story-speak-1",
      "わたしも いっしょに あそぶ",
      "I'll play together too. (plain)",
    ),
    sentenceMcq({
      id: "ja-m29-story-mcq-summary",
      prompt: "Which plain forms appeared across the whole story?",
      correctKana: "Dictionary (あそぶ), た (きた), なかった (おぼえなかった), ない (いそがない) — all four.",
      distractorsKana: [
        "Only dictionary form.",
        "Only the past forms (た and なかった).",
        "Only the negative forms (ない and なかった).",
      ],
      explanation: "The story rotates through every plain form the module taught.",
    }),
    speaking(
      "ja-m29-story-speak-2",
      "つぎは いそがない",
      "Next time I won't rush. (plain)",
    ),
    reviewMatchPairs(
      "ja-m29-story-rev",
      pickReviewAtoms("ja-m29-story-rev", M29_REVIEW_POOL, 4),
    ),
  ],
};

assertNoConsecutiveSame(M29_STORY.steps);
assertPassiveCardsHaveFollowup(M29_STORY.steps);
assertNoExplanationOnPassive(M29_STORY.steps);
assertExplanationDoesntLeakAnswer(M29_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-7-1 — Comprehension drill (mixed forms)
// ═══════════════════════════════════════════════════════════════════════

const M29_7_1_REVIEW = pickReviewAtoms("ja-m29-7-1-rev", M29_REVIEW_POOL, 4);

export const M29_7_1: LessonContent = {
  id: "ja-m29-7-1",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "Comprehension drill — plain form",
  description:
    "Listening + reading comprehension across every plain form taught in m29.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    listeningCompSentence({
      id: "ja-m29-7-1-lc-1",
      audioText: "きのう ともだちを てつだった。",
      correctMeaningEn: "I helped my friend yesterday. (plain)",
      distractorsEn: [
        "I'm helping my friend today. (plain)",
        "I didn't help my friend yesterday. (plain)",
        "My friend helped me yesterday. (plain)",
      ],
      exercisedAtomKanas: ["てつだう"],
    }),
    kanjiReading("ja-m29-7-1-kr-iku", { kana: "いく", meaningEn: "to go", fromModule: "m7" }),
    sentenceMcq({
      id: "ja-m29-7-1-mcq-1",
      prompt: "Which means 'I didn't tidy up.' (plain)?",
      correctKana: "かたづけなかった。",
      distractorsKana: ["かたづけません でした。", "かたづけない。", "かたづけた。"],
      explanation: "かたづけない → drop い, add かった → かたづけなかった.",
      exercisedAtomKanas: ["かたづける"],
    }),
    build(
      "ja-m29-7-1-build-1",
      "Say: I'm not going to look for it today.",
      "きょうは さがさない",
      ["きょう", "は", "さがさない", "さがしません", "さがした"],
      ["きょう", "は", "さがさない"],
      ["さがす"],
    ),
    listeningCompSentence({
      id: "ja-m29-7-1-lc-2",
      audioText: "にほんごを べんきょうしたから、かんじを おぼえた。",
      correctMeaningEn: "I studied Japanese, so I memorised kanji. (plain)",
      distractorsEn: [
        "I want to study Japanese to memorise kanji. (plain)",
        "I didn't study Japanese, so I forgot kanji. (plain)",
        "I studied Japanese, but I didn't memorise kanji. (plain)",
      ],
    }),
    build(
      "ja-m29-7-1-build-2",
      "Say: I chose everything by myself.",
      "じぶんで ぜんぶ えらんだ",
      ["じぶん", "で", "ぜんぶ", "えらんだ", "えらばない"],
      ["じぶん", "で", "ぜんぶ", "えらんだ"],
      ["ぜんぶ", "えらぶ"],
    ),
    speaking("ja-m29-7-1-speak-1", "きょうは さがさない", "I'm not going to look for it today. (plain)", ["さがす"]),
    sentenceMcq({
      id: "ja-m29-7-1-mcq-2",
      prompt: "Which means 'My friend came in a hurry.' (plain)?",
      correctKana: "ともだちは いそいで きた。",
      distractorsKana: ["ともだちは いそがなかった。", "ともだちは こなかった。", "ともだちは いそぐ。"],
      explanation: "いそいで (て-form) + きた (plain past of くる).",
    }),
    listeningBuildSentence({
      id: "ja-m29-7-1-lb-1",
      target: "くるまを なおした",
      tiles: ["くるま", "を", "なおした", "なおしません", "なおさない"],
      correctOrder: ["くるま", "を", "なおした"],
      promptEn: "Hear it, build it: 'I fixed the car.' (plain)",
      exercisedAtomKanas: ["なおす"],
    }),
    translateStep({
      id: "ja-m29-7-1-translate",
      promptEn: "I chose everything by myself. (plain)",
      acceptedAnswers: ["じぶんで ぜんぶ えらんだ", "じぶんで ぜんぶ えらんだ。"],
      audioText: "じぶんで ぜんぶ えらんだ",
      exercisedAtomKanas: ["ぜんぶ", "えらぶ"],
    }),
    selfExplain({
      id: "ja-m29-7-1-self-explain",
      anchorLabel: "Listening for the right plain form",
      anchorAudioText: "にほんごを べんきょうしたから、かんじを おぼえた",
      question: "How can you tell べんきょうした and おぼえた are both PAST tense just from listening?",
      rule: {
        text: "Both end in た (べんきょうし-た, おぼえ-た) — the plain-past marker. Listen for て/で → た/だ at the end of the verb chunk, the same sound-swap you already use for て-form.",
      },
      surface: {
        text: "You can only tell tense from context, never from the verb ending itself.",
      },
      distractor: {
        text: "した always means 'did' regardless of what verb it attaches to.",
      },
      ruleExplanation:
        "た/だ at a verb's end is the reliable plain-past signal — exactly parallel to hearing て/で and knowing it's a connector. べんきょうした = studied (した = plain past of する); おぼえた = memorised (た swap on おぼえて).",
    }),
    speaking("ja-m29-7-1-speak-2", "じぶんで ぜんぶ えらんだ", "I chose everything by myself. (plain)", ["ぜんぶ", "えらぶ"]),
    // ── Review tail ──
    vocabMcq("ja-m29-7-1-rev-mcq-1", M29_7_1_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-7-1-rev-lc-1",
      audioText: "がっこうの としょかんは おおきいです",
      correctMeaningEn: "The school library is big.",
      distractorsEn: [
        "The school library is small.",
        "The public library is big.",
        "The school is big.",
      ],
    }),
    speaking("ja-m29-7-1-rev-speak-1", M29_7_1_REVIEW[2].kana, M29_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-7-1-rev", M29_7_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M29_7_1.steps);
assertAnswerRotation(M29_7_1.steps, 1);
assertNoConsecutiveSame(M29_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M29-7-2 — Final production
// ═══════════════════════════════════════════════════════════════════════

const M29_7_2_REVIEW = pickReviewAtoms("ja-m29-7-2-rev", M29_REVIEW_POOL, 5);

export const M29_7_2: LessonContent = {
  id: "ja-m29-7-2",
  moduleId: "m29",
  courseId: COURSE,
  languageId: LANG,
  title: "Final production — M29",
  description:
    "Full production with every plain form and every m29 verb at full speed.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    build(
      "ja-m29-7-2-build-1",
      "Say: I helped my friend carry the luggage.",
      "ともだちが にもつを はこぶのを てつだった",
      ["ともだち", "が", "にもつ", "を", "はこぶのを", "てつだった"],
      ["ともだち", "が", "にもつ", "を", "はこぶのを", "てつだった"],
      ["てつだう", "はこぶ"],
    ),
    speaking(
      "ja-m29-7-2-speak-1",
      "ともだちが にもつを はこぶのを てつだった",
      "I helped my friend carry the luggage. (plain)",
    ),
    listeningCompSentence({
      id: "ja-m29-7-2-lc-1",
      audioText: "いそいで きたけど、まにあわなかった。",
      correctMeaningEn: "I hurried and came, but I didn't make it in time. (plain)",
      distractorsEn: [
        "I hurried and made it in time. (plain)",
        "I didn't hurry, so I was late. (plain)",
        "I waited, but nobody came. (plain)",
      ],
    }),
    build(
      "ja-m29-7-2-build-2",
      "Say: I didn't fix the bicycle myself.",
      "じてんしゃを じぶんで なおさなかった",
      ["じてんしゃ", "を", "じぶん", "で", "なおさなかった", "なおした"],
      ["じてんしゃ", "を", "じぶん", "で", "なおさなかった"],
      ["なおす"],
    ),
    sentenceMcq({
      id: "ja-m29-7-2-mcq-1",
      prompt: "Which means 'I'll choose everything and carry it myself.' (plain)?",
      correctKana: "ぜんぶ えらんで、じぶんで はこぶ。",
      distractorsKana: [
        "ぜんぶ えらばないで、じぶんで はこぶ。",
        "ぜんぶ えらんで、じぶんで はこばない。",
        "ぜんぶ えらんだ、じぶんで はこんだ。",
      ],
      explanation: "えらんで (て-form linking) + はこぶ (dictionary form, ongoing plan).",
      exercisedAtomKanas: ["ぜんぶ", "えらぶ", "はこぶ"],
    }),
    speaking(
      "ja-m29-7-2-speak-2",
      "じてんしゃを じぶんで なおさなかった",
      "I didn't fix the bicycle myself. (plain)",
    ),
    build(
      "ja-m29-7-2-build-3",
      "Say: I tidied up everything before my friend came.",
      "ともだちが くるまえに ぜんぶ かたづけた",
      ["ともだち", "が", "くるまえに", "ぜんぶ", "かたづけた", "かたづけない"],
      ["ともだち", "が", "くるまえに", "ぜんぶ", "かたづけた"],
      ["ぜんぶ", "かたづける"],
    ),
    listeningBuildSentence({
      id: "ja-m29-7-2-lb-1",
      target: "かんじを ぜんぶ おぼえなかった",
      tiles: ["かんじ", "を", "ぜんぶ", "おぼえなかった", "おぼえた", "おぼえない"],
      correctOrder: ["かんじ", "を", "ぜんぶ", "おぼえなかった"],
      promptEn: "Hear it, build it: 'I didn't memorise all the kanji.' (plain)",
      exercisedAtomKanas: ["ぜんぶ", "おぼえる"],
    }),
    sentenceMcq({
      id: "ja-m29-7-2-mcq-2",
      prompt: "Which means 'I looked for my bag but didn't find— I mean, didn't use it.' (Which verb/form pair is grammatically consistent?)",
      correctKana: "かばんを さがしたが、つかわなかった。",
      distractorsKana: [
        "かばんを さがすが、つかわなかった。",
        "かばんを さがしたが、つかう。",
        "かばんを さがさないが、つかった。",
      ],
      explanation: "Both clauses describe completed past events — both verbs need た/なかった, not mixed tense.",
      exercisedAtomKanas: ["さがす", "つかう"],
    }),
    translateStep({
      id: "ja-m29-7-2-translate",
      promptEn: "I tidied up everything before my friend came. (plain)",
      acceptedAnswers: [
        "ともだちが くるまえに ぜんぶ かたづけた",
        "ともだちが くるまえに ぜんぶ かたづけた。",
      ],
      audioText: "ともだちが くるまえに ぜんぶ かたづけた",
      exercisedAtomKanas: ["ぜんぶ", "かたづける"],
    }),
    selfExplain({
      id: "ja-m29-7-2-self-explain",
      anchorLabel: "Full M29 mastery",
      anchorAudioText: "ともだちが にもつを はこぶのを てつだった",
      question: "What's the actual payoff of learning plain form, beyond sounding less textbook-y?",
      rule: {
        text: "Plain form is the base almost every later grammar point attaches to — relative clauses, conditionals (たら/と/ば/なら), casual speech, 〜と思う, and more all bolt onto the dictionary/ない/た forms you just built. Skipping plain form would block nearly everything in N4.",
      },
      surface: {
        text: "Plain form is mostly useful for talking to yourself or writing diaries.",
      },
      distractor: {
        text: "Plain form replaces ます entirely — you'll stop using ます-form going forward.",
      },
      ruleExplanation:
        "Plain form isn't a style choice, it's a structural gate: N4's relative clauses, all four conditionals, casual register, and volitional (よう+と思う) are built directly on the forms from this module. You'll keep using ます in polite contexts — plain form is what everything else stands on.",
    }),
    speaking(
      "ja-m29-7-2-speak-3",
      "ともだちが くるまえに ぜんぶ かたづけた",
      "I tidied up everything before my friend came. (plain)",
    ),
    // ── Review tail ──
    vocabMcq("ja-m29-7-2-rev-mcq-1", M29_7_2_REVIEW[0], M29_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m29-7-2-rev-lc-1",
      audioText: "まいにち にほんごを れんしゅうします",
      correctMeaningEn: "I practice Japanese every day.",
      distractorsEn: [
        "I practiced Japanese yesterday.",
        "I practice English every day.",
        "I don't practice Japanese.",
      ],
    }),
    speaking("ja-m29-7-2-rev-speak-1", M29_7_2_REVIEW[2].kana, M29_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m29-7-2-rev", M29_7_2_REVIEW.slice(0, 5)),
  ],
};

assertNoSameAnswerCluster(M29_7_2.steps);
assertAnswerRotation(M29_7_2.steps, 1);
assertNoConsecutiveSame(M29_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M29_1_1.steps,
  ...M29_1_2.steps,
  ...M29_2_1.steps,
  ...M29_2_2.steps,
  ...M29_3_1.steps,
  ...M29_3_2.steps,
  ...M29_4_1.steps,
  ...M29_4_2.steps,
  ...M29_5_1.steps,
  ...M29_5_2.steps,
  ...M29_6_1.steps,
  ...M29_6_2.steps,
  ...M29_7_1.steps,
  ...M29_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M29_1_1, M29_1_2, M29_2_1, M29_2_2, M29_3_1, M29_3_2,
  M29_4_1, M29_4_2, M29_5_1, M29_5_2, M29_6_1, M29_6_2,
  M29_STORY, M29_7_1, M29_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
