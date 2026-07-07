import { describe, it, expect } from "vitest";
import { splitQuotedEmphasis } from "./ListeningBuildStepView";

describe("splitQuotedEmphasis", () => {
  it("bolds a simple quoted word", () => {
    expect(splitQuotedEmphasis("the word for 'love'")).toEqual([
      "the word for ",
      "love",
      "",
    ]);
  });

  it("keeps contractions inside the quoted span (the I'm regression)", () => {
    // ja-m15-1-1 rendered as "Hear it, build it: Im studying right now.'"
    // because the naive split treated the apostrophe in I'm as a closer.
    expect(
      splitQuotedEmphasis("Hear it, build it: 'I'm studying right now.'"),
    ).toEqual(["Hear it, build it: ", "I'm studying right now.", ""]);
  });

  it("returns the raw string when no quoted span exists", () => {
    expect(splitQuotedEmphasis("Tap what you hear")).toEqual([
      "Tap what you hear",
    ]);
    expect(splitQuotedEmphasis("It's tough, isn't it")).toEqual([
      "It's tough, isn't it",
    ]);
  });

  it("does not open a quote mid-word", () => {
    expect(splitQuotedEmphasis("Alex's answer")).toEqual(["Alex's answer"]);
  });
});
