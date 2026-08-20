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
 *      (`curriculum/__tests__/<module>-neo` — vitest's CLI filter is a path
 *      substring match against files already selected by the project's
 *      `*.test.{ts,tsx}` include glob, so this is equivalent to the literal
 *      glob without reimplementing vitest's file discovery). The filter used
 *      to read `curriculum/<module>`, which stopped matching anything when the
 *      module tests moved into `curriculum/__tests__/` — the stage reported
 *      "vitest exited 1" for every module, m30 included, and the FAIL looked
 *      like a content problem rather than a dead filter. Fixed 2026-08-15.
 *   2. `node scripts/emit-tts-deck.mjs` (regenerates the JA TTS deck from
 *      ALL curriculum sources — not module-scoped, mirrors the script's own
 *      scope) then a coverage diff: every deck card's `front` (and its
 *      trailing-。-stripped variant, matching the runtime TTS lookup
 *      fallback) must resolve to a published clip. Resolution mirrors
 *      `src/shared/tts/manifest.ts` against the schema-2 manifest at
 *      `src/shared/tts/manifests/ja.json` — an `overrides` hit, else
 *      sha256("ja:<text>")[:16] present in the packed `hashes` string.
 *   3. `npx tsc --noEmit` (whole-project — matches `npm run build`'s own
 *      typecheck step; there's no cheaper module-scoped tsc).
 *   4. OPTIONAL, gated on `MODULE_GATE_CAPTURE=1`: the Gate 10 visual-QA
 *      contracts + capture npm scripts, over lesson ids passed via
 *      `--lessons=id1,id2` (no curriculum import here — ids are supplied,
 *      not derived, so this script stays content-agnostic). Skipped with a
 *      clear reason when the flag is unset or `--lessons` is missing.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/** Same derivation as src/shared/tts/sha256.ts and the Python generator. */
const sha256Hex16 = (s) =>
  createHash("sha256").update(s, "utf8").digest("hex").slice(0, 16);

const MANIFEST_PATH = resolve(ROOT, "src/shared/tts/manifests/ja.json");
const DECK_PATH = resolve(
  ROOT,
  "../lingo-data/data/test_decks/ja-hiragana-curriculum.json",
);

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

stage(`vitest run ${moduleArg} module tests`, () => {
  // The filter is a path SUBSTRING, and module tests live in
  // `curriculum/__tests__/mN-neo.test.ts` — so the historical
  // `curriculum/${moduleArg}` filter matched NOTHING for any module and this
  // stage had been reporting FAIL-on-no-files since the tests moved into
  // `__tests__/` (verified 2026-08-15 against m30 as well as m31). Match the
  // real directory, and accept both `m31` and `m31-neo` as the argument.
  const base = moduleArg.replace(/-neo$/, "");
  const filter = `curriculum/__tests__/${base}-neo`;
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

  // Schema 2 packs every existing hash16 into one sorted string; slice it
  // back into a Set the same way the runtime resolver does.
  const hashes = new Set();
  const packed = typeof manifest.hashes === "string" ? manifest.hashes : "";
  for (let i = 0; i + 16 <= packed.length; i += 16) {
    hashes.add(packed.slice(i, i + 16));
  }
  const overrides = manifest.overrides ?? {};
  const covered = (text) =>
    text in overrides || hashes.has(sha256Hex16(`ja:${text}`));

  const cards = Array.isArray(deck.cards) ? deck.cards : [];
  const missing = [];
  for (const card of cards) {
    const front = card.front;
    if (typeof front !== "string") continue;
    const stripped = front.endsWith("。") ? front.slice(0, -1) : front;
    if (!covered(front) && !covered(stripped)) missing.push(card);
  }

  if (missing.length > 0) {
    console.log(`${missing.length} of ${cards.length} deck cards have no ja clip:`);
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

// ── stage 4: visual-QA contracts + capture ──────────────────────────────
// DEFAULT ON (methodology audit 2026-07-20, Gap 3): the workflow calls
// visual QA mandatory, but this used to SKIP unless MODULE_GATE_CAPTURE=1
// AND --lessons were both passed — so running the documented command
// silently skipped the mandatory step. Now it runs by default, auto-
// deriving lesson ids from the module's curriculum files, with an
// explicit --skip-visual escape (a SKIP here is now VISIBLE and chosen,
// never accidental). The follow-up judge still runs separately.
function deriveLessonIds() {
  if (lessonIds.length) return lessonIds;
  const dir = resolve(ROOT, "src/features/languages/ja/curriculum");
  let ids = new Set();
  try {
    for (const f of readdirSync(dir)) {
      if (!new RegExp(`^${moduleArg.replace("-neo", "")}-neo`).test(f)) continue;
      if (f.includes(".test.")) continue;
      const src = readFileSync(resolve(dir, f), "utf-8");
      // Two shapes. Hand-written modules spell lessons out as object
      // literals (`id: "ja-mN-neo-3"`); IR-compiled ones (m30+) only name
      // them in the export list as `byId("ja-mN-neo-3")` — matching just
      // the first shape derived ZERO ids for every IR module, which made
      // this stage FAIL-by-default from m30 on. Both forms count.
      for (const m of src.matchAll(/(?:id:\s*|byId\()"(ja-m\d+-neo(?:-[\w-]+)?)"/g)) {
        // lesson ids only — <n> | review | review-<n> | challenge — not step ids
        if (/^ja-m\d+-neo-(\d+|review(-\d+)?|challenge)$/.test(m[1])) ids.add(m[1]);
      }
    }
  } catch { /* no files — leave empty */ }
  return [...ids];
}

stage("visual-QA contracts + capture", () => {
  if (rawArgs.includes("--skip-visual")) {
    return { status: "SKIP", detail: "--skip-visual (explicitly chosen)" };
  }
  const ids = deriveLessonIds();
  if (ids.length === 0) {
    return { status: "FAIL", detail: "no lesson ids derivable — pass --lessons= or --skip-visual" };
  }
  const env = { ...process.env, VISUAL_QA_LESSONS: ids.join(",") };
  const contracts = run("npm", ["run", "visual-qa:contracts"], { env });
  if (contracts.status !== 0) {
    return { status: "FAIL", detail: "visual-qa:contracts failed" };
  }
  const capture = run("npm", ["run", "visual-qa:capture"], { env });
  return capture.status === 0
    ? { status: "PASS", detail: `${ids.length} lesson(s) captured` }
    : { status: "FAIL", detail: "visual-qa:capture failed" };
});

// Stage 5 — FULL suite, CI parity. The scoped vitest stage (1) is the
// fast inner loop; this is the outer gate. Cycle-2 retro: six straight
// red CI runs happened because pushes were validated with scoped runs
// only — cross-cutting tests (mockCourse map expectations, atom-coverage
// pool reseeding, the M5+ listening ratchet) live OUTSIDE the module's
// test files. Skippable for quick iterations via MODULE_GATE_FAST=1;
// never skip before pushing.
if (process.env.MODULE_GATE_FAST === "1") {
  stage("FULL vitest (CI parity)", () => ({ status: "SKIP", detail: "MODULE_GATE_FAST=1" }));
} else {
  stage("FULL vitest (CI parity)", () => {
    const full = run("npx", ["vitest", "run"]);
    return full.status === 0
      ? { status: "PASS", detail: "whole suite green" }
      : { status: "FAIL", detail: "full suite red — fix before pushing" };
  });
}

// Stage 6 — exposure audit (invariant 27): report-only, never fails the
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
