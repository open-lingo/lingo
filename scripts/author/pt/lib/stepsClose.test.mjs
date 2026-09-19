import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";
import { buildListenCompLits, buildSim, buildMatchLit, buildSpeakWin, buildAgreementLit } from "./stepsClose.mjs";

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

// ── item 9a (lane PTTOOL5): auto-emit agreementLit from an article-pair contrastSet ─

test("buildAgreementLit: auto-emits a two-blank agreement step from a contrastSet article pair (um/uma) when no manual agreement: block is authored", () => {
  const s = normalizeSpec({
    lesson: 3, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [
      { pt: "tenho", en: "I have", pos: "verb" },
      { pt: "um", en: "a (m)", pos: "determiner" },
      { pt: "uma", en: "a (f)", pos: "determiner" },
      { pt: "amigo", en: "friend", pos: "noun", emoji: "🧑‍🤝‍🧑" },
      { pt: "irmã", en: "sister", pos: "noun", emoji: "👧" },
    ],
    contrastSet: [{ set: ["um", "uma"], why: "um marks a masculine noun; uma marks a feminine noun in Portuguese." }],
    sentences: [
      { pt: "Eu tenho um amigo e uma irmã.", en: "I have a friend and a sister.", roles: ["build"], uses: ["tenho", "um", "amigo", "uma", "irmã"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "Eu tenho um amigo e uma irmã.", en: "I have a friend and a sister." },
  });
  const step = buildAgreementLit(s);
  assert.ok(step, "expected an auto-emitted agreementLit");
  assert.equal(step.kind, "agreementLit");
  assert.equal(step.segments.filter((seg) => seg.blank).length, 2);
  const answers = step.segments.filter((seg) => seg.blank).map((seg) => seg.blank.answer);
  assert.deepEqual(answers.sort(), ["um", "uma"]);
});

test("buildAgreementLit: returns null when no contrastSet is an article pair and no manual agreement: is authored", () => {
  const s = normalizeSpec({
    lesson: 3, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [{ pt: "sou", en: "I am", pos: "verb" }, { pt: "é", en: "is", pos: "verb" }],
    contrastSet: [{ set: ["sou", "é"], why: "sou is the eu-form of ser; é is the ele/ela/você-form." }],
    sentences: [{ pt: "Eu sou estudante.", en: "I am a student.", roles: ["build"], uses: ["sou"] }],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "Eu sou estudante.", en: "I am a student." },
  });
  assert.equal(buildAgreementLit(s), null);
});
