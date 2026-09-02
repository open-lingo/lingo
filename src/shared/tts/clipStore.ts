/**
 * Persistent, bounded store for TTS mp3 bytes — the offline half of audio.
 *
 * Lesson CONTENT already ships inside the app bundle, so a lesson's text,
 * grading and SRS all work with no network. The one remote dependency is the
 * audio, which lives on the CDN. Caching a module's clips here is therefore
 * the whole of "download this module for offline".
 *
 * ── Why not DRM ────────────────────────────────────────────────────────────
 * FairPlay/Widevine exist so a distributor can satisfy a studio's licensing
 * terms. These are our own generated TTS clips, already served from a public
 * CDN — encrypting them would add a licence server and EME plumbing to protect
 * something with no resale value. Deliberately not done.
 *
 * ── Storage choice ─────────────────────────────────────────────────────────
 * IndexedDB rather than the Capacitor Filesystem plugin: it works identically
 * on web (PWA offline) and in WKWebView, needs no native dependency, and keeps
 * the bytes inside WebKit's own storage — which sits under `Library/` and is
 * evictable by the OS under storage pressure. That matters for App Review:
 * Apple rejects apps that fill a user's iCloud backup with re-downloadable
 * content, and a bounded, OS-evictable cache is the shape they ask for.
 *
 * The cap and LRU are the substance here. An unbounded cache of a 30-module
 * course is hundreds of MB; a cache that evicts the wrong clips is worse than
 * none, because it re-fetches exactly what the learner is drilling.
 */

/** One stored clip plus the metadata eviction needs. */
export type ClipRecord = {
  key: string;
  buf: ArrayBuffer;
  size: number;
  lastUsed: number;
};

/**
 * Storage backend. Injectable so the eviction policy is unit-tested against a
 * plain map rather than against happy-dom's partial IndexedDB — same
 * convention as `NativeSpeechPlugin` / `WhisperWorkerFactory`.
 */
export type ClipStoreAdapter = {
  get(key: string): Promise<ClipRecord | null>;
  put(rec: ClipRecord): Promise<void>;
  delete(key: string): Promise<void>;
  entries(): Promise<ClipRecord[]>;
};

export type ClipStore = {
  get(key: string): Promise<ArrayBuffer | null>;
  put(key: string, buf: ArrayBuffer): Promise<void>;
  bytes(): Promise<number>;
  clear(): Promise<void>;
};

const DB_NAME = "open-lingo-clips";
const STORE = "clips";

/**
 * IndexedDB adapter. Returns `null` when IDB is unavailable (private mode,
 * blocked storage, a test environment without it) so callers fall back to the
 * in-memory adapter and simply lose persistence.
 */
export function idbAdapter(): ClipStoreAdapter | null {
  if (typeof indexedDB === "undefined") return null;

  let dbPromise: Promise<IDBDatabase> | null = null;
  function open(): Promise<IDBDatabase> {
    dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "key" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T> {
    return open().then(
      (db) =>
        new Promise<T>((resolve, reject) => {
          const t = db.transaction(STORE, mode);
          const req = run(t.objectStore(STORE));
          req.onsuccess = () => resolve(req.result as T);
          req.onerror = () => reject(req.error);
        }),
    );
  }

  return {
    get: (key) => tx<ClipRecord | undefined>("readonly", (s) => s.get(key)).then((r) => r ?? null),
    put: (rec) => tx<unknown>("readwrite", (s) => s.put(rec)).then(() => undefined),
    delete: (key) => tx<unknown>("readwrite", (s) => s.delete(key)).then(() => undefined),
    entries: () => tx<ClipRecord[]>("readonly", (s) => s.getAll()).then((r) => r ?? []),
  };
}

/** The app-wide store: persistent where possible, in-memory otherwise. */
let sharedStore: ClipStore | null = null;
export function getClipStore(): ClipStore {
  sharedStore ??= createClipStore({ adapter: idbAdapter() ?? memoryAdapter() });
  return sharedStore;
}

/** In-memory adapter — used by tests, and as the fallback when IDB is absent. */
export function memoryAdapter(): ClipStoreAdapter {
  const map = new Map<string, ClipRecord>();
  return {
    get: async (k) => map.get(k) ?? null,
    put: async (rec) => void map.set(rec.key, rec),
    delete: async (k) => void map.delete(k),
    entries: async () => [...map.values()],
  };
}

/**
 * Monotonic counter instead of `Date.now()` for recency.
 *
 * Two clips written inside the same millisecond would otherwise tie, and the
 * eviction order would fall back to insertion order — which is precisely the
 * case a bulk module download creates.
 */
let useCounter = 0;

export type CreateClipStoreOptions = {
  adapter?: ClipStoreAdapter;
  /** Hard ceiling on total stored bytes. Default 120 MB. */
  maxBytes?: number;
};

export function createClipStore(options: CreateClipStoreOptions = {}): ClipStore {
  const { adapter = memoryAdapter(), maxBytes = 120 * 1024 * 1024 } = options;

  // Every method swallows adapter failures. Caching is an optimisation: a full
  // disk or a blocked storage API must degrade to "fetch from network", never
  // to "audio is broken". This is the same reasoning as
  // `progressSnapshotCache`.
  async function safeEntries(): Promise<ClipRecord[]> {
    try {
      return await adapter.entries();
    } catch {
      return [];
    }
  }

  async function evictTo(limit: number): Promise<void> {
    const all = await safeEntries();
    let total = all.reduce((n, r) => n + r.size, 0);
    if (total <= limit) return;
    // Oldest use first.
    all.sort((a, b) => a.lastUsed - b.lastUsed);
    for (const rec of all) {
      if (total <= limit) break;
      try {
        await adapter.delete(rec.key);
        total -= rec.size;
      } catch {
        /* leave it; the next put will try again */
      }
    }
  }

  return {
    async get(key) {
      try {
        const rec = await adapter.get(key);
        if (!rec) return null;
        // A read counts as a use, so a clip the learner keeps replaying is not
        // evicted just because it was written early in a bulk download.
        await adapter.put({ ...rec, lastUsed: ++useCounter });
        return rec.buf;
      } catch {
        return null;
      }
    },

    async put(key, buf) {
      try {
        const size = buf.byteLength;
        // A single clip bigger than the whole budget would evict everything
        // and still not fit. Refuse rather than thrash.
        if (size > maxBytes) return;
        await adapter.put({ key, buf, size, lastUsed: ++useCounter });
        await evictTo(maxBytes);
      } catch {
        /* storage full or unavailable — nothing to do */
      }
    },

    async bytes() {
      const all = await safeEntries();
      return all.reduce((n, r) => n + r.size, 0);
    },

    async clear() {
      for (const rec of await safeEntries()) {
        try {
          await adapter.delete(rec.key);
        } catch {
          /* ignore */
        }
      }
    },
  };
}
