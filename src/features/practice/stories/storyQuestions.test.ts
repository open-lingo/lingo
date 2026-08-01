import { describe, it, expect } from "vitest";
import type { Story } from "@/features/practice/content";
import type { KnownAtom } from "@/features/practice/engine";
import { buildQuestions } from "./storyQuestions";

const known: KnownAtom[] = [
  { id: "ja:sushi", surface: "すし", reading: "sushi", meaningEn: "sushi", pos: "noun", tier: "mastered", due: false, weight: 1 },
  { id: "ja:ocha", surface: "おちゃ", reading: "ocha", meaningEn: "green tea", pos: "noun", tier: "mastered", due: false, weight: 1 },
  { id: "ja:hon", surface: "ほん", reading: "hon", meaningEn: "book", pos: "noun", tier: "mastered", due: false, weight: 1 },
  { id: "ja:gohan", surface: "ごはん", reading: "gohan", meaningEn: "meal", pos: "noun", tier: "mastered", due: false, weight: 1 },
];

const story: Story = {
  id: "ja-test",
  languageId: "ja",
  module: 7,
  level: 1,
  title: "Test",
  theme: "A test.",
  questions: [
    { id: "gist", kind: "gist", prompt: "この はなしは なんですか？", options: ["ごはんの はなし", "くるまの はなし"], answer: "ごはんの はなし" },
  ],
  sentences: [
    { text: "すしを たべます。", translation: "I eat sushi." },
    { text: "おちゃを のみます。", translation: "I drink green tea." },
    { text: "ほんを よみます。", translation: "I read a book." },
    { text: "ごはんを たべます。", translation: "I eat a meal." },
  ],
};

describe("buildQuestions", () => {
  it("puts the authored gist question first", () => {
    const qs = buildQuestions(story, known, 1);
    expect(qs[0].kind).toBe("gist");
    expect(qs[0].prompt).toBe("この はなしは なんですか？");
  });

  it("generates detail questions in the target language", () => {
    const qs = buildQuestions(story, known, 1);
    const detail = qs.filter((q) => q.kind === "detail");
    expect(detail.length).toBeGreaterThan(0);
    for (const q of detail) {
      // Options are target-language sentences from/near the story, never English.
      for (const opt of q.options) expect(opt).not.toMatch(/^[A-Za-z ]+$/);
    }
  });

  it("every detail answer is a real sentence from the story", () => {
    const texts = new Set(story.sentences.map((s) => s.text));
    for (const q of buildQuestions(story, known, 1).filter((q) => q.kind === "detail")) {
      expect(texts.has(q.answer)).toBe(true);
    }
  });

  it("distractors are near-misses — same sentence, one word swapped", () => {
    const qs = buildQuestions(story, known, 1).filter((q) => q.kind === "detail");
    const texts = new Set(story.sentences.map((s) => s.text));
    for (const q of qs) {
      for (const opt of q.options) {
        if (opt === q.answer) continue;
        // A distractor is NOT a real story sentence …
        expect(texts.has(opt)).toBe(false);
        // … but differs from the answer by a single swapped word, so it stays
        // the same length class rather than being obviously foreign.
        expect(Math.abs(opt.length - q.answer.length)).toBeLessThanOrEqual(4);
      }
    }
  });

  it("answer is always among options and options are unique", () => {
    for (const q of buildQuestions(story, known, 1)) {
      expect(q.options).toContain(q.answer);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });

  it("is deterministic for a given seed", () => {
    expect(buildQuestions(story, known, 7)).toEqual(buildQuestions(story, known, 7));
  });

  it("caps total questions", () => {
    expect(buildQuestions(story, known, 1).length).toBeLessThanOrEqual(4);
  });

  it("returns only the authored questions when no swap is possible", () => {
    const bare: Story = { ...story, sentences: [
      { text: "あ。", translation: "Ah." },
      { text: "い。", translation: "Ee." },
      { text: "う。", translation: "Oo." },
      { text: "え。", translation: "Eh." },
    ] };
    expect(buildQuestions(bare, known, 1).every((q) => q.kind === "gist")).toBe(true);
  });

  it("returns [] for a story with neither authored questions nor swappable text", () => {
    const bare: Story = { ...story, questions: undefined, sentences: [
      { text: "あ。", translation: "Ah." },
      { text: "い。", translation: "Ee." },
      { text: "う。", translation: "Oo." },
      { text: "え。", translation: "Eh." },
    ] };
    expect(buildQuestions(bare, known, 1)).toEqual([]);
  });
});
