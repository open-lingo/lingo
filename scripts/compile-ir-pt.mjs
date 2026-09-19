#!/usr/bin/env node
/**
 * compile-ir-pt.mjs — the Portuguese IR front door.
 *
 *   node scripts/compile-ir-pt.mjs m1
 *   node scripts/compile-ir-pt.mjs m1 --check     # validate only, emit nothing
 *
 * Reads  src/features/languages/pt/curriculum/ir/m1.ir.yaml
 * Writes src/features/languages/pt/curriculum/m1.ts
 *
 * SIBLING of compile-ir-es.mjs — same YAML-to-TS-source shape, same "the IR
 * is the only file an author edits, the generated .ts is never hand-edited"
 * contract. One deliberate, permanent difference (not a temporary gap the
 * way FR's own frameless-for-now state is):
 *
 *   PT IS FRAMELESS ONLY, BY DESIGN. `docs/pt-course-design-2026-09-18.md`
 *   §1 row 1 decides PT's whole authoring pipeline up front: an agent drafts
 *   IR directly against a brief, no `frames-pt-*.mjs` verb-cell generator,
 *   no `morph-pt.mjs`, no drafted-pool JSON — ever. So unlike ES (which
 *   branches on `ir.frame` between a frame-drawing mode and a frameless
 *   "phrase module" mode) or even FR (whose compiler is frameless only
 *   because the frame half hasn't been built yet), this compiler has no
 *   frame branch to grow into. `ir.frame` is not a field PT's IR schema
 *   has at all — see the validation below.
 *
 * Every lesson uses the `free` template (an explicit step list the IR
 * author writes) — PT has no `topic` template, because `topic` exists in ES
 * to assemble 3 frame-drawn anchors into a fixed 20-step arc, and PT never
 * draws from a frame.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { makeAssembler, q } from "./draft/pt-ir/assemble.mjs";
import { freeLesson } from "./draft/pt-ir/templates.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// PT modules are named "mN" like ES/FR. The one exception is `_smoke`, a
// throwaway fixture used to prove this compiler end to end without
// committing content under an "mN" name it doesn't own (see the repo-root
// smoke test in this lane's report) — real content modules are always mN.
const MOD_RE = /^(m\d+|_smoke)$/;

const mod = process.argv[2];
const checkOnly = process.argv.includes("--check");
if (!mod || !MOD_RE.test(mod)) {
  console.error("usage: node scripts/compile-ir-pt.mjs <module>   (e.g. m1)");
  process.exit(1);
}

const irDir = join(root, "src/features/languages/pt/curriculum/ir");
const yamlPath = join(irDir, `${mod}.ir.yaml`);
if (!existsSync(yamlPath)) {
  console.error(`no PT IR at ${yamlPath}`);
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
// Same "most useful message first" ordering ES/FR use: a shape problem
// makes every later complaint noise.

const problems = [];
const need = (cond, msg) => {
  if (!cond) problems.push(msg);
};

need(ir.module === mod, `ir.module is "${ir.module}" but the file is ${mod}.ir.yaml`);
need(typeof ir.title === "string" && ir.title.length > 0, "ir.title is required");
// PT's IR schema has no `frame` field at all — it is not "none" the way an
// ES phrase module declares, it simply does not exist. An author who
// copy-pastes an ES/FR IR header and leaves `frame: none` behind gets a
// named error here rather than a silently-ignored field.
need(
  ir.frame === undefined,
  `ir.frame is set to "${ir.frame}" but the PT compiler has no frame concept ` +
    `(design doc §1 row 1 — PT is frameless-only by design); remove the field`,
);
need(Array.isArray(ir.newAtoms) && ir.newAtoms.length > 0, "ir.newAtoms must be a non-empty list");
need(Array.isArray(ir.lessons) && ir.lessons.length > 0, "ir.lessons must be a non-empty list");

if (Array.isArray(ir.lessons)) {
  for (const l of ir.lessons) {
    need(
      l.template === "free",
      `lesson ${l.n}: template "${l.template}" — PT has no "topic" template (no frame to draw ` +
        `anchors from); every lesson must be "free"`,
    );
  }

  // §13 doctrine (2026-08-24 ES wave) is PT's ONLY lesson-count discipline —
  // there is no legacy 8-lesson PT content to stay compatible with, so
  // unlike compile-ir-es.mjs there is no pre-§13 branch here at all.
  // `expectedLessonCount` + `checkpoint` are always required.
  need(
    typeof ir.expectedLessonCount === "number",
    "ir.expectedLessonCount is required (PT's only lesson-count discipline is the §13 doctrine)",
  );
  if (typeof ir.expectedLessonCount === "number") {
    need(
      ir.lessons.length === ir.expectedLessonCount,
      `ir declares expectedLessonCount ${ir.expectedLessonCount} but carries ${ir.lessons.length} lessons`,
    );
  }
  need(
    typeof ir.checkpoint === "number" &&
      ir.checkpoint > 1 &&
      ir.checkpoint < ir.lessons.length,
    `a PT module needs ir.checkpoint (1-based, strictly inside the module); got ${ir.checkpoint} ` +
      `(this is impossible for a module with fewer than 3 lessons — checkpoint must be > 1 and < lessons.length)`,
  );
  const last = ir.lessons[ir.lessons.length - 1];
  const lastStep = (last?.steps ?? [])[(last?.steps ?? []).length - 1];
  need(
    lastStep?.kind === "sim",
    `the last (mastery) lesson must END on a sim — the module ends on a conversation, not a grid (§13.9 law 7)`,
  );
  const ids = ir.lessons.map((l) => l.n);
  need(
    new Set(ids).size === ids.length,
    `lesson numbers repeat: ${ids.join(", ")}`,
  );
}

// The placement engine's threshold is 3/3 correct, so a bank with fewer than
// three module items can never be passed and silently makes the module
// impossible to test out of.
if (ir.placement) {
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
}

if (problems.length) {
  console.error(`PT IR ${mod} — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}

const A = makeAssembler({ moduleId: mod });

// ─── emit ───────────────────────────────────────────────────────────────────
const out = [];
const w = (s) => out.push(s);

w(
  `/**
 * ${mod}.ts — ${ir.title}
 *
 * GENERATED. Do not hand-edit — regenerate instead:
 *   node scripts/compile-ir-pt.mjs ${mod}
 *
 * The authored source is src/features/languages/pt/curriculum/ir/${mod}.ir.yaml.
 * PT is a FRAMELESS-ONLY course (design doc §1 row 1): every sentence here
 * is carried literally in the IR — no verb frame, no drafted pool, no local
 * model involved, ever.
 */`,
);
w(`import type { LessonContent } from "@/features/lesson/types";`);
w(`import { atom, type PtAtom } from "../courseAtoms";`);
if (ir.placement) w(`import type { PlacementItem } from "@/shared/language/types";`);
// Filled in at the end with only the factories the body actually calls — an
// unused import is a tsc error under noUnusedLocals.
w(`__FACTORY_IMPORTS__`);
w(``);
w(`const COURSE_ID = "mock-1";`);
w(``);

// atoms
w(`export const PT_${mod.toUpperCase()}_ATOMS: PtAtom[] = [`);
for (const a of ir.newAtoms) {
  const fields = [
    `surface: ${q(a.surface)}`,
    `meaningEn: ${q(a.meaningEn)}`,
    `partOfSpeech: ${q(a.partOfSpeech ?? "verb")}`,
    `fromModule: ${q(mod)}`,
    `kind: ${q(a.kind ?? "vocab")}`,
  ];
  // Optional card-art / pronunciation / agreement fields.
  if (a.gender) fields.push(`gender: ${q(a.gender)}`);
  if (a.emoji) fields.push(`emoji: ${q(a.emoji)}`);
  if (a.hint) fields.push(`hint: ${q(a.hint)}`);
  w(`  atom({ ${fields.join(", ")} }),`);
}
w(`];`);
w(``);

// lessons — `free` template only (validated above; every other value for
// `spec.template` is already a compile error before we get here).
const lessonNames = [];
for (const spec of ir.lessons) {
  const id = `pt-${mod}-${spec.n}`;
  lessonNames.push(id.toUpperCase().replace(/-/g, "_"));
  w(freeLesson(A, { ...spec, moduleId: mod }, renderFreeStep));
}

w(`export const PT_${mod.toUpperCase()}_LESSONS: LessonContent[] = [`);
for (const n of lessonNames) w(`  ${n},`);
w(`];`);
w(``);

w(`/** 1-based position of the zero-new checkpoint lesson (pt-quality reads this). */`);
w(`export const PT_${mod.toUpperCase()}_CHECKPOINT_INDEX = ${ir.checkpoint};`);
w(``);

/**
 * The placement / test-out bank. Emitted from the IR rather than
 * hand-written beside the module, same reasoning as ES: it is the same
 * judgment as the lessons — which facts stand for "you already know this
 * module" — and splitting judgment across two files invites drift.
 */
if (ir.placement) {
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

  w(`export const PT_${mod.toUpperCase()}_PLACEMENT: {`);
  w(`  screener: PlacementItem[];`);
  w(`  byModule: PlacementItem[];`);
  w(`} = {`);
  w(`  screener: [`);
  for (const it of ir.placement.screener ?? []) w(item(it));
  w(`  ],`);
  w(`  byModule: [`);
  for (const it of ir.placement.byModule ?? []) w(item(it));
  w(`  ],`);
  w(`};`);
  w(``);
}

/**
 * One step of a `free` lesson. Every kind here maps 1:1 onto an emitter in
 * pt-ir/assemble.mjs; a kind this switch does not know is an authoring typo
 * and throws by NAME, because the alternative — silently skipping it —
 * produces a lesson that is short by one step and passes every count-based
 * gate that does not happen to notice.
 *
 * Unlike compile-ir-es.mjs's `renderFreeStep`, there is no `draw()` helper
 * and no frame-drawing cases (build/translate/speaking/cloze/listenComp/
 * listenBuild/formMcq) — PT has no frame to draw from, so those kinds simply
 * do not exist here; an IR that writes one of them falls through to the
 * `default` and fails by name.
 */
function renderFreeStep(A, id, s) {
  switch (s.kind) {
    case "info":
      return A.S.info(id, s.title, s.body, s.variant ?? "grammar");
    case "mcq":
      return A.S.mcq(id, s.prompt, s.correct, s.distractors, s.why, s.atoms ?? [s.correct]);
    case "textMcq":
      return A.S.textMcq(id, s.target, s.distractors, s.prompt);
    case "phrase":
      return A.S.phrase(id, s.meaning, s.text, s.emoji);
    case "match":
      return A.S.match(id, s.surfaces);
    case "reviewMatch":
      return A.S.reviewMatch(id, `${id}-seed`);
    case "capstoneMatch":
      return A.S.capstoneMatch(id, s.entries);
    case "selfExplain":
      return A.S.selfExplain({ ...s, id });
    // ── literal beats (frameless; see pt-ir/assemble.mjs) ──
    case "imageMcq":
      return A.S.vocabMcq(id, s.target, s.distractors);
    case "buildLit":
      return A.S.buildLit(id, s);
    case "translateLit":
      return A.S.translateLit(id, s);
    case "speakLit":
      return A.S.speakLit(id, s);
    case "listenCompLit":
      return A.S.listenCompLit(id, s);
    case "listenBuildLit":
      return A.S.listenBuildLit(id, s);
    case "clozeLit":
      return A.S.clozeLit(id, s);
    case "dialogueLit":
      return A.S.dialogueLit(id, s);
    // ── §13 beats ──
    case "agreementLit":
      return A.S.agreementLit(id, s);
    case "genderSort":
      return A.S.genderSort(id, s);
    case "sim":
      return A.S.simLit(id, s);
    case "map":
      return A.S.mapLit(id, s);
    case "audioWimcq":
      return A.S.audioWimcq(id, s);
    case "matchLit":
      return A.S.matchLit(id, s);
    default:
      throw new Error(`${id}: unknown step kind "${s.kind}"`);
  }
}

let source = out.join("\n") + "\n";

// Emit only the factory imports the body actually calls (see
// __FACTORY_IMPORTS__). The full ES factory list is kept here even though
// PT's frameless renderFreeStep never literally emits calls to
// build/cloze/translateStep/speaking/listeningCompSentence/
// listeningBuildSentence/formMcq (those are frame-only in ES) — the
// regex-based trim below only imports what the generated body actually
// calls, so listing unused names is harmless and keeps this compiler's
// shape comparable to ES's for future diffing.
{
  const FACTORIES = [
    "infoStep",
    "vocab",
    "vocabMcq",
    "vocabTextMcq",
    "sentenceMcq",
    "agreementCloze",
    "build",
    "cloze",
    "translateStep",
    "speaking",
    "listeningCompSentence",
    "listeningBuildSentence",
    "matchPairs",
    "reviewMatchPairs",
    "capstoneMatchPairs",
    "dialogueListen",
    "selfExplain",
  ];
  const body = source.split("__FACTORY_IMPORTS__")[1] ?? "";
  const used = FACTORIES.filter((f) =>
    // `vocab(` must not match `vocabMcq(` / `vocabTextMcq(`
    new RegExp(`(?<![A-Za-z])${f}\\(`).test(body),
  );
  const importBlock = [`import {`, ...used.map((f) => `  ${f},`), `} from "../grammarHelpers";`].join("\n");
  source = source.replace("__FACTORY_IMPORTS__", importBlock);
}

if (checkOnly) {
  console.log(`PT IR ${mod}: valid. ${ir.lessons.length} lessons, ${ir.newAtoms.length} atoms. Nothing written.`);
  process.exit(0);
}

// PT_COMPILE_OUT_DIR — optional override for where the compiled module
// lands (absolute, or relative to `root`). Defaults to the real committed
// location. Same purpose as ES_COMPILE_OUT_DIR: a future staleness-guard
// test can recompile every module into a scratch directory and diff against
// the committed .ts without ever writing to the real source tree.
const outDirOverride = process.env.PT_COMPILE_OUT_DIR;
const outDir = outDirOverride
  ? isAbsolute(outDirOverride)
    ? outDirOverride
    : join(root, outDirOverride)
  : join(root, "src/features/languages/pt/curriculum");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${mod}.ts`);
writeFileSync(outPath, source);
console.log(
  `compiled ${mod}: ${ir.lessons.length} lessons, ${ir.newAtoms.length} atoms → ${outPath.replace(root + "/", "")}`,
);
