#!/usr/bin/env node
/**
 * Naturalness sweep — targeted re-run prep.
 *
 * Removes existing "fix" verdicts for the given issue type(s) from a
 * verdicts-<setName>.jsonl checkpoint file, backing up the original first.
 * After this runs, `node judge.mjs <setName>` will treat the stripped rows
 * as "remaining" and re-judge ONLY them (checkpoint-resume semantics do the
 * rest) — no separate re-run script needed.
 *
 * Usage: node scripts/naturalness/strip-issue-types.mjs words register structure
 */
import fs from "node:fs";
import path from "node:path";

const OUT_DIR =
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/naturalness";

const [setName, ...issueTypes] = process.argv.slice(2);
if (!setName || issueTypes.length === 0) {
  console.error(
    "usage: node strip-issue-types.mjs <words|sentences> <issueType> [issueType...]",
  );
  process.exit(1);
}

const verdictsFile = path.join(OUT_DIR, `verdicts-${setName}.jsonl`);
const all = fs
  .readFileSync(verdictsFile, "utf8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const issueSet = new Set(issueTypes);
const stripped = all.filter(
  (v) => v.verdict === "fix" && issueSet.has(v.issue),
);
const kept = all.filter((v) => !(v.verdict === "fix" && issueSet.has(v.issue)));

const ts = new Date().toISOString().replace(/[:.]/g, "-");
const backupFile = path.join(
  OUT_DIR,
  `verdicts-${setName}-pre-rerun-${ts}.jsonl`,
);
fs.writeFileSync(backupFile, all.map((v) => JSON.stringify(v)).join("\n") + "\n");
fs.writeFileSync(verdictsFile, kept.map((v) => JSON.stringify(v)).join("\n") + "\n");

console.log(
  `strip-issue-types.mjs: backed up ${all.length} rows -> ${backupFile}`,
);
console.log(
  `strip-issue-types.mjs: stripped ${stripped.length} rows (issue in [${issueTypes.join(",")}]) from ${verdictsFile}; ${kept.length} rows kept.`,
);
console.log(
  `strip-issue-types.mjs: run \`node scripts/naturalness/judge.mjs ${setName}\` now to re-judge exactly the stripped rows (checkpoint-resume).`,
);
