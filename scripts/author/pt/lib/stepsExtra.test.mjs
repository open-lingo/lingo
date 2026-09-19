import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";
import { buildSpeaks, buildContrastSteps, buildPatternSteps, buildConjugationClozes, buildPhraseDebut, buildInfinitiveCloze } from "./stepsExtra.mjs";

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

test("buildContrastSteps: textMcq target/distractors — the pair partner first, padded to >= 3 with content words", () => {
  const spec = normalizeSpec({ ...base, contrast: [{ a: "sou", b: "é", note: "1st vs 2nd/3rd person" }] });
  const prior = new Map([
    ["tenho", { surface: "tenho", meaningEn: "I have", partOfSpeech: "verb" }],
    ["tem", { surface: "tem", meaningEn: "have", partOfSpeech: "verb" }],
  ]);
  const out = buildContrastSteps(spec, prior);
  assert.equal(out.length, 1);
  assert.equal(out[0].kind, "textMcq");
  assert.equal(out[0].target, "sou");
  assert.ok(out[0].distractors.includes("é"));
  // 2026-09-19: runtime vocabTextMcq needs >= 3 distinct distractors; the pair partner comes first, then same-POS, then content words.
  assert.equal(out[0].distractors[0], "é");
  assert.ok(out[0].distractors.length >= 3, `expected >= 3 distractors, got ${JSON.stringify(out[0].distractors)}`);
  assert.equal(new Set(out[0].distractors.map((d) => d.toLowerCase())).size, out[0].distractors.length);
});

// ── item 5 (lane PTTOOL5): textMcq prompt is never the rule paragraph ────

test("buildContrastSteps: prompt is a real sentence with the target blanked, never the contrast[].note rule paragraph", () => {
  const spec = normalizeSpec({
    ...base,
    sentences: [...base.sentences, { pt: "Eu sou estudante e você é professor.", en: "I am a student and you are a teacher.", roles: ["listen"], uses: ["sou", "é"] }],
    contrast: [{ a: "sou", b: "é", note: "Sou is used for I (1st person singular); é is used for you/he/she/it (2nd/3rd person singular) — this is one of the two irregular present-tense forms of ser that Brazilian learners must memorize early." }],
  });
  const [step] = buildContrastSteps(spec, new Map());
  assert.notEqual(step.prompt, spec.contrast[0].note);
  assert.ok(step.prompt.includes("___"), `expected a blanked prompt, got "${step.prompt}"`);
  assert.ok(!step.prompt.toLowerCase().includes("sou"), `the target itself must not still appear in its own blanked prompt: "${step.prompt}"`);
});

test("buildContrastSteps: falls back to a generic prompt when no spec sentence uses the target", () => {
  const spec = normalizeSpec({
    ...base,
    sentences: [{ pt: "Você é professor.", en: "You are a teacher.", roles: ["listen"], uses: ["é"] }], // no sentence uses "sou"
    contrast: [{ a: "sou", b: "é", note: "1st vs 2nd/3rd person, a real distinction worth more than 25 characters" }],
  });
  const [step] = buildContrastSteps(spec, new Map());
  assert.equal(step.prompt, `Which form goes with "eu"?`);
});

test("buildContrastSteps: distractors never include junk like olá/eu/sim even when present in priorVocab", () => {
  const spec = normalizeSpec({ ...base, contrast: [{ a: "sou", b: "é", note: "1st vs 2nd/3rd person, a real distinction worth more than 25 characters" }] });
  const prior = new Map([
    ["olá", { surface: "olá", meaningEn: "hello", partOfSpeech: "interjection" }],
    ["eu", { surface: "eu", meaningEn: "I", partOfSpeech: "pronoun" }],
    ["sim", { surface: "sim", meaningEn: "yes", partOfSpeech: "adverb" }],
  ]);
  const [step] = buildContrastSteps(spec, prior);
  for (const junk of ["olá", "eu", "sim"]) assert.ok(!step.distractors.includes(junk), `distractors must never include "${junk}"`);
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

// ── item 1 (lane PTTOOL5): no bare-form phrase cards ─────────────────────

test("buildPhraseDebut: debuts a full sentence (shortest >= 3 words) that uses the word, glossed with THAT sentence's en — never a bare one-word card", () => {
  const word = { pt: "do", en: "of the" };
  const spec = normalizeSpec({
    ...base,
    words: [...base.words, { pt: "do", en: "of the", pos: "particle" }],
    sentences: [
      ...base.sentences,
      { pt: "Eu sou do Brasil e da França.", en: "I am from Brazil and from France.", roles: ["build"], uses: ["sou", "do"] },
      { pt: "Eu sou do Brasil.", en: "I am from Brazil.", roles: ["build"], uses: ["sou", "do"] },
    ],
  });
  const step = buildPhraseDebut(word, 2.5, spec);
  assert.equal(step.kind, "phrase");
  assert.equal(step.text, "Eu sou do Brasil."); // the shorter of the two qualifying sentences
  assert.equal(step.meaning, "I am from Brazil."); // that sentence's own en, not word.en
  assert.ok(step.text.trim().split(/\s+/).length >= 3, "debut card must not be a bare one-word form");
  assert.equal(step._ord, 2.5);
  assert.deepEqual(step.atoms, ["do"]);
});

test("buildPhraseDebut: throws naming the form when no sentence of >= 3 words uses it", () => {
  const word = { pt: "do", en: "of the" };
  const spec = normalizeSpec({ ...base }); // no sentence anywhere uses "do"
  assert.throws(() => buildPhraseDebut(word, 1, spec), /do/);
});

// ── item 9c (lane PTTOOL5): >= 3 infinitives -> one -ar/-er/-ir cloze ────

test("buildInfinitiveCloze: emits one clozeLit blanking an infinitive, options = every infinitive in words:, when >= 3 are present", () => {
  const spec = normalizeSpec({
    ...base,
    words: [
      ...base.words,
      { pt: "falar", en: "to speak", pos: "verb" },
      { pt: "comer", en: "to eat", pos: "verb" },
      { pt: "assistir", en: "to watch", pos: "verb" },
    ],
    sentences: [...base.sentences, { pt: "Eu gosto de falar com você.", en: "I like talking with you.", roles: ["build"], uses: ["sou", "falar"] }],
  });
  const step = buildInfinitiveCloze(spec);
  assert.ok(step, "expected an infinitive cloze");
  assert.equal(step.kind, "clozeLit");
  assert.deepEqual(new Set(step.options), new Set(["falar", "comer", "assistir"]));
  assert.ok(["falar", "comer", "assistir"].includes(step.blank));
});

test("buildInfinitiveCloze: returns null when fewer than 3 infinitives are in words:", () => {
  const spec = normalizeSpec({
    ...base,
    words: [...base.words, { pt: "falar", en: "to speak", pos: "verb" }, { pt: "comer", en: "to eat", pos: "verb" }],
  });
  assert.equal(buildInfinitiveCloze(spec), null);
});
