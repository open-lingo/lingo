import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";
import { buildMap, buildImageMcqs, buildClozeLits, buildBuildLits } from "./stepsCore.mjs";

const spec = normalizeSpec({
  lesson: 2, id: "x", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title",
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
  dialogue: { npc: "Bia", turns: [{ npc: "Olá!", options: ["Oi!", "Tchau."], correct: 0 }] },
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

// ── round 3 (lane PTTOOL3, rule 7) ───────────────────────────────────────

test("buildClozeLits: a sentence-initial cloze blank matches the sentence's actual (capitalized) token, not the lowercase canonical surface (R2-L2's Onde/onde mismatch)", () => {
  const s = normalizeSpec({
    lesson: 2, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [{ pt: "onde", en: "where", pos: "adverb" }, { pt: "capital", en: "capital", pos: "noun", imageable: false, imageableReason: "test fixture" }],
    sentences: [{ pt: "onde é a capital?", en: "where is the capital?", roles: ["cloze:onde"], uses: ["onde", "capital"] }],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "Onde é a capital?", en: "Where is the capital?" },
  });
  const [clz] = buildClozeLits(s);
  // emitFragment.mjs will normalize `pt` to "Onde é a capital?" — the
  // blank must already be the literal, capitalized token that appears
  // there, or assemble.mjs's exact `words(pt).indexOf(blank)` fails.
  assert.equal(clz.blank, "Onde");
  assert.ok(clz.options.includes("Onde"), "options must include the exact blank string");
});

test("buildClozeLits: strips trailing punctuation attached to the blank word (R2-L2's cidade, mismatch)", () => {
  const s = normalizeSpec({
    lesson: 2, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [{ pt: "cidade", en: "city", pos: "noun", imageable: false, imageableReason: "test fixture" }, { pt: "grande", en: "big", pos: "adjective" }],
    sentences: [{ pt: "A cidade, é grande.", en: "The city, is big.", roles: ["cloze:cidade"], uses: ["cidade", "grande"] }],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "A cidade é grande.", en: "The city is big." },
  });
  const [clz] = buildClozeLits(s);
  assert.equal(clz.blank, "cidade,");
});

test("buildClozeLits: never offers two options that differ only by case (R2-L2's Onde/de/onde options bug)", () => {
  const s = normalizeSpec({
    lesson: 2, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [
      { pt: "onde", en: "where", pos: "adverb" }, { pt: "de", en: "of", pos: "particle" },
      { pt: "cidade", en: "city", pos: "noun", imageable: false, imageableReason: "test fixture" },
    ],
    sentences: [
      { pt: "onde é a cidade?", en: "where is the city?", roles: ["cloze:onde"], uses: ["onde", "de", "cidade"] },
      { pt: "De onde você é?", en: "Where are you from?", roles: ["listen"], uses: ["onde", "de"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "Onde é a cidade?", en: "Where is the city?" },
  });
  const [clz] = buildClozeLits(s);
  const lower = clz.options.map((o) => o.toLowerCase());
  assert.equal(new Set(lower).size, clz.options.length, `expected no case-only duplicate options, got ${JSON.stringify(clz.options)}`);
});

// ── item 2 (lane PTTOOL5): why never empty or template ───────────────────

test("buildClozeLits: writes the spec-resolved contrastSet why verbatim on every cloze of that pair", () => {
  const s = normalizeSpec({
    lesson: 3, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" }, { pt: "é", en: "is", pos: "verb" },
      { pt: "você", en: "you", pos: "pronoun" },
    ],
    contrast: [{ a: "sou", b: "é", note: "sou is the eu-form of ser; é is the ele/ela/você-form." }],
    contrastSet: [["sou", "é"]],
    sentences: [
      { pt: "Eu sou estudante.", en: "I am a student.", roles: ["cloze:sou"], uses: ["eu", "sou"] },
      { pt: "Você é estudante.", en: "You are a student.", roles: ["cloze:é"], uses: ["você", "é"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "Eu sou estudante.", en: "I am a student." },
  });
  const clozes = buildClozeLits(s);
  assert.equal(clozes.length, 2);
  for (const c of clozes) assert.equal(c.why, "sou is the eu-form of ser; é is the ele/ela/você-form.");
});

test("buildBuildLits: throws naming the smallest fix on a short non-debut sentence", () => {
  const short = normalizeSpec({
    ...JSON.parse(JSON.stringify({ lesson: 1, id: "x", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title" })),
    words: [{ pt: "oi", en: "hi", pos: "interjection" }],
    sentences: [{ pt: "Oi.", en: "Hi.", roles: ["build"], uses: ["oi"] }],
    dialogue: { npc: "Bia", turns: [{ npc: "Olá!", options: ["Oi!", "Tchau."], correct: 0 }] },
    win: { pt: "Oi.", en: "Hi." },
  });
  assert.throws(() => buildBuildLits(short), /smallest fix/);
});
