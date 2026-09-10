import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  diagnoseModule,
  type ModuleIR,
} from "@/features/lesson/data/moduleCompiler";

/**
 * Curriculum-project mirror of
 * `src/features/lesson/data/moduleCompiler.diagnostics.test.ts`.
 *
 * That file lives in the isolated `app` project, so the per-module JA gate
 * (`npx vitest run --project curriculum src/features/languages/ja`) never ran
 * it — m40 landed on 2026-09-10 with three `challenge-not-novel` findings
 * (invariant 26: a challenge beat must combine ≥3 genuinely present grammar
 * points) that only surfaced later. Same walk, same enforced set, so an
 * author sees the finding while the module is still in their hands.
 */
const IR_DIR = join(dirname(fileURLToPath(import.meta.url)), "../curriculum/ir");
const INFORMATIONAL = new Set(["density-short"]);

describe("JA compiled IR is diagnostics-clean (curriculum-project gate)", () => {
  const irFiles = readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.json"));
  it("finds IR modules", () => {
    expect(irFiles.length).toBeGreaterThan(0);
  });
  for (const f of irFiles) {
    it(`${f} has zero enforced diagnostics`, () => {
      const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf8")) as ModuleIR;
      const diags = diagnoseModule(ir).filter((d) => !INFORMATIONAL.has(d.kind));
      expect(diags.map((d) => `${d.lesson} [${d.kind}] ${d.detail}`)).toEqual([]);
    });
  }
});
