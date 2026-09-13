#!/usr/bin/env node
/**
 * cap-output.mjs — pipe a verbose command's output through this to cap it
 * at ~120 lines (2026-09-13).
 *
 * Same compaction rule as `scripts/module-gate.mjs --compact` (see that
 * file's header), pulled out standalone so any script that shells out to a
 * verbose tool — a compiler, a linter — can reuse it without piping
 * through vitest's own machinery. Used by `docs/es-ir-sources/check-frag.sh`
 * to cap `compile-ir-es.mjs --check` diagnostics; the compiler itself is
 * unmodified, this only filters what already printed.
 *
 * Identical lines are grouped with a `[×N]` count instead of repeating —
 * the doctrine this repo has hit before (module-gate's own comment):
 * "A wall of identical failures usually means the harness, not the code."
 * A distinct line is a distinct problem; a repeated one is one problem
 * counted, not N lines of noise.
 *
 * Usage:
 *   some-verbose-command 2>&1 | node scripts/authoring/cap-output.mjs
 *   some-verbose-command 2>&1 | node scripts/authoring/cap-output.mjs --cap 80
 *
 * This is a formatter, not a check — it always exits 0. Capture the real
 * command's exit code from the pipeline yourself (zsh: `$pipestatus[1]`;
 * bash: `${PIPESTATUS[0]}`) BEFORE piping, not from this script.
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const capFlagIdx = args.indexOf("--cap");
const CAP = capFlagIdx !== -1 ? parseInt(args[capFlagIdx + 1], 10) : 120;

const input = readFileSync(0, "utf-8");
const allLines = input.split("\n");
// Trailing blank line from a final \n shouldn't count against the budget.
const lines = allLines[allLines.length - 1] === "" ? allLines.slice(0, -1) : allLines;

if (lines.length <= CAP) {
  process.stdout.write(input);
  process.exit(0);
}

// Group identical (trimmed) lines; keep first-seen order.
const groups = new Map(); // trimmed line -> { count, original }
const order = [];
for (const line of lines) {
  const key = line.trim();
  if (key === "") continue;
  if (!groups.has(key)) {
    groups.set(key, { count: 0, original: line });
    order.push(key);
  }
  groups.get(key).count++;
}

const out = [];
out.push(
  `(${lines.length} lines, ${groups.size} distinct — capped to ~${CAP}; identical lines grouped)`,
);
for (const key of order) {
  if (out.length >= CAP) break;
  const g = groups.get(key);
  out.push(g.count > 1 ? `${g.original}  [×${g.count}]` : g.original);
}
if (out.length >= CAP) {
  out.length = CAP - 1;
  out.push(`… capped at ${CAP} lines (${groups.size} distinct messages total)`);
}
console.log(out.join("\n"));
