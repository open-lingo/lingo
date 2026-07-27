import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { compileModule } from "./moduleCompiler";
import type { BuildSentenceStep, LessonContent } from "../types";

/**
 * A beat holding two sentences must not compile into a run-on.
 *
 * `tokenize` stripped all punctuation before splitting on whitespace, so
 * 「…だった。ちょっと たかい。」 lost the only thing separating the two clauses
 * and emitted ろくじゅうえんだった + ちょっと glued together — a sentence the
 * learner had to assemble, and hear, as one ungrammatical run. Eight beats
 * across m8–m11 shipped that way and no guard noticed, because every check
 * ran on text that had already been stripped.
 *
 * The boundary now rides on the last tile of each non-final sentence
 * (だった。), which keeps the break visible without costing an extra tap.
 */

const IR_DIR = join(
  __dirname,
  "..",
  "..",
  "languages",
  "ja",
  "curriculum",
  "ir",
);

function compiledModules(): { module: string; lessons: LessonContent[] }[] {
  return readdirSync(IR_DIR)
    .filter((f) => f.endsWith(".ir.json"))
    .map((f) => ({
      module: f.replace(".ir.json", ""),
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      lessons: compileModule(require(join(IR_DIR, f))),
    }));
}

/** The `ja` of every authored beat that compiles to a build step. */
function collectBuildJa(module: string): Set<string> {
  const yaml = readFileSync(join(IR_DIR, `${module}.ir.yaml`), "utf-8");
  const out = new Set<string>();
  for (const line of yaml.split("\n")) {
    if (!/mode:\s*build/.test(line)) continue;
    const ja = line.match(/ja:\s*"([^"]*)"/);
    if (ja) out.add(ja[1]);
  }
  return out;
}

function buildSteps(): { where: string; step: BuildSentenceStep }[] {
  return compiledModules().flatMap(({ lessons }) =>
    lessons.flatMap((lesson) =>
      lesson.steps
        .filter((s): s is BuildSentenceStep => s.type === "build_sentence")
        .map((step) => ({ where: lesson.id, step })),
    ),
  );
}

describe("build_sentence sentence boundaries", () => {
  const steps = buildSteps();

  it("has build steps to check", () => {
    expect(steps.length).toBeGreaterThan(50);
  });

  it("keeps every multi-sentence beat multi-sentence", () => {
    // Exact rather than heuristic: go back to the authored `ja` and require the
    // compiled target to carry the same number of internal boundaries. A regex
    // sniffing for run-ons in the output can't tell 「しりますか」 (one sentence)
    // from 「たかいですかいません」 (two, fused).
    const offenders: string[] = [];
    for (const { module, lessons } of compiledModules()) {
      const authored = collectBuildJa(module);
      for (const ja of authored) {
        const internal = (ja.match(/[。？！](?=.)/g) ?? []).length;
        if (!internal) continue;
        const target = lessons
          .flatMap((l) => l.steps)
          .filter((s): s is BuildSentenceStep => s.type === "build_sentence")
          .find(
            (s) =>
              s.targetSentence.replace(/[。、？！　\s]/g, "") ===
              ja.replace(/[。、？！　\s]/g, ""),
          );
        if (!target) continue;
        const kept = (target.targetSentence.match(/[。？！]/g) ?? []).length;
        if (kept !== internal) {
          offenders.push(`${module} ${ja} → ${target.targetSentence}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("marks every internal boundary on the preceding tile", () => {
    for (const { where, step } of steps) {
      const marks = step.targetSentence.match(/[。？！]/g) ?? [];
      if (!marks.length) continue;
      const onTiles = step.tiles.filter((t) => /[。？！]$/.test(t)).length;
      expect(onTiles, `${where}: ${step.targetSentence}`).toBe(marks.length);
    }
  });

  it("still drops the trailing mark", () => {
    for (const { where, step } of steps) {
      expect(step.targetSentence, where).not.toMatch(/[。？！]$/);
    }
  });

  it("keeps tiles a partition of the target", () => {
    // Register beats reuse this step type as a 4-way picker — the tile bank is
    // a set of alternatives, not the pieces of one sentence.
    const assembled = steps.filter(({ step }) => step.correctOrder.length > 1);
    for (const { where, step } of assembled) {
      const joined = step.tiles.join("").replace(/[　\s]/g, "");
      expect(joined, `${where}: ${step.targetSentence}`).toBe(
        step.targetSentence.replace(/[　\s]/g, ""),
      );
    }
  });
});
