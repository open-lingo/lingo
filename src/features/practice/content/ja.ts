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
  {
    id: "ja-m8-in-town",
    languageId: "ja",
    module: 8,
    title: "In town",
    theme: "Describing the shops on the street.",
    sentences: [
      { text: "わたしは まちに います。", translation: "I'm in town." },
      { text: "あのみせは おおきいです。", translation: "That shop is big." },
      { text: "このコーヒーは おいしいです。", translation: "This coffee is delicious." },
      { text: "コーヒーは やすいです。", translation: "The coffee is cheap." },
      { text: "しんぶんも かいます。", translation: "I buy a newspaper too." },
    ],
  },
  {
    id: "ja-m9-a-lively-town",
    languageId: "ja",
    module: 9,
    title: "A lively town",
    theme: "First impressions of the neighborhood.",
    sentences: [
      { text: "このまちは とても にぎやかです。", translation: "This town is very lively." },
      { text: "えきは べんりです。", translation: "The station is convenient." },
      { text: "わたしは えいごが じょうずです。", translation: "I'm good at English." },
      { text: "このまちは ゆうめいです。", translation: "This town is famous." },
      { text: "こうえんは しずかです。", translation: "The park is quiet." },
      { text: "きょうは ひまです。", translation: "I'm free today." },
    ],
  },
  {
    id: "ja-m10-back-to-school",
    languageId: "ja",
    module: 10,
    title: "Back to school",
    theme: "The first day after a break.",
    sentences: [
      { text: "ぼくは がくせいです。", translation: "I'm a student." },
      { text: "きのうは やすみでした。", translation: "Yesterday was a day off." },
      { text: "きょうは がっこうに いきます。", translation: "Today I go to school." },
      { text: "それから としょかんに いきます。", translation: "After that I go to the library." },
      { text: "ほんを よみます。", translation: "I read a book." },
      { text: "えいごは わかります。", translation: "I understand English." },
    ],
  },
  {
    id: "ja-m11-last-saturday",
    languageId: "ja",
    module: 11,
    title: "Last Saturday",
    theme: "Looking back on the weekend.",
    sentences: [
      { text: "せんしゅうの どようびは やすみだった。", translation: "Last Saturday was a day off." },
      { text: "ともだちと テレビを みた。", translation: "I watched TV with a friend." },
      { text: "コーヒーを のんだ。", translation: "I drank coffee." },
      { text: "みせで ぼうしを かった。", translation: "I bought a hat at the shop." },
      { text: "うたも きいた。", translation: "I listened to songs too." },
      { text: "ほんとうに よく あそんだ。", translation: "I really had a lot of fun." },
    ],
  },
  {
    id: "ja-m12-a-workday",
    languageId: "ja",
    module: 12,
    title: "A workday",
    theme: "Morning to night, hour by hour.",
    sentences: [
      { text: "きょうは しごとが あります。", translation: "I have work today." },
      { text: "ごぜんは かいしゃに いきます。", translation: "In the morning I go to the office." },
      { text: "ひるは レストランで ラーメンを たべます。", translation: "At noon I eat ramen at a restaurant." },
      { text: "ごごも しごとを します。", translation: "I work in the afternoon too." },
      { text: "よるは うちで テレビを みます。", translation: "At night I watch TV at home." },
      { text: "いまは ゆうがたです。", translation: "It's evening now." },
    ],
  },
  {
    id: "ja-m13-likes-and-wants",
    languageId: "ja",
    module: 13,
    title: "Likes and wants",
    theme: "A few honest preferences.",
    sentences: [
      { text: "ぼくは コーヒーが すきだ。", translation: "I like coffee." },
      { text: "おちゃは きらいだ。", translation: "I don't like tea." },
      { text: "あたらしい ふくが ほしい。", translation: "I want new clothes." },
      { text: "きっさてんに いく。", translation: "I go to the coffee shop." },
      { text: "きっさてんで コーヒーを のむ。", translation: "I drink coffee at the coffee shop." },
      { text: "なつやすみが すきだ。", translation: "I like summer vacation." },
    ],
  },
  {
    id: "ja-m14-a-visitor",
    languageId: "ja",
    module: 14,
    title: "A visitor",
    theme: "A friend drops by.",
    sentences: [
      { text: "きょう ともだちが うちに くる。", translation: "A friend is coming over today." },
      { text: "ぼくは ともだちを まつ。", translation: "I wait for my friend." },
      { text: "ともだちが ドアを あける。", translation: "My friend opens the door." },
      { text: "ぼくは はなしを する。", translation: "I have a chat." },
      { text: "ともだちは さいふを みせる。", translation: "My friend shows me their wallet." },
      { text: "あたらしい さいふだ。", translation: "It's a new wallet." },
    ],
  },
  {
    id: "ja-m15-the-weekend-ahead",
    languageId: "ja",
    module: 15,
    title: "The weekend ahead",
    theme: "A busy day, then a fun one.",
    sentences: [
      { text: "きょうは しごとを する。", translation: "Today I work." },
      { text: "とても いそがしい。", translation: "I'm very busy." },
      { text: "あしたは りょこうに いく。", translation: "Tomorrow I go on a trip." },
      { text: "ともだちと えいがを みる。", translation: "I watch a movie with a friend." },
      { text: "それから かいものを する。", translation: "After that I go shopping." },
      { text: "あたらしい くつが ほしい。", translation: "I want new shoes." },
      { text: "りょこうは たのしい。", translation: "The trip is fun." },
    ],
  },
  {
    id: "ja-m16-a-day-at-school",
    languageId: "ja",
    module: 16,
    title: "A day at school",
    theme: "Class, notes, and homework.",
    sentences: [
      { text: "きょうは クラスが ある。", translation: "Today there's a class." },
      { text: "わたしは きょうしつに はいる。", translation: "I enter the classroom." },
      { text: "きょうしつで ノートに かく。", translation: "I write in my notebook in the classroom." },
      { text: "しゅくだいは やさしいけど たいせつだ。", translation: "The homework is easy but important." },
      { text: "わたしは じぶんで べんきょうする。", translation: "I study by myself." },
    ],
  },
  {
    id: "ja-m17-to-the-station",
    languageId: "ja",
    module: 17,
    title: "To the station",
    theme: "Following the street to the train.",
    sentences: [
      { text: "わたしは えきに いく。", translation: "I go to the station." },
      { text: "みちを まっすぐ あるく。", translation: "I walk straight down the street." },
      { text: "びょういんの まえで みぎに まがる。", translation: "I turn right in front of the hospital." },
      { text: "たてものの よこに えきが ある。", translation: "The station is beside the building." },
      { text: "でんしゃに のる。", translation: "I get on the train." },
      { text: "つぎの えきで おりる。", translation: "I get off at the next station." },
    ],
  },
  {
    id: "ja-m18-a-warm-day",
    languageId: "ja",
    module: 18,
    title: "A warm day",
    theme: "The weather and the garden.",
    sentences: [
      { text: "きょうは てんきが いい。", translation: "The weather is nice today." },
      { text: "そらは はれだ。", translation: "The sky is clear." },
      { text: "とても あたたかい。", translation: "It's very warm." },
      { text: "にわに きが ある。", translation: "There's a tree in the garden." },
      { text: "あしたは たぶん あめだ。", translation: "Tomorrow it will probably rain." },
      { text: "らいしゅうは すずしい。", translation: "Next week will be cool." },
    ],
  },
  {
    id: "ja-m19-my-family",
    languageId: "ja",
    module: 19,
    title: "My family",
    theme: "Four of us, and a birthday.",
    sentences: [
      { text: "わたしの かぞくは よにんです。", translation: "There are four people in my family." },
      { text: "ちちと ははと あにと わたしです。", translation: "My father, mother, older brother, and me." },
      { text: "あには だいがくの がくせいです。", translation: "My brother is a university student." },
      { text: "いもうとは かわいいです。", translation: "My little sister is cute." },
      { text: "あしたは いもうとの たんじょうびです。", translation: "Tomorrow is my sister's birthday." },
      { text: "みんなで ごはんを たべます。", translation: "We'll all eat together." },
    ],
  },
  {
    id: "ja-m20-feeling-sick",
    languageId: "ja",
    module: 20,
    title: "Feeling sick",
    theme: "A trip to the doctor.",
    sentences: [
      { text: "きょうは あたまが いたい。", translation: "My head hurts today." },
      { text: "おなかも いたい。", translation: "My stomach hurts too." },
      { text: "たぶん びょうきだ。", translation: "I'm probably sick." },
      { text: "わたしは びょういんに いく。", translation: "I go to the hospital." },
      { text: "いしゃに はなしを する。", translation: "I talk to the doctor." },
      { text: "まいあさ くすりを のむ。", translation: "I take medicine every morning." },
    ],
  },
  {
    id: "ja-m21-dinner-at-home",
    languageId: "ja",
    module: 21,
    title: "Dinner at home",
    theme: "Setting the table for a meal.",
    sentences: [
      { text: "きょうは うちで しょくじを する。", translation: "Today I have a meal at home." },
      { text: "おさらと はしが ある。", translation: "There are plates and chopsticks." },
      { text: "とりにくと たまごを たべる。", translation: "I eat chicken and eggs." },
      { text: "おさけも のむ。", translation: "I drink sake too." },
      { text: "たべものは おいしい。", translation: "The food is delicious." },
      { text: "のみものは おちゃだ。", translation: "The drink is green tea." },
    ],
  },
  {
    id: "ja-m22-what-i-eat",
    languageId: "ja",
    module: 22,
    title: "What I like to eat",
    theme: "Ranking food, honestly.",
    sentences: [
      { text: "わたしは にくが いちばん すきだ。", translation: "I like meat the most." },
      { text: "さかなより にくの ほうが すきだ。", translation: "I like meat more than fish." },
      { text: "やさいは あまり たべない。", translation: "I don't eat many vegetables." },
      { text: "くだものは たくさん たべる。", translation: "I eat a lot of fruit." },
      { text: "カレーも おいしい。", translation: "Curry is tasty too." },
      { text: "きょうは のどが いたい。", translation: "My throat hurts today." },
    ],
  },
  {
    id: "ja-m23-a-party",
    languageId: "ja",
    module: 23,
    title: "A party tomorrow",
    theme: "Plans with friends.",
    sentences: [
      { text: "あした ともだちの パーティーが ある。", translation: "There's a friend's party tomorrow." },
      { text: "わたしも いっしょに いく。", translation: "I'll go along too." },
      { text: "パーティーで ばんごはんを たべる。", translation: "We'll eat dinner at the party." },
      { text: "みんなで うたを うたう。", translation: "Everyone sings songs." },
      { text: "きのうは たくさん はたらいた。", translation: "Yesterday I worked a lot." },
      { text: "あしたは あそぶ つもりだ。", translation: "Tomorrow I plan to have fun." },
    ],
  },
  {
    id: "ja-m24-things-i-can-do",
    languageId: "ja",
    module: 24,
    title: "Things I can do",
    theme: "A small list of skills.",
    sentences: [
      { text: "わたしは りょうりが できる。", translation: "I can cook." },
      { text: "あたらしい ものを つくる。", translation: "I make new things." },
      { text: "わたしは えを かく。", translation: "I draw pictures." },
      { text: "えいごが すこし はなせる。", translation: "I can speak a little English." },
      { text: "ラジオで おんがくを きく。", translation: "I listen to music on the radio." },
      { text: "わたしは えが すきだ。", translation: "I like pictures." },
    ],
  },
  {
    id: "ja-m25-studying-abroad",
    languageId: "ja",
    module: 25,
    title: "Studying abroad",
    theme: "Plans for next year.",
    sentences: [
      { text: "らいねん わたしは がいこくに いく。", translation: "Next year I'll go abroad." },
      { text: "わたしは りゅうがくせいだ。", translation: "I'm an exchange student." },
      { text: "がいこくで ともだちに あう。", translation: "I'll meet friends abroad." },
      { text: "たぶん たのしいだろう。", translation: "It will probably be fun." },
      { text: "きっと いいだろう。", translation: "It's sure to be good." },
      { text: "あたらしい ほんを かう。", translation: "I'll buy new books." },
    ],
  },
  {
    id: "ja-m26-a-tiring-day",
    languageId: "ja",
    module: 26,
    title: "A tiring day",
    theme: "Worn out, but still eating.",
    sentences: [
      { text: "きょうは しごとが おおい。", translation: "There's a lot of work today." },
      { text: "わたしは とても つかれる。", translation: "I get very tired." },
      { text: "でも ばんごはんは おいしい。", translation: "But dinner is delicious." },
      { text: "しかし カレーは からい。", translation: "However, the curry is spicy." },
      { text: "へやが せまい。", translation: "The room is small." },
      { text: "そして わたしは ねる。", translation: "And then I sleep." },
    ],
  },
  {
    id: "ja-m27-practice-every-day",
    languageId: "ja",
    module: 27,
    title: "Practice every day",
    theme: "Getting a little better, daily.",
    sentences: [
      { text: "わたしは まいにち えいごを れんしゅうする。", translation: "I practice English every day." },
      { text: "だんだん じょうずに なる。", translation: "Little by little I get better." },
      { text: "しごとは たいへんだ。", translation: "Work is tough." },
      { text: "でも わたしは つよい。", translation: "But I'm strong." },
      { text: "よるは そとが くらい。", translation: "At night it's dark outside." },
      { text: "それから ねる。", translation: "Then I sleep." },
    ],
  },
  {
    id: "ja-m29-cleaning-day",
    languageId: "ja",
    module: 29,
    title: "Cleaning day",
    theme: "Tidying up with help.",
    sentences: [
      { text: "きょうは いそがしい。", translation: "Today I'm busy." },
      { text: "わたしは うちを かたづける。", translation: "I tidy up the house." },
      { text: "ともだちが てつだう。", translation: "A friend helps." },
      { text: "ふたりで ほんを はこぶ。", translation: "The two of us carry books." },
      { text: "あたらしい ふくを えらぶ。", translation: "I pick out new clothes." },
      { text: "ぜんぶ きれいに なる。", translation: "Everything gets clean." },
    ],
  },
  {
    id: "ja-m30-people-at-work",
    languageId: "ja",
    module: 30,
    title: "People at work",
    theme: "Seniors, coworkers, and juniors.",
    sentences: [
      { text: "かいしゃに せんぱいが いる。", translation: "There's a senior colleague at work." },
      { text: "せんぱいは とても したしい。", translation: "The senior is very friendly." },
      { text: "わたしは せんぱいに けいごを つかう。", translation: "I use polite language with the senior." },
      { text: "どうりょうは しりあいだ。", translation: "My coworker is an acquaintance." },
      { text: "こうはいも なかまだ。", translation: "My junior is a friend too." },
      { text: "やっぱり かいしゃは たいへんだ。", translation: "Work is tough after all." },
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
