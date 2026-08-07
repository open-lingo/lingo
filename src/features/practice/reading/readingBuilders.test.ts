import { describe, it, expect } from "vitest";
import type { KnownAtom } from "@/features/practice/engine";
import { siblingsOf } from "@/features/languages/ja/jaSiblingSets";
import { buildClozeCards, CLOZE_DISTRACTORS, type SentenceSource } from "./readingBuilders";

function atom(
  id: string,
  surface: string,
  reading: string,
  meaningEn: string,
  pos: KnownAtom["pos"] = "noun",
): KnownAtom {
  return { id, surface, reading, meaningEn, pos, tier: "reviewing", due: false, weight: 1 };
}

/** Members of the JA `food` / `place` sibling sets, as taught vocabulary. */
const KNOWN: KnownAtom[] = [
  atom("ja:mizu", "みず", "mizu", "water"),
  atom("ja:gohan", "ごはん", "gohan", "rice"),
  atom("ja:ocha", "おちゃ", "ocha", "tea"),
  atom("ja:kyuuri", "きゅうり", "kyuuri", "cucumber"),
  atom("ja:kinoko", "きのこ", "kinoko", "mushroom"),
  atom("ja:eki", "えき", "eki", "station"),
  atom("ja:gakkou", "がっこう", "gakkou", "school"),
  atom("ja:kouen", "こうえん", "kouen", "park"),
];

const SENTENCES: SentenceSource[] = [
  { id: "s:0", text: "みずを のみます。", translation: "I drink water.", reading: "mizu o nomimasu" },
  { id: "s:1", text: "えきへ いきます。", translation: "I go to the station.", reading: "eki e ikimasu" },
  { id: "s:2", text: "がっこうは しずかです。", translation: "The school is quiet.", reading: "gakkou wa shizuka desu" },
];

function build(seed: number, sentences = SENTENCES, known = KNOWN, lang = "ja") {
  return buildClozeCards(sentences, known, seed, 10, lang);
}

function optionSurfaces(seed: number): string[][] {
  return build(seed).map((c) => c.options.map((o) => o.surface));
}

describe("buildClozeCards — session seeding", () => {
  it("is stable for a given seed (options must not reshuffle on re-render)", () => {
    expect(optionSurfaces(1234)).toEqual(optionSurfaces(1234));
  });

  it("varies option order across sessions so the answer's slot isn't memorisable", () => {
    const base = JSON.stringify(optionSurfaces(1));
    const varied = [2, 3, 4, 5, 6, 7, 8, 9, 10].some((s) => JSON.stringify(optionSurfaces(s)) !== base);
    expect(varied).toBe(true);
  });
});

describe("buildClozeCards — competitive distractors", () => {
  it("offers exactly the answer plus two options", () => {
    const cards = build(7);
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.options).toHaveLength(CLOZE_DISTRACTORS + 1);
      expect(card.options.filter((o) => o.isAnswer)).toHaveLength(1);
    }
  });

  it("draws every distractor from the answer's sibling set", () => {
    for (const card of build(11)) {
      const siblings = siblingsOf(card.answer.surface);
      for (const option of card.options) {
        if (option.isAnswer) continue;
        expect(siblings).toContain(option.surface);
      }
    }
  });

  it("skips a sentence whose answer has fewer than two known siblings", () => {
    // こうえん's only taught siblings here are えき and がっこう; drop both and
    // the sentence can no longer be made competitive.
    const known = KNOWN.filter((a) => a.surface !== "えき" && a.surface !== "がっこう");
    const sentences = [
      { id: "p:0", text: "こうえんへ いきます。", translation: "I go to the park." },
    ];
    expect(build(3, sentences, known)).toHaveLength(0);
  });

  it("never offers a word that already appears in the stem", () => {
    // みず is a food sibling of the answer きゅうり AND sits in the sentence —
    // offering it lets the learner rule it out on repetition, and it may also fit.
    const sentences = [
      { id: "q:0", text: "きゅうりと みずを かいます。", translation: "I buy a cucumber and water." },
    ];
    const cards = build(5, sentences);
    expect(cards).toHaveLength(1);
    expect(cards[0].answer.surface).toBe("きゅうり");
    expect(cards[0].options.map((o) => o.surface)).not.toContain("みず");
  });

  it("never offers a mere inflection of the answer", () => {
    const verbs = [
      atom("ja:taberu", "たべる", "taberu", "to eat", "verb"),
      atom("ja:tabeta", "たべた", "tabeta", "ate", "verb"),
      atom("ja:miru", "みる", "miru", "to watch", "verb"),
      atom("ja:nomu", "のむ", "nomu", "to drink", "verb"),
    ];
    const sentences = [{ id: "v:0", text: "ごはんを たべる。", translation: "I eat rice." }];
    for (const card of build(9, sentences, verbs)) {
      expect(card.answer.surface).toBe("たべる");
      expect(card.options.map((o) => o.surface)).not.toContain("たべた");
    }
  });

  it("yields nothing for a language with no sibling sets rather than random options", () => {
    const known = [
      atom("ko:keopi", "커피", "keopi", "coffee"),
      atom("ko:uyu", "우유", "uyu", "milk"),
      atom("ko:juseu", "주스", "juseu", "juice"),
    ];
    const sentences = [{ id: "k:0", text: "커피를 마셔요.", translation: "I drink coffee." }];
    expect(build(1, sentences, known, "ko")).toHaveLength(0);
  });
});
