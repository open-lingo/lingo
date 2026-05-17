/**
 * Per-module review content pools — fed into `buildModuleReviewLessons`.
 *
 * Each pool surfaces the highest-leverage cloze/build/dialogue items from
 * the source module. The factory interleaves across the pools so a review
 * cycle covering M3+M4 doesn't run three full M3 lessons then three M4.
 */
import type { ReviewPool } from "./buildModuleReview";

export const POOL_M3: ReviewPool = {
  moduleId: "m3",
  clozes: [
    {
      before: "わたし",
      after: " がくせいです。",
      correctParticle: "は",
      options: ["は", "が", "を", "に"],
      meaningEn: "I am a student.",
      audioText: "わたしは がくせいです。",
      explanation: "Topic = me. Standard self-introduction.",
    },
    {
      before: "がくせいです",
      after: "。",
      correctParticle: "か",
      options: ["は", "が", "か", "を"],
      meaningEn: "Are you a student?",
      audioText: "がくせいですか。",
      explanation: "Statement → question via か.",
    },
    {
      before: "ともだち",
      after: " せんせいです。",
      correctParticle: "は",
      options: ["は", "の", "が", "を"],
      meaningEn: "My friend is a teacher.",
      audioText: "ともだちは せんせいです。",
    },
    {
      before: "なまえ",
      after: " なんですか。",
      correctParticle: "は",
      options: ["は", "が", "の", "を"],
      meaningEn: "What is your name?",
      audioText: "なまえは なんですか。",
    },
    {
      before: "これ",
      after: " みずです。",
      correctParticle: "は",
      options: ["は", "が", "を", "の"],
      meaningEn: "This is water.",
      audioText: "これは みずです。",
    },
    {
      before: "アメリカじんです",
      after: "。",
      correctParticle: "か",
      options: ["か", "は", "が", "の"],
      meaningEn: "Are you American?",
      audioText: "アメリカじんですか。",
    },
  ],
  builds: [
    {
      prompt: "Say: I am American.",
      target: "わたしは アメリカじんです",
      tiles: ["わたしは", "アメリカじんです", "がくせいです", "にほんじんです"],
      correctOrder: ["わたしは", "アメリカじんです"],
    },
    {
      prompt: "Ask: What is your name?",
      target: "なまえは なんですか",
      tiles: ["なまえは", "なんですか", "どこですか", "わたしは"],
      correctOrder: ["なまえは", "なんですか"],
    },
    {
      prompt: "Say: My friend is a teacher.",
      target: "ともだちは せんせいです",
      tiles: ["ともだちは", "せんせいです", "わたしは", "がくせいです"],
      correctOrder: ["ともだちは", "せんせいです"],
    },
    {
      prompt: "Ask: Is that a cat?",
      target: "それは ねこですか",
      tiles: ["それは", "ねこですか", "これは", "いぬですか"],
      correctOrder: ["それは", "ねこですか"],
    },
  ],
  dialogue: [
    {
      speaker: "You",
      meaningEn: "I am Spencer.",
      romaji: "watashi wa Spencer desu",
      kana: "わたしは Spencer です",
    },
    {
      speaker: "Stranger",
      meaningEn: "Are you American?",
      romaji: "amerikajin desu ka",
      kana: "アメリカじんですか",
    },
  ],
};

export const POOL_M4: ReviewPool = {
  moduleId: "m4",
  clozes: [
    {
      before: "わたし",
      after: " かばんです。",
      correctParticle: "の",
      options: ["の", "は", "が", "を"],
      meaningEn: "It's my bag.",
      audioText: "わたしの かばんです。",
    },
    {
      before: "せんせい",
      after: " ほんです。",
      correctParticle: "の",
      options: ["は", "の", "に", "を"],
      meaningEn: "It's the teacher's book.",
      audioText: "せんせいの ほんです。",
    },
    {
      before: "それ",
      after: " なんですか。",
      correctParticle: "は",
      options: ["は", "が", "を", "の"],
      meaningEn: "What's that?",
      audioText: "それは なんですか。",
    },
    {
      before: "あれは ともだち",
      after: " くるまです。",
      correctParticle: "の",
      options: ["の", "は", "が", "を"],
      meaningEn: "That over there is my friend's car.",
      audioText: "あれは ともだちの くるまです。",
    },
    {
      before: "これは にほん",
      after: " カメラです。",
      correctParticle: "の",
      options: ["の", "は", "が", "を"],
      meaningEn: "This is a Japanese camera.",
      audioText: "これは にほんの カメラです。",
    },
    {
      before: "あなた",
      after: " かさですか。",
      correctParticle: "の",
      options: ["の", "は", "を", "に"],
      meaningEn: "Is it your umbrella?",
      audioText: "あなたの かさですか。",
    },
  ],
  builds: [
    {
      prompt: "Say: This is my umbrella.",
      target: "これは わたしの かさです",
      tiles: ["これは", "わたしの", "かさです", "それは", "ともだちの"],
      correctOrder: ["これは", "わたしの", "かさです"],
    },
    {
      prompt: "Ask: Is that your bag?",
      target: "それは あなたの かばんですか",
      tiles: ["それは", "あなたの", "かばんですか", "わたしの", "これは"],
      correctOrder: ["それは", "あなたの", "かばんですか"],
    },
    {
      prompt: "Say: That over there is the teacher's car.",
      target: "あれは せんせいの くるまです",
      tiles: ["あれは", "せんせいの", "くるまです", "ともだちの", "これは"],
      correctOrder: ["あれは", "せんせいの", "くるまです"],
    },
    {
      prompt: "Ask: Which is your dictionary?",
      target: "どれが あなたの じしょですか",
      tiles: ["どれが", "あなたの", "じしょですか", "どれは", "わたしの"],
      correctOrder: ["どれが", "あなたの", "じしょですか"],
    },
  ],
  dialogue: [
    {
      speaker: "Friend",
      meaningEn: "Is that your bag?",
      romaji: "sore wa anata no kaban desu ka",
      kana: "それは あなたの かばんですか",
    },
    {
      speaker: "You",
      meaningEn: "Yes, it's mine.",
      romaji: "hai, watashi no desu",
      kana: "はい、わたしのです",
    },
  ],
};

