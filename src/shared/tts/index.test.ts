import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTtsUrl, hasTtsAudio, playJaAudio, playJaAudioToEnd } from "./index";

/** Same normalization `./manifest` applies, so these tests lock the DERIVED
 *  path (the app↔pipeline contract) without hard-coding whichever origin the
 *  build is pointed at. The committed `.env` points it at the CDN. */
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL ?? "").replace(/\/+$/, "");
const asset = (path: string) => `${ASSET_BASE}/${path}`;
const relative = (url: string | null) =>
  url === null ? null : url.slice(ASSET_BASE.length);

describe("getTtsUrl", () => {
  it("returns null for empty text", () => {
    expect(getTtsUrl("")).toBeNull();
  });

  it("returns null for unknown text", () => {
    expect(getTtsUrl("これは絶対にマニフェストに無い文字列です")).toBeNull();
  });

  it("resolves a known JA M3 phrase to a stable versioned URL", () => {
    // Locks in the client-derived path: the hash is computed from
    // `sha256("ja:こんにちは")[:16]`, so this exact value is the contract
    // between the app and the Python pipeline. If it changes, every audio
    // URL 404s.
    const url = getTtsUrl("こんにちは");
    expect(url).toBe(asset("tts/v1/ja/c34e1a1b60652761.mp3"));
  });

  it("resolves same-origin by default", () => {
    // Audio MUST stay same-origin unless someone has deliberately set an asset
    // base. `loadBuffer` fetches clips and decodes them via Web Audio, which is
    // CORS-enforced, and the CDN sends no Access-Control-Allow-Origin — so an
    // absolute base silently kills every clip on any origin but the apex, and
    // JA (which never falls back to synthesis) goes fully silent.
    //
    // Asserting the literal leading "/" is the point: deriving the expected
    // value from import.meta.env the way manifest.ts does would make this pass
    // no matter what, which is exactly the bug it exists to catch.
    if (!ASSET_BASE) {
      expect(getTtsUrl("こんにちは")).toBe("/tts/v1/ja/c34e1a1b60652761.mp3");
    } else {
      expect(getTtsUrl("こんにちは")).toBe(
        `${ASSET_BASE}/tts/v1/ja/c34e1a1b60652761.mp3`,
      );
    }
  });

  it("defaults lang to ja", () => {
    expect(getTtsUrl("こんにちは")).toBe(getTtsUrl("こんにちは", "ja"));
  });

  it("returns null for the same text under a different lang", () => {
    // Each language has its own manifest and the hash is salted by the lang
    // prefix, so a KO lookup for JA text must miss rather than resolve to
    // the JA recording.
    expect(getTtsUrl("こんにちは", "ko")).toBeNull();
  });

  it("falls back to the ±。 variant when the exact key is missing", () => {
    // Phrase-level keys in the manifest sometimes include the sentence
    // terminator and sometimes don't; the resolver tries both.
    const withDot = getTtsUrl("はい。");
    const withoutDot = getTtsUrl("はい");
    expect(withoutDot).not.toBeNull();
    // At least one form should resolve; if both forms resolve they may
    // differ (different recordings), but both must be versioned ja paths.
    const shape = /^\/tts\/v1\/ja\/[0-9a-f]{16}\.mp3$/;
    if (withDot) expect(relative(withDot)).toMatch(shape);
    expect(relative(withoutDot)).toMatch(shape);
  });
});

describe("katakana single-glyph fallback", () => {
  it("resolves a lone katakana glyph via its hiragana twin", () => {
    // The pipeline only generated per-glyph clips for hiragana; ア must
    // resolve to the same recording as あ (sound-identical scripts).
    expect(getTtsUrl("あ")).not.toBeNull();
    expect(getTtsUrl("ア")).toBe(getTtsUrl("あ"));
    expect(getTtsUrl("ン")).toBe(getTtsUrl("ん"));
  });

  it("does NOT fall back for multi-char katakana words", () => {
    // A loanword missing from the manifest must miss loudly (so the TTS
    // emit/generate pass catches it), not play a hiragana conversion.
    expect(getTtsUrl("ネクタイタイプライター")).toBeNull();
  });

  it("does not apply the fallback outside ja", () => {
    expect(getTtsUrl("ア", "ko")).toBeNull();
  });
});

