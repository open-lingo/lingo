import type { LessonContent, LessonStep } from "../types";
import { getTtsUrl } from "@/shared/japanese/tts";

/**
 * Ka-row: か き く け こ — two sub-lessons (~12 minutes total).
 *
 * Ports the vowel-lesson structure (2026-05-16) to ka-row + folds in
 * Whisper-backed speaking practice in 2/2.
 *
 * Anchor words are all PURE ka+vowel — the user never sees an
 * unintroduced kana on a word card:
 *   1/2 — かい (shell), いけ (pond), かお (face)
 *   2/2 — こえ (voice), えき (station)
 *
 * Speaking targets (2-mora each, fits Whisper's short-tier 30/15
 * threshold per moraTiers.ts): かお, いけ, こえ. Whisper hot-start cost
 * is paid once at the start of the 2/2 speaking block, not sprinkled.
 *
 * Lesson ids `ja-m1-ka-1` / `ja-m1-ka-2` match the row-cluster pattern
 * so the pathway shows ka as one disc with two progress dots (matches
 * vowels' visual treatment).
 */

const ALL_KA = [
  { symbol: "か", romaji: "ka" },
  { symbol: "き", romaji: "ki" },
  { symbol: "く", romaji: "ku" },
  { symbol: "け", romaji: "ke" },
  { symbol: "こ", romaji: "ko" },
];

// Tiles for listening_build. Vowels + ka-row only, plus one duplicate
// of each repeated character used in our anchor words. Sized so each
// build has just enough tiles to feel intentional, not overwhelming.
const KA_TILES = ["か", "き", "く", "け", "こ", "あ", "い", "う", "え", "お"];

type KaWord = {
  kana: string;
  meaningEn: string;
  emoji: string;
};

const KA_WORDS: KaWord[] = [
  { kana: "かい", meaningEn: "shell",   emoji: "🐚" },
  { kana: "いけ", meaningEn: "pond",    emoji: "🪷" },
  { kana: "かお", meaningEn: "face",    emoji: "😀" },
  { kana: "こえ", meaningEn: "voice",   emoji: "🗣️" },
  { kana: "えき", meaningEn: "station", emoji: "🚉" },
];

function pickThreeKanaDistractors(symbol: string) {
  return ALL_KA.filter((v) => v.symbol !== symbol).slice(0, 3);
}

function correctSlot(id: string, slots = 4): number {
  return id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % slots;
}

function symbolIntro(
  id: string,
  symbol: string,
  romanization: string,
  ipa: string,
  hint: string,
  example: string,
): LessonStep {
  return {
    id,
    type: "symbol_intro",
    payload: {
      symbol,
      romanization,
      ipa,
      hint,
      example,
      scriptId: "hiragana",
      hasStrokeOrder: true,
    },
  };
}

function traceTwice(
  id: string,
  symbol: string,
  romanization: string,
  hint: string,
): LessonStep {
  return {
    id,
    type: "symbol_trace",
    payload: {
      symbol,
      romanization,
      ipa: "",
      hint,
      scriptId: "hiragana",
      hasStrokeOrder: true,
    },
    showGuide: true,
    minCorrectAttempts: 2,
  };
}

function traceOnce(
  id: string,
  symbol: string,
  romanization: string,
  hint: string,
): LessonStep {
  return {
    id,
    type: "symbol_trace",
    payload: {
      symbol,
      romanization,
      ipa: "",
      hint,
      scriptId: "hiragana",
      hasStrokeOrder: true,
    },
    showGuide: true,
    minCorrectAttempts: 1,
  };
}

function recognition(
  id: string,
  symbol: string,
  romanization: string,
  hint: string,
): LessonStep {
  const distractors = pickThreeKanaDistractors(symbol);
  const slot = correctSlot(id);
  const options: { id: string; symbol: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", symbol });
    } else {
      options.push({ id: `opt-${i}`, symbol: distractors[di++].symbol });
    }
  }
  return {
    id,
    type: "symbol_recognition",
    payload: {
      symbol,
      romanization,
      ipa: "",
      hint,
      scriptId: "hiragana",
      hasStrokeOrder: true,
      audioKey: getTtsUrl(symbol) ?? undefined,
    },
    options,
    correctOptionId: "correct",
  };
}

function symbolToSound(
  id: string,
  symbol: string,
  romanization: string,
  hint: string,
): LessonStep {
  const correct = ALL_KA.find((v) => v.symbol === symbol)!;
  const distractors = pickThreeKanaDistractors(symbol);
  const slot = correctSlot(id);
  const options: { id: string; text: string; symbol: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", text: correct.romaji, symbol: correct.symbol });
    } else {
      const d = distractors[di++];
      options.push({ id: `opt-${i}`, text: d.romaji, symbol: d.symbol });
    }
  }
  return {
    id,
    type: "symbol_to_sound",
    payload: {
      symbol,
      romanization,
      ipa: "",
      hint,
      scriptId: "hiragana",
      hasStrokeOrder: true,
    },
    options,
    correctOptionId: "correct",
  };
}

/**
 * word_image_mcq — 2×2 grid. Distractors drawn from the closed KA_WORDS
 * set so every option's emoji + kana is part of the ka-row vocab.
 */
