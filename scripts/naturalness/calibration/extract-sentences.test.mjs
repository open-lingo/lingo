import test from "node:test";
import assert from "node:assert/strict";
import { collect } from "./extract-sentences.mjs";

// Correction (2026-09-18): a dialogue_sim turn's reply.options[] mixes the
// correct answer with deliberately wrong foils (id-tagged wrong-*/echo
// distractors — project memory "grade answers, not every string"). The
// original extractor pushed every option's text into the sample pool; this
// fixture reproduces a real course shape (fr-m13-3's chocolat turn) and
// proves the fix samples only the option matching correctOptionId, never
// a foil, while still keeping the legitimate npc/reply.audioText lines.

const FIXTURE_DIALOGUE_SIM_STEP = {
  type: "dialogue_sim",
  id: "fr-m13-3-sim-chocolat",
  turns: [
    {
      id: "t1-chocolat",
      npc: {
        speaker: "Léa",
        kana: "Tu aimes le chocolat ?",
        audioText: "tu aimes le chocolat ?",
      },
      goal: "Say no, you don't like chocolate.",
      reply: {
        mode: "choice",
        options: [
          { id: "correct", text: "non, je n'aime pas le chocolat" },
          { id: "wrong-yes", text: "oui, j'aime le chocolat" },
          { id: "wrong-habite", text: "non, je n'habite pas le chocolat" },
        ],
        correctOptionId: "correct",
        audioText: "non, je n'aime pas le chocolat",
      },
    },
  ],
};

test("dialogue_sim: excludes foil options (wrong-yes, wrong-habite)", () => {
  const out = [];
  collect(FIXTURE_DIALOGUE_SIM_STEP, "fr", out);
  const texts = out.map((r) => r.text);
  assert.equal(texts.includes("oui, j'aime le chocolat"), false, "wrong-yes foil must not be sampled");
  assert.equal(
    texts.includes("non, je n'habite pas le chocolat"),
    false,
    "wrong-habite foil must not be sampled",
  );
});

test("dialogue_sim: includes the correctOptionId option's text", () => {
  const out = [];
  collect(FIXTURE_DIALOGUE_SIM_STEP, "fr", out);
  const optionRow = out.find((r) => r.field === "turns[].reply.options[correctOptionId].text");
  assert.ok(optionRow, "the correct option should still be sampled under its own field label");
  assert.equal(optionRow.text, "non, je n'aime pas le chocolat");
});

test("dialogue_sim: still includes npc.audioText and reply.audioText (legitimate answer positions)", () => {
  const out = [];
  collect(FIXTURE_DIALOGUE_SIM_STEP, "fr", out);
  const texts = out.map((r) => r.text);
  assert.ok(texts.includes("tu aimes le chocolat ?"), "npc line must still be sampled");
  assert.ok(texts.includes("non, je n'aime pas le chocolat"), "reply.audioText must still be sampled");
});

test("dialogue_sim: a reply with options but no correctOptionId samples nothing from options[]", () => {
  const step = {
    type: "dialogue_sim",
    turns: [
      {
        npc: { audioText: "ça va ?" },
        reply: {
          mode: "choice",
          options: [
            { id: "a", text: "oui ça va bien" },
            { id: "b", text: "non ça va mal" },
          ],
          // no correctOptionId — can't safely identify the answer position
          audioText: "oui ça va bien",
        },
      },
    ],
  };
  const out = [];
  collect(step, "fr", out);
  const optionRows = out.filter((r) => r.field.startsWith("turns[].reply.options"));
  assert.equal(optionRows.length, 0, "must not guess an answer when correctOptionId is missing");
  // reply.audioText is still the legitimate answer position and stays.
  assert.ok(out.some((r) => r.text === "oui ça va bien"));
});

test("dialogue_sim: a reply in build mode (no options[]) is untouched by the options filter", () => {
  const step = {
    type: "dialogue_sim",
    turns: [
      {
        npc: { audioText: "tu veux combien ?" },
        reply: {
          mode: "build",
          tiles: ["oui", "s'il vous plaît", "non", "merci"],
          answer: "oui s'il vous plaît",
          audioText: "oui s'il vous plaît",
        },
      },
    ],
  };
  const out = [];
  collect(step, "fr", out);
  const texts = out.map((r) => r.text);
  assert.ok(texts.includes("oui s'il vous plaît"));
  assert.equal(texts.includes("non"), false);
  assert.equal(texts.includes("merci"), false);
});
