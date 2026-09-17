/**
 * TTS manifest-coverage lookup for Q7 (`audio-exists`).
 *
 * Reuses the pipeline's OWN resolution rule — not just `manifest.ts`'s
 * `resolveTtsPath` (override-wins, else `sha256("<lang>:<text>")[:16]`
 * against the schema-2 `hashes` blob), but the FULL algorithm callers
 * actually get from `src/shared/tts/index.ts`'s `getTtsUrl`, which wraps
 * `resolveTtsPath` with three fallback passes `resolveTtsPath` alone does
 * NOT have:
 *
 *   1. Strip trailing sentence punctuation (。.?!…) and retry, since the
 *      generated deck stores text punctuation-free while authored text
 *      keeps it (`。` on nearly every JA sentence).
 *   2. Re-add a bare `。` or `.` to the stripped form and retry (covers a
 *      deck entry keyed WITH one of those, when the other stripped first).
 *   3. Strip ALL internal + trailing punctuation (。、？！?!…) and retry —
 *      an authored two-sentence line keeps its internal boundary mark, the
 *      deck does not.
 *   4. (JA only) a lone katakana glyph falls back to its hiragana twin.
 *
 * An EARLIER version of this file checked only step 0 (bare `resolveTtsPath`)
 * and produced 654 false "missing clip" findings across the JA course
 * (measured 2026-09-17, `docs/procedural-qa-2026-09-17.md` §3/§4) — every one
 * of A7's reported 655 Q7 findings but one turned out to resolve fine at
 * runtime via steps 1-3 above. Computing the SAME hash `getTtsUrl` computes,
 * against the SAME manifest, is the fix; this file still does not
 * `ssrLoadModule` `manifest.ts`/`index.ts` themselves for the hot path: they
 * are built around `import.meta.glob` + a module-scope eager-fetch side
 * effect (`void preloadTtsManifests()`) designed for a browser/dev-server
 * runtime — an async race a one-shot CLI process should not depend on for
 * correctness. Parity with the real `getTtsUrl` is instead pinned by a test
 * that imports it for real: `src/test/ttsCoverageParity.test.ts`.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../",
);
const HASH_LEN = 16;

const manifestCache = new Map();

function sha256Hex16(input) {
  return createHash("sha256").update(input, "utf8").digest("hex").slice(0, HASH_LEN);
}

function loadManifestFile(lang) {
  if (manifestCache.has(lang)) return manifestCache.get(lang);
  const p = path.join(REPO_ROOT, `src/shared/tts/manifests/${lang}.json`);
  let doc;
  try {
    doc = JSON.parse(readFileSync(p, "utf8"));
  } catch {
    doc = { schema: 2, lang, prefix: `tts/v1/${lang}`, count: 0, hashes: "", overrides: {} };
  }
  const hashSet = new Set();
  for (let i = 0; i + HASH_LEN <= doc.hashes.length; i += HASH_LEN) {
    hashSet.add(doc.hashes.slice(i, i + HASH_LEN));
  }
  const entry = { doc, hashSet };
  manifestCache.set(lang, entry);
  return entry;
}

function pickOverride(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  if (Array.isArray(entry) && entry.length > 0) return entry[0];
  return null;
}

/** `manifest.ts`'s `resolveTtsPath`: override wins, else the derived sha256
 *  hash must appear in the manifest's hash blob. No fallback variants — see
 *  `hasTtsClip` for the full `getTtsUrl`-equivalent algorithm. */
function resolvesDirect(lang, text) {
  const { doc, hashSet } = loadManifestFile(lang);
  if (pickOverride(doc.overrides[text])) return true;
  const hash = sha256Hex16(`${lang}:${text}`);
  return hashSet.has(hash);
}

/** Single katakana glyph -> its hiragana twin (ア→あ) — mirrors
 *  `src/shared/tts/index.ts`'s `hiraganaTwin` exactly (same guard: whole
 *  WORDS never take this path, only a lone glyph). */
function hiraganaTwin(text) {
  if (Array.from(text).length !== 1) return null;
  const code = text.charCodeAt(0);
  if (code < 0x30a1 || code > 0x30f6) return null;
  return String.fromCharCode(code - 0x60);
}

/** True iff `text` resolves to a recorded TTS clip for `lang` — mirrors
 *  `src/shared/tts/index.ts`'s `getTtsUrl` EXACTLY, not just
 *  `manifest.ts`'s bare `resolveTtsPath`: direct hash/override, then the
 *  punctuation-stripped fallback variants, then (JA only) the hiragana-twin
 *  single-glyph fallback. See this file's header comment for why each pass
 *  exists and why 654 of A7's 655 Q7 findings were this gap. */
export function hasTtsClip(lang, text) {
  if (!text) return false;
  if (resolvesDirect(lang, text)) return true;
  const stripped = text.replace(/[。.?!…]+$/, "");
  const bare = text.replace(/[。、？！?!…]/g, "");
  for (const alt of [stripped, `${stripped}。`, `${stripped}.`, bare]) {
    if (alt === text) continue;
    if (resolvesDirect(lang, alt)) return true;
  }
  if (lang === "ja") {
    const twin = hiraganaTwin(text);
    if (twin && resolvesDirect(lang, twin)) return true;
  }
  return false;
}

export function ttsManifestPath(lang, text) {
  const { doc } = loadManifestFile(lang);
  const hash = sha256Hex16(`${lang}:${text}`);
  return `${doc.prefix}/${hash}.mp3`;
}
