import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { collectAudioTexts, prefetchTtsTexts } from "./prefetch";
import { getTtsUrl, isTtsAudioReady, playJaAudio } from "./index";

/** Minimal AudioContext so loadBuffer reaches the fetch and can "decode". */
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
    // Stand-in for a decoded clip.
    decodeAudioData = () => Promise.resolve({ duration: 1.5 } as AudioBuffer);
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);
}

describe("collectAudioTexts", () => {
  it("finds spoken text at any nesting depth", () => {
    const steps = [
      { id: "a", type: "phrase_card", audioText: "こんにちは" },
      {
        id: "b",
        type: "dialogue_listen",
        lines: [{ speaker: "Tom", transcript: "はい" }, { speaker: "Mika", transcript: "いいえ" }],
      },
      { id: "c", nested: { deeper: { promptAudioText: "みず" } } },
    ];
    expect(collectAudioTexts(steps).sort()).toEqual(
      ["いいえ", "こんにちは", "はい", "みず"].sort(),
    );
  });

  it("collects spoken text from fields no allow-list would have named", () => {
    // REGRESSION (2026-07-29). The first version of collectAudioTexts used a
    // four-name allow-list copied from audioCoverage.test.ts — audioKey,
    // audioText, transcript, promptAudioText. The step views actually resolve
    // audio from a dozen more, so most lessons prefetched nothing and every
    // clip still loaded on play. These field names are all real call sites
    // (SpeakingStepView, BuildSentenceStepView, GrammarRuleStepView,
    // MatchPairsStepView, SymbolIntroStepView) and none is in that old list.
    const steps = [
      { type: "speaking", targetPhrase: "こんにちは" },
      { type: "build_sentence", targetSentence: "すし" },
      { type: "grammar_rule", examples: [{ ja: "みず" }] },
      { type: "match_pairs", pairs: [{ source: "おちゃ" }] },
      { type: "symbol_intro", payload: { symbol: "あ" } },
    ];
    const got = collectAudioTexts(steps, "ja");
    for (const expected of ["こんにちは", "すし", "みず", "おちゃ", "あ"]) {
      expect(got, `missing ${expected}`).toContain(expected);
    }
  });

  it("ignores strings the manifest has no clip for", () => {
    // Resolution is the filter, so prose and identifiers cost nothing.
    const steps = [
      { id: "ja-m4-neo-1-vmcq", title: "Some English lesson title" },
      { explanation: "A long English explanation that is never spoken aloud." },
      { audioText: "こんにちは" },
    ];
    expect(collectAudioTexts(steps, "ja")).toEqual(["こんにちは"]);
  });

  it("dedupes repeats", () => {
    const steps = [{ audioText: "すし" }, { transcript: "すし" }, { audioText: "すし" }];
    expect(collectAudioTexts(steps)).toEqual(["すし"]);
  });

  it("skips already-resolved paths and URLs", () => {
    // audioKey is sometimes a built URL rather than a manifest key; passing one
    // to getTtsUrl would just miss, and prefetching it is meaningless.
    const steps = [
      { audioKey: "/tts/v1/ja/c34e1a1b60652761.mp3" },
      { audioKey: "https://cdn.example.com/x.mp3" },
      { audioKey: "おちゃ" },
    ];
    expect(collectAudioTexts(steps)).toEqual(["おちゃ"]);
  });

  it("tolerates null, primitives and empty structures", () => {
    expect(collectAudioTexts(null)).toEqual([]);
    expect(collectAudioTexts(undefined)).toEqual([]);
    expect(collectAudioTexts("nope")).toEqual([]);
    expect(collectAudioTexts([])).toEqual([]);
    expect(collectAudioTexts([{ audioText: "" }])).toEqual([]);
  });
});

describe("prefetchTtsTexts", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    installAudioContextStub();
    fetchMock = vi.fn(() =>
      Promise.resolve(new Response(new ArrayBuffer(64), { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("makes a later play a cache hit instead of a fetch", async () => {
    const text = "こんにちは";
    expect(getTtsUrl(text)).not.toBeNull();

    const { attempted, ready } = await prefetchTtsTexts([text]);
    expect({ attempted, ready }).toEqual({ attempted: 1, ready: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(isTtsAudioReady(text)).toBe(true);

    // The whole point: playing costs no additional network request.
    fetchMock.mockClear();
    await playJaAudio(text);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("counts unknown text as attempted but not ready, without fetching", async () => {
    const { attempted, ready } = await prefetchTtsTexts([
      "この文は絶対にマニフェストに存在しません",
    ]);
    expect({ attempted, ready }).toEqual({ attempted: 1, ready: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("swallows fetch failures — a prefetch miss is never an error", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("offline"))));
    await expect(prefetchTtsTexts(["ありがとう"])).resolves.toMatchObject({
      attempted: 1,
    });
  });

  it("stops early when aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const { attempted } = await prefetchTtsTexts(["こんにちは", "すし"], undefined, controller.signal);
    expect(attempted).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("handles an empty list without spawning workers", async () => {
    await expect(prefetchTtsTexts([])).resolves.toEqual({ attempted: 0, ready: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
