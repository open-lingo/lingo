import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

import { buildDictManifest } from "./generate-dict-manifest.mjs";

function scratchDictDir(t, files) {
  const dir = mkdtempSync(join(tmpdir(), "dict-manifest-fixture-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(join(dir, name), contents);
  }
  return dir;
}

test("hashes every .dat.gz file and records its byte length", (t) => {
  const dir = scratchDictDir(t, {
    "base.dat.gz": "aaa",
    "check.dat.gz": "bbbb",
    "README.md": "not a dict file — must be excluded",
  });
  const manifest = buildDictManifest(dir);

  assert.equal(Object.keys(manifest.files).length, 2);
  assert.equal(manifest.files["base.dat.gz"].bytes, 3);
  assert.equal(manifest.files["check.dat.gz"].bytes, 4);
  assert.equal("README.md" in manifest.files, false);

  const expectedHash = createHash("sha256").update("aaa").digest("hex");
  assert.equal(manifest.files["base.dat.gz"].sha256, expectedHash);
});

test("throws a clear error when the source directory does not exist", () => {
  assert.throws(
    () => buildDictManifest("/nonexistent/path/does/not/exist"),
    /does not exist/,
  );
});

test("committed src/shared/dict/manifest.json matches the installed kuromoji package RIGHT NOW (regenerate via `node scripts/build/generate-dict-manifest.mjs` if this fails after a kuromoji version bump)", () => {
  const repoRoot = join(import.meta.dirname, "..", "..");
  const kuromojiDictDir = join(repoRoot, "node_modules/kuromoji/dict");
  const fresh = buildDictManifest(kuromojiDictDir);

  const committedRaw = readFileSync(
    join(repoRoot, "src/shared/dict/manifest.json"),
    "utf8",
  );
  const committed = JSON.parse(committedRaw);

  assert.deepEqual(committed, fresh);
});
