import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  compileModule,
  type ModuleIR,
  type IRBeat,
} from "@/features/lesson/data/moduleCompiler";
import { REGISTER_AUDIENCES } from "../registerAudiences";

/**
 * REGISTER SCAFFOLDS ARE ISOLATED, AND THEY FADE (Spencer 2026-07-27).
 *
 *   "these lesson types and ways of teaching should be isolated to register,
 *    and ultimately should fade out of active teaching as they learn the
 *    register of said words"
 *
 * Two properties, both machine-checked here so neither depends on an author
 * remembering:
 *
 * ISOLATION — the audience picture, politeness meter, cheat sheet and vocative
 * frame may only ever reach a step through a `kind: register` beat. An
 * ordinary teaching lesson cannot grow an audience emoji, because no other
 * beat produces one. This keeps register pedagogy out of the general authoring
 * surface entirely: authors of non-register lessons never have to think about
 * these fields, and the general invariants stay unpolluted.
 *
 * FADE — scaffolding decreases as a word is learned, mirroring
 * conjugation_transform's LEARN/KNOW/OWN ladder. Stage 1 (cheat sheet) fires
 * at most ONCE per word across the whole course; a word that has reached
 * stage 3 must not reappear at a lower stage. Once it is through stage 3 the
 * word is ordinary vocabulary and belongs in ordinary beats.
 */
const IR_DIR = join(dirname(fileURLToPath(import.meta.url)), "../curriculum/ir");

const SCAFFOLD_FIELDS = [
  "audienceEmoji",
  "audienceLabel",
  "politenessHint",
  "referenceTable",
  "frameBefore",
  "frameAfter",
] as const;

type Loaded = { name: string; ir: ModuleIR };

function allModules(): Loaded[] {
  return readdirSync(IR_DIR)
    .filter((f) => f.endsWith(".ir.json"))
    .map((f) => ({
      name: f.replace(".ir.json", ""),
      ir: JSON.parse(readFileSync(join(IR_DIR, f), "utf8")) as ModuleIR,
    }));
}

const registerBeats = (ir: ModuleIR) =>
  ir.lessons.flatMap((l) =>
    (l.beats as IRBeat[]).filter(
      (b): b is Extract<IRBeat, { kind: "register" }> => b.kind === "register",
    ),
  );

describe("register scaffolds are isolated to register beats", () => {
  for (const { name, ir } of allModules()) {
    it(`${name}: no scaffold field reaches a step without a register beat`, () => {
      const hasRegisterBeats = registerBeats(ir).length > 0;
      const offenders: string[] = [];

      for (const lesson of compileModule(ir)) {
        for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
          const used = SCAFFOLD_FIELDS.filter((f) => step[f] !== undefined);
          if (used.length && !hasRegisterBeats)
            offenders.push(
              `${String(step.id)} carries ${used.join("/")} but ${name} authors no register beats`,
            );
        }
      }
      expect(offenders).toEqual([]);
    });

    it(`${name}: every register beat names a known audience`, () => {
      const bad = registerBeats(ir)
        .filter((b) => !REGISTER_AUDIENCES[b.audience])
        .map((b) => b.audience);
      expect(bad).toEqual([]);
    });

    it(`${name}: a register beat's answer is among its own options`, () => {
      const bad = registerBeats(ir)
        .filter((b) => !b.options.includes(b.answer))
        .map((b) => `${b.answer} ∉ [${b.options.join(", ")}]`);
      expect(bad).toEqual([]);
    });

    it(`${name}: stage 1 carries a cheat sheet, stage 3 carries a frame`, () => {
      const bad: string[] = [];
      for (const b of registerBeats(ir)) {
        if (b.stage === 1 && !b.cheatSheet)
          bad.push(`${b.answer}: stage 1 without a cheat sheet — nothing to learn from`);
        if (b.stage === 3 && !b.frame)
          bad.push(
            `${b.answer}: stage 3 without a vocative frame — with no picture AND no frame there is no cue at all`,
          );
        if (b.stage !== 3 && b.frame)
          bad.push(`${b.answer}: frame belongs to stage 3 only`);
        if (b.stage !== 1 && b.cheatSheet)
          bad.push(`${b.answer}: cheat sheet belongs to stage 1 only`);
      }
      expect(bad).toEqual([]);
    });
  }

  it("scaffolding fades: stage 1 fires once per word, and stages never regress", () => {
    // Course-wide, in module order — the fade is a property of the whole
    // curriculum, not of any single module.
    const mods = allModules().sort(
      (a, b) => (parseInt(a.name.slice(1)) || 0) - (parseInt(b.name.slice(1)) || 0),
    );
    const stage1Count = new Map<string, number>();
    const highWater = new Map<string, number>();
    const problems: string[] = [];

    for (const { name, ir } of mods) {
      for (const b of registerBeats(ir)) {
        if (b.stage === 1) {
          stage1Count.set(b.answer, (stage1Count.get(b.answer) ?? 0) + 1);
          if ((stage1Count.get(b.answer) ?? 0) > 1)
            problems.push(
              `${name}: "${b.answer}" gets a stage-1 cheat sheet again — stage 1 is a first exposure, once`,
            );
        }
        const seen = highWater.get(b.answer) ?? 0;
        if (b.stage < seen)
          problems.push(
            `${name}: "${b.answer}" drops from stage ${seen} back to ${b.stage} — scaffolding must fade, not return`,
          );
        highWater.set(b.answer, Math.max(seen, b.stage));
      }
    }
    expect(problems).toEqual([]);
  });
});
