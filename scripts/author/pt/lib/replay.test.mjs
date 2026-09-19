import test from "node:test";
import assert from "node:assert/strict";
import { replayLesson } from "./replay.mjs";

const goodLesson = {
  n: 1,
  steps: [
    { id: "map", kind: "map", tokens: ["Eu", "sou."], pairs: [{ en: "I", tokenIndex: 0 }], audioText: "eu sou" },
    { id: "info", kind: "info", title: "t", body: "b", variant: "grammar" },
    {
      id: "img", kind: "imageMcq",
      target: { surface: "gato", meaningEn: "cat", emoji: "🐱" },
      distractors: [{ surface: "casa", emoji: "🏠" }, { surface: "livro", emoji: "📖" }, { surface: "carro", emoji: "🚗" }],
    },
    { id: "win", kind: "speakLit", pt: "Eu sou aqui.", en: "I am here.", atoms: ["eu"] },
  ],
};

test("replayLesson: real steps render through the real assemble.mjs emitters", () => {
  const r = replayLesson(goodLesson, "m1");
  assert.equal(r.ok, true);
  assert.equal(r.count, 4);
});

test("replayLesson: a real emitter-level failure (buildLit contraction tile) is caught, not thrown", () => {
  const lesson = {
    n: 1,
    steps: [{ id: "b", kind: "buildLit", pt: "Eu sou do lugar.", en: "x", atoms: ["do"] }],
  };
  const r = replayLesson(lesson, "m1");
  assert.equal(r.ok, false);
  assert.match(r.failures[0].error, /contraction/);
});

test("replayLesson: an unknown step kind is reported, not thrown", () => {
  const lesson = { n: 1, steps: [{ id: "x", kind: "notAKind" }] };
  const r = replayLesson(lesson, "m1");
  assert.equal(r.ok, false);
  assert.match(r.failures[0].error, /unknown step kind/);
});
