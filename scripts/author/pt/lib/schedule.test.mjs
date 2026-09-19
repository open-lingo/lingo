import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";
import { buildCandidateSteps } from "./steps.mjs";
import { scheduleSteps } from "./schedule.mjs";

test("scheduleSteps: never places two adjacent same-kind steps", () => {
  const spec = normalizeSpec({
    lesson: 1, id: "x", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title",
    words: [
      { pt: "casa", en: "house", pos: "noun", emoji: "🏠" },
      { pt: "gato", en: "cat", pos: "noun", emoji: "🐱" },
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" },
      { pt: "de", en: "of", pos: "particle" }, { pt: "aqui", en: "here", pos: "adverb" },
    ],
    sentences: [
      { pt: "Eu sou de aqui.", en: "I am from here.", roles: ["listen", "cloze:sou"], uses: ["eu", "sou", "de", "aqui"] },
      { pt: "Eu sou de casa.", en: "I am from home.", roles: ["cloze:de"], uses: ["eu", "sou", "de", "casa"] },
      { pt: "Eu sou de casa aqui.", en: "I am here at home.", roles: ["build", "debut"], uses: ["eu", "sou", "de", "casa", "aqui"] },
      { pt: "Eu sou de gato aqui.", en: "I am of cat here.", roles: ["listen", "cloze:gato"], uses: ["eu", "sou", "de", "gato", "aqui"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes.", options: ["Sou, sou daqui.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou de casa.", en: "I am from home." },
  });
  const steps = scheduleSteps(buildCandidateSteps(spec, new Map()), spec);
  // Two adjacent `phrase` cards are the one documented exception
  // (checkAdjacency's own comment: a rescued debut pair, never a
  // monotonous selection-only run since `phrase` isn't one).
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].kind === "phrase" && steps[i - 1].kind === "phrase") continue;
    assert.notEqual(steps[i].kind, steps[i - 1].kind, `adjacent ${steps[i].kind} at ${i}`);
  }
  assert.equal(steps.at(-3).kind, "sim");
  assert.equal(steps.at(-2).kind, "matchLit");
  assert.equal(steps.at(-1).kind, "speakLit");
});

