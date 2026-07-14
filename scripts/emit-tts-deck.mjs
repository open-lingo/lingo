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
// 2026-06 multi-language restructure moved the JA curriculum out of
// lesson/data into languages/ja/curriculum (module files lost the
// "mock-ja-" prefix). hiraganaCurriculum.ts stayed behind.
const JA_CURRICULUM_DIR = resolve(
  __dirname,
  "../src/features/languages/ja/curriculum",
);
const CURRICULUM = resolve(DATA_DIR, "hiraganaCurriculum.ts");
const OUT = resolve(
  __dirname,
  "../../lingo-core/test_decks/ja-hiragana-curriculum.json",
);

// Sources to scan. Curriculum is the source of truth for kana intros and
// row anchor words; the module files carry hand-authored vocab + words
// referenced in helpers like wordImageMcq / listeningBuild / speaking /
// listeningComp.
// Authored grammar-review pools (Track B) live outside the curriculum dir but
// carry cloze audioText + sentenceMcq correctKana that need TTS clips too.
const GRAMMAR_POOLS = resolve(DATA_DIR, "grammarReviewPools.ts");
// courseAtoms is the review-tail draw pool: buildReviewTailSteps picks
// atoms struggle-weighted at RUNTIME, so any atom kana can end up in a
// listening step. 2026-07-12 audit found 7 atom words with no clip →
// silent listening steps. Scanning the atom table closes the class.
const COURSE_ATOMS = resolve(
  __dirname,
  "../src/features/languages/ja/courseAtoms.ts",
);
const sources = [CURRICULUM, GRAMMAR_POOLS, COURSE_ATOMS];
for (const f of readdirSync(JA_CURRICULUM_DIR)) {
  if (
    /^(m\d+(-[\w-]+)?|sidequest(-[\w-]+)?|katakanaRows)\.ts$/.test(f)
  ) {
    sources.push(join(JA_CURRICULUM_DIR, f));
  }
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
    // listeningBuildSentence({ target: "…" }) — the factory maps `target`
    // to the step's audioKey at runtime, so it needs a clip. (Gap found
    // 2026-07-01: keyed `target:` was never captured; JA_ONLY filters out
    // the English match_pairs `target:` values this also matches.)
    /\btarget:\s*"([^"]+)"/g,
    /audioKey:\s*"([^"]+)"/g,
    /transcript:\s*"([^"]+)"/g,
    /promptAudioText:\s*"([^"]+)"/g,
    /audioText:\s*"([^"]+)"/g,
    /ja:\s*"([^"]+)"/g,
    // Positional args: wordImageMcq("id", "あい"), listeningBuild("id", "あい", "love"),
    // speaking("id", "あい", "love"), listeningComp("id", "あい", "romaji", ...).
    // The optional leading arg is any RowContext identifier (ctx, saCtx,
    // waCtx… — the katakana rows name theirs per-row).
    /\b(?:wordImageMcq|listeningBuild|speaking|listeningComp|phraseStep)\s*\(\s*(?:\w+,\s*)?"[^"]*",\s*"([^"]+)"/g,
    // build("id", "English prompt", "TARGET", tiles, correctOrder) — the
    // grammar-spine build factory sets audioKey = target (arg 3). Same
    // 2026-07-01 gap as keyed `target:` above.
    /\bbuild\s*\(\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"([^"]+)"/g,
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
// Strip trailing 。 so we don't generate separate audio for "X" and "X。"
// — the runtime lookup (tts.ts) falls back to the other variant.
const deduped = new Set();
for (const t of kanaSet) {
  if (!JA_ONLY.test(t)) continue;
  deduped.add(t.endsWith("。") ? t.slice(0, -1) : t);
}
const cards = Array.from(deduped)
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
