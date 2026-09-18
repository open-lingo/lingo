/**
 * CDN dictionary-file loader: cache-first, hash-verified, gunzip on the
 * way out. Used by `kuroshiro.ts`'s patched kuromoji loader for BOTH
 * native (`fetchBinaryNative`/CapacitorHttp, to route around the CDN's
 * missing `Access-Control-Allow-Origin` under `capacitor://localhost` —
 * see that file's header) and web (plain `fetch`, same-origin CDN path,
 * no CORS gap).
 *
 * Flow per file:
 *   1. Look up the file's expected sha256 in the checked-in manifest
 *      (`src/shared/dict/manifest.json`, `scripts/build/
 *      generate-dict-manifest.mjs`). An unlisted filename is a hard
 *      error — never fetch or cache something this lane can't verify.
 *   2. Try the persistent cache (`dictCache.ts`). A hit is hash-verified
 *      again before use (defense against on-disk corruption, not just a
 *      bad network fetch) — a bad cached entry is deleted and treated as
 *      a miss, not served.
 *   3. On a miss, fetch raw bytes via the platform transport, verify the
 *      hash, and only THEN cache them. A fetch that returns the wrong
 *      bytes (corrupted CDN object, MITM, truncated transfer) throws
 *      instead of ever reaching kuromoji's parser or the persistent
 *      cache — this is the "blast radius of a bad CDN object" bound the
 *      design doc numbers: bad bytes are rejected, not served, and never
 *      poison the cache for the next cold start.
 *   4. Gunzip (the dict files are `.dat.gz`) and return the decompressed
 *      bytes — same shape kuromoji's own bundled loader already hands it.
 *
 * Any thrown error here is caught by `kuroshiro.ts`'s existing
 * graceful-degradation path (one console.warn, raw transcript returned,
 * no crash) — this module adds no new failure mode, only a new trigger
 * for the one that already exists.
 */
import manifest from "@/shared/dict/manifest.json";
import { getDictStore, sha256Hex, type CachedDictStore } from "./dictCache";

export type DictManifest = typeof manifest;

/** Every currently-published dict filename, in the order kuroshiro loads them. */
export const DICT_FILENAMES = Object.keys(manifest.files) as Array<
  keyof DictManifest["files"]
>;

async function gunzip(bytes: ArrayBuffer): Promise<ArrayBuffer> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DecompressionStream unavailable");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(
    new DecompressionStream("gzip"),
  );
  return await new Response(stream).arrayBuffer();
}

export interface LoadDictFileOptions {
  /** e.g. `https://cdn.example.com/dict/v1/` (trailing slash required). */
  dictBaseUrl: string;
  /** Raw byte fetch for one URL — native uses CapacitorHttp, web uses `fetch`. */
  fetchRaw: (url: string) => Promise<ArrayBuffer>;
  /** Injectable for tests; defaults to the real Cache-Storage-backed store. */
  store?: CachedDictStore;
}

/**
 * Loads one dictionary file (decompressed, hash-verified) by filename,
 * e.g. `"base.dat.gz"`. Cache-first; caches only bytes that verified.
 */
export async function loadDictFile(
  filename: string,
  { dictBaseUrl, fetchRaw, store = getDictStore() }: LoadDictFileOptions,
): Promise<ArrayBuffer> {
  const meta = (manifest.files as Record<string, { sha256: string; bytes: number }>)[
    filename
  ];
  if (!meta) {
    throw new Error(`loadDictFile: "${filename}" is not in the dict manifest`);
  }
  const url = `${dictBaseUrl}${filename}`;

  const cached = await store.get(url);
  if (cached) {
    const cachedHash = await sha256Hex(cached);
    if (cachedHash === meta.sha256) {
      return gunzip(cached);
    }
    // Corrupt/stale cached entry — never serve it. Fall through to refetch.
    await store.delete(url);
  }

  const fresh = await fetchRaw(url);
  const freshHash = await sha256Hex(fresh);
  if (freshHash !== meta.sha256) {
    throw new Error(
      `loadDictFile: hash mismatch for "${filename}" — expected ${meta.sha256}, got ${freshHash}`,
    );
  }
  // Best-effort cache write; loadDictFile still returns the verified bytes
  // even if caching itself fails (dictCache.ts swallows its own errors).
  await store.set(url, fresh);
  return gunzip(fresh);
}

/**
 * Warms the persistent cache for every dict file without decompressing
 * or returning anything — used by the prefetch trigger
 * (`dictPrefetch.ts`), which wants bytes ON DISK before grading needs
 * them, not a return value. Each file is independent: one failure (a
 * flaky network blip on file 7 of 12) doesn't abort the rest.
 */
export async function prefetchAllDictFiles(
  opts: Omit<LoadDictFileOptions, "store"> & { store?: CachedDictStore },
): Promise<{ succeeded: string[]; failed: string[] }> {
  const store = opts.store ?? getDictStore();
  const results = await Promise.allSettled(
    DICT_FILENAMES.map((name) => loadDictFile(name, { ...opts, store })),
  );
  const succeeded: string[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    (r.status === "fulfilled" ? succeeded : failed).push(DICT_FILENAMES[i]);
  });
  return { succeeded, failed };
}
