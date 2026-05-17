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
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = resolve(__dirname, "../src/features/lesson/data");
const CURRICULUM = resolve(DATA_DIR, "hiraganaCurriculum.ts");
const OUT = resolve(
  __dirname,
  "../../lingo-core/test_decks/ja-hiragana-curriculum.json",
);

// Sources to scan. Curriculum is the source of truth for kana intros and
// row anchor words; the mock-ja-m{1,2}-*.ts files carry hand-authored
// vocab + words referenced in helpers like wordImageMcq / listeningBuild
// / speaking / listeningComp.
const sources = [CURRICULUM];
for (const f of readdirSync(DATA_DIR)) {
  if (/^mock-ja-(m[1-9]|sidequest)-.+\.ts$/.test(f)) sources.push(join(DATA_DIR, f));
}

const kanaSet = new Set();

for (const path of sources) {
  const src = readFileSync(path, "utf-8");
  // Single-line capture patterns. Covers:
  //   { kana: "X" }, word: "X", answer: "X", correctKana = "X",
  //   targetSentence/audioKey/targetPhrase: "X", listeningComp(... "X" ...).
  for (const re of [
    /kana:\s*"([^"]+)"/g,
    /word:\s*"([^"]+)"/g,
    /answer:\s*"([^"]+)"/g,
    /correctKana:\s*"([^"]+)"/g,
    /targetSentence:\s*"([^"]+)"/g,
    /targetPhrase:\s*"([^"]+)"/g,
    /audioKey:\s*"([^"]+)"/g,
    /transcript:\s*"([^"]+)"/g,
    /promptAudioText:\s*"([^"]+)"/g,
    /audioText:\s*"([^"]+)"/g,
    /ja:\s*"([^"]+)"/g,
    // Positional args: wordImageMcq("id", "あい"), listeningBuild("id", "あい", "love"),
    // speaking("id", "あい", "love"), listeningComp("id", "あい", "romaji", ...).
    /\b(?:wordImageMcq|listeningBuild|speaking|listeningComp|phraseStep)\s*\(\s*(?:ctx,\s*)?"[^"]*",\s*"([^"]+)"/g,
    // phrase|vocab("id", meaningEn, romaji, "kana", ...) — slot-4 capture.
    // Used by sidequest survival + M3 vocab lessons (the latter uses a
    // `vocab` alias). Kana is positional, not keyed, so the kana: regex
    // above misses it.
    /\b(?:phrase|vocab)\s*\(\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"([^"]+)"/g,
    // line("id", speaker, meaningEn, romaji, "kana", ...) — slot-5 for
    // M3-9 mini-dialogue factory.
    /\bline\s*\(\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"([^"]+)"/g,
    // cloze("id", before, after, correctParticle, [options], meaningEn,
    //   "audioText", ...) — positional 7th arg captures the full
    //   assembled sentence audio key. The array arg is matched
    //   lazily across newlines.
    /\bcloze\s*\([^)]*?\]\s*,\s*"[^"]*"\s*,\s*"([^"]+)"/gs,
  ]) {
    for (const m of src.matchAll(re)) kanaSet.add(m[1]);
  }
  for (const m of src.matchAll(/distractors:\s*\[([^\]]+)\]/g)) {
    for (const s of m[1].matchAll(/"([^"]+)"/g)) kanaSet.add(s[1]);
  }
}

// Build the deck JSON shape the Python collector expects.
// Accept any string that is purely Japanese script (hiragana, katakana,
// long-vowel mark, punctuation, full-width spaces) — extended from
// hiragana-only when M3 introduced katakana loanwords + multi-word
// sentence audio (2026-05-16).
const JA_ONLY = /^[\p{Script=Hiragana}\p{Script=Katakana}゙゚ー　-〿 ]+$/u;
const cards = Array.from(kanaSet)
  .filter((t) => JA_ONLY.test(t))
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
