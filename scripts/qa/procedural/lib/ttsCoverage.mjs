/**
 * TTS manifest-coverage lookup for Q7 (`audio-exists`).
 *
 * Reuses the pipeline's OWN resolution rule (`src/shared/tts/manifest.ts`'s
 * `resolveTtsPath`, doc comment: `sha256("<lang>:<text>").hexdigest()[:16]`,
 * checked against the schema-2 `hashes` blob and the `overrides` map) rather
 * than reinventing it. We do not ssrLoadModule `manifest.ts` itself: it is
 * built around `import.meta.glob` + a module-scope eager-fetch side effect
 * (`void preloadTtsManifests()`) designed for a browser/dev-server runtime,
 * not a one-shot CLI process. Its algorithm is ~10 lines of pure logic; this
 * file re-implements exactly that (same key format, same hash, same
 * override-wins-over-derivation rule) directly against the committed
 * manifest JSON, which is not build output — it is the checked-in file
 * `manifest.ts` itself reads.
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

/** True iff `text` has a recorded TTS clip for `lang` — same rule as the
 *  app's `resolveTtsPath`: an override wins, else the derived sha256 hash
 *  must appear in the manifest's hash blob. */
export function hasTtsClip(lang, text) {
  const { doc, hashSet } = loadManifestFile(lang);
  if (pickOverride(doc.overrides[text])) return true;
  const hash = sha256Hex16(`${lang}:${text}`);
  return hashSet.has(hash);
}

export function ttsManifestPath(lang, text) {
  const { doc } = loadManifestFile(lang);
  const hash = sha256Hex16(`${lang}:${text}`);
  return `${doc.prefix}/${hash}.mp3`;
}
