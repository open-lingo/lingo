// step-url.test.mjs — exercises lib/content-search.mjs (shared by find.mjs
// --lang and step-url.mjs) against a small fixture content/v1 tree, no
// network and no real course content required.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.LANE_CONTENT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "__fixtures__/content-v1",
);
const { contentAvailable, findInContent, stepsOfLesson } = await import("./lib/content-search.mjs");

test("contentAvailable is true when the fixture manifest exists", () => {
  assert.equal(contentAvailable(), true);
});

test("stepsOfLesson returns 0-indexed steps for a known lesson id", () => {
  const steps = stepsOfLesson("ja", "ja-m1-l1-1");
  assert.deepEqual(steps, [
    { stepIndex: 0, stepType: "symbol_intro" },
    { stepIndex: 1, stepType: "multiple_choice" },
    { stepIndex: 2, stepType: "listening_build" },
  ]);
});

test("stepsOfLesson returns null for an unknown lesson id", () => {
  assert.equal(stepsOfLesson("ja", "ja-m99-nope"), null);
});

test("findInContent matches a literal substring inside any step field", () => {
  const hits = findInContent("ja", "うん");
  assert.equal(hits.length, 2);
  assert.equal(hits[0].lessonId, "ja-m1-l1-1");
  assert.equal(hits[0].stepIndex, 1);
  assert.equal(hits[1].stepIndex, 2);
});

test("findInContent returns [] for text nowhere in the content", () => {
  assert.deepEqual(findInContent("ja", "no such text anywhere"), []);
});

test("langModules throws a helpful error for an unknown language", async () => {
  const { langModules } = await import("./lib/content-search.mjs");
  assert.throws(() => langModules("zz"), /manifest has no language "zz"/);
});
