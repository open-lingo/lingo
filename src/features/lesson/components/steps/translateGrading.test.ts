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
import * as wanakana from "wanakana";
import { normalizeTypedAnswer } from "@/shared/speech";
import { accentFold, gradeTypedAnswer } from "@/shared/speech/loose-match";
import { M18_1_2, M18_2_2 } from "@/features/languages/ja/curriculum/m18";
import { M24_7_1 } from "@/features/languages/ja/curriculum/m24";
import { ES_M5_LESSONS } from "@/features/languages/es/curriculum/m5";
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

describe("accentFold", () => {
  it("folds Latin diacritics via NFD decomposition", () => {
    expect(accentFold("años")).toBe("anos");
    expect(accentFold("pingüino")).toBe("pinguino");
    expect(accentFold("está")).toBe("esta");
    expect(accentFold("ÁÉÍÓÚÜÑ")).toBe("AEIOUUN");
  });

  it("is idempotent on already-folded input", () => {
    expect(accentFold("anos")).toBe("anos");
    expect(accentFold(accentFold("años"))).toBe(accentFold("años"));
  });

  it("preserves kana voicing marks — です must NOT fold to てす", () => {
    // U+3099/U+309A distinguish real words (かき persimmon vs かぎ key);
    // folding them would silently weaken JA typed grading.
    expect(accentFold("です")).toBe("です");
    expect(accentFold("がっこう")).toBe("がっこう");
  });
});

describe("gradeTypedAnswer accent accept-but-flag (es)", () => {
  // Real curriculum step: "I am nine years old" with the spine's authored
  // diacritic-stripped variants ("tengo nueve anos") alongside the real
  // orthography ("tengo nueve años").
  function anosStep(): TranslateStep {
    const lesson = ES_M5_LESSONS.find((l) =>
      l.steps.some((s) => s.id === "es-m5-8-tr-anos"),
    );
    if (!lesson) throw new Error("es-m5-8-tr-anos lesson not found");
    return translateStepById(lesson, "es-m5-8-tr-anos");
  }

  it("accepts a de-accented answer but flags it, surfacing the accents", () => {
    const step = anosStep();
    // The stripped variant is AUTHORED into acceptedAnswers, so this is an
    // EXACT match — the flag must still fire off the accented sibling.
    expect(step.acceptedAnswers).toContain("tengo nueve anos");
    const grade = gradeTypedAnswer(step.acceptedAnswers, "tengo nueve anos");
    expect(grade.correct).toBe(true);
    expect(grade.accentFlagged).toBe(true);
    expect(grade.accentDisplay).toBe("tengo nueve años");
  });

  it("does not flag a fully-accented answer", () => {
    const step = anosStep();
    for (const good of ["tengo nueve años", "Tengo nueve años.", "yo tengo nueve años"]) {
      const grade = gradeTypedAnswer(step.acceptedAnswers, good);
      expect(grade.correct, good).toBe(true);
      expect(grade.accentFlagged, good).toBe(false);
      expect(grade.accentDisplay, good).toBeNull();
    }
  });

  it("still fails genuinely wrong answers", () => {
    const step = anosStep();
    for (const bad of ["tengo diez anos", "tienes nueve años", "nueve"]) {
      const grade = gradeTypedAnswer(step.acceptedAnswers, bad);
      expect(grade.correct, bad).toBe(false);
      expect(grade.accentFlagged, bad).toBe(false);
      expect(grade.accentDisplay, bad).toBeNull();
    }
  });

  it("fold-fallback: passes+flags even when no stripped variant is authored", () => {
    // Future-proofs removing the authored stripped variants: the input
    // matches nothing exactly, but accent-folds onto a real answer.
    const grade = gradeTypedAnswer(["El niño está aquí"], "el nino esta aqui");
    expect(grade.correct).toBe(true);
    expect(grade.accentFlagged).toBe(true);
    expect(grade.accentDisplay).toBe("El niño está aquí");
  });

  it("prefers the most-accented display form, first authored winning ties", () => {
    const grade = gradeTypedAnswer(
      ["esta aqui", "está aqui", "está aquí"],
      "esta aqui",
    );
    expect(grade.correct).toBe(true);
    expect(grade.accentFlagged).toBe(true);
    expect(grade.accentDisplay).toBe("está aquí");
  });

  it("matches the legacy predicate on real JA steps — and never flags kana", () => {
    const step = translateStepById(M18_1_2, "ja-m18-1-2-translate-1");
    const good = gradeTypedAnswer(step.acceptedAnswers, "きょうはくもりです。");
    expect(good.correct).toBe(true);
    expect(good.accentFlagged).toBe(false);
    // Dakuten omission is a real error, not an accent slip.
    expect(gradeTypedAnswer(step.acceptedAnswers, "きょうはくもりてす").correct).toBe(false);
    expect(gradeTypedAnswer(step.acceptedAnswers, "きょうがくもりです").correct).toBe(false);
  });
});

