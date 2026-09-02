import test from "node:test";
import assert from "node:assert/strict";
import { buildPrompt, mergeBatch, chunk } from "./score.mjs";

test("chunk splits into 8s", () => {
  assert.equal(chunk(Array.from({ length: 19 }), 8).length, 3);
});

test("prompt carries the rubric in prose and lists every item", () => {
  const p = buildPrompt([
    { id: "ja:ike", surface: "いけ", gloss: "pond", emoji: "🦆" },
    { id: "ja:tsukue", surface: "つくえ", gloss: "desk" },
  ]);
  assert.match(p, /5 = the emoji IS the thing/);
  assert.match(p, /ja:ike/);
  assert.match(p, /ja:tsukue .*no emoji yet/);
});

test("mergeBatch fills missing ids with a null score and empty candidates", () => {
  const items = [{ id: "a", emoji: "🐟" }, { id: "b" }];
  const out = mergeBatch(items, { scores: [{ id: "a", fit: 5, indirect: false, reason: "fish", candidates: [] }] });
  assert.deepEqual(out.find((s) => s.id === "b"), { id: "b", fit: null, indirect: false, reason: "MODEL_MISSING", candidates: [] });
  assert.equal(out.find((s) => s.id === "a").fit, 5);
});
