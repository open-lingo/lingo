import { describe, it, expect } from "vitest";
import type { StorySentence } from "@/features/practice/content";
import { groupStoryBlocks, hasDialogue } from "./storyBlocks";

const s = (text: string, speaker?: string): StorySentence => ({
  text,
  translation: text,
  ...(speaker ? { speaker } : {}),
});

describe("groupStoryBlocks", () => {
  it("collapses consecutive narration into one paragraph", () => {
    const blocks = groupStoryBlocks([s("a"), s("b"), s("c")]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("narration");
    expect(blocks[0].items.map((i) => i.sentence.text)).toEqual(["a", "b", "c"]);
  });

  it("breaks speech out of the narration flow", () => {
    const blocks = groupStoryBlocks([s("a"), s("hi", "ケン"), s("b")]);
    expect(blocks.map((b) => b.kind)).toEqual(["narration", "speech", "narration"]);
    expect(blocks[1]).toMatchObject({ kind: "speech", speaker: "ケン" });
  });

  it("keeps one speaker's consecutive lines in a single block", () => {
    const blocks = groupStoryBlocks([s("hi", "ケン"), s("again", "ケン")]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].items).toHaveLength(2);
  });

  it("starts a new block when the speaker changes", () => {
    const blocks = groupStoryBlocks([s("hi", "ケン"), s("hello", "ミカ")]);
    expect(blocks).toHaveLength(2);
    expect(blocks.map((b) => (b.kind === "speech" ? b.speaker : null))).toEqual([
      "ケン",
      "ミカ",
    ]);
  });

  it("preserves original sentence indices across blocks", () => {
    const blocks = groupStoryBlocks([s("a"), s("hi", "ケン"), s("b"), s("c")]);
    expect(blocks.flatMap((b) => b.items.map((i) => i.index))).toEqual([0, 1, 2, 3]);
  });

  it("returns no blocks for an empty story", () => {
    expect(groupStoryBlocks([])).toEqual([]);
  });
});

describe("hasDialogue", () => {
  it("is false for pure narration and true once a line is spoken", () => {
    expect(hasDialogue([s("a"), s("b")])).toBe(false);
    expect(hasDialogue([s("a"), s("hi", "ケン")])).toBe(true);
  });
});
