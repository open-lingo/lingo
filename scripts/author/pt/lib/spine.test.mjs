import test from "node:test";
import assert from "node:assert/strict";
import { inheritFromSpine, findSpineLesson, nearestSpineIds, checkPayoffRule, minimalPair } from "./spine.mjs";
import { normalizeSpec } from "./spec.mjs";

test("findSpineLesson: finds a real m2 lesson by id", () => {
  const l = findSpineLesson("pt-m2-1");
  assert.equal(l.title, "Quero um café");
  assert.equal(l.moduleId, "m2");
});

test("findSpineLesson: unknown id returns null", () => {
  assert.equal(findSpineLesson("pt-m9-99"), null);
});

test("nearestSpineIds: a typo'd id still returns real, close ids", () => {
  const nearest = nearestSpineIds("pt-m2-l1"); // spine ids have no "l" — "pt-m2-1" is one edit away
  assert.ok(nearest.includes("pt-m2-1"), `expected pt-m2-1 among ${nearest.join(", ")}`);
});

test("inheritFromSpine: no spine field is a no-op", () => {
  const raw = { id: "x" };
  assert.equal(inheritFromSpine(raw), raw);
});

test("inheritFromSpine: unknown spine id throws naming the nearest ids", () => {
  assert.throws(
    () => inheritFromSpine({ spine: "pt-m2-nope" }, "specs/x.yaml"),
    /pt-m2-nope.*not found.*nearest ids/s,
  );
});

test("inheritFromSpine: fills words (pos mapped, chunk -> phrase) from the spine lesson", () => {
  const out = inheritFromSpine({ spine: "pt-m2-1" });
  const agua = out.words.find((w) => w.pt === "água");
  assert.equal(agua.pos, "noun");
  assert.equal(agua.gender, "f");
  assert.equal(agua.emoji, "💧");
  const porFavor = out.words.find((w) => w.pt === "por favor");
  assert.equal(porFavor.pos, "phrase"); // spine pos: chunk -> phrase
  const quero = out.words.find((w) => w.pt === "quero");
  assert.equal(quero.pos, "verb");
});

test("inheritFromSpine: fills recall, win, antiPattern + contrast, scene/dialogue.npc", () => {
  const out = inheritFromSpine({ spine: "pt-m2-1", dialogue: { turns: [] } });
  assert.deepEqual(out.recall, ["gosto", "comer", "tenho", "você"]);
  assert.equal(out.win.pt, "Quero um café, por favor.");
  assert.equal(out.antiPattern.ok, "Quero comer.");
  assert.equal(out.antiPattern.wrong, "Quero de comer.");
  // 2026-09-19: «Quero comer.» / «Quero de comer.» is an insertion, not a one-token swap → no con step (antiPattern only)
  assert.equal(out.contrast, undefined);
  assert.equal(out.scene.npc, "Bia");
  assert.equal(out.dialogue.npc, "Bia"); // filled from scene.npc since the spec's own dialogue didn't set one
});

test("inheritFromSpine: an explicit spec field overrides the spine's and is logged", () => {
  const logs = [];
  const origLog = console.log;
  console.log = (m) => logs.push(m);
  try {
    const out = inheritFromSpine({ spine: "pt-m2-1", win: { pt: "Custom win.", en: "Custom win." } }, "specs/pt-m2-l1.yaml");
    assert.equal(out.win.pt, "Custom win.");
    assert.ok(logs.some((l) => l.includes("overrides spine: win")), logs.join("\n"));
  } finally {
    console.log = origLog;
  }
});

test("normalizeSpec: a spine-backed spec needs only sentences + dialogue.turns as new content", () => {
  const raw = {
    lesson: 1,
    id: "pt-m2-l1",
    spine: "pt-m2-1",
    sentences: [
      { pt: "Quero água, por favor.", en: "I want water, please.", roles: ["build"], uses: ["quero", "água", "por favor"] },
    ],
    dialogue: { turns: [{ npc: "Bom dia!", options: ["Bom dia! Quero um café.", "Tchau!"], correct: 0 }] },
  };
  const s = normalizeSpec(raw, "specs/pt-m2-l1.yaml");
  assert.equal(s.title, "Quero um café");
  assert.equal(s.win.pt, "Quero um café, por favor.");
  assert.equal(s.words.length, 8);
  assert.equal(s.dialogue.npc, "Bia");
});

// Item 2: payoff rule (retention hook 1).

test("checkPayoffRule: n/a when the spec has no spine reference", () => {
  const r = checkPayoffRule({});
  assert.equal(r.ok, null);
});

