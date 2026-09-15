#!/usr/bin/env node
/**
 * Extend-answers lane — Step 3: mechanical gates over propose.mjs's output.
 *
 * Gates (all mechanical, see zzExtendAnswersHarness.test.ts's runGate()):
 *   (a) every tile of the candidate, re-tokenized with the REAL compiler
 *       tokenizer (`makeGlobalTokenizer`, moduleCompiler.ts) seeded with
 *       this row's availableWords, is in availableWords, the original
 *       tiles, or a fixed free-morpheme allowlist (だ/な/です/ます/...).
 *   (b) 5 <= tileCount <= 9
 *   (c) every original content token is still present (grammar point kept)
 *   (d) normalised key != any lessonSentences key, != any other accepted
 *       patch in the same lesson
 *   (e) politeness ending unchanged
 *
 * On reject: if EXACTLY ONE of the two candidates fails, the pass is
 * automatic (gate picks the first passer). If BOTH fail, the row is queued
 * for ONE retry (propose.mjs --retry) with the specific reasons attached,
 * then gated again. A row that fails twice is logged to rejects.jsonl and
 * left for a human/Sonnet lane.
 *
 * Runs the same throwaway vitest harness as extract.mjs (it needs the real
 * tokenizer + normalizeSentenceKey — see extract.mjs's header for why this
 * can't be plain tsx).
 *
 * Writes:
 *   <EXTEND_DIR>/patches.jsonl   accepted
 *   <EXTEND_DIR>/rejects.jsonl   rejected (after the retry, if any)
 *   <EXTEND_DIR>/gate-summary.json
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const EXTEND_DIR =
  process.env.EXTEND_DIR ||
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/extend";

const ROWS_FILE = path.join(EXTEND_DIR, "rows.jsonl");
const PROPOSALS_FILE = path.join(EXTEND_DIR, "proposals.jsonl");
const PATCHES_OUT = path.join(EXTEND_DIR, "patches.jsonl");
const REJECTS_OUT = path.join(EXTEND_DIR, "rejects.jsonl");
const GATE_SUMMARY = path.join(EXTEND_DIR, "gate-summary.json");
const HARNESS = "src/features/languages/ja/__tests__/zzExtendAnswersHarness.test.ts";

function runHarnessGate() {
  execFileSync("npx", ["vitest", "run", "--project", "curriculum", HARNESS], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      EXTEND_MODE: "gate",
      EXTEND_ROWS_OUT: ROWS_FILE,
      EXTEND_PROPOSALS_IN: PROPOSALS_FILE,
      EXTEND_PATCHES_OUT: PATCHES_OUT,
      EXTEND_REJECTS_OUT: REJECTS_OUT,
      EXTEND_SUMMARY_OUT: GATE_SUMMARY,
    },
    stdio: "inherit",
  });
  return JSON.parse(fs.readFileSync(GATE_SUMMARY, "utf8"));
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

async function main() {
  console.log("gate.mjs: pass 1...");
  let summary = runHarnessGate();
  console.log(`gate.mjs: pass 1 — accepted ${summary.accepted}, rejected ${summary.rejected}`);

  const rejects1 = readJsonl(REJECTS_OUT);
  const retryEligible = rejects1.filter((r) => r.eligibleForRetry);

  if (retryEligible.length > 0) {
    console.log(`gate.mjs: ${retryEligible.length} rows eligible for one retry — calling propose.mjs --retry...`);
    execFileSync("node", ["scripts/extend-answers/propose.mjs", "--retry", REJECTS_OUT], {
      cwd: REPO_ROOT,
      env: { ...process.env, EXTEND_DIR },
      stdio: "inherit",
    });
    console.log("gate.mjs: pass 2 (post-retry)...");
    summary = runHarnessGate();
    console.log(`gate.mjs: pass 2 — accepted ${summary.accepted}, rejected ${summary.rejected}`);
  }

  const rejectsFinal = readJsonl(REJECTS_OUT);
  const reasonHistogram = {};
  for (const r of rejectsFinal) {
    for (const reasonStr of r.reasons || [r.reasonCode]) {
      // Bucket by the reason CODE (first clause before the semicolon) so
      // "unknown token(s): X, Y" and "unknown token(s): Z" bucket together.
      const bucket = String(reasonStr).split(";")[0].split(" not in ")[0].trim();
      reasonHistogram[bucket] = (reasonHistogram[bucket] || 0) + 1;
    }
  }

  const patches = readJsonl(PATCHES_OUT);
  const perModule = {};
  for (const p of patches) perModule[p.module] = (perModule[p.module] || 0) + 1;
  const rejectPerModule = {};
  for (const r of rejectsFinal) rejectPerModule[r.module] = (rejectPerModule[r.module] || 0) + 1;

  const finalSummary = {
    accepted: patches.length,
    rejected: rejectsFinal.length,
    acceptRate: patches.length / Math.max(patches.length + rejectsFinal.length, 1),
    perModuleAccepted: perModule,
    perModuleRejected: rejectPerModule,
    rejectReasonHistogram: reasonHistogram,
  };
  fs.writeFileSync(GATE_SUMMARY, JSON.stringify(finalSummary, null, 2));
  console.log(`gate.mjs: FINAL — accepted ${finalSummary.accepted}, rejected ${finalSummary.rejected} (${(finalSummary.acceptRate * 100).toFixed(1)}%)`);
  console.log(`gate.mjs: summary -> ${GATE_SUMMARY}`);
}

main().catch((err) => {
  console.error("gate.mjs: fatal", err);
  process.exit(1);
});
