/**
 * M3 v2 — First sentences (restructure 2026-05-16).
 *
 * Spencer's spec: ≤2 new grammar concepts per module. M3 introduces:
 *   - です + か (combined card — the polite copula + question particle)
 *   - は as topic marker (no が contrast — が deferred to M6 via existence)
 *
 * Adjective EXPOSURE in example sentences (これは あおいです, それは
 * あかいです, あれは おおきいです) — no formal adjective lesson.
 * Pattern-match only.
 *
 * Lesson list (8 lessons):
 *   M3-1  Katakana SYSTEM intro + 5 loanwords (reused from v1)
 *   M3-2  です + か (combined Grammar Rule Card) + 5 vocab + cloze
 *   M3-3  Vocab + です in context (5 vocab + adjective exposure)
 *   M3-4  は as topic marker (Grammar Rule Card, drilled)
 *   M3-5  Iteration: は + です + か interleaved
 *   M3-6  Sentence Build (5 cumulative sentences)
 *   M3-7  Dialogue — first encounter (name + nationality)
 *   M3-8  Row test (mastery ★)
 */
import type { LessonContent } from "../types";
import {
  build,
  cloze,
  dialogueLesson,
  grammarRule,
  infoStep,
  phrase,
  vocab,
} from "./_jaGrammarHelpers";
import type {
  BuildSentenceStep,
  MatchPairsStep,
  MultipleChoiceStep,
  RowTestItem,
  RowTestStep,
} from "../types";

const COURSE = "mock-1";
const LANG = "ja";

// ----- M3-1 — Katakana SYSTEM intro (lifted from v1) ----------------------

export const M3_1: LessonContent = {
  id: "ja-m3-1",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Katakana — the second alphabet",
  description:
    "Meet katakana as a system. Same sounds as hiragana, different shapes — used for foreign words.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m3-1-info-system",
      "Katakana — hiragana's twin",
      "Katakana (カタカナ) has the same 46 sounds as hiragana — just different, more angular shapes. It's used for: (1) loanwords from English and other languages (コーヒー = coffee), (2) foreign names, (3) onomatopoeia and emphasis (like italics in English). You'll meet 3–5 katakana words per M3+ lesson with romaji ruby on top, so you can read by sound while the shapes sink in. Want deliberate practice? Open the katakana drill from the Practice tab.",
      "culture",
    ),
    phrase(
      "ja-m3-1-coffee",
      "Coffee",
      "koohii",
      "コーヒー",
      "The ー is a long-vowel mark — stretch the previous vowel. 'koo-hii,' not 'ko-hi.' On menus everywhere.",
    ),
    phrase(
      "ja-m3-1-taxi",
      "Taxi",
      "takushii",
      "タクシー",
      "Japanese taxis have automatic doors — don't grab the handle, the driver opens it for you.",
    ),
    phrase(
      "ja-m3-1-hotel",
      "Hotel",
      "hoteru",
      "ホテル",
      "Foreign loanwords get a vowel after consonant clusters (hot-el → ho-te-ru). This is why every English word sounds 'longer' in Japanese.",
    ),
    phrase(
      "ja-m3-1-restaurant",
      "Restaurant",
      "resutoran",
      "レストラン",
      "Used for Western-style restaurants. Japanese-style eateries are usually 食堂 (shokudou) or just the cuisine name + 屋 (-ya).",
    ),
    phrase(
      "ja-m3-1-beer",
      "Beer",
      "biiru",
      "ビール",
      "Asahi, Kirin, Sapporo, Suntory — order with 'ビール、おねがいします' (a beer, please).",
    ),
    infoStep(
      "ja-m3-1-info-end",
      "Five katakana words in your pocket",
      "You can now order a coffee, hail a taxi, find your hotel, sit in a restaurant, and order a beer. Five loanwords, five katakana shapes you've now seen in context. The shapes will become familiar through repetition across M3 — no drilling required.",
      "win",
    ),
  ],
};

