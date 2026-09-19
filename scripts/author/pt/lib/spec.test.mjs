import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";

const base = {
  lesson: 1, id: "pt-m1-l1", title: "T", grammar: "g",
  words: [{ pt: "eu", en: "I", pos: "pronoun" }],
  sentences: [{ pt: "Eu sou.", en: "I am.", roles: ["listen"], uses: ["eu"] }],
  win: { pt: "Eu sou.", en: "I am." },
};

test("normalizeSpec: accepts a minimal valid spec", () => {
  const s = normalizeSpec(base);
  assert.equal(s.lesson, 1);
  assert.equal(s.words.length, 1);
  assert.equal(s.info, "g"); // defaults to grammar
});

test("normalizeSpec: rejects missing title", () => {
  assert.throws(() => normalizeSpec({ ...base, title: undefined }), /title/);
});

test("normalizeSpec: rejects a sentence referencing an unknown word", () => {
  const bad = { ...base, sentences: [{ pt: "x", en: "y", roles: ["listen"], uses: ["ghost"] }] };
  assert.throws(() => normalizeSpec(bad), /ghost/);
});

test("normalizeSpec: rejects > 8 words", () => {
  const words = Array.from({ length: 9 }, (_, i) => ({ pt: `w${i}`, en: `w${i}`, pos: "noun" }));
  assert.throws(() => normalizeSpec({ ...base, words }), /words/);
});

test("normalizeSpec: dialogue turn validates correct index in range", () => {
  const withDialogue = {
    ...base,
    dialogue: { npc: "Bia", turns: [{ npc: "Olá!", options: ["a", "b"], correct: 5 }] },
  };
  assert.throws(() => normalizeSpec(withDialogue), /correct/);
});
