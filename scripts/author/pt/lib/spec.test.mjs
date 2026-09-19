import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";

const base = {
  lesson: 1, id: "pt-m1-l1", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title",
  words: [{ pt: "eu", en: "I", pos: "pronoun" }],
  sentences: [{ pt: "Eu sou.", en: "I am.", roles: ["listen"], uses: ["eu"] }],
  dialogue: { npc: "Bia", turns: [{ npc: "Olá!", options: ["Oi!", "Tchau."], correct: 0 }] },
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

// ── round 3 (lane PTTOOL3, rules 3-4) ─────────────────────────────────────

test("normalizeSpec: rejects an allow: word outside the closed function-word set (R2-L2 allow-listed capital/paris/rio/grande)", () => {
  assert.throws(() => normalizeSpec({ ...base, allow: ["capital"] }), /capital.*closed set|closed set.*capital/);
});

test("normalizeSpec: accepts every closed-set allow: word", () => {
  const s = normalizeSpec({ ...base, allow: ["e", "ou", "mas", "não", "sim", "com", "a", "o"] });
  assert.equal(s.allow.length, 8);
});

test("normalizeSpec: sentences[].uses error names the fix (uses = credited atoms only, never allow:)", () => {
  const bad = { ...base, allow: ["e"], sentences: [{ pt: "x", en: "y", roles: ["listen"], uses: ["e"] }] };
  assert.throws(() => normalizeSpec(bad), /"uses" credits atoms only.*never in "uses:"/);
});

// ── round 3 (lane PTTOOL3, rule 1) ───────────────────────────────────────

test("normalizeSpec: rejects a missing dialogue (R2-L2/L3 shipped no sim — PTGRADE2 #1)", () => {
  const { dialogue, ...rest } = base;
  assert.throws(() => normalizeSpec(rest), /dialogue/);
});

test("normalizeSpec: rejects a dialogue with zero turns", () => {
  assert.throws(() => normalizeSpec({ ...base, dialogue: { npc: "Bia", turns: [] } }), /dialogue.*turn/i);
});

// ── round 3 (lane PTTOOL3, rule 2) ───────────────────────────────────────

test("normalizeSpec: rejects a pos: noun word with no emoji and no imageable: false (R2-L3 skipped emoji)", () => {
  const words = [{ pt: "casa", en: "house", pos: "noun" }];
  assert.throws(() => normalizeSpec({ ...base, words }), /emoji|imageable/);
});

test("normalizeSpec: rejects imageable: false with no imageableReason", () => {
  const words = [{ pt: "amor", en: "love", pos: "noun", imageable: false }];
  assert.throws(() => normalizeSpec({ ...base, words }), /imageableReason/);
});

test("normalizeSpec: accepts a noun with emoji, and a noun with imageable: false + a reason", () => {
  const words = [
    { pt: "casa", en: "house", pos: "noun", emoji: "🏠" },
    { pt: "amor", en: "love", pos: "noun", imageable: false, imageableReason: "abstract noun, no vendored glyph fits" },
  ];
  const s = normalizeSpec({ ...base, words, sentences: [{ pt: "Eu sou.", en: "I am.", roles: ["listen"], uses: ["casa"] }] });
  assert.equal(s.words[0].imageable, true);
  assert.equal(s.words[1].imageable, false);
  assert.equal(s.words[1].imageableReason, "abstract noun, no vendored glyph fits");
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

// ── round 4 (lane PTTOOL4, item 3) ────────────────────────────────────────

test("normalizeSpec: allow accepts a capitalized proper noun even though it's not in the closed set", () => {
  const s = normalizeSpec({ ...base, allow: ["São", "Paulo"] });
  assert.deepEqual(s.allow, ["São", "Paulo"]);
});

test("normalizeSpec: allow still rejects a lowercase word outside the closed set", () => {
  assert.throws(() => normalizeSpec({ ...base, allow: ["capital"] }), /closed set/);
});

test("normalizeSpec: allow accepts the item-3 closed-set additions", () => {
  const s = normalizeSpec({ ...base, allow: ["muito", "porque", "também", "só"] });
  assert.equal(s.allow.length, 4);
});

test("normalizeSpec: allowExtra requires a non-empty reason", () => {
  assert.throws(() => normalizeSpec({ ...base, allowExtra: ["hoje"] }), /reason/);
  assert.throws(() => normalizeSpec({ ...base, allowExtra: ["hoje"], reason: "   " }), /reason/);
  const s = normalizeSpec({ ...base, allowExtra: ["hoje"], reason: "reserved for a later lesson" });
  assert.deepEqual(s.allowExtra, ["hoje"]);
  assert.equal(s.reason, "reserved for a later lesson");
});
