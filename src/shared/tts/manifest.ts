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
 *   2. `ja-keita` dialogue lines (679) — produced by a generator script that
 *      no longer exists in any repo; their hashes are not reconstructible, so
 *      the legacy mapping is carried verbatim. Regenerating them through the
 *      normal pipeline collapses this class to zero.
 *
 * ## Loading strategy — deliberately static, for now
 *
 * All languages are statically imported and bundled. That is a 3.8x win over
 * the old manifest with ZERO async surface, which matters because
 * `getTtsUrl` is called synchronously from ~107 sites, several of which
 * decide whether to render a control at all.
 *
 * The seam to change when this stops being the right trade: `MANIFESTS`
 * below. Swap the static imports for `import.meta.glob` with dynamic
 * loading, and have `LanguageContext` await `preloadTtsManifest(lang)`
 * before rendering lesson content.
 *
 * When to make that switch: the incoming 6k-word frequency list across four
 * languages adds roughly 24k entries (~384 KB of hashes). At that point the
 * bundled total approaches ~650 KB and per-language loading — a Korean
 * learner should never download the Japanese set — pays for the async work.
 */
import { sha256Hex16 } from "./sha256";
import esManifest from "./manifests/es.json";
import jaManifest from "./manifests/ja.json";
import jaKeitaManifest from "./manifests/ja-keita.json";
import koManifest from "./manifests/ko.json";

export type TtsManifest = {
  schema: number;
  lang: string;
  prefix: string;
  count: number;
  hashes: string;
  overrides: Record<string, string | string[]>;
};

const HASH_LEN = 16;

const MANIFESTS: Record<string, TtsManifest> = {
  es: esManifest as TtsManifest,
  ja: jaManifest as TtsManifest,
  "ja-keita": jaKeitaManifest as TtsManifest,
  ko: koManifest as TtsManifest,
};

/**
 * Base URL every relative manifest path is resolved against.
 *
 * Unset (dev, and any build that hasn't been pointed at the CDN) means
 * same-origin: paths resolve to `/tts/v1/...`, which Vite serves out of the
 * public dir exactly as before. Set `VITE_ASSET_BASE_URL` to the CloudFront
 * origin to serve audio from the CDN instead. Trailing slashes are
 * normalized so both `https://cdn.example.com` and `.../` behave.
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
  return (
    MANIFESTS[lang] ?? {
      schema: 2,
      lang,
      prefix: `tts/v1/${lang}`,
      count: 0,
      hashes: "",
      overrides: {},
    }
  );
}

/**
 * No-op today (everything is statically bundled), but call sites should
 * already be in place so the static → dynamic switch is contained to this
 * module. Returns a resolved promise so `await` is safe now and correct later.
 */
export function preloadTtsManifest(_lang: string): Promise<void> {
  return Promise.resolve();
}

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

  const override = pickPath(doc.overrides[text]);
  if (override) return override;

  const set = hashSetFor(lang);
  if (!set) return null;
  const hash = sha256Hex16(`${lang}:${text}`);
  return set.has(hash) ? `${doc.prefix}/${hash}.mp3` : null;
}
