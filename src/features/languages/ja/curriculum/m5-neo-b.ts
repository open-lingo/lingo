/**
 * M5-NEO (part B, lessons 7-12) — module 5 of the dict-form-first rewrite
 * (spine tile s05, docs/m5-neo-authoring-spec-2026-07-20.md).
 *
 * "VERBS I — dictionary form as THE verb", second half:
 *  - L7  きく & わかる (bare-verb sentences; わかる takes no を)
 *  - L8  いう & おもう — RECOGNITION chunks そう おもう / そう いう？
 *        (type-5 chunk template, m3-neo L5 shape: no grammar_rule, no
 *        analyzed と quotation, production only OF the chunks themselves)
 *  - L9  もの — the thing-morpheme (たべもの/のみもの/かいもの compositional)
 *  - L10 food & object wave + drills across every taught verb (ごはん is
 *        THE food carrier — invariant 27 under-exposure directive)
 *  - L11 story: dinner plans (Tom/Mika/Ken; Tanaka です preview lines)
 *  - L12 mixed review: ALL-NEW sentences on m1-m3 carrier nouns neither
 *        half ran in sentences (そら/ほし/うみ/かわ/めがね/でんわ/ゆき/
 *        もも), ≥60% sentence-context, match-grid close, NO capstone.
 *
 * Plain-form register throughout (bare dict-form verbs ARE complete casual
 * sentences); です appears ONLY as flagged recognition preview lines spoken
 * by Tanaka (L11). Register cues on every register-dependent production
 * prompt (invariant 8); casual bare-verb answers are graded correct where a
 * fuller SOV answer exists (translate acceptedAnswers carry the bare verb,
 * the を-ful form, and spacing variants — the m3 だ-drop discipline).
 *
 * NEW invariant 26: every TEACHING lesson carries exactly ONE `-capstone`
 * integration step (build/translate/listening_build) placed after the body
 * and before the review tail, combining the lesson's new concept with ≥2
 * earlier-module concepts (の possession, これ/それ/あれ, だれ/なに, は/も,
 * the m3 rising-contour question, うん/そう replies). The review lesson has
 * none by design.
 *
 * Lessons 1-6 live in m5-neo-a.ts (separate authoring dispatch; owns all
 * courseAtoms additions — おもう etc.). This file freely USES what those
 * lessons teach (たべる/みる, を + SOV, のむ/かう, いく/くる, する/やる,
 * これ、いくら？) but imports nothing from -a: the tiny local helpers are
 * duplicated per the spec's file-layout rule. Registration, barrel, tests,
 * and TTS are wired after both halves land — do NOT add this file to
 * mockLessons/mockCourse here.
 *
 * Constraints honored (authoring-invariants-pinned + moduleBarGuards):
 * density 18-24; no adjacent same-type steps; ≤2 selection taps in a row;
 * ≥5 step types; every lesson closes on the house review tail; ≤3 uses of
 * any primary sentence surface; every new word debuts on an intro-capable
 * step before appearing in any option set; no production-framed MCQs;
 * persona canon (Tom=student/American/Mika's friend; Mika=student/Japanese;
 * Tanaka=the teacher; Ken=student/Japanese); dialogue speaker labels
 * ROMANIZED (male speakers get Keita automatically). Verb classes are
 * flagged in ONE line on rule cards only — no classification drills until
 * negation makes them functional (module 6). English glosses follow
 * invariant 17: plain non-past activity verbs read as intent/habit
 * ("Gonna eat?", "I'll listen"), never progressive; motion futurates
 * (いく/くる) may keep -ing.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  assertAnswerRotation,
  assertNoConsecutiveSame,
  assertNoSameAnswerCluster,
  build,
  cloze,
  dialogueListen,
  grammarRule,
  listeningBuildSentence,
  listeningCompSentence,
  M3_M7_REVIEW_POOL,
  pickReviewAtoms,
  reviewMatchPairs,
  sentenceMcq,
  speaking,
  translateStep,
  vocabMcq,
  withoutMcqBlocked,
} from "@/features/languages/ja/grammarHelpers";
import type { ListeningBuildStep } from "@/features/lesson/types";

const COURSE = "mock-1";
const LANG = "ja";

/**
 * Char-granularity `listening_build` of a single REVIEW word from its
 * prior-module TTS clip — the kana-decode beat of the house review tails.
 * Duplicated from m3-neo.ts per the spec's no-cross-import rule.
 *
 * FIXED words only: the mora arrays are hand-tokenized, so targets must
 * never come from a seeded `pickReviewAtoms` draw (the struggle-weighted
 * path re-picks per learner and the hand mora would drift out of sync).
 * Every `word` here must already be clipped in src/pub/tts/manifest.json
 * (keyed `ja:<word>`) — all m1/m2 pool atoms are.
 */
function listeningBuildWord(
  id: string,
  word: string,
  meaningEn: string,
  mora: string[],
  distractorKana: string[],
): ListeningBuildStep {
  return {
    id,
    type: "listening_build",
    audioKey: word,
    prompt: `Listen and build the word for '${meaningEn}'`,
    targetSentence: word,
    tiles: [...mora, ...distractorKana],
    correctOrder: mora,
    granularity: "character",
    targetAnnotation: [{ surface: word, reading: word }],
  };
}

// Review pools: M1 + M2 + M3 + M4 — m4 atoms now count as prior vocab
// (spec ruling for m5). Katakana entries excluded (ペン/カメラ class is not
// base-readable before the katakana ladder), image-blocked atoms filtered
// so the pools can feed vocabMcq directly. The m4 pointer/question words
// (これ/だれ/どれ/なん/わたし) are additionally excluded: their emoji cues
// (👇/🙋‍♂️/🤔/❓/🙋) are dishonest as visual MCQ targets (same rubric that
// blocks them in courseAtoms), and any pool atom can become a vocabMcq
// target under a struggle-weighted redraw.
const noKatakana = (a: { kana: string }) =>
  !/\p{Script=Katakana}/u.test(a.kana);
const ABSTRACT_POINTERS = new Set(["これ", "だれ", "どれ", "なん", "わたし"]);
const NEO_PRIOR_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter(
    (a) =>
      a.fromModule === "m1" ||
      a.fromModule === "m2" ||
      a.fromModule === "m3" ||
      a.fromModule === "m4",
  ),
)
  .filter(noKatakana)
  .filter((a) => !ABSTRACT_POINTERS.has(a.kana));

/* ════════════════════════════════════════════════════════════════════════
 * L7 — "きく and わかる"
 * Two ear-side verbs. きく on known objects or bare (spec: おんがく is
 * untaught — うた/こえ carry it); わかる is the no-を verb (its rule card
 * owns that genuine learner error). Exposure-first, rule cards consolidate.
 * ════════════════════════════════════════════════════════════════════════ */

const L7_REVIEW = pickReviewAtoms("ja-m5-neo-7-rev", NEO_PRIOR_POOL, 6);

