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
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { replayLesson } from "./lib/replay.mjs";
import { runAllChecks } from "./lib/checkRules.mjs";
import { extractTts } from "./lib/ttsExtract.mjs";
import { readTaughtVocab, flatVocab, isBeforeLesson } from "./lib/taughtVocab.mjs";
import { glyphSetFromJson } from "./lib/emojiIndex.mjs";
import { checkPayoffRule } from "./lib/spine.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");

// Lane PTTOOL4, item 4: `--module m2` (anywhere in argv) points this at a
// non-m1 module — defaults to "m1" so every existing invocation (and every
// existing test/CI call site) is byte-identical.
const rest = process.argv.slice(2).filter((a) => a !== "--module");
const moduleFlagIdx = process.argv.indexOf("--module");
const moduleId = moduleFlagIdx !== -1 ? process.argv[moduleFlagIdx + 1] : "m1";
const n = rest.find((a) => /^\d+$/.test(a));
if (!n) {
  console.error("usage: node scripts/author/pt/check-lesson.mjs <lesson-number> [--module m2]");
  process.exit(1);
}

const fragOverride = process.env.PT_SPEC_OUT_DIR; // let the proof step check its own scratch output too
const ptDir = fragOverride ? (isAbsolute(fragOverride) ? fragOverride : join(root, fragOverride)) : join(root, "src/features/languages/pt");
const fragPath = join(ptDir, `curriculum/ir/${moduleId}/l${n}.ir.yaml`);

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

const replay = replayLesson(frag.lesson, moduleId);
console.log(`replay: ${replay.ok ? "PASS" : "FAIL"} (${replay.count ?? 0}/${frag.lesson.steps.length} steps rendered)`);
if (!replay.ok) for (const f of replay.failures) console.log(`  FAIL ${f.id} (${f.kind}): ${f.error}`);

// Prior lessons' surfaces (this lesson's own is EXCLUDED — checkTaughtVocabResidual
// already credits it via `atoms`) — real taught vocab, same source from-spec.mjs
// draws distractors from, so the residual check reads the SAME "known" set a lane
// generating this lesson would have seen.
// isBeforeLesson (not a bare `.lesson < n`): an earlier MODULE's vocab is
// always prior, regardless of lesson number (see lib/taughtVocab.mjs).
const priorSurfaces = new Set(
  [...flatVocab(readTaughtVocab(join(root, "src/features/languages/pt")).filter((l) => isBeforeLesson(l, moduleId, Number(n)))).keys()],
);
const emojiIndex = glyphSetFromJson(join(root, "docs/pt-emoji-index.generated.json"));
const rules = runAllChecks(frag.lesson, frag.atoms ?? [], {
  priorSurfaces, allow: frag.allow ?? [], allowExtra: frag.allowExtra ?? [], allowExtraReason: frag.allowExtraReason, emojiIndex,
});
let hardFail = !replay.ok;
for (const r of rules) {
  const mark = r.ok === true ? "PASS" : r.ok === false ? "FAIL" : "INFO";
  if (r.ok === false) hardFail = true;
  console.log(`${mark} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
}

// Item 2: payoff rule — reads the SPEC that generated this fragment (not
// the fragment itself, which carries no `spine:`/`winOverride:` — those
// are spec-only authoring fields) from its conventional path,
// specs/pt-<module>-l<n>.yaml. A fragment with no co-located spec (a
// pre-spec-first hand-authored one) gets the same "n/a" treatment every
// other optional-input check in this tool uses.
const specPath = join(here, "specs", `pt-${moduleId}-l${n}.yaml`);
const payoff = existsSync(specPath)
  ? checkPayoffRule(parse(readFileSync(specPath, "utf8")))
  : { name: "payoff-rule", ok: null, detail: `n/a: no spec file at ${specPath.replace(root + "/", "")}` };
if (payoff.ok === false) hardFail = true;
console.log(`${payoff.ok === true ? "PASS" : payoff.ok === false ? "FAIL" : "INFO"} ${payoff.name}${payoff.detail ? ` — ${payoff.detail}` : ""}`);

const tts = extractTts(frag.lesson, frag.atoms ?? []);
const outDir = join(root, "artifacts/pt");
mkdirSync(outDir, { recursive: true });
const ttsPath = join(outDir, `l${n}.tts.json`);
writeFileSync(ttsPath, JSON.stringify(tts, null, 2));
console.log(`tts: ${tts.length} distinct clips -> ${ttsPath.replace(root + "/", "")}`);

process.exit(hardFail ? 1 : 0);
