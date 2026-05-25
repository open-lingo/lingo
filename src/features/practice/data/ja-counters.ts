export type CounterReading = {
  number: number;
  reading: string;
  irregular: boolean;
};

export type CounterDef = {
  id: string;
  kanji: string;
  meaning: string;
  readings: CounterReading[];
  introducedAtModule: number;
  examples: string[];
};

export const COUNTER_DEFS: CounterDef[] = [
  {
    id: "nin",
    kanji: "人",
    meaning: "people",
    introducedAtModule: 5,
    examples: ["3 people", "How many people?"],
    readings: [
      { number: 1, reading: "ひとり", irregular: true },
      { number: 2, reading: "ふたり", irregular: true },
      { number: 3, reading: "さんにん", irregular: false },
      { number: 4, reading: "よにん", irregular: true },
      { number: 5, reading: "ごにん", irregular: false },
      { number: 6, reading: "ろくにん", irregular: false },
      { number: 7, reading: "ななにん", irregular: false },
      { number: 8, reading: "はちにん", irregular: false },
      { number: 9, reading: "きゅうにん", irregular: false },
      { number: 10, reading: "じゅうにん", irregular: false },
    ],
  },
  {
    id: "tsu",
    kanji: "つ",
    meaning: "general objects",
    introducedAtModule: 5,
    examples: ["3 items", "How many?"],
    readings: [
      { number: 1, reading: "ひとつ", irregular: true },
      { number: 2, reading: "ふたつ", irregular: true },
      { number: 3, reading: "みっつ", irregular: true },
      { number: 4, reading: "よっつ", irregular: true },
      { number: 5, reading: "いつつ", irregular: true },
      { number: 6, reading: "むっつ", irregular: true },
      { number: 7, reading: "ななつ", irregular: true },
      { number: 8, reading: "やっつ", irregular: true },
      { number: 9, reading: "ここのつ", irregular: true },
      { number: 10, reading: "とお", irregular: true },
    ],
  },
  {
    id: "hon",
    kanji: "本",
    meaning: "cylindrical objects",
    introducedAtModule: 7,
    examples: ["3 bottles", "2 pencils"],
    readings: [
      { number: 1, reading: "いっぽん", irregular: true },
      { number: 2, reading: "にほん", irregular: false },
      { number: 3, reading: "さんぼん", irregular: true },
      { number: 4, reading: "よんほん", irregular: false },
      { number: 5, reading: "ごほん", irregular: false },
      { number: 6, reading: "ろっぽん", irregular: true },
      { number: 7, reading: "ななほん", irregular: false },
      { number: 8, reading: "はっぽん", irregular: true },
      { number: 9, reading: "きゅうほん", irregular: false },
      { number: 10, reading: "じゅっぽん", irregular: true },
    ],
  },
  {
    id: "mai",
    kanji: "枚",
    meaning: "flat objects",
    introducedAtModule: 7,
    examples: ["3 sheets of paper", "2 tickets"],
    readings: [
      { number: 1, reading: "いちまい", irregular: false },
      { number: 2, reading: "にまい", irregular: false },
      { number: 3, reading: "さんまい", irregular: false },
      { number: 4, reading: "よんまい", irregular: false },
      { number: 5, reading: "ごまい", irregular: false },
      { number: 6, reading: "ろくまい", irregular: false },
      { number: 7, reading: "ななまい", irregular: false },
      { number: 8, reading: "はちまい", irregular: false },
      { number: 9, reading: "きゅうまい", irregular: false },
      { number: 10, reading: "じゅうまい", irregular: false },
    ],
  },
  {
    id: "hiki",
    kanji: "匹",
    meaning: "small animals",
    introducedAtModule: 7,
    examples: ["3 cats", "2 dogs"],
    readings: [
      { number: 1, reading: "いっぴき", irregular: true },
      { number: 2, reading: "にひき", irregular: false },
      { number: 3, reading: "さんびき", irregular: true },
      { number: 4, reading: "よんひき", irregular: false },
      { number: 5, reading: "ごひき", irregular: false },
      { number: 6, reading: "ろっぴき", irregular: true },
      { number: 7, reading: "ななひき", irregular: false },
      { number: 8, reading: "はっぴき", irregular: true },
      { number: 9, reading: "きゅうひき", irregular: false },
      { number: 10, reading: "じゅっぴき", irregular: true },
    ],
  },
  {
    id: "ko",
    kanji: "個",
    meaning: "small round objects",
    introducedAtModule: 7,
    examples: ["3 apples", "2 eggs"],
    readings: [
      { number: 1, reading: "いっこ", irregular: true },
      { number: 2, reading: "にこ", irregular: false },
      { number: 3, reading: "さんこ", irregular: false },
      { number: 4, reading: "よんこ", irregular: false },
      { number: 5, reading: "ごこ", irregular: false },
      { number: 6, reading: "ろっこ", irregular: true },
      { number: 7, reading: "ななこ", irregular: false },
      { number: 8, reading: "はっこ", irregular: true },
      { number: 9, reading: "きゅうこ", irregular: false },
      { number: 10, reading: "じゅっこ", irregular: true },
    ],
  },
  {
    id: "hai",
    kanji: "杯",
    meaning: "cups / glasses",
    introducedAtModule: 7,
    examples: ["3 cups of tea", "2 glasses of beer"],
    readings: [
      { number: 1, reading: "いっぱい", irregular: true },
      { number: 2, reading: "にはい", irregular: false },
      { number: 3, reading: "さんばい", irregular: true },
      { number: 4, reading: "よんはい", irregular: false },
      { number: 5, reading: "ごはい", irregular: false },
      { number: 6, reading: "ろっぱい", irregular: true },
      { number: 7, reading: "ななはい", irregular: false },
      { number: 8, reading: "はっぱい", irregular: true },
      { number: 9, reading: "きゅうはい", irregular: false },
      { number: 10, reading: "じゅっぱい", irregular: true },
    ],
  },
];

export function getCountersUpToModule(module: number): CounterDef[] {
  return COUNTER_DEFS.filter((c) => c.introducedAtModule <= module);
}
