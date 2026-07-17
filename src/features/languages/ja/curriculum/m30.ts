/**
 * M30 — Casual register (N4 pilot #2, 2026-07-17). STAGE 1 of 2.
 *
 * Second module of the JLPT N4 tier. Grammar anchor: casual↔polite
 * REGISTER SWITCHING — casual question intonation (dropped か), casual
 * sentence-enders (よ / ね / の), and register awareness (when casual
 * speech is socially wrong). m29 taught the plain forms; m30 teaches
 * USING them with people. m30 introduces NO new plain form — every verb/
 * adjective conjugation used here was taught in m29 (or earlier).
 *
 * Grammar sequencing (docs/n4-pilot-spine-2026-07-16.md), STAGE 1 = pairs 1-4:
 *   Pair 1 — Casual questions: drop か, rising intonation carries it
 *   Pair 2 — よ (assert new info) / ね (seek agreement) — one function each
 *   Pair 3 — Casual の question + してる (している contraction)
 *   Pair 4 — Register awareness — when casual speech is socially wrong
 * (Pairs 5-7 + story + reviews are STAGE 2 — not authored here.)
 *
 * VOCAB RECONCILIATION (docs/n4-pilot-spine-2026-07-16.md's 20-atom table,
 * same discipline as m29's header — see courseAtoms.ts's M30 comment block
 * for the registry-side note):
 *   - たぶん ("probably") is ALREADY an m18 atom (blocked, introducedByLessonId
 *     ja-m18-2-1). NOT re-registered here — used as review vocabulary only
 *     (ja-m30-1-1 / ja-m30-1-2), never formally re-taught (guide §13.8).
 *   - The spine's bare き ("feeling, mind") would collide with the existing
 *     m18 tree atom き (木) in JA_COURSE_ATOMS_BY_KANA — a kana-keyed map
 *     where a second entry would silently overwrite the tree lookup used
 *     elsewhere in the corpus. Taught instead as the fixed collocation
 *     きになる ("it's on my mind / I'm curious about it") — same abstract
 *     concept, no kana collision.
 *   - 19 genuinely new atoms below (all fromModule "m30" in courseAtoms.ts).
 *
 * だ (plain copula) resolution: neither m29 nor m30 formally teaches だ (the
 * plain equivalent of です) as a derived rule — it stays out of scope for
 * this pilot. But several taught atoms here (けいご, したしい, しつれい,
 * ていねい) are na-adjectives/nouns whose natural casual predicate use is
 * だ-final (だよ/だね) or だ-less before よ/ね (a genuinely native casual
 * drop: げんき？, しつれいね。). This file routes around teaching だ as a
 * production rule: casual QUESTIONS and よ/ね-final sentences never need it
 * (native だ-drop / rising intonation alone), だ appears only as a GIVEN
 * tile in a couple of build() tile banks (selection, not derivation), and
 * every translateStep prompt is phrased so free-recall typing never
 * requires producing だ from scratch.
 *
 * Distribution of the 19 new atoms across pairs 1-4 (pair 4 carries the
 * most, per spec — the social-role nouns that make register awareness
 * teachable):
 *   Pair 1 (2): もちろん, ぜったい
 *   Pair 2 (4): けいご, したしい, ていねい, しつれい
 *   Pair 3 (5): ためぐち, なんで, どうしたの, きになる, べつに
 *   Pair 4 (8): せんぱい, じょうし, どうりょう, やっぱり, こうはい, しりあい,
 *               おさななじみ, なかま
 *
 * kanji_reading (3, sprinkle-not-saturate, per spine + guide §4f): all land
 * on review-tier words whose kanji unlocked well before m30 and are
 * KANJI_ELIGIBLE_ATOMS-eligible (secondScript/n5Kanji.ts anchorVocab — note
 * ともだち/友達 is NOT eligible despite being an anchorVocab entry: its second
 * kanji 達 has no N5_KANJI catalog entry, so the "every component kanji
 * known" gate skips it) — いく (行く, m7) in 1-1, なに (何, m1) in 3-1 (ties
 * to the なにしてるの？ pattern this pair teaches), せんせい (先生, m3) in 4-1
 * (an authority-figure review word fitting the register-awareness theme).
 * None are just-introduced m30 atoms.
 *
 * NO particle_cloze anywhere (guide §4c — m29/m30 are both far past every N5
 * particle's 2-module grandfather window). NO phrase_card / vocab() /
 * phrase() calls (guide §4b2). NO info steps. Every lesson ends on a
 * gradeable step (reviewMatchPairs).
 *
 * 8 hand-authored exports (pairs 1-4, 2 sub-lessons each). Pairs 5-7 + story
 * + ja-m30-review-1/2 are STAGE 2 — not authored here.
 *
 * ID scheme: ja-m30-{n}-{sub}. Export names: M30_1_1, M30_1_2, etc.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  dialogueListen,
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
  transformBuild,
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
// Per-sub-lesson review-atom draws. Pool is M3-M7 (same pattern as m29 —
// guide §6: every m8+ module draws from the same early-module pool).
// ───────────────────────────────────────────────────────────────────────
const M30_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_CASUAL_Q = grammarRule({
  id: "ja-m30-rule-casual-q",
  grammarPointId: "casual-question-no-ka",
  title: "Casual questions — drop か, let the rise carry it",
  rule:
    "Polite ます-questions keep か (たべますか). Casual questions among friends drop か entirely — the plain form alone, said with rising intonation (written ？), IS the question: たべる？ (Are you eating this?), いく？ (Coming?). Tacking か onto plain form in casual speech (たべるか？) reads blunt, like an interrogation — the taught casual pattern relies on the rise alone, not か.",
  examples: [
    { ja: "あした がっこうに くる？", romaji: "ashita gakkou ni kuru?", en: "Are you coming to school tomorrow?" },
    { ja: "コーヒーを のむ？", romaji: "koohii o nomu?", en: "Are you drinking coffee?" },
    { ja: "きょう ひま？", romaji: "kyou hima?", en: "Are you free today?" },
  ],
  antiPattern: {
    ja: "あした ひまか？",
    romaji: "ashita hima ka?",
    en: "(broken register — か tacked onto casual speech reads like an interrogation)",
    why: "か marks a question in polite/formal registers (ひまですか). Adding it back onto a casual plain-form question among friends breaks the register this pair teaches — the rise alone (ひま？) is the natural casual pattern.",
  },
  cultureNote:
    "This is the single most common casual-speech move: drop か, keep the ？. Almost every casual question you'll hear from friends follows this shape.",
});

const RULE_YO_NE = grammarRule({
  id: "ja-m30-rule-yo-ne",
  grammarPointId: "yo-ne-function",
  title: "よ vs ね — new information vs shared agreement",
  rule:
    "よ and ね do ONE job each. よ asserts something the LISTENER doesn't already know — you're informing them. ね checks or invites agreement on something you assume the listener already feels or knows too — you're confirming, not informing. Pick よ when you're the one with new information; pick ね when you expect the listener to already agree.",
  examples: [
    { ja: "この みせは やすいよ。", romaji: "kono mise wa yasui yo.", en: "This shop is cheap, you know! (telling you)" },
    { ja: "この みせは やすいね。", romaji: "kono mise wa yasui ne.", en: "This shop is cheap, isn't it? (agreeing)" },
    { ja: "かばん、わすれたよ！", romaji: "kaban, wasureta yo!", en: "You forgot your bag! (heads up)" },
  ],
  antiPattern: {
    ja: "かばん、わすれたね。",
    romaji: "kaban, wasureta ne.",
    en: "(broken — ね wrongly assumes the listener already knows they forgot it)",
    why: "Telling someone they forgot their own bag is NEW information to them — that calls for よ. ね would assume they already share that awareness, which undercuts the whole point of the warning.",
  },
  cultureNote:
    "よ and ね stack onto almost every casual sentence-ender. Mixing up their function is a classic 'off' feeling even when every other part of the sentence is perfect.",
});

const RULE_CASUAL_NO = grammarRule({
  id: "ja-m30-rule-casual-no",
  grammarPointId: "casual-no-question",
  title: "Casual の question + してる (している contraction)",
  rule:
    "Casual speech contracts ANY -ている form by dropping the い: している → してる, はなしている → はなしてる, つかれている → つかれてる — same phonological drop, every verb. Adding の to the end of a casual question softens it into a curious, personal-interest tone: なにしてるの？ ('What are you up to?') sounds warmer than the bare なにしてる？. Pattern: [casual verb/adjective] + の？",
  examples: [
    { ja: "なにしてるの？", romaji: "nani shiteru no?", en: "What are you doing?" },
    { ja: "どこ いくの？", romaji: "doko iku no?", en: "Where are you going?" },
    { ja: "だれと はなしてるの？", romaji: "dare to hanashiteru no?", en: "Who are you talking with?" },
  ],
  antiPattern: {
    ja: "なにしていますのか？",
    romaji: "nani shiteimasu no ka?",
    en: "(broken — polite しています + casual の + polite か all stacked together)",
    why: "の already casual-softens the question; piling ています (polite) and か (polite question marker) on top of it collides two registers in one sentence instead of picking one.",
  },
  cultureNote:
    "This casual の is a question-softener, not the possession の from earlier modules — same kana, completely different job depending on where it lands in the sentence.",
});

const RULE_REGISTER = grammarRule({
  id: "ja-m30-rule-register",
  grammarPointId: "register-awareness",
  title: "When casual is wrong — register awareness",
  rule:
    "Casual speech (plain form, dropped か, よ/ね, の) is for なかま / おさななじみ / したしい ともだち — people you're close with as equals. With せんぱい, じょうし, and people you've just met (しりあい), casual speech reads as しつれい (rude) — use ていねい polite ます-form / けいご instead. どうりょう and こうはい often start polite and shift casual once closeness is established.",
  examples: [
    { ja: "したしい ともだちに: あした くる？", romaji: "shitashii tomodachi ni: ashita kuru?", en: "To a close friend: Are you coming tomorrow?" },
    { ja: "じょうしに: あした きますか？", romaji: "joushi ni: ashita kimasu ka?", en: "To your boss: Are you coming tomorrow?" },
    { ja: "せんぱいに ためぐちを つかうと、しつれいです。", romaji: "senpai ni tameguchi o tsukau to, shitsurei desu.", en: "Using casual speech with a senior is rude." },
  ],
  antiPattern: {
    ja: "じょうしに: あした くる？",
    romaji: "joushi ni: ashita kuru?",
    en: "(broken — a casual question directed at your boss)",
    why: "The sentence is grammatically perfect casual Japanese — the error is social, not grammatical. Casual register signals closeness/equal footing; aiming it upward at a じょうし breaks the expected hierarchy and reads as rude.",
  },
  cultureNote:
    "Every sentence in this pair is grammatically correct either way. The mistake this pair teaches is entirely about WHO you're talking to, not how well-formed the sentence is.",
});

const RULE_INVITE_CASUAL = grammarRule({
  id: "ja-m30-rule-invite",
  grammarPointId: "casual-nai-invitation",
  title: "〜ない？ — casual invitations (same logic as ませんか)",
  rule:
    "Casual invitations use the plain ない-form + rising intonation, dropping か exactly like pair 1's casual questions: いかない？ ('Wanna go?'). This mirrors the polite invitation pattern from m23 — ませんか (いきませんか, 'won't you go?') — both use a NEGATIVE question to soften a suggestion into an invitation, giving the listener room to decline. Casual just drops the か the same way every casual question does.",
  examples: [
    { ja: "いっしょに たべない？", romaji: "issho ni tabenai?", en: "Wanna eat together?" },
    { ja: "えいが みない？", romaji: "eiga minai?", en: "Wanna watch a movie?" },
    { ja: "しゅうまつ あそばない？", romaji: "shuumatsu asobanai?", en: "Wanna hang out this weekend?" },
  ],
  antiPattern: {
    ja: "いっしょに たべないか？",
    romaji: "issho ni tabenai ka?",
    en: "(broken — か tacked onto a casual invitation reads blunt, like an interrogation)",
    why: "Casual invitations rely on rising intonation alone, exactly like casual questions (pair 1) — adding か back breaks the register even though ない makes it an invitation rather than a plain question.",
  },
  cultureNote:
    "This is invitation logic doubled: the negative form softens a suggestion into an invitation (as in ませんか), and casual speech drops か (as in pair 1). Put them together and you get いかない？ — the single most common way friends invite each other to do something.",
});

// ═══════════════════════════════════════════════════════════════════════
// M30-1-1 — Casual questions I (new: もちろん)
// ═══════════════════════════════════════════════════════════════════════

const M30_1_1_REVIEW = pickReviewAtoms("ja-m30-1-1-rev", M30_REVIEW_POOL, 4);

export const M30_1_1: LessonContent = {
  id: "ja-m30-1-1",
  moduleId: "m30",
  courseId: COURSE,
  languageId: LANG,
  title: "Casual questions I — drop the か",
  description:
    "Casual yes/no questions drop か and rely on rising intonation. New: もちろん (of course).",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_CASUAL_Q,
    build(
      "ja-m30-1-1-build-kuru",
      "Say to a friend, casually: Are you coming to school tomorrow?",
      "あした がっこうに くる",
      ["あした", "がっこう", "に", "くる", "きます", "か"],
      ["あした", "がっこう", "に", "くる"],
      ["くる"],
    ),
    listeningCompSentence({
      id: "ja-m30-1-1-lc-issho",
      audioText: "いっしょに いく？",
      correctMeaningEn: "Are you coming along?",
      distractorsEn: [
        "I'm going alone.",
        "I already went.",
        "I'm not going.",
      ],
      exercisedAtomKanas: ["いっしょ"],
    }),
    build(
      "ja-m30-1-1-build-nomu",
      "Say to a friend, casually: Are you drinking coffee?",
      "コーヒーを のむ",
      ["コーヒー", "を", "のむ", "のみます", "か"],
      ["コーヒー", "を", "のむ"],
      ["のむ"],
    ),
    speaking("ja-m30-1-1-speak-genki", "げんき？", "You doing okay?", ["げんき"]),
    build(
      "ja-m30-1-1-build-daijoubu",
      "Say to a friend, casually: Are you okay with the test?",
      "テストは だいじょうぶ",
      ["テスト", "は", "だいじょうぶ", "です", "か"],
      ["テスト", "は", "だいじょうぶ"],
      ["だいじょうぶ"],
    ),
    listeningCompSentence({
      id: "ja-m30-1-1-lc-mochiron",
      audioText: "もちろん、いく！",
      correctMeaningEn: "Of course I'm going!",
      distractorsEn: [
        "Maybe I'll go.",
        "I'm not going.",
        "I already went.",
      ],
      exercisedAtomKanas: ["もちろん"],
    }),
    speaking("ja-m30-1-1-speak-mochiron", "もちろん！", "Of course!", ["もちろん"]),
    sentenceMcq({
      id: "ja-m30-1-1-mcq-1",
      prompt: "Which is the CASUAL way to ask a friend 'Are you free tomorrow?'",
      correctKana: "あした ひま？",
      distractorsKana: ["あした ひまですか。", "あした ひまか。", "あした ひまでした。"],
      explanation:
        "Casual questions drop か and use rising intonation alone — ひまですか is polite, ひまか sounds blunt, ひまでした is past tense.",
    }),
    build(
      "ja-m30-1-1-build-2",
      "Say to a friend, casually: Are you free today?",
      "きょう ひま",
      ["きょう", "ひま", "です", "か"],
      ["きょう", "ひま"],
    ),
    sentenceMcq({
      id: "ja-m30-1-1-mcq-2",
      prompt: "Which means 'Of course I'll help!'?",
      correctKana: "もちろん、てつだう！",
      distractorsKana: ["たぶん、てつだう。", "てつだわない。", "もう てつだった。"],
      explanation:
        "もちろん = 'of course' (certain yes); たぶん = 'probably' (uncertain); てつだわない = 'won't help'; もう てつだった = 'already helped' — different meanings.",
      exercisedAtomKanas: ["もちろん", "てつだう"],
    }),
    listeningBuildSentence({
      id: "ja-m30-1-1-lb-asobu",
      target: "あした ともだちと あそぶ",
      tiles: ["あした", "ともだち", "と", "あそぶ", "あそびます", "か"],
      correctOrder: ["あした", "ともだち", "と", "あそぶ"],
      promptEn: "Hear it, build it: 'I'm hanging out with my friend tomorrow.'",
      exercisedAtomKanas: ["あそぶ"],
    }),
    kanjiReading("ja-m30-1-1-kr-iku", { kana: "いく", meaningEn: "to go", fromModule: "m7" }),
    sentenceMcq({
      id: "ja-m30-1-1-mcq-3",
      prompt: "Which means 'Are you free today?' (casual)?",
      correctKana: "きょう ひま？",
      distractorsKana: ["きょう ひまですか。", "きょう ひまじゃない。", "きのう ひまだった。"],
      explanation:
        "Casual questions just add rising intonation to the plain adjective — no か, no ですか.",
    }),
    translateStep({
      id: "ja-m30-1-1-translate",
      promptEn: "Say to a friend, casually: Are you coming to school tomorrow?",
      acceptedAnswers: ["あした がっこうに くる", "あした がっこうに くる？"],
      audioText: "あした がっこうに くる？",
      exercisedAtomKanas: ["くる"],
    }),
    selfExplain({
      id: "ja-m30-1-1-self-explain",
      anchorLabel: "あした ひま？ vs あした ひまか？",
      anchorAudioText: "あした ひま？",
      question: "Why does dropping か (not adding it) make this sound like natural casual speech?",
      rule: {
        text: "Casual questions rely on rising intonation alone — the plain form + ？ carries the question. Tacking か onto plain form among friends reads blunt, like an interrogation, not natural chat.",
      },
      surface: {
        text: "か is required on every Japanese question, casual or polite.",
      },
      distractor: {
        text: "あした ひまか？ and あした ひま？ mean exactly the same thing with no difference in tone.",
      },
      ruleExplanation:
        "Polite ます-questions keep か (ひまですか). Casual plain-form questions drop it — rising intonation alone signals a question. Adding か back onto casual speech isn't 'more correct,' it's a register clash that sounds interrogative.",
    }),
    speaking("ja-m30-1-1-speak-2", "あした ともだちと あそぶ？", "Are you hanging out with your friend tomorrow?", ["あそぶ"]),
    // ── Review tail ──
    vocabMcq("ja-m30-1-1-rev-mcq-1", M30_1_1_REVIEW[0], M30_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m30-1-1-rev-lc-1",
      audioText: "としょかんで ほんを よみます",
      correctMeaningEn: "I read a book at the library.",
      distractorsEn: [
        "I buy a book at the library.",
        "I read a book at school.",
        "I read a book every day.",
      ],
    }),
    speaking("ja-m30-1-1-rev-speak-1", M30_1_1_REVIEW[2].kana, M30_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m30-1-1-rev", M30_1_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M30_1_1.steps);
assertAnswerRotation(M30_1_1.steps, 1);
assertNoConsecutiveSame(M30_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M30-1-2 — Casual questions II (new: ぜったい)
// ═══════════════════════════════════════════════════════════════════════

const M30_1_2_REVIEW = pickReviewAtoms("ja-m30-1-2-rev", M30_REVIEW_POOL, 4);

export const M30_1_2: LessonContent = {
  id: "ja-m30-1-2",
  moduleId: "m30",
  courseId: COURSE,
  languageId: LANG,
  title: "Casual questions II — practice + ぜったい",
  description:
    "More casual questions, contrasted against the polite register. New: ぜったい (absolutely).",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m30-1-2-build-1",
      "Say to a friend, casually: Are you going to the library?",
      "としょかんに いく",
      ["としょかん", "に", "いく", "いきます", "か"],
      ["としょかん", "に", "いく"],
      ["いく"],
    ),
    listeningCompSentence({
      id: "ja-m30-1-2-lc-1",
      audioText: "にほんごを べんきょうする？",
      correctMeaningEn: "Are you studying Japanese?",
      distractorsEn: [
        "I studied Japanese.",
        "I'm not studying Japanese.",
        "I study Japanese every day.",
      ],
    }),
    build(
      "ja-m30-1-2-build-2",
      "Say to a friend, casually: Are you working today?",
      "きょう はたらく",
      ["きょう", "はたらく", "はたらきます", "か"],
      ["きょう", "はたらく"],
    ),
    listeningCompSentence({
      id: "ja-m30-1-2-lc-zettai",
      audioText: "ぜったい こない。",
      correctMeaningEn: "They're absolutely not coming.",
      distractorsEn: [
        "They'll probably come.",
        "They came already.",
        "They might come.",
      ],
      exercisedAtomKanas: ["ぜったい"],
    }),
    speaking("ja-m30-1-2-speak-zettai", "ぜったい くる！", "I'm absolutely coming!", ["ぜったい"]),
    sentenceMcq({
      id: "ja-m30-1-2-mcq-1",
      prompt: "Which means 'Are you absolutely free tomorrow?' (casual)?",
      correctKana: "あした ぜったい ひま？",
      distractorsKana: ["あした たぶん ひま？", "あした ぜったい ひまですか。", "きのう ぜったい ひまだった。"],
      explanation:
        "ぜったい = absolutely (certainty); たぶん = maybe; ですか = polite register; だった = past tense — all different.",
      exercisedAtomKanas: ["ぜったい"],
    }),
    build(
      "ja-m30-1-2-build-3",
      "Say to a friend, casually: Are you probably coming tomorrow?",
      "あした たぶん くる",
      ["あした", "たぶん", "くる", "きます", "か"],
      ["あした", "たぶん", "くる"],
      ["たぶん", "くる"],
    ),
    listeningBuildSentence({
      id: "ja-m30-1-2-lb-1",
      target: "しゅくだいを ぜんぶ わすれた",
      tiles: ["しゅくだい", "を", "ぜんぶ", "わすれた", "わすれます", "か"],
      correctOrder: ["しゅくだい", "を", "ぜんぶ", "わすれた"],
      promptEn: "Hear it, build it (casual question): 'Did you forget all the homework?'",
      exercisedAtomKanas: ["ぜんぶ", "わすれる"],
    }),
    build(
      "ja-m30-1-2-build-4",
      "Say to a friend, casually: Are you absolutely coming tomorrow?",
      "あした ぜったい くる",
      ["あした", "ぜったい", "くる", "きます", "か"],
      ["あした", "ぜったい", "くる"],
      ["ぜったい", "くる"],
    ),
    sentenceMcq({
      id: "ja-m30-1-2-mcq-2",
      prompt: "Which shows the STRONGEST certainty?",
      correctKana: "ぜったい くる。",
      distractorsKana: ["たぶん くる。", "もちろん こない。", "くる。"],
      explanation:
        "ぜったい = absolutely certain; たぶん = maybe; もちろん こない = 'of course not' (certain negative, wrong direction); くる alone carries no certainty marker.",
      exercisedAtomKanas: ["ぜったい", "もちろん"],
    }),
    translateStep({
      id: "ja-m30-1-2-translate",
      promptEn: "Say to a friend, casually: Are you absolutely free today?",
      acceptedAnswers: ["きょう ぜったい ひま", "きょう ぜったい ひま？"],
      audioText: "きょう ぜったい ひま？",
      exercisedAtomKanas: ["ぜったい"],
    }),
    sentenceMcq({
      id: "ja-m30-1-2-mcq-3",
      prompt: "Which is the CASUAL version of 'Are you coming tomorrow?'",
      correctKana: "あした くる？",
      distractorsKana: ["あした きますか。", "あした きたか。", "あした こなかったか。"],
      explanation:
        "くる？ (casual, no か) vs きますか (polite) vs きたか/こなかったか (か tacked onto plain past/negative — same register clash this pair warns against).",
    }),
    selfExplain({
      id: "ja-m30-1-2-self-explain",
      anchorLabel: "あした くる？ vs あした きますか？",
      anchorAudioText: "あした くる？",
      question: "Why do these two questions mean almost the same thing but sound completely different?",
      rule: {
        text: "Both ask 'are you coming tomorrow' — きますか is the polite ます-question (keeps か); くる？ is the casual plain-form question (drops か, relies on rising intonation). Same content, different register.",
      },
      surface: {
        text: "きますか is present tense and くる？ is future tense — that's the real difference.",
      },
      distractor: {
        text: "くる？ is grammatically incomplete and should always have か added.",
      },
      ruleExplanation:
        "Register, not tense, is the difference. Plain form + rising intonation (くる？) is the casual pattern this pair teaches; ます-form + か (きますか) is the polite pattern from earlier modules. Both ask the same question.",
    }),
    speaking("ja-m30-1-2-speak-2", "あした ぜったい がっこうに くる", "I'm absolutely coming to school tomorrow.", ["ぜったい", "くる"]),
    // ── Review tail ──
    vocabMcq("ja-m30-1-2-rev-mcq-1", M30_1_2_REVIEW[0], M30_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m30-1-2-rev-lc-1",
      audioText: "でんしゃで がっこうに いきます",
      correctMeaningEn: "I go to school by train.",
      distractorsEn: [
        "I go to school by bus.",
        "I came from school by train.",
        "I don't go to school by train.",
      ],
    }),
    speaking("ja-m30-1-2-rev-speak-1", M30_1_2_REVIEW[2].kana, M30_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m30-1-2-rev", M30_1_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M30_1_2.steps);
assertAnswerRotation(M30_1_2.steps, 1);
assertNoConsecutiveSame(M30_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M30-2-1 — よ and ね I (new: けいご, したしい)
// ═══════════════════════════════════════════════════════════════════════

const M30_2_1_REVIEW = pickReviewAtoms("ja-m30-2-1-rev", M30_REVIEW_POOL, 4);

export const M30_2_1: LessonContent = {
  id: "ja-m30-2-1",
  moduleId: "m30",
  courseId: COURSE,
  languageId: LANG,
  title: "よ and ね — informing vs agreeing",
  description:
    "よ tells your friend something new; ね checks agreement on something shared. New: けいご (polite language), したしい (close, familiar).",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_YO_NE,
    build(
      "ja-m30-2-1-build-1",
      "Say to a friend, casually, telling them something new: This shop is cheap!",
      "このみせは やすいよ",
      ["この", "みせ", "は", "やすい", "よ", "ね"],
      ["この", "みせ", "は", "やすい", "よ"],
      ["やすい"],
    ),
    listeningCompSentence({
      id: "ja-m30-2-1-lc-1",
      audioText: "この みせは たのしいね。",
      correctMeaningEn: "This shop is fun, isn't it? (agreeing)",
      distractorsEn: [
        "This shop is fun! (telling you)",
        "This shop isn't fun.",
        "This shop was fun.",
      ],
    }),
    build(
      "ja-m30-2-1-build-2",
      "Say to a friend, casually, agreeing: You're tired, aren't you?",
      "つかれたね",
      ["つかれた", "ね", "よ", "です"],
      ["つかれた", "ね"],
      ["つかれる"],
    ),
    listeningCompSentence({
      id: "ja-m30-2-1-lc-keigo",
      audioText: "けいごは むずかしい。",
      correctMeaningEn: "Polite language (keigo) is difficult.",
      distractorsEn: [
        "Casual speech is difficult.",
        "Keigo is easy.",
        "Keigo isn't used anymore.",
      ],
      exercisedAtomKanas: ["けいご"],
    }),
    speaking("ja-m30-2-1-speak-keigo", "けいごを つかう", "I use polite language (keigo).", ["けいご"]),
    sentenceMcq({
      id: "ja-m30-2-1-mcq-1",
      prompt: "Which sentence INFORMS a friend of something new (よ)?",
      correctKana: "かばん、わすれたよ！",
      distractorsKana: ["かばん、わすれたね。", "かばんは たかいね。", "かばんは やすいね。"],
      explanation:
        "よ = informing (telling them something they don't know); ね = agreeing/confirming shared knowledge. Only the first tells them new information.",
    }),
    build(
      "ja-m30-2-1-build-3",
      "Say to a friend, casually, about your friendship: We're close friends, you know!",
      "ともだちは したしいよ",
      ["ともだち", "は", "したしい", "よ", "ね"],
      ["ともだち", "は", "したしい", "よ"],
      ["したしい"],
    ),
    listeningBuildSentence({
      id: "ja-m30-2-1-lb-1",
      target: "したしいけど、けいごを つかう",
      tiles: ["したしい", "けど", "けいご", "を", "つかう", "つかわない", "やすい"],
      correctOrder: ["したしい", "けど", "けいご", "を", "つかう"],
      promptEn: "Hear it, build it: 'We're close, but I use polite language (with them).'",
      exercisedAtomKanas: ["したしい", "けいご"],
    }),
    sentenceMcq({
      id: "ja-m30-2-1-mcq-2",
      prompt: "Which correctly uses ね to agree that keigo is hard?",
      correctKana: "けいごは むずかしいね。",
      distractorsKana: ["けいごは むずかしいよ。", "けいごは やさしいね。", "けいごを つかわないね。"],
      explanation:
        "ね here agrees on something both speakers already find true — 'keigo is hard, right?' よ would instead inform someone who didn't already think so.",
      exercisedAtomKanas: ["けいご"],
    }),
    translateStep({
      id: "ja-m30-2-1-translate",
      promptEn: "Say to a friend, casually, telling them something new: This bag is cheap!",
      acceptedAnswers: ["このかばんは やすいよ", "このかばんは やすいよ。"],
      audioText: "このかばんは やすいよ",
      exercisedAtomKanas: ["やすい"],
    }),
    selfExplain({
      id: "ja-m30-2-1-self-explain",
      anchorLabel: "わすれたよ vs わすれたね",
      anchorAudioText: "かばん、わすれたよ",
      question: "Why is よ correct here instead of ね?",
      rule: {
        text: "よ asserts information the LISTENER doesn't already know — telling a friend they forgot their bag is new news to them, so よ fits. ね would wrongly assume they already know.",
      },
      surface: {
        text: "よ and ね are interchangeable; either works at the end of any sentence.",
      },
      distractor: {
        text: "ね is used for bad news and よ is used for good news.",
      },
      ruleExplanation:
        "よ = 'I'm telling you something you don't know.' ね = 'I assume you already feel/know this too, right?' The forgotten bag is news to the listener, not shared knowledge — that's what makes よ, not ね, the correct choice here.",
    }),
    speaking("ja-m30-2-1-speak-2", "したしいけど、けいごを つかう", "We're close, but I use polite language (with them).", ["したしい", "けいご"]),
    // ── Review tail ──
    vocabMcq("ja-m30-2-1-rev-mcq-1", M30_2_1_REVIEW[0], M30_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m30-2-1-rev-lc-1",
      audioText: "がっこうで にほんごを べんきょうします",
      correctMeaningEn: "I study Japanese at school.",
      distractorsEn: [
        "I study English at school.",
        "I studied Japanese yesterday.",
        "I don't study at school.",
      ],
    }),
    speaking("ja-m30-2-1-rev-speak-1", M30_2_1_REVIEW[2].kana, M30_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m30-2-1-rev", M30_2_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M30_2_1.steps);
assertAnswerRotation(M30_2_1.steps, 1);
assertNoConsecutiveSame(M30_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M30-2-2 — Naming the register itself (new: ていねい, しつれい)
// ═══════════════════════════════════════════════════════════════════════

const M30_2_2_REVIEW = pickReviewAtoms("ja-m30-2-2-rev", M30_REVIEW_POOL, 4);

export const M30_2_2: LessonContent = {
  id: "ja-m30-2-2",
  moduleId: "m30",
  courseId: COURSE,
  languageId: LANG,
  title: "ていねい / しつれい — naming the register itself",
  description:
    "The words for the registers themselves: ていねい (polite, careful), しつれい (rude, impolite).",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m30-2-2-build-1",
      "Say to a friend, casually: Is your teacher polite?",
      "せんせいは ていねい",
      ["せんせい", "は", "ていねい", "です", "か"],
      ["せんせい", "は", "ていねい"],
      ["ていねい"],
    ),
    listeningCompSentence({
      id: "ja-m30-2-2-lc-shitsurei",
      audioText: "それは しつれいね。",
      correctMeaningEn: "That's rude, isn't it?",
      distractorsEn: [
        "That's polite, isn't it?",
        "That's rude! (telling you)",
        "That wasn't rude.",
      ],
      exercisedAtomKanas: ["しつれい"],
    }),
    build(
      "ja-m30-2-2-build-2",
      "Say to a friend, casually, telling them something new: That's rude!",
      "それ、しつれいよ",
      ["それ", "しつれい", "よ", "ね", "です"],
      ["それ", "しつれい", "よ"],
      ["しつれい"],
    ),
    speaking("ja-m30-2-2-speak-teinei", "ていねいな せんせい", "A polite teacher", ["ていねい"]),
    sentenceMcq({
      id: "ja-m30-2-2-mcq-1",
      prompt: "Which describes けいご (polite language) itself?",
      correctKana: "けいごは ていねいだ。",
      distractorsKana: ["けいごは しつれいだ。", "ためぐちは ていねいだ。", "けいごは やすいだ。"],
      explanation:
        "けいご IS the polite (ていねい) style; calling it しつれい reverses the meaning, and casual speech (ためぐち) is the opposite of ていねい.",
      exercisedAtomKanas: ["けいご", "ていねい"],
    }),
    build(
      "ja-m30-2-2-build-3",
      "Say to a friend, casually, agreeing: Being late is rude, right?",
      "おくれるのは しつれいね",
      ["おくれるのは", "しつれい", "ね", "よ"],
      ["おくれるのは", "しつれい", "ね"],
      ["しつれい"],
    ),
    listeningBuildSentence({
      id: "ja-m30-2-2-lb-1",
      target: "ぜったい、しつれいな ことは しない",
      tiles: ["ぜったい", "しつれい", "な", "こと", "は", "しない", "する"],
      correctOrder: ["ぜったい", "しつれい", "な", "こと", "は", "しない"],
      promptEn: "Hear it, build it: 'I absolutely won't do anything rude.'",
      exercisedAtomKanas: ["ぜったい", "しつれい"],
    }),
    sentenceMcq({
      id: "ja-m30-2-2-mcq-2",
      prompt: "Which means 'This teacher is careful and polite, isn't he?'",
      correctKana: "この せんせいは ていねいね。",
      distractorsKana: ["この せんせいは しつれいね。", "この せんせいは ぜったいね。", "この せんせいは やすいね。"],
      explanation:
        "ていねい = careful/polite; しつれい = rude (opposite); ぜったい = absolutely (unrelated adverb); やすい = cheap — different meanings entirely.",
      exercisedAtomKanas: ["ていねい"],
    }),
    translateStep({
      id: "ja-m30-2-2-translate",
      promptEn: "Say to a friend, casually, telling them something new: That's really rude!",
      acceptedAnswers: ["それ、ほんとうに しつれいよ", "それ、ほんとうに しつれいよ。"],
      audioText: "それ、ほんとうに しつれいよ",
      exercisedAtomKanas: ["しつれい"],
    }),
    selfExplain({
      id: "ja-m30-2-2-self-explain",
      anchorLabel: "ていねい vs しつれい",
      anchorAudioText: "けいごは ていねいだ",
      question: "How do ていねい and しつれい relate to けいご and ためぐち?",
      rule: {
        text: "ていねい (polite/careful) describes the QUALITY of keigo — that's what makes it polite. しつれい (rude) is what casual speech becomes when aimed at the wrong person — not casual speech itself, but casual speech used in the wrong register.",
      },
      surface: {
        text: "しつれい just means 'casual speech' and ていねい just means 'keigo' — they're two names for the same two registers.",
      },
      distractor: {
        text: "ていねい and しつれい are opposites of speed, not politeness — ていねい means slow and careful, しつれい means fast and careless.",
      },
      ruleExplanation:
        "ていねい/しつれい describe a QUALITY judgment about how speech lands on a listener, not the registers themselves. けいご is naturally ていねい; ためぐち becomes しつれい only when used with the wrong person — that's exactly what pair 4 covers next.",
    }),
    speaking("ja-m30-2-2-speak-2", "この せんせいは ていねいね。", "This teacher is polite, isn't he.", ["ていねい"]),
    // ── Review tail ──
    vocabMcq("ja-m30-2-2-rev-mcq-1", M30_2_2_REVIEW[0], M30_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m30-2-2-rev-lc-1",
      audioText: "としょかんに ほんが あります",
      correctMeaningEn: "There are books in the library.",
      distractorsEn: [
        "There is no library.",
        "The library has a book store.",
        "There was a book in the library.",
      ],
    }),
    speaking("ja-m30-2-2-rev-speak-1", M30_2_2_REVIEW[2].kana, M30_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m30-2-2-rev", M30_2_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M30_2_2.steps);
assertAnswerRotation(M30_2_2.steps, 1);
assertNoConsecutiveSame(M30_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M30-3-1 — なにしてるの？ (new: ためぐち, なんで, どうしたの)
// ═══════════════════════════════════════════════════════════════════════

const M30_3_1_REVIEW = pickReviewAtoms("ja-m30-3-1-rev", M30_REVIEW_POOL, 4);

export const M30_3_1: LessonContent = {
  id: "ja-m30-3-1",
  moduleId: "m30",
  courseId: COURSE,
  languageId: LANG,
  title: "なにしてるの？ — the casual の question",
  description:
    "Casual してる contraction (している → してる) + curious の question. New: ためぐち (casual speech), なんで (why, casual), どうしたの (what's up?).",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_CASUAL_NO,
    build(
      "ja-m30-3-1-build-1",
      "Say to a friend, casually: What are you doing?",
      "なにしてるの",
      ["なに", "してる", "の", "していますか", "か"],
      ["なに", "してる", "の"],
      ["なに"],
    ),
    kanjiReading(
      "ja-m30-3-1-kr-nani",
      { kana: "なに", meaningEn: "what", fromModule: "m1" },
      { distractors: ["だれ", "どこ", "いつ"] },
    ),
    listeningCompSentence({
      id: "ja-m30-3-1-lc-1",
      audioText: "どこ いくの？",
      correctMeaningEn: "Where are you going?",
      distractorsEn: [
        "Where did you go?",
        "I'm not going anywhere.",
        "Where do you live?",
      ],
    }),
    build(
      "ja-m30-3-1-build-2",
      "Say to a friend, casually: Who are you talking with?",
      "だれと はなしてるの",
      ["だれ", "と", "はなしてる", "の", "はなしますか"],
      ["だれ", "と", "はなしてる", "の"],
      ["はなす"],
    ),
    listeningCompSentence({
      id: "ja-m30-3-1-lc-tameguchi",
      audioText: "ともだちには ためぐちを つかう。",
      correctMeaningEn: "I use casual speech with friends.",
      distractorsEn: [
        "I use keigo with friends.",
        "I don't talk with friends.",
        "I used casual speech yesterday.",
      ],
      exercisedAtomKanas: ["ためぐち"],
    }),
    speaking("ja-m30-3-1-speak-tameguchi", "ためぐちで はなす", "To speak in casual style.", ["ためぐち"]),
    sentenceMcq({
      id: "ja-m30-3-1-mcq-1",
      prompt: "Which means 'Why aren't you coming?' (casual)?",
      correctKana: "なんで こないの？",
      distractorsKana: ["なんで きたの？", "なんで いくの？", "なんで こないですか。"],
      explanation:
        "なんで = casual 'why'; こないの？ = 'aren't you coming?' The others ask a different question or mix casual の with polite ですか.",
      exercisedAtomKanas: ["なんで"],
    }),
    build(
      "ja-m30-3-1-build-3",
      "Say to a friend, casually: Why are you tired?",
      "なんで つかれてるの",
      ["なんで", "つかれてる", "の", "つかれた", "ですか"],
      ["なんで", "つかれてる", "の"],
      ["なんで", "つかれる"],
    ),
    listeningBuildSentence({
      id: "ja-m30-3-1-lb-1",
      target: "どうしたの げんき ない",
      tiles: ["どうしたの", "げんき", "ない", "です", "か"],
      correctOrder: ["どうしたの", "げんき", "ない"],
      promptEn: "Hear it, build it (casual): 'What's up? You okay?'",
      exercisedAtomKanas: ["どうしたの"],
    }),
    sentenceMcq({
      id: "ja-m30-3-1-mcq-2",
      prompt: "Which is the CASUAL equivalent of 'Are you working right now?'",
      correctKana: "いま はたらいてるの？",
      distractorsKana: ["いま はたらいていますか。", "いま はたらきましたか。", "きのう はたらいたの？"],
      explanation:
        "はたらいてるの？ = casual contraction + の-question; はたらいていますか = polite; はたらきましたか = polite past; きのう…の？ asks about yesterday — wrong tense.",
    }),
    translateStep({
      id: "ja-m30-3-1-translate",
      promptEn: "Say to a friend, casually: What are you doing right now?",
      acceptedAnswers: ["いま なにしてるの", "いま なにしてるの？"],
      audioText: "いま なにしてるの？",
      exercisedAtomKanas: ["なに"],
    }),
    selfExplain({
      id: "ja-m30-3-1-self-explain",
      anchorLabel: "なにしてるの？ vs なにしていますか？",
      anchorAudioText: "なにしてるの？",
      question: "What TWO things change between なにしていますか and なにしてるの?",
      rule: {
        text: "Two independent swaps: している contracts to してる (drop い — casual pronunciation), AND ですか/ますか-style politeness is replaced by casual の, which softens the question into a curious, personal tone. Both are register changes, not meaning changes.",
      },
      surface: {
        text: "してる means 'did' (past) while しています means 'is doing' (present) — a tense difference.",
      },
      distractor: {
        text: "の is a possession particle here, marking whose action it is.",
      },
      ruleExplanation:
        "Both sentences ask the exact same thing — 'what are you doing?' — in different registers. してる is the casual contraction of している (same tense, same meaning). Casual の here is a QUESTION-SOFTENER (curious tone), not the possession の from earlier modules — same kana, different job.",
    }),
    speaking("ja-m30-3-1-speak-2", "だれと はなしてるの？", "Who are you talking with?", ["はなす"]),
    // ── Review tail ──
    vocabMcq("ja-m30-3-1-rev-mcq-1", M30_3_1_REVIEW[0], M30_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m30-3-1-rev-lc-1",
      audioText: "まいあさ コーヒーを のみます",
      correctMeaningEn: "I drink coffee every morning.",
      distractorsEn: [
        "I drink tea every morning.",
        "I drank coffee yesterday.",
        "I don't drink coffee.",
      ],
    }),
    speaking("ja-m30-3-1-rev-speak-1", M30_3_1_REVIEW[2].kana, M30_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m30-3-1-rev", M30_3_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M30_3_1.steps);
assertAnswerRotation(M30_3_1.steps, 1);
assertNoConsecutiveSame(M30_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M30-3-2 — べつに / きになる (new: きになる, べつに)
// ═══════════════════════════════════════════════════════════════════════

const M30_3_2_REVIEW = pickReviewAtoms("ja-m30-3-2-rev", M30_REVIEW_POOL, 4);

export const M30_3_2: LessonContent = {
  id: "ja-m30-3-2",
  moduleId: "m30",
  courseId: COURSE,
  languageId: LANG,
  title: "べつに / きになる — casual filler practice",
  description:
    "Two casual conversational staples: べつに (not particularly, the stock deflecting answer) and きになる (on my mind).",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m30-3-2-build-1",
      "Say to a friend, casually: What are you looking for?",
      "なにさがしてるの",
      ["なに", "さがしてる", "の", "さがしますか"],
      ["なに", "さがしてる", "の"],
      ["さがす"],
    ),
    listeningCompSentence({
      id: "ja-m30-3-2-lc-betsuni",
      audioText: "べつに。",
      correctMeaningEn: "Not particularly. / Nothing much.",
      distractorsEn: [
        "Of course!",
        "Absolutely!",
        "Probably.",
      ],
      exercisedAtomKanas: ["べつに"],
    }),
    speaking("ja-m30-3-2-speak-betsuni", "べつに。", "Not particularly.", ["べつに"]),
    listeningCompSentence({
      id: "ja-m30-3-2-lc-kininaru",
      audioText: "それが きになる。",
      correctMeaningEn: "That's on my mind. / I'm curious about that.",
      distractorsEn: [
        "That doesn't matter to me.",
        "I forgot about that.",
        "That's obvious.",
      ],
      exercisedAtomKanas: ["きになる"],
    }),
    speaking("ja-m30-3-2-speak-kininaru", "きになる…", "It's on my mind...", ["きになる"]),
    sentenceMcq({
      id: "ja-m30-3-2-mcq-1",
      prompt: "A friend asks どうしたの？ and nothing's actually wrong. Which is the natural casual answer?",
      correctKana: "べつに。",
      distractorsKana: ["もちろん。", "ぜったい。", "なんで？"],
      explanation:
        "べつに = 'nothing in particular' (the deflecting answer to どうしたの？); もちろん = of course; ぜったい = absolutely; なんで？ = why? — all real words, wrong fit for this exchange.",
      exercisedAtomKanas: ["べつに"],
    }),
    build(
      "ja-m30-3-2-build-2",
      "Say to a friend, casually: I forgot everything — it's on my mind.",
      "ぜんぶ わすれて、きになる",
      ["ぜんぶ", "わすれて", "きになる", "きにしない"],
      ["ぜんぶ", "わすれて", "きになる"],
      ["ぜんぶ", "きになる"],
    ),
    listeningBuildSentence({
      id: "ja-m30-3-2-lb-1",
      target: "どうしたの しごとが きになる",
      tiles: ["どうしたの", "しごと", "が", "きになる", "きにしない", "です"],
      correctOrder: ["どうしたの", "しごと", "が", "きになる"],
      promptEn: "Hear it, build it: 'What's up? I'm just worried about work.'",
      exercisedAtomKanas: ["どうしたの", "きになる"],
    }),
    sentenceMcq({
      id: "ja-m30-3-2-mcq-2",
      prompt: "Which means 'I'm not worried about it in particular'?",
      correctKana: "べつに きにならない。",
      distractorsKana: ["ぜったい きになる。", "もちろん きになる。", "べつに きになる。"],
      explanation:
        "べつに + the negative ない-form of きになる negates the concern; the others assert concern instead.",
      exercisedAtomKanas: ["べつに", "きになる"],
    }),
    translateStep({
      id: "ja-m30-3-2-translate",
      promptEn: "Say to a friend, casually: What's up? I'm just worried about work.",
      acceptedAnswers: ["どうしたの？しごとが きになる", "どうしたの？ しごとが きになる。"],
      audioText: "どうしたの？ しごとが きになる。",
      exercisedAtomKanas: ["どうしたの", "きになる"],
    }),
    selfExplain({
      id: "ja-m30-3-2-self-explain",
      anchorLabel: "べつに as a deflecting answer",
      anchorAudioText: "べつに。",
      question: "Why does べつに answer どうしたの？ even though it doesn't literally mean 'nothing'?",
      rule: {
        text: "べつに literally means 'not particularly/separately,' but as a stock casual answer to どうしたの？ it functions as a soft deflection — 'nothing worth mentioning.' It's a fixed conversational move, not a literal translation.",
      },
      surface: {
        text: "べつに literally and directly translates to 'nothing.'",
      },
      distractor: {
        text: "べつに can only be used as a question, never as an answer.",
      },
      ruleExplanation:
        "べつに's core meaning is 'not particularly / not especially' — as a bare reply to どうしたの？ it becomes a conventional deflection ('nothing much'), the same way English 'nothing' answers 'what's wrong?' without literally meaning zero things are happening.",
    }),
    speaking("ja-m30-3-2-speak-2", "どうしたの？ しごとが きになる。", "What's up? I'm just worried about work.", ["どうしたの", "きになる"]),
    // ── Review tail ──
    vocabMcq("ja-m30-3-2-rev-mcq-1", M30_3_2_REVIEW[0], M30_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m30-3-2-rev-lc-1",
      audioText: "でんしゃで かいしゃに いきます",
      correctMeaningEn: "I go to the company by train.",
      distractorsEn: [
        "I go to school by train.",
        "I came from the company by train.",
        "I don't go to the company by train.",
      ],
    }),
    speaking("ja-m30-3-2-rev-speak-1", M30_3_2_REVIEW[2].kana, M30_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m30-3-2-rev", M30_3_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M30_3_2.steps);
assertAnswerRotation(M30_3_2.steps, 1);
assertNoConsecutiveSame(M30_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M30-4-1 — Register at work (new: せんぱい, じょうし, どうりょう, やっぱり)
// ═══════════════════════════════════════════════════════════════════════

const M30_4_1_REVIEW = pickReviewAtoms("ja-m30-4-1-rev", M30_REVIEW_POOL, 4);

export const M30_4_1: LessonContent = {
  id: "ja-m30-4-1",
  moduleId: "m30",
  courseId: COURSE,
  languageId: LANG,
  title: "Register at work — せんぱい / じょうし / どうりょう",
  description:
    "Casual is wrong with the wrong people. New: せんぱい (senior), じょうし (boss), どうりょう (colleague), やっぱり (as expected).",
  estimatedMinutes: 11,
  xpReward: 28,
  steps: [
    RULE_REGISTER,
    vocabMcq(
      "ja-m30-4-1-mcq-senpai",
      { kana: "せんぱい", meaningEn: "senior (at school/work)", emoji: "🎓", fromModule: "m30" },
      M30_REVIEW_POOL,
    ),
    speaking("ja-m30-4-1-speak-senpai", "せんぱいと はなす", "To talk with my senior.", ["せんぱい"]),
    listeningCompSentence({
      id: "ja-m30-4-1-lc-senpai",
      audioText: "せんぱいには ていねいに はなす。",
      correctMeaningEn: "I speak politely with my senior.",
      distractorsEn: [
        "I speak casually with my senior.",
        "I don't speak with my senior.",
        "I spoke rudely with my senior.",
      ],
      exercisedAtomKanas: ["せんぱい", "ていねい"],
    }),
    vocabMcq(
      "ja-m30-4-1-mcq-joushi",
      { kana: "じょうし", meaningEn: "boss, superior", emoji: "💼", fromModule: "m30" },
      M30_REVIEW_POOL,
    ),
    build(
      "ja-m30-4-1-build-1",
      "Say POLITELY to your boss: Are you coming tomorrow?",
      "あした きますか",
      ["あした", "きます", "か", "くる", "の"],
      ["あした", "きます", "か"],
      ["くる"],
    ),
    sentenceMcq({
      id: "ja-m30-4-1-mcq-1",
      prompt: "Which is CORRECT to say to your じょうし (boss)?",
      correctKana: "あした きますか。",
      distractorsKana: ["あした くる？", "あした きたの？", "あした こない？"],
      explanation:
        "Bosses get polite ます-form questions, not casual くる？/の-questions — using casual speech with a じょうし is しつれい (rude).",
      exercisedAtomKanas: ["じょうし"],
    }),
    vocabMcq(
      "ja-m30-4-1-mcq-douryou",
      { kana: "どうりょう", meaningEn: "colleague", emoji: "🧑‍💼", fromModule: "m30" },
      M30_REVIEW_POOL,
    ),
    speaking("ja-m30-4-1-speak-douryou", "どうりょうと しごとを する", "To work with my colleague.", ["どうりょう"]),
    listeningCompSentence({
      id: "ja-m30-4-1-lc-yappari",
      audioText: "どうりょうとは、やっぱり ていねいに はなす。",
      correctMeaningEn: "With my colleague, I speak politely after all.",
      distractorsEn: [
        "With my colleague, I speak casually after all.",
        "I don't work with my colleague.",
        "My colleague doesn't speak politely.",
      ],
      exercisedAtomKanas: ["どうりょう", "やっぱり"],
    }),
    speaking("ja-m30-4-1-speak-yappari", "やっぱり、けいごが だいじ。", "Polite language matters after all.", ["やっぱり", "けいご"]),
    kanjiReading("ja-m30-4-1-kr-sensei", { kana: "せんせい", meaningEn: "teacher, doctor", fromModule: "m3" }),
    sentenceMcq({
      id: "ja-m30-4-1-mcq-2",
      prompt: "Which means 'As expected, my boss uses polite language'?",
      correctKana: "やっぱり、じょうしは けいごを つかう。",
      distractorsKana: ["たぶん、じょうしは けいごを つかう。", "やっぱり、せんぱいは ためぐちを つかう。", "やっぱり、じょうしは ためぐちを つかう。"],
      explanation:
        "やっぱり = 'as expected' (confirms an assumption); たぶん = 'probably' (uncertain); ためぐち with a じょうし would itself be a register mistake — different meaning entirely.",
      exercisedAtomKanas: ["やっぱり", "じょうし"],
    }),
    build(
      "ja-m30-4-1-build-2",
      "Say politely to your senior: I helped my colleague.",
      "どうりょうを てつだいました",
      ["どうりょう", "を", "てつだいました", "てつだった", "てつだう"],
      ["どうりょう", "を", "てつだいました"],
      ["どうりょう", "てつだう"],
    ),
    listeningBuildSentence({
      id: "ja-m30-4-1-lb-1",
      target: "せんぱいには ぜったい ためぐちを つかわない",
      tiles: ["せんぱい", "には", "ぜったい", "ためぐち", "を", "つかわない", "つかう"],
      correctOrder: ["せんぱい", "には", "ぜったい", "ためぐち", "を", "つかわない"],
      promptEn: "Hear it, build it: 'I absolutely don't use casual speech with my senior.'",
      exercisedAtomKanas: ["せんぱい", "ぜったい", "ためぐち"],
    }),
    translateStep({
      id: "ja-m30-4-1-translate",
      promptEn: "Say politely to your boss: I will absolutely come tomorrow.",
      acceptedAnswers: ["あした ぜったい きます", "あした ぜったい きます。"],
      audioText: "あした ぜったい きます。",
      exercisedAtomKanas: ["ぜったい"],
    }),
    selfExplain({
      id: "ja-m30-4-1-self-explain",
      anchorLabel: "じょうしに くる？ vs きますか？",
      anchorAudioText: "あした きますか。",
      question: "Why is あした くる？ wrong to say to your じょうし (boss)?",
      rule: {
        text: "Casual questions (dropped か, plain form) signal closeness/equal footing — appropriate for なかま/したしい ともだち, not for a じょうし. Directing casual speech at your boss reads as しつれい (rude), regardless of how grammatically correct the sentence is.",
      },
      surface: {
        text: "あした くる？ is simply shorter and more efficient, so it's fine in any context.",
      },
      distractor: {
        text: "じょうし only understands polite speech and wouldn't understand くる？ at all.",
      },
      ruleExplanation:
        "Every sentence in this pair is grammatically perfect Japanese — the ERROR is social, not grammatical. Casual register marks closeness; using it upward at a じょうし breaks the expected hierarchy and reads as rude, even though the boss would understand it just fine.",
    }),
    speaking("ja-m30-4-1-speak-2", "じょうしには ぜったい ていねいに はなす。", "I absolutely speak politely with my boss.", ["じょうし", "ぜったい", "ていねい"]),
    // ── Review tail ──
    vocabMcq("ja-m30-4-1-rev-mcq-1", M30_4_1_REVIEW[0], M30_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m30-4-1-rev-lc-1",
      audioText: "まいにち かいしゃで はたらきます",
      correctMeaningEn: "I work at the company every day.",
      distractorsEn: [
        "I study at the company every day.",
        "I worked at the company yesterday.",
        "I don't work at the company.",
      ],
    }),
    speaking("ja-m30-4-1-rev-speak-1", M30_4_1_REVIEW[2].kana, M30_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m30-4-1-rev", M30_4_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M30_4_1.steps);
assertAnswerRotation(M30_4_1.steps, 1);
assertNoConsecutiveSame(M30_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M30-4-2 — Who gets casual speech (new: こうはい, しりあい, おさななじみ, なかま)
// ═══════════════════════════════════════════════════════════════════════

const M30_4_2_REVIEW = pickReviewAtoms("ja-m30-4-2-rev", M30_REVIEW_POOL, 4);

export const M30_4_2: LessonContent = {
  id: "ja-m30-4-2",
  moduleId: "m30",
  courseId: COURSE,
  languageId: LANG,
  title: "Who gets casual speech — こうはい / しりあい / なかま",
  description:
    "Closeness, not just hierarchy, decides register. New: こうはい (junior), しりあい (acquaintance), おさななじみ (childhood friend), なかま (mate).",
  estimatedMinutes: 11,
  xpReward: 28,
  steps: [
    vocabMcq(
      "ja-m30-4-2-mcq-kouhai",
      { kana: "こうはい", meaningEn: "junior (at school/work)", emoji: "🧑‍🎓", fromModule: "m30" },
      M30_REVIEW_POOL,
    ),
    speaking("ja-m30-4-2-speak-kouhai", "こうはいと はなす", "To talk with my junior.", ["こうはい"]),
    build(
      "ja-m30-4-2-build-1",
      "Say casually to your junior: Are you coming tomorrow?",
      "あした くる",
      ["あした", "くる", "きます", "か"],
      ["あした", "くる"],
      ["くる"],
    ),
    listeningCompSentence({
      id: "ja-m30-4-2-lc-1",
      audioText: "こうはいには ためぐちで はなす。",
      correctMeaningEn: "I speak with my junior in casual style.",
      distractorsEn: [
        "I speak with my junior in keigo.",
        "I don't speak with my junior.",
        "I spoke rudely to my junior.",
      ],
      exercisedAtomKanas: ["こうはい", "ためぐち"],
    }),
    vocabMcq(
      "ja-m30-4-2-mcq-shiriai",
      { kana: "しりあい", meaningEn: "acquaintance", emoji: "🤵", fromModule: "m30" },
      M30_REVIEW_POOL,
    ),
    speaking("ja-m30-4-2-speak-shiriai", "しりあいと はなす", "To talk with an acquaintance.", ["しりあい"]),
    sentenceMcq({
      id: "ja-m30-4-2-mcq-1",
      prompt: "Which correctly contrasts register for two different people?",
      correctKana: "こうはいには ためぐち、しりあいには けいご。",
      distractorsKana: [
        "こうはいには けいご、しりあいには ためぐち。",
        "こうはいには ためぐち、なかまには けいご。",
        "しりあいには ためぐち、じょうしには ためぐち。",
      ],
      explanation:
        "こうはい (junior, close hierarchy) gets casual speech; a new しりあい gets keigo until closeness is established — swapping them (or using ためぐち with a じょうし) is the register mistake.",
      exercisedAtomKanas: ["こうはい", "しりあい"],
    }),
    vocabMcq(
      "ja-m30-4-2-mcq-osananajimi",
      { kana: "おさななじみ", meaningEn: "childhood friend", emoji: "🧒", fromModule: "m30" },
      M30_REVIEW_POOL,
    ),
    speaking("ja-m30-4-2-speak-osananajimi", "おさななじみと なんでも はなす。", "I talk about everything with my childhood friend.", ["おさななじみ"]),
    vocabMcq(
      "ja-m30-4-2-mcq-nakama",
      { kana: "なかま", meaningEn: "comrade, mate", emoji: "👥", fromModule: "m30" },
      M30_REVIEW_POOL,
    ),
    build(
      "ja-m30-4-2-build-2",
      "Say casually to your なかま (mate): I'm helping you.",
      "てつだうよ",
      ["てつだう", "よ", "ね", "ます"],
      ["てつだう", "よ"],
      ["てつだう"],
    ),
    listeningBuildSentence({
      id: "ja-m30-4-2-lb-1",
      target: "なかまと おさななじみは みんな したしい",
      tiles: ["なかま", "と", "おさななじみ", "は", "みんな", "したしい", "しつれい"],
      correctOrder: ["なかま", "と", "おさななじみ", "は", "みんな", "したしい"],
      promptEn: "Hear it, build it: 'My mates and childhood friends are all close.'",
      exercisedAtomKanas: ["なかま", "おさななじみ", "したしい"],
    }),
    sentenceMcq({
      id: "ja-m30-4-2-mcq-2",
      prompt: "Which means 'As expected, I speak casually with my mate'?",
      correctKana: "やっぱり、なかまとは ためぐちで はなす。",
      distractorsKana: [
        "やっぱり、じょうしとは ためぐちで はなす。",
        "たぶん、なかまとは ためぐちで はなす。",
        "やっぱり、なかまとは けいごで はなす。",
      ],
      explanation:
        "やっぱり = as expected (confirms an assumption); じょうしとためぐち is itself a register error; たぶん = uncertain, wrong nuance; けいご with なかま reverses the expected register.",
      exercisedAtomKanas: ["やっぱり", "なかま", "ためぐち"],
    }),
    translateStep({
      id: "ja-m30-4-2-translate",
      promptEn: "Say casually to your mate: I'm absolutely helping you.",
      acceptedAnswers: ["ぜったい てつだうよ", "ぜったい てつだうよ。"],
      audioText: "ぜったい てつだうよ。",
      exercisedAtomKanas: ["ぜったい", "てつだう"],
    }),
    selfExplain({
      id: "ja-m30-4-2-self-explain",
      anchorLabel: "なかま/おさななじみ vs しりあい",
      anchorAudioText: "なかまには ためぐち、しりあいには けいご。",
      question: "Why does the SAME casual sentence work for なかま but not for a new しりあい?",
      rule: {
        text: "Register in Japanese tracks relationship closeness, not just politeness rules — なかま/おさななじみ/したしい ともだち are equals you're already close with (casual is natural); a しりあい is someone you don't yet have that closeness with, so keigo/politeness is the safe default until the relationship changes.",
      },
      surface: {
        text: "しりあい just means 'stranger,' so no Japanese is expected at all.",
      },
      distractor: {
        text: "Register only depends on age, never on how well you know someone.",
      },
      ruleExplanation:
        "This whole pair's rule is closeness, not age or workplace rank alone: どうりょう/しりあい start polite and may shift casual once close; なかま/おさななじみ/したしい ともだち are already-established equals, so casual is the default from the start.",
    }),
    speaking("ja-m30-4-2-speak-2", "なかまと おさななじみは みんな したしい。", "My mates and childhood friends are all close.", ["なかま", "おさななじみ", "したしい"]),
    // ── Review tail ──
    vocabMcq("ja-m30-4-2-rev-mcq-1", M30_4_2_REVIEW[0], M30_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m30-4-2-rev-lc-1",
      audioText: "デパートで かばんを かいました",
      correctMeaningEn: "I bought a bag at the department store.",
      distractorsEn: [
        "I bought a bag at the convenience store.",
        "I'm buying a bag at the department store.",
        "I sold a bag at the department store.",
      ],
    }),
    speaking("ja-m30-4-2-rev-speak-1", M30_4_2_REVIEW[2].kana, M30_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m30-4-2-rev", M30_4_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M30_4_2.steps);
assertAnswerRotation(M30_4_2.steps, 1);
assertNoConsecutiveSame(M30_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions (stage 1 lessons only — pairs 1-4)
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M30_1_1.steps,
  ...M30_1_2.steps,
  ...M30_2_1.steps,
  ...M30_2_2.steps,
  ...M30_3_1.steps,
  ...M30_3_2.steps,
  ...M30_4_1.steps,
  ...M30_4_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M30_1_1, M30_1_2, M30_2_1, M30_2_2, M30_3_1, M30_3_2, M30_4_1, M30_4_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
