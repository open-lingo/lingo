/**
 * TTS manifest resolution — schema 2 (client-derived paths).
 *
 * ## What changed
 *
 * The old manifest was one flat ~1.0 MB JSON mapping `"<lang>:<text>"` to a
 * relative mp3 path, imported at build time so every visitor downloaded every
 * language. Because the path is a pure function of the key, almost all of
 * that was redundant.
 *
 * Schema 2 ships, per language:
 *   - `hashes`   — every existing hash16, sorted and concatenated (no
 *                  separators). Sliced into a Set on first use.
 *   - `overrides`— the entries that are NOT derivable, as text → path(s).
 *   - `prefix`   — the versioned directory the derived files live under.
 *
 * ~1.0 MB → ~268 KB, and the text itself is never shipped for the 95% of
 * entries that derive cleanly.
 *
 * ## Two override classes (see lingo-data/pipeline/tts/emit_manifest.py)
 *
 *   1. Multi-voice entries (67) — a second recording hashed with the voice ID
 *      appended, kept so the app can rotate voices.
 *   2. `ja-keita` dialogue lines (679) — produced by `gen_dialogue_voices.py`,
 *      which hashes with **SHA-1** (not SHA-256) and writes into `tts/ja/`
 *      regardless of the key's language prefix. Since this resolver computes
 *      SHA-256, they cannot be derived here and are listed explicitly.
 *      Regenerating them under the standard scheme collapses this class to
 *      zero; until then the overrides work and the audio plays.
 *
 * ## Loading strategy — lazy chunks, eagerly fetched (2026-08-15)
 *
 * The manifests used to be statically imported, which welded ~284 KB of JSON
 * into the eager entry chunk — every visitor downloaded and parsed every
 * language before first paint. They are now `import.meta.glob` lazy chunks,
 * ALL kicked off at module init (see the bottom of this file), so the fetch
 * runs in parallel with the rest of boot instead of inside it. Not
 * per-language yet on purpose: es+ko together are ~44 KB raw, so the prize
 * was getting the bytes out of the render-blocking path, not choosing which
 * bytes. Go per-language when the 6k-word frequency lists land.
 *
 * `getTtsUrl` is still called synchronously from ~107 sites, several of
 * which decide whether to render a control at all. Two things keep that
 * sound:
 *   - Manifest docs have STABLE IDENTITY: `getTtsManifest` returns the same
 *     object before and after load; the loader fills it in place. Module-
 *     scope snapshots (languages/{ja,ko,es}/module.ts) therefore go live the
 *     moment the JSON lands.
 *   - Surfaces that hard-require audio (the lesson route) await
 *     `preloadTtsManifests()` in their lazy-route factory, so a slow fetch
 *     delays the lesson spinner, never renders a silent listening step.
 *     Everything else degrades exactly like a missing recording does today.
 *
 * Tests: `src/test/setup.ts` awaits `preloadTtsManifests()` before any test
 * file is imported, so every test still sees synchronously-resolvable
 * manifests.
 */
import { sha256Hex16 } from "./sha256";

export type TtsManifest = {
  schema: number;
  lang: string;
  prefix: string;
  count: number;
  hashes: string;
  overrides: Record<string, string | string[]>;
};

const HASH_LEN = 16;

// One loader per manifest file, resolved lazily into its own chunk.
// index.json is the pipeline's directory listing, not a manifest.
const MANIFEST_LOADERS = import.meta.glob<{ default: TtsManifest }>(
  "./manifests/*.json",
);

function langOfLoaderPath(p: string): string | null {
  const m = /\/([\w-]+)\.json$/.exec(p);
  return m && m[1] !== "index" ? m[1] : null;
}

function emptyManifest(lang: string): TtsManifest {
  return {
    schema: 2,
    lang,
    prefix: `tts/v1/${lang}`,
    count: 0,
    hashes: "",
    overrides: {},
  };
}

// Pre-created (empty) docs for every language that ships a manifest file,
// filled IN PLACE when its JSON chunk arrives — object identity is the
// contract that keeps module-scope `getTtsManifest` snapshots live.
const MANIFESTS: Record<string, TtsManifest> = {};
for (const p of Object.keys(MANIFEST_LOADERS)) {
  const lang = langOfLoaderPath(p);
  if (lang) MANIFESTS[lang] = emptyManifest(lang);
}

const manifestLoads = new Map<string, Promise<void>>();

function loadManifest(lang: string): Promise<void> {
  const started = manifestLoads.get(lang);
  if (started) return started;
  const path = Object.keys(MANIFEST_LOADERS).find(
    (p) => langOfLoaderPath(p) === lang,
  );
  if (!path) return Promise.resolve();
  const load = MANIFEST_LOADERS[path]()
    .then((mod) => {
      Object.assign(MANIFESTS[lang], mod.default);
      // A (defensive) pre-load lookup may have memoized the empty set.
      hashSets.delete(lang);
    })
    .catch((err) => {
      // Retryable: next resolve/preload attempt starts a fresh fetch.
      manifestLoads.delete(lang);
      throw err;
    });
  manifestLoads.set(lang, load);
  return load;
}

