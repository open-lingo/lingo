/**
 * Perf review 2026-09-17 (docs/perf-2026-09-17.md §1, lane A4b/A4c) + dict
 * lazy-load lane 2026-09-18 (docs/dictionary-lazy-load-2026-09-18.md) —
 * tests for `kuroshiro.ts`'s CDN-aware `DICT_PATH` resolution and the
 * cache-first, hash-verified dict-loader patch.
 *
 * A4c (2026-09-17): the CDN path is gated behind TWO signals, both
 * required — `VITE_DICT_FROM_CDN === "1"` AND `VITE_ASSET_BASE_URL` — not
 * `VITE_ASSET_BASE_URL` alone. Reason: the shipped `.env.native` sets
 * `VITE_ASSET_BASE_URL` to the TTS CDN host for an unrelated reason, so an
 * alone-check would silently switch every native install onto a network
 * fetch of the 15 MB dict with no persistent cache. Every case below is
 * parameterized over both to prove the gate is a genuine AND, not either
 * alone. (`VITE_DICT_FROM_CDN` itself is now auto-derived at build time
 * from `dictionary.lazy` in `src/pub/feature-flags.json` — see
 * `scripts/build/readDictLazyFlag.mjs` and `vite.config.ts` — but this
 * module still reads it as a plain `import.meta.env` var, so stubbing it
 * directly here is unaffected by where the value ultimately comes from.)
 *
 * 2026-09-18: the patch now applies on WEB too, not just native — the
 * default kuromoji loader has no persistent cache or hash verification on
 * EITHER platform, and the CDN fetch is same-origin on web (no CORS gap,
 * so no CapacitorHttp detour needed there; a plain `fetch` is used
 * instead). Round-trip cases below use the REAL kuromoji dict bytes
 * (`node_modules/kuromoji/dict/base.dat.gz`) so the hash-verification
 * step in `dictLoader.ts` is genuinely exercised, not bypassed by a fixture
 * whose hash was never checked.
 *
 * Separate file from `kuroshiro.test.ts` because these cases need
 * `vi.resetModules()` + a dynamic re-import per test (module-level `const
 * ASSET_BASE`/`IS_NATIVE` are read once at evaluation time, so an env stub
 * only takes effect on a fresh module instance) — mixing that with the
 * existing file's static top-of-file mocks would make both harder to read.
 */
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Real gzip bytes for `base.dat.gz`, read off disk — the same source
 * `scripts/build/generate-dict-manifest.mjs` hashed into
 * `src/shared/dict/manifest.json`, so a fetch that returns these bytes
 * passes `dictLoader.ts`'s sha256 check for real, not via a mock.
 */
// Memoized — this file's suite re-reads it across several tests, and
// `beforeEach`'s `vi.resetModules()` already makes every test slow enough
// (fresh dynamic imports of kuroshiro + kuromoji per test) without also
// re-reading + re-slicing a ~4 MB file from disk each time.
let realBaseDatGzCache: ArrayBuffer | null = null;
function realBaseDatGz(): ArrayBuffer {
  if (!realBaseDatGzCache) {
    const repoRoot = join(import.meta.dirname, "..", "..", "..", "..", "..");
    const buf = readFileSync(join(repoRoot, "node_modules/kuromoji/dict/base.dat.gz"));
    realBaseDatGzCache = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    ) as ArrayBuffer;
  }
  return realBaseDatGzCache;
}

const state = {
  isNative: false,
  fetchBinaryNativeCalls: [] as string[],
  fetchBinaryNativeImpl: async (_url: string): Promise<ArrayBuffer> => {
    throw new Error("fetchBinaryNative not stubbed for this test");
  },
  capturedDictPath: undefined as string | undefined,
};

vi.mock("@/shared/platform/native", () => ({
  get IS_NATIVE() {
    return state.isNative;
  },
}));

vi.mock("@/shared/platform/nativeHttp", () => ({
  fetchBinaryNative: (url: string) => {
    state.fetchBinaryNativeCalls.push(url);
    return state.fetchBinaryNativeImpl(url);
  },
}));

