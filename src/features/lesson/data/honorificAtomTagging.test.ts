import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { compileModule } from "./moduleCompiler";

/**
 * The honorific さん is a homograph of the numeral 三.
 *
 * Track A credited every 「たなかさん」 sentence as practice of "three" — 31
 * steps across m7–m11. Nothing looked broken: the learner just quietly stopped
 * being shown 三, because FSRS believed they had reviewed it dozens of times.
 * That is the dangerous shape of this bug class — a mistagged atom degrades
 * scheduling silently and only shows up as "why do I not remember three?".
 *
 * An honorific always attaches to a person's name, so a さん token preceded by
 * a name is never the numeral.
 */

const IR_DIR = join(__dirname, "..", "..", "languages", "ja", "curriculum", "ir");
const THREE = /m5-1-v-3$/;
const NUMERAL_CONTEXT = /さん(じ|じゅう|ぼん|にん|びき|えん|つ)|^[いちにさんよごろくななはちきゅうじゅう\s]+$/;

describe("honorific さん is not the numeral 三", () => {
  const offenders: string[] = [];

  for (const file of readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.json"))) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    for (const lesson of compileModule(require(join(IR_DIR, file)))) {
      for (const step of lesson.steps) {
        const atoms = (step as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
        if (!atoms.some((a) => THREE.test(a))) continue;

        const blob = JSON.stringify(step);
        if (!blob.includes("さん")) continue;
        // A step that also counts or lists numbers is legitimately exercising 三.
        const target = (step as { targetSentence?: string }).targetSentence ?? "";
        if (NUMERAL_CONTEXT.test(blob) || NUMERAL_CONTEXT.test(target)) continue;

        offenders.push(`${lesson.id}: ${target || step.type}`);
      }
    }
  }

  it("credits no honorific as a review of 三", () => {
    expect(offenders).toEqual([]);
  });
});
