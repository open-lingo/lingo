#!/usr/bin/env node
// Golden-learner replay runner (2026-09-17, lane A2d).
//
// Runs every `tests/visual/golden/<name>.replay.json` through
// `sim-capture.mjs --replay <file>` and prints one table:
//
//   name | taps | verdicts | pixelDiff % | PASS/FAIL
//
// Exits non-zero if ANY golden fails. "PASS/FAIL" here means: did the tap
// sequence replay (every recorded label found on screen), AND does the
// settled stage crop still match the golden's own baseline PNG within the
// pixel threshold? It does NOT mean every one of the 8 geometry verdicts
// printed PASS — a golden can legitimately carry a KNOWN, already-decided
// defect (e.g. `stageFits` FAIL on a 21-tile huge-bank step at 125%, see
// docs/handoff-2026-09-17-project-review.md's P1b decision) and still be a
// GOOD golden: replaying it and getting the EXACT SAME verdict + 0% pixel
// diff proves nothing regressed, which is the whole point. A verdict
// flipping from PASS to FAIL (or vice versa) between the golden's own
// recording and a later replay — with 0% pixel diff — would be a real
// contradiction worth investigating by hand; this runner does not
// currently diff verdict-by-verdict against the golden's own recorded
// verdicts (see docs/golden-replay-2026-09-17.md's limits section), only
// against the pixel baseline, which is the load-bearing signal.
//
// Not wired into CI — needs the iOS Simulator + a real device to compare
// against. Run manually as a pre-build step (see the release checklist
// doc) before shipping a build with tile/sizing-surface changes.
//
// Usage:
//   npm run sim:replay
//   npm run sim:replay -- --speed 1              # real-time pacing instead of the default 0 (as-fast-as-possible)
//   npm run sim:replay -- --dev-server-port 5433  # see sim-capture.mjs's SIM_DEV_PORT doc comment
//   npm run sim:replay -- --golden tests/visual/golden/normal-build-100.replay.json  # just one

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
export const GOLDEN_DIR = "tests/visual/golden";

function arg(argv, name, def) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
}

/** Every `<name>.replay.json` under `GOLDEN_DIR`, sorted for a stable
 *  table order. Pure given an injected `readdir` (tested without touching
 *  the real filesystem); the CLI entrypoint uses real `fs.readdirSync`. */
export function listGoldenFiles(dirEntries) {
  return dirEntries
    .filter((f) => f.endsWith(".replay.json"))
    .sort()
    .map((f) => f.replace(/\.replay\.json$/, ""));
}

/**
 * Parses ONE `sim-capture.mjs --replay` run's combined stdout+stderr into
 * the row this runner's table needs. Pure — takes the raw text, never
 * spawns anything. Handles three shapes:
 *   - a hard tap-execution FAIL ("FAIL: replay tap N/M — label ... not
 *     found on screen")
 *   - a normal run: per-verdict "  <name>: PASS|FAIL|N/A (...)" lines,
 *     "replay: ... — N tap(s) replayed" line for the tap count, and a
 *     "pixelDiff=X% threshold=Y% PASS|FAIL" line
 *   - a run that failed validation or crashed before either (no verdicts,
 *     no pixelDiff line) — reported as FAIL with a generic reason
 */
