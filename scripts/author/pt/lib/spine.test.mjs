import test from "node:test";
import assert from "node:assert/strict";
import { inheritFromSpine, findSpineLesson, nearestSpineIds, checkPayoffRule } from "./spine.mjs";
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
  assert.equal(out.contrast[0].a, "Quero comer.");
  assert.equal(out.contrast[0].b, "Quero de comer.");
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
