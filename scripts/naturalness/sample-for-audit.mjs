#!/usr/bin/env node
/**
 * Naturalness sweep — Step 3 prep: build the Sonnet-audit sample.
 *
 * Mechanical, deterministic sampling only — the actual judgment (agree /
 * disagree + Sonnet's own replacement) is done by hand, not by this script.
 *
 * Pulls a stratified 12% sample of "fix" verdicts (stratified by `issue`,
 * proportional, min 1 per issue type present) from verdicts-{words,sentences}
 * plus 30 random "pass" rows, joins each verdict back to its source row
 * (for ja/en/module/lesson/sourceFile/sourceLine), and writes
 * audit-sample.jsonl with an empty audit block per row for me to fill in.
 *
 * Usage: node scripts/naturalness/sample-for-audit.mjs
 */
import fs from "node:fs";
import path from "node:path";

const OUT_DIR =
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/naturalness";

const SEED = 20260915; // deterministic
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

// Some "sentence"/"challenge"/"particle-cloze" IR beats carry a TASK-PROMPT
// en field ("Say politely: I eat at home") rather than a translation gloss —
// the extractor couldn't tell these apart from real glosses mechanically.
// The judge model reliably (and, on its own terms, correctly) flags the
// "Say politely:"/"Say to a friend:" prefix as register-baked-into-the-gloss,
// but that verdict is meaningless here: it's not a gloss at all, it's UI
// instruction copy. Exclude by default so the audit sample measures real
// gloss judgment quality, not this known extraction-scope artifact.
const INSTRUCTION_PROMPT_RE = /^(Say|Tell|Ask|Answer|Respond|Reply)\b/i;

function loadSet(setName, { excludeInstructionPrompts = true } = {}) {
  const rows = readJsonl(path.join(OUT_DIR, `rows-${setName}.jsonl`));
  const verdicts = readJsonl(path.join(OUT_DIR, `verdicts-${setName}.jsonl`));
  const rowById = new Map(rows.map((r) => [r.id, r]));
  const joined = verdicts
    .map((v) => {
      const row = rowById.get(v.row_id);
      if (!row) return null;
      if (excludeInstructionPrompts && INSTRUCTION_PROMPT_RE.test(row.en))
        return null;
      return { setName, row, verdict: v };
    })
    .filter(Boolean);
  return joined;
}

function stratifiedFixSample(joined, fraction, minPerIssue = 1) {
  const fixes = joined.filter((j) => j.verdict.verdict === "fix");
  const byIssue = new Map();
  for (const f of fixes) {
    const k = f.verdict.issue || "other";
    if (!byIssue.has(k)) byIssue.set(k, []);
    byIssue.get(k).push(f);
  }
  const sample = [];
  for (const [issue, items] of byIssue) {
    const n = Math.max(minPerIssue, Math.round(items.length * fraction));
    const picked = shuffle(items).slice(0, Math.min(n, items.length));
    sample.push(...picked);
  }
  return { sample, totalFixes: fixes.length };
}

function randomPassSample(joined, n) {
  const passes = joined.filter((j) => j.verdict.verdict === "pass");
  return shuffle(passes).slice(0, Math.min(n, passes.length));
}

// Optional CLI args restrict which set(s) to sample from: "words", "sentences",
// or both (default). Lets Step 3 audit one pass at a time instead of mixing.
const requestedSets = process.argv.slice(2);
const setsToLoad =
  requestedSets.length > 0 ? requestedSets : ["words", "sentences"];
const all = setsToLoad.flatMap((s) => loadSet(s));

if (all.length === 0) {
  console.error(
    "sample-for-audit.mjs: no verdicts found yet in " + OUT_DIR,
  );
  process.exit(1);
}

const { sample: fixSample, totalFixes } = stratifiedFixSample(all, 0.12, 6);
const passSample = randomPassSample(all, 30);

const auditRows = [...fixSample, ...passSample].map((j, i) => ({
  auditId: `audit-${i + 1}`,
  setName: j.setName,
  rowId: j.row.id,
  module: j.row.module,
  lesson: j.row.lesson,
  ja: j.row.ja,
  en: j.row.en,
  neighbours: j.row.neighbours,
  sourceFile: j.row.sourceFile,
  sourceLine: j.row.sourceLine ?? null,
  modelVerdict: j.verdict.verdict,
  modelIssue: j.verdict.issue,
  modelReason: j.verdict.reason,
  modelReplacementEn: j.verdict.replacement_en,
  modelReplacementJa: j.verdict.replacement_ja,
  modelConfidence: j.verdict.confidence,
  // Filled in by hand during Step 3:
  sonnetAgree: null, // true | false
  sonnetVerdict: null, // "pass" | "fix"
  sonnetReplacementEn: null,
  sonnetNote: null,
}));

const outFile = path.join(
  OUT_DIR,
  `audit-sample-${setsToLoad.join("-")}.jsonl`,
);
fs.writeFileSync(
  outFile,
  auditRows.map((r) => JSON.stringify(r)).join("\n") + "\n",
);

console.log(
  `sample-for-audit.mjs: ${all.length} verdicts available (${totalFixes} fix, ${all.length - totalFixes} pass)`,
);
console.log(
  `sample-for-audit.mjs: sampled ${fixSample.length} fix rows (target 12% stratified by issue) + ${passSample.length} random pass rows -> ${auditRows.length} total`,
);
console.log(`sample-for-audit.mjs: wrote ${outFile}`);
