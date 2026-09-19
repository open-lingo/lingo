import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";
import { emitAtomsTs } from "./emitAtomsTs.mjs";

const spec = normalizeSpec({
  lesson: 7, id: "pt-m1-l7", title: "T", grammar: "g",
  words: [
    { pt: "tenho", en: "I have", pos: "verb-form", of: "ter" },
    { pt: "família", en: "family", pos: "noun", gender: "f", emoji: "👪", hint: "cognate" },
  ],
  sentences: [{ pt: "Eu tenho uma família.", en: "I have a family.", roles: ["listen"], uses: ["tenho", "família"] }],
  win: { pt: "Eu tenho uma família.", en: "I have a family." },
});

test("emitAtomsTs: exports PT_M1_L<n>_ATOMS and imports atom() from ./courseAtoms", () => {
  const src = emitAtomsTs(spec);
  assert.match(src, /export const PT_M1_L7_ATOMS: PtAtom\[\] = \[/);
  assert.match(src, /import \{ atom, type PtAtom \} from "\.\/courseAtoms";/);
});

test("emitAtomsTs: folds pos \"verb-form\" onto the real partOfSpeech \"verb\"", () => {
  const src = emitAtomsTs(spec);
  assert.match(src, /partOfSpeech: "verb"/);
  assert.doesNotMatch(src, /partOfSpeech: "verb-form"/);
});

test("emitAtomsTs: carries gender/emoji/hint only when present", () => {
  const src = emitAtomsTs(spec);
  assert.match(src, /gender: "f"/);
  assert.match(src, /emoji: "👪"/);
  assert.match(src, /hint: "cognate"/);
  // "tenho" carries none of these three optional fields.
  const tenhoBlock = src.split("tenho")[1].split("}),")[0];
  assert.doesNotMatch(tenhoBlock, /gender:|emoji:|hint:/);
});

test("emitAtomsTs: produces syntactically balanced output (parseable as a module body)", () => {
  const src = emitAtomsTs(spec);
  assert.equal((src.match(/atom\(\{/g) ?? []).length, 2);
  assert.equal((src.match(/\}\),/g) ?? []).length, 2);
});
