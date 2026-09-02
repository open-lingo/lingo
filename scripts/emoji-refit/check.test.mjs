import test from "node:test";
import assert from "node:assert/strict";
import { notoFilename, isDigitOrKeycap } from "./noto.mjs";
import { checkCandidate, buildFlagged } from "./check.mjs";

test("notoFilename strips FE0F, keeps ZWJ, zero-pads BMP", () => {
  assert.equal(notoFilename("❤️"), "emoji_u2764.svg");
  assert.equal(notoFilename("👨‍🍳"), "emoji_u1f468_200d_1f373.svg");
  assert.equal(notoFilename("🐟"), "emoji_u1f41f.svg");
});

test("digits and keycaps are rejected", () => {
  assert.equal(isDigitOrKeycap("3️⃣"), true);
  assert.equal(isDigitOrKeycap("7"), true);
  assert.equal(isDigitOrKeycap("🔢"), true);
  assert.equal(isDigitOrKeycap("🐟"), false);
});

test("checkCandidate flags an in-course collision and a missing Noto file", () => {
  const index = new Set(["emoji_u1f41f.svg"]);
  const used = new Map([["🐟", ["ja:sakana"]]]);
  const c = checkCandidate("🐟", { course: "ja", id: "ja:ike" }, index, new Set(), used);
  assert.deepEqual(c.collidesWith, ["ja:sakana"]);
  assert.equal(c.inNoto, true);
  assert.equal(c.ok, false);
  const d = checkCandidate("🪷", { course: "ja", id: "ja:ike" }, index, new Set(), used);
  assert.equal(d.inNoto, false);
  assert.equal(d.ok, false);
});

test("buildFlagged keeps low-fit, indirect and gap items only", () => {
  const items = [
    { id: "a", course: "ja", module: "m1", emoji: "🦆", kind: "vocab" },
    { id: "b", course: "ja", module: "m1", emoji: "🌙", kind: "vocab" },
    { id: "c", course: "ja", module: "m2", kind: "vocab" },
  ];
  const scores = [
    { id: "a", fit: 2, indirect: true, candidates: [] },
    { id: "b", fit: 5, indirect: false, candidates: [] },
    { id: "c", fit: null, indirect: false, candidates: ["🪑"] },
  ];
  const f = buildFlagged(items, scores, []);
  assert.deepEqual(f.map((x) => x.id), ["a", "c"]);
});
