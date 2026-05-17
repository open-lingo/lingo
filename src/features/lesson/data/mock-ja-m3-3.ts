import type {
  LessonContent,
  GrammarRuleStep,
  ParticleClozeStep,
} from "../types";

/**
 * M3-3 — は vs が, the BIG one.
 *
 * The single most important grammar concept in Japanese, and the one
 * Duolingo skips. Tae Kim framing:
 *   - は = TOPIC marker. "As for X..." Brings something into focus that
 *     the speaker assumes is already known (the topic of the conversation,
 *     or general background context).
 *   - が = SUBJECT marker for NEW or SALIENT information. The thing being
 *     pointed at, identified, or freshly introduced.
 *
 * Most learner-friendly mnemonic (also from Tae Kim's notes):
 *   - "Cat-IS" vs "Cat-DID" frames it backwards. Better:
 *   - は = "speaking of X..." (already in play, contextual)
 *   - が = "X did/is" (X is the answer to an implicit 'who/what?')
 *
 * Example: "ねこは いえに います" — "(As for cats) there's one in the house."
 *          "ねこが いえに います" — "There's A CAT in the house!" (new info)
 *
 * Don't promise mastery in one lesson. Promise pattern exposure +
 * intuition-building. The audit's most important card.
 */

const RULE_HA_GA: GrammarRuleStep = {
  id: "ja-m3-3-rule-ha-ga",
  type: "grammar_rule",
  title: "は vs が — topic vs new information",
  rule:
    "は marks the TOPIC ('as for X…') — something already in play, the framing for what comes next. が marks the SUBJECT as NEW or SALIENT information — the thing being identified, pointed at, or freshly introduced. The English translation is often the same; the feel is completely different.",
  examples: [
    {
      ja: "わたしは がくせいです。",
      romaji: "watashi wa gakusei desu.",
      en: "I am a student. (introducing yourself — 'as for me, student')",
    },
    {
      ja: "だれが がくせいですか。",
      romaji: "dare ga gakusei desu ka.",
      en: "WHO is the student? (asking to identify — answer needs が too)",
    },
  ],
  antiPattern: {
    ja: "だれは がくせいですか。",
    romaji: "dare wa gakusei desu ka.",
    en: "(grammatically broken — 'as for who, student?')",
    why: "Question words (だれ/なに/どこ/いつ) take が, never は. They are by definition unknown / new information, which is exactly what が marks.",
  },
  cultureNote:
    "は/が trips up every learner forever. Don't stress — focus on the patterns and intuition catches up. Rule of thumb: if you can replace it with 'as for X,' use は. If you're answering 'which one?' / 'who?' / 'what?', use が.",
};

function cloze(
  id: string,
  before: string,
  after: string,
  correctParticle: string,
  options: string[],
  meaningEn: string,
  audioText: string,
  explanation?: string,
): ParticleClozeStep {
  return {
    id,
    type: "particle_cloze",
    prompt: { before, after },
    correctParticle,
    options,
    meaningEn,
    audioText,
    explanation,
  };
}

export const MOCK_LESSON_JA_M3_3: LessonContent = {
  id: "ja-m3-3",
  moduleId: "m3",
  courseId: "mock-1",
  languageId: "ja",
  title: "は vs が — the BIG one",
  description:
    "The single highest-leverage grammar distinction in Japanese. Topic vs new information.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    {
      id: "ja-m3-3-info-open",
      type: "info",
      title: "The fork in the road",
      body:
        "Both は and が can translate to nothing in English. Both can mark what looks like the 'subject.' Some explainers say they're 'the same.' They're not. Get this distinction now and the next 80 grammar points get easier.",
      variant: "default",
    },

    RULE_HA_GA,

    cloze(
      "ja-m3-3-cloze-1",
      "わたし",
      " がくせいです。",
      "は",
      ["は", "が", "を", "に"],
      "I am a student. (introducing myself)",
      "わたしは がくせいです。",
      "Self-introduction: 'as for me, student.' は marks me as the topic; I'm not new information to either of us — I am the framing.",
    ),
    cloze(
      "ja-m3-3-cloze-2",
      "だれ",
      " せんせいですか。",
      "が",
      ["は", "が", "を", "の"],
      "Who is the teacher?",
      "だれが せんせいですか。",
      "Question word だれ ('who') is by definition unknown — it's the new information being requested. Question words ALWAYS take が, never は.",
    ),
    cloze(
      "ja-m3-3-cloze-3",
      "ねこ",
      " います。",
      "が",
      ["は", "が", "を", "で"],
      "There's a cat. (pointing it out)",
      "ねこが います。",
      "Spotting a cat — 'a cat exists!' New information for the listener. が introduces it. If you said ねこは います it would mean 'as for cats, they exist' — a general statement.",
    ),
    cloze(
      "ja-m3-3-cloze-4",
      "なまえ",
      " なんですか。",
      "は",
      ["は", "が", "の", "を"],
      "What is your name?",
      "なまえは なんですか。",
      "Note: this looks like it should take が (question word なん), but the question word here is なん, not なまえ. なまえ is the TOPIC ('as for your name…') so it takes は. The が attaches to the unknown thing.",
    ),
    cloze(
      "ja-m3-3-cloze-5",
      "これ",
      " ほんです。",
      "は",
      ["は", "が", "を", "に"],
      "This is a book.",
      "これは ほんです。",
      "Standard 'X is Y' statement, no new-information emphasis on これ. は as topic.",
    ),
    cloze(
      "ja-m3-3-cloze-6",
      "どれ",
      " あなたの かばんですか。",
      "が",
      ["は", "が", "に", "を"],
      "Which one is your bag?",
      "どれが あなたの かばんですか。",
      "どれ ('which') is a question word → が. The bag is the topic (already in context); the question is which specific one.",
    ),

    {
      id: "ja-m3-3-info-end",
      type: "info",
      title: "Intuition over rules",
      body:
        "You'll see は and が hundreds more times across M3–M10. Each exposure tightens the pattern. The two-question filter — 'am I framing the topic?' (は) or 'am I pointing at new info?' (が) — gets you 80% of cases.",
      variant: "win",
    },
  ],
};
