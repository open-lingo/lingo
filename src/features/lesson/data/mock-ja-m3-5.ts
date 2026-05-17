import type {
  LessonContent,
  GrammarRuleStep,
  ParticleClozeStep,
  PhraseCardStep,
} from "../types";

/**
 * M3-5 — Possession の + これ/それ/あれ/どれ.
 *
 * の is the multi-purpose particle that everyone meets first as
 * "possessive 's" — but Tae Kim flags it really means "the [LEFT] kind
 * of [RIGHT]." わたしのほん = "the me-kind of book." Same mechanic
 * powers にほんのくるま (Japanese-kind-of car = a Japanese car).
 *
 * これ / それ / あれ / どれ — the こそあど series. The first system
 * Japanese learners meet that maps cleanly onto English (this / that /
 * that over there / which). Use the proximity diagram (mental, not
 * visual here) to anchor the spatial logic.
 */

const RULE_NO: GrammarRuleStep = {
  id: "ja-m3-5-rule-no",
  type: "grammar_rule",
  title: "の — the 'kind of' particle",
  rule:
    "の sits between two nouns and means 'the [LEFT] kind of [RIGHT].' Most often this lines up with English 's (possessive): わたしのほん = my book. But the deeper pattern is broader: にほんのくるま = a Japanese car (Japan-kind-of car).",
  examples: [
    {
      ja: "わたしの ほんです。",
      romaji: "watashi no hon desu.",
      en: "It's my book. (the me-kind of book)",
    },
    {
      ja: "にほんの くるまです。",
      romaji: "nihon no kuruma desu.",
      en: "It's a Japanese car. (the Japan-kind of car)",
    },
  ],
  cultureNote:
    "If you can rephrase the English as 'the X kind of Y,' の works. If not (e.g. verb phrases, time expressions), you need a different particle.",
};

const RULE_KOSOADO: GrammarRuleStep = {
  id: "ja-m3-5-rule-kosoado",
  type: "grammar_rule",
  title: "これ / それ / あれ / どれ — this, that, that, which",
  rule:
    "Four words for the spatial 'this/that' system. これ = near me. それ = near you (the listener). あれ = far from both of us. どれ = which one (the question).",
  examples: [
    {
      ja: "これは わたしの かばんです。",
      romaji: "kore wa watashi no kaban desu.",
      en: "This (near me) is my bag.",
    },
    {
      ja: "それは なんですか。",
      romaji: "sore wa nan desu ka.",
      en: "What's that (near you)?",
    },
  ],
  cultureNote:
    "Japanese splits 'that' into two — near the listener (それ) vs far from both (あれ). English mashes them together. Pointing at something on the shop counter? それ. Pointing at a mountain in the distance? あれ.",
};

function vocab(
  id: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
): PhraseCardStep {
  return { id, type: "phrase_card", meaningEn, romaji, kana, cultureNote };
}

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

export const MOCK_LESSON_JA_M3_5: LessonContent = {
  id: "ja-m3-5",
  moduleId: "m3",
  courseId: "mock-1",
  languageId: "ja",
  title: "の + これ/それ/あれ/どれ",
  description:
    "Possessive の and the four-way spatial 'this/that' system.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    {
      id: "ja-m3-5-info-open",
      type: "info",
      title: "Pointing and possessing",
      body:
        "Two practical pieces: の glues nouns together (my book, a Japanese car) and the four spatial pointers これ/それ/あれ/どれ replace English's overloaded 'this/that.'",
      variant: "default",
    },

    RULE_NO,

    vocab(
      "ja-m3-5-v-kaban",
      "Bag",
      "kaban",
      "かばん",
      "Generic word for any handbag, backpack, or briefcase.",
    ),
    vocab("ja-m3-5-v-pen", "Pen", "pen", "ペン", "Katakana loanword."),
    vocab("ja-m3-5-v-kasa", "Umbrella", "kasa", "かさ"),
    vocab(
      "ja-m3-5-v-keitai",
      "Mobile phone",
      "keitai",
      "けいたい",
      "Literally 'portable.' Often shortened to ケータイ in katakana even though it's a Japanese word.",
    ),
    vocab(
      "ja-m3-5-v-jisho",
      "Dictionary",
      "jisho",
      "じしょ",
      "Mostly digital now (jisho.org is the canonical one), but the word still gets used for the app.",
    ),
    vocab("ja-m3-5-v-isu", "Chair", "isu", "いす"),

    RULE_KOSOADO,

    cloze(
      "ja-m3-5-cloze-1",
      "わたし",
      " かばんです。",
      "の",
      ["の", "は", "が", "を"],
      "It's my bag.",
      "わたしの かばんです。",
      "の glues 'me' to 'bag' = 'my bag.' The full sentence has です to politely assert it.",
    ),
    cloze(
      "ja-m3-5-cloze-2",
      "これは せんせい",
      " ほんです。",
      "の",
      ["は", "の", "に", "を"],
      "This is the teacher's book.",
      "これは せんせいの ほんです。",
      "せんせい + の + ほん = teacher-kind-of book = the teacher's book.",
    ),
    cloze(
      "ja-m3-5-cloze-3",
      "どれ",
      " あなたの ペンですか。",
      "が",
      ["は", "が", "の", "を"],
      "Which is your pen?",
      "どれが あなたの ペンですか。",
      "どれ is a question word → が. Carrying forward from M3-3.",
    ),
    cloze(
      "ja-m3-5-cloze-4",
      "それ",
      " なんですか。",
      "は",
      ["は", "が", "を", "で"],
      "What's that (near you)?",
      "それは なんですか。",
      "それ is the topic ('as for that thing near you'), なん is the question word — but なん doesn't take a particle here, it's directly followed by です.",
    ),

    {
      id: "ja-m3-5-info-end",
      type: "info",
      title: "Pointing power",
      body:
        "You can now claim ownership of things (わたしの), describe origin (にほんの), and point at four distances (これ/それ/あれ/どれ). Most shop interactions are built from these three pieces plus a vocab word.",
      variant: "win",
    },
  ],
};
