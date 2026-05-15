#!/usr/bin/env node
/**
 * Reads the hiragana curriculum (TS source) and emits a flat JSON deck of
 * every phrase that needs TTS audio. The Python TTS generator picks up
 * `lingo-core/test_decks/*.json`, so this writes there.
 *
 * Re-run whenever the curriculum changes:
 *   node scripts/emit-tts-deck.mjs
 *   (then) cd ../lingo-core && .venv-tts/bin/python -m scripts.tts.generate \
 *           --lang ja --provider edge
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CURRICULUM = resolve(
  __dirname,
  "../src/features/lesson/data/hiraganaCurriculum.ts",
);
const OUT = resolve(
  __dirname,
  "../../lingo-core/test_decks/ja-hiragana-curriculum.json",
);

const src = readFileSync(CURRICULUM, "utf-8");

// Tiny regex-based extractor. We only care about:
//   { kana: "X", ... } from introduces
//   { kana: "X", romaji: "...", meaning: "..." } from anchorWords
//   word: "X" from audioPick
//   answer: "X" from build
// All single-line patterns inside the catalog.
const kanaSet = new Set();

for (const m of src.matchAll(/kana:\s*"([^"]+)"/g)) kanaSet.add(m[1]);
for (const m of src.matchAll(/word:\s*"([^"]+)"/g)) kanaSet.add(m[1]);
for (const m of src.matchAll(/answer:\s*"([^"]+)"/g)) kanaSet.add(m[1]);
// Distractors are inside `distractors: ["X", "Y", "Z"]` — capture per-string.
for (const m of src.matchAll(/distractors:\s*\[([^\]]+)\]/g)) {
  for (const s of m[1].matchAll(/"([^"]+)"/g)) kanaSet.add(s[1]);
}

// Build the deck JSON shape the Python collector expects.
const cards = Array.from(kanaSet)
  .filter((t) => /^[\p{Script=Hiragana}゙゚　-〿]+$/u.test(t))
  .sort()
  .map((t, i) => ({
    id: `hira-${i.toString().padStart(3, "0")}-${t}`,
    front: t,
  }));

const deck = {
  name: "ja-hiragana-curriculum",
  languageId: "ja",
  _note:
    "Auto-emitted by scripts/emit-tts-deck.mjs from hiraganaCurriculum.ts. " +
    "Edit the curriculum, re-run the script, then run the TTS generator.",
  cards,
};

writeFileSync(OUT, JSON.stringify(deck, null, 2) + "\n", "utf-8");
console.log(`wrote ${cards.length} phrases → ${OUT}`);
