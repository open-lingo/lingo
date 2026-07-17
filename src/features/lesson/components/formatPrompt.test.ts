import { describe, it, expect } from "vitest";
import { formatPrompt } from "./formatPrompt";

describe("formatPrompt", () => {
  it("uppercases a lowercase first letter", () => {
    expect(formatPrompt("this")).toBe("This");
  });

  it("uppercases only the first letter, leaving the rest untouched", () => {
    expect(formatPrompt("this word")).toBe("This word");
    expect(formatPrompt("ok")).toBe("Ok");
  });

  it("no-ops when already capitalized", () => {
    expect(formatPrompt("Pick the word for \"this\"")).toBe(
      'Pick the word for "this"',
    );
  });

  it("no-ops when the prompt starts with a Japanese character", () => {
    expect(formatPrompt("これは何ですか？")).toBe("これは何ですか？");
    expect(formatPrompt("コーヒーを のみますか。")).toBe("コーヒーを のみますか。");
  });

  it("no-ops on empty string", () => {
    expect(formatPrompt("")).toBe("");
  });

  it("no-ops when the first character isn't a letter", () => {
    expect(formatPrompt("'love'")).toBe("'love'");
    expect(formatPrompt("2 apples")).toBe("2 apples");
  });
});
