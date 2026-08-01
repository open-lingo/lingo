import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Story } from "@/features/practice/content";

const getCardState = vi.fn();
const getKnownAtomsByPos = vi.fn();

vi.mock("@/features/flashcards/engine", () => ({
  getCardState: (...a: unknown[]) => getCardState(...a),
}));
vi.mock("@/features/practice/engine", () => ({
  getKnownAtomsByPos: (...a: unknown[]) => getKnownAtomsByPos(...a),
}));

const { resolveStoryWords } = await import("./unknownWords");

const story: Story = {
  id: "ja-test",
  languageId: "ja",
  module: 7,
  level: 1,
  title: "Test",
  theme: "A test.",
  glosses: [{ surface: "はなみ", meaning: "flower viewing", reading: "hanami" }],
  sentences: [
    { text: "はなみに いきます。", translation: "I go flower viewing." },
    { text: "すしを たべます。", translation: "I eat sushi." },
    { text: "おちゃを のみます。", translation: "I drink tea." },
    { text: "ほんを よみます。", translation: "I read a book." },
  ],
};

const atoms = [
  { id: "ja:sushi", surface: "すし", reading: "sushi", meaningEn: "sushi", pos: "noun", tier: "known", due: false },
  { id: "ja:ocha", surface: "おちゃ", reading: "ocha", meaningEn: "green tea", pos: "noun", tier: "known", due: false },
  { id: "ja:hon", surface: "ほん", reading: "hon", meaningEn: "book", pos: "noun", tier: "known", due: false },
];

beforeEach(() => {
  getCardState.mockReset();
  getKnownAtomsByPos.mockReset();
  getKnownAtomsByPos.mockReturnValue(atoms);
});

describe("resolveStoryWords", () => {
  it("always includes declared glosses, marked as glosses", () => {
    getCardState.mockReturnValue({ recognition: { state: "review" }, production: { state: "review" } });
    const map = resolveStoryWords(story, "ja");
    const hanami = map.get("はなみ");
    expect(hanami?.source).toBe("gloss");
    expect(hanami?.meaning).toBe("flower viewing");
    expect(hanami?.unknown).toBe(true);
  });

  it("marks a course atom with no card state as unknown", () => {
    getCardState.mockImplementation((id: string) => (id === "ja:sushi" ? null : { recognition: { state: "review" }, production: { state: "review" } }));
    const map = resolveStoryWords(story, "ja");
    expect(map.get("すし")?.unknown).toBe(true);
    expect(map.get("すし")?.source).toBe("atom");
    expect(map.get("すし")?.atomId).toBe("ja:sushi");
  });

  it("marks an atom still in the `new` state as unknown", () => {
    getCardState.mockImplementation((id: string) =>
      id === "ja:ocha"
        ? { recognition: { state: "new" }, production: { state: "new" } }
        : { recognition: { state: "review" }, production: { state: "review" } },
    );
    const map = resolveStoryWords(story, "ja");
    expect(map.get("おちゃ")?.unknown).toBe(true);
  });

  it("treats a card as learned once EITHER modality leaves `new` (mixed state)", () => {
    // recognition still "new" but production has progressed — this pins the
    // `||` semantics in `hasLearned`. Flipping it to `&&` would keep this
    // atom "unlearned" and this assertion would fail.
    getCardState.mockImplementation((id: string) =>
      id === "ja:sushi"
        ? { recognition: { state: "new" }, production: { state: "review" } }
        : { recognition: { state: "review" }, production: { state: "review" } },
    );
    const map = resolveStoryWords(story, "ja");
    expect(map.has("すし")).toBe(false);
  });

  it("omits atoms the learner already knows", () => {
    getCardState.mockReturnValue({ recognition: { state: "review" }, production: { state: "review" } });
    const map = resolveStoryWords(story, "ja");
    expect(map.has("すし")).toBe(false);
    expect(map.has("ほん")).toBe(false);
  });

  it("ignores atoms that do not appear in the story text", () => {
    getCardState.mockReturnValue(null);
    getKnownAtomsByPos.mockReturnValue([
      ...atoms,
      { id: "ja:kuruma", surface: "くるま", reading: "kuruma", meaningEn: "car", pos: "noun", tier: "known", due: false },
    ]);
    const map = resolveStoryWords(story, "ja");
    // くるま never appears in the story body — must not be added...
    expect(map.has("くるま")).toBe(false);
    // ...while すし, which does appear, still is.
    expect(map.has("すし")).toBe(true);
  });

  it("skips single-character atoms even when unlearned", () => {
    getCardState.mockReturnValue(undefined);
    getKnownAtomsByPos.mockReturnValue([
      ...atoms,
      { id: "ja:i", surface: "い", reading: "i", meaningEn: "(single-char placeholder)", pos: "noun", tier: "known", due: false },
    ]);
    const map = resolveStoryWords(story, "ja");
    // "い" appears inside "いきます" in the first sentence but is filtered
    // for being a single character — likely noise (particles etc).
    expect(map.has("い")).toBe(false);
  });

  it("a gloss wins over an atom of the same surface", () => {
    getCardState.mockReturnValue(null);
    const withOverlap: Story = {
      ...story,
      glosses: [{ surface: "すし", meaning: "sushi (authored)", reading: "sushi" }],
    };
    const map = resolveStoryWords(withOverlap, "ja");
    expect(map.get("すし")?.source).toBe("gloss");
    expect(map.get("すし")?.meaning).toBe("sushi (authored)");
  });
});
