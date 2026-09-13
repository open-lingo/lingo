import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { KanjiRuby, kanjiRubyFits } from "./KanjiRuby";

/**
 * TestFlight #62 (build 10): furigana on build tiles sat left of its kanji.
 * `ruby-align: center` is only safe where WebKit's base padding cannot open a
 * gap INSIDE the word (TestFlight #36) — the component classifies each ruby
 * and CSS keys `ruby-align` off `data-fit`.
 */
describe("kanjiRubyFits", () => {
  it("always fits a whole-word ruby (padding lands outside the glyphs)", () => {
    expect(kanjiRubyFits({ prefix: "", body: "外国", rt: "がいこく", suffix: "" })).toBe(true);
    expect(kanjiRubyFits({ prefix: "", body: "日本語", rt: "にほんご", suffix: "" })).toBe(true);
  });

  it("fits an affixed ruby only when the reading has no more glyphs than the kanji run", () => {
    expect(kanjiRubyFits({ prefix: "", body: "行", rt: "い", suffix: "く" })).toBe(true);
    expect(kanjiRubyFits({ prefix: "", body: "食", rt: "た", suffix: "べる" })).toBe(true);
    expect(kanjiRubyFits({ prefix: "", body: "忙", rt: "いそが", suffix: "しい" })).toBe(false);
    expect(kanjiRubyFits({ prefix: "", body: "高", rt: "たか", suffix: "い" })).toBe(false);
    expect(kanjiRubyFits({ prefix: "お", body: "金", rt: "かね", suffix: "" })).toBe(false);
  });
});

describe("KanjiRuby data-fit", () => {
  it("marks 外国 and 行く centre-safe and 忙しい start-only", () => {
    const { container } = render(
      <>
        <KanjiRuby surface="外国" reading="がいこく" show />
        <KanjiRuby surface="行く" reading="いく" show />
        <KanjiRuby surface="忙しい" reading="いそがしい" show />
      </>,
    );
    const rubies = container.querySelectorAll("ruby.kanji-ruby");
    expect(Array.from(rubies, (r) => r.getAttribute("data-fit"))).toEqual(["true", "true", "false"]);
    // Base text stays the full surface either way — visual-QA judges assert on it.
    expect(rubies[2].textContent).toBe("忙いそがしい");
  });
});