vi.mock("kuroshiro", () => {
  class FakeKuroshiro {
    async init(analyzer: { init: () => Promise<void> }) {
      await analyzer.init();
    }
    async convert(str: string) {
      return str;
    }
  }
  return { default: FakeKuroshiro };
});

vi.mock("kuroshiro-analyzer-kuromoji", () => {
  class FakeAnalyzer {
    constructor(opts: { dictPath?: string }) {
      state.capturedDictPath = opts.dictPath;
    }
    async init() {
      /* no-op — dict loading itself isn't exercised through this fake */
    }
  }
  return { default: FakeAnalyzer };
});

// A minimal fake matching the ONE method `patchNativeDictLoaderOnce`
// touches. `prototype` is a plain mutable object, same shape as the real
// kuromoji class the patch targets.
const fakeBrowserDictionaryLoader = {
  prototype: {
    loadArrayBuffer: (
      _url: string,
      _cb: (err: unknown, buf: ArrayBuffer | null) => void,
    ) => {
      throw new Error("stock loader should have been replaced by the patch");
    },
  },
};
vi.mock("kuromoji/src/loader/BrowserDictionaryLoader.js", () => ({
  default: fakeBrowserDictionaryLoader,
}));

beforeEach(() => {
  vi.resetModules();
  state.isNative = false;
  state.fetchBinaryNativeCalls = [];
  state.capturedDictPath = undefined;
  fakeBrowserDictionaryLoader.prototype.loadArrayBuffer = () => {
    throw new Error("stock loader should have been replaced by the patch");
  };
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DICT_PATH resolution", () => {
  it("defaults to the locally-bundled /dict/ path when both env vars are unset (web, and any native build before the CDN copy is published)", async () => {
    vi.stubEnv("VITE_ASSET_BASE_URL", "");
    vi.stubEnv("VITE_DICT_FROM_CDN", "");
    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");
    expect(state.capturedDictPath).toBe("/dict/");
  });

  it("stays on the bundled /dict/ path when VITE_ASSET_BASE_URL is set but VITE_DICT_FROM_CDN is unset — the base alone is not a safe CDN signal (it's set to the TTS host in .env.native for an unrelated reason)", async () => {
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com");
    vi.stubEnv("VITE_DICT_FROM_CDN", "");
    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");
    expect(state.capturedDictPath).toBe("/dict/");
  });

  it("stays on the bundled /dict/ path when VITE_DICT_FROM_CDN is \"1\" but VITE_ASSET_BASE_URL is unset — nowhere to fetch from", async () => {
    vi.stubEnv("VITE_ASSET_BASE_URL", "");
    vi.stubEnv("VITE_DICT_FROM_CDN", "1");
    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");
    expect(state.capturedDictPath).toBe("/dict/");
  });

  it("points at the CDN base + versioned /dict/v1/ prefix when both VITE_DICT_FROM_CDN=\"1\" and VITE_ASSET_BASE_URL are set", async () => {
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com");
    vi.stubEnv("VITE_DICT_FROM_CDN", "1");
    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");
    expect(state.capturedDictPath).toBe("https://app.openlingoapp.com/dict/v1/");
  });

  it("strips a trailing slash from VITE_ASSET_BASE_URL before appending /dict/v1/ (both env vars set)", async () => {
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com/");
    vi.stubEnv("VITE_DICT_FROM_CDN", "1");
    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");
    expect(state.capturedDictPath).toBe("https://app.openlingoapp.com/dict/v1/");
  });
});

