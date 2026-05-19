import type { LessonContent } from "../types";
import {
  type RowContext,
  symbolIntro, traceTwice, recognition, symbolToSound,
  wordImageMcq, listeningBuild, speaking, listeningComp,
  priorRowReviewTail,
} from "./_consonantRowHelpers";

/**
 * Ya-row: や ゆ よ — three sub-lessons + auto row-test (~11 min).
 *
 * Only three kana in this row — Japanese has no separate 'yi' or 'ye'
 * symbols in the standard syllabary. Adopts the 1+1+1+test split: one
 * new kana plus one anchor word per sub-lesson, then the row-test.
 *
 *   1/4 — や + やま (mountain)
 *   2/4 — ゆ + ゆき (snow)
 *   3/4 — よ + よむ (to read) + full-row review + speaking
 *   4/4 — Row-test (auto-built by buildRowTestLesson)
 *
 * Words use only pure-known kana from prior rows:
 *   - やま: や (new) + ま (ma-row, known)
 *   - ゆき: ゆ (new) + き (ka-row, known)
 *   - よむ: よ (new) + む (ma-row, known)
 *
 * Speaking targets (all 2-mora, Whisper short-tier): やま, ゆき, よむ.
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "や", romaji: "ya" },
    { symbol: "ゆ", romaji: "yu" },
    { symbol: "よ", romaji: "yo" },
  ],
  words: [
    { kana: "やま", meaningEn: "mountain", emoji: "⛰️" },
    { kana: "ゆき", meaningEn: "snow",     emoji: "❄️" },
    { kana: "よむ", meaningEn: "to read",  emoji: "📚" },
  ],
  tileBankPool: [
    "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の",
    "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も",
  ],
};

export const MOCK_LESSON_JA_M1_YA_1: LessonContent = {
  id: "ja-m1-ya-1",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ya-row — Intro 1",
  description: "Meet や. Build mountain.",
  estimatedMinutes: 3, xpReward: 8,
  introducesVocabIds: ["yama"],
  steps: [
    { id: "ja-ya1-info-0", type: "info", title: "Y-sounds (just three)",
      body: "Only three kana this row — や, ゆ, よ. Japanese skips 'yi' and 'ye'; the syllabary doesn't have separate symbols for them.",
      variant: "culture" },

    symbolIntro("ja-ya1-intro-ya", "や", "ya", "/ja/", "like 'ya' in 'yard'", "やま (mountain)"),
    traceTwice("ja-ya1-trace-ya", "や", "ya", "like 'ya' in 'yard'"),
    recognition(ctx, "ja-ya1-recog-ya", "や", "ya", "like 'ya' in 'yard'"),

    wordImageMcq(ctx, "ja-ya1-mcq-yama", "やま"),
    listeningBuild(ctx, "ja-ya1-build-yama", "やま", "mountain"),

    symbolToSound(ctx, "ja-ya1-sts-ya", "や", "ya", "like 'ya'"),

    { id: "ja-ya1-info-end", type: "info", title: "One down",
      body: "や — and a mountain. Next: ゆ and a snowy word.", variant: "default" },
  ],
};

export const MOCK_LESSON_JA_M1_YA_2: LessonContent = {
  id: "ja-m1-ya-2",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ya-row — Intro 2",
  description: "Add ゆ. Build snow.",
  estimatedMinutes: 3, xpReward: 8,
  introducesVocabIds: ["yuki"],
  steps: [
    { id: "ja-ya2-info-0", type: "info", title: "Y-sounds, part 2",
      body: "ゆ is just the English word 'you' said quickly. Build ゆき — snow.",
      variant: "default" },

    symbolIntro("ja-ya2-intro-yu", "ゆ", "yu", "/jɯ/", "like 'you' (clipped)", "ゆき (snow)"),
    traceTwice("ja-ya2-trace-yu", "ゆ", "yu", "like 'you'"),
    recognition(ctx, "ja-ya2-recog-yu", "ゆ", "yu", "like 'you'"),

    wordImageMcq(ctx, "ja-ya2-mcq-yuki", "ゆき"),
    listeningBuild(ctx, "ja-ya2-build-yuki", "ゆき", "snow"),

    listeningComp("ja-ya2-lc-yama", "やま", "yama", "mountain",
      ["snow", "boat", "person"]),
    listeningComp("ja-ya2-lc-yuki", "ゆき", "yuki", "snow",
      ["mountain", "moon", "cat"]),

    symbolToSound(ctx, "ja-ya2-sts-yu", "ゆ", "yu", "like 'you'"),

    { id: "ja-ya2-info-end", type: "info", title: "Two down",
      body: "Just よ left — plus a full-row review with mic practice.", variant: "default" },
  ],
};

export const MOCK_LESSON_JA_M1_YA_3: LessonContent = {
  id: "ja-m1-ya-3",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ya-row — Review",
  description: "Last kana (よ), build 'to read', sweep + speak.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["yomu"],
  steps: [
    { id: "ja-ya3-info-0", type: "info", title: "Y-sounds, finale",
      body: "Meet よ, build one more word, then sweep the row.", variant: "default" },

    symbolIntro("ja-ya3-intro-yo", "よ", "yo", "/jo/", "like 'yo' in 'yoga'", "よむ (to read)"),
    traceTwice("ja-ya3-trace-yo", "よ", "yo", "like 'yo' in 'yoga'"),
    recognition(ctx, "ja-ya3-recog-yo", "よ", "yo", "like 'yo'"),

    wordImageMcq(ctx, "ja-ya3-mcq-yomu", "よむ"),
    listeningBuild(ctx, "ja-ya3-build-yomu", "よむ", "to read"),

    // Single representative row-sweep recog — the row-test covers all 3.
    recognition(ctx, "ja-ya3-rev-yu", "ゆ", "yu", "like 'you'"),

    wordImageMcq(ctx, "ja-ya3-mcq-rev-yuki", "ゆき"),

    { id: "ja-ya3-info-speak", type: "info", title: "Your turn to speak",
      body: "Tap the mic and say each word. Short words = lenient scoring.", variant: "tip" },
    speaking("ja-ya3-speak-yama", "やま", "mountain"),
    speaking("ja-ya3-speak-yuki", "ゆき", "snow"),
    speaking("ja-ya3-speak-yomu", "よむ", "to read"),

    // R2-defer-F prior-row review tail — vowels through ma pool.
    ...priorRowReviewTail("ya"),

    { id: "ja-ya3-info-end", type: "info", title: "Real-world win",
      body: "You can now read やま (mountain), ゆき (snow), よむ (to read) — and the title kanji-furigana of most onomatopoeia-heavy manga panels: バキッ, ドキドキ. Up next — ra row.",
      variant: "win" },
  ],
};
