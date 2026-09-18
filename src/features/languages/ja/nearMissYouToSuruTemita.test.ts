import { describe, it, expect } from "vitest";
import { isYouToSuruTemitaNearMiss } from "./nearMissYouToSuruTemita";

describe("isYouToSuruTemitaNearMiss (#200/#201, b30)", () => {
  it("fires when a ようとした-keyed answer is met with the same verb's てみた form", () => {
    const accepted = [
      "としょかんに いこうとした けど、 じかんが なかった。",
      "としょかんに いこうとした けど じかんが なかった",
    ];
    expect(isYouToSuruTemitaNearMiss(accepted, "としょかんにいってみたけどじかんがなかった")).toBe(
      true,
    );
  });

  it("fires for a kanji-typed てみた submission too (same kana content)", () => {
    const accepted = ["あつい コーヒーを のもうとした。"];
    // A learner typing kanji would still normalize to kana before this
    // check runs (TranslateStepView calls it post-grade, on the same
    // `composed`/kanji-fallback string the grader used).
    expect(isYouToSuruTemitaNearMiss(accepted, "あついこーひーをのんでみた")).toBe(true);
  });

  it("does not fire for a genuinely unrelated wrong answer", () => {
    const accepted = ["としょかんに いこうとした けど、 じかんが なかった。"];
    expect(isYouToSuruTemitaNearMiss(accepted, "がっこうに いった")).toBe(false);
  });

  it("does not fire when the accepted answer isn't ようとした-keyed at all", () => {
    const accepted = ["わたしは がくせいです"];
    expect(isYouToSuruTemitaNearMiss(accepted, "たべてみた")).toBe(false);
  });

  it("does not fire for a correct ようとした answer (grade already passed — caller gates on !correct)", () => {
    const accepted = ["あつい コーヒーを のもうとした。"];
    expect(isYouToSuruTemitaNearMiss(accepted, "あついこーひーをのもうとした")).toBe(false);
  });

  it("does not fire for an unrelated verb's てみた form", () => {
    const accepted = ["あつい コーヒーを のもうとした。"]; // のもう → のんでみた
    expect(isYouToSuruTemitaNearMiss(accepted, "あついこーひーをたべてみた")).toBe(false);
  });
});
