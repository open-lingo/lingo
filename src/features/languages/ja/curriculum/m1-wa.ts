import type { LessonContent } from "@/features/lesson/types";
import {
  type RowContext,
  symbolIntro, traceTwice, recognition, symbolToSound,
  wordImageMcq, listeningBuild, speaking, listeningComp,
  priorRowReviewTail,
} from "@/features/languages/ja/curriculum/_consonantRowHelpers";

/**
 * Wa-row: わ を ん — three sub-lessons + auto row-test (~11 min).
 *
 * Three special kana to close out hiragana:
 *   - わ: standard 'wa' consonant + vowel pair.
 *   - を: pronounced 'o'. Used ONLY as the object-marking particle in
 *     modern Japanese — you'll see it but never start a word with it.
 *   - ん: syllabic nasal 'n'. Word-final or word-medial only — never
 *     starts a word. Its sound assimilates to the next consonant
 *     ('m' before /m,p,b/, 'ng' before /k,g/) — taught implicitly via
 *     the listening + speaking blocks.
 *
 * Split (1+1+1+test):
 *   1/4 — わ + かわ (river)
 *   2/4 — を particle + わたし (I/me — reinforces わ, no を-buildable word)
 *   3/4 — ん + ほん (book) + full-row review + speaking
 *   4/4 — Row-test (auto-built by buildRowTestLesson)
 *
 * Anchor words use only kana known by this point in the curriculum
 * (wa-row is the last basic row, so every prior kana is available):
 *   - かわ: わ (new) + に (na-row, known) — 2-mora, concrete noun
 *   - わたし: わ (new) + た (ta-row) + し (sa-row) — 3-mora, the most
 *     useful pronoun
 *   - ほん: ほ (ha-row) + ん (new) — 2-mora, ん in word-final position
 *
 * Speaking targets prefer 2-mora (Whisper short-tier 30/15): かわ, ほん.
 * わたし is 3-mora (mid-tier 60/40) but worth the inclusion — it's the
 * single most-used pronoun and learners will keep encountering it.
 *
 * Sub-2 deviates from the 2 kana + 1 word template because を has no
 * buildable content word in modern Japanese (it's a pure particle). We
 * use the sub-2 slot to introduce を, drill recognition + sound, and
 * reinforce わ via わたし — keeping the sub-lesson cadence intact.
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "わ", romaji: "wa" },
    { symbol: "を", romaji: "o" },
    { symbol: "ん", romaji: "n" },
  ],
  words: [
    { kana: "かわ",   meaningEn: "river", emoji: "🏞️" },
    { kana: "わたし", meaningEn: "I / me",    emoji: "🙋" },
    { kana: "ほん",   meaningEn: "book",      emoji: "📖" },
  ],
  tileBankPool: [
    "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の",
    "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も",
    "や", "ゆ", "よ",
    "ら", "り", "る", "れ", "ろ",
  ],
};

export const MOCK_LESSON_JA_M1_WA_1: LessonContent = {
  id: "ja-m1-wa-1",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Wa-row — Intro 1",
  description: "Meet わ. Build river.",
  estimatedMinutes: 3, xpReward: 8,
  introducesVocabIds: ["kawa"],
  steps: [
    { id: "ja-wa1-info-0", type: "info", title: "The final three",
      body: "Three special kana to close out hiragana: わ, を, ん. Start with わ — a standard 'wa' that opens words like かわ (river).",
      variant: "culture" },

    symbolIntro("ja-wa1-intro-wa", "わ", "wa", "/wa/", "like 'wa' in 'water'", "かわ (river)"),
    traceTwice("ja-wa1-trace-wa", "わ", "wa", "like 'wa' in 'water'"),
    recognition(ctx, "ja-wa1-recog-wa", "わ", "wa", "like 'wa' in 'water'"),

    wordImageMcq(ctx, "ja-wa1-mcq-kawa", "かわ"),
    listeningBuild(ctx, "ja-wa1-build-kawa", "かわ", "river"),

    symbolToSound(ctx, "ja-wa1-sts-wa", "わ", "wa", "like 'wa'"),

    { id: "ja-wa1-info-end", type: "info", title: "One down",
      body: "わ — and an river. Next: を, the particle kana.", variant: "default" },
  ],
};

export const MOCK_LESSON_JA_M1_WA_2: LessonContent = {
  id: "ja-m1-wa-2",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Wa-row — Intro 2",
  description: "Meet を (a particle, pronounced 'o') and build わたし (I/me).",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["watashi"],
  steps: [
    { id: "ja-wa2-info-0", type: "info", title: "を — the particle kana",
      body: "を is the odd one out. It looks like a wa-row glyph but it's pronounced 'o', and it's only used as a grammar particle — it marks the object of an action. You'll see it between words, never starting one.",
      variant: "culture" },

    symbolIntro("ja-wa2-intro-o", "を", "o", "/o/", "object-marker particle (pronounced 'o')",
      "パン を たべる (I eat bread)",
      "Spelled with the wa-row glyph but pronounced 'o'. Modern Japanese uses it only as a particle."),
    traceTwice("ja-wa2-trace-o", "を", "o", "particle 'o'"),
    recognition(ctx, "ja-wa2-recog-o", "を", "o", "particle 'o'"),

    // No buildable word for を — use the sub-2 build slot to reinforce
    // わ via わたし (the most useful pronoun in the language).
    wordImageMcq(ctx, "ja-wa2-mcq-watashi", "わたし"),
    listeningBuild(ctx, "ja-wa2-build-watashi", "わたし", "I / me"),

    listeningComp("ja-wa2-lc-kawa",    "かわ",   "kawa",    "river",
      ["I / me", "book", "cat"]),
    listeningComp("ja-wa2-lc-watashi", "わたし", "watashi", "I / me",
      ["river", "mountain", "person"]),

    symbolToSound(ctx, "ja-wa2-sts-o", "を", "o", "particle 'o'"),

    // Survival callout — ありがとう introduces ん-adjacent う in word-
    // final context that the learner will hear constantly.
    { id: "ja-wa2-info-arigatou", type: "info", title: "Real-world Japanese",
      body: "ありがとう (arigatou) — \"thank you.\" The other essential traveller phrase. You'll meet が (voiced か) in the next module; for now, just notice it ends with う, not ん — that 'oo' tail is part of polite-form.",
      variant: "culture" },

    { id: "ja-wa2-info-end", type: "info", title: "Two down",
      body: "Just ん left — and a full-row review with mic practice.", variant: "default" },
  ],
};

export const MOCK_LESSON_JA_M1_WA_3: LessonContent = {
  id: "ja-m1-wa-3",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Wa-row — Review",
  description: "Last kana (ん), build book, sweep + speak.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["hon"],
  steps: [
    { id: "ja-wa3-info-0", type: "info", title: "ん — the syllabic nasal",
      body: "ん is a 'n' that's a syllable by itself. It NEVER starts a word — it only ends syllables (like ほん 'book' or にほん 'Japan') or sits between them. Its sound shifts slightly depending on what comes next, but in isolation it's just 'n'.",
      variant: "culture" },

    symbolIntro("ja-wa3-intro-n", "ん", "n", "/ɴ/", "syllabic 'n' — ends syllables, never starts a word",
      "ほん (book), にほん (Japan)",
      "Never word-initial. Sound shifts: 'm' before m/p/b, 'ng' before k/g — picked up by ear."),
    traceTwice("ja-wa3-trace-n", "ん", "n", "syllabic 'n'"),
    recognition(ctx, "ja-wa3-recog-n", "ん", "n", "syllabic 'n'"),

    wordImageMcq(ctx, "ja-wa3-mcq-hon", "ほん"),
    listeningBuild(ctx, "ja-wa3-build-hon", "ほん", "book"),

    // Single representative row-sweep recog — the row-test covers all 3.
    recognition(ctx, "ja-wa3-rev-o",  "を", "o",  "particle 'o'"),

    wordImageMcq(ctx, "ja-wa3-mcq-rev-kawa", "かわ"),

    listeningComp("ja-wa3-lc-hon", "ほん", "hon", "book",
      ["river", "I / me", "snow"]),

    { id: "ja-wa3-info-speak", type: "info", title: "Your turn to speak",
      body: "Tap the mic and say each word. わたし is 3 syllables so the recognizer is a touch stricter — speak clearly.", variant: "tip" },
    speaking("ja-wa3-speak-kawa",    "かわ",   "river"),
    speaking("ja-wa3-speak-hon",     "ほん",   "book"),
    listeningComp("ja-wa3-lc-kawa", "かわ", "kawa", "river",
      ["book", "I / me", "mountain"]),
    speaking("ja-wa3-speak-watashi", "わたし", "I / me"),

    // R2-defer-F prior-row review tail — vowels through ra pool (the
    // richest one, since wa is the last basic row).
    ...priorRowReviewTail("wa"),

    { id: "ja-wa3-info-end", type: "info", title: "Real-world win — hiragana complete",
      body: "Every basic hiragana, done. That's わたし (I/me), ほん (book), かわ (river) — and the entire 46-character chart you'll see on furigana above kanji in children's books, in karaoke lyrics, in nearly every manga panel. Next module: voicing (dakuten + handakuten).",
      variant: "win" },
  ],
};
