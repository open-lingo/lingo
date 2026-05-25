import type { LessonStep } from "@/features/lesson/types";
import { cloze, sentenceMcq } from "@/features/lesson/data/_jaGrammarHelpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlacementItemConfig = {
  id: string;
  moduleId: string;
} & (ClozeConfig | SentenceMcqConfig);

type ClozeConfig = {
  type: "cloze";
  before: string;
  after: string;
  correctParticle: string;
  options: string[];
  meaningEn: string;
  audioText: string;
};

type SentenceMcqConfig = {
  type: "sentenceMcq";
  prompt: string;
  correctKana: string;
  distractorsKana: [string, string, string];
};

// ---------------------------------------------------------------------------
// Instantiation
// ---------------------------------------------------------------------------

export function instantiateItem(config: PlacementItemConfig): LessonStep {
  if (config.type === "cloze") {
    return cloze(
      config.id,
      config.before,
      config.after,
      config.correctParticle,
      config.options,
      config.meaningEn,
      config.audioText,
    );
  }
  return sentenceMcq({
    id: config.id,
    prompt: config.prompt,
    correctKana: config.correctKana,
    distractorsKana: config.distractorsKana,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getItemsForModule(moduleId: string): PlacementItemConfig[] {
  return PLACEMENT_QUESTION_BANK.filter((i) => i.moduleId === moduleId);
}

// ---------------------------------------------------------------------------
// Question bank — 3 items per module, M3-M27 (75 total)
// ---------------------------------------------------------------------------

export const PLACEMENT_QUESTION_BANK: readonly PlacementItemConfig[] = [
  // ── M3: は/か, です ──────────────────────────────────────────────────
  {
    id: "pt-m3-1", moduleId: "m3", type: "cloze",
    before: "わたし", after: "がくせい です",
    correctParticle: "は", options: ["は", "か", "の", "を"],
    meaningEn: "I am a student.", audioText: "わたしは がくせい です",
  },
  {
    id: "pt-m3-2", moduleId: "m3", type: "cloze",
    before: "これは なん です", after: "",
    correctParticle: "か", options: ["か", "は", "も", "の"],
    meaningEn: "What is this?", audioText: "これは なん ですか",
  },
  {
    id: "pt-m3-3", moduleId: "m3", type: "sentenceMcq",
    prompt: "How do you say 'I am also a teacher' in Japanese?",
    correctKana: "わたしも せんせい です",
    distractorsKana: ["わたしは せんせい です", "わたしの せんせい です", "わたしか せんせい です"],
  },

  // ── M4: の, これ/それ/あれ ───────────────────────────────────────────
  {
    id: "pt-m4-1", moduleId: "m4", type: "cloze",
    before: "わたし", after: "ほん",
    correctParticle: "の", options: ["の", "は", "を", "が"],
    meaningEn: "My book.", audioText: "わたしの ほん",
  },
  {
    id: "pt-m4-2", moduleId: "m4", type: "sentenceMcq",
    prompt: "'That (near you) is a pen.' — which is correct?",
    correctKana: "それは ペン です",
    distractorsKana: ["これは ペン です", "あれは ペン です", "どれは ペン です"],
  },
  {
    id: "pt-m4-3", moduleId: "m4", type: "sentenceMcq",
    prompt: "Whose bag is this? 'It is Tanaka's bag.'",
    correctKana: "たなかさんの かばん です",
    distractorsKana: ["たなかさんは かばん です", "たなかさんも かばん です", "たなかさんを かばん です"],
  },

  // ── M5: Numbers, ください, counters ──────────────────────────────────
  {
    id: "pt-m5-1", moduleId: "m5", type: "sentenceMcq",
    prompt: "'Two waters, please.' — which is correct?",
    correctKana: "みずを ふたつ ください",
    distractorsKana: ["みずを にこ ください", "みずの ふたつ ください", "みずを ふたり ください"],
  },
  {
    id: "pt-m5-2", moduleId: "m5", type: "sentenceMcq",
    prompt: "How many people? 'There are three people.'",
    correctKana: "さんにん います",
    distractorsKana: ["みっつ います", "さんこ います", "さんつ います"],
  },
  {
    id: "pt-m5-3", moduleId: "m5", type: "cloze",
    before: "とうきょう", after: "きました",
    correctParticle: "から", options: ["から", "まで", "に", "で"],
    meaningEn: "I came from Tokyo.", audioText: "とうきょうから きました",
  },

  // ── M6: に/で/が (location, existence) ───────────────────────────────
  {
    id: "pt-m6-1", moduleId: "m6", type: "cloze",
    before: "がっこう", after: "べんきょうします",
    correctParticle: "で", options: ["で", "に", "を", "は"],
    meaningEn: "I study at school.", audioText: "がっこうで べんきょうします",
  },
  {
    id: "pt-m6-2", moduleId: "m6", type: "cloze",
    before: "つくえのうえ", after: "ほんが あります",
    correctParticle: "に", options: ["に", "で", "は", "が"],
    meaningEn: "There is a book on the desk.", audioText: "つくえのうえに ほんが あります",
  },
  {
    id: "pt-m6-3", moduleId: "m6", type: "sentenceMcq",
    prompt: "'There is a cat.' — which uses the correct verb for living things?",
    correctKana: "ねこが います",
    distractorsKana: ["ねこが あります", "ねこを います", "ねこに います"],
  },

  // ── M7: ます-form verbs, を ──────────────────────────────────────────
  {
    id: "pt-m7-1", moduleId: "m7", type: "cloze",
    before: "みず", after: "のみます",
    correctParticle: "を", options: ["を", "は", "が", "に"],
    meaningEn: "I drink water.", audioText: "みずを のみます",
  },
  {
    id: "pt-m7-2", moduleId: "m7", type: "sentenceMcq",
    prompt: "'I read a book.' — which is correct?",
    correctKana: "ほんを よみます",
    distractorsKana: ["ほんが よみます", "ほんに よみます", "ほんで よみます"],
  },
  {
    id: "pt-m7-3", moduleId: "m7", type: "sentenceMcq",
    prompt: "'I go to the park.' — which is correct?",
    correctKana: "こうえんに いきます",
    distractorsKana: ["こうえんを いきます", "こうえんで いきます", "こうえんは いきます"],
  },

  // ── M8: い-adjectives, この/その ─────────────────────────────────────
  {
    id: "pt-m8-1", moduleId: "m8", type: "sentenceMcq",
    prompt: "'This book is expensive.' — which is correct?",
    correctKana: "このほんは たかいです",
    distractorsKana: ["このほんは たかです", "これほんは たかいです", "このほんは たかなです"],
  },
  {
    id: "pt-m8-2", moduleId: "m8", type: "sentenceMcq",
    prompt: "Negate: 'It is not cold.'",
    correctKana: "さむくないです",
    distractorsKana: ["さむいじゃないです", "さむないです", "さむいくないです"],
  },
  {
    id: "pt-m8-3", moduleId: "m8", type: "cloze",
    before: "りんご", after: "みかんを たべます",
    correctParticle: "と", options: ["と", "や", "も", "の"],
    meaningEn: "I eat apples and oranges.", audioText: "りんごと みかんを たべます",
  },

  // ── M9: な-adjectives, よ/ね ─────────────────────────────────────────
  {
    id: "pt-m9-1", moduleId: "m9", type: "sentenceMcq",
    prompt: "'This town is quiet.' — which is correct?",
    correctKana: "このまちは しずかです",
    distractorsKana: ["このまちは しずかいです", "このまちは しずくです", "このまちは しずかなです"],
  },
  {
    id: "pt-m9-2", moduleId: "m9", type: "sentenceMcq",
    prompt: "Negate: 'It is not convenient.'",
    correctKana: "べんりじゃないです",
    distractorsKana: ["べんりくないです", "べんりないです", "べんりではです"],
  },
  {
    id: "pt-m9-3", moduleId: "m9", type: "sentenceMcq",
    prompt: "'This is delicious, isn't it!' — add the right particle.",
    correctKana: "おいしいですね",
    distractorsKana: ["おいしいですよ", "おいしいですか", "おいしいですの"],
  },

  // ── M10: ました, でした (past tense) ─────────────────────────────────
  {
    id: "pt-m10-1", moduleId: "m10", type: "sentenceMcq",
    prompt: "'I ate sushi.' — which is correct?",
    correctKana: "すしを たべました",
    distractorsKana: ["すしを たべます", "すしは たべました", "すしを たべています"],
  },
  {
    id: "pt-m10-2", moduleId: "m10", type: "sentenceMcq",
    prompt: "'Yesterday was fun.' — which is correct?",
    correctKana: "きのうは たのしかったです",
    distractorsKana: ["きのうは たのしいでした", "きのうは たのしかったでした", "きのうは たのしいです"],
  },
  {
    id: "pt-m10-3", moduleId: "m10", type: "sentenceMcq",
    prompt: "'The park was quiet.' — which is correct?",
    correctKana: "こうえんは しずかでした",
    distractorsKana: ["こうえんは しずかかったです", "こうえんは しずかました", "こうえんは しずかだったです"],
  },

  // ── M11: ません, ない-form, まだ/もう ────────────────────────────────
  {
    id: "pt-m11-1", moduleId: "m11", type: "sentenceMcq",
    prompt: "'I don't drink coffee.' — which is correct?",
    correctKana: "コーヒーを のみません",
    distractorsKana: ["コーヒーを のまないです", "コーヒーを のみないです", "コーヒーは のみます"],
  },
  {
    id: "pt-m11-2", moduleId: "m11", type: "sentenceMcq",
    prompt: "'I haven't eaten yet.' — which is correct?",
    correctKana: "まだ たべていません",
    distractorsKana: ["もう たべていません", "まだ たべました", "もう たべません"],
  },
  {
    id: "pt-m11-3", moduleId: "m11", type: "sentenceMcq",
    prompt: "'I already finished.' — which is correct?",
    correctKana: "もう おわりました",
    distractorsKana: ["まだ おわりました", "もう おわります", "まだ おわっていません"],
  },

  // ── M12: Time, に (time marker) ──────────────────────────────────────
  {
    id: "pt-m12-1", moduleId: "m12", type: "sentenceMcq",
    prompt: "'I wake up at 7 o'clock.' — which is correct?",
    correctKana: "しちじに おきます",
    distractorsKana: ["ななじに おきます", "しちじで おきます", "しちじは おきます"],
  },
  {
    id: "pt-m12-2", moduleId: "m12", type: "cloze",
    before: "さんじ", after: "おきます",
    correctParticle: "に", options: ["に", "で", "を", "は"],
    meaningEn: "I wake up at 3 o'clock.", audioText: "さんじに おきます",
  },
  {
    id: "pt-m12-3", moduleId: "m12", type: "sentenceMcq",
    prompt: "'What time is it now?' — which is correct?",
    correctKana: "いま なんじですか",
    distractorsKana: ["いま なんですか", "いま なにじですか", "いま どのじですか"],
  },

  // ── M13: から...まで, から (because), months ─────────────────────────
  {
    id: "pt-m13-1", moduleId: "m13", type: "cloze",
    before: "くじ", after: "ごじまで はたらきます",
    correctParticle: "から", options: ["から", "まで", "に", "で"],
    meaningEn: "I work from 9 to 5.", audioText: "くじから ごじまで はたらきます",
  },
  {
    id: "pt-m13-2", moduleId: "m13", type: "sentenceMcq",
    prompt: "'Because it's hot, I drink water.' — which is correct?",
    correctKana: "あついですから みずを のみます",
    distractorsKana: ["あついですので みずを のみます", "あついですまで みずを のみます", "あついですけど みずを のみます"],
  },
  {
    id: "pt-m13-3", moduleId: "m13", type: "sentenceMcq",
    prompt: "How do you say 'March' in Japanese?",
    correctKana: "さんがつ",
    distractorsKana: ["みつき", "さんつき", "みっかげつ"],
  },

  // ── M14: て-form ─────────────────────────────────────────────────────
  {
    id: "pt-m14-1", moduleId: "m14", type: "sentenceMcq",
    prompt: "What is the て-form of たべる (to eat)?",
    correctKana: "たべて",
    distractorsKana: ["たべって", "たべんで", "たべいて"],
  },
  {
    id: "pt-m14-2", moduleId: "m14", type: "sentenceMcq",
    prompt: "What is the て-form of のむ (to drink)?",
    correctKana: "のんで",
    distractorsKana: ["のみて", "のって", "のいで"],
  },
  {
    id: "pt-m14-3", moduleId: "m14", type: "sentenceMcq",
    prompt: "'Please wait.' — which is correct?",
    correctKana: "まってください",
    distractorsKana: ["まちてください", "まつてください", "まいてください"],
  },

  // ── M15: ている, たい, てもいい ──────────────────────────────────────
  {
    id: "pt-m15-1", moduleId: "m15", type: "sentenceMcq",
    prompt: "'I am reading a book.' (progressive) — which is correct?",
    correctKana: "ほんを よんでいます",
    distractorsKana: ["ほんを よみています", "ほんを よみます", "ほんを よんでありです"],
  },
  {
    id: "pt-m15-2", moduleId: "m15", type: "sentenceMcq",
    prompt: "'I want to eat ramen.' — which is correct?",
    correctKana: "ラーメンを たべたいです",
    distractorsKana: ["ラーメンが たべますたい", "ラーメンを たべほしいです", "ラーメンは たべたいです"],
  },
  {
    id: "pt-m15-3", moduleId: "m15", type: "sentenceMcq",
    prompt: "'May I sit here?' — which is correct?",
    correctKana: "ここに すわってもいいですか",
    distractorsKana: ["ここに すわるもいいですか", "ここで すわってもいいですか", "ここに すわってはいいですか"],
  },

  // ── M16: てはいけません, ないでください, てから ───────────────────────
  {
    id: "pt-m16-1", moduleId: "m16", type: "sentenceMcq",
    prompt: "'You must not smoke here.' — which is correct?",
    correctKana: "ここで タバコを すってはいけません",
    distractorsKana: ["ここで タバコを すわないでください", "ここで タバコを すってもいいません", "ここで タバコを すらないでください"],
  },
  {
    id: "pt-m16-2", moduleId: "m16", type: "sentenceMcq",
    prompt: "'Please don't touch.' — which is correct?",
    correctKana: "さわらないでください",
    distractorsKana: ["さわってはいけません", "さわらないください", "さわりないでください"],
  },
  {
    id: "pt-m16-3", moduleId: "m16", type: "sentenceMcq",
    prompt: "'After eating, I brush my teeth.' — which is correct?",
    correctKana: "たべてから はを みがきます",
    distractorsKana: ["たべたから はを みがきます", "たべるから はを みがきます", "たべてまで はを みがきます"],
  },

  // ── M17: で (means), に/へ (direction) ───────────────────────────────
  {
    id: "pt-m17-1", moduleId: "m17", type: "cloze",
    before: "バス", after: "がっこうに いきます",
    correctParticle: "で", options: ["で", "に", "を", "は"],
    meaningEn: "I go to school by bus.", audioText: "バスで がっこうに いきます",
  },
  {
    id: "pt-m17-2", moduleId: "m17", type: "sentenceMcq",
    prompt: "'I walk to the station.' — which is correct?",
    correctKana: "えきまで あるきます",
    distractorsKana: ["えきに あるきます", "えきで あるきます", "えきを あるきます"],
  },
  {
    id: "pt-m17-3", moduleId: "m17", type: "sentenceMcq",
    prompt: "'Please come by 3 o'clock.' — which is correct?",
    correctKana: "さんじまでに きてください",
    distractorsKana: ["さんじまで きてください", "さんじに きてください", "さんじからに きてください"],
  },

  // ── M18: でしょう, とおもいます ──────────────────────────────────────
  {
    id: "pt-m18-1", moduleId: "m18", type: "sentenceMcq",
    prompt: "'It will probably rain tomorrow.' — which is correct?",
    correctKana: "あしたは あめでしょう",
    distractorsKana: ["あしたは あめです", "あしたは あめかもです", "あしたは あめますでしょう"],
  },
  {
    id: "pt-m18-2", moduleId: "m18", type: "sentenceMcq",
    prompt: "'I think it is delicious.' — which is correct?",
    correctKana: "おいしいと おもいます",
    distractorsKana: ["おいしいを おもいます", "おいしいが おもいます", "おいしいに おもいます"],
  },
  {
    id: "pt-m18-3", moduleId: "m18", type: "sentenceMcq",
    prompt: "'It will probably be cold.' — which is correct?",
    correctKana: "さむいでしょう",
    distractorsKana: ["さむいだろう", "さむくでしょう", "さむいましょう"],
  },

  // ── M19: Family, age ─────────────────────────────────────────────────
  {
    id: "pt-m19-1", moduleId: "m19", type: "sentenceMcq",
    prompt: "How do you say 'my (humble) mother'?",
    correctKana: "はは",
    distractorsKana: ["おかあさん", "ははおや", "あね"],
  },
  {
    id: "pt-m19-2", moduleId: "m19", type: "sentenceMcq",
    prompt: "'My older brother is 25 years old.' — which is correct?",
    correctKana: "あには にじゅうごさいです",
    distractorsKana: ["おにいさんは にじゅうごさいです", "あにが にじゅうごつです", "あには にじゅうごねんです"],
  },
  {
    id: "pt-m19-3", moduleId: "m19", type: "sentenceMcq",
    prompt: "'We are a family of four.' — which is correct?",
    correctKana: "よにんかぞくです",
    distractorsKana: ["しにんかぞくです", "よつかぞくです", "よんにんかぞくです"],
  },

  // ── M20: Body, ので ──────────────────────────────────────────────────
  {
    id: "pt-m20-1", moduleId: "m20", type: "sentenceMcq",
    prompt: "'My head hurts.' — which is correct?",
    correctKana: "あたまが いたいです",
    distractorsKana: ["あたまは いたいです", "あたまを いたいです", "あたまに いたいです"],
  },
  {
    id: "pt-m20-2", moduleId: "m20", type: "sentenceMcq",
    prompt: "'Because I'm sick, I won't go to school.' — using な-adj + ので:",
    correctKana: "びょうきなので がっこうに いきません",
    distractorsKana: ["びょうきだので がっこうに いきません", "びょうきのので がっこうに いきません", "びょうきからので がっこうに いきません"],
  },
  {
    id: "pt-m20-3", moduleId: "m20", type: "sentenceMcq",
    prompt: "Which is the word for 'stomach'?",
    correctKana: "おなか",
    distractorsKana: ["あたま", "くち", "て"],
  },

  // ── M21: Food vocab, や, と (quotation) ──────────────────────────────
  {
    id: "pt-m21-1", moduleId: "m21", type: "cloze",
    before: "すし", after: "ラーメンを たべます",
    correctParticle: "や", options: ["や", "と", "も", "か"],
    meaningEn: "I eat things like sushi and ramen.", audioText: "すしや ラーメンを たべます",
  },
  {
    id: "pt-m21-2", moduleId: "m21", type: "sentenceMcq",
    prompt: "'The teacher said \"please sit down.\"' — which particle quotes?",
    correctKana: "せんせいは すわってくださいと いいました",
    distractorsKana: ["せんせいは すわってくださいを いいました", "せんせいは すわってくださいが いいました", "せんせいは すわってくださいに いいました"],
  },
  {
    id: "pt-m21-3", moduleId: "m21", type: "sentenceMcq",
    prompt: "'Three cups of coffee, please.' — which counter?",
    correctKana: "コーヒーを さんばい ください",
    distractorsKana: ["コーヒーを さんこ ください", "コーヒーを みっつ ください", "コーヒーを さんぱい ください"],
  },

  // ── M22: Comparisons ─────────────────────────────────────────────────
  {
    id: "pt-m22-1", moduleId: "m22", type: "sentenceMcq",
    prompt: "'Summer is hotter than spring.' — using のほうが…より:",
    correctKana: "なつのほうが はるより あついです",
    distractorsKana: ["なつより はるのほうが あついです", "なつのほうが はるから あついです", "なつのほうは はるより あついです"],
  },
  {
    id: "pt-m22-2", moduleId: "m22", type: "sentenceMcq",
    prompt: "'Which is the most delicious of these three?' — which is correct?",
    correctKana: "このみっつのなかで どれが いちばん おいしいですか",
    distractorsKana: ["このみっつで なにが いちばん おいしいですか", "このみっつより どれが おいしいですか", "このみっつのなかは どれが いちばん おいしいですか"],
  },
  {
    id: "pt-m22-3", moduleId: "m22", type: "sentenceMcq",
    prompt: "'Tea and coffee, which do you prefer?' — which is correct?",
    correctKana: "おちゃと コーヒーと どちらが すきですか",
    distractorsKana: ["おちゃと コーヒーで どれが すきですか", "おちゃか コーヒーか どちらが すきですか", "おちゃと コーヒーの どちらは すきですか"],
  },

  // ── M23: ましょう, ませんか, じょうず/へた ───────────────────────────
  {
    id: "pt-m23-1", moduleId: "m23", type: "sentenceMcq",
    prompt: "'Let's eat together!' — which is correct?",
    correctKana: "いっしょに たべましょう",
    distractorsKana: ["いっしょに たべませんか", "いっしょに たべてください", "いっしょに たべますか"],
  },
  {
    id: "pt-m23-2", moduleId: "m23", type: "sentenceMcq",
    prompt: "'Shall we go to the movies?' (polite invitation)",
    correctKana: "えいがに いきませんか",
    distractorsKana: ["えいがに いきましょう", "えいがに いきますか", "えいがに いってもいいですか"],
  },
  {
    id: "pt-m23-3", moduleId: "m23", type: "sentenceMcq",
    prompt: "'She is good at cooking.' — which particle goes with じょうず?",
    correctKana: "かのじょは りょうりが じょうずです",
    distractorsKana: ["かのじょは りょうりを じょうずです", "かのじょは りょうりに じょうずです", "かのじょは りょうりは じょうずです"],
  },

  // ── M24: たり...たりする, のがすき ───────────────────────────────────
  {
    id: "pt-m24-1", moduleId: "m24", type: "sentenceMcq",
    prompt: "'On weekends I do things like reading and watching movies.'",
    correctKana: "しゅうまつは ほんを よんだり えいがを みたりします",
    distractorsKana: ["しゅうまつは ほんを よんで えいがを みてします", "しゅうまつは ほんを よみたり えいがを みたりします", "しゅうまつは ほんを よんだり えいがを みたりです"],
  },
  {
    id: "pt-m24-2", moduleId: "m24", type: "sentenceMcq",
    prompt: "'I like swimming.' — which is correct?",
    correctKana: "およぐのが すきです",
    distractorsKana: ["およぐが すきです", "およぐことを すきです", "およいでが すきです"],
  },
  {
    id: "pt-m24-3", moduleId: "m24", type: "sentenceMcq",
    prompt: "'I went 3 times.' — which counter is correct?",
    correctKana: "さんかい いきました",
    distractorsKana: ["みっつ いきました", "さんど いきました", "さんこ いきました"],
  },

  // ── M25: つもり, ことがある, とき ────────────────────────────────────
  {
    id: "pt-m25-1", moduleId: "m25", type: "sentenceMcq",
    prompt: "'I plan to go to Japan next year.' — which is correct?",
    correctKana: "らいねん にほんに いくつもりです",
    distractorsKana: ["らいねん にほんに いくよていです", "らいねん にほんに いきつもりです", "らいねん にほんに いくつもります"],
  },
  {
    id: "pt-m25-2", moduleId: "m25", type: "sentenceMcq",
    prompt: "'I have been to Kyoto before.' — which is correct?",
    correctKana: "きょうとに いったことが あります",
    distractorsKana: ["きょうとに いくことが あります", "きょうとに いったことを あります", "きょうとに いったことが います"],
  },
  {
    id: "pt-m25-3", moduleId: "m25", type: "sentenceMcq",
    prompt: "'When I was a child, I liked fish.' — which is correct?",
    correctKana: "こどものとき さかなが すきでした",
    distractorsKana: ["こどもとき さかなが すきでした", "こどものとき さかなを すきでした", "こどものときに さかなが すきました"],
  },

  // ── M26: んです, すぎる ──────────────────────────────────────────────
  {
    id: "pt-m26-1", moduleId: "m26", type: "sentenceMcq",
    prompt: "'Actually, I'm sick.' (explanatory) — which is correct?",
    correctKana: "びょうきなんです",
    distractorsKana: ["びょうきですんです", "びょうきのんです", "びょうきだんです"],
  },
  {
    id: "pt-m26-2", moduleId: "m26", type: "sentenceMcq",
    prompt: "'I ate too much.' — which is correct?",
    correctKana: "たべすぎました",
    distractorsKana: ["たべおおいました", "たべましたすぎ", "たべるすぎました"],
  },
  {
    id: "pt-m26-3", moduleId: "m26", type: "sentenceMcq",
    prompt: "'This bag is too expensive.' — which is correct?",
    correctKana: "このかばんは たかすぎます",
    distractorsKana: ["このかばんは たかいすぎます", "このかばんは たかすぎです", "このかばんは たかくすぎます"],
  },

  // ── M27: なければならない, ほうがいい, になる ────────────────────────
  {
    id: "pt-m27-1", moduleId: "m27", type: "sentenceMcq",
    prompt: "'I must study.' — which is correct?",
    correctKana: "べんきょうしなければなりません",
    distractorsKana: ["べんきょうしてはいけません", "べんきょうしなくてもいいです", "べんきょうしなければいけます"],
  },
  {
    id: "pt-m27-2", moduleId: "m27", type: "sentenceMcq",
    prompt: "'You should sleep early.' (advice) — which is correct?",
    correctKana: "はやく ねたほうがいいです",
    distractorsKana: ["はやく ねるほうがいいです", "はやく ねてほうがいいです", "はやく ねましょうがいいです"],
  },
  {
    id: "pt-m27-3", moduleId: "m27", type: "sentenceMcq",
    prompt: "'It became warm.' — which is correct?",
    correctKana: "あたたかくなりました",
    distractorsKana: ["あたたかいになりました", "あたたかになりました", "あたたかくなります"],
  },
];
