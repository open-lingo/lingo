import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadDictFile, prefetchAllDictFiles, DICT_FILENAMES } from "./dictLoader";
import type { CachedDictStore } from "./dictCache";

/** In-memory fake store — same shape as dictCache.ts's `CachedDictStore`. */
function fakeStore(initial: Record<string, ArrayBuffer> = {}): CachedDictStore & {
  deletedKeys: string[];
  setCalls: string[];
} {
  const map = new Map(Object.entries(initial));
  const deletedKeys: string[] = [];
  const setCalls: string[] = [];
  return {
    deletedKeys,
    setCalls,
    async get(key) {
      return map.get(key) ?? null;
    },
    async set(key, bytes) {
      setCalls.push(key);
      map.set(key, bytes);
    },
    async delete(key) {
      deletedKeys.push(key);
      map.delete(key);
    },
  };
}

async function gzip(text: string): Promise<ArrayBuffer> {
  const bytes = new TextEncoder().encode(text);
  return new Response(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip")),
  ).arrayBuffer();
}

const FIRST_FILE = DICT_FILENAMES[0]; // "base.dat.gz"
const BASE_URL = "https://cdn/dict/v1/";
const FIRST_FILE_URL = `${BASE_URL}${FIRST_FILE}`;

/**
 * The REAL gzip bytes for `FIRST_FILE`, read straight off disk
 * (`node_modules/kuromoji/dict/`, the same source
 * `generate-dict-manifest.mjs` hashed). Using the genuine bytes — not a
 * fabricated fixture — means the hash-verification happy path is
 * exercised against a real sha256 match, not a mocked one, the same way
 * `kuroshiro.native.test.ts` uses real gzip bytes for its round-trip.
 */