export const POOL_M5: ReviewPool = {
  moduleId: "m5",
  clozes: [
    {
      before: "これ",
      after: " いくらですか。",
      correctParticle: "は",
      options: ["は", "の", "が", "を"],
      meaningEn: "How much is this?",
      audioText: "これは いくらですか。",
    },
    {
      before: "コーヒー",
      after: " いくらですか。",
      correctParticle: "は",
      options: ["は", "の", "が", "を"],
      meaningEn: "How much is the coffee?",
      audioText: "コーヒーは いくらですか。",
    },
    {
      before: "あれは わたし",
      after: " かばんです。",
      correctParticle: "の",
      options: ["の", "は", "が", "を"],
      meaningEn: "That over there is my bag.",
      audioText: "あれは わたしの かばんです。",
    },
    {
      before: "それ",
      after: " せんせいの ペンですか。",
      correctParticle: "は",
      options: ["は", "の", "が", "を"],
      meaningEn: "Is that the teacher's pen?",
      audioText: "それは せんせいの ペンですか。",
    },
  ],
  builds: [
    {
      prompt: "Order: Two coffees, please.",
      target: "コーヒー ふたつ ください",
      tiles: ["コーヒー", "ふたつ", "ください", "ビール", "ひとつ"],
      correctOrder: ["コーヒー", "ふたつ", "ください"],
    },
    {
      prompt: "Ask: How much is this?",
      target: "これは いくらですか",
      tiles: ["これは", "いくらですか", "それは", "なんですか"],
      correctOrder: ["これは", "いくらですか"],
    },
    {
      prompt: "Say: (A table for) three people.",
      target: "さんにんです",
      tiles: ["さんにんです", "ふたりです", "ひとりです", "よにんです"],
      correctOrder: ["さんにんです"],
    },
    {
      prompt: "Order: Water, please.",
      target: "みず ください",
      tiles: ["みず", "ください", "おちゃ", "ビール"],
      correctOrder: ["みず", "ください"],
    },
  ],
  dialogue: [
    {
      speaker: "You",
      meaningEn: "Two coffees, please.",
      romaji: "koohii futatsu kudasai",
      kana: "コーヒー ふたつ ください",
    },
    {
      speaker: "Staff",
      meaningEn: "Is that everything?",
      romaji: "ijou de yoroshii desu ka",
      kana: "いじょうで よろしいですか",
    },
  ],
};

export const POOL_M6: ReviewPool = {
  moduleId: "m6",
  clozes: [
    {
      before: "がっこう",
      after: " いきます。",
      correctParticle: "に",
      options: ["に", "で", "を", "は"],
      meaningEn: "I go to school.",
      audioText: "がっこうに いきます。",
    },
    {
      before: "うち",
      after: " べんきょうします。",
      correctParticle: "で",
      options: ["に", "で", "を", "の"],
      meaningEn: "I study at home.",
      audioText: "うちで べんきょうします。",
    },
    {
      before: "トイレ",
      after: " ありますか。",
      correctParticle: "が",
      options: ["が", "は", "の", "を"],
      meaningEn: "Is there a toilet?",
      audioText: "トイレが ありますか。",
    },
    {
      before: "ねこ",
      after: " います。",
      correctParticle: "が",
      options: ["が", "は", "の", "を"],
      meaningEn: "There's a cat.",
      audioText: "ねこが います。",
    },
    {
      before: "でんしゃ",
      after: " いきます。",
      correctParticle: "で",
      options: ["で", "に", "を", "は"],
      meaningEn: "I go by train.",
      audioText: "でんしゃで いきます。",
    },
    {
      before: "こうえん",
      after: " あります。",
      correctParticle: "が",
      options: ["が", "は", "の", "を"],
      meaningEn: "There's a park.",
      audioText: "こうえんが あります。",
    },
  ],
  builds: [
    {
      prompt: "Say: I go to school by bicycle.",
      target: "じてんしゃで がっこうに いきます",
      tiles: ["じてんしゃで", "がっこうに", "いきます", "うちで", "コンビニに"],
      correctOrder: ["じてんしゃで", "がっこうに", "いきます"],
    },
    {
      prompt: "Ask: Is there a toilet?",
      target: "トイレが ありますか",
      tiles: ["トイレが", "ありますか", "ねこが", "いますか"],
      correctOrder: ["トイレが", "ありますか"],
    },
    {
      prompt: "Say: There's a park.",
      target: "こうえんが あります",
      tiles: ["こうえんが", "あります", "ねこが", "います"],
      correctOrder: ["こうえんが", "あります"],
    },
    {
      prompt: "Say: I'm at the station.",
      target: "えきに います",
      tiles: ["えきに", "います", "あります", "がっこうで"],
      correctOrder: ["えきに", "います"],
    },
  ],
  dialogue: [
    {
      speaker: "You",
      meaningEn: "Excuse me. Is there a convenience store?",
      romaji: "sumimasen. konbini ga arimasu ka",
      kana: "すみません。コンビニが ありますか",
    },
    {
      speaker: "Stranger",
      meaningEn: "Yes. There's a FamilyMart at the station.",
      romaji: "hai. eki ni FamilyMart ga arimasu",
      kana: "はい。えきに FamilyMart が あります",
    },
  ],
};
