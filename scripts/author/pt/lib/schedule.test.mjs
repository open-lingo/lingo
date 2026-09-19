import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpec } from "./spec.mjs";
import { buildCandidateSteps } from "./steps.mjs";
import { scheduleSteps, checkListenCompLitCap, checkDistractorsEnNotNearbyAnswers, checkMaxRunLength, checkDebutIntroCapable, fixDistractorsEnNearbyAnswers } from "./schedule.mjs";

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

// ── item 6 (lane PTTOOL5): step mix ───────────────────────────────────────

test("checkListenCompLitCap: throws when > 3 listenCompLit steps", () => {
  const steps = [1, 2, 3, 4].map((i) => ({ id: `lst-${i}`, kind: "listenCompLit" }));
  assert.throws(() => checkListenCompLitCap(steps), /listenCompLit/);
});

test("checkListenCompLitCap: passes at exactly 3", () => {
  const steps = [1, 2, 3].map((i) => ({ id: `lst-${i}`, kind: "listenCompLit" }));
  assert.doesNotThrow(() => checkListenCompLitCap(steps));
});

test("checkMaxRunLength: throws when a non-phrase kind repeats 3 times in a row", () => {
  const steps = [{ id: "c1", kind: "clozeLit" }, { id: "c2", kind: "clozeLit" }, { id: "c3", kind: "clozeLit" }];
  assert.throws(() => checkMaxRunLength(steps), /clozeLit/);
});

test("checkMaxRunLength: two phrase cards in a row is the documented rescued-debut exception, not an error", () => {
  const steps = [{ id: "p1", kind: "phrase" }, { id: "p2", kind: "phrase" }, { id: "m", kind: "map" }];
  assert.doesNotThrow(() => checkMaxRunLength(steps));
});

test("checkDistractorsEnNotNearbyAnswers: throws when a distractorsEn value equals a nearby step's answer (within 3 positions)", () => {
  const steps = [
    { id: "a", kind: "buildLit", en: "You have a family and a cat." },
    { id: "b", kind: "clozeLit", en: "x" },
    { id: "lst-2", kind: "listenCompLit", en: "y", distractorsEn: ["You have a family and a cat.", "z", "w"] },
  ];
  assert.throws(() => checkDistractorsEnNotNearbyAnswers(steps), /lst-2/);
});

test("checkDistractorsEnNotNearbyAnswers: passes when the matching answer is farther than 3 positions away", () => {
  const steps = [
    { id: "a", kind: "buildLit", en: "far answer" },
    { id: "b", kind: "clozeLit", en: "x1" },
    { id: "c", kind: "clozeLit", en: "x2" },
    { id: "d", kind: "clozeLit", en: "x3" },
    { id: "e", kind: "clozeLit", en: "x4" },
    { id: "lst-2", kind: "listenCompLit", en: "y", distractorsEn: ["far answer", "z", "w"] },
  ];
  assert.doesNotThrow(() => checkDistractorsEnNotNearbyAnswers(steps));
});

test("fixDistractorsEnNearbyAnswers: never introduces a duplicate distractor within one step's own distractorsEn (PROVE-run regression: two different colliding slots must not both pick the SAME single available replacement)", () => {
  const steps = [
    { id: "far", kind: "x", en: "replacement-1" }, // outside the +-3 window, the only valid replacement
    { id: "p1", kind: "x", en: "pad1" },
    { id: "p2", kind: "x", en: "pad2" },
    { id: "p3", kind: "x", en: "pad3" },
    { id: "lst-2", kind: "listenCompLit", en: "lst-2-answer", distractorsEn: ["collide-A", "collide-B", "spare"] },
    { id: "a", kind: "buildLit", en: "collide-A" },
    { id: "b", kind: "buildLit", en: "collide-B" },
  ];
  fixDistractorsEnNearbyAnswers(steps);
  const ds = steps[4].distractorsEn;
  assert.equal(new Set(ds).size, ds.length, `distractorsEn must have no internal duplicate after repair, got ${JSON.stringify(ds)}`);
});

// ── item 7 (lane PTTOOL5): no identical pt on adjacent steps ─────────────

test("scheduleSteps: never places two adjacent steps with the identical literal pt (a sentence tagged both listen + cloze must not schedule its listenCompLit directly next to its own clozeLit)", () => {
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
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].pt && steps[i - 1].pt) {
      assert.notEqual(steps[i].pt, steps[i - 1].pt, `adjacent steps "${steps[i - 1].id}"/"${steps[i].id}" share the identical pt "${steps[i].pt}"`);
    }
  }
});

// ── item 8 (lane PTTOOL5): debut must be an intro-capable step ───────────

test("checkDebutIntroCapable: throws naming the word when its first printed appearance is a graded, non-intro-capable step", () => {
  const words = [{ pt: "pizza", en: "pizza" }];
  const steps = [
    { id: "map", kind: "map", tokens: [] },
    { id: "clz-1", kind: "clozeLit", pt: "Eu gosto de pizza.", blank: "pizza", options: ["pizza", "filme"] },
  ];
  assert.throws(() => checkDebutIntroCapable(steps, words), /pizza/);
});

