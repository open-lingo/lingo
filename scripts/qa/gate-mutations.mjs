#!/usr/bin/env node
// gate-mutations — the "prove the verifier can fail" runner.
//
// Project review 2026-09-17 §3 "Sweep for checks that cannot fail" (lane
// A5e). `scripts/qa/vacuity-lint.mjs` checks that a gate test FILE is
// structurally non-empty (a floor exists somewhere in the file). It does
// NOT check that the gate actually catches the defect it claims to catch —
// a file can have a perfectly good `toBeGreaterThan(0)` floor on an
// unrelated collection while the loop that matters has a selector bug, a
// too-loose comparison, or a sample that happens to be empty on every real
// input today. This script closes that gap: for each entry in
// `gate-mutations.json`, it introduces the CHEAPEST real-world mutation
// that should make the gate fail (an edit to actual content/IR/component
// source, an env var, or a renamed artifact — never an edit to the test
// file itself, which would prove nothing), runs the gate's test command,
// and reports CAUGHT / MISSED / ERROR.
//
// SAFETY: every mutation is applied to the real working tree (this is a
// throwaway lane worktree, not the shared checkout) and is ALWAYS restored
// — on success, on a failed run, on a thrown error, and on SIGINT/SIGTERM —
// via a byte-for-byte backup taken before the mutation and process exit
// handlers that restore before exiting. `git status --porcelain` is empty
// before the process exits normally; run it yourself after a killed run as
// a second check.
//
// Usage:
//   node scripts/qa/gate-mutations.mjs                  # run every entry
//   node scripts/qa/gate-mutations.mjs --only sceneVocabGate
//   node scripts/qa/gate-mutations.mjs --json            # machine-readable
//   node scripts/qa/gate-mutations.mjs --skip-baseline   # skip the pre-mutation sanity pass (faster, less proof)
//
// Adding an entry: see gate-mutations.json's header comment and
// docs/gate-mutations-2026-09-17.md's "how to add an entry" section —
// every new gate ships with its mutation.

import { readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const CONFIG_PATH = join(__dirname, "gate-mutations.json");

// --- CLI args ---
const args = process.argv.slice(2);
const onlyIdx = args.indexOf("--only");
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
const asJson = args.includes("--json");
const skipBaseline = args.includes("--skip-baseline");

// --- active restore registry (so a signal mid-run still cleans up) ---
const pendingRestores = [];
function restoreAll() {
  while (pendingRestores.length > 0) {
    const restore = pendingRestores.pop();
    try {
      restore();
    } catch (e) {
      console.error(`[gate-mutations] RESTORE FAILED — fix by hand: ${e.message}`);
    }
  }
}
process.on("SIGINT", () => {
  restoreAll();
  process.exit(130);
});
process.on("SIGTERM", () => {
  restoreAll();
  process.exit(143);
});
process.on("uncaughtException", (e) => {
  console.error("[gate-mutations] uncaught exception, restoring before exit:", e);
  restoreAll();
  process.exit(1);
});

/** Applies `mutation` to the tree rooted at `root`, returns a zero-arg
 *  restore function. Never leaves a backup file behind after restore. */
export function applyMutation(root, mutation) {
  if (mutation.kind === "edit") {
    const path = join(root, mutation.file);
    const original = readFileSync(path, "utf8");
    if (!original.includes(mutation.find)) {
      throw new Error(`edit mutation: "find" string not present in ${mutation.file}`);
    }
    const mutated = original.replace(mutation.find, mutation.replace ?? "");
    writeFileSync(path, mutated);
    return () => writeFileSync(path, original);
  }

  if (mutation.kind === "env") {
    const key = mutation.key;
    const had = Object.prototype.hasOwnProperty.call(process.env, key);
    const prev = process.env[key];
    process.env[key] = mutation.value;
    return () => {
      if (had) process.env[key] = prev;
      else delete process.env[key];
    };
  }

  if (mutation.kind === "rename") {
    const from = join(root, mutation.from);
    const to = join(root, mutation.to);
    if (!existsSync(from)) {
      throw new Error(`rename mutation: source ${mutation.from} does not exist`);
    }
    if (existsSync(to)) {
      throw new Error(`rename mutation: destination ${mutation.to} already exists — refusing to clobber`);
    }
    renameSync(from, to);
    return () => renameSync(to, from);
  }

  throw new Error(`unknown mutation kind: ${mutation.kind}`);
}

/** Runs a shell command (via `sh -c`), returns { exitCode, seconds, stdout, stderr }. */
function runCmd(cmd, cwd, extraEnv = {}) {
  const start = Date.now();
  const result = spawnSync(cmd, {
    cwd,
    shell: true,
    env: { ...process.env, ...extraEnv },
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 50,
  });
  const seconds = (Date.now() - start) / 1000;
  return {
    exitCode: result.status ?? (result.signal ? -1 : 1),
    seconds,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/** Runs one gate-mutation entry. Returns a result row. Restores the tree
 *  before returning, whatever happened. `root` defaults to the real repo
 *  root; tests pass a temp fixture directory instead so nothing here ever
 *  touches the real tree. */
export function runEntry(entry, { skipBaseline: skipBase = false, root = ROOT } = {}) {
  const row = { gate: entry.gate, mutation: describeMutation(entry.mutation), result: null, seconds: 0, detail: "" };

  if (!skipBase) {
    const baseline = runCmd(entry.testCmd, root);
    if (baseline.exitCode !== 0) {
      row.result = "ERROR";
      row.detail = "baseline (unmutated) run did not pass — gate is already red, cannot prove the mutation caused the failure";
      row.seconds = baseline.seconds;
      return row;
    }
  }

  let restore;
  try {
    restore = applyMutation(root, entry.mutation);
  } catch (e) {
    row.result = "ERROR";
    row.detail = `could not apply mutation: ${e.message}`;
    return row;
  }
  pendingRestores.push(restore);

  let mutated;
  try {
    mutated = runCmd(entry.testCmd, root);
  } finally {
    // restore immediately after the run, not at process end, so a crash
    // mid-batch leaves the smallest possible mutated window
    const idx = pendingRestores.indexOf(restore);
    if (idx >= 0) pendingRestores.splice(idx, 1);
    restore();
  }

  row.seconds = mutated.seconds;
  if (entry.expect === "fail") {
    row.result = mutated.exitCode !== 0 ? "CAUGHT" : "MISSED";
  } else {
    row.result = mutated.exitCode === 0 ? "CAUGHT" : "MISSED"; // expect "pass" (rare: proving a false-positive guard)
  }
  if (row.result === "MISSED") {
    row.detail = "gate stayed green under a mutation that should have flipped it";
  }
  return row;
}

function describeMutation(m) {
  if (m.kind === "edit") return `edit ${m.file}`;
  if (m.kind === "env") return `env ${m.key}=${m.value}`;
  if (m.kind === "rename") return `rename ${m.from} -> ${m.to}`;
  return m.kind;
}

function main() {
  const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  const entries = only ? config.filter((e) => e.gate === only) : config;
  if (only && entries.length === 0) {
    console.error(`[gate-mutations] no entry named "${only}" in gate-mutations.json`);
    process.exit(1);
  }

  const rows = [];
  for (const entry of entries) {
    process.stderr.write(`[gate-mutations] running ${entry.gate}...\n`);
    const row = runEntry(entry, { skipBaseline });
    rows.push(row);
  }

  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    const w = { gate: 28, mutation: 40, result: 8, seconds: 8 };
    const pad = (s, n) => String(s).padEnd(n).slice(0, Math.max(n, String(s).length));
    console.log(`${pad("gate", w.gate)} ${pad("mutation", w.mutation)} ${pad("result", w.result)} seconds`);
    for (const r of rows) {
      console.log(`${pad(r.gate, w.gate)} ${pad(r.mutation, w.mutation)} ${pad(r.result, w.result)} ${r.seconds.toFixed(1)}${r.detail ? `  — ${r.detail}` : ""}`);
    }
    const missed = rows.filter((r) => r.result === "MISSED");
    const errored = rows.filter((r) => r.result === "ERROR");
    console.log(`\n${rows.length} run: ${rows.length - missed.length - errored.length} CAUGHT, ${missed.length} MISSED, ${errored.length} ERROR`);
  }

  const anyMissed = rows.some((r) => r.result === "MISSED" || r.result === "ERROR");
  process.exitCode = anyMissed ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
