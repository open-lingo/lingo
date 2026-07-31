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
  // ── Early (m3-m8): sparse, ~1 story per 2 modules ──────────────────────────
  {
    id: "ja-m3-about-me",
    languageId: "ja",
    module: 3,
    title: "About me",
    theme: "A short self-introduction.",
    sentences: [
      { text: "はじめまして。", translation: "Nice to meet you." },
      { text: "トムです。", translation: "I'm Tom." },
      { text: "アメリカじんです。", translation: "I'm American." },
      { text: "がくせいです。", translation: "I'm a student." },
      { text: "ミカは ともだちです。", translation: "Mika is my friend." },
      { text: "ミカも がくせいです。", translation: "Mika is a student too." },
      { text: "たなかせんせいは にほんじんです。", translation: "Mr. Tanaka is Japanese." },
    ],
  },
  {
    id: "ja-m5-shop-errand",
    languageId: "ja",
    module: 5,
    title: "At the shop",
    theme: "Asking prices on a quick errand.",
    sentences: [
      { text: "すみません。", translation: "Excuse me." },
      { text: "これは いくらですか。", translation: "How much is this?" },
      { text: "ひゃくえんです。", translation: "It's 100 yen." },
      { text: "あれは いくらですか。", translation: "How much is that one over there?" },
      { text: "ごひゃくえんです。", translation: "It's 500 yen." },
      { text: "これ、ください。", translation: "This one, please." },
      { text: "ありがとうございます。", translation: "Thank you." },
    ],
  },
  {
    id: "ja-m7-my-day",
    languageId: "ja",
    module: 7,
    title: "My day",
    theme: "A simple run through a day.",
    sentences: [
      { text: "わたしは がくせいです。", translation: "I'm a student." },
      { text: "ごはんを たべます。", translation: "I eat a meal." },
      { text: "おちゃを のみます。", translation: "I drink green tea." },
      { text: "がっこうに いきます。", translation: "I go to school." },
      { text: "としょかんで ほんを よみます。", translation: "I read a book at the library." },
      { text: "ともだちも きます。", translation: "My friend comes too." },
      { text: "うちで ニュースを みます。", translation: "I watch the news at home." },
    ],
  },
  // ── Mid (m9-m17): ~1 story per module ──────────────────────────────────────
  {
    id: "ja-m9-a-lively-town",
    languageId: "ja",
    module: 9,
    title: "A lively town",
    theme: "First impressions of the neighborhood.",
    sentences: [
      { text: "このまちは とても にぎやかです。", translation: "This town is very lively." },
      { text: "えきは べんりです。", translation: "The station is convenient." },
      { text: "こうえんは しずかです。", translation: "The park is quiet." },
      { text: "コーヒーは とても おいしいです。", translation: "The coffee is really delicious." },
      { text: "わたしは えいごが じょうずです。", translation: "I'm good at English." },
      { text: "きょうは ひまです。", translation: "I'm free today." },
      { text: "ここは いいところです。", translation: "This is a nice place." },
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
      { text: "じゅぎょうは むずかしいです。", translation: "The class is hard." },
      { text: "それから としょかんに いきます。", translation: "After that I go to the library." },
      { text: "としょかんで ほんを よみます。", translation: "I read a book at the library." },
      { text: "えいごも すこし わかります。", translation: "I understand a little English too." },
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
      { text: "あさ、コーヒーを のんだ。", translation: "In the morning I drank coffee." },
      { text: "ともだちと テレビを みた。", translation: "I watched TV with a friend." },
      { text: "みせで ぼうしを かった。", translation: "I bought a hat at the shop." },
      { text: "うたも きいた。", translation: "I listened to music too." },
      { text: "ひるごはんを たべた。", translation: "I ate lunch." },
      { text: "ともだちと よく あそんだ。", translation: "I had a lot of fun with my friend." },
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
      { text: "ゆうがたに コーヒーを のみます。", translation: "In the evening I drink coffee." },
      { text: "よるは うちで テレビを みます。", translation: "At night I watch TV at home." },
      { text: "いまは ばんです。", translation: "It's night now." },
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
      { text: "まいにち きっさてんに いく。", translation: "Every day I go to the coffee shop." },
      { text: "きっさてんで コーヒーを のむ。", translation: "I drink coffee there." },
      { text: "おちゃは あまり すきじゃない。", translation: "I don't like tea much." },
      { text: "あたらしい ふくが ほしい。", translation: "I want new clothes." },
      { text: "なつやすみが ほんとうに すきだ。", translation: "I really like summer vacation." },
      { text: "なつやすみは そとで あそぶ。", translation: "In summer vacation I play outside." },
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
      { text: "ふたりで コーヒーを のむ。", translation: "The two of us drink coffee." },
      { text: "ともだちは はなしを する。", translation: "My friend tells a story." },
      { text: "ともだちは あたらしい さいふを みせる。", translation: "My friend shows me a new wallet." },
      { text: "とても いい さいふだ。", translation: "It's a really nice wallet." },
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
      { text: "あさごはんを たべて、がっこうに はしる。", translation: "I eat breakfast and run to school." },
      { text: "きょうは クラスが ある。", translation: "Today there's a class." },
      { text: "わたしは きょうしつに はいる。", translation: "I enter the classroom." },
      { text: "きょうしつで ノートに かく。", translation: "I write in my notebook in the classroom." },
      { text: "しゅくだいは やさしいけど たいせつだ。", translation: "The homework is easy but important." },
      { text: "わたしは じぶんで べんきょうする。", translation: "I study by myself." },
      { text: "スポーツも すこし する。", translation: "I do a bit of sports too." },
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
      { text: "はしを わたる。", translation: "I cross the bridge." },
      { text: "たてものの よこに えきが ある。", translation: "The station is beside the building." },
      { text: "でんしゃに のる。", translation: "I get on the train." },
      { text: "つぎの えきで おりる。", translation: "I get off at the next station." },
    ],
  },
  // ── Late (m18-m30): ramp up — 1, sometimes 2 stories per module ────────────
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
      { text: "にわに おおきな きが ある。", translation: "There's a big tree in the garden." },
      { text: "となりの こうえんを あるく。", translation: "I walk in the park next door." },
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
      { text: "いもうとは とても かわいいです。", translation: "My little sister is very cute." },
      { text: "あしたは いもうとの たんじょうびです。", translation: "Tomorrow is my sister's birthday." },
      { text: "みんなで ごはんを たべます。", translation: "We'll all eat together." },
      { text: "かぞくは みんな げんきです。", translation: "My family is all doing well." },
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
      { text: "まいばん ゆっくりと ねる。", translation: "Every night I sleep well." },
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
      { text: "たべものは とても おいしい。", translation: "The food is really delicious." },
      { text: "のみものは おちゃだ。", translation: "The drink is green tea." },
      { text: "どうぞ、たくさん たべて。", translation: "Please, eat a lot." },
    ],
  },
  {
    id: "ja-m21-a-packed-lunch",
    languageId: "ja",
    module: 21,
    title: "A packed lunch",
    theme: "A lunchbox for a day out.",
    sentences: [
      { text: "あした ともだちと こうえんに いく。", translation: "Tomorrow I go to the park with a friend." },
      { text: "わたしは おべんとうを もつ。", translation: "I bring a boxed lunch." },
      { text: "おべんとうに とりにくと たまごが ある。", translation: "In the lunchbox there's chicken and egg." },
      { text: "のみものも もつ。", translation: "I bring a drink too." },
      { text: "こうえんで たべる。", translation: "We eat at the park." },
      { text: "たべものは ちょうど いい。", translation: "The amount of food is just right." },
      { text: "ほんとうに たのしい いちにちだ。", translation: "It's a really fun day." },
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
      { text: "きょうは のどが いたい。", translation: "Today my throat hurts." },
      { text: "きょうは すこし たべる。", translation: "Today I eat just a little." },
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
      { text: "みんなで うたを うたう。", translation: "Everyone sings." },
      { text: "きのうは たくさん はたらいた。", translation: "Yesterday I worked a lot." },
      { text: "あしたは あそぶ つもりだ。", translation: "Tomorrow I plan to have fun." },
      { text: "パーティーは とても たのしい。", translation: "The party will be a lot of fun." },
    ],
  },
  {
    id: "ja-m23-a-day-at-the-sea",
    languageId: "ja",
    module: 23,
    title: "A day at the sea",
    theme: "Swimming with a friend.",
    sentences: [
      { text: "なつやすみに ともだちと うみに いった。", translation: "In summer vacation I went to the sea with a friend." },
      { text: "ふたりで たくさん およいだ。", translation: "The two of us swam a lot." },
      { text: "ともだちは じょうずに およいだ。", translation: "My friend swam well." },
      { text: "わたしは あまり じょうずじゃない。", translation: "I'm not very good." },
      { text: "あとで レストランで ばんごはんを たべた。", translation: "Afterwards we ate dinner at a restaurant." },
      { text: "ほんとうに たのしい いちにちだった。", translation: "It was a really fun day." },
      { text: "また いっしょに およぐ つもりだ。", translation: "I plan to swim together again." },
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
      { text: "うたは あまり じょうずじゃない。", translation: "I'm not very good at singing." },
      { text: "いっしょに なにか つくる。", translation: "Let's make something together." },
    ],
  },
  {
    id: "ja-m25-studying-abroad",
    languageId: "ja",
    module: 25,
    title: "Studying abroad",
    theme: "Plans for next year.",
    sentences: [
      { text: "らいねん わたしは がいこくに いく。", translation: "Next year I go abroad." },
      { text: "わたしは りゅうがくせいだ。", translation: "I'm an exchange student." },
      { text: "がいこくで あたらしい ともだちに あう。", translation: "I'll meet new friends abroad." },
      { text: "たぶん たのしいだろう。", translation: "It'll probably be fun." },
      { text: "きっと いい だいがくだろう。", translation: "It's sure to be a good university." },
      { text: "あたらしい ほんも かう。", translation: "I'll buy new books too." },
      { text: "がいこくの まちを あるく。", translation: "I'll walk around the foreign city." },
    ],
  },
  {
    id: "ja-m25-an-old-friend",
    languageId: "ja",
    module: 25,
    title: "Meeting an old friend",
    theme: "A reunion at the station.",
    sentences: [
      { text: "あした えきで ともだちに あう。", translation: "Tomorrow I meet a friend at the station." },
      { text: "ともだちは きょねん がいこくに いった。", translation: "My friend went abroad last year." },
      { text: "たぶん たくさん はなしを する。", translation: "We'll probably talk a lot." },
      { text: "ふたりで ばんごはんを たべるだろう。", translation: "The two of us will probably eat dinner." },
      { text: "きっと たのしいだろう。", translation: "It's sure to be fun." },
      { text: "わたしも らいねん がいこくに いく。", translation: "I'll go abroad next year too." },
      { text: "ともだちに また あう。", translation: "I'll meet my friend again." },
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
      { text: "へやは せまい。", translation: "The room is small." },
      { text: "わたしは かぎを わすれる。", translation: "I forget my key." },
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
      { text: "しかし わたしは べんきょうする。", translation: "But I study." },
      { text: "それから ゆっくりと ねる。", translation: "Then I sleep well." },
    ],
  },
  {
    id: "ja-m27-getting-stronger",
    languageId: "ja",
    module: 27,
    title: "Getting stronger",
    theme: "A morning running habit.",
    sentences: [
      { text: "わたしは まいあさ こうえんを はしる。", translation: "Every morning I run in the park." },
      { text: "まえは たいへんだった。", translation: "It used to be tough." },
      { text: "でも だんだん げんきに なる。", translation: "But little by little I get healthy." },
      { text: "いまは とても げんきだ。", translation: "Now I'm very energetic." },
      { text: "からだも じょうぶに なる。", translation: "My body gets stronger too." },
      { text: "はしるのは たのしい。", translation: "Running is fun." },
      { text: "まいにち れんしゅうする。", translation: "I practice every day." },
    ],
  },
  {
    id: "ja-m29-cleaning-day",
    languageId: "ja",
    module: 29,
    title: "Cleaning day",
    theme: "Tidying up with help.",
    sentences: [
      { text: "きょうは とても いそがしい。", translation: "Today I'm very busy." },
      { text: "わたしは うちを かたづける。", translation: "I tidy up the house." },
      { text: "ともだちが てつだう。", translation: "A friend helps." },
      { text: "ふたりで ほんを はこぶ。", translation: "The two of us carry books." },
      { text: "わたしは あたらしい ふくを えらぶ。", translation: "I pick out new clothes." },
      { text: "ともだちは いすを なおす。", translation: "My friend fixes the chair." },
      { text: "そして ぜんぶ きれいに なる。", translation: "And then everything gets clean." },
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
      { text: "こうはいも なかまだ。", translation: "My junior is a comrade too." },
      { text: "じょうしは とても ていねいだ。", translation: "The boss is very polite." },
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