test("checkDebutIntroCapable: passes when the word debuts on an intro-capable step (e.g. buildLit) before any graded appearance", () => {
  const words = [{ pt: "pizza", en: "pizza" }];
  const steps = [
    { id: "map", kind: "map", tokens: [] },
    { id: "bld-1", kind: "buildLit", pt: "Eu gosto de pizza." },
    { id: "clz-1", kind: "clozeLit", pt: "Eu gosto de pizza.", blank: "pizza", options: ["pizza", "filme"] },
  ];
  assert.doesNotThrow(() => checkDebutIntroCapable(steps, words));
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
    dialogue: { npc: "Pedro", turns: [{ npc: "Você é daqui?", gloss: "Are you from here?", goal: "Say yes, here.", options: ["Sou daqui.", "Sou gato."], correct: 0 }] },
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
    contrastSet: [{ set: ["sou", "é"], why: "sou is the eu-form of ser; é is the ele/ela/você-form — they never swap." }],
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
    contrastSet: [{ set: ["sou", "é"], why: "sou is the eu-form of ser; é is the ele/ela/você-form — they never swap." }],
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

// ── round 3 (lane PTTOOL3, rule 6) ───────────────────────────────────────

test("scheduleSteps: a build+debut sentence containing a contraction is still cloze-only, and its co-listed atoms still get a real debut without re-wording (R2-L1 had to re-word this shape)", () => {
  // "debut" is meant to waive buildLit's tile floor — irrelevant here,
  // since a contraction-bearing sentence never reaches buildBuildLits at
  // all (design doc §3: contractions are cloze-only, even tagged "build").
  // The real question this test pins: does tagging the sentence "debut"
  // on top of a contraction ever throw, produce a buildLit, or strand the
  // sentence's OTHER (non-contraction) atom without an intro-capable
  // first appearance — the exact shape R2-L1 apparently had to avoid by
  // hand instead of the generator handling it.
  const spec = normalizeSpec({
    lesson: 2, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" },
      { pt: "do", en: "of the", pos: "particle" },
      { pt: "país", en: "country", pos: "noun", imageable: false, imageableReason: "test fixture" },
      { pt: "aqui", en: "here", pos: "adverb" },
    ],
    sentences: [
      { pt: "Eu sou do país aqui.", en: "I am of the country here.", roles: ["build", "debut"], uses: ["eu", "sou", "do", "país"] },
      { pt: "Eu sou muito feliz aqui.", en: "I am very happy here.", roles: ["speak"], uses: ["eu", "sou", "aqui"] },
      { pt: "Eu sou daqui, sim.", en: "I am from here, yes.", roles: ["listen"], uses: ["eu", "sou", "aqui"] },
    ],
    dialogue: { npc: "Bia", turns: [{ npc: "Você é do país?", gloss: "Are you from the country?", goal: "Say yes.", options: ["Sou, sou do país.", "Eu sou gato."], correct: 0 }] },
    win: { pt: "Eu sou do país aqui.", en: "I am of the country here." },
  });
  // matchLit needs >= 6 pairs (5 words here); pad the 6th from priorVocab.
  const priorVocab = new Map([["olá", { surface: "olá", meaningEn: "hello" }]]);
  const steps = scheduleSteps(buildCandidateSteps(spec, priorVocab), spec);
  assert.ok(!steps.some((s) => s.kind === "buildLit" && s.pt === "Eu sou do país aqui."), "the contraction sentence must never become a buildLit");
  assert.ok(steps.some((s) => s.kind === "clozeLit" && s.blank === "do"), "it must become a clozeLit blanking the contraction");
  const countable = steps.filter((s) => s.kind !== "map");
  const printedWordsOf = (s) => new Set((s.pt ?? s.text ?? "").toLowerCase().split(/[^\p{L}]+/u).filter(Boolean));
  const INTRO = new Set(["info", "phrase", "speakLit", "buildLit", "listenCompLit", "imageMcq"]);
  const firstPais = countable.find((s) => printedWordsOf(s).has("país"));
  assert.ok(firstPais && INTRO.has(firstPais.kind), `"país" (co-listed with the contraction) must still debut on an intro-capable step, got "${firstPais?.kind}"`);
});

test("scheduleSteps: contrastSet must appear complete in >= 2 clozeLit steps", () => {
  const spec = normalizeSpec({
    lesson: 1, id: "x", title: "T", grammar: "g", info: "info body", infoTitle: "Info",
    words: [
      { pt: "eu", en: "I", pos: "pronoun" }, { pt: "sou", en: "I am", pos: "verb" },
      { pt: "é", en: "is/are", pos: "verb" }, { pt: "de", en: "of", pos: "particle" },
      { pt: "casa", en: "house", pos: "noun", imageable: false, imageableReason: "test fixture" }, { pt: "gato", en: "cat", pos: "noun", imageable: false, imageableReason: "test fixture" },
    ],
    contrastSet: [{ set: ["sou", "é"], why: "sou is the eu-form of ser; é is the ele/ela/você-form — they never swap." }],
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

// H-arm L5 (2026-09-19): two listenCompLit steps whose nearby-answer
// collisions resolve to the SAME first free pool entries ended with an
// identical distractor SET, which checkListenDistractorsDistinct then threw
// on — a writing lane cannot fix that by editing sentences. The repair must
// pull them apart itself.
test("fixDistractorsEnNearbyAnswers: two listen steps never keep the same distractor set", () => {
  const mk = (id, kind, en, distractorsEn) => ({ id, kind, en, pt: en, distractorsEn });
  const b = (i, en) => mk(`b${i}`, "buildLit", en, undefined);
  const steps = [
    b(0, "A"), b(1, "B"), b(2, "C"),
    mk("lst-1", "listenCompLit", "X", ["A", "B", "K"]),
    mk("lst-2", "listenCompLit", "Y", ["A", "B", "K"]),
    b(5, "D"), b(6, "E"), b(7, "A"), b(8, "F"), b(9, "G"), b(10, "H"), b(11, "I"),
  ];
  fixDistractorsEnNearbyAnswers(steps);
  const key = (s) => [...s.distractorsEn].sort().join("|");
  assert.notEqual(key(steps[3]), key(steps[4]));
  for (const s of [steps[3], steps[4]]) {
    assert.equal(s.distractorsEn.length, 3);
    assert.ok(!s.distractorsEn.includes(s.en));
  }
});
