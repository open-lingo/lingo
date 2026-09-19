import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";
import { buildListenCompLits, buildSim, buildMatchLit, buildSpeakWin } from "./stepsClose.mjs";

const spec = normalizeSpec({
  lesson: 1, id: "x", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title",
  words: [
    { pt: "eu", en: "I", pos: "pronoun" },
    { pt: "sou", en: "I am", pos: "verb" },
  ],
  sentences: [
    { pt: "Eu sou Sam.", en: "I am Sam.", roles: ["listen"], uses: ["eu", "sou"] },
    { pt: "Eu sou aqui.", en: "I am here.", roles: ["listen"], uses: ["eu", "sou"] },
  ],
  dialogue: { npc: "Bia", turns: [{ npc: "Olá!", gloss: "Hi!", goal: "Say hi.", options: ["Olá!", "Tchau."], correct: 0 }] },
  win: { pt: "Eu sou Sam.", en: "I'm Sam." },
});

test("buildListenCompLits: 3 distinct distractors drawn from sibling sentences", () => {
  const [first] = buildListenCompLits(spec);
  assert.equal(first.distractorsEn.length, 3);
  assert.ok(!first.distractorsEn.includes(first.en));
});

test("buildSim: first turn is the debut turn, correctOptionId matches", () => {
  const sim = buildSim(spec);
  assert.equal(sim.turns[0].debut, true);
  const opt = sim.turns[0].reply.options.find((o) => o.id === sim.turns[0].reply.correctOptionId);
  assert.equal(opt.text, "Olá!");
});

test("buildMatchLit: pads from priorVocab up to the floor", () => {
  const prior = new Map([["olá", { surface: "olá", meaningEn: "hello" }], ["você", { surface: "você", meaningEn: "you" }],
    ["é", { surface: "é", meaningEn: "is" }], ["professor", { surface: "professor", meaningEn: "teacher" }]]);
  const m = buildMatchLit(spec, prior);
  assert.ok(m.pairs.length >= 6, `expected >= 6 pairs, got ${m.pairs.length}`);
});

test("buildSpeakWin: credits only whole-word matches (not a substring hit)", () => {
  const win = buildSpeakWin(spec);
  assert.ok(win.atoms.includes("eu"));
  assert.ok(win.atoms.includes("sou"));
});

// ── round 4 (lane PTTOOL4, item 4: mode: build sim turns) ────────────────

test("normalizeSpec: dialogue turn mode: build requires tiles + answer, and tiles must cover it", () => {
  assert.throws(
    () => normalizeSpec({ ...spec, dialogue: { npc: "Bia", turns: [{ npc: "Tudo bem?", mode: "build", answer: "Eu sou bem" }] } }),
    /tiles/,
  );
  assert.throws(
    () => normalizeSpec({ ...spec, dialogue: { npc: "Bia", turns: [{ npc: "Tudo bem?", mode: "build", tiles: ["Eu", "sou"], answer: "Eu sou bem" }] } }),
    /needs tile "bem"/,
  );
  const s = normalizeSpec({ ...spec, dialogue: { npc: "Bia", turns: [{ npc: "Tudo bem?", mode: "build", tiles: ["Eu", "sou", "bem"], answer: "Eu sou bem" }] } });
  assert.equal(s.dialogue.turns[0].mode, "build");
});

test("buildSim: a mode: build turn emits a real tiles+answer reply (no options/correctOptionId)", () => {
  const s = normalizeSpec({
    ...spec,
    dialogue: { npc: "Bia", turns: [{ npc: "Tudo bem?", goal: "Say you're fine.", mode: "build", tiles: ["Eu", "sou", "bem", "feliz"], answer: "Eu sou bem" }] },
  });
  const sim = buildSim(s);
  const reply = sim.turns[0].reply;
  assert.equal(reply.mode, "build");
  assert.deepEqual(reply.tiles, ["Eu", "sou", "bem", "feliz"]);
  assert.equal(reply.answer, "Eu sou bem");
  assert.equal(reply.options, undefined);
});
