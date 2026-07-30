/**
 * Japanese curated content — stories + conversations.
 *
 * CONVERSATIONS are converted from the m3-m5 neo mini-dialogue exchanges
 * (`languages/ja/curriculum/m{3,4,5}-neo*.ts`, the `dialogueListen` steps):
 * the exchange is lifted into structured `lines` with authored translations
 * (the source steps carry only kana + comprehension questions). They keep the
 * course's casual plain-form register (だ + plain verbs). STORIES are newly
 * authored for m3-m7 using only in-module atoms.
 *
 * Readings (romaji) are derived at first access via the JA romanizer, so the
 * authored data stays terse and the reading aid matches the rest of the app.
 */
import { annotateJapaneseText } from "@/features/languages/ja/romajiLexicon";
import type { Conversation, Story } from "./types";

const CONVERSATIONS_RAW: Conversation[] = [
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

const STORIES_RAW: Story[] = [
  {
    id: "ja-m3-about-me",
    languageId: "ja",
    module: 3,
    title: "About me",
    theme: "A short self-introduction.",
    sentences: [
      { text: "トムだ。", translation: "I'm Tom." },
      { text: "がくせいだ。", translation: "I'm a student." },
      { text: "アメリカじんだ。", translation: "I'm American." },
      { text: "ミカは ともだちだ。", translation: "Mika is my friend." },
      { text: "ミカも がくせいだ。", translation: "Mika is a student too." },
    ],
  },
  {
    id: "ja-m4-on-the-desk",
    languageId: "ja",
    module: 4,
    title: "On the desk",
    theme: "Naming what's in front of you.",
    sentences: [
      { text: "これは ほんだ。", translation: "This is a book." },
      { text: "それは かばんだ。", translation: "That's a bag." },
      { text: "あれは くるまだ。", translation: "That over there is a car." },
      { text: "これは わたしの かさだ。", translation: "This is my umbrella." },
      { text: "それは だれの けいたい？", translation: "Whose phone is that?" },
    ],
  },
  {
    id: "ja-m5-buying-tea",
    languageId: "ja",
    module: 5,
    title: "Buying tea",
    theme: "A quick shop errand.",
    sentences: [
      { text: "すみません。", translation: "Excuse me." },
      { text: "これは いくら？", translation: "How much is this?" },
      { text: "ひゃくえんだ。", translation: "It's 100 yen." },
      { text: "おちゃも ください。", translation: "Green tea too, please." },
      { text: "ありがとうございます。", translation: "Thank you." },
    ],
  },
  {
    id: "ja-m6-around-town",
    languageId: "ja",
    module: 6,
    title: "Around town",
    theme: "Where everything is.",
    sentences: [
      { text: "ともだちは がっこうに います。", translation: "My friend is at school." },
      { text: "せんせいは としょかんに います。", translation: "The teacher is at the library." },
      { text: "ほんは うちに あります。", translation: "The book is at home." },
      { text: "えきは とおい。", translation: "The station is far." },
      { text: "みせは ちかい。", translation: "The shop is near." },
    ],
  },
  {
    id: "ja-m7-a-meal",
    languageId: "ja",
    module: 7,
    title: "A meal",
    theme: "Going through a simple routine.",
    sentences: [
      { text: "ごはんを たべます。", translation: "I eat a meal." },
      { text: "おちゃを のみます。", translation: "I drink green tea." },
      { text: "ニュースを みます。", translation: "I watch the news." },
      { text: "ほんを よみます。", translation: "I read a book." },
      { text: "かいしゃに いきます。", translation: "I go to the office." },
    ],
  },
  {
    id: "ja-m7-at-work",
    languageId: "ja",
    module: 7,
    title: "At work",
    theme: "A workday with a friend.",
    sentences: [
      { text: "かいしゃで はたらきます。", translation: "I work at the company." },
      { text: "じゅぎょうが あります。", translation: "There's a class." },
      { text: "ともだちも きます。", translation: "My friend comes too." },
      { text: "ごはんを たべます。", translation: "We eat a meal." },
      { text: "おちゃを のみます。", translation: "We drink green tea." },
    ],
  },
];

function jaReading(text: string): string {
  return annotateJapaneseText(text, true)
    .map((f) => f.reading ?? "")
    .filter(Boolean)
    .join(" ");
}

function withReading<T extends { text: string; reading?: string }>(line: T): T {
  return line.reading ? line : { ...line, reading: jaReading(line.text) };
}

let storiesMemo: Story[] | null = null;
let conversationsMemo: Conversation[] | null = null;

export function jaStories(): Story[] {
  if (!storiesMemo) {
    storiesMemo = STORIES_RAW.map((s) => ({
      ...s,
      sentences: s.sentences.map(withReading),
    }));
  }
  return storiesMemo;
}

export function jaConversations(): Conversation[] {
  if (!conversationsMemo) {
    conversationsMemo = CONVERSATIONS_RAW.map((c) => ({
      ...c,
      lines: c.lines.map(withReading),
    }));
  }
  return conversationsMemo;
}
