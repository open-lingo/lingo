import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cacheStorageDictStore,
  noopDictStore,
  sha256Hex,
  type CachedDictStore,
} from "./dictCache";

/** A minimal in-memory fake of the Cache Storage API's surface used here. */
function fakeCachesGlobal() {
  const stores = new Map<string, Map<string, ArrayBuffer>>();
  const caches = {
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const bucket = stores.get(name)!;
      return {
        match: async (key: string) => {
          const bytes = bucket.get(key);
          if (!bytes) return undefined;
          return { arrayBuffer: async () => bytes } as unknown as Response;
        },
        put: async (key: string, response: Response) => {
          bucket.set(key, await response.arrayBuffer());
        },
        delete: async (key: string) => {
          bucket.delete(key);
        },
      };
    },
  };
  return { caches, stores };
}

describe("sha256Hex", () => {
  it("hashes bytes to the expected hex digest", async () => {
    const bytes = new TextEncoder().encode("hello").buffer;
    // Known SHA-256 of "hello".
    await expect(sha256Hex(bytes)).resolves.toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });
});

describe("noopDictStore", () => {
  it("get always returns null, set/delete never throw", async () => {
    const store = noopDictStore();
    await expect(store.get("x")).resolves.toBeNull();
    await expect(store.set("x", new ArrayBuffer(1))).resolves.toBeUndefined();
    await expect(store.delete("x")).resolves.toBeUndefined();
    // set didn't actually persist anything
    await expect(store.get("x")).resolves.toBeNull();
  });
});

describe("cacheStorageDictStore", () => {
  let restoreCaches: (() => void) | undefined;

  beforeEach(() => {
    restoreCaches = undefined;
  });

  afterEach(() => {
    restoreCaches?.();
    vi.unstubAllGlobals();
  });

  it("miss: get returns null when nothing has been cached", async () => {
    const { caches } = fakeCachesGlobal();
    vi.stubGlobal("caches", caches);
    const store = cacheStorageDictStore("test-dict-v1");
    await expect(store.get("https://cdn/dict/v1/base.dat.gz")).resolves.toBeNull();
  });

  it("hit: set then get round-trips the exact bytes", async () => {
    const { caches } = fakeCachesGlobal();
    vi.stubGlobal("caches", caches);
    const store = cacheStorageDictStore("test-dict-v1");
    const original = new TextEncoder().encode("dict-fixture-bytes").buffer;

    await store.set("https://cdn/dict/v1/base.dat.gz", original);
    const back = await store.get("https://cdn/dict/v1/base.dat.gz");

    expect(back).not.toBeNull();
    expect(new TextDecoder().decode(back!)).toBe("dict-fixture-bytes");
  });

  it("delete removes a cached entry (subsequent get is a miss)", async () => {
    const { caches } = fakeCachesGlobal();
    vi.stubGlobal("caches", caches);
    const store = cacheStorageDictStore("test-dict-v1");
    await store.set("k", new TextEncoder().encode("x").buffer);
    await store.delete("k");
    await expect(store.get("k")).resolves.toBeNull();
  });

  it("get() degrades to null (not a throw) when caches.open itself throws", async () => {
    vi.stubGlobal("caches", {
      open: async () => {
        throw new Error("simulated WebView Cache Storage restriction");
      },
    });
    const store = cacheStorageDictStore("test-dict-v1");
    await expect(store.get("k")).resolves.toBeNull();
  });

  it("set() degrades to a silent no-op when caches.open throws — never rejects", async () => {
    vi.stubGlobal("caches", {
      open: async () => {
        throw new Error("simulated failure");
      },
    });
    const store = cacheStorageDictStore("test-dict-v1");
    await expect(
      store.set("k", new ArrayBuffer(1)),
    ).resolves.toBeUndefined();
  });

  it("entries in different cache names never collide", async () => {
    const { caches } = fakeCachesGlobal();
    vi.stubGlobal("caches", caches);
    const storeA = cacheStorageDictStore("dict-a");
    const storeB = cacheStorageDictStore("dict-b");
    await storeA.set("k", new TextEncoder().encode("from-a").buffer);
    await expect(storeB.get("k")).resolves.toBeNull();
  });
});

describe("getDictStore", () => {
  it("returns a store whose get() resolves to null (either backend, no throw) when `caches` is undefined", async () => {
    vi.stubGlobal("caches", undefined);
    const { getDictStore } = await import("./dictCache");
    const store: CachedDictStore = getDictStore();
    await expect(store.get("k")).resolves.toBeNull();
    vi.unstubAllGlobals();
  });
});
