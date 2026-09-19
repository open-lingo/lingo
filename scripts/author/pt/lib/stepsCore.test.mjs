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

// ── item 3 (lane PTTOOL5): map pairs gloss single tokens, first clause only ─

test("buildMap: glosses a token with only the FIRST clause of a multi-clause meaningEn, never the whole dictionary entry", () => {
  const s = normalizeSpec({
    lesson: 5, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [
      { pt: "eu", en: "I", pos: "pronoun" },
      { pt: "falar", en: "to speak, to talk", pos: "verb" },
      { pt: "de", en: "of / from", pos: "particle" },
    ],
    sentences: [{ pt: "Eu gosto de falar.", en: "I like to talk.", roles: ["build"], uses: ["eu", "falar", "de"] }],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "Eu gosto de falar.", en: "I like to talk." },
  });
  const m = buildMap(s);
  const falarPair = m.pairs.find((p) => p.tokenIndex === m.tokens.findIndex((t) => t.replace(/[.,!?]+$/, "").toLowerCase() === "falar"));
  assert.equal(falarPair.en, "to speak", `expected only the first clause, got "${falarPair.en}"`);
  const dePair = m.pairs.find((p) => p.tokenIndex === m.tokens.findIndex((t) => t.replace(/[.,!?]+$/, "").toLowerCase() === "de"));
  assert.equal(dePair.en, "of", `expected only the first clause, got "${dePair.en}"`);
});

test("buildImageMcqs: only imageable nouns, <= 2, each needs 3 distractors", () => {
  const mcqs = buildImageMcqs(spec, new Map());
  assert.equal(mcqs.length, 1); // only "cidade" is an imageable noun
  assert.equal(mcqs[0].distractors.length, 3);
});

// ── item 4 (lane PTTOOL5): imageMcq distractor pool rules ────────────────

test("buildImageMcqs: distractors never include a proper-noun atom even when it carries an emoji", () => {
  const s = normalizeSpec({
    lesson: 3, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [{ pt: "gato", en: "cat", pos: "noun", emoji: "🐱" }],
    sentences: [{ pt: "Eu tenho um gato.", en: "I have a cat.", roles: ["build"], uses: ["gato"] }],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "Eu tenho um gato.", en: "I have a cat." },
  });
  // "Brasil" is an EARLIER-lesson taught proper noun with its own emoji —
  // it must never be offered as a distractor for a same-lesson noun target.
  const priorVocab = new Map([
    ["Brasil", { surface: "Brasil", meaningEn: "Brazil", emoji: "🇧🇷", partOfSpeech: "proper-noun" }],
    ["casa", { surface: "casa", meaningEn: "house", emoji: "🏠", partOfSpeech: "noun" }],
    ["carro", { surface: "carro", meaningEn: "car", emoji: "🚗", partOfSpeech: "noun" }],
    ["livro", { surface: "livro", meaningEn: "book", emoji: "📖", partOfSpeech: "noun" }],
  ]);
  const [mcq] = buildImageMcqs(s, priorVocab);
  assert.ok(!mcq.distractors.some((d) => d.surface === "Brasil"), "a proper noun must never be an image distractor");
});

test("buildImageMcqs: prefers same-class taught nouns over off-class ones", () => {
  const s = normalizeSpec({
    lesson: 3, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [{ pt: "gato", en: "cat", pos: "noun", emoji: "🐱", class: "animal" }],
    sentences: [{ pt: "Eu tenho um gato.", en: "I have a cat.", roles: ["build"], uses: ["gato"] }],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "Eu tenho um gato.", en: "I have a cat." },
  });
  const priorVocab = new Map([
    // off-class candidates declared FIRST — a position-based (no class
    // logic) picker would exhaust the 3-slot pool on these before ever
    // reaching the same-class ones declared after.
    ["casa", { surface: "casa", meaningEn: "house", emoji: "🏠", partOfSpeech: "noun" }],
    ["carro", { surface: "carro", meaningEn: "car", emoji: "🚗", partOfSpeech: "noun" }],
    ["livro", { surface: "livro", meaningEn: "book", emoji: "📖", partOfSpeech: "noun" }],
    ["cachorro", { surface: "cachorro", meaningEn: "dog", emoji: "🐶", partOfSpeech: "noun", class: "animal" }],
    ["pássaro", { surface: "pássaro", meaningEn: "bird", emoji: "🐦", partOfSpeech: "noun", class: "animal" }],
  ]);
  const [mcq] = buildImageMcqs(s, priorVocab);
  const surfaces = mcq.distractors.map((d) => d.surface);
  assert.ok(surfaces.includes("cachorro") && surfaces.includes("pássaro"), `expected same-class nouns preferred first, got ${JSON.stringify(surfaces)}`);
});

test("buildImageMcqs: distractor pools differ between the lesson's two image steps", () => {
  // Neither target ("amigo", "irmã") is itself a member of the curated
  // fallback pool, so a naive implementation's own self-exclusion can't
  // accidentally shift the two windows apart — this isolates the actual
  // "pools must differ" rule from that unrelated side effect.
  const s = normalizeSpec({
    lesson: 1, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [
      { pt: "amigo", en: "friend", pos: "noun", emoji: "🧑‍🤝‍🧑" },
      { pt: "irmã", en: "sister", pos: "noun", emoji: "👧" },
    ],
    sentences: [
      { pt: "Eu tenho um amigo.", en: "I have a friend.", roles: ["build"], uses: ["amigo"] },
      { pt: "Eu tenho uma irmã.", en: "I have a sister.", roles: ["build"], uses: ["irmã"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "Eu tenho um gato.", en: "I have a cat." },
  });
  // No priorVocab at all — both steps must fall back to the curated pool,
  // and must still not draw the SAME 3-distractor pool (the m1-L1-style
  // bootstrap situation PTGRADE3 found producing identical pools).
  const [img1, img2] = buildImageMcqs(s, new Map());
  const set1 = img1.distractors.map((d) => d.surface).sort().join(",");
  const set2 = img2.distractors.map((d) => d.surface).sort().join(",");
  assert.notEqual(set1, set2, `expected the two image steps' distractor pools to differ, both got [${set1}]`);
});

test("buildImageMcqs: falls back to the curated pool and prints an INFO line naming the target when fewer than 3 taught nouns qualify", () => {
  const s = normalizeSpec({
    lesson: 1, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [{ pt: "gato", en: "cat", pos: "noun", emoji: "🐱" }],
    sentences: [{ pt: "Eu tenho um gato.", en: "I have a cat.", roles: ["build"], uses: ["gato"] }],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "Eu tenho um gato.", en: "I have a cat." },
  });
  const logs = [];
  const origLog = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    buildImageMcqs(s, new Map());
  } finally {
    console.log = origLog;
  }
  assert.ok(logs.some((l) => l.includes("gato") && /INFO|fallback|fall back/i.test(l)), `expected an INFO fallback log mentioning "gato", got: ${JSON.stringify(logs)}`);
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
