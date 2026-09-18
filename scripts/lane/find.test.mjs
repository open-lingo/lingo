// find.test.mjs — exercises lib/grep-fallback.mjs (find.mjs's Node grep,
// used when no standalone `rg` binary is on PATH — true in this sandbox,
// see the comment at the top of grep-fallback.mjs) against a fixture tree.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildMatcher, grepFallback } from "./lib/grep-fallback.mjs";

const FIXTURE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "__fixtures__/grep-tree");

test("buildMatcher treats an identifier-like term as a literal match", () => {
  const re = buildMatcher("padBuildTileFloor");
  assert.equal(re.test("call padBuildTileFloor(x)"), true);
  assert.equal(re.test("call padBuildTileFloorOther(x)"), true); // substring, by design
  assert.equal(re.test("unrelated text"), false);
});

test("buildMatcher OR's significant words for a natural-language query and drops stopwords", () => {
  const re = buildMatcher("how does boot batching work");
  assert.equal(re.test("this is about boot sequencing"), true);
  assert.equal(re.test("batching happens here"), true);
  assert.equal(re.test("nothing relevant"), false);
});

test("grepFallback finds every matching line across a directory, capped per file", () => {
  const hits = grepFallback("padBuildTileFloor", [FIXTURE]);
  assert.equal(hits.length, 2);
  assert.ok(hits[0].endsWith("foo.ts:1:export function padBuildTileFloor(lesson) {"));
  assert.ok(hits.every((h) => h.includes("foo.ts")));
});

test("grepFallback is case-insensitive and returns [] for no match", () => {
  assert.equal(grepFallback("PADBUILDTILEFLOOR", [FIXTURE]).length, 2);
  assert.deepEqual(grepFallback("nothing matches this string", [FIXTURE]), []);
});

test("grepFallback accepts a single file as a root", () => {
  const hits = grepFallback("unrelated", [path.join(FIXTURE, "src/bar.ts")]);
  assert.equal(hits.length, 1);
});
