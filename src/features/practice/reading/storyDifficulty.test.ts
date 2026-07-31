import { describe, it, expect } from "vitest";
import type { Story } from "@/features/practice/content";
import { storyDifficulty } from "./storyDifficulty";

function story(module: number, sentenceCount: number): Story {
  return {
    id: `ja-m${module}-x`,
    languageId: "ja",
    module,
    title: "t",
    theme: "th",
    sentences: Array.from({ length: sentenceCount }, () => ({
      text: "テキスト",
      translation: "text",
    })),
  };
}

describe("storyDifficulty", () => {
  it("grades the base tier from the module (≤8 / 9–17 / 18+)", () => {
    // Mid-length so no length refinement kicks in.
    expect(storyDifficulty(story(5, 5), { contentWordCount: 10 }).tier).toBe("beginner");
    expect(storyDifficulty(story(12, 5), { contentWordCount: 10 }).tier).toBe("intermediate");
    expect(storyDifficulty(story(20, 5), { contentWordCount: 10 }).tier).toBe("advanced");
  });

  it("exposes a 1..3 level matching the tier", () => {
    expect(storyDifficulty(story(5, 5), { contentWordCount: 10 }).level).toBe(1);
    expect(storyDifficulty(story(12, 5), { contentWordCount: 10 }).level).toBe(2);
    expect(storyDifficulty(story(20, 5), { contentWordCount: 10 }).level).toBe(3);
  });

  it("bumps up a tier for a long or vocab-dense story", () => {
    expect(storyDifficulty(story(5, 8)).tier).toBe("intermediate"); // 8 sentences
    expect(storyDifficulty(story(5, 4), { contentWordCount: 18 }).tier).toBe("intermediate");
  });

  it("bumps down a tier for a very short, sparse story", () => {
    expect(storyDifficulty(story(12, 2), { contentWordCount: 4 }).tier).toBe("beginner");
  });

  it("never leaves the beginner/advanced bounds", () => {
    // Short beginner can't go below beginner.
    expect(storyDifficulty(story(3, 1), { contentWordCount: 2 }).tier).toBe("beginner");
    // Long advanced can't exceed advanced.
    expect(storyDifficulty(story(25, 10), { contentWordCount: 30 }).tier).toBe("advanced");
  });

  it("defaults contentWordCount to 0 when omitted", () => {
    // module 12 base=intermediate, 1 sentence + 0 words → -1 → beginner.
    expect(storyDifficulty(story(12, 1)).tier).toBe("beginner");
  });
});
