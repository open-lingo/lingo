import type { LessonContent } from "../types";
import {
  infoStep,
  speaking,
  listeningCompSentence,
  dialogueListen,
  build,
} from "./_jaGrammarHelpers";

/**
 * Travel Sidequest — Shopping (prices, paying, bags).
 *
 * Pimsleur-style auditory lesson: listen → repeat → build. Six core
 * phrases for surviving any Japanese shop or convenience store. Designed
 * as a sprint — no grammar deep-dive, just functional fluency for buying
 * things.
 *
 * Lesson id `ja-sidequest-travel-shopping` does NOT match the
 * `^ja-m\d+-…` shape `rowIdOf` uses, so `augmentWithReviewTail` skips it.
 */

export const MOCK_LESSON_JA_SIDEQUEST_TRAVEL_SHOPPING: LessonContent = {
  id: "ja-sidequest-travel-shopping",
  moduleId: "sidequest",
  courseId: "mock-1",
  languageId: "ja",
  title: "Shopping",
  description: "Ask prices, pay, and request a bag.",
  estimatedMinutes: 4,
  xpReward: 25,
  steps: [
    // ── 1. Culture intro ────────────────────────────────────────────────
    infoStep(
      "ja-ts-shop-intro",
      "Shopping in Japan",
      "Convenience stores (コンビニ) are everywhere and sell everything from onigiri to concert tickets. Department stores (デパート) wrap purchases beautifully — for free. At markets, prices are usually fixed, but you can always ask いくらですか to be sure. Cash is still common, but card acceptance is growing fast.",
      "culture",
    ),

    // ── 2. Listen: いくらですか ─────────────────────────────────────────
    listeningCompSentence({
      id: "ja-ts-shop-listen-ikura",
      audioText: "いくらですか",
      correctMeaningEn: "How much is it?",
      distractorsEn: [
        "Where is it?",
        "What is it?",
        "Is this okay?",
      ],
    }),

    // ── 3. Speaking: say いくらですか ────────────────────────────────────
    speaking(
      "ja-ts-shop-say-ikura",
      "いくらですか",
      "How much is it?",
    ),

    // ── 4. Listen: これ ─────────────────────────────────────────────────
    listeningCompSentence({
      id: "ja-ts-shop-listen-kore",
      audioText: "これ",
      correctMeaningEn: "This one",
      distractorsEn: [
        "That one (over there)",
        "Which one?",
        "That one (near you)",
      ],
    }),

    // ── 5. Speaking: say カードでいいですか ──────────────────────────────
    speaking(
      "ja-ts-shop-say-kaado",
      "カードでいいですか",
      "Is card okay?",
    ),

    // ── 6. Listen: ふくろをください ──────────────────────────────────────
    listeningCompSentence({
      id: "ja-ts-shop-listen-fukuro",
      audioText: "ふくろをください",
      correctMeaningEn: "Bag, please",
      distractorsEn: [
        "Receipt, please",
        "Water, please",
        "Change, please",
      ],
    }),

    // ── 7. Dialogue: buying at a convenience store ──────────────────────
    dialogueListen({
      id: "ja-ts-shop-dialogue-conbini",
      lines: [
        { speaker: "Clerk", kana: "いらっしゃいませ。" },
        { speaker: "You", kana: "これ、いくらですか。" },
        { speaker: "Clerk", kana: "ひゃくごじゅうえんです。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What did the customer ask?",
          correctText: "How much is this?",
          distractors: [
            "Where is the exit?",
            "Do you have bags?",
            "Can I pay by card?",
          ],
        },
        {
          id: "q2",
          prompt: "How much does it cost?",
          correctText: "150 yen",
          distractors: [
            "50 yen",
            "500 yen",
            "1,500 yen",
          ],
        },
      ],
    }),

    // ── 8. Speaking: say ふくろをください ────────────────────────────────
    speaking(
      "ja-ts-shop-say-fukuro",
      "ふくろをください",
      "Bag, please",
    ),

    // ── 9. Build: "How much is it?" → いくら です か ────────────────────
    build(
      "ja-ts-shop-build-ikura",
      "How much is it?",
      "いくらですか",
      ["いくら", "です", "か", "を", "は"],
      ["いくら", "です", "か"],
    ),

    // ── 10. Dialogue: paying at a shop ──────────────────────────────────
    dialogueListen({
      id: "ja-ts-shop-dialogue-pay",
      lines: [
        { speaker: "You", kana: "カードでいいですか。" },
        { speaker: "Clerk", kana: "はい、どうぞ。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What did the customer ask about?",
          correctText: "Paying by card",
          distractors: [
            "Getting a bag",
            "The price",
            "Getting a receipt",
          ],
        },
      ],
    }),

    // ── 11. Win card ────────────────────────────────────────────────────
    infoStep(
      "ja-ts-shop-win",
      "Ready to shop",
      "You can now ask prices (いくらですか), point at what you want (これ), ask about card payment (カードでいいですか), and request a bag (ふくろをください). That covers most convenience store and shop interactions. If something feels expensive — that's たかい!",
      "win",
    ),
  ],
};
