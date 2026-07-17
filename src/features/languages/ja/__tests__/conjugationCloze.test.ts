/**
 * conjugationCloze factory contract (n4-scoping-2026-07-16 §3 ACCEPT).
 *
 * The load-bearing property is ENGINE PROVENANCE: the correct surface is
 * conjugateVerb's output and every distractor is generateFormationDistractors'
 * output — the factory adds no derivation logic of its own, so it can never
 * ship a hand-mistyped conjugation. Plus: slot rotation (mcq-position gate),
 * annotation key shape (kanji post-pass), and the Gate 5 derivation-drill
 * exemption for the engine's deliberate non-word distractors.
 */
import { describe, it, expect } from "vitest";
import { conjugationCloze } from "../grammarHelpers";
import { conjugateVerb } from "../conjugationEngine";
import { generateFormationDistractors } from "../conjugation/formationDistractors";
import { getInventedFormBlocklist, lintMcqDistractors } from "./moduleContentLints";
import type { ConjugationClozeStep, LessonContent } from "@/features/lesson/types";

function optionTexts(step: ConjugationClozeStep): string[] {
  return step.options.map((o) => o.text);
}

function correctText(step: ConjugationClozeStep): string {
  const o = step.options.find((x) => x.id === step.correctOptionId);
  expect(o, "correctOptionId must resolve to an option").toBeTruthy();
  return o!.text;
}

describe("conjugationCloze — engine-derived answer", () => {
  it("う-verb (godan): のむ → て form is のんで, distractors are the engine's", () => {
    const step = conjugationCloze({
      id: "cjc-godan-te",
      before: "コーヒーを ",
      after: " ください。",
      verb: "のむ",
      form: "te",
      meaningEn: "Please drink the coffee.",
    });
    expect(correctText(step)).toBe("のんで");
    expect(correctText(step)).toBe(conjugateVerb("のむ", "godan", "te"));
    const expected = generateFormationDistractors("のむ", "godan", "te", "のんで");
    const distractors = optionTexts(step).filter((t) => t !== "のんで");
    expect(distractors.sort()).toEqual([...expected].sort());
  });

  it("る-verb (ichidan): たべる → ない form is たべない, distractors are the engine's", () => {
    const step = conjugationCloze({
      id: "cjc-ichidan-nai",
      before: "あさごはんを ",
      after: "。",
      verb: "たべる",
      form: "nai",
      meaningEn: "I don't eat breakfast.",
    });
    expect(correctText(step)).toBe("たべない");
    expect(correctText(step)).toBe(conjugateVerb("たべる", "ichidan", "nai"));
    const expected = generateFormationDistractors("たべる", "ichidan", "nai", "たべない");
    const distractors = optionTexts(step).filter((t) => t !== "たべない");
    expect(distractors.sort()).toEqual([...expected].sort());
  });

  it("irregular: する → ます form is します, distractors are the engine's", () => {
    const step = conjugationCloze({
      id: "cjc-irregular-masu",
      before: "まいにち べんきょうを ",
      after: "。",
      verb: "する",
      form: "masu",
      meaningEn: "I study every day.",
    });
    expect(correctText(step)).toBe("します");
    expect(correctText(step)).toBe(conjugateVerb("する", "irregular", "masu"));
    const expected = generateFormationDistractors("する", "irregular", "masu", "します");
    const distractors = optionTexts(step).filter((t) => t !== "します");
    expect(distractors.sort()).toEqual([...expected].sort());
  });

  it("emits 4 unique options with the correct answer present exactly once", () => {
    const step = conjugationCloze({
      id: "cjc-unique",
      before: "みずを ",
      after: "。",
      verb: "のむ",
      form: "tai",
      meaningEn: "I want to drink water.",
    });
    const texts = optionTexts(step);
    expect(texts).toHaveLength(4);
    expect(new Set(texts).size).toBe(4);
    expect(texts.filter((t) => t === conjugateVerb("のむ", "godan", "tai"))).toHaveLength(1);
  });

  it("resolves the verb group from VERB_ENTRIES and throws for unknown verbs without opts.group", () => {
    expect(() =>
      conjugationCloze({
        id: "cjc-unknown",
        before: "",
        after: "。",
        verb: "ぐらむ", // not a registry verb
        form: "te",
        meaningEn: "n/a",
      }),
    ).toThrow(/not in VERB_ENTRIES/);
    // With an explicit group it works — the engine is rule-based.
    const step = conjugationCloze({
      id: "cjc-explicit-group",
      before: "",
      after: "。",
      verb: "およぐ",
      form: "te",
      group: "godan",
      meaningEn: "swim",
    });
    expect(correctText(step)).toBe("およいで");
  });
});

