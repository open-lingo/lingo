/**
 * Per-language preview lessons for the public `/try` route.
 *
 * A preview lesson is a short taste — 8 steps, ~2-3 minutes — that a
 * visitor can complete without signing up. Reuses the existing
 * `LessonStep` union so the standard step renderers work as-is. The
 * preview runner deliberately strips all persistence / mastery / XP
 * machinery so trying the preview never mutates user state.
 *
 * Content authoring rules (apply to every language preview):
 *   - Teach before you test — never quiz a word/phrase before a teach,
 *     match, or correct-option MCQ has introduced it (the greeting finale
 *     is taught in step 1).
 *   - No two adjacent steps share a type — vary the interaction so it
 *     never feels like the same drill twice.
 *   - Lead with words a zero-knowledge English speaker half-knows
 *     (loanwords/cognates) for early wins; romaji stays on (teaching aid
 *     for a never-learned user, weaned later in the real lessons).
 *   - Every term must have TTS in `src/shared/tts/manifests/<lang>.json` (or rely on
 *     the runtime speech-synth fallback for languages without a manifest,
 *     e.g. KO) and a vendored emoji for any picture step.
 *   - No tracing, no grind, no row tests. Fun > coverage.
 */
import type { LessonStep } from "@/features/lesson/types";

export type PreviewLesson = {
  languageId: string;
  /** Human-readable, used in the picker / start screen. */
  title: string;
  /** Short subhead — sets expectation up front. */
  subtitle: string;
  /** Used by the start screen meta chip. */
  estimatedMinutes: number;
  steps: LessonStep[];
};

// First taste for a learner who knows ZERO Japanese. Two rules drive the
// design (Spencer, 2026-06-30):
//   1. Teach before you test — nothing is quizzed before it's been introduced.
//      Each food word is taught with its picture+meaning via the correct option
//      of an image-MCQ (すし@2, みず@4, おちゃ@6) BEFORE the match step (7) asks
//      for it; the greeting is taught (1), said (5), then named (8). No cold
//      guesses (match used to spring みず/おちゃ that were only flashed as
//      distractors).
//   2. No back-to-back same step type — the three image-MCQs (2/4/6) are spaced
//      by other interactions: teach → image-MCQ → listening-build → image-MCQ →
//      speaking → image-MCQ → match → MCQ.
// Vocab is the food/drink + greeting set everyone half-knows already (sushi is
// a loanword). Romaji stays ON throughout — for a never-learned user it's a
// teaching aid, not a crutch; the real lessons wean it later. Every term has
// TTS in src/shared/tts/manifests/<lang>.json (こんにちは/すし/みず/おちゃ) and a vendored
// emoji (🍣/💧/🍵).
const japanesePreview: PreviewLesson = {
  languageId: "ja",
  title: "Try Japanese in 2 minutes",
  subtitle: "Start with words you already know — no signup, no commitment.",
  estimatedMinutes: 2,
  steps: [
    {
      // 1 — INTRODUCE the greeting up front so the finale (step 8) is a real
      // win, not a cold guess. Auto-plays audio; romaji renders above the
      // kana. (Was a `teach` step; that type retired 2026-07-11 in favor of
      // phrase_card — same exposure semantics.)
      id: "preview-ja-1-teach-hello",
      type: "phrase_card",
      kana: "こんにちは",
      romaji: "konnichiwa",
      meaningEn: "Hello / good afternoon",
      emoji: "👋",
      cultureNote: "Tap the word to hear it. The romaji shows how it sounds.",
    },
    {
      // 2 — Cognate opener: "sushi" is a word they already own, so the only
      // new thing is the shapes. Instant win.
      id: "preview-ja-2-sushi-mcq",
      type: "word_image_mcq",
      meaningEn: "sushi",
      correctOptionId: "sushi",
      options: [
        { id: "sushi", word: "すし", emoji: "🍣" },
        { id: "mizu", word: "みず", emoji: "💧" },
        { id: "ocha", word: "おちゃ", emoji: "🍵" },
      ],
    },
    {
      // 3 — The real reading beat: hear すし, build it from kana tiles. This
      // is the first time they actually assemble Japanese, not just match a
      // picture. Distractor tiles are other vowel/ka-row kana.
      id: "preview-ja-3-build-sushi",
      type: "listening_build",
      audioKey: "すし",
      prompt: "Tap the sounds in order to spell what you hear.",
      targetSentence: "すし",
      tiles: ["す", "し", "か", "ち"],
      correctOrder: ["す", "し"],
      granularity: "character",
    },
    {
      // 4 — Introduce みず with its meaning AND picture (correct option binds
      // word↔picture↔meaning). Tap any card to hear it; romaji shows above.
      id: "preview-ja-4-water-mcq",
      type: "word_image_mcq",
      meaningEn: "water",
      correctOptionId: "mizu",
      options: [
        { id: "mizu", word: "みず", emoji: "💧" },
        { id: "sushi", word: "すし", emoji: "🍣" },
        { id: "ocha", word: "おちゃ", emoji: "🍵" },
      ],
    },
    {
      // 5 — Production breaks up the picture steps: say the greeting taught in
      // step 1 (so the image-MCQs at 2/4/6 are never adjacent).
      id: "preview-ja-5-speaking",
      type: "speaking",
      targetPhrase: "こんにちは",
      translation: "Hello",
      stubbed: true,
    },
    {
      // 6 — Introduce おちゃ the same rich way: image + word + romaji + tap-to-
      // hear. (Replaces a broken audio-only MCQ that rendered a hardcoded
      // "Which kana starts the word?" — wrong question, English options.)
      id: "preview-ja-6-tea-mcq",
      type: "word_image_mcq",
      meaningEn: "tea",
      correctOptionId: "ocha",
      options: [
        { id: "ocha", word: "おちゃ", emoji: "🍵" },
        { id: "sushi", word: "すし", emoji: "🍣" },
        { id: "mizu", word: "みず", emoji: "💧" },
      ],
    },
    {
      // 7 — NOW match is fair: every word (すし@2, みず@4, おちゃ@6) has been
      // taught with its meaning, so this is recall, not a cold guess.
      id: "preview-ja-7-match",
      type: "match_pairs",
      prompt: "Match each word to its meaning.",
      playAudioOnSelect: true,
      // First-taste onboarding: the learner can't read kana yet, so show
      // romaji on the kana tiles (audio still plays on tap). Normal lessons
      // keep romaji off here so it doesn't give away the reading.
      showSourceRomaji: true,
      pairs: [
        { id: "sushi", source: "すし", target: "sushi" },
        { id: "mizu", source: "みず", target: "water" },
        { id: "ocha", source: "おちゃ", target: "tea" },
      ],
    },
    {
      // 8 — Finale, now a genuine "I can do this" beat: こんにちは was taught
      // (1) and spoken (5), so naming its meaning is recall, not a guess.
      id: "preview-ja-8-greeting",
      type: "multiple_choice",
      prompt: "こんにちは — what does it mean?",
      promptAudioText: "こんにちは",
      correctOptionId: "hello",
      options: [
        { id: "hello", text: "Hello / good afternoon" },
        { id: "thanks", text: "Thank you" },
        { id: "bye", text: "Goodbye" },
        { id: "sorry", text: "Excuse me" },
      ],
    },
  ],
};

