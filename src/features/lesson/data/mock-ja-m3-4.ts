import type { LessonContent, PhraseCardStep } from "../types";

/**
 * M3-4 — More vocab + katakana sprinkle.
 *
 * 10 N5 vocabulary words. Two of them are katakana (アメリカ "America",
 * カメラ "camera") — the M3-1 promise of "3–5 katakana per module via
 * context" cashing out. AnnotatedJa adds romaji ruby above each kana
 * automatically, so even pre-katakana-drill learners can read by sound.
 *
 * Vocab pool focuses on food + everyday objects — the things a Priya-
 * persona traveler points at and asks about.
 */

function vocab(
  id: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
): PhraseCardStep {
  return { id, type: "phrase_card", meaningEn, romaji, kana, cultureNote };
}

export const MOCK_LESSON_JA_M3_4: LessonContent = {
  id: "ja-m3-4",
  moduleId: "m3",
  courseId: "mock-1",
  languageId: "ja",
  title: "Food, things, and katakana in the wild",
  description:
    "10 high-frequency words including two katakana loanwords. Pattern-match the angular shapes.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    {
      id: "ja-m3-4-info-open",
      type: "info",
      title: "Vocab drop",
      body:
        "Ten high-frequency words. Two of them are written in katakana — see if you can pattern-match the angular shapes against the rounder hiragana you already know. The romaji ruby above each word tells you the sound.",
      variant: "default",
    },

    vocab(
      "ja-m3-4-v-gohan",
      "Rice / meal",
      "gohan",
      "ごはん",
      "Means both 'cooked rice' and 'a meal' — context decides. 'あさごはん' = breakfast, 'ばんごはん' = dinner.",
    ),
    vocab(
      "ja-m3-4-v-sakana",
      "Fish",
      "sakana",
      "さかな",
      "Conveniently the same word for the animal and the food on your plate.",
    ),
    vocab("ja-m3-4-v-niku", "Meat", "niku", "にく"),
    vocab(
      "ja-m3-4-v-yasai",
      "Vegetables",
      "yasai",
      "やさい",
      "Useful at the conveyor-belt sushi for the vegetable-only items, or asking about an allergy.",
    ),
    vocab(
      "ja-m3-4-v-amerika",
      "America",
      "amerika",
      "アメリカ",
      "Your third katakana word. Country names are almost all in katakana — フランス (France), ドイツ (Germany), カナダ (Canada).",
    ),
    vocab(
      "ja-m3-4-v-kamera",
      "Camera",
      "kamera",
      "カメラ",
      "Loanword from English. Notice カ appears in both カメラ and アメリカ — same angular shape, /ka/ sound, hiragana cousin か.",
    ),
    vocab(
      "ja-m3-4-v-tegami",
      "Letter (postal)",
      "tegami",
      "てがみ",
      "Less common than email these days but still the formal way to thank a host family.",
    ),
    vocab("ja-m3-4-v-kuruma", "Car", "kuruma", "くるま"),
    vocab("ja-m3-4-v-jitensha", "Bicycle", "jitensha", "じてんしゃ"),
    vocab(
      "ja-m3-4-v-densha",
      "Train",
      "densha",
      "でんしゃ",
      "Japan runs on trains. Memorize this one early.",
    ),

    {
      id: "ja-m3-4-info-end",
      type: "info",
      title: "Two scripts, one head",
      body:
        "You've now seen 7 katakana words across M3 (5 in lesson 1, アメリカ + カメラ here). Without doing a single drill, you're starting to recognize カ, タ, ル, ン. That's the plan — exposure, not grind.",
      variant: "win",
    },
  ],
};
