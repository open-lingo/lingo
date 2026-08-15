#!/usr/bin/env node
/**
 * INVENTORY CLASSIFICATION — the third thing the local model is good at.
 *
 * slotgen2 produced 「ちちはともだちにがくせいをあげます」("my father gives a
 * student to a friend") because my hand-written regex blocklist let がくせい
 * into the object slot. Every hand-written blocklist I have written in this
 * project has leaked; this is the fourth time (`ー` as punctuation, the zsh
 * word-split, the noun `pos` filter, now this).
 *
 * So stop writing blocklists. Classify the inventory ONCE with the local
 * model — a job it is actually good at, unlike authoring — cache it to disk,
 * and let every module's frame draw from typed pools. 134 words is small
 * enough that I can read the whole classification and check it, which is far
 * cheaper than reading every sentence generated forever after.
 *
 * Output: semantic-pools.json  { kana: {gloss, giftable, animate, place, abstract} }
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = "/Users/lichfield/Documents/projects/lingle/lingo";
const OUT = process.argv[3] ?? "./semantic-pools.json";
const model = process.argv[2] ?? "qwen3:4b";

const m30 = JSON.parse(
  readFileSync(resolve(ROOT, "src/features/languages/ja/curriculum/ir/m30.ir.json"), "utf8"),
);
const taught = new Set([...(m30.priorVocab ?? []), ...(m30.newAtoms ?? []).map((a) => a.kana)]);
const atomSrc = readFileSync(resolve(ROOT, "src/features/languages/ja/courseAtoms.ts"), "utf8");
const nouns = [];
for (const m of atomSrc.matchAll(/\{\s*id:[^}]*\}/g)) {
  const b = m[0];
  const f = (re) => b.match(re)?.[1];
  const kana = f(/kana:\s*"([^"]+)"/);
  const pos = f(/pos:\s*"([^"]+)"/) ?? "";
  if (!kana || !taught.has(kana) || (pos !== "noun" && pos !== "pronoun")) continue;
  nouns.push({ kana, gloss: f(/meaningEn:\s*"([^"]+)"/) ?? "" });
}

const CATS = ["person", "place", "time", "abstract", "portable-object", "food-drink", "animal", "body-part", "other"];

const schema = {
  type: "object",
  properties: {
    words: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kana: { type: "string" },
          category: { type: "string", enum: CATS },
          giftable: { type: "boolean" },
        },
        required: ["kana", "category", "giftable"],
      },
    },
  },
  required: ["words"],
};

const CHUNK = 25;
const result = {};
let tin = 0, tout = 0;
const t0 = Date.now();

for (let i = 0; i < nouns.length; i += CHUNK) {
  const batch = nouns.slice(i, i + CHUNK);
  const prompt = `Classify each Japanese noun. Answer for ALL ${batch.length} words, in order.

category: what kind of thing it is.
giftable: true only if one person could physically hand this to another person
as a gift or loan. A person is never giftable. A place, a time, an abstract
idea, a body part and a large vehicle are never giftable.

${batch.map((n) => `${n.kana} = ${n.gloss}`).join("\n")}`;

  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model, prompt, stream: false, think: false, format: schema,
      options: { num_ctx: 8192, num_predict: 2048, temperature: 0 },
    }),
  });
  const j = await res.json();
  tin += j.prompt_eval_count ?? 0; tout += j.eval_count ?? 0;
  let words = [];
  try { words = JSON.parse(j.response).words ?? []; } catch { /* retry below */ }
  const byKana = new Map(words.map((w) => [w.kana, w]));
  for (const n of batch) {
    const w = byKana.get(n.kana);
    result[n.kana] = {
      gloss: n.gloss,
      category: w?.category ?? "UNCLASSIFIED",
      giftable: w?.giftable ?? false,
    };
  }
  process.stderr.write(`  ${Math.min(i + CHUNK, nouns.length)}/${nouns.length}\r`);
}

writeFileSync(OUT, JSON.stringify(result, null, 1));
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const gift = Object.entries(result).filter(([, v]) => v.giftable);
const miss = Object.entries(result).filter(([, v]) => v.category === "UNCLASSIFIED");
console.error(`\n${nouns.length} nouns, ${secs}s, ${tin} in / ${tout} out, ${miss.length} unclassified`);
const byCat = {};
for (const [, v] of Object.entries(result)) byCat[v.category] = (byCat[v.category] ?? 0) + 1;
console.log("categories:", JSON.stringify(byCat));
console.log(`\nGIFTABLE (${gift.length}):`);
console.log(gift.map(([k, v]) => `${k}=${v.gloss}`).join("  "));
console.log(`\nPERSON (${Object.entries(result).filter(([, v]) => v.category === "person").length}):`);
console.log(Object.entries(result).filter(([, v]) => v.category === "person").map(([k]) => k).join("  "));
