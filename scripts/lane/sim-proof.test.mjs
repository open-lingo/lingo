// sim-proof.test.mjs — exercises the pure formatter in
// lib/sim-proof-table.mjs (no simulator, no filesystem, no subprocess).
import { test } from "node:test";
import assert from "node:assert/strict";
import { countVerdicts, bankVisiblePx, lastFitScale, buildRow, formatTable } from "./lib/sim-proof-table.mjs";

test("countVerdicts excludes na entries from total and failed", () => {
  const { total, failed } = countVerdicts({
    fitScaleStable: { ok: true },
    stageFits: { ok: false },
    h2Stable: { ok: true, na: true }, // unsampled — must not count either way
  });
  assert.equal(total, 2);
  assert.deepEqual(failed, ["stageFits"]);
});

test("bankVisiblePx reads the leading px number, 0 when all-clear", () => {
  assert.equal(bankVisiblePx("137px of the bank hidden behind the sticky CTA at rest (taps 5,6)"), 137);
  assert.equal(bankVisiblePx("bank fully visible above the sticky CTA at every sampled tap"), 0);
  assert.equal(bankVisiblePx(undefined), 0);
});

test("lastFitScale returns the last sample carrying a number, null if none do", () => {
  assert.equal(lastFitScale([{ fitScale: 1 }, { fitScale: 0.85 }, { tap: 3 }]), 0.85);
  assert.equal(lastFitScale([{ tap: 0 }]), null);
  assert.equal(lastFitScale([]), null);
});

test("buildRow on a FAILing build-simulation capture names the failed verdicts", () => {
  const capture = {
    report: {
      simulation: {
        mode: "build",
        samples: [{ fitScale: 1 }, { fitScale: 0.79 }],
        verdicts: {
          fitScaleStable: { ok: false },
          stageFits: { ok: true },
          bankVisible: { ok: true, detail: "212px of the bank hidden behind the sticky CTA at rest (taps 9)" },
        },
      },
    },
  };
  const row = buildRow({ scale: 125, capture, passed: false, screenshotPath: "shot.png" });
  assert.equal(row.scale, "125%");
  assert.equal(row.verdictStr, "FAIL (1/3 failed: fitScaleStable)");
  assert.equal(row.fitScale, "0.790");
  assert.equal(row.overflowPx, "212");
});

test("buildRow on a clean non-build capture falls back to stageOverReportPx, no fit-scale", () => {
  const capture = { report: { stageOverReportPx: -4 } };
  const row = buildRow({ scale: 100, capture, passed: true, screenshotPath: "shot.png" });
  assert.equal(row.verdictStr, "PASS");
  assert.equal(row.fitScale, "-");
  assert.equal(row.overflowPx, "-4");
});

test("buildRow on a crashed run (no capture JSON) still produces a row", () => {
  const row = buildRow({ scale: 100, capture: null, passed: false, screenshotPath: null });
  assert.equal(row.verdictStr, "FAIL");
  assert.equal(row.screenshotPath, "(none)");
});

test("formatTable aligns columns and includes the header", () => {
  const rows = [buildRow({ scale: 100, capture: null, passed: true, screenshotPath: "a.png" })];
  const table = formatTable(rows);
  const lines = table.split("\n");
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^scale\s+verdicts\s+screenshot\s+fit-scale\s+overflow px$/);
});