describe("dict-loader patch", () => {
  // The fake analyzer (`kuroshiro-analyzer-kuromoji` mock above) never
  // itself invokes `loadArrayBuffer` — it's a stand-in for kuroshiro's own
  // init flow, not for kuromoji's dictionary loading. So "was the patch
  // installed" is checked by whether `loadArrayBuffer` was REPLACED, not by
  // whether it happened to be called — and the round-trip (job 2 below) is
  // proven by invoking the replaced function directly.

  it("is NOT installed on web when VITE_DICT_FROM_CDN is unset — the bundled dict is used via the stock loader (unaffected by VITE_ASSET_BASE_URL alone)", async () => {
    state.isNative = false;
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com");
    vi.stubEnv("VITE_DICT_FROM_CDN", "");
    const stock = fakeBrowserDictionaryLoader.prototype.loadArrayBuffer;
    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");
    expect(fakeBrowserDictionaryLoader.prototype.loadArrayBuffer).toBe(stock);
  });

  it("IS installed on web when both VITE_DICT_FROM_CDN=\"1\" and VITE_ASSET_BASE_URL are set (2026-09-18: the CDN+cache path is no longer native-only — the default loader has no persistent cache or hash check on either platform)", async () => {
    // Explicit timeout, not the project's 20s default: this test's real
    // sha256 + DecompressionStream round-trip over the genuine ~4 MB dict
    // file (not a fixture) observably needs more headroom under the full
    // suite's machine load than the file's other, lighter-payload cases —
    // same rationale as this project's own 20s-over-5s default (see
    // vite.config.ts's curriculum project comment).
    state.isNative = false;
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com");
    vi.stubEnv("VITE_DICT_FROM_CDN", "1");
    // Explicitly no persistent-cache backend for this test (isolates the
    // fetch → verify → gunzip path from `dictCache.ts`'s Cache Storage
    // branch, which is covered separately in dictCache.test.ts /
    // dictLoader.test.ts) — `caches` is a real ambient global shared across
    // files in this project's `isolate:false` worker, so relying on
    // whatever happens to be there rather than stubbing it explicitly is
    // exactly the kind of cross-file leakage this test must not depend on.
    vi.stubGlobal("caches", undefined);
    const stock = fakeBrowserDictionaryLoader.prototype.loadArrayBuffer;

    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => realBaseDatGz(),
      url,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");

    expect(fakeBrowserDictionaryLoader.prototype.loadArrayBuffer).not.toBe(stock);

    const result = await new Promise<ArrayBuffer | null>((resolve, reject) => {
      fakeBrowserDictionaryLoader.prototype.loadArrayBuffer(
        "https://app.openlingoapp.com/dict/v1/base.dat.gz",
        (err, buf) => (err ? reject(err) : resolve(buf)),
      );
    });

    // Web uses plain `fetch`, never CapacitorHttp.
    expect(state.fetchBinaryNativeCalls).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith("https://app.openlingoapp.com/dict/v1/base.dat.gz");
    // Genuinely decompressed (matches Node's own gunzip of the same real bytes).
    expect(new Uint8Array(result!)).toEqual(new Uint8Array(gunzipSync(Buffer.from(realBaseDatGz()))));
  }, 40000);

  it("is NOT installed on native when VITE_DICT_FROM_CDN=\"1\" but no CDN base is configured (bundled dict stays reachable via the stock loader)", async () => {
    state.isNative = true;
    vi.stubEnv("VITE_ASSET_BASE_URL", "");
    vi.stubEnv("VITE_DICT_FROM_CDN", "1");
    const stock = fakeBrowserDictionaryLoader.prototype.loadArrayBuffer;
    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");
    expect(fakeBrowserDictionaryLoader.prototype.loadArrayBuffer).toBe(stock);
  });

  it("is NOT installed on native when a CDN base is configured but VITE_DICT_FROM_CDN is unset (the base alone is not a safe CDN signal — .env.native sets it for TTS)", async () => {
    state.isNative = true;
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com");
    vi.stubEnv("VITE_DICT_FROM_CDN", "");
    const stock = fakeBrowserDictionaryLoader.prototype.loadArrayBuffer;
    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");
    expect(fakeBrowserDictionaryLoader.prototype.loadArrayBuffer).toBe(stock);
  });

  it("on native WITH VITE_DICT_FROM_CDN=\"1\" and a CDN base: replaces loadArrayBuffer, which then fetches via CapacitorHttp, hash-verifies, and gunzips the result", async () => {
    state.isNative = true;
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com");
    vi.stubEnv("VITE_DICT_FROM_CDN", "1");
    const stock = fakeBrowserDictionaryLoader.prototype.loadArrayBuffer;

    // Real dict bytes, not a fabricated fixture — `dictLoader.ts` now
    // hash-verifies against `src/shared/dict/manifest.json` before
    // returning anything, so a fixture whose hash was never computed would
    // be rejected as a "hash mismatch", not round-tripped.
    state.fetchBinaryNativeImpl = async () => realBaseDatGz();

    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");

    expect(fakeBrowserDictionaryLoader.prototype.loadArrayBuffer).not.toBe(stock);

    // Invoke the replaced method directly — proves the full
    // fetch → verify → gunzip round-trip, independent of kuroshiro's own
    // (faked) init flow above.
    const result = await new Promise<ArrayBuffer | null>((resolve, reject) => {
      fakeBrowserDictionaryLoader.prototype.loadArrayBuffer(
        "https://app.openlingoapp.com/dict/v1/base.dat.gz",
        (err, buf) => (err ? reject(err) : resolve(buf)),
      );
    });
    expect(state.fetchBinaryNativeCalls).toEqual([
      "https://app.openlingoapp.com/dict/v1/base.dat.gz",
    ]);
    expect(new Uint8Array(result!)).toEqual(new Uint8Array(gunzipSync(Buffer.from(realBaseDatGz()))));
  });

  it("a CDN object with the WRONG hash (corrupted/tampered) is rejected, not served — this is the blast-radius bound on a bad CDN object", async () => {
    state.isNative = true;
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com");
    vi.stubEnv("VITE_DICT_FROM_CDN", "1");
    state.fetchBinaryNativeImpl = async () =>
      new TextEncoder().encode("not the real dictionary file").buffer;

    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛"); // installs the patch; init itself is faked

    await expect(
      new Promise<ArrayBuffer | null>((resolve, reject) => {
        fakeBrowserDictionaryLoader.prototype.loadArrayBuffer(
          "https://app.openlingoapp.com/dict/v1/base.dat.gz",
          (err, buf) => (err ? reject(err) : resolve(buf)),
        );
      }),
    ).rejects.toThrow(/hash mismatch/);
  });

  it("a fetch failure through the patched loader propagates as a callback error (falls into the SAME existing graceful-degradation path, not a crash) — the grading path with the dictionary absent/unreachable", async () => {
    state.isNative = true;
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com");
    vi.stubEnv("VITE_DICT_FROM_CDN", "1");
    state.fetchBinaryNativeImpl = async () => {
      throw new Error("simulated CDN 404 / CORS failure");
    };

    const { convertToHiragana } = await import("./kuroshiro");
    // convertToHiragana never throws — the existing degrade path returns
    // the original (folded) input and warns once. (The fake analyzer's
    // init() doesn't itself call the patched loader, so this exercises the
    // "patch installed but init still resolves via the fake" shape; the
    // previous test covers the loader's own error propagation directly via
    // its callback contract.)
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await convertToHiragana("愛");
    expect(out).toBe("愛");
    // The stub analyzer's init() never rejects, so this call path doesn't
    // warn — it only proves the patch install itself never throws even
    // when the eventual fetch would fail. Assert that explicitly instead.
    expect(warn).not.toHaveBeenCalled();

    // Now prove the loader's OWN error propagation: invoking the replaced
    // loadArrayBuffer directly must reject via the callback, not throw
    // synchronously and not hang.
    await expect(
      new Promise<ArrayBuffer | null>((resolve, reject) => {
        fakeBrowserDictionaryLoader.prototype.loadArrayBuffer(
          "https://app.openlingoapp.com/dict/v1/base.dat.gz",
          (err, buf) => (err ? reject(err) : resolve(buf)),
        );
      }),
    ).rejects.toThrow("simulated CDN 404 / CORS failure");
  });
});