/**
 * Korean preview — a first taste of Hangul. KO has no TTS manifest yet
 * (browser speech-synthesis covers audio steps), so the audio-driven
 * listening_build step relies on the runtime TTS fallback the same way KO
 * M1/M2 lessons do. Vocab is pulled from the M1/M3 emoji-bearing atom set
 * so the word_image_mcq has real art.
 */
// Korean follows the JA shape but swaps the reading beat: teach → image-MCQ →
// audio-MCQ → image-MCQ → speaking → image-MCQ → match → MCQ, under the same
// two rules — teach-before-test (every word taught before match) and no
// back-to-back step types (the three image-MCQs are spaced). JA's step 3 is a
// romaji-scaffolded listening_build; KO can't do that cold (no romaja aid, no
// per-tile audio), so step 3 is an audio-recognition MCQ instead. Korean has
// no romaja
// annotation by design (Hangul is phonetic — see ko/module.ts), so the
// spoon-feed is the vocabulary itself: English loanwords (커피 "coffee", 택시
// "taxi") the learner already knows by ear, plus the greeting taught up front.
// KO has no TTS manifest yet, so audio steps lean on the runtime speech-synth
// fallback the same way KO M1/M2 lessons do. Emoji must exist in the local
// Noto subset (src/pub/noto-emoji/svg) — ☕ 🚕 🌳 are verified present.
const koreanPreview: PreviewLesson = {
  languageId: "ko",
  title: "Try Korean in 2 minutes",
  subtitle: "Start with words you already know — no signup, no commitment.",
  estimatedMinutes: 2,
  steps: [
    {
      // 1 — INTRODUCE the greeting first so the finale (step 8) is recall,
      // not a cold guess. (The old preview sprang 감사합니다 cold — dropped.
      // Was a `teach` step; that type retired 2026-07-11 in favor of
      // phrase_card — same exposure semantics.)
      id: "preview-ko-1-teach-hello",
      type: "phrase_card",
      kana: "안녕하세요",
      romaji: "annyeonghaseyo",
      meaningEn: "Hello",
      emoji: "👋",
      cultureNote: "Tap the word to hear it.",
    },
    {
      // 2 — Loanword opener: "coffee" is a free win by ear.
      id: "preview-ko-2-coffee-mcq",
      type: "word_image_mcq",
      meaningEn: "coffee",
      correctOptionId: "keopi",
      options: [
        { id: "keopi", word: "커피", emoji: "☕" },
        { id: "taeksi", word: "택시", emoji: "🚕" },
        { id: "namu", word: "나무", emoji: "🌳" },
      ],
    },
    {
      // 3 — Audio recognition of the just-taught loanword. NOT a listening_build
      // like JA: Hangul has no romaja aid (ADR-011), and the build tiles render
      // raw blocks with no per-tile audio — a never-learned user can't map a
      // heard sound to unreadable blocks. A spelling beat only works AFTER the
      // alphabet track (why KO M-lessons can use it, but a cold preview can't).
      // multiple_choice uses playJaAudio (speech-synth fallback works for KO,
      // unlike listening_comprehension's getTtsUrl-only play button).
      id: "preview-ko-3-listen-coffee",
      type: "multiple_choice",
      prompt: "커피 — what does it mean?",
      promptAudioText: "커피",
      correctOptionId: "coffee",
      optionsHideRomaji: true,
      options: [
        { id: "coffee", text: "Coffee" },
        { id: "taxi", text: "Taxi" },
        { id: "tree", text: "Tree" },
      ],
    },
    {
      // 4 — Introduce 택시 with picture + meaning (correct option binds them).
      id: "preview-ko-4-taxi-mcq",
      type: "word_image_mcq",
      meaningEn: "taxi",
      correctOptionId: "taeksi",
      options: [
        { id: "taeksi", word: "택시", emoji: "🚕" },
        { id: "keopi", word: "커피", emoji: "☕" },
        { id: "namu", word: "나무", emoji: "🌳" },
      ],
    },
    {
      // 5 — Production breaks up the picture steps: say the greeting taught in
      // step 1 (keeps the image-MCQs at 2/4/6 non-adjacent).
      id: "preview-ko-5-speaking",
      type: "speaking",
      targetPhrase: "안녕하세요",
      translation: "Hello",
      stubbed: true,
    },
    {
      // 6 — Introduce 나무 the same rich way: image + word + tap-to-hear.
      // (Replaces a broken audio-only MCQ that rendered a hardcoded
      // "Which kana starts the word?" — wrong question, wrong language.)
      id: "preview-ko-6-tree-mcq",
      type: "word_image_mcq",
      meaningEn: "tree",
      correctOptionId: "namu",
      options: [
        { id: "namu", word: "나무", emoji: "🌳" },
        { id: "keopi", word: "커피", emoji: "☕" },
        { id: "taeksi", word: "택시", emoji: "🚕" },
      ],
    },
    {
      // 7 — NOW match is fair: every word (커피@2, 택시@4, 나무@6) has been
      // taught with its meaning first, so this is recall, not a cold guess.
      id: "preview-ko-7-match",
      type: "match_pairs",
      prompt: "Match each word to its meaning.",
      playAudioOnSelect: true,
      pairs: [
        { id: "keopi", source: "커피", target: "coffee" },
        { id: "taeksi", source: "택시", target: "taxi" },
        { id: "namu", source: "나무", target: "tree" },
      ],
    },
    {
      // 8 — Finale: 안녕하세요 was taught (1) and spoken (5), so this is recall.
      id: "preview-ko-8-greeting",
      type: "multiple_choice",
      prompt: "안녕하세요 — what does it mean?",
      promptAudioText: "안녕하세요",
      correctOptionId: "hello",
      optionsHideRomaji: true,
      options: [
        { id: "hello", text: "Hello" },
        { id: "thanks", text: "Thank you" },
        { id: "bye", text: "Goodbye" },
        { id: "sorry", text: "I'm sorry" },
      ],
    },
  ],
};

const PREVIEW_LESSONS: Record<string, PreviewLesson> = {
  ja: japanesePreview,
  ko: koreanPreview,
};

export function getPreviewLesson(languageId: string): PreviewLesson | null {
  return PREVIEW_LESSONS[languageId] ?? null;
}

export function hasPreviewLesson(languageId: string): boolean {
  return languageId in PREVIEW_LESSONS;
}
