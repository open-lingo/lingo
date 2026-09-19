import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";

const base = {
  lesson: 1, id: "pt-m1-l1", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title",
  words: [{ pt: "eu", en: "I", pos: "pronoun" }],
  sentences: [{ pt: "Eu sou.", en: "I am.", roles: ["listen"], uses: ["eu"] }],
  win: { pt: "Eu sou.", en: "I am." },
};

test("normalizeSpec: accepts a minimal valid spec", () => {
  const s = normalizeSpec(base);
  assert.equal(s.lesson, 1);
  assert.equal(s.words.length, 1);
  assert.equal(s.info, "info body text");
  assert.equal(s.infoTitle, "Info Title");
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

// ── round 2 (lane PTTOOL2) ───────────────────────────────────────────────

test("normalizeSpec: rejects info identical to grammar (PTGRADE finding 2 — no description leak)", () => {
  assert.throws(() => normalizeSpec({ ...base, info: "g" }), /identical to "grammar"/);
});

test("normalizeSpec: rejects a missing infoTitle", () => {
  const { infoTitle, ...rest } = base;
  assert.throws(() => normalizeSpec(rest), /infoTitle/);
});

test("normalizeSpec: checkpoint: true allows words: []", () => {
  const s = normalizeSpec({ ...base, words: [], checkpoint: true, recall: ["eu"], sentences: [{ pt: "Eu sou.", en: "I am.", roles: ["listen"], uses: ["eu"] }] });
  assert.equal(s.words.length, 0);
  assert.equal(s.checkpoint, true);
});

test("normalizeSpec: words: [] without checkpoint still rejected", () => {
  assert.throws(() => normalizeSpec({ ...base, words: [] }), /words/);
});

test("normalizeSpec: recall lets a sentence use an already-taught surface with no words[] entry", () => {
  const s = normalizeSpec({ ...base, recall: ["tenho"], sentences: [{ pt: "Eu tenho.", en: "I have.", roles: ["listen"], uses: ["tenho"] }] });
  assert.deepEqual(s.recall, ["tenho"]);
});

test("normalizeSpec: contrast pairs need a and b", () => {
  assert.throws(() => normalizeSpec({ ...base, contrast: [{ a: "avó" }] }), /contrast/);
});

test("normalizeSpec: contrastSet members must be declared words or recall", () => {
  assert.throws(() => normalizeSpec({ ...base, contrastSet: [["eu", "ghost"]] }), /ghost/);
});

test("normalizeSpec: antiPattern requires ok + wrong", () => {
  assert.throws(() => normalizeSpec({ ...base, antiPattern: { ok: "Sam é estudante." } }), /wrong/);
  const s = normalizeSpec({ ...base, antiPattern: { ok: "Sam é estudante.", wrong: "Sam está estudante." } });
  assert.equal(s.antiPattern.wrong, "Sam está estudante.");
});

test("normalizeSpec: pattern slots require >= 2 distractorsEn (no-invention doctrine)", () => {
  assert.throws(
    () => normalizeSpec({ ...base, pattern: { frame: "Eu ___ de ___", slots: [{ pt: "Eu gosto de música.", en: "I like music.", distractorsEn: ["I have music"] }] } }),
    /distractorsEn/,
  );
});

test("normalizeSpec: conjugation needs >= 2 forms", () => {
  assert.throws(() => normalizeSpec({ ...base, conjugation: { verb: "falar", forms: [{ pt: "Eu falo.", en: "I speak.", blank: "falo" }] } }), /forms/);
});

test("normalizeSpec: agreement needs >= 2 blanks with distinct, non-proper-noun answers", () => {
  assert.throws(
    () => normalizeSpec({ ...base, agreement: { sentence: "Eu tenho um amigo.", en: "I have a friend.", blanks: [{ answer: "um", options: ["um", "uma"] }] } }),
    /blanks/,
  );
  assert.throws(
    () => normalizeSpec({ ...base, agreement: { sentence: "Sam tem um gato.", en: "Sam has a cat.", blanks: [{ answer: "Sam", options: ["Sam", "Bia"] }, { answer: "um", options: ["um", "uma"] }] } }),
    /proper noun/,
  );
  const s = normalizeSpec({ ...base, agreement: { sentence: "Eu tenho um amigo e uma irmã.", en: "I have a friend and a sister.", blanks: [{ answer: "um", options: ["um", "uma"] }, { answer: "uma", options: ["um", "uma"] }] } });
  assert.equal(s.agreement.blanks.length, 2);
});
