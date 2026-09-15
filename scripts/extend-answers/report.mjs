#!/usr/bin/env node
/**
 * Extend-answers lane — Step 5: REPORT.md for the lead.
 */
import fs from "node:fs";
import path from "node:path";

const EXTEND_DIR =
  process.env.EXTEND_DIR ||
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/extend";

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
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

const extractSummary = readJson(path.join(EXTEND_DIR, "extract-summary.json"), {});
const proposeStats = readJson(path.join(EXTEND_DIR, "propose-stats.json"), {});
const gateSummary = readJson(path.join(EXTEND_DIR, "gate-summary.json"), {});
const judgeGateSummary = readJson(path.join(EXTEND_DIR, "judge-gate-summary.json"), null);
// patches.jsonl is read AFTER judge-gate.mjs has run (if it has) — it
// overwrites patches.jsonl in place, so by the time this report runs
// `patches` is the FINAL judge-accepted set; the pre-judge (gate-accepted)
// set is preserved separately at patches-pre-judge.jsonl.
const patches = readJsonl(path.join(EXTEND_DIR, "patches.jsonl"));
const rejects = readJsonl(path.join(EXTEND_DIR, "rejects.jsonl"));
const judgeRejects = readJsonl(path.join(EXTEND_DIR, "judge-rejects.jsonl"));
const rowsAll = readJsonl(path.join(EXTEND_DIR, "rows.jsonl"));
const proposalsAll = readJsonl(path.join(EXTEND_DIR, "proposals.jsonl"));

const moduleByStepId = new Map(rowsAll.map((r) => [r.stepId, r.module]));
const perModuleProposed = {};
for (const prop of proposalsAll) {
  const m = moduleByStepId.get(prop.stepId);
  if (m) perModuleProposed[m] = (perModuleProposed[m] || 0) + 1;
}

const lines = [];
const p = (...xs) => lines.push(...xs);

