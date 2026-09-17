import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { diagnoseModule, type ModuleIR } from "./moduleCompiler";

/**
 * The author ⇄ compiler loop's hard floor: every committed IR must be
 * diagnostics-clean. diagnoseModule existed but had NO caller (found
 * 2026-07-23 — the spec's "loop until zero diagnostics" was unenforced),
 * so gloss-long / gloss-mismatch / density findings never surfaced. This
 * test wires it into the module gate and CI.
 */
const IR_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../languages/ja/curriculum/ir",
);

/** Kinds where the compiler already compensated (padded review) —
 *  surfaced as authoring debt, not a red gate. Everything else is a defect
 *  the compiler could NOT absorb and must block. dialogue-distractor-synth
 *  graduated to ENFORCED 2026-07-23 after all m6 questions were rewritten
 *  with 4 real vocab-echoing options (Spencer: "plainer, use the vocab
 *  word" — no more synthesized 'We can't tell' fillers).
 *
 *  `shrapnel` (TestFlight #183, build 23) joined 2026-09-17 as
 *  INFORMATIONAL, not enforced: even after tightening the rule to two
 *  high-precision tests (retokenize-with-whole-course-lexicon, and a
 *  whole-word — no stemming — span cut), a course-wide scan still turned
 *  up 121 hits across 11 patterns, of which only 1 pattern (8 hits, きかい
 *  in m32/m33, fixed alongside this change) was a real shred. The other
 *  10 patterns (113 hits — んです/そうだ/そうです/たって/いって/せいと/なんだ/
 *  たべすぎた, plus a whole class of だけど→だけ|ど retokenizations caused by
 *  m35's だけ) are coincidental homograph collisions or, in だけ|ど's case,
 *  a "different" retokenization that is not actually a BETTER one — the
 *  underlying tokenization was already correct. Promote to ENFORCED only
 *  after a precision pass removes that noise; until then this is a report,
 *  not a gate. */
const INFORMATIONAL = new Set(["density-short", "shrapnel"]);

describe("compiled IR modules are diagnostics-clean", () => {
  const irFiles = readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.json"));

  it("finds at least one IR module (m6+ pipeline)", () => {
    expect(irFiles.length).toBeGreaterThan(0);
  });

  for (const f of irFiles) {
    it(`${f} has zero enforced diagnostics`, () => {
      const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf8")) as ModuleIR;
      const diags = diagnoseModule(ir).filter((d) => !INFORMATIONAL.has(d.kind));
      expect(
        diags.map((d) => `${d.lesson} [${d.kind}] ${d.detail}`),
      ).toEqual([]);
    });
  }
});
