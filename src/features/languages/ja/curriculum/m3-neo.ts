/**
 * M3-NEO — PILOT MODULE of the dict-form-first course rewrite
 * (spine tile s03, docs spine draft-3 2026-07-19).
 *
 * "Plain sentences — だ, は, も": the plain copula sentence as the atom,
 * taught teach-by-showing (Irodori noticing order: hear it FIRST, then the
 * rule as the answer to what was noticed). Register-explicit ruling: every
 * production prompt names its audience — at m3 that is always casual /
 * "to a friend". です appears ONLY as flagged recognition previews
 * (invariant 7 [polite-everywhere] is REPEALED for this module — plain
 * form IS the register).
 *
 * Deep-link-only pilot lessons: registered in mockLessons.ts's explicit
 * map, NOT in mockCourse.ts. moduleId stays "m3" so the romaji ladder is
 * correct (romaji SHOWS at m3; no kanji — below the m8 floor).
 *
 * Constraints honored (concept-type-authoring-guide-2026-07-19 + pinned
 * invariants 10/11/12/15/17/18; invariant 4 in force — chunks taught via
 * listening/MCQ/match/speaking, never phrase_card):
 *  - L1 SENTENCE-PATTERN template: listening exposure → grammar_rule
 *    (invariant-12 minimal pair) → builds → MCQs → translate/speaking →
 *    だ-drop note (acceptedAnswers include both ねこだ and ねこ) → ONE
 *    flagged です recognition preview.
 *  - L2 DISCOURSE-PARTICLE template (1b): は in MULTI-SENTENCE context
 *    only, spotlight framing, NEVER glossed "as for".
 *  - L3 PARTICLE substitution: は↔も choice-under-contrast drills (2-line
 *    context forces the answer), never transformation.
 *  - L4 PATTERN + PROSODY: statement vs question by intonation (。/？ TTS
 *    contour pairs, both strings authored); うん/そう RECOGNITION only.
 *  - L5 CHUNK template (type 5): ZERO grammar_rule steps, function
 *    glosses, situation-matching, one register-noticing MCQ.
 *  - L6 integration story; one older character speaks TWO flagged です
 *    lines (Irodori register-preview device).
 *  - L7 mixed review: all-new sentences, ≥60% sentence-context.
 *
 * New course atoms (courseAtoms.ts): うん / そう (blocked, recognition
 * only) + はじめまして (phrase). Everything else reuses existing atoms.
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
  selfExplain,
  sentenceMcq,
  speaking,
  translateStep,
  vocabMcq,
  withoutMcqBlocked,
} from "@/features/languages/ja/grammarHelpers";
import type { MatchPairsStep } from "@/features/lesson/types";

const COURSE = "mock-1";
const LANG = "ja";

// Review pools: M1 + M2 only — the learner arriving at m3-neo owns kana +
// the concrete-noun anchors, nothing else.
const NEO_M1_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1"),
);
const NEO_M2_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2"),
);
const NEO_M1_M2_POOL = [...NEO_M1_POOL, ...NEO_M2_POOL];

/* ════════════════════════════════════════════════════════════════════════
 * L1 — "It's a cat — だ" (SENTENCE-PATTERN template)
 * Teach-by-showing: listening FIRST, rule as the answer to the noticing.
 * ════════════════════════════════════════════════════════════════════════ */

const L1_REVIEW = pickReviewAtoms("ja-m3-neo-1-rev", NEO_M1_POOL, 6);

