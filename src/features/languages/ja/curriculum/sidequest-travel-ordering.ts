import type { LessonContent } from "@/features/lesson/types";
import {
  infoStep,
  speaking,
  listeningCompSentence,
  dialogueListen,
  build,
} from "@/features/languages/ja/grammarHelpers";

/**
 * Sidequest: Ordering Food — Pimsleur-style auditory travel lesson.
 *
 * Theme: restaurants, cafes, menus. Teaches 6 high-utility ordering
 * phrases via the listen → repeat → build → dialogue loop. Sprint pace
 * (~4 min), no deep grammar — just enough to point-and-order at any
 * Japanese restaurant.
 *
 * Lesson id `ja-sidequest-travel-ordering` does NOT match the
 * `^ja-m\d+-…` shape `rowIdOf` uses, so `augmentWithReviewTail` skips it.
 */

export const MOCK_LESSON_JA_SIDEQUEST_TRAVEL_ORDERING: LessonContent = {
  id: "ja-sidequest-travel-ordering",
  moduleId: "sidequest",
  courseId: "mock-1",
  languageId: "ja",
  title: "Ordering Food",
  description: "Order at restaurants, ask for water, and get the check.",
  estimatedMinutes: 4,
  xpReward: 25,
  steps: [
    // ── 1. Culture intro ────────────────────────────────────────────────
    infoStep(
      "ja-ts-order-intro",
      "Japanese dining etiquette",
      "Before eating, say いただきます (itadakimasu) — it means 'I humbly receive' and shows gratitude for the meal. When you're ready to order, point at a menu item and say これをください (kore o kudasai) — 'I'll have this, please.' No tipping needed.",
      "culture",
    ),

    // ── 2. Listen: これをください ───────────────────────────────────────
    listeningCompSentence({
      id: "ja-ts-order-listen-kore",
      audioText: "これをください",
      correctMeaningEn: "I'll have this, please",
      distractorsEn: [
        "Where is the menu?",
        "How much is this?",
        "Thank you very much",
      ],
    }),

    // ── 3. Speaking: これをください ─────────────────────────────────────
    speaking(
      "ja-ts-order-say-kore",
      "これをください",
      "I'll have this, please",
    ),

    // ── 4. Listen: メニューをください ───────────────────────────────────
    listeningCompSentence({
      id: "ja-ts-order-listen-menu",
      audioText: "メニューをください",
      correctMeaningEn: "Menu, please",
      distractorsEn: [
        "Water, please",
        "Check, please",
        "I'll have this, please",
      ],
    }),

    // ── 5. Speaking: おみずをください ───────────────────────────────────
    speaking(
      "ja-ts-order-say-mizu",
      "おみずをください",
      "Water, please",
    ),

    // ── 6. Listen: おかいけいをおねがいします ───────────────────────────
    listeningCompSentence({
      id: "ja-ts-order-listen-check",
      audioText: "おかいけいをおねがいします",
      correctMeaningEn: "Check, please",
      distractorsEn: [
        "One more, please",
        "Excuse me",
        "It was delicious",
      ],
    }),

    // ── 7. Dialogue: ordering at a restaurant ──────────────────────────
    dialogueListen({
      id: "ja-ts-order-dialogue-order",
      lines: [
        { speaker: "Server", kana: "いらっしゃいませ。" },
        { speaker: "You", kana: "これをください。" },
        { speaker: "Server", kana: "はい、かしこまりました。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What did the customer say?",
          correctText: "I'll have this, please",
          distractors: [
            "Where is the bathroom?",
            "How much is it?",
            "Can I see the menu?",
          ],
        },
        {
          id: "q2",
          prompt: "What does the server's reply mean?",
          correctText: "Certainly / understood",
          distractors: [
            "We're closed",
            "That will be 500 yen",
            "Please wait outside",
          ],
        },
      ],
    }),

    // ── 8. Speaking: おかいけいをおねがいします ─────────────────────────
    speaking(
      "ja-ts-order-say-check",
      "おかいけいをおねがいします",
      "Check, please",
    ),

    // ── 9. Build: "Water, please" ──────────────────────────────────────
    build(
      "ja-ts-order-build-mizu",
      "Water, please",
      "おみずをください",
      ["を", "おみず", "ください", "おかいけい"],
      ["おみず", "を", "ください"],
    ),

    // ── 10. Dialogue: asking for the check ─────────────────────────────
    dialogueListen({
      id: "ja-ts-order-dialogue-check",
      lines: [
        { speaker: "You", kana: "すみません。おかいけいをおねがいします。" },
        { speaker: "Server", kana: "はい、せんえんです。" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What is the customer asking for?",
          correctText: "The check / bill",
          distractors: [
            "More water",
            "The menu",
            "A table for two",
          ],
        },
      ],
    }),

    // ── 11. Win card ───────────────────────────────────────────────────
    infoStep(
      "ja-ts-order-win",
      "You can order!",
      "You can now order food with これをください, ask for water and the menu, and request the check with おかいけいをおねがいします. Don't forget to say いただきます before your first bite. Replay anytime before your next meal out.",
      "win",
    ),
  ],
};
