import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cacheStoragePackStore,
  noopPackStore,
  sha256Hex,
  type CachedPackStore,
} from "./contentPackCache";

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
    await expect(sha256Hex(bytes)).resolves.toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });
});

describe("noopPackStore", () => {
  it("get always returns null, set/delete never throw", async () => {
    const store = noopPackStore();
    await expect(store.get("x")).resolves.toBeNull();
    await expect(store.set("x", new ArrayBuffer(1))).resolves.toBeUndefined();
    await expect(store.delete("x")).resolves.toBeUndefined();
    await expect(store.get("x")).resolves.toBeNull();
  });
});

describe("cacheStoragePackStore", () => {
  beforeEach(() => {
    /* nothing to set up — each test stubs its own `caches` global */
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("miss: get returns null when nothing has been cached", async () => {
    const { caches } = fakeCachesGlobal();
    vi.stubGlobal("caches", caches);
    const store = cacheStoragePackStore("test-content-packs-v1");
    await expect(store.get("https://cdn/content/v2/abc/ja/m4.json")).resolves.toBeNull();
  });

  it("hit: set then get round-trips the exact bytes", async () => {
    const { caches } = fakeCachesGlobal();
    vi.stubGlobal("caches", caches);
    const store = cacheStoragePackStore("test-content-packs-v1");
    const original = new TextEncoder().encode("pack-fixture-bytes").buffer;

    await store.set("https://cdn/content/v2/abc/ja/m4.json", original);
    const back = await store.get("https://cdn/content/v2/abc/ja/m4.json");

    expect(back).not.toBeNull();
    expect(new TextDecoder().decode(back!)).toBe("pack-fixture-bytes");
  });

  it("delete removes a cached entry (subsequent get is a miss)", async () => {
    const { caches } = fakeCachesGlobal();
    vi.stubGlobal("caches", caches);
    const store = cacheStoragePackStore("test-content-packs-v1");
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
    const store = cacheStoragePackStore("test-content-packs-v1");
    await expect(store.get("k")).resolves.toBeNull();
  });

  it("set() degrades to a silent no-op when caches.open throws — never rejects", async () => {
    vi.stubGlobal("caches", {
      open: async () => {
        throw new Error("simulated failure");
      },
    });
    const store = cacheStoragePackStore("test-content-packs-v1");
    await expect(store.set("k", new ArrayBuffer(1))).resolves.toBeUndefined();
  });

  it("entries in different cache names never collide, and never collide with the dict cache's name", async () => {
    const { caches } = fakeCachesGlobal();
    vi.stubGlobal("caches", caches);
    const storeA = cacheStoragePackStore("content-packs-a");
    const storeB = cacheStoragePackStore("openlingo-dict-v1");
    await storeA.set("k", new TextEncoder().encode("from-a").buffer);
    await expect(storeB.get("k")).resolves.toBeNull();
  });
});

describe("getPackStore", () => {
  it("returns a store whose get() resolves to null (either backend, no throw) when `caches` is undefined", async () => {
    vi.stubGlobal("caches", undefined);
    const { getPackStore } = await import("./contentPackCache");
    const store: CachedPackStore = getPackStore();
    await expect(store.get("k")).resolves.toBeNull();
    vi.unstubAllGlobals();
  });
});
