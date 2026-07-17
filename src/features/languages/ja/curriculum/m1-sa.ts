import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { getTtsUrl } from "@/shared/tts";
import {
  correctSlot,
  listeningComp,
  priorRowReviewTail,
  speaking,
} from "@/features/languages/ja/curriculum/_consonantRowHelpers";

/**
 * Sa-row: さ し す せ そ — three sub-lessons + row-test (~12 min total).
 *
 * Adopts the 2+2+1+review pattern (2026-05-16, after vowel + ka pilots):
 *   1/4 — 2 kana (さ, し) + 1 word (あさ morning)
 *   2/4 — 2 kana (す, せ) + 1 word (すし sushi)
 *   3/4 — 1 kana (そ) + 1 word (うそ lie) + 5-kana recognition rotation
 *         + 1 cross-sub word_image_mcq + 3 speaking targets
 *   4/4 — Row-test (auto-built by buildRowTestLesson)
 *
 * The 'shi' quirk lives in the し intro hint + a note field. し is NOT
 * romanized as 'si' anywhere in this lesson.
 *
 * Anchor words are all pure consonant + already-known kana (vowels + ka
 * row + the sa kana introduced earlier in the lesson). Tile banks
 * include the required kana plus a handful of random others from prior
 * rows — beginners can scan past unused tiles without overload, and
 * the random distractors prevent "only-correct-tiles-show" pattern
 * memorization.
 */

const ALL_SA = [
  { symbol: "さ", romaji: "sa" },
  { symbol: "し", romaji: "shi" },
  { symbol: "す", romaji: "su" },
  { symbol: "せ", romaji: "se" },
  { symbol: "そ", romaji: "so" },
];

type SaWord = {
  kana: string;
  meaningEn: string;
  emoji: string;
};

const SA_WORDS: SaWord[] = [
  { kana: "あさ", meaningEn: "morning", emoji: "🌅" },
  { kana: "すし", meaningEn: "sushi",   emoji: "🍣" },
  { kana: "そら", meaningEn: "sky",     emoji: "☁️" },
];

// Tile bank per build step: required kana + 3 random extras from prior
// rows so the user can't pattern-match "only the required tiles are
// shown." Order is irrelevant; the user picks the right pair.
function buildTileBank(required: string[]): string[] {
  const extras = ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ"]
    .filter((t) => !required.includes(t));
  // Deterministic 3-pick — id-hash would be overkill for static lesson
  // content; first 3 are fine since the tiles are just decoys.
  return [...required, ...extras.slice(0, 3)];
}

// `correctSlot` imported from _consonantRowHelpers — see mock-ja-m1-l1
// for context (2026-05-18 audit upgraded the hash for low-bit fairness).

function pickThreeKanaDistractors(symbol: string) {
  return ALL_SA.filter((v) => v.symbol !== symbol).slice(0, 3);
}