export const M3_NEO_1: LessonContent = {
  id: "ja-m3-neo-1",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "It's a cat — だ",
  description:
    "Your first real sentences: noun + だ. Hear it, notice it, then say it — casually, the way friends talk.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Noticing exposure — hear ~だ sentences BEFORE any rule.
    listeningCompSentence({
      id: "ja-m3-neo-1-lc-neko",
      audioText: "ねこだ。",
      question: "A friend points at something and says this. What do they mean?",
      correctMeaningEn: "It's a cat.",
      distractorsEn: ["It's a dog.", "It's water.", "It's a book."],
      exercisedAtomKanas: ["ねこ"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-1-lc-mizu",
      audioText: "みずだ。",
      question: "Your friend peers into a glass and says this. What do they mean?",
      correctMeaningEn: "It's water.",
      distractorsEn: ["It's a cat.", "It's the sea.", "It's a key."],
      exercisedAtomKanas: ["みず"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-1-lc-hon",
      audioText: "ほんだ。",
      question: "Your friend opens a package and says this. What's inside?",
      correctMeaningEn: "A book — 'it's a book.'",
      distractorsEn: [
        "A pencil — 'it's a pencil.'",
        "A photo — 'it's a photo.'",
        "A hat — 'it's a hat.'",
      ],
      exercisedAtomKanas: ["ほん"],
    }),
    // ② The rule — the answer to what they just noticed.
    grammarRule({
      id: "ja-m3-neo-1-rule-da",
      title: "だ — 'it's X', plain and simple",
      rule:
        "You just heard it three times: noun + だ = 'it's X / X is the case.' だ closes a plain statement — the everyday register friends use with each other. One noun, one だ: a whole sentence.",
      examples: [
        { ja: "ねこだ。", romaji: "neko da.", en: "It's a cat." },
        { ja: "みずだ。", romaji: "mizu da.", en: "It's water." },
      ],
      antiPattern: {
        ja: "ねこ？",
        romaji: "neko?",
        en: "(Is it a cat?)",
        why:
          "Same word, opposite job: falling だ states, a rising tone asks. ねこだ。 tells your friend it's a cat; ねこ？ asks them. The asking pattern gets its own lesson soon.",
      },
    }),
    // ③ Builds — tiles keep だ separate so the pattern is assembled, not read.
    build(
      "ja-m3-neo-1-build-neko",
      "Say to a friend: It's a cat.",
      "ねこだ",
      ["だ", "ねこ", "いぬ"],
      ["ねこ", "だ"],
      ["ねこ"],
    ),
    build(
      "ja-m3-neo-1-build-inu",
      "Say to a friend: It's a dog.",
      "いぬだ",
      ["ねこ", "いぬ", "だ", "みず"],
      ["いぬ", "だ"],
      ["いぬ"],
    ),
    // ④ Meaning MCQs.
    sentenceMcq({
      id: "ja-m3-neo-1-mcq-hon",
      prompt: "A friend asks what's in the box. Pick 'It's a book.'",
      correctKana: "ほんだ。",
      distractorsKana: ["みずだ。", "ねこだ。", "いぬだ。"],
      exercisedAtomKanas: ["ほん"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-1-lc-umi",
      audioText: "うみだ。",
      question: "You crest a hill and your friend shouts this. What do they see?",
      correctMeaningEn: "The sea — 'it's the sea!'",
      distractorsEn: [
        "The sky — 'it's the sky!'",
        "A mountain — 'it's a mountain!'",
        "A river — 'it's a river!'",
      ],
      exercisedAtomKanas: ["うみ"],
    }),
    build(
      "ja-m3-neo-1-build-mizu",
      "Say to a friend: It's water.",
      "みずだ",
      ["みず", "ほん", "だ"],
      ["みず", "だ"],
      ["みず"],
    ),
    speaking("ja-m3-neo-1-speak-neko", "ねこだ", "It's a cat.", ["ねこ"]),
    // ⑥ だ-drop note — casual speech often drops だ entirely.
    grammarRule({
      id: "ja-m3-neo-1-rule-da-drop",
      title: "Dropping だ — even more casual",
      rule:
        "Friends often drop だ altogether: point and say ねこ。 — done. Both ねこだ and plain ねこ are natural casual statements; だ just makes it a touch more emphatic. Answers with or without だ count everywhere in this course.",
      examples: [
        { ja: "そらだ。", romaji: "sora da.", en: "It's the sky. (with だ)" },
        { ja: "そら。", romaji: "sora.", en: "The sky. (だ dropped — very common)" },
      ],
      antiPattern: {
        ja: "そらです。",
        romaji: "sora desu.",
        en: "(It's the sky — polite)",
        why:
          "です isn't wrong Japanese — it's the wrong distance. With a close friend the plain そらだ / そら is the natural register; です is the polite layer, coming later.",
      },
    }),
    // ⑤ Production: translate + speaking (だ-dropped answers accepted).
    translateStep({
      id: "ja-m3-neo-1-tr-neko",
      promptEn: "Say to a friend: It's a cat.",
      acceptedAnswers: ["ねこだ", "ねこ", "ねこだ。", "ねこ。"],
      audioText: "ねこだ",
      exercisedAtomKanas: ["ねこ"],
    }),
    translateStep({
      id: "ja-m3-neo-1-tr-mizu",
      promptEn: "Say to a friend: It's water.",
      acceptedAnswers: ["みずだ", "みず", "みずだ。", "みず。"],
      audioText: "みずだ",
      exercisedAtomKanas: ["みず"],
    }),
    speaking("ja-m3-neo-1-speak-mizu", "みずだ", "It's water.", ["みず"]),
    // だ-drop recognition.
    listeningCompSentence({
      id: "ja-m3-neo-1-lc-neko-drop",
      audioText: "ねこ。",
      question:
        "Your friend points and says just one word, tone falling. What do they mean?",
      correctMeaningEn: "It's a cat.",
      distractorsEn: ["It's a dog.", "It's a flower.", "It's a peach."],
      exercisedAtomKanas: ["ねこ"],
    }),
    // ⑦ ONE です recognition preview — explicitly flagged, recognition only.
    listeningCompSentence({
      id: "ja-m3-neo-1-lc-desu-preview",
      audioText: "ねこです。",
      question:
        "Preview (recognition only): a hotel clerk says this politely. Same meaning, different politeness — which did you hear?",
      correctMeaningEn: "ねこです — the polite version of 'it's a cat'",
      distractorsEn: [
        "ねこだ — the casual version of 'it's a cat'",
        "ねこ？ — asking 'is it a cat?'",
        "ねこ。 — casual, だ dropped",
      ],
      exercisedAtomKanas: ["ねこ"],
    }),
    build(
      "ja-m3-neo-1-build-umi",
      "Say to a friend: It's the sea.",
      "うみだ",
      ["うみ", "そら", "だ"],
      ["うみ", "だ"],
      ["うみ"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-1-lc-sora",
      audioText: "そらだ。",
      question: "Your friend looks up from a photo and says this. What is it?",
      correctMeaningEn: "The sky — 'it's the sky.'",
      distractorsEn: [
        "The sea — 'it's the sea.'",
        "A star — 'it's a star.'",
        "The moon — 'it's the moon.'",
      ],
      exercisedAtomKanas: ["そら"],
    }),
    speaking("ja-m3-neo-1-speak-hon", "ほんだ", "It's a book.", ["ほん"]),
    // Review tail — M1 atoms.
    vocabMcq("ja-m3-neo-1-rev-mcq", L1_REVIEW[0], NEO_M1_POOL),
    sentenceMcq({
      id: "ja-m3-neo-1-mcq-mizu",
      prompt: "A friend hands you a cup. Pick 'It's water.'",
      correctKana: "みずだ。",
      distractorsKana: ["ごはんだ。", "うみだ。", "ゆきだ。"],
      exercisedAtomKanas: ["みず"],
    }),
  ],
};

assertNoSameAnswerCluster(M3_NEO_1.steps);
assertNoConsecutiveSame(M3_NEO_1.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L2 — "は — the spotlight" (DISCOURSE-PARTICLE template 1b)
 * は only ever appears in multi-sentence / dialogue context. Never "as for".
 * ════════════════════════════════════════════════════════════════════════ */

const L2_REVIEW = pickReviewAtoms("ja-m3-neo-2-rev", NEO_M2_POOL, 5);

export const M3_NEO_2: LessonContent = {
  id: "ja-m3-neo-2",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "は — the spotlight",
  description:
    "は puts a spotlight on the topic; the rest of the sentence comments on it. Introduce yourself and your friends — casually.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Mini-dialogue exposure first.
    dialogueListen({
      id: "ja-m3-neo-2-dlg-intro",
      lines: [
        { speaker: "トム", kana: "わたしは トムだ。がくせいだ。" },
        { speaker: "ミカ", kana: "わたしは ミカだ。せんせいだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Tom say he is?",
          correctText: "A student",
          distractors: ["A teacher", "A doctor", "A tourist"],
        },
        {
          id: "q2",
          prompt: "Who is the teacher?",
          correctText: "Mika",
          distractors: ["Tom", "Tom's friend", "Nobody here"],
        },
      ],
      exercisedAtomKanas: ["わたし", "がくせい", "せんせい"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-2-lc-gakusei",
      audioText: "わたしは がくせいだ。",
      question: "Someone your age introduces themselves. What are they saying?",
      correctMeaningEn: "I'm a student.",
      distractorsEn: ["I'm a teacher.", "I'm Tom.", "I'm fine."],
      exercisedAtomKanas: ["わたし", "がくせい", "は"],
    }),
    // ② The rule — spotlight framing (never "as for").
    grammarRule({
      id: "ja-m3-neo-2-rule-wa",
      title: "は — the spotlight",
      rule:
        "は shines a spotlight on the topic — the thing the sentence is about. Everything after は is a comment on it: わたしは がくせいだ = spotlight on me → comment: student. Written は, said 'wa'.",
      examples: [
        {
          ja: "わたしは がくせいだ。",
          romaji: "watashi wa gakusei da.",
          en: "I'm a student. (spotlight: me → comment: student)",
        },
        {
          ja: "トムは せんせいだ。",
          romaji: "tomu wa sensei da.",
          en: "Tom is a teacher. (the spotlight moves to Tom)",
        },
      ],
      antiPattern: {
        ja: "がくせいだ。",
        romaji: "gakusei da.",
        en: "((I'm) a student — no spotlight)",
        why:
          "Without は there's no spotlight — fine when everyone already knows who you mean, but when you INTRODUCE yourself, light up the topic first: わたしは, then the comment.",
      },
    }),
    // ③ Builds — AはBだ.
    build(
      "ja-m3-neo-2-build-watashi",
      "Introduce yourself to a new friend: I'm a student.",
      "わたしは がくせいだ",
      ["がくせい", "は", "わたし", "だ", "せんせい"],
      ["わたし", "は", "がくせい", "だ"],
      ["わたし", "がくせい", "は"],
    ),
    vocabMcq(
      "ja-m3-neo-2-mcq-gakusei",
      { kana: "がくせい", meaningEn: "student", emoji: "🎓", fromModule: "m3" },
      NEO_M1_POOL,
    ),
    build(
      "ja-m3-neo-2-build-tomu",
      "Tell a friend about Tom: Tom is a teacher.",
      "トムは せんせいだ",
      ["トム", "は", "せんせい", "だ", "がくせい"],
      ["トム", "は", "せんせい", "だ"],
      ["せんせい", "は"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-2-lc-tomodachi",
      audioText: "ともだちは せんせいだ。",
      question: "Your friend tells you about someone. What are they saying?",
      correctMeaningEn: "My friend is a teacher.",
      distractorsEn: [
        "My friend is a student.",
        "Tom is a teacher.",
        "I'm a teacher.",
      ],
      exercisedAtomKanas: ["ともだち", "せんせい", "は"],
    }),
    // ④ Context MCQs — what does は spotlight?
    listeningCompSentence({
      id: "ja-m3-neo-2-lc-spotlight-1",
      audioText: "トムは がくせいだ。",
      question: "Which part of this sentence gets the spotlight (は)?",
      correctMeaningEn: "Tom — he's the topic",
      distractorsEn: [
        "The speaker — talking about themselves",
        "Being a student — that's the comment, not the topic",
        "Nobody — it's a question",
      ],
      exercisedAtomKanas: ["がくせい", "は"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-2-lc-spotlight-2",
      audioText: "ともだちは がくせいだ。",
      question: "What is this sentence about?",
      correctMeaningEn: "The speaker's friend",
      distractorsEn: ["The speaker", "Tom", "A teacher"],
      exercisedAtomKanas: ["ともだち", "がくせい", "は"],
    }),
    cloze(
      "ja-m3-neo-2-cloze-wa",
      "トム",
      " せんせいだ。",
      "は",
      ["は", "か", "の", "が"],
      "Tom is a teacher.",
      "トムは せんせいだ。",
      "The spotlight goes on Tom; the rest of the sentence comments on him.",
    ),
    build(
      "ja-m3-neo-2-build-tomodachi",
      "Tell a friend: My friend is a student.",
      "ともだちは がくせいだ",
      ["ともだち", "は", "がくせい", "だ", "トム"],
      ["ともだち", "は", "がくせい", "だ"],
      ["ともだち", "がくせい", "は"],
    ),
    // ⑤ Production with audience cue.
    speaking(
      "ja-m3-neo-2-speak-watashi",
      "わたしは がくせいだ",
      "I'm a student.",
      ["わたし", "がくせい"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-2-lc-tomu-tomodachi",
      audioText: "トムは ともだちだ。",
      question: "Your friend explains who Tom is. What do they say?",
      correctMeaningEn: "Tom is my friend.",
      distractorsEn: [
        "Tom is a student.",
        "Tom is my teacher.",
        "I'm a friend.",
      ],
      exercisedAtomKanas: ["ともだち", "は"],
    }),
    translateStep({
      id: "ja-m3-neo-2-tr-watashi",
      promptEn: "Say to a friend: I'm a student.",
      acceptedAnswers: [
        "わたしは がくせいだ",
        "わたしはがくせいだ",
        "わたしは がくせい",
        "わたしはがくせい",
        "がくせいだ",
      ],
      audioText: "わたしは がくせいだ",
      exercisedAtomKanas: ["わたし", "がくせい"],
    }),
    speaking(
      "ja-m3-neo-2-speak-tomu",
      "トムは せんせいだ",
      "Tom is a teacher.",
      ["せんせい"],
    ),
    // Closer dialogue — third-person practice with names.
    dialogueListen({
      id: "ja-m3-neo-2-dlg-close",
      lines: [
        { speaker: "ミカ", kana: "ともだちは アメリカじんだ。" },
        { speaker: "トム", kana: "わたしは にほんじんだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Who is Japanese?",
          correctText: "Tom",
          distractors: ["Mika's friend", "Mika", "The teacher"],
        },
        {
          id: "q2",
          prompt: "Who is Mika talking about?",
          correctText: "Her friend",
          distractors: ["Herself", "Tom", "Her teacher"],
        },
      ],
      exercisedAtomKanas: ["ともだち", "わたし", "は"],
    }),
    build(
      "ja-m3-neo-2-build-nihonjin",
      "Tell a friend: I'm Japanese.",
      "わたしは にほんじんだ",
      ["わたし", "は", "にほんじん", "だ", "アメリカじん"],
      ["わたし", "は", "にほんじん", "だ"],
      ["わたし", "にほんじん", "は"],
    ),
    // Review tail — M2 atoms.
    speaking(
      "ja-m3-neo-2-rev-speak",
      L2_REVIEW[0].kana,
      L2_REVIEW[0].meaningEn,
      [L2_REVIEW[0].kana],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-2-rev-lc",
      audioText: L2_REVIEW[1].kana,
      correctMeaningEn: L2_REVIEW[1].meaningEn,
      distractorsEn: [
        L2_REVIEW[2].meaningEn,
        L2_REVIEW[3].meaningEn,
        L2_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L2_REVIEW[1].kana],
    }),
    vocabMcq("ja-m3-neo-2-rev-mcq", L2_REVIEW[2], NEO_M2_POOL),
  ],
};

assertNoSameAnswerCluster(M3_NEO_2.steps);
assertAnswerRotation(M3_NEO_2.steps, 1); // は intro lesson — single new particle
assertNoConsecutiveSame(M3_NEO_2.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L3 — "も — me too" (PARTICLE substitution template)
 * は→も slot swap = meaning change; choice-under-contrast, never transform.
 * ════════════════════════════════════════════════════════════════════════ */

const L3_REVIEW = pickReviewAtoms("ja-m3-neo-3-rev", NEO_M1_POOL, 5);

export const M3_NEO_3: LessonContent = {
  id: "ja-m3-neo-3",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "も — me too",
  description:
    "Swap the spotlight は for も and the sentence gains 'too.' Two-line contexts force the choice.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Contrast exposure.
    dialogueListen({
      id: "ja-m3-neo-3-dlg-intro",
      lines: [
        { speaker: "トム", kana: "わたしは がくせいだ。" },
        { speaker: "ミカ", kana: "わたしも がくせいだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Mika answers with わたしも. What does she mean?",
          correctText: "She's a student too",
          distractors: [
            "She's NOT a student",
            "She's a teacher instead",
            "She's asking if Tom is a student",
          ],
        },
        {
          id: "q2",
          prompt: "Which little word did Mika swap in?",
          correctText: "も",
          distractors: ["は", "だ", "か"],
        },
      ],
      exercisedAtomKanas: ["わたし", "がくせい", "も"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-3-lc-tomu",
      audioText: "トムも がくせいだ。",
      question: "Your friend adds this after talking about Mika. Meaning?",
      correctMeaningEn: "Tom is a student too.",
      distractorsEn: [
        "Tom is NOT a student.",
        "Is Tom a student?",
        "Tom is a teacher too.",
      ],
      exercisedAtomKanas: ["がくせい", "も"],
    }),
    // ② The rule — minimal pair per invariant 12.
    grammarRule({
      id: "ja-m3-neo-3-rule-mo",
      title: "も — 'too'",
      rule:
        "Swap は for も and the sentence gains 'too / also': トムも がくせいだ = Tom is a student TOO. も REPLACES は in that slot — the two never stack. Everything else stays the same.",
      examples: [
        {
          ja: "トムも がくせいだ。",
          romaji: "tomu mo gakusei da.",
          en: "Tom is a student too.",
        },
        {
          ja: "わたしも がくせいだ。",
          romaji: "watashi mo gakusei da.",
          en: "I'm a student too.",
        },
      ],
      antiPattern: {
        ja: "トムはも がくせいだ。",
        romaji: "tomu wa mo gakusei da.",
        en: "(Tom is a student too — broken)",
        why:
          "も replaces は; they never stack. トムも already carries both jobs: topic AND 'too.'",
      },
    }),
    // ③ Choice-under-contrast drills — 2-line context, blank particle.
    cloze(
      "ja-m3-neo-3-cloze-mo-1",
      "わたしは がくせいだ。トム",
      " がくせいだ。",
      "も",
      ["も", "は", "か", "の"],
      "I'm a student. Tom is a student too.",
      "わたしは がくせいだ。トムも がくせいだ。",
      "Tom joins something already said about the speaker — the context forces 'too.'",
    ),
    cloze(
      "ja-m3-neo-3-cloze-wa-1",
      "トムは にほんじんだ。ミカ",
      " アメリカじんだ。",
      "は",
      ["は", "も", "か", "の"],
      "Tom is Japanese. Mika is American.",
      "トムは にほんじんだ。ミカは アメリカじんだ。",
      "Mika does NOT join Tom's group — a new spotlight, not 'too.'",
    ),
    cloze(
      "ja-m3-neo-3-cloze-mo-2",
      "いぬは ともだちだ。ねこ",
      " ともだちだ。",
      "も",
      ["も", "は", "の", "か"],
      "Dogs are friends. Cats are friends too.",
      "いぬは ともだちだ。ねこも ともだちだ。",
      "Cats join the same club as dogs — same comment, so 'too.'",
    ),
    cloze(
      "ja-m3-neo-3-cloze-wa-2",
      "ミカは せんせいだ。トム",
      " がくせいだ。",
      "は",
      ["は", "も", "が", "の"],
      "Mika is a teacher. Tom is a student.",
      "ミカは せんせいだ。トムは がくせいだ。",
      "Different comments — Tom isn't joining Mika's group, so a fresh spotlight.",
    ),
    selfExplain({
      id: "ja-m3-neo-3-self-mo",
      anchorLabel: "You picked も in: わたしは がくせいだ。トム＿ がくせいだ。",
      anchorAudioText: "トムも がくせいだ",
      question: "Why is も correct in the second sentence?",
      rule: {
        text: "も adds 'too' — Tom joins something already said about someone else.",
      },
      surface: { text: "も always follows a person's name." },
      distractor: { text: "も marks the sentence as a question." },
      ruleExplanation:
        "も replaces は when the topic JOINS an earlier statement. It has nothing to do with names or questions.",
    }),
    // ④ Builds — both particles in the bank so the choice is real.
    build(
      "ja-m3-neo-3-build-watashi-mo",
      "Your friend says she's a student. Say: I'm a student too.",
      "わたしも がくせいだ",
      ["わたし", "も", "は", "がくせい", "だ"],
      ["わたし", "も", "がくせい", "だ"],
      ["わたし", "がくせい", "も"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-3-lc-mika",
      audioText: "ミカも ともだちだ。",
      question: "You ask about Mika and hear this. Meaning?",
      correctMeaningEn: "Mika is a friend too.",
      distractorsEn: [
        "Mika is my only friend.",
        "Mika is a teacher too.",
        "Is Mika a friend?",
      ],
      exercisedAtomKanas: ["ともだち", "も"],
    }),
    build(
      "ja-m3-neo-3-build-tomu-mo",
      "Tell a friend: Tom is Japanese too.",
      "トムも にほんじんだ",
      ["トム", "も", "は", "にほんじん", "だ"],
      ["トム", "も", "にほんじん", "だ"],
      ["にほんじん", "も"],
    ),
    // ⑤ Production both directions.
    sentenceMcq({
      id: "ja-m3-neo-3-mcq-reply",
      prompt:
        "Your friend says: わたしは がくせいだ。 You're one too — pick your reply.",
      correctKana: "わたしも がくせいだ。",
      distractorsKana: [
        "わたしは がくせいだ。",
        "トムも がくせいだ。",
        "わたしも せんせいだ。",
      ],
      explanation:
        "Joining the club = も. Repeating は just restates; the other options change who or what.",
      exercisedAtomKanas: ["わたし", "がくせい", "も"],
    }),
    speaking(
      "ja-m3-neo-3-speak-watashi-mo",
      "わたしも がくせいだ",
      "I'm a student too.",
      ["わたし", "がくせい"],
    ),
    translateStep({
      id: "ja-m3-neo-3-tr-inu-mo",
      promptEn: "Say to a friend: The dog is a friend too.",
      acceptedAnswers: [
        "いぬも ともだちだ",
        "いぬもともだちだ",
        "いぬも ともだち",
        "いぬもともだち",
      ],
      audioText: "いぬも ともだちだ",
      exercisedAtomKanas: ["いぬ", "ともだち", "も"],
    }),
    build(
      "ja-m3-neo-3-build-mika-mo",
      "Tell a friend: Mika is a friend too.",
      "ミカも ともだちだ",
      ["ミカ", "も", "は", "ともだち", "だ"],
      ["ミカ", "も", "ともだち", "だ"],
      ["ともだち", "も"],
    ),
    speaking(
      "ja-m3-neo-3-speak-neko-mo",
      "ねこも ともだちだ",
      "Cats are friends too.",
      ["ねこ", "ともだち"],
    ),
    listeningBuildSentence({
      id: "ja-m3-neo-3-lbs-tomu-mo",
      target: "トムも ともだちだ",
      tiles: ["トム", "も", "は", "ともだち", "だ"],
      correctOrder: ["トム", "も", "ともだち", "だ"],
      promptEn: "Tom is a friend too.",
      exercisedAtomKanas: ["ともだち", "も"],
    }),
    // Review tail — M1 atoms.
    speaking(
      "ja-m3-neo-3-rev-speak",
      L3_REVIEW[0].kana,
      L3_REVIEW[0].meaningEn,
      [L3_REVIEW[0].kana],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-3-rev-lc",
      audioText: L3_REVIEW[1].kana,
      correctMeaningEn: L3_REVIEW[1].meaningEn,
      distractorsEn: [
        L3_REVIEW[2].meaningEn,
        L3_REVIEW[3].meaningEn,
        L3_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L3_REVIEW[1].kana],
    }),
    vocabMcq("ja-m3-neo-3-rev-mcq", L3_REVIEW[3], NEO_M1_POOL),
  ],
};

assertNoSameAnswerCluster(M3_NEO_3.steps);
assertAnswerRotation(M3_NEO_3.steps, 2); // rotates は / も by design
assertNoConsecutiveSame(M3_NEO_3.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L4 — "Asking without か" (PATTERN + PROSODY)
 * Statement vs question carried by intonation alone (。/？ TTS contour).
 * うん / そう enter as RECOGNITION-only atoms (blocked, no production).
 * ════════════════════════════════════════════════════════════════════════ */

const L4_REVIEW = pickReviewAtoms("ja-m3-neo-4-rev", NEO_M1_M2_POOL, 6);

export const M3_NEO_4: LessonContent = {
  id: "ja-m3-neo-4",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Asking without か",
  description:
    "Casual questions are made with your voice: ねこ？ Rising tone asks; falling tone tells. Hear うん and そう — the answers you'll get.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Listening discrimination pairs — 。 vs ？ contour.
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-neko-stmt",
      audioText: "ねこだ。",
      question: "Listen to the tone. Is your friend telling you or asking you?",
      correctMeaningEn: "Telling — 'It's a cat.'",
      distractorsEn: [
        "Asking — 'Is it a cat?'",
        "Telling — 'It's a dog.'",
        "Asking — 'Is it a dog?'",
      ],
      exercisedAtomKanas: ["ねこ"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-neko-q",
      audioText: "ねこ？",
      question: "Same word, different tone. Telling or asking?",
      correctMeaningEn: "Asking — 'Is it a cat?'",
      distractorsEn: [
        "Telling — 'It's a cat.'",
        "Asking — 'Is it a dog?'",
        "Telling — 'It's a dog.'",
      ],
      exercisedAtomKanas: ["ねこ"],
    }),
    // ② The rule.
    grammarRule({
      id: "ja-m3-neo-4-rule-rise",
      title: "Asking with your voice — ねこ？",
      rule:
        "Casual questions need no question word: say the noun with a rising tone and it becomes a question. ねこ。 (falling) = 'It's a cat.' ねこ？ (rising) = 'Is it a cat?' Works with は-sentences too: トムは せんせい？",
      examples: [
        { ja: "ねこ？", romaji: "neko?", en: "Is it a cat? (rising tone)" },
        { ja: "がくせい？", romaji: "gakusei?", en: "Are you a student?" },
      ],
      antiPattern: {
        ja: "ねこだ？",
        romaji: "neko da?",
        en: "(It's a CAT?!)",
        why:
          "The rising tone does the asking on its own — drop だ when you ask this way. Keeping だ turns it into surprised disbelief ('it's a CAT?!'), not a neutral question.",
      },
      cultureNote:
        "The answers you'll hear (recognition only for now): うん — the casual 'yeah,' the most common word in spoken Japanese; そう / そうだ — 'that's right.' Just understand them; producing them comes later.",
    }),
    // ③ Recognition listening — うん / そう answers.
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-un",
      audioText: "うん、ねこだ。",
      question: "You asked ねこ？ and hear this reply. What does it mean?",
      correctMeaningEn: "Yeah, it's a cat.",
      distractorsEn: [
        "No, it's a dog.",
        "Is it a cat?",
        "It's a cat, right?",
      ],
      exercisedAtomKanas: ["うん", "ねこ"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-sou",
      audioText: "そう、ねこだ。",
      question: "Another way your friend might answer. What are they saying?",
      correctMeaningEn: "That's right — it's a cat.",
      distractorsEn: [
        "No — wrong.",
        "They're asking a question back.",
        "They don't know.",
      ],
      exercisedAtomKanas: ["そう", "ねこ"],
    }),
    // ④ Build/choose short exchanges.
    sentenceMcq({
      id: "ja-m3-neo-4-mcq-ask-neko",
      prompt: "Ask your friend if it's a cat — voice rising.",
      correctKana: "ねこ？",
      distractorsKana: ["ねこだ。", "ねこも。", "いぬ？"],
      exercisedAtomKanas: ["ねこ"],
    }),
    speaking("ja-m3-neo-4-speak-neko-q", "ねこ？", "Is it a cat? (voice rises)", [
      "ねこ",
    ]),
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-gakusei-q",
      audioText: "がくせい？",
      question: "Tone check: telling or asking?",
      correctMeaningEn: "Asking — 'Are you a student?'",
      distractorsEn: [
        "Telling — 'I'm a student.'",
        "Asking — 'Are you a teacher?'",
        "Telling — 'I'm a teacher.'",
      ],
      exercisedAtomKanas: ["がくせい"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-gakusei-stmt",
      audioText: "がくせいだ。",
      question: "And this one — telling or asking?",
      correctMeaningEn: "Telling — '(I'm) a student.'",
      distractorsEn: [
        "Asking — 'Are you a student?'",
        "Telling — '(I'm) a teacher.'",
        "Asking — 'Are you a teacher?'",
      ],
      exercisedAtomKanas: ["がくせい"],
    }),
    sentenceMcq({
      id: "ja-m3-neo-4-mcq-ask-tomu",
      prompt: "Ask your friend whether Tom is a teacher.",
      correctKana: "トムは せんせい？",
      distractorsKana: [
        "トムは せんせいだ。",
        "トムも せんせい？",
        "せんせいは トム？",
      ],
      explanation:
        "Rising tone on the plain sentence asks; だ at the end would state it instead.",
      exercisedAtomKanas: ["せんせい", "は"],
    }),
    // Dialogue: question + うん answer in the wild.
    dialogueListen({
      id: "ja-m3-neo-4-dlg-un",
      lines: [
        { speaker: "ケン", kana: "トムは がくせい？" },
        { speaker: "ミカ", kana: "うん、がくせいだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What did Ken want to know?",
          correctText: "Whether Tom is a student",
          distractors: [
            "Whether Tom is a teacher",
            "Whether Mika is a student",
            "Where Tom is",
          ],
        },
        {
          id: "q2",
          prompt: "How did Mika answer?",
          correctText: "Yes — casually (うん)",
          distractors: [
            "No",
            "She asked a question back",
            "She didn't know",
          ],
        },
      ],
      exercisedAtomKanas: ["がくせい", "うん"],
    }),
    sentenceMcq({
      id: "ja-m3-neo-4-mcq-yes-reply",
      prompt:
        "Your friend asks: いぬ？ It IS a dog — pick the casual 'yeah, it's a dog.'",
      correctKana: "うん、いぬだ。",
      distractorsKana: ["うん、ねこだ。", "ねこ？", "そらだ。"],
      exercisedAtomKanas: ["うん", "いぬ"],
    }),
    speaking(
      "ja-m3-neo-4-speak-tomu-q",
      "トムは せんせい？",
      "Is Tom a teacher? (voice rises)",
      ["せんせい"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-sou-da",
      audioText: "うん、そうだ。",
      question: "You asked ミカは ともだち？ and hear this. What's the answer?",
      correctMeaningEn: "Yeah, that's right.",
      distractorsEn: [
        "No, that's wrong.",
        "They're not sure.",
        "They're asking who Mika is.",
      ],
      exercisedAtomKanas: ["うん", "そう"],
    }),
    translateStep({
      id: "ja-m3-neo-4-tr-hon-q",
      promptEn: "Ask your friend if it's a book.",
      acceptedAnswers: ["ほん？", "ほん"],
      audioText: "ほん？",
      exercisedAtomKanas: ["ほん"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-4-lc-nihonjin-q",
      audioText: "トムは にほんじん？",
      question: "What is your friend asking?",
      correctMeaningEn: "Is Tom Japanese?",
      distractorsEn: [
        "Tom is Japanese.",
        "Is Tom American?",
        "Tom is Japanese too.",
      ],
      exercisedAtomKanas: ["は"],
    }),
    speaking("ja-m3-neo-4-speak-inu-q", "いぬ？", "Is it a dog? (voice rises)", [
      "いぬ",
    ]),
    // Review tail.
    vocabMcq("ja-m3-neo-4-rev-mcq", L4_REVIEW[0], NEO_M1_M2_POOL),
    listeningCompSentence({
      id: "ja-m3-neo-4-rev-lc",
      audioText: L4_REVIEW[1].kana,
      correctMeaningEn: L4_REVIEW[1].meaningEn,
      distractorsEn: [
        L4_REVIEW[2].meaningEn,
        L4_REVIEW[3].meaningEn,
        L4_REVIEW[4].meaningEn,
      ],
      exercisedAtomKanas: [L4_REVIEW[1].kana],
    }),
    reviewMatchPairs("ja-m3-neo-4-rev", L4_REVIEW),
  ],
};

assertNoSameAnswerCluster(M3_NEO_4.steps);
assertNoConsecutiveSame(M3_NEO_4.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L5 — "Survival sounds" (CHUNK template, type 5 — NO grammar stage)
 * Unanalyzed wholes with function glosses: situated listening →
 * situation-matching → ONE register-noticing MCQ → listen-and-repeat →
 * act-out MCQs. Zero grammar_rule steps. No decomposition.
 * ════════════════════════════════════════════════════════════════════════ */

export const M3_NEO_5: LessonContent = {
  id: "ja-m3-neo-5",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Survival sounds",
  description:
    "Five whole phrases you'll use from day one: すみません, ごめんなさい, ありがとうございます, だいじょうぶ, はじめまして. No grammar — just the moments they belong to.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // ① Situated listening + listen-and-repeat, chunk by chunk.
    listeningCompSentence({
      id: "ja-m3-neo-5-lc-sumimasen",
      audioText: "すみません",
      question:
        "Someone bumps into you on a crowded train and says this. What do they mean?",
      correctMeaningEn: "Sorry / excuse me",
      distractorsEn: ["Thank you", "Nice to meet you", "It's okay"],
      exercisedAtomKanas: ["すみません"],
    }),
    speaking(
      "ja-m3-neo-5-speak-sumimasen",
      "すみません",
      "Excuse me / sorry.",
      ["すみません"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-5-lc-gomen",
      audioText: "ごめんなさい",
      question:
        "Your friend steps on your foot, winces, and says this. What do they mean?",
      correctMeaningEn: "I'm sorry!",
      distractorsEn: ["Thank you", "Nice to meet you", "It's all right"],
      exercisedAtomKanas: ["ごめんなさい"],
    }),
    speaking("ja-m3-neo-5-speak-gomen", "ごめんなさい", "I'm sorry.", [
      "ごめんなさい",
    ]),
    listeningCompSentence({
      id: "ja-m3-neo-5-lc-daijoubu",
      audioText: "だいじょうぶ",
      question:
        "You drop your friend's pen and apologize. They wave a hand and say this. Meaning?",
      correctMeaningEn: "It's okay — no problem",
      distractorsEn: ["I'm sorry", "Thank you", "Watch out"],
      exercisedAtomKanas: ["だいじょうぶ"],
    }),
    sentenceMcq({
      id: "ja-m3-neo-5-mcq-actout-daijoubu",
      prompt: "Your friend apologizes — ごめんなさい！ What do you say back?",
      correctKana: "だいじょうぶ",
      distractorsKana: ["はじめまして", "すみません", "ありがとうございます"],
      exercisedAtomKanas: ["だいじょうぶ"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-5-lc-arigatou",
      audioText: "ありがとうございます",
      question: "You hold a door open; a stranger nods and says this. Meaning?",
      correctMeaningEn: "Thank you very much",
      distractorsEn: ["Excuse me", "I'm sorry", "Good morning"],
      exercisedAtomKanas: ["ありがとうございます"],
    }),
    speaking(
      "ja-m3-neo-5-speak-arigatou",
      "ありがとうございます",
      "Thank you very much.",
      ["ありがとうございます"],
    ),
    // ③ ONE register-noticing MCQ.
    sentenceMcq({
      id: "ja-m3-neo-5-mcq-register",
      prompt:
        "A stranger picks up the glove you dropped. Which thanks fits a stranger?",
      correctKana: "ありがとうございます",
      distractorsKana: ["ありがとう", "うん", "だいじょうぶ"],
      explanation:
        "Long form for strangers and staff; short ありがとう is for people close to you. Same thanks, different distance.",
      exercisedAtomKanas: ["ありがとうございます"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-5-lc-hajimemashite",
      audioText: "はじめまして",
      question:
        "A friend introduces you to someone new; the new person bows slightly and says this. Meaning?",
      correctMeaningEn: "Nice to meet you",
      distractorsEn: ["Goodbye", "Good evening", "Congratulations"],
      exercisedAtomKanas: ["はじめまして"],
    }),
    speaking(
      "ja-m3-neo-5-speak-hajimemashite",
      "はじめまして",
      "Nice to meet you.",
      ["はじめまして"],
    ),
    // ② Situation-matching — scene ↔ chunk (6 pairs, floor-proof).
    {
      id: "ja-m3-neo-5-match-scenes",
      type: "match_pairs",
      prompt: "Match each phrase to its moment",
      playAudioOnSelect: true,
      pairs: [
        { id: "p-0", source: "すみません", target: "Squeezing past someone" },
        { id: "p-1", source: "ごめんなさい", target: "Apologizing to a friend" },
        { id: "p-2", source: "ありがとうございます", target: "Thanking a stranger" },
        { id: "p-3", source: "ありがとう", target: "Thanking a close friend" },
        { id: "p-4", source: "だいじょうぶ", target: "Reassuring: 'it's fine'" },
        { id: "p-5", source: "はじめまして", target: "Meeting someone new" },
      ],
      exercisedAtoms: [],
      modality: "recognition",
    } satisfies MatchPairsStep,
    // ⑤ Act-out MCQs.
    sentenceMcq({
      id: "ja-m3-neo-5-mcq-actout-sumimasen",
      prompt:
        "You need to squeeze past people on a crowded train. What do you say?",
      correctKana: "すみません",
      distractorsKana: ["だいじょうぶ", "はじめまして", "ごめんなさい"],
      explanation:
        "すみません is the all-purpose 'excuse me' for strangers — getting attention, getting past, small apologies.",
      exercisedAtomKanas: ["すみません"],
    }),
    sentenceMcq({
      id: "ja-m3-neo-5-mcq-actout-hajimemashite",
      prompt: "You're introduced to your friend's friend. What do you say?",
      correctKana: "はじめまして",
      distractorsKana: ["ありがとう", "だいじょうぶ", "ごめんなさい"],
      exercisedAtomKanas: ["はじめまして"],
    }),
    // Overheard exchange — two chunks in the wild.
    dialogueListen({
      id: "ja-m3-neo-5-dlg-overheard",
      lines: [
        { speaker: "Stranger", kana: "すみません。" },
        { speaker: "ケン", kana: "だいじょうぶ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What just happened?",
          correctText: "Someone apologized and Ken said it was fine",
          distractors: [
            "Someone said thanks and Ken said you're welcome",
            "They introduced themselves to each other",
            "Ken apologized to a stranger",
          ],
        },
      ],
      exercisedAtomKanas: ["すみません", "だいじょうぶ"],
    }),
    sentenceMcq({
      id: "ja-m3-neo-5-mcq-actout-reassure",
      prompt:
        "Your friend spills your water and looks worried. Reassure them.",
      correctKana: "だいじょうぶ",
      distractorsKana: ["すみません", "ありがとうございます", "はじめまして"],
      exercisedAtomKanas: ["だいじょうぶ"],
    }),
    speaking(
      "ja-m3-neo-5-speak-daijoubu",
      "だいじょうぶ",
      "It's okay — no problem.",
      ["だいじょうぶ"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-5-lc-arigatou-casual",
      audioText: "ありがとう",
      question:
        "Your friend takes the snack you offered and says this. Meaning?",
      correctMeaningEn: "Thanks! (casual)",
      distractorsEn: ["Sorry!", "No thanks.", "Nice to meet you."],
    }),
    sentenceMcq({
      id: "ja-m3-neo-5-mcq-actout-thanks",
      prompt: "Your close friend lends you an umbrella. Casual thanks?",
      correctKana: "ありがとう",
      distractorsKana: ["すみません", "はじめまして", "だいじょうぶ"],
    }),
  ],
};

assertNoSameAnswerCluster(M3_NEO_5.steps);
assertNoConsecutiveSame(M3_NEO_5.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L6 — "Story: meeting someone" (integration dialogue)
 * Casual meet-a-friend's-friend story from taught material only.
 * One older character (Tanaka, the teacher) speaks TWO flagged です lines —
 * the Irodori register-preview device.
 * ════════════════════════════════════════════════════════════════════════ */

const L6_REVIEW = pickReviewAtoms("ja-m3-neo-6-rev", NEO_M2_POOL, 4);

export const M3_NEO_6: LessonContent = {
  id: "ja-m3-neo-6",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Story: meeting someone",
  description:
    "Mika introduces Ken to her friend Tom — and her teacher walks by. Everything you've learned, in one scene.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    // Scene 1 — the introduction.
    dialogueListen({
      id: "ja-m3-neo-6-dlg-scene1",
      lines: [
        { speaker: "ミカ", kana: "ケン、トムだ。ともだちだ。" },
        { speaker: "トム", kana: "はじめまして。トムだ。" },
        { speaker: "ケン", kana: "はじめまして。ケンだ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Who is Tom?",
          correctText: "Mika's friend",
          distractors: [
            "Mika's teacher",
            "Ken's teacher",
            "A stranger nobody knows",
          ],
        },
        {
          id: "q2",
          prompt: "What do Tom and Ken say to each other?",
          correctText: "Nice to meet you",
          distractors: ["Thank you", "Sorry", "It's okay"],
        },
      ],
      exercisedAtomKanas: ["ともだち", "はじめまして"],
    }),
    sentenceMcq({
      id: "ja-m3-neo-6-mcq-first-words",
      prompt: "Ken meets Tom for the first time. What does he say first?",
      correctKana: "はじめまして",
      distractorsKana: ["だいじょうぶ", "すみません", "そうだ。"],
      exercisedAtomKanas: ["はじめまして"],
    }),
    speaking(
      "ja-m3-neo-6-speak-hajimemashite",
      "はじめまして。ケンだ",
      "Nice to meet you. I'm Ken.",
      ["はじめまして"],
    ),
    // Scene 2 — asking about Tom.
    dialogueListen({
      id: "ja-m3-neo-6-dlg-scene2",
      lines: [
        { speaker: "ケン", kana: "トムは がくせい？" },
        { speaker: "ミカ", kana: "うん、がくせいだ。わたしも がくせいだ。" },
        { speaker: "ケン", kana: "そう？" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Is Tom a student?",
          correctText: "Yes — and Mika is too",
          distractors: [
            "Yes — but Mika isn't",
            "No — he's a teacher",
            "Nobody knows",
          ],
        },
        {
          id: "q2",
          prompt: "Ken replies そう？ — what is he doing?",
          correctText: "Reacting: 'oh, really?'",
          distractors: [
            "Saying no",
            "Asking Tom's name",
            "Apologizing",
          ],
        },
      ],
      exercisedAtomKanas: ["がくせい", "うん", "そう", "も"],
    }),
    build(
      "ja-m3-neo-6-build-tomu",
      "Tell a friend what you learned: Tom is a student.",
      "トムは がくせいだ",
      ["トム", "は", "がくせい", "だ", "せんせい"],
      ["トム", "は", "がくせい", "だ"],
      ["がくせい", "は"],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-6-lc-un-gakusei",
      audioText: "うん、がくせいだ。",
      question: "Mika's reply to Ken — what is she saying?",
      correctMeaningEn: "Yeah, he's a student.",
      distractorsEn: [
        "No, he's a teacher.",
        "Is he a student?",
        "He's a student too.",
      ],
      exercisedAtomKanas: ["うん", "がくせい"],
    }),
    build(
      "ja-m3-neo-6-build-mika-mo",
      "Mika adds herself: I'm a student too.",
      "わたしも がくせいだ",
      ["わたし", "も", "は", "がくせい", "だ"],
      ["わたし", "も", "がくせい", "だ"],
      ["わたし", "がくせい", "も"],
    ),
    sentenceMcq({
      id: "ja-m3-neo-6-mcq-ask-like-ken",
      prompt: "Ask casually whether Tom is a student — the way Ken did.",
      correctKana: "トムは がくせい？",
      distractorsKana: [
        "トムは がくせいだ。",
        "トムも がくせい？",
        "トムは せんせい？",
      ],
      exercisedAtomKanas: ["がくせい", "は"],
    }),
    // Scene 3 — the teacher walks by: TWO flagged です lines.
    dialogueListen({
      id: "ja-m3-neo-6-dlg-scene3",
      lines: [
        { speaker: "ミカ", kana: "せんせいだ。" },
        { speaker: "たなか", kana: "はじめまして。たなかです。" },
        { speaker: "たなか", kana: "せんせいです。" },
      ],
      questions: [
        {
          id: "q1",
          prompt:
            "Tanaka says たなかです — with です, not だ. Why the different ending?",
          correctText:
            "です is the polite layer — same meaning as だ, more formal (you'll learn it soon)",
          distractors: [
            "です makes it a question",
            "です means 'teacher'",
            "です makes it past tense",
          ],
          explanation:
            "Polite layer, coming soon: older people and staff wrap statements in です. Just recognize it for now — your own sentences stay plain.",
        },
        {
          id: "q2",
          prompt: "What did Tanaka tell them?",
          correctText: "His name — he's Tanaka, the teacher",
          distractors: [
            "He's a student",
            "He's Tom's friend",
            "He's leaving",
          ],
        },
      ],
      exercisedAtomKanas: ["せんせい", "はじめまして"],
    }),
    // です second exposure — flagged recognition.
    listeningCompSentence({
      id: "ja-m3-neo-6-lc-desu-recognition",
      audioText: "せんせいです。",
      question:
        "Polite-ending check (recognition only) — what does this mean?",
      correctMeaningEn: "'(I) am a teacher' — said politely",
      distractorsEn: [
        "'(I) am a teacher' — said casually",
        "'Is (he) a teacher?'",
        "'(I) am a student' — said politely",
      ],
      exercisedAtomKanas: ["せんせい"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-6-lc-mika-mo",
      audioText: "ミカも がくせいだ。",
      question: "Retell the story: what do we know about Mika?",
      correctMeaningEn: "Mika is a student too.",
      distractorsEn: [
        "Mika is the teacher.",
        "Mika is Tom's sister.",
        "Only Mika is a student.",
      ],
      exercisedAtomKanas: ["がくせい", "も"],
    }),
    speaking(
      "ja-m3-neo-6-speak-tomu-tomodachi",
      "トムは ともだちだ",
      "Tom is a friend.",
      ["ともだち"],
    ),
    translateStep({
      id: "ja-m3-neo-6-tr-mika",
      promptEn: "Tell a friend: Mika is a friend.",
      acceptedAnswers: [
        "ミカは ともだちだ",
        "ミカはともだちだ",
        "ミカは ともだち",
        "ミカはともだち",
      ],
      audioText: "ミカは ともだちだ",
      exercisedAtomKanas: ["ともだち"],
    }),
    speaking(
      "ja-m3-neo-6-speak-mika-mo",
      "ミカも がくせいだ",
      "Mika is a student too.",
      ["がくせい"],
    ),
    listeningBuildSentence({
      id: "ja-m3-neo-6-lbs-sensei",
      target: "せんせいは にほんじんだ",
      tiles: ["せんせい", "は", "も", "にほんじん", "だ"],
      correctOrder: ["せんせい", "は", "にほんじん", "だ"],
      promptEn: "The teacher is Japanese.",
      exercisedAtomKanas: ["せんせい", "は"],
    }),
    // Review tail — M2 atoms.
    speaking(
      "ja-m3-neo-6-rev-speak",
      L6_REVIEW[0].kana,
      L6_REVIEW[0].meaningEn,
      [L6_REVIEW[0].kana],
    ),
    listeningCompSentence({
      id: "ja-m3-neo-6-rev-lc",
      audioText: L6_REVIEW[1].kana,
      correctMeaningEn: L6_REVIEW[1].meaningEn,
      distractorsEn: [
        L6_REVIEW[2].meaningEn,
        L6_REVIEW[3].meaningEn,
        NEO_M1_POOL[0].meaningEn,
      ],
      exercisedAtomKanas: [L6_REVIEW[1].kana],
    }),
    vocabMcq("ja-m3-neo-6-rev-mcq", L6_REVIEW[2], NEO_M2_POOL),
  ],
};

assertNoSameAnswerCluster(M3_NEO_6.steps);
assertNoConsecutiveSame(M3_NEO_6.steps);

/* ════════════════════════════════════════════════════════════════════════
 * L7 — mixed review
 * All concepts, ALL-NEW sentences (no earlier audioText reused verbatim),
 * ≥60% sentence-context steps.
 * ════════════════════════════════════════════════════════════════════════ */

const L7_REVIEW = pickReviewAtoms("ja-m3-neo-review-rev", NEO_M1_M2_POOL, 6);

export const M3_NEO_REVIEW: LessonContent = {
  id: "ja-m3-neo-review",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Plain sentences — review",
  description:
    "Everything from だ to だいじょうぶ, with all-new sentences: statements, spotlights, 'too', voice-questions, and the survival phrases.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    listeningCompSentence({
      id: "ja-m3-neo-rev-lc-hoshi",
      audioText: "ほしだ。",
      question: "Your friend looks up at night and says this. Meaning?",
      correctMeaningEn: "It's a star.",
      distractorsEn: ["It's the moon.", "It's the sky.", "It's snow."],
      exercisedAtomKanas: ["ほし"],
    }),
    build(
      "ja-m3-neo-rev-build-tsuki",
      "Say to a friend: It's the moon.",
      "つきだ",
      ["つき", "ほし", "だ"],
      ["つき", "だ"],
      ["つき"],
    ),
    cloze(
      "ja-m3-neo-rev-cloze-wa",
      "ゆき",
      " みずだ。",
      "は",
      ["は", "も", "か", "の"],
      "Snow is water.",
      "ゆきは みずだ。",
      "One spotlight, one comment — a plain statement about snow.",
    ),
    listeningCompSentence({
      id: "ja-m3-neo-rev-lc-yama",
      audioText: "やまだ。",
      question: "The bus turns a corner and your friend says this. Meaning?",
      correctMeaningEn: "It's a mountain.",
      distractorsEn: ["It's a river.", "It's the sea.", "It's a boat."],
      exercisedAtomKanas: ["やま"],
    }),
    cloze(
      "ja-m3-neo-rev-cloze-mo",
      "ねこは かぞくだ。いぬ",
      " かぞくだ。",
      "も",
      ["も", "は", "の", "か"],
      "Cats are family. Dogs are family too.",
      "ねこは かぞくだ。いぬも かぞくだ。",
      "Dogs join the same club as cats — same comment, so 'too.'",
    ),
    sentenceMcq({
      id: "ja-m3-neo-rev-mcq-ask-yuki",
      prompt: "Ask your friend if it's snow — voice rising.",
      correctKana: "ゆき？",
      distractorsKana: ["ゆきだ。", "ゆきも。", "ほし？"],
      exercisedAtomKanas: ["ゆき"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-rev-lc-tone",
      audioText: "ともだち？",
      question: "Tone check: telling or asking?",
      correctMeaningEn: "Asking — 'a friend (of yours)?'",
      distractorsEn: [
        "Telling — '(he's) a friend.'",
        "Asking — 'a teacher?'",
        "Telling — '(he's) a teacher.'",
      ],
      exercisedAtomKanas: ["ともだち"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-rev-lc-un",
      audioText: "うん、ともだちだ。",
      question: "The casual answer you hear back. Meaning?",
      correctMeaningEn: "Yeah, (he's) a friend.",
      distractorsEn: [
        "No, (he's) a stranger.",
        "Is he a friend?",
        "That's my teacher.",
      ],
      exercisedAtomKanas: ["うん", "ともだち"],
    }),
    build(
      "ja-m3-neo-rev-build-mika",
      "Tell a friend: Mika is Japanese too.",
      "ミカも にほんじんだ",
      ["ミカ", "も", "は", "にほんじん", "だ"],
      ["ミカ", "も", "にほんじん", "だ"],
      ["にほんじん", "も"],
    ),
    speaking(
      "ja-m3-neo-rev-speak-hoshi",
      "ほしだ",
      "It's a star.",
      ["ほし"],
    ),
    cloze(
      "ja-m3-neo-rev-cloze-wa-2",
      "ミカは せんせいだ。ケン",
      " がくせいだ。",
      "は",
      ["は", "も", "が", "の"],
      "Mika is a teacher. Ken is a student.",
      "ミカは せんせいだ。ケンは がくせいだ。",
      "Different comments — Ken isn't joining Mika's group, so a fresh spotlight.",
    ),
    sentenceMcq({
      id: "ja-m3-neo-rev-mcq-bump",
      prompt: "You step on a stranger's foot on the bus. What do you say?",
      correctKana: "すみません",
      distractorsKana: ["だいじょうぶ", "はじめまして", "ありがとう"],
      exercisedAtomKanas: ["すみません"],
    }),
    listeningCompSentence({
      id: "ja-m3-neo-rev-lc-sou",
      audioText: "そう、せんせいだ。",
      question: "You guessed someone was the teacher; you hear this. Meaning?",
      correctMeaningEn: "Right — (she's) the teacher.",
      distractorsEn: [
        "No — (she's) a student.",
        "Who is the teacher?",
        "(She's) a teacher too.",
      ],
      exercisedAtomKanas: ["そう", "せんせい"],
    }),
    build(
      "ja-m3-neo-rev-build-ken",
      "Tell a friend who Ken is: Ken is a friend.",
      "ケンは ともだちだ",
      ["ケン", "は", "も", "ともだち", "だ"],
      ["ケン", "は", "ともだち", "だ"],
      ["ともだち", "は"],
    ),
    sentenceMcq({
      id: "ja-m3-neo-rev-mcq-thanks",
      prompt: "Your close friend hands you their umbrella. Casual thanks?",
      correctKana: "ありがとう",
      distractorsKana: ["ありがとうございます", "ごめんなさい", "うん"],
      explanation:
        "Short form for people close to you; the long form keeps polite distance with strangers.",
    }),
    listeningCompSentence({
      id: "ja-m3-neo-rev-lc-desu",
      audioText: "がくせいです。",
      question:
        "Polite-ending check (recognition only): which one did you hear?",
      correctMeaningEn: "'(I'm) a student' — the polite version",
      distractorsEn: [
        "'(I'm) a student' — the casual version",
        "'Are you a student?'",
        "'(I'm) a teacher' — the polite version",
      ],
      exercisedAtomKanas: ["がくせい"],
    }),
    translateStep({
      id: "ja-m3-neo-rev-tr-shashin",
      promptEn: "Say to a friend: It's a photo.",
      acceptedAnswers: ["しゃしんだ", "しゃしん", "しゃしんだ。", "しゃしん。"],
      audioText: "しゃしんだ",
      exercisedAtomKanas: ["しゃしん"],
    }),
    speaking(
      "ja-m3-neo-rev-speak-ken",
      "ケンも がくせいだ",
      "Ken is a student too.",
      ["がくせい"],
    ),
    listeningBuildSentence({
      id: "ja-m3-neo-rev-lbs-umi",
      target: "うみは みずだ",
      tiles: ["うみ", "は", "みず", "だ", "も"],
      correctOrder: ["うみ", "は", "みず", "だ"],
      promptEn: "The sea is water.",
      exercisedAtomKanas: ["うみ", "みず"],
    }),
    reviewMatchPairs("ja-m3-neo-review", L7_REVIEW),
  ],
};

assertNoSameAnswerCluster(M3_NEO_REVIEW.steps);
assertAnswerRotation(M3_NEO_REVIEW.steps, 2);
assertNoConsecutiveSame(M3_NEO_REVIEW.steps);

/** All seven pilot lessons, deep-link order. */
export const M3_NEO_LESSONS: LessonContent[] = [
  M3_NEO_1,
  M3_NEO_2,
  M3_NEO_3,
  M3_NEO_4,
  M3_NEO_5,
  M3_NEO_6,
  M3_NEO_REVIEW,
];
