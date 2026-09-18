import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readContentPacksFlag } from "./readContentPacksFlag.mjs";

/** Scratch dir shaped like a repo root: `<root>/src/pub/feature-flags.json`. */
function makeRepoRoot(t, flagsJson) {
  const root = mkdtempSync(join(tmpdir(), "read-content-packs-flag-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const pubDir = join(root, "src", "pub");
  mkdirSync(pubDir, { recursive: true });
  if (flagsJson !== undefined) {
    writeFileSync(join(pubDir, "feature-flags.json"), flagsJson);
  }
  return root;
}

test("content.packs: true → returns true", (t) => {
  const root = makeRepoRoot(t, JSON.stringify({ content: { packs: true } }));
  assert.equal(readContentPacksFlag(root), true);
});

test("content.packs: false → returns false", (t) => {
  const root = makeRepoRoot(t, JSON.stringify({ content: { packs: false } }));
  assert.equal(readContentPacksFlag(root), false);
});

test("no content key at all → defaults to false", (t) => {
  const root = makeRepoRoot(t, JSON.stringify({ learn: { transitMapHome: true } }));
  assert.equal(readContentPacksFlag(root), false);
});

test("missing feature-flags.json entirely → defaults to false, does not throw", (t) => {
  const root = makeRepoRoot(t, undefined);
  assert.equal(readContentPacksFlag(root), false);
});

test("malformed JSON → defaults to false, does not throw", (t) => {
  const root = makeRepoRoot(t, "{ not valid json");
  assert.equal(readContentPacksFlag(root), false);
});

test("real repo feature-flags.json resolves without a root argument (default = repo root two levels up from scripts/build/)", () => {
  // This lane's own src/pub/feature-flags.json ships content.packs: false.
  assert.equal(readContentPacksFlag(), false);
});
