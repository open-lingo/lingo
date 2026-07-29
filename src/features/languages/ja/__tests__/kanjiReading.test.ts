/**
 * `kanjiReading` factory contract (2026-07-16).
 *
 * The step tests READING RECALL: a kanji surface is shown and the learner
 * picks its kana reading. Direction is strictly kanji → kana (the inverse,
 * sound → kanji-spelling, is the separate future `audio_spelling_mcq` per
 * lesson-authoring-guide §13.1 — NOT this step).
 *
 * Three things are load-bearing and each has a test below:
 *   1. THE TESTED KANJI MUST RENDER BARE. `promptAnnotation` is emitted in
 *      the furigana-OFF shape (surface === reading === kanji) so the ruby
 *      renderer has nothing to float, AND `applyKanjiSurfaces` refuses to
 *      re-annotate it. Showing furigana here would hand over the answer.
 *   2. Slot rotation via `slotFor` — no hardcoded correct slot (hard guard:
 *      mcq-position-distribution.test.ts fails at >55% concentration).
 *   3. Distractor plausibility (§13.7): near-misses only — a valid-but-wrong
 *      on/kun reading, a wrong-okurigana stem, or a rendaku error. Never
 *      random filler solvable by elimination.
 */
import { describe, it, expect } from "vitest";
import { kanjiReading, slotFor } from "../grammarHelpers";
import { readingDistractors } from "../secondScript/readingDistractors";
import { applyKanjiSurfaces } from "../secondScript/applyKanjiSurfaces";
import { isKana } from "@/shared/japanese/kanaTable";
import type { LessonContent } from "@/features/lesson/types";

const MIZU = { kana: "みず", meaningEn: "water", fromModule: "m3" } as const;
const TABERU = { kana: "たべる", meaningEn: "to eat", fromModule: "m7" } as const;
const MITTSU = { kana: "みっつ", meaningEn: "three", fromModule: "m5" } as const;

function pureKana(s: string): boolean {
  return s.length > 0 && Array.from(s).every(isKana);
}

describe("readingDistractors", () => {
  it("offers a valid-but-wrong ON reading for a single-kanji kun word (水 みず → すい)", () => {
    // 水 on=スイ kun=みず. The on-reading is a real reading of the glyph but
    // wrong for this word — the canonical §13.7 near-miss.
    expect(readingDistractors("水", "みず")).toContain("すい");
  });

  it("offers wrong-okurigana stems for a verb (食べる たべる → しょくべる)", () => {
    // 食 on=ショク,ジキ kun=た.べる,く.う. Okurigana べる is fixed by the
    // surface; swapping the STEM reading is exactly the mistake a learner
    // makes when they reach for the on-reading of a kun-reading verb.
    const d = readingDistractors("食べる", "たべる");
    expect(d).toContain("しょくべる");
    expect(d.every((x) => x.endsWith("べる"))).toBe(true);
  });

  it("offers a rendaku/small-tsu near-miss when no alternate on/kun exists (三つ みっつ)", () => {
    const d = readingDistractors("三つ", "みっつ");
    // small-tsu dropped — the classic gemination miss
    expect(d).toContain("みつ");
  });

  it("never returns the correct reading, duplicates, or non-kana", () => {
    for (const [kanji, reading] of [
      ["水", "みず"],
      ["食べる", "たべる"],
      ["三つ", "みっつ"],
      ["電車", "でんしゃ"],
    ] as const) {
      const d = readingDistractors(kanji, reading);
      expect(d).not.toContain(reading);
      expect(new Set(d).size).toBe(d.length);
      expect(d.every(pureKana)).toBe(true);
    }
  });

  it("is deterministic", () => {
    expect(readingDistractors("食べる", "たべる")).toEqual(
      readingDistractors("食べる", "たべる"),
    );
  });
});

