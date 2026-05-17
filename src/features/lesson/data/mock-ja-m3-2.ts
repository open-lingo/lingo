import type {
  LessonContent,
  GrammarRuleStep,
  ParticleClozeStep,
  PhraseCardStep,
} from "../types";

/**
 * M3-2 — Statements + questions: です + か.
 *
 * First explicit grammar lesson. Tae Kim framing: what does です actually
 * DO? It politely asserts the state of being. Then か turns any statement
 * into a question by attaching to the end. No tone-rise required (unlike
 * English questions).
 *
 * Vocab is N5 Core 2k: 学生 student, 先生 teacher, 日本 Japan, 友だち friend
 * (rendered in kana for now — kanji-with-ruby comes in M5+). Cards lean
 * on phrase_card (exposure) since the kana are introduced via the example
 * sentence reading, not in isolation.
 */

const RULE_DESU: GrammarRuleStep = {
  id: "ja-m3-2-rule-desu",
  type: "grammar_rule",
  title: "です — the polite copula",
  rule:
    "です sits at the end of a statement and politely asserts 'X is Y.' It's not just 'is' — it's the verbal handshake that says 'I'm speaking to you politely.' Drop it and the sentence becomes casual (used with friends, family, kids).",
  examples: [
    {
      ja: "わたしは がくせいです。",
      romaji: "watashi wa gakusei desu.",
      en: "I am a student.",
    },
    {
      ja: "これは ほんです。",
      romaji: "kore wa hon desu.",
      en: "This is a book.",
    },
  ],
  antiPattern: {
    ja: "わたしは がくせい。",
    romaji: "watashi wa gakusei.",
    en: "I am a student. (too casual for a stranger)",
    why: "Dropping です makes the sentence casual — fine with close friends, rude with the shop staff who asked your name.",
  },
  cultureNote:
    "The 'u' in です is almost silent — 'des' more than 'desu.' Both pronunciations are accepted; the dropped-u version is standard in Tokyo.",
};

const RULE_KA: GrammarRuleStep = {
  id: "ja-m3-2-rule-ka",
  type: "grammar_rule",
  title: "か — the question particle",
  rule:
    "Attach か to the end of any statement and it becomes a question. No tone rise needed (unlike English). No question mark needed (though many writers add one in casual text).",
  examples: [
    {
      ja: "がくせいですか。",
      romaji: "gakusei desu ka.",
      en: "Are you a student?",
    },
    {
      ja: "にほんじんですか。",
      romaji: "nihonjin desu ka.",
      en: "Are you Japanese?",
    },
  ],
  cultureNote:
    "Said with a flat tone — Japanese questions don't rise at the end. Rising tone sounds aggressive or surprised.",
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

export const MOCK_LESSON_JA_M3_2: LessonContent = {
  id: "ja-m3-2",
  moduleId: "m3",
  courseId: "mock-1",
  languageId: "ja",
  title: "です + か — your first sentences",
  description:
    "Polite 'is/are' (です) and the question particle か. Plus 10 N5 vocabulary words.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    {
      id: "ja-m3-2-info-open",
      type: "info",
      title: "From kana to sentences",
      body:
        "You can read hiragana. Now you build sentences. The pattern is brutally simple: [subject] [is what] です. That's it. Add か to ask. Everything else in M3 hangs off these two pieces.",
      variant: "default",
    },

    RULE_DESU,

    vocab(
      "ja-m3-2-v-gakusei",
      "Student",
      "gakusei",
      "がくせい",
      "Often the first word you'll be asked at a hostel or share house.",
    ),
    vocab("ja-m3-2-v-sensei", "Teacher", "sensei", "せんせい"),
    vocab(
      "ja-m3-2-v-nihon",
      "Japan",
      "nihon",
      "にほん",
      "Also pronounced 'nippon' in formal/sports contexts. Both are correct.",
    ),
    vocab("ja-m3-2-v-tomodachi", "Friend", "tomodachi", "ともだち"),
    vocab(
      "ja-m3-2-v-amerikajin",
      "American (person)",
      "amerikajin",
      "アメリカじん",
      "じん (人) attaches to a country name to mean 'person from there.' にほんじん = Japanese person. Note アメリカ is your second katakana word.",
    ),

    RULE_KA,

    vocab("ja-m3-2-v-hon", "Book", "hon", "ほん"),
    vocab("ja-m3-2-v-mizu", "Water", "mizu", "みず"),
    vocab("ja-m3-2-v-neko", "Cat", "neko", "ねこ"),
    vocab("ja-m3-2-v-inu", "Dog", "inu", "いぬ"),
    vocab("ja-m3-2-v-namae", "Name", "namae", "なまえ"),

    cloze(
      "ja-m3-2-cloze-1",
      "がくせいです",
      "。",
      "か",
      ["か", "は", "が", "を"],
      "Are you a student?",
      "がくせいですか。",
      "か at the end turns the statement 'I am a student' into the question 'Are you a student?'",
    ),
    cloze(
      "ja-m3-2-cloze-2",
      "ねこです",
      "。",
      "か",
      ["を", "に", "か", "は"],
      "Is it a cat?",
      "ねこですか。",
    ),
    cloze(
      "ja-m3-2-cloze-3",
      "にほんじんです",
      "。",
      "か",
      ["で", "か", "の", "が"],
      "Are you Japanese?",
      "にほんじんですか。",
    ),

    {
      id: "ja-m3-2-info-end",
      type: "info",
      title: "You can make sentences",
      body:
        "Two grammar pieces — です to assert, か to ask — and ten useful nouns. You can now say what you are and ask what someone else is. Next: は vs が, the single most important particle distinction in Japanese.",
      variant: "win",
    },
  ],
};
