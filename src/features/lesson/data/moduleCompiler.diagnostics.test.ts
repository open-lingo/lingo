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
 *  word" — no more synthesized 'We can't tell' fillers). */
const INFORMATIONAL = new Set(["density-short"]);

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
