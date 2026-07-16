import { describe, expect, it } from "vitest";
import { buildListeningOptions, normalizeTypedAnswer } from "./drillUtils";
import type { SpeakingPrompt } from "./ja-speaking-prompts";

const prompts: SpeakingPrompt[] = [
  { id: "a", targetPhrase: "すみません", translation: "Excuse me", mode: "echo", minModule: 3 },
  { id: "b", targetPhrase: "ありがとう", translation: "Thank you", mode: "echo", minModule: 3 },
  { id: "c", targetPhrase: "いくらですか", translation: "How much is it?", mode: "echo", minModule: 5 },
  { id: "d", targetPhrase: "みずを ください", translation: "Water, please", mode: "echo", minModule: 5 },
  { id: "e", targetPhrase: "えきは どこですか", translation: "Where is the station?", mode: "echo", minModule: 6 },
];

describe("buildListeningOptions", () => {
  it("returns 4 unique options including the correct translation", () => {
    const opts = buildListeningOptions(prompts, 0, 4, () => 0.5);
    expect(opts).toHaveLength(4);
    expect(new Set(opts).size).toBe(4);
    expect(opts).toContain("Excuse me");
  });

  it("caps at the pool size when fewer prompts exist", () => {
    expect(buildListeningOptions(prompts.slice(0, 2), 1, 4, () => 0.5)).toHaveLength(2);
  });

  it("returns empty for an out-of-range index", () => {
    expect(buildListeningOptions(prompts, 99)).toEqual([]);
  });
});

describe("normalizeTypedAnswer", () => {
  it("ignores spaces (half and full width) and trailing punctuation", () => {
    expect(normalizeTypedAnswer("みずを ください。")).toBe(normalizeTypedAnswer("みずをください"));
    expect(normalizeTypedAnswer("みずを　ください．")).toBe(normalizeTypedAnswer("みずをください"));
  });

  it("is NFC-normalized and case-insensitive for latin", () => {
    expect(normalizeTypedAnswer("Hola Como")).toBe(normalizeTypedAnswer("hola como"));
  });

  it("does not strip punctuation mid-phrase", () => {
    expect(normalizeTypedAnswer("a.b")).toBe("a.b");
  });
});
