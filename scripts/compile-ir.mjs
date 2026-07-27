#!/usr/bin/env node
/**
 * IR build step (phase-2 front door): parse an authored content-IR YAML and
 * emit the JSON the TS module compiler imports. The app/tests never import
 * YAML — they import the committed `.json`, and `compileModule(json)` builds
 * the LessonContent[] at load. Keeps YAML as the human-reviewable source of
 * truth while staying zero-runtime-YAML.
 *
 *   node scripts/compile-ir.mjs m6
 *
 * Reads  src/features/languages/ja/curriculum/ir/m6.ir.yaml
 * Writes src/features/languages/ja/curriculum/ir/m6.ir.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const mod = process.argv[2];
if (!mod) {
  console.error("usage: node scripts/compile-ir.mjs <module>  (e.g. m6)");
  process.exit(1);
}
const dir = join(process.cwd(), "src/features/languages/ja/curriculum/ir");
const yamlPath = join(dir, `${mod}.ir.yaml`);
const jsonPath = join(dir, `${mod}.ir.json`);

const raw = readFileSync(yamlPath, "utf8");
let ir;
try {
  ir = parse(raw);
} catch (e) {
  console.error(`YAML parse error in ${yamlPath}:\n${e.message}`);
  process.exit(1);
}

// Drop the free-text notes block from the compiled artifact (authoring-only).
delete ir.notes;

writeFileSync(jsonPath, JSON.stringify(ir, null, 2) + "\n");
const lessons = ir.lessons?.length ?? 0;
const atoms = ir.newAtoms?.length ?? 0;
console.log(
  `compiled ${mod}: ${lessons} lessons, ${atoms} new atoms → ${jsonPath.replace(process.cwd() + "/", "")}`,
);
