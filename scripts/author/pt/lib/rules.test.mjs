import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PT_CONTRACTIONS, mapPartOfSpeech } from "./rules.mjs";

const here = dirname(fileURLToPath(import.meta.url));

test("PT_CONTRACTIONS mirrors assemble.mjs's own list byte-for-byte", () => {
  // assemble.mjs doesn't export its private PT_CONTRACTIONS (editing the
  // compiler is off-limits for this lane) — re-read its source text and
  // pull the literal list out, so drift between the two fails loudly here
  // instead of silently letting the generator and the real compile-time
  // ban disagree about what a "contraction" is.
  const src = readFileSync(join(here, "../../../draft/pt-ir/assemble.mjs"), "utf8");
  const m = src.match(/const PT_CONTRACTIONS = new Set\(\s*\[([\s\S]*?)\]\.map/);
  assert.ok(m, "could not find PT_CONTRACTIONS literal in assemble.mjs — has its shape changed?");
  const real = new Set(
    [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1].toLowerCase()),
  );
  assert.deepEqual([...PT_CONTRACTIONS].sort(), [...real].sort());
});

test("mapPartOfSpeech: passes through a valid Atom.partOfSpeech value", () => {
  assert.equal(mapPartOfSpeech("noun"), "noun");
  assert.equal(mapPartOfSpeech("particle"), "particle");
});

test("mapPartOfSpeech: folds verb-form onto verb", () => {
  assert.equal(mapPartOfSpeech("verb-form"), "verb");
});

test("mapPartOfSpeech: unknown pos falls back to other", () => {
  assert.equal(mapPartOfSpeech("nonsense"), "other");
});
