#!/usr/bin/env node
// Strips verdicts with out-of-range confidence (not in [0,1] — the pre-fix
// judge.mjs schema didn't validate this; seen as literal `5`) so the next
// `judge.mjs <setName>` run re-judges exactly those rows under the now-fixed
// schema/validate(). Backs up first, same pattern as strip-issue-types.mjs.
// Usage: node scripts/naturalness/strip-bad-confidence.mjs <words|sentences>
import fs from "node:fs";
import path from "node:path";
const OUT_DIR =
  "/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/naturalness";
const setName = process.argv[2];
if (!setName) {
  console.error("usage: node strip-bad-confidence.mjs <words|sentences>");
  process.exit(1);
}
const file = path.join(OUT_DIR, `verdicts-${setName}.jsonl`);
const all = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
const bad = (v) => typeof v.confidence !== "number" || v.confidence < 0 || v.confidence > 1;
const stripped = all.filter(bad);
const kept = all.filter((v) => !bad(v));
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(OUT_DIR, `verdicts-${setName}-pre-confidence-repair-${ts}.jsonl`);
fs.writeFileSync(backup, all.map((v) => JSON.stringify(v)).join("\n") + "\n");
fs.writeFileSync(file, kept.map((v) => JSON.stringify(v)).join("\n") + "\n");
console.log(`backed up ${all.length} -> ${backup}`);
console.log(`stripped ${stripped.length} bad-confidence rows; ${kept.length} kept in ${file}`);
console.log(`run: node scripts/naturalness/judge.mjs ${setName}`);
