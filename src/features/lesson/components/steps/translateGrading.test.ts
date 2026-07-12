/**
 * Regression: typed translate answers grade correctly when the learner
 * writes natural, spaceless Japanese.
 *
 * Curriculum `acceptedAnswers` store Japanese space-separated for
 * readability (e.g. "きょうは くもりです"), but Japanese is written without
 * spaces. TranslateStepView grades with
 *
 *   acceptedAnswers.some(a => normalizeTypedAnswer(a) === normalizeTypedAnswer(input))
 *
 * so a learner typing "きょうはくもりです" must still be marked correct, while a
 * genuinely wrong answer must still fail. `accepts()` below mirrors that
 * predicate and runs against the real curriculum data.
 */
import { describe, it, expect } from "vitest";
import { normalizeTypedAnswer } from "@/shared/speech";
import { M18_1_2, M18_2_2 } from "@/features/languages/ja/curriculum/m18";
import type { LessonContent, TranslateStep } from "@/features/lesson/types";

function translateStepById(lesson: LessonContent, id: string): TranslateStep {
  const step = lesson.steps.find((s) => s.id === id);
  if (!step || step.type !== "translate") {
    throw new Error(`translate step ${id} not found in ${lesson.id}`);
  }
  return step;
}

/** Mirrors TranslateStepView's grading predicate exactly. */
function accepts(step: TranslateStep, input: string): boolean {
  const normalized = normalizeTypedAnswer(input);
  return step.acceptedAnswers.some(
    (a) => normalizeTypedAnswer(a) === normalized,
  );
}

describe("normalizeTypedAnswer", () => {
  it("ignores whitespace so spaceless Japanese matches space-separated", () => {
    expect(normalizeTypedAnswer("きょうは くもりです")).toBe("きょうはくもりです");
    expect(normalizeTypedAnswer("きょうはくもりです")).toBe("きょうはくもりです");
    expect(normalizeTypedAnswer("きょうは くもりです")).toBe(
      normalizeTypedAnswer("きょうはくもりです"),
    );
  });

  it("folds full-width / half-width variants via NFKC", () => {
    // Full-width ASCII → half-width, then lowercased.
    expect(normalizeTypedAnswer("ＨＥＬＬＯ")).toBe("hello");
    // Half-width katakana → standard katakana.
    expect(normalizeTypedAnswer("ｶ")).toBe(normalizeTypedAnswer("カ"));
  });

  it("keeps English/romaji case-insensitive but preserves content", () => {
    expect(normalizeTypedAnswer("It's Cloudy")).toBe("it'scloudy");
    // Different particles must NOT collapse together.
    expect(normalizeTypedAnswer("きょうはくもりです")).not.toBe(
      normalizeTypedAnswer("きょうがくもりです"),
    );
  });
});

describe("translate grading against real curriculum steps", () => {
  it('accepts spaceless "きょうはくもりです" for "It\'s cloudy today."', () => {
    const step = translateStepById(M18_1_2, "ja-m18-1-2-translate-1");
    expect(step.sourceText).toBe("It's cloudy today.");
    // Stored space-separated; before the fix this failed the exact match.
    expect(step.acceptedAnswers).toContain("きょうは くもりです");
    expect(accepts(step, "きょうはくもりです")).toBe(true);
    expect(accepts(step, "きょうはくもりです。")).toBe(true);
  });

  it("rejects genuinely wrong answers (wrong word / wrong particle)", () => {
    const step = translateStepById(M18_1_2, "ja-m18-1-2-translate-1");
    // "It's sunny today" — wrong weather word.
    expect(accepts(step, "きょうははれです")).toBe(false);
    // Wrong particle (が instead of は).
    expect(accepts(step, "きょうがくもりです")).toBe(false);
  });

  it("accepts a second real spaceless step and rejects its wrong word", () => {
    const step = translateStepById(M18_2_2, "ja-m18-2-2-translate-1");
    expect(step.sourceText).toBe("It will probably snow next week.");
    expect(step.acceptedAnswers).toContain("らいしゅうは ゆきでしょう");
    expect(accepts(step, "らいしゅうはゆきでしょう")).toBe(true);
    // Rain, not snow — still wrong.
    expect(accepts(step, "らいしゅうはあめでしょう")).toBe(false);
  });
});

describe("expandAcceptedAnswers (QA 2026-07-12 leniency)", () => {
  it("accepts topic-dropped, pronoun-swapped, and です-dropped variants", async () => {
    const { expandAcceptedAnswers } = await import("./translateVariants");
    const variants = expandAcceptedAnswers(["わたしは がくせいです。"]);
    const norm = variants.map((v) => normalizeTypedAnswer(v));
    for (const good of [
      "わたしはがくせいです",
      "ぼくはがくせいです",
      "がくせいです",
      "がくせい",
      "わたしはがくせい",
    ]) {
      expect(norm, `should accept ${good}`).toContain(
        normalizeTypedAnswer(good),
      );
    }
  });

  it("never strands ん by dropping です after んです", async () => {
    const { expandAcceptedAnswers } = await import("./translateVariants");
    const variants = expandAcceptedAnswers(["たべるんです"]);
    expect(variants).not.toContain("たべるん");
  });

  it("does not drop a topic that is the whole sentence", async () => {
    const { expandAcceptedAnswers } = await import("./translateVariants");
    const variants = expandAcceptedAnswers(["わたしは"]);
    // Pronoun swap is fine; topic-DROP (empty answer) is not.
    expect(variants.sort()).toEqual(["ぼくは", "わたしは"]);
    expect(variants).not.toContain("");
  });
});
