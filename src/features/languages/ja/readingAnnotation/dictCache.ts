/**
 * Persistent, hash-verified cache for CDN-fetched kuromoji dictionary
 * files — the precondition A4c flagged before the CDN path could be
 * revisited (docs/perf-2026-09-17.md §1a: "a persistent on-device cache …
 * so the 15 MB is paid once per device, not once per cold init").
 *
 * Mechanism: the Cache Storage API (`caches.open`/`.match`/`.put`), used
 * identically on web AND native. The brief that opened this lane suggested
 * a per-platform split — Capacitor `Filesystem` on native, Cache Storage
 * on web — but `@capacitor/filesystem` is NOT a current dependency
 * (`package.json` has `@capacitor-community/speech-recognition` +
 * `@capacitor/{android,app,browser,core,ios}`, no `filesystem`), and this
 * lane was told not to add a dependency without saying so. Cache Storage
 * is a standard Web API already available inside Capacitor's WKWebView
 * (iOS) / system WebView (Android) shell without any native plugin — see
 * the design doc (`docs/dictionary-lazy-load-2026-09-18.md`) for the full
 * justification and the caveat: this lane could not verify Cache Storage
 * persistence under the `capacitor://localhost` origin on a real device
 * (no simulator/device run in this lane); the fallback if that check ever
 * fails is `@capacitor/filesystem` (~1 day to add + wire).
 *
 * Fails safe in every direction: no `caches` global (older WebView, a
 * private-browsing-style restriction, or a WebView that blocks Cache
 * Storage under a custom scheme) → every operation is a silent no-op, the
 * caller re-fetches from the network every time, exactly like today's
 * uncached CDN path. A corrupt/tampered cached entry (hash mismatch
 * against `src/shared/dict/manifest.json`) is deleted and treated as a
 * miss, never served.
 */

export interface CachedDictStore {
  get(key: string): Promise<ArrayBuffer | null>;
  set(key: string, bytes: ArrayBuffer): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Versioned so a future dict format change gets a clean cache, not stale entries. */
export const DICT_CACHE_NAME = "openlingo-dict-v1";

/** `store.get` on a store with no cached entry, or `caches` itself unavailable. */
export function noopDictStore(): CachedDictStore {
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
 * errors (a full disk, a WebView that throws on `caches.open` under a
 * custom scheme, a private-mode restriction) and degrades to "no cache" —
 * this must never be the reason a dictionary fetch fails.
 */
export function cacheStorageDictStore(
  cacheName: string = DICT_CACHE_NAME,
): CachedDictStore {
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
export function getDictStore(): CachedDictStore {
  return typeof caches === "undefined" ? noopDictStore() : cacheStorageDictStore();
}

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