describe("gradeTypedAnswer script (kana) fold — hiragana ↔ katakana (QA 2026-07-16)", () => {
  // Owner critique 2026-07-16: the romaji IME (wanakana.toKana) yields
  // hiragana, so a katakana loanword answer (テレビ) fails when the learner
  // types "terebi" → てれび even though it's phonetically the answer. The
  // fold accepts either script and nudges toward the conventional one.

  it("reproduces the reported bug end-to-end: 'terebi' → てれび passes + flags katakana", () => {
    // This is exactly what handleSubmit does: wanakana.toKana on the raw
    // romaji, then gradeTypedAnswer. Before the fold this graded WRONG.
    const composed = wanakana.toKana("terebi");
    expect(composed).toBe("てれび"); // wanakana defaults to hiragana
    const grade = gradeTypedAnswer(["テレビ"], composed);
    expect(grade.correct).toBe(true);
    expect(grade.kanaFlagged).toBe(true);
    expect(grade.kanaDisplay).toBe("テレビ");
  });

  it("accepts a hiragana rendering of a katakana answer and surfaces the katakana", () => {
    const grade = gradeTypedAnswer(["テレビを みます"], "てれびをみます");
    expect(grade.correct).toBe(true);
    expect(grade.kanaFlagged).toBe(true);
    expect(grade.kanaDisplay).toBe("テレビを みます");
    // Never mistaken for an accent slip.
    expect(grade.accentFlagged).toBe(false);
  });

  it("does NOT flag when the katakana was typed correctly", () => {
    const grade = gradeTypedAnswer(["テレビを みます"], "テレビをみます");
    expect(grade.correct).toBe(true);
    expect(grade.kanaFlagged).toBe(false);
    expect(grade.kanaDisplay).toBeNull();
  });

  it("folds the reverse direction too — katakana typed for a hiragana answer", () => {
    const grade = gradeTypedAnswer(["ねこ"], "ネコ");
    expect(grade.correct).toBe(true);
    expect(grade.kanaFlagged).toBe(true);
    expect(grade.kanaDisplay).toBe("ねこ");
  });

  it("still fails genuinely wrong answers (wrong word, not just wrong script)", () => {
    const grade = gradeTypedAnswer(["テレビを みます"], "らじおをみます");
    expect(grade.correct).toBe(false);
    expect(grade.kanaFlagged).toBe(false);
  });

  it("preserves kana voicing — a dakuten slip (ビ→ヒ / び→ひ) is still a real miss", () => {
    // Script fold shifts katakana↔hiragana but NEVER strips dakuten, so
    // てれひ (no voicing) must not pass for テレビ.
    const grade = gradeTypedAnswer(["テレビ"], "てれひ");
    expect(grade.correct).toBe(false);
  });

  it("never spuriously kana-flags a de-accented es answer", () => {
    // Latin text has no katakana, so the script fold must stay inert on es.
    const grade = gradeTypedAnswer(["El niño está aquí"], "el nino esta aqui");
    expect(grade.correct).toBe(true);
    expect(grade.accentFlagged).toBe(true);
    expect(grade.kanaFlagged).toBe(false);
    expect(grade.kanaDisplay).toBeNull();
  });

  it("grades a real curriculum step: all-hiragana アニメ sentence passes + flags", () => {
    const step = translateStepById(M24_7_1, "ja-m24-7-1-translate");
    expect(step.sourceText).toBe(
      "On weekends, I do things like reading manga and watching anime.",
    );
    // Authored with the loanword in katakana (アニメ).
    expect(step.acceptedAnswers[0]).toContain("アニメ");
    // A learner who romaji-typed the whole sentence gets all hiragana.
    const allHiragana = "しゅうまつにまんがをよんだりあにめをみたりします";
    const grade = gradeTypedAnswer(step.acceptedAnswers, allHiragana);
    expect(grade.correct).toBe(true);
    expect(grade.kanaFlagged).toBe(true);
    expect(grade.kanaDisplay).toContain("アニメ");
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
