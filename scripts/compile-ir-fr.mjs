#!/usr/bin/env node
/**
 * compile-ir-fr.mjs — the French IR front door.
 *
 *   node scripts/compile-ir-fr.mjs m1
 *   node scripts/compile-ir-fr.mjs m1 --check     # validate only, emit nothing
 *
 * Reads  src/features/languages/fr/curriculum/ir/m1.ir.yaml
 * Writes src/features/languages/fr/curriculum/m1.ts
 *
 * SIBLING of compile-ir-es.mjs (fr guide §2): same YAML-to-TS-source shape,
 * same "the IR is the only file an author edits" contract. Three deliberate
 * differences:
 *
 *   1. FRAMELESS ONLY. `frame:` must be "none". The FR frame pipeline
 *      (frames-fr-*.mjs, morph-fr.mjs, drafted pools) does not exist yet —
 *      fr guide §9 — and this compiler says so by refusing, not by guessing.
 *   2. The module export is `FR_M<n>_MODULE` (an FrModuleDef: title +
 *      lessons + pathway chrome), because the FR pathway/atoms/placement are
 *      DERIVED by globbing — there is no hand-maintained index to update.
 *      Adding the generated file IS the registration.
 *   3. `FR_M<n>_PLACEMENT` is a FLAT PlacementItem[] whose FIRST item is the
 *      module's screener item (fr/placementBank.ts contract — an ES-shaped
 *      {screener, byModule} object export THROWS there).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { makeAssembler, q } from "./draft/fr-ir/assemble.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const mod = process.argv[2];
const checkOnly = process.argv.includes("--check");
if (!mod || !/^m\d+$/.test(mod)) {
  console.error("usage: node scripts/compile-ir-fr.mjs <module>   (e.g. m1)");
  process.exit(1);
}

const irDir = join(root, "src/features/languages/fr/curriculum/ir");
const yamlPath = join(irDir, `${mod}.ir.yaml`);
if (!existsSync(yamlPath)) {
  console.error(`no FR IR at ${yamlPath}`);
  process.exit(2);
}

let ir;
try {
  ir = parse(readFileSync(yamlPath, "utf8"));
} catch (e) {
  console.error(`YAML parse error in ${yamlPath}:\n${e.message}`);
  process.exit(1);
}

// ─── validation ─────────────────────────────────────────────────────────────

const problems = [];
const need = (cond, msg) => {
  if (!cond) problems.push(msg);
};

need(ir.module === mod, `ir.module is "${ir.module}" but the file is ${mod}.ir.yaml`);
need(typeof ir.title === "string" && ir.title.length > 0, "ir.title is required");
need(
  ir.frame === "none",
  `ir.frame is "${ir.frame}" — the FR frame pipeline is not built (fr guide §9); ` +
    `only frameless phrase modules compile today`,
);
need(Array.isArray(ir.newAtoms) && ir.newAtoms.length > 0, "ir.newAtoms must be a non-empty list");
need(Array.isArray(ir.lessons) && ir.lessons.length > 0, "ir.lessons must be a non-empty list");

if (Array.isArray(ir.lessons)) {
  need(
    ir.lessons.length === 8,
    `fr follows the es module shape (pin F13): 8 lessons; this IR declares ${ir.lessons.length}`,
  );
  for (const l of ir.lessons) {
    need(
      l.template === "free",
      `lesson ${l.n}: template "${l.template}" — a frameless module is free-template only`,
    );
  }
  const selfExplains = ir.lessons.filter((l) =>
    (l.steps ?? []).some((s) => s.kind === "selfExplain"),
  ).length;
  need(
    selfExplains >= 2,
    `fr-quality requires >= 2 selfExplain per module; the IR declares ${selfExplains}`,
  );
  const ids = ir.lessons.map((l) => l.n);
  need(new Set(ids).size === ids.length, `lesson numbers repeat: ${ids.join(", ")}`);
}

// Placement: the engine's test-out threshold is 3/3, so byModule needs >= 3.
if (ir.placement) {
  need(
    (ir.placement.screener ?? []).length === 1,
    `placement.screener must be exactly 1 item (it becomes the FIRST element of the flat FR_M*_PLACEMENT array)`,
  );
  need(
    (ir.placement.byModule ?? []).length >= 3,
    `placement.byModule has ${(ir.placement.byModule ?? []).length} item(s); the engine needs >= 3 to reach its 3/3 threshold`,
  );
  for (const it of [...(ir.placement.screener ?? []), ...(ir.placement.byModule ?? [])]) {
    need(typeof it.id === "string" && it.id.length > 0, `a placement item has no id`);
    need(
      Array.isArray(it.distractors) && it.distractors.length === 3,
      `placement item "${it.id}" needs exactly 3 distractors`,
    );
    need(
      !(it.distractors ?? []).includes(it.correct),
      `placement item "${it.id}" lists its own answer as a distractor`,
    );
  }
} else {
  need(false, "ir.placement is required — a module without placement items cannot be tested out of");
}

if (problems.length) {
  console.error(`FR IR ${mod} — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}

const A = makeAssembler({ moduleId: mod });

// ─── emit ───────────────────────────────────────────────────────────────────
const out = [];
const w = (s) => out.push(s);

w(`/**
 * ${mod}.ts — ${ir.title}
 *
 * GENERATED. Do not hand-edit — regenerate instead:
 *   node scripts/compile-ir-fr.mjs ${mod}
 *
 * The authored source is src/features/languages/fr/curriculum/ir/${mod}.ir.yaml.
 * This is a FRAMELESS phrase module: every sentence is carried literally in
 * the IR (no verb frame, no drafted pool, no local model involved).
 *
 * Registration is DERIVED: fr/courseAtoms.ts, fr/curriculum/index.ts and
 * fr/placementBank.ts each glob curriculum/m*.ts, so this file's existence
 * IS its registration. The export names below are the collectors' contract.
 */`);
w(`import type { LessonContent } from "@/features/lesson/types";`);
w(`import { atom, type FrAtom } from "../courseAtoms";`);
w(`import type { FrModuleDef } from "./index";`);
w(`import type { PlacementItem } from "@/shared/language/types";`);
w(`__FACTORY_IMPORTS__`);
w(``);
w(`const COURSE_ID = "mock-1";`);
w(``);

// atoms
w(`export const FR_${mod.toUpperCase()}_ATOMS: FrAtom[] = [`);
for (const a of ir.newAtoms) {
  const fields = [
    `surface: ${q(a.surface)}`,
    `meaningEn: ${q(a.meaningEn)}`,
    `partOfSpeech: ${q(a.partOfSpeech ?? "other")}`,
    `fromModule: ${q(mod)}`,
    `kind: ${q(a.kind ?? "vocab")}`,
  ];
  if (a.gender) fields.push(`gender: ${q(a.gender)}`);
  if (a.emoji) fields.push(`emoji: ${q(a.emoji)}`);
  if (a.hint) fields.push(`hint: ${q(a.hint)}`);
  if (a.hAspire) fields.push(`hAspire: true`);
  if (a.consonantOnset) fields.push(`consonantOnset: true`);
  if (a.homophoneKey) fields.push(`homophoneKey: ${q(a.homophoneKey)}`);
  w(`  atom({ ${fields.join(", ")} }),`);
}
w(`];`);
w(``);

// lessons (free template only — see the validation above)
function lessonSource({ id, moduleId, title, description, steps }) {
  return [
    `const ${id.toUpperCase().replace(/-/g, "_")}: LessonContent = {`,
    `  id: ${q(id)},`,
    `  moduleId: ${q(moduleId)},`,
    `  courseId: COURSE_ID,`,
    `  languageId: "fr",`,
    `  title: ${q(title)},`,
    `  description: ${q(description)},`,
    `  estimatedMinutes: ${steps.length >= 18 ? 10 : 8},`,
    `  xpReward: 20,`,
    `  steps: [`,
    ...steps,
    `  ],`,
    `};`,
    ``,
  ].join("\n");
}

/**
 * One step of a `free` lesson. A kind this switch does not know is an
 * authoring typo and throws by NAME — silently skipping it would produce a
 * lesson short by one step that passes every count-based gate.
 */
function renderFreeStep(id, s) {
  const { S } = A;
  switch (s.kind) {
    case "info":
      return S.info(id, s.title, s.body, s.variant ?? "grammar");
    case "mcq":
      return S.mcq(id, s.prompt, s.correct, s.distractors, s.why, s.atoms ?? [s.correct]);
    case "textMcq":
      return S.textMcq(id, s.target, s.distractors, s.prompt);
    case "phrase":
      return S.phrase(id, s.meaning, s.text, s.emoji);
    case "match":
      return S.match(id, s.surfaces);
    case "selfExplain":
      return S.selfExplain({ ...s, id });
    case "imageMcq":
      return S.vocabMcq(id, s.target, s.distractors);
    case "buildLit":
      return S.buildLit(id, s);
    case "translateLit":
      return S.translateLit(id, s);
    case "speakLit":
      return S.speakLit(id, s);
    case "listenCompLit":
      return S.listenCompLit(id, s);
    case "listenBuildLit":
      return S.listenBuildLit(id, s);
    case "clozeLit":
      return S.clozeLit(id, s);
    case "dialogueLit":
      return S.dialogueLit(id, s);
    case "silentLetterLit":
      return S.silentLetterLit(id, s);
    case "liaisonListenLit":
      return S.liaisonListenLit(id, s);
    case "genderSortLit":
      return S.genderSortLit(id, s);
    default:
      throw new Error(`${id}: unknown step kind "${s.kind}"`);
  }
}

const lessonNames = [];
for (const spec of ir.lessons) {
  const id = `fr-${mod}-${spec.n}`;
  lessonNames.push(id.toUpperCase().replace(/-/g, "_"));
  const steps = spec.steps.map((s, i) => renderFreeStep(`${id}-${s.id ?? i}`, s));
  w(lessonSource({ id, moduleId: mod, title: spec.title, description: spec.description, steps }));
}

// module definition (the pathway collector's contract — fr/curriculum/index.ts)
w(`export const FR_${mod.toUpperCase()}_MODULE: FrModuleDef = {`);
w(`  title: ${q(ir.title)},`);
if (ir.eyebrow) w(`  eyebrow: ${q(ir.eyebrow)},`);
if (ir.summary) w(`  summary: ${q(ir.summary)},`);
if (ir.accent) w(`  accent: { from: ${q(ir.accent.from)}, to: ${q(ir.accent.to)} },`);
w(`  lessons: [`);
for (const n of lessonNames) w(`    ${n},`);
w(`  ],`);
w(`};`);
w(``);

// placement — FLAT array, screener item FIRST (fr/placementBank.ts contract)
{
  const item = (it) =>
    [
      `  {`,
      `    id: ${q(it.id)},`,
      `    moduleId: ${q(mod)},`,
      `    build: () =>`,
      `      sentenceMcq({`,
      `        id: ${q(it.id)},`,
      `        prompt: ${q(it.prompt)},`,
      `        correctText: ${q(it.correct)},`,
      `        distractorsText: [${it.distractors.map(q).join(", ")}],`,
      `      }),`,
      `  },`,
    ].join("\n");

  w(`export const FR_${mod.toUpperCase()}_PLACEMENT: PlacementItem[] = [`);
  w(`  // FIRST item = the module's Stage-1 screener item (placementBank contract).`);
  for (const it of ir.placement.screener) w(item(it));
  for (const it of ir.placement.byModule) w(item(it));
  w(`];`);
  w(``);
}

