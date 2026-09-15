#!/usr/bin/env node
/**
 * Bridges `emit-tts-deck.mjs`'s per-card `speech` field (kanji synthesis
 * text for a card whose `front`/hash stays kana — see that file's header
 * doc) into lingo-data's existing per-language override file, which is the
 * ONLY mechanism `pipeline/tts/generate.py` already has for "hash on one
 * string, speak a different one" (`Job.speech` resolves
 * `SPEECH_OVERRIDES[lang].get(Job.text, Job.text)`; `Job.text`/the cache key
 * is always the deck card's `front`). That mechanism already shipped the
 * 2026-08-20 ははは/母 fix and the 2026-09-06 「Xは？」 fix by hand; this
 * script is what makes the word-level kanji default machine-written instead
 * of hand-maintained.
 *
 * Deliberately NOT a change to generate.py — collect_deck_jobs only ever
 * reads `card.front`, so this is a read-only bridge that never touches
 * pipeline application code, only the data file it was designed to read.
 *
 * Run AFTER emit-tts-deck.mjs, once per language that has cards with a
 * `speech` field (today: ja only):
 *
 *   node scripts/emit-tts-deck.mjs
 *   node scripts/tts-emit-speech-overrides.mjs ja
 *
 * Merge policy: a `_comment*`-prefixed key in the existing override file is
 * always preserved verbatim (those are human-authored documentation, not
 * data). A real key already in the file is preserved UNLESS this run's
 * value differs, in which case the deck's value wins and the change is
 * printed — decks are regenerated from source-of-truth curriculum data, so
 * a stale hand-entry should not silently shadow a corrected one. Existing
 * keys with no corresponding card this run are left alone (a homophone atom
 * dropped from a WIP module shouldn't un-fix already-shipped audio).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DECKS_DIR = resolve(__dirname, "../../lingo-data/data/test_decks");
const OVERRIDES_DIR = resolve(__dirname, "../../lingo-data/pipeline/tts");

const langs = process.argv.slice(2);
if (langs.length === 0) {
  console.error("usage: node scripts/tts-emit-speech-overrides.mjs <lang> [<lang> ...]");
  process.exit(1);
}

for (const lang of langs) {
  const pairs = new Map(); // front -> speech
  for (const f of readdirSync(DECKS_DIR)) {
    if (!f.endsWith(".json")) continue;
    const deck = JSON.parse(readFileSync(join(DECKS_DIR, f), "utf-8"));
    if (deck.languageId !== lang) continue;
    for (const card of deck.cards ?? []) {
      if (card.speech && card.speech !== card.front) pairs.set(card.front, card.speech);
    }
  }
  if (pairs.size === 0) {
    console.log(`${lang}: no cards with a \`speech\` field across ${DECKS_DIR} — nothing to merge`);
    continue;
  }

  const overridesPath = join(OVERRIDES_DIR, `speech_overrides_${lang}.json`);
  const existing = existsSync(overridesPath)
    ? JSON.parse(readFileSync(overridesPath, "utf-8"))
    : {};

  let added = 0;
  let changed = 0;
  const merged = { ...existing };
  for (const [front, speech] of pairs) {
    if (!(front in merged)) {
      merged[front] = speech;
      added++;
    } else if (merged[front] !== speech) {
      console.log(`  ${lang}: ${front} override changed: "${merged[front]}" → "${speech}"`);
      merged[front] = speech;
      changed++;
    }
  }

  // Keep _comment keys and everything else stable-sorted with comments
  // first, mirroring the hand-authored file's existing shape.
  const commentKeys = Object.keys(merged).filter((k) => k.startsWith("_comment"));
  const dataKeys = Object.keys(merged)
    .filter((k) => !k.startsWith("_comment"))
    .sort();
  const ordered = {};
  for (const k of commentKeys) ordered[k] = merged[k];
  for (const k of dataKeys) ordered[k] = merged[k];

  writeFileSync(overridesPath, JSON.stringify(ordered, null, 2) + "\n", "utf-8");
  console.log(
    `${lang}: merged ${pairs.size} deck-resolved pair(s) into ${overridesPath} ` +
      `(${added} new, ${changed} changed, ${pairs.size - added - changed} unchanged). NOT committed.`,
  );
}
