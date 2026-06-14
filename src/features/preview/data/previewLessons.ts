/**
 * Per-language preview lessons for the public `/try` route.
 *
 * A preview lesson is a tiny taste — 3-4 steps, ~2-3 minutes — that a
 * visitor can complete without signing up. Reuses the existing
 * `LessonStep` union so the standard step renderers work as-is. The
 * preview runner deliberately strips all persistence / mastery / XP
 * machinery so trying the preview never mutates user state.
 *
 * Content authoring rules (Japanese, the only language with a real
 * preview at launch):
 *   - Vowel + ka-row kana only. These ship in every M1 entry path and
 *     reading them feels like a small win for first-time visitors.
 *   - Every kana / word must have TTS in `src/pub/tts/manifest.json` —
 *     audio-driven step views silently fall through when a key is
 *     missing.
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

const japanesePreview: PreviewLesson = {
  languageId: "ja",
  title: "Try Japanese in 2 minutes",
  subtitle: "Four quick wins — no signup, no commitment.",
  estimatedMinutes: 2,
  steps: [
    {
      id: "preview-ja-1-word-mcq",
      type: "word_image_mcq",
      meaningEn: "station",
      correctOptionId: "eki",
      options: [
        { id: "eki", word: "えき", emoji: "🚉" },
        { id: "ai", word: "あい", emoji: "❤️" },
        { id: "ie", word: "いえ", emoji: "🏠" },
        { id: "kai", word: "かい", emoji: "🐚" },
      ],
    },
    {
      id: "preview-ja-2-listen-build",
      type: "listening_build",
      audioKey: "あい",
      prompt: "Build what you hear — it means 'love'.",
      targetSentence: "あい",
      tiles: ["あ", "い", "う", "え"],
      correctOrder: ["あ", "い"],
      granularity: "character",
    },
    {
      id: "preview-ja-3-speaking",
      type: "speaking",
      targetPhrase: "こえ",
      translation: "voice",
      stubbed: true,
    },
    {
      id: "preview-ja-4-greeting",
      type: "multiple_choice",
      prompt: "こんにちは — what does it mean?",
      promptAudioText: "こんにちは",
      correctOptionId: "hello",
      optionsHideRomaji: true,
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
const koreanPreview: PreviewLesson = {
  languageId: "ko",
  title: "Try Korean in 2 minutes",
  subtitle: "Read your first Hangul — no signup, no commitment.",
  estimatedMinutes: 2,
  steps: [
    {
      // Emoji must exist in the local Noto subset (src/pub/noto-emoji/svg)
      // or the tile renders a broken image — these four are verified present.
      id: "preview-ko-1-word-mcq",
      type: "word_image_mcq",
      meaningEn: "tree",
      correctOptionId: "namu",
      options: [
        { id: "namu", word: "나무", emoji: "🌳" },
        { id: "bada", word: "바다", emoji: "🌊" },
        { id: "chingu", word: "친구", emoji: "👫" },
        { id: "bi", word: "비", emoji: "🌧️" },
      ],
    },
    {
      id: "preview-ko-2-listen-build",
      type: "listening_build",
      audioKey: "아이",
      prompt: "Build what you hear — it means 'child'.",
      targetSentence: "아이",
      tiles: ["아", "이", "오", "우"],
      correctOrder: ["아", "이"],
      granularity: "character",
    },
    {
      id: "preview-ko-3-speaking",
      type: "speaking",
      targetPhrase: "안녕하세요",
      translation: "hello",
      stubbed: true,
    },
    {
      id: "preview-ko-4-greeting",
      type: "multiple_choice",
      prompt: "감사합니다 — what does it mean?",
      promptAudioText: "감사합니다",
      correctOptionId: "thanks",
      optionsHideRomaji: true,
      options: [
        { id: "thanks", text: "Thank you" },
        { id: "hello", text: "Hello" },
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