let source = out.join("\n") + "\n";

// Emit only the factory imports the body actually calls.
{
  const FACTORIES = [
    "infoStep",
    "vocab",
    "vocabMcq",
    "vocabTextMcq",
    "sentenceMcq",
    "build",
    "cloze",
    "translateStep",
    "speaking",
    "listeningCompSentence",
    "listeningBuildSentence",
    "matchPairs",
    "dialogueListen",
    "selfExplain",
    "silentLetter",
    "liaisonListen",
    "genderSort",
  ];
  const body = source.split("__FACTORY_IMPORTS__")[1] ?? "";
  const used = FACTORIES.filter((f) => new RegExp(`(?<![A-Za-z])${f}\\(`).test(body));
  const importBlock = [`import {`, ...used.map((f) => `  ${f},`), `} from "../grammarHelpers";`].join("\n");
  source = source.replace("__FACTORY_IMPORTS__", importBlock);
}

if (checkOnly) {
  console.log(`FR IR ${mod}: valid. ${ir.lessons.length} lessons, ${ir.newAtoms.length} atoms. Nothing written.`);
  process.exit(0);
}

const outPath = join(root, "src/features/languages/fr/curriculum", `${mod}.ts`);
writeFileSync(outPath, source);
console.log(
  `compiled ${mod}: ${ir.lessons.length} lessons, ${ir.newAtoms.length} atoms → ${outPath.replace(root + "/", "")}`,
);