// ----- M3-2 — です + か (combined Grammar Rule Card + drill) --------------

const RULE_DESU_KA = grammarRule({
  id: "ja-m3-2-rule-desu-ka",
  title: "です + か — assert, then ask",
  rule:
    "です sits at the end of a statement and politely asserts 'X is Y.' It's the verbal handshake that says 'I'm speaking to you politely.' Attach か after です to turn the statement into a question — no tone-rise needed (unlike English questions).",
  examples: [
    {
      ja: "わたしは がくせいです。",
      romaji: "watashi wa gakusei desu.",
      en: "I am a student. (statement)",
    },
    {
      ja: "がくせいですか。",
      romaji: "gakusei desu ka.",
      en: "Are you a student? (question)",
    },
  ],
  antiPattern: {
    ja: "わたしは がくせい。",
    romaji: "watashi wa gakusei.",
    en: "I am a student. (too casual for a stranger)",
    why: "Dropping です makes the sentence casual — fine with close friends, rude with the shop staff who asked your name. Polite Japanese is the default register for travelers and learners.",
  },
  cultureNote:
    "The 'u' in です is almost silent — 'des' more than 'desu.' Both pronunciations are accepted; the dropped-u version is standard in Tokyo. Japanese questions are said with a flat tone — a rising tone sounds aggressive or surprised.",
});

export const M3_2: LessonContent = {
  id: "ja-m3-2",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "です + か — your first sentences",
  description:
    "Polite 'is/are' (です) and the question particle か. Then 5 high-frequency vocab words.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m3-2-info-open",
      "From kana to sentences",
      "You can read hiragana. Now you build sentences. The pattern is brutally simple: [subject] [is what] です. Add か to ask. Almost everything in M3 hangs off these two pieces.",
    ),
    RULE_DESU_KA,
    vocab(
      "ja-m3-2-v-gakusei",
      "Student",
      "gakusei",
      "がくせい",
      "Often the first word you'll be asked at a hostel or share house.",
    ),
    vocab("ja-m3-2-v-sensei", "Teacher", "sensei", "せんせい"),
    vocab(
      "ja-m3-2-v-nihonjin",
      "Japanese (person)",
      "nihonjin",
      "にほんじん",
      "じん (人) attaches to a country name to mean 'person from there.' アメリカじん = American.",
    ),
    vocab("ja-m3-2-v-amerikajin", "American (person)", "amerikajin", "アメリカじん"),
    vocab(
      "ja-m3-2-v-namae",
      "Name",
      "namae",
      "なまえ",
      "Pair with なんですか to ask 'what is it?' — 'なまえは なんですか.'",
    ),
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
      "にほんじんです",
      "。",
      "か",
      ["を", "に", "か", "は"],
      "Are you Japanese?",
      "にほんじんですか。",
    ),
    cloze(
      "ja-m3-2-cloze-3",
      "せんせいです",
      "。",
      "か",
      ["で", "か", "の", "が"],
      "Are you a teacher?",
      "せんせいですか。",
    ),
    infoStep(
      "ja-m3-2-info-end",
      "Assert + ask, unlocked",
      "Two grammar pieces — です to assert, か to ask — and five high-frequency people-words. Next: 5 more vocab, all worked into example sentences using です.",
      "win",
    ),
  ],
};

// ----- M3-3 — More vocab + adjective EXPOSURE -----------------------------

