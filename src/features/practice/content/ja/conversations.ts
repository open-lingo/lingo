/**
 * CONVERSATIONS are converted from the m3-m5 neo mini-dialogue exchanges
 * (`languages/ja/curriculum/m{3,4,5}-neo*.ts`, the `dialogueListen` steps):
 * the exchange is lifted into structured `lines` with authored translations
 * (the source steps carry only kana + comprehension questions). They keep the
 * course's casual plain-form register (だ + plain verbs).
 */
import type { Conversation } from "../types";

export const JA_CONVERSATIONS: Conversation[] = [
  {
    id: "ja-m3-introductions",
    languageId: "ja",
    module: 3,
    title: "Introductions",
    situation: "A friend introduces you to someone new.",
    speakers: [
      { id: "A", label: "Ken", voice: "ja-keita" },
      { id: "B", label: "You" },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "はじめまして。ケンだ。", translation: "Nice to meet you. I'm Ken." },
      { speaker: "B", text: "はじめまして。トムだ。", translation: "Nice to meet you. I'm Tom." },
      { speaker: "A", text: "がくせい？", translation: "A student?" },
      { speaker: "B", text: "うん、がくせいだ。", translation: "Yeah, a student." },
    ],
  },
  {
    id: "ja-m4-whats-this",
    languageId: "ja",
    module: 4,
    title: "What's this?",
    situation: "Naming the things around you.",
    speakers: [
      { id: "A", label: "Mika" },
      { id: "B", label: "You", voice: "ja-keita" },
    ],
    learnerRole: "B",
    lines: [
      { speaker: "A", text: "これ、なに？", translation: "What's this?" },
      { speaker: "B", text: "それは ほんだ。", translation: "That's a book." },
      { speaker: "A", text: "あれは？", translation: "And that one?" },
      { speaker: "B", text: "くるまだ。", translation: "A car." },
      { speaker: "A", text: "だれの けいたい？", translation: "Whose phone is that?" },
      { speaker: "B", text: "トムのだ。", translation: "It's Tom's." },
    ],
  },
  {
    id: "ja-m5-at-the-shop",
    languageId: "ja",
    module: 5,
    title: "At the shop",
    situation: "Ask a price and buy something.",
    speakers: [
      { id: "A", label: "You" },
      { id: "B", label: "Clerk", voice: "ja-keita" },
    ],
    learnerRole: "A",
    lines: [
      { speaker: "A", text: "すみません。これ、いくら？", translation: "Excuse me. How much is this?" },
      { speaker: "B", text: "ひゃくえんです。", translation: "It's 100 yen." },
      { speaker: "A", text: "これ、ください。", translation: "This one, please." },
      { speaker: "B", text: "ありがとうございます。", translation: "Thank you." },
    ],
  },
  {
    id: "ja-m6-where-is-it",
    languageId: "ja",
    module: 6,
    title: "Where is it?",
    situation: "Ask where people and places are.",
    speakers: [
      { id: "A", label: "You" },
      { id: "B", label: "Mika" },
    ],
    learnerRole: "A",
    lines: [
      { speaker: "A", text: "ともだちは どこに いますか？", translation: "Where is your friend?" },
      { speaker: "B", text: "がっこうに います。", translation: "At school." },
      { speaker: "A", text: "みせは どこに ありますか？", translation: "Where's the shop?" },
      { speaker: "B", text: "えきに あります。", translation: "At the station." },
    ],
  },
  {
    id: "ja-m7-what-to-eat",
    languageId: "ja",
    module: 7,
    title: "What will you eat?",
    situation: "Decide what to eat and drink together.",
    speakers: [
      { id: "A", label: "You" },
      { id: "B", label: "Ken", voice: "ja-keita" },
    ],
    learnerRole: "A",
    lines: [
      { speaker: "A", text: "なにを たべますか？", translation: "What will you eat?" },
      { speaker: "B", text: "すしを たべます。", translation: "I'll eat sushi." },
      { speaker: "A", text: "なにを のみますか？", translation: "What will you drink?" },
      { speaker: "B", text: "おちゃを のみます。", translation: "I'll drink green tea." },
    ],
  },
];