describe("kanjiReading", () => {
  it("builds a kanji→kana reading MCQ with 4 options", () => {
    const step = kanjiReading("ja-m13-1-kr-mizu", MIZU);
    expect(step.type).toBe("kanji_reading");
    expect(step.id).toBe("ja-m13-1-kr-mizu");
    expect(step.kanji).toBe("水");
    expect(step.reading).toBe("みず");
    expect(step.options).toHaveLength(4);
    expect(step.modality).toBe("recognition");
  });

  it("the correct option holds the KANA reading (never the kanji)", () => {
    const step = kanjiReading("ja-m13-1-kr-mizu", MIZU);
    const correct = step.options.find((o) => o.id === step.correctOptionId)!;
    expect(correct.text).toBe("みず");
    // Every option is a kana reading — this step never asks for kanji
    // production (shipped policy: NO typed/selected kanji output, ever).
    expect(step.options.every((o) => pureKana(o.text))).toBe(true);
  });

  // ── 1. The correctness property: the tested kanji renders BARE ──
  it("emits promptAnnotation in the furigana-OFF shape (surface === reading === kanji)", () => {
    const step = kanjiReading("ja-m13-1-kr-mizu", MIZU);
    expect(step.promptAnnotation).toHaveLength(1);
    const seg = step.promptAnnotation[0];
    expect(seg.surface).toBe("水");
    // reading === surface is AnnotatedText's "nothing to float" signal.
    expect(seg.reading).toBe("水");
    expect(seg.reading).not.toBe("みず"); // would print the answer
  });

  it("survives applyKanjiSurfaces without gaining furigana", () => {
    // The post-pass rewrites any single-atom *Annotation whose surface is
    // clean kana. Ours already carries Han, so its `hasHan` guard skips us —
    // the pass can never re-attach the kana reading to the tested surface.
    const step = kanjiReading("ja-m22-1-kr-densha", {
      kana: "でんしゃ",
      meaningEn: "train",
      fromModule: "m22",
    });
    const lesson: LessonContent = {
      id: "ja-m22-1",
      moduleId: "m22",
      courseId: "ja-n5",
      languageId: "ja",
      title: "t",
      steps: [step],
    };
    const out = applyKanjiSurfaces(lesson);
    const seg = (out.steps[0] as typeof step).promptAnnotation[0];
    expect(seg.surface).toBe("電車");
    expect(seg.reading).toBe("電車");
  });

  // ── 2. Slot rotation ──
  it("places the correct option at slotFor(id, 4)", () => {
    for (const id of ["ja-m13-1-kr-mizu", "ja-m14-2-kr-taberu", "ja-m10-1-kr-ima"]) {
      const step = kanjiReading(id, MIZU);
      expect(step.options[slotFor(id, 4)].id).toBe(step.correctOptionId);
    }
  });

  it("does not concentrate the correct answer in one slot", () => {
    const slots = [0, 0, 0, 0];
    for (let i = 0; i < 120; i++) {
      const step = kanjiReading(`ja-m13-${i}-kr-mizu`, MIZU);
      slots[step.options.findIndex((o) => o.id === step.correctOptionId)] += 1;
    }
    // Same 55% bar as mcq-position-distribution.test.ts.
    expect(Math.max(...slots) / 120).toBeLessThanOrEqual(0.55);
  });

  // ── 3. Atom tagging for FSRS ──
  it("auto-tags exercisedAtoms from the target atom (guide §13.13)", () => {
    const step = kanjiReading("ja-m14-1-kr-taberu", TABERU);
    expect(step.exercisedAtoms).toEqual(["ja-m7-1-v-taberu"]);
  });

  it("is SRS-graded (not a teach step)", async () => {
    const { shouldWriteSrs } = await import(
      "@/features/lesson/data/_stepPredicates"
    );
    expect(shouldWriteSrs(kanjiReading("ja-m14-1-kr-taberu", TABERU))).toBe(true);
  });

  // ── Distractor quality at the factory seam ──
  it("fills distractors with generated near-misses", () => {
    const step = kanjiReading("ja-m14-1-kr-taberu", TABERU);
    const wrong = step.options
      .filter((o) => o.id !== step.correctOptionId)
      .map((o) => o.text);
    expect(wrong).toContain("しょくべる");
    expect(wrong).not.toContain("たべる");
  });

  it("accepts author-supplied distractors, which take precedence", () => {
    const step = kanjiReading("ja-m13-1-kr-mizu", MIZU, {
      distractors: ["みす", "みつ", "むず"],
    });
    const wrong = step.options
      .filter((o) => o.id !== step.correctOptionId)
      .map((o) => o.text)
      .sort();
    expect(wrong).toEqual(["みす", "みつ", "むず"]);
  });

  it("throws when an author distractor equals the answer", () => {
    expect(() =>
      kanjiReading("ja-m13-1-kr-mizu", MIZU, { distractors: ["みず", "みつ", "むず"] }),
    ).toThrow(/equals the correct reading/);
  });

  it("throws when an author distractor is not pure kana (no kanji options, ever)", () => {
    expect(() =>
      kanjiReading("ja-m13-1-kr-mizu", MIZU, { distractors: ["水", "みつ", "むず"] }),
    ).toThrow(/not pure kana/);
  });

  it("throws for an atom with no kanji surface in the rollout catalog", () => {
    // ねこ used to be the example here; 猫 joined the catalog in the
    // 2026-07-28 exposure tier. じゅぎょう (授業) still needs two glyphs that
    // have no entry, so it is the current shape of "not in the catalog".
    expect(() =>
      kanjiReading("ja-m7-1-kr-jugyou", {
        kana: "じゅぎょう",
        meaningEn: "class",
        fromModule: "m7",
      }),
    ).toThrow(/no kanji-eligible surface/);
  });

  it("accepts an explicit kanji override with distractors", () => {
    const step = kanjiReading("ja-m22-1-kr-x", MITTSU, {
      kanji: "三つ",
      distractors: ["ひとつ", "ふたつ", "よっつ"],
    });
    expect(step.kanji).toBe("三つ");
    expect(step.reading).toBe("みっつ");
  });

  it("throws (never invents filler) when the generator can't reach 3 near-misses", () => {
    // 三つ yields only さんつ (wrong on-reading) + みつ (small-tsu dropped).
    // A third would have to be invented, so the factory fails at authoring
    // time and points the author at §13.7 rather than shipping filler.
    expect(() => kanjiReading("ja-m22-1-kr-mittsu", MITTSU)).toThrow(
      /only 2 plausible distractor/,
    );
  });

  it("keeps audioText on the KANA reading (TTS key never follows the display)", () => {
    const step = kanjiReading("ja-m13-1-kr-mizu", MIZU);
    expect(step.audioText).toBe("みず");
  });
});
