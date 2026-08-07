import { describe, it, expect } from "vitest";
import type { KnownAtom } from "@/features/practice/engine";
import { buildClozeCards, type SentenceSource } from "./readingBuilders";

function noun(id: string, surface: string, reading: string, meaningEn: string): KnownAtom {
  return { id, surface, reading, meaningEn, pos: "noun", tier: "reviewing", due: false, weight: 1 };
}

/** All members of the JA `food` / `place` sibling sets the course could teach. */
const KNOWN: KnownAtom[] = [
  noun("ja:mizu", "みず", "mizu", "water"),
  noun("ja:gohan", "ごはん", "gohan", "rice"),
  noun("ja:ocha", "おちゃ", "ocha", "tea"),
  noun("ja:kyuuri", "きゅうり", "kyuuri", "cucumber"),
  noun("ja:kinoko", "きのこ", "kinoko", "mushroom"),
  noun("ja:eki", "えき", "eki", "station"),
  noun("ja:gakkou", "がっこう", "gakkou", "school"),
  noun("ja:kouen", "こうえん", "kouen", "park"),
];

const SENTENCES: SentenceSource[] = [
  { id: "s:0", text: "みずを のみます。", translation: "I drink water.", reading: "mizu o nomimasu" },
  { id: "s:1", text: "えきへ いきます。", translation: "I go to the station.", reading: "eki e ikimasu" },
  { id: "s:2", text: "がっこうは しずかです。", translation: "The school is quiet.", reading: "gakkou wa shizuka desu" },
];

function optionSurfaces(seed: number): string[][] {
  return buildClozeCards(SENTENCES, KNOWN, seed, 10).map((c) =>
    c.options.map((o) => o.surface),
  );
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