describe("conjugationCloze — step shape", () => {
  const step = conjugationCloze({
    id: "cjc-shape",
    before: "わたしは にほんごを ",
    after: "。",
    verb: "はなす",
    form: "tai",
    group: "godan",
    cueEn: "want to speak",
    meaningEn: "I want to speak Japanese.",
  });

  it("carries the derivation cue (verb + form label) and form metadata", () => {
    expect(step.verb).toBe("はなす");
    expect(step.form).toBe("tai");
    expect(step.formLabel).toBe("たい form");
    expect(step.cueEn).toBe("want to speak");
    expect(step.modality).toBe("production");
  });

  it("defaults audioText to the assembled full sentence (post-commit answer audio)", () => {
    expect(step.audioText).toBe("わたしは にほんごを はなしたい。");
  });

  it("names frame ruby fields with the *Annotation suffix so applyKanjiSurfaces can rewrite them", () => {
    // isAnnotationKey matches keys ending in "Annotation"/"Annotations" —
    // these two are the frame's ONLY display-annotation carriers.
    expect(step.beforeAnnotation).toBeTruthy();
    expect(step.afterAnnotation).toBeTruthy();
    const surface = (step.beforeAnnotation ?? []).map((s) => s.surface).join("");
    expect(surface).toBe("わたしは にほんごを ");
  });
});

describe("conjugationCloze — slot rotation (mcq-position-distribution gate)", () => {
  it("no option slot holds > 55% of correct answers across many step ids", () => {
    const slots = [0, 0, 0, 0];
    const n = 60;
    for (let i = 0; i < n; i++) {
      const step = conjugationCloze({
        id: `ja-m31-${i}-cjc-drill`,
        before: "みずを ",
        after: "。",
        verb: "のむ",
        form: "te",
        meaningEn: "drink water",
      });
      const idx = step.options.findIndex((o) => o.id === step.correctOptionId);
      expect(idx).toBeGreaterThanOrEqual(0);
      slots[idx] += 1;
    }
    expect(Math.max(...slots) / n).toBeLessThanOrEqual(0.55);
  });
});

describe("conjugationCloze — Gate 5 invented-form exemption (derivation drill)", () => {
  const lessonWith = (steps: LessonContent["steps"]): LessonContent => ({
    id: "cjc-lint-lesson",
    moduleId: "m31",
    courseId: "ja-course",
    languageId: "ja",
    title: "lint fixture",
    steps,
  });

  it("engine non-word distractors on a conjugation_cloze pass the lint", () => {
    // のみる / のむる are the canonical blocklisted invented shapes; a
    // derivation drill legitimately offers them — that IS the pedagogy.
    const blocklist = getInventedFormBlocklist();
    expect(blocklist.has("のみる")).toBe(true);
    const step = conjugationCloze({
      id: "cjc-lint-step",
      before: "みずを ",
      after: "。",
      verb: "のむ",
      form: "te",
      meaningEn: "drink water",
    });
    // Force a blocklisted shape into the options to prove the exemption is
    // TYPE-keyed, not dependent on which distractors the engine happened
    // to emit for this form.
    const firstDistractor = step.options.findIndex(
      (o) => o.id !== step.correctOptionId,
    );
    const withInvented: ConjugationClozeStep = {
      ...step,
      options: step.options.map((o, i) =>
        i === firstDistractor ? { ...o, text: "のみる" } : o,
      ),
    };
    expect(lintMcqDistractors(lessonWith([withInvented]))).toEqual([]);
  });

  it("control: the same invented form on a multiple_choice still fails the lint", () => {
    const mc = {
      id: "mc-control",
      type: "multiple_choice" as const,
      prompt: "Which means 'drink'?",
      options: [
        { id: "a", text: "のみる" },
        { id: "b", text: "のむ" },
        { id: "c", text: "たべる" },
        { id: "d", text: "みる" },
      ],
      correctOptionId: "b",
    };
    const failures = lintMcqDistractors(lessonWith([mc]));
    expect(failures.some((f) => /invented verb form/.test(f.problem))).toBe(true);
  });
});