export const M3_3: LessonContent = {
  id: "ja-m3-3",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Things + colors in context",
  description:
    "Five more vocab words plus exposure to color words inside です sentences.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m3-3-info-open",
      "Five things, some colors",
      "Five concrete nouns + three color words slipped into example sentences. We won't drill the color grammar yet — just spot the pattern: 'これは [color]です.' (This is [color].)",
    ),
    vocab("ja-m3-3-v-hon", "Book", "hon", "ほん"),
    vocab("ja-m3-3-v-mizu", "Water", "mizu", "みず"),
    vocab("ja-m3-3-v-neko", "Cat", "neko", "ねこ"),
    vocab("ja-m3-3-v-inu", "Dog", "inu", "いぬ"),
    vocab(
      "ja-m3-3-v-tomodachi",
      "Friend",
      "tomodachi",
      "ともだち",
      "Used regardless of gender or closeness — there's no separate word for 'best friend.'",
    ),
    infoStep(
      "ja-m3-3-info-adj",
      "Adjective preview",
      "These three sentences all follow the same pattern: noun + は + adjective + です. You don't need to memorize the grammar — just notice the shape. You'll see this exact pattern hundreds of times before we formally teach adjective conjugation.",
      "grammar",
    ),
    phrase(
      "ja-m3-3-adj-blue",
      "This is blue.",
      "kore wa aoi desu",
      "これは あおいです",
      "あおい = blue. Notice the adjective sits in front of です — same slot as a noun.",
    ),
    phrase(
      "ja-m3-3-adj-red",
      "That is red.",
      "sore wa akai desu",
      "それは あかいです",
      "あかい = red.",
    ),
    phrase(
      "ja-m3-3-adj-big",
      "That (over there) is big.",
      "are wa ookii desu",
      "あれは おおきいです",
      "おおきい = big. Three pointer words preview: これ/それ/あれ — formal lesson next module.",
    ),
    cloze(
      "ja-m3-3-cloze-1",
      "これ",
      " ほんです。",
      "は",
      ["は", "が", "を", "に"],
      "This is a book.",
      "これは ほんです。",
      "Standard 'X is Y' statement. は as topic — formal rule next lesson.",
    ),
    infoStep(
      "ja-m3-3-info-end",
      "Vocab loaded, pattern spotted",
      "Five new words plus you've now seen the adjective pattern three times. The は you saw in the cloze? Next lesson — its own dedicated card.",
      "win",
    ),
  ],
};

// ----- M3-4 — は as topic marker (Grammar Rule Card) ----------------------

const RULE_HA = grammarRule({
  id: "ja-m3-4-rule-ha",
  title: "は — the topic marker",
  rule:
    "は marks the TOPIC of a sentence — 'as for X, …'. It frames what the rest of the sentence is about. In introductions, descriptions, and most early sentences, は attaches to the subject (me, this, the cat).",
  examples: [
    {
      ja: "わたしは アメリカじんです。",
      romaji: "watashi wa amerikajin desu.",
      en: "I am American. ('As for me, American.')",
    },
    {
      ja: "これは ほんです。",
      romaji: "kore wa hon desu.",
      en: "This is a book.",
    },
  ],
  antiPattern: {
    ja: "わたし アメリカじんです。",
    romaji: "watashi amerikajin desu.",
    en: "(broken — missing は makes the sentence incomplete)",
    why: "Dropping は in a full sentence sounds like an unfinished thought. Spoken Japanese sometimes drops particles in fast casual speech, but in writing or careful conversation は is required to mark the topic.",
  },
  cultureNote:
    "は is written with the hiragana for 'ha' but pronounced 'wa' when used as a particle. This is a historical spelling quirk you'll see all over Japanese.",
});

