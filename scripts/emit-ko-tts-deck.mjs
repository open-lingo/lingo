#!/usr/bin/env node
/**
 * Emit a flat JSON deck of every Korean phrase in the KO curriculum that
 * needs TTS audio, for the Python generator to pick up. The KO analogue of
 * `emit-tts-deck.mjs` (JA).
 *
 * Re-run whenever the KO curriculum changes:
 *   node scripts/emit-ko-tts-deck.mjs
 *   (then) cd ../lingo-data && python -m pipeline.tts.generate \
 *           --lang ko --provider edge
 *
 * Strategy: unlike the JA emitter (which matches per-factory patterns), KO
 * content is unambiguous by SCRIPT — any string that is purely Hangul (plus
 * spaces / Korean punctuation / digits, and NO Latin letters) is spoken
 * target-language text. Info-card prose is English with the odd embedded
 * Korean word, so it carries Latin letters and is excluded. This captures
 * phrase/vocab words, cloze/build sentences, dialogue lines, listening
 * transcripts, and MCQ options in one sweep.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KO_DIR = resolve(__dirname, "../src/features/languages/ko");
const CURRICULUM_DIR = join(KO_DIR, "curriculum");
const OUT = resolve(
  __dirname,
  "../../lingo-data/data/test_decks/ko-curriculum.json",
);

const sources = [];
for (const f of readdirSync(CURRICULUM_DIR)) {
  if (f.endsWith(".ts") && !f.endsWith(".test.ts")) {
    sources.push(join(CURRICULUM_DIR, f));
  }
}
for (const extra of ["grammarHelpers.ts", "placementBank.ts"]) {
  const p = join(KO_DIR, extra);
  if (existsSync(p)) sources.push(p);
}

const HAS_HANGUL = /[가-힣]/;
// Hangul syllables + isolated jamo + spaces + Korean/basic punctuation +
// digits. Any Latin letter disqualifies (that's English prose, not speech).
const KO_ONLY = /^[가-힣ㄱ-ㅎㅏ-ㅣ\s.,!?~…％%()0-9·\-]+$/;
const MAX_LEN = 40; // guards against a stray all-Korean paragraph

const set = new Set();
for (const path of sources) {
  const src = readFileSync(path, "utf-8");
  for (const m of src.matchAll(/"([^"\\]*)"/g)) {
    const s = m[1].trim();
    if (!s || !HAS_HANGUL.test(s) || !KO_ONLY.test(s) || s.length > MAX_LEN) {
      continue;
    }
    // Strip a trailing period so "X" and "X." share one clip — the runtime
    // getTtsUrl() falls back across the ± punctuation variant.
    set.add(s.endsWith(".") ? s.slice(0, -1).trim() : s);
  }
}

const cards = Array.from(set)
  .sort()
  .map((t, i) => ({ id: `ko-${i.toString().padStart(4, "0")}`, front: t }));

const deck = {
  name: "ko-curriculum",
  languageId: "ko",
  _note:
    "Auto-emitted by scripts/emit-ko-tts-deck.mjs from the KO curriculum. " +
    "Edit the curriculum, re-run the script, then run the TTS generator.",
  cards,
};

writeFileSync(OUT, JSON.stringify(deck, null, 2) + "\n", "utf-8");
console.log(`wrote ${cards.length} Korean phrases → ${OUT}`);
