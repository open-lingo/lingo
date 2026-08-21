#!/usr/bin/env node
// weekly-check.mjs — the "ask, don't run" gate for time-intensive maintenance.
//
// Runs SYNCHRONOUSLY in the SessionStart hook (instant — just a timestamp compare).
// If it's been >= a week since the heavy maintenance last ran, it prints a notice
// to stdout, which the hook surfaces into the session context so the agent ASKS
// Spencer whether to run it. It NEVER runs the heavy jobs itself.
//
//   node weekly-check.mjs         # check; print the ask if due (and stamp lastPrompt)
//   node weekly-check.mjs --ran   # record that the heavy maintenance JUST ran now
//   node weekly-check.mjs --seed   # initialize timestamps to now (no notice)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../..");
const STATE = join(ROOT, "artifacts/code-index/.heavy-maintenance.json");
const DAY = 86_400_000;
const WEEK = 7 * DAY;

const flag = process.argv[2];
mkdirSync(dirname(STATE), { recursive: true });

function read() {
  try { return JSON.parse(readFileSync(STATE, "utf8")); } catch { return { lastRun: 0, lastPrompt: 0 }; }
}
function write(s) { writeFileSync(STATE, JSON.stringify(s, null, 2)); }

const now = Date.now();

if (flag === "--ran") {
  write({ lastRun: now, lastPrompt: now });
  console.log("[weekly-check] heavy maintenance stamped as run now.");
  process.exit(0);
}
if (flag === "--seed") {
  write({ lastRun: now, lastPrompt: now });
  process.exit(0);
}

// default: is it due, and have we not already prompted in the last ~6 days?
const s = read();
const due = now - (s.lastRun || 0) >= WEEK;
const recentlyPrompted = now - (s.lastPrompt || 0) < 6 * DAY;

if (due && !recentlyPrompted) {
  write({ ...s, lastPrompt: now });
  const lastRunStr = s.lastRun ? new Date(s.lastRun).toISOString().slice(0, 10) : "never";
  // This line lands in the agent's session context via the hook.
  console.log(
    `[code-index] Weekly maintenance is DUE (last heavy run: ${lastRunStr}). ` +
    `ASK Spencer before running anything: offer to (1) refresh the embedding index ` +
    `(re-embeds files changed this week — a few minutes; ` +
    `\`node scripts/code-index/embed/embed-cli.mjs index\`), and (2) run a deep ` +
    `code-health review of the latest artifacts/code-index/LEDGER.md (drift + ` +
    `dead-code candidates). Do NOT run either without a yes. After running, stamp ` +
    `it: \`node scripts/code-index/weekly-check.mjs --ran\`.`,
  );
}
// silent (exit 0) when not due — no context noise.
