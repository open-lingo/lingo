#!/usr/bin/env node
/**
 * One-command module gate (2026-07-20 QA-infrastructure pass).
 *
 * A new/edited JA curriculum module (e.g. "m4-neo") has THREE separate
 * checks that must all pass before it's QA-ready — content lints + render
 * gate (vitest), TTS clip coverage (the emit script + manifest diff), and
 * the project typecheck — and today an author has to remember to run all
 * three, in order, by hand. This wires them into one command that fails
 * loud (non-zero exit) the moment any stage is red, with a single summary
 * table at the end so "is m4-neo ready?" is a one-glance answer instead of
 * three scrollback hunts.
 *
 * Usage:
 *   npm run module-gate -- m4-neo
 *   MODULE_GATE_CAPTURE=1 npm run module-gate -- m4-neo --lessons=ja-m4-neo-1,ja-m4-neo-2
 *
 * Stages (sequential — a stage still RUNS even if an earlier one failed, so
 * one summary always covers all three-or-four; only the exit code reflects
 * failure):
 *   1. `npx vitest run` filtered to the module's test files
 *      (`curriculum/<module>*.test.ts*` — vitest's CLI filter is a path
 *      substring match against files already selected by the project's
 *      `*.test.{ts,tsx}` include glob, so this is equivalent to the literal
 *      glob without reimplementing vitest's file discovery).
 *   2. `node scripts/emit-tts-deck.mjs` (regenerates the JA TTS deck from
 *      ALL curriculum sources — not module-scoped, mirrors the script's own
 *      scope) then a coverage diff: every deck card's `front` (and its
 *      trailing-。-stripped variant, matching the runtime TTS lookup
 *      fallback) must resolve to a `ja:` key in `src/pub/tts/manifest.json`.
 *   3. `npx tsc --noEmit` (whole-project — matches `npm run build`'s own
 *      typecheck step; there's no cheaper module-scoped tsc).
 *   4. OPTIONAL, gated on `MODULE_GATE_CAPTURE=1`: the Gate 10 visual-QA
 *      contracts + capture npm scripts, over lesson ids passed via
 *      `--lessons=id1,id2` (no curriculum import here — ids are supplied,
 *      not derived, so this script stays content-agnostic). Skipped with a
 *      clear reason when the flag is unset or `--lessons` is missing.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const MANIFEST_PATH = resolve(ROOT, "src/pub/tts/manifest.json");
const DECK_PATH = resolve(ROOT, "../lingo-core/test_decks/ja-hiragana-curriculum.json");

// ── CLI args ────────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);
const positional = rawArgs.filter((a) => !a.startsWith("--"));
const moduleArg = positional[0];
const lessonsFlag = rawArgs.find((a) => a.startsWith("--lessons="));
const lessonIds = lessonsFlag
  ? lessonsFlag
      .slice("--lessons=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : [];

if (!moduleArg) {
  console.error("Usage: npm run module-gate -- <module> [--lessons=id1,id2]");
  console.error('Example: npm run module-gate -- m4-neo');
  process.exit(1);
}

// ── stage runner ────────────────────────────────────────────────────────

/** @type {{ name: string; status: "PASS" | "FAIL" | "SKIP"; detail: string; ms: number }[]} */
const results = [];

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    encoding: "utf-8",
    ...opts,
  });
}

function stage(name, fn) {
  console.log(`\n=== module-gate: ${name} ===`);
  const start = Date.now();
  let outcome;
  try {
    outcome = fn();
  } catch (err) {
    outcome = { status: "FAIL", detail: String(err?.message ?? err) };
  }
  const ms = Date.now() - start;
  results.push({ name, ms, ...outcome });
  return outcome.status;
}

// ── stage 1: vitest over the module's test files ───────────────────────

stage(`vitest run curriculum/${moduleArg}*`, () => {
  const filter = `curriculum/${moduleArg}`;
  const res = run("npx", ["vitest", "run", filter]);
  return res.status === 0
    ? { status: "PASS", detail: `filter "${filter}"` }
    : { status: "FAIL", detail: `filter "${filter}" — vitest exited ${res.status}` };
});

// ── stage 2: TTS deck emit + manifest coverage ──────────────────────────

