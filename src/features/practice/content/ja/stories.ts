/** STORIES newly authored for m3-m7 using only in-module atoms. */
import type { Story } from "../types";

export const JA_STORIES: Story[] = [
  // ── Early (m3-m8): sparse, ~1 story per 2 modules ──────────────────────────
  {
    id: "ja-m3-about-me",
    languageId: "ja",
    module: 3,
    level: 2,
    title: "About me",
    theme: "A short self-introduction.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "たなかせんせいは にほんじんですか、アメリカじんですか、がくせいですか。",
        options: ["にほんじんです", "アメリカじんです", "がくせいです"],
        answer: "にほんじんです",
      },
    ],
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
    // m3 stretch read. The pool at m3 is copula-only — は / も / か are the only
    // particles and no verb takes an argument — so the arc has to be carried by
    // state descriptions and でした. Both glosses are one and eight modules out
    // and each buys a beat the pool cannot otherwise write: わたし a subject who
    // persists, あした the closing change of state.
    id: "ja-m3-a-cold",
    languageId: "ja",
    module: 3,
    level: 2,
    title: "A cold",
    theme: "Fine in the morning, not by the afternoon.",
    tags: ["health", "friends"],
    glosses: [
      { surface: "あした", meaning: "tomorrow", atomId: "ja:ashita" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "かぜは ケンですか、ユミですか、せんせいですか。",
        options: ["ケンです", "ユミです", "せんせいです"],
        answer: "ケンです",
      },
    ],
    sentences: [
      { text: "こんにちは。わたしは ケンです。", translation: "Hello. I'm Ken." },
      { text: "わたしは がくせいです。", translation: "I'm a student." },
      { text: "あさは げんきでした。", translation: "This morning I was fine." },
      { text: "きょうは かぜです。", translation: "Today I have a cold." },
      { text: "げんきじゃないです。", translation: "I'm not well." },
      { text: "きょうは いえです。", translation: "Today I'm at home." },
      { text: "ともだちは ユミです。", translation: "My friend is Yumi." },
      { text: "ユミも かぜですか。", translation: "Does Yumi have a cold too?" },
      { text: "いいえ、ユミも たなかせんせいも げんきです。", translation: "No — Yumi and Mr. Tanaka are both fine." },
      { text: "あしたは げんきです。", translation: "Tomorrow I'll be fine." },
    ],
  },
  {
    // m4 stretch read. m4 adds の / が / と and the これ-それ-あれ set, which is
    // exactly enough for a whose-is-this hunt. それから is glossed here and NOT
    // at m5+: it decomposes as それ (m4) + から (m5), so from m5 the gate — and
    // the learner — read it for free.
    id: "ja-m4-whose-bag",
    languageId: "ja",
    // m4→m6 (2026-08-20 restamp): が/あります are truthfully m6's (ir-introduces ja-m6-neo-4).
    module: 6,
    level: 2,
    title: "Whose bag?",
    theme: "An unclaimed bag, and a name inside it.",
    tags: ["school", "mystery"],
    glosses: [
      { surface: "それから", meaning: "after that, and then", atomId: "ja:sorekara" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "かばんは だれのですか。",
        options: ["たなかせんせいのです", "ユミのです", "わたしのです"],
        answer: "たなかせんせいのです",
      },
    ],
    sentences: [
      { text: "かばんが あります。", translation: "There's a bag here." },
      { text: "わたしの かばんじゃないです。", translation: "It isn't my bag." },
      { text: "だれの かばんですか。", translation: "Whose bag is it?" },
      { text: "これは ユミの かばんですか。", translation: "Is this Yumi's bag?" },
      { text: "いいえ、ユミの かばんは あれです。", translation: "No — Yumi's bag is that one over there." },
      { text: "じしょと てがみが あります。", translation: "There's a dictionary, and a letter." },
      { text: "それから、てがみの なまえは たなかです。", translation: "And the name on the letter is Tanaka." },
      { text: "これは たなかせんせいの かばんです。", translation: "So this is Mr. Tanaka's bag." },
      { text: "たなかせんせいは わたしの せんせいです。", translation: "And Mr. Tanaka is my own teacher." },
    ],
  },
  {
    id: "ja-m5-shop-errand",
    languageId: "ja",
    // m5→m9 (2026-08-20 restamp): the number line (ご/に/ひゃく…) is truthfully m9's.
    module: 9,
    level: 2,
    title: "At the shop",
    theme: "Asking prices on a quick errand.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "あれは いくらですか。",
        options: ["ひゃくえんです", "ごひゃくえんです", "にひゃくえんです"],
        answer: "ごひゃくえんです",
      },
    ],
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
    // m5 stretch read. Sits above ja-m5-shop-errand's price-asking errand: same
    // counter, but a problem and a fix. Numbers are constrained — the rendaku
    // hundreds (さんびゃく / ろっぴゃく / はっぴゃく) are their own atoms at m20,
    // so only よん / ご / なな / に + ひゃく are writable here, and the arithmetic
    // was built to land on 500.
    //
    // The goods are じしょ (m4) and ジュース (m5), NOT ぱん: the m2 ぱん atom is
    // the kana-drill spelling, and the real word パン is m12. When the only
    // available spelling of a noun is its kana-practice form, pick a different
    // noun.
    id: "ja-m5-not-quite-enough",
    languageId: "ja",
    // m5→m27 (2026-08-20 restamp): おかね's true teaching site is m27 (ふたり m17, numbers m9). R16 can migrate this back when おかね re-homes earlier.
    module: 27,
    level: 2,
    title: "Not quite enough",
    theme: "Two friends, one snack, and a hundred yen missing.",
    tags: ["shopping", "friends", "money"],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "ジュースと じしょは いくらですか。",
        options: ["ごひゃくえんです", "よんひゃくえんです", "ひゃくえんです"],
        answer: "ごひゃくえんです",
      },
    ],
    sentences: [
      { text: "きょうは ユミと ふたりです。", translation: "Today it's Yumi and me." },
      { text: "わたしの おかねは よんひゃくえんです。", translation: "I have four hundred yen." },
      { text: "ジュースは ひゃくえんです。", translation: "The juice is a hundred yen." },
      { text: "じしょは よんひゃくえんです。", translation: "The dictionary is four hundred yen." },
      { text: "じしょは たかいです。", translation: "The dictionary is expensive." },
      { text: "ジュースと じしょは ごひゃくえんです。", translation: "Juice and dictionary together are five hundred yen." },
      { text: "わたしの おかねは ごひゃくえんじゃないです。", translation: "I don't have five hundred yen." },
      { text: "ユミの おかねは ひゃくえんです。", translation: "Yumi has a hundred yen." },
      { text: "ユミと わたしは ごひゃくえんです。", translation: "Yumi and I together have five hundred." },
      { text: "それから、ジュースと じしょ、ください。ありがとうございます。", translation: "And so: the juice and the dictionary, please. Thank you." },
    ],
  },
  {
    // m6 stretch read. m6 hands over に / で / あります / います and the place
    // nouns, but every positive verb is still one module away — only the plain
    // NEGATIVES (たべない, いかない…) are in pool — so nobody can go anywhere.
    // A static location hunt is what the module can actually tell. ありません is
    // glossed one module out to hold the polite register the m3-m10 run uses.
    id: "ja-m6-the-missing-phone",
    languageId: "ja",
    module: 6,
    level: 2,
    title: "The missing phone",
    theme: "Not in the room, not in the bag, not at school.",
    tags: ["school", "friends", "town"],
    glosses: [
      { surface: "ありません", meaning: "there isn't (polite)", atomId: "ja:arimasen" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "けいたいは どこに ありますか。",
        options: ["ユミの かばんに あります", "わたしの へやに あります", "がっこうに あります"],
        answer: "ユミの かばんに あります",
      },
    ],
    sentences: [
      { text: "わたしの けいたいが ありません。", translation: "My phone is gone." },
      { text: "へやに ありません。", translation: "It isn't in my room." },
      { text: "かばんにも ありません。", translation: "It isn't in my bag either." },
      { text: "がっこうにも ありません。", translation: "It isn't at school either." },
      { text: "けいたいは どこですか。", translation: "Where is my phone?" },
      { text: "ともだちの ユミは こうえんに います。", translation: "My friend Yumi is at the park." },
      { text: "こうえんは がっこうから ちかいです。", translation: "The park is close to the school." },
      { text: "それから、ユミの かばんに わたしの けいたいが あります。", translation: "And there, in Yumi's bag, is my phone." },
      { text: "ユミ、ありがとう。", translation: "Thank you, Yumi." },
    ],
  },
  {
    id: "ja-m7-my-day",
    languageId: "ja",
    module: 7,
    level: 2,
    title: "My day",
    theme: "A simple run through a day.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "としょかんで なにを よみますか。",
        options: ["ほんです", "ニュースです", "てがみです"],
        answer: "ほんです",
      },
    ],
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
  {
    // m7 stretch read, and the counter-example to ja-m7-my-day's seven
    // unrelated drills: same module, same verbs, but one waiting man and an
    // arrival. m7 has no adjectives at all (they start at m8), so the only
    // descriptive word in the story is the glossed おいしい.
    id: "ja-m7-at-the-airport",
    languageId: "ja",
    module: 7,
    level: 3,
    title: "At the airport",
    theme: "Waiting for a friend who doesn't get off the first plane.",
    tags: ["travel", "friends", "food"],
    glosses: [
      { surface: "まちます", meaning: "to wait (polite)", atomId: "ja:matsu" },
      { surface: "まだ", meaning: "still, not yet", atomId: "ja:mada" },
      { surface: "おいしい", meaning: "delicious", atomId: "ja:oishii" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "ふたりは くうこうで なにを たべますか。",
        options: ["すしです", "ごはんです", "おちゃです"],
        answer: "すしです",
      },
    ],
    sentences: [
      { text: "きょう、ともだちが アメリカから きます。", translation: "Today a friend is coming from America." },
      { text: "ともだちの なまえは トムです。", translation: "My friend's name is Tom." },
      { text: "わたしは でんしゃで くうこうに いきます。", translation: "I take the train to the airport." },
      { text: "くうこうで トムを まちます。", translation: "I wait for Tom at the airport." },
      { text: "トムは きません。", translation: "Tom doesn't come." },
      { text: "わたしは かばんの ほんを よみます。", translation: "I read the book in my bag." },
      { text: "それから、おちゃを のみます。", translation: "After that I drink some tea." },
      { text: "トムは まだ きません。", translation: "Tom still isn't here." },
      { text: "わたしは くうこうで ごはんを たべます。", translation: "I eat a meal at the airport." },
      { text: "ニュースも みます。", translation: "I watch the news too." },
      { text: "トムが きます。", translation: "Tom arrives." },
      { text: "ふたりで すしを たべます。", translation: "The two of us eat sushi." },
      { text: "すしは おいしいです。", translation: "The sushi is delicious." },
      { text: "それから、ふたりで うちに いきます。", translation: "And then the two of us head home." },
    ],
  },
  {
    // m8 stretch read. m8 is the adjective module, so this is the first story in
    // the m3-m15 run that can compare two things — which is the plot. けど is
    // the nearest atom carrying "but" (m16); でも and そして are m26 and でも
    // false-positives through the gate as で + も, so it is not an option here.
    id: "ja-m8-the-old-hat",
    languageId: "ja",
    module: 8,
    level: 3,
    title: "The old hat",
    theme: "Out to buy a new hat, home with an old one.",
    tags: ["shopping", "town"],
    glosses: [
      { surface: "けど", meaning: "but, although", atomId: "ja:kedo" },
      { surface: "とても", meaning: "very", atomId: "ja:totemo" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "わたしは どの ぼうしを かいますか。",
        options: ["ふるい ぼうしです", "あたらしい ぼうしです", "おおきい ぼうしです"],
        answer: "ふるい ぼうしです",
      },
    ],
    sentences: [
      { text: "きょう、わたしは あたらしい ぼうしを かいます。", translation: "Today I'm going to buy a new hat." },
      { text: "うちから まちは とおいです。", translation: "Town is far from my house." },
      { text: "わたしは バスで まちに いきます。", translation: "I take the bus into town." },
      { text: "バスは おそいです。", translation: "The bus is slow." },
      { text: "まちの おおきい みせに いきます。", translation: "I go to the big shop in town." },
      { text: "その みせの ぼうしは あたらしいです。", translation: "That shop's hats are new." },
      { text: "あたらしいけど、とても たかいです。", translation: "New — but very expensive." },
      { text: "わたしは その ぼうしを かいません。", translation: "I don't buy that hat." },
      { text: "それから、ちいさい みせに いきます。", translation: "After that I go to a small shop." },
      { text: "その みせの ぼうしは ふるいけど、やすいです。", translation: "That shop's hat is old, but cheap." },
      { text: "わたしは その ぼうしを かいます。", translation: "I buy that one." },
      { text: "その ぼうしは とても いいです。", translation: "That hat is a very good one." },
      { text: "それから、コーヒーを のんで、しんぶんを よみます。", translation: "Then I drink a coffee and read the paper." },
      { text: "コーヒーは おいしいです。", translation: "The coffee is good." },
      { text: "わたしは バスで うちに いきます。", translation: "I take the bus home." },
    ],
  },
  // ── Mid (m9-m17): ~1 story per module ──────────────────────────────────────
  {
    id: "ja-m9-a-lively-town",
    languageId: "ja",
    module: 9,
    level: 2,
    title: "A lively town",
    theme: "First impressions of the neighborhood.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "こうえんは どうですか。",
        options: ["しずかです", "にぎやかです", "べんりです"],
        answer: "しずかです",
      },
    ],
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
    // m9 stretch read. Polite present throughout: the polite PAST is mostly
    // unwritable — いきました / たべました / のみました never gate at any module
    // — so the one past beat the arc needs rides on わかりました, which is a
    // survival phrase and therefore in pool from m1.
    id: "ja-m9-the-english-test",
    languageId: "ja",
    module: 9,
    level: 3,
    title: "The English test",
    theme: "Bad at English, with a test tomorrow and a friend who isn't.",
    tags: ["school", "friends", "study"],
    glosses: [
      { surface: "あした", meaning: "tomorrow", atomId: "ja:ashita" },
      { surface: "けど", meaning: "but, although", atomId: "ja:kedo" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        // NOT "わたしの えいごは どうですか": the story states both へたです
        // (line 1) and すこし じょうずです (line 13), so that framing has two
        // defensible answers. The test cannot catch this — only reading can.
        prompt: "わたしは テストが だいじょうぶですか。",
        options: ["はい、だいじょうぶです", "いいえ、へたです", "いいえ、むずかしいです"],
        answer: "はい、だいじょうぶです",
      },
    ],
    sentences: [
      { text: "わたしは えいごが へたです。", translation: "I'm bad at English." },
      { text: "あしたは えいごの テストです。", translation: "Tomorrow is the English test." },
      { text: "テストは とても むずかしいです。", translation: "The test is very hard." },
      { text: "ともだちの ユミは えいごが じょうずです。", translation: "My friend Yumi is good at English." },
      { text: "ユミ、えいごを おしえて ください。", translation: "Yumi, please teach me English." },
      { text: "ユミは としょかんに きます。", translation: "Yumi comes to the library." },
      { text: "ふたりで えいごの ほんを よみます。", translation: "The two of us read an English book." },
      { text: "それから、えいごの ニュースも ききます。", translation: "After that we listen to the English news too." },
      { text: "えいごは ちょっと むずかしいです。", translation: "English is a bit hard." },
      { text: "けど、すこし わかりました。", translation: "But I understood a little." },
      { text: "あさ、テストです。", translation: "Morning — the test." },
      { text: "テストは むずかしいけど、だいじょうぶです。", translation: "The test is hard, but I'm all right." },
      { text: "わたしの えいごは すこし じょうずです。", translation: "My English is a little better." },
      { text: "ユミ、ありがとうございます。", translation: "Thank you, Yumi." },
    ],
  },
  {
    id: "ja-m10-back-to-school",
    languageId: "ja",
    module: 10,
    level: 2,
    title: "Back to school",
    theme: "The first day after a break.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "きのうは なんでしたか。",
        options: ["やすみでした", "じゅぎょうでした", "ひまでした"],
        answer: "やすみでした",
      },
    ],
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
    // m10 stretch read. Only one gloss: m10 finally has それから as a real atom
    // and しります / ちがいます / わかります for the confusion beat, so the pool
    // carries the arc almost unaided. まちます is deliberately NOT used — from
    // m8 it decomposes as まち "town" + ます and sails through the gate, which is
    // a false positive, not a licence (guide §2).
    id: "ja-m10-the-wrong-train",
    languageId: "ja",
    module: 10,
    level: 3,
    title: "The wrong train",
    theme: "A day off, a friend at the park, and a train going the other way.",
    tags: ["travel", "friends", "town"],
    glosses: [{ surface: "けど", meaning: "but, although", atomId: "ja:kedo" }],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "ふたりは どこで あそびますか。",
        options: ["こうえんです", "とうきょうです", "えきです"],
        answer: "こうえんです",
      },
    ],
    sentences: [
      { text: "きょうは やすみです。", translation: "Today is a day off." },
      { text: "わたしは ともだちの ユミと こうえんに いきます。", translation: "I'm going to the park with my friend Yumi." },
      { text: "ユミは こうえんに います。", translation: "Yumi is at the park." },
      { text: "わたしは えきに いきます。", translation: "I go to the station." },
      { text: "わたしは でんしゃで こうえんに いきます。", translation: "I take the train towards the park." },
      { text: "けど、その でんしゃは ちがいます。", translation: "But that train is the wrong one." },
      { text: "わたしは しりません。", translation: "I don't realise it." },
      { text: "でんしゃは とおい とうきょうに いきます。", translation: "The train goes to far-off Tokyo." },
      { text: "ここは どこですか。", translation: "Where am I?" },
      { text: "わたしは えきの ひとに ききます。", translation: "I ask someone at the station." },
      { text: "わたしは わかりました。", translation: "Now I understand." },
      { text: "それから、あたらしい でんしゃで こうえんに いきます。", translation: "After that I take another train to the park." },
      { text: "ユミは こうえんで ほんを よみます。", translation: "Yumi is reading a book at the park." },
      { text: "わたしは ちょっと おそいです。", translation: "I'm a little late." },
      { text: "けど、ふたりで こうえんで あそびます。", translation: "But the two of us have our day in the park." },
      { text: "きょうは たいへんでした。", translation: "Today was rough." },
    ],
  },
  {
    id: "ja-m11-last-saturday",
    languageId: "ja",
    module: 11,
    level: 2,
    title: "Last Saturday",
    theme: "Looking back on the weekend.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "みせで なにを かいましたか。",
        options: ["ぼうしです", "テレビです", "うたです"],
        answer: "ぼうしです",
      },
    ],
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
    // m11 stretch read. ONE temporal frame, held throughout: narrative present
    // with a past coda (わかった / たいへんだった), the same shape as the m12
    // exemplar. A fully past telling is not available even at m11, because the
    // negatives the arc turns on have no past form in pool — こなかった and
    // いなかった both residual (なかった is m16), so "Yumi didn't come" can only
    // be said in the present.
    //
    // Deliberately NOT opened on a weekend recap: ja-m11-last-saturday already
    // owns that premise at this module. This one opens on the appointment.
    // The clock atoms (にじ / さんじ / よじ) carry the pacing; the letter
    // planted at line 9 is the payoff.
    id: "ja-m11-two-oclock-at-the-station",
    languageId: "ja",
    module: 11,
    level: 3,
    title: "Two o'clock at the station",
    theme: "A friend who never comes, and a letter read one more time.",
    tags: ["friends", "town"],
    glosses: [
      { surface: "まつ", meaning: "to wait", atomId: "ja:matsu" },
      { surface: "けど", meaning: "but, although", atomId: "ja:kedo" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        // All three days are named in the story: にちようび is the letter,
        // どようび is the day the narrator actually turned up, げつようび is the
        // school day that rules the meet-up out.
        prompt: "ユミと ぼくは いつ こうえんで あそびますか。",
        options: ["にちようびです", "どようびです", "げつようびです"],
        answer: "にちようびです",
      },
    ],
    sentences: [
      { text: "きょうは ユミと こうえんで あそぶ。", translation: "Today Yumi and I are spending the day at the park." },
      { text: "ぼくは にじに えきに いく。", translation: "I go to the station at two." },
      { text: "けど、ユミは いない。", translation: "But Yumi isn't there." },
      { text: "ぼくは えきで ユミを まつ。", translation: "I wait for Yumi at the station." },
      { text: "ぼくは ニュースを みる。", translation: "I watch the news." },
      { text: "さんじ。ユミは まだ こない。", translation: "Three o'clock. Yumi still doesn't come." },
      { text: "ぼくは コーヒーを のむ。", translation: "I drink a coffee." },
      { text: "よじ。ユミは まだ こない。", translation: "Four o'clock. Yumi still doesn't come." },
      { text: "ぼくは ユミの てがみを もういちど みる。", translation: "I look at Yumi's letter one more time." },
      { text: "てがみは にちようびだ。", translation: "The letter says Sunday." },
      { text: "きょうは どようびだ。", translation: "Today is Saturday." },
      { text: "ぼくは わかった。", translation: "I understood." },
      { text: "あしたは にちようびだ。", translation: "Tomorrow is Sunday." },
      { text: "あさっては げつようびだ。げつようびは がっこうだ。", translation: "The day after is Monday, and Monday is school." },
      { text: "あした、また えきに いく。", translation: "Tomorrow I'll come to the station again." },
      { text: "きょうは ほんとうに たいへんだった。", translation: "Today really was something." },
    ],
  },
  {
    id: "ja-m12-a-workday",
    languageId: "ja",
    module: 12,
    level: 2,
    title: "A workday",
    theme: "Morning to night, hour by hour.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "ひるは なにを たべますか。",
        options: ["ラーメンです", "パンです", "すしです"],
        answer: "ラーメンです",
      },
    ],
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
    // L3 EXEMPLAR for docs/story-authoring-guide.md. m12 caps at L3, so this is
    // the stretch read that sits above ja-m12-a-workday's L2.
    //
    // Narrative present throughout, closing on a past-tense coda — the standard
    // Japanese storytelling shape, and also what the pool allows: あった /
    // おいしかった / たのしかった are not atom surfaces at ANY module (probed
    // m1-m40), so a fully past-tense telling strands mid-scene. The one past
    // form the story needs (たのしかった, for a day that has ended) is bought
    // with a gloss.
    //
    // さがす is an m29 atom in an m12 story — a deliberate long reach, allowed
    // because the story IS a search and no earlier atom carries "look for"
    // (みつける is not an atom at all). See the guide §3 "Gloss reach"; the
    // other two glosses are m15/m16, which is the normal distance.
    id: "ja-m12-the-lost-key",
    languageId: "ja",
    module: 12,
    level: 3,
    title: "The lost key",
    theme: "A day out in town turns into a search.",
    tags: ["shopping", "friends", "town"],
    glosses: [
      { surface: "けど", meaning: "but, although", atomId: "ja:kedo" },
      { surface: "さがす", meaning: "to look for, to search", atomId: "ja:sagasu" },
      { surface: "たのしかった", meaning: "was fun (past of たのしい)", atomId: "ja:tanoshii" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "かぎは どこに ありますか。",
        options: ["みせに あります", "うちに あります", "レストランに あります"],
        answer: "みせに あります",
      },
      {
        id: "lunch",
        kind: "detail",
        prompt: "ふたりは レストランで なにを たべますか。",
        options: ["ラーメンです", "すしです", "ごはんです"],
        answer: "ラーメンです",
      },
    ],
    sentences: [
      { text: "きょうは やすみだ。", translation: "Today is a day off." },
      { text: "わたしは ともだちと まちに いく。", translation: "I go into town with a friend." },
      { text: "かばんに うちの かぎが ある。", translation: "My house key is in my bag." },
      { text: "ふたりで みせに いく。", translation: "The two of us go into a shop." },
      { text: "みせの ぼうしは あたらしいけど、とても たかい。", translation: "The shop's hat is new, but it's very expensive." },
      { text: "わたしは ぼうしを かわない。", translation: "I don't buy the hat." },
      { text: "それから レストランで おいしい ラーメンを たべる。", translation: "After that we eat delicious ramen at a restaurant." },
      { text: "ゆうがた、かばんに かぎが ない。", translation: "In the evening, the key isn't in my bag." },
      { text: "とても たいへんだ。", translation: "This is really bad." },
      { text: "ふたりで かぎを さがす。", translation: "The two of us look for the key." },
      { text: "また みせに いく。", translation: "We go back to the shop." },
      { text: "みせに かぎが ある。", translation: "The key is at the shop." },
      { text: "いまは だいじょうぶだ。", translation: "Now everything's fine." },
      { text: "きょうは ほんとうに たのしかった。", translation: "Today really was fun." },
    ],
  },
  {
    id: "ja-m13-likes-and-wants",
    languageId: "ja",
    module: 13,
    level: 2,
    title: "Likes and wants",
    theme: "A few honest preferences.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "なにが すきですか。",
        options: ["コーヒーです", "おちゃです", "しごとです"],
        answer: "コーヒーです",
      },
    ],
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
    // FIRST L4 STORY IN THE CODEBASE (with m14/m15 below it). 24 sentences,
    // where every story in both languages used to top out at 8.
    //
    // Length is what makes the twist affordable: the reader spends eighteen
    // lines inside a panic before the office turns out to be empty. Plain form,
    // per the m13-m30 default. Past ta-forms appear only where m11 registered
    // them (みた / だった / わかった); the rest is narrative present.
    id: "ja-m13-the-day-off",
    languageId: "ja",
    module: 13,
    level: 4,
    title: "The day off",
    theme: "A frantic morning, and an office with nobody in it.",
    tags: ["work", "morning", "town"],
    glosses: [
      { surface: "いそがしい", meaning: "busy", atomId: "ja:isogashii" },
      { surface: "けど", meaning: "but, although", atomId: "ja:kedo" },
      { surface: "はしる", meaning: "to run", atomId: "ja:hashiru" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "きょうは なんですか。",
        options: ["にちようびです", "げつようびです", "しごとです"],
        answer: "にちようびです",
      },
      {
        id: "train",
        kind: "detail",
        prompt: "つぎの でんしゃは なんじですか。",
        options: ["はちじはんです", "しちじです", "くじです"],
        answer: "はちじはんです",
      },
    ],
    sentences: [
      { text: "こんしゅうは とても いそがしい。", translation: "This week is very busy." },
      { text: "ゆうべ、ぼくは テレビを みた。", translation: "Last night I watched TV." },
      { text: "それから、また テレビを みた。", translation: "And after that, more TV." },
      { text: "けさ、ぼくは しちじに おきる。", translation: "This morning I get up at seven." },
      { text: "しごとは はちじだ。", translation: "Work starts at eight." },
      { text: "きょうは げつようびだ。", translation: "Today is Monday." },
      { text: "シャワーも おふろも ない。", translation: "No shower, no bath." },
      { text: "ぼくは かおを あらう。", translation: "I wash my face." },
      { text: "あさ、パンを たべない。", translation: "I skip breakfast." },
      { text: "ぼくは えきに はしる。", translation: "I run to the station." },
      { text: "でんしゃが ない。", translation: "There's no train." },
      { text: "つぎの でんしゃは はちじはんだ。", translation: "The next one is half past eight." },
      { text: "ぼくは コンビニの パンを たべる。", translation: "I eat bread from the convenience store." },
      { text: "パンは ふるいけど、おいしい。", translation: "The bread is old, but good." },
      { text: "それから、でんしゃで かいしゃに いく。", translation: "Then I take the train to the office." },
      { text: "かいしゃに ひとが いない。", translation: "There's nobody at the office." },
      { text: "けど、そとに ともだちの ユミが いる。", translation: "But outside there's my friend Yumi." },
      { text: "「ユミ、きょうは しごとです。」", translation: "\"Yumi, today is work.\"", speaker: "ぼく" },
      { text: "「いいえ、きょうは にちようびです。」", translation: "\"No, today is Sunday.\"", speaker: "ユミ" },
      { text: "「にちようびですか。きょうは げつようびです。」", translation: "\"Is it Sunday? Today is Monday.\"", speaker: "ぼく" },
      { text: "ぼくは わかった。", translation: "I got it." },
      { text: "いまは ごぜん くじだ。", translation: "It's nine in the morning." },
      { text: "ぼくは きっさてんで コーヒーを のむ。", translation: "I have a coffee at the coffee shop." },
      { text: "きょうは しごとが ない。ほんとうに いい やすみだ。", translation: "No work today. A really good day off." },
    ],
  },
  {
    id: "ja-m14-a-visitor",
    languageId: "ja",
    module: 14,
    level: 2,
    title: "A visitor",
    theme: "A friend drops by.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "この はなしは だれの はなしですか。",
        options: ["ともだちの はなしです", "せんせいの はなしです", "かぞくの はなしです"],
        answer: "ともだちの はなしです",
      },
    ],
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
    // m14 L4. m14 is the module that hands over まつ / はなす / みせる / かす /
    // はる and the whole postal set (きって / ふうとう / はがき / ポスト), so the
    // errand plot is the one the pool was built for. かう is m25, so the single
    // purchase is written in the past (かった, m11) inside an otherwise present
    // narration — normal Japanese, and the only form the pool allows.
    id: "ja-m14-the-letter-to-tom",
    languageId: "ja",
    module: 14,
    level: 4,
    title: "The letter to Tom",
    theme: "A reply posted a few hours too late.",
    tags: ["friends", "letters", "town"],
    glosses: [
      { surface: "かく", meaning: "to write", atomId: "ja:ja-m7-1-v-kaku" },
      { surface: "けど", meaning: "but, although", atomId: "ja:kedo" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "トムは いま どこに いますか。",
        options: ["とうきょうに います", "アメリカに います", "うちに います"],
        answer: "とうきょうに います",
      },
      {
        id: "money",
        kind: "detail",
        prompt: "ユミは いくら かしますか。",
        options: ["ごひゃくえんです", "ひゃくえんです", "よんひゃくえんです"],
        answer: "ごひゃくえんです",
      },
    ],
    sentences: [
      { text: "けさ、ポストに トムの はがきが ある。", translation: "This morning there's a postcard from Tom in the postbox." },
      { text: "トムは アメリカの ともだちだ。", translation: "Tom is my friend in America." },
      { text: "はがきの はなしは とても いい。", translation: "The news on the postcard is very good." },
      { text: "トムは らいげつ にほんに くる。", translation: "Tom is coming to Japan next month." },
      { text: "ぼくは トムに てがみを かく。", translation: "I write Tom a letter." },
      { text: "あたらしい ふうとうも ある。", translation: "I have a new envelope too." },
      { text: "けど、きってが ない。", translation: "But I have no stamp." },
      { text: "ぼくは さいふを みる。", translation: "I look in my wallet." },
      { text: "さいふに おかねが ない。", translation: "There's no money in my wallet." },
      { text: "ぼくは ともだちの ユミに はなす。", translation: "I talk to my friend Yumi." },
      { text: "「きってが ありません。おかねも ありません。」", translation: "\"I have no stamp. I have no money either.\"", speaker: "ぼく" },
      { text: "「わたしの さいふに ごひゃくえんが あります。」", translation: "\"There is five hundred yen in my wallet.\"", speaker: "ユミ" },
      { text: "「みせで きってを かいます。」", translation: "\"I'll buy a stamp at the shop.\"", speaker: "ぼく" },
      { text: "ユミは ぼくに ごひゃくえんを かす。", translation: "Yumi lends me five hundred yen." },
      { text: "ぼくは みせで きってを かった。", translation: "I bought a stamp at the shop." },
      { text: "きってを ふうとうに はる。", translation: "I stick the stamp on the envelope." },
      { text: "それから、ポストに いく。", translation: "Then I go to the postbox." },
      { text: "いま、てがみは ポストに ある。", translation: "Now the letter is in the postbox." },
      { text: "よる、トムが でんわを かける。", translation: "In the evening, Tom calls." },
      { text: "トムは いま とうきょうに いる。", translation: "Tom is in Tokyo right now." },
      { text: "らいげつ じゃない。きょうだ。", translation: "Not next month. Today." },
      { text: "ぼくの てがみは まだ ポストに ある。", translation: "And my letter is still sitting in the postbox." },
      { text: "あした、トムが うちに くる。", translation: "Tomorrow Tom is coming over." },
      { text: "ぼくは トムに はなしを する。", translation: "I'll just tell him the whole thing myself." },
    ],
  },
  {
    id: "ja-m15-the-weekend-ahead",
    languageId: "ja",
    module: 15,
    level: 2,
    title: "The weekend ahead",
    theme: "A busy day, then a fun one.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "きょうは なにを しますか。",
        options: ["しごとです", "りょこうです", "かいものです"],
        answer: "しごとです",
      },
    ],
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
    // m15 L4. The change of state here is an OPINION, not an object: the
    // narrator opens disliking travel and closes planning the next trip, and
    // lines 4/21/22 are the three points on that curve.
    //
    // Kept clear of ja-m15-the-weekend-ahead's motif stack (いそがしい +
    // あたらしい くつ + えいが + かいもの) — same module, and a stretch read
    // that recycles the comfortable read's furniture is not a second story.
    id: "ja-m15-the-trip-i-didnt-want",
    languageId: "ja",
    module: 15,
    level: 4,
    title: "The trip I didn't want",
    theme: "Dragged to the sea on a Saturday, and talked round by evening.",
    tags: ["travel", "friends", "sea"],
    glosses: [
      { surface: "けど", meaning: "but, although", atomId: "ja:kedo" },
      { surface: "ねる", meaning: "to sleep, to go to bed", atomId: "ja:neru" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        // Keyed on line 22, which states it outright. The earlier framing
        // ("りょこうは どうですか" / answer たのしいです) was unanswerable as
        // written: たのしい is said of うみ, never of りょこう, while the
        // distractor たいへん IS said of りょこう at line 5 — so the careful
        // reader was steered to the wrong option.
        prompt: "ぼくは いま りょこうが すきですか。",
        options: ["はい、すきです", "いいえ、きらいです", "いいえ、たいへんです"],
        answer: "はい、すきです",
      },
      {
        id: "where",
        kind: "detail",
        prompt: "ふたりは どようびに どこに いきますか。",
        options: ["うみです", "やまです", "かいしゃです"],
        answer: "うみです",
      },
    ],
    sentences: [
      { text: "ぼくは うちが すきだ。", translation: "I like being at home." },
      { text: "ぼくは まいにち かいしゃで はたらく。", translation: "Every day I work at the office." },
      { text: "よるは うちで テレビを みる。", translation: "At night I watch TV at home." },
      { text: "ぼくは りょこうが すきじゃない。", translation: "I don't like travelling." },
      { text: "りょこうは たいへんだ。", translation: "Trips are a hassle." },
      { text: "けど、ともだちの ユミは りょこうが すきだ。", translation: "But my friend Yumi loves them." },
      { text: "「どようびに ふたりで うみに いきます。」", translation: "\"On Saturday the two of us are going to the sea.\"", speaker: "ユミ" },
      { text: "「りょこうは たいへんです。」", translation: "\"Trips are a hassle.\"", speaker: "ぼく" },
      { text: "「うみは とても たのしいです。」", translation: "\"The sea is a lot of fun.\"", speaker: "ユミ" },
      { text: "どようび、ぼくは ろくじに おきる。", translation: "On Saturday I get up at six." },
      { text: "ふたりで でんしゃで うみに いく。", translation: "The two of us take the train to the sea." },
      { text: "うみは とおい。", translation: "The sea is a long way off." },
      { text: "うみは とても きれいだ。", translation: "The sea is beautiful." },
      { text: "ユミは よく およぐ。", translation: "Yumi swims and swims." },
      { text: "ぼくも およぐ。", translation: "I swim too." },
      { text: "うみの みずは つめたい。", translation: "The water is cold." },
      { text: "ひるごはんに すしを たべる。", translation: "For lunch we eat sushi." },
      { text: "あとで、ふたりで おんがくを きいた。", translation: "Afterwards the two of us listened to music." },
      { text: "うみは ほんとうに たのしい。", translation: "The sea really is fun." },
      { text: "よる、でんしゃで うちに いく。", translation: "At night we take the train home." },
      { text: "ぼくは よく ねる。", translation: "I sleep well." },
      { text: "ぼくは りょこうが きらいじゃない。", translation: "I don't dislike travelling after all." },
      { text: "いまは りょこうが すきだ。", translation: "Now I like it." },
      { text: "つぎの りょこうは やまだ。", translation: "The next trip is the mountains." },
    ],
  },
  {
    id: "ja-m16-a-day-at-school",
    languageId: "ja",
    module: 16,
    level: 2,
    title: "A day at school",
    theme: "Class, notes, and homework.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "しゅくだいは どうですか。",
        options: ["やさしいです", "むずかしいです", "たのしいです"],
        answer: "やさしいです",
      },
    ],
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
    // m16 L4. m16 hands over かく / よむ / いみ / しゅくだい / ろうか / きょうしつ
    // / なかった / ので / けど / まで, so the plot is a piece of written work that
    // goes missing and gets written a second time. The change of state is what
    // the SECOND writing does to the narrator, not the recovery of the first.
    // Kept clear of ja-m16-a-day-at-school's motif stack (あさごはん + はしる +
    // ノートに かく + じぶんで べんきょうする) — same module, so the stretch read
    // must not recycle the comfortable read's furniture.
    //
    // The search deliberately stops at the classroom (line 11): the gist keys on
    // where the notebook actually WAS, so no line may flatly deny the corridor.
    //
    // Pool notes: なか / あるく / とまる are m17, みんな m19, たくさん m20,
    // いっしょ m23 — none available here. Adjective forms: the な suffix has no
    // source, so every な-adjective sits in predicate position ("たいせつな
    // しゅくだい" residuals な); い-adjective adverbials are per-surface — よく
    // gates from m11 and is used at line 1, while はやく / おおきく / わるく and
    // the rest do not gate at any module. Measured tables in
    // docs/story-authoring-guide.md §6.
    id: "ja-m16-the-second-notebook",
    languageId: "ja",
    module: 16,
    level: 4,
    title: "The second notebook",
    theme: "The homework goes missing, so it gets written twice.",
    tags: ["school", "homework", "friends"],
    glosses: [
      { surface: "なくす", meaning: "to lose (something)", atomId: "ja:nakusu" },
      { surface: "おなじ", meaning: "the same", atomId: "ja:onaji" },
      { surface: "さがす", meaning: "to look for, to search", atomId: "ja:sagasu" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "ぼくの ふるい ノートは どこに ありますか。",
        options: ["ろうかです", "かばんです", "きょうしつです"],
        answer: "ろうかです",
      },
      {
        id: "night",
        kind: "detail",
        prompt: "ぼくが しゅくだいを かくのは いつですか。",
        options: ["げつようびの よるです", "かようびの あさです", "にちようびの ひるです"],
        answer: "げつようびの よるです",
      },
    ],
    sentences: [
      { text: "せんせいは しゅくだいの はなしを よく する。", translation: "My teacher talks about homework a lot." },
      { text: "「しゅくだいは たいせつです。」", translation: "\"Homework is important.\"", speaker: "せんせい" },
      { text: "ぼくは しゅくだいが きらいだ。", translation: "I hate homework." },
      { text: "げつようびの よる、あたらしい ノートに しゅくだいを かく。", translation: "Monday night, I write the homework in a new notebook." },
      { text: "しゅくだいは とても むずかしい。", translation: "The homework is very hard." },
      { text: "いみが わからない ところも ある。", translation: "There are parts whose meaning I don't get." },
      { text: "けど、じゅうじまで かく。", translation: "But I write until ten." },
      { text: "かようびの あさ、きょうしつで かばんを あける。", translation: "Tuesday morning, I open my bag in the classroom." },
      { text: "ノートが なかった。", translation: "The notebook wasn't there." },
      { text: "じしょと ペンは ある。けど、ノートは ない。", translation: "The dictionary and the pen are there. But not the notebook." },
      { text: "ぼくは きょうしつを さがす。", translation: "I search the classroom." },
      { text: "ぼくは ノートを なくす。", translation: "I lose the notebook." },
      { text: "いまは はちじはんだ。クラスは くじだ。", translation: "It's half past eight. Class is at nine." },
      { text: "ともだちの ケンが ぼくの かばんを みる。", translation: "My friend Ken looks at my bag." },
      { text: "「ノートは どこですか。」", translation: "\"Where is the notebook?\"", speaker: "ケン" },
      { text: "「きょうしつに ノートが ありません。」", translation: "\"There's no notebook in the classroom.\"", speaker: "ぼく" },
      { text: "「これは あたらしい ノートです。」", translation: "\"This is a new notebook.\"", speaker: "ケン" },
      { text: "それから、おなじ しゅくだいを もういちど かく。", translation: "Then I write the same homework again." },
      { text: "いまは いみが わかった。", translation: "Now the meaning has made sense." },
      { text: "ゆうべの むずかしい ところが やさしい。", translation: "Last night's hard parts are easy." },
      { text: "くじに せんせいが きょうしつに はいる。", translation: "At nine the teacher comes into the classroom." },
      { text: "せんせいは ぼくに ふるい ノートを みせる。ろうかの ノートだ。", translation: "The teacher shows me my old notebook. It's the one from the corridor." },
      { text: "あたらしい ノートを せんせいに みせる。", translation: "I show the teacher the new notebook." },
      { text: "しゅくだいは たいせつだと おもう。いまは ほんとうに そう おもう。", translation: "Homework is important, I think. Now I really do think so." },
    ],
  },
  {
    // MOVED m17 → m32, 2026-08-18. The direction kit these two stories are
    // built on (みち / みぎ / ひだり / まっすぐ / まがる / わたる / とまる) has
    // courseAtoms rows tagged m17, but m17's IR never introduces one of them
    // and no m17 lesson step contains their surfaces — they were orphan rows,
    // so this content had been showing untaught vocabulary since it shipped.
    // m32 teaches the kit for real, which is why the module numbers move here
    // rather than the words moving back. The ids keep their m17 slug so
    // existing progress still resolves.
    id: "ja-m17-to-the-station",
    languageId: "ja",
    module: 32,
    level: 2,
    title: "To the station",
    theme: "Following the street to the train.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "びょういんの まえで まがるのは どこですか。",
        options: ["みぎです", "ひだりです", "よこです"],
        answer: "みぎです",
      },
    ],
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
  {
    // Written for m17 L4, whose plan was the whole direction-giving kit (まっすぐ / みぎ /
    // ひだり / むこう / うしろ / よこ / そば / はし / わたる / まがる / のる /
    // おりる / とまる / けいかん / おまわりさん), so the arc is a wrong route
    // walked in full. The building at line 5 is the plant; line 19 is the bill.
    // ja-m17-to-the-station already owns the "follow the street, arrive" shape,
    // so this one is the same kit used to arrive at the WRONG place first.
    //
    // Pool note: きく "to ask" is m24, so every question is put as a quoted line
    // after a narrated はなす attribution; and ます-forms of m17 verbs
    // (まがります / わたります) do not gate, so the policemen speak in noun
    // predicates plus the m8 て-form いって.
    // MOVED m17 → m32 for the same reason as ja-m17-to-the-station above.
    id: "ja-m17-the-building-behind-the-station",
    languageId: "ja",
    module: 32,
    level: 4,
    title: "The building behind the station",
    theme: "Two policemen, one bridge, and a hospital that was never far away.",
    tags: ["town", "family", "directions"],
    glosses: [
      // いそぐ dropped 2026-08-06: it is taught at m8 now (the ぐ → いで row of
      // the て table needed a worked verb), so glossing it at m17 declares a
      // word the reader already has.
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "ちちの びょういんは どこに ありますか。",
        options: ["えきの うしろです", "はしの むこうです", "こうえんの そばです"],
        answer: "えきの うしろです",
      },
      {
        id: "time",
        kind: "detail",
        prompt: "ぼくが ちちの へやに はいるのは なんじですか。",
        options: ["さんじです", "いちじです", "ろくじです"],
        answer: "さんじです",
      },
    ],
    sentences: [
      { text: "けさ、ははから でんわが ある。", translation: "This morning there's a call from my mother." },
      { text: "ちちが びょういんに いる。ちちは げんきじゃない。", translation: "My father is in hospital. He isn't well." },
      { text: "ぼくは すぐに でかける。えきまで いそぐ。", translation: "I go out at once. I hurry as far as the station." },
      { text: "けど、びょういんの みちが わからないので、こまる。", translation: "But I don't know the way to the hospital, so I'm stuck." },
      { text: "えきの うしろに おおきい たてものが ある。", translation: "Behind the station there's a big building." },
      { text: "その たてものの まえを あるく。", translation: "I walk past the front of that building." },
      { text: "えきの そばに けいかんが いる。ぼくは けいかんに はなす。", translation: "There's a policeman beside the station. I speak to him." },
      { text: "「びょういんは どこですか。」", translation: "\"Where is the hospital?\"", speaker: "ぼく" },
      { text: "けいかんは ぼくの かおを みる。「この みちを まっすぐ いって ください。びょういんは はしの むこうです。」", translation: "The policeman looks at my face. \"Go straight along this street. The hospital is on the other side of the bridge.\"", speaker: "けいかん" },
      { text: "ぼくは みちを まっすぐ あるく。", translation: "I walk straight along the street." },
      { text: "はしを わたる。みちは とても ながい。", translation: "I cross the bridge. The street is very long." },
      { text: "はしの むこうに ちいさい たてものが ある。", translation: "On the other side of the bridge there's a small building." },
      { text: "びょういんだ。けど、ちちは いない。", translation: "It's a hospital. But my father isn't there." },
      { text: "ここは ちいさい びょういんだ。", translation: "This is a small hospital." },
      { text: "みちの よこに おまわりさんが いる。ぼくは もういちど はなす。", translation: "There's a policeman at the side of the street. I speak up again." },
      { text: "おまわりさんは ぼくに はなす。「おおきい びょういんは えきの うしろです。」", translation: "The policeman says to me, \"The big hospital is behind the station.\"", speaker: "おまわりさん" },
      { text: "ぼくは バスに のる。バスは えきの まえで とまる。", translation: "I get on a bus. The bus stops in front of the station." },
      { text: "ぼくは えきの うしろに はしる。", translation: "I run behind the station." },
      { text: "あの おおきい たてものが びょういんだ。", translation: "That big building is the hospital." },
      { text: "さんじに ぼくは ちちの へやに はいる。ちちは げんきだ。", translation: "At three I go into my father's room. He's fine." },
      { text: "ちちは ぼくに はなす。「どうして おそい。」", translation: "My father says to me, \"Why so late?\"", speaker: "ちち" },
      { text: "ぼくは はしの ことを はなす。", translation: "I talk about the bridge." },
      { text: "あしたも びょういんに いく。みちは もう わかった。", translation: "Tomorrow too, I'll go to the hospital. I've got the way now." },
    ],
  },
  // ── Late (m18-m30): ramp up — 1, sometimes 2 stories per module ────────────
  {
    id: "ja-m18-a-warm-day",
    languageId: "ja",
    module: 18,
    level: 2,
    title: "A warm day",
    theme: "The weather and the garden.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "あしたの てんきは どうですか。",
        options: ["あめです", "はれです", "すずしいです"],
        answer: "あめです",
      },
    ],
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
    // m18 L4. The seasons module read as one year, so the load-bearing order is
    // the calendar: the tree is a complaint in summer, autumn and winter and a
    // reason to stay in spring. さくら is an m1 atom, which is what lets the
    // payoff at line 18 land in vocabulary the learner has had since the very
    // first module. ja-m18-a-warm-day owns the single-day forecast shape; this
    // one deliberately spans four seasons instead.
    //
    // Pool note: たくさん is m20 and おおい m22, so quantity is carried by とても
    // / よく; ふる and さく are unattributed atoms, so rain and blossom are
    // written as state (ゆきが ある / はなが ある) rather than as events.
    id: "ja-m18-the-tree-next-door",
    languageId: "ja",
    module: 18,
    level: 4,
    title: "The tree next door",
    theme: "A year of complaining about a big tree, and one March morning.",
    tags: ["weather", "seasons", "neighbours"],
    glosses: [
      { surface: "つよい", meaning: "strong, powerful", atomId: "ja:tsuyoi" },
      { surface: "うるさい", meaning: "noisy, annoying", atomId: "ja:urusai" },
      { surface: "くらい", meaning: "dark, gloomy", atomId: "ja:kurai" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "ぼくは どうして いま この きが すきですか。",
        options: [
          "きに さくらの はなが あるからです",
          "きの したが すずしいからです",
          "きが とても おおきいからです",
        ],
        answer: "きに さくらの はなが あるからです",
      },
      {
        id: "winter",
        kind: "detail",
        prompt: "ふゆの きは どうですか。",
        options: ["ぜんぜん きれいじゃないです", "とても きれいです", "とても あたたかいです"],
        answer: "ぜんぜん きれいじゃないです",
      },
    ],
    sentences: [
      { text: "ぼくは きょねんから この まちに すむ。", translation: "I've lived in this town since last year." },
      { text: "うちの となりに おおきな にわが ある。", translation: "Next door to my house there's a big garden." },
      { text: "にわの なかに とても おおきな きが ある。", translation: "In the garden there's a very big tree." },
      { text: "きは ぼくの へやの まどの まえだ。", translation: "The tree is right in front of my room's window." },
      { text: "なつは あつい。けど、きの したは すずしい。", translation: "Summer is hot. But it's cool under the tree." },
      { text: "あきに かぜが つよい。", translation: "In autumn the wind is strong." },
      { text: "かぜの よるは とても うるさい。", translation: "Windy nights are very noisy." },
      { text: "ふゆ、きの うえに ゆきが ある。", translation: "In winter there's snow on the tree." },
      { text: "ふゆの きは ぜんぜん きれいじゃない。", translation: "The winter tree isn't beautiful at all." },
      { text: "ぼくは この きが すきじゃない。", translation: "I don't like this tree." },
      { text: "ぼくは となりの ひとに はなす。", translation: "I speak to the person next door." },
      { text: "「その きは おおきいです。ぼくの へやが くらいです。」", translation: "\"That tree is big. My room is dark.\"", speaker: "ぼく" },
      { text: "となりの ひとは 「はるは きれいです。」と はなす。", translation: "The person next door says, \"It's beautiful in spring.\"", speaker: "となりの ひと" },
      { text: "「いまは ふゆです。はなが ありません。」", translation: "\"It's winter now. There are no flowers.\"", speaker: "ぼく" },
      { text: "その はなしが わからない。", translation: "I don't understand that." },
      { text: "さんがつ、てんきが まいにち あたたかい。", translation: "In March the weather is warm every day." },
      { text: "ある あさ、まどを あける。", translation: "One morning I open the window." },
      { text: "きに はなが ある。", translation: "There are flowers on the tree." },
      { text: "きは さくらだった。", translation: "The tree was a cherry tree." },
      { text: "となりの にわは とても きれいだ。", translation: "The garden next door is beautiful." },
      { text: "まちの ひとが にわの まえに くる。ひとは しゃしんを とる。", translation: "People from the town come to the front of the garden. They take photos." },
      { text: "ぼくの へやの まどの まえに さくらが ある。", translation: "There's a cherry tree in front of my window." },
      { text: "いまは この きが すきだ。", translation: "Now I like this tree." },
      { text: "つぎの ふゆも ぼくは まつ。", translation: "Next winter too, I'll wait for it." },
    ],
  },
  {
    id: "ja-m19-my-family",
    languageId: "ja",
    module: 19,
    level: 2,
    title: "My family",
    theme: "Four of us, and a birthday.",
    // たんじょうび is TAUGHT at m31 (n4-02), twelve modules after this passage.
    // Its registry row used to claim m19 and point at an old-course lesson that
    // survives only in `_archive/`, so no live module unlocked it and this
    // passage was leaning on the tag. Retagging the row to m31 with m31's
    // authoring made that visible; the gloss is the fix.
    glosses: [{ surface: "たんじょうび", meaning: "birthday", atomId: "ja:tanjoubi" }],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "かぞくは なんにんですか。",
        options: ["よにんです", "さんにんです", "ごにんです"],
        answer: "よにんです",
      },
    ],
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
    // m19 L4. The family module read as a guessing game: every relative gets a
    // turn on the photo, so the roster is used as a sequence of guesses rather
    // than recited as a list (ja-m19-my-family already owns the roster shape).
    // The plant is line 7 — the narrator's own wrong answer — and line 21
    // overturns it with the same word.
    //
    // Register: PLAIN narration, unlike its module-mate ja-m19-my-family. The
    // m13-m30 default is plain; m19 is the one polite exception in that run, and
    // carrying one of each at m19 mirrors what m12 already does. Quoted dialogue
    // stays polite, which is the L4 register-shift allowance.
    //
    // Pool note: negation at m19 is only the m6 neo set plus ~じゃない and polite
    // ~ません, so "says nothing" is written as a polite しりません inside a quote.
    id: "ja-m19-the-girl-in-the-photo",
    languageId: "ja",
    module: 19,
    level: 4,
    title: "The girl in the photo",
    theme: "Everyone in the house guesses. Only one person was there.",
    tags: ["family", "photos", "grandparents"],
    glosses: [
      { surface: "おなじ", meaning: "the same", atomId: "ja:onaji" },
      { surface: "でしょう", meaning: "probably, I expect", atomId: "ja:deshou" },
      { surface: "きっと", meaning: "surely, definitely", atomId: "ja:kitto" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "しゃしんの おんなのこは だれですか。",
        options: ["おばあさんです", "ぼくの あねです", "がっこうの せんせいです"],
        answer: "おばあさんです",
      },
      {
        id: "age",
        kind: "detail",
        prompt: "しゃしんの ときの おばあさんは なんさいですか。",
        options: ["じゅうななさいです", "さんじゅうさいです", "ななじゅうごさいです"],
        answer: "じゅうななさいです",
      },
    ],
    sentences: [
      { text: "にちようび、ぼくは おばあさんの うちに いる。", translation: "On Sunday I'm at my grandmother's house." },
      { text: "おばあさんは ななじゅうごさいだ。", translation: "My grandmother is seventy-five." },
      { text: "ぼくは おばあさんの ふるい かばんを あける。", translation: "I open my grandmother's old bag." },
      { text: "かばんの なかに ふるい しゃしんが ある。", translation: "Inside the bag there's an old photo." },
      { text: "しゃしんの なかに おんなのこが いる。", translation: "In the photo there's a girl." },
      { text: "おんなのこは とても かわいい。", translation: "The girl is very pretty." },
      { text: "ぼくの あねと おなじだ。", translation: "She's the same as my older sister." },
      { text: "ぼくは おばあさんに はなす。「この かたは どなたですか。」", translation: "I say to my grandmother, \"Who is this person?\"", speaker: "ぼく" },
      { text: "おばあさんの こえは しずかだ。「しりません。」", translation: "My grandmother's voice is quiet. \"I don't know.\"", speaker: "おばあさん" },
      { text: "ぼくは ちちに しゃしんを みせる。", translation: "I show the photo to my father." },
      { text: "ちちは しゃしんを ながい じかん みる。「ははの おねえさんでしょう。」", translation: "My father looks at the photo for a long time. \"It's probably my mother's older sister.\"", speaker: "ちち" },
      { text: "ははも しゃしんを みる。「きっと がっこうの せんせいでしょう。」", translation: "My mother looks at the photo too. \"It's surely a teacher from the school.\"", speaker: "はは" },
      { text: "あには めがねを とる。「この かたは だいがくの がくせいでしょう。」", translation: "My older brother takes off his glasses. \"This person is probably a university student.\"", speaker: "あに" },
      { text: "だれも わからない。", translation: "Nobody knows." },
      { text: "よる、おばあさんは ぼくを まつ。", translation: "In the evening, my grandmother waits for me." },
      { text: "おばあさんは ぼくに しゃしんの はなしを する。", translation: "She tells me about the photo." },
      { text: "「わたしは じゅうななさいでした。」", translation: "\"I was seventeen.\"", speaker: "おばあさん" },
      { text: "「けっこんの まえの しゃしんです。」", translation: "\"It's a photo from before the wedding.\"", speaker: "おばあさん" },
      { text: "「よこの おとこのこは おじいさんです。」", translation: "\"The boy at the side is your grandfather.\"", speaker: "おばあさん" },
      { text: "ぼくは しゃしんを もういちど みる。", translation: "I look at the photo again." },
      { text: "おんなのこの めと おばあさんの めは おなじだ。", translation: "The girl's eyes and my grandmother's eyes are the same." },
      { text: "ぼくの あねと おなじじゃない。おばあさんと おなじだ。", translation: "Not the same as my sister. The same as my grandmother." },
      { text: "いま、ぼくは おばあさんの めを よく みる。しゃしんの おんなのこの めだ。", translation: "Now I look at my grandmother's eyes properly. They're the eyes of the girl in the photo." },
    ],
  },
  {
    id: "ja-m20-feeling-sick",
    languageId: "ja",
    module: 20,
    level: 2,
    title: "Feeling sick",
    theme: "A trip to the doctor.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "どこが いたいですか。",
        options: ["あたまです", "あしです", "てです"],
        answer: "あたまです",
      },
    ],
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
    // m20 L4. Body parts plus より / ほう plus the hundreds, so the arc is a
    // week of self-diagnosis that ranks the wrong pain highest. Line 5 plants
    // the ear as an aside and demotes it in the same breath with ほう; line 17
    // is the correction. ja-m20-feeling-sick already owns the straight
    // symptom → hospital → medicine shape, so this one withholds the hospital
    // for eleven lines and gets the cause wrong when it arrives.
    //
    // Pool note: い-adjective negatives (いたくない) never gate, so recovery is
    // shown by what the narrator can eat again rather than by negating the pain.
    id: "ja-m20-the-wrong-tooth",
    languageId: "ja",
    module: 20,
    level: 4,
    title: "The wrong tooth",
    theme: "Five days of tooth medicine for something that was never the tooth.",
    tags: ["health", "family", "hospital"],
    glosses: [
      { surface: "もっと", meaning: "more", atomId: "ja:motto" },
      { surface: "ねつ", meaning: "a fever", atomId: "ja:netsu" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "わたしは どこが わるいですか。",
        options: ["みみです", "はです", "あたまです"],
        answer: "みみです",
      },
      {
        id: "price",
        kind: "detail",
        prompt: "あたらしい くすりは いくらですか。",
        options: ["さんびゃくえんです", "はっぴゃくえんです", "ろっぴゃくえんです"],
        answer: "さんびゃくえんです",
      },
    ],
    sentences: [
      { text: "せんしゅうの げつようび、わたしの はが いたい。", translation: "Last Monday, my tooth hurts." },
      { text: "したの はだ。", translation: "It's the lower tooth." },
      { text: "わたしは いしゃが きらいだ。だから、うちで くすりを のむ。", translation: "I hate doctors. So I take medicine at home." },
      { text: "まいあさ ゆっくりと はを みがく。まいばんも みがく。", translation: "Every morning I brush my teeth slowly. Every night too." },
      { text: "みみも すこし いたい。けど、はの ほうが いたい。", translation: "My ear hurts a little too. But the tooth hurts more." },
      { text: "すいようび、あたまも いたい。", translation: "On Wednesday my head hurts as well." },
      { text: "わたしは もっと くすりを のむ。", translation: "I take more medicine." },
      { text: "もくようび、わたしは ごはんを たべない。", translation: "On Thursday I don't eat." },
      { text: "ははは わたしに はなす。「びょういんに いって ください。」", translation: "My mother says to me, \"Go to the hospital.\"", speaker: "はは" },
      { text: "わたしは くすりを のむ。「だいじょうぶ。」", translation: "I take my medicine. \"I'm fine.\"", speaker: "わたし" },
      { text: "きんようびの よるは とても いたい。ねつも ある。", translation: "Friday night it hurts a lot. I have a fever too." },
      { text: "どようびの あさ、わたしは びょういんに いく。", translation: "Saturday morning I go to the hospital." },
      { text: "いしゃは わたしの くちを みる。", translation: "The doctor looks in my mouth." },
      { text: "「はは だいじょうぶです。」", translation: "\"The tooth is fine.\"", speaker: "いしゃ" },
      { text: "わたしは わからない。", translation: "I don't understand." },
      { text: "いしゃは わたしの みみを みる。", translation: "The doctor looks in my ear." },
      { text: "「みみが わるいです。はじゃないです。」", translation: "\"The ear is bad. It isn't the tooth.\"", speaker: "いしゃ" },
      { text: "わたしは あたらしい くすりを かった。くすりは さんびゃくえんだ。", translation: "I bought new medicine. The medicine is three hundred yen." },
      { text: "にちようび、わたしは ごはんを たべた。", translation: "On Sunday I ate a meal." },
      { text: "はも あたまも だいじょうぶだ。", translation: "The tooth and the head are both fine." },
      { text: "わたしは いしゃが きらいだ。けど、いしゃの ほうが くすりより いい。", translation: "I hate doctors. But a doctor is better than medicine." },
      { text: "らいしゅうも わたしは びょういんに いく。", translation: "Next week too, I'll go to the hospital." },
    ],
  },
  {
    id: "ja-m21-dinner-at-home",
    languageId: "ja",
    module: 21,
    level: 2,
    title: "Dinner at home",
    theme: "Setting the table for a meal.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "しょくじは どこですか。",
        options: ["うちです", "こうえんです", "がっこうです"],
        answer: "うちです",
      },
    ],
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
    level: 2,
    title: "A packed lunch",
    theme: "A lunchbox for a day out.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "どこで たべますか。",
        options: ["こうえんです", "がっこうです", "うちです"],
        answer: "こうえんです",
      },
    ],
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
    // m21 L5 — the first Challenge-band Japanese story. The tableware module
    // read as arithmetic: ちょうど is set up in line 6 and demolished twice, and
    // every counter the module teaches (まい / はい / にん) is doing plot work
    // rather than drilling. Multi-scene by clock (6:30 / 7:00 / 7:30 / 8:00),
    // which is the L5 shape; the register shift is the polite quoted doorway
    // exchange inside plain narration.
    //
    // Kept clear of both m21 module-mates: ja-m21-dinner-at-home is the table
    // itself and ja-m21-a-packed-lunch is the lunchbox, so this one is about
    // the table running out.
    //
    // Pool note: ふたつ / よっつ are unattributed atoms and ほん is m22, so
    // counting runs on まい, にん and the はい series only.
    id: "ja-m21-exactly-five",
    languageId: "ja",
    module: 21,
    level: 5,
    title: "Exactly five",
    theme: "Five plates, five sets of chopsticks, and seven people.",
    tags: ["food", "friends", "home"],
    glosses: [
      { surface: "ならべる", meaning: "to set out, to lay in a row", atomId: "ja:naraberu" },
      { surface: "すくない", meaning: "few, not enough", atomId: "ja:sukunai" },
      // うたう dropped 2026-09-02 (R16 teach-them wave): it is now TAUGHT at
      // m13, so at m21 it is known vocabulary and an above-level gloss on it
      // is wrong by this file's own level discipline.
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "この しょくじに ひとは なんにん いますか。",
        options: ["ななにんです", "ごにんです", "よにんです"],
        answer: "ななにんです",
      },
      {
        id: "bowl",
        kind: "detail",
        prompt: "わたしは なにで ごはんを たべますか。",
        options: ["ちゃわんです", "おさらです", "カップです"],
        answer: "ちゃわんです",
      },
    ],
    sentences: [
      { text: "どようびの よる、うちで しょくじを する。", translation: "Saturday evening, I have a meal at home." },
      { text: "ともだちが よにん くる。", translation: "Four friends are coming." },
      { text: "わたしは ごにんの りょうりを する。", translation: "I cook for five." },
      { text: "とりにくと たまごの りょうりだ。", translation: "It's a chicken and egg dish." },
      { text: "わたしは おさらを ごまい ならべる。", translation: "I set out five plates." },
      { text: "コップと はしも ならべる。ちょうど ごにんだ。", translation: "I set out the glasses and chopsticks too. Exactly five people." },
      { text: "ろくじはんに ともだちが くる。", translation: "At half past six my friends arrive." },
      { text: "ケンと ユミと ミカと トムだ。", translation: "Ken, Yumi, Mika and Tom." },
      { text: "ごにんで しょくじを する。", translation: "The five of us eat." },
      { text: "とりにくは おいしい。みんなは よく たべる。", translation: "The chicken is good. Everyone eats a lot." },
      { text: "しちじ、ドアの そとに ひとが いる。", translation: "At seven, there's someone outside the door." },
      { text: "ユミの おねえさんだ。「すみません。」", translation: "It's Yumi's older sister. \"Excuse me.\"", speaker: "ユミの おねえさん" },
      { text: "わたしは ドアを あける。「どうぞ。」", translation: "I open the door. \"Come in.\"", speaker: "わたし" },
      { text: "けど、おさらは ごまい ある。ろくまい ない。", translation: "But there are five plates. There isn't a sixth." },
      { text: "わたしは じぶんの おさらを おねえさんに かす。", translation: "I lend the older sister my own plate." },
      { text: "わたしは ちゃわんで ごはんを たべる。", translation: "I eat my rice from a rice bowl." },
      { text: "しちじはん、また ドアの そとに ひとが いる。", translation: "At half past seven there's someone outside the door again." },
      { text: "ケンの おとうとだ。", translation: "It's Ken's younger brother." },
      { text: "「あにが ここに いますか。」", translation: "\"Is my older brother here?\"", speaker: "ケンの おとうと" },
      { text: "「はい。けど、コップが ありません。」", translation: "\"Yes. But there are no glasses.\"", speaker: "わたし" },
      { text: "「だいじょうぶです。」", translation: "\"It's all right.\"", speaker: "ケンの おとうと" },
      { text: "わたしは じぶんの コップを ケンの おとうとに かす。", translation: "I lend Ken's brother my own glass." },
      { text: "わたしは カップで おちゃを のむ。", translation: "I drink my tea from a cup." },
      { text: "はしも すくない。", translation: "There aren't enough chopsticks either." },
      { text: "ケンの おとうとは フォークで とりにくを たべる。", translation: "Ken's brother eats the chicken with a fork." },
      { text: "わたしは スプーンで たまごを たべる。", translation: "I eat the egg with a spoon." },
      { text: "ななにんで たべたり のんだり する。", translation: "The seven of us eat and drink and so on." },
      { text: "たべものは すくない。けど、みんなは げんきだ。", translation: "There isn't much food. But everyone is in high spirits." },
      { text: "ユミの おねえさんは おさけを いっぱい のむ。", translation: "Yumi's older sister drinks a glass of sake." },
      { text: "はちじ、みんなで うたを うたう。", translation: "At eight, everyone sings." },
      { text: "おさらは ちょうど ごまいだった。ひとは ななにんだった。", translation: "There were exactly five plates. There were seven people." },
      { text: "けど、この よるは ほんとうに たのしい。", translation: "But this evening is really fun." },
      { text: "つぎの しょくじは おさらを じゅうまい ならべる。", translation: "Next meal I'll set out ten plates." },
      { text: "ちょうどじゃない しょくじの ほうが いい。", translation: "A meal that isn't exactly right is the better kind." },
    ],
  },
  {
    id: "ja-m22-what-i-eat",
    languageId: "ja",
    module: 22,
    level: 2,
    title: "What I like to eat",
    theme: "Ranking food, honestly.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "なにが いちばん すきですか。",
        options: ["にくです", "さかなです", "やさいです"],
        answer: "にくです",
      },
    ],
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
    // m22 L5. The comparison module (いちばん / より / ほう / おなじ / ちがう)
    // aimed at a claim that gets falsified by the narrator's own behaviour: line
    // 1 and line 4 are the plant, line 21 the reveal, and lines 24-25 the
    // arithmetic that closes the escape route. ja-m22-what-i-eat already owns
    // the honest-ranking shape, so this one is a ranking that turns out wrong.
    id: "ja-m22-the-fish-i-said-i-hated",
    languageId: "ja",
    module: 22,
    level: 5,
    title: "The fish I said I hated",
    theme: "Three bowls of the best curry in the world, and then the question.",
    tags: ["food", "friends", "cooking"],
    glosses: [
      { surface: "いっしょ", meaning: "together", atomId: "ja:issho" },
      { surface: "つくる", meaning: "to make, to cook", atomId: "ja:tsukuru" },
      { surface: "やっぱり", meaning: "after all, as expected", atomId: "ja:yappari" },
      // Same 2026-08-15 retag as たんじょうび: こども's registry row claimed m19
      // and pointed at an archived old-course lesson, so no live module
      // unlocked it. m31 (n4-02) teaches it. Nine modules from here, so it is
      // glossed — and it was worth catching, because without the row the
      // tokenizer splits 「こどもの」 into こ · ど · も.
      { surface: "こども", meaning: "a child", atomId: "ja:kodomo" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "カレーの なかに あるのは なんですか。",
        options: ["さかなです", "にくです", "やさいです"],
        answer: "さかなです",
      },
      {
        id: "howmuch",
        kind: "detail",
        prompt: "ぼくは カレーを なんばい たべますか。",
        options: ["さんばいです", "いっぱいです", "ろっぱいです"],
        answer: "さんばいです",
      },
    ],
    sentences: [
      { text: "ぼくは にくが いちばん すきだ。", translation: "Meat is what I like most." },
      { text: "とりにくが いちばん おいしいと おもう。", translation: "I think chicken is the tastiest thing there is." },
      { text: "やさいも たべる。くだものも たべる。", translation: "I eat vegetables too. I eat fruit too." },
      { text: "けど、さかなは ぜんぜん たべない。", translation: "But I don't eat fish at all." },
      { text: "こどもの ときから さかなが きらいだ。", translation: "I've hated fish since I was a child." },
      { text: "さかなの あたまが きらいだ。めも きらいだ。", translation: "I hate the head. I hate the eyes too." },
      { text: "ともだちの ミカは りょうりが じょうずだ。", translation: "My friend Mika is a good cook." },
      { text: "ミカは ぼくに でんわを かける。", translation: "Mika calls me." },
      { text: "「どようびに いっしょに しょくじを しませんか。」", translation: "\"Won't you have a meal with me on Saturday?\"", speaker: "ミカ" },
      { text: "ぼくは でんわで はなす。「はい。」", translation: "I speak into the phone. \"Yes.\"", speaker: "ぼく" },
      { text: "どようびの ゆうがた、ミカの うちに はいる。", translation: "Saturday evening, I step into Mika's place." },
      { text: "へやは あたたかい。", translation: "The room is warm." },
      { text: "ミカは カレーを つくる。", translation: "Mika makes a curry." },
      { text: "カレーの なかに にくが ある。にくは おおきい。", translation: "There's meat in the curry. The meat is big." },
      { text: "ぼくは カレーを たべる。とても おいしい。", translation: "I eat the curry. It's very good." },
      { text: "ぼくは もっと たべる。", translation: "I eat more." },
      { text: "ミカは ぼくの おさらを みる。「いかがですか。」", translation: "Mika looks at my plate. \"How is it?\"", speaker: "ミカ" },
      { text: "ぼくは おさらを みせる。「これは いちばん おいしい カレーです。」", translation: "I show my plate. \"This is the best curry there is.\"", speaker: "ぼく" },
      { text: "「この にくは なんですか。」", translation: "\"What is this meat?\"", speaker: "ぼく" },
      { text: "ミカは ぼくを みる。", translation: "Mika looks at me." },
      { text: "「さかなです。」", translation: "\"It's fish.\"", speaker: "ミカ" },
      { text: "ぼくは カレーを みる。にくじゃない。さかなだ。", translation: "I look at the curry. It isn't meat. It's fish." },
      { text: "ぼくの こえは おおきい。「ぼくは さかなが きらいです。」", translation: "My voice is loud. \"I hate fish.\"", speaker: "ぼく" },
      { text: "ミカは しずかだ。「さんばいの カレーです。」", translation: "Mika is calm. \"That's three bowls of curry.\"", speaker: "ミカ" },
      { text: "「さかなの あたまは ありません。めも ありません。」", translation: "\"There's no head. No eyes either.\"", speaker: "ミカ" },
      { text: "ぼくは もういちど たべる。やっぱり おいしい。", translation: "I eat it again. It's good after all." },
      { text: "いま、ぼくは さかなが きらいじゃない。", translation: "Now I don't hate fish." },
      { text: "けど、さかなの カレーが すきだ。さかなじゃない。", translation: "But what I like is fish curry. Not fish." },
      { text: "つぎの どようびも ミカの うちで しょくじを する。", translation: "The next Saturday I eat at Mika's place again." },
      { text: "ミカは また カレーを つくる。ぼくは いちばん たくさん たべる。", translation: "Mika makes curry again. I eat the most of anyone." },
    ],
  },
  {
    id: "ja-m23-a-party",
    languageId: "ja",
    module: 23,
    level: 2,
    title: "A party tomorrow",
    theme: "Plans with friends.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "きのうは なにを しましたか。",
        options: ["しごとです", "パーティーです", "うたです"],
        answer: "しごとです",
      },
    ],
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
    level: 2,
    title: "A day at the sea",
    theme: "Swimming with a friend.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "ばんごはんを たべたのは どこですか。",
        options: ["レストランです", "うちです", "がっこうです"],
        answer: "レストランです",
      },
    ],
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
    // m23 L5. うたう / つもり / できない are the module's gift, so the arc is an
    // intention formed in line 4 and handed to somebody else in line 25. The
    // sister is taught the song at line 8 for a stated reason (the narrator
    // keeps forgetting it) — that is the plant, and it is what makes her able to
    // take over. Both m23 module-mates are group-event stories (a party, a day
    // at the sea); this one is a single family table, so the module's vocabulary
    // is reused without its two existing settings.
    id: "ja-m23-the-song-for-my-mother",
    languageId: "ja",
    module: 23,
    level: 5,
    title: "The song for my mother",
    theme: "Three weeks of practice, and a six-year-old who sings it instead.",
    tags: ["family", "music", "birthday"],
    glosses: [
      { surface: "れんしゅうする", meaning: "to practise", atomId: "ja:renshuusuru" },
      { surface: "わすれる", meaning: "to forget", atomId: "ja:wasureru" },
      { surface: "だんだん", meaning: "gradually, little by little", atomId: "ja:dandan" },
      { surface: "なる", meaning: "to become", atomId: "ja:naru" },
      // Added 2026-08-15 with m31 (n4-02), which is where たんじょうび is now
      // TAUGHT. Its registry row used to say `fromModule: "m19"` and point at
      // an old-course lesson that lives only in `_archive/`, so no live module
      // ever unlocked it — this passage and ja-m19-my-family were leaning on a
      // tag rather than on teaching. Retagging the row to m31 made that
      // visible, and a gloss is the honest fix at m23.
      { surface: "たんじょうび", meaning: "birthday", atomId: "ja:tanjoubi" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "たんじょうびに うたうのは だれですか。",
        options: ["いもうとです", "ぼくです", "ははです"],
        answer: "いもうとです",
      },
      {
        id: "time",
        kind: "detail",
        prompt: "ぼくが まいあさ おきるのは なんじですか。",
        options: ["ろくじです", "しちじです", "はちじです"],
        answer: "ろくじです",
      },
    ],
    sentences: [
      { text: "ろくがつ、ははの たんじょうびが ある。", translation: "My mother's birthday is in June." },
      { text: "ははは うたが すきだ。ふるい うたが いちばん すきだ。", translation: "My mother likes songs. Old songs most of all." },
      { text: "ぼくは うたが とても へただ。", translation: "I'm a very bad singer." },
      { text: "けど、たんじょうびに うたう つもりだ。", translation: "But I intend to sing on her birthday." },
      { text: "ぼくは まいあさ ろくじに おきる。", translation: "Every morning I get up at six." },
      { text: "へやで ひとりで れんしゅうする。", translation: "I practise alone in my room." },
      { text: "うたは とても ながい。ぼくは よく わすれる。", translation: "The song is very long. I often forget it." },
      { text: "だから、いもうとに うたを おしえる。", translation: "So I teach the song to my little sister." },
      { text: "いもうとは ろくさいだ。", translation: "My sister is six." },
      { text: "いもうとは うたを すぐに おぼえる。", translation: "She learns the song straight away." },
      { text: "まいあさ ふたりで れんしゅうする。", translation: "Every morning the two of us practise." },
      { text: "いもうとは まいあさ おなじ ことを はなす。「わたしも うたう。」", translation: "Every morning my sister says the same thing. \"I'll sing too.\"", speaker: "いもうと" },
      { text: "ぼくも まいあさ おなじ ことを はなす。「だめ。」", translation: "Every morning I say the same thing too. \"No.\"", speaker: "ぼく" },
      { text: "ぼくは だんだん じょうずに なる。", translation: "Little by little I get better." },
      { text: "どようび、ははの たんじょうびだ。", translation: "Saturday is my mother's birthday." },
      { text: "あさから ぼくの のどが いたい。ねつも ある。", translation: "From the morning my throat hurts. I have a fever too." },
      { text: "よる、かぞくで ばんごはんを たべる。", translation: "In the evening the family eats dinner." },
      { text: "ちちと ははと あにと いもうとと ぼくだ。", translation: "My father, my mother, my older brother, my sister and me." },
      { text: "ははは とりにくが すきだ。だから、ぼくが とりにくの りょうりを する。", translation: "My mother likes chicken. So I cook a chicken dish." },
      { text: "しょくじの あとで、ぼくは うたう。", translation: "After the meal, I sing." },
      { text: "けど、こえが ない。", translation: "But there's no voice." },
      { text: "のどが とても いたい。ぼくの うたは だめだ。", translation: "My throat really hurts. My singing is no good." },
      { text: "かぞくは しずかだ。", translation: "The family is quiet." },
      { text: "いもうとが ぼくの まえに くる。", translation: "My sister comes in front of me." },
      { text: "いもうとは ひとりで うたう。", translation: "She sings it alone." },
      { text: "いもうとの うたも とても へただ。", translation: "My sister is a very bad singer too." },
      { text: "けど、ははは いもうとを よく みる。", translation: "But my mother watches her closely." },
      { text: "ははは いもうとに はなす。「いちばん いい たんじょうびです。」", translation: "My mother says to my sister, \"This is the best birthday.\"", speaker: "はは" },
      { text: "わかった。ははは うたが すきだ。けど、かぞくの ほうが すきだ。", translation: "I got it. My mother likes songs. But she likes her family more." },
      { text: "つぎの たんじょうびは ふたりで うたう つもりだ。", translation: "Next birthday the two of us intend to sing." },
    ],
  },
  {
    id: "ja-m24-things-i-can-do",
    languageId: "ja",
    module: 24,
    level: 2,
    title: "Things I can do",
    theme: "A small list of skills.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "なにが あまり じょうずじゃないですか。",
        options: ["うたです", "りょうりです", "えいごです"],
        answer: "うたです",
      },
    ],
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
    // m24 L5. The module is perception and potential (きこえる / みえる /
    // できない / ましょう), so the story is built on what one man can no longer
    // do and what the narrator can hear through a wall. Line 5 plants the exact
    // habit — the radio stops at ten, every night — and Thursday's broken habit
    // is the only reason the narrator ever knocks. The other axis is the
    // narrator's own ear: line 9 hates the music, line 28 likes it, and line 29
    // turns line 5's plant by making the ten-o'clock silence something HE now
    // produces. ja-m24-things-i-can-do is a
    // first-person inventory of skills; this one is a can/can't about somebody
    // else, which is the same grammar with a subject to track.
    id: "ja-m24-the-radio-next-door",
    languageId: "ja",
    module: 24,
    level: 5,
    title: "The radio next door",
    theme: "Three weeks of nine o'clock music, and the night it didn't stop.",
    tags: ["neighbours", "music", "town"],
    glosses: [
      { surface: "つかれる", meaning: "to get tired", atomId: "ja:tsukareru" },
      { surface: "けす", meaning: "to switch off", atomId: "ja:kesu" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "おじいさんは どうして まいばん ラジオを ききますか。",
        options: ["めが わるいからです", "おんがくが すきだからです", "ともだちが いないからです"],
        answer: "めが わるいからです",
      },
      {
        id: "stop",
        kind: "detail",
        prompt: "おじいさんが ラジオを けすのは まいばん なんじですか。",
        options: ["じゅうじです", "くじです", "じゅうにじです"],
        answer: "じゅうじです",
      },
    ],
    sentences: [
      { text: "わたしの へやの となりに おじいさんが すむ。", translation: "An old man lives next door to my room." },
      { text: "まいばん くじに ラジオが きこえる。", translation: "Every night at nine I can hear a radio." },
      { text: "となりの へやから きこえる。", translation: "It comes from the room next door." },
      { text: "おんがくの ラジオだ。", translation: "It's music on the radio." },
      { text: "じゅうじに おじいさんは ラジオを けす。まいばん おなじだ。", translation: "At ten the old man switches the radio off. It's the same every night." },
      { text: "わたしは よる べんきょうする。", translation: "I study in the evening." },
      { text: "ラジオが きこえるので、べんきょうする ことが できない。", translation: "Because I can hear the radio, I can't study." },
      { text: "わたしは しごとで つかれる。", translation: "I get tired from work." },
      { text: "わたしは その おんがくが きらいだ。", translation: "I hate that music." },
      { text: "もくようびの よる、じゅうじに ラジオが きこえる。", translation: "On Thursday night I can hear the radio at ten." },
      { text: "じゅういちじにも きこえる。じゅうにじにも きこえる。", translation: "I can hear it at eleven too. At twelve too." },
      { text: "よるが ながい。", translation: "The night is long." },
      { text: "わたしは となりの ドアの まえに いく。", translation: "I go to the door next door." },
      { text: "おじいさんが ドアを あける。", translation: "The old man opens it." },
      { text: "へやに でんきが ない。ラジオの おんがくが ある。", translation: "There's no light in the room. There's the music from the radio." },
      { text: "おじいさんは 「すみません。」と はなす。", translation: "The old man says, \"I'm sorry.\"", speaker: "おじいさん" },
      { text: "「ラジオが とても おおきいです。よるは べんきょうする じかんです。」", translation: "\"The radio is very loud. The evening is time to study.\"", speaker: "わたし" },
      { text: "「めが わるいです。ほんは だめです。」", translation: "\"My eyes are bad. Books are no good.\"", speaker: "おじいさん" },
      { text: "「めが わるいですか。」", translation: "\"Your eyes are bad?\"", speaker: "わたし" },
      { text: "「まいばん ラジオの ニュースを ききます。」", translation: "\"Every night I listen to the news on the radio.\"", speaker: "おじいさん" },
      { text: "わたしは わかった。", translation: "I understood." },
      { text: "おじいさんは まいばん じゅうじに ねる。ときどき ラジオの まえで ねる。", translation: "Every night the old man goes to sleep at ten. Sometimes he falls asleep in front of the radio." },
      { text: "もくようびの よるも そうだった。", translation: "Thursday night was like that too." },
      { text: "わたしは ラジオを けす。おじいさんは ねる。", translation: "I switch the radio off. The old man goes to bed." },
      { text: "にちようび、わたしは ざっしを もつ。おじいさんの へやに いく。", translation: "On Sunday I take a magazine. I go to the old man's room." },
      { text: "わたしは ざっしを よむ。おじいさんは きく。", translation: "I read the magazine. The old man listens." },
      { text: "おじいさんは わたしの てを もつ。「らいしゅうも ききましょう。」", translation: "The old man takes my hand. \"Let's listen next week too.\"", speaker: "おじいさん" },
      { text: "まいしゅうの にちようび、ふたりで ざっしを よむ。", translation: "Every Sunday the two of us read a magazine." },
      { text: "いまも まいばん くじに ラジオが きこえる。", translation: "I can still hear the radio every night at nine." },
      { text: "けど、いまは わたしも くじを まつ。", translation: "But now I wait for nine o'clock too." },
      { text: "じゅうじに わたしは となりの へやで ラジオを けす。ふたりとも ねる。", translation: "At ten I switch the radio off in the room next door. We both go to sleep." },
    ],
  },
  {
    id: "ja-m25-studying-abroad",
    languageId: "ja",
    module: 25,
    level: 2,
    title: "Studying abroad",
    theme: "Plans for next year.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "らいねん どこに いきますか。",
        options: ["がいこくです", "がっこうです", "うちです"],
        answer: "がいこくです",
      },
    ],
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
    level: 2,
    title: "Meeting an old friend",
    theme: "A reunion at the station.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "どこで ともだちに あいますか。",
        options: ["えきです", "がっこうです", "うちです"],
        answer: "えきです",
      },
    ],
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
    // m25 L5. The conjecture set (だろう / でしょう / きっと) is the module's
    // gift, so every rejected present is rejected by a GUESS about somebody
    // else's luggage, feet or country — six days of reasoning that buys nothing.
    // Line 5 plants the narrator's own slow watch as a thing he wants replaced;
    // line 24 spends it instead. Neither m25 module-mate is about the leaving
    // itself (one is the plan to go abroad, one is a reunion), so the departure
    // is free.
    id: "ja-m25-the-watch-i-gave-away",
    languageId: "ja",
    module: 25,
    level: 5,
    title: "The watch I gave away",
    theme: "A week of shops, nothing bought, and one thing handed over at the station.",
    tags: ["friends", "shopping", "travel"],
    glosses: [
      { surface: "さがす", meaning: "to look for, to search", atomId: "ja:sagasu" },
      { surface: "えらぶ", meaning: "to choose", atomId: "ja:erabu" },
      { surface: "あげる", meaning: "to give", atomId: "ja:ageru" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "ぼくが トムに あげるのは なんですか。",
        options: ["とけいです", "ほんです", "くつです"],
        answer: "とけいです",
      },
      {
        id: "time",
        kind: "detail",
        prompt: "トムが アメリカに いくのは なんじですか。",
        options: ["じゅうじです", "くじです", "じゅうにじです"],
        answer: "じゅうじです",
      },
    ],
    sentences: [
      { text: "ぼくの クラスに りゅうがくせいが いる。", translation: "There's an exchange student in my class." },
      { text: "なまえは トムだ。トムは アメリカの がくせいだ。", translation: "His name is Tom. Tom is an American student." },
      { text: "トムは らいげつ アメリカに かえる。", translation: "Tom goes back to America next month." },
      { text: "ぼくは トムに なにを かうか わからない。", translation: "I don't know what to buy Tom." },
      { text: "ぼくの とけいは ふるい。まいにち おそい。", translation: "My watch is old. It runs slow every day." },
      { text: "ぼくは あたらしい とけいが ほしい。", translation: "I want a new watch." },
      { text: "どようび、ぼくは まちに いく。", translation: "On Saturday I go into town." },
      { text: "みせで ほんを みる。", translation: "I look at books in a shop." },
      { text: "ほんは いい。けど、トムの かばんは もう いっぱいだろう。", translation: "Books are good. But Tom's bag is probably full already." },
      { text: "にちようび、ぼくは つぎの みせに いく。", translation: "On Sunday I go to the next shop." },
      { text: "くつを みる。けど、トムの あしは とても おおきい。", translation: "I look at shoes. But Tom's feet are very big." },
      { text: "げつようび、ぼくは たべものの みせに いく。", translation: "On Monday I go to a food shop." },
      { text: "ぼくは おちゃを みる。けど、アメリカにも おちゃが あるだろう。", translation: "I look at green tea. But there's probably green tea in America too." },
      { text: "かようびも すいようびも もくようびも、ぼくは みせを さがす。", translation: "Tuesday, Wednesday and Thursday, I look for a shop." },
      { text: "ぼくは なにも えらぶ ことが できない。", translation: "I can't choose anything." },
      { text: "きんようび、トムが ぼくの ところに くる。", translation: "On Friday Tom comes over to me." },
      { text: "「らいしゅうの どようびに アメリカに いきます。」", translation: "\"I'm going to America next Saturday.\"", speaker: "トム" },
      { text: "「あさの じゅうじです。」", translation: "\"At ten in the morning.\"", speaker: "トム" },
      { text: "ぼくは まだ なにも かわない。", translation: "I still don't buy anything." },
      { text: "どようびの あさ、ぼくは えきで トムに あう。", translation: "Saturday morning, I meet Tom at the station." },
      { text: "トムの かばんは とても おおきい。", translation: "Tom's bag is very big." },
      { text: "ぼくは ふるい とけいを みる。", translation: "I look at my old watch." },
      { text: "これは おじいさんの とけいだった。", translation: "This was my grandfather's watch." },
      { text: "ぼくは トムに とけいを あげる。", translation: "I give Tom the watch." },
      { text: "「この とけいは おそいです。けど、ぼくの とけいです。」", translation: "\"This watch runs slow. But it's my watch.\"", speaker: "ぼく" },
      { text: "トムは とけいを もつ。「らいねん とうきょうに きます。」", translation: "Tom holds the watch. \"I'll come to Tokyo next year.\"", speaker: "トム" },
      { text: "「とけいと いっしょに きます。」", translation: "\"I'll come with the watch.\"", speaker: "トム" },
      { text: "いま、ぼくには とけいが ない。", translation: "Now I don't have a watch." },
      { text: "けど、あたらしい とけいは かわない。らいねんまで まつ。", translation: "But I won't buy a new watch. I'll wait until next year." },
    ],
  },
  {
    id: "ja-m26-a-tiring-day",
    languageId: "ja",
    module: 26,
    level: 2,
    title: "A tiring day",
    theme: "Worn out, but still eating.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "へやは どうですか。",
        options: ["ひろいです", "せまいです", "きれいです"],
        answer: "せまいです",
      },
    ],
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
    // m26 L5. しかし / わすれる / つかれる are the module's gift, and the story
    // is what they add up to over six months. The plant is line 5 — Mika says
    // where she is going and when, in the very first call — and the narrator
    // (and the reader) is invited to skip past it exactly as he does. Line 24
    // repeats it back. ja-m26-a-tiring-day is a single evening; this is a
    // calendar, which is what the L5 band's multi-scene allowance is for.
    //
    // Pool note: くがつ does not gate (く 九 is unattributed), so September is
    // written as あき.
    id: "ja-m26-the-call-i-kept-putting-off",
    languageId: "ja",
    module: 26,
    level: 5,
    title: "The call I kept putting off",
    theme: "Four phone calls from April, and a door answered by somebody else.",
    tags: ["friends", "work", "letters"],
    glosses: [
      { surface: "べつに", meaning: "not particularly", atomId: "ja:betsuni" },
      { surface: "ぜんぶ", meaning: "all of it, everything", atomId: "ja:zenbu" },
      { surface: "きになる", meaning: "to weigh on one's mind", atomId: "ja:kininaru" },
      // こども is TAUGHT at m31 (n4-02); its old m19 tag pointed at an archived
      // lesson no live module runs. See ja-m22-the-fish-i-said-i-hated.
      { surface: "こども", meaning: "a child", atomId: "ja:kodomo" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "ミカは いま どこに いますか。",
        options: ["とうきょうです", "うちです", "がいこくです"],
        answer: "とうきょうです",
      },
      {
        id: "month",
        kind: "detail",
        prompt: "ミカが とうきょうに いくのは なんがつですか。",
        options: ["しちがつです", "しがつです", "じゅうがつです"],
        answer: "しちがつです",
      },
    ],
    sentences: [
      { text: "ミカは ぼくの ふるい ともだちだ。", translation: "Mika is an old friend of mine." },
      { text: "こどもの ときからの ともだちだ。", translation: "A friend since we were children." },
      { text: "しがつ、ミカから でんわが ある。", translation: "In April there's a call from Mika." },
      { text: "「にちようびに いっしょに しょくじを しませんか。」", translation: "\"Won't you have a meal with me on Sunday?\"", speaker: "ミカ" },
      { text: "「わたしは しちがつに とうきょうに いきます。」", translation: "\"I'm going to Tokyo in July.\"", speaker: "ミカ" },
      { text: "ぼくは しごとが とても おおい。まいばん つかれる。", translation: "I have a lot of work. Every night I get tired." },
      { text: "ぼくは 「らいしゅうは どうですか。」と いう。", translation: "I say, \"How about next week?\"", speaker: "ぼく" },
      { text: "ごがつ、また でんわが ある。", translation: "In May there's another call." },
      { text: "どようびの さんじに えきで あう つもりだった。", translation: "We meant to meet at the station at three on Saturday." },
      { text: "しかし、ぼくは わすれる。", translation: "However, I forget." },
      { text: "よる、ミカから でんわが ある。ぼくは 「ごめんなさい。」と いう。", translation: "That night Mika calls. I say, \"I'm sorry.\"", speaker: "ぼく" },
      { text: "ろくがつ、また でんわが ある。", translation: "In June there's another call." },
      { text: "ミカは 「らいげつは いかがですか。」と いう。", translation: "Mika says, \"How about next month?\"", speaker: "ミカ" },
      { text: "ぼくは 「らいげつは いそがしいです。」と いう。", translation: "I say, \"Next month is busy.\"", speaker: "ぼく" },
      { text: "ぼくは べつに ミカが きらいじゃない。", translation: "It isn't that I dislike Mika." },
      { text: "しかし、しごとが ぜんぶ たいへんだ。", translation: "However, all of the work is hard." },
      { text: "しちがつ、でんわが ない。", translation: "In July there's no call." },
      { text: "はちがつも でんわが ない。", translation: "In August there's no call either." },
      { text: "あき、ぼくは ミカの ことが きになる。", translation: "In autumn Mika weighs on my mind." },
      { text: "ぼくは ミカに でんわを かける。けど、ミカは いない。", translation: "I call Mika. But Mika isn't there." },
      { text: "どようび、ぼくは ミカの うちに いく。", translation: "On Saturday I go to Mika's house." },
      { text: "うちに あたらしい ひとが いる。", translation: "There's a new person in the house." },
      { text: "ぼくは ドアの まえで いう。「ミカちゃんは どこですか。」", translation: "I say at the door, \"Where is Mika?\"", speaker: "ぼく" },
      { text: "その ひとは すぐに いう。「ミカちゃんは しちがつから とうきょうです。」", translation: "That person says straight away. \"Mika has been in Tokyo since July.\"", speaker: "その ひと" },
      { text: "ぼくは わかった。しがつの でんわの はなしだった。", translation: "I understood. It was what she said in the April call." },
      { text: "ぼくは わすれる ひとだ。", translation: "I'm someone who forgets." },
      { text: "ぼくは うちに かえる。", translation: "I go home." },
      { text: "よる、ぼくは ミカに てがみを かく。", translation: "That night I write Mika a letter." },
      { text: "「じゅうがつの どようびに とうきょうに いきます。」", translation: "\"I'm going to Tokyo on a Saturday in October.\"", speaker: "ぼく" },
      { text: "「じゅうじに えきの まえです。」", translation: "\"Ten o'clock, in front of the station.\"", speaker: "ぼく" },
      { text: "ぼくは ポストに いく。てがみは もう ポストの なかだ。", translation: "I go to the postbox. The letter is in the postbox now." },
      { text: "じゅうがつの どようびに、ぼくは とうきょうに いく。しごとは やすみだ。", translation: "On that Saturday in October I go to Tokyo. Work is off." },
    ],
  },
  {
    id: "ja-m27-practice-every-day",
    languageId: "ja",
    module: 27,
    level: 2,
    title: "Practice every day",
    theme: "Getting a little better, daily.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "まいにち れんしゅうするのは なにですか。",
        options: ["えいごです", "りょうりです", "スポーツです"],
        answer: "えいごです",
      },
    ],
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
    level: 2,
    title: "Getting stronger",
    theme: "A morning running habit.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "まいあさ はしるのは どこですか。",
        options: ["こうえんです", "がっこうです", "うちです"],
        answer: "こうえんです",
      },
    ],
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
    // m27 L5. だんだん / なる / れんしゅうする are the module's gift and both
    // m27 module-mates spend them on first-person self-improvement, so this one
    // points the same grammar at somebody else AND runs it downhill: the pupil
    // gets steadily worse, and the narrator's response is to teach harder. The
    // drawings at line 11 are the plant, dismissed at line 12 in the narrator's
    // own words; line 21 is what they were.
    id: "ja-m27-the-pictures-in-the-notebook",
    languageId: "ja",
    module: 27,
    level: 5,
    title: "The pictures in the notebook",
    theme: "A pupil who gets worse every week, and a notebook nobody looked at.",
    tags: ["school", "neighbours", "art"],
    glosses: [
      { surface: "えらぶ", meaning: "to choose", atomId: "ja:erabu" },
      { surface: "てつだう", meaning: "to help", atomId: "ja:tetsudau" },
      { surface: "ぜったい", meaning: "absolutely, without fail", atomId: "ja:zettai" },
      { surface: "ぜんぶ", meaning: "all of it, everything", atomId: "ja:zenbu" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "ケンは なにが いちばん すきですか。",
        options: ["えです", "えいごです", "ほんです"],
        answer: "えです",
      },
      {
        id: "age",
        kind: "detail",
        prompt: "ケンは なんさいですか。",
        options: ["じゅうさいです", "はちさいです", "じゅうごさいです"],
        answer: "じゅうさいです",
      },
    ],
    sentences: [
      { text: "となりの うちに ケンが すむ。ケンは じゅうさいだ。", translation: "Ken lives in the house next door. Ken is ten." },
      { text: "わたしは まいしゅう かようびに ケンに えいごを おしえる。", translation: "Every Tuesday I teach Ken English." },
      { text: "ケンの おかあさんは わたしの ははの ともだちだ。", translation: "Ken's mother is a friend of my mother's." },
      { text: "しがつ、ケンは よく べんきょうする。", translation: "In April Ken studies well." },
      { text: "ケンは えいごが だんだん じょうずに なる。", translation: "Ken gets better at English little by little." },
      { text: "ろくがつ、ケンは しゅくだいを しない。", translation: "In June Ken doesn't do the homework." },
      { text: "テストは わるい。", translation: "The test is bad." },
      { text: "ケンは だんだん へたに なる。", translation: "Ken gets worse little by little." },
      { text: "わたしは もっと たくさん おしえる。", translation: "I teach more." },
      { text: "わたしは ケンの ノートを みる。", translation: "I look at Ken's notebook." },
      { text: "ノートの なかに えが たくさん ある。", translation: "Inside the notebook there are a lot of pictures." },
      { text: "わたしは ノートを しめる。「えは だめです。えいごを べんきょうする ことが たいせつです。」", translation: "I close the notebook. \"The pictures are no good. Studying English is what matters.\"", speaker: "わたし" },
      { text: "しちがつ、ケンは こない。", translation: "In July Ken doesn't come." },
      { text: "はちがつも こない。", translation: "In August he doesn't come either." },
      { text: "わたしは ケンの うちに でかける。", translation: "I set off for Ken's house." },
      { text: "おかあさんは にわに いる。「ケンは げんきです。」", translation: "His mother is in the garden. \"Ken is fine.\"", speaker: "おかあさん" },
      { text: "「ケンは えが すきです。まいにち えを かきます。」", translation: "\"Ken likes pictures. He draws every day.\"", speaker: "おかあさん" },
      { text: "わたしは ケンの へやに はいる。", translation: "I go into Ken's room." },
      { text: "へやに ノートが たくさん ある。", translation: "There are a lot of notebooks in the room." },
      { text: "わたしは ノートを ぜんぶ よむ。", translation: "I read all of them." },
      { text: "えは ほんとうに じょうずだ。", translation: "The pictures are really good." },
      { text: "まちの えだ。ひとの えだ。ねこの えだ。", translation: "A picture of the town. A picture of a person. A picture of a cat." },
      { text: "わたしの えも ある。", translation: "There's a picture of me too." },
      { text: "おかあさんは しずかに はなす。「ケンは えの がっこうが すきです。けど、うちに おかねが ありません。」", translation: "His mother speaks quietly. \"Ken likes the art school. But we have no money.\"", speaker: "おかあさん" },
      { text: "わたしは わかった。わたしは わるい せんせいだった。", translation: "I understood. I was a bad teacher." },
      { text: "つぎの かようび、また ケンの うちに いく。", translation: "The next Tuesday I go to Ken's house again." },
      { text: "わたしは えいごの ほんを もつ。えの ほんだ。", translation: "I bring an English book. It's a book of pictures." },
      { text: "わたしは ケンに ほんの えを みせる。", translation: "I show Ken the pictures in the book." },
      { text: "ケンは えいごを よむ。えの えいごだ。", translation: "Ken reads the English. It's English about pictures." },
      { text: "ケンは えを かく。わたしは えいごを おしえる。", translation: "Ken draws. I teach English." },
      { text: "らいねん、ケンは えの がっこうを えらぶ。", translation: "Next year Ken will choose the art school." },
      { text: "わたしは ケンを ぜったい てつだう。", translation: "I'll help Ken without fail." },
    ],
  },
  {
    id: "ja-m29-cleaning-day",
    languageId: "ja",
    module: 29,
    level: 2,
    title: "Cleaning day",
    theme: "Tidying up with help.",
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "ともだちが なおすのは なにですか。",
        options: ["いすです", "ほんです", "ふくです"],
        answer: "いすです",
      },
    ],
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
    // m29 L5. The module's verb set (いそぐ / なおす / はこぶ / さがす / えらぶ /
    // てつだう / ぜんぶ) run as one morning going wrong, not as a tidy-up —
    // ja-m29-cleaning-day already owns かたづける and the household frame. The
    // plant is the day itself, named in line 1 and paid at line 14, which is why
    // the fifteen-minute walk to the shop was always going to be wasted.
    id: "ja-m29-two-broken-bicycles",
    languageId: "ja",
    module: 29,
    level: 5,
    title: "Two broken bicycles",
    theme: "A wasted morning, a closed shop, and an afternoon nobody planned.",
    tags: ["town", "friends", "bicycles"],
    glosses: [
      { surface: "やっぱり", meaning: "sure enough, after all", atomId: "ja:yappari" },
      { surface: "もちろん", meaning: "of course", atomId: "ja:mochiron" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "みせは どうして だめですか。",
        options: [
          "すいようびが やすみだからです",
          "みせが とおいからです",
          "おかねが ないからです",
        ],
        answer: "すいようびが やすみだからです",
      },
      {
        id: "late",
        kind: "detail",
        prompt: "ユミが えきに つくのは なんじですか。",
        options: ["じゅういちじです", "じゅうじです", "じゅうじはんです"],
        answer: "じゅういちじです",
      },
    ],
    sentences: [
      { text: "すいようびの あさ、ぼくは ユミに あう つもりだ。", translation: "On Wednesday morning I plan to meet Yumi." },
      { text: "じゅうじに えきの まえで あう。", translation: "We're meeting in front of the station at ten." },
      { text: "ぼくは じてんしゃで いく。", translation: "I go by bicycle." },
      { text: "けど、けさ じてんしゃが だめだ。", translation: "But this morning the bicycle is no good." },
      { text: "くじだ。ぼくは いそぐ。", translation: "It's nine. I hurry." },
      { text: "ぼくは じてんしゃを みる。けど、わるい ところが わからない。", translation: "I look at the bicycle. But I don't know what's wrong with it." },
      { text: "となりの ひとが ぼくを てつだう。", translation: "The person next door helps me." },
      { text: "ふたりで じてんしゃの まえに すわる。やっぱり だめだ。", translation: "The two of us sit down in front of the bicycle. It's no good after all." },
      { text: "ぼくは じてんしゃの みせを さがす。まちに ひとつ ある。", translation: "I look for a bicycle shop. There's one in town." },
      { text: "ふたりで じてんしゃを みせまで はこぶ。", translation: "The two of us carry the bicycle to the shop." },
      { text: "みせは とおい。じゅうごふん あるく。", translation: "The shop is far. We walk for fifteen minutes." },
      { text: "くじはん、みせに つく。", translation: "At half past nine we arrive at the shop." },
      { text: "みせの まえに ひとが いない。", translation: "There's nobody in front of the shop." },
      { text: "みせは すいようびが やすみだ。", translation: "The shop's day off is Wednesday." },
      { text: "となりの ひとは じてんしゃを うちまで はこぶ。", translation: "The person next door carries the bicycle home." },
      { text: "バスは いま こない。ぼくは あるく ことを えらぶ。", translation: "No bus is coming now. I choose to walk." },
      { text: "えきは とおい。ぼくは また いそぐ。", translation: "The station is far. I hurry again." },
      { text: "じゅうじはん、ぼくは えきに つく。", translation: "At half past ten I arrive at the station." },
      { text: "ユミが いない。", translation: "Yumi isn't there." },
      { text: "ぼくは こまる。", translation: "I'm at a loss." },
      { text: "じゅういちじ、ユミが くる。", translation: "At eleven Yumi arrives." },
      { text: "ユミは とても つかれる。", translation: "Yumi is very tired." },
      { text: "ユミの はなしは みじかい。「じてんしゃが だめでした。」", translation: "Yumi's story is short. \"The bicycle was no good.\"", speaker: "ユミ" },
      { text: "ぼくの はなしも みじかい。「ぼくの じてんしゃも だめです。」", translation: "My story is short too. \"My bicycle is no good either.\"", speaker: "ぼく" },
      { text: "「みせは どうでしたか。」", translation: "\"How was the shop?\"", speaker: "ユミ" },
      { text: "「すいようびは みせの やすみでした。」", translation: "\"Wednesday was the shop's day off.\"", speaker: "ぼく" },
      { text: "「やっぱり やすみでしたか。」", translation: "\"It was closed after all?\"", speaker: "ユミ" },
      { text: "ふたりで きっさてんに はいる。", translation: "The two of us go into a coffee shop." },
      { text: "ごごから、ふたりで ぼくの じてんしゃを なおす。", translation: "From the afternoon, the two of us fix my bicycle." },
      { text: "となりの ひとも てつだう。", translation: "The person next door helps too." },
      { text: "さんにんで ぜんぶ なおす。", translation: "The three of us fix all of it." },
      { text: "よる、ぼくの じてんしゃも ユミの じてんしゃも はしる。", translation: "That evening, my bicycle and Yumi's bicycle both run." },
      { text: "らいしゅうの すいようび、ふたりで じてんしゃで えきに いく。", translation: "The next Wednesday, the two of us go to the station by bicycle." },
      { text: "もちろん、みせは やすみだ。けど、じてんしゃは だめじゃない。", translation: "Of course the shop is closed. But the bicycles are fine." },
    ],
  },
  {
    // KEPT through the 2026-08-09 m30-pilot retirement (spec A1 explicitly
    // keeps this passage and its id). Its register vocabulary (せんぱい/
    // どうりょう/けいご/ていねい …) was re-homed to the unauthored keigo
    // modules by A2, so the module gate moves 30 → 50 with it: the story is
    // a recitation of exactly that vocabulary and is unreadable before
    // something teaches it. It re-surfaces in the library when m50 ships.
    id: "ja-m30-people-at-work",
    languageId: "ja",
    module: 50,
    level: 2,
    title: "People at work",
    theme: "Seniors, coworkers, and juniors.",
    glosses: [
      { surface: "したしい", meaning: "close, familiar", atomId: "ja:shitashii" },
      { surface: "やっぱり", meaning: "after all, as expected", atomId: "ja:yappari" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "だれが とても ていねいですか。",
        options: ["じょうしです", "せんぱいです", "どうりょうです"],
        answer: "じょうしです",
      },
    ],
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
  {
    // L5 — the top of the Japanese ladder. ja-m30-people-at-work recites the
    // relationship vocabulary; this story makes the learner USE it, because the
    // whole plot is one question about which register two people owe each other.
    // Line 6 plants the shared classroom and line 10 explains why it stays
    // unsaid; line 22 spends it, and lines 29-30 are the answer Japanese
    // actually gives — けいご inside the company, ためぐち outside it.
    //
    // Module gate 30 → 50 on 2026-08-09: the m30 pilot that taught this
    // vocabulary was retired (spec A1) and the register atoms re-homed to the
    // unauthored keigo modules (A2), so the story unlocks when m50 teaches
    // them. Id kept — ids are stable forever.
    //
    // Gloss note: いう is the verb of speaking worth the budget — a story about
    // how people speak needs more than はなす, and いう is an ordinary N5 word
    // the course simply never reaches. こたえる USED to be glossed here for the
    // same reason and no longer is: m30 (n4-01, authored 2026-08-14) teaches it,
    // so a gloss would pad the budget without teaching anything.
    id: "ja-m30-the-senior-i-grew-up-with",
    languageId: "ja",
    module: 50,
    level: 5,
    title: "The senior I grew up with",
    theme: "Four months of careful keigo, and one cherry tree in front of a school.",
    tags: ["work", "keigo", "friends"],
    glosses: [
      // The A2 re-home (2026-08-09) parked these on thr-n4 / "future", which
      // the gate reads as never-taught — declared here so the graded-reader
      // mechanic teaches them in place (L5 budget is 8).
      { surface: "おさななじみ", meaning: "childhood friend", atomId: "ja:osananajimi" },
      { surface: "もちろん", meaning: "of course", atomId: "ja:mochiron" },
      { surface: "べつに", meaning: "not particularly", atomId: "ja:betsuni" },
      { surface: "やっぱり", meaning: "after all, as expected", atomId: "ja:yappari" },
    ],
    questions: [
      {
        id: "gist",
        kind: "gist",
        prompt: "かいしゃの そとの ふたりは どうですか。",
        options: ["ためぐちです", "けいごです", "ていねいです"],
        answer: "ためぐちです",
      },
      {
        id: "class",
        kind: "detail",
        prompt: "ぼくと ユミは こどもの とき なんでしたか。",
        options: ["おなじ クラスでした", "おなじ かいしゃでした", "おなじ どうりょうでした"],
        answer: "おなじ クラスでした",
      },
    ],
    sentences: [
      { text: "しがつ、ぼくは あたらしい かいしゃに はいる。", translation: "In April I join a new company." },
      { text: "ぼくは いちばん あたらしい こうはいだ。", translation: "I'm the newest junior." },
      { text: "ぼくの せんぱいは ユミだ。ユミは ぼくより としが うえだ。", translation: "My senior is Yumi. Yumi is older than me." },
      { text: "ぼくは ユミに けいごを つかう。", translation: "I use keigo with Yumi." },
      { text: "ユミは とても ていねいだ。", translation: "Yumi is very polite." },
      { text: "ぼくは じゅうさいの とき、ユミと おなじ クラスだった。", translation: "When I was ten, I was in the same class as Yumi." },
      { text: "ふたりは おなじ まちの がっこうに いった。", translation: "We went to a school in the same town." },
      { text: "けど、ユミは ぼくが わからない。", translation: "But Yumi doesn't recognise me." },
      { text: "ぼくは ちいさい こどもだった。いまは おおきい。", translation: "I was a small child. Now I'm big." },
      { text: "ぼくは その はなしを しない。", translation: "I don't bring it up." },
      { text: "まいにち けいごを つかう。", translation: "Every day I use keigo." },
      { text: "どうりょうは ぼくに 「ユミは いい せんぱいです。」と いう。", translation: "A colleague says to me, \"Yumi is a good senior.\"", speaker: "どうりょう" },
      { text: "ろくがつ、しごとが たいへんだ。", translation: "In June the work is hard." },
      { text: "ユミは ぼくを ぜんぶ てつだう。", translation: "Yumi helps me with all of it." },
      { text: "ぼくは 「ありがとうございます。」と いう。", translation: "I say, \"Thank you very much.\"", speaker: "ぼく" },
      { text: "しちがつ、かいしゃの パーティーが ある。", translation: "In July there's a company party." },
      { text: "ユミと ぼくは いっしょに ばんごはんを たべる。", translation: "Yumi and I eat dinner together." },
      { text: "ユミは 「なんで いつも けいごですか。」と きく。", translation: "Yumi asks, \"Why is it always keigo?\"", speaker: "ユミ" },
      { text: "ぼくは 「せんぱいですから。」と こたえる。", translation: "I answer, \"Because you're my senior.\"", speaker: "ぼく" },
      { text: "ユミは じぶんの まちの はなしを する。", translation: "Yumi talks about her home town." },
      { text: "「がっこうの まえに おおきな さくらが あります。」", translation: "\"There's a big cherry tree in front of the school.\"", speaker: "ユミ" },
      { text: "ぼくは 「はい。ぼくも その がっこうの せいとでした。」と こたえる。", translation: "I answer, \"Yes. I was a pupil at that school too.\"", speaker: "ぼく" },
      { text: "ユミは ぼくを みる。", translation: "Yumi looks at me." },
      { text: "「あの ちいさい こどもですか。」", translation: "\"That little kid?\"", speaker: "ユミ" },
      { text: "ぼくは 「はい。」と いう。", translation: "I say, \"Yes.\"", speaker: "ぼく" },
      { text: "ユミは 「じゃあ、けいごは しつれいです。」と いう。", translation: "Yumi says, \"Then keigo is rude.\"", speaker: "ユミ" },
      { text: "ぼくは わからない。", translation: "I don't follow." },
      { text: "ユミは 「かいしゃでは せんぱいと こうはいです。そとでは おさななじみです。」と いう。", translation: "Yumi says, \"Inside the company we're senior and junior. Outside it we're childhood friends.\"", speaker: "ユミ" },
      { text: "いま、かいしゃで ぼくは けいごを つかう。もちろん ていねいだ。", translation: "Now, at the company I use keigo. Politely, of course." },
      { text: "かいしゃの そとで、ふたりは ためぐちで はなす。", translation: "Outside the company, the two of us talk in plain speech." },
      { text: "どうりょうは その はなしが きになる。", translation: "My colleague is curious about it." },
      { text: "ぼくは べつに その はなしを しない。", translation: "I don't particularly bring it up." },
      { text: "やっぱり それは かいしゃの はなしじゃない。", translation: "It isn't company business after all." },
    ],
  },
];
