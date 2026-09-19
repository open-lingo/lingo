import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { normalizeSpec } from "./spec.mjs";
import { emitFragmentYaml } from "./emitFragment.mjs";

const spec = normalizeSpec({
  lesson: 4, id: "pt-m1-l4", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title",
  words: [{ pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb", gender: undefined }],
  sentences: [{ pt: "Eu sou aqui.", en: "I am here.", roles: ["listen"], uses: ["eu", "sou"] }],
  dialogue: { npc: "Bia", turns: [{ npc: "Olá!", options: ["Oi!", "Tchau."], correct: 0 }] },
  win: { pt: "Eu sou aqui.", en: "I am here." },
});

const steps = [
  { id: "map", kind: "map", tokens: ["Eu", "sou"], pairs: [{ en: "I", tokenIndex: 0 }], audioText: "eu sou" },
  { id: "win", kind: "speakLit", pt: "Eu sou aqui.", en: "I am here.", atoms: ["eu", "sou"] },
];

test("emitFragmentYaml: round-trips through the yaml parser to the canonical lesson:+atoms: shape", () => {
  const text = emitFragmentYaml(spec, steps);
  const doc = parse(text);
  assert.equal(doc.lesson.n, 4);
  assert.equal(doc.lesson.template, "free");
  assert.equal(doc.lesson.steps.length, 2);
  assert.equal(doc.atoms.length, 2);
  assert.equal(doc.atoms[0].surface, "eu");
});

test("emitFragmentYaml: never emits YAML aliases (aliasDuplicateObjects: false)", () => {
  const sharedAtoms = ["eu", "sou"];
  const text = emitFragmentYaml(spec, [
    { id: "a", kind: "buildLit", pt: "Eu sou aqui.", en: "x", atoms: sharedAtoms },
    { id: "b", kind: "listenCompLit", pt: "Eu sou aqui.", en: "x", distractorsEn: ["a", "b", "c"], atoms: sharedAtoms },
  ]);
  assert.ok(!text.includes("&"), "expected no YAML anchor markers");
  assert.ok(!text.includes("*a"), "expected no YAML alias markers");
});

test("emitFragmentYaml: drops an empty buildLit tiles: [] placeholder", () => {
  const text = emitFragmentYaml(spec, [{ id: "b", kind: "buildLit", pt: "Eu sou aqui.", en: "x", tiles: [], atoms: ["eu"] }]);
  const doc = parse(text);
  assert.equal(doc.lesson.steps[0].tiles, undefined);
});