p("# Extend short build answers (#139) — REPORT");
p("");
p(`Generated ${new Date().toISOString()}.`);
p("");
p("Pipeline: extract (mechanical, from the compiled course + curriculum YAML) -> propose ");
p("(local model, gemma4-31b-256k, ONLY availableWords) -> gate (mechanical, ≤1 retry) -> ");
p("judge-gate (second machine gate: the existing naturalness judge over every accepted patch) -> ");
p("sample-for-audit (12% stratified) -> this report. No curriculum content was edited by this ");
p("lane; `patches.jsonl` is input to dedicated Sonnet authoring lanes, one module at a time.");
p("");
p("## Proposed / gate-accepted / judge-accepted, per module");
p("");
p("| module | proposed | gate-accepted | judge-accepted |");
p("|---|---|---|---|");
{
  const mods = new Set([
    ...Object.keys(perModuleProposed),
    ...Object.keys(gateSummary.perModuleAccepted ?? {}),
    ...patches.map((r) => r.module),
  ]);
  const judgeAcceptedByModule = {};
  for (const r of patches) judgeAcceptedByModule[r.module] = (judgeAcceptedByModule[r.module] || 0) + 1;
  for (const m of [...mods].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))) {
    p(
      `| ${m} | ${perModuleProposed[m] ?? 0} | ${gateSummary.perModuleAccepted?.[m] ?? 0} | ${judgeAcceptedByModule[m] ?? 0} |`,
    );
  }
}
p("");
p("## Extraction");
p("");
p(`- Rows extracted: **${extractSummary.totalRows ?? "?"}**`);
p(`- In-scope build answers swept (m12+): ${extractSummary.inScopeTotal ?? "?"}`);
p(`- Rows with no yaml beat match (en/grammarIds/line empty): ${extractSummary.missingBeatMatch ?? "?"}`);
p("");
p("Per-module row counts:");
p("");
p("| module | rows |");
p("|---|---|");
for (const [m, n] of Object.entries(extractSummary.perModule ?? {}).sort(
  (a, b) => Number(a[0].slice(1)) - Number(b[0].slice(1)),
)) {
  p(`| ${m} | ${n} |`);
}
p("");
p("## Proposals (local model)");
p("");
p(`- Model: ${proposeStats.model ?? "gemma4-31b-256k:latest"}`);
p(`- Rows proposed this run: ${proposeStats.rowsProposed ?? "?"}`);
p(`- Batches: ${proposeStats.batches ?? "?"}, failed batches: ${proposeStats.failedBatches ?? "?"}`);
p(`- Wall time: ${proposeStats.wallTimeS?.toFixed?.(0) ?? "?"}s`);
p(`- **Throughput: ${proposeStats.sPerRow?.toFixed?.(2) ?? "?"} s/row**`);
p(`- Gen tok/s: ${proposeStats.genTokPerSec?.toFixed?.(1) ?? "?"}`);
p("");
p("## Gate results");
p("");
p(`- Accepted: **${gateSummary.accepted ?? patches.length}**`);
p(`- Rejected (after 1 retry): **${gateSummary.rejected ?? rejects.length}**`);
p(`- Accept rate: ${((gateSummary.acceptRate ?? patches.length / Math.max(patches.length + rejects.length, 1)) * 100).toFixed(1)}%`);
p("");
p("Per-module accepted / rejected:");
p("");
p("| module | accepted | rejected |");
p("|---|---|---|");
const modules = new Set([
  ...Object.keys(gateSummary.perModuleAccepted ?? {}),
  ...Object.keys(gateSummary.perModuleRejected ?? {}),
]);
for (const m of [...modules].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))) {
  p(`| ${m} | ${gateSummary.perModuleAccepted?.[m] ?? 0} | ${gateSummary.perModuleRejected?.[m] ?? 0} |`);
}
p("");
p("Reject reason histogram:");
p("");
p("```");
for (const [reason, n] of Object.entries(gateSummary.rejectReasonHistogram ?? {}).sort(
  (a, b) => b[1] - a[1],
)) {
  p(`${n}\t${reason}`);
}
p("```");
p("");
p("## Judge gate (second machine gate — naturalness judge)");
p("");
if (judgeGateSummary) {
  p(`- Judged: **${judgeGateSummary.judged}**, kept as patches: **${judgeGateSummary.keptAsPatches}**, dropped: **${judgeGateSummary.droppedByJudge}**`);
  p(
    `- Judge accept rate: ${((judgeGateSummary.keptAsPatches / Math.max(judgeGateSummary.judged, 1)) * 100).toFixed(1)}%`,
  );
  p("");
  p("Per-module judged / dropped:");
  p("");
  p("| module | dropped by judge |");
  p("|---|---|");
  for (const [m, n] of Object.entries(judgeGateSummary.perModuleDropped ?? {}).sort(
    (a, b) => Number(a[0].slice(1)) - Number(b[0].slice(1)),
  )) {
    p(`| ${m} | ${n} |`);
  }
  p("");
  p("Judge issue histogram (dropped rows only):");
  p("");
  p("```");
  for (const [issue, n] of Object.entries(judgeGateSummary.judgeIssueHistogram ?? {}).sort(
    (a, b) => b[1] - a[1],
  )) {
    p(`${n}\t${issue}`);
  }
  p("```");
} else {
  p("(judge-gate.mjs has not run yet for this EXTEND_DIR — no judge-gate-summary.json.)");
}
p("");
p("Dropped-by-judge rows (reason from the judge):");
p("");
p("```");
for (const r of judgeRejects.slice(0, 30)) {
  p(`${r.stepId}\t[${r.judgeIssue}]\t${r.judgeReason}`);
}
if (judgeRejects.length > 30) p(`... and ${judgeRejects.length - 30} more (see judge-rejects.jsonl)`);
p("```");
p("");
p("## What got added, by category (variety check)");
p("");
p("Heuristic classification of every accepted patch's `added` word(s) — for spotting an");
p("attractor (one category dominating) at a glance, not a gate.");
p("");
const PRONOUN_WORDS = new Set(["わたし", "ぼく", "あなた", "かれ", "かのじょ", "わたしたち"]);
const DEMONSTRATIVE_WORDS = new Set(["この", "その", "あの"]);
const TIME_WORDS = new Set([
  "きょう", "きのう", "あした", "あさって", "おととい", "まいにち", "まいあさ", "まいばん", "まいしゅう", "まいつき", "まいとし",
  "いま", "あさ", "ひる", "ばん", "よる", "ゆうべ", "こんばん", "こんしゅう", "せんしゅう", "らいしゅう",
  "こんげつ", "せんげつ", "らいげつ", "ことし", "きょねん", "らいねん",
]);
const ADVERB_WORDS = new Set([
  "ちょっと", "とても", "よく", "ほんとうに", "ぜんぜん", "すこし", "たくさん", "もう", "まだ", "すぐに", "いつも", "たまに",
]);
function categorizeAdded(word, candJa) {
  if (PRONOUN_WORDS.has(word)) return "pronoun";
  if (DEMONSTRATIVE_WORDS.has(word)) return "demonstrative";
  if (TIME_WORDS.has(word)) return "time";
  if (ADVERB_WORDS.has(word)) return "adverb";
  if (candJa.includes(`${word}を`)) return "object";
  if (candJa.includes(`${word}で`) || candJa.includes(`${word}に`)) return "place";
  return "other";
}
const categoryHist = {};
for (const row of patches) {
  for (const w of row.added ?? []) {
    const cat = categorizeAdded(w, row.newJa ?? "");
    categoryHist[cat] = (categoryHist[cat] || 0) + 1;
  }
}
p("```");
for (const [cat, n] of Object.entries(categoryHist).sort((a, b) => b[1] - a[1])) {
  p(`${n}\t${cat}`);
}
p("```");
p("");
p("## 20 lowest-confidence accepted rows");
p("");
p("`step-id  confidence  old-ja -> new-ja`");
p("");
p("```");
for (const row of [...patches].sort((a, b) => a.confidence - b.confidence).slice(0, 20)) {
  p(`${row.stepId}\t${row.confidence.toFixed(2)}\t${row.oldJa} -> ${row.newJa}`);
}
p("```");
p("");
p("## Resume commands");
p("");
p("```bash");
p(`EXTEND_DIR="${EXTEND_DIR}"`);
p("node scripts/extend-answers/extract.mjs                       # re-sweep + rows.jsonl (idempotent)");
p("node scripts/extend-answers/propose.mjs                       # resumes from proposals.jsonl checkpoint");
p("node scripts/extend-answers/propose.mjs --retry \"$EXTEND_DIR/rejects.jsonl\"   # one retry pass, run standalone");
p("node scripts/extend-answers/gate.mjs                           # re-gate (idempotent given proposals.jsonl)");
p("node scripts/extend-answers/judge-gate.mjs                     # second gate: naturalness judge over patches.jsonl (overwrites it in place; backup at patches-pre-judge.jsonl)");
p("node scripts/extend-answers/sample-for-audit.mjs               # 12% stratified audit sample");
p("node scripts/extend-answers/report.mjs                         # regenerate this file");
p("bash scripts/extend-answers/run-full.sh                        # full pipeline, waits for GPU, nohup-able");
p("```");
p("");

const outFile = path.join(EXTEND_DIR, "REPORT.md");
fs.writeFileSync(outFile, lines.join("\n") + "\n");
console.log(`report.mjs: wrote ${outFile}`);
