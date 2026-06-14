import type { LessonStep } from "@/features/lesson/types";
import { cloze, sentenceMcq } from "@/features/languages/ja/grammarHelpers";
import {
  cloze as koCloze,
  sentenceMcq as koSentenceMcq,
} from "@/features/languages/ko/grammarHelpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlacementItemConfig = {
  id: string;
  moduleId: string;
  /** Which language course this item belongs to. Defaults to "ja" for
   *  back-compat with the JA-only initial bank. */
  languageId?: string;
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
  // Dispatch to the target language's grammar helpers so atom resolution,
  // script handling, and romaji/romanization suppression match the course
  // the item belongs to. The `cloze` / `sentenceMcq` factories share a
  // positional/option shape across languages (only the surface strings
  // differ), so the placement config is language-agnostic; the language id
  // just picks which factory materializes the step.
  const lang = config.languageId ?? "ja";
  if (config.type === "cloze") {
    const fn = lang === "ko" ? koCloze : cloze;
    return fn(
      config.id,
      config.before,
      config.after,
      config.correctParticle,
      config.options,
      config.meaningEn,
      config.audioText,
    );
  }
  if (lang === "ko") {
    return koSentenceMcq({
      id: config.id,
      prompt: config.prompt,
      correctHangul: config.correctKana,
      distractorsHangul: config.distractorsKana,
    });
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

export function getItemsForModule(
  moduleId: string,
  languageId: string = "ja",
): PlacementItemConfig[] {
  return PLACEMENT_QUESTION_BANK.filter(
    (i) =>
      i.moduleId === moduleId && (i.languageId ?? "ja") === languageId,
  );
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

  // ═════════════════════════════════════════════════════════════════════
  // KOREAN — KO M1–M27 placement bank (3 items per module).
  //
  // Derived from the authored KO curriculum (features/languages/ko/
  // curriculum/m*.ts) — each item mirrors a grammar point or vocab anchor
  // the corresponding module actually teaches. M1/M2 are Hangul-script
  // reading checks (no grammar exists there yet); M3+ probe the grammar
  // spine. Items reuse the KO `sentenceMcq` / `cloze` factories via the
  // language dispatch in `instantiateItem` (correctKana carries Hangul).
  //
  // NATIVE-REVIEW notes are inline where naturalness should be confirmed by
  // a native speaker (collected in WORKTREE_REPORT.md). Distractors are
  // grammatical-error or wrong-choice foils, never random gibberish.
  // ═════════════════════════════════════════════════════════════════════

  // ── KO M1: Hangul reading (basic syllable blocks) ────────────────────
  {
    id: "pt-ko-m1-1", moduleId: "m1", languageId: "ko", type: "sentenceMcq",
    prompt: "Which block reads 'ga' (ㄱ + ㅏ)?",
    correctKana: "가",
    distractorsKana: ["거", "기", "고"],
  },
  {
    id: "pt-ko-m1-2", moduleId: "m1", languageId: "ko", type: "sentenceMcq",
    prompt: "Which word means 'mother'?",
    correctKana: "어머니",
    distractorsKana: ["우리", "다리", "머리"],
  },
  {
    id: "pt-ko-m1-3", moduleId: "m1", languageId: "ko", type: "sentenceMcq",
    prompt: "Which word means 'meat'?",
    correctKana: "고기",
    distractorsKana: ["아기", "거기", "오이"],
  },

  // ── KO M2: aspirated/tense consonants + y-vowels ─────────────────────
  {
    id: "pt-ko-m2-1", moduleId: "m2", languageId: "ko", type: "sentenceMcq",
    prompt: "Which word means 'coffee' (aspirated ㅋ)?",
    correctKana: "커피",
    distractorsKana: ["고기", "구두", "거기"],
  },
  {
    id: "pt-ko-m2-2", moduleId: "m2", languageId: "ko", type: "sentenceMcq",
    prompt: "Which word means 'rabbit' (tense ㄲ)?",
    correctKana: "토끼",
    distractorsKana: ["치마", "야구", "오빠"],
  },
  {
    id: "pt-ko-m2-3", moduleId: "m2", languageId: "ko", type: "sentenceMcq",
    prompt: "Which uses the y-vowel ㅑ?",
    correctKana: "야구",
    distractorsKana: ["아기", "여기", "우유"],
  },

  // ── KO M3: greetings, 이에요/예요 copula, 저는, names ─────────────────
  {
    id: "pt-ko-m3-1", moduleId: "m3", languageId: "ko", type: "sentenceMcq",
    prompt: "'Hello' (polite, all-purpose) — which is correct?",
    correctKana: "안녕하세요",
    distractorsKana: ["안녕히 가세요", "잘 자요", "감사합니다"],
  },
  {
    id: "pt-ko-m3-2", moduleId: "m3", languageId: "ko", type: "sentenceMcq",
    prompt: "'I am a student.' (학생 ends in a consonant) — which is correct?",
    correctKana: "저는 학생이에요",
    distractorsKana: ["저는 학생예요", "저가 학생이에요", "저는 학생을 이에요"],
  },
  {
    id: "pt-ko-m3-3", moduleId: "m3", languageId: "ko", type: "sentenceMcq",
    prompt: "'I am Min-su.' — which is correct? (민수 ends in a vowel → 예요)",
    correctKana: "저는 민수예요",
    distractorsKana: ["저는 민수이에요", "저는 민수에요", "저는 민수입니다요"],
  },

  // ── KO M4: objects, 의 possessive, 이거/그거/저거 ───────────────────
  {
    id: "pt-ko-m4-1", moduleId: "m4", languageId: "ko", type: "sentenceMcq",
    prompt: "'It's a book.' (책 ends in a consonant) — which is correct?",
    correctKana: "책이에요",
    distractorsKana: ["책예요", "책에요", "책의예요"],
  },
  {
    id: "pt-ko-m4-2", moduleId: "m4", languageId: "ko", type: "sentenceMcq",
    prompt: "'my book' — the natural spoken way is —",
    correctKana: "제 책",
    distractorsKana: ["저의 책", "나 책", "저는 책"],
  },
  {
    id: "pt-ko-m4-3", moduleId: "m4", languageId: "ko", type: "sentenceMcq",
    prompt: "Something is far from both you and the listener. 'It's that one (over there).'",
    correctKana: "저거예요",
    distractorsKana: ["이거예요", "그거예요", "어디예요"],
  },

  // ── KO M5: native numbers, 주세요, counters ──────────────────────────
  {
    id: "pt-ko-m5-1", moduleId: "m5", languageId: "ko", type: "sentenceMcq",
    prompt: "Which is 'three' (native Korean)?",
    correctKana: "셋",
    distractorsKana: ["삼", "다섯", "넷"],
  },
  {
    id: "pt-ko-m5-2", moduleId: "m5", languageId: "ko", type: "sentenceMcq",
    prompt: "'Water, please.' — which is correct?",
    correctKana: "물 주세요",
    distractorsKana: ["물 주에요", "물 주세", "물 있어요 주세요"],
  },
  {
    id: "pt-ko-m5-3", moduleId: "m5", languageId: "ko", type: "sentenceMcq",
    prompt: "'One of these, please.' (the counter for general things) —",
    correctKana: "이거 한 개 주세요",
    distractorsKana: ["이거 하나 개 주세요", "이거 한 명 주세요", "이거 일 개 주세요"],
  },

  // ── KO M6: places, 있어요/없어요, 에 / 에서 ─────────────────────────
  {
    id: "pt-ko-m6-1", moduleId: "m6", languageId: "ko", type: "sentenceMcq",
    prompt: "'There is a book' / 'I have a book' — which is correct?",
    correctKana: "책 있어요",
    distractorsKana: ["책 없어요", "책 이에요", "책 해요"],
  },
  {
    id: "pt-ko-m6-2", moduleId: "m6", languageId: "ko", type: "sentenceMcq",
    prompt: "'I'm at home.' (location of existence → 에) —",
    correctKana: "집에 있어요",
    distractorsKana: ["집에서 있어요", "집을 있어요", "집이 있어요"],
  },
  {
    id: "pt-ko-m6-3", moduleId: "m6", languageId: "ko", type: "sentenceMcq",
    prompt: "'I eat at home.' (location of an action → 에서) —",
    correctKana: "집에서 먹어요",
    distractorsKana: ["집에 먹어요", "집을 먹어요", "집이 먹어요"],
  },

  // ── KO M7: action verbs, 해요 present, 을/를 object ──────────────────
  {
    id: "pt-ko-m7-1", moduleId: "m7", languageId: "ko", type: "sentenceMcq",
    prompt: "Make 먹다 polite ('I eat'):",
    correctKana: "먹어요",
    distractorsKana: ["먹아요", "먹해요", "먹이요"],
  },
  {
    id: "pt-ko-m7-2", moduleId: "m7", languageId: "ko", type: "sentenceMcq",
    prompt: "'I study.' (공부 + 하다) — which is correct?",
    correctKana: "공부해요",
    distractorsKana: ["공부하요", "공부어요", "공부이에요"],
  },
  {
    id: "pt-ko-m7-3", moduleId: "m7", languageId: "ko", type: "sentenceMcq",
    prompt: "'I eat rice.' (밥 ends in a consonant → 을) —",
    correctKana: "밥을 먹어요",
    distractorsKana: ["밥를 먹어요", "밥이 먹어요", "밥에 먹어요"],
  },

  // ── KO M8: adjectives as verbs, the ㅡ-drop ──────────────────────────
  {
    id: "pt-ko-m8-1", moduleId: "m8", languageId: "ko", type: "sentenceMcq",
    prompt: "Make 좋다 polite ('it's good'):",
    correctKana: "좋아요",
    distractorsKana: ["좋어요", "좋해요", "좋이에요"],
  },
  {
    id: "pt-ko-m8-2", moduleId: "m8", languageId: "ko", type: "sentenceMcq",
    prompt: "Make 크다 polite ('it's big' — ㅡ drops):",
    correctKana: "커요",
    distractorsKana: ["크어요", "크아요", "크요"],
  },
  {
    id: "pt-ko-m8-3", moduleId: "m8", languageId: "ko", type: "sentenceMcq",
    prompt: "'The bag is good.' (가방 ends in a consonant → 이) —",
    correctKana: "가방이 좋아요",
    distractorsKana: ["가방가 좋아요", "가방을 좋아요", "가방이 좋어요"],
  },

  // ── KO M9: 하고 (and/with), 와/과, 도 ────────────────────────────────
  {
    id: "pt-ko-m9-1", moduleId: "m9", languageId: "ko", type: "sentenceMcq",
    prompt: "'coffee and bread' (casual spoken) —",
    correctKana: "커피하고 빵",
    distractorsKana: ["커피과 빵", "커피도 빵", "커피를 빵"],
  },
  {
    id: "pt-ko-m9-2", moduleId: "m9", languageId: "ko", type: "sentenceMcq",
    prompt: "'an apple and milk' (formal — 사과 ends in a vowel → 와) —",
    correctKana: "사과와 우유",
    distractorsKana: ["사과과 우유", "사과하고와 우유", "사과랑과 우유"],
  },
  {
    id: "pt-ko-m9-3", moduleId: "m9", languageId: "ko", type: "sentenceMcq",
    prompt: "'I drink coffee too.' — which is correct?",
    correctKana: "저도 커피를 마셔요",
    distractorsKana: ["저는 커피도를 마셔요", "저도 커피를 마셔도요", "저를 커피도 마셔요"],
  },

  // ── KO M10: time adverbs, past tense ─────────────────────────────────
  {
    id: "pt-ko-m10-1", moduleId: "m10", languageId: "ko", type: "sentenceMcq",
    prompt: "Which means 'yesterday'?",
    correctKana: "어제",
    distractorsKana: ["오늘", "내일", "지금"],
  },
  {
    id: "pt-ko-m10-2", moduleId: "m10", languageId: "ko", type: "sentenceMcq",
    prompt: "Put 먹다 in the past ('I ate'):",
    correctKana: "먹었어요",
    distractorsKana: ["먹았어요", "먹어어요", "먹겠어요"],
  },
  {
    id: "pt-ko-m10-3", moduleId: "m10", languageId: "ko", type: "sentenceMcq",
    prompt: "'I went.' (past of 가다, ㅏ+았 blends to 갔) —",
    correctKana: "갔어요",
    distractorsKana: ["가았어요", "가었어요", "가겠어요"],
  },

  // ── KO M11: 안 (negation), 못 (can't) ───────────────────────────────
  {
    id: "pt-ko-m11-1", moduleId: "m11", languageId: "ko", type: "sentenceMcq",
    prompt: "'I don't go.' — which is correct?",
    correctKana: "안 가요",
    distractorsKana: ["가 안요", "가요 안", "못 가요"],
  },
  {
    id: "pt-ko-m11-2", moduleId: "m11", languageId: "ko", type: "sentenceMcq",
    prompt: "'I don't study.' (안 + 하다 verb splits) —",
    correctKana: "공부 안 해요",
    distractorsKana: ["안 공부해요", "공부해 안요", "공부 못 해요"],
  },
  {
    id: "pt-ko-m11-3", moduleId: "m11", languageId: "ko", type: "sentenceMcq",
    prompt: "You're too full. 'I can't eat (any more).' —",
    correctKana: "못 먹어요",
    distractorsKana: ["안 먹어요", "먹 못어요", "먹어요 못"],
  },

  // ── KO M12: hours (시), 분/반, asking the time ──────────────────────
  {
    id: "pt-ko-m12-1", moduleId: "m12", languageId: "ko", type: "sentenceMcq",
    prompt: "'2 o'clock' (native number + 시) —",
    correctKana: "두 시",
    distractorsKana: ["이 시", "둘 시", "두 시간"],
  },
  {
    id: "pt-ko-m12-2", moduleId: "m12", languageId: "ko", type: "sentenceMcq",
    prompt: "'3:30' (using 'half') —",
    correctKana: "세 시 반",
    distractorsKana: ["삼 시 반", "세 시 삼십", "세 반 시"],
  },
  {
    id: "pt-ko-m12-3", moduleId: "m12", languageId: "ko", type: "sentenceMcq",
    prompt: "'What time is it now?' —",
    correctKana: "지금 몇 시예요?",
    distractorsKana: ["지금 몇 시이에요?", "지금 얼마 시예요?", "지금 몇 시간예요?"],
  },

  // ── KO M13: months, 부터/까지, 그래서 ───────────────────────────────
  {
    id: "pt-ko-m13-1", moduleId: "m13", languageId: "ko", type: "sentenceMcq",
    prompt: "Which is 'June'? (irregular form)",
    correctKana: "유월",
    distractorsKana: ["육월", "여섯월", "유개월"],
  },
  {
    id: "pt-ko-m13-2", moduleId: "m13", languageId: "ko", type: "sentenceMcq",
    prompt: "'From Monday to Friday' —",
    correctKana: "월요일부터 금요일까지",
    distractorsKana: ["월요일까지 금요일부터", "월요일에서 금요일까지", "월요일부터 금요일에"],
  },
  {
    id: "pt-ko-m13-3", moduleId: "m13", languageId: "ko", type: "sentenceMcq",
    prompt: "'It's raining. So I'm staying home.' (so / therefore) —",
    correctKana: "비가 와요. 그래서 집에 있어요",
    distractorsKana: ["비가 와요. 그리고 집에 있어요", "비가 와요. 그런데 집에 있어요", "비가 와요. 하지만 집에 있어요"],
  },

  // ── KO M14: 고 (and-then), 아서/어서, big numbers, 원 ────────────────
  {
    id: "pt-ko-m14-1", moduleId: "m14", languageId: "ko", type: "sentenceMcq",
    prompt: "'I eat and (then) sleep.' (sequential 고) —",
    correctKana: "밥을 먹고 자요",
    distractorsKana: ["밥을 먹어서 자요", "밥을 먹지 자요", "밥을 먹으면 자요"],
  },
  {
    id: "pt-ko-m14-2", moduleId: "m14", languageId: "ko", type: "sentenceMcq",
    prompt: "'Because it's raining, I'm staying home.' (reason 아서/어서) —",
    correctKana: "비가 와서 집에 있어요",
    distractorsKana: ["비가 오고 집에 있어요", "비가 와도 집에 있어요", "비가 와서요 집에 있어요"],
  },
  {
    id: "pt-ko-m14-3", moduleId: "m14", languageId: "ko", type: "sentenceMcq",
    prompt: "'10,000 won' —",
    correctKana: "만 원",
    distractorsKana: ["십천 원", "만 엔", "일만 원짜리"],
  },

  // ── KO M15: 고 있어요, 아도/어도 돼요 (permission), 지만 ─────────────
  {
    id: "pt-ko-m15-1", moduleId: "m15", languageId: "ko", type: "sentenceMcq",
    prompt: "'I'm eating (right now).' (progressive) —",
    correctKana: "밥을 먹고 있어요",
    distractorsKana: ["밥을 먹어 있어요", "밥을 먹는 있어요", "밥을 먹고 이에요"],
  },
  {
    id: "pt-ko-m15-2", moduleId: "m15", languageId: "ko", type: "sentenceMcq",
    prompt: "'May I go?' (permission) —",
    correctKana: "가도 돼요?",
    distractorsKana: ["가서 돼요?", "가고 돼요?", "가면 돼요 안?"],
  },
  {
    id: "pt-ko-m15-3", moduleId: "m15", languageId: "ko", type: "sentenceMcq",
    prompt: "'It's good, but it's expensive.' (지만 = but) —",
    correctKana: "좋지만 비싸요",
    distractorsKana: ["좋고 비싸요", "좋아서 비싸요", "좋지만요 비싸요"],
  },

  // ── KO M16: (으)면 안 돼요, 지 마세요, 고 나서, 좋아하다 ─────────────
  {
    id: "pt-ko-m16-1", moduleId: "m16", languageId: "ko", type: "sentenceMcq",
    prompt: "'You must not go.' (prohibition) —",
    correctKana: "가면 안 돼요",
    distractorsKana: ["가도 안 돼요", "가지 안 돼요", "가면 안 해요"],
  },
  {
    id: "pt-ko-m16-2", moduleId: "m16", languageId: "ko", type: "sentenceMcq",
    prompt: "'Please don't go.' (negative request) —",
    correctKana: "가지 마세요",
    distractorsKana: ["가지 않으세요", "가면 마세요", "안 가세요 마"],
  },
  {
    id: "pt-ko-m16-3", moduleId: "m16", languageId: "ko", type: "sentenceMcq",
    prompt: "'I like coffee.' (좋아하다) —",
    correctKana: "커피를 좋아해요",
    distractorsKana: ["커피가 좋아해요", "커피를 좋아요", "커피를 좋아하요"],
  },

  // ── KO M17: transport, (으)로 (means), 타다, directions ─────────────
  {
    id: "pt-ko-m17-1", moduleId: "m17", languageId: "ko", type: "sentenceMcq",
    prompt: "Which means 'taxi'?",
    correctKana: "택시",
    distractorsKana: ["버스", "지하철", "기차"],
  },
  {
    id: "pt-ko-m17-2", moduleId: "m17", languageId: "ko", type: "sentenceMcq",
    prompt: "'I go by bus.' (버스 ends in a consonant → 으로) —",
    correctKana: "버스로 가요",
    distractorsKana: ["버스으로 가요", "버스에 가요", "버스를 가요"],
  },
  {
    id: "pt-ko-m17-3", moduleId: "m17", languageId: "ko", type: "sentenceMcq",
    prompt: "'I take the bus.' (ride a vehicle → 를 타다) —",
    correctKana: "버스를 타요",
    distractorsKana: ["버스에 타요", "버스로 타요", "버스가 타요"],
  },

  // ── KO M18: weather, hot/cold (ㅂ-irregular), (으)ㄹ 거예요 future ───
  {
    id: "pt-ko-m18-1", moduleId: "m18", languageId: "ko", type: "sentenceMcq",
    prompt: "'It's raining.' —",
    correctKana: "비가 와요",
    distractorsKana: ["비가 가요", "비를 와요", "비가 있어요"],
  },
  {
    id: "pt-ko-m18-2", moduleId: "m18", languageId: "ko", type: "sentenceMcq",
    prompt: "'It's hot today.' (덥다, ㅂ-irregular) —",
    correctKana: "오늘 더워요",
    distractorsKana: ["오늘 덥어요", "오늘 더어요", "오늘 덥아요"],
  },
  {
    id: "pt-ko-m18-3", moduleId: "m18", languageId: "ko", type: "sentenceMcq",
    prompt: "'I will go.' (future / intention) —",
    correctKana: "갈 거예요",
    distractorsKana: ["가 거예요", "갈 거에요", "가르 거예요"],
  },

  // ── KO M19: family, 우리, counting people (명) ──────────────────────
  {
    id: "pt-ko-m19-1", moduleId: "m19", languageId: "ko", type: "sentenceMcq",
    prompt: "Which means 'mom' (casual)?",
    correctKana: "엄마",
    distractorsKana: ["아빠", "누나", "동생"],
  },
  {
    id: "pt-ko-m19-2", moduleId: "m19", languageId: "ko", type: "sentenceMcq",
    prompt: "A MALE speaker's 'older sister' is —",
    correctKana: "누나",
    distractorsKana: ["언니", "오빠", "형"],
  },
  {
    id: "pt-ko-m19-3", moduleId: "m19", languageId: "ko", type: "sentenceMcq",
    prompt: "'two people' (native number + 명) —",
    correctKana: "두 명",
    distractorsKana: ["이 명", "둘 명", "두 개"],
  },

  // ── KO M20: body parts, 아프다 (ㅡ-irregular) ───────────────────────
  {
    id: "pt-ko-m20-1", moduleId: "m20", languageId: "ko", type: "sentenceMcq",
    prompt: "Which means 'head'?",
    correctKana: "머리",
    distractorsKana: ["코", "손", "배"],
  },
  {
    id: "pt-ko-m20-2", moduleId: "m20", languageId: "ko", type: "sentenceMcq",
    prompt: "Which means 'stomach / belly'?",
    correctKana: "배",
    distractorsKana: ["손", "다리", "눈"],
  },
  {
    id: "pt-ko-m20-3", moduleId: "m20", languageId: "ko", type: "sentenceMcq",
    prompt: "'My head hurts.' (아프다 → 아파요) —",
    correctKana: "머리가 아파요",
    distractorsKana: ["머리가 아프어요", "머리를 아파요", "머리가 아퍼요"],
  },

  // ── KO M21: food, dishes, 하고/(이)랑 ───────────────────────────────
  {
    id: "pt-ko-m21-1", moduleId: "m21", languageId: "ko", type: "sentenceMcq",
    prompt: "Which means 'meat'?",
    correctKana: "고기",
    distractorsKana: ["과일", "야채", "생선"],
  },
  {
    id: "pt-ko-m21-2", moduleId: "m21", languageId: "ko", type: "sentenceMcq",
    prompt: "Which is 'bibimbap'?",
    correctKana: "비빔밥",
    distractorsKana: ["라면", "김치", "불고기"],
  },
  {
    id: "pt-ko-m21-3", moduleId: "m21", languageId: "ko", type: "sentenceMcq",
    prompt: "'I go with a friend.' (하고 = with) —",
    correctKana: "친구하고 가요",
    distractorsKana: ["친구하고 와요 가요", "친구를 가요", "친구도하고 가요"],
  },

  // ── KO M22: 보다 (than), 더/덜, 제일/가장 (most) ───────────────────
  {
    id: "pt-ko-m22-1", moduleId: "m22", languageId: "ko", type: "sentenceMcq",
    prompt: "'Coffee is more expensive than tea.' (보다 = than) —",
    correctKana: "커피가 차보다 비싸요",
    distractorsKana: ["커피가 차에서 비싸요", "커피보다 차가 비싸요", "커피가 차까지 비싸요"],
  },
  {
    id: "pt-ko-m22-2", moduleId: "m22", languageId: "ko", type: "sentenceMcq",
    prompt: "'This is the most expensive.' (제일 = most) —",
    correctKana: "이게 제일 비싸요",
    distractorsKana: ["이게 제일 비싸어요", "이거 제일 비싸요 보다", "이게 더 제일 비싸요"],
  },
  {
    id: "pt-ko-m22-3", moduleId: "m22", languageId: "ko", type: "sentenceMcq",
    prompt: "'More, please.' (더 = more) —",
    correctKana: "더 주세요",
    distractorsKana: ["덜 주세요", "제일 주세요", "더 주에요"],
  },

  // ── KO M23: activities, (으)ㄹ 수 있다/없다, 잘하다 ─────────────────
  {
    id: "pt-ko-m23-1", moduleId: "m23", languageId: "ko", type: "sentenceMcq",
    prompt: "'I can swim.' (ability) —",
    correctKana: "수영할 수 있어요",
    distractorsKana: ["수영할 수 없어요", "수영하 수 있어요", "수영할 줄 있어요"],
  },
  {
    id: "pt-ko-m23-2", moduleId: "m23", languageId: "ko", type: "sentenceMcq",
    prompt: "'I can't drive.' —",
    correctKana: "운전할 수 없어요",
    distractorsKana: ["운전할 수 있어요", "운전 못 있어요", "운전할 수 안 돼요"],
  },
  {
    id: "pt-ko-m23-3", moduleId: "m23", languageId: "ko", type: "sentenceMcq",
    prompt: "'I'm good at swimming.' (잘하다) —",
    correctKana: "수영을 잘해요",
    distractorsKana: ["수영을 잘 있어요", "수영이 잘해요", "수영을 잘하요"],
  },

  // ── KO M24: hobbies, (으)ㄹ 줄 알다/모르다, 거나 (or) ───────────────
  {
    id: "pt-ko-m24-1", moduleId: "m24", languageId: "ko", type: "sentenceMcq",
    prompt: "'I know how to swim.' (skill — 줄 알다) —",
    correctKana: "수영할 줄 알아요",
    distractorsKana: ["수영할 수 알아요", "수영할 줄 있어요", "수영하 줄 알아요"],
  },
  {
    id: "pt-ko-m24-2", moduleId: "m24", languageId: "ko", type: "sentenceMcq",
    prompt: "'I don't know how to drive.' —",
    correctKana: "운전할 줄 몰라요",
    distractorsKana: ["운전할 줄 알아요", "운전할 수 몰라요", "운전할 줄 모라요"],
  },
  {
    id: "pt-ko-m24-3", moduleId: "m24", languageId: "ko", type: "sentenceMcq",
    prompt: "'I read books or listen to music.' (거나 = or) —",
    correctKana: "책을 읽거나 음악을 들어요",
    distractorsKana: ["책을 읽고나 음악을 들어요", "책을 읽거나요 음악을 들어요", "책을 읽든지 음악을 듣어요"],
  },

  // ── KO M25: travel/event vocab, (으)려고 하다, (으)러 가다 ─────────
  {
    id: "pt-ko-m25-1", moduleId: "m25", languageId: "ko", type: "sentenceMcq",
    prompt: "Which means 'travel / trip'?",
    correctKana: "여행",
    distractorsKana: ["출발", "도착", "축제"],
  },
  {
    id: "pt-ko-m25-2", moduleId: "m25", languageId: "ko", type: "sentenceMcq",
    prompt: "'I intend to go to Japan.' (려고 하다) —",
    correctKana: "일본에 가려고 해요",
    distractorsKana: ["일본에 가려고 있어요", "일본에 가러 해요", "일본에 갈려고 해요"],
  },
  {
    id: "pt-ko-m25-3", moduleId: "m25", languageId: "ko", type: "sentenceMcq",
    prompt: "'I plan to travel next year.' —",
    correctKana: "내년에 여행하려고 해요",
    distractorsKana: ["내년에 여행하러 해요", "내년에 여행하려고 있어요", "내년에 여행할려고 해요"],
  },

  // ── KO M26: feeling verbs, 그래서/그리고, 거든요, 너무 ──────────────
  {
    id: "pt-ko-m26-1", moduleId: "m26", languageId: "ko", type: "sentenceMcq",
    prompt: "'I'm tired.' —",
    correctKana: "피곤해요",
    distractorsKana: ["피곤이에요", "피곤하요", "피곤어요"],
  },
  {
    id: "pt-ko-m26-2", moduleId: "m26", languageId: "ko", type: "sentenceMcq",
    prompt: "'I went to the hospital. And I took medicine.' (그리고 = and) —",
    correctKana: "병원에 갔어요. 그리고 약을 먹었어요",
    distractorsKana: ["병원에 갔어요. 그래서 약을 먹었어요", "병원에 갔어요. 그런데 약을 먹었어요", "병원에 갔어요. 그리고요 약을 먹었어요"],
  },
  {
    id: "pt-ko-m26-3", moduleId: "m26", languageId: "ko", type: "sentenceMcq",
    prompt: "'(It's because) I'm tired, you see.' (거든요) —",
    correctKana: "피곤하거든요",
    distractorsKana: ["피곤거든요", "피곤하거든이에요", "피곤하거던요"],
  },

  // ── KO M27: modal vocab, 아/어야 되다 (must) ───────────────────────
  {
    id: "pt-ko-m27-1", moduleId: "m27", languageId: "ko", type: "sentenceMcq",
    prompt: "Which means 'exam'?",
    correctKana: "시험",
    distractorsKana: ["연습", "건강", "약속"],
  },
  {
    id: "pt-ko-m27-2", moduleId: "m27", languageId: "ko", type: "sentenceMcq",
    prompt: "'I have to go now.' (아/어야 되다 = must) —",
    correctKana: "지금 가야 돼요",
    distractorsKana: ["지금 가야 해요 돼", "지금 가아야 돼요", "지금 가야 있어요"],
  },
  {
    id: "pt-ko-m27-3", moduleId: "m27", languageId: "ko", type: "sentenceMcq",
    prompt: "'I have to take medicine.' —",
    correctKana: "약을 먹어야 돼요",
    distractorsKana: ["약을 먹어야 해요 돼", "약을 먹어야 있어요", "약을 먹아야 돼요"],
  },
];
