import { describe, expect, it } from "vitest";
import { sha256Hex16 } from "@/shared/tts/sha256";
import {
  atomGlossAnchor,
  atomShortGlossAnchor,
  bodyAnchor,
  courseIdsFromLessonId,
  cultureNoteAnchor,
  explanationAnchor,
  grammarAntipatternWhyAnchor,
  grammarExampleAnchor,
  grammarRuleAnchor,
  hasJaScript,
  hintAnchor,
  optionAnchor,
  pairTargetAnchor,
  promptAnchor,
  titleAnchor,
} from "./anchors";

describe("courseIdsFromLessonId", () => {
  it("parses the standard <languageId>-m<N>-... convention", () => {
    expect(courseIdsFromLessonId("ja-m6-neo-4")).toEqual({
      languageId: "ja",
      moduleId: "m6",
    });
  });

  it("parses a bare lesson id (no step suffix)", () => {
    expect(courseIdsFromLessonId("ja-m12-a-workday")).toEqual({
      languageId: "ja",
      moduleId: "m12",
    });
  });

  it("returns null for an id with no module segment", () => {
    expect(courseIdsFromLessonId("not-a-lesson-id")).toBeNull();
  });

  it("returns null for undefined/empty", () => {
    expect(courseIdsFromLessonId(undefined)).toBeNull();
    expect(courseIdsFromLessonId(null)).toBeNull();
    expect(courseIdsFromLessonId("")).toBeNull();
  });
});

describe("hasJaScript", () => {
  it("detects hiragana/katakana/kanji", () => {
    expect(hasJaScript("かぎが ある")).toBe(true);
    expect(hasJaScript("センセイ")).toBe(true);
    expect(hasJaScript("先生")).toBe(true);
  });

  it("is false for plain English or Korean", () => {
    expect(hasJaScript("Hello there")).toBe(false);
    expect(hasJaScript("선생님")).toBe(false);
    expect(hasJaScript(undefined)).toBe(false);
    expect(hasJaScript(null)).toBe(false);
  });
});

describe("anchor formulas mirror the extractor's extractStep() exactly", () => {
  const moduleId = "m6";
  const lessonId = "ja-m6-neo-4";

  it("hintAnchor matches `${moduleId}/${lessonId}/en:${hash}`", () => {
    expect(hintAnchor(moduleId, lessonId, "Pick the right particle")).toBe(
      `${moduleId}/${lessonId}/en:${sha256Hex16("Pick the right particle")}`,
    );
  });

  it("explanationAnchor carries the moduleId prefix (post rung-1b fix)", () => {
    expect(explanationAnchor(moduleId, lessonId, "Because X")).toBe(
      `${moduleId}/${lessonId}/en:${sha256Hex16("Because X")}`,
    );
  });

  it("promptAnchor keys on the JA surface when one is present and JA-scripted", () => {
    expect(promptAnchor(moduleId, lessonId, "Say hello", "こんにちは")).toBe(
      `${moduleId}/${lessonId}/ja:こんにちは`,
    );
  });

  it("promptAnchor falls back to an en-hash anchor with no JA surface", () => {
    expect(promptAnchor(moduleId, lessonId, "Pick the correct answer", undefined)).toBe(
      `${moduleId}/${lessonId}/en:${sha256Hex16("Pick the correct answer")}`,
    );
  });

  it("promptAnchor falls back to en-hash when the 'JA surface' isn't actually JA script", () => {
    // A KO-language cue, e.g., must never be mistaken for a JA anchor key.
    expect(promptAnchor(moduleId, lessonId, "Say it", "안녕하세요")).toBe(
      `${moduleId}/${lessonId}/en:${sha256Hex16("Say it")}`,
    );
  });

  it("bodyAnchor / cultureNoteAnchor / titleAnchor / optionAnchor / pairTargetAnchor all use the generic en-hash shape", () => {
    for (const fn of [bodyAnchor, cultureNoteAnchor, titleAnchor, optionAnchor, pairTargetAnchor]) {
      expect(fn(moduleId, lessonId, "Some text")).toBe(
        `${moduleId}/${lessonId}/en:${sha256Hex16("Some text")}`,
      );
    }
  });

  it("grammarRuleAnchor / grammarExampleAnchor / grammarAntipatternWhyAnchor key on the grammar point id", () => {
    expect(grammarRuleAnchor(moduleId, "te-form")).toBe(`${moduleId}/gp:te-form/rule`);
    expect(grammarExampleAnchor(moduleId, "te-form", "かぎが ある")).toBe(
      `${moduleId}/gp:te-form/ex:かぎが ある`,
    );
    expect(grammarAntipatternWhyAnchor(moduleId, "te-form")).toBe(
      `${moduleId}/gp:te-form/antipattern-why`,
    );
  });

  it("atomGlossAnchor / atomShortGlossAnchor key on the atom's kana", () => {
    expect(atomGlossAnchor(moduleId, "せんせい")).toBe(`${moduleId}/atom:せんせい/gloss`);
    expect(atomShortGlossAnchor(moduleId, "せんせい")).toBe(
      `${moduleId}/atom:せんせい/shortGloss`,
    );
  });
});
