import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { extractTts } from "./ttsExtract.mjs";

const hash = (t) => createHash("sha256").update(`pt:${t}`, "utf8").digest("hex").slice(0, 16);

test("extractTts: hash recipe matches PTAUTH-L1-report.md's verified table (sha256(\"pt:\"+text)[:16])", () => {
  const lesson = { steps: [{ id: "a", kind: "speakLit", pt: "Olá!", en: "Hello!" }] };
  const [entry] = extractTts(lesson, []);
  assert.equal(entry.hash, hash("olá!"));
  assert.equal(entry.hash.length, 16);
});

test("extractTts: atom surfaces get their own normalized entry", () => {
  const [entry] = extractTts({ steps: [] }, [{ surface: "olá" }]);
  assert.equal(entry.text, "olá");
  assert.equal(entry.hash, hash("olá"));
});

test("extractTts: sim NPC/reply text is raw (not lower1(bare())-normalized), per the PTAUTH-L1 caveat", () => {
  const lesson = {
    steps: [{
      id: "sim", kind: "sim",
      turns: [{ id: "t1", npc: { pt: "Olá! Eu sou Bia." }, reply: { mode: "choice", options: [{ text: "Olá! Eu sou Sam." }] } }],
    }],
  };
  const entries = extractTts(lesson, []);
  assert.ok(entries.some((e) => e.text === "Olá! Eu sou Bia."), "npc line should stay raw, capital O");
  assert.ok(entries.some((e) => e.text === "Olá! Eu sou Sam."), "reply option should stay raw");
});

test("extractTts: identical normalized text from two steps dedupes into ONE entry with two sources", () => {
  const lesson = {
    steps: [
      { id: "a", kind: "speakLit", pt: "Eu sou Sam.", en: "x" },
      { id: "b", kind: "clozeLit", pt: "Eu sou Sam.", en: "x", blank: "sou", options: ["sou"] },
    ],
  };
  const entries = extractTts(lesson, []);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].sources.length, 2);
});
