/**
 * Loader + lookup helpers for the compact Lexique 3.83 index built by
 * `scripts/lexical/fr/fetch-lexique.mjs` (see that file's header for the
 * source, licence, and pin). Read-only; this lane never edits Lexique
 * data. FR frequency/POS facts for the FR ports of Q2/Q3/Q8-style checks.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../../../");
const INDEX_PATH = path.join(REPO_ROOT, "artifacts/lexical/lexique/index.json");

let cached = null;

export function lexiqueAvailable() {
  return existsSync(INDEX_PATH);
}

export function lexiqueFingerprint() {
  if (!existsSync(INDEX_PATH)) return "no-lexique";
  const st = statSync(INDEX_PATH);
  return `${st.size}-${st.mtimeMs}`;
}

function load() {
  if (cached) return cached;
  if (!existsSync(INDEX_PATH)) {
    throw new Error(
      `Lexique index not found at ${INDEX_PATH}. Run:\n  node scripts/lexical/fr/fetch-lexique.mjs`,
    );
  }
  cached = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
  return cached;
}

/** `{lemme, cgram, freq, isLemma}[] | []` for an orthographic surface
 *  (case-sensitive, matching Lexique's own `ortho` column — callers should
 *  try the lowercase form too for sentence-initial capitals). */
export function lookupOrtho(text) {
  return load()[text] ?? [];
}

export function hasOrtho(text) {
  const hit = load()[text];
  return !!hit && hit.length > 0;
}

/** True if ANY entry for this surface is a function-word category
 *  (article/preposition/pronoun/conjunction) — Lexique's `cgram` values:
 *  ART, PRE, PRO, CON, ADV (adverb kept OUT — many adverbs are content
 *  words, e.g. "rapidement"). Used as a cheap "is this glue, not content"
 *  signal, the FR/ES analogue of JA's particle/copula table. */
const FUNCTION_CGRAM = new Set(["ART", "PRE", "PRO", "CON"]);

export function isFunctionWord(text) {
  const hits = lookupOrtho(text);
  return hits.length > 0 && hits.every((h) => FUNCTION_CGRAM.has(h.cgram));
}
