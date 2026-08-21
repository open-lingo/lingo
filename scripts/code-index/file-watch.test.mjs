// Tests for the god-file / orphan watch — the pure core.
//
// scanFiles(files, {locFloor, baseline}) where each file is
//   { path, loc, importedBy }   (importedBy = # of OTHER repo files importing it)
// returns:
//   offenders  files over the LOC floor, sorted by loc desc
//   grew       offenders whose loc rose vs a committed baseline {path: loc}
//   orphans    files imported by nothing (importedBy === 0), any size
//
// Deterministic ground truth — the caller supplies loc + import counts; this just
// ranks and diffs. Report-only; never deletes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { scanFiles } from "./file-watch.mjs";

const FILES = [
  { path: "src/a.tsx", loc: 500, importedBy: 3 },
  { path: "src/b.ts", loc: 420, importedBy: 1 },
  { path: "src/small.ts", loc: 100, importedBy: 2 },
  { path: "src/features/languages/ja/curriculum/_archive/m17.ts", loc: 3006, importedBy: 0 },
  { path: "src/orphanSmall.ts", loc: 50, importedBy: 0 },
];
const BASELINE = { "src/a.tsx": 450, "src/b.ts": 420 };

test("offenders are files over the floor, sorted by loc desc", () => {
  const r = scanFiles(FILES, { locFloor: 400, baseline: BASELINE });
  assert.deepEqual(r.offenders.map((f) => f.path), [
    "src/features/languages/ja/curriculum/_archive/m17.ts",
    "src/a.tsx",
    "src/b.ts",
  ]);
});

test("files at or under the floor are not offenders", () => {
  const r = scanFiles(FILES, { locFloor: 400, baseline: BASELINE });
  assert.ok(!r.offenders.some((f) => f.path === "src/small.ts"));
  assert.ok(!r.offenders.some((f) => f.path === "src/orphanSmall.ts"));
});

test("grew = offenders whose loc rose vs baseline (equal does not count)", () => {
  const r = scanFiles(FILES, { locFloor: 400, baseline: BASELINE });
  assert.deepEqual(r.grew.map((f) => f.path), ["src/a.tsx"]); // 500 > 450; b 420==420 excluded
});

test("a new offender with no baseline entry is not 'grew'", () => {
  const r = scanFiles(FILES, { locFloor: 400, baseline: BASELINE });
  assert.ok(!r.grew.some((f) => f.path.includes("_archive/m17"))); // no baseline → not grew
});

test("orphans are files imported by nothing, regardless of size", () => {
  const r = scanFiles(FILES, { locFloor: 400, baseline: BASELINE });
  const orphanPaths = r.orphans.map((f) => f.path).sort();
  assert.deepEqual(orphanPaths, [
    "src/features/languages/ja/curriculum/_archive/m17.ts",
    "src/orphanSmall.ts",
  ]);
});

test("empty baseline: nothing counts as grew, offenders still computed", () => {
  const r = scanFiles(FILES, { locFloor: 400, baseline: {} });
  assert.equal(r.grew.length, 0);
  assert.equal(r.offenders.length, 3);
});