function wordImageMcq(id: string, correctKana: string): LessonStep {
  const correct = KA_WORDS.find((w) => w.kana === correctKana);
  if (!correct) throw new Error(`wordImageMcq: unknown ka word ${correctKana}`);
  const distractors = KA_WORDS.filter((w) => w.kana !== correctKana).slice(0, 3);
  const slot = correctSlot(id);
  const options: { id: string; word: string; emoji: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", word: correct.kana, emoji: correct.emoji });
    } else {
      const d = distractors[di++];
      options.push({ id: `opt-${i}`, word: d.kana, emoji: d.emoji });
    }
  }
  return {
    id,
    type: "word_image_mcq",
    meaningEn: correct.meaningEn,
    options,
    correctOptionId: "correct",
  };
}

function listeningBuild(
  id: string,
  word: string,
  meaning: string,
): LessonStep {
  return {
    id,
    type: "listening_build",
    audioKey: word,
    prompt: `Listen and build the word for '${meaning}'`,
    targetSentence: word,
    tiles: KA_TILES,
    correctOrder: Array.from(word),
    granularity: "character",
    targetAnnotation: [{ surface: word, reading: word }],
  };
}

/**
 * Whisper-backed speaking step. The renderer (SpeakingStepView) reads
 * from useWhisperRecognition + scoreAlternatives — no extra config
 * needed here. `stubbed: true` is required by the type but doesn't
 * gate functionality.
 */
function speaking(id: string, word: string, meaning: string): LessonStep {
  return {
    id,
    type: "speaking",
    targetPhrase: word,
    translation: meaning,
    stubbed: true,
    targetAnnotation: [{ surface: word, reading: word }],
  };
}