export const M3_4: LessonContent = {
  id: "ja-m3-4",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "は — the topic marker",
  description:
    "The single most-used particle in Japanese. Frame the topic, then say what's true of it.",
  estimatedMinutes: 7,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m3-4-info-open",
      "The framing particle",
      "は is the workhorse particle of beginner Japanese — it shows up in almost every sentence. You've seen it in passing; now we drill it explicitly.",
    ),
    RULE_HA,
    cloze(
      "ja-m3-4-cloze-1",
      "わたし",
      " がくせいです。",
      "は",
      ["は", "が", "を", "に"],
      "I am a student.",
      "わたしは がくせいです。",
      "Self-introduction. わたしは = 'as for me.' Then がくせいです = 'student.'",
    ),
    cloze(
      "ja-m3-4-cloze-2",
      "ねこ",
      " あおいです。",
      "は",
      ["は", "が", "の", "を"],
      "The cat is blue. (a strange but grammatical statement)",
      "ねこは あおいです。",
      "Topic = the cat. Statement = is blue. Adjective pattern from last lesson.",
    ),
    cloze(
      "ja-m3-4-cloze-3",
      "なまえ",
      " なんですか。",
      "は",
      ["は", "が", "の", "を"],
      "What is your name?",
      "なまえは なんですか。",
      "なまえ = name. Topic = name. なんですか = what is it. Together: 'as for [your] name, what is it?'",
    ),
    cloze(
      "ja-m3-4-cloze-4",
      "これ",
      " みずです。",
      "は",
      ["は", "が", "を", "に"],
      "This is water.",
      "これは みずです。",
      "Topic = this. Statement = is water.",
    ),
    cloze(
      "ja-m3-4-cloze-5",
      "ともだち",
      " せんせいです。",
      "は",
      ["は", "が", "を", "の"],
      "My friend is a teacher.",
      "ともだちは せんせいです。",
      "Topic = friend. Statement = teacher.",
    ),
    infoStep(
      "ja-m3-4-info-end",
      "は internalized",
      "Five drills, one pattern: topic は statement です. You'll see this skeleton thousands of times. Next: iteration with です and か mixed in.",
      "win",
    ),
  ],
};

// ----- M3-5 — Iteration: は + です + か interleaved ----------------------

export const M3_5: LessonContent = {
  id: "ja-m3-5",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved drill — は + です + か",
  description:
    "Mixed practice. Each cloze chooses between は, か, or sometimes neither — keeps the patterns separated in your head.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m3-5-info-open",
      "Mix it up",
      "Three grammar pieces, six drills. Each cloze asks you to pick the right particle from the set you know. Pattern recognition only — no new rules.",
    ),
    cloze(
      "ja-m3-5-cloze-1",
      "あなた",
      " せんせいですか。",
      "は",
      ["は", "が", "を", "に"],
      "Are you a teacher?",
      "あなたは せんせいですか。",
      "Topic = you. Question = teacher? は marks the topic; か turns it into a question.",
    ),
    cloze(
      "ja-m3-5-cloze-2",
      "がくせいです",
      "。",
      "か",
      ["は", "が", "か", "を"],
      "Are you a student?",
      "がくせいですか。",
      "Statement → question via か.",
    ),
    cloze(
      "ja-m3-5-cloze-3",
      "ねこ",
      " ほんです。",
      "は",
      ["は", "が", "を", "に"],
      "The cat is a book. (silly but grammatical)",
      "ねこは ほんです。",
      "Topic = cat. Statement = book. Yes, the sentence is nonsense — the grammar is correct.",
    ),
    cloze(
      "ja-m3-5-cloze-4",
      "なまえは なんです",
      "。",
      "か",
      ["か", "は", "が", "の"],
      "What is your name?",
      "なまえは なんですか。",
      "Already has は; need か at the end to ask the question.",
    ),
    cloze(
      "ja-m3-5-cloze-5",
      "ともだち",
      " アメリカじんです。",
      "は",
      ["は", "が", "を", "に"],
      "My friend is American.",
      "ともだちは アメリカじんです。",
    ),
    cloze(
      "ja-m3-5-cloze-6",
      "あれは いぬです",
      "。",
      "か",
      ["か", "は", "が", "を"],
      "Is that a dog?",
      "あれは いぬですか。",
      "あれ = that-over-there (preview of next module). Statement + か.",
    ),
    infoStep(
      "ja-m3-5-info-end",
      "Patterns locked",
      "Six drills, three particles, zero new rules. You've now interleaved は + です + か across very different sentences — that's the spaced practice that makes patterns stick.",
      "win",
    ),
  ],
};

