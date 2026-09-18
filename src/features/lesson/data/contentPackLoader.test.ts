import { beforeEach, describe, expect, it } from "vitest";
import {
  ContentPackSchemaError,
  SUPPORTED_PACK_SCHEMA,
  ensurePackManifest,
  loadPackFile,
  prefetchPackFiles,
  getPackBaseUrl,
  __resetContentPackLoaderForTests,
  type PackManifest,
} from "./contentPackLoader";
import type { CachedPackStore } from "./contentPackCache";

function fakeStore(initial: Record<string, ArrayBuffer> = {}): CachedPackStore & {
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

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function jsonBytes(obj: unknown): ArrayBuffer {
  const s = JSON.stringify(obj);
  return new TextEncoder().encode(s).buffer as ArrayBuffer;
}

const LANG = "ja";
const VERSION = "deadbeef01";
const BASE_URL = getPackBaseUrl(VERSION, LANG);
const MANIFEST_URL = `${BASE_URL}manifest.json`;

async function buildManifest(files: Record<string, ArrayBuffer>): Promise<PackManifest> {
  const entries: PackManifest["files"] = {};
  for (const [name, bytes] of Object.entries(files)) {
    entries[name] = { sha256: await sha256Hex(bytes), bytes: bytes.byteLength };
  }
  return {
    schemaVersion: SUPPORTED_PACK_SCHEMA,
    contentVersion: VERSION,
    lang: LANG,
    modules: Object.keys(files).map((f) => ({ id: f, file: f, lessons: [] })),
    files: entries,
  };
}

beforeEach(() => {
  __resetContentPackLoaderForTests();
});

describe("ensurePackManifest", () => {
  it("fetches, parses, and memoizes the manifest per (lang, contentVersion)", async () => {
    const manifest = await buildManifest({ "m4.json": jsonBytes({ lessons: [] }) });
    let calls = 0;
    const fetchRaw = async (url: string) => {
      calls += 1;
      expect(url).toBe(MANIFEST_URL);
      return jsonBytes(manifest);
    };
    const a = await ensurePackManifest(LANG, VERSION, fetchRaw);
    const b = await ensurePackManifest(LANG, VERSION, fetchRaw);
    expect(a).toEqual(manifest);
    expect(b).toEqual(manifest);
    expect(calls).toBe(1); // memoized — second call did not refetch
  });

  it("throws ContentPackSchemaError for a schema newer than this build understands, and does not memoize the rejection", async () => {
    const tooNew = await buildManifest({});
    tooNew.schemaVersion = SUPPORTED_PACK_SCHEMA + 1;
    let calls = 0;
    const fetchRaw = async () => {
      calls += 1;
      return jsonBytes(tooNew);
    };
    await expect(ensurePackManifest(LANG, VERSION, fetchRaw)).rejects.toBeInstanceOf(
      ContentPackSchemaError,
    );
    // A retry is attempted fresh, not short-circuited on a cached rejection.
    await expect(ensurePackManifest(LANG, VERSION, fetchRaw)).rejects.toBeInstanceOf(
      ContentPackSchemaError,
    );
    expect(calls).toBe(2);
  });

  it("a network failure propagates and is not memoized (retry hits the network again)", async () => {
    let calls = 0;
    const fetchRaw = async () => {
      calls += 1;
      throw new Error("simulated network failure");
    };
    await expect(ensurePackManifest(LANG, VERSION, fetchRaw)).rejects.toThrow(
      "simulated network failure",
    );
    await expect(ensurePackManifest(LANG, VERSION, fetchRaw)).rejects.toThrow();
    expect(calls).toBe(2);
  });
});

describe("loadPackFile", () => {
  it("throws for a filename not in the pack manifest — never fetches or caches an unverifiable name", async () => {
    const manifest = await buildManifest({ "m4.json": jsonBytes({ lessons: [] }) });
    const store = fakeStore();
    const fetchRaw = async (url: string) => (url === MANIFEST_URL ? jsonBytes(manifest) : jsonBytes({}));
    await expect(
      loadPackFile({ lang: LANG, contentVersion: VERSION, filename: "m99.json", fetchRaw, store }),
    ).rejects.toThrow(/not in the pack manifest/);
  });

  it("cache MISS + fresh fetch matching the manifest hash: verifies, caches, and returns parsed JSON", async () => {
    const body = { lessons: [{ id: "ja-m4-l1" }] };
    const bytes = jsonBytes(body);
    const manifest = await buildManifest({ "m4.json": bytes });
    const store = fakeStore();
    const calls: string[] = [];
    const fetchRaw = async (url: string) => {
      calls.push(url);
      return url === MANIFEST_URL ? jsonBytes(manifest) : bytes;
    };
    const result = await loadPackFile<typeof body>({
      lang: LANG,
      contentVersion: VERSION,
      filename: "m4.json",
      fetchRaw,
      store,
    });
    expect(result).toEqual(body);
    expect(calls).toEqual([MANIFEST_URL, `${BASE_URL}m4.json`]);
    expect(store.setCalls).toEqual([`${BASE_URL}m4.json`]);
  });

  it("fresh fetch that doesn't match the manifest hash: throws, never caches the bad bytes", async () => {
    const real = jsonBytes({ lessons: [] });
    const manifest = await buildManifest({ "m4.json": real });
    const wrong = jsonBytes({ lessons: ["tampered"] });
    const store = fakeStore();
    const fetchRaw = async (url: string) => (url === MANIFEST_URL ? jsonBytes(manifest) : wrong);
    await expect(
      loadPackFile({ lang: LANG, contentVersion: VERSION, filename: "m4.json", fetchRaw, store }),
    ).rejects.toThrow(/hash mismatch/);
    expect(store.setCalls).toEqual([]);
  });

  it("cache HIT with bytes matching the manifest hash: returns parsed JSON WITHOUT refetching the file (manifest is still fetched once)", async () => {
    const body = { lessons: [{ id: "ja-m4-l1" }] };
    const bytes = jsonBytes(body);
    const manifest = await buildManifest({ "m4.json": bytes });
    const store = fakeStore({ [`${BASE_URL}m4.json`]: bytes });
    const fileFetches: string[] = [];
    const fetchRaw = async (url: string) => {
      if (url === MANIFEST_URL) return jsonBytes(manifest);
      fileFetches.push(url);
      throw new Error("must not fetch the file on a cache hit");
    };
    const result = await loadPackFile<typeof body>({
      lang: LANG,
      contentVersion: VERSION,
      filename: "m4.json",
      fetchRaw,
      store,
    });
    expect(result).toEqual(body);
    expect(fileFetches).toEqual([]);
  });

  it("corrupt cache entry (hash mismatch) + fresh fetch succeeds: evicts, refetches, recovers", async () => {
    const real = jsonBytes({ lessons: [{ id: "real" }] });
    const manifest = await buildManifest({ "m4.json": real });
    const store = fakeStore({ [`${BASE_URL}m4.json`]: jsonBytes({ lessons: ["stale"] }) });
    const fetchRaw = async (url: string) => (url === MANIFEST_URL ? jsonBytes(manifest) : real);
    const result = await loadPackFile({
      lang: LANG,
      contentVersion: VERSION,
      filename: "m4.json",
      fetchRaw,
      store,
    });
    expect(store.deletedKeys).toEqual([`${BASE_URL}m4.json`]);
    expect(result).toEqual({ lessons: [{ id: "real" }] });
  });

  it("a schema-newer-than-understood manifest propagates ContentPackSchemaError from loadPackFile too", async () => {
    const tooNew = await buildManifest({ "m4.json": jsonBytes({}) });
    tooNew.schemaVersion = SUPPORTED_PACK_SCHEMA + 5;
    const store = fakeStore();
    const fetchRaw = async (url: string) => (url === MANIFEST_URL ? jsonBytes(tooNew) : jsonBytes({}));
    await expect(
      loadPackFile({ lang: LANG, contentVersion: VERSION, filename: "m4.json", fetchRaw, store }),
    ).rejects.toBeInstanceOf(ContentPackSchemaError);
  });
});

describe("prefetchPackFiles", () => {
  it("attempts every manifest file and reports success/failure per file independently", async () => {
    const good = jsonBytes({ lessons: [] });
    const manifest = await buildManifest({ "m4.json": good, "m5.json": good, "m6.json": good });
    const store = fakeStore();
    const fetchRaw = async (url: string) => {
      if (url === MANIFEST_URL) return jsonBytes(manifest);
      if (url.endsWith("m5.json")) return jsonBytes({ tampered: true }); // wrong hash
      return good;
    };
    const results = await prefetchPackFiles(LANG, VERSION, fetchRaw, store);
    expect(results.succeeded.sort()).toEqual(["m4.json", "m6.json"]);
    expect(results.failed).toEqual(["m5.json"]);
  });
});
