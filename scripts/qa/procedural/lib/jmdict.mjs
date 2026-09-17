/**
 * Loader + lookup helpers for the compact JMdict index built by
 * `scripts/lexical/ja/fetch-jmdict.mjs` (see that file's header for the
 * source, licence, and pin). Read-only; this lane never edits JMdict data.
 *
 * The index is two surface->[ids, posCsv, common] maps (`kana`, `kanji`).
 * All lookups here are against the KANA map — the runtime JSON our checks
 * read is kana-first (`docs/content-ships-in-the-binary.md`), so a tile's
 * literal text is always kana; the kanji map exists for completeness /
 * future callers (e.g. a compiler-side check working from IR kanji
 * spellings) but Q2/Q3 don't need it.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../../../");
const INDEX_PATH = path.join(REPO_ROOT, "artifacts/lexical/jmdict/index.json");

let cached = null;

export function jmdictAvailable() {
  return existsSync(INDEX_PATH);
}

export function jmdictIndexPath() {
  return INDEX_PATH;
}

/** Content-hash-ish fingerprint for the verdict cache (requirement 5): the
 *  index's mtime+size, so a rebuilt JMdict index invalidates caches keyed
 *  against it without needing to hash 19MB on every run. */
export function jmdictFingerprint() {
  if (!existsSync(INDEX_PATH)) return "no-jmdict";
  const st = statSync(INDEX_PATH);
  return `${st.size}-${st.mtimeMs}`;
}

function load() {
  if (cached) return cached;
  if (!existsSync(INDEX_PATH)) {
    throw new Error(
      `JMdict index not found at ${INDEX_PATH}. Run:\n  node scripts/lexical/ja/fetch-jmdict.mjs`,
    );
  }
  const raw = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
  cached = raw;
  return raw;
}

/** `{ids, pos: string[], common: boolean} | null` for a kana reading. */
export function lookupKana(text) {
  const idx = load();
  const hit = idx.kana[text];
  if (!hit) return null;
  const [ids, posCsv, common] = hit;
  return { ids, pos: posCsv ? posCsv.split(",") : [], common: common === 1 };
}

export function hasKanaEntry(text) {
  return load().kana[text] !== undefined;
}

export function isCommonKanaEntry(text) {
  const hit = load().kana[text];
  return !!hit && hit[2] === 1;
}

export function hasKanjiEntry(text) {
  return load().kanji[text] !== undefined;
}
