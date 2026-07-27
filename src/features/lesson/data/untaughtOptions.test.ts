import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { compileModule } from "./moduleCompiler";

/**
 * A learner must never meet a word for the first time as a WRONG ANSWER.
 *
 * `compileModule` only ever sees one module's IR, so it treated "not declared
 * new by this module" as "already known" — which is false for every atom
 * belonging to a LATER module. Distractor pools drew from the whole registry,
 * so untaught words (えいが, りょこう, ポスト …) shipped as options in picture
 * debuts and filler MCQs across every IR module, and だいがく — an m19 atom —
 * became m13's running example.
 *
 * The fix is `ir.priorVocab`: the union of what earlier modules actually
 * taught, computed by compile-ir.mjs where the filesystem is available.
 * `courseAtoms.fromModule` cannot serve — those tags are stale by construction.
 *
 * This guard fails on the SYMPTOM rather than the mechanism, so it keeps
 * holding if the pools are ever rebuilt a different way.
 */

const IR_DIR = join(__dirname, "..", "..", "languages", "ja", "curriculum", "ir");
const KANA_ONLY = /^[ぁ-んァ-ヴー]+$/;

type Module = { priorVocab?: string[]; newAtoms?: { kana: string }[] };

describe("no untaught word ships as an option", () => {
  const offenders: string[] = [];
  let checked = 0;

  for (const file of readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.json"))) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ir: Module = require(join(IR_DIR, file));
    const met = new Set([
      ...(ir.priorVocab ?? []),
      ...(ir.newAtoms ?? []).map((a) => a.kana),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    for (const lesson of compileModule(require(join(IR_DIR, file)))) {
      for (const step of lesson.steps) {
        const s = step as unknown as {
          type: string;
          options?: { text: string }[];
        };
        if (s.type !== "word_image_mcq" && s.type !== "multiple_choice") continue;
        for (const option of s.options ?? []) {
          if (!KANA_ONLY.test(option.text)) continue;
          checked++;
          if (!met.has(option.text)) {
            offenders.push(`${lesson.id}: ${option.text}`);
          }
        }
      }
    }
  }

  it("checks a meaningful number of options", () => {
    expect(checked).toBeGreaterThan(500);
  });

  it("draws every option from vocabulary the learner has met", () => {
    expect(
      offenders.slice(0, 20),
      "Distractor pools must be filtered by ir.priorVocab + this module's own " +
        "new atoms. If a module legitimately needs the word, teach it there.",
    ).toEqual([]);
  });
});