test("scheduleSteps: throws naming the smallest fix when an atom is under the answer floor", () => {
  // Same shape as the adjacency fixture (healthy step count), but "gato"
  // loses its extra `cloze:gato` role — down to 2 credits (listen + its
  // own imageMcq), one short of the >= 3 floor.
  const spec = normalizeSpec({
    lesson: 1, id: "x", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title",
    // "gato" carries NO emoji here (unlike the adjacency fixture) — this
    // strips its imageMcq credit and, together with a sim whose correct
    // reply never mentions it, leaves it under the floor even though
    // matchLit/sim now also credit answer positions (see `creditedAtoms`).
    // "gato" is LAST in the word list — the old (unchanged) same-POS-blank
    // fallback pads a paradigm-free cloze's options from the first N
    // words of the list (excluding the blank); putting "gato" last keeps
    // it out of that padding window so it doesn't pick up an incidental
    // early (non-debuting) mention that would trip the new debut-guarantee
    // rescue and add it an extra, unintended answer-floor credit.
    words: [
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" },
      { pt: "de", en: "of", pos: "particle" }, { pt: "aqui", en: "here", pos: "adverb" },
      { pt: "casa", en: "house", pos: "noun", emoji: "🏠" },
      { pt: "gato", en: "cat", pos: "noun", imageable: false, imageableReason: "test fixture" },
    ],
    sentences: [
      { pt: "Eu sou de aqui.", en: "I am from here.", roles: ["listen", "cloze:sou"], uses: ["eu", "sou", "de", "aqui"] },
      { pt: "Eu sou de casa.", en: "I am from home.", roles: ["cloze:de"], uses: ["eu", "sou", "de", "casa"] },
      { pt: "Eu sou de casa aqui.", en: "I am here at home.", roles: ["build", "debut"], uses: ["eu", "sou", "de", "casa", "aqui"] },
      { pt: "Eu sou de gato aqui.", en: "I am of cat here.", roles: ["listen"], uses: ["eu", "sou", "de", "gato", "aqui"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes.", options: ["Sou, sou daqui.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou de casa.", en: "I am from home." },
  });
  assert.throws(() => scheduleSteps(buildCandidateSteps(spec, new Map()), spec), /answer position/);
});

test("scheduleSteps: checkpoint: true ends on the sim (not sim -> matchLit -> speakLit)", () => {
  const spec = normalizeSpec({
    lesson: 6, id: "x", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title", checkpoint: true,
    words: [
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" },
      { pt: "de", en: "of", pos: "particle" }, { pt: "aqui", en: "here", pos: "adverb" },
      { pt: "casa", en: "house", pos: "noun", imageable: false, imageableReason: "test fixture" }, { pt: "gato", en: "cat", pos: "noun", imageable: false, imageableReason: "test fixture" },
    ],
    sentences: [
      { pt: "Eu sou de aqui e gosto de casa.", en: "I am from here and I like home.", roles: ["build"], uses: ["eu", "sou", "de", "aqui"] },
      { pt: "Eu sou de casa.", en: "I am from home.", roles: ["listen"], uses: ["eu", "sou", "de", "casa"] },
      { pt: "Eu sou de casa e gosto daqui.", en: "I am from home and I like it here.", roles: ["build"], uses: ["eu", "sou", "de", "casa", "aqui"] },
      { pt: "Eu sou de gato aqui.", en: "I am of cat here.", roles: ["listen"], uses: ["eu", "sou", "de", "gato", "aqui"] },
      { pt: "Eu sou de casa e de gato.", en: "I am from home and from cat.", roles: ["build"], uses: ["eu", "sou", "de", "casa", "gato"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes.", options: ["Sou, sou daqui.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou de casa.", en: "I am from home." },
  });
  const steps = scheduleSteps(buildCandidateSteps(spec, new Map()), spec);
  assert.equal(steps.at(-1).kind, "sim", "checkpoint must end on the sim");
  assert.equal(steps.at(-2).kind, "speakLit");
  assert.equal(steps.at(-3).kind, "matchLit");
});

test("scheduleSteps: checkpoint: true forbids a new-atom debut via imageMcq", () => {
  const spec = normalizeSpec({
    lesson: 6, id: "x", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title", checkpoint: true,
    words: [
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" },
      { pt: "de", en: "of", pos: "particle" }, { pt: "aqui", en: "here", pos: "adverb" },
      { pt: "casa", en: "house", pos: "noun", emoji: "🏠" }, { pt: "gato", en: "cat", pos: "noun", imageable: false, imageableReason: "test fixture" },
    ],
    sentences: [
      { pt: "Eu sou de aqui.", en: "I am from here.", roles: ["listen"], uses: ["eu", "sou", "de", "aqui"] },
      { pt: "Eu sou de casa.", en: "I am from home.", roles: ["listen"], uses: ["eu", "sou", "de", "casa"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes.", options: ["Sou, sou daqui.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou de casa.", en: "I am from home." },
  });
  assert.throws(() => scheduleSteps(buildCandidateSteps(spec, new Map()), spec), /imageMcq/);
});

test("scheduleSteps: rejects a too-small spec with a named smallest fix (match-floor fires first)", () => {
  // A single word/sentence trips the match-pair floor before it could ever
  // reach the step-count band — "most useful message first" ordering,
  // same doctrine `compile-ir-pt.mjs`'s own validation uses.
  const spec = normalizeSpec({
    lesson: 1, id: "x", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title",
    words: [{ pt: "oi", en: "hi", pos: "interjection" }],
    sentences: [{ pt: "Oi, oi, oi, oi, oi.", en: "Hi.", roles: ["listen"], uses: ["oi"] }],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["Oi!", "Tchau."], correct: 0 }] },
    win: { pt: "Oi, oi, oi, oi, oi.", en: "Hi." },
  });
  assert.throws(() => scheduleSteps(buildCandidateSteps(spec, new Map()), spec), /smallest fix/);
});

// ── round 2 (lane PTTOOL2) ───────────────────────────────────────────────

test("scheduleSteps: a contraction-forced cloze never carries a co-listed atom's debut — a phrase is auto-inserted first", () => {
  // "do" is a PT_CONTRACTIONS member; the sentence is tagged "build" so it
  // gets force-redirected to clozeLit (finding 1b) — "cidade" is co-listed
  // in the SAME sentence and has NO other candidate anywhere else in the
  // spec, so without the auto-phrase-debut fix its first (and only)
  // printed appearance would be inside that clozeLit, which is NOT an
  // intro-capable kind.
  const spec = normalizeSpec({
    lesson: 1, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" },
      { pt: "do", en: "of the", pos: "particle" }, { pt: "cidade", en: "city", pos: "noun", imageable: false, imageableReason: "test fixture" },
      { pt: "aqui", en: "here", pos: "adverb" }, { pt: "casa", en: "house", pos: "noun", imageable: false, imageableReason: "test fixture" },
    ],
    sentences: [
      { pt: "Eu sou da cidade do centro.", en: "I am from the downtown city.", roles: ["build"], uses: ["eu", "sou", "do", "cidade"] },
      { pt: "Eu sou daqui muito feliz.", en: "I am from here, very happy.", roles: ["listen"], uses: ["eu", "sou", "aqui"] },
      { pt: "Eu sou de casa aqui.", en: "I am from home here.", roles: ["build", "debut"], uses: ["eu", "sou", "casa", "aqui"] },
      { pt: "Eu sou muito feliz em casa.", en: "I am very happy at home.", roles: ["listen"], uses: ["eu", "sou", "casa"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes.", options: ["Sou, sou daqui.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou de casa aqui.", en: "I am from home here." },
  });
  const steps = scheduleSteps(buildCandidateSteps(spec, new Map()), spec);
  const countable = steps.filter((s) => s.kind !== "map");
  const printedWordsOf = (s) => new Set((s.pt ?? s.text ?? "").toLowerCase().split(/[^\p{L}]+/u).filter(Boolean));
  const first = countable.find((s) => printedWordsOf(s).has("cidade"));
  assert.ok(first, "cidade must be printed somewhere");
  assert.equal(first.kind, "phrase", `expected an auto-inserted phrase debut, got "${first.kind}"`);
});

test("scheduleSteps: a second, independent orphan (not sharing the first's target) also gets rescued without disturbing it", () => {
  // Regression guard for the general case behind the two tests above:
  // TWO atoms each need a synthesized debut, but at DIFFERENT targets —
  // must not interfere with each other (unlike the same-target case,
  // which needs the checkAdjacency phrase exemption).
  const spec = normalizeSpec({
    lesson: 2, id: "x", title: "T", grammar: "g", info: "info body about the grammar point only", infoTitle: "Info",
    words: [
      { pt: "de", en: "of / from", pos: "particle" }, { pt: "onde", en: "where", pos: "adverb" },
      { pt: "do", en: "of the (m)", pos: "particle" }, { pt: "cidade", en: "city", pos: "noun", imageable: false, imageableReason: "test fixture" },
      { pt: "país", en: "country", pos: "noun", imageable: false, imageableReason: "test fixture" }, { pt: "aqui", en: "here", pos: "adverb" },
    ],
    sentences: [
      { pt: "De onde você é hoje?", en: "Where are you from today?", roles: ["listen", "debut"], uses: ["de", "onde"] },
      { pt: "Eu sou do centro da cidade.", en: "I am from downtown the city.", roles: ["build"], uses: ["eu", "sou", "do", "cidade"] },
      { pt: "De onde é o Pedro agora?", en: "Where is Pedro from now?", roles: ["listen"], uses: ["de", "onde"] },
      { pt: "Eu gosto muito do país e daqui.", en: "I like the country and here a lot.", roles: ["build", "debut"], uses: ["país", "do", "aqui"] },
      { pt: "De onde é a Bia mesmo?", en: "Where is Bia really from?", roles: ["listen"], uses: ["de", "onde"] },
      { pt: "Eu moro do lado do país agora.", en: "I live next to the country now.", roles: ["cloze:do"], uses: ["do"] },
      { pt: "Eu moro aqui perto da cidade.", en: "I live here near the city.", roles: ["build", "debut"], uses: ["aqui", "cidade"] },
    ],
    recall: ["eu", "sou"],
    dialogue: { npc: "Pedro", turns: [{ npc: "De onde você é?", gloss: "Where are you from?", goal: "Say here.", options: ["Sou daqui.", "Sou gato."], correct: 0 }] },
    win: { pt: "Eu sou do Brasil, e você?", en: "I am from Brazil, and you?" },
  });
  const steps = scheduleSteps(buildCandidateSteps(spec, new Map()), spec);
  const countable = steps.filter((s) => s.kind !== "map");
  const printedWordsOf = (s) => new Set((s.pt ?? s.text ?? "").toLowerCase().split(/[^\p{L}]+/u).filter(Boolean));
  const INTRO = new Set(["info", "phrase", "speakLit", "buildLit", "listenCompLit", "imageMcq"]);
  for (const w of spec.words) {
    const first = countable.find((s) => printedWordsOf(s).has(w.pt.toLowerCase()));
    assert.ok(first, `${w.pt} must be printed somewhere`);
    assert.ok(INTRO.has(first.kind), `${w.pt} first printed on non-intro-capable "${first.kind}"`);
  }
});

// ── round 3 (lane PTTOOL3, rule 5) ───────────────────────────────────────

test("scheduleSteps: checkpoint auto-tops-up a contrastSet from an already-authored recall sentence (R2-L6 dropped its contrastSet instead)", () => {
  const spec = normalizeSpec({
    lesson: 6, id: "x", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title", checkpoint: true,
    words: [
      { pt: "de", en: "of", pos: "particle" }, { pt: "aqui", en: "here", pos: "adverb" },
      { pt: "casa", en: "house", pos: "noun", imageable: false, imageableReason: "test fixture" },
      { pt: "gato", en: "cat", pos: "noun", imageable: false, imageableReason: "test fixture" },
    ],
    recall: ["eu", "sou", "é"],
    contrastSet: [["sou", "é"]],
    sentences: [
      { pt: "Eu sou de aqui.", en: "I am from here.", roles: ["cloze:sou"], uses: ["eu", "sou", "de", "aqui"] },
      { pt: "Você é de casa.", en: "You are from home.", roles: ["listen"], uses: ["eu", "é", "de", "casa"] },
      { pt: "Eu sou de gato aqui.", en: "I am of cat here.", roles: ["build"], uses: ["eu", "sou", "de", "gato", "aqui"] },
      { pt: "Eu sou de casa e de gato.", en: "I am from home and from cat.", roles: ["listen"], uses: ["eu", "sou", "de", "casa", "gato"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes.", options: ["Sou, sou daqui.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou de casa.", en: "I am from home." },
  });
  // matchLit needs >= 6 pairs; pad from priorVocab (not spec.words) so the
  // padding entries never need their own answer-floor credit.
  const priorVocab = new Map([
    ["olá", { surface: "olá", meaningEn: "hello" }],
    ["você", { surface: "você", meaningEn: "you" }],
  ]);
  const steps = scheduleSteps(buildCandidateSteps(spec, priorVocab), spec);
  const want = new Set(["sou", "é"]);
  const hits = steps.filter((s) => s.kind === "clozeLit" && s.options.length === want.size && s.options.every((o) => want.has(o)));
  assert.equal(hits.length, 2, "expected the auto-added cloze on \"é\" to bring coverage to 2");
  assert.ok(hits.some((s) => s.blank === "é"), "the auto-added cloze should blank the previously-uncovered member");
});

test("scheduleSteps: checkpoint contrastSet auto-cover throws naming the missing member when no spare sentence exists", () => {
  const spec = normalizeSpec({
    lesson: 6, id: "x", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title", checkpoint: true,
    words: [
      { pt: "de", en: "of", pos: "particle" }, { pt: "aqui", en: "here", pos: "adverb" },
      { pt: "hoje", en: "today", pos: "adverb" }, { pt: "bem", en: "well", pos: "adverb" },
      { pt: "muito", en: "very", pos: "adverb" }, { pt: "com", en: "with", pos: "particle" },
    ],
    recall: ["eu", "sou", "é"],
    contrastSet: [["sou", "é"]],
    sentences: [
      { pt: "Eu sou de aqui.", en: "I am from here.", roles: ["cloze:sou"], uses: ["eu", "sou", "de", "aqui"] },
      { pt: "Eu sou muito bem hoje.", en: "I am very well today.", roles: ["listen"], uses: ["eu", "sou", "de", "hoje", "bem", "muito"] },
      { pt: "Eu sou aqui com você.", en: "I am here with you.", roles: ["build"], uses: ["eu", "sou", "aqui", "com"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes.", options: ["Sou, sou daqui.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou de aqui.", en: "I am from here." },
  });
  assert.throws(() => scheduleSteps(buildCandidateSteps(spec, new Map()), spec), /"é"/);
});

test("scheduleSteps: contrastSet must appear complete in >= 2 clozeLit steps", () => {
  const spec = normalizeSpec({
    lesson: 1, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" },
      { pt: "é", en: "is/are", pos: "verb" }, { pt: "de", en: "of", pos: "particle" },
      { pt: "casa", en: "house", pos: "noun", imageable: false, imageableReason: "test fixture" }, { pt: "gato", en: "cat", pos: "noun", imageable: false, imageableReason: "test fixture" },
    ],
    contrastSet: [["sou", "é"]],
    sentences: [
      { pt: "Eu sou de casa hoje.", en: "I am from home today.", roles: ["cloze:sou", "debut"], uses: ["eu", "sou", "de", "casa"] },
      { pt: "Você é de casa hoje.", en: "You are from home today.", roles: ["listen"], uses: ["eu", "é", "de", "casa"] },
      { pt: "Eu sou de gato aqui.", en: "I am of cat here.", roles: ["build", "listen"], uses: ["eu", "sou", "de", "gato"] },
      { pt: "Você é de gato aqui.", en: "You are of cat here.", roles: ["build", "listen"], uses: ["eu", "é", "de", "gato"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes.", options: ["Sou, sou daqui.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou de casa.", en: "I am from home." },
  });
  assert.throws(() => scheduleSteps(buildCandidateSteps(spec, new Map()), spec), /contrastSet/);
});