describe("hasTtsAudio", () => {
  it("is true iff getTtsUrl returns non-null", () => {
    expect(hasTtsAudio("こんにちは")).toBe(true);
    expect(hasTtsAudio("")).toBe(false);
    expect(hasTtsAudio("これは絶対にマニフェストに無い文字列です")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CDN-failure degradation.
//
// Audio is fetched from the CDN now, so "the manifest has this clip" no longer
// implies "the bytes arrived": offline dev, a blocked request, or a bad edge
// response all land in loadBuffer's catch. Non-JA must degrade to the browser
// voice rather than going silent; JA must STAY silent (complete recorded
// corpus — a JA miss means new content, not a robotic voice mid-lesson).
// ---------------------------------------------------------------------------

type Spoken = { text: string; lang: string };

function installSynthStub(): Spoken[] {
  const spoken: Spoken[] = [];

  class FakeUtterance {
    lang = "";
    volume = 1;
    voice: unknown = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
  }

  const synth = {
    // Non-empty so `speakViaSynthesis` skips the async `voiceschanged` wait
    // and speaks synchronously — keeps the assertions deterministic.
    getVoices: () => [{ lang: "ko-KR", name: "fake-ko" }],
    cancel: vi.fn(),
    speak: (u: FakeUtterance) => {
      spoken.push({ text: u.text, lang: u.lang });
      // Real engines fire `end` asynchronously, after the caller has had a
      // chance to attach its handler. Firing it inline would let
      // `playJaAudioToEnd` fall through to its 2s safety timeout and hide
      // whether the onend path actually resolves the promise.
      queueMicrotask(() => u.onend?.());
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  vi.stubGlobal("speechSynthesis", synth);
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  return spoken;
}

/** Minimal AudioContext so `loadBuffer` gets past its `getContext()` guard and
 *  actually reaches the fetch — happy-dom ships no Web Audio. */
function installAudioContextStub(): void {
  class FakeAudioContext {
    state = "running";
    destination = {};
    resume = () => Promise.resolve();
    createGain = () => ({ gain: { value: 1 }, connect: () => {} });
    createBufferSource = () => ({
      buffer: null,
      playbackRate: { value: 1 },
      detune: { value: 0 },
      connect: () => {},
      start: () => {},
      stop: () => {},
      addEventListener: () => {},
      onended: null,
    });
    decodeAudioData = () => Promise.reject(new Error("unreachable in these tests"));
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);
}

describe("CDN failure falls back to speech synthesis", () => {
  let spoken: Spoken[];
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    spoken = installSynthStub();
    installAudioContextStub();
    // Every clip fetch fails, as if the CDN were unreachable.
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    vi.unstubAllGlobals();
  });

  it("speaks a KO clip whose fetch failed", async () => {
    // The manifest HAS this clip — the failure is transport, not coverage.
    expect(getTtsUrl("안녕하세요", "ko")).not.toBeNull();
    await playJaAudio("안녕하세요", "ko");
    expect(spoken).toEqual([{ text: "안녕하세요", lang: "ko-KR" }]);
  });

  it("stays silent for JA when the fetch fails", async () => {
    expect(getTtsUrl("こんにちは", "ja")).not.toBeNull();
    await playJaAudio("こんにちは", "ja");
    expect(spoken).toEqual([]);
  });

  it("playJaAudioToEnd resolves via synthesis instead of hanging (KO)", async () => {
    await playJaAudioToEnd("감사합니다", "ko");
    expect(spoken).toEqual([{ text: "감사합니다", lang: "ko-KR" }]);
  });

  it("playJaAudioToEnd stays silent for JA and still resolves", async () => {
    await playJaAudioToEnd("こんにちは", "ja");
    expect(spoken).toEqual([]);
  });

  it("treats a non-2xx CDN response as a failure, not audio", async () => {
    // A 403/404 from CloudFront resolves the fetch — without an `ok` check the
    // error page would be handed to decodeAudioData and the call would die
    // silently instead of degrading.
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response("<Error>AccessDenied</Error>", { status: 403 }),
        ),
      ),
    );
    await playJaAudio("물", "ko");
    expect(spoken).toEqual([{ text: "물", lang: "ko-KR" }]);
  });
});
