/**
 * CDN content-pack loader: cache-first, hash-verified, schema-gated.
 * Phase 2 of the pattern `dictLoader.ts` established in phase 1
 * (docs/dictionary-lazy-load-2026-09-18.md; this lane's design doc is
 * docs/content-packs-2026-09-18.md). Fetches ONE module's lesson JSON for
 * a course whose build pruned that module out of `dist/content/v1`
 * (`content.packs` flag on, module index >= `entry.packBundledThrough` —
 * see `contentLoader.ts`, the only caller).
 *
 * Unlike the dict manifest (checked into the repo, imported statically —
 * the dict format barely changes), the PACK manifest is generated fresh
 * every build (`scripts/build/emit-content-packs.mjs`) because lesson
 * content changes constantly, so it must be FETCHED at runtime, once per
 * (lang, contentVersion), memoized. Its `schemaVersion` is the schema
 * gate: a pack whose schema this build doesn't understand is refused
 * outright (never partially trusted), and the caller falls back to "the
 * bundled slice is all you get this session" + an "update the app" line
 * (`contentLoader.ts` → `getContentPackStatus`).
 *
 * Flow per file, mirroring `dictLoader.ts`'s `loadDictFile`:
 *   1. Fetch (memoized) + schema-check the pack manifest for this
 *      (lang, contentVersion). A newer-than-understood schema throws
 *      `ContentPackSchemaError` and is never retried differently.
 *   2. Try the persistent cache (`contentPackCache.ts`). A hit is
 *      hash-verified again before use; a bad cached entry is deleted and
 *      treated as a miss.
 *   3. On a miss, fetch raw bytes via the platform transport, verify the
 *      hash, and only then cache them. Wrong bytes throw, never reach the
 *      cache or the caller.
 *   4. Parse as UTF-8 JSON and return (pack files are plain JSON, not
 *      gzipped like the dict — CloudFront/S3 already handles transport
 *      compression, no client-side gunzip step needed).
 *
 * A thrown error here propagates to `contentLoader.ts`'s `ensureFileLoaded`,
 * which is the last step in the (a) memory → (b) bundled slice → (c) cache
 * → (d) network precedence — nothing local exists, so the caller's own
 * "clean offline message" path is correct, not a bug in this module.
 */
import { IS_NATIVE } from "@/shared/platform/native";
import { getPackStore, sha256Hex, type CachedPackStore } from "./contentPackCache";

/** Bump only for a breaking pack-FILE-shape change; must match `emit-content-packs.mjs`'s `PACK_SCHEMA_VERSION`. */
export const SUPPORTED_PACK_SCHEMA = 1;

export type PackFileMeta = { sha256: string; bytes: number };

export type PackManifest = {
  schemaVersion: number;
  contentVersion: string;
  lang: string;
  modules: Array<{ id: string; file: string; lessons: string[] }>;
  files: Record<string, PackFileMeta>;
};

/** Thrown when a fetched pack manifest's schemaVersion is newer than this build understands. */
export class ContentPackSchemaError extends Error {
  constructor(lang: string, gotSchema: number) {
    super(
      `content pack for "${lang}" uses schema ${gotSchema}, this build only understands up to ${SUPPORTED_PACK_SCHEMA} — update the app`,
    );
    this.name = "ContentPackSchemaError";
  }
}

const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL ?? "").replace(/\/+$/, "");

/** `https://cdn.example.com/content/v2/<contentVersion>/<lang>/` (or a relative `/content/v2/...` path on web with no CDN configured — same-origin, deploy.yml ships the tree as part of `dist/`). */
export function getPackBaseUrl(contentVersion: string, lang: string): string {
  return `${ASSET_BASE}/content/v2/${contentVersion}/${lang}/`;
}

/**
 * Platform raw-byte transport — same shape and same reasoning as
 * `kuroshiro.ts`'s `getDictFetchRaw`: native routes through
 * `fetchBinaryNative` (CapacitorHttp) because the asset CDN sends no
 * `Access-Control-Allow-Origin` and a plain `fetch` from
 * `capacitor://localhost` would be CORS-blocked; web uses a plain `fetch`.
 * Written locally rather than imported from `kuroshiro.ts` — that module
 * is Japanese-reading-specific (lazy-loads kuromoji) and content packs
 * apply to every language; the branch itself is six lines, not worth a
 * cross-feature import for.
 */
