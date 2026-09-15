/**
 * #90 GATE — no two surfaces of one word family in the same build bank.
 *
 * Spencer, b13 2026-09-15, on a test-out "Build what you hear" whose bank held
 * both うた「歌」and うたう「歌う」: *"This is a weird sentence, double uta
 * aren't necessary no?"*
 *
 * Root cause was the render-time distractor fill (`buildTileFloor.pickFillTiles`),
 * which deduped candidates by exact text only — so a prior-taught noun sharing
 * a stem with the answer's verb was a perfectly legal "distractor". It now
 * skips any candidate in the same family as a tile already in the bank.
 *
 * Scope is m12+ and non-picker, matching the report's context (an advanced
 * test-out). Two shapes are deliberately out:
 *  - the m1/m2 kana rows, where です / ですか in one bank IS the taught contrast;
 *  - `picker: true` register ladders (m29's じゃない / じゃないです /
 *    じゃありません), where the competing utterances ARE the question.
 */
import { describe, it, expect } from "vitest";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import type { LessonStep } from "@/features/lesson/types";
import {
  answerFloorApplies,
  bankFamilyCollisions,
  isSentenceBuildStep,
  sameTileFamily,
} from "@/features/lesson/data/contentFloors";

describe("#90 — one family, one tile", () => {
  const offenders: string[] = [];
  let banksSeen = 0;

  for (const lessonId of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(lessonId);
    if (!lesson || lesson.languageId !== "ja") continue;
    if (!answerFloorApplies(lesson.moduleId)) continue;
    for (const step of lesson.steps as LessonStep[]) {
      if (!isSentenceBuildStep(step)) continue;
      banksSeen++;
      const extras =
        step.type === "build_sentence"
          ? ((step as { bankExtras?: string[] }).bankExtras ?? [])
          : [];
      for (const c of bankFamilyCollisions(
        [...step.tiles, ...extras],
        step.correctOrder,
      )) {
        offenders.push(
          `${lesson.moduleId} ${step.id}: "${c.tile}" clashes with "${c.clashesWith}" ` +
            `(answer: ${step.correctOrder.join(" ")})`,
        );
      }
    }
  }

  it("is not vacuous — the sweep sees m12+ build banks", () => {
    expect(banksSeen).toBeGreaterThan(3000);
  });

  it("no m12+ build bank offers two surfaces of one family", () => {
    expect(
      offenders,
      'same-family tiles in one bank (#90 "double uta aren\'t necessary"):\n  ' +
        offenders.join("\n  "),
    ).toEqual([]);
  });

  it("the family test catches the reported pair and not the near misses", () => {
    // Proof the detector can fail: the exact #90 pair.
    expect(sameTileFamily("うた", "うたう")).toBe(true);
    expect(sameTileFamily("にほん", "にほんじん")).toBe(true);
    expect(sameTileFamily("ひと", "ひとり")).toBe(true);
    // Tense contrasts are NOT a family — neither is a prefix of the other, and
    // offering たべた against たべる is a contrast a module may be teaching.
    expect(sameTileFamily("たべる", "たべた")).toBe(false);
    // One-kana stems are noise, not families; particles are untouched.
    expect(sameTileFamily("き", "きく")).toBe(false);
    expect(sameTileFamily("に", "にく")).toBe(false);
    expect(sameTileFamily("は", "が")).toBe(false);
    // A long tail is a different word, not an inflection.
    expect(sameTileFamily("いえ", "いえますか")).toBe(false);
    // An answer token always wins the slot.
    expect(
      bankFamilyCollisions(["うたう", "うた", "ほん"], ["うたう"]).map((c) => c.tile),
    ).toEqual(["うた"]);
    expect(bankFamilyCollisions(["うたう", "ほん"], ["うたう"])).toEqual([]);
  });
});
