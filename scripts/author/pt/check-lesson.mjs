#!/usr/bin/env node
/**
 * check-lesson.mjs <n> — the node half of `check.sh` (bash owns the
 * subprocess orchestration: compile-ir-pt.mjs / vitest / the artifact
 * path; this owns the three JS-only checks that need `yaml` + the real
 * emitters): emitter replay (`lib/replay.mjs`), the independent doctrine
 * re-check (`lib/checkRules.mjs`), and TTS extraction (`lib/ttsExtract.mjs`).
 *
 * Reads the REAL, committed fragment at
 * `src/features/languages/pt/curriculum/ir/m1/l<n>.ir.yaml` — never a
 * scratch/override path (unlike `from-spec.mjs`'s `PT_SPEC_OUT_DIR`) —
 * because checking is meaningless against anything but what's actually on
 * disk.
 *
 * Exit code: 0 only if every hard check (ok !== false) passed; a `null`
 * (informational) result never fails the run.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { replayLesson } from "./lib/replay.mjs";
import { runAllChecks } from "./lib/checkRules.mjs";
import { extractTts } from "./lib/ttsExtract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");

const n = process.argv[2];
if (!n || !/^\d+$/.test(n)) {
  console.error("usage: node scripts/author/pt/check-lesson.mjs <lesson-number>");
  process.exit(1);
}

const fragOverride = process.env.PT_SPEC_OUT_DIR; // let the proof step check its own scratch output too
const ptDir = fragOverride ? (isAbsolute(fragOverride) ? fragOverride : join(root, fragOverride)) : join(root, "src/features/languages/pt");
const fragPath = join(ptDir, `curriculum/ir/m1/l${n}.ir.yaml`);

let frag;
try {
  frag = parse(readFileSync(fragPath, "utf8"));
} catch (e) {
  console.error(`check-lesson: cannot read/parse ${fragPath}: ${e.message}`);
  process.exit(2);
}
if (!frag?.lesson) {
  console.error(`check-lesson: ${fragPath} has no top-level "lesson:" — this fragment predates PTFRAG's canonical shape (see docs/pt-authoring-pack.md "known non-conformant fragments"); not checkable by this tool`);
  process.exit(2);
}

const replay = replayLesson(frag.lesson, "m1");
console.log(`replay: ${replay.ok ? "PASS" : "FAIL"} (${replay.count ?? 0}/${frag.lesson.steps.length} steps rendered)`);
if (!replay.ok) for (const f of replay.failures) console.log(`  FAIL ${f.id} (${f.kind}): ${f.error}`);

const rules = runAllChecks(frag.lesson, frag.atoms ?? []);
let hardFail = !replay.ok;
for (const r of rules) {
  const mark = r.ok === true ? "PASS" : r.ok === false ? "FAIL" : "INFO";
  if (r.ok === false) hardFail = true;
  console.log(`${mark} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
}

const tts = extractTts(frag.lesson, frag.atoms ?? []);
const outDir = join(root, "artifacts/pt");
mkdirSync(outDir, { recursive: true });
const ttsPath = join(outDir, `l${n}.tts.json`);
writeFileSync(ttsPath, JSON.stringify(tts, null, 2));
console.log(`tts: ${tts.length} distinct clips -> ${ttsPath.replace(root + "/", "")}`);

process.exit(hardFail ? 1 : 0);
