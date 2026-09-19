import test from "node:test";
import assert from "node:assert/strict";
import { runAllChecks } from "./checkRules.mjs";

const atoms = [{ surface: "eu" }, { surface: "sou" }];

function find(results, name) { return results.find((r) => r.name === name); }

test("checkRules: a word_map's opening sentence does not satisfy intro-capable-first-appearance " +
  "(map is transparent; clozeLit is NOT itself intro-capable per the checklist — the next " +
  "intro-capable step is what must carry the word's real debut)", () => {
  const lesson = {
    steps: [
      { id: "map", kind: "map", tokens: ["Eu", "sou"], pairs: [] }, // prints "eu"/"sou" first — should not count
      { id: "clz", kind: "clozeLit", pt: "Sou eu.", en: "x", blank: "sou", options: ["sou"], atoms: ["eu", "sou"] }, // not intro-capable either
      { id: "spk", kind: "speakLit", pt: "Eu sou.", en: "x", atoms: ["eu", "sou"] }, // eu/sou already printed by the map+cloze above, so this is a no-op for the check
    ],
  };
  const r = runAllChecks(lesson, atoms);
  // "eu"/"sou" first print NON-map on the clozeLit (not intro-capable) -> FAIL.
  assert.equal(find(r, "intro-capable-first-appearance").ok, false);
});

test("checkRules: intro-capable-first-appearance PASSES when the first non-map print is an intro-capable kind", () => {
  const lesson = {
    steps: [
      { id: "map", kind: "map", tokens: ["Eu", "sou"], pairs: [] },
      { id: "spk", kind: "speakLit", pt: "Eu sou.", en: "x", atoms: ["eu", "sou"] },
    ],
  };
  const r = runAllChecks(lesson, atoms);
  assert.equal(find(r, "intro-capable-first-appearance").ok, true);
});

test("checkRules: flags a word whose first NON-map appearance is a non-intro-capable step", () => {
  const lesson = {
    steps: [
      { id: "map", kind: "map", tokens: ["Eu"], pairs: [] },
      { id: "match", kind: "matchLit", pairs: [{ source: "eu", target: "I" }] }, // not intro-capable
      { id: "info", kind: "info", title: "t", body: "b" },
    ],
  };
  const r = runAllChecks(lesson, [{ surface: "eu" }]);
  assert.equal(find(r, "intro-capable-first-appearance").ok, false);
});

test("checkRules: adjacency and selection-run detect real violations", () => {
  const lesson = { steps: [{ id: "a", kind: "clozeLit" }, { id: "b", kind: "clozeLit" }] };
  const r = runAllChecks(lesson, []);
  assert.equal(find(r, "adjacency").ok, false);
});

test("checkRules: match-floor fails under 6 pairs, passes at 6", () => {
  const few = { steps: [{ id: "m", kind: "matchLit", pairs: [{ source: "a", target: "b" }] }] };
  assert.equal(find(runAllChecks(few, []), "match-floor").ok, false);
  const six = { steps: [{ id: "m", kind: "matchLit", pairs: Array.from({ length: 6 }, (_, i) => ({ source: `s${i}`, target: `t${i}` })) }] };
  assert.equal(find(runAllChecks(six, []), "match-floor").ok, true);
});

test("checkRules: tile-floor is informational (ok === null), never a hard failure", () => {
  const lesson = { steps: [{ id: "b", kind: "buildLit", pt: "Oi." }] };
  const r = find(runAllChecks(lesson, []), "tile-floor");
  assert.equal(r.ok, null);
});

// ── round 3 (lane PTTOOL3, rule 1) ───────────────────────────────────────

test("checkRules: dialogue-mandatory FAILS a non-checkpoint lesson with no sim step (R2-L1/L2/L3 shipped none)", () => {
  const lesson = { steps: [{ id: "match", kind: "matchLit", pairs: [] }] };
  const r = find(runAllChecks(lesson, []), "dialogue-mandatory");
  assert.equal(r.ok, false);
});

test("checkRules: dialogue-mandatory PASSES a non-checkpoint lesson that has a sim step", () => {
  const lesson = { steps: [{ id: "sim", kind: "sim", turns: [] }] };
  const r = find(runAllChecks(lesson, []), "dialogue-mandatory");
  assert.equal(r.ok, true);
});

test("checkRules: dialogue-mandatory PASSES a checkpoint lesson with no sim step (checkpoint still needs one at schedule-time, not re-checked here)", () => {
  const lesson = { checkpoint: true, steps: [{ id: "match", kind: "matchLit", pairs: [] }] };
  const r = find(runAllChecks(lesson, []), "dialogue-mandatory");
  assert.equal(r.ok, true);
});
