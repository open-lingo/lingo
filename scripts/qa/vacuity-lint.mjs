#!/usr/bin/env node
// vacuity-lint — project review 2026-09-17 §3 "sweep for checks that
// cannot fail" (lane A5c). Memory rule: "prove the verifier can fail" —
// green and vacuous look identical. P1b found two simulator verdicts
// (h2Stable/noFlicker) that had passed for weeks on listening routes
// because their sample was empty; this lane's own sweep found the same
// class live in trayBankFontEqual/stageFits (sim-capture.mjs) and in
// roughly a dozen gate `it()` blocks across the curriculum test suite
// (see docs/gate-vacuity-2026-09-17.md for the full table). This script is
// the guard that keeps the class from quietly coming back.
//
// WHAT IT DOES: scans a fixed, hand-maintained list of gate test files
// (GATE_FILES below) for `describe.each(`, `it.each(`, or a
// `for (const x of y)` loop — the three shapes a "collector" iterates over
// in this codebase — and fails, printing file:line, any file where NONE of
// those constructs sits anywhere near a recognized "this collection is
// non-empty" floor (`toBeGreaterThan(`, `toBeGreaterThanOrEqual(`) in the
// same file.
//
// WHAT THIS CAN DETECT: a NEW gate file (or a new `it()` added to an
// existing one) that iterates a collection with NO floor assertion
// anywhere in the file — the exact shape this lane found and fixed in
// ~12 files on 2026-09-17.
//
// WHAT THIS CANNOT DETECT — read this before trusting a clean run blindly,
// same rule as every check in this repo (regression-classes C4):
//   - whether a floor assertion elsewhere in the file actually GUARDS the
//     specific loop flagged. This is a whole-file presence check, not a
//     scope-aware one — a file with one honest floor and nine vacuous
//     loops reads as clean. The human sweep that produced
//     docs/gate-vacuity-2026-09-17.md is still the ground truth; this
//     script only keeps a FIXED file from regressing and catches a wholly
//     unguarded NEW file.
//   - a collector that is a hardcoded literal (`it.each(["a", "b"])`,
//     `for (const p of ["は","が","を"])`) never needs a floor — literals
//     can't silently empty out from a data change. This tool does not
//     distinguish a literal from a derived collection and will flag
//     literals too.
//   - a `for (const [a, b] of Object.entries(x))` used for a fixed-shape
//     destructure rather than a real "walk everything" scan.
// Both false-positive classes are silenced with a `// vacuity: <reason>`
// comment on the flagged line or the line immediately above it — read the
// reason before adding one; it is a claim, not a formality.
//
// This does NOT run in `npm run preflight` (that gate is already ~5 min
// under load) or as part of the main test suite — it is its own
// `npm run test:gates-nonempty` script, and a `ci.yml` step after unit
// tests, because it is a lint over test SOURCE, not a test itself.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

// The audited gate-file set (2026-09-17 vacuity sweep, project review §1
// "Gates" + the src/test/*.test.ts gates). Add a new gate test file here
// when it's written — this list is hand-maintained, not auto-discovered;
// see docs/gate-vacuity-2026-09-17.md for the inventory it mirrors.
export const GATE_FILES = [
  "src/features/lesson/data/moduleCompiler.diagnostics.test.ts",
  "src/features/languages/ja/__tests__/irDiagnostics.test.ts",
  "src/features/languages/es/__tests__/moduleConformance.test.ts",
  "src/features/languages/ja/__tests__/moduleConformance.test.ts",
  "src/features/languages/ko/__tests__/moduleConformance.test.ts",
  "src/shared/language/__tests__/moduleConformance.test.ts",
  "src/features/lesson/data/kanaWordIntroOrder.test.ts",
  "src/features/lesson/data/sceneVocabGate.test.ts",
  "src/features/practice/content/gate.test.ts",
  "src/features/lesson/data/grammarReviewPools.test.ts",
  "src/features/lesson/data/particleClozePlacement.test.ts",
  "src/features/lesson/data/particleTileSeparation.test.ts",
  "src/features/lesson/data/destinationParticle.test.ts",
  "src/features/languages/ja/__tests__/particleCueAnswerability.test.ts",
  "src/features/languages/ko/__tests__/particleCueAnswerability.test.ts",
  "src/shared/tts/manifestCoverage.test.ts",
  "src/features/languages/fr/curriculum/fr-quality.test.ts",
  "src/features/languages/fr/curriculum/frDistractorProvenance.test.ts",
  "src/features/languages/es/curriculum/atoms.generated.test.ts",
  "src/features/languages/fr/curriculum/atoms.generated.test.ts",
  "src/features/languages/es/curriculum/structure.test.ts",
  "src/features/languages/fr/curriculum/structure.test.ts",
  "src/test/esCompiledStaleness.test.ts",
  "src/test/ttsCoverageParity.test.ts",
  // src/test/proceduralQa.test.ts is deliberately NOT in this list: it is
  // lane A7c's file (off-limits to this lane — see the A5c brief's "DO NOT
  // TOUCH"), already converted to a per-question ratchet against a
  // committed baseline with its own proven planted-failure test (2026-09-17
  // ledger: "set Q7's baseline to 0, watched it go red naming the exact
  // finding, restored"). Its `for`/`.each` shapes are deliberate
  // (per-question tallies, an always-passing report-only test with its own
  // `// vacuity:` comment) and this tool's whole-file floor-presence
  // heuristic is too coarse to represent that faithfully — a false
  // positive here would misrepresent a file this lane didn't audit.
];

