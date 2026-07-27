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
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
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

// PRIOR VOCABULARY — what the learner has actually met before this module.
//
// compileModule() is a pure function over one module's IR, so it had no way to
// know this and fell back to "any atom not declared new by THIS module is
// already known". That is false for every atom belonging to a LATER module, and
// the effect reached learners: image-MCQ debuts and filler drew distractors
// from the entire registry, so untaught words (えいが, りょこう, ポスト …) showed
// up as wrong answers, and だいがく — an m19 atom — became m13's running example.
//
// `courseAtoms.fromModule` cannot answer this: those tags are stale by
// construction (see the comment in scripts/authoring-context.mjs). Earlier IR
// modules are the ground truth, so compute the union here, where the
// filesystem is available, and hand it to the compiler.
const modIdx = Number(mod.replace(/^m/, ""));
const priorVocab = new Set();
const priorAtoms = new Map();
if (Number.isFinite(modIdx)) {
  for (const f of readdirSync(dir)) {
    const m = f.match(/^m(\d+)\.ir\.yaml$/);
    if (!m || Number(m[1]) >= modIdx) continue;
    const earlier = parse(readFileSync(join(dir, f), "utf8"));
    for (const a of earlier.newAtoms ?? []) {
      if (!a.kana) continue;
      priorVocab.add(a.kana);
      // Carry the whole atom, not just the kana. Most IR atoms are deliberately
      // NOT registered in courseAtoms (registering inflections regresses
      // flashcard import), so a later module's compiler — which knows only
      // courseAtoms ∪ its own newAtoms — could not see them at all. Their
      // surfaces shattered into junk tiles, and worse, sometimes split SILENTLY
      // into real words: 「ふるかった」 → ふる (to fall) + かった (bought), no
      // diagnostic, wrong SRS credit. m15 had to avoid nine earlier words to
      // dodge this.
      if (!priorAtoms.has(a.kana)) priorAtoms.set(a.kana, a);
    }
    for (const lesson of earlier.lessons ?? []) {
      for (const kana of lesson.introduces ?? []) priorVocab.add(kana);
      // A reviewPool ASSERTS the word is already known, so it counts as met.
      for (const kana of lesson.reviewPool ?? []) priorVocab.add(kana);
    }
  }

  // m1-m5 are hand-written TS, not IR — without them m6 would start from an
  // empty vocabulary. Same derivation authoring-context.mjs uses: a word is
  // known if it literally appears in an earlier module's source.
  const curDir = join(process.cwd(), "src/features/languages/ja/curriculum");
  const early = readdirSync(curDir).filter((f) => {
    const m = f.match(/^m(\d+)-neo.*\.ts$/);
    return m && Number(m[1]) < modIdx && !f.includes(".test.");
  });
  if (early.length) {
    const corpus = early.map((f) => readFileSync(join(curDir, f), "utf8")).join("\n");
    const atomsSrc = readFileSync(
      join(process.cwd(), "src/features/languages/ja/courseAtoms.ts"),
      "utf8",
    );
    for (const m of atomsSrc.matchAll(/kana:\s*"([^"]+)"/g)) {
      if (corpus.includes(m[1])) priorVocab.add(m[1]);
    }
  }
}
ir.priorVocab = [...priorVocab].sort();
ir.priorAtoms = [...priorAtoms.values()];

writeFileSync(jsonPath, JSON.stringify(ir, null, 2) + "\n");
const lessons = ir.lessons?.length ?? 0;
const atoms = ir.newAtoms?.length ?? 0;
console.log(
  `compiled ${mod}: ${lessons} lessons, ${atoms} new atoms → ${jsonPath.replace(process.cwd() + "/", "")}`,
);