function symbolIntro(
  id: string,
  symbol: string,
  romanization: string,
  ipa: string,
  hint: string,
  example: string,
  note?: string,
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
      note,
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
    if (i === slot) options.push({ id: "correct", symbol });
    else options.push({ id: `opt-${i}`, symbol: distractors[di++].symbol });
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
  const correct = ALL_SA.find((v) => v.symbol === symbol)!;
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
 * word_image_mcq — 2×2 grid. Distractors drawn from the closed SA_WORDS
 * set (3 entries → uses all 3 + the correct one). For sub 3 (cumulative
 * review) we want exactly the row's 3 words rotating through.
 */
function wordImageMcq(id: string, correctKana: string): LessonStep {
  const correct = SA_WORDS.find((w) => w.kana === correctKana);
  if (!correct) throw new Error(`wordImageMcq: unknown sa word ${correctKana}`);
  // For sa row we have exactly 3 words; closed-set distractor pool is
  // [the other two]. The MCQ has 4 slots — pad with a vowel-lesson word
  // as a fourth option so the grid stays 2×2.
  const others = SA_WORDS.filter((w) => w.kana !== correctKana);
  const extras: SaWord[] = [
    { kana: "あい", meaningEn: "love",  emoji: "❤️" },
    { kana: "いえ", meaningEn: "house", emoji: "🏠" },
  ];
  const distractors = [...others, ...extras].slice(0, 3);
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
  const required = Array.from(new Set(Array.from(word)));
  return {
    id,
    type: "listening_build",
    audioKey: word,
    prompt: `Listen and build the word for '${meaning}'`,
    targetSentence: word,
    tiles: buildTileBank(required),
    correctOrder: Array.from(word),
    granularity: "character",
    targetAnnotation: [{ surface: word, reading: word }],
  };
}

// `speaking` imported from _consonantRowHelpers — the local copy was
// shadowing the import with `stubbed: true`, which silently routed every
// sa-row speaking step (asa, sushi, sora, sushi-desu) into the legacy
// "I said it!" placeholder. Fixed 2026-05-18 after tester report
// ("asa wasn't letting my friend use it"). Now graduates to the
// Whisper-graded mic flow alongside ka/ta/na/ha/ma/ya/ra/wa rows.

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 1/4 — meet さ + し, build あさ (morning)
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_SA_1: LessonContent = {
  id: "ja-m1-sa-1",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Sa-row — Intro 1",
  description: "Meet さ and し (pronounced 'shi', not 'si'). Build morning.",
  estimatedMinutes: 4,
  xpReward: 10,
  introducesVocabIds: ["asa"],
  steps: [

    symbolIntro(
      "ja-sa1-intro-sa",
      "さ",
      "sa",
      "/sa/",
      "like 'sa' in 'salsa'",
      "あさ (morning)",
    ),
    traceTwice("ja-sa1-trace-sa", "さ", "sa", "like 'sa' in 'salsa'"),
    recognition("ja-sa1-recog-sa", "さ", "sa", "like 'sa' in 'salsa'"),

    symbolIntro(
      "ja-sa1-intro-shi",
      "し",
      "shi",
      "/ɕi/",
      "like 'she' in 'sheet'",
      "あさ (morning)",
      // Single mention of the 'shi not si' quirk lives here — no longer
      // repeated in the opener info card or the hint string.
      "Pronounced 'shi', not 'si'.",
    ),
    traceTwice("ja-sa1-trace-shi", "し", "shi", "like 'she' in 'sheet'"),
    recognition("ja-sa1-recog-shi", "し", "shi", "like 'she' in 'sheet'"),

    wordImageMcq("ja-sa1-mcq-asa", "あさ"),
    listeningBuild("ja-sa1-build-asa", "あさ", "morning"),

    // Final round for THIS sub-lesson's kana only (kana → romaji).
    symbolToSound("ja-sa1-sts-sa", "さ", "sa", "like 'sa' in 'salsa'"),
    symbolToSound("ja-sa1-sts-shi", "し", "shi", "like 'she' in 'sheet'"),

  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 2/4 — meet す + せ, build すし (sushi)
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_SA_2: LessonContent = {
  id: "ja-m1-sa-2",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Sa-row — Intro 2",
  description: "Add す and せ, then build sushi.",
  estimatedMinutes: 4,
  xpReward: 10,
  introducesVocabIds: ["sushi"],
  steps: [

    symbolIntro(
      "ja-sa2-intro-su",
      "す",
      "su",
      "/sɯ/",
      "like 'sue' (slightly clipped)",
      "すし (sushi)",
    ),
    traceTwice("ja-sa2-trace-su", "す", "su", "like 'sue'"),
    recognition("ja-sa2-recog-su", "す", "su", "like 'sue'"),

    // せ has no clean pure-known-kana anchor word at this point in the
    // curriculum. Skip the example field rather than tease a word the
    // user won't build (せかい requires unintroduced か from later? no,
    // か is ka-row, already met — but the WORD は never built in this
    // lesson, which Jordan + Robert flagged as a dangling thread).
    symbolIntro("ja-sa2-intro-se", "せ", "se", "/se/", "like 'se' in 'sell'", ""),
    traceTwice("ja-sa2-trace-se", "せ", "se", "like 'se' in 'sell'"),
    recognition("ja-sa2-recog-se", "せ", "se", "like 'se' in 'sell'"),

    wordImageMcq("ja-sa2-mcq-sushi", "すし"),
    listeningBuild("ja-sa2-build-sushi", "すし", "sushi"),

    // Listening comprehension — adds a different drill type to break the
    // intro→trace→recog rhythm Mio + Jordan flagged as monotone. Routed
    // through `listeningComp` factory (2026-05-18) so the correct slot
    // is rotated by id hash, not always position 0.
    listeningComp("ja-sa2-lc-sushi", "すし", "sushi", "sushi", ["morning", "shell", "face"]),

    symbolToSound("ja-sa2-sts-su", "す", "su", "like 'sue'"),
    symbolToSound("ja-sa2-sts-se", "せ", "se", "like 'se' in 'sell'"),

    // Survival-phrase culture card. すみません ("excuse me / sorry")
    // teaches す in real-use context. The other kana (み, ま, せ, ん)
    // arrive in later rows — AnnotatedJa renders romaji helpers above
    // them. By design (per curriculum file header curation rules).

  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 3/4 — meet そ, build うそ, full row review + speaking
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_SA_3: LessonContent = {
  id: "ja-m1-sa-3",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Sa-row — Review",
  description:
    "Last kana (そ), one more word, then a full-row refresh + speak it out loud.",
  estimatedMinutes: 5,
  xpReward: 12,
  introducesVocabIds: ["uso"],
  steps: [

    symbolIntro(
      "ja-sa3-intro-so",
      "そ",
      "so",
      "/so/",
      "like 'so' in 'sole'",
      "そら (sky)",
    ),
    traceTwice("ja-sa3-trace-so", "そ", "so", "like 'so' in 'sole'"),
    recognition("ja-sa3-recog-so", "そ", "so", "like 'so' in 'sole'"),

    wordImageMcq("ja-sa3-mcq-sora", "そら"),
    listeningBuild("ja-sa3-build-sora", "そら", "sky"),

    // Single representative row-sweep recog — the row-test that follows
    // covers the full 5-kana sweep.
    recognition("ja-sa3-rev-shi", "し", "shi", "like 'she'"),

    // Cumulative vocab — one MCQ pulling across all 3 sa words.
    wordImageMcq("ja-sa3-mcq-rev-sushi", "すし"),

    // Speaking — 3 anchor words, all 2-mora (Whisper short-tier).
    speaking("ja-sa3-speak-asa",   "あさ", "morning"),
    speaking("ja-sa3-speak-sushi", "すし", "sushi"),
    listeningComp("ja-sa3-lc-asa", "あさ", "asa", "morning",
      ["sushi", "sky", "shell"]),
    speaking("ja-sa3-speak-sora",  "そら", "sky"),

    // ─── Sentence sprinkle (M1 desu/ka — Spencer 2026-05-17) ───
    // Build it, then speak it. です + か introduced on ka-3; no re-explain.
    {
      id: "ja-sa3-build-sushi-desu",
      type: "build_sentence",
      prompt: "Build: 'It's sushi.'",
      targetSentence: "すし です",
      tiles: ["すし", "です", "そら", "ですか"],
      correctOrder: ["すし", "です"],
      granularity: "word",
      audioKey: "すし です",
      targetAnnotation: [{ surface: "すし です", reading: "すし です" }],
    },
    speaking("ja-sa3-speak-sushi-desu", "すし です", "It's sushi."),

    // Removed: redundant 5× symbol_to_sound block. The row-test
    // (sub-lesson 4/4) drills kana→romaji recall already; doubling
    // it here padded the lesson to 17–21 steps for no gain (flagged
    // by Mio, Jordan, Robert).

    // R2-defer-F prior-row review tail — vowels + ka pool. Pulls
    // retrieval before the closing win card.
    ...priorRowReviewTail("sa"),

  ],
};