const COLLECTOR_RE = /(describe\.each\(|it\.each\(|for\s*\(\s*const\b[^)]*\bof\b)/;
const FLOOR_RE = /(toBeGreaterThan\(|toBeGreaterThanOrEqual\()/;
const SUPPRESS_RE = /\/\/\s*vacuity:/i;

/** Pure-ish core: reads each `files[i]` (relative to `root`) and returns
 *  `{ failures, missing }`. Exported so the test file can point it at a
 *  synthetic fixture directory instead of the real repo. */
export function lint(root = ROOT, files = GATE_FILES) {
  const failures = [];
  const missing = [];

  for (const rel of files) {
    const path = join(root, rel);
    let text;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      missing.push(rel);
      continue;
    }
    const lines = text.split("\n");
    const hasFloorAnywhere = FLOOR_RE.test(text);

    lines.forEach((line, i) => {
      if (!COLLECTOR_RE.test(line)) return;
      if (SUPPRESS_RE.test(line)) return; // silenced on this exact line
      // Silenced by a `// vacuity: <reason>` comment block directly above —
      // walk upward through the contiguous run of `//`-comment lines
      // immediately preceding the flagged line (a multi-line explanation is
      // common; the marker need not be the single line right above).
      let j = i - 1;
      let suppressed = false;
      while (j >= 0 && /^\s*\/\//.test(lines[j])) {
        if (SUPPRESS_RE.test(lines[j])) {
          suppressed = true;
          break;
        }
        j--;
      }
      if (suppressed) return;
      if (hasFloorAnywhere) return; // whole-file presence check — see header caveats
      failures.push({ rel, lineNo: i + 1, line: line.trim() });
    });
  }

  return { failures, missing };
}

function main() {
  const { failures, missing } = lint();

  if (missing.length > 0) {
    console.warn(
      `vacuity-lint: ${missing.length} file(s) in GATE_FILES no longer exist (renamed/removed?) — update the list in scripts/qa/vacuity-lint.mjs:\n` +
        missing.map((m) => `  ${m}`).join("\n"),
    );
  }

  if (failures.length > 0) {
    console.error(
      "vacuity-lint: found a describe.each/it.each/for-of over a collector with no " +
        "non-empty floor (toBeGreaterThan/toBeGreaterThanOrEqual) anywhere in the file:\n",
    );
    for (const f of failures) console.error(`  ${f.rel}:${f.lineNo}: ${f.line}`);
    console.error(
      `\n${failures.length} finding(s). Add "expect(x.length).toBeGreaterThan(0)" (or a ` +
        `pinned toBeGreaterThanOrEqual) guarding the collection this loop walks, or — only ` +
        `if this is a genuine false positive (a hardcoded literal, a fixed-shape destructure) ` +
        `— silence it with "// vacuity: <reason>" on or directly above the flagged line.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `vacuity-lint: ${GATE_FILES.length - missing.length} gate file(s) checked, ` +
      `all have a non-empty floor somewhere in the file.`,
  );
}

main();
