import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";
import { buildSpeaks, buildContrastSteps, buildPatternSteps, buildConjugationClozes, buildPhraseDebut } from "./stepsExtra.mjs";

const base = {
  lesson: 1, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
  words: [{ pt: "sou", en: "I am", pos: "verb", of: "ser" }, { pt: "é", en: "is/are", pos: "verb", of: "ser" }],
  sentences: [{ pt: "Eu sou estudante.", en: "I am a student.", roles: ["build", "debut"], uses: ["sou"] }],
  dialogue: { npc: "Bia", turns: [{ npc: "Olá!", options: ["Oi!", "Tchau."], correct: 0 }] },
  win: { pt: "Eu sou estudante.", en: "I am a student." },
};

test("buildSpeaks: one speakLit per role:speak sentence, credits its uses", () => {
  const spec = normalizeSpec({ ...base, sentences: [...base.sentences, { pt: "Você é professor.", en: "You are a teacher.", roles: ["speak"], uses: ["é"] }] });
  const out = buildSpeaks(spec);
  assert.equal(out.length, 1);
  assert.equal(out[0].kind, "speakLit");
  assert.deepEqual(out[0].atoms, ["é"]);
});

test("buildContrastSteps: textMcq target/distractors pad to >= 3 from priorVocab", () => {
  const spec = normalizeSpec({ ...base, contrast: [{ a: "sou", b: "é", note: "1st vs 2nd/3rd person" }] });
  const prior = new Map([["tenho", { surface: "tenho", meaningEn: "I have" }], ["tem", { surface: "tem", meaningEn: "have" }]]);
  const out = buildContrastSteps(spec, prior);
  assert.equal(out.length, 1);
  assert.equal(out[0].kind, "textMcq");
  assert.equal(out[0].target, "sou");
  assert.ok(out[0].distractors.length >= 3);
  assert.ok(out[0].distractors.includes("é"));
});

test("buildPatternSteps: one mcq per slot, prompt=pt, correct=en", () => {
  const spec = normalizeSpec({ ...base, pattern: { frame: "Eu ___ de ___", slots: [{ pt: "Eu gosto de música.", en: "I like music.", distractorsEn: ["I have music.", "I am music."] }] } });
  const out = buildPatternSteps(spec);
  assert.equal(out.length, 1);
  assert.equal(out[0].kind, "mcq");
  assert.equal(out[0].prompt, "Eu gosto de música.");
  assert.equal(out[0].correct, "I like music.");
});

test("buildConjugationClozes: one clozeLit per form, options = every form's blank", () => {
  const spec = normalizeSpec({
    ...base,
    conjugation: {
      verb: "falar",
      forms: [
        { pt: "Eu falo português.", en: "I speak Portuguese.", blank: "falo" },
        { pt: "Você fala português.", en: "You speak Portuguese.", blank: "fala" },
      ],
    },
  });
  const out = buildConjugationClozes(spec);
  assert.equal(out.length, 2);
  for (const step of out) {
    assert.equal(step.kind, "clozeLit");
    assert.deepEqual(new Set(step.options), new Set(["falo", "fala"]));
  }
});

test("buildPhraseDebut: kind phrase, printable text = word.pt, credits word.pt", () => {
  const step = buildPhraseDebut({ pt: "do", en: "of the", emoji: undefined }, 2.5);
  assert.equal(step.kind, "phrase");
  assert.equal(step.text, "do");
  assert.equal(step._ord, 2.5);
  assert.deepEqual(step.atoms, ["do"]);
});