// ----- M3-6 — Sentence Build ---------------------------------------------

export const M3_6: LessonContent = {
  id: "ja-m3-6",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build — putting it together",
  description: "Five cumulative sentences using everything from M3.",
  estimatedMinutes: 6,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m3-6-info-open",
      "Production time",
      "Five sentences. Tap the tiles in the right order — audio plays the full assembled sentence when you check.",
    ),
    build(
      "ja-m3-6-s1",
      "Say: I am American.",
      "わたしは アメリカじんです",
      ["わたしは", "アメリカじんです", "がくせいです", "にほんじんです"],
      ["わたしは", "アメリカじんです"],
    ),
    build(
      "ja-m3-6-s2",
      "Ask: What is your name?",
      "なまえは なんですか",
      ["なまえは", "なんですか", "どこですか", "だれですか"],
      ["なまえは", "なんですか"],
    ),
    build(
      "ja-m3-6-s3",
      "Say: This is water.",
      "これは みずです",
      ["これは", "みずです", "ほんです", "それは"],
      ["これは", "みずです"],
    ),
    build(
      "ja-m3-6-s4",
      "Say: My friend is a teacher.",
      "ともだちは せんせいです",
      ["ともだちは", "せんせいです", "がくせいです", "わたしは"],
      ["ともだちは", "せんせいです"],
    ),
    build(
      "ja-m3-6-s5",
      "Ask: Is that a cat?",
      "それは ねこですか",
      ["それは", "ねこですか", "これは", "いぬですか"],
      ["それは", "ねこですか"],
    ),
    infoStep(
      "ja-m3-6-info-end",
      "Five sentences, your voice",
      "You can introduce yourself, ask someone's name, describe objects, talk about friends, and ask yes/no questions. That's a real first conversation.",
      "win",
    ),
  ],
};

// ----- M3-7 — Dialogue + speaking step ------------------------------------

export const M3_7: LessonContent = {
  id: "ja-m3-7",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — meeting someone",
  description:
    "A short exchange — name + nationality + polite closing. Listen, read, then say one line.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m3-7-info-open",
      "Drop into the scene",
      "You're at a guesthouse common room. A new arrival sits down and starts the conversation. Every word and grammar piece is something you've met across M3.",
      "culture",
    ),
    ...dialogueLesson({
      idPrefix: "ja-m3-7",
      representative: {
        phrase: "わたしは アメリカじんです",
        translation: "I am American.",
      },
      lines: [
        {
          speaker: "Stranger",
          meaningEn: "Excuse me — what's your name?",
          romaji: "sumimasen, namae wa nan desu ka",
          kana: "すみません、なまえは なんですか",
          cultureNote: "すみません opens any polite stranger interaction.",
          speakingPhrase: "なまえは なんですか",
        },
        {
          speaker: "You",
          meaningEn: "I am Spencer.",
          romaji: "watashi wa Spencer desu",
          kana: "わたしは Spencer です",
          cultureNote: "Foreign names are usually written in katakana — Spencer = スペンサー. For now, plain text is fine.",
          speakingPhrase: "わたしは Spencer です",
        },
        {
          speaker: "Stranger",
          meaningEn: "Are you American?",
          romaji: "amerikajin desu ka",
          kana: "アメリカじんですか",
          speakingPhrase: "アメリカじんですか",
        },
        {
          speaker: "You",
          meaningEn: "Yes. I am American.",
          romaji: "hai. watashi wa amerikajin desu",
          kana: "はい。わたしは アメリカじんです",
          speakingPhrase: "わたしは アメリカじんです",
        },
      ],
      // Default representative — Spencer's note: flip to "per-line" later
      // once Whisper sentence-level accuracy is validated.
    }),
    infoStep(
      "ja-m3-7-info-end",
      "First real conversation",
      "Four lines, real flow. You can now handle introductions in the wild. Next: the mastery test.",
      "win",
    ),
  ],
};