stage("TTS deck emit + manifest coverage", () => {
  const emit = run("node", ["scripts/emit-tts-deck.mjs"]);
  if (emit.status !== 0) {
    return { status: "FAIL", detail: `emit-tts-deck.mjs exited ${emit.status}` };
  }

  let manifest;
  let deck;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
  } catch (err) {
    return {
      status: "FAIL",
      detail: `could not read/parse manifest at ${MANIFEST_PATH}: ${err.message}`,
    };
  }
  try {
    deck = JSON.parse(readFileSync(DECK_PATH, "utf-8"));
  } catch (err) {
    return {
      status: "FAIL",
      detail: `could not read/parse deck at ${DECK_PATH}: ${err.message}`,
    };
  }

  const cards = Array.isArray(deck.cards) ? deck.cards : [];
  const missing = [];
  for (const card of cards) {
    const front = card.front;
    if (typeof front !== "string") continue;
    const stripped = front.endsWith("。") ? front.slice(0, -1) : front;
    const hasKey = `ja:${front}` in manifest || `ja:${stripped}` in manifest;
    if (!hasKey) missing.push(card);
  }

  if (missing.length > 0) {
    console.log(`${missing.length} of ${cards.length} deck cards have no ja: manifest entry:`);
    for (const c of missing.slice(0, 25)) {
      console.log(`  - ${c.id}: "${c.front}"`);
    }
    if (missing.length > 25) console.log(`  … and ${missing.length - 25} more`);
    return {
      status: "FAIL",
      detail: `${missing.length}/${cards.length} cards missing TTS clips`,
    };
  }
  return { status: "PASS", detail: `${cards.length}/${cards.length} cards have TTS clips` };
});

// ── stage 3: project typecheck ──────────────────────────────────────────

stage("tsc --noEmit", () => {
  const res = run("npx", ["tsc", "--noEmit"]);
  return res.status === 0
    ? { status: "PASS", detail: "clean" }
    : { status: "FAIL", detail: `tsc exited ${res.status}` };
});

// ── stage 4 (optional): visual-QA contracts + capture ───────────────────

stage("visual-QA contracts + capture (optional)", () => {
  if (process.env.MODULE_GATE_CAPTURE !== "1") {
    return { status: "SKIP", detail: "MODULE_GATE_CAPTURE not set to 1" };
  }
  if (lessonIds.length === 0) {
    return { status: "SKIP", detail: "no --lessons=id1,id2 flag supplied" };
  }
  const env = { ...process.env, VISUAL_QA_LESSONS: lessonIds.join(",") };
  const contracts = run("npm", ["run", "visual-qa:contracts"], { env });
  if (contracts.status !== 0) {
    return { status: "FAIL", detail: "visual-qa:contracts failed" };
  }
  const capture = run("npm", ["run", "visual-qa:capture"], { env });
  return capture.status === 0
    ? { status: "PASS", detail: `${lessonIds.length} lesson(s) captured` }
    : { status: "FAIL", detail: "visual-qa:capture failed" };
});

// Stage 5 — exposure audit (invariant 27): report-only, never fails the
// gate — its output feeds the NEXT module's spec (under-reinforced
// CEJC-frequent words become tail/carrier directives).
stage("exposure audit (report-only)", () => {
  const audit = run("node", [resolve(__dirname, "exposure-audit.mjs")]);
  if (audit.stdout) process.stdout.write(audit.stdout);
  return {
    status: audit.status === 0 ? "PASS" : "WARN",
    detail: "informational — see table above",
  };
});

// ── summary ─────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(60)}`);
console.log(`module-gate summary — ${moduleArg}`);
console.log("=".repeat(60));
for (const r of results) {
  const secs = (r.ms / 1000).toFixed(1).padStart(5);
  console.log(`[${r.status.padEnd(4)}] ${r.name.padEnd(38)} ${secs}s  ${r.detail ?? ""}`);
}
console.log("=".repeat(60));

const failed = results.filter((r) => r.status === "FAIL");
const overall = failed.length === 0 ? "PASS" : "FAIL";
console.log(`RESULT: ${overall}${failed.length ? ` (${failed.length} stage(s) failed: ${failed.map((f) => f.name).join(", ")})` : ""}`);
process.exit(failed.length === 0 ? 0 : 1);
