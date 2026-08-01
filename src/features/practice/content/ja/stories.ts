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
      { surface: "わたし", meaning: "I, me", atomId: "ja:watashi" },
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
    module: 4,
    level: 2,
    title: "Whose bag?",
    theme: "An unclaimed bag, and a name inside it.",
    tags: ["school", "mystery"],
    glosses: [
      { surface: "あります", meaning: "there is (a thing)", atomId: "ja:arimasu" },
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
    module: 5,
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
    module: 5,
    level: 2,
    title: "Not quite enough",
    theme: "Two friends, one snack, and a hundred yen missing.",
    tags: ["shopping", "friends", "money"],
    glosses: [{ surface: "たかい", meaning: "expensive, tall", atomId: "ja:takai" }],
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
      { text: "じゅうじの ニュースも みた。", translation: "I watched the ten o'clock news too." },
      { text: "それから、また テレビを みた。", translation: "And after that, more TV." },
      { text: "けさ、ぼくは しちじに おきる。", translation: "This morning I get up at seven." },
      { text: "しごとは はちじだ。", translation: "Work starts at eight." },
      { text: "きょうは げつようびだ。", translation: "Today is Monday." },
      { text: "シャワーも おふろも ない。", translation: "No shower, no bath." },
      { text: "ぼくは かおを あらう。", translation: "I wash my face." },
      { text: "あたらしい ふくも ない。", translation: "There are no new clothes either." },
      { text: "あさ、パンを たべない。", translation: "I skip breakfast." },
      { text: "ぼくは えきに はしる。", translation: "I run to the station." },
      { text: "でんしゃが ない。", translation: "There's no train." },
      { text: "つぎの でんしゃは はちじはんだ。", translation: "The next one is half past eight." },
      { text: "ぼくは コンビニの パンを たべる。", translation: "I eat bread from the convenience store." },
      { text: "パンは ふるいけど、おいしい。", translation: "The bread is old, but good." },
      { text: "それから、でんしゃで かいしゃに いく。", translation: "Then I take the train to the office." },
      { text: "かいしゃに ひとが いない。", translation: "There's nobody at the office." },
      { text: "どうして ひとが いない。", translation: "Why is nobody here?" },
      { text: "きょうは げつようびじゃない。にちようびだ。", translation: "Today isn't Monday. It's Sunday." },
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
      { text: "ユミは ぼくに ごひゃくえんを かす。", translation: "Yumi lends me five hundred yen." },
      { text: "ぼくは みせで きってを かった。", translation: "I bought a stamp at the shop." },
      { text: "きってを ふうとうに はる。", translation: "I stick the stamp on the envelope." },
      { text: "それから、ポストに いく。", translation: "Then I go to the postbox." },
      { text: "いま、てがみは ポストに ある。", translation: "Now the letter is in the postbox." },
      { text: "ぼくは うちに いく。", translation: "I go home." },
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
      { text: "ユミは どようびに うみに いく。", translation: "Yumi is going to the sea on Saturday." },
      { text: "ユミは ぼくを まつ。", translation: "Yumi waits for me." },
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
    id: "ja-m17-to-the-station",
    languageId: "ja",
    module: 17,
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
    id: "ja-m19-my-family",
    languageId: "ja",
    module: 19,
    level: 2,
    title: "My family",
    theme: "Four of us, and a birthday.",
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
    id: "ja-m30-people-at-work",
    languageId: "ja",
    module: 30,
    level: 2,
    title: "People at work",
    theme: "Seniors, coworkers, and juniors.",
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
];
