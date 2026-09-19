import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";
import { buildCandidateSteps } from "./steps.mjs";
import { scheduleSteps } from "./schedule.mjs";

test("scheduleSteps: never places two adjacent same-kind steps", () => {
  const spec = normalizeSpec({
    lesson: 1, id: "x", title: "T", grammar: "g",
    words: [
      { pt: "casa", en: "house", pos: "noun", emoji: "🏠" },
      { pt: "gato", en: "cat", pos: "noun", emoji: "🐱" },
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" },
      { pt: "de", en: "of", pos: "particle" }, { pt: "aqui", en: "here", pos: "adverb" },
    ],
    sentences: [
      { pt: "Eu sou de aqui.", en: "I am from here.", roles: ["cloze:sou"], uses: ["eu", "sou", "de", "aqui"] },
      { pt: "Eu sou de casa.", en: "I am from home.", roles: ["cloze:de"], uses: ["eu", "sou", "de", "casa"] },
      { pt: "Eu sou de casa aqui.", en: "I am here at home.", roles: ["build", "debut"], uses: ["eu", "sou", "de", "casa", "aqui"] },
      { pt: "Eu sou de gato aqui.", en: "I am of cat here.", roles: ["listen", "cloze:gato"], uses: ["eu", "sou", "de", "gato", "aqui"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes.", options: ["Sou, sou daqui.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou de casa.", en: "I am from home." },
  });
  const steps = scheduleSteps(buildCandidateSteps(spec, new Map()), spec);
  for (let i = 1; i < steps.length; i++) assert.notEqual(steps[i].kind, steps[i - 1].kind, `adjacent ${steps[i].kind} at ${i}`);
  assert.equal(steps.at(-3).kind, "sim");
  assert.equal(steps.at(-2).kind, "matchLit");
  assert.equal(steps.at(-1).kind, "speakLit");
});

test("scheduleSteps: throws naming the smallest fix when an atom is under the answer floor", () => {
  // Same shape as the adjacency fixture (healthy step count), but "gato"
  // loses its extra `cloze:gato` role — down to 2 credits (listen + its
  // own imageMcq), one short of the >= 3 floor.
  const spec = normalizeSpec({
    lesson: 1, id: "x", title: "T", grammar: "g",
    // "gato" carries NO emoji here (unlike the adjacency fixture) — this
    // strips its imageMcq credit and, together with a sim whose correct
    // reply never mentions it, leaves it under the floor even though
    // matchLit/sim now also credit answer positions (see `creditedAtoms`).
    words: [
      { pt: "casa", en: "house", pos: "noun", emoji: "🏠" },
      { pt: "gato", en: "cat", pos: "noun" },
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" },
      { pt: "de", en: "of", pos: "particle" }, { pt: "aqui", en: "here", pos: "adverb" },
    ],
    sentences: [
      { pt: "Eu sou de aqui.", en: "I am from here.", roles: ["cloze:sou"], uses: ["eu", "sou", "de", "aqui"] },
      { pt: "Eu sou de casa.", en: "I am from home.", roles: ["cloze:de"], uses: ["eu", "sou", "de", "casa"] },
      { pt: "Eu sou de casa aqui.", en: "I am here at home.", roles: ["build", "debut"], uses: ["eu", "sou", "de", "casa", "aqui"] },
      { pt: "Eu sou de gato aqui.", en: "I am of cat here.", roles: ["listen"], uses: ["eu", "sou", "de", "gato", "aqui"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes.", options: ["Sou, sou daqui.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou de casa.", en: "I am from home." },
  });
  assert.throws(() => scheduleSteps(buildCandidateSteps(spec, new Map()), spec), /answer position/);
});

test("scheduleSteps: checkpoint: true ends on the sim (not sim -> matchLit -> speakLit)", () => {
  const spec = normalizeSpec({
    lesson: 6, id: "x", title: "T", grammar: "g", checkpoint: true,
    words: [
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" },
      { pt: "de", en: "of", pos: "particle" }, { pt: "aqui", en: "here", pos: "adverb" },
      { pt: "casa", en: "house", pos: "noun" }, { pt: "gato", en: "cat", pos: "noun" },
    ],
    sentences: [
      { pt: "Eu sou de aqui e gosto de casa.", en: "I am from here and I like home.", roles: ["build"], uses: ["eu", "sou", "de", "aqui"] },
      { pt: "Eu sou de casa.", en: "I am from home.", roles: ["listen"], uses: ["eu", "sou", "de", "casa"] },
      { pt: "Eu sou de casa e gosto daqui.", en: "I am from home and I like it here.", roles: ["build"], uses: ["eu", "sou", "de", "casa", "aqui"] },
      { pt: "Eu sou de gato aqui.", en: "I am of cat here.", roles: ["listen"], uses: ["eu", "sou", "de", "gato", "aqui"] },
      { pt: "Eu sou de casa e de gato.", en: "I am from home and from cat.", roles: ["build"], uses: ["eu", "sou", "de", "casa", "gato"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes.", options: ["Sou, sou daqui.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou de casa.", en: "I am from home." },
  });
  const steps = scheduleSteps(buildCandidateSteps(spec, new Map()), spec);
  assert.equal(steps.at(-1).kind, "sim", "checkpoint must end on the sim");
  assert.equal(steps.at(-2).kind, "speakLit");
  assert.equal(steps.at(-3).kind, "matchLit");
});

test("scheduleSteps: checkpoint: true forbids a new-atom debut via imageMcq", () => {
  const spec = normalizeSpec({
    lesson: 6, id: "x", title: "T", grammar: "g", checkpoint: true,
    words: [
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" },
      { pt: "de", en: "of", pos: "particle" }, { pt: "aqui", en: "here", pos: "adverb" },
      { pt: "casa", en: "house", pos: "noun", emoji: "🏠" }, { pt: "gato", en: "cat", pos: "noun" },
    ],
    sentences: [
      { pt: "Eu sou de aqui.", en: "I am from here.", roles: ["listen"], uses: ["eu", "sou", "de", "aqui"] },
      { pt: "Eu sou de casa.", en: "I am from home.", roles: ["listen"], uses: ["eu", "sou", "de", "casa"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes.", options: ["Sou, sou daqui.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou de casa.", en: "I am from home." },
  });
  assert.throws(() => scheduleSteps(buildCandidateSteps(spec, new Map()), spec), /imageMcq/);
});

test("scheduleSteps: rejects a too-small spec with a named smallest fix (match-floor fires first)", () => {
  // A single word/sentence trips the match-pair floor before it could ever
  // reach the step-count band — "most useful message first" ordering,
  // same doctrine `compile-ir-pt.mjs`'s own validation uses.
  const spec = normalizeSpec({
    lesson: 1, id: "x", title: "T", grammar: "g",
    words: [{ pt: "oi", en: "hi", pos: "interjection" }],
    sentences: [{ pt: "Oi, oi, oi, oi, oi.", en: "Hi.", roles: ["listen"], uses: ["oi"] }],
    win: { pt: "Oi, oi, oi, oi, oi.", en: "Hi." },
  });
  assert.throws(() => scheduleSteps(buildCandidateSteps(spec, new Map()), spec), /smallest fix/);
});
