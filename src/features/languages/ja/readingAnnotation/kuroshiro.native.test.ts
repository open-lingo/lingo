/**
 * Perf review 2026-09-17 (docs/perf-2026-09-17.md §1, lane A4b/A4c) — tests
 * for `kuroshiro.ts`'s CDN-aware `DICT_PATH` resolution and the native
 * CapacitorHttp/DecompressionStream dict-loader patch.
 *
 * A4c (2026-09-17): the CDN path is gated behind TWO env vars, both
 * required — `VITE_DICT_FROM_CDN === "1"` AND `VITE_ASSET_BASE_URL` — not
 * `VITE_ASSET_BASE_URL` alone. Reason: the shipped `.env.native` sets
 * `VITE_ASSET_BASE_URL` to the TTS CDN host for an unrelated reason, so an
 * alone-check would silently switch every native install onto a network
 * fetch of the 15 MB dict with no persistent cache. Every case below is
 * parameterized over both env vars to prove the gate is a genuine AND, not
 * either var alone.
 *
 * Separate file from `kuroshiro.test.ts` because these cases need
 * `vi.resetModules()` + a dynamic re-import per test (module-level `const
 * ASSET_BASE`/`IS_NATIVE` are read once at evaluation time, so an env stub
 * only takes effect on a fresh module instance) — mixing that with the
 * existing file's static top-of-file mocks would make both harder to read.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

  it("points at the CDN base + /dict/ when both VITE_DICT_FROM_CDN=\"1\" and VITE_ASSET_BASE_URL are set", async () => {
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com");
    vi.stubEnv("VITE_DICT_FROM_CDN", "1");
    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");
    expect(state.capturedDictPath).toBe("https://app.openlingoapp.com/dict/");
  });

  it("strips a trailing slash from VITE_ASSET_BASE_URL before appending /dict/ (both env vars set)", async () => {
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com/");
    vi.stubEnv("VITE_DICT_FROM_CDN", "1");
    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");
    expect(state.capturedDictPath).toBe("https://app.openlingoapp.com/dict/");
  });
});

describe("native dict-loader patch", () => {
  // The fake analyzer (`kuroshiro-analyzer-kuromoji` mock above) never
  // itself invokes `loadArrayBuffer` — it's a stand-in for kuroshiro's own
  // init flow, not for kuromoji's dictionary loading. So "was the patch
  // installed" is checked by whether `loadArrayBuffer` was REPLACED, not by
  // whether it happened to be called — and the round-trip (job 2 below) is
  // proven by invoking the replaced function directly.

  it("is NOT installed on web even when both env vars are set (loadArrayBuffer stays the stock implementation)", async () => {
    state.isNative = false;
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com");
    vi.stubEnv("VITE_DICT_FROM_CDN", "1");
    const stock = fakeBrowserDictionaryLoader.prototype.loadArrayBuffer;
    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");
    expect(fakeBrowserDictionaryLoader.prototype.loadArrayBuffer).toBe(stock);
  });

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

  it("on native WITH VITE_DICT_FROM_CDN=\"1\" and a CDN base: replaces loadArrayBuffer, which then fetches via CapacitorHttp and gunzips the result", async () => {
    state.isNative = true;
    vi.stubEnv("VITE_ASSET_BASE_URL", "https://app.openlingoapp.com");
    vi.stubEnv("VITE_DICT_FROM_CDN", "1");
    const stock = fakeBrowserDictionaryLoader.prototype.loadArrayBuffer;

    // Real gzip bytes for a known payload, so the round-trip through the
    // patched loader's DecompressionStream call is genuinely exercised,
    // not just mocked away.
    const original = new TextEncoder().encode("kuromoji-dict-fixture");
    const gzipped = await new Response(
      new Blob([original]).stream().pipeThrough(new CompressionStream("gzip")),
    ).arrayBuffer();
    state.fetchBinaryNativeImpl = async () => gzipped;

    const { convertToHiragana } = await import("./kuroshiro");
    await convertToHiragana("愛");

    expect(fakeBrowserDictionaryLoader.prototype.loadArrayBuffer).not.toBe(stock);

    // Invoke the replaced method directly — proves the full
    // fetch → gunzip round-trip, independent of kuroshiro's own (faked)
    // init flow above.
    const result = await new Promise<ArrayBuffer | null>((resolve, reject) => {
      fakeBrowserDictionaryLoader.prototype.loadArrayBuffer(
        "https://app.openlingoapp.com/dict/base.dat.gz",
        (err, buf) => (err ? reject(err) : resolve(buf)),
      );
    });
    expect(state.fetchBinaryNativeCalls).toEqual([
      "https://app.openlingoapp.com/dict/base.dat.gz",
    ]);
    expect(new TextDecoder().decode(result!)).toBe("kuromoji-dict-fixture");
  });

  it("a fetch failure through the patched loader propagates as a callback error (falls into the SAME existing graceful-degradation path, not a crash)", async () => {
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
          "https://app.openlingoapp.com/dict/base.dat.gz",
          (err, buf) => (err ? reject(err) : resolve(buf)),
        );
      }),
    ).rejects.toThrow("simulated CDN 404 / CORS failure");
  });
});