export const M5_NEO_7: LessonContent = {
  id: "ja-m5-neo-7",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "きく and わかる",
  description:
    "Two verbs for your ears: きく takes the sound in, わかる reports that it landed. Bare verbs, complete sentences.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① きく — exposure first (inferable: taught を pattern + known noun).
    listeningCompSentence({
      id: "ja-m5-neo-7-lc-uta-kiku",
      audioText: "うたを きく？",
      question: "What does this sentence mean?",
      correctMeaningEn: "Gonna listen to the song?",
      distractorsEn: [
        "Gonna sing the song?",
        "Gonna buy the song?",
        "Is it a song?",
      ],
      exercisedAtomKanas: ["うた", "を", "きく"],
    }),
    build(
      "ja-m5-neo-7-build-uta-kiku",
      "Tell a friend: I'll listen to the song.",
      "うたを きく",
      ["うた", "を", "きく", "わかる"],
      ["うた", "を", "きく"],
      ["うた", "を", "きく"],
    ),
    grammarRule({
      id: "ja-m5-neo-7-rule-kiku",
      title: "きく — listen",
      rule:
        "きく is 'listen (to) / hear'. Alone it's already a full casual sentence: きく。 'I'll listen.' きく？ 'Gonna listen?' Add the thing with を: うたを きく — song + を + listen. きく is a う-verb — that matters when we start bending verbs soon.",
      examples: [
        {
          ja: "うたを きく。",
          romaji: "uta o kiku.",
          en: "I'll listen to the song.",
        },
        { ja: "きく？", romaji: "kiku?", en: "Gonna listen?" },
      ],
      // No antiPattern: the natural order error (verb before object) already
      // owns L2's を card, and きく has no distinct learner error at this
      // stage — omitting it correctly derives no spot step (invariant 12).
      cultureNote:
        "きく does double duty — listening to sounds and asking questions are the same verb in Japanese. For now, keep it on songs and sounds.",
    }),
    // ② わかる — exposure, then production, then the no-を rule.
    listeningCompSentence({
      id: "ja-m5-neo-7-lc-wakaru-q",
      audioText: "わかる？",
      question: "What does this mean?",
      correctMeaningEn: "Get it?",
      distractorsEn: ["I get it.", "Gonna listen?", "You think so?"],
      exercisedAtomKanas: ["わかる"],
    }),
    translateStep({
      id: "ja-m5-neo-7-tr-un-wakaru",
      promptEn: "Your friend asks if you get it. You do — answer casually: Yeah, I get it.",
      acceptedAnswers: ["うん、わかる", "うんわかる", "わかる", "うん、わかる。"],
      audioText: "うん、わかる",
      exercisedAtomKanas: ["うん", "わかる"],
    }),
    grammarRule({
      id: "ja-m5-neo-7-rule-wakaru",
      title: "わかる — I get it",
      rule:
        "わかる is 'to be clear / to get it'. It happens TO you — you don't do it to a thing, so it takes NO を. Name the thing, pause, ask: これ、わかる？ Bare わかる。 answers back: 'Got it.' わかる looks like a る-verb but bends like a う-verb — just a flag for later.",
      examples: [
        {
          ja: "これ、わかる？",
          romaji: "kore, wakaru?",
          en: "This — do you get it?",
        },
        { ja: "うん、わかる。", romaji: "un, wakaru.", en: "Yeah, I get it." },
      ],
      // Genuine learner error: overextending the shiny new を onto the one
      // verb here that refuses it. Full-sentence minimal pair of
      // examples[0] (、 → を, one wrong piece) — invariant 12.
      antiPattern: {
        ja: "これを わかる？",
        romaji: "kore o wakaru?",
        en: "(broken: わかる doesn't take を)",
        why:
          "Understanding isn't something you do TO a thing — it dawns on you. Drop the を: これ、わかる？",
      },
      cultureNote:
        "You'll hear わかる？/わかる。 volleys constantly — Japanese checks understanding far more often than English does.",
    }),
    // ③ Both verbs in the wild.
    dialogueListen({
      id: "ja-m5-neo-7-dlg-kiku-wakaru",
      lines: [
        { speaker: "Ken", kana: "これ、きく？" },
        { speaker: "Tom", kana: "うん、きく。" },
        { speaker: "Ken", kana: "うた、わかる？" },
        { speaker: "Tom", kana: "うん、わかる！" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Ken offer first?",
          correctText: "A listen — whether Tom wants to hear it",
          distractors: [
            "Whether Tom gets the words",
            "A song he wrote himself",
            "Whose song it is",
          ],
        },
        {
          id: "q2",
          prompt: "And the words — does Tom follow them?",
          correctText: "Yes — he says he gets them",
          distractors: [
            "No — they're too fast",
            "He can't hear the song",
            "He doesn't answer",
          ],
        },
      ],
      exercisedAtomKanas: ["これ", "きく", "うん", "うた", "わかる"],
    }),
    speaking(
      "ja-m5-neo-7-speak-wakaru-q",
      "わかる？",
      "Get it? (voice rises)",
      ["わかる"],
    ),
    cloze(
      "ja-m5-neo-7-cloze-wo",
      "うた",
      " きく。",
      "を",
      ["を", "は", "の", "も"],
      "I'll listen to the song.",
      "うたを きく。",
      "を pins down what the verb acts on: song + を + listen.",
    ),
    sentenceMcq({
      id: "ja-m5-neo-7-mcq-wakaru-check",
      prompt: "Pick the casual 'get it?'",
      correctKana: "わかる？",
      distractorsKana: ["きく？", "わかる。", "そう？"],
      explanation:
        "Rising tone turns bare わかる into the check; わかる。 (falling) would ANSWER it instead.",
      exercisedAtomKanas: ["わかる"],
    }),
    listeningBuildSentence({
      id: "ja-m5-neo-7-lbs-uta-kiku",
      target: "うたを きく",
      tiles: ["うた", "を", "きく", "わかる"],
      correctOrder: ["うた", "を", "きく"],
      promptEn: "I'll listen to the song.",
      exercisedAtomKanas: ["うた", "を", "きく"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-7-lc-kore-wakaru",
      audioText: "これ、わかる？",
      question: "What does this mean?",
      correctMeaningEn: "This — do you get it?",
      distractorsEn: [
        "This — are you listening?",
        "Do you get that one over there?",
        "Yeah, I get it.",
      ],
      exercisedAtomKanas: ["これ", "わかる"],
    }),
    speaking(
      "ja-m5-neo-7-speak-un-wakaru",
      "うん、わかる",
      "Yeah, I get it.",
      ["うん", "わかる"],
    ),
    // ④ CAPSTONE (invariant 26): lesson verb きく + の possession (m4) +
    // も (m3) in one build — the stretch beat before the easy tail.
    build(
      "ja-m5-neo-7-build-kenno-uta-capstone",
      "Mika's song was good. Tell her: I'll listen to Ken's song too.",
      "ケンの うたも きく",
      ["ケン", "の", "うた", "も", "きく", "こえ"],
      ["ケン", "の", "うた", "も", "きく"],
      ["の", "うた", "も", "きく"],
    ),
    // Review tail — prior atoms (house idiom: vocabMcq → decode-build →
    // LC → vocabMcq → match grid).
    vocabMcq("ja-m5-neo-7-rev-mcq", L7_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildSentence({
      // Sentence-level (2026-07-20): two-mora decode tripped the M5+
      // sentence-first ratchet — converted to a short verb sentence.
      id: "ja-m5-neo-7-rev-lbs-mado",
      target: "まどを みる",
      tiles: ["まど", "を", "みる", "きく"],
      correctOrder: ["まど", "を", "みる"],
      promptEn: "Gonna look at the window.",
      exercisedAtomKanas: ["まど", "みる"],
    }),
    listeningCompSentence({
      // Sentence-level (2026-07-20): the pool-word LC tripped the M5+
      // sentence-first ratchet — the pool noun now rides an m5 verb.
      id: "ja-m5-neo-7-rev-lc",
      audioText: "いぬも くる？",
      correctMeaningEn: "Is the dog coming too?",
      distractorsEn: [
        "Is the cat coming too?",
        "Is the dog going too?",
        "Did the dog eat?",
      ],
      exercisedAtomKanas: ["いぬ", "くる"],
    }),
    vocabMcq("ja-m5-neo-7-rev-mcq-2", L7_REVIEW[1], NEO_PRIOR_POOL),
    reviewMatchPairs("ja-m5-neo-7-rev", L7_REVIEW),
  ],
};

assertNoSameAnswerCluster(M5_NEO_7.steps);
assertAnswerRotation(M5_NEO_7.steps, 1); // single を cloze — intro lesson
assertNoConsecutiveSame(M5_NEO_7.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L8 — "いう & おもう — recognition chunks" (CHUNK template, type 5 —
 * m3-neo L5 shape: NO grammar_rule, no と quotation analysis). そう おもう
 * "I think so" / そう いう？ "do you say it like that?" enter as situated
 * wholes; the only production is OF the chunks themselves (shadowing, one
 * chunk build, the capstone translate). うん/そう keep recurring per the
 * invariant-27 frequency directive.
 * ════════════════════════════════════════════════════════════════════════ */

// 11 atoms: [0..5] feed the tail, [6..10] feed the mid-lesson breather grid
// (the m3-neo-4 idiom — chunk lessons lean selection-heavy, the grid breaks
// the wall).
const L8_REVIEW = pickReviewAtoms("ja-m5-neo-8-rev", NEO_PRIOR_POOL, 11);

export const M5_NEO_8: LessonContent = {
  id: "ja-m5-neo-8",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "そう おもう — I think so",
  description:
    "Two chunks you'll hear constantly: そう おもう 'I think so' and そう いう？ 'do you say it like that?' Catch them whole — no dissecting yet.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Situated listening + shadow, chunk by chunk.
    listeningCompSentence({
      id: "ja-m5-neo-8-lc-sou-omou",
      audioText: "そう おもう。",
      question: "You ask Mika if it'll snow. She looks up and says this. Meaning?",
      correctMeaningEn: "I think so.",
      distractorsEn: [
        "That's how you say it.",
        "I know so.",
        "No chance.",
      ],
      exercisedAtomKanas: ["そう", "おもう"],
    }),
    speaking(
      "ja-m5-neo-8-speak-sou-omou",
      "そう おもう",
      "I think so.",
      ["そう", "おもう"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-8-lc-sou-iu",
      audioText: "そう いう？",
      question: "Tom builds a sentence, then checks it with Mika — this. Meaning?",
      correctMeaningEn: "Do you say it like that?",
      distractorsEn: [
        "Do you think so?",
        "What did you say?",
        "Can you hear it?",
      ],
      exercisedAtomKanas: ["そう", "いう"],
    }),
    // ② The chunks answering real questions.
    dialogueListen({
      id: "ja-m5-neo-8-dlg-omou",
      lines: [
        { speaker: "Tom", kana: "あれ、やま？" },
        { speaker: "Ken", kana: "うん、そう おもう。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What is Tom asking about?",
          correctText: "Whether the far-off shape is a mountain",
          distractors: [
            "Whether the mountain is Ken's",
            "Whether Ken can see it",
            "How you say 'mountain'",
          ],
        },
        {
          id: "q2",
          prompt: "How sure is Ken?",
          correctText: "Fairly — he thinks so",
          distractors: [
            "Certain — he knows it",
            "Not at all — he says Tom is wrong",
            "He asks Tom to repeat it",
          ],
        },
      ],
      exercisedAtomKanas: ["あれ", "やま", "うん", "そう", "おもう"],
    }),
    // Situation-match (chunk-function MCQ — single-chunk choices stay
    // MCQ-legal; no "reply/Say:" framing).
    sentenceMcq({
      id: "ja-m5-neo-8-mcq-fit-omou",
      prompt: "Your friend asks: これ、すし？ You think so, but you're not sure. Which fits?",
      correctKana: "そう おもう。",
      distractorsKana: ["そう いう？", "うん、そう いう。", "わかる？"],
      explanation:
        "おもう hedges with your own head; いう is about what people SAY.",
      exercisedAtomKanas: ["そう", "おもう"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-8-lc-un-sou-iu",
      audioText: "うん、そう いう。",
      question: "You ask if people really say it that way — this comes back. Meaning?",
      correctMeaningEn: "Yeah — that's how you say it.",
      distractorsEn: [
        "Yeah — I think so.",
        "No — you don't say that.",
        "Say it one more time.",
      ],
      exercisedAtomKanas: ["うん", "そう", "いう"],
    }),
    speaking(
      "ja-m5-neo-8-speak-sou-iu",
      "そう いう？",
      "Do you say it like that? (voice rises)",
      ["そう", "いう"],
    ),
    dialogueListen({
      id: "ja-m5-neo-8-dlg-iu",
      lines: [
        { speaker: "Mika", kana: "それ、なに？" },
        { speaker: "Tom", kana: "えんぴつ？" },
        { speaker: "Mika", kana: "うん、そう いう。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What's happening here?",
          correctText: "Mika quizzes Tom on a word — he tries えんぴつ",
          distractors: [
            "Tom asks to borrow a pencil",
            "Mika buys a pencil",
            "Tom can't hear Mika",
          ],
        },
        {
          id: "q2",
          prompt: "Was Tom's word right?",
          correctText: "Yes — that's what you say",
          distractors: [
            "No — it was the wrong word",
            "Mika isn't sure",
            "Mika only thinks so",
          ],
        },
      ],
      exercisedAtomKanas: ["それ", "なに", "えんぴつ", "うん", "そう", "いう"],
    }),
    // Mid-lesson breather — review grid between the two selection blocks
    // (step-type variety; the m3-neo-4 chunk-lesson idiom).
    reviewMatchPairs("ja-m5-neo-8-mid", L8_REVIEW.slice(6, 11)),
    sentenceMcq({
      id: "ja-m5-neo-8-mcq-fit-iu",
      prompt: "You're not sure your phrase sounds natural — check with your friend. Which fits?",
      correctKana: "そう いう？",
      distractorsKana: ["そう おもう。", "わかる？", "うん、そうだ。"],
      exercisedAtomKanas: ["そう", "いう"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-8-lc-omou-q",
      audioText: "そう おもう？",
      question: "Telling or asking?",
      correctMeaningEn: "You think so?",
      distractorsEn: [
        "I think so.",
        "Do you say it like that?",
        "That's right.",
      ],
      exercisedAtomKanas: ["そう", "おもう"],
    }),
    build(
      "ja-m5-neo-8-build-sou-omou",
      "Piece together the soft agreement: I think so.",
      "そう おもう",
      ["そう", "おもう", "いう"],
      ["そう", "おもう"],
      ["そう", "おもう"],
    ),
    // CAPSTONE (invariant 26): the おもう chunk produced inside a real m3
    // question-answer flow — うん reply (m3) + にほんの origin frame (m4)
    // set the scene; the chunk itself stays unanalyzed.
    translateStep({
      id: "ja-m5-neo-8-tr-un-omou-capstone",
      promptEn:
        "Ken points at a boat: にほんの ふね？ You think so — agree the casual, soft way.",
      acceptedAnswers: [
        "うん、そう おもう",
        "うんそうおもう",
        "うん、そうおもう",
        "そう おもう",
        "そうおもう",
      ],
      audioText: "うん、そう おもう",
      exercisedAtomKanas: ["うん", "そう", "おもう"],
    }),
    // Review tail — prior atoms (house idiom: vocabMcq → decode-build →
    // LC → vocabMcq → match grid).
    vocabMcq("ja-m5-neo-8-rev-mcq", L8_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildSentence({
      // Sentence-level (2026-07-20): two-mora decode tripped the M5+
      // sentence-first ratchet — converted to a short verb sentence.
      id: "ja-m5-neo-8-rev-lbs-koe",
      target: "こえを きく",
      tiles: ["こえ", "を", "きく", "いう"],
      correctOrder: ["こえ", "を", "きく"],
      promptEn: "Gonna listen for the voice.",
      exercisedAtomKanas: ["こえ", "きく"],
    }),
    listeningCompSentence({
      // Sentence-level (2026-07-20): the pool-word LC tripped the M5+
      // sentence-first ratchet — the pool noun now rides an m5 verb.
      id: "ja-m5-neo-8-rev-lc",
      audioText: "げんき？",
      correctMeaningEn: "Doing okay?",
      distractorsEn: [
        "What is it?",
        "Really?",
        "Nice to meet you.",
      ],
      exercisedAtomKanas: ["げんき"],
    }),
    vocabMcq("ja-m5-neo-8-rev-mcq-2", L8_REVIEW[5], NEO_PRIOR_POOL),
    reviewMatchPairs("ja-m5-neo-8-rev", L8_REVIEW.slice(0, 6)),
  ],
};

assertNoSameAnswerCluster(M5_NEO_8.steps);
assertNoConsecutiveSame(M5_NEO_8.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L9 — "もの — the thing word" (FUNCTION NOUN, guide type 4: compositional
 * card FIRST — the たべ+もの derivation is not inferable from one hearing —
 * then the three everyday compounds in use.)
 * ════════════════════════════════════════════════════════════════════════ */

const L9_REVIEW = pickReviewAtoms("ja-m5-neo-9-rev", NEO_PRIOR_POOL, 6);

export const M5_NEO_9: LessonContent = {
  id: "ja-m5-neo-9",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "もの — the thing word",
  description:
    "One little noun builds three: たべもの, のみもの, かいもの. Hear the verb hiding inside each thing.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① The compositional card first.
    grammarRule({
      id: "ja-m5-neo-9-rule-mono",
      title: "もの — the thing word",
      rule:
        "もの means 'thing', and Japanese builds nouns from verbs with it: たべる 'eat' → たべもの 'food (eat-thing)'; のむ 'drink' → のみもの 'a drink (drink-thing)'; かう 'buy' → かいもの 'shopping (buy-things)'. Hear the verb hiding inside the noun.",
      examples: [
        { ja: "たべものだ。", romaji: "tabemono da.", en: "It's food." },
        { ja: "のみもの？", romaji: "nomimono?", en: "Is it a drink?" },
      ],
      // No antiPattern: たべるもの etc. is real Japanese (a relative clause,
      // not an error), so there is no natural WRONG minimal pair to flag —
      // omitting derives no spot step, which is correct (invariant 12).
      cultureNote:
        "These are everyday words, not textbook compounds — Japanese speakers feel the verb inside たべもの the way you feel 'drink' inside 'a drink'.",
    }),
    listeningCompSentence({
      id: "ja-m5-neo-9-lc-tabemono-q",
      audioText: "たべもの？",
      question: "What does this mean?",
      correctMeaningEn: "Is it food?",
      distractorsEn: ["Is it a drink?", "Gonna eat?", "Is it a thing?"],
      exercisedAtomKanas: ["たべもの"],
    }),
    build(
      "ja-m5-neo-9-build-nomimono",
      "Tell a friend: It's a drink.",
      "のみものだ",
      ["のみもの", "だ", "たべもの"],
      ["のみもの", "だ"],
      ["のみもの"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-9-lc-kaimono",
      audioText: "かいもの？",
      question: "Your friend grabs a bag and asks this at the door. Meaning?",
      correctMeaningEn: "Going shopping?",
      distractorsEn: ["Going home?", "Is it food?", "Gonna buy this one?"],
      exercisedAtomKanas: ["かいもの"],
    }),
    speaking(
      "ja-m5-neo-9-speak-tabemono",
      "たべものだ",
      "It's food.",
      ["たべもの"],
    ),
    cloze(
      "ja-m5-neo-9-cloze-no",
      "だれ",
      " のみもの？",
      "の",
      ["の", "を", "は", "も"],
      "Whose drink is it?",
      "だれの のみもの？",
      "の hangs the owner question on the thing: whose drink.",
    ),
    dialogueListen({
      id: "ja-m5-neo-9-dlg-gyuunyuu",
      lines: [
        { speaker: "Mika", kana: "それは のみもの？" },
        { speaker: "Tom", kana: "うん、のみものだ。ぎゅうにゅうだ。" },
        { speaker: "Mika", kana: "わたしの ぎゅうにゅうだ！" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Mika ask about?",
          correctText: "Whether the thing Tom has is a drink",
          distractors: [
            "Whether Tom is thirsty",
            "Whose bag it is",
            "Whether it's food",
          ],
        },
        {
          id: "q2",
          prompt: "How does the scene end?",
          correctText: "It's milk — and Mika says it's hers",
          distractors: [
            "Tom buys the milk",
            "It turns out to be water",
            "Mika drinks it",
          ],
        },
      ],
      exercisedAtomKanas: ["それ", "のみもの", "ぎゅうにゅう", "わたし", "の"],
    }),
    sentenceMcq({
      id: "ja-m5-neo-9-mcq-kenno-tabemono",
      prompt: "Pick: 'It's Ken's food.'",
      correctKana: "ケンの たべものだ。",
      distractorsKana: [
        "ケンの のみものだ。",
        "ミカの たべものだ。",
        "ケンは たべものだ。",
      ],
      explanation:
        "の clips the owner on. ケンは たべものだ would spotlight Ken — and declare HIM the food.",
      exercisedAtomKanas: ["の", "たべもの"],
    }),
    translateStep({
      id: "ja-m5-neo-9-tr-watashino-nomimono",
      promptEn: "Say to a friend: It's my drink.",
      acceptedAnswers: [
        "わたしの のみものだ",
        "わたしののみものだ",
        "わたしの のみもの",
        "わたしののみもの",
      ],
      audioText: "わたしの のみものだ",
      exercisedAtomKanas: ["わたし", "の", "のみもの"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-9-lc-tabemono-kau",
      audioText: "たべものを かう？",
      question: "What does this sentence mean?",
      correctMeaningEn: "Gonna buy food?",
      distractorsEn: [
        "Gonna eat the food?",
        "Gonna buy a drink?",
        "Going shopping?",
      ],
      exercisedAtomKanas: ["たべもの", "を", "かう"],
    }),
    build(
      "ja-m5-neo-9-build-tabemono-kau",
      "Tell a friend: I'll buy food.",
      "たべものを かう",
      ["たべもの", "を", "かう", "のみもの"],
      ["たべもの", "を", "かう"],
      ["たべもの", "を", "かう"],
    ),
    speaking(
      "ja-m5-neo-9-speak-dareno",
      "だれの のみもの？",
      "Whose drink is it? (voice rises)",
      ["だれ", "の", "のみもの"],
    ),
    // CAPSTONE (invariant 26): the new compound inside a full m4-shaped
    // sentence — これ (m4) + も (m3) + の possession (m4) around たべもの.
    build(
      "ja-m5-neo-9-build-koremo-capstone",
      "More snacks surface in the bag. Tell Ken: This one is Mika's food too.",
      "これも ミカの たべものだ",
      ["これ", "も", "ミカ", "の", "たべもの", "だ", "のみもの"],
      ["これ", "も", "ミカ", "の", "たべもの", "だ"],
      ["これ", "も", "の", "たべもの"],
    ),
    // Review tail — prior atoms (house idiom: vocabMcq → decode-build →
    // LC → vocabMcq → match grid).
    vocabMcq("ja-m5-neo-9-rev-mcq", L9_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildSentence({
      // Sentence-level (2026-07-20): two-mora decode tripped the M5+
      // sentence-first ratchet — converted to a short verb sentence.
      id: "ja-m5-neo-9-rev-lbs-kao",
      target: "かおを みる",
      tiles: ["かお", "を", "みる", "たべる"],
      correctOrder: ["かお", "を", "みる"],
      promptEn: "Gonna look at their face.",
      exercisedAtomKanas: ["かお", "みる"],
    }),
    listeningCompSentence({
      // Sentence-level (2026-07-20): the pool-word LC tripped the M5+
      // sentence-first ratchet — the pool noun now rides an m5 verb.
      id: "ja-m5-neo-9-rev-lc",
      audioText: "かばんを かう？",
      correctMeaningEn: "Gonna buy the bag?",
      distractorsEn: [
        "Gonna buy the umbrella?",
        "Gonna look at the bag?",
        "Gonna lose the bag?",
      ],
      exercisedAtomKanas: ["かばん", "かう"],
    }),
    vocabMcq("ja-m5-neo-9-rev-mcq-2", L9_REVIEW[5], NEO_PRIOR_POOL),
    reviewMatchPairs("ja-m5-neo-9-rev", L9_REVIEW),
  ],
};

assertNoSameAnswerCluster(M5_NEO_9.steps);
assertAnswerRotation(M5_NEO_9.steps, 1); // single の cloze — compound-noun lesson
assertNoConsecutiveSame(M5_NEO_9.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L10 — "Food & object wave + verb drills" (vocab-lesson variation: no new
 * grammar). ごはん takes the primary-carrier seat (invariant 27 — it sat at
 * ×3 exposures) and every taught verb gets a recombination. いく/くる ride
 * a dialogue so the viewpoint flip (くる？ → いく！) is heard, not told.
 * ════════════════════════════════════════════════════════════════════════ */

const L10_REVIEW = pickReviewAtoms("ja-m5-neo-10-rev", NEO_PRIOR_POOL, 6);

export const M5_NEO_10: LessonContent = {
  id: "ja-m5-neo-10",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "ごはん and all your verbs",
  description:
    "ごはん takes center table while every verb you own gets a workout — eat, drink, watch, do, buy.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① ごはん re-encounter via image MCQ (vocab-lesson idiom), straight
    // into verb frames.
    vocabMcq(
      "ja-m5-neo-10-vmcq-gohan",
      { kana: "ごはん", meaningEn: "rice/meal", emoji: "🍚", fromModule: "m2" },
      NEO_PRIOR_POOL,
    ),
    listeningCompSentence({
      id: "ja-m5-neo-10-lc-gohan-taberu",
      audioText: "ごはんを たべる？",
      question: "What does this sentence mean?",
      correctMeaningEn: "Gonna eat (the meal)?",
      distractorsEn: [
        "Gonna buy the meal?",
        "What'll you eat?",
        "Did you already eat?",
      ],
      exercisedAtomKanas: ["ごはん", "を", "たべる"],
    }),
    build(
      "ja-m5-neo-10-build-gohan-taberu",
      "Tell a friend: I'll eat the rice.",
      "ごはんを たべる",
      ["ごはん", "を", "たべる", "のむ"],
      ["ごはん", "を", "たべる"],
      ["ごはん", "を", "たべる"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-10-lc-nani-nomu",
      audioText: "なにを のむ？",
      question: "What does this sentence mean?",
      correctMeaningEn: "What'll you drink?",
      distractorsEn: [
        "What'll you eat?",
        "Whose drink is it?",
        "Gonna drink this?",
      ],
      exercisedAtomKanas: ["なに", "を", "のむ"],
    }),
    build(
      "ja-m5-neo-10-build-gyuunyuu-nomu",
      "Tell a friend: I'll drink milk.",
      "ぎゅうにゅうを のむ",
      ["ぎゅうにゅう", "を", "のむ", "たべる"],
      ["ぎゅうにゅう", "を", "のむ"],
      ["ぎゅうにゅう", "を", "のむ"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-10-lc-shashin-miru",
      audioText: "しゃしんを みる？",
      question: "What does this sentence mean?",
      correctMeaningEn: "Gonna look at the photos?",
      distractorsEn: [
        "Gonna take a photo?",
        "Gonna look at the car?",
        "Whose photo is it?",
      ],
      exercisedAtomKanas: ["しゃしん", "を", "みる"],
    }),
    speaking(
      "ja-m5-neo-10-speak-shashin-miru",
      "しゃしんを みる",
      "I'll look at the photos.",
      ["しゃしん", "を", "みる"],
    ),
    // ② いく/くる — the viewpoint flip, heard in the wild.
    dialogueListen({
      id: "ja-m5-neo-10-dlg-iku-kuru",
      lines: [
        { speaker: "Ken", kana: "いく。" },
        { speaker: "Mika", kana: "かいもの？" },
        { speaker: "Ken", kana: "うん。ミカも くる？" },
        { speaker: "Mika", kana: "うん！わたしも いく！" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What is Ken heading out to do?",
          correctText: "Shopping",
          distractors: [
            "To eat a meal",
            "To look at photos",
            "Nothing — he's staying in",
          ],
        },
        {
          id: "q2",
          prompt: "What does Mika answer?",
          correctText: "Yes — she's going too",
          distractors: [
            "She's staying home",
            "She doesn't know yet",
            "She already went",
          ],
          explanation:
            "Ken asks くる？ ('coming?') from HIS side of the trip; Mika answers いく ('I'll go') from HERS. Japanese picks the verb from the speaker's viewpoint.",
        },
      ],
      exercisedAtomKanas: ["いく", "かいもの", "うん", "も", "くる", "わたし"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-10-lc-nani-suru",
      audioText: "なにを する？",
      question: "What does this sentence mean?",
      correctMeaningEn: "What are you gonna do?",
      distractorsEn: [
        "What'll you drink?",
        "Who'll do it?",
        "What is that?",
      ],
      exercisedAtomKanas: ["なに", "を", "する"],
    }),
    build(
      "ja-m5-neo-10-build-sore-yaru",
      "Chores are being split. Claim that one, casual: I'll do that one.",
      "それを やる",
      ["それ", "を", "やる", "これ"],
      ["それ", "を", "やる"],
      ["それ", "を", "やる"],
    ),
    cloze(
      "ja-m5-neo-10-cloze-wo",
      "ごはん",
      " たべる。",
      "を",
      ["を", "は", "も", "の"],
      "I'll eat the rice.",
      "ごはんを たべる。",
      "を marks what gets eaten; the verb closes the sentence.",
    ),
    sentenceMcq({
      id: "ja-m5-neo-10-mcq-nani-nomu",
      prompt: "Pick: 'What'll you drink?'",
      correctKana: "なにを のむ？",
      distractorsKana: [
        "なにを たべる？",
        "なにを する？",
        "だれの のみもの？",
      ],
      exercisedAtomKanas: ["なに", "を", "のむ"],
    }),
    speaking(
      "ja-m5-neo-10-speak-sore-kau",
      "それを かう？",
      "Gonna buy that one? (voice rises)",
      ["それ", "を", "かう"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-10-lc-koremo-kiku",
      audioText: "これも きく？",
      question: "What does this sentence mean?",
      correctMeaningEn: "Gonna listen to this one too?",
      distractorsEn: [
        "Gonna listen to that one over there?",
        "Gonna buy this one too?",
        "Do you get this one?",
      ],
      exercisedAtomKanas: ["これ", "も", "きく"],
    }),
    // CAPSTONE (invariant 26): の possession (m4) + the m3 rising question
    // around an を-verb — produced from scratch.
    translateStep({
      id: "ja-m5-neo-10-tr-jitensha-capstone",
      promptEn: "Ask your friend, surprised: You're gonna buy Mika's bike?",
      acceptedAnswers: [
        "ミカの じてんしゃを かう？",
        "ミカのじてんしゃをかう？",
        "ミカの じてんしゃを かう",
        "ミカのじてんしゃをかう",
        "かう？",
      ],
      audioText: "ミカの じてんしゃを かう？",
      exercisedAtomKanas: ["の", "じてんしゃ", "を", "かう"],
    }),
    // Review tail — prior atoms (house idiom: vocabMcq → decode-build →
    // LC → vocabMcq → match grid).
    vocabMcq("ja-m5-neo-10-rev-mcq", L10_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildWord(
      "ja-m5-neo-10-rev-lb-jikan",
      "じかん",
      "time",
      ["じ", "か", "ん"],
      ["し", "が", "そ"],
    ),
    listeningCompSentence({
      // Sentence-level (2026-07-20): the pool-word LC tripped the M5+
      // sentence-first ratchet — the pool noun now rides an m5 verb.
      id: "ja-m5-neo-10-rev-lc",
      audioText: "せんせいの ほんだ。",
      correctMeaningEn: "It's the teacher's book.",
      distractorsEn: [
        "It's the student's book.",
        "It's the teacher's bag.",
        "It's my book.",
      ],
      exercisedAtomKanas: ["せんせい", "ほん", "の"],
    }),
    vocabMcq("ja-m5-neo-10-rev-mcq-2", L10_REVIEW[5], NEO_PRIOR_POOL),
    reviewMatchPairs("ja-m5-neo-10-rev", L10_REVIEW),
  ],
};

assertNoSameAnswerCluster(M5_NEO_10.steps);
assertAnswerRotation(M5_NEO_10.steps, 1); // single を cloze — drill lesson
assertNoConsecutiveSame(M5_NEO_10.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L11 — "Story: dinner plans" (integration dialogue, m3-neo L6 shape)
 * ごはんを たべる？ / なにを のむ？ around one table; chunk callbacks
 * (ごめんなさい/だいじょうぶ per invariant 27); Tanaka speaks flagged です
 * preview lines (the Irodori register device, same as m4-neo L11). Story
 * lessons integrate — no grammar_rule steps.
 * ════════════════════════════════════════════════════════════════════════ */

const L11_REVIEW = pickReviewAtoms("ja-m5-neo-11-rev", NEO_PRIOR_POOL, 6);

export const M5_NEO_11: LessonContent = {
  id: "ja-m5-neo-11",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Story: dinner plans",
  description:
    "Rice, water, one grabbed bowl, and a very polite teacher — everything this module taught, around one table.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // Scene 1 — the plan.
    dialogueListen({
      id: "ja-m5-neo-11-dlg-scene1",
      lines: [
        { speaker: "Mika", kana: "ごはんを たべる？" },
        { speaker: "Tom", kana: "うん、たべる！" },
        { speaker: "Mika", kana: "ケンも くる？" },
        { speaker: "Ken", kana: "うん、いく！" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What's the plan?",
          correctText: "A meal together",
          distractors: [
            "Shopping",
            "Looking at photos",
            "Nothing — Tom said no",
          ],
        },
        {
          id: "q2",
          prompt: "Is Ken in?",
          correctText: "Yes — he'll come along",
          distractors: [
            "No — he's off elsewhere",
            "He doesn't answer",
            "He already ate",
          ],
        },
      ],
      exercisedAtomKanas: ["ごはん", "を", "たべる", "うん", "も", "くる", "いく"],
    }),
    translateStep({
      id: "ja-m5-neo-11-tr-un-taberu",
      promptEn: "Mika asks ごはんを たべる？ — you're in. Answer casually: Yeah, I'll eat.",
      acceptedAnswers: ["うん、たべる", "うんたべる", "たべる"],
      audioText: "うん、たべる",
      exercisedAtomKanas: ["うん", "たべる"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-11-lc-nani-taberu",
      audioText: "なにを たべる？",
      question: "What does this sentence mean?",
      correctMeaningEn: "What'll you eat?",
      distractorsEn: [
        "What'll you drink?",
        "Gonna eat?",
        "Who's eating?",
      ],
      exercisedAtomKanas: ["なに", "を", "たべる"],
    }),
    build(
      "ja-m5-neo-11-build-sushi",
      "Tell a friend: I'll eat sushi.",
      "すしを たべる",
      ["すし", "を", "たべる", "ごはん"],
      ["すし", "を", "たべる"],
      ["すし", "を", "たべる"],
    ),
    // Scene 2 — drinks; も rides along.
    dialogueListen({
      id: "ja-m5-neo-11-dlg-scene2",
      lines: [
        { speaker: "Tom", kana: "なにを のむ？" },
        { speaker: "Mika", kana: "みずを のむ。" },
        { speaker: "Tom", kana: "わたしも。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Tom ask Mika?",
          correctText: "What she'll drink",
          distractors: [
            "What she'll eat",
            "Whether she's coming",
            "Whose water it is",
          ],
        },
        {
          id: "q2",
          prompt: "What does Tom decide?",
          correctText: "Same as Mika — water for him too",
          distractors: [
            "He'll drink milk",
            "He's not thirsty",
            "He'll just eat",
          ],
        },
      ],
      exercisedAtomKanas: ["なに", "を", "のむ", "みず", "わたし", "も"],
    }),
    speaking(
      "ja-m5-neo-11-speak-nani-nomu",
      "なにを のむ？",
      "What'll you drink? (voice rises)",
      ["なに", "を", "のむ"],
    ),
    // Scene 3 — the wrong bowl: TWO flagged です lines from Tanaka.
    dialogueListen({
      id: "ja-m5-neo-11-dlg-scene3",
      lines: [
        { speaker: "Ken", kana: "これも ごはん？" },
        { speaker: "Tanaka", kana: "それは わたしの ごはんです。" },
        { speaker: "Ken", kana: "ごめんなさい！" },
        { speaker: "Tanaka", kana: "だいじょうぶです。" },
        { speaker: "Mika", kana: "たなかの ごはんだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Tanaka says ごはんです — not ごはんだ. What is です doing?",
          correctText:
            "It's the polite coat — same meaning as だ, dressed up for teacher-talk",
          distractors: [
            "It makes the sentence a question",
            "It marks the meal as past",
            "It means 'delicious'",
          ],
          explanation:
            "Teachers and staff wrap sentences in です. Just recognize it — your own sentences stay plain for now.",
        },
        {
          id: "q2",
          prompt: "Whose meal did Ken almost grab?",
          correctText: "Tanaka's",
          distractors: ["Mika's", "Tom's", "His own"],
        },
      ],
      exercisedAtomKanas: ["これ", "も", "ごはん", "の", "ごめんなさい", "だいじょうぶ"],
    }),
    // Chunk callback right after the scene modeled it (invariant 27:
    // ごめんなさい/だいじょうぶ recur in stories).
    sentenceMcq({
      id: "ja-m5-neo-11-mcq-gomen",
      prompt: "Reaching across, you knock over Ken's cup. What do you say first?",
      correctKana: "ごめんなさい",
      distractorsKana: ["だいじょうぶ", "ありがとう", "うん"],
      exercisedAtomKanas: ["ごめんなさい"],
    }),
    // です second exposure — flagged recognition.
    listeningCompSentence({
      id: "ja-m5-neo-11-lc-desu-preview",
      audioText: "たなかの のみものです。",
      correctMeaningEn: "It's Tanaka's drink.",
      distractorsEn: [
        "It's Tanaka's meal.",
        "Is it Tanaka's drink?",
        "It's my drink.",
      ],
      explanation:
        "The polite です again — same meaning as たなかの のみものだ, wrapped for teacher-talk. Recognition only; your sentences stay plain.",
      exercisedAtomKanas: ["の", "のみもの"],
    }),
    build(
      "ja-m5-neo-11-build-kenmo-taberu",
      "Tell Mika: Ken's gonna eat too.",
      "ケンも たべる",
      ["ケン", "も", "たべる", "たなか"],
      ["ケン", "も", "たべる"],
      ["も", "たべる"],
    ),
    cloze(
      "ja-m5-neo-11-cloze-wo",
      "なに",
      " のむ？",
      "を",
      ["を", "の", "は", "も"],
      "What'll you drink?",
      "なにを のむ？",
      "を marks what gets drunk — even when it's still a question word.",
    ),
    speaking(
      "ja-m5-neo-11-speak-gohan-taberu",
      "ごはんを たべる？",
      "Gonna eat? (voice rises)",
      ["ごはん", "を", "たべる"],
    ),
    // CAPSTONE (invariant 26): heard whole, assembled whole — の possession
    // (m4) + も (m3) around the module's verb-final shape. The running gag
    // closes: someone still wants Ken's rice.
    listeningBuildSentence({
      id: "ja-m5-neo-11-lbs-kenno-capstone",
      target: "ケンの ごはんも たべる",
      tiles: ["ケン", "の", "ごはん", "も", "たべる", "のむ"],
      correctOrder: ["ケン", "の", "ごはん", "も", "たべる"],
      promptEn: "I'll eat Ken's rice too.",
      exercisedAtomKanas: ["の", "ごはん", "も", "たべる"],
    }),
    // Review tail — prior atoms (house idiom: vocabMcq → decode-build →
    // LC → vocabMcq → match grid).
    vocabMcq("ja-m5-neo-11-rev-mcq", L11_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildWord(
      "ja-m5-neo-11-rev-lb-asobu",
      "あそぶ",
      "play",
      ["あ", "そ", "ぶ"],
      ["お", "ぞ", "ふ"],
    ),
    listeningCompSentence({
      id: "ja-m5-neo-11-rev-lc",
      audioText: L11_REVIEW[1].kana,
      question: "What did you hear?",
      correctMeaningEn: L11_REVIEW[1].meaningEn,
      distractorsEn: [
        L11_REVIEW[2].meaningEn,
        L11_REVIEW[3].meaningEn,
        L11_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L11_REVIEW[1].kana],
    }),
    vocabMcq("ja-m5-neo-11-rev-mcq-2", L11_REVIEW[5], NEO_PRIOR_POOL),
    reviewMatchPairs("ja-m5-neo-11-rev", L11_REVIEW),
  ],
};

assertNoSameAnswerCluster(M5_NEO_11.steps);
assertAnswerRotation(M5_NEO_11.steps, 1); // single を cloze — story lesson
assertNoConsecutiveSame(M5_NEO_11.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L12 — mixed review (ja-m5-neo-review)
 * ALL-NEW sentences (no m5 lesson's audioText verbatim — the fresh-sentence
 * discipline): every surface recombines m5 verbs + を with m1-m3 CARRIER
 * nouns neither half ran in sentences (そら/ほし/うみ/かわ/めがね/でんわ/
 * ゆき/もも). ≥60% sentence-context; every concept + the chunk callbacks
 * (そう おもう, だいじょうぶ); closes on the match grid. NO capstone —
 * review lessons are exempt from invariant 26 by design.
 * ════════════════════════════════════════════════════════════════════════ */

const L12_REVIEW = pickReviewAtoms("ja-m5-neo-review-rev", NEO_PRIOR_POOL, 6);

export const M5_NEO_REVIEW: LessonContent = {
  id: "ja-m5-neo-review",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Verbs I — review",
  description:
    "Every verb, を, and the casual question — recombined over skies, seas, and peaches you haven't tried them on yet.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    listeningCompSentence({
      id: "ja-m5-neo-rev-lc-sora",
      audioText: "そらを みる？",
      question: "What does this sentence mean?",
      correctMeaningEn: "Gonna look at the sky?",
      distractorsEn: [
        "Gonna look at the stars?",
        "Gonna look at the sea?",
        "Is it the sky?",
      ],
      exercisedAtomKanas: ["そら", "を", "みる"],
    }),
    build(
      "ja-m5-neo-rev-build-yuki",
      "Tell a friend: I'll watch the snow.",
      "ゆきを みる",
      ["ゆき", "を", "みる", "のむ"],
      ["ゆき", "を", "みる"],
      ["ゆき", "を", "みる"],
    ),
    listeningCompSentence({
      // Was ももも たべる？ — the triple-も run renders its word-grouped
      // romaji glued ("momomo", continuity judge 2026-07-20); the を form
      // keeps the peach retrieval with an unambiguous helper line.
      id: "ja-m5-neo-rev-lc-momo",
      audioText: "ももを たべる？",
      correctMeaningEn: "Gonna eat the peach?",
      distractorsEn: [
        "Gonna buy the peach?",
        "Gonna eat the bread?",
        "Is it a peach?",
      ],
      exercisedAtomKanas: ["もも", "たべる"],
    }),
    build(
      "ja-m5-neo-rev-build-megane",
      "Tell a friend: I'll buy glasses.",
      "めがねを かう",
      ["めがね", "を", "かう", "みる"],
      ["めがね", "を", "かう"],
      ["めがね", "を", "かう"],
    ),
    speaking(
      "ja-m5-neo-rev-speak-denwa",
      "でんわを かう？",
      "Gonna buy a phone? (voice rises)",
      ["でんわ", "を", "かう"],
    ),
    cloze(
      "ja-m5-neo-rev-cloze-wo",
      "ほし",
      " みる。",
      "を",
      ["を", "は", "の", "も"],
      "I'll look at the stars.",
      "ほしを みる。",
      "を marks what your eyes land on; みる closes the sentence.",
    ),
    sentenceMcq({
      id: "ja-m5-neo-rev-mcq-umi",
      prompt: "Pick: 'I'll listen to the sea.'",
      correctKana: "うみを きく。",
      distractorsKana: ["うみを みる。", "うみを のむ。", "うみは きく。"],
      explanation:
        "きく takes the sound in — うみを きく is listening to the waves. みる would be watching them.",
      exercisedAtomKanas: ["うみ", "を", "きく"],
    }),
    // Chunk callback in the wild — そう おもう rides a fresh star-gazing
    // scene.
    dialogueListen({
      id: "ja-m5-neo-rev-dlg-hoshi",
      lines: [
        { speaker: "Tom", kana: "あれ、ほし？" },
        { speaker: "Ken", kana: "うん、そう おもう。" },
        { speaker: "Mika", kana: "みる？" },
        { speaker: "Tom", kana: "うん、みる！" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What are they looking at?",
          correctText: "A far-off light — Ken thinks it's a star",
          distractors: ["The moon", "Ken's phone", "A photo"],
        },
        {
          id: "q2",
          prompt: "What do they decide?",
          correctText: "To watch it",
          distractors: [
            "To go home",
            "To buy a camera",
            "Ken says it isn't one",
          ],
        },
      ],
      exercisedAtomKanas: ["あれ", "ほし", "うん", "そう", "おもう", "みる"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-rev-lc-kawa",
      audioText: "かわの みずを のむ？",
      question: "What does this sentence mean?",
      correctMeaningEn: "You're gonna drink river water?",
      distractorsEn: [
        "You're gonna look at the river?",
        "Is the river water?",
        "Gonna buy water?",
      ],
      exercisedAtomKanas: ["かわ", "の", "みず", "を", "のむ"],
    }),
    build(
      "ja-m5-neo-rev-build-shashin",
      "Tell a friend: I'll look at the river photos.",
      "かわの しゃしんを みる",
      ["かわ", "の", "しゃしん", "を", "みる", "つき"],
      ["かわ", "の", "しゃしん", "を", "みる"],
      ["かわ", "の", "しゃしん", "を", "みる"],
    ),
    translateStep({
      id: "ja-m5-neo-rev-tr-denwa",
      promptEn: "Say to a friend: I'll buy a phone.",
      acceptedAnswers: ["でんわを かう", "でんわをかう", "かう"],
      audioText: "でんわを かう",
      exercisedAtomKanas: ["でんわ", "を", "かう"],
    }),
    listeningCompSentence({
      id: "ja-m5-neo-rev-lc-koremo",
      audioText: "これも たべもの？",
      question: "What does this sentence mean?",
      correctMeaningEn: "Is this one food too?",
      distractorsEn: [
        "Is this one a drink too?",
        "Is that one food?",
        "Is this Mika's food?",
      ],
      exercisedAtomKanas: ["これ", "も", "たべもの"],
    }),
    listeningBuildSentence({
      id: "ja-m5-neo-rev-lbs-umi",
      target: "うみを きく",
      tiles: ["うみ", "を", "きく", "みる"],
      correctOrder: ["うみ", "を", "きく"],
      promptEn: "I'll listen to the sea.",
      exercisedAtomKanas: ["うみ", "を", "きく"],
    }),
    sentenceMcq({
      id: "ja-m5-neo-rev-mcq-daijoubu",
      prompt:
        "A stranger's umbrella clatters onto your foot and she gasps an apology. You're fine — you say:",
      correctKana: "だいじょうぶ",
      distractorsKana: ["ありがとう", "うん", "はじめまして"],
      exercisedAtomKanas: ["だいじょうぶ"],
    }),
    speaking(
      "ja-m5-neo-rev-speak-wakaru",
      "わかる？",
      "Get it? (voice rises)",
      ["わかる"],
    ),
    cloze(
      "ja-m5-neo-rev-cloze-no",
      "だれ",
      " でんわ？",
      "の",
      ["の", "を", "は", "も"],
      "Whose phone is it?",
      "だれの でんわ？",
      "の hangs the owner question on the thing: whose phone.",
    ),
    // Review tail (house idiom: vocabMcq → decode-build → vocabMcq →
    // match grid; the pool-word LC beat is skipped here on purpose — a
    // seeded draw could coincide with an earlier tail's draw and trip the
    // fresh-sentence check).
    vocabMcq("ja-m5-neo-rev-mcq-vocab", L12_REVIEW[0], NEO_PRIOR_POOL),
    listeningBuildWord(
      "ja-m5-neo-rev-lb-sanpo",
      "さんぽ",
      "walk/stroll",
      ["さ", "ん", "ぽ"],
      ["ざ", "ぼ", "ぷ"],
    ),
    vocabMcq("ja-m5-neo-rev-mcq-vocab-2", L12_REVIEW[3], NEO_PRIOR_POOL),
    reviewMatchPairs("ja-m5-neo-review", L12_REVIEW),
  ],
};

assertNoSameAnswerCluster(M5_NEO_REVIEW.steps);
assertAnswerRotation(M5_NEO_REVIEW.steps, 2); // rotates を / の
assertNoConsecutiveSame(M5_NEO_REVIEW.steps);

/** Lessons 7-12 (second half of m5-neo), deep-link order. */
export const M5_NEO_B_LESSONS: LessonContent[] = [
  M5_NEO_7,
  M5_NEO_8,
  M5_NEO_9,
  M5_NEO_10,
  M5_NEO_11,
  M5_NEO_REVIEW,
];