export function parseReplayOutput(output) {
  const text = String(output ?? "");
  const hardFailMatch = /FAIL: replay tap (\d+)\/(\S+) — label (.+?) not found on screen/.exec(text);
  if (hardFailMatch) {
    return {
      ok: false,
      taps: null,
      verdicts: { pass: 0, fail: 0, na: 0 },
      pixelDiffPct: null,
      reason: `tap ${hardFailMatch[1]}/${hardFailMatch[2]} — label ${hardFailMatch[3]} not found on screen`,
    };
  }
  const tapsMatch = /— (\d+) tap\(s\) replayed/.exec(text);
  const taps = tapsMatch ? Number(tapsMatch[1]) : null;
  const verdictLines = [...text.matchAll(/^ {2}(\w+): (PASS|FAIL|N\/A)\b/gm)];
  const verdicts = { pass: 0, fail: 0, na: 0 };
  for (const [, , v] of verdictLines) {
    if (v === "PASS") verdicts.pass++;
    else if (v === "FAIL") verdicts.fail++;
    else verdicts.na++;
  }
  const pixelMatch = /pixelDiff=([\d.]+)% threshold=([\d.]+)% (PASS|FAIL)/.exec(text);
  const pixelDiffPct = pixelMatch ? Number(pixelMatch[1]) : null;
  const pixelOk = pixelMatch ? pixelMatch[3] === "PASS" : null;
  if (pixelMatch) {
    return { ok: pixelOk === true, taps, verdicts, pixelDiffPct, reason: pixelOk ? null : "pixel baseline diff" };
  }
  // No hard fail, no pixel line — something else went wrong (validation
  // failure, no baseline yet, crash). Not a silent pass.
  const noBaseline = /FAIL: no baseline at/.test(text);
  return {
    ok: false,
    taps,
    verdicts,
    pixelDiffPct: null,
    reason: noBaseline ? "no baseline PNG — run --update-baseline / --record-golden first" : "no pixelDiff line — run did not complete normally (see full log)",
  };
}

/** One table row, plain text, column-aligned. Pure. */
export function formatRow({ name, taps, verdicts, pixelDiffPct, ok }) {
  const tapsStr = taps === null ? "-" : String(taps);
  const verdictsStr = `${verdicts.pass}P/${verdicts.fail}F/${verdicts.na}N`;
  const pixelStr = pixelDiffPct === null ? "-" : `${pixelDiffPct.toFixed(4)}%`;
  return [
    name.padEnd(24),
    tapsStr.padStart(4),
    verdictsStr.padStart(10),
    pixelStr.padStart(10),
    ok ? "PASS" : "FAIL",
  ].join("  ");
}

export function formatTable(rows) {
  const header = ["name".padEnd(24), "taps".padStart(4), "verdicts".padStart(10), "pixelDiff".padStart(10), "result"].join("  ");
  return [header, ...rows.map(formatRow)].join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const speed = arg(argv, "speed", "0");
  const devServerPort = arg(argv, "dev-server-port", process.env.SIM_DEV_PORT ?? null);
  const singleGolden = arg(argv, "golden", null);

  const names = singleGolden
    ? [path.basename(String(singleGolden)).replace(/\.replay\.json$/, "")]
    : listGoldenFiles(fs.existsSync(path.join(REPO_ROOT, GOLDEN_DIR)) ? fs.readdirSync(path.join(REPO_ROOT, GOLDEN_DIR)) : []);

  if (names.length === 0) {
    console.error(`no golden files found under ${GOLDEN_DIR}/*.replay.json`);
    process.exit(1);
  }

  const rows = [];
  for (const name of names) {
    const file = path.join(GOLDEN_DIR, `${name}.replay.json`);
    console.log(`\n=== ${name} (${file}) ===`);
    const env = { ...process.env };
    if (devServerPort) env.SIM_DEV_PORT = String(devServerPort);
    let output = "";
    try {
      output = execFileSync("node", ["scripts/ux-loop/sim-capture.mjs", "--replay", file, "--speed", String(speed)], {
        cwd: REPO_ROOT,
        env,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err) {
      // sim-capture.mjs exits non-zero on any FAIL — that's expected input
      // here, not a runner crash. stdout/stderr still carry the parseable
      // lines.
      output = `${err.stdout ?? ""}\n${err.stderr ?? ""}`;
    }
    console.log(output.split("\n").slice(-15).join("\n"));
    const parsed = parseReplayOutput(output);
    rows.push({ name, ...parsed });
  }

  console.log("\n" + formatTable(rows));

  const anyFail = rows.some((r) => !r.ok);
  if (anyFail) {
    console.error("\nFAIL — see the row(s) above marked FAIL:");
    for (const r of rows.filter((r) => !r.ok)) {
      console.error(`  ${r.name}: ${r.reason ?? "unknown"}`);
    }
    process.exit(1);
  }
  console.log("\nPASS — all goldens replayed clean.");
}

const isMain = import.meta.url === `file://${process.argv[1]}` || import.meta.url === `file://${path.resolve(process.argv[1] ?? "")}`;
if (isMain) {
  main().catch((err) => {
    console.error(err?.stack || err);
    process.exit(1);
  });
}
