// Dry-run tests for replay-runner.mjs's pure functions (golden-learner
// replay, 2026-09-17, lane A2d). Node's built-in test runner, same pattern
// as sim-capture.test.mjs — no simctl/network, just string/array parsing.
//
//   node --test scripts/ux-loop/replay-runner.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  listGoldenFiles,
  parseReplayOutput,
  formatRow,
  formatTable,
} from "./replay-runner.mjs";

test("listGoldenFiles: picks only *.replay.json, strips the suffix, sorted", () => {
  const names = listGoldenFiles([
    "normal-build-100.replay.json",
    "normal-build-100.png",
    "huge-bank-125.replay.json",
    "huge-bank-125.png",
    ".DS_Store",
    "listening-build-100.replay.json",
  ]);
  assert.deepEqual(names, ["huge-bank-125", "listening-build-100", "normal-build-100"]);
});

test("listGoldenFiles: empty directory yields an empty list, not a throw", () => {
  assert.deepEqual(listGoldenFiles([]), []);
});

const NORMAL_PASS_OUTPUT = `
--replay tests/visual/golden/normal-build-100.replay.json: 6 tap(s), route=/ja/learn/lessons/ja-m34-neo-7?step=5 viewport=430x932 fontScale=100
replay: tests/visual/golden/normal-build-100.replay.json — 6 tap(s) replayed, speed=0
  tap#   tMs  source  pos  label
     1   332    bank    0  なった

  fitScaleStable: PASS
  trayBankFontEqual: PASS
  rowHStable: PASS
  h2Stable: PASS
  promptStable: PASS
  chromeStable: PASS
  noFlicker: PASS (maxH2Jump=0 h2Reversals=0)
  stageFits: PASS
  bankVisible: PASS

wrote artifacts/ux-loop/sim-capture/capture-x.json
wrote artifacts/ux-loop/sim-capture/capture-x.png
pixelDiff=0.0000% threshold=0.1% PASS
PASS
`;

test("parseReplayOutput: a clean PASS run — taps, verdict counts, pixelDiff, ok", () => {
  const r = parseReplayOutput(NORMAL_PASS_OUTPUT);
  assert.equal(r.ok, true);
  assert.equal(r.taps, 6);
  assert.deepEqual(r.verdicts, { pass: 9, fail: 0, na: 0 });
  assert.equal(r.pixelDiffPct, 0);
  assert.equal(r.reason, null);
});

const KNOWN_FAIL_VERDICT_OUTPUT = NORMAL_PASS_OUTPUT
  .replace("21 tap(s) replayed", "21 tap(s) replayed") // no-op, kept for symmetry with a huge-bank golden
  .replace("stageFits: PASS", "stageFits: FAIL (taps 0,1,2)")
  .replace("6 tap(s) replayed", "21 tap(s) replayed")
  .replace("pixelDiff=0.0000%", "pixelDiff=0.0000%");

test("parseReplayOutput: a KNOWN pre-existing verdict FAIL still reads as ok=true when pixelDiff is clean (reproducing the same known state is not a regression)", () => {
  const r = parseReplayOutput(KNOWN_FAIL_VERDICT_OUTPUT);
  assert.equal(r.ok, true, "pixelDiff PASS is what makes this a PASS row, not the individual verdicts");
  assert.equal(r.verdicts.fail, 1);
  assert.equal(r.pixelDiffPct, 0);
});

const PIXEL_FAIL_OUTPUT = NORMAL_PASS_OUTPUT
  .replace("pixelDiff=0.0000% threshold=0.1% PASS", "pixelDiff=2.1400% threshold=0.1% FAIL")
  .replace(/\nPASS\n$/, "\nFAIL: pixel baseline diff — see artifacts/ux-loop/sim-capture/capture-x.diff.png\n");

test("parseReplayOutput: a real pixel regression reads as ok=false with the diff percentage", () => {
  const r = parseReplayOutput(PIXEL_FAIL_OUTPUT);
  assert.equal(r.ok, false);
  assert.equal(r.pixelDiffPct, 2.14);
  assert.match(r.reason, /pixel baseline diff/);
});

const HARD_FAIL_OUTPUT = `
--replay tests/visual/golden/listening-build-100.replay.json: 6 tap(s), route=/ja/learn/lessons/ja-m34-neo-5?step=12 viewport=430x932 fontScale=100
build-sim: captured 1 tap(s) of 1 reported (single-shot)
waiting 24996ms more for the probe ticks…

FAIL: replay tap 2/6 — label "いえ" not found on screen
FAIL:   visible labels: ["家いえ","出でよう","思おもう","と","池いけ","うち","を","川かわ"]
wrote artifacts/ux-loop/sim-capture/capture-x.json
`;

test("parseReplayOutput: a HARD FAIL (label not found) — no verdicts, no pixelDiff, ok=false with the tap index and label", () => {
  const r = parseReplayOutput(HARD_FAIL_OUTPUT);
  assert.equal(r.ok, false);
  assert.equal(r.taps, null);
  assert.deepEqual(r.verdicts, { pass: 0, fail: 0, na: 0 });
  assert.equal(r.pixelDiffPct, null);
  assert.match(r.reason, /tap 2\/6/);
  assert.match(r.reason, /いえ/);
});

test("parseReplayOutput: a run that never reached a pixelDiff line (crash/validation failure) is FAIL, not a silent pass", () => {
  const r = parseReplayOutput("some unrelated log output\nFAIL: capture never validated after 3 attempt(s):\n");
  assert.equal(r.ok, false);
  assert.equal(r.pixelDiffPct, null);
  assert.match(r.reason, /did not complete normally/);
});

test("parseReplayOutput: missing baseline PNG is FAIL with a specific reason, not a crash", () => {
  const r = parseReplayOutput('FAIL: no baseline at tests/visual/golden/foo.png — run with --update-baseline to create one\n');
  assert.equal(r.ok, false);
  assert.match(r.reason, /no baseline PNG/);
});

test("formatRow / formatTable: columns present and aligned, PASS/FAIL literal in the last column", () => {
  const rows = [
    { name: "normal-build-100", taps: 6, verdicts: { pass: 9, fail: 0, na: 0 }, pixelDiffPct: 0, ok: true },
    { name: "huge-bank-125", taps: 21, verdicts: { pass: 8, fail: 1, na: 0 }, pixelDiffPct: 0, ok: true },
    { name: "listening-build-100", taps: null, verdicts: { pass: 0, fail: 0, na: 0 }, pixelDiffPct: null, ok: false },
  ];
  const table = formatTable(rows);
  const lines = table.split("\n");
  assert.equal(lines.length, 4); // header + 3 rows
  assert.match(lines[0], /name/);
  assert.match(lines[0], /taps/);
  assert.match(lines[0], /verdicts/);
  assert.match(lines[0], /pixelDiff/);
  assert.match(lines[1], /PASS$/);
  assert.match(lines[3], /FAIL$/);
  // taps/pixelDiff render as "-" when null (verdicts sits between them, so
  // not adjacent — check each column independently).
  const cols = lines[3].trim().split(/\s{2,}/);
  assert.equal(cols[1], "-"); // taps
  assert.equal(cols[3], "-"); // pixelDiff
});