test("checkPayoffRule: PASS when the spec never sets its own win (inherits the spine's)", () => {
  const r = checkPayoffRule({ spine: "pt-m2-1" });
  assert.equal(r.ok, true);
});

test("checkPayoffRule: PASS when the spec's win literally matches the spine's", () => {
  const r = checkPayoffRule({ spine: "pt-m2-1", win: { pt: "Quero um café, por favor.", en: "..." } });
  assert.equal(r.ok, true);
});

test("checkPayoffRule: FAIL when win.pt differs with no winOverride", () => {
  const r = checkPayoffRule({ spine: "pt-m2-1", win: { pt: "Outra frase qualquer.", en: "..." } });
  assert.equal(r.ok, false);
  assert.match(r.detail, /winOverride/);
});

test("checkPayoffRule: PASS when win.pt differs but winOverride names a reason", () => {
  const r = checkPayoffRule({
    spine: "pt-m2-1",
    win: { pt: "Outra frase qualquer.", en: "..." },
    winOverride: "the café scene needed a shorter line for the sim's first turn",
  });
  assert.equal(r.ok, true);
  assert.match(r.detail, /winOverride/);
});

// ── item 10 (lane PTTOOL5): atom metadata shared via the spine ──────────

test("normalizeSpec: fills a word's missing emoji from the spine lesson's matching word (spine: set, words: authored explicitly)", () => {
  const s = normalizeSpec({
    spine: "pt-m2-1", lesson: 1, id: "pt-m2-l1", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title",
    words: [{ pt: "água", en: "water", pos: "noun" }], // no emoji — spine's água carries 💧
    sentences: [{ pt: "Eu quero água.", en: "I want water.", roles: ["build"], uses: ["água"] }],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "Eu quero água.", en: "I want water." },
  });
  assert.equal(s.wordByPt.get("água").emoji, "💧");
});

test("normalizeSpec: a word's emoji that contradicts the spine's throws", () => {
  const bad = {
    spine: "pt-m2-1", lesson: 1, id: "pt-m2-l1", title: "T", grammar: "g", info: "info body text", infoTitle: "Info Title",
    words: [{ pt: "água", en: "water", pos: "noun", emoji: "🚱" }], // spine says 💧
    sentences: [{ pt: "Eu quero água.", en: "I want water.", roles: ["build"], uses: ["água"] }],
    dialogue: { npc: "Bia", turns: [{ npc: "Oi!", options: ["a", "b"], correct: 0 }] },
    win: { pt: "Eu quero água.", en: "I want water." },
  };
  assert.throws(() => normalizeSpec(bad), /água.*emoji.*contradicts|contradicts.*água/is);
});

// 2026-09-19 (m2 checkpoint lane): a checkpoint spine row has `grammar` but no
// `point`; the spec still needs `grammar` or spec.mjs rejects it.
test("inheritFromSpine: a checkpoint row fills grammar from its grammar id + contrasts", () => {
  const out = inheritFromSpine({ lesson: 6, id: "pt-m2-l6", spine: "pt-m2-6", checkpoint: true, words: [], recall: ["quero"] }, "t");
  assert.match(out.grammar, /^G12: checkpoint — recall pt-m2-1/);
});

// 2026-09-19 (wiring m2–m4): a sentence-shaped spine contrast becomes a
// one-form textMcq target only when it is a one-token minimal pair whose ok
// form the lesson teaches; otherwise no con step (the info card still shows it).
test("minimalPair: one-token swap on a taught form → pair; otherwise null", () => {
  assert.deepEqual(minimalPair({ contrast: { ok: "minha mãe", wrong: "meu mãe" }, words: [{ pt: "minha" }] }), { a: "minha", b: "meu", prompt: "___ mãe" });
  assert.equal(minimalPair({ contrast: { ok: "Quero comer.", wrong: "Quero de comer." }, words: [{ pt: "quero" }] }), null);
  assert.equal(minimalPair({ contrast: { ok: "São duas horas.", wrong: "É duas horas." }, words: [{ pt: "duas" }] }), null);
  assert.deepEqual(minimalPair({ contrast: { ok: "São duas horas.", wrong: "É duas horas." }, words: [{ pt: "são" }] }), { a: "são", b: "é", prompt: "___ duas horas." });
  const spec = inheritFromSpine({ lesson: 1, id: "pt-m4-l1", spine: "pt-m4-1" }, "t");
  assert.equal(spec.contrast[0].a, "minha");
});
