import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSentence, isNormalized, literalToken, dedupeOptionsCaseInsensitive } from "./normalizeText.mjs";

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

// ── round 3 (lane PTTOOL3, rule 7) ───────────────────────────────────────

test("literalToken: finds a sentence-initial capitalized form for a lowercase surface (R2-L2's Onde/onde mismatch)", () => {
  assert.equal(literalToken("Onde é a capital?", "onde"), "Onde");
});

test("literalToken: strips trailing punctuation to match (R2-L2's cidade, mismatch)", () => {
  assert.equal(literalToken("A cidade, no Brasil, é grande.", "cidade"), "cidade,");
});

test("literalToken: returns null when the surface truly is not a word of the sentence", () => {
  assert.equal(literalToken("Eu sou estudante.", "professor"), null);
});

test("dedupeOptionsCaseInsensitive: collapses Onde/onde into one entry, keeping the literal blank's exact case", () => {
  const out = dedupeOptionsCaseInsensitive(["Onde", "de", "onde"], "Onde");
  assert.deepEqual(out.sort(), ["Onde", "de"].sort());
});