// ----- M3-8 — Row test (mastery ★) ----------------------------------------

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

const M3_TEST_ITEMS: RowTestItem[] = [
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-8-mc-1",
      "わたし___ がくせいです。 (I am a student.)",
      "わたしは がくせいです",
      "は",
      ["が", "の", "を"],
      "Self-introduction. は marks the topic — 'as for me, student.'",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-8-mc-2",
      "がくせいです___。 (Are you a student?)",
      "がくせいですか",
      "か",
      ["は", "が", "の"],
      "か at the end of a statement turns it into a question.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-8-mc-3",
      "なまえ___ なんですか。 (What is your name?)",
      "なまえは なんですか",
      "は",
      ["が", "を", "の"],
      "なまえ is the topic — 'as for your name, what is it?'",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-8-mc-4",
      "ともだち___ せんせいです。 (My friend is a teacher.)",
      "ともだちは せんせいです",
      "は",
      ["が", "を", "に"],
      "ともだち = topic.",
    ),
  },
  {
    kind: "match",
    payload: {
      id: "ja-m3-8-match",
      type: "match_pairs",
      prompt: "Match each Japanese word to its meaning",
      pairs: [
        { id: "p1", source: "コーヒー", target: "coffee", sourceAnnotation: [{ surface: "コーヒー", reading: "コーヒー" }] },
        { id: "p2", source: "がくせい", target: "student", sourceAnnotation: [{ surface: "がくせい", reading: "がくせい" }] },
        { id: "p3", source: "ともだち", target: "friend", sourceAnnotation: [{ surface: "ともだち", reading: "ともだち" }] },
        { id: "p4", source: "ねこ", target: "cat", sourceAnnotation: [{ surface: "ねこ", reading: "ねこ" }] },
        { id: "p5", source: "ホテル", target: "hotel", sourceAnnotation: [{ surface: "ホテル", reading: "ホテル" }] },
        { id: "p6", source: "なまえ", target: "name", sourceAnnotation: [{ surface: "なまえ", reading: "なまえ" }] },
      ],
    } as MatchPairsStep,
  },
  {
    kind: "build",
    payload: {
      id: "ja-m3-8-build",
      type: "build_sentence",
      prompt: "Ask: What is your name?",
      targetSentence: "なまえは なんですか",
      tiles: ["なまえは", "なんですか", "どこですか", "わたしは"],
      correctOrder: ["なまえは", "なんですか"],
      granularity: "word",
      audioKey: "なまえは なんですか",
      targetAnnotation: [{ surface: "なまえは なんですか", reading: "なまえは なんですか" }],
    } as BuildSentenceStep,
  },
];

const M3_ROW_TEST: RowTestStep = {
  id: "ja-m3-8-test",
  type: "row_test",
  rowId: "m3",
  items: M3_TEST_ITEMS,
  passThreshold: 0.7,
  maxRetries: 3,
};

export const M3_8: LessonContent = {
  id: "ja-m3-8",
  moduleId: "m3",
  courseId: COURSE,
  languageId: LANG,
  title: "M3 Mastery Test",
  description: "Cumulative test of M3 grammar + vocab. Wrong answers re-queue — no fail.",
  estimatedMinutes: 6,
  xpReward: 30,
  steps: [
    infoStep(
      "ja-m3-8-info-open",
      "Module 3 mastery",
      "Cumulative items across particles, vocab, and sentence-building. Missed items re-queue at the back. Pass once and Module 3 is mastered.",
    ),
    M3_ROW_TEST,
    infoStep(
      "ja-m3-8-info-end",
      "Module 3 complete",
      "You can introduce yourself, ask basic questions, describe things, and have a short polite exchange. M4 deepens this with possessive の and the four-way pointer system これ/それ/あれ/どれ.",
      "win",
    ),
  ],
};
