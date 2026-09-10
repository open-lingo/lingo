import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Integration-style tests (node:test, run directly: `node
// scripts/i18n/extract-content-catalog.test.mjs`). The extractor's whole
// point is walking the REAL compiled course content through the same Vite
// SSR boot the app itself uses (mirrors scripts/restamp-from-module.mjs) —
// there is no meaningful pure-function unit to isolate that wouldn't just
// re-mock away the thing being tested (whether the real m6 catalog is
// well-formed). So these spawn the actual CLI against a scratch --out dir
// and assert on its JSON output, per the rung-1a acceptance criteria: the
// m6 catalog is non-empty, anchors are unique, and re-running is
// deterministic.

const SCRIPT = fileURLToPath(new URL("./extract-content-catalog.mjs", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

function run(args, outDir) {
  const result = spawnSync(
    process.execPath,
    [SCRIPT, ...args, "--out", outDir],
    { cwd: REPO_ROOT, encoding: "utf-8", timeout: 60_000 },
  );
  if (result.status !== 0) {
    throw new Error(
      `extract-content-catalog.mjs ${args.join(" ")} exited ${result.status}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
    );
  }
  return result;
}

test("m6 catalog: non-empty, anchors unique, deterministic across two runs", (t) => {
  const outDir = mkdtempSync(join(tmpdir(), "extract-content-catalog-"));
  t.after(() => rmSync(outDir, { recursive: true, force: true }));

  run(["ja", "m6"], outDir);
  const catalogPath = join(outDir, "ja", "m6.en.json");
  const first = JSON.parse(readFileSync(catalogPath, "utf-8"));

  assert.ok(first.entries.length > 0, "m6 catalog should be non-empty");
  assert.equal(first.entryCount, first.entries.length);

  const anchors = first.entries.map((e) => e.anchor);
  assert.equal(
    new Set(anchors).size,
    anchors.length,
    "every anchor in the m6 catalog must be unique",
  );

  // Every entry needs a non-empty en string and a matching hash (schema
  // sanity — catches a broken hash function or an empty extracted string
  // slipping through the isGlossText guard).
  for (const e of first.entries) {
    assert.ok(e.en.trim().length > 0, `entry ${e.anchor} has empty en text`);
    assert.match(e.enSourceHash, /^[0-9a-f]{16}$/, `entry ${e.anchor} has a malformed hash`);
  }

  run(["ja", "m6"], outDir);
  const second = JSON.parse(readFileSync(catalogPath, "utf-8"));

  const stripVolatile = (catalog) => {
    const { generatedAt, ...rest } = catalog;
    return rest;
  };
  assert.deepEqual(
    stripVolatile(first),
    stripVolatile(second),
    "re-running the extractor on the same module must produce an identical catalog (minus generatedAt)",
  );
});

test("--check mode reports fresh/stale/missing against a synthetic ko catalog, without touching the en catalog", (t) => {
  const outDir = mkdtempSync(join(tmpdir(), "extract-content-catalog-check-"));
  t.after(() => rmSync(outDir, { recursive: true, force: true }));

  run(["ja", "m6"], outDir);
  const enPath = join(outDir, "ja", "m6.en.json");
  const en = JSON.parse(readFileSync(enPath, "utf-8"));
  const beforeCheck = readFileSync(enPath, "utf-8");

  const half = Math.floor(en.entries.length / 2);
  const koEntries = en.entries.slice(0, half).map((e) => ({
    anchor: e.anchor,
    ko: "STUB",
    enSourceHash: e.enSourceHash,
  }));
  const koPath = join(outDir, "ja", "m6.ko.json");
  writeFileSync(koPath, JSON.stringify({ moduleId: "m6", lang: "ja", entries: koEntries }));

  const result = run(["ja", "m6", "--check"], outDir);
  assert.match(result.stdout, /fresh \(ko matches current en\):\s+\d+/);
  assert.match(result.stdout, /missing \(no ko entry yet\):\s+\d+/);

  const afterCheck = readFileSync(enPath, "utf-8");
  assert.equal(beforeCheck, afterCheck, "--check must not rewrite the en catalog");
});
