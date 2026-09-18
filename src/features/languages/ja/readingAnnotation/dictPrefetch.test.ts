import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  dictFromCdn: true,
  cdnBaseUrl: "https://cdn.example.com/dict/v1/",
};

vi.mock("./kuroshiro", () => ({
  isDictFromCdn: () => state.dictFromCdn,
  getDictCdnBaseUrl: () => state.cdnBaseUrl,
  getDictFetchRaw: async () => async (_url: string) => new ArrayBuffer(0),
}));

vi.mock("./dictCache", () => ({
  getDictStore: () => ({
    get: async () => null,
    set: async () => {},
    delete: async () => {},
  }),
}));

const prefetchAllDictFilesMock = vi.fn(async (_opts: unknown) => ({
  succeeded: [],
  failed: [],
}));
vi.mock("./dictLoader", () => ({
  prefetchAllDictFiles: (opts: unknown) => prefetchAllDictFilesMock(opts),
}));

beforeEach(() => {
  state.dictFromCdn = true;
  state.cdnBaseUrl = "https://cdn.example.com/dict/v1/";
  prefetchAllDictFilesMock.mockClear();
});

afterEach(() => {
  vi.resetModules();
});

/** Wait a tick so the fire-and-forget async IIFE inside triggerDictPrefetch runs. */
async function flush() {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

describe("triggerDictPrefetch", () => {
  it("does nothing for a non-JA course, even past the threshold module", async () => {
    const { triggerDictPrefetch } = await import("./dictPrefetch");
    triggerDictPrefetch("es", 10);
    await flush();
    expect(prefetchAllDictFilesMock).not.toHaveBeenCalled();
  });

  it("does nothing when the CDN-lazy path isn't active (dictionary.lazy off, or no CDN base)", async () => {
    state.dictFromCdn = false;
    const { triggerDictPrefetch } = await import("./dictPrefetch");
    triggerDictPrefetch("ja", 10);
    await flush();
    expect(prefetchAllDictFilesMock).not.toHaveBeenCalled();
  });

  it("does nothing below DICT_PREFETCH_MODULE", async () => {
    const { triggerDictPrefetch, DICT_PREFETCH_MODULE } = await import("./dictPrefetch");
    triggerDictPrefetch("ja", DICT_PREFETCH_MODULE - 1);
    await flush();
    expect(prefetchAllDictFilesMock).not.toHaveBeenCalled();
  });

  it("fires for a JA course at/above DICT_PREFETCH_MODULE with the CDN path active", async () => {
    const { triggerDictPrefetch, DICT_PREFETCH_MODULE } = await import("./dictPrefetch");
    triggerDictPrefetch("ja", DICT_PREFETCH_MODULE);
    await flush();
    expect(prefetchAllDictFilesMock).toHaveBeenCalledTimes(1);
    expect(prefetchAllDictFilesMock).toHaveBeenCalledWith(
      expect.objectContaining({ dictBaseUrl: state.cdnBaseUrl }),
    );
  });

  it("DICT_PREFETCH_MODULE is 1 — the corrected earliest-need module, not the brief's module-6 assumption (see file header)", async () => {
    const { DICT_PREFETCH_MODULE } = await import("./dictPrefetch");
    expect(DICT_PREFETCH_MODULE).toBe(1);
  });

  it("is memoized: a second qualifying call in the same session does not refire the prefetch", async () => {
    const { triggerDictPrefetch, DICT_PREFETCH_MODULE } = await import("./dictPrefetch");
    triggerDictPrefetch("ja", DICT_PREFETCH_MODULE);
    triggerDictPrefetch("ja", DICT_PREFETCH_MODULE + 3);
    await flush();
    expect(prefetchAllDictFilesMock).toHaveBeenCalledTimes(1);
  });

  it("__resetDictPrefetchForTests allows a fresh prefetch in a later test/session", async () => {
    const { triggerDictPrefetch, __resetDictPrefetchForTests, DICT_PREFETCH_MODULE } =
      await import("./dictPrefetch");
    triggerDictPrefetch("ja", DICT_PREFETCH_MODULE);
    await flush();
    __resetDictPrefetchForTests();
    triggerDictPrefetch("ja", DICT_PREFETCH_MODULE);
    await flush();
    expect(prefetchAllDictFilesMock).toHaveBeenCalledTimes(2);
  });
});