/**
 * Base URL every relative manifest path is resolved against.
 *
 * **Empty by default, and that is deliberate.** CloudFront fronts both the app
 * and `/tts/*` from a single distribution, so a relative path is same-origin
 * in production — on the apex AND on `www`, which serves the same SPA without
 * redirecting. Local dev is kept same-origin too, via the `/tts` proxy in
 * `vite.config.ts`.
 *
 * Do not "fix" this by pointing it at the CDN absolutely. `loadBuffer` fetches
 * clips and hands them to `decodeAudioData`, which is CORS-enforced, and the
 * bucket serves no `Access-Control-Allow-Origin`. An absolute base makes every
 * Web Audio clip fail on any origin but the apex — and because `canSynthesize`
 * returns false for `ja`, Japanese goes completely silent rather than
 * degrading. The `<audio>`-element paths keep working, so it fails *halfway*,
 * which is the hardest version to notice.
 *
 * `VITE_ASSET_BASE_URL` remains supported for the day assets move to their own
 * domain — that move needs a CORS response-headers policy on the distribution
 * first. Trailing slashes are normalized.
 */
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL ?? "").replace(/\/+$/, "");

export function assetUrl(relativePath: string): string {
  return `${ASSET_BASE}/${relativePath}`;
}

// Hash sets are built on first lookup for a language, not at module load —
// slicing ~11k hashes is cheap but pointless for languages the user never
// studies.
const hashSets = new Map<string, Set<string>>();

function hashSetFor(lang: string): Set<string> | null {
  const cached = hashSets.get(lang);
  if (cached) return cached;
  const doc = MANIFESTS[lang];
  if (!doc) return null;
  const set = new Set<string>();
  for (let i = 0; i + HASH_LEN <= doc.hashes.length; i += HASH_LEN) {
    set.add(doc.hashes.slice(i, i + HASH_LEN));
  }
  hashSets.set(lang, set);
  return set;
}

/** Languages with a manifest available. */
export function availableTtsLangs(): string[] {
  return Object.keys(MANIFESTS);
}

/**
 * The schema-2 document for `lang`, or an empty one for a language that
 * ships no recorded audio (KO relies on browser speech synthesis today).
 *
 * Exists so `LanguageModule.ttsManifest` can expose per-language coverage
 * without every module importing manifest JSON itself — the modules used to
 * pull in the whole legacy table just to populate a field nothing reads.
 */
export function getTtsManifest(lang: string): TtsManifest {
  return MANIFESTS[lang] ?? emptyManifest(lang);
}

/**
 * Resolves when `lang`'s manifest is loaded (immediately for languages that
 * ship none). Safe to call repeatedly — one fetch per language, retried on
 * failure.
 */
export function preloadTtsManifest(lang: string): Promise<void> {
  return loadManifest(lang);
}

/** All manifests, in parallel. The lesson route factory awaits this. */
export function preloadTtsManifests(): Promise<void> {
  return Promise.all(Object.keys(MANIFESTS).map(loadManifest)).then(() => {});
}

// Kick everything off at module init: this module is in the eager entry
// graph, so the JSON chunks start downloading alongside the rest of boot
// (in parallel — they no longer sit INSIDE the entry chunk). Swallowed
// rejection: offline boot must not surface an unhandled-rejection toast;
// resolve-time calls retry via manifestLoads eviction above.
void preloadTtsManifests().catch(() => {});

function pickPath(entry: string | string[] | undefined): string | null {
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  if (entry.length === 0) return null;
  return entry[Math.floor(Math.random() * entry.length)];
}

/**
 * Resolve `text` to a relative audio path, or null when no recording exists.
 * Overrides win over derivation — a multi-voice entry must not collapse to
 * its primary recording just because that one happens to derive cleanly.
 */
export function resolveTtsPath(lang: string, text: string): string | null {
  const doc = MANIFESTS[lang];
  if (!doc) return null;
  // Not loaded yet (or the boot fetch failed): answer "no recording" for
  // now — indistinguishable from a genuinely missing clip, which every call
  // site already handles — and (re)start the load for the next render.
  if (doc.count === 0) void loadManifest(lang).catch(() => {});

  const override = pickPath(doc.overrides[text]);
  if (override) return override;

  const set = hashSetFor(lang);
  if (!set) return null;
  const hash = sha256Hex16(`${lang}:${text}`);
  return set.has(hash) ? `${doc.prefix}/${hash}.mp3` : null;
}
