import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { diagnoseModule } from "./moduleCompiler";
import type { ModuleIR } from "./moduleCompiler";

/**
 * A word an earlier module taught must be usable by every later module.
 *
 * Most IR atoms are deliberately NOT registered in `courseAtoms` — registering
 * inflected forms regresses flashcard import and `annotateJapaneseText`. But
 * `compileModule` knew only courseAtoms ∪ its own newAtoms, so everything m11-m14
 * taught IR-only was invisible from m15 onward.
 *
 * The loud version of the failure is a shattered tile bank. The quiet version is
 * worse: 「ふるかった」 splits into ふる "to fall" + かった "bought" — two real
 * words, no diagnostic, and SRS credit written to the wrong atoms. m15 dodged it
 * by avoiding nine words it had every right to reuse, which is the kind of
 * workaround that silently narrows a course.
 *
 * `ir.priorAtoms` carries those records forward; this asserts the compiler can
 * actually see them.
 */

const IR_DIR = join(__dirname, "..", "..", "languages", "ja", "curriculum", "ir");

function moduleIndex(file: string): number {
  return Number(file.match(/^m(\d+)\./)?.[1] ?? NaN);
}

describe("earlier IR vocabulary is visible to later modules", () => {
  const files = readdirSync(IR_DIR)
    .filter((f) => f.endsWith(".ir.json"))
    .sort((a, b) => moduleIndex(a) - moduleIndex(b));
  const latest = files[files.length - 1];
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ir: ModuleIR & { priorAtoms?: { kana: string }[] } = require(join(IR_DIR, latest));

  it("carries prior IR atoms into the newest module", () => {
    expect(ir.priorAtoms?.length ?? 0).toBeGreaterThan(50);
  });

  it("tokenizes a sentence built from prior IR-only vocabulary", () => {
    // Sample real surfaces rather than hard-coding: any word an earlier module
    // declared should be buildable now.
    const sample = (ir.priorAtoms ?? [])
      .map((a) => a.kana)
      .filter((k) => [...k].length >= 3)
      .slice(0, 12);
    expect(sample.length).toBeGreaterThan(3);

    const probe = JSON.parse(JSON.stringify(ir)) as ModuleIR;
    probe.lessons[0].beats.push(
      ...sample.map((kana) => ({
        kind: "sentence" as const,
        ja: `${kana}。`,
        en: "probe",
        mode: "build" as const,
      })),
    );

    const unbuildable = diagnoseModule(probe).filter((d) =>
      JSON.stringify(d).includes("unbuildable"),
    );
    expect(unbuildable).toEqual([]);
  });
});
