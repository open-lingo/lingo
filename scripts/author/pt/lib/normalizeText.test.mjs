import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSentence, isNormalized } from "./normalizeText.mjs";

test("normalizeSentence: capitalizes sentence-initial letter and adds terminal punctuation", () => {
  assert.equal(normalizeSentence("eu sou estudante"), "Eu sou estudante.");
});

test("normalizeSentence: leaves an existing terminal ? alone", () => {
  assert.equal(normalizeSentence("você é daqui?"), "Você é daqui?");
});

test("normalizeSentence: restores persona capitalization mid-sentence", () => {
  assert.equal(normalizeSentence("eu sou sam, e você?"), "Eu sou Sam, e você?");
});

test("isNormalized: false for lowercase-initial or missing terminal punctuation", () => {
  assert.equal(isNormalized("eu sou estudante."), false);
  assert.equal(isNormalized("Eu sou estudante"), false);
  assert.equal(isNormalized("Eu sou sam."), false);
  assert.equal(isNormalized("Eu sou Sam."), true);
});
