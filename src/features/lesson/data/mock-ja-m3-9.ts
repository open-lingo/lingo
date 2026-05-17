import type { LessonContent, PhraseCardStep } from "../types";

/**
 * M3-9 — Mini-dialogue: traveler buys coffee.
 *
 * Four-line exchange between a traveler and a café staffer. Each line
 * gets a phrase_card (meaning + romaji + kana + auto-play audio). The
 * goal is comprehensible exposure to natural turn-taking — every grammar
 * piece and every word has been introduced earlier in M3.
 *
 * Production happens in M3-10 (row test) and beyond — this lesson is
 * pure listening + reading practice. Krashen comprehensible input.
 */

function line(
  id: string,
  speaker: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
): PhraseCardStep {
  return {
    id,
    type: "phrase_card",
    meaningEn: `${speaker}: ${meaningEn}`,
    romaji,
    kana,
    cultureNote,
  };
}

export const MOCK_LESSON_JA_M3_9: LessonContent = {
  id: "ja-m3-9",
  moduleId: "m3",
  courseId: "mock-1",
  languageId: "ja",
  title: "Mini-dialogue — ordering coffee",
  description:
    "A four-line exchange between a traveler and a café staffer. Listen, read, absorb.",
  estimatedMinutes: 4,
  xpReward: 12,
  steps: [
    {
      id: "ja-m3-9-info-open",
      type: "info",
      title: "Drop into the scene",
      body:
        "You walk into a Tokyo café. The staffer greets you, you order, you confirm, you thank them. Every word and grammar piece is something you've met across M3. Just read, listen, and let it sound natural.",
      variant: "culture",
    },

    line(
      "ja-m3-9-l1",
      "Staff",
      "Hello, welcome.",
      "irasshaimase",
      "いらっしゃいませ",
      "The greeting every shop, restaurant, and café staffer uses when you walk in. Don't reply — a nod is enough.",
    ),
    line(
      "ja-m3-9-l2",
      "You",
      "Two coffees, please.",
      "koohii niko kudasai",
      "コーヒー にこ ください",
      "Generic order pattern: [item] [counter] ください. Works for any countable thing on the menu.",
    ),
    line(
      "ja-m3-9-l3",
      "Staff",
      "Is that everything?",
      "ijou de yoroshii desu ka",
      "いじょうで よろしいですか",
      "Formal version of 'is that all?' Yoroshii is the polite form of 'good/OK.' You'll hear this at every register transaction.",
    ),
    line(
      "ja-m3-9-l4",
      "You",
      "Yes. Thank you.",
      "hai. arigatou gozaimasu",
      "はい。ありがとうございます",
      "はい confirms the order is complete. ありがとうございます closes the interaction politely. The staffer will reply with かしこまりました (understood).",
    ),

    {
      id: "ja-m3-9-info-end",
      type: "info",
      title: "Listening over speaking",
      body:
        "Comprehensible input is half the game. You've now heard the rhythm of a real café exchange. When you're actually in one, the staffer will speak faster — but the pattern is exactly what you just heard.",
      variant: "win",
    },
  ],
};