export async function getContentPackFetchRaw(): Promise<(url: string) => Promise<ArrayBuffer>> {
  if (IS_NATIVE) {
    const { fetchBinaryNative } = await import("@/shared/platform/nativeHttp");
    return fetchBinaryNative;
  }
  return async (url: string) => {
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) throw new Error(`content pack fetch failed: ${res.status} ${url}`);
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("text/html")) throw new Error(`content pack fetch got HTML ${url}`);
    return res.arrayBuffer();
  };
}

function parseJsonBytes<T>(bytes: ArrayBuffer): T {
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

const manifestPromises = new Map<string, Promise<PackManifest>>();

/** Fetches + schema-checks a language's pack manifest, memoized per (lang, contentVersion). */
export function ensurePackManifest(
  lang: string,
  contentVersion: string,
  fetchRaw: (url: string) => Promise<ArrayBuffer>,
): Promise<PackManifest> {
  const key = `${lang}@${contentVersion}`;
  let p = manifestPromises.get(key);
  if (!p) {
    const url = `${getPackBaseUrl(contentVersion, lang)}manifest.json`;
    p = fetchRaw(url)
      .then((bytes) => parseJsonBytes<PackManifest>(bytes))
      .then((m) => {
        if (m.schemaVersion > SUPPORTED_PACK_SCHEMA) {
          throw new ContentPackSchemaError(lang, m.schemaVersion);
        }
        return m;
      })
      .catch((e) => {
        manifestPromises.delete(key);
        throw e;
      });
    manifestPromises.set(key, p);
  }
  return p;
}

export interface LoadPackFileOptions {
  lang: string;
  contentVersion: string;
  /** Basename as recorded in the v1 manifest's module `file` field, e.g. `"m4.ea55518ffd.json"`. */
  filename: string;
  fetchRaw: (url: string) => Promise<ArrayBuffer>;
  /** Injectable for tests; defaults to the real Cache-Storage-backed store. */
  store?: CachedPackStore;
}

/**
 * Loads and parses one module's lesson JSON from its content pack.
 * Cache-first; caches only bytes that verified against the pack
 * manifest's sha256 for that file.
 */
export async function loadPackFile<T = unknown>(opts: LoadPackFileOptions): Promise<T> {
  const { lang, contentVersion, filename, fetchRaw, store = getPackStore() } = opts;
  const manifest = await ensurePackManifest(lang, contentVersion, fetchRaw);
  const meta = manifest.files[filename];
  if (!meta) {
    throw new Error(`loadPackFile: "${filename}" is not in the pack manifest for "${lang}"`);
  }
  const url = `${getPackBaseUrl(contentVersion, lang)}${filename}`;

  const cached = await store.get(url);
  if (cached) {
    const cachedHash = await sha256Hex(cached);
    if (cachedHash === meta.sha256) {
      return parseJsonBytes<T>(cached);
    }
    await store.delete(url); // corrupt/stale — never serve it
  }

  const fresh = await fetchRaw(url);
  const freshHash = await sha256Hex(fresh);
  if (freshHash !== meta.sha256) {
    throw new Error(
      `loadPackFile: hash mismatch for "${filename}" (${lang}) — expected ${meta.sha256}, got ${freshHash}`,
    );
  }
  await store.set(url, fresh); // best-effort; loadPackFile still returns verified bytes if caching fails
  return parseJsonBytes<T>(fresh);
}

/**
 * Warms the persistent cache for every file in a language's pack without
 * necessarily being asked for by a lesson open yet — used by the
 * course-open prefetch trigger (`contentLoader.ts`'s
 * `triggerCoursePackPrefetch`). Each file is independent: one failure
 * doesn't abort the rest.
 */
export async function prefetchPackFiles(
  lang: string,
  contentVersion: string,
  fetchRaw: (url: string) => Promise<ArrayBuffer>,
  store: CachedPackStore = getPackStore(),
): Promise<{ succeeded: string[]; failed: string[] }> {
  const manifest = await ensurePackManifest(lang, contentVersion, fetchRaw);
  const filenames = Object.keys(manifest.files);
  const results = await Promise.allSettled(
    filenames.map((filename) => loadPackFile({ lang, contentVersion, filename, fetchRaw, store })),
  );
  const succeeded: string[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    (r.status === "fulfilled" ? succeeded : failed).push(filenames[i]);
  });
  return { succeeded, failed };
}

/** Test-only: clear the per-(lang, contentVersion) pack-manifest memoization. */
export function __resetContentPackLoaderForTests(): void {
  manifestPromises.clear();
}
