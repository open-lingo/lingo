/**
 * M27 — Modal Grammar (2026-05-25).
 *
 * M27 introduces:
 *   - 〜なければならない / 〜なくちゃ (must do — obligation)
 *   - 〜ほうがいい (should / better to — advice)
 *   - 〜く/〜になる (become — change of state)
 *
 * Vocab (~20): Modal-context verbs + remaining N5 vocab:
 *   きめる (decide), まもる (protect/follow rules), やくそく (promise),
 *   じゅんび (preparation), れんしゅう (practice), しけん (exam),
 *   けんこう (health), びょういん (hospital), くすり (medicine),
 *   うんどう (exercise), きをつける (be careful), なおす (fix/cure),
 *   かわる (change intr.), かえる (change tr.), つづける (continue),
 *   がんばる (do one's best), あんぜん (safety), きけん (danger),
 *   ひつよう (necessary), たいせつ (important)
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps.
 *
 * Story: Giving and receiving advice.
 *
 * ID scheme: ja-m27-{n}-{sub} e.g. ja-m27-1-1, ja-m27-1-2
 * Export names: M27_1_1, M27_1_2, M27_2_1, M27_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m27-1, etc.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  cloze,
  grammarRule,
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
// Per-sub-lesson review-atom draws. Pool is M3-M7.
// ───────────────────────────────────────────────────────────────────────
const M27_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_NAKEREBA = grammarRule({
  id: "ja-m27-rule-nakereba",
  grammarPointId: "nakereba-naranai",
  title: "〜なければならない / 〜なくちゃ — must do (obligation)",
  rule:
    "To express obligation ('must do'), use ない-form, drop the final い, and add ければならない (formal) or くちゃ (casual). たべる → たべない → たべなければならない (must eat). Casual: たべなくちゃ. Polite endings: なければなりません / なければいけません.",
  examples: [
    {
      ja: "くすりを のまなければなりません。",
      romaji: "kusuri o nomanakereba narimasen.",
      en: "I must take medicine.",
    },
    {
      ja: "あした しけんが あるから、べんきょうしなくちゃ。",
      romaji: "ashita shiken ga aru kara, benkyou shinakucha.",
      en: "I have an exam tomorrow, so I gotta study.",
    },
    {
      ja: "はやく おきなければいけません。",
      romaji: "hayaku okinakereba ikemasen.",
      en: "I must wake up early.",
    },
  ],
  antiPattern: {
    ja: "くすりを のむなければなりません。",
    romaji: "kusuri o munakereba narimasen.",
    en: "(broken — use ない-form base, not dictionary form, before なければ)",
    why: "Start from the ない-form: のまない. Drop い → のまなければならない. Dictionary form (のむ) can't attach to なければ.",
  },
  cultureNote:
    "なくちゃ is very casual — used with friends. なければなりません is the textbook polite form. In everyday polite speech, なきゃ (even shorter) is common too.",
});

const RULE_HOU_GA_II = grammarRule({
  id: "ja-m27-rule-hou-ga-ii",
  grammarPointId: "hou-ga-ii",
  title: "〜ほうがいい — should / better to (advice)",
  rule:
    "To give advice ('you should / it's better to'), use: た-form + ほうがいい (positive advice) or ない-form + ほうがいい (negative advice — 'you'd better not'). The た-form is more common for positive advice.",
  examples: [
    {
      ja: "くすりを のんだほうがいいです。",
      romaji: "kusuri o nonda hou ga ii desu.",
      en: "You should take medicine.",
    },
    {
      ja: "はやく ねたほうがいいですよ。",
      romaji: "hayaku neta hou ga ii desu yo.",
      en: "You should go to sleep early.",
    },
    {
      ja: "おさけを のまないほうがいいです。",
      romaji: "osake o nomanai hou ga ii desu.",
      en: "You'd better not drink alcohol.",
    },
  ],
  antiPattern: {
    ja: "くすりを のむほうがいいです。",
    romaji: "kusuri o nomu hou ga ii desu.",
    en: "(less natural — for positive advice, use た-form: のんだほうがいい)",
    why: "Dictionary form + ほうがいい is grammatically possible but sounds like comparing options ('drinking is better'). For advice, use た-form: のんだほうがいい ('you should drink it').",
  },
  cultureNote:
    "ほうがいい is direct advice — stronger than 'maybe you could…' In Japanese culture, such directness is usually reserved for close relationships or when the advice is health/safety related.",
});

const RULE_KU_NI_NARU = grammarRule({
  id: "ja-m27-rule-ku-ni-naru",
  grammarPointId: "ku-ni-naru",
  title: "〜く/〜になる — become (change of state)",
  rule:
    "To express becoming or changing state, use なる (become). い-adjectives: drop い, add くなる (たかい → たかくなる = become expensive). な-adjectives / nouns: add になる (げんき → げんきになる = become healthy). なる conjugates normally: なります (polite), なった (past), etc.",
  examples: [
    {
      ja: "さむくなりました。",
      romaji: "samuku narimashita.",
      en: "It became cold.",
    },
    {
      ja: "にほんごが じょうずになりました。",
      romaji: "nihongo ga jouzu ni narimashita.",
      en: "My Japanese became good / I got better at Japanese.",
    },
    {
      ja: "おおきくなりたいです。",
      romaji: "ookiku naritai desu.",
      en: "I want to become big / grow up.",
    },
  ],
  antiPattern: {
    ja: "さむいなりました。",
    romaji: "samui narimashita.",
    en: "(broken — drop い and add く: さむくなる, not さむいなる)",
    why: "い-adjectives change their ending: drop い, add く before なる. さむい → さむくなる.",
  },
  cultureNote:
    "〜くなる / 〜になる is everywhere: seasons changing (あつくなる), skills improving (じょうずになる), situations changing (あんぜんになる). Very natural way to describe change.",
});

// ═══════════════════════════════════════════════════════════════════════
// M27-1-1 — Vocab intro: obligation & health context (first batch)
// ═══════════════════════════════════════════════════════════════════════

const M27_1_1_REVIEW = pickReviewAtoms("ja-m27-1-1-rev", M27_REVIEW_POOL, 4);

export const M27_1_1: LessonContent = {
  id: "ja-m27-1-1",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Obligation & health vocab I",
  description:
    "Learn key vocab for obligations and health: きめる, まもる, やくそく, じゅんび, れんしゅう, しけん.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── きめる (decide) ──
    build(
      "ja-m27-1-1-build-kimeru",
      "Pick the Japanese word for: Decide",
      "きめる",
      ["じゅんび", "まもる", "やくそく", "きめる"],
      ["きめる"],
    ),
    listeningCompSentence({
      id: "ja-m27-1-1-lc-kimeru",
      audioText: "ばんごはんを きめる",
      correctMeaningEn: "decide on dinner",
      distractorsEn: [
        "make dinner",
        "eat dinner",
        "decide on breakfast",
      ],
    }),
    // ── まもる (protect / follow rules) ──
    build(
      "ja-m27-1-1-build-mamoru",
      "Pick the Japanese word for: Protect / Follow rules",
      "まもる",
      ["れんしゅう", "しけん", "きめる", "まもる"],
      ["まもる"],
    ),
    vocabMcq(
      "ja-m27-1-1-mcq-mamoru",
      { kana: "まもる", meaningEn: "protect / follow rules", emoji: "🛡️", fromModule: "m27" },
      M27_REVIEW_POOL,
    ),
    // ── やくそく (promise) ──
    build(
      "ja-m27-1-1-build-yakusoku",
      "Pick the Japanese word for: Promise",
      "やくそく",
      ["きめる", "まもる", "やくそく", "じゅんび"],
      ["やくそく"],
    ),
    speaking("ja-m27-1-1-speak-yakusoku", "やくそく", "Promise"),
    // ── じゅんび (preparation) ──
    build(
      "ja-m27-1-1-build-junbi",
      "Pick the Japanese word for: Preparation",
      "じゅんび",
      ["れんしゅう", "やくそく", "じゅんび", "しけん"],
      ["じゅんび"],
    ),
    listeningCompSentence({
      id: "ja-m27-1-1-lc-junbi",
      audioText: "りょこうの じゅんびを します",
      correctMeaningEn: "I get ready for the trip.",
      distractorsEn: [
        "I decide on the trip.",
        "I get ready for the exam.",
        "I came back from the trip.",
      ],
    }),
    // ── れんしゅう (practice) ──
    build(
      "ja-m27-1-1-build-renshuu",
      "Pick the Japanese word for: Practice",
      "れんしゅう",
      ["しけん", "じゅんび", "きめる", "れんしゅう"],
      ["れんしゅう"],
    ),
    vocabMcq(
      "ja-m27-1-1-mcq-renshuu",
      { kana: "れんしゅう", meaningEn: "practice", emoji: "🏋️", fromModule: "m27" },
      M27_REVIEW_POOL,
    ),
    // ── しけん (exam) ──
    build(
      "ja-m27-1-1-build-shiken",
      "Pick the Japanese word for: Exam",
      "しけん",
      ["じゅんび", "しけん", "れんしゅう", "まもる"],
      ["しけん"],
    ),
    speaking("ja-m27-1-1-speak-shiken", "しけん", "Exam"),
    // ── Sentence drills ──
    sentenceMcq({
      id: "ja-m27-1-1-mcq-sentence",
      prompt: "Which sentence means 'I have an exam tomorrow.'?",
      correctKana: "あした しけんが あります。",
      distractorsKana: [
        "あした れんしゅうが あります。",
        "あした じゅんびが あります。",
        "あした やくそくが あります。",
      ],
      explanation: "しけん = exam. あります = there is / I have.",
    }),
    build(
      "ja-m27-1-1-build-junbi-sent",
      "Say: Preparation is important.",
      "じゅんびは たいせつです",
      ["れんしゅう", "は", "じゅんび", "たいせつ", "です", "ひつよう"],
      ["じゅんび", "は", "たいせつ", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m27-1-1-lb-renshuu",
      target: "まいにち れんしゅうします",
      tiles: ["しけん", "じゅんび", "まいにち", "れんしゅう", "しました", "します"],
      correctOrder: ["まいにち", "れんしゅう", "します"],
      promptEn: "Hear it, build it: 'I practice every day.'",
    }),
    selfExplain({
      id: "ja-m27-1-1-self-explain",
      anchorLabel: "じゅんび vs れんしゅう",
      anchorAudioText: "じゅんびは たいせつです",
      question: "What's the difference between じゅんび and れんしゅう?",
      rule: { text: "じゅんび = preparation (getting ready for something). れんしゅう = practice (repeating to improve). Preparation is about readiness; practice is about skill-building." },
      surface: { text: "They're the same — both mean studying." },
      distractor: { text: "じゅんび is for sports and れんしゅう is for school." },
      ruleExplanation:
        "じゅんび (準備) = preparation (packing, organizing, planning). れんしゅう (練習) = practice (drilling, rehearsing, repeating).",
    }),
    speaking(
      "ja-m27-1-1-speak-junbi",
      "じゅんびは たいせつです",
      "Preparation is important.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m27-1-1-rev-mcq-1", M27_1_1_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-1-1-rev-lc-1",
      audioText: "まいしゅう てがみを かきます",
      correctMeaningEn: "I write a letter every week.",
      distractorsEn: [
        "I write a letter every day.",
        "I read a letter every week.",
        "I wrote a letter yesterday.",
      ],
    }),
    speaking("ja-m27-1-1-rev-speak-1", M27_1_1_REVIEW[2].kana, M27_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-1-1-rev", M27_1_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M27_1_1.steps);
assertAnswerRotation(M27_1_1.steps, 1);
assertNoConsecutiveSame(M27_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-1-2 — Vocab intro: health & safety + remaining N5
// ═══════════════════════════════════════════════════════════════════════

const M27_1_2_REVIEW = pickReviewAtoms("ja-m27-1-2-rev", M27_REVIEW_POOL, 4);

export const M27_1_2: LessonContent = {
  id: "ja-m27-1-2",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Health & safety vocab",
  description:
    "Learn vocab for health and safety: けんこう, びょういん, くすり, うんどう, きをつける, あんぜん, きけん, ひつよう, たいせつ.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── けんこう (health) ──
    build(
      "ja-m27-1-2-build-kenkou",
      "Pick the Japanese word for: Health",
      "けんこう",
      ["びょういん", "うんどう", "けんこう", "くすり"],
      ["けんこう"],
    ),
    listeningCompSentence({
      id: "ja-m27-1-2-lc-kenkou",
      audioText: "わたしは けんこうです",
      correctMeaningEn: "I am healthy.",
      distractorsEn: [
        "I am busy.",
        "I am sick.",
        "I am safe.",
      ],
    }),
    // ── びょういん (hospital) ──
    build(
      "ja-m27-1-2-build-byouin",
      "Pick the Japanese word for: Hospital",
      "びょういん",
      ["きけん", "けんこう", "びょういん", "くすり"],
      ["びょういん"],
    ),
    vocabMcq(
      "ja-m27-1-2-mcq-byouin",
      { kana: "びょういん", meaningEn: "hospital", emoji: "🏥", fromModule: "m27" },
      M27_REVIEW_POOL,
    ),
    // ── くすり (medicine) ──
    build(
      "ja-m27-1-2-build-kusuri",
      "Pick the Japanese word for: Medicine",
      "くすり",
      ["うんどう", "くすり", "びょういん", "けんこう"],
      ["くすり"],
    ),
    speaking("ja-m27-1-2-speak-kusuri", "くすり", "Medicine"),
    // ── うんどう (exercise) ──
    build(
      "ja-m27-1-2-build-undou",
      "Pick the Japanese word for: Exercise",
      "うんどう",
      ["くすり", "れんしゅう", "けんこう", "うんどう"],
      ["うんどう"],
    ),
    vocabMcq(
      "ja-m27-1-2-mcq-undou",
      { kana: "うんどう", meaningEn: "exercise", emoji: "🏃", fromModule: "m27" },
      M27_REVIEW_POOL,
    ),
    // ── あんぜん (safety) ──
    build(
      "ja-m27-1-2-build-anzen",
      "Pick the Japanese word for: Safety / Safe",
      "あんぜん",
      ["ひつよう", "あんぜん", "たいせつ", "きけん"],
      ["あんぜん"],
    ),
    listeningCompSentence({
      id: "ja-m27-1-2-lc-anzen",
      audioText: "ここは あんぜんです",
      correctMeaningEn: "This place is safe.",
      distractorsEn: [
        "This place is dangerous.",
        "This place is quiet.",
        "That place is safe.",
      ],
    }),
    // ── きけん (danger) ──
    build(
      "ja-m27-1-2-build-kiken",
      "Pick the Japanese word for: Danger / Dangerous",
      "きけん",
      ["あんぜん", "ひつよう", "たいせつ", "きけん"],
      ["きけん"],
    ),
    speaking("ja-m27-1-2-speak-kiken", "きけん", "Danger"),
    // ── Sentence drills ──
    sentenceMcq({
      id: "ja-m27-1-2-mcq-sentence",
      prompt: "Which sentence means 'Health is important.'?",
      correctKana: "けんこうは たいせつです。",
      distractorsKana: [
        "けんこうは ひつようです。",
        "びょういんは たいせつです。",
        "うんどうは ひつようです。",
      ],
      explanation: "けんこう = health. たいせつ = important.",
    }),
    build(
      "ja-m27-1-2-build-anzen-sent",
      "Say: Safety is necessary.",
      "あんぜんは ひつようです",
      ["ひつよう", "です", "きけん", "あんぜん", "たいせつ", "は"],
      ["あんぜん", "は", "ひつよう", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m27-1-2-lb-kusuri",
      target: "くすりを のみます",
      tiles: ["うんどう", "くすり", "します", "を", "のみます", "のみました"],
      correctOrder: ["くすり", "を", "のみます"],
      promptEn: "Hear it, build it: 'I take medicine.'",
    }),
    selfExplain({
      id: "ja-m27-1-2-self-explain",
      anchorLabel: "あんぜん vs きけん",
      anchorAudioText: "あんぜんは ひつようです",
      question: "What's the relationship between あんぜん and きけん?",
      rule: { text: "あんぜん = safety/safe (positive). きけん = danger/dangerous (negative). They are opposites." },
      surface: { text: "They both mean safety — きけん is the formal version." },
      distractor: { text: "あんぜん is for people and きけん is for places." },
      ruleExplanation:
        "あんぜん (安全) = safe/safety. きけん (危険) = dangerous/danger. Antonyms — use them to describe situations.",
    }),
    speaking(
      "ja-m27-1-2-speak-kenkou",
      "けんこうは たいせつです",
      "Health is important.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m27-1-2-rev-mcq-1", M27_1_2_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-1-2-rev-lc-1",
      audioText: "トイレは あそこに あります",
      correctMeaningEn: "The toilet is over there.",
      distractorsEn: [
        "The bank is over there.",
        "Where is the toilet?",
        "There is no toilet here.",
      ],
    }),
    speaking("ja-m27-1-2-rev-speak-1", M27_1_2_REVIEW[2].kana, M27_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-1-2-rev", M27_1_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M27_1_2.steps);
assertAnswerRotation(M27_1_2.steps, 1);
assertNoConsecutiveSame(M27_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-2-1 — Grammar: なければならない (must do) + drill
// ═══════════════════════════════════════════════════════════════════════

const M27_2_1_REVIEW = pickReviewAtoms("ja-m27-2-1-rev", M27_REVIEW_POOL, 4);

export const M27_2_1: LessonContent = {
  id: "ja-m27-2-1",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Must do — なければならない",
  description:
    "Express obligation with ない-form + ければならない / なくちゃ.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_NAKEREBA,
    // ── Drills ──
    cloze(
      "ja-m27-2-1-cloze-1",
      "くすりを のま",
      "なりません。",
      "なければ",
      // Distractor QA 2026-07-12: なくちゃ removed — the SAME lesson teaches
      // なくちゃ as a valid casual "must", and のまなくちゃ(は)なりません reads
      // as defensibly correct (なくては contraction), making the item feel
      // unanswerable. Distractors must be cleanly wrong.
      ["なければ", "ない", "ないで", "なくて"],
      "I must take medicine.",
      "くすりを のまなければなりません。",
      "ない-form base (のまな-) + ければなりません = must.",
    ),
    sentenceMcq({
      id: "ja-m27-2-1-mcq-1",
      prompt: "Which sentence means 'I must study.'?",
      correctKana: "べんきょうしなければなりません。",
      distractorsKana: [
        "べんきょうするなければなりません。",
        "べんきょうしないなければなりません。",
        "べんきょうしますなければなりません。",
      ],
      explanation: "する → しない → しなければならない.",
    }),
    build(
      "ja-m27-2-1-build-1",
      "Say: I must wake up early.",
      "はやく おきなければなりません",
      ["おきなければ", "なりません", "ならない", "はやく", "おきる", "おきない"],
      ["はやく", "おきなければ", "なりません"],
    ),
    listeningCompSentence({
      id: "ja-m27-2-1-lc-1",
      audioText: "しけんの じゅんびを しなければなりません",
      correctMeaningEn: "I must prepare for the exam.",
      distractorsEn: [
        "I should prepare for the exam.",
        "I prepared for the exam.",
        "I don't need to prepare for the exam.",
      ],
    }),
    cloze(
      "ja-m27-2-1-cloze-2",
      "やくそくを まもら",
      "なりません。",
      "なければ",
      // Same distractor rule as cloze-1: なくちゃ is quasi-correct here.
      ["なければ", "ないで", "なくて", "ない"],
      "I must keep my promise.",
      "やくそくを まもらなければなりません。",
      "まもる → まもらない → まもらなければ.",
    ),
    speaking(
      "ja-m27-2-1-speak-1",
      "くすりを のまなければなりません",
      "I must take medicine.",
    ),
    build(
      "ja-m27-2-1-build-2",
      "Say: I gotta study. (casual)",
      "べんきょうしなくちゃ",
      ["しなくちゃ", "べんきょう", "します", "しなければ", "ならない"],
      ["べんきょう", "しなくちゃ"],
    ),
    cloze(
      "ja-m27-2-1-cloze-3",
      "まいにち うんどう",
      "なければなりません。",
      "し",
      ["し", "する", "して", "した"],
      "I must exercise every day.",
      "まいにち うんどうしなければなりません。",
      "うんどうする → うんどうしない → うんどうしなければ.",
    ),
    listeningBuildSentence({
      id: "ja-m27-2-1-lb-1",
      target: "はやく おきなければなりません",
      tiles: ["おきる", "おきない", "はやく", "おきなければ", "なりません", "ならない"],
      correctOrder: ["はやく", "おきなければ", "なりません"],
      promptEn: "Hear it, build it: 'I must wake up early.'",
    }),
    sentenceMcq({
      id: "ja-m27-2-1-mcq-2",
      prompt: "Which is the casual way to say 'I gotta go'?",
      correctKana: "いかなくちゃ。",
      distractorsKana: [
        "いかなければなりません。",
        "いかないで。",
        "いくなくちゃ。",
      ],
      explanation: "いく → いかない → いかなくちゃ (casual 'gotta go').",
    }),
    translateStep({
      id: "ja-m27-2-1-translate",
      promptEn: "I must write a letter.",
      acceptedAnswers: [
        "てがみを かかなければなりません",
        "てがみを かかなければなりません。",
        "てがみを かかなければいけません",
      ],
      audioText: "てがみを かかなければなりません",
    }),
    selfExplain({
      id: "ja-m27-2-1-self-explain",
      anchorLabel: "なければなりません vs なくちゃ",
      anchorAudioText: "べんきょうしなければなりません",
      question: "What's the difference between なければなりません and なくちゃ?",
      rule: { text: "Same meaning (must do), different formality. なければなりません = polite/formal. なくちゃ = casual/spoken. Choose based on who you're talking to." },
      surface: { text: "なくちゃ is a different grammar point meaning 'I want to.'" },
      distractor: { text: "なければなりません is for negative sentences only." },
      ruleExplanation:
        "Both mean 'must do.' なければなりません/いけません = polite. なくちゃ/なきゃ = casual. Same obligation, different register.",
    }),
    speaking(
      "ja-m27-2-1-speak-2",
      "べんきょうしなくちゃ",
      "I gotta study.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m27-2-1-rev-mcq-1", M27_2_1_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-2-1-rev-lc-1",
      audioText: M27_2_1_REVIEW[1].kana,
      correctMeaningEn: M27_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M27_2_1_REVIEW[2].meaningEn,
        M27_2_1_REVIEW[3].meaningEn,
        M27_REVIEW_POOL[2].meaningEn,
      ],
    }),
    speaking("ja-m27-2-1-rev-speak-1", M27_2_1_REVIEW[2].kana, M27_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-2-1-rev", M27_2_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M27_2_1.steps);
assertAnswerRotation(M27_2_1.steps, 1);
assertNoConsecutiveSame(M27_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-2-2 — なければならない in context + vocab
// ═══════════════════════════════════════════════════════════════════════

const M27_2_2_REVIEW = pickReviewAtoms("ja-m27-2-2-rev", M27_REVIEW_POOL, 4);

export const M27_2_2: LessonContent = {
  id: "ja-m27-2-2",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Obligations in context",
  description:
    "Combine なければならない with health/safety vocab in realistic sentences.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m27-2-2-build-1",
      "Say: I must go to the hospital.",
      "びょういんに いかなければなりません",
      ["いかない", "なりません", "いかなければ", "びょういん", "ならない", "に"],
      ["びょういん", "に", "いかなければ", "なりません"],
    ),
    cloze(
      "ja-m27-2-2-cloze-1",
      "きをつけ",
      "なければなりません。",
      "なけ",
      ["なけ", "ない", "なく", "ます"],
      "I must be careful.",
      "きをつけなければなりません。",
      "きをつける → きをつけない → きをつけなければ.",
    ),
    listeningCompSentence({
      id: "ja-m27-2-2-lc-1",
      audioText: "けんこうの ために うんどうしなければなりません",
      correctMeaningEn: "I must exercise for my health.",
      distractorsEn: [
        "I should exercise for my health.",
        "I exercised for my health.",
        "Exercise is dangerous.",
      ],
    }),
    sentenceMcq({
      id: "ja-m27-2-2-mcq-1",
      prompt: "Which means 'I must decide soon.'?",
      correctKana: "はやく きめなければなりません。",
      distractorsKana: [
        "はやく きめるなければなりません。",
        "はやく きめたほうがいいです。",
        "はやく きめましょう。",
      ],
      explanation: "きめる → きめない → きめなければなりません.",
    }),
    cloze(
      "ja-m27-2-2-cloze-2",
      "れんしゅうし",
      "なりません。",
      "なければ",
      ["なければ", "ないで", "なくちゃ", "たほうが"],
      "I must practice.",
      "れんしゅうしなければなりません。",
      "する → しない → しなければなりません.",
    ),
    speaking(
      "ja-m27-2-2-speak-1",
      "びょういんに いかなければなりません",
      "I must go to the hospital.",
    ),
    build(
      "ja-m27-2-2-build-2",
      "Say: This place is dangerous. You must be careful.",
      "ここは きけんです。きをつけなければなりません",
      ["です", "きけん", "ここ", "なりません", "は", "あんぜん", "きをつけなければ", "きをつけない"],
      ["ここ", "は", "きけん", "です", "きをつけなければ", "なりません"],
    ),
    cloze(
      "ja-m27-2-2-cloze-3",
      "やくそくを まもら",
      "いけません。",
      "なければ",
      ["なければ", "ないで", "なくて", "なくちゃ"],
      "You must keep your promise.",
      "やくそくを まもらなければいけません。",
      "なければいけません is another formal 'must' ending.",
    ),
    listeningBuildSentence({
      id: "ja-m27-2-2-lb-1",
      target: "くすりを のまなくちゃ",
      tiles: ["のまない", "を", "のまなければ", "のまなくちゃ", "くすり", "なりません"],
      correctOrder: ["くすり", "を", "のまなくちゃ"],
      promptEn: "Hear it, build it: 'I gotta take medicine.' (casual)",
    }),
    sentenceMcq({
      id: "ja-m27-2-2-mcq-2",
      prompt: "Which means 'I gotta prepare.' (casual)?",
      correctKana: "じゅんびしなくちゃ。",
      distractorsKana: [
        "じゅんびしなければなりません。",
        "じゅんびしないで。",
        "じゅんびするなくちゃ。",
      ],
      explanation: "する → しない → しなくちゃ (casual must).",
    }),
    translateStep({
      id: "ja-m27-2-2-translate",
      promptEn: "I must be careful.",
      acceptedAnswers: [
        "きをつけなければなりません",
        "きをつけなければなりません。",
        "きをつけなければいけません",
      ],
      audioText: "きをつけなければなりません",
    }),
    selfExplain({
      id: "ja-m27-2-2-self-explain",
      anchorLabel: "なければなりません vs なければいけません",
      anchorAudioText: "くすりを のまなければなりません",
      question: "Is there a difference between なければなりません and なければいけません?",
      rule: { text: "They mean the same thing — both express 'must do.' なりません (it won't do) and いけません (it won't work) are interchangeable in this pattern." },
      surface: { text: "なりません is positive obligation, いけません is negative prohibition." },
      distractor: { text: "なりません is for actions, いけません is for states." },
      ruleExplanation:
        "Both なければなりません and なければいけません = 'must do.' Completely interchangeable. Choose whichever feels natural.",
    }),
    speaking(
      "ja-m27-2-2-speak-2",
      "きをつけなくちゃ",
      "I gotta be careful.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m27-2-2-rev-mcq-1", M27_2_2_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-2-2-rev-lc-1",
      audioText: "バスで びょういんに いきます",
      correctMeaningEn: "I go to the hospital by bus.",
      distractorsEn: [
        "I go to the hospital by train.",
        "I go to school by bus.",
        "I walk to the hospital.",
      ],
    }),
    speaking("ja-m27-2-2-rev-speak-1", M27_2_2_REVIEW[2].kana, M27_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-2-2-rev", M27_2_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M27_2_2.steps);
assertAnswerRotation(M27_2_2.steps, 1);
assertNoConsecutiveSame(M27_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-3-1 — Grammar: ほうがいい (should / better to) + drill
// ═══════════════════════════════════════════════════════════════════════

const M27_3_1_REVIEW = pickReviewAtoms("ja-m27-3-1-rev", M27_REVIEW_POOL, 4);

export const M27_3_1: LessonContent = {
  id: "ja-m27-3-1",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Should — ほうがいい",
  description:
    "Give and understand advice with た-form + ほうがいい.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_HOU_GA_II,
    cloze(
      "ja-m27-3-1-cloze-1",
      "くすりを のんだ",
      "がいいです。",
      "ほう",
      ["ほう", "こと", "つもり", "とき"],
      "You should take medicine.",
      "くすりを のんだほうがいいです。",
      "た-form + ほうがいい = should.",
    ),
    sentenceMcq({
      id: "ja-m27-3-1-mcq-1",
      prompt: "Which sentence means 'You should sleep early.'?",
      correctKana: "はやく ねたほうがいいです。",
      distractorsKana: [
        "はやく ねるほうがいいです。",
        "はやく ねたことがあります。",
        "はやく ねなければなりません。",
      ],
      explanation: "ねる → ねた (た-form) + ほうがいい = should sleep.",
    }),
    build(
      "ja-m27-3-1-build-1",
      "Say: You should exercise.",
      "うんどうしたほうがいいです",
      ["です", "いい", "した", "ほう", "する", "が", "しない", "うんどう"],
      ["うんどう", "した", "ほう", "が", "いい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m27-3-1-lc-1",
      audioText: "おさけを のまないほうがいいですよ",
      correctMeaningEn: "You'd better not drink alcohol.",
      distractorsEn: [
        "You should drink alcohol.",
        "You must not drink alcohol.",
        "I don't drink alcohol.",
      ],
    }),
    cloze(
      "ja-m27-3-1-cloze-2",
      "びょういんに いった",
      "がいいですよ。",
      "ほう",
      ["ほう", "こと", "つもり", "ため"],
      "You should go to the hospital.",
      "びょういんに いったほうがいいですよ。",
      "た-form + ほうがいい = advice.",
    ),
    speaking(
      "ja-m27-3-1-speak-1",
      "くすりを のんだほうがいいです",
      "You should take medicine.",
    ),
    build(
      "ja-m27-3-1-build-2",
      "Say: You'd better not eat too much.",
      "たべすぎないほうがいいです",
      ["ほう", "が", "たべない", "たべすぎない", "です", "たべすぎた", "いい"],
      ["たべすぎない", "ほう", "が", "いい", "です"],
    ),
    cloze(
      "ja-m27-3-1-cloze-3",
      "もっと れんしゅうした",
      "がいいですよ。",
      "ほう",
      ["ほう", "こと", "つもり", "から"],
      "You should practice more.",
      "もっと れんしゅうしたほうがいいですよ。",
      "した (た-form of する) + ほうがいい.",
    ),
    listeningBuildSentence({
      id: "ja-m27-3-1-lb-1",
      target: "はやく ねたほうがいいですよ",
      tiles: ["ほう", "ですよ", "ねた", "ねない", "いい", "ねる", "はやく", "が"],
      correctOrder: ["はやく", "ねた", "ほう", "が", "いい", "ですよ"],
      promptEn: "Hear it, build it: 'You should go to sleep early.'",
    }),
    sentenceMcq({
      id: "ja-m27-3-1-mcq-2",
      prompt: "Which means 'You'd better not go to that dangerous place.'?",
      correctKana: "あの きけんな ところに いかないほうがいいです。",
      distractorsKana: [
        "あの きけんな ところに いったほうがいいです。",
        "あの きけんな ところに いかなければなりません。",
        "あの きけんな ところに いきましょう。",
      ],
      explanation: "ない-form (いかない) + ほうがいい = better not to go.",
    }),
    translateStep({
      id: "ja-m27-3-1-translate",
      promptEn: "You should exercise.",
      acceptedAnswers: [
        "うんどうしたほうがいいです",
        "うんどうしたほうがいいです。",
        "うんどうしたほうがいいですよ",
      ],
      audioText: "うんどうしたほうがいいです",
    }),
    selfExplain({
      id: "ja-m27-3-1-self-explain",
      anchorLabel: "のんだほうがいい vs のまなければならない",
      anchorAudioText: "くすりを のんだほうがいいです",
      question: "What's the difference between ほうがいい and なければならない?",
      rule: { text: "ほうがいい = advice/recommendation ('you should'). なければならない = obligation ('you must'). Advice is softer than obligation." },
      surface: { text: "They mean the same thing — both are ways to say 'should.'" },
      distractor: { text: "ほうがいい is for others and なければならない is for yourself." },
      ruleExplanation:
        "ほうがいい = 'it would be better to' (advice, can be ignored). なければならない = 'must' (obligation, non-optional). Different levels of strength.",
    }),
    speaking(
      "ja-m27-3-1-speak-2",
      "おさけを のまないほうがいいですよ",
      "You'd better not drink alcohol.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m27-3-1-rev-mcq-1", M27_3_1_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-3-1-rev-lc-1",
      audioText: "あさごはんを たべましたか",
      correctMeaningEn: "Did you eat breakfast?",
      distractorsEn: [
        "Did you make breakfast?",
        "What did you eat for breakfast?",
        "I eat breakfast every day.",
      ],
    }),
    speaking("ja-m27-3-1-rev-speak-1", M27_3_1_REVIEW[2].kana, M27_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-3-1-rev", M27_3_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M27_3_1.steps);
assertAnswerRotation(M27_3_1.steps, 1);
assertNoConsecutiveSame(M27_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-3-2 — ほうがいい in context + なければならない interleave
// ═══════════════════════════════════════════════════════════════════════

const M27_3_2_REVIEW = pickReviewAtoms("ja-m27-3-2-rev", M27_REVIEW_POOL, 4);

export const M27_3_2: LessonContent = {
  id: "ja-m27-3-2",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Advice + obligation interleave",
  description:
    "Mix ほうがいい (advice) with なければならない (obligation) — know when to use each.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m27-3-2-build-1",
      "Say: You should go home early.",
      "はやく かえったほうがいいですよ",
      ["かえらなければ", "が", "ほう", "ですよ", "いい", "かえった", "はやく"],
      ["はやく", "かえった", "ほう", "が", "いい", "ですよ"],
    ),
    cloze(
      "ja-m27-3-2-cloze-1",
      "しけんの じゅんびを し",
      "なりません。",
      "なければ",
      ["なければ", "たほうが", "ないで", "なくて"],
      "I must prepare for the exam.",
      "しけんの じゅんびを しなければなりません。",
      "なければなりません = must (obligation).",
    ),
    listeningCompSentence({
      id: "ja-m27-3-2-lc-1",
      audioText: "もっと やすんだほうがいいですよ",
      correctMeaningEn: "You should rest more.",
      distractorsEn: [
        "You must rest more.",
        "You rested too much.",
        "You don't need to rest.",
      ],
    }),
    sentenceMcq({
      id: "ja-m27-3-2-mcq-1",
      prompt: "Which is ADVICE (not obligation)?",
      correctKana: "みずを のんだほうがいいですよ。",
      distractorsKana: [
        "みずを のまなければなりません。",
        "みずを のまなくちゃ。",
        "みずを のまないでください。",
      ],
      explanation: "ほうがいい = advice/recommendation (softer than must).",
    }),
    cloze(
      "ja-m27-3-2-cloze-2",
      "がんばった",
      "がいいです。",
      "ほう",
      ["ほう", "こと", "つもり", "ため"],
      "You should do your best.",
      "がんばったほうがいいです。",
      "た-form + ほうがいい.",
    ),
    speaking(
      "ja-m27-3-2-speak-1",
      "はやく かえったほうがいいですよ",
      "You should go home early.",
    ),
    build(
      "ja-m27-3-2-build-2",
      "Say: I must keep my promise.",
      "やくそくを まもらなければなりません",
      ["まもった", "やくそく", "なりません", "を", "まもらなければ", "ほうがいい"],
      ["やくそく", "を", "まもらなければ", "なりません"],
    ),
    cloze(
      "ja-m27-3-2-cloze-3",
      "きけんな ところに いかない",
      "がいいです。",
      "ほう",
      ["ほう", "こと", "つもり", "から"],
      "You'd better not go to dangerous places.",
      "きけんな ところに いかないほうがいいです。",
      "ない-form + ほうがいい = better not to.",
    ),
    listeningBuildSentence({
      id: "ja-m27-3-2-lb-1",
      target: "うんどうしたほうがいいですよ",
      tiles: ["ですよ", "なりません", "した", "ほう", "いい", "うんどう", "しなければ", "が"],
      correctOrder: ["うんどう", "した", "ほう", "が", "いい", "ですよ"],
      promptEn: "Hear it, build it: 'You should exercise.'",
    }),
    sentenceMcq({
      id: "ja-m27-3-2-mcq-2",
      prompt: "Which means 'I must decide today.'?",
      correctKana: "きょう きめなければなりません。",
      distractorsKana: [
        "きょう きめたほうがいいです。",
        "きょう きめました。",
        "きょう きめるつもりです。",
      ],
      explanation: "なければなりません = must (obligation, stronger than advice).",
    }),
    translateStep({
      id: "ja-m27-3-2-translate",
      promptEn: "You should rest.",
      acceptedAnswers: [
        "やすんだほうがいいです",
        "やすんだほうがいいです。",
        "やすんだほうがいいですよ",
      ],
      audioText: "やすんだほうがいいです",
    }),
    selfExplain({
      id: "ja-m27-3-2-self-explain",
      anchorLabel: "いったほうがいい vs いかなければならない",
      anchorAudioText: "びょういんに いったほうがいいですよ",
      question: "When would you use ほうがいい instead of なければならない?",
      rule: { text: "ほうがいい when giving friendly advice (take it or leave it). なければならない for real obligations (non-optional). Use ほうがいい for health tips to friends; なければならない for rules." },
      surface: { text: "ほうがいい is for formal situations, なければならない for casual." },
      distractor: { text: "ほうがいい is only for negative advice (don't do X)." },
      ruleExplanation:
        "ほうがいい = 'it would be better' (recommendation). なければならない = 'must' (obligation). Advice vs duty.",
    }),
    speaking(
      "ja-m27-3-2-speak-2",
      "やくそくを まもらなければなりません",
      "I must keep my promise.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m27-3-2-rev-mcq-1", M27_3_2_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-3-2-rev-lc-1",
      audioText: "ぎんこうに いかなければなりません",
      correctMeaningEn: "I have to go to the bank.",
      distractorsEn: [
        "I want to go to the bank.",
        "I should go to the hospital.",
        "I went to the bank yesterday.",
      ],
    }),
    speaking("ja-m27-3-2-rev-speak-1", M27_3_2_REVIEW[2].kana, M27_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-3-2-rev", M27_3_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M27_3_2.steps);
assertAnswerRotation(M27_3_2.steps, 1);
assertNoConsecutiveSame(M27_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-4-1 — Grammar: 〜く/〜になる (become) + drill
// ═══════════════════════════════════════════════════════════════════════

const M27_4_1_REVIEW = pickReviewAtoms("ja-m27-4-1-rev", M27_REVIEW_POOL, 4);

export const M27_4_1: LessonContent = {
  id: "ja-m27-4-1",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Become — 〜く/〜になる",
  description:
    "Express change of state with い-adj くなる and な-adj/noun になる.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_KU_NI_NARU,
    // ── なる (to become) — the dictionary-form verb behind くなる/になる ──
    build(
      "ja-m27-4-1-build-naru",
      "Pick the dictionary form of: to become",
      "なる",
      ["なります", "なる", "なった", "する"],
      ["なる"],
    ),
    listeningCompSentence({
      id: "ja-m27-4-1-lc-naru",
      audioText: "せんせいに なりたいです",
      correctMeaningEn: "I want to become a teacher.",
      distractorsEn: [
        "I want to meet the teacher.",
        "I became a teacher.",
        "I must become a teacher.",
      ],
    }),
    cloze(
      "ja-m27-4-1-cloze-1",
      "さむ",
      "なりました。",
      "く",
      ["く", "に", "い", "な"],
      "It became cold.",
      "さむくなりました。",
      "い-adjective: drop い, add く + なる.",
    ),
    sentenceMcq({
      id: "ja-m27-4-1-mcq-1",
      prompt: "Which sentence means 'My Japanese got better.'?",
      correctKana: "にほんごが じょうずになりました。",
      distractorsKana: [
        "にほんごが じょうずくなりました。",
        "にほんごは じょうずになります。",
        "にほんごが じょうずでした。",
      ],
      explanation: "な-adjective (じょうず) + になる = become skilled.",
    }),
    build(
      "ja-m27-4-1-build-1",
      "Say: I want to become big / grow up.",
      "おおきくなりたいです",
      ["おおきい", "になる", "おおきく", "です", "なりたい", "なる"],
      ["おおきく", "なりたい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m27-4-1-lc-1",
      audioText: "あつくなりましたね",
      correctMeaningEn: "It got hot, didn't it?",
      distractorsEn: [
        "It's getting cold.",
        "It became safe.",
        "It's too hot.",
      ],
    }),
    cloze(
      "ja-m27-4-1-cloze-2",
      "げんき",
      "なりました。",
      "に",
      ["に", "く", "な", "が"],
      "I became healthy / I feel better.",
      "げんきになりました。",
      "な-adjective (げんき) + になる.",
    ),
    speaking(
      "ja-m27-4-1-speak-1",
      "さむくなりました",
      "It became cold.",
    ),
    build(
      "ja-m27-4-1-build-2",
      "Say: It became safe.",
      "あんぜんになりました",
      ["あんぜんく", "に", "あんぜん", "なりました", "なります", "なる"],
      ["あんぜん", "に", "なりました"],
    ),
    // ── だんだん (gradually) — build intro ──
    build(
      "ja-m27-4-1-build-dandan",
      "Pick the Japanese word for: Gradually",
      "だんだん",
      ["とても", "だんだん", "ときどき", "もっと"],
      ["だんだん"],
    ),
    listeningCompSentence({
      id: "ja-m27-4-1-lc-dandan",
      audioText: "だんだん じょうずになります",
      correctMeaningEn: "You'll gradually get better (at it).",
      distractorsEn: [
        "You suddenly got better (at it).",
        "You're very good (at it).",
        "You'll gradually get used (to it).",
      ],
    }),
    build(
      "ja-m27-4-1-build-dandan-samuku",
      "Say: It will gradually get cold.",
      "だんだん さむくなります",
      ["さむく", "だんだん", "なります", "さむい", "なりました", "に"],
      ["だんだん", "さむく", "なります"],
    ),
    cloze(
      "ja-m27-4-1-cloze-3",
      "たか",
      "なりました。",
      "く",
      ["く", "に", "い", "な"],
      "It became expensive.",
      "たかくなりました。",
      "い-adjective: たかい → たか + くなる.",
    ),
    listeningBuildSentence({
      id: "ja-m27-4-1-lb-1",
      target: "にほんごが じょうずになりました",
      tiles: ["に", "が", "なりました", "にほんご", "なります", "じょうず", "じょうずく"],
      correctOrder: ["にほんご", "が", "じょうず", "に", "なりました"],
      promptEn: "Hear it, build it: 'My Japanese got better.'",
    }),
    sentenceMcq({
      id: "ja-m27-4-1-mcq-2",
      prompt: "Which means 'The room became dark.'?",
      correctKana: "へやが くらくなりました。",
      distractorsKana: [
        "へやが くらいになりました。",
        "へやが くらになりました。",
        "へやは くらいです。",
      ],
      explanation: "くらい (い-adj) → くら + くなる = became dark.",
    }),
    translateStep({
      id: "ja-m27-4-1-translate",
      promptEn: "It became cold.",
      acceptedAnswers: [
        "さむくなりました",
        "さむくなりました。",
      ],
      audioText: "さむくなりました",
    }),
    selfExplain({
      id: "ja-m27-4-1-self-explain",
      anchorLabel: "さむくなる vs げんきになる",
      anchorAudioText: "さむくなりました",
      question: "Why さむくなる (with く) but げんきになる (with に)?",
      rule: { text: "い-adjectives use く before なる (drop い, add く). な-adjectives and nouns use に before なる. Different word classes, different connectors." },
      surface: { text: "Both く and に work with any adjective." },
      distractor: { text: "く is for weather and に is for people." },
      ruleExplanation:
        "い-adj: drop い, add くなる (さむい → さむくなる). な-adj/noun: add になる (げんき → げんきになる). Same concept (become), different connectors per word class.",
    }),
    speaking(
      "ja-m27-4-1-speak-2",
      "げんきになりました",
      "I feel better / I became healthy.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m27-4-1-rev-mcq-1", M27_4_1_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-4-1-rev-lc-1",
      audioText: "この いすは わたしのです",
      correctMeaningEn: "This chair is mine.",
      distractorsEn: [
        "This desk is mine.",
        "This chair is my friend's.",
        "That chair is small.",
      ],
    }),
    speaking("ja-m27-4-1-rev-speak-1", M27_4_1_REVIEW[2].kana, M27_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-4-1-rev", M27_4_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M27_4_1.steps);
assertAnswerRotation(M27_4_1.steps, 1);
assertNoConsecutiveSame(M27_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-4-2 — なる in context + all grammar interleave
// ═══════════════════════════════════════════════════════════════════════

const M27_4_2_REVIEW = pickReviewAtoms("ja-m27-4-2-rev", M27_REVIEW_POOL, 4);

export const M27_4_2: LessonContent = {
  id: "ja-m27-4-2",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Change + advice + obligation",
  description:
    "Mix なる with ほうがいい and なければならない in context.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m27-4-2-build-1",
      "Say: It got cold. You should wear a jacket.",
      "さむくなりました。ジャケットを きたほうがいいですよ",
      ["いい", "なりました", "ジャケット", "さむい", "きた", "が", "さむく", "ですよ", "を", "ほう"],
      ["さむく", "なりました", "ジャケット", "を", "きた", "ほう", "が", "いい", "ですよ"],
    ),
    cloze(
      "ja-m27-4-2-cloze-1",
      "あんぜん",
      "なりました。",
      "に",
      ["に", "く", "が", "な"],
      "It became safe.",
      "あんぜんになりました。",
      "な-adjective + になる = become.",
    ),
    listeningCompSentence({
      id: "ja-m27-4-2-lc-1",
      audioText: "げんきになりたかったら、うんどうしたほうがいいですよ",
      correctMeaningEn: "If you want to get healthy, you should exercise.",
      distractorsEn: [
        "You must exercise to be healthy.",
        "I got healthy because I exercised.",
        "Exercise is dangerous.",
      ],
    }),
    sentenceMcq({
      id: "ja-m27-4-2-mcq-1",
      prompt: "Which means 'The exam is getting harder.'?",
      correctKana: "しけんが むずかしくなっています。",
      distractorsKana: [
        "しけんが むずかしいになっています。",
        "しけんは むずかしくないです。",
        "しけんが むずかしかったです。",
      ],
      explanation: "むずかしい → むずかしく + なる = become difficult.",
    }),
    cloze(
      "ja-m27-4-2-cloze-2",
      "けんこう",
      "なるために、うんどうしなければなりません。",
      "に",
      ["に", "く", "が", "な"],
      "I must exercise to become healthy.",
      "けんこうになるために、うんどうしなければなりません。",
      "な-adj + になる + ために + なければならない.",
    ),
    speaking(
      "ja-m27-4-2-speak-1",
      "さむくなりましたね",
      "It got cold, didn't it?",
    ),
    build(
      "ja-m27-4-2-build-2",
      "Say: I must continue practicing.",
      "れんしゅうを つづけなければなりません",
      ["つづけなければ", "を", "なりません", "つづけた", "れんしゅう", "ほうがいい"],
      ["れんしゅう", "を", "つづけなければ", "なりません"],
    ),
    cloze(
      "ja-m27-4-2-cloze-3",
      "にほんごが じょうず",
      "なりたいです。",
      "に",
      ["に", "く", "が", "な"],
      "I want to become good at Japanese.",
      "にほんごが じょうずになりたいです。",
      "な-adj + になる + たい = want to become.",
    ),
    listeningBuildSentence({
      id: "ja-m27-4-2-lb-1",
      target: "きけんに ならないように きをつけなければなりません",
      tiles: ["きをつけなければ", "に", "きけん", "なった", "きをつけた", "ならないように", "なりません"],
      correctOrder: ["きけん", "に", "ならないように", "きをつけなければ", "なりません"],
      promptEn: "Hear it, build it: 'I must be careful not to become dangerous.'",
    }),
    sentenceMcq({
      id: "ja-m27-4-2-mcq-2",
      prompt: "Which means 'You should do your best.'?",
      correctKana: "がんばったほうがいいですよ。",
      distractorsKana: [
        "がんばらなければなりません。",
        "がんばりましょう。",
        "がんばるくなりました。",
      ],
      explanation: "た-form + ほうがいい = should (advice).",
    }),
    translateStep({
      id: "ja-m27-4-2-translate",
      promptEn: "I want to become good at Japanese.",
      acceptedAnswers: [
        "にほんごが じょうずになりたいです",
        "にほんごが じょうずになりたいです。",
      ],
      audioText: "にほんごが じょうずになりたいです",
    }),
    selfExplain({
      id: "ja-m27-4-2-self-explain",
      anchorLabel: "Three M27 patterns working together",
      anchorAudioText: "さむくなりました",
      question: "Which pattern describes CHANGE, which gives ADVICE, and which expresses OBLIGATION?",
      rule: { text: "くなる/になる = change (become). ほうがいい = advice (should). なければならない = obligation (must). Three distinct functions." },
      surface: { text: "They all express obligation at different levels." },
      distractor: { text: "くなる is advice, ほうがいい is change, なければ is obligation." },
      ruleExplanation:
        "Change: さむくなる (became cold). Advice: きたほうがいい (should wear). Obligation: きをつけなければ (must be careful). Each has its own role.",
    }),
    speaking(
      "ja-m27-4-2-speak-2",
      "れんしゅうを つづけなければなりません",
      "I must continue practicing.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m27-4-2-rev-mcq-1", M27_4_2_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-4-2-rev-lc-1",
      audioText: "あなたの けいたいは どれですか",
      correctMeaningEn: "Which one is your mobile phone?",
      distractorsEn: [
        "Where is your mobile phone?",
        "Is this your mobile phone?",
        "Whose mobile phone is this?",
      ],
    }),
    speaking("ja-m27-4-2-rev-speak-1", M27_4_2_REVIEW[2].kana, M27_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-4-2-rev", M27_4_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M27_4_2.steps);
assertAnswerRotation(M27_4_2.steps, 1);
assertNoConsecutiveSame(M27_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-5-1 — Interleaved drill (all three grammar points)
// ═══════════════════════════════════════════════════════════════════════

const M27_5_1_REVIEW = pickReviewAtoms("ja-m27-5-1-rev", M27_REVIEW_POOL, 4);

export const M27_5_1: LessonContent = {
  id: "ja-m27-5-1",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed drill — all patterns",
  description:
    "Rapid-fire interleave of なければ, ほうがいい, and くなる/になる.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    cloze(
      "ja-m27-5-1-cloze-1",
      "やさいを たべなければ",
      "。",
      "なりません",
      ["なりません", "いいです", "なりました", "ください"],
      "I must eat vegetables.",
      "やさいを たべなければなりません。",
      "なければなりません = must.",
    ),
    sentenceMcq({
      id: "ja-m27-5-1-mcq-1",
      prompt: "Which means 'You should rest.'?",
      correctKana: "やすんだほうがいいですよ。",
      distractorsKana: [
        "やすまなければなりません。",
        "やすくなりました。",
        "やすみましょう。",
      ],
      explanation: "た-form + ほうがいい = should (advice).",
    }),
    cloze(
      "ja-m27-5-1-cloze-2",
      "あつ",
      "なりました。",
      "く",
      ["く", "に", "い", "な"],
      "It became hot.",
      "あつくなりました。",
      "い-adj + くなる = become.",
    ),
    build(
      "ja-m27-5-1-build-1",
      "Say: You'd better not go. It's dangerous.",
      "いかないほうがいいです。きけんです",
      ["が", "いい", "ほう", "です", "いかない", "いかなければ", "きけん", "です"],
      ["いかない", "ほう", "が", "いい", "です", "きけん", "です"],
    ),
    listeningCompSentence({
      id: "ja-m27-5-1-lc-1",
      audioText: "にほんごが じょうずになりましたね",
      correctMeaningEn: "Your Japanese has gotten better!",
      distractorsEn: [
        "You must study Japanese.",
        "You should study Japanese.",
        "Japanese is difficult.",
      ],
    }),
    cloze(
      "ja-m27-5-1-cloze-3",
      "はやく ねた",
      "がいいですよ。",
      "ほう",
      ["ほう", "こと", "つもり", "から"],
      "You should go to sleep early.",
      "はやく ねたほうがいいですよ。",
      "た-form + ほうがいい = advice.",
    ),
    speaking(
      "ja-m27-5-1-speak-1",
      "にほんごが じょうずになりましたね",
      "Your Japanese has gotten better!",
    ),
    cloze(
      "ja-m27-5-1-cloze-4",
      "しけんの じゅんびを しなければ",
      "。",
      "なりません",
      ["なりません", "いいです", "なりました", "ください"],
      "I must prepare for the exam.",
      "しけんの じゅんびを しなければなりません。",
      "なければなりません = obligation.",
    ),
    build(
      "ja-m27-5-1-build-2",
      "Say: It became safe. I'm relieved.",
      "あんぜんになりました。あんしんしました",
      ["きけん", "なりました", "しました", "あんしん", "あんぜん", "あんぜんく", "に"],
      ["あんぜん", "に", "なりました", "あんしん", "しました"],
    ),
    listeningBuildSentence({
      id: "ja-m27-5-1-lb-1",
      target: "もっと がんばらなければなりません",
      tiles: ["がんばらなければ", "もっと", "なりません", "ほうがいい", "がんばった", "がんばる"],
      correctOrder: ["もっと", "がんばらなければ", "なりません"],
      promptEn: "Hear it, build it: 'I must try harder.'",
    }),
    sentenceMcq({
      id: "ja-m27-5-1-mcq-2",
      prompt: "Which means 'Spring has come (it became warm).'?",
      correctKana: "あたたかくなりました。",
      distractorsKana: [
        "あたたかいになりました。",
        "あたたかになりました。",
        "あたたかくないです。",
      ],
      explanation: "あたたかい → あたたかく + なる = became warm.",
    }),
    translateStep({
      id: "ja-m27-5-1-translate",
      promptEn: "You should exercise more.",
      acceptedAnswers: [
        "もっと うんどうしたほうがいいです",
        "もっと うんどうしたほうがいいです。",
        "もっと うんどうしたほうがいいですよ",
      ],
      audioText: "もっと うんどうしたほうがいいです",
    }),
    selfExplain({
      id: "ja-m27-5-1-self-explain",
      anchorLabel: "Pattern discrimination",
      anchorAudioText: "さむくなりました",
      question: "How do you quickly tell if a sentence is about change, advice, or obligation?",
      rule: { text: "くなる/になる = change (something BECAME). ほうがいい = advice (you SHOULD). なければならない = obligation (you MUST). Look for the key suffix." },
      surface: { text: "You can't tell — they all look the same." },
      distractor: { text: "Check if the sentence is positive or negative — that determines the pattern." },
      ruleExplanation:
        "Quick check: see くなる/になる → change. See ほうがいい → advice. See なければ → must. The suffix is the signal.",
    }),
    speaking(
      "ja-m27-5-1-speak-2",
      "もっと がんばらなければなりません",
      "I must try harder.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m27-5-1-rev-mcq-1", M27_5_1_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-5-1-rev-lc-1",
      audioText: "アメリカに いきたいです",
      correctMeaningEn: "I want to go to America.",
      distractorsEn: [
        "I want to go to Japan.",
        "I have been to America.",
        "I live in America.",
      ],
    }),
    speaking("ja-m27-5-1-rev-speak-1", M27_5_1_REVIEW[2].kana, M27_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-5-1-rev", M27_5_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M27_5_1.steps);
assertAnswerRotation(M27_5_1.steps, 1);
assertNoConsecutiveSame(M27_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-5-2 — Production drill
// ═══════════════════════════════════════════════════════════════════════

const M27_5_2_REVIEW = pickReviewAtoms("ja-m27-5-2-rev", M27_REVIEW_POOL, 4);

export const M27_5_2: LessonContent = {
  id: "ja-m27-5-2",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — modal grammar",
  description:
    "Heavy production with all M27 patterns.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    build(
      "ja-m27-5-2-build-1",
      "Say: I must go to the bank.",
      "ぎんこうに いかなければなりません",
      ["なりません", "に", "ほうがいい", "ぎんこう", "いった", "いかなければ"],
      ["ぎんこう", "に", "いかなければ", "なりません"],
    ),
    speaking(
      "ja-m27-5-2-speak-1",
      "ぎんこうに いかなければなりません",
      "I must go to the bank.",
    ),
    listeningCompSentence({
      id: "ja-m27-5-2-lc-1",
      audioText: "けんこうに なりたかったら うんどうしたほうがいいですよ",
      correctMeaningEn: "If you want to become healthy, you should exercise.",
      distractorsEn: [
        "You must exercise to be healthy.",
        "I became healthy by exercising.",
        "Exercise is too difficult.",
      ],
    }),
    build(
      "ja-m27-5-2-build-2",
      "Say: My Japanese is getting better.",
      "にほんごが じょうずになっています",
      ["なりました", "じょうず", "なっています", "にほんご", "に", "が", "じょうずく"],
      ["にほんご", "が", "じょうず", "に", "なっています"],
    ),
    sentenceMcq({
      id: "ja-m27-5-2-mcq-1",
      prompt: "Which means 'You must be more careful.'?",
      correctKana: "もっと きをつけなければなりません。",
      distractorsKana: [
        "もっと きをつけたほうがいいです。",
        "きをつけくなりました。",
        "きをつけましょう。",
      ],
      explanation: "なければなりません = must (obligation).",
    }),
    speaking(
      "ja-m27-5-2-speak-2",
      "にほんごが じょうずになっています",
      "My Japanese is getting better.",
    ),
    build(
      "ja-m27-5-2-build-3",
      "Say: You should take medicine and rest.",
      "くすりを のんで やすんだほうがいいです",
      ["です", "のんで", "が", "くすり", "のまなければ", "ほう", "いい", "やすんだ", "を"],
      ["くすり", "を", "のんで", "やすんだ", "ほう", "が", "いい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m27-5-2-lb-1",
      target: "あたたかくなりましたね",
      tiles: ["ね", "なりました", "に", "なります", "あたたかく", "あたたかい"],
      correctOrder: ["あたたかく", "なりました", "ね"],
      promptEn: "Hear it, build it: 'It became warm, didn't it?'",
    }),
    cloze(
      "ja-m27-5-2-cloze-1",
      "がんばった",
      "がいいですよ。",
      "ほう",
      ["ほう", "こと", "つもり", "ため"],
      "You should do your best.",
      "がんばったほうがいいですよ。",
      "た-form + ほうがいい = advice.",
    ),
    speaking(
      "ja-m27-5-2-speak-3",
      "くすりを のんで やすんだほうがいいです",
      "You should take medicine and rest.",
    ),
    build(
      "ja-m27-5-2-build-4",
      "Say: I must continue every day.",
      "まいにち つづけなければなりません",
      ["ほうがいい", "つづけた", "なりません", "つづける", "まいにち", "つづけなければ"],
      ["まいにち", "つづけなければ", "なりません"],
    ),
    cloze(
      "ja-m27-5-2-cloze-2",
      "はる",
      "なって、あたたかくなりました。",
      "に",
      ["に", "く", "が", "な"],
      "Spring came and it became warm.",
      "はるになって、あたたかくなりました。",
      "はる (noun) + になる = became spring.",
    ),
    selfExplain({
      id: "ja-m27-5-2-self-explain",
      anchorLabel: "M27 production mastery",
      anchorAudioText: "くすりを のんだほうがいいです",
      question: "You want to say 'It got dangerous. You must be careful.' Which patterns do you use?",
      rule: { text: "くなる/になる for change (きけんになった). なければならない for obligation (きをつけなければならない). Two patterns, one natural sentence." },
      surface: { text: "Just ほうがいい for both — it covers change and obligation." },
      distractor: { text: "Use なければならない for both — change and obligation are the same." },
      ruleExplanation:
        "きけんになった (it became dangerous) = change. きをつけなければならない (must be careful) = obligation. Each situation calls for its own pattern.",
    }),
    speaking(
      "ja-m27-5-2-speak-4",
      "まいにち つづけなければなりません",
      "I must continue every day.",
    ),
    translateStep({
      id: "ja-m27-5-2-translate",
      promptEn: "You should do your best.",
      acceptedAnswers: [
        "がんばったほうがいいですよ",
        "がんばったほうがいいです",
        "がんばったほうがいいです。",
      ],
      audioText: "がんばったほうがいいですよ",
    }),
    // ── Review tail ──
    vocabMcq("ja-m27-5-2-rev-mcq-1", M27_5_2_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-5-2-rev-lc-1",
      audioText: "じてんしゃで いったほうがいいです",
      correctMeaningEn: "You should go by bicycle.",
      distractorsEn: [
        "You should go by bus.",
        "You must go by bicycle.",
        "I like riding bicycles.",
      ],
    }),
    speaking("ja-m27-5-2-rev-speak-1", M27_5_2_REVIEW[2].kana, M27_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-5-2-rev", M27_5_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M27_5_2.steps);
assertAnswerRotation(M27_5_2.steps, 1);
assertNoConsecutiveSame(M27_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-6-1 — Advanced interleave + vocab integration
// ═══════════════════════════════════════════════════════════════════════

const M27_6_1_REVIEW = pickReviewAtoms("ja-m27-6-1-rev", M27_REVIEW_POOL, 4);

export const M27_6_1: LessonContent = {
  id: "ja-m27-6-1",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Advanced interleave",
  description:
    "All patterns with full vocab integration in complex sentences.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    build(
      "ja-m27-6-1-build-1",
      "Say: It became dangerous. I must be careful.",
      "きけんになりました。きをつけなければなりません",
      ["なりません", "なりました", "きけんく", "に", "きけん", "きをつけた", "きをつけなければ"],
      ["きけん", "に", "なりました", "きをつけなければ", "なりません"],
    ),
    cloze(
      "ja-m27-6-1-cloze-1",
      "くすりを のんだ",
      "がいいですよ。",
      "ほう",
      ["ほう", "こと", "なければ", "つもり"],
      "You should take medicine.",
      "くすりを のんだほうがいいですよ。",
      "た-form + ほうがいい = advice.",
    ),
    listeningCompSentence({
      id: "ja-m27-6-1-lc-1",
      audioText: "しけんが ちかくなりました。べんきょうしなくちゃ",
      correctMeaningEn: "The exam is getting close. I gotta study.",
      distractorsEn: [
        "The exam got easier. I should relax.",
        "The exam is over. I studied.",
        "The exam is far away. I have time.",
      ],
    }),
    sentenceMcq({
      id: "ja-m27-6-1-mcq-1",
      prompt: "Which means 'Health became important.'?",
      correctKana: "けんこうが たいせつになりました。",
      distractorsKana: [
        "けんこうは たいせつです。",
        "けんこうが たいせつくなりました。",
        "けんこうを たいせつにします。",
      ],
      explanation: "な-adj (たいせつ) + になる = became important.",
    }),
    cloze(
      "ja-m27-6-1-cloze-2",
      "じかんを まもらなければ",
      "。",
      "なりません",
      ["なりません", "いいです", "なりました", "ください"],
      "I must be on time. (lit. protect the time)",
      "じかんを まもらなければなりません。",
      "じかんを まもる = keep the time → be punctual. なければなりません = must.",
    ),
    speaking(
      "ja-m27-6-1-speak-1",
      "きけんになりました。きをつけなければなりません",
      "It became dangerous. I must be careful.",
    ),
    build(
      "ja-m27-6-1-build-2",
      "Say: You should practice more to pass the exam.",
      "しけんに うかるために もっと れんしゅうしたほうがいいです",
      ["が", "です", "いい", "うかるために", "に", "しけん", "ほう", "もっと", "した", "れんしゅう"],
      ["しけん", "に", "うかるために", "もっと", "れんしゅう", "した", "ほう", "が", "いい", "です"],
    ),
    cloze(
      "ja-m27-6-1-cloze-3",
      "つよ",
      "なりたいです。",
      "く",
      ["く", "に", "い", "な"],
      "I want to become strong.",
      "つよくなりたいです。",
      "い-adj: つよい → つよく + なる.",
    ),
    listeningBuildSentence({
      id: "ja-m27-6-1-lb-1",
      target: "きをつけたほうがいいですよ",
      tiles: ["きをつけなければ", "いい", "なりません", "ですよ", "が", "ほう", "きをつけた"],
      correctOrder: ["きをつけた", "ほう", "が", "いい", "ですよ"],
      promptEn: "Hear it, build it: 'You should be careful.'",
    }),
    sentenceMcq({
      id: "ja-m27-6-1-mcq-2",
      prompt: "Which means 'I must fix this.'?",
      correctKana: "これを なおさなければなりません。",
      distractorsKana: [
        "これを なおしたほうがいいです。",
        "これが なおくなりました。",
        "これを なおしました。",
      ],
      explanation: "なおす → なおさない → なおさなければなりません.",
    }),
    translateStep({
      id: "ja-m27-6-1-translate",
      promptEn: "It became dangerous.",
      acceptedAnswers: [
        "きけんになりました",
        "きけんになりました。",
      ],
      audioText: "きけんになりました",
    }),
    selfExplain({
      id: "ja-m27-6-1-self-explain",
      anchorLabel: "All patterns with context",
      anchorAudioText: "きけんになりました",
      question: "How do you choose between ほうがいい and なければならない?",
      rule: { text: "ほうがいい for friendly advice (optional). なければならない for duties/obligations (non-optional). Health tip to a friend → ほうがいい. Doctor's order → なければならない." },
      surface: { text: "ほうがいい for positive, なければならない for negative." },
      distractor: { text: "ほうがいい is always more polite than なければならない." },
      ruleExplanation:
        "Advice (take it or leave it) = ほうがいい. Obligation (must do) = なければならない. The choice depends on how mandatory the action is.",
    }),
    speaking(
      "ja-m27-6-1-speak-2",
      "もっと れんしゅうしたほうがいいです",
      "You should practice more.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m27-6-1-rev-mcq-1", M27_6_1_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-6-1-rev-lc-1",
      audioText: "えきに トイレが あります",
      correctMeaningEn: "There is a toilet in the station.",
      distractorsEn: [
        "There is a bank in the station.",
        "There is no toilet in the station.",
        "Where is the station toilet?",
      ],
    }),
    speaking("ja-m27-6-1-rev-speak-1", M27_6_1_REVIEW[2].kana, M27_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-6-1-rev", M27_6_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M27_6_1.steps);
assertAnswerRotation(M27_6_1.steps, 1);
assertNoConsecutiveSame(M27_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-6-2 — Heavy production
// ═══════════════════════════════════════════════════════════════════════

const M27_6_2_REVIEW = pickReviewAtoms("ja-m27-6-2-rev", M27_REVIEW_POOL, 5);

export const M27_6_2: LessonContent = {
  id: "ja-m27-6-2",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Heavy production",
  description:
    "Translate, build, and speak with all M27 patterns at full speed.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    build(
      "ja-m27-6-2-build-1",
      "Say: I must practice every day.",
      "まいにち れんしゅうしなければなりません",
      ["ほうがいい", "した", "しなければ", "れんしゅう", "まいにち", "なりません"],
      ["まいにち", "れんしゅう", "しなければ", "なりません"],
    ),
    speaking(
      "ja-m27-6-2-speak-1",
      "まいにち れんしゅうしなければなりません",
      "I must practice every day.",
    ),
    listeningCompSentence({
      id: "ja-m27-6-2-lc-1",
      audioText: "おおきくなったら いしゃに なりたいです",
      correctMeaningEn: "When I grow up, I want to become a doctor.",
      distractorsEn: [
        "The doctor got bigger.",
        "I must become a doctor.",
        "Doctors should grow up.",
      ],
    }),
    build(
      "ja-m27-6-2-build-2",
      "Say: You should eat vegetables.",
      "やさいを たべたほうがいいですよ",
      ["ですよ", "やさい", "たべなければ", "いい", "を", "が", "ほう", "たべた"],
      ["やさい", "を", "たべた", "ほう", "が", "いい", "ですよ"],
    ),
    sentenceMcq({
      id: "ja-m27-6-2-mcq-1",
      prompt: "Which means 'I became healthy.'?",
      correctKana: "けんこうになりました。",
      distractorsKana: [
        "けんこうくなりました。",
        "けんこうがなりました。",
        "けんこうをなりました。",
      ],
      explanation: "な-adj/noun + になる = became.",
    }),
    speaking(
      "ja-m27-6-2-speak-2",
      "やさいを たべたほうがいいですよ",
      "You should eat vegetables.",
    ),
    build(
      "ja-m27-6-2-build-3",
      "Say: It became cold. I gotta wear a jacket.",
      "さむくなりました。ジャケットを きなくちゃ",
      ["きなくちゃ", "さむく", "さむい", "きなければ", "ジャケット", "なりました", "を"],
      ["さむく", "なりました", "ジャケット", "を", "きなくちゃ"],
    ),
    listeningBuildSentence({
      id: "ja-m27-6-2-lb-1",
      target: "もっと がんばったほうがいいですよ",
      tiles: ["がんばらなければ", "がんばった", "が", "もっと", "いい", "ほう", "ですよ", "なりません"],
      correctOrder: ["もっと", "がんばった", "ほう", "が", "いい", "ですよ"],
      promptEn: "Hear it, build it: 'You should try harder.'",
    }),
    cloze(
      "ja-m27-6-2-cloze-1",
      "にほんごが じょうず",
      "なりたいです。",
      "に",
      ["に", "く", "が", "な"],
      "I want to become good at Japanese.",
      "にほんごが じょうずになりたいです。",
      "な-adj + になる + たい.",
    ),
    speaking(
      "ja-m27-6-2-speak-3",
      "さむくなりました。ジャケットを きなくちゃ",
      "It became cold. I gotta wear a jacket.",
    ),
    build(
      "ja-m27-6-2-build-4",
      "Say: You'd better not forget your passport.",
      "パスポートを わすれないほうがいいですよ",
      ["を", "わすれない", "ですよ", "パスポート", "いい", "が", "わすれた", "ほう", "わすれなければ"],
      ["パスポート", "を", "わすれない", "ほう", "が", "いい", "ですよ"],
    ),
    cloze(
      "ja-m27-6-2-cloze-2",
      "あんぜん",
      "なるように きをつけましょう。",
      "に",
      ["に", "く", "が", "な"],
      "Let's be careful so it becomes safe.",
      "あんぜんになるように きをつけましょう。",
      "な-adj + になる.",
    ),
    selfExplain({
      id: "ja-m27-6-2-self-explain",
      anchorLabel: "Full M27 production mastery",
      anchorAudioText: "くすりを のまなければなりません",
      question: "What makes the three M27 patterns so useful together?",
      rule: { text: "They cover three essential speech acts: describing CHANGE (くなる/になる), giving ADVICE (ほうがいい), and expressing OBLIGATION (なければならない). Together, they handle most 'should/must/became' situations." },
      surface: { text: "They're only useful in formal settings like business or school." },
      distractor: { text: "They can only be used one at a time — never combined." },
      ruleExplanation:
        "Change + advice + obligation = the three pillars of modal grammar. さむくなりました (change) → ジャケットを きたほうがいい (advice) → きをつけなければなりません (obligation).",
    }),
    speaking(
      "ja-m27-6-2-speak-4",
      "パスポートを わすれないほうがいいですよ",
      "You'd better not forget your passport.",
    ),
    translateStep({
      id: "ja-m27-6-2-translate",
      promptEn: "I must protect my family.",
      acceptedAnswers: [
        "かぞくを まもらなければなりません",
        "かぞくを まもらなければなりません。",
        "かぞくを まもらなければいけません",
      ],
      audioText: "かぞくを まもらなければなりません",
    }),
    // ── Review tail ──
    vocabMcq("ja-m27-6-2-rev-mcq-1", M27_6_2_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-6-2-rev-lc-1",
      audioText: M27_6_2_REVIEW[1].kana,
      correctMeaningEn: M27_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M27_6_2_REVIEW[2].meaningEn,
        M27_6_2_REVIEW[3].meaningEn,
        M27_REVIEW_POOL[11].meaningEn,
      ],
    }),
    speaking("ja-m27-6-2-rev-speak-1", M27_6_2_REVIEW[2].kana, M27_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-6-2-rev", M27_6_2_REVIEW.slice(0, 4)),
  ],
};

assertNoSameAnswerCluster(M27_6_2.steps);
assertAnswerRotation(M27_6_2.steps, 1);
assertNoConsecutiveSame(M27_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-STORY — たけし's exam week (storyComprehension narrative,
//   §13.13 closer: must + should + become woven through one story)
// ═══════════════════════════════════════════════════════════════════════

export const M27_STORY: LessonContent = {
  id: "ja-m27-story",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — たけし's exam week",
  description:
    "Listen to たけし tell the story of his exam week — what he must do, how he's changing — and reply with your own advice.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    ...storyComprehension({
      idPrefix: "ja-m27-story-s1",
      narrative: [
        { kana: "らいしゅう しけんが あります。" },
        { kana: "しけんが ちかくなりました。" },
        { kana: "だから まいにち べんきょうしなければなりません。" },
        { kana: "でも、すこし つかれました。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "Why must たけし study every day?",
          correctText: "The exam is getting close.",
          distractors: [
            "He failed the last exam.",
            "His teacher told him to.",
            "He wants to become a teacher.",
          ],
          explanation:
            "しけんが ちかくなりました (the exam got close) + だから (so) + must study.",
        },
        {
          id: "s1-q2",
          prompt: "How does たけし feel?",
          correctText: "A little tired.",
          distractors: ["Very energetic.", "Sick.", "Relieved."],
          explanation: "すこし つかれました = I got a little tired.",
        },
      ],
      responseBuild: {
        target: "もっと やすんだほうがいいですよ",
        tiles: ["やすんだ", "もっと", "ほう", "いい", "が", "ですよ", "やすまなければ"],
        correctOrder: ["もっと", "やすんだ", "ほう", "が", "いい", "ですよ"],
        promptEn: "Give たけし advice: 'You should rest more.'",
      },
    }),
    sentenceMcq({
      id: "ja-m27-story-mcq-1",
      prompt: "Which line from the story expressed OBLIGATION (must)?",
      correctKana: "まいにち べんきょうしなければなりません。",
      distractorsKana: [
        "しけんが ちかくなりました。",
        "すこし つかれました。",
        "らいしゅう しけんが あります。",
      ],
      explanation:
        "なければなりません = must (obligation). The other lines describe change and state.",
    }),
    ...storyComprehension({
      idPrefix: "ja-m27-story-s2",
      narrative: [
        { kana: "きょう すこし うんどうしました。" },
        { kana: "げんきになりました。" },
        { kana: "けんこうは たいせつです。" },
        { kana: "あしたも うんどうします。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "What happened after たけし exercised?",
          correctText: "He became energetic.",
          distractors: [
            "He got more tired.",
            "He got sick.",
            "He passed the exam.",
          ],
          explanation: "げんきになりました = became energetic (になる = change).",
        },
        {
          id: "s2-q2",
          prompt: "What will たけし do tomorrow?",
          correctText: "Exercise again.",
          distractors: [
            "Stop exercising.",
            "Go to the hospital.",
            "Sleep all day.",
          ],
          explanation: "あしたも うんどうします = I'll exercise tomorrow too.",
        },
      ],
      responseBuild: {
        target: "まいにち つづけたほうがいいですよ",
        tiles: ["つづけた", "ほう", "まいにち", "が", "いい", "ですよ", "つづけなければ"],
        correctOrder: ["まいにち", "つづけた", "ほう", "が", "いい", "ですよ"],
        promptEn: "Encourage him: 'You should continue every day.'",
      },
    }),
    cloze(
      "ja-m27-story-cloze-1",
      "まいにち べんきょうし",
      "なりません。",
      "なければ",
      ["なければ", "ないで", "なくて", "たほうが"],
      "I must study every day. (たけし's line)",
      "まいにち べんきょうしなければなりません。",
      "する → しない → しなければなりません = must do.",
    ),
    listeningBuildSentence({
      id: "ja-m27-story-lb-1",
      target: "あしたも うんどうします",
      tiles: ["うんどう", "あした", "も", "します", "は", "しました"],
      correctOrder: ["あした", "も", "うんどう", "します"],
      promptEn: "Hear it, build it: 'I'll exercise tomorrow too.'",
    }),
    speaking(
      "ja-m27-story-speak-1",
      "もっと やすんだほうがいいですよ",
      "You should rest more.",
    ),
    sentenceMcq({
      id: "ja-m27-story-mcq-summary",
      prompt: "Which M27 patterns appeared in the story?",
      correctKana: "なければならない, ほうがいい, and になる — all three.",
      distractorsKana: [
        "Only ほうがいい.",
        "Only なければならない.",
        "Only くなる.",
      ],
      explanation: "All three M27 patterns: obligation, advice, and change.",
    }),
    speaking(
      "ja-m27-story-speak-2",
      "まいにち つづけたほうがいいですよ",
      "You should continue every day.",
    ),
  ],
};

assertNoConsecutiveSame(M27_STORY.steps);
assertPassiveCardsHaveFollowup(M27_STORY.steps);
assertNoExplanationOnPassive(M27_STORY.steps);
assertExplanationDoesntLeakAnswer(M27_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-7-1 — Comprehension drill
// ═══════════════════════════════════════════════════════════════════════

const M27_7_1_REVIEW = pickReviewAtoms("ja-m27-7-1-rev", M27_REVIEW_POOL, 4);

export const M27_7_1: LessonContent = {
  id: "ja-m27-7-1",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Comprehension drill",
  description:
    "Listening + reading comprehension with all M27 patterns.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    listeningCompSentence({
      id: "ja-m27-7-1-lc-1",
      audioText: "しゅくだいを しなければなりません",
      correctMeaningEn: "I must do my homework.",
      distractorsEn: [
        "You should do your homework.",
        "I did my homework.",
        "I don't have homework.",
      ],
    }),
    sentenceMcq({
      id: "ja-m27-7-1-mcq-1",
      prompt: "Which means 'You should go to the hospital.'?",
      correctKana: "びょういんに いったほうがいいですよ。",
      distractorsKana: [
        "びょういんに いかなければなりません。",
        "びょういんに いきました。",
        "びょういんに いきたいです。",
      ],
      explanation: "た-form + ほうがいい = should (advice).",
    }),
    cloze(
      "ja-m27-7-1-cloze-1",
      "あつ",
      "なりましたね。",
      "く",
      ["く", "に", "い", "な"],
      "It got hot, didn't it?",
      "あつくなりましたね。",
      "い-adj + くなる = become.",
    ),
    build(
      "ja-m27-7-1-build-1",
      "Say: You'd better not drink too much.",
      "のみすぎないほうがいいですよ",
      ["が", "ほう", "いい", "のみすぎた", "ですよ", "のみすぎない", "のまなければ"],
      ["のみすぎない", "ほう", "が", "いい", "ですよ"],
    ),
    listeningCompSentence({
      id: "ja-m27-7-1-lc-2",
      audioText: "にほんごが じょうずになりたいです。だから まいにち れんしゅうしなければなりません",
      correctMeaningEn: "I want to become good at Japanese. So I must practice every day.",
      distractorsEn: [
        "I'm good at Japanese. So I practice every day.",
        "I should study Japanese. But I'm too busy.",
        "Japanese is getting harder. I should quit.",
      ],
    }),
    cloze(
      "ja-m27-7-1-cloze-2",
      "やすんだ",
      "がいいですよ。",
      "ほう",
      ["ほう", "こと", "なければ", "つもり"],
      "You should rest.",
      "やすんだほうがいいですよ。",
      "た-form + ほうがいい = advice.",
    ),
    speaking(
      "ja-m27-7-1-speak-1",
      "のみすぎないほうがいいですよ",
      "You'd better not drink too much.",
    ),
    sentenceMcq({
      id: "ja-m27-7-1-mcq-2",
      prompt: "Which means 'I gotta go.' (casual)?",
      correctKana: "いかなくちゃ。",
      distractorsKana: [
        "いかなければなりません。",
        "いったほうがいいです。",
        "いくなくちゃ。",
      ],
      explanation: "いく → いかない → いかなくちゃ (casual must).",
    }),
    build(
      "ja-m27-7-1-build-2",
      "Say: It became important. I must decide.",
      "たいせつになりました。きめなければなりません",
      ["きめた", "に", "なりません", "きめなければ", "たいせつ", "なりました", "ほうがいい"],
      ["たいせつ", "に", "なりました", "きめなければ", "なりません"],
    ),
    listeningBuildSentence({
      id: "ja-m27-7-1-lb-1",
      target: "けんこうに なりたいです",
      tiles: ["です", "に", "なりたい", "なりません", "けんこう", "けんこうく", "なければ"],
      correctOrder: ["けんこう", "に", "なりたい", "です"],
      promptEn: "Hear it, build it: 'I want to become healthy.'",
    }),
    cloze(
      "ja-m27-7-1-cloze-3",
      "はやく おきなければ",
      "。",
      "なりません",
      ["なりません", "いいです", "なりました", "ください"],
      "I must wake up early.",
      "はやく おきなければなりません。",
      "なければなりません = must.",
    ),
    selfExplain({
      id: "ja-m27-7-1-self-explain",
      anchorLabel: "M27 comprehension patterns",
      anchorAudioText: "くすりを のまなければなりません",
      question: "How can you tell the difference between なければなりません and くなりました when listening?",
      rule: { text: "なければなりません = ない-form base + ければ (obligation). くなりました = adjective stem + く (change of state). Listen for ければ vs く before なり." },
      surface: { text: "You can't tell the difference — they sound the same." },
      distractor: { text: "なければなりません is always at the end; くなりました is always at the beginning." },
      ruleExplanation:
        "Key listening cue: ...なければなりません (must do). ...くなりました (became). Different patterns, different meanings — the syllable before なり is the signal.",
    }),
    speaking(
      "ja-m27-7-1-speak-2",
      "たいせつになりました",
      "It became important.",
    ),
    translateStep({
      id: "ja-m27-7-1-translate",
      promptEn: "You should rest more.",
      acceptedAnswers: [
        "もっと やすんだほうがいいです",
        "もっと やすんだほうがいいです。",
        "もっと やすんだほうがいいですよ",
      ],
      audioText: "もっと やすんだほうがいいです",
    }),
    // ── Review tail ──
    vocabMcq("ja-m27-7-1-rev-mcq-1", M27_7_1_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-7-1-rev-lc-1",
      audioText: "この くすりを のんで ください",
      correctMeaningEn: "Please take this medicine.",
      distractorsEn: [
        "Please buy this medicine.",
        "Don't take this medicine.",
        "Please drink some water.",
      ],
    }),
    speaking("ja-m27-7-1-rev-speak-1", M27_7_1_REVIEW[2].kana, M27_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-7-1-rev", M27_7_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M27_7_1.steps);
assertAnswerRotation(M27_7_1.steps, 1);
assertNoConsecutiveSame(M27_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M27-7-2 — Final production
// ═══════════════════════════════════════════════════════════════════════

const M27_7_2_REVIEW = pickReviewAtoms("ja-m27-7-2-rev", M27_REVIEW_POOL, 5);

export const M27_7_2: LessonContent = {
  id: "ja-m27-7-2",
  moduleId: "m27",
  courseId: COURSE,
  languageId: LANG,
  title: "Final production — M27",
  description:
    "Full production with all M27 grammar and vocab.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    build(
      "ja-m27-7-2-build-1",
      "Say: I must go to school tomorrow.",
      "あした がっこうに いかなければなりません",
      ["ほうがいい", "いった", "あした", "なりません", "がっこう", "に", "いかなければ"],
      ["あした", "がっこう", "に", "いかなければ", "なりません"],
    ),
    speaking(
      "ja-m27-7-2-speak-1",
      "あした がっこうに いかなければなりません",
      "I must go to school tomorrow.",
    ),
    listeningCompSentence({
      id: "ja-m27-7-2-lc-1",
      audioText: "さむくなりましたね。ジャケットを きたほうがいいですよ",
      correctMeaningEn: "It got cold. You should wear a jacket.",
      distractorsEn: [
        "It's getting warm. Take off your jacket.",
        "It's cold. You must wear a jacket.",
        "It became hot. I'm taking off my jacket.",
      ],
    }),
    build(
      "ja-m27-7-2-build-2",
      "Say: My cooking is getting better!",
      "りょうりが じょうずになっています",
      ["に", "なっています", "じょうず", "りょうり", "じょうずく", "が", "なりました"],
      ["りょうり", "が", "じょうず", "に", "なっています"],
    ),
    sentenceMcq({
      id: "ja-m27-7-2-mcq-1",
      prompt: "Which means 'You should be more careful.'?",
      correctKana: "もっと きをつけたほうがいいですよ。",
      distractorsKana: [
        "もっと きをつけなければなりません。",
        "きをつけくなりました。",
        "きをつけましょう。",
      ],
      explanation: "た-form + ほうがいい = should (advice).",
    }),
    speaking(
      "ja-m27-7-2-speak-2",
      "りょうりが じょうずになっています",
      "My cooking is getting better!",
    ),
    build(
      "ja-m27-7-2-build-3",
      "Say: I must keep studying.",
      "べんきょうを つづけなければなりません",
      ["つづけた", "なりません", "つづけなければ", "を", "べんきょう", "ほうがいい"],
      ["べんきょう", "を", "つづけなければ", "なりません"],
    ),
    listeningBuildSentence({
      id: "ja-m27-7-2-lb-1",
      target: "げんきになりたいです",
      tiles: ["に", "です", "げんきく", "なりたい", "げんき", "なければ", "なります"],
      correctOrder: ["げんき", "に", "なりたい", "です"],
      promptEn: "Hear it, build it: 'I want to become healthy.'",
    }),
    cloze(
      "ja-m27-7-2-cloze-1",
      "うんどうした",
      "がいいですよ。",
      "ほう",
      ["ほう", "こと", "なければ", "つもり"],
      "You should exercise.",
      "うんどうしたほうがいいですよ。",
      "た-form + ほうがいい = advice.",
    ),
    speaking(
      "ja-m27-7-2-speak-3",
      "べんきょうを つづけなければなりません",
      "I must keep studying.",
    ),
    build(
      "ja-m27-7-2-build-4",
      "Say: It became necessary. I must decide.",
      "ひつようになりました。きめなければなりません",
      ["きめた", "ほうがいい", "ひつよう", "に", "なりません", "なりました", "きめなければ"],
      ["ひつよう", "に", "なりました", "きめなければ", "なりません"],
    ),
    listeningCompSentence({
      id: "ja-m27-7-2-lc-2",
      audioText: "もっと つよくなりたいです。だから まいにち うんどうしなければなりません",
      correctMeaningEn: "I want to become stronger. So I must exercise every day.",
      distractorsEn: [
        "I became strong. So I don't need to exercise.",
        "I should exercise. But I'm too tired.",
        "I'm strong. So I advise others to exercise.",
      ],
    }),
    cloze(
      "ja-m27-7-2-cloze-2",
      "あんぜん",
      "なるように きをつけましょう。",
      "に",
      ["に", "く", "が", "な"],
      "Let's be careful so it becomes safe.",
      "あんぜんになるように きをつけましょう。",
      "な-adj + になる.",
    ),
    selfExplain({
      id: "ja-m27-7-2-self-explain",
      anchorLabel: "Full M27 mastery",
      anchorAudioText: "くすりを のまなければなりません",
      question: "You want to say 'It got cold. You should wear a jacket. You must be careful.' How many M27 patterns do you use?",
      rule: { text: "All three: さむくなりました (change — くなる), ジャケットを きたほうがいい (advice — ほうがいい), きをつけなければならない (obligation — なければ). Three patterns, one natural sequence." },
      surface: { text: "Just one — なければならない covers all three ideas." },
      distractor: { text: "Two — くなる for change and ほうがいい for both advice and obligation." },
      ruleExplanation:
        "Change (くなる) + advice (ほうがいい) + obligation (なければ) = the three pillars of M27. One natural conversation uses all three.",
    }),
    speaking(
      "ja-m27-7-2-speak-4",
      "ひつようになりました。きめなければなりません",
      "It became necessary. I must decide.",
    ),
    translateStep({
      id: "ja-m27-7-2-translate",
      promptEn: "You should rest and take medicine.",
      acceptedAnswers: [
        "やすんで くすりを のんだほうがいいです",
        "やすんで くすりを のんだほうがいいです。",
        "やすんで くすりを のんだほうがいいですよ",
      ],
      audioText: "やすんで くすりを のんだほうがいいです",
    }),
    // ── Review tail ──
    vocabMcq("ja-m27-7-2-rev-mcq-1", M27_7_2_REVIEW[0], M27_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m27-7-2-rev-lc-1",
      audioText: "まいにち くすりを のみます",
      correctMeaningEn: "I take medicine every day.",
      distractorsEn: [
        "I take medicine sometimes.",
        "I drink coffee every day.",
        "I must take medicine.",
      ],
    }),
    speaking("ja-m27-7-2-rev-speak-1", M27_7_2_REVIEW[2].kana, M27_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m27-7-2-rev", M27_7_2_REVIEW.slice(0, 5)),
  ],
};

assertNoSameAnswerCluster(M27_7_2.steps);
assertAnswerRotation(M27_7_2.steps, 1);
assertNoConsecutiveSame(M27_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M27_1_1.steps,
  ...M27_1_2.steps,
  ...M27_2_1.steps,
  ...M27_2_2.steps,
  ...M27_3_1.steps,
  ...M27_3_2.steps,
  ...M27_4_1.steps,
  ...M27_4_2.steps,
  ...M27_5_1.steps,
  ...M27_5_2.steps,
  ...M27_6_1.steps,
  ...M27_6_2.steps,
  ...M27_7_1.steps,
  ...M27_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M27_1_1, M27_1_2, M27_2_1, M27_2_2, M27_3_1, M27_3_2,
  M27_4_1, M27_4_2, M27_5_1, M27_5_2, M27_6_1, M27_6_2,
  M27_STORY, M27_7_1, M27_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
