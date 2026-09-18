/**
 * Persistent, hash-verified cache for CDN-fetched content-pack module
 * files (docs/content-packs-2026-09-18.md).
 *
 * Same MECHANISM as the kuromoji dictionary cache
 * (`src/features/languages/ja/readingAnnotation/dictCache.ts`, phase 1 of
 * this cache pattern, docs/dictionary-lazy-load-2026-09-18.md) — the
 * Cache Storage API (`caches.open`/`.match`/`.put`), used identically on
 * web AND native, because `@capacitor/filesystem` is still not a current
 * dependency. This is a SEPARATE named cache (`openlingo-content-packs-v1`
 * vs. `openlingo-dict-v1`), not the literal same cache object — a
 * dictionary blob and a lesson-content pack are different resources with
 * different eviction/versioning lifetimes (a dict format bump and a
 * content-schema bump are independent events), and Cache Storage's own
 * per-cache `expiration`/inspection tooling (and the service worker's own
 * `lesson-content` workbox cache, see the design doc's "why not the SW
 * alone" section) already assumes one cache = one resource family. The
 * STORE INTERFACE and every failure-mode decision below are copied
 * verbatim from `dictCache.ts` on purpose — one proven mechanism, reused
 * twice, not reinvented.
 *
 * Fails safe in every direction, identically to `dictCache.ts`: no
 * `caches` global, a `caches.open` throw, a full disk — every operation is
 * a silent no-op; the caller re-fetches from the network every time. A
 * corrupt/tampered cached entry (hash mismatch against the pack's OWN
 * fetched manifest, see `contentPackLoader.ts`) is deleted and treated as
 * a miss, never served.
 */

export interface CachedPackStore {
  get(key: string): Promise<ArrayBuffer | null>;
  set(key: string, bytes: ArrayBuffer): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Versioned so a future pack-file format change gets a clean cache, not stale entries. */
export const CONTENT_PACK_CACHE_NAME = "openlingo-content-packs-v1";

/** `store.get` on a store with no cached entry, or `caches` itself unavailable. */
export function noopPackStore(): CachedPackStore {
  return {
    async get() {
      return null;
    },
    async set() {
      /* no-op */
    },
    async delete() {
      /* no-op */
    },
  };
}

/**
 * The real Cache Storage-backed store. Every method swallows its own
 * errors and degrades to "no cache" — this must never be the reason a
 * content-pack fetch fails.
 */
export function cacheStoragePackStore(
  cacheName: string = CONTENT_PACK_CACHE_NAME,
): CachedPackStore {
  return {
    async get(key) {
      if (typeof caches === "undefined") return null;
      try {
        const cache = await caches.open(cacheName);
        const hit = await cache.match(key);
        if (!hit) return null;
        return await hit.arrayBuffer();
      } catch {
        return null;
      }
    },
    async set(key, bytes) {
      if (typeof caches === "undefined") return;
      try {
        const cache = await caches.open(cacheName);
        await cache.put(key, new Response(bytes));
      } catch {
        /* best effort — an uncached fetch next time is not fatal */
      }
    },
    async delete(key) {
      if (typeof caches === "undefined") return;
      try {
        const cache = await caches.open(cacheName);
        await cache.delete(key);
      } catch {
        /* best effort */
      }
    },
  };
}

/** The store the app actually uses — swapped for a fake in tests. */
export function getPackStore(): CachedPackStore {
  return typeof caches === "undefined" ? noopPackStore() : cacheStoragePackStore();
}

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
