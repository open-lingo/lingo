#!/usr/bin/env node
/**
 * Extend-answers lane — Step 3.5: a SECOND machine gate over gate.mjs's
 * accepted patches, using the repo's existing naturalness judge
 * (scripts/naturalness/judge.mjs) rather than reinventing a quality check.
 * The mechanical gate (unknown-word/pronoun-padding/tail-preserved/etc.)
 * only proves a candidate is built from legal words in a legal shape — it
 * has no way to catch tense mismatches ("きのう … かわない" — a past time
 * word with a non-past negative) or semantic drift a fluent reader would
 * flag ("あさ かいしゃの しごとに いかなきゃ" reads as "my company work").
 * That is exactly what the naturalness judge already does for the JA
 * course, so this step reuses it instead of writing a second bespoke
 * checker (lead's instruction: do not change judge.mjs's existing
 * behaviour, just drive it with a new set name).
 *
 * judge.mjs's OUT_DIR is hard-coded to scratchpad/fb16-research/naturalness
 * (not env-configurable) and its set-name handling is fully generic
 * (`runSet(setName)` just string-interpolates rows-${setName}.jsonl /
 * verdicts-${setName}.jsonl — nothing hard-codes "words"/"sentences"), so
 * no changes to judge.mjs were needed. This script writes the rows file to
 * BOTH the extend lane's own directory (judge-rows.jsonl, for visibility/
 * traceability) and the exact path judge.mjs reads from
 * (naturalness/rows-extend.jsonl) — same content, two locations.
 *
 * Usage: node scripts/extend-answers/judge-gate.mjs
 *
 * Reads:  <EXTEND_DIR>/patches.jsonl
 * Writes: <EXTEND_DIR>/judge-rows.jsonl        (traceability copy of the input handed to judge.mjs)
 *         <NATURALNESS_DIR>/rows-extend.jsonl  (the file judge.mjs actually reads)
 *         <NATURALNESS_DIR>/verdicts-extend.jsonl (judge.mjs's own output)
 *         <EXTEND_DIR>/patches-pre-judge.jsonl (backup of patches.jsonl before this gate)
 *         <EXTEND_DIR>/patches.jsonl           (OVERWRITTEN: judge-flagged rows removed)
 *         <EXTEND_DIR>/judge-rejects.jsonl     (dropped rows + the judge's reason)
 *         <EXTEND_DIR>/judge-gate-summary.json
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const EXTEND_DIR =
  process.env.EXTEND_DIR ||
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/extend";
const NATURALNESS_DIR =
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/naturalness";
const SET_NAME = "extend";

const PATCHES_FILE = path.join(EXTEND_DIR, "patches.jsonl");
const JUDGE_ROWS_TRACE = path.join(EXTEND_DIR, "judge-rows.jsonl");
const JUDGE_ROWS_REAL = path.join(NATURALNESS_DIR, `rows-${SET_NAME}.jsonl`);
const VERDICTS_FILE = path.join(NATURALNESS_DIR, `verdicts-${SET_NAME}.jsonl`);
const PRE_JUDGE_BACKUP = path.join(EXTEND_DIR, "patches-pre-judge.jsonl");
const JUDGE_REJECTS_OUT = path.join(EXTEND_DIR, "judge-rejects.jsonl");
const SUMMARY_OUT = path.join(EXTEND_DIR, "judge-gate-summary.json");

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}
function writeJsonl(file, rows) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""));
}

async function main() {
  const patches = readJsonl(PATCHES_FILE);
  if (patches.length === 0) {
    console.log("judge-gate.mjs: no patches.jsonl (or empty) — nothing to judge. Run gate.mjs first.");
    return;
  }

  // rows-sentences.jsonl shape (scripts/naturalness/extract.mjs), reused
  // exactly so judge.mjs's buildUserMessage/stratifyByModule need no changes.
  const judgeRows = patches.map((p) => ({
    id: p.stepId,
    module: p.module,
    lesson: p.lessonId,
    kind: "sentence",
    ja: p.newJa,
    kana: null,
    kanji: null,
    en: p.newEn,
    neighbours: [],
    sourceFile: p.beatRef?.file ?? null,
    sourceLine: p.beatRef?.line ?? null,
  }));
  writeJsonl(JUDGE_ROWS_TRACE, judgeRows);
  writeJsonl(JUDGE_ROWS_REAL, judgeRows);
  console.log(`judge-gate.mjs: ${judgeRows.length} rows -> ${JUDGE_ROWS_TRACE} and ${JUDGE_ROWS_REAL}`);

  console.log(`judge-gate.mjs: running scripts/naturalness/judge.mjs ${SET_NAME}...`);
  execFileSync("node", ["scripts/naturalness/judge.mjs", SET_NAME], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      NATURALNESS_BATCH_SIZE: process.env.NATURALNESS_BATCH_SIZE || "10",
      NATURALNESS_CONCURRENCY: process.env.NATURALNESS_CONCURRENCY || "1",
    },
    stdio: "inherit",
  });

  const verdicts = readJsonl(VERDICTS_FILE);
  const verdictById = new Map(verdicts.map((v) => [v.row_id, v]));

  const kept = [];
  const dropped = [];
  for (const p of patches) {
    const v = verdictById.get(p.stepId);
    if (v && v.verdict === "fix") {
      dropped.push({
        stepId: p.stepId,
        module: p.module,
        lessonId: p.lessonId,
        newJa: p.newJa,
        newEn: p.newEn,
        judgeIssue: v.issue,
        judgeReason: v.reason,
        judgeReplacementEn: v.replacement_en,
        judgeReplacementJa: v.replacement_ja,
        judgeConfidence: v.confidence,
      });
    } else {
      kept.push(p);
    }
  }

  fs.copyFileSync(PATCHES_FILE, PRE_JUDGE_BACKUP);
  writeJsonl(PATCHES_FILE, kept);
  writeJsonl(JUDGE_REJECTS_OUT, dropped);

  const perModuleJudged = {};
  const perModuleDropped = {};
  for (const p of patches) perModuleJudged[p.module] = (perModuleJudged[p.module] || 0) + 1;
  for (const d of dropped) perModuleDropped[d.module] = (perModuleDropped[d.module] || 0) + 1;
  const issueHistogram = {};
  for (const d of dropped) issueHistogram[d.judgeIssue] = (issueHistogram[d.judgeIssue] || 0) + 1;

  const summary = {
    judged: patches.length,
    verdictsReceived: verdicts.length,
    keptAsPatches: kept.length,
    droppedByJudge: dropped.length,
    perModuleJudged,
    perModuleDropped,
    judgeIssueHistogram: issueHistogram,
  };
  fs.writeFileSync(SUMMARY_OUT, JSON.stringify(summary, null, 2));
  console.log(
    `judge-gate.mjs: judged ${patches.length}, kept ${kept.length}, dropped ${dropped.length} -> ${SUMMARY_OUT}`,
  );
}

main().catch((err) => {
  console.error("judge-gate.mjs: fatal", err);
  process.exit(1);
});
