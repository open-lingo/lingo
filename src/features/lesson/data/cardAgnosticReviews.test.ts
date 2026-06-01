/**
 * Card-agnostic review factories — verifies the three atom-shaped
 * factories added 2026-05-21 produce valid steps for sample atoms.
 *
 * Catalog: docs/card-agnostic-reviews-2026-05-21.md.
 */
import { describe, expect, it } from "vitest";

import {
  audioImageMcq,
  audioMeaningMcq,
  translationMcq,
  type ReviewAtom,
} from "@/features/languages/ja/grammarHelpers";

const POOL: ReviewAtom[] = [
  { kana: "ねこ", meaningEn: "cat",      emoji: "🐱", fromModule: "m1" },
  { kana: "いぬ", meaningEn: "dog",      emoji: "🐕", fromModule: "m1" },
  { kana: "やま", meaningEn: "mountain", emoji: "⛰️", fromModule: "m1" },
  { kana: "かわ", meaningEn: "river",    emoji: "🏞️", fromModule: "m1" },
  { kana: "そら", meaningEn: "sky",      emoji: "☁️", fromModule: "m1" },
  { kana: "つき", meaningEn: "moon",     emoji: "🌙", fromModule: "m1" },
];

describe("audioImageMcq", () => {
  const target: ReviewAtom = POOL[0];

  it("emits a word_image_mcq step with 4 options including the target", () => {
    const step = audioImageMcq("test-audio-image-neko", target, POOL);
    expect(step.type).toBe("word_image_mcq");
    expect(step.options).toHaveLength(4);
    const correct = step.options.find((o) => o.id === "correct");
    expect(correct).toBeDefined();
    expect(correct!.word).toBe("ねこ");
    expect(correct!.emoji).toBe("🐱");
    expect(step.correctOptionId).toBe("correct");
  });

  it("throws when the target has no emoji", () => {
    const noEmoji: ReviewAtom = {
      kana: "よにん",
      meaningEn: "4 people",
      fromModule: "m5",
    };
    expect(() => audioImageMcq("test-noemoji", noEmoji, POOL)).toThrow(
      /no emoji/,
    );
  });

  it("throws when the target is in the image blocklist", () => {
    const blocked: ReviewAtom = {
      kana: "あなた",
      meaningEn: "you",
      emoji: "🫵",
      fromModule: "m4",
    };
    expect(() => audioImageMcq("test-blocked", blocked, POOL)).toThrow(
      /image-blocked/,
    );
  });
});

describe("audioMeaningMcq", () => {
  it("emits a listening_comprehension step with the target meaning as correct", () => {
    const step = audioMeaningMcq("test-audio-meaning-neko", POOL[0], POOL);
    expect(step.type).toBe("listening_comprehension");
    expect(step.audioKey).toBe("ねこ");
    expect(step.options).toHaveLength(4);
    const correct = step.options.find((o) => o.id === "correct");
    expect(correct!.text).toBe("cat");
    expect(step.correctOptionId).toBe("correct");
  });

  it("works without emoji on target or distractors", () => {
    const counterPool: ReviewAtom[] = [
      { kana: "よにん", meaningEn: "4 people",  fromModule: "m5" },
      { kana: "ごにん", meaningEn: "5 people",  fromModule: "m5" },
      { kana: "ひとつ", meaningEn: "1 thing",   fromModule: "m5" },
      { kana: "ふたつ", meaningEn: "2 things",  fromModule: "m5" },
    ];
    const step = audioMeaningMcq("test-no-emoji", counterPool[0], counterPool);
    expect(step.options).toHaveLength(4);
  });
});

describe("translationMcq", () => {
  it("emits a multiple_choice step with English prompt and kana options", () => {
    const step = translationMcq("test-translation-neko", POOL[0], POOL);
    expect(step.type).toBe("multiple_choice");
    expect(step.prompt).toBe("cat");
    expect(step.options).toHaveLength(4);
    const correct = step.options.find((o) => o.id === "correct");
    expect(correct!.text).toBe("ねこ");
    expect(step.optionsHideRomaji).toBe(true);
  });

  it("excludes the target from the distractor draw", () => {
    const step = translationMcq("test-translation-yama", POOL[2], POOL);
    const kanaStrings = step.options.map((o) => o.text);
    const occurrences = kanaStrings.filter((k) => k === "やま").length;
    expect(occurrences).toBe(1);
  });
});

describe("card-agnostic slot rotation", () => {
  it("distributes correct slot across different ids (not all 0)", () => {
    const slots = new Set<number>();
    for (let i = 0; i < 12; i++) {
      const step = translationMcq(`rotation-test-${i}`, POOL[i % POOL.length], POOL);
      const correctIdx = step.options.findIndex((o) => o.id === "correct");
      slots.add(correctIdx);
    }
    // Across 12 distinct ids we should see at least 3 of the 4 slots used.
    expect(slots.size).toBeGreaterThanOrEqual(3);
  });
});