function listeningComp(
  id: string,
  word: string,
  romaji: string,
  correctMeaning: string,
  decoys: [string, string, string],
): LessonStep {
  return {
    id,
    type: "listening_comprehension",
    audioKey: word,
    transcript: word,
    romaji,
    question: "What does this word mean?",
    options: [
      { id: "a", text: correctMeaning },
      { id: "b", text: decoys[0] },
      { id: "c", text: decoys[1] },
      { id: "d", text: decoys[2] },
    ],
    correctOptionId: "a",
    transcriptAnnotation: [{ surface: word, reading: word }],
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 1/2 — meet ka-row + 3 anchor words
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_KA_1: LessonContent = {
  id: "ja-m1-ka-1",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Ka-row — Intro 1",
  description:
    "Meet か き く け こ and three first words: shell, pond, face.",
  estimatedMinutes: 6,
  xpReward: 14,
  introducesVocabIds: ["kai", "ike", "kao"],
  steps: [
    {
      id: "ja-ka1-info-0",
      type: "info",
      title: "The k-sounds",
      body:
        "Each ka-row kana adds a 'k-' to a vowel you already know: ka, ki, ku, ke, ko. Trace, recognize, then build words.",
      variant: "culture",
    },

    // か + き, then build かい (shell)
    symbolIntro("ja-ka1-intro-ka", "か", "ka", "/ka/", "like 'ka' in 'car'", "かい (shell)"),
    traceTwice("ja-ka1-trace-ka", "か", "ka", "like 'ka' in 'car'"),
    recognition("ja-ka1-recog-ka", "か", "ka", "like 'ka' in 'car'"),

    symbolIntro("ja-ka1-intro-ki", "き", "ki", "/ki/", "like 'kee' in 'key'", "かい (shell)"),
    traceTwice("ja-ka1-trace-ki", "き", "ki", "like 'kee' in 'key'"),
    recognition("ja-ka1-recog-ki", "き", "ki", "like 'kee' in 'key'"),

    wordImageMcq("ja-ka1-mcq-kai", "かい"),
    listeningBuild("ja-ka1-build-kai", "かい", "shell"),

    // く + け, then build いけ (pond)
    symbolIntro("ja-ka1-intro-ku", "く", "ku", "/kɯ/", "like 'koo' in 'cuckoo'", "いけ (pond)"),
    traceTwice("ja-ka1-trace-ku", "く", "ku", "like 'koo' in 'cuckoo'"),
    recognition("ja-ka1-recog-ku", "く", "ku", "like 'koo' in 'cuckoo'"),

    symbolIntro("ja-ka1-intro-ke", "け", "ke", "/ke/", "like 'ke' in 'kept'", "いけ (pond)"),
    traceTwice("ja-ka1-trace-ke", "け", "ke", "like 'ke' in 'kept'"),
    recognition("ja-ka1-recog-ke", "け", "ke", "like 'ke' in 'kept'"),

    wordImageMcq("ja-ka1-mcq-ike", "いけ"),
    listeningBuild("ja-ka1-build-ike", "いけ", "pond"),

    // こ, then build かお (face)
    symbolIntro("ja-ka1-intro-ko", "こ", "ko", "/ko/", "like 'ko' in 'koala'", "かお (face)"),
    traceTwice("ja-ka1-trace-ko", "こ", "ko", "like 'ko' in 'koala'"),
    recognition("ja-ka1-recog-ko", "こ", "ko", "like 'ko' in 'koala'"),

    wordImageMcq("ja-ka1-mcq-kao", "かお"),
    listeningBuild("ja-ka1-build-kao", "かお", "face"),

    // Final round — harder direction (kana → romaji).
    symbolToSound("ja-ka1-sts-ka", "か", "ka", "like 'ka' in 'car'"),
    symbolToSound("ja-ka1-sts-ki", "き", "ki", "like 'kee' in 'key'"),
    symbolToSound("ja-ka1-sts-ku", "く", "ku", "like 'koo' in 'cuckoo'"),
    symbolToSound("ja-ka1-sts-ke", "け", "ke", "like 'ke' in 'kept'"),
    symbolToSound("ja-ka1-sts-ko", "こ", "ko", "like 'ko' in 'koala'"),

    {
      id: "ja-ka1-info-end",
      type: "info",
      title: "Halfway through ka-row",
      body:
        "Five k-sounds met, three words built. Next sub-lesson: refresh + two more words + a chance to say them.",
      variant: "default",
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 2/2 — refresh + 2 more words + speaking
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_KA_2: LessonContent = {
  id: "ja-m1-ka-2",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Ka-row — Intro 2",
  description:
    "Refresh the five kana, add 'voice' and 'station', then say three words out loud.",
  estimatedMinutes: 6,
  xpReward: 14,
  introducesVocabIds: ["koe", "eki"],
  steps: [
    {
      id: "ja-ka2-info-0",
      type: "info",
      title: "Ka-row — round 2",
      body:
        "One more pass through each kana, two new words, then your mic comes out — you'll say the words you just learned.",
      variant: "default",
    },

    // One trace per kana
    traceOnce("ja-ka2-trace-ka", "か", "ka", "like 'ka' in 'car'"),
    traceOnce("ja-ka2-trace-ki", "き", "ki", "like 'kee' in 'key'"),
    traceOnce("ja-ka2-trace-ku", "く", "ku", "like 'koo' in 'cuckoo'"),
    traceOnce("ja-ka2-trace-ke", "け", "ke", "like 'ke' in 'kept'"),
    traceOnce("ja-ka2-trace-ko", "こ", "ko", "like 'ko' in 'koala'"),

    // Recognition pass-through
    recognition("ja-ka2-recog-ka", "か", "ka", "like 'ka' in 'car'"),
    recognition("ja-ka2-recog-ki", "き", "ki", "like 'kee' in 'key'"),
    recognition("ja-ka2-recog-ku", "く", "ku", "like 'koo' in 'cuckoo'"),
    recognition("ja-ka2-recog-ke", "け", "ke", "like 'ke' in 'kept'"),
    recognition("ja-ka2-recog-ko", "こ", "ko", "like 'ko' in 'koala'"),

    // Two new words — discover then build
    wordImageMcq("ja-ka2-mcq-koe", "こえ"),
    listeningBuild("ja-ka2-build-koe", "こえ", "voice"),

    wordImageMcq("ja-ka2-mcq-eki", "えき"),
    listeningBuild("ja-ka2-build-eki", "えき", "station"),

    // Meaning lock-in — hear word, pick meaning
    listeningComp("ja-ka2-lc-kai", "かい", "kai", "shell", ["pond", "face", "voice"]),
    listeningComp("ja-ka2-lc-ike", "いけ", "ike", "pond", ["station", "face", "shell"]),
    listeningComp("ja-ka2-lc-koe", "こえ", "koe", "voice", ["station", "face", "pond"]),
    listeningComp("ja-ka2-lc-eki", "えき", "eki", "station", ["voice", "shell", "pond"]),

    // SPEAKING block — 3 anchor words, all 2-mora (Whisper short-tier).
    // Hot-starts the Whisper worker on the first card; subsequent cards
    // reuse the warmed pipeline.
    {
      id: "ja-ka2-info-speak",
      type: "info",
      title: "Your turn to speak",
      body:
        "Tap the mic and say each word. Don't worry about perfect — the recognizer is lenient on short words.",
      variant: "tip",
    },
    speaking("ja-ka2-speak-kao", "かお", "face"),
    speaking("ja-ka2-speak-ike", "いけ", "pond"),
    speaking("ja-ka2-speak-koe", "こえ", "voice"),

    // Final symbol_to_sound round — kana → romaji recall
    symbolToSound("ja-ka2-sts-ka", "か", "ka", "like 'ka' in 'car'"),
    symbolToSound("ja-ka2-sts-ki", "き", "ki", "like 'kee' in 'key'"),
    symbolToSound("ja-ka2-sts-ku", "く", "ku", "like 'koo' in 'cuckoo'"),
    symbolToSound("ja-ka2-sts-ke", "け", "ke", "like 'ke' in 'kept'"),
    symbolToSound("ja-ka2-sts-ko", "こ", "ko", "like 'ko' in 'koala'"),

    {
      id: "ja-ka2-info-end",
      type: "info",
      title: "Ka-row complete!",
      body:
        "Five kana mastered. Five words: かい, いけ, かお, こえ, えき. Next row: sa.",
      variant: "default",
    },
  ],
};
