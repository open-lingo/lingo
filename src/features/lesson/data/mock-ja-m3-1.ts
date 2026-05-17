import type { LessonContent, PhraseCardStep } from "../types";

/**
 * M3-1 — Katakana SYSTEM intro + first loanwords.
 *
 * Per Spencer's call (2026-05-16): NO per-row katakana grind. ONE system
 * explainer card, then five real loanwords as exposure via phrase_card
 * (meaning + romaji + kana decoration, audio auto-plays). Learners can
 * pattern-match shapes against the hiragana they already know; the
 * external `practice/alphabet/katakana` route handles deliberate drill,
 * and M5 unlock will soft-gate on katakana practice completion (see
 * `isKatakanaPracticeComplete` in `features/learn/moduleProgress.ts`).
 *
 * Picked loanwords are all tourist-essential and all katakana-only (no
 * mixed-script complications): コーヒー coffee, タクシー taxi, ホテル hotel,
 * レストラン restaurant, ビール beer. All five appear on shop signs and
 * menus across Japan — a 32yo traveler will recognize the utility.
 */

function phrase(
  id: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
): PhraseCardStep {
  return {
    id,
    type: "phrase_card",
    meaningEn,
    romaji,
    kana,
    cultureNote,
  };
}

export const MOCK_LESSON_JA_M3_1: LessonContent = {
  id: "ja-m3-1",
  moduleId: "m3",
  courseId: "mock-1",
  languageId: "ja",
  title: "Katakana — the second alphabet",
  description:
    "Meet katakana as a system. Same sounds as hiragana, different shapes — used for foreign words.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    {
      id: "ja-m3-1-info-system",
      type: "info",
      title: "Katakana — hiragana's twin",
      body:
        "Katakana (カタカナ) has the same 46 sounds as hiragana — just different, more angular shapes. It's used for: (1) loanwords from English and other languages (コーヒー = coffee), (2) foreign names, (3) onomatopoeia and emphasis (like italics in English). You'll meet 3–5 katakana words per M3+ lesson with romaji ruby on top, so you can read by sound while the shapes sink in. Want deliberate practice? Open the katakana drill from the Practice tab — you'll need it complete to unlock Module 5.",
      variant: "culture",
    },

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

    {
      id: "ja-m3-1-info-end",
      type: "info",
      title: "Five katakana words in your pocket",
      body:
        "You can now order a coffee, hail a taxi, find your hotel, sit in a restaurant, and order a beer. Five loanwords, five katakana shapes you've now seen in context. The shapes will become familiar through repetition across M3 — no drilling required.",
      variant: "win",
    },
  ],
};
