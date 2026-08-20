#!/usr/bin/env node
/**
 * compile-ir-es.mjs — the Spanish IR front door.
 *
 *   node scripts/compile-ir-es.mjs m18
 *   node scripts/compile-ir-es.mjs m18 --check     # validate only, emit nothing
 *
 * Reads  src/features/languages/es/curriculum/ir/m18.ir.yaml
 * Writes src/features/languages/es/curriculum/m18.ts
 *
 * ── Why this is not the ja compiler ────────────────────────────────────────
 * ja compiles YAML → committed JSON → `compileModule(json)` at RUNTIME, and
 * that compiler is 94 KB of Japanese: kana tokenization, kanji surface
 * substitution, verb-class morphology, register audiences. Porting it would
 * mean rewriting all of it, and the parts that would survive are the parts ES
 * already has as `grammarHelpers` factories.
 *
 * So ES compiles YAML → TS SOURCE at build time, and the app imports the
 * generated module exactly as it imports a hand-authored one. The IR is still
 * the front door — it is the only file an author edits, and the generated .ts
 * is never hand-edited — but the last mile is codegen rather than a runtime
 * interpreter. The trade is deliberate:
 *
 *   + reuses every shipped ES factory, so the output passes the existing gates
 *     by construction rather than by a second implementation agreeing
 *   + zero runtime cost and zero new runtime code paths
 *   + the diff of a regenerated module is readable, which is how the m17 wave
 *     caught «hablé el inglés» — by READING the generated file
 *   − no runtime diagnostics pass; validation happens here, at compile time
 *   − a generated file is committed, so a stale one is possible (guarded by
 *     m*.test.ts, which imports the generated module and re-derives its claims)
 *
 * ── What the IR owns and what the template owns ────────────────────────────
 * The IR carries JUDGMENT: the lesson arc, which contrast each lesson turns
 * on, the atom allocation, every info card, the self-explanations. The
 * template (es-ir/templates.mjs) carries the STEP ORDER, because the order is
 * what satisfies the ES quality gates and is identical for every module.
 *
 * Nothing in the emitted file is sampled. The local model chose which taught
 * words combine; `morph-es.mjs` spelled every Spanish form; the frame wrote
 * every English gloss. A (verb, person) cell the drafted pool failed to cover
 * is FRAME-FILLED and named on stderr — never silently substituted.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { makeAssembler, q } from "./draft/es-ir/assemble.mjs";
import { topicLesson, makeAnchor, freeLesson } from "./draft/es-ir/templates.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const mod = process.argv[2];
const checkOnly = process.argv.includes("--check");
if (!mod || !/^m\d+$/.test(mod)) {
  console.error("usage: node scripts/compile-ir-es.mjs <module>   (e.g. m18)");
  process.exit(1);
}

const irDir = join(root, "src/features/languages/es/curriculum/ir");
const yamlPath = join(irDir, `${mod}.ir.yaml`);
if (!existsSync(yamlPath)) {
  console.error(`no ES IR at ${yamlPath}`);
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
// Every check here failed for real during the m17 wave. They are in the order
// that gives the most useful message first: a missing frame makes every later
// complaint noise.

const problems = [];
const need = (cond, msg) => {
  if (!cond) problems.push(msg);
};

need(ir.module === mod, `ir.module is "${ir.module}" but the file is ${mod}.ir.yaml`);
need(typeof ir.title === "string" && ir.title.length > 0, "ir.title is required");
// `frame: none` is the PHRASE-MODULE mode (m1-class: greetings, numbers,
// fixed expressions). No frame, no drafted pool; every lesson must be
// `free` and use the literal (*Lit / imageMcq / phrase / mcq / textMcq /
// match / selfExplain / info) beats.
const frameless = ir.frame === "none";
need(
  typeof ir.frame === "string",
  'ir.frame must name a frame exported by frames-es-a2.mjs (or "none" for a phrase module)',
);
if (frameless && Array.isArray(ir.lessons)) {
  for (const l of ir.lessons) {
    need(
      l.template === "free",
      `lesson ${l.n}: template "${l.template}" needs a frame; a frameless module is free-template only`,
    );
  }
}
need(Array.isArray(ir.newAtoms) && ir.newAtoms.length > 0, "ir.newAtoms must be a non-empty list");
need(Array.isArray(ir.lessons) && ir.lessons.length > 0, "ir.lessons must be a non-empty list");

// The ES quality gate wants ≥2 selfExplain per module and a specific lesson
// count; catching both here beats catching them in vitest three commands later.
if (Array.isArray(ir.lessons)) {
  need(
    ir.lessons.length === 8,
    `every shipped ES module is 8 lessons; this IR declares ${ir.lessons.length}`,
  );
  const selfExplains = ir.lessons.filter(
    (l) =>
      l.seventeen?.kind === "selfExplain" ||
      (l.steps ?? []).some((s) => s.kind === "selfExplain"),
  ).length;
  need(
    selfExplains >= 2,
    `es-quality requires >= 2 selfExplain per module; the IR declares ${selfExplains}`,
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
  console.error(`ES IR ${mod} — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}

// ─── frame + pool ───────────────────────────────────────────────────────────
// `frameFile` lets a module carry its own frame. m17 and m18 share nothing but
// the contract — different verbs, different complement shapes, different time
// rules — and putting both in one file would make each module's inventory
// harder to read, which is the file whose readability matters most.
let frame = null;
let pool = [];
if (!frameless) {
  const frames = await import(`./draft/frames-${ir.frameFile ?? "es-a2"}.mjs`);
  frame = frames[ir.frame];
  if (!frame) {
    console.error(
      `ir.frame "${ir.frame}" is not exported by frames-${ir.frameFile ?? "es-a2"}.mjs. Have: ` +
        Object.keys(frames).filter((k) => k.startsWith("es_")).join(", "),
    );
    process.exit(1);
  }
  // TEACH-FIRST, asserted BEFORE any emission: the frame may only combine words
  // an earlier module already taught. m17 checked this before spending model
  // tokens; here it is cheaper still, but the failure it prevents is the same —
  // a module that drills a word the learner has never met.
  if (typeof frames.assertFrameVocabIsTaught === "function") {
    await frames.assertFrameVocabIsTaught(frame, ir.throughModule ?? "m16");
  }
  if (typeof frames.loadNouns === "function") {
    await frames.loadNouns(ir.throughModule ?? "m16");
  }

  const poolPath = join(here, "draft/drafts", `es-${mod}.json`);
  if (!existsSync(poolPath)) {
    console.error(
      `no drafted pool at ${poolPath}\n` +
        `run:  node scripts/draft/draft.mjs es-a2:${mod} --cover --n 12 --duty 0.8`,
    );
    process.exit(2);
  }
  pool = JSON.parse(readFileSync(poolPath, "utf8")).picks;
}
// A frameless module's teach-first story: the *Lit beats carry their
// sentences literally, and the vocab-provenance gate in
// es/__tests__/moduleBarGuards.ts (unknownTokens/nonIntroDebuts, zero debt
// for authored-after-2026-08-19 modules) is the enforcement.

const A = makeAssembler({
  frame,
  pool,
  moduleId: mod,
  tense: ir.tense ?? "preterite",
});

// ─── emit ───────────────────────────────────────────────────────────────────
const out = [];
const w = (s) => out.push(s);
const tense = ir.tense ?? "preterite";

w(
  frameless
    ? `/**
 * ${mod}.ts — ${ir.title}
 *
 * GENERATED. Do not hand-edit — regenerate instead:
 *   node scripts/compile-ir-es.mjs ${mod}
 *
 * The authored source is src/features/languages/es/curriculum/ir/${mod}.ir.yaml.
 * This is a FRAMELESS phrase module: every sentence is carried literally in
 * the IR (no verb frame, no drafted pool, no local model involved).
 */`
    : `/**
 * ${mod}.ts — ${ir.title}
 *
 * GENERATED. Do not hand-edit — regenerate instead:
 *   node scripts/draft/draft.mjs es-a2:${mod} --cover --n 12 --duty 0.8
 *   node scripts/compile-ir-es.mjs ${mod}
 *
 * The authored source is src/features/languages/es/curriculum/ir/${mod}.ir.yaml.
 * Every Spanish form here comes from scripts/draft/morph-es.mjs and every
 * English gloss from the frame's own tables; the local model chose only which
 * taught words combine.
 */`,
);
w(`import type { LessonContent } from "@/features/lesson/types";`);
w(`import { atom, type EsAtom } from "../courseAtoms";`);
if (ir.placement) w(`import type { PlacementItem } from "@/shared/language/types";`);
// Filled in at the end with only the factories the body actually calls —
// phrase modules use vocabMcq/dialogueListen and may skip cloze entirely,
// and an unused import is a tsc error under noUnusedLocals.
w(`__FACTORY_IMPORTS__`);
w(``);
w(`const COURSE_ID = "mock-1";`);
w(``);

// atoms
w(`export const ES_${mod.toUpperCase()}_ATOMS: EsAtom[] = [`);
for (const a of ir.newAtoms) {
  const fields = [
    `surface: ${q(a.surface)}`,
    `meaningEn: ${q(a.meaningEn)}`,
    `partOfSpeech: ${q(a.partOfSpeech ?? "verb")}`,
    `fromModule: ${q(mod)}`,
    `kind: ${q(a.kind ?? "vocab")}`,
  ];
  // Optional card-art / pronunciation / agreement fields (phrase modules
  // carry them; verb modules generally don't).
  if (a.gender) fields.push(`gender: ${q(a.gender)}`);
  if (a.emoji) fields.push(`emoji: ${q(a.emoji)}`);
  if (a.hint) fields.push(`hint: ${q(a.hint)}`);
  w(`  atom({ ${fields.join(", ")} }),`);
}
w(`];`);
w(``);

// lessons
const lessonNames = [];
for (const spec of ir.lessons) {
  const id = `es-${mod}-${spec.n}`;
  lessonNames.push(id.toUpperCase().replace(/-/g, "_"));

  if (spec.template === "topic") {
    const anchors = spec.anchors.map((an) =>
      makeAnchor(A, tense, an.verb, an.person, an.en, an.why, {
        p: an.want ?? {},
        second: an.secondWant,
        tiles: an.tiles,
      }),
    );
    const seventeen = renderSeventeen(A, id, spec.seventeen);
    w(
      topicLesson(A, {
        moduleId: mod,
        n: spec.n,
        title: spec.title,
        description: spec.description,
        info: spec.info,
        anchors,
        textMcqDistractors: spec.textMcqDistractors,
        extra: {
          speaking: A.pick(spec.extra.speaking.verb, spec.extra.speaking.person, spec.extra.speaking.want ?? {}),
          listen: A.pick(spec.extra.listen.verb, spec.extra.listen.person, spec.extra.listen.want ?? {}),
          build: A.pick(spec.extra.build.verb, spec.extra.build.person, spec.extra.build.want ?? {}),
          buildTiles: spec.extra.buildTiles ?? [],
        },
        seventeen,
        close: A.pick(spec.close.verb, spec.close.person, spec.close.want ?? {}),
        win: spec.win,
      }),
    );
  } else if (spec.template === "free") {
    w(freeLesson(A, { ...spec, moduleId: mod }, renderFreeStep));
  } else {
    console.error(`lesson ${spec.n}: template "${spec.template}" is not implemented yet`);
    process.exit(1);
  }
}

w(`export const ES_${mod.toUpperCase()}_LESSONS: LessonContent[] = [`);
for (const n of lessonNames) w(`  ${n},`);
w(`];`);
w(``);

/**
 * The placement / test-out bank. Emitted from the IR rather than hand-written
 * beside the module, because it is the same judgment as the lessons — which
 * facts stand for "you already know this module" — and splitting judgment
 * across two files is how m17 ended up with a screener that tested a sentence
 * the module never teaches.
 *
 * `build` is a thunk: the engine constructs items lazily, so a bank that is
 * never reached costs nothing at import time.
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

  w(`export const ES_${mod.toUpperCase()}_PLACEMENT: {`);
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
 * es-ir/assemble.mjs; a kind this switch does not know is an authoring typo and
 * throws by NAME, because the alternative — silently skipping it — produces a
 * lesson that is short by one step and passes every count-based gate that does
 * not happen to notice.
 *
 * `draw` names a (verb, person) cell and optional wants; the assembler resolves
 * it against the drafted pool and frame-fills if the pool missed it.
 */
function renderFreeStep(A, id, s) {
  const draw = (d) => A.pick(d.verb, d.person, d.want ?? {});
  switch (s.kind) {
    case "info":
      return A.S.info(id, s.title, s.body, s.variant ?? "grammar");
    case "mcq":
      return A.S.mcq(id, s.prompt, s.correct, s.distractors, s.why, s.atoms ?? [s.correct]);
    case "textMcq":
      return A.S.textMcq(id, s.target, s.distractors, s.prompt);
    case "formMcq":
      return A.S.formMcq(id, s.verb, s.person, s.why);
    case "phrase":
      return A.S.phrase(id, s.meaning, s.text, s.emoji);
    case "build":
      return A.S.build(id, draw(s.draw), s.tiles ?? []);
    case "translate":
      return A.S.translate(id, draw(s.draw));
    case "speaking":
      return A.S.speaking(id, draw(s.draw));
    case "cloze":
      return A.S.cloze(id, draw(s.draw), s.why);
    case "listenComp":
      return A.S.listenComp(id, draw(s.draw));
    case "listenBuild":
      return A.S.listenBuild(id, draw(s.draw), s.tiles ?? []);
    case "match":
      return A.S.match(id, s.surfaces);
    case "reviewMatch":
      return A.S.reviewMatch(id, `${id}-seed`);
    case "capstoneMatch":
      return A.S.capstoneMatch(id, s.entries);
    case "selfExplain":
      return A.S.selfExplain({ ...s, id });
    // ── literal beats (frameless phrase modules; see assemble.mjs) ──
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
    default:
      throw new Error(`${id}: unknown step kind "${s.kind}"`);
  }
}

/**
 * The topic template's bespoke 17th beat.
 *
 * `match` is deliberately NOT accepted. Position 18 is always `reviewMatch`,
 * which renders as `match_pairs` too, so a match at 17 is guaranteed to trip
 * the "no two adjacent steps share a type" gate — every time, in every module.
 * m18's L2 and L3 both did it, and the failure surfaced three commands later
 * in vitest naming a step index rather than a cause. A template constraint
 * that is knowable at compile time belongs here.
 */
function renderSeventeen(A, id, s) {
  if (!s) throw new Error(`${id}: lesson has no 'seventeen' beat`);
  switch (s.kind) {
    case "selfExplain":
      return A.S.selfExplain({ ...s, id: `${id}-se` });
    case "mcq":
      return A.S.mcq(`${id}-q17`, s.prompt, s.correct, s.distractors, s.why, s.atoms ?? [s.correct]);
    case "textMcq":
      return A.S.textMcq(`${id}-tm17`, s.target, s.distractors, s.prompt);
    case "match":
      throw new Error(
        `${id}: seventeen.kind "match" collides with the template's reviewMatch at step 18 ` +
          `(both render as match_pairs, and es-quality forbids adjacent same-type steps). ` +
          `Use selfExplain, mcq or textMcq.`,
      );
    default:
      throw new Error(`${id}: unknown seventeen kind "${s.kind}"`);
  }
}

let source = out.join("\n") + "\n";

// Emit only the factory imports the body calls (see __FACTORY_IMPORTS__).
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

if (A.frameFilled.length) {
  console.error(
    `frame-filled ${A.frameFilled.length} cell(s) the pool did not cover: ${[...new Set(A.frameFilled)].join(", ")}`,
  );
}

if (checkOnly) {
  console.log(`ES IR ${mod}: valid. ${ir.lessons.length} lessons, ${ir.newAtoms.length} atoms. Nothing written.`);
  process.exit(0);
}

const outPath = join(root, "src/features/languages/es/curriculum", `${mod}.ts`);
writeFileSync(outPath, source);
console.log(
  `compiled ${mod}: ${ir.lessons.length} lessons, ${ir.newAtoms.length} atoms → ${outPath.replace(root + "/", "")}`,
);
