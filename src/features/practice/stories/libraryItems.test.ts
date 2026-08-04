import { describe, it, expect } from "vitest";
import type { Conversation, Story } from "@/features/practice/content";
import { buildLibraryItems, conversationLevel } from "./libraryItems";

const story = (id: string, module: number, level: 1 | 2 | 3 | 4 | 5): Story => ({
  id,
  languageId: "ja",
  module,
  level,
  title: id,
  theme: "theme",
  sentences: [{ text: "a", translation: "a" }],
  questions: [{ id: "g", kind: "gist", prompt: "?", options: ["a"], answer: "a" }],
});

const conv = (id: string, module: number): Conversation => ({
  id,
  languageId: "ja",
  module,
  title: id,
  situation: "situation",
  speakers: [{ id: "A", label: "You" }, { id: "B", label: "Staff" }],
  lines: [{ speaker: "A", text: "a", translation: "a" }],
});

const unread = () => 0;

describe("buildLibraryItems", () => {
  it("merges stories and conversations into one list", () => {
    const items = buildLibraryItems([story("s1", 5, 2)], [conv("c1", 5)], unread);
    expect(items.map((i) => i.kind).sort()).toEqual(["conversation", "story"]);
  });

  // Stories and conversations share one reader route — the id is the
  // discriminator, so a conversation gets the same one-segment path a story
  // does (no `c/` crumb that goes nowhere).
  it("routes conversations to the same path shape as stories", () => {
    const [item] = buildLibraryItems([], [conv("c1", 5)], unread);
    expect(item.path).toBe("practice/stories/c1");
  });

  it("sorts unread first, then newest module, then hardest level", () => {
    const items = buildLibraryItems(
      [story("old", 3, 2), story("newEasy", 9, 1), story("newHard", 9, 3)],
      [],
      (id) => (id === "newHard" ? 1 : 0),
    );
    // newHard is read, so it drops below both unread rows despite being the
    // hardest at the newest module.
    expect(items.map((i) => i.id)).toEqual(["newEasy", "old", "newHard"]);
  });

  it("gives a conversation its module's level ceiling so it leads its module", () => {
    expect(conversationLevel(conv("c1", 3))).toBe(2);
    expect(conversationLevel(conv("c2", 21))).toBe(5);
    const items = buildLibraryItems([story("s", 21, 4)], [conv("c", 21)], unread);
    expect(items.map((i) => i.id)).toEqual(["c", "s"]);
  });
});
