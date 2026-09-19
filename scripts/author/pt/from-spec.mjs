#!/usr/bin/env node
/**
 * from-spec.mjs <spec.yaml> — the PTTOOL generator. Reads a ~60-line SPEC
 * (docs/pt-authoring-pack.md has the format + a worked example) and writes:
 *   src/features/languages/pt/curriculum/ir/m1/l<n>.ir.yaml   (fragment)
 *   src/features/languages/pt/courseAtoms.m1-l<n>.ts          (atoms)
 *
 * PT_SPEC_OUT_DIR overrides the `src/features/languages/pt` root the two
 * files are written under (absolute, or relative to repo root) — mirrors
 * `compile-ir-pt.mjs`'s own `PT_COMPILE_OUT_DIR` escape hatch, and exists
 * for the SAME reason: proving this tool against lesson 1's real content
 * (`specs/pt-m1-l1.yaml`) must never overwrite the real, already-committed
 * `ir/m1/l1.ir.yaml` — see the PTTOOL report's diff step.
 *
 * Deterministic: the same spec always produces byte-identical output
 * (no timestamps, no randomness, no filesystem-order dependence).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSpec } from "./lib/spec.mjs";
import { buildCandidateSteps } from "./lib/steps.mjs";
import { scheduleSteps } from "./lib/schedule.mjs";
import { emitFragmentYaml } from "./lib/emitFragment.mjs";
import { emitAtomsTs } from "./lib/emitAtomsTs.mjs";
import { readTaughtVocab, flatVocab, isBeforeLesson, resolveEmojiFromRegistry } from "./lib/taughtVocab.mjs";
import { glyphSetFromJson } from "./lib/emojiIndex.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");

const specPath = process.argv[2];
if (!specPath) {
  console.error("usage: node scripts/author/pt/from-spec.mjs <spec.yaml>");
  process.exit(1);
}

const ptDirDefault = join(root, "src/features/languages/pt");
const override = process.env.PT_SPEC_OUT_DIR;
const ptDir = override ? (isAbsolute(override) ? override : join(root, override)) : ptDirDefault;

let spec;
try {
  spec = loadSpec(specPath);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

// Item 3: `allowExtra:` is a one-off, named exception (never silent) — the
// generator always surfaces it, whether or not check.sh runs next.
if (spec.allowExtra.length) {
  console.log(`from-spec: ${spec.id}: allowExtra: [${spec.allowExtra.join(", ")}] — ${spec.reason}`);
}

// ROUND 3 (lane PTTOOL3, rule 2): `spec.mjs` already requires an imageable
// noun to CARRY an `emoji` string; this is the second, independent half —
// that the glyph is actually one of the 487 vendored under
// `src/pub/noto-emoji/svg/` (a typo'd or invented glyph would otherwise
// silently produce a broken imageMcq at runtime). Reads the pre-generated
// sidecar (`pack.mjs` regenerates it) rather than re-scanning the SVG dir.
const vendoredGlyphs = glyphSetFromJson(join(root, "docs/pt-emoji-index.generated.json"));
if (vendoredGlyphs.size) {
  const unresolvable = spec.words.filter((w) => w.emoji && !vendoredGlyphs.has(w.emoji));
  if (unresolvable.length) {
    console.error(
      `from-spec: ${specPath}: emoji not vendored under src/pub/noto-emoji/svg/: ` +
        unresolvable.map((w) => `"${w.pt}" -> ${w.emoji}`).join(", ") +
        ` — smallest fix: pick a vendored glyph (see docs/pt-authoring-pack.md's "Vendored emoji"), or set "imageable: false" with a reason`,
    );
    process.exit(1);
  }
}

// ROUND 4 (lane PTTOOL4, item 4): the module comes from `spec.id`
// ("pt-m2-l1" -> "m2"), falling back to "m1" for any spec whose id
// doesn't match that shape (keeps every existing m1 spec byte-identical).
const moduleMatch = /^pt-(m\d+)-l\d+$/.exec(spec.id);
const moduleId = moduleMatch ? moduleMatch[1] : "m1";

// Prior lessons already on disk (real ptDirDefault, not the override —
// a proof run against a scratch out-dir should still see the REAL taught
// vocabulary for distractor/match-pair sourcing, not an empty scratch dir).
// isBeforeLesson (not a bare `.lesson < spec.lesson`) is what makes an
// EARLIER module's vocabulary count as prior regardless of lesson number —
// m2-L1's own lesson number (1) is not < any m1 lesson number, so the naive
// filter would have silently dropped all 42 of m1's atoms here.
const priorVocab = flatVocab(readTaughtVocab(ptDirDefault).filter((l) => isBeforeLesson(l, moduleId, spec.lesson)));

// Item 10: the registry half of shared atom metadata — fills a missing
// emoji from an already-registered atom of the same surface, FAILS on a
// contradicting one. `spec.wordByPt` is rebuilt so every downstream
// reader (buildCandidateSteps, emitFragmentYaml, emitAtomsTs) sees the
// merged word objects, not the pre-merge ones spec.mjs first produced.
try {
  spec.words = resolveEmojiFromRegistry(spec.words, priorVocab);
  spec.wordByPt = new Map(spec.words.map((w) => [w.pt, w]));
} catch (e) {
  console.error(`from-spec: ${specPath}: ${e.message}`);
  process.exit(1);
}

let steps;
try {
  const candidates = buildCandidateSteps(spec, priorVocab);
  steps = scheduleSteps(candidates, spec);
} catch (e) {
  console.error(`from-spec: ${specPath}: ${e.message}`);
  process.exit(1);
}

const fragmentYaml = emitFragmentYaml(spec, steps);
const atomsTs = emitAtomsTs(spec, moduleId);

const fragDir = join(ptDir, "curriculum/ir", moduleId);
mkdirSync(fragDir, { recursive: true });
const fragPath = join(fragDir, `l${spec.lesson}.ir.yaml`);
writeFileSync(fragPath, fragmentYaml);

// checkpoint: true = zero-new-atom recall lesson — never write a
// courseAtoms.<mod>-lN.ts file at all (round 2 fix: PTR1-L6 hand-emptied a
// stale one after from-spec.mjs wrote 8 duplicate atom() registrations;
// the tool must not produce that file to begin with).
const atomsPath = join(ptDir, `courseAtoms.${moduleId}-l${spec.lesson}.ts`);
if (!spec.checkpoint) writeFileSync(atomsPath, atomsTs);

console.log(
  `from-spec: ${spec.id} — ${steps.length} steps, ${spec.words.length} atoms\n` +
    `  ${fragPath.replace(root + "/", "")}\n` +
    (spec.checkpoint ? `  (checkpoint: no courseAtoms.${moduleId}-l${spec.lesson}.ts written)\n` : `  ${atomsPath.replace(root + "/", "")}\n`) +
    `  step order: ${steps.map((s) => s.kind).join(" -> ")}`,
);
