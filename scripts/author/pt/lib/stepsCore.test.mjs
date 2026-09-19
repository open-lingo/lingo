import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";
import { buildMap, buildImageMcqs, buildClozeLits, buildBuildLits } from "./stepsCore.mjs";

const spec = normalizeSpec({
  lesson: 2, id: "x", title: "T", grammar: "g",
  words: [
    { pt: "do", en: "of the", pos: "particle" },
    { pt: "cidade", en: "city", pos: "noun", emoji: "🏙️" },
    { pt: "eu", en: "I", pos: "pronoun" },
    { pt: "sou", en: "I am", pos: "verb" },
  ],
  sentences: [
    { pt: "Eu sou da cidade grande.", en: "I am from the big city.", roles: ["build"], uses: ["eu", "sou", "cidade"] },
    { pt: "Eu sou do lugar bonito.", en: "I am from the pretty place.", roles: ["build"], uses: ["eu", "sou", "do"] },
    { pt: "Eu sou estudante.", en: "I am a student.", roles: ["cloze:sou"], uses: ["eu", "sou"] },
  ],
  win: { pt: "Eu sou da cidade grande.", en: "I am from the big city." },
});

test("buildMap: maps tokens whose bare form matches a taught word", () => {
  const m = buildMap(spec);
  assert.equal(m.kind, "map");
  assert.ok(m.pairs.some((p) => p.en === "I"));
  assert.equal(m.audioText, "eu sou da cidade grande");
});

test("buildImageMcqs: only imageable nouns, <= 2, each needs 3 distractors", () => {
  const mcqs = buildImageMcqs(spec, new Map());
  assert.equal(mcqs.length, 1); // only "cidade" is an imageable noun
  assert.equal(mcqs[0].distractors.length, 3);
});

test("buildClozeLits: a build-tagged sentence using a contraction is forced to clozeLit", () => {
  const clozes = buildClozeLits(spec);
  const forced = clozes.find((c) => c.blank === "do");
  assert.ok(forced, "expected a forced cloze on the contraction \"do\"");
});

test("buildBuildLits: skips sentences forced into clozeLit by a contraction", () => {
  const builds = buildBuildLits(spec);
  assert.ok(!builds.some((b) => b.pt.includes("do lugar")));
  assert.ok(builds.some((b) => b.pt.includes("da cidade")));
});

test("buildBuildLits: throws naming the smallest fix on a short non-debut sentence", () => {
  const short = normalizeSpec({
    ...JSON.parse(JSON.stringify({ lesson: 1, id: "x", title: "T", grammar: "g" })),
    words: [{ pt: "oi", en: "hi", pos: "interjection" }],
    sentences: [{ pt: "Oi.", en: "Hi.", roles: ["build"], uses: ["oi"] }],
    win: { pt: "Oi.", en: "Hi." },
  });
  assert.throws(() => buildBuildLits(short), /smallest fix/);
});