function readRealDictFileBytes(): ArrayBuffer {
  const repoRoot = join(import.meta.dirname, "..", "..", "..", "..", "..");
  const buf = readFileSync(join(repoRoot, "node_modules/kuromoji/dict", FIRST_FILE));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

describe("loadDictFile", () => {
  it("throws for a filename not in the manifest — never fetches or caches an unverifiable name", async () => {
    const store = fakeStore();
    await expect(
      loadDictFile("not-a-real-file.dat.gz", {
        dictBaseUrl: BASE_URL,
        fetchRaw: async () => new ArrayBuffer(0),
        store,
      }),
    ).rejects.toThrow(/not in the dict manifest/);
  });

  it("cache MISS + a fresh fetch that doesn't match the manifest hash: throws, and never caches the bad bytes", async () => {
    const store = fakeStore();
    const wrongBytes = await gzip("not-the-real-dict-file");
    const calls: string[] = [];
    await expect(
      loadDictFile(FIRST_FILE, {
        dictBaseUrl: BASE_URL,
        fetchRaw: async (url) => {
          calls.push(url);
          return wrongBytes;
        },
        store,
      }),
    ).rejects.toThrow(/hash mismatch/);
    expect(calls).toEqual([FIRST_FILE_URL]);
    expect(store.setCalls).toEqual([]);
  });

  it("cache MISS + a fresh fetch that matches the manifest hash: verifies, caches, and returns decompressed bytes", async () => {
    const store = fakeStore();
    const real = readRealDictFileBytes();
    const calls: string[] = [];
    const result = await loadDictFile(FIRST_FILE, {
      dictBaseUrl: BASE_URL,
      fetchRaw: async (url) => {
        calls.push(url);
        return real;
      },
      store,
    });
    expect(calls).toEqual([FIRST_FILE_URL]);
    expect(store.setCalls).toEqual([FIRST_FILE_URL]);
    // Decompressed output must be non-trivial (the real dict entry, not empty).
    expect(result.byteLength).toBeGreaterThan(1000);
  });

  it("cache HIT with bytes matching the manifest hash: returns decompressed bytes WITHOUT calling fetchRaw", async () => {
    const real = readRealDictFileBytes();
    const store = fakeStore({ [FIRST_FILE_URL]: real });
    let fetchRawCalled = false;
    const result = await loadDictFile(FIRST_FILE, {
      dictBaseUrl: BASE_URL,
      fetchRaw: async () => {
        fetchRawCalled = true;
        throw new Error("must not be called on a cache hit");
      },
      store,
    });
    expect(fetchRawCalled).toBe(false);
    expect(result.byteLength).toBeGreaterThan(1000);
  });

  it("corrupt cache entry (hash mismatch) + fresh fetch ALSO fails: evicts the bad entry, attempts a real refetch, and still throws", async () => {
    const store = fakeStore({ [FIRST_FILE_URL]: await gzip("stale-or-corrupted-entry") });
    const calls: string[] = [];
    await expect(
      loadDictFile(FIRST_FILE, {
        dictBaseUrl: BASE_URL,
        fetchRaw: async (url) => {
          calls.push(url);
          return gzip("also-wrong");
        },
        store,
      }),
    ).rejects.toThrow(/hash mismatch/);
    expect(store.deletedKeys).toEqual([FIRST_FILE_URL]);
    expect(calls).toEqual([FIRST_FILE_URL]);
  });

  it("corrupt cache entry (hash mismatch) + fresh fetch SUCCEEDS: evicts the bad entry, refetches, and recovers with correct bytes — this is the hash-mismatch-refetch path", async () => {
    const store = fakeStore({ [FIRST_FILE_URL]: await gzip("stale-or-corrupted-entry") });
    const real = readRealDictFileBytes();
    const calls: string[] = [];
    const result = await loadDictFile(FIRST_FILE, {
      dictBaseUrl: BASE_URL,
      fetchRaw: async (url) => {
        calls.push(url);
        return real;
      },
      store,
    });
    expect(store.deletedKeys).toEqual([FIRST_FILE_URL]);
    expect(calls).toEqual([FIRST_FILE_URL]);
    expect(store.setCalls).toEqual([FIRST_FILE_URL]); // recached with the good bytes
    expect(result.byteLength).toBeGreaterThan(1000);
  });

  it("a fetchRaw rejection (network failure) propagates — caller's degrade-path handles it — and nothing is cached", async () => {
    const store = fakeStore();
    await expect(
      loadDictFile(FIRST_FILE, {
        dictBaseUrl: BASE_URL,
        fetchRaw: async () => {
          throw new Error("simulated network failure");
        },
        store,
      }),
    ).rejects.toThrow("simulated network failure");
    expect(store.setCalls).toEqual([]);
  });
});

describe("prefetchAllDictFiles", () => {
  it("attempts every manifest file and reports success/failure per file independently", async () => {
    const store = fakeStore();
    let call = 0;
    const results = await prefetchAllDictFiles({
      dictBaseUrl: BASE_URL,
      fetchRaw: async () => {
        call += 1;
        // Every file fails verification (wrong content) in this test — the
        // point is that ALL 12 are attempted and none aborts the batch.
        return gzip(`wrong-content-${call}`);
      },
      store,
    });
    expect(call).toBe(DICT_FILENAMES.length);
    expect(results.succeeded).toEqual([]);
    expect(results.failed.sort()).toEqual([...DICT_FILENAMES].sort());
  });

  it("one file's persistent failure does not block the others from being attempted", async () => {
    const store = fakeStore();
    const attempted: string[] = [];
    await prefetchAllDictFiles({
      dictBaseUrl: BASE_URL,
      fetchRaw: async (url) => {
        attempted.push(url);
        throw new Error("simulated failure for " + url);
      },
      store,
    });
    expect(attempted.length).toBe(DICT_FILENAMES.length);
  });

  it("the REAL first file succeeds through the full batch when fetchRaw returns genuine bytes for it", async () => {
    const store = fakeStore();
    const real = readRealDictFileBytes();
    const results = await prefetchAllDictFiles({
      dictBaseUrl: BASE_URL,
      fetchRaw: async (url) => (url === FIRST_FILE_URL ? real : gzip("wrong")),
      store,
    });
    expect(results.succeeded).toContain(FIRST_FILE);
    expect(results.failed).not.toContain(FIRST_FILE);
  });
});
